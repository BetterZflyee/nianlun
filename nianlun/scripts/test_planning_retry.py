"""倒排校验失败要给模型改正机会。

实测问题（2026-11-07 04:31 那轮）：
    倒排报错是「节点「cross-site-metrics-comparison」的 depends_on 里有
    「k9CbkJLsIH」，但节点列表里没有这个 key。可用的 key：benefit-report…」
    ——详细到可以直接照着改，但模型**只被调用一次**，validate 抛错就整轮作废。

对比 flow.py 的决策链路（DECISION_RETRIES=3）：它有完整重试，把报错喂回模型。
倒排这边完全没有，于是「报错写得再好也没用」。

这和之前几轮的教训是同一条：**错误信息只有被消费掉才有价值。**
"""
import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


class PlanningRetryTests(unittest.TestCase):
    def source(self):
        return inspect.getsource(planning.run)

    def test_retry_loop_exists(self):
        self.assertIn('for attempt in range(PLAN_RETRIES)', self.source(),
                      '校验失败要重试，不能一次就放弃')

    def test_retry_count_is_at_least_two(self):
        """至少两次：一次原始 + 一次按报错修正。"""
        self.assertGreaterEqual(planning.PLAN_RETRIES, 2)
        self.assertLessEqual(planning.PLAN_RETRIES, 5, '别无限重试，耗时间')

    def test_error_is_fed_back_to_model(self):
        """报错必须原样带回 prompt——否则模型不知道改哪一条。"""
        src = self.source()
        self.assertIn('上一稿被核验拒绝，原因', src)
        self.assertIn('str(exc)', src, '要把真实的校验异常内容带上')

    def test_only_last_attempt_raises(self):
        """前几次失败要继续，最后一次才抛。"""
        src = self.source()
        self.assertIn('if attempt==PLAN_RETRIES-1:raise', src)

    def test_no_duplicate_validate_after_loop(self):
        """循环后又 validate 一次会让重试白做——必须只有循环内那一处。"""
        src = self.source()
        # 循环结束后紧跟的是保存，不应再出现独立的 validate(answer,target)
        after = src.split('PLAN_RETRIES-1:raise')[1].split('n.save(plan_path')[0]
        self.assertNotIn('validate(answer,target)', after,
                         '循环后不该再 validate 一次，否则重试无效')

    def test_retry_prompts_go_to_separate_dirs(self):
        """每次重试的 harness 目录要分开，否则事件日志互相覆盖。"""
        src = self.source()
        self.assertIn("harness-fix%d", src)

    def test_allows_dropping_unverifiable_nodes(self):
        """告诉模型「无法自证就去掉」，避免它编造 key 凑数。"""
        self.assertIn('从列表里去掉', self.source())


if __name__ == '__main__':
    unittest.main()
