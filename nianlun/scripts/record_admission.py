"""准入闭环：needs_review 记录的「确认 / 驳回」，驳回案例教模型不再犯。

## 规则（飞哥 2026-11-14 定稿，11-15 落地）

> 挂不到里程碑上的东西，不算项目记忆。

落地方式不是拒写——用户已经在用「归档」手工筛（已归档 1102 条挂里程碑率
0.7% vs 开放 310 条挂 83%，界线是用户自己划的）。生长照写、打上待复核标记，
人只做两个动作：

| 动作 | 效果 |
|---|---|
| **确认** | 清除标记（用户认可它是项目记忆，或随后自己补挂里程碑） |
| **驳回** | 归档该记录 + 存入负例库；下一轮 prompt 带上这些负例 |

## 为什么靠负例而不是改提示词规则

准入规则本身（「挂不到里程碑不算」）已经写进契约，但**界线具体长什么样**
只有用户知道——比如「联系卢师傅取设备」是纯执行动作，模型可能反复觉得它
值得记。用户驳回一次，这句话连同项目名进负例库，下一轮模型看到的就是
「这类内容他不要」。**持续学习 = 具体否决的累积，不是抽象规则的堆叠。**

## 存储

- 负例：`<state_dir>/admission-negatives.json`，上限 40 条（FIFO 淘汰）。
  不存正文存标题+理由，控制 prompt 体积（这是给模型的，不是给人看的）。
- 标记本体在记录 description 里（`growth.REVIEW_MARKER`），表格不加列，
  用户表结构不动。
"""
import json
import time
from pathlib import Path

import nianlun as n
import growth as g

MAX_NEGATIVES = 40
PROMPT_BUDGET_CHARS = 1500  # 负例区最多占这么多字符——超了就丢最老的


def _path(config):
    return Path(config['growth']['state_dir']).expanduser() / 'admission-negatives.json'


def _load(config):
    path = _path(config)
    try:
        rows = n.load(path) if path.exists() else []
    except (OSError, ValueError):
        rows = []
    return rows if isinstance(rows, list) else []


def load(config):
    return _load(config)


def record_rejection(config, record_id, title, project, reason=''):
    """把一条被驳回的记录写进负例库（幂等：同 id 更新理由不重复追加）。"""
    rows = _load(config)
    entry = {'id': str(record_id), 'title': str(title or '')[:60],
             'project': str(project or '')[:30], 'reason': str(reason or '')[:40],
             'at': n.stamp(config)}
    rows = [x for x in rows if x.get('id') != entry['id']]
    rows.append(entry)
    if len(rows) > MAX_NEGATIVES:
        rows = rows[-MAX_NEGATIVES:]  # FIFO：留最近的否决，老界线会随实践漂移
    n.save(_path(config), rows)
    return entry


def negative_examples(config):
    """渲染成 prompt 片段；无负例返回空串。按字符预算裁最老的。"""
    rows = _load(config)
    if not rows:
        return ''
    lines = []
    used = 0
    for x in reversed(rows):  # 最近的否决最相关，优先保留
        part = f'- 「{x["title"]}」' + (f'（{x["project"]}）' if x.get('project') else '')
        if x.get('reason'):
            part += f'——{x["reason"]}'
        if used + len(part) > PROMPT_BUDGET_CHARS:
            break
        lines.append(part)
        used += len(part)
    lines.reverse()
    return ('被驳回的都是「做了某个动作/联系了谁/发个东西」这类执行过程，'
            '不改变项目状态——这类内容放进 deferred_source_ids 或总结里带过，'
            '不要再 create_record。\n' + '\n'.join(lines))


def _detail_field(table):
    # 详情列的真实名字：不同表版本可能叫 详情/解决方案/备注。
    # 与 nianlun.plan() 的 detail_key 取法必须一致——写入落在哪列，
    # 清标记就得去哪列；写死 'description' 在只有 solution 的表上直接 KeyError
    # （2026-11-15 实测就是这个报错）。
    fields = table.get('fields') or {}
    key = next((k for k in ('description', 'solution', 'notes') if k in fields), None)
    return fields[key]['fieldId'] if key else None


def _find_record(config, gw, record_id):
    table = config['tables']['records']
    field = _detail_field(table)
    if not field:
        raise n.Error('反馈记录表没有可写入详情的列，无法识别待复核标记')
    rows = gw.table().records(config['base_id'], table['id'])
    for r in rows:
        if r.get('recordId') == str(record_id):
            return r, field
    return None, None


def confirm(config, record_id):
    """确认：清除描述末尾的待复核标记。幂等——没有标记也返回成功。"""
    import growth as _g
    # 与生长提交、手工编辑共用同一把锁：同一条记录不能同时被两处写。
    with _g.locked(config):
        return _confirm(config, record_id)


def _confirm(config, record_id):
    import growth as _g
    gw = _g.Gateway(config)
    row, field = _find_record(config, gw, record_id)
    if row is None:
        raise n.Error('记录不存在，请先刷新页面')
    detail = str((row.get('cells') or {}).get(field) or '')
    if _g.REVIEW_MARKER not in detail:
        return {'status': 'noop', 'reason': '这条记录本来就没有待复核标记'}
    cleaned = detail.replace(_g.REVIEW_MARKER, '')
    _g.table_write(config, gw, 'records', {field: cleaned}, record_id=str(record_id))
    return {'status': 'confirmed', 'record_id': str(record_id)}


def reject(config, record_id, reason=''):
    """驳回：归档该记录 + 进负例库。幂等——已归档仍会补记负例。"""
    import growth as _g
    with _g.locked(config):
        return _reject(config, record_id, reason)


def _reject(config, record_id, reason=''):
    import growth as _g
    gw = _g.Gateway(config)
    row, field = _find_record(config, gw, record_id)
    if row is None:
        raise n.Error('记录不存在，请先刷新页面')
    table = config['tables']['records']
    title_fid = table['fields']['title']['fieldId']
    proj_fid = table['fields']['project_ids']['fieldId']
    status_fid = table['fields']['status']['fieldId']
    title = str((row.get('cells') or {}).get(title_fid) or '')
    # 项目名从表里解析（模型 prompt 只需要标题+项目，不需要 ID）
    project = ''
    linked = (row.get('cells') or {}).get(proj_fid) or {}
    ids = linked.get('linkedRecordIds') or []
    if ids:
        prows = gw.table().records(config['base_id'], config['tables']['projects']['id'])
        names = {p.get('recordId'): str((p.get('cells') or {}).get(
            config['tables']['projects']['fields']['title']['fieldId']) or '') for p in prows}
        project = names.get(ids[0], '')
    detail = str((row.get('cells') or {}).get(field) or '')
    cleaned = detail.replace(g.REVIEW_MARKER, '')
    cells = {status_fid: '已归档'}
    if cleaned != detail:
        cells[field] = cleaned
    _g.table_write(config, gw, 'records', cells, record_id=str(record_id))
    entry = record_rejection(config, record_id, title, project, reason)
    return {'status': 'rejected', 'record_id': str(record_id),
            'negative_added': entry['title']}
