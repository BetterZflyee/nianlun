"""Host adapters: reuse host authentication; keep business policy outside the model."""
import json
import os
import re
import shlex
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
    'deepseek':{'name':'DeepSeek Harness','modes':['cli','delegated'],'reasoning':True,'embedded_workflow':True,'timer':'host_managed'},
    'generic':{'name':'其他 AI 宿主','modes':['cli','delegated'],'reasoning':True,'embedded_workflow':False,'timer':'host_managed'},
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
            'embedded_workflow':choice['provider']=='deepseek' or (meta['embedded_workflow'] and choice['mode']=='cli'),
            'workflow_scope':'documents' if choice['provider']=='deepseek' else 'native_tools',
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
        if choice['mode']=='cli':
            binary=find_dsh(choice.get('binary'))
            if not binary:return {**meta,'available':False,'logged_in':False,'message':'未找到 dsh 命令，请安装 DeepSeek Harness CLI 或改用宿主接续'}
            key=dsh_api_key()
            return {**meta,'available':True,'logged_in':bool(key),'binary':binary,
                'message':'DeepSeek Harness headless 已就绪，推理由本机 dsh 执行' if key else '请在 dsh 中配置模型凭据（SF_LLM_API_KEY）'}
        import deepseek_report
        return {**meta,**deepseek_report.status(choice.get('binary'))}
    if choice['provider']=='generic' and choice['mode']=='cli':
        command=custom_command({'command':choice.get('command'),'config_path':choice.get('config_path')})
        if not command:return {**meta,'available':False,'logged_in':False,'message':'请配置通用 Agent 命令（harness_command），约定 stdin 传入提示词、stdout 返回答案'}
        executable=shutil.which(command[0]) or command[0]
        available=Path(executable).exists()
        return {**meta,'available':available,'logged_in':available,'binary':executable,
            'message':('通用 Agent 命令已就绪：'+' '.join(command)) if available else ('未找到命令：'+command[0])}
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


def find_dsh(preferred=None):
    # 不解引用符号链接：npm 安装的 dsh 是 bin 目录下的链接，解引用后仍可执行但会丢失名称语义。
    for value in [preferred,shutil.which('dsh'),str(Path.home()/'.nodejs/bin/dsh'),'/usr/local/bin/dsh']:
        if value and Path(value).is_file():return os.path.abspath(value)
    return None


def dsh_api_key():
    """DeepSeek Harness 的模型凭据由 dsh 自己的凭据库保管；这里只读取不写入。"""
    if os.environ.get('SF_LLM_API_KEY'):return os.environ['SF_LLM_API_KEY']
    path=Path.home()/'.dsh/.credentials.yaml'
    if not path.is_file():return None
    # 安装运行时只有标准库，不依赖 PyYAML：只解析 refs 段的目标键，支持续行与引号。
    try:lines=path.read_text(encoding='utf-8').splitlines()
    except OSError:return None
    inside=False
    for index,line in enumerate(lines):
        if line.startswith('refs:'):inside=True;continue
        if inside and line and not line.startswith(' '):break
        if not inside:continue
        stripped=line.strip()
        if not stripped.startswith('SF_LLM_API_KEY:'):continue
        raw=stripped.split(':',1)[1].strip()
        cursor=index
        while raw.endswith('\\') and cursor+1<len(lines):
            cursor+=1;raw=raw[:-1]+lines[cursor].strip()
        value=raw.strip().strip('"').strip("'")
        return value or None
    return None


def session_store(config_path=None):
    """宿主会话固定在个人状态目录，跨轮次复用，不随单次运行目录变化。"""
    if config_path:
        try:
            config=n.load(config_path)
            state=config.get('growth',{}).get('state_dir')
            if state:return Path(state).expanduser()/'harness-sessions.json'
        except Exception:pass
    return Path.home()/'.local/state/nianlun/harness-sessions.json'


def harness_session(config_path,provider,value=None):
    path=session_store(config_path);data=n.load(path) if path.exists() else {}
    if value is None:return data.get(provider)
    if value=='':data.pop(provider,None)
    else:data[provider]=value
    path.parent.mkdir(parents=True,exist_ok=True);n.save(path,data);return data.get(provider)


