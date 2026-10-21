"""Per-source watermarks and read-only Lark ingestion. No business writes here."""
import json
import os
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import nianlun as n

LABELS={'minutes':'钉钉听记','lark_minutes':'飞书妙记','mentions':'群聊 @我','groups':'指定群聊','mail':'本人邮箱',
        'direct':'单聊','harness':'宿主人类会话','workbench':'工作台操作'}


def runtime_status(config):
    state=Path(config.get('growth',{}).get('state_dir',''))
    if not config.get('growth',{}).get('state_dir'):return {'channels':{},'runs':[]}
    health_path=state/'source-health.json';ledger=state/'controller.json'
    result=n.load(health_path) if health_path.exists() else {'channels':{}}
    slots=n.load(ledger).get('slots',{}) if ledger.exists() else {}
    runs=sorted(slots.values(),key=lambda x:x['at'],reverse=True)[:20]
    if not health_path.exists():
        last=next((x for x in runs if x.get('result',{}).get('coverage')),None)
        if last:
            # Display real legacy coverage; this does not fabricate a new run or write a receipt.
            result=health({'run_id':last['result'].get('run_id',last['key']),
                           'until':last.get('finished_at',last['at']),'coverage':last['result']['coverage']},{})
    return {**result,'runs':runs}


class Incomplete(n.Error):
    def __init__(self, message, count=0):
        super().__init__(message);self.count=count


def window(settings, checkpoint, channel, end, explicit=None):
    if explicit:return explicit
    saved=checkpoint.get('channels',{}).get(channel,checkpoint if 'channels' not in checkpoint else {})
    value=saved.get('retry_since') or saved.get('until')
    start=datetime.fromisoformat(value) if value else end-timedelta(hours=24)
    if not saved.get('retry_since'):start-=timedelta(minutes=settings.get('overlap_minutes',30))
    # Revisit both today's and yesterday's meetings on every run, even after a missed morning wake.
    if channel in ('minutes','lark_minutes'):
        start=min(start,end-timedelta(hours=settings.get('minutes_lookback_hours',48)))
    return start


def advance(bundle, decision, previous):
    channels=dict(previous.get('channels',{}));deferred=set(decision.get('deferred_source_ids',[]))
    delayed=set()
    for item in bundle['sources']:
        if item['id'] in deferred:
            delayed.update(item.get('channels',list(LABELS)))  # Legacy evidence: retain every window.
    for coverage in bundle['coverage']:
        channel=coverage['channel']
        if channel not in LABELS:continue
        channels[channel]=({'retry_since':coverage.get('since',bundle['since'])}
            if coverage['status']!='complete' or channel in delayed else {'until':bundle['until']})
    return {'format':'nianlun-watermarks-v2','channels':channels}


def health(bundle, previous):
    channels=dict(previous.get('channels',{}))
    for item in bundle['coverage']:
        channel=item['channel'];old=channels.get(channel,{})
        # Finishing/recovering the same run must not count as another empty collection.
        if old.get('run_id')==bundle['run_id']:continue
        zero=item['status']=='complete' and item.get('count')==0
        channels[channel]={**item,'label':LABELS.get(channel,'待办回读'),'run_id':bundle['run_id'],
            'checked_at':bundle['until'],'last_success_at':bundle['until'] if item['status']=='complete' else old.get('last_success_at'),
            'consecutive_empty':old.get('consecutive_empty',0)+1 if zero else 0}
    return {'channels':channels,'checked_at':bundle['until']}


def lark_command(settings):
    binary=settings.get('lark_bin') or shutil.which('lark-cli')
    if not binary:
        candidate=Path.home()/'.nodejs/bin/lark-cli'
        if candidate.is_file():binary=str(candidate)
    if not binary:raise n.Error('未找到飞书 CLI；请先在当前电脑安装并登录 lark-cli')
    path=Path(binary).expanduser()
    if path.suffix.lower() in ('.cmd','.bat'):
        # The official npm package has the same Node entrypoint on Windows; never invoke a shell shim.
        entry=path.parent/'node_modules/@larksuite/cli/scripts/run.js'
        node=shutil.which('node')
        if not node or not entry.is_file():raise n.Error('未找到飞书 CLI 的 Node 入口；请修复 lark-cli 安装')
        return [node,str(entry)]
    return [str(path)]


