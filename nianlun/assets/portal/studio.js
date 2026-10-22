/* Nianlun 2.3: compact work surfaces, local data, explicit interactions. */
const studioIcons = {
  projects: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  todos: "m4 12 5 5L20 6",
  memory: "M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 11h.01M18 3v6m-3-3h6",
  skills: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  workflows: "M4 4h6v6H4zM14 14h6v6h-6zM7 10v7h7M10 7h7v7",
  runs: "M4 4v6h6M4 10a8 8 0 1 1 0 5M12 8v5l3 2",
  setup:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  folder: "M3 6h7l2 3h9v11H3z",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
  link: "m9 15 6-6M7 17l-1 1a4 4 0 0 1-5-5l5-5a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l5-5a4 4 0 0 0-5-5l-1 1",
};
function studioIcon(name) {
  const svg = svgNode("svg", {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.6,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  });
  svg.append(svgNode("path", { d: studioIcons[name] || studioIcons.skills }));
  return svg;
}
function studioHead(title, description, actions = []) {
  return el("header", { class: "studio-heading" }, [
    el("div", {}, [el("h1", { text: title }), el("p", { text: description })]),
    el("div", { class: "actions" }, actions),
  ]);
}
function studioEmpty(title, description) {
  return el("div", { class: "studio-empty" }, [
    studioIcon("memory"),
    el("h3", { text: title }),
    el("p", { text: description }),
  ]);
}
function studioDate(value, empty = "未设截止时间") {
  if (!value || Number(value) === 0) return empty;
  const d = new Date(typeof value === "number" ? value : value);
  return isNaN(d)
    ? String(value)
    : d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) +
        " " +
        d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
function studioDrawer(title, content) {
  dialog(title, content);
  $("#modal").classList.add("inspector");
  $("#modal").addEventListener(
    "close",
    () => $("#modal").classList.remove("inspector"),
    { once: true },
  );
}
function studioInit() {
  document.querySelectorAll("[data-nav]").forEach((b) => {
    const label = b.querySelector("span");
    b.replaceChildren(studioIcon(b.dataset.nav), label);
  });
  const foot = el("div", { class: "release-link" }, [
    btn("v" + boot.version + " · 版本与回退", studioVersions),
  ]);
  $(".sidebar-foot").append(foot);
}
function studioVersions() {
  studioDrawer(
    "版本与回退",
    el("div", { class: "version-info" }, [
      el("div", { class: "release-current" }, [
        el("span", { text: "当前工作台" }),
        el("strong", { text: "v" + boot.version }),
      ]),
      el("h3", { text: "每次更新，都有来路" }),
      el("p", {
        text: "版本号对应固定源码、安装包与 SHA-256 校验文件。回退只替换程序核心，保留 AI 表格绑定、记忆空间和去重回执。",
      }),
      el("a", {
        href: "https://github.com/BetterZflyee/nianlun/releases",
        target: "_blank",
        rel: "noopener",
        class: "primary-link",
        text: "查看 GitHub 全部版本 ↗",
      }),
      el("a", {
        href: "https://github.com/BetterZflyee/nianlun/releases/tag/v2.2.0",
        target: "_blank",
        rel: "noopener",
        text: "2.2.0 · 界面改版前的回退版本 ↗",
      }),
      btn("退出本机服务以切换版本", (e) =>
        quiet(
          withButton(e.currentTarget, async () => {
            await api("/api/shutdown", {});
            $("#connection").textContent = "本机服务已退出";
            $("#dialog-content").replaceChildren(
              el("h3", { text: "已安全退出本机服务" }),
              el("p", {
                text: "现在可以运行目标版本的安装器，然后通过“打开年轮”启动。绑定、记忆与执行回执均保留。",
              }),
            );
          }),
        ),
      ),
      el("ol", {}, [
        el("li", { text: "确认没有正在执行的写入任务，保持自生长暂停。" }),
        el("li", { text: "退出年轮本机服务，下载目标版本，核对 SHA-256。" }),
        el("li", { text: "运行目标版本安装器；使用原来的绑定与记忆目录。" }),
        el("li", {
          text: "重新打开工作台，核对版本和连接。不要删除运行回执。",
        }),
      ]),
    ]),
  );
}

function compactRelations(project) {
  const roles = ["records", "milestones", "sites"],
    rows = Object.fromEntries(
      roles.map((r) => [
        r,
        data[r].filter((x) => x.project_ids?.includes(project.id)),
      ]),
    );
  const count = rows.records.filter(
    (r) => r.milestone_ids?.length || r.site_ids?.length,
  ).length;
  const panel = el("section", {
    class: "relation-strip",
    "aria-label": "项目关联概览",
  });
  const intro = el("div", { class: "relation-intro" }, [
    studioIcon("link"),
    el("div", {}, [
      el("strong", { text: "项目关联" }),
      el("small", { text: count + " 条记录已有连接" }),
    ]),
  ]);
  panel.append(
    intro,
    ...roles.map((role) =>
      btn(
        roleNames[role] + "  " + rows[role].length,
        () => {
          tab = role;
          renderProject($("#content"));
        },
        "relation-pill",
      ),
    ),
    btn("探索关系 ↗", () => openRelations(project, rows), "relation-open"),
  );
  return panel;
}
async function openRelations(project, rows) {
  try {
    const { createRelationView } = await import("./relations.js");
    // Include explicitly referenced targets even when they belong to another project.
    const resolved = { ...rows };
    for (const role of ["milestones", "sites"]) {
      const field = role === "milestones" ? "milestone_ids" : "site_ids";
      const ids = new Set(rows.records.flatMap((row) => row[field] || []));
      resolved[role] = [
        ...new Map(
          [
            ...rows[role],
            ...(data[role] || []).filter((row) => ids.has(row.id)),
          ].map((row) => [row.id, row]),
        ).values(),
      ];
    }
    const modal = $("#modal");
    let view;
    const cleanup = () => {
      view?.destroy();
      modal.classList.remove("relations-dialog");
      modal.removeEventListener("close", cleanup);
    };
    view = createRelationView({
      project,
      rows: resolved,
      el,
      btn,
      badge,
      roleNames,
      label: projectLabel,
      initialOrder: boot.settings?.relation_order,
      onOrderChange: async (order) => {
        const saved = await api("/api/view-preferences", {
          relation_order: order,
        });
        boot.settings = {
          ...boot.settings,
          relation_order: saved.relation_order,
        };
      },
      edit: (role, row) => {
        cleanup();
        editRow(role, row);
      },
    });
    dialog("探索项目关系", view.root);
    modal.classList.add("relations-dialog");
    modal.addEventListener("close", cleanup, { once: true });
    view.mount();
  } catch (error) {
    toast("项目关系图未能打开：" + error.message);
  }
}

