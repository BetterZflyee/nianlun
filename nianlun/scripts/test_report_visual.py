import base64
import hashlib
import re
import unittest
from html.parser import HTMLParser
from report_visual import enhance, ASSETS


class VisualTests(unittest.TestCase):
    def test_exact_bundle_is_authorized_without_external_scripts_or_csp_relaxation(self):
        page='''<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-original'; style-src 'unsafe-inline'"></head><body><main class="am-sheet"><figure class="am-diagram am-flow"><svg><g class="am-node">节点</g></svg></figure></main></body></html>'''
        html=enhance(page)
        script=re.search(r'<script id="nianlun-path-3d">(.*?)</script>',html,re.S)[1]
        digest=base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
        policy=re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"',html)[1]
        self.assertIn("'sha256-"+digest+"'",policy)
        self.assertIn("'sha256-original'",policy)
        self.assertNotIn('unsafe-eval',policy);self.assertNotIn('script-src \'unsafe-inline\'',policy)
        self.assertIn('<g class="am-node">节点</g>',html)
        class Scripts(HTMLParser):
            def handle_starttag(self,tag,attrs):
                if tag=='script':self.sources.append(dict(attrs).get('src'))
        parser=Scripts();parser.sources=[];parser.feed(html)
        self.assertTrue(parser.sources);self.assertTrue(all(src is None for src in parser.sources))
        self.assertEqual(enhance(html),html)
        self.assertIn('Permission is hereby granted',html)

    def test_plain_report_does_not_include_webgl_bundle(self):
        html=enhance('<html><head></head><body><main class="am-sheet"><p>只有文字</p></main></body></html>')
        self.assertNotIn('nianlun-path-3d',html);self.assertNotIn('WebGLRenderer',html)

    def test_bundle_can_be_safely_embedded(self):
        self.assertNotIn('</script',(ASSETS/'path3d.bundle.js').read_text().lower())

    def test_library_body_literal_does_not_corrupt_script_or_csp(self):
        page='<html><head></head><body><main class="am-sheet"><figure class="am-flow"><svg></svg></figure></main><script id="prior">const value="</body>";</script></body></html>'
        html=enhance(page)
        self.assertIn('<script id="prior">const value="</body>";</script>',html)
        self.assertLess(html.index('</script>'),html.index('<script id="nianlun-path-3d">'))


if __name__=='__main__':unittest.main()
