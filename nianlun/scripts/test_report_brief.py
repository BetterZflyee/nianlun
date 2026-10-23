import tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import nianlun as n
import report_brief as brief
import report_style
from render_report import render

FACTS={'projects':[{'id':'p','title':'项目甲','status':'进行中','table_url':'https://example.test/table'}],
    'records':[{'id':'r','title':'原始流水条目','description':'不应再次堆到正文的材料','date':'2026-10-10','project_ids':['p'],'table_url':'https://example.test/records'}],
    'milestones':[{'id':'m','title':'全部计划节点','status':'待核','project_ids':['p'],'date':'2026-10-12','table_url':'https://example.test/milestones'}], 'sites':[]}
DRAFT='Lead: 联调已推进，验收仍待确认。\n\n## A 本期变化\n现场已完成联调。[R1]\n\n## B 下阶段行动\n补充验收证据。[M1]'

class BriefTests(unittest.TestCase):
    def test_summary_is_not_followed_by_a_second_dump_of_records_and_milestones(self):
        html,md,count=render({**FACTS,'fetched_at':'2026-10-23'},FACTS['projects'],'2026-10-01','2026-10-23','回顾',DRAFT)
        self.assertEqual(count,1);self.assertEqual(md,DRAFT)
        self.assertNotIn('不应再次堆到正文',html);self.assertNotIn('全部计划节点',html)
        self.assertIn('现场已完成联调',html)

    def test_references_are_closed_selected_and_escaped(self):
        pages=[{'title':'<script>memory</script>','slug':'notes/ref','text':'原文','full_page':False}]
        evidence=brief.sources(FACTS,pages)
        block=brief.appendix(DRAFT+' [K1]',evidence,pages)
        self.assertIn('<details class="nianlun-evidence">',block)
        self.assertNotIn('<details open',block);self.assertNotIn('<script>',block)
        self.assertIn('source-K1',block);self.assertIn('仅片段',block)
        self.assertNotIn('source-P1',block)
        self.assertNotIn('不应再次堆到正文',block)

    def test_invalid_scope_shape_and_oversized_drafts_are_rejected(self):
        evidence=brief.sources(FACTS,[])
        self.assertEqual(brief.issues(DRAFT,evidence),[])
        for bad in (DRAFT+' [R99]',DRAFT+'长'*1801,'# 长篇\n'+DRAFT,DRAFT+'\n<script>bad</script>',DRAFT+'\n```html\nunsafe\n```',DRAFT+'\nhttps://example.test/private',DRAFT+'\n```flow\na --> b\n```',DRAFT+'\n```callout\nno type\n```',DRAFT+' [bad](javascript:bad)'):
            self.assertTrue(brief.issues(bad,evidence),bad[:30])

    def test_long_draft_gets_one_revision_and_reuses_validated_body_on_retry(self):
        evidence=brief.sources(FACTS,[])
        with tempfile.TemporaryDirectory() as tmp,patch('harness.report_reason',side_effect=[{'answer':DRAFT+'长'*1801},{'answer':DRAFT}]) as model:
            args=(FACTS['projects'][0],'2026-10-01','2026-10-23',evidence,{},Path(tmp),{},lambda _:None,lambda:False)
            self.assertEqual(brief.compose(*args),DRAFT)
            self.assertEqual(brief.compose(*args),DRAFT)
            self.assertEqual(model.call_count,2)
            self.assertEqual(n.load(Path(tmp)/'composition.json')['citations'],['M1','R1'])

    def test_failed_revision_never_becomes_a_publishable_summary(self):
        with tempfile.TemporaryDirectory() as tmp,patch('harness.report_reason',return_value={'answer':'无法形成合格报告'}) as model:
            with self.assertRaisesRegex(n.Error,'未上传'):
                brief.compose(FACTS['projects'][0],'2026-10-01','2026-10-23',brief.sources(FACTS,[]),{},Path(tmp),{},lambda _:None,lambda:False)
            self.assertEqual(model.call_count,2);self.assertFalse((Path(tmp)/'summary.md').exists())

    def test_interrupted_generation_keeps_its_original_host_request(self):
        with tempfile.TemporaryDirectory() as tmp,patch('harness.report_reason',return_value={'answer':DRAFT}) as model:
            folder=Path(tmp)
            n.save(folder/'harness/direct-input.json',{'prompt':'original frozen request'})
            brief.compose(FACTS['projects'][0],'2026-10-01','2026-10-23',brief.sources(FACTS,[]),{},folder,{},lambda _:None,lambda:False)
            self.assertEqual(model.call_args.args[0],'original frozen request')

    def test_visual_skill_uses_sheet_and_keeps_flow_arrows_parseable(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'skill';(root/'references').mkdir(parents=True);(root/'scripts/vendor').mkdir(parents=True)
            (root/'SKILL.md').write_text('---\nname: transcript-visual-recap\n---\n')
            (root/'references/prompt-template.md').write_text('## 引擎A\nHTML\n## STE 受控中文\n短句\n## 引擎B：am\n面板最多8个\n')
            for name in ('scripts/vendor/am.mjs','scripts/add_edit_layer.py'):(root/name).write_text('fixture')
            calls=[]
            def command(args,**kwargs):
                calls.append((args,kwargs))
                if 'render' in args:Path(args[args.index('-o')+1]).write_text('<html><head></head><body><main>内容</main></body></html>')
                return SimpleNamespace(returncode=0,stdout='',stderr='')
            method=report_style.method(root)
            self.assertNotIn('## 引擎A',method['guidance'])
            with patch('report_style.shutil.which',return_value='node'),patch('report_style.subprocess.run',side_effect=command):
                html=report_style.render(method,DRAFT+'\n```flow LR\n[核对] -> [验收]\n```',Path(tmp)/'report','回顾','<details><summary>依据</summary></details>')
            draft=calls[0][1]['input']
            self.assertIn('template: sheet',draft);self.assertIn('[核对] -> [验收]',draft)
            self.assertIn('[R1](#source-R1)',draft);self.assertIn('<details>',html)
            self.assertTrue(calls[1][0][1].endswith('add_edit_layer.py'))

if __name__=='__main__':unittest.main()