async function renderTodos23(root, generation) {
  let completed = false,
    rows = [],
    visible = [],
    chosen = new Set(),
    focus = null,
    seq = 0,
    loadSeq = 0;
  const detailsCache = new Map();
  const search = el("input", {
      type: "search",
      placeholder: "搜索待办",
      "aria-label": "搜索待办",
    }),
    scope = select([
      ["all", "全部项目"],
      ["unlinked", "未匹配项目"],
      ...data.projects.map((p) => [p.id, p.title]),
    ]),
    priority = select([
      ["all", "全部优先级"],
      ["40", "紧急"],
      ["30", "高"],
      ["20", "普通"],
      ["10", "低"],
    ]);
  const rail = el("aside", { class: "filter-rail" }),
    list = el("div", { class: "todo-list23" }),
    inspector = el("aside", { class: "todo-inspector" }),
    count = el("span"),
    statusbar = el("div", { class: "selection-bar" }),
    stats = el("div", { class: "mini-stats" }),
    all = el("input", { type: "checkbox", "aria-label": "选择当前筛选待办" });
  const done = (items) =>
    bulkDialog(
      "完成 " + items.length + " 项待办",
      items.map((t) => ({
        op: "complete_todo",
        task_id: t.id,
        title: t.title,
      })),
      () => {
        chosen.clear();
        load();
      },
    );
  const batch = btn(
    "完成所选",
    () => done(rows.filter((t) => chosen.has(t.id))),
    "primary",
  );
  statusbar.append(
    el("label", { class: "check" }, [all, count]),
    el("div", { class: "actions" }, [
      btn("清空", () => {
        chosen.clear();
        draw();
      }),
      batch,
    ]),
  );
  root.replaceChildren(
    studioHead("我的待办", "把注意力留给重要的下一步。", [
      btn("+ 新建待办", todoDialog, "primary"),
    ]),
    stats,
    el("div", { class: "todo-workspace" }, [
      rail,
      el("section", { class: "todo-main" }, [
        el("div", { class: "list-tools" }, [search, priority]),
        statusbar,
        list,
      ]),
      inspector,
    ]),
  );
  function updateSelection() {
    count.textContent = "已选 " + chosen.size + " / " + visible.length + " 项";
    all.checked = visible.length > 0 && visible.every((t) => chosen.has(t.id));
    all.indeterminate = chosen.size > 0 && !all.checked;
    batch.disabled = !chosen.size;
    statusbar.hidden = completed;
  }
  all.onchange = () => {
    if (all.checked) visible.slice(0, 100).forEach((t) => chosen.add(t.id));
    else visible.forEach((t) => chosen.delete(t.id));
    draw();
  };
  function projectName(t) {
    return (
      data.projects.find((p) => p.id === t.link?.project_id)?.title ||
      "未匹配项目"
    );
  }
  async function open(t) {
    focus = t.id;
    draw();
    const turn = ++seq;
    inspector.replaceChildren(
      el("div", { class: "inspector-kicker", text: "待办详情" }),
      el("h2", { text: t.title }),
      el("p", { class: "subtle", text: "正在从丰声读取完整详情…" }),
    );
    try {
      const detail =
        detailsCache.get(t.id) ||
        (await run("todo_detail", { task_id: t.id, completed })).value;
      if (turn !== seq || generation !== viewVersion) return;
      detailsCache.set(t.id, detail);
      const meta = el("dl", { class: "detail-properties" });
      for (const [k, v] of [
        ["关联项目", projectName(t)],
        ["截止时间", studioDate(detail.due)],
        [
          "优先级",
          { 10: "低", 20: "普通", 30: "高", 40: "紧急" }[detail.priority] ||
            "未设置",
        ],
        ["创建人", detail.creator],
        ["执行人", detail.executors?.join("、") || "未提供"],
        ["参与人", detail.participants?.join("、") || "未提供"],
        ["创建时间", studioDate(detail.created, "未提供时间")],
      ])
        meta.append(el("dt", { text: k }), el("dd", { text: v }));
      const actions = el("div", { class: "actions" }, [
        detail.completed
          ? badge("已完成")
          : btn("标记完成", () => done([t]), "primary"),
      ]);
      inspector.replaceChildren(
        el("div", { class: "inspector-kicker", text: "待办详情 · 丰声 / DWS" }),
        el("h2", { text: detail.title }),
        actions,
        meta,
        el("h3", { text: "详细内容" }),
        el("p", {
          class: "todo-description",
          text:
            detail.description || "这项待办尚未填写正文。完整要求见上方标题。",
        }),
      );
      if (t.link?.inferred_from)
        inspector.append(
          el("p", {
            class: "form-help",
            text: "项目按标题中的括号名称匹配；不会据此自动关闭项目记录。",
          }),
        );
      for (const url of detail.links || [])
        inspector.append(
          el("a", {
            href: url,
            target: "_blank",
            rel: "noopener",
            class: "source-link",
            text: "打开原始待办 ↗",
          }),
        );
      if (detail.activities?.length) {
        inspector.append(el("h3", { text: "活动记录" }));
        detail.activities.forEach((a) =>
          inspector.append(
            el("div", { class: "activity-item" }, [
              el("span", { class: "activity-dot" }),
              el("p", { text: a.comment || a.action || "待办状态发生变化" }),
            ]),
          ),
        );
      }
      if (detail.attachments?.length)
        inspector.append(
          el("h3", { text: "附件" }),
          ...detail.attachments.map((a) =>
            el("p", { text: a.name + " · 请在原始待办中打开" }),
          ),
        );
    } catch (e) {
      if (turn === seq)
        inspector.append(
          el("p", { class: "form-error", text: e.message }),
          btn("重试详情", () => open(t)),
        );
    }
  }
  function draw() {
    const q = search.value.trim().toLowerCase();
    visible = rows.filter(
      (t) =>
        t.title.toLowerCase().includes(q) &&
        (scope.value === "all" ||
          (scope.value === "unlinked"
            ? !t.link
            : t.link?.project_id === scope.value)) &&
        (priority.value === "all" || String(t.priority) === priority.value),
    );
    visible.sort(
      (a, b) =>
        (b.priority || 20) - (a.priority || 20) ||
        (a.due || Infinity) - (b.due || Infinity),
    );
    list.replaceChildren();
    updateSelection();
    for (const t of visible) {
      const check = el("input", {
        type: "checkbox",
        checked: chosen.has(t.id),
        "aria-label": "选择 " + t.title,
        onchange: (e) => {
          if (e.target.checked && chosen.size >= 100) {
            e.target.checked = false;
            toast("每次最多处理 100 项");
            return;
          }
          e.target.checked ? chosen.add(t.id) : chosen.delete(t.id);
          updateSelection();
        },
      });
      check.hidden = completed;
      const due =
        Number(t.due) > 0 ? studioDate(t.due).split(" ")[0] : "无截止日期";
      const row = el(
        "article",
        { class: "todo-item" + (focus === t.id ? " selected" : "") },
        [
          check,
          el(
            "button",
            {
              class: "todo-open",
              onclick: () => open(t),
              "aria-label": "查看待办 " + t.title,
            },
            [
              el("strong", { text: t.title }),
              el("small", { text: projectName(t) }),
            ],
          ),
          el("div", { class: "todo-side" }, [
            el("span", {
              class: "priority-dot p" + (t.priority || 20),
              title:
                { 40: "紧急", 30: "高", 20: "普通", 10: "低" }[t.priority] ||
                "普通",
            }),
            el("small", {
              class:
                Number(t.due) > 0 && t.due < Date.now() && !completed
                  ? "overdue"
                  : "",
              text: due,
            }),
          ]),
        ],
      );
      list.append(row);
    }
    if (!visible.length)
      list.append(
        studioEmpty("这里已清空", "更换筛选条件，或创建下一项行动。"),
      );
  }
  async function load() {
    const current = ++loadSeq;
    loading(list, "正在同步丰声待办…");
    try {
      const result = (await run("todos", { completed })).value;
      if (generation !== viewVersion || current !== loadSeq) return;
      rows = result.todos;
      detailsCache.clear();
      if (focus && !rows.some((t) => t.id === focus)) {
        focus = null;
        seq++;
        inspector.replaceChildren(
          studioEmpty(
            "待办状态已更新",
            "在列表中选择其他待办，或切换到已完成查看回执。",
          ),
        );
      }
      stats.replaceChildren(
        ...[
          [completed ? "已完成" : "未完成", rows.length],
          ["已匹配项目", rows.filter((t) => t.link).length],
          ["紧急 / 高优先级", rows.filter((t) => t.priority >= 30).length],
        ].map(([t, v]) =>
          el("div", {}, [el("strong", { text: v }), el("span", { text: t })]),
        ),
      );
      draw();
    } catch (e) {
      list.replaceChildren(
        studioEmpty("待办同步未完成", e.message),
        btn("重试同步", load),
      );
    }
  }
  rail.append(el("div", { class: "rail-title", text: "任务视图" }));
  const tabs = [];
  for (const [label, value] of [
    ["待处理", false],
    ["已完成", true],
  ]) {
    const b = btn(
      label,
      () => {
        completed = value;
        chosen.clear();
        focus = null;
        seq++;
        inspector.replaceChildren(
          studioEmpty("选择一项待办", "在这里查看完整要求、执行人和活动记录。"),
        );
        tabs.forEach((x) => x.classList.toggle("active", x === b));
        load();
      },
      value ? "" : "active",
    );
    tabs.push(b);
    rail.append(b);
  }
  rail.append(
    el("div", { class: "rail-title", text: "项目范围" }),
    scope,
    el("p", {
      class: "form-help",
      text: "支持按项目批量处理。每次最多选择 100 项，提交前会列明数量。",
    }),
  );
  search.oninput = priority.onchange = scope.onchange = draw;
  inspector.append(
    studioEmpty("选择一项待办", "在这里查看完整要求、执行人和活动记录。"),
  );
  await load();
}

