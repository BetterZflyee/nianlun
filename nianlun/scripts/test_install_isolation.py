"""安装器的隔离性。

`--home` 让用户能把年轮装到别处（测试、U 盘、多环境并存）。但宿主入口原来
是独立参数，只传 `--home` 时会默默写进真实的 `~/.codex/skills`——一次
隔离安装污染主目录。

实测踩到：我用 `--home /tmp/testhome` 跑测试，结果真实 ~/.codex 下多出了
nianlun 和 nianlun-setup 两个目录。
"""
import re
import unittest
from pathlib import Path

INSTALLER = Path(__file__).resolve().parent.parent.parent / 'packaging' / 'install.py'


class InstallerIsolationTests(unittest.TestCase):
    def source(self):
        return INSTALLER.read_text(encoding='utf-8')

    def test_codex_home_defaults_to_none(self):
        """必须能区分「用户没传」和「用户传了」，所以默认值不能是展开好的路径。"""
        src = self.source()
        match = re.search(r"add_argument\('--codex-home',default=([^)]+)\)", src)
        self.assertIsNotNone(match, '找不到 --codex-home 参数')
        self.assertEqual(match.group(1).strip(), 'None',
                         '--codex-home 默认值必须是 None，否则无法判断用户是否显式传了')

    def test_custom_home_redirects_host_entry(self):
        """传了 --home 就该把宿主目录也挪到它旁边。"""
        src = self.source()
        self.assertIn('custom_home', src, '没有区分自定义 home')
        self.assertIn("args.codex_home is None", src,
                      '没有在 codex_home 缺省时做跟随推导')

    def test_writes_host_entry_under_codex_home(self):
        src = self.source()
        self.assertIn("Path(args.codex_home).expanduser().resolve()/'skills/nianlun'", src)

    def test_does_not_hardcode_real_home_for_skills(self):
        """注册路径不能写死 Path.home()。"""
        src = self.source()
        # 允许出现在 --codex-home 的默认回退里，但不能出现在 host 注册路径上
        self.assertNotIn("Path.home()/'.codex'/'skills'", src)


class ClaudeHostIsolationTests(unittest.TestCase):
    """claude 分支原来也是独立的 Path.home()/'.claude'，同样会漏到主目录。"""

    def source(self):
        return INSTALLER.read_text(encoding='utf-8')

    def test_claude_home_defaults_to_none(self):
        src = self.source()
        match = re.search(r"add_argument\('--claude-home',default=([^)]+)\)", src)
        self.assertIsNotNone(match, '找不到 --claude-home 参数')
        self.assertEqual(match.group(1).strip(), 'None')

    def test_claude_branch_uses_configured_home(self):
        """claude 分支不能再直接用 Path.home()。"""
        src = self.source()
        self.assertIn("args.claude_home", src)
        self.assertNotIn("Path(os.environ.get('CLAUDE_CONFIG_DIR',Path.home()/'.claude'))", src,
                         'claude 分支还在直接用 Path.home()')

    def test_both_hosts_share_generic_base(self):
        """两个宿主应该走同一段推导，避免再出现只修一个的情况。"""
        src = self.source()
        self.assertIn("base=args.codex_home if provider=='codex' else args.claude_home", src)


if __name__ == '__main__':
    unittest.main()
