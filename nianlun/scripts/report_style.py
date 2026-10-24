"""User-selected local recap skill; no private skill is bundled with the release."""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
import nianlun as n


def method(path=None):
    if not path:return {}
    path=Path(path).expanduser().resolve()
    if path.is_dir():path=path/'SKILL.md'
    if not path.is_file():raise n.Error('所选汇报 Skill 已不存在，请在能力中心重新选择')
    source=path.read_text(encoding='utf-8')
    if 'name: transcript-visual-recap' not in source:raise n.Error('当前可视化汇报适配器支持 transcript-visual-recap')
    contract=path.parent/'references/prompt-template.md'
    if not contract.is_file():raise n.Error('所选汇报 Skill 缺少生成契约，请修复后继续')
    text=contract.read_text(encoding='utf-8')
    sections=re.split(r'(?=^## )',text,flags=re.M)
    guidance='\n'.join(section for section in sections if section.startswith(('## STE ','## 引擎B：')))
    if not guidance:raise n.Error('所选汇报 Skill 缺少引擎 B 契约，请核验版本')
    visual_contract=path.parent/'references/visual-contract.md'
    if visual_contract.is_file():guidance+='\n'+visual_contract.read_text(encoding='utf-8')
    return {'name':'transcript-visual-recap','path':str(path),'engine':'B / sheet','guidance':guidance}



def preflight(method):
    """Discover required renderer files before spending time on model generation."""
    if not method:return None
    root=Path(method['path']).parent
    node=shutil.which('node')
    if not node:
        for path in (Path.home()/'.nodejs/bin/node',Path('/opt/homebrew/bin/node')):
            if path.is_file():node=str(path);break
    engine=root/'scripts/vendor/am.mjs';editor=root/'scripts/add_edit_layer.py'
    if not node or not engine.is_file() or not editor.is_file():
        raise n.Error('可视化汇报 Skill 缺少 Node 或渲染脚本，请修复该 Skill 后继续原任务')
    return node,engine,editor


def render(method,markdown,folder,title,appendix_html='',subtitle=''):
    """Use the explicitly selected skill's deterministic engine B and editing layer."""
    node,engine,editor=preflight(method)
    root=Path(method['path']).parent;folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
    # Keep theme installation private to this report rather than changing the user's global theme.
    theme=root/'references/wetype-recap-theme.json'
    local_home=folder/'renderer-home';themes=local_home/'themes';themes.mkdir(parents=True,exist_ok=True)
    if theme.is_file():shutil.copyfile(theme,themes/'wetype-recap.json')
    import json
    from report_brief import linked_markdown, attach_appendix
    import report_blocks
    markdown,blocks=report_blocks.parse(markdown)
    markdown=linked_markdown(markdown.replace("&","&amp;").replace("<","&lt;"))
    markdown=re.sub(r'!\[([^\]]*)\]\([^)]*\)',r'\1（图片未自动加载）',markdown)
    draft='---\ntemplate: sheet\ntheme: wetype-recap\ntitle: '+json.dumps(title,ensure_ascii=False)+'\nsubtitle: '+json.dumps(subtitle,ensure_ascii=False)+'\n---\n'+markdown
    n.save(folder/'visual-draft.md',draft)
    target=folder/'visual.pending.html';env=os.environ.copy();env['AM_HOME']=str(local_home)
    target.unlink(missing_ok=True)
    try:
        result=subprocess.run([node,str(engine),'render','-','--no-open','-o',str(target)],input=draft,
            text=True,encoding='utf-8',capture_output=True,timeout=120,env=env)
    except (OSError,subprocess.TimeoutExpired) as exc:
        raise n.Error('报告页面生成未完成，正文已保留；请检查 Node 和所选 Skill 后重试，无需重新撰写。') from exc
    if result.returncode or not target.is_file():raise n.Error('可视化汇报渲染未完成，已保留草稿；未上传不完整报告')
    def checked():
        output=target.read_text(encoding='utf-8')
        if not all(re.search(pattern,output,re.I) for pattern in (r'<html\b',r'<main\b',r'</html>')):
            raise n.Error('报告渲染结果不完整，正文已保留；未上传，请重试生成页面。')
        return output
    checked()
    if blocks:n.save(target,report_blocks.restore(target.read_text(encoding='utf-8'),blocks))
    if appendix_html:n.save(target,attach_appendix(target.read_text(encoding='utf-8'),appendix_html))
    try:
        result=subprocess.run([sys.executable,str(editor),str(target)],text=True,encoding='utf-8',capture_output=True,timeout=120)
    except (OSError,subprocess.TimeoutExpired) as exc:
        raise n.Error('汇报编辑层生成未完成，正文已保留；请修复所选 Skill 后重试。') from exc
    if result.returncode:raise n.Error('汇报编辑层生成失败，请修复所选 Skill 后继续')
    import report_visual
    output=report_visual.enhance(report_blocks.enhance(checked()))
    n.save(target,output);target.replace(folder/'visual.html')
    return output
