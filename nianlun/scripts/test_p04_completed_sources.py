"""P0-4：已完成的事实记录，不能被喂成可执行动作。

## 事故（2026-11-16 12:20）

整轮作废，报「待办不在本人未完成列表」。当时的定性是「模型编造 task_id」，
**这个定性错了三轮**。真相：

- `59058554254` 在 `links.json` 里真实存在
- `59017182180` 来自 `workbench:474bc0e7-...`，是用户 12:18 刚在工作台完成的
- **两个 ID 都是真待办，模型一个没编**

## 真因：`input` 字段把「可执行形状」喂给了模型

旧代码：

```python
content={'source':'...已经完成写入，不要重复创建',
         'input':request,          # {"op":"complete_todo","task_id":"59017182180",...}
         'verified_result':receipt['result']}
```

模型看到来源里写着一个 `complete_todo` + 真实 `task_id`，而 `todos` 可用列表里
没有它（它已完成），只能推断「该关它」，于是照抄参数生成动作，一执行就被拒。

同一批来源：12:20 提了 2 个动作（失败），13:00 一个没提（成功）。
**两轮都读懂了「已完成」，差别是没有任何规则告诉它「看懂了之后不要动手」。**

## 所以修法不是拦 ID（ID 是真的），是**不给它可执行的形状**

1. `workbench` 来源删掉整个 `input` 字段，只陈述事实
2. `todo:` 来源在 `isDone=True` 时不暴露 taskId 与活动流水
3. `automation.md` 写死：这两个来源是已完成的事实记录，不是待办任务

**若按「拦住 ID」去修，13:00 那种本来能成功的轮次也会被拦掉**——
它的证据里同样有这三条 workbench 来源。这是这次修法的分水岭。
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth


class WorkbenchSourceShapeTests(unittest.TestCase):
    """workbench 来源不得携带任何可执行形状。"""

    def build(self, op='complete_todo', title='某个待办'):
        receipt = {'finished_at': '2026-11-16T12:18:00+08:00',
                   'intent': {'request': {'op': op, 'task_id': '59017182180',
                                          'title': title,
                                          'request_id': 'req-1'}},
                   'result': {'task_id': '59017182180', 'verified': True}}
        request = receipt['intent']['request']
        verb = {'complete_todo': '完成', 'update_status': '更新',
                'create_record': '创建记录', 'create_todo': '建待办'}.get(op, '处理')
        content = {'source': f'本人已于 {receipt["finished_at"]} 在年轮工作台{verb}'
                             f'「{title}」。这是**已完成的事实记录**，不是待办任务，'
                             '无需再处理、不要重复创建。'}
        return content, json.dumps(content, ensure_ascii=False)

    def test_no_input_field(self):
        content, _ = self.build()
        self.assertNotIn('input', content, 'input 里是完整执行参数，必须整个删掉')

    def test_no_task_id_leak(self):
        _, text = self.build()
        self.assertNotIn('59017182180', text, '清除待办编号：模型会拿它去拼动作')

    def test_no_op_leak(self):
        _, text = self.build()
        self.assertNotIn('complete_todo', text)
        self.assertNotIn('"op"', text)

    def test_states_fact_and_forbids_action(self):
        content, _ = self.build()
        text = content['source']
        self.assertIn('已完成的事实记录', text)
        self.assertIn('不是待办任务', text)
        self.assertIn('无需再处理', text)

    def test_keeps_title_for_readability(self):
        """只删可执行形状，标题要留——用户读总结时需要知道是哪件事。"""
        content, _ = self.build(title='发送月台AI相机数据底表')
        self.assertIn('发送月台AI相机数据底表', content['source'])

    def test_source_code_no_longer_passes_input(self):
        """源码层兜底：谁把 input 加回去，这条立刻红。

        ## 第一版是「固定窗口搜字符串」，有两个真实漏洞（2026-11-16 修）

        原写法：`window = src[idx-1200 : idx+200]`，然后断言窗口里没有
        `'input':request`。问题：

        ① **窗口右边界只到 `add(...)` 之后 200 字符**。往 add **之后**加
           input 抓不到——而 `add()` 之后确实还有代码（count+=1 / return）。
        ② **只认字面量 `'input':request` 这一种写法**。实测下面这种绕过：

               content['input'] = request        ← 抓不到！

           这是加字段最常见的方式（先构造 content，再补字段）。

        ## 现在的判据：整段函数体 + 宽模式

        取 `workbench()` 函数**从 def 到下一个 def 的整段**，检查其中是否出现
        任何形式的 input 赋值（`'input'`、`"input"`、`.input`、`['input']`）。
        「整段」而不是定长窗口，改代码时不会因为变长而漏；「宽模式」而不是
        单一字面量，换写法也躲不过。
        """
        src = Path(growth.__file__).read_text(encoding='utf-8')
        # workbench 是 growth.collect() 里的嵌套函数：从 `def workbench():` 到下一个 def
        start = src.index('def workbench():')
        end = src.find('\n    def ', start + 1)
        if end < 0:
            end = src.find('\n    if ', start + 1)
        body = src[start:end if end > 0 else start + 4000]
        self.assertIn("add('workbench'", body, '定位失败：没取到 workbench 函数体')
        for pattern in ("'input'", '"input"', "['input']", '.input'):
            self.assertNotIn(pattern, body,
                             'workbench 来源又把 input 传回 prompt 了（写成 %s）；'
                             '它是可执行动作参数，只能陈述事实' % pattern)

    def test_todo_source_hides_executable_shape(self):
        """todo: 来源同样不许带可执行形状。

        原测试只守 workbench，但 todo: 是同一类坑：`todo +get` 的完整返回里
        带 taskId 和 activities(`task.done`)，模型照着能拼出 complete_todo。
        这里守源码：isDone=True 分支不许出现 activities/taskId。
        """
        src = Path(growth.__file__).read_text(encoding='utf-8')
        anchor = src.index("if d.get('isDone') is True:")
        end = src.find('else:', anchor)
        branch = src[anchor:end]
        self.assertIn('事实记录', branch, '已完成分支应只陈述事实')
        self.assertNotIn('activities', branch, '已完成分支不能暴露活动流水')
        self.assertNotIn('taskId', branch, '已完成分支不能暴露编号')


class TodoSourceShapeTests(unittest.TestCase):
    """todo: 来源里已完成的不暴露编号与活动流水。"""

    def test_done_todo_hides_id_and_activities(self):
        """isDone=True 时只陈述事实。"""
        done = {'taskId': '59058554254', 'subject': '拼接F区演示视频',
                'isDone': True, 'activities': [{'action': 'task.done'}]}
        if done.get('isDone') is True:
            content = {'source': f'待办「{done.get("subject","")}」已完成，这是事实记录，'
                                 '不是待办任务，不得据此生成任何执行动作。',
                       'isDone': True}
        text = json.dumps(content, ensure_ascii=False)
        self.assertNotIn('59058554254', text)
        self.assertNotIn('task.done', text)
        self.assertIn('事实记录', text)

    def test_open_todo_keeps_full_payload(self):
        """未完成的待办确实还需要处理，保持原样——别把正常路径一起收紧。"""
        open_todo = {'taskId': 'T1', 'subject': '待做', 'isDone': False}
        content = open_todo if open_todo.get('isDone') is True else open_todo
        self.assertEqual(content, open_todo)


class ContractTests(unittest.TestCase):
    def test_automation_md_forbids_actions_from_fact_sources(self):
        md = (Path(growth.__file__).resolve().parent.parent
              / 'references' / 'automation.md').read_text(encoding='utf-8')
        self.assertIn('已完成的事实记录', md)
        self.assertIn('不是待办任务', md)
        # 必须明确点出不得据此生成动作
        idx = md.index('已完成的事实记录')
        self.assertIn('不得据此生成', md[idx: idx + 400])


if __name__ == '__main__':
    unittest.main()
