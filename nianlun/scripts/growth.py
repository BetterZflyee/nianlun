#!/usr/bin/env python3
"""Harness-driven growth. Operational receipts only; AITable and GBrain own business data."""
import argparse
import concurrent.futures
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from difflib import SequenceMatcher
import nianlun as n
import source_state
import intake
import dws_transport
from file_lock import file_lock

class Gateway:
    def __init__(self, config):
        self.config = config
    def call(self, args, cwd=None, partial=False):
        cmd = [self.config.get('dws_bin', 'dws')]
        if self.config.get('profile'):
            cmd += ['--profile', self.config['profile']]
        try:
            r = subprocess.run(cmd + args + ['--format', 'json'], cwd=cwd, capture_output=True, text=True, encoding='utf-8', timeout=180, env=dws_transport.environment())
        except OSError as e:
            raise n.Error('DWS 程序未能启动，本次未提交；请检查本机安装与路径') from e
        except subprocess.TimeoutExpired as e:
            raise n.Error('DWS ' + ('写入结果未知；可能已提交，请核验原结果，不自动重发' if dws_transport.is_write(args) else '读取超时；本次等待已结束，请检查网络与代理')) from e
        raw=dws_transport.object_output(r.stdout)
        if r.returncode or raw is None:
            # Partial listing envelopes remain usable only when the caller explicitly requests them.
            if partial and isinstance(raw,dict) and ('chats' in raw or 'items' in raw):return raw
            raise n.Error(dws_transport.failure(r,args))
        d = n.payload(raw)
        if isinstance(d,dict) and isinstance(raw.get('meta'),dict):
            d={**d,'meta':raw['meta']}
        if raw.get('ok') is False or d.get('partial') or d.get('failureCount', 0) or d.get('failedCount', 0):
            raise n.Error('DWS 失败或部分成功，不能记为完成')
        nested=d
        for _ in range(4):
            if not isinstance(nested,dict):break
            if nested.get('success') is False or nested.get('ok') is False or nested.get('errorCode') not in (None,'',0,'0'):
                raise n.Error('DWS 内层业务结果失败')
            nested=nested.get('result')
        return d
    def table(self):
        gw = self
        class Table(n.DWS):
            def call(self, args):
                return gw.call(['aitable', *args])
        return Table(self.config.get('profile'))


def root(config):
    return Path(config['growth']['state_dir']).expanduser().resolve()

@contextmanager
def locked(config):
    r = root(config); r.mkdir(parents=True, exist_ok=True)
    with file_lock(r / 'growth.lock'):
        yield


def self_identity(gw):
    rows = gw.call(['contact', 'user', 'get-self']).get('result', [])
    if len(rows) != 1 or not rows[0].get('orgEmployeeModel', {}).get('userId'):
        raise n.Error('当前组织身份不唯一，停止；不要选择第一个账号')
    p = rows[0]['orgEmployeeModel']
    identity={'user_id':p['userId'], 'name':p['orgUserName'], 'corp_id':p['corpId']}
    if hasattr(gw,'config'):
        identity_file=root(gw.config)/'identity.json'
        if identity_file.exists() and n.load(identity_file)!=identity:
            raise n.Error('当前组织身份与年轮绑定不同，请恢复正确 profile；不跨组织复用记录和待办')
        if not identity_file.exists():n.save(identity_file,identity)
    return identity


def complete(d, key):
    if d.get('complete') is not True or not isinstance(d.get(key), list):
        raise n.Error(key + ' 未完整读取')
    return d[key]


def instant(text, tz):
    if isinstance(text, (float, int)):
        return datetime.fromtimestamp(text / 1000, tz)
    d = datetime.fromisoformat(str(text).replace('Z', '+00:00'))
    return d.replace(tzinfo=tz) if d.tzinfo is None else d


def sanitize(text):
    text = re.sub(r'!\[[^\]]*\]\([^\n]*\)', '[原文图片]', text)
    return '\n'.join('[凭据内容已省略]' if re.search(r'(?i)password|passwd|api[_-]?key|secret|token\s*[:=]|admin\s*/|密码\s*[:：]', line) else line for line in text.splitlines())


