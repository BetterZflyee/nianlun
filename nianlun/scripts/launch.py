#!/usr/bin/env python3
"""Open or start this user's local 年轮 bridge without a terminal left open."""
import argparse
import json
import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, ProxyHandler

import nianlun as n
from setup import default_home


def running(session):
    try:
        value=n.load(session);url=urlsplit(value['url'])
        if url.scheme!='http' or url.hostname!='127.0.0.1' or not url.fragment:return None
        request=Request('http://'+url.netloc+'/api/bootstrap',headers={'Authorization':'Bearer '+url.fragment})
        with build_opener(ProxyHandler({})).open(request,timeout=2) as response:
            result=json.load(response)
        return value['url'] if result.get('version') else None
    except (OSError,ValueError,KeyError):return None


def launch(home,config,open_browser=True):
    home=Path(home).expanduser().resolve();config=Path(config).expanduser().resolve()
    runtime=config.parent/'portal';runtime.mkdir(parents=True,exist_ok=True)
    session=runtime/'session.json';url=running(session)
    if not url:
        log=(runtime/'server.log').open('ab')
        kwargs={'start_new_session':True} if os.name!='nt' else {'creationflags':subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP}
        process=subprocess.Popen([sys.executable,str(Path(__file__).with_name('server.py')),
            '--home',str(home),'--config',str(config),'--no-open'],stdin=subprocess.DEVNULL,stdout=log,stderr=log,**kwargs)
        log.close()
        for _ in range(100):
            url=running(session)
            if url:break
            if process.poll() is not None:
                # A concurrent launcher can win the server lock; reuse its verified session.
                url=running(session)
                if url:break
                raise n.Error('年轮未能启动，请查看个人目录 portal/server.log')
            time.sleep(.15)
        if not url:raise n.Error('工作台启动超时，请在所选 AI 宿主运行接入检查')
    if open_browser:webbrowser.open(url)
    # ⚠️ 必须返回**带 token 的完整地址**。原来这里是 url.split('#')[0]，
    # 把 `#token` 截掉了——调用方拿这个 address 去打开，页面会说
    # 「会话已失效」，用户以为服务没启动。
    # 这正是「关掉网页后再也进不去」的真正原因（2026-11-10 飞哥报的）。
    # token 只在 127.0.0.1 之间传递，不落外部。
    return {'running':True,'url':url,'address':url,'session':str(session)}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--home',default=str(default_home()))
    parser.add_argument('--config',default=str(Path.home()/'.config/nianlun/config.json'))
    parser.add_argument('--no-open',action='store_true')
    args=parser.parse_args()
    try:print(json.dumps(launch(args.home,args.config,not args.no_open),ensure_ascii=False))
    except (OSError,n.Error) as exc:print(str(exc),file=sys.stderr);return 1
    return 0


if __name__=='__main__':sys.exit(main())
