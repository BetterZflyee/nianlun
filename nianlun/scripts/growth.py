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
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from difflib import SequenceMatcher
import nianlun as n
import source_state
import intake
import dws_transport
from file_lock import file_lock

# 只读调用的重试预算。DWS 偶发空结果不应终止整轮，但也不能无限重试掩盖真故障。
# 5 次 + 指数退避合计约 39 秒，能覆盖实测里持续几十秒的连接中断
# （14:00 与 16:00 两轮就是三次重试都撞在同一段断网里而整轮作废）。
READ_RETRIES = 5
# 退避秒数可被测试覆盖（设为 0），生产用真实等待避免把服务瞬间打满。
RETRY_BACKOFF = float(os.environ.get('NIANLUN_RETRY_BACKOFF') or 1.5)
# 这些是瞬时故障，重试有意义；登录失效、程序缺失等确定性错误重试也没用。
RETRYABLE_HINTS = ('未返回有效结果','读取超时','连接钉钉服务超时','DWS 失败或部分成功')


def _retryable(exc):
    text = str(exc)
    if any(hint in text for hint in RETRYABLE_HINTS):
        # 登录失效属于确定性错误：重试只会重复失败，应当立刻提示用户重新登录。
        return '登录已失效' not in text and '重新登录' not in text
    return False


class Gateway:
    def __init__(self, config):
        self.config = config
    def call(self, args, cwd=None, partial=False):
        # 只读调用允许有限次退避重试：DWS 偶发「未返回有效结果」会把整轮作废
        # （历史 10 次失败都发生在会话第一句身份核验上）。写操作绝不重试——
        # 结果未知时重发可能重复建记录、重复发消息，必须留给人工对账。
        attempts = 1 if dws_transport.is_write(args) else READ_RETRIES
        last = None
        for attempt in range(attempts):
            try:
                return self._call_once(args, cwd, partial)
            except n.Error as exc:
                last = exc
                if attempt == attempts - 1 or not _retryable(exc):
                    raise
                # 指数退避（1×、3×、7× 基数）。线性 1.5/3 秒加起来才 4.5 秒，
                # 网络抖动往往持续更久——实测 14:00 与 16:00 两轮就是因为退避太短、
                # 三次都撞在同一段断网里而整轮作废。
                time.sleep(RETRY_BACKOFF * (2 ** (attempt + 1) - 1))
        raise last

    def _call_once(self, args, cwd, partial):
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
    try:
        with file_lock(r / 'growth.lock'):
            yield
    except n.Error as exc:
        if '已有年轮操作正在运行' not in str(exc):
            raise
        # 撞锁时原话只有「已有年轮操作正在运行，请稍后重试」——用户会以为坏了
        # （2026-11-16 飞哥：「年轮的任务老是执行不了」）。其实这多半是 12:00
        # 定时轮还在跑，手动点「生长一次」撞上——这是**防止重复写入的保护**，
        # 不是故障。把「谁在跑、跑到哪一步」读出来，人才敢等而不是反复猛点。
        raise n.Error(str(exc) + _lock_holder_hint(r)) from exc


def _lock_holder_hint(r):
    active = r / 'active.json'
    try:
        if not active.exists():
            return ''
        a = n.load(active)
        run_dir = Path(a.get('run_dir') or '')
        step = '正在采集/推理'
        if run_dir.exists():
            names = set(p.name for p in run_dir.iterdir())
            for key, label in (('receipt.json', '正在写表格'),
                               ('postprocess.json', '正在生成报告与记忆'),
                               ('decision.json', '决策已生成，正在核验写入'),
                               ('memory-0.txt', '正在检索记忆')):
                if key in names:
                    step = label
                    break
        # 完整 run_id 是 `%Y%m%d-%H%M%S`+8 位 hash 共 23 字符；截到 14 会把秒吃掉
        # （实测显示成 20261116-12000，用户拿它去执行记录里搜不到）。保留全量。
        run_id = str(a.get('run_id') or '')[:23]
        return f'（当前有一轮在跑：{run_id}，{step}。这是防止重复写入的保护，不是故障——等它跑完再点即可，定时轮会自动继续。）'
    except (OSError, ValueError):
        return ''


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


def prune_runs(state_root, settings, keep_days=None, keep_completed=None):
    """Drop old run directories so evidence does not accumulate forever.

    每次生长都留一份完整证据（含 sources 原文），单个 run 可达数 MB。没有清理时
    状态目录会无限制增长（实测 178 个 run 已占 179MB，其中 evidence.json 占 133MB）。

    保守策略：
    - 已完成（有 finish.json 或 receipt.json）的 run 保留最近 keep_completed 个；
    - 未完成的 run 只在超过 keep_days 天且不在 active 指针上时才删；
    - 当前 active.json 指向的 run 永远保留，避免删掉正在恢复的任务。
    返回被删除的目录数与释放的字节数。
    """
    import shutil
    runs = Path(state_root) / 'runs'
    if not runs.is_dir():
        return {'removed': 0, 'freed': 0}
    keep_days = float(keep_days if keep_days is not None else settings.get('keep_run_days', 7))
    keep_completed = int(keep_completed if keep_completed is not None else settings.get('keep_completed_runs', 20))
    active_dir = None
    pointer = Path(state_root) / 'active.json'
    if pointer.exists():
        try:
            active_dir = Path(n.load(pointer).get('run_dir') or '').resolve()
        except Exception:
            active_dir = None
    now = datetime.now(timezone.utc)
    completed, pending = [], []
    for entry in runs.iterdir():
        if not entry.is_dir():
            continue
        if active_dir and entry.resolve() == active_dir:
            continue
        try:
            started = datetime.strptime(entry.name[:15], '%Y%m%d-%H%M%S').replace(
                tzinfo=timezone(timedelta(hours=float(settings.get('utc_offset_hours', 8)))))
        except ValueError:
            # 名字不合规的目录不猜，交给人工处理。
            continue
        done = (entry / 'finish.json').exists() or (entry / 'receipt.json').exists()
        (completed if done else pending).append((started, entry))
    completed.sort(reverse=True)
    removed = 0
    freed = 0
    def drop(target):
        nonlocal removed, freed
        try:
            size = sum(f.stat().st_size for f in target.rglob('*') if f.is_file())
            shutil.rmtree(target)
            removed += 1; freed += size
        except OSError:
            pass
    for _, entry in completed[keep_completed:]:
        drop(entry)
    cutoff = now - timedelta(days=keep_days)
    for started, entry in pending:
        if started < cutoff:
            drop(entry)
    return {'removed': removed, 'freed': freed}


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
    # 清理是副作用，不该让采集失败：磁盘满、权限、并发占用都可能抛错，
    # 但这一轮的业务价值远高于腾空间，失败留到下次即可。
    try:
        prune_runs(r, settings)
    except Exception as exc:
        progress('清理旧运行目录失败，已跳过：'+str(exc)[:120])
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
    # 已归档记录是历史，不参与本轮理解与写入：既避免 evidence 膨胀，
    # 也避免模型把上个月已办结的事项当成新进展重复处理。
    bundle['tables']['records'] = [
        r for r in bundle['tables'].get('records', [])
        if str(r.get('status') or '').strip() != '已归档']
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
                    ('mail',lambda:intake.mail(gw,settings,start,end,add,instant,progress))]:
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
            # ⚠️ **绝不把 `input` 传给模型。**
            # `input` 里是 `{"op":"complete_todo","task_id":"59017182180",...}` ——
            # 一份完整的可执行动作参数。2026-11-16 12:20 那轮就栽在这里：
            # 模型看到来源里写着 complete_todo + 真实 task_id，而 `todos` 可用列表里
            # 又没有这条（它已完成），只能推断「该关它」，于是照抄参数生成动作，
            # 一执行就被「待办不在本人未完成列表」拒绝，整轮作废。
            # 同一批来源 13:00 那轮一个动作没提——两轮都读懂了「已完成」，
            # 差别只是**没有任何规则告诉它看懂了之后不要动手**。
            # 所以修法不是拦 ID（ID 是真的），是**不给它可执行的形状**：
            # 只陈述事实。原始回执留在 request-*.json / receipt.json 里，
            # 需要追溯时从磁盘查，不必进 prompt。
            title=str(request.get('title') or '').strip()
            verb={'complete_todo':'完成','update_status':'更新','create_record':'创建记录',
                  'create_todo':'建待办'}.get(str(request.get('op') or ''),'处理')
            content={'source':f'本人已于 {receipt["finished_at"]} 在年轮工作台{verb}'
                               + (f'「{title}」' if title else '一项操作')
                               + '。这是**已完成的事实记录**，不是待办任务，无需再处理、不要重复创建。'}
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
            # 和 workbench 同一个坑：`todo +get` 的完整返回里带 taskId、
            # activities(`task.done`) 这些**可执行形状**，模型会照着拼动作。
            # 已完成（isDone=True）的只陈述事实，不暴露编号与活动流水；
            # 未完成的才原样给，因为它确实还需要处理。
            if d.get('isDone') is True:
                content={'source':f'待办「{d.get("subject","")}」已完成，这是事实记录，'
                                   '不是待办任务，不得据此生成任何执行动作。',
                         'isDone':True}
            else:
                content=d
            add('todo',tid,d['subject'],json.dumps(content,ensure_ascii=False),end.isoformat(),todo=d)
        except Exception as e:bundle['coverage'].append({'channel':'todo:'+tid,'status':'partial','error':str(e)})
    # Sources returned through overlapping channels are represented once.
    unique={}
    for item in bundle['sources']:
        if item['id'] in unique:item['channels']=sorted(set(item['channels']+unique[item['id']]['channels']))
        unique[item['id']]=item
    bundle['sources']=list(unique.values())
    # 里程碑同样分配短引用（m1、m2…）。理由和来源 ref 完全一样：真实 ID 是 10 字符
    # 随机串，准入规则要求模型给记录挂 milestone_ids，让模型逐字抄 ID 就会重演
    # 「抄错→整轮作废」。挂接在计划里只允许填这些短引用（validate 解析）。
    # 只给 milestones 分配 m1…；records **故意不分配 ref**——
    # trim_evidence 会把 records 按日期重排取最近 60 条，bundle 与提示词里的
    # 编号必然错位（同「裁剪破坏 evidence_hash」一个坑）。milestones 不被裁剪，安全。
    for index, item in enumerate(bundle['tables'].get('milestones') or [], 1):
        item['ref'] = 'm' + str(index)
    bundle['sources']=list(unique.values())
    # 给每个来源分配短引用 S1、S2……
    # 真实 ID 形如 minutes:763275696435…，平均 36 字符的十六进制串。
    # 要求模型「逐字复述」它，它必然偶尔抄错中段——实测 11-13/11-14 连续多轮
    # 失败在「未处理来源 ID 不合法」：模型抄的 deferred ID 与真实 ID 公共前缀
    # 只有 21/62 字符，中段全错，整轮作废。
    # 让模型只复述 2-4 字符的 S12，抄错概率几乎归零；解析逻辑集中在 resolve_source。
    for index, item in enumerate(bundle['sources'], 1):
        item['ref'] = 'S' + str(index)
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


