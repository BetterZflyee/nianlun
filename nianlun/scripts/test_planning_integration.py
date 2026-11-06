"""倒排链路的端到端行为：从里程碑推导出截止日，再据此判断能否倒排。

背景：实表 7 个活跃项目的 goal/notes 全空，倒排一次没启用过。
里程碑里其实每个项目都有日期，推导出来后 7 个全部可倒排。
这里锁住「推导 → 可倒排」这条链路，防止以后又把推导路径改回去。
"""
import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


def project(pid='p1', **kw):
    base = {'id': pid, 'title': 'T', 'notes': '', 'status': '进行中', 'active': True}
    base.update(kw)
    return base


def milestone(mid, day, status='未开始', pids=('p1',)):
    return {'id': mid, 'date': day, 'status': status, 'project_ids': list(pids)}


class DeriveThenPlanTests(unittest.TestCase):
    """推导出的日期必须真的能让项目通过倒排前置检查。"""

    def _can_plan(self, proj, state):
        """复刻 planning.run 的前置判断，确保和产品逻辑一致。"""
        target = planning.deadline(proj, state)
        goal = proj.get('goal') or proj.get('description')
        return bool(target and goal)

    def test_project_with_only_milestones_can_plan(self):
        """只有里程碑、goal/notes 全空的项目，推导后应可倒排。"""
        proj = project(description='项目说明在这里')
        state = {'milestones': [milestone('m1', '2026-12-25')]}
        self.assertTrue(self._can_plan(proj, state),
                        '有里程碑就该能倒排，不该卡在没人知道的 notes 约定上')

    def test_project_without_any_signal_cannot_plan(self):
        proj = project()
        state = {'milestones': []}
        self.assertFalse(self._can_plan(proj, state))

    def test_derived_date_is_after_today_for_typical_data(self):
        """推导出的日期应是未来，否则倒排没有意义。"""
        proj = project(description='x')
        state = {'milestones': [
            milestone('m1', '2026-11-20'),
            milestone('m2', '2026-12-25'),
        ]}
        derived = planning.deadline(proj, state)
        self.assertGreater(derived, date(2026, 11, 7))

    def test_all_projects_with_milestones_become_plannable(self):
        """7 个项目的场景：全都有里程碑，全部应可倒排。"""
        projects = [project(f'p{i}', description=f'项目{i}') for i in range(7)]
        state = {'milestones': [
            milestone(f'm{i}', f'2026-12-{10 + i:02d}', pids=(f'p{i}',)) for i in range(7)
        ]}
        plannable = [p for p in projects if self._can_plan(p, state)]
        self.assertEqual(len(plannable), 7)

    def test_completed_milestone_does_not_extend_deadline(self):
        """已达成里程碑不影响截止日——否则历史数据会把目标一直往后推。"""
        proj = project(description='x')
        state = {'milestones': [
            milestone('m1', '2026-11-20'),
            milestone('m2', '2027-06-30', status='已达成'),
        ]}
        self.assertEqual(planning.deadline(proj, state).isoformat(), '2026-11-20')

    def test_cancelled_milestone_ignored(self):
        proj = project(description='x')
        state = {'milestones': [
            milestone('m1', '2026-11-20'),
            milestone('m2', '2027-06-30', status='已取消'),
        ]}
        self.assertEqual(planning.deadline(proj, state).isoformat(), '2026-11-20')


class AntiDuplicationTests(unittest.TestCase):
    """倒排写入必须能识别自己写过的节点，避免每轮重复创建。"""

    def test_prefix_is_stable_for_same_project(self):
        import nianlun as n
        base = 'BASE'
        other = 'OTHER'
        def prefix(pid):
            return '[年轮倒排:' + n.digest({'base': base, 'project': pid})[:16] + ':'
        self.assertEqual(prefix('p1'), prefix('p1'))
        self.assertNotEqual(prefix('p1'), prefix('p2'))

    def test_prefix_changes_with_base(self):
        import nianlun as n
        def prefix(b, pid='p1'):
            return '[年轮倒排:' + n.digest({'base': b, 'project': pid})[:16] + ':'
        self.assertNotEqual(prefix('BASE1'), prefix('BASE2'),
                            '换表格后应重新计算，不能复用旧表的节点')


if __name__ == '__main__':
    unittest.main()
