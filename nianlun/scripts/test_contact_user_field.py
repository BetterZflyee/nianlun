"""「对接人」是 user 类型列，必须写 user 对象，不能写姓名。

## 事故（2026-11-09 19:07）

飞哥点「运行一次生长」，跑了 **863 秒**后失败：

```
DWS aitable record create：DWS 未返回有效结果，请检查连接与执行记录；
写入结果未知，请核验原结果，未自动重发
```

计划写 5 条记录，**一条都没写进去**，回执 `results` 为空。

## 根因链（三层，缺一不可）

**① 我上一轮加的功能写错了字段格式**

为了让「对接人」不再空着（实测覆盖率只有 2%），我让它写中文姓名，
注释还写着「写姓名由 DWS 解析」——**这是错的假设**。真实报错：

```
user field value must be an array of user objects
```

user 类型列的值必须是 `[{corpId, userId}]`。

**② 错误被归进了「写入结果未知」**

DWS 返回 `category: internal`，不在 `auth/validation/discovery` 豁免里，
于是被当成「可能已写入」。用户看到「未知」会以为写成功了，**实际整条都没写**。
这是最坏的一种误导。

**③ 写后验证比不过 user 数组**

就算写成功，`equivalent()` 对 list 是严格相等，而回读会**多出服务端补的
corpId**：写 `[{'userId':'x'}]`，读回来是 `[{'corpId':'y','userId':'x'}]` → 判不等。

## 改法

- `n.plan()` 只接受已解析的 user 对象；传姓名就跳过并记入 dropped（带原因）
- `growth.resolve_contact()` 用 `contact user search` 把姓名解析成 userId：
  - **名字必须完全相等**（搜索是模糊的，「梁玉」也会搜出「梁玉标」）
  - 同名多人 → 放弃（怕挂到离职员工名下）
  - 解析失败 → 放弃，绝不阻断整条记录写入
- `equivalent()` 对「对象数组」按子集比较

## 实测

```
解析结果: [{"userId": "01438639"}]      ← 梁玉标
✅ 写入并验证通过, recordId: Gp5vvdnRo2, verified: True
  对接人: [{"corpId": "ding8360a0...", "userId": "01438639"}]
```

## 教训

**报错说「未知」的时候，先确认「到底写没写」，不要急着找别的原因。**
我这次又是从「命令名 / 参数」开始查，绕了三层才回到数据本身。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n
import growth

ROOT = Path(__file__).resolve().parent


class EquivalentUserArrayTests(unittest.TestCase):
    def test_accepts_server_added_fields(self):
        """回读会多出 corpId，必须仍判相等。"""
        self.assertTrue(n.equivalent(
            [{'corpId': 'c1', 'userId': 'u1'}], [{'userId': 'u1'}]))

    def test_rejects_wrong_user(self):
        self.assertFalse(n.equivalent(
            [{'corpId': 'c1', 'userId': 'other'}], [{'userId': 'u1'}]))

    def test_rejects_different_length(self):
        self.assertFalse(n.equivalent(
            [{'userId': 'u1'}, {'userId': 'u2'}], [{'userId': 'u1'}]))

    def test_still_handles_scalars(self):
        """别把「列表比较」的放宽带到所有值上。"""
        self.assertTrue(n.equivalent('abc', 'abc'))
        self.assertFalse(n.equivalent('abc', 'abd'))
        self.assertTrue(n.equivalent('2026-11-09T12:00:00+08:00', '2026-11-09'))


class ContactWriteTests(unittest.TestCase):
    def plan_with(self, contact):
        config = {
            'base_id': 'b', 'profile': None,
            'tables': {
                'projects': {'fields': {'status': {'fieldId': 'ps', 'config': {}}}},
                'records': {'fields': {
                    'title': {'fieldId': 'f1'},
                    'description': {'fieldId': 'f2'},
                    'project_ids': {'fieldId': 'f3'},
                    'date': {'fieldId': 'f4'},
                    'status': {'fieldId': 'f5', 'config': {'options': [{'name': '开放'}]}},
                    'kind': {'fieldId': 'f6', 'config': {'options': [{'name': '产品需求'}]}},
                    'contact': {'fieldId': 'f8'},
                }},
                'milestones': {'fields': {}}, 'sites': {'fields': {}},
            },
        }
        state = {'projects': [{'id': 'p1', 'title': '甲', 'raw_cells': {}}],
                 'records': [], 'milestones': [], 'sites': []}
        cand = {'op': 'create_record', 'project': '甲', 'title': 't',
                'description': 'd', 'date': '2026-11-09', 'kind': '产品需求',
                'source': {'id': 's', 'name': 'n', 'quote': 'q'}}
        if contact is not None:
            cand['contact'] = contact
        return n.plan(config, state, [cand])

    def test_resolved_user_is_written(self):
        result = self.plan_with([{'corpId': 'c', 'userId': 'u'}])
        self.assertEqual(result['actions'][0]['cells'].get('f8'),
                         [{'corpId': 'c', 'userId': 'u'}])

    def test_plain_name_is_not_written(self):
        """姓名绝对不能直接落进 user 列——这是 5 条记录全废的原因。"""
        result = self.plan_with('梁玉标')
        self.assertNotIn('f8', result['actions'][0]['cells'])

    def test_dropped_reason_mentions_how_to_fix(self):
        result = self.plan_with('梁玉标')
        dropped = result['actions'][0].get('dropped') or []
        joined = ' '.join(dropped)
        self.assertIn('contact', joined)
        self.assertIn('userId', joined)


class ResolveContactTests(unittest.TestCase):
    class FakeGW:
        def __init__(self, rows):
            self.rows = rows

        def call(self, args):
            return {'result': self.rows}

    def test_exact_match_resolves(self):
        gw = self.FakeGW([{'name': '梁玉标', 'userId': '01438639', 'corpId': 'c'}])
        self.assertEqual(growth.resolve_contact(gw, '梁玉标'),
                         [{'userId': '01438639', 'corpId': 'c'}])

    def test_fuzzy_only_match_is_rejected(self):
        """搜索是模糊的，名字不完全相等就不能用。"""
        gw = self.FakeGW([{'name': '梁玉标杆', 'userId': 'x'}])
        self.assertIsNone(growth.resolve_contact(gw, '梁玉标'))

    def test_duplicate_names_are_rejected(self):
        """同名多人绝不猜——可能挂到离职员工名下。"""
        gw = self.FakeGW([{'name': '张三', 'userId': 'a'},
                          {'name': '张三', 'userId': 'b'}])
        self.assertIsNone(growth.resolve_contact(gw, '张三'))

    def test_failure_does_not_raise(self):
        class Boom:
            def call(self, args):
                raise RuntimeError('network down')
        self.assertIsNone(growth.resolve_contact(Boom(), '张三'))

    def test_cache_avoids_repeat_search(self):
        calls = []

        class Counting:
            def call(self, args):
                calls.append(args)
                return {'result': [{'name': '甲', 'userId': 'u'}]}

        cache = {}
        gw = Counting()
        growth.resolve_contact(gw, '甲', cache)
        growth.resolve_contact(gw, '甲', cache)
        self.assertEqual(len(calls), 1)


if __name__ == '__main__':
    unittest.main()