REVIEW_MARKER = '\n[年轮待复核：未关联里程碑]'
CONTACT_NOTE = '\n[年轮对接人：取自所挂里程碑的交付负责人 R，若不对请直接修改]'


def _milestone_owner_users(value):
    """把里程碑 r_owner 归一成 [{corpId?,userId}...]；认不出返回 []。

    ⚠️ 同一字段有两种真实形态：DWS 原始返回是 list[dict]，
    n.normalized 之后变成 **字符串化的 repr**（"[{'corpId':…}…]"）。
    validate 拿到的 bundle 是 normalized 后的——只按 list 判断会**永远**
    静默失配（2026-11-15 实测踩中：条件全对，类型全错，推导 0 命中）。
    """
    import ast as _ast
    rows = value
    if isinstance(rows, str):
        text = rows.strip()
        if not text.startswith('['):
            return []
        try:
            rows = _ast.literal_eval(text)
        except (ValueError, SyntaxError):
            return []
    if not isinstance(rows, list):
        return []
    return [x for x in rows if isinstance(x, dict) and x.get('userId')]


def resolve_row_ref(bundle, role, given):
    """按短引用（m1/r1…）或真实 ID 在表里找**唯一**一行，找不到返回 None。

    准入规则要求模型给记录挂 milestone_ids，可真实 ID 是 10 字符随机串——
    让模型逐字抄，就会重演 deferred 长 ID「抄错一个字符、整轮作废」。
    所以 collect 给里程碑/记录也分配了 m1、r1 短引用，这里统一解析。
    与 resolve_source 同原则：只做确定性变换 + 唯一命中，绝不做模糊匹配。
    """
    rows = (bundle.get('tables') or {}).get(role) or []
    if not isinstance(given, str) or not given.strip():
        return None
    key = given.strip()
    exact = [x for x in rows if x.get('ref') == key] or [x for x in rows if x.get('id') == key]
    return exact[0] if len(exact) == 1 else None


def resolve_source(bundle, given):
    """Find the one source the model meant, tolerating a dropped base64 pad.

    钉钉的 source id 形如 message:msgtYQZ...==，末尾的 == 是 base64 填充。
    模型引用时经常把它截掉（实测整轮失败就是这么来的），而 payload 本身完全正确。
    只按「补回 ==」这一种确定性变换匹配，不做模糊匹配——否则会把不同消息认成同一来源。
    """
    sources = bundle['sources']
    if not isinstance(given, str) or not given.strip():
        return None
    # 新格式：短引用 S1、S2……（ref 是 collect 分配的，稳定且极短）
    ref = [x for x in sources if x.get('ref') == given]
    if len(ref) == 1:
        return ref[0]
    if ref:
        return None
    exact = [s for s in sources if s['id'] == given]
    if len(exact) == 1:
        return exact[0]
    if exact:
        return None
    # 只接受两类**确定性变换**（不是模糊匹配，否则会把不同消息认成同一来源）：
    # ①末尾填充符差异——模型常把 == 写成 = 或干脆省掉；
    # ②省略渠道前缀——实测 2026-11-14 22:00 轮，模型三次重试的 deferred 都是
    #   裸十六进制串（`7632756964…`），整段 `minutes:` 前缀都没写。
    # 都要求**唯一命中**，歧义即放弃。
    stripped = given.rstrip('=')
    candidates = [s for s in sources if s['id'].rstrip('=') == stripped]
    if len(candidates) == 1:
        return candidates[0]
    if ':' in given:
        return None
    bare = [s for s in sources if s['id'].split(':', 1)[1].rstrip('=') == stripped]
    return bare[0] if len(bare) == 1 else None

def evidence(bundle,a):
    match=resolve_source(bundle,a.get('source_id'))
    if match is None or not isinstance(a.get('quote'),str) or not a['quote'].strip() or a['quote'] not in match['text']:
        raise n.Error('动作必须引用本轮来源 ID 与逐字摘录')
    s=match
    return {'id':s['id'],'name':s['name'],'quote':a['quote'],'url':s.get('url','')}


def project_for(bundle,a):
    name = str(a.get('project') or '').strip()
    if name:
        return n.select_projects(bundle['tables'],[name])[0]
    # project 缺失时按动作里已有的关联对象**反推**项目，而不是直接抛
    # 「项目「」需唯一匹配，当前 0 项」。
    #
    # 2026-11-16 12:20 轮整轮失败的直接原因就是这个裸报错：契约只要求
    # complete_todo 填 task_id/record_ids/match/completion，**从没要求填 project**，
    # 但 validate 对所有 op 无条件调 project_for → 空名匹配 0 项 → 抛错 →
    # 三次重试（fix1/fix2）全在同一处撞死。契约与实现不一致，错的是实现。
    # 反推比要求模型多填一个字段更可靠：record_ids 本来就必须填且已被校验。
    inferred = _infer_project(bundle,a)
    if inferred:
        return inferred
    raise n.Error('动作' + str(a.get('op') or '') + '无法确定项目：请填 project（项目主表中的准确名称），'
                  '或给出**同属一个项目**的 record_ids/milestone_ids/record_id；'
                  '确实无法归属时把这个事项放进 pending 并说明原因，不要留空')


