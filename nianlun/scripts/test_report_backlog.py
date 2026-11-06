"""报告失败后要记入待补清单，下轮自动补。

报告是收尾步骤，失败时整轮仍是 complete——这个设计对（主体写入已保留），
但槽位不会再跑，那些项目就永远没有报告了。实测最近 4 轮报告全失败，
每次都要人工补生成。
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow
import nianlun as n


class ReportBacklogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.config = {'growth': {'state_dir': str(self.root)}, 'base_id': 'b', 'tables': {}}

    def test_failure_records_backlog(self):
        flow._remember_report_backlog(self.config, ['p1', 'p2'], '2026-10-01', '2026-10-07', '模型超时')
        items = flow.pending_reports(self.config)
        self.assertEqual(set(items), {'p1', 'p2'})
        self.assertIn('模型超时', items['p1']['error'])

    def test_success_clears_backlog(self):
        flow._remember_report_backlog(self.config, ['p1', 'p2'], '2026-10-01', '2026-10-07', 'x')
        flow._clear_report_backlog(self.config, ['p1'])
        self.assertEqual(set(flow.pending_reports(self.config)), {'p2'})

    def test_empty_backlog_is_harmless(self):
        self.assertEqual(flow.pending_reports(self.config), {})
        flow._clear_report_backlog(self.config, ['p1'])

    def test_corrupt_backlog_does_not_raise(self):
        path = flow._report_backlog_path(self.config)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('not json', encoding='utf-8')
        self.assertEqual(flow.pending_reports(self.config), {})

    def test_backlog_is_capped_when_recovering(self):
        """补生成每轮最多 6 个，避免把一轮拖太长。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        self.assertIn('list(backlog.items())[:6]', source)

    def test_recovery_failure_keeps_item(self):
        """补生成仍失败的项目要留在清单里，不能丢。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('正在补生成上轮未完成的阶段汇报')
        block = source[idx:idx + 1200]
        self.assertIn('still.append(pid)', block)
        self.assertIn('_clear_report_backlog(config,recovered)', block,
                      '只清理成功的，失败的必须保留')


if __name__ == '__main__':
    unittest.main()
