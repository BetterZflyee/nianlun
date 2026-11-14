# 离线重放台（replay.py）

> 2026-11-14 建。解决的问题：**改一行代码想验证，要等 43 分钟跑一轮真实生长，一天只有约 3 次机会。**

## 一句话

拿磁盘上的历史 run，重跑「提示词重建 → 决策校验 → 写表计划」三段，**0.5 秒、零网络、零写入**。
改代码前后各跑一次，diff 告诉你「这次改动会让哪几轮历史轮次的行为变化」。

```
无重放台：改代码 → 真跑 1 轮（43 分钟）→ 看结果 → 猜影响面
有重放台：改代码 → matrix --baseline（0.6 秒）→ 明确知道影响 19 轮里的哪 8 轮
```

## 为什么这三段可以离线

整轮生长里，只有三段是「业务判断」，而且都不依赖网络：

| 阶段 | 函数 | 依赖 |
|---|---|---|
| 提示词重建 | `flow.prompt_evidence` + `flow.trim_evidence` | 只需 evidence.json |
| 决策校验 | `growth.validate` | 纯函数（config + bundle + decision） |
| 写表计划 | `validate` 产出的 `action.table_plan` | 纯函数（内部调 `nianlun.plan`） |

实测：191 条来源（2MB 证据）跑完三段 **0.11 秒**。真正的 43 分钟花在等 DWS 和等模型上——那两部分重放台**不覆盖**，也不假装覆盖。

## 用法

```bash
# 有哪些 run 可以重放（含空目录/半成品分类）
python3 tools/replay.py list

# 单轮重放，看这一轮会写什么
python3 tools/replay.py run ~/.local/state/nianlun/runs/<run-id> --verbose

# 全量回归矩阵（默认只读）
python3 tools/replay.py matrix --all

# 建立基线 → 改代码 → 对比影响面（核心工作流）
python3 tools/replay.py matrix --all --write-snapshot /tmp/nl-baseline.json
#   ……改代码……
python3 tools/replay.py matrix --all --baseline /tmp/nl-baseline.json
```

退出码：`0` 全通过 / `1` 有失败 / `2` 参数或环境错误。可直接进 CI。

## 两个必须知道的设计决定

**① 默认重绑定 binding（`--original-binding` 可关）**

历史证据里存的是「当时那份 config」的哈希。表结构只要改过一次，所有历史轮次的
binding 就与今天不符，`validate` 第一句就拒——实测 20 个历史轮次里 19 个全因此失败。
这不是数据坏了，是 binding 把「证据」和「配置快照」绑死了。

重放的语义是「用今天的配置重跑历史证据」，所以默认重算 binding，并把
`binding_drift` 如实标出来。要复现当时的原始拒绝行为，加 `--original-binding`。

**② 快照只记会随代码变化的东西**

`chars / kept / dropped / actions / titles / writes`。不记时间戳、不记文件路径——
否则每次跑都「有变化」，基线对比立刻变成噪音。

## 它证明什么、不证明什么

| 证明 | 不证明 |
|---|---|
| 改动能否通过校验 | 模型会怎么回答（要真调模型） |
| 决策会变成什么表写入 | DWS 会怎么返回 |
| 哪几轮的历史结论会变 | 钉钉会不会拒绝这次写入 |

所以它把「每改一行都真跑一轮」降级为「发版前真跑一轮」，不是取消真跑。

## 顺带产出的可见指标

`matrix` 每次都会打印：

```
⚠ 累计 820 条来源在本轮从未交给模型，却会照样写进 seen.json（B1）
```

这是 B1 缺陷（裁剪丢数据仍标已读）的**唯一量化看板**。跑一次就能看到缺口规模在涨还是缩。

## 测试

```bash
python3 -m unittest tools.test_replay -v      # 10 例
```

锁的不是功能，是「它不会骗我」——假阴性（本该报差异却报 0 变化）比假阳性危险得多，
因为你会基于假阴性去改核心代码。所以有一例专门做反向保证：小样本下调预算**必须**报零变化。

## 已知边界

- 只有 20/80 个 run 有完整 evidence+decision（失败轮没有 decision，重放不了校验段，但能看提示词段和裁剪缺口）；
- 37 个 run 只有证据（失败现场），23 个是空目录（`self_identity` 失败留下的）；
- 不覆盖报告渲染链（`report_blocks` 那套需要浏览器，属另一类问题）。
