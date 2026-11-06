"""就绪检查脚本本身要能跑。

这是改完 flow/planning/report 后的第一道自检。它坏掉不会影响产品，
但会让人失去一个便宜可靠的验证手段——然后退回去靠等定时任务失败。
"""
import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / 'readiness.py'


class ReadinessScriptTests(unittest.TestCase):
    def test_script_exists(self):
        self.assertTrue(SCRIPT.exists(), 'readiness.py 不见了')

    def test_script_is_syntactically_valid(self):
        result = subprocess.run([sys.executable, '-m', 'py_compile', str(SCRIPT)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr[:300])

    def test_checks_all_pipeline_stages(self):
        """要覆盖采集到调度的每一环，漏一环就等于给了虚假的安心。"""
        src = SCRIPT.read_text(encoding='utf-8')
        for stage in ('采集', '记忆', '推理', '倒排', '报告', '工作台', '调度'):
            self.assertIn(stage, src, f'缺少 {stage} 环节的检查')

    def test_reports_failure_with_nonzero_exit(self):
        """失败必须反映在退出码上，否则脚本在自动化里等于没跑。"""
        src = SCRIPT.read_text(encoding='utf-8')
        self.assertIn('sys.exit(0 if not fail else 1)', src)


if __name__ == '__main__':
    unittest.main()
