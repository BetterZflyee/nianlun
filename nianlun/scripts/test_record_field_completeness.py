"""生长要把记录表的每一列都填上，不能只写标题和正文。

## 飞哥报的问题（2026-11-09）

> 没有按照我记录、反馈、迭代的内容，来完成所有的拉通。
> 比如，关联项目里程碑、反馈类型、反馈子类别、对接人，还有场地编码等信息，
> 这些应该在做反馈的时候就可以迭代进去。

## 实测的覆盖率（1459 条真实记录）

| 字段 | 覆盖率 | 说明 |
|---|---|---|
| 反馈内容 | 99% | 正文，一直有 |
| 项目类别 | 73% | 四分之一没关联 |
| **反馈类型** | **47%** | 一半空白 |
| 反馈子类别 | 24% | 大部分空白 |
| **项目名称** | **24%** | 和「项目类别」重复的另一列 |
| **里程碑** | **22%** | 大部分空白 |
| **场地编码** | **20%** | 大部分空白 |
| **对接人** | **2%** | 几乎没填 |

## 三个根因

1. **契约没要求**：`automation.md` 只说「可带 site_ids/milestone_ids」，
   连 `sub_kind`、`contact` 都没提，模型当然不填。
2. **代码不支持**：`n.plan()` 构造 cells 时只写 title/详情/project_ids/date/status/kind
   六个字段，`sub_kind` 和 `contact` 根本没进 cells。
3. **没给候选清单**：模型知道有个 `site_ids` 列，但不知道有哪些场地可选，
   只能凭记忆里出现过的名字猜。

## 改法

- 契约：明确「必须尽量把每一列都填上」，并写清「推断优先于留空」
- 代码：`plan()` 支持 `sub_kind`、`contact` 落列（只在表里真有该列时）
- 提示词：新增 `linkable`（sites 14 个 + milestones 203 个，带 id/名称/编码）
- 提示词：强制逐列检查，并说明「写错比留空好」

## 一条设计原则

**写错比留空好。** 留空的记录后面没人补得回来；写错了用户看得见、还能改。
但推断必须来自本轮证据，不许凭项目名想象——拿不准的写进 description 并注明「推测」。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow
import nianlun as n

ROOT = Path(__file__).resolve().parent


def sample_bundle():
    return {
        'run_id': 'r1', 'sources': [], 'todos': [],
        'tables': {
            'projects': [{'id': 'p1', 'title': 'P', 'project_ids': [], 'raw_cells': {}}],
            'milestones': [{'id': 'm1', 'title': '里程碑甲', 'status': '待核',
                            'date': '2026-12-01', 'project_ids': ['p1'], 'raw_cells': {}}],
            'sites': [{'id': 's1', 'title': '场地甲', 'code': '571WA',
                       'project_ids': ['p1'], 'raw_cells': {}}],
            'records': [],
            'fields': {'records': {
                'title': {'type': 'text', 'fieldId': 'f1'},
                'sub_kind': {'type': 'singleSelect', 'fieldId': 'f2',
                             'config': {'options': [{'name': '硬件方向'}, {'name': '软件方向'}]}},
                'contact': {'type': 'user', 'fieldId': 'f3'},
                'kind': {'type': 'singleSelect', 'fieldId': 'f4',
                         'config': {'options': [{'name': '产品需求'}]}},
                'site_ids': {'type': 'bidirectionalLink', 'fieldId': 'f5'},
                'milestone_ids': {'type': 'unidirectionalLink', 'fieldId': 'f6'},
            }},
        },
    }


class LinkableTests(unittest.TestCase):
    def test_linkable_lists_sites_and_milestones(self):
        pe = flow.prompt_evidence(sample_bundle())
        lk = pe.get('linkable') or {}
        self.assertIn('sites', lk)
        self.assertIn('milestones', lk)
        self.assertEqual(lk['sites'][0]['id'], 's1')
        self.assertEqual(lk['milestones'][0]['id'], 'm1')

    def test_sites_carry_code(self):
        """场地编码是飞哥明确点名的字段，候选里必须带。"""
        pe = flow.prompt_evidence(sample_bundle())
        self.assertIn('code', pe['linkable']['sites'][0])

    def test_linkable_carries_project_ids(self):
        """模型要靠 project_ids 判断「这个场地属不属于这个项目」。"""
        pe = flow.prompt_evidence(sample_bundle())
        self.assertEqual(pe['linkable']['sites'][0]['project_ids'], ['p1'])


class ContractTests(unittest.TestCase):
    def test_contract_mentions_all_fields(self):
        text = (ROOT.parent / 'references' / 'automation.md').read_text(encoding='utf-8')
        for field in ('site_ids', 'milestone_ids', 'sub_kind', 'contact'):
            self.assertIn(field, text, f'契约没提 {field}，模型不会填')

    def test_contract_says_fill_every_column(self):
        text = (ROOT.parent / 'references' / 'automation.md').read_text(encoding='utf-8')
        self.assertIn('每一列', text)

    def test_contract_says_inference_beats_blank(self):
        """「写错比留空好」是这次的核心取舍，必须写进契约。"""
        text = (ROOT.parent / 'references' / 'automation.md').read_text(encoding='utf-8')
        self.assertIn('推断优先于留空', text)


class PlanWritesNewFieldsTests(unittest.TestCase):
    """n.plan() 必须真的把 sub_kind / contact 写进 cells。"""

    def build_config(self):
        return {
            'base_id': 'base-test', 'profile': None,
            'tables': {
                'projects': {'fields': {'status': {'fieldId': 'ps', 'config': {}}}},
                'records': {'fields': {
                    'title': {'fieldId': 'f1'},
                    'description': {'fieldId': 'f2'},
                    'project_ids': {'fieldId': 'f3'},
                    'date': {'fieldId': 'f4'},
                    'status': {'fieldId': 'f5', 'config': {'options': [{'name': '开放'}]}},
                    'kind': {'fieldId': 'f6', 'config': {'options': [{'name': '产品需求'}]}},
                    'sub_kind': {'fieldId': 'f7', 'config': {'options': [{'name': '硬件方向'}]}},
                    'contact': {'fieldId': 'f8'},
                }},
                'milestones': {'fields': {}},
                'sites': {'fields': {}},
            },
        }

    def plan_one(self, **extra):
        config = self.build_config()
        state = {
            'projects': [{'id': 'p1', 'title': '甲项目', 'raw_cells': {}}],
            'records': [], 'milestones': [], 'sites': [],
        }
        cand = {'op': 'create_record', 'project': '甲项目', 'title': '反馈一',
                'description': '正文', 'date': '2026-11-09', 'kind': '产品需求',
                'source': {'id': 's1', 'name': '群聊', 'quote': '原话'}}
        cand.update(extra)
        return n.plan(config, state, [cand])

    def test_sub_kind_is_written(self):
        result = self.plan_one(sub_kind='硬件方向')
        cells = result['actions'][0]['cells']
        self.assertEqual(cells.get('f7'), '硬件方向')

    def test_invalid_sub_kind_is_dropped(self):
        """选项里没有的值不能写——否则 DWS 会拒整条写入。"""
        result = self.plan_one(sub_kind='不存在的方向')
        self.assertNotIn('f7', result['actions'][0]['cells'])

    def test_contact_needs_resolved_user_not_name(self):
        """对接人必须是 user 对象，不能直接写姓名。

        ⚠️ 这条测试原来断言「写姓名」，而那正是引发事故的行为：
        2026-11-09 19:07 那轮 5 条记录全废在
        `user field value must be an array of user objects`。
        **测试断言的可能是错误行为**——发现规格变了就要改测试，别迁就它。
        """
        result = self.plan_one(contact='张三')
        self.assertNotIn('f8', result['actions'][0]['cells'])

    def test_contact_written_when_already_resolved(self):
        result = self.plan_one(contact=[{'userId': 'u1', 'corpId': 'c1'}])
        self.assertEqual(result['actions'][0]['cells'].get('f8'),
                         [{'userId': 'u1', 'corpId': 'c1'}])

    def test_missing_optional_fields_do_not_break(self):
        """没给 sub_kind/contact 时照常写入，不能因此失败。"""
        result = self.plan_one()
        cells = result['actions'][0]['cells']
        self.assertNotIn('f7', cells)
        self.assertNotIn('f8', cells)


if __name__ == '__main__':
    unittest.main()
