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


if __name__ == '__main__':
    unittest.main()
