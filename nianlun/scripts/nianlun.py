#!/usr/bin/env python3
"""Portable product shell. DWS + AITable own identity and data; the host AI owns reasoning."""
import argparse
import dws_transport
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import quote, urlparse
from zoneinfo import ZoneInfo

SKILL = Path(__file__).resolve().parents[1]
ROLES = {'projects': '项目主表', 'milestones': '里程碑表', 'sites': '场地表', 'records': '项目记录表'}
# Logical names are portable. Actual field IDs are resolved at bind time.
# 字段别名：同一逻辑字段在各人自建表里的常见叫法。新增写法时只加别名，不改读取逻辑。
FIELDS = {
 'projects': {'title': ['项目名称'], 'number': ['编号','项目编码','项目编号'], 'priority': ['等级','优先级'],
              'status': ['状态','进程','进度','项目状态'],
              'description': ['一句话描述','项目描述','简介'], 'risk': ['风险卡点','风险','卡点'], 'notes': ['备注'],
              'updated': ['最近更新','更新时间','更新日期'],
              'report': ['定期汇报','阶段性汇报链接','一页纸链接','汇报链接','阶段汇报'], 'goal': ['项目目标','目标'],
              'deadline': ['目标日期','项目截止日期','计划完成日期'],
              'biz_owner': ['业务负责人'], 'tech_owner': ['科技负责人']},
 'milestones': {'title': ['里程碑','里程碑名称'], 'project_ids': ['项目'], 'site_ids': ['场地代码','场地','所属场地'], 'date': ['截止日期','计划结束日期','目标日期','计划验收日期','验收日期','截止时间'],
                'status': ['状态','里程碑状态'],
                'description': ['交付内容','实际交付内容'], 'benefit': ['预期效益','预期交付内容'],
                'notes': ['备注'], 'attachments': ['附件','里程碑汇报'],
                'start_date': ['计划开始日期','开始日期'],
                'actual_deliver': ['实际交付时间','实际交付日期'],
                'actual_accept': ['实际验收时间','实际验收日期'],
                'accept_result': ['验收结果'],
                'r_owner': ['交付(R)负责人','交付负责人','R负责人'],
                'a_owner': ['验收(A)责任人','验收责任人','A责任人'],
                'c_contact': ['协商(C)对接人','协商对接人','C对接人'],
                'i_contact': ['知会(I)对接人','知会对接人','I对接人']},
 # 场地表是物理实体清单：一个场地可由多个项目共用，进度不在这里表达。
 # 「场地状态」已按用户决定删除——同一场地在不同项目里状态不同，单值必然冲突；
 # 进度唯一来源是里程碑表（项目 × 场地 × 阶段）。
 'sites': {'title': ['场地名称'], 'code': ['场地编码', '场地代码'], 'project_ids': ['项目'],
           'status': ['场地状态','状态'], 'notes': ['当前卡点','备注'], 'attachments': ['附件'],
           'owner': ['场地负责人'], 'entry_date': ['进场日期','进场时间']},
 'records': {'title': ['标题','反馈内容','记录内容','事项'], 'project_ids': ['项目'], 'site_ids': ['场地','场地编码'],
             'milestone_ids': ['里程碑'],
             'description': ['详情','描述','说明'], 'date': ['日期','创建日期'],
             'kind': ['记录类型','反馈类型','类型'], 'status': ['状态'],
             'owner': ['反馈人','记录人'], 'solution': ['解决方案','处理方案'], 'attachments': ['附件'],
             'sub_kind': ['反馈子类别','子类别'], 'contact': ['对接人']}}
# 必需字段只保留表结构里稳定存在的项：日期/类型允许缺失，避免按人自建表缺列就整表不可用。
REQUIRED = {'projects': ('title', 'status'), 'milestones': ('title', 'project_ids', 'status'),
            'sites': ('title', 'project_ids'), 'records': ('title', 'status')}


class Error(Exception):
    pass


class ReportStale(Error):
    """A report's frozen input cannot be safely reused with current project facts."""


def save(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(obj, ensure_ascii=False, indent=2) if not isinstance(obj, str) else obj
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent, delete=False) as f:
        f.write(content)
        temp = Path(f.name)
    os.replace(temp, path)


def load(path):
    return json.loads(Path(path).expanduser().read_text(encoding='utf-8'))


def stamp(config):
    tz = time_zone(config)
    return datetime.now(tz).isoformat(timespec='seconds')


def time_zone(config):
    name = config.get('growth', {}).get('schedule', {}).get('timezone') or config.get('timezone')
    return ZoneInfo(name) if name else timezone(timedelta(hours=config.get('utc_offset_hours', 8)))


def brain_command(config):
    settings = config['growth']
    return settings.get('gbrain_command') or [settings.get('gbrain_bin', 'gbrain')]


def brain_search_args(config, query):
    # Fresh managed brains intentionally have no embedding key. Exact keyword search is sufficient;
    # query's expansion would imply an additional model provider that this installer never configured.
    if config['growth'].get('memory_mode') == 'managed':
        return ['search', query, '--limit', '20']
    return ['query', query, '--no-expand']


def brain_env(config):
    env = dws_transport.environment()
    settings = config['growth']
    if settings.get('brain_home'):
        env['GBRAIN_HOME'] = str(Path(settings['brain_home']).expanduser().resolve())
    if settings.get('memory_mode') == 'managed':
        # A new personal brain must never inherit another project's database URL.
        env.pop('DATABASE_URL', None)
        env.pop('GBRAIN_DATABASE_URL', None)
    return env


