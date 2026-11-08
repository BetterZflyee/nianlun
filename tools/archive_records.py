#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把过期反馈记录标记为「已归档」而不是删除。

用法:
  python tools/archive_records.py --before 2026-11-01            # 演算，不写表
  python tools/archive_records.py --before 2026-11-01 --yes      # 实际归档
  python tools/archive_records.py --before 2026-11-01 --keep-status 开放 --yes

规则:
  createdTime < --before 且 status 不在保护名单里 → status = 已归档
  保护名单默认「处理中」（还在进行的不能归档），可用 --keep-status 追加。
"""
import argparse, json, subprocess, sys, time
from pathlib import Path

ARCHIVED = '已归档'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', default=str(Path.home()/'.config/nianlun/config.json'))
    ap.add_argument('--before', required=True, help='YYYY-MM-DD，早于该日期的记录会被归档')
    ap.add_argument('--keep-status', nargs='*', default=['处理中'],
                    help='这些状态的记录不归档（默认：处理中）')
    ap.add_argument('--batch', type=int, default=100)
    ap.add_argument('--yes', action='store_true', help='实际写表；不加只演算')
    args = ap.parse_args()

    sys.path.insert(0, str(Path.home()/'.local/share/nianlun/core/nianlun/scripts'))
    import nianlun as n, growth as g

    config = n.load(args.config)
    gw = g.Gateway(config)
    state = n.fetch(config, gw.table())
    fields = state['fields']['records']
    status_field = fields['status']['fieldId']
    title_field = fields['title']['fieldId']

    opts = [o['name'] for o in fields['status']['config']['options']]
    if ARCHIVED not in opts:
        print('字段里没有「%s」选项，请先添加' % ARCHIVED); return 1

    keep = set(args.keep_status) | {ARCHIVED}
    cutoff = args.before
    targets = []
    for r in state['records']:
        d = str(r.get('date') or '')[:10]
        st = str(r.get('status') or '')
        if d and d < cutoff and st not in keep:
            targets.append(r)

    print('扫描 %d 条记录，早于 %s 且状态不在 %s 的：%d 条'
          % (len(state['records']), cutoff, '/'.join(sorted(keep)), len(targets)))
    for r in targets[:8]:
        print('  %s [%s] %s' % (str(r.get('date'))[:10], r.get('status'), str(r.get('title'))[:44]))
    if len(targets) > 8: print('  ...')

    if not args.yes:
        print('\n演算模式，未写表。确认后加 --yes 执行。')
        return 0

    base = config['base_id']; table = config['tables']['records']['id']
    done = 0
    for i in range(0, len(targets), args.batch):
        chunk = targets[i:i+args.batch]
        records = [{'recordId': r['id'], 'cells': {status_field: ARCHIVED}} for r in chunk]
        payload = json.dumps(records, ensure_ascii=False)
        cmd = [config.get('dws_bin', 'dws'), 'aitable', 'record', 'update',
               '--base-id', base, '--table-id', table,
               '--records', payload, '--yes', '--format', 'json']
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        if proc.returncode:
            print('批次 %d 失败，停止（写操作不自动重试）：%s' % (i//args.batch+1, proc.stderr[:200]))
            print('已成功归档 %d 条' % done); return 1
        done += len(chunk)
        print('  批次 %d：归档 %d 条' % (i//args.batch+1, len(chunk)))
        time.sleep(1)
    print('\n完成：%d 条标记为「%s」' % (done, ARCHIVED))
    return 0

if __name__ == '__main__':
    sys.exit(main())
