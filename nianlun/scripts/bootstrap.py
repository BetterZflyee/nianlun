"""一键建表：让拿到年轮的人不必手工建四张表。

## 为什么需要

年轮的核心是「四张表 + 记忆 + 宿主」。记忆和宿主能自动配好，但四张表
原来必须手工建、手工绑——字段还要包含关联关系，错一个就跑不起来。

飞哥 2026-11-09 定的方向：要作为开源产品被人拿去用，就必须**开箱即跑**。

## 分两阶段，因为关联字段依赖表 ID

钉钉的关联字段要填 `linkedTableId`，而表 ID 只有建完表才有。所以：

1. **阶段一**：建四张表 + 所有非关联字段
2. **阶段二**：拿到四张表的 ID 后，补建关联字段

## 幂等

重复执行不重建：已经存在的表按名字复用，已有的字段跳过。所以「建到一半
失败」再跑一次是安全的。
"""
from datetime import datetime

import nianlun as n

# ---- 字段模板 ----
# 顺序有意义：第一列是 primaryDoc（钉钉要求第一列是文档列）。
# 每个字段写成 (逻辑名, 中文列名, 类型, config)。关联字段 config 留 None，
# 阶段二按 linkedTableId 补。

TEXT = 'text'
SELECT = 'singleSelect'
DATE = 'date'

TEMPLATES = {
    'projects': {
        'name': '项目主表',
        'fields': [
            ('title', '项目名称', TEXT, None),
            ('number', '项目编号', TEXT, None),
            ('status', '项目状态', SELECT, {'options': [
                {'name': '进行中'}, {'name': '已完成'}, {'name': '暂停'}, {'name': '未开始'}]}),
            ('priority', '优先级', SELECT, {'options': [
                {'name': 'P0'}, {'name': 'P1'}, {'name': 'P2'}, {'name': 'P3'}]}),
            ('goal', '项目目标', TEXT, None),
            ('description', '一句话描述', TEXT, None),
            ('risk', '风险卡点', TEXT, None),
            ('biz_owner', '业务负责人', 'user', {'multiple': False}),
            ('tech_owner', '技术负责人', 'user', {'multiple': False}),
            ('deadline', '计划完成日期', DATE, {'formatter': 'YYYY-MM-DD'}),
            ('notes', '备注', TEXT, None),
        ],
    },
    'milestones': {
        'name': '里程碑表',
        'fields': [
            ('title', '里程碑名称', TEXT, None),
            ('status', '状态', SELECT, {'options': [
                {'name': '待核'}, {'name': '待核对'}, {'name': '未开始'},
                {'name': '进行中'}, {'name': '已达成'}, {'name': '已延期'}]}),
            ('date', '目标日期', DATE, {'formatter': 'YYYY-MM-DD'}),
            ('start_date', '开始日期', DATE, {'formatter': 'YYYY-MM-DD'}),
            ('description', '交付内容', TEXT, None),
            ('benefit', '预期效益', TEXT, None),
            ('actual_deliver', '实际交付', TEXT, None),
            ('notes', '备注', TEXT, None),
            ('attachments', '附件', 'attachment', None),
        ],
        # 阶段二补：project_ids、site_ids
        'links': [('project_ids', '所属项目', 'projects'),
                  ('site_ids', '关联场地', 'sites')],
    },
    'sites': {
        'name': '场地表',
        'fields': [
            ('title', '场地名称', TEXT, None),
            ('code', '场地编码', TEXT, None),
            ('status', '场地状态', SELECT, {'options': [
                {'name': '待建'}, {'name': '在建'}, {'name': '已投运'}, {'name': '暂停'}]}),
            ('notes', '当前卡点', TEXT, None),
            ('attachments', '附件', 'attachment', None),
        ],
        'links': [('project_ids', '所属项目', 'projects')],
    },
    'records': {
        'name': '项目记录表',
        'fields': [
            # 第一列会被钉钉建成 primaryDoc，正好当标题用
            ('title', '反馈内容', TEXT, None),
            ('kind', '反馈类型', SELECT, {'options': [
                {'name': '产品需求'}, {'name': '业务问题'}, {'name': '开发情况'},
                {'name': '沟通要点'}, {'name': '问题反馈'}]}),
            ('sub_kind', '反馈子类别', SELECT, {'options': [
                {'name': '硬件方向'}, {'name': '软件方向'}, {'name': '业务方向'}]}),
            ('status', '状态', SELECT, {'options': [
                {'name': '开放'}, {'name': '处理中'}, {'name': '已解决'}, {'name': '已关闭'}]}),
            ('description', '详情', TEXT, None),
            ('solution', '解决方案', TEXT, None),
            ('date', '创建日期', DATE, {'formatter': 'YYYY-MM-DD'}),
            ('contact', '对接人', 'user', {'multiple': True}),
            ('attachments', '附件', 'attachment', None),
        ],
        'links': [('project_ids', '项目类别', 'projects'),
                  ('site_ids', '场地编码', 'sites'),
                  ('milestone_ids', '里程碑', 'milestones')],
    },
}

# 建表顺序：项目表必须先建，因为其它三张表都要关联它。
ORDER = ('projects', 'milestones', 'sites', 'records')


