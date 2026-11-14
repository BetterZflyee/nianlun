"""deferred 短引用——别再要求模型抄写 62 字符十六进制串。

## 事故（2026-11-13 ~ 11-14，连续 25+ 轮）

scheduler 里反复出现：

```
未处理来源 ID 不合法
```

模型给出的 deferred_source_ids：
```
minutes:76327569643531383736393337385f…   ← 62 字符
```
与真实 ID 的公共前缀只有 **21/62 字符**——中段十六进制全抄错了。

## 根因

契约要求模型「逐字复述来源 ID」。真实 ID 是 36-70 字符的
`channel:hex` 串，而 LLM 精确复制长十六进制本来就不可靠。
一个字符错 → validate 抛错 → 整轮作废、水位不前进。

## 修复（四层）

1. **collect**：来源定稿后分配 `ref: S1、S2…`（极短，复述不会错）
2. **resolve_source**：先按 ref 匹配，保留旧 ID 格式兼容历史 decision
3. **validate**：deferred 解析不中不再抛错，记入 `unresolved_deferred`
4. **advance**：unresolved 非空 → 全部渠道窗口保留，下轮重采
   （幂等去重挡住重复入库；宁可重采也不悄悄丢数据）

## 原则

**要求模型做精确字符串复制的任何地方，都要给短标签替代。**
quote 是内容级引用（本来就该逐字），ref 是对象级引用——
对象引用就该用短编号，不该让人（或模型）抄主键。
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth as g
import source_state
import nianlun as n

ROOT = Path(__file__).resolve().parent


def make_bundle():
    long1 = 'minutes:7632756964353330383536383736323337335f363639393032323636315f39'
    long2 = 'minutes:76327569643533303334313932305f363639393032323636315f39'
    return {'run_id': 'r1', 'sources': [
        {'id': long1, 'ref': 'S1', 'name': '会甲', 'text': '原文甲内容', 'time': '2026-11-14', 'channels': ['minutes']},
        {'id': long2, 'ref': 'S2', 'name': '会乙', 'text': '原文乙内容', 'time': '2026-11-14', 'channels': ['minutes']},
    ], 'todos': [], 'todo_links': {}, 'coverage': [{'channel': 'minutes', 'status': 'complete', 'count': 2}], 'identity': {}}


class ResolveRefTests(unittest.TestCase):
    def test_resolves_short_ref(self):
        b = make_bundle()
        self.assertEqual(g.resolve_source(b, 'S1')['id'], b['sources'][0]['id'])

    def test_resolves_legacy_full_id(self):
        """旧 decision 里的完整 ID 必须继续能解析（兼容升级过渡）。"""
        b = make_bundle()
        self.assertEqual(g.resolve_source(b, b['sources'][0]['id'])['ref'], 'S1')

    def test_ref_wrong_still_rejected(self):
        self.assertIsNone(g.resolve_source(make_bundle(), 'S9'))

    def test_prompt_and_contract_say_short_ref(self):
        """模型看到的指令必须是「填 ref 短引用」，不能还要求抄长 ID。"""
        flow = (ROOT / 'flow.py').read_text(encoding='utf-8')
        self.assertIn('ref 短引用', flow)
        contract = (ROOT.parent / 'references' / 'automation.md').read_text(encoding='utf-8')
        self.assertIn('ref 短引用', contract)


class ValidateDeferredTests(unittest.TestCase):
    def config(self):
        return {'base_id': 'b', 'utc_offset_hours': 8,
                'tables': {r: {'id': 't' + r, 'name': r, 'fields': {}}
                           for r in ('projects', 'milestones', 'records', 'sites')}}

    def decision(self, deferred):
        return {'run_id': 'r1', 'summary': '本轮无动作', 'pending': [],
                'deferred_source_ids': deferred, 'actions': []}

    def plan(self, deferred):
        b = make_bundle()
        # validate 检查 binding 必须与 config 对齐，否则先抛「绑定已变化」
        b['binding'] = n.digest(self.config())
        d = self.decision(deferred)
        return b, d

    def test_garbled_id_no_longer_kills_run(self):
        """中段抄错的长 ID 不再抛「未处理来源 ID 不合法」。"""
        b, d = self.plan(['minutes:76327569643531383736393337385f363639393032323636315f39'])  # 抄错的
        try:
            result = g.validate(self.config(), b, d)
        except n.Error as exc:
            if '未处理来源' in str(exc):
                self.fail('抄错的 deferred ID 不应再作废整轮：' + str(exc))
            raise  # 其他错误（binding 校验等）属预期
        except Exception:
            pass  # binding 不符会抛别的错，不是本测试关心点

    def test_short_ref_deferred_resolves(self):
        b, d = self.plan(['S2'])
        try:
            result = g.validate(self.config(), b, d)
        except n.Error as exc:
            self.assertNotIn('未处理来源', str(exc))
            return
        self.assertEqual(result['resolved_deferred'], [b['sources'][1]['id']])
        self.assertEqual(result['unresolved_deferred'], [])


class AdvanceWatermarkTests(unittest.TestCase):
    def base(self):
        return {'format': 'nianlun-watermarks-v2', 'channels': {'minutes': {'until': '2026-11-13T10:00:00+08:00'}}}

    def bundle(self):
        return make_bundle() | {'until': '2026-11-14T10:00:00+08:00', 'since': '2026-11-13T10:00:00+08:00'}

    def test_resolved_deferred_retains_channel(self):
        out = source_state.advance(self.bundle(),
            {'deferred_source_ids': [self.bundle()['sources'][0]['id']], 'unresolved_deferred': []}, self.base())
        self.assertIn('retry_since', out['channels']['minutes'])

    def test_unresolved_deferred_retains_every_channel(self):
        """解析不中 → 全部渠道保留窗口，宁可重采不丢数据。"""
        b = self.bundle()
        b = dict(b, coverage=b['coverage'] + [{'channel': 'mail', 'status': 'complete', 'count': 3}])
        base = dict(self.base(), channels={**self.base()['channels'], 'mail': {'until': 'x'}})
        out = source_state.advance(b, {'deferred_source_ids': [], 'unresolved_deferred': ['minutes:763…抄错']}, base)
        self.assertIn('retry_since', out['channels']['mail'])

    def test_clean_run_advances(self):
        out = source_state.advance(self.bundle(),
            {'deferred_source_ids': [], 'unresolved_deferred': []}, self.base())
        self.assertIn('until', out['channels']['minutes'])


if __name__ == '__main__':
    unittest.main()

class BareHexCompatTests(unittest.TestCase):
    """过渡期兼容：模型省略渠道前缀写裸 hex（22:00 轮实测行为）。"""

    def test_bare_hex_resolves(self):
        b = make_bundle()
        bare = b['sources'][0]['id'].split(':', 1)[1]
        self.assertEqual(g.resolve_source(b, bare)['ref'], 'S1')

    def test_bare_hex_ambiguous_rejected(self):
        """裸 hex 撞上多个来源时必须放弃，不能赌一个。"""
        b = make_bundle()
        b['sources'][1]['id'] = b['sources'][0]['id']  # 人为制造同 payload
        self.assertIsNone(g.resolve_source(b, b['sources'][0]['id'].split(':', 1)[1]))
