"use strict";
const $ = (s) => document.querySelector(s);
const localFile = location.protocol === "file:";
let token = localFile
  ? null
  : location.hash.slice(1) || sessionStorage.getItem("nianlun.session");
if (!localFile && location.hash) {
  sessionStorage.setItem("nianlun.session", token);
  history.replaceState(null, "", location.pathname);
}
let boot = {},
  data = null,
  view = "projects",
  selected = null,
  tab = "records",
  viewVersion = 0;
const roleNames = {
  projects: "项目",
  records: "项目记录",
  milestones: "里程碑",
  sites: "场地",
};
let workflowSkill = null,
  currentWorkflow = null,
  workflowPoll = 0;
const fieldLabels = {
  title: "名称",
  description: "详情",
  goal: "项目目标",
  deadline: "目标日期",
  risk: "风险卡点",
  priority: "优先级",
  status: "状态",
  date: "日期",
  kind: "记录类型",
  notes: "备注",
  benefit: "预期效益",
  project_ids: "关联项目",
  site_ids: "关联场地",
  milestone_ids: "关联里程碑",
  report: "阶段汇报链接",
};
const jobNames = {
  bulk_mutate: "批量处理",
  memory_project: "展开项目记忆",
  capability_bulk: "批量配置能力",
  pick_directory: "选择能力目录",
  report_method: "设置汇报方法",
  cdbi_import: "导入场地",
  cdbi_preview: "预览场地",
  cdbi_install: "安装 CDBI",
  host_export: "准备宿主入口",
  workflow_request: "准备工作流交接",
  resume: "继续原任务",
  schedule_pause: "调整本机暂停状态",
  reconcile_growth: "核验原结果",
  resume_growth: "继续原轮次",
  recovery_status: "读取原轮次状态",
  growth_status: "读取采集覆盖",
  snapshot: "刷新项目",
  todos: "读取待办",
  mutate: "保存工作内容",
  memory_query: "检索项目记忆",
  ask: "宿主分析",
  workflow: "执行宿主工作流",
  grow: "运行一次生长",
  report: "生成阶段汇报",
  plan_milestones: "基于资料规划里程碑",
  send_report: "发送项目汇报",
  group_search: "搜索项目群",
  mailboxes: "读取本人邮箱",
  capability_roots: "保存能力目录",
  setup_dependencies: "安装运行环境",
  setup_login: "钉钉授权",
  profiles: "读取账号",
  inspect: "读取表结构",
  create_resource: "创建云端资源",
  table_plan: "预览表格方案",
  tables_apply: "初始化 / 绑定表格",
  memory_connect: "接入独立记忆空间",
  configure: "保存运行配置",
  setup_doctor: "检查接入",
  harness_status: "检查 AI 宿主",
  harness_connect: "连接 AI 宿主",
  capabilities: "扫描能力",
  capability_toggle: "配置能力",
};
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child !== null && child !== undefined)
      node.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  }
  return node;
}
const btn = (label, fn, cls = "") =>
  el("button", { type: "button", class: cls, onclick: fn, text: label });