def deepseek_reason(prompt,directory,preferred=None,schema=None,timeout=1200,config_path=None):
    """通过 dsh headless 完成一次推理；同一安装固定沿用同一会话，保留生长上下文。"""
    directory=Path(directory).resolve();directory.mkdir(parents=True,exist_ok=True)
    binary=find_dsh(preferred)
    if not binary:raise n.Error('未找到 dsh 命令，请在接入设置中安装 DeepSeek Harness 或改用其他宿主')
    env=runtime_env()
    key=dsh_api_key()
    if key:env['SF_LLM_API_KEY']=key
    # 会话目录固定在此安装的状态目录，避免每次运行目录不同导致会话找不到。
    cwd=directory
    if config_path:
        try:
            state=n.load(config_path).get('growth',{}).get('state_dir')
            if state:Path(state).mkdir(parents=True,exist_ok=True);cwd=Path(state).expanduser()
        except Exception:pass
    if schema:
        prompt=(prompt.rstrip()+'\n\n只返回一个 JSON 对象，严格符合以下 JSON Schema，不要输出解释、前后缀或代码围栏：\n'
            +json.dumps(schema,ensure_ascii=False))
    events=directory/'events.jsonl';error=directory/'stderr.txt'
    saved=harness_session(config_path,'deepseek')
    for attempt in (0,1):
        command=[binary,'headless','--json']
        if saved:command+=['--session-id',saved]
        command+=['-']
        with events.open('w',encoding='utf-8') as out,error.open('w',encoding='utf-8') as err:
            try:
                result=subprocess.run(command,input=prompt,text=True,encoding='utf-8',stdout=out,stderr=err,cwd=str(cwd),timeout=timeout,env=env)
            except subprocess.TimeoutExpired:raise n.Error('DeepSeek Harness 推理超时；未因本次推理执行业务写入')
        text=error.read_text(encoding='utf-8') if error.exists() else ''
        if result.returncode:
            # 会话失效（被清理或换机器）时丢弃旧会话，用新会话重试一次。
            if saved and ('session' in text.lower()) and attempt==0:
                saved=harness_session(config_path,'deepseek','')
                continue
            raise n.Error('DeepSeek Harness 未完成本次推理，请检查 dsh 登录与模型配置；' + text.strip().splitlines()[-1][:180] if text.strip() else 'DeepSeek Harness 未完成本次推理')
        session=None;answer=None
        for line in events.read_text(encoding='utf-8').splitlines():
            line=line.strip()
            if not line:continue
            try:event=json.loads(line)
            except ValueError:continue
            if event.get('type')=='session' and event.get('sessionId'):session=event['sessionId']
            elif event.get('type')=='final' and isinstance(event.get('text'),str):answer=event['text']
        if session and session!=saved:harness_session(config_path,'deepseek',session)
        if not answer:raise n.Error('DeepSeek Harness 返回了空结果')
        if schema:
            raw=answer.strip()
            if raw.startswith('```'):
                raw=re.sub(r'^```[A-Za-z]*\n?|\n?```$','',raw).strip()
            start,end=raw.find('{'),raw.rfind('}')
            if start<0 or end<start:raise n.Error('DeepSeek Harness 输出未符合结构要求，未执行写入')
            try:return json.loads(raw[start:end+1])
            except ValueError:raise n.Error('DeepSeek Harness 输出未符合结构要求，未执行写入')
        return answer
    raise n.Error('DeepSeek Harness 会话重建失败，请检查 dsh 运行状态')


def custom_command(preferred=None):
    """通用 Agent 命令：可来自接入配置的 command 数组，或 config 里的 harness_command。
    约定 stdin 传入提示词、stdout 返回答案，年轮不假设任何厂商私有参数。"""
    if isinstance(preferred,dict):
        command=preferred.get('command')
        if command:return [str(x) for x in command] if isinstance(command,list) else shlex.split(str(command))
        config_path=preferred.get('config_path')
        if config_path:
            try:
                command=n.load(config_path).get('growth',{}).get('harness_command')
                if command:return [str(x) for x in command] if isinstance(command,list) else shlex.split(str(command))
            except (OSError,ValueError):pass
    return None


