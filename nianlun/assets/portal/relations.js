import { init } from "./vendor/echarts-sankey.min.js";
import {
  buildRelations,
  normalizeOrder,
  RELATION_ORDERS,
  DEFAULT_ORDER,
  relationChartOption,
} from "./relations-model.js";

export function createRelationView({
  project,
  rows,
  el,
  btn,
  badge,
  roleNames,
  edit,
  label,
  initialOrder,
  onOrderChange,
}) {
  if (!document.querySelector("link[data-relations-style]")) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = new URL("./relations.css", import.meta.url);
    style.dataset.relationsStyle = "";
    document.head.append(style);
  }
  let order = normalizeOrder(initialOrder),
    graph,
    selected = null,
    chart = null,
    observer,
    disposed = false,
    saving = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const title = (n) => n.row.title || "未命名";
  const root = el("div", { class: "relations-view" });
  const search = el("input", {
    type: "search",
    placeholder: "查找记录、里程碑或场地",
    "aria-label": "查找关联节点",
  });
  const summary = el("span", {
    class: "relations-summary",
    "aria-live": "polite",
  });
  const sequence = el(
    "select",
    { "aria-label": "关系图从左到右的顺序" },
    RELATION_ORDERS.map((v) =>
      el("option", {
        value: v.join(","),
        text: v.map((r) => roleNames[r]).join(" → "),
      }),
    ),
  );
  sequence.value = order.join(",");
  const saved = el("span", { class: "relations-save-state", role: "status" });
  const retry = btn("重试保存", () => saveOrder());
  retry.hidden = true;
  const reset = btn("恢复默认顺序", () => changeOrder(DEFAULT_ORDER));
  const headings = el("div", {
    class: "relations-headings",
    "aria-hidden": "true",
  });
  const canvas = el("div", {
    class: "relations-canvas",
    "aria-label": "项目关联桑基图",
  });
  const scroll = el("div", { class: "relations-scroll" }, [headings, canvas]);
  const details = el("section", {
    class: "relations-detail",
    hidden: true,
    "aria-label": "所选节点详情",
  });
  const directory = el("details", { class: "relations-directory" });
  const loose = el("div", { class: "relations-loose" });
  const note = el("p", { class: "relations-note" });
  root.append(
    el("div", { class: "relations-toolbar" }, [
      el("div", {}, [el("strong", { text: label(project) }), summary]),
      search,
    ]),
    el("div", { class: "relations-order" }, [
      el("label", {}, [el("span", { text: "从左到右" }), sequence]),
      reset,
      saved,
      retry,
    ]),
    el("p", {
      class: "relations-help",
      text: "切换顺序，从不同角度看同一批关联。每条带表示一项真实关联；顺序不代表时间或业务依赖。悬停追踪、点击查看，也可拖动节点调整位置。",
    }),
    scroll,
    details,
    directory,
    loose,
    note,
  );

  async function saveOrder() {
    if (saving || disposed) return;
    saving = true;
    sequence.disabled = reset.disabled = retry.disabled = true;
    saved.textContent = "正在记住顺序…";
    retry.hidden = true;
    try {
      await onOrderChange?.([...order]);
      if (!disposed) saved.textContent = "已记住，下次打开沿用";
    } catch (e) {
      if (!disposed) {
        saved.textContent = "顺序已切换，但未保存：" + e.message;
        retry.hidden = false;
      }
    } finally {
      saving = false;
      if (!disposed)
        sequence.disabled = reset.disabled = retry.disabled = false;
    }
  }
  function changeOrder(next) {
    if (saving) return;
    order = normalizeOrder(next);
    sequence.value = order.join(",");
    draw();
    saveOrder();
  }
  function drawChart() {
    if (disposed || !graph.links.length) return;
    const width = Math.max(900, Math.round(scroll.clientWidth));
    const count = Math.max(
      ...order.map((role) => graph.nodes.filter((n) => n.role === role).length),
    );
    const height = Math.max(420, count * 76 + 76);
    canvas.style.width = headings.style.width = width + "px";
    canvas.style.height = height + "px";
    try {
      if (!chart) {
        chart = init(canvas, null, { renderer: "svg" });
        chart.on("click", (p) => {
          const id =
            p.dataType === "edge" ? graph.links[p.dataIndex]?.record : p.name;
          const node = graph.nodes.find((n) => n.id === id);
          if (node) selectNode(node);
        });
        chart.on("restore", () => {
          selected = null;
          details.hidden = true;
          drawChart();
        });
      }
      chart.resize({ width, height });
      chart.setOption(
        relationChartOption(graph, {
          selected,
          width,
          reducedMotion: reduced.matches,
          roleNames,
        }),
        { notMerge: true },
      );
      canvas.dataset.renderer = "echarts-svg";
    } catch (error) {
      chart?.dispose();
      chart = null;
      scroll.hidden = true;
      directory.open = true;
      note.textContent = "图表暂未能显示，可在节点列表中继续查看详情。";
      note.hidden = false;
    }
  }
  function paintDetails(n) {
    details.replaceChildren();
    details.hidden = !n;
    if (!n) return;
    const ids = new Set(
      graph.links
        .filter((e) => e.source === n.id || e.target === n.id)
        .map((e) => (e.source === n.id ? e.target : e.source)),
    );
    const names = graph.nodes.filter((x) => ids.has(x.id)).map(title);
    details.append(
      el("div", { class: "relations-detail-heading" }, [
        el("div", {}, [
          el("small", { text: roleNames[n.role] }),
          el("h3", { text: title(n) }),
        ]),
        badge(n.row.status),
        btn("编辑与关联", () => edit(n.role, n.row), "primary"),
        btn("取消选择", () => {
          selected = null;
          paintDetails(null);
          drawChart();
        }),
      ]),
      el("p", { text: n.row.description || n.row.notes || "暂无说明" }),
      el("p", {
        class: "relations-detail-links",
        text: names.length
          ? "直接关联：" + names.join("、")
          : "尚未连接项目记录、里程碑或场地。",
      }),
    );
  }
  function selectNode(n) {
    selected = selected === n.id ? null : n.id;
    paintDetails(selected ? n : null);
    drawChart();
    if (selected) details.scrollIntoView({ block: "nearest" });
  }
  function nodeList(nodes) {
    return el(
      "div",
      { class: "relations-node-list" },
      order.map((role) => {
        const group = nodes.filter((n) => n.role === role);
        return el("div", {}, [
          el("strong", { text: roleNames[role] + " · " + group.length }),
          ...group.map((n) =>
            btn(title(n), () => selectNode(n), "relations-list-node"),
          ),
        ]);
      }),
    );
  }
  function draw() {
    if (disposed) return;
    graph = buildRelations(rows, search.value, order);
    const chosen = [...graph.nodes, ...graph.loose].find(
      (n) => n.id === selected,
    );
    if (!chosen) selected = null;
    paintDetails(chosen);
    summary.textContent = `${graph.recordCount} / ${graph.totalRecords} 条记录 · ${graph.links.length} 项关联`;
    headings.replaceChildren(
      ...order.map((role) =>
        el("span", {
          class: "relations-" + role,
          text:
            roleNames[role] +
            " · " +
            graph.nodes.filter((n) => n.role === role).length,
        }),
      ),
    );
    note.textContent = graph.missing.length
      ? graph.missing.length + " 个关联目标当前不可用，图中仅绘制已读取的关联。"
      : "";
    note.hidden = !graph.missing.length;
    directory.replaceChildren(
      el("summary", {
        text: "按列表选择 · " + graph.nodes.length + " 个已连接节点",
      }),
      nodeList(graph.nodes),
    );
    directory.hidden = !graph.nodes.length;
    loose.replaceChildren();
    if (graph.loose.length)
      loose.append(
        el("details", { open: !graph.links.length }, [
          el("summary", {
            text: "尚未连接 · " + graph.loose.length + " 个节点",
          }),
          nodeList(graph.loose),
        ]),
      );
    scroll.hidden = !graph.links.length;
    if (graph.links.length) drawChart();
    else {
      chart?.dispose();
      chart = null;
      loose.prepend(
        el("p", {
          class: "relations-empty",
          text: search.value
            ? "没有匹配的已连接节点。"
            : "这个项目还没有记录关联，连接里程碑或场地后会在这里呈现。",
        }),
      );
    }
  }
  sequence.onchange = () => changeOrder(sequence.value.split(","));
  search.oninput = () => {
    selected = null;
    draw();
  };
  return {
    root,
    mount() {
      draw();
      observer = new ResizeObserver(() => {
        if (scroll.clientWidth > 0) drawChart();
      });
      observer.observe(scroll);
    },
    destroy() {
      disposed = true;
      observer?.disconnect();
      chart?.dispose();
      chart = null;
    },
  };
}