let memoryViewCleanup = () => {};
async function renderMemory23(root, generation) {
  const model = await import("./galaxy-model.js");
  if (generation !== viewVersion) return;
  // A late workspace snapshot must not change group IDs during link hydration.
  const memoryProjects = (data?.projects || []).map(({ id, title }) => ({
    id,
    title,
  }));
  let pages = [],
    offset = 0,
    group = "all",
    graph = null,
    selectedKey = null,
    readSeq = 0,
    hasMore = false,
    disposed = false;
  let preloading = true,
    catalogBusy = false;
  let loadingLinks = false,
    stopLinks = false,
    attempted = new Set(),
    fullGraph = { nodes: [], edges: [], groups: [] },
    drawSeq = 0;
  const search = el("input", {
    type: "search",
    placeholder: "查找记忆，飞近一颗星…",
    "aria-label": "查找星图记忆",
  });
  const results = el("div", { class: "galaxy-search-results" });
  results.hidden = true;
  const searchBox = el("div", { class: "galaxy-search" }, [
    studioIcon("search"),
    search,
    results,
  ]);
  const stage = el("div", { class: "constellation-stage", "aria-live": "off" });
  const status = el("span", { class: "graph-status" }),
    linkStatus = el("span", { class: "galaxy-link-status", role: "status" });
  const detail = el("aside", {
    class: "memory-inspector galaxy-inspector",
    "aria-label": "记忆正文",
  });
  detail.hidden = true;
  const rail = el("div", { class: "galaxy-groups" }),
    nodeList = el("div", { class: "memory-node-list" });
  nodeList.hidden = true;
  const more = btn("加载更多记忆", () => load(offset));
  const pause = btn("暂停漫游", () => {
    motion = !motion;
    graph?.setMotion(motion);
  });
  let motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const depth = select(
    [
      ["1", "一层引用"],
      ["2", "两层引用"],
    ],
    "1",
  );
  depth.setAttribute("aria-label", "关联聚焦范围");
  depth.onchange = () => graph?.setDepth(Number(depth.value));
  const style = select(
    [
      ["galaxy", "立体星系"],
      ["disc", "舒展星盘"],
    ],
    "galaxy",
  );
  style.setAttribute("aria-label", "星图布局");
  style.onchange = () => graph?.setMode(style.value);
  const nodeToggle = btn("记忆目录", () => {
    nodeList.hidden = !nodeList.hidden;
    nodeToggle.setAttribute("aria-expanded", String(!nodeList.hidden));
  });
  const indexButton = el("button", { type: "button", text: "暂停读取" });
  const controls = el("details", { class: "galaxy-controls", open: true }, [
    el("summary", { text: "探索星图" }),
    el("div", { class: "galaxy-control-body" }, [
      el("div", { class: "galaxy-settings" }, [
        formField("空间布局", style),
        formField("点击后聚焦", depth),
      ]),
      el("div", { class: "galaxy-actions" }, [pause, btn("返回全景", clear)]),
      el("p", { class: "galaxy-rail-label", text: "颜色分组" }),
      rail,
      more,
      el("p", {
        class: "galaxy-source-hint",
        text: "项目按标题匹配，其余按记忆目录聚类。颜色表示分组，连线只表示真实引用。",
      }),
    ]),
  ]);
  const expand = btn("展开星图", () => {
    studio.classList.toggle("expanded");
    expand.textContent = studio.classList.contains("expanded")
      ? "收起星图"
      : "展开星图";
  });
  const card = el("section", { class: "constellation-card galaxy-card" }, [
    el("div", { class: "graph-toolbar" }, [
      el("div", {}, [el("strong", { text: "记忆星图" }), status]),
      el("div", { class: "actions" }, [nodeToggle, expand]),
    ]),
    stage,
    controls,
    el("div", { class: "galaxy-zoom" }, [
      btn("+", () => graph?.zoom(0.8)),
      btn("−", () => graph?.zoom(1.25)),
    ]),
    el("div", { class: "galaxy-bottom" }, [
      el("div", { class: "galaxy-index" }, [linkStatus, indexButton]),
      el("div", {
        class: "galaxy-help",
        text: "拖动旋转 · Shift / 右键拖动平移 · 滚轮缩放 · 点击飞近阅读 · Esc 返回全景",
      }),
    ]),
    nodeList,
  ]);
  const studio = el("div", { class: "memory-studio galaxy-studio" }, [
    card,
    detail,
  ]);
  root.replaceChildren(
    studioHead("项目记忆", "让积累成为星系，沿着关联找到下一条线索。", [
      btn("刷新目录", () => navigate("memory")),
    ]),
    el("div", { class: "galaxy-searchbar" }, [
      searchBox,
      btn("全文检索", () => quiet(fullSearch())),
    ]),
    studio,
  );
  const closeExpanded = (e) => {
    if (e.key === "Escape" && studio.classList.contains("expanded")) {
      studio.classList.remove("expanded");
      expand.textContent = "展开星图";
    }
  };
  document.addEventListener("keydown", closeExpanded);
  memoryViewCleanup = () => {
    disposed = true;
    stopLinks = true;
    readSeq++;
    drawSeq++;
    graph?.destroy();
    document.removeEventListener("keydown", closeExpanded);
  };
  function active() {
    return !disposed && generation === viewVersion;
  }
  function clear() {
    selectedKey = null;
    detail.hidden = true;
    graph?.reset();
  }
  function syncGraph() {
    fullGraph = model.buildGraph(pages, memoryProjects);
  }
  function visibleGraph() {
    const nodes = (
        group === "all"
          ? fullGraph.nodes
          : fullGraph.nodes.filter((n) => n.group === group)
      ).slice(0, 1500),
      ids = new Set(nodes.map((n) => n.id));
    return {
      nodes,
      edges: fullGraph.edges.filter(
        (e) => ids.has(e.source) && ids.has(e.target),
      ),
      groups: fullGraph.groups,
    };
  }
  function counts() {
    const visible = visibleGraph();
    status.textContent =
      `${visible.nodes.length} 篇记忆 · ${visible.edges.length} 条已读取引用` +
      (hasMore ? " · 目录可继续加载" : "");
  }
  function drawRail() {
    rail.replaceChildren();
    const options = [
      { id: "all", title: "全部记忆", color: "#dce9df" },
      ...fullGraph.groups,
    ];
    for (const g of options) {
      const count =
        g.id === "all"
          ? pages.length
          : fullGraph.nodes.filter((n) => n.group === g.id).length;
      const b = btn(
        "",
        () => {
          group = g.id;
          selectedKey = null;
          detail.hidden = true;
          drawRail();
          quiet(draw());
        },
        group === g.id ? "active" : "",
      );
      const dot = el("i", { class: "galaxy-swatch" });
      dot.style.backgroundColor = g.color;
      b.append(
        dot,
        el("span", { text: g.title }),
        el("small", { text: count }),
      );
      b.setAttribute("aria-pressed", String(group === g.id));
      b.title = g.basis || "所有已载入记忆";
      rail.append(b);
    }
    more.hidden = !hasMore;
    more.disabled = preloading || pages.length >= 1500;
    more.textContent = preloading
      ? "正在展开记忆目录…"
      : pages.length >= 1500
        ? "已达 1500 篇展示上限"
        : "加载更多记忆";
  }
  async function draw() {
    const turn = ++drawSeq;
    syncGraph();
    counts();
    const visual = visibleGraph();
    nodeList.replaceChildren(
      el("div", { class: "galaxy-list-head" }, [
        el("strong", { text: "已载入的记忆" }),
        btn("关闭目录", () => {
          nodeList.hidden = true;
          nodeToggle.setAttribute("aria-expanded", "false");
        }),
      ]),
      ...visual.nodes.map((p) =>
        btn(p.title, () => open(p), "memory-list-node"),
      ),
    );
    if (!visual.nodes.length) {
      graph?.destroy();
      graph = null;
      stage.replaceChildren(
        studioEmpty(
          "还没有记忆页面",
          "连接或写入自己的独立记忆空间后，已有页面会出现在这里。",
        ),
      );
      return;
    }
    try {
      const module = await import("./constellation.js");
      if (!active() || turn !== drawSeq) return;
      if (graph) graph.update(visual);
      else {
        stage.replaceChildren();
        graph = module.mount(stage, {
          ...visual,
          onSelect: (id) => {
            const p = pages.find((p) => model.keyFor(p) === id);
            if (p) quiet(open(p));
          },
          onClear: () => {
            selectedKey = null;
            detail.hidden = true;
          },
          onMotion: (value) => {
            motion = value;
            pause.textContent = value ? "暂停漫游" : "开启漫游";
            pause.setAttribute("aria-pressed", String(value));
          },
          onFallback: () => {
            pause.disabled = true;
            style.disabled = true;
          },
        });
      }
      graph.setDepth(Number(depth.value));
      graph.setMotion(motion);
      if (style.value !== "galaxy") graph.setMode(style.value);
      if (selectedKey) graph.select(selectedKey, false);
    } catch {
      stage.replaceChildren(
        studioEmpty("星图暂不可用", "可以通过记忆目录继续阅读。"),
      );
      nodeList.hidden = false;
    }
  }
  function paintDetail(p) {
    detail.replaceChildren(
      el("div", { class: "galaxy-detail-head" }, [
        el("span", { class: "inspector-kicker", text: "记忆页面" }),
        btn("×", () => {
          detail.hidden = true;
          graph?.reset();
          selectedKey = null;
        }),
      ]),
      el("h2", { text: p.title }),
    );
    detail.querySelector("button").setAttribute("aria-label", "关闭记忆正文");
    detail.append(
      el("div", { class: "memory-meta" }, [
        badge(p.type || "note"),
        el("small", { text: p.updated || "原始记忆" }),
      ]),
      el("small", { text: p.slug }),
    );
    if (p.text === undefined)
      detail.append(
        el("p", { class: "subtle", text: "读取独立记忆空间正文…" }),
      );
    else
      detail.append(
        el("pre", { class: "memory-body", text: p.text || "此页正文为空。" }),
      );
    if (p.note) detail.append(el("p", { class: "form-help", text: p.note }));
    const id = model.keyFor(p),
      out = fullGraph.edges.filter((e) => e.source === id),
      incoming = fullGraph.edges.filter((e) => e.target === id);
    for (const [title, links, field] of [
      ["引用的记忆", out, "target"],
      ["被这些记忆引用", incoming, "source"],
    ]) {
      if (!links.length) continue;
      detail.append(el("h3", { text: title }));
      for (const e of links) {
        const node = fullGraph.nodes.find((n) => n.id === e[field]);
        if (node)
          detail.append(btn(node.title, () => open(node), "reference-page"));
      }
    }
    const unresolved = (p.references || []).filter(
      (slug) => !pages.some((x) => x.slug === slug),
    );
    if (unresolved.length)
      detail.append(
        el("p", {
          class: "form-help",
          text: `另有 ${unresolved.length} 条正文引用尚未载入目录。可加载更多或全文检索。`,
        }),
      );
    if (p.links_truncated)
      detail.append(
        el("p", {
          class: "form-help",
          text: "此页引用较多，当前仅显示已读取部分。",
        }),
      );
    if (!out.length && !incoming.length)
      detail.append(
        el("p", {
          class: "form-help",
          text: p.links_verified
            ? "在当前已载入页面中，尚无明确引用连线。"
            : "此页引用尚未核验，已显示可读正文。",
        }),
      );
  }
  async function open(page) {
    const current = ++readSeq;
    selectedKey = model.keyFor(page);
    results.hidden = true;
    search.value = "";
    if (
      group !== "all" &&
      fullGraph.nodes.find((n) => n.id === selectedKey)?.group !== group
    ) {
      group = "all";
      drawRail();
      await draw();
    }
    if (!active() || current !== readSeq) return;
    detail.hidden = false;
    graph?.select(selectedKey);
    paintDetail(page);
    try {
      const p =
        page.text !== undefined
          ? page
          : (await run("memory_page", { slug: page.slug, key: page.key }))
              .value;
      if (!active() || current !== readSeq) return;
      const original = pages.find((p) => model.keyFor(p) === selectedKey);
      Object.assign(page, p);
      if (original) Object.assign(original, p);
      syncGraph();
      counts();
      graph?.updateEdges(visibleGraph().edges);
      paintDetail(page);
    } catch (e) {
      if (active() && current === readSeq)
        detail.append(
          el("p", { class: "form-error", text: e.message }),
          btn("重试读取", () => open(page)),
        );
    }
  }
  function updateLinkStatus() {
    const checked = pages.filter((p) => p.links_verified).length,
      failed = pages.filter((p) => p.links_error).length;
    linkStatus.textContent =
      loadingLinks && !stopLinks
        ? `后台读取引用 ${attempted.size} / ${pages.length} · 可继续浏览`
        : stopLinks
          ? `${failed ? "引用读取遇到问题，可重试" : loadingLinks ? "当前批完成后暂停" : "引用读取已暂停"} · 已核验 ${checked} / ${pages.length}`
          : failed
            ? `${checked} 篇已核验 · ${failed} 篇暂未读到引用`
            : `已核验 ${checked} 篇引用索引` +
              (pages.some((p) => p.links_truncated)
                ? " · 部分引用有截断"
                : "") +
              (fullGraph.edges.length ? "" : " · 当前页面之间暂无明确引用");
    indexButton.textContent = stopLinks
      ? failed
        ? "重试并继续"
        : "继续读取"
      : failed && !loadingLinks
        ? "重试未读引用"
        : loadingLinks
          ? "暂停读取"
          : "引用已就绪";
    indexButton.disabled = !loadingLinks && !stopLinks && !failed;
    if (failed && !loadingLinks && !stopLinks)
      indexButton.onclick = () => {
        for (const p of pages.filter((p) => p.links_error)) {
          attempted.delete(model.keyFor(p));
          delete p.links_error;
        }
        quiet(loadLinks());
      };
    else
      indexButton.onclick = () => {
        stopLinks = !stopLinks;
        if (!stopLinks) {
          for (const p of pages.filter((p) => p.links_error)) {
            attempted.delete(model.keyFor(p));
            delete p.links_error;
          }
        }
        updateLinkStatus();
        if (!stopLinks) quiet(loadLinks());
      };
  }
  async function loadLinks() {
    if (loadingLinks || stopLinks || !active()) return;
    loadingLinks = true;
    updateLinkStatus();
    try {
      while (active() && !stopLinks) {
        const batch = pages
          .filter((p) => p.key && !attempted.has(model.keyFor(p)))
          .slice(0, 6);
        if (!batch.length) break;
        try {
          const value = (
            await run("memory_relations", { keys: batch.map((p) => p.key) })
          ).value;
          if (!active()) return;
          for (const p of batch) {
            const found = value.pages.find((x) => x.key === p.key);
            attempted.add(p.key);
            p.links_verified = found?.verified === true;
            if (p.links_verified) {
              p.links = found.links;
              p.links_truncated = found.truncated;
              delete p.links_error;
            } else p.links_error = found?.error || "引用暂未读到";
          }
        } catch (e) {
          if (!active()) return;
          for (const p of batch) {
            attempted.add(p.key);
            p.links_error = e.message;
          }
          stopLinks = true;
        }
        syncGraph();
        counts();
        graph?.updateEdges(visibleGraph().edges);
        const currentPage = pages.find((p) => model.keyFor(p) === selectedKey);
        if (currentPage && currentPage.text !== undefined && !detail.hidden) {
          const top = detail.scrollTop;
          paintDetail(currentPage);
          detail.scrollTop = top;
        }
        updateLinkStatus();
      }
    } finally {
      loadingLinks = false;
      if (active()) {
        updateLinkStatus();
        if (!selectedKey && !stopLinks) graph?.relayout?.();
      }
    }
  }
  async function load(at) {
    if (catalogBusy) return false;
    catalogBusy = true;
    more.disabled = true;
    if (!pages.length) loading(stage, "正在读取自己的记忆目录…");
    try {
      const r = (await run("memory_catalog", { offset: at })).value;
      if (!active()) return;
      const map = new Map(pages.map((p) => [model.keyFor(p), p]));
      for (const p of r.pages)
        if (!map.has(model.keyFor(p))) map.set(model.keyFor(p), p);
      pages = [...map.values()].slice(0, 1500);
      offset = r.next_offset;
      hasMore = r.has_more;
      syncGraph();
      drawRail();
      await draw();
      updateLinkStatus();
      quiet(loadLinks());
      return true;
    } catch (e) {
      if (active())
        stage.replaceChildren(
          studioEmpty("记忆目录未能读取", e.message),
          btn("重试目录", () => load(at)),
        );
    } finally {
      catalogBusy = false;
      more.disabled = preloading || pages.length >= 1500;
    }
  }
  function showResults() {
    const q = search.value.trim().toLowerCase();
    results.replaceChildren();
    results.hidden = !q;
    if (!q) return;
    const matches = fullGraph.nodes
      .filter((n) => (n.title + " " + n.slug).toLowerCase().includes(q))
      .slice(0, 8);
    if (!matches.length)
      results.append(el("p", { text: "已载入目录中暂无匹配，可用全文检索。" }));
    for (const p of matches) results.append(btn(p.title, () => open(p)));
  }
  search.oninput = showResults;
  search.onkeydown = (e) => {
    if (e.key === "Escape") {
      results.hidden = true;
      search.value = "";
    }
    if (e.key === "Enter") {
      const first = results.querySelector("button");
      if (first) {
        e.preventDefault();
        first.click();
      }
    }
  };
  async function fullSearch() {
    if (!search.value.trim()) {
      toast("先输入要检索的关键词");
      return;
    }
    const current = ++readSeq;
    results.hidden = true;
    detail.hidden = false;
    loading(detail, "正在检索记忆全文…");
    try {
      const r = (await run("memory_query", { query: search.value })).value;
      if (!active() || current !== readSeq) return;
      detail.replaceChildren(
        el("div", { class: "galaxy-detail-head" }, [
          el("h3", { text: `全文检索 · ${r.pages.length} 项` }),
          btn("关闭", () => {
            detail.hidden = true;
          }),
        ]),
      );
      if (!r.pages.length)
        detail.append(studioEmpty("暂无匹配", "可以更换简称或关键词。"));
      for (const p of r.pages)
        detail.append(btn(p.title, () => open(p), "reference-page"));
    } catch (e) {
      if (active() && current === readSeq)
        detail.replaceChildren(
          studioEmpty("全文检索未完成", e.message),
          btn("重试", fullSearch),
        );
    }
  }
  await load(0);
  // Preload a bounded metadata overview, not the page bodies, without blocking the visible graph.
  while (active() && hasMore && pages.length < 600)
    if (!(await load(offset))) break;
  preloading = false;
  if (active()) drawRail();
}

