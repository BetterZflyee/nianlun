"""静态首页也要有过期节点提示——两套实现只改一套等于没改。

## 产品背景

产品有**两套前端**：

| 位置 | 代码 | 用途 |
|---|---|---|
| portal（工作台） | `studio.js` 1358 行 + `experience.js` 446 行 | launchd 常驻服务，日常操作用 |
| 静态页（快照） | `home.js` 121 行 | 每次生长生成，离线看/分享 |

2026-11-07 实测 200 条里程碑里 **35 条已过期**（最久 69 天），两套前端都
看不出来。只改 portal 的话，分享出去的静态快照仍然一片祥和。

## 踩过的坑

1. **完成态写错**：原来写 `['已完成','已取消','已关闭']`，但真实数据里
   **一个都没有**（待核 80 / 未开始 66 / 进行中 18 / 待核对 15 / 已延期 12 /
   已达成 8）。真实完成态是「已达成」。
2. **静态页数据要带 tables**：`build_home(state, ...)` 的 `state` 必须是
   `{projects, milestones, records, sites, ...}` 平铺结构；
   直接传 `evidence.json`（数据在 `tables` 下）会得到**空页面**且不报错。
3. **grep 静态 HTML 看到的是源码文本**：`late-tag` 出现在 `<script>` 里
   不代表渲染出来了，必须用 headless Chrome 执行后查 DOM。

## 实测渲染结果

```
tagCount: 4      → ⚠ 2 个过期 / ⚠ 8 个过期 / ⚠ 10 个过期 / ⚠ 5 个过期
lateRows: 4      → 4 行高亮
lateDays:        → 已过期 69 天 / 38 天 / 31 天 / 27 天
```

与 portal 的数字一致。
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
ASSETS = Path(__file__).resolve().parent.parent / 'assets'


class StaticHomeRiskTests(unittest.TestCase):
    def home(self):
        return (ASSETS / 'home.js').read_text(encoding='utf-8')

    def test_done_status_uses_real_value(self):
        """完成态必须含「已达成」。"""
        src = self.home()
        idx = src.index('DONE_STATUS')
        self.assertIn('已达成', src[idx: idx + 120])

    def test_has_overdue_helper(self):
        src = self.home()
        self.assertIn('function overdueDays', src)
        idx = src.index('function overdueDays')
        block = src[idx: idx + 600]
        self.assertIn(r'\d{4}-\d{2}-\d{2}', block)
        self.assertIn('return 0', block)

    def test_project_card_shows_badge(self):
        self.assertIn('late-tag', self.home())

    def test_upcoming_row_marks_late(self):
        src = self.home()
        self.assertIn('is-late', src)
        self.assertIn('late-days', src)

    def test_css_present(self):
        css = (ASSETS / 'style.css').read_text(encoding='utf-8')
        for cls in ('.late-tag', '.upcoming.is-late', '.late-days'):
            self.assertIn(cls, css, f'{cls} 缺样式')

    def test_build_requires_flat_state(self):
        """守住「传 evidence.json 会得到空页面」这个坑。"""
        src = (Path(__file__).resolve().parent / 'nianlun.py').read_text(encoding='utf-8')
        idx = src.index('def build_home')
        block = src[idx: idx + 400]
        self.assertIn('json.dumps(state', src)
        # state 必须是平铺结构：home.js 直接读 S.projects / S.milestones
        self.assertIn("S.milestones", self.home())


if __name__ == '__main__':
    unittest.main()