def _record_matches_todo(bundle,record_id,todo_subject):
    """这条记录与待办说的是不是同一件事？确定性的字面判定，纯函数。

    为什么需要它：「record_ids 只要同项目」等于没校验。实测项目
    3cffHOuyfg 有 **157 条记录**，任取一条都能通过——2026-11-16 复现：
    拿「安排倒车辅助激光雷达方案评审会议」关掉了
    「联系李岳天确认和记场地编码及机器狗需求范围」，用户完全看不见。
    这是五个 P0 里唯一「数据错了且用户看不见」的一条。

    判定必须是纯函数、确定性：validate 在 apply 里会重跑生成 fresh plan，
    两次结果必须字节一致（教训 72），所以不能用相似度模型、不能带随机。

    ## 为什么不能是「任意一对二字词重合」（第一版，被实测打回）

    第一版阈值取 1，理由是「同项目不同事的两条，连一个二字词都不会共享」。
    **这个理由是错的。** 实测同一条待办面对它所属项目的全部 21 条记录：

        放行 16 / 21 = 76%

    因为「机器狗」「月台」「场地」「数据」这类**项目领域词**在同项目每条记录
    里都有，`want & got` 必然命中——那等于在问「这两件事是不是同一个项目的」，
    而项目归属前面已经校验过了。全局 40 条待办 × 同项目记录放行 51%。

    ## 现在的两段判据（满足其一即认）

    ① **特有词 ≥2**：先按「同项目其他记录标题里的出现占比」剔除项目通用词，
       只留这条待办**特有**的词去比对记录正文。

       通用词必须按**占比**算，不能按绝对次数。产品给的算法是「出现 ≥3 次即
       通用」，实测在 157 条记录的项目里产出 **308 个通用词**：「数据」(58次)、
       「验证」(47次)、「计划」「发送」全被判成通用，于是真配对
       「发送数据验证计划给罗兴成」只剩 1 个特有词而被误杀。
       3/157 = 1.9% 显然不通用。改成占比（5%，且不少于 3 次）后通用词降到 4 个。

    ② **包含度 ≥0.35**：同义改写走这条。实测待办「提供执行人员清单以录入
       转运小智系统」↔ 记录「提供执行人员清单以便加入转运小智系统」——
       除了「以便加入/以录入」几乎一字不差，但那几个词在该项目里恰好都是
       高频词，特有词被清空，①必然判死。用包含度（交集/较短一方词数）
       量出来 0.875，而恶意样本最高只有 0.10，两类完全分得开。

    ## 实测四个数（2026-11-16 证据，tools/p05_measure.py）

        ① 恶意样本 7 条全拒（含共用「机器狗」「月台」的 6 条）
        ② 全局误放率 38.7% → 5.8%（目标 ≤10%）
        ③ 正例 5 对全认得，0 误杀（links.json 已登记 + plan 里 create_todo 的 record_ref）
        ④ 挡住 32/175；逐条看过，都是该项目里**确实没有对应记录**的待办
           （如海康音柱项目只有 1 条记录），属正确拒绝，不是误杀。

    宁可严格也不放宽：判不准时让模型改用 record_ref 指向本轮新建记录，
    或把待办放进 pending，而不是让它挂一条不相关的记录蒙混过关——
    「关错了」比「关不掉」严重得多。
    """
    row=next((r for r in (bundle.get('tables') or {}).get('records') or []
              if r.get('id')==record_id),None)
    if row is None:return False
    text=' '.join(str(row.get(k) or '') for k in ('title','description','solution'))
    if not text.strip():return False
    got=terms_of(text)
    # 待办标题带 `[项目名]` 前缀。前缀是**项目归属**信息，不是「这件事是什么」，
    # 和项目通用词同理：它必然在同项目每条待办里出现，拿它当判据等于把
    # 「同项目」又判了一遍。剔掉后 `[测试项目] 联调` ↔ `联调验证` 才判得对。
    subject=re.sub(r'^\s*[\[【].*?[\]】]\s*','',str(todo_subject or '')) or str(todo_subject or '')
    want=terms_of(subject)
    if not want or not got:return False
    generic=_project_generic_terms(bundle,row)
    specific=want-generic
    if len(specific & got)>=2:return True
    # 同义改写兜底：词集高度包含即认
    # 实测真配对 ≥0.33（联调↔联调验证 0.33、「以便加入/以录入」0.88），
    # 恶意样本 ≤0.11（机器狗 0.11、月台 0.06）。取 0.30 留余量。
    title_terms=terms_of(str(row.get('title') or ''))
    if title_terms:
        containment=len(want & title_terms)/min(len(want),len(title_terms))
        if containment>=_CONTAINMENT:
            return True
    return False


# 二字词切分的停用词：纯虚词/泛动词，不带业务含义。
_TERM_STOP=set('的了和与及或在是要把对于这个那个上线进行完成确认联系安排处理项目工作'
               '一下我们他们可以需要已经通过关于相关进行中的地得')

# 同项目的词，在「同项目其他记录标题」里出现占比超过这个值，就算项目通用词。
# 取 5% 而不是绝对 3 次：157 条记录的项目按 3 次算会把「数据/验证/计划」
# 全判成通用词（实测 308 个），真配对反而被误杀。
_GENERIC_FRAC=0.05
_GENERIC_FLOOR=3

# 同义改写兜底阈值：待办（去项目前缀后）与记录标题的词集包含度。
# 实测真配对 ≥0.33（联调↔联调验证 0.33、「以便加入/以录入」0.88），
# 恶意样本 ≤0.11（机器狗 0.11、月台 0.06）。取 0.30 留余量。
_CONTAINMENT=0.30


def terms_of(value):
    """切词：中文按二字、英文/数字编码整体保留。纯函数。

    编码（571WA、755RA、F区这类设备号/场地号）**整体当一个 token**，不切碎：
    它们本身就是精确标识，"571WA" 和 "571WA3" 是不同设备。只按二字切中文，
    也避免把 "571" "71W" "1WA" 这种碎片当成判据——那会让任何含 571 的记录都
    命中，比不判还糟。

    编码需要以字母或数字开头且长度 ≥2：`IP`、`F区`(中文部分另切)、`571WA`
    都要能认。第一版正则是 `[A-Za-z][A-Za-z0-9_]{2,}`，`571WA`(数字开头) 和
    `IP`(只有2位) 全被漏掉，导致设备编号这类最强判据失效。
    """
    out=set()
    pattern=r'[\u4e00-\u9fa5]{2,}|[A-Za-z0-9][A-Za-z0-9_\-]{1,}'
    for token in re.findall(pattern,str(value or '')):
        if re.match(r'^[A-Za-z0-9]',token):
            # 纯英文/数字编码：整体入集（小写归一，"F区" 的中文部分由上面那条切）
            if not token.isdigit() or len(token)>=2:
                out.add(token.lower())
            continue
        for i in range(len(token)-1):
            gram=token[i:i+2]
            if gram not in _TERM_STOP:out.add(gram)
    return out


def _project_generic_terms(bundle,row):
    """本项目的通用词：同项目其他记录**标题**里出现占比 ≥_GENERIC_FRAC 的二字词。

    只看标题（短且干净），与被比对记录用哪几个字段无关——这样「领域词」
    的判定稳定，不会因为某条 solution 写得长就把词变成通用。
    纯函数：同样的 bundle 与 row 永远得到同样的集合。
    """
    records=(bundle.get('tables') or {}).get('records') or []
    project_ids=set(row.get('project_ids') or [])
    if not project_ids:
        return set()
    freq={}
    peers=0
    for peer in records:
        if not (project_ids & set(peer.get('project_ids') or [])):
            continue
        peers+=1
        for term in terms_of(str(peer.get('title') or '')):
            freq[term]=freq.get(term,0)+1
    if not peers:
        return set()
    cut=max(_GENERIC_FLOOR,_GENERIC_FRAC*peers)
    return {term for term,count in freq.items() if count>=cut}


def _infer_project(bundle,a):
    """从动作已带的关联对象反推唯一项目；不唯一或缺失返回 None。

    必须是纯函数：validate 在 apply 里会重跑生成 fresh plan，两次不一致
    会被「计划内容变更」拦死（教训 72）。
    """
    tables = bundle.get('tables') or {}
    projects = {p['id']:p for p in (tables.get('projects') or [])}
    owners = set()
    for rid in (a.get('record_ids') or []):
        for row in (tables.get('records') or []):
            if row.get('id') == rid:
                for pid in (row.get('project_ids') or []):
                    if pid in projects:
                        owners.add(pid)
    for mid in (a.get('milestone_ids') or []):
        for row in (tables.get('milestones') or []):
            if row.get('id') == mid:
                for pid in (row.get('project_ids') or []):
                    if pid in projects:
                        owners.add(pid)
    # update_status：行本身在 role 表里，直接取它的项目归属
    if a.get('record_id') and a.get('role') in ('records','milestones','projects'):
        role = a['role']
        if role == 'projects':
            if a['record_id'] in projects:
                owners.add(a['record_id'])
        else:
            for row in (tables.get(role) or []):
                if row.get('id') == a['record_id']:
                    for pid in (row.get('project_ids') or []):
                        if pid in projects:
                            owners.add(pid)
    if len(owners) == 1:
        return projects[next(iter(owners))]
    return None


# 语音转写常把场地编号听错。只收录已核实过的映射，其余未知编号一律打回，
# 避免把错编号写进表格后污染里程碑、报告和记忆页。
ASR_SITE_TRAPS={'752A':'755RA','755RD':'755RA','755RA-':'755RA'}
# 合并场地在表里是「591W&591WA」这种带 & 的复合编号。模型和原文往往只说其中一半
# （「591W」，口语和 ASR 都这样），所以匹配后还要查一份「单独编号 → 合并编号」的别名表，
# 否则明明是合法场地，却会被判成「不在场地表中」。
SITE_CODE=re.compile(r'(?<![0-9A-Za-z])(\d{3}[A-Z]{1,3}(?:&\d{3}[A-Z]{1,3})*)(?![0-9A-Za-z])')


def site_code_aliases(codes):
    """Map each half of a merged code back to the merged code: 591W -> 591W&591WA."""
    aliases={}
    for code in codes:
        for part in str(code).split('&'):
            part=part.strip().upper()
            if part and part!=str(code).upper():aliases.setdefault(part,str(code))
    return aliases


def normalize_site_codes(bundle,action):
    """Rewrite known ASR mishearings to the real site code; refuse unknown codes.

    Codes come from the live site table, so a new venue needs no code change.
    Only title/description are rewritten; quote stays verbatim because it is evidence.
    """
    codes={str(s.get('code') or '').strip().upper() for s in bundle.get('tables',{}).get('sites',[]) if s.get('code')}
    if not codes:return action
    aliases=site_code_aliases(codes)
    known=', '.join(sorted(codes))
    for field in ('title','description'):
        value=action.get(field)
        if not isinstance(value,str) or not value:continue
        def fix(match):
            found=match.group(1).upper()
            if found in codes:return found
            if found in aliases:return aliases[found]
            target=ASR_SITE_TRAPS.get(found)
            if target and target in codes:return target
            if target and target in aliases:return aliases[target]
            raise n.Error(f'{field} 里的场地编号「{found}」不在场地表中，请核对后重新提交。'
                          f'当前表内编号：{known}')
        action[field]=SITE_CODE.sub(fix,value)
    return action


