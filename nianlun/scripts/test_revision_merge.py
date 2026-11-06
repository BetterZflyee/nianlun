"""修订返回片段时要合并回全文，不能当全文用。

性能问题源头：报告生成 2 次 + 修订 2 次 = 最多 4 次模型调用，每次都是**整篇
重写**。一份 5000 字报告写一次 2-3 分钟，7 个项目峰值 84 分钟——实测把整轮
生长拖到 29 分钟还没产出任何 HTML。

优化后修订只要求输出被改的段落。但这引入新风险：**片段当全文用会把报告截成
一片**。所以必须有合并逻辑，而且合并失败时宁可保留原文也不能丢内容。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_brief as rb


PREV = '''Lead: 总览一句话。

## 进展

第一段进展内容 [R1]。

## 卡点

卡点内容 [R2]。

## 下一步

下一步内容 [R3]。
'''


class MergeRevisionTests(unittest.TestCase):
    def test_whole_document_replaces(self):
        revised = PREV.replace('第一段', '改过的第一段')
        got = rb.merge_revision(PREV, revised)
        self.assertIn('改过的', got)
        self.assertEqual(got.count('\n## '), 3)

    def test_single_section_is_merged(self):
        frag = '## 卡点\n\n修正后的卡点内容 [R2][R9]。'
        got = rb.merge_revision(PREV, frag)
        self.assertIn('修正后的卡点', got)
        self.assertIn('## 进展', got, '其他小节必须保留')
        self.assertIn('## 下一步', got)
        self.assertEqual(got.count('\n## '), 3, '合并后仍是一篇完整三节报告')

    def test_visual_block_is_replaced(self):
        prev = PREV.replace('第一段进展内容 [R1]。', '```visual\n{"type":"status"}\n```')
        got = rb.merge_revision(prev, '```visual\n{"type":"status","title":"新的"}\n```')
        self.assertIn('新的', got)
        self.assertIn('## 卡点', got)

    def test_empty_response_keeps_previous(self):
        """模型没返回内容时不能把报告清空。"""
        self.assertEqual(rb.merge_revision(PREV, ''), PREV)
        self.assertEqual(rb.merge_revision(PREV, None), PREV)

    def test_garbage_never_destroys_previous(self):
        """乱码也不能丢原文——宁可留旧稿让下一轮再改。"""
        for junk in ('asdf', '## Z\n\n不存在的小节', '   '):
            got = rb.merge_revision(PREV, junk)
            # 三个原有小节必须都还在
            for heading in ('## 进展', '## 卡点', '## 下一步'):
                self.assertIn(heading, got, f'喂了 {junk!r} 之后丢了 {heading}')
            self.assertGreaterEqual(len(got), len(PREV), '不能比对原文更短')

    def test_revision_prompt_asks_for_partial(self):
        """文档化：提示词要求只输出改动段落，否则优化白做。"""
        src = Path(rb.__file__).read_text(encoding='utf-8')
        self.assertIn('只输出**需要修改的完整段落**', src)


if __name__ == '__main__':
    unittest.main()
