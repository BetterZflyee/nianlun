"""配置损坏时要给人话，不要给 traceback。

tick.err.log 里躺着两份历史崩溃：

    File "scheduler.py", line 45, in tick
        state=Path(config['growth']['state_dir'])
    KeyError: 'growth'

看到 KeyError 完全不知道该怎么办——是配置坏了？是没完成接入？还是装错了？
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n
import scheduler


class ConfigGuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write_config(self, payload):
        path = Path(self.tmp.name) / 'config.json'
        n.save(path, payload)
        return path

    def test_missing_growth_section_gives_readable_error(self):
        config = self.write_config({'base_id': 'b', 'tables': {}})
        with self.assertRaises(n.Error) as ctx:
            scheduler.tick(str(config))
        message = str(ctx.exception)
        self.assertIn('growth', message)
        self.assertIn('接入', message, '错误里要说明下一步该做什么')
        self.assertNotIsInstance(ctx.exception, KeyError)

    def test_growth_not_a_dict_also_guarded(self):
        config = self.write_config({'growth': 'broken'})
        with self.assertRaises(n.Error) as ctx:
            scheduler.tick(str(config))
        self.assertIn('growth', str(ctx.exception))


if __name__ == '__main__':
    unittest.main()
