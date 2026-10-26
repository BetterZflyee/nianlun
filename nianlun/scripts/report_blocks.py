"""Small declarative report visuals. Model output is data, never HTML or ECharts code."""
import base64
import datetime
import hashlib
import json
import math
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / 'assets/report'
FENCE = re.compile(r'^```visual[ \t]*\n(.*?)\n```[ \t]*$', re.M | re.S)
CITE = re.compile(r'\[([PRMSK]\d+)\]')
STATES = {'done': ('已完成', '#2f6350'), 'active': ('推进中', '#486d88'),
          'blocked': ('受阻', '#bc4941'), 'planned': ('计划', '#897c54'), 'unknown': ('待核实', '#788579')}


def text(value, limit=160, field='图中文字'):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError(field+' 须为 1 至 '+str(limit)+' 字的非空文本')
    if re.search(r'<|>|https?://|[\x00-\x08]', value):
        raise ValueError('图形仅接受文字，不接受 HTML 或外部链接')
    return value


def validate(config, evidence=None):
    if not isinstance(config, dict): raise ValueError('visual 必须是 JSON 对象')
    kind = config.get('type')
    common = {'type', 'title', 'caption'}
    fields = {'status': {'items'}, 'graph': {'nodes', 'links'},
              'matrix': {'stages', 'items'},
              'gantt': {'start', 'end', 'today', 'milestones', 'rows'},
              'bar': {'categories', 'series', 'unit', 'source'},
              'line': {'categories', 'series', 'unit', 'source'}}
    # 写作模型常凭语义写出 flow、timeline、流程图等写法，语义等同关系图：归一化而不打断成稿。
    if isinstance(kind,str):
        compact=kind.replace(' ','').replace('_','').replace('-','').replace('/','').casefold()
        aliases={'flow':'graph','flowlr':'graph','flowtb':'graph','timeline':'graph','process':'graph',
                 '关系图':'graph','流程图':'graph','状态':'status','进度':'status','矩阵':'matrix',
                 '柱状图':'bar','折线图':'line','趋势':'line','甘特图':'gantt','时间轴':'gantt'}
        key=compact if compact in aliases else compact.split('｜')[0]
        if key in aliases:
            kind=aliases[key]; config=dict(config); config['type']=kind
    if kind not in fields: raise ValueError('visual 类型只能为 status、graph、matrix、gantt、bar、line')
    if set(config) - common - fields[kind]: raise ValueError('visual 包含不支持的字段')
    text(config.get('title'), 60, 'title'); text(config.get('caption'), 180, 'caption')
    def source(value):
        text(value, 150)
        refs = CITE.findall(value)
        if not refs: raise ValueError('图形须使用 [R1] 等给定依据编号')
        if evidence is not None and set(refs) - {x['key'] for x in evidence}:
            raise ValueError('图形包含不存在的依据编号')
    def item(row, allowed, state_optional=False, require_source=True):
        if not isinstance(row, dict) or set(row) - allowed: raise ValueError('图形条目字段不合法')
        text(row.get('label'), 26, 'label'); text(row.get('detail'), 100, 'detail')
        if require_source: source(row.get('source'))
        elif row.get('source'): source(row.get('source'))
        if state_optional and not row.get('state'): row['state']='active'
        if row.get('state') not in STATES: raise ValueError('状态只能为 done、active、blocked、planned、unknown')
    if kind == 'status':
        rows = config.get('items')
        if not isinstance(rows, list) or not 1 <= len(rows) <= 4: raise ValueError('状态图须为 1 至 4 项')
        for row in rows:
            item(row, {'label', 'detail', 'state', 'next', 'source'})
            if row.get('next') is not None and row.get('next')!='':text(row['next'], 100, 'next')
    elif kind == 'matrix':
        stages, rows = config.get('stages'), config.get('items')
        if not isinstance(stages, list) or not 2 <= len(stages) <= 6: raise ValueError('矩阵须为 2 至 6 个阶段')
        for name in stages:
            text(name, 8, '阶段名')
        if not isinstance(rows, list) or not 1 <= len(rows) <= 12: raise ValueError('矩阵须为 1 至 12 个对象')
        for row in rows:
            item(row, {'label', 'stage', 'state', 'detail', 'next', 'source'}, state_optional=True)
            if row.get('stage') not in stages: raise ValueError('矩阵行的阶段须在 stages 中')
            if row.get('detail') is not None: text(row['detail'], 60, 'detail')
            if row.get('next') is not None and row['next'] != '': text(row['next'], 60, 'next')
        # 统一按推进节奏排序：已完成/最接近完成的在前，筹备与未启动的在后；同阶段内保持原顺序。
        config['items'] = sorted(rows, key=lambda r: stages.index(r['stage']), reverse=True)
    elif kind == 'gantt':
        def day(value, label):
            text(value, 10, label)
            try:
                return datetime.date.fromisoformat(value)
            except ValueError as exc:
                raise ValueError(f'{label} 须为 YYYY-MM-DD 日期') from exc
        # start/end 可省略：省略时由数据自动推出聚焦的时间窗
        if bool(config.get('start')) != bool(config.get('end')):
            raise ValueError('gantt 的 start 与 end 需同时给出或同时省略')
        if config.get('start'):
            first, last = day(config['start'], 'start'), day(config['end'], 'end')
            if last <= first: raise ValueError('gantt 的 end 须晚于 start')
        if config.get('today'): day(config['today'], 'today')
        marks = config.get('milestones') or []
        if not isinstance(marks, list) or len(marks) > 8: raise ValueError('里程碑须为 0 至 8 个')
        for m in marks:
            if not isinstance(m, dict) or set(m) - {'date', 'label', 'source'}:
                raise ValueError('里程碑字段不合法')
            day(m.get('date'), '里程碑日期'); text(m.get('label'), 18, '里程碑说明')
            source(m.get('source'))
        rows = config.get('rows')
        if not isinstance(rows, list) or not 1 <= len(rows) <= 12: raise ValueError('甘特图须为 1 至 12 个对象')
        for row in rows:
            if not isinstance(row, dict) or set(row) - {'label', 'state', 'stage', 'segments', 'points', 'source'}:
                raise ValueError('甘特行字段不合法')
            text(row.get('label'), 26, 'label'); source(row.get('source'))
            if row.get('state') not in STATES: raise ValueError('甘特行状态不合法')
            segs = row.get('segments') or []
            if not isinstance(segs, list) or len(segs) > 6: raise ValueError('每行分段须为 0 至 6 段')
            for seg in segs:
                if not isinstance(seg, dict) or set(seg) - {'from', 'to', 'label', 'state', 'kind'}:
                    raise ValueError('分段字段不合法')
                a, b = day(seg.get('from'), '分段起点'), day(seg.get('to'), '分段终点')
                if b < a: raise ValueError('分段终点早于起点')
                text(seg.get('label'), 12, '分段说明')
                if seg.get('state') and seg['state'] not in STATES: raise ValueError('分段状态不合法')
                if seg.get('kind') not in (None, 'actual', 'plan'): raise ValueError('分段类型只能为 actual 或 plan')
            pts = row.get('points') or []
            if not isinstance(pts, list) or len(pts) > 6: raise ValueError('每行节点须为 0 至 6 个')
            for pt in pts:
                if not isinstance(pt, dict) or set(pt) - {'date', 'label', 'state'}:
                    raise ValueError('节点字段不合法')
                day(pt.get('date'), '节点日期'); text(pt.get('label'), 14, '节点说明')
                if pt.get('state') and pt['state'] not in STATES: raise ValueError('节点状态不合法')
    elif kind == 'graph':
        rows, links = config.get('nodes'), config.get('links')
        if not isinstance(rows, list) or not 2 <= len(rows) <= 9: raise ValueError('关系图须为 2 至 9 个节点')
        if not isinstance(links, list) or not 1 <= len(links) <= 9: raise ValueError('关系图须为 1 至 9 条有依据的连线')
        ids = set(); layers = {}
        for row in rows:
            item(row, {'id', 'label', 'detail', 'state', 'layer', 'source'}, require_source=False)
            if not isinstance(row.get('id'), str) or not re.fullmatch(r'[a-zA-Z][\w-]{0,20}', row['id']): raise ValueError('节点 id 不合法')
            if row['id'] in ids: raise ValueError('节点 id 重复')
            ids.add(row['id'])
            layer = row.get('layer')
            if type(layer) is not int or layer not in (0, 1, 2): raise ValueError('layer 须为 0、1 或 2')
            layers[layer] = layers.get(layer, 0) + 1
        if max(layers.values()) > 3: raise ValueError('每列最多 3 个节点')
        if not any(row.get('source') for row in rows) and not any(isinstance(link,dict) and link.get('source') for link in (links or [])): raise ValueError('关系图至少需要一个节点或连线标注依据编号')
        seen = set()
        by_id={n['id']:n for n in rows}
        for edge in links:
            if not isinstance(edge, dict) or set(edge) != {'from', 'to', 'label', 'source'}: raise ValueError('连线须含 from、to、label、source')
            pair = (edge['from'], edge['to'])
            if any(x not in ids for x in pair) or pair[0] == pair[1] or pair in seen: raise ValueError('连线端点缺失、自连或重复')
            if by_id[pair[0]]['layer'] >= by_id[pair[1]]['layer']: raise ValueError('推进连线须从较小 layer 指向较大 layer；并列事项用状态图')
            seen.add(pair); text(edge['label'], 24); source(edge['source'])
    else:
        cats, series = config.get('categories'), config.get('series')
        if not isinstance(cats, list) or not 2 <= len(cats) <= 12: raise ValueError('统计图须为 2 至 12 个类别')
        for cat in cats: text(cat, 24)
        if len(set(cats)) != len(cats): raise ValueError('类别重复')
        if not isinstance(series, list) or not 1 <= len(series) <= 3: raise ValueError('统计图须为 1 至 3 组真实数据')
        text(config.get('unit'), 20); source(config.get('source'))
        for row in series:
            if not isinstance(row, dict) or set(row) != {'name', 'data'}: raise ValueError('数据组仅接受 name 和 data')
            text(row['name'], 24)
            if not isinstance(row['data'], list) or len(row['data']) != len(cats): raise ValueError('数值与类别须逐一对应')
            if any(type(v) not in (int, float) or not math.isfinite(v) or abs(v) > 1e12 for v in row['data']): raise ValueError('统计图须使用有限真实数值')
    return config


