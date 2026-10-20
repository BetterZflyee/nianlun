"""Install verified upstream runtimes into a user-owned directory; no sudo or global upgrade."""
import hashlib
import json
import os
import platform
import re
import shutil
import stat
import subprocess
import tarfile
import tempfile
import urllib.request
import urllib.error
import zipfile
from pathlib import Path
import nianlun as n

LOCK = n.load(n.SKILL / 'references/dependencies.lock.json')


def platform_key():
    system = {'Darwin': 'darwin', 'Windows': 'windows', 'Linux': 'linux'}.get(platform.system())
    arch = {'arm64': 'arm64', 'aarch64': 'arm64', 'AMD64': 'x64', 'x86_64': 'x64'}.get(platform.machine())
    if not system or not arch:
        raise n.Error('暂不支持当前系统或 CPU；支持 macOS / Windows / Linux 的 64 位平台')
    return system, arch


def find_binary(name):
    found = shutil.which(name)
    if found and not found.lower().endswith(('.cmd', '.bat')):
        return str(Path(found).absolute())
    for directory in (Path.home()/'.bun/bin', Path.home()/'.nodejs/bin', Path('/opt/homebrew/bin'), Path('/usr/local/bin')):
        path = directory / (name + ('.exe' if os.name == 'nt' else ''))
        if path.is_file():
            return str(path)
    return None


def version(command):
    try:
        r = subprocess.run(command + ['--version'], capture_output=True, text=True, encoding='utf-8', timeout=30)
        return r.stdout.strip().splitlines()[0][:160] if r.returncode == 0 and r.stdout.strip() else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def compatible(command, minimum):
    current=version(command) if command else None
    match=re.search(r'\b(\d+)\.(\d+)\.(\d+)',current or '')
    return bool(match and tuple(map(int,match.groups()))>=minimum)


def download(spec, cache):
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / spec['sha256']
    if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == spec['sha256']:
        return target
    request = urllib.request.Request(spec['url'], headers={'User-Agent': 'nianlun-installer/0.3'})
    temp = target.with_suffix('.download')
    try:
        try:
            with urllib.request.urlopen(request, timeout=60) as response, temp.open('wb') as output:
                shutil.copyfileobj(response, output)
        except urllib.error.URLError:
            # Native curl uses the OS certificate/proxy stack, useful on corporate Mac/Windows networks.
            curl = shutil.which('curl.exe' if os.name == 'nt' else 'curl')
            if not curl: raise
            r = subprocess.run([curl,'--fail','--location','--silent','--show-error','--connect-timeout','20',
                                '--max-time','600','--output',str(temp),spec['url']],capture_output=True,timeout=620)
            if r.returncode: raise n.Error('无法从官方来源下载安装依赖；请检查 GitHub 网络连接后重试，下载缓存会保留')
        if hashlib.sha256(temp.read_bytes()).hexdigest() != spec['sha256']:
            raise n.Error('官方下载校验不一致，未执行下载文件；请保留原环境并更新安装包')
        os.replace(temp, target)
    except Exception:
        temp.unlink(missing_ok=True)
        raise
    return target


def extract(archive, destination, kind):
    """No links, devices, absolute paths, or traversal in downloaded archives."""
    destination = destination.resolve()
    def target(name):
        path = (destination / name.replace('\\', '/')).resolve()
        if not path.is_relative_to(destination):
            raise n.Error('下载包包含越界路径，已停止')
        return path
    if kind == 'zip':
        with zipfile.ZipFile(archive) as z:
            for entry in z.infolist():
                path = target(entry.filename)
                if stat.S_ISLNK(entry.external_attr >> 16):
                    raise n.Error('下载包中的符号链接不允许安装')
                if entry.is_dir():
                    path.mkdir(parents=True, exist_ok=True)
                else:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(entry) as src, path.open('wb') as dst:
                        shutil.copyfileobj(src, dst)
    else:
        with tarfile.open(archive, 'r:gz') as t:
            for entry in t.getmembers():
                path = target(entry.name)
                if entry.isdir():
                    path.mkdir(parents=True, exist_ok=True)
                elif entry.isfile():
                    path.parent.mkdir(parents=True, exist_ok=True)
                    with t.extractfile(entry) as src, path.open('wb') as dst:
                        shutil.copyfileobj(src, dst)
                elif entry.issym() or entry.islnk():
                    # Source packages contain convenience links; executable entrypoints are real files.
                    continue
                else:
                    raise n.Error('下载包包含不支持的文件类型')


