"""graph 是唯一能出 Three.js 立体视图的主图类型，提示词必须说清。

## 发现的偏差

用户明确要求「Three.js 这个我一定要用」，但统计真实报告：

```
报告总数: 94   含 3D: 20   占比: 21%
```

查原因：3D 只在 HTML 含 `<figure class="am-flow">` 时注入，而这个 class
**只有 graph 类型会输出**（report_blocks.py 第 798 行）。

再看提示词——gantt 有整整三行说明（「优先用 gantt」「必须呈现完整历程」
「时间轴起点取最早记录」），graph 只有半句「有明确依赖时用」。
**模型当然全选甘特。** 最新一轮 7 份报告：6 份 gantt、1 份 status、0 份 graph。

所以问题不在 3D 代码，在**引导方向**。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_brief


class GraphGuidanceTests(unittest.TestCase):
    def prompt(self):
        # 找 SCHEMA 里承载图形契约的那段提示词
        src = Path(report_brief.__file__).read_text(encoding='utf-8')
        return src

    def test_graph_is_named_as_3d_capable(self):
        """提示词必须明确 graph 支持 Three.js 立体视图。"""
        src = self.prompt()
        idx = src.index('Three.js')
        nearby = src[max(0, idx - 400): idx + 400]
        self.assertIn('graph', nearby, 'Three.js 要和 graph 出现在同一段说明里')

    def test_graph_guidance_not_buried_in_parentheses(self):
        """关键说明不能只塞在括号里。"""
        src = self.prompt()
        self.assertIn('优先用 graph', src)

    def test_warns_against_fabricating_links(self):
        """鼓励用 graph 时要防「硬造依赖」。"""
        src = self.prompt()
        self.assertIn('不要为了凑图硬造不存在的依赖', src)

    def test_am_flow_only_emitted_for_graph(self):
        """3D 的触发点必须只在 graph 分支——这是能力边界，不是巧合。"""
        blocks = (Path(__file__).resolve().parent / 'report_blocks.py').read_text(encoding='utf-8')
        self.assertEqual(blocks.count('am-flow rv-static-graph'), 1)
        idx = blocks.index('am-flow rv-static-graph')
        branch = blocks[max(0, idx - 300): idx]
        self.assertIn("kind == 'graph'", branch, 'am-flow 只能在 graph 分支输出')


if __name__ == '__main__':
    unittest.main()
