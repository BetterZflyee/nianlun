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
