"""Local stop intent, independent of frozen business bindings and native registration."""
import os
from pathlib import Path
import nianlun as n
from file_lock import file_lock


def paused(config):
    directory=config.get('growth',{}).get('state_dir')
    path=Path(directory)/'schedule-control.json' if directory else None
    return bool(path and path.exists() and n.load(path).get('paused'))


def set_paused(config, value):
    if type(value) is not bool:raise n.Error('请选择暂停或解除本机暂停')
    directory=config.get('growth',{}).get('state_dir')
    if not directory:raise n.Error('请先绑定工作空间')
    with file_lock(Path(directory)/'schedule-control.lock'):
        n.save(Path(directory)/'schedule-control.json',{'paused':value,'changed_at':n.stamp(config)})
    return {'paused':value,'message':'已暂停新的定时轮次；当前轮次及已提交结果保留，可手动核验恢复。' if value else '已解除本机暂停；实际运行仍取决于来源设置和宿主原生调度状态。'}


def status(config, home, config_path):
    from setup import Setup
    growth=config.get('growth',{});directory=growth.get('state_dir')
    if config_path is None:
        # Offline snapshots cannot verify a native task's config-path signature.
        return {'active':False,'registered':False,'status':'snapshot','message':'离线快照：运行状态请在本机工作台核验。','checked_at':n.stamp(config)}
    path=Path(directory)/'scheduler.json' if directory else None
    saved=n.load(path) if path and path.exists() else {}
    result={**saved,'active':False,'registered':False,'checked_at':n.stamp(config),
            'local_paused':paused(config),'enabled':growth.get('schedule',{}).get('enabled',True)}
    if not saved:
        result.update(status='not_connected',message='尚未接入宿主定时任务。');return result
    if saved.get('owner','codex')=='codex':
        native=Path(os.environ.get('CODEX_HOME',Path.home()/'.codex'))/'automations'
        ids=saved.get('automation_ids',[])
        if any(not isinstance(i,str) or Path(i).name!=i for i in ids):
            result.update(status='needs_verification',message='原生任务编号无效。');return result
        try:
            actual=Setup(home,config_path).verify_schedules([native/i/'automation.toml' for i in ids],allow_paused=True,persist=False)
            result.update(actual)
        except (n.Error,OSError,ValueError,KeyError) as exc:
            result.update(status='needs_verification',message='宿主定时任务待核验：'+str(exc));return result
    else:
        result.update(status='awaiting_host_verification',message='需在所选宿主核验周期任务；最近一次唤醒不代表仍在持续运行。')
        return result
    result['active']=bool(result.get('native_active') and result['enabled'] and not result['local_paused'])
    result['status']='active' if result['active'] else 'paused'
    result['message']=('定时生长已启用。' if result['active'] else
        '本机自动生长已暂停。' if result['local_paused'] or not result['enabled'] else '宿主原生任务已暂停。')
    return result
