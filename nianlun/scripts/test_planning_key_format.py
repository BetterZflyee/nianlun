"""节点编号要有格式约束，并且报错要说清「它是什么」。

实测（2026-11-07 05:00 那轮）：倒排重试 3 次都失败，因为模型把**记录 ID**
（`xz0RA3Xnuf`）当成了节点 key：

    节点「dafangche-logic-validation」的 depends_on 里有「xz0RA3Xnuf」，
    但节点列表里没有这个 key

报错已经点了名，但模型不知道该写什么——因为它不知道 key 是「自己起的英文
标识」而不是「表里已有的 ID」。

三处一起改：
1. SCHEMA 给 key 加 pattern（软约束，模型看得见）
2. prompt 明确说明 key 不是记录 ID
3. validate 把格式错和重复错分开报，并给出示例
"""
import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


TARGET = date(2026, 12, 31)


def nodes(*items):
    return {'nodes': list(items), 'rationale': 'r'}


def node(key, offset=0, deps=()):
    return {'key': key, 'title': key, 'description': 'd',
            'days_before_deadline': offset, 'depends_on': list(deps)}


class KeyFormatTests(unittest.TestCase):
    def test_record_id_rejected_with_clear_reason(self):
        """记录 ID 当 key 要被拒，且报错说明它不是 ID 字段。"""
        with self.assertRaises(Exception) as ctx:
            planning.validate(nodes(node('xz0RA3Xnuf')), TARGET)
        msg = str(ctx.exception)
        self.assertIn('格式不对', msg)
        self.assertIn('不是表格里的记录 ID', msg, '要点明它的性质，否则模型还会再犯')

    def test_uppercase_rejected(self):
        with self.assertRaises(Exception):
            planning.validate(nodes(node('BadKey')), TARGET)

    def test_valid_key_accepted(self):
        got = planning.validate(nodes(node('sop-and-promotion-plan')), TARGET)
        self.assertEqual(len(got), 1)

    def test_short_key_accepted(self):
        self.assertEqual(len(planning.validate(nodes(node('a1')), TARGET)), 1)

    def test_duplicate_key_has_its_own_message(self):
        """重复和格式错分两种报错——共用一句会让模型改错方向。"""
        with self.assertRaises(Exception) as ctx:
            planning.validate(nodes(node('a1', 5), node('a1', 0)), TARGET)
        msg = str(ctx.exception)
        self.assertIn('重复', msg)
        self.assertNotIn('格式不对', msg)


class KeySchemaAndPromptTests(unittest.TestCase):
    def test_schema_has_pattern(self):
        key_schema = planning.SCHEMA['properties']['nodes']['items']['properties']['key']
        self.assertIn('pattern', key_schema, 'SCHEMA 要给模型看得见的约束')

    def test_prompt_explains_key_is_not_record_id(self):
        import inspect
        src = inspect.getsource(planning.run)
        self.assertIn('不是表格里的记录 ID', src)
        self.assertIn('depends_on 只能填本稿 nodes 里出现过的 key', src)


if __name__ == '__main__':
    unittest.main()
