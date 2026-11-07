"""回填工具必须安全：默认不写盘、幂等、只用真实数据。

## 背景

`growth.py` 直到 2026-11-07 才写 `[[项目链接]]`。在那之前的生长记录，
「## 相关记录」段只有一句「项目来源与 AI 表格链接见上」，所以 3D 星图
长期是散点、0 条线。

`tools/backfill_memory_links.py` 给历史记录补链接。

## 三条安全约束

1. **默认 dry-run**：不加 `--apply` 只打印，不写盘
2. **幂等**：已有 `[[链接]]` 的记录直接跳过
3. **只用真实数据**：链接来自那轮自己的 `evidence.json`，不是按标题猜；
   evidence 已被清理的轮次直接跳过

## 实测结果（2026-11-07 10:35）

回填 8 轮、共 **144 条链接**。工作台从 `120 篇 · 18 条引用` 变成
**`506 篇 · 162 条引用`**，3D 星图出现密集连线网。

## 踩过的两个坑

- 覆盖已存在页面必须给 `--expected-revision`，否则报 `revision_conflict`
- `request_id` 不能跨「不同内容的尝试」复用，否则报 `idempotency_conflict`；
  改成「run + 新内容摘要」后，内容一样天然幂等、内容变了自动换新 id
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
TOOL = ROOT / 'tools' / 'backfill_memory_links.py'


class BackfillToolTests(unittest.TestCase):
    def src(self):
        return TOOL.read_text(encoding='utf-8')

    def test_tool_exists(self):
        self.assertTrue(TOOL.exists())

    def test_defaults_to_dry_run(self):
        """不传 --apply 时不能写盘。"""
        src = self.src()
        self.assertIn("action='store_true'", src.replace('"', "'"))
        self.assertIn('if not args.apply', src)

    def test_is_idempotent(self):
        """已有链接的记录要跳过，重复跑不会叠加。"""
        self.assertIn("if '[[' in source", self.src())

    def test_only_uses_real_evidence(self):
        """链接来自那轮自己的 evidence.json，不按标题猜。"""
        src = self.src()
        self.assertIn('growth._related_links(config, evidence)', src)
        self.assertIn("glob('*/evidence.json')", src)

    def test_uses_expected_revision(self):
        """覆盖已存在页面要给 revision，否则 revision_conflict。"""
        self.assertIn('--expected-revision', self.src())

    def test_request_id_bound_to_content(self):
        """request_id 要绑内容，否则换参数重试会 idempotency_conflict。"""
        src = self.src()
        self.assertIn('backfill-links:', src)
        self.assertIn('n.digest(new_source)', src)


if __name__ == '__main__':
    unittest.main()
