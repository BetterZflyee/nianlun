"""写入前的硬约束：脏数据在落库前就被拒掉。

背景（2026-11-13 飞哥要求「在产生数据之前做规则上的约束」）：

原来的字段完整度全靠提示词自觉。`flow.py` 里写着「推断优先于留空：留空的
记录后面没人补得回来，写错了用户看得见还能改」——这句话本身就鼓励模型猜。
实测结果：1479 条反馈记录里 390 条（26%）没有项目关联，767 条（52%）没有
记录类型，1088 条（74%）没有后续动作。11-06 之后新写入的 49 条完整度到了
98%，说明提示词在改善，但它没有兜底：提示词没兜住的部分就是脏数据的来源。

这个文件锁住四类硬约束：
1. 里程碑必须有可核验依据（record_ids / milestone_ids）——倒排那 5 条错
   里程碑的共同点就是「标题像交付、备注全套话、零关联对象」。
2. 里程碑日期不能早于本轮证据时间——实测有 11-06/11-09/11-10 三个已过去的
   日期被写成待交付节点。
3. 标题长度和形状——标题是台账里唯一被人读的东西，太短说不清、太长被截断；
   也不能写成「飞书妙记确认X」这种元描述。
4. 记录必须挂项目。
"""
import copy
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth
import nianlun as n
from setup import TEMPLATE


def make_config(tmp):
    config = {'base_id': 'base', 'base_url': 'https://alidocs.dingtalk.com/i/nodes/base',
              'profile': 'test', 'growth': {'state_dir': str(tmp / 'state')}, 'tables': {}}
    for role, fields in TEMPLATE.items():
        config['tables'][role] = {'id': role, 'name': role, 'fields': {}}
        for key, (name, kind, cfg) in fields.items():
            cfg = copy.deepcopy(cfg)
            if 'target' in cfg:
                cfg['linkedTableId'] = cfg.pop('target')
            config['tables'][role]['fields'][key] = {
                'fieldId': role + '-' + key, 'fieldName': name, 'type': kind, 'config': cfg}
    return config


class Base(unittest.TestCase):
    def setUp(self):
        import tempfile
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.config = make_config(self.dir)
        self.bundle = {
            'run_id': 'run-1',
            'binding': n.digest(self.config),
            'until': '2026-11-13T10:00:00+08:00',
            'tables': {
                'projects': [{'id': 'P1', 'title': '测试项目', 'status': '进行中',
                              'project_ids': ['P1'], 'raw_cells': {}}],
                'milestones': [{'id': 'M0', 'title': '既有里程碑', 'project_ids': ['P1'],
                                'status': '进行中', 'date': '2026-12-01', 'raw_cells': {}}],
                'records': [{'id': 'R1', 'title': '既有记录', 'project_ids': ['P1'],
                             'status': '开放', 'date': '2026-11-10', 'raw_cells': {}}],
                'sites': [],
            },
            'sources': [{'id': 'message:abc', 'name': '群聊', 'text': '明天把围挡装完，张工负责',
                         'url': ''}],
            'identity': {'user_id': 'u1'},
            'todos': [],
        }
        self.bundle['binding'] = n.digest(self.config)

    def decide(self, **action):
        base = {'op': 'create_milestone', 'source_id': 'message:abc',
                'quote': '明天把围挡装完', 'project': '测试项目',
                'title': '路侧围挡安装完成', 'description': '完成路侧围挡施工并通过现场验收，留存验收单',
                'date': '2026-11-26', 'record_ids': ['R1']}
        base.update(action)
        decision = {'run_id': 'run-1', 'summary': '整理本轮变化',
                    'deferred_source_ids': [], 'actions': [base]}
        return growth.validate(self.config, self.bundle, decision)


class MilestoneEvidenceTests(Base):
    """里程碑必须有可核验依据。"""

    def test_milestone_without_any_link_rejected(self):
        """倒排那 5 条错里程碑的共同点：零关联对象。

        有 quote 只证明「这句话被说过」，不证明「这件事有这个交付节点」。
        """
        with self.assertRaises(n.Error) as ctx:
            self.decide(record_ids=[], milestone_ids=[])
        msg = str(ctx.exception)
        self.assertIn('必须关联', msg)
        self.assertIn('pending', msg, '要告诉用户没依据时该怎么做')

    def test_milestone_linked_to_record_accepted(self):
        result = self.decide()
        self.assertEqual(len(result['actions']), 1)

    def test_milestone_linked_to_existing_milestone_accepted(self):
        result = self.decide(record_ids=[], milestone_ids=['M0'])
        self.assertEqual(len(result['actions']), 1)

    def test_nonexistent_link_rejected(self):
        with self.assertRaises(n.Error) as ctx:
            self.decide(record_ids=['NOT-EXIST'])
        self.assertIn('不存在', str(ctx.exception))


