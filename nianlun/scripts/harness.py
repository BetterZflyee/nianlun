"""Host adapters: reuse host authentication; keep business policy outside the model."""
import json
import os
import shutil
import subprocess
from pathlib import Path
from urllib.request import getproxies
import nianlun as n


def runtime_env():
    env=os.environ.copy()
    # Native GUI apps use OS proxy settings; CLI children need their equivalent environment.
    # Reuse only the user's existing proxy, without changing any system setting or TLS validation.
    proxies=getproxies()
    for protocol in ('http','https'):
        if not env.get(protocol+'_proxy') and not env.get(protocol.upper()+'_PROXY') and proxies.get(protocol):
            env[protocol.upper()+'_PROXY']=proxies[protocol]
    return env


def preferred_model():
    # Preserve the model the user selected in the host, while keeping unrelated MCP tools disabled.
    try:
        import tomllib
        path=Path(os.environ.get('CODEX_HOME',Path.home()/'.codex'))/'config.toml'
        config=tomllib.loads(path.read_text(encoding='utf-8'))
        model=config.get('model')
        return model if isinstance(model,str) and model.strip() else None
    except (OSError,ValueError,ImportError):return None


def find_codex(preferred=None):
    candidates=[preferred,shutil.which('codex'),
        '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex',
        '/Applications/Codex.app/Contents/Resources/codex']
    if os.name=='nt':
        # Native executables only; never interpolate a .cmd command string.
        local=Path(os.environ.get('LOCALAPPDATA',Path.home()))
        for root in (local/'Programs',local/'OpenAI',Path.home()/'.local/bin'):
            if root.exists():
                for pattern in ('codex.exe','*/codex.exe','*/resources/codex.exe','*/bin/codex.exe'):
                    candidates += [str(p) for p in root.glob(pattern)]
        shim=shutil.which('codex')
        npm_roots=[Path(os.environ.get('APPDATA',Path.home()))/'npm']
        if shim:npm_roots.append(Path(shim).parent)
        for root in npm_roots:
            for pattern in ('node_modules/@openai/codex/vendor/*/codex/codex.exe',
                            'node_modules/@openai/codex-*/vendor/*/codex/codex.exe',
                            'node_modules/@openai/codex/node_modules/@openai/codex-*/vendor/*/codex/codex.exe'):
                candidates += [str(p) for p in root.glob(pattern)]
    for value in candidates:
        if value and Path(value).is_file() and Path(value).suffix.lower() not in ('.cmd','.bat'):
            return str(Path(value).resolve())
    return None


def codex_status(preferred=None):
    binary=find_codex(preferred)
    if not binary:return {'available':False,'logged_in':False,'message':'先安装并登录 Codex；已安装时可选择可执行文件'}
    try:
        version=subprocess.run([binary,'--version'],capture_output=True,text=True,encoding='utf-8',timeout=20)
        login=subprocess.run([binary,'login','status'],capture_output=True,text=True,encoding='utf-8',timeout=20)
        return {'available':version.returncode==0,'binary':binary,'version':version.stdout.strip(),
            'logged_in':login.returncode==0,'message':'已连接本机 Codex' if login.returncode==0 else '请在 Codex 完成登录'}
    except (OSError,subprocess.TimeoutExpired):
        return {'available':False,'logged_in':False,'message':'Codex 未响应，请检查安装'}