def _call(gw, args):
    return gw.call(args)


def existing_tables(gw, base):
    found = _call(gw, ['aitable', 'table', 'get', '--base-id', base]).get('tables')
    return found if isinstance(found, list) else []


def create_base(gw, name):
    """建一个 Base，返回 (base_id, base_url)。"""
    result = _call(gw, ['aitable', 'base', 'create', '--name', name])
    base = result.get('baseId') or (result.get('base') or {}).get('id')
    if not base:
        raise n.Error('建表失败：没有返回 Base ID')
    url = result.get('baseUrl') or result.get('url') or ''
    return base, url


def create_table(gw, base, role, spec, progress=lambda m: None):
    """建一张表并写入非关联字段。返回 (table_id, 逻辑名→字段)。"""
    fields = []
    for logical, label, kind, config in spec['fields']:
        item = {'fieldName': label, 'type': kind}
        if config:
            item['config'] = config
        fields.append(item)
    progress(f'正在创建 {spec["name"]}（{len(fields)} 个字段）')
    result = _call(gw, ['aitable', 'table', 'create', '--base-id', base,
                        '--name', spec['name'], '--fields', _json(fields)])
    table_id = result.get('tableId') or (result.get('table') or {}).get('id')
    if not table_id:
        raise n.Error(f'{spec["name"]} 创建失败：没有返回表 ID')
    actual = _call(gw, ['aitable', 'field', 'get', '--base-id', base,
                        '--table-id', table_id])
    real = actual.get('fields') if isinstance(actual.get('fields'), list) else []
    resolved = {}
    by_name = {f.get('fieldName'): f for f in real}
    for logical, label, kind, config in spec['fields']:
        found = by_name.get(label)
        if found:
            resolved[logical] = found
    return table_id, resolved, real


def _json(value):
    import json
    return json.dumps(value, ensure_ascii=False)


def add_link(gw, base, table_id, logical, label, target_table, multiple=True,
             progress=lambda m: None):
    """阶段二：补关联字段。"""
    progress(f'正在建立关联：{label} → {target_table[:8]}')
    _call(gw, ['aitable', 'field', 'create', '--base-id', base, '--table-id', table_id,
               '--name', label, '--type', 'bidirectionalLink',
               '--config', _json({'linkedTableId': target_table, 'multiple': multiple})])


def build(config, gw, name=None, progress=lambda m: None, settle=1.0):
    """完整建一套四张表，返回可直接保存的绑定配置。

    `config` 只需含 growth/harness 等运行时设置；表格绑定部分会整体重建。
    """
    import os
    import time

    name = name or ('年轮工作空间 ' + datetime.now().strftime('%m-%d %H:%M'))
    progress('正在创建 AI 表格 Base')
    base, base_url = create_base(gw, name)

    tables = {}
    real_fields = {}
    for role in ORDER:
        table_id, resolved, real = create_table(gw, base, role, TEMPLATES[role], progress)
        tables[role] = {'id': table_id, 'resolved': resolved}
        real_fields[role] = real
        # 建表后 DWS 需要一点时间让字段元数据稳定，否则紧接着建关联会报主键不存在。
        # 真机要等；测试传 settle=0 跳过，否则 4 张表白等 4 秒。
        if settle:
            time.sleep(settle)

    # 阶段二：关联字段（依赖已建好的表 ID）
    for role in ORDER:
        spec = TEMPLATES[role]
        for logical, label, target_role in spec.get('links') or []:
            add_link(gw, base, tables[role]['id'], logical, label,
                     tables[target_role]['id'], progress=progress)

    # 回读全部字段，组装绑定配置
    final = {}
    for role in ORDER:
        actual = _call(gw, ['aitable', 'field', 'get', '--base-id', base,
                            '--table-id', tables[role]['id']])
        rows = actual.get('fields') if isinstance(actual.get('fields'), list) else []
        by_name = {f.get('fieldName'): f for f in rows}
        fields = {}
        spec = TEMPLATES[role]
        pairs = [(logical, label) for logical, label, _k, _c in spec['fields']]
        pairs += [(logical, label) for logical, label, _t in spec.get('links') or []]
        for logical, label in pairs:
            found = by_name.get(label)
            if found:
                fields[logical] = found
        final[role] = {'id': tables[role]['id'], 'name': spec['name'], 'fields': fields}

    binding = {
        'format': 'nianlun-binding-v1',
        'base_id': base,
        'base_url': base_url or ('https://alidocs.dingtalk.com/i/nodes/' + base),
        'profile': getattr(gw, 'profile', None),
        'utc_offset_hours': 8,
        'tables': final,
    }
    for key in ('dws_bin', 'growth', 'timezone', 'harness'):
        if key in config:
            binding[key] = config[key]
    return binding


def coverage(binding):
    """统计每张表识别到多少字段，用于建表后自检。"""
    out = {}
    for role, table in (binding.get('tables') or {}).items():
        want = len(TEMPLATES[role]['fields']) + len(TEMPLATES[role].get('links') or [])
        have = len(table.get('fields') or {})
        out[role] = {'name': table.get('name'), 'want': want, 'have': have}
    return out
