---
name: nianlun-setup
description: 年轮跨宿主安装与接入向导：初始化钉钉 AI 表格、安装或连接独立记忆空间，选择 AI 宿主和定时负责人；用户不用改代码。
---

# 年轮安装向导

读取 ~/.local/share/nianlun/install.json 的 core、python_bin 与 config。先读 core/references/host-contract.md，再读 core/references/setup-wizard.md；尚未安装时按完整包中的在AI宿主中安装.md安装核心。

默认打开本机工作台，依次选择钉钉账号、AI 表格、独立记忆空间、AI 宿主、来源与自动动作、时区及定时负责人。每步最多问 1–3 项，用户只做选择，不填写代码、ID 或 JSON。授权清楚时执行并回读，不重复确认。官方登录由用户本人完成，不索取令牌。

Codex、Claude Code 可以注册年轮的薄入口；WorkBuddy、DeepSeek Harness 通过导出的 Skill / CLI 接入材料使用同一核心。不改宿主源码、全局配置、权限或账号。新的记忆空间使用独立目录，已有库不重置。初始化表格先检查兼容性，保留已有内容。

只有定时负责人为 Codex 时，使用 automation_update 原生工具注册或迁移同一安装的控制器，并通过 setup.py verify-schedules 回读；不得手写 automation.toml。其他宿主按其真实能力配置周期任务和核验，不能凭生成接入说明宣称已启用。每个安装只有一个定时负责人，切换前先核验旧任务停止。

所有宿主均遵守同一生长契约、身份范围、去重和写后回读。交接返回 waiting_harness 时必须继续宿主分析与 answer 往返，不能当作成功。权限请求在实际宿主界面处理，不代用户批准。
