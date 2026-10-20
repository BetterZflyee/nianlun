# 接入与迁移

安装版用户优先使用 [Codex 接入向导](setup-wizard.md)：它会准备 Python/DWS/GBrain、初始化子表、完成绑定并核验原生调度。以下命令用于已有运行环境的手动接入与排障；不需要普通用户自己填写。

年轮不创建新的数据存储。用户已有的钉钉 AI 表格仍是唯一项目主数据源。

## 现有工作台接入

1. 确认环境能执行 `dws --version`，并已登录目标组织。认证出错交给 DWS 当前版本的登录流程；不读取、复制或索取 token。
2. 用户指定 Base 后执行只读绑定：

```sh
python3 <skill>/scripts/nianlun.py --config <用户目录>/nianlun.json bind \
  --base-id <真实BaseID> --base-url <该Base的完整HTTPS链接>
```

如需指定 DWS profile，绑定时传 `--profile <用户明确指定的profile>`，后续命令自动保持一致。

默认寻找项目主表、里程碑表、场地表、项目记录表（忽略名称前的 emoji）。已有表名称不同，用 `--table-map <JSON文件>`，内容为 `projects/milestones/sites/records` 到真实 tableId 的映射。字段使用语义名称解析；字段缺失或歧义会报出具体位置，不擅自创建、删除或改名。

3. 执行 `doctor`，应返回 `complete:true`、四表实时条数和关联诊断。
4. 执行 `home --out <输出目录>/年轮.html`。双击 HTML 即可使用，无需启动服务器。编辑入口指向原表。重新执行 home 才刷新数据。

## 新用户

将整个 `nianlun/` 目录复制到支持 Skill 的 AI 工具的技能目录。Codex 默认 `~/.codex/skills/nianlun/`，其他宿主使用各自约定。DWS 仍由用户自己的身份登录。

新用户没有表时，可在钉钉复制经用户同意的**仅结构**模板；或使用 DWS 创建四表。此操作要明确目标空间，再调用目标环境中的 AITable 技能，不自动复制原用户数据。年轮绑定成功后，表 ID 和字段 ID 都由真实返回填写。

## 最小表结构

| 表 | 必需字段 | 关系 |
|---|---|---|
| 项目主表 | 项目名称(text)、状态(singleSelect) | — |
| 里程碑表 | 里程碑(text)、截止日期(date)、状态(singleSelect)、项目(link) | → 项目主表 |
| 场地表 | 场地名称(text)、项目(link) | → 项目主表，允许多项目 |
| 项目记录表 | 标题(text)、详情(text)、日期(date)、记录类型(singleSelect)、状态(singleSelect)、项目(link) | → 项目主表 |

可选字段：优先级/目标/风险/汇报链接；记录关联场地与里程碑、附件；里程碑交付内容、预期效益和附件。不能为了套模板而删除已有字段。

记录类型与状态沿用目标表已有选项。`inspect` 中可读取现有数据，配置中的字段 config 包含选项。更新选项后重新绑定，确认变化后再写入。

## 本地文件的性质

- `nianlun.json`：个人绑定，不含凭据。不是项目数据库。
- HTML/Markdown：重新从表读取生成的交付快照，可删除再生成。
- 候选/计划/回执：单次操作的可审阅文件；项目事实仍在云端表。
- 不使用 SQLite、浏览器 localStorage、自建账号或自建项目后台。


## 生长引擎接入

完成四表 bind 后，将 [growth-config.example.json](growth-config.example.json) 的 growth 节合并到个人配置。各路径和汇报目录必须在目标环境核验；开关仅在用户授权范围内开启。调度由 Harness 创建，`schedule` 本身不负责安装任务。先运行首轮 collect/plan/apply/finish 核验，再切换旧任务；详见 [生长闭环](automation.md)。GBrain 使用当前原生 capture 管理托管工作区，输入文件暂存在运行目录，不直接覆盖记忆仓库。
