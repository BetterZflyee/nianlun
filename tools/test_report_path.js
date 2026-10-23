const test = require("node:test");
const assert = require("node:assert/strict");

const node = (label, x) => ({
  textContent: label,
  getAttribute: () => null,
  getBBox: () => ({ x, y: 10, width: 80, height: 30 }),
});
const edge = {
  getAttribute: () => null,
  getTotalLength: () => 20,
  getPointAtLength: (length) => ({ x: 80 + length, y: 25 }),
};
const svg = (nodes, edges = [edge], width = 220) => ({
  querySelector: () => null,
  querySelectorAll: (query) => (query === ".am-node" ? nodes : edges),
  viewBox: { baseVal: { x: 0, y: 0, width, height: 60 } },
});

test("three-dimensional view keeps the source nodes and sampled edges, without inventing links", async () => {
  const { captureFlow } = await import("../nianlun/assets/report/path3d.js");
  const data = captureFlow(svg([node("待核对", 0), node("现场验证", 100)]));
  assert.deepEqual(
    data.nodes.map((n) => n.label),
    ["待核对", "现场验证"],
  );
  assert.equal(data.edges.length, 1);
  assert.deepEqual(data.edges[0].points[0], { x: 80, y: 25 });
  assert.deepEqual(data.edges[0].points.at(-1), { x: 100, y: 25 });
  assert.equal(data.edges[0].arrowEnd, false);
  assert.deepEqual(captureFlow(svg([node("独立事项", 0)], [])).edges, []);
});

test("unsupported or invalid diagrams stay in their original SVG view", async () => {
  const { captureFlow } = await import("../nianlun/assets/report/path3d.js");
  assert.equal(captureFlow(svg([])), null);
  assert.equal(
    captureFlow(
      svg(Array.from({ length: 13 }, (_, i) => node("节点" + i, i * 100))),
    ),
    null,
  );
  assert.equal(captureFlow(svg([node("节点", 0)], [], 0)), null);
  assert.equal(
    captureFlow({ ...svg([node("节点", 0)]), querySelector: () => ({}) }),
    null,
  );
  assert.equal(
    captureFlow(
      svg([{ ...node("变换节点", 0), getAttribute: () => "translate(10)" }]),
    ),
    null,
  );
});

test("edge direction is preserved for undirected, directed and bidirectional paths", async () => {
  const { captureFlow } = await import("../nianlun/assets/report/path3d.js");
  for (const [start, end] of [
    [false, false],
    [false, true],
    [true, true],
  ]) {
    const path = {
      ...edge,
      getAttribute: (name) =>
        (name === "marker-start" ? start : end) ? "url(#arrow)" : null,
    };
    const data = captureFlow(svg([node("甲", 0), node("乙", 100)], [path]));
    assert.equal(data.edges[0].arrowStart, start);
    assert.equal(data.edges[0].arrowEnd, end);
  }
});

test("saved report rebinds the existing explorer button without duplicating its wrapper", async () => {
  const { install } = await import("../nianlun/assets/report/path3d.js");
  const button = { disabled: true, setAttribute: () => {} };
  const wrap = { querySelector: () => button };
  const diagram = { closest: () => wrap };
  global.document = {
    querySelectorAll: (selector) => {
      assert.equal(selector, "figure.am-flow svg");
      return [diagram];
    },
    createElement: () => {
      throw Error("unexpected new wrapper");
    },
  };
  try {
    install();
    assert.equal(typeof button.onclick, "function");
    assert.equal(button.disabled, false);
    install();
    assert.equal(typeof button.onclick, "function");
  } finally {
    delete global.document;
  }
});
