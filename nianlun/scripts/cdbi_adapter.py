"""CDBI is an optional read-only site source; writes use the existing AITable receipts."""
import json
import re
import subprocess
import uuid
from pathlib import Path
from urllib.parse import urlparse
import dependencies as deps
import dws_transport
import nianlun as n
import growth as g
from workbench import text,request_id


def binary(app):
    registry=app.home/'dependencies.json';saved=n.load(registry) if registry.exists() else {}
    value=saved.get('cdbi_bin') or deps.find_binary('cdbi')
    if not value or not Path(value).is_file():raise n.Error('未找到 CDBI CLI，请在接入与运行安装或选择可执行文件')
    return value


def call(app,args):
    result=subprocess.run([binary(app)]+args,capture_output=True,text=True,encoding='utf-8',timeout=120,env=dws_transport.environment())
    if result.returncode:raise n.Error('CDBI 读取失败，请检查丰声登录、网络和数据权限；未更改场地表')
    try:return json.loads(result.stdout)
    except ValueError:raise n.Error('CDBI 未返回有效 JSON，请更新 CLI；未把缺失结果当成空数据')


def install(home,url=None,sha256=None):
    home=Path(home);registry=home/'dependencies.json';saved=n.load(registry) if registry.exists() else {}
    existing=saved.get('cdbi_bin') or deps.find_binary('cdbi')
    if existing and deps.version([existing]):
        saved['cdbi_bin']=existing;n.save(registry,saved);return {'binary':existing,'reused':True}
    system,arch=deps.platform_key()
    manifest=home/'cdbi-downloads.json'
    spec=(n.load(manifest).get('assets',{}).get(system+'-'+arch) if manifest.exists() else None)
    if url or sha256:spec={'url':url,'sha256':sha256}
    if not spec:raise n.Error('当前系统缺少组织提供的 CDBI 下载地址与 SHA-256。请在接入向导填写；DWS 与独立记忆空间可继续使用')
    if not isinstance(spec.get('url'),str) or urlparse(spec['url']).scheme!='https' or not re.fullmatch('[0-9a-fA-F]{64}',str(spec.get('sha256',''))):
        raise n.Error('CDBI 下载需要组织官方 HTTPS 地址和 64 位 SHA-256')
    spec={**spec,'sha256':spec['sha256'].lower()};download=deps.download(spec,home/'downloads')
    target=home/'runtime'/'cdbi'/('cdbi.exe' if system=='windows' else 'cdbi');target.parent.mkdir(parents=True,exist_ok=True)
    import shutil
    shutil.copyfile(download,target);target.chmod(0o755)
    if not deps.version([str(target)]):raise n.Error('CDBI 文件校验通过，但无法在本系统启动，请核对下载平台')
    saved['cdbi_bin']=str(target);n.save(registry,saved);return {'binary':str(target),'verified':True}


