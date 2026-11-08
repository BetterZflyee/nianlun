"""内网请求必须绕过系统代理，否则 dsh 一律 502。

## 事故（2026-11-08）

今天 12:00–17:00 **连续 6 轮生长全部卡住**，只采集完数据、推理一步没走。
`com.zhufei.nianlun.tick` 退出码 1，错误是：

```
dsh: SERVER: 502 status code (no body)
```

## 排查过程（走了三条岔路）

1. **以为是凭证丢失** —— `dsh headless` 直跑报
   `MISSING_CREDENTIAL: no credential for provider route "sf-llm"`。
   但 `~/.dsh/.credentials.yaml` 的 `refs` 里 `SF_LLM_API_KEY` 明明有值，
   而且 `dsh_api_key()` 能读到 283 字符。**这条排除。**
2. **以为是网络不通** —— 但直连 hub 返回 HTTP 400（0.2 秒），
   `chat/completions` 也能正常返回，说明服务活着。**这条排除。**
3. **真正原因** —— `runtime_env()` 会从系统代理设置注入
   `HTTP_PROXY` / `HTTPS_PROXY`（实测 `http://127.0.0.1:7897`），
   **却没有 `NO_PROXY`**。于是 dsh 访问公司内网
   `llm-model-hub-apis.sf-express.com` 时走了出境代理，出不去 → 502。

装着 Key、不带代理跑 dsh：立刻返回「收到」。
装着 Key、带上代理再跑：复现 502。

## 教训

**502 不等于「服务挂了」。** 它在有代理的机器上常常是「请求被送错地方了」。
先量「带代理 / 不带代理」两种情况的差异，比反复猜凭证和网络快得多。
"""
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness


class InternalNetworkBypassTests(unittest.TestCase):
    def test_no_proxy_is_set(self):
        env = harness.runtime_env()
        self.assertTrue(env.get('NO_PROXY') or env.get('no_proxy'),
                        'runtime_env 必须设置 NO_PROXY')

    def test_internal_domains_are_bypassed(self):
        env = harness.runtime_env()
        value = env.get('NO_PROXY') or env.get('no_proxy') or ''
        for domain in ('.sf-express.com', '.dingtalk.com', '.aliyuncs.com'):
            self.assertIn(domain, value, f'{domain} 必须绕过代理')

    def test_localhost_is_bypassed(self):
        env = harness.runtime_env()
        value = env.get('NO_PROXY') or env.get('no_proxy') or ''
        self.assertIn('127.0.0.1', value)
        self.assertIn('localhost', value)

    def test_existing_no_proxy_is_preserved(self):
        """用户自己配的 NO_PROXY 不能被覆盖掉。"""
        old = os.environ.get('NO_PROXY')
        os.environ['NO_PROXY'] = 'example.test'
        try:
            env = harness.runtime_env()
            self.assertIn('example.test', env['NO_PROXY'])
            self.assertIn('.sf-express.com', env['NO_PROXY'])
        finally:
            if old is None:
                os.environ.pop('NO_PROXY', None)
            else:
                os.environ['NO_PROXY'] = old

    def test_both_case_variants_set(self):
        """大小写两种都设——不同工具读的变量名不一样。"""
        env = harness.runtime_env()
        self.assertEqual(env.get('NO_PROXY'), env.get('no_proxy'))


if __name__ == '__main__':
    unittest.main()
