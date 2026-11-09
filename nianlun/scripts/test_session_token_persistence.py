"""会话令牌必须跨刷新、跨重启存活。

## 飞哥报的问题（2026-11-09）

> 我重新打开这个网页的时候，它就会让我重新接入，但是接入过程中都会失效。
> 像这种问题，它不具有可移植性。

截图显示「工作台会话已失效，请重新打开年轮」。

## 根因：两个「唯一来源」同时被毁掉

`app.js` 原来是这样：

```js
let token = localFile ? null
  : location.hash.slice(1) || sessionStorage.getItem("nianlun.session");
if (!localFile && location.hash) {
  sessionStorage.setItem("nianlun.session", token);
  history.replaceState(null, "", location.pathname);   // ← 把 #token 抹掉
}
```

1. token 只存 **sessionStorage** —— 关掉标签页就清空
2. 读到之后**立刻把地址栏的 `#token` 抹掉** —— URL 里也没有了

于是刷新/重开时，两个来源都没了。

**注意 token 文件本身是稳定的**：`stable_token()` 有「读到就用、没有才生成」
的逻辑，实测 `~/.config/nianlun/portal/token` 从 10-26 至今没变过。
问题完全在前端怎么保存它。

## 改法

- 改存 **localStorage**（跨标签页、跨浏览器重启都在）
- **不再抹掉 hash**，并且从存储恢复时把它补回地址栏
  —— 「复制链接」永远能拿到可用地址

## 为什么这关系到可移植性

token 存在本机。换机器、换端口、重装都会变。如果页面还依赖「用户手上
那份 URL」作为唯一凭证，那它就注定不可移植。localStorage 让浏览器自己
记住，用户不需要保存任何东西。
"""
import unittest
from pathlib import Path

PORTAL = Path(__file__).resolve().parent.parent / 'assets' / 'portal'


class TokenPersistenceTests(unittest.TestCase):
    def src(self):
        return (PORTAL / 'app.js').read_text(encoding='utf-8')

    def test_uses_local_storage(self):
        """必须用 localStorage——sessionStorage 关标签页就没了。"""
        self.assertIn('localStorage', self.src())

    def test_does_not_erase_hash(self):
        """不能再把地址栏的 #token 抹掉。

        允许 replaceState 把 hash **补回**，但不能只传 pathname 抹掉它。
        """
        src = self.src()
        self.assertNotIn(
            'history.replaceState(null, "", location.pathname);',
            src,
            '不能抹掉地址栏的 session token',
        )

    def test_restores_hash_from_storage(self):
        """从存储恢复时要把 hash 写回地址栏，这样「复制链接」可用。"""
        src = self.src()
        self.assertIn('location.pathname + "#" + token', src)

    def test_hash_takes_priority(self):
        """带 hash 的链接（新发的）要优先于存储里的旧 token。"""
        src = self.src()
        idx = src.index('function readToken')
        block = src[idx: idx + 700]
        self.assertLess(block.index('fromHash'), block.index('localStorage.getItem'))

    def test_server_token_is_stable(self):
        """服务端 stable_token 必须「有则复用」，不能每次重新生成。"""
        server = (Path(__file__).resolve().parent / 'server.py').read_text(encoding='utf-8')
        idx = server.index('def stable_token')
        block = server[idx: idx + 600]
        self.assertIn('read_text', block)
        self.assertIn('if len(value)>=32:return value', block)


if __name__ == '__main__':
    unittest.main()
