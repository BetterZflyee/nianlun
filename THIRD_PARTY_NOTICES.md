# 第三方组件

年轮发行包包含年轮源码、页面、安装器和说明文件；以下工具在用户安装时下载或调用，不作为年轮自有代码重新授权。版本与下载校验值见 `nianlun/references/dependencies.lock.json`。工具及其传递依赖适用各自的许可证，使用及再分发时保留上游声明。

| 组件 | 用途 | 上游 |
| --- | --- | --- |
| DWS CLI | 钉钉登录、AI 表格、待办、消息和听记 | https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli |
| GBrain | 本地长期记忆 | https://github.com/garrytan/gbrain |
| Bun | 部分平台运行 GBrain | https://github.com/oven-sh/bun |
| uv | 准备个人 Python 环境 | https://github.com/astral-sh/uv |
| Python | 核心执行环境 | https://www.python.org/ |
| tzdata | 跨平台时区数据 | https://github.com/python/tzdata |
| lark-cli（可选） | 飞书妙记采集 | https://github.com/larksuite/cli |

Codex、Claude Code、WorkBuddy、DeepSeek Harness 由用户自行提供并登录；本仓库不分发这些宿主。产品名称用于说明兼容目标，不表示其官方认可。

## Three.js 0.186.1

The local knowledge constellation uses Three.js (MIT), © 2010–2026 Three.js authors.
Upstream: https://github.com/mrdoob/three.js. Source package: npm `three@0.186.1`.
The two browser ESM build files were minified with esbuild 0.28.2; the core import was
renamed to the local `.min.js` filename. No CDN, telemetry, or remote font is used.
Full license: `nianlun/assets/portal/vendor/three-LICENSE.txt`.

## 交互设计参考：Galaxy View

2.5 的三维记忆探索参考了 [Galaxy View](https://github.com/Longwind1984/galaxy-view) 的发光节点、飞近和邻域聚焦交互（上游 MIT）。本版本没有复制或分发插件源码，没有引入 Obsidian；年轮使用自己的 Three.js 渲染器和只读记忆适配。

## Apache ECharts 6.1.0

Project relationship diagrams use Apache ECharts (Apache-2.0), © The Apache Software
Foundation. Upstream: https://github.com/apache/echarts. The local ESM bundle includes
only the selected chart/components and SVG renderer, built from npm `echarts@6.1.0`
with esbuild 0.28.2. Dependencies included: `zrender@6.1.0` (BSD-3-Clause) and
`tslib@2.3.0` (0BSD). Original notices and full licenses are retained in:

- `nianlun/assets/portal/vendor/echarts-LICENSE.txt`
- `nianlun/assets/portal/vendor/echarts-NOTICE.txt`
- `nianlun/assets/portal/vendor/zrender-LICENSE.txt`
- `nianlun/assets/portal/vendor/tslib-LICENSE.txt`

The reproducible entry and build steps are in `tools/echarts-entry.js` and
`docs/CHART_COMPONENTS.md`. No remote CDN or graph data upload is used.
