"""移动端不能有横向溢出。

飞哥要求「可以在不同平台使用」。这轮用 CDP 真实模拟 390px 视口验证，
发现长文本（时区 `Asia/Singapore`、流程箭头串 `Harness 理解 →…→ 钉钉摘要`）
是不含空格的连续片段，浏览器不会自动断行，会撑出卡片。

⚠️ 验证方法上的坑：`chrome --headless --window-size=390` **不会真的把
视口设成 390**。实测 `document.body.clientWidth` 仍是 500。所以用窗口参数
截图看到的「截断」是假象——必须用 CDP 的
`Emulation.setDeviceMetricsOverride` 才是真移动视口。
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
CSS = Path(__file__).resolve().parent.parent / 'assets' / 'style.css'


class MobileLayoutTests(unittest.TestCase):
    def css(self):
        return CSS.read_text(encoding='utf-8')

    def mobile_block(self):
        src = self.css()
        start = src.index('@media(max-width:650px)')
        nxt = src.find('@media', start + 10)
        return src[start: nxt if nxt > 0 else len(src)]

    def test_mobile_breakpoint_exists(self):
        self.assertIn('@media(max-width:650px)', self.css())

    def test_long_words_wrap_when_narrow(self):
        """窄屏下长词必须能断行，否则撑出卡片。"""
        block = self.mobile_block()
        self.assertIn('overflow-wrap:anywhere', block,
                      '长文本（时区、箭头流程串）要能在任意位置断行')

    def test_growth_panel_text_is_covered(self):
        block = self.mobile_block()
        self.assertIn('.growth-panel p', block, '生长面板的说明文字要覆盖到')
        self.assertIn('.note', block, '提示条也要覆盖到')

    def test_bottom_nav_on_mobile(self):
        """侧栏在窄屏要变成底部导航。"""
        block = self.mobile_block()
        self.assertIn('.sidebar{height:auto', block.replace(' ', ''))
        self.assertIn('bottom:0', block)
        self.assertIn('flex-direction:row', block, '导航要横排')

    def test_viewport_meta_present(self):
        """页面必须有 viewport meta，否则移动端按 980px 渲染。"""
        html = (Path(__file__).resolve().parent.parent.parent
                / 'deliverables' / '年轮.html')
        if not html.exists():
            self.skipTest('工作台尚未生成')
        src = html.read_text(encoding='utf-8')
        self.assertIn('width=device-width', src)


if __name__ == '__main__':
    unittest.main()
