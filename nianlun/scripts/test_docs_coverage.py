"""手册必须覆盖会让人卡住的实际场景。

写手册最容易犯的错：只写「怎么启动」「怎么配置」，不写「出问题了怎么办」。
而人真正打开手册的时刻，恰恰是出问题的时候。

这轮补第十三章「看到『写入结果未知』该怎么办」——因为系统刻意不重试写操作，
用户第一次看到那句话会不知道是该等、该重发、还是该手动补。
"""
import sys
import unittest
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent.parent / 'docs' / 'TROUBLESHOOTING.md'


class DocsCoverageTests(unittest.TestCase):
    def text(self):
        if not DOCS.exists():
            self.skipTest('手册文件不存在')
        return DOCS.read_text(encoding='utf-8')

    def test_write_uncertainty_is_documented(self):
        """「写入结果未知」必须有一整章说明。"""
        t = self.text()
        self.assertIn('写入结果未知', t)
        self.assertIn('为什么系统不自动重试', t)

    def test_explains_repeat_risk(self):
        """要说清「重发会重复建记录」这个后果，否则用户会觉得系统偷懒。"""
        t = self.text()
        self.assertIn('重复建记录', t)

    def test_gives_a_verification_command(self):
        """要给出可执行的核对方法，不能只说「请核验」。"""
        t = self.text()
        self.assertIn('Counter', t)
        self.assertIn('同名重复', t)

    def test_documents_latency_variance(self):
        """DWS 延迟波动要写出来，否则「10 秒」会被当成常态。"""
        t = self.text()
        self.assertIn('180 秒', t)
        idx = t.find('延迟波动')
        self.assertGreater(idx, 0, '要说明 DWS 延迟随网络波动')


if __name__ == '__main__':
    unittest.main()
