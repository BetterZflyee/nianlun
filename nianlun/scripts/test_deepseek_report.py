"""Direct reports must fail closed and retry without duplicating publication."""
import json,sys,tempfile,threading,time,unittest
from pathlib import Path
from unittest.mock import patch,MagicMock
import nianlun as n
import harness,host_bridge,deepseek_report as d
from server import Application

class DirectReport(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
    def generate(self,events,exit_code=0,delay=0,**kwargs):
        script=self.root/'fake.py'
        script.write_text('import sys,json,time\nsys.stdin.read()\n'+''.join('print('+repr(json.dumps(e))+',flush=True)\n' for e in events)+f'time.sleep({delay})\nsys.exit({exit_code})\n',encoding='utf-8')
        with patch('deepseek_report.command',return_value=[sys.executable,str(script)]):
            return d.generate('材料',self.root/'report',timeout=2,**kwargs)
    def events(self):
        return [{'type':'nianlun_policy','tools':0},{'type':'session'},
            {'type':'thinking','text':'private reasoning never persisted'},
            {'type':'status','reason':{'kind':'completed'}},
            {'type':'final','text':json.dumps({'answer':'# 阶段回顾\n有依据的结论'})}]
    def test_success_cache_has_no_reasoning_and_does_not_restart(self):
        answer=self.generate(self.events())
        with patch('deepseek_report.command',side_effect=AssertionError('must reuse')):
            self.assertEqual(d.generate('材料',self.root/'report'),answer)
        self.assertNotIn('private reasoning',(self.root/'report/direct-events.json').read_text())
        self.assertNotIn('thinking',(self.root/'report/direct-answer.json').read_text())
    def test_nonzero_with_final_is_failure_and_retry_can_succeed(self):
        with self.assertRaises(n.Error):self.generate(self.events(),exit_code=1)
        self.assertFalse((self.root/'report/direct-answer.json').exists())
        self.assertIn('answer',self.generate(self.events()))
    def test_missing_policy_or_completed_status_rejected(self):
        for typ in ('nianlun_policy','status'):
            with self.assertRaises(n.Error):self.generate([e for e in self.events() if e['type']!=typ])
    def test_tool_attempt_rejected_even_with_valid_final(self):
        with self.assertRaisesRegex(n.Error,'工具'):
            self.generate([*self.events(),{'type':'tool_call','name':'exec'}])
    def test_malformed_answer_rejected(self):
        events=self.events();events[-1]['text']='not JSON'
        with self.assertRaises(n.Error):self.generate(events)
    def test_timeout_and_cancel_kill_child(self):
        for cancel in (False,True):
            script=self.root/'slow.py';script.write_text('import sys,time\nsys.stdin.read()\ntime.sleep(30)\n')
            start=time.monotonic()
            with patch('deepseek_report.command',return_value=[sys.executable,str(script)]),self.assertRaises(n.Error):
                d.generate('材料',self.root/'report',timeout=.3,cancelled=lambda:cancel and time.monotonic()-start>.1)
            self.assertLess(time.monotonic()-start,5)
            self.assertIsNotNone(n.load(self.root/'report/direct-events.json')['exit_code'])
    def test_cached_material_change_rejected(self):
        self.generate(self.events())
        with self.assertRaisesRegex(n.Error,'材料已变化'):d.generate('新材料',self.root/'report')
    def test_npm_windows_launcher_uses_node_argv_with_spaces(self):
        root=self.root/'space in path';root.mkdir();shim=root/'dsh.cmd';shim.write_text('@echo off')
        entry=root/'node_modules/@deepseek-ai/dsh/lib/bin.js';entry.parent.mkdir(parents=True);entry.write_text('// entry')
        with patch('deepseek_report.shutil.which',return_value='node-runtime'):
            self.assertEqual(d.command(str(shim)),['node-runtime',str(entry.resolve())])
    def test_legacy_handoff_is_answered_without_copying(self):
        cfg=self.root/'config.json';n.save(cfg,{'harness':{'provider':'deepseek','mode':'delegated'}})
        choice=harness.selection(cfg);folder=self.root/'legacy'
        with self.assertRaises(host_bridge.Waiting) as caught:harness.reason('原材料',folder,choice,harness.ANSWER_SCHEMA)
        with patch('deepseek_report.generate',return_value={'answer':'已生成'}) as generate:
            value=harness.report_reason('其他新材料',folder,choice,harness.ANSWER_SCHEMA)
            self.assertEqual(generate.call_args.args[0],'原材料')
            self.assertEqual(host_bridge.pending(cfg,caught.exception.request['id'])['answer'],value)

class ReportJobs(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        cfg=self.root/'config.json';n.save(cfg,{'harness':{'provider':'deepseek','mode':'delegated'}})
        self.app=Application(self.root/'home',cfg)
        self.addCleanup(self.app.read_pool.shutdown);self.addCleanup(self.app.write_pool.shutdown)
        self.submitter=patch.object(self.app.write_pool,'submit');self.queue=self.submitter.start();self.addCleanup(self.submitter.stop)
        self.data={'project_id':'p','since':'2026-10-01','until':'2026-10-22','request_id':'request'}
    def job(self):
        jid=self.app.submit('report',self.data)['job_id'];return self.app.jobs[jid]
    def test_duplicate_submit_and_retry_use_same_job(self):
        j=self.job();self.assertEqual(self.app.submit('report',{**self.data,'request_id':'another'})['job_id'],j['id'])
        j.update(status='failed',error='upload failed',progress=[{'message':'上传报告'}])
        self.assertEqual(self.app.submit('resume',{'job_id':j['id']})['job_id'],j['id'])
        self.assertEqual(j['attempt'],2);self.assertEqual(j['progress'],[])
        self.assertEqual(self.app.submit('resume',{'job_id':j['id']})['job_id'],j['id'])
        self.assertEqual(self.queue.call_count,2)
    def test_cancel_queued_and_block_after_publication_starts(self):
        j=self.job();self.app.report_control({'job_id':j['id'],'action':'cancel'})
        self.app.execute(j['id'],'report',self.data);self.assertEqual(j['status'],'cancelled')
        j.update(status='running',report_cancellable=False)
        with self.assertRaises(n.Error):self.app.report_control({'job_id':j['id'],'action':'cancel'})
    def test_bulk_read_survives_restart_and_new_result_is_unread(self):
        j=self.job();rows=self.app.notifications()['jobs'];self.assertFalse(rows[0]['read'])
        self.assertEqual(self.app.notifications_read({'items':[{'id':x['id'],'stamp':x['stamp']} for x in rows]})['marked'],1)
        self.assertTrue(self.app.notifications()['jobs'][0]['read'])
        j.update(status='succeeded',finished_at='later',result={'project_title':'项目','url':'https://example.test/report'})
        self.assertFalse(self.app.notifications()['jobs'][0]['read'])
        self.assertEqual(self.app.notifications_read({'items':rows})['marked'],0)
        self.assertEqual(j['status'],'succeeded')
        rows=self.app.notifications()['jobs'];self.app.notifications_read({'items':rows})
        self.app.persist_job(j)
        other=Application(self.root/'home',self.app.config)
        try:self.assertTrue(other.notifications()['jobs'][0]['read'])
        finally:other.read_pool.shutdown();other.write_pool.shutdown()
    def test_waiting_deepseek_report_can_resume_automatically(self):
        j=self.job();j.update(status='waiting_harness',handoff={'id':'a'*64})
        self.assertTrue(self.app.job_view(j)['automatic_report'])
        self.app.submit('resume',{'job_id':j['id']});self.assertEqual(j['status'],'queued')

class PublishRetry(unittest.TestCase):
    def test_upload_failure_reuses_generated_body_and_frozen_memory(self):
        from test_workbench import WorkbenchTests
        import flow
        case=WorkbenchTests();case.setUp()
        try:
            pid=case.work.mutate(case.create())['record_id']
            case.config['growth'].update(brain_dir='/dummy',report_folder='folder',switches={'reports':True})
            with patch('flow.g.Gateway',side_effect=case.cloud.gateway),patch('flow.memory.retrieve',return_value={'pages':[],'matched':False,'text':''}) as memory,patch('flow.harness.report_reason',return_value={'answer':'# 报告'}) as model,patch('flow.g.publish_report',side_effect=[n.Error('upload failed'),{'url':'https://example.test/report'}]) as publish:
                args=(case.config,[pid],'2026-10-01','2026-10-22',{})
                with self.assertRaises(n.Error):flow.report_projects(*args,request_dir=case.dir/'reports')
                result=flow.report_projects(*args,request_dir=case.dir/'reports')[0]
                self.assertEqual(model.call_count,1);self.assertEqual(memory.call_count,1);self.assertEqual(publish.call_count,2)
                self.assertEqual(result['url'],'https://example.test/report')
        finally:case.doCleanups()

if __name__=='__main__':unittest.main()

class NotificationHTTP(unittest.TestCase):
    def test_read_endpoint_requires_session_and_marks_receipt(self):
        from urllib.request import Request,build_opener,ProxyHandler
        from urllib.error import HTTPError
        from server import HTTPServer,Handler
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);app=Application(root/'home',root/'config.json')
            server=HTTPServer(('127.0.0.1',0),Handler);server.app=app;server.token='local-test'
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                app.jobs['j']={'id':'j','op':'report','status':'succeeded','created_at':'today','finished_at':'now'}
                row=app.notifications()['jobs'][0];url='http://127.0.0.1:'+str(server.server_port)
                body=json.dumps({'items':[row]}).encode();headers={'Content-Type':'application/json','Origin':url}
                opener=build_opener(ProxyHandler({}))
                with self.assertRaises(HTTPError) as exc:opener.open(Request(url+'/api/notifications/read',data=body,headers=headers))
                self.assertEqual(exc.exception.code,401)
                headers['Authorization']='Bearer local-test'
                with opener.open(Request(url+'/api/notifications/read',data=body,headers=headers)) as response:self.assertEqual(json.load(response)['marked'],1)
                self.assertTrue(app.notifications()['jobs'][0]['read'])
            finally:
                server.shutdown();server.server_close();thread.join();app.read_pool.shutdown();app.write_pool.shutdown()
