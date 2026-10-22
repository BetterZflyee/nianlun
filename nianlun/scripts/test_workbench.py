import copy
import http.client
import json
import tempfile
import threading
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

import nianlun as n
from setup import TEMPLATE
from workbench import Workbench, revision
from server import HTTPServer, Handler, Application


class Cloud:
    def __init__(self, config):
        self.config=config;self.rows={r:[] for r in n.ROLES};self.writes=0;self.lose_reply=False
    def gateway(self, config):
        cloud=self
        class GW:
            def __init__(self):self.config=config
            def call(self,args):
                if args[:3]==['contact','user','get-self']:
                    return {'result':[{'orgEmployeeModel':{'userId':'tester','orgUserName':'测试者','corpId':'org'}}]}
                if args[0]!='aitable':raise AssertionError(args)
                a=args[1:];arg=lambda k:a[a.index(k)+1]
                role=arg('--table-id')
                if a[:2]==['field','list']:return {'fields':list(copy.deepcopy(config['tables'][role]['fields']).values())}
                if a[:2]==['record','query']:
                    rows=copy.deepcopy(cloud.rows[role]);return {'complete':True,'hasMore':False,'fetchedCount':len(rows),'records':rows}
                if a[:2]==['record','create']:
                    cloud.writes+=1;rid='record-'+str(cloud.writes);cells=n.load(arg('--records-file'))[0]['cells']
                    cloud.rows[role].append({'recordId':rid,'cells':cells})
                    if cloud.lose_reply:cloud.lose_reply=False;raise n.Error('提交后连接断开')
                    return {'newRecordIds':[rid]}
                if a[0]=='+record-update':
                    cloud.writes+=1;v=json.loads(arg('--records'))[0]
                    row=next(r for r in cloud.rows[role] if r['recordId']==v['recordId']);row['cells'].update(v['cells'])
                    return {}
                if a[0]=='+record-query':return {'records':[copy.deepcopy(r) for r in cloud.rows[role] if r['recordId']==arg('--record-ids')]}
                raise AssertionError(args)
            def table(self):
                gw=self
                class Table(n.DWS):
                    def call(self,args):return gw.call(['aitable',*args])
                return Table()
        return GW()


class WorkbenchTests(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);self.dir=Path(tmp.name)
        config={'base_id':'base','base_url':'https://alidocs.dingtalk.com/i/nodes/base','profile':'test',
                'growth':{'state_dir':str(self.dir/'state')},'tables':{}}
        for role,fields in TEMPLATE.items():
            config['tables'][role]={'id':role,'name':role,'fields':{}}
            for key,(name,kind,cfg) in fields.items():
                cfg=copy.deepcopy(cfg)
                if 'target' in cfg:cfg['linkedTableId']=cfg.pop('target')
                config['tables'][role]['fields'][key]={'fieldId':role+'-'+key,'fieldName':name,'type':kind,'config':cfg}
        self.config=config;self.path=self.dir/'config.json';n.save(self.path,config)
        self.cloud=Cloud(config);self.work=Workbench(self.path,self.cloud.gateway)
    def create(self,title='测试项目'):
        return {'request_id':str(uuid.uuid4()),'op':'create','role':'projects','values':{'title':title,'status':'进行中'}}

    def test_create_retry_reuses_verified_receipt(self):
        request=self.create();first=self.work.mutate(request);second=self.work.mutate(request)
        self.assertEqual(first,second);self.assertEqual(self.cloud.writes,1)
        row=self.work.snapshot()['projects'][0]
        self.assertIn('revision',row);self.assertNotIn('raw_cells',row)

    def test_unknown_create_is_reconciled_without_resending(self):
        request=self.create();self.cloud.lose_reply=True
        with self.assertRaisesRegex(n.Error,'连接断开'):self.work.mutate(request)
        result=self.work.mutate(request)
        self.assertTrue(result['verified']);self.assertEqual(self.cloud.writes,1)

    def test_conflicting_request_identifier_rejected(self):
        request=self.create();self.work.mutate(request);request['values']['title']='另一个项目'
        with self.assertRaisesRegex(n.Error,'请求编号'):self.work.mutate(request)
        self.assertEqual(self.cloud.writes,1)

    def test_optimistic_edit_does_not_overwrite_concurrent_changes(self):
        result=self.work.mutate(self.create());row=self.work.snapshot()['projects'][0]
        self.cloud.rows['projects'][0]['cells']['projects-title']='别人修改了标题'
        with self.assertRaisesRegex(n.Error,'其他人修改'):
            self.work.mutate({'request_id':str(uuid.uuid4()),'op':'update','role':'projects','record_id':result['record_id'],
                'revision':row['revision'],'values':{'status':'已完成'}})
        self.assertEqual(self.cloud.writes,1)

    def test_unknown_links_and_invalid_status_cannot_write(self):
        self.work.mutate(self.create())
        with self.assertRaisesRegex(n.Error,'关联对象已不存在'):
            self.work.mutate({'request_id':str(uuid.uuid4()),'op':'create','role':'records',
                'values':{'title':'记录','project_ids':['missing']}})
        request=self.create('项目二');request['values']['status']='凭空发明'
        with self.assertRaisesRegex(n.Error,'已有选项'):self.work.mutate(request)
        self.assertEqual(self.cloud.writes,1)

    def test_duplicate_name_rejected_before_cloud_write(self):
        self.work.mutate(self.create())
        with self.assertRaisesRegex(n.Error,'已有同名'):self.work.mutate(self.create())
        self.assertEqual(self.cloud.writes,1)

    def test_project_change_cannot_keep_incompatible_existing_links(self):
        one=self.work.mutate(self.create())['record_id'];two=self.work.mutate(self.create('项目二'))['record_id']
        site=self.work.mutate({'request_id':str(uuid.uuid4()),'op':'create','role':'sites','values':{'title':'场地','project_ids':[one]}})['record_id']
        record=self.work.mutate({'request_id':str(uuid.uuid4()),'op':'create','role':'records','values':{'title':'记录','project_ids':[one],'site_ids':[site]}})['record_id']
        row=next(r for r in self.work.snapshot()['records'] if r['id']==record)
        with self.assertRaisesRegex(n.Error,'不属于这个项目'):
            self.work.mutate({'request_id':str(uuid.uuid4()),'op':'update','role':'records','record_id':record,'revision':row['revision'],'values':{'project_ids':[two]}})
        self.assertEqual(self.cloud.writes,4)


