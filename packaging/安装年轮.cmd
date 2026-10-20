@echo off
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0安装年轮.ps1"
if errorlevel 1 echo 安装未完成。请检查网络后重试，或把安装包交给 Codex 继续安装。
pause