const badge = (value, cls = "") =>
  el("span", { class: "badge " + cls, text: value || "未设置" });
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").hidden = true), 4500);
}
function notice(message) {
  $("#notice").textContent = message || "";
  $("#notice").hidden = !message;
}
function loading(node, message = "正在读取真实数据…") {
  node.replaceChildren(
    el("div", { class: "loading" }, [
      el("span", { class: "spinner" }),
      message,
    ]),
  );
}
async function api(path, body) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await r.json();
  if (!r.ok) throw new Error(value.error || "请求失败");
  return value;
}
async function run(op, values = {}, progress) {
  const { job_id } = await api("/api/actions", { op, data: values });
  let panel;
  if (
    [
      "ask",
      "report",
      "grow",
      "plan_milestones",
      "bulk_mutate",
      "resume_growth",
    ].includes(op)
  ) {
    const job = await api("/api/jobs/" + job_id);
    panel = taskPanel(job);
    const target = $("#modal").open ? $("#dialog-content") : $("#content");
    target.append(panel);
    panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  return pollJob(job_id, progress, panel);
}

async function withButton(button, action) {
  const old = button.textContent;
  button.disabled = true;
  try {
    return await action((message) => (button.textContent = message));
  } catch (e) {
    if (e.job?.status !== "waiting_harness") notice(e.message);
    throw e;
  } finally {
    button.disabled = false;
    button.textContent = old;
  }
}
function quiet(promise) {
  promise.catch(() => {});
}
let fieldCounter = 0;
function formField(label, input, help) {
  if (!input.id) input.id = "field-" + ++fieldCounter;
  return el("div", { class: "form-field" }, [
    el("label", { text: label, htmlFor: input.id }),
    input,
    help ? el("p", { class: "form-help", text: help }) : null,
  ]);
}
function select(options, value) {
  const node = el("select");
  for (const option of options) {
    const [id, label] = Array.isArray(option) ? option : [option, option];
    node.append(el("option", { value: id, text: label }));
  }
  if (value !== undefined && value !== null) node.value = String(value);
  return node;
}
function heading(title, description, actions = []) {
  return el("div", { class: "page-heading" }, [
    el("div", {}, [
      el("div", { class: "eyebrow", text: "NIANLUN / YOUR WORK, IN CONTEXT" }),
      el("h1", { text: title }),
      el("p", { class: "subtle", text: description }),
    ]),
    el("div", { class: "actions" }, actions),
  ]);
}
function empty(title, description, action) {
  return el("div", { class: "empty" }, [
    el("strong", { text: title }),
    el("p", { text: description }),
    action,
  ]);
}
function dialog(title, content) {
  $("#dialog-title").textContent = title;
  $("#dialog-content").replaceChildren(content);
  $("#modal").showModal();
}
$("#dialog-close").onclick = () => $("#modal").close();
$("#brand").onclick = (e) => {
  e.preventDefault();
  navigate("projects");
};
document
  .querySelectorAll("[data-nav]")
  .forEach((b) => (b.onclick = () => navigate(b.dataset.nav)));
$("#refresh").onclick = () => quiet(refresh());
async function initialize() {
  if (!token) {
    notice("请通过“打开年轮”启动器打开工作台，此页面缺少本机授权。");
    return;
  }
  try {
    boot = await api("/api/bootstrap");
    $("#connection").textContent = "已连接本机";
    if (boot.base_url) {
      $("#base-link").href = boot.base_url;
      $("#base-link").hidden = false;
    }
    setupNotifications();
    studioInit();
    await navigate(boot.configured ? "projects" : "setup");
  } catch (e) {
    notice(e.message);
    $("#connection").textContent = "连接未完成";
  }
}
async function refresh() {
  notice("");
  boot = await api("/api/bootstrap");
  if (boot.configured) {
    const result = await run("snapshot");
    data = result.value;
    $("#identity").textContent = data.identity.name;
    $("#base-link").href = data.base_url;
    $("#base-link").hidden = false;
  }
  await navigate(view, false);
}
async function navigate(next, reload = true) {
  cleanupGrowthOverview();
  memoryViewCleanup();
  memoryViewCleanup = () => {};
  view = next;
  window.scrollTo({ top: 0, behavior: "instant" });
  const generation = ++viewVersion;
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) => b.classList.toggle("active", b.dataset.nav === view));
  $("#breadcrumb").textContent =
    "工作空间 / " +
    {
      projects: "项目工作台",
      todos: "我的待办",
      memory: "项目记忆",
      skills: "能力中心",
      workflows: "工作流",
      runs: "执行记录",
      setup: "接入与运行",
    }[view];
  const content = $("#content");
  content.dataset.view = view;
  loading(content);
  try {
    if (view === "setup") {
      boot = await api("/api/bootstrap");
      if (generation !== viewVersion) return;
      renderSetup(content);
      return;
    }
    if (!boot.configured) {
      content.replaceChildren(
        empty(
          "先连接你的工作空间",
          "接入钉钉 AI 表格和独立记忆空间后，项目内容会出现在这里。",
          btn("开始接入", () => navigate("setup"), "primary"),
        ),
      );
      return;
    }
    // Memory is independently readable even when the AI-table connection is unavailable.
    if (["projects", "todos", "workflows"].includes(view) && !data) {
      data = (await run("snapshot")).value;
      $("#identity").textContent = data.identity.name;
    }
    if (generation !== viewVersion) return;
    if (view === "projects") {
      selected ? renderProject(content) : renderProjects(content);
    }
    if (view === "todos") await renderTodos(content, generation);
    if (view === "memory") await renderMemory23(content, generation);
    if (view === "skills") await renderSkills23(content, generation);
    if (view === "workflows") await renderWorkflows23(content, generation);
    if (view === "runs") await renderRuns23(content, generation);
  } catch (e) {
    if (generation === viewVersion) {
      content.replaceChildren(
        empty(
          "本次读取未完成",
          e.message,
          btn("重试", () => navigate(view), "primary"),
        ),
      );
      notice(e.message);
    }
  }
}
function renderProjects(root) {
  renderGrowthProjects(root);
}
function renderProject(root) {
  cleanupGrowthOverview();
  const project = data.projects.find((p) => p.id === selected);
  if (!project) {
    selected = null;
    renderProjects(root);
    return;
  }
  root.replaceChildren(
    btn(
      "← 全部项目",
      () => {
        selected = null;
        renderProjects(root);
      },
      "back",
    ),
  );
  root.append(
    el("div", { class: "detail-title project-detail-hero" }, [
      heading(
        project.title,
        (project.number ? "项目编码：" + project.number + " · " : "") +
          (project.description || "在这里推进项目，记录每一步的来龙去脉。"),
        [
          btn("编辑项目", () => editRow("projects", project)),
          btn("获取项目进度", () => growthDialog(project)),
          btn("规划里程碑", () => milestoneDialog(project)),
          btn("生成汇报", () => reportDialog(project), "primary"),
        ],
      ),
      el("div", { class: "detail-meta" }, [
        badge(project.status),
        badge(project.priority || "未设优先级"),
      ]),
    ]),
  );
  const left = el("div");
  const summary = el("div", { class: "panel" }, [
    el("h3", { text: "项目概况" }),
    el("p", { text: project.goal || "尚未填写项目目标。" }),
  ]);
  if (project.risk)
    summary.append(
      el("p", { class: "danger", text: "当前卡点：" + project.risk }),
    );
  if (project.report) {
    const url = project.report.match(/https:\/\/[^\s<>)]+/)?.[0];
    if (url)
      summary.append(
        el("a", {
          href: url,
          target: "_blank",
          rel: "noreferrer",
          text: "查看最近阶段汇报 ↗",
        }),
      );
  }
  root.append(summary, compactRelations(project));
  const tabs = el("div", { class: "tabs" });
  for (const role of ["records", "milestones", "sites"])
    tabs.append(
      btn(
        roleNames[role],
        () => {
          tab = role;
          renderProject(root);
        },
        tab === role ? "active" : "",
      ),
    );
  left.append(tabs);
  const rows = data[tab].filter((r) => r.project_ids?.includes(selected));
  left.append(
    el("div", { class: "toolbar" }, [
      el("span", {
        class: "subtle",
        text: rows.length + " 条" + roleNames[tab],
      }),
      btn("+ 新增" + roleNames[tab], () => editRow(tab)),
      tab === "sites"
        ? btn("从 CDBI 获取场地", () => cdbiSites(project))
        : null,
    ]),
  );
  const entries = el("div", { class: "panel" });
  const quick = tab === "records" ? quickRecords(rows, entries) : null;
  for (const row of [...rows].sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  )) {
    entries.append(
      el("article", { class: "entry" }, [
        el("div", { class: "entry-top" }, [
          el("h3", { text: row.title }),
          quick ? quick(row) : btn("编辑", () => editRow(tab, row)),
        ]),
        el("p", { text: row.description || row.notes || "暂无详细说明" }),
        el("small", {
          text: [projectLabel(project), row.number || row.code, row.date]
            .filter(Boolean)
            .join(" · "),
        }),
        badge(row.status || row.kind || "已记录"),
      ]),
    );
  }
  if (!rows.length)
    entries.append(
      empty("从一条记录开始", "新内容会直接保存到这个项目对应的 AI 表格。"),
    );
  left.append(entries);
  const right = el("aside", { class: "panel" });
  right.append(
    el("div", { class: "eyebrow", text: "YOUR HARNESS" }),
    el("h3", { text: "和项目聊一聊" }),
    el("p", {
      class: "aside-note",
      text: "所选 AI 宿主会结合当前项目和历史记忆，帮你梳理变化、卡点和下一步。",
    }),
  );
  const question = el("textarea", {
    placeholder: "例如：最近的关键变化是什么？接下来我最应该推进哪件事？",
    "aria-label": "向项目提问",
  });
  const answer = el("div", { class: "ai-answer" });
  const submit = btn(
    "交给 AI 宿主",
    () =>
      quiet(
        withButton(submit, async (progress) => {
          const result = await run(
            "ask",
            { question: question.value, project_id: project.id },
            progress,
          );
          answer.textContent = result.value.answer;
        }),
      ),
    "primary",
  );
  right.append(
    question,
    el("div", { class: "form-actions" }, [submit]),
    answer,
    el("p", {
      class: "aside-note",
      text: "分析结果不会直接改表。需要更新时，在左侧记录或编辑相应事项。",
    }),
  );
  root.append(el("div", { class: "split" }, [left, right]));
}
function editRow(role, row) {
  const fields = data.fields[role];
  const form = el("form");
  const controls = {};
  const required = [
    "title",
    ...(role === "projects" ? [] : ["project_ids"]),
    ...(role === "records" ? ["description", "date", "kind", "status"] : []),
  ];
  for (const [key, field] of Object.entries(fields)) {
    if (
      ["number", "updated", "owner", "attachments", "report"].includes(key) ||
      ![
        "text",
        "date",
        "singleSelect",
        "unidirectionalLink",
        "bidirectionalLink",
      ].includes(field.type)
    )
      continue;
    let input;
    if (key.endsWith("_ids")) {
      const target = {
        project_ids: "projects",
        site_ids: "sites",
        milestone_ids: "milestones",
      }[key];
      const options = data[target]
        .filter(
          (r) =>
            target === "projects" ||
            !selected ||
            r.project_ids?.includes(selected),
        )
        .map((r) => [r.id, r.title]);
      input = select([["", "请选择"], ...options]);
      if (field.config?.multiple) {
        input.multiple = true;
        input.size = Math.min(4, options.length + 1);
        for (const option of input.options)
          option.selected = (
            row?.[key] || (key === "project_ids" && selected ? [selected] : [])
          ).includes(option.value);
      } else
        input.value =
          row?.[key]?.[0] || (key === "project_ids" ? selected || "" : "");
    } else if (field.type === "singleSelect") {
      input = select(
        (field.config?.options || []).map((o) => o.name),
        row?.[key] ||
          (key === "priority" &&
          field.config?.options?.some((o) => o.name === "P1")
            ? "P1"
            : undefined),
      );
    } else if (
      ["description", "goal", "risk", "notes", "benefit", "solution"].includes(
        key,
      )
    )
      input = el("textarea", {
        value: row?.[key] || "",
        placeholder: field.fieldName,
      });
    else
      input = el("input", {
        type: field.type === "date" ? "date" : "text",
        value:
          row?.[key] ||
          (key === "date" ? new Date().toLocaleDateString("en-CA") : ""),
      });
    if (required.includes(key)) input.required = true;
    controls[key] = input;
    form.append(formField(field.fieldName, input));
  }
  const error = el("div", { class: "form-error" });
  const save = el("button", {
    type: "submit",
    class: "primary",
    text: "保存到 AI 表格",
  });
  const cancel = btn("取消", () => $("#modal").close());
  form.append(error, el("div", { class: "form-actions" }, [cancel, save]));
  const rid = crypto.randomUUID();
  form.onsubmit = async (event) => {
    event.preventDefault();
    error.textContent = "";
    save.disabled = true;
    try {
      const values = {};
      for (const [key, input] of Object.entries(controls)) {
        let value = key.endsWith("_ids")
          ? [...input.selectedOptions].map((o) => o.value).filter(Boolean)
          : input.value;
        if (
          !row &&
          (!value || (Array.isArray(value) && !value.length)) &&
          !required.includes(key)
        )
          continue;
        values[key] = value;
      }
      const saved = await run(
        "mutate",
        {
          request_id: rid,
          op: row ? "update" : "create",
          role,
          record_id: row?.id,
          revision: row?.revision,
          values,
        },
        (message) => (save.textContent = message),
      );
      $("#modal").close();
      toast("已写入 AI 表格，并完成回读验证");
      applyRow(saved.value);
      if (!data) data = (await run("snapshot")).value;
      selected ? renderProject($("#content")) : renderProjects($("#content"));
    } catch (e) {
      error.textContent = e.message;
    } finally {
      save.disabled = false;
      save.textContent = "保存到 AI 表格";
    }
  };
  dialog((row ? "编辑" : "新增") + roleNames[role], form);
}
function growthDialog(project = null) {
  if (!project?.id) project = null;
  const end = new Date(),
    begin = new Date(end.getTime() - 86400000);
  const local = (d) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  const since = el("input", {
    type: "datetime-local",
    value: local(begin),
    required: true,
  });
  const until = el("input", {
    type: "datetime-local",
    value: local(end),
    required: true,
  });
  const labels = {
    minutes: "AI 听记",
    mentions: "群聊 @我",
    direct: "单聊",
    groups: "已选择的群聊",
    mail: "已选择的邮箱",
    lark_minutes: "飞书妙记",
    harness: "宿主人类会话",
    workbench: "工作台操作",
  };
  const checks = {};
  const channels = el("div", { class: "two-cols" });
  for (const [key, label] of Object.entries(labels)) {
    const enabled =
      ["harness", "workbench"].includes(key) ||
      (boot.preferences.sources?.[key] ??
        ["minutes", "mentions", "direct"].includes(key));
    const input = el("input", {
      type: "checkbox",
      checked: enabled,
      disabled: !enabled,
    });
    checks[key] = input;
    channels.append(
      el("label", { class: "check" }, [
        input,
        label + (enabled ? "" : "（尚未启用）"),
      ]),
    );
  }
  const status = el("div", { class: "ai-answer" });
  const requestId = crypto.randomUUID();
  let submitted = null;
  const go = btn(
    "采集并更新项目",
    (event) =>
      quiet(
        withButton(event.currentTarget, async (progress) => {
          const result = await run(
            "grow",
            (submitted ||= {
              request_id: requestId,
              since: new Date(since.value).toISOString(),
              until: new Date(until.value).toISOString(),
              selection: {
                channels: Object.keys(checks).filter((k) => checks[k].checked),
                project_ids: project ? [project.id] : [],
              },
            }),
            (message) => {
              progress(message);
              status.textContent = message;
            },
          );
          status.textContent =
            result.value.summary +
            "\n\n已核验动作：" +
            result.value.actions +
            " 项。" +
            (result.value.pending?.length
              ? "\n待核验：\n" + result.value.pending.join("\n")
              : "");
          data = null;
          toast("本轮生长已完成，详见执行记录");
        }),
      ),
    "primary",
  );
  dialog(
    "让年轮生长一次",
    el("div", {}, [
      el("p", {
        text:
          (project ? "更新「" + project.title + "」。" : "更新全部项目。") +
          "选择时间和渠道，补采信息后自动更新进度、里程碑、记忆与汇报。具体动作遵循已开启的运行开关；手动补采不会跳过定时任务窗口。",
      }),
      el("div", { class: "two-cols" }, [
        formField("从", since),
        formField("到", until),
      ]),
      channels,
      el("div", { class: "form-actions" }, [go]),
      status,
    ]),
  );
}
function milestoneDialog(project) {
  const goal = el("textarea", {
    value: project.goal || project.description || "",
    required: true,
  });
  const dateMatch = project.notes?.match(
    /年轮目标日期[：:]\s*(\d{4}-\d{2}-\d{2})/,
  );
  const target = el("input", {
    type: "date",
    value: project.deadline || dateMatch?.[1] || "",
    required: true,
  });
  const status = el("div", { class: "ai-answer" });
  let saved = false;
  const requestId = crypto.randomUUID(),
    planId = crypto.randomUUID();
  const go = btn(
    "保存并基于资料规划",
    (e) =>
      quiet(
        withButton(e.currentTarget, async (progress) => {
          if (!goal.value.trim() || !target.value)
            throw new Error("请填写项目目标和目标日期");
          if (!saved) {
            const fields = data.fields.projects,
              values = {};
            values[fields.goal ? "goal" : "description"] = goal.value;
            if (fields.deadline) values.deadline = target.value;
            else if (fields.notes)
              values.notes =
                (project.notes || "")
                  .replace(/年轮目标日期[：:]\s*\d{4}-\d{2}-\d{2}/g, "")
                  .trim() +
                "\n年轮目标日期：" +
                target.value;
            else
              throw new Error(
                "请在 AI 表格添加“目标日期”日期字段，并在接入向导重新绑定。",
              );
            await run(
              "mutate",
              {
                op: "update",
                role: "projects",
                record_id: project.id,
                revision: project.revision,
                values,
                request_id: requestId,
              },
              progress,
            );
            saved = true;
            goal.disabled = target.disabled = true;
          }
          const r = (
            await run(
              "plan_milestones",
              { project_id: project.id, request_id: planId },
              progress,
            )
          ).value;
          status.textContent = r.pending?.length
            ? r.pending.join("\n")
            : "倒排完成，已回读验证。新增或调整 " +
              r.projects.reduce((sum, p) => sum + p.changed.length, 0) +
              " 个节点；人工节点和已完成节点保留。";
          data = (await run("snapshot")).value;
          renderProject($("#content"));
        }),
      ),
    "primary",
  );
  dialog(
    "基于项目资料规划里程碑",
    el("div", {}, [
      el("p", {
        text: "结合项目记录、文档记忆和已有节点规划交付顺序。只有目标和日期时不会强行编排；请先采集资料或接入项目记忆。节点是计划，到期不等于完成。",
      }),
      formField("项目目标", goal),
      formField("目标日期", target),
      go,
      status,
    ]),
  );
}

