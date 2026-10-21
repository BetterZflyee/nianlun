"""User-selected local recap skill; no private skill is bundled with the release."""
import os
import re
from html import escape
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
    return {'name':'transcript-visual-recap','path':str(path),'guidance':source[:16000]+('\n'+contract.read_text(encoding='utf-8')[:18000] if contract.is_file() else '')}


def render(method,markdown,folder,title):
    """Use the explicitly selected skill's deterministic engine B and editing layer."""
    root=Path(method['path']).parent;folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
    node=shutil.which('node')
    if not node:
        for path in (Path.home()/'.nodejs/bin/node',Path('/opt/homebrew/bin/node')):
            if path.is_file():node=str(path);break
    engine=root/'scripts/vendor/am.mjs';editor=root/'scripts/add_edit_layer.py'
    if not node or not engine.is_file() or not editor.is_file():
        raise n.Error('可视化汇报 Skill 缺少 Node 或渲染脚本，请修复该 Skill 后继续原任务')
    # Keep theme installation private to this report rather than changing the user's global theme.
    theme=root/'references/wetype-recap-theme.json'
    local_home=folder/'renderer-home';themes=local_home/'themes';themes.mkdir(parents=True,exist_ok=True)
    if theme.is_file():shutil.copyfile(theme,themes/'wetype-recap.json')
    import json
    markdown=escape(markdown,quote=False)
    markdown=re.sub(r'!\[([^\]]*)\]\([^)]*\)',r'\1（图片未自动加载）',markdown)
    draft='---\ntemplate: doc\ntheme: wetype-recap\ntitle: '+json.dumps(title,ensure_ascii=False)+'\n---\n'+markdown
    n.save(folder/'visual-draft.md',draft)
    target=folder/'visual.html';env=os.environ.copy();env['AM_HOME']=str(local_home)
    result=subprocess.run([node,str(engine),'render','-','--no-open','-o',str(target)],input=draft,
        text=True,encoding='utf-8',capture_output=True,timeout=120,env=env)
    if result.returncode or not target.is_file():raise n.Error('可视化汇报渲染未完成，已保留草稿；未上传不完整报告')
    result=subprocess.run([sys.executable,str(editor),str(target)],text=True,encoding='utf-8',capture_output=True,timeout=120)
    if result.returncode:raise n.Error('汇报编辑层生成失败，请修复所选 Skill 后继续')
    return target.read_text(encoding='utf-8')
