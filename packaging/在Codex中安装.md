# 在 Codex 中安装年轮

把这个文件或整个解压目录交给 Codex，并说：「帮我安装年轮，并打开接入向导」。

给执行安装的 Codex：

1. 读取同包 `使用说明.md`。使用本机 Python，或 `load_workspace_dependencies` 返回的 Python 执行同目录 `install.py --host codex --open`。安装器会准备个人运行环境、依赖和两个 Skill；不复制旧用户账号、配置或数据。
2. 安装器会打开真实本机工作台。让用户在页面完成钉钉授权、AI 表格绑定或初始化、独立记忆空间接入、来源和时间选择。也可使用 `nianlun-setup` 带用户完成这些选择，不要求用户编辑代码。
3. 用户返回「完成年轮定时接入」请求后，读取安装记录 core 目录下的 `references/setup-wizard.md`。使用原生 `automation_update` 注册 request 中的 controller，核验并迁移同一安装的旧任务。没有原生工具时如实显示待接入，不造任务文件。
4. 最终检查表格、独立记忆空间和控制器，打开工作台。已有明确选择无需反复确认；个人配置保留。
