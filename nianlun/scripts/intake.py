"""Explicit one-off intake scopes and optional DWS sources."""
import re
from html.parser import HTMLParser
import nianlun as n
from source_state import Incomplete

CHANNELS=('minutes','mentions','direct','groups','mail','lark_minutes','harness','workbench')


def enabled(settings):
    sources=settings.get('sources',{})
    return [k for k in CHANNELS if
            (k in ('harness','workbench') or sources.get(k,k in ('minutes','mentions','direct')))]


def selection(config, value):
    if value is None:return None
    if not isinstance(value,dict) or set(value)-{'channels','project_ids'}:raise n.Error('采集范围格式错误')
    channels=value.get('channels',[])
    projects=value.get('project_ids',[])
    if not isinstance(channels,list) or not channels or any(not isinstance(x,str) for x in channels):
        raise n.Error('至少选择一个已启用的信息来源')
    if set(channels)-set(enabled(config['growth'])):raise n.Error('所选来源尚未启用，请先在接入与运行中配置')
    if not isinstance(projects,list) or any(not isinstance(x,str) or not x for x in projects):
        raise n.Error('项目范围格式错误')
    return {'channels':sorted(set(channels)),'project_ids':sorted(set(projects))}


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__();self.parts=[];self.hidden=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.hidden+=1
        if tag in ('br','p','div','li','tr'):self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.hidden=max(0,self.hidden-1)
    def handle_data(self,data):
        if not self.hidden:self.parts.append(data)


def mailboxes(gw):
    data=gw.call(['mail','mailbox','list'])
    accounts=data.get('emailAccounts')
    if not isinstance(accounts,list):raise n.Error('邮箱列表未完整返回，请重试读取；未认定为没有邮箱')
    emails=[]
    for account in accounts:
        email=account.get('email') if isinstance(account,dict) else None
        if not isinstance(email,str) or not re.fullmatch(r'[^@\s]+@[^@\s]+',email):
            raise n.Error('邮箱地址返回异常，请重新读取邮箱列表')
        if email in emails:raise n.Error('当前身份的邮箱列表存在重复，请检查钉钉账号')
        emails.append(email)
    return emails


def check_mailbox(gw,email):
    if not isinstance(email,str) or not re.fullmatch(r'[^@\s]+@[^@\s]+',email):
        raise n.Error('请先读取并选择本人邮箱')
    if email not in mailboxes(gw):raise n.Error('所选邮箱不在当前身份的邮箱列表中，请重新读取并选择')


def mail_body(detail,mid):
    if detail.get('id')!=mid:raise n.Error('邮件详情编号不符')
    if detail.get('bodyHasMore') is True:raise n.Error('邮件正文返回不完整，保留补采窗口')
    body=detail.get('markdownBody') or detail.get('body')
    if isinstance(body,dict):
        content=body.get('content','')
        if str(body.get('contentType','')).lower()=='html':
            parser=PlainText();parser.feed(content);content=''.join(parser.parts)
        body=content
    if not isinstance(body,str) or not body.strip():raise n.Error('邮件正文尚未获取')
    return body


def mail_probe(gw,email,start,end,progress=lambda message:None):
    """Read one recent message without storing its content or changing collection settings."""
    progress('正在核验所选邮箱')
    check_mailbox(gw,email)
    progress('正在查询最近 24 小时的邮件')
    data=gw.call(['mail','+search-mail','--email',email,'--query',
        'date>='+start.isoformat()+' AND date<'+end.isoformat(),'--size','1'])
    messages=data.get('messages')
    if not isinstance(messages,list):raise n.Error('邮件列表未完整返回，读取验证未通过')
    if not messages:
        if data.get('meta',{}).get('pagination',{}).get('endpoint_exhausted') is not True:
            raise n.Error('邮件列表未确认结束，无法判断近期是否有邮件')
        return {'email':email,'list_readable':True,'body_readable':None,'sample_count':0,
                'since':start.isoformat(),'until':end.isoformat()}
    mid=messages[0].get('messageId')
    if not mid:raise n.Error('邮件列表缺少稳定编号，尚未读取正文')
    progress('正在验证一封邮件的正文读取')
    detail=gw.call(['mail','+message','--email',email,'--id',mid]).get('value',{})
    mail_body(detail,mid)
    return {'email':email,'list_readable':True,'body_readable':True,'sample_count':1,
            'since':start.isoformat(),'until':end.isoformat()}


def mail(gw, settings, start, end, add, instant, progress=lambda message:None):
    email=settings.get('mailbox')
    progress('本人邮箱：正在核验账号')
    check_mailbox(gw,email)
    query='date>='+start.isoformat()+' AND date<'+end.isoformat()
    token=None;tokens=set();found={};errors=[]
    for _ in range(100):
        progress('本人邮箱：正在读取邮件列表第 '+str(_+1)+' 页')
        args=['mail','+search-mail','--email',email,'--query',query,'--size','100']
        if token:args+=['--cursor',token]
        data=gw.call(args)
        if not isinstance(data.get('messages'),list):raise Incomplete('邮件列表结构不完整',len(found))
        for item in data['messages']:
            if not item.get('messageId'):raise Incomplete('邮件缺少稳定编号',len(found))
            found[item['messageId']]=item
        paging=data.get('meta',{}).get('pagination',{})
        if paging.get('endpoint_exhausted') is True:break
        token=paging.get('next_token')
        if not token or token in tokens:
            errors.append('邮件分页未能确认结束，保留补采窗口');break
        tokens.add(token)
    else:errors.append('邮件分页达到本轮上限')
    read=0;failed=0
    for index,(mid,item) in enumerate(found.items(),1):
        progress('本人邮箱：正在读取第 '+str(index)+' / '+str(len(found))+' 封正文')
        try:
            detail=gw.call(['mail','+message','--email',email,'--id',mid]).get('value',{})
            body=mail_body(detail,mid)
            date=detail.get('receivedDateTime') or detail.get('sentDateTime') or item.get('date')
            if not date:raise n.Error('邮件缺少可核验时间')
            when=instant(date,end.tzinfo)
            if not start<=when<end:continue
            add('mail',email+':'+mid,detail.get('subject') or item.get('subject') or '邮件',
                body,when.isoformat(),content_kind='mail_body')
            read+=1
        except n.Error as exc:
            failed+=1;errors.append(str(exc))
    if errors:raise Incomplete('邮件已采集 '+str(read)+' 封，正文失败 '+str(failed)+' 封；'+ '; '.join(dict.fromkeys(errors)),len(found))
    return len(found)
