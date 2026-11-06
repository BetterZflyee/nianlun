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

    def test_corrupt_backlog_does_not_block_recording(self):
        """清单损坏时，记录动作本身也不能抛错——它只是补救措施。"""
        path = flow._report_backlog_path(self.config)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('{invalid', encoding='utf-8')
        flow._remember_report_backlog(self.config, ['p1'], 's', 'u', 'err')
        self.assertEqual(set(flow.pending_reports(self.config)), {'p1'})

    def test_non_dict_backlog_is_tolerated(self):
        """文件里是合法 JSON 但不是对象时，也要能恢复。"""
        path = flow._report_backlog_path(self.config)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('[1,2,3]', encoding='utf-8')
        flow._remember_report_backlog(self.config, ['p1'], 's', 'u', 'err')
        self.assertEqual(set(flow.pending_reports(self.config)), {'p1'})


    def test_recovered_projects_are_excluded_from_normal_run(self):
        """补过的项目不能再被正常生成跑一遍，那是同一目录的重复消耗。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('recovered,still=recover_reports(')
        block = source[idx:idx + 900]
        self.assertIn('active_project_ids=[x for x in active_project_ids if x not in recovered]', block)


class RecoverReportsTests(unittest.TestCase):
    """行为测试：真的驱动补生成流程，而不只是检查源码里有没有那行字。"""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.config = {'growth': {'state_dir': str(self.root)}, 'base_id': 'b', 'tables': {}}
        self.calls = []
        self.progress = []

    def fake_report(self, succeed_for=('p1',), raise_for=()):
        def inner(config, ids, since, until, binary, request_dir=None, writeback=False):
            pid = ids[0]
            self.calls.append({'pid': pid, 'since': since, 'until': until,
                               'request_dir': str(request_dir), 'writeback': writeback})
            if pid in raise_for:
                raise RuntimeError('模型超时')
            return ([{'project_id': pid}] if pid in succeed_for else []), []
        return inner

    def test_successful_recovery_is_removed_from_backlog(self):
        flow._remember_report_backlog(self.config, ['p1'], '2026-10-01', '2026-10-07', 'err')
        with patch.object(flow, 'report_projects', self.fake_report({'p1'})):
            recovered, still = flow.recover_reports(
                self.config, flow.pending_reports(self.config), None, self.root / 'reports',
                False, self.progress.append)
        self.assertEqual(recovered, ['p1'])
        self.assertEqual(still, [])
        self.assertEqual(flow.pending_reports(self.config), {})

    def test_failed_recovery_stays_in_backlog(self):
        flow._remember_report_backlog(self.config, ['p1'], '2026-10-01', '2026-10-07', 'err')
        with patch.object(flow, 'report_projects', self.fake_report(set())):
            recovered, still = flow.recover_reports(
                self.config, flow.pending_reports(self.config), None, self.root / 'reports',
                False, self.progress.append)
        self.assertEqual(recovered, [])
        self.assertEqual(still, ['p1'])
        self.assertEqual(set(flow.pending_reports(self.config)), {'p1'})

    def test_exception_does_not_abort_other_projects(self):
        flow._remember_report_backlog(self.config, ['bad', 'good'], '2026-10-01', '2026-10-07', 'e')
        with patch.object(flow, 'report_projects', self.fake_report({'good'}, raise_for={'bad'})):
            recovered, still = flow.recover_reports(
                self.config, flow.pending_reports(self.config), None, self.root / 'reports',
                False, self.progress.append)
        self.assertEqual(recovered, ['good'])
        self.assertEqual(still, ['bad'])
        self.assertTrue(any('补生成仍失败' in m for m in self.progress), '失败要有进度提示')

    def test_passes_stored_date_range_to_report(self):
        """补生成必须用当初失败时的日期区间，不能用今天的。"""
        flow._remember_report_backlog(self.config, ['p1'], '2026-10-01', '2026-10-07', 'err')
        with patch.object(flow, 'report_projects', self.fake_report({'p1'})):
            flow.recover_reports(self.config, flow.pending_reports(self.config), None,
                                 self.root / 'reports', False, self.progress.append)
        self.assertEqual(self.calls[0]['since'], '2026-10-01')
        self.assertEqual(self.calls[0]['until'], '2026-10-07')

    def test_respects_limit(self):
        ids = [f'p{i}' for i in range(10)]
        for pid in ids:
            flow._remember_report_backlog(self.config, [pid], 's', 'u', 'e')
        with patch.object(flow, 'report_projects', self.fake_report(set(ids))):
            flow.recover_reports(self.config, flow.pending_reports(self.config), None,
                                 self.root / 'reports', False, self.progress.append)
        self.assertEqual(len(self.calls), 6, '每轮最多补 6 个')


if __name__ == '__main__':
    unittest.main()
