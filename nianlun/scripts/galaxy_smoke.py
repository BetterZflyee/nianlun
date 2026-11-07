#!/usr/bin/env python3
"""3D 星图冒烟：验证本地工作台的 Three.js 真的渲染出来且可交互。

## 为什么需要这个脚本

前几轮我一直在数「静态报告里有多少份带 3D」，得出 21% 就以为覆盖率低。
**真正的 3D 在本地工作台的「项目记忆」页**——每次打开都能看到，不是报告里
偶尔出现的附加物。

`path3d_smoke.py` 验的是**报告里的依赖图 3D**；这个脚本验的是**工作台的
记忆星图 3D**。两者是不同的渲染路径，不能互相代替。

## 怎么打开工作台（踩过的坑）

服务器由 launchd 启动，token 存在 `~/.config/nianlun/portal/token`
（`app.runtime = config.parent/'portal'`，**不是** `~/.local/state/nianlun`）。
URL 是 `http://127.0.0.1:63890/#<token>`——**token 走 location.hash**，
写成 `?token=` 会一直提示「会话已失效」。

## 检查什么

1. 页面能打开（HTTP 200）
2. 「项目记忆」页有 canvas，且在 `.mv-stage` 容器里
3. canvas 尺寸合理（宽度 > 400）
4. 数据真的加载了（不是「正在读取真实数据…」）
5. 控制按钮存在且可用
6. canvas 有 aria-label（无障碍）
"""
import json
import sys
import urllib.request
from pathlib import Path

PORT = 63890
TOKEN_FILE = Path.home() / '.config/nianlun/portal/token'


def token():
    try:
        return TOKEN_FILE.read_text(encoding='utf-8').strip()
    except OSError:
        return None


def main():
    t = token()
    if not t:
        print(f'跳过：找不到 token（{TOKEN_FILE}）')
        return 0
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{PORT}/', timeout=5) as r:
            ok = r.status == 200
    except Exception as exc:
        print(f'跳过：工作台未运行（{type(exc).__name__}）')
        return 0
    if not ok:
        print('✗ 工作台返回非 200')
        return 1

    # 用 CDP 打开页面并切到记忆页。这里复用 mobile_smoke 那套最小 WS 客户端思路，
    # 但为了简单直接用 Chrome 的 --dump-dom 拿不到 canvas（需要 JS 执行后状态），
    # 所以走 remote debugging。
    import base64
    import socket
    import subprocess
    import tempfile
    import time
    from urllib.parse import urlparse

    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if not Path(chrome).is_file():
        print('跳过：本机没有 Chrome')
        return 0

    profile = tempfile.mkdtemp(prefix='nl-galaxy-')
    proc = subprocess.Popen(
        [chrome, '--headless', '--no-sandbox',
         '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
         f'--remote-debugging-port=9473', f'--user-data-dir={profile}',
         'about:blank'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        ws = None
        for _ in range(60):
            time.sleep(0.25)
            try:
                tabs = json.load(urllib.request.urlopen('http://127.0.0.1:9473/json'))
                pages = [x for x in tabs if x['type'] == 'page']
                if pages:
                    ws = pages[0]['webSocketDebuggerUrl']
                    break
            except Exception:
                continue
        if not ws:
            print('✗ 连不上调试端口')
            return 1

        u = urlparse(ws)
        sock = socket.create_connection((u.hostname, u.port), timeout=30)
        key = base64.b64encode(b'0123456789abcdef').decode()
        sock.sendall((f'GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n'
                      f'Upgrade: websocket\r\nConnection: Upgrade\r\n'
                      f'Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
        sock.recv(4096)
        seq = [0]

        def send(obj):
            data = json.dumps(obj).encode()
            head = bytearray([0x81])
            n = len(data)
            if n < 126:
                head.append(0x80 | n)
            elif n < 65536:
                head.append(0x80 | 126)
                head += n.to_bytes(2, 'big')
            else:
                head.append(0x80 | 127)
                head += n.to_bytes(8, 'big')
            sock.sendall(bytes(head) + b'\x00\x00\x00\x00' + data)

        def recv():
            h = sock.recv(2)
            if len(h) < 2:
                return None
            ln = h[1] & 0x7F
            if ln == 126:
                ln = int.from_bytes(sock.recv(2), 'big')
            elif ln == 127:
                ln = int.from_bytes(sock.recv(8), 'big')
            buf, got = [], 0
            while got < ln:
                p = sock.recv(ln - got)
                if not p:
                    break
                buf.append(p)
                got += len(p)
            try:
                return json.loads(b''.join(buf))
            except Exception:
                return None

        def call(method, params=None):
            seq[0] += 1
            send({'id': seq[0], 'method': method, 'params': params or {}})
            while True:
                m = recv()
                if m is None:
                    return None
                if m.get('id') == seq[0]:
                    return m

        def js(expr):
            r = call('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
            return ((r or {}).get('result') or {}).get('result', {}).get('value')

        call('Runtime.enable')
        call('Emulation.setDeviceMetricsOverride',
             {'width': 1400, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
        js(f"location.href='http://127.0.0.1:{PORT}/#%s'" % t)
        time.sleep(11)
        # 切到项目记忆
        js("(()=>{const b=[...document.querySelectorAll('nav button')].find(x=>x.textContent.includes('项目记忆'));if(b)b.click();return !!b})()")
        time.sleep(9)

        data = js("""(() => {
          const c = document.querySelector('canvas');
          const stage = document.querySelector('.mv-stage');
          const r = c ? c.getBoundingClientRect() : null;
          const ctrls = [...document.querySelectorAll('button')]
            .filter(b => ['回全景','开启漫游','立体星云','一跳引用'].some(k => b.textContent.includes(k)))
            .map(b => ({ t: b.textContent.trim().slice(0,8), disabled: !!b.disabled }));
          return {
            hasCanvas: !!c,
            inStage: !!(c && stage && c.closest('.mv-stage')),
            w: r ? Math.round(r.width) : 0,
            h: r ? Math.round(r.height) : 0,
            loading: document.body.innerText.includes('正在读取真实数据'),
            controls: ctrls,
            aria: c ? (c.getAttribute('aria-label') || '').slice(0, 20) : ''
          };
        })()""") or {}

        checks = [
            ('记忆页有 canvas', data.get('hasCanvas'), str(data.get('hasCanvas'))),
            ('canvas 在舞台容器内', data.get('inStage'), str(data.get('inStage'))),
            ('canvas 宽度 > 400', (data.get('w') or 0) > 400, f"{data.get('w')}x{data.get('h')}"),
            ('数据已加载', not data.get('loading'), '加载中' if data.get('loading') else '完成'),
            ('控制按钮可用', bool([c for c in (data.get('controls') or []) if not c['disabled']]),
             ', '.join(c['t'] for c in (data.get('controls') or [])) or '无'),
            ('有无障碍标签', bool(data.get('aria')), data.get('aria') or '无'),
        ]
        print('=== 3D 星图冒烟 ===')
        failed = 0
        for name, ok, detail in checks:
            print(f'  {"✓" if ok else "✗"} {name}: {detail}')
            if not ok:
                failed += 1
        print(f'\n{len(checks) - failed} 通过 / {failed} 失败')
        return 1 if failed else 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()


if __name__ == '__main__':
    sys.exit(main())
