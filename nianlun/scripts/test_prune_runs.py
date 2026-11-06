"""状态目录清理：证据不能无限积累，但也不能删掉要恢复的任务。

实测 178 个 run 已占 179MB（evidence.json 占 133MB）。清理必须保守：
active 指针上的 run 永远保留，未完成但很新的 run 也不能删。
"""
import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n

TZ = timezone(timedelta(hours=8))


def make_run(runs: Path, when: datetime, tag: str, done: bool):
    d = runs / (when.strftime('%Y%m%d-%H%M%S') + '-' + tag)
    d.mkdir(parents=True)
    (d / 'evidence.json').write_text('x' * 500, encoding='utf-8')
    if done:
        (d / 'finish.json').write_text('{}', encoding='utf-8')
    return d


class PruneTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.runs = self.root / 'runs'
        self.runs.mkdir()
        self.now = datetime.now(TZ)

    def prune(self, **settings):
        base = {'keep_run_days': 7, 'keep_completed_runs': 20}
        base.update(settings)
        return g.prune_runs(self.root, base)

    def test_old_completed_runs_beyond_keep_are_removed(self):
        for i in range(5):
            make_run(self.runs, self.now - timedelta(days=30 + i), f'old{i}', done=True)
        result = self.prune(keep_completed_runs=2)
        self.assertEqual(len(list(self.runs.iterdir())), 2)
        self.assertEqual(result['removed'], 3)
        self.assertGreater(result['freed'], 0)

    def test_recent_completed_runs_are_kept(self):
        for i in range(3):
            make_run(self.runs, self.now - timedelta(hours=i), f'new{i}', done=True)
        self.prune(keep_completed_runs=20)
        self.assertEqual(len(list(self.runs.iterdir())), 3)

    def test_old_unfinished_runs_are_removed(self):
        for i in range(4):
            make_run(self.runs, self.now - timedelta(days=10 + i), f'stale{i}', done=False)
        self.prune(keep_run_days=7)
        self.assertEqual(len(list(self.runs.iterdir())), 0)

    def test_new_unfinished_runs_are_kept(self):
        """未完成但很新的 run 可能还要恢复，不能删。"""
        keep = make_run(self.runs, self.now - timedelta(hours=1), 'pending', done=False)
        self.prune(keep_run_days=7)
        self.assertTrue(keep.exists())

    def test_active_pointer_is_never_removed(self):
        active = make_run(self.runs, self.now - timedelta(days=30), 'active', done=False)
        n.save(self.root / 'active.json', {'run_dir': str(active), 'run_id': active.name})
        for i in range(3):
            make_run(self.runs, self.now - timedelta(days=30 + i), f'other{i}', done=True)
        self.prune(keep_run_days=1, keep_completed_runs=0)
        self.assertTrue(active.exists(), 'active 指针指向的 run 被删掉了')

    def test_missing_runs_dir_is_harmless(self):
        empty = self.root / 'empty'
        empty.mkdir()
        self.assertEqual(g.prune_runs(empty, {}), {'removed': 0, 'freed': 0})

    def test_malformed_directory_name_is_left_alone(self):
        odd = self.runs / 'not-a-run-id'
        odd.mkdir()
        self.prune()
        self.assertTrue(odd.exists(), '名字不合规的目录不该被猜着删')


if __name__ == '__main__':
    unittest.main()
