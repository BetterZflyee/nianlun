/** Pure layout for actual nodes and explicit edges. Positions do not imply links. */
export const MAX_NODES = 80;
export const MAX_EDGES = 320;
export const KINDS = new Set([
  "cluster",
  "pipeline",
  "timeline",
  "connections",
]);

export function hash(value) {
  let result = 2166136261;
  for (const char of String(value)) {
    result ^= char.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function displayStatus(status) {
  const labels = {
    ready: "已就绪",
    configured: "已配置",
    idle: "空闲",
    attention: "需关注",
    running: "执行中",
    succeeded: "已完成",
    waiting_harness: "等待宿主",
    failed: "失败",
    interrupted: "需核验",
    prepared: "接续材料已准备",
    queued: "排队中",
    paused: "已暂停",
    pending: "待处理",
    waiting: "等待中",
    completed: "已完成",
    complete: "已完成",
    enabled: "已启用",
    disabled: "未启用",
    active: "已开启",
    inactive: "未开启",
    error: "故障",
    blocked: "受阻",
    success: "成功",
    processing: "处理中",
    unknown: "未知",
    cancelled: "已取消",
    canceled: "已取消",
  };
  const value = String(status || "");
  return labels[value.toLowerCase()] || value;
}

export function statusColor(status) {
  const value = String(status || "").toLowerCase();
  if (/\b(failed|error|blocked)\b|失败|故障|阻塞|受阻/.test(value))
    return "#e69982";
  if (
    /\b(paused|pending|waiting|waiting_harness|attention|interrupted|prepared|queued)\b|暂停|待处理|等待|待接续/.test(
      value,
    )
  )
    return "#d9c096";
  if (
    /\b(complete|completed|success|succeeded|ready|configured|enabled|active)\b|已完成|成功|已连接|已启用|正常/.test(
      value,
    )
  )
    return "#a7d6bd";
  if (/\b(running|processing)\b|进行中|执行中|处理中/.test(value))
    return "#e2e7b8";
  return "#90b5ab";
}

function normalizeNode(node) {
  if (!node || node.id == null || String(node.id).trim() === "") return null;
  const value = Number(node.value);
  return {
    id: String(node.id),
    label: String(node.label || node.id),
    group: String(node.group || "未分组"),
    status: String(node.status || ""),
    detail: String(node.detail || ""),
    value:
      node.value != null && Number.isFinite(value) && value >= 0 ? value : null,
    color: statusColor(node.status),
  };
}

export function buildScene({ kind = "cluster", nodes = [], edges = [] } = {}) {
  if (!KINDS.has(kind)) kind = "cluster";
  const unique = new Map();
  for (const raw of Array.isArray(nodes) ? nodes : []) {
    const node = normalizeNode(raw);
    if (node && !unique.has(node.id)) unique.set(node.id, node);
  }
  const visible = [...unique.values()].slice(0, MAX_NODES);
  const groups = [...new Set(visible.map((node) => node.group))].sort();
  const positioned = new Map();
  const groupInfo = [];
  if (kind === "cluster") {
    const columns =
      Math.min(groups.length, 4, Math.ceil(Math.sqrt(groups.length * 1.8))) ||
      1;
    const rows = Math.ceil(groups.length / columns) || 1;
    const cellWidth = 7.4 / columns;
    const cellHeight = 3.2 / rows;
    groups.forEach((group, i) => {
      const rowItems = Math.min(
        columns,
        groups.length - Math.floor(i / columns) * columns,
      );
      const centre = [
        ((i % columns) - (rowItems - 1) / 2) * cellWidth,
        ((rows - 1) / 2 - Math.floor(i / columns)) * cellHeight,
        0,
      ];
      const members = visible
        .filter((node) => node.group === group)
        .sort((a, b) => a.id.localeCompare(b.id));
      groupInfo.push({
        id: group,
        label: group,
        position: [centre[0], centre[1] + cellHeight * 0.38, 0.05],
        count: members.length,
      });
      members.forEach((node, j) => {
        const radius =
          members.length === 1 ? 0 : Math.sqrt((j + 0.4) / members.length);
        const angle =
          j * 2.399963229728653 + ((hash(group) % 360) * Math.PI) / 180;
        positioned.set(node.id, [
          centre[0] + Math.cos(angle) * radius * cellWidth * 0.36,
          centre[1] + Math.sin(angle) * radius * cellHeight * 0.31 - 0.1,
          ((hash(node.id) % 101) / 100 - 0.5) * 0.65,
        ]);
      });
    });
  } else if (kind === "connections") {
    // Grouping uses the provided group only; proximity never adds a relationship.
    const ordered = [...visible].sort(
      (a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id),
    );
    ordered.forEach((node, i) => {
      const angle =
        (Math.PI * 2 * i) / Math.max(1, ordered.length) - Math.PI / 2;
      const radius = ordered.length === 1 ? 0 : 1;
      positioned.set(node.id, [
        Math.cos(angle) * 3.05 * radius,
        Math.sin(angle) * 1.32 * radius,
        Math.sin(angle * 2) * 0.42,
      ]);
    });
  } else {
    // Pipeline and timeline respect caller order; no dependency or date is inferred.
    const columns = Math.min(10, visible.length) || 1;
    const rows = Math.ceil(visible.length / columns) || 1;
    visible.forEach((node, i) => {
      const row = Math.floor(i / columns),
        rowItems = Math.min(columns, visible.length - row * columns);
      const column = i % columns;
      const x = rowItems < 2 ? 0 : (column / (rowItems - 1) - 0.5) * 6.6;
      const y =
        rows === 1
          ? kind === "timeline"
            ? column % 2
              ? -0.26
              : 0.26
            : 0
          : (0.5 - row / (rows - 1)) * 2.9;
      positioned.set(node.id, [
        x,
        y,
        kind === "timeline"
          ? column % 2
            ? -0.2
            : 0.2
          : Math.sin(column * 0.7) * 0.25,
      ]);
    });
  }
  const maxValue = Math.max(1, ...visible.map((node) => node.value || 0));
  const resultNodes = visible.map((node) => ({
    ...node,
    position: positioned.get(node.id),
    radius:
      node.value == null
        ? 0.105
        : 0.095 + Math.sqrt(node.value / maxValue) * 0.075,
  }));
  const ids = new Set(resultNodes.map((node) => node.id));
  const validEdges = [],
    seen = new Set();
  let invalidEdges = 0;
  for (const raw of Array.isArray(edges) ? edges : []) {
    if (raw?.source == null || raw?.target == null) {
      invalidEdges++;
      continue;
    }
    const source = String(raw.source),
      target = String(raw.target);
    if (!ids.has(source) || !ids.has(target) || source === target) {
      invalidEdges++;
      continue;
    }
    const key = JSON.stringify([source, target]);
    if (seen.has(key)) continue;
    seen.add(key);
    validEdges.push({ source, target });
  }
  return {
    kind,
    nodes: resultNodes,
    groups: groupInfo,
    edges: validEdges.slice(0, MAX_EDGES),
    total: unique.size,
    shown: resultNodes.length,
    overflow: Math.max(0, unique.size - resultNodes.length),
    edgeOverflow: Math.max(0, validEdges.length - MAX_EDGES),
    omittedEdges: invalidEdges,
  };
}
