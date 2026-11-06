"""界面冒烟脚本自身要可靠。

代码单测覆盖不了「页面点开是空的」——这一层只有真实加载才能发现。
ui_smoke.py 用 headless Chrome 逐页点击并统计关键元素。

写这个脚本时踩了两个坑，都在下面锁住了：
1. 探针延迟超过 virtual-time-budget 的有效期 → 结果永远「未执行」
2. 用 `id="p"[^>]*>` 宽松匹配 → 1.6MB 页面里撞到别处，取到空串
"""
import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / 'ui_smoke.py'


class UISmokeScriptTests(unittest.TestCase):
    def test_script_exists_and_compiles(self):
        self.assertTrue(SCRIPT.exists())
        r = subprocess.run([sys.executable, '-m', 'py_compile', str(SCRIPT)],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr[:300])

    def test_probe_delay_is_short(self):
        """探针延迟必须远小于 virtual-time-budget（9000ms）。"""
        src = SCRIPT.read_text(encoding='utf-8')
        import re
        delays = [int(x) for x in re.findall(r'\},(\d+)\);</script>', src)]
        self.assertTrue(delays, '找不到探针延迟')
        for d in delays:
            self.assertLess(d, 3000, f'延迟 {d}ms 太长，可能超出虚拟时间预算')

    def test_extraction_is_strict(self):
        """要从 1.6MB 页面里精确捞出探针结果，不能用宽松匹配。"""
        src = SCRIPT.read_text(encoding='utf-8')
        self.assertIn('<div id="p">([^<]*)</div>', src,
                      '要精确匹配注入的探针 div')
        self.assertIn('matches[-1]', src, '多次出现时取最后一个（我们注入的）')

    def test_covers_core_pages(self):
        src = SCRIPT.read_text(encoding='utf-8')
        for page in ('首页', '项目详情', '报告页'):
            self.assertIn(page, src, f'缺少 {page} 的冒烟')


if __name__ == '__main__':
    unittest.main()
