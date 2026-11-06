"""本轮生长不完整时，要告诉用户下一步做什么。

工作台原来只显示「部分来源待补采」——用户不知道：
是等下一轮自动补？还是自己现在要处理？还是点哪里看详情？

实表最近一轮（11-06 20:41）就是 partial，因为报告被校验规则拦下。
"""
import unittest
from pathlib import Path

HOME = Path(__file__).resolve().parent.parent / 'assets' / 'home.js'


class PartialHintTests(unittest.TestCase):
    def source(self):
        return HOME.read_text(encoding='utf-8')

    def test_partial_status_has_action_hint(self):
        src = self.source()
        self.assertIn('有环节未完成', src,
                      'partial 状态要说明怎么继续，不能只贴一个标签')
        self.assertIn('查看这轮生长', src, '要指出去哪里看详情')
        self.assertIn('下一轮会自动补', src, '要说明是否需要人工处理')

    def test_hint_only_shows_for_partial(self):
        """完成状态下不该出现这段提示，否则用户会以为正常轮次也需要处理。"""
        src = self.source()
        marker = "${g.status==='partial'?"
        self.assertIn(marker, src, '提示要按状态条件渲染')

    def test_complete_status_still_simple(self):
        src = self.source()
        self.assertIn("g.status==='complete'?'本轮已完成'", src)


if __name__ == '__main__':
    unittest.main()
