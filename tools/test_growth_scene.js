import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOverview,
  contourPoint,
  statusColor,
} from "../nianlun/assets/portal/growth-scene-model.js";

test("overview only counts explicit links and unique record identities", () => {
  const model = buildOverview({
    projects: [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ],
    records: [
      { id: "r", project_ids: ["a", "a", "missing"] },
      { id: "r", project_ids: ["a"] },
      { id: "x", title: "A" },
    ],
    milestones: [{ id: "m", project_ids: ["a", "b"] }],
    sites: [{ id: "s", project_ids: ["b"] }],
  });
  assert.deepEqual(model.nodes[0].counts, {
    records: 1,
    milestones: 1,
    sites: 0,
  });
  assert.deepEqual(model.nodes[1].counts, {
    records: 0,
    milestones: 1,
    sites: 1,
  });
  assert.equal(model.edges, undefined);
});
test("project ordering is deterministic and every displayed identity is real", () => {
  const projects = Array.from({ length: 60 }, (_, i) => ({
    id: String(i),
    title: "Project " + i,
  }));
  const first = buildOverview({ projects });
  assert.deepEqual(first, buildOverview({ projects: [...projects].reverse() }));
  assert.equal(first.shown, 40);
  assert.equal(first.total, 60);
  assert.equal(first.overflow, 20);
  assert.equal(new Set(first.nodes.map((n) => n.id)).size, 40);
  assert.ok(
    first.nodes.every((node) =>
      node.position.every((n) => Number.isFinite(n) && Math.abs(n) < 4),
    ),
  );
});
test("unknown statuses and overdue dates never invent a blocked status", () => {
  assert.notEqual(statusColor("已完成"), statusColor("延期"));
  assert.equal(statusColor(""), "#91aaa1");
  assert.equal(
    buildOverview({ projects: [{ id: "a", date: "2020-01-01" }] }).nodes[0]
      .status,
    "未设置状态",
  );
  assert.deepEqual(buildOverview(), {
    nodes: [],
    total: 0,
    shown: 0,
    overflow: 0,
  });
});
test("adding another project does not reposition existing identities", () => {
  const projects = [{ id: "project-b" }, { id: "project-c" }];
  const before = buildOverview({ projects });
  const after = buildOverview({ projects: [{ id: "project-a" }, ...projects] });
  for (const node of before.nodes) {
    assert.deepEqual(
      node.position,
      after.nodes.find((item) => item.id === node.id).position,
    );
  }
});
test("contour paths are closed with finite organic coordinates", () => {
  for (const radius of [0.4, 1.8, 3.4]) {
    const first = contourPoint(radius, 0),
      last = contourPoint(radius, Math.PI * 2);
    first.forEach((v, i) => assert.ok(Math.abs(v - last[i]) < 1e-10));
  }
});
