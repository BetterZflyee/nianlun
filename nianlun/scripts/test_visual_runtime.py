"""交互运行时的注入白名单必须和渲染分支一致。

这是本轮踩到的坑：`visual-blocks.js` 的 `option()` 我补了 gantt 分支，
但 `report_blocks.enhance()` 的白名单只有 graph/bar/line——甘特图根本不会
注入运行时，页面上连「交互图表」按钮都不出现。**补的分支等于白写。**

判断依据必须是「这个类型会不会输出 rv-spec + rv-interactive 容器」：
- graph / bar / line / gantt → 走 else 分支，输出两个容器 → 需要运行时
- status / matrix            → 走各自独立分支，不输出容器 → 不需要
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_blocks


class VisualRuntimeWhitelistTests(unittest.TestCase):
    RUNTIME_KINDS = ('graph', 'bar', 'line', 'gantt')
    STATIC_KINDS = ('status', 'matrix')

    def source(self):
        return Path(report_blocks.__file__).read_text(encoding='utf-8')

    def test_whitelist_covers_all_interactive_kinds(self):
        src = self.source()
        match = re.search(r'data-recap-visual="\(\?:([a-z|]+)\)"', src)
        self.assertIsNotNone(match, '找不到运行时注入白名单')
        kinds = set(match.group(1).split('|'))
        for kind in self.RUNTIME_KINDS:
            self.assertIn(kind, kinds, f'{kind} 会输出交互容器，但白名单里没有它')

    def test_whitelist_excludes_static_kinds(self):
        """status/matrix 不输出容器，放进去只会白注入 650KB。"""
        src = self.source()
        match = re.search(r'data-recap-visual="\(\?:([a-z|]+)\)"', src)
        kinds = set(match.group(1).split('|'))
        for kind in self.STATIC_KINDS:
            self.assertNotIn(kind, kinds, f'{kind} 不需要交互运行时')

    def test_every_whitelisted_kind_has_option_branch(self):
        """白名单里的类型，option() 必须有分支，否则落到柱状图兜底会抛异常。"""
        js = (Path(__file__).resolve().parent.parent / 'assets/report/visual-blocks.js').read_text(encoding='utf-8')
        src = self.source()
        match = re.search(r'data-recap-visual="\(\?:([a-z|]+)\)"', src)
        kinds = set(match.group(1).split('|'))
        for kind in kinds:
            if kind in ('bar', 'line'):
                continue  # 这两个就是兜底分支本身
            self.assertIn(f"c.type==='{kind}'", js,
                          f'{kind} 在白名单里但 option() 没有分支，会落进柱状图兜底而报错')


if __name__ == '__main__':
    unittest.main()
