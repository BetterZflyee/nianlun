"""别人拿到年轮，用他自己的表结构也能直接跑。

## 飞哥的要求（2026-11-09）

> 我说的这个可移植，是指我的这个产品可以作为一个开源产品，它都是能够拿去用，
> 而且根据每个记录表的维度不一样，就可以直接去生长。

## 原来的问题

`bind()` 只认 `FIELDS` 里预设的中文别名：

```python
FIELDS = {'records': {'title': ['标题','反馈内容','记录内容','事项'], ...}}
```

用户表里要是叫「工单标题」「归属项目」「发生时间」，绑定直接报
「缺少字段：status, title」——**换个人用就跑不起来**。

## 改法：三层匹配，逐层放宽

| 层 | 依据 | 优先级 |
|---|---|---|
| ① 显式映射 `field_mapping` | 用户/向导指定 | 最高 |
| ② 别名匹配 `FIELDS` | 常见中文列名 | 中 |
| ③ **结构推断** | 列类型 + 语义线索 | 兜底 |

③ 是可移植性的关键。**列类型在钉钉表里是唯一的**：
- 关联列只可能是 `bidirectionalLink`/`unidirectionalLink`
- 日期列只可能是 `date`/`createdTime`/`modifiedTime`
- 人员列是 `user`/`creator`
- 关联目标表能从 `linkedTableId` 直接读出来，比列名可靠

## 实测

一张列名为「工单标题/归属项目/发生时间/处理状态/问题分类/详细说明」的表：

```
title        ← 工单标题
project_ids  ← 归属项目     （靠 linkedTableId 判断连的是项目表）
date         ← 发生时间     （靠类型）
status       ← 处理状态
kind         ← 问题分类
description  ← 详细说明
```

**没有改任何配置，全部自动识别。**

## 一条克制

推断不出来就留空，不硬凑。语义线索并列时放弃——宁可缺字段让用户补，
也不要猜错把数据写进错误的列。报错里会列出「已识别 N 列」和怎么补。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import nianlun as n


class FakeClient:
    profile = 'test'

    def __init__(self, record_fields):
        self.record_fields = record_fields

    def call(self, args):
        return {'tables': [
            {'tableId': 't1', 'tableName': '项目主表'},
            {'tableId': 't2', 'tableName': '里程碑表'},
            {'tableId': 't3', 'tableName': '场地表'},
            {'tableId': 't4', 'tableName': '项目记录表'},
        ]}

    def fields(self, base, tid):
        if tid == 't1':
            return [{'fieldId': 'p1', 'fieldName': '项目名称', 'type': 'text'},
                    {'fieldId': 'p2', 'fieldName': '项目状态', 'type': 'singleSelect',
                     'config': {'options': [{'name': '进行中'}]}}]
        if tid == 't2':
            return [{'fieldId': 'm1', 'fieldName': '里程碑名称', 'type': 'text'},
                    {'fieldId': 'm2', 'fieldName': '所属项目', 'type': 'unidirectionalLink',
                     'config': {'linkedTableId': 't1'}},
                    {'fieldId': 'm3', 'fieldName': '目标日期', 'type': 'date'},
                    {'fieldId': 'm4', 'fieldName': '进度状态', 'type': 'singleSelect',
                     'config': {'options': [{'name': '待核'}]}}]
        if tid == 't3':
            return [{'fieldId': 's1', 'fieldName': '场地名称', 'type': 'text'},
                    {'fieldId': 's2', 'fieldName': '归属项目', 'type': 'bidirectionalLink',
                     'config': {'linkedTableId': 't1'}}]
        return self.record_fields


def bind(client):
    return n.bind(client, 'base1', 'https://alidocs.dingtalk.com/i/nodes/base1',
                  mapping={'projects': 't1', 'milestones': 't2',
                           'sites': 't3', 'records': 't4'})


UNFAMILIAR = [
    {'fieldId': 'r1', 'fieldName': '工单标题', 'type': 'text'},
    {'fieldId': 'r2', 'fieldName': '归属项目', 'type': 'bidirectionalLink',
     'config': {'linkedTableId': 't1'}},
    {'fieldId': 'r3', 'fieldName': '发生时间', 'type': 'date'},
    {'fieldId': 'r4', 'fieldName': '处理状态', 'type': 'singleSelect',
     'config': {'options': [{'name': '开放'}]}},
    {'fieldId': 'r5', 'fieldName': '问题分类', 'type': 'singleSelect',
     'config': {'options': [{'name': '硬件'}]}},
    {'fieldId': 'r6', 'fieldName': '详细说明', 'type': 'text'},
]


class OpenSchemaTests(unittest.TestCase):
    def test_unfamiliar_names_bind(self):
        """列名完全不在预设别名里，也必须能绑定。"""
        cfg = bind(FakeClient(UNFAMILIAR))
        self.assertIn('records', cfg['tables'])

    def test_title_inferred_from_semantics(self):
        fields = bind(FakeClient(UNFAMILIAR))['tables']['records']['fields']
        self.assertEqual(fields['title']['fieldName'], '工单标题')

    def test_link_inferred_from_linked_table(self):
        """关联列靠 linkedTableId 判断连的是谁，比列名可靠。"""
        fields = bind(FakeClient(UNFAMILIAR))['tables']['records']['fields']
        self.assertEqual(fields['project_ids']['fieldName'], '归属项目')

    def test_date_inferred_from_type(self):
        fields = bind(FakeClient(UNFAMILIAR))['tables']['records']['fields']
        self.assertEqual(fields['date']['fieldName'], '发生时间')

    def test_status_and_kind_inferred(self):
        fields = bind(FakeClient(UNFAMILIAR))['tables']['records']['fields']
        self.assertEqual(fields['status']['fieldName'], '处理状态')
        self.assertEqual(fields['kind']['fieldName'], '问题分类')

    def test_does_not_guess_when_ambiguous(self):
        """两列语义并列时宁可留空，也不要猜错写进错误的列。"""
        ambiguous = [
            {'fieldId': 'r1', 'fieldName': '标题甲', 'type': 'text'},
            {'fieldId': 'r2', 'fieldName': '标题乙', 'type': 'text'},
            {'fieldId': 'r3', 'fieldName': '归属项目', 'type': 'bidirectionalLink',
             'config': {'linkedTableId': 't1'}},
            {'fieldId': 'r4', 'fieldName': '处理状态', 'type': 'singleSelect',
             'config': {'options': [{'name': '开放'}]}},
        ]
        with self.assertRaises(n.Error):
            bind(FakeClient(ambiguous))

    def test_error_message_explains_how_to_fix(self):
        """推断不出来时，报错要说「已识别几列」和怎么补。"""
        bare = [
            {'fieldId': 'r1', 'fieldName': '归属项目', 'type': 'bidirectionalLink',
             'config': {'linkedTableId': 't1'}},
        ]
        with self.assertRaises(n.Error) as ctx:
            bind(FakeClient(bare))
        msg = str(ctx.exception)
        self.assertIn('缺少字段', msg)
        self.assertIn('--field-map', msg)


if __name__ == '__main__':
    unittest.main()
