"""主动推进：把「什么过期了」变成「下一步该做什么」。

## 产品定位（飞哥 2026-11-08 定：选 C）

年轮原来是被动记账——记录发生了什么，需要时能查。用户打开看到的是一堆事实，
但**「所以我今天该干什么」要自己判断**。

这一层做三件事：

1. **行动建议**：每条过期里程碑给出可执行的下一步，不是只说「已过期 69 天」
2. **健康度评分**：用三个客观指标（记录新鲜度、里程碑达成率、过期占比）
   给项目打分，让「哪个项目需要我」一眼可见
3. **每周聚焦**：把上述结果收敛成「本周该关注这几件事」

## 一条铁律：建议必须能追溯

所有建议都由**数据算出来**，并附 `basis` 说明依据。模型只负责把依据
组织成人话，不许凭空发明「建议约个会」这类没有数据支撑的话。
用户点开任何一条建议，都要能看到它是从哪几条里程碑/记录推出来的。
"""
from datetime import date, datetime, timedelta

import nianlun as n

# 真实完成态。⚠️ 数据里没有「已完成/已取消/已关闭」这些值（实测 200 条）：
# 待核 83 / 未开始 66 / 进行中 18 / 待核对 15 / 已延期 12 / 已达成 8 / 空 1。
# 照抄通用写法会永远匹配不上，等于没过滤——这个坑已经栽过三次。
DONE_STATUS = ('已达成', '已完成', '已取消', '已关闭', '已解决')

# 健康度分档：用中文而不是 A/B/C，避免和项目优先级 P0/P1 混淆。
LEVELS = ((80, '健康'), (60, '留意'), (40, '需干预'), (0, '有风险'))


def _ids(row):
    """关联字段是 JSON 字符串数组，也可能已经是 list。"""
    import json
    value = row.get('project_ids')
    if isinstance(value, list):
        return [str(x) for x in value if x]
    if isinstance(value, str) and value.strip().startswith('['):
        try:
            return [str(x) for x in json.loads(value) if x]
        except Exception:
            return []
    return []


def _day(value):
    """只接受完整的 YYYY-MM-DD；其它一律当作没有日期（不能瞎猜）。"""
    raw = str(value or '')[:10]
    if len(raw) != 10 or raw.count('-') != 2:
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return None


def is_done(status):
    return str(status or '').strip() in DONE_STATUS


def overdue_days(row, today):
    """未完成且日期早于今天 → 返回过期天数，否则 0。"""
    if is_done(row.get('status')):
        return 0
    due = _day(row.get('date'))
    if not due:
        return 0
    days = (today - due).days
    return days if days > 0 else 0


def advance(milestone, today, siblings=None):
    """给一条过期里程碑算出「下一步该做什么」。

    返回 {'action','why','basis'}；action 是短句，why 是依据说明。
    依据分级——不同状态该做的事不一样，不能一句话套所有情况：

    - 已延期：说明它已经被认定拖延，要做的是重排时间或明确阻塞
    - 进行中：日期过了还在做，要确认是否还按原计划
    - 未开始/待核：日期过了还没启动，先判断是「不用做」还是「没启动」
    """
    days = overdue_days(milestone, today)
    if days <= 0:
        return None
    status = str(milestone.get('status') or '').strip() or '未设状态'
    title = str(milestone.get('title') or '未命名里程碑').strip()
    due = str(milestone.get('date') or '')[:10]
    base = f'{due} 到期，已过 {days} 天，当前状态「{status}」'

    if status == '已延期':
        action = '重排时间或明确阻塞原因'
        why = f'{title} 已标记延期 {days} 天。要么给它一个新日期，要么写清在等谁。'
    elif status == '进行中':
        action = '确认是否仍按原计划交付'
        why = f'{title} 日期已过 {days} 天但仍在进行中，需要判断是收尾还是重排。'
    else:
        action = '判断还需要做：要就排期，不要就关闭'
        why = f'{title} 原定 {due}，已过 {days} 天仍未启动。空着比关掉更危险。'

    # 同项目还有别的过期项时，提醒这是「成片」而不是孤例。
    if siblings:
        same = [x for x in siblings if x is not milestone and overdue_days(x, today) > 0]
        if len(same) >= 2:
            why += f'同项目另有 {len(same)} 条里程碑也过期，建议一起看。'
    return {'action': action, 'why': why, 'basis': base, 'days': days,
            'title': title, 'date': due, 'status': status}


