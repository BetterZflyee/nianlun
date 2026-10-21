# 程序目录与职责

年轮的代码按运行核心、界面、安装接入和工程维护分类。保留现有目录，以兼容安装器、测试和已安装的宿主入口。

| 分类 | 位置 | 职责 |
| --- | --- | --- |
| 运行入口 | `nianlun/scripts/nianlun.py`、`launch.py`、`server.py` | 命令入口、本机服务与启动 |
| 项目工作台 | `nianlun/assets/portal/`、`nianlun/scripts/workbench.py` | 项目、里程碑、场地、记录与工作台界面 |
| 接入向导 | `nianlun/assets/home.*`、`style.css`、`nianlun/scripts/setup.py`、`dependencies.py` | 钉钉、四张子表、个人运行环境与依赖接入 |
| 自动生长 | `nianlun/scripts/scheduler.py`、`growth.py`、`intake.py`、`source_state.py` | 到期判定、采集范围、渠道、补采、去重与执行状态 |
| 目标倒排 | `nianlun/scripts/planning.py` | 从目标日期规划里程碑、检查依赖并保护人工修改 |
| 项目群推进 | `nianlun/scripts/project_actions.py` | 搜索并选择项目群、发送已核验汇报、核对投递回执 |
| AI 宿主接续 | `nianlun/scripts/host.py`、`host_bridge.py`、`harness.py`、`codex_session.py` | 宿主选择、分析请求、结果接续和会话读取 |
| 独立记忆空间 | `nianlun/scripts/memory.py` | 长期记忆写入与检索适配 |
| 汇报与工作流 | `nianlun/scripts/render_report.py`、`flow.py` | 阶段汇报与可执行工作流 |
| 执行互斥 | `nianlun/scripts/file_lock.py` | 本机并发保护 |
| 宿主使用入口与契约 | `nianlun/SKILL.md`、`agents/`、`references/` | Skill 入口、配置示例和数据/调度/宿主契约 |
| 安装与打包 | `packaging/` | Mac / Windows 启动器、安装器、宿主入口和发布包构建 |
| 测试 | `nianlun/scripts/test_*.py`、`tools/test_release.py` | 隔离业务测试与发布检查 |
| 发布维护 | `tools/release_guard.py`、`.github/`、`docs/` | 公开文件检查、CI、Issues 模板和发版流程 |

## 本地项目材料

以下目录用于维护者本地工作，已从 Git 排除，不进入安装包：

- `产品资料/`：产品定义、发布文稿、大纲、发布准备和内部历史交付。
- `宣传素材/`：宣传成片、封面、工程包及可编辑视频工程。
- `deliverables/`：当前安装包、启动入口和历史版本。
- `work/`：采集调试、界面验收和重建过程材料。
- `local/`：个人运行配置、迁移备份、安装验收和原始会话档案。

项目事实仍由用户自己的 AI 表格保存，长期记忆仍在用户自己的独立记忆空间。项目材料归档不改变运行时数据位置。
