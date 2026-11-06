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


class StateMessageTests(unittest.TestCase):
    """状态报错要列出合法值。

    模型写「已完成」而不是 done 是常见错法。只说「状态不合法」，
    模型不知道有哪些选项，只能瞎猜——实测两轮修订都改不动。
    """

    def test_row_state_lists_valid_values(self):
        row = {'label': 'X', 'state': '已完成', 'stage': 's', 'points': [], 'source': '[R1]'}
        with self.assertRaises(ValueError) as ctx:
            render(gantt(rows=[row]))
        msg = str(ctx.exception)
        for v in ('done', 'active', 'blocked', 'planned', 'unknown'):
            self.assertIn(v, msg, f'列出合法值时要包含 {v}')
        self.assertIn('已完成', msg, '要回显模型写的值，便于对照')

    def test_point_state_lists_valid_values(self):
        row = {'label': 'X', 'state': 'done', 'stage': 's',
               'points': [{'date': '2026-10-26', 'label': 'n', 'state': '完成'}], 'source': '[R1]'}
        with self.assertRaises(ValueError) as ctx:
            render(gantt(rows=[row]))
        self.assertIn('done', str(ctx.exception))
        self.assertIn('完成', str(ctx.exception))

    def test_status_card_extra_field_named(self):
        cfg = {'type': 'status', 'title': 'T', 'caption': 'c',
               'items': [{'label': 'A', 'detail': 'd', 'state': 'active',
                          'source': '[R1]', 'extra': 1}]}
        with self.assertRaises(ValueError) as ctx:
            render(cfg)
        self.assertIn('extra', str(ctx.exception))


class MilestoneCountTests(unittest.TestCase):
    """超量时报错要给出选择策略，不能只说「最多 24 个」。

    实际数据：车辆靠离卡有 32 个里程碑，甘特图上放不下。模型被拦下后如果
    只看到「须为 0 至 24 个」，它只能随便删 8 个——很可能把验收节点删掉，
    留下例行周会。
    """

    def too_many(self):
        marks = [{'date': '2026-11-{:02d}'.format(i % 28 + 1),
                  'label': f'节点{i}', 'source': '[R1]'} for i in range(30)]
        return gantt(milestones=marks)

    def test_reports_actual_count(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.too_many())
        self.assertIn('30', str(ctx.exception), '要说出实际收到几个，便于模型自己删')

    def test_tells_what_to_keep(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.too_many())
        msg = str(ctx.exception)
        for word in ('验收', '保留'):
            self.assertIn(word, msg, f'要提示保留哪类节点，缺了「{word}」')

    def test_tells_what_to_drop(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.too_many())
        self.assertIn('省略', str(ctx.exception), '要提示可以省略哪类')

    def test_limit_is_named_constant(self):
        """上限抽成常量，和报错文案用同一个值，避免改一处忘另一处。"""
        self.assertEqual(report_blocks.MARK_LIMIT, 24)
        with self.assertRaises(ValueError) as ctx:
            render(self.too_many())
        self.assertIn(str(report_blocks.MARK_LIMIT), str(ctx.exception))


class GraphLayerTests(unittest.TestCase):
    """关系图层内超限要指出是哪一列超了。

    只说「每列最多 3 个节点」，模型不知道该合并哪几个——9 个节点按 3 层排，
    很容易变成某层 5 个。
    """

    def too_many_in_layer(self):
        nodes = [{'id': f'n{i}', 'label': f'N{i}', 'state': 'active', 'layer': 0,
                  'detail': 'd', 'source': '[R1]'} for i in range(5)]
        links = [{'from': 'n0', 'to': 'n1', 'label': 'x', 'source': '[R1]'}]
        return {'type': 'graph', 'title': 'T', 'caption': 'c', 'nodes': nodes, 'links': links}

    def test_names_the_over_limit_layer(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.too_many_in_layer())
        msg = str(ctx.exception)
        self.assertIn('layer 0', msg, '要指出是哪一列超了')
        self.assertIn('5', msg, '要说出该列实际有几个')

    def test_gives_actionable_direction(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.too_many_in_layer())
        msg = str(ctx.exception)
        self.assertTrue(any(w in msg for w in ('合并', '拆')), '要给出解决办法')

    def test_id_rule_matches_regex(self):
        """id 报错要描述真实规则：正则允许字母开头，不是「小写字母」。"""
        nodes = [{'id': 'N1', 'label': 'A', 'state': 'active', 'layer': 0,
                  'detail': 'd', 'source': '[R1]'},
                 {'id': 'n2', 'label': 'B', 'state': 'active', 'layer': 1,
                  'detail': 'd', 'source': '[R2]'}]
        links = [{'from': 'N1', 'to': 'n2', 'label': 'x', 'source': '[R1]'}]
        cfg = {'type': 'graph', 'title': 'T', 'caption': 'c', 'nodes': nodes, 'links': links}
        html = render(cfg)              # 大写字母开头的 id 应当合法
        self.assertIn('N1', html)

    def test_limit_is_named_constant(self):
        self.assertEqual(report_blocks.LAYER_LIMIT, 3)


