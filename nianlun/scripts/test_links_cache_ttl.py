"""引用缓存的有效期必须长于一次全量加载，否则滚回上面就重读。

## 算出来的数

506 篇按 6 篇/批、每批约 3.3 秒：

```
全量加载 ≈ 278 秒
```

原来 TTL 是 **300 秒**——只比 278 多一点。**加载到末尾时，最早那几批已经
开始过期**，用户滚回上面看会触发重读。

## 实测

- 服务端是**单例**（`if not hasattr(self, 'memory_explorer')`），
  所以缓存活在服务端，**刷新页面不会丢**（只要没到期、没重启）。
- 改 TTL 前：刷新后要从头读，40 秒才 36 篇。
- 改 TTL 到 900 秒后：刷新后 **25 秒就到 180 篇**，引用 397 条。

## 为什么是 900 而不是更长

15 分钟足够覆盖「打开页面 → 浏览 → 切走再回来」的常见路径，又不会让
记忆更新后长时间看不到。太长了用户改了记忆却看不到变化。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
SRC = Path(__file__).resolve().parent / 'explorer.py'

# 实测基准（2026-11-07 11:20）
PAGES = 506
BATCH = 6
SECONDS_PER_BATCH = 3.3
TTL = 900


class LinksCacheTtlTests(unittest.TestCase):
    def test_ttl_covers_full_load(self):
        """TTL 必须明显长于一次全量加载，不能卡在边缘。"""
        full_load = PAGES / BATCH * SECONDS_PER_BATCH
        self.assertGreater(TTL, full_load * 2,
                           f'TTL {TTL}s 相对全量加载 {full_load:.0f}s 余量不足')

    def test_source_uses_900(self):
        src = SRC.read_text(encoding='utf-8')
        self.assertIn('<900', src)
        self.assertNotIn('<300', src, '旧的 300 秒 TTL 会卡在边缘')

    def test_cache_keyed_by_page(self):
        """缓存按页面 key 存，不同页面互不覆盖。"""
        src = SRC.read_text(encoding='utf-8')
        self.assertIn('links_cache[key]', src)

    def test_scope_change_clears_cache(self):
        """切换记忆空间要清缓存，否则会看到上一个空间的数据。"""
        src = SRC.read_text(encoding='utf-8')
        idx = src.index('links_cache.clear()')
        nearby = src[max(0, idx - 200): idx + 100]
        self.assertIn('scope', nearby)


if __name__ == '__main__':
    unittest.main()
