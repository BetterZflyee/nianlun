"""Optional local-only diagram exploration for the selected recap renderer."""
import base64
import hashlib
import re
from pathlib import Path


ASSETS = Path(__file__).resolve().parent.parent / 'assets' / 'report'


def _script_allowed(meta_tag):
    """CSP 是否允许执行本页内联脚本。

    早先用 `'script-src ' not in meta` 判断，要求 script-src 后面必须跟空格——
    于是 `script-src;`、`script-src`（列表结尾）这类合法写法会被误判成「禁止脚本」，
    Three.js 静默不注入，报告里就没有 3D 效果，而且没有任何报错。
    只有明确写 'none' 才算禁止；其余情况按指令存在即允许。
    """
    content = meta_tag or ''
    # 只取 script-src 这一条指令（到下一个分号为止），不能在引号处截断——
    # 'none' 本身就带引号，截掉引号就判不出禁止。
    match = re.search(r"script-src([^;>\"]*)", content, flags=re.I)
    if not match:
        return False
    # 去掉 HTML 属性引号和指令两侧空白，再判断是不是唯一的 'none'。
    directives = match.group(1).strip().strip('"').strip()
    only = directives.split()
    return not (len(only) == 1 and only[0].lower() == "'none'")


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
    if meta and not _script_allowed(meta[0]):
        return html  # Respect a Skill policy which does not allow executable scripts.
    # Same CSP as the Skill: authorize only these exact bundled bytes, no CDN/eval.
    digest = base64.b64encode(hashlib.sha256(script.encode('utf-8')).digest()).decode('ascii')
    # 幂等：上一轮注入的运行时若还在页面里，其内容决定的摘要就是「本运行时写过的那一个」。
    # 只精确移除它，绝不能按「第一个 sha256」粗暴清除——页面本身可能已有别的合法摘要。
    previous = re.search(r'<script id="nianlun-path-3d">(.*?)</script>', html, flags=re.S)
    stale = base64.b64encode(hashlib.sha256(previous[1].encode('utf-8')).digest()).decode('ascii') if previous else None
    def policy(match):
        content = match.group(0)
        # 先清掉上一轮留下的旧摘要，再决定怎么放新摘要。
        if stale and "'sha256-" + stale + "'" in content:
            content = content.replace(" 'sha256-" + stale + "'", '', 1)
        token = "'sha256-" + digest + "'"
        # 三种写法都要覆盖：`script-src <已有值>...`、`script-src;`（空指令）、
        # `script-src`（列表结尾）。后两种没有「空格后接值」的位置，
        # 直接替换 'script-src ' 会匹配不到，脚本就永远被 CSP 拒绝执行。
        if re.search(r"script-src\s", content, flags=re.I):
            return re.sub(r"script-src\s", 'script-src ' + token + ' ', content, count=1, flags=re.I)
        if re.search(r"script-src(?=[;\"']|$)", content, flags=re.I):
            return re.sub(r"script-src(?=[;\"']|$)", 'script-src ' + token, content, count=1, flags=re.I)
        # 完全没有 script-src 指令：补一条，否则注入的脚本一定被拒。
        return content.replace('content="', 'content="script-src ' + token + '; ', 1)
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
