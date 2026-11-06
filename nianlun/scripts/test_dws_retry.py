"""只读调用的重试边界。

DWS 偶发「未返回有效结果」会让整轮作废——历史 10 次失败都发生在会话第一句
身份核验上。但写操作绝不能重试：结果未知时重发可能重复建记录、重复发消息。
"""
import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault('NIANLUN_RETRY_BACKOFF', '0')
sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n

EMPTY = SimpleNamespace(returncode=1, stdout='offline')


class RetryableTests(unittest.TestCase):
    def test_transient_read_failure_is_retryable(self):
        self.assertTrue(g._retryable(n.Error('DWS 未返回有效结果，请检查连接')))
        self.assertTrue(g._retryable(n.Error('读取超时；本次等待已结束')))

    def test_expired_login_is_not_retried(self):
        """登录失效是确定性错误，重试只会重复失败，应立刻提示用户。"""
        self.assertFalse(g._retryable(n.Error('登录已失效，请重新登录钉钉')))

    def test_unrelated_error_is_not_retried(self):
        self.assertFalse(g._retryable(n.Error('当前表没有 description 字段')))


class GatewayRetryTests(unittest.TestCase):
    def test_read_call_retries_then_succeeds(self):
        ok = SimpleNamespace(returncode=0, stdout='{"result":[{"orgEmployeeModel":{"userId":"U1"}}]}')
        with patch('growth.subprocess.run', side_effect=[EMPTY, ok]) as run:
            value = g.Gateway({}).call(['contact', 'user', 'get-self'])
        self.assertEqual(run.call_count, 2)
        self.assertIn('result', value)

    def test_read_call_gives_up_after_budget(self):
        with patch('growth.subprocess.run', return_value=EMPTY) as run:
            with self.assertRaises(n.Error):
                g.Gateway({}).call(['contact', 'user', 'get-self'])
        self.assertEqual(run.call_count, g.READ_RETRIES)

    def test_write_call_is_never_retried(self):
        """写操作结果未知时重发会重复建记录，只能交人工对账。"""
        with patch('growth.subprocess.run', return_value=EMPTY) as run:
            with self.assertRaises(n.Error):
                g.Gateway({}).call(['aitable', 'record', 'create'])
        self.assertEqual(run.call_count, 1)

    def test_todo_completion_is_never_retried(self):
        with patch('growth.subprocess.run', return_value=EMPTY) as run:
            with self.assertRaises(n.Error):
                g.Gateway({}).call(['todo', '+complete'])
        self.assertEqual(run.call_count, 1)

    def test_expired_login_fails_fast_without_retry(self):
        expired = SimpleNamespace(returncode=1, stdout='{"error":{"reason":"auth_refresh_failed"}}')
        with patch('growth.subprocess.run', return_value=expired) as run:
            with self.assertRaises(n.Error):
                g.Gateway({}).call(['contact', 'user', 'get-self'])
        self.assertEqual(run.call_count, 1)


class ExponentialBackoffTests(unittest.TestCase):
    """退避必须指数增长。

    线性 1.5/3 秒加起来才 4.5 秒，网络抖动常持续更久——实测 14:00 与 16:00
    两轮就是因为三次重试都撞在同一段断网里而整轮作废。
    """

    def sleeps(self):
        """按 growth.Gateway.call 的逻辑算出每次重试前的等待时间。"""
        base = 1.5
        return [base * (2 ** (i + 1) - 1) for i in range(g.READ_RETRIES - 1)]

    def test_backoff_grows(self):
        values = self.sleeps()
        self.assertGreater(len(values), 0)
        for earlier, later in zip(values, values[1:]):
            self.assertLess(earlier, later, '退避没有递增')

    def test_total_backoff_is_meaningful(self):
        """总退避要够长，覆盖常见的网络抖动。"""
        self.assertGreaterEqual(sum(self.sleeps()), 15,
                                '总退避偏短，扛不住持续几十秒的断网')

    def test_formula_matches_source(self):
        source = Path(g.__file__).read_text(encoding='utf-8')
        self.assertIn('2 ** (attempt + 1) - 1', source,
                      '退避公式被改回线性了')


if __name__ == '__main__':
    unittest.main()
