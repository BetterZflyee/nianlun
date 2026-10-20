"""Evidence-preserving report renderer for live AITable reads."""
from html import escape as e
from urllib.parse import urlparse


def safe_url(url):
    return url if isinstance(url, str) and urlparse(url).scheme == 'https' else ''


def render(state, projects, since, until, title, summary=''):
    chosen = {p['id'] for p in projects}
    records = [r for r in state['records'] if chosen.intersection(r.get('project_ids', [])) and since <= r.get('date', '') <= until]
    undated = [r for r in state['records'] if chosen.intersection(r.get('project_ids', [])) and not r.get('date')]
    milestones = [r for r in state['milestones'] if chosen.intersection(r.get('project_ids', []))]
    sections = []
    md = [f'# {title}', '', f'记录范围：{since} — {until}', f'数据读取时间：{state["fetched_at"]}', '',
          '数据源：钉钉 AI 表格。里程碑为读取时的完整计划；预期效益不代表已实现收益。', '', summary, '']
    for p in projects:
        rows = sorted([r for r in records if p['id'] in r.get('project_ids', [])], key=lambda r: r.get('date',''), reverse=True)
        nodes = sorted([m for m in milestones if p['id'] in m.get('project_ids', [])], key=lambda m: m.get('date') or '9999')
        events = []
        md += [f'## {p["title"]}', '', p.get('description',''), '', f'档案状态：{p["status"]}', '', '### 本期记录', '']
        for r in rows:
            files = r.get('attachments', [])
            attachment_note = '<p class="muted">附件保留在原表，请从下方来源入口查看。</p>' if files else ''
            events.append(f'<article><small>{e(r.get("date", ""))} · {e(r.get("kind", "记录"))} · {e(r.get("status", ""))}</small><h3>{e(r["title"])}</h3><p>{e(r.get("description", ""))}</p>{attachment_note}<a href="{e(safe_url(r["table_url"]))}" target="_blank" rel="noopener">查看 AI 表格依据 ↗</a><span class="recordid">记录 ID：{e(r["id"])}</span></article>')
            md += [f'- {r.get("date", "")} · {r.get("kind", "记录")} · {r["title"]}（{r.get("status", "")}）',
                   '  ' + r.get('description',''), f'  来源：[AI 表格]({r["table_url"]}) / 记录 ID：{r["id"]}']
        if not rows:
            md.append('本期没有符合日期范围的记录，不形成进展结论。')
        trs = []
        md += ['', '### 里程碑计划', '']
        for m in nodes:
            trs.append(f'<tr><td>{e(m.get("date") or "待定")}</td><td><b>{e(m["title"])}</b><p>{e(m.get("description", ""))}</p></td><td>{e(m["status"])}</td><td>{e(m.get("benefit") or "未填写")}</td></tr>')
            md += [f'- {m.get("date") or "待定"} · {m["title"]} · {m["status"]}',
                   f'  交付：{m.get("description", "未填写")}', f'  预期效益：{m.get("benefit") or "未填写"}', f'  依据：{m["table_url"]} / 记录 ID：{m["id"]}']
        risk = f'<p class="note">档案风险：{e(p["risk"])}</p>' if p.get('risk') else ''
        sections.append(f'<section><div class="eyebrow">{e(p.get("priority", ""))} / {e(p["status"])}</div><h2>{e(p["title"])}</h2><p class="intro">{e(p.get("description", ""))}</p>{risk}<h4>本期进展</h4>{"".join(events) or "<p class=muted>本期没有符合日期范围的记录，不形成进展结论。</p>"}<h4>里程碑计划 <small>读取时的完整计划</small></h4><div class="table-wrap"><table><thead><tr><th>截止日期</th><th>节点与交付</th><th>状态</th><th>预期效益</th></tr></thead><tbody>{"".join(trs)}</tbody></table></div></section>')
    warning = f'另有 {len(undated)} 条相关记录缺少日期，未混入本期统计。' if undated else ''
    md += ['', '## 数据边界', '', f'本报告含 {len(records)} 条日期范围内记录、{len(milestones)} 个完整计划节点。{warning}',
           '表格中的历史摘要不等同于原始会议逐字稿；来源不足的记录需回到原表补充。']
    css = '''*{box-sizing:border-box}body{margin:0;background:#f5f6f0;color:#294132;font:14px/1.8 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}main{max-width:1080px;margin:auto;padding:64px 38px}header{padding:15px 0 35px;border-bottom:1px solid #dae1d1}.eyebrow{font-size:10px;letter-spacing:3px;color:#80946a}h1{font-family:"Songti SC",serif;font-weight:500;font-size:44px;letter-spacing:1px;line-height:1.4;margin:22px 0}h2{font-size:28px;font-weight:500;letter-spacing:-.5px}h3{font-size:16px;font-weight:500;margin:7px 0}h4{font-size:16px;margin:30px 0 10px}h4 small{margin-left:12px;font-size:10px;font-weight:400}.intro,.muted,small{color:#8b9a7d}.stats{display:flex;gap:48px;margin:25px 0}.stats b{font:37px Georgia,serif;display:block;color:#607f44}.stats span{font-size:11px;color:#94a582}section{padding:33px;background:#fff;border:1px solid #e2e7d9;border-radius:15px;margin-top:25px}p{white-space:pre-wrap}article{padding:18px 0;border-bottom:1px solid #edf0e6}a{font-size:11px;color:#77955c;text-decoration:none}a:hover{text-decoration:underline}.recordid{font-size:10px;color:#a5af98;margin-left:14px}.note{background:#f6f0e0;color:#a68e60;border-radius:8px;padding:13px 18px;font-size:12px}.summary{font-size:16px;line-height:2}table{border-collapse:collapse;width:100%;min-width:650px;text-align:left;font-size:12px}td,th{border-bottom:1px solid #e7ecdf;padding:13px;vertical-align:top}th{color:#8a9d75;font-weight:500}td p{font-size:11px;color:#93a280;margin:7px 0}footer{font-size:11px;color:#9cac88;text-align:center;padding:35px 0}.table-wrap{overflow:auto}@media(max-width:600px){main{padding:30px 18px}h1{font-size:32px}section{padding:22px}.stats{gap:30px}.recordid{display:block;margin:5px 0}h2{font-size:24px}}@media print{body{background:white}main{padding:0}section{border:0;padding:15px 0}header{break-after:avoid}article{break-inside:avoid}a{color:inherit}}'''
    html = f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><style>{css}</style></head><body><main><header><div class="eyebrow">NIANLUN / 年轮 · 阶段性汇报</div><h1>{e(title)}</h1><p class="muted">{since} — {until}</p><div class="stats"><div><b>{len(projects)}</b><span>个项目</span></div><div><b>{len(records)}</b><span>条本期记录</span></div><div><b>{len(milestones)}</b><span>个计划节点</span></div></div><p class="summary">{e(summary or "从项目的连续记忆中，整理这一个阶段的进展与下一步。")}</p><small>来自 AI 表格 · 读取于 {e(state["fetched_at"])}<br>预期效益不等于已实现收益；待核节点保留原状态。{e(warning)}</small></header>{"".join(sections)}<footer>年轮 · 你只管往前，让它自己长。<br>数据保存在 AI 表格，本文件是读取时生成的汇报快照。</footer></main></body></html>'
    return html, '\n'.join(md), len(records)
