// Pure projections of loaded data. No inferred dependencies or external reads.
export function todoLandscape(rows, projects) {
  const groups = new Map();
  const names = new Map(projects.map((p) => [p.id, p.title]));
  for (const row of rows) {
    const id = names.has(row.link?.project_id)
      ? row.link.project_id
      : "unlinked";
    if (!groups.has(id))
      groups.set(id, {
        id,
        label: names.get(id) || "未匹配项目",
        group: "项目",
        value: 0,
        urgent: 0,
      });
    const group = groups.get(id);
    group.value++;
    if (Number(row.priority) >= 30) group.urgent++;
  }
  return {
    nodes: [...groups.values()].map((g) => ({
      ...g,
      status: g.urgent ? "attention" : "ready",
      detail: `${g.value} 项待办 · ${g.urgent} 项高优先级`,
    })),
    edges: [],
  };
}

export function projectLandscape(project, rows) {
  const nodes = [],
    edges = [],
    ids = new Set();
  const names = { records: "项目记录", milestones: "里程碑", sites: "场地" };
  for (const role of Object.keys(names))
    for (const row of rows[role] || []) {
      const id = role + ":" + row.id;
      ids.add(id);
      nodes.push({
        id,
        label: row.title,
        group: names[role],
        status: row.status || "unknown",
        detail: row.description || row.notes || names[role],
        value: 1,
      });
    }
  for (const row of rows.records || [])
    for (const role of ["milestones", "sites"]) {
      const field = role === "milestones" ? "milestone_ids" : "site_ids";
      for (const target of new Set(row[field] || []))
        if (ids.has(role + ":" + target))
          edges.push({
            source: "records:" + row.id,
            target: role + ":" + target,
          });
    }
  return { nodes, edges };
}

export function connectionLandscape(boot) {
  const scheduled = boot.scheduler?.active;
  const nodes = [
    {
      id: "workspace",
      label: "年轮工作空间",
      status: "ready",
      group: "本机",
      detail: "当前本机工作台",
    },
    {
      id: "table",
      label: "AI 表格",
      status: boot.configured ? "configured" : "idle",
      group: "你的数据",
      detail: boot.configured ? "已有绑定 · 点击查看配置" : "尚未绑定",
    },
    {
      id: "memory",
      label: "独立记忆空间",
      status: boot.memory_connected ? "configured" : "idle",
      group: "你的数据",
      detail: boot.memory_connected ? "已有目录 · 点击查看配置" : "尚未配置",
    },
    {
      id: "harness",
      label: boot.harness?.name || "AI 宿主",
      status: boot.harness_configured ? "configured" : "idle",
      group: "执行",
      detail: boot.harness_configured
        ? "已有宿主选择 · 尚不代表可执行性核验"
        : "默认选项 · 尚未保存宿主配置",
    },
    {
      id: "schedule",
      label: "自动生长",
      status: scheduled ? "ready" : "idle",
      group: "执行",
      detail: scheduled
        ? "调度已生效"
        : boot.scheduler?.status === "paused"
          ? "当前已暂停"
          : "尚未核验运行",
    },
  ];
  const configured = [
    boot.configured && "table",
    boot.memory_connected && "memory",
    boot.harness_configured && "harness",
    boot.scheduler?.registered && "schedule",
  ].filter(Boolean);
  return {
    nodes,
    edges: configured.map((id) => ({ source: "workspace", target: id })),
  };
}