def codex_reason(prompt, directory, preferred=None, schema=None, timeout=900):
    directory=Path(directory).resolve();directory.mkdir(parents=True,exist_ok=True)
    binary=find_codex(preferred)
    if not binary:raise n.Error('未找到 Codex，请在接入设置中连接宿主')
    output=directory/'answer.txt';events=directory/'events.jsonl';error=directory/'stderr.txt'
    # Reasoning is deliberately separate from deterministic writes. Disable execution and app tools.
    # --ignore-user-config avoids loading unrelated personal MCP servers into this inference.
    command=[binary,'exec','--ignore-user-config','--skip-git-repo-check','--ephemeral',
        '--sandbox','read-only','--disable','shell_tool','--disable','apps','--disable','multi_agent',
        '-c','web_search="disabled"','-C',str(directory),'--color','never','--json',
        '--output-last-message',str(output)]
    model=preferred_model()
    if model:command+=['--model',model]
    if schema:
        schema_path=directory/'response-schema.json';n.save(schema_path,schema)
        command+=['--output-schema',str(schema_path)]
    command+=['-']
    # Keep the prompt off the process command line, where it could disclose project context.
    with events.open('w',encoding='utf-8') as out,error.open('w',encoding='utf-8') as err:
        try:
            result=subprocess.run(command,input=prompt,text=True,encoding='utf-8',stdout=out,stderr=err,timeout=timeout,env=runtime_env())
        except subprocess.TimeoutExpired:
            raise n.Error('Codex 推理超时；业务数据尚未因本次推理写入，可查看运行记录')
    if result.returncode or not output.exists():
        raise n.Error('Codex 未完成本次推理，请检查登录、额度和运行记录')
    content=output.read_text(encoding='utf-8').strip()
    if not content:raise n.Error('Codex 返回了空结果')
    if schema:
        try:return json.loads(content)
        except ValueError:raise n.Error('Codex 输出未符合结构要求，未执行写入')
    return content


ANSWER_SCHEMA={'type':'object','properties':{'answer':{'type':'string'}},'required':['answer'],'additionalProperties':False}


def skill_roots(values):
    if not isinstance(values,list) or len(values)>20:raise n.Error('最多指定 20 个 Skill 文件夹')
    roots=[]
    for value in values:
        if not isinstance(value,str):raise n.Error('Skill 文件夹须为绝对路径')
        path=Path(value).expanduser()
        if not path.is_absolute() or not path.is_dir():raise n.Error('Skill 文件夹不存在或不是绝对路径：'+value)
        real=str(path.resolve())
        if real not in roots:roots.append(real)
    return roots


def capabilities(preferred=None,extra_roots=None):
    items=[];seen=set()
    codex=Path(os.environ.get('CODEX_HOME',Path.home()/'.codex'))
    provider=normalize(preferred)['provider']
    roots=[Path.home()/'.agents/skills']
    if provider=='codex':
        roots += [codex/'skills',codex/'skills/.system'] + list((codex/'plugins/cache').glob('*/*/*/skills'))
    elif provider=='claude':roots.append(Path(os.environ.get('CLAUDE_CONFIG_DIR',Path.home()/'.claude'))/'skills')
    roots += [Path(p) for p in (extra_roots or [])]
    # Other hosts discover their own native skills; never scan a guessed private directory.
    for root in roots:
        if not root.exists():continue
        # Existing installations often expose direct skill folders as symlinks.
        # Include those entry points without recursively following directory cycles.
        files=list(root.glob('*/SKILL.md'))
        for directory,dirs,names in os.walk(root,followlinks=False):
            dirs[:]=[d for d in dirs if d not in ('.git','node_modules','__pycache__','.venv','venv')]
            if 'SKILL.md' in names:files.append(Path(directory)/'SKILL.md')
        files.sort()
        if (root/'SKILL.md').is_file():files.insert(0,root/'SKILL.md')
        for file in files:
            real=file.resolve()
            if real in seen:continue
            seen.add(real)
            try:source=file.read_text(encoding='utf-8')
            except (OSError,UnicodeError):continue
            name=file.parent.name;description=''
            lines=source.split('---',2)[1].splitlines() if source.startswith('---') else []
            for index,line in enumerate(lines):
                if line.startswith('name:'):name=line[5:].strip().strip('"\'')
                if line.startswith('description:'):
                    description=line[12:].strip().strip('"\'')
                    if description in ('>','|','>-','|-'):
                        block=[]
                        for continuation in lines[index+1:]:
                            if continuation and not continuation[0].isspace():break
                            block.append(continuation.strip())
                        description=' '.join(block)
            items.append({'id':n.digest(str(real))[:24],'name':name,'description':description[:500],
                'path':str(real),'root':str(root),'mode':'workflow'})
    return items


