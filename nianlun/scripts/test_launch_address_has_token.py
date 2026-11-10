"""「打开年轮」必须给出**带 token 的完整地址**。

## 飞哥报的问题（2026-11-10）

> 我的年轮每次关掉网页之后都启动不了了

排查发现服务其实**一直在跑**（PID 86290，从 11-09 17:33 起，HTTP 200）。

## 真因

`launch.py` 最后返回：

```python
return {'running':True, 'address':url.split('#')[0], ...}
```

**`split('#')[0]` 把 `#token` 截掉了。**

页面靠地址里 `#` 后面那串才能进；少了它，页面就说「会话已失效」，
用户看到的现象就是「启动不了」。

服务本身没问题、session.json 也没问题、`running()` 也正确返回了带 token 的
完整 URL——**只有最后交出去的 address 被截断了**。

## 为什么这个 bug 特别隐蔽

`webbrowser.open(url)` 用的是**完整 url**（正确），所以从「打开年轮」这个
入口进去是好的；只有拿 `address` 返回值去打开的场景才会遇到。
用户感知不到这个区别，只会说「有时候能进有时候不能」。

## 教训

**中间变量验证通过 ≠ 交出去的结果正确。** 我前面验证了 `running()` 返回
带 token 的 URL 就以为没问题，但真正给用户的是下一行的 `address`。
"""
import ast
import sys
import unittest
from pathlib import Path

LAUNCH = Path(__file__).resolve().parent / 'launch.py'


class LaunchAddressTests(unittest.TestCase):
    def src(self):
        return LAUNCH.read_text(encoding='utf-8')

    def test_address_not_truncated(self):
        """address 不能再对 url 做 split('#')。"""
        src = self.src()
        self.assertNotIn("'address':url.split('#')[0]", src,
                         'address 不能截掉 #token，否则页面进不去')
        self.assertNotIn('"address":url.split("#")[0]', src)

    def test_address_equals_full_url(self):
        src = self.src()
        self.assertIn("'address':url", src)

    def test_url_also_returned(self):
        """同时给出 url 字段，调用方语义更清楚。"""
        self.assertIn("'url':url", self.src())

    def test_webbrowser_uses_full_url(self):
        """自动打开也必须用完整地址。"""
        self.assertIn('webbrowser.open(url)', self.src())


if __name__ == '__main__':
    unittest.main()
