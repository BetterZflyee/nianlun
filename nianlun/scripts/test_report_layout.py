import unittest
from html.parser import HTMLParser
import report_layout


def document(count=4, lead='Lead: 有依据的判断。'):
    panels = ''.join('<section class="am-panel" id="panel-' + str(i) + '"><header><h2>主题 ' + str(i) + '</h2></header><div class="am-panel-body"><p>原文 &lt;script&gt; 不执行 <a href="#source-R1">R1</a></p></div></section>' for i in range(count))
    return ('<!doctype html><html data-theme="wetype-recap"><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"></head><body>'
        '<main class="am-sheet" data-label="class=\'not-a-class\'"><header><div class="am-intro"><p>' + lead + '</p></div></header>'
        '<div class="am-grid" style="--cols:3">' + panels + '</div><details><summary>依据</summary><li id="source-R1">保留证据</li></details></main>'
        '<script id="source" type="application/json">{"draft":"Lead: 原始源稿","html":"<main class=\"am-sheet\">"}</script>'
        '<textarea id="editor">Lead: 编辑层内容不改</textarea></body></html>')


class Structure(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.elements = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


class LayoutTests(unittest.TestCase):
    def test_four_panels_keep_content_ids_csp_and_editor_source(self):
        before = document()
        after = report_layout.apply(before)
        self.assertIn('<p>有依据的判断。</p>', after)
        self.assertIn('"draft":"Lead: 原始源稿"', after)
        self.assertIn('<textarea id="editor">Lead: 编辑层内容不改</textarea>', after)
        self.assertIn('data-label="class=\'not-a-class\'"', after)
        old = Structure(before).elements
        new = Structure(after).elements
        self.assertEqual([a['id'] for _, a in old if 'id' in a], [a['id'] for _, a in new if 'id' in a and a['id'] != report_layout.STYLE_ID])
        self.assertEqual([a for t, a in old if t == 'meta'], [a for t, a in new if t == 'meta'])
        self.assertEqual(after.count('原文 &lt;script&gt; 不执行'), 4)
        self.assertEqual(after.count('href="#source-R1"'), 4)
        self.assertIn('nl-four-panels', next(a['class'] for t, a in new if t == 'div' and 'am-grid' in a.get('class', '')))
        self.assertEqual(sum('nl-panel-primary' in a.get('class', '') for _, a in new), 1)
        self.assertEqual(report_layout.apply(after), after)

    def test_non_four_panel_reports_use_normal_grid_without_invented_roles(self):
        for count in (1, 3, 5):
            html = report_layout.apply(document(count))
            elements = Structure(html).elements
            self.assertFalse(any('nl-four-panels' in a.get('class', '') for _, a in elements))
            self.assertFalse(any('nl-panel-actions' in a.get('class', '') for _, a in elements))
            self.assertEqual(sum(t == 'section' for t, _ in elements), count)

    def test_no_plain_text_or_non_report_html_reinterpretation(self):
        for html in ('Lead: ordinary text', '<html><head></head><body><p>Lead: ordinary</p></body></html>'):
            self.assertEqual(report_layout.apply(html), html)
        html = report_layout.apply(document(lead='&lt;img src=x onerror=alert(1)&gt; Lead: 作为原文保留'))
        self.assertIn('&lt;img src=x onerror=alert(1)&gt; Lead: 作为原文保留', html)
        self.assertFalse(any(t == 'img' for t, _ in Structure(html).elements))

    def test_nested_sections_are_not_counted_as_peer_panels(self):
        html = document(3).replace('主题 0</h2>', '主题 0</h2><section class="am-panel" id="nested">嵌套说明</section>')
        elements = Structure(report_layout.apply(html)).elements
        self.assertFalse(any('nl-four-panels' in a.get('class', '') for _, a in elements))
        self.assertTrue(any(a.get('id') == 'nested' for _, a in elements))


if __name__ == '__main__':
    unittest.main()
