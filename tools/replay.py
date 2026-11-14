#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""离线重放台：拿磁盘上的历史 run 重跑「提示词→校验→计划」三段，零网络零写入。

## 为什么要有这个文件

生长一轮真实耗时中位数 43 分钟（721 个槽位实测），而它的绝大部分时间花在
等 DWS 和等模型。想知道「我改了 flow.py 这一行会怎样」，目前唯一办法是真跑
一轮——一天最多 3 次（6 个时段里一半 abandoned）。

但整条链里真正的**业务判断**只发生在三段，而且全部不依赖网络：

    磁盘 evidence.json  →  prompt_evidence/trim_evidence  →  growth.validate  →  nianlun.plan

实测这三段在 191 条来源的样本上跑 0.1 秒。所以「改动的全量影响」可以变成
毫秒级回归，而不是 43 分钟的赌。

## 它证明什么、不证明什么

证明：改动能通过/不能通过校验；决策里的动作会变成什么表写入；与历史相比
      哪几轮的结论变了（回归差异）。
不证明：模型会怎么回答（那要真调模型）；DWS 会怎么返回；钉钉表会不会拒绝。
这三件事仍然必须真跑，但可以从「每改一行都跑」降级为「发版前跑一次」。

## 用法

    python tools/replay.py list                       # 有哪些 run 可重放
    python tools/replay.py run <run-dir>              # 单轮重放，打印决策与计划
    python tools/replay.py diff <run-dir>             # 与磁盘 decision 比对是否漂移
    python tools/replay.py matrix --all               # 全量回归矩阵（默认只读）
    python tools/replay.py matrix --all --baseline X  # 与基线快照对比，输出变化项

