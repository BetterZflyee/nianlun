/* Memory explorer 2.7. Read-only catalog, content and explicit citations. */
async function renderMemory27(root, generation) {
  const model = await import("./galaxy-model.js");
  if (generation !== viewVersion) return;
  const projects = (data?.projects || []).map(({ id, title }) => ({
    id,
    title,
  }));
  let pages = [],
    fullGraph = { nodes: [], edges: [], groups: [] };
  let group = "all",
    selectedKey = null,
    currentPage = null,
    graph = null;
  let disposed = false,
    drawSeq = 0,
    readSeq = 0,
    offset = 0,
    hasMore = false;
  let catalogBusy = false,
    preloading = true,
    loadingLinks = false,
    stopLinks = false;
  let motion = false,
    directoryLimit = 40;
  const attempted = new Set();
  const active = () => !disposed && generation === viewVersion;
  const search = el("input", {
    type: "search",
    placeholder: "按标题、项目名查找记忆",
    "aria-label": "筛选已载入记忆目录",
  });
  const totals = el("div", { class: "mv-totals", role: "status" });
  const rail = el("nav", {
    class: "mv-projects",
    "aria-label": "按项目和目录探索记忆",
  });
  const directory = el("div", { class: "mv-directory" });
  const directoryTitle = el("strong", { text: "记忆目录" });
  const directoryCount = el("small");
  const more = btn("加载更多目录", () => quiet(load(offset)));
  const stage = el("div", { class: "constellation-stage mv-stage" });
  const focusTitle = el("strong", { text: "全部记忆" });
  const focusCaption = el("span", { text: "选项目聚焦，选记忆阅读" });
  const focusSummary = el("div", { class: "mv-focus-summary" });
  const reader = el("aside", {
    class: "mv-reader",
    "aria-label": "记忆正文与引用",
    tabIndex: -1,
  });
  reader.hidden = true;
  const reopen = btn("展开阅读", () => setReader(true));
  reopen.hidden = true;
  const pause = btn("开启漫游", () => {
    motion = !motion;
    graph?.setMotion(motion);
  });
  pause.setAttribute("aria-pressed", "false");
  const depth = select(
    [
      ["1", "一跳引用"],
      ["2", "两跳引用"],
    ],
    "1",
  );
  depth.setAttribute("aria-label", "显示真实引用的层数");
  depth.onchange = () => {
    graph?.setDepth(Number(depth.value));
    updateFocus();
  };
  const layout = select(
    [
      ["galaxy", "立体星图"],
      ["disc", "平面星盘"],
    ],
    "galaxy",
  );
  layout.setAttribute("aria-label", "星图布局");
  layout.onchange = () => graph?.setMode(layout.value);
  const coverage = el("div", {
    class: "mv-coverage",
    role: "status",
    "aria-live": "polite",
  });
  const indexButton = btn("暂停读取", toggleIndex);
  const sidebar = el(
    "aside",
    { class: "mv-sidebar", "aria-label": "项目导航与记忆目录" },
    [
      el("div", { class: "mv-sidebar-head" }, [
        el("strong", { text: "我的记忆空间" }),
        totals,
      ]),
      rail,
      el("div", { class: "mv-directory-head" }, [
        directoryTitle,
        directoryCount,
      ]),
      directory,
      more,
    ],
  );
  const canvasCard = el(
    "section",
    { class: "mv-canvas-card", "aria-label": "真实记忆关系星图" },
    [
      el("div", { class: "mv-map-head" }, [
        el("div", {}, [focusTitle, focusCaption]),
        el("div", { class: "mv-map-actions" }, [reopen, btn("回全景", clear)]),
      ]),
      stage,
      focusSummary,
      el("div", { class: "mv-map-tools" }, [
        el("div", { class: "mv-map-actions" }, [layout, depth, pause]),
        el("div", { class: "mv-map-actions" }, [
          el("button", {
            type: "button",
            text: "−",
            "aria-label": "缩小星图",
            onclick: () => graph?.zoom(1.25),
          }),
          el("button", {
            type: "button",
            text: "+",
            "aria-label": "放大星图",
            onclick: () => graph?.zoom(0.8),
          }),
        ]),
      ]),
      el("p", {
        class: "mv-graph-help",
        text: "拖动旋转 · 滚轮缩放 · 方向键调整 · Esc 回全景。连线仅来自已读到的真实引用。",
      }),
    ],
  );
  const workspace = el("div", { class: "memory-view27" }, [
    sidebar,
    canvasCard,
    reader,
  ]);
  root.replaceChildren(
    studioHead("项目记忆", "先看项目积累了什么，再沿着引用找到上下文。", [
      btn("刷新目录", () => navigate("memory")),
    ]),
    el("div", { class: "mv-searchbar" }, [
      el("div", { class: "mv-search-input" }, [studioIcon("search"), search]),
      btn("全文检索", () => quiet(fullSearch())),
    ]),
    workspace,
    el("div", { class: "mv-index-strip" }, [coverage, indexButton]),
    el("p", {
      class: "mv-scope-note",
      text: "项目分组按标题匹配，不代表正式绑定；未归属记忆按目录整理。数量仅统计已载入目录，连线不会因同项目或同目录而生成。",
    }),
  );
  memoryViewCleanup = () => {
    disposed = true;
    stopLinks = true;
    readSeq++;
    drawSeq++;
    graph?.destroy();
  };

  function sync() {
    fullGraph = model.buildGraph(pages, projects);
  }
  function groupTitle() {
    if (group === "all") return "全部记忆";
    if (group === "unassigned") return "未归属项目";
    return (
      fullGraph.groups.find((item) => item.id === group)?.title ||
      projects.find((item) => "project:" + item.id === group)?.title ||
      "记忆目录"
    );
  }
  function setReader(show) {
    reader.hidden = !show;
    workspace.classList.toggle("has-reader", show);
    reopen.hidden = show || !currentPage;
    reopen.setAttribute("aria-expanded", String(show));
  }
  function focusReader() {
    reader.focus({ preventScroll: true });
    if (matchMedia("(max-width: 760px)").matches)
      reader.scrollIntoView({ block: "start", behavior: "auto" });
  }
  function clear() {
    readSeq++;
    selectedKey = null;
    currentPage = null;
    group = "all";
    setReader(false);
    graph?.reset();
    drawNavigation();
    drawDirectory();
    updateFocus();
  }
  function chooseGroup(id) {
    readSeq++;
    group = id;
    selectedKey = null;
    currentPage = null;
    directoryLimit = 40;
    setReader(false);
    applyGroupFocus();
    drawNavigation();
    drawDirectory();
    updateFocus();
  }
  function applyGroupFocus(fly = true) {
    const ids =
      group === "all"
        ? null
        : group === "unassigned"
          ? fullGraph.groups
              .filter((item) => item.id.startsWith("folder:"))
              .map((item) => item.id)
          : [group];
    graph?.focusGroups(ids, fly);
  }
  function navButton(label, id, count, color) {
    const button = btn("", () => chooseGroup(id), "mv-group");
    button.dataset.group = id;
    button.classList.toggle("active", group === id);
    button.setAttribute("aria-pressed", String(group === id));
    const swatch = el("i", { class: "mv-swatch", "aria-hidden": "true" });
    if (color) swatch.style.backgroundColor = color;
    button.append(
      swatch,
      el("span", { text: label }),
      el("small", { text: String(count) }),
    );
    button.title = `${label} · 已载入 ${count} 篇`;
    return button;
  }
  function drawNavigation() {
    const focusId = rail.contains(document.activeElement)
      ? document.activeElement.dataset.group
      : null;
    const railTop = rail.scrollTop;
    const folderSummaryFocused =
      rail.querySelector("summary") === document.activeElement;
    const openFolders = rail.querySelector(".mv-folders")?.open;
    const groups = model.catalogGroups(fullGraph, projects);
    totals.textContent = `${groups.total} 篇 · ${fullGraph.edges.length} 条引用`;
    rail.replaceChildren(
      navButton("全部记忆", "all", groups.total),
      navButton("未归属项目", "unassigned", groups.unassigned),
    );
    if (groups.projects.length) {
      rail.append(el("p", { class: "mv-nav-label", text: "项目" }));
      for (const item of groups.projects)
        rail.append(navButton(item.title, item.id, item.count, item.color));
    }
    if (groups.folders.length) {
      const folders = el(
        "details",
        {
          class: "mv-folders",
          open:
            openFolders ??
            (group === "unassigned" || group.startsWith("folder:")),
        },
        [el("summary", { text: `其他目录 · ${groups.folders.length}` })],
      );
      for (const item of groups.folders)
        folders.append(navButton(item.title, item.id, item.count, item.color));
      rail.append(folders);
    }
    if (focusId)
      [...rail.querySelectorAll("button")]
        .find((button) => button.dataset.group === focusId)
        ?.focus({ preventScroll: true });
    else if (folderSummaryFocused)
      rail.querySelector("summary")?.focus({ preventScroll: true });
    rail.scrollTop = railTop;
    more.hidden = !hasMore;
    more.disabled = catalogBusy || preloading || pages.length >= 1500;
    more.textContent =
      pages.length >= 1500
        ? "已载入 1500 篇，可用全文检索"
        : catalogBusy || preloading
          ? "正在载入目录…"
          : "加载更多目录";
  }
  function drawDirectory() {
    const focusId = directory.contains(document.activeElement)
      ? document.activeElement.dataset.node
      : null;
    const matches = model.catalogNodes(fullGraph, group, search.value);
    directoryTitle.textContent = search.value.trim() ? "匹配记忆" : "记忆目录";
    directoryCount.textContent = `${matches.length} 篇`;
    directory.replaceChildren();
    if (!matches.length) {
      directory.append(
        el("p", {
          class: "mv-empty-note",
          text: pages.length
            ? "当前范围暂无匹配。可切换全部记忆、加载更多目录或全文检索。"
            : "目录载入后会显示在这里。",
        }),
      );
      return;
    }
    for (const node of matches.slice(0, directoryLimit)) {
      const button = btn("", () => quiet(openPage(node)), "mv-document");
      button.dataset.node = node.id;
      button.classList.toggle("active", model.keyFor(node) === selectedKey);
      button.setAttribute(
        "aria-pressed",
        String(model.keyFor(node) === selectedKey),
      );
      button.append(
        el("span", { text: node.title }),
        el("small", { text: node.slug }),
      );
      directory.append(button);
    }
    if (focusId)
      [...directory.querySelectorAll("button")]
        .find((button) => button.dataset.node === focusId)
        ?.focus({ preventScroll: true });
    if (matches.length > directoryLimit)
      directory.append(
        btn(
          `再显示 ${Math.min(40, matches.length - directoryLimit)} 篇`,
          () => {
            directoryLimit += 40;
            drawDirectory();
          },
          "mv-more-documents",
        ),
      );
  }
  function updateFocus() {
    const selected = fullGraph.nodes.find((node) => node.id === selectedKey);
    focusTitle.textContent = selected ? selected.title : groupTitle();
    focusSummary.replaceChildren();
    if (selected) {
      const incoming = fullGraph.edges.filter(
        (edge) => edge.target === selectedKey,
      ).length;
      const outgoing = fullGraph.edges.filter(
        (edge) => edge.source === selectedKey,
      ).length;
      focusCaption.textContent = `当前记忆 · ${outgoing} 条引用 · ${incoming} 条反向引用`;
      const near = model.neighborhood(
        selectedKey,
        fullGraph.edges,
        Number(depth.value),
      );
      focusSummary.append(
        el("span", { text: `聚焦 ${near.size} 篇有据可查的记忆` }),
      );
      if (!incoming && !outgoing)
        focusSummary.append(
          el("small", {
            text: selected.links_verified
              ? "当前已读到的引用中暂无关联"
              : "引用仍待核验；可先阅读正文",
          }),
        );
    } else {
      const members = model.catalogNodes(fullGraph, group);
      const ids = new Set(members.map((node) => node.id));
      const citations = fullGraph.edges.filter(
        (edge) => ids.has(edge.source) || ids.has(edge.target),
      ).length;
      focusCaption.textContent = `${members.length} 篇记忆 · ${citations} 条相关引用`;
      focusSummary.append(
        el("span", {
          text:
            group === "all"
              ? "选择左侧项目或图中分组，聚焦它的积累"
              : "同色是分组，连线才是实际引用",
        }),
      );
      if (!members.length && pages.length)
        focusSummary.append(
          el("small", {
            text: "已载入目录暂未匹配此项目；可以加载更多或全文检索",
          }),
        );
    }
  }
  async function drawGraph() {
    const sequence = ++drawSeq;
    if (!fullGraph.nodes.length) {
      graph?.destroy();
      graph = null;
      stage.replaceChildren(
        studioEmpty(
          "这里还没有记忆",
          "已连接空间的目录为空。产生项目积累后会显示在这里。",
        ),
      );
      return;
    }
    try {
      if (!graph) {
        const { mount } = await import("./constellation.js");
        if (!active() || sequence !== drawSeq) return;
        stage.replaceChildren();
        graph = mount(stage, {
          ...fullGraph,
          motion: false,
          ambientStars: false,
          onSelect: (id) => {
            const page = pages.find((item) => model.keyFor(item) === id);
            if (page) quiet(openPage(page));
          },
          onGroup: chooseGroup,
          onClear: clear,
          onMotion: (value) => {
            motion = value;
            pause.textContent = value ? "暂停漫游" : "开启漫游";
            pause.setAttribute("aria-pressed", String(value));
          },
          onFallback: () => {
            pause.disabled = true;
            layout.disabled = true;
          },
        });
      } else graph.update(fullGraph);
      applyGroupFocus(false);
      graph.setDepth(Number(depth.value));
      if (layout.value !== "galaxy") graph.setMode(layout.value);
      if (selectedKey) graph.select(selectedKey, false);
    } catch (error) {
      if (!active() || sequence !== drawSeq) return;
      graph?.destroy();
      graph = null;
      stage.replaceChildren(
        studioEmpty("星图暂不可用", "左侧目录、全文检索和正文阅读仍可使用。"),
        el("small", { text: error.message }),
      );
    }
  }
  function renderRelated(page) {
    const id = model.keyFor(page);
    const outgoing = fullGraph.edges.filter((edge) => edge.source === id);
    const incoming = fullGraph.edges.filter((edge) => edge.target === id);
    const section = el("section", { class: "mv-references" }, [
      el("h3", { text: "沿着真实引用继续读" }),
    ]);
    for (const [label, list, target] of [
      ["这篇引用了", outgoing, "target"],
      ["被这些记忆引用", incoming, "source"],
    ]) {
      if (!list.length) continue;
      section.append(
        el("p", {
          class: "mv-relation-label",
          text: `${label} · ${list.length}`,
        }),
      );
      for (const edge of list) {
        const node = fullGraph.nodes.find((item) => item.id === edge[target]);
        if (node)
          section.append(
            btn(
              node.title + " ↗",
              () => quiet(openPage(node)),
              "mv-reference",
            ),
          );
      }
    }
    if (!incoming.length && !outgoing.length)
      section.append(
        el("p", {
          class: "mv-empty-note",
          text: page.links_verified
            ? "已读到的引用中尚无关联。未载入的目标记忆不会被补成连线。"
            : "引用索引尚未完成；读取完成后会在这里补充。",
        }),
      );
    if (page.links_truncated)
      section.append(
        el("p", {
          class: "mv-empty-note",
          text: "此记忆的引用较多，当前展示的是已读到的部分。",
        }),
      );
    return section;
  }
  function paintReader(page, preserveScroll = false) {
    const scroll = reader.scrollTop;
    const close = btn("收起", () => setReader(false));
    close.setAttribute("aria-label", "收起记忆正文，保留星图聚焦");
    reader.replaceChildren(
      el("div", { class: "mv-reader-head" }, [
        el("strong", { text: "记忆详情" }),
        close,
      ]),
      el("div", { class: "mv-reader-content" }, [
        el("h2", { text: page.title || page.slug }),
        el("div", { class: "mv-page-meta" }, [
          badge(page.type || "note"),
          el("span", {
            text: page.updated
              ? `更新于 ${String(page.updated).slice(0, 10)}`
              : "未提供更新时间",
          }),
        ]),
        el("p", {
          class: "mv-page-source",
          text: page.slug + (page.source_id ? ` · 来源 ${page.source_id}` : ""),
        }),
        page.text === undefined
          ? el("p", { class: "mv-loading", text: "正在读取正文…" })
          : memoryText27(page.text),
        page.note ? el("p", { class: "mv-empty-note", text: page.note }) : null,
        page.full_page === false &&
        String(page.note || "").includes("全文回读失败")
          ? btn("重试全文检索", () => quiet(fullSearch()))
          : null,
        renderRelated(page),
      ]),
    );
    if (preserveScroll) reader.scrollTop = scroll;
  }
  async function openPage(input) {
    const sequence = ++readSeq;
    const original = pages.find(
      (page) =>
        (input.key && page.key === input.key) ||
        (page.slug === input.slug && page.source_id === input.source_id),
    );
    const page = original || input;
    if (
      original &&
      input.text !== undefined &&
      input.full_page === true &&
      original.text === undefined
    )
      Object.assign(original, {
        text: input.text,
        note: input.note,
        full_page: input.full_page,
      });
    currentPage = page;
    selectedKey = model.keyFor(page);
    const node = fullGraph.nodes.find((item) => item.id === selectedKey);
    if (
      node &&
      group !== "all" &&
      !model
        .catalogNodes(fullGraph, group)
        .some((item) => item.id === selectedKey)
    ) {
      group = node.group;
      drawNavigation();
    }
    graph?.select(selectedKey);
    setReader(true);
    paintReader(page);
    drawDirectory();
    updateFocus();
    focusReader();
    if (page.text !== undefined) return;
    try {
      const read = (
        await run("memory_page", { slug: page.slug, key: page.key })
      ).value;
      if (!active() || sequence !== readSeq) return;
      Object.assign(page, read);
      sync();
      graph?.updateEdges(fullGraph.edges);
      paintReader(page);
      drawNavigation();
      updateFocus();
    } catch (error) {
      if (!active() || sequence !== readSeq) return;
      reader.querySelector(".mv-loading")?.remove();
      reader.querySelector(".mv-reader-content").append(
        el("p", { class: "mv-error", text: error.message }),
        btn("重试读取正文", () => quiet(openPage(page))),
      );
    }
  }
  function updateCoverage() {
    const state = model.referenceCoverage(pages);
    const label = loadingLinks
      ? stopLinks
        ? "暂停中，等待当前批次返回"
        : "正在读取真实引用"
      : stopLinks
        ? "引用读取已暂停"
        : state.pending
          ? "等待读取引用"
          : state.failed
            ? "部分引用未读到"
            : "已完成当前目录的引用读取";
    coverage.replaceChildren(
      el("strong", { text: label }),
      el("span", {
        text: `已核验 ${state.verified} / ${state.total} 篇${state.failed ? ` · ${state.failed} 篇可重试` : ""}${fullGraph.unresolved ? ` · ${fullGraph.unresolved} 条引用目标未载入或不明确` : ""}${hasMore ? " · 还有目录未载入" : ""}`,
      }),
    );
    if (state.total)
      coverage.append(
        el("progress", {
          max: state.total,
          value: state.verified,
          "aria-label": "已载入记忆的引用核验覆盖",
        }),
      );
    indexButton.textContent = loadingLinks
      ? stopLinks
        ? "等待暂停"
        : "暂停读取"
      : stopLinks
        ? "继续读取"
        : state.failed
          ? "重试未读到的引用"
          : state.pending
            ? "继续读取"
            : "引用已核验";
    indexButton.disabled =
      (loadingLinks && stopLinks) ||
      (!loadingLinks && !stopLinks && !state.pending && !state.failed);
  }
  function toggleIndex() {
    if (loadingLinks) {
      stopLinks = true;
      updateCoverage();
      return;
    }
    stopLinks = false;
    for (const page of pages)
      if (page.links_error) {
        attempted.delete(model.keyFor(page));
        delete page.links_error;
      }
    quiet(loadLinks());
  }
  async function loadLinks() {
    if (!active() || loadingLinks || stopLinks) return;
    loadingLinks = true;
    updateCoverage();
    try {
      while (active() && !stopLinks) {
        const batch = pages
          .filter((page) => page.key && !attempted.has(model.keyFor(page)))
          .slice(0, 6);
        if (!batch.length) break;
        try {
          const value = (
            await run("memory_relations", {
              keys: batch.map((page) => page.key),
            })
          ).value;
          if (!active()) return;
          for (const page of batch) {
            const found = value.pages.find((item) => item.key === page.key);
            attempted.add(model.keyFor(page));
            page.links_verified = found?.verified === true;
            if (page.links_verified) {
              page.links = found.links;
              page.links_truncated = found.truncated;
              delete page.links_error;
            } else page.links_error = found?.error || "引用暂未读到";
          }
        } catch (error) {
          if (!active()) return;
          for (const page of batch) {
            attempted.add(model.keyFor(page));
            page.links_error = error.message;
          }
          stopLinks = true;
        }
        sync();
        graph?.updateEdges(fullGraph.edges);
        drawNavigation();
        updateFocus();
        updateCoverage();
        if (
          currentPage &&
          !reader.hidden &&
          currentPage.text !== undefined &&
          !reader
            .querySelector(".mv-references")
            ?.contains(document.activeElement)
        ) {
          const referenceSection = reader.querySelector(".mv-references");
          referenceSection?.replaceWith(renderRelated(currentPage));
        }
      }
    } finally {
      loadingLinks = false;
      if (active()) {
        updateCoverage();
        if (!selectedKey && !stopLinks) graph?.relayout?.();
      }
    }
  }
  async function load(at) {
    if (catalogBusy || !active()) return false;
    catalogBusy = true;
    drawNavigation();
    if (!pages.length) loading(stage, "正在读取自己的记忆目录…");
    try {
      const result = (await run("memory_catalog", { offset: at })).value;
      if (!active()) return false;
      const map = new Map(pages.map((page) => [model.keyFor(page), page]));
      for (const page of result.pages)
        if (!map.has(model.keyFor(page))) map.set(model.keyFor(page), page);
      pages = [...map.values()].slice(0, 1500);
      offset = result.next_offset;
      hasMore = result.has_more;
      sync();
      drawNavigation();
      drawDirectory();
      updateFocus();
      updateCoverage();
      await drawGraph();
      quiet(loadLinks());
      return true;
    } catch (error) {
      if (active()) {
        if (!pages.length)
          stage.replaceChildren(
            studioEmpty("记忆目录未能读取", error.message),
            btn("重试目录", () => quiet(load(at))),
          );
        else toast("更多目录读取失败：" + error.message);
      }
      return false;
    } finally {
      catalogBusy = false;
      if (active()) drawNavigation();
    }
  }
  async function fullSearch() {
    const query = search.value.trim();
    if (!query) {
      toast("先输入要检索的关键词");
      search.focus();
      return;
    }
    const sequence = ++readSeq;
    setReader(true);
    currentPage = null;
    reader.replaceChildren(
      el("div", { class: "mv-reader-head" }, [
        el("strong", { text: "全文检索" }),
        btn("收起", () => setReader(false)),
      ]),
      el("p", { class: "mv-loading", text: "正在检索独立记忆空间…" }),
    );
    focusReader();
    try {
      const result = (await run("memory_query", { query })).value;
      if (!active() || sequence !== readSeq) return;
      reader.querySelector(".mv-loading")?.remove();
      const content = el("div", { class: "mv-reader-content" }, [
        el("h2", { text: `“${query}”的相关记忆` }),
        el("p", {
          class: "mv-empty-note",
          text: `找到 ${result.pages.length} 项相关结果；检索结果并非全部记忆。`,
        }),
      ]);
      for (const page of result.pages) {
        const item = btn("", () => quiet(openPage(page)), "mv-search-result");
        item.append(
          el("strong", { text: page.title }),
          el("span", { text: String(page.text || "").slice(0, 160) }),
          el("small", { text: page.slug }),
        );
        content.append(item);
      }
      if (!result.pages.length)
        content.append(studioEmpty("暂无匹配", "可以更换简称或关键词。"));
      reader.append(content);
    } catch (error) {
      if (!active() || sequence !== readSeq) return;
      reader.querySelector(".mv-loading")?.remove();
      reader.append(
        el("p", { class: "mv-error", text: error.message }),
        btn("重试全文检索", () => quiet(fullSearch())),
      );
    }
  }
  search.oninput = () => {
    directoryLimit = 40;
    drawDirectory();
  };
  search.onkeydown = (event) => {
    if (event.key === "Escape") {
      search.value = "";
      drawDirectory();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const first = model.catalogNodes(fullGraph, group, search.value)[0];
      if (first) quiet(openPage(first));
      else quiet(fullSearch());
    }
  };
  await load(0);
  while (active() && hasMore && pages.length < 600)
    if (!(await load(offset))) break;
  preloading = false;
  if (active()) drawNavigation();
}