def action(app,op,data,progress):
    if op=='cdbi_status':
        try:exe=binary(app)
        except n.Error:return {'available':False,'platform':'-'.join(deps.platform_key())}
        return {'available':True,'binary':exe,'version':deps.version([exe]),'auth':call(app,['auth-status'])}
    if op=='cdbi_install':return install(app.home,data.get('url'),data.get('sha256'))
    if op=='cdbi_connect':
        path=Path(text(data.get('path'),'CDBI 路径',2000,True)).expanduser().resolve()
        if not path.is_file() or path.suffix.lower() in ('.cmd','.bat') or not deps.version([str(path)]):raise n.Error('请选择可以运行的 CDBI 可执行文件')
        saved=n.load(app.home/'dependencies.json') if (app.home/'dependencies.json').exists() else {}
        saved['cdbi_bin']=str(path);n.save(app.home/'dependencies.json',saved);return {'binary':str(path)}
    if op=='cdbi_login':
        result=subprocess.run([binary(app),'login'],capture_output=True,text=True,encoding='utf-8',timeout=300,env=dws_transport.environment())
        if result.returncode:raise n.Error('CDBI 登录尚未完成，请重试扫码')
        return call(app,['auth-status'])
    if op=='cdbi_datasets':
        value=call(app,['dataset','list','--limit','100','--search',text(data.get('query',''),'数据集关键词',100),'--format','json'])
        return {'datasets':value}
    dataset=text(data.get('dataset'),'数据集',200,True)
    if op=='cdbi_fields':
        value=call(app,['dataset','detail',dataset,'--format','json']);n.save(app.runtime/'cdbi'/('dataset-'+n.digest(dataset)+'.json'),value);return value
    if op=='cdbi_preview':
        meta_path=app.runtime/'cdbi'/('dataset-'+n.digest(dataset)+'.json')
        if not meta_path.exists():raise n.Error('请先读取数据集字段')
        meta=n.load(meta_path);cols={c['column'] for c in meta.get('columnList',[])}
        code=data.get('code_field');name=data.get('name_field')
        if code not in cols or name not in cols:raise n.Error('场地编码或名称字段不存在')
        filters=[]
        if data.get('filter_field'):
            if data['filter_field'] not in cols:raise n.Error('筛选字段不存在')
            filters=[{'column':data['filter_field'],'filterType':'=','values':[text(data.get('filter_value'),'筛选值',1000,True)]}]
        progress('正在从 CDBI 读取最多 100 个场地候选')
        raw=call(app,['dataset','query',dataset,'--fields',json.dumps([{'column':code},{'column':name}]),'--filters',json.dumps(filters),'--page','1','--page-size','100','--format','json'])
        headers=raw.get('headers',[]);headers=[x.get('column') if isinstance(x,dict) else x for x in headers]
        if code not in headers or name not in headers:raise n.Error('CDBI 返回列名不一致，请核对字段')
        rows=[];seen=set()
        for row in raw.get('rows',[]):
            c=str(row[headers.index(code)] or '').strip();title=str(row[headers.index(name)] or '').strip()
            if not c or not title or c in seen:continue
            seen.add(c);rows.append({'code':c,'title':title})
        key=uuid.uuid4().hex;preview={'id':key,'dataset':dataset,'rows':rows,'limited':len(raw.get('rows',[]))>=100,'project_id':data.get('project_id')}
        n.save(app.runtime/'cdbi'/('preview-'+key+'.json'),preview);return preview
    if op=='cdbi_import':
        key=text(data.get('preview'),'预览编号',32,True)
        if not re.fullmatch('[0-9a-f]{32}',key):raise n.Error('预览编号无效')
        preview=n.load(app.runtime/'cdbi'/('preview-'+key+'.json'));chosen=data.get('codes',[])
        if preview['dataset']!=dataset:raise n.Error('预览所属数据集已变化，请重新预览')
        if not isinstance(chosen,list) or not chosen or set(chosen)-{r['code'] for r in preview['rows']}:raise n.Error('请选择预览中的场地')
        state=app.work.snapshot();pid=preview['project_id'];project=next((p for p in state['projects'] if p['id']==pid),None)
        if not project:raise n.Error('目标项目不存在')
        config=n.load(app.config);fields=config['tables']['sites']['fields']
        if 'code' not in fields:raise n.Error('场地表尚未绑定场地编码字段；先在接入向导补齐，避免按名称错配场地')
        results=[];request=request_id(data.get('request_id'))
        for i,row in enumerate(preview['rows']):
            if row['code'] not in chosen:continue
            existing=[s for s in state['sites'] if s.get('code')==row['code'] and pid in s.get('project_ids',[])]
            if existing:results.append({'code':row['code'],'status':'already_present'});continue
            progress('正在导入场地 '+row['code'])
            values={'title':row['title'],'code':row['code'],'project_ids':[pid]}
            if 'notes' in fields:values['notes']='CDBI 数据集 '+dataset+'；场地编码 '+row['code']
            result=app.work.mutate({'request_id':str(uuid.uuid5(uuid.UUID(key),row['code'])),'op':'create','role':'sites','values':values})
            results.append({'code':row['code'],'status':'verified','result':result})
        return {'items':results,'verified':True}
    raise n.Error('未知 CDBI 操作')