def collect(config, since=None, until=None, selection=None, progress=lambda message:None):
    r = root(config); gw = Gateway(config); settings = config['growth']
    progress('正在核验钉钉组织身份与原轮次')
    selection=intake.selection(config,selection)
    pending = r / 'active.json'
    if pending.exists():
        if selection is not None:
            saved=n.load(Path(n.load(pending)['run_dir'])/'evidence.json')
            if saved.get('selection')!=selection or saved.get('requested_since')!=since or saved.get('requested_until')!=until:
                raise n.Error('已有未完成的生长任务，请先在执行记录中恢复原任务')
        return {'resumed':True, **n.load(pending)}
    end = instant(until or n.stamp(config), datetime.fromisoformat(n.stamp(config)).tzinfo)
    if selection is not None:
        if not since or not until:raise n.Error('手动补采须明确起止时间')
        manual_start=instant(since,end.tzinfo)
        if (end-manual_start).total_seconds()>366*86400:raise n.Error('单次补采最多 366 天，请分段执行')
    checkpoint = n.load(r/'checkpoint.json') if (r/'checkpoint.json').exists() else {}
    explicit=instant(since,end.tzinfo) if since else None
    start=source_state.window(settings,checkpoint,'harness',end,explicit)
    if start >= end: raise n.Error('采集起止时间不合法')
    run_id = end.strftime('%Y%m%d-%H%M%S') + '-' + uuid.uuid4().hex[:8]
    folder = r/'runs'/run_id; folder.mkdir(parents=True)
    bundle = {'format':'nianlun-evidence-v1','run_id':run_id,'since':start.isoformat(),'until':end.isoformat(),
              'binding':n.digest(config),'sources':[], 'coverage':[], 'identity':self_identity(gw)}
    if selection is not None:
        bundle.update(selection=selection,requested_since=since,requested_until=until,manual=True)
    bundle['count_semantics']='coverage.count 是扫描数量；sources 只含本轮新增或变化的来源。已处理来源被去重，所以二者数量不同不代表遗漏。'
    old = n.load(r/'seen.json') if (r/'seen.json').exists() else {}
    if selection and selection['project_ids']:
        scope_file=r/'scopes'/(n.digest(selection['project_ids'])+'.json')
        old=n.load(scope_file) if scope_file.exists() else {}
    current_channel='harness'
    def add(channel, sid, name, text, date, url='', **extra):
        if not sid or not isinstance(text,str) or not text.strip(): return
        # Strip expiring signed media URLs; they are not evidence needed for project management.
        text = sanitize(text)
        item = {'id':channel+':'+sid,'name':name,'text':text,'time':date,'url':url,'channels':[current_channel], **extra}
        item['version'] = n.digest(text)
        if old.get(item['id']) != item['version']: bundle['sources'].append(item)
    def section(channel, fn):
        nonlocal start,current_channel
        current_channel=channel;start=source_state.window(settings,checkpoint,channel,end,explicit)
        info={'channel':channel,'since':start.isoformat(),'until':end.isoformat()}
        label=source_state.LABELS.get(channel,channel);progress('正在采集：'+label)
        try:
            count = fn()
            bundle['coverage'].append({**info,'status':'complete','count':count})
            progress(label+'：已扫描 '+str(count)+' 条')
        except Exception as e:
            bundle['coverage'].append({**info,'status':'partial','count':getattr(e,'count',None),'error':str(e)})
            progress(label+'：部分覆盖，已保留缺口；'+str(e))
    progress('正在读取 AI 表格中的项目、里程碑和记录')
    bundle['tables'] = n.fetch(config,gw.table())
    if selection and selection['project_ids']:
        chosen=set(selection['project_ids'])
        if chosen-{p['id'] for p in bundle['tables']['projects']}:raise n.Error('所选项目已不存在，请刷新')
        for role in n.ROLES:
            bundle['tables'][role]=[row for row in bundle['tables'][role]
                if row['id'] in chosen or chosen.intersection(row.get('project_ids',[]))]
    progress('正在读取本人待办')
    bundle['todos'] = complete(gw.call(['todo','+get-my-tasks','--all','--status','false']), 'todos')
    def minutes():
        found = complete(gw.call(['minutes','+search','--scope','all','--start',start.isoformat(),'--end',end.isoformat(),'--page-all']), 'minutes')
        errors=[]
        for index,m in enumerate(found,1):
            progress('AI 听记：正在读取第 '+str(index)+' / '+str(len(found))+' 份摘要')
            try:
                detail=gw.call(['minutes','+detail','--id',m['taskUuid'],'--artifacts','summary'])
                s=detail.get('summary',{}).get('result',{}).get('fullSummary','')
                if not s: raise n.Error('摘要尚未就绪')
                add('minutes',m['taskUuid'],m['title'],s,instant(m['startTime'],end.tzinfo).isoformat(),m.get('url',''),content_kind='AI_summary')
            except Exception as e: errors.append(m['taskUuid']+': '+str(e))
        if errors: raise source_state.Incomplete('; '.join(errors),len(found))
        return len(found)
    def messages(items,channel):
        count=0
        for m in items:
            t = m.get('time') or m.get('createTime') or m.get('sendTime')
            if not t: raise n.Error('消息缺时间')
            time=instant(t,end.tzinfo)
            if start <= time < end:
                cid=m.get('conversationId') or m.get('conversation',{}).get('openConversationId','')
                title=m.get('conversation',{}).get('name') or cid
                add('message',m.get('messageId') or m.get('openMessageId'),str(title),m.get('text') or '',time.isoformat(),
                    sender=m.get('sender'), conversation_id=cid, quoted_message=m.get('quotedMessage'))
                count+=1
        return count
    def mentions():
        days=min(3650,max(1,math.ceil((end-start).total_seconds()/86400)+1))
        d=gw.call(['chat','+at-me','--days',str(days),'--page-all','--page-limit','50','--max-items','5000'])
        return messages(complete(d,'items'),'mentions')
    def direct():
        d=gw.call(['chat','+chat-list','--types','p2p','--page-all','--page-limit','50'],partial=True)
        chats=d.get('chats',[])
        errors=[] if d.get('complete') is True else ['会话目录分页未完整；只覆盖已返回会话']
        def read(c):
            try:
                x=gw.call(['chat','+chat-messages','--open-conversation-id',c['openConversationId'],
                           '--start',start.isoformat(),'--end',end.isoformat(),'--page-all','--page-limit','40','--max-items','3000'])
                rows=complete(x,'messages')
                for item in rows: item.setdefault('conversation',{'name':c.get('name',''),'openConversationId':c['openConversationId']})
                return rows,None
            except Exception as e: return [], c.get('name','')+': '+str(e)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            count=0
            for rows,error in pool.map(read,chats):
                count+=messages(rows,'direct')
                if error:errors.append(error)
        if errors:raise source_state.Incomplete('; '.join(errors),count)
        return count
    allowed=set(selection['channels'] if selection else intake.enabled(settings))
    def groups():
        ids=settings.get('group_ids',[])
        if not ids:raise n.Error('尚未选择采集群聊')
        count=0;errors=[]
        for cid in ids:
            try:
                rows=complete(gw.call(['chat','+chat-messages','--open-conversation-id',cid,
                    '--start',start.isoformat(),'--end',end.isoformat(),'--page-all','--page-limit','40','--max-items','3000']),'messages')
                for item in rows:item.setdefault('conversationId',cid)
                count+=messages(rows,'groups')
            except n.Error as exc:errors.append(str(exc))
        if errors:raise source_state.Incomplete('; '.join(errors),count)
        return count
    for name,fn in [('minutes',minutes),('mentions',mentions),('direct',direct),('groups',groups),
                    ('mail',lambda:intake.mail(gw,settings,start,end,add,instant))]:
        if name in allowed:section(name,fn)
    if 'lark_minutes' in allowed:
        section('lark_minutes',lambda:source_state.lark_minutes(settings,start,end,folder,add))
    def sessions():
        count=0
        for directory in settings.get('codex_session_dirs',[]):
            for p in Path(directory).expanduser().rglob('*.jsonl'):
                if p.stat().st_mtime < start.timestamp():continue
                with p.open(encoding='utf-8') as f:
                    for index,line in enumerate(f):
                        try: x=json.loads(line)
                        except ValueError:continue
                        q=x.get('payload',{})
                        if x.get('type')!='response_item' or q.get('role')!='user':continue
                        time=instant(x['timestamp'],end.tzinfo)
                        if not start<=time<end:continue
                        text='\n'.join(c.get('text','') for c in q.get('content',[]) if c.get('type')=='input_text')
                        if text.lstrip().startswith(('<environment_context>','# AGENTS.md','<external_codex_apps_',
                                                     '<heartbeat>','<send_user_message_question_reply>')):continue
                        text = re.sub(r'<in-app-browser-context\b[\s\S]*?</in-app-browser-context>', '', text)
                        add('codex',p.stem+':'+str(x.get('ordinal',index)),p.stem,text,time.isoformat())
                        count+=1
        # Other harnesses export authentic human turns here as JSONL; never replay tools/system text.
        inboxes=list(settings.get('inbox_dirs',[])) if settings.get('sources',{}).get('inbox',True) else []
        if settings.get('sources',{}).get('portal',bool(settings.get('codex_session_dirs'))):inboxes.append(str(r/'portal-conversations'))
        for directory in inboxes:
            for p in Path(directory).expanduser().glob('*.jsonl'):
                with p.open(encoding='utf-8') as source:
                    for line in source:
                        x=json.loads(line)
                        time=instant(x['time'],end.tzinfo)
                        if start<=time<end and x.get('role')=='user':
                            add('harness',x['id'],x['name'],x['text'],time.isoformat());count+=1
        return count
    if 'harness' in allowed:section('harness',sessions)
    def workbench():
        count=0
        for path in (r/'workbench').glob('request-*.json'):
            if not re.fullmatch(r'request-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json',path.name):
                continue
            receipt=n.load(path)
            if receipt.get('status')!='verified' or not receipt.get('finished_at'):continue
            when=instant(receipt['finished_at'],end.tzinfo)
            if not start<=when<end:continue
            request=receipt.get('intent',{}).get('request',{})
            content={'source':'用户在年轮工作台提交的表单操作，已经完成写入，不要重复创建',
                     'input':request,'verified_result':receipt['result']}
            add('workbench',request.get('request_id'),'年轮工作台手动操作',json.dumps(content,ensure_ascii=False),when.isoformat())
            count+=1
        return count
    if 'workbench' in allowed:section('workbench',workbench)
    # Exact known todo IDs enable reverse synchronization after a manual completion.
    registry=n.load(r/'links.json') if (r/'links.json').exists() else {}
    bundle['todo_links']=registry
    for tid,link in registry.items():
        try:
            current_channel='todo:'+tid
            d=gw.call(['todo','+get','--task-id',tid])
            add('todo',tid,d['subject'],json.dumps(d,ensure_ascii=False),end.isoformat(),todo=d)
        except Exception as e:bundle['coverage'].append({'channel':'todo:'+tid,'status':'partial','error':str(e)})
    # Sources returned through overlapping channels are represented once.
    unique={}
    for item in bundle['sources']:
        if item['id'] in unique:item['channels']=sorted(set(item['channels']+unique[item['id']]['channels']))
        unique[item['id']]=item
    bundle['sources']=list(unique.values())
    bundle['since']=min((x['since'] for x in bundle['coverage'] if x.get('since')),default=bundle['since'])
    n.save(folder/'evidence.json',bundle)
    n.save(pending,{'run_dir':str(folder),'run_id':run_id})
    return {'run_dir':str(folder),'run_id':run_id,'sources':len(bundle['sources']),'coverage':bundle['coverage']}


