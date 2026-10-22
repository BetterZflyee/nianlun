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
