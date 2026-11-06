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


class UnknownSectionTests(unittest.TestCase):
    """模型回了原文里没有的小节标题时，不能追加成新小节。

    实测踩过：2 节的报告被合并成 3 节，因为代码在找不到对应小节时把片段
    追加到了末尾。修订的语义是「改已有内容」，追加等于凭空加一节——
    报告的章节结构就被破坏了。
    """

    def test_unknown_heading_keeps_previous_intact(self):
        got = rb.merge_revision(PREV, '## 不存在的小节\n\n内容')
        self.assertEqual(got, PREV, '认不出对哪段的修订就该原样保留')
        self.assertEqual(got.count('\n## '), PREV.count('\n## '), '不能多出小节')

    def test_two_section_document_not_inflated(self):
        two = 'Lead: x\n\n## A · 推进\n\n内容A [R1]。\n\n## 风险\n\n内容B [R2]。\n'
        got = rb.merge_revision(two, '## 进展\n\n新内容')
        self.assertEqual(got.count('\n## '), 2, '两节的报告不能被撑成三节')

class WholeVsFragmentTests(unittest.TestCase):
    """篇幅大不等于「这是一整篇」。

    真实事故（2026-11-07 05:12 那轮）：模型修订时只返回了一个 visual 图块，
    3404 字节；而原文是 3874 字节。判据 `len(body) >= len(prev) * 0.8` 成立，
    于是被当成完整稿**直接替换**——整篇报告的 Lead 和所有小节全没了。

    校验立刻报「须以 Lead: 核心结论开头」，但那时正文已经丢了，那一轮报告
    直接作废，连带的 6 个项目也没生成。
    """

    def test_large_visual_block_is_not_whole_document(self):
        prev = PREV  # 有 Lead 和三个小节
        big_visual = ('```visual\n{"type":"gantt","rows":['
                      + ','.join('{"label":"行%d"}' % i for i in range(200))
                      + ']}\n```')
        self.assertGreater(len(big_visual), len(prev) * 0.8, '前提：它确实够长')
        got = rb.merge_revision(prev, big_visual)
        self.assertTrue(got.strip().startswith('Lead:'), '正文不能丢')
        self.assertEqual(got.count('\n## '), prev.count('\n## '))

    def test_fragment_starting_with_visual_is_not_whole(self):
        frag = '```visual\n{"type":"status","items":[]}\n```'
        got = rb.merge_revision(PREV, frag)
        self.assertTrue(got.strip().startswith('Lead:'))

    def test_real_whole_document_still_replaces(self):
        """整篇（有 Lead、小节数不减、不以图块开头）仍然要能替换。"""
        revised = PREV.replace('第一段', '改过的第一段')
        got = rb.merge_revision(PREV, revised)
        self.assertIn('改过的', got)
        self.assertEqual(got.count('\n## '), 3)

    def test_whole_document_missing_lead_is_treated_as_fragment(self):
        """原文有 Lead，新稿没有 → 不能当整篇用。"""
        no_lead = PREV.split('\n', 1)[1]  # 去掉 Lead 行
        got = rb.merge_revision(PREV, no_lead)
        self.assertTrue(got.strip().startswith('Lead:'), 'Lead 不能被抹掉')


if __name__ == '__main__':
    unittest.main()
