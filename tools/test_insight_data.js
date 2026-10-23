import test from "node:test";
import assert from "node:assert/strict";
import {
  todoLandscape,
  capabilityLandscape,
  executionLandscape,
  projectLandscape,
  connectionLandscape,
} from "../nianlun/assets/portal/insight-data.js";

test("task groups use actual project links and place unresolved links in unassigned", () => {
  const graph = todoLandscape(
    [
      { id: "a", link: { project_id: "p" }, priority: 30 },
      { id: "b", link: { project_id: "missing" }, priority: 20 },
      { id: "c", title: "p", priority: 40 },
    ],
    [{ id: "p", title: "Project" }],
  );
  assert.equal(graph.nodes.find((n) => n.id === "p").value, 1);
  assert.equal(graph.nodes.find((n) => n.id === "unlinked").value, 2);
  assert.equal(graph.nodes.find((n) => n.id === "unlinked").urgent, 1);
  assert.deepEqual(graph.edges, []);
});

test("capability counts are derived from loaded skills and enabled identities", () => {
  const graph = capabilityLandscape(
    [
      { id: "a", group: "analysis" },
      { id: "b", group: "analysis" },
      { id: "c", group: "write" },
    ],
    new Set(["b", "unknown"]),
    (s) => s.group,
  );
  assert.equal(graph.nodes[0].value, 2);
  assert.equal(graph.nodes[0].enabled, 1);
  assert.equal(graph.nodes[1].status, "idle");
  assert.deepEqual(graph.edges, []);
});

test("execution order is chronological without fabricated dependencies", () => {
  const jobs = [
    { id: "new", created_at: "2026-10-23", status: "running" },
    { id: "old", created_at: "2026-10-22", status: "failed" },
  ];
  const graph = executionLandscape(jobs, (j) => j.status);
  assert.deepEqual(
    graph.nodes.map((n) => n.id),
    ["old", "new"],
  );
  assert.equal(jobs[0].id, "new");
  assert.deepEqual(graph.edges, []);
});

test("project topology includes only explicit record references and deduplicates edges", () => {
  const graph = projectLandscape(
    { id: "p" },
    {
      records: [
        {
          id: "r",
          title: "R",
          milestone_ids: ["m", "m", "missing"],
          site_ids: ["s"],
        },
      ],
      milestones: [{ id: "m", title: "M" }],
      sites: [{ id: "s", title: "S" }],
    },
  );
  assert.deepEqual(graph.edges, [
    { source: "records:r", target: "milestones:m" },
    { source: "records:r", target: "sites:s" },
  ]);
});

test("connection topology distinguishes saved configuration from verified runtime", () => {
  const graph = connectionLandscape({
    configured: true,
    memory_connected: false,
    harness: { provider: "deepseek" },
    harness_configured: true,
    scheduler: { registered: true, active: false, status: "paused" },
  });
  assert.equal(graph.nodes.find((n) => n.id === "table").status, "configured");
  assert.equal(graph.nodes.find((n) => n.id === "schedule").status, "idle");
  assert.equal(
    graph.nodes.find((n) => n.id === "schedule").detail,
    "当前已暂停",
  );
  assert.ok(!graph.edges.some((e) => e.target === "memory"));
});

test("empty sources remain empty and do not fabricate work", () => {
  assert.equal(todoLandscape([], []).nodes.length, 0);
  assert.equal(capabilityLandscape([], new Set(), () => "x").nodes.length, 0);
  assert.equal(projectLandscape({}, {}).nodes.length, 0);
  assert.equal(connectionLandscape({}).edges.length, 0);
  assert.equal(
    connectionLandscape({ harness: { provider: "generic" } }).edges.length,
    0,
  );
});
