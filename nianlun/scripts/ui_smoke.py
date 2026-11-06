#!/usr/bin/env python3
"""工作台界面冒烟测试。

代码层面的单测覆盖不了「页面点开是空的」这类问题。这个脚本用 headless
Chrome 真实加载工作台，逐页点击并检查关键元素数量。

    python3 ui_smoke.py [工作台路径]

全部通过退出码 0。需要本机有 Chrome，且 8901 端口可访问工作台所在目录。
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CONFIG = Path.home() / '.config/nianlun/config.json'

PROBES = {
    '首页': '''
      r.push('项目卡='+document.querySelectorAll('.project-card').length);
      r.push('状态标签='+document.querySelectorAll('.status').length);
      r.push('待确认数='+(document.querySelector('.review-count')||{}).textContent);
    ''',
    '项目详情': '''
      var c=document.querySelector('[data-project]');
      if(c){c.click();}
      r.push('详情已打开='+(document.body.innerText.includes('连续记忆')?'是':'否'));
      var tab=document.querySelector('[data-tab=milestones]');
      if(tab)tab.click();
      r.push('里程碑行='+document.querySelectorAll('.list-row').length);
    ''',
    '报告页': '''
      var b=document.querySelector('[data-page=reports]');
      if(b)b.click();
      r.push('报告卡='+document.querySelectorAll('.report-card').length);
      r.push('打开链接='+Array.from(document.querySelectorAll('a')).filter(function(a){return a.textContent.indexOf('打开汇报')>=0;}).length);
    ''',
}


def run_probe(page_html, name, script):
    probe = ('<script>setTimeout(function(){var r=[];try{' + script +
             '}catch(e){r=["异常: "+e.message];}'
             'var d=document.createElement("div");d.id="p";d.textContent=r.join(" | ");'
             'document.body.appendChild(d);},800);</script>')
    idx = page_html.rfind('</body>')
    patched = page_html[:idx] + probe + page_html[idx:]
    with tempfile.NamedTemporaryFile('w', suffix='.html', dir='/tmp', delete=False, encoding='utf-8') as fh:
        fh.write(patched)
        tmp = Path(fh.name)
    try:
        out = subprocess.run(
            [CHROME, '--headless=new', '--no-sandbox', '--virtual-time-budget=9000',
             '--dump-dom', f'http://127.0.0.1:8901/{tmp.name}'],
            capture_output=True, text=True, timeout=90).stdout
    finally:
        tmp.unlink(missing_ok=True)
    # 页面很大（1.6MB），要精确匹配我们注入的探针 div，避免撞到别处的 id="p"。
    matches = re.findall(r'<div id="p">([^<]*)</div>', out)
    if not matches:
        return '未执行'
    return matches[-1]


def main():
    config = json.loads(CONFIG.read_text(encoding='utf-8'))
    home = Path(config['growth']['home_output'])
    if not home.exists():
        print(f'工作台不存在：{home}')
        return 1
    page = home.read_text(encoding='utf-8')

    failed = 0
    print('=== 工作台界面冒烟 ===\n')
    for name, script in PROBES.items():
        result = run_probe(page, name, script)
        ok = '未执行' not in result and '异常' not in result
        zero = re.search(r'=0\b', result)
        if zero and '项目详情' not in name:
            ok = False
        print(f'  {"✓" if ok else "✗"} {name:8s} {result}')
        if not ok:
            failed += 1
    print(f'\n{len(PROBES) - failed} 通过 / {failed} 失败')
    return 0 if not failed else 1


if __name__ == '__main__':
    sys.exit(main())
