"""Apply the workspace's compact presentation without rewriting report content."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re


STYLE_ID = 'nianlun-report-compact'
CSS = Path(__file__).resolve().parent.parent / 'assets/report/compact.css'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
ATTR = re.compile(r'''([^\s=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?''')


class _Layout(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=False)
        self.html = html
        self.lines = [0]
        for match in re.finditer('\n', html):
            self.lines.append(match.end())
        self.stack = []
        self.main = self.grid = self.body = self.root = None
        self.panels = []
        self.changes = []
        self.head_end = None
        self.has_style = False
        self.intro_seen = False

    def position(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        node = {'tag': tag, 'attrs': attrs, 'start': self.position(), 'raw': self.get_starttag_text()}
        classes = set((attrs.get('class') or '').split())
        inert = any(n['tag'] in ('script', 'style', 'textarea', 'template') for n in self.stack)
        if tag == 'html' and not inert:
            self.root = node
        if tag == 'body' and not inert:
            self.body = node
        if tag == 'style' and attrs.get('id') == STYLE_ID and not inert:
            self.has_style = True
        if tag == 'main' and 'am-sheet' in classes and self.main is None and not inert:
            self.main = node
        if self.main in self.stack and 'am-grid' in classes and self.grid is None and not inert:
            self.grid = node
        if self.stack and self.stack[-1] is self.grid and 'am-panel' in classes and not inert:
            self.panels.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == 'head' and self.head_end is None:
            self.head_end = self.position()
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.intro_seen or self.main not in self.stack or not data.strip():
            return
        if any(n['tag'] in ('script', 'style', 'textarea', 'template') for n in self.stack):
            return
        if not any('am-intro' in (n['attrs'].get('class') or '').split() for n in self.stack):
            return
        self.intro_seen = True
        # This is a visible text node, never the embedded source or editor payload.
        match = re.match(r'(\s*)Lead:\s*', data)
        if match:
            at = self.position()
            self.changes.append((at, at + match.end(), match[1]))

    def add_class(self, node, name):
        if node is None:
            return
        classes = (node['attrs'].get('class') or '').split()
        if name in classes:
            return
        classes.append(name)
        raw = node['raw']
        start = re.match(r'<[^\s/>]+', raw).end()
        attr = next((m for m in ATTR.finditer(raw, start) if m[1].lower() == 'class'), None)
        value = 'class="' + escape(' '.join(classes), quote=True) + '"'
        if attr:
            raw = raw[:attr.start()] + value + raw[attr.end():]
        else:
            raw = raw[:start] + ' ' + value + raw[start:]
        self.changes.append((node['start'], node['start'] + len(node['raw']), raw))


def apply(html):
    """Return a standalone, compact am sheet; unrelated HTML passes through unchanged.

    Call after the selected Skill renders its HTML and before its editing layer is
    injected. Source scripts, CSP, content, panel IDs and evidence anchors survive
    byte for byte. No model data is turned into executable code or CSS.
    """
    page = _Layout(html)
    page.feed(html)
    if page.main is None or page.head_end is None or page.has_style:
        return html
    page.add_class(page.root, 'nl-recap-root')
    page.add_class(page.body, 'nl-recap-page')
    page.add_class(page.main, 'nl-report')
    if len(page.panels) == 4:
        page.add_class(page.grid, 'nl-four-panels')
        for panel, name in zip(page.panels, ('nl-panel-primary', 'nl-panel-detail', 'nl-panel-context', 'nl-panel-actions')):
            page.add_class(panel, name)
    css = CSS.read_text(encoding='utf-8')
    page.changes.append((page.head_end, page.head_end, '<style id="' + STYLE_ID + '">\n' + css + '\n</style>\n'))
    for start, end, replacement in sorted(page.changes, reverse=True):
        html = html[:start] + replacement + html[end:]
    return html
