# 年轮 2.7 可视化参考核验

核验日期：2026-10-23。范围：公开官方仓库、官方插件页、源码和 API 文档；未读取用户项目、会话或记忆内容。使用 agent-reach 的 GitHub CLI 后端获取公开资料。

## 结论

本次优先借鉴 Galaxy View 的邻域聚焦、图例筛选、搜索定位、来源卡片和质量分级。重点是让用户从图中找到并理解一条记忆，而不是增加更多装饰性星星。年轮已有 Three.js 渲染基础，2.7 可以先在现有内核落实这些交互；是否更换图引擎，需要用年轮实际规模测量后决定。

以下将“官方证据”与“年轮设计建议”分开。仓库示例规模、作者性能描述、配置上限均不等同于年轮的实测能力，也不据此宣称某个库最好。

## 参考项目与真实接口

| 项目与核验版本 | 官方接口 / 实现证据 | 规模证据及限制 | 许可证与本次用途 |
| --- | --- | --- | --- |
| [3d-force-graph](https://github.com/vasturiano/3d-force-graph)，package.json 1.80.1 | `graphData`、`nodeVisibility`、`linkVisibility`、`onNodeClick`、`onNodeHover`、`cameraPosition`、`zoomToFit(ms, padding, nodeFilterFn)`；支持 `nodeThreeObject` 扩展 Three.js 节点 | README 有约 4k elements 的大图示例，不能写成保证支持 4k 节点或所有设备固定帧率。`cooldownTicks` / `cooldownTime` 控制布局收敛 | MIT。适合参考成熟的悬停邻居高亮与镜头定位；若引入需固定版本并保留许可 |
| [cosmos.gl](https://github.com/cosmosgl/graph)，package.json / 最新 Release 3.5.1 | `setPointPositions` / `setLinks` 使用 TypedArray；`highlightedPointIndices`、`highlightedLinkIndices`；`getNeighboringPointIndices`、`findPointsInRect` / `findPointsInPolygon`、`setZoomTransformByPointPositions`；`setConfigPartial` 增量改配置 | 作者称现代硬件可模拟数十万点和连线；本轮未复测。当前引擎为 luma.gl / WebGL2，存在硬件要求，不能把宣传数字当年轮验收指标 | MIT 指的是 `cosmosgl/graph` 引擎，不代表 Cosmograph 整个产品。适合未来大规模二维图评估；不是 Three.js 的即插即用三维替换件 |
| [Galaxy View](https://github.com/Longwind1984/galaxy-view)，manifest 0.6.1 | `neighborhood(adj, seed, 1\|2)` / `shortestPath`；`GraphController.selectNode` 按层级压暗非邻居、突出关联线，`CameraDirector.flyTo` 定位；Worker 计算布局，独立详情卡 | 作者 README 描述 3,000+ 笔记 / 20,000+ 关系达到 60fps，此为作者报告。源码移动档上限 1,500 节点 / 12,000 连线，关闭 bloom 和集群云；这只是具体档位设置 | MIT。正是用户提供的 [Obsidian 插件页](https://community.obsidian.md/plugins/galaxy-view) 对应仓库。重点参考交互与分层，不要求把插件直接嵌入年轮 |
| [SiYuan](https://github.com/siyuan-note/siyuan) 当前 master | `Graph.ts` 区分 global / local / pin，调用 `/api/graph/getGraph` 和 `/api/graph/getLocalGraph`；有类型筛选、搜索、节点数、局部视图 | `kernel/conf/graph.go` 默认 `MaxBlocks=1024*16`。这是显示配置上限，不是帧率或性能保证 | AGPL-3.0。只参考全局 / 局部的产品交互，不复制源码到年轮的 Apache-2.0 代码中 |

版本快照与可复查的源码：

- 3d-force-graph commit [`5ccd00f`](https://github.com/vasturiano/3d-force-graph/tree/5ccd00f47d72a571319da70ccac080bb8e09709f)：[API README](https://github.com/vasturiano/3d-force-graph/blob/5ccd00f47d72a571319da70ccac080bb8e09709f/README.md)、[邻居高亮示例](https://github.com/vasturiano/3d-force-graph/blob/5ccd00f47d72a571319da70ccac080bb8e09709f/example/highlight/index.html)。
- cosmos.gl commit [`de2e067`](https://github.com/cosmosgl/graph/tree/de2e0675fbfaacbdad8ca10169ad50ad41a6b989)：[配置源码](https://github.com/cosmosgl/graph/blob/de2e0675fbfaacbdad8ca10169ad50ad41a6b989/src/config.ts)、[API 文档](https://github.com/cosmosgl/graph/blob/de2e0675fbfaacbdad8ca10169ad50ad41a6b989/src/stories/api-reference.mdx)、[package.json](https://github.com/cosmosgl/graph/blob/de2e0675fbfaacbdad8ca10169ad50ad41a6b989/package.json)。旧地址 `cosmograph-org/cosmos` 已重定向至 `cosmosgl/graph`，检索旧版教程时应核对 API 代际。
- Galaxy View commit [`b49b60c`](https://github.com/Longwind1984/galaxy-view/tree/b49b60cb04687783153f24ff7f9b0a0af59334af)：[邻接与最短路径](https://github.com/Longwind1984/galaxy-view/blob/b49b60cb04687783153f24ff7f9b0a0af59334af/src/data/Adjacency.ts)、[选择控制器](https://github.com/Longwind1984/galaxy-view/blob/b49b60cb04687783153f24ff7f9b0a0af59334af/src/view/GraphController.ts)、[质量档位](https://github.com/Longwind1984/galaxy-view/blob/b49b60cb04687783153f24ff7f9b0a0af59334af/src/quality/tiers.ts)、[Worker 生命周期](https://github.com/Longwind1984/galaxy-view/blob/b49b60cb04687783153f24ff7f9b0a0af59334af/src/layout/WorkerForceLayout.ts)。
- SiYuan commit [`bfe3610`](https://github.com/siyuan-note/siyuan/tree/bfe36100477b7bbd66db1a8b8cff5547b2ccdb59)：[全局 / 局部图交互](https://github.com/siyuan-note/siyuan/blob/bfe36100477b7bbd66db1a8b8cff5547b2ccdb59/app/src/layout/dock/Graph.ts)、[图配置及默认上限](https://github.com/siyuan-note/siyuan/blob/bfe36100477b7bbd66db1a8b8cff5547b2ccdb59/kernel/conf/graph.go)。

## 五个可直接落实的交互模式

### 1. 从全局概览进入一条记忆的邻域

官方证据：Galaxy View 的选择控制器按一跳 / 两跳邻域分别设置透明度及连线高亮；SiYuan 明确区分全局图与局部图。

年轮建议：首次进入项目记忆先展示已有项目及真实关联的记忆。点击一条记忆后保留布局，压暗无关内容；默认看直接关联，用户可切换两跳。右侧展示标题、摘要、所属项目、来源、更新时间和“打开原文”。返回全景恢复上次视角。手机上把详情改为底部面板，关闭面板不丢失图的选择状态。

验收：从图、搜索结果和目录选择同一记忆时，聚焦及详情一致；孤立节点显示“暂无已确认关联”，不能补造边。

### 2. 图例也是筛选器

官方证据：Galaxy View 将文件夹色块、数量、隐藏 / 仅看该文件夹组合在同一区域；其 Tag Lens 默认关闭，并限制新增标签枢纽数量。

年轮建议：改为项目色块与记忆数量；一个点击切换项目可见性，另设明确的“仅看”操作。来源、类型、更新时间保留普通表单控件，默认折叠高级参数。显示“当前可见 / 已加载 / 总数”及截断原因，避免把局部加载误认为没有记忆。颜色由稳定项目标识决定，新增项目不会让全部节点重新变色。

验收：筛选同步图、列表、计数和详情；清除筛选恢复原集合，颜色不随排序变化。

### 3. 搜索负责定位，详情负责阅读

官方证据：3d-force-graph 提供 `cameraPosition` 和带节点过滤条件的 `zoomToFit`；Galaxy View 的搜索选择会调用节点聚焦和镜头定位。

年轮建议：输入项目名或关键词时先给可键盘选择的结果列表；选中后镜头转向该节点、展示邻域和详情。保留“适应当前结果”“返回全景”。缩放时只给重点节点标签，悬停 / 选中节点再显示完整标题，避免每条记忆都在画布上挤字。

验收：减少动态效果设置下镜头直接定位；键盘可完成搜索、打开详情、返回列表；WebGL 不可用仍能读目录和原文。

### 4. 连接两条记忆前，先解释线的含义

官方证据：Galaxy View `shortestPath` 在已有邻接表上做无权 BFS，无法连通返回空路径；3d-force-graph 官方示例用邻居集合和真实边做高亮。

年轮建议：节点卡提供“查看关联”。连线区分“属于项目”“文档引用”“任务关联”等实际依据。后续可以加“连接两条记忆”，但路径只计算已有证据关系。项目内里程碑、记录、场地顺序可切换，连线仍基于标识关联，不能按屏幕相邻位置推断关系。没有证据就不画线。

验收：每条边能说明来源；“同项目”不冒充“直接引用”；不连通时明确说明；距离、颜色和点大小不冒充完成度或重要性评分。

### 5. 先保证探索流畅，再增加动态效果

官方证据：Galaxy View 用 Worker + transferable 缓冲传递坐标，质量档位限制标签与特效，销毁时终止 Worker、撤销 Blob URL；cosmos.gl 将模拟与渲染分开，并支持配置式高亮。

年轮建议：维持一个主场景，按项目 / 结果集逐步加载；布局计算离开主线程，收敛后停止模拟，静止时按需渲染。离开页面、滚出视口、标签页隐藏时暂停，导航时释放资源。移动端降低 DPR、节点和标签预算，保留清晰的列表入口。默认不持续自动巡游，提供显式开关。

验收：连续切换页面不累积 canvas、Worker、监听器或 RAF；暂停动效后仍能点击、搜索和读取详情；旧异步结果不能回填到新页面。

## 各主页面的应用边界（年轮设计建议）

| 页面 | Three.js 可承担的有效任务 | 保留的常规操作 |
| --- | --- | --- |
| 项目工作台 | 项目概览与选中联动；项目内展示真实关系，范围紧凑 | 卡片 / 列表、筛选、快捷处理、编辑 |
| 我的待办 | 按项目和真实状态分组的空间概览，点击分组筛选任务 | 多选、详情、批量完成；不能用图替代任务表 |
| 项目记忆 | 全景 → 项目 → 邻域 → 原文，作为本轮重点 | 可检索目录、来源详情、可访问的列表降级 |
| 能力中心 | 按真实分类形成可选择的能力群组，联动已选状态 | 根目录选择、搜索、启用开关、批量管理 |
| 工作流 | 可点选的步骤和输入 / 能力 / 输出关系；真实进度驱动状态 | 可编辑表单、具体阶段说明、失败重试、产物入口 |
| 执行记录 | 时间与状态的概览，点选后筛选真实运行记录 | 状态筛选、任务详情、错误与重试；不可伪造运行中的粒子 |
| 接入与运行 | 展示已核验的宿主、来源和存储连接状态 | 安装、绑定、授权、调度开关及真实校验结果 |

界面保持奶油白背景、森林绿重点、克制的顺丰红提示；深色仅用于需要对比的图区域。不同页面的可视化应表达不同数据，避免七页复用同一片无业务含义的星空。

## 集成注意事项

- 3d-force-graph 的 `pauseAnimation()` 同时暂停渲染和交互。年轮“暂停动效”仍需可探索，不能直接把这个 API 当成仅停止自动旋转。
- cosmos.gl 3.x 的 `setConfig()` 会先重置默认值，单项更新应使用 `setConfigPartial()`；不能照搬旧版选择 API。其引擎与 Three.js 场景不是同一个渲染体系。
- cosmos.gl 当前 package 声明 Node >=22、luma.gl 约束 `~9.3.0`。若未来引入，应固定依赖和构建产物，不让最终用户安装一套前端开发环境。
- 新依赖先核验许可、保留通知并固定版本。本轮只是公开参考研究，没有引入第三方代码或新的数据传输。
- 接入任何引擎之前都先提供相同的本地数据契约：稳定节点 ID、显式关系、项目 ID、标题、类型、来源引用、时间；渲染器只呈现已知事实。
