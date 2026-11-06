"""report_blocks 里不该有「第二条同功能实现」的死代码。

发现过程（2026-11-07 07:05）：看真实报告截图，觉得甘特图里程碑标签
重叠，就去改 `gantt_svg` —— 改了 42 行，跑测试通过，然后发现：

```python
def gantt_svg(config):  ...     # 65 行，**没有任何地方调用**
out.append(gantt_html(config, uid))   # 实际用的是这个
```

`gantt_html` 早就有完整的避让逻辑（实测 8 个标签挤在 8 天内会用 8 行
0→126px 排开，不重叠）。**我看截图判断「重叠」本身就是错的**。

两个教训：
1. **改之前先确认这段代码在不在调用链上**——改死代码是白干 42 行
2. **同功能两套实现，只有一套在跑**，另一套只会误导后来的读者
"""
import ast
import sys
import unittest
from pathlib import Path

SRC = Path(__file__).resolve().parent / 'report_blocks.py'


class ReportBlocksHygieneTests(unittest.TestCase):
    def source(self):
        return SRC.read_text(encoding='utf-8')

    def test_no_duplicate_gantt_implementations(self):
        """甘特只保留一套实现。"""
        src = self.source()
        self.assertIn('def gantt_html(', src)
        self.assertNotIn('def gantt_svg(', src,
                         'gantt_svg 是死代码，实际渲染走 gantt_html')

    def test_every_public_renderer_is_referenced(self):
        """模块里每个 gantt_/visual_/table_ 开头的函数都要有调用点。"""
        src = self.source()
        tree = ast.parse(src)
        defined = [n.name for n in ast.walk(tree)
                   if isinstance(n, ast.FunctionDef)
                   and n.name.startswith(('gantt_', 'visual_', 'table_'))]
        for name in defined:
            uses = src.count(name)
            self.assertGreater(uses, 1, f'{name} 定义了但没人调用（死代码）')

    def test_milestone_avoidance_still_present(self):
        """gantt_html 的标签避让不能被删——它保证密集日期不重叠。"""
        src = self.source()
        # 找 gantt_html 函数体
        idx = src.index('def gantt_html(')
        rest = src[idx + 1:]
        nxt = rest.find('\ndef ')
        body = src[idx: idx + 1 + nxt] if nxt > 0 else rest
        self.assertIn('top', body, '标签要有纵向错层')
        self.assertTrue('near_set' in body or 'far' in body or 'marks' in body)


if __name__ == '__main__':
    unittest.main()