function skillCategory(s) {
  const text = (s.name + " " + s.description).toLowerCase();
  return /图|视频|设计|slide|image|video|design|visual|ppt/.test(text)
    ? "创作与表达"
    : /数据|表格|sql|data|sheet|analytics/.test(text)
      ? "数据与分析"
      : /代码|开发|code|git|test|build/.test(text)
        ? "研发与构建"
        : /会议|待办|邮件|项目|工作|meeting|workflow|task|mail/.test(text)
          ? "工作与协作"
          : "通用能力";
}
let workflowSkills23 = [];
async function renderSkills23(root, generation) {
  const catalog = (await run("capabilities")).value;
  if (generation !== viewVersion) return;
  const chosen = new Set(),
    enabled = new Set(catalog.enabled),
    search = el("input", {
      type: "search",
      placeholder: "搜索能力名称或用途",
      "aria-label": "搜索能力",
    }),
    rail = el("aside", { class: "filter-rail" }),
    grid = el("div", { class: "capability-grid" }),
    summary = el("div", { class: "skill-summary" }),
    bar = el("div", { class: "skill-selection" }),
    counter = el("span");
  let category = "all",
    onlyEnabled = false,
    source = "all";
  const addRoot = (e) =>
    quiet(
      withButton(e.currentTarget, async () => {
        const path = (await run("pick_directory")).value.path;
        if (!path) return;
        await run("capability_roots", {
          roots: [...new Set([...catalog.roots, path])],
        });
        navigate("skills");
      }),
    );
  const batch = (on) =>
    quiet(
      (async () => {
        if (!chosen.size) return;
        await run("capability_bulk", { ids: [...chosen], enabled: on });
        chosen.forEach((id) => (on ? enabled.add(id) : enabled.delete(id)));
        draw();
        toast(on ? "所选能力已启用" : "所选能力已停用");
      })(),
    );
  const workflow = () => {
    workflowSkills23 = [...chosen].filter((id) => enabled.has(id));
    if (!workflowSkills23.length) {
      toast("先启用选中的能力");
      return;
    }
    currentWorkflow = null;
    navigate("workflows");
  };
  const sources = select([
    ["all", "全部来源"],
    ...[...new Set(catalog.skills.map((s) => s.root))].map((r) => [
      r,
      r.split(/[\\/]/).filter(Boolean).slice(-2).join("/"),
    ]),
  ]);
  sources.setAttribute("aria-label", "能力来源");
  sources.onchange = () => {
    source = sources.value;
    draw();
  };
  bar.append(
    counter,
    el("div", { class: "actions" }, [
      btn("清空", () => {
        chosen.clear();
        draw();
      }),
      btn("批量启用", () => batch(true)),
      btn("批量停用", () => batch(false)),
      btn("创建工作流 →", workflow, "primary"),
    ]),
  );
  root.replaceChildren(
    studioHead("能力中心", "把自己的方法，接入自己的年轮。", [
      btn("选择 Skill 文件夹", addRoot, "primary"),
    ]),
    summary,
    el("div", { class: "capability-workspace" }, [
      rail,
      el("div", {}, [
        el("div", { class: "list-tools" }, [search, sources]),
        bar,
        grid,
      ]),
    ]),
  );
  function detail(s) {
    const isOn = enabled.has(s.id);
    studioDrawer(
      s.name,
      el("div", { class: "skill-detail" }, [
        el("div", { class: "capability-symbol" }, [studioIcon("skills")]),
        badge(skillCategory(s)),
        el("h2", { text: s.name }),
        el("p", { text: s.description || "本机已安装的能力。" }),
        el("h3", { text: "本机来源" }),
        el("code", { text: s.path }),
        el("div", { class: "actions" }, [
          btn(
            isOn ? "停用能力" : "启用能力",
            (e) =>
              quiet(
                withButton(e.currentTarget, async () => {
                  await run("capability_toggle", { id: s.id, enabled: !isOn });
                  isOn ? enabled.delete(s.id) : enabled.add(s.id);
                  $("#modal").close();
                  draw();
                }),
              ),
            isOn ? "" : "primary",
          ),
          ...(isOn
            ? [
                btn(
                  "创建工作流",
                  () => {
                    workflowSkills23 = [s.id];
                    $("#modal").close();
                    navigate("workflows");
                  },
                  "primary",
                ),
                btn("立即分析", () => skillDialog(s)),
              ]
            : []),
          ...(s.name === "transcript-visual-recap"
            ? [
                btn("设为阶段汇报方法", (e) =>
                  quiet(
                    withButton(e.currentTarget, async () => {
                      await run("report_method", { id: s.id });
                      toast("阶段汇报方法已更新");
                    }),
                  ),
                ),
              ]
            : []),
        ]),
        el("p", {
          class: "form-help",
          text: "启用后可在工作流中组合使用。执行权限仍由你选择的 AI 宿主管理。",
        }),
      ]),
    );
  }
  function drawRail() {
    rail.replaceChildren(el("div", { class: "rail-title", text: "能力集合" }));
    for (const [id, label] of [
      ["all", "全部能力"],
      ["enabled", "已启用"],
      ...[
        "工作与协作",
        "创作与表达",
        "数据与分析",
        "研发与构建",
        "通用能力",
      ].map((x) => [x, x]),
    ]) {
      const active =
        id === "enabled" ? onlyEnabled : !onlyEnabled && category === id;
      rail.append(
        btn(
          label,
          () => {
            onlyEnabled = id === "enabled";
            category = onlyEnabled ? "all" : id;
            drawRail();
            draw();
          },
          active ? "active" : "",
        ),
      );
    }
    const paths = el("textarea", {
      value: catalog.roots.join("\n"),
      rows: 3,
      "aria-label": "手动输入能力目录",
    });
    rail.append(
      el("details", { class: "source-settings" }, [
        el("summary", { text: "管理加载目录" }),
        el("p", {
          class: "form-help",
          text: "优先使用上方文件夹选择器。也可每行填写一个根目录。",
        }),
        paths,
        btn("保存目录", (e) =>
          quiet(
            withButton(e.currentTarget, async () => {
              await run("capability_roots", {
                roots: paths.value
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              });
              navigate("skills");
            }),
          ),
        ),
      ]),
    );
  }
  function draw() {
    summary.replaceChildren(
      el("div", {}, [
        el("strong", { text: catalog.skills.length }),
        el("span", { text: "项本机能力" }),
      ]),
      el("div", {}, [
        el("strong", { text: enabled.size }),
        el("span", { text: "项已启用" }),
      ]),
      el("div", { class: "skill-summary-note" }, [
        studioIcon("folder"),
        el("span", { text: "从本机文件夹加载 · 方法随你迁移" }),
      ]),
    );
    bar.hidden = !chosen.size;
    counter.textContent = "已选 " + chosen.size + " 项";
    const q = search.value.toLowerCase();
    const filtered = catalog.skills.filter(
      (s) =>
        (category === "all" || skillCategory(s) === category) &&
        (!onlyEnabled || enabled.has(s.id)) &&
        (source === "all" || s.root === source) &&
        (s.name + " " + s.description).toLowerCase().includes(q),
    );
    grid.replaceChildren();
    for (const s of filtered) {
      const check = el("input", {
        type: "checkbox",
        checked: chosen.has(s.id),
        "aria-label": "选择能力 " + s.name,
        onchange: (e) => {
          e.target.checked ? chosen.add(s.id) : chosen.delete(s.id);
          bar.hidden = !chosen.size;
          counter.textContent = "已选 " + chosen.size + " 项";
        },
      });
      grid.append(
        el("article", { class: "capability-card" }, [
          el("div", { class: "capability-top" }, [
            el("span", { class: "capability-symbol" }, [
              studioIcon(
                skillCategory(s) === "研发与构建"
                  ? "workflows"
                  : skillCategory(s) === "数据与分析"
                    ? "projects"
                    : "skills",
              ),
            ]),
            check,
          ]),
          el(
            "button",
            {
              class: "capability-open",
              onclick: () => detail(s),
              "aria-label": "查看能力 " + s.name,
            },
            [
              el("h3", { text: s.name }),
              el("p", { text: s.description || "本机能力，查看详细说明。" }),
            ],
          ),
          el("div", { class: "capability-bottom" }, [
            el("small", { text: skillCategory(s) }),
            el("span", {
              class: enabled.has(s.id) ? "enabled-label" : "disabled-label",
              text: enabled.has(s.id) ? "● 已启用" : "未启用",
            }),
          ]),
        ]),
      );
    }
    if (!filtered.length)
      grid.append(
        studioEmpty(
          "没有匹配的能力",
          "切换分类或加载一个包含 SKILL.md 的根目录。",
        ),
      );
  }
  search.oninput = draw;
  drawRail();
  draw();
}

