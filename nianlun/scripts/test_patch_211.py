"""2.1.1 regressions. All provider operations are synthetic."""
import copy
import json
import os
from pathlib import Path
from datetime import datetime
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch
import nianlun as n
import growth as g
import recovery
import run_control
import scheduler
import flow
import planning
from server import Application
from workbench import Workbench
from setup import Setup
from test_nianlun import fixture, Fake
from test_growth import Gateway


class Controls(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);self.root=Path(t.name)
        self.path=self.root/'config.json';self.state=self.root/'state'
        self.config={'growth':{'state_dir':str(self.state),'schedule':{'enabled':True,'timezone':'Asia/Singapore',
            'growth_hours':[10,12,14],'report_weekday':'TH','report_hour':9},'switches':{'reports':False}}}
        n.save(self.path,self.config);self.setup=Setup(self.root/'home',self.path)
        self.env=patch.dict(os.environ,{'CODEX_HOME':str(self.root/'codex')});self.env.start();self.addCleanup(self.env.stop)
        request=self.setup.schedule_request(self.config)
        self.native=self.root/'codex/automations/test/automation.toml';self.native.parent.mkdir(parents=True)
        self.native.write_text('id="test"\nkind="heartbeat"\nstatus="ACTIVE"\ntarget_thread_id="fixture"\nrrule='+
            json.dumps(request['controller']['rrule'])+'\nprompt='+json.dumps(request['controller']['prompt']))
        self.setup.verify_schedules([self.native])
        saved=n.load(self.state/'scheduler.json');saved['activated_at']='2026-10-21T09:00:00+08:00';n.save(self.state/'scheduler.json',saved)

    def test_native_pause_is_visible_without_overwriting_receipt(self):
        before=(self.state/'scheduler.json').read_bytes()
        self.native.write_text(self.native.read_text().replace('status="ACTIVE"','status="PAUSED"'))
        value=run_control.status(self.config,self.root/'home',self.path)
        self.assertFalse(value['active']);self.assertTrue(value['registered']);self.assertEqual(value['status'],'paused')
        self.assertEqual(before,(self.state/'scheduler.json').read_bytes())
        with patch('scheduler.flow.grow') as grow:
            result=scheduler.tick(self.path,now=datetime.fromisoformat('2026-10-21T10:00:00+08:00'))
        self.assertEqual(result['status'],'paused');grow.assert_not_called()

    def test_invalid_native_task_is_not_treated_as_connected(self):
        self.native.write_text(self.native.read_text().replace('FREQ=HOURLY','FREQ=DAILY'))
        value=run_control.status(self.config,self.root/'home',self.path)
        self.assertFalse(value['active']);self.assertFalse(value['registered'])

    def test_pause_works_with_pending_run_without_changing_binding(self):
        n.save(self.state/'active.json',{'run_id':'old','run_dir':str(self.state/'runs/old')})
        before=self.path.read_bytes();run_control.set_paused(self.config,True)
        self.assertEqual(self.path.read_bytes(),before)
        with patch('scheduler.flow.grow') as grow:
            self.assertEqual(scheduler.tick(self.path)['status'],'paused')
        grow.assert_not_called();run_control.set_paused(self.config,False)
        self.assertEqual(self.path.read_bytes(),before)

    def test_pause_does_not_wait_for_write_queue(self):
        app=Application(self.root/'home',self.path)
        self.addCleanup(app.read_pool.shutdown);self.addCleanup(app.write_pool.shutdown)
        with patch.object(app.write_pool,'submit',side_effect=AssertionError('must bypass queue')):
            result=app.submit('schedule_pause',{'paused':True})
        self.assertEqual(app.jobs[result['job_id']]['status'],'succeeded')
        self.assertTrue(run_control.paused(self.config))

    def test_invalid_pause_value_rejected(self):
        with self.assertRaises(n.Error):run_control.set_paused(self.config,'false')

    def test_repeated_error_is_quiet_change_and_recovery_notify(self):
        times=[10,12,14,14]
        with patch('scheduler.flow.grow',side_effect=[n.Error('same'),n.Error('same'),n.Error('changed'),{'verified':True,'notify':False}]):
            values=[scheduler.tick(self.path,now=datetime.fromisoformat(f'2026-10-21T{h}:00:00+08:00')) for h in times]
        self.assertEqual([v['notify'] for v in values],[True,False,True,True])
        self.assertEqual(len({v['runs'][0]['key'] for v in values}),1)
        self.assertEqual(values[-1]['runs'][0]['attempts'],4)

    def test_stale_manual_resume_cannot_create_new_run(self):
        with patch('flow.g.collect') as collect:
            with self.assertRaisesRegex(n.Error,'已.*变化'):flow.grow(self.path,expected_run_id='stale')
        collect.assert_not_called()

    def test_manual_recovery_closes_original_slot_and_preserves_pause(self):
        run_control.set_paused(self.config,True)
        original={'key':'growth:original','role':'growth','at':'2026-10-21T10:00:00+08:00','status':'failed','error':'old'}
        n.save(self.state/'controller.json',{'slots':{original['key']:original}})
        with patch('scheduler.flow.grow',return_value={'verified':True}) as grow:
            scheduler.resume_growth(self.path,'original-run')
        self.assertEqual(grow.call_args.kwargs['expected_run_id'],'original-run')
        saved=n.load(self.state/'controller.json')['slots'][original['key']]
        self.assertEqual(saved['status'],'complete');self.assertNotIn('error',saved)
        self.assertTrue(run_control.paused(self.config))


