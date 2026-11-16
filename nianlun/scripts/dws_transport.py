"""Use the user's existing proxy and expose safe CLI failure details."""
import json
import os
import re
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


# 脱敏：原始诊断里最危险的是访问令牌、URL 里的 query、以及整段 cookie/header。
# failure() 的 docstring 一直说「不回显原始诊断，避免带凭据」，结果连
# 「CLI 到底输出了什么」也一起丢了——2026-11-16 14:12 那轮就是因此查不下去：
# 日志只留 resp_size=586，没人能判定那是「空记录信封」还是「带错误信息的信封」。
# 现在改成：留一段**脱敏后**的摘要。宁可留得少，也不能一个字都不留。
#
# ⚠️ 顺序是有语义的，不能随意调整：**先删整段凭据，再删裸 token**。
# 2026-11-16 「Authorization: Bearer <JWT>」实测：若先跑 authorization 规则，
# 它把 `Authorization:` 连锚点一起吃成 `<已脱敏>`，后面的 bearer 规则就
# 匹配不到任何东西，**整段 JWT 原样留进日志**。这类「先吃锚点导致后续规则
# 失明」的漏洞只能靠顺序保证，所以这里按「整段 → 独立 token」排列。
# cookie 同理：cookie 头是一条由分号分隔的键值串，只吃到第一个 `;`
# 会留下 `csrftoken=xyz` 之类的半截凭据，必须整条吃掉。
_SECRET_PATTERNS = (
    # ① 整段头先删：Authorization / Cookie / Set-Cookie 的值可能很长，
    #    内部还嵌着 bearer 或一堆分号分隔的键值，先整体消掉再谈细节。
    re.compile(r'(?i)\b(authorization|proxy-authorization)\b\s*[:=]\s*\S+(?:\s+[^\s"\',;}]+)*'),
    re.compile(r'(?i)\b(set-cookie|cookie)\b\s*[:=]\s*[^\r\n"\'}]+'),
    # ② bearer 单独出现（没带 Authorization 前缀）时也要吃。
    re.compile(r'(?i)\bbearer\s+[A-Za-z0-9._~+/=\-]+'),
    # ③ 键值型凭据：name=value 或 name: value。
    re.compile(r'(?i)\b(access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|apikey|secret|client[_-]?secret|password|passwd)\b\s*[:=]\s*"?[^\s",;}]+'),
    # ④ 裸 token 键（token=xxx）：放在最后，避免抢在更长名字前面匹配。
    re.compile(r'(?i)\btoken\b\s*[:=]\s*"?[^\s",;}]+'),
)
_URL_QUERY = re.compile(r'(https?://[^\s?"\']+)\?[^\s"\']*')
# URL 本身就是凭据载体：签名直链的 path 段常带 secret（实测
# https://private.test/token-secret 就是这种）。摘要里只留 origin，不留 path。
_URL_PATH = re.compile(r'(https?://[^\s/"\']+)(/[^\s"\']*)?')


def redact(text, limit=600):
    """把诊断文本压成可留档的摘要：去凭据、去 URL query、截断。"""
    if not text:
        return ''
    value = str(text)
    for pattern in _SECRET_PATTERNS:
        value = pattern.sub('<已脱敏>', value)
    value = _URL_QUERY.sub(r'\1?<已脱敏>', value)
    value = _URL_PATH.sub(r'\1/<路径已省略>', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return value if len(value) <= limit else value[:limit] + '…'


def failure(result,args):
    """Never reflect raw CLI diagnostics: URLs and nested causes may contain credentials."""
    stderr = getattr(result, 'stderr', '') or ''
    stdout = getattr(result, 'stdout', '') or ''
    raw=object_output(stderr) or object_output(stdout) or {}
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
    # 留一段脱敏摘要：2026-11-16 14:12 那轮之所以查不下去，就是因为这里把
    # stderr/stdout 丢干净了，只剩 dws.log 里的 resp_size=586，谁也无法判定
    # 那 586 是「空记录信封」还是「带错误信息的信封」。诊断信息不能如实回显，
    # 但「什么都没留」等于把可查性一起消灭。
    snippet=redact(stderr) or redact(stdout)
    tail=('；CLI 输出摘要（已脱敏）：' + snippet) if snippet else ''
    return 'DWS '+ ' '.join(command)+'：'+cause+suffix+tail
