"""Explicit project actions, with receipts and the same DWS identity throughout."""
import uuid
import nianlun as n
import growth as g
from workbench import text, request_id


def groups(config, query):
    query=text(query,'群名称',200,True);gw=g.Gateway(config);identity=g.self_identity(gw)
    data=gw.call(['chat','+chat-search','--query',query,'--page-all','--page-limit','50'])
    rows=g.complete(data,'chats')
    candidates=[{'id':x['openConversationId'],'name':x.get('name') or x.get('title') or x['openConversationId']}
                for x in rows if x.get('openConversationId')]
    token=uuid.uuid4().hex
    n.save(g.root(config)/'group-search'/(token+'.json'),{'identity':identity,'groups':candidates})
    return {'search_id':token,'groups':candidates,'complete':True}


def verified_group(config, gw, data):
    sid=data.get('search_id','')
    if not isinstance(sid,str) or len(sid)!=32 or any(c not in '0123456789abcdef' for c in sid):raise n.Error('请先搜索群并选择结果')
    found=n.load(g.root(config)/'group-search'/(sid+'.json'))
    if found['identity']!=g.self_identity(gw):raise n.Error('群搜索身份发生变化，请重新搜索')
    matches=[x for x in found['groups'] if x['id']==data.get('group_id')]
    if len(matches)!=1:raise n.Error('请选择搜索返回的一个明确群聊')
    return matches[0]


def send_report(config, data):
    """No automatic recipients. A page click submits a frozen report to a selected group."""
    gw=g.Gateway(config);identity=g.self_identity(gw)
    key=request_id(data.get('request_id'));path=g.root(config)/'project-sends'/(key+'.json')
    receipt=n.load(path) if path.exists() else {}
    intent={'identity':identity,'data':data}
    if receipt and receipt['intent']!=intent:raise n.Error('发送请求内容已变化')
    if receipt.get('status')=='delivered':return receipt['result']
    if not receipt:
        group=verified_group(config,gw,data)
        report_id=text(data.get('report_id'),'汇报编号',16,True)
        if len(report_id)!=16 or any(c not in '0123456789abcdef' for c in report_id):raise n.Error('汇报编号无效')
        report=n.load(g.root(config)/'reports'/report_id/'receipt.json')
        if report.get('status')!='verified' or report.get('project_id')!=data.get('project_id'):raise n.Error('汇报尚未核验或与项目不符')
        content=text(data.get('message'),'群消息',12000,True)
        if report['url'] not in content:raise n.Error('发送内容必须保留本次已核验的汇报链接')
        receipt={'intent':intent,'group':group,'content':content,'status':'prepared'};n.save(path,receipt)
    if receipt.get('status')=='in_flight':raise n.Error('上次群发送结果未知，请核对执行回执；未重复发送')
    if receipt['status']=='prepared':
        receipt['status']='in_flight';n.save(path,receipt)
        receipt['sent']=gw.call(['chat','+messages-send','--group',receipt['group']['id'],'--text',receipt['content'],
            '--idempotency-key',key,'--yes'])
        receipt['status']='submitted';n.save(path,receipt)
    task=receipt['sent'].get('sendReceipt',{}).get('openTaskId')
    if not task:raise n.Error('群消息已提交但未返回投递句柄，未重复发送')
    delivery=gw.call(['chat','+messages-query-send-status','--open-task-id',task])
    receipt['delivery']=delivery;n.save(path,receipt)
    if delivery.get('result',{}).get('sendStatus')!='SUCCESS':raise n.Error('群消息投递尚未确认，可用原请求继续查询')
    result={'verified':True,'group':receipt['group'],'status':'delivered'}
    receipt.update(status='delivered',result=result);n.save(path,receipt);return result
