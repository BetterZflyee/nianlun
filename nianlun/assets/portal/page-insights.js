// Shared lifecycle for page-level, read-only Three.js exploration panels.
const pageInsightViews = new Set();
let refreshSetupInsight = () => {};
function cleanupPageInsights() {
  refreshSetupInsight = () => {};
  for (const destroy of [...pageInsightViews]) destroy();
}
function insightPanel({
  title,
  description,
  kind = "cluster",
  onSelect,
  compact = false,
}) {
  let scene,
    selectedId = null,
    dead = false,
    fallback = false,
    payload = { nodes: [], edges: [] };
  const stage = el("div", { class: "insight-stage", "aria-label": title });
  const selection = el("p", {
    class: "insight-selection",
    text: "选择节点，查看对应内容。",
    "aria-live": "polite",
  });
  const caption = el("small", {
    class: "page-insight-caption",
    text: "正在准备视图…",
  });
  const toggle = btn("收起图景", () => {
    const collapsed = !stage.hidden;
    stage.hidden = collapsed;
    footer.hidden = collapsed;
    toggle.textContent = collapsed ? "展开图景" : "收起图景";
    toggle.setAttribute("aria-expanded", String(!collapsed));
  });
  toggle.setAttribute("aria-expanded", "true");
  const footer = el("footer", {}, [selection, caption]);
  const root = el(
    "section",
    {
      class: "page-insight" + (compact ? " compact" : ""),
      "aria-label": title,
    },
    [
      el("header", {}, [
        el("div", {}, [
          el("h2", { text: title }),
          el("p", { text: description }),
        ]),
        toggle,
      ]),
      stage,
      footer,
    ],
  );
  function selectNode(id) {
    const node = payload.nodes.find((n) => n.id === id);
    if (!node) return;
    selectedId = id;
    selection.textContent = node.label + " · " + (node.detail || "已选择");
    scene?.focus(id);
    onSelect?.(id);
  }
  function destroy() {
    if (dead) return;
    dead = true;
    scene?.destroy();
    pageInsightViews.delete(destroy);
  }
  function drawFallback() {
    stage.replaceChildren(
      ...payload.nodes
        .slice(0, 80)
        .map((n) => btn(n.label, () => selectNode(n.id))),
    );
  }
  pageInsightViews.add(destroy);
  // Mount after the caller appends root. Navigation cleanup invalidates late imports.
  queueMicrotask(async () => {
    try {
      const module = await import("./insight-scene.js");
      if (dead || !root.isConnected) return;
      scene = module.mount(stage, {
        ...payload,
        kind,
        onSelect: selectNode,
        onReady: (s) => {
          caption.textContent =
            (s.mode === "webgl" ? "拖动旋转 · 滚轮缩放" : "轻量目录") +
            ` · ${s.shown} / ${s.total} 个节点`;
        },
        onError: () => {
          caption.textContent = "已切换轻量目录，下方操作仍可使用";
        },
      });
    } catch (e) {
      if (dead) return;
      fallback = true;
      caption.textContent = "三维视图暂不可用，下方列表仍可操作";
      drawFallback();
    }
  });
  return {
    root,
    destroy,
    update(value) {
      payload = value;
      if (Object.prototype.hasOwnProperty.call(value, "selectedId")) selectedId = value.selectedId;
      if (!dead) scene?.update(value);
      if (!dead && fallback) drawFallback();
      const selected = value.nodes.find((n) => n.id === selectedId);
      if (!selected) selectedId = null;
      selection.textContent = !value.nodes.length
        ? "当前范围没有可展示的数据。"
        : selected
          ? selected.label + " · " + (selected.detail || "已选择")
          : "选择节点，查看对应内容。";
    },
  };
}

async function addProjectInsight(root, project, generation) {
  const module = await import("./insight-data.js");
  if (generation !== viewVersion || !root.isConnected) return;
  const roles = ["records", "milestones", "sites"];
  const rows = Object.fromEntries(
    roles.map((role) => [
      role,
      data[role].filter((row) => row.project_ids?.includes(project.id)),
    ]),
  );
  const panel = insightPanel({
    title: "项目关系空间",
    description:
      "只连接已有记录关联。点选查看内容；完整排列可在“探索关系”中调整。",
    kind: "cluster",
    compact: true,
    onSelect(id) {
      const colon = id.indexOf(":"),
        role = id.slice(0, colon),
        row = rows[role]?.find((r) => r.id === id.slice(colon + 1));
      if (!row) return;
      studioDrawer(
        row.title,
        el("div", { class: "relation-detail" }, [
          badge(roleNames[role]),
          badge(row.status || "未设置状态"),
          el("h2", { text: row.title }),
          el("p", {
            text: row.description || row.notes || "尚未填写详细内容。",
          }),
          btn("编辑这条内容", () => editRow(role, row)),
        ]),
      );
    },
  });
  root.append(panel.root);
  panel.update(module.projectLandscape(project, rows));
}

async function addSetupInsight(root, generation) {
  const module = await import("./insight-data.js");
  if (generation !== viewVersion || !root.isConnected) return;
  const destinations = {
    workspace: ".operations-grid",
    table: '[data-setup-step="2"]',
    memory: '[data-setup-step="3"]',
    harness: '[data-setup-step="4"]',
    schedule: '[data-setup-step="5"]',
  };
  const panel = insightPanel({
    title: "你的工作空间，怎样连接",
    description:
      "连线代表已保存配置，不代表连接健康检查。点选节点前往对应设置。",
    kind: "connections",
    onSelect(id) {
      const target = root.querySelector(destinations[id]);
      if (!target) return;
      target.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    },
  });
  root.querySelector(".page-heading")?.after(panel.root);
  if (!panel.root.isConnected) root.prepend(panel.root);
  refreshSetupInsight = () => {
    if (panel.root.isConnected) panel.update(module.connectionLandscape(boot));
  };
  refreshSetupInsight();
}
