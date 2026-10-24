"""Installed as Skill scripts/render_visual.py: compile visual Markdown offline."""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def render(source, output, title, subtitle='', evidence=None):
    import report_blocks
    import report_visual
    root=Path(__file__).resolve().parent.parent
    node=shutil.which('node')
    if not node: raise RuntimeError('Node.js is required')
    markdown,blocks=report_blocks.parse(Path(source).read_text(encoding='utf-8'),evidence)
    markdown=markdown.replace('&','&amp;').replace('<','&lt;')
    markdown=report_blocks.CITE.sub(lambda m:'['+m[1]+'](#source-'+m[1]+')',markdown)
    draft='---\ntemplate: sheet\ntheme: wetype-recap\ntitle: '+json.dumps(title,ensure_ascii=False)+'\nsubtitle: '+json.dumps(subtitle,ensure_ascii=False)+'\n---\n'+markdown
    target=Path(output).resolve();target.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='recap-',dir=target.parent) as tmp:
        folder=Path(tmp);themes=folder/'themes';themes.mkdir()
        shutil.copyfile(root/'references/wetype-recap-theme.json',themes/'wetype-recap.json')
        env=os.environ.copy();env['AM_HOME']=str(folder)
        pending=folder/'report.html'
        subprocess.run([node,str(root/'scripts/vendor/am.mjs'),'render','-','--no-open','-o',str(pending)],
                       input=draft,text=True,encoding='utf-8',check=True,timeout=120,env=env,capture_output=True)
        html=report_blocks.restore(pending.read_text(encoding='utf-8'),blocks)
        if evidence:
            used=set(report_blocks.CITE.findall(Path(source).read_text(encoding='utf-8')))
            from html import escape
            entries=''.join('<li id="source-'+escape(x['key'])+'"><b>'+escape(x['key'])+'</b> '+escape(x.get('title',''))+'</li>' for x in evidence if x['key'] in used)
            html=html.replace('</main>','<details class="nianlun-evidence"><summary>查看依据</summary><ol>'+entries+'</ol></details></main>',1)
        pending.write_text(html,encoding='utf-8')
        subprocess.run([sys.executable,str(root/'scripts/add_edit_layer.py'),str(pending)],check=True,timeout=120,capture_output=True)
        html=report_visual.enhance(report_blocks.enhance(pending.read_text(encoding='utf-8')))
        if not all(re.search(p,html,re.I) for p in (r'<html\b',r'<main\b',r'</html>')):raise ValueError('Incomplete rendered document')
        pending.write_text(html,encoding='utf-8');pending.replace(target)
    return target


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('output');p.add_argument('--title',required=True)
    p.add_argument('--subtitle',default='');p.add_argument('--evidence')
    a=p.parse_args();ev=json.loads(Path(a.evidence).read_text(encoding='utf-8')) if a.evidence else None
    print(render(a.source,a.output,a.title,a.subtitle,ev))
