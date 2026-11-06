"""模型输出解析的容错边界。

真实事故：报告连续两次失败在「输出未符合结构要求」。

模型的回答是完整的 Markdown（4860 字符，带 gantt 可视化），但它没套外层
JSON，而报告链要求 `{"answer": "..."}`。原来是直接判失败、整轮作废——
正文其实完好。

反面风险同样真实：报告正文里嵌着 ```visual {…}``` 图配置，如果只是
「随便找一段 JSON」，交上去的会是一张图而不是报告。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness


SCHEMA = harness.ANSWER_SCHEMA


class JsonFromTextTests(unittest.TestCase):
    def parse(self, text):
        r = harness.json_from_text(text, single_field=harness.single_string_schema(SCHEMA))
        return (r or {}).get('answer')

    def test_standard_json(self):
        self.assertEqual(self.parse('{"answer":"正文"}'), '正文')

    def test_code_fence(self):
        self.assertEqual(self.parse('```json\n{"answer":"正文"}\n```'), '正文')

    def test_leading_and_trailing_prose(self):
        """前后有引导语时，要取中段含 answer 的 JSON，不能把引导语也吞进去。"""
        got = self.parse('这是结果：\n{"answer":"正文"}\n以上。')
        self.assertEqual(got, '正文')

    def test_bare_quotes_repaired(self):
        self.assertEqual(self.parse('{"answer":"他说"你好"了"}'), '他说"你好"了')

    def test_plain_markdown_falls_back_to_whole_text(self):
        """模型直接返回正文（没套壳）：整段就是 answer，不该判失败。"""
        got = self.parse('# 标题\n\n正文段落。')
        self.assertEqual(got, '# 标题\n\n正文段落。')

    def test_embedded_visual_json_is_not_mistaken_for_answer(self):
        """正文里的 ```visual {…}``` 不能被当成答案——那会把一张图交上去。"""
        text = 'Lead: x\n\n```visual\n{"type":"gantt","rows":[]}\n```\n\n## 风险\n内容'
        got = self.parse(text)
        self.assertEqual(got, text, '应返回整段正文，而不是那段图配置')
        self.assertIn('## 风险', got)

    def test_single_string_schema_returns_field_name(self):
        """返回字段名而不是 True，兜底时才写得出正确的 key。"""
        self.assertEqual(harness.single_string_schema(SCHEMA), 'answer')
        self.assertFalse(harness.single_string_schema(
            {'properties': {'a': {'type': 'string'}, 'b': {'type': 'string'}}}))
        self.assertFalse(harness.single_string_schema({'properties': {'a': {'type': 'integer'}}}))

    def test_multi_field_schema_has_no_whole_text_fallback(self):
        """多字段 schema 下不能把整段文本当某个字段——会把别的字段吞进来。"""
        r = harness.json_from_text('随便一段话', single_field=False)
        self.assertIsNone(r)


if __name__ == '__main__':
    unittest.main()
