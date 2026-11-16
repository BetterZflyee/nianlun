"""P0-5：静默误完成——拿同项目的无关记录去关闭待办。

## 这是五个 P0 里唯一「数据错了且用户看不见」的一条

原校验只要求 `record_ids` 里的记录**属于同一个项目**：

```python
for rid in a['record_ids']:
    if not any(r['id']==rid and p['id'] in r.get('project_ids',[]) for r in ...):
        raise n.Error('完成待办的记录关联不正确')
```

项目 3cffHOuyfg 下有 **157 条记录**。实测复现（2026-11-16）：

```
待办 59017102394「[具身智能应用] 联系李岳天确认和记场地编码及机器狗需求范围」
记录 0g5CjlxEen「安排倒车辅助激光雷达方案评审会议」
→ validate 通过，待办被关，记录被标已解决
```

用户在界面上看不出这条关闭有什么问题——两条都是同项目的合法记录。
**「任取一条都能过」等于没有校验。**

## 两条修法

**① 证据闭环**：完成为 A 待办，证据必须来自 A 自己的来源（`todo:<task_id>`）。
没有这条，「群聊里说了某件事完成」就能关任意一条待办——拿 A 的证据关 B 最容易发生。

**② 语义相关**：记录内容必须与待办说的是同一件事，或指向本轮新建的记录。
判定用**实词二字重合**，不用相似度模型——validate 在 apply 里会重跑生成 fresh plan，
两次必须字节一致（教训 72），所以只允许纯函数、确定性变换。

## 阈值取舍

`至少一对二字词重合` 是刻意取松的：再严会误杀「待办要反馈数据、记录写的是数据底表已发」
这类正常情况；而完全不相关的两件事，连一个二字词都不会共享。

用 8 组**真实已登记的待办↔记录**关联检验：记录仍在证据里的 2 组全部认得，0 误杀。
（另 6 条记录已归档、不在当前 evidence，会先被「记录关联不正确」拦下，走不到这一步。）
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import nianlun as n


def bundle(records, todos, links=None):
    return {
        'run_id': 'r1',
        'tables': {
            'projects': [{'id': 'P1', 'title': '甲项目'}],
            'records': records,
            'milestones': [], 'sites': [],
        },
        'todos': todos,
        'todo_links': links or {},
        'sources': [],
    }


class RecordMatchesTodoTests(unittest.TestCase):
    def test_unrelated_record_does_not_match(self):
        """核心：同项目但不同事，必须判不相关。"""
        b = bundle(
            [{'id': 'R1', 'title': '安排倒车辅助激光雷达方案评审会议',
              'project_ids': ['P1'], 'description': '', 'solution': ''}],
            [])
        self.assertFalse(
            g._record_matches_todo(b, 'R1',
                                   '[具身智能应用] 联系李岳天确认和记场地编码及机器狗需求范围'))

    def test_related_record_matches(self):
        b = bundle(
            [{'id': 'R1', 'title': '南昌转笼中心道闸相机无车牌率>30%且重复上报严重',
              'project_ids': ['P1'], 'description': '', 'solution': ''}],
            [])
        self.assertTrue(
            g._record_matches_todo(
                b, 'R1', '[车辆自动解封] 协同海康排查南昌转笼中心道闸相机无车牌率>30%及重复上报问题'))

    def test_missing_record_is_not_a_match(self):
        b = bundle([], [])
        self.assertFalse(g._record_matches_todo(b, 'NOPE', '任何待办'))

    def test_empty_record_text_is_not_a_match(self):
        """记录正文全空时不能算相关——那是「没证据」不是「证据吻合」。"""
        b = bundle([{'id': 'R1', 'title': '', 'description': '', 'solution': '',
                     'project_ids': ['P1']}], [])
        self.assertFalse(g._record_matches_todo(b, 'R1', '某个待办标题'))

    def test_is_deterministic(self):
        """同一输入两次必须字节一致：validate 会重跑生成 fresh plan。"""
        b = bundle([{'id': 'R1', 'title': '月台摄像头模糊调整培训',
                     'project_ids': ['P1'], 'description': '', 'solution': ''}], [])
        first = g._record_matches_todo(b, 'R1', '组织月台摄像头模糊调整操作培训并输出SOP')
        second = g._record_matches_todo(b, 'R1', '组织月台摄像头模糊调整操作培训并输出SOP')
        self.assertEqual(first, second)

    def test_english_and_digits_also_count(self):
        b = bundle([{'id': 'R1', 'title': '571WA 三台 IP 错误设备已修正',
                     'project_ids': ['P1'], 'description': '', 'solution': ''}], [])
        self.assertTrue(g._record_matches_todo(b, 'R1', '确认571WA设备的正确IP'))


class GenericTermTests(unittest.TestCase):
    """项目通用词必须剔除，否则「同项目」会被误当成「同一件事」。

    ## 为什么拿这几组当护栏

    2026-11-16 第一版阈值取 1（任意一对二字词重合），我用**单个样本**证明它
    有效——那条样本和待办一个词都不共享，是极端值。产品拿同一条待办试它所属
    项目的全部 21 条记录：**放行 16 条 = 76%**，因为「机器狗」这个词在同项目
    每条记录里都有。全局 40 条待办放行 51.3%。

    下面这几条就是那批误放样本，全部必须在**有同项目其他记录作为背景**时被拒
    ——只有背景存在，「通用词」才有意义。
    """

    # 一个 157 条记录量级的项目：这些领域词反复出现
    BACKGROUND = [
        '机器狗POC需输出含ROI的定型报告并优化避障安全',
        '约教授及合伙人沟通机器狗合作与试点定型，并发送会邀',
        '同步深大方提供一台巡检机器狗用于和记需求',
        '马龙机器人算法受环境光干扰，微调量超预期10倍',
        '核对超脑配置参数并按文档添加月台相机',
        '梁玉标确认月台AI相机装载率以卸车为主',
        '组织各场地月台摄像头统一调整',
        '场地机器狗巡检路线确认',
    ]

    def build(self, extra):
        rows = [{'id': 'R%d' % i, 'title': t, 'project_ids': ['P1'],
                 'description': '', 'solution': ''}
                for i, t in enumerate(self.BACKGROUND)]
        rows.append({'id': 'TARGET', 'title': extra, 'project_ids': ['P1'],
                     'description': '', 'solution': ''})
        return bundle(rows, [])

    def test_machine_dog_records_are_rejected(self):
        """「机器狗」是项目领域词，共用它不能证明是同一件事。"""
        for title in ('机器狗POC需输出含ROI的定型报告并优化避障安全',
                      '约教授及合伙人沟通机器狗合作与试点定型，并发送会邀'):
            b = self.build(title)
            self.assertFalse(
                g._record_matches_todo(
                    b, 'TARGET', '[具身智能应用] 联系李岳天确认和记场地编码及机器狗需求范围'),
                '共用「机器狗」却被放行：' + title)

    def test_month_platform_records_are_rejected(self):
        """「月台」「相机」同理。"""
        for title in ('核对超脑配置参数并按文档添加月台相机',
                      '梁玉标确认月台AI相机装载率以卸车为主'):
            b = self.build(title)
            self.assertFalse(
                g._record_matches_todo(
                    b, 'TARGET',
                    '[车辆靠(离)卡调度] 组织面向各场地的月台摄像头模糊调整操作培训并输出SOP'),
                '共用「月台/相机」却被放行：' + title)

    def test_generic_terms_are_computed_by_ratio_not_absolute_count(self):
        """通用词必须按**占比**算，不能按绝对次数。

        实测：157 条记录的项目按「出现 ≥3 次即通用」会产出 308 个通用词，
        「数据」(58次)、「验证」(47次)、「计划」全被判成通用，「发送数据验证计划
        给罗兴成」这条真配对只剩 1 个特有词而被误杀。3/157 = 1.9% 显然不通用。
        """
        # 60 条记录的项目里，下面 4 个词只出现在 4/60 = 6.7% 的记录里
        rows = [{'id': 'R%d' % i, 'title': '无关记录%d号' % i,
                 'project_ids': ['P1'], 'description': '', 'solution': ''}
                for i in range(60)]
        for i, title in enumerate(['发送数据验证计划给海康同事',
                                   '数据验证计划已发',
                                   '发送数据验证计划给对方',
                                   '发送数据验证计划给罗兴成']):
            rows.append({'id': 'D%d' % i, 'title': title, 'project_ids': ['P1'],
                         'description': '', 'solution': ''})
        rows.append({'id': 'TARGET', 'title': '发送数据验证计划给罗兴成',
                     'project_ids': ['P1'], 'description': '', 'solution': ''})
        b = bundle(rows, [])
        self.assertTrue(
            g._record_matches_todo(b, 'TARGET', '[车辆靠(离)卡调度] 发送数据验证计划给罗兴成'),
            '真配对被通用词误杀：占比口径没生效')

    def test_paraphrase_still_matches(self):
        """同义改写必须还能认：「以便加入」vs「以录入」几乎一字不差。

        这条守的是「别把误关换成关不掉」。实测这对：
            待办 提供执行人员清单以录入转运小智系统
            记录 提供执行人员清单以便加入转运小智系统
        除了那四字几乎完全相同，但「转运」「小智」「清单」「提供」在该项目里
        全是高频词，特有词被清空 → 只靠特有词会判死。
        """
        rows = [{'id': 'R%d' % i, 'title': t, 'project_ids': ['P1'],
                 'description': '', 'solution': ''}
                for i, t in enumerate([
                    '提供测试人员清单用于录入转运小智系统',
                    '转运小智系统对接联调完成',
                    '转运小智工单推送上线',
                    '小智系统权限开通',
                    '转运小智执行人员已录入',
                ])]
        rows.append({'id': 'TARGET', 'title': '提供执行人员清单以便加入转运小智系统',
                     'project_ids': ['P1'], 'description': '', 'solution': ''})
        b = bundle(rows, [])
        self.assertTrue(
            g._record_matches_todo(b, 'TARGET', '[转运小智] 提供执行人员清单以录入转运小智系统'))

    def test_scoring_is_pure(self):
        """validate 会重跑生成 fresh plan，两次必须字节一致。"""
        b = self.build('机器狗POC需输出含ROI的定型报告并优化避障安全')
        subject = '[具身智能应用] 联系李岳天确认和记场地编码及机器狗需求范围'
        first = g._record_matches_todo(b, 'TARGET', subject)
        second = g._record_matches_todo(b, 'TARGET', subject)
        self.assertEqual(first, second)


class SourceClosureTests(unittest.TestCase):
    """证据必须与待办闭环：不能用 A 的来源去关 B。

    没有这条，「群聊里说某件事完成了」就能关任意一条待办。
    """

    def config(self):
        return {
            'base_id': 'b', 'tables': {
                'projects': {'id': 'tp', 'fields': {'title': {'fieldId': 'pt'},
                                                    'status': {'fieldId': 'ps', 'type': 'singleSelect',
                                                               'config': {'options': [{'name': '进行中'}]}}}},
                'records': {'id': 'tr', 'fields': {
                    'title': {'fieldId': 'T'}, 'description': {'fieldId': 'D'},
                    'project_ids': {'fieldId': 'P'}, 'status': {'fieldId': 'S'},
                }},
                'milestones': {'id': 'tm', 'fields': {}},
                'sites': {'id': 'ts', 'fields': {}},
            },
        }

    def base_bundle(self):
        return {
            'run_id': 'r1', 'binding': n.digest(self.config()),
            'tables': {
                'projects': [{'id': 'P1', 'title': '甲项目'}],
                'records': [{'id': 'R1', 'title': '群聊里提到某件事',
                             'project_ids': ['P1'], 'description': '', 'solution': ''}],
                'milestones': [], 'sites': [],
                'fields': {},
            },
            'todos': [{'taskId': 'T1', 'subject': '[甲项目] 某待办', 'source_id': 'todo:T1'}],
            'todo_links': {},
            'sources': [{'id': 'chat:abc', 'ref': 'S1', 'name': '群聊',
                         'text': '某件事已经完成了', 'channels': ['groups']},
                        {'id': 'todo:T1', 'ref': 'S2', 'name': '待办T1',
                         'text': '待办「[甲项目] 某待办」已完成', 'channels': ['todo']}],
        }

    def decision(self, source_ref, record_ids):
        return {'run_id': 'r1', 'summary': 'x', 'pending': [],
                'deferred_source_ids': [],
                'actions': [{'op': 'complete_todo', 'task_id': 'T1', 'project': '甲项目',
                             'match': 'unique', 'completion': 'explicit',
                             'expected_title': '[甲项目] 某待办',
                             'record_ids': record_ids, 'source_id': source_ref,
                             'quote': '某件事已经完成了' if source_ref == 'S1'
                                      else '待办「[甲项目] 某待办」已完成'}]}

    def test_other_todo_source_cannot_close_this_todo(self):
        """拿 todo:B 的完成状态去关 todo:A，必须拒绝。"""
        b = self.base_bundle()
        b['sources'].append({'id': 'todo:T2', 'ref': 'S3', 'name': '另一条待办',
                             'text': '某件事已经完成了', 'channels': ['todo']})
        decision = self.decision('S3', ['R1'])
        decision['actions'][0]['quote'] = '某件事已经完成了'
        with self.assertRaises(n.Error) as ctx:
            g.validate(self.config(), b, decision)
        self.assertIn('不能用另一条待办', str(ctx.exception))

    def test_chat_source_is_still_allowed(self):
        """**关键回归**：群聊/邮件/听记说「这件事完成了」是合法证据。

        实测 398 条待办只有 8 条登记在 links.json，collect 只对已登记的调
        todo:+get，所以 391 条**压根没有 todo: 来源**。若强制
        source_id == todo:<task_id>，这 391 条即使证据确凿也永远关不掉——
        改严把人堵死，比原来的漏洞更糟。这里守住「不许堵死」。
        """
        b = self.base_bundle()
        decision = self.decision('S1', ['R1'])
        with self.assertRaises(n.Error) as ctx:
            g.validate(self.config(), b, decision)
        message = str(ctx.exception)
        self.assertNotIn('不能用另一条待办', message)
        # 应被语义相关拦下（R1 与待办确实无关），而不是被来源闭环拦下
        self.assertIn('不是同一件事', message)

    def test_rule_exists_in_source(self):
        src = Path(g.__file__).read_text(encoding='utf-8')
        self.assertIn('不能用另一条待办', src)
        self.assertIn('要同步的记录与这条待办不是同一件事', src)

if __name__ == '__main__':
    unittest.main()
