"""静态资源的路由约定：路径在根上，不在 /assets/ 下。

## 为什么要有这个测试

第 78 轮我改了前端一个交互，刷新页面看不到变化。我按直觉 curl：

```bash
curl http://127.0.0.1:63890/assets/portal/memory-view.js
# → {"error": "页面不存在"}
```

**以为改动没生效**，差点回头改本来正确的代码。实际是 `server.py` 用了
一张固定路由表，路径都在根上：

```
/memory-view.js     ← 对
/assets/portal/...  ← 404
```

正确验证：

```bash
curl -s http://127.0.0.1:63890/memory-view.js | grep -c 'depth.disabled'
# → 1
```

## 两份文件

| 位置 | 用途 |
|---|---|
| `nianlun/assets/portal/` | 源码，开发改这里 |
| `~/.local/share/nianlun/core/nianlun/assets/portal/` | 生产副本，服务读这里 |

改完源码要 `cp` 到 `core/` 再重启服务。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
SERVER = Path(__file__).resolve().parent / 'server.py'


class AssetRouteContractTests(unittest.TestCase):
    def src(self):
        return SERVER.read_text(encoding='utf-8')

    def test_routes_are_root_level(self):
        """静态资源路由都在根路径上。

        注意：memory-view.js 这类**不是硬编码的**，而是动态生成：
            files.update({"/"+name: name for name in (..., "memory-view.js", ...)})
        所以断言要分别查——硬编码的那批查字符串，动态那批查生成表达式。
        我第一次没注意这点，写成了查 '/memory-view.js'，永远找不到。
        """
        src = self.src()
        # 硬编码的
        for name in ('constellation.js', 'galaxy-model.js', 'app.js', 'style.css'):
            self.assertIn("'/" + name + "'", src, f'{name} 应在根路径路由表里')
        # 动态生成的：前缀是 "/"+name
        self.assertIn('"/"+name:name', src)
        self.assertIn('"memory-view.js"', src)

    def test_no_assets_prefix_route(self):
        """不能有 /assets/ 前缀的路由（那是我误以为的路径）。"""
        self.assertNotIn("'/assets/portal", self.src())

    def test_assets_point_at_skill_dir(self):
        """ASSETS 指向 n.SKILL/assets/portal——即服务所在那份代码。"""
        self.assertIn("ASSETS=n.SKILL/'assets/portal'", self.src())

    def test_troubleshooting_documents_this(self):
        """手册要写清「改了没变化」怎么查，否则下一个人还得重踩。"""
        doc = Path(__file__).resolve().parent.parent.parent / 'docs' / 'TROUBLESHOOTING.md'
        text = doc.read_text(encoding='utf-8')
        self.assertIn('/assets/portal/memory-view.js', text)
        self.assertIn('curl -s http://127.0.0.1:63890/memory-view.js', text)


if __name__ == '__main__':
    unittest.main()
