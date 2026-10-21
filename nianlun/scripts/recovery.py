"""Reconcile an existing growth run without sending any new business mutations."""
from pathlib import Path
import nianlun as n
import growth as g


def active_folder(config, run_id=None):
    pointer=g.root(config)/'active.json'
    if not pointer.exists():return None
    active=n.load(pointer);folder=Path(active['run_dir']).resolve()
    if run_id is not None and active.get('run_id')!=run_id:raise n.Error('原轮次已变化，请刷新')
    if not folder.is_relative_to(g.root(config)/'runs'):raise n.Error('轮次目录不在本工作空间')
    return folder


def overview(config):
    folder=active_folder(config)
    if not folder:return {'active':False}
    bundle=n.load(folder/'evidence.json')
    plan=n.load(folder/'plan.json') if (folder/'plan.json').exists() else {'actions':[]}
    receipt=n.load(folder/'receipt.json') if (folder/'receipt.json').exists() else {}
    finish=n.load(folder/'finish.json') if (folder/'finish.json').exists() else {}
    items=[{'op':a['op'],'title':a.get('title') or a.get('expected_title') or a.get('project',''),
            'status':'verified' if a['key'] in receipt.get('results',{}) else
                     'unknown' if a['key']==receipt.get('in_flight',{}).get('key') else 'pending'} for a in plan['actions']]
    if finish.get('in_flight'):items.append({'op':finish['in_flight']['step'],'title':'记忆归档' if finish['in_flight']['step']=='brain' else '本人摘要投递','status':'unknown'})
    return {'active':True,'run_id':bundle['run_id'],'items':items,'verified_count':len(receipt.get('results',{})),
            'needs_reconciliation':bool((receipt.get('in_flight') and not receipt['in_flight'].get('resume_records')) or finish.get('in_flight')),
            'error':receipt.get('error',''),'since':bundle.get('since'),'until':bundle.get('until')}


def reconcile(config, run_id):
    with g.locked(config):
        folder=active_folder(config,run_id)
        if folder is None:raise n.Error('原轮次已结束，请刷新')
        bundle=n.load(folder/'evidence.json')
        if bundle['binding']!=n.digest(config):raise n.Error('业务绑定已变化，保留原轮次')
        gw=g.Gateway(config)
        if g.self_identity(gw)!=bundle['identity']:raise n.Error('组织身份已变化，未核验')
        path=folder/'receipt.json';receipt=n.load(path) if path.exists() else {}
        pending=receipt.get('in_flight')
        if pending:
            plan=n.load(folder/'plan.json');decision=plan['decision']
            fresh=g.validate(config,bundle,decision)
            for new,old in zip(fresh['actions'],plan['actions']):
                if 'table_plan' in new:new['table_plan']['created_at']=old['table_plan']['created_at']
            if fresh!=plan or receipt.get('plan_hash')!=n.digest(plan):raise n.Error('原计划已变化，未核验')
            action=next((a for a in plan['actions'] if a['key']==pending['key']),None)
            if action is None or action!=pending.get('action'):raise n.Error('原动作回执不一致')
            key=action['key'];op=action['op'];result=None
            if op in ('create_record','update_status'):
                result=n.reconcile_plan(config,gw.table(),action['table_plan'],folder/(key+'.receipt.json'))
            elif op=='create_milestone':
                state=n.fetch(config,gw.table());marker='[年轮来源:'+key+']'
                f=config['tables']['milestones']['fields'];field='notes' if 'notes' in f else 'description'
                matches=[r for r in state['milestones'] if marker in r.get(field,'')]
                values={'title':action['title'],'date':action['date'],'status':'待核','description':action['description'],
                        'project_ids':{'linkedRecordIds':[action['project_id']]}}
                values[field]=((action['description']+'\n') if field=='description' else '')+action['quote']+'\n来源：'+action['source_id']+'\n'+marker
                if len(matches)!=1 or not all(n.equivalent(matches[0]['raw_cells'].get(f[k]['fieldId']),v) for k,v in values.items()):
                    raise n.Error('里程碑未唯一匹配原标记与字段，保留待核，未重复创建')
                result={'record_id':matches[0]['id'],'already_present':True,'verified':True}
            elif op=='create_todo':
                tid=pending.get('task_id')
                if not tid:raise n.Error('原待办创建未返回编号，无法凭标题认定为同一任务。保留待核，未重复创建。')
                todo=gw.call(['todo','+get','--task-id',str(tid)]);title='['+action['project']+'] '+action['title']
                if str(todo.get('taskId'))!=str(tid) or todo.get('subject')!=title:raise n.Error('原待办编号或标题不匹配')
                result={'task_id':str(tid),'title':title,'verified':True}
                links_path=g.root(config)/'links.json';links=n.load(links_path) if links_path.exists() else {}
                ids=list(action.get('record_ids',[]))
                if action.get('record_action_key'):ids += [r['record_id'] for r in receipt['results'][action['record_action_key']]['results']]
                links[str(tid)]={'project_id':action['project_id'],'record_ids':ids,'source_id':action['source_id'],'title':title}
                n.save(links_path,links)
            elif op=='complete_todo':
                todo=gw.call(['todo','+get','--task-id',action['task_id']])
                if str(todo.get('taskId'))!=str(action['task_id']) or todo.get('subject')!=action['expected_title'] or todo.get('isDone') is not True:
                    raise n.Error('原待办尚未验证为完成，保留待核')
                # Resume only the existing record steps; completion itself is already proven.
                pending.update(todo_verified=True,resume_records=True)
            else:raise n.Error('此动作暂不支持自动核验，保留原回执')
            if not path.with_suffix('.before-reconcile.json').exists():n.save(path.with_suffix('.before-reconcile.json'),n.load(path))
            if result is not None:
                receipt['results'][key]=result;receipt.pop('in_flight')
            receipt['status']='verified' if len(receipt.get('results',{}))==len(plan['actions']) else 'running'
            receipt.pop('error',None);receipt['reconciled_at']=n.stamp(config);n.save(path,receipt)
        finish_path=folder/'finish.json';finish=n.load(finish_path) if finish_path.exists() else {}
        unknown=finish.get('in_flight')
        if unknown:
            if unknown.get('step')!='brain':raise n.Error('摘要发送未返回投递句柄，无法可靠核验；保留待核，未重复发送')
            import memory
            page=Path(unknown['source_file']).resolve()
            if not page.is_relative_to(folder):raise n.Error('记忆来源不在原轮次中')
            expected=page.read_text(encoding='utf-8').split('---',2)[-1].strip()
            check=memory.run(config,['get',unknown['slug']])
            if not expected or check.returncode or expected not in check.stdout:raise n.Error('原记忆正文尚未通过回读，保留待核')
            if not finish_path.with_suffix('.before-reconcile.json').exists():n.save(finish_path.with_suffix('.before-reconcile.json'),finish)
            finish['brain']={'slug':unknown['slug'],'verified':True};finish.pop('in_flight');n.save(finish_path,finish)
        return {**overview(config),'message':'原结果核验完成，未重新提交。可以继续原轮次尚未完成的步骤。'}