def similar_todos(project,title,todos):
    """Similar text is a stop-for-review signal, never proof that two tasks are identical."""
    def split(value):
        match=re.match(r'^\[([^\]]+)\]\s*(.*)$',value or '')
        return (match[1],match[2]) if match else ('',value or '')
    norm=lambda value:re.sub(r'\s+','',value).casefold()
    body=norm(title);matches=[]
    for todo in todos:
        prefix,other=split(todo.get('subject') or todo.get('title',''))
        if prefix and prefix!=project:continue
        other=norm(other)
        if body and other and (body==other or (min(len(body),len(other))>=8 and SequenceMatcher(None,body,other).ratio()>=0.85)):
            matches.append(todo)
    return matches


def evidence(bundle,a):
    matches=[s for s in bundle['sources'] if s['id']==a.get('source_id')]
    if len(matches)!=1 or not isinstance(a.get('quote'),str) or not a['quote'].strip() or a['quote'] not in matches[0]['text']:
        raise n.Error('动作必须引用本轮来源 ID 与逐字摘录')
    s=matches[0]
    return {'id':s['id'],'name':s['name'],'quote':a['quote'],'url':s.get('url','')}


def project_for(bundle,a):
    return n.select_projects(bundle['tables'],[a.get('project','')])[0]


def validate(config,bundle,decision):
    if decision.get('run_id')!=bundle['run_id'] or bundle['binding']!=n.digest(config):raise n.Error('运行或绑定已变化')
    if not isinstance(decision.get('summary'),str) or not decision['summary'].strip():raise n.Error('缺少本轮行文总结')
    if not isinstance(decision.get('actions'),list) or len(decision['actions'])>100:raise n.Error('动作应为不超过 100 条的数组')
    actions=[];keys=set();refs={}
    if len(decision['summary'])>8000:raise n.Error('本轮总结过长')
    deferred=decision.get('deferred_source_ids',[])
    if not isinstance(deferred,list) or any(i not in {s['id'] for s in bundle['sources']} for i in deferred):raise n.Error('未处理来源 ID 不合法')
    for a in decision['actions']:
        s=evidence(bundle,a); p=project_for(bundle,a); op=a['op']; a=dict(a)
        if a['source_id'] in deferred:raise n.Error('尚未处理的来源不能同时生成写入动作')
        if op in ('create_record','update_status'):
            c={**a,'source':s}
            if op=='update_status':
                role=a['role']; row=next((r for r in bundle['tables'].get(role,[]) if r['id']==a.get('record_id')),None)
                if not row or (role=='projects' and row['id']!=p['id']) or (role!='projects' and p['id'] not in row.get('project_ids',[])):
                    raise n.Error('状态目标不属于指定项目')
                if a.get('match')!='unique':raise n.Error('状态变更必须唯一匹配')
            a['table_plan']=n.plan(config,bundle['tables'],[c])
            if op=='create_record' and not a['table_plan']['actions'][0].get('skip_existing'):
                normalized_title=lambda value:re.sub(r'\s+','',value).casefold()
                duplicates=[r for r in bundle['tables']['records'] if p['id'] in r.get('project_ids',[])
                    and r.get('status') not in ('已解决','已关闭','已取消')
                    and normalized_title(r.get('title',''))==normalized_title(a['title'])]
                duplicates += [x for x in actions if x['op']=='create_record' and x['project']==a['project']
                    and normalized_title(x['title'])==normalized_title(a['title'])]
                if duplicates:raise n.Error('同项目已有同名未关闭记录。复用原记录并核对状态，不重复新增')
        elif op=='create_milestone':
            if not a.get('title') or not a.get('description'):raise n.Error('缺里程碑标题/交付内容')
            datetime.strptime(a['date'],'%Y-%m-%d')
            if a.get('status','待核')!='待核':raise n.Error('自动发现的里程碑初始为待核')
        elif op=='create_todo':
            if a.get('executor')!='self' or not a.get('title'):raise n.Error('只创建明确分配给本人的待办')
            candidates=bundle['todos']+[{'subject':'['+x['project']+'] '+x['title']} for x in actions if x['op']=='create_todo']
            if similar_todos(p['title'],a['title'],candidates):raise n.Error('已有同项目相近待办；请核验后复用或保留待核，未重复创建')
            if a.get('due'):instant(a['due'],datetime.fromisoformat(bundle['until']).tzinfo)
            if a.get('priority',20) not in (10,20,30,40):raise n.Error('待办优先级错误')
            if not isinstance(a.get('record_ids',[]),list):raise n.Error('record_ids 应为数组')
            for rid in a.get('record_ids',[]):
                if not any(r['id']==rid and p['id'] in r.get('project_ids',[]) for r in bundle['tables']['records']):raise n.Error('待办关联记录不存在或跨项目')
            if a.get('record_ref'):
                previous=refs.get(a['record_ref'])
                if not previous or previous['op']!='create_record' or previous['project_id']!=p['id']:raise n.Error('record_ref 必须指向本项目先前的新增记录')
                a['record_action_key']=previous['key']
            if not a.get('record_ids') and not a.get('record_ref'):raise n.Error('待办必须关联项目记录，支持 record_ids 或 record_ref')
        elif op=='complete_todo':
            matches=[t for t in bundle['todos'] if t['taskId']==a.get('task_id')]
            if len(matches)!=1 or a.get('match')!='unique' or a.get('completion')!='explicit':raise n.Error('完成待办必须来自本人未完成列表、唯一匹配和明确完成证据')
            if a.get('expected_title')!=matches[0]['subject']:raise n.Error('待办标题不符')
            same_title=[t for t in bundle['todos'] if re.sub(r'\s','',t['subject'])==re.sub(r'\s','',matches[0]['subject'])]
            if len(same_title)!=1:raise n.Error('本人存在重复标题待办，不能凭消息自动选择其中一项')
            if not a.get('record_ids'):raise n.Error('完成待办需同时指定要同步的项目记录；无对应记录先归集建档')
            for rid in a['record_ids']:
                if not any(r['id']==rid and p['id'] in r.get('project_ids',[]) for r in bundle['tables']['records']):raise n.Error('完成待办的记录关联不正确')
            linked=bundle.get('todo_links',{}).get(a['task_id'])
            if linked and (linked.get('project_id')!=p['id'] or set(a['record_ids'])!=set(linked.get('record_ids',[]))):
                raise n.Error('自动完成目标与已登记的待办项目关系不同，不能改配关联')
        else: raise n.Error('不支持的动作：'+str(op))
        a['project_id']=p['id'];a['source']=s
        a['key']=n.digest({'op':op,'source':s['id'],'project':p['id'],'target':a.get('task_id') or a.get('record_id') or a.get('title')})
        if a['key'] in keys:raise n.Error('重复动作')
        keys.add(a['key']);actions.append(a)
        if a.get('ref'):
            if a['ref'] in refs:raise n.Error('ref 重复')
            refs[a['ref']]=a
    return {'run_id':bundle['run_id'],'binding':n.digest(config),'evidence_hash':n.digest(bundle),'decision':decision,'actions':actions}


