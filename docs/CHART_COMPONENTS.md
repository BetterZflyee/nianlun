# 图表组件与本地构建

## 使用原则

常见图表优先使用成熟组件提供的布局、事件、工具栏和渲染能力。年轮负责业务数据映射、权限、筛选与详情，避免重复实现图表引擎。三维空间交互使用 Three.js；项目关系桑基图使用 Apache ECharts。二者均按需从本地文件加载，不依赖 CDN，不改变用户的数据来源。

## 项目关系：ECharts 6.1.0

入口为 `tools/echarts-entry.js`，只注册 Sankey、Tooltip、Toolbox、Aria 和 SVGRenderer。`relations-model.js` 生成数据和图表选项，`relations.js` 管理搜索、选择和生命周期。关闭视图会断开尺寸观察器并释放图表。

本地偏好 `relation_order` 保存三种角色的排列。布局通过节点 `depth` 指定列，连接方向按当前阅读顺序重排；不增加直接的里程碑—场地关系。没有目标的关联会提示缺失，不补虚构节点。节点位置拖动只在当前视图有效。

原生工具栏提供重置与 SVG 导出。悬停使用组件提示与邻接高亮；点击后年轮按记录路径高亮并展示详情，避免经过共享节点无限扩散。图表之外保留可键盘访问的节点列表。

## 重建浏览器 bundle

以下命令在仓库根目录执行。`work/` 为忽略目录，不提交依赖树。发布包已经包含构建结果，最终用户无需安装 Node.js。

```sh
npm install --prefix work/echarts-build --ignore-scripts --no-audit --no-fund --save-exact echarts@6.1.0 zrender@6.1.0 tslib@2.3.0 esbuild@0.28.2
cp tools/echarts-entry.js work/echarts-build/entry.js
node work/echarts-build/node_modules/esbuild/bin/esbuild work/echarts-build/entry.js --bundle --format=esm --minify --legal-comments=inline --outfile=nianlun/assets/portal/vendor/echarts-sankey.min.js
node --test tools/test_relations.js
```

同时保留 npm 包内原版许可证：`echarts/LICENSE`、`echarts/NOTICE`、`zrender/LICENSE` 和 `tslib/LICENSE.txt`，对应发行目录中的 `echarts-LICENSE.txt`、`echarts-NOTICE.txt`、`zrender-LICENSE.txt`、`tslib-LICENSE.txt`。升级依赖时应重新核对这些文件与 `THIRD_PARTY_NOTICES.md`。

