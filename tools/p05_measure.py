#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P0-5 全量测量：待办 × 同项目记录 的配对矩阵。

## 为什么必须有这个文件

2026-11-16 修 P0-5 时，我先用**单个样本**证明「改好了」：拿一条与待办毫无关系
的记录去试，被拒了，就宣布通过。产品拿同一条待办的**同项目全部 21 条记录**复测：

    放行 16 / 21 = 76%

那条样本被拒，只是因为它和待办连一个二字词都不共享——**极端值，不是典型值**。
真正的原因是「机器狗」「月台」「场地」这类**项目领域词**在同项目每条记录里都有，
`want & got` 必然命中。

**单点样本能证伪，不能证真。** 要证明一个判定「不漏」，得跑全量配对；
要证明「不误杀」，得跑正例回归。这个文件就是那两件事。

## 四个数（产品定的收口标准）

    ① 恶意样本被拒           —— 定向的，逐条打印
    ② 全局误放率 ≤ 10%       —— 全部（待办 × 同项目记录）配对
    ③ 真实已登记配对 0 误杀   —— links.json 人工确认 + plan 里 create_todo 的 record_ref
    ④ 正常完成挡住率 < 10%    —— 有对应记录却配不上 = 真的关不掉

## ② 的口径：这个数天然有地板

同项目的记录里理论上最多有 1 条（真的那条）与待办相关，所以完美判定的
「放行率」不是 0，而是约 1/项目记录数。本脚本把每一对都算作「不该放行」，
**高估误放率**（把真相关那对也算进去了）。高估方向是安全的。

## ④ 的口径：必须排除「本来就没有对应记录」的待办

把全部待办算进去会得到虚高的挡住率：390 条待办压根没有登记记录，
挡住它们是对的（该走 record_ref 先建档）。本脚本分开打印：
    ④a 全部待办挡住率（含本来就没记录的，偏高是正常的）
    ④b 误杀候选（旧口径能对上 & 新口径对不上）= 收紧的真实代价

## 通用词为什么改成按占比

产品给的算法是「同项目其他记录里出现 ≥3 次即通用词」。实测这个绝对阈值
在 157 条记录的项目里会产出 **308 个通用词**：「数据」(58次)、「验证」(47次)、
「计划」「发送」全部被判成通用词，于是真配对
「发送数据验证计划给罗兴成」只剩 1 个特有词而被误杀。3/157 = 1.9% 显然不通用。
改成按占比（默认 5%，且不少于 3 次）后，同项目通用词降到 4 个，
真配对的得分从 1 升到 5。

## 用法

    python tools/p05_measure.py --run <run-dir>              # 新口径
    python tools/p05_measure.py --run <run-dir> --baseline   # 旧口径对照
    python tools/p05_measure.py --run <run-dir> --sweep      # 参数扫描
    python tools/p05_measure.py --run <run-dir> --verbose    # 附放行明细

