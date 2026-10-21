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

if __name__=='__main__':unittest.main()

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
