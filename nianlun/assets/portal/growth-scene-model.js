// Positions communicate identity, not dependency, completion or quantitative progress.
export function hash(value) {
  let result = 2166136261;
  for (const character of String(value)) {
    result ^= character.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function statusColor(status) {
  if (/已完成|已归档|已结束/.test(status || "")) return "#a5d4bb";
  if (/暂停|搁置/.test(status || "")) return "#d2ba8e";
  if (/受阻|阻塞|风险|延期/.test(status || "")) return "#e79781";
  if (/进行中|执行中/.test(status || "")) return "#c7f5da";
  return "#91aaa1";
}

export function contourPoint(radius, angle, phase = 0) {
  const wave =
    1 +
    0.052 * Math.sin(angle * 3 + phase) +
    0.025 * Math.cos(angle * 5 - 0.6) +
    0.012 * Math.sin(angle * 9 + radius);
  return [
    Math.cos(angle) * radius * wave,
    0.37 * Math.sin(angle * 2 + 0.5) * (radius / 3.6) +
      0.13 * Math.cos(angle * 3 + radius * 0.8),
    Math.sin(angle) * radius * wave * 0.86,
  ];
}

export function buildOverview(
  { projects = [], records = [], milestones = [], sites = [] } = {},
  limit = 40,
) {
  const unique = [
    ...new Map(
      projects.filter((p) => p?.id != null).map((p) => [String(p.id), p]),
    ).values(),
  ].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const counts = new Map(
    unique.map((p) => [String(p.id), { records: 0, milestones: 0, sites: 0 }]),
  );
  for (const [kind, rows] of Object.entries({ records, milestones, sites })) {
    const seen = new Set();
    for (const row of rows) {
      if (!row || row.id == null || seen.has(String(row.id))) continue;
      seen.add(String(row.id));
      for (const id of new Set(
        (Array.isArray(row.project_ids) ? row.project_ids : []).map(String),
      )) {
        if (counts.has(id)) counts.get(id)[kind] += 1;
      }
    }
  }
  const count = Math.max(0, Math.min(40, Math.floor(Number(limit) || 0)));
  const nodes = unique.slice(0, count).map((project) => {
    const id = String(project.id),
      seed = hash(id);
    const radius = 1.18 + (seed % 7) * 0.32;
    const angle = (hash("angle:" + id) / 4294967295) * Math.PI * 2;
    const position = contourPoint(radius, angle);
    position[1] += 0.1;
    return {
      id,
      title: String(project.title || "未命名项目"),
      status: String(project.status || "未设置状态"),
      color: statusColor(project.status),
      counts: counts.get(id),
      position,
    };
  });
  return {
    nodes,
    total: unique.length,
    shown: nodes.length,
    overflow: unique.length - nodes.length,
  };
}
