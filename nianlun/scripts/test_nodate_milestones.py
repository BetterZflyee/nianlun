"""没有日期的里程碑也要能看见。

实表里 13 个里程碑没填日期——标题里却写着「11月30日」「10月20日」这些，
是录入时漏填了 date 字段，不是真的没有时间点。

原来首页的过滤器：

    S.milestones.filter(m => m.date && m.status !== '已达成')

`m.date &&` 把它们整个滤掉了，界面上看不到，用户不知道自己有活儿没排期。
而 `milestoneList` 里已经写了 `m.date || '日期待定'`——说明设计时考虑过，
只是首页那处漏了。
"""
import re
import unittest
from pathlib import Path

HOME = Path(__file__).resolve().parent.parent / 'assets' / 'home.js'


class NoDateMilestoneTests(unittest.TestCase):
    def source(self):
        return HOME.read_text(encoding='utf-8')

    def test_home_filter_does_not_require_date(self):
        src = self.source()
        self.assertNotIn("filter(m=>m.date&&m.status!=='已达成')", src,
                         '按日期存在与否过滤会让无日期节点彻底隐形')
        self.assertIn("filter(m=>m.status!=='已达成')", src)

    def test_sort_handles_missing_date(self):
        """无日期的排最后，但不能让 undefined.compare 抛错。"""
        src = self.source()
        self.assertIn("(a.date||'9999')", src, '排序要给无日期一个兜底值')

    def test_upcoming_day_badge_guards_empty_date(self):
        """首页「待跟进」用 m.date.slice(8)，空日期会直接抛错并中断整页渲染。"""
        src = self.source()
        self.assertNotIn('${e(m.date.slice(8))}', src,
                         'm.date 可能为空，slice 之前必须判空')
        self.assertIn("m.date?e(m.date.slice(8))", src)

    def test_milestone_list_shows_placeholder(self):
        """详情页早在设计时就考虑了无日期，别被改没了。"""
        src = self.source()
        self.assertIn("m.date||'日期待定'", src)


if __name__ == '__main__':
    unittest.main()
