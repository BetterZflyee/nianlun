"""待确认里程碑的统计口径。

表里「待核」和「待核对」两种写法并存（各 20 / 15 个），代码只写「待核」，
另一个是历史遗留。首页原来用严格相等过滤：

    S.milestones.filter(m => m.status === '待核')

于是「待核对」的那 15 个全被漏掉——20 个 vs 实际 35 个，少报 43%。
"""
import re
import unittest
from pathlib import Path

HOME = Path(__file__).resolve().parent.parent / 'assets' / 'home.js'


class PendingStatusTests(unittest.TestCase):
    def source(self):
        return HOME.read_text(encoding='utf-8')

    def test_both_spellings_are_pending(self):
        """筛选必须同时认两种写法。"""
        src = self.source()
        self.assertIn("'待核','待核对'", src,
                      '待确认的白名单里缺「待核对」')

    def test_pending_uses_whitelist_not_strict_equality(self):
        src = self.source()
        self.assertNotIn("m.status==='待核'", src,
                         '还在用严格相等，会漏掉「待核对」')
        self.assertIn('PENDING.includes(m.status)', src)

    def test_status_badge_still_matches_prefix(self):
        """状态标签用正则匹配，'待核对' 含 '待核' 前缀，本来就对——别改成严格比较。"""
        src = self.source()
        self.assertIn('/待核|待确认|未开始/', src)


    def test_empty_status_is_pending(self):
        """空状态也要算待确认。

        实表里「成都028W验收」（11-10，就在眼前）status 是空的——它最该被确认，
        却因为 status==='' 不被任何筛选捕获。
        """
        src = self.source()
        self.assertIn("'待核','待核对',''", src,
                      'PENDING 白名单没包含空状态，空状态里程碑会漏掉')


if __name__ == '__main__':
    unittest.main()
