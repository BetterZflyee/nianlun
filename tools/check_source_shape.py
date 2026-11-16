#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""采集形状检查：每轮真跑完后，检查 prompt 里有没有把「可执行形状」喂给模型。

## 为什么必须有这个文件

P0-4 修的是「采集阶段」（`growth.py:collect()` 里 workbench / todo 两个通道），
让模型看到的是**事实陈述**而不是**可执行参数**。但这条修复用旧证据重放验不出来：

    重放工具只读磁盘上现成的 evidence.json，不重新采集。
    而 24 轮历史里凡是有 `todo:` 来源的，无一例外全是旧格式。

拿旧证据重放，模型看到的仍是带 `{"op":"complete_todo","task_id":...}` 的旧格式，
**于是「模型不再提动作」这条永远验不到，却会因为「重放没报错」显示成绿灯。**

这正是产品说的「完美的假绿灯」：模型在旧格式下当然还会提动作，
但你会以为验过了。

## ⚠️ 全绿 ≠ P0-4 验证通过（不许混，这条是今天的教训）

本工具只能证明「**喂进去的来源是干净的**」。

它证明不了「模型拿到干净来源之后还会不会提动作」——那要真调模型看 decision。
把这两件事混在一起，就是把「来源改干净了」当成「决策改了」，正是今天躲开的
那个假绿灯，换个位置再来一次。

所以它报绿只说明采集侧没漏参数；P0-4 是否真让模型不再提动作，
仍然要看真跑那轮的 decision 里还有没有 complete_todo。

## 所以它验的是「下一轮真跑」的产物

每轮跑完，从这一轮的 `evidence.json` 重新走一遍
`prompt_evidence → trim_evidence`，然后检查**模型实际会看到的那份文本**里：

    ① `"input"` 出现次数必须为 0        —— workbench 回执里的可执行参数
    ② `activities` 出现次数必须为 0      —— todo 回执里的活动流水（task.done）
    ③ 已完成的待办不得暴露 taskId        —— 只陈述事实，不给编号

三项都是「不该出现的东西」，所以是**零容忍**，不需要基线对比。

## 它证明什么、不证明什么

证明：这一轮真正喂给模型的 prompt 里，可执行形状已经消失。
不证明：模型看到之后会不会提动作（那要读这一轮的 decision.json）。

两者合起来才是完整的 P0-4 验证：

    python tools/check_source_shape.py <run-dir>        # 形状（本文件）
    python tools/replay.py run <run-dir>                # 模型提了什么动作

## 用法

    python tools/check_source_shape.py list                    # 有哪些 run 可查
    python tools/check_source_shape.py <run-dir>               # 查单轮
    python tools/check_source_shape.py <run-dir> --show        # 顺带打印命中上下文
    python tools/check_source_shape.py --latest                # 查最新一轮
    python tools/check_source_shape.py --all                   # 查全部（历史轮次会红）

退出码：0 全部通过；1 有命中；2 参数或环境错误。
默认只读，绝不写入任何文件。
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / 'nianlun' / 'scripts'
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))


# 挂定时器前手工跑全历史得到的基线（2026-11-16 16:2x 实测，54 轮）。
# 以后每轮结果和它对不上，才说明采集侧真的变了。
#
# 「残留 9」全部是**修复前的存量**：那 9 轮的 evidence.json 是旧代码采集时
# 写下的，里面存着旧格式（workbench 带 input / todo 带 activities）。
# 改 collect() 不会追溯改历史文件，所以它们永远脏——**这不判失败**。
# 真正要看的是：有没有「新轮次」变脏。
BASELINE = {'total': 54, 'clean': 45, 'dirty': 9, 'at': '2026-11-16',
            # 已知存量清单：出现在这里的不报警，新面孔才报警
            'known_dirty': [
                '20261111-220005-1ec39338',
                '20261112-150004-72f49398',
                '20261113-120005-94585db2',
                '20261113-210228-a5037356',
                '20261113-230004-a03e5e9a',
                '20261114-000004-70a87827',
                '20261115-100004-6c917ab9',
                '20261116-122020-f28e8637',
                '20261116-130005-5fe6cb63',
            ]}


def _now():
    from datetime import datetime
    return datetime.now().strftime('%m-%d %H:%M')


def runs_root():
    """状态目录优先从配置读，读不到再回落默认位置。"""
    import os
    config = Path(os.path.expanduser('~/.config/nianlun/config.json'))
    if config.exists():
        try:
            state = json.loads(config.read_text(encoding='utf-8')).get('growth', {}).get('state_dir')
            if state:
                return Path(os.path.expanduser(state)) / 'runs'
        except (OSError, ValueError):
            pass
    return Path(os.path.expanduser('~/.local/state/nianlun/runs'))


