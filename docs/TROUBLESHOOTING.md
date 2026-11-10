# 年轮故障排查

遇到问题先按下面的顺序查。每一条都是实际发生过的，附了判断方法和修复动作。

## 一、先看三个地方

```bash
# 1. 表格能不能读（最基础的连通性）
python3 nianlun.py --config ~/.config/nianlun/config.json doctor

# 2. 定时任务最近有没有跑
python3 -c "import json;d=json.load(open('$HOME/.local/state/nianlun/controller.json'));print(d.get('last_checked_at'))"

# 3. 最近一次失败的原文
python3 -c "
import json
d=json.load(open('$HOME/.local/state/nianlun/controller.json'))
for k,v in sorted(d['slots'].items())[-5:]:
    print(k[-24:], v.get('status'), (v.get('error') or '')[:120])
"
```

`doctor` 返回 `ok: true` 且 `complete: true` 说明表结构与绑定一致、四表都能读全。

## 二、按报错找原因

### 「动作必须引用本轮来源 ID 与逐字摘录」

模型引用的 `source_id` 或 `quote` 对不上证据。

- 先看是不是只差 base64 填充符：`message:xxx==` 被写成 `message:xxx`。这种情况代码已能容忍。
- 不是的话，去该 run 的 `evidence.json` 里核对这条 `source_id` 是否存在、`quote` 是否逐字出现在它的 `text` 里。
- 引用必须逐字，标点、全角半角都不能改。

### 「计划内容变更，请重新生成」

`plan.json` 里的 `evidence_hash` 与重新校验时算出的不一致。

**历史根因**（v2.9.2 已修）：`prompt_evidence()` 用浅拷贝复制证据，`trim_evidence()` 裁剪时原地改写超长 source，污染了原 bundle。

如果还遇到，先确认版本：

```bash
grep -c "_copy.deepcopy(bundle)" ~/.local/share/nianlun/core/nianlun/scripts/flow.py
# 输出 0 说明是旧版，需要更新
```

### 「本轮证据较多，已完整保存在运行目录」

提示词超出预算，且裁剪后仍放不下。

看这次裁到了哪一级：

```bash
cat ~/.local/state/nianlun/runs/<run_id>/evidence-trim.json
```

`notes` 里会写明压了多少条记录、多少条来源。如果是 `（仍超预算，交回宿主分批）`，说明数据量确实过大，考虑缩小采集窗口。

### 「DWS 未返回有效结果」

DWS 通道抖了一下。只读调用会自动重试 3 次；写操作不重试（避免重复建记录）。

持续失败就检查登录：

```bash
dws contact user get-self
```

### 「表格写后验证不一致」

写进去了但回读对不上。通常是字段类型或选项不匹配。

```bash
python3 nianlun.py --config ~/.config/nianlun/config.json doctor
```

`warnings` 里会指出具体哪条记录的哪个字段有问题。

### 「当前表没有 XXX 字段」

表结构改过了，但绑定还是旧的。重新绑定：

```bash
python3 nianlun.py --config ~/.config/nianlun/config.json bind --base-url <Base链接>
```

## 三、定时任务不动了

```bash
launchctl list | grep nianlun
```

三个符号的含义：

| 状态 | 含义 |
|---|---|
| `-  0  com.zhufei.nianlun.tick` | 正常，当前没在跑，等下一个整点 |
| `-  1  com.zhufei.nianlun.tick` | 上次退出码 1，有错误，去看 err 日志 |
| 数字 0 | 正在运行 |

看日志：

```bash
tail -50 ~/.local/state/nianlun/logs/tick.err.log
tail -50 ~/.local/state/nianlun/logs/tick.out.log
```

如果 plist 不在了：

```bash
ls ~/Library/LaunchAgents/com.zhufei.nianlun.tick.plist
```

没了就从安装包的「打开年轮」重新注册。

## 四、工作台打不开

```bash
launchctl list | grep nianlun.server
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:63890/
```

返回 200 说明服务正常，问题在浏览器会话令牌——从应用图标重新打开即可（令牌在 URL 的 `#` 后面，不刷新页面不会丢）。

服务没起来：

```bash
launchctl kickstart -k gui/$(id -u)/com.zhufei.nianlun.server
```

## 五、状态目录太大

