import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import deepseek_report
import deepseek_workflow as workflow
import harness
import nianlun as n
from server import Application


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        from test_workbench import WorkbenchTests
        self.case=WorkbenchTests();self.case.setUp();self.addCleanup(self.case.doCleanups)
        self.root=self.case.dir
        self.case.config['harness']={'provider':'deepseek','mode':'delegated'}
        self.case.config['growth']['brain_dir']=str(self.root/'brain')
        n.save(self.case.path,self.case.config)
        self.app=Application(self.root/'home',self.case.path);self.app.work=self.case.work
        self.addCleanup(self.app.read_pool.shutdown);self.addCleanup(self.app.write_pool.shutdown)
        self.pid=self.case.work.mutate(self.case.create('交付项目'))['record_id']
        skill=self.root/'skills/example/SKILL.md';skill.parent.mkdir(parents=True);skill.write_text('# 方法\n先结论，再列下一步。 [说明](guide.md)\n[越界](../../private.md)')
        (skill.parent/'guide.md').write_text('只保留三项重点。')
        self.skill={'id':'skill','name':'复盘方法','path':str(skill)}
        self.app.capabilities=lambda:[self.skill];self.app.settings['enabled_skills']=['skill']
        self.data={'question':'生成项目交接摘要','project_id':self.pid,'skill_ids':['skill'],'request_id':'test-request'}
        self.submitter=patch.object(self.app.write_pool,'submit');self.queue=self.submitter.start();self.addCleanup(self.submitter.stop)
        self.mem=patch('deepseek_workflow.memory.retrieve',return_value={'pages':[{'title':'验收会议','slug':'project/accept','text':'现场核验完成','full_page':True}],'text':'现场核验完成','matched':True}).start()
        self.addCleanup(patch.stopall)
    def job(self):
        jid=self.app.submit('workflow',self.data)['job_id'];return self.app.jobs[jid]
    def test_deepseek_and_codex_routing(self):
        self.assertTrue(harness.describe({'provider':'deepseek','mode':'delegated'})['embedded_workflow'])
        self.assertFalse(harness.describe({'provider':'workbuddy','mode':'delegated'})['embedded_workflow'])
        self.assertFalse(harness.describe({'provider':'codex','mode':'delegated'})['embedded_workflow'])
        self.assertTrue(harness.describe({'provider':'codex','mode':'cli'})['embedded_workflow'])
    def test_selected_methods_memory_and_local_files(self):
        job=self.job()
        with patch('deepseek_workflow.deepseek_report.generate',return_value={'answer':'# 交接结论\n\n现场已核验。\n<script>alert(1)</script>'}) as model,patch('server.codex_session.Session') as codex:
            self.app.execute(job['id'],'workflow',self.data)
        self.assertEqual(job['status'],'succeeded');codex.assert_not_called()
        prompt=model.call_args.args[0]
        self.assertIn('先结论，再列下一步',prompt);self.assertIn('只保留三项重点',prompt);self.assertIn('现场核验完成',prompt)
        self.assertEqual(model.call_args.kwargs['task_kind'],'workflow')
        result=job['result'];self.assertEqual(result['methods'],['复盘方法']);self.assertEqual(len(result['artifacts']),2)
        body=(Path(result['workspace'])/'工作流结果.html').read_text()
        self.assertIn('&lt;script&gt;',body);self.assertNotIn('<script>',body)
        self.assertEqual(self.app.notifications()['jobs'][0]['phase'],'DeepSeek 工作流已完成，点击查看正文和结果文件')
    def test_failure_retry_freezes_context_and_restart_retains_same_job(self):
        job=self.job()
        with patch('deepseek_workflow.deepseek_report.generate',side_effect=n.Error('网络失败')):
            self.app.execute(job['id'],'workflow',self.data)
        self.assertEqual(job['status'],'failed');self.assertTrue(self.app.job_view(job)['can_resume'])
        old_prompt=n.load(self.app.runtime/'workflows'/job['id']/'input.json')['prompt']
        Path(self.skill['path']).write_text('后来变化的方法')
        other=Application(self.root/'home',self.case.path)
        try:
            with patch.object(other.write_pool,'submit'):
                response=other.submit('resume',{'job_id':job['id']})
                self.assertEqual(response['job_id'],job['id']);self.assertEqual(other.jobs[job['id']]['attempt'],2)
                self.assertEqual(other.submit('resume',{'job_id':job['id']})['job_id'],job['id'])
            with patch('deepseek_workflow.deepseek_report.generate',return_value={'answer':'恢复结果'}) as model,patch.object(other.work,'snapshot',side_effect=AssertionError('must not reread')):
                other.execute(job['id'],'workflow',self.data)
            self.assertEqual(other.jobs[job['id']]['status'],'succeeded')
            self.assertEqual(model.call_args.args[0],old_prompt);self.assertEqual(self.mem.call_count,1)
        finally:other.read_pool.shutdown();other.write_pool.shutdown()
    def test_duplicate_request_reuses_job_and_conflict_rejected(self):
        j=self.job();self.assertEqual(self.app.submit('workflow',dict(self.data))['job_id'],j['id'])
        with self.assertRaises(n.Error):self.app.submit('workflow',{**self.data,'question':'其他要求'})
        self.assertEqual(self.queue.call_count,1)
        self.assertEqual(self.app.submit('workflow',{**self.data,'request_id':'double-click'})['job_id'],j['id'])
        self.assertEqual(self.queue.call_count,1)
    def test_cancel_queued_can_retry_but_completed_cannot(self):
        j=self.job();self.app.control({'action':'cancel','job_id':j['id']})
        with patch('deepseek_workflow.deepseek_report.generate') as model:self.app.execute(j['id'],'workflow',self.data)
        model.assert_not_called();self.assertEqual(j['status'],'cancelled');self.assertTrue(self.app.job_view(j)['can_resume'])
        self.app.submit('resume',{'job_id':j['id']});self.assertFalse(j['cancel_requested'])
        j.update(status='succeeded');self.assertFalse(self.app.job_view(j)['can_resume'])
    def test_cancel_during_model_keeps_frozen_material_no_artifact(self):
        j=self.job()
        def generate(*args,**kwargs):
            self.app.control({'action':'cancel','job_id':j['id']})
            self.assertTrue(kwargs['cancelled']())
            raise deepseek_report.Cancelled('stop')
        with patch('deepseek_workflow.deepseek_report.generate',side_effect=generate):self.app.execute(j['id'],'workflow',self.data)
        self.assertEqual(j['status'],'cancelled');self.assertNotIn('result',j)
        self.assertTrue((self.app.runtime/'workflows'/j['id']/'input.json').exists())
    def test_incomplete_table_and_memory_failure_do_not_call_model(self):
        j=self.job()
        with patch.object(self.app.work,'snapshot',return_value={'complete':False}),patch('deepseek_workflow.deepseek_report.generate') as model:
            self.app.execute(j['id'],'workflow',self.data)
        self.assertEqual(j['status'],'failed');model.assert_not_called()
        self.mem.side_effect=n.Error('记忆读取失败')
        with patch('deepseek_workflow.deepseek_report.generate') as model:self.app.execute(j['id'],'workflow',self.data)
        self.assertEqual(j['status'],'failed');model.assert_not_called()
    def test_binding_change_rejects_retry(self):
        j=self.job()
        with patch('deepseek_workflow.deepseek_report.generate',side_effect=n.Error('网络失败')):self.app.execute(j['id'],'workflow',self.data)
        cfg=n.load(self.case.path);cfg['profile']='changed';n.save(self.case.path,cfg)
        with patch('deepseek_workflow.deepseek_report.generate') as model:self.app.execute(j['id'],'workflow',self.data)
        model.assert_not_called();self.assertIn('配置或请求已变化',j['error'])
    def test_disabled_method_rejected(self):
        self.app.settings['enabled_skills']=[];j=self.job()
        with patch('deepseek_workflow.deepseek_report.generate') as model:self.app.execute(j['id'],'workflow',self.data)
        model.assert_not_called();self.assertIn('启用',j['error'])
    def test_host_cannot_silently_switch_on_retry(self):
        j=self.job();cfg=n.load(self.case.path);cfg['harness']={'provider':'codex','mode':'cli'};n.save(self.case.path,cfg)
        with patch('server.codex_session.Session') as codex:self.app.execute(j['id'],'workflow',self.data)
        codex.assert_not_called();self.assertEqual(j['status'],'failed');self.assertIn('原宿主',j['error'])

    def test_render_failure_reuses_real_adapter_cache(self):
        import sys
        script=self.root/'model.py'
        events=[{'type':'nianlun_policy','tools':0},{'type':'status','reason':{'kind':'completed'}},
                {'type':'final','text':json.dumps({'answer':'# 已生成的正文'})}]
        script.write_text('import sys,json\nsys.stdin.read()\n'+'\n'.join('print('+repr(json.dumps(e))+',flush=True)' for e in events))
        j=self.job()
        with patch('deepseek_report.command',return_value=[sys.executable,str(script)]) as command:
            with patch('deepseek_workflow.document',side_effect=OSError('disk unavailable')):self.app.execute(j['id'],'workflow',self.data)
            self.assertEqual(j['status'],'failed')
            self.app.submit('resume',{'job_id':j['id']})
            self.app.execute(j['id'],'workflow',self.data)
            self.assertEqual(j['status'],'succeeded');self.assertEqual(command.call_count,1)
            self.assertEqual(self.mem.call_count,1)

    def test_restart_interrupted_job_keeps_retry_and_unread_notification(self):
        j=self.job();j['status']='running';self.app.persist_job(j)
        other=Application(self.root/'home',self.case.path)
        try:
            restored=other.jobs[j['id']]
            self.assertEqual(restored['status'],'interrupted');self.assertTrue(other.job_view(restored)['can_resume'])
            row=other.notifications()['jobs'][0];other.notifications_read({'items':[row]})
            restored.update(status='succeeded',finished_at='new-result')
            self.assertFalse(other.notifications()['jobs'][0]['read'])
        finally:other.read_pool.shutdown();other.write_pool.shutdown()

if __name__=='__main__':unittest.main()