def validate(config,bundle,decision):
    if decision.get('run_id')!=bundle['run_id'] or bundle['binding']!=n.digest(config):raise n.Error('运行或绑定已变化')
    if not isinstance(decision.get('summary'),str) or not decision['summary'].strip():raise n.Error('缺少本轮行文总结')
    # 对接人姓名 → user 对象（飞哥 2026-11-15：从上下文找谁来安排/对接就写谁，可多个）。
    # 必须放在 validate 而不是 table_write：生长写入走 apply_plan，不经过 table_write
    # 的 contact 分支，v2.12.3 的解析只在手工编辑生效——这就是对接人 2% 一直修不动的原因。
    # 三处 validate（重试循环/主路径/resume）都从这里走，单点接入 + 幂等保证 fresh==plan。
    decision=enrich_contacts(config,decision)
    if not isinstance(decision.get('actions'),list) or len(decision['actions'])>100:raise n.Error('动作应为不超过 100 条的数组')
    actions=[];keys=set();refs={}
    if len(decision['summary'])>8000:raise n.Error('本轮总结过长')
    # deferred 解析容错：模型要延后的引用解析不到具体来源时，**不再抛错整轮作废**。
    # 原报错「未处理来源 ID 不合法」是过去两天 25+ 轮失败的元凶——
    # 模型把 62 字符真实 ID 的中段十六进制抄错一个字符，整轮就白做。
    # 现在：先按短引用（S1）解析，退回旧格式完整 ID 兼容历史 decision；
    # 仍解析不中的记入 unresolved_deferred，由水位逻辑保守处理（见 apply），
    # 丢一轮重采，不丢数据。
    deferred_raw=decision.get('deferred_source_ids',[])
    if not isinstance(deferred_raw,list):raise n.Error('deferred_source_ids 应为数组')
    resolved_deferred=[];unresolved_deferred=[]
    for x in deferred_raw:
        match=resolve_source(bundle,x)
        if match:resolved_deferred.append(match['id'])
        else:unresolved_deferred.append(str(x)[:80])
    for a in decision['actions']:
        s=evidence(bundle,a)
        # 项目必填要**先于** project_for 检查：project_for 走 n.select_projects，
        # 项目名为空时会先抛「需唯一匹配，当前 0 项」，用户看不出该怎么改。
        # 实测 390/1479 = 26% 的记录就是因为这里没兜住，落成了无项目孤儿。
        if a.get('op')=='create_record' and not str(a.get('project') or '').strip():
            raise n.Error('记录必须归属一个项目；无法确定归属时把这个事项放进 pending 并说明候选项目，'
                          '不要创建没有项目关联的记录——孤儿记录在项目视图、报表和记忆页里全都看不见')
        p=project_for(bundle,a); op=a['op']; a=dict(a)
        if s['id'] in resolved_deferred:raise n.Error('尚未处理的来源不能同时生成写入动作')
        normalize_site_codes(bundle,a)
        # 准入规则（飞哥 2026-11-14 定稿）：**挂不到里程碑上的东西，不算项目记忆**。
        # 但落地方式不是拒写——真实数据显示用户自己已经用「归档」筛过一遍
        # （已归档 1102 条挂里程碑率 0.7%，开放 310 条挂 83%），说明这条界线
        # 用户认。所以这里照写、但打标 needs_review，交给人「确认 / 驳回」：
        # 确认=补挂里程碑后 marker 自动清除；驳回=归档并写入负例库，
        # 下一轮 prompt 带上负例，模型不再重复犯。
        # 记录 ID 同理：模型给 record_ids/milestone_ids 允许填短引用。
        if op=='create_record':
            given=a.get('milestone_ids') or []
            resolved=[];unresolved=[]
            if isinstance(given,list):
                for x in given:
                    row=resolve_row_ref(bundle,'milestones',x)
                    if row and p['id'] in (row.get('project_ids') or []):
                        if row['id'] not in resolved:resolved.append(row['id'])
                    else:unresolved.append(str(x)[:24])
            a['milestone_ids']=resolved
            if unresolved:a['milestone_refs_unresolved']=unresolved
            a['needs_review']=not resolved
            # 对接人默认规则（飞哥 2026-11-15）：「反馈能挂上里程碑时，对接人
            # 一般就是该里程碑的交付负责人 R」。
            # 实测依据：开放记录 361 条里 126 条对接人空白但挂到的里程碑有 R，
            # 可以直接补上；同时有 22 条已填对接人与 R 不一致——所以规则是
            # **默认值不是裁决**：只在模型没给对接人时推导，绝不覆盖明确的人。
            # r_owner 本来就是 [{corpId,userId}] 对象，无需再过通讯录解析。
            if not a.get('contact') and resolved:
                mrows={x['id']:x for x in (bundle.get('tables') or {}).get('milestones') or []}
                for mid in resolved:
                    owner=_milestone_owner_users(mrows.get(mid,{}).get('r_owner'))
                    if owner:
                        a['contact']=owner
                        a['contact_from_milestone_r']=True
                        a['description']=str(a.get('description') or '')+CONTACT_NOTE
                        break
            if a['needs_review']:
                # 表里没有 needs_review 列（不加列，用户表结构不动），
                # 标记写进描述末尾：人在表格里一眼可见，界面按同一标记识别。
                # 必须是**确定性**变换——resume 时 validate 重跑生成 fresh plan，
                # 同一输入两次结果不同会被「计划内容变更」拦死。
                a['description']=str(a.get('description') or '')+REVIEW_MARKER
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
                    and r.get('status') not in ('已解决','已关闭','已取消','已归档')
                    and normalized_title(r.get('title',''))==normalized_title(a['title'])]
                duplicates += [x for x in actions if x['op']=='create_record' and x['project']==a['project']
                    and normalized_title(x['title'])==normalized_title(a['title'])]
                if duplicates:raise n.Error('同项目已有同名未关闭记录。复用原记录并核对状态，不重复新增')
                # 标题要能当台账里的「一行事」读。实测现存 1479 条里 87% 在 10-30 字，
                # 最长 54 字——那是「整段背景塞进标题」，在报表里只能被截断。
                if not 6<=len(a['title'])<=60:
                    raise n.Error(f'记录标题须 6 至 60 字，当前 {len(a["title"])} 字：'
                                  '标题写「发生了什么、要做什么」，背景和过程放进描述')
                # 标题不能是「来源 + 确认/提到」这种元描述。实测出现过
                # 「飞书妙记确认F区安检为第二位优先级」——读者要的是「F区安检列为第二位优先级」，
                # 不是「某份听记确认了这件事」。来源已经在来源字段里，不必进标题。
                if re.match(r'^\s*(飞书妙记|语音通话|会议纪要|听记|钉钉|群聊|邮件|与\S{1,6}的\S{0,6})\s*'
                            r'(确认|提到|说到|沟通|表示|指出|记录)',a['title']):
                    raise n.Error('记录标题写成了「来源+确认」的元描述，应直接写事项本身。'
                                  '例如「飞书妙记确认F区安检为第二位优先级」应写成「F区安检列为第二位优先级」')
        elif op=='create_milestone':
            if not a.get('title') or not a.get('description'):raise n.Error('缺里程碑标题/交付内容')
            # 标题是台账里唯一被人读的东西，太短说不清做了什么，太长在甘特图和
            # 报告里都会被截断。实测现存 1479 条记录标题 10-54 字，里程碑同量级。
            if not 6<=len(a['title'])<=60:
                raise n.Error(f'里程碑标题须 6 至 60 字，当前 {len(a["title"])} 字：'
                              '标题写「做完了什么」，不要把整段背景塞进标题，细节放交付内容')
            # 交付内容是「可验收的完成物」，不是「这件事很重要」的复述。
            # 倒排那批错误节点的 description 平均不到 80 字，全是套话。
            if len(a['description'])<20:
                raise n.Error('里程碑交付内容须至少 20 字，写清验收标准和交付物；只写「完成XX」不算')
            when=datetime.strptime(a['date'],'%Y-%m-%d').date()
            if a.get('status','待核')!='待核':raise n.Error('自动发现的里程碑初始为待核')
            # 日期必须落在可信区间。11-13 发现 2026-11-06/11-09/11-10 三个已过去的
            # 日期被写进了里程碑——那已经是「已过期的计划」，写进去就是让看板显示
            # 一批永远不会发生的交付。用本轮证据的 until 作参照，不看系统今天：
            # 补跑历史批次时，系统日期会把这些全部判死，反而是错的。
            reference=instant(bundle['until'],timezone.utc).date() if bundle.get('until') else datetime.now(timezone.utc).date()
            if when<reference:
                raise n.Error(f'里程碑日期 {when} 早于本轮证据时间 {reference}，属于「已过期的计划」，'
                              '不能作为待交付节点写入；请核对这个日期是否应该更新')
            # 倒排那 5 条错里程碑的共同点：标题像交付、备注全是套话、没有任何
            # record_id / 里程碑 ID 支撑。有 quote 只证明「这句话被说过」，
            # 不证明「这件事有这个交付节点」。所以要求至少一个可核验的关联对象。
            linked=list(a.get('record_ids') or [])+list(a.get('milestone_ids') or [])
            if not linked:
                raise n.Error('里程碑必须关联至少一条已有记录或里程碑作为依据（record_ids / milestone_ids）。'
                              '只在来源里提过某个想法不足以成为交付节点；'
                              '若确实没有可关联对象，把该事项放进 pending 并说明需要的依据')
            for rid in linked:
                if not any(r['id']==rid for r in bundle['tables'].get('records',[])+bundle['tables'].get('milestones',[])):
                    raise n.Error(f'里程碑依据 {rid} 不存在，不能作为来源')
            if a.get('date') and a.get('title'):
                # 同一项目不许有两件同名交付。实测 755RA 与 APEC 航城安保各有
                # 「12月31日前完成向机场方的汇报」，全表 9 条含「机场方」的里程碑里
                # 至少 4 条是同一件事的改写。本项目内先按归一化标题挡一道。
                norm=lambda value:re.sub(r'\s+','',str(value or '')).casefold()
                same_title=[m for m in bundle['tables'].get('milestones',[])
                            if p['id'] in m.get('project_ids',[]) and norm(m.get('title'))==norm(a['title'])]
                same_title+=[{'title':x['title']} for x in actions
                             if x['op']=='create_milestone' and x['project_id']==p['id'] and norm(x['title'])==norm(a['title'])]
                if same_title:
                    raise n.Error('同项目已有同名里程碑「'+a['title']+'」，请复核合并，不要重复新增')
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
            if not a.get('record_ids') and not a.get('record_ref'):
                # 报错要给「出路」：模型三次重试都栽在这句（实测 2026-11-14 22:40 轮），
                # 因为原话只说「必须关联」，没说没有现成记录时该怎么办。
                raise n.Error('待办必须关联项目记录（record_ids 或 record_ref）。'
                              '本轮没有可关联的记录时，二选一：'
                              '先写一条 create_record 并用 ref 命名，待办用 record_ref 指向它；'
                              '或把该待办放进 pending 数组说明缺少记录，下一轮补关联')
        elif op=='complete_todo':
            matches=[t for t in bundle['todos'] if t['taskId']==a.get('task_id')]
            if len(matches)!=1 or a.get('match')!='unique' or a.get('completion')!='explicit':raise n.Error('完成待办必须来自本人未完成列表、唯一匹配和明确完成证据')
            if a.get('expected_title')!=matches[0]['subject']:raise n.Error('待办标题不符')
            same_title=[t for t in bundle['todos'] if re.sub(r'\s','',t['subject'])==re.sub(r'\s','',matches[0]['subject'])]
            if len(same_title)!=1:raise n.Error('本人存在重复标题待办，不能凭消息自动选择其中一项')

            # ① 证据不能跨待办：拿 todo:A 的证据去关 todo:B 必须拒绝。
            #
            # **但绝不能要求 source_id 必须 == todo:<task_id>。**
            # 实测：398 条待办里只有 8 条登记在 links.json（覆盖率 1.8%），
            # 而 collect 只对已登记的 tid 调 todo:+get（growth.py:426），
            # 所以 390 条未登记待办**压根没有 todo: 来源**。
            # 强制闭环 = 这 390 条即使证据确凿也永远关不掉，把人堵死。
            # 这正是「改严了会有人被挡」的地方，被误挡的用户看到的是
            # 「证据不是来自待办本身」——他根本无从修改，因为来源根本不存在。
            #
            # 正确边界：**只禁止拿「另一条待办」的来源来关本条**。
            # 群聊/邮件/听记说「这件事完成了」是合法证据（原来就是这样）；
            # 但 todo:B 的完成状态不能当作 todo:A 的完成证据。
            owner=str(s['id'])
            if owner.startswith('todo:') and owner!='todo:'+str(a['task_id']):
                raise n.Error(
                    '不能用另一条待办（'+owner+'）的完成状态来关闭这条待办「'
                    +str(matches[0]['subject'])[:36]+'」。'
                    '待办之间互不替代：请改用这条待办自己的来源、'
                    '或能证明它完成的群聊/听记/邮件，或把事项放进 pending 说明')

            if not a.get('record_ids'):raise n.Error('完成待办需同时指定要同步的项目记录；无对应记录先归集建档')
            for rid in a['record_ids']:
                if not any(r['id']==rid and p['id'] in r.get('project_ids',[]) for r in bundle['tables']['records']):raise n.Error('完成待办的记录关联不正确')

            # ② 记录必须与待办**语义相关**，或者指向本轮新建的记录。
            #    只校验「同项目」等于没校验：实测该项目 157 条记录，
            #    2026-11-16 复现——拿「安排倒车辅助激光雷达方案评审会议」
            #    成功关闭了「联系李岳天确认和记场地编码及机器狗需求范围」，
            #    原校验直接放行，用户完全看不见。
            #    这是五个 P0 里唯一「数据错了且用户看不见」的一条。
            new_record_ids={x.get('ref') or x.get('title') for x in actions if x.get('op')=='create_record'}
            unrelated=[rid for rid in a['record_ids']
                       if not _record_matches_todo(bundle,rid,matches[0]['subject'])]
            if unrelated:
                # 允许指向本轮新建记录（模型刚为它建的档，天然相关）
                unrelated=[rid for rid in unrelated if rid not in new_record_ids]
            if unrelated:
                raise n.Error(
                    '要同步的记录与这条待办不是同一件事（'+ '、'.join(unrelated[:3]) +'）。'
                    '记录内容与待办「'+matches[0]['subject'][:40]+'」对不上，'
                    '照这样关闭会让人看不出到底做完了什么。'
                    '请改用确实对应这条待办的记录，或用 create_record 先建一条'
                    '（填 ref，再用 record_ref 指向它）；'
                    '确实没有对应记录就把该待办放进 pending')

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
    return {'run_id':bundle['run_id'],'binding':n.digest(config),'evidence_hash':n.digest(bundle),'decision':decision,'actions':actions,
            'resolved_deferred':resolved_deferred,'unresolved_deferred':unresolved_deferred}


