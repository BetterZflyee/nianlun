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
    # 「写入结果未知」不能只说「未知」——用户不知道该不该重做，往往就重复写一遍，
    # 于是同一件事出现两份记录。这里把在跑的命令、以及「怎么核验」都说出来。
    #
    # `cause` 里如果带 read-back missing / failedCount，说明是**写后回读没对上**：
    # 大概率已经写进去了（executed=true），只是响应没回来或回读时机太早。
    detail=str(error.get('cause') or '')
    if 'read-back' in detail:
        suffix=('；该记录很可能已写入，只是回读没确认到。'
                '请先在表格里核对该条记录，确认已正确后再决定是否重做——'
                '不要直接重试，否则可能产生重复记录')
    elif submitted:
        suffix='；写入结果未知，请先在表格里核验原结果，确认未生效后再重做；不要直接重试'
    elif not is_write(args):
        suffix='；读取未确认，未把缺失结果视为空数据'
    else:
        suffix=''
    return 'DWS '+ ' '.join(command)+'：'+cause+suffix
