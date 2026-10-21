# 2.3 界面参考与取舍

检索日期：2026-10-22。GitHub Trending 是随时变化的观察入口，不把累计星标数当作本周排名。

- [GitHub 本周 Trending](https://github.com/trending?since=weekly)：本次页面包含 OpenCode、ai-memory、HyperFrames 等项目。参考的是任务工作台、知识积累与过程反馈的产品方向，并未复制其代码。
- [OpenCode](https://github.com/anomalyco/opencode)：工作区、执行过程、任务结果分开呈现；年轮保留自己的 DeepSeek 接续契约。
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph)：参考聚焦节点、拖动缩放与展开细节的交互。没有引入该项目的运行依赖。
- [Three.js](https://github.com/mrdoob/three.js)：知识星图实际采用 npm 0.186.1（下载时核验 registry SHA-512）。本地静态文件随安装包分发，MIT 许可。
- [Magic UI](https://github.com/magicuidesign/magicui)、[Motion Primitives](https://github.com/ibelick/motion-primitives)：参考卡片层次、短距离进入动画和交互反馈。没有为动效引入 React 或远程资源。
- [React Bits](https://github.com/DavidHDev/react-bits)：仅作动效方向参考，未复制其代码。

## 落地原则

1. 日常工作保持米白背景与森林绿，红色仅用于风险和异常。
2. 项目页关联概览固定为紧凑条，不默认展开树图。按需打开关联矩阵，每行一个记录及其真实里程碑、场地。
3. 待办保留完整操作上下文：筛选、批选、正文、负责人、截止时间、活动、原始入口。
4. 记忆先读取目录，正文按需读取。分类线表示标题归组，页面引用线仅来自实际正文；不把装饰星点当成业务节点。
5. 星图按交互重绘，静止时没有持续动画循环；离开页面销毁 WebGL 资源。WebGL 失败时使用可点击二维图和目录。
6. 能力按用途分类，详情、来源、启用与组合入口直接可见。工作流按背景→方法→宿主→产物组织。
7. 动效只解释切换、悬停和焦点，尊重系统减少动态效果设置。旧版与新版各有固定 Git 标签和安装包。
