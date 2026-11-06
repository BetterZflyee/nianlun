"""Three.js 3D 效果必须真的能在浏览器里执行。

注入成功了但 CSP 没放行，等于白注入——页面上什么都不会动，而且没有任何报错。
这里锁住三件事：CSP 判定、摘要写入、以及各种 CSP 写法都要覆盖。
"""
import base64
import hashlib
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import report_visual


def page(csp=None):
    meta = ('<meta http-equiv="Content-Security-Policy" content="' + csp + '">') if csp else ''
    return ('<html><head>' + meta + '</head><body>'
            '<figure class="am-flow rv-static-graph"><svg></svg></figure></body></html>')


def injected_digest(out):
    m = re.search(r'<script id="nianlun-path-3d">(.*?)</script>', out, re.S)
    if not m:
        return None
    return base64.b64encode(hashlib.sha256(m.group(1).encode('utf-8')).digest()).decode('ascii')


class ScriptAllowedTests(unittest.TestCase):
    def check(self, csp, expected):
        self.assertEqual(report_visual._script_allowed(page(csp)), expected, csp)

    def test_hashes_allowed(self):
        self.check("default-src 'none'; script-src 'sha256-AAA=' 'sha256-BBB='", True)

    def test_empty_directive_allowed(self):
        """`script-src;` 是合法写法，早先被误判成禁止，导致 3D 静默不注入。"""
        self.check('script-src; style-src', True)
        self.check('script-src', True)

    def test_unsafe_inline_allowed(self):
        self.check("script-src 'unsafe-inline'", True)

    def test_none_is_refused(self):
        self.check("script-src 'none'", False)
        self.check("default-src 'none'; script-src 'none'; style-src", False)

    def test_missing_directive_is_refused(self):
        """没有 script-src 时由 default-src 决定；'none' 下必须拒绝。"""
        self.check("default-src 'none'", False)


class InjectionTests(unittest.TestCase):
    def test_injects_runtime_and_style(self):
        out = report_visual.enhance(page("default-src 'none'; script-src 'sha256-AAA='"))
        self.assertIn('id="nianlun-path-3d"', out)
        self.assertIn('id="nianlun-path-style"', out)

    def test_digest_is_written_into_csp(self):
        out = report_visual.enhance(page("default-src 'none'; script-src 'sha256-AAA='"))
        digest = injected_digest(out)
        self.assertIsNotNone(digest)
        self.assertIn("'sha256-" + digest + "'", out)

    def test_empty_script_src_still_gets_digest(self):
        """`script-src;` 这种写法也要把摘要塞进去，否则脚本被拒。"""
        out = report_visual.enhance(page('script-src;'))
        digest = injected_digest(out)
        self.assertIn("'sha256-" + digest + "'", out)

    def test_none_policy_is_respected(self):
        out = report_visual.enhance(page("script-src 'none'"))
        self.assertNotIn('nianlun-path-3d', out)

    def test_without_am_flow_nothing_is_injected(self):
        html = '<html><head></head><body><div>无图</div></body></html>'
        self.assertEqual(report_visual.enhance(html), html)

    def test_idempotent(self):
        once = report_visual.enhance(page("default-src 'none'; script-src 'sha256-AAA='"))
        twice = report_visual.enhance(once)
        self.assertEqual(once, twice)
        self.assertEqual(twice.count('<script id="nianlun-path-3d">'), 1)


class SelfHealingTests(unittest.TestCase):
    """已经注入过、但摘要过期的页面，必须能自愈。

    上一版代码算错哈希时留下的报告，CSP 里没有运行时摘要，浏览器拒绝执行脚本，
    3D 一直是死的。旧逻辑开头「已有 path-3d 就 return」会让这类页面永远修不好。
    """

    def stale_page(self):
        html = page("default-src 'none'; script-src 'sha256-OLDWRONG='")
        # 手工造一个「已注入但摘要对不上」的页面
        return (html.replace('</head>',
                '<script id="nianlun-path-3d">/* 过期运行时 */</script></head>'))

    def test_stale_runtime_is_replaced_not_skipped(self):
        out = report_visual.enhance(self.stale_page())
        digest = injected_digest(out)
        self.assertIsNotNone(digest)
        self.assertIn("'sha256-" + digest + "'", out, '新旧摘要都该被换成当前版本')
        self.assertNotIn('/* 过期运行时 */', out)

    def test_no_duplicate_runtime(self):
        out = report_visual.enhance(self.stale_page())
        self.assertEqual(out.count('<script id="nianlun-path-3d">'), 1)

    def test_repeated_enhance_is_stable(self):
        once = report_visual.enhance(self.stale_page())
        self.assertEqual(once, report_visual.enhance(once))


if __name__ == '__main__':
    unittest.main()
