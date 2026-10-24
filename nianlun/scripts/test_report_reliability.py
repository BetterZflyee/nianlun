"""Report retry and publication regressions; no real accounts or remote writes."""
import copy
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import nianlun as n
import growth as g
import report_style
from server import Application


class ReportReliability(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);self.root=Path(tmp.name)
        self.state={'complete':True,'fetched_at':'2026-10-24','projects':[{'id':'p','title':'项目','report':'https://example.test/old'}],
                    'records':[],'milestones':[],'sites':[]}
        self.config={'base_id':'b','growth':{'state_dir':str(self.root/'state'),'report_folder':'folder','switches':{'reports':True}},
                     'tables':{'projects':{'fields':{'report':{'fieldId':'report'}}}}}
        self.summary=self.root/'summary.md';self.summary.write_text('Lead: 保留结论。\n\n## A 当前判断\n依据项目档案。[P1]',encoding='utf-8')
        self.calls=[];owner=self
        class Gateway:
            def __init__(self,config):pass
            def table(self):return None
            def call(self,args,cwd=None):
                owner.calls.append(args)
                if args[:2]==['drive','+upload']:return {'nodeId':'node','url':'https://example.test/new'}
                raise AssertionError(args)
        for target,value in [('growth.Gateway',Gateway),('growth.self_identity',lambda _:None),('growth.n.fetch',lambda *_:copy.deepcopy(self.state))]:
            p=patch(target,value);p.start();self.addCleanup(p.stop)

    def publish(self):return g.publish_report(self.config,'p','2026-10-17','2026-10-24',self.summary)

    def test_write_succeeded_but_reply_lost_reuses_upload_and_confirms_existing_link(self):
        def write(*args):
            self.state['projects'][0]['report']='https://example.test/new'
            raise n.Error('写回响应丢失')
        with patch('growth.table_write',side_effect=write) as writer:
            with self.assertRaisesRegex(n.Error,'响应丢失'):self.publish()
            result=self.publish()
            self.assertEqual(result['status'],'verified');self.assertEqual(writer.call_count,1)
            self.assertEqual(len(self.calls),1)
            self.assertTrue(self.publish()['already_present'])
            self.state['projects'][0]['report']='https://example.test/later-report'
            with self.assertRaisesRegex(n.Error,'未覆盖最新链接'):self.publish()
            self.assertEqual(len(self.calls),1)

    def test_incomplete_readback_does_not_write_or_repeat_upload(self):
        original=copy.deepcopy(self.state);partial={**original,'complete':False}
        with patch('growth.n.fetch',side_effect=[original,partial]),patch('growth.table_write') as writer:
            with self.assertRaisesRegex(n.Error,'回读不完整'):self.publish()
            writer.assert_not_called()
        with patch('growth.table_write',return_value={'verified':True}) as writer:
            self.assertEqual(self.publish()['status'],'verified');self.assertEqual(writer.call_count,1)
        self.assertEqual(len(self.calls),1)

    def test_other_report_link_is_never_overwritten_on_retry(self):
        with patch('growth.table_write',side_effect=n.Error('offline')):
            with self.assertRaises(n.Error):self.publish()
        self.state['projects'][0]['report']='https://example.test/other-author'
        with patch('growth.table_write') as writer:
            with self.assertRaisesRegex(n.Error,'其他人更新'):self.publish()
            writer.assert_not_called()
        self.assertEqual(len(self.calls),1)

    def test_stale_report_exposes_refresh_instead_of_endless_retry(self):
        config=self.root/'config.json';n.save(config,{'harness':{'provider':'deepseek','mode':'delegated'}})
        app=Application(self.root/'home',config)
        try:
            for error in [{'error_code':'report_stale','error':'资料已更新'}, {'error':'接续期间项目事实已变化'}]:
                job={'id':'job','op':'report','status':'failed','resume_data':{},**error}
                app.jobs['job']=job;view=app.job_view(job)
                self.assertTrue(view['report_needs_refresh']);self.assertFalse(view['can_resume'])
                with self.assertRaises(n.Error):app.submit('resume',{'job_id':'job'})
        finally:app.read_pool.shutdown();app.write_pool.shutdown()

    def test_renderer_failure_or_empty_success_never_reuses_old_html(self):
        method={'path':str(self.root/'SKILL.md')};out=self.root/'render';out.mkdir()
        old=out/'visual.html';old.write_text('previous valid report',encoding='utf-8')
        for failure in ('empty','timeout','broken'):
            def command(args,**kwargs):
                if failure=='timeout':raise subprocess.TimeoutExpired(args,120)
                Path(args[args.index('-o')+1]).write_text('' if failure=='empty' else '<html>broken',encoding='utf-8')
                return SimpleNamespace(returncode=0)
            with self.subTest(failure=failure),patch('report_style.preflight',return_value=('node','engine','editor')),patch('report_style.subprocess.run',side_effect=command):
                with self.assertRaises(n.Error):report_style.render(method,'Lead: 内容',out,'报告')
                self.assertEqual(old.read_text(encoding='utf-8'),'previous valid report')


if __name__=='__main__':unittest.main()
