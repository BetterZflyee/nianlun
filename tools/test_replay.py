#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""replay.py 的契约测试。

## 这类测试为什么必须存在

重放台的价值在于「它说不影响，就真不影响」。如果重放台自己有 bug
（比如 rebind 没生效、snapshot 少记一个字段），它会报告「0 轮变化」，
而你可能正基于这个假阴性去改核心代码——**假阴性比假阳性危险得多**。
所以这里锁的不是功能，是「它不会骗我」。

测试用两套夹具：
  - 合成 run（造一份最小 evidence/decision/plan），不依赖任何真实数据；
  - 脱敏样本（真实 run 的极小切片），验证面对生产形状也不崩。
"""
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(ROOT / 'nianlun' / 'scripts'))

import replay


def make_config(home):
    """最小可用的 config：四表 + 字段元数据，形状与真实 config 同构。"""
    TABLE = {'id': 'tbl', 'name': '表', 'fields': {
        'title': {'fieldId': 'fTitle', 'name': '标题', 'type': 'text', 'config': {}},
        'status': {'fieldId': 'fStatus', 'name': '状态', 'type': 'singleSelect',
                   'config': {'options': [{'id': 'o1', 'name': '待核'},
                                          {'id': 'o2', 'name': '进行中'}]}},
        'description': {'fieldId': 'fDesc', 'name': '详情', 'type': 'text', 'config': {}},
        'date': {'fieldId': 'fDate', 'name': '日期', 'type': 'date', 'config': {}},
        'kind': {'fieldId': 'fKind', 'name': '反馈类型', 'type': 'singleSelect',
                 'config': {'options': [{'id': 'k1', 'name': '问题'}]}},
        'solution': {'fieldId': 'fSol', 'name': '解决方案', 'type': 'text', 'config': {}},
        'notes': {'fieldId': 'fNote', 'name': '备注', 'type': 'text', 'config': {}},
        'project_ids': {'fieldId': 'fProj', 'name': '所属项目', 'type': 'link',
                        'config': {}, 'readonly': False},
    }}
    projects = json.loads(json.dumps(TABLE))
    projects['fields']['status']['config']['options'] = [{'id': 'p1', 'name': '在管'}]
    return {
        'format': 'nianlun-config-v1',
        'base_id': 'base',
        'base_url': 'https://example.invalid',
        'profile': 'test',
        'utc_offset_hours': 8,
        'timezone': 'Asia/Shanghai',
        'dws_bin': 'dws',
        'tables': {'projects': projects, 'milestones': json.loads(json.dumps(TABLE)),
                   'sites': json.loads(json.dumps(TABLE)), 'records': json.loads(json.dumps(TABLE))},
        'growth': {'state_dir': str(Path(home) / 'state'), 'switches': {}},
        'harness': {'provider': 'deepseek', 'mode': 'cli'},
    }


def make_bundle(config, run_id='20260101-000000-test0001'):
    import nianlun as n
    return {
        'format': 'nianlun-evidence-v1',
        'run_id': run_id,
        'since': '2026-01-01T00:00:00+08:00',
        'until': '2026-01-01T01:00:00+08:00',
        # binding 故意用「过时」的哈希，模拟表结构改过
        'binding': n.digest({'stale': True}),
        'sources': [{'id': 'message:m1', 'name': '群聊', 'text': '南昌场地道闸坏了',
                     'time': '2026-01-01T00:30:00+08:00', 'channels': ['mentions'],
                     'version': 'v1', 'url': ''}],
        'coverage': [{'channel': 'mentions', 'since': '2026-01-01T00:00:00+08:00',
                      'until': '2026-01-01T01:00:00+08:00', 'status': 'complete', 'count': 1}],
        'identity': {'user_id': 'u1', 'name': '测试', 'corp_id': 'c1'},
        'tables': {
            'projects': [{'id': 'pA', 'title': '南昌项目', 'raw_cells': {}}],
            'milestones': [], 'sites': [],
            'records': [],
            'fields': {'projects': {'title': {'fieldId': 'fTitle', 'name': '标题'},
                                    'status': {'fieldId': 'fStatus', 'name': '状态',
                                               'config': {'options': [{'id': 'p1', 'name': '在管'}]}}},
                       'milestones': {}, 'sites': {}, 'records': {}},
            'fetched_at': '2026-01-01T01:00:00+08:00', 'complete': True,
        },
        'todos': [],
        'count_semantics': 'coverage.count 是扫描数量',
    }


def make_decision(bundle):
    return {
        'run_id': bundle['run_id'],
        'summary': '南昌场地道闸出现故障，需要跟进。',
        'pending': [],
        'deferred_source_ids': [],
        'actions': [{
            'op': 'create_record', 'ref': 'r1', 'project': '南昌项目',
            'source_id': 'message:m1', 'quote': '南昌场地道闸坏了',
            'title': '南昌场地道闸故障', 'description': '现场反馈道闸无法正常抬杆，需排查设备与控制链路。',
            'date': '2026-01-01', 'kind': '问题', 'status': '待核',
        }],
    }


class ReplayContract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.home = Path(self.tmp.name)
        self.config = make_config(self.home)
        self.state = self.home / 'state'
        self.run = self.state / 'runs' / '20260101-000000-test0001'
        self.run.mkdir(parents=True)
        import nianlun as n
        self.bundle = make_bundle(self.config)
        n.save(self.run / 'evidence.json', self.bundle)
        n.save(self.run / 'decision.json', make_decision(self.bundle))

    def tearDown(self):
        self.tmp.cleanup()

    def test_rebind_marks_drift_and_allows_validate(self):
        """过时 binding 必须被识别为 drift，且默认重绑定后能通过校验。

        这是重放台的地基：表结构只要动过一次，历史证据的 binding 就全部失效，
        不重绑的话 20 个历史轮次一律「运行或绑定已变化」，重放台等于废的。
        """
        r = replay.replay_one(self.config, self.run)
        self.assertTrue(r['stages']['load']['binding_drift'])
        self.assertTrue(r['stages']['validate']['ok'], r['stages']['validate'])
        self.assertEqual(r['stages']['validate']['actions'], 1)

    def test_original_binding_reproduces_old_failure(self):
        """显式要求原始 binding 时，必须复现当时的拒绝——用于取证，不是默认行为。"""
        r = replay.replay_one(self.config, self.run, rebind=False)
        self.assertFalse(r['stages']['validate']['ok'])
        self.assertIn('绑定', r['stages']['validate']['error'])

    def test_replay_never_writes(self):
        """重放绝不能改动 run 目录里的任何字节。"""
        before = {p.name: p.stat().st_mtime_ns for p in self.run.iterdir()}
        replay.replay_one(self.config, self.run)
        after = {p.name: p.stat().st_mtime_ns for p in self.run.iterdir()}
        self.assertEqual(before, after)

    def test_missing_decision_is_reported_not_crashed(self):
        """失败轮没有 decision.json，必须如实说「无决策」，而不是抛异常。"""
        (self.run / 'decision.json').unlink()
        r = replay.replay_one(self.config, self.run)
        self.assertFalse(r['ok'])
        self.assertIn('decision', r['stages']['validate']['error'])
        self.assertNotIn('traceback', json.dumps(r).lower())

    def test_prompt_stage_reports_dropped_sources(self):
        """裁剪掉多少来源必须被量化——这是 B1 缺陷的唯一可见指标。"""
        import nianlun as n
        b = make_bundle(self.config)
        b['sources'] = [{'id': f'message:m{i}', 'name': '群聊', 'text': 'x' * 3000,
                         'time': '2026-01-01T00:30:00+08:00', 'channels': ['mentions'],
                         'version': 'v1', 'url': ''} for i in range(400)]
        n.save(self.run / 'evidence.json', b)
        n.save(self.run / 'decision.json', make_decision(b))
        r = replay.replay_one(self.config, self.run)
        p = r['stages']['prompt']
        self.assertTrue(p['ok'])
        self.assertEqual(p['total_sources'], 400)
        self.assertGreater(p['dropped'], 0)
        self.assertEqual(p['kept_sources'] + p['dropped'], 400)

    def test_snapshot_is_stable_across_identical_runs(self):
        """同一输入两次快照必须逐字节相同，否则基线对比全是假警报。"""
        a = replay.snapshot_of([replay.replay_one(self.config, self.run)])
        b = replay.snapshot_of([replay.replay_one(self.config, self.run)])
        self.assertEqual(json.dumps(a, sort_keys=True), json.dumps(b, sort_keys=True))

    def test_snapshot_catches_a_real_change(self):
        """真的改了预算，快照必须报告差异——这是「不骗我」的反向证明。

        注意：改动必须落在**确实会触发裁剪**的量级上。小样本（<预算）下
        调预算本来就不该有任何差异，那不是漏报而是正确行为——所以这里
        先造出超预算的证据，再比两个预算档。
        """
        import nianlun as n
        b = make_bundle(self.config)
        b['sources'] = [{'id': f'message:m{i}', 'name': '群聊', 'text': 'x' * 1200,
                         'time': '2026-01-01T00:30:00+08:00', 'channels': ['mentions'],
                         'version': 'v1', 'url': ''} for i in range(400)]
        n.save(self.run / 'evidence.json', b)
        n.save(self.run / 'decision.json', make_decision(b))
        base = replay.snapshot_of([replay.replay_one(self.config, self.run, budget=100000)])
        tight = replay.snapshot_of([replay.replay_one(self.config, self.run, budget=20000)])
        self.assertNotEqual(json.dumps(base, sort_keys=True),
                            json.dumps(tight, sort_keys=True))

    def test_small_sample_under_budget_shows_no_change(self):
        """反向保证：样本远低于预算时，调预算不该产生假警报。"""
        base = replay.snapshot_of([replay.replay_one(self.config, self.run, budget=100000)])
        tight = replay.snapshot_of([replay.replay_one(self.config, self.run, budget=50000)])
        self.assertEqual(json.dumps(base['20260101-000000-test0001']['prompt']['chars']),
                         json.dumps(tight['20260101-000000-test0001']['prompt']['chars']))

    def test_iter_runs_classifies_directories(self):
        """空目录/半成品必须被分类，而不是当成可重放轮次。"""
        (self.state / 'runs' / 'empty-dir').mkdir()
        runs = replay.iter_runs(self.state)
        by_name = {r['name']: r for r in runs}
        self.assertFalse(by_name['empty-dir']['evidence'])

    def test_bad_validate_is_captured_not_raised(self):
        """校验失败必须变成结果里的一条记录，不能让整次矩阵重放中断。"""
        import nianlun as n
        d = make_decision(self.bundle)
        d['actions'][0]['title'] = ''      # 触发标题校验失败
        n.save(self.run / 'decision.json', d)
        r = replay.replay_one(self.config, self.run)
        self.assertFalse(r['ok'])
        self.assertIn('validate', r['stages'])
        self.assertTrue(r['stages']['prompt']['ok'], '前面的阶段不该因后面失败而丢失')


if __name__ == '__main__':
    unittest.main()