async function renderWorkflows23(root, generation) {
  const catalog = (await run("capabilities")).value;
  if (generation !== viewVersion) return;
  const available = catalog.skills.filter((s) =>
    catalog.enabled.includes(s.id),
  );
  const chosen = new Set(
    workflowSkills23.filter((id) => available.some((s) => s.id === id)),
  );
  if (workflowSkill && available.some((s) => s.id === workflowSkill))
    chosen.add(workflowSkill);
  const project = select(
      [["", "全部项目背景"], ...data.projects.map((p) => [p.id, p.title])],
      selected || "",
    ),
    skillSearch = el("input", {
      placeholder: "查找已启用的能力",
      "aria-label": "查找工作流能力",
    }),
    skillList = el("div", { class: "workflow-skill-list" }),
    question = el("textarea", {
      "aria-label": "工作流要求",
      placeholder: "写下希望完成的工作，以及需要交付的结果…",
      required: true,
    }),
    detail = el("div"),
    history = el("div", { class: "workflow-history" }),
    flow = el("div", { class: "flow-track" }),
    count = el("span"),
    error = el("p", { class: "form-error" }),
    submit = el("button", {
      type: "submit",
      class: "primary",
      text: boot.harness?.embedded_workflow ? "开始执行 →" : "准备宿主接续 →",
    });
  const presets = [
    ["阶段汇报", "梳理阶段进展，说明成果、风险和下一步。"],
    ["项目复盘", "复盘关键决策与结果，输出可复用的经验和改进建议。"],
    ["工作交接", "整理项目现状、未完成事项和依赖，生成一份工作交接文档。"],
  ];
  root.replaceChildren(
    studioHead("工作流", "让方法串起来，让结果留下来。", [
      btn("管理能力", () => navigate("skills")),
    ]),
    el(
      "div",
      { class: "workflow-presets" },
      presets.map(([title, text], i) =>
        btn(
          "",
          () => {
            question.value = text;
            root
              .querySelectorAll(".recipe-card")
              .forEach((b) => b.classList.remove("active"));
            recipes[i]?.classList.add("active");
            question.focus();
          },
          "recipe-card",
        ),
      ),
    ),
  );
  const recipes = root.querySelectorAll(".recipe-card");
  recipes.forEach((b, i) =>
    b.append(
      el("span", { class: "recipe-number", text: "0" + (i + 1) }),
      el("strong", { text: presets[i][0] }),
      el("p", { text: presets[i][1] }),
      studioIcon("arrow"),
    ),
  );
  flow.append(
    ...[
      ["01", "项目背景", "从当前事实开始"],
      ["02", "选择方法", "组合已启用的能力"],
      [
        "03",
        boot.harness?.name || "AI 宿主",
        boot.harness?.embedded_workflow ? "在页面执行" : "到所选宿主接续",
      ],
      ["04", "生成产物", "保留过程与文件"],
    ].map(([n, t, d]) =>
      el("div", { class: "flow-step" }, [
        el("span", { text: n }),
        el("strong", { text: t }),
        el("small", { text: d }),
      ]),
    ),
  );
  const form = el("form", { class: "workflow-builder" }, [
    flow,
    el("div", { class: "workflow-editor" }, [
      el("div", { class: "workflow-inputs" }, [
        formField("项目背景", project),
        el("div", { class: "field-label" }, [
          el("strong", { text: "使用的能力" }),
          count,
        ]),
        skillSearch,
        skillList,
      ]),
      el("div", { class: "workflow-request" }, [
        formField("这次希望完成什么", question),
        el("p", {
          class: "form-help",
          text: boot.harness?.embedded_workflow
            ? "将在本机执行，权限确认会显示在页面。"
            : "当前采用接续模式：生成请求 → 在 " +
              (boot.harness?.name || "所选宿主") +
              " 执行 → 回来查看产物。页面不会假装后台已完成分析。",
        }),
        error,
        el("div", { class: "form-actions" }, [submit]),
      ]),
    ]),
  ]);
  root.append(
    form,
    detail,
    el("div", { class: "section-heading" }, [
      el("h2", { text: "最近的工作流" }),
      btn("全部执行记录", () => navigate("runs")),
    ]),
    history,
  );
  function drawSkills() {
    const q = skillSearch.value.toLowerCase();
    count.textContent = "已选 " + chosen.size;
    skillList.replaceChildren(
      ...available
        .filter((s) => (s.name + " " + s.description).toLowerCase().includes(q))
        .map((s) =>
          el("label", { class: "workflow-skill" }, [
            el("input", {
              type: "checkbox",
              checked: chosen.has(s.id),
              onchange: (e) => {
                e.target.checked ? chosen.add(s.id) : chosen.delete(s.id);
                count.textContent = "已选 " + chosen.size;
              },
            }),
            el("span", { text: s.name }),
          ]),
        ),
    );
    if (!available.length)
      skillList.append(
        el("p", {
          class: "subtle",
          text: "尚未启用能力；可由宿主选择方法，或前往能力中心启用。",
        }),
      );
  }
  skillSearch.oninput = drawSkills;
  drawSkills();
  form.onsubmit = async (e) => {
    e.preventDefault();
    submit.disabled = true;
    error.textContent = "";
    try {
      const response = await api("/api/actions", {
        op: boot.harness?.embedded_workflow ? "workflow" : "workflow_request",
        data: {
          request_id: crypto.randomUUID(),
          question: question.value,
          skill_ids: [...chosen],
          project_id: project.value || null,
        },
      });
      currentWorkflow = response.job_id;
      await showWorkflow(detail, currentWorkflow, generation);
      detail.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    } catch (e) {
      error.textContent = e.message;
    } finally {
      submit.disabled = false;
    }
  };
  const jobs = (await api("/api/jobs")).jobs.filter((j) =>
    ["workflow", "workflow_request"].includes(j.op),
  );
  if (generation !== viewVersion) return;
  jobs
    .slice(0, 8)
    .forEach((j) =>
      history.append(
        jobRow23(j, () => quiet(showWorkflow(detail, j.id, generation))),
      ),
    );
  if (!jobs.length)
    history.append(
      studioEmpty("从一个小任务开始", "执行过程与生成产物，会保存在这里。"),
    );
  if (currentWorkflow) quiet(showWorkflow(detail, currentWorkflow, generation));
}
function uiJobState23(j) {
  return j.op === "workflow_request" && j.status === "succeeded"
    ? "prepared"
    : j.status;
}
function jobRow23(j, open) {
  const label =
    {
      queued: "排队中",
      running: "执行中",
      waiting_harness: "等待宿主",
      succeeded: j.op === "workflow_request" ? "请求已准备" : "已完成",
      failed: "未完成",
      interrupted: "需核验",
    }[j.status] || j.status;
  return el("button", { class: "run-row", onclick: open }, [
    el("span", { class: "run-status-dot " + j.status }),
    el("div", {}, [
      el("strong", {
        text: j.human_request?.slice(0, 80) || jobNames[j.op] || j.op,
      }),
      el("small", { text: j.phase || j.error || j.id.slice(0, 12) }),
    ]),
    el("span", { class: "run-state " + j.status, text: label }),
    el("time", { text: studioDate(j.created_at) }),
    studioIcon("arrow"),
  ]);
}
async function renderRuns23(root, generation) {
  const reads = new Set([
    "snapshot",
    "todos",
    "todo_detail",
    "memory_catalog",
    "memory_relations",
    "memory_page",
    "memory_query",
    "memory_project",
    "setup_probe",
    "profiles",
    "inspect",
    "harness_status",
    "capabilities",
    "scheduler_request",
    "growth_status",
    "group_search",
    "mailboxes",
    "recovery_status",
    "cdbi_status",
    "cdbi_datasets",
    "cdbi_fields",
    "cdbi_preview",
  ]);
  const { jobs } = await api("/api/jobs");
  if (generation !== viewVersion) return;
  const rows = jobs.filter((j) => !reads.has(j.op)),
    filter = select([
      ["all", "全部类型"],
      ["grow", "采集与生长"],
      ["report", "阶段汇报"],
      ["mutate", "项目与待办"],
      ["ask", "AI 分析"],
      ["workflow", "工作流"],
    ]),
    state = select([
      ["all", "全部状态"],
      ["waiting_harness", "等待宿主"],
      ["prepared", "接续材料已准备"],
      ["running", "执行中"],
      ["succeeded", "已完成"],
      ["failed", "未完成"],
    ]),
    search = el("input", {
      type: "search",
      placeholder: "搜索任务或状态信息",
      "aria-label": "搜索执行记录",
    }),
    list = el("div", { class: "run-list" });
  root.replaceChildren(
    studioHead("执行记录", "每一次行动，都有明确的状态与回执。", [
      btn("运行状态与待完成步骤", () => navigate("setup")),
    ]),
    el(
      "div",
      { class: "run-summary" },
      [
        [
          "等待接续",
          rows.filter((j) =>
            ["waiting_harness", "prepared"].includes(uiJobState23(j)),
          ).length,
        ],
        [
          "正在执行",
          rows.filter((j) => ["running", "queued"].includes(j.status)).length,
        ],
        ["已完成", rows.filter((j) => uiJobState23(j) === "succeeded").length],
        [
          "需要处理",
          rows.filter((j) => ["failed", "interrupted"].includes(j.status))
            .length,
        ],
      ].map(([t, v]) =>
        el("div", {}, [el("span", { text: t }), el("strong", { text: v })]),
      ),
    ),
    el("div", { class: "list-tools" }, [search, filter, state]),
    list,
  );
  function draw() {
    const q = search.value.toLowerCase();
    const shown = rows.filter(
      (j) =>
        (filter.value === "all" || j.op.includes(filter.value)) &&
        (state.value === "all" || uiJobState23(j) === state.value) &&
        JSON.stringify([
          j.op,
          jobNames[j.op],
          j.phase,
          j.error,
          j.human_request,
        ])
          .toLowerCase()
          .includes(q),
    );
    list.replaceChildren(
      ...shown.map((j) =>
        jobRow23(j, async () => {
          const full = await api("/api/jobs/" + j.id);
          const panel = taskPanel(full);
          const raw = el("details", {}, [
            el("summary", { text: "查看原始回执" }),
            el("pre", {
              text: JSON.stringify(
                full.result || { error: full.error },
                null,
                2,
              ),
            }),
          ]);
          studioDrawer(jobNames[j.op] || j.op, el("div", {}, [panel, raw]));
        }),
      ),
    );
    if (!shown.length)
      list.append(
        studioEmpty("没有匹配的执行记录", "切换筛选条件，或在工作台发起任务。"),
      );
  }
  search.oninput = filter.onchange = state.onchange = draw;
  draw();
}