def digest(obj):
    return hashlib.sha256(json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def payload(value):
    if not isinstance(value, dict):
        raise Error('DWS 返回不是 JSON 对象')
    for obj in (value, value.get('data', {})):
        if isinstance(obj, dict):
            if obj.get('success') is False or obj.get('status') in ('error', 'failed', 'partial_success') or obj.get('error'):
                # Do not echo arbitrary diagnostic objects containing credentials.
                raise Error('DWS 返回失败或部分成功；停止执行，请用同一 profile 检查该操作')
    return value.get('data', value)


class DWS:
    def __init__(self, profile=None, runner=subprocess.run, binary='dws'):
        self.profile = profile
        self.runner = runner
        self.binary = binary

    def call(self, args):
        command = [self.binary]
        if self.profile:
            command += ['--profile', self.profile]
        command += ['aitable', *args, '--format', 'json']
        try:
            result = self.runner(command, capture_output=True, text=True, encoding='utf-8', timeout=120, env=dws_transport.environment())
        except OSError as exc:
            raise Error('DWS 程序未能启动，本次未提交') from exc
        except subprocess.TimeoutExpired as exc:
            write=any(x in ('create','+record-update') for x in args[:2])
            raise Error('DWS 写入结果未知，请核验原结果，未自动重试' if write else 'DWS 读取超时，未把缺失结果视为空数据') from exc
        raw=dws_transport.object_output(result.stdout)
        if result.returncode or raw is None:raise Error(dws_transport.failure(result,['aitable',*args]))
        return payload(raw)

    def fields(self, base, table):
        result = self.call(['field', 'list', '--base-id', base, '--table-id', table])
        if not isinstance(result.get('fields'), list):
            raise Error('DWS 字段返回结构不符合预期')
        return result['fields']

    def records(self, base, table):
        result = self.call(['record', 'query', '--base-id', base, '--table-id', table, '--all', '--page-limit', '100'])
        if result.get('complete') is not True or result.get('hasMore') is not False:
            raise Error('全量读取未完成，不能生成完整汇报或执行去重写入')
        rows = result.get('records')
        # DWS serializes a genuinely empty, complete page as null.
        if rows is None and result.get('fetchedCount') == 0:
            rows = []
        if not isinstance(rows, list) or result.get('fetchedCount') != len(rows):
            raise Error('DWS 记录数量或结构异常')
        ids = [r.get('recordId') for r in rows]
        if None in ids or len(set(ids)) != len(ids):
            raise Error('记录 ID 缺失或重复')
        return rows


def clean_name(name):
    return re.sub(r'[^\w\u4e00-\u9fff]', '', name)


# ---- 开放表结构推断 ----
# 目标：别人拿到年轮，用它自己的表结构也能跑，不要求列名和我们的预设一致。
#
# 做法分三层，逐层放宽：
#   ① 显式映射（field_mapping）—— 用户/向导指定，最高优先级
#   ② 别名匹配（FIELDS）—— 常见中文列名
#   ③ 结构推断（本函数）—— 按列类型 + 语义线索猜，只用于别名全部落空时
#
# ③ 是「可移植性」的关键。因为列类型在钉钉表里是唯一的：
#   关联列只可能是 bidirectionalLink/unidirectionalLink，
#   日期列只可能是 date/createdTime/modifiedTime，
#   人员列是 user/creator。这些线索和列名无关。

# 结构推断的语义线索词。匹配顺序有意义：越具体越靠前。
_SEMANTIC_HINTS = {
    'title': ('标题', '名称', '内容', '事项', '主题', 'title', 'name', 'subject'),
    'description': ('详情', '描述', '说明', '内容', '正文', 'detail', 'desc'),
    'solution': ('解决', '处理', '方案', '结论', 'solution', 'resolution'),
    'status': ('状态', '进度', '阶段', 'status', 'state', 'stage'),
    'date': ('日期', '时间', '截止', 'date', 'time', 'due'),
    'owner': ('人', '负责', 'owner', 'assignee', 'creator'),
    'kind': ('类型', '分类', '类别', 'type', 'kind', 'category'),
    'code': ('编码', '代码', '编号', 'code', 'number', 'id'),
    'priority': ('优先级', '等级', 'priority', 'level'),
    'risk': ('风险', '卡点', '阻塞', 'risk', 'blocker'),
}


def _hint_score(logical, field_name):
    """列名和逻辑字段的语义接近程度，0 表示无关。"""
    name = str(field_name or '').casefold()
    if not name:
        return 0
    best = 0
    for hint in _SEMANTIC_HINTS.get(logical, ()):
        if hint.casefold() in name:
            # 越长的线索词越可信：「截止日期」比「日期」更能说明问题
            best = max(best, len(hint))
    return best


def _infer_by_structure(role, logical, fields, taken):
    """别名匹配不上时，按类型和语义猜一列。

    只在「类型能唯一确定用途」或「语义线索足够强」时才返回，避免瞎猜：
    - 关联字段（*_ids）：看目标表，不是所有 link 都能当项目
    - 日期：date/createdTime/modifiedTime 三选一，优先 date
    - 其余：靠语义线索，且必须唯一
    """
    open_fields = [f for f in fields if f['fieldId'] not in taken]
    if not open_fields:
        return None
    if logical.endswith('_ids'):
        wanted = [f for f in open_fields
                  if f.get('type') in ('bidirectionalLink', 'unidirectionalLink')]
        if not wanted:
            return None
        target = {'project_ids': 'projects', 'site_ids': 'sites',
                  'milestone_ids': 'milestones'}.get(logical)
        if target:
            # 关联目标表能直接判断这一列连的是谁，比列名可靠得多。
            matched = [f for f in wanted
                       if (f.get('config') or {}).get('linkedTableId')]
            if matched:
                return matched[0] if len(matched) == 1 else None
        return wanted[0] if len(wanted) == 1 else None
    if logical in ('date', 'updated', 'deadline', 'start_date', 'entry_date'):
        wanted = [f for f in open_fields
                  if f.get('type') in ('date', 'createdTime', 'modifiedTime')]
        if not wanted:
            return None
        # 优先真实 date（可写），系统生成的创建/修改时间只读。
        writable = [f for f in wanted if f.get('type') == 'date']
        pool = writable or wanted
        return pool[0] if len(pool) == 1 else None
    if logical == 'owner':
        wanted = [f for f in open_fields
                  if f.get('type') in ('user', 'creator', 'modifiedBy')]
        if wanted:
            return wanted[0] if len(wanted) == 1 else None
    # 最后靠语义线索，且必须明显高于其它候选（防止把「标题」猜成「标题备注」）。
    scored = sorted(((_hint_score(logical, f.get('fieldName')), f) for f in open_fields),
                    key=lambda x: -x[0])
    if not scored or scored[0][0] == 0:
        return None
    if len(scored) > 1 and scored[0][0] == scored[1][0]:
        return None  # 并列就放弃，宁可缺字段也不猜错
    return scored[0][1]


def bind(client, base, base_url, mapping=None, field_mapping=None, config_path=None):
    parsed = urlparse(base_url)
    if parsed.scheme != 'https' or not (parsed.hostname or '').endswith('.dingtalk.com') or base not in parsed.path.split('/'):
        raise Error('请提供包含同一 Base ID 的钉钉 HTTPS 链接')
    found = client.call(['+list-tables', '--base', base]).get('tables')
    if not isinstance(found, list):
        raise Error('DWS 表目录返回结构异常')
    # 只重写表格绑定部分：growth（开关、文件夹、调度、状态目录）与 harness（宿主选择）
    # 由接入向导维护，重新绑定绝不能把它们清掉。
    config = {'format': 'nianlun-binding-v1', 'base_id': base, 'base_url': base_url.split('?')[0],
              'profile': client.profile, 'utc_offset_hours': 8, 'tables': {}}
    existing_path = Path(config_path).expanduser() if config_path else None
    if existing_path and existing_path.exists():
        try:
            previous = load(existing_path)
            for key in ('dws_bin', 'growth', 'timezone', 'harness'):
                if key in previous: config[key] = previous[key]
        except (OSError, ValueError):
            pass
    for role, name in ROLES.items():
        matches = [t for t in found if t['tableId'] == mapping[role]] if mapping and role in mapping else [t for t in found if clean_name(t['tableName']) == name]
        if len(matches) != 1:
            raise Error(f'{name}匹配到 {len(matches)} 张表；用 --table-map 显式指定，不自动选第一张')
        table = matches[0]
        fields = client.fields(base, table['tableId'])
        resolved = {}
        for logical, aliases in FIELDS[role].items():
            explicit = (field_mapping or {}).get(role, {}).get(logical)
            candidates = [f for f in fields if f['fieldId'] == explicit] if explicit else [f for f in fields if f['fieldName'] in aliases]
            if explicit and len(candidates) != 1:
                raise Error(f'{name}.{logical} 指定的字段不存在或不唯一')
            if len(candidates) > 1:
                raise Error(f'{name}.{logical} 字段有歧义')
            if candidates:
                resolved[logical] = candidates[0]
        # 别名落空的逻辑字段，尝试按类型+语义推断（开放表结构的关键）。
        # 只补必填项和能确定用途的列；推断不出来就留空，不硬凑。
        taken = {f['fieldId'] for f in resolved.values()}
        inferred = []
        for logical in FIELDS[role]:
            if logical in resolved:
                continue
            guess = _infer_by_structure(role, logical, fields, taken)
            if guess:
                resolved[logical] = guess
                taken.add(guess['fieldId'])
                inferred.append(logical)
        missing = set(REQUIRED[role]) - resolved.keys()
        if missing:
            raise Error(f'{name}缺少字段：{", ".join(sorted(missing))}。'
                        f'已自动识别 {len(resolved)} 列{("（推断：" + "、".join(inferred) + "）") if inferred else ""}；'
                        '请用 --field-map 指定缺失字段对应的列')
        for logical, f in resolved.items():
            if logical.endswith('_ids'):
                expected = ('bidirectionalLink', 'unidirectionalLink')
            elif logical in ('date', 'updated'):
                # createdTime / modifiedTime 是系统生成的日期，可读不可写，绑定后按只读取用。
                expected = ('date', 'createdTime', 'modifiedTime')
            elif logical in ('owner',):
                expected = ('text', 'user', 'creator', 'modifiedBy')
            else:
                expected = None
            if expected and f['type'] not in expected:
                raise Error(f'{name}.{logical} 类型不符：{f["type"]}')
        # 系统字段（创建时间/创建人/公式/lookup）不可写；写入逻辑据此跳过，而不是报错。
        readonly_types = {'createdTime', 'modifiedTime', 'creator', 'modifiedBy', 'lookup', 'autoNumber', 'formula', 'reference'}
        for logical, field in resolved.items():
            if field.get('type') in readonly_types: field['readonly'] = True
        config['tables'][role] = {'id': table['tableId'], 'name': table['tableName'], 'fields': resolved}
    verify_links(config)
    return config


def verify_links(config):
    for role, table in config['tables'].items():
        for logical, field in table['fields'].items():
            target = {'project_ids': 'projects', 'site_ids': 'sites', 'milestone_ids': 'milestones'}.get(logical)
            if target and field.get('config', {}).get('linkedTableId') != config['tables'][target]['id']:
                raise Error(f'{role}.{logical} 关联目标与绑定不一致')


def value(v):
    if isinstance(v, dict):
        return v.get('name', v.get('text', v.get('value', '')))
    return '' if v is None else str(v)


def read_date(v, config):
    if v in ('', None):
        return ''
    if isinstance(v, (int, float)):
        return datetime.fromtimestamp(v / 1000, time_zone(config)).date().isoformat()
    return str(v)[:10]


def table_url(config, role):
    return config['base_url'] + '?iframeQuery=' + quote('entrance=data&sheetId=' + config['tables'][role]['id'], safe='')


def normalized(config, role, records):
    result = []
    table = config['tables'][role]
    for r in records:
        item = {'id': r['recordId'], 'table_id': table['id'], 'table_url': table_url(config, role), 'raw_cells': r['cells']}
        for k, f in table['fields'].items():
            v = r['cells'].get(f['fieldId'])
            if k.endswith('_ids'):
                item[k] = (v or {}).get('linkedRecordIds', [])
            elif k in ('date', 'updated','deadline'):
                item[k] = read_date(v, config)
            elif k == 'attachments':
                item[k] = v or []
            else:
                item[k] = value(v)
        if role=='projects':item['active']=project_active(item)
        result.append(item)
    return result


def compatible_field(bound, current):
    if not current or current['type']!=bound['type']:return False
    before=bound.get('config',{});after=current.get('config',{})
    if bound['type']!='singleSelect':return before==after
    # Adding choices preserves every bound value; deletion, renaming and other changes do not.
    return ({k:v for k,v in before.items() if k!='options'}=={k:v for k,v in after.items() if k!='options'}
            and all(option in after.get('options',[]) for option in before.get('options',[])))


def fetch(config, client, check_schema=True):
    def read(pair):
        role, table = pair
        fields=table['fields']
        if check_schema:
            actual = {f['fieldId']: f for f in client.fields(config['base_id'], table['id'])}
            for logical, field in table['fields'].items():
                current = actual.get(field['fieldId'])
                if not compatible_field(field,current):
                    raise Error(f'{table["name"]}.{logical} 结构变化，请重新 bind 后检查')
            fields={logical:actual[field['fieldId']] for logical,field in table['fields'].items()}
        return role, normalized(config, role, client.records(config['base_id'], table['id'])), fields
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows=list(pool.map(read, config['tables'].items()))
        data={role:records for role,records,fields in rows}
        data['fields']={role:fields for role,records,fields in rows}
    data.update({'fetched_at': stamp(config), 'base_url': config['base_url'],
                 'table_urls': {role: table_url(config, role) for role in ROLES}, 'complete': True})
    # Dangling relationships stay visible as diagnostics rather than silently vanishing.
    data['warnings'] = []
    for role in ('records', 'milestones', 'sites'):
        for row in data[role]:
            for key, target in (('project_ids', 'projects'), ('site_ids', 'sites'), ('milestone_ids', 'milestones')):
                ids = {p['id'] for p in data[target]}
                missing = [id for id in row.get(key, []) if id not in ids]
                if missing:
                    # 只说「有悬空关联」帮不了任何人——要给出具体 id 和标题，
                    # 才能直接去表里删掉那个引用。
                    title = row.get('title') or row.get('name') or ''
                    data['warnings'].append(
                        f'{role}/{row["id"]}《{title[:24]}》的 {key} 指向已不存在的 {"/".join(missing)}，'
                        f'到表里删掉该单元格里的这个引用即可')
    return data


INACTIVE_PROJECT_STATUSES = frozenset(('已完成','已暂停','暂停','概念','已取消'))


def project_active(project):
    return project.get('status') not in INACTIVE_PROJECT_STATUSES


def select_projects(state, names, all_active=False):
    if all_active:
        return [p for p in state['projects'] if project_active(p)]
    chosen = []
    for name in names or []:
        matches = [p for p in state['projects'] if p['title'] == name or p['id'] == name]
        if len(matches) != 1:
            raise Error(f'项目「{name}」需唯一匹配，当前 {len(matches)} 项')
        if matches[0] not in chosen:
            chosen.append(matches[0])
    if not chosen:
        raise Error('请指定 --project 或 --all-active')
    return chosen


def readonly_field(config, role, field_id):
    """该字段是否只读（创建时间、创建人、公式等系统字段）。

    只读字段写不进去，比对时也不该拿它当预期值——否则永远对不上。
    """
    for field in (config['tables'][role].get('fields') or {}).values():
        if field.get('fieldId') == field_id:
            return bool(field.get('readonly'))
    return False


def plan(config, state, candidates):
    if not isinstance(candidates, list) or not 1 <= len(candidates) <= 100:
        raise Error('候选必须为 1–100 项 JSON 数组')
    actions = []
    keys = set()
    for candidate in candidates:
        op = candidate.get('op', 'create_record')
        if op == 'update_status':
            role = candidate.get('role')
            if role not in ('projects', 'records', 'milestones'):
                raise Error('不支持的状态更新对象')
            rows = [r for r in state[role] if r['id'] == candidate.get('record_id')]
            if len(rows) != 1:
                raise Error('状态更新的 record_id 不存在')
            field = config['tables'][role]['fields']['status']
            status = candidate.get('status')
            options = field.get('config', {}).get('options', [])
            if status not in [v['name'] for v in options]:
                raise Error(f'不在表中定义的状态：{status}')
            row = rows[0]
            action = {'op': op, 'role': role, 'record_id': row['id'], 'title': row['title'],
                      'before': row['raw_cells'].get(field['fieldId']), 'after': status,
                      'cells': {field['fieldId']: status}, 'field_id': field['fieldId']}
            key = role + '/' + row['id']
        elif op == 'create_record':
            projects = select_projects(state, [candidate.get('project', '')])
            source = candidate.get('source', {})
            required = ('title', 'description', 'date', 'kind')
            if any(not isinstance(candidate.get(k), str) or not candidate[k].strip() for k in required):
                raise Error('每条候选必须含 title、description、date、kind')
            if not all(isinstance(source.get(k), str) and source[k].strip() for k in ('id', 'name', 'quote')):
                raise Error('每条候选必须保留 source.id、name、quote，不能用无出处摘要入表')
            datetime.strptime(candidate['date'], '%Y-%m-%d')
            identity = {'source': source['id'], 'project': projects[0]['id'], 'title': candidate['title'].strip()}
            marker = '[年轮来源:' + digest(identity) + ']'
            fields = config['tables']['records']['fields']
            def field(k):
                if k not in fields:
                    raise Error(f'当前表没有 {k} 字段')
                return fields[k]['fieldId']
            # 详情列在不同表版本里可能叫 详情(description)、解决方案(solution) 或 描述。
            # 缺列时必须换一列落库，否则整条记录都写不进去；去重读取要用同一列，否则重复入库。
            detail_key = next((k for k in ('description', 'solution', 'notes') if k in fields), None)
            if not detail_key:
                raise Error('反馈记录表缺少可写入详情的文本列（详情/解决方案/备注）')
            kind_key = next((k for k in ('kind', 'sub_kind') if k in fields), None)
            for k in filter(None, (kind_key, 'status')):
                desired = candidate.get(k if k != kind_key else 'kind', '开放')
                options = [o['name'] for o in fields[k].get('config', {}).get('options', [])]
                if options and desired not in options:
                    raise Error(f'{k}={desired} 不在现有字段选项内')
            details = candidate['description'] + '\n\n来源：' + source['name'] + '\n来源标识：' + source['id'] + '\n原文摘录：' + source['quote']
            if source.get('url'):
                url = urlparse(source['url'])
                if url.scheme != 'https':
                    raise Error('来源 URL 仅接受 HTTPS')
                details += '\n原文链接：' + source['url']
            details += '\n' + marker
            if len(details) > 20000 or len(candidate['title']) > 180:
                raise Error('单条内容过长，请拆分或缩短')
            record_cells = {field('title'): candidate['title'].strip(), field(detail_key): details,
                            field('project_ids'): {'linkedRecordIds': [projects[0]['id']]}, field('date'): candidate['date'],
                            field('status'): candidate.get('status', '开放')}
            if kind_key:
                record_cells[field(kind_key)] = candidate['kind']
            # 反馈子类别：和 kind 是两个独立的单选列，原来完全没填——实测整表覆盖率只有 24%。
            # 只在表里真有这一列、且给了合法取值时才写，避免凭空造选项。
            if 'sub_kind' in fields and candidate.get('sub_kind'):
                want = str(candidate['sub_kind']).strip()
                options = [o['name'] for o in fields['sub_kind'].get('config', {}).get('options', [])]
                if not options or want in options:
                    record_cells[field('sub_kind')] = want
            # 对接人：user 类型列，写姓名由 DWS 解析。原来也没填——实测覆盖率 2%。
            if 'contact' in fields and candidate.get('contact'):
                who = str(candidate['contact']).strip()
                if who:
                    record_cells[field('contact')] = who
            cells = record_cells
            for logical, role in (('site_ids', 'sites'), ('milestone_ids', 'milestones')):
                ids = candidate.get(logical, [])
                if ids:
                    if len(ids) > 1 and not fields.get(logical, {}).get('config', {}).get('multiple'):
                        raise Error(f'{logical} 只允许一项')
                    for id in ids:
                        rows = [r for r in state[role] if r['id'] == id]
                        if len(rows) != 1 or projects[0]['id'] not in rows[0].get('project_ids', []):
                            raise Error(f'{logical} 不存在或不属于该项目')
                    cells[field(logical)] = {'linkedRecordIds': ids}
            existing = [r for r in state['records'] if marker in (r.get(detail_key) or '')]
            if len(existing) > 1:
                raise Error('同一来源标记已出现多条记录，需先核实')
            # 只读字段（创建时间、创建人、公式）写不进去，必须在这里就剔除：
            # 否则写后验证拿模型给的值去比对系统自动生成的值，永远对不上，
            # 整轮被误判成「写后验证失败」——记录其实已经写成功了。
            # 实测 2026-11-07 03:38 那轮：模型给 date=2026-11-06，而该字段是
            # createdTime，实际写入 2026-11-07，验证必然失败。
            cells = {k: v for k, v in cells.items() if not readonly_field(config, 'records', k)}
            action = {'op': op, 'role': 'records', 'title': candidate['title'], 'project': projects[0]['title'],
                      'cells': cells, 'marker': marker, 'detail_key': detail_key,
                      'skip_existing': [r['id'] for r in existing]}
            key = marker
        else:
            raise Error('仅支持 create_record 或 update_status，不执行删除及结构修改')
        if key in keys:
            raise Error('本批候选重复指向同一记录或同一来源，请合并后再生成计划')
        keys.add(key)
        actions.append(action)
    return {'format': 'nianlun-plan-v1', 'created_at': stamp(config), 'binding_hash': digest(config),
            'base_id': config['base_id'], 'profile': config.get('profile'), 'candidates': candidates,
            'actions': actions, 'action_hash': digest(actions), 'candidate_hash': digest(candidates)}


def equivalent(actual, expected):
    # Clearing an optional date returns JSON null (or an omitted/empty cell), not the text "None".
    if expected is None:return actual is None or actual=='' or actual==[]
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(actual.get(k) == v for k, v in expected.items())
    return value(actual) == str(expected) or (isinstance(expected, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', expected) and str(actual)[:10] == expected)


def reconcile_plan(config, client, document, receipt_path):
    """Read only from DWS; preserve the receipt unless every original write is proven."""
    if document.get('binding_hash')!=digest(config) or document.get('action_hash')!=digest(document['actions']) or document.get('candidate_hash')!=digest(document['candidates']):
        raise Error('原计划校验失败，保留回执')
    path=Path(receipt_path);old=load(path) if path.exists() else {}
    if old and old.get('plan_hash')!=document['action_hash']:raise Error('原回执与计划不一致')
    state=fetch(config,client);results=[]
    count=min(len(document['actions']),len(old.get('results',[]))+1) if old.get('in_flight') else len(document['actions'])
    for index,action in enumerate(document['actions'][:count]):
        rows=state[action['role']]
        if action['op']=='create_record':
            matches=[r for r in rows if action['marker'] in (r.get(action.get('detail_key','description')) or '')]
        else:matches=[r for r in rows if r['id']==action['record_id']]
        if len(matches)!=1 or not all(equivalent(matches[0]['raw_cells'].get(k),v) for k,v in action['cells'].items()):
            raise Error('原结果尚不能唯一核验：'+action['title']+'；保留待核，未重新提交')
        known=old.get('in_flight',{}).get('record_id')
        if index==len(old.get('results',[])) and known and known!=matches[0]['id']:raise Error('来源标记与原返回编号不一致')
        results.append({'status':'already_present' if action['op']=='create_record' else 'already_applied',
                        'record_id':matches[0]['id'],'title':action['title']})
    if old and not path.with_suffix('.before-reconcile.json').exists():save(path.with_suffix('.before-reconcile.json'),old)
    result={**old,'plan_hash':document['action_hash'],'status':'verified' if count==len(document['actions']) else 'running','results':results,'reconciled_at':stamp(config)}
    result.pop('in_flight',None);result.pop('error',None);save(path,result)
    return result


def apply_plan(config, client, document, receipt_path):
    if document.get('format') != 'nianlun-plan-v1' or document.get('binding_hash') != digest(config):
        raise Error('计划绑定与当前配置不同，请重新生成')
    if document.get('action_hash') != digest(document['actions']):
        raise Error('计划内容被修改，请由候选重新生成计划')
    if document.get('candidate_hash') != digest(document.get('candidates')):
        raise Error('候选在计划生成后被修改，请重新生成计划')
    if Path(receipt_path).exists() and load(receipt_path).get('in_flight'):
        recovered=reconcile_plan(config,client,document,receipt_path)
        if recovered['status']=='verified':return recovered
    state = fetch(config, client)
    fresh = plan(config, state, document['candidates'])
    if len(fresh['actions']) != len(document['actions']):
        raise Error('计划操作数量不一致')
    for original, action in zip(document['actions'], fresh['actions']):
        for key in ('op', 'role', 'record_id', 'cells', 'marker'):
            if original.get(key) != action.get(key):
                raise Error('计划目标或字段发生变化，请重新生成计划')
    receipt = {'plan_hash': document['action_hash'], 'started_at': stamp(config), 'status': 'running', 'results': []}
    save(receipt_path, receipt)
    # No deletion. One mutation at a time. Persist each verified result before proceeding.
    try:
        for original, action in zip(document['actions'], fresh['actions']):
            role = action['role']
            table = config['tables'][role]['id']
            receipt['in_flight'] = {'title': action['title'], 'op': action['op'], 'table_id': table,
                                    'record_id': action.get('record_id'), 'marker': action.get('marker')}
            save(receipt_path, receipt)
            if action['op'] == 'create_record':
                if action['skip_existing']:
                    existing = next(r for r in state['records'] if r['id'] == action['skip_existing'][0])
                    if not all(equivalent(existing['raw_cells'].get(k), v) for k, v in action['cells'].items()):
                        raise Error('来源标记已存在但内容不同，停止以避免覆盖人工修改')
                    result = {'status': 'already_present', 'record_id': existing['id'], 'title': action['title']}
                else:
                    with tempfile.TemporaryDirectory(prefix='nianlun-write-') as temp:
                        records_file = Path(temp) / 'records.json'
                        save(records_file, [{'cells': action['cells']}])
                        output = client.call(['record', 'create', '--base-id', config['base_id'], '--table-id', table,
                                              '--records-file', str(records_file), '--yes'])
                    ids = output.get('newRecordIds', [])
                    if len(ids) != 1:
                        raise Error('新增结果不明确，停止；通过来源标记回读后再决定，不能直接重发')
                    result = {'status': 'created', 'record_id': ids[0], 'title': action['title']}
            else:
                if equivalent(action['before'], original['after']):
                    result = {'status': 'already_applied', 'record_id': action['record_id'], 'title': action['title']}
                elif not equivalent(action['before'], original['before']):
                    raise Error('状态在计划生成后已变化，停止以保留他人更新')
                else:
                    client.call(['+record-update', '--base-id', config['base_id'], '--table-id', table,
                                 '--records', json.dumps([{'recordId': action['record_id'], 'cells': action['cells']}], ensure_ascii=False), '--yes'])
                    result = {'status': 'updated', 'record_id': action['record_id'], 'title': action['title']}
            receipt['in_flight']['record_id'] = result['record_id']
            save(receipt_path, receipt)
            # Verify actual returned ID and all modified cells, not CLI exit code alone.
            reread = client.call(['+record-query', '--base-id', config['base_id'], '--table-id', table, '--record-ids', result['record_id']])
            rows = reread.get('records', [])
            if len(rows) != 1 or rows[0].get('recordId') != result['record_id'] or not all(equivalent(rows[0]['cells'].get(k), v) for k, v in action['cells'].items()):
                raise Error(f'写后验证失败或未知：{action["title"]}；停止后续写入')
            receipt['results'].append(result)
            receipt.pop('in_flight', None)
            save(receipt_path, receipt)
        receipt['status'] = 'verified'
    except Exception as exc:
        receipt.update(status='stopped', error=str(exc))
        save(receipt_path, receipt)
        raise
    save(receipt_path, receipt)
    return receipt


def build_home(state, output, config=None):
    if config and config.get('growth'):
        state = dict(state)
        runtime = Path(config['growth']['state_dir']).expanduser()
        receipts = sorted(runtime.glob('runs/*/finish.json'), key=lambda p: p.stat().st_mtime, reverse=True)
        latest = load(receipts[0]) if receipts else {}
        import run_control
        from setup import default_home
        snapshot_status=run_control.status(config,default_home(),None)
        # 收尾各步的失败要能在页面上看见：报告生成失败时整轮仍是 complete，
        # 只翻磁盘才发现，用户会以为报告已经出了。
        reports_state = {'done': 0, 'failed': 0, 'error': ''}
        if receipts:
            post_path = receipts[0].parent / 'postprocess.json'
            if post_path.exists():
                try:
                    post = load(post_path)
                except (OSError, ValueError):
                    post = {}
                reports_state['done'] = len(post.get('reports') or [])
                failed_items = post.get('reports_failed') or []
                reports_state['failed'] = len(failed_items)
                if reports_state['done'] or reports_state['failed']:
                    reports_state['error'] = '；'.join(
                        str(x.get('message') or '')[:120] for x in failed_items[:2])
                for key in ('reports_error', 'planning_error', 'memory_error'):
                    if post.get(key):
                        reports_state['error'] = reports_state['error'] or str(post[key].get('message') or '')[:200]
                # 补生成的结果单独展示：它在 reports 之外，不读的话用户在页面上
                # 完全看不到「上轮欠的报告已经补上了」。
                backlog_result = post.get('backlog') or {}
                if backlog_result.get('recovered'):
                    reports_state['recovered'] = len(backlog_result['recovered'])
                if backlog_result.get('pending'):
                    reports_state['still_pending'] = len(backlog_result['pending'])
                # 历史 postprocess 里的失败记录会一直挂着，哪怕后来补生成成功了。
                # 以当前待补清单为准：清单空 = 欠的都已经补上，不该再显示旧警告。
                try:
                    import flow as flow_module
                    live_pending = flow_module.pending_reports(config)
                except Exception:
                    live_pending = None
                if live_pending is not None:
                    reports_state['still_pending'] = len(live_pending)
                    if not live_pending and not reports_state['failed']:
                        reports_state['error'] = ''
                    elif not live_pending and reports_state['failed']:
                        # 有失败记录但都已补上：转成「已补齐」而不是继续报警。
                        reports_state['recovered'] = reports_state.get('recovered') or len(post.get('reports_failed') or [])
                        reports_state['failed'] = 0
                        reports_state['error'] = ''
        state['growth'] = {'schedule': config['growth'].get('schedule', {}),
                           'status': latest.get('status', '尚未运行'), 'last_run': latest.get('finished_at', ''),
                           'memory_verified': latest.get('brain', {}).get('verified', False),
                           'digest_status': latest.get('digest', {}).get('status', '尚未推送'),
                           'reports': reports_state,
                           'switches': config['growth'].get('switches', {}),
                           'scheduler': snapshot_status}
    # 主动推进：把「本周该关注什么」算进快照，静态页也具备 C 定位的能力。
    # 算不出来（数据不全）时不影响主页——`pulse` 缺省，前端会跳过该区块。
    try:
        import pulse as _pulse
        state = dict(state)
        state['pulse'] = _pulse.build(state)
    except Exception:
        pass
    template = (SKILL / 'assets/home.html').read_text(encoding='utf-8')
    css = (SKILL / 'assets/style.css').read_text(encoding='utf-8')
    script = (SKILL / 'assets/home.js').read_text(encoding='utf-8')
    # Escape < in JSON so table content cannot close the data script element.
    data = json.dumps(state, ensure_ascii=False).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    rendered = template.replace('<!-- STYLE -->', '<style>' + css + '</style>').replace('<!-- DATA -->', '<script id="data" type="application/json">' + data + '</script>').replace('<!-- SCRIPT -->', '<script>' + script + '</script>')
    save(output, rendered)


def main():
    parser = argparse.ArgumentParser(description='年轮 · DWS / AI 表格产品壳')
    parser.add_argument('--config', default=os.environ.get('NIANLUN_CONFIG', str(Path.home() / '.config/nianlun/config.json')))
    sub = parser.add_subparsers(dest='command', required=True)
    b = sub.add_parser('bind', help='只读发现并绑定现有四表，不建表')
    b.add_argument('--base-id', required=True)
    b.add_argument('--base-url', required=True)
    b.add_argument('--profile')
    b.add_argument('--table-map', help='可选 JSON 文件：role → tableId')
    sub.add_parser('doctor', help='验证 DWS、表结构、关联和全量分页')
    sub.add_parser('inspect', help='读取全量项目记忆 JSON')
    h = sub.add_parser('home', help='从实时表生成单文件产品入口')
    h.add_argument('--out', required=True)
    p = sub.add_parser('project', help='读取单项目的连续记忆')
    p.add_argument('--name', required=True)
    r = sub.add_parser('report', help='从实时表生成阶段性汇报 HTML + Markdown')
    r.add_argument('--project', action='append')
    r.add_argument('--all-active', action='store_true')
    r.add_argument('--since', required=True)
    r.add_argument('--until', required=True)
    r.add_argument('--out', required=True, help='输出 HTML 路径，同目录输出 .md')
    r.add_argument('--summary-file')
    r.add_argument('--title', default='年轮 · 阶段性汇报')
    p = sub.add_parser('plan', help='核对 AI 提炼候选并生成写入计划，不写表')
    p.add_argument('--input', required=True)
    p.add_argument('--out', required=True)
    sf = sub.add_parser('fact', help='把口头告知的场地进度写入表格（默认只演算，加 --yes 才写）')
    sf.add_argument('--site', required=True, help='场地名称或编号，如 武汉吴家山 或 027W')
    sf.add_argument('--status', required=True, help='目标场地状态，如 已验收')
    sf.add_argument('--note', default='', help='补充说明，写入记录详情')
    sf.add_argument('--source', default='用户口述', help='事实来源描述')
    sf.add_argument('--evidence', default='', help='用户原话摘录')
    sf.add_argument('--project', help='同名场地跨项目时用于消歧的项目名关键词')
    sf.add_argument('--yes', action='store_true', help='确认写入；不加则只返回演算结果')
    a = sub.add_parser('apply', help='执行明确授权的计划并逐项回读')
    a.add_argument('--plan', required=True)
    a.add_argument('--receipt', required=True)
    a.add_argument('--yes', action='store_true')
    args = parser.parse_args()
    try:
        if args.command == 'bind':
            config = bind(DWS(args.profile), args.base_id, args.base_url, load(args.table_map) if args.table_map else None, config_path=str(args.config))
            save(Path(args.config).expanduser(), config)
            result = {'bound': True, 'config': str(Path(args.config).expanduser()), 'tables': {k:v['name'] for k,v in config['tables'].items()}, 'remote_mutations': 0}
        else:
            config = load(args.config)
            if config.get('format') != 'nianlun-binding-v1':
                raise Error('配置格式不符，请先 bind')
            client = DWS(config.get('profile'), binary=config.get('dws_bin', 'dws'))
            if args.command == 'apply':
                if not args.yes:
                    raise Error('apply 必须带 --yes；仅在当前用户已授权该计划时使用')
                result = apply_plan(config, client, load(args.plan), args.receipt)
            else:
                state = fetch(config, client)
                if args.command == 'doctor':
                    result = {'ok': True, 'complete': True, 'fetched_at': state['fetched_at'],
                              'counts': {k:len(state[k]) for k in ROLES}, 'warnings': state['warnings'], 'remote_mutations': 0}
                elif args.command == 'inspect':
                    result = state
                elif args.command == 'home':
                    build_home(state, args.out, config)
                    result = {'html': str(Path(args.out).resolve()), 'fetched_at': state['fetched_at'], 'remote_mutations': 0}
                elif args.command == 'project':
                    chosen = select_projects(state, [args.name])[0]
                    result = {'project': chosen, 'fetched_at': state['fetched_at'], **{k:[r for r in state[k] if chosen['id'] in r.get('project_ids', [])] for k in ('records','milestones','sites')}}
                elif args.command == 'plan':
                    document = plan(config, state, load(args.input))
                    save(args.out, document)
                    result = {'plan': str(Path(args.out).resolve()), 'count': len(document['actions']), 'remote_mutations': 0,
                              'preview': [{k:v for k,v in a.items() if k not in ('cells', 'marker')} for a in document['actions']]}
                elif args.command == 'fact':
                    from sitefact import site_fact
                    result = site_fact(config, client, state, args.site, args.status,
                                       note=args.note, source=args.source,
                                       evidence=args.evidence, project=args.project,
                                       yes=args.yes)
                elif args.command == 'report':
                    datetime.strptime(args.since, '%Y-%m-%d')
                    datetime.strptime(args.until, '%Y-%m-%d')
                    if args.since > args.until:
                        raise Error('起始日期晚于结束日期')
                    projects = select_projects(state, args.project, args.all_active)
                    from render_report import render
                    summary = Path(args.summary_file).read_text(encoding='utf-8') if args.summary_file else ''
                    html, markdown, count = render(state, projects, args.since, args.until, args.title, summary)
                    save(args.out, html)
                    save(Path(args.out).with_suffix('.md'), markdown)
                    result = {'html': str(Path(args.out).resolve()), 'records': count, 'projects': len(projects), 'fetched_at': state['fetched_at'], 'remote_mutations': 0}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (Error, OSError, ValueError, KeyError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
