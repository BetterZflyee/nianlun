"""生长记录写入时必须带项目 wiki 链接，否则 3D 星图没有连线。

## 背景

工作台「项目记忆」页长期显示 `505 篇 · 0 条引用`，3D 星图 505 个点、0 条线。

根因：`growth.py` 写入的正文里那个「## 相关记录」章节只写「见上」，
**没有任何 `[[wiki链接]]`**——而 GBrain 的 markdown 边正是靠 `[[...]]`
建立的。

## 实测验证（2026-11-07 09:19）

用真实 evidence 生成链接后走一次 `capture`：

```
capture 退出码: 0    status: created_or_updated
gbrain call get_links → 出边数: 18
  → projects/nianlun-a43db55a38aec99b04a20a1b
  → projects/nianlun-921709c497dc5e6163976ea5
  ...
```

**18 条边全部建立**，且目标全部真实存在（0 个缺失）。探针页已 delete 清理。

## 关键约束

目标 slug 必须与 `memory.refresh()` 写入项目记忆时用的算法一致：

```python
slug = 'projects/nianlun-' + n.digest({'base': base_id, 'project': project_id})[:24]
```

不一致就会指向不存在的页面，产生悬空边。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n
import growth

CONFIG = {'base_id': 'dxXB52LJqnb9qONkCZbKOBkw8qjMp697'}


def evidence_with(projects):
    return {'tables': {'projects': projects}}


class RelatedLinksTests(unittest.TestCase):
    def test_generates_one_link_per_project(self):
        out = growth._related_links(CONFIG, evidence_with([
            {'id': 'a1', 'title': '项目甲'},
            {'id': 'b2', 'title': '项目乙'},
        ]))
        self.assertIn('[[projects/nianlun-', out)
        self.assertIn('项目甲', out)
        self.assertIn('项目乙', out)
        self.assertEqual(out.count('[['), 2)

    def test_slug_matches_memory_refresh_algorithm(self):
        """链接目标必须和 memory.refresh 写入项目记忆的 slug 算法一致。"""
        pid = 'a1'
        expected = 'projects/nianlun-' + n.digest({'base': CONFIG['base_id'], 'project': pid})[:24]
        out = growth._related_links(CONFIG, evidence_with([{'id': pid, 'title': '甲'}]))
        self.assertIn(expected, out)

    def test_no_projects_returns_empty(self):
        """没有项目时不要硬造链接。"""
        self.assertEqual(growth._related_links(CONFIG, evidence_with([])), '')
        self.assertEqual(growth._related_links(CONFIG, {}), '')

    def test_skips_rows_missing_id_or_title(self):
        out = growth._related_links(CONFIG, evidence_with([
            {'id': '', 'title': '无ID'},
            {'id': 'c3', 'title': ''},
            {'id': 'd4', 'title': '正常'},
        ]))
        self.assertEqual(out.count('[['), 1)
        self.assertIn('正常', out)

    def test_title_with_brackets_is_sanitized(self):
        """标题里的方括号会破坏 [[...]] 语法，必须清掉。"""
        out = growth._related_links(CONFIG, evidence_with([{'id': 'x', 'title': '项目[草案]'}]) )
        self.assertEqual(out.count('[['), 1)
        self.assertNotIn('[草案]', out)
        self.assertIn('项目草案', out)

    def test_malformed_evidence_does_not_crash(self):
        """evidence 结构异常时安静返回，不能让整轮生长失败。"""
        self.assertEqual(growth._related_links(CONFIG, None), '')
        self.assertEqual(growth._related_links(CONFIG, {'tables': None}), '')

    def test_content_includes_related_links(self):
        """写入正文的相关记录段必须调用 _related_links。

        断言要抓得住真实缺陷：不能只查「函数名出现过」——函数定义了但没被
        拼进 content 的情形会漏过。这里直接定位 content 语句本身。
        """
        src = Path(growth.__file__).read_text(encoding='utf-8')
        start = src.index("content='---")
        end = src.index("\n", src.index("见上。", start))
        statement = src[start:end]
        self.assertIn('_related_links(config,b)', statement,
                      'content 必须拼入 _related_links(config,b)，否则写入的记忆没有 [[链接]]')


if __name__ == '__main__':
    unittest.main()
