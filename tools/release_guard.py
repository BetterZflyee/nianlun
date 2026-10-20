"""Check public source and distribution files without printing sensitive matches."""
import argparse
from pathlib import Path, PurePosixPath
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIRS = {'.github', 'docs', 'nianlun', 'packaging', 'tools'}
PUBLIC_FILES = {'.gitignore', '.gitattributes', 'README.md', 'LICENSE', 'NOTICE',
                'THIRD_PARTY_NOTICES.md', 'CONTRIBUTING.md', 'SECURITY.md',
                'CHANGELOG.md', 'requirements-dev.txt'}
SUFFIXES = {'.py', '.md', '.json', '.yaml', '.yml', '.html', '.css', '.js',
            '.command', '.cmd', '.ps1', '.txt'}
PRIVATE_NAMES = {'__pycache__', '.env', 'config.json', 'install.json', 'session.json',
                 '.DS_Store', 'local', 'work', 'downloads', 'runs'}
PATTERNS = {
    'GitHub credential': rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})',
    'private key': rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',
    'personal home path': rb'(?:/Users/|/home/)[A-Za-z0-9_.-]+/',
    'Windows personal home path': rb'[A-Za-z]:[\\/]+Users[\\/]+[A-Za-z0-9_.-]+[\\/]',
    'DingTalk organization identifier': rb'\bding[0-9a-f]{24,}\b',
    'credential in URL': rb'https?://[^\s/:@]+:[^\s/@]+@',
}


def check_file(name, data, *, source=False):
    path = PurePosixPath(name)
    issues = []
    if path.is_absolute() or '..' in path.parts or '\\' in name:
        issues.append(f'{name}: unsafe path')
    if any(part in PRIVATE_NAMES for part in path.parts):
        issues.append(f'{name}: private or generated file')
    if source and name not in PUBLIC_FILES:
        if not path.parts or path.parts[0] not in PUBLIC_DIRS or path.suffix not in SUFFIXES:
            issues.append(f'{name}: outside public source allowlist')
    if len(data) > 1_000_000:
        issues.append(f'{name}: oversized source file')
    for label, pattern in PATTERNS.items():
        if re.search(pattern, data):
            issues.append(f'{name}: {label}')
    return issues


def public_files(root=ROOT):
    for name in sorted(PUBLIC_FILES):
        path = root / name
        if path.is_file():
            yield path
    for name in sorted(PUBLIC_DIRS):
        for path in sorted((root / name).rglob('*')):
            if path.is_file() and '__pycache__' not in path.parts and path.name != '.DS_Store':
                yield path


def check_source(root=ROOT, *, tracked=False, staged=False):
    if tracked or staged:
        names = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode('utf-8').split('\0')
    else:
        names = [p.relative_to(root).as_posix() for p in public_files(root)]
    issues = []
    for name in filter(None, names):
        path = root / name
        if path.is_symlink():
            issues.append(f'{name}: source symlinks are not allowed')
            continue
        data = subprocess.check_output(['git', 'show', ':' + name], cwd=root) if staged else path.read_bytes()
        issues.extend(check_file(name, data, source=True))
    return issues, len([name for name in names if name])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tracked', action='store_true', help='check all tracked source files')
    parser.add_argument('--staged', action='store_true', help='check Git index instead of disk')
    args = parser.parse_args()
    issues, count = check_source(tracked=args.tracked, staged=args.staged)
    if issues:
        print('\n'.join(issues))
        return 1
    print(f'Public source check passed: {count} files (pattern check, not a complete privacy audit).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