官方接口与按需导入：[ECharts 文档](https://echarts.apache.org/handbook/en/basics/import/)。组件版本取自 [ECharts 6.1.0](https://github.com/apache/echarts/releases/tag/6.1.0)。

## 紧凑报告的 Three.js 路径视图（2.5.3）

入口为 `nianlun/assets/report/path3d.js`，复用已锁定的 Three.js 0.186.1。构建命令（esbuild 0.25.12）：

```sh
esbuild nianlun/assets/report/path3d.js --bundle --minify --format=iife --target=es2020 --legal-comments=inline --outfile=nianlun/assets/report/path3d.bundle.js
```

报告渲染时内联 CSS、bundle 与 MIT 许可，在既有 CSP 中加入准确 SHA-256。只读取 am 已渲染的 SVG 节点、边与坐标，不推断项目关系。默认二维；读者选择后才创建 WebGL。只有交互和尺寸改变请求一帧，关闭即释放资源。不支持的复杂坐标变换保持原 SVG。

## 项目空间概览（2.6）

`experience.js` 负责工作台布局、真实项目集合、筛选和页面生命周期；`growth-scene-model.js` 将项目标识与明确关联转换为稳定节点；`growth-scene.js` 使用已有的本地 `vendor/three.module.min.js` 绘制概览。无需引入新依赖或让最终用户运行前端构建。

模块入口为同步的 `mount(host, options)`，支持 `projects`、`records`、`milestones`、`sites`、`onSelect(projectId)`、`onReady({mode,total,shown,overflow})`、`onError(error)`、`reducedMotion` 与 `showCaption`。返回 `destroy()`、`setPaused(boolean)`、`focus(id)`、`clearFocus()`、`reset()`。宿主提供容器尺寸；选择回调只打开项目，不进行业务写入。

项目节点使用确定布局，最多显示 40 个，数量溢出通过回调提示；轮廓与星尘仅用于视觉表达，不生成项目关系。状态颜色使用项目已有值，关联数量只统计明确项目关联。完整项目入口由外层卡片和列表保留。

持续动画最高 30 FPS，设备像素比最高 1.75。隐藏标签页或离开视口时暂停；减少动态效果设置下没有持续动画，交互与尺寸改变仍可请求绘制。退出视图释放几何体、材质和渲染器，移除事件、观察器与动画回调。WebGL 不可用或上下文丢失时提供真实项目按钮，不能阻断外层工作台。

模型验证可在仓库根目录运行：

```sh
node --test tools/test_growth_scene.js
```

模型测试用于校验项目身份、关联统计和布局边界，不替代浏览器交互或业务写回验收。实现参考 [Three.js 按需渲染](https://threejs.org/manual/pages/rendering-on-demand.html) 和 [资源释放](https://threejs.org/manual/pages/how-to-dispose-of-objects.html)，实际验证见 [2.6 验收记录](VALIDATION_2.6.md)。

## 任务图景组件（2.7，2.7.1 调整页面范围）

共享场景使用已打包的 Three.js，普通 DOM 保留文字、工具栏与键盘入口。2.7.1 仅在项目关系、待办分布和接入配置等保留页面挂载任务图景；能力中心、工作流和执行记录已移除图景入口，不恢复旧流程图。这三个页面继续使用 DOM 列表、表单与详情。项目工作台概览、记忆星图与报告路径各自的三维组件保留，项目完整关系探索仍使用 ECharts。

| 模块 | 职责 |
| --- | --- |
| `insight-data.js` | 将已载入数据映射成真实节点与显式边；当前页面使用待办、项目关联和接入配置映射，不另行读取数据或推断依赖 |
| `insight-model.js` | 节点去重、状态显示、布局、边过滤与数量预算，纯函数可测试 |
| `insight-scene.js` / `insight-scene.css` | Three.js 绘制、标签、HTML 条目按钮、选择、视角与降级，按需绘制 |
| `page-insights.js` / `page-insights.css` | 页面面板、收起与展开、异步挂载保护、页面切换清理，以及选取后的业务入口 |

同步接口：`mount(host, {kind, nodes, edges, onSelect, reducedMotion, onReady, onError})`，返回 `update({nodes, edges, selectedId?})`、`focus(id)`、`reset()`、`setPaused(boolean)`、`destroy()`。`kind` 为 `cluster`、`pipeline`、`timeline` 或 `connections`；节点包含稳定 `id`、`label`、`group`、`status`，可选 `value` 与 `detail`，边只接受显式 `source` / `target`。

`onReady` 在挂载及数据更新时返回模式、节点总数、显示数、溢出数、实际边数与边溢出数。`focus` 仅高亮，不转移 DOM 焦点；`reset` 只复位视角，保留选中项；`update` 可明确传入 `selectedId: null` 清除选择。暂停视角交互仍可点击节点与 HTML 条目。调用方给容器约 240–300 像素高度并在导航前销毁。

最多 80 个节点、320 条显式边，像素比上限 1.5。管线与时间轴保持调用方顺序，不因相邻而生成边；聚合依据传入分组。没有默认持续动画，交互、尺寸或数据变化才请求绘制；不可见时不消耗绘图帧，WebGL 中断后释放资源并使用条目目录。减少动态效果设置不会启动镜头过渡。

数据映射和模型验证：

```sh
node --test tools/test_insight_scene.js
node --test tools/test_insight_data.js
```

两组测试覆盖真实标识、去重、显式关联、数量上限、确定布局、中文状态、项目聚合和配置含义，不替代浏览器操作或业务写回验收。CI 同时检查新增场景与面板 JavaScript 语法；实际执行结果见 [2.7 验收记录](VALIDATION_2.7.md)。

2.7.1 只调整页面挂载范围，没有新增渲染库、CDN 或外部数据服务。2.7 的历史实现与验收记录保留，当前修订的实际检查见 [2.7.1 验收记录](VALIDATION_2.7.1.md)。

## 图文回顾（2.9.0）

`report_blocks.py` 校验并编译 `visual` 围栏；`visual-blocks.js` 只接受已声明的 status/graph/bar/line 数据，不接受任意 ECharts option。`tools/report-charts-entry.js` 从已有锁定版本 ECharts 6.1.0、ZRender 6.1.0、tslib 2.3.0 构建自包含 IIFE（esbuild 0.25.12），格式 `--bundle --minify --format=iife --global-name=RecapCharts --target=es2020 --legal-comments=inline`，输出到 `nianlun/assets/report/charts.bundle.js`。相应许可证沿用 `assets/portal/vendor/`。

默认静态图随 HTML 保存。交互按钮触发 ECharts SVG 渲染；只有明确推进关系才提供既有 Three.js 立体查看。原始数据表与节点依据不会因交互隐藏而丢失。实现参考 [ECharts Canvas 与 SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/) 与 [Three.js 按需渲染](https://threejs.org/manual/pages/rendering-on-demand.html)。
