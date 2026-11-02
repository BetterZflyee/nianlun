"""把用户口头告知的场地进度事实写入 AI 表格。

背景：表格状态靠人工维护，报告只忠实读表，于是「实际已验收但表里还停在验收」
会反复发生。本模块把这条链路固化为一次调用：匹配场地 → 校验/补充状态选项 →
改状态并清理过期卡点 → 补一条带来源的记录 → 回读验证。

默认只演算不落库；显式传 yes 才写入，符合年轮「写入必须明确授权」的约定。
"""

import datetime
import json

from nianlun import Error


# 场地状态推进到这些终态时，原来的「当前卡点」已失效，需要清空。
TERMINAL = {'已验收', '推广'}

# 场地状态 → 记录表阶段取值
STAGE_OF = {'筹备': '试点', '安装': '开发', '试运行': '联调', '验收': '验收',
            '已验收': '验收', '推广': '上线', '暂停': '运维'}


def _field_map(client, base, table):
    return {f.get('fieldName'): f for f in client.fields(base, table)}


def _need(fields, name, table):
    if name not in fields:
        raise Error(f'{table} 缺少「{name}」字段')
    return fields[name]


def _match(state, name, project):
    """按名称或编号定位唯一场地；同名跨项目时必须显式给 project。"""
    projects = {p['id']: p['title'] for p in state['projects']}
    rows = [s for s in state['sites']
            if name == str(s.get('code', '')) or name in str(s.get('title', ''))]
    if project:
        rows = [s for s in rows
                if any(project in projects.get(pid, '') for pid in s.get('project_ids', []))]
    if not rows:
        raise Error(f'没有找到名称或编号匹配「{name}」的场地' + (f'（项目 {project}）' if project else ''))
    if len(rows) > 1:
        detail = '；'.join(
            f"{r['title']}({r.get('code', '')}) 项目={'、'.join(projects.get(pid, pid) for pid in r.get('project_ids', []))}"
            for r in rows)
        raise Error(f'「{name}」匹配到 {len(rows)} 条场地记录，请用 --project 指定是哪一个：{detail}')
    return rows[0]


def _ensure_option(client, base, table, field, status):
    """状态选项不存在时补上；已有选项按原 id 回传，避免丢数据。"""
    options = (field.get('config') or {}).get('options') or []
    if any(o.get('name') == status for o in options):
        return None
    payload = []
    for o in options:
        row = {'name': o['name']}
        if o.get('id'):
            row['id'] = o['id']
        payload.append(row)
    payload.append({'name': status})
    client.call(['field', 'update', '--base-id', base, '--table-id', table,
                 '--field-id', field['fieldId'],
                 '--config', json.dumps({'options': payload}, ensure_ascii=False), '--yes'])
    return status


SITE_STATUS_DEPRECATED = (
    '场地状态字段已停用：同一场地在不同项目里进度不同，单值无法表达。'
    '请改为更新里程碑状态（项目 × 场地 × 阶段），例如把「571WA 设备安装」标为已达成。'
)


def site_fact(config, client, state, name, status, note='', source='', evidence='',
              project=None, yes=False):
    base = config['base_id']
    sites = config['tables']['sites']['id']
    records = config['tables']['records']['id']

    s_fields = _field_map(client, base, sites)
    f_name = _need(s_fields, '场地名称', '场地表').get('fieldId')
    f_status = _need(s_fields, '场地状态', '场地表')
    f_block = s_fields.get('当前卡点', {}).get('fieldId')
    f_code = s_fields.get('场地编码', {}).get('fieldId')

    site = _match(state, name, project)
    before = site.get('status')
    if before == status and not note:
        raise Error(f'{site["title"]} 状态已经是「{status}」，无需更新')

    cells = {f_status['fieldId']: status}
    if status in TERMINAL and f_block and site.get('notes'):
        cells[f_block] = ''

    added_option = None
    actions = [{
        'kind': 'site_status',
        'site': site['title'],
        'code': site.get('code', ''),
        'record_id': site['id'],
        'before': before,
        'after': status,
        'clear_blocker': bool(f_block and site.get('notes')),
    }]

    # 记录内容：把口头来源与原文一并留痕，便于日后追溯为什么改了状态。
    body = [f'用户（朱飞）告知{site["title"]}{site.get("code", "")}车辆靠离卡已{status}。']
    if note:
        body.append(note)
    if before and before != status:
        body.append(f'此前表格状态停留在「{before}」，与实际情况不符，本次更新为「{status}」。')
    if source:
        body.append(f'来源：{source}')
    if evidence:
        body.append(f'原文摘录：{evidence}')
    tag = datetime.datetime.now().strftime('%Y%m%d%H%M')
    body.append(f'[年轮来源:manual-{tag}-{site.get("code", "")}]')

    r_fields = _field_map(client, base, records)
    rec_cells = {}
    mapping = {
        '标题': f'{site["title"]}{site.get("code", "")}车辆靠离卡更新为{status}',
        '阶段': STAGE_OF.get(status, '沟通要点'),
        '记录类型': '验收记录' if status in TERMINAL else '沟通要点',
        '详情': '\n\n'.join(body),
        '日期': datetime.date.today().isoformat(),
        '反馈人': '朱飞',
        '状态': '已解决',
        '解决方案': f'场地状态由「{before}」更新为「{status}」' if before else f'场地状态更新为「{status}」',
    }
    for label, value in mapping.items():
        if label in r_fields:
            rec_cells[r_fields[label]['fieldId']] = value
    for label, linked in (('项目', site.get('project_ids') or []), ('场地', [site['id']])):
        if label in r_fields and linked:
            rec_cells[r_fields[label]['fieldId']] = {'linkedRecordIds': linked}
    actions.append({'kind': 'record_create', 'title': mapping['标题']})

    if not yes:
        return {'planned': True, 'remote_mutations': 0, 'actions': actions,
                'add_option': status, 'site_status_before': before}

    # ---- 以下为真实写入，逐项回读 ----
    added_option = _ensure_option(client, base, sites, f_status, status)
    client.call(['record', 'update', '--base-id', base, '--table-id', sites,
                 '--records', json.dumps([{'recordId': site['id'], 'cells': cells}], ensure_ascii=False),
                 '--yes'])
    check = client.call(['record', 'get', '--base-id', base, '--table-id', sites,
                         '--record-id', site['id']]).get('records') or []
    if not check:
        raise Error('写后回读为空，停止；请人工核验场地状态')
    actual = check[0].get('cells', {}).get(f_status['fieldId'])
    actual = actual.get('name') if isinstance(actual, dict) else actual
    if actual != status:
        raise Error(f'写后验证失败：期望「{status}」实际「{actual}」；停止后续写入')

    created = client.call(['record', 'create', '--base-id', base, '--table-id', records,
                           '--records', json.dumps([{'cells': rec_cells}], ensure_ascii=False), '--yes'])
    ids = created.get('newRecordIds') or []
    return {'planned': False, 'remote_mutations': 2, 'actions': actions,
            'add_option': added_option, 'site_status_before': before,
            'site_status_after': actual, 'record_id': ids[0] if ids else None}
