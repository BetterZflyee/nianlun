import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  buildGraph,
  keyFor,
  neighborhood,
  seedLayout,
  relaxLayout,
  catalogGroups,
  catalogNodes,
  referenceCoverage,
} from "../nianlun/assets/portal/galaxy-model.js";

test("memory text renders readable structure while keeping HTML and URLs inert", () => {
  function element(tag, attrs = {}, children = []) {
    return {
      tagName: tag.toUpperCase(),
      textContent: attrs.text || "",
      children: [...children],
      append(...items) {
        this.children.push(...items);
      },
    };
  }
  const context = vm.createContext({
    el: element,
    document: {
      createTextNode: (text) => ({ textContent: text, children: [] }),
    },
  });
  vm.runInContext(
    readFileSync(
      new URL("../nianlun/assets/portal/memory-view.js", import.meta.url),
      "utf8",
    ),
    context,
  );
  const content = context.memoryText27(
    "# 项目进展\n\n这一周的 **结论**。\n\n- 已完成核验\n- 下一步 `发布`\n\n<img src=x onerror=alert(1)>\n[打开](javascript:alert(1))\n\n```html\n<script>unsafe()</script>\n```",
  );
  const flatten = (node) => [node, ...(node.children || []).flatMap(flatten)];
  const nodes = flatten(content);
  const tags = nodes.map((node) => node.tagName).filter(Boolean);
  assert.ok(
    tags.includes("H2") &&
      tags.includes("P") &&
      tags.includes("UL") &&
      tags.includes("LI") &&
      tags.includes("STRONG") &&
      tags.includes("PRE"),
  );
  assert.ok(
    !tags.includes("IMG") && !tags.includes("SCRIPT") && !tags.includes("A"),
  );
  assert.ok(
    nodes.some((node) =>
      node.textContent.includes("<img src=x onerror=alert(1)>"),
    ),
  );
  assert.ok(
    nodes.some((node) =>
      node.textContent.includes("<script>unsafe()</script>"),
    ),
  );
});

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

test("memory navigation includes zero-memory projects and does not treat folders as project bindings", () => {
  const projects = [
    { id: "a", title: "车辆靠离卡" },
    { id: "b", title: "尚未开展" },
  ];
  const graph = buildGraph(
    [
      { key: "1", slug: "notes/车辆靠离卡", title: "车辆靠离卡讨论" },
      { key: "2", slug: "work/daily", title: "工作记录" },
      { key: "3", slug: "work/plan", title: "工作计划" },
    ],
    projects,
  );
  const groups = catalogGroups(graph, projects);
  assert.deepEqual(
    groups.projects.map((group) => [group.id, group.count]),
    [
      ["project:a", 1],
      ["project:b", 0],
    ],
  );
  assert.equal(groups.total, 3);
  assert.equal(groups.unassigned, 2);
  assert.equal(groups.folders[0].count, 2);
  assert.equal(graph.edges.length, 0);
});

test("memory directory combines scope and literal query without fabricating links", () => {
  const graph = buildGraph(
    [
      { key: "1", slug: "docs/a", title: "ALPHA 项目记录" },
      { key: "2", slug: "docs/b", title: "通用会议" },
      { key: "3", slug: "other/会议纪要", title: "另一篇" },
    ],
    [{ id: "a", title: "ALPHA" }],
  );
  assert.deepEqual(
    catalogNodes(graph, "project:a", "alpha").map((node) => node.id),
    ["1"],
  );
  assert.deepEqual(
    catalogNodes(graph, "unassigned", "会议").map((node) => node.id),
    ["2", "3"],
  );
  assert.equal(catalogNodes(graph, "folder:docs", "[.*").length, 0);
  assert.equal(catalogNodes(graph, "all", "").length, 3);
  assert.equal(graph.edges.length, 0);
});

test("specific project names win and duplicate matches remain unassigned", () => {
  const page = { key: "a", slug: "notes/x", title: "车辆靠离卡进展" };
  assert.equal(
    buildGraph(
      [page],
      [
        { id: "1", title: "车辆" },
        { id: "2", title: "车辆靠离卡" },
      ],
    ).nodes[0].group,
    "project:2",
  );
  assert.equal(
    buildGraph(
      [page],
      [
        { id: "1", title: "车辆靠离卡" },
        { id: "2", title: "车辆靠离卡" },
      ],
    ).nodes[0].group,
    "folder:notes",
  );
});

test("coverage distinguishes empty citations from unread, failed and truncated reads", () => {
  assert.deepEqual(
    referenceCoverage([
      { key: "a", links_verified: true, links: [] },
      { key: "b", links_verified: true, links_truncated: true },
      { key: "c", links_error: "retry" },
      { key: "d" },
    ]),
    { total: 4, verified: 2, failed: 1, truncated: 1, pending: 1 },
  );
  assert.deepEqual(referenceCoverage([]), {
    total: 0,
    verified: 0,
    failed: 0,
    truncated: 0,
    pending: 0,
  });
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