function groupPicker(onSelect) {
  const query = el("input", { placeholder: "输入群名称关键词" }),
    matches = el("div", {}),
    status = el("p", { class: "subtle" });
  const search = btn("搜索群聊", (e) =>
    quiet(
      withButton(e.currentTarget, async () => {
        const r = (await run("group_search", { query: query.value })).value;
        matches.replaceChildren(
          ...r.groups.map((group) =>
            btn(group.name, () =>
              onSelect({ ...group, search_id: r.search_id }),
            ),
          ),
        );
        status.textContent = r.groups.length
          ? "请选择具体群聊。"
          : "没有匹配群聊。";
      }),
    ),
  );
  return el("div", {}, [
    el("div", { class: "actions" }, [query, search]),
    status,
    matches,
  ]);
}

function reportSendDialog(project, report) {
  let group = null,
    submitted = null;
  const chosen = el("p", { text: "尚未选择发送群" }),
    status = el("p", {}),
    message = el("textarea", {
      value:
        project.title +
        " · 阶段汇报\n" +
        report.since +
        " — " +
        report.until +
        "\n\n" +
        report.summary +
        "\n\n完整汇报：" +
        report.url,
      rows: 12,
    });
  const picker = groupPicker((value) => {
    group = value;
    chosen.textContent = "发送到：" + value.name;
  });
  const go = btn(
    "发送到所选群",
    (e) =>
      quiet(
        withButton(e.currentTarget, async (progress) => {
          if (!group) throw new Error("请先选择接收群");
          submitted ||= {
            request_id: crypto.randomUUID(),
            project_id: project.id,
            report_id: report.report_id,
            search_id: group.search_id,
            group_id: group.id,
            message: message.value,
          };
          message.disabled = true;
          const r = (await run("send_report", submitted, progress)).value;
          status.textContent = "已确认投递到：" + r.group.name;
          go.disabled = true;
        }),
      ),
    "primary",
  );
  dialog(
    "发送项目汇报",
    el("div", {}, [picker, chosen, formField("消息预览", message), go, status]),
  );
}
function todoDialog() {
  const title = el("input", {
    required: true,
    placeholder: "描述一个可以完成的具体动作",
  });
  const project = select(
    [["", "请选择项目"], ...data.projects.map((p) => [p.id, p.title])],
    selected,
  );
  project.required = true;
  const records = el("select", { multiple: true, size: 4 });
  function update() {
    records.replaceChildren(
      ...data.records
        .filter((r) => r.project_ids?.includes(project.value))
        .map((r) => el("option", { value: r.id, text: r.title })),
    );
  }
  project.onchange = update;
  update();
  const due = el("input", { type: "datetime-local" });
  const error = el("div", { class: "form-error" });
  const save = el("button", {
    type: "submit",
    class: "primary",
    text: "创建我的待办",
  });
  const form = el("form", {}, [
    formField("待办标题", title),
    formField("关联项目", project),
    formField(
      "关联项目记录（可多选）",
      records,
      "以后完成这项待办时，一起更新这些记录。",
    ),
    formField("截止时间（可选）", due),
    error,
    el("div", { class: "form-actions" }, [save]),
  ]);
  const id = crypto.randomUUID();
  form.onsubmit = async (event) => {
    event.preventDefault();
    save.disabled = true;
    try {
      await run(
        "mutate",
        {
          request_id: id,
          op: "create_todo",
          title: title.value,
          project_id: project.value,
          record_ids: [...records.selectedOptions].map((o) => o.value),
          due: due.value ? new Date(due.value).toISOString() : null,
        },
        (message) => (save.textContent = message),
      );
      $("#modal").close();
      toast("已创建到本人的丰声待办（DWS）");
      navigate("todos");
    } catch (e) {
      error.textContent = e.message;
    } finally {
      save.disabled = false;
      save.textContent = "创建我的待办";
    }
  };
  dialog("新增我的待办", form);
}
function reportDialog(project) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const since = el("input", {
    type: "date",
    value: start.toLocaleDateString("en-CA"),
    required: true,
  });
  const until = el("input", {
    type: "date",
    value: today.toLocaleDateString("en-CA"),
    required: true,
  });
  const error = el("div", { class: "form-error" });
  const save = el("button", {
    type: "submit",
    class: "primary",
    text: "生成并写回项目",
  });
  const form = el("form", {}, [
    el("p", {
      text: "结合项目表格和记忆，提炼本期判断、关键变化与下一步。正文只保留重点，引用依据可展开查看。关闭窗口后仍会继续，可从右上角通知查看。",
    }),
    el("p", {
      class: "muted",
      text:
        "成稿方法：" +
        (boot.report_method?.name || "年轮默认文本") +
        " · 精简阶段回顾",
    }),
    el("div", { class: "two-cols" }, [
      formField("开始日期", since),
      formField("结束日期", until),
    ]),
    btn("本月", () => {
      since.value = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ).toLocaleDateString("en-CA");
      until.value = today.toLocaleDateString("en-CA");
    }),
    error,
    el("div", { class: "form-actions" }, [save]),
  ]);
  const requestId = crypto.randomUUID();
  let submitted = false;
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (submitted) return;
    save.disabled = true;
    error.textContent = "";
    try {
      const { job_id } = await api("/api/actions", {
        op: "report",
        data: {
          project_id: project.id,
          since: since.value,
          until: until.value,
          request_id: requestId,
        },
      });
      submitted = true;
      form.querySelectorAll("input,button").forEach((node) => {
        node.disabled = true;
      });
      save.textContent = "报告任务已提交";
      form.append(
        taskPanel({
          id: job_id,
          op: "report",
          status: "queued",
          created_at: new Date().toISOString(),
        }),
      );
    } catch (e) {
      error.textContent = e.message;
      save.disabled = false;
    }
  };
  dialog("生成阶段汇报 · " + project.title, form);
}
function skillDialog(skill) {
  const project = select([
    ["", "全部项目"],
    ...(data?.projects?.map((p) => [p.id, p.title]) || []),
  ]);
  const question = el("textarea", {
    required: true,
    placeholder: "描述你希望这个能力帮你完成的分析或写作",
  });
  const result = el("div", { class: "ai-answer" });
  const submit = el("button", {
    type: "submit",
    class: "primary",
    text: "开始分析",
  });
  const form = el("form", {}, [
    formField("项目范围", project),
    formField("你的要求", question),
    el("div", { class: "form-actions" }, [submit]),
    result,
  ]);
  form.onsubmit = (event) => {
    event.preventDefault();
    quiet(
      withButton(submit, async (progress) => {
        const r = await run(
          "ask",
          {
            question: question.value,
            project_id: project.value || null,
            skill_id: skill.id,
          },
          progress,
        );
        result.textContent = r.value.answer;
      }),
    );
  };
  dialog(skill.name, form);
}