def writable_cells(config, role, cells):
    """写入前按目标表的真实结构收敛字段，避免辅助字段拖垮整条写入。

    - 系统字段（创建时间、创建人、公式、lookup）只读，直接丢弃；
    - 单选的取值不在当前选项内时留空，由核心在计划里说明，不硬造选项、不改表结构。
    """
    table = config['tables'][role]
    by_id = {v['fieldId']: (k, v) for k, v in table['fields'].items()}
    result = {}
    dropped = []
    for field_id, value in cells.items():
        logical, field = by_id.get(field_id, (None, None))
        if field is None:
            dropped.append((field_id, 'UNKNOWN_FIELD'))
            continue
        if field.get('readonly'):
            dropped.append((logical, 'READONLY'))
            continue
        if field.get('type') == 'singleSelect':
            names = [o.get('name') if isinstance(o, dict) else o for o in ((field.get('config') or {}).get('options') or [])]
            if names and value not in names:
                dropped.append((logical, 'OPTION_MISSING'))
                continue
        result[field_id] = value
    return result, dropped


def _contact_index(gw, cache=None):
    """扫一遍记录表，建「姓名 → user 对象」索引。

    只认**唯一出现**的姓名：同名多个说明这个团队里也有歧义，不能猜。
    """
    key = '__contact_index__'
    if cache is not None and key in cache:
        return cache[key]
    index = {}
    try:
        cfg = gw.config
        table = cfg['tables']['records']
        fid = (table.get('fields') or {}).get('contact', {}).get('fieldId')
        if not fid:
            if cache is not None:
                cache[key] = {}
            return {}
        rows = gw.table().records(cfg['base_id'], table['id'])
    except Exception:
        if cache is not None:
            cache[key] = {}
        return {}
    seen = {}
    for row in rows:
        value = (row.get('cells') or {}).get(fid)
        if not isinstance(value, list):
            continue
        for item in value:
            if not isinstance(item, dict) or not item.get('userId'):
                continue
            name = str(item.get('name') or '').strip()
            if not name:
                continue
            seen.setdefault(name, set()).add(json.dumps(
                {'userId': item['userId'], **({'corpId': item['corpId']} if item.get('corpId') else {})},
                ensure_ascii=False, sort_keys=True))
    for name, variants in seen.items():
        if len(variants) == 1:
            index[name] = [json.loads(next(iter(variants)))]
        else:
            index[name] = None   # 同名多个用户，标记为不可用
    if cache is not None:
        cache[key] = index
    return index


def historic_contact(gw, name, cache=None):
    index = _contact_index(gw, cache)
    return index.get(name)


