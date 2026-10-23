"""Optional local-only diagram exploration for the selected recap renderer."""
import base64
import hashlib
import re
from pathlib import Path


ASSETS = Path(__file__).resolve().parent.parent / 'assets' / 'report'


def enhance(html):
    from report_layout import apply
    html = apply(html)
    if 'id="nianlun-path-3d"' in html:
        return html
    if not re.search(r'<figure\b[^>]*class=["\'][^"\']*\bam-flow\b', html):
        return html
    css = (ASSETS / 'path3d.css').read_text(encoding='utf-8')
    license_text = (ASSETS.parent / 'portal/vendor/three-LICENSE.txt').read_text(encoding='utf-8')
    script = '/* Three.js MIT license\n' + license_text + '\n*/\n' + (ASSETS / 'path3d.bundle.js').read_text(encoding='utf-8')
    meta = re.search(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>', html, flags=re.I)
    if meta and 'script-src ' not in meta[0]:
        return html  # Respect a Skill policy which does not allow executable scripts.
    # Same CSP as the Skill: authorize only these exact bundled bytes, no CDN/eval.
    digest = base64.b64encode(hashlib.sha256(script.encode('utf-8')).digest()).decode('ascii')
    def policy(match):
        content = match.group(0)
        if 'script-src ' not in content:
            return content
        return content.replace('script-src ', "script-src 'sha256-" + digest + "' ", 1)
    html = re.sub(r'<meta\b[^>]*http-equiv=["\']Content-Security-Policy["\'][^>]*>', policy, html, flags=re.I)
    html = html.replace('</head>', '<style id="nianlun-path-style">' + css + '</style></head>', 1)
    return html.replace('</body>', '<script id="nianlun-path-3d">' + script + '</script></body>', 1)
