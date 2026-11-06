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


class DeadlineDerivationTests(unittest.TestCase):
    """目标日期能从里程碑推导出来。

    实表情况：7 个活跃项目的 goal 和 notes 全空，但每个项目都有里程碑且带日期
    （最晚的从 2026-12-18 到 2027-01-30）。原来只认 deadline 字段和 notes 里的
    隐式备注，导致倒排能力一次都没启用。**数据明明在，不该因为缺一个没人知道的
    约定就放弃。**
    """

    def state(self):
        return {'milestones': [
            {'id': 'm1', 'date': '2026-11-20', 'status': '未开始', 'project_ids': ['p1']},
            {'id': 'm2', 'date': '2026-12-25', 'status': '进行中', 'project_ids': ['p1']},
            {'id': 'm3', 'date': '2027-01-30', 'status': '已达成', 'project_ids': ['p1']},
            {'id': 'm4', 'date': '2026-12-01', 'status': '未开始', 'project_ids': ['p2']},
        ]}

    def test_derives_from_latest_unfinished_milestone(self):
        project = {'id': 'p1', 'notes': '', 'goal': 'x'}
        self.assertEqual(planning.deadline(project, self.state()).isoformat(), '2026-12-25')

    def test_ignores_completed_milestones(self):
        """已达成的不算：那是历史，不是目标。"""
        project = {'id': 'p1', 'notes': '', 'goal': 'x'}
        derived = planning.deadline(project, self.state())
        self.assertNotEqual(derived.isoformat(), '2027-01-30')

    def test_explicit_deadline_wins(self):
        project = {'id': 'p1', 'deadline': '2026-11-30', 'notes': '', 'goal': 'x'}
        self.assertEqual(planning.deadline(project, self.state()).isoformat(), '2026-11-30')

    def test_notes_convention_wins_over_derivation(self):
        project = {'id': 'p1', 'notes': '年轮目标日期：2026-12-05', 'goal': 'x'}
        self.assertEqual(planning.deadline(project, self.state()).isoformat(), '2026-12-05')

    def test_no_state_keeps_old_behaviour(self):
        """不传 state 时行为不变，避免影响其它调用方。"""
        project = {'id': 'p1', 'notes': '', 'goal': 'x'}
        self.assertIsNone(planning.deadline(project))

    def test_bad_dates_are_skipped(self):
        state = {'milestones': [
            {'id': 'm1', 'date': '不是日期', 'status': '未开始', 'project_ids': ['p1']},
            {'id': 'm2', 'date': '', 'status': '未开始', 'project_ids': ['p1']},
            {'id': 'm3', 'date': '2026-12-10', 'status': '未开始', 'project_ids': ['p1']},
        ]}
        self.assertEqual(planning.deadline({'id': 'p1', 'notes': ''}, state).isoformat(), '2026-12-10')

    def test_project_without_milestones_returns_none(self):
        self.assertIsNone(planning.deadline({'id': 'px', 'notes': ''}, self.state()))


if __name__ == '__main__':
    unittest.main()