```bash
du -sh ~/.local/state/nianlun
du -sh ~/.local/state/nianlun/* | sort -rh | head -5
```

v2.9.2 起有自动清理（每次新建 run 时触发）：已完成的保留最近 20 个，未完成的超过 7 天才删。

想手动清理：

```bash
python3 -c "
import sys; sys.path.insert(0, '$HOME/.local/share/nianlun/core/nianlun/scripts')
import growth as g, nianlun as n
cfg = n.load('$HOME/.config/nianlun/config.json')
print(g.prune_runs('$HOME/.local/state/nianlun', cfg['growth']))
"
```

**不要手动 `rm -rf` run 目录**——`active.json` 指向的那个正在恢复中，删了会丢任务。

## 六、想回退版本

先暂停自生长并等写入结束，在侧栏「版本与回退」退出本机服务，再装旧版安装包。

安装器会把原核心放进 `backups`，配置、回执、去重记录都保留。

**不要**通过删除回执或去重记录来「重跑」旧任务——那会造成重复写入。

## 七、报 bug 时带什么

- `doctor` 的完整输出
- 出问题的那个 `run_id`
- 该 run 目录下的 `evidence-trim.json`（能看出数据量）
- 错误原文（`controller.json` 里那条 `error`）

**不要**贴 `evidence.json` 全文——里面有消息原文和可能的敏感内容。

## 八、图不显示、按钮点不动

这一类最容易被误判成「设备不支持」。判断顺序：

**1. 先看浏览器控制台有没有 `[nianlun]` 开头的警告**

我们所有降级路径都会留一条：

```
[nianlun] 3D 路径解析失败：...
[nianlun] 关系图渲染失败，已降级为节点列表：...
[nianlun] 星系布局 worker 出错，已降级：...
```

有这条 = 真的出错了，把里面的 message 贴出来即可定位。
只有「当前设备使用二维路径 / 使用静态图与数据」而**没有** `[nianlun]` 警告，
才是结构本身不支持（正常降级）。

**2. 3D 按钮点了没反应**

3D 是**点击触发**的弹窗，不是自动渲染。报告打开时看到的是平面图，
点「立体查看 ↗」才会进 3D 视窗。

如果按钮文案变成「立体视图加载失败」，说明渲染出错，看控制台的 `[nianlun]` 行。

**3. 「交互图表」点了变成「使用静态图与数据」且变灰**

这是 ECharts 初始化失败。检查该图表的 `type` 是否有对应的 option 分支：

| type | 需要交互运行时 |
|---|---|
| graph / bar / line / gantt | 是 |
| status / matrix | 否（走独立静态分支）|

运行时白名单在 `report_blocks.enhance()` 里，格式是
`data-recap-visual="(?:graph|bar|line|gantt)"`。**加了新图表类型时，
白名单和 `visual-blocks.js` 的 `option()` 分支必须一起改**，只改一边等于没改。

**4. 甘特日期挤在一起**

日期轴按像素预算选步长（`min_slot_pct=14`）。如果现场屏宽特别窄（<600px），
轨道会更短，标签数会自动减少——这是预期行为，不是 bug。

---

## 九、报告没生成出来

**1. 先看待补清单**

```bash
cat ~/.local/state/nianlun/report-backlog.json
```

有内容 = 上一轮失败、已排队等下轮自动补。不需要手工干预。
清单空 = 没有欠账。

**2. 看这一轮的记录**

```bash
ls -t ~/.local/state/nianlun/runs/ | head -1
cat ~/.local/state/nianlun/runs/<最新>/postprocess.json
```

关注 `reports` / `reports_failed` / `reports_error` / `backlog` 四个键。

**3. 工作台上「阶段性汇报」页**

- 绿色条：上轮欠的已补齐
- 黄色条：还有几份待补，下轮重试
- 两条都没有：一切正常

**4. 常见原因**

| 报错 | 原因 |
|---|---|
| DeepSeek Harness 未完成本次推理 | 模型侧超时/额度，可重试 |
| 报告正文仍需修订：可视化格式 | 模型写的图不合格，看具体字段 |
| 未配置推理宿主 | `config.json` 缺 `harness` 段 |

---

## 十、改了代码但没生效

按这个顺序查，能省很多时间：