退出码：0 全部通过；1 有失败；2 参数或环境错误。
默认绝不写入：只有显式 --write-snapshot 才落盘，且只落 replay/ 快照目录。
"""
import argparse
import json
import os
import sys
import traceback
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent / 'nianlun' / 'scripts'
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))


def load_mods():
    """延迟导入：让 --help 在环境不全时也能用。"""
    import nianlun as n
    import growth as g
    import flow
    return n, g, flow


def load_config(path):
    n, _, _ = load_mods()
    p = Path(path).expanduser()
    if not p.exists():
        raise SystemExit(f'配置不存在：{p}')
    return n.load(p)


def iter_runs(state_dir):
    root = Path(state_dir).expanduser() / 'runs'
    if not root.is_dir():
        return []
    out = []
    for d in sorted(root.iterdir()):
        if not d.is_dir():
            continue
        out.append({
            'dir': d,
            'name': d.name,
            'evidence': (d / 'evidence.json').exists(),
            'decision': (d / 'decision.json').exists(),
            'plan': (d / 'plan.json').exists(),
            'trim': (d / 'evidence-trim.json').exists(),
            'receipt': (d / 'receipt.json').exists(),
        })
    return out


def replay_one(config, run_dir, budget=None, rebind=True):
    """跑一段重放。返回结构化结果，绝不写盘、绝不联网。

    rebind: 历史证据里的 binding 是「当时那份 config」的哈希。表结构一改，
    所有历史轮次的 binding 都与今天不符，validate 第一句就会拒——这不是
    数据坏了，而是 binding 把「证据」和「配置快照」绑死了（见结果里的
    binding_drift）。重放的语义是「用今天的配置重跑历史证据」，所以默认
    把 binding 重算成当前 config 的哈希；要复现当时的原始校验用 rebind=False。

    三个阶段各自捕获异常，这样一次重放能同时看出「哪一段坏了」，
    而不是第一个错就把整次诊断掐断——真实排查里往往是后一段的错更值钱。
    """
    n, g, flow = load_mods()
    d = Path(run_dir).expanduser()
    result = {'run': d.name, 'stages': {}, 'ok': False}

    ev_path = d / 'evidence.json'
    if not ev_path.exists():
        result['stages']['load'] = {'ok': False, 'error': 'evidence.json 不存在'}
        return result
    try:
        bundle = n.load(ev_path)
        recorded = bundle.get('binding')
        current = n.digest(config)
        result['binding_drift'] = recorded != current
        result['stages']['load'] = {
            'ok': True,
            'sources': len(bundle.get('sources') or []),
            'run_id': bundle.get('run_id'),
            'since': bundle.get('since'),
            'until': bundle.get('until'),
            'binding_drift': recorded != current,
        }
        if rebind:
            bundle['binding'] = current
    except Exception as exc:
        result['stages']['load'] = {'ok': False, 'error': f'{type(exc).__name__}: {exc}'}
        return result

    # ① 提示词重建（含裁剪）——这一步是「模型到底看到了什么」的唯一真相
    try:
        doc, notes = flow.trim_evidence(flow.prompt_evidence(bundle), budget) \
            if budget else flow.trim_evidence(flow.prompt_evidence(bundle))
        chars = len(json.dumps(doc, ensure_ascii=False))
        kept = len(doc.get('sources') or [])
        total = len(bundle.get('sources') or [])
        result['stages']['prompt'] = {
            'ok': True, 'chars': chars, 'kept_sources': kept,
            'total_sources': total, 'dropped': total - kept, 'notes': notes,
        }
    except Exception as exc:
        result['stages']['prompt'] = {'ok': False, 'error': f'{type(exc).__name__}: {exc}'}
        doc = None

    dec_path = d / 'decision.json'
    if not dec_path.exists():
        result['stages']['validate'] = {'ok': False, 'error': '无 decision.json（失败轮无决策）'}
        return result
    try:
        decision = n.load(dec_path)
    except Exception as exc:
        result['stages']['validate'] = {'ok': False, 'error': f'decision 读取失败: {exc}'}
        return result

    # ② 校验——纯函数，不写盘
    try:
        verdict = g.validate(config, bundle, decision)
        actions = verdict.get('actions') or []
        result['stages']['validate'] = {
            'ok': True, 'actions': len(actions),
            'evidence_hash': verdict.get('evidence_hash'),
            'ops': sorted({a.get('op') for a in actions}),
            # 只留能区分行为的摘要，不存业务正文
            'titles': [a.get('title') for a in actions],
        }
    except Exception as exc:
        result['stages']['validate'] = {'ok': False, 'error': f'{type(exc).__name__}: {exc}'}
        return result

    # ③ 计划——table_plan 已由 validate 算好并挂在 action 上，不再重算。
    #    这里只把「会写哪张表、哪几列、是否跳过已存在」摊平出来，
    #    因为这正是真实 apply 时唯一会碰钉钉的部分。
    try:
        writes = []
        for a in actions:
            tp = a.get('table_plan') or {}
            for act in tp.get('actions') or []:
                writes.append({
                    'op': a.get('op'), 'role': act.get('role'),
                    'cells': sorted((act.get('cells') or {}).keys()),
                    'skip': bool(act.get('skip_existing')),
                })
        result['stages']['plan'] = {'ok': True, 'plans': len(actions), 'writes': writes}
    except Exception as exc:
        result['stages']['plan'] = {'ok': False, 'error': f'{type(exc).__name__}: {exc}'}
        return result

    # 与磁盘 plan.json 比对：磁盘那份是「真执行过」的对照。
    # 量纲必须一致——磁盘 plan.actions 是外层动作列表（每个内含 table_plan），
    # 所以拿 actions 条数比，不能拿展开后的写入条数比。
    disk_plan = d / 'plan.json'
    if disk_plan.exists():
        try:
            saved = n.load(disk_plan)
            saved_actions = saved.get('actions') if isinstance(saved, dict) else saved
            result['stages']['plan']['action_count'] = len(actions)
            result['stages']['plan']['disk_actions'] = len(saved_actions or [])
            result['stages']['plan']['matches_disk'] = \
                len(saved_actions or []) == len(actions)
        except Exception:
            result['stages']['plan']['matches_disk'] = None

    result['ok'] = all(s.get('ok') for s in result['stages'].values())
    return result


def printable(result, verbose=False):
    lines = [f"run {result['run']}  →  {'OK' if result['ok'] else 'FAIL'}"]
    for name, stage in result['stages'].items():
        if stage.get('ok'):
            if name == 'load':
                lines.append(f"  load     ✓ {stage['sources']} 条来源  {stage.get('until','')}")
            elif name == 'prompt':
                lines.append(f"  prompt   ✓ {stage['chars']:,} 字符 | "
                             f"来源 {stage['kept_sources']}/{stage['total_sources']} "
                             f"(丢 {stage['dropped']})")
                for note in (stage.get('notes') or [])[:4]:
                    lines.append(f"           · {note}")
            elif name == 'validate':
                lines.append(f"  validate ✓ {stage['actions']} 动作 {stage['ops']}")
                if verbose:
                    for t in stage.get('titles') or []:
                        lines.append(f"           - {t}")
            elif name == 'plan':
                match = stage.get('matches_disk')
                tag = '' if match is None else ('  与磁盘 plan 一致' if match else '  ⚠ 与磁盘 plan 不一致')
                lines.append(f"  plan     ✓ {stage['writes'] and len(stage['writes'])} 条写入{tag}")
        else:
            lines.append(f"  {name:<8} ✗ {stage.get('error')}")
    return '\n'.join(lines)


def snapshot_of(results):
    """稳定的可比指纹：只保留会随代码变化的部分。"""
    snap = {}
    for r in results:
        entries = {}
        for name, stage in r['stages'].items():
            if not stage.get('ok'):
                entries[name] = {'ok': False, 'error': stage.get('error')}
                continue
            if name == 'prompt':
                entries[name] = {'ok': True, 'chars': stage['chars'],
                                 'kept': stage['kept_sources'], 'dropped': stage['dropped']}
            elif name == 'validate':
                entries[name] = {'ok': True, 'actions': stage['actions'], 'titles': stage.get('titles')}
            elif name == 'plan':
                entries[name] = {'ok': True, 'writes': stage.get('writes')}
            else:
                entries[name] = {'ok': True}
        snap[r['run']] = entries
    return snap


def cmd_list(args):
    runs = iter_runs(args.state_dir)
    if not runs:
        print(f'没有找到 run 目录：{Path(args.state_dir).expanduser()/"runs"}')
        return 2
    ready = [r for r in runs if r['evidence'] and r['decision']]
    print(f'共 {len(runs)} 个 run 目录')
    print(f'  可完整重放（evidence+decision）: {len(ready)}')
    print(f'  只有证据、无决策（失败轮现场） : {len([r for r in runs if r["evidence"] and not r["decision"]])}')
    print(f'  空目录                        : {len([r for r in runs if not r["evidence"]])}')
    print()
    for r in runs:
        mark = '✓' if (r['evidence'] and r['decision']) else ('·' if r['evidence'] else '∅')
        flags = ''.join(k[0].upper() if r[k] else '-' for k in ('evidence', 'decision', 'plan', 'trim', 'receipt'))
        print(f'  {mark} {r["name"]}  [{flags}]')
    return 0


def cmd_run(args):
    config = load_config(args.config)
    result = replay_one(config, args.run_dir, args.budget, rebind=not args.original_binding)
    print(printable(result, verbose=args.verbose))
    return 0 if result['ok'] else 1


def cmd_matrix(args):
    config = load_config(args.config)
    runs = [r for r in iter_runs(args.state_dir) if r['evidence'] and r['decision']]
    if args.limit:
        runs = runs[-args.limit:]
    if not runs:
        print('没有可重放的 run（需要有 evidence.json + decision.json）')
        return 2

    results = []
    for r in runs:
        try:
            results.append(replay_one(config, r['dir'], args.budget, rebind=not args.original_binding))
        except Exception:
            results.append({'run': r['name'], 'stages': {'fatal': {'ok': False,
                            'error': traceback.format_exc(limit=2)}}, 'ok': False})

    ok = [r for r in results if r['ok']]
    bad = [r for r in results if not r['ok']]
    print(f'重放 {len(results)} 轮：通过 {len(ok)}，失败 {len(bad)}')
    for r in bad:
        print()
        print(printable(r))

    # 裁剪丢数据的累计口径——这是 B1 缺陷的量化看板
    dropped = sum(s['dropped'] for r in results
                  for s in [r['stages'].get('prompt', {})] if s.get('ok'))
    if dropped:
        print(f'\n⚠ 累计 {dropped} 条来源在本轮从未交给模型，却会照样写进 seen.json（B1）')

    snap = snapshot_of(results)
    if args.baseline:
        base_path = Path(args.baseline).expanduser()
        if not base_path.exists():
            print(f'\n基线不存在：{base_path}')
            return 2
        base = json.load(open(base_path, encoding='utf-8'))
        changed = []
        for run, entries in snap.items():
            old = base.get(run)
            if old is None:
                changed.append((run, '新增（基线里没有）'))
            elif old != entries:
                changed.append((run, '结论变化'))
        removed = [k for k in base if k not in snap]
        print(f'\n基线对比：{len(changed)} 轮结论变化，{len(removed)} 轮已不在当前集合')
        for run, why in changed:
            print(f'  ⚠ {run}  {why}')
            old, new = base.get(run, {}), snap[run]
            for stage in set(old) | set(new):
                if old.get(stage) != new.get(stage):
                    print(f'      {stage}: {json.dumps(old.get(stage), ensure_ascii=False)[:160]}')
                    print(f'      {" " * len(stage)}  → {json.dumps(new.get(stage), ensure_ascii=False)[:160]}')

    if args.write_snapshot:
        out = Path(args.write_snapshot).expanduser()
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(snap, ensure_ascii=False, indent=1, sort_keys=True),
                       encoding='utf-8')
        print(f'\n快照已写入：{out}')
    return 0 if not bad else 1


def cmd_diff(args):
    """同一 run：磁盘 decision 重放结果 vs 当前代码——用来确认「改动有没有影响判断」。"""
    config = load_config(args.config)
    result = replay_one(config, args.run_dir, args.budget, rebind=not args.original_binding)
    print(printable(result, verbose=True))
    disk_plan = Path(args.run_dir).expanduser() / 'plan.json'
    if disk_plan.exists():
        n, _, _ = load_mods()
        try:
            saved = n.load(disk_plan)
            print(f'\n磁盘 plan: {json.dumps(saved, ensure_ascii=False)[:400]}')
        except Exception as exc:
            print(f'\n磁盘 plan 读取失败: {exc}')
    return 0 if result['ok'] else 1


def main():
    ap = argparse.ArgumentParser(
        description='年轮离线重放台：用历史证据重跑提示词/校验/计划，零网络零写入')
    ap.add_argument('--config', default=str(Path.home() / '.config' / 'nianlun' / 'config.json'))
    ap.add_argument('--state-dir', default=str(Path.home() / '.local' / 'state' / 'nianlun'))
    sub = ap.add_subparsers(dest='cmd', required=True)

    sub.add_parser('list', help='列出可重放的 run')

    for name, help_text in (('run', '重放单轮'), ('diff', '重放并与磁盘 plan 比对')):
        p = sub.add_parser(name, help=help_text)
        p.add_argument('run_dir')
        p.add_argument('--budget', type=int, default=None, help='强制证据预算（字符）')
        p.add_argument('--original-binding', action='store_true',
                       help='用历史当时的 binding 校验（表结构改过时必失败，仅用于复现原始状态）')
        p.add_argument('--verbose', action='store_true')
        p.set_defaults(func=cmd_run if name == 'run' else cmd_diff)

    m = sub.add_parser('matrix', help='全量回归矩阵')
    m.add_argument('--all', action='store_true')
    m.add_argument('--limit', type=int, default=0)
    m.add_argument('--budget', type=int, default=None)
    m.add_argument('--original-binding', action='store_true',
                   help='用历史当时的 binding 校验（默认按今天的配置重算）')
    m.add_argument('--baseline', default=None, help='基线快照 json，用于输出变化项')
    m.add_argument('--write-snapshot', default=None, help='把本次结果写成基线快照')
    m.set_defaults(func=cmd_matrix)

    args = ap.parse_args()
    if args.cmd == 'list':
        return cmd_list(args)
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
