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


def mail(gw, settings, start, end, add, instant):
    email=settings.get('mailbox')
    if not isinstance(email,str) or not re.fullmatch(r'[^@\s]+@[^@\s]+',email):
        raise n.Error('请先选择本人邮箱，未默认选取第一个账号')
    accounts=gw.call(['mail','mailbox','list']).get('emailAccounts',[])
    if sum(x.get('email')==email for x in accounts)!=1:raise n.Error('所选邮箱不在当前身份的邮箱列表中')
    query='date>='+start.isoformat()+' AND date<'+end.isoformat()
    token=None;tokens=set();found={};errors=[]
    for _ in range(100):
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
    for mid,item in found.items():
        try:
            detail=gw.call(['mail','+message','--email',email,'--id',mid]).get('value',{})
            if detail.get('id')!=mid:raise n.Error('邮件详情编号不符')
            date=detail.get('receivedDateTime') or detail.get('sentDateTime') or item.get('date')
            if not date:raise n.Error('邮件缺少可核验时间')
            when=instant(date,end.tzinfo)
            if not start<=when<end:continue
            body=detail.get('markdownBody') or detail.get('body')
            if isinstance(body,dict):
                content=body.get('content','')
                if str(body.get('contentType','')).lower()=='html':
                    parser=PlainText();parser.feed(content);content=''.join(parser.parts)
                body=content
            if not isinstance(body,str) or not body.strip():raise n.Error('邮件正文尚未获取')
            add('mail',email+':'+mid,detail.get('subject') or item.get('subject') or '邮件',
                body,when.isoformat(),content_kind='mail_body')
        except n.Error as exc:errors.append(str(exc))
    if errors:raise Incomplete('; '.join(dict.fromkeys(errors)),len(found))
    return len(found)