class Recovery(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);self.root=Path(t.name)
        self.folder=self.root/'runs/one';self.config,raw=fixture()
        self.config['growth']={'state_dir':str(self.root),'switches':{'table_writes':True,'todos':True,'completion':True}}
        raw['records']=[{'recordId':'R1','cells':{'records-title':'联调','records-status':'处理中','records-project_ids':{'linkedRecordIds':['P1']}}}]
        self.gw=Gateway(self.config,raw)
        self.bundle={'run_id':'one','binding':n.digest(self.config),'identity':{'user_id':'U1','name':'本人','corp_id':'C1'},
            'until':'2026-10-21T10:00:00+08:00','tables':n.fetch(self.config,self.gw.table()),'todos':[self.gw.todo.copy()],
            'sources':[{'id':'source','name':'test','text':'已完成；编写说明','time':'2026-10-21T09:00:00+08:00'}]}
        n.save(self.folder/'evidence.json',self.bundle);n.save(self.root/'active.json',{'run_id':'one','run_dir':str(self.folder)})
        self.base={'project':'测试项目','source_id':'source','quote':'编写说明'}
        self.patcher=patch('growth.Gateway',return_value=self.gw);self.patcher.start();self.addCleanup(self.patcher.stop)

    def plan(self, actions):
        decision={'run_id':'one','summary':'说明待编写','actions':actions}
        plan=g.validate(self.config,self.bundle,decision)
        n.save(self.folder/'plan.json',plan);n.save(self.folder/'decision.json',decision);return plan

    def record(self):
        return {**self.base,'op':'create_record','title':'说明','description':'编写说明','date':'2026-10-21','kind':'沟通要点'}

    def apply(self):return g.apply(self.config,self.folder,self.folder/'plan.json')

    def lost_record(self, second=False):
        actions=[self.record()]
        if second:actions.append({**self.record(),'title':'后续说明','description':'另一步'})
        plan=self.plan(actions);real=self.gw.t.call
        def lost(args):
            result=real(args)
            if args[:2]==['record','create']:raise n.Error('response lost')
            return result
        with patch.object(self.gw.t,'call',side_effect=lost),self.assertRaises(n.Error):self.apply()
        return plan

    def test_lost_record_reply_reconciles_without_write_then_continues(self):
        self.lost_record(second=True);writes=self.gw.t.writes
        result=recovery.reconcile(self.config,'one')
        self.assertEqual(self.gw.t.writes,writes);self.assertEqual(result['verified_count'],1)
        self.assertFalse(result['needs_reconciliation'])
        self.assertEqual(self.apply()['status'],'verified');self.assertEqual(self.gw.t.writes,2)
        self.apply();self.assertEqual(self.gw.t.writes,2)

    def test_whole_flow_recovery_finishes_original_run_while_paused(self):
        self.config['growth']['home_output']=str(self.root/'home.html')
        self.bundle.update(binding=n.digest(self.config),since='2026-10-21T09:00:00+08:00',coverage=[])
        self.bundle['sources'][0]['version']='fixture-version'
        n.save(self.folder/'evidence.json',self.bundle)
        path=self.root/'config.json';n.save(path,self.config)
        self.lost_record(second=True);run_control.set_paused(self.config,True)
        recovery.reconcile(self.config,'one')
        result=scheduler.resume_growth(path,'one')
        self.assertTrue(result['verified']);self.assertEqual(result['actions'],2)
        self.assertEqual(self.gw.t.writes,2);self.assertFalse((self.root/'active.json').exists())
        self.assertTrue(run_control.paused(self.config));self.assertTrue((self.root/'home.html').exists())

    def test_conflicting_or_duplicate_marker_remains_unknown(self):
        self.lost_record();self.gw.t.raw['records'][-1]['cells']['records-title']='人工修改'
        before=(self.folder/'receipt.json').read_bytes()
        with self.assertRaises(n.Error):recovery.reconcile(self.config,'one')
        self.assertEqual((self.folder/'receipt.json').read_bytes(),before);self.assertEqual(self.gw.t.writes,1)
        self.gw.t.raw['records'][-1]['cells']['records-title']='说明'
        self.gw.t.raw['records'].append(copy.deepcopy(self.gw.t.raw['records'][-1]))
        with self.assertRaises(n.Error):recovery.reconcile(self.config,'one')
        self.assertEqual(self.gw.t.writes,1)

    def test_missing_record_is_not_resent(self):
        self.lost_record();self.gw.t.raw['records'].pop()
        with self.assertRaises(n.Error):recovery.reconcile(self.config,'one')
        with self.assertRaises(n.Error):self.apply()
        self.assertEqual(self.gw.t.writes,1)

    def test_binding_and_stale_run_are_rejected(self):
        self.lost_record()
        with self.assertRaises(n.Error):recovery.reconcile(self.config,'another')
        bad=copy.deepcopy(self.config);bad['profile']='different'
        with self.assertRaises(n.Error):recovery.reconcile(bad,'one')
        self.assertEqual(self.gw.t.writes,1)

    def test_unknown_todo_without_original_id_is_not_guessed(self):
        self.plan([{**self.base,'op':'create_todo','executor':'self','title':'说明','record_ids':['R1']}]);self.gw.fail=True
        with self.assertRaises(n.Error):self.apply()
        with self.assertRaisesRegex(n.Error,'未返回编号'):recovery.reconcile(self.config,'one')
        self.assertEqual(self.gw.creates,1)

    def test_known_todo_readback_failure_recovers_original_id(self):
        self.plan([{**self.base,'op':'create_todo','executor':'self','title':'说明','record_ids':['R1']}]);real=self.gw.call
        def fail(args,**kwargs):
            if args[:2]==['todo','+get']:raise n.Error('read failed')
            return real(args,**kwargs)
        with patch.object(self.gw,'call',side_effect=fail),self.assertRaises(n.Error):self.apply()
        recovery.reconcile(self.config,'one');self.apply()
        self.assertEqual(self.gw.creates,1);self.assertEqual(n.load(self.root/'links.json')['T2']['record_ids'],['R1'])

    def test_completed_todo_recovers_record_without_completing_again(self):
        self.plan([{**self.base,'op':'complete_todo','task_id':'T1','expected_title':'[测试项目] 联调','record_ids':['R1'],
                    'match':'unique','completion':'explicit'}])
        real=self.gw.t.call
        def fail(args):
            result=real(args)
            if args[0]=='+record-update':raise n.Error('update reply lost')
            return result
        with patch.object(self.gw.t,'call',side_effect=fail),self.assertRaises(n.Error):self.apply()
        recovery.reconcile(self.config,'one')
        self.assertEqual(self.apply()['status'],'verified')
        self.assertEqual(self.gw.completes,1);self.assertEqual(self.gw.t.writes,1)

    def test_reopened_todo_is_not_closed_again_during_recovery(self):
        self.plan([{**self.base,'op':'complete_todo','task_id':'T1','expected_title':'[测试项目] 联调','record_ids':['R1'],
                    'match':'unique','completion':'explicit'}])
        with patch.object(n,'apply_plan',side_effect=n.Error('read failed')),self.assertRaises(n.Error):self.apply()
        recovery.reconcile(self.config,'one');self.gw.todo['isDone']=False
        with self.assertRaisesRegex(n.Error,'再次关闭'):self.apply()
        self.assertEqual(self.gw.completes,1)

    def test_unknown_memory_verifies_exact_original_body(self):
        self.plan([]);n.save(self.folder/'brain-page.md','---\ntitle: test\n---\noriginal full body')
        n.save(self.folder/'finish.json',{'in_flight':{'step':'brain','slug':'original','source_file':str(self.folder/'brain-page.md')}})
        with patch('memory.run',return_value=SimpleNamespace(returncode=0,stdout='different body')):
            with self.assertRaises(n.Error):recovery.reconcile(self.config,'one')
        with patch('memory.run',return_value=SimpleNamespace(returncode=0,stdout='original full body')):
            self.assertFalse(recovery.reconcile(self.config,'one')['needs_reconciliation'])

    def test_unknown_digest_without_handle_is_never_resent(self):
        self.plan([]);n.save(self.folder/'finish.json',{'in_flight':{'step':'digest','idempotency_key':'fixture'}})
        with self.assertRaisesRegex(n.Error,'投递句柄'):recovery.reconcile(self.config,'one')
        self.assertTrue(recovery.overview(self.config)['needs_reconciliation'])