def table_write(config,gw,role,cells,record_id=None):
    table=config['tables'][role]['id'];base=config['base_id']
    if record_id:
        gw.call(['aitable','+record-update','--base-id',base,'--table-id',table,'--records',json.dumps([{'recordId':record_id,'cells':cells}],ensure_ascii=False),'--yes'])
    else:
        with __import__('tempfile').TemporaryDirectory() as tmp:
            f=Path(tmp)/'record.json';n.save(f,[{'cells':cells}])
            d=gw.call(['aitable','record','create','--base-id',base,'--table-id',table,'--records-file',str(f),'--yes'])
        ids=d.get('newRecordIds',[])
        if len(ids)!=1:raise n.Error('新增记录的返回 ID 不明确')
        record_id=ids[0]
    d=gw.call(['aitable','+record-query','--base-id',base,'--table-id',table,'--record-ids',record_id])
    rows=d.get('records',[])
    if len(rows)!=1 or rows[0]['recordId']!=record_id or not all(n.equivalent(rows[0]['cells'].get(k),v) for k,v in cells.items()):raise n.Error('表格写后验证不一致')
    return {'record_id':record_id,'verified':True}


def apply(config,folder,plan_file):
    folder=Path(folder); bundle=n.load(folder/'evidence.json'); plan=n.load(plan_file)
    fresh=validate(config,bundle,plan['decision'])
    # Core table plans include their generation clock; target/cells/evidence remain immutable.
    for new,old in zip(fresh['actions'],plan['actions']):
        if 'table_plan' in new and 'table_plan' in old:
            new['table_plan']['created_at']=old['table_plan']['created_at']
    if fresh!=plan:raise n.Error('计划内容变更，请重新生成')
    gw=Gateway(config)
    if self_identity(gw)!=bundle['identity']:raise n.Error('当前组织身份已变化')
    receipt_path=folder/'receipt.json'
    receipt=n.load(receipt_path) if receipt_path.exists() else {'status':'running','results':{},'run_id':bundle['run_id'],'plan_hash':n.digest(plan),'decision_hash':n.digest(plan['decision'])}
    if receipt.get('plan_hash')!=n.digest(plan):raise n.Error('本轮已有执行回执，不允许改计划后混用')
    if receipt.get('in_flight') and not receipt['in_flight'].get('resume_records'):
        raise n.Error('上次写入结果待核验；请到执行记录核验原结果，再继续剩余步骤')
    try:
        for a in plan['actions']:
            key=a['key']
            if key in receipt['results']:continue
            op=a['op']; switch={'create_todo':'todos','complete_todo':'completion'}.get(op,'table_writes')
            if not config['growth']['switches'].get(switch,False):raise n.Error(switch+' 开关关闭，保留候选')
            if op=='create_todo':
                todos=complete(gw.call(['todo','+get-my-tasks','--all','--status','false']),'todos')
                if similar_todos(a['project'],a['title'],todos):
                    raise n.Error('执行前发现同项目相近待办；未提交，请核验是否由其他任务创建')
            if receipt.get('in_flight',{}).get('key')!=key:
                receipt['in_flight']={'key':key,'op':op,'action':a};n.save(receipt_path,receipt)
            if op in ('create_record','update_status'):
                result=n.apply_plan(config,gw.table(),a['table_plan'],folder/(key+'.receipt.json'))
            elif op=='create_milestone':
                f=config['tables']['milestones']['fields']; marker='[年轮来源:'+key+']'
                rows=n.fetch(config,gw.table())['milestones']
                evidence_field='notes' if 'notes' in f else 'description'
                existing=[r for r in rows if marker in r.get(evidence_field,'')]
                same=[r for r in rows if r['title']==a['title'] and a['project_id'] in r['project_ids']]
                values={'title':a['title'],'date':a['date'],'status':'待核','description':a['description'],
                    'project_ids':{'linkedRecordIds':[a['project_id']]}}
                values[evidence_field]=((a['description']+'\n') if evidence_field=='description' else '')+a['quote']+'\n来源：'+a['source_id']+'\n'+marker
                cells={f[k]['fieldId']:v for k,v in values.items()}
                if existing:
                    if len(existing)!=1 or not all(n.equivalent(existing[0]['raw_cells'].get(k),v) for k,v in cells.items()):raise n.Error('里程碑来源重复或内容已变更，请对账')
                    result={'record_id':existing[0]['id'],'already_present':True,'verified':True}
                elif same:raise n.Error('同项目已有同名里程碑，需复核合并')
                else:
                    result=table_write(config,gw,'milestones',cells)
            elif op=='create_todo':
                title='['+a['project']+'] '+a['title']
                args=['todo','task','create','--title',title,'--executors',bundle['identity']['user_id'],'--priority',str(a.get('priority',20))]
                if a.get('due'):args+=['--due',a['due']]
                d=gw.call(args);tid=d.get('result',{}).get('taskId')
                if not tid:raise n.Error('待办创建结果未知')
                receipt['in_flight']['task_id']=tid;n.save(receipt_path,receipt)
                check=gw.call(['todo','+get','--task-id',str(tid)])
                if str(check.get('taskId'))!=str(tid) or check.get('subject')!=title or check.get('isDone') is not False:raise n.Error('待办回读不符')
                result={'task_id':str(tid),'title':title,'verified':True}
                lp=root(config)/'links.json';links=n.load(lp) if lp.exists() else {}
                record_ids=list(a.get('record_ids',[]))
                if a.get('record_action_key'):
                    record_ids += [x['record_id'] for x in receipt['results'][a['record_action_key']]['results']]
                links[str(tid)]={'project_id':a['project_id'],'record_ids':record_ids,'source_id':a['source_id'],'title':title}
                n.save(lp,links)
            elif op=='complete_todo':
                tid=a['task_id'];d=gw.call(['todo','+get','--task-id',tid])
                already_done=d.get('isDone') is True
                if receipt['in_flight'].get('resume_records') and not already_done:raise n.Error('原待办完成状态又发生变化，未再次关闭；请核验')
                if d.get('subject')!=a['expected_title']:raise n.Error('待办标题发生变化')
                if not d.get('isDone'):
                    current=complete(gw.call(['todo','+get-my-tasks','--all','--status','false']),'todos')
                    if not any(t['taskId']==tid for t in current):raise n.Error('待办不在本人未完成列表')
                    gw.call(['todo','+complete','--task-id',tid,'--yes'])
                check=gw.call(['todo','+get','--task-id',tid])
                if check.get('isDone') is not True:raise n.Error('待办未验证为完成')
                receipt['in_flight']['todo_verified']=True;n.save(receipt_path,receipt)
                # Both operations remain visible if the second sink fails.
                result={'task_id':tid,'record_ids':[],'verified':True,'already_done':already_done}
                for rid in a['record_ids']:
                    c={'op':'update_status','role':'records','record_id':rid,'status':'已解决'}
                    pp=folder/(key+'-'+rid+'.plan.json')
                    p=n.load(pp) if pp.exists() else n.plan(config,bundle['tables'],[c])
                    if not pp.exists():n.save(pp,p)
                    n.apply_plan(config,gw.table(),p,folder/(key+'-'+rid+'.json'))
                    result['record_ids'].append(rid)
            receipt['results'][key]=result;receipt.pop('in_flight');n.save(receipt_path,receipt)
        receipt['status']='verified';n.save(receipt_path,receipt)
    except Exception as e:
        receipt.update(status='stopped',error=str(e));n.save(receipt_path,receipt);raise
    return receipt


