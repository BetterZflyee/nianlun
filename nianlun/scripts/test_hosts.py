import copy
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch
import harness
import host
import host_bridge as b
import flow
import scheduler
import nianlun as n
from setup import Setup


class HostTests(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);self.root=Path(tmp.name).resolve()
        self.path=self.root/'config.json'
        self.config={'tables':{'projects':{'id':'table'}},'profile':'fixture','growth':{'state_dir':str(self.root/'state'),
                     'sources':{'minutes':False},'switches':{},'brain_dir':'unchanged'}}
        n.save(self.path,self.config)
    def delegated(self):
        config=copy.deepcopy(self.config);config['harness']={'provider':'workbuddy','mode':'delegated'};n.save(self.path,config)
        return harness.selection(self.path)
    def test_existing_config_keeps_codex_fresh_install_is_neutral(self):
        self.assertEqual(harness.selection(self.path)['provider'],'codex')
        self.assertEqual(harness.selection(self.root/'fresh.json')['provider'],'generic')
    def test_switch_host_preserves_bindings_sources_memory(self):
        result=host.connect(self.path,'workbuddy')
        updated=n.load(self.path);updated.pop('harness')
        self.assertEqual(updated,self.config);self.assertIsNone(result['logged_in'])
    def test_no_silent_codex_fallback(self):
        choice=self.delegated()
        with patch('harness.codex_reason') as codex,patch('harness.claude_reason') as claude:
            with self.assertRaises(b.Waiting):harness.reason('evidence',self.root/'reason',choice,harness.ANSWER_SCHEMA)
        codex.assert_not_called();claude.assert_not_called()
    def test_roundtrip_schema_idempotency_and_original_evidence(self):
        choice=self.delegated();folder=self.root/'reason'
        with self.assertRaises(b.Waiting) as waiting:harness.reason('original evidence',folder,choice,harness.ANSWER_SCHEMA)
        identifier=waiting.exception.request['id']
        with self.assertRaises(n.Error):b.answer(self.path,identifier,{'invented':'answer'})
        self.assertEqual(b.pending(self.path,identifier)['status'],'waiting_harness')
        answer={'answer':'original conclusion'};b.answer(self.path,identifier,answer)
        self.assertEqual(harness.reason('later changed context',folder,choice,harness.ANSWER_SCHEMA),answer)
        self.assertTrue(b.answer(self.path,identifier,answer)['reused'])
        with self.assertRaises(n.Error):b.answer(self.path,identifier,{'answer':'overwrite'})
    def test_stale_answer_cannot_change_business_state(self):
        choice=self.delegated()
        with self.assertRaises(b.Waiting) as waiting:harness.reason('evidence',self.root/'reason',choice,harness.ANSWER_SCHEMA)
        config=n.load(self.path);config['profile']='other';n.save(self.path,config)
        with self.assertRaisesRegex(n.Error,'配置已变化'):b.answer(self.path,waiting.exception.request['id'],{'answer':'x'})
    def test_pending_ids_cannot_traverse_directories(self):
        with self.assertRaises(n.Error):b.pending(self.path,'../config')
    def test_host_change_blocked_while_waiting(self):
        choice=self.delegated()
        with self.assertRaises(b.Waiting):harness.reason('evidence',self.root/'reason',choice,harness.ANSWER_SCHEMA)
        with self.assertRaisesRegex(n.Error,'交接'):host.connect(self.path,'deepseek')
    def test_exports_are_not_registration_receipts(self):
        info=host.export(self.path,'deepseek',self.root/'install')
        self.assertFalse(info['verified'])
        spec=n.load(Path(info['directory'])/'connection.json')
        self.assertEqual(spec['schedule_status'],'requires_native_registration')
        self.assertEqual(spec['config'],str(self.path))
    def test_claude_uses_native_auth_and_no_business_tools(self):
        def run(command,**kwargs):
            self.assertNotIn('private facts',command);self.assertEqual(kwargs['input'],'private facts')
            self.assertEqual(command[command.index('--tools')+1],'')
            self.assertIn('--strict-mcp-config',command);self.assertIn('mcp__*',command)
            self.assertNotIn('--dangerously-skip-permissions',command)
            kwargs['stdout'].write(json.dumps({'structured_output':{'answer':'ok'}}))
            return type('Result',(),{'returncode':0})()
        with patch('harness.find_claude',return_value='claude'),patch('harness.subprocess.run',side_effect=run):
            value=harness.reason('private facts',self.root/'claude',{'provider':'claude','mode':'cli'},harness.ANSWER_SCHEMA)
        self.assertEqual(value,{'answer':'ok'})
    def test_unknown_provider_and_mode_rejected(self):
        for value in ({'provider':'invented'},{'provider':'workbuddy','mode':'cli'}):
            with self.assertRaises(n.Error):harness.normalize(value)
    def test_growth_handoff_returns_before_apply_then_resumes(self):
        self.delegated();folder=self.root/'run'
        bundle={'run_id':'fixture','binding':n.digest(n.load(self.path)),'sources':[{'id':'source','text':'已阅读','name':'原文'}],
                'coverage':[],'tables':{role:[] for role in n.ROLES},'todos':[]}
        n.save(folder/'evidence.json',bundle)
        with patch('flow.g.collect',return_value={'run_dir':str(folder)}),patch('flow.g.brain_context',side_effect=n.Error('fixture unavailable')),patch('flow.g.apply',return_value={'results':{}}) as apply,patch('flow.g.finish',return_value={'status':'complete'}) as finish:
            with self.assertRaises(b.Waiting) as first:flow.grow(self.path)
            apply.assert_not_called();finish.assert_not_called()
            b.answer(self.path,first.exception.request['id'],{'queries':[]})
            with self.assertRaises(b.Waiting) as second:flow.grow(self.path)
            apply.assert_not_called()
            b.answer(self.path,second.exception.request['id'],{'run_id':'fixture','summary':'无业务变化','pending':[],'deferred_source_ids':[],'actions_json':'[]'})
            result=flow.grow(self.path)
            self.assertEqual(result['status'],'complete');self.assertEqual(apply.call_count,1)
    def test_timer_owner_is_independent_and_wrong_owner_rejected(self):
        config=copy.deepcopy(self.config);config['growth']['schedule']={'enabled':True,'timezone':'Asia/Singapore','growth_hours':[10], 'report_weekday':'TH','report_hour':9}
        n.save(self.path,config)
        n.save(self.root/'state/scheduler.json',{'owner':'workbuddy','mode':'host_managed','activated_at':'2026-10-20T09:55:00+08:00'})
        with self.assertRaisesRegex(n.Error,'不能同时'):scheduler.tick(self.path,owner='codex')
        now=datetime.fromisoformat('2026-10-20T10:00:00+08:00')
        with patch('scheduler.flow.grow',return_value={'verified':True}) as grow:
            self.assertEqual(scheduler.tick(self.path,now=now,owner='workbuddy')['status'],'processed')
            self.assertEqual(scheduler.tick(self.path,now=now,owner='workbuddy')['status'],'idle')
        self.assertEqual(grow.call_count,1)
        self.assertFalse(n.load(self.root/'state/scheduler.json').get('registered',False))
    def test_waiting_old_slot_resumes_before_new_slot(self):
        config=copy.deepcopy(self.config);config['growth']['schedule']={'enabled':True,'timezone':'Asia/Singapore','growth_hours':[10,12], 'report_weekday':'TH','report_hour':9};n.save(self.path,config)
        n.save(self.root/'state/scheduler.json',{'owner':'deepseek','mode':'host_managed','activated_at':'2026-10-20T09:55:00+08:00'})
        waiting=b.Waiting({'id':'0'*64,'provider':'deepseek','path':'fixture'})
        with patch('scheduler.flow.grow',side_effect=[waiting,{'verified':True}]):
            first=scheduler.tick(self.path,now=datetime.fromisoformat('2026-10-20T10:00:00+08:00'),owner='deepseek')
            last=scheduler.tick(self.path,now=datetime.fromisoformat('2026-10-20T12:00:00+08:00'),owner='deepseek')
        self.assertEqual(first['status'],'waiting_harness');self.assertEqual(last['runs'][0]['at'],'2026-10-20T10:00:00+08:00')
    def test_active_codex_timer_blocks_other_owner(self):
        marker='nianlun:'+n.digest(str(self.path))[:16]
        task=self.root/'codex/automations/existing/automation.toml';task.parent.mkdir(parents=True)
        task.write_text('status="ACTIVE"\nprompt="'+marker+'"')
        with patch.dict('os.environ',{'CODEX_HOME':str(self.root/'codex')}):
            with self.assertRaisesRegex(n.Error,'仍有'):host.schedule_owner(self.path,'deepseek')
    def test_native_prompt_survives_core_relocation(self):
        home=self.root/'install';s=Setup(home,self.path)
        config=n.load(self.path);config['growth']['schedule']={'timezone':'Asia/Singapore'}
        legacy=str(self.root/'old skills/nianlun/scripts/scheduler.py')
        n.save(home/'install.json',{'config':str(self.path),'scheduler_entry':legacy})
        self.assertIn(legacy,s.schedule_request(config)['controller']['prompt'])

    def test_page_waiting_job_resumes_with_same_id(self):
        from server import Application
        self.delegated();app=Application(self.root/'install',self.path)
        self.addCleanup(app.read_pool.shutdown);self.addCleanup(app.write_pool.shutdown)
        job={'id':'page-job','op':'ask','status':'queued','created_at':'fixture'};app.jobs[job['id']]=job
        snapshot={role:[] for role in n.ROLES}
        with patch.object(app.work,'snapshot',return_value=snapshot):
            app.execute(job['id'],'ask',{'question':'检查已有事实'})
            self.assertEqual(job['status'],'waiting_harness')
            b.answer(self.path,job['handoff']['id'],{'answer':'没有可核验的新变化'})
            resumed=app.action('resume-job','resume',{'job_id':job['id']})
        self.assertEqual(resumed['id'],'page-job');self.assertEqual(resumed['status'],'succeeded')
        self.assertEqual(resumed['result']['answer'],'没有可核验的新变化')
    def test_external_workflow_prepares_material_without_claiming_execution(self):
        from server import Application
        self.delegated();app=Application(self.root/'install',self.path)
        self.addCleanup(app.read_pool.shutdown);self.addCleanup(app.write_pool.shutdown)
        app.jobs['workflow']={'id':'workflow','op':'workflow_request','status':'queued','created_at':'fixture'}
        with patch.object(app.work,'connection',return_value=(n.load(self.path),None,{'name':'测试本人'})),patch.object(app.work,'snapshot',return_value={role:[] for role in n.ROLES}),patch('server.codex_session.Session') as native:
            result=app.workflow('workflow',{'question':'整理一份本地总结'},export_only=True)
        native.assert_not_called();self.assertEqual(result['status'],'continue_in_host')
        self.assertTrue(Path(result['request_file']).is_file())


if __name__=='__main__':unittest.main()
