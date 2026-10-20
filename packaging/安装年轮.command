#!/bin/bash
set -euo pipefail
NIANLUN_PACKAGE_DIR="$(cd "$(dirname "$0")" && pwd)"
NIANLUN_INSTALL_ROOT="$HOME/.local/share/nianlun"
NIANLUN_BOOTSTRAP="$NIANLUN_INSTALL_ROOT/runtime/bootstrap"
mkdir -p "$NIANLUN_BOOTSTRAP"
case "$(uname -m)" in
  arm64) NIANLUN_UV_ASSET="uv-aarch64-apple-darwin.tar.gz"; NIANLUN_UV_HASH="cfe454573412ff7380d15fc7dae5997ab53ffce72fce0a78e91ddbc84001acd2"; NIANLUN_UV_DIR="uv-aarch64-apple-darwin" ;;
  x86_64) NIANLUN_UV_ASSET="uv-x86_64-apple-darwin.tar.gz"; NIANLUN_UV_HASH="bb7b805bdcf3d0bc8c74ceb94569e6b3e8aa35bd492acdbb9d46bf46d9d4ff6b"; NIANLUN_UV_DIR="uv-x86_64-apple-darwin" ;;
  *) echo '此启动器支持 Apple Silicon 和 Intel Mac。'; exit 1 ;;
esac
trap 'echo "安装中断。已有表格和记忆未删除；检查网络后可重新打开安装器。"; read -r -p "按回车关闭"' ERR
echo '年轮 · 正在准备个人运行环境（无需预装 Python 或 GBrain）'
NIANLUN_UV="$NIANLUN_BOOTSTRAP/$NIANLUN_UV_DIR/uv"
if [ ! -x "$NIANLUN_UV" ]; then
  curl --fail --location --connect-timeout 20 --max-time 600 "https://github.com/astral-sh/uv/releases/download/0.13.1/$NIANLUN_UV_ASSET" -o "$NIANLUN_BOOTSTRAP/uv.tar.gz"
  NIANLUN_ACTUAL_HASH="$(shasum -a 256 "$NIANLUN_BOOTSTRAP/uv.tar.gz" | awk '{print $1}')"
  if [ "$NIANLUN_ACTUAL_HASH" != "$NIANLUN_UV_HASH" ]; then echo '官方下载校验失败，已停止。'; exit 1; fi
  tar -xzf "$NIANLUN_BOOTSTRAP/uv.tar.gz" -C "$NIANLUN_BOOTSTRAP"
fi
export UV_PYTHON_INSTALL_DIR="$NIANLUN_INSTALL_ROOT/runtime/python"
export UV_CACHE_DIR="$NIANLUN_INSTALL_ROOT/downloads/uv-cache"
NIANLUN_PYTHON="$NIANLUN_INSTALL_ROOT/runtime/python-env/bin/python"
if [ ! -x "$NIANLUN_PYTHON" ]; then
  "$NIANLUN_UV" python install 3.12.12 --no-bin --no-registry
  "$NIANLUN_UV" venv --no-project --managed-python --python 3.12.12 "$NIANLUN_INSTALL_ROOT/runtime/python-env"
fi
"$NIANLUN_UV" pip install --python "$NIANLUN_PYTHON" --index-url https://pypi.org/simple tzdata==2026.5
"$NIANLUN_PYTHON" "$NIANLUN_PACKAGE_DIR/install.py" --runtime-ready --open
read -r -p '工作台已打开。以后双击“打开年轮”即可使用，按回车关闭安装窗口。'
