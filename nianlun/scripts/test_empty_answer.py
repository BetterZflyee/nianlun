"""模型没返回正文时不能静默产出空稿。

ANSWER_SCHEMA 只要求一个 answer 字段，但模型偶尔就是不返回它。原实现直接
answer.get('answer') 拿到 None，然后整篇报告以空稿崩掉——白跑一次完整生成。
"""
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n
import report_brief as brief

FACTS = {'projects': [{'id': 'p', 'title': '项目甲', 'status': '进行中', 'table_url': 'https://example.test/t'}],
         'records': [], 'milestones': [], 'sites': []}
VISUAL = '```visual\n{"type":"status","title":"状态","caption":"对照","items":[{"label":"甲","detail":"完成","state":"done","source":"[P1]"}]}\n```'
GOOD = 'Lead: 本期有进展。\n\n## A 变化\n项目推进。[P1]\n\n' + VISUAL + '\n\n## B 风险与待决\n验收待确认。[P1]'


class EmptyAnswerTests(unittest.TestCase):
    def compose(self, tmp, side_effect):
        evidence = brief.sources(FACTS, [])
        with patch('harness.report_reason', side_effect=side_effect) as model:
            value = brief.compose(FACTS['projects'][0], '2026-10-01', '2026-10-23',
                                  evidence, {}, Path(tmp), {}, lambda _: None, lambda: False)
        return value, model

    def test_empty_answer_is_retried_then_succeeds(self):
        with tempfile.TemporaryDirectory() as tmp:
            value, model = self.compose(tmp, [{'answer': ''}, {'answer': GOOD}])
            self.assertEqual(value, GOOD)
            self.assertEqual(model.call_count, 2)

    def test_missing_answer_key_is_retried(self):
        """模型完全不返回 answer 时也要重试，不能直接拿 None 去写稿。"""
        with tempfile.TemporaryDirectory() as tmp:
            value, model = self.compose(tmp, [{}, {'answer': GOOD}])
            self.assertEqual(value, GOOD)
            self.assertEqual(model.call_count, 2)

    def test_two_empty_answers_fail_loudly_without_writing_a_draft(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(n.Error, '没有返回正文'):
                self.compose(tmp, [{'answer': ''}, {'answer': '   '}])
            # 不能留下空稿冒充已生成的正文
            draft = Path(tmp) / 'composition/draft-0000.md'
            self.assertFalse(draft.exists() and not draft.read_text(encoding='utf-8').strip())


if __name__ == '__main__':
    unittest.main()
