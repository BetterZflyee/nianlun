"""One-shot DSH report adapter. No business writes or global host configuration."""
import json
import os
import queue
import shutil
import subprocess
import threading
import time
from pathlib import Path
import nianlun as n
from file_lock import file_lock


class Cancelled(n.Error):
    pass


def command(preferred=None):
    candidates=[preferred,shutil.which('dsh'),str(Path.home()/'.nodejs/bin/dsh'),
                str(Path.home()/'.local/bin/dsh')]
    if os.name=='nt':
        candidates += [str(Path(os.environ.get('APPDATA',Path.home()))/'npm/dsh.cmd')]
    for value in candidates:
        if not value or not Path(value).is_file():continue
        p=Path(value).resolve()
        # npm's Windows launcher is a shell script. Invoke its Node entry as argv instead.
        if p.suffix.lower() in ('.cmd','.bat','.ps1'):
            entry=p.parent/'node_modules/@deepseek-ai/dsh/lib/bin.js'
            node=shutil.which('node')
            if entry.is_file() and node:return [node,str(entry)]
            continue
        if p.suffix=='.js':
            node=shutil.which('node')
            if not node:
                nearby=Path(value).parent/('node.exe' if os.name=='nt' else 'node')
                if nearby.is_file():node=str(nearby)
            if node:return [node,str(p)]
            continue
        return [str(p)]
    raise n.Error('未找到 DeepSeek Harness 命令。请安装宿主的 dsh 命令并完成登录，再重试原任务。')


def status(preferred=None):
    from harness import runtime_env
    try:
        argv=command(preferred)
        result=subprocess.run(argv+['--profile','headless','--help'],capture_output=True,text=True,
                              encoding='utf-8',timeout=20,env=runtime_env())
        supported=result.returncode==0 and '--json' in result.stdout
        return {'available':supported,'logged_in':None,'automatic_reports':supported,
                'message':'DeepSeek 自动汇报接口可用；模型登录将在调用时验证' if supported else '当前 dsh 不支持 headless JSON 事件，请更新宿主后重试'}
    except (OSError,subprocess.TimeoutExpired,n.Error) as exc:
        return {'available':False,'logged_in':None,'automatic_reports':False,
                'message':str(exc) if isinstance(exc,n.Error) else 'DeepSeek 命令未响应，请检查安装'}


def failure_message(text):
    text=text.lower()
    if any(x in text for x in ('401','unauthorized','authentication','api key','credential','login')):
        return 'DeepSeek 登录或模型凭据不可用。请在宿主完成登录，再重试原任务。'
    if any(x in text for x in ('429','quota','balance','insufficient','rate limit')):
        return 'DeepSeek 额度不足或请求受限。请检查宿主额度，稍后重试原任务。'
    if any(x in text for x in ('timeout','network','fetch failed','econn','proxy','connect')):
        return 'DeepSeek 网络连接未完成。请检查宿主连接与代理，再重试原任务。'
    return 'DeepSeek 本次未正常完成。已保留项目材料，请检查宿主模型设置后重试原任务。'


def parse_answer(text,schema):
    import host_bridge
    value=text.strip()
    if value.startswith('```') and value.endswith('```'):
        value=value.split('\n',1)[-1].rsplit('```',1)[0].strip()
    try:answer=json.loads(value)
    except ValueError:raise n.Error('DeepSeek 返回格式不完整；没有发布报告，可重试原任务。')
    host_bridge.validate(answer,schema)
    if not isinstance(answer.get('answer'),str) or not answer['answer'].strip():
        raise n.Error('DeepSeek 返回了空报告；没有发布报告，可重试原任务。')
    return answer


