"""报告校验报错要能指导修订。

真实案例：20:41 那轮报告三轮修订全部失败，报错分别是
    「里程碑字段不合法」     ← 模型不知道多了哪个字段，乱改
    「里程碑说明 须为 1 至 18 字」 ← 18 字装不下正常表述
最终整份报告没生成出来。

校验失败信息是模型唯一的改稿依据。**它必须说出「哪里错、该怎么做」**，
只说「不合法」等于让模型猜。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_blocks


def gantt(**over):
    cfg = {
        'type': 'gantt', 'title': 'T', 'caption': 'c',
        'today': '2026-11-06', 'start': '2026-10-20', 'end': '2026-11-12',
        'milestones': [], 'rows': [
            {'label': '南昌 791XE', 'state': 'done', 'stage': '已验收',
             'points': [{'date': '2026-10-26', 'label': '验收完成', 'state': 'done'}],
             'source': '[R1]'},
        ],
    }
    cfg.update(over)
    return cfg


def render(cfg):
    import json
    import render_report
    md = 'Lead: t\n\n## 总览\n\n```visual\n' + json.dumps(cfg, ensure_ascii=False) + '\n```\n\n## 风险\nx[R1]\n'
    return render_report.brief_html(md, 'T', '2026-10-30', '2026-11-06')


class MilestoneMessageTests(unittest.TestCase):
    def test_extra_field_is_named(self):
        """多出的字段必须点名，否则模型只能猜。"""
        cfg = gantt(milestones=[{'date': '2026-10-26', 'label': '节点', 'state': 'done', 'source': '[R1]'}])
        with self.assertRaises(ValueError) as ctx:
            render(cfg)
        message = str(ctx.exception)
        self.assertIn('state', message, '报错要点名多出的是 state')
        self.assertIn('date', message, '报错要说明允许哪些字段')

    def test_label_limit_matches_row_limit(self):
        """里程碑说明和甘特行 label 的宽度上限应一致，都是 26。"""
        long_ok = '集采框招上架（原定 10-30，延后 17 天）'   # 22 字，曾被 18 字限制拦下
        cfg = gantt(milestones=[{'date': '2026-10-26', 'label': long_ok, 'source': '[R1]'}])
        html = render(cfg)                       # 不该抛异常
        self.assertIn('集采框招上架', html)

    def test_too_long_label_reports_real_limit(self):
        cfg = gantt(milestones=[{'date': '2026-10-26', 'label': '字' * 30, 'source': '[R1]'}])
        with self.assertRaises(ValueError) as ctx:
            render(cfg)
        self.assertIn('26', str(ctx.exception), '报错要说出真实上限，不能只说「不合法」')


class RowMessageTests(unittest.TestCase):
    def test_row_extra_field_is_named(self):
        row = {'label': '南昌 791XE', 'state': 'done', 'stage': '已验收',
               'bogus': 'x', 'points': [{'date': '2026-10-26', 'label': '验收', 'state': 'done'}],
               'source': '[R1]'}
        with self.assertRaises(ValueError) as ctx:
            render(gantt(rows=[row]))
        self.assertIn('bogus', str(ctx.exception))


if __name__ == '__main__':
    unittest.main()