1. **改的文件是不是真正运行的那份？**
   生产代码在 `~/.local/share/nianlun/core/nianlun/`，
   仓库在项目目录。改完仓库要 **cp 到生产**才生效。

2. **是不是预打包产物？**
   `charts.bundle.js`、`path3d.bundle.js`、`visual-blocks.js` 会被拼接注入报告。
   改 `visual-blocks.js` 里的业务逻辑有效；但**不能拿它整体替换报告里的
   650KB 块**——那里面有 ECharts 全库，替换会把库删掉。

3. **代码有没有被执行路径覆盖？**
   这是最隐蔽的一类。真实案例：给 `option()` 补了 gantt 分支，但
   `enhance()` 的白名单没放行 gantt，整个运行时都不注入——**分支等于白写**。

   验证方法：改完后跑一次真实生成，检查产出的报告里有没有你新加的东西。

   ```bash
   python -c "
   import render_report, report_visual
   h = report_visual.enhance(render_report.brief_html(md, 'T', '2026-10-01', '2026-10-07'))
   print('大小:', len(h), '含改动:', '你的特征串' in h)
   "
   ```

4. **浏览器缓存**
   换文件名或加 `?v=2` 再打开。

## 十一、某个节点在界面上找不到

先确认是「数据没有」还是「界面没显示」。

**1. 查一下这个节点在表里的关键字段**

字段为空最容易被误判成「不存在」：

```bash
# 里程碑没填日期
dws aitable record list --base <base> --table <milestones> | jq '.[] | select(.date == "" or .date == null)'
```

实表统计（2026-11-07）：140 个里程碑里 **13 个没填日期**、**70 个没填描述**。
这些节点标题里往往已经写明了时间（「11月30日」「10月20日 16:00」），
是录入时漏填字段，**不是真的没有时间点**。

**2. 界面应该显示「待定」而不是隐藏它**

如果一个字段缺失就让整条记录消失，用户永远不知道自己有活儿没排期。
正确的做法是显示出来并标注缺失——详情页的里程碑列表就是这么做的
（`m.date || '日期待定'`）。

**3. 检查过滤器**

历史 bug：首页写过

```javascript
S.milestones.filter(m => m.date && m.status !== '已达成')
//                    ^^^^^^^^ 没日期就丢弃
```

这一行让 13 个节点彻底隐形。**过滤条件只该筛掉「不需要看的」，
不该筛掉「数据不全的」。**

**4. 如果整页空白**

可能是某个必填字段为空导致渲染中断。常见于 `${m.date.slice(8)}` 这类
直接调方法的地方——`undefined.slice` 会抛 TypeError 并中断整个页面。
打开控制台看有没有 `Cannot read properties of undefined`。

---

## 十二、界面上有数字对不上

先确认统计口径。历史上踩过的坑：

| 现象 | 原因 |
|---|---|
| 「20 个节点等你确认」，实际 36 个 | 状态有「待核」和「待核对」两种写法，代码只认前一个 |
| 某状态标签空白 | 该字段为空且没写兜底文案 |
| 项目数比预期少 | 已暂停/已完成的项目被 `project_active` 过滤了 |

**排查方法：直接统计实际数据分布，不要只看代码。**

```python
from collections import Counter
Counter(m.get('status') for m in milestones)
```

一眼能看出并列的变体（`待核` / `待核对`）——那就是没归一化的痕迹。


## 十三、看到「写入结果未知」该怎么办

这句话长这样：

```
DWS aitable +record-update：DWS 未返回有效结果，请检查连接与执行记录；
写入结果未知，请核验原结果，未自动重发
```

### 为什么系统不自动重试

**写操作（新建/更新记录、发消息）超时后，系统一律不重发。**

这不是懒，是安全边界。写入超时时你不知道数据到底进没进去：

- 没进去 → 该重发
- 已经进去了 → 重发就是**重复建记录**

第二个后果不可逆，事后对账很痛苦。所以系统选择停手，把判断权交给人。

读操作（查询）不一样，超时会退避重试——多查一次没有副作用。

### 你要做什么

1. **打开 AI 表格，看那条记录在不在**
2. **在的话** —— 当作已成功，下一轮会跳过它
3. **不在的话** —— 什么也不用做，下一轮生长会自动重新规划

### 怎么确认没写重复

跑一下统计，同名记录应该只有一条：

