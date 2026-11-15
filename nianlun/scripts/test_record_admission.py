"""准入闭环：挂不到里程碑不算项目记忆，但落地是「打标 + 人确认」不是拒写。

## 规则来源（飞哥 2026-11-14 定稿，11-15 落地）

> 挂不到里程碑上的东西，不算项目记忆。

这条线的**事实依据**是用户自己的行为：1480 条记录里 1102 条已归档的
挂里程碑率 0.7%，开放 310 条挂 83%——界线是用户用「归档」手工划出来的。

## 三个设计决定（都有原因）

1. **照写不拒写，打 `needs_review`**。生长模型判断「可疑」不等于确定「不该记」，
   直接拒写会漏掉真记忆；交给人一次点击确认/驳回更准。
2. **标记写进 description，不加表列**。用户的表结构不动，在钉钉里直接
   看得见「待复核」；必须是确定性变换——fresh plan 两次生成不一致会被
   「计划内容变更」拦死（validate 在 apply 里会重跑）。
3. **milestone_ids 只收短引用 m1/m2**。真实 ID 是 10 字符随机串，让模型
   逐字抄就会重演 deferred 长 ID 抄错整轮作废的事故（教训 68）。

## 驳回学习

用户驳回 → 归档 + 标题/项目进负例库 → 下一轮 prompt 带负例。
界线具体长什么样只有用户知道，「持续学习」= 具体否决的累积。
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n
import record_admission as ra

CONFIG = json.loads(Path.home().joinpath('.config/nianlun/config.json').read_text())


def bundle(with_refs=True):
    ms = [{'id': 'ms-real-1', 'title': '南昌流程确认', 'project_ids': ['p1'],
           'status': '进行中', 'raw_cells': {}}]
    if with_refs:
        ms[0]['ref'] = 'm1'
    return {
        'run_id': 't1', 'binding': n.digest(CONFIG),
        'sources': [{'id': 'src1', 'ref': 'S1', 'name': '群', 'text': '定了南昌出差',
                     'time': '2026-11-15', 'channels': ['groups'], 'version': 'v'}],
        'tables': {
            'projects': [{'id': 'p1', 'title': '甲项目', 'raw_cells': {}, 'project_ids': []}],
            'milestones': ms,
            'records': [], 'sites': [], 'todos': [], 'coverage': [], 'identity': {}},
        'todos': [], 'coverage': [], 'identity': {'user_id': 'u'}}


def decision(milestone_ids='omit'):
    act = {'op': 'create_record', 'project': '甲项目', 'source_id': 'S1',
           'quote': '定了南昌出差', 'title': '测试记录标题够长吗',
           'description': '正文', 'date': '2026-11-15', 'kind': '业务问题', 'status': '开放'}
    if milestone_ids != 'omit':
        act['milestone_ids'] = milestone_ids
    return {'run_id': 't1', 'summary': '测试', 'pending': [],
            'deferred_source_ids': [], 'actions': [act]}


class ValidateTaggingTests(unittest.TestCase):
    def test_ref_resolves_to_real_id(self):
        plan = g.validate(CONFIG, bundle(), decision(['m1']))
        a = plan['actions'][0]
        self.assertEqual(a['milestone_ids'], ['ms-real-1'])
        self.assertFalse(a['needs_review'])
        self.assertNotIn(g.REVIEW_MARKER, a['description'])

    def test_no_milestone_marks_needs_review(self):
        plan = g.validate(CONFIG, bundle(), decision())
        a = plan['actions'][0]
        self.assertTrue(a['needs_review'])
        self.assertIn(g.REVIEW_MARKER, a['description'])

    def test_bad_ref_goes_unresolved_not_exception(self):
        """瞎编编号不抛错整轮作废——降级为 unresolved + 待复核。"""
        plan = g.validate(CONFIG, bundle(), decision(['m999']))
        a = plan['actions'][0]
        self.assertEqual(a['milestone_ids'], [])
        self.assertEqual(a['milestone_refs_unresolved'], ['m999'])
        self.assertTrue(a['needs_review'])

    def test_marker_is_deterministic(self):
        """同一输入两次 validate 必须产出相同 plan（fresh==plan 检查依赖这点）。"""
        p1 = g.validate(CONFIG, bundle(), decision())
        p2 = g.validate(CONFIG, bundle(), decision())
        self.assertEqual(p1['actions'][0]['description'], p2['actions'][0]['description'])

    def test_milestone_from_other_project_not_accepted(self):
        b = bundle()
        b['tables']['milestones'][0]['project_ids'] = ['p9']
        plan = g.validate(CONFIG, b, decision(['m1']))
        self.assertTrue(plan['actions'][0]['needs_review'])

    def test_resolve_row_ref_rejects_ambiguous(self):
        b = bundle()
        b['tables']['milestones'].append(dict(b['tables']['milestones'][0], id='ms2', ref='m1'))
        self.assertIsNone(g.resolve_row_ref(b, 'milestones', 'm1'))

    def test_legacy_real_id_still_works(self):
        plan = g.validate(CONFIG, bundle(), decision(['ms-real-1']))
        self.assertEqual(plan['actions'][0]['milestone_ids'], ['ms-real-1'])


class NegativeExamplesTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.config = json.loads(json.dumps(CONFIG))
        self.config['growth'] = dict(self.config['growth'], state_dir=self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_empty_returns_blank(self):
        self.assertEqual(ra.negative_examples(self.config), '')

    def test_rejection_roundtrip(self):
        ra.record_rejection(self.config, 'r1', '联系卢师傅取设备', '甲项目', '执行过程')
        text = ra.negative_examples(self.config)
        self.assertIn('联系卢师傅取设备', text)
        self.assertIn('不要再 create_record', text)

    def test_same_id_updates_not_duplicates(self):
        ra.record_rejection(self.config, 'r1', '标题A', 'P', '')
        ra.record_rejection(self.config, 'r1', '标题A', 'P', '换理由')
        rows = ra.load(self.config)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['reason'], '换理由')

    def test_fifo_cap(self):
        for i in range(60):
            ra.record_rejection(self.config, f'id{i}', f'标题{i}', 'P', '')
        rows = ra.load(self.config)
        self.assertEqual(len(rows), ra.MAX_NEGATIVES)
        self.assertEqual(rows[-1]['title'], '标题59')
        self.assertNotIn('id0', {x['id'] for x in rows})

    def test_prompt_budget_keeps_recent(self):
        """超预算时丢最老的，留最近的（最近否决=当前界线）。"""
        for i in range(80):
            ra.record_rejection(self.config, f'x{i}', f'标题{i}：' + '很长的内容' * 4, '项目', '')
        text = ra.negative_examples(self.config)
        self.assertIn('标题79', text)      # 最新一条必须在
        self.assertNotIn('标题0：', text)   # 最老的是被裁掉的
        self.assertLessEqual(len(text), ra.PROMPT_BUDGET_CHARS + 400)


class PromptInjectionTests(unittest.TestCase):
    def test_flow_injects_negatives(self):
        flow = (Path(__file__).resolve().parent / 'flow.py').read_text(encoding='utf-8')
        self.assertIn('negative_examples', flow)
        self.assertIn('历史驳回', flow)

    def test_contract_requires_short_ref(self):
        flow = (Path(__file__).resolve().parent / 'flow.py').read_text(encoding='utf-8')
        self.assertIn('m1、m2', flow)
        # 并且明确「挂不到不要硬凑」——否则模型会为了过打标乱挂
        self.assertIn('不要为了挂而硬凑', flow)


class LinkableRefTests(unittest.TestCase):
    def test_linkable_milestones_carry_ref(self):
        import flow
        b = bundle()
        out = flow.prompt_evidence(b)
        ms = out['linkable']['milestones']
        self.assertEqual(ms[0]['ref'], 'm1')


if __name__ == '__main__':
    unittest.main()
