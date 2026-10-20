"""Build a public distribution from an allowlist, with normalized ZIP metadata."""
import argparse
import hashlib
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from release_guard import check_file, check_source

VERSION = '0.5.2'
LAUNCHERS = ('安装年轮.command', '打开年轮.command')


def build(output=None):
    issues, _ = check_source(ROOT)
    if issues:
        raise RuntimeError('\n'.join(issues))
    output = Path(output) if output else ROOT / 'deliverables'
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        package = Path(tmp) / '年轮安装版'
        package.mkdir()
        names = ('install.py', '在AI宿主中安装.md', '在Codex中安装.md', '使用说明.md',
                 '安装年轮.command', '安装年轮.cmd', '安装年轮.ps1', '打开年轮.command',
                 '打开年轮.cmd', '打开年轮.ps1', '开始使用.html', '验收说明.md')
        for name in names:
            shutil.copyfile(ROOT / 'packaging' / name, package / name)
        for name in ('LICENSE', 'NOTICE', 'THIRD_PARTY_NOTICES.md'):
            shutil.copyfile(ROOT / name, package / name)
        ignore = shutil.ignore_patterns('__pycache__', '*.pyc', 'test_*.py', '.DS_Store')
        shutil.copytree(ROOT / 'packaging/hosts', package / 'hosts', ignore=ignore)
        shutil.copytree(ROOT / 'nianlun', package / 'skills/nianlun', ignore=ignore)
        shutil.copytree(ROOT / 'packaging/nianlun-setup', package / 'skills/nianlun-setup', ignore=ignore)
        manifest = {'$schema': 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
                    'name': 'nianlun', 'version': VERSION,
                    'description': '年轮：钉钉项目记忆与自动生长，含安装和接入向导。',
                    'extensions': {'com.openai': {'requires_local_executor': True,
                        'onboardingSkill': './skills/nianlun-setup/SKILL.md',
                        'interface': {'displayName': '年轮', 'shortDescription': '连接自己的 AI 表格，让项目记忆持续生长'}}}}
        (package / 'plugin.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        for name in ('安装年轮.ps1', '打开年轮.ps1'):
            path = package / name
            path.write_bytes(b'\xef\xbb\xbf' + path.read_text(encoding='utf-8-sig').encode('utf-8'))
        for name in ('安装年轮.cmd', '打开年轮.cmd'):
            path = package / name
            path.write_bytes(path.read_text(encoding='utf-8').replace('\n', '\r\n').encode('utf-8'))
        checks = {}
        for path in sorted(package.rglob('*')):
            if not path.is_file():
                continue
            name = path.relative_to(package).as_posix()
            data = path.read_bytes()
            issues = check_file(name, data)
            if issues:
                raise RuntimeError('\n'.join(issues))
            checks[name] = hashlib.sha256(data).hexdigest()
        (package / 'SHA256SUMS.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding='utf-8')
        # GitHub strips non-ASCII characters from uploaded asset names.
        archive = output / f'nianlun-v{VERSION}-mac-windows.zip'
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for path in sorted(package.rglob('*')):
                if not path.is_file():
                    continue
                info = zipfile.ZipInfo(path.relative_to(package.parent).as_posix(), (1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = (0o100755 if path.name in LAUNCHERS else 0o100644) << 16
                z.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
        (output / (archive.name + '.sha256')).write_text(checksum + '  ' + archive.name + '\n', encoding='utf-8')
        result = {'zip': str(archive), 'bytes': archive.stat().st_size, 'files': len(checks) + 1, 'sha256': checksum}
        print(json.dumps(result, ensure_ascii=False))
        return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    build(parser.parse_args().output)
