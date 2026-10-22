"""Read-only detail and inventory adapters for the workspace explorer."""
import json
import re
import threading
import time
import concurrent.futures
from urllib.parse import urlsplit
import nianlun as n
import growth as g
import memory


def safe_url(value):
    if not isinstance(value, str): return None
    parts = urlsplit(value)
    return value if parts.scheme in ('https', 'dingtalk') and parts.netloc and not parts.username else None


def todo_detail(work, task_id, completed=False):
    if not isinstance(task_id, str) or not task_id or len(task_id)>300:
        raise n.Error('待办编号无效')
    _, gw, _ = work.connection()
    # Scope the detail to the same profile's current execution list before reading it.
    own = g.complete(gw.call(['todo','+get-my-tasks','--all','--status','true' if completed else 'false']), 'todos')
    if task_id not in {str(t['taskId']) for t in own}:
        raise n.Error('待办已变化或不在当前列表，请刷新后重试')
    row = gw.call(['todo','+get','--task-id',task_id])
    if str(row.get('taskId')) != task_id:
        raise n.Error('待办详情未通过编号核验')
    def names(key):
        return [str(p.get('name') or '未提供姓名') for p in row.get(key,[]) if isinstance(p,dict)]
    detail = row.get('detailUrl',{})
    links = [safe_url(v) for v in detail.values()] if isinstance(detail,dict) else [safe_url(detail)]
    activities = [{'action':str(a.get('action','')), 'comment':str(a.get('comment',''))[:10000]}
                  for a in row.get('activities',[]) if isinstance(a,dict)]
    return {'id':task_id,'title':row.get('subject',''),'description':row.get('description') or row.get('content') or '',
            'due':row.get('dueTime'),'priority':row.get('priority'),'completed':row.get('isDone') is True,
            'created':row.get('createdTime'),'modified':row.get('modifiedTime'),
            'creator':(row.get('creatorInfo') or {}).get('name','未提供姓名'),
            'executors':names('executorInfos'),'participants':names('participantInfos'),
            'activities':activities,'links':list(dict.fromkeys(x for x in links if x)),
            'attachments':[{'name':str(a.get('name') or a.get('fileName') or '附件')} for a in row.get('attachments',[]) if isinstance(a,dict)]}


def parse_inventory(raw):
    raw=raw.strip()
    if not raw:return []
    if raw[0] in '[{':
        try:value=json.loads(raw)
        except ValueError:raise n.Error('记忆目录无法解析，未按空目录处理')
        rows=value if isinstance(value,list) else value.get('pages',value.get('results'))
        if not isinstance(rows,list):raise n.Error('记忆目录格式不兼容')
        if any(not isinstance(p,dict) or not isinstance(p.get('slug'),str) for p in rows):raise n.Error('记忆目录缺少页面编号')
        return [{'slug':p['slug'],'title':p.get('title') or p['slug'],'type':p.get('type','note'),
                 'updated':p.get('updated_at',p.get('updated','')),'source_id':p.get('source_id')} for p in rows]
    pages=[]
    # GBrain 0.51 list is TSV even with --json. Do not parse human error output as pages.
    for line in raw.splitlines():
        parts=line.split('\t',3)
        if len(parts)!=4 or not parts[0] or not re.match(r'^\d{4}-\d\d-\d\d',parts[2]):
            raise n.Error('记忆目录格式不兼容，未把错误当作页面')
        pages.append(dict(zip(('slug','type','updated','title'),parts)))
    return pages


