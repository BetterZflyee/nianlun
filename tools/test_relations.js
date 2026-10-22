import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRelations,
  normalizeOrder,
  RELATION_ORDERS,
  relationChartOption,
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
test("all six orders preserve associations, selected record paths and source data", () => {
  const before = JSON.stringify(rows);
  const original = buildRelations(rows);
  const pairs = (g) =>
    g.links.map((e) => JSON.stringify([e.source, e.target].sort())).sort();
  assert.equal(RELATION_ORDERS.length, 6);
  for (const order of RELATION_ORDERS) {
    const g = buildRelations(rows, "", order);
    const roles = new Map(g.nodes.map((n) => [n.id, n.role]));
    assert.deepEqual(pairs(g), pairs(original));
    assert.ok(
      g.links.every(
        (e) =>
          order.indexOf(roles.get(e.source)) <
          order.indexOf(roles.get(e.target)),
      ),
    );
    assert.equal(
      relationNeighborhood(g, g.nodes.find((n) => n.row.id === "m2").id).records
        .size,
      1,
    );
    assert.equal(buildRelations(rows, "上线", order).recordCount, 1);
  }
  assert.equal(JSON.stringify(rows), before);
  for (const invalid of [
    null,
    [],
    ["sites", "sites", "records"],
    ["records", "sites", "unknown"],
  ])
    assert.deepEqual(normalizeOrder(invalid), [
      "milestones",
      "records",
      "sites",
    ]);
});

test("vendored ECharts renders every order, including empty columns, without synthetic nodes", async () => {
  const { init, version } = await import(
    "../nianlun/assets/portal/vendor/echarts-sankey.min.js"
  );
  assert.equal(version, "6.1.0");
  for (const data of [
    rows,
    { ...rows, sites: [] },
    { ...rows, milestones: [] },
  ]) {
    for (const order of RELATION_ORDERS) {
      const graph = buildRelations(data, "", order);
      const chart = init(null, null, {
        renderer: "svg",
        ssr: true,
        width: 1200,
        height: 700,
      });
      try {
        const option = relationChartOption(graph, {
          width: 1200,
          reducedMotion: true,
        });
        assert.equal(option.series[0].data.length, graph.nodes.length);
        chart.setOption(option);
        const svg = chart.renderToSVGString();
        assert.ok(
          svg.includes("<svg") &&
            !svg.includes("NaN") &&
            !svg.includes("undefined"),
        );
        const rendered = chart.getModel().getSeriesByIndex(0).getData();
        for (let i = 0; i < rendered.count(); i++) {
          const layout = rendered.getItemLayout(i),
            n = graph.nodes[i];
          assert.ok(Number.isFinite(layout.x) && Number.isFinite(layout.y));
          assert.ok(
            Math.abs(
              layout.x - (order.indexOf(n.role) * (1200 - 64 - 18)) / 2,
            ) < 0.01,
          );
        }
      } finally {
        chart.dispose();
      }
    }
  }
});
