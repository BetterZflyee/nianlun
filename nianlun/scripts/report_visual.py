"""Optional local-only diagram exploration for the selected recap renderer."""
import base64
import hashlib
import re
from pathlib import Path


ASSETS = Path(__file__).resolve().parent.parent / 'assets' / 'report'


def enhance(html):
    from report_layout import apply
    html = apply(html)
    # 布局重排会重建 section 标签，宽表面板的跨列标记必须在其之后补上。
    from report_blocks import widen_wide_panels, css_body as report_blocks_css_body
    html = widen_wide_panels(html)
    if 'id="nianlun-path-3d"' in html:
        return html
    if not re.search(r'<figure\b[^>]*class=["\'][^"\']*\bam-flow\b', html):
        return html
    css = report_blocks_css_body((ASSETS / 'path3d.css').read_text(encoding='utf-8'))
    license_text = (ASSETS.parent / 'portal/vendor/three-LICENSE.txt').read_text(encoding='utf-8')
    script = '/* Three.js MIT license\n' + license_text + '\n*/\n' + (ASSETS / 'path3d.bundle.js').read_text(encoding='utf-8')
    meta = re.search(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>', html, flags=re.I)
    if meta and ('script-src ' not in meta[0] or "script-src 'none'" in meta[0]):
        return html  # Respect a Skill policy which does not allow executable scripts.
    # Same CSP as the Skill: authorize only these exact bundled bytes, no CDN/eval.
    digest = base64.b64encode(hashlib.sha256(script.encode('utf-8')).digest()).decode('ascii')
    # 幂等：上一轮注入的运行时若还在页面里，其内容决定的摘要就是「本运行时写过的那一个」。
    # 只精确移除它，绝不能按「第一个 sha256」粗暴清除——页面本身可能已有别的合法摘要。
    previous = re.search(r'<script id="nianlun-path-3d">(.*?)</script>', html, flags=re.S)
    stale = base64.b64encode(hashlib.sha256(previous[1].encode('utf-8')).digest()).decode('ascii') if previous else None
    def policy(match):
        content = match.group(0)
        if 'script-src ' not in content:
            return content
        if stale and "'sha256-" + stale + "'" in content:
            content = content.replace(" 'sha256-" + stale + "'", '', 1)
        return content.replace('script-src ', "script-src 'sha256-" + digest + "' ", 1)
    html = re.sub(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>', policy, html, flags=re.I)
    # 幂等：先移除上一轮注入的样式与运行时，再按当前版本重新注入。
    html = re.sub(r'<style id="nianlun-path-style">.*?</style>', '', html, flags=re.S)
    html = re.sub(r'<script id="nianlun-path-3d">.*?</script>', '', html, flags=re.S)
    # 固定插在 <head> 之后而非 </head> 之前：布局层会把自己的样式追加到 head 末尾，
    # 若这里也追加到末尾，两轮增强的顺序会互换，输出就不再幂等。
    html = re.sub(r'(<head\b[^>]*>)', lambda m: m[1] + '<style id="nianlun-path-style">' + css + '</style>', html, count=1, flags=re.I)
    # Bundled libraries may contain a literal closing body in a string. Inject at
    # the document end, never into another script's bytes (and CSP hash).
    runtime = '<script id="nianlun-path-3d">' + script + '</script>'
    if '</body>' not in html:
        return html + runtime
    head, _, tail = html.rpartition('</body>')
    return head + runtime + '</body>' + tail
