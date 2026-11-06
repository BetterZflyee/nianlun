"""倒排写入的崩溃安全性。

倒排会真的往钉钉表里写里程碑。如果中途崩溃，不能留下「写了一半、
不知道哪些成功了」的状态。

我一开始的判断是「没有回滚机制，第 5 个失败前 4 个就脏了」——查下来发现
设计是对的，用的是「先记账再执行」模式：

1. 写之前把 `in_flight` + cells + record_id 落盘
2. 创建成功后**立即**把 record_id 落盘（不等整批结束）
3. 回读校验 cells 是否一致，不一致就报错
4. 重试时按 record_id + cells 找回上次结果，识别出「其实已写成功」
5. 匹配到多条时拒绝重复提交（`len(matches)!=1` raise）

这些行为一旦被改坏，最坏情况是**重复创建里程碑**。所以锁住。
"""
import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import planning


class TableStepSafetyTests(unittest.TestCase):
    def source(self):
        return inspect.getsource(planning.Workbench.table_step)

    def test_records_in_flight_before_writing(self):
        """先落盘再执行——崩溃后才知道自己做过什么。"""
        src = self.source()
        save_pos = src.find("n.save(path,receipt)")
        call_pos = src.find("gw.call([")
        self.assertGreater(save_pos, 0, '要先保存 receipt')
        self.assertLess(save_pos, call_pos, '保存必须发生在写表之前')

    def test_saves_record_id_immediately_after_create(self):
        """创建成功就立刻落盘 record_id，不等整个循环结束。"""
        src = self.source()
        self.assertIn("step['record_id'] = rid; n.save(path,receipt)", src,
                      'record_id 要立即落盘，否则崩溃后无法找回')

    def test_verifies_after_write(self):
        src = self.source()
        self.assertIn('写入后回读不一致', src, '写后必须回读校验')

    def test_refuses_on_ambiguous_match(self):
        """匹配到多条时不能瞎写——宁可报错让人核验。"""
        src = self.source()
        self.assertIn('len(matches)!=1', src,
                      '多条匹配时必须拒绝，避免重复创建')
        self.assertIn('未重复提交', src)

    def test_retry_recognizes_previous_success(self):
        """重试要认出「上次其实写成功了」，而不是再写一遍。"""
        src = self.source()
        self.assertIn("step.get('status')=='verified'", src,
                      '已验证的步骤要直接返回，不重复写入')


class RunWriteOrderTests(unittest.TestCase):
    def test_writes_one_node_at_a_time_with_fresh_read(self):
        """每写一个节点前重新读表——不能拿批前的快照做判断。"""
        src = inspect.getsource(planning.run)
        self.assertIn("fresh=n.fetch(config,gw.table())", src)
        self.assertIn('deadline(current_project,fresh)', src,
                      '比较必须用 fresh，不能用循环外快照')

    def test_preserves_human_edits(self):
        src = inspect.getsource(planning.run)
        self.assertIn('人工修改已保留', src, '人工改过的节点不能被覆盖')
        self.assertIn('里程碑在倒排期间被修改', src)


if __name__ == '__main__':
    unittest.main()
