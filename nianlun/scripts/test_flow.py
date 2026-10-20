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
            with self.assertRaisesRegex(n.Error,'未能解析'):flow.grow(self.config_path)
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


if __name__=='__main__':unittest.main()