```python
from collections import Counter
import nianlun as n, growth as g
cfg = n.load('~/.config/nianlun/config.json')
gw = g.Gateway(cfg); g.self_identity(gw)
st = n.fetch(cfg, gw.table())
dup = {k: v for k, v in Counter(m['title'] for m in st['milestones']).items() if v > 1}
print('同名重复:', len(dup))
```

实测（2026-11-07 08:05）：那一轮倒排的 DWS 写入超时了，事后统计
**里程碑 174 条、同名重复 0**——说明系统确实没重发，数据是干净的。

### 为什么 DWS 会这么慢

DWS 的延迟波动很大，**跟网络状态强相关**：

| 时段 | 单次查询 |
|---|---|
| 网络抖动期 | 10 秒以上 |
| 网络正常 | 1.2 - 1.4 秒 |

所以单次调用超时设的是 **180 秒**——宁可等，也不要把正常写入误判成失败。

**看到偶发的写入超时不用紧张**，先确认网络（`ping github.com` 之类），
恢复后下一轮会自己补上。

## 第十四章 改了前端代码，刷新页面却没变化

### 先确认你看的是哪份文件

年轮有两份资源，路径不一样：

| 位置 | 用途 |
|---|---|
| `Projects/Project1 年轮/nianlun/assets/portal/` | **源码**，开发时改这里 |
| `~/.local/share/nianlun/core/nianlun/assets/portal/` | **生产副本**，服务实际读这里 |

服务进程是：

```
~/.local/share/nianlun/runtime/python-env/bin/python \
  ~/.local/share/nianlun/core/nianlun/scripts/server.py --no-open
```

`server.py` 里 `ASSETS = n.SKILL/'assets/portal'`，而 `n.SKILL` 指向
**该进程所在的那份代码**。所以改完源码要 `cp` 到 `core/` 再重启服务：

```bash
cp nianlun/assets/portal/*.js ~/.local/share/nianlun/core/nianlun/assets/portal/
launchctl kickstart -k gui/$(id -u)/com.zhufei.nianlun.server
```

### 静态资源的 URL 不是 /assets/...

`server.py` 用一张固定路由表，路径都在**根**上：

```
http://127.0.0.1:63890/memory-view.js      ← 对
http://127.0.0.1:63890/assets/portal/memory-view.js   ← 404
```

**我就是踩了这个**：用错路径 `curl` 拿到 `{"error": "页面不存在"}`，
以为改动没生效，差点去改本来正确的代码。正确做法：

```bash
curl -s http://127.0.0.1:63890/memory-view.js | grep -c '你要找的特征'
```

### 验证顺序

1. 源码里有改动吗 → `grep 特征 源码文件`
2. 生产副本有吗 → `grep 特征 ~/.local/share/.../core/...`
3. **服务返回的有吗** → `curl -s http://127.0.0.1:63890/<文件名>.js | grep 特征`
4. 都没有 → 才去看代码逻辑

第 3 步是关键。跳过它就会像我这轮一样，在「代码明明改了」和「页面没变化」
之间反复怀疑，其实是自己 `curl` 错了地址。

## 第十五章 看到「部分来源待补采」是什么意思

生长面板显示这句话时，`finish.json` 里是 `status: partial`。**这不是失败。**

一轮生长会从多个渠道采集数据，每个渠道独立成败：

| 渠道 | 采什么 |
|---|---|
| `minutes` | 钉钉 AI 听记 |
| `direct` | 会话列表与消息 |
| `mentions` | @我的消息 |
| `mail` | 邮件 |
| `lark_minutes` | 飞书妙记 |
| `harness` / `workbench` | 本机产物 |

`partial` 的意思是：**有渠道没采全，但已经采到的部分照常分析、照常写表。**
整轮的工作没有白做。

### 实测一例（2026-11-07 09:25 那轮）

```
minutes        partial    count=60     DWS 未返回有效结果
mentions       complete   count=0
direct         partial    count=2580   会话目录分页未完整
mail           partial    count=8      7 封中 1 封正文失败
lark_minutes   complete   count=1
harness        complete   count=0
workbench      complete   count=0
```

2580 条消息、60 条听记、8 封邮件都采到了，只是没采全；其中 1 封邮件正文
读失败。

