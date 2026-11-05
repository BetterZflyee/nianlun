import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import flow
import harness
import nianlun as n


class FlowTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);self.root=Path(temp.name)
        self.folder=self.root/'run';self.folder.mkdir()
        self.config={'growth':{'state_dir':str(self.root),'switches':{}}}
        self.config_path=self.root/'config.json';n.save(self.config_path,self.config)
        self.bundle={'run_id':'run-test','binding':n.digest(self.config),'sources':[],'coverage':[],
                     'tables':{role:[] for role in n.ROLES},'todos':[]}
        n.save(self.folder/'evidence.json',self.bundle)
    def patches(self):
        return patch('flow.g.collect',return_value={'run_dir':str(self.folder)})
    def test_empty_evidence_does_not_spend_model_call(self):
        with self.patches(),patch('flow.harness.reason') as reason,patch('flow.g.apply',return_value={'results':{}}),patch('flow.g.finish',return_value={'status':'complete'}):
            result=flow.grow(self.config_path)
        reason.assert_not_called();self.assertEqual(result['actions'],0);self.assertTrue(result['verified'])
    def test_saved_decision_resumes_without_new_reasoning(self):
        n.save(self.folder/'decision.json',{'run_id':'run-test','summary':'已检查，无需改动。','actions':[],'pending':[]})
        with self.patches(),patch('flow.harness.reason') as reason,patch('flow.g.apply',return_value={'results':{}}),patch('flow.g.finish',return_value={'status':'complete'}):
            flow.grow(self.config_path)
        reason.assert_not_called();self.assertTrue((self.folder/'plan.json').exists())
    def test_invalid_model_action_json_does_not_write_or_finish(self):
        self.bundle['sources']=[{'id':'source','text':'项目进展','name':'原文'}];n.save(self.folder/'evidence.json',self.bundle)
        with self.patches(),patch('flow.harness.reason',return_value={'actions_json':'not JSON'}),patch('flow.g.apply') as apply,patch('flow.g.finish') as finish:
            # 模型返回不可解析的动作时，流程在核验阶段统一拒绝：不写表、不 finish、不留 decision。
            with self.assertRaisesRegex(n.Error,'未能通过核验'):flow.grow(self.config_path)
        apply.assert_not_called();finish.assert_not_called();self.assertFalse((self.folder/'decision.json').exists())
    def test_oversized_evidence_is_not_silently_truncated(self):
        self.bundle['sources']=[{'text':'大'*600001}];n.save(self.folder/'evidence.json',self.bundle)
        with self.patches(),patch('flow.harness.reason') as reason,patch('flow.g.apply') as apply:
            with self.assertRaisesRegex(n.Error,'未截断'):flow.grow(self.config_path)
        reason.assert_not_called();apply.assert_not_called()


class HarnessTests(unittest.TestCase):
    def test_explicit_proxy_is_preserved_and_system_proxy_fills_missing(self):
        with patch.dict(os.environ,{'HTTPS_PROXY':'http://explicit.test'},clear=True),patch('harness.getproxies',return_value={'https':'http://system.test','http':'http://system.test'}):
            env=harness.runtime_env()
        self.assertEqual(env['HTTPS_PROXY'],'http://explicit.test');self.assertEqual(env['HTTP_PROXY'],'http://system.test')
    def test_prompt_uses_stdin_and_tools_are_disabled(self):
        with tempfile.TemporaryDirectory() as folder:
            def run(command,**kwargs):
                self.assertNotIn('private project notes',command)
                self.assertEqual(kwargs['input'],'private project notes')
                self.assertIn('read-only',command)
                for feature in ('shell_tool','apps','multi_agent'):
                    self.assertEqual(command[command.index(feature)-1],'--disable')
                Path(command[command.index('--output-last-message')+1]).write_text('{"answer":"ok"}')
                return type('Result',(),{'returncode':0})()
            with patch('harness.find_codex',return_value='codex'),patch('harness.subprocess.run',side_effect=run):
                result=harness.reason('private project notes',folder,schema=harness.ANSWER_SCHEMA)
            self.assertEqual(result,{'answer':'ok'})


class EvidenceBudgetTests(unittest.TestCase):
    """裁剪必须按固定优先级进行，且不能悄悄丢掉能证明「写过什么」的材料。"""

    def bundle(self,records=0,sources=0,text='正文'):
        return {'run_id':'r','since':'2026-10-01','until':'2026-10-02','tables':{
            'projects':[{'id':'P1','title':'项目甲'}],'milestones':[],'sites':[],
            'records':[{'id':f'R{i}','title':'记录','project_ids':['P1'],'date':f'2026-09-{i%28+1:02d}'} for i in range(records)],
            'fields':{r:{} for r in n.ROLES}},
            'todos':[],'sources':[{'id':f's{i}','name':'来源','text':text,'time':f'2026-10-0{i%9+1}T10:00:00+08:00'} for i in range(sources)]}

    def test_small_evidence_is_left_untouched(self):
        doc,notes=flow.trim_evidence(flow.prompt_evidence(self.bundle(2,2)))
        self.assertEqual(notes,[])
        self.assertEqual(len(doc['tables']['records']),2)

    def test_records_are_folded_before_sources_are_truncated(self):
        """历史记录只用于去重，应当先于来源正文被压缩。"""
        doc,notes=flow.trim_evidence(flow.prompt_evidence(self.bundle(400,2)),budget=20000)
        self.assertTrue(doc['tables']['record_history']['total']>=400)
        self.assertLessEqual(len(doc['tables']['records']),60)
        self.assertTrue(all('text_truncated' not in s for s in doc['sources']))

    def test_single_oversized_source_is_never_truncated(self):
        """单条来源超过预算时不能截：截了就无法逐字引用原文，只能交回宿主。"""
        bundle=self.bundle(0,1,text='长'*600001)
        doc,notes=flow.trim_evidence(flow.prompt_evidence(bundle),budget=600000)
        self.assertIn('存在单条超长来源，未截断，交由宿主分批处理',notes)
        self.assertEqual(len(doc['sources'][0]['text']),600001)

    def test_field_contract_survives_every_trim_level(self):
        """无论裁到哪一级，字段契约都不能丢，否则写单选字段必然越界。"""
        bundle=self.bundle(400,300,text='中'*3000)
        bundle['tables']['fields']['milestones']={'status':{'type':'singleSelect','config':{'options':[{'name':'待核'}]}}}
        doc,_=flow.trim_evidence(flow.prompt_evidence(bundle),budget=20000)
        self.assertEqual(doc['table_fields']['milestones']['status']['options'],['待核'])



if __name__=='__main__':unittest.main()
