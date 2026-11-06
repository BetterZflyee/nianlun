"""甘特场地覆盖校验不能因为括号/后缀写法差异就误判。

场地表里叫「杭州萧山(城南)转运中心」（半角括号），模型画甘特时写
「571WA 杭州萧山（城南）转运中心」（全角括号）。逐字比对会把一份已经画全的
甘特判成漏项，两次修订都救不回来，整份报告白跑。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_brief

SITES = [
    '杭州萧山(城南)转运中心',
    '福州闽侯(兰圃)转运中心',
    '南昌（华东）陆运转笼中心（靠离卡）',
    '西安汉唐转运中心',
]


def evidence(titles):
    return [{'key': 'S%d' % i, 'kind': 'sites', 'title': t} for i, t in enumerate(titles, 1)]


def gantt(labels):
    import json
    cfg = {'type': 'gantt', 'title': '各场地推进状态', 'caption': '说明',
           'rows': [{'label': x, 'state': 'active', 'stage': '进行中'} for x in labels]}
    return '```visual\n' + json.dumps(cfg, ensure_ascii=False) + '\n```'


class SiteCoverageTests(unittest.TestCase):
    def errors_for(self, labels):
        draft = gantt(labels)
        return report_brief.issues(draft, evidence(SITES))

    def test_fullwidth_parens_are_equivalent(self):
        """全角括号 vs 半角括号不该算漏项。"""
        errs = self.errors_for([
            '571WA 杭州萧山（城南）转运中心',
            '591W 福州闽侯（兰圃）转运中心',
            '791XE 南昌（华东）陆运转笼中心',
            '029WE 西安汉唐转运中心',
        ])
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_trailing_supplement_is_tolerated(self):
        """场地名尾部带「（靠离卡）」这类补充，模型不写也算覆盖。"""
        errs = self.errors_for([
            '杭州萧山(城南)转运中心',
            '福州闽侯(兰圃)转运中心',
            '南昌（华东）陆运转笼中心',
            '西安汉唐转运中心',
        ])
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_real_missing_site_still_reported(self):
        """真的漏了场地仍然要报——归一化不能把校验放松到失效。"""
        errs = self.errors_for([
            '杭州萧山（城南）转运中心',
            '福州闽侯（兰圃）转运中心',
            '南昌（华东）陆运转笼中心',
        ])
        missing = [e for e in errs if '甘特漏了' in e]
        self.assertTrue(missing, errs)
        self.assertIn('西安汉唐', missing[0])

    def test_whitespace_does_not_matter(self):
        errs = self.errors_for([
            '571WA  杭州萧山（城南）转运中心 ',
            '591W 福州闽侯（兰圃）转运中心',
            '791XE 南昌（华东）陆运转笼中心',
            '029WE 西安汉唐转运中心',
        ])
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_city_alias_alone_is_not_enough(self):
        """只写城市名没写场地名，不能算覆盖。"""
        errs = self.errors_for([
            '杭州', '福州', '南昌', '西安',
        ])
        self.assertTrue([e for e in errs if '甘特漏了' in e], errs)


if __name__ == '__main__':
    unittest.main()
