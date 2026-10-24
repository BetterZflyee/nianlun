"""Small declarative report visuals. Model output is data, never HTML or ECharts code."""
import base64
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
              'bar': {'categories', 'series', 'unit', 'source'},
              'line': {'categories', 'series', 'unit', 'source'}}
    if kind not in fields: raise ValueError('visual 类型只能为 status、graph、bar、line')
    if set(config) - common - fields[kind]: raise ValueError('visual 包含不支持的字段')
    text(config.get('title'), 60, 'title'); text(config.get('caption'), 180, 'caption')
    def source(value):
        text(value, 150)
        refs = CITE.findall(value)
        if not refs: raise ValueError('图形须使用 [R1] 等给定依据编号')
        if evidence is not None and set(refs) - {x['key'] for x in evidence}:
            raise ValueError('图形包含不存在的依据编号')
    def item(row, allowed):
        if not isinstance(row, dict) or set(row) - allowed: raise ValueError('图形条目字段不合法')
        text(row.get('label'), 26, 'label'); text(row.get('detail'), 100, 'detail'); source(row.get('source'))
        if row.get('state') not in STATES: raise ValueError('状态只能为 done、active、blocked、planned、unknown')
    if kind == 'status':
        rows = config.get('items')
        if not isinstance(rows, list) or not 1 <= len(rows) <= 4: raise ValueError('状态图须为 1 至 4 项')
        for row in rows:
            item(row, {'label', 'detail', 'state', 'next', 'source'})
            if row.get('next') is not None and row.get('next')!='':text(row['next'], 100, 'next')
    elif kind == 'graph':
        rows, links = config.get('nodes'), config.get('links')
        if not isinstance(rows, list) or not 2 <= len(rows) <= 9: raise ValueError('关系图须为 2 至 9 个节点')
        if not isinstance(links, list) or not 1 <= len(links) <= 9: raise ValueError('关系图须为 1 至 9 条有依据的连线')
        ids = set(); layers = {}
        for row in rows:
            item(row, {'id', 'label', 'detail', 'state', 'layer', 'source'})
            if not isinstance(row.get('id'), str) or not re.fullmatch(r'[a-zA-Z][\w-]{0,20}', row['id']): raise ValueError('节点 id 不合法')
            if row['id'] in ids: raise ValueError('节点 id 重复')
            ids.add(row['id'])
            layer = row.get('layer')
            if type(layer) is not int or layer not in (0, 1, 2): raise ValueError('layer 须为 0、1 或 2')
            layers[layer] = layers.get(layer, 0) + 1
        if max(layers.values()) > 3: raise ValueError('每列最多 3 个节点')
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
        if len(blocks) > 3: raise ValueError('精简汇报最多 3 张图')
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
    out.append(f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{escape(config["title"])}"><defs><marker id="{marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6f947e"/></marker></defs>')
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


def figure(config, uid):
    kind = config['type']; out = [f'<figure class="rv-visual rv-{kind}" data-recap-visual="{kind}"><figcaption><strong>{escape(config["title"])}</strong><span>{escape(config["caption"])}</span></figcaption>']
    if kind == 'status':
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
        if kind == 'graph':
            out.append('<figure class="am-flow rv-static-graph">' + graph_svg(config, uid) + '</figure>')
            out.append('<details class="rv-data"><summary>节点说明与依据</summary><ul>')
            for node in config['nodes']:
                out.append('<li><b>' + escape(node['label']) + '</b> · ' + escape(node['detail']) + ' ' + refs(node['source']) + '</li>')
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


def enhance(html):
    if 'data-recap-visual=' not in html or 'id="rv-visual-style"' in html:return html
    css=(ASSETS/'visual-blocks.css').read_text(encoding='utf-8')
    html=html.replace('</head>','<style id="rv-visual-style">'+css+'</style></head>',1)
    if not re.search(r'data-recap-visual="(?:graph|bar|line)"',html):return html
    script=(ASSETS/'charts.bundle.js').read_text(encoding='utf-8')+'\n'+(ASSETS/'visual-blocks.js').read_text(encoding='utf-8')
    meta=re.search(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>',html,re.I)
    if meta:
        if 'script-src ' not in meta[0] or "script-src 'none'" in meta[0]:return html
        digest=base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
        html=html[:meta.start()]+meta[0].replace('script-src ',"script-src 'sha256-"+digest+"' ",1)+html[meta.end():]
    return ('<script id="rv-visual-runtime">'+script+'</script></body>').join(html.rsplit('</body>',1))
