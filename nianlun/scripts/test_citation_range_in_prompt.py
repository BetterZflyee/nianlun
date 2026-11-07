"""报告 prompt 必须告诉模型「有哪些编号可用」。

## 实测的失败

2026-11-07 14:00 那轮，两份报告被退回：

```
具身智能-机械臂: 报告正文仍需修订，未上传：第 1 张图格式有误：
图形包含不存在的依据编号；存在材料中没有的引用编号：M21,M25,M29,M30,M38,
R144,R162,R195,R197,R212,R217,...
```

查那个项目的真实材料：

```
milestones: 0 条
records:    0 条
sites:      0 条
projects:   1 条
```

**它只有 P1 一条材料**，模型却引用了 M21、R144 ——这些编号根本不存在。

## 根因

prompt 第 6 条只说「编号必须真实」，**没告诉模型总共有多少**。模型只能按
R1、R2、R3 一路往上写，写到不存在的就废掉整份报告。

## 改法

`_citation_range(evidence)` 从实际材料算出每类编号的上界，写进 prompt：

```
可用编号共这几组（超出即不存在）：项目 P1–P18、记录 R1–R1765、
里程碑 M1–M197、场地 S1–S14。
```

最小场景（只有一个项目）：`项目 P1` —— 模型就知道不能再引 M/R。

## 修的时候踩的两个坑

1. 把 `return (` 改成 `_body = (` 后**忘了在函数末尾加 `return _body`**，
   `prompt()` 返回 None
2. `'+_range+'` 被单引号包住，成了普通字符串而不是变量拼接

两处都是「改字符串拼接」时的典型手误，靠打印实际输出才发现。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_brief


class CitationRangeTests(unittest.TestCase):
    def test_lists_actual_upper_bounds(self):
        ev = ([{'key': f'P{i}'} for i in range(1, 4)]
              + [{'key': f'R{i}'} for i in range(1, 21)]
              + [{'key': f'M{i}'} for i in range(1, 9)])
        out = report_brief._citation_range(ev)
        self.assertIn('P1–P3', out)
        self.assertIn('R1–R20', out)
        self.assertIn('M1–M8', out)

    def test_single_item_has_no_dash(self):
        """只有一条时写 P1，不写 P1–P1。"""
        out = report_brief._citation_range([{'key': 'P1'}])
        self.assertIn('项目 P1', out)
        self.assertNotIn('P1–P1', out)

    def test_empty_evidence_says_so(self):
        out = report_brief._citation_range([])
        self.assertIn('没有可引用编号', out)

    def test_prompt_contains_range(self):
        """范围必须真的拼进 prompt，不能只是函数能跑。"""
        facts = {'projects': [{'title': '甲', 'code': 'A1'}],
                 'records': [{'title': 'r1'}], 'milestones': [], 'sites': []}
        src = report_brief.sources(facts, [])
        out = report_brief.prompt({'title': '甲'}, '2026-11-01', '2026-11-07',
                                  src, {'guidance': 'x'})
        self.assertIsInstance(out, str)
        self.assertIn('可用编号共这几组', out)
        self.assertIn('P1', out)

    def test_prompt_returns_string_not_none(self):
        """改字符串拼接时容易漏 return，这里守住。"""
        out = report_brief.prompt({'title': '甲'}, 'a', 'b', [{'key': 'P1'}], {})
        self.assertIsInstance(out, str)
        self.assertGreater(len(out), 1000)


if __name__ == '__main__':
    unittest.main()
