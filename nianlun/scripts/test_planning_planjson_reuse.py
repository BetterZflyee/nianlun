"""plan.json 里的 existing 是裁剪过的，不能按未裁剪的字段去读。

真实故障（2026-11-07 07:26 那轮）：`planning_error: 'raw_cells'`——
一个光秃秃的 KeyError，看不出是哪行。

根因：

```python
# 第 257 行：为了压 prompt，existing 只留 6 个字段
existing = [{k: v for k, v in m.items()
             if k in ('id','title','date','status','notes','description')} ...]
# 第 285 行：把它存进 plan.json
n.save(plan_path, {'nodes': nodes, 'existing': existing, ...})
# 第 324 行：从 plan.json 读回来，去取一个从来没存的字段
if row['raw_cells'] != before['raw_cells']:   # ← KeyError
```

**同一个对象，写的时候裁剪了，读的时候当成完整的。**
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


class PlanJsonReuseTests(unittest.TestCase):
    def body(self):
        src = Path(planning.__file__).read_text(encoding='utf-8')
        idx = src.index('def run(')
        rest = src[idx + 1:]
        nxt = rest.find('\ndef ')
        return src[idx: idx + 1 + nxt] if nxt > 0 else rest

    def test_existing_is_trimmed_before_saving(self):
        """existing 存进 plan.json 前会裁剪——这是性能需要，但要记住它变了。"""
        self.assertIn("if k in ('id','title','date','status','notes','description')",
                      self.body())

    def test_no_raw_cells_access_on_before(self):
        """before 来自裁剪过的 existing，不能取 raw_cells。"""
        body = self.body()
        self.assertNotIn("before['raw_cells']", body,
                         'existing 没存 raw_cells，这样取会 KeyError')

    def test_change_detection_uses_kept_fields(self):
        """改写后要按保留字段比对，并在报错里点名哪些字段变了。"""
        body = self.body()
        self.assertIn('changed_fields', body)
        self.assertIn('里程碑在倒排期间被修改', body)

    def test_row_raw_cells_still_available(self):
        """row 来自实时 fetch，raw_cells 仍然可用——不要一起改掉。"""
        body = self.body()
        self.assertIn("row['raw_cells']", body)


if __name__ == '__main__':
    unittest.main()
