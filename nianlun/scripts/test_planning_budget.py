"""倒排提示词必须控制在预算内。

实际数据：车辆靠离卡一个项目 370 条记录，facts 就有 22 万字符；加上 32 个
里程碑全字段（含长链接和 raw_cells）和 7.7 万字记忆，单次 prompt 达 36 万字符
≈ 18 万 tokens——多数宿主直接报 CONTEXT_WINDOW_EXCEEDED，倒排从来没成功过。

flow.trim_evidence 只认 tables 结构，planning 用的是扁平 facts，所以这里另写。
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


def big_facts(records=300, milestones=30):
    rows = []
    for i in range(records):
        rows.append({
            'id': f'r{i}', 'title': f'记录{i}', 'date': f'2026-10-{(i % 28) + 1:02d}',
            'status': '开放', 'project_ids': ['p1'],
            # 真实数据里每条记录都带这两个字段，是体积大头
            'table_url': 'https://alidocs.dingtalk.com/i/nodes/' + 'x' * 120,
            'raw_cells': {'k' * 40: 'v' * 60},
        })
    ms = [{'id': f'm{i}', 'title': f'节点{i}', 'date': '2026-12-25', 'status': '未开始',
           'notes': 'n' * 200, 'description': 'd' * 200, 'project_ids': ['p1']}
          for i in range(milestones)]
    return {'projects': [{'id': 'p1', 'title': 'P'}], 'milestones': ms,
            'sites': [], 'records': rows}


class PlanFactsBudgetTests(unittest.TestCase):
    def test_large_facts_get_trimmed_into_budget(self):
        facts = big_facts()
        before = len(json.dumps(facts, ensure_ascii=False))
        trimmed, notes = planning.trim_facts(facts)
        after = len(json.dumps(trimmed, ensure_ascii=False))
        self.assertGreater(before, planning.PLAN_FACTS_BUDGET)
        self.assertLessEqual(after, planning.PLAN_FACTS_BUDGET,
                             f'裁剪后仍有 {after} 字符，超出预算')
        self.assertTrue(notes, '裁剪后要记录做了什么，便于排查')

    def test_redundant_link_fields_removed(self):
        """table_url 是几百字符的长链接，对倒排零价值。"""
        facts = big_facts(records=5, milestones=3)
        trimmed, _ = planning.trim_facts(facts)
        for row in trimmed['records']:
            self.assertNotIn('table_url', row)
            self.assertNotIn('raw_cells', row)

    def test_milestones_survive_trimming(self):
        """里程碑是倒排骨架，不能为了省体积丢掉。"""
        facts = big_facts(records=500, milestones=25)
        trimmed, _ = planning.trim_facts(facts)
        self.assertTrue(trimmed['milestones'], '里程碑被裁掉了')
        self.assertLessEqual(len(trimmed['milestones']), 25)

    def test_records_keep_recent_ones(self):
        facts = big_facts(records=200, milestones=2)
        trimmed, _ = planning.trim_facts(facts)
        if trimmed.get('record_history'):
            self.assertLess(len(trimmed['records']), 200)
            self.assertGreater(len(trimmed['records']), 0, '不该把记录全清光')

    def test_small_facts_untouched(self):
        facts = {'projects': [{'id': 'p1'}], 'milestones': [], 'sites': [], 'records': []}
        trimmed, notes = planning.trim_facts(json.loads(json.dumps(facts)))
        self.assertEqual(notes, [], '小规模数据不该触发裁剪')


class MemoryTrimTests(unittest.TestCase):
    """记忆裁剪要按页面均摊，不能砍前 N 字。

    实测：车辆靠离卡的连续记忆 7.7 万字符，projects 页面单个占 6 万。
    直接 `body[:12000]` 留下的全是 table_id、钉钉 userId 这些原始 JSON，
    会议纪要、概念说明、人物关系全被砍掉——模型拿到的是噪音。
    """

    def history(self):
        return {
            'text': 'x' * 50000,
            'pages': [
                {'slug': 'projects/big', 'text': 'P' * 40000},
                {'slug': 'meetings/周会', 'text': 'M' * 8000},
                {'slug': 'concepts/规范', 'text': 'C' * 3000},
                {'slug': 'people/某人', 'text': 'R' * 1000},
            ],
        }

    def test_every_page_gets_a_slice(self):
        trimmed = planning.trim_memory(self.history(), budget=12000)
        text = trimmed['text']
        for marker, name in (('M', 'meetings'), ('C', 'concepts'), ('R', 'people')):
            self.assertIn(marker, text, f'{name} 页面的内容被整段砍掉了')

    def test_stays_within_budget(self):
        trimmed = planning.trim_memory(self.history(), budget=12000)
        self.assertLessEqual(len(trimmed['text']), 12000)

    def test_records_whole_original_length(self):
        trimmed = planning.trim_memory(self.history(), budget=12000)
        self.assertEqual(trimmed['text_truncated']['original_chars'], 50000)
        self.assertEqual(trimmed['text_truncated']['strategy'], '按页面均摊')

    def test_small_memory_untouched(self):
        history = {'text': 'short', 'pages': [{'slug': 'a', 'text': 'b'}]}
        trimmed = planning.trim_memory(history, budget=12000)
        self.assertEqual(trimmed['text'], 'short')
        self.assertNotIn('text_truncated', trimmed)

    def test_empty_pages_falls_back_to_prefix(self):
        history = {'text': 'y' * 20000, 'pages': []}
        trimmed = planning.trim_memory(history, budget=12000)
        self.assertLessEqual(len(trimmed['text']), 12000)


if __name__ == '__main__':
    unittest.main()
