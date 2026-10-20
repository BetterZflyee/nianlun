$ErrorActionPreference = 'Stop'
$nianlunRoot = Join-Path $env:USERPROFILE '.local/share/nianlun'
$nianlunInstallPath = Join-Path $nianlunRoot 'install.json'
if (-not (Test-Path $nianlunInstallPath)) { throw '请先双击“安装年轮.cmd”。' }
$nianlunInstall = Get-Content -Raw -Encoding UTF8 $nianlunInstallPath | ConvertFrom-Json
$nianlunEntry = Join-Path $nianlunInstall.skills.nianlun.path 'scripts/launch.py'
& $nianlunInstall.python_bin $nianlunEntry --home $nianlunRoot
if ($LASTEXITCODE -ne 0) { throw '工作台启动失败，请在所选 AI 宿主运行年轮接入检查。' }
