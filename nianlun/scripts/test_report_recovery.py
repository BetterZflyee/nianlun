import tempfile
import unittest
from pathlib import Path
import growth as g
import nianlun as n

class RecoveryTests(unittest.TestCase):
    def test_renamed_uploaded_file_is_verified_without_reupload(self):
        self.check([b'report'],True)
    def test_matching_size_but_different_content_stays_unknown(self):
        self.check([b'wrong!'],False)
    def test_duplicate_identical_files_are_not_arbitrarily_selected(self):
        self.check([b'report',b'report'],False)
    def check(self,contents,success):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp);(folder/'report.html').write_bytes(b'report')
            calls=[]
            class Gateway:
                def call(self,args,cwd=None):
                    calls.append(args);operation=args[1]
                    if operation=='+list':return {'hasMore':False,'files':[{'name':'report('+str(i+1)+').html','nodeId':str(i),'fileSize':len(value)} for i,value in enumerate(contents)]}
                    if operation=='+download':
                        node=int(args[args.index('--node')+1]);(Path(cwd)/args[args.index('--output')+1]).write_bytes(contents[node]);return {}
                    if operation=='+inspect':return {'fileId':args[-1],'docUrl':'https://alidocs.dingtalk.com/i/nodes/'+args[-1]}
                    raise AssertionError('不得上传：'+str(args))
            receipt={'in_flight':{'step':'upload','file':'report.html'}};config={'growth':{'report_folder':'test'}}
            if success:
                value=g.reconcile_report_upload(config,Gateway(),folder,receipt)
                self.assertEqual(value['node_id'],'0');self.assertNotIn('in_flight',value)
                self.assertTrue(value['reconciliation']['sha256'])
            else:
                with self.assertRaises(n.Error):g.reconcile_report_upload(config,Gateway(),folder,receipt)
                self.assertIn('in_flight',receipt)
            self.assertFalse(any(x[1]=='+upload' for x in calls))

if __name__=='__main__':unittest.main()