def brain_context(config,query,out):
    import memory
    result=memory.retrieve(config,query)
    n.save(out,result['text'] if result['matched'] else 'No results.')
    return {'context_file':str(Path(out).resolve()),'query':query}


def execution_result(plan,receipt):
    counts={'records_created':0,'milestones_created':0,'statuses_updated':0,
            'todos_created':0,'todos_completed':0,'reused':0,'verified_actions':0}
    titles=[]
    for action in plan.get('actions',[]):
        result=receipt.get('results',{}).get(action['key'])
        if result is None:continue
        counts['verified_actions']+=1;op=action['op']
        if op in ('create_record','update_status'):
            for row in result.get('results',[]):
                if row.get('status')=='created':counts['records_created']+=1
                elif row.get('status')=='updated':counts['statuses_updated']+=1
                elif row.get('status') in ('already_present','already_applied'):counts['reused']+=1
        elif op=='create_milestone':counts['reused' if result.get('already_present') else 'milestones_created']+=1
        elif op=='create_todo':
            counts['todos_created']+=1;titles.append(result['title'])
        elif op=='complete_todo':
            counts['reused' if result.get('already_done') else 'todos_completed']+=1
    counts['todo_titles']=titles
    return counts


def execution_text(counts):
    text=('已核验：新增记录 {records_created} 条、里程碑 {milestones_created} 项、待办 {todos_created} 条；'
            '完成待办 {todos_completed} 条，直接更新状态 {statuses_updated} 项；复用既有结果 {reused} 项。').format(**counts)
    if counts.get('planned') or counts.get('reports'):
        text+='倒排新增或调整 '+str(counts.get('planned',0))+' 个节点，生成 '+str(counts.get('reports',0))+' 份汇报。'
    return text


