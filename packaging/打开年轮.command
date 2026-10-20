#!/bin/bash
set -euo pipefail
NIANLUN_PYTHON="$HOME/.local/share/nianlun/runtime/python-env/bin/python"
if [ ! -x "$NIANLUN_PYTHON" ]; then
  echo '请先双击“安装年轮.command”完成安装。'
  read -r -p '按回车关闭。'
  exit 1
fi
"$NIANLUN_PYTHON" - <<'PY'
import json, subprocess, sys
from pathlib import Path
home=Path.home()/'.local/share/nianlun'
install=json.loads((home/'install.json').read_text(encoding='utf-8'))
entry=Path(install['skills']['nianlun']['path'])/'scripts/launch.py'
sys.exit(subprocess.call([sys.executable,str(entry),'--home',str(home)]))
PY
