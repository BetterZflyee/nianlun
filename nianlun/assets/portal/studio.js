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
  const insights = await import("./insight-data.js");
  if (generation !== viewVersion) return;
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
  const landscape = insightPanel({
    title: "行动分布",
    description:
      "按已匹配项目聚合当前待办。节点大小对应数量，点击即可筛选列表。",
    onSelect(id) {
      scope.value = id;
      draw();
    },
  });
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
    landscape.root,
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
    landscape.update({
      ...insights.todoLandscape(rows, data.projects),
      selectedId: scope.value === "all" ? null : scope.value,
    });
    const q = search.value.trim().toLowerCase();
    visible = rows.filter(
      (t) =>
        t.title.toLowerCase().includes(q) &&
        (scope.value === "all" ||
          (scope.value === "unlinked"
            ? !data.projects.some((p) => p.id === t.link?.project_id)
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
    count = el("span"),
    error = el("p", { class: "form-error" }),
    submit = el("button", {
      type: "submit",
      class: "primary",
      text: boot.harness?.provider === "deepseek" ? "交给 DeepSeek 执行 →" : boot.harness?.embedded_workflow ? "开始执行 →" : "准备宿主接续 →",
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
  const selectionSummary = el("div", {
    class: "workflow-selection-summary",
    "aria-live": "polite",
  });
  const form = el("form", { class: "workflow-builder" }, [
    selectionSummary,
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
          text: boot.harness?.provider === "deepseek"
            ? "DeepSeek 自动结合项目资料、相关记忆和所选方法，生成分析、复盘、交接或文档。结果在这里查看和下载；关闭页面仍会继续。对外发送、修改业务数据请使用对应操作入口。"
            : boot.harness?.embedded_workflow
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
  function updateSelectionSummary() {
    const title =
      data.projects.find((p) => p.id === project.value)?.title ||
      "全部项目背景";
    const selectedNames = available
      .filter((s) => chosen.has(s.id))
      .map((s) => s.name);
    selectionSummary.replaceChildren(
      el("span", { text: "本次组合" }),
      el("strong", { text: title }),
      ...selectedNames
        .slice(0, 4)
        .map((name) => el("span", { class: "selection-chip", text: name })),
      ...(selectedNames.length > 4
        ? [el("span", { text: "另 " + (selectedNames.length - 4) + " 项能力" })]
        : []),
      el("small", { text: "交给 " + (boot.harness?.name || "所选 AI 宿主") }),
    );
  }
  project.onchange = updateSelectionSummary;
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
                updateSelectionSummary();
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
  updateSelectionSummary();
  let submittedContent = "", submittedId = "";
  form.onsubmit = async (e) => {
    e.preventDefault();
    submit.disabled = true;
    error.textContent = "";
    try {
      const input = {question: question.value, skill_ids: [...chosen], project_id: project.value || null};
      const contentKey = JSON.stringify(input);
      if (contentKey !== submittedContent) {
        submittedContent = contentKey;
        submittedId = crypto.randomUUID();
      }
      const response = await api("/api/actions", {
        op: boot.harness?.embedded_workflow ? "workflow" : "workflow_request",
        data: {
          request_id: submittedId,
          ...input,
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
  async function openJob(j) {
    const full = await api("/api/jobs/" + j.id);
    if (generation !== viewVersion) return;
    const raw = el("details", {}, [
      el("summary", { text: "查看原始回执" }),
      el("pre", {
        text: JSON.stringify(full.result || { error: full.error }, null, 2),
      }),
    ]);
    studioDrawer(jobNames[j.op] || j.op, el("div", {}, [taskPanel(full), raw]));
  }
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
      ...shown.map((j) => jobRow23(j, () => quiet(openJob(j)))),
    );
    if (!shown.length)
      list.append(
        studioEmpty("没有匹配的执行记录", "切换筛选条件，或在工作台发起任务。"),
      );
  }
  search.oninput = filter.onchange = state.onchange = draw;
  draw();
}
