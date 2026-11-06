"""行为测试：一个项目成稿失败后，其余项目必须继续生成。

之前的测试都是**源码结构断言**（看源码里有没有 try/except），
验证不了运行时真的会继续。这里直接调用 report_projects，让第一个
项目的 compose 抛错，断言第二个项目仍然被处理。
"""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow
import nianlun as n
import test_workbench as fixtures


class BatchContinuesAfterComposeFailure(unittest.TestCase):
    create = fixtures.WorkbenchTests.create

    def setUp(self):
        fixtures.WorkbenchTests.setUp(self)
        self.config['growth']['switches'] = {'table_writes': True, 'reports': True}
        self.config['growth']['report_folder'] = 'test-folder'
        n.save(self.path, self.config)
        # 建两个项目
        self.pids = []
        for name in ('项目甲', '项目乙'):
            req = self.create()
            req['values'].update(
                title=name, goal='交付试点', deadline='2026-11-30',
                notes='已确认交付范围：联调验收后正式交付，验收须保留联调记录与验收包')
            self.pids.append(self.work.mutate(req)['record_id'])
        self.patch = patch('flow.g.Gateway', side_effect=self.cloud.gateway)
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def test_second_project_still_runs_when_first_compose_fails(self):
        calls = []

        def fake_compose(project, *a, **k):
            calls.append(project['id'])
            if project['id'] == self.pids[0]:
                raise n.Error('须以 Lead: 核心结论开头')

        with patch('report_brief.compose', side_effect=fake_compose), \
             patch('report_style.preflight', return_value=None), \
             patch('flow.memory.retrieve', return_value={'pages': [], 'text': '', 'matched': False}):
            results, failures = flow.report_projects(
                self.config, self.pids, '2026-10-01', '2026-10-23', {}, )

        # 核心断言：第二个项目被处理了（不会被第一个项目的失败打断）
        self.assertIn(self.pids[1], calls, '第二个项目必须被处理')
        # 第一个项目的失败要被记下来
        self.assertIn(self.pids[0], [f['project_id'] for f in failures],
                      '第一个项目的失败要记进 failures')
        # 循环没有提前中断：两个项目都进过 compose
        self.assertEqual(calls, self.pids, '两个项目都要走到成稿，顺序不变')

    def test_single_project_raises(self):
        def fake_compose(project, *a, **k):
            raise n.Error('须以 Lead: 核心结论开头')

        with patch('report_brief.compose', side_effect=fake_compose), \
             patch('report_style.preflight', return_value=None), \
             patch('flow.memory.retrieve', return_value={'pages': [], 'text': '', 'matched': False}):
            with self.assertRaises(n.Error):
                flow.report_projects(
                    self.config, [self.pids[0]], '2026-10-01', '2026-10-23', {})


if __name__ == '__main__':
    unittest.main()
