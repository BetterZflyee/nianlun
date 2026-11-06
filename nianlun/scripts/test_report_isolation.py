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
        marker = "post['reports']=report_projects("
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


if __name__ == '__main__':
    unittest.main()