class Semantics(unittest.TestCase):
    def test_added_status_option_is_readable_without_rebinding(self):
        config,raw=fixture();client=Fake(config,raw);original=n.digest(config)
        actual=copy.deepcopy(config);actual['tables']['records']['fields']['status']['config']['options'].append({'id':'opt-new','name':'待处理'})
        with patch.object(client,'fields',side_effect=lambda base,table:list(actual['tables'][table[2:]]['fields'].values())):
            state=n.fetch(config,client)
        self.assertEqual(n.digest(config),original)
        self.assertEqual(Workbench('unused').cells(config,state,'records',{'status':'待处理'},False),{'records-status':'待处理'})

    def test_removed_renamed_or_retyped_field_remains_blocked(self):
        config,raw=fixture();bound=config['tables']['records']['fields']['status']
        for change in ('remove','rename','type'):
            actual=copy.deepcopy(bound)
            if change=='remove':actual['config']['options'].pop()
            elif change=='rename':actual['config']['options'][0]['name']='另一个状态'
            else:actual['type']='text'
            self.assertFalse(n.compatible_field(bound,actual))

    def test_multi_record_plan_recovery_keeps_unstarted_steps(self):
        config,raw=fixture();client=Fake(config,raw)
        candidates=[{'op':'create_record','project':'测试项目','title':title,'description':'内容',
                     'source':{'id':title,'name':'来源','quote':'内容'},'date':'2026-10-21','kind':'沟通要点'} for title in ('第一条','第二条')]
        plan=n.plan(config,n.fetch(config,client),candidates);real=client.call
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'receipt.json'
            def lost(args):
                result=real(args)
                if args[:2]==['record','create']:raise n.Error('response lost')
                return result
            with patch.object(client,'call',side_effect=lost),self.assertRaises(n.Error):n.apply_plan(config,client,plan,path)
            self.assertEqual(client.writes,1)
            self.assertEqual(n.apply_plan(config,client,plan,path)['status'],'verified')
            self.assertEqual(client.writes,2)

    def test_project_status_is_shared_by_snapshot_selection_and_planning_evidence(self):
        config,raw=fixture()
        for status,expected in [('进行中',True),('待核',True),('已完成',False),('暂停',False),('已暂停',False),('已取消',False),('概念',False)]:
            raw['projects'][0]['cells']['projects-status']=status
            state=n.fetch(config,Fake(config,raw))
            self.assertEqual(state['projects'][0]['active'],expected)
            self.assertEqual(bool(n.select_projects(state,None,all_active=True)),expected)
            facts=planning.evidence(state,'P1');self.assertNotIn('active',facts['projects'][0])

    def test_read_failure_does_not_claim_unknown_write(self):
        with patch('growth.subprocess.run',return_value=SimpleNamespace(returncode=1,stdout='offline')):
            with self.assertRaisesRegex(n.Error,'读取未确认'):g.Gateway({}).call(['contact','user','get-self'])
            with self.assertRaisesRegex(n.Error,'写入结果未知'):g.Gateway({}).call(['aitable','record','create'])

    def test_missing_executable_is_explicitly_not_submitted(self):
        with patch('growth.subprocess.run',side_effect=FileNotFoundError()):
            with self.assertRaisesRegex(n.Error,'本次未提交'):g.Gateway({}).call(['todo','task','create'])


if __name__=='__main__':unittest.main()