def finish(config,folder,decision_file):
    folder=Path(folder).expanduser().resolve();b=n.load(folder/'evidence.json');d=n.load(decision_file)
    validate(config,b,d)
    receipt=n.load(folder/'receipt.json') if (folder/'receipt.json').exists() else {}
    if d['actions'] and (receipt.get('status')!='verified' or receipt.get('decision_hash')!=n.digest(d)):
        raise n.Error('动作尚未全部验证或总结与执行计划不一致，不能完成本轮')
    status_path=folder/'finish.json';status=n.load(status_path) if status_path.exists() else {}
    if status.get('in_flight'):raise n.Error('完成步骤存在未知结果，先对账，不重复执行')
    gw=Gateway(config)
    if self_identity(gw)!=b['identity']:raise n.Error('组织身份发生变化')
    if status.get('decision_hash') and status['decision_hash']!=n.digest(d):raise n.Error('摘要已变化，不重发')
    status['decision_hash']=n.digest(d)
    partial=[x for x in b['coverage'] if x['status']!='complete']
    plan=n.load(folder/'plan.json') if (folder/'plan.json').exists() else {'actions':[]}
    counts=execution_result(plan,receipt)
    post=n.load(folder/'postprocess.json') if (folder/'postprocess.json').exists() else {}
    if post:
        counts['planned']=sum(len(p['changed']) for p in post.get('planning',{}).get('projects',[]))
        counts['reports']=sum(not r.get('already_present') for r in post.get('reports',[]))
    status['execution']=counts
    text='# 年轮 · 生长记录\n\n'+b['since']+' 至 '+b['until']+'\n\n## 执行结果（写后回读）\n\n'+execution_text(counts)
    text+='\n\n## 项目研判（写入前生成，不作为执行回执）\n\n'+d['summary']
    if d.get('pending'):text+='\n\n待确认：\n'+'\n'.join('- '+str(x) for x in d['pending'])
    if post.get('planning',{}).get('pending'):text+='\n\n倒排所需信息：\n'+'\n'.join(post['planning']['pending'])
    if post.get('reports'):text+='\n\n自动阶段汇报：\n'+'\n'.join(r['url'] for r in post['reports'])
    text+='\n\n采集覆盖：\n'+'\n'.join('- '+source_state.LABELS.get(x['channel'],'待办回读')+'：'+('完整' if x['status']=='complete' else '部分覆盖')+('；'+x['error'] if x.get('error') else '') for x in b['coverage'])
    text+='\n\n[项目工作台]('+config['base_url']+')\n\n本轮新增或变更来源：'+str(len(b['sources']))+' 条；完整证据与动作回执保存在本地运行目录。'
    # Preserve the exact body used by a partially delivered legacy run across an upgrade/retry.
    summary_path=folder/'summary.md'
    if summary_path.exists() and (status.get('brain') or status.get('digest')):text=summary_path.read_text(encoding='utf-8')
    else:n.save(summary_path,text)
    switches=config['growth']['switches']
    notice_path=root(config)/'notice.json';previous_notice=n.load(notice_path) if notice_path.exists() else {}
    signature=n.digest({'pending':d.get('pending',[])+post.get('planning',{}).get('pending',[]),'gaps':[{'channel':x['channel'],'error':x.get('error')} for x in partial]})
    actual=sum(counts.get(key,0) for key in ('records_created','milestones_created','statuses_updated','todos_created','todos_completed','planned','reports'))
    changed=actual>0 or signature!=previous_notice.get('signature',n.digest({'pending':[],'gaps':[]}))
    notify=config['growth'].get('notification_mode','every_run')=='every_run' or changed
    if switches.get('gbrain') and not status.get('brain'):
        slug='meetings/nianlun-'+b['run_id'];brain=Path(config['growth']['brain_dir'])
        content='---\ntitle: 年轮生长记录 '+b['run_id']+'\ntags: [nianlun, project-memory]\n---\n\n'+text+'\n\n## 相关记录\n\n项目来源与 AI 表格链接见上。\n'
        # Managed GBrain worktrees must be mutated through the native capture command.
        # Stage the source outside the canonical worktree; capture owns files, index and revision.
        path=folder/'brain-page.md'
        n.save(path,content)
        request_id=str(uuid.uuid5(uuid.NAMESPACE_URL,'nianlun-capture:'+b['run_id']))
        status['in_flight']={'step':'brain','slug':slug,'source_file':str(path),'request_id':request_id};n.save(status_path,status)
        r=subprocess.run(n.brain_command(config)+['capture','--file',str(path),'--slug',slug,'--request-id',request_id,'--json'],env=n.brain_env(config),cwd=brain,capture_output=True,text=True, encoding='utf-8',timeout=240)
        n.save(folder/'brain-capture.json',r.stdout)
        if r.returncode:raise n.Error('独立记忆空间原生 capture 未确认；保留来源与 request_id 供对账')
        check=subprocess.run(n.brain_command(config)+['get',slug],env=n.brain_env(config),cwd=brain,capture_output=True,text=True, encoding='utf-8',timeout=120)
        if check.returncode or d['summary'] not in check.stdout:raise n.Error('独立记忆空间回读未验证')
        status['brain']={'slug':slug,'verified':True};status.pop('in_flight');n.save(status_path,status)
    if switches.get('digest') and notify and not status.get('digest'):
        if len(text)>14000:raise n.Error('推送内容过长，请在执行动作之前缩短总结')
        status['in_flight']={'step':'digest','idempotency_key':str(uuid.uuid5(uuid.NAMESPACE_URL,'nianlun-digest:'+b['run_id']))};n.save(status_path,status)
        send=gw.call(['chat','+messages-send','--user',b['identity']['user_id'],'--text',text,
                      '--idempotency-key',status['in_flight']['idempotency_key'],'--yes'])
        status['digest']={'receipt':send,'status':'submitted'};status.pop('in_flight');n.save(status_path,status)
    if status.get('digest',{}).get('status')=='submitted':
        send=status['digest']['receipt']
        task=send.get('sendReceipt',{}).get('openTaskId')
        if task:
            delivery=gw.call(['chat','+messages-query-send-status','--open-task-id',task])
            status['digest']['delivery']=delivery
            if delivery.get('result',{}).get('sendStatus')=='SUCCESS':status['digest']['status']='delivered'
            else:raise n.Error('钉钉摘要已提交，但投递结果未确认；保留发送句柄，不重复发')
            n.save(status_path,status)
    selected=b.get('selection',{}).get('project_ids',[])
    seen_path=root(config)/'scopes'/(n.digest(selected)+'.json') if selected else root(config)/'seen.json'
    seen=n.load(seen_path) if seen_path.exists() else {}
    for s in b['sources']:
        if s['id'] not in d.get('deferred_source_ids',[]):seen[s['id']]=s['version']
    n.save(seen_path,seen)
    # Incomplete sources retain their window for the next run; don't silently drop missing pages.
    checkpoint=root(config)/'checkpoint.json'
    if not b.get('manual'):
        n.save(checkpoint,source_state.advance(b,d,n.load(checkpoint) if checkpoint.exists() else {}))
    health_path=root(config)/'source-health.json'
    n.save(health_path,source_state.health(b,n.load(health_path) if health_path.exists() else {}))
    n.save(notice_path,{'signature':signature,'run_id':b['run_id']})
    status['notify']=notify
    status.update(status='partial' if partial else 'complete',finished_at=n.stamp(config));n.save(status_path,status)
    n.build_home(n.fetch(config,gw.table()),config['growth']['home_output'],config)
    (root(config)/'active.json').unlink(missing_ok=True)
    return status