class VisualFieldTests(unittest.TestCase):
    """图块字段报错要点名「第几张图」「多出什么」「该写在哪」。

    实测 2026-11-07 04:09 那轮报告连写三稿都失败：模型把 source 写在了
    status 块的外层，而它属于每个 item 内部。报错只说「包含不支持的字段」，
    模型要么瞎改、要么把 source 删掉——引用依据就丢了。
    """

    def block(self, extra=None):
        item = {'label': '验收完成', 'state': 'done', 'detail': 'x', 'source': '[R1]'}
        cfg = {'type': 'status', 'title': 'T', 'caption': 'c', 'items': [item]}
        if extra:
            cfg.update(extra)
        return cfg

    def test_names_the_block_index(self):
        """一稿常有 2-6 张图，要说是第几张。"""
        import json
        import render_report
        good = self.block()
        bad = self.block({'source': '[R1]'})
        md = ('Lead: t\n\n```visual\n' + json.dumps(good, ensure_ascii=False) + '\n```\n\n'
              '```visual\n' + json.dumps(bad, ensure_ascii=False) + '\n```\n\n## 风险\nx[R1]\n')
        with self.assertRaises(ValueError) as ctx:
            render_report.brief_html(md, 'T', '2026-10-30', '2026-11-06')
        self.assertIn('第 2 张图', str(ctx.exception), '要指出是第几张图')

    def test_names_the_extra_field(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.block({'source': '[R1]'}))
        self.assertIn('source', str(ctx.exception), '要点名多出的字段')

    def test_says_where_the_field_belongs(self):
        """source 属每项内部，不是外层。说清楚才不会让模型把依据删掉。"""
        with self.assertRaises(ValueError) as ctx:
            render(self.block({'source': '[R1]'}))
        self.assertIn('每一项内部', str(ctx.exception), '要说明该字段应写在哪里')

    def test_lists_allowed_fields(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.block({'source': '[R1]'}))
        msg = str(ctx.exception)
        for field in ('items', 'title', 'caption'):
            self.assertIn(field, msg, f'要列出该类型允许的字段，缺了 {field}')


class _NotSet:
    def __repr__(self):
        return 'NOT_SET'


NOT_SET = _NotSet()


class MissingFieldVsTooLongTests(unittest.TestCase):
    """「字段缺失」和「字段太长」必须分开说。

    原来三种情况共用一句「须为 1 至 N 字的非空文本」。模型看到这句的第一反应
    是**把内容改短**，而实际问题往往是**漏了这个字段**——于是它把本来没问题的
    内容越改越短，改到第三稿还是错。

    实测 2026-11-07 04:16 那轮报告前两稿都卡在 caption 为空。
    """

    def block(self, caption):
        item = {'label': 'x', 'state': 'done', 'detail': 'd', 'source': '[R1]'}
        cfg = {'type': 'status', 'title': 'T', 'items': [item]}
        if caption is not NOT_SET:
            cfg['caption'] = caption
        return cfg

    def test_missing_field_says_so(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.block(NOT_SET))
        msg = str(ctx.exception)
        self.assertIn('缺失', msg, '漏字段要说「缺失」，不是「须为 N 字」')
        self.assertIn('没写', msg)

    def test_empty_field_says_so(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.block(''))
        self.assertIn('是空的', str(ctx.exception))

    def test_too_long_reports_actual_length(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.block('长' * 200))
        msg = str(ctx.exception)
        self.assertIn('200', msg, '超长要说实际多少字，模型才知道删多少')
        self.assertIn('精简', msg)

    def test_wrong_type_says_so(self):
        with self.assertRaises(ValueError) as ctx:
            render(self.block(123))
        self.assertIn('写成了', str(ctx.exception))


if __name__ == '__main__':
    unittest.main()