### 要做什么

**通常不用做什么。** 下一轮会自动重采，缺的部分补上。

想确认具体缺什么：

```bash
cd ~/.local/state/nianlun/runs && d=$(ls -dt */ | head -1)
python3 -c "
import json
b = json.load(open('$d/evidence.json'))
for c in b.get('coverage') or []:
    if c.get('status') != 'complete':
        print(c['channel'], c['status'], str(c.get('error'))[:80])
"
```

### 什么时候才该管

| 现象 | 判断 |
|---|---|
| 偶尔 partial，下一轮 complete | 正常，外部接口抖动 |
| **连续多轮同一个渠道 partial** | 那个接口/权限有问题，去查对应章节 |
| `status: failed` | 整轮失败，看 `finish.json` 的 error |

⚠️ 注意区分：`partial` 是「部分成功」，`failed` 才是「失败」。前者数据能用，
后者不能用。

## 第十六章 · 生长整轮停摆，错误是 502

### 症状

定时生长不再产出报告，`finish.json` 里是：

```
dsh: SERVER: 502 status code (no body)
```

连续多轮都是这个错，重试 4 次后标 `abandoned`。

### 先别急着怀疑服务挂了

**502 最常见的真因不是「服务器挂了」，是「请求被送错地方了」。**

2026-11-08 实测：系统代理 `http://127.0.0.1:7897` 开着，`runtime_env()`
把 `HTTP_PROXY` / `HTTPS_PROXY` 传给了 `dsh`，**却没有 `NO_PROXY`**。
于是 `dsh` 访问公司内网 `llm-model-hub-apis.sf-express.com` 时绕去了出境
代理，出不去，返回 502。

### 三步定位

**第一步：确认模型服务本身活着**

```bash
K=$(python3 -c "import yaml;print(yaml.safe_load(open('$HOME/.dsh/.credentials.yaml'))['refs']['SF_LLM_API_KEY'])")
curl -s -o /dev/null -w "%{http_code}\n" --max-time 20 \
  -H "Authorization: Bearer $K" \
  http://llm-model-hub-apis.sf-express.com/v1/models
```

- 返回 **400 或 200** → 服务活着，不是它的问题
- 无响应 / 超时 → 才是真的连不上

**第二步：做代理对照实验（关键）**

```bash
# 不带代理
echo "hi" | SF_LLM_API_KEY="$K" \
  dsh headless --json | tail -2

# 带代理
echo "hi" | SF_LLM_API_KEY="$K" \
  HTTP_PROXY=http://127.0.0.1:7897 HTTPS_PROXY=http://127.0.0.1:7897 \
  dsh headless --json | tail -2
```

- 不带代理能通、带代理报错 → **就是代理问题**，去第三步
- 两个都不通 → 继续查凭证（见下）

**第三步：确认 `runtime_env()` 有内网白名单**

```bash
cd ~/.local/share/nianlun/core/nianlun/scripts
python3 -c "import harness;e=harness.runtime_env();print(e.get('NO_PROXY'))"
```

应该看到包含 `.sf-express.com`、`.dingtalk.com`、`.aliyuncs.com`。

### 另一个常见误判：以为是凭证丢了

`dsh headless` 直跑可能报：

```
MISSING_CREDENTIAL: no credential for provider route "sf-llm"
```

**这不等于年轮拿不到 Key。** 年轮的 `dsh_api_key()` 会从
`~/.dsh/.credentials.yaml` 的 `refs` 段读，直接验证：

```bash
python3 -c "import harness;print(len(harness.dsh_api_key() or ''))"
```

- 打印一个正数（如 283）→ 凭证没问题，**别去动它**
- 打印 0 → 才是凭证问题

⚠️ 我在这上面栽过：以为凭证丢了，加了一段重复的补丁，后来发现
`dsh_api_key()` 早就实现了，白写一遍还多了一套逻辑。

### 还要注意：不要用管道接 `grow` 的输出

```bash
# 会卡死
python3 host.py grow | tail -12

# 正确
python3 host.py grow > /tmp/grow.log 2>&1 < /dev/null &
```

`grow` 运行时间长、输出量大，管道缓冲区满后进程**阻塞在 write 上**，
看起来像「卡在推理」。实测卡了 3 分半、CPU 只用 0.2 秒。
