"""写后回读要重试，但**写入本身绝不重发**。

## 飞哥遇到的报错（2026-11-09）

```
DWS aitable +record-update：DWS 未返回有效结果，请检查连接与执行记录；
写入结果未知，请核验原结果，未自动重发
```

## 排查（三条岔路）

1. **以为命令名错了** —— `+record-update` 确实存在（是批量分片版），参数也对。排除。
2. **以为 `--yes` 不被接受** —— 实测被接受。排除。
3. **以为是「值没变」导致失败** —— 改成真的不同值，returncode 0、status success。排除。

## 真因：写后回读读不到

`table_write` 写完立刻查一次：

```python
d = gw.call(['aitable','+record-query', ..., '--record-ids', record_id])
rows = d.get('records', [])
if len(rows) != 1 or ...: raise n.Error('表格写后验证不一致')
```

实测**刚写完立刻查，偶尔返回 0 行，再查就有**（钉钉侧可读性延迟）。

原来读一次对不上就抛「写入结果未知 / 请核验原结果」——用户看到「未知」
往往直接重做，**反而可能产生重复记录**。

## 改法

回读重试 4 次（间隔 1.5s / 3s / 4.5s）。**重试的只是读，不是写**。

这条边界是年轮的铁律：**写操作绝不重试**（会重复入库），
但「读一次没读到」和「写失败」是两件完全不同的事，不能混为一谈。

## 顺带改的报错文案

区分两种情况：
- `cause` 含 `read-back` → 「该记录很可能已写入，只是回读没确认到。请先核对，
  **不要直接重试**，否则可能产生重复记录」
- 其它写入失败 → 「请先在表格里核验原结果，确认未生效后再重做；不要直接重试」
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


class ReadbackRetryTests(unittest.TestCase):
    def growth(self):
        return (Path(__file__).resolve().parent / 'growth.py').read_text(encoding='utf-8')

    def block(self):
        src = self.growth()
        idx = src.index('def table_write(')
        # 取到下一个顶层 def 为止，别用固定字符数：函数变长会把断言用的文案
        # 截到窗口外，测试报「找不到」而代码其实是对的（2026-11-16 踩过）。
        end = src.find('\ndef ', idx + 1)
        return src[idx: end if end > 0 else idx + 8000]

    def test_readback_retries(self):
        block = self.block()
        self.assertIn('for attempt in range(4)', block,
                      '写后回读必须重试，否则偶发延迟会被误报成写入失败')

    def test_write_is_not_retried(self):
        """写入只能在循环外发一次——写重试会产生重复记录。"""
        block = self.block()
        # 写调用的位置必须在回读循环之前
        write_at = block.index("'+record-update'")
        loop_at = block.index('for attempt in range(4)')
        self.assertLess(write_at, loop_at, '写调用不能在重试循环里')

    def test_error_says_do_not_retry_blindly(self):
        """必须劝住用户「别直接重试」，两个文件各说一部分。

        ⚠️ 2026-11-16 这条断言随需求变过：原来 table_write 回读失败会 `raise`
        一句「请先在表格里核对」，现在不再抛错，改为返回 verify_pending +
        verify_reason 让整轮继续（否则 create_milestone 回读失败会把整轮掐死：
        apply 抛 → _finish 不执行 → 水位不推、seen 不写）。

        **变的是「怎么告知」，没变的是「必须告知」**：用户仍然要知道
        「数据很可能已经写进去了，别重做」，否则照样会产生重复记录。
        所以这里改为守 verify_reason 里的两句话。
        """
        growth = self.block()
        self.assertIn('到表格核对', growth, '必须告诉用户去哪里核对')
        self.assertIn('不会重复写入', growth, '必须告诉用户系统核验不会重复写')
        self.assertIn('不要直接重做', growth, '必须劝住用户别直接重做')
        transport = (Path(__file__).resolve().parent / 'dws_transport.py').read_text(encoding='utf-8')
        self.assertIn('不要直接重试', transport)

    def test_readback_failure_does_not_abort_the_round(self):
        """回读失败不能抛错——写已发生，抛错会让水位不推、seen 不写。

        2026-11-16：create_milestone 走 table_write，它在生长主路径上。
        这里一旦 raise，同一轮里 create_record 放行、create_milestone 掐死，
        两条路径行为不一致，比两个都不改更糟。
        """
        block = self.block()
        self.assertNotIn('表格写后验证不一致', block,
                         '回读失败不应再抛「写后验证不一致」')
        self.assertIn('verify_pending', block, '应返回 verify_pending 让调用方继续')

    def test_transport_distinguishes_readback(self):
        """运输层要能识别 read-back 失败并给出不同指引。"""
        src = (Path(__file__).resolve().parent / 'dws_transport.py').read_text(encoding='utf-8')
        self.assertIn('read-back', src)
        self.assertIn('很可能已写入', src)


if __name__ == '__main__':
    unittest.main()
