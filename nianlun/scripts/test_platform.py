"""Cross-platform behaviour that must hold on macOS, Linux and Windows.

These need no real Windows machine: the platform predicate is patched and the
resulting argv / paths are asserted, so a Windows-only regression is caught on a
macOS or Linux CI run.
"""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dependencies
import workspace_tools


class PlatformKeyTests(unittest.TestCase):
    def test_platform_key_covers_the_three_shipped_targets(self):
        """Install assets resolve by (system, arch); an unknown pair means nothing to download."""
        cases = [
            (('Darwin', 'arm64'), ('darwin', 'arm64')),
            (('Darwin', 'x86_64'), ('darwin', 'x64')),
            (('Windows', 'AMD64'), ('windows', 'x64')),
            (('Windows', 'ARM64'), ('windows', 'arm64')),
            (('Linux', 'x86_64'), ('linux', 'x64')),
            (('Linux', 'aarch64'), ('linux', 'arm64')),
        ]
        for (system, machine), expected in cases:
            with patch.object(dependencies.platform, 'system', return_value=system):
                with patch.object(dependencies.platform, 'machine', return_value=machine):
                    self.assertEqual(dependencies.platform_key(), expected, (system, machine))

    def test_unknown_platform_fails_loudly_instead_of_guessing(self):
        with patch.object(dependencies.platform, 'system', return_value='FreeBSD'):
            with self.assertRaises(Exception):
                dependencies.platform_key()


class BinaryResolutionTests(unittest.TestCase):
    def test_posix_rejects_shell_shims_it_cannot_spawn(self):
        """npm installs .cmd/.bat shims; POSIX exec cannot run them, so they must be skipped."""
        with patch.object(dependencies.shutil, 'which', return_value='/usr/local/bin/dws.cmd'):
            self.assertNotEqual(dependencies.find_binary('dws'), '/usr/local/bin/dws.cmd')


class DialogTests(unittest.TestCase):
    def test_directory_picker_uses_a_native_argv_per_platform(self):
        commands = {}
        for platform_name, osname in (('darwin', 'posix'), ('linux', 'posix'), ('win32', 'nt')):
            with patch('sys.platform', platform_name), \
                 patch.object(workspace_tools.os, 'name', osname), \
                 patch.object(workspace_tools.subprocess, 'run') as run:
                run.return_value.stdout = ''
                workspace_tools.pick_directory()
                commands[platform_name] = run.call_args[0][0]
        self.assertEqual(commands['darwin'][0], 'osascript')
        self.assertEqual(commands['win32'][0], 'powershell')
        self.assertEqual(commands['linux'][0], 'zenity')
        # A native dialog is spawned as argv, never through a shell string.
        for name, argv in commands.items():
            self.assertIsInstance(argv, list, name)


class FileLockTests(unittest.TestCase):
    def test_lock_module_guards_platform_imports(self):
        """fcntl is absent on Windows and msvcrt is absent on POSIX; imports must be guarded."""
        import file_lock
        source = Path(file_lock.__file__).read_text(encoding='utf-8')
        self.assertIn('msvcrt', source)
        self.assertIn('fcntl', source)
        guarded = "if os.name == 'nt':"
        self.assertIn(guarded, source)
        head, _, tail = source.partition(guarded)
        self.assertIn('msvcrt', tail)
        self.assertNotIn('msvcrt', head)


class PathPortabilityTests(unittest.TestCase):
    def test_skill_root_resolves_without_platform_separators(self):
        """The skill root is derived from __file__, so it must not embed a hard-coded separator."""
        import nianlun as n
        self.assertTrue(Path(n.SKILL).is_dir())
        self.assertNotIn('\\', str(n.SKILL))

    def test_state_and_output_paths_stay_under_the_users_home(self):
        """Every writable default must be user-owned; nothing may target a system directory."""
        import nianlun as n
        source = Path(n.__file__).read_text(encoding='utf-8')
        for system_dir in ('/usr/local/', '/etc/', 'C:\\\\Program Files'):
            self.assertNotIn(system_dir, source, system_dir)


if __name__ == '__main__':
    unittest.main()
