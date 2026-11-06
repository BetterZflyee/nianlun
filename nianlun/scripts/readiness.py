#!/usr/bin/env python3
"""明早生长就绪检查。

改动 flow / planning / report 之后跑一遍，比等到定时任务失败再查快得多。
逐环节验证：采集、记忆、推理宿主、倒排前置与预算、待补清单、报告渲染、
工作台生成、调度槽位。

    python3 readiness.py [配置文件路径]

全部通过退出码 0，有失败退出码 1。
"""
import sys;sys.path.insert(0,'.')
import nianlun as n, growth as g, flow, harness, memory, planning, os
from pathlib import Path

CONFIG_PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/zhufei/.config/nianlun/config.json'
cfg=n.load(CONFIG_PATH)
gw=g.Gateway(cfg)
ok=[];fail=[]

def check(name, fn):
    try:
        r=fn()
        ok.append((name,r))
    except Exception as e:
        fail.append((name,str(e)[:70]))

# 1 采集
def c1():
    st=n.fetch(cfg,gw.table())
    if not st.get('complete'): raise ValueError('数据不完整')
    return f"{len(st['projects'])}项目/{len(st['milestones'])}里程碑"
check('采集·读表', c1)

# 2 记忆
def c2():
    h=memory.retrieve(cfg,'车辆靠(离)卡调度',limit=3)
    if not h.get('pages'): raise ValueError('记忆为空')
    return f"{len(h['pages'])}页/{len(h.get('text','')):,}字"
check('记忆·检索', c2)

# 3 harness
def c3():
    sel=harness.selection(CONFIG_PATH)
    if not os.path.exists(sel.get('binary','')): raise ValueError('binary 不存在')
    return f"{sel['provider']} @ {Path(sel['binary']).name}"
check('推理·harness', c3)

# 4 倒排前置
def c4():
    st=n.fetch(cfg,gw.table())
    act=[p for p in st['projects'] if n.project_active(p)]
    ready=[p for p in act if planning.deadline(p,st) and (p.get('goal') or p.get('description'))]
    if not ready: raise ValueError('无可倒排项目')
    return f"{len(ready)}/{len(act)} 可倒排"
check('倒排·前置', c4)

# 5 倒排 prompt 预算
def c5():
    import json
    st=n.fetch(cfg,gw.table())
    p=[x for x in st['projects'] if n.project_active(x)][0]
    f,_=planning.trim_facts(planning.evidence(st,p['id']))
    size=len(json.dumps(f,ensure_ascii=False))
    if size>80000: raise ValueError(f'超预算 {size}')
    return f"{size:,} 字符"
check('倒排·预算', c5)

# 6 待补清单
def c6():
    b=flow.pending_reports(cfg)
    return f"{len(b)} 项待补" if b else "空"
check('报告·待补', c6)

# 7 报告渲染
def c7():
    import render_report, report_visual, json
    cfgv={'type':'graph','title':'T','caption':'c','nodes':[{'id':'a','label':'A','state':'active','layer':0,'detail':'d','source':'[R1]'},{'id':'b','label':'B','state':'done','layer':1,'detail':'d','source':'[R2]'}],'links':[{'from':'a','to':'b','label':'x','source':'[R1]'}]}
    md='Lead: t\n\n## 总览\n\n```visual\n'+json.dumps(cfgv,ensure_ascii=False)+'\n```\n\n## 风险\nx[R1]\n'
    h=report_visual.enhance(render_report.brief_html(md,'T','2026-10-30','2026-11-06'))
    if 'nianlun-path-3d' not in h: raise ValueError('3D 未注入')
    return f"{len(h):,} 字节含3D"
check('报告·渲染', c7)

# 8 工作台
def c8():
    st=n.fetch(cfg,gw.table())
    n.build_home(st,cfg['growth']['home_output'],cfg)
    return f"{os.path.getsize(cfg['growth']['home_output']):,} 字节"
check('工作台·生成', c8)

# 9 调度
def c9():
    import scheduler
    from datetime import datetime
    rec=n.load('/Users/zhufei/.local/state/nianlun/scheduler.json')
    act=datetime.fromisoformat(rec['activated_at'])
    slots=scheduler.due_slots(cfg['growth']['schedule'],datetime.fromisoformat('2026-11-07T10:00:00+08:00'),act)
    if not slots: raise ValueError('明早无槽位')
    return slots[0]['key'][-20:]
check('调度·槽位', c9)

# 10 launchd 真的会触发吗
def c10():
    import plistlib
    from pathlib import Path
    plist = Path.home()/'Library/LaunchAgents/com.zhufei.nianlun.tick.plist'
    if not plist.exists(): raise ValueError('tick plist 不存在')
    with plist.open('rb') as fh:
        data = plistlib.load(fh)
    args = data.get('ProgramArguments') or []
    if len(args) < 2: raise ValueError('ProgramArguments 不完整')
    py, script = Path(args[0]), Path(args[1])
    if not py.exists(): raise ValueError(f'python 不存在：{py}')
    if not script.exists(): raise ValueError(f'host.py 不存在：{script}')
    if 'StartCalendarInterval' not in data: raise ValueError('没配定时触发')
    return f'每小时整点 · owner={args[args.index("--owner")+1]}'
check('调度·launchd', c10)

# 11 生长没被暂停
def c11():
    import run_control
    if run_control.paused(cfg): raise ValueError('生长被暂停了（schedule-control.json）')
    return '未暂停'
check('调度·未暂停', c11)

print("=== 明早生长就绪检查 ===\n")
for name,val in ok:
    print(f"  ✓ {name:14s} {val}")
for name,val in fail:
    print(f"  ✗ {name:14s} {val}")
print(f"\n{len(ok)} 通过 / {len(fail)} 失败")
sys.exit(0 if not fail else 1)
