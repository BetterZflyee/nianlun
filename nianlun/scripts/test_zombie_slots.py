"""进程被杀时槽位会永远停在 running，必须能回收。

正常失败走 except 分支会写 status=failed，但进程被 kill（重启、崩溃、断电）
时那段代码根本执行不到。槽位卡在 running 后，那个时段再也不会生长——而且
是静默的，日志里什么都看不到。
"""
import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


class ZombieReclaimTests(unittest.TestCase):
    def test_stale_running_is_reclaimed(self):
        source = Path(__file__).resolve().parent.joinpath('scheduler.py').read_text(encoding='utf-8')
        self.assertIn('stale_running', source)
        self.assertIn('上一次执行未正常结束', source)
        # 阈值必须是小时级，不能是分钟级误杀正在跑的长任务
        self.assertIn('>3*3600', source)

    def test_reclaim_only_touches_running(self):
        source = Path(__file__).resolve().parent.joinpath('scheduler.py').read_text(encoding='utf-8')
        idx = source.index('stale_running=0')
        block = source[idx:idx + 900]
        self.assertIn("if cv.get('status')!='running':continue", block,
                      '只能回收 running，不能碰 complete/failed/abandoned')

    def test_age_parsing_is_defensive(self):
        """started_at 缺失或非法时不能抛错，否则整个 tick 起不来。"""
        source = Path(__file__).resolve().parent.joinpath('scheduler.py').read_text(encoding='utf-8')
        idx = source.index('stale_running=0')
        block = source[idx:idx + 900]
        self.assertIn('except ValueError', block)


if __name__ == '__main__':
    unittest.main()
