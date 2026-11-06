"""模型的 JSON 输出有几种典型坏法，解析器都要能救。

模型经常把一整篇 markdown 当作字段值直接吐出来，里面既有未转义的裸换行（JSON
里是非法控制字符），也有大量未转义的双引号和代码块。内容是对的，只是编码不合规。
判失败会让整轮白跑，而报告生成一次要跑好几分钟。
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness

BODY = """---
template: sheet
title: 阶段回顾
---

Lead: 本期推进顺利。

## 项目总览

```visual
{"type":"gantt","title":"各场地推进状态","caption":"南昌、武汉已验收。"}
```

## 风险与待决

框招延后至 11 月 16 日。[R194]"""


class ParseToleranceTests(unittest.TestCase):
    def test_plain_json(self):
        raw = json.dumps({'answer': 'hello'}, ensure_ascii=False)
        self.assertEqual(harness.json_from_text(raw), {'answer': 'hello'})

    def test_json_inside_code_fence(self):
        raw = '```json\n' + json.dumps({'answer': 'hi'}, ensure_ascii=False) + '\n```'
        self.assertEqual(harness.json_from_text(raw), {'answer': 'hi'})

    def test_raw_newlines_inside_string_value(self):
        """裸换行是非法控制字符，必须能救回来。"""
        raw = '{\n  "answer": "%s"\n}' % BODY.replace('"', '\\"')
        value = harness.json_from_text(raw)
        self.assertIsNotNone(value)
        self.assertIn('阶段回顾', value['answer'])
        self.assertIn('\n', value['answer'], '换行应当被还原成真实换行')

    def test_unescaped_quotes_inside_value(self):
        """值里有未转义双引号（代码块里的 JSON）也不能整段判死。"""
        raw = '{\n  "answer": "%s"\n}' % BODY
        value = harness.json_from_text(raw, single_field=True)
        self.assertIsNotNone(value, '裸引号 + 裸换行的组合应能兜底')
        self.assertIn('gantt', value['answer'])
        self.assertIn('\n', value['answer'])

    def test_full_realistic_failure_shape(self):
        """复刻实际踩到的形状：代码块包裹 + 裸换行 + 内嵌 visual 代码块。"""
        raw = '```json\n' + '{\n  "answer": "%s"\n}' % BODY + '\n```'
        value = harness.json_from_text(raw, single_field=True)
        self.assertIsNotNone(value)
        self.assertEqual(list(value.keys()), ['answer'])
        self.assertIn('## 风险与待决', value['answer'])

    def test_single_string_schema_detection(self):
        self.assertTrue(harness.single_string_schema(harness.ANSWER_SCHEMA))
        multi = {'type': 'object', 'properties': {'a': {'type': 'string'}, 'b': {'type': 'string'}}}
        self.assertFalse(harness.single_string_schema(multi))
        self.assertFalse(harness.single_string_schema(None))
        self.assertFalse(harness.single_string_schema({'type': 'object', 'properties': {}}))

    def test_multi_field_body_is_not_salvaged(self):
        """多字段时不能启用按边界截取，否则会把别的字段吞进值里。

        合法 JSON 本身照常解析（这是对的）；关键是**坏掉**的多字段不能靠截取蒙混。
        """
        broken = '{\n  "answer": "a"\n  "other": "b"\n}'   # 缺逗号，非法
        self.assertIsNone(harness.json_from_text(broken, single_field=False))
        # 合法 JSON 正常解析
        self.assertEqual(harness.json_from_text('{"answer": "a", "other": "b"}'),
                         {'answer': 'a', 'other': 'b'})

    def test_salvage_ignores_nested_keys(self):
        """值内部的大量嵌套键不能被误判成多字段。"""
        body = '{"answer": "' + BODY + '"}'
        value = harness.salvage_single_field(body)
        self.assertIsNotNone(value)
        self.assertIn('gantt', value['answer'])

    def test_garbage_still_fails(self):
        self.assertIsNone(harness.json_from_text('完全不是 JSON'))
        self.assertIsNone(harness.json_from_text(''))


class ReportParseTests(unittest.TestCase):
    """报告实际走 deepseek_report.parse_answer，这条路径也必须容错。

    harness.json_from_text 修好了但报告走另一套解析，等于没修——12:00 那次失败
    就是这条路径判死的。
    """

    def setUp(self):
        import deepseek_report
        self.report = deepseek_report

    def schema(self):
        return harness.ANSWER_SCHEMA

    def test_clean_json_still_works(self):
        raw = json.dumps({'answer': '正文'}, ensure_ascii=False)
        self.assertEqual(self.report.parse_answer(raw, self.schema())['answer'], '正文')

    def test_raw_markdown_value_is_accepted(self):
        raw = '{\n  "answer": "%s"\n}' % BODY
        value = self.report.parse_answer(raw, self.schema())
        self.assertIn('## 风险与待决', value['answer'])
        self.assertIn('gantt', value['answer'])

    def test_fenced_raw_markdown_is_accepted(self):
        raw = '```json\n' + '{\n  "answer": "%s"\n}' % BODY + '\n```'
        value = self.report.parse_answer(raw, self.schema())
        self.assertIn('阶段回顾', value['answer'])

    def test_empty_answer_is_still_rejected(self):
        with self.assertRaises(harness.n.Error):
            self.report.parse_answer(json.dumps({'answer': '   '}), self.schema())

    def test_garbage_is_still_rejected(self):
        with self.assertRaises(harness.n.Error):
            self.report.parse_answer('完全不是 JSON', self.schema())


if __name__ == '__main__':
    unittest.main()
