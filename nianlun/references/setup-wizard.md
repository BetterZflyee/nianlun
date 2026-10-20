# 安装向导（v0.5）

默认使用本机页面完成接入；用户在 AI 宿主中安装时也可使用原生问答组件。不要要求用户自己运行命令、填写 ID 或编辑 JSON。以下命令是给执行安装的 AI 宿主 使用的。

先读取 [宿主契约](host-contract.md)。安装核心不依赖 Codex；程序位于安装记录的 core 目录。宿主选择通过 host.py connect 保存；CLI 或 delegated 模式按能力选择。以下 Codex 原生调度步骤仅适用于 Codex 负责唤醒的安装。其他宿主按宿主契约的单负责人流程接入，不能把待核验写成已启用。

## 运行入口

安装包包含 Mac `安装年轮.command`、Windows `安装年轮.cmd` 和 `在Codex中安装.md`。双击启动器会安装个人 Python 环境、安装独立核心、补齐 DWS/GBrain，随后自动打开本机页面向导。也可以把安装包交给 Codex，在当前会话读 `在Codex中安装.md`，直接执行同样的安装流程。

安装器不依赖系统 Python、Node、管理员权限或预装 GBrain。Python 由锁定版本 uv 管理；DWS 下载官方二进制。GBrain 在有官方二进制的平台使用二进制，Windows、Intel Mac 使用固定提交源码与固定 Bun；禁用源码 postinstall，避免顺带迁移用户全局 GBrain。Windows 原生系统实测状态见包内验收说明，不把其他平台的测试说成 Windows 实测。

安装记录在 `~/.local/share/nianlun/install.json`，记录真实 `python_bin`、Skill 路径及运行时目录。先读记录，以该 Python 执行脚本。不存在时先执行安装包入口；在 Codex 中可用 `load_workspace_dependencies` 返回的 Python 运行 `install.py`，它会继续准备个人运行环境。核心脚本也支持系统 Python 3.11+。

脚本：本 Skill 的 `scripts/setup.py`。全程保持同一 `--home`（默认 `~/.local/share/nianlun`）和 `--config`（默认 `~/.config/nianlun/config.json`）。一次只初始化一个工作空间；不同账号/表格使用独立配置目录。先执行 `probe`。已有个人配置时先问继续使用还是新增工作空间；绝不让新安装覆盖原绑定。

## 1. 连接钉钉

1. `dependencies --yes` 安装缺少的 DWS 和 GBrain、验证版本；已有可用依赖保留。下载失败说明网络原因，可续装，不能关闭 TLS 校验或换来路不明的下载源。
2. `profiles` 只显示组织名和用户名。唯一明确当前组织可用作推荐项；多账号让用户选择。没有登录执行 `login`，保持终端调用等待，用户在官方浏览器授权后继续。认证失败按 DWS 真实诊断处理，不复制旧配置或令牌。
3. 将用户选择的真实 profile 保存在本次 spec；后续所有操作一致。

## 2. 项目表格

询问：「年轮的数据放在哪里？」建议选项：在我的 AI 表格中初始化 / 使用已有项目子表 / 新建一份 AI 表格。

- 已有表格：只要求粘贴完整链接，用 `inspect --base-url <url> --profile <profile>` 得到真实表与字段。不要把浏览器环境中的 URL 自动当成用户选择。
- 新表格：询问名称与目标位置；用户接受默认个人位置时，执行 `resource --kind base --name <name> --profile <profile> --yes`。指定文件夹时解析其真实 ID 后传 `--parent`。结果含 `base_url`。创建响应未知时保留 `setup/resource-base.json` 并读回对账，不再次提交。
- 初始化：默认创建「年轮·项目主表、年轮·里程碑表、年轮·场地表、年轮·项目记录表」。场地表可先为空。同名表会读回检查并补缺字段，不重建；其他子表保留。有冲突时让用户选新的前缀或正确字段，不能改名、改类型、删除原字段来强行适配。
- 已有子表：按用户所选名称生成 table_map；字段不同则列出名字和类型，用选项映射语义。field_map 内部保存真实 fieldId。一个逻辑角色只对应一张表；关联必须指向所选项目表。状态必须满足里程碑「待核」、记录「已解决」；不满足时给出初始化独立年轮子表的选项。

由当前宿主将选择写成临时 JSON，不让用户填写：

```json
{"mode":"initialize","profile":"从 profiles 选择","base_url":"用户指定链接","prefix":"年轮·"}
```

绑定已有表可用：`{"mode":"bind","profile":"真实值","base_url":"真实链接","table_map":{"projects":"真实tableId","milestones":"真实tableId","sites":"真实tableId","records":"真实tableId"},"field_map":{"projects":{"title":"真实fieldId"}}}`。

运行 `table-plan --spec <file>`，展示实际新增子表、补齐字段或只读绑定的摘要；用户已选择该动作时直接 `tables-apply --plan <返回目录>/table-plan.json --yes`。计划和写后字段、关系都重新验证。断点续跑重用原 plan/receipt；未知状态先读回，不生成第二套子表。

初始化后的表格是空白的。询问是否录入第一个项目（可跳过）。用户提供名称后，以绑定的真实项目字段 ID，通过 DWS `aitable record create` 创建；先按标题精确查重、写后按真实 recordId 回读。别填示例业务数据，别凭聊天猜用户负责哪些项目。没有项目时提示后续可以对当前宿主说「在年轮创建项目……」，采集到未归属材料保留待核。

