"""证据瘦身（治死锁）+ 撞锁报错给上下文（治误导）。

## 事故（2026-11-16 12:00）

定时轮失败：`本轮证据较多（超出预算 10236 字符）…请由宿主分批处理`。
同时飞哥在工作台点「生长一次」看到「已有年轮操作正在运行」——
两件事叠在一起，形成「年轮老是执行不了」的体感。

## ① 瘦身：不瘦会自我循环失败

量出来的问题（真实轮）：`prompt_evidence` 全量 **54.7 万字符**，其中
`tables.milestones` 独占 **32.9 万**——235 条里程碑带着 `table_url`（每条
重复一个长链接）、`notes`、附件这些**装饰性字段**。模型判断「本轮发生了
什么」根本不需要它们。

死锁机理：**本轮失败 → 水位不前进 → 下一轮窗口更长、来源更多 →
必然再次超预算**。失败自己养活自己，不降体积调多少次预算都没用。

裁的是装饰字段，**title/status/date/r_owner/project_ids 全部保留**（对接人
默认取 R、准入判断挂里程碑都依赖这些）。实测 50 来源的最重轮
310,236 → 290,462，进预算。

## ② 撞锁报错：「不是故障，是保护，等它跑完」

原报错「已有年轮操作正在运行，请稍后重试」——用户读不出这是
12:00 定时轮还在跑、还是真的卡死，只能反复猛点。现在读 active.json 告诉
「哪一轮、进行到哪一步（采集/检索记忆/写表格/生成报告）」，并明说
**这是防止重复写入的保护**。

教训(76)：**报错要回答「我该等还是该动手」**。安全设计如果只表现为
「又失败了」，用户就会把它当成 bug 反复触发。
教训(77)：失败会让水位停住、下一轮更大——**「重试就坏」的容量问题，
要往「为什么会越来越大」查，而不是把预算调高。**
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow
import growth as g
import nianlun as n

ROOT = Path(__file__).resolve().parent


class SlimEvidenceTests(unittest.TestCase):
    def bundle(self):
        # 仿真实形态：里程碑带 table_url / 长 notes / 附件（装饰字段）
        return {
            'run_id': 'r', 'binding': 'x',
            'sources': [{'id': f's{i}', 'ref': f'S{i}', 'name': '群',
                         'text': '内容' * 120, 'time': '2026-11-16', 'channels': ['groups']}
                        for i in range(3)],
            'tables': {
                'projects': [{'id': 'P1', 'title': '甲', 'project_ids': [],
                              'description': '项目描述' * 40, 'table_url': 'https://x/' + 'a' * 60,
                              'raw_cells': {}}],
                'milestones': [{'id': f'M{i}', 'ref': f'm{i}', 'title': f'里程碑{i}',
                                'project_ids': ['P1'], 'status': '待核', 'date': '2026-12-01',
                                'r_owner': "[{'userId':'u1'}]",
                                'notes': '备注' * 200, 'description': '交付' * 150,
                                'table_url': 'https://x/' + 'b' * 60,
                                'attachments': [{'name': 'f.png'}], 'raw_cells': {}}
                               for i in range(120)],
                'sites': [], 'records': [], 'todos': [], 'coverage': [], 'identity': {}},
            'todos': [], 'coverage': [], 'identity': {}}

    def measure(self, bundle):
        pe = flow.prompt_evidence(json.loads(json.dumps(bundle)))
        return len(json.dumps(pe, ensure_ascii=False))

    def test_slimming_reduces_size_hard(self):
        size = self.measure(self.bundle())
        # 装饰字段被裁后不应爆炸（每表 URL 60+字、notes 400字 × 120 条）
        self.assertLess(size, 90_000)

    def test_decorative_fields_dropped(self):
        pe = flow.prompt_evidence(self.bundle())
        m = pe['tables']['milestones'][0]
        self.assertNotIn('table_url', m)
        self.assertNotIn('attachments', m)
        self.assertNotIn('raw_cells', m)

    def test_decision_fields_survive(self):
        """准入判断（挂里程碑）、对接人默认（取 R）都依赖这些字段，不能裁掉。"""
        pe = flow.prompt_evidence(self.bundle())
        m = pe['tables']['milestones'][0]
        for key in ('title', 'status', 'date', 'project_ids', 'r_owner', 'ref'):
            self.assertIn(key, m, key)

    def test_long_text_folded_with_marker(self):
        pe = flow.prompt_evidence(self.bundle())
        self.assertTrue(pe['tables']['milestones'][0]['notes'].endswith('…'))
        self.assertLess(len(pe['tables']['milestones'][0]['notes']), 120)

    def test_slim_is_deterministic(self):
        """两次瘦身结果字节级一致——fresh==plan 比对依赖这点。"""
        self.assertEqual(self.measure(self.bundle()), self.measure(self.bundle()))

    def test_does_not_mutate_bundle(self):
        b = self.bundle()
        before = json.dumps(b, sort_keys=True)
        flow.prompt_evidence(b)
        self.assertEqual(json.dumps(b, sort_keys=True), before)


class LockHintTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def test_hint_names_run_and_step(self):
        run = self.tmp / 'runs' / '20261116-120005-abc'
        run.mkdir(parents=True)
        (run / 'postprocess.json').write_text('{}')
        (self.tmp / 'active.json').write_text(
            json.dumps({'run_id': '20261116-120005-abc', 'run_dir': str(run)}))
        hint = g._lock_holder_hint(self.tmp)
        self.assertIn('20261116-120005', hint)
        self.assertIn('正在生成报告与记忆', hint)
        self.assertIn('不是故障', hint)

    def test_no_active_returns_empty(self):
        self.assertEqual(g._lock_holder_hint(self.tmp), '')

    def test_broken_active_never_raises(self):
        (self.tmp / 'active.json').write_text('{坏 json')
        self.assertIsInstance(g._lock_holder_hint(self.tmp), str)

    def test_locked_wraps_hint_into_error(self):
        config = {'growth': {'state_dir': str(self.tmp)}}
        other = self.tmp / 'growth.lock'
        other.write_text('0')
        import fcntl
        fh = open(other, 'a+b')
        fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            run = self.tmp / 'runs' / 'r9'; run.mkdir(parents=True)
            (run / 'decision.json').write_text('{}')
            (self.tmp / 'active.json').write_text(
                json.dumps({'run_id': 'r9', 'run_dir': str(run)}))
            with self.assertRaises(n.Error) as ctx:
                with g.locked(config):
                    pass
            msg = str(ctx.exception)
            self.assertIn('已有年轮操作正在运行', msg)
            self.assertIn('决策已生成', msg)
            self.assertIn('定时轮会自动继续', msg)
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)
            fh.close()


if __name__ == '__main__':
    unittest.main()
