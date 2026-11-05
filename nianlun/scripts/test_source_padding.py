"""source_id 的 base64 填充容忍。

钉钉消息 id 形如 message:msgtYQZ...==，末尾的 == 是 base64 填充。模型引用时
常把它截掉，而 payload 完全正确。实测有一次整轮失败就是因为少了这两个字符。
只容忍填充符数量差异，绝不做模糊匹配——否则会把不同消息认成同一来源。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n

BUNDLE = {'sources': [
    {'id': 'message:msgtYQZTYaCkYSqdMnQ8p49aA==', 'name': '徐烨雷', 'text': '运营培训之前需要梳理出相应的 SOP'},
    {'id': 'message:plainid', 'name': '无填充', 'text': '没有 base64 填充的 id'},
    {'id': 'minutes:abc123', 'name': '听记', 'text': '听记正文'},
]}


class ResolveSourceTests(unittest.TestCase):
    def test_exact_id_resolves(self):
        self.assertEqual(g.resolve_source(BUNDLE, 'message:plainid')['name'], '无填充')

    def test_dropped_padding_still_resolves(self):
        """模型漏掉尾部 == 是最常见的引用偏差。"""
        found = g.resolve_source(BUNDLE, 'message:msgtYQZTYaCkYSqdMnQ8p49aA')
        self.assertIsNotNone(found)
        self.assertEqual(found['name'], '徐烨雷')

    def test_single_equals_still_resolves(self):
        found = g.resolve_source(BUNDLE, 'message:msgtYQZTYaCkYSqdMnQ8p49aA=')
        self.assertIsNotNone(found)

    def test_truncated_payload_is_rejected(self):
        """少了真实字符就不是同一条消息，必须拒绝。"""
        self.assertIsNone(g.resolve_source(BUNDLE, 'message:msgtYQZTYaCkYSqdMnQ8p49a'))

    def test_unknown_id_is_rejected(self):
        self.assertIsNone(g.resolve_source(BUNDLE, 'message:nope=='))

    def test_empty_id_is_rejected(self):
        for bad in ('', '   ', None, 123):
            self.assertIsNone(g.resolve_source(BUNDLE, bad), bad)


class EvidenceTests(unittest.TestCase):
    def test_quote_must_be_verbatim_from_the_resolved_source(self):
        action = {'source_id': 'message:msgtYQZTYaCkYSqdMnQ8p49aA', 'quote': '运营培训之前需要梳理出相应的 SOP'}
        found = g.evidence(BUNDLE, action)
        self.assertEqual(found['name'], '徐烨雷')

    def test_quote_from_the_wrong_source_is_rejected(self):
        """补回填充后仍要逐字核对：引用必须出自这条来源。"""
        action = {'source_id': 'message:msgtYQZTYaCkYSqdMnQ8p49aA', 'quote': '听记正文'}
        with self.assertRaisesRegex(n.Error, '逐字摘录'):
            g.evidence(BUNDLE, action)


if __name__ == '__main__':
    unittest.main()