## 3. 项目记忆

询问：「创建新的年轮记忆库，还是连接已有 GBrain？」

- 新建（推荐）：`memory --mode new --yes`。使用个人目录下独立 GBRAIN_HOME，执行官方 init，默认 PGLite、无额外模型密钥；不会替换全局记忆库。接着 capture 安装测试页、get 回读、query 检索，三者通过才显示接入成功。
- 已有：让用户选择其 GBrain 工作目录；默认配置在本人 `~/.gbrain`，自定义时同时选择其 GBRAIN_HOME 的父目录。执行 `memory --mode existing --directory <dir> [--brain-home <parent>] --yes`。不重置、不升级其现有数据库。
- 无密钥模式提供持久记忆和关键词检索，理解与总结由所选 AI 宿主完成；不要把它称为已启用语义向量检索。额外 embedding/model 配置留给用户以后主动选择。
- 查询/回读已有记忆时，用 config 中的 `gbrain_command` argv 数组和 `brain_home`。Windows 源码路径不是可直接执行的 gbrain.exe。`growth.py context` 已处理这些差异。

已有项目时，可点击页面「把现有项目存入记忆」，将四表当前事实作为有日期、有来源的基线写入自己的 GBrain 并回读；不把快照称为新增进展。

## 4. 自动生长

用两组简短问题明确选择：

1. 来源：听记、群 @我、单聊、Codex 人类会话、其他宿主主动交付的人类会话、工作台人类请求。可以全选，也可以只选部分。选择 Codex 会话意味着可读取此电脑该账号的本地 Codex 人类消息，不要默认当成仅年轮这一条会话。
2. 操作与时间：写项目进度/里程碑、创建本人待办、有唯一明确完成证据时完成待办并同步记录、存记忆、向本人钉钉推送每轮摘要、生成阶段汇报。推荐每天 10/12/14/16/18/20 点，周四 9 点汇报；用户可选择别的时间。明确展示其当地时区，业务时间由核心使用该时区计算，宿主的每小时唤醒不承担业务时区换算。

汇报目录可以选择已有文件夹，或执行 `resource --kind folder --name 年轮阶段汇报 --profile <profile> --yes` 创建并读回；真实 nodeId 填入 report_folder。用户仅查看表格而不授权某项写入时，保持对应开关关闭。

由当前宿主写 preferences JSON，再 `configure --preferences <file> --yes`：

```json
{
  "sources":{"minutes":true,"mentions":true,"direct":true,"codex":true},
  "switches":{"table_writes":true,"todos":true,"completion":true,"gbrain":true,"digest":true,"reports":true},
  "report_folder":"真实文件夹nodeId",
  "schedule":{"timezone":"用户主机时区","growth_hours":[10,12,14,16,18,20],"report_weekday":"TH","report_hour":9}
}
```

根据用户选择填写布尔值，不照抄示例。首次 `configure` 保存选择并输出 schedule-request.json，原生控制器未验证时显示「待启用」。控制器接入后，页面修改时间或 enabled 开关直接生效；无须每次更改原生任务。

先按 automation.md 用该配置跑一次真实闭环，回读动作、记忆与摘要投递状态；空项目工作台不得编造记录或为了演示创建待办。部分采集缺口可继续使用，但要说明缺口；执行器/认证/写回失败先修复，再启用调度。

读取 schedule-request.json 的 `controller`，检查 `$CODEX_HOME/automations/*/automation.toml` 中安装标识或精确配置路径匹配的年轮任务。备份已有关联任务；用原生 `automation_update` 更新一个既有任务作为控制器，其余旧生长/汇报任务暂停，避免重复。没有则创建 `kind:heartbeat`、`destination:thread`、`status:ACTIVE`，绑定当前接入会话。使用 controller 的 name、prompt、rrule 原文。控制器每小时唤醒一次，业务仅在页面选定的时间运行；无到期工作保持安静。电脑睡眠后最多补跑最近一天内各一轮生长与汇报，不密集重放旧时间点。

原生工具成功后逐个 view，并调用 `verify-schedules --file <真实控制器/automation.toml>`，回读内容、状态、时间、会话与安装标识。运行 `scripts/scheduler.py --config <配置> tick` 验证调度分发：非运行时间返回 idle 是正确结果，不能为演示编造到期时间或修改用户选择。首次接入可以由页面复制自然语言请求回到 Codex 发送，用户不用改代码。之后页面可直接调时间、暂停、恢复。原生工具不可用时保留待接入；绝不手写 automation.toml 或改用系统 cron。

## 5. 完成验证

执行 `doctor`，用安装记录中的 Python 运行 `scripts/launch.py` 打开真实工作台。向用户展示：AI 表格链接、个人记忆库位置、实际启用的时间、首次执行结果及任何采集缺口。区分「环境已装」「接入已验证」「定时任务已启用」。本地运行需要电脑和负责执行的宿主可用。

后续用户说「修改年轮运行时间」时只重新 configure 并核验控制器；旧版固定任务先迁移，不重建表或记忆库。更新程序保留个人配置和回执。卸载先用原生工具停止该安装标识下的任务，再移除该安装的 Skill；AI 表格、GBrain 和用户资料默认保留。
