"""记忆页必须分批渲染。

实测（2026-11-07 06:40）：记忆页一次渲染 **1764 个 DOM 节点**，切换要
约 500ms，页面明显卡顿。而且副标题写「1764 条记录」，用户以为全都在
页面上——其实卡在滚动里。

改成分批：默认 60 条 + 「再显示 60 条」按钮，副标题说明「已显示最近
60 条，共 1764 条」。
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

HOME_JS = Path(__file__).resolve().parent.parent / 'assets' / 'home.js'


class MemoryPagingTests(unittest.TestCase):
    def src(self):
        return HOME_JS.read_text(encoding='utf-8')

    def test_page_size_constant_exists(self):
        self.assertIn('MEM_PAGE', self.src())

    def test_memory_page_slices_rows(self):
        src = self.src()
        self.assertIn('all.slice(0,shown)', src, '只渲染前 shown 条')
        self.assertIn('Math.min(ui.memoryShown||MEM_PAGE,all.length)', src)

    def test_subtitle_states_partial_view(self):
        """副标题必须说清「已显示多少 / 共多少」。"""
        src = self.src()
        self.assertIn('已显示最近', src)
        self.assertIn('共 ${all.length} 条记录', src)

    def test_load_more_button_present(self):
        src = self.src()
        self.assertIn('data-memory-more', src)
        self.assertIn('再显示', src)

    def test_load_more_click_increments(self):
        src = self.src()
        self.assertIn('ui.memoryShown=(ui.memoryShown||MEM_PAGE)+MEM_PAGE', src)

    def test_filter_change_resets_paging(self):
        """换项目筛选要回到第一页，否则会看到新项目的一堆空档。"""
        src = self.src()
        self.assertIn('ui.memoryProject=ev.target.value;ui.memoryShown=MEM_PAGE', src)


if __name__ == '__main__':
    unittest.main()
