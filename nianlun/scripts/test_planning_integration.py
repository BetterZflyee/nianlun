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


class StaleStateTests(unittest.TestCase):
    """倒排写节点后，用旧快照比较会误报「项目已变化」。

    planning.run 的循环里：

        fresh = n.fetch(...)          # 每次写入前重新读
        if deadline(current_project, state) != target:   # state 是循环外的旧快照
            raise n.Error('倒排期间项目目标或日期已变化')

    state 看不到本循环前几轮刚写入的里程碑，推导出的日期和 target 不等，
    于是第二个节点就会被误判成「项目变了」，整个倒排中断。

    这条路径很难在真实运行里观察——它只在「倒排自己写入了更晚的节点」时
    才触发，而那时日志只会显示一句「日期已变化」，看不出是自己写的。
    """

    def test_stale_snapshot_changes_derived_deadline(self):
        """先证明这个陷阱真实存在：旧快照推导出的日期会变。"""
        state = {'projects': [{'id': 'p1', 'notes': ''}],
                 'milestones': [{'id': 'm1', 'date': '2026-12-25', 'status': '未开始',
                                 'project_ids': ['p1']}]}
        old = planning.deadline(state['projects'][0], state)
        state['milestones'].append({'id': 'new', 'date': '2027-01-30', 'status': '未开始',
                                    'project_ids': ['p1']})
        new = planning.deadline(state['projects'][0], state)
        self.assertNotEqual(old, new,
                            '如果相等，这个陷阱就不存在，测试可以删掉')

    def test_run_uses_fresh_snapshot_for_comparison(self):
        """run() 必须用 fresh 比较，不能用循环外的 state。"""
        import inspect
        src = inspect.getsource(planning.run)
        self.assertIn('deadline(current_project,fresh)', src,
                      '要用 fresh 快照比较，否则倒排写第二个节点就会误报「已变化」')
        self.assertNotIn('deadline(current_project,state)', src,
                         '不能再用循环外的旧 state 比较')


class ExpiredDeadlineTests(unittest.TestCase):
    """全部里程碑都过期时，不能拿过期日期当目标。

    实表里已有 47 个过期未完成里程碑。如果某个项目的里程碑全在过去，
    `deadline()` 会返回一个过去的日期，倒排据此算出来的节点日期全在过去——
    写进表里就是一批「已过期的计划」。
    """

    def test_all_expired_milestones_gives_no_deadline(self):
        state = {'projects': [{'id': 'p1', 'notes': ''}],
                 'milestones': [
                     {'id': 'm1', 'date': '2026-10-01', 'status': '未开始', 'project_ids': ['p1']},
                     {'id': 'm2', 'date': '2026-10-15', 'status': '已延期', 'project_ids': ['p1']},
                 ]}
        self.assertIsNone(planning.deadline(state['projects'][0], state),
                          '全过期时应视为没有可用目标')

    def test_one_future_milestone_is_enough(self):
        state = {'projects': [{'id': 'p1', 'notes': ''}],
                 'milestones': [
                     {'id': 'm1', 'date': '2026-10-01', 'status': '未开始', 'project_ids': ['p1']},
                     {'id': 'm2', 'date': '2099-01-30', 'status': '未开始', 'project_ids': ['p1']},
                 ]}
        self.assertIsNotNone(planning.deadline(state['projects'][0], state))

    def test_validate_rejects_expired_target(self):
        """即使调用方硬塞一个过期日期，validate 也要拒绝并说清怎么办。"""
        from datetime import date, timedelta
        past = date.today() - timedelta(days=30)
        answer = {'nodes': [{'key': 'k1', 'title': '交付', 'description': 'd',
                             'days_before_deadline': 0, 'depends_on': []}],
                  'rationale': 'r'}
        with self.assertRaises(Exception) as ctx:
            planning.validate(answer, past)
        msg = str(ctx.exception)
        self.assertIn('已过期', msg)
        self.assertIn('更新', msg, '要告诉用户怎么处理')

    def test_validate_accepts_future_target(self):
        from datetime import date, timedelta
        future = date.today() + timedelta(days=30)
        answer = {'nodes': [{'key': 'k1', 'title': '交付', 'description': 'd',
                             'days_before_deadline': 0, 'depends_on': []}],
                  'rationale': 'r'}
        nodes = planning.validate(answer, future)
        self.assertEqual(nodes[0]['date'], future.isoformat())


if __name__ == '__main__':
    unittest.main()
