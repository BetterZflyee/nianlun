"""成稿失败也要隔离，不能让一个项目拖掉整批。

实测（2026-11-07 05:12 那轮）：7 个活跃项目只产出 1 份报告。原因是
`report_brief.compose` 写在 try 之外：

```python
report_brief.compose(...)      # ← 不再 try 里
before_publish()
try:
    g.publish_report(...)      # ← 只有这里被隔离
except Exception: ...
```

第一个项目报「须以 Lead: 核心结论开头」，异常直接冲出循环，
**其余 6 个项目一份报告都没生成**。

讽刺的是代码上一行注释就写着「单个项目失败不能拖垮整批」——它只包住了
上传，没包住成稿。
"""
import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow


class ComposeIsolationTests(unittest.TestCase):
    def body(self):
        source = Path(flow.__file__).read_text(encoding='utf-8')
        idx = source.index('def report_projects(')
        rest = source[idx + 1:]
        nxt = rest.find('\ndef ')
        return source[idx: idx + 1 + nxt] if nxt > 0 else rest

    def test_compose_is_wrapped_in_try(self):
        """compose 必须在 try 里。"""
        body = self.body()
        idx = body.index('report_brief.compose(')
        # 往上看 200 字符，应该能看到 try:
        before = body[max(0, idx - 300):idx]
        self.assertIn('try:', before, 'compose 前必须有 try，否则失败会冲出循环')

    def test_compose_failure_is_recorded(self):
        """失败要记进 failures 而不是静默跳过。"""
        body = self.body()
        idx = body.index('report_brief.compose(')
        after = body[idx: idx + 700]
        self.assertIn('failures.append', after, '成稿失败要记进 failures')
        self.assertIn('continue', after, '要跳到下一个项目，不是中断循环')

    def test_single_project_still_raises(self):
        """只有一个项目时直接抛，方便调用方看到错误类型。"""
        body = self.body()
        idx = body.index('report_brief.compose(')
        after = body[idx: idx + 700]
        self.assertIn('len(project_ids)==1', after)
        self.assertIn('raise', after)


if __name__ == '__main__':
    unittest.main()
