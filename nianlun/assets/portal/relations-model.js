// A relationship Sankey: one band is one explicit record association.
// It does not imply a conserved budget, progress, or a direct milestone/site link.
const roles = ["milestones", "records", "sites"];
const fields = { milestones: "milestone_ids", sites: "site_ids" };
const key = (role, id) => JSON.stringify([role, String(id)]);
const compare = (a, b) =>
  String(a.row.title || "").localeCompare(String(b.row.title || ""), "zh-CN") ||
  a.id.localeCompare(b.id);

export function buildRelations(rows, query = "") {
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
          source: role === "milestones" ? other.id : record.id,
          target: role === "milestones" ? record.id : other.id,
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

export function layoutRelations(graph, width) {
  const columns = roles.map((role) =>
    graph.nodes
      .filter((n) => n.role === role)
      .map((n) => ({ ...n }))
      .sort(compare),
  );
  const order = new Map();
  const reindex = () =>
    columns.forEach((c) => c.forEach((n, i) => order.set(n.id, i)));
  reindex();
  // Alternating barycentres reduce crossings without randomising the layout.
  for (let pass = 0; pass < 8; pass++) {
    for (const ci of pass % 2 ? [1, 0] : [1, 2]) {
      const useIncoming = pass % 2 === 0;
      const score = (n) => {
        const edges = useIncoming ? n.incoming : n.outgoing;
        return edges.length
          ? edges.reduce(
              (sum, e) => sum + order.get(useIncoming ? e.source : e.target),
              0,
            ) / edges.length
          : order.get(n.id);
      };
      columns[ci].sort((a, b) => score(a) - score(b) || compare(a, b));
      reindex();
    }
  }
  const unit = 9,
    gap = 16,
    top = 62,
    padding = 24;
  const cardWidth = Math.min(218, (width - 2 * padding) * 0.24);
  const nodeHeight = (n) =>
    Math.max(
      [...String(n.row.title || "")].reduce(
        (sum, c) => sum + (/[\x00-\x7f]/.test(c) ? 0.55 : 1),
        0,
      ) *
        12 >
        cardWidth - 30
        ? 76
        : 58,
      n.value * unit + 18,
    );
  const heights = columns.map(
    (c) =>
      c.reduce((h, n) => h + nodeHeight(n), 0) +
      Math.max(0, c.length - 1) * gap,
  );
  const innerHeight = Math.max(310, ...heights);
  columns.forEach((column, ci) => {
    let y = top + (innerHeight - heights[ci]) / 2;
    for (const n of column) {
      n.x = padding + (ci * (width - 2 * padding - cardWidth)) / 2;
      n.y = y;
      n.width = cardWidth;
      n.height = nodeHeight(n);
      y += n.height + gap;
    }
  });
  const nodes = columns.flat(),
    byId = new Map(nodes.map((n) => [n.id, n]));
  // Place side nodes near their records, then resolve overlaps within the column.
  for (const ci of [0, 2]) {
    const column = columns[ci];
    for (const n of column) {
      const edges = ci === 0 ? n.outgoing : n.incoming;
      n.y =
        edges.reduce((sum, e) => {
          const other = byId.get(ci === 0 ? e.target : e.source);
          return sum + other.y + other.height / 2;
        }, 0) /
          edges.length -
        n.height / 2;
    }
    let cursor = top;
    for (const n of column) {
      n.y = Math.max(cursor, n.y);
      cursor = n.y + n.height + gap;
    }
    cursor = top + innerHeight;
    for (const n of [...column].reverse()) {
      n.y = Math.min(n.y, cursor - n.height);
      cursor = n.y - gap;
    }
  }
  const offsets = new Map();
  for (const n of nodes) {
    for (const [direction, edges] of [
      ["in", n.incoming],
      ["out", n.outgoing],
    ]) {
      const sorted = [...edges].sort(
        (a, b) =>
          byId.get(direction === "in" ? a.source : a.target).y -
          byId.get(direction === "in" ? b.source : b.target).y,
      );
      sorted.forEach((e, i) =>
        offsets.set(
          e.source + "|" + e.target + "|" + direction,
          n.y + (n.height - sorted.length * unit) / 2 + i * unit,
        ),
      );
    }
  }
  const links = graph.links.map((e) => {
    const s = byId.get(e.source),
      t = byId.get(e.target),
      x0 = s.x + s.width,
      x1 = t.x;
    const y0 = offsets.get(e.source + "|" + e.target + "|out"),
      y1 = offsets.get(e.source + "|" + e.target + "|in"),
      bend = (x1 - x0) * 0.48;
    const d = `M${x0},${y0} C${x0 + bend},${y0} ${x1 - bend},${y1} ${x1},${y1} L${x1},${y1 + unit} C${x1 - bend},${y1 + unit} ${x0 + bend},${y0 + unit} ${x0},${y0 + unit} Z`;
    return { ...e, d };
  });
  return { nodes, links, width, height: top + innerHeight + 24, cardWidth };
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
