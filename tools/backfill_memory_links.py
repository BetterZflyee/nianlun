#!/usr/bin/env python3
"""给历史上的生长记录补上项目 [[链接]]。

## 为什么需要

`growth.py` 直到 2026-11-07 才开始写 `[[projects/nianlun-<hash>|标题]]`。
在那之前写入的生长记录，正文的「## 相关记录」段只有一句「项目来源与 AI
表格链接见上」，**没有任何链接**——所以 3D 星图长期是 505 个散点、0 条线。

## 为什么不按标题猜

链接目标必须真实存在。脚本只从**该轮自己的 evidence.json** 里读
`tables.projects`——那是那一轮实际读取到的项目，不是推断的。历史轮次
如果 evidence 已被清理，就跳过（不猜）。

## 安全性

- 默认 dry-run，只打印将做什么，不写盘
- `--apply` 才真正调用 gbrain capture（走原生 CLI，带 request-id）
- 已有链接的记录直接跳过（幂等）
- 保留原正文，只把「项目来源与 AI 表格链接见上。」前面补上链接段

用法：
    python3 tools/backfill_memory_links.py            # 预览
    python3 tools/backfill_memory_links.py --apply    # 执行
"""
import argparse
import re
import subprocess
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'nianlun/scripts'))
import nianlun as n          # noqa: E402
import growth                # noqa: E402

RUNS = Path.home() / '.local/state/nianlun/runs'
CFG = Path.home() / '.config/nianlun/config.json'
MARKER_OLD = '项目来源与 AI 表格链接见上。'


def read_revision(config, brain, slug):
    """读页面当前 revision，供 capture --expected-revision 使用。"""
    r = subprocess.run(n.brain_command(config) + ['get', slug, '--json'],
                       env=n.brain_env(config), cwd=str(brain),
                       capture_output=True, text=True, encoding='utf-8', timeout=120)
    if r.returncode:
        return None
    import json
    try:
        payload = json.loads(r.stdout[r.stdout.find('{'):])
    except (ValueError, TypeError):
        return None
    return payload.get('revision')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='真正写盘（默认只预览）')
    parser.add_argument('--limit', type=int, default=0, help='最多处理几轮，0=全部')
    args = parser.parse_args()

    config = n.load(CFG)
    brain = Path(config['growth']['brain_dir'])
    done = skipped = 0

    candidates = []
    for ev in sorted(RUNS.glob('*/evidence.json')):
        run = ev.parent.name
        slug = 'meetings/nianlun-' + run
        page = brain / (slug + '.md')
        if not page.exists():
            skipped += 1
            continue
        evidence = n.load(ev)
        links = growth._related_links(config, evidence)
        if not links:
            skipped += 1
            continue
        source = page.read_text(encoding='utf-8')
        if '[[' in source:
            print(f'  跳过（已有链接）: {run}')
            skipped += 1
            continue
        if MARKER_OLD not in source:
            print(f'  跳过（找不到插入点）: {run}')
            skipped += 1
            continue
        candidates.append((run, slug, page, source, links))

    if args.limit:
        candidates = candidates[:args.limit]

    print(f'待处理 {len(candidates)} 轮，跳过 {skipped} 轮\n')

    for run, slug, page, source, links in candidates:
        new_source = source.replace(
            '## 相关记录\n\n' + MARKER_OLD,
            '## 相关记录\n\n' + links + MARKER_OLD, 1)
        count = links.count('[[')
        if not args.apply:
            print(f'  [预览] {run}: 补 {count} 条链接')
            continue
        staging = Path('/tmp') / ('backfill-' + run + '.md')
        staging.write_text(new_source, encoding='utf-8')
        # request_id 要和「这次写入的内容」绑定：同一个 run 换了参数再试
        # 时如果还复用旧 id，gbrain 会报 `idempotency_conflict`
        # （"This request_id was already accepted with different intent"）。
        # 用「run + 新内容摘要」，内容一样就天然幂等，内容变了就换新 id。
        request_id = str(uuid.uuid5(uuid.NAMESPACE_URL,
                                    'backfill-links:' + run + ':' + n.digest(new_source)))
        # 覆盖已存在的页面必须给出它当前的 revision，否则 capture 报
        # `revision_conflict`（"The page changed after the supplied revision was read"）。
        # 用 --expected-revision 而不是 --force：宁可失败也不覆盖别人的并发修改。
        rev = read_revision(config, brain, slug)
        if not rev:
            print(f'  ✗ {run}: 读不到 revision，跳过')
            continue
        cmd = n.brain_command(config) + [
            'capture', '--file', str(staging), '--slug', slug,
            '--expected-revision', rev, '--request-id', request_id, '--json']
        r = subprocess.run(cmd, env=n.brain_env(config), cwd=str(brain),
                           capture_output=True, text=True, encoding='utf-8', timeout=240)
        if r.returncode:
            print(f'  ✗ {run}: capture 失败 {r.stdout[:120]}')
            continue
        print(f'  ✓ {run}: 补 {count} 条链接')
        done += 1

    if args.apply:
        print(f'\n完成 {done} 轮')
    else:
        print(f'\n预览完毕。加 --apply 执行。')


if __name__ == '__main__':
    main()