def lark_read(settings,args,cwd):
    env={**os.environ,'LARKSUITE_CLI_NO_UPDATE_NOTIFIER':'1','LARKSUITE_CLI_NO_SKILLS_NOTIFIER':'1'}
    try:
        r=subprocess.run(lark_command(settings)+args+['--as','user','--format','json'],cwd=cwd,
                         capture_output=True,text=True,encoding='utf-8',timeout=180,env=env)
        raw=json.loads(r.stdout)
    except (OSError,ValueError,subprocess.TimeoutExpired) as exc:
        raise n.Error('飞书读取未确认；保留窗口下轮补采，不视为空列表') from exc
    if r.returncode or raw.get('ok') is not True or raw.get('identity')!='user':
        raise n.Error('飞书用户读取失败；请检查当前飞书登录、权限和网络，未切换身份')
    data=raw.get('data')
    if not isinstance(data,dict):raise n.Error('飞书返回结构不完整')
    return data


def lark_minutes(settings,start,end,folder,add):
    """Read only the current user's owned minutes, preserving the legacy opt-in scope."""
    folder=Path(folder)/'lark';folder.mkdir(parents=True,exist_ok=True)
    found={};errors=[];chunk=start
    while chunk<end:
        upper=min(chunk+timedelta(days=7),end);token=None;tokens=set()
        for _ in range(100):
            args=['minutes','+search','--owner-ids','me','--start',chunk.isoformat(),'--end',upper.isoformat(),'--page-size','30']
            if token:args+=['--page-token',token]
            try:
                data=lark_read(settings,args,folder)
                if not isinstance(data.get('items'),list) or type(data.get('has_more')) is not bool:
                    raise n.Error('妙记列表缺少完整性标识')
                for item in data['items']:
                    key=item.get('token') or item.get('minute_token')
                    if not key:raise n.Error('妙记缺少稳定编号')
                    found[key]=item
                if data['has_more'] is False:break
                token=data.get('page_token')
                if not token or token in tokens:raise n.Error('妙记分页缺游标或游标循环')
                tokens.add(token)
            except n.Error as exc:
                errors.append(str(exc));break
        else:errors.append('妙记分页达到上限，尚未覆盖全部结果')
        chunk=upper
    for token,item in found.items():
        try:
            data=lark_read(settings,['minutes','+detail','--minute-tokens',token,'--summary','--transcript',
                                     '--output-dir','artifacts','--overwrite'],folder)
            rows=data.get('minutes',[])
            if len(rows)!=1 or rows[0].get('minute_token')!=token:raise n.Error('妙记详情编号未核验')
            detail=rows[0];artifacts=detail.get('artifacts',{})
            filename=artifacts.get('transcript_file')
            if not filename:raise n.Error('妙记逐字稿未就绪')
            path=Path(filename);path=(path if path.is_absolute() else folder/path).resolve()
            if not path.is_relative_to(folder.resolve()):raise n.Error('逐字稿不在本轮输出目录')
            text=path.read_text(encoding='utf-8')
            if not text.strip():raise n.Error('妙记逐字稿为空')
            # A source ID stays stable across retries; content changes create a new version.
            add('lark_minutes',token,detail.get('title') or item.get('title') or '飞书妙记',text,
                item.get('create_time') or item.get('start_time') or '',item.get('url',''),
                content_kind='transcript',origin_time_known=bool(item.get('create_time') or item.get('start_time')))
        except (n.Error,OSError) as exc:errors.append(str(exc))
    if errors:raise Incomplete('; '.join(dict.fromkeys(errors)),len(found))
    return len(found)
