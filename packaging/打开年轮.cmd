@echo off
rem Keep this file pure ASCII: cmd.exe parses it before "chcp 65001" takes effect.
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "open.ps1"
if errorlevel 1 pause
