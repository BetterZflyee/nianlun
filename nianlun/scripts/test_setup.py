import copy
import io
import json
import os
import tempfile
import unittest
import zipfile
from contextlib import chdir
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import dependencies
import nianlun as n
import growth
from setup import Setup, validate_schedule


class FakeCloud:
    def __init__(self):
        self.tables={};self.writes=0;self.drop_reply=False;self.user='user-A'
    def gateway(self,config):
        cloud=self
        class GW:
            def __init__(self):self.config=config
            def call(self,args):
                if args[:3]==['contact','user','get-self']:
                    return {'result':[{'orgEmployeeModel':{'userId':cloud.user,'orgUserName':'测试用户','corpId':'test-org'}}]}
                if args[0]!='aitable':raise AssertionError(args)
                a=args[1:];arg=lambda key:a[a.index(key)+1]
                if a[0]=='+list-tables':return {'tables':[{'tableId':k,'tableName':v['name']} for k,v in cloud.tables.items()]}
                if a[:2]==['field','list']:return {'fields':copy.deepcopy(cloud.tables[arg('--table-id')]['fields'])}
                if a[:2]==['record','query']:return {'records':None,'fetchedCount':0,'hasMore':False,'complete':True}
                if a[0]=='+table-bootstrap':
                    cloud.writes+=1;tid='table-'+str(len(cloud.tables))
                    fields=json.loads(arg('--fields'))
                    for i,f in enumerate(fields):f['fieldId']=tid+'-field-'+str(i)
                    cloud.tables[tid]={'name':arg('--name'),'fields':fields}
                    if cloud.drop_reply:cloud.drop_reply=False;raise n.Error('提交后连接中断')
                    return {'result':{'tableId':tid}}
                if a[:2]==['field','create']:
                    cloud.writes+=1;tid=arg('--table-id');fs=cloud.tables[tid]['fields']
                    for f in json.loads(arg('--fields')):f['fieldId']=tid+'-field-'+str(len(fs));fs.append(f)
                    return {'fields':fs}
                raise AssertionError(args)
            def table(self):
                gw=self
                class Table(n.DWS):
                    def call(self,args):return gw.call(['aitable',*args])
                return Table(config.get('profile'))
        return GW()


class SetupTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.home=Path(self.tmp.name);self.cloud=FakeCloud()
        n.save(self.home/'dependencies.json',{'dws_bin':'fake-dws'})
        self.setup=Setup(self.home,self.home/'personal/config.json',self.cloud.gateway)
        self.spec={'mode':'initialize','profile':'test-org:user-A','base_url':'https://alidocs.dingtalk.com/i/nodes/test-base'}

    def test_empty_cloud_initializes_four_tables_and_repeated_run_is_read_only(self):
        plan=self.setup.table_plan(self.spec);result=self.setup.tables_apply(plan)
        self.assertEqual(result['counts'],{r:0 for r in n.ROLES});self.assertTrue(result['complete'])
        self.assertEqual(self.cloud.writes,4)
        self.setup.tables_apply(plan);self.assertEqual(self.cloud.writes,4)
        config=n.load(self.setup.config_path);n.verify_links(config)

    def test_lost_table_response_reconciles_before_continuing(self):
        plan=self.setup.table_plan(self.spec);self.cloud.drop_reply=True
        with self.assertRaises(n.Error):self.setup.tables_apply(plan)
        self.assertEqual(len(self.cloud.tables),1)
        self.setup.tables_apply(plan)
        self.assertEqual(len(self.cloud.tables),4);self.assertEqual(self.cloud.writes,4)

    def test_existing_field_conflict_blocks_before_any_more_writes(self):
        plan=self.setup.table_plan(self.spec);self.setup.tables_apply(plan)
        self.cloud.tables['table-0']['fields'][0]['type']='number'
        with self.assertRaises(n.Error):self.setup.table_plan(self.spec)
        self.assertEqual(self.cloud.writes,4)

    def test_reusing_other_workspace_config_is_refused_before_writes(self):
        n.save(self.setup.config_path,{'base_id':'other-base','profile':self.spec['profile']})
        with self.assertRaises(n.Error):self.setup.table_plan(self.spec)
        self.assertEqual(self.cloud.writes,0)

    def test_identity_switch_refuses_apply(self):
        plan=self.setup.table_plan(self.spec);self.cloud.user='user-B'
        with self.assertRaises(n.Error):self.setup.tables_apply(plan)
        self.assertEqual(self.cloud.writes,0)

    def test_schema_change_after_preview_refuses_apply(self):
        plan=self.setup.table_plan(self.spec)
        self.cloud.tables['unrelated']={'name':'其他资料','fields':[]}
        with self.assertRaises(n.Error):self.setup.tables_apply(plan)
        self.assertEqual(self.cloud.writes,0)

    def test_custom_table_and_field_names_bind_without_renaming_or_writing(self):
        self.setup.tables_apply(self.setup.table_plan(self.spec))
        mapping={};field_map={}
        for role,tid in zip(n.ROLES,self.cloud.tables):
            mapping[role]=tid;self.cloud.tables[tid]['name']='自定义-'+role
            field=self.cloud.tables[tid]['fields'][0];field['fieldName']='个性化名称'
            field_map[role]={'title':field['fieldId']}
        spec={**self.spec,'mode':'bind','table_map':mapping,'field_map':field_map}
        # A separate install binds the same cloud schema without reusing the original init journal.
        other=Setup(self.home,self.home/'other/config.json',self.cloud.gateway)
        result=other.tables_apply(other.table_plan(spec))
        self.assertTrue(result['bound']);self.assertEqual(self.cloud.writes,4)

    def test_unknown_empty_page_not_normalized(self):
        c=n.DWS(runner=lambda *a,**k:SimpleNamespace(returncode=0,stdout=json.dumps({'complete':True,'hasMore':False,'records':None,'fetchedCount':5})))
        with self.assertRaises(n.Error):c.records('base','table')

    def test_isolated_memory_never_inherits_ambient_database(self):
        with patch.dict('os.environ',{'DATABASE_URL':'postgresql://unrelated','GBRAIN_DATABASE_URL':'postgresql://other'}):
            env=n.brain_env({'growth':{'brain_home':str(self.home),'memory_mode':'managed'}})
        self.assertNotIn('DATABASE_URL',env);self.assertNotIn('GBRAIN_DATABASE_URL',env)
        self.assertEqual(env['GBRAIN_HOME'],str(self.home.resolve()))

    def test_download_archive_cannot_write_outside_installation(self):
        archive=self.home/'bad.zip'
        with zipfile.ZipFile(archive,'w') as z:z.writestr('../escape','payload')
        with self.assertRaises(n.Error):dependencies.extract(archive,self.home/'safe','zip')
        self.assertFalse((self.home/'escape').exists())

    def test_invalid_schedule_is_rejected(self):
        for hours in ([10,10],[-1],[24],[True],[]):
            with self.assertRaises(n.Error):validate_schedule({'timezone':'Asia/Shanghai','growth_hours':hours,'report_weekday':'TH','report_hour':9})

    def test_rebinding_keeps_existing_run_state_and_memory(self):
        plan=self.setup.table_plan(self.spec);self.setup.tables_apply(plan)
        config=n.load(self.setup.config_path)
        growth={'state_dir':str(self.home/'old-run-state'),'brain_dir':str(self.home/'old-brain'),'home_output':str(self.home/'old-home.html')}
        config['growth']=growth;n.save(self.setup.config_path,config)
        self.setup.tables_apply(plan)
        self.assertEqual(n.load(self.setup.config_path)['growth'],growth)
        n.save(Path(growth['state_dir'])/'active.json',{'run_id':'unfinished'})
        with self.assertRaises(n.Error):self.setup.tables_apply(plan)

    def test_windows_runtime_selection_uses_source_and_argv(self):
        fake_home=self.home/'win';fake_home.mkdir()
        src=fake_home/'runtime/gbrain-source-v0.51.0.0/src';src.mkdir(parents=True);(src/'cli.ts').write_text('fixture')
        calls=[]
        def asset(tool,name,home,filename):calls.append((tool,name));return str(home/filename)
        with patch.object(dependencies,'platform_key',return_value=('windows','x64')),patch.object(dependencies,'find_binary',return_value=None),patch.object(dependencies,'install_asset',side_effect=asset),patch.object(dependencies,'version',return_value='verified version'),patch.object(dependencies.subprocess,'run',return_value=SimpleNamespace(returncode=0)):
            result=dependencies.install(fake_home)
        self.assertEqual(calls,[('dws','dws-windows-amd64.zip'),('bun','bun-windows-x64-baseline.zip')])
        self.assertEqual(result['gbrain_command'],[str((fake_home/'bun.exe').resolve()),str((src/'cli.ts').resolve())])

    def test_schedule_requires_real_active_matching_native_files(self):
        config={'growth':{'state_dir':str(self.home/'state'),'schedule':{'timezone':'Asia/Shanghai','growth_hours':[10,12],'report_weekday':'TH','report_hour':9}}}
        n.save(self.setup.config_path,config);request=self.setup.schedule_request(config)
        codex=self.home/'codex';files=[]
        for index,task in enumerate(request['tasks']):
            rule='FREQ=DAILY;BYHOUR=10,12;BYMINUTE=0;BYSECOND=0' if index==0 else 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=9;BYMINUTE=0;BYSECOND=0'
            path=codex/'automations'/str(index)/'automation.toml';path.parent.mkdir(parents=True)
            path.write_text('id = "'+str(index)+'"\nkind = "heartbeat"\nstatus = "ACTIVE"\ntarget_thread_id = "test-thread"\nrrule = "'+rule+'"\nprompt = '+json.dumps(task['prompt'],ensure_ascii=False)+'\n',encoding='utf-8');files.append(path)
        result=self.setup.verify_schedules(files,codex);self.assertTrue(result['active'])
        files[0].write_text(files[0].read_text().replace('"ACTIVE"','"PAUSED"'))
        with self.assertRaises(n.Error):self.setup.verify_schedules(files,codex)
        with self.assertRaises(n.Error):self.setup.verify_schedules([self.home/'fake.json'],codex)

    def test_finish_accepts_relative_run_directory_when_brain_uses_other_cwd(self):
        self.setup.tables_apply(self.setup.table_plan(self.spec));config=n.load(self.setup.config_path)
        run=self.home/'run';brain=self.home/'brain';brain.mkdir()
        config['growth']={'state_dir':str(self.home/'state'),'brain_dir':str(brain),'gbrain_command':['bun','brain.ts'],
                          'home_output':str(self.home/'home.html'),'switches':{'gbrain':True,'digest':False}}
        summary='安装验收完成，没有项目变化。'
        bundle={'run_id':'empty-run','binding':n.digest(config),'identity':{'user_id':'user-A','name':'测试用户','corp_id':'test-org'},
                'since':'2026-10-19T10:00:00+08:00','until':'2026-10-19T12:00:00+08:00','sources':[],'coverage':[]}
        n.save(run/'evidence.json',bundle);n.save(run/'decision.json',{'run_id':'empty-run','summary':summary,'actions':[]})
        captures=[]
        def brain_run(args,**kwargs):
            if 'capture' in args:
                source=Path(args[args.index('--file')+1]);self.assertTrue(source.is_absolute());self.assertTrue(source.is_file())
                captures.append(source)
                return SimpleNamespace(returncode=0,stdout='{}')
            return SimpleNamespace(returncode=0,stdout=summary)
        # Windows cannot form a relative path across different drive letters.
        with chdir(self.home),patch.object(growth,'Gateway',return_value=self.cloud.gateway(config)),patch.object(growth.subprocess,'run',side_effect=brain_run):
            result=growth.finish(config,os.path.relpath(run),run/'decision.json')
        self.assertEqual(result['status'],'complete');self.assertEqual(len(captures),1)


if __name__=='__main__':unittest.main()
