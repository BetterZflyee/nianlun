"""宿主上下文溢出的自适应降级。

预算不能靠猜模型窗口：不同宿主差很多，猜大了就撞 CONTEXT_WINDOW_EXCEEDED，
整轮白跑（历史里真实发生过）。正确做法是撞到就折半，直到模型吃得下。
"""
import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault('NIANLUN_RETRY_BACKOFF', '0')
sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow
import nianlun as n


class OverflowDetectionTests(unittest.TestCase):
    def test_host_specific_overflow_wording_is_recognised(self):
        for text in ('dsh: CONTEXT_WINDOW_EXCEEDED: 400',
                     'Context length exceeded for model',
                     'context_length_exceeded',
                     'maximum context length is 65536 tokens',
                     'too many tokens',
                     'input is too long',
                     'InternalError.Algo.InvalidParam'):
            self.assertTrue(flow.is_context_overflow(n.Error(text)), text)

    def test_unrelated_errors_are_not_mistaken_for_overflow(self):
        """误判会把「表结构缺失」当成上下文问题，然后无意义地反复缩证据。"""
        for text in ('当前表没有 description 字段',
                     'DWS 未返回有效结果',
                     '网络连接失败',
                     '动作必须引用本轮来源 ID 与逐字摘录'):
            self.assertFalse(flow.is_context_overflow(n.Error(text)), text)


class BudgetTests(unittest.TestCase):
    def test_floor_is_low_enough_to_leave_an_escape_hatch(self):
        """下限必须小于起点，否则一次折半就到底，等于没有重试空间。"""
        self.assertLess(flow.EVIDENCE_FLOOR, flow.EVIDENCE_BUDGET)

    def test_halving_reaches_the_floor_without_underflow(self):
        budget = flow.EVIDENCE_BUDGET
        steps = 0
        while budget > flow.EVIDENCE_FLOOR:
            budget = max(flow.EVIDENCE_FLOOR, budget // 2)
            steps += 1
            self.assertGreaterEqual(budget, flow.EVIDENCE_FLOOR)
        self.assertGreater(steps, 0)
        self.assertEqual(budget, flow.EVIDENCE_FLOOR)

    def test_trim_accepts_a_smaller_budget_and_shrinks(self):
        bundle = {'run_id': 'r', 'tables': {
            'projects': [{'id': 'P1', 'title': '项目甲'}], 'milestones': [], 'sites': [],
            'records': [{'id': f'R{i}', 'title': '记录', 'project_ids': ['P1']} for i in range(300)],
            'fields': {r: {} for r in n.ROLES}}, 'todos': [], 'sources': []}
        full, _ = flow.trim_evidence(flow.prompt_evidence(bundle), 10_000_000)
        tight, notes = flow.trim_evidence(flow.prompt_evidence(bundle), 8_000)
        import json
        self.assertLess(len(json.dumps(tight, ensure_ascii=False)),
                        len(json.dumps(full, ensure_ascii=False)))
        self.assertTrue(notes)


class PromptAssemblyTests(unittest.TestCase):
    def test_evidence_can_be_swapped_without_rebuilding_instructions(self):
        """降级时只换证据切片，系统指令与记忆必须原样保留。"""
        base = '指令段'
        memories = [{'query': '关键词', 'content': '记忆', 'matched': True}]
        big = flow._build_prompt(base, '很大' * 100, memories)
        small = flow._build_prompt(base, '小', memories)
        self.assertIn('指令段', big)
        self.assertIn('指令段', small)
        self.assertIn('关键词', small)
        self.assertLess(len(small), len(big))


if __name__ == '__main__':
    unittest.main()
