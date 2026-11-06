"""DWS 写操作绝不能重试，但读操作应该有退避。

这是一条**安全边界**，不是性能优化：

- 写操作超时后重发，可能**重复建记录、重复发消息**，事后再怎么对账都晚了
- 读操作重试是安全的，网络抖动时多试几次能救回整轮

实测（2026-11-07 07:26）：`DWS aitable +record-update：DWS 未返回有效结果`
——那一轮倒排的里程碑没写进去，但系统**没有自动重发**，这是对的，因为
写入结果未知。

同时发现 DWS 的延迟波动很大：网络差时单次 10 秒以上，恢复后只有 1.2 秒。
所以超时设 180 秒是合理的——宁可慢，不要误判成失败。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth


class DwsRetryPolicyTests(unittest.TestCase):
    def source(self):
        return Path(growth.__file__).read_text(encoding='utf-8')

    def test_write_calls_are_not_retried(self):
        """写操作 attempts 必须是 1。"""
        src = self.source()
        self.assertIn("attempts = 1 if dws_transport.is_write(args) else READ_RETRIES", src)

    def test_read_calls_have_retries(self):
        self.assertGreaterEqual(growth.READ_RETRIES, 2)

    def test_timeout_is_long_enough(self):
        """单次 DWS 调用 180 秒——网络差时 10 秒级延迟很常见，不能设太短。"""
        src = self.source()
        self.assertIn('timeout=180', src)

    def test_write_timeout_message_says_result_unknown(self):
        """写超时的报错必须说「结果未知、可能已提交」，不能让人以为没写。"""
        src = self.source()
        idx = src.index('except subprocess.TimeoutExpired')
        after = src[idx: idx + 500]
        self.assertIn('写入结果未知', after)
        self.assertIn('不自动重发', after)


if __name__ == '__main__':
    unittest.main()
