"""对接人姓名 → user 对象：从上下文点名的人补上，可多个（飞哥 2026-11-15 补规则）。

## 这条链路为什么之前一直断

v2.12.3 已加过姓名解析，但放在了 `table_write` 里。真实生长写入走的是
`n.apply_plan`（从 table_plan 的 cells 直接写），**根本不经过 table_write 的
contact 分支**——所以解析只对「界面手工编辑」生效，生长路径的姓名进 n.plan()
就被当字符串丢掉了。这就是对接人 2% 覆盖率修了一轮没动的真原因。

现在把解析移到 validate 之前（enrich_contacts），三处 validate（重试/主/resume）
统一从这一个入口走。

## 规则

> 搜寻会话和上下文，看里面是谁来安排、谁来对接，对接人就写谁，可以一个或多个。

所以：
- 姓名来自来源里点名的人（模型直接给出，可 '张三' 或 '张三、李四' 或列表）
- 列 multiple=true → 拆成多个逐个解析合并
- 与 R 推导共存：模型点名的优先（明确的人 > 结构默认）
- 解析不了（同名歧义/搜不到）→ 丢该名字并记 unresolved，**绝不阻断整条写入**
"""
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g

CONFIG = json.loads(Path.home().joinpath('.config/nianlun/config.json').read_text())


def one_action(contact):
    return {'actions': [{'op': 'create_record', 'project': '甲', 'contact': contact}]}


class SplitNameTests(unittest.TestCase):
    def test_single_name(self):
        self.assertEqual(g.split_contact_names('张三'), ['张三'])

    def test_multiple_separators(self):
        for raw, expect in [('张三、李四', ['张三', '李四']),
                            ('张三，李四', ['张三', '李四']),
                            ('张三 李四', ['张三', '李四']),
                            ('张三,李四;', ['张三', '李四'])]:
            self.assertEqual(g.split_contact_names(raw), expect, raw)

    def test_list_of_names(self):
        self.assertEqual(g.split_contact_names(['张三', '李四']), ['张三', '李四'])

    def test_user_object_not_split(self):
        """已是 user 对象 → 返回 None，调用方保持原样（R 推导注入的形态）。"""
        self.assertIsNone(g.split_contact_names([{'userId': 'u1'}]))

    def test_empty(self):
        self.assertIsNone(g.split_contact_names(''))
        self.assertIsNone(g.split_contact_names(None))


class EnrichContactsTests(unittest.TestCase):
    def run_enrich(self, contact, resolve_map, gw=None):
        decision = one_action(contact)
        fake_gw = gw or mock.Mock()
        with mock.patch.object(g, 'resolve_contact',
                               side_effect=lambda gw_, name, cache=None: resolve_map.get(name)):
            out = g.enrich_contacts(CONFIG, decision, gw=fake_gw, cache={})
        return out['actions'][0]

    def test_single_name_resolved(self):
        a = self.run_enrich('张三', {'张三': [{'corpId': 'c', 'userId': 'u1'}]})
        self.assertEqual(a['contact'], [{'corpId': 'c', 'userId': 'u1'}])

    def test_multiple_names_all_resolved(self):
        a = self.run_enrich('张三、李四',
                            {'张三': [{'userId': 'u1'}], '李四': [{'userId': 'u2'}]})
        self.assertEqual(a['contact'], [{'userId': 'u1'}, {'userId': 'u2'}])

    def test_partial_resolution_keeps_what_worked(self):
        """一个能解析一个歧义 → 保留能解析的，歧义的记 unresolved，不整体丢。"""
        a = self.run_enrich('张三、王五', {'张三': [{'userId': 'u1'}], '王五': None})
        self.assertEqual(a['contact'], [{'userId': 'u1'}])
        self.assertEqual(a['contact_names_unresolved'], ['王五'])

    def test_all_fail_removes_contact_not_blocks(self):
        a = self.run_enrich('张三', {'张三': None})
        self.assertNotIn('contact', a)
        self.assertEqual(a['contact_names_unresolved'], ['张三'])

    def test_existing_user_object_untouched_no_resolve_call(self):
        """R 推导已注入的对象 → 不调 resolve，原样保留。"""
        calls = []

        def spy(gw_, name, cache=None):
            calls.append(name)
            return [{'userId': 'X'}]
        decision = one_action([{'userId': 'keep'}])
        with mock.patch.object(g, 'resolve_contact', side_effect=spy):
            out = g.enrich_contacts(CONFIG, decision, gw=mock.Mock(), cache={})
        self.assertEqual(out['actions'][0]['contact'], [{'userId': 'keep'}])
        self.assertEqual(calls, [], '已解析对象不应再触网')

    def test_idempotent_second_run(self):
        """二次 enrich 结果完全一致（fresh==plan 比对依赖这点）。"""
        decision = one_action('张三')
        with mock.patch.object(g, 'resolve_contact',
                               side_effect=lambda gw_, n, cache=None: [{'userId': 'u1'} if n == '张三' else None]):
            first = g.enrich_contacts(CONFIG, json.loads(json.dumps(decision)), gw=mock.Mock(), cache={})
            second = g.enrich_contacts(CONFIG, first, gw=mock.Mock(), cache={})
        self.assertEqual(json.dumps(first, sort_keys=True),
                         json.dumps(second, sort_keys=True))

    def test_actions_without_contact_skipped(self):
        decision = {'actions': [{'op': 'create_record', 'project': '甲'}]}
        with mock.patch.object(g, 'resolve_contact',
                               side_effect=AssertionError('不该被调用')):
            out = g.enrich_contacts(CONFIG, decision, gw=mock.Mock(), cache={})
        self.assertEqual(out['actions'][0], {'op': 'create_record', 'project': '甲'})


class ValidateWiringTests(unittest.TestCase):
    def test_validate_calls_enrich_before_plan(self):
        """enrich 必须在 validate 内、plan 之前——否则姓名进 plan 被丢。"""
        # 必须用 __file__ 定位：unittest discover 的工作目录是仓库根，
        # 相对路径 Path('growth.py') 会 FileNotFoundError（2026-11-15 实踩）。
        src = (Path(__file__).resolve().parent / 'growth.py').read_text(encoding='utf-8')
        v = src[src.index('def validate('):]
        self.assertLess(v.index('enrich_contacts'), v.index('n.plan('))

    def test_zero_contact_never_touches_network(self):
        """没有姓名时绝不建 Gateway/扫表——保护所有现有单测不联网。"""
        import nianlun as n
        bundle = {'run_id': 'r', 'binding': n.digest(CONFIG), 'sources': [],
                  'tables': {'records': [], 'milestones': [], 'projects': [
                      {'id': 'p', 'title': '甲', 'project_ids': [], 'raw_cells': {}}]},
                  'todos': [], 'coverage': [], 'identity': {}}
        decision = {'run_id': 'r', 'summary': 's', 'actions': []}
        decision['binding'] = None
        with mock.patch.object(g, 'Gateway', side_effect=AssertionError('不该建网关')):
            try:
                g.validate(CONFIG, dict(bundle, binding=n.digest(CONFIG)),
                           dict(decision, binding=n.digest(CONFIG)))
            except AssertionError as exc:
                self.fail('零姓名不应建网关：' + str(exc))
            except Exception:
                pass  # 其他校验失败可接受，关键是没有触网


if __name__ == '__main__':
    unittest.main()
