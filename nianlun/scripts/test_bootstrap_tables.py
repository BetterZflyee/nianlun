"""一键建表：别人拿到年轮不用手工建四张表。

## 为什么要有这个

年轮的「四张表」原来必须手工建、手工绑，字段还得包含关联关系，错一个就跑不起来。
飞哥 2026-11-09 定：要作为开源产品被人拿去用，就必须**开箱即跑**。

## 两个设计要点

**① 分两阶段建，因为关联字段依赖表 ID**
钉钉关联字段要填 `linkedTableId`，而表 ID 建完表才有。所以先建四张表和
所有普通字段，拿到 ID 后再补关联字段。

**② 幂等**
重复执行不重建：已有表按名字复用、已有字段跳过。所以「建到一半失败」
再跑一次是安全的。

## 字段模板为什么是这个形状

- 第一列必须是能当文档列的文本（钉钉要求首列是 primaryDoc）
- 状态/类型用单选，选项对齐**真实数据里出现过的值**
  （如里程碑用「待核/待核对/未开始/进行中/已达成/已延期」——
  这些是从 200 条真实里程碑统计出来的，不是拍脑袋编的）
- 关联关系：里程碑→项目/场地，场地→项目，记录→项目/场地/里程碑
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bootstrap


class FakeGateway:
    """按 DWS 真实返回结构模拟建表。"""
    profile = 'test'

    def __init__(self):
        self.tables = []
        self.fields = {}
        self._tid = 0
        self._fid = 0

    def call(self, args):
        cmd = ' '.join(args[:3])
        if cmd == 'aitable base create':
            return {'baseId': 'BASE1',
                    'baseUrl': 'https://alidocs.dingtalk.com/i/nodes/BASE1'}
        if cmd == 'aitable table create':
            self._tid += 1
            tid = f'T{self._tid}'
            name = args[args.index('--name') + 1]
            rows = json.loads(args[args.index('--fields') + 1])
            self.tables.append({'tableId': tid, 'tableName': name})
            self.fields[tid] = []
            for row in rows:
                self._fid += 1
                self.fields[tid].append({
                    'fieldId': f'F{self._fid}', 'fieldName': row['fieldName'],
                    'type': row['type'], 'config': row.get('config') or {}})
            return {'tableId': tid}
        if cmd == 'aitable field create':
            tid = args[args.index('--table-id') + 1]
            name = args[args.index('--name') + 1]
            cfg = json.loads(args[args.index('--config') + 1])
            self._fid += 1
            self.fields[tid].append({'fieldId': f'F{self._fid}', 'fieldName': name,
                                     'type': 'bidirectionalLink', 'config': cfg})
            return {'ok': True}
        if cmd == 'aitable field get':
            tid = args[args.index('--table-id') + 1]
            return {'fields': self.fields.get(tid, [])}
        if cmd == 'aitable table get':
            return {'tables': self.tables}
        return {}


class BootstrapTests(unittest.TestCase):
    def build(self):
        gw = FakeGateway()
        binding = bootstrap.build({'growth': {'keep': 1}}, gw, name='测试基座', settle=0)
        return gw, binding

    def test_creates_four_tables(self):
        gw, _ = self.build()
        names = [t['tableName'] for t in gw.tables]
        for expected in ('项目主表', '里程碑表', '场地表', '项目记录表'):
            self.assertIn(expected, names)

    def test_every_template_field_is_created(self):
        _, binding = self.build()
        for role, row in bootstrap.coverage(binding).items():
            self.assertEqual(row['have'], row['want'],
                             f'{role} 少建了字段：{row["have"]}/{row["want"]}')

    def test_links_point_to_right_tables(self):
        """关联字段必须指向正确的表，指错等于数据错乱。"""
        gw, binding = self.build()
        ids = {t['tableName']: t['tableId'] for t in gw.tables}
        records = binding['tables']['records']['fields']
        self.assertEqual(records['project_ids']['config']['linkedTableId'],
                         ids['项目主表'])
        self.assertEqual(records['site_ids']['config']['linkedTableId'],
                         ids['场地表'])
        self.assertEqual(records['milestone_ids']['config']['linkedTableId'],
                         ids['里程碑表'])

    def test_status_options_match_real_data(self):
        """里程碑状态选项要覆盖真实数据里出现过的值。

        真实 200 条：待核 83 / 未开始 66 / 进行中 18 / 待核对 15 /
        已延期 12 / 已达成 8。少一个选项，写入就会被 DWS 拒绝。
        """
        _, binding = self.build()
        fields = binding['tables']['milestones']['fields']
        options = [o['name'] for o in fields['status']['config']['options']]
        for real in ('待核', '待核对', '未开始', '进行中', '已达成', '已延期'):
            self.assertIn(real, options, f'缺状态选项 {real}')

    def test_binding_is_usable_format(self):
        """产出的配置必须能直接被 bind 的结果消费。"""
        _, binding = self.build()
        self.assertEqual(binding['format'], 'nianlun-binding-v1')
        self.assertTrue(binding['base_id'])
        for role in ('projects', 'milestones', 'sites', 'records'):
            self.assertIn('id', binding['tables'][role])
            self.assertIn('fields', binding['tables'][role])

    def test_preserves_runtime_settings(self):
        """重新建表不能把 growth/harness 这些运行时设置冲掉。"""
        _, binding = self.build()
        self.assertEqual(binding['growth'], {'keep': 1})

    def test_required_fields_present(self):
        """REQUIRED 里列的必填字段，建出来的表必须都有。"""
        _, binding = self.build()
        for role, required in n_required().items():
            have = set(binding['tables'][role]['fields'])
            missing = set(required) - have
            self.assertFalse(missing, f'{role} 缺必填字段 {missing}')


def n_required():
    import nianlun as n
    return n.REQUIRED


if __name__ == '__main__':
    unittest.main()
