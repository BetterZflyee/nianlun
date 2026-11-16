"""确认/驳回的写回路径：清标记、归档、进负例库。

不碰真实数据——用 fake gateway 验证写什么、写几次、幂等不幂等。
真实 API 通路（路由/参数形状/锁/noop 分支）已在 2026-11-15 实机验证通过。
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n
import record_admission as ra

CONFIG = json.loads(Path.home().joinpath('.config/nianlun/config.json').read_text())


class FakeGateway:
    """双表路由的假网关：records 按 table_id 分流，写入由 patch 的 table_write 截获。"""
    def __init__(self, config, record_rows, project_rows=None):
        self.config = config
        self.record_rows = record_rows
        self.project_rows = project_rows or []
        outer = self

        class T:
            def records(_s, base, tid):
                if tid == outer.config['tables']['records']['id']:
                    return outer.record_rows
                if tid == outer.config['tables']['projects']['id']:
                    return outer.project_rows
                return []

        self._t = T()

    def table(self):
        return self._t

    def call(self, args, cwd=None, partial=False):
        raise AssertionError('fake gateway 不该直接 call')


def record_row(config, record_id, detail_text):
    table = config['tables']['records']
    fid = lambda k: table['fields'][k]['fieldId']
    return {'recordId': record_id, 'cells': {
        fid('title'): '测试标题', fid('project_ids'): {'linkedRecordIds': ['p1']},
        fid('status'): {'name': '开放', 'id': 'x'}, fid(_ := None or 'detail'): detail_text,
    }}


class ConfirmTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads(json.dumps(CONFIG))
        self.tmp = tempfile.TemporaryDirectory()
        self.config['growth'] = dict(self.config['growth'], state_dir=self.tmp.name)
        self.detail_fid = ra._detail_field(self.config['tables']['records'])

    def tearDown(self):
        self.tmp.cleanup()

    def row_with_marker(self, rid='r1'):
        fid = lambda k: self.config['tables']['records']['fields'][k]['fieldId']
        return {'recordId': rid, 'cells': {
            fid('title'): '测试', fid('project_ids'): {'linkedRecordIds': []},
            fid('status'): {'name': '开放'}, self.detail_fid: '正文' + g.REVIEW_MARKER}}

    def test_confirm_clears_marker_and_writes_once(self):
        rows = [self.row_with_marker()]
        gw = FakeGateway(self.config, rows)
        with unittest.mock.patch.object(g, 'Gateway', return_value=gw), \
             unittest.mock.patch.object(g, 'table_write') as tw:
            # table_write 的真实返回是 dict；MagicMock 默认的 .get(...) 返回
            # truthy mock 对象，会让 verify_pending 分支被误触发。显式给真实形状。
            tw.return_value = {'record_id': 'r1', 'verified': True}
            out = ra._confirm(self.config, 'r1')
        self.assertEqual(out['status'], 'confirmed')
        tw.assert_called_once()
        # table_write(config, gw, role, cells, record_id=...)：cells 是第 4 个位置参（下标 3）
        cells = tw.call_args.args[3]
        self.assertNotIn(g.REVIEW_MARKER, cells[self.detail_fid])
        self.assertTrue(cells[self.detail_fid].startswith('正文'))
        self.assertEqual(tw.call_args.kwargs.get('record_id'), 'r1')

    def test_confirm_is_idempotent_no_write(self):
        """没有标记就不该发起写入——避免无意义的表变更。"""
        fid = lambda k: self.config['tables']['records']['fields'][k]['fieldId']
        rows = [{'recordId': 'r2', 'cells': {fid('title'): 'x',
                self.detail_fid: '本来就没标记', fid('status'): {'name': '开放'},
                fid('project_ids'): {'linkedRecordIds': []}}}]
        gw = FakeGateway(self.config, rows)
        with unittest.mock.patch.object(g, 'Gateway', return_value=gw), \
             unittest.mock.patch.object(g, 'table_write') as tw:
            out = ra._confirm(self.config, 'r2')
        self.assertEqual(out['status'], 'noop')
        tw.assert_not_called()

    def test_verify_pending_honest_status(self):
        """写已发生、回读未确认 → 如实返回 pending_verify，不谎报 confirmed。

        这条语义与生长侧 table_write 的 verify_pending 一致：点过确认是事实，
        标记清没清干净尚未核实——调用方（UI）必须拿到真话来决定提示文案。
        """
        fid = lambda k: self.config['tables']['records']['fields'][k]['fieldId']
        rows = [{'recordId': 'r3', 'cells': {fid('title'): 'x',
                self.detail_fid: '正文' + g.REVIEW_MARKER,
                fid('status'): {'name': '开放'}, fid('project_ids'): {'linkedRecordIds': []}}}]
        gw = FakeGateway(self.config, rows)
        with unittest.mock.patch.object(g, 'Gateway', return_value=gw), \
             unittest.mock.patch.object(g, 'table_write',
                                        return_value={'record_id': 'r3',
                                                      'verify_pending': True,
                                                      'verify_reason': '回读超时'}):
            out = ra._confirm(self.config, 'r3')
        self.assertEqual(out['status'], 'pending_verify')
        self.assertEqual(out['verify_pending'], '回读超时')

    def test_missing_record_raises(self):
        gw = FakeGateway(self.config, [])
        with unittest.mock.patch.object(g, 'Gateway', return_value=gw):
            with self.assertRaises(n.Error):
                ra._confirm(self.config, 'nope')


class RejectTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads(json.dumps(CONFIG))
        self.tmp = tempfile.TemporaryDirectory()
        self.config['growth'] = dict(self.config['growth'], state_dir=self.tmp.name)
        self.detail_fid = ra._detail_field(self.config['tables']['records'])

    def tearDown(self):
        self.tmp.cleanup()

    def test_reject_archives_and_records_negative(self):
        fid = lambda k: self.config['tables']['records']['fields'][k]['fieldId']
        rows = [{'recordId': 'r9', 'cells': {
            fid('title'): '联系卢师傅取设备', fid('project_ids'): {'linkedRecordIds': ['p1']},
            self.detail_fid: '过程' + g.REVIEW_MARKER, fid('status'): {'name': '开放'}}}]
        proj_fid = self.config['tables']['projects']['fields']['title']['fieldId']
        prows = [{'recordId': 'p1', 'cells': {proj_fid: '甲项目'}}]
        config = self.config
        gw = FakeGateway(config, rows, prows)
        captured = {}

        def fake_write(cfg, gw_, role, cells, record_id=None, **kw):
            captured['cells'] = cells
            captured['record_id'] = record_id
            return {'record_id': record_id, 'verified': True}

        with unittest.mock.patch.object(g, 'Gateway', return_value=gw), \
             unittest.mock.patch.object(g, 'table_write', fake_write):
            out = ra._reject(config, 'r9', '执行过程')
        self.assertEqual(out['status'], 'rejected')
        status_fid = config['tables']['records']['fields']['status']['fieldId']
        self.assertEqual(captured['cells'][status_fid], '已归档')
        self.assertNotIn(g.REVIEW_MARKER, captured['cells'][self.detail_fid])
        # 负例落库，且带项目名（模型看项目名判断同类边界）
        neg = ra.load(config)
        self.assertEqual(len(neg), 1)
        self.assertEqual(neg[0]['title'], '联系卢师傅取设备')
        self.assertEqual(neg[0]['project'], '甲项目')

    def test_reject_still_records_negative_when_already_archived(self):
        """已归档的记录也要能补录负例——学习不能因为状态而中断。"""
        fid = lambda k: self.config['tables']['records']['fields'][k]['fieldId']
        rows = [{'recordId': 'r10', 'cells': {
            fid('title'): '发送截图到群', fid('project_ids'): {'linkedRecordIds': []},
            self.detail_fid: '正文', fid('status'): {'name': '已归档'}}}]
        gw = FakeGateway(self.config, rows)
        with unittest.mock.patch.object(g, 'Gateway', return_value=gw), \
             unittest.mock.patch.object(g, 'table_write', lambda *a, **k: {'verified': True}):
            out = ra._reject(self.config, 'r10', '')
        self.assertEqual(out['status'], 'rejected')
        self.assertEqual(len(ra.load(self.config)), 1)


class DetailFieldTests(unittest.TestCase):
    def test_falls_back_when_no_description_column(self):
        """表只有 solution（真实情况）时不能 KeyError——实机就崩过一次。"""
        table = {'fields': {'solution': {'fieldId': 'S1'}, 'title': {'fieldId': 'T1'}}}
        self.assertEqual(ra._detail_field(table), 'S1')

    def test_prefers_description(self):
        table = {'fields': {'description': {'fieldId': 'D1'}, 'solution': {'fieldId': 'S1'}}}
        self.assertEqual(ra._detail_field(table), 'D1')



class UiCallShapeTests(unittest.TestCase):
    """UI 的 run() 不自动加 request_id（服务端对写操作硬性要求）。

    实机 curl 测通了 API，但那是手工构造的 JSON——UI 少传 request_id 时
    服务端会拒绝整个请求，而单测/fake 全都不会发现。
    源码级断言：admission 两个调用必须带 request_id。
    """

    def app_js(self):
        return (Path(__file__).resolve().parent.parent / 'assets' / 'portal' /
                'app.js').read_text(encoding='utf-8')

    def test_confirm_call_has_request_id(self):
        src = self.app_js()
        idx = src.index('"admission_confirm"')
        block = src[idx: idx + 200]
        self.assertIn('request_id', block)

    def test_reject_call_has_request_id(self):
        src = self.app_js()
        idx = src.index('"admission_reject"')
        block = src[idx: idx + 240]
        self.assertIn('request_id', block)


if __name__ == "__main__":
    import unittest.mock
    unittest.main()
