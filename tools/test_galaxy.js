import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGraph,
  keyFor,
  neighborhood,
  seedLayout,
  relaxLayout,
} from "../nianlun/assets/portal/galaxy-model.js";

test("project/folder grouping never invents citations", () => {
  const graph = buildGraph(
    [
      { slug: "project/a", title: "验收计划" },
      { slug: "project/b", title: "验收总结" },
    ],
    [{ id: "p", title: "验收" }],
  );
  assert.equal(graph.groups.length, 1);
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 0);
});
test("same slugs in different sources and ambiguous references stay separate", () => {
  const a = { slug: "same", source_id: "one", title: "A" },
    b = { slug: "same", source_id: "two", title: "B" };
  assert.notEqual(keyFor(a), keyFor(b));
  const graph = buildGraph([
    a,
    b,
    {
      slug: "third",
      title: "C",
      source_id: "three",
      links: [{ slug: "same" }],
    },
  ]);
  assert.equal(graph.edges.length, 0);
  assert.equal(graph.unresolved, 1);
});
test("explicit edges are scoped, deduplicated, directed, and exclude self links", () => {
  const pages = [
    {
      key: "a",
      slug: "a",
      source_id: "one",
      title: "A",
      links: [{ slug: "b", source_id: "two" }],
      references: ["a"],
    },
    {
      key: "b1",
      slug: "b",
      source_id: "one",
      title: "B",
      references: ["a", "a#section"],
    },
    { key: "b2", slug: "b", source_id: "two", title: "Other B" },
  ];
  const graph = buildGraph(pages);
  assert.deepEqual(
    graph.edges.map((e) => [e.source, e.target]),
    [
      ["a", "b2"],
      ["b1", "a"],
    ],
  );
});
test("focus uses one or two actual link hops, including backlinks", () => {
  const edges = [
    { source: "a", target: "b" },
    { source: "c", target: "b" },
    { source: "c", target: "d" },
  ];
  assert.deepEqual([...neighborhood("a", edges, 1)], ["a", "b"]);
  assert.deepEqual([...neighborhood("a", edges, 2)], ["a", "b", "c"]);
  assert.equal(neighborhood("alone", edges, 2).size, 1);
});
test("deterministic 3D and disc layouts, bounded even with missing endpoints", () => {
  const nodes = Array.from({ length: 120 }, (_, i) => ({
    id: String(i),
    group: String(i % 5),
  }));
  assert.deepEqual(seedLayout(nodes), seedLayout(nodes));
  assert.notDeepEqual(seedLayout(nodes), seedLayout(nodes, "disc"));
  const layout = relaxLayout(nodes, [
    { source: "0", target: "1" },
    { source: "0", target: "missing" },
  ]);
  assert.equal(layout.length, 360);
  assert.ok([...layout].every((n) => Number.isFinite(n) && Math.abs(n) < 2000));
  assert.equal(relaxLayout([], []).length, 0);
});
test("changing input order does not shuffle the seed coordinates", () => {
  const nodes = [
      { id: "a", group: "p" },
      { id: "b", group: "p" },
      { id: "c", group: "q" },
    ],
    rev = [...nodes].reverse();
  const a = seedLayout(nodes),
    b = seedLayout(rev);
  assert.deepEqual([...a.slice(0, 3)], [...b.slice(6, 9)]);
});

test("uneven groups remain centered around the overview camera", () => {
  const nodes = Array.from({ length: 483 }, (_, i) => ({
    id: String(i),
    group: i < 310 ? "meetings" : String(i % 9),
  }));
  for (const points of [seedLayout(nodes), relaxLayout(nodes, [])]) {
    for (let axis = 0; axis < 3; axis++) {
      let sum = 0;
      for (let i = axis; i < points.length; i += 3) sum += points[i];
      assert.ok(Math.abs(sum / nodes.length) < 0.001);
    }
  }
});
