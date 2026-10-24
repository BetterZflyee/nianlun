import base64
import hashlib
import json
import re
import unittest
from copy import deepcopy
import report_blocks as blocks
import report_brief
from render_report import brief_html

EVIDENCE=[{'key':'R1','title':'验收记录'}]
STATUS={'type':'status','title':'两地状态','caption':'准备与实际验收分开。','items':[
    {'label':'场地甲','state':'active','detail':'联调完成，验收待核。','next':'补充验收结论。','source':'[R1]'}]}
GRAPH={'type':'graph','title':'推进路径','caption':'下一步，不代表已完成。','nodes':[
    {'id':'a','label':'资料缺失','state':'blocked','layer':0,'detail':'待补齐。','source':'[R1]'},
    {'id':'b','label':'补充资料','state':'planned','layer':1,'detail':'下一步。','source':'[R1]'}],
    'links':[{'from':'a','to':'b','label':'下一步','source':'[R1]'}]}
CHART={'type':'bar','title':'验收量','caption':'同口径的实际值。','unit':'个','categories':['上期','本期'],
       'series':[{'name':'已验收','data':[2,4]}],'source':'[R1]'}
def draft(config):return 'Lead: 当前结论。\n\n## A 重点\n```visual\n'+json.dumps(config,ensure_ascii=False)+'\n```\n'


class BlockTests(unittest.TestCase):
    def test_new_contract_and_unknown_citations(self):
        for c in (STATUS,GRAPH,CHART):self.assertEqual(report_brief.issues(draft(c),EVIDENCE),[])
        c=deepcopy(STATUS);c['items'][0]['source']='[R999]'
        self.assertTrue(report_brief.issues(draft(c),EVIDENCE))
        for s in ('```visual\n{bad}\n```','```visual bad\n{}\n```'):
            self.assertTrue(report_brief.issues('Lead: test\n## A x\n'+s,EVIDENCE))

    def test_no_arbitrary_options_or_code(self):
        for field,value in [('formatter','function(){evil()}'),('__proto__',{}),('url','https://example.test')]:
            c=deepcopy(CHART);c[field]=value
            with self.assertRaises(ValueError):blocks.validate(c)
        for label in ('<script>alert(1)</script>','x'*161):
            c=deepcopy(STATUS);c['items'][0]['detail']=label
            with self.assertRaises(ValueError):blocks.validate(c)

    def test_numeric_and_relation_integrity(self):
        for data in ([float('nan'),4],[True,4],[1],['50%',2]):
            c=deepcopy(CHART);c['series'][0]['data']=data
            with self.assertRaises(ValueError):blocks.validate(c)
        for target in ('a','missing'):
            c=deepcopy(GRAPH);c['links'][0]['to']=target
            with self.assertRaises(ValueError):blocks.validate(c)
        c=deepcopy(GRAPH);c['nodes'][1]['layer']=0
        with self.assertRaises(ValueError):blocks.validate(c)

    def test_visual_metadata_does_not_consume_prose_budget(self):
        self.assertLess(len(blocks.prose(draft(GRAPH))),len(draft(GRAPH)))
        self.assertTrue(report_brief.issues(draft(STATUS)+'字'*1801,EVIDENCE))

    def test_static_content_survives_and_source_script_not_changed(self):
        md,items=blocks.parse(draft(GRAPH),EVIDENCE);token=items[0][0]
        page='<html><head></head><body><main><p>'+token+'</p></main><script>'+token+'</script></body></html>'
        html=blocks.restore(page,items)
        self.assertIn('<script>'+token+'</script>',html)
        self.assertIn('class="am-node"',html);self.assertIn('class="am-edge"',html)
        self.assertIn('节点说明与依据',html);self.assertIn('#source-R1',html)
        with self.assertRaises(ValueError):blocks.restore(page.replace('<p>'+token+'</p>',''),items)

    def test_visual_is_a_separate_paragraph_even_before_following_prose(self):
        md,items=blocks.parse(draft(STATUS)+'后面是解释。')
        self.assertIn('\n\n'+items[0][0]+'\n\n',md)
        self.assertTrue(md.endswith('后面是解释。'))

    def test_status_without_a_next_action_does_not_invent_or_require_one(self):
        c=deepcopy(STATUS);c['items'][0].pop('next')
        self.assertEqual(report_brief.issues(draft(c),EVIDENCE),[])
        self.assertNotIn('下一步',blocks.figure(c,'x'))

    def test_native_renderer_is_compatible_without_skill(self):
        html=brief_html(draft(STATUS),'测试','2026-01-01','2026-01-02')
        self.assertIn('rv-status-card',html);self.assertNotIn('NLVISUAL',html)
        self.assertNotIn('rv-visual-runtime',html)

    def test_svg_and_data_table_for_numeric_chart(self):
        html=blocks.figure(CHART,'test')
        self.assertIn('<svg',html);self.assertIn('<td>2</td>',html);self.assertIn('<td>4</td>',html)
        self.assertIn('aria-label="验收量"',html)

    def test_exact_csp_idempotence_and_no_external_dependencies(self):
        html='<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'sha256-original\'; style-src \'unsafe-inline\'"></head><body>'+blocks.figure(GRAPH,'x')+'</body></html>'
        result=blocks.enhance(html)
        script=re.search(r'<script id="rv-visual-runtime">(.*?)</script>',result,re.S)[1]
        digest=base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
        self.assertIn("'sha256-"+digest+"'",result)
        self.assertNotIn('<script src=',result);self.assertNotIn('unsafe-eval',result)
        self.assertEqual(blocks.enhance(result),result)
        self.assertNotIn('rv-visual-runtime',blocks.enhance(html.replace("script-src 'sha256-original'","script-src 'none'")))


if __name__=='__main__':unittest.main()
