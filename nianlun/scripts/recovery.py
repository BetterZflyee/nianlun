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
    results=receipt.get('results',{}) or {}
    pending=receipt.get('pending_verify',{}) or {}
    in_flight=receipt.get('in_flight',{}) or {}

    def status_of(action):
        # 三层含义必须能分开，否则用户没法判断「要不要动手」：
        #   verified       —— 写成功且已回读确认
        #   pending_verify —— **写已发生**（拿到 record_id），但回读还没确认
        #                     （钉钉写后可见性延迟实测可达 539 秒）
        #   unknown        —— 动作发起了，但连有没有写成都不知道
        # 原来只有 verified/unknown/pending 三档，pending_verify 一律显示成
        # verified（因为结果已进 results）或 unknown（因为还在 in_flight），
        # 两种都误导：前者把「没确认」装成「没问题」，后者把「数据已在」说成「可能啥都没发生」。
        key=action.get('key')
        recorded=results.get(key)
        if isinstance(recorded,dict):
            if recorded.get('verify_pending') or recorded.get('verified') is False:
                return 'pending_verify'
            return 'verified'
        # pending_verify 的键是 marker（create_record）或 role/id（update_status），
        # 与 action['key'] 不是同一套命名——必须按 record_id 兜一层，
        # 否则明明「写了没核到」会被显示成 pending（未开始），比 unknown 更误导。
        rid=None
        if key==in_flight.get('key'):
            rid=in_flight.get('record_id')
        else:
            for info in pending.values():
                if (info or {}).get('title')==(action.get('title') or action.get('expected_title')):
                    return 'pending_verify'
        if rid:
            return 'pending_verify'
        if key==in_flight.get('key'):
            return 'unknown'
        return 'pending'

    items=[{'op':a['op'],'title':a.get('title') or a.get('expected_title') or a.get('project',''),
            'status':status_of(a)} for a in plan['actions']]
    for key,info in pending.items():
        # 计划里没有、但回执里记了待核的，也要看得见——否则这条就蒸发了。
        if not any(i.get('title')==info.get('title') for i in items):
            items.append({'op':'verify','title':info.get('title',''),'status':'pending_verify',
                          'record_id':info.get('record_id')})
    if finish.get('in_flight'):items.append({'op':finish['in_flight']['step'],'title':'记忆归档' if finish['in_flight']['step']=='brain' else '本人摘要投递','status':'unknown'})
    # pending_verify 也要能被 reconcile 收尾，所以同样计入 needs_reconciliation。
    needs=bool((in_flight and not in_flight.get('resume_records')) or finish.get('in_flight') or pending)
    return {'active':True,'run_id':bundle['run_id'],'items':items,'verified_count':len(results),
            'pending_verify_count':sum(1 for i in items if i['status']=='pending_verify'),
            'needs_reconciliation':needs,
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
        verify_only=dict(receipt.get('pending_verify') or {})
        if verify_only:
            # P0-b：写成功但回读没确认的那些，走这里落成 verified。
            # **只回读、不重写**——reconcile_plan 本身就是 read-only 设计
            # （docstring: "Read only from DWS"），recovery 里对里程碑也是
            # 「未唯一匹配就保留待核，未重复创建」。所以这条路不可能产生重复记录。
            plan=n.load(folder/'plan.json')
            by_key={a['key']:a for a in plan['actions']}

            # ⚠️ `pending_verify` 的键是 **marker**（`[年轮来源:...]`）或 `role/id`，
            # 而 `action['key']` 是整轮动作的 sha256——两套完全不同的命名。
            # 2026-11-16 实测真实 plan：
            #   action.key     = 196ac5a8078bbcd1d5c4a52480808b16213f44bd...
            #   内层 marker    = [年轮来源:0ffb63b2d27a611273f5d47f010e777b...
            #   by_key.get(marker) → None → continue → **那条待核记录静默蒸发**，
            #   连「仍有 N 条待核」的提示都不会有。
            # 这正是本次要修的「可恢复的被显示成不可恢复」，换了个地方重演。
            def find_action(pending_key):
                hit=by_key.get(pending_key)
                if hit is not None:return hit
                for candidate in plan['actions']:
                    for inner in ((candidate.get('table_plan') or {}).get('actions') or []):
                        if inner.get('marker')==pending_key:return candidate
                    # update_status 的键是 role/record_id
                    if (str(candidate.get('role') or '')+'/'+str(candidate.get('record_id') or ''))==pending_key:
                        return candidate
                return None

            still={}
            recovered={}
            for key,info in verify_only.items():
                action=find_action(key)
                if action is None:
                    # 查不到也不能丢：留在 still 里并说明原因，让「仍有待核」可见。
                    still[key]={**info,'last_error':'回执与当前计划无法对应（可能计划已更新）；记录已在表中，按 record_id 核对，不要重做'}
                    continue
                try:
                    if action['op'] in ('create_record','update_status'):
                        result=n.reconcile_plan(config,gw.table(),action['table_plan'],folder/(key+'.receipt.json'))
                        rid=(result.get('results') or [{}])[0].get('record_id')
                        # `results` 的键必须用 action['key']（整轮动作 sha256），
                        # 因为 overview 是按 action['key'] 查 verified 的。
                        # 用 marker 当键会让「已核销」在页面上依然显示成待核。
                        recovered[action['key']]={'status':'verified','record_id':rid,'title':info.get('title','')}
                    else:
                        still[key]=info
                except n.Error as exc:
                    # 还读不到就继续待核——不重写、不放弃。
                    still[key]={**info,'last_error':str(exc)[:200]}
            if recovered:
                results=receipt.setdefault('results',{})
                for key,value in recovered.items():
                    results[key]=value
                receipt['pending_verify']=still
                if not still:receipt['status']='verified'
                if not path.with_suffix('.before-reconcile.json').exists():n.save(path.with_suffix('.before-reconcile.json'),n.load(path))
                n.save(path,receipt)
            if still:
                raise n.Error('仍有 '+str(len(still))+' 条已写入但未回读确认；数据已在表中，稍后再核验即可，不要重做')
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
