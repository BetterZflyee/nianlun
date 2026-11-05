"""合并场地的编号归一。

场地表把「591W」和「591WA」合并成一条记录，编号写成「591W&591WA」。
而消息原文、ASR 转写和模型输出通常只说其中一半——不归一的话，合法场地
会被判成「不在场地表中」，整轮决策作废。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n

CODES = ['021WE', '027W', '571WA&571WF', '591W&591WA', '755RA', '791XE', '791XS']
BUNDLE = {'tables': {'sites': [{'code': c} for c in CODES]}}


class AliasTests(unittest.TestCase):
    def test_each_half_maps_to_the_merged_code(self):
        aliases = g.site_code_aliases(set(CODES))
        self.assertEqual(aliases['591W'], '591W&591WA')
        self.assertEqual(aliases['591WA'], '591W&591WA')
        self.assertEqual(aliases['571WA'], '571WA&571WF')
        # 非合并编号不产生别名
        self.assertNotIn('755RA', aliases)

    def test_single_code_is_never_aliased_to_itself(self):
        self.assertEqual(g.site_code_aliases({'755RA'}), {})


class NormalizeTests(unittest.TestCase):
    def fix(self, title):
        return g.normalize_site_codes(BUNDLE, {'title': title})['title']

    def test_half_code_is_completed(self):
        self.assertEqual(self.fix('591W区相机调试'), '591W&591WA区相机调试')
        self.assertEqual(self.fix('591WA 现场验收'), '591W&591WA 现场验收')

    def test_merged_code_is_left_alone(self):
        self.assertEqual(self.fix('591W&591WA 联合验收'), '591W&591WA 联合验收')

    def test_asr_traps_still_resolve(self):
        self.assertEqual(self.fix('755RD 设备到货'), '755RA 设备到货')
        self.assertEqual(self.fix('752A 到货'), '755RA 到货')

    def test_unknown_code_is_refused_with_the_known_list(self):
        with self.assertRaisesRegex(n.Error, '不在场地表中'):
            self.fix('888X 不存在的场地')

    def test_description_is_normalised_too(self):
        action = g.normalize_site_codes(BUNDLE, {'title': 'x', 'description': '591W 已完成调试'})
        self.assertEqual(action['description'], '591W&591WA 已完成调试')

    def test_quote_is_never_rewritten(self):
        """原文摘录是证据，改写它等于伪造引用。"""
        action = g.normalize_site_codes(BUNDLE, {'title': '591W 调试', 'quote': '591W 已完成调试'})
        self.assertEqual(action['quote'], '591W 已完成调试')

    def test_empty_site_table_skips_normalisation(self):
        """表里没有编号时不能把所有带数字的标题都判错。"""
        action = g.normalize_site_codes({'tables': {'sites': []}}, {'title': '591W 调试'})
        self.assertEqual(action['title'], '591W 调试')


if __name__ == '__main__':
    unittest.main()
