#!/usr/bin/env python3
"""检查版本号是否只有单一来源。

## 背景

2026-11-07 之前版本号硬编码在 4 个地方，升版本要改 4 次、漏一次就前后不一致，
而且不报错——只有用户看出「打包是 2.9.3、界面还显示 2.9.2」才会发现。

现在唯一来源是 `nianlun/scripts/version.py`，这个脚本负责确认没人再写死版本号。

## 用法

    python3 tools/check_version_sync.py          # 检查
    python3 tools/check_version_sync.py --fix    # 只提示，不自动改（版本号需人决定）

退出码 0 = 一致，1 = 发现硬编码。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / 'nianlun' / 'scripts' / 'version.py'

# 允许出现版本号字面量的地方
ALLOWED = {
    VERSION_FILE,                      # 唯一来源
    ROOT / 'tools' / 'check_version_sync.py',   # 本文件（正则会带示例）
    # 这个测试的文档字符串和断言里会引用「旧的 4 处硬编码」作为反例说明，
    # 那些是**历史记录**不是运行时值。它自己也断言了这些字面量不该出现在
    # 生产代码里——加白名单不会放跑真问题。
    ROOT / 'nianlun' / 'scripts' / 'test_version_single_source.py',
}

# 这些文件里有"2.9.2"是文档名/示例，不是运行时版本
SKIP_DIRS = {'.git', 'deliverables', '__pycache__', 'node_modules'}


def current_version():
    text = VERSION_FILE.read_text(encoding='utf-8')
    m = re.search(r"^VERSION\s*=\s*['\"]([^'\"]+)['\"]", text, re.M)
    if not m:
        raise SystemExit(f'读不到版本号：{VERSION_FILE}')
    return m.group(1)


def scan(code):
    """扫出所有硬编码该版本号的 .py 文件行。"""
    pattern = re.compile(r"['\"]" + re.escape(code) + r"['\"]")
    hits = []
    for path in ROOT.rglob('*.py'):
        if path in ALLOWED:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        try:
            lines = path.read_text(encoding='utf-8').splitlines()
        except (OSError, UnicodeDecodeError):
            continue
        for no, line in enumerate(lines, 1):
            if pattern.search(line):
                hits.append((path.relative_to(ROOT), no, line.strip()[:90]))
    return hits


def main():
    code = current_version()
    print(f'唯一版本来源：{VERSION_FILE.relative_to(ROOT)} → {code}\n')

    hits = scan(code)
    if not hits:
        print('✓ 没有其他硬编码，版本号已收敛')
        return 0

    print(f'✗ 发现 {len(hits)} 处硬编码 {code}：\n')
    for path, no, line in hits:
        print(f'  {path}:{no}')
        print(f'    {line}')
    print('\n修法：改成 `from version import VERSION`，不要写死字符串。')
    return 1


if __name__ == '__main__':
    sys.exit(main())
