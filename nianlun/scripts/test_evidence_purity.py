"""裁剪证据不能污染原 bundle。

trim_evidence 会原地改写 tables/sources 来压缩提示词体积。若 prompt_evidence
返回的是浅拷贝，sources 等列表仍与原 bundle 共享引用，裁剪就会把原证据一起
改掉——plan 里记下的 evidence_hash 变成被裁剪后的哈希，apply 再从磁盘加载
干净证据重新校验，必然不等，报「计划内容变更，请重新生成」。

这个 bug 只在证据大到需要裁剪时才出现，所以容易潜伏。
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow
import nianlun as n


def big_bundle(sources=400, records=300, body='正文' * 200):
    return {
        'format': 'nianlun-evidence-v1', 'run_id': 'r1',
        'since': '2026-10-01T00:00:00+08:00', 'until': '2026-10-06T00:00:00+08:00',
        'binding': 'abc', 'identity': {'user_id': 'U1'},
        'tables': {
            'projects': [{'id': 'P1', 'title': '项目甲', 'status': '进行中'}],
            'milestones': [], 'sites': [],
            'records': [{'id': f'R{i}', 'title': '记录', 'project_ids': ['P1'],
                         'date': f'2026-09-{i % 28 + 1:02d}'} for i in range(records)],
            'fields': {r: {} for r in n.ROLES},
        },
        'todos': [], 'todo_links': {},
        'sources': [{'id': f's{i}', 'name': '来源', 'text': body,
                     'time': f'2026-10-0{i % 9 + 1}T10:00:00+08:00', 'channels': ['direct']}
                    for i in range(sources)],
    }


class EvidencePurityTests(unittest.TestCase):
    def test_long_source_body_is_not_truncated_in_the_original(self):
        """截断逻辑原地改写 source dict，浅拷贝时会把原证据一起改掉。"""
        long_body = '很长的正文' * 400        # 1600 字，会被截到 1200
        bundle = big_bundle(sources=3, records=5, body=long_body)
        before_len = len(bundle['sources'][0]['text'])
        before_hash = n.digest(bundle)
        flow.trim_evidence(flow.prompt_evidence(bundle), 2000)
        self.assertEqual(len(bundle['sources'][0]['text']), before_len, '原证据正文被截断了')
        self.assertNotIn('text_truncated', bundle['sources'][0], '原证据被打了截断标记')
        self.assertEqual(n.digest(bundle), before_hash)

    def test_trimming_does_not_mutate_the_source_bundle(self):
        bundle = big_bundle(body='很长的正文' * 400)
        before = n.digest(bundle)
        flow.trim_evidence(flow.prompt_evidence(bundle), 20000)
        self.assertEqual(n.digest(bundle), before, '裁剪后原 bundle 被改动了')

    def test_sources_and_records_keep_their_original_size(self):
        bundle = big_bundle(sources=400, records=300)
        flow.trim_evidence(flow.prompt_evidence(bundle), 20000)
        self.assertEqual(len(bundle['sources']), 400)
        self.assertEqual(len(bundle['tables']['records']), 300)

    def test_evidence_hash_survives_a_trim_cycle(self):
        """这正是「计划内容变更」的根因：hash 在裁剪后必须不变。"""
        bundle = big_bundle()
        before = n.digest(bundle)
        flow.trim_evidence(flow.prompt_evidence(bundle), 20000)
        self.assertEqual(n.digest(bundle), before)

    def test_trimming_still_actually_shrinks_the_prompt(self):
        """纯度修复不能把裁剪本身弄失效。"""
        bundle = big_bundle()
        full = json.dumps(flow.prompt_evidence(bundle), ensure_ascii=False)
        tight, notes = flow.trim_evidence(flow.prompt_evidence(bundle), 20000)
        self.assertLess(len(json.dumps(tight, ensure_ascii=False)), len(full))
        self.assertTrue(notes)


class AdaptiveTrimTests(unittest.TestCase):
    """四级裁剪后仍超预算时要继续减半，而不是整轮放弃。

    放弃意味着这一小时的变化全部丢失，而且水位不前进，下一轮面对同样体量，
    会形成死锁。
    """

    def dense_bundle(self, sources=300):
        """每条来源 1400 字、渠道各异：四级裁剪后仍可能超预算，逼出自适应减半。"""
        return {
            'format': 'x', 'run_id': 'r', 'since': 's', 'until': 'u', 'binding': 'b',
            'identity': {}, 'todos': [], 'todo_links': {},
            'tables': {'projects': [{'id': 'P1', 'title': '甲'}], 'milestones': [], 'sites': [],
                       'records': [], 'fields': {r: {} for r in n.ROLES}},
            'sources': [{'id': f's{i}', 'text': '正' * 1400,
                         'time': f'2026-10-01T10:00:{i % 60:02d}+08:00',
                         'channels': [f'ch{i}']} for i in range(sources)],
        }

    def test_extreme_volume_still_fits_the_budget(self):
        import json
        doc, notes = flow.trim_evidence(flow.prompt_evidence(self.dense_bundle()), 100000)
        size = len(json.dumps(doc, ensure_ascii=False))
        self.assertLessEqual(size, 100000, f'裁剪后仍超预算：{size}')
        self.assertTrue(any('自适应减半' in x for x in notes), notes)

    def test_adaptive_trim_records_what_it_dropped(self):
        doc, _notes = flow.trim_evidence(flow.prompt_evidence(self.dense_bundle()), 100000)
        history = doc.get('source_history') or {}
        self.assertIn('adaptive_rounds', history)
        self.assertGreater(history['adaptive_from'], history['adaptive_kept'])

    def test_it_stops_before_starving_the_prompt(self):
        """不能把来源削到零：模型没有材料就什么都判断不了。"""
        doc, _notes = flow.trim_evidence(flow.prompt_evidence(self.dense_bundle(600)), 3000)
        self.assertGreaterEqual(len(doc.get('sources') or []), 20)


if __name__ == '__main__':
    unittest.main()
