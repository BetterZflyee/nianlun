@echo off
rem Keep this file pure ASCII: cmd.exe parses it before "chcp 65001" takes effect,
rem so non-ASCII paths would be decoded with the OEM code page and turn into mojibake.
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "install.ps1"
if errorlevel 1 (
  echo Installation did not finish. Check your network and retry,
  echo or hand this package to Codex to finish the install.
)
pause
