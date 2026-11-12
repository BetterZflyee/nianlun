"""倒排不许编造：去掉强制 d-0、跨项目去重、目标来源标注。

背景（2026-11-12 排查）：飞哥贴了 6 条里程碑说「给我额外增加的里程碑是
错误的」。查下来 5 条是年轮「AI 倒排」在 2026-11-11 13:33–13:36 自动写的。

根因不是模型判断力，是 `validate()` 里的一条硬校验：

    if min(x['days_before_deadline'] for x in result)!=0:
        raise n.Error('倒排计划须包含截止日交付节点')

当截止日本身已经是一个人工里程碑（755RA 的 cA2fgc0KHp / ycXUscgmM9 都是
12-31），prompt 又写着「不要重复规划已有节点」，模型只剩一个选择：在最后
一天塞一个不与交付重名的东西。它塞的是「四项补充材料归档」，而「四项」指
的正是它自己规划的四个上游节点——一个自指的空壳。

证据：29 份历史计划全部有且仅有 1 个 d-0 节点，其中 28 份的标题落在
「归档/收口/总结/盘点/材料就绪」上 = 97%。同一形状到这个比例，说明不是
模型在思考，是规则在输出。

这个文件锁住三件事，任何一条被改回去都会失败。
"""
import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


TARGET = date.today() + timedelta(days=30)


def node(key, offset, title=None):
    return {'key': key, 'title': title or key, 'description': 'd',
            'days_before_deadline': offset, 'depends_on': []}


class NoForcedDeadlineNodeTests(unittest.TestCase):
    def test_plan_without_deadline_node_is_accepted(self):
        """不允许再强制「必须有一个 d-0 节点」。

        这条是本次修复的核心。计划里所有节点都早于截止日是合法的——
        截止日交付物如果是人工里程碑，倒排本来就不该再造一条。
        """
        answer = {'nodes': [node('barrier-installed', 35), node('data-collected', 15)],
                  'rationale': '截至日交付已有一个人工里程碑，倒排只补中间过程'}
        nodes = planning.validate(answer, TARGET)
        self.assertEqual(len(nodes), 2)
        self.assertTrue(all(n['days_before_deadline'] != 0 for n in nodes),
                        '修复后必须允许没有 d-0 节点')

    def test_plan_with_deadline_node_still_accepted(self):
        """有 d-0 节点也不是错——只是不再强制。"""
        answer = {'nodes': [node('ship', 0)], 'rationale': 'r'}
        self.assertEqual(planning.validate(answer, TARGET)[0]['date'], TARGET.isoformat())

    def test_old_rule_text_gone_from_source(self):
        """旧报错文案必须从源码里消失，别留一条注释掉的死规则。"""
        import inspect
        src = inspect.getsource(planning)
        self.assertNotIn('倒排计划须包含截止日交付节点', src)


class CrossProjectHintTests(unittest.TestCase):
    """跨项目重复：改成提示，不做硬拦截。

    我最初写的是硬校验（标题二元组 Jaccard >= 0.30 就拒绝），在真实 238 条
    标题上实测被否决：任意阈值下跨项目都会命中 63-266 对，其中大量是合法的
    同阶段模板行——「755RA 运营培训」同时属于车辆靠离卡、机器狗、F区安检
    三个项目，因为三个项目在同一场地各做各的运营培训。硬拦会把合法节点判死。

    所以判据留在 prompt 里，由模型判断。这个测试只锁「没有把硬拦截加回来」。
    """

    def test_validate_does_not_take_cross_project_titles(self):
        """validate 的签名保持两个参数，别把硬拦截偷偷加回去。"""
        import inspect
        params = list(inspect.signature(planning.validate).parameters)
        self.assertEqual(params, ["answer", "target"],
                         '一旦 validate 又接收跨项目标题，说明硬拦截被加回来了')

    def test_run_passes_elsewhere_into_prompt_not_validator(self):
        import inspect
        src = inspect.getsource(planning.run)
        self.assertIn('elsewhere', src, 'prompt 里要带上全表里程碑')
        self.assertNotIn('validate(answer,target,elsewhere)', src,
                         '不要把 elsewhere 传给校验器')
        self.assertIn('全表已有里程碑', src, 'prompt 要说明这份清单的用途')

    def test_prompt_hint_warns_against_duplicate_registration(self):
        import inspect
        src = inspect.getsource(planning.run)
        self.assertIn('不要在', src)
        self.assertIn('同一个交付只该有一个归属', src)


class DeadlineSourceTests(unittest.TestCase):
    """目标日期要带来源。兜底猜出来的日期不能当成硬承诺喂给模型。"""

    def test_reports_guessed_source_when_both_blank(self):
        """755RA 的真实情形：deadline 空、备注空，兜底猜最晚里程碑日期。"""
        project = {'id': 'p1', 'notes': '', 'deadline': None}
        state = {'milestones': [
            {'id': 'm1', 'date': '2099-12-31', 'status': '未开始', 'project_ids': ['p1']}]}
        value, source = planning.deadline_source(project, state)
        self.assertEqual(value.isoformat(), '2099-12-31')
        self.assertIn('推测', source, '猜出来的日期必须标明是推测')

    def test_reports_manual_source_when_deadline_present(self):
        project = {'id': 'p1', 'notes': '', 'deadline': '2099-06-30'}
        value, source = planning.deadline_source(project, None)
        self.assertEqual(value.isoformat(), '2099-06-30')
        self.assertIn('人工', source)

    def test_reports_note_source(self):
        project = {'id': 'p1', 'notes': '年轮目标日期：2099-05-01', 'deadline': None}
        value, source = planning.deadline_source(project, None)
        self.assertEqual(value.isoformat(), '2099-05-01')
        self.assertIn('备注', source)

    def test_deadline_still_returns_plain_date(self):
        """deadline() 的旧签名不能变，9 个现有测试和 run() 都在用它。"""
        project = {'id': 'p1', 'notes': '', 'deadline': '2099-06-30'}
        self.assertEqual(planning.deadline(project, None), date(2099, 6, 30))


class GoalFallbackTests(unittest.TestCase):
    def test_goal_source_defaults_to_description(self):
        """goal 空时仍退回描述（不能因为修 bug 就让所有项目都倒排不了），
        但代码里必须记住这个来源，好写进 prompt。"""
        import inspect
        src = inspect.getsource(planning.run)
        self.assertIn("goal_source", src)
        self.assertIn('goal 字段为空', src)


if __name__ == '__main__':
    unittest.main()
