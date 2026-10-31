## 图文回顾契约 v1.7

先用 1–2 句说明本期判断；每个面板至少 1 张主图，全文 2–6 张。每张图前后只解释“为什么值得关注”，不重复图中文字。一个面板一张主图。禁止把整份资料或全部历史记录做成密集关系图。

所有图均使用 ```visual 围栏，内容为 JSON；程序负责安全渲染、ECharts 交互与 Three.js 立体查看。禁止输出 HTML、脚本、CSS、ECharts option 或外链。图中每项必须引用输入实际存在的材料编号；下面编号仅为格式示例。

### 进度矩阵（多对象但**没有日期**时用；有日期优先用下面的时间轴甘特）

```visual
{"type":"matrix","title":"四场地推进梯队","caption":"两个场地在试运行，验收与安装各一，进度梯度清晰。","stages":["筹备","安装","试运行","验收"],"items":[{"label":"武汉吴家山","stage":"验收","state":"done","detail":"验收议程待售前参与。","next":"排定验收时间。","source":"[S3][R13]"},{"label":"西安汉唐","stage":"试运行","state":"blocked","detail":"调试受映射表缺失阻塞。","next":"补齐映射表。","source":"[S2][R19]"}]}
```

stages 2–6 个真实阶段名，按推进先后排列；items 1–12 行，**必须按阶段由后往前排序**（已完成/最接近完成的在前，筹备与未启动的在后，同阶段按重要性），程序会兜底按 stages 顺序重排。stage 必须是 stages 之一，state 用 done/active/blocked/planned/unknown。detail ≤60 字、next ≤60 字可省略。用于让读者一屏看清多对象分布梯度与卡点位置，不要用它替代后续分项论证。

### 时间轴甘特（多对象且各自有日期节点时**首选**，用于森林层与节奏面板）

多个对象各自有里程碑、验收日、试运行或安装窗口时，用 gantt：按日期定位、可按状态筛选、点击任意行展开明细。

```visual
{"type":"gantt","title":"四场地验收节奏","caption":"南昌与武汉同日落定验收，成都验证在即，汉唐记录停滞。","today":"2026-10-26","milestones":[{"date":"2026-10-15","label":"靠卡验收指标","source":"[M2]"},{"date":"2026-10-18","label":"二期028W试运行","source":"[M6]"}],"rows":[{"label":"南昌 · 791X","state":"done","stage":"已验收","segments":[],"points":[{"date":"2026-10-26","label":"验收完成","state":"done"}],"source":"[S6][R4]","note":"已完结，转入运维观察。"},{"label":"武汉 · 027W","state":"done","stage":"已验收","segments":[{"from":"2026-10-21","to":"2026-10-26","label":"验收推进","kind":"actual","marks":["2026-10-21","2026-10-26"]}],"points":[{"date":"2026-10-26","label":"验收定型报告","state":"done"}],"source":"[S3][R68]","note":"定型报告已出具，待确认移交责任人。"}]}
```

字段说明：
- `rows[].label` 对象名；`state` 取 done/active/blocked/planned/unknown，决定行首圆点颜色与 KPI 分桶
- `rows[].stage` 当前所处阶段（中文，如 筹备/安装/试运行/已验收），作为行内徽标显示；缺省时按 state 推导
- `rows[].segments[{from,to,label,state,kind,marks}]` 时间区间；`kind` 只能是 `actual`（已发生，实心）或 `plan`（计划窗口，斜纹）；**`marks` 必填**——列出该区间内真正有记录的日期（YYYY-MM-DD 数组），区间内没有任何真实记录就不要画区间，改用 points
- `rows[].points[{date,label,state}]` 单点节点（验收完成、现场验证、调试停滞等）；`state` 为 blocked 时画成菱形
- `rows[].note` 图上推不出的判断、卡点或下一步，点击展开后显示；不写图内已有信息
- `milestones[{date,label,source}]` 项目级里程碑，画在时间轴上方并自动分层避让
- `today` 本期基准日，画为「今天」竖线与胶囊

约束：没有可靠起止日期就不要编造 segments，只画 points；缺数据的对象把缺口写进 note，不要为填满而虚构区间。`start`/`end` 可省略，程序按数据自动取窗口。停留态（如调试停滞）是状态不是工期，不要画成区间。

### 状态对照（无数值时优先）

```visual
{"type":"status","title":"现场推进的两个落点","caption":"已完成的准备与尚未完成的验证分开呈现。","items":[{"label":"场地甲","state":"active","detail":"联调完成，现场验收待确认。","next":"补充验收结论。","source":"[R1]"},{"label":"场地乙","state":"blocked","detail":"调试所需映射表尚缺。","next":"补齐映射表。","source":"[R2]"}]}
```

items 1–4 项。next 可省略（行动已在关系图呈现或资料没有下一步时不重复、不编造）；其他字段必填。state 只接受 done（已完成）、active（推进中）、blocked（受阻）、planned（计划）、unknown（待核实）。状态适用于条目所述具体事项，不能泛化为整个项目。

### 推进关系（有明确关系才画）

```visual
{"type":"graph","title":"先补齐输入，再继续验证","caption":"连线表示本次明确的推进动作，不代表动作已经完成。","nodes":[{"id":"input","label":"映射表缺失","state":"blocked","layer":0,"detail":"现场调试缺少输入。","source":"[R2]"},{"id":"action","label":"补齐映射表","state":"planned","layer":1,"detail":"下一步需提供完整映射表。","source":"[R2]"}],"links":[{"from":"input","to":"action","label":"下一步","source":"[R2]"}]}
```

nodes 2–9 个，links 1–9 条。layer 为 0/1/2，每列最多 3 个节点；横向列表示阅读顺序，只有 links 明确指定的关系才连线。标签≤26字、说明≤100字。图注必须解释连线含义。优先 2 列、2–3 条不交叉的短路径，避免大而空的星图；不同对象的下一步并列展示。二维图默认可读，读者可切换 ECharts 关系探索或 Three.js 立体查看；三维不会添加任何新关系。

### 定量比较 / 趋势（必须有真实数值）

```visual
{"type":"bar","title":"两期已验收数量","caption":"同口径、同周期的实际验收结果。","unit":"个","categories":["上期","本期"],"series":[{"name":"已验收","data":[2,4]}],"source":"[R3][R4]"}
```

type 为 bar 或 line；categories 2–12 项；series 1–3 组。每组 data 与 categories 等长，全部为有限数字，unit 写真实单位。不得将“推进中”换算成百分比，不得把计划值当实际。示例数字不属于任何真实项目，不得带入成稿。

### 视觉交付

- 奶油白与森林绿，风险用克制的红色；图片/图表必须帮助理解事实，不增加装饰性信息。
- 首屏给出判断与第一张图，不堆目录和参数。图表至少占正文一个完整面板。
- 静态图、原始数值表和依据随 HTML 保存；即使脚本或 WebGL 不可用，结论与事实仍可读。打印隐藏交互按钮，显示静态版本。
- ECharts 使用 SVG；Three.js 只在点击时创建、按需绘制、关闭释放。离线无需 CDN。
- 生成后检查宽屏和 390px 窄屏、图中文字、引用、交互/返回静态、明暗切换与打印降级。
