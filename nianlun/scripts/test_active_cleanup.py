"""active.json 必须在任何情况下被清理。

`active.json` 是「有未完成任务」的标记，`collect` 看到它就拒绝启动新一轮：

    if pending.exists():
        ...return {'resumed':True, **n.load(pending)}

原来清理只在 `finish` 函数正常走完时执行，而下面这些都会中途抛错：

- 模型返回空结果（实测 2026-11-07 03:08 那轮：`{"type":"final","text":""}`）
- 组织身份发生变化
- 动作未全部验证
- `build_home` 渲染失败

一旦抛错，标记永久残留，**之后每一轮都卡在「已有未完成的生长任务」**——
这是能让产品彻底停摆的缺陷，而且日志里只说这一句，看不出根因。
"""
import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import growth


class ActiveCleanupTests(unittest.TestCase):
    def test_finish_wraps_body_in_try_finally(self):
        """清理必须放在 finally 里，不能只在成功路径执行。"""
        src = inspect.getsource(growth.finish)
        self.assertIn('try:', src, 'finish 要有 try 保护')
        self.assertIn('finally:', src, '清理必须放 finally')
        self.assertIn("active.json", src)
        self.assertIn('unlink(missing_ok=True)', src)

    def test_cleanup_runs_even_when_body_raises(self):
        """真正的行为验证：内层抛错，active.json 仍被删除。"""
        import tempfile
        from unittest.mock import patch

        with tempfile.TemporaryDirectory() as tmp:
            config = {'growth': {'state_dir': tmp}, 'base_id': 'b'}
            marker = Path(tmp) / 'active.json'
            marker.write_text('{"run_dir": "/nonexistent"}', encoding='utf-8')

            def boom(*args, **kwargs):
                raise RuntimeError('模拟模型返回空结果')

            with patch.object(growth, '_finish', boom):
                with self.assertRaises(RuntimeError):
                    growth.finish(config, '/tmp/x', '/tmp/y')

            self.assertFalse(marker.exists(), '抛错后 active.json 必须被删除')

    def test_cleanup_runs_on_success(self):
        import tempfile
        from unittest.mock import patch

        with tempfile.TemporaryDirectory() as tmp:
            config = {'growth': {'state_dir': tmp}, 'base_id': 'b'}
            marker = Path(tmp) / 'active.json'
            marker.write_text('{}', encoding='utf-8')

            with patch.object(growth, '_finish', lambda *a, **k: {'status': 'complete'}):
                result = growth.finish(config, '/tmp/x', '/tmp/y')

            self.assertEqual(result['status'], 'complete')
            self.assertFalse(marker.exists())

    def test_collect_refuses_when_marker_present(self):
        """文档化前提：标记存在时 collect 真的会拒绝。"""
        src = inspect.getsource(growth.collect)
        self.assertIn("pending.exists()", src)
        self.assertIn('已有未完成的生长任务', src)


class GrowFailureCleanupTests(unittest.TestCase):
    """grow 在 finish 之前失败，也必须清理 active.json。

    `g.finish()` 是 grow 的倒数第二步。在它之前有采集、记忆检索、倒排、
    报告生成、工作台渲染等多个环节，任一环节抛错都不会走到 finish，
    标记就残留——之后每小时 tick 都以为有任务在跑，系统静默空转。

    scheduler 里虽然也清，但只在连续失败到 MAX_ATTEMPTS(3) 时才清，
    前两次失败期间系统一样是卡住的。
    """

    def test_grow_wraps_body_in_try_except(self):
        import inspect
        import flow
        src = inspect.getsource(flow.grow)
        self.assertIn('try:', src)
        self.assertIn('except Exception:', src)
        after = src.split('except Exception:')[1]
        self.assertIn("active.json", after, '失败路径要清理标记')
        self.assertIn('raise', after, '清理后要继续抛，不能吞掉错误')

    def test_cleanup_runs_when_collect_fails(self):
        """真正的行为验证：采集阶段抛错，标记仍被删除。"""
        import json
        import tempfile
        from pathlib import Path
        from unittest.mock import patch
        import flow

        with tempfile.TemporaryDirectory() as tmp:
            cfgp = Path(tmp) / 'config.json'
            cfgp.write_text(json.dumps(
                {'growth': {'state_dir': tmp}, 'base_id': 'b', 'tables': {}},
                ensure_ascii=False), encoding='utf-8')
            marker = Path(tmp) / 'active.json'
            marker.write_text('{"run_dir": "/tmp/x"}', encoding='utf-8')

            with patch.object(flow.g, 'collect', side_effect=RuntimeError('采集失败')):
                with self.assertRaises(RuntimeError):
                    flow.grow(str(cfgp))

            self.assertFalse(marker.exists(), '采集失败后必须清理 active.json')

    def test_return_stays_inside_try(self):
        """成功路径不能被 except 捕获，否则正常返回也会清标记。"""
        import inspect
        import flow
        src = inspect.getsource(flow.grow)
        lines = src.split('\n')
        ret = [i for i, l in enumerate(lines) if 'return {' in l]
        exc = [i for i, l in enumerate(lines) if 'except Exception:' in l]
        self.assertTrue(ret and exc)
        self.assertLess(ret[-1], exc[0], 'return 必须在 try 内、except 之前')


if __name__ == '__main__':
    unittest.main()
