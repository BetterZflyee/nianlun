"""Behavior tests with synthetic data. Never calls the real DWS CLI."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

import nianlun as n
from render_report import render


def fixture():
    tables = {}
    raw = {}
    for role in n.ROLES:
        fields = {}
        for k in n.REQUIRED[role]:
            field = {'fieldId': role + '-' + k, 'fieldName': n.FIELDS[role][k][0], 'type': 'text'}
            if k.endswith('_ids'):
                field.update(type='bidirectionalLink', config={'linkedTableId': 'T-projects', 'multiple': False})
            elif k == 'date':
                field['type'] = 'date'
            elif k in ('status', 'kind'):
                options = ['开放', '处理中', '已解决'] if role == 'records' and k == 'status' else ['沟通要点', '问题反馈'] if k == 'kind' else ['进行中', '待核', '已达成']
                field.update(type='singleSelect', config={'options': [{'id': 'opt-' + s, 'name': s} for s in options]})
            fields[k] = field
        tables[role] = {'id': 'T-' + role, 'name': n.ROLES[role], 'fields': fields}
        raw[role] = []
    raw['projects'] = [{'recordId': 'P1', 'cells': {'projects-title': '测试项目', 'projects-status': {'name': '进行中'}}}]
    raw['milestones'] = [{'recordId':'M1','cells':{'milestones-title':'联调','milestones-status':{'name':'待核'},'milestones-date':'2026-10-19','milestones-project_ids':{'linkedRecordIds':['P1']}}}]
    cfg = {'format':'nianlun-binding-v1','base_id':'BASE','base_url':'https://alidocs.dingtalk.com/i/nodes/BASE','profile':None,'utc_offset_hours':8,'tables':tables}
    return cfg, raw


class Fake:
    def __init__(self, config, raw):
        self.config, self.raw = config, copy.deepcopy(raw)
        self.profile = None
        self.writes = 0
        self.verify_bad = False

    def fields(self, base, table):
        return list(self.config['tables'][table[2:]]['fields'].values())

    def records(self, base, table):
        return copy.deepcopy(self.raw[table[2:]])

    def call(self, args):
        if args[0] == '+list-tables':
            return {'tables':[{'tableId':t['id'],'tableName':t['name']} for t in self.config['tables'].values()]}
        table = args[args.index('--table-id')+1]
        role = table[2:]
        if args[:2] == ['record','create']:
            self.writes += 1
            records = n.load(args[args.index('--records-file')+1])
            for r in records:
                r['recordId'] = 'created-' + str(self.writes)
                self.raw[role].append(r)
            return {'newRecordIds':[r['recordId'] for r in records]}
        if args[0] == '+record-update':
            self.writes += 1
            patches = json.loads(args[args.index('--records')+1])
            for p in patches:
                next(r for r in self.raw[role] if r['recordId']==p['recordId'])['cells'].update(p['cells'])
            return {'verified':True}
        if args[0] == '+record-query':
            rid = args[args.index('--record-ids')+1]
            return {'records':[] if self.verify_bad else [r for r in self.raw[role] if r['recordId']==rid]}
        raise AssertionError(args)


class Tests(unittest.TestCase):
    def setUp(self):
        self.cfg, self.raw = fixture()
        self.client = Fake(self.cfg, self.raw)
        self.state = n.fetch(self.cfg, self.client)
        self.item = {'project':'测试项目','title':'一次沟通','description':'测试事实','date':'2026-10-19','kind':'沟通要点','status':'开放',
                     'source':{'id':'event-1','name':'原始会议','quote':'原话'}}
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.receipt = Path(self.tmp.name)/'receipt.json'

    def test_bind_resolves_foreign_ids(self):
        bound = n.bind(self.client, 'BASE', self.cfg['base_url'])
        self.assertEqual(bound['tables']['records']['fields']['title']['fieldId'], 'records-title')
        self.assertEqual(self.client.writes, 0)

    def test_incomplete_pages_rejected(self):
        runner = lambda *a,**kw: SimpleNamespace(returncode=0,stdout=json.dumps({'data':{'records':[],'complete':False,'hasMore':True,'fetchedCount':0}}))
        with self.assertRaises(n.Error):
            n.DWS(runner=runner).records('B','T')

    def test_partial_success_rejected(self):
        with self.assertRaises(n.Error):
            n.payload({'status':'partial_success','data':{}})

    def test_missing_source_rejected(self):
        del self.item['source']['quote']
        with self.assertRaises(n.Error):
            n.plan(self.cfg,self.state,[self.item])

    def test_plan_readonly_and_batch_duplicate_rejected(self):
        doc = n.plan(self.cfg,self.state,[self.item])
        self.assertIn('原文摘录：原话',doc['actions'][0]['cells']['records-description'])
        self.assertEqual(self.client.writes,0)
        with self.assertRaises(n.Error):
            n.plan(self.cfg,self.state,[self.item,self.item])

    def test_apply_and_repeat_are_verified_idempotent(self):
        doc=n.plan(self.cfg,self.state,[self.item])
        first=n.apply_plan(self.cfg,self.client,doc,self.receipt)
        second=n.apply_plan(self.cfg,self.client,doc,self.receipt)
        self.assertEqual(first['status'],'verified')
        self.assertEqual(second['results'][0]['status'],'already_present')
        self.assertEqual(self.client.writes,1)

    def test_changed_duplicate_is_not_overwritten(self):
        doc=n.plan(self.cfg,self.state,[self.item])
        n.apply_plan(self.cfg,self.client,doc,self.receipt)
        self.client.raw['records'][0]['cells']['records-title']='用户手动修改'
        with self.assertRaises(n.Error):
            n.apply_plan(self.cfg,self.client,doc,self.receipt)
        self.assertEqual(self.client.writes,1)

    def test_concurrent_status_change_is_not_overwritten(self):
        doc=n.plan(self.cfg,self.state,[{'op':'update_status','role':'milestones','record_id':'M1','status':'已达成'}])
        self.client.raw['milestones'][0]['cells']['milestones-status']={'name':'进行中'}
        with self.assertRaises(n.Error):
            n.apply_plan(self.cfg,self.client,doc,self.receipt)
        self.assertEqual(self.client.writes,0)

    def test_status_write_verified_and_repeat(self):
        doc=n.plan(self.cfg,self.state,[{'op':'update_status','role':'milestones','record_id':'M1','status':'已达成'}])
        n.apply_plan(self.cfg,self.client,doc,self.receipt)
        n.apply_plan(self.cfg,self.client,doc,self.receipt)
        self.assertEqual(self.client.writes,1)

    def test_failed_verification_preserves_inflight_id(self):
        doc=n.plan(self.cfg,self.state,[self.item])
        self.client.verify_bad=True
        with self.assertRaises(n.Error):
            n.apply_plan(self.cfg,self.client,doc,self.receipt)
        receipt=n.load(self.receipt)
        self.assertEqual(receipt['status'],'stopped')
        self.assertEqual(receipt['in_flight']['record_id'],'created-1')

    def test_tampered_candidate_rejected(self):
        doc=n.plan(self.cfg,self.state,[self.item])
        doc['candidates'][0]['description']='changed'
        with self.assertRaises(n.Error):
            n.apply_plan(self.cfg,self.client,doc,self.receipt)
        self.assertEqual(self.client.writes,0)

    def test_report_dates_escaping_and_no_invented_status(self):
        self.state['records']=[{'id':'R1','title':'<script>alert(1)</script>','project_ids':['P1'],'date':'2026-10-18','kind':'沟通要点','description':'原话','status':'开放','table_url':self.cfg['base_url']},
                               {'id':'R2','title':'outside','project_ids':['P1'],'date':'2026-09-01','description':'old'}]
        html,md,count=render(self.state,self.state['projects'],'2026-10-01','2026-10-19','阶段汇报')
        self.assertEqual(count,1)
        self.assertNotIn('<script>alert',html)
        self.assertIn('&lt;script&gt;',html)
        self.assertNotIn('outside',html)
        self.assertIn('待核',html)
        self.assertIn('记录 ID：R1',md)

    def test_embedded_state_cannot_close_script(self):
        self.state['projects'][0]['title']='</script><script>alert(1)</script>'
        out=Path(self.tmp.name)/'home.html'
        n.build_home(self.state,out)
        self.assertNotIn('</script><script>alert',out.read_text())


if __name__ == '__main__':
    unittest.main()