def resolve_contact(gw, name, cache=None):
    """把中文姓名解析成钉钉 user 对象 [{corpId,userId}]。

    ## 为什么必须有这一步

    「对接人」是 user 类型列，值必须是一组 user 对象。直接写姓名会被拒绝：

        user field value must be an array of user objects

    而且 DWS 把它归为 category=internal，落进「写入结果未知」的分类——
    用户看到「未知」会以为写成功了，实际整条都没写进去。
    2026-11-09 19:07 那轮 5 条记录全废在这里。

    ## 行为

    - 同名多个人 → 放弃（列表里可能既有在职也有离职，猜错会挂到别人名下）
    - 搜不到 → 放弃
    - 任何失败 → 放弃，绝不因为解析失败而阻断整条记录写入
    """
    if not name or not isinstance(name, str):
        return None
    key = name.strip()
    if not key:
        return None
    if cache is not None and key in cache:
        return cache[key]
    # ★ 优先从**已有记录**里查同名历史值。
    #
    # 为什么必须这样：全公司同名的人很多——实测「朱飞」有 **15 个**，
    # 只按姓名搜根本判不出是哪个。硬选第一个会把记录挂到收派员名下。
    #
    # 而表里已经写进去过的对接人，就是「这个团队实际用到的人」，
    # 用它反向匹配比全公司搜索准得多。
    historic = historic_contact(gw, key, cache)
    if historic:
        if cache is not None:
            cache[key] = historic
        return historic
    try:
        data = gw.call(['contact', 'user', 'search', '--query', key])
    except Exception:
        if cache is not None:
            cache[key] = None
        return None
    rows = data.get('result') if isinstance(data, dict) else None
    rows = rows if isinstance(rows, list) else []
    # 名字必须完全相等：搜索是模糊的，「梁玉」也会搜出「梁玉标」。
    same = [r for r in rows if str(r.get('name') or '').strip() == key]
    result = None
    if len(same) == 1 and same[0].get('userId'):
        item = {'userId': same[0]['userId']}
        if same[0].get('corpId'):
            item['corpId'] = same[0]['corpId']
        result = [item]
    if cache is not None:
        cache[key] = result
    return result


# 进程内缓存：每轮 tick/grow 是独立进程，姓名→user 的索引与解析结果只算一次。
# 不缓存的话，重试循环里每个新 decision 有姓名就重扫全表（1480 条约 16 秒×3）。
# 缓存不影响 fresh==plan 一致性：同一姓名 → 同一索引 → 同一结果，天然确定。
_ENRICH_CACHE = {}


def split_contact_names(value):
    """把模型给的对接人拆成姓名列表。容忍这些真实形态：
    '张三' / '张三、李四' / '张三，李四' / ['张三','李四'] / 已是 user 对象。"""
    if isinstance(value, list):
        out = []
        for x in value:
            if isinstance(x, dict):
                return None  # 已经是 user 对象（比如 R 推导注入的），调用方原样保留
            out.extend(split_contact_names(x) or [])
        return out or None
    text = str(value or '').strip()
    if not text:
        return None
    return [x.strip() for x in re.split(r'[、，,;；/\s]+', text) if x.strip()] or None


def enrich_contacts(config, decision, gw=None, cache=None):
    """在 validate 之前，把 create_record 里的姓名字符串对接人解析成 user 对象。

    ## 为什么必须放在这里（而不是 table_write）

    n.plan() 只接受已解析的 user 对象，姓名字符串会被直接丢弃；
    而生长写入走 n.apply_plan，**根本不经过 table_write 的 contact 分支**。
    所以 v2.12.3 加的姓名解析只对界面手工编辑生效，生长路径一直是断的——
    这就是「对接人 2% 覆盖率」修了一轮还没动的真原因。

    ## 规则（飞哥 2026-11-15 补充）

    - 来源里「谁来安排、谁来对接」点名的人就是对接人，**可以一个或多个**；
      列本身 multiple=true，姓名按顿号/逗号/空格拆开后逐个解析。
    - 与 R 推导共存：模型从来源点名的优先（明确的人 > 结构默认）。
    - 解析不了（同名歧义/搜不到）→ 该名字丢弃并记入 action['contact_names_unresolved']，
      **绝不阻断整条写入**。
    - 已是 user 对象的（R 推导注入的）原样跳过。
    - 幂等：二次调用对已对象化的 decision 不再触网——fresh==plan 比对依赖这点。
    """
    if not isinstance(decision, dict):
        return decision
    cache = cache if cache is not None else _ENRICH_CACHE
    for a in decision.get('actions') or []:
        if a.get('op') != 'create_record':
            continue
        raw = a.get('contact')
        if raw is None or raw == '':
            continue
        if split_contact_names(raw) is None:
            continue  # 已是 user 对象数组，保持原样
        names = split_contact_names(raw) or []
        resolved = []
        unresolved = []
        if gw is None:
            gw = Gateway(config)  # 只有真需要解析姓名时才建网关、扫表
        for name in names:
            users = resolve_contact(gw, name, cache)
            if users:
                for u in users:
                    if u not in resolved:
                        resolved.append(u)
            else:
                unresolved.append(name)
        if resolved:
            a['contact'] = resolved
        else:
            a.pop('contact', None)
        if unresolved:
            a['contact_names_unresolved'] = unresolved
    return decision


