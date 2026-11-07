"""引用读取的并发度要有依据，且有测试守着。

## 为什么是这个数

`relations()` 每篇要发两次调用（`get_links` + `get_backlinks`），
6 篇一批。实测 12 篇一批在不同并发下的耗时：

| 并行度 | 耗时 | 成功率 |
|---|---|---|
| 2 | 14.6s | 12/12 |
| 4 | 8.6s | 12/12 |
| **6** | **7.2s** | 12/12 |
| 8 | 7.0s | 12/12 |

**6 是拐点**——8 只再快 0.2 秒，收益递减；取 6 兼顾速度与对记忆引擎的压力。

改前是 2，6 篇一批要 7.2 秒，506 篇要 10.2 分钟。改后 3.3 秒，预计 4.6 分钟。

## 为什么不能省掉 backlinks

抽查 60 篇：**有出边 9 篇，只有入边 18 篇**。省掉入边会丢掉 2/3 的可见连接
（项目记忆正是「只有入边」的典型，它在星图上曾是孤点）。

**所以正确做法是优化而不是省略。**
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
SRC = Path(__file__).resolve().parent / 'explorer.py'


class RelationsConcurrencyTests(unittest.TestCase):
    def src(self):
        return SRC.read_text(encoding='utf-8')

    def test_worker_count_is_six(self):
        self.assertIn('ThreadPoolExecutor(max_workers=6)', self.src())

    def test_reads_both_directions(self):
        """出边和入边都要读——只读一边会让另一侧看起来是孤点。"""
        src = self.src()
        self.assertIn("'get_links'", src)
        self.assertIn("'get_backlinks'", src)

    def test_backlinks_failure_is_tolerated(self):
        """入边是增强信息，读失败不能拖垮主流程。

        定位要准：`index('get_backlinks')` 会先命中注释里的说明文字，
        那样截出来的窗口可能不含真正的 try/except 块。改成从**调用点**开始截，
        窗口也放宽到 1600 字符（整段入边处理逻辑都在里面）。
        """
        src = self.src()
        idx = src.index("'get_backlinks'")
        nearby = src[idx: idx + 1600]
        self.assertIn('except Exception', nearby,
                      '入边读取必须在 try 里兜住，否则 GBrain 抖动会让整页无引用')

    def test_dedup_uses_slug(self):
        """出边记 to_、入边记 from_，去重必须按对端 slug 统一判。"""
        self.assertIn('back_seen', self.src())


if __name__ == '__main__':
    unittest.main()