def generate(prompt,directory,preferred=None,schema=None,timeout=900,progress=lambda message:None,cancelled=lambda:False):
    from harness import runtime_env, ANSWER_SCHEMA
    schema=schema or ANSWER_SCHEMA
    directory=Path(directory).resolve();directory.mkdir(parents=True,exist_ok=True)
    with file_lock(directory/'direct-report.lock'):
        key=n.digest({'prompt':prompt,'schema':schema})
        cached=directory/'direct-answer.json'
        if cached.exists():
            saved=n.load(cached)
            if saved['input_hash']!=key:raise n.Error('原报告材料已变化，请重新生成，未复用旧结论。')
            answer=parse_answer(json.dumps(saved['answer'],ensure_ascii=False),schema)
            progress('已复用本任务的 DeepSeek 报告正文，继续核验与写回')
            return answer
        if cancelled():raise Cancelled('已停止生成，尚未上传或写回报告。')
        argv=command(preferred)
        patch=directory/'report-patch.json'
        n.save(patch,[{'id':'tools','config':{'mode':'native'}},
            {'insert':[{'id':'nianlun-report-policy','name':str(n.SKILL/'assets/deepseek-report-policy.js'),'inject':['tools']}]}])
        task=(prompt+'\n\n输出契约优先于写作方法：只返回一个 JSON 对象，不包裹代码块。'
              'answer 为报告 Markdown 字符串。不要输出 HTML，不使用工具，不添加对象以外的文字。\n'+json.dumps(schema,ensure_ascii=False))
        n.save(directory/'direct-input.json',{'input_hash':key,'prompt':prompt,'schema':schema})
        progress('正在连接本机 DeepSeek，准备自动撰写报告')
        env=runtime_env();env['DSH_PERMISSION_MODE']='read-only'
        try:
            process=subprocess.Popen(argv+['--profile','headless','--patch',str(patch),'--json','-'],cwd=directory,
                stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf-8',
                errors='replace',env=env,bufsize=1)
        except OSError:raise n.Error('DeepSeek 命令未能启动，请检查安装后重试原任务。')
        events=queue.Queue();diagnostics=[];seen=[];policy=False;final=None;terminal=None;stream_error=False
        def reader():
            total=0
            try:
                while True:
                    line=process.stdout.readline(2_000_001)
                    if not line:break
                    total+=len(line)
                    if len(line)>2_000_000 or total>16_000_000:
                        events.put(('error','DeepSeek 输出过大，报告未发布。'));return
                    events.put(('line',line))
            finally:events.put(('eof',None))
        def stderr_reader():
            size=0
            while True:
                chunk=process.stderr.read(4096)
                if not chunk:break
                if size<65536:diagnostics.append(chunk[:65536-size]);size+=len(chunk)
        def writer():
            try:process.stdin.write(task);process.stdin.close()
            except (OSError,ValueError):pass
        threads=[threading.Thread(target=f,daemon=True) for f in (reader,stderr_reader,writer)]
        for thread in threads:thread.start()
        start=time.monotonic();last=start;eof=False
        try:
            while not eof or process.poll() is None:
                if cancelled():raise Cancelled('已停止 DeepSeek 生成，尚未上传或写回报告。')
                now=time.monotonic()
                if now-start>timeout:raise n.Error('DeepSeek 生成超时。已保留项目材料，可重试原任务。')
                if now-last>=15:
                    progress('DeepSeek 正在撰写报告 · 已等待 '+str(int(now-start))+' 秒');last=now
                try:kind,line=events.get(timeout=.2)
                except queue.Empty:continue
                if kind=='eof':eof=True;continue
                if kind=='error':raise n.Error(line)
                try:event=json.loads(line)
                except ValueError:raise n.Error('DeepSeek 返回了无法识别的事件，未发布报告；请检查宿主插件。')
                if not isinstance(event,dict):raise n.Error('DeepSeek 事件格式无效，未发布报告。')
                typ=event.get('type');seen.append({'type':typ})
                if typ=='nianlun_policy':
                    if event.get('tools')!=0:raise n.Error('报告任务工具隔离未通过，已停止。')
                    policy=True
                elif typ=='session':progress('DeepSeek 已接收报告任务，正在分析项目材料')
                elif typ in ('tool_call','tool_result'):raise n.Error('报告任务意外请求工具，已停止，未上传或写回。')
                elif typ=='error':
                    stream_error=True
                    diagnostics.append(json.dumps(event,ensure_ascii=False)[:8192])
                elif typ=='status' and isinstance(event.get('reason'),dict):terminal=event['reason'].get('kind')
                elif typ=='final':final=event.get('text')
                # Do not persist or display model thinking. Only committed final output is used.
            for thread in threads:thread.join(timeout=2)
            if process.returncode or stream_error or terminal!='completed':
                raise n.Error(failure_message(''.join(diagnostics)))
            if not policy:raise n.Error('未收到 DeepSeek 工具隔离确认，未发布报告。')
            if not isinstance(final,str):raise n.Error('DeepSeek 未返回最终报告，可重试原任务。')
            answer=parse_answer(final,schema)
            n.save(cached,{'input_hash':key,'answer':answer})
            progress('DeepSeek 正文已生成，正在校验报告并准备排版')
            return answer
        finally:
            if process.poll() is None:
                process.terminate()
                try:process.wait(timeout=5)
                except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)
            for thread in threads:thread.join(timeout=2)
            for stream in (process.stdin,process.stdout,process.stderr):
                try:stream.close()
                except (OSError,ValueError):pass
            n.save(directory/'direct-events.json',{'events':seen[-100:],'exit_code':process.returncode,
                'tools_disabled':policy,'terminal':terminal,'elapsed_seconds':round(time.monotonic()-start,1)})