def uploaded_node(value):
    if isinstance(value,dict):
        if (value.get('nodeId') or value.get('fileId')) and (value.get('url') or value.get('docUrl')):return value
        for child in value.values():
            hit=uploaded_node(child)
            if hit:return hit
    return None


def reconcile_report_upload(config,gw,folder,receipt):
    source=folder/receipt['in_flight']['file']
    if source.parent!=folder or not source.is_file():raise n.Error('报告本地原件不可用，不能自动对账')
    listing=gw.call(['drive','+list','--folder',config['growth']['report_folder'],'--page-all','--max-pages','20','--max-items','500'])
    if listing.get('hasMore') is not False or listing.get('complete') is False or listing.get('truncated') or not isinstance(listing.get('files'),list):
        raise n.Error('报告文件夹尚未完整读取，上传结果继续保留为待核验')
    pattern=re.compile(re.escape(source.stem)+r'(?:\(\d+\))?'+re.escape(source.suffix)+r'$')
    candidates=[x for x in listing['files'] if pattern.fullmatch(x.get('name','')) and x.get('fileSize')==source.stat().st_size and x.get('nodeId')]
    if len(candidates)>10:raise n.Error('同名报告候选过多，未自动选择')
    expected=hashlib.sha256(source.read_bytes()).hexdigest();matches=[]
    for item in candidates:
        output='reconcile-'+uuid.uuid4().hex+source.suffix
        gw.call(['drive','+download','--node',item['nodeId'],'--output',output],cwd=folder)
        downloaded=folder/output
        if not downloaded.is_file() or hashlib.sha256(downloaded.read_bytes()).hexdigest()!=expected:continue
        metadata=gw.call(['drive','+inspect','--node',item['nodeId']]);node=uploaded_node(metadata)
        if node and (node.get('nodeId') or node.get('fileId'))==item['nodeId']:
            matches.append({'node_id':item['nodeId'],'url':node.get('url') or node['docUrl'],
                'reconciliation':{'sha256':expected,'remote_name':item['name'],'verified_at':n.stamp(config)}})
    if len(matches)!=1:raise n.Error('报告上传结果无法唯一核验，未再次上传，请检查原回执')
    receipt.update(matches[0]);receipt.pop('in_flight');n.save(folder/'receipt.json',receipt)
    return receipt


