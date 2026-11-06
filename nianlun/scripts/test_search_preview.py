"""搜索结果必须限量预览，否则一次塞几百个节点。

实测（2026-11-07 07:00）：搜「车辆」命中 **3 个项目 + 160 条记忆 + 6 个节点**，
面板里塞了 **309 个可点击元素**，每敲一个字符都要重渲染全部。

改成每类最多预览 8 条，并在下方说明「还有 152 条未显示」——数量如实
告诉用户，但页面只画一部分。
"""
import sys
import unittest
from pathlib import Path

HOME_JS = Path(__file__).resolve().parent.parent / 'assets' / 'home.js'


class SearchPreviewTests(unittest.TestCase):
    def src(self):
        return HOME_JS.read_text(encoding='utf-8')

    def test_preview_constant_exists(self):
        self.assertIn('SEARCH_PREVIEW', self.src())

    def test_results_are_sliced(self):
        src = self.src()
        for role in ('psAll', 'rsAll', 'msAll'):
            self.assertIn(f'{role}.slice(0,SEARCH_PREVIEW)', src,
                          f'{role} 要限量，不能全渲染')

    def test_total_count_still_accurate(self):
        """截断后总数必须仍然如实显示。"""
        src = self.src()
        self.assertIn('${psAll.length} 个项目', src)
        self.assertIn('${rsAll.length} 条记忆', src)

    def test_overflow_hint_shown(self):
        """被截断时要告诉用户还有多少。"""
        src = self.src()
        self.assertIn('search-more', src)
        self.assertIn('还有 ${total-shown} 条未显示', src)

    def test_overflow_hint_has_style(self):
        css = (Path(__file__).resolve().parent.parent / 'assets' / 'style.css').read_text(encoding='utf-8')
        self.assertIn('.search-more{', css)


if __name__ == '__main__':
    unittest.main()