def health(project, milestones, records, today, reports=None):
    """算一个项目的健康度。三个指标都是客观数据，不掺主观判断。

    - `freshness` 记录新鲜度：最近一条记录距今多少天（越久越差）
    - `progress`  里程碑达成率：已达成 / 总数
    - `overdue`   过期占比：已过期未完成 / 总数

    没有数据时给 `None` 而不是 0——「没有里程碑」和「里程碑全没完成」
    是完全不同的两件事，混在一起会冤枉新项目。
    """
    pid = str(project.get('id') or '')
    own_ms = [m for m in milestones if pid in _ids(m)]
    own_rec = [r for r in records if pid in _ids(r)]

    dates = [_day(r.get('date')) for r in own_rec]
    dates = [d for d in dates if d]
    freshness = (today - max(dates)).days if dates else None

    total = len(own_ms)
    done = len([m for m in own_ms if is_done(m.get('status'))])
    late = len([m for m in own_ms if overdue_days(m, today) > 0])
    progress = round(done * 100 / total) if total else None
    overdue_pct = round(late * 100 / total) if total else None

    # 打分：三项各占权重，缺项不计入分母（不做「缺数据扣分」这种冤枉事）。
    parts = []
    if freshness is not None:
        # 7 天内满分，30 天归零，中间线性。
        parts.append((max(0.0, min(1.0, (30 - freshness) / 23)), 0.35))
    if progress is not None:
        # ⚠️ 达成率要按样本量打折。实测第一版直接把「达成率 0%」当重度扣分，
        # 结果只有 6 条里程碑的项目（3 条过期）比有 31 条里程碑、10 条过期的
        # 项目分数还低——小样本的 0% 说明不了什么，不能让统计噪音盖过大项目。
        # 样本 <5 时只计三成权重，5~10 按比例递增，10 以上足额。
        sample = min(1.0, total / 10.0)
        parts.append((min(1.0, progress / 60.0), 0.35 * (0.3 + 0.7 * sample)))
    if overdue_pct is not None:
        # 过期占比同理，但绝对条数也有意义：过期越多越该看。
        abs_weight = min(1.0, late / 5.0)
        parts.append((max(0.0, 1.0 - overdue_pct / 50.0), 0.30 * (0.5 + 0.5 * abs_weight)))

    if not parts:
        score = None
    else:
        weight = sum(w for _, w in parts)
        score = round(sum(v * w for v, w in parts) / weight * 100)

    level = ''
    if score is not None:
        for floor, name in LEVELS:
            if score >= floor:
                level = name
                break

    signals = []
    if freshness is not None and freshness > 14:
        signals.append(f'已经 {freshness} 天没有新记录')
    if late:
        signals.append(f'{late} 条里程碑过期')
    if progress is not None and total >= 5 and progress == 0:
        signals.append(f'{total} 条里程碑一条都没达成')
    if total == 0:
        signals.append('还没有里程碑，无法判断进度')

    return {
        'project_id': pid,
        'title': str(project.get('title') or ''),
        'score': score,
        'level': level,
        'freshness_days': freshness,
        'progress_pct': progress,
        'overdue_pct': overdue_pct,
        'milestones': total,
        'done': done,
        'late': late,
        'records': len(own_rec),
        'signals': signals,
    }


def build(state, reports=None, today=None):
    """把整个工作区算成一份「本周该关注什么」。

    `state` 是平铺结构（同 build_home）：projects/milestones/records/sites。
    返回结构供前端直接渲染，也供报告 prompt 当材料。
    """
    today = today or date.today()
    projects = state.get('projects') or []
    milestones = state.get('milestones') or []
    records = state.get('records') or []

    # 1. 行动建议：只对「有项目归属」的过期里程碑给建议。
    #    没有归属的说明数据本身缺关联，给建议也无处落地——单独计数暴露出来。
    by_pid = {}
    orphans = 0
    for m in milestones:
        ids = _ids(m)
        if not ids:
            if overdue_days(m, today) > 0:
                orphans += 1
            continue
        for pid in ids:
            by_pid.setdefault(pid, []).append(m)

    actions = []
    for project in projects:
        pid = str(project.get('id') or '')
        own = by_pid.get(pid) or []
        for m in own:
            item = advance(m, today, own)
            if item:
                item['project_id'] = pid
                item['project'] = str(project.get('title') or '')
                actions.append(item)
    actions.sort(key=lambda x: -x['days'])

    # 2. 健康度
    scores = [health(p, milestones, records, today, reports) for p in projects]
    # 分数低的排前面——用户要先看需要干预的。
    scores.sort(key=lambda x: (x['score'] is None, x['score'] if x['score'] is not None else 999))

    # 3. 本周聚焦：从上面两类里挑最该动的 3 件
    focus = []
    for item in actions[:3]:
        focus.append({'kind': 'overdue', 'project': item['project'],
                      'project_id': item['project_id'],
                      'line': item['action'], 'why': item['why'], 'days': item['days']})
    if len(focus) < 3:
        for row in scores:
            if len(focus) >= 3:
                break
            if row['score'] is None or row['score'] >= 60:
                continue
            if any(f['project_id'] == row['project_id'] for f in focus):
                continue
            focus.append({'kind': 'health', 'project': row['title'],
                          'project_id': row['project_id'],
                          'line': '项目健康度 ' + str(row['score']) + ' 分（' + row['level'] + '）',
                          'why': '；'.join(row['signals']) or '多项指标偏低'})

    return {
        'generated_for': today.isoformat(),
        'actions': actions,
        'scores': scores,
        'focus': focus,
        'orphan_overdue': orphans,
        'totals': {
            'projects': len(projects),
            'milestones': len(milestones),
            'overdue': len(actions),
        },
    }
