// Pure graph/data/layout functions shared by the view, its worker and Node tests.
export const PALETTE = [
  "#8ee0c5",
  "#91baf3",
  "#dec184",
  "#c0a1ee",
  "#de999e",
  "#a9cd8c",
  "#8bd2df",
];
export function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export const colorFor = (group) => PALETTE[hash(group) % PALETTE.length];
export const keyFor = (p) =>
  p.key || JSON.stringify([p.source_id || null, p.slug]);

export function buildGraph(pages, projects = []) {
  const groups = new Map(),
    bySlug = new Map();
  const nodes = pages.map((page) => {
    const project = projects.find(
      (p) =>
        p.title &&
        (page.title + " " + page.slug)
          .toLowerCase()
          .includes(p.title.toLowerCase()),
    );
    const folder = page.slug.includes("/") ? page.slug.split("/")[0] : "未分类";
    const group = project ? "project:" + project.id : "folder:" + folder;
    groups.set(group, {
      id: group,
      title: project?.title || folder,
      basis: project ? "标题匹配项目" : "记忆目录",
      color: colorFor(group),
    });
    const node = { ...page, id: keyFor(page), group, color: colorFor(group) };
    const siblings = bySlug.get(page.slug) || [];
    siblings.push(node);
    bySlug.set(page.slug, siblings);
    return node;
  });
  const edges = [],
    seen = new Set();
  let unresolved = 0;
  for (const node of nodes) {
    const links = [
      ...(node.links || []),
      ...(node.references || []).map((slug) => ({
        slug: slug.split("#")[0],
        source_id: node.source_id,
      })),
    ];
    for (const ref of links) {
      let matches = bySlug.get(ref.slug) || [];
      if (ref.source_id)
        matches = matches.filter((n) => n.source_id === ref.source_id);
      else if (matches.length > 1)
        matches = matches.filter((n) => n.source_id === node.source_id);
      if (matches.length !== 1) {
        unresolved++;
        continue;
      }
      const target = matches[0].id;
      if (target === node.id) continue;
      const key = JSON.stringify([node.id, target]);
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: node.id, target, kind: "reference" });
    }
  }
  return { nodes, edges, groups: [...groups.values()], unresolved };
}

export function neighborhood(id, edges, depth = 1) {
  if (!id) return new Set();
  const adjacency = new Map();
  for (const { source, target } of edges) {
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(source).add(target);
    adjacency.get(target).add(source);
  }
  const found = new Set([id]);
  let frontier = [id];
  for (let hop = 0; hop < Math.min(2, depth); hop++) {
    const next = [];
    for (const node of frontier)
      for (const n of adjacency.get(node) || [])
        if (!found.has(n)) {
          found.add(n);
          next.push(n);
        }
    frontier = next;
  }
  return found;
}

function centerLayout(points) {
  if (!points.length) return points;
  const center = [0, 0, 0],
    count = points.length / 3;
  for (let i = 0; i < points.length; i++) center[i % 3] += points[i] / count;
  for (let i = 0; i < points.length; i++) points[i] -= center[i % 3];
  return points;
}

export function seedLayout(nodes, mode = "galaxy") {
  const grouped = new Map();
  for (const node of nodes) {
    if (!grouped.has(node.group)) grouped.set(node.group, []);
    grouped.get(node.group).push(node);
  }
  const result = new Map();
  const clusters = [...grouped].sort(([a], [b]) => a.localeCompare(b));
  clusters.forEach(([group, members], gi) => {
    const angle = gi * 2.399963,
      radius = clusters.length > 1 ? 135 * Math.sqrt(gi + 0.4) : 0;
    const center = [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.8,
      ((hash(group) % 100) - 50) * 1.3,
    ];
    [...members]
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((n, i) => {
        const a = i * 2.399963 + (hash(group) % 360),
          r = 18 * Math.sqrt(i + 0.6);
        result.set(n.id, [
          center[0] + Math.cos(a) * r,
          center[1] + Math.sin(a) * r * 0.76,
          mode === "disc"
            ? Math.sin(a) * r * 0.12
            : center[2] +
              ((hash(n.id) % 1000) / 1000 - 0.5) * Math.min(220, r * 2),
        ]);
      });
  });
  return centerLayout(new Float32Array(nodes.flatMap((n) => result.get(n.id))));
}

export function relaxLayout(nodes, edges, mode = "galaxy") {
  const points = seedLayout(nodes, mode),
    anchors = points.slice(),
    ids = new Map(nodes.map((n, i) => [n.id, i]));
  const pairs = edges
    .map((e) => [ids.get(e.source), ids.get(e.target)])
    .filter(([a, b]) => a !== undefined && b !== undefined && a !== b);
  const n = nodes.length,
    forces = new Float32Array(n * 3),
    cell = 36;
  // Bounded local repulsion: a spatial hash, never an all-pairs main-thread simulation.
  for (let tick = 0; tick < 85; tick++) {
    forces.fill(0);
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const k = [0, 1, 2]
        .map((d) => Math.floor(points[i * 3 + d] / cell))
        .join(",");
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }
    for (let i = 0; i < n; i++) {
      const p = i * 3,
        gx = Math.floor(points[p] / cell),
        gy = Math.floor(points[p + 1] / cell),
        gz = Math.floor(points[p + 2] / cell);
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          for (let z = -1; z <= 1; z++) {
            for (const j of grid.get([gx + x, gy + y, gz + z].join(",")) ||
              []) {
              if (j <= i) continue;
              const q = j * 3,
                dx = points[p] - points[q],
                dy = points[p + 1] - points[q + 1],
                dz = points[p + 2] - points[q + 2];
              const dist = Math.max(0.1, Math.hypot(dx, dy, dz));
              if (dist >= 30) continue;
              const f = ((30 - dist) * 0.09) / dist;
              for (const [d, v] of [
                [0, dx],
                [1, dy],
                [2, dz],
              ]) {
                forces[p + d] += v * f;
                forces[q + d] -= v * f;
              }
            }
          }
    }
    for (const [a, b] of pairs) {
      const p = a * 3,
        q = b * 3,
        dist = Math.hypot(
          points[p] - points[q],
          points[p + 1] - points[q + 1],
          points[p + 2] - points[q + 2],
        );
      const f = Math.max(
        -0.02,
        Math.min(0.02, ((dist - 65) / Math.max(1, dist)) * 0.025),
      );
      for (let d = 0; d < 3; d++) {
        const delta = (points[q + d] - points[p + d]) * f;
        forces[p + d] += delta;
        forces[q + d] -= delta;
      }
    }
    for (let i = 0; i < points.length; i++)
      points[i] +=
        Math.max(
          -3,
          Math.min(3, forces[i] + (anchors[i] - points[i]) * 0.012),
        ) *
        (1 - tick / 110);
  }
  return centerLayout(points);
}
