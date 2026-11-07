#!/usr/bin/env python3
"""审计记忆引用覆盖率：哪些有链接、哪些没有、为什么没有。

## 为什么要这个

3D 星图上 `meetings · 327` 这个簇看起来「大部分是散点」，容易被误判成
「链接没生效」。实际是：

- 327 条 meeting 里，**只有 23 条是年轮写入的**；
- 剩下约 300 条来自钉钉文档导入等**其他来源**，年轮无权也不该替它们
  编造项目归属；
- 年轮写的 23 条里，**记忆文件还在的 9 条已全部回填**。

所以 `162 条引用` 是当前能做的全部，不是遗漏。这个脚本把边界算出来，
免得下次又怀疑。

用法：`python3 memory_links_audit.py`
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n

CFG = Path.home() / '.config/nianlun/config.json'


def has_backlinks(slug):
    """该页面有没有入边（别的页面链到它）。"""
    import subprocess
    try:
        r = subprocess.run([str(Path.home() / '.bun/bin/gbrain'), 'call', 'get_backlinks',
                            json.dumps({'slug': slug})],
                           capture_output=True, text=True, encoding='utf-8', timeout=60)
        if r.returncode:
            return False
        payload = r.stdout[r.stdout.find('['):]
        return bool(json.loads(payload))
    except Exception:
        return False


def count_links(path):
    try:
        text = path.read_text(encoding='utf-8')
    except OSError:
        return 0
    return text.count('[[')


def main():
    config = n.load(CFG)
    brain = Path(config['growth']['brain_dir'])
    rows = []

    def bucket(label, pattern, mine_only=None):
        files = sorted(brain.glob(pattern))
        total = len(files)
        linked = sum(1 for f in files if count_links(f) > 0)
        rows.append((label, total, linked))
        return total, linked

    # 年轮自己写的
    mine_meetings = sorted(brain.glob('meetings/nianlun-*.md'))
    mine_projects = sorted(brain.glob('projects/nianlun-*.md'))
    # 其他来源（钉钉导入、手工笔记等）
    all_meetings = sorted(brain.glob('meetings/*.md'))
    others = [f for f in all_meetings if '/nianlun-' not in str(f)]

    mine_meet_linked = sum(1 for f in mine_meetings if count_links(f) > 0)
    # 项目记忆的正文里没有 [[链接]]——它自己不出边，边是别的页面链到它（入边）。
    # explorer.relations() 现在会额外读 backlinks，把入边也交给渲染层，
    # 所以判断项目记忆是否「有连接」要看有没有入边，不能只看正文。
    # slug 是相对 brain 根目录的路径去掉 .md（如 projects/nianlun-xxx），
    # 不能用 f.stem——那只会得到文件名，丢掉目录前缀，查不到任何入边。
    def slug_of(path):
        return str(path.relative_to(brain))[:-3]

    mine_proj_linked = sum(1 for f in mine_projects if has_backlinks(slug_of(f)))
    other_linked = sum(1 for f in others if count_links(f) > 0)

    print('=== 记忆引用覆盖率审计 ===\n')
    print(f'年轮写入的生长记录: {len(mine_meetings):>4} 条，其中有链接 {mine_meet_linked} 条')
    print(f'年轮写入的项目记忆: {len(mine_projects):>4} 个，其中有链接 {mine_proj_linked} 个')
    print(f'其他来源的记忆:     {len(others):>4} 条，其中有链接 {other_linked} 条')
    print()
    print('说明：其他来源（钉钉导入等）不属于年轮写入范围，不代它们编造归属。')
    print('      年轮写入部分的覆盖率才是产品该负责的指标。')

    mine_total = len(mine_meetings) + len(mine_projects)
    mine_linked = mine_meet_linked + mine_proj_linked
    if mine_total:
        pct = mine_linked * 100 // mine_total
        print(f'\n年轮写入部分覆盖率：{mine_linked}/{mine_total} = {pct}%')
    return 0


if __name__ == '__main__':
    sys.exit(main())
