/* Local task feedback and linked project views. No remote script or data service. */
function taskPanel(job) {
  const box = el("section", {
    class: "task-progress",
    "aria-label": "任务进度",
  });
  const title = el("strong"),
    status = el("span"),
    clock = el("p", { class: "subtle" }),
    phase = el("p"),
    history = el("details", {}, [el("summary", { text: "查看处理步骤" })]),
    lines = el("ol"),
    actions = el("div", { class: "actions" }),
    output = el("div", { class: "ai-answer" });
  history.append(lines);
  box.append(
    el("div", { class: "entry-top" }, [title, status]),
    phase,
    clock,
    actions,
    history,
    output,
    el("p", {
      class: "form-help",
      text: job.op === "report" ? "关闭窗口后仍会继续。可从右上角通知回来查看；失败后重试会保留已完成步骤。" : "关闭窗口不会取消任务。在右上角通知或执行记录中，可查看状态、结果和接续步骤。",
    }),
  );
  let latest = job, timer, polling = false, ticks = 0;
  const stages = el("div", { class: "report-stages", "aria-label": "汇报处理阶段" });
  if (job.op === "report") box.insertBefore(stages, phase);
  async function retryReport() {
    const { job_id } = await api("/api/actions", { op: "resume", data: { job_id: latest.id } });
    update(await api("/api/jobs/" + job_id));
  }
  function update(value) {
    latest = value;
    box.dataset.job = value.id;
    title.textContent = jobNames[value.op] || value.op;
    status.textContent =
      {
        queued: "排队中",
        running: "执行中",
        waiting_harness: "等待你的宿主",
        succeeded: "已完成",
        failed: "未完成",
        interrupted: "需要恢复",
        cancelled: "已停止",
      }[value.status] || value.status;
    if (value.status === "succeeded" && value.result?.failed)
      status.textContent = value.result.succeeded
        ? "部分成功，需处理失败项"
        : "全部未完成，请查看原因";
    phase.textContent =
      value.error && value.status !== "waiting_harness"
        ? value.error
        : value.phase || status.textContent;
    lines.replaceChildren(
      ...(value.progress || []).map((p) =>
        el("li", { text: p.at.replace("T", " ") + " · " + p.message }),
      ),
    );
    actions.replaceChildren();
    if (value.op === "report") {
      const messages = (value.progress || []).map(p => p.message);
      const labels = ["读取项目", "检索记忆", "AI 撰写", "生成页面", "上传报告", "写回确认"];
      const patterns = [/项目事实/, /独立记忆/, /DeepSeek|正文|自动撰写/, /排版|可视化|生成汇报并上传/, /上传报告到/, /写回项目主表|回读确认/];
      let index = -1;
      if (value.status !== "queued") index = Math.max(0, ...patterns.map((p,i) => messages.some(m => p.test(m)) ? i : -1));
      stages.replaceChildren(...labels.map((text,i) => el("span", { class: value.status === "succeeded" || i < index ? "done" : i === index ? "active" : "", text: (i + 1) + " · " + text })));
      if (value.can_cancel) actions.append(btn(value.cancel_requested ? "正在停止…" : "停止生成", e => quiet(withButton(e.currentTarget, async () => {
        await api("/api/report-control", { job_id: value.id, action: "cancel" });
        update(await api("/api/jobs/" + value.id));
      }))));
      if (value.can_resume && (value.status !== "waiting_harness" || value.automatic_report || value.handoff_ready)) {
        actions.append(btn(value.status === "waiting_harness" ? "由 DeepSeek 自动继续" : "重试此报告", e => quiet(withButton(e.currentTarget, retryReport)), "primary"));
      }
    }
    if (value.status === "waiting_harness" && value.op === "report" && value.automatic_report) {
      phase.textContent = "原报告材料已保留。点击自动继续，由本机 DeepSeek 生成并写回，无需复制请求。";
    } else if (value.status === "waiting_harness") {
      phase.textContent = "当前停在宿主分析步骤，后台没有继续推理。";
      actions.append(
        el("p", {
          text:
            "① 复制请求 → ② 在 " +
            (boot.hosts?.[value.handoff.provider]?.name ||
              value.handoff.provider) +
            " 处理并返回 → ③ 在这里继续原任务。",
        }),
        btn("复制接续请求", () => copyRequest(handoffText(value))),
        btn(
          value.handoff_ready ? "回复已收到，继续" : "检查回复并继续",
          (e) =>
            quiet(
              withButton(e.currentTarget, async () => {
                const fresh = await api("/api/jobs/" + value.id);
                if (!fresh.handoff_ready) {
                  toast("尚未收到宿主回答，请先完成第 2 步。");
                  update(fresh);
                  return;
                }
                const { job_id } = await api("/api/actions", {
                  op: "resume",
                  data: { job_id: value.id },
                });
                await pollJob(job_id, null, null);
                const next = await api("/api/jobs/" + value.id);
                update(next);
                if (next.status === "succeeded") {
                  data = null;
                  showTaskResult(output, next);
                }
              }),
            ),
          "primary",
        ),
      );
    } else if (value.can_resume && value.op !== "report")
      actions.append(
        btn("核验并重试原请求", (e) =>
          quiet(
            withButton(e.currentTarget, async () => {
              const r = await run("resume", { job_id: value.id });
              update(r.value);
              if (r.value.status === "succeeded") {
                data = null;
                showTaskResult(output, r.value);
              }
            }),
          ),
        ),
      );
    if (value.status === "succeeded") {
      showTaskResult(output, value);
      if (value.op === "workflow_request") {
        status.textContent = "接续材料已准备";
        output.append(
          el("p", {
            text: value.result?.note || "请到所选宿主执行，尚未生成最终产物。",
          }),
          btn("复制接续请求", () => copyRequest(value.result?.text || "")),
        );
      }
    }
    updateClock();
  }
  function updateClock() {
    const end =
      ["succeeded", "failed", "interrupted", "waiting_harness", "cancelled"].includes(
        latest.status,
      ) && latest.finished_at
        ? Date.parse(latest.finished_at)
        : Date.now();
    const start = Date.parse(latest.started_at || latest.created_at);
    clock.textContent =
      "本次执行 " +
      Math.max(0, Math.round((end - start) / 1000)) +
      " 秒" +
      (latest.phase_at
        ? " · 当前步骤始于 " + new Date(latest.phase_at).toLocaleTimeString()
        : "");
  }
  timer = setInterval(() => {
    if (!box.isConnected) {
      clearInterval(timer);
      return;
    }
    updateClock();
    if (latest.op === "report" && ["running", "queued"].includes(latest.status) && !polling && ++ticks % 2 === 0) {
      polling = true;
      api("/api/jobs/" + latest.id).then(update).catch(() => {
        phase.textContent = "暂时无法读取进度，后台任务不会因此取消；正在重连…";
      }).finally(() => { polling = false; });
    }
  }, 1000);
  update(job);
  box.update = update;
  return box;
}
function handoffText(job) {
  return (
    "请处理年轮等待中的分析请求。配置：" +
    boot.config_path +
    "；请求编号：" +
    job.handoff.id +
    "。读取年轮 references/host-contract.md，使用 host.py pending --id 读取完整请求，分析后通过 answer 返回。只返回分析数据，不直接写业务数据；我会在工作台继续原任务。保持原来的权限、来源和操作开关。"
  );
}
function showTaskResult(box, job) {
  const r = job.result || {};
  box.replaceChildren();
  if (job.op !== "report" && (r.answer || r.summary))
    box.append(el("p", { text: r.answer || r.summary }));
  if (r.url && /^https:\/\//.test(r.url))
    box.append(
      el("a", {
        href: r.url,
        target: "_blank",
        rel: "noopener",
        text: "打开完整汇报 ↗",
      }),
    );
  if (r.memory_pages)
    box.append(
      el("small", {
        text: "汇报结合 " + r.memory_pages.length + " 篇独立记忆页面。",
      }),
    );
  if (job.op === "report" && r.summary) {
    box.append(el("details", { class: "report-body" }, [
      el("summary", { text: "查看报告正文" }),
      el("pre", { text: r.summary, style: "white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;max-height:420px;overflow:auto" }),
    ]));
  }
  if (r.failed)
    box.append(
      el("p", {
        class: "form-error",
        text: "成功 " + r.succeeded + " 项，失败 " + r.failed + " 项。",
      }),
      ...r.items
        .filter((x) => !x.ok)
        .map((x) =>
          el("p", { text: "第 " + (x.index + 1) + " 项：" + x.error }),
        ),
    );
  if (r.pending?.length) box.append(el("p", { text: r.pending.join("\n") }));
}
async function pollJob(id, progress, panel) {
  for (;;) {
    const job = await api("/api/jobs/" + id);
    panel?.update(job);
    if (job.status === "succeeded") {
      notice("");
      return { value: job.result, job: id };
    }
    if (["waiting_harness", "failed", "interrupted", "cancelled"].includes(job.status)) {
      const e = new Error(
        job.status === "waiting_harness"
          ? "任务已保存，按上方步骤到 " +
              (boot.harness?.name || "AI 宿主") +
              " 接续。"
          : job.error || "执行中断",
      );
      e.job = job;
      throw e;
    }
    progress?.(
      job.status === "queued"
        ? "已排队，等待前一项操作完成…"
        : job.phase || "正在执行…",
    );
    await new Promise((r) => setTimeout(r, 1000));
  }
}
function applyRow(result) {
  if (!data) return;
  const row = result.row;
  if (!row) {
    data = null;
    return;
  }
  const list = data[result.role],
    i = list.findIndex((x) => x.id === row.id);
  if (i < 0) list.push(row);
  else list[i] = row;
}
function projectLabel(project) {
  return project.title + (project.number ? " · " + project.number : "");
}
function quickRecords(rows, container) {
  const selection = new Set(),
    options = data.fields.records.status.config.options.map((x) => x.name),
    choice = select(options),
    count = el("span", { class: "subtle" });
  const all = el("input", {
    type: "checkbox",
    "aria-label": "选择当前项目全部记录",
  });
  const runBulk = btn(
    "批量更新状态",
    () => {
      const chosen = rows.filter((x) => selection.has(x.id));
      if (!chosen.length) {
        toast("先勾选需要处理的记录");
        return;
      }
      bulkDialog(
        "更新 " + chosen.length + " 条记录为“" + choice.value + "”",
        chosen.map((row) => ({
          op: "update",
          role: "records",
          record_id: row.id,
          revision: row.revision,
          values: { status: choice.value },
        })),
        () => {
          data = null;
          navigate("projects");
        },
      );
    },
    "primary",
  );
  const bar = el("div", { class: "toolbar" }, [
    el("label", { class: "check" }, [all, "全选"]),
    count,
    choice,
    runBulk,
  ]);
  container.append(bar);
  function sync() {
    count.textContent = "已选 " + selection.size + " 条";
    all.checked = selection.size === rows.length && rows.length > 0;
    all.indeterminate = selection.size > 0 && !all.checked;
  }
  all.onchange = () => {
    selection.clear();
    if (all.checked) rows.forEach((r) => selection.add(r.id));
    container
      .querySelectorAll("[data-record-select]")
      .forEach((c) => (c.checked = selection.has(c.dataset.recordSelect)));
    sync();
  };
  sync();
  return (row) => {
    const check = el("input", {
      type: "checkbox",
      "aria-label": "选择 " + row.title,
      "data-record-select": row.id,
      onchange: (e) => {
        e.target.checked ? selection.add(row.id) : selection.delete(row.id);
        sync();
      },
    });
    const status = select(options, row.status);
    status.setAttribute("aria-label", "快速处理 " + row.title);
    status.onchange = () =>
      quiet(
        (async () => {
          status.disabled = true;
          try {
            const result = (
              await run("mutate", {
                request_id: crypto.randomUUID(),
                op: "update",
                role: "records",
                record_id: row.id,
                revision: row.revision,
                values: { status: status.value },
              })
            ).value;
            applyRow(result);
            renderProject($("#content"));
            toast("状态已更新并回读");
          } catch (e) {
            status.value = row.status;
            notice(e.message);
            throw e;
          } finally {
            status.disabled = false;
          }
        })(),
      );
    return el("div", { class: "actions" }, [
      check,
      el("label", {}, ["快速处理 ", status]),
      btn("编辑", () => editRow("records", row)),
    ]);
  };
}
function bulkDialog(title, items, done) {
  let previousJob = null;
  const request = { request_id: crypto.randomUUID(), items },
    status = el("div");
  const submit = btn(
    "确认处理",
    (e) =>
      quiet(
        withButton(e.currentTarget, async () => {
          const response = previousJob
            ? await run("resume", { job_id: previousJob })
            : await run("bulk_mutate", request);
          const r = previousJob ? response.value.result : response.value;
          if (!previousJob) previousJob = response.job;
          r.items
            .filter((x) => x.ok)
            .forEach((x) => {
              if (x.result.row) applyRow(x.result);
            });
          status.replaceChildren(
            el("p", {
              text: "成功 " + r.succeeded + " 项；失败 " + r.failed + " 项。",
            }),
            ...r.items
              .filter((x) => !x.ok)
              .map((x) =>
                el("p", {
                  class: "form-error",
                  text: "第 " + (x.index + 1) + " 项：" + x.error,
                }),
              ),
          );
          if (!r.failed) {
            submit.hidden = true;
            status.append(
              btn("完成并刷新", () => {
                $("#modal").close();
                done();
              }),
            );
          }
        }),
      ),
    "primary",
  );
  dialog(
    title,
    el("div", {}, [
      el("p", {
        text: "将逐项更新并回读。已成功的项目保留，失败项单独显示；再次处理沿用同一请求。",
      }),
      submit,
      status,
    ]),
  );
}

function svgNode(tag, attrs = {}) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}
function setupNotifications() {
  const button = $("#notifications");
  if (!button) return;
  let jobs = [], previous = null, redraw = null;
  async function check(force = false) {
    if (!token || (document.hidden && !force)) return;
    try {
      jobs = (await api("/api/notifications")).jobs;
      if (previous) for (const j of jobs) {
        if (j.op === "report" && ["running", "queued"].includes(previous[j.id]) && ["succeeded", "failed"].includes(j.status)) {
          toast(j.status === "succeeded" ? (j.project_title || "阶段") + "汇报已写回，请从通知查看" : "阶段汇报未完成，可从通知查看原因并重试");
        }
      }
      previous = Object.fromEntries(jobs.map(j => [j.id, j.status]));
      const count = jobs.filter(j => ["succeeded", "failed", "interrupted", "waiting_harness", "cancelled"].includes(j.status) && !j.read).length;
      $("#notification-count").textContent = count ? String(count) : "";
      if (redraw) redraw();
    } catch {}
  }
  async function mark(items) {
    await api("/api/notifications/read", { items: items.map(j => ({ id: j.id, stamp: j.stamp })) });
    await check(true);
  }
  button.onclick = async () => {
    await check(true);
    const selected = new Set(), list = el("div", { class: "notification-list" }), failure = el("p", { class: "form-error", role: "alert" });
    const filter = select([["all", "全部通知"], ["unread", "未读通知"]]);
    filter.setAttribute("aria-label", "通知筛选");
    const all = el("input", { type: "checkbox", "aria-label": "全选当前通知" });
    const selectedButton = btn("标记所选已读", e => quiet(withButton(e.currentTarget, async () => {
      await mark(jobs.filter(j => selected.has(j.id))); selected.clear(); render();
    }).catch(error => { failure.textContent = error.message; }).finally(selectionState)));
    const markAll = btn("全部标为已读", e => quiet(withButton(e.currentTarget, async () => {
      await mark(jobs.filter(j => !j.read)); selected.clear(); render();
    }).catch(error => { failure.textContent = error.message; }).finally(selectionState)));
    const toolbar = el("div", { class: "notification-toolbar" }, [
      el("label", {}, [all, el("span", { text: "全选" })]), filter, selectedButton, markAll,
    ]);
    const panel = el("div", {}, [toolbar, failure, el("p", { class: "subtle", text: "最近 100 条通知。标记已读只清除提示；任务仍会继续，出现新结果时会再次提醒。" }), list]);
    const visible = () => jobs.filter(j => filter.value !== "unread" || !j.read);
    function selectionState() {
      const rows = visible(), count = rows.filter(j => selected.has(j.id)).length;
      all.checked = rows.length > 0 && count === rows.length;
      all.indeterminate = count > 0 && count < rows.length;
      all.disabled = !rows.length;
      selectedButton.disabled = !jobs.some(j => selected.has(j.id) && !j.read);
      selectedButton.textContent = "标记所选已读" + (selected.size ? "（" + selected.size + "）" : "");
      markAll.disabled = !jobs.some(j => !j.read);
    }
    function render() {
      list.replaceChildren();
      for (const j of visible()) {
        const checkbox = el("input", { type: "checkbox", "aria-label": "选择通知 · " + (jobNames[j.op] || j.op), checked: selected.has(j.id) });
        checkbox.onchange = () => { checkbox.checked ? selected.add(j.id) : selected.delete(j.id); selectionState(); };
        const label = (j.project_title ? j.project_title + " · " : "") + (jobNames[j.op] || j.op);
        const state = { succeeded: "已完成", failed: "未完成", waiting_harness: "待继续", running: "正在执行", queued: "排队中", interrupted: "需要恢复", cancelled: "已停止" }[j.status] || j.status;
        const open = btn(label + " · " + state, () => quiet((async () => {
          const job = j.scheduled ? null : await api("/api/jobs/" + j.id);
          await mark([j]);
          if (j.scheduled) { $("#modal").close(); await navigate("setup"); }
          else dialog(label, taskPanel(job));
        })()));
        open.append(el("small", { text: j.phase || j.created_at }));
        list.append(el("div", { class: "notification-row" + (j.read ? " is-read" : " is-unread") }, [checkbox, open, el("span", { class: "read-badge", text: j.read ? "已读" : "未读" })]));
      }
      if (!list.children.length) list.append(el("p", { text: filter.value === "unread" ? "所有通知都已读。" : "目前没有任务通知。" }));
      selectionState();
    }
    filter.onchange = () => { selected.clear(); render(); };
    all.onchange = () => { visible().forEach(j => all.checked ? selected.add(j.id) : selected.delete(j.id)); render(); };
    redraw = () => { if (panel.isConnected) render(); else redraw = null; };
    render(); dialog("任务通知", panel);
  };
  check(); setInterval(check, 10000);
}
function cdbiPanel() {
  const status = el("p", {
      class: "subtle",
      text: "CDBI 用于读取组织授权的场地数据，先检查本机 CLI。",
    }),
    url = el("input", {
      type: "url",
      placeholder: "组织官方的当前系统单文件下载地址",
    }),
    hash = el("input", { placeholder: "官方 SHA-256 校验值" }),
    path = el("input", { placeholder: "已有 CDBI 可执行文件完整路径" });
  return el("section", { class: "panel" }, [
    el("h3", { text: "丰景台 CDBI · 场地来源" }),
    status,
    el("div", { class: "actions" }, [
      btn("检测 CDBI", (e) =>
        quiet(
          withButton(e.currentTarget, async () => {
            const r = (await run("cdbi_status")).value;
            status.textContent = r.available
              ? "已找到 CDBI " +
                r.version +
                "；" +
                (r.auth?.authenticated ? "已登录" : "需要登录")
              : "未安装 CDBI · " + r.platform;
          }),
        ),
      ),
      btn("登录丰景台", (e) =>
        quiet(
          withButton(e.currentTarget, async () => {
            await run("cdbi_login");
            status.textContent = "登录流程已返回，点击检测核验。";
          }),
        ),
      ),
      btn("安装 / 复用 CDBI", (e) =>
        quiet(
          withButton(e.currentTarget, async () => {
            const r = (
              await run("cdbi_install", {
                url: url.value || undefined,
                sha256: hash.value || undefined,
              })
            ).value;
            status.textContent = r.reused
              ? "已复用本机 CDBI"
              : "CDBI 已安装并验证";
          }),
        ),
      ),
    ]),
    el("details", {}, [
      el("summary", { text: "未安装时：填写组织分发信息" }),
      el("p", {
        text: "CDBI 由组织分发。没有当前系统的官方包时，不会猜测下载地址或运行不匹配文件。填写地址与校验值即可安装，无需改代码。",
      }),
      formField("当前系统下载地址", url),
      formField("SHA-256", hash),
    ]),
    el("details", {}, [
      el("summary", { text: "指定已安装的 CLI" }),
      formField("可执行文件", path),
      btn("连接此文件", (e) =>
        quiet(
          withButton(e.currentTarget, async () => {
            await run("cdbi_connect", { path: path.value });
            status.textContent = "已连接 CDBI";
          }),
        ),
      ),
    ]),
  ]);
}
function cdbiSites(project) {
  const query = el("input", { placeholder: "搜索场地数据集" }),
    datasets = select([["", "先搜索数据集"]]),
    code = select([]),
    name = select([]),
    filter = select([["", "不额外筛选"]]),
    value = el("input", { placeholder: "筛选值，例如区域代码" }),
    preview = el("div"),
    status = el("p"),
    chosen = new Set();
  let candidate = null;
  const read = btn("读取字段", (e) =>
    quiet(
      withButton(e.currentTarget, async () => {
        const r = (await run("cdbi_fields", { dataset: datasets.value })).value;
        for (const target of [code, name, filter]) {
          target.replaceChildren(
            ...(target === filter
              ? [el("option", { value: "", text: "不额外筛选" })]
              : []),
            ...(r.columnList || []).map((c) =>
              el("option", {
                value: c.column,
                text: (c.rename || c.column) + " · " + c.column,
              }),
            ),
          );
        }
        status.textContent = "请选择场地编码、名称字段，并按需限定范围。";
      }),
    ),
  );
  const inspect = btn("预览场地", (e) =>
    quiet(
      withButton(e.currentTarget, async () => {
        chosen.clear();
        candidate = (
          await run("cdbi_preview", {
            dataset: datasets.value,
            project_id: project.id,
            code_field: code.value,
            name_field: name.value,
            filter_field: filter.value,
            filter_value: value.value,
          })
        ).value;
        preview.replaceChildren(
          ...candidate.rows.map((row) =>
            el("label", { class: "check" }, [
              el("input", {
                type: "checkbox",
                onchange: (e) =>
                  e.target.checked
                    ? chosen.add(row.code)
                    : chosen.delete(row.code),
              }),
              row.code + " · " + row.title,
            ]),
          ),
        );
        status.textContent =
          "找到 " +
          candidate.rows.length +
          " 项候选" +
          (candidate.limited ? "（只展示首 100 条，请缩小筛选范围）" : "") +
          "。选择后导入，不覆盖已有场地。";
      }),
    ),
  );
  const importButton = btn(
    "导入选中场地",
    (e) =>
      quiet(
        withButton(e.currentTarget, async () => {
          if (!candidate || !chosen.size) throw new Error("请先预览并选择场地");
          const r = (
            await run("cdbi_import", {
              dataset: datasets.value,
              preview: candidate.id,
              codes: [...chosen],
              request_id: crypto.randomUUID(),
            })
          ).value;
          status.textContent =
            "处理 " + r.items.length + " 项，已存在的场地保留。";
          data = null;
        }),
      ),
    "primary",
  );
  dialog(
    "从丰景台获取场地 · " + projectLabel(project),
    el("div", {}, [
      el("div", { class: "toolbar" }, [
        query,
        btn("搜索数据集", (e) =>
          quiet(
            withButton(e.currentTarget, async () => {
              const r = (await run("cdbi_datasets", { query: query.value }))
                .value;
              datasets.replaceChildren(
                ...r.datasets.map((d) =>
                  el("option", { value: String(d.id), text: d.name }),
                ),
              );
            }),
          ),
        ),
      ]),
      datasets,
      read,
      formField("场地编码字段", code),
      formField("场地名称字段", name),
      formField("筛选字段", filter),
      value,
      inspect,
      status,
      preview,
      importButton,
    ]),
  );
}
