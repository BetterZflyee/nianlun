"""证据略超预算时不该作废整轮。

## 事故（2026-11-12 20:00 起，连续 4 轮）

`finish.json` 里是：

```
本轮证据较多，已完整保存在运行目录。请由宿主分批处理当前轮次；未截断来源或执行写入。
```

但查 `evidence-trim.json`：

```
chars:   300042
budget:  300000
超出:        42 字符 (0.014%)
```

**只超 42 个字符**，而且裁剪已经用尽所有手段：
- 历史记录 377 → 最近 60 条
- 超长来源截断至 1200 字
- 记录明细全部折叠为计数
- 自适应减半 2 轮，最终来源 20 条

还是差 42 个字符 → **整轮作废**。之后 21:00/22:00/23:00 连着废。

## 为什么这是设计问题

`len(evidence) > BUDGET` 是个**零容差**判据。预算 30 万字符是
「别把上下文塞爆」的估算值，不是精确的物理上限——多 42 字符
（0.014%）根本不可能造成问题。

零容差判据在**数据量刚好卡线**时会连续误杀，而且用户看到的是
「证据较多」这种模糊说法，看不出只超了 42 字。

## 改法

- 超出 **2% 以内**（6000 字符）：放行，并在进度里说清超了多少
- 超出 2% 以上：才交回宿主分批，报错里带上具体超出字符数

## 顺带确认的真实情况

数据确实在增长，不是 bug：

| 轮次 | 来源数 | 结果 |
|---|---|---|
| 11-12 16:00 | 13 | complete |
| 11-12 21:00 | 42 | 超预算 42 字符 |
| 11-13 10:00 | 191 | 处理中 |

项目在持续记录，来源数增长是正常的。所以容差是必须的，不是妥协。
"""
import sys
import unittest
from pathlib import Path

FLOW = Path(__file__).resolve().parent / 'flow.py'


class BudgetToleranceTests(unittest.TestCase):
    def src(self):
        return FLOW.read_text(encoding='utf-8')

    def test_has_tolerance_ratio(self):
        """必须存在容差比例，不能是零容差。"""
        src = self.src()
        self.assertIn('EVIDENCE_BUDGET * 0.02', src)

    def test_error_message_includes_overage(self):
        """真的超太多时，报错要带上具体超出多少字符。"""
        src = self.src()
        idx = src.index('EVIDENCE_BUDGET * 0.02')
        block = src[idx: idx + 800]
        self.assertIn('超出预算', block)
        self.assertIn("str(over)", block)

    def test_no_bare_budget_compare_raises(self):
        """不能再有「一超就抛」的裸判断。"""
        src = self.src()
        self.assertNotIn(
            "if len(evidence)>EVIDENCE_BUDGET:\n                        raise n.Error(",
            src)

    def test_progress_reports_actual_overage(self):
        """放行时也要说清超了多少，不能静默。"""
        src = self.src()
        self.assertIn('在容忍范围内', src)


if __name__ == '__main__':
    unittest.main()
