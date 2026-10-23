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
