"""Shared due-work dispatcher. Host adapters verify the wake-up owner."""
import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
import flow
import growth as g
import nianlun as n
import host_bridge
from file_lock import file_lock

WEEKDAYS=('MO','TU','WE','TH','FR','SA','SU')


def due_slots(schedule, now, activated_at):
    """At most one catch-up per role in the last day; never replay before activation."""
    if schedule.get('enabled',True) is False:return []
    zone=ZoneInfo(schedule['timezone']);now=now.astimezone(zone)
    start=max(activated_at.astimezone(timezone.utc),now.astimezone(timezone.utc)-timedelta(hours=24))
    candidates=[]
    for days in (1,0):
        date=(now-timedelta(days=days)).date()
        hours=[('growth',h) for h in schedule['growth_hours']]
        if WEEKDAYS[date.weekday()]==schedule['report_weekday']:hours.append(('report',schedule['report_hour']))
        for role,hour in hours:
            slot=datetime(date.year,date.month,date.day,hour,tzinfo=zone)
            # Nonexistent DST hours are skipped, not silently shifted.
            if slot.astimezone(timezone.utc).astimezone(zone)!=slot:continue
            if start<=slot.astimezone(timezone.utc)<=now.astimezone(timezone.utc):
                candidates.append({'role':role,'at':slot.isoformat(),'key':role+':'+slot.isoformat()})
    latest={x['role']:x for x in sorted(candidates,key=lambda x:x['at'])}
    return sorted(latest.values(),key=lambda x:(x['at'],x['role']))


def tick(config_path, binary=None, now=None, owner='codex'):
    from setup import Setup, default_home
    config_path=Path(config_path).expanduser().resolve();config=n.load(config_path)
    state=Path(config['growth']['state_dir']);schedule=config['growth']['schedule']
    if schedule.get('enabled',True) is False:return {'status':'paused','runs':[]}
    receipt_path=state/'scheduler.json'
    if not receipt_path.exists():raise n.Error('控制器尚未接入，请在所选宿主完成定时接入')
    receipt=n.load(receipt_path)
    actual_owner=receipt.get('owner','codex')
    if owner!=actual_owner:raise n.Error('此安装由 '+actual_owner+' 唤醒；不能同时启用另一宿主的控制器')
    if actual_owner=='codex':
        if receipt.get('mode')!='controller':raise n.Error('当前为旧版固定调度，请先通过 Codex 迁移到页面控制器')
        native=Path(os.environ.get('CODEX_HOME',Path.home()/'.codex'))/'automations'
        verified=Setup(default_home(),config_path).verify_schedules([native/x/'automation.toml' for x in receipt['automation_ids']])
    else:
        if receipt.get('mode')!='host_managed':raise n.Error('外部宿主控制器尚未选择')
        verified=receipt
    now=now or datetime.now(timezone.utc)
    activated=datetime.fromisoformat(verified['activated_at'])
    # Separate lock serializes controllers. Individual business steps retain the existing growth lock.
    with file_lock(state/'controller.lock'):
        ledger_path=state/'controller.json';ledger=n.load(ledger_path) if ledger_path.exists() else {'slots':{}}
        slots=due_slots(schedule,now,activated);runs=[]
        # Finish a delegated slot before starting a newer slot of the same role.
        for old in sorted(ledger['slots'].values(),key=lambda x:x['at']):
            if old.get('status') in ('waiting_harness','failed','running'):
                slots=[x for x in slots if x['role']!=old['role']]
                slots.insert(0,{k:old[k] for k in ('role','at','key')})
        for slot in slots:
            previous=ledger['slots'].get(slot['key'],{})
            if previous.get('status') in ('complete','skipped'):continue
            item={**slot,'status':'running','started_at':now.isoformat()}
            ledger['slots'][slot['key']]=item;n.save(ledger_path,ledger)
            try:
                if slot['role']=='growth':result=flow.grow(config_path,binary)
                elif not config['growth']['switches'].get('reports'):
                    item['status']='skipped';result={'reason':'阶段汇报开关已关闭'}
                else:
                    until=datetime.fromisoformat(slot['at']).date()
                    result=flow.reports(config_path,str(until-timedelta(days=7)),str(until),binary)
                if item['status']!='skipped':item['status']='complete'
                item['result']=result
            except host_bridge.Waiting as exc:
                item.update(status='waiting_harness',handoff=exc.request)
            except Exception as exc:
                item.update(status='failed',error=str(exc)[:2000])
            item['finished_at']=datetime.now(timezone.utc).isoformat();n.save(ledger_path,ledger);runs.append(item)
        # Keep operational receipts, without making a second store of project data.
        ledger['slots']={k:v for k,v in ledger['slots'].items() if v['status'] not in ('complete','skipped') or datetime.fromisoformat(v['at'])>now-timedelta(days=60)}
        ledger['last_checked_at']=now.isoformat();n.save(ledger_path,ledger)
        if actual_owner!='codex':
            verified['last_observed_wake']=now.isoformat();n.save(receipt_path,verified)
        status='failed' if any(x['status']=='failed' for x in runs) else 'waiting_harness' if any(x['status']=='waiting_harness' for x in runs) else 'processed' if runs else 'idle'
        return {'status':status,'notify':any(x.get('status') in ('failed','waiting_harness') or x.get('result',{}).get('notify',False) for x in runs),'runs':runs}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--config',default=str(Path.home()/'.config/nianlun/config.json'))
    parser.add_argument('command',choices=['tick']);args=parser.parse_args()
    try:
        result=tick(args.config);print(json.dumps(result,ensure_ascii=False));return 1 if result['status']=='failed' else 0
    except (n.Error,OSError,ValueError) as exc:print(str(exc),file=sys.stderr);return 1

if __name__=='__main__':sys.exit(main())
