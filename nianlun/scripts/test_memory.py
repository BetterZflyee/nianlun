import json
import unittest
from subprocess import CompletedProcess
from unittest.mock import patch
import memory
import nianlun as n


def result(value,code=0):return CompletedProcess([],code,value,'')

class MemoryTests(unittest.TestCase):
    def test_reads_full_page_in_the_matching_source(self):
        hits=[{'slug':'projects/a','source_id':'private','title':'项目甲','chunk_text':'片段'},
              {'slug':'projects/a','source_id':'private','title':'项目甲','chunk_text':'另一片段'}]
        with patch('memory.run',side_effect=[result(json.dumps(hits)),result('完整历史正文')]) as run:
            value=memory.retrieve({'growth':{'memory_mode':'managed'}},'项目甲')
            self.assertEqual(len(value['pages']),1);self.assertTrue(value['pages'][0]['full_page'])
            self.assertEqual(value['pages'][0]['text'],'完整历史正文')
            self.assertEqual(run.call_args.args[1],['get','projects/a','--source','private'])
    def test_failed_read_is_marked_as_snippet(self):
        with patch('memory.run',side_effect=[result(json.dumps([{'slug':'a','chunk_text':'片段'}])),result('',1)]):
            value=memory.retrieve({'growth':{'memory_mode':'managed'}},'a')
            self.assertFalse(value['pages'][0]['full_page']);self.assertIn('回读失败',value['pages'][0]['note'])
    def test_empty_results_do_not_claim_library_is_empty(self):
        with patch('memory.run',return_value=result('[]')):
            value=memory.retrieve({'growth':{'memory_mode':'managed'}},'a')
            self.assertFalse(value['matched']);self.assertFalse(value['exhaustive'])
    def test_malformed_json_is_not_treated_as_full_text(self):
        with patch('memory.run',return_value=result('plain snippet')):
            with self.assertRaises(n.Error):memory.retrieve({'growth':{'memory_mode':'managed'}},'a')

if __name__=='__main__':unittest.main()