def publish_report(config,project,since,until,summary_file=None,expected_facts=None,report_method=None,memory_sources=None):
    from render_report import render
    from planning import evidence
    gw=Gateway(config);self_identity(gw);state=n.fetch(config,gw.table());p=n.select_projects(state,[project])[0]
    if not state['complete']:raise n.Error('表格读取不完整，未发布汇报')
    if expected_facts is not None and n.digest(evidence(state,p['id']))!=expected_facts:
        raise n.Error('生成期间项目事实已变化，请重新生成本期汇报')
    if not config['growth']['switches'].get('reports'):raise n.Error('阶段汇报开关关闭')
    date=datetime.strptime(until,'%Y-%m-%d');datetime.strptime(since,'%Y-%m-%d')
    if since>until:raise n.Error('时间范围错误')
    summary=Path(summary_file).read_text(encoding='utf-8') if summary_file else ''
    html,md,_=render(state,[p],since,until,'年轮 · 阶段性汇报',summary)
    if memory_sources:
        md=md.replace('数据源：钉钉 AI 表格。','数据源：钉钉 AI 表格与独立记忆空间。')
        md+='\n\n## 独立记忆空间依据\n\n'+'\n'.join('- '+x['title']+' · '+x['slug']+('（全文）' if x.get('full_page') else '（部分内容）') for x in memory_sources)
        from html import escape
        html=html.replace('</header>','<p>另结合独立记忆空间的 '+str(len(memory_sources))+' 篇相关页面；命中范围并非全部历史。</p><ul>'+''.join('<li>'+escape(x['title']+' · '+x['slug'])+'</li>' for x in memory_sources)+'</ul></header>')
    key=n.digest({'project':p['id'],'since':since,'until':until,'summary':summary,'facts':evidence(state,p['id']),
        **({'method':report_method.get('name')} if report_method else {})})[:16]
    folder=root(config)/'reports'/key;folder.mkdir(parents=True,exist_ok=True)
    receipt_file=folder/'receipt.json';receipt=n.load(receipt_file) if receipt_file.exists() else {}
    if receipt.get('status')=='verified':return {**receipt,'report_id':key,'already_present':True}
    if receipt.get('in_flight'):
        if receipt['in_flight'].get('step')!='upload':raise n.Error('报告存在待核验步骤')
        receipt=reconcile_report_upload(config,gw,folder,receipt)
    if 'previous_link' not in receipt:
        receipt['previous_link']=p.get('report');n.save(receipt_file,receipt)
    safe=re.sub(r'[^\w\u4e00-\u9fff-]','-',p['title']);filename='阶段性汇报-'+safe+'-'+until+'-'+key[:8]+'.html'
    if report_method and not receipt.get('node_id'):
        import report_style
        html=report_style.render(report_method,md,folder,p['title']+' · 阶段汇报')
    n.save(folder/filename,html);n.save(folder/Path(filename).with_suffix('.md'),md)
    if not receipt.get('node_id'):
        receipt['in_flight']={'step':'upload','file':filename};n.save(receipt_file,receipt)
        try:d=gw.call(['drive','+upload','--file',filename,'--folder',config['growth']['report_folder'],'--yes'],cwd=folder)
        except n.Error:
            receipt=reconcile_report_upload(config,gw,folder,receipt);d={'reconciled':True,'nodeId':receipt['node_id'],'url':receipt['url']}
        # Keep the full verified shortcut receipt; require a returned server URL rather than inventing one.
        n.save(folder/'upload.json',d)
        item=uploaded_node(d)
        if not item:raise n.Error('上传返回未包含可核验的节点与链接，保留回执待对账')
        receipt.update(node_id=item.get('nodeId') or item['fileId'],url=item.get('url') or item['docUrl']);receipt.pop('in_flight',None);n.save(receipt_file,receipt)
    current=n.fetch(config,gw.table());now=next(x for x in current['projects'] if x['id']==p['id'])
    if now.get('report') not in (receipt['previous_link'],receipt['url']):raise n.Error('主表汇报链接被其他人更新')
    f=config['tables']['projects']['fields']['report']['fieldId']
    table_write(config,gw,'projects',{f:receipt['url']},p['id'])
    receipt.update(status='verified',project_id=p['id'],report_id=key);n.save(receipt_file,receipt)
    return receipt


def main():
    p=argparse.ArgumentParser(description='年轮生长闭环：Harness 理解，DWS 执行，独立记忆空间记忆')
    p.add_argument('--config',default=os.environ.get('NIANLUN_CONFIG',str(Path.home()/'.config/nianlun/config.json')))
    sub=p.add_subparsers(dest='cmd',required=True)
    c=sub.add_parser('collect');c.add_argument('--since');c.add_argument('--until')
    c=sub.add_parser('context');c.add_argument('--query',required=True);c.add_argument('--out',required=True)
    c=sub.add_parser('plan');c.add_argument('--run-dir',required=True);c.add_argument('--decision',required=True)
    c=sub.add_parser('apply');c.add_argument('--run-dir',required=True);c.add_argument('--plan',required=True);c.add_argument('--yes',action='store_true')
    c=sub.add_parser('finish');c.add_argument('--run-dir',required=True);c.add_argument('--decision',required=True);c.add_argument('--yes',action='store_true')
    c=sub.add_parser('report');c.add_argument('--project',required=True);c.add_argument('--since',required=True);c.add_argument('--until',required=True);c.add_argument('--summary-file');c.add_argument('--yes',action='store_true')
    a=p.parse_args()
    try:
        config=n.load(a.config)
        with locked(config):
            if a.cmd=='collect':result=collect(config,a.since,a.until)
            elif a.cmd=='context':result=brain_context(config,a.query,a.out)
            elif a.cmd=='plan':
                folder=Path(a.run_dir);result=validate(config,n.load(folder/'evidence.json'),n.load(a.decision));n.save(folder/'plan.json',result)
                result={'plan':str(folder/'plan.json'),'actions':len(result['actions']),'remote_mutations':0}
            else:
                if not a.yes:raise n.Error('写入需 --yes；仅用于用户已授权的年轮闭环')
                if a.cmd=='apply':result=apply(config,a.run_dir,a.plan)
                elif a.cmd=='finish':result=finish(config,a.run_dir,a.decision)
                elif a.cmd=='report':result=publish_report(config,a.project,a.since,a.until,a.summary_file)
        print(json.dumps(result,ensure_ascii=False,indent=2));return 0
    except Exception as e:
        print(json.dumps({'ok':False,'error':str(e)},ensure_ascii=False),file=sys.stderr);return 1

if __name__=='__main__':sys.exit(main())
