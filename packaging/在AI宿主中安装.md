# 在你使用的 AI 应用中安装年轮

把完整安装包交给 Codex、Claude Code、WorkBuddy 或 DeepSeek Harness，说：

> 请安装年轮并打开接入向导。沿用我的 AI 表格和独立记忆空间，在当前应用接入，不修改应用全局设置或权限。

给宿主的执行说明：

1. 读 `使用说明.md`。运行同目录 install.py --open，准备年轮独立核心、个人运行环境、钉钉连接工具与记忆引擎。没有 Python 时用 Mac / Windows 安装启动器；不要要求用户编辑配置。
2. 当前宿主为 Codex 时可加 --host codex，为 Claude Code 时可加 --host claude，仅注册年轮入口。WorkBuddy / DeepSeek 不猜安装目录：在页面“选择 AI 宿主”准备接入说明，并用该应用真实的 Skill 导入方式接入。
3. 读取 ~/.local/share/nianlun/install.json 的 core 和 python_bin；所有宿主调用同一核心和工作空间。阅读 core/references/host-contract.md 和 setup-wizard.md。
4. 向导完成表格、独立记忆空间、AI 宿主、来源与时间。需要用户完成的官方登录交给本人，不复制令牌。已有授权和绑定保留。
5. 根据宿主真实能力选择 CLI 或宿主接续。定时负责人另行选择、注册与核验；生成接入文件不表示完成登录或开启定时任务。

无法运行本机程序的应用不能独立承接当前本地版；请明确说明能力缺口，不伪造安装结果。
