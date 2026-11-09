"""本机别名都要能访问工作台。

## 飞哥报的问题（2026-11-09，第二次）

> 为什么我每次去连接这个链接的时候，它就一直提醒我这个问题啊？
> （截图：「本次读取未完成 / 工作台会话已失效，请重新打开年轮」）

上一版我改的是前端 token 存储，但问题又出现了——说明我只修了表层。

## 真正的根因

`server.py` 的 Host 校验写死了：

```python
expected = '127.0.0.1:' + str(port)
if self.headers.get('Host') != expected:   # 严格相等
    return 403 主机地址不匹配
```

于是：

| 访问地址 | 结果 |
|---|---|
| `http://127.0.0.1:63890/` | 200 |
| `http://localhost:63890/` | **403** |

而前端把任何失败都渲染成「本次读取未完成 / 会话已失效」——用户看到
「会话失效」就去重新接入，但**真正的原因是地址写法不同**。

Host 校验的目的是**防 DNS 重绑定**（不让恶意域名解析到 127.0.0.1），
只要 Host 属于本机别名就同样安全，没必要限定某一种写法。

## 教训

**报错文案会把人引向错误的方向。** 403 显示成「会话失效」，我上一轮就
顺着这个错误方向去查 token 存储，白改了一版。校验失败要说清是哪种失败。
"""
import re
import unittest
from pathlib import Path

SERVER = Path(__file__).resolve().parent / 'server.py'


class LocalhostAliasTests(unittest.TestCase):
    def src(self):
        return SERVER.read_text(encoding='utf-8')

    def allowed_block(self):
        src = self.src()
        idx = src.index('def allowed(')
        return src[idx: idx + 2000]

    def test_accepts_localhost(self):
        self.assertIn("'localhost:'", self.allowed_block(),
                      'localhost 必须被接受，否则书签用 localhost 的人永远 403')

    def test_accepts_ipv6_loopback(self):
        block = self.allowed_block()
        self.assertTrue('[::1]:' in block or "'::1:'" in block,
                        'IPv6 回环地址也要认')

    def test_still_rejects_foreign_host(self):
        """放宽不等于放开——外部域名仍然必须拒绝（防 DNS 重绑定）。"""
        block = self.allowed_block()
        self.assertIn('if host not in hosts', block,
                      '必须仍然是白名单判断，不能改成「只要非空就通过」')

    def test_403_explains_which_host_was_rejected(self):
        block = self.allowed_block()
        self.assertIn('主机地址不匹配：', block,
                      '要说清收到的 Host 是什么，否则用户不知道错在哪')

    def test_401_gives_working_url(self):
        """401 要给出可直接打开的正确地址，而不是只说「已失效」。"""
        block = self.allowed_block()
        self.assertIn('/#', block)
        self.assertIn('portal/token', block)


if __name__ == '__main__':
    unittest.main()
