"""阶段汇报失败不能把整轮生长标记为失败。

汇报是收尾步骤：前面的写表、建待办、倒排里程碑都已经落库。若这里因为模型
超时或网络抖动抛错就整轮失败，会迫使同一批已生效的写入重试，而且执行记录上
也看不出「主体成功、汇报未出」。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow


class ReportIsolationTests(unittest.TestCase):
    def test_reports_error_is_recorded_not_raised(self):
        """源码层面确认：report_projects 调用被 try/except 包住并写入 reports_error。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        marker = "post['reports'],reports_failed=report_projects("
        self.assertIn(marker, source)
        # 该调用必须位于 try 块内
        idx = source.index(marker)
        before = source[:idx]
        self.assertGreater(before.rfind('try:'), before.rfind('except Exception as exc:'),
                           'report_projects 应在 try 块内')
        self.assertIn("post['reports_error']", source)

    def test_body_write_steps_are_not_wrapped(self):
        """写表与建待办必须仍然失败即中断，不能被同一层兜底吞掉。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        for step in ("receipt=g.apply(", "memory.refresh(", "g.finish("):
            self.assertIn(step, source)
            idx = source.index(step)
            line_start = source.rfind('\n', 0, idx) + 1
            line = source[line_start:source.find('\n', idx)]
            self.assertNotIn('try', line, step)


class PostprocessIsolationTests(unittest.TestCase):
    """倒排里程碑、记忆维护、阶段汇报都是收尾步骤，失败不能拖垮整轮。"""

    def test_all_three_postprocess_steps_are_guarded(self):
        source = Path(flow.__file__).read_text(encoding='utf-8')
        for marker, error_key in (
            ("post['planning']=planning.run(", "post['planning_error']"),
            ("post['memory']=memory.refresh(", "post['memory_error']"),
            ("report_projects(", "post['reports_error']"),
        ):
            self.assertIn(marker, source, marker)
            idx = source.index(marker)
            before = source[max(0, idx - 400):idx]
            self.assertIn('try:', before, f'{marker} 没有被 try 包住')
            self.assertIn(error_key, source, error_key)

    def test_main_write_steps_stay_unguarded(self):
        """写表与建待办必须失败即中断，不能被这层兜底吞掉。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        for step in ("receipt=g.apply(", "g.finish("):
            idx = source.index(step)
            line_start = source.rfind('\n', 0, idx) + 1
            line = source[line_start:source.find('\n', idx)]
            self.assertNotIn('try', line, step)


class ReportBatchIsolationTests(unittest.TestCase):
    """一个项目报告失败，不该让其余项目都没有报告。

    实测历史数据：7 个活跃项目，报告常常只出来 1-2 份。原因是 report_projects 的
    循环里没有异常保护，第一个失败就整批中断。
    """

    def test_loop_guards_each_project(self):
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('result=g.publish_report(')
        before = source[max(0, idx - 600):idx]
        self.assertIn('try:', before, 'publish_report 没有被 try 包住')
        after = source[idx:idx + 1200]
        self.assertIn('failures.append(', after, '失败的项目没有被记录')
        self.assertIn('continue', after, '失败后没有继续下一个项目')

    def test_single_project_failure_still_raises(self):
        """只有一个项目时没有「其余项目」可救，抛错比记账更有用。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('result=g.publish_report(')
        after = source[idx:idx + 1200]
        self.assertIn('len(project_ids)==1', after)

    def test_returns_results_and_failures(self):
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('def report_projects(')
        body = source[idx:idx + 6000]
        self.assertIn('return results,failures', body)

    def test_stale_report_always_raises(self):
        """资料已变的信号必须上抛，不能当成普通失败跳过。"""
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('result=g.publish_report(')
        after = source[idx:idx + 400]
        self.assertIn('except n.ReportStale', after)


if __name__ == '__main__':
    unittest.main()