class HTTPTests(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);self.dir=Path(tmp.name)
        app=Application(self.dir/'home',self.dir/'config.json');self.app=app
        self.addCleanup(app.read_pool.shutdown);self.addCleanup(app.write_pool.shutdown)
        self.server=HTTPServer(('127.0.0.1',0),Handler);self.server.app=app;self.server.token='test-secret'
        thread=threading.Thread(target=self.server.serve_forever,daemon=True);thread.start()
        self.addCleanup(self.server.server_close);self.addCleanup(self.server.shutdown)
        self.origin='http://127.0.0.1:'+str(self.server.server_port)
    def get(self,path,headers=None,body=None):
        conn=http.client.HTTPConnection('127.0.0.1',self.server.server_port)
        conn.request('POST' if body else 'GET',path,body=body,headers=headers or {})
        response=conn.getresponse();result=(response.status,response.read(),dict(response.headers));conn.close();return result

    def test_only_static_shell_is_public(self):
        status,body,headers=self.get('/')
        self.assertEqual(status,200);self.assertNotIn(b'test-secret',body)
        self.assertEqual(headers['X-Frame-Options'],'DENY')
        self.assertEqual(self.get('/api/bootstrap')[0],401)
        self.assertEqual(self.get('/api/bootstrap',{'Authorization':'Bearer test-secret'})[0],200)

    def test_relation_view_assets_are_served_with_module_types(self):
        for path, mime in [('/relations.js', 'javascript'), ('/relations-model.js', 'javascript'), ('/relations.css', 'text/css')]:
            status, body, headers = self.get(path)
            self.assertEqual(status, 200)
            self.assertTrue(body)
            self.assertIn(mime, headers['Content-Type'])

    def test_dns_rebinding_and_cross_origin_requests_rejected(self):
        self.assertEqual(self.get('/',{'Host':'attacker.example'})[0],403)
        headers={'Authorization':'Bearer test-secret','Origin':'https://attacker.example','Content-Type':'application/json'}
        self.assertEqual(self.get('/api/actions',headers,'{"op":"setup_probe"}')[0],403)
        headers.pop('Origin')
        self.assertEqual(self.get('/api/actions',headers,'{"op":"setup_probe"}')[0],403)

    def test_path_traversal_and_unknown_action_rejected(self):
        self.assertEqual(self.get('/../../config.json')[0],404)
        headers={'Authorization':'Bearer test-secret','Origin':self.origin,'Content-Type':'application/json'}
        self.assertEqual(self.get('/api/actions',headers,'{"op":"shell","data":{"command":"echo no"}}')[0],400)

    def test_bounded_body_and_no_cors(self):
        status,_,headers=self.get('/',{'Origin':'https://attacker.example'})
        self.assertEqual(status,403);self.assertNotIn('Access-Control-Allow-Origin',headers)
    def test_artifact_download_is_authenticated_and_cannot_escape_workspace(self):
        workspace=self.dir/'outputs';workspace.mkdir();(workspace/'result.txt').write_text('output')
        (workspace/'.context.json').write_text('private');(self.dir/'outside.txt').write_text('outside')
        (workspace/'link.txt').symlink_to(self.dir/'outside.txt')
        self.app.jobs['job']={'workspace':str(workspace)}
        headers={'Authorization':'Bearer test-secret'}
        self.assertEqual(self.get('/api/artifacts/job/result.txt')[0],401)
        self.assertEqual(self.get('/api/artifacts/job/result.txt',headers)[:2],(200,b'output'))
        for path in ('../outside.txt','%2e%2e/outside.txt','.context.json','link.txt'):
            self.assertEqual(self.get('/api/artifacts/job/'+path,headers)[0],404)


if __name__=='__main__':unittest.main()
