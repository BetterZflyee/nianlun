"""报告在窄屏下的可用性。

真实场景：飞哥可能在手机上看汇报。甘特的名字列原本固定 236px，手机屏放不下，
长场地名（「791XE 南昌（华东）陆运转笼中心（靠离卡）」）会被挤成三行还溢出。

三种方案实测对比后选了「两行截断」：
- 单行省略 → 「79...」「02...」，信息全丢
- 完全放开换行 → 一行一个字，像竖排，难读
- 两行截断 → 能看出是哪个场地，行高够
"""
import re
import unittest
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / 'assets' / 'report'


class MobileGanttTests(unittest.TestCase):
    def css(self):
        return (ASSETS / 'visual-blocks.css').read_text(encoding='utf-8')

    def media_block(self, width):
        """取出某个断点的**所有** @media 块内容（文件里同断点有多个）。"""
        css = self.css()
        marker = '@media(max-width:%dpx)' % width
        chunks = []
        start = 0
        while True:
            idx = css.find(marker, start)
            if idx < 0:
                break
            depth = 0
            for i in range(idx, len(css)):
                if css[i] == '{':
                    depth += 1
                elif css[i] == '}':
                    depth -= 1
                    if depth == 0:
                        chunks.append(css[idx:i + 1])
                        start = i
                        break
            else:
                break
        return ''.join(chunks)

    def test_narrow_screen_narrows_name_column(self):
        for width in (760, 520):
            block = self.media_block(width)
            self.assertIn('--name-col', block,
                          '%dpx 断点没有调整名字列宽度，长场地名会撑破' % width)

    def test_name_uses_two_line_clamp_not_ellipsis(self):
        block = self.media_block(760)
        self.assertIn('-webkit-line-clamp:2', block,
                      '名字应两行截断；单行省略会把「791XE 南昌」截成「79...」')
        # 允许换行到两行，不能强制 nowrap
        self.assertNotIn('white-space:nowrap', block,
                         '强制单行会把场地名截成「79...」，信息全丢')

    def test_row_height_grows_for_wrapped_names(self):
        """名字变两行后行高要跟着加大，否则相邻行会挤在一起。"""
        block = self.media_block(760)
        match = re.search(r'--g-row:(\d+)px', block)
        self.assertIsNotNone(match, '没有设置行高')
        self.assertGreaterEqual(int(match.group(1)), 50,
                                '行高太小，两行名字会压到下一行')

    def test_desktop_name_column_untouched(self):
        """桌面端的 236px 名字列不能被窄屏规则污染。"""
        css = self.css()
        self.assertIn('--name-col:236px', css)


if __name__ == '__main__':
    unittest.main()
