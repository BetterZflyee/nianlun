import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
import release_guard as guard

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('nianlun_build', ROOT / 'packaging/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ReleaseGuardTests(unittest.TestCase):
    def test_private_paths_rejected_without_echoing_values(self):
        for data in (b'/Users/' + b'private-person/project', b'ding' + b'a' * 32,
                     b'gho_' + b'Z' * 36, b'github_pat_' + b'Z' * 50):
            issues = guard.check_file('nianlun/example.py', data, source=True)
            self.assertTrue(issues)
            self.assertNotIn(data.decode(), '\n'.join(issues))

    def test_only_source_allowlist_can_be_published(self):
        for name in ('local/config.json', 'work/private.txt', 'archive.zip',
                     'nianlun/session.json', '../outside.py'):
            self.assertTrue(guard.check_file(name, b'{}', source=True))
        self.assertEqual(guard.check_file('nianlun/references/growth-config.example.json', b'{}', source=True), [])

    def test_public_tree_has_no_recognized_private_content(self):
        issues, count = guard.check_source(ROOT)
        self.assertGreater(count, 50)
        self.assertEqual(issues, [])


class PackageTests(unittest.TestCase):
    def test_reproducible_package_manifest_license_and_isolated_registration(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive = builder.build(root / 'first')
            second = builder.build(root / 'second')
            self.assertEqual(archive.read_bytes(), second.read_bytes())
            with zipfile.ZipFile(archive) as z:
                prefix = '年轮安装版/'
                manifest = json.loads(z.read(prefix + 'SHA256SUMS.json'))
                self.assertEqual(set(z.namelist()), {prefix + p for p in manifest} | {prefix + 'SHA256SUMS.json'})
                self.assertIn('LICENSE', manifest)
                self.assertIn('NOTICE', manifest)
                for name, digest in manifest.items():
                    self.assertEqual(hashlib.sha256(z.read(prefix + name)).hexdigest(), digest)
                    self.assertFalse(Path(name).name.startswith('test_'))
                self.assertEqual((z.getinfo(prefix + '安装年轮.command').external_attr >> 16) & 0o777, 0o755)
                self.assertTrue(z.read(prefix + '安装年轮.ps1').startswith(b'\xef\xbb\xbf'))
                self.assertNotIn(b'\n', z.read(prefix + '安装年轮.cmd').replace(b'\r\n', b''))
                z.extractall(root / 'unpacked')
            home = root / 'clean install 中文'
            host = root / 'unselected host'
            command = [sys.executable, str(root / 'unpacked/年轮安装版/install.py'),
                       '--register-only', '--home', str(home), '--codex-home', str(host)]
            for _ in range(2):
                result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8', timeout=30)
                self.assertEqual(result.returncode, 0, result.stderr)
            record = json.loads((home / 'install.json').read_text(encoding='utf-8'))
            self.assertEqual(record['version'], builder.VERSION)
            self.assertEqual(record['skills']['nianlun']['status'], 'unchanged')
            self.assertFalse(host.exists())
            self.assertTrue((home / 'core/nianlun/scripts/host.py').is_file())


if __name__ == '__main__':
    unittest.main()
