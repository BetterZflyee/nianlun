"""工作台重建必须带运行时数据，否则页面会缩成空壳。

2026-11-07 06:25 我手动重建工作台时踩到的坑：

```python
n.build_home(cfg, out)        # ← 漏了第三个参数 config
```

`build_home(state, output, config=None)` 只有传了 `config` 才会去读
`runs/*/finish.json`、`postprocess.json`、`run_control.status` 这些运行时
数据。漏传时函数不报错，**页面照常生成，但从 1.9M 缩成 59K**——
项目卡、里程碑、报告链接全没了，而且看不出来是少了参数。

这类「参数可选但漏了会静默降级」的接口最危险：它不报错，只是少给你东西。
"""
import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n


class BuildHomeContractTests(unittest.TestCase):
    def test_config_parameter_exists_and_is_optional(self):
        """签名保持 (state, output, config=None)——兼容既有调用方。"""
        sig = inspect.signature(n.build_home)
        params = list(sig.parameters)
        self.assertEqual(params[:3], ['state', 'output', 'config'])
        self.assertIsNone(sig.parameters['config'].default)

    def test_runtime_data_only_loaded_with_config(self):
        """源码层面确认：运行时数据读取被 `if config` 守住。"""
        src = inspect.getsource(n.build_home)
        self.assertIn("if config and config.get('growth')", src)
        self.assertIn('finish.json', src, '要读最近一轮的收尾结果')
        self.assertIn('postprocess.json', src, '要读后处理的错误')

    def test_reports_state_surfaced(self):
        """报告失败必须在页面上可见，不能只翻磁盘才知道。"""
        src = inspect.getsource(n.build_home)
        self.assertIn('reports_state', src)


if __name__ == '__main__':
    unittest.main()
