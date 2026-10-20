"""Browser operations over the user's existing DWS tables. No business database."""
import json
import re
import subprocess
import uuid
from datetime import datetime
from pathlib import Path

import nianlun as n
import growth as g
from file_lock import file_lock


def text(value, label, limit=20000, required=False):
    if not isinstance(value, str) or len(value) > limit or (required and not value.strip()):
        raise n.Error(label + ' 内容为空、格式错误或过长')
    return value.strip()


def request_id(value):
    try:
        return str(uuid.UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise n.Error('请求编号无效，请刷新后重试')


def revision(row):
    return n.digest(row['raw_cells'])


class Workbench:
    def __init__(self, config_path, gateway_factory=g.Gateway):
        self.config_path = Path(config_path).expanduser().resolve()
        self.gateway_factory = gateway_factory

    def connection(self):
        if not self.config_path.exists():
            raise n.Error('请先完成 AI 表格绑定')
        config = n.load(self.config_path)
        gw = self.gateway_factory(config)
        identity = g.self_identity(gw)
        return config, gw, identity

    def snapshot(self):
        config, gw, identity = self.connection()
        state = n.fetch(config, gw.table())
        for role in n.ROLES:
            for row in state[role]:
                row['revision'] = revision(row)
                row.pop('raw_cells', None)
        state.update(identity=identity, fields={r:t['fields'] for r,t in config['tables'].items()})
        return state

    def todos(self):
        config, gw, _ = self.connection()
        rows = g.complete(gw.call(['todo','+get-my-tasks','--all','--status','false']), 'todos')
        path = g.root(config)/'links.json'
        links = n.load(path) if path.exists() else {}
        # Return only fields needed by the page, never task API credentials or attachment tokens.
        return {'complete':True, 'todos':[{
            'id':str(row['taskId']), 'title':row['subject'], 'due':row.get('dueTime'),
            'priority':row.get('priority'), 'link':links.get(str(row['taskId']))} for row in rows]}

    def cells(self, config, state, role, values, creating):
        if role not in n.ROLES or not isinstance(values, dict):
            raise n.Error('未知的表单类型')
        fields = config['tables'][role]['fields']
        allowed = set(fields) - {'number','updated','owner','attachments','report'}
        if not values or set(values)-allowed:
            raise n.Error('包含不支持的字段')
        if creating and not values.get('title'):
            raise n.Error('请填写名称')
        result = {}
        for key, value in values.items():
            field = fields[key]
            if key.endswith('_ids'):
                target = {'project_ids':'projects','site_ids':'sites','milestone_ids':'milestones'}[key]
                if not isinstance(value,list) or any(not isinstance(x,str) for x in value) or len(set(value))!=len(value):
                    raise n.Error('关联对象格式无效')
                if set(value)-{r['id'] for r in state[target]}:
                    raise n.Error('关联对象已不存在，请刷新')
                if not field.get('config',{}).get('multiple',False) and len(value)>1:
                    raise n.Error('这个字段只允许关联一个对象')
                value = {'linkedRecordIds':value}
            elif field['type']=='singleSelect':
                if value not in [x['name'] for x in field.get('config',{}).get('options',[])]:
                    raise n.Error(field['fieldName']+' 不是表中已有选项')
            elif field['type']=='date':
                if value:
                    try: datetime.strptime(value,'%Y-%m-%d')
                    except (ValueError,TypeError): raise n.Error('日期须为 YYYY-MM-DD')
                else: value = None
            elif field['type']=='text':
                value = text(value,field['fieldName'],required=key=='title',limit=300 if key=='title' else 20000)
            else:
                raise n.Error(field['fieldName']+' 尚不支持从工作台编辑，请在 AI 表格中操作')
            result[field['fieldId']] = value
        return result

    def mutate(self, data):
        key = request_id(data.get('request_id'))
        config, gw, identity = self.connection()
        # Use the same lock as growth: manual operations never race an automatic commit.
        with g.locked(config):
            path = g.root(config)/'workbench'/('request-'+key+'.json')
            intent = {'binding':n.digest(config), 'identity':identity, 'request':data}
            receipt = n.load(path) if path.exists() else {'intent':intent,'steps':{},'created_at':n.stamp(config)}
            if receipt['intent'] != intent:
                raise n.Error('请求编号已用于其他内容，不能覆盖回执')
            if receipt.get('status')=='verified':
                return receipt['result']
            # Store the write intent before invoking any provider.
            n.save(path,receipt)
            try:
                result = self._mutate(config,gw,data,path,receipt)
                receipt.update(status='verified',result=result,finished_at=n.stamp(config))
                receipt.pop('error',None)
                n.save(path,receipt)
                return result
            except Exception as exc:
                receipt.update(status='stopped',error=str(exc))
                n.save(path,receipt)
                raise

    def table_step(self, config, gw, role, cells, rid, step_key, path, receipt):
        steps = receipt['steps']
        step = steps.get(step_key)
        if step and step.get('status')=='verified': return step['result']
        if step:
            # Unknown creates are reconciled by exact cells; ambiguity never triggers another create.
            rows = gw.table().records(config['base_id'], config['tables'][role]['id'])
            matches = [r for r in rows if (not step.get('record_id') or r['recordId']==step['record_id'])
                       and all(n.equivalent(r['cells'].get(k),v) for k,v in cells.items())]
            if len(matches)!=1:
                raise n.Error('上次写入结果待核验；未重复提交。请检查执行记录和 AI 表格')
            rid = matches[0]['recordId']
        else:
            step = {'status':'in_flight','role':role,'cells':cells,'record_id':rid}
            steps[step_key] = step; n.save(path,receipt)
            if rid:
                gw.call(['aitable','+record-update','--base-id',config['base_id'],'--table-id',config['tables'][role]['id'],
                         '--records',json.dumps([{'recordId':rid,'cells':cells}],ensure_ascii=False),'--yes'])
            else:
                payload = path.parent/(path.stem+'-'+step_key+'-cells.json')
                n.save(payload,[{'cells':cells}])
                response = gw.call(['aitable','record','create','--base-id',config['base_id'],
                    '--table-id',config['tables'][role]['id'],'--records-file',str(payload),'--yes'])
                ids = response.get('newRecordIds',[])
                if len(ids)!=1: raise n.Error('写入返回的记录编号不明确，请核验结果')
                rid = ids[0]; step['record_id'] = rid; n.save(path,receipt)
            rows = gw.call(['aitable','+record-query','--base-id',config['base_id'],
                '--table-id',config['tables'][role]['id'],'--record-ids',rid]).get('records',[])
            if len(rows)!=1 or rows[0]['recordId']!=rid or not all(n.equivalent(rows[0]['cells'].get(k),v) for k,v in cells.items()):
                raise n.Error('写入后回读不一致，请核验结果')
        result = {'record_id':rid,'role':role,'verified':True,'url':n.table_url(config,role)}
        step.update(status='verified',result=result); n.save(path,receipt)
        return result

    def _mutate(self, config, gw, data, path, receipt):
        op = data.get('op')
        if op in ('create','update'):
            role = data.get('role')
            if role not in n.ROLES: raise n.Error('不支持的子表')
            state = n.fetch(config,gw.table())
            if not state['complete']:raise n.Error('项目表读取不完整，暂不提交修改，请刷新后重试')
            values = data.get('values',{})
            rid = data.get('record_id') if op=='update' else None
            if op=='update' and not receipt['steps']:
                rows = [r for r in state[role] if r['id']==rid]
                if len(rows)!=1 or revision(rows[0])!=data.get('revision'):
                    raise n.Error('这条数据已被其他人修改，请刷新后重新编辑')
            if op=='create' and not receipt['steps']:
                same = [r for r in state[role] if r.get('title')==values.get('title')
                        and (role=='projects' or set(r.get('project_ids',[]))==set(values.get('project_ids',[])))]
                if same: raise n.Error('已有同名对象，请先打开它，避免重复建档')
            cells = self.cells(config,state,role,values,op=='create')
            if role!='projects' and op=='create' and not values.get('project_ids'):
                raise n.Error('请关联项目后保存')
            project_ids = values.get('project_ids')
            previous=next((r for r in state[role] if r['id']==rid),{}) if rid else {}
            if project_ids is None and rid:
                project_ids = previous.get('project_ids',[])
            for relation,target in (('site_ids','sites'),('milestone_ids','milestones')):
                for related in values.get(relation,previous.get(relation,[])):
                    row = next(r for r in state[target] if r['id']==related)
                    if not set(project_ids or []) & set(row.get('project_ids',[])):
                        raise n.Error('关联的场地或里程碑不属于这个项目')
            return self.table_step(config,gw,role,cells,rid,'table',path,receipt)
        if op=='create_todo': return self.create_todo(config,gw,data,path,receipt)
        if op=='complete_todo': return self.complete_todo(config,gw,data,path,receipt)
        raise n.Error('未知操作')

    def create_todo(self, config, gw, data, path, receipt):
        title = text(data.get('title'), '待办标题',300,True)
        state = n.fetch(config,gw.table())
        if not state['complete']:raise n.Error('项目表读取不完整，暂不创建待办')
        projects = [p for p in state['projects'] if p['id']==data.get('project_id')]
        if len(projects)!=1: raise n.Error('请选择一个已有项目')
        full_title = '['+projects[0]['title']+'] '+title
        record_ids = data.get('record_ids',[])
        if not isinstance(record_ids,list) or set(record_ids)-{r['id'] for r in state['records'] if projects[0]['id'] in r.get('project_ids',[])}:
            raise n.Error('待办关联记录不属于所选项目')
        due = data.get('due')
        if due:
            try:
                if datetime.fromisoformat(due).tzinfo is None: raise ValueError()
            except (ValueError,TypeError): raise n.Error('截止时间须包含时区')
        step = receipt['steps'].get('todo')
        if step:
            if not step.get('task_id'):
                raise n.Error('待办创建结果未知，先检查钉钉和执行记录；不会重复创建')
            tid = step['task_id']
        else:
            existing = g.complete(gw.call(['todo','+get-my-tasks','--all','--status','false']),'todos')
            if any(re.sub(r'\s','',t['subject'])==re.sub(r'\s','',full_title) for t in existing):
                raise n.Error('本人已有同名待办，请先查看该任务')
            step = {'status':'in_flight'}; receipt['steps']['todo']=step; n.save(path,receipt)
            args = ['todo','task','create','--title',full_title,'--executors',receipt['intent']['identity']['user_id'],'--priority','20']
            if due: args += ['--due',due]
            result = gw.call(args)
            tid = str(result.get('result',{}).get('taskId') or '')
            if not tid: raise n.Error('未返回真实待办编号，请检查提交状态')
            step['task_id']=tid; n.save(path,receipt)
        check=gw.call(['todo','+get','--task-id',tid])
        if str(check.get('taskId'))!=tid or check.get('subject')!=full_title:
            raise n.Error('待办回读不一致')
        linkpath=g.root(config)/'links.json'; links=n.load(linkpath) if linkpath.exists() else {}
        links[tid]={'project_id':projects[0]['id'],'record_ids':record_ids,'title':full_title,'source_id':'manual:'+data['request_id']}
        n.save(linkpath,links)
        step['status']='verified'; n.save(path,receipt)
        return {'task_id':tid,'title':full_title,'verified':True}

    def complete_todo(self, config, gw, data, path, receipt):
        tid = text(data.get('task_id'),'待办编号',200,True)
        check = gw.call(['todo','+get','--task-id',tid])
        if check.get('subject')!=data.get('title') or str(check.get('taskId'))!=tid:
            raise n.Error('待办内容已变化，请刷新')
        step = receipt['steps'].get('todo')
        if not step:
            current = g.complete(gw.call(['todo','+get-my-tasks','--all','--status','false']),'todos')
            if not any(str(t['taskId'])==tid for t in current):
                raise n.Error('此待办不在本人未完成列表，请刷新')
            linkpath=g.root(config)/'links.json'; links=n.load(linkpath) if linkpath.exists() else {}
            linked=links.get(tid,{})
            state=n.fetch(config,gw.table())
            target=[]
            for rid in linked.get('record_ids',[]):
                rows=[r for r in state['records'] if r['id']==rid and linked.get('project_id') in r.get('project_ids',[])]
                if len(rows)!=1: raise n.Error('待办关联的项目记录已变化，请先核验')
                target.append({'id':rid,'revision':revision(rows[0])})
            step={'status':'in_flight','records':target};receipt['steps']['todo']=step;n.save(path,receipt)
        if check.get('isDone') is not True:
            gw.call(['todo','+complete','--task-id',tid,'--yes'])
        check=gw.call(['todo','+get','--task-id',tid])
        if check.get('isDone') is not True: raise n.Error('待办完成状态未验证')
        step['status']='verified'; n.save(path,receipt)
        updated=[]
        for row in step.get('records',[]):
            state=n.fetch(config,gw.table())
            fresh=next((r for r in state['records'] if r['id']==row['id']),None)
            if not fresh: raise n.Error('待办已完成，但项目记录不存在；保留结果等待修复')
            if fresh.get('status')=='已解决': updated.append(row['id']);continue
            if revision(fresh)!=row['revision']:
                raise n.Error('待办已完成，但项目记录被修改；请核验后同步状态')
            cells=self.cells(config,state,'records',{'status':'已解决'},False)
            self.table_step(config,gw,'records',cells,row['id'],'record-'+row['id'],path,receipt)
            updated.append(row['id'])
        return {'task_id':tid,'verified':True,'completed_records':updated}

    def memory_query(self, query):
        import memory
        config, _, _ = self.connection()
        query=text(query,'检索词',1000,True)
        return memory.retrieve(config,query)
