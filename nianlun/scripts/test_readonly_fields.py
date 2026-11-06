"""只读字段不能进「写后验证」的预期值。

真实事故（2026-11-07 03:38 那轮生长）：

    模型给的 date: 2026-11-06
    表的 date 字段类型: createdTime（只读，系统自动填）
    实际写入: 2026-11-07
    → 验证拿 2026-11-06 比对 2026-11-07，必然不等
    → 整轮报「写后验证失败或未知」
    → 但记录其实**已经写成功了**

这类误报最坑的地方：数据是对的，系统说错了。用户看到「失败」会去重试或
人工核对，白白折腾。而且因为 `receipt` 里留了 `in_flight`，重试还会被
「上次写入结果待核验」挡住。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n


CONFIG = {'tables': {'records': {'fields': {
    'date': {'fieldId': 'NGYOE2V', 'type': 'createdTime', 'readonly': True},
    'title': {'fieldId': 'TITLE1', 'type': 'text'},
    'kind': {'fieldId': 'KIND1', 'type': 'singleSelect'},
}}}}


class ReadonlyFieldTests(unittest.TestCase):
    def test_detects_created_time_field(self):
        self.assertTrue(n.readonly_field(CONFIG, 'records', 'NGYOE2V'))

    def test_editable_field_is_not_readonly(self):
        self.assertFalse(n.readonly_field(CONFIG, 'records', 'TITLE1'))
        self.assertFalse(n.readonly_field(CONFIG, 'records', 'KIND1'))

    def test_unknown_field_is_not_treated_as_readonly(self):
        """未知字段交给下游 writable_cells 的 UNKNOWN_FIELD 处理。"""
        self.assertFalse(n.readonly_field(CONFIG, 'records', 'NOPE'))

    def test_action_cells_exclude_readonly(self):
        """文档化：构造 action 时必须先过滤，否则验证必然误报。"""
        import inspect
        src = inspect.getsource(n.generate_plan) if hasattr(n, 'generate_plan') else ''
        if not src:
            # 找构造 action 的地方
            import re
            whole = Path(n.__file__).read_text(encoding='utf-8')
            self.assertIn("readonly_field(config, 'records', k)", whole,
                          '构造 action 时要剔除只读字段')
        else:
            self.assertIn('readonly_field', src)


if __name__ == '__main__':
    unittest.main()
