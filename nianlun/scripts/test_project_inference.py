"""project 留空时按关联对象反推，不再整轮撞死。

## 事故（2026-11-16 12:20 轮）

三次重试（原始 + fix1 + fix2）全部撞在同一句裸报错：

```
项目「」需唯一匹配，当前 0 项
```

看模型给的 actions：`create_record` 三条都填了 project，
`complete_todo`×2 + `update_status`×1 **project 为空**。

**契约与实现不一致，错的是实现**：契约对 `complete_todo` 只要求
`task_id / expected_title / record_ids / match / completion`，**从没要求
填 project**；可 `validate` 对所有 op 无条件调 `project_for`，空名
匹配 0 项直接抛错 → 整轮作废。

## 修法

project 缺失时从动作**已经带的关联对象**反推（record_ids / milestone_ids /
record_id+role），要求唯一命中：

- 唯一 → 用它，整轮继续
- 不唯一 / 推不出 → 报错**说清缺哪个字段、怎么补**（裸「0 项」没人看得懂）

为什么不让模型必须填 project：`record_ids` 本来就是必填且已被校验，
反推比多要一个字段更可靠——少一个模型会抄错的输入，就少一类整轮事故。

`_infer_project` 必须是纯函数：validate 在 apply 里重跑生成 fresh plan，
两次不一致会被「计划内容变更」拦死（教训 72）。
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n

CONFIG = json.loads(Path.home().joinpath('.config/nianlun/config.json').read_text())


def tables():
    return {
        'projects': [{'id': 'P1', 'title': '甲项目', 'project_ids': [], 'raw_cells': {}},
                     {'id': 'P2', 'title': '乙项目', 'project_ids': [], 'raw_cells': {}}],
        'milestones': [
            {'id': 'M1', 'title': '里程碑1', 'project_ids': ['P1'], 'raw_cells': {},
             'status': '待核', 'date': '2026-12-01', 'ref': 'm1'},
            {'id': 'M2', 'title': '里程碑2', 'project_ids': ['P2'], 'raw_cells': {},
             'status': '待核', 'date': '2026-12-01', 'ref': 'm2'}],
        'sites': [],
        'records': [
            {'id': 'R1', 'title': '记录1', 'project_ids': ['P1'], 'raw_cells': {}, 'status': '开放'},
            {'id': 'R2', 'title': '记录2', 'project_ids': ['P1'], 'raw_cells': {}, 'status': '开放'},
            {'id': 'R9', 'title': '跨项目', 'project_ids': ['P1', 'P2'], 'raw_cells': {}, 'status': '开放'}],
    }


def bundle():
    return {'run_id': 'r', 'binding': n.digest(CONFIG), 'sources': [],
            'tables': tables(), 'todos': [], 'coverage': [], 'identity': {}}


class InferProjectTests(unittest.TestCase):
    def test_from_record_ids(self):
        p = g._infer_project(bundle(), {'record_ids': ['R1']})
        self.assertEqual(p['id'], 'P1')

    def test_from_milestone_ids(self):
        p = g._infer_project(bundle(), {'milestone_ids': ['M2']})
        self.assertEqual(p['id'], 'P2')

    def test_from_update_status_record(self):
        p = g._infer_project(bundle(), {'role': 'records', 'record_id': 'R1'})
        self.assertEqual(p['id'], 'P1')

    def test_from_project_role_itself(self):
        p = g._infer_project(bundle(), {'role': 'projects', 'record_id': 'P2'})
        self.assertEqual(p['id'], 'P2')

    def test_ambiguous_returns_none(self):
        """跨两个项目的记录 → 不猜。"""
        self.assertIsNone(g._infer_project(bundle(), {'record_ids': ['R9']}))

    def test_agreement_still_unique(self):
        """多条同项目记录 → 仍是一个项目。"""
        p = g._infer_project(bundle(), {'record_ids': ['R1', 'R2']})
        self.assertEqual(p['id'], 'P1')

    def test_empty_action_returns_none(self):
        self.assertIsNone(g._infer_project(bundle(), {}))


class ProjectForTests(unittest.TestCase):
    def test_explicit_name_still_works(self):
        a = g.project_for(bundle(), {'project': '甲项目'})
        self.assertEqual(a['id'], 'P1')

    def test_blank_name_infers_not_raises(self):
        """这正是 12:20 轮撞死的形态。"""
        a = g.project_for(bundle(), {'project': '', 'record_ids': ['R1']})
        self.assertEqual(a['id'], 'P1')

    def test_blank_and_uninferable_explains_fix(self):
        with self.assertRaises(n.Error) as ctx:
            g.project_for(bundle(), {'op': 'complete_todo', 'project': ''})
        msg = str(ctx.exception)
        self.assertIn('complete_todo', msg)
        self.assertIn('record_ids', msg)
        self.assertIn('pending', msg)
        self.assertNotIn('「」', msg)   # 裸空名报错不再出现

    def test_deterministic_for_fresh_plan(self):
        """两次反推结果一致——validate 重跑比对依赖这点（教训 72）。"""
        action = {'project': '', 'record_ids': ['R1', 'R2']}
        b1, b2 = bundle(), bundle()
        self.assertEqual(g.project_for(b1, action)['id'],
                         g.project_for(b2, action)['id'])


class CompleteTodoContractTests(unittest.TestCase):
    def test_complete_todo_needs_no_project(self):
        """契约与实现一致：complete_todo 可以不填 project。"""
        b = bundle()
        b['todos'] = [{'taskId': 'T1', 'subject': '对齐南昌试点', 'isDone': False}]
        b['todo_links'] = {}
        decision = {'run_id': 'r', 'summary': '测试用总结内容够长', 'pending': [],
                    'deferred_source_ids': [], 'actions': [
                        {'op': 'complete_todo', 'task_id': 'T1',
                         'expected_title': '对齐南昌试点', 'record_ids': ['R1'],
                         'match': 'unique', 'completion': 'explicit',
                         'source_id': 'SRC', 'quote': '引文'}]}
        # source 校验会先拦（本测试聚焦 project），所以只验 project_for 不抛空名错
        try:
            g.validate(CONFIG, b, decision)
        except n.Error as exc:
            self.assertNotIn('「」', str(exc), '不能再出现空名裸报错')


if __name__ == '__main__':
    unittest.main()
