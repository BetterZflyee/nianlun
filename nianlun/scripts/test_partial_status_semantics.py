"""partial 是「部分成功」，不是「失败」——两者的界面文案必须不同。

## 为什么要有这个测试

最近三轮生长跑完，`finish.json` 都是 `status: partial`。第一次看到会以为
出问题了，实际查下来是外部数据源没采全：

```
minutes        partial    count=60     DWS 未返回有效结果
direct         partial    count=2580   会话目录分页未完整
mail           partial    count=8      7 封中 1 封正文失败
```

2580 条消息、60 条听记都采到了，整轮照常分析、照常写表。**说它「失败」是
错的。**

## 界面文案

`home.js` 的成长面板：

```js
g.status === 'complete' ? '本轮已完成'
: g.status === 'partial' ? '部分来源待补采'
: g.status
```

而且 partial 时会额外给一句提示：
「有环节未完成，点右侧「查看这轮生长」看具体是哪步；下一轮会自动补」

这个设计是对的——**状态必须配「下一步」**，否则用户只知道不对、不知道
该怎么办。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
ROOT = Path(__file__).resolve().parent.parent.parent
HOME = ROOT / 'nianlun' / 'assets' / 'home.js'
GROWTH = Path(__file__).resolve().parent / 'growth.py'


class PartialStatusTests(unittest.TestCase):
    def test_partial_is_not_failed(self):
        """源码里 partial 和 complete 是并列的两种状态，不是错误。"""
        src = GROWTH.read_text(encoding='utf-8')
        self.assertIn("'partial' if partial else 'complete'", src)

    def test_ui_has_distinct_copy(self):
        """界面文案必须区分「已完成」和「部分待补采」。"""
        home = HOME.read_text(encoding='utf-8')
        self.assertIn('本轮已完成', home)
        self.assertIn('部分来源待补采', home)

    def test_partial_shows_next_step(self):
        """partial 必须告诉用户下一步做什么。"""
        home = HOME.read_text(encoding='utf-8')
        idx = home.index('部分来源待补采')
        nearby = home[max(0, idx - 200): idx + 900]
        self.assertIn('下一轮会自动补', nearby)

    def test_manual_documents_the_distinction(self):
        """手册要写清 partial vs failed，否则用户只能猜。"""
        doc = ROOT / 'docs' / 'TROUBLESHOOTING.md'
        text = doc.read_text(encoding='utf-8')
        self.assertIn('部分来源待补采', text)
        self.assertIn('`partial` 是「部分成功」', text)

    def test_manual_gives_inspection_command(self):
        """手册要给出「怎么看具体缺什么」的命令。"""
        doc = (ROOT / 'docs' / 'TROUBLESHOOTING.md').read_text(encoding='utf-8')
        self.assertIn("c.get('status') != 'complete'", doc)


if __name__ == '__main__':
    unittest.main()
