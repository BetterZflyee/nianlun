"""table_write 回读失败 → pending_verify，整轮不被掐死。

## 这条链路为什么必须测

2026-11-16 的 P0-b 修好了 `create_record` 的回读失败：拿到 record_id 就算写成功，
记 `pending_verify` 继续走。但 **`create_milestone` 走的是另一条路**：

    growth.apply() → op=='create_milestone' → table_write() → 回读失败 → raise

`create_milestone` 在**生长主路径**上。这里一旦抛错，整轮的死法是这样的：

```
table_write 抛错
  → apply() 抛错
  → _finish() 根本不执行
  → finish() 不跑
  → seen 不写、advance() 不推水位
  → 下一轮重采同样来源
```

**而且比全都不改更糟**：同一轮里 `create_record` 已经放行、`create_milestone`
却把整轮掐死，两条路径行为不一致，排查时会以为是两件事。

钉钉写后可见性延迟是**表格层面**的属性——实测在 records 表上达到 539 秒，
没有理由认为 milestones 表不会。所以两处必须同一个口径。

## 这四个用例守什么

1. 回读失败**不抛错**，返回 verify_pending + record_id
2. `apply()` 里的 create_milestone 回读失败后**继续往下走**，其余动作照做
3. 待核项**浮到外层回执**的 pending_verify 里（否则 recovery 扫不到、_finish 判不出）
4. 外层状态是 `pending_verify` 而不是 `verified`——不能把「没确认」说成「确认了」
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n


class MilestoneReadbackTests(unittest.TestCase):
    def test_table_write_returns_pending_instead_of_raising(self):
        """回读一直读不到时，必须返回 verify_pending，不能抛。"""
        config = {
            'base_id': 'b',
            'tables': {
                'milestones': {
                    'id': 'tm',
                    'fields': {
                        'title': {'fieldId': 'T'},
                        'status': {'fieldId': 'S'},
                        'description': {'fieldId': 'D'},
                        'project_ids': {'fieldId': 'P'},
                    },
                },
            },
        }
        calls = {'create': 0, 'query': 0}

        class GW:
            def call(self, args, **kw):
                if args[:3] == ['aitable', 'record', 'create']:
                    calls['create'] += 1
                    return {'newRecordIds': ['M_NEW']}
                if args[:2] == ['aitable', '+record-query']:
                    calls['query'] += 1
                    # 永远读不到：模拟钉钉写后可见性延迟
                    return {'records': []}
                raise AssertionError(args)

        with patch('growth.time.sleep', return_value=None):
            result = g.table_write(config, GW(), 'milestones',
                                   {'T': '某里程碑', 'S': '待核'})

        self.assertEqual(result['record_id'], 'M_NEW', '必须带回已写入的 record_id')
        self.assertFalse(result['verified'])
        self.assertTrue(result.get('verify_pending'), '必须标记待核而不是抛错')
        self.assertEqual(calls['create'], 1, '写入只能发一次，绝不重发')
        self.assertEqual(calls['query'], 4, '回读要重试 4 次')

    def test_verify_reason_tells_user_not_to_repeat(self):
        """被挡住的人要看到「别直接重做」，否则他还是会造出重复记录。"""
        config = {'base_id': 'b', 'tables': {'milestones': {
            'id': 'tm', 'fields': {'title': {'fieldId': 'T'}}}}}

        class GW:
            def call(self, args, **kw):
                if args[:3] == ['aitable', 'record', 'create']:
                    return {'newRecordIds': ['M_NEW']}
                return {'records': []}

        with patch('growth.time.sleep', return_value=None):
            result = g.table_write(config, GW(), 'milestones', {'T': '某里程碑'})
        reason = result['verify_reason']
        self.assertIn('M_NEW', reason, '必须给出 record_id 让人能去核对')
        self.assertIn('不会重复写入', reason, '必须说明系统核验不会重复写')
        self.assertIn('不要直接重做', reason, '必须劝住用户别直接重做')

    def test_verified_write_has_no_pending(self):
        """正常路径不受影响：读到就返回 verified=True，没有 verify_pending。"""
        config = {'base_id': 'b', 'tables': {'milestones': {
            'id': 'tm', 'fields': {'title': {'fieldId': 'T'}}}}}

        class GW:
            def call(self, args, **kw):
                if args[:3] == ['aitable', 'record', 'create']:
                    return {'newRecordIds': ['M_OK']}
                return {'records': [{'recordId': 'M_OK', 'cells': {'T': '某里程碑'}}]}

        result = g.table_write(config, GW(), 'milestones', {'T': '某里程碑'})
        self.assertTrue(result['verified'])
        self.assertNotIn('verify_pending', result)

    def test_create_milestone_pending_bubbles_to_outer_receipt(self):
        """create_milestone 的待核项必须浮到外层 pending_verify。

        不浮上去的话，外层只会看到 verified=False 却不知道该怎么办，
        recovery.overview() 也扫不到它——那等于把待核项藏起来。

        注意：`create_milestone` 在 growth.py 里出现三次——
        line ~939 是 validate 里的校验分支，~1384 才是 apply 里的**执行**分支，
        ~1509 是计数。必须定位执行分支。
        """
        src = (Path(__file__).resolve().parent / 'growth.py').read_text(encoding='utf-8')
        # 从 apply 的函数体开始找，避开 validate 里的同名字符串
        apply_at = src.index('def apply(config,folder,plan_file):')
        idx = src.index("elif op=='create_milestone':", apply_at)
        end = src.index("elif op=='create_todo':", idx)
        block = src[idx:end]
        self.assertIn('table_write', block, '执行分支必须走 table_write')
        self.assertIn('verify_pending', block,
                      'create_milestone 执行分支必须把待核项记进外层回执')
        self.assertIn("receipt.setdefault('pending_verify'", block,
                      '待核项要写进 receipt[pending_verify]')

    def test_apply_status_reflects_pending(self):
        """外层状态必须是 pending_verify，不能无条件写 verified。"""
        src = (Path(__file__).resolve().parent / 'growth.py').read_text(encoding='utf-8')
        self.assertIn(
            "receipt['status']='pending_verify' if pending_verify else 'verified'", src,
            '有未核项时不能把状态记成 verified')
        self.assertIn("_finish", src)

    def test_finish_gate_allows_pending_verify(self):
        """_finish 闸门必须放行 pending_verify，否则整轮仍标 failed。

        这是「修了个寂寞」的关��：apply 不抛、状态也记对了，但 _finish 拦下
        pending_verify → finish() 不跑 → seen 不写、水位不推 → 和修之前一模一样。
        """
        src = (Path(__file__).resolve().parent / 'growth.py').read_text(encoding='utf-8')
        idx = src.index("if d['actions'] and action_status not in")
        line = src[idx: src.index('\n', idx)]
        self.assertIn("'pending_verify'", line,
                      '_finish 闸门必须把 pending_verify 和 verified 一样放行')
        self.assertIn("'verified'", line)


if __name__ == '__main__':
    unittest.main()
