"""Regression coverage for transport, fast edits, bulk receipts and frozen report evidence."""
import copy,json,os,tempfile,unittest,uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import nianlun as n
import dws_transport as transport
import flow,harness,planning
from test_workbench import WorkbenchTests,Cloud
from workbench import Workbench

class Transport(unittest.TestCase):
    def test_stderr_timeout_retains_cause_without_secret(self):
        r=SimpleNamespace(stdout='',stderr=json.dumps({'error':{'reason':'io_timeout','cause':'https://private.test/token-secret'}}))
        value=transport.failure(r,['aitable','record','query'])
        self.assertIn('连接钉钉服务超时',value);self.assertNotIn('token-secret',value)
        self.assertIn('写入结果未知',transport.failure(r,['aitable','+record-update']))
    def test_user_proxy_wins_and_no_global_mutation(self):
        with patch.dict(os.environ,{'HTTPS_PROXY':'https://mine'},clear=True),patch('dws_transport.getproxies',return_value={'https':'https://system','http':'http://system'}):
            env=transport.environment();self.assertEqual(env['HTTPS_PROXY'],'https://mine');self.assertEqual(env['HTTP_PROXY'],'http://system');self.assertNotIn('HTTP_PROXY',os.environ)

class FastEdits(WorkbenchTests):
    def test_edit_form_with_cleared_optional_date_verifies_once(self):
        self.work.mutate(self.create());row=self.work.snapshot()['projects'][0]
        req={'request_id':str(uuid.uuid4()),'op':'update','role':'projects','record_id':row['id'],'revision':row['revision'],
            'values':{'title':row['title'],'status':row['status'],'priority':'P1','description':'页面保存','goal':'','deadline':'','notes':'','risk':''}}
        result=self.work.mutate(req);count=self.cloud.writes
        self.assertTrue(result['verified']);self.assertEqual(result['row']['description'],'页面保存')
        self.work.mutate(req);self.assertEqual(self.cloud.writes,count)
    def test_scalar_save_reads_only_target_record_and_returns_revision(self):
        rid=self.work.mutate(self.create())['record_id'];row=self.work.snapshot()['projects'][0]
        calls=[];factory=self.cloud.gateway
        def gateway(config):
            gw=factory(config);original=gw.call
            def call(args):calls.append(args);return original(args)
            gw.call=call;return gw
        self.work.gateway_factory=gateway
        r=self.work.mutate({'request_id':str(uuid.uuid4()),'op':'update','role':'projects','record_id':rid,'revision':row['revision'],'values':{'description':'更新'}})
        self.assertEqual(r['row']['description'],'更新');self.assertNotEqual(r['row']['revision'],row['revision'])
        self.assertFalse(any(a[1:3]==['record','query'] for a in calls));self.assertEqual(sum(a[1]=='+record-query' for a in calls if len(a)>1),2)
    def test_bulk_keeps_verified_item_and_reports_failed_item(self):
        self.work.mutate(self.create());row=self.work.snapshot()['projects'][0]
        item={'op':'update','role':'projects','record_id':row['id'],'revision':row['revision'],'values':{'description':'批量'}}
        req={'request_id':str(uuid.uuid4()),'items':[item,{**item,'revision':'stale'}]}
        first=self.work.bulk(req);writes=self.cloud.writes;second=self.work.bulk(req)
        self.assertEqual((first['succeeded'],first['failed']),(1,1));self.assertEqual(second['succeeded'],1);self.assertEqual(writes,self.cloud.writes)
    def test_todo_prefix_links_unique_project_without_closing_records(self):
        self.work.mutate(self.create('项目甲'));factory=self.cloud.gateway
        def gateway(config):
            gw=factory(config);original=gw.call
            gw.call=lambda args: {'todos':[{'taskId':'t','subject':'【项目甲】处理问题'}],'complete':True,'hasMore':False} if args[0]=='todo' else original(args)
            return gw
        self.work.gateway_factory=gateway
        result=self.work.todos()['todos'][0];self.assertEqual(result['link']['record_ids'],[]);self.assertEqual(result['link']['inferred_from'],'title_prefix')
    def test_report_uses_frozen_full_memory_across_resume(self):
        self.work.mutate(self.create());pid=self.work.snapshot()['projects'][0]['id']
        self.config['growth'].update(brain_dir='/dummy',report_folder='folder',switches={'reports':True})
        report=Path(self.dir)/'report';query={'matched':True,'pages':[{'title':'验收决定','slug':'p/accept','text':'验收已完成','full_page':True}],'text':'验收已完成'}
        with patch('flow.g.Gateway',side_effect=self.cloud.gateway),patch('flow.memory.retrieve',return_value=query) as retrieve,patch('flow.g.publish_report',return_value={'url':'https://example.test/r'}),patch('flow.harness.reason',return_value={'answer':'结论'}) as reason:
            flow.report_projects(self.config,[pid],'2026-10-01','2026-10-21',{},request_dir=report)
            self.assertIn('验收已完成',reason.call_args[0][0]);self.assertIn('p/accept',reason.call_args[0][0])
            flow.report_projects(self.config,[pid],'2026-10-01','2026-10-21',{},request_dir=report)
            self.assertEqual(retrieve.call_count,1);self.assertEqual(reason.call_count,1)
    def test_report_memory_failure_is_visible(self):
        self.work.mutate(self.create());pid=self.work.snapshot()['projects'][0]['id'];self.config['growth'].update(brain_dir='/dummy',report_folder='folder',switches={'reports':True})
        with patch('flow.g.Gateway',side_effect=self.cloud.gateway),patch('flow.memory.retrieve',side_effect=n.Error('memory offline')),patch('flow.harness.reason') as reason:
            with self.assertRaisesRegex(n.Error,'memory offline'):flow.report_projects(self.config,[pid],'2026-10-01','2026-10-21',{})
            reason.assert_not_called()
    def test_planning_only_target_does_not_invent_a_schedule(self):
        req=self.create();req['values'].update(goal='交付',deadline='2026-12-31');pid=self.work.mutate(req)['record_id'];self.config['growth']['switches']={'table_writes':True}
        with patch('planning.g.Gateway',side_effect=self.cloud.gateway),patch('planning.harness.reason') as reason:
            result=planning.run(self.config,[pid],{},self.dir/'plans');reason.assert_not_called();self.assertIn('缺少交付依据',result['pending'][0])

