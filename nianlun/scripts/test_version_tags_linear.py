"""版本 tag 必须线性递增，且不遗漏提交。

## 起因

2026-11-07 一天 69 次提交，版本号却一直压在 v2.9.2（每次 `git tag -f` 覆盖）。
飞哥问「迭代了多少版本」时我只能承认：**没分段**。

重建 tag 时又踩一次：用 `git rev-parse v2.9.2` 拿到的是 **annotated tag 对象
本身的 SHA**（3d9e47f），不是提交。我据此判断「v2.9.2 和 v2.9.3 之间 0 次
提交」，其实两个 tag 指向完全不同的提交。正确写法是
`git rev-parse v2.9.2^{commit}`。

## 现在

```
v2.9.2  11-06 23:53  当日基线
v2.9.3  11-07 05:20  报告与倒排底座      42 次提交
v2.9.4  11-07 07:29  运行时稳定性        10 次
v2.9.5  11-07 11:39  3D 星图连线         14 次
v2.9.6  11-07 12:02  交互修正与文档       3 次
v2.9.7  11-07 18:46  版本号收敛           1 次
```

70 次提交被 5 个版本完整切分，**没有提交落在空隙外**。
"""
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
TAGS = ['v2.9.2', 'v2.9.3', 'v2.9.4', 'v2.9.5', 'v2.9.6', 'v2.9.7']


def git(*args):
    r = subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, timeout=60)
    return r.stdout.strip() if r.returncode == 0 else None


class VersionTagTests(unittest.TestCase):
    def commit_of(self, tag):
        """必须用 ^{commit}——否则拿到的是 tag 对象 SHA。"""
        return git('rev-parse', f'{tag}^{{commit}}')

    def test_all_tags_exist(self):
        for tag in TAGS:
            self.assertIsNotNone(self.commit_of(tag), f'{tag} 不存在')

    def test_tags_form_linear_chain(self):
        """每个 tag 必须是下一个的祖先，不能有分叉。"""
        for prev, nxt in zip(TAGS, TAGS[1:]):
            r = subprocess.run(['git', 'merge-base', '--is-ancestor',
                                f'{prev}^{{commit}}', f'{nxt}^{{commit}}'],
                               cwd=ROOT, capture_output=True, timeout=60)
            self.assertEqual(r.returncode, 0, f'{prev} 不是 {nxt} 的祖先')

    def test_each_gap_has_commits(self):
        """相邻 tag 之间必须有提交——不能两个 tag 指向同一个提交。"""
        for prev, nxt in zip(TAGS, TAGS[1:]):
            out = git('log', '--oneline', f'{prev}..{nxt}')
            self.assertTrue(out, f'{prev}..{nxt} 之间没有提交（版本重叠）')

    def test_no_commit_outside_tags(self):
        """最后一个 tag 之后不应有未归入任何版本的提交。"""
        out = git('log', '--oneline', f'{TAGS[-1]}..HEAD')
        self.assertFalse(out, f'有提交没被 v2.9.7 覆盖：{out}')

    def test_timestamps_increase(self):
        """tag 提交时间必须严格递增，不能出现时间倒流。"""
        times = [git('log', '-1', '--format=%at', f'{t}^{{commit}}') for t in TAGS]
        for i in range(1, len(times)):
            self.assertGreater(int(times[i]), int(times[i - 1]),
                               f'{TAGS[i]} 时间不晚于 {TAGS[i-1]}')


if __name__ == '__main__':
    unittest.main()
