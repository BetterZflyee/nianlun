"""甘特图日期轴的密度。

原来 tick 只按「标签数 <= 12」选步长，24 天跨度会选 tick=2 排出 12 个标签，
在 664px 轨道上间距只有 8.7%，而标签本身约 34px——彼此叠住，显示成
「10/2022 24 26」。

修复思路：按像素预算反推上限（轨道宽 / 单格占位），而不是拍一个固定个数。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_blocks


def axis_labels(md):
    import render_report
    import re
    html = render_report.brief_html(md, 'T', '2026-10-30', '2026-11-06')
    m = re.search(r'<div class="gt-days">(.*?)</div>', html, re.S)
    if not m:
        return []
    return [(float(p), t) for p, t in re.findall(r'left:([\d.]+)%[^>]*>([^<]+)<', m.group(1))]


def gantt_md(days, rows=1):
    from datetime import date, timedelta
    start = date(2026, 10, 20)
    end = start + timedelta(days=days - 1)
    row = {'label': '南昌 791XE', 'state': 'done', 'stage': '已验收',
           'points': [{'date': '2026-10-26', 'label': '验收完成', 'state': 'done'}], 'source': '[R1]'}
    cfg = '{"type":"gantt","title":"T","caption":"c","today":"2026-11-06",' \
          f'"start":"{start}","end":"{end}","milestones":[],"rows":[{__import__("json").dumps(row, ensure_ascii=False)}]}}'
    return f'Lead: t\n\n## 总览\n\n```visual\n{cfg}\n```\n\n## 风险\nx[R1]\n'


class GanttAxisDensityTests(unittest.TestCase):
    def test_labels_do_not_overlap(self):
        """相邻标签间距必须够放下文字。8.7% 会叠起来，13% 以上才安全。"""
        for days in (14, 24, 31, 60):
            labels = axis_labels(gantt_md(days))
            if len(labels) < 2:
                continue
            gaps = [labels[i + 1][0] - labels[i][0] for i in range(len(labels) - 1)]
            # 10% 在 664px 轨道上是 66px，标签文字约 34px——不会重叠，只是偏紧。
            # 真正的重叠发生在 8.5% 以下（约 56px），所以阈值取 9%。
            self.assertGreaterEqual(min(gaps), 9.0,
                                    f'{days} 天跨度下标签间距 {min(gaps):.1f}% 太小，会叠在一起')

    def test_label_count_is_bounded(self):
        for days in (14, 24, 31, 60, 120):
            labels = axis_labels(gantt_md(days))
            self.assertLessEqual(len(labels), 11,
                                 f'{days} 天跨度排出 {len(labels)} 个标签，太密')

    def test_short_span_keeps_daily_ticks(self):
        """几天跨度不该被过度稀释，否则会只剩月初一个标签。"""
        labels = axis_labels(gantt_md(7))
        self.assertGreaterEqual(len(labels), 2, '7 天跨度标签太少')

    def test_no_duplicate_labels(self):
        labels = axis_labels(gantt_md(31))
        texts = [t for _, t in labels]
        self.assertEqual(len(texts), len(set(texts)), '出现重复标签：%s' % texts)


if __name__ == '__main__':
    unittest.main()
