"""写后回读：两种失败必须给不同文案，且报错要带回 record_id。

## 事故（2026-11-16 14:12）

14:00 定时轮判 failed，error 原文：

    DWS aitable +record-query：DWS 未返回有效结果，请检查连接与执行记录；
    读取未确认，未把缺失结果视为空数据

但那条记录**写成功了**（record_id=4Xr7szCkMJ，14:11:48 入库）。

## 实测出来的真时间线

| 时刻 | resp_size | success |
|---|---|---|
| 14:11:48.786 | 586 | true |
| 14:11:51.771 | 586 | true |
| 14:11:57.430 | 586 | true |
| 14:12:10.498 | 586 | true |
| 14:12:56.848 | 586 | true |
| **14:20:47.532** | **3394** | true |

`dws.log` 里 `success!=true` 的行数：**0**。
`audit-20261116.jsonl` 里 `result!=success` 的行数：**0**。

信封字节实测：不存在 ID = 131、存在 ID = 2047（含 meta 完整信封 3394）。
**586 既不是空信封也不是命中，是第三种形态**——这就是为什么必须留脱敏原文：
只记 resp_size 永远判不出它是什么。

## 两条红线的由来

**① 报错必须带 record_id。** `apply_plan` 第 695 行已经拿到并写进回执了，
抛错时却丢掉，用户手里没有任何线索，只能猜。
**② 两类失败文案必须分开**（测试给的判别器）：

    干净空记录 records:[]  → 1 次调用 → 表格写后验证未通过（带 record_id）
    坏 JSON / 非 JSON      → 5 次调用 → 未返回有效结果…读取未确认

现在这两句混在一起，是本次误判的直接原因。
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n
import dws_transport as transport
import growth as g


class FailureMessageTests(unittest.TestCase):
    def test_redacts_secrets(self):
        r = SimpleNamespace(
            stdout='',
            stderr=json.dumps({'error': {'reason': 'io_timeout',
                                         'cause': 'https://private.test/path?access_token=abc123'}}))
        value = transport.failure(r, ['aitable', 'record', 'query'])
        self.assertIn('连接钉钉服务超时', value)
        self.assertNotIn('abc123', value)

    def test_keeps_redacted_snippet_so_586_can_be_diagnosed(self):
        """留摘要才是这次修的本意：否则永远判不出 586 是什么。"""
        r = SimpleNamespace(stdout='', stderr='{"data":{"records":[],"size":0}}')
        value = transport.failure(r, ['aitable', 'record', 'query'])
        self.assertIn('CLI 输出摘要', value)
        self.assertIn('records', value)

    def test_dead_json_is_named_as_unparseable_not_as_readback(self):
        """坏 JSON 走的是「未返回有效结果」，不能混成「写后验证未通过」。"""
        r = SimpleNamespace(stdout='not json at all', stderr='boom')
        value = transport.failure(r, ['aitable', '+record-query'])
        self.assertIn('未返回有效结果', value)
        self.assertNotIn('表格写后验证未通过', value)

    def test_redact_drops_url_query_and_caps_length(self):
        got = transport.redact('https://x.test/a?token=secretvalue&b=1 ' + 'z' * 2000)
        self.assertNotIn('secretvalue', got)
        self.assertLessEqual(len(got), 601)


class RedactionLeakTests(unittest.TestCase):
    """凭据进日志比查不出原因严重得多——这几条是「不得包含」式断言。

    2026-11-16 实测到的漏洞（规则顺序导致后续规则失明）：

        Authorization: Bearer <JWT>  → 只脱了 Authorization: 这个词，整段 JWT 留下
        cookie: sid=abc; csrftoken=xyz → 只吃到第一个 `;`，csrftoken 留下

    根因：第一条规则把锚点（`Authorization:`）本身吃成 <已脱敏> 之后，
    后面的 bearer 规则就再也匹配不到东西。修法是**先删整段头，再删裸 token**，
    顺序有语义，不能调换。
    """

    CASES = (
        ('Authorization: Bearer JWT',
         'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.SIG',
         ('eyJhbGci', 'SIG')),
        ('cookie 多值', 'cookie: sessionid=abc; csrftoken=xyz', ('csrftoken', 'xyz')),
        ('set-cookie', 'set-cookie: sid=zzz; Path=/; HttpOnly', ('zzz',)),
        ('Proxy-Authorization', 'Proxy-Authorization: Basic dXNlcjpwYXNz', ('dXNlcjpwYXNz',)),
        ('x-api-key', 'x-api-key=sk-live-1234567890', ('sk-live',)),
        ('裸 bearer', 'sent Bearer abc.def.ghi to server', ('abc.def.ghi',)),
        ('json authorization', '{"authorization":"Bearer TOK123"}', ('TOK123',)),
        ('token= 裸键', 'token=abc123 rest', ('abc123',)),
    )

    def test_no_token_fragment_survives(self):
        for name, raw, secrets in self.CASES:
            with self.subTest(name):
                got = transport.redact(raw)
                for secret in secrets:
                    self.assertNotIn(secret, got,
                                     f'{name}: 「{secret}」原样留在了摘要里 → {got}')

    def test_authorization_header_is_fully_removed(self):
        """整段头必须消失，不能只剩 `<已脱敏>` 加半个 token。"""
        got = transport.redact(
            'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.SIG')
        self.assertEqual(got, '<已脱敏>')

    def test_cookie_header_eats_every_key(self):
        got = transport.redact('cookie: sessionid=abc; csrftoken=xyz')
        self.assertEqual(got, '<已脱敏>')

    def test_still_keeps_useful_diagnostics(self):
        """脱敏不能把可诊断信息一起删光——那是这次修的初衷。"""
        got = transport.redact('{"data":{"records":[],"size":0},"status":"success"}')
        self.assertIn('records', got)
        self.assertIn('success', got)


class PendingVerifyTests(unittest.TestCase):
    """P0-b：写成功但回读没确认 → 不抛错、继续做、记 pending_verify。

    2026-11-16 14:12 那轮的代价是三重的：
      ① 后面所有动作全不做（整批废掉）；
      ② finish() 不执行 → seen 不写、水位不推 → 下一轮重采；
      ③ 用户只看到 failed，不知道 reconcile 能救。
    一次回读失败掐死整轮，比「没核实」本身严重得多。
    """

    def config(self):
        return {
            'base_id': 'b', 'base_url': 'https://x.test', 'profile': None,
            'tables': {
                'projects': {'id': 'tp', 'name': '项目',
                             'fields': {'title': {'fieldId': 'pt', 'type': 'text'},
                                        'status': {'fieldId': 'ps', 'type': 'singleSelect',
                                                   'config': {'options': [{'name': '进行中'}]}}}},
                'records': {
                    'id': 'tbl', 'name': '记录',
                    'fields': {
                        'title': {'fieldId': 'T', 'type': 'text'},
                        'description': {'fieldId': 'D', 'type': 'text'},
                        'project_ids': {'fieldId': 'P', 'type': 'text'},
                        'date': {'fieldId': 'DT', 'type': 'text'},
                        'kind': {'fieldId': 'K', 'type': 'singleSelect',
                                 'config': {'options': [{'name': '业务问题'}]}},
                        'status': {'fieldId': 'S', 'type': 'singleSelect',
                                   'config': {'options': [{'name': '开放'}]}},
                    },
                },
                'milestones': {'id': 'tm', 'name': '里程碑', 'fields': {}},
                'sites': {'id': 'ts', 'name': '场地', 'fields': {}},
            },
        }

    def client(self, config, created):
        class Client:
            def call(self, args):
                if 'create' in args:
                    rid = 'REC%d' % (len(created) + 1)
                    created.append(rid)
                    return {'newRecordIds': [rid]}
                return {'records': [], 'hasMore': False, 'size': 0}   # 空信封

            def fields(self, base_id, table_id):
                table = next(t for t in config['tables'].values() if t['id'] == table_id)
                return [{'fieldId': f['fieldId'], 'type': f.get('type', 'text'),
                         'config': f.get('config', {})} for f in table['fields'].values()]

            def records(self, base_id, table_id):
                if table_id == 'tp':
                    return [{'recordId': 'p1', 'cells': {'pt': '甲',
                                                         'ps': {'id': 'x', 'name': '进行中'}}}]
                return []
        return Client()

    def two_candidates(self):
        return [
            {'op': 'create_record', 'project': '甲', 'title': '第一条标题够长',
             'description': '描述一', 'date': '2026-11-16', 'kind': '业务问题',
             'source': {'id': 's1', 'name': 'n', 'quote': 'q1'}},
            {'op': 'create_record', 'project': '甲', 'title': '第二条标题够长',
             'description': '描述二', 'date': '2026-11-16', 'kind': '业务问题',
             'source': {'id': 's2', 'name': 'n', 'quote': 'q2'}},
        ]

    def test_does_not_raise_and_continues_remaining_actions(self):
        """第 1 条回读失败，第 2 条必须照做——这是本次最重要的改动。"""
        config = self.config()
        state = {'projects': [{'id': 'p1', 'title': '甲', 'raw_cells': {}}],
                 'records': [], 'milestones': [], 'sites': []}
        document = n.plan(config, state, self.two_candidates())
        created = []
        with tempfile.TemporaryDirectory() as tmp:
            receipt = n.apply_plan(config, self.client(config, created),
                                   document, Path(tmp) / 'receipt.json')
        self.assertEqual(len(created), 2, '第二条动作必须也执行了')
        self.assertEqual(receipt['status'], 'pending_verify')
        self.assertEqual(len(receipt.get('pending_verify') or {}), 2)
        for value in (receipt.get('pending_verify') or {}).values():
            self.assertTrue(value.get('record_id'))
            self.assertIn('核对', value.get('how_to_verify', ''))

    def test_verified_status_when_readback_succeeds(self):
        config = self.config()
        state = {'projects': [{'id': 'p1', 'title': '甲', 'raw_cells': {}}],
                 'records': [], 'milestones': [], 'sites': []}
        document = n.plan(config, state, self.two_candidates()[:1])

        class Client:
            def call(self, args):
                if 'create' in args:
                    return {'newRecordIds': ['OK1']}
                # D 列含 marker 与来源尾注，必须与 plan 生成的完全一致才算 verified
                expected = document['actions'][0]['cells']
                return {'records': [{'recordId': 'OK1', 'cells': {
                    'T': expected['T'], 'D': expected['D'], 'P': expected['P'],
                    'DT': expected['DT'], 'K': {'name': '业务问题'}, 'S': {'name': '开放'}}}],
                    'hasMore': False, 'size': 1}

            def fields(self, base_id, table_id):
                table = next(t for t in config['tables'].values() if t['id'] == table_id)
                return [{'fieldId': f['fieldId'], 'type': f.get('type', 'text'),
                         'config': f.get('config', {})} for f in table['fields'].values()]

            def records(self, base_id, table_id):
                if table_id == 'tp':
                    return [{'recordId': 'p1', 'cells': {'pt': '甲',
                                                         'ps': {'id': 'x', 'name': '进行中'}}}]
                return []

        with tempfile.TemporaryDirectory() as tmp:
            receipt = n.apply_plan(config, Client(), document, Path(tmp) / 'receipt.json')
        self.assertEqual(receipt['status'], 'verified')
        self.assertFalse(receipt.get('pending_verify'))


class OverviewPendingVerifyTests(unittest.TestCase):
    """pending_verify 必须对用户可见，不能退化成 unknown。"""

    def build(self, receipt):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'runs' / 'r1').mkdir(parents=True)
            folder = root / 'runs' / 'r1'
            n.save(folder / 'evidence.json', {'run_id': 'r1', 'since': 's', 'until': 'u'})
            n.save(folder / 'plan.json', {'actions': [
                {'key': 'k1', 'op': 'create_record', 'title': '已确认的'},
                {'key': 'k2', 'op': 'create_record', 'title': '写了但没核到的'},
            ]})
            n.save(folder / 'receipt.json', receipt)
            n.save(root / 'active.json', {'run_id': 'r1', 'run_dir': str(folder)})
            import recovery
            return recovery.overview({'growth': {'state_dir': str(root)}})

    def test_pending_verify_is_its_own_status(self):
        got = self.build({'status': 'pending_verify',
                          'results': {'k1': {'record_id': 'A', 'verified': True}},
                          'pending_verify': {'mk2': {'record_id': 'B', 'title': '写了但没核到的'}}})
        items = {i['title']: i['status'] for i in got['items']}
        self.assertEqual(items['已确认的'], 'verified')
        self.assertEqual(items['写了但没核到的'], 'pending_verify')
        self.assertNotIn('unknown', items.values())
        self.assertEqual(got['pending_verify_count'], 1)
        self.assertTrue(got['needs_reconciliation'])

    def test_in_flight_with_record_id_is_pending_verify_not_unknown(self):
        """拿到 record_id 说明数据进去过——这是「待核」不是「未知」。"""
        got = self.build({'status': 'running', 'results': {},
                          'in_flight': {'key': 'k2', 'record_id': 'B', 'op': 'create_record'}})
        items = {i['title']: i['status'] for i in got['items']}
        self.assertEqual(items['写了但没核到的'], 'pending_verify')

    def test_in_flight_without_record_id_stays_unknown(self):
        got = self.build({'status': 'running', 'results': {},
                          'in_flight': {'key': 'k2', 'op': 'create_record'}})
        items = {i['title']: i['status'] for i in got['items']}
        self.assertEqual(items['写了但没核到的'], 'unknown')

    def config(self):
        return {
            'base_id': 'b', 'base_url': 'https://x.test', 'profile': None,
            'tables': {
                'projects': {'id': 'tp', 'name': '项目',
                             'fields': {'title': {'fieldId': 'pt', 'type': 'text'},
                                        'status': {'fieldId': 'ps', 'type': 'singleSelect',
                                                   'config': {'options': [{'name': '进行中'}]}}}},
                'records': {
                    'id': 'tbl', 'name': '记录',
                    'fields': {
                        'title': {'fieldId': 'T', 'type': 'text'},
                        'description': {'fieldId': 'D', 'type': 'text'},
                        'project_ids': {'fieldId': 'P', 'type': 'text'},
                        'date': {'fieldId': 'DT', 'type': 'text'},
                        'kind': {'fieldId': 'K', 'type': 'singleSelect', 'config': {'options': [{'name': '业务问题'}]}},
                        'status': {'fieldId': 'S', 'type': 'singleSelect', 'config': {'options': [{'name': '开放'}]}},
                    },
                },
                'milestones': {'id': 'tm', 'name': '里程碑', 'fields': {}},
                'sites': {'id': 'ts', 'name': '场地', 'fields': {}},
            },
        }


class PendingVerifyToReconcileTests(unittest.TestCase):
    """完整链路：写入待核 → reconcile → verified。

    2026-11-16 打回的 bug：`pending_verify` 的键是 marker（`[年轮来源:...]`），
    而 reconcile 用 `by_key.get(key)` 去查，`by_key` 的键是动作 sha256 ——
    两者不相等，于是 `continue` 静默跳过，**那条待核记录永远不会被核销**，
    连「仍有 N 条待核」都不会提示。

    这是「可恢复的被显示成不可恢复」换了个地方重演，所以这里锁死整条链路，
    不能只测单点。
    """

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.root = Path(self.tmp)
        self.folder = self.root / 'runs' / 'r1'
        self.folder.mkdir(parents=True)
        self.config = {
            'base_id': 'b', 'base_url': 'https://x.test', 'profile': None,
            'growth': {'state_dir': str(self.root)},
            'tables': {
                'projects': {'id': 'tp', 'name': '项目',
                             'fields': {'title': {'fieldId': 'pt', 'type': 'text'},
                                        'status': {'fieldId': 'ps', 'type': 'singleSelect',
                                                   'config': {'options': [{'name': '进行中'}]}}}},
                'records': {'id': 'tbl', 'name': '记录', 'fields': {
                    'title': {'fieldId': 'T', 'type': 'text'},
                    'description': {'fieldId': 'D', 'type': 'text'},
                    'project_ids': {'fieldId': 'P', 'type': 'text'},
                    'date': {'fieldId': 'DT', 'type': 'text'},
                    'kind': {'fieldId': 'K', 'type': 'singleSelect',
                             'config': {'options': [{'name': '业务问题'}]}},
                    'status': {'fieldId': 'S', 'type': 'singleSelect',
                               'config': {'options': [{'name': '开放'}]}},
                }},
                'milestones': {'id': 'tm', 'name': '里程碑', 'fields': {}},
                'sites': {'id': 'ts', 'name': '场地', 'fields': {}},
            },
        }

    def test_pending_verify_key_is_marker_but_reconcile_finds_it(self):
        """marker 与 action.key 不同，reconcile 仍必须能按 marker 找到动作。"""
        state = {'projects': [{'id': 'p1', 'title': '甲', 'raw_cells': {}}],
                 'records': [], 'milestones': [], 'sites': []}
        document = n.plan(self.config, state, [{
            'op': 'create_record', 'project': '甲', 'title': '标题够长吧',
            'description': '描述', 'date': '2026-11-16', 'kind': '业务问题',
            'source': {'id': 's1', 'name': 'n', 'quote': 'q'}}])

        visible = {}

        class Client:
            def call(self, args):
                if 'create' in args:
                    return {'newRecordIds': ['REC900']}
                if visible.get('on'):
                    return {'records': [{'recordId': 'REC900',
                                         'cells': {k: v for k, v in visible['cells'].items()}}],
                            'hasMore': False, 'size': 1}
                return {'records': [], 'hasMore': False, 'size': 0}

            def fields(self, base_id, table_id):
                table = next(t for t in self_config['tables'].values() if t['id'] == table_id)
                return [{'fieldId': f['fieldId'], 'type': f.get('type', 'text'),
                         'config': f.get('config', {})} for f in table['fields'].values()]

            def records(self, base_id, table_id):
                if table_id == 'tp':
                    return [{'recordId': 'p1', 'cells': {'pt': '甲',
                                                         'ps': {'id': 'x', 'name': '进行中'}}}]
                # reconcile_plan 走 fetch() → client.records()；可见后才返回这条
                if table_id == 'tbl' and visible.get('on'):
                    return [{'recordId': 'REC900', 'cells': dict(visible['cells'])}]
                return []

        self_config = self.config
        cells = document['actions'][0]['cells']
        action_key = n.digest({'op': 'create_record', 'title': '标题够长吧'})
        receipt = n.apply_plan(self.config, Client(), document,
                               self.folder / (action_key + '.receipt.json'))
        self.assertEqual(receipt['status'], 'pending_verify')
        pending = receipt['pending_verify']
        self.assertEqual(len(pending), 1)
        marker = list(pending)[0]
        self.assertTrue(marker.startswith('[年轮来源:'), '键应当是 marker')
        # 关键断言：marker 与动作 sha256 不是同一个值——这就是静默跳过的根源
        self.assertNotEqual(marker, action_key)

        # 模拟写入最终可见后，第二轮回读
        visible['on'] = True
        visible['cells'] = {k: v for k, v in cells.items()}

        n.save(self.folder / 'evidence.json',
               {'run_id': 'r1', 'since': 's', 'until': 'u',
                'binding': n.digest(self.config), 'identity': {'user_id': 'u1'}})
        outer = {'run_id': 'r1',
                 'actions': [{'key': action_key, 'op': 'create_record',
                              'title': '标题够长吧', 'table_plan': document}]}
        n.save(self.folder / 'plan.json', outer)
        n.save(self.folder / 'receipt.json',
               {'status': 'pending_verify', 'results': {},
                'pending_verify': pending})
        n.save(self.root / 'active.json', {'run_id': 'r1', 'run_dir': str(self.folder)})

        import recovery
        from unittest import mock

        class FakeGW:
            def table(self):
                return Client()

        with mock.patch.object(g, 'Gateway', lambda _c: FakeGW()), \
             mock.patch.object(g, 'self_identity', lambda _gw: {'user_id': 'u1'}):
            recovery.reconcile(self.config, 'r1')

        after = n.load(self.folder / 'receipt.json')
        self.assertFalse(after.get('pending_verify'), '待核项必须被核销')
        self.assertEqual(after['status'], 'verified')
        self.assertIn(action_key, after.get('results', {}))

    def test_still_unreadable_keeps_pending_and_never_rewrites(self):
        """反向：核不到时必须保持待核，且**一次写都不能重发**。

        这条比正向更重要——它守的是「不会因为核不到就重写」。
        reconcile_plan 的设计是 read-only（"Read only from DWS"），
        所以这里同时断言写调用次数为 0：一旦有人把它改成会重写，
        这条测试立刻红。
        """
        state = {'projects': [{'id': 'p1', 'title': '甲', 'raw_cells': {}}],
                 'records': [], 'milestones': [], 'sites': []}
        document = n.plan(self.config, state, [{
            'op': 'create_record', 'project': '甲', 'title': '标题够长吧',
            'description': '描述', 'date': '2026-11-16', 'kind': '业务问题',
            'source': {'id': 's1', 'name': 'n', 'quote': 'q'}}])
        action_key = n.digest({'op': 'create_record', 'title': '标题够长吧'})
        writes = []
        config = self.config

        class Client:
            """永远读不到，且记录一切写调用。"""

            def call(self, args):
                if 'create' in args:
                    writes.append(args)
                    return {'newRecordIds': ['REC901']}
                return {'records': [], 'hasMore': False, 'size': 0}

            def fields(self, base_id, table_id):
                table = next(t for t in config['tables'].values() if t['id'] == table_id)
                return [{'fieldId': f['fieldId'], 'type': f.get('type', 'text'),
                         'config': f.get('config', {})} for f in table['fields'].values()]

            def records(self, base_id, table_id):
                if table_id == 'tp':
                    return [{'recordId': 'p1', 'cells': {'pt': '甲',
                                                         'ps': {'id': 'x', 'name': '进行中'}}}]
                return []

        receipt = n.apply_plan(config, Client(), document,
                               self.folder / (action_key + '.receipt.json'))
        self.assertEqual(receipt['status'], 'pending_verify')
        self.assertEqual(len(writes), 1, '写入只应发生一次')
        pending_before = dict(receipt['pending_verify'])

        n.save(self.folder / 'evidence.json',
               {'run_id': 'r1', 'since': 's', 'until': 'u',
                'binding': n.digest(config), 'identity': {'user_id': 'u1'}})
        outer = {'run_id': 'r1',
                 'actions': [{'key': action_key, 'op': 'create_record',
                              'title': '标题够长吧', 'table_plan': document}]}
        n.save(self.folder / 'plan.json', outer)
        n.save(self.folder / 'receipt.json',
               {'status': 'pending_verify', 'results': {},
                'pending_verify': pending_before})
        n.save(self.root / 'active.json', {'run_id': 'r1', 'run_dir': str(self.folder)})

        import recovery
        from unittest import mock

        class FakeGW:
            def table(self):
                return Client()

        with mock.patch.object(g, 'Gateway', lambda _c: FakeGW()), \
             mock.patch.object(g, 'self_identity', lambda _gw: {'user_id': 'u1'}):
            with self.assertRaises(n.Error) as ctx:
                recovery.reconcile(config, 'r1')

        message = str(ctx.exception)
        self.assertIn('仍有', message)
        self.assertIn('不要重做', message)
        after = n.load(self.folder / 'receipt.json')
        self.assertTrue(after.get('pending_verify'), '待核项必须保留')
        self.assertEqual(after['status'], 'pending_verify', '不能因为核不到就记 verified')
        self.assertFalse(after.get('results'), '核不到就不能写进 results')
        # 最关键的断言：整条链路一次写都没重发
        self.assertEqual(len(writes), 1, 'reconcile 绝不能重写')


if __name__ == '__main__':
    unittest.main()
