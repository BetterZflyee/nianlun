import copy
import json
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import patch
import nianlun as n
import planning
import intake
import harness
import flow
import memory
import project_actions
import test_workbench as fixtures


def answer():
    return {'rationale':'由交付日倒排验收与联调','nodes':[
        {'key':'test','title':'联调验收','description':'完成联调记录','days_before_deadline':7,'depends_on':[]},
        {'key':'ship','title':'正式交付','description':'交付验收包','days_before_deadline':0,'depends_on':['test']}]}


class PlanningTests(unittest.TestCase):
    create = fixtures.WorkbenchTests.create
    def setUp(self):
        fixtures.WorkbenchTests.setUp(self)
        self.config['growth']['switches']={'table_writes':True,'reports':True}
        self.config['growth']['report_folder']='test-folder'
        n.save(self.path,self.config)
        req=self.create();req['values'].update(goal='交付试点',deadline='2026-11-30',notes='已确认交付范围：联调验收后正式交付，验收须保留联调记录与验收包')
        self.pid=self.work.mutate(req)['record_id']
        self.patch=patch('planning.g.Gateway',side_effect=self.cloud.gateway);self.patch.start();self.addCleanup(self.patch.stop)

    def test_backward_dates_and_cycle_validation(self):
        nodes=planning.validate(answer(),date(2026,11,30))
        self.assertEqual([x['date'] for x in nodes],['2026-11-23','2026-11-30'])
        bad=answer();bad['nodes'][0]['depends_on']=['ship']
        with self.assertRaises(n.Error):planning.validate(bad,date(2026,11,30))
        bad=answer();bad['nodes'][0]['days_before_deadline']=True
        with self.assertRaises(n.Error):planning.validate(bad,date(2026,11,30))

    def test_planning_idempotent_and_human_completed_nodes_preserved(self):
        folder=self.dir/'plans'
        with patch('planning.harness.reason',return_value=answer()) as reason:
            first=planning.run(self.config,[self.pid],{},folder)
            writes=self.cloud.writes
            second=planning.run(self.config,[self.pid],{},folder)
            self.assertEqual(writes,self.cloud.writes);self.assertEqual(reason.call_count,1)
            self.assertEqual(len(first['projects'][0]['changed']),2);self.assertEqual(second['projects'][0]['changed'],[])
            self.cloud.rows['milestones'][0]['cells']['milestones-status']='已完成'
            self.cloud.rows['milestones'][1]['cells']['milestones-description']='人工修订交付要求'
            self.cloud.rows['projects'][0]['cells']['projects-deadline']='2026-12-31'
            planning.run(self.config,[self.pid],{},folder)
            self.assertEqual(writes,self.cloud.writes)
            self.assertEqual(self.cloud.rows['milestones'][0]['cells']['milestones-date'],'2026-11-23')
            self.assertEqual(self.cloud.rows['milestones'][1]['cells']['milestones-description'],'人工修订交付要求')

    def test_unknown_milestone_create_reconciles_without_duplicate(self):
        self.cloud.lose_reply=True
        with patch('planning.harness.reason',return_value=answer()):
            with self.assertRaises(n.Error):planning.run(self.config,[self.pid],{},self.dir/'plans')
            planning.run(self.config,[self.pid],{},self.dir/'plans')
        self.assertEqual(len(self.cloud.rows['milestones']),2)

    def test_missing_deadline_does_not_invent_one(self):
        self.cloud.rows['projects'][0]['cells'].pop('projects-deadline')
        with patch('planning.harness.reason') as reason:
            result=planning.run(self.config,[self.pid],{},self.dir/'plans')
        reason.assert_not_called();self.assertEqual(len(result['pending']),1)

    def test_reports_reuse_unchanged_facts_but_refresh_new_progress(self):
        calls=[]
        def publish(*args,**kwargs):calls.append(args);return {'url':'https://example.test/report','project_id':self.pid}
        with patch('flow.harness.reason',return_value={'answer':'Lead: 需要推进交付。\n\n## A 本期判断\n按项目目标推进。[P1]'}) as reason,patch('flow.g.publish_report',side_effect=publish):
            flow.report_projects(self.config,[self.pid],'2026-10-01','2026-10-31',{})
            self.cloud.rows['projects'][0]['cells']['projects-report']='https://example.test/report'
            flow.report_projects(self.config,[self.pid],'2026-10-01','2026-10-31',{})
            self.assertEqual(reason.call_count,1)
            self.cloud.rows['projects'][0]['cells']['projects-goal']='更新后的项目目标'
            flow.report_projects(self.config,[self.pid],'2026-10-01','2026-10-31',{})
            self.assertEqual(reason.call_count,2)