def table_write(config,gw,role,cells,record_id=None,contact_cache=None):
    cells,dropped=writable_cells(config,role,cells)
    # 对接人：单元格里如果是中文姓名，先解析成 user 对象。写姓名会被 DWS 拒绝，
    # 且错误被归成「写入结果未知」，最容易让人误判成「已经写上了」。
    fields=config['tables'][role].get('fields') or {}
    contact_field=fields.get('contact')
    if contact_field:
        fid=contact_field.get('fieldId')
        raw=cells.get(fid)
        if isinstance(raw,str) and raw.strip():
            resolved=resolve_contact(gw,raw,contact_cache)
            if resolved:
                cells=dict(cells);cells[fid]=resolved
            else:
                cells=dict(cells);cells.pop(fid,None)
                dropped.append('contact='+raw[:40]+'（没能唯一匹配到钉钉用户，未写入）')
    if not cells:raise n.Error('写入字段均已失效（只读或选项不匹配），本次未提交')
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
    # 写后回读**要重试**：写入本身绝不重发（会重复入库），但「读一次没读到」
    # 可能只是钉钉侧的可读性延迟——实测刚写完立刻查，偶尔返回 0 行，
    # 再查就有。原来的写法读一次对不上就抛「写入结果未知」，让用户以为
    # 写失败、于是重做一遍，反而可能产生重复记录。
    #
    # ⚠️ 这里重试的只是**读**，不是写。写入永远只发一次。
    rows=[]
    for attempt in range(4):
        d=gw.call(['aitable','+record-query','--base-id',base,'--table-id',table,'--record-ids',record_id])
        rows=d.get('records',[])
        if len(rows)==1 and rows[0].get('recordId')==record_id and all(
                n.equivalent(rows[0]['cells'].get(k),v) for k,v in cells.items()):
            break
        if attempt<3:time.sleep(1.5*(attempt+1))
    verified = (len(rows)==1 and rows[0]['recordId']==record_id
                and all(n.equivalent(rows[0]['cells'].get(k),v) for k,v in cells.items()))
    # dropped 不能悄悄丢掉：只读字段、越界选项、未知字段被剔除后，写进去的记录就少了几列，
    # 而调用方看到 verified=True 会以为整条都写成功了。把剔除明细带回回执。
    result={'record_id':record_id,'verified':verified}
    if dropped:result['dropped']=[{'field':f,'reason':r} for f,r in dropped]
    if verified:
        return result
    # **写已发生（record_id 拿到了），一次回读失败不该掐死整轮。**
    #
    # 这和 n.apply_plan 里 `create_record` 的处理必须是同一个口径，否则
    # 同一轮里 create_record 放行、create_milestone 掐死，比两个都不改更糟。
    # 而 create_milestone 就在生长主路径上（apply 里 op=='create_milestone'），
    # 它一旦抛错：apply 抛 → _finish() 不执行 → 水位不推、seen 不写 →
    # 下一轮重采同样来源。这正是「修了个寂寞」的形态。
    #
    # 钉钉写后可见性延迟实测可达 539 秒（records 表），没有理由认为
    # milestones 表不会——延迟是表格层面的属性，与写哪张表无关。
    # 所以这里记 verify_pending 让调用方继续，未核实这件事由 recovery 收尾。
    result['verify_pending']=True
    result['verify_reason']=(
        '已写入但回读未确认（钉钉写后可见性延迟）。该条**很可能已经写入**，'
        '数据没有丢失：请按 record_id='+str(record_id)+' 到表格核对，'
        '或运行「核验原结果」由系统回读确认（不会重复写入）。不要直接重做。')
    return result


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
                # 子回执里的「写了没核到」必须冒泡到外层，否则外层状态会是
                # verified，recovery.overview() 也就看不到它——
                # 那等于把待核项藏起来，和 P0-b 要解决的毛病一样。
                if result.get('pending_verify'):
                    receipt.setdefault('pending_verify',{}).update(result['pending_verify'])
            elif op=='create_milestone':
                f=config['tables']['milestones']['fields']; marker='[年轮来源:'+key+']'
                rows=n.fetch(config,gw.table())['milestones']
                evidence_field='notes' if 'notes' in f else 'description'
                existing=[r for r in rows if marker in r.get(evidence_field,'')]
                same=[r for r in rows if r['title']==a['title'] and a['project_id'] in r['project_ids']]
                values={'title':a['title'],'date':a['date'],'status':'待核','description':a['description'],
                    'project_ids':{'linkedRecordIds':[a['project_id']]}}
                # 依据要落进备注。validate 只为「必须有依据」挡了一道，
                # 如果依据本身不写进表，事后就查不出这条里程碑是从哪条记录来的——
                # 那和没有依据是一样的。倒排那批错节点的备注里全是套话，
                # 正是因为没有这一步。
                basis=list(a.get('record_ids') or [])+list(a.get('milestone_ids') or [])
                values[evidence_field]=((a['description']+'\n') if evidence_field=='description' else '')+ \
                    a['quote']+'\n来源：'+a['source_id']+'\n依据：'+'、'.join(basis)+'\n'+marker
                cells={f[k]['fieldId']:v for k,v in values.items()}
                if existing:
                    if len(existing)!=1 or not all(n.equivalent(existing[0]['raw_cells'].get(k),v) for k,v in cells.items()):raise n.Error('里程碑来源重复或内容已变更，请对账')
                    result={'record_id':existing[0]['id'],'already_present':True,'verified':True}
                elif same:raise n.Error('同项目已有同名里程碑，需复核合并')
                else:
                    result=table_write(config,gw,'milestones',cells)
                    # create_milestone 走 table_write，也是「写已发生、回读没确认」
                    # 的一条路径。待核项必须浮到外层回执，否则 _finish 只看得到
                    # verified=False 却不知道该怎么办；recovery 也扫不到它。
                    if result.get('verify_pending'):
                        receipt.setdefault('pending_verify',{})[
                            result.get('marker') or ('milestones/'+str(result['record_id']))]={
                            'record_id':result['record_id'],
                            'title':a['title'],
                            'reason':'已写入但回读未确认（钉钉写后可见性延迟）',
                            'how_to_verify':'按 record_id='+str(result['record_id'])
                                            +' 到里程碑表核对，或运行「核验原结果」',
                        }
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
                    sub=n.apply_plan(config,gw.table(),p,folder/(key+'-'+rid+'.json'))
                    result['record_ids'].append(rid)
                    # 同步记录状态也可能「写了没核到」。待办本身已经是完成态
                    # （上面 check 过 isDone），但关联记录被标「已解决」这件事
                    # 还没被确认——不冒泡的话外层会记 verified，等于把没说准的事
                    # 说成说准了，正是 P0-b 要消灭的那种误导。
                    if sub.get('pending_verify'):
                        receipt.setdefault('pending_verify',{}).update(sub['pending_verify'])
                # 回写 links.json：现在只有 8/398 条待办登记在这里（覆盖率 1.8%），
                # 于是「已登记待办的项目/记录关系不能改配」这道校验对上 390 条
                # 等于不存在。完成时补登记，新生的关联就能受它保护。
                # 只补不覆盖：已有登记以原值为准（那是人工确认过的）。
                try:
                    lp=root(config)/'links.json';links=n.load(lp) if lp.exists() else {}
                    if str(tid) not in links:
                        links[str(tid)]={'project_id':a['project_id'],
                                         'record_ids':list(result['record_ids']),
                                         'source_id':a['source_id'],
                                         'title':a['expected_title']}
                        n.save(lp,links)
                except Exception as exc:
                    # 登记失败不能让已完成的待办回滚——数据已经对了，
                    # 丢的只是下一轮的附加校验，记下来即可。
                    result['links_writeback_error']=str(exc)[:200]
            receipt['results'][key]=result;receipt.pop('in_flight');n.save(receipt_path,receipt)
        # 外层回执也可能攒到待核项（apply_plan 写在子回执里的 pending_verify
        # 不一定浮到这里），所以不能无条件写 verified——那会把「写了没核到」
        # 装扮成「全部确认」，正是 P0-b 要消灭的那种误导。
        pending_verify=receipt.get('pending_verify') or {}
        receipt['status']='pending_verify' if pending_verify else 'verified'
        n.save(receipt_path,receipt)
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
    # active.json 是「有未完成任务」的标记，collect 看到它就拒绝启动新一轮。
    # 原来只在函数正常走完时删除；而模型返回空、组织身份变化、动作未验证
    # 都会在中途抛错，标记就永久残留，之后每轮都卡在「已有未完成的生长任务」。
    # 实测 2026-11-07 03:08 那轮就是这么卡住的。
    try:
        return _finish(config,folder,decision_file)
    finally:
        (root(config)/'active.json').unlink(missing_ok=True)


def _related_links(config, evidence):
    """把本轮涉及的项目拼成 [[wiki链接]]，供 GBrain 建立页面间边。

    只链接**真实存在于本轮 evidence 里**的项目——不按标题猜、不补造。
    目标 slug 必须与 `memory.refresh()` 写入项目记忆时用的算法一致，
    否则链接会指向不存在的页面（GBrain 会拒绝或产生悬空边）。
    """
    try:
        projects=(evidence.get('tables') or {}).get('projects') or []
    except AttributeError:
        return ''
    if not projects:
        return ''
    base=config.get('base_id')
    lines=[]
    for project in projects:
        pid=project.get('id');title=project.get('title')
        if not pid or not title:
            continue
        slug='projects/nianlun-'+n.digest({'base':base,'project':pid})[:24]
        # 只保留标题里的可读部分；[[ ]] 内部不能有换行或方括号。
        label=str(title).replace('[','').replace(']','').replace('\n',' ').strip()
        if not label:
            continue
        lines.append('- [['+slug+'|'+label+']]')
    if not lines:
        return ''
    return '本轮涉及的项目：\n\n'+'\n'.join(lines)+'\n\n'


def _finish(config,folder,decision_file):
    folder=Path(folder).expanduser().resolve();b=n.load(folder/'evidence.json');d=n.load(decision_file)
    validate(config,b,d)
    receipt=n.load(folder/'receipt.json') if (folder/'receipt.json').exists() else {}
    # 放行 `pending_verify`：写已经发生（record_id 拿到了），只是回读没确认。
    # 若这里只认 verified，一次分钟级的可见性延迟就会把整轮按死在这里——
    # finish 不执行 → seen 不写、水位不推 → 下一轮重采同样的来源。
    # 那条已经落库的数据会被当成本轮失败反复处理，正是要消灭的「失败自我喂养」。
    # 待核项不会被丢掉：它留在 receipt['pending_verify'] 里，recovery 收尾。
    action_status=receipt.get('status')
    if d['actions'] and action_status not in ('verified','pending_verify'):
        raise n.Error('动作尚未全部验证或总结与执行计划不一致，不能完成本轮')
    if d['actions'] and receipt.get('decision_hash')!=n.digest(d):
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
        # 「相关记录」原来只写「见上」，没有任何 [[wiki链接]]——而 GBrain 的
        # markdown 边正是靠正文里的 [[...]] 建立的，所以 505 篇记忆一条边都没有，
        # 3D 星图只有散点（工作台长期显示「505 篇 · 0 条引用」）。
        # 这里按本轮 evidence 里真实出现的项目拼链接，目标 slug 与
        # memory.refresh() 写入项目记忆时用的算法完全一致，保证指向存在的页面。
        content='---\ntitle: 年轮生长记录 '+b['run_id']+'\ntags: [nianlun, project-memory]\n---\n\n'+text+'\n\n## 相关记录\n\n'+_related_links(config,b)+'项目来源与 AI 表格链接见上。\n'
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
    # 水位用 validate 解析后的真实 ID；unresolved 非空时 advance 会把
    # 全部渠道水位保留（宁可下一轮重采，也不让一个抄错的 ID 决定丢哪些数据）。
    deferred_ids=plan.get('resolved_deferred',d.get('deferred_source_ids',[]))
    water={'deferred_source_ids':deferred_ids,'unresolved_deferred':plan.get('unresolved_deferred',[])}
    selected=b.get('selection',{}).get('project_ids',[])
    seen_path=root(config)/'scopes'/(n.digest(selected)+'.json') if selected else root(config)/'seen.json'
    seen=n.load(seen_path) if seen_path.exists() else {}
    for s in b['sources']:
        if s['id'] not in deferred_ids:seen[s['id']]=s['version']
    n.save(seen_path,seen)
    # Incomplete sources retain their window for the next run; don't silently drop missing pages.
    checkpoint=root(config)/'checkpoint.json'
    if not b.get('manual'):
        n.save(checkpoint,source_state.advance(b,water,n.load(checkpoint) if checkpoint.exists() else {},config['growth']))
    health_path=root(config)/'source-health.json'
    n.save(health_path,source_state.health(b,n.load(health_path) if health_path.exists() else {}))
    n.save(notice_path,{'signature':signature,'run_id':b['run_id']})
    status['notify']=notify
    status.update(status='partial' if partial else 'complete',finished_at=n.stamp(config));n.save(status_path,status)
    n.build_home(n.fetch(config,gw.table()),config['growth']['home_output'],config)
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


def report_node_store(config):
    """按项目记住汇报文档节点，草稿阶段也要记住：
    否则未回填主表时每期都会新建一份，同一个项目越堆越多份汇报。"""
    return root(config)/'report-nodes.json'