class MemoryExplorer:
    def __init__(self, config_path):
        self.config_path=config_path; self.cache={}; self.allowed={}; self.links_cache={}; self.lock=threading.RLock();self.scope=None
    def config(self):
        config=n.load(self.config_path)
        scope=n.digest(config.get('growth',{}))
        if scope!=self.scope:
            self.cache.clear();self.allowed.clear();self.links_cache.clear();self.scope=scope
        return config
    def catalog(self, offset=0):
        if type(offset) is not int or not 0<=offset<=10000:raise n.Error('记忆分页范围无效')
        with self.lock:
            config=self.config()
            cached=self.cache.get(offset)
            if cached and time.monotonic()-cached[0]<120:return cached[1]
            # The raw read operation preserves source_id; the human list command's TSV does not.
            result=memory.run(config,['call','list_pages',json.dumps({'limit':121,'offset':offset,'sort':'updated_desc'})],timeout=45)
            if result.returncode:raise n.Error('独立记忆空间目录读取失败，请检查连接')
            pages=parse_inventory(result.stdout);more=len(pages)>120;pages=pages[:120]
            for p in pages:
                p['key']=n.digest([p.get('source_id'),p['slug']])[:24]
                self.allowed[p['key']]=p
            value={'pages':pages,'has_more':more,'next_offset':offset+len(pages),
                   'scope':'当前已连接的独立记忆空间；按最近更新分页。项目分组按标题匹配，不代表页面之间存在引用。'}
            self.cache[offset]=(time.monotonic(),value);return value
    def resolve(self, slug=None, key=None):
        if key is not None:
            meta=self.allowed.get(key) if isinstance(key,str) else None
        else:
            matches=[p for p in self.allowed.values() if p['slug']==slug]
            meta=matches[0] if len(matches)==1 else None
        if not meta or meta['slug'].startswith('-'):raise n.Error('请从当前记忆目录选择页面')
        return meta
    def page(self,slug=None,key=None):
        with self.lock:
            config=self.config();meta=self.resolve(slug,key);scope=self.scope
        args=['get',meta['slug']]+(['--source',meta['source_id']] if meta.get('source_id') else [])
        result=memory.run(config,args,timeout=45)
        if result.returncode:raise n.Error('记忆正文读取失败，请稍后重试')
        text=result.stdout[:60000]
        refs=re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]',text)
        with self.lock:
            self.config()
            if self.scope!=scope:raise n.Error('记忆连接已变化，请刷新目录')
        return {**meta,'text':text,'full_page':len(result.stdout)<=60000,
                'references':list(dict.fromkeys(refs)),'note':'正文超过展示上限' if len(result.stdout)>60000 else ''}

    def relations(self, keys):
        """Bounded, cached reads of explicit links. No extraction, embedding or writes."""
        if not isinstance(keys,list) or not 1<=len(keys)<=6 or any(not isinstance(k,str) for k in keys):
            raise n.Error('每批最多读取 6 篇已载入记忆的引用')
        with self.lock:
            config=self.config();scope=self.scope
            metas=[self.resolve(key=k) for k in dict.fromkeys(keys)]
        def read(meta):
            key=meta['key']
            with self.lock:cached=self.links_cache.get(key)
            if cached and time.monotonic()-cached[0]<300:return cached[1]
            params={'slug':meta['slug']}
            if meta.get('source_id'):params['source_id']=meta['source_id']
            try:
                result=memory.run(config,['call','get_links',json.dumps(params)],timeout=20)
                if result.returncode:raise ValueError('read failed')
                rows=json.loads(result.stdout)
                if not isinstance(rows,list):raise ValueError('unsupported link response')
                edges=[];seen=set();truncated=len(rows)>500
                for row in rows[:500]:
                    if not isinstance(row,dict) or not isinstance(row.get('to_slug'),str) or row.get('from_slug')!=meta['slug']:
                        raise ValueError('unsupported link row')
                    if row.get('from_source_id') and meta.get('source_id') and row['from_source_id']!=meta['source_id']:
                        continue
                    target=(row.get('to_source_id'),row['to_slug'])
                    if target not in seen:
                        seen.add(target);edges.append({'slug':target[1],'source_id':target[0],
                            'type':str(row.get('link_type') or 'reference')[:100]})
                    truncated=truncated or row.get('truncated') is True
                value={'key':key,'links':edges,'verified':True,'truncated':truncated}
                with self.lock:
                    if self.scope==scope:self.links_cache[key]=(time.monotonic(),value)
                return value
            except Exception:
                # A missing or incompatible index is not evidence of zero links; retry remains available.
                return {'key':key,'verified':False,'error':'引用索引暂未读到，可重试；仍可阅读正文。'}
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(read,metas))
        with self.lock:
            self.config()
            if self.scope!=scope:raise n.Error('记忆连接已变化，请刷新目录')
        return {'pages':results}
