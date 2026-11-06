"""依赖项也要查格式，而且要先于「key 是否存在」检查。

真实故障（连续两轮，2026-11-07 04:31 和 05:00）：

```
节点「cross-site-metrics-comparison」的 depends_on 里有「k9CbkJLsIH」，
但节点列表里没有这个 key。可用的 key：benefit-report、cross-site-…
```

把这句当作「改个 key 名」的提示，模型下一稿还是写记录 ID。

**根因**：上一轮我给顶层 `key` 加了 `pattern` 和说明，但
`depends_on` 的 items 只声明了 `{'type': 'string'}`——**依赖项没有约束**。

两处一起改：
1. SCHEMA 的 `depends_on.items` 加同样的 pattern
2. `validate` 先查格式、再查存在性，两者报错不同
"""
import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning

TARGET = date(2026, 12, 31)


def node(key, offset=0, deps=()):
    return {'key': key, 'title': key, 'description': 'd',
            'days_before_deadline': offset, 'depends_on': list(deps)}


class DependsFormatTests(unittest.TestCase):
    def test_schema_constrains_depends_items(self):
        """SCHEMA 层面就要约束依赖项，不能只约束顶层 key。"""
        items = planning.SCHEMA['properties']['nodes']['items']['properties']['depends_on']['items']
        self.assertIn('pattern', items, 'depends_on 的每一项也要有 pattern')

    def test_record_id_in_depends_says_not_a_key(self):
        """记录 ID 混进依赖，报错要说「这不是节点编号」，而不是「不存在」。"""
        with self.assertRaises(Exception) as ctx:
            planning.validate({'rationale': 'r', 'nodes': [node('a-1', 0, ['xz0RA3Xnuf'])]}, TARGET)
        msg = str(ctx.exception)
        self.assertIn('这不是节点编号', msg)
        self.assertIn('不是表格里的记录 ID', msg)
        self.assertNotIn('没有这个 key', msg, '格式错不该报成「不存在」')

    def test_valid_dependency_passes(self):
        got = planning.validate({'rationale': 'r', 'nodes': [
            node('a-1', 5), node('b-2', 0, ['a-1'])]}, TARGET)
        self.assertEqual(len(got), 2)

    def test_missing_key_still_reports_separately(self):
        """格式合法但不存在时，仍然报「没有这个 key」并列出可用的。"""
        with self.assertRaises(Exception) as ctx:
            planning.validate({'rationale': 'r', 'nodes': [node('a-1', 0, ['nope-xx'])]}, TARGET)
        msg = str(ctx.exception)
        self.assertIn('没有这个 key', msg)
        self.assertIn('a-1', msg, '要列出可用的 key')


if __name__ == '__main__':
    unittest.main()