退出码：0 正常；2 参数/数据问题。
"""
import argparse
import collections
import glob
import json
import re
import sys
from pathlib import Path

# 待办的 [项目前缀] 与项目主表标题的别名。
# 只放**同义但字面不同**的映射；字面完全一致的由 normalize() 自动匹配。
PROJECT_ALIASES = {
    '车辆靠离卡': '车辆靠(离)卡调度',
    '车辆靠离卡调度': '车辆靠(离)卡调度',
    '机器狗': '具身智能应用',
    '机器狗搬运试点（B栋-8F）': '具身智能应用',
    '深大机器狗应用': '具身智能应用',
    '具身智能': '具身智能应用',
    '海康音柱试点': '分布式联网音柱',
    'F区安检数智化': '航空票件进港安检数智化',
    '755R-顺丰航空F区安检数智化': '航空票件进港安检数智化',
    '全链路': 'AI全链路追溯',
}

STOP = set('的了和与及或在是要把对于这个那个上线进行完成确认联系安排处理项目工作'
           '一下我们他们可以需要已经通过关于相关进行中的地得')

MALICIOUS = [
    # (待办标题片段, 记录标题片段, 说明)
    ('联系李岳天确认和记场地编码及机器狗需求范围',
     '安排倒车辅助激光雷达方案评审会议', '产品给的原始样本'),
    ('组织面向各场地的月台摄像头模糊调整操作培训并输出SOP',
     '梁玉标确认月台AI相机装载率以卸车为主', '共用「月台/场地」'),
    ('组织面向各场地的月台摄像头模糊调整操作培训并输出SOP',
     '成都长兴C21监控画面问题需明天上午现场排查', '同项目不同事'),
    ('组织面向各场地的月台摄像头模糊调整操作培训并输出SOP',
     '核对超脑配置参数并按文档添加月台相机', '共用「月台/相机」'),
    ('联系李岳天确认和记场地编码及机器狗需求范围',
     '机器狗POC需输出含ROI的定型报告并优化避障安全', '共用「机器狗」'),
    ('联系李岳天确认和记场地编码及机器狗需求范围',
     '约教授及合伙人沟通机器狗合作与试点定型，并发送会邀', '共用「机器狗」'),
    ('联系李岳天确认和记场地编码及机器狗需求范围',
     '马龙机器人算法受环境光干扰，微调量超预期10倍', '共用「机器人」'),
]


def terms(value):
    """切词，与 growth.terms_of 保持同一套口径：中文二字、编码整体保留。"""
    out = set()
    pattern = r'[\u4e00-\u9fa5]{2,}|[A-Za-z0-9][A-Za-z0-9_\-]{1,}'
    for token in re.findall(pattern, str(value or '')):
        if re.match(r'^[A-Za-z0-9]', token):
            if not token.isdigit() or len(token) >= 2:
                out.add(token.lower())
            continue
        for i in range(len(token) - 1):
            gram = token[i:i + 2]
            if gram not in STOP:
                out.add(gram)
    return out


def strip_prefix(subject):
    """去掉待办标题的 `[项目名]` 前缀。

    前缀是**项目归属**信息，不是「这件事是什么」，和项目通用词同理——
    它必然在同项目每条待办里出现，拿它当判据等于把「同项目」又判了一遍。
    生产代码 growth._record_matches_todo 也是这么做的，测量必须一致。
    """
    stripped = re.sub(r'^\s*[\[【].*?[\]】]\s*', '', str(subject or ''))
    return stripped or str(subject or '')


def normalize(text):
    return re.sub(r'[\s（）()【】\[\]·—\-_]', '', str(text or ''))


def todo_prefix(subject):
    m = re.match(r'^\s*[\[【](.+?)[\]】]', str(subject or ''))
    return m.group(1).strip() if m else None


def map_todo_to_project(todo, projects):
    """待办的 [前缀] → 项目 id。匹配不上返回 None（该待办不进入矩阵）。"""
    prefix = todo_prefix(todo.get('subject'))
    if not prefix:
        return None
    target = PROJECT_ALIASES.get(prefix, prefix)
    nt = normalize(target)
    for p in projects:
        title = normalize(p.get('title'))
        if title == nt or nt in title or title in nt:
            return p['id']
    return None


class Corpus:
    """预计算：每条记录的词集、每个项目的通用词集。

    通用词 = 同项目其他记录**标题**里出现占比 ≥frac（且不少于 floor 次）的二字词。
    只看标题（短且干净），与被比对记录用哪几个字段无关——这样「领域词」的判定
    是稳定的，不会因为某条 solution 写得长就把词变成通用。纯函数、确定性。
    """

    def __init__(self, records, frac=0.05, floor=3):
        self.records = records
        self.by_id = {r['id']: r for r in records}
        self.projects = {r['id']: set(r.get('project_ids') or []) for r in records}
        self.title_terms = {r['id']: terms(r.get('title')) for r in records}
        self.text_terms = {
            fid: terms(' '.join(str(r.get(k) or '')
                                for k in ('title', 'description', 'solution')))
            for fid, r in self.by_id.items()
        }
        self.peers = collections.defaultdict(list)
        for r in records:
            for pid in self.projects[r['id']]:
                self.peers[pid].append(r)
        self.generic = {}
        for pid, rows in self.peers.items():
            freq = collections.Counter()
            for r in rows:
                for t in self.title_terms[r['id']]:
                    freq[t] += 1
            cut = max(floor, frac * len(rows))
            self.generic[pid] = {t for t, c in freq.items() if c >= cut}

    def peer_generic(self, record_id):
        out = set()
        for pid in self.projects[record_id]:
            out |= self.generic.get(pid, set())
        return out

    def specific(self, record_id, subject):
        return terms(strip_prefix(subject)) - self.peer_generic(record_id)

    def score(self, record_id, subject, fields='title'):
        spec = self.specific(record_id, subject)
        if not spec:
            return 0
        got = self.title_terms[record_id] if fields == 'title' else self.text_terms[record_id]
        return len(spec & got)

    def containment(self, record_id, subject):
        """同义改写兜底用的包含度：交集 / 较短一方词数。"""
        want = terms(strip_prefix(subject))
        got = self.title_terms[record_id]
        if not want or not got:
            return 0.0
        return len(want & got) / min(len(want), len(got))

    def any_overlap(self, record_id, subject):
        """旧口径：任意一对实词重合。"""
        return bool(terms(subject) & self.title_terms[record_id])


def find_record(records, fragment):
    for r in records:
        if fragment in str(r.get('title') or ''):
            return r
    return None


def plan_pairs(runs_root):
    """历史 plan 里 `create_todo` + `record_ref` 的配对 = 系统自己承认的同源正例。

    这比 links.json 更可信：同一轮里模型为这条待办新建了这条记录并显式关联，
    等价于「先建档再关待办」——正是我们要求模型走的路径。
    """
    pairs = []
    for f in sorted(glob.glob(str(Path(runs_root).expanduser() / '*' / 'plan.json'))):
        try:
            plan = json.loads(Path(f).read_text(encoding='utf-8'))
        except Exception:
            continue
        acts = plan.get('actions') or []
        by_ref = {a.get('ref'): a for a in acts if a.get('op') == 'create_record'}
        for a in acts:
            if a.get('op') == 'create_todo' and a.get('record_ref'):
                rec = by_ref.get(a['record_ref'])
                if rec and a.get('title') and rec.get('title'):
                    pairs.append({'todo': a['title'], 'record': rec['title'],
                                  'run': Path(f).parent.name,
                                  'same_source': a.get('source_id') == rec.get('source_id')})
    return pairs


def evaluate(bundle, corpus, min_specific=2, fields='title', links=None, pairs=None,
             containment=0.35):
    tables = bundle.get('tables') or {}
    records = tables.get('records') or []
    projects = tables.get('projects') or []
    todos = bundle.get('todos') or []

    def ok(rid, subject):
        return (corpus.score(rid, subject, fields) >= min_specific
                or corpus.containment(rid, subject) >= containment)

    # ① 恶意样本
    mal_bad, mal_rows = 0, []
    for todo_frag, rec_frag, why in MALICIOUS:
        rec = find_record(records, rec_frag)
        if rec is None:
            mal_rows.append(('skip', rec_frag, todo_frag, why, 0))
            continue
        n = corpus.score(rec['id'], todo_frag, fields)
        hit = ok(rec['id'], todo_frag)
        mal_bad += 1 if hit else 0
        mal_rows.append(('hit' if hit else 'reject', rec_frag, todo_frag, why, n))

    # ② 全局矩阵
    total = passed = 0
    per_todo = []
    for t in todos:
        pid = map_todo_to_project(t, projects)
        if pid is None:
            continue
        peers = corpus.peers.get(pid) or []
        if not peers:
            continue
        hits = [r for r in peers if ok(r['id'], t.get('subject'))]
        total += len(peers)
        passed += len(hits)
        per_todo.append({'todo': t, 'pid': pid, 'hits': hits,
                         'n_hits': len(hits), 'n_peers': len(peers)})
    rate = 100.0 * passed / total if total else 0.0

    # ④a 全部待办挡住率
    zero = [x for x in per_todo if x['n_hits'] == 0]
    block_all = 100.0 * len(zero) / len(per_todo) if per_todo else 0.0

    # ④b 误杀候选：旧口径能对上、新口径对不上
    false_neg = []
    for x in per_todo:
        if x['n_hits'] > 0:
            continue
        old = [r for r in (corpus.peers.get(x['pid']) or [])
               if corpus.any_overlap(r['id'], x['todo'].get('subject'))]
        if old:
            false_neg.append({**x, 'old_hits': old})
    fn_rate = 100.0 * len(false_neg) / len(per_todo) if per_todo else 0.0

    # ③ 正例：links.json + plan 里 create_todo 的 record_ref
    positives = []
    for tid, link in (links or {}).items():
        todo = next((t for t in todos if str(t.get('taskId')) == str(tid)), None)
        if todo is None:
            continue
        for rid in link.get('record_ids') or []:
            if rid in corpus.by_id:
                positives.append(('links/' + str(tid), todo.get('subject'), rid))
    for p in (pairs or []):
        rec = find_record(records, p['record'])
        if rec is None:
            continue
        subj = p['todo']
        if not subj.startswith('['):
            # plan 里的待办标题不带 [项目] 前缀，补上以便与生产口径一致
            owner = corpus.projects.get(rec['id']) or set()
            title = next((x.get('title') for x in projects if x['id'] in owner), '')
            subj = '[' + str(title) + '] ' + subj
        positives.append((p['run'], subj, rec['id']))

    kept = killed = 0
    killed_rows = []
    for who, subj, rid in positives:
        n = corpus.score(rid, subj, fields)
        if ok(rid, subj):
            kept += 1
        else:
            killed += 1
            killed_rows.append((who, rid, subj, n))

    return {
        'mal_bad': mal_bad, 'mal_rows': mal_rows,
        'total': total, 'passed': passed, 'rate': rate,
        'per_todo': per_todo, 'zero': zero, 'block_all': block_all,
        'false_neg': false_neg, 'fn_rate': fn_rate,
        'kept': kept, 'killed': killed, 'killed_rows': killed_rows,
        'n_positives': len(positives),
        'corpus': corpus,
    }


def report(r, title, verbose=False, top=6, examples=6):
    print('\n' + '=' * 78)
    print(title)
    print('=' * 78)
    print('\n① 恶意样本（必须全部拒绝）')
    for kind, rec_frag, todo_frag, why, n in r['mal_rows']:
        mark = {'hit': '放行 ← 漏洞', 'reject': '拒绝 ✓', 'skip': '[skip] 记录不在证据'}[kind]
        if kind != 'skip':
            print('   %-12s 命中%d  %-28s ← %-26s (%s)'
                  % (mark, n, rec_frag[:28], todo_frag[:26], why))
    print('   小计：放行 %d 条' % r['mal_bad'])

    print('\n② 全局配对矩阵（待办 × 同项目记录）')
    print('   配对总数 %d，放行 %d = %.1f%%   （目标 ≤10%%）'
          % (r['total'], r['passed'], r['rate']))
    counts = sorted(x['n_hits'] for x in r['per_todo'])
    if counts:
        print('   每待办放行数：中位数 %d，最大 %d，最小 %d'
              % (counts[len(counts) // 2], counts[-1], counts[0]))

    print('\n③ 正例回归（links.json 已登记 + plan 里 create_todo 的 record_ref）')
    print('   正例 %d 对：认得 %d ／ 误杀 %d' % (r['n_positives'], r['kept'], r['killed']))
    for who, rid, subj, n in r['killed_rows']:
        print('     ✗ %-24s %s（命中 %d）← %s' % (who, rid, n, str(subj)[:40]))

    print('\n④a 全部待办挡住率（含本来就没记录可对的）')
    print('   挡住 %d / %d = %.1f%%'
          % (len(r['zero']), len(r['per_todo']), r['block_all']))

    print('\n④b 误杀候选（旧口径能对上 & 新口径对不上）= 收紧的真实代价')
    print('   %d / %d = %.1f%%' % (len(r['false_neg']), len(r['per_todo']), r['fn_rate']))
    for x in r['false_neg'][:examples]:
        print('   · 旧命中%2d  %s' % (len(x['old_hits']), str(x['todo'].get('subject'))[:52]))
        for rec in x['old_hits'][:2]:
            print('        ' + str(rec.get('title'))[:58])

    if verbose:
        print('\n放行最多的待办')
        for x in sorted(r['per_todo'], key=lambda y: -y['n_hits'])[:top]:
            print('   [%d/%d] %s' % (x['n_hits'], x['n_peers'],
                                     str(x['todo'].get('subject'))[:50]))
            for rec in x['hits'][:4]:
                print('        · ' + str(rec.get('title'))[:58])


def report_old(bundle, corpus, links, pairs):
    tables = bundle.get('tables') or {}
    projects = tables.get('projects') or []
    todos = bundle.get('todos') or []
    print('\n① 恶意样本')
    mal = 0
    for todo_frag, rec_frag, why in MALICIOUS:
        rec = find_record(tables.get('records') or [], rec_frag)
        if rec is None:
            continue
        hit = corpus.any_overlap(rec['id'], todo_frag)
        mal += 1 if hit else 0
        print('   %-12s %-28s ← %-26s (%s)'
              % ('放行 ← 漏洞' if hit else '拒绝 ✓', rec_frag[:28], todo_frag[:26], why))
    print('   小计：放行 %d 条' % mal)

    total = passed = 0
    per_todo = []
    for t in todos:
        pid = map_todo_to_project(t, projects)
        if pid is None:
            continue
        peers = corpus.peers.get(pid) or []
        if not peers:
            continue
        hits = [r for r in peers if corpus.any_overlap(r['id'], t.get('subject'))]
        total += len(peers)
        passed += len(hits)
        per_todo.append((t, len(hits), len(peers)))
    print('\n② 全局配对矩阵')
    print('   配对总数 %d，放行 %d = %.1f%%'
          % (total, passed, 100.0 * passed / total if total else 0))
    counts = sorted(x[1] for x in per_todo)
    if counts:
        print('   每待办放行数：中位数 %d，最大 %d，最小 %d'
              % (counts[len(counts) // 2], counts[-1], counts[0]))
    zero = [x for x in per_todo if x[1] == 0]
    print('\n④a 全部待办挡住率')
    print('   挡住 %d / %d = %.1f%%'
          % (len(zero), len(per_todo),
             100.0 * len(zero) / len(per_todo) if per_todo else 0))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--run', required=True, help='run 目录（含 evidence.json）')
    ap.add_argument('--baseline', action='store_true', help='旧算法（任意一对实词）')
    ap.add_argument('--sweep', action='store_true', help='扫描阈值 × 通用词占比')
    ap.add_argument('--ml', default='2', help='特有词阈值，逗号分隔')
    ap.add_argument('--frac', type=float, default=0.05, help='通用词占比阈值')
    ap.add_argument('--floor', type=int, default=3, help='通用词最少出现次数')
    ap.add_argument('--ct', type=float, default=0.35, help='同义改写包含度阈值')
    ap.add_argument('--fields', default='title', choices=['title', 'text'])
    ap.add_argument('--links', default=str(Path('~/.local/state/nianlun/links.json').expanduser()))
    ap.add_argument('--runs', default=str(Path('~/.local/state/nianlun/runs').expanduser()))
    ap.add_argument('--verbose', action='store_true')
    args = ap.parse_args()

    run = Path(args.run).expanduser()
    ev = run / 'evidence.json'
    if not ev.exists():
        print('找不到 evidence.json：' + str(ev), file=sys.stderr)
        return 2
    bundle = json.loads(ev.read_text(encoding='utf-8'))
    links_path = Path(args.links).expanduser()
    links = json.loads(links_path.read_text(encoding='utf-8')) if links_path.exists() else {}
    pairs = plan_pairs(args.runs)

    tables = bundle.get('tables') or {}
    print('数据：' + str(ev))
    print('待办 %d ／ 记录 %d ／ 项目 %d ／ links %d ／ plan 正例 %d'
          % (len(bundle.get('todos') or []), len(tables.get('records') or []),
             len(tables.get('projects') or []), len(links), len(pairs)))

    if args.baseline:
        report_old(bundle, Corpus(tables.get('records') or []), links, pairs)
        return 0

    if args.sweep:
        print('\n' + '=' * 78)
        print('口径扫描：特有词阈值 × 通用词占比 × 比对字段')
        print('=' * 78)
        print('%-4s %-6s %-5s %-4s %-8s %-9s %-8s %-6s %-6s %-6s'
              % ('ml', 'frac', 'ct', 'fld', '②误放', '④b误杀', '④a挡住', '①漏洞', '③认', '③杀'))
        for ml in [int(x) for x in args.ml.split(',')]:
            for frac in (0.03, 0.05, 0.08, 0.10):
                for fields in ('title', 'text'):
                    c = Corpus(tables.get('records') or [], frac=frac, floor=args.floor)
                    r = evaluate(bundle, c, ml, fields, links, pairs, containment=args.ct)
                    print('%-4d %-6.2f %-5.2f %-4s %-8s %-9s %-8s %-6d %-6d %-6d'
                          % (ml, frac, args.ct, fields,
                             '%.1f%%' % r['rate'], '%.1f%%' % r['fn_rate'],
                             '%.1f%%' % r['block_all'], r['mal_bad'], r['kept'], r['killed']))
        return 0

    ml = int(args.ml.split(',')[0])
    c = Corpus(tables.get('records') or [], frac=args.frac, floor=args.floor)
    r = evaluate(bundle, c, ml, args.fields, links, pairs, containment=args.ct)
    report(r, '新口径：≥%d 个特有词 或 包含度≥%.2f（通用词按占比≥%.0f%%/至少%d次剔除，字段：%s）'
           % (ml, args.ct, args.frac * 100, args.floor, args.fields), args.verbose)
    return 0


if __name__ == '__main__':
    sys.exit(main())