def prompt_text(run_dir):
    """重建模型实际看到的证据文本。必须走真实的 prompt_evidence + trim_evidence。"""
    import flow
    bundle = json.loads((Path(run_dir) / 'evidence.json').read_text(encoding='utf-8'))
    document = flow.prompt_evidence(bundle)
    document, _notes = flow.trim_evidence(document)
    return json.dumps(document, ensure_ascii=False)


def sources_text(run_dir):
    """只取 sources 段，专供「可执行参数」这类检查用。

    ## 为什么必须分开（2026-11-16 产品指出，是真误报源）

    `prompt_evidence` 返回的是一个多段结构：

        {format, run_id, since, until, binding, sources, coverage, identity,
         count_semantics, todo_links, tables, todos, table_fields, linkable}

    在**整段文本**里搜 `"input"` / `activities`，会把 `tables`（四张表的字段
    结构）、`todos`（398 条待办）这些段落一起搜进去。只要将来有人在表结构里
    加一个叫 `input` 的字段，或者某条待办正文里正常出现 `activities` 这个词，
    检查就**永远报警**——一个永远在响的警报等于没有警报，比不挂更坏。

    可执行参数**只可能从来源正文混进来**，所以只查 sources。
    """
    import flow
    bundle = json.loads((Path(run_dir) / 'evidence.json').read_text(encoding='utf-8'))
    document = flow.prompt_evidence(bundle)
    document, _notes = flow.trim_evidence(document)
    return json.dumps(document.get('sources') or [], ensure_ascii=False)


def unescape(text):
    """来源 text 是「JSON 里套 JSON」，必须先反转义再数。

    ⚠️ 2026-11-16 第一版没反转义，数出 `"input"` = 0 次，差点报了假绿。
    实际存的是 `\\"input\\"`，反解后才数得到。
    """
    return str(text or '').replace('\\"', '"')


# 每条规则是 (名字, 判定函数, 说明)。判定函数返回命中的片段列表。
def _find(text, needle):
    out, start = [], 0
    while True:
        index = text.find(needle, start)
        if index < 0:
            return out
        out.append(text[max(0, index - 60):index + len(needle) + 60])
        start = index + len(needle)


def _finished_todo_ids(run_dir, text):
    """已完成待办仍带 taskId：bundle 里 isDone=True 的编号出现在 prompt 中即命中。"""
    bundle = json.loads((Path(run_dir) / 'evidence.json').read_text(encoding='utf-8'))
    hits = []
    for todo in bundle.get('todos') or []:
        if todo.get('isDone') is not True:
            continue
        tid = str(todo.get('taskId') or '').strip()
        if not tid:
            continue
        # 未完成列表本身会带编号，那是它确实还需要处理；这里只查「已完成」的。
        if tid in text:
            hits.append('已完成待办 %s 仍出现在 prompt 里' % tid)
    return hits


RULES = [
    ('workbench 可执行参数 "input"', lambda d, t: _find(t, '"input"'), 'workbench 回执不得暴露完整动作参数'),
    ('todo 活动流水 activities', lambda d, t: _find(t, 'activities'), 'todo 回执不得暴露 task.done 流水'),
    ('已完成待办暴露 taskId', _finished_todo_ids, '已完成的只陈述事实，不给编号'),
]


def check(run_dir, show=False):
    """返回 (是否通过, 结果行列表)。"""
    run_dir = Path(run_dir)
    if not (run_dir / 'evidence.json').exists():
        return None, ['%s 没有 evidence.json，跳过' % run_dir.name]
    try:
        text = unescape(sources_text(run_dir))
    except Exception as exc:                                  # noqa: BLE001 - 报告原始错误更有用
        return False, ['重建 sources 段失败：%s: %s' % (type(exc).__name__, exc)]

    ok = True
    lines = ['%s  sources 段 %d 字符' % (run_dir.name, len(text))]
    for name, rule, why in RULES:
        try:
            hits = rule(run_dir, text)
        except Exception as exc:                              # noqa: BLE001
            ok = False
            lines.append('  ✗ %-28s 判定出错：%s' % (name, exc))
            continue
        if hits:
            ok = False
            lines.append('  ✗ %-28s 命中 %d 处（%s）' % (name, len(hits), why))
            if show:
                for hit in hits[:5]:
                    lines.append('      … %s …' % hit.replace('\n', ' '))
        else:
            lines.append('  ✓ %-28s 0 处' % name)
    return ok, lines


