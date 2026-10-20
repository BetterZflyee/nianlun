import json
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
import codex_session as c
import nianlun as n


BACKEND=r'''
import json,sys
from pathlib import Path
def send(value):print(json.dumps(value),flush=True)
for line in sys.stdin:
 x=json.loads(line);method=x.get('method')
 if method=='initialize':send({'id':x['id'],'result':{'userAgent':'fixture'}})
 elif method=='thread/start':
  Path('thread-params.json').write_text(json.dumps(x['params']))
  send({'id':x['id'],'result':{'thread':{'id':'fixture-thread'}}})
 elif method=='turn/start':
  send({'id':x['id'],'result':{'turn':{'id':'fixture-turn'}}})
  send({'id':'approval-1','method':'item/commandExecution/requestApproval','params':{'command':'write verified.txt','itemId':'item-1','threadId':'fixture-thread','turnId':'fixture-turn','availableDecisions':['accept','decline','cancel']}})
 elif x.get('id')=='approval-1':
  if x.get('result',{}).get('decision')=='accept':Path('verified.txt').write_text('approved once')
  send({'method':'turn/completed','params':{'turn':{'id':'fixture-turn','status':'completed','error':None}}})
 elif method=='turn/interrupt':
  send({'id':x['id'],'result':{}})
  send({'method':'turn/completed','params':{'turn':{'id':'fixture-turn','status':'interrupted','error':None}}})
'''


class SessionTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);self.root=Path(temp.name)
        fake=self.root/'backend.py';fake.write_text(BACKEND)
        real=subprocess.Popen
        self.addCleanup(patch.stopall)
        patch('codex_session.harness.find_codex',return_value='codex').start()
        patch('codex_session.subprocess.Popen',side_effect=lambda args,**kwargs:real([sys.executable,str(fake)],**kwargs)).start()
        self.request=threading.Event();self.pending=[]
        self.session=c.Session(self.root/'outputs',on_request=self.receive)
        self.addCleanup(self.session.close)
        self.session.start();self.session.begin('fixture request')
        self.assertTrue(self.request.wait(3))
    def receive(self,message):self.pending.append(message);self.request.set()
    def test_no_command_runs_until_explicit_approval(self):
        self.assertFalse((self.root/'outputs/verified.txt').exists())
        params=json.loads((self.root/'outputs/thread-params.json').read_text())
        self.assertEqual(params['sandbox'],'workspace-write');self.assertEqual(params['approvalPolicy'],'on-request')
        self.assertEqual(params['approvalsReviewer'],'user')
        self.session.answer('approval-1','accept');self.session.wait(3)
        self.assertEqual((self.root/'outputs/verified.txt').read_text(),'approved once')
        with self.assertRaisesRegex(n.Error,'已处理'):self.session.answer('approval-1','accept')
    def test_decline_does_not_execute(self):
        self.session.answer('approval-1','decline');self.session.wait(3)
        self.assertFalse((self.root/'outputs/verified.txt').exists())
    def test_persistent_permission_changes_not_exposed(self):
        with self.assertRaisesRegex(n.Error,'本次'):self.session.answer('approval-1','acceptForSession')
        self.assertIn('approval-1',self.session.requests)
    def test_interruption_is_not_reported_as_completed(self):
        self.session.interrupt()
        with self.assertRaisesRegex(n.Error,'未完成'):self.session.wait(3)
        self.assertFalse((self.root/'outputs/verified.txt').exists())
    def test_cancel_before_begin_does_not_start_turn(self):
        pending=c.Session(self.root/'pending')
        pending.interrupt()
        with self.assertRaisesRegex(n.Error,'已取消'):pending.begin('must not run')

    def test_artifact_discovery_excludes_hidden_and_external_links(self):
        workspace=self.root/'outputs';(workspace/'.private.json').write_text('private')
        (self.root/'outside.txt').write_text('outside')
        (workspace/'outside-link.txt').symlink_to(self.root/'outside.txt')
        (workspace/'result.txt').write_text('result')
        files=c.artifacts(workspace)
        self.assertIn('result.txt',[x['name'] for x in files])
        self.assertNotIn('.private.json',[x['name'] for x in files])
        self.assertNotIn('outside-link.txt',[x['name'] for x in files])


if __name__=='__main__':unittest.main()
