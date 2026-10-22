import {
  buildRelations,
  layoutRelations,
  relationNeighborhood,
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
}) {
  if (!document.querySelector("link[data-relations-style]")) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = new URL("./relations.css", import.meta.url);
    style.dataset.relationsStyle = "";
    document.head.append(style);
  }
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
  const canvas = el("div", { class: "relations-canvas" });
  const scroll = el(
    "div",
    { class: "relations-scroll", "aria-label": "项目关联桑基图" },
    [canvas],
  );
  const details = el("section", {
    class: "relations-detail",
    hidden: true,
    "aria-label": "所选节点详情",
  });
  const loose = el("div", { class: "relations-loose" });
  const note = el("p", { class: "relations-note" });
  root.append(
    el("div", { class: "relations-toolbar" }, [
      el("div", {}, [el("strong", { text: label(project) }), summary]),
      search,
    ]),
    el("p", {
      class: "relations-help",
      text: "里程碑 → 项目记录 → 场地 · 每条带表示一项真实关联，节点带宽随关联数增加。悬停追踪，点击查看。",
    }),
    scroll,
    details,
    loose,
    note,
  );
  let graph,
    selected = null,
    hovered = null,
    observer = null,
    lastWidth = 0,
    disposed = false;
  const paths = new Map(),
    buttons = new Map();
  const ns = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  function highlight() {
    const id = selected || hovered;
    const neighborhood = id ? relationNeighborhood(graph, id) : null;
    for (const [nodeId, button] of buttons) {
      button.classList.toggle(
        "is-dimmed",
        !!id && !neighborhood.nodes.has(nodeId),
      );
      button.classList.toggle("is-focused", nodeId === id);
      button.setAttribute("aria-pressed", String(nodeId === selected));
    }
    for (const [edge, path] of paths) {
      path.classList.toggle(
        "is-dimmed",
        !!id && !neighborhood.records.has(edge.record),
      );
      path.classList.toggle(
        "is-focused",
        !!id && neighborhood.records.has(edge.record),
      );
    }
  }
  function selectNode(n) {
    selected = selected === n.id ? null : n.id;
    details.hidden = !selected;
    details.replaceChildren();
    if (selected) {
      const related = graph.links.filter(
        (e) => e.source === n.id || e.target === n.id,
      );
      const ids = new Set(
        related.map((e) => (e.source === n.id ? e.target : e.source)),
      );
      const names = graph.nodes
        .filter((x) => ids.has(x.id))
        .map((x) => title(x));
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
            hovered = null;
            details.hidden = true;
            highlight();
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
    highlight();
    if (selected) details.scrollIntoView({ block: "nearest" });
  }
  function nodeButton(n) {
    const button = btn(
      "",
      () => selectNode(n),
      "relations-node relations-" + n.role,
    );
    button.append(
      el("span", { class: "relations-node-title", text: title(n) }),
      el("small", {
        text:
          n.role === "records"
            ? n.incoming.length + n.outgoing.length + " 项关联"
            : n.value + " 条记录",
      }),
    );
    button.title = title(n);
    button.setAttribute("aria-label", roleNames[n.role] + "：" + title(n));
    button.onpointerenter = () => {
      hovered = n.id;
      highlight();
    };
    button.onpointerleave = () => {
      hovered = null;
      highlight();
    };
    button.onfocus = () => {
      hovered = n.id;
      highlight();
    };
    button.onblur = () => {
      hovered = null;
      highlight();
    };
    buttons.set(n.id, button);
    return button;
  }
  function draw() {
    if (disposed) return;
    const width = Math.max(860, Math.round(scroll.clientWidth));
    lastWidth = scroll.clientWidth;
    graph = buildRelations(rows, search.value);
    selected =
      graph.nodes.some((n) => n.id === selected) ||
      graph.loose.some((n) => n.id === selected)
        ? selected
        : null;
    if (!selected) details.hidden = true;
    canvas.replaceChildren();
    loose.replaceChildren();
    paths.clear();
    buttons.clear();
    hovered = null;
    summary.textContent =
      graph.recordCount +
      " / " +
      graph.totalRecords +
      " 条记录 · " +
      graph.links.length +
      " 项关联";
    note.textContent = graph.missing.length
      ? graph.missing.length + " 个关联目标当前不可用，图中仅绘制已读取的关联。"
      : "";
    note.hidden = !graph.missing.length;
    if (graph.links.length) {
      scroll.hidden = false;
      const layout = layoutRelations(graph, width);
      canvas.style.width = width + "px";
      canvas.style.height = layout.height + "px";
      const svg = svgEl("svg", {
        width,
        height: layout.height,
        viewBox: `0 0 ${width} ${layout.height}`,
        "aria-hidden": "true",
        class: "relations-bands",
      });
      for (const edge of layout.links) {
        const path = svgEl("path", {
          d: edge.d,
          class: "relations-band relations-" + edge.role,
        });
        svg.append(path);
        paths.set(edge, path);
      }
      canvas.append(svg);
      ["milestones", "records", "sites"].forEach((role, i) => {
        const head = el(
          "div",
          { class: "relations-column-heading relations-" + role },
          [
            el("span", { text: roleNames[role] }),
            el("small", {
              text: String(graph.nodes.filter((n) => n.role === role).length),
            }),
          ],
        );
        head.style.left = 24 + (i * (width - 48 - layout.cardWidth)) / 2 + "px";
        head.style.width = layout.cardWidth + "px";
        canvas.append(head);
      });
      for (const n of layout.nodes) {
        const button = nodeButton(n);
        Object.assign(button.style, {
          left: n.x + "px",
          top: n.y + "px",
          width: n.width + "px",
          height: n.height + "px",
        });
        canvas.append(button);
      }
    } else {
      scroll.hidden = true;
      loose.append(
        el("p", {
          class: "relations-empty",
          text: search.value
            ? "没有匹配的已连接节点。"
            : "这个项目还没有记录关联，连接里程碑或场地后会在这里呈现。",
        }),
      );
    }
    if (graph.loose.length) {
      const group = el("details", { open: !graph.links.length }, [
        el("summary", { text: "尚未连接 · " + graph.loose.length + " 个节点" }),
      ]);
      const list = el("div", { class: "relations-loose-list" });
      for (const n of graph.loose) {
        const b = btn(
          roleNames[n.role] + " · " + title(n),
          () => selectNode(n),
          "relations-loose-node",
        );
        b.title = title(n);
        list.append(b);
      }
      group.append(list);
      loose.append(group);
    }
    highlight();
  }
  search.oninput = () => {
    selected = null;
    draw();
  };
  return {
    root,
    mount() {
      draw();
      observer = new ResizeObserver(() => {
        if (scroll.clientWidth !== lastWidth && scroll.clientWidth > 0) draw();
      });
      observer.observe(scroll);
    },
    destroy() {
      disposed = true;
      observer?.disconnect();
    },
  };
}