def custom_reason(prompt,directory,preferred=None,schema=None,timeout=900):
    """按 stdin→stdout 约定调用任意外部 Agent CLI。"""
    directory=Path(directory).resolve();directory.mkdir(parents=True,exist_ok=True)
    command=custom_command(preferred)
    if not command:raise n.Error('未配置通用 Agent 命令，请在接入设置或配置中填写 harness_command')
    executable=shutil.which(command[0]) or command[0]
    if not Path(executable).exists():raise n.Error('未找到通用 Agent 命令：'+command[0])
    if schema:
        prompt=(prompt.rstrip()+'\n\n只返回一个 JSON 对象，严格符合以下 JSON Schema，不要输出解释或代码围栏：\n'
            +json.dumps(schema,ensure_ascii=False))
    out=directory/'answer.txt';err=directory/'stderr.txt'
    # 外部 Agent 若依赖本机已存的模型凭据，沿用同一份，不新增任何密钥来源。
    env=runtime_env()
    key=dsh_api_key()
    if key:env.setdefault('SF_LLM_API_KEY',key)
    with out.open('w',encoding='utf-8') as o,err.open('w',encoding='utf-8') as e:
        try:result=subprocess.run([executable]+command[1:],input=prompt,text=True,encoding='utf-8',stdout=o,stderr=e,timeout=timeout,env=env)
        except subprocess.TimeoutExpired:raise n.Error('通用 Agent 推理超时；未因本次推理执行业务写入')
    text=out.read_text(encoding='utf-8').strip()
    if result.returncode and not text:
        detail=err.read_text(encoding='utf-8').strip().splitlines()
        raise n.Error('通用 Agent 未完成推理；'+(detail[-1][:180] if detail else '请检查该命令的登录与参数'))
    if not text:raise n.Error('通用 Agent 返回了空结果')
    if not schema:return text
    return structured_answer(text)


def json_from_text(raw):
    """从一段文本里取出 JSON 对象：容忍代码围栏、前后解释和多余空行。"""
    if not isinstance(raw,str):return None
    text=raw.strip()
    if text.startswith('```'):
        text=re.sub(r'^```[A-Za-z]*\s*','',text)
        text=re.sub(r'\s*```$','',text).strip()
    try:
        value=json.loads(text)
        if isinstance(value,dict):return value
    except ValueError:pass
    start,end=text.find('{'),text.rfind('}')
    if start>=0 and end>start:
        try:
            value=json.loads(text[start:end+1])
            if isinstance(value,dict):return value
        except ValueError:pass
    return None


def structured_answer(text):
    """从任意 Agent 输出中取结构化结果：整体 JSON、JSON 行事件流、或文本中夹带的 JSON。
    兼容只打印最终答案、以及打印带 type=final 事件流两类工具。"""
    raw=text.strip()
    # 只含 type 的事件对象不是答案，先按事件流解析，避免把事件外壳当结果。
    direct=json_from_text(raw)
    if direct is not None and 'type' not in direct:return direct
    objects=[]
    for line in raw.splitlines():
        line=line.strip()
        if not line or not line.startswith('{'):continue
        try:
            item=json.loads(line)
        except ValueError:continue
        if not isinstance(item,dict):continue
        if item.get('type')=='final':
            inner=json_from_text(item.get('text'))
            if inner is not None:return inner
        objects.append(item)
    for item in reversed(objects):
        for key in ('text','content','message','result','answer'):
            inner=json_from_text(item.get(key))
            if inner is not None:return inner
        if len(item)>1 and 'type' not in item:return item
    if direct is not None:return direct
    raise n.Error('通用 Agent 输出未符合结构要求，未执行写入')


def cached_answer(directory,prompt):
    """同一运行目录的同一请求复用已完成推理：进程中断或恢复重跑时不再重复消耗模型。"""
    path=Path(directory)/'answer-cache.json'
    if not path.exists():return None
    try:
        item=n.load(path)
        if item.get('prompt_hash')==n.digest(prompt):return item.get('answer')
    except (OSError,ValueError):return None
    return None


def store_answer(directory,prompt,answer):
    path=Path(directory)/'answer-cache.json'
    try:
        path.parent.mkdir(parents=True,exist_ok=True)
        n.save(path,{'prompt_hash':n.digest(prompt),'answer':answer})
    except OSError:pass


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
    cached=cached_answer(directory,prompt)
    if cached is not None:
        host_bridge.validate(cached,schema)
        return cached
    if choice['provider']=='codex':value=codex_reason(prompt,directory,choice.get('binary'),schema,timeout)
    elif choice['provider']=='deepseek':value=deepseek_reason(prompt,directory,choice.get('binary'),schema,timeout,choice.get('config_path'))
    elif choice['provider']=='generic':value=custom_reason(prompt,directory,choice,schema,timeout)
    else:value=claude_reason(prompt,directory,choice.get('binary'),schema,timeout)
    host_bridge.validate(value,schema)
    store_answer(directory,prompt,value)
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