PROVIDERS={
    'codex':{'name':'Codex','modes':['cli','delegated'],'reasoning':True,'embedded_workflow':True,'timer':'native_verified'},
    'claude':{'name':'Claude Code','modes':['cli','delegated'],'reasoning':True,'embedded_workflow':False,'timer':'host_managed'},
    'workbuddy':{'name':'WorkBuddy','modes':['delegated'],'reasoning':False,'embedded_workflow':False,'timer':'host_managed'},
    'deepseek':{'name':'DeepSeek Harness','modes':['delegated'],'reasoning':False,'embedded_workflow':False,'timer':'host_managed'},
    'generic':{'name':'其他 AI 宿主','modes':['delegated'],'reasoning':False,'embedded_workflow':False,'timer':'host_managed'},
}


def normalize(value=None):
    if not isinstance(value,dict):return {'provider':'codex','mode':'cli','binary':value}
    result=dict(value);provider=result.get('provider','generic')
    if provider not in PROVIDERS:raise n.Error('未知 AI 宿主')
    result['provider']=provider
    result.setdefault('mode',PROVIDERS[provider]['modes'][0])
    if result['mode'] not in PROVIDERS[provider]['modes']:raise n.Error('此宿主不支持所选接入方式')
    return result


def selection(config_path,legacy=None):
    config_path=Path(config_path).expanduser().resolve()
    config=n.load(config_path) if config_path.exists() else {}
    value=config.get('harness')
    if value is None:
        # Existing configured installations keep Codex; fresh installations choose a host explicitly.
        value={'provider':'codex','mode':'cli','binary':legacy} if config.get('tables') else {'provider':'generic','mode':'delegated'}
        settings=config_path.parent/'portal/settings.json'
        if not value.get('binary') and settings.exists():value['binary']=n.load(settings).get('codex_bin')
    result=normalize(value)
    from host_bridge import queue_root
    result.update(queue=str(queue_root(config_path)),binding=n.digest(config),config_path=str(config_path))
    return result


def describe(value):
    choice=normalize(value);meta=PROVIDERS[choice['provider']]
    return {**meta,'provider':choice['provider'],'mode':choice['mode'],'binary':choice.get('binary'),
            'embedded_workflow':meta['embedded_workflow'] and choice['mode']=='cli',
            'direct_reasoning':meta['reasoning'] and choice['mode']=='cli',
            'automatic_reports':choice['provider']=='deepseek' or (meta['reasoning'] and choice['mode']=='cli')}


def find_claude(preferred=None):
    for value in [preferred,shutil.which('claude'),str(Path.home()/'.local/bin/claude'),str(Path.home()/'.local/bin/claude.exe')]:
        if value and Path(value).is_file() and Path(value).suffix.lower() not in ('.cmd','.bat'):
            return str(Path(value).resolve())
    return None


def status(preferred=None):
    choice=normalize(preferred);meta=describe(choice)
    if choice['provider']=='deepseek':
        import deepseek_report
        return {**meta,**deepseek_report.status(choice.get('binary'))}
    if choice['mode']=='delegated':
        return {**meta,'available':True,'logged_in':None,'message':meta['name']+'：通过宿主接续；宿主登录和定时能力需在该应用验证'}
    if choice['provider']=='codex':return {**meta,**codex_status(choice.get('binary'))}
    binary=find_claude(choice.get('binary'))
    if not binary:return {**meta,'available':False,'logged_in':False,'message':'未找到 Claude Code，请安装登录后连接，或选择宿主接续'}
    try:
        version=subprocess.run([binary,'--version'],capture_output=True,text=True,encoding='utf-8',timeout=20)
        login=subprocess.run([binary,'auth','status'],capture_output=True,text=True,encoding='utf-8',timeout=20)
        auth=json.loads(login.stdout) if login.returncode==0 else {}
        logged=auth.get('loggedIn') is True
        return {**meta,'available':version.returncode==0,'logged_in':logged,'binary':binary,'version':version.stdout.strip(),
                'message':'Claude Code CLI 已登录；推理结果将在调用时验证' if logged else '请在 Claude Code 完成登录'}
    except (OSError,ValueError,subprocess.TimeoutExpired):
        return {**meta,'available':False,'logged_in':False,'message':'Claude Code 连接未验证'}


