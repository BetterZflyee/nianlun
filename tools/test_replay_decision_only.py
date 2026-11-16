"""replay decision-only：拿旧证据问模型同一道题，但不碰现场。

## 这个入口为什么存在

P0-4 修的是 `collect()` 的采集阶段，`tools/replay.py` 原来的 `run/diff/matrix`
三个子命令都只做「证据 → 提示词 → 校验 → 计划」，**不调模型**，所以验证不了
「模型还会不会提动作」这件事。

`decision-only` 补的就是这一格：重建提示词 → **真调一次模型** → 落 decision。

## 这个文件守的四条线（比功能本身重要）

1. **绝不写回原 run**。原 run 是今天的证据现场，一旦被覆盖就再也证明不了
   「12:20 那轮本来会怎样」。输出必须是新目录。
2. **绝不重试**。本工具要的是「模型第一反应会提什么」，重试会把结论搅浑，
   而且每次都花额度。
3. **绝不碰 checkpoint / seen / plan / receipt**。只调推理，不执行写入。
4. **结论如实**：花了一次额度，就要明确告诉使用者「这不证明采集侧生效，
   也不证明真实一轮会怎样」——否则就是今天躲开的那个假绿灯换个位置。
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(ROOT / 'nianlun' / 'scripts'))

import replay  # noqa: E402
import nianlun as n  # noqa: E402


def fake_config():
    """最小可用配置：decision_only 只用到 growth.switches。"""
    return {
        'base_id': 'BASE',
        'growth': {'state_dir': '/tmp/does-not-matter',
                   'switches': {'table_writes': True, 'todos': True,
                                'completion': True}},
        'tables': {},
    }


def fake_bundle():
    return {
        'run_id': 'fixture',
        'since': '2026-11-16T12:00:00+08:00',
        'until': '2026-11-16T14:00:00+08:00',
        'binding': 'old-binding',
        'coverage': [],
        'sources': [{'id': 'S1', 'ref': 'S1', 'name': '来源一',
                     'text': '某件事已经完成', 'channels': ['groups']}],
        'tables': {'projects': [], 'records': [], 'milestones': [],
                   'sites': [], 'fields': {}, 'complete': True},
        'todos': [],
        'todo_links': {},
        'identity': {'user_id': 'U1'},
    }


class DecisionOnlyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.run_dir = Path(self.tmp.name) / 'runs' / '20261116-122020-fixture'
        self.run_dir.mkdir(parents=True)
        n.save(self.run_dir / 'evidence.json', fake_bundle())
        # 现场指纹：跑完之后这些文件必须一模一样
        self.before = self._fingerprint()

    def _fingerprint(self):
        out = {}
        for p in sorted(self.run_dir.rglob('*')):
            if p.is_file():
                out[str(p.relative_to(self.run_dir))] = (p.stat().st_size,
                                                         p.read_text(encoding='utf-8', errors='replace'))
        return out

    def _answer(self, actions):
        return {'summary': '测试用总结', 'pending': [], 'deferred_source_ids': [],
                'actions_json': json.dumps(actions, ensure_ascii=False)}

    def test_does_not_touch_the_original_run(self):
        """核心安全线：原 run 目录一个字节都不能变。

        原 run 是证据现场。一旦被覆盖，「这轮本来会怎样」就永远查不清了——
        今天 12:20 那批现场正是靠它才复盘出来的。
        """
        answer = self._answer([{'op': 'create_record', 'ref': 'r1',
                                'project': '甲项目', 'source_id': 'S1',
                                'quote': '某件事已经完成', 'title': '某事已完成',
                                'description': '描述', 'date': '2026-11-16',
                                'kind': '沟通要点'}])
        with patch('harness.reason', return_value=answer):
            ok, result = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok, result)
        self.assertEqual(self._fingerprint(), self.before,
                         '原 run 目录被写过了——这是绝对不能发生的')

    def test_default_output_is_outside_the_run_directory(self):
        """默认输出**不许**落在原 run 里面。

        第一版就栽在这：默认写到 `<run>/replay-decision-<时间戳>`，
        虽然没改原文件，但现场目录多出一个子目录，等于污染证据现场。
        \`test_does_not_touch_the_original_run\` 把它抓出来了。
        """
        with patch('harness.reason', return_value=self._answer([])):
            ok, result = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok, result)
        out = Path(result['out']).resolve()
        self.assertNotIn(self.run_dir.resolve(), out.parents,
                         '输出目录不能落在原 run 里面')
        self.assertNotEqual(out, self.run_dir.resolve())

    def test_writes_into_a_new_directory(self):
        answer = self._answer([])
        with patch('harness.reason', return_value=answer):
            ok, result = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok, result)
        out = Path(result['out'])
        self.assertTrue(out.is_dir())
        self.assertNotEqual(out, self.run_dir)
        self.assertTrue((out / 'decision.json').exists(), '决策必须落盘，便于复看')
        self.assertTrue((out / 'prompt.json').exists(), '提示词规模要留档')

    def test_refuses_to_overwrite_existing_output(self):
        """输出目录已存在就拒绝——否则第二次跑会覆盖第一次的结论。"""
        out = Path(self.tmp.name) / 'already-there'
        out.mkdir()
        with patch('harness.reason', return_value=self._answer([])):
            ok, result = replay.decision_only(fake_config(), self.run_dir, out=str(out))
        self.assertFalse(ok)
        self.assertIn('拒绝覆盖', result['error'])

    def test_refuses_output_equal_to_run_dir(self):
        """输出目录 == 原 run 时必须拒绝。"""
        with patch('harness.reason', return_value=self._answer([])):
            ok, result = replay.decision_only(fake_config(), self.run_dir,
                                              out=str(self.run_dir))
        self.assertFalse(ok)
        self.assertIn('不能是原 run 目录', result['error'])

    def test_calls_model_exactly_once(self):
        """只调一次：每次调用都花额度，重试还会把结论搅浑。"""
        with patch('harness.reason', return_value=self._answer([])) as reason:
            ok, _ = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok)
        self.assertEqual(reason.call_count, 1, '花了一次额度就该只调一次')

    def test_reports_complete_todo_count(self):
        """直接回答那个业务问题：这轮还会不会提 complete_todo。"""
        answer = self._answer([
            {'op': 'complete_todo', 'task_id': 'T1', 'match': 'unique',
             'completion': 'explicit', 'expected_title': '[甲项目] 某待办',
             'record_ids': ['R1'], 'source_id': 'S1', 'quote': '某件事已经完成'},
        ])
        with patch('harness.reason', return_value=answer):
            ok, result = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok)
        self.assertEqual(result['complete_todo'], 1)
        self.assertEqual(result['ops'].get('complete_todo'), 1)

    def test_validate_failure_does_not_abort(self):
        """校验被拒只记录结论，不中断——本工具的目的是看结论，不是执行。"""
        answer = self._answer([{'op': 'create_record', 'project': '不存在的项目',
                                'source_id': 'S1', 'quote': '某件事已经完成',
                                'title': 'x', 'description': 'y',
                                'date': '2026-11-16', 'kind': '沟通要点'}])
        with patch('harness.reason', return_value=answer):
            ok, result = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok, '校验被拒不该让整个重放失败')
        self.assertFalse(result['validate']['ok'])
        self.assertIn('error', result['validate'])

    def test_rebinds_evidence_by_default(self):
        """默认用今天的配置重算 binding：否则表结构一改，历史证据必然过不了校验。"""
        with patch('harness.reason', return_value=self._answer([])):
            ok, result = replay.decision_only(fake_config(), self.run_dir)
        self.assertTrue(ok)
        saved = n.load(Path(result['out']) / 'evidence.json')
        self.assertEqual(saved['binding'], n.digest(fake_config()))
        self.assertNotEqual(saved['binding'], 'old-binding')

    def test_explains_what_it_cannot_prove(self):
        """工具里必须写清「它证明不了什么」，否则又是假绿灯。"""
        src = (ROOT / 'tools' / 'replay.py').read_text(encoding='utf-8')
        self.assertIn('不证明采集侧改动生效', src)
        self.assertIn('check_source_shape', src)


if __name__ == '__main__':
    unittest.main()
