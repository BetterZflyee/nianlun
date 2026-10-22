import json, unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import explorer
import nianlun as n

class Inventory(unittest.TestCase):
    def test_tsv_and_json_inventory_are_metadata_only(self):
        self.assertEqual(explorer.parse_inventory('projects/a\tnote\t2026-10-22\t项目 A')[0]['title'],'项目 A')
        row=explorer.parse_inventory(json.dumps([{'slug':'a','title':'A','body':'secret'}]))[0]
        self.assertNotIn('body',row)
    def test_invalid_inventory_does_not_become_empty(self):
        for raw in ['connection failed','{"error":"oops"}','[{"title":"no slug"}]']:
            with self.assertRaises(n.Error):explorer.parse_inventory(raw)
    def test_catalog_pagination_and_unknown_page_scope(self):
        e=explorer.MemoryExplorer(Path('/config'))
        rows=[{'slug':'page/'+str(i),'title':str(i)} for i in range(121)]
        result=SimpleNamespace(returncode=0,stdout=json.dumps(rows))
        with patch('explorer.n.load',return_value={'growth':{'brain_dir':'/example'}}),patch('explorer.memory.run',return_value=result) as run:
            c=e.catalog();self.assertTrue(c['has_more']);self.assertEqual(c['next_offset'],120)
            self.assertEqual(len(c['pages']),120);e.catalog();self.assertEqual(run.call_count,1)
            self.assertNotIn('--source-id',run.call_args.args[1])
            with self.assertRaises(n.Error):e.page('not-in-catalog')
            with self.assertRaises(n.Error):e.catalog(-1)
    def test_config_change_invalidates_page_scope(self):
        e=explorer.MemoryExplorer(Path('/config'))
        with patch('explorer.n.load',return_value={'growth':{'brain_dir':'/a'}}),patch('explorer.memory.run',return_value=SimpleNamespace(returncode=0,stdout='a\tnote\t2026-10-22\tA')):
            e.catalog()
        with patch('explorer.n.load',return_value={'growth':{'brain_dir':'/b'}}),patch('explorer.memory.run') as run:
            with self.assertRaises(n.Error):e.page('a')
            run.assert_not_called()
    def test_full_page_refs_are_explicit_and_bounded(self):
        e=explorer.MemoryExplorer(Path('/config'))
        with patch('explorer.n.load',return_value={'growth':{}}),patch('explorer.memory.run',return_value=SimpleNamespace(returncode=0,stdout='a\tnote\t2026-10-22\tA')):
            e.catalog()
        with patch('explorer.n.load',return_value={'growth':{}}),patch('explorer.memory.run',return_value=SimpleNamespace(returncode=0,stdout='[[b|标题]] '+'x'*61000)):
            page=e.page('a');self.assertEqual(page['references'],['b']);self.assertFalse(page['full_page']);self.assertEqual(len(page['text']),60000)

