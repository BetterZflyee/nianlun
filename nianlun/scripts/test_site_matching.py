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
    '深圳宝安航空转运枢纽',
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
            '755RA 深圳宝安航空转运枢纽',
        ])
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_trailing_supplement_is_tolerated(self):
        """场地名尾部带「（靠离卡）」这类补充，模型不写也算覆盖。"""
        errs = self.errors_for([
            '杭州萧山(城南)转运中心',
            '福州闽侯(兰圃)转运中心',
            '南昌（华东）陆运转笼中心',
            '西安汉唐转运中心',
            '深圳宝安航空转运枢纽',
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
            '755RA 深圳宝安航空转运枢纽',
        ])
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_city_alias_alone_is_not_enough(self):
        """只写城市名没写场地名，不能算覆盖。"""
        errs = self.errors_for([
            '杭州', '福州', '南昌', '西安',
        ])
        self.assertTrue([e for e in errs if '甘特漏了' in e], errs)


class CityCodeFormatTests(unittest.TestCase):
    """模型常写「杭州萧山 571WA&571WF」这种城市片区+编号格式，而不是表里的全名。"""

    def errors_for(self, labels):
        return report_brief.issues(gantt(labels), evidence(SITES))

    def test_city_plus_code_is_accepted(self):
        errs = self.errors_for([
            '南昌 791XE', '武汉吴家山 027W', '成都长兴 028W', '西安汉唐 029WE',
            '杭州萧山 571WA&571WF', '西安大件 029WH', '福州闽侯 591W&591WA',
            '深圳宝安 755RA',
        ])
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_short_city_name_still_matches(self):
        """「南昌（华东）陆运转笼中心」的主干只有 2 字，也要能匹配「南昌 791XE」。"""
        errs = self.errors_for([
            '南昌 791XE', '武汉吴家山 027W', '成都长兴 028W', '西安汉唐 029WE',
            '杭州萧山 571WA&571WF', '西安大件 029WH', '福州闽侯 591W&591WA',
            '深圳宝安 755RA',
        ])
        missing = [e for e in errs if '甘特漏了' in e]
        self.assertFalse([m for m in missing if '南昌' in m], missing)

    def test_ambiguous_city_prefix_is_not_enough(self):
        """「杭州」同时对应两个场地，只写城市不算覆盖。"""
        sites = ['杭州萧山(城南)转运中心', '杭州城南转运中心']
        draft = gantt(['杭州 571WA', '杭州 571WF'])
        errs = report_brief.issues(draft, evidence(sites))
        self.assertTrue([e for e in errs if '甘特漏了' in e], errs)


class DistrictAliasTests(unittest.TestCase):
    """表里写「深圳宝安」，甘特写「深圳航城」——同城不同称谓。

    这是地理知识差异，字符匹配判不出对错。同城只有一个场地时认作覆盖，
    有多个场地时必须写到片区级，否则真漏也放过去了。
    """

    def test_same_city_single_site_is_accepted(self):
        sites = ['深圳宝安航空转运枢纽']
        errs = report_brief.issues(gantt(['深圳航城 755RA']), evidence(sites))
        self.assertFalse([e for e in errs if '甘特漏了' in e], errs)

    def test_same_city_multiple_sites_is_not_enough(self):
        sites = ['深圳宝安航空转运枢纽', '深圳福永转运中心']
        errs = report_brief.issues(gantt(['深圳 755RA']), evidence(sites))
        self.assertTrue([e for e in errs if '甘特漏了' in e], errs)

    def test_different_city_is_still_reported(self):
        sites = ['深圳宝安航空转运枢纽']
        errs = report_brief.issues(gantt(['广州白云 755RA']), evidence(sites))
        self.assertTrue([e for e in errs if '甘特漏了' in e], errs)


if __name__ == '__main__':
    unittest.main()
