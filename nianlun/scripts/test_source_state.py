import json
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch, Mock
import nianlun as n
import growth as g
import source_state as s


class SourceTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);self.p=Path(temp.name)
        self.end=datetime.fromisoformat('2026-10-20T12:00:00+08:00')
    def bundle(self):
        return {'run_id':'one','since':'2026-10-19T10:00:00+08:00','until':self.end.isoformat(),
          'sources':[{'id':'message:one','channels':['direct']},{'id':'minutes:one','channels':['minutes']}],
          'coverage':[{'channel':'direct','status':'partial','error':'missing cursor','since':'2026-10-19T10:00:00+08:00'},
                      {'channel':'minutes','status':'complete','count':0,'since':'2026-10-18T12:00:00+08:00'}]}
    def test_independent_watermarks_do_not_rewind_healthy_channels(self):
        checkpoint=s.advance(self.bundle(),{},{});
        self.assertEqual(checkpoint['channels']['minutes'],{'until':self.end.isoformat()})
        self.assertIn('retry_since',checkpoint['channels']['direct'])
        self.assertEqual(s.window({},checkpoint,'direct',self.end),datetime.fromisoformat('2026-10-19T10:00:00+08:00'))
    def test_delayed_minutes_are_revisited_after_successful_recent_run(self):
        checkpoint={'channels':{'minutes':{'until':(self.end-timedelta(hours=2)).isoformat()}}}
        self.assertEqual(s.window({},checkpoint,'minutes',self.end),self.end-timedelta(hours=48))
    def test_legacy_backlog_is_preserved_during_upgrade(self):
        earlier=self.end-timedelta(days=12)
        self.assertEqual(s.window({}, {'retry_since':earlier.isoformat()},'minutes',self.end),earlier)
    def test_deferred_item_rewinds_only_its_origin_channel(self):
        bundle=self.bundle();bundle['coverage'][0]['status']='complete'
        result=s.advance(bundle,{'deferred_source_ids':['minutes:one']},{})
        self.assertIn('retry_since',result['channels']['minutes']);self.assertIn('until',result['channels']['direct'])
    def test_no_new_source_is_enabled_by_checkpoint_migration(self):
        result=s.advance(self.bundle(),{},{});self.assertNotIn('lark_minutes',result['channels'])
    def test_health_zero_does_not_mean_failure_or_double_count_retry(self):
        bundle=self.bundle();first=s.health(bundle,{})
        self.assertEqual(first['channels']['minutes']['consecutive_empty'],1)
        second=s.health(bundle,first);self.assertEqual(second,first)
        bundle['run_id']='two';third=s.health(bundle,second)
        self.assertEqual(third['channels']['minutes']['consecutive_empty'],2)
        self.assertEqual(third['channels']['minutes']['status'],'complete')
    def test_lark_is_readonly_and_keeps_user_identity(self):
        def execute(argv,**kwargs):
            self.assertEqual(argv[1:3],['minutes','+search']);self.assertIn('user',argv)
            self.assertNotIn('--yes',argv);self.assertNotIn('shell',kwargs)
            return SimpleNamespace(returncode=0,stdout='{"ok":true,"identity":"user","data":{"items":[],"has_more":false}}')
        with patch('source_state.lark_command',return_value=['lark']),patch('source_state.subprocess.run',side_effect=execute):
            self.assertEqual(s.lark_read({},['minutes','+search'],self.p)['items'],[])
    def test_lark_rejects_bot_and_non_json_instead_of_empty_success(self):
        with patch('source_state.lark_command',return_value=['lark']):
            for stdout in ['{}','{"ok":true,"identity":"bot","data":{}}','network error']:
                with patch('source_state.subprocess.run',return_value=SimpleNamespace(returncode=0,stdout=stdout)),self.assertRaises(n.Error):
                    s.lark_read({},[],self.p)
    def test_lark_complete_pagination_dedupes_stable_ids_and_reads_transcript(self):
        calls=[];added=[]
        def read(settings,args,cwd):
            calls.append(args)
            if args[1]=='+search':
                return {'items':[{'token':'m1','title':'例会'}],'has_more':'--page-token' not in args,'page_token':'next'}
            text=cwd/'artifacts/m1/transcript.txt';n.save(text,'本人：联调已完成。')
            return {'minutes':[{'minute_token':'m1','title':'例会','artifacts':{'transcript_file':'artifacts/m1/transcript.txt'}}]}
        with patch('source_state.lark_read',side_effect=read):
            result=s.lark_minutes({},self.end-timedelta(days=2),self.end,self.p,lambda *args,**kwargs:added.append((args,kwargs)))
        self.assertEqual(result,1);self.assertEqual(len(added),1);self.assertEqual(len(calls),3)
        self.assertIn('联调已完成',added[0][0][3]);self.assertEqual(added[0][1]['content_kind'],'transcript')
    def test_lark_missing_cursor_is_partial_not_completed(self):
        with patch('source_state.lark_read',return_value={'items':[],'has_more':True}),self.assertRaisesRegex(s.Incomplete,'游标'):
            s.lark_minutes({},self.end-timedelta(days=1),self.end,self.p,Mock())
    def test_lark_cannot_read_transcript_outside_run_directory(self):
        def read(settings,args,cwd):
            if args[1]=='+search':return {'items':[{'token':'m1'}],'has_more':False}
            return {'minutes':[{'minute_token':'m1','artifacts':{'transcript_file':'../../private.txt'}}]}
        with patch('source_state.lark_read',side_effect=read),self.assertRaisesRegex(s.Incomplete,'输出目录'):
            s.lark_minutes({},self.end-timedelta(days=1),self.end,self.p,Mock())
    def test_similarity_never_merges_distinct_projects_or_completes_anything(self):
        title='确认车辆自动解封设备安装上线时间'
        self.assertTrue(g.similar_todos('解封',title,[{'subject':'[解封] 确认车辆自动解封设备的安装上线时间'}]))
        self.assertFalse(g.similar_todos('解封',title,[{'subject':'[靠卡] '+title}]))
        self.assertFalse(g.similar_todos('解封','联调',[{'subject':'[解封] 联动'}]))
    def test_memory_baseline_page_uses_memory_module_without_shadowing(self):
        import server
        config=self.p/'config.json';n.save(config,{'growth':{'state_dir':str(self.p)}})
        app=server.Application(self.p,config)
        self.addCleanup(app.read_pool.shutdown);self.addCleanup(app.write_pool.shutdown)
        with patch('server.memory.baseline',return_value={'verified':True}) as baseline:
            self.assertEqual(app.action('fixture','memory_baseline',{}),{'verified':True})
        baseline.assert_called_once()


class FinishTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);self.p=Path(temp.name)
        self.config={'base_url':'https://example.test','growth':{'state_dir':str(self.p),'home_output':str(self.p/'home.html'),
          'notification_mode':'changes','switches':{'digest':True}}}
        self.bundle={'run_id':'one','since':'2026-10-19T10:00:00+08:00','until':'2026-10-20T10:00:00+08:00',
          'identity':{'user_id':'self'},'sources':[],'coverage':[{'channel':'minutes','status':'complete','count':0}]}
        self.decision={'summary':'本轮实际写入0条','actions':[],'pending':[]}
        self.gw=Mock();self.gw.call.side_effect=self.call
        n.save(self.p/'evidence.json',self.bundle)
    def call(self,args):
        if args[:2]==['chat','+messages-send']:return {'sendReceipt':{'openTaskId':'sent'}}
        if args[:2]==['chat','+messages-query-send-status']:return {'result':{'sendStatus':'SUCCESS'}}
        raise AssertionError(args)
    def finish(self):
        n.save(self.p/'decision.json',self.decision)
        with patch('growth.validate'),patch('growth.Gateway',return_value=self.gw),patch('growth.self_identity',return_value=self.bundle['identity']),patch('growth.n.fetch',return_value={}),patch('growth.n.build_home'):
            return g.finish(self.config,self.p,self.p/'decision.json')
    def test_quiet_empty_round_does_not_send_and_commits_cursor(self):
        result=self.finish();self.assertFalse(result['notify']);self.gw.call.assert_not_called()
        self.assertEqual(n.load(self.p/'checkpoint.json')['channels']['minutes'],{'until':self.bundle['until']})
    def test_receipt_stats_override_execution_claims_in_model_analysis(self):
        self.decision['actions']=[{'op':'create_record'}]
        n.save(self.p/'plan.json',{'actions':[{'key':'a','op':'create_record'}]})
        n.save(self.p/'receipt.json',{'status':'verified','decision_hash':n.digest(self.decision),
          'results':{'a':{'results':[{'status':'created'}]}}})
        result=self.finish();self.assertEqual(result['execution']['records_created'],1)
        self.assertEqual(result['digest']['status'],'delivered')
        body=(self.p/'summary.md').read_text();self.assertLess(body.index('新增记录 1 条'),body.index('本轮实际写入0条'))
        self.assertIn('写入前生成，不作为执行回执',body)
    def test_reused_records_are_not_counted_as_new_writes(self):
        result=g.execution_result({'actions':[{'key':'a','op':'create_record'}]},
          {'results':{'a':{'results':[{'status':'already_present'}]}}})
        self.assertEqual(result['records_created'],0);self.assertEqual(result['reused'],1)
    def test_failed_action_cannot_advance_cursor_or_send_digest(self):
        self.decision['actions']=[{'op':'create_record'}]
        with self.assertRaisesRegex(n.Error,'尚未全部验证'):self.finish()
        self.assertFalse((self.p/'checkpoint.json').exists());self.gw.call.assert_not_called()
    def test_unchanged_coverage_failure_does_not_keep_notifying(self):
        self.bundle['coverage'][0].update(status='partial',error='missing cursor')
        n.save(self.p/'evidence.json',self.bundle);first=self.finish();self.assertTrue(first['notify'])
        self.bundle['run_id']='two';n.save(self.p/'evidence.json',self.bundle)
        (self.p/'finish.json').unlink();second=self.finish();self.assertFalse(second['notify'])


if __name__=='__main__':unittest.main()