class MemoryRelations(unittest.TestCase):
    def setUp(self):
        self.config={'growth':{'brain_dir':'/example'}}
        self.load=patch('explorer.n.load',side_effect=lambda _:self.config);self.load.start();self.addCleanup(self.load.stop)
        self.e=explorer.MemoryExplorer(Path('/config'))
    def catalog(self,rows):
        with patch('explorer.memory.run',return_value=SimpleNamespace(returncode=0,stdout=json.dumps(rows))):return self.e.catalog()['pages']
    def result(self,rows):return SimpleNamespace(returncode=0,stdout=json.dumps(rows))
    def test_same_slug_sources_stay_distinct_and_explicitly_scoped(self):
        pages=self.catalog([{'slug':'same','source_id':'one'},{'slug':'same','source_id':'two'}])
        self.assertNotEqual(pages[0]['key'],pages[1]['key'])
        with self.assertRaises(n.Error):self.e.page('same')
        with patch('explorer.memory.run',return_value=self.result([])) as run:
            self.e.relations([p['key'] for p in pages])
            params=[json.loads(c.args[1][2]) for c in run.call_args_list]
            self.assertEqual({p['source_id'] for p in params},{'one','two'})
    def test_only_explicit_verified_edges_are_cached(self):
        page=self.catalog([{'slug':'a'}])[0]
        rows=[{'from_slug':'a','to_slug':'b','link_type':'references','context':'private body'},
              {'from_slug':'a','to_slug':'b','link_type':'references'}]
        with patch('explorer.memory.run',return_value=self.result(rows)) as run:
            value=self.e.relations([page['key']])['pages'][0];self.e.relations([page['key']])
            self.assertTrue(value['verified']);self.assertEqual(len(value['links']),1)
            self.assertNotIn('private body',json.dumps(value));self.assertEqual(run.call_count,1)
    def test_missing_or_malformed_index_is_not_a_verified_empty_graph(self):
        page=self.catalog([{'slug':'a'}])[0]
        for result in [SimpleNamespace(returncode=1,stdout=''),self.result({'error':'failed'}),self.result([{'from_slug':'wrong','to_slug':'b'}])]:
            with patch('explorer.memory.run',return_value=result):self.assertFalse(self.e.relations([page['key']])['pages'][0]['verified'])
        with patch('explorer.memory.run',return_value=self.result([])):
            self.assertTrue(self.e.relations([page['key']])['pages'][0]['verified'])
    def test_bounds_unknown_keys_and_timeout(self):
        page=self.catalog([{'slug':'a'}])[0]
        with patch('explorer.memory.run') as run:
            for value in [[],['bad'],[page['key']]*7,[{}],'a']:
                with self.assertRaises(n.Error):self.e.relations(value)
            run.assert_not_called()
        with patch('explorer.memory.run',side_effect=TimeoutError):
            self.assertFalse(self.e.relations([page['key']])['pages'][0]['verified'])
    def test_partial_links_and_cross_source_origin_are_not_misrepresented(self):
        page=self.catalog([{'slug':'a','source_id':'one'}])[0]
        rows=[{'from_slug':'a','from_source_id':'other','to_slug':'private'},
              {'from_slug':'a','from_source_id':'one','to_slug':'b','to_source_id':'two','truncated':True}]
        with patch('explorer.memory.run',return_value=self.result(rows)):
            value=self.e.relations([page['key']])['pages'][0]
            self.assertTrue(value['truncated']);self.assertEqual([e['slug'] for e in value['links']],['b'])
    def test_connection_change_during_read_rejects_stale_results(self):
        page=self.catalog([{'slug':'a'}])[0]
        def read(*args,**kwargs):
            self.config={'growth':{'brain_dir':'/changed'}}
            return self.result([])
        with patch('explorer.memory.run',side_effect=read):
            with self.assertRaises(n.Error):self.e.relations([page['key']])
        self.assertEqual(self.e.links_cache,{})

class TodoDetail(unittest.TestCase):
    def work(self,row,own=True):
        def call(args):
            if args[1]=='+get-my-tasks':return {'todos':[{'taskId':'one'}] if own else [],'complete':True,'hasMore':False}
            return row
        return SimpleNamespace(connection=lambda:({},SimpleNamespace(call=call),{}))
    def test_detail_allows_only_own_task_and_sanitizes_payload(self):
        row={'taskId':'one','subject':'标题','isDone':False,'token':'do-not-return','description':'正文',
             'creatorInfo':{'name':'名字','token':'private'},'executorInfos':[{'name':'执行人','userId':'private'}],
             'detailUrl':{'bad':'javascript:alert(1)','good':'https://example.test/task'},'activities':[{'comment':'活动','token':'private'}]}
        r=explorer.todo_detail(self.work(row),'one');self.assertEqual(r['description'],'正文');self.assertEqual(r['executors'],['执行人']);self.assertNotIn('token',json.dumps(r));self.assertNotIn('userId',json.dumps(r));self.assertEqual(r['links'],['https://example.test/task'])
        with self.assertRaises(n.Error):explorer.todo_detail(self.work(row,False),'one')
        with self.assertRaises(n.Error):explorer.todo_detail(self.work({**row,'taskId':'wrong'}),'one')
    def test_detail_failure_never_marks_task_done(self):
        work=self.work({})
        with self.assertRaises(n.Error):explorer.todo_detail(work,'one')

class SafeShutdown(unittest.TestCase):
    def test_shutdown_refuses_active_jobs_and_requires_auth(self):
        import http.client,threading
        from server import HTTPServer,Handler
        server=HTTPServer(('127.0.0.1',0),Handler);server.token='test-session'
        server.app=SimpleNamespace(guard=threading.RLock(),jobs={'one':{'status':'running'}})
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        def request(auth):
            conn=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=3)
            conn.request('POST','/api/shutdown','{}',{'Authorization':'Bearer '+auth,'Content-Type':'application/json','Origin':'http://127.0.0.1:'+str(server.server_port)})
            response=conn.getresponse();status=response.status;response.read();conn.close();return status
        try:
            self.assertEqual(request('wrong'),401)
            self.assertEqual(request('test-session'),409)
            server.app.jobs.clear();self.assertEqual(request('test-session'),200)
            thread.join(3);self.assertFalse(thread.is_alive())
        finally:server.shutdown();server.server_close()

if __name__=='__main__':unittest.main()