class MilestoneDateTests(Base):
    """已过去的日期不能当待交付节点。"""

    def test_past_date_rejected(self):
        """实测有 2026-11-06 / 11-09 / 11-10 三个已过去日期被写成里程碑。"""
        with self.assertRaises(n.Error) as ctx:
            self.decide(date='2026-11-06')
        msg = str(ctx.exception)
        self.assertIn('已过期', msg)
        self.assertIn('2026-11-13', msg, '报错要点名参照日期，否则不知道按哪天算')

    def test_today_rejected_when_evidence_is_today(self):
        """证据时间当天的更早日期也不行——那已是既成事实，不是待交付。"""
        with self.assertRaises(n.Error):
            self.decide(date='2026-11-12')

    def test_future_date_accepted(self):
        self.assertEqual(len(self.decide(date='2026-11-26')['actions']), 1)

    def test_reference_uses_evidence_time_not_system_today(self):
        """补跑历史批次时，参照时间要取本轮证据的 until，不是系统今天。

        否则补 11 月初那批时，所有合法日期都会被系统日期判死。
        """
        self.bundle['until'] = '2026-11-05T10:00:00+08:00'
        result = self.decide(date='2026-11-06')
        self.assertEqual(len(result['actions']), 1, '按证据时间 11-05 算，11-06 是未来')


class MilestoneShapeTests(Base):
    def test_too_short_title_rejected(self):
        with self.assertRaises(n.Error) as ctx:
            self.decide(title='围挡')
        self.assertIn('6 至 60', str(ctx.exception))

    def test_too_long_title_rejected(self):
        with self.assertRaises(n.Error):
            self.decide(title='完成' + '很长的背景描述' * 12)

    def test_too_short_description_rejected(self):
        with self.assertRaises(n.Error) as ctx:
            self.decide(description='完成围挡')
        self.assertIn('20 字', str(ctx.exception))

    def test_same_title_in_project_rejected(self):
        """同项目不许有两件同名交付。"""
        self.bundle['tables']['milestones'][0]['title'] = '路侧围挡安装完成并通过验收'
        with self.assertRaises(n.Error) as ctx:
            self.decide(title='路侧围挡安装完成并通过验收')
        self.assertIn('同名', str(ctx.exception))

    def test_same_title_across_projects_allowed(self):
        """跨项目同名不拦——同一场地不同项目各做各的阶段是合法的。

        实测「755RA 运营培训」同时属于车辆靠离卡、机器狗、F区安检三个项目。
        """
        self.bundle['tables']['projects'].append(
            {'id': 'P2', 'title': '另一个项目', 'status': '进行中', 'project_ids': ['P2'], 'raw_cells': {}})
        result = self.decide(project='另一个项目')
        self.assertEqual(len(result['actions']), 1)


class RecordTests(Base):
    def rec(self, **kw):
        base = {'op': 'create_record', 'source_id': 'message:abc', 'quote': '明天把围挡装完',
                'project': '测试项目', 'title': '路侧围挡施工进入收尾',
                'description': '现场确认围挡已完成八成，剩余部分明日收尾', 'date': '2026-11-13',
                'kind': '进展更新'}
        base.update(kw)
        return growth.validate(self.config, self.bundle,
                               {'run_id': 'run-1', 'summary': '整理', 'deferred_source_ids': [],
                                'actions': [base]})

    def test_record_without_project_rejected(self):
        """实测 390/1479 = 26% 的记录没有项目关联，在报表里全都看不见。"""
        with self.assertRaises(n.Error) as ctx:
            self.rec(project='')
        msg = str(ctx.exception)
        self.assertIn('项目', msg)
        self.assertIn('pending', msg)

    def test_source_meta_title_rejected(self):
        """标题不能写成「来源+确认」的元描述。"""
        with self.assertRaises(n.Error) as ctx:
            self.rec(title='飞书妙记确认F区安检为第二位优先级')
        msg = str(ctx.exception)
        self.assertIn('元描述', msg)
        self.assertIn('F区安检列为第二位优先级', msg, '要给出改法')

    def test_normal_title_accepted(self):
        self.assertEqual(len(self.rec()['actions']), 1)

    def test_other_source_prefixes_also_rejected(self):
        for prefix in ('语音通话确认', '会议纪要提到', '听记指出', '群聊记录'):
            with self.assertRaises(n.Error):
                self.rec(title=prefix + '围挡需要明天完成')

    def test_unrelated_title_starting_with_meeting_ok(self):
        """「会议」开头但不是元描述的要放行，不能一刀切。"""
        self.assertEqual(len(self.rec(title='会议确定围挡施工顺序调整方案')['actions']), 1)


class BasisPersistedTests(unittest.TestCase):
    """validate 挡住了无依据的里程碑，依据还必须真的写进表。

    如果只为「必须有依据」挡一道、却不把依据落进备注，事后就查不出这条
    里程碑从哪条记录来的——那和没有依据是一样的。倒排那批错节点的备注
    全是套话，正是缺了这一步。
    """

    def test_basis_written_into_notes(self):
        import inspect
        src = inspect.getsource(growth.apply)
        self.assertIn("依据：", src, '备注里要有「依据：<记录ID列表>」')
        self.assertIn('basis', src)


if __name__ == '__main__':
    unittest.main()
