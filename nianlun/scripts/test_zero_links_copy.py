"""0 条引用时必须说明「这是正常结果」，不能让用户以为功能坏了。

## 背景

工作台「项目记忆」页原来只写：

```
505 篇 · 0 条引用
```

而同一页的核验状态显示「已核验 505 / 505 篇」「已完成当前目录的引用读取」。
**读取是成功的，只是这些记忆本身没有互链。**

## 为什么会这样

引用来自记忆正文里写下的 `[[wiki链接]]`。早期写入的记忆没有这种链接
（`growth.py` 直到 2026-11-07 才补上），所以新老混用时早期那批天然是 0。

用户看到「0 条引用」+「已核验 505/505」会困惑：到底读失败了，还是真没有？
原来的文案没有回答这个问题。

## 改法

0 条时显示「暂无引用」而不是「0 条引用」，并用 title 说明原因。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
VIEW = (Path(__file__).resolve().parent.parent
        / 'assets' / 'portal' / 'memory-view.js')


class ZeroLinksCopyTests(unittest.TestCase):
    def src(self):
        return VIEW.read_text(encoding='utf-8')

    def test_zero_state_uses_explicit_wording(self):
        self.assertIn('暂无引用', self.src())

    def test_zero_state_explains_reason(self):
        """要说明「不是读取失败」——这是用户最可能的误判。"""
        src = self.src()
        idx = src.index('暂无引用')
        nearby = src[max(0, idx - 600): idx + 800]
        self.assertIn('不是读取失败', nearby)

    def test_nonzero_state_keeps_count(self):
        """有引用时仍显示准确条数。"""
        self.assertIn('条引用`', self.src())

    def test_title_cleared_when_edges_exist(self):
        """有引用时要清掉 0 状态留下的 title，不能一直挂着解释。"""
        self.assertIn('removeAttribute("title")', self.src())


if __name__ == '__main__':
    unittest.main()
