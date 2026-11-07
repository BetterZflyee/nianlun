"""星图布局切换必须容错：非法值不能让控件空白、画面失效。

## 怎么发现的

手工验证「平面星盘」时，我给 `<select>` 赋了一个猜的值 `flat`：

```js
layout.value = 'flat';
layout.dispatchEvent(new Event('change'));
```

结果 `layout.value` 变成 **空字符串**——`flat` 不是合法 option。
再查源码，`setMode(value)` 是**直接赋值**的：

```js
setMode(value) {
  mode = value;                    // ← 不校验
  positions = seedLayout(nodes, mode);
  ...
}
```

而 `seedLayout` 只在 `mode === 'disc'` 时走平面分支，其余全走 galaxy。
所以非法值的后果是：**画面按 galaxy 渲染，但下拉框显示空白**——用户看到
一个空控件，以为坏了。

## 真实合法值

从 option 里读出来是 `galaxy`（立体星图）和 `disc`（平面星盘），
**不是** `flat`。

## 改法（两层）

1. `constellation.setMode()`：非法值退回 `galaxy`
2. `memory-view` 的恢复逻辑：非法值同时纠正 `<select>` 的值

只改一层不够——`setMode` 兜住渲染，UI 还是空白的。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
PORTAL = Path(__file__).resolve().parent.parent / 'assets' / 'portal'


class GraphLayoutModeTests(unittest.TestCase):
    def constellation(self):
        return (PORTAL / 'constellation.js').read_text(encoding='utf-8')

    def view(self):
        return (PORTAL / 'memory-view.js').read_text(encoding='utf-8')

    def model(self):
        return (PORTAL / 'galaxy-model.js').read_text(encoding='utf-8')

    def test_real_values_are_galaxy_and_disc(self):
        """合法值是 galaxy / disc，不是 flat。"""
        v = self.view()
        self.assertIn('["galaxy", "立体星图"]', v)
        self.assertIn('["disc", "平面星盘"]', v)
        self.assertNotIn('"flat"', v)

    def test_setmode_rejects_unknown(self):
        src = self.constellation()
        idx = src.index('setMode(value)')
        body = src[idx: idx + 700]
        self.assertIn('"disc"', body)
        self.assertIn('"galaxy"', body)
        self.assertIn(':', body, '应该有条件表达式做兜底')

    def test_view_normalizes_select_value(self):
        """UI 也要纠正，否则 setMode 兜住了渲染、下拉还是空白。"""
        v = self.view()
        idx = v.index('const wanted = layout.value')
        body = v[idx: idx + 500]
        self.assertIn('layout.value = safe', body)

    def test_seed_layout_falls_back_to_galaxy(self):
        """未知 mode 走 galaxy 分支，不能产出无坐标。"""
        m = self.model()
        self.assertIn('mode === "disc"', m)


if __name__ == '__main__':
    unittest.main()
