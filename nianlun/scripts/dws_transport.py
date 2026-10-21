"""Use the user's existing proxy and expose safe CLI failure details."""
import json
import os
from urllib.request import getproxies


def environment():
    env=os.environ.copy()
    for protocol,value in getproxies().items():
        if protocol in ('http','https','all','no') and not env.get(protocol+'_proxy') and not env.get(protocol.upper()+'_PROXY'):
            env[protocol.upper()+'_PROXY']=value
    return env


def object_output(text):
    text=(text or '').strip()
    start=text.find('{')
    try:value=json.loads(text[start:] if start>=0 else text)
    except ValueError:return None
    return value if isinstance(value,dict) else None


def is_write(args):
    return any(word in ('create','+record-update','+complete','+messages-send','+upload','+create','+table-bootstrap') for word in args[:3])


def failure(result,args):
    """Never reflect raw CLI diagnostics: URLs and nested causes may contain credentials."""
    raw=object_output(getattr(result,'stderr','')) or object_output(result.stdout) or {}
    error=raw.get('error',{})
    error=error if isinstance(error,dict) else {}
    reason=error.get('reason');category=error.get('category')
    causes={'io_timeout':'连接钉钉服务超时，请检查当前网络与代理',
            'auth_refresh_failed':'登录已失效，请在接入与运行中重新登录钉钉',
            'confirmation_required':'该操作需要确认，尚未提交',
            'rate_limited':'钉钉服务限流，请稍后再试'}
    cause=causes.get(reason) or {'auth':'钉钉身份验证失败，请检查登录',
        'validation':'命令参数未通过校验，尚未提交','discovery':'当前 DWS 版本不支持此调用'}.get(category,'DWS 未返回有效结果，请检查连接与执行记录')
    command=[]
    for word in args[:3]:
        if word.startswith('--'):break
        command.append(word)
    submitted=is_write(args) and category not in ('auth','validation','discovery') and reason!='confirmation_required'
    suffix='；写入结果未知，请核验原结果，未自动重发' if submitted else '；读取未确认，未把缺失结果视为空数据' if not is_write(args) else ''
    return 'DWS '+ ' '.join(command)+'：'+cause+suffix
