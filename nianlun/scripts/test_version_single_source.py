"""版本号必须只有一个来源。

## 为什么

2026-11-07 之前硬编码在 4 处：

```
packaging/build.py:15        VERSION = '2.9.2'
packaging/install.py:108     'version':'2.9.2'
nianlun/scripts/server.py:70 'version':'2.9.2'
nianlun/scripts/setup.py:21  VERSION = '2.9.2'
```

升版本要改 4 次。漏一处的后果是**前后不一致且不报错**——打包出来是 2.9.3，
界面还显示 2.9.2，只有用户看出不对才会发现。

## 现在

唯一来源 `nianlun/scripts/version.py`，其余全部 `from version import VERSION`。

`tools/check_version_sync.py` 会扫全仓库，发现硬编码就退出码 1。

## 实测

植入一行 `BUG_VERSION = '2.9.2'` 到 nianlun.py，检查工具立刻报：

```
✗ 发现 1 处硬编码 2.9.2：
  nianlun/scripts/nianlun.py:4
    BUG_VERSION = '2.9.2'
退出码:1
```
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import version

ROOT = Path(__file__).resolve().parent.parent.parent


class VersionSingleSourceTests(unittest.TestCase):
    def test_version_module_is_source(self):
        self.assertTrue(re.fullmatch(r'\d+\.\d+\.\d+', version.VERSION),
                        f'版本号格式不对：{version.VERSION}')

    def test_server_uses_module(self):
        src = (Path(__file__).resolve().parent / 'server.py').read_text(encoding='utf-8')
        self.assertIn('from version import VERSION', src)
        self.assertNotIn("'version':'2.9.2'", src)

    def test_setup_uses_module(self):
        src = (Path(__file__).resolve().parent / 'setup.py').read_text(encoding='utf-8')
        self.assertIn('from version import VERSION', src)
        self.assertNotIn("VERSION = '2.9.2'", src)

    def test_packaging_uses_module(self):
        build = (ROOT / 'packaging' / 'build.py').read_text(encoding='utf-8')
        self.assertIn('from version import VERSION', build)
        install = (ROOT / 'packaging' / 'install.py').read_text(encoding='utf-8')
        self.assertIn("_version()", install)

    def test_check_tool_exists_and_passes(self):
        tool = ROOT / 'tools' / 'check_version_sync.py'
        self.assertTrue(tool.exists())
        import subprocess
        r = subprocess.run([sys.executable, str(tool)],
                           capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == '__main__':
    unittest.main()
