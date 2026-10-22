// A relationship Sankey: one band is one explicit record association.
// It does not imply a conserved budget, progress, or a direct milestone/site link.
export const DEFAULT_ORDER = ["milestones", "records", "sites"];
const roles = DEFAULT_ORDER;
export const RELATION_ORDERS = roles.flatMap((a) =>
  roles
    .filter((b) => b !== a)
    .map((b) => [a, b, roles.find((c) => c !== a && c !== b)]),
);
export const normalizeOrder = (value) =>
  Array.isArray(value) &&
  value.length === 3 &&
  new Set(value).size === 3 &&
  value.every((v) => roles.includes(v))
    ? [...value]
    : [...DEFAULT_ORDER];
const fields = { milestones: "milestone_ids", sites: "site_ids" };
const key = (role, id) => JSON.stringify([role, String(id)]);
const compare = (a, b) =>
  String(a.row.title || "").localeCompare(String(b.row.title || ""), "zh-CN") ||
  a.id.localeCompare(b.id);

export function buildRelations(
  rows,
  query = "",
  requestedOrder = DEFAULT_ORDER,
) {
  const order = normalizeOrder(requestedOrder),
    rank = new Map(order.map((role, i) => [role, i]));
  const maps = Object.fromEntries(
    roles.map((role) => [
      role,
      new Map(
        (rows[role] || []).map((row) => [
          String(row.id),
          { id: key(role, row.id), role, row },
        ]),
      ),
    ]),
  );
  const records = [...maps.records.values()];
  const links = [],
    missing = [];
  for (const record of records) {
    for (const role of ["milestones", "sites"]) {
      for (const id of new Set(record.row[fields[role]] || [])) {
        const other = maps[role].get(String(id));
        if (!other) {
          missing.push({ record: record.id, role, id });
          continue;
        }
        links.push({
          source: rank.get(role) < rank.get("records") ? other.id : record.id,
          target: rank.get(role) < rank.get("records") ? record.id : other.id,
          record: record.id,
          value: 1,
          role,
        });
      }
    }
  }
  const all = roles.flatMap((role) => [...maps[role].values()]);
  const q = query.trim().toLocaleLowerCase();
  const matched = new Set(
    all
      .filter(
        (n) =>
          !q ||
          String(n.row.title || "")
            .toLocaleLowerCase()
            .includes(q),
      )
      .map((n) => n.id),
  );
  const visibleRecords = new Set(
    records.filter((n) => matched.has(n.id)).map((n) => n.id),
  );
  if (q)
    for (const link of links)
      if (matched.has(link.source) || matched.has(link.target))
        visibleRecords.add(link.record);
  const visibleLinks = links.filter((e) => visibleRecords.has(e.record));
  const connected = new Set(visibleLinks.flatMap((e) => [e.source, e.target]));
  const allConnected = new Set(links.flatMap((e) => [e.source, e.target]));
  const nodes = all
    .filter((n) => connected.has(n.id))
    .map((n) => ({ ...n, incoming: [], outgoing: [] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const link of visibleLinks) {
    byId.get(link.source).outgoing.push(link);
    byId.get(link.target).incoming.push(link);
  }
  for (const node of nodes)
    node.value = Math.max(node.incoming.length, node.outgoing.length, 1);
  return {
    order,
    nodes,
    links: visibleLinks,
    loose: all
      .filter((n) => !allConnected.has(n.id) && matched.has(n.id))
      .sort(compare),
    missing: missing.filter((m) => visibleRecords.has(m.record)),
    recordCount: visibleRecords.size,
    totalRecords: records.length,
  };
}

export function relationNeighborhood(graph, id) {
  const records = new Set(
    graph.links
      .filter((e) => e.source === id || e.target === id)
      .map((e) => e.record),
  );
  return {
    records,
    nodes: new Set([
      id,
      ...graph.links
        .filter((e) => records.has(e.record))
        .flatMap((e) => [e.source, e.target]),
    ]),
  };
}

export const ROLE_COLORS = {
  milestones: "#497c65",
  records: "#55768b",
  sites: "#b58a45",
};

export function relationChartOption(
  graph,
  { selected = null, width = 1000, reducedMotion = false, roleNames = {} } = {},
) {
  const rank = new Map(graph.order.map((role, i) => [role, i]));
  const near = selected ? relationNeighborhood(graph, selected) : null;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const title = (id) => byId.get(id)?.row.title || "未命名";
  // Keep an empty final column without inventing a layout-only business node.
  const lastDepth = Math.max(0, ...graph.nodes.map((n) => rank.get(n.role)));
  const right = 32 + ((width - 64 - 18) * (2 - lastDepth)) / 2;
  return {
    animation: !reducedMotion,
    animationDurationUpdate: 350,
    aria: {
      enabled: true,
      label: {
        description:
          "项目关联桑基图。列顺序仅为阅读顺序，不表示时间或业务依赖。也可展开下方节点列表阅读详情。",
      },
    },
    tooltip: {
      trigger: "item",
      renderMode: "richText",
      confine: true,
      formatter: (p) =>
        p.dataType === "edge"
          ? title(p.data.source) +
            " — " +
            title(p.data.target) +
            "\n1 项真实关联"
          : (roleNames[byId.get(p.name)?.role] || "") + "\n" + title(p.name),
    },
    toolbox: {
      right: 12,
      top: 8,
      itemSize: 16,
      feature: {
        restore: { title: "重置图表" },
        saveAsImage: {
          type: "svg",
          title: "导出关系图",
          name: "年轮-项目关系",
          pixelRatio: 2,
        },
      },
    },
    series: [
      {
        id: "project-relations",
        type: "sankey",
        left: 32,
        right,
        top: 52,
        bottom: 24,
        nodeWidth: 18,
        nodeGap: 26,
        nodeAlign: "left",
        layoutIterations: 32,
        draggable: true,
        emphasis: { focus: "adjacency", lineStyle: { opacity: 0.6 } },
        lineStyle: { color: "gradient", opacity: 0.19, curveness: 0.48 },
        label: {
          color: "#344a3f",
          fontSize: 12,
          lineHeight: 18,
          width: 190,
          height: 38,
          overflow: "break",
          lineOverflow: "truncate",
          formatter: (p) => title(p.name),
        },
        data: graph.nodes.map((n) => ({
          name: n.id,
          depth: rank.get(n.role),
          itemStyle: {
            color: ROLE_COLORS[n.role],
            opacity: near && !near.nodes.has(n.id) ? 0.18 : 1,
            borderWidth: n.id === selected ? 2 : 0,
            borderColor: "#213c2f",
          },
          label: {
            position: rank.get(n.role) === 2 ? "left" : "right",
            opacity: near && !near.nodes.has(n.id) ? 0.35 : 1,
          },
        })),
        links: graph.links.map((e) => ({
          source: e.source,
          target: e.target,
          value: 1,
          lineStyle: {
            opacity: near ? (near.records.has(e.record) ? 0.58 : 0.025) : 0.19,
          },
        })),
      },
    ],
  };
}
