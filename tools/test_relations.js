import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRelations,
  layoutRelations,
  relationNeighborhood,
} from "../nianlun/assets/portal/relations-model.js";
const rows = {
  milestones: [
    { id: "same", title: "验收" },
    { id: "m2", title: "上线" },
    { id: "loose", title: "规划" },
  ],
  sites: [
    { id: "same", title: "北区" },
    { id: "s2", title: "南区" },
  ],
  records: [
    {
      id: "r1",
      title: "系统验证",
      milestone_ids: ["same", "m2", "same"],
      site_ids: ["same", "s2"],
    },
    { id: "r2", title: "现场复测", milestone_ids: ["same"], site_ids: ["s2"] },
    { id: "r3", title: "未关联" },
  ],
};
test("many-to-many uses only explicit links, deduplicates IDs and keeps roles distinct", () => {
  const g = buildRelations(rows);
  assert.equal(g.links.length, 6);
  assert.equal(g.nodes.length, 6);
  assert.equal(g.loose.length, 2);
  assert.equal(new Set(g.nodes.map((n) => n.id)).size, 6);
  assert.ok(g.links.every((e) => e.value === 1));
  assert.ok(
    g.links.every(
      (e) =>
        g.nodes.find((n) => n.id === e.source).role === "records" ||
        g.nodes.find((n) => n.id === e.target).role === "records",
    ),
  );
});
test("search retains the matched record paths, not unrelated records", () => {
  const g = buildRelations(rows, "上线");
  assert.equal(g.recordCount, 1);
  assert.equal(g.links.length, 4);
  assert.deepEqual(
    g.nodes.filter((n) => n.role === "records").map((n) => n.row.id),
    ["r1"],
  );
  assert.equal(buildRelations(rows, "does not exist").nodes.length, 0);
  assert.equal(buildRelations(rows, "未关联").loose.length, 1);
});
test("unresolved references and one-sided records never create imaginary endpoints", () => {
  const g = buildRelations({
    records: [{ id: "r", milestone_ids: ["missing"], site_ids: ["s"] }],
    sites: [{ id: "s" }],
  });
  assert.equal(g.missing.length, 1);
  assert.equal(g.links.length, 1);
  assert.equal(g.nodes.length, 2);
  assert.equal(buildRelations({}).nodes.length, 0);
});
test("focus follows record paths but does not spread through shared endpoint to unrelated records", () => {
  const g = buildRelations(rows);
  const id = g.nodes.find((n) => n.row.id === "m2").id;
  const focus = relationNeighborhood(g, id);
  assert.equal(focus.records.size, 1);
  assert.equal(focus.nodes.size, 5);
});
test("layout is deterministic, collision free and finite for dense graphs", () => {
  const dense = {
    ...rows,
    records: Array.from({ length: 100 }, (_, i) => ({
      id: "r" + i,
      title: "记录" + i,
      milestone_ids: i % 2 ? ["same"] : ["same", "m2"],
      site_ids: ["same", "s2"],
    })),
  };
  for (const width of [860, 1200]) {
    const g = buildRelations(dense),
      l = layoutRelations(g, width);
    assert.deepEqual(l, layoutRelations(g, width));
    for (const n of l.nodes)
      assert.ok(
        n.x >= 0 && n.x + n.width <= width && n.y + n.height <= l.height,
      );
    for (const role of ["records", "milestones", "sites"]) {
      const ns = l.nodes
        .filter((n) => n.role === role)
        .sort((a, b) => a.y - b.y);
      for (let i = 1; i < ns.length; i++)
        assert.ok(ns[i].y >= ns[i - 1].y + ns[i - 1].height + 14);
    }
    assert.ok(
      l.links.every((e) => !e.d.includes("NaN") && !e.d.includes("undefined")),
    );
  }
});
