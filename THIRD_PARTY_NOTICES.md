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
