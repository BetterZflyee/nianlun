"""Windows 启动脚本必须是纯 ASCII。

cmd.exe 在 `chcp 65001` 生效之前就开始解析批处理文件，所以文件里的非 ASCII
字符会先按 OEM 代码页解码。中文文件名的 .cmd 因此会把 `安装年轮.ps1` 读成
乱码，PowerShell 找不到脚本，用户双击安装直接失败。
"""
import sys
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGING = ROOT / 'packaging'


class WindowsLauncherTests(unittest.TestCase):
    def launchers(self):
        return sorted(PACKAGING.glob('*.cmd'))

    def test_cmd_scripts_exist(self):
        self.assertGreaterEqual(len(self.launchers()), 2)

    def test_cmd_scripts_are_pure_ascii(self):
        for path in self.launchers():
            data = path.read_bytes()
            try:
                data.decode('ascii')
            except UnicodeDecodeError as exc:
                self.fail(f'{path.name} 含非 ASCII 字符（位置 {exc.start}），'
                          f'cmd.exe 会在 chcp 生效前按 OEM 代码页解码导致乱码')

    def test_cmd_does_not_reference_chinese_filenames(self):
        for path in self.launchers():
            text = path.read_text(encoding='ascii')
            self.assertNotIn('.ps1', text.replace('install.ps1', '').replace('open.ps1', ''),
                             f'{path.name} 引用了非 ASCII 的 ps1 文件名')

    def test_ascii_ps1_aliases_exist(self):
        for name in ('install.ps1', 'open.ps1'):
            # 别名由 build.py 在打包时生成，源目录里可以没有
            build = (PACKAGING / 'build.py').read_text(encoding='utf-8')
            self.assertIn(name, build, f'build.py 未生成 {name} 别名')


if __name__ == '__main__':
    unittest.main()