def main():
    parser = argparse.ArgumentParser(description='检查一轮 prompt 里有没有把可执行形状喂给模型')
    parser.add_argument('run', nargs='?', help='run 目录，或 list')
    parser.add_argument('--latest', action='store_true', help='检查最新一轮')
    parser.add_argument('--all', action='store_true', help='检查全部轮次')
    parser.add_argument('--show', action='store_true', help='打印命中片段')
    parser.add_argument('--quiet', action='store_true',
                        help='只在新出现的残留时输出一行（给定时器/日志用，避免刷屏）')
    parser.add_argument('--judge', metavar='RUN',
                        help='只判定这一轮是否在已知存量里（quiet 内部用）')
    args = parser.parse_args()

    root = runs_root()
    if args.run == 'list' or (not args.run and not args.latest and not args.all):
        if not root.exists():
            print('找不到 runs 目录：%s' % root)
            return 2
        for path in sorted(root.iterdir()):
            if not path.is_dir():
                continue
            mark = '有 evidence.json' if (path / 'evidence.json').exists() else '（无 evidence.json）'
            print('%s  %s' % (path.name, mark))
        return 0

    if args.all:
        targets = [p for p in sorted(root.iterdir()) if p.is_dir() and (p / 'evidence.json').exists()]
    elif args.latest:
        candidates = [p for p in sorted(root.iterdir()) if p.is_dir() and (p / 'evidence.json').exists()]
        if not candidates:
            print('没有可检查的轮次')
            return 2
        targets = [candidates[-1]]
    else:
        targets = [Path(args.run)]

    failed = 0
    new_dirty = []
    for target in targets:
        ok, lines = check(target, show=args.show)
        if args.quiet:
            # 定时器模式：只在「新面孔变脏」时说话。
            # 已知存量的 9 轮永远脏（历史 evidence 改不了），天天报等于没报。
            if ok is False and target.name not in BASELINE['known_dirty']:
                new_dirty.append(target.name)
                print('[%s] ⚠️ 新出现的残留：%s' % (_now(), target.name))
                for line in lines:
                    print('    ' + line)
        else:
            for line in lines:
                print(line)
            print()
        if ok is False:
            failed += 1

    if args.quiet:
        if new_dirty:
            print('[%s] 共 %d 轮新残留，需人工看' % (_now(), len(new_dirty)))
            return 1
        return 0

    print('=' * 60)
    # 基线对照：全历史里「残留 N 轮」是修复前的存量，不判失败。
    # 只有「比基线更脏」或「新轮次脏了」才是真问题。
    if args.all:
        dirty, clean = failed, len(targets) - failed
        # ⚠️ 只数**白名单之外**的新残留，和总轮数**解耦**。
        #
        # 第一版写的是 `if len(targets) == BASELINE['total'] and dirty > BASELINE['dirty']`，
        # 产品一眼看出是死代码：下一轮跑完就是 55 轮，`len(targets) == 54`
        # 永远不成立，这条判断从此**永不触发**——一条看着在守、实际从不响的检查，
        # 正是今天所有问题的同一个形状。
        #
        # 正确判据：已知存量（known_dirty 白名单）永远脏、不报警；
        # 只有**新面孔变脏**才说明采集侧真的回退了。轮数涨跌完全无关。
        new_dirty = sorted({t.name for t in targets
                            if t.name not in BASELINE['known_dirty']}
                           & {t.name for t in targets if check(t)[0] is False})
        print('本次 %d 轮：干净 %d，带残留 %d（其中已知存量 %d）'
              % (len(targets), clean, dirty,
                 dirty - len(new_dirty)))
        print('基线 %d 轮：干净 %d，带残留 %d（%s，已知存量 %d 轮，不报警）'
              % (BASELINE['total'], BASELINE['clean'], BASELINE['dirty'],
                 BASELINE['at'], len(BASELINE['known_dirty'])))
        if new_dirty:
            print('⚠️ 出现 %d 轮**新**残留（不在已知存量里）：' % len(new_dirty))
            for name in new_dirty:
                print('    ' + name)
            print('   这说明采集侧回退了，或 collect() 又被改了——按头注释回查。')
            return 1
        print('结论：没有新残留，已知存量 %d 轮是修复前留下的历史文件。'
              % len(BASELINE['known_dirty']))
        return 0
    if failed:
        print('结论：%d 轮未通过——sources 里仍带可执行形状，采集侧有残留。' % failed)
        print('注意：这只说明「来源不干净」；模型拿到干净来源后还提不提动作，'
              '本工具测不了（见头注释）。')
        return 1
    print('结论：%d 轮通过，sources 段没有可执行形状。' % len(targets))
    print('注意：全绿只代表「来源干净」，不代表 P0-4 验证通过——'
          '模型会不会提动作要看 decision。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
