"""Small local UI helpers; business information remains in its original providers."""
import os
import subprocess
from pathlib import Path
import nianlun as n
import memory


def pick_directory():
    # The user invokes this from a button; static native dialog commands accept no shell text.
    import sys
    if sys.platform=='darwin':
        cmd=['osascript','-e','POSIX path of (choose folder with prompt "选择包含 Skill 的根目录")']
    elif os.name=='nt':
        cmd=['powershell','-NoProfile','-STA','-Command',
            '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; '
            '$dialog.Description = "Select Skill folder"; if ($dialog.ShowDialog() -eq "OK") { $dialog.SelectedPath }']
    else:
        cmd=['zenity','--file-selection','--directory','--title=选择 Skill 根目录']
    try:result=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=300)
    except (OSError,subprocess.TimeoutExpired):raise n.Error('系统文件夹选择器不可用，可展开手动路径输入')
    path=result.stdout.strip()
    if not path:return None
    if not Path(path).is_dir():raise n.Error('选择的文件夹不可读取')
    return str(Path(path).resolve())


def project_memory(work,data,progress=lambda value:None):
    config=n.load(work.config_path)
    pid=data.get('project_id')
    # Only read the project table; GBrain retrieval itself does not need a DWS connection.
    config,gw,_=work.connection()
    projects=n.normalized(config,'projects',gw.table().records(config['base_id'],config['tables']['projects']['id']))
    project=next((p for p in projects if p['id']==pid),None)
    if not project:raise n.Error('项目不存在，请刷新')
    progress('正在读取 '+project['title']+' 的记忆页面')
    result=memory.retrieve(config,project['title'],limit=24)
    # Explicit links only; keyword matches are membership candidates, not invented causal links.
    import re
    edges=[];slugs={p['slug'] for p in result['pages']}
    for page in result['pages']:
        for match in re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]',page['text']):
            if match in slugs:edges.append({'source':page['slug'],'target':match})
    return {**result,'project':{k:project.get(k) for k in ('id','title','number')},'edges':edges,
        'scope':'按项目名称检索到的相关页面，最多 24 篇；关键词未命中不代表记忆库为空。'}
