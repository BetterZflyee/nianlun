$ErrorActionPreference = 'Stop'
$nianlunRoot = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.local/share/nianlun'
$nianlunBootstrap = Join-Path $nianlunRoot 'runtime/bootstrap'
New-Item -ItemType Directory -Force -Path $nianlunBootstrap | Out-Null
$nianlunArch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
if ($nianlunArch -eq 'Arm64') {
    $nianlunAsset = 'uv-aarch64-pc-windows-msvc.zip'
    $nianlunHash = 'ec7846a5939b4654afee24f2d82bf6fde71bd7a6952d7748f1135ab301dd0a49'
} elseif ($nianlunArch -eq 'X64') {
    $nianlunAsset = 'uv-x86_64-pc-windows-msvc.zip'
    $nianlunHash = '3b2661a463a5baea7f5076ea2b25ab71d77f36a6c0d809e5350651792f80a672'
} else { throw '需要 64 位 Windows（x64 或 ARM64）。' }
Write-Host '年轮 · 正在准备个人运行环境（无需预装 Python 或记忆工具）'
$nianlunUv = Join-Path $nianlunBootstrap 'uv.exe'
if (-not (Test-Path $nianlunUv)) {
    $nianlunArchive = Join-Path $nianlunBootstrap 'uv.zip'
    Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/astral-sh/uv/releases/download/0.13.1/$nianlunAsset" -OutFile $nianlunArchive
    if ((Get-FileHash -Algorithm SHA256 $nianlunArchive).Hash.ToLower() -ne $nianlunHash) { throw '官方下载校验失败，已停止。' }
    Expand-Archive -LiteralPath $nianlunArchive -DestinationPath $nianlunBootstrap -Force
    if (-not (Test-Path $nianlunUv)) { throw '下载包没有预期的 uv.exe，已停止。' }
}
$env:UV_PYTHON_INSTALL_DIR = Join-Path $nianlunRoot 'runtime/python'
$env:UV_CACHE_DIR = Join-Path $nianlunRoot 'downloads/uv-cache'
$nianlunPython = Join-Path $nianlunRoot 'runtime/python-env/Scripts/python.exe'
if (-not (Test-Path $nianlunPython)) {
    & $nianlunUv python install 3.12.12 --no-bin --no-registry
    if ($LASTEXITCODE -ne 0) { throw 'Python 下载失败；可重新安装继续。' }
    & $nianlunUv venv --no-project --managed-python --python 3.12.12 (Join-Path $nianlunRoot 'runtime/python-env')
    if ($LASTEXITCODE -ne 0) { throw '个人 Python 环境创建失败。' }
}
& $nianlunUv pip install --python $nianlunPython --index-url https://pypi.org/simple tzdata==2026.5
if ($LASTEXITCODE -ne 0) { throw '时区数据安装失败。' }
& $nianlunPython (Join-Path $PSScriptRoot 'install.py') --runtime-ready --open
if ($LASTEXITCODE -ne 0) { throw '年轮依赖安装未完成。' }
Write-Host '工作台已打开。以后双击“打开年轮.cmd”即可使用。'
