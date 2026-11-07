"""星图交互必须真的生效，而且要能被测试抓住。

## 走过的弯路

我验证「两跳引用」时，一开始是这样判断的：

```js
const labels = document.querySelectorAll('[class*=label]').length;
// 一跳 43，两跳 43 → 以为没生效
```

**指标用错了。** 标签数是按别的逻辑显示的，跟跳数无关。

正确的观测点是左下角那句：

```
聚焦 19 篇有据可查的记忆      ← 一跳
聚焦 27 篇有据可查的记忆      ← 两跳
```

**+8 篇**，连线也明显更密。

## 三个控件的真实语义

| 控件 | 类型 | 值 | 作用 |
|---|---|---|---|
| 布局 | `<select>` | `galaxy` / `disc` | 立体 / 平面 |
| 层数 | `<select>` | `1` / `2` | 一跳 / 两跳 |
| 回全景 | 按钮 | — | 取消选中，回全局视角 |
| 开启漫游 | 按钮 | — | 相机自动绕行 |

## 关于「没选中时切层数没反应」

这是**设计如此**，不是 bug：`focus = neighborhood(selected, edges, focusDepth)`
——`selected` 为空时 focus 是空集，层数自然无意义。层数是「选中某个节点后
看它几跳邻居」的参数。

但这也意味着：**用户不选中就切换，看不到任何变化，会以为控件坏了**。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
PORTAL = Path(__file__).resolve().parent.parent / 'assets' / 'portal'


class GraphInteractionTests(unittest.TestCase):
    def constellation(self):
        return (PORTAL / 'constellation.js').read_text(encoding='utf-8')

    def view(self):
        return (PORTAL / 'memory-view.js').read_text(encoding='utf-8')

    def test_neighborhood_supports_two_hops(self):
        """neighborhood 必须真的支持 2 跳。"""
        model = (PORTAL / 'galaxy-model.js').read_text(encoding='utf-8')
        idx = model.index('export function neighborhood')
        body = model[idx: idx + 900]
        self.assertIn('Math.min(2, depth)', body)
        self.assertIn('frontier', body)

    def test_focus_depth_feeds_neighborhood(self):
        """层数要传到 neighborhood，不能只在 UI 里改个数字。"""
        c = self.constellation()
        idx = c.index('focusDepth = value')
        self.assertIn('updateAppearance', c[idx: idx + 200])

    def test_selected_node_drives_focus(self):
        """focus 以 selected 为起点——没选中时层数无意义（设计如此）。"""
        c = self.constellation()
        self.assertIn('neighborhood(selected, edges, focusDepth)', c)

    def test_focus_count_is_reported(self):
        """界面要报出聚焦了多少篇——这是唯一能看出跳数生效的观测点。"""
        v = self.view()
        self.assertIn('聚焦', v)
        self.assertIn('篇有据可查的记忆', v)

    def test_two_layout_options(self):
        v = self.view()
        self.assertIn('["galaxy", "立体星图"]', v)
        self.assertIn('["disc", "平面星盘"]', v)


if __name__ == '__main__':
    unittest.main()