// A deliberately small text renderer. It never parses HTML or activates source URLs.
function memoryText27(text) {
  const body = el("div", { class: "mv-page-body" });
  const lines = String(text || "此记忆正文为空。")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  let paragraph = [],
    code = null,
    list = null;
  function inline(tag, value) {
    const node = el(tag);
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let cursor = 0;
    for (const match of value.matchAll(pattern)) {
      node.append(document.createTextNode(value.slice(cursor, match.index)));
      const strong = match[0].startsWith("**");
      node.append(
        el(strong ? "strong" : "code", {
          text: match[0].slice(strong ? 2 : 1, strong ? -2 : -1),
        }),
      );
      cursor = match.index + match[0].length;
    }
    node.append(document.createTextNode(value.slice(cursor)));
    return node;
  }
  function flush() {
    if (paragraph.length) body.append(inline("p", paragraph.join("\n")));
    paragraph = [];
    list = null;
  }
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      flush();
      if (code !== null) {
        body.append(el("pre", { class: "mv-code", text: code.join("\n") }));
        code = null;
      } else code = [];
      continue;
    }
    if (code !== null) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      body.append(inline("h" + Math.min(4, heading[1].length + 1), heading[2]));
      continue;
    }
    const bullet = /^\s*([-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (bullet) {
      if (paragraph.length) flush();
      const tag = /^\d/.test(bullet[1]) ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== tag) {
        list = el(tag);
        body.append(list);
      }
      list.append(inline("li", bullet[2]));
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      body.append(inline("blockquote", line.replace(/^>\s?/, "")));
      continue;
    }
    list = null;
    paragraph.push(line);
  }
  flush();
  if (code !== null)
    body.append(el("pre", { class: "mv-code", text: code.join("\n") }));
  return body;
}
