"""记忆写入必须带 wiki 链接，否则 3D 星图只有散点没有连线。

## 现象

工作台「项目记忆」页长期显示 `505 篇 · 0 条引用`，3D 星图 505 个点分成
12 个簇，**一条连线都没有**。

## 排查结论

- 读取正常：`relations()` 返回 `verified: True`，不是「读失败当空索引」
- GBrain 有建边能力：`link` / `unlink` / `backlinks` / `graph` 都可用
  （实测建一条边返回 `{"status":"ok"}`，已撤销，数据未污染）
- **根因在写入侧**：`growth.py` 写入的正文里没有一个 `[[wiki链接]]`，
  而 GBrain 的 markdown 边正是靠 `[[...]]` 建立的

正文里那个「## 相关记录」章节写着「项目来源与 AI 表格链接见上」——
**只有一句话，没有链接**。

`docs/VALIDATION_2.5.md` 记录过 2.5 版有 **176 条页面间引用**，现在 0 条，
所以这是个回归。

详见 `docs/KNOWN-GAP-记忆引用.md`。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
ROOT = Path(__file__).resolve().parent.parent.parent
GROWTH = Path(__file__).resolve().parent / 'growth.py'


class MemoryLinksGapTests(unittest.TestCase):
    def growth_src(self):
        return GROWTH.read_text(encoding='utf-8')

    def test_capture_content_has_link_section(self):
        """写入正文有「相关记录」章节——这个结构是对的，只是缺内容。"""
        self.assertIn('## 相关记录', self.growth_src())

    def test_gap_is_documented(self):
        """缺口必须写进文档，否则下一个人还得重新排查一遍。"""
        doc = ROOT / 'docs' / 'KNOWN-GAP-记忆引用.md'
        self.assertTrue(doc.exists(), '缺口文档不存在')
        text = doc.read_text(encoding='utf-8')
        self.assertIn('505 篇 · 0 条引用', text)
        self.assertIn('growth.py:793', text)
        self.assertIn('gbrain link', text)

    def test_doc_explains_why_not_hastily_fixed(self):
        """要说清「为什么不硬造链接」——这比急着修更重要。"""
        text = (ROOT / 'docs' / 'KNOWN-GAP-记忆引用.md').read_text(encoding='utf-8')
        self.assertIn('不能为了有连线而硬造关系', text)

    def test_doc_gives_actionable_fix(self):
        """文档要给出可执行的修法和验收标准。"""
        text = (ROOT / 'docs' / 'KNOWN-GAP-记忆引用.md').read_text(encoding='utf-8')
        self.assertIn('## 修的话怎么做', text)
        self.assertIn('## 验收标准', text)
        self.assertIn('gbrain link', text)


if __name__ == '__main__':
    unittest.main()