class Skills(unittest.TestCase):
    def test_recursive_skill_scan_and_node_modules_exclusion(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            for path in ('nested/more/skill/SKILL.md','node_modules/dep/SKILL.md'):
                f=root/path;f.parent.mkdir(parents=True,exist_ok=True);f.write_text('---\nname: nested\ndescription: test\n---\n')
            found=[s for s in harness.capabilities({'provider':'generic'},[tmp]) if s['root']==tmp]
            self.assertEqual(len(found),1);self.assertIn('/nested/more/',found[0]['path'])


class CDBI(unittest.TestCase):
    def test_install_does_not_guess_unknown_platform_download(self):
        import cdbi_adapter
        with tempfile.TemporaryDirectory() as tmp,patch('cdbi_adapter.deps.find_binary',return_value=None),patch('cdbi_adapter.deps.platform_key',return_value=('windows','x64')),patch('cdbi_adapter.deps.download') as download:
            with self.assertRaisesRegex(n.Error,'缺少组织提供'):cdbi_adapter.install(Path(tmp))
            download.assert_not_called()
    def test_install_requires_https_and_hash(self):
        import cdbi_adapter
        with tempfile.TemporaryDirectory() as tmp,patch('cdbi_adapter.deps.find_binary',return_value=None),patch('cdbi_adapter.deps.download') as download:
            with self.assertRaises(n.Error):cdbi_adapter.install(Path(tmp),'http://example.test/a','0'*64)
            download.assert_not_called()

class RecordLifecycle(unittest.TestCase):
    def test_newer_resolution_updates_original_without_creating_record(self):
        from test_growth import Tests
        import growth as g
        case=Tests();case.setUp()
        try:
            d=case.decision([{**case.base,'op':'update_status','role':'records','record_id':'R1','status':'已解决','match':'unique'}])
            result=case.run_apply(d)
            self.assertEqual(len(case.gw.t.raw['records']),1);self.assertEqual(case.gw.t.raw['records'][0]['cells']['records-status'],'已解决')
            with patch.object(g,'Gateway',return_value=case.gw):g.apply(case.cfg,case.p,case.p/'plan.json')
            self.assertEqual(case.gw.t.writes,1)
        finally:case.doCleanups()
    def test_same_open_record_from_another_channel_is_not_created(self):
        from test_growth import Tests
        import growth as g
        case=Tests();case.setUp()
        try:
            d=case.decision([{**case.base,'op':'create_record','title':'联调','description':'另一个渠道又提到联调','date':'2026-10-19','kind':'沟通要点'}])
            with self.assertRaisesRegex(n.Error,'同名未关闭'):g.validate(case.cfg,case.b,d)
        finally:case.doCleanups()

class CDBIImports(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        self.key='a'*32;self.config=self.root/'config.json';n.save(self.config,{'tables':{'sites':{'fields':{'code':{},'notes':{}}}}})
        self.app=SimpleNamespace(runtime=self.root,config=self.config)
        n.save(self.root/'cdbi'/('preview-'+self.key+'.json'),{'dataset':'d','project_id':'p','rows':[{'code':'S1','title':'场地一'},{'code':'S2','title':'场地二'}]})
        self.calls=[]
        self.app.work=SimpleNamespace(snapshot=lambda:{'projects':[{'id':'p'}],'sites':[{'id':'s','code':'S1','project_ids':['p']}]},mutate=lambda d:self.calls.append(d) or {'verified':True})
        self.request={'dataset':'d','preview':self.key,'codes':['S1','S2'],'request_id':str(uuid.uuid4())}
    def test_import_skips_existing_code_and_reuses_write_id(self):
        import cdbi_adapter
        r=cdbi_adapter.action(self.app,'cdbi_import',self.request,lambda _:None)
        cdbi_adapter.action(self.app,'cdbi_import',{**self.request,'request_id':str(uuid.uuid4())},lambda _:None)
        self.assertEqual(r['items'][0]['status'],'already_present');self.assertEqual(len(self.calls),2)
        self.assertEqual(self.calls[0]['request_id'],self.calls[1]['request_id']);self.assertEqual(self.calls[0]['values']['project_ids'],['p'])
    def test_import_rejects_changed_dataset_or_nonpreview_code(self):
        import cdbi_adapter
        for value in ({'dataset':'different'},{'codes':['other']}):
            with self.assertRaises(n.Error):cdbi_adapter.action(self.app,'cdbi_import',{**self.request,**value},lambda _:None)
        self.assertFalse(self.calls)

class SkillLinks(unittest.TestCase):
    def test_direct_symlink_skill_is_discovered_without_cycles(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);target=root/'target';target.mkdir();(target/'SKILL.md').write_text('---\nname: linked\n---\n')
            catalog=root/'catalog';catalog.mkdir();(catalog/'linked').symlink_to(target,target_is_directory=True);(catalog/'cycle').symlink_to(catalog,target_is_directory=True)
            found=[s for s in harness.capabilities({'provider':'generic'},[str(catalog)]) if s['root']==str(catalog)]
            self.assertEqual(len(found),1)

if __name__=='__main__':unittest.main()

class PartialJob(unittest.TestCase):
    def test_partial_bulk_job_remains_resumable_and_notification_is_failure(self):
        from server import Application
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);app=Application(root/'home',root/'config.json')
            self.addCleanup(app.read_pool.shutdown);self.addCleanup(app.write_pool.shutdown)
            job={'id':'partial','op':'bulk_mutate','status':'succeeded','resume_data':{},'created_at':'2026-10-21T10:00:00+08:00','result':{'succeeded':1,'failed':1,'items':[]}}
            app.jobs['partial']=job
            self.assertTrue(app.job_view(job)['can_resume'])
            self.assertEqual(app.notifications()['jobs'][0]['status'],'failed')