def remembered_report_node(config,project_id,current_url=None):
    from_url=report_node_id(current_url)
    if from_url:return from_url
    path=report_node_store(config)
    if not path.exists():return None
    try:return (n.load(path) or {}).get(project_id)
    except (OSError,ValueError):return None


def remember_report_node(config,project_id,node_id):
    if not project_id or not node_id:return
    path=report_node_store(config)
    try:
        data=n.load(path) if path.exists() else {}
        data[project_id]=node_id
        n.save(path,data)
    except (OSError,ValueError):pass


def report_node_id(url):
    """从钉盘/文档空间链接里取出可覆盖的节点 ID；取不到就当作需要新建。"""
    if not isinstance(url,str):return None
    match=re.search(r'/nodes/([A-Za-z0-9_-]{8,})',url)
    return match.group(1) if match else None


def report_target(config,state,project_id,since,until):
    """汇报挂在项目级：整份文档就是该项目截止目前的整体进度。

    不落到里程碑上——里程碑是交付节点，一份阶段汇报会横跨多个节点，
    挂到任何单条都会让读者误以为只讲那一条。
    """
    projects=config['tables']['projects']['fields']
    slot=projects.get('report')
    if not slot or slot.get('readonly'):return None
    return ('projects',slot['fieldId'],project_id,'项目主表')


def publish_report(config,project,since,until,summary_file=None,expected_facts=None,report_method=None,memory_sources=None,progress=lambda message:None,writeback=True):
    from render_report import render
    from planning import evidence
    gw=Gateway(config);self_identity(gw);state=n.fetch(config,gw.table());p=n.select_projects(state,[project])[0]
    if not state['complete']:raise n.Error('表格读取不完整，未发布汇报')
    if expected_facts is not None and n.digest(evidence(state,p['id']))!=expected_facts:
        raise n.ReportStale('生成期间项目事实已变化，请按最新资料重新生成本期汇报。')
    if not config['growth']['switches'].get('reports'):raise n.Error('阶段汇报开关关闭')
    date=datetime.strptime(until,'%Y-%m-%d');datetime.strptime(since,'%Y-%m-%d')
    if since>until:raise n.Error('时间范围错误')
    summary=Path(summary_file).read_text(encoding='utf-8') if summary_file else ''
    import report_brief
    source_index=report_brief.sources(evidence(state,p['id']),memory_sources or [])
    html,md,_=render(state,[p],since,until,'年轮 · 阶段性汇报',summary)
    # Model output is the report. Evidence stays in a compact, closed appendix;
    # never append the original records or the full milestone plan a second time.
    source_details=report_brief.appendix(summary,source_index,memory_sources or []) if summary else ''
    if source_details:html=report_brief.attach_appendix(html,source_details)
    key=n.digest({'project':p['id'],'since':since,'until':until,'summary':summary,'facts':evidence(state,p['id']),
        **({'method':report_method.get('name')} if report_method else {})})[:16]
    folder=root(config)/'reports'/key;folder.mkdir(parents=True,exist_ok=True)
    receipt_file=folder/'receipt.json';receipt=n.load(receipt_file) if receipt_file.exists() else {}
    if receipt.get('status')=='verified':
        if p.get('report')!=receipt.get('url'):
            raise n.Error('这份报告已发布，但主表目前指向另一份汇报；原报告保留，未覆盖最新链接。')
        return {**receipt,'report_id':key,'already_present':True}
    if receipt.get('in_flight'):
        step=receipt['in_flight'].get('step')
        if step=='writeback':
            # 上一轮写回可能已经生效但响应丢失：核验主表链接是否已是本轮 URL，是则直接确认。
            url=receipt['in_flight'].get('url')
            if p.get('report')==url:
                receipt.update(status='verified',project_id=p['id'],report_id=key);receipt.pop('in_flight',None)
                n.save(receipt_file,receipt)
                return receipt
            if p.get('report')!=receipt.get('previous_link'):
                raise n.Error('主表汇报链接被其他人更新')
            receipt.pop('in_flight',None);n.save(receipt_file,receipt)
        elif step!='upload':
            raise n.Error('报告存在待核验步骤')
        else:
            receipt=reconcile_report_upload(config,gw,folder,receipt)
    if 'previous_link' not in receipt:
        receipt['previous_link']=p.get('report');n.save(receipt_file,receipt)
    safe=re.sub(r'[^\w\u4e00-\u9fff-]','-',p['title']);filename='阶段性汇报-'+safe+'-'+until+'-'+key[:8]+'.html'
    if not receipt.get('node_id'):
        if report_method:
            import report_style
            progress('正在按所选汇报样式生成可视化报告')
            html=report_style.render(report_method,md,folder,p['title']+' · 阶段回顾',appendix_html=source_details,subtitle=since+' — '+until)
        html=report_brief.citation_tooltips(html,source_index)
        n.save(folder/filename,html);n.save(folder/Path(filename).with_suffix('.md'),md)
        # 汇报保持同一份文档持续迭代：该项目已有汇报链接时覆盖原节点，
        # 链接不变，读者收藏的地址不会失效，也不会在文件夹里堆历史版本。
        # now 在本函数靠后处才由回读结果赋值（832 行），这里只能取回执里已记录的上一版链接；
        # 直接引用 now.get(...) 会在首次发布（回执无 node_id）时抛 UnboundLocalError。
        existing=remembered_report_node(config,p['id'],receipt.get('previous_link'))
        try:
            if existing:
                progress('正在把本期内容更新到已有汇报文档')
                receipt['in_flight']={'step':'upload','file':filename,'node':existing};n.save(receipt_file,receipt)
                d=gw.call(['drive','+upload','--file',filename,'--node',existing,'--yes'],cwd=folder)
            else:
                progress('正在上传报告到已绑定的文件夹')
                receipt['in_flight']={'step':'upload','file':filename};n.save(receipt_file,receipt)
                d=gw.call(['drive','+upload','--file',filename,'--folder',config['growth']['report_folder'],'--yes'],cwd=folder)
        except n.Error:
            receipt=reconcile_report_upload(config,gw,folder,receipt);d={'reconciled':True,'nodeId':receipt['node_id'],'url':receipt['url']}
        # Keep the full verified shortcut receipt; require a returned server URL rather than inventing one.
        n.save(folder/'upload.json',d)
        item=uploaded_node(d)
        if not item:raise n.Error('上传返回未包含可核验的节点与链接，保留回执待对账')
        receipt.update(node_id=item.get('nodeId') or item['fileId'],url=item.get('url') or item['docUrl']);receipt.pop('in_flight',None);n.save(receipt_file,receipt)
        remember_report_node(config,p['id'],receipt['node_id'])
    if not writeback:
        # 自动生长只产出可审阅的草稿：上传留档但不改写主表对外链接，
        # 呈报给领导的「输出结果」由负责人确认后再发布。
        receipt.update(status='draft',pending_approval=True,project_id=p['id'],report_id=key)
        n.save(receipt_file,receipt)
        progress('报告草稿已生成并上传，主表链接未改动，待确认后发布')
        return receipt
    progress('正在核验报告链接并写回项目主表')
    current=n.fetch(config,gw.table())
    if not current['complete']:raise n.Error('报告已上传，但主表回读不完整；重试将核验原链接，不会重复上传。')
    now=next(x for x in current['projects'] if x['id']==p['id'])
    if now.get('report') not in (receipt['previous_link'],receipt['url']):raise n.Error('主表汇报链接被其他人更新')
    target=report_target(config,current,p['id'],since,until)
    if not target:
        # 找不到归属对象时不臆造写入：报告已上传留档，回执标明未回填。
        receipt.update(status='uploaded_no_link',project_id=p['id'],report_id=key,
                       note='项目主表无汇报链接列，且该项目没有可挂载的里程碑；报告已上传未回填')
        n.save(receipt_file,receipt)
        return receipt
    role,field_id,record_id,label=target
    # 写回前先登记 in_flight：若写接口已生效但响应丢失，重试必须能核验到「链接已是本轮 URL」，
    # 否则会重复上传同一份报告，或者在链接已被本轮改写时误判为「被他人更新」。
    receipt['in_flight']={'step':'writeback','role':role,'field':field_id,'record':record_id,'url':receipt['url']}
    n.save(receipt_file,receipt)
    # 回填链接走 table_write，同样可能「写了没核到」。报告已经上传成功了，
    # 这里绝不能因为回读延迟把整份汇报标成失败——但也不能假装确认过。
    # 记 pending_verify，让「回填未确认」这件事可见，由核验流程收尾。
    link_write=table_write(config,gw,role,{field_id:receipt['url']},record_id)
    if link_write.get('verify_pending'):
        receipt['pending_verify']={'table_writes/'+str(record_id):{
            'record_id':record_id,
            'title':label,
            'reason':'汇报链接已回填但回读未确认（钉钉写后可见性延迟）',
            'how_to_verify':'按 record_id='+str(record_id)+' 到'+str(label)+'核对汇报链接',
        }}
    receipt.update(status='pending_verify' if link_write.get('verify_pending') else 'verified',
                   project_id=p['id'],report_id=key,
                   linked_table=role,linked_field=field_id,linked_record=record_id,linked_label=label)
    receipt.pop('in_flight',None)
    n.save(receipt_file,receipt)
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