def claude_reason(prompt,directory,binary,schema,timeout):
    binary=find_claude(binary)
    if not binary:raise n.Error('未找到 Claude Code')
    directory=Path(directory).resolve();directory.mkdir(parents=True,exist_ok=True)
    command=[binary,'-p','--output-format','json','--tools','','--disallowedTools','mcp__*',
             '--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--disable-slash-commands',
             '--setting-sources','user','--settings','{"disableAllHooks":true}',
             '--no-session-persistence','--no-chrome']
    if schema:command+=['--json-schema',json.dumps(schema,ensure_ascii=False)]
    with (directory/'events.json').open('w',encoding='utf-8') as out,(directory/'stderr.txt').open('w',encoding='utf-8') as err:
        try:result=subprocess.run(command,input=prompt,cwd=directory,text=True,encoding='utf-8',stdout=out,stderr=err,timeout=timeout,env=runtime_env())
        except subprocess.TimeoutExpired:raise n.Error('Claude Code 推理超时，未因本次推理执行业务写入')
    if result.returncode:raise n.Error('Claude Code 未完成推理，请检查宿主登录及执行日志')
    try:
        envelope=n.load(directory/'events.json')
        if envelope.get('is_error'):raise ValueError('host error')
        value=envelope.get('structured_output') if schema else envelope.get('result')
        if value is None:raise ValueError('empty')
        return value
    except (ValueError,AttributeError):raise n.Error('Claude Code 未返回有效的结构化结果')


def reason(prompt,directory,preferred=None,schema=None,timeout=900):
    import host_bridge
    choice=normalize(preferred)
    if choice['mode']=='delegated':
        if not choice.get('queue'):raise n.Error('宿主交接缺少安装配置')
        # A resumed job uses its original evidence. A new job gets a new directory.
        frozen=Path(directory)/'request-input.json'
        if frozen.exists():
            saved=n.load(frozen)
            if saved['binding']!=choice.get('binding') or saved['provider']!=choice['provider'] or saved['schema']!=schema:
                raise n.Error('交接期间配置或返回结构发生变化，请核验后重新发起')
            prompt=saved['prompt']
        else:n.save(frozen,{'prompt':prompt,'schema':schema,'binding':choice.get('binding'),'provider':choice['provider']})
        return host_bridge.request(prompt,directory,choice,schema)
    if choice['provider']=='codex':value=codex_reason(prompt,directory,choice.get('binary'),schema,timeout)
    else:value=claude_reason(prompt,directory,choice.get('binary'),schema,timeout)
    host_bridge.validate(value,schema)
    return value


def report_reason(prompt,directory,preferred=None,schema=None,timeout=900,progress=lambda message:None,cancelled=lambda:False):
    """Direct DeepSeek reports do not change the selected host's other workflows."""
    choice=normalize(preferred)
    if choice['provider']!='deepseek':return reason(prompt,directory,preferred,schema,timeout)
    import deepseek_report
    import host_bridge
    frozen=Path(directory)/'request-input.json';waiting=None
    if frozen.exists():
        saved=n.load(frozen)
        if any(saved.get(k)!=v for k,v in {'provider':choice['provider'],'binding':choice.get('binding'),'schema':schema}.items()):
            raise n.Error('原接续请求的配置已变化，请核验后重新生成报告。')
        prompt=saved['prompt']
        try:return host_bridge.request(prompt,directory,choice,schema)
        except host_bridge.Waiting as exc:waiting=exc.request
    answer=deepseek_report.generate(prompt,directory,choice.get('binary'),schema,timeout,progress,cancelled)
    if waiting:
        if not choice.get('config_path'):raise n.Error('旧请求缺少配置路径，未执行写回。')
        host_bridge.answer(choice['config_path'],waiting['id'],answer)
    return answer
