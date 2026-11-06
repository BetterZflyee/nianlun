"""倒排缺信息时，提示要能照着做。

原来只说「需要项目目标和目标日期，才能倒排」——用户不知道目标填哪个字段、
日期填在哪里。实际后果：7 个活跃项目的 goal 和 notes 全空，倒排能力一直没启用。

目标日期是隐式约定：写在 notes 里的「年轮目标日期：YYYY-MM-DD」。
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


class PlanningHintTests(unittest.TestCase):
    def source(self):
        return Path(planning.__file__).read_text(encoding='utf-8')

    def test_hint_names_the_goal_field(self):
        src = self.source()
        self.assertIn('goal 字段', src, '提示要说明目标是 goal 字段')

    def test_hint_names_the_date_convention(self):
        src = self.source()
        self.assertIn('年轮目标日期：YYYY-MM-DD', src,
                      '提示要给出目标日期的具体写法，否则用户找不到填哪')

    def test_hint_lists_only_missing_items(self):
        """缺一样就说一样，不要两项都提。"""
        src = self.source()
        self.assertIn('if not goal:missing.append', src)
        self.assertIn('if not target:missing.append', src)

    def test_deadline_parses_the_documented_convention(self):
        """提示里写的格式必须和解析正则一致，否则照着填也无效。"""
        project = {'notes': '年轮目标日期：2026-12-31'}
        self.assertEqual(planning.deadline(project).isoformat(), '2026-12-31')

    def test_deadline_accepts_fullwidth_colon(self):
        project = {'notes': '年轮目标日期:2026-12-31'}
        self.assertEqual(planning.deadline(project).isoformat(), '2026-12-31')


if __name__ == '__main__':
    unittest.main()
