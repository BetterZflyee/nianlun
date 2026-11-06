"""真实渲染验证：3D 路径必须真的画出 canvas。

已有的 test_path3d_*.py 只验证「bundle 被注入、按钮存在」——**注入成功不等于
画得出来**。实测（2026-11-07 06:15）就踩到两个坑：

1. `--disable-gpu` 让 WebGL 上下文创建失败，按钮变成「立体视图加载失败」，
   但 HTML 层面一切正常（bundle 在、按钮在、监听器在）。
2. 探针如果插在 3D bundle 之前，执行时 `v_()` 还没跑，按钮虽在但没绑定。

所以这个脚本用 `--use-gl=swiftshader` 开软件渲染，并把探针放在 `<script>`
末尾，等 3D 初始化后再点，检查 canvas 是否真的出现。
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_report
import report_visual

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

PROBE = '''
<script>
setTimeout(function(){
  var r={btn:false,clicked:false,canvases:0,dialog:false,text:'',title:''};
  var btn=document.querySelector('.nl-path-open');
  r.btn=!!btn;
  if(btn){ r.text=btn.textContent; r.clicked=true; btn.click(); }
  setTimeout(function(){
    r.canvases=document.querySelectorAll('canvas').length;
    r.dialog=!!document.querySelector('dialog[open]');
    if(btn){ r.after=btn.textContent; r.disabled=!!btn.disabled; r.title=btn.title||''; }
    var t=document.createElement('div');t.id='probe-result';
    t.textContent='PROBE:'+JSON.stringify(r);
    document.body.appendChild(t);
  },1200);
},400);
</script>
'''


def graph_report():
    nodes = [{'id': f'n{i}', 'label': f'节点{i}', 'state': 'active',
              'layer': i % 3, 'detail': '说明', 'source': '[R1]'} for i in range(6)]
    links = [{'from': f'n{i}', 'to': f'n{i+1}', 'label': '推进', 'source': '[R1]'}
             for i in range(2)]
    cfg = {'type': 'graph', 'title': '推进路径', 'caption': '六个节点的推进关系',
           'nodes': nodes, 'links': links}
    md = ('Lead: 测试结论。\n\n## 总览\n\n```visual\n'
          + json.dumps(cfg, ensure_ascii=False) + '\n```\n\n## 风险\n内容[R1]\n')
    return report_visual.enhance(
        render_report.brief_html(md, '测试', '2026-10-30', '2026-11-06'))


def main():
    if not Path(CHROME).is_file():
        print('跳过：本机没有 Chrome')
        return 0
    html = graph_report()
    if 'nianlun-path-3d' not in html:
        print('✗ 3D bundle 未注入')
        return 1
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / 'p.html'
        page.write_text(html.replace('</body>', PROBE + '</body>'), encoding='utf-8')
        result = subprocess.run(
            [CHROME, '--headless', '--no-sandbox',
             '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
             '--virtual-time-budget=4000', '--dump-dom', page.as_uri()],
            capture_output=True, text=True, timeout=120)
    match = re.search(r'PROBE:(\{[^<]*\})', result.stdout)
    if not match:
        print('✗ 探针没有输出（页面可能没加载完）')
        return 1
    data = json.loads(match.group(1))
    checks = [
        ('按钮存在', data.get('btn'), True),
        ('点击生效', data.get('clicked'), True),
        ('canvas 已创建', data.get('canvases', 0) >= 1, True),
        ('dialog 已打开', data.get('dialog'), True),
        ('按钮未被禁用', not data.get('disabled'), True),
    ]
    print('=== 3D 真实渲染 ===')
    failed = 0
    for name, actual, expected in checks:
        ok = bool(actual) == bool(expected)
        print(f'  {"✓" if ok else "✗"} {name}={actual}')
        if not ok:
            failed += 1
    if failed:
        print('  按钮文案:', data.get('after') or data.get('text'))
        print('  失败原因:', data.get('title') or '（无）')
    print(f'\n{len(checks) - failed} 通过 / {failed} 失败')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