def install_asset(tool, asset, home, filename):
    spec = LOCK[tool]['assets'][asset]
    target = home / 'runtime' / (tool + '-' + LOCK[tool]['version']) / filename
    if target.is_file() and version([str(target)]):
        return str(target)
    data = download(spec, home/'downloads')
    target.parent.mkdir(parents=True, exist_ok=True)
    if asset.endswith(('.zip', '.tar.gz')):
        with tempfile.TemporaryDirectory(dir=home) as tmp:
            extract(data, Path(tmp), 'zip' if asset.endswith('.zip') else 'tar')
            matches = list(Path(tmp).rglob(filename))
            if len(matches) != 1:
                raise n.Error('官方安装包中的可执行文件不唯一')
            shutil.copyfile(matches[0], target)
    else:
        shutil.copyfile(data, target)
    target.chmod(0o755)
    if not version([str(target)]):
        raise n.Error(tool + ' 已下载但启动验证失败；未登记为可用')
    return str(target)


def install(home, source_gbrain=False):
    home = Path(home).expanduser().resolve(); home.mkdir(parents=True, exist_ok=True)
    system, arch = platform_key()
    registry = home/'dependencies.json'
    result = n.load(registry) if registry.exists() else {}
    dws = result.get('dws_bin') or find_binary('dws')
    if not dws or not compatible([dws],(1,0,61)):
        asset = f'dws-{system}-' + ('amd64' if arch == 'x64' else 'arm64') + ('.zip' if system == 'windows' else '.tar.gz')
        dws = install_asset('dws', asset, home, 'dws.exe' if system == 'windows' else 'dws')
    result['dws_bin'] = dws
    n.save(registry, result)
    existing = find_binary('gbrain')
    brain = result.get('gbrain_command') or ([existing] if existing else None)
    if not brain or not compatible(brain,(0,51,0)) or source_gbrain:
        asset = f'gbrain-{system}-{arch}'
        if asset in LOCK['gbrain']['assets'] and not source_gbrain:
            brain = [install_asset('gbrain', asset, home, 'gbrain')]
        else:
            bun_asset = {'windows-x64':'bun-windows-x64-baseline.zip', 'windows-arm64':'bun-windows-aarch64.zip',
                         'darwin-x64':'bun-darwin-x64.zip', 'darwin-arm64':'bun-darwin-aarch64.zip',
                         'linux-arm64':'bun-linux-aarch64.zip', 'linux-x64':'bun-linux-x64-baseline.zip'}[system+'-'+arch]
            bun = install_asset('bun', bun_asset, home, 'bun.exe' if system == 'windows' else 'bun')
            src = home/'runtime'/('gbrain-source-'+LOCK['gbrain']['version'])
            if not (src/'src/cli.ts').is_file():
                with tempfile.TemporaryDirectory(dir=home) as tmp:
                    extract(download(LOCK['gbrain']['source'], home/'downloads'), Path(tmp), 'tar')
                    roots = [p.parent.parent for p in Path(tmp).glob('*/src/cli.ts')]
                    if len(roots) != 1:
                        raise n.Error('GBrain 源码入口不唯一')
                    shutil.copytree(roots[0], src, dirs_exist_ok=True)
            env = os.environ.copy(); env['PATH'] = str(Path(bun).parent) + os.pathsep + env.get('PATH', '')
            # Upstream postinstall migrates the globally active brain. Skip it: init targets the selected brain later.
            r = subprocess.run([bun, 'install', '--frozen-lockfile', '--ignore-scripts'], cwd=src, env=env,
                               capture_output=True, text=True, encoding='utf-8', timeout=900)
            if r.returncode:
                raise n.Error('GBrain 依赖安装失败；保留下载缓存，检查网络后可续装。未修改已有 GBrain。')
            brain = [bun, str(src/'src/cli.ts')]
            if not version(brain):
                raise n.Error('GBrain 源码启动检查未通过')
    result.update(gbrain_command=brain, versions={'dws':version([dws]), 'gbrain':version(brain)},
                  platform=system+'-'+arch)
    n.save(registry, result)
    return result
