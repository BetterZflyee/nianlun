"""里程碑风险必须真的呈现出来，且口径要覆盖真实状态值。

## 产品问题（2026-11-07 实测）

200 条里程碑里 **35 条已过期仍未达成**（最久 69 天，状态还是「已延期」），
但在界面上完全看不到——`studio.js` 只对待办做了 overdue 高亮，**待办页里
连「里程碑」这个概念都没有**。用户每天打开产品，看不出哪个项目在拖。

## 修的时候挖出一个更早的错误

`growthMilestoneOpen` 原写：

```js
return !["已完成", "已取消", "已关闭"].includes(row.status);
```

但真实数据里**一个都没有这些值**：

```
待核 80 / 未开始 66 / 进行中 18 / 待核对 15 / 已延期 12 / 已达成 8 / 空 1
```

于是这个函数**永远返回 true**——8 条「已达成」被当成未完成算进风险，界面上
一度显示 **43 条**（正确值是 35 条）。

**真实完成态是「已达成」。** 这是我第三次栽在「自己猜的枚举值可能不存在」
上（前两次：星图布局 `flat` 应为 `disc`、图表 kind 别名）。
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
PORTAL = Path(__file__).resolve().parent.parent / 'assets' / 'portal'


class MilestoneRiskTests(unittest.TestCase):
    def exp(self):
        return (PORTAL / 'experience.js').read_text(encoding='utf-8')

    def studio(self):
        return (PORTAL / 'studio.js').read_text(encoding='utf-8')

    def test_done_statuses_include_real_value(self):
        """完成态必须含「已达成」——真实数据里只有这个值表示完成。"""
        src = self.exp()
        idx = src.index('MILESTONE_DONE')
        block = src[idx: idx + 200]
        self.assertIn('已达成', block)

    def test_same_rule_in_both_files(self):
        """两处判断口径必须一致，否则卡片和面板会给出不同的数。"""
        exp = self.exp()
        studio = self.studio()
        for value in ('已达成', '已取消', '已关闭'):
            self.assertIn(value, exp, f'experience.js 缺 {value}')
            self.assertIn(value, studio, f'studio.js 缺 {value}')

    def test_overdue_needs_valid_date(self):
        """没日期或日期不合法不算过期——不能冤枉。"""
        src = self.exp()
        idx = src.index('function growthMilestoneOverdue')
        block = src[idx: idx + 700]
        self.assertIn(r'\d{4}-\d{2}-\d{2}', block)
        self.assertIn('return 0', block)

    def test_card_shows_overdue_badge(self):
        self.assertIn('project-card-overdue', self.exp())

    def test_todo_page_has_risk_panel(self):
        self.assertIn('milestoneRiskPanel', self.studio())
        self.assertIn('milestone-risk', self.studio())

    def test_panel_says_data_not_modified(self):
        """必须说清「只提醒、不改数据」，否则用户会以为产品动了业务数据。"""
        src = self.studio()
        idx = src.index('milestoneRiskPanel')
        block = src[idx: idx + 2500]
        self.assertIn('数据本身不会被自动修改', block)

    def test_risk_panel_has_css(self):
        css = (PORTAL / 'studio.css').read_text(encoding='utf-8')
        for cls in ('.milestone-risk', '.milestone-risk-row', '.milestone-risk-days'):
            self.assertIn(cls, css, f'{cls} 缺样式')


if __name__ == '__main__':
    unittest.main()
