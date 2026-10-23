/* A spatial overview of real projects; conventional controls remain available. */
let growthOverviewCleanup = () => {};
let growthOverviewGeneration = 0;
const growthViewState = {
  query: "",
  filter: "all",
  layout: "cards",
  paused: false,
};
try {
  if (localStorage.getItem("nianlun.project-layout") === "list")
    growthViewState.layout = "list";
} catch (_) {
  /* Storage can be unavailable without blocking project access. */
}

function cleanupGrowthOverview() {
  growthOverviewGeneration++;
  growthOverviewCleanup();
  growthOverviewCleanup = () => {};
}
function growthRecordOpen(row) {
  return !["已解决", "已关闭", "已完成", "已取消"].includes(row.status);
}
function growthMilestoneOpen(row) {
  return !["已完成", "已取消", "已关闭"].includes(row.status);
}
function renderGrowthProjects(root) {
  cleanupGrowthOverview();
  const generation = growthOverviewGeneration;
  let scene = null;
  const openProject = (id) => {
    if (!data.projects.some((p) => p.id === id)) return;
    selected = id;
    renderProject(root);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const byProject = new Map(
    data.projects.map((p) => [
      p.id,
      {
        records: [],
        milestones: [],
        sites: [],
      },
    ]),
  );
  for (const role of ["records", "milestones", "sites"])
    for (const row of data[role])
      for (const id of new Set(row.project_ids || []))
        byProject.get(id)?.[role].push(row);
  const active = data.projects.filter((p) => p.active === true);
  const relatedToCurrentProject = (r) =>
    r.project_ids?.some((id) => byProject.has(id));
  const openRecords = data.records.filter(
    (r) => relatedToCurrentProject(r) && growthRecordOpen(r),
  );
  const pendingMilestones = data.milestones.filter(
    (m) => relatedToCurrentProject(m) && growthMilestoneOpen(m),
  );
  const stage = el("div", {
    class: "growth-stage",
    "aria-label": "三维项目概览",
  });
  const sceneCaption = el("span", {
    text: "正在准备项目全景…",
    role: "status",
  });
  const pause = btn(growthViewState.paused ? "播放动效" : "暂停动效", () => {
    growthViewState.paused = !growthViewState.paused;
    scene?.setPaused(growthViewState.paused);
    pause.textContent = growthViewState.paused ? "播放动效" : "暂停动效";
    pause.setAttribute("aria-pressed", String(growthViewState.paused));
  });
  pause.setAttribute("aria-pressed", String(growthViewState.paused));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotionControl = () => {
    pause.disabled = reduced.matches;
    pause.textContent = reduced.matches
      ? "静态视图"
      : growthViewState.paused
        ? "播放动效"
        : "暂停动效";
    pause.title = reduced.matches
      ? "遵循系统的减少动态效果设置；仍可手动旋转"
      : "仅控制概览动效，不影响任务运行";
  };
  reduced.addEventListener("change", syncMotionControl);
  syncMotionControl();
  const scheduler = boot.scheduler || {};
  const statusText = scheduler.active
    ? "自动生长已开启"
    : scheduler.status === "paused"
      ? "自动生长已暂停"
      : "自动生长待接入";
  const hero = el(
    "section",
    { class: "growth-overview", "aria-label": "工作空间概览" },
    [
      el("div", { class: "growth-copy" }, [
        el("div", { class: "growth-eyebrow", text: "年轮 · 你的工作空间" }),
        el("h1", { class: "growth-title", text: "你只管往前，\n让它自己长。" }),
        el("p", {
          class: "growth-summary",
          text: "项目的每一次推进，都成为下一步的积累。\n从一个项目出发，看见变化，继续向前。",
        }),
        el("div", { class: "growth-actions" }, [
          btn("让年轮生长一次", () => growthDialog(), "primary"),
          btn("＋ 新建项目", () => editRow("projects")),
        ]),
        btn(
          statusText + " · 查看运行设置 ↗",
          () => navigate("setup"),
          "growth-status",
        ),
      ]),
      el("div", { class: "growth-visual" }, [
        stage,
        el("div", { class: "growth-scene-tools" }, [
          pause,
          btn("复位视角", () => scene?.reset()),
        ]),
        el("div", { class: "growth-scene-caption" }, [sceneCaption]),
      ]),
    ],
  );
  const search = el("input", {
    class: "search",
    type: "search",
    value: growthViewState.query,
    placeholder: "搜索项目、目标或项目编码",
    "aria-label": "搜索项目",
  });
  const filter = select(
    [
      ["all", "全部项目"],
      ["active", "活跃项目"],
      ["done", "已完成"],
      ["records", "有待跟进记录"],
      ["milestones", "有待推进里程碑"],
      ["sites", "已关联场地"],
    ],
    growthViewState.filter,
  );
  filter.setAttribute("aria-label", "筛选项目");
  const resultCount = el("small"),
    grid = el("div", { class: "project-grid" });
  const cardsButton = btn("卡片", () => setLayout("cards"));
  const listButton = btn("列表", () => setLayout("list"));
  function setLayout(layout) {
    growthViewState.layout = layout;
    grid.classList.toggle("project-list-view", layout === "list");
    for (const [button, value] of [
      [cardsButton, "cards"],
      [listButton, "list"],
    ]) {
      button.classList.toggle("active", layout === value);
      button.setAttribute("aria-pressed", String(layout === value));
    }
    try {
      localStorage.setItem("nianlun.project-layout", layout);
    } catch (_) {
      /* Session preference still works. */
    }
  }
  function filtered() {
    const q = search.value.trim().toLowerCase();
    return data.projects.filter((p) => {
      const rows = byProject.get(p.id);
      return (
        [p.title, p.description, p.goal, p.number]
          .join(" ")
          .toLowerCase()
          .includes(q) &&
        (filter.value === "all" ||
          (filter.value === "active" && p.active === true) ||
          (filter.value === "done" && p.status === "已完成") ||
          (filter.value === "records" && rows.records.some(growthRecordOpen)) ||
          (filter.value === "milestones" &&
            rows.milestones.some(growthMilestoneOpen)) ||
          (filter.value === "sites" && rows.sites.length > 0))
      );
    });
  }
  function draw() {
    growthViewState.query = search.value;
    growthViewState.filter = filter.value;
    const projects = filtered();
    resultCount.textContent =
      "显示 " + projects.length + " / " + data.projects.length + " 个项目";
    grid.replaceChildren();
    for (const [index, project] of projects.entries()) {
      const rows = byProject.get(project.id);
      const latest = rows.records
        .filter((r) => r.date)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const card = el(
        "article",
        {
          class: "project-card",
          tabIndex: 0,
          role: "button",
          "aria-label": "打开项目 " + project.title,
        },
        [
          el("div", { class: "project-card-top" }, [
            el("span", {
              class: "project-card-index",
              text: String(index + 1).padStart(2, "0"),
            }),
            badge(project.status),
            el("small", { text: project.priority || "未设优先级" }),
          ]),
          el("div", { class: "project-card-heading" }, [
            el("h3", { text: project.title }),
            el("p", {
              text:
                project.description ||
                project.goal ||
                "从一条记录开始，积累项目的来龙去脉。",
            }),
          ]),
          el("div", { class: "project-card-counts" }, [
            el("span", { text: rows.records.length + " 记录" }),
            el("span", { text: rows.milestones.length + " 里程碑" }),
            el("span", { text: rows.sites.length + " 场地" }),
          ]),
          el("div", { class: "project-card-latest" }, [
            el("small", {
              text: latest
                ? "最近记录 · " + latest.date.slice(0, 10)
                : "等待第一条进展",
            }),
            el("p", {
              text: latest?.title || "采集项目资料，让每次变化留下记录。",
            }),
          ]),
          el("div", { class: "project-card-bottom" }, [
            el("small", { text: project.number || "项目空间" }),
            el("span", { text: "进入项目 ↗" }),
          ]),
        ],
      );
      card.onclick = () => openProject(project.id);
      card.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      };
      card.onpointerenter = () => scene?.focus(project.id);
      card.onfocus = () => scene?.focus(project.id);
      card.onpointerleave = () => scene?.clearFocus();
      card.onblur = () => scene?.clearFocus();
      grid.append(card);
    }
    if (!projects.length)
      grid.append(
        empty(
          "没有匹配的项目",
          "尝试其他关键词，或切回全部项目。",
          btn("清除筛选", () => {
            search.value = "";
            filter.value = "all";
            draw();
          }),
        ),
      );
  }
  const metrics = el("div", {
    class: "growth-metrics",
    "aria-label": "工作空间统计",
  });
  for (const [label, count, detail, key] of [
    ["活跃项目", active.length, "正在推进的项目", "active"],
    [
      "待推进里程碑",
      pendingMilestones.length,
      "已关联项目 · 未标记完成",
      "milestones",
    ],
    ["待跟进记录", openRecords.length, "已关联项目 · 未标记解决", "records"],
    [
      "已关联场地",
      data.sites.filter((s) => s.project_ids?.some((id) => byProject.has(id)))
        .length,
      "已与项目建立关联",
      "sites",
    ],
  ]) {
    const button = btn(
      "",
      () => {
        filter.value = key;
        draw();
        collection.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      },
      "growth-metric",
    );
    button.append(
      el("small", { text: label }),
      el("strong", { text: count }),
      el("span", { text: detail }),
    );
    metrics.append(button);
  }
  const collection = el("section", { class: "project-collection" }, [
    el("div", { class: "project-collection-head" }, [
      el("div", {}, [el("h2", { text: "项目空间" }), resultCount]),
      el(
        "div",
        { class: "project-view-toggle", "aria-label": "项目展示方式" },
        [cardsButton, listButton],
      ),
    ]),
    el("div", { class: "toolbar" }, [search, filter]),
    grid,
  ]);
  root.replaceChildren(hero, metrics, collection);
  const recent = data.records
    .filter((r) => r.date && r.project_ids?.some((id) => byProject.has(id)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  if (recent.length)
    root.append(
      el("details", { class: "growth-recent" }, [
        el("summary", { text: "最近留下的轨迹 · " + recent.length + " 条" }),
        el(
          "div",
          { class: "growth-recent-list" },
          recent.map((r) => {
            const project = data.projects.find((p) =>
              r.project_ids.includes(p.id),
            );
            const button = btn(
              "",
              () => openProject(project.id),
              "growth-event",
            );
            button.append(
              el("time", { text: r.date.slice(0, 10) }),
              el("strong", { text: r.title }),
              el("span", { text: project.title }),
            );
            return button;
          }),
        ),
      ]),
    );
  root.append(
    el("p", {
      class: "subtle",
      text:
        "数据读取于 " +
        data.fetched_at.replace("T", " ") +
        " · " +
        (data.warnings?.join("；") || "已完整读取四张子表"),
    }),
  );
  search.oninput = draw;
  filter.onchange = draw;
  setLayout(growthViewState.layout);
  draw();
  growthOverviewCleanup = () => {
    reduced.removeEventListener("change", syncMotionControl);
    scene?.destroy();
  };
  import("./growth-scene.js")
    .then((module) => {
      if (generation !== growthOverviewGeneration || !stage.isConnected) return;
      scene = module.mount(stage, {
        projects: data.projects,
        records: data.records,
        milestones: data.milestones,
        sites: data.sites,
        onSelect: openProject,
        showCaption: false,
        onReady: ({ mode, shown, total }) => {
          sceneCaption.textContent =
            mode === "webgl"
              ? "拖动旋转 · 点击光点进入项目 · " +
                shown +
                " / " +
                total +
                " 个项目"
              : "轻量项目视图 · 点击进入项目";
          pause.hidden = mode !== "webgl";
        },
        onError: () => {
          sceneCaption.textContent = "已切换轻量视图，项目仍可正常打开";
        },
      });
      scene.setPaused(growthViewState.paused);
    })
    .catch(() => {
      if (generation === growthOverviewGeneration && stage.isConnected) {
        stage.append(
          el("div", {
            class: "growth-fallback-note",
            text: "三维概览暂不可用，全部项目仍可在下方查看。",
          }),
        );
        sceneCaption.textContent = "项目目录可正常使用";
        pause.hidden = true;
      }
    });
}