async function downloadArtifact(job, name) {
  const url =
    "/api/artifacts/" +
    job +
    "/" +
    name.split(/[\\/]/).map(encodeURIComponent).join("/");
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) {
    const message = await response.json();
    throw new Error(message.error || "文件读取失败");
  }
  const blob = await response.blob(),
    href = URL.createObjectURL(blob),
    link = el("a", { href, download: name.split(/[\\/]/).pop() });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

async function showWorkflow(root, jid, generation) {
  let existing = await api("/api/jobs/" + jid);
  if (existing.op === "workflow_request") {
    while (
      ["queued", "running"].includes(existing.status) &&
      generation === viewVersion
    ) {
      loading(root, existing.phase || "正在准备宿主接续材料…");
      await new Promise((r) => setTimeout(r, 700));
      existing = await api("/api/jobs/" + jid);
    }
    if (generation !== viewVersion) return;
    root.replaceChildren(
      el("section", { class: "panel" }, [
        el("h3", { text: "已准备宿主交接" }),
        el("p", {
          text: existing.result?.note || existing.error || "正在准备材料",
        }),
        el("textarea", { readOnly: true, value: existing.result?.text || "" }),
        btn("复制接续请求", () => copyRequest(existing.result?.text || "")),
      ]),
    );
    return;
  }
  const nonce = ++workflowPoll,
    status = el("p", { class: "subtle" }),
    answer = el("div", { class: "ai-answer" }),
    requests = el("div"),
    files = el("div"),
    log = el("details", {}, [el("summary", { text: "查看工具执行过程" })]);
  const cancel = btn("停止这项工作流", (event) =>
    quiet(
      withButton(event.currentTarget, async () => {
        await api("/api/workflow-control", { action: "cancel", job_id: jid });
        toast("已向 Codex 请求停止，已产生的结果会保留。");
      }),
    ),
  );
  root.replaceChildren(
    el("section", { class: "panel" }, [
      el("div", { class: "entry-top" }, [
        el("h3", { text: "执行中的工作" }),
        cancel,
      ]),
      status,
      requests,
      answer,
      files,
      log,
    ]),
  );
  let approvalKey = "",
    logKey = "";
  while (
    view === "workflows" &&
    generation === viewVersion &&
    nonce === workflowPoll
  ) {
    const job = await api("/api/jobs/" + jid),
      terminal = ["succeeded", "failed", "interrupted"].includes(job.status);
    status.textContent = terminal
      ? job.error || "宿主已结束本次执行，请查看实际结果与产物。"
      : job.phase || "正在排队";
    status.className = job.error ? "form-error" : "subtle";
    cancel.hidden = terminal;
    answer.textContent =
      job.result?.answer || job.answer || job.live_text || "";
    const pending = (job.approvals || []).filter((a) => a.status === "pending");
    const nextKey = JSON.stringify(pending.map((a) => [a.id, a.status]));
    if (nextKey !== approvalKey) {
      approvalKey = nextKey;
      requests.replaceChildren();
      for (const approval of pending)
        requests.append(approvalCard(job, approval));
    }
    const nextLog = JSON.stringify(job.timeline || []);
    if (log.open && nextLog !== logKey) {
      logKey = nextLog;
      log.replaceChildren(
        el("summary", { text: "查看工具执行过程" }),
        el("pre", {
          class: "execution-log",
          text: (job.timeline || [])
            .map((entry) => JSON.stringify(entry.item, null, 2))
            .join("\n\n"),
        }),
      );
    }
    if (terminal) {
      const artifacts = job.result?.artifacts || [];
      if (artifacts.length) {
        files.append(el("h3", { text: "生成的文件" }));
        for (const artifact of artifacts)
          files.append(
            btn(
              artifact.name +
                " · " +
                Math.max(1, Math.round(artifact.bytes / 1024)) +
                " KB",
              () =>
                quiet(
                  downloadArtifact(jid, artifact.name).catch((e) => {
                    notice(e.message);
                    throw e;
                  }),
                ),
            ),
          );
      }
      if (job.result?.native_requests_not_supported?.length)
        files.append(
          el("p", {
            class: "form-error",
            text: "部分请求需要在 Codex 原生界面处理，本次没有自动批准这些请求。",
          }),
        );
      // Logs should remain expandable after a completed task stops polling.
      log.replaceChildren(
        el("summary", { text: "查看工具执行过程" }),
        el("pre", {
          class: "execution-log",
          text: (job.timeline || [])
            .map((entry) => JSON.stringify(entry.item, null, 2))
            .join("\n\n"),
        }),
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function approvalCard(job, approval) {
  const params = approval.params,
    card = el("div", { class: "approval-card" }),
    error = el("p", { class: "form-error" });
  card.append(
    el("h3", {
      text:
        approval.method === "item/tool/requestUserInput"
          ? "Codex 需要补充信息"
          : "Codex 请求本次授权",
    }),
  );
  if (params.reason) card.append(el("p", { text: params.reason }));
  const reply = async (values) => {
    try {
      await api("/api/workflow-control", {
        action: "reply",
        job_id: job.id,
        approval_id: approval.id,
        ...values,
      });
      card.replaceChildren(
        el("p", { class: "success", text: "已回复，等待宿主继续。" }),
      );
    } catch (e) {
      error.textContent = e.message;
    }
  };
  if (approval.method === "item/tool/requestUserInput") {
    const fields = {};
    for (const q of params.questions) {
      if (q.isSecret) {
        card.append(
          el("p", {
            class: "form-error",
            text: "这项信息涉及凭据，请在宿主专用授权界面处理。年轮不会代填凭据。",
          }),
        );
        continue;
      }
      const input = q.options?.length
        ? select([
            ["", "请选择"],
            ...q.options.map((o) => [
              o.label,
              o.label + (o.description ? " · " + o.description : ""),
            ]),
          ])
        : el("textarea");
      fields[q.id] = input;
      card.append(formField(q.question, input));
    }
    card.append(
      btn(
        "提交回答",
        () =>
          reply({
            answers: Object.fromEntries(
              Object.entries(fields).map(([id, input]) => [id, input.value]),
            ),
          }),
        "primary",
      ),
    );
  } else {
    const file = approval.method === "item/fileChange/requestApproval";
    const change = (job.timeline || []).findLast(
      (e) => e.item.id === params.itemId,
    )?.item;
    const concrete = file
      ? change?.changes
        ? JSON.stringify(change.changes, null, 2)
        : null
      : params.command;
    card.append(
      el("pre", {
        class: "execution-log",
        text:
          concrete ||
          "宿主未提供具体改动，请在原生界面核验；页面不会代为批准。",
      }),
    );
    if (params.cwd)
      card.append(
        el("p", { class: "form-help", text: "执行位置：" + params.cwd }),
      );
    const actions = el("div", { class: "actions" });
    if (
      concrete &&
      (!params.availableDecisions ||
        params.availableDecisions.includes("accept"))
    )
      actions.append(
        btn("允许本次", () => reply({ decision: "accept" }), "primary"),
      );
    actions.append(
      btn("拒绝", () => reply({ decision: "decline" })),
      btn("取消这项工作流", () => reply({ decision: "cancel" })),
    );
    card.append(actions);
  }
  card.append(error);
  return card;
}
function schedulePanel() {
  const state = boot.scheduler || {};
  const panel = el("div", { class: "panel" }, [
    el("h3", { text: "自动生长运行状态" }),
    el("p", { text: state.message || "定时任务待核验。" }),
    el("p", {
      class: "subtle",
      text: "核验时间：" + (state.checked_at || "尚未核验"),
    }),
  ]);
  if (boot.configured)
    panel.append(
      btn(
        state.local_paused ? "解除本机暂停" : "立即暂停自动生长",
        (event) =>
          quiet(
            withButton(event.currentTarget, async (progress) => {
              const r = await run(
                "schedule_pause",
                { paused: !state.local_paused },
                progress,
              );
              toast(r.value.message);
              boot = await api("/api/bootstrap");
              await navigate(view);
            }),
          ),
        state.local_paused ? "" : "primary",
      ),
    );
  panel.append(
    el("p", {
      class: "form-help",
      text: "暂停独立生效，无需保存下面的配置。它停止启动新的定时轮次；原轮次及已提交结果会保留。解除本机暂停不会自动启用已暂停的宿主任务。",
    }),
  );
  return panel;
}

function setupStep(number, title, description, children) {
  return el("section", { class: "panel setup-step" }, [
    el("div", { class: "step-label", text: String(number).padStart(2, "0") }),
    el("div", {}, [
      el("h3", { text: title }),
      el("p", { class: "subtle", text: description }),
      ...children,
    ]),
  ]);
}
function renderSetup(root) {
  root.replaceChildren(
    heading(
      "连接你的工作空间。",
      "安装一次，带上自己的钉钉、AI 表格和记忆库。所有设置都在这里完成。",
    ),
  );
  const operations = el("div", { class: "operations-grid" });
  root.append(operations);
  quiet(renderOperationStatus(operations));
  root.append(cdbiPanel());
  const envStatus = el("p", { class: "subtle" });
  const profile = select([["", "先读取已登录账号"]]);
  const login = btn("登录钉钉", (event) =>
    quiet(
      withButton(event.currentTarget, async (progress) => {
        const r = await run("setup_login", {}, progress);
        fillProfiles(r.value);
        toast("钉钉授权完成");
      }),
    ),
  );
  function fillProfiles(result) {
    profile.replaceChildren(
      el("option", { value: "", text: "请选择账号与组织" }),
      ...(result.profiles || []).map((p) =>
        el("option", {
          value: p.profile,
          text:
            [p.corpName, p.userName].filter(Boolean).join(" · ") +
            (p.isCurrent ? "（当前）" : ""),
        }),
      ),
    );
    const current = result.profiles?.filter((p) => p.isCurrent);
    if (current?.length === 1) profile.value = current[0].profile;
  }
  root.append(
    setupStep(
      1,
      "安装环境与钉钉授权",
      "依赖只安装到你的个人目录。已有的钉钉连接工具和记忆引擎会先检测并复用。",
      [
        el("div", { class: "actions" }, [
          btn("检测环境", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run("setup_probe", {}, progress);
                envStatus.textContent =
                  "Python " +
                  r.value.python +
                  " · " +
                  r.value.platform +
                  " · " +
                  (r.value.dependencies.dws_bin ? "DWS 已接入" : "DWS 待安装");
              }),
            ),
          ),
          btn("安装 / 修复运行环境", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const installed = await run("setup_dependencies", {}, progress);
                envStatus.textContent =
                  "DWS 与记忆引擎已完成安装与版本核验。" +
                  (installed.value?.cdbi?.available === false
                    ? " CDBI：" + installed.value.cdbi.message
                    : " CDBI 已就绪。");
              }),
            ),
          ),
          login,
          btn("读取我的账号", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                fillProfiles((await run("profiles", {}, progress)).value);
              }),
            ),
          ),
        ]),
        envStatus,
        formField("账号与组织", profile),
      ],
    ),
  );
  const base = el("input", {
    type: "url",
    placeholder: "粘贴你的钉钉 AI 表格链接",
    value: boot.base_url || "",
  });
  const baseName = el("input", {
    placeholder: "例如：我的项目空间",
    value: "年轮项目空间",
  });
  const mode = select(
    [
      ["initialize", "初始化年轮所需的四张子表"],
      ["bind", "映射到已有子表与字段"],
    ],
    boot.configured ? "bind" : "initialize",
  );
  const mapping = el("div");
  let inspected = null;
  const tableMap = {},
    fieldMap = {};
  function renderMapping() {
    mapping.replaceChildren();
    for (const role of Object.keys(roleNames)) {
      const table = select([
        ["", "请选择子表"],
        ...inspected.tables.map((t) => [t.tableId, t.tableName]),
      ]);
      tableMap[role] = table;
      const fields = el("div", { class: "mapping" });
      function change() {
        fields.replaceChildren();
        fieldMap[role] = {};
        const selected = inspected.tables.find(
          (t) => t.tableId === table.value,
        );
        if (!selected) return;
        const keys = {
          projects: [
            "title",
            "status",
            "priority",
            "description",
            "goal",
            "risk",
            "report",
          ],
          records: [
            "title",
            "project_ids",
            "description",
            "date",
            "kind",
            "status",
            "site_ids",
            "milestone_ids",
            "notes",
          ],
          milestones: [
            "title",
            "project_ids",
            "date",
            "status",
            "description",
            "benefit",
            "notes",
          ],
          sites: ["title", "project_ids", "status", "notes"],
        }[role];
        for (const logical of keys) {
          const input = select([
            ["", "自动匹配 / 不绑定"],
            ...selected.fields.map((f) => [
              f.fieldId,
              f.fieldName + " · " + f.type,
            ]),
          ]);
          fieldMap[role][logical] = input;
          fields.append(
            el("label", { text: fieldLabels[logical] || logical }),
            input,
          );
        }
      }
      table.onchange = change;
      mapping.append(formField(roleNames[role] + "子表", table), fields);
    }
    mapping.hidden = mode.value !== "bind";
  }
  mode.onchange = () => (mapping.hidden = mode.value !== "bind");
  const planResult = el("div");
  const read = btn("读取表结构", (event) =>
    quiet(
      withButton(event.currentTarget, async (progress) => {
        inspected = (
          await run(
            "inspect",
            { base_url: base.value, profile: profile.value },
            progress,
          )
        ).value;
        renderMapping();
        toast("已读取 " + inspected.tables.length + " 张子表");
      }),
    ),
  );
  const preview = btn("预览并准备绑定", (event) =>
    quiet(
      withButton(event.currentTarget, async (progress) => {
        const spec = {
          base_url: base.value,
          profile: profile.value,
          mode: mode.value,
        };
        if (mode.value === "bind") {
          spec.table_map = {};
          spec.field_map = {};
          for (const role of Object.keys(tableMap)) {
            if (tableMap[role].value)
              spec.table_map[role] = tableMap[role].value;
            spec.field_map[role] = {};
            for (const [k, input] of Object.entries(fieldMap[role] || {}))
              if (input.value) spec.field_map[role][k] = input.value;
          }
        }
        const result = await run("table_plan", spec, progress);
        const planned = result.value.actions.map((action) =>
          action.op === "create_table"
            ? "新增子表：" + action.name
            : "补齐字段：" +
              result.value.names[action.role] +
              " / " +
              action.logical,
        );
        planResult.replaceChildren(
          el("p", {
            class: "success",
            text:
              mode.value === "initialize"
                ? "已检查表结构。将补齐年轮的项目、里程碑、场地和记录子表；保留已有内容。"
                : "字段兼容性检查通过，将保存你的表格映射。",
          }),
          el(
            "ul",
            {},
            planned.length
              ? planned.map((item) => el("li", { text: item }))
              : [
                  el("li", {
                    text: "已有结构兼容，只保存绑定，不新增子表或字段。",
                  }),
                ],
          ),
          btn(
            "确认执行这份方案",
            (event) =>
              quiet(
                withButton(event.currentTarget, async (message) => {
                  await run("tables_apply", { plan_job: result.job }, message);
                  boot = await api("/api/bootstrap");
                  data = null;
                  toast("表格绑定完成，并已回读验证");
                  planResult.replaceChildren(
                    el("p", {
                      class: "success",
                      text: "✓ 四张子表已接入，可继续设置记忆库。",
                    }),
                  );
                }),
              ),
            "primary",
          ),
        );
      }),
    ),
  );
  root.append(
    setupStep(
      2,
      "初始化或绑定 AI 表格",
      "每个人都可以用自己的表。首次使用可自动建好四张子表；已有结构则通过下拉选项完成映射。",
      [
        formField("AI 表格链接", base),
        el("div", { class: "actions" }, [read]),
        el("details", {}, [
          el("summary", { text: "还没有合适的 AI 表格？" }),
          formField("新表名称", baseName),
          btn("在我的钉钉创建新表", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const result = await run(
                  "create_resource",
                  {
                    kind: "base",
                    name: baseName.value,
                    profile: profile.value,
                  },
                  progress,
                );
                base.value = result.value.base_url;
                toast("已创建你的 AI 表格");
              }),
            ),
          ),
        ]),
        formField("接入方式", mode),
        mapping,
        el("div", { class: "actions" }, [preview]),
        planResult,
      ],
    ),
  );
  const brainMode = select(
    [
      ["new", "创建独立记忆空间（推荐）"],
      ["existing", "连接已有独立记忆空间"],
    ],
    boot.memory_connected ? "existing" : "new",
  );
  const brainDir = el("input", {
    value: boot.memory?.directory || "",
    placeholder: "已有独立记忆空间的工作目录",
  });
  const brainHome = el("input", {
    value: boot.memory?.home || "",
    placeholder: "独立记忆空间配置目录（可选）",
  });
  const existing = el("div", { hidden: !boot.memory_connected }, [
    formField("工作目录", brainDir),
    formField("配置目录", brainHome),
  ]);
  brainMode.onchange = () => (existing.hidden = brainMode.value !== "existing");
  const brainStatus = el("p", {
    class: "subtle",
    text: boot.memory_connected
      ? "已连接独立记忆空间；重新接入前请确认所选目录。"
      : "",
  });
  root.append(
    setupStep(
      3,
      "接入你的独立记忆空间",
      "年轮会准备所需的记忆引擎，并创建属于你的独立记忆空间，不需要额外的模型 API Key。",
      [
        formField("记忆库", brainMode),
        el("details", {}, [
          el("summary", { text: "已有记忆空间的兼容说明" }),
          el("p", {
            class: "subtle",
            text: "当前记忆引擎为 GBrain。连接已有空间需选择兼容的 GBrain 工作目录；其他记忆工具的目录目前不能直接接入。创建新空间时，年轮会准备所需依赖。",
          }),
        ]),
        existing,
        btn(
          "安装 / 连接并验证",
          (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const result = await run(
                  "memory_connect",
                  {
                    mode: brainMode.value,
                    directory: brainDir.value || null,
                    brain_home: brainHome.value || null,
                  },
                  progress,
                );
                brainStatus.textContent =
                  "✓ 独立记忆空间已完成初始化、写入、回读与检索验证。";
                boot = await api("/api/bootstrap");
              }),
            ),
          "primary",
        ),
        brainStatus,
      ],
    ),
  );
  const hostChoice = select(
    Object.entries(boot.hosts).map(([key, meta]) => [key, meta.name]),
    boot.harness.provider,
  );
  const hostMode = select([]);
  const binaryPath = el("input", {
    placeholder: "CLI 路径留空自动识别",
    value: boot.harness.binary || "",
  });
  const harnessStatus = el("p", { class: "subtle" });
  const hostHelp = el("p", { class: "aside-note" });
  function updateHostModes() {
    const meta = boot.hosts[hostChoice.value];
    hostMode.replaceChildren(
      ...meta.modes.map((mode) =>
        el("option", {
          value: mode,
          text: mode === "cli" ? "由年轮调用已登录的 CLI" : "在宿主中接续",
        }),
      ),
    );
    if (hostChoice.value === boot.harness.provider)
      hostMode.value = boot.harness.mode;
    binaryPath.hidden = hostMode.value !== "cli";
    hostHelp.textContent = meta.embedded_workflow
      ? "可在页面运行分析与工具工作流；需要授权时展示宿主请求。"
      : "工具工作流在宿主原生界面执行。接续模式会保留分析请求，返回结果后由年轮继续校验与写入。";
  }
  hostChoice.onchange = () => {
    binaryPath.value = "";
    updateHostModes();
  };
  hostMode.onchange = () => {
    binaryPath.hidden = hostMode.value !== "cli";
  };
  updateHostModes();
  const selectedHost = () => ({
    provider: hostChoice.value,
    mode: hostMode.value,
    binary: binaryPath.value || null,
  });
  root.append(
    setupStep(
      4,
      "选择 AI 宿主",
      "年轮管理项目流程，宿主负责理解与执行。使用宿主已有登录，不保存模型账号或密钥。切换宿主不会更换数据，也不会扩大采集范围。",
      [
        formField("使用哪个应用", hostChoice),
        formField("如何协作", hostMode),
        binaryPath,
        hostHelp,
        el("div", { class: "actions" }, [
          btn("检查连接", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run("harness_status", selectedHost(), progress);
                harnessStatus.textContent = r.value.message;
              }),
            ),
          ),
          btn(
            "使用这个宿主",
            (event) =>
              quiet(
                withButton(event.currentTarget, async (progress) => {
                  const r = await run(
                    "harness_connect",
                    selectedHost(),
                    progress,
                  );
                  harnessStatus.textContent = r.value.message;
                  boot = await api("/api/bootstrap");
                  toast("已保存宿主；定时负责人保持原设置");
                }),
              ),
            "primary",
          ),
          btn("准备宿主接入说明", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run(
                  "host_export",
                  { provider: hostChoice.value },
                  progress,
                );
                dialog(
                  "在 " + boot.hosts[hostChoice.value].name + " 接入",
                  el("div", {}, [
                    el("p", {
                      text: "接入材料已准备好。到该应用中发送以下请求；生成文件不代表宿主已启用。",
                    }),
                    el("textarea", { readOnly: true, value: r.value.text }),
                    btn("复制接入请求", () => copyRequest(r.value.text)),
                  ]),
                );
              }),
            ),
          ),
        ]),
        harnessStatus,
      ],
    ),
  );
  const timerHost = select(
    Object.entries(boot.hosts).map(([key, meta]) => [key, meta.name]),
    boot.scheduler.owner || "codex",
  );
  const preferences = boot.preferences || {},
    schedule = preferences.schedule || {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      growth_hours: [10, 12, 14, 16, 18, 20],
      report_weekday: "TH",
      report_hour: 9,
    };
  const timezone = el("input", { value: schedule.timezone });
  const scheduleEnabled = el("input", {
    type: "checkbox",
    checked: schedule.enabled !== false,
  });
  const hours = el("div", { class: "actions" });
  const hourInputs = [];
  for (let hour = 0; hour < 24; hour++) {
    const input = el("input", {
      type: "checkbox",
      checked: schedule.growth_hours.includes(hour),
    });
    hourInputs.push(input);
    hours.append(
      el("label", { class: "check" }, [
        input,
        String(hour).padStart(2, "0") + ":00",
      ]),
    );
  }
  const weekday = select(
    [
      ["MO", "周一"],
      ["TU", "周二"],
      ["WE", "周三"],
      ["TH", "周四"],
      ["FR", "周五"],
      ["SA", "周六"],
      ["SU", "周日"],
    ],
    schedule.report_weekday,
  );
  const reportHour = select(
    Array.from({ length: 24 }, (_, i) => [
      i,
      String(i).padStart(2, "0") + ":00",
    ]),
    schedule.report_hour,
  );
  const sourceBox = el("div", { class: "two-cols" }),
    switchBox = el("div", { class: "two-cols" });
  const sources = {},
    switches = {};
  for (const [k, label] of Object.entries({
    minutes: "AI 听记",
    lark_minutes: "飞书：我拥有的妙记（需已安装并登录飞书 CLI）",
    mentions: "群聊中 @我",
    direct: "我的单聊",
    groups: "我选择的群聊（不限于 @我）",
    mail: "我选择的邮箱",
    codex: "本机 Codex 人类会话",
    inbox: "其他宿主主动交付的人类会话",
    portal: "工作台已完成工作流的人类请求",
  })) {
    const input = el("input", {
      type: "checkbox",
      checked: preferences.sources?.[k] === true,
    });
    sources[k] = input;
    sourceBox.append(el("label", { class: "check" }, [input, label]));
  }
  for (const [k, label] of Object.entries({
    table_writes: "同步项目进度与记录",
    todos: "创建本人的待办",
    completion: "识别明确完成并同步状态",
    gbrain: "写入项目记忆",
    digest: "向本人钉钉推送摘要",
    reports: "生成阶段汇报",
    milestone_planning: "基于项目资料自动规划里程碑",
    continuous_reports: "每轮生长后自动更新阶段汇报",
  })) {
    const input = el("input", {
      type: "checkbox",
      checked: preferences.switches?.[k] === true,
    });
    switches[k] = input;
    switchBox.append(el("label", { class: "check" }, [input, label]));
  }
  const folder = el("input", {
    value: preferences.report_folder || "",
    placeholder: "粘贴钉钉文件夹链接，或点击下面创建",
  });
  let selectedGroups = [...(preferences.groups || [])];
  const groupList = el("div", { class: "actions" });
  const paintGroups = () =>
    groupList.replaceChildren(
      ...selectedGroups.map((group) =>
        btn(group.name + " ×", () => {
          selectedGroups = selectedGroups.filter((x) => x.id !== group.id);
          paintGroups();
        }),
      ),
    );
  paintGroups();
  const groupSearch = groupPicker((group) => {
    if (!selectedGroups.some((x) => x.id === group.id))
      selectedGroups.push(group);
    paintGroups();
  });
  const mailbox = select(
    [
      ["", "请选择本人邮箱"],
      ...(preferences.mailbox
        ? [[preferences.mailbox, preferences.mailbox]]
        : []),
    ],
    preferences.mailbox || "",
  );
  const loadMail = btn("读取我的邮箱", (e) =>
    quiet(
      withButton(e.currentTarget, async () => {
        const emails = (await run("mailboxes")).value.emails,
          old = mailbox.value;
        mailbox.replaceChildren(
          el("option", { value: "", text: "请选择本人邮箱" }),
          ...emails.map((email) => el("option", { value: email, text: email })),
        );
        mailbox.value = emails.includes(old) ? old : "";
      }),
    ),
  );
  const lookback = select(
    [
      [24, "最近 24 小时"],
      [48, "最近 48 小时（推荐）"],
      [72, "最近 72 小时"],
      [168, "最近 7 天"],
    ],
    preferences.minutes_lookback_hours || 48,
  );
  const notifyMode = select(
    [
      ["every_run", "每轮发送摘要"],
      ["changes", "仅有实际动作、新待核事项或覆盖变化时发送"],
    ],
    preferences.notification_mode || "every_run",
  );
  const scheduleState = el("p", {
    class: boot.scheduler.active ? "success" : "subtle",
    text: boot.scheduler.message || "当前尚未完成宿主调度验证。",
  });
  root.append(
    setupStep(
      5,
      "选择来源与自动生长时间",
      "先明确读取哪些来源、允许哪些操作。保存设置后会与宿主调度核验，未同步的时间不会显示为已生效。",
      [
        el("label", { class: "check" }, [
          scheduleEnabled,
          "启用自动生长（关闭后暂停自动操作，手动工作仍可用）",
        ]),
        formField("运行时区", timezone),
        formField("听记与妙记滚动补采范围", lookback),
        el("p", {
          class: "form-help",
          text: "每轮回看近期会议，补采夜间会议和晚生成的内容。来源编号与内容版本去重，不需要在早上另跑一次昨天。失败渠道独立保留窗口，空列表不会自动认定故障。",
        }),
        formField("本人钉钉摘要", notifyMode),
        formField("每日生长时间", hours),
        el("div", { class: "two-cols" }, [
          formField("阶段汇报日期", weekday),
          formField("阶段汇报时间", reportHour),
        ]),
        el("h3", { text: "信息来源" }),
        sourceBox,
        formField(
          "采集群聊",
          el("div", {}, [groupSearch, groupList]),
          "只有这里选定的群会进入群聊采集。",
        ),
        formField(
          "采集邮箱",
          el("div", { class: "actions" }, [mailbox, loadMail]),
        ),
        el("h3", { text: "自动操作" }),
        switchBox,
        formField("阶段汇报文件夹", folder),
        btn("创建我的阶段汇报文件夹", (event) =>
          quiet(
            withButton(event.currentTarget, async (progress) => {
              const r = await run(
                "create_resource",
                {
                  kind: "folder",
                  name: "年轮阶段汇报",
                  profile: profile.value,
                },
                progress,
              );
              folder.value = r.value.nodeId;
            }),
          ),
        ),
        el("div", { class: "actions" }, [
          btn(
            "保存运行设置",
            (event) =>
              quiet(
                withButton(event.currentTarget, async (progress) => {
                  const result = await run(
                    "configure",
                    {
                      schedule: {
                        enabled: scheduleEnabled.checked,
                        timezone: timezone.value,
                        growth_hours: hourInputs.flatMap((input, index) =>
                          input.checked ? [index] : [],
                        ),
                        report_weekday: weekday.value,
                        report_hour: Number(reportHour.value),
                      },
                      minutes_lookback_hours: Number(lookback.value),
                      notification_mode: notifyMode.value,
                      groups: selectedGroups,
                      mailbox: mailbox.value,
                      sources: Object.fromEntries(
                        Object.entries(sources).map(([k, input]) => [
                          k,
                          input.checked,
                        ]),
                      ),
                      switches: Object.fromEntries(
                        Object.entries(switches).map(([k, input]) => [
                          k,
                          input.checked,
                        ]),
                      ),
                      report_folder: folder.value || null,
                    },
                    progress,
                  );
                  scheduleState.textContent = result.value.scheduler_active
                    ? "设置已保存，原生调度已验证。"
                    : scheduleEnabled.checked
                      ? "设置已保存；请完成下方首次定时接入。"
                      : "设置已保存，自动生长已暂停。";
                  boot = await api("/api/bootstrap");
                  scheduleState.textContent = boot.scheduler.message;
                }),
              ),
            "primary",
          ),
          btn("检查整体接入", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run("setup_doctor", {}, progress);
                scheduleState.textContent = r.value.ready
                  ? "✓ 接入验证通过。" + (r.value.scheduler?.message || "")
                  : "接入未全部完成：" +
                    (!r.value.memory?.verified
                      ? "独立记忆空间待读写验证；"
                      : "") +
                    (!r.value.scheduler?.active ? "宿主定时任务待同步。" : "");
              }),
            ),
          ),
        ]),
        scheduleState,
        el("p", {
          class: "aside-note",
          text:
            "定时唤醒与 AI 推理可以由不同宿主负责，每个安装只保留一个定时负责人。当前负责人：" +
            (boot.scheduler.owner ||
              (boot.scheduler.registered ? "codex" : "尚未接入")) +
            "。Codex 支持原生核验；其他宿主需在其应用内创建并核验周期任务。睡眠后最多补跑最近一天内各一轮。",
        }),
        el("div", { class: "actions" }, [
          formField("定时接入的目标宿主（仅生成说明）", timerHost),
          btn("复制定时接入请求", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run(
                  "scheduler_request",
                  { provider: timerHost.value },
                  progress,
                );
                await navigator.clipboard.writeText(r.value.text);
                toast("已复制。到目标宿主完成原生接入，并核验实际运行状态。");
              }),
            ),
          ),
          btn("核验当前 Codex 控制器", (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run("scheduler_check", {}, progress);
                boot = await api("/api/bootstrap");
                scheduleState.textContent = r.value.active
                  ? "✓ 控制器已核验，页面时间设置已生效。"
                  : "✓ 控制器已核验，当前自动生长暂停。";
              }),
            ),
          ),
        ]),
      ],
    ),
  );
}
function showLaunchHelp() {
  document.title = "年轮 · 打开工作台";
  const prompt = el("textarea", {
    readOnly: true,
    value: "请打开我已安装的年轮工作台。",
    "aria-label": "发送给 AI 宿主的打开请求",
  });
  const status = el("p", { role: "status", class: "subtle" });
  document.body.replaceChildren(
    el("main", { class: "launch-help" }, [
      el("div", { class: "brand" }, [
        el("span", { class: "rings", text: "◎", "aria-hidden": "true" }),
        el("span", { text: "年轮" }),
      ]),
      el("h1", { text: "从「打开年轮」进入工作台" }),
      el("p", {
        text: "你当前打开的是页面文件。请通过启动器打开工作台，连接自己的项目、待办和记忆。",
      }),
      el("ol", {}, [
        el("li", { text: "回到解压后的「年轮安装版」文件夹。" }),
        el("li", {
          text: "Mac 双击「打开年轮.command」；Windows 双击「打开年轮.cmd」。",
        }),
        el("li", {
          text: "首次使用请先双击对应的「安装年轮」文件，按向导完成接入。",
        }),
      ]),
      el("h2", { text: "也可以让 AI 宿主帮你打开" }),
      prompt,
      btn(
        "复制打开请求",
        async () => {
          try {
            await navigator.clipboard.writeText(prompt.value);
            status.textContent = "已复制。回到你的 AI 应用粘贴发送即可。";
          } catch {
            prompt.focus();
            prompt.select();
            status.textContent =
              "请复制已选中的文字，回到你的 AI 应用粘贴发送。";
          }
        },
        "primary",
      ),
      status,
      el("p", {
        class: "subtle",
        text: "项目仍在你的 AI 表格里，记忆仍在你的独立记忆空间里。",
      }),
    ]),
  );
}
if (localFile) showLaunchHelp();
else initialize();