class IntakeTests(unittest.TestCase):
    def test_explicit_scope_requires_enabled_sources(self):
        config={'growth':{'sources':{'mail':False}}}
        with self.assertRaises(n.Error):intake.selection(config,{'channels':['mail']})
        scope=intake.selection(config,{'channels':['direct','direct'],'project_ids':['b','a']})
        self.assertEqual(scope,{'channels':['direct'],'project_ids':['a','b']})

    def test_mail_collects_full_body_and_preserves_pagination_gap(self):
        start=datetime(2026,10,1,tzinfo=timezone.utc);end=datetime(2026,10,2,tzinfo=timezone.utc)
        class GW:
            def call(self,args):
                if args[1:]==['mailbox','list']:return {'emailAccounts':[{'email':'me@example.test'}]}
                if args[1]=='+search-mail':return {'messages':[{'messageId':'m'}],'meta':{'pagination':{}}}
                return {'value':{'id':'m','subject':'项目上线','receivedDateTime':'2026-10-01T12:00:00Z','body':{'contentType':'html','content':'<p>真实正文</p><script>ignore</script>'}}}
        rows=[]
        from growth import instant
        with self.assertRaisesRegex(Exception,'分页'):
            intake.mail(GW(),{'mailbox':'me@example.test'},start,end,lambda *a,**k:rows.append(a),instant)
        self.assertEqual(len(rows),1);self.assertIn('真实正文',rows[0][3]);self.assertNotIn('ignore',rows[0][3])

    def test_custom_skill_roots_read_and_dedupe(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp);skill=folder/'sample';skill.mkdir();(skill/'SKILL.md').write_text('---\nname: custom-test\ndescription: 测试目录\n---\n内容')
            roots=harness.skill_roots([tmp,tmp])
            found=[x for x in harness.capabilities({'provider':'generic'},roots) if x['path']==str((skill/'SKILL.md').resolve())]
            self.assertEqual(len(found),1);self.assertEqual(found[0]['name'],'custom-test')
        with self.assertRaises(n.Error):harness.skill_roots(['relative/path'])

    def test_project_memory_refresh_is_verified_and_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            config={'base_id':'b','base_url':'https://example.test/base','growth':{'state_dir':tmp}}
            state={**{r:[] for r in n.ROLES},'complete':True}
            state['projects']=[{'id':'p','title':'项目','goal':'交付'}]
            pages={};captures=[]
            def run(config,args,*rest):
                if args[0]=='get':return type('R',(),{'returncode':0 if args[1] in pages else 1,'stdout':pages.get(args[1],'')})()
                slug=args[args.index('--slug')+1];pages[slug]=Path(args[args.index('--file')+1]).read_text();captures.append(args)
                return type('R',(),{'returncode':0})()
            with patch('memory.run',side_effect=run):
                memory.refresh(config,state,['p']);memory.refresh(config,state,['p'])
                self.assertEqual(len(captures),1)
                state['projects'][0]['goal']='变更目标';memory.refresh(config,state,['p'])
            self.assertEqual(len(captures),2);self.assertEqual(len(pages),1)

    def test_group_send_unknown_delivery_is_not_sent_twice(self):
        with tempfile.TemporaryDirectory() as tmp:
            config={'growth':{'state_dir':tmp}}
            ident={'user_id':'u'};group={'id':'g','name':'项目群'};search='a'*32;report_id='b'*16
            n.save(Path(tmp)/'group-search'/(search+'.json'),{'identity':ident,'groups':[group]})
            n.save(Path(tmp)/'reports'/report_id/'receipt.json',{'status':'verified','project_id':'p','url':'https://example.test/report'})
            import uuid
            request={'request_id':str(uuid.uuid4()),'search_id':search,'group_id':'g','project_id':'p','report_id':report_id,'message':'汇报 https://example.test/report'}
            calls=[]
            class GW:
                def call(self,args):
                    calls.append(args)
                    if args[1]=='+messages-send':return {'sendReceipt':{'openTaskId':'t'}}
                    return {'result':{'sendStatus':'PENDING' if len(calls)==2 else 'SUCCESS'}}
            with patch('project_actions.g.Gateway',return_value=GW()),patch('project_actions.g.self_identity',return_value=ident):
                with self.assertRaisesRegex(n.Error,'尚未确认'):project_actions.send_report(config,request)
                result=project_actions.send_report(config,request)
                self.assertTrue(result['verified'])
            self.assertEqual(sum(c[1]=='+messages-send' for c in calls),1)


if __name__=='__main__':unittest.main()