def parse(markdown, evidence=None):
    blocks = []
    def replace(match):
        try: config = validate(json.loads(match[1]), evidence)
        except (ValueError, TypeError, KeyError) as exc: raise ValueError('可视化格式：' + str(exc)) from exc
        token = 'NLVISUAL' + hashlib.sha256(match[0].encode()).hexdigest()[:20].upper() + str(len(blocks))
        blocks.append((token, config))
        if len(blocks) > 6: raise ValueError('精简汇报最多 6 张图')
        return '\n\n' + token + '\n\n'
    return FENCE.sub(replace, markdown), blocks


def prose(markdown):
    """Count labels, captions and conclusions, not JSON syntax/layout metadata."""
    plain, blocks = parse(markdown)
    for token, config in blocks:
        strings = []
        def walk(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key not in ('id', 'from', 'to', 'state', 'layer', 'type', 'source'): walk(value)
            elif isinstance(obj, list):
                for value in obj: walk(value)
            else: strings.append(str(obj))
        walk(config); plain = plain.replace(token, ' '.join(strings))
    return plain


def refs(value):
    return CITE.sub(lambda m: '<a href="#source-' + m[1] + '" aria-label="依据 ' + m[1] + '">[' + m[1] + ']</a>', escape(value))


def positions(config):
    rows = config['nodes']; layers = sorted({n['layer'] for n in rows}); result = {}
    for col, layer in enumerate(layers):
        group = [n for n in rows if n['layer'] == layer]
        for row, node in enumerate(group):
            result[node['id']] = (126 + col * 290, 70 + row * 130)
    return result, max(1, len(layers)) * 290 - 38, max(sum(n['layer'] == x for n in rows) for x in layers) * 130 + 10


def graph_svg(config, uid):
    pos, width, height = positions(config); out = []
    marker = uid + '-arrow'
    # 直接给出显示尺寸：SVG 作为替换元素在 flex/百分比下宽度解析不稳定，写死像素最可靠
    show_w = 660
    show_h = max(1, round(height * show_w / width))
    out.append(f'<svg viewBox="0 0 {width} {height}" width="{show_w}" height="{show_h}" '
               f'role="img" aria-label="{escape(config["title"])}" '
               f'style="max-width:100%;height:auto;display:block;margin:0 auto"><defs><marker id="{marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6f947e"/></marker></defs>')
    for link in config['links']:
        x, y = pos[link['from']]; xx, yy = pos[link['to']]
        direction = 1 if xx > x else -1
        start, end = x + 106 * direction, xx - 108 * direction
        path = f'M {start} {y} C {(start+end)/2} {y}, {(start+end)/2} {yy}, {end} {yy}'
        out.append(f'<path class="am-edge" d="{path}" fill="none" stroke="#6f947e" stroke-width="2" marker-end="url(#{marker})"/>')
        out.append(f'<text x="{(start+end)/2}" y="{(y+yy)/2-9}" text-anchor="middle" fill="#56685d" font-size="11">{escape(link["label"])}</text>')
    for node in config['nodes']:
        x, y = pos[node['id']]; state, color = STATES[node['state']]
        label=node['label']; lines=[label[i:i+12] for i in range(0,len(label),12)]
        texts=''.join(f'<text x="{x}" y="{y-22+i*18}" text-anchor="middle" font-size="15" fill="#21372d">{escape(line)}</text>' for i,line in enumerate(lines))
        out.append(f'<g class="am-node" data-key="{escape(label)}"><rect x="{x-104}" y="{y-45}" width="208" height="96" rx="12" fill="#f6f8f0" stroke="{color}"/>{texts}<text x="{x}" y="{y+37}" text-anchor="middle" font-size="12" fill="{color}">{state}</text></g>')
    return ''.join(out) + '</svg>'


def gantt_svg(config):
    """时间轴甘特：左侧对象名，右侧时间轴；分段画区间，节点画完成点，竖虚线画里程碑。"""
    first = datetime.date.fromisoformat(config['start'])
    last = datetime.date.fromisoformat(config['end'])
    today = datetime.date.fromisoformat(config['today']) if config.get('today') else None
    rows = config['rows']
    marks = config.get('milestones') or []
    left, right, top, rowh = 164, 934, 86, 38
    span = max(1, (last - first).days)
    height = top + len(rows) * rowh + 26
    def x(d):
        return left + (d - first).days / span * (right - left)
    out = [f'<svg viewBox="0 0 960 {height}" role="img" aria-label="{escape(config["title"])}">']
    # 纵向月份网格
    cursor = datetime.date(first.year, first.month, 1)
    if cursor < first:
        cursor = (cursor.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
    while cursor <= last:
        px = x(cursor)
        out.append(f'<line x1="{px:.1f}" x2="{px:.1f}" y1="{top-8}" y2="{height-20}" stroke="#dce3d7" stroke-width="1"/>')
        out.append(f'<text x="{px+4:.1f}" y="{top-14}" font-size="11" fill="#7d8f83">{cursor.month}月</text>')
        cursor = (cursor.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
    # 里程碑：竖向虚线 + 顶部标签（交错两行避免重叠）
    for i, m in enumerate(marks):
        px = x(datetime.date.fromisoformat(m['date']))
        out.append(f'<line x1="{px:.1f}" x2="{px:.1f}" y1="{top-34}" y2="{height-22}" stroke="#c58a2e" '
                   f'stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85"/>')
        ly = top - 50 + (i % 3) * 13
        out.append(f'<text x="{px:.1f}" y="{ly}" text-anchor="middle" font-size="9.5" fill="#a5751f">'
                   f'{escape(m["label"])}</text>')
    # 今天
    if today:
        px = x(today)
        out.append(f'<line x1="{px:.1f}" x2="{px:.1f}" y1="{top-8}" y2="{height-20}" stroke="#bc4941" stroke-width="1.6"/>')
        out.append(f'<text x="{px:.1f}" y="{height-8}" text-anchor="middle" font-size="10" fill="#bc4941">今天</text>')
    # 每行
    for idx, row in enumerate(rows):
        y = top + idx * rowh
        label, color = STATES[row['state']]
        out.append(f'<text x="0" y="{y+17}" font-size="12" fill="#21372d">{escape(row["label"])}</text>')
        out.append(f'<circle cx="{8}" cy="{y+14}" r="0" fill="none"/>')
        for seg in (row.get('segments') or []):
            a = datetime.date.fromisoformat(seg['from']); b = datetime.date.fromisoformat(seg['to'])
            x1, x2 = x(a), x(b)
            w = max(7.0, x2 - x1)
            _, sc = STATES[seg.get('state') or row['state']]
            out.append(f'<rect x="{x1:.1f}" y="{y+3}" width="{w:.1f}" height="18" rx="4" fill="{sc}" opacity="0.9"/>')
            if seg.get('label') and w > 54:
                out.append(f'<text x="{x1+5:.1f}" y="{y+16}" font-size="9.5" fill="#ffffff">{escape(seg["label"])}</text>')
        if not (row.get('segments') or row.get('points')):
            out.append(f'<text x="{left+8}" y="{y+16}" font-size="10" fill="#9bb09d">本期无记录</text>')
        for pt in (row.get('points') or []):
            px = x(datetime.date.fromisoformat(pt['date']))
            _, pc = STATES[pt.get('state') or row['state']]
            out.append(f'<circle cx="{px:.1f}" cy="{y+12}" r="5.5" fill="{pc}" stroke="#ffffff" stroke-width="2"/>')
            if pt.get('label'):
                d = datetime.date.fromisoformat(pt['date'])
                txt = pt['label'] + ' ' + f'{d.month}-{d.day}'
                anchor = 'end' if px > right - 120 else 'start'
                tx = px - 11 if anchor == 'end' else px + 11
                out.append(f'<text x="{tx:.1f}" y="{y+16}" text-anchor="{anchor}" font-size="10" '
                           f'fill="{pc}" font-weight="600">{escape(txt)}</text>')
    out.append('</svg>')
    return ''.join(out)


def chart_svg(config):
    width,height=720,300;left,right,top,bottom=64,696,30,238
    values=[v for s in config['series'] for v in s['data']]
    low=min(0,min(values));high=max(0,max(values))
    if high==low:high=low+1
    high+=max(1,(high-low)*.12)
    y=lambda v:bottom-(v-low)/(high-low)*(bottom-top)
    step=(right-left)/len(config['categories']);palette=['#2f6350','#8b9d68','#bc4941']
    out=[f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{escape(config["title"])}">']
    for i in range(5):
        v=low+(high-low)*i/4; yy=y(v)
        out.append(f'<line x1="{left}" x2="{right}" y1="{yy}" y2="{yy}" stroke="#9bb09d44"/><text x="{left-8}" y="{yy+4}" font-size="11" fill="#56685d" text-anchor="end">{v:.2g}</text>')
    for i,cat in enumerate(config['categories']):
        x=left+step*(i+.5)
        out.append(f'<text x="{x}" y="{bottom+20}" font-size="11" text-anchor="middle" fill="#21372d">{escape(cat[:8])}</text>')
    for j,series in enumerate(config['series']):
        color=palette[j];points=[]
        for i,value in enumerate(series['data']):
            x=left+step*(i+.5);yy=y(value)
            if config['type']=='bar':
                bar=min(32,step*.7/len(config['series']));xx=x+(j-(len(config['series'])-1)/2)*bar
                out.append(f'<rect x="{xx-bar*.45}" y="{min(yy,y(0))}" width="{bar*.9}" height="{max(.5,abs(yy-y(0)))}" fill="{color}" rx="2"/>')
            else:points.append((x,yy))
        if points:
            out.append('<polyline points="'+' '.join(f'{x},{yy}' for x,yy in points)+f'" fill="none" stroke="{color}" stroke-width="3"/>')
            out.extend(f'<circle cx="{x}" cy="{yy}" r="3" fill="{color}"/>' for x,yy in points)
        out.append(f'<text x="{left+j*180}" y="{height-8}" font-size="12" fill="{color}">● {escape(series["name"])}</text>')
    return ''.join(out)+'</svg>'


# 三值编码：完成 / 在推进 / 静默；品牌红只留给风险与今天线（评审 P1-5）
GANTT_TONE = {
    'done':    ('#e8f0ea', '#2F6350', '#ffffff'),
    'active':  ('#e5efe9', '#3D7A61', '#ffffff'),
    'blocked': ('#fbe9e6', '#E41E2C', '#ffffff'),
    'planned': ('#f1f2f4', '#8A9199', '#ffffff'),
    'unknown': ('#f4f5f6', '#8A9199', '#ffffff'),
}


def _gantt_span(config):
    """时间轴范围：优先用给定 start/end，未给则按数据自动留白。"""
    dates = []
    for row in config['rows']:
        for seg in (row.get('segments') or []):
            dates += [datetime.date.fromisoformat(seg['from']), datetime.date.fromisoformat(seg['to'])]
        for pt in (row.get('points') or []):
            dates.append(datetime.date.fromisoformat(pt['date']))
    # 里程碑不参与焦点窗计算：否则远期节点会把整条轴拉长，画面大半留白
    if config.get('today'):
        dates.append(datetime.date.fromisoformat(config['today']))
    if config.get('start') and config.get('end'):
        return (datetime.date.fromisoformat(config['start']),
                datetime.date.fromisoformat(config['end']), [])
    if not dates:
        today = datetime.date.today()
        return today - datetime.timedelta(days=7), today + datetime.timedelta(days=14), list(config.get('milestones') or [])
    first = min(dates) - datetime.timedelta(days=2)
    core = max(dates) + datetime.timedelta(days=3)
    # 远期里程碑（超出焦点窗）不撑长轴线，改在轴外右侧标注，避免整图大面积留白
    near, far = [], []
    for m in (config.get('milestones') or []):
        (near if datetime.date.fromisoformat(m['date']) <= core else far).append(m)
    return first, core, far


def gantt_html(config, uid):
    """时间轴甘特（HTML 版）：日期刻度 + 行泳道 + 节点/区间 + 里程碑 + 今天线，可交互。"""
    first, last, far_marks = _gantt_span(config)
    total = max(1, (last - first).days)
    def pct(d):
        return (d - first).days / total * 100.0
    today = datetime.date.fromisoformat(config['today']) if config.get('today') else None
    rows = config['rows']
    near_set = {m['date'] + m['label'] for m in (config.get('milestones') or [])}
    far_set = {m['date'] + m['label'] for m in far_marks}
    marks = [m for m in (config.get('milestones') or []) if (m['date'] + m['label']) not in far_set]

    # 日期刻度：按跨度自动选密度，避免拥挤
    tick = 1
    for step in (1, 2, 3, 7, 14):
        if total / step <= 16:
            tick = step
            break
    else:
        tick = max(1, total // 14)

    head = ['<div class="gt-days">']
    cursor, idx = first, 0
    while cursor <= last:
        cls = 'gt-day'
        if cursor.weekday() >= 5:
            cls += ' gt-day--weekend'
        if today and cursor == today:
            cls += ' gt-day--today'
        # 月初与首日一定标月份，其余按刻度标日，便于跨月阅读
        if cursor.day == 1 or idx == 0:
            lbl = f'{cursor.month}/{cursor.day}'
        elif idx % tick == 0:
            lbl = str(cursor.day)
        else:
            lbl = ''
        if lbl:
            pos = pct(cursor)
            edge = ' gt-day--edge-l' if pos < 4 else (' gt-day--edge-r' if pos > 96 else '')
            head.append(f'<span class="{cls}{edge}" style="left:{pos:.4f}%">{lbl}</span>')
        else:
            head.append(f'<span class="{cls}" style="left:{pct(cursor):.4f}%"></span>')
        cursor += datetime.timedelta(days=1)
        idx += 1
    head.append('</div>')

    # 每 7 天一条周分隔线（比日线更安静，符合 data-ink 原则）
    weeklines = []
    for i in range(1, total + 1):
        d = first + datetime.timedelta(days=i)
        if d.weekday() == 0:
            weeklines.append('<span class="gt-weekline" style="left:calc(236px + (100% - 236px) * '
                             f'{pct(d)/100:.4f})"></span>')
    body = ['<div class="gt-body">'] + weeklines
    for i, row in enumerate(rows):
        state = row['state']
        tone_bg, tone_line, _ = GANTT_TONE.get(state, GANTT_TONE['unknown'])
        segs = row.get('segments') or []
        pts = row.get('points') or []
        # 详情面板：把节点与段落合并成时间线，点击行展开
        detail = []
        for seg in sorted(segs, key=lambda x: x['from']):
            detail.append(f'<li><b>{seg["from"][5:]}→{seg["to"][5:]}</b> {escape(seg.get("label") or "推进")}</li>')
        for pt in sorted(pts, key=lambda x: x['date']):
            detail.append(f'<li><b>{pt["date"][5:]}</b> {escape(pt.get("label") or "")}</li>')
        body.append('<details class="gt-item">')
        body.append('<summary class="gt-row">'
                    '<span class="gt-cell">'
                    f'<span class="gt-dot" style="background:{tone_line}"></span>'
                    f'<span class="gt-name" title="{escape(row["label"])}">{escape(row["label"])}</span>'
                    f'<em class="gt-stage" style="color:{tone_line};border-color:{tone_line}">'
                    f'{escape(row.get("stage") or {"done":"已完成","active":"推进中","blocked":"受阻","planned":"未启动","unknown":"待核"}.get(state,""))}</em>'
                    '</span>')
        body.append('<span class="gt-track">')
        if segs:
            for seg in segs:
                a = pct(datetime.date.fromisoformat(seg['from']))
                b = pct(datetime.date.fromisoformat(seg['to']))
                w = max(1.2, b - a)
                _, sline, _ = GANTT_TONE.get(seg.get('state') or state, GANTT_TONE['unknown'])
                label = escape(seg.get('label') or '')
                txt = f'<em>{label}</em>' if label and w > 7 else ''
                kind = seg.get('kind') or 'actual'
                if kind == 'plan':
                    body.append(f'<span class="gt-bar gt-bar--plan" style="left:{a:.4f}%;width:{w:.4f}%;'
                                f'--bar:{sline}">{txt}</span>')
                else:
                    body.append(f'<span class="gt-bar gt-bar--actual" style="left:{a:.4f}%;width:{w:.4f}%;'
                                f'background:{sline}">{txt}</span>')
        if pts:
            for pt in pts:
                x = pct(datetime.date.fromisoformat(pt['date']))
                _, pline, _ = GANTT_TONE.get(pt.get('state') or state, GANTT_TONE['unknown'])
                d = datetime.date.fromisoformat(pt['date'])
                lbl = escape(pt.get('label') or '')
                body.append(f'<span class="gt-pt" style="left:{x:.4f}%;background:{pline}" '
                            f'title="{lbl} {d.isoformat()}"></span>')
                if lbl:
                    side = 'gt-pt-lbl--left' if x > 76 else ''
                    body.append(f'<span class="gt-pt-lbl {side}" style="left:{x:.4f}%;color:{pline}">'
                                f'{lbl}<b>{d.month}-{d.day}</b></span>')
        if not segs and not pts:
            body.append('<span class="gt-empty">本期无记录</span>')
        body.append('</span></summary>')
        if detail:
            body.append('<div class="gt-detail"><ul>' + ''.join(detail)
                        + f'<li class="gt-detail-src">依据 {refs(row["source"])}</li></ul></div>')
        else:
            body.append('<div class="gt-detail"><ul><li>本期没有可展开的节点记录</li></ul></div>')
        body.append('</details>')
    body.append('</div>')

    # 里程碑标签按需分层：估算标签宽度，贪心放进第一个不重叠的层级
    placed = []   # (lane, left_pct, right_pct)
    marks_html = []
    lanes_used = 1
    for m in sorted(marks, key=lambda x: x['date']):
        d = datetime.date.fromisoformat(m['date'])
        pos = pct(d)
        half = max(2.6, len(m['label']) * 0.62)   # 标签半宽（百分比，经验值）
        lane = 0
        while True:
            clash = any(l == lane and not (pos + half < lp - 0.6 or pos - half > rp + 0.6)
                        for l, lp, rp in placed)
            if not clash:
                break
            lane += 1
        placed.append((lane, pos - half, pos + half))
        lanes_used = max(lanes_used, lane + 1)
        marks_html.append(f'<span class="gt-mark" style="left:{pos:.4f}%;--lane:{lane}" '
                          f'title="{escape(m["label"])} {d.isoformat()}">'
                          f'<i></i><b>{escape(m["label"])}</b></span>')
    mark_height = 12 + lanes_used * 15
    today_html = ''
    if today:
        today_html = (f'<span class="gt-today" style="left:{pct(today):.4f}%">'
                      f'<i></i><b>今天 {today.month}-{today.day}</b></span>')

    far_html = ''
    if far_marks:
        chips = ''.join(f'<span class="gt-far"><b>{escape(m["label"])}</b><em>'
                        f'{datetime.date.fromisoformat(m["date"]).month}-'
                        f'{datetime.date.fromisoformat(m["date"]).day}</em></span>'
                        for m in sorted(far_marks, key=lambda x: x['date']))
        far_html = '<div class="gt-far-bar"><span class="gt-far-lbl">此窗之后 →</span>' + chips + '</div>'
    # KPI 头：领导第一眼要看到结论，而不是自己去数绿点
    done_n = sum(1 for r in rows if r['state'] == 'done')
    block_n = sum(1 for r in rows if r['state'] == 'blocked')
    quiet_n = sum(1 for r in rows if not (r.get('segments') or r.get('points')))
    live_n = sum(1 for r in rows if r['state'] == 'active')
    kpi = ('<div class="gt-kpi">'
           f'<div class="gt-kpi-i gt-kpi--done"><b>{done_n}<span>/{len(rows)}</span></b><em>已验收</em></div>'
           f'<div class="gt-kpi-i gt-kpi--live"><b>{live_n}</b><em>在推进</em></div>'
           + (f'<div class="gt-kpi-i gt-kpi--risk"><b>{block_n}</b><em>停滞</em></div>' if block_n else '')
           + (f'<div class="gt-kpi-i gt-kpi--quiet"><b>{quiet_n}</b><em>暂无记录</em></div>' if quiet_n else '')
           + '</div>')
    today_r = pct(today) / 100.0
    today_var = (f'--today-x:{pct(today):.4f}%;--today-ratio:{today_r:.4f};'
                 f'--today-track-x:calc(236px + (100% - 236px) * {today_r:.4f})') if today else '--today-x:100%;--today-ratio:1'
    today_var += f';--days:{total}'
    return (f'<div class="gt" style="{today_var}">' + kpi +
            f'<div class="gt-marks" style="--mark-h:{mark_height}px">' + ''.join(marks_html) + today_html + '</div>'
            '<div class="gt-scroll">'
            '<div class="gt-head"><div class="gt-corner">场地</div>' + ''.join(head) + '</div>'
            + ''.join(body) +
            '</div></div>' + far_html +
            '<p class="gt-hint">点击任意一行展开该场地的节点明细'
            '<span class="gt-hint-sw">· 时间轴可左右滑动</span></p>')


def figure(config, uid):
    kind = config['type']; out = [f'<figure class="rv-visual rv-{kind}" data-recap-visual="{kind}"><figcaption><strong>{escape(config["title"])}</strong><span>{escape(config["caption"])}</span></figcaption>']
    if kind == 'matrix':
        stages = config['stages']
        # 当前段填色与 RAG 灯同源：绿=正常（深绿已完成／中绿推进中）、琥珀=待核、红=受阻、灰=未启动
        RAG = {'blocked': ('受阻', '#bc4941'), 'unknown': ('待核', '#c58a2e'),
               'done': ('已完成', '#2f6350'), 'active': ('推进中', '#4a8a6a'), 'planned': ('未启动', '#a8b8ad')}
        done_count = sum(1 for r in config['items'] if r['state'] == 'done')
        total = len(config['items'])
        out.append(f'<div class="rv-lanes"><p class="rv-lanes-cap">{done_count}/{total} 个对象已完成</p>')
        for row in config['items']:
            rag_name, rag_color = RAG.get(row['state'], ('—', '#a8b8ad'))
            here = stages.index(row['stage'])
            segs = []
            for i, stage in enumerate(stages):
                if i < here:
                    segs.append(f'<span class="rv-seg rv-seg-past"><b>{escape(stage)}</b></span>')
                elif i == here:
                    segs.append(f'<span class="rv-seg rv-seg-now" style="--state:{rag_color}">'
                                f'<b>{escape(stage)}</b></span>')
                else:
                    segs.append(f'<span class="rv-seg rv-seg-future"><b>{escape(stage)}</b></span>')
            desc = escape(row.get('detail', ''))
            next_step = ('<em>下一步：' + escape(row['next']) + '</em>') if row.get('next') else ''
            out.append('<div class="rv-lane">'
                       '<span class="rv-lane-name">'
                       f'<span class="rv-rag" style="--rag:{rag_color}"></span>{escape(row["label"])}</span>'
                       '<span class="rv-lane-track">' + ''.join(segs) + '</span>'
                       f'<span class="rv-lane-state" style="--rag:{rag_color}">{rag_name}</span>'
                       f'<span class="rv-lane-desc">{desc}{next_step} {refs(row["source"])}</span>'
                       '</div>')
        out.append('</div>')
    elif kind == 'status':
        out.append('<div class="rv-status-grid">')
        for i, row in enumerate(config['items'], 1):
            label, color = STATES[row['state']]
            next_step='<div class="rv-next"><b>下一步</b>'+escape(row['next'])+'</div>' if row.get('next') else ''
            out.append(f'<article class="rv-status-card" style="--state:{color}"><header><span class="rv-index">{i:02}</span><span class="rv-state">{label}</span></header><h3>{escape(row["label"])}</h3><p>{escape(row["detail"])}</p>{next_step}<footer>{refs(row["source"])}</footer></article>')
        out.append('</div>')
    else:
        # JSON is escaped inert text, not executable script or an arbitrary option object.
        out.append('<div class="rv-spec" hidden>' + escape(json.dumps(config, ensure_ascii=False)) + '</div>')
        out.append('<div class="rv-interactive" role="img" aria-label="' + escape(config['title']) + '" hidden></div>')
        if kind == 'matrix':
            pass
        elif kind == 'gantt':
            out.append(gantt_html(config, uid))
        elif kind == 'graph':
            out.append('<figure class="am-flow rv-static-graph">' + graph_svg(config, uid) + '</figure>')
            out.append('<details class="rv-data"><summary>节点说明与依据</summary><ul>')
            for node in config['nodes']:
                out.append('<li><b>' + escape(node['label']) + '</b> · ' + escape(node.get('detail','')) + ' ' + refs(node.get('source','')) + '</li>')
            for link in config['links']:
                labels = {n['id']: n['label'] for n in config['nodes']}
                out.append('<li>' + escape(labels[link['from']] + ' → ' + labels[link['to']] + ' · ' + link['label']) + ' ' + refs(link['source']) + '</li>')
            out.append('</ul></details>')
        else:
            out.append('<figure class="rv-static-graph">'+chart_svg(config)+'</figure>')
            out.append('<div class="rv-values-table"><table><caption>' + escape(config['unit']) + ' · ' + refs(config['source']) + '</caption><thead><tr><th>类别</th>')
            out.extend('<th>' + escape(s['name']) + '</th>' for s in config['series']); out.append('</tr></thead><tbody>')
            for i, cat in enumerate(config['categories']):
                out.append('<tr><th>' + escape(cat) + '</th>' + ''.join('<td>' + str(s['data'][i]) + '</td>' for s in config['series']) + '</tr>')
            out.append('</tbody></table></div>')
    return ''.join(out) + '</figure>'


class _Replace(HTMLParser):
    def __init__(self, html, replacements):
        super().__init__(convert_charrefs=False); self.html=html; self.replacements=replacements
        self.stack=[]; self.changes=[]; self.found=[]; self.lines=[0]+[m.end() for m in re.finditer('\n',html)]
    def handle_starttag(self, tag, attrs):
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'): self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.stack: self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
    def handle_data(self, data):
        if any(x in self.stack for x in ('script','style','textarea','template')): return
        token=data.strip()
        if token not in self.replacements: return
        line,col=self.getpos(); start=self.lines[line-1]+col; end=start+len(data)
        # am emits a plain placeholder paragraph; replace its complete element.
        if self.html[max(0,start-3):start]=='<p>' and self.html[end:end+4]=='</p>': start-=3; end+=4
        self.changes.append((start,end,self.replacements[token])); self.found.append(token)


def restore(html, blocks):
    replacements={token:figure(config, token.lower()) for token,config in blocks}
    page=_Replace(html,replacements);page.feed(html)
    if sorted(page.found)!=sorted(replacements): raise ValueError('图形占位未被完整渲染，未发布不完整报告')
    for start,end,value in sorted(page.changes,reverse=True):html=html[:start]+value+html[end:]
    return html


def widen_wide_panels(html):
    """矩阵等宽表必须横跨全部网格列，否则在分栏布局中被压成一团看不清。"""
    if 'rv-matrix' not in html:return html
    out=[];pos=0
    for match in re.finditer(r'<section\b[^>]*class="[^"]*\bam-panel\b[^"]*"[^>]*>', html):
        chunk=html[match.start():match.start()+40000]
        end=chunk.find('</section>')
        if end<0 or 'rv-matrix' not in chunk[:end]:continue
        out.append(html[pos:match.start()])
        tag=match.group(0)
        # 保留原 class，追加内联栅格跨列 + 全宽标记
        if 'grid-column' not in tag:
            tag=tag[:-1]+' style="grid-column:1/-1;max-width:none" data-wide-panel="1">'
        out.append(tag);pos=match.end()
    if not out:return html
    out.append(html[pos:])
    return ''.join(out)


def enhance(html):
    if 'data-recap-visual=' not in html:return html
    css=(ASSETS/'visual-blocks.css').read_text(encoding='utf-8')
    # 所选汇报技能可能自带同 id 的旧版样式；核心必须用本安装的版本覆盖，
    # 否则新图形（矩阵条带等）会因为旧样式而完全失去排版。
    style='<style id="rv-visual-style">'+css+'</style>'
    if 'id="rv-visual-style"' in html:
        html=re.sub(r'<style id="rv-visual-style">.*?</style>', lambda m: style, html, count=1, flags=re.S)
    else:
        html=html.replace('</head>',style+'</head>',1)
    html=widen_wide_panels(html)
    if not re.search(r'data-recap-visual="(?:graph|bar|line)"',html):return html
    script=(ASSETS/'charts.bundle.js').read_text(encoding='utf-8')+'\n'+(ASSETS/'visual-blocks.js').read_text(encoding='utf-8')
    meta=re.search(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>',html,re.I)
    if meta:
        if 'script-src ' not in meta[0] or "script-src 'none'" in meta[0]:return html
        digest=base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
        html=html[:meta.start()]+meta[0].replace('script-src ',"script-src 'sha256-"+digest+"' ",1)+html[meta.end():]
    return ('<script id="rv-visual-runtime">'+script+'</script></body>').join(html.rsplit('</body>',1))
