"""日期格式报错要给出实际值和正确写法，否则模型只能反复猜。

## 起因

2026-11-07 一天里，有两个项目因为「第 1 张图格式有误：marks 须为 YYYY-MM-DD
日期」被退回。原来的报错只说了**要求**，没说**模型实际写了什么**、也没给
**正确示例**，模型只能照原样再猜一次。

改成：

```
marks 值是「11/07」，须为 YYYY-MM-DD 格式的完整日期（如 2026-11-07）。
不要用 11/07、11月7日、2026-11 这类写法。
```

## 报错设计的三段式

一个好的校验报错要说清三件事：

1. **哪个字段**（`marks`）
2. **实际值是什么**（`「11/07」`）
3. **应该写成什么样**（`2026-11-07`，并列出常见错法）

只说第 1 和第 3 是不够的——模型不知道自己写的是第 2 种情况里的哪一种。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_blocks


def gantt_with_marks(marks):
    return {'type': 'gantt', 'title': '进度', 'caption': '本期推进',
            'start': '2026-11-01', 'end': '2026-11-30',
            'rows': [{'label': '任务A', 'state': 'active', 'segments': [
                {'label': '开发', 'from': '2026-11-01', 'to': '2026-11-10',
                 'marks': marks}]}]}


class MarksDateErrorTests(unittest.TestCase):
    def test_bad_format_error_shows_actual_value(self):
        with self.assertRaises(ValueError) as ctx:
            report_blocks.validate(gantt_with_marks(['11/07']))
        msg = str(ctx.exception)
        self.assertIn('11/07', msg, '必须回显模型实际写的值')
        self.assertIn('YYYY-MM-DD', msg)

    def test_bad_format_error_gives_example(self):
        with self.assertRaises(ValueError) as ctx:
            report_blocks.validate(gantt_with_marks(['11/07']))
        msg = str(ctx.exception)
        self.assertRegex(msg, r'\d{4}-\d{2}-\d{2}', '要给出正确格式的示例')

    def test_bad_format_lists_common_mistakes(self):
        """列出常见错法，模型能对号入座。"""
        with self.assertRaises(ValueError) as ctx:
            report_blocks.validate(gantt_with_marks(['11月7日']))
        msg = str(ctx.exception)
        self.assertIn('11月7日', msg)
        self.assertIn('不要用', msg)

    def test_good_format_passes(self):
        try:
            report_blocks.validate(gantt_with_marks(['2026-11-07']))
        except ValueError as exc:
            self.fail(f'合法日期不该报错：{exc}')


if __name__ == '__main__':
    unittest.main()
