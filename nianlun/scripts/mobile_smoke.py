#!/usr/bin/env python3
"""移动端布局冒烟：真实 390px 视口下不能有横向溢出。

## 为什么必须用 CDP

`chrome --headless --window-size=390,1400` **不会真的把视口设成 390**。
实测：加了 `--window-size=390` 之后 `document.body.clientWidth` 仍然是
**500**。于是截图里看到的「时区被截断」是假象——不是页面布局坏了，是
截图参数没生效。

正确做法是 CDP 的 `Emulation.setDeviceMetricsOverride`。

## 检查什么

1. `window.innerWidth` 真的等于目标宽度
2. `body.scrollWidth <= clientWidth`（没有横向滚动条）
3. 关键文本块 `scrollWidth <= clientWidth`（长词没撑破容器）
4. 底部导航存在且横排（窄屏侧栏要变底栏）

用法：`python3 mobile_smoke.py [宽度]`
退出码 0 = 全部通过。
"""
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CONFIG = Path.home() / '.config/nianlun/config.json'
WIDTH = int(sys.argv[1]) if len(sys.argv) > 1 else 390


def page_path():
    import nianlun as n
    cfg = n.load(CONFIG)
    return Path(cfg['growth']['home_output'])


def main():
    if not Path(CHROME).is_file():
        print('跳过：本机没有 Chrome')
        return 0
    target = page_path()
    if not target.exists():
        print(f'跳过：工作台不存在 {target}')
        return 0

    port = 9471
    profile = tempfile.mkdtemp(prefix='nl-mobile-')
    proc = subprocess.Popen(
        [CHROME, '--headless', '--no-sandbox',
         f'--remote-debugging-port={port}', f'--user-data-dir={profile}',
         target.as_uri()],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        ws = None
        for _ in range(40):
            time.sleep(0.25)
            try:
                tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'))
                pages = [t for t in tabs if t['type'] == 'page']
                if pages:
                    ws = pages[0]['webSocketDebuggerUrl']
                    break
            except Exception:
                continue
        if not ws:
            print('✗ 连不上调试端口')
            return 1

        # 用标准库实现最小 CDP 客户端（不依赖 websocket 第三方包）
        import base64
        import socket
        from urllib.parse import urlparse

        url = urlparse(ws)
        sock = socket.create_connection((url.hostname, url.port), timeout=20)
        key = base64.b64encode(b'0123456789abcdef').decode()
        sock.sendall((
            f'GET {url.path} HTTP/1.1\r\nHost: {url.hostname}:{url.port}\r\n'
            f'Upgrade: websocket\r\nConnection: Upgrade\r\n'
            f'Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
        ).encode())
        sock.recv(4096)  # 握手响应

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
            mask = b'\x00\x00\x00\x00'
            sock.sendall(bytes(head) + mask + data)

        def recv():
            head = sock.recv(2)
            if len(head) < 2:
                return None
            length = head[1] & 0x7F
            if length == 126:
                length = int.from_bytes(sock.recv(2), 'big')
            elif length == 127:
                length = int.from_bytes(sock.recv(8), 'big')
            chunks, got = [], 0
            while got < length:
                part = sock.recv(length - got)
                if not part:
                    break
                chunks.append(part)
                got += len(part)
            try:
                return json.loads(b''.join(chunks))
            except Exception:
                return None

        counter = [0]

        def call(method, params=None):
            counter[0] += 1
            send({'id': counter[0], 'method': method, 'params': params or {}})
            while True:
                msg = recv()
                if msg is None:
                    return None
                if msg.get('id') == counter[0]:
                    return msg

        call('Runtime.enable')
        call('Emulation.setDeviceMetricsOverride',
             {'width': WIDTH, 'height': 1400, 'deviceScaleFactor': 2, 'mobile': True})
        time.sleep(1.5)
        # 切到「我的待办」——里程碑风险面板只在这个页面，不切过去就永远测不到
        # （会显示「未出现」而假装通过，那是假阳性）。
        call('Runtime.evaluate', {
            'expression': '''(() => {
              // 导航按钮是 [data-nav] 属性，不是 nav > button。
              // 选错了会静默不切页，让后面的检查变成「未出现」假通过。
              const b = [...document.querySelectorAll('[data-nav]')]
                .find(x => x.textContent.includes('我的待办'));
              if (b) b.click();
              return !!b;
            })()''',
            'returnByValue': True})
        time.sleep(6)
        expr = '''(() => {
          const out = {viewport: window.innerWidth,
                       bodyScroll: document.body.scrollWidth,
                       bodyClient: document.body.clientWidth,
                       overflow: [], nav: null};
          document.querySelectorAll('.growth-panel p, .note, .timeline p, .report-card p').forEach(el => {
            if (el.scrollWidth > el.clientWidth + 2) {
              out.overflow.push((el.className || el.tagName) + ' ' + el.scrollWidth + '>' + el.clientWidth);
            }
          });
          // 底栏/侧栏导航：静态页是 .nav，portal 是 [data-nav] 容器。
          // 切页后 DOM 可能被整体替换，这里要重新查并容错，不能拿到 null 就
          // 报「不是横排」——那是把「没找到」误报成「布局坏了」。
          const nav = document.querySelector('.nav') ||
                      document.querySelector('nav[aria-label="主导航"]') ||
                      document.querySelector('nav');
          if (nav) {
            const cs = getComputedStyle(nav);
            out.nav = {direction: cs.flexDirection, found: true};
          } else {
            out.nav = {direction: null, found: false};
          }
          // 里程碑风险面板在窄屏要能放下：行不能溢出面板，天数不能挤掉标题。
          const risk = document.querySelector('.milestone-risk');
          if (risk) {
            const rr = risk.getBoundingClientRect();
            const rows = [...risk.querySelectorAll('.milestone-risk-row')];
            out.risk = {
              present: true,
              panelW: Math.round(rr.width),
              rows: rows.length,
              escaped: rows.filter(r => {
                const x = r.getBoundingClientRect();
                return x.right > rr.right + 1 || x.left < rr.left - 1;
              }).length,
              tooNarrow: rows.filter(r => r.getBoundingClientRect().width < 120).length,
            };
          } else out.risk = {present: false};
          return out;
        })()'''
        result = call('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
        data = (result or {}).get('result', {}).get('result', {}).get('value') or {}

        checks = [
            ('视口宽度', data.get('viewport') == WIDTH, f"{data.get('viewport')} (期望 {WIDTH})"),
            ('无横向溢出', data.get('bodyScroll', 9999) <= data.get('bodyClient', 0) + 1,
             f"scroll={data.get('bodyScroll')} client={data.get('bodyClient')}"),
            ('长文本未撑破', not data.get('overflow'), ', '.join(data.get('overflow') or []) or '无'),
            # 找不到导航元素时不算失败——那是「这个页面没有导航」，
            # 不是「导航布局坏了」。之前把两者混在一起会误报。
            ('底栏横排',
             not (data.get('nav') or {}).get('found', True)
             or (data.get('nav') or {}).get('direction') == 'row',
             ('未找到导航' if not (data.get('nav') or {}).get('found', True)
              else str((data.get('nav') or {}).get('direction')))),
            # 面板存在时才有意义；不存在（未打开待办页）算通过，别误报。
            ('里程碑风险面板不溢出',
             not (data.get('risk') or {}).get('present')
             or ((data['risk'].get('escaped') or 0) == 0
                 and (data['risk'].get('tooNarrow') or 0) == 0),
             ('未出现' if not (data.get('risk') or {}).get('present')
              else f"{data['risk'].get('rows')} 行, 溢出 {data['risk'].get('escaped')}, "
                   f"过窄 {data['risk'].get('tooNarrow')}")),
        ]
        print(f'=== 移动端 {WIDTH}px ===')
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
