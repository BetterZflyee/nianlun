"""dsh 会话被历史轮次带偏 → 返回不合契约时自动弃会话重问一次。

## 事故（2026-11-16 下午，三连轮）

14:00 起连续三轮报同一个错：`$ 缺少必填内容`。查 harness-decision 的原始返回：

  - 14:35 轮 queries 阶段返回了 **decision 的契约**（别的阶段的键）
  - 15:00 轮返回的是**上一轮的 run_id**（20261116-143601 出现在 15:005 轮的回答里）
  - 14:00 轮模型把 actions 写成了 actions_json 字符串塞进别处

年轮共用一个 dsh headless 会话（设计如此，保留上下文）。会话累积到 694 回合后，
模型开始「顺着上一轮的回答续写」而不是按本轮提示词作答——上下文污染。
手动清除 session 后，15:36 轮的 decision **一次通过校验并写入 4 条记录**，实锤。

## 修复语义

- 返回值不合 schema、且本轮用的是**复用的旧会话** → 清掉会话重问一次
- 推理是纯读操作，重跑不产生业务写入，安全（区别于写入绝不重试）
- 重跑仍不合契约 → 抛出错误（此时是模型真不会，不是会话脏）
- 没传 schema 或本来就没存会话 → 行为与旧版完全一致

教训(79)：**长会话是隐式状态**。任何「沿用同一会话」的设计，都要给
「返回不符合契约」留一条弃会话重来的自愈路——否则会话越用越脏、
每轮都失败、还查不出代码错在哪。
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness
import nianlun as n

SCHEMA = {'type': 'object', 'properties': {
    'run_id': {'type': 'string'}, 'actions': {'type': 'array'}},
    'required': ['run_id', 'actions'], 'additionalProperties': False}


class DeepseekCleanTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = str(Path(self.tmp) / 'config.json')
        Path(self.cfg).write_text(json.dumps({'growth': {'state_dir': self.tmp}}))

    def choice(self):
        return {'provider': 'deepseek', 'mode': 'cli', 'binary': '/bin/true',
                'config_path': self.cfg}

    def seed_session(self, sid='session-old'):
        harness.harness_session(self.cfg, 'deepseek', sid)

    def session(self):
        return harness.harness_session(self.cfg, 'deepseek')

    def test_matching_output_keeps_session(self):
        self.seed_session()
        good = {'run_id': 'r1', 'actions': []}
        with mock.patch.object(harness, 'deepseek_reason', return_value=good) as dr:
            out = harness.deepseek_clean('p', Path(self.tmp) / 'd', self.choice(), SCHEMA, 5)
        self.assertEqual(out, good)
        dr.assert_called_once()
        self.assertEqual(self.session(), 'session-old', '合契约不许动会话')

    def test_contaminated_output_clears_and_retries_once(self):
        """第一次返回缺键（上一轮形态）→ 清会话重问 → 用重跑结果。"""
        self.seed_session()
        bad = {'run_id': '上一轮', 'queries': ['脏']}        # 缺 actions，且键不合规
        good = {'run_id': 'r1', 'actions': []}
        with mock.patch.object(harness, 'deepseek_reason',
                               side_effect=[bad, good]) as dr:
            out = harness.deepseek_clean('p', Path(self.tmp) / 'd', self.choice(), SCHEMA, 5)
        self.assertEqual(out, good)
        self.assertEqual(dr.call_count, 2)
        self.assertIsNone(self.session(), '污染会话必须被清掉')

    def test_retry_still_bad_raises(self):
        self.seed_session()
        bad = {'run_id': 'r'}                               # 缺 actions
        with mock.patch.object(harness, 'deepseek_reason', side_effect=[bad, bad]):
            with self.assertRaises(n.Error):
                harness.deepseek_clean('p', Path(self.tmp) / 'd', self.choice(), SCHEMA, 5)

    def test_reason_failure_on_retry_reports_original(self):
        """重跑连推理都崩（网络断）→ 抛第一轮的契约错，别把真凶换成次生错误。"""
        self.seed_session()
        bad = {'run_id': 'r'}
        with mock.patch.object(harness, 'deepseek_reason',
                               side_effect=[bad, n.Error('DWS 断连')]):
            with self.assertRaises(n.Error) as ctx:
                harness.deepseek_clean('p', Path(self.tmp) / 'd', self.choice(), SCHEMA, 5)
            self.assertIn('缺少必填内容', str(ctx.exception))

    def test_no_schema_passes_through(self):
        self.seed_session()
        with mock.patch.object(harness, 'deepseek_reason', return_value='自由文本'):
            out = harness.deepseek_clean('p', Path(self.tmp) / 'd', self.choice(), None, 5)
        self.assertEqual(out, '自由文本')
        self.assertEqual(self.session(), 'session-old')

    def test_first_run_no_session_never_retries(self):
        """还没存过会话=本来就是新会话，没有「更干净」可换：只推理一次，
        不合契约交给外层 reason() 的 validate 抛错（分层职责：clean 只管会话自愈）。"""
        with mock.patch.object(harness, 'deepseek_reason',
                               return_value={'run_id': 'r'}) as dr:
            out = harness.deepseek_clean('p', Path(self.tmp) / 'd', self.choice(), SCHEMA, 5)
        self.assertEqual(dr.call_count, 1, '无旧会话时不得触发重问')
        self.assertEqual(out, {'run_id': 'r'})
        # 外层 reason() 的 validate 才是最终抛错的地方
        import host_bridge
        with self.assertRaises(n.Error):
            host_bridge.validate(out, SCHEMA)


class ReasonRoutingTests(unittest.TestCase):
    def test_reason_routes_through_clean(self):
        # __file__ 定位：unittest discover 工作目录在仓库根（老坑第 N 次）
        src = (Path(__file__).resolve().parent / 'harness.py').read_text(encoding='utf-8')
        self.assertIn("value=deepseek_clean(prompt,directory,choice,schema,timeout)", src)


if __name__ == '__main__':
    unittest.main()
