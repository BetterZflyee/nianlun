"""Cross-sink behavior, with synthetic evidence and fake DWS. No production writes."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import growth as g
import nianlun as n
from test_nianlun import fixture, Fake

class Gateway:
    def __init__(self,cfg,raw):
        self.t=Fake(cfg,raw);self.todo={'taskId':'T1','subject':'[测试项目] 联调','isDone':False};self.creates=0;self.completes=0;self.fail=False
    def table(self):return self.t
    def call(self,args,**kw):
        if args[:3]==['contact','user','get-self']:return {'result':[{'orgEmployeeModel':{'userId':'U1','orgUserName':'本人','corpId':'C1'}}]}
        if args[:2]==['todo','+get-my-tasks']:return {'complete':True,'todos':[] if self.todo['isDone'] else [self.todo]}
        if args[:2]==['todo','+get']:return self.todo
        if args[:3]==['todo','task','create']:
            self.creates+=1
            self.todo={'taskId':'T2','subject':args[args.index('--title')+1],'isDone':False}
            if self.fail:raise n.Error('unknown outcome')
            return {'result':{'taskId':'T2'}}
        if args[:2]==['todo','+complete']:
            self.completes+=1;self.todo['isDone']=True;return {'verified':True}
        if args[0]=='aitable':return self.t.call(args[1:])
        raise AssertionError(args)

class Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.p=Path(self.temp.name)
        self.cfg,raw=fixture();self.cfg['growth']={'state_dir':str(self.p),'switches':{'table_writes':True,'todos':True,'completion':True}}
        raw['records']=[{'recordId':'R1','cells':{'records-title':'联调','records-status':'处理中','records-project_ids':{'linkedRecordIds':['P1']}}}]
        self.gw=Gateway(self.cfg,raw)
        self.b={'run_id':'run1','binding':n.digest(self.cfg),'identity':{'user_id':'U1','name':'本人','corp_id':'C1'},'until':'2026-10-19T20:00:00+08:00',
                'tables':n.fetch(self.cfg,self.gw.table()),'todos':[self.gw.todo.copy()],
                'sources':[{'id':'msg1','name':'来源','text':'联调已经完成，下一步编写说明','time':'2026-10-19T19:00:00+08:00'}]}
        self.base={'project':'测试项目','source_id':'msg1','quote':'联调已经完成'}
    def decision(self,a):return {'run_id':'run1','summary':'联调已完成。','actions':a}
    def test_portal_human_requests_follow_conversation_opt_in(self):
        self.check_portal_source(True)
    def test_disabled_conversation_source_does_not_read_portal_requests(self):
        self.check_portal_source(False)
    def check_portal_source(self,enabled):
        self.cfg['growth'].update(sources={'minutes':False,'mentions':False,'direct':False},
            codex_session_dirs=[str(self.p/'codex')] if enabled else [],inbox_dirs=[])
        user={'id':'portal-fixture','name':'页面会话','role':'user','time':'2026-10-20T09:10:00+08:00','text':'联调已经完成'}
        assistant={**user,'id':'not-human','role':'assistant','text':'模型推断全部完成'}
        n.save(self.p/'portal-conversations/fixture.jsonl',json.dumps(user)+'\n'+json.dumps(assistant)+'\n')
        with patch.object(g,'Gateway',return_value=self.gw):
            result=g.collect(self.cfg,'2026-10-20T09:00:00+08:00','2026-10-20T10:00:00+08:00')
        bundle=n.load(Path(result['run_dir'])/'evidence.json')
        self.assertEqual([x['id'] for x in bundle['sources']],['harness:portal-fixture'] if enabled else [])
    def test_workbench_evidence_ignores_staged_cell_arrays(self):
        key='12345678-1234-4234-8234-123456789abc'
        self.cfg['growth'].update(sources={'minutes':False,'mentions':False,'direct':False},codex_session_dirs=[],inbox_dirs=[])
        directory=self.p/'workbench'
        n.save(directory/('request-'+key+'-table-cells.json'),[{'cells':{'title':'临时写入数据'}}])
        n.save(directory/('request-'+key+'.json'),{'status':'verified','finished_at':'2026-10-20T09:10:00+08:00',
            'intent':{'request':{'request_id':key,'op':'create','values':{'title':'页面输入'}}},'result':{'verified':True,'record_id':'P1'}})
        with patch.object(g,'Gateway',return_value=self.gw):
            result=g.collect(self.cfg,'2026-10-20T09:00:00+08:00','2026-10-20T10:00:00+08:00')
        bundle=n.load(Path(result['run_dir'])/'evidence.json')
        coverage=next(c for c in bundle['coverage'] if c['channel']=='workbench')
        self.assertEqual({k:coverage[k] for k in ('channel','status','count')},{'channel':'workbench','status':'complete','count':1})
        self.assertEqual(coverage['since'],'2026-10-20T09:00:00+08:00')
        self.assertEqual([s['id'] for s in bundle['sources']],['workbench:'+key])
    def write(self,d):
        n.save(self.p/'evidence.json',self.b);p=g.validate(self.cfg,self.b,d);n.save(self.p/'plan.json',p);return p
    def run_apply(self,d):
        self.write(d)
        with patch.object(g,'Gateway',return_value=self.gw):return g.apply(self.cfg,self.p,self.p/'plan.json')
    def test_missing_and_fabricated_quote_rejected(self):
        a={**self.base,'op':'create_todo','executor':'self','title':'编写说明','record_ids':['R1'],'quote':'不存在'}
        with self.assertRaises(n.Error):g.validate(self.cfg,self.b,self.decision([a]))
    def test_duplicate_todo_titles_are_not_unique_even_if_model_says_so(self):
        self.b['todos'].append({**self.b['todos'][0],'taskId':'duplicate'})
        action={**self.base,'op':'complete_todo','task_id':'T1','expected_title':'[测试项目] 联调',
                'record_ids':['R1'],'match':'unique','completion':'explicit'}
        with self.assertRaisesRegex(n.Error,'重复标题'):g.validate(self.cfg,self.b,self.decision([action]))
    def test_auto_completion_cannot_reassign_known_todo_link(self):
        self.b['todo_links']={'T1':{'project_id':'another-project','record_ids':['R1']}}
        action={**self.base,'op':'complete_todo','task_id':'T1','expected_title':'[测试项目] 联调',
                'record_ids':['R1'],'match':'unique','completion':'explicit'}
        with self.assertRaisesRegex(n.Error,'项目关系不同'):g.validate(self.cfg,self.b,self.decision([action]))
    def test_cross_project_record_and_ambiguous_completion_rejected(self):
        a={**self.base,'op':'complete_todo','task_id':'T1','expected_title':'[测试项目] 联调','record_ids':['R1'],'match':'ambiguous','completion':'explicit'}
        with self.assertRaises(n.Error):g.validate(self.cfg,self.b,self.decision([a]))
        a['match']='unique';a['record_ids']=['foreign']
        with self.assertRaises(n.Error):g.validate(self.cfg,self.b,self.decision([a]))
    def test_complete_updates_todo_and_record_and_replay_does_not_write(self):
        a={**self.base,'op':'complete_todo','task_id':'T1','expected_title':'[测试项目] 联调','record_ids':['R1'],'match':'unique','completion':'explicit'}
        d=self.decision([a]);r=self.run_apply(d)
        self.assertEqual(r['status'],'verified');self.assertTrue(self.gw.todo['isDone'])
        self.assertEqual(self.gw.t.raw['records'][0]['cells']['records-status'],'已解决')
        with patch.object(g,'Gateway',return_value=self.gw):g.apply(self.cfg,self.p,self.p/'plan.json')
        self.assertEqual(self.gw.completes,1);self.assertEqual(self.gw.t.writes,1)
    def test_unknown_todo_creation_is_not_replayed(self):
        a={**self.base,'op':'create_todo','executor':'self','title':'编写说明','record_ids':['R1']};self.gw.fail=True;d=self.decision([a]);self.write(d)
        with patch.object(g,'Gateway',return_value=self.gw):
            for _ in range(2):
                with self.assertRaises(n.Error):g.apply(self.cfg,self.p,self.p/'plan.json')
        self.assertEqual(self.gw.creates,1);self.assertIn('in_flight',n.load(self.p/'receipt.json'))
    def test_todo_links_to_new_record(self):
        a={**self.base,'op':'create_record','title':'说明待编写','description':'下一步编写说明','date':'2026-10-19','kind':'沟通要点','ref':'note'}
        b={**self.base,'op':'create_todo','executor':'self','title':'编写说明','record_ref':'note'}
        r=self.run_apply(self.decision([a,b]));self.assertEqual(r['status'],'verified')
        self.assertEqual(n.load(self.p/'links.json')['T2']['record_ids'],['created-1'])
    def test_plan_cannot_change_after_partial_execution(self):
        a={**self.base,'op':'create_todo','executor':'self','title':'编写说明','record_ids':['R1']};self.run_apply(self.decision([a]))
        a['title']='另一个任务';self.write(self.decision([a]))
        with patch.object(g,'Gateway',return_value=self.gw),self.assertRaises(n.Error):g.apply(self.cfg,self.p,self.p/'plan.json')
        self.assertEqual(self.gw.creates,1)
    def test_disabled_switch_stops_before_submission(self):
        self.cfg['growth']['switches']['todos']=False;self.b['binding']=n.digest(self.cfg)
        a={**self.base,'op':'create_todo','executor':'self','title':'编写说明','record_ids':['R1']}
        with self.assertRaises(n.Error):self.run_apply(self.decision([a]))
        self.assertEqual(self.gw.creates,0)
    def test_delayed_apply_ignores_generation_clock_only(self):
        a={**self.base,'op':'create_record','title':'说明待编写','description':'下一步编写说明','date':'2026-10-19','kind':'沟通要点'}
        with patch.object(n,'stamp',return_value='2026-10-19T19:00:00+08:00'):self.write(self.decision([a]))
        with patch.object(n,'stamp',return_value='2026-10-19T20:00:00+08:00'),patch.object(g,'Gateway',return_value=self.gw):
            result=g.apply(self.cfg,self.p,self.p/'plan.json')
        self.assertEqual(result['status'],'verified');self.assertEqual(self.gw.t.writes,1)
    def test_deferred_source_cannot_also_drive_action(self):
        a={**self.base,'op':'create_todo','executor':'self','title':'编写说明','record_ids':['R1']}
        d=self.decision([a]);d['deferred_source_ids']=['msg1']
        with self.assertRaises(n.Error):g.validate(self.cfg,self.b,d)
    def test_nested_gateway_business_error_is_rejected(self):
        from types import SimpleNamespace
        response=SimpleNamespace(returncode=0,stdout='进度提示\n{"ok":true,"result":{"success":false}}')
        with patch.object(g.subprocess,'run',return_value=response),self.assertRaises(n.Error):
            g.Gateway(self.cfg).call(['todo','task','create'])
    def test_credentials_suppressed_and_quotes_cannot_invent(self):
        s=g.sanitize('进展\nadmin/secret-value\npassword=abc\n完成')
        self.assertNotIn('secret-value',s);self.assertNotIn('abc',s);self.assertIn('完成',s)
    def test_partial_lists_are_not_empty_success(self):
        with self.assertRaises(n.Error):g.complete({'complete':False,'todos':[]},'todos')

if __name__=='__main__':unittest.main()
