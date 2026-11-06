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

