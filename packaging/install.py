#!/usr/bin/env python3
"""Register the portable package and prepare all runtimes in the current user's directory."""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import uuid
from pathlib import Path

PACKAGE=Path(__file__).resolve().parent
CORE=PACKAGE/'skills/nianlun'
if not CORE.is_dir(): CORE=PACKAGE.parent/'nianlun'
sys.path.insert(0,str(CORE/'scripts'))
import dependencies as deps
import nianlun as n
from file_lock import file_lock


def prepare_python(home):
    system,arch=deps.platform_key()
    target={'darwin':'apple-darwin','windows':'pc-windows-msvc','linux':'unknown-linux-gnu'}[system]
    asset='uv-'+('aarch64' if arch=='arm64' else 'x86_64')+'-'+target+('.zip' if system=='windows' else '.tar.gz')
    uv=deps.install_asset('uv',asset,home,'uv.exe' if system=='windows' else 'uv')
    env=os.environ.copy();env['UV_PYTHON_INSTALL_DIR']=str(home/'runtime/python');env['UV_CACHE_DIR']=str(home/'downloads/uv-cache')
    python=home/'runtime/python-env'/('Scripts/python.exe' if system=='windows' else 'bin/python')
    if not python.exists():
        run([uv,'python','install',deps.LOCK['python']['version'],'--no-bin','--no-registry'],env)
        run([uv,'venv','--no-project','--managed-python','--python',deps.LOCK['python']['version'],str(python.parent.parent)],env)
    run([uv,'pip','install','--python',str(python),'--index-url','https://pypi.org/simple','tzdata=='+deps.LOCK['python']['tzdata']],env)
    return python


def run(command,env=None):
    r=subprocess.run(command,env=env,capture_output=True,text=True, encoding='utf-8',timeout=900)
    if r.returncode: raise n.Error('个人运行环境准备失败：'+Path(command[0]).name+' '+command[1]+'。检查网络后可重新安装；已下载内容会保留。')


def same_tree(source,target):
    if not target.is_dir(): return False
    def files(root):
        return {str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts and not p.name.startswith('test_')}
    return files(source)==files(target)


def register(source,target,home):
    if not target.is_symlink() and same_tree(source,target): return 'unchanged'
    target.parent.mkdir(parents=True,exist_ok=True)
    temp=target.parent/(target.name+'.install-'+uuid.uuid4().hex)
    shutil.copytree(source,temp,ignore=shutil.ignore_patterns('__pycache__','*.pyc','test_*.py'))
    if target.exists() or target.is_symlink():
        backup=home/'backups'/(target.name+'-'+str(time.time_ns()))
        backup.parent.mkdir(parents=True,exist_ok=True)
        target.rename(backup)
    temp.rename(target)
    return 'installed'


def register_entry(root,home):
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        stage=Path(tmp)
        for name in ('nianlun','nianlun-setup'):
            folder=stage/name;folder.mkdir()
            (folder/'SKILL.md').write_text('---\nname: '+name+'\ndescription: 年轮跨宿主项目记忆与接入向导；数据保存在用户自己的 AI 表格和独立记忆空间。\n---\n\n读取年轮安装记录：'+str(home/'install.json')+'。用 python_bin 执行 core/scripts 中的程序；先阅读 core/SKILL.md 与 core/references/host-contract.md。初始化时再读 core/references/setup-wizard.md。不要依赖 Codex 的安装目录，不改宿主全局设置或权限。\n',encoding='utf-8')
            if name=='nianlun':
                for script in ('launch','scheduler','setup','growth','nianlun','host'):
                    file=folder/'scripts'/(script+'.py');file.parent.mkdir(exist_ok=True)
                    file.write_text('import json,runpy,sys\nfrom pathlib import Path\nrecord=json.loads(Path('+repr(str(home/'install.json'))+').read_text(encoding="utf-8"))\nentry=Path(record["core"])/"scripts"/'+repr(script+'.py')+'\nsys.path.insert(0,str(entry.parent))\nrunpy.run_path(str(entry),run_name="__main__")\n',encoding='utf-8')
            register(folder,root/name,home)


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--home',default=str(Path.home()/'.local/share/nianlun'))
    p.add_argument('--codex-home',default=os.environ.get('CODEX_HOME',str(Path.home()/'.codex')))
    p.add_argument('--runtime-ready',action='store_true')
    p.add_argument('--register-only',action='store_true',help='测试或已有运行环境时仅注册 Skill')
    p.add_argument('--host',action='append',choices=('codex','claude'),help='仅给明确选择的宿主注册入口；不改宿主的设置、账号或权限')
    p.add_argument('--open',action='store_true',help='安装后打开页面接入向导')
    args=p.parse_args();home=Path(args.home).expanduser().resolve();home.mkdir(parents=True,exist_ok=True)
    try:
        if not args.runtime_ready and not args.register_only:
            python=prepare_python(home)
            return subprocess.call([str(python),str(Path(__file__).resolve()),'--home',str(home),'--codex-home',args.codex_home,'--runtime-ready']+sum((['--host',h] for h in (args.host or [])),[])+(['--open'] if args.open else []))
        with file_lock(home/'install.lock'):
            old=n.load(home/'install.json') if (home/'install.json').exists() else {}
            core=home/'core/nianlun';setup_core=home/'core/nianlun-setup'
            setup=PACKAGE/'skills/nianlun-setup'
            if not setup.is_dir():setup=PACKAGE/'nianlun-setup'
            core_status=register(CORE,core,home);setup_status=register(setup,setup_core,home)
            config=old.get('config') or str(Path.home()/'.config/nianlun/config.json')
            result={'version':'2.2.0','python_bin':sys.executable,'home':str(home),'core':str(core),'config':config,
                    'scheduler_entry':old.get('scheduler_entry') or (str(Path(old['skills']['nianlun']['path'])/'scripts/scheduler.py') if old.get('skills') else str(core/'scripts/scheduler.py')),
                    'skills':{'nianlun':{'path':str(core),'status':core_status},'nianlun-setup':{'path':str(setup_core),'status':setup_status}},
                    'host_entries':dict(old.get('host_entries',{}))}
            # Existing Codex installations retain a thin compatibility entry for native scheduled commands.
            hosts=set(args.host or [])
            codex_entry=Path(args.codex_home).expanduser().resolve()/'skills/nianlun'
            if old.get('skills') and (codex_entry.exists() or codex_entry.is_symlink()):hosts.add('codex')
            for provider in hosts:
                root=Path(args.codex_home).expanduser().resolve()/'skills' if provider=='codex' else Path(os.environ.get('CLAUDE_CONFIG_DIR',Path.home()/'.claude'))/'skills'
                register_entry(root,home)
                result['host_entries'][provider]=str(root/'nianlun')
            n.save(home/'install.json',{**result,'ready':False})
            if not args.register_only:
                result['dependencies']=deps.install(home)
            elif old.get('dependencies'):
                result['dependencies']=old['dependencies']
            result.update(ready=bool(old.get('ready')) if args.register_only else True,next='双击“打开年轮”，在页面完成钉钉、表格、独立记忆空间与宿主接入')
            n.save(home/'install.json',result)
        print(json.dumps(result,ensure_ascii=False,indent=2))
        print('\n年轮程序已安装。双击“打开年轮”进入工作台。')
        if args.open and not args.register_only:
            return subprocess.call([sys.executable,str(core/'scripts/launch.py'),'--home',str(home)])
        return 0
    except (OSError,ValueError,n.Error,subprocess.TimeoutExpired) as exc:
        print('安装未完成：'+str(exc),file=sys.stderr);return 1


if __name__=='__main__': sys.exit(main())