async function copyRequest(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("已复制，到所选宿主粘贴发送。");
  } catch {
    dialog(
      "复制以下请求",
      el("textarea", { readOnly: true, value: text, "aria-label": "接续请求" }),
    );
  }
}

async function renderOperationStatus(root) {
  root.append(schedulePanel());
  if (!boot.configured) return;
  const recoveryState = (await run("recovery_status")).value;
  if (!recoveryState.active)
    root.append(
      el("div", { class: "panel" }, [
        el("h3", { text: "待完成的原轮次" }),
        el("p", { text: "当前没有未完成的生长轮次。" }),
        btn("查看执行历史", () => navigate("runs")),
      ]),
    );
  if (recoveryState.active) {
    const panel = el("div", { class: "panel" }, [
      el("h3", { text: "原轮次有待完成步骤" }),
      el("p", {
        text:
          "已核验 " +
          recoveryState.verified_count +
          " 项动作。核验原结果只回读，不会重新提交；核验后可继续剩余步骤。",
      }),
    ]);
    const names = {
      create_record: "项目记录",
      update_status: "状态更新",
      create_milestone: "里程碑",
      create_todo: "待办创建",
      complete_todo: "待办关闭",
      brain: "记忆",
      digest: "摘要",
    };
    for (const item of recoveryState.items)
      panel.append(
        el("p", {
          text:
            { verified: "已核验", unknown: "结果待核验", pending: "尚未完成" }[
              item.status
            ] +
            " · " +
            (names[item.op] || item.op) +
            " · " +
            item.title,
        }),
      );
    const actions = el("div", { class: "actions" });
    if (recoveryState.needs_reconciliation)
      actions.append(
        btn(
          "核验原结果",
          (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                const r = await run(
                  "reconcile_growth",
                  { run_id: recoveryState.run_id },
                  progress,
                );
                toast(r.value.message);
                await navigate("setup");
              }),
            ),
          "primary",
        ),
      );
    else
      actions.append(
        btn(
          "继续原轮次剩余步骤",
          (event) =>
            quiet(
              withButton(event.currentTarget, async (progress) => {
                await run(
                  "resume_growth",
                  { run_id: recoveryState.run_id },
                  progress,
                );
                toast("原轮次已完成；定时任务开关保持原状态。");
                await navigate("setup");
              }),
            ),
          "primary",
        ),
      );
    panel.append(actions);
    root.append(panel);
  }
}

async function renderTodos(root, generation) {
  return renderTodos23(root, generation);
}
