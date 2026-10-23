import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScene,
  MAX_NODES,
  MAX_EDGES,
  statusColor,
  displayStatus,
} from "../nianlun/assets/portal/insight-model.js";

const nodes = [
  { id: "b", label: "任务 B", group: "项目甲", status: "已完成", value: 4 },
  { id: "a", label: "任务 A", group: "项目甲", status: "等待", value: 2 },
  { id: "c", label: "任务 C", group: "项目乙", status: "失败", value: 0 },
];
test("keeps real identities, explicit links, and provided sequence", () => {
  const scene = buildScene({
    kind: "pipeline",
    nodes,
    edges: [
      { source: "b", target: "a" },
      { source: "a", target: "missing" },
      { source: "c", target: "c" },
      { source: "b", target: "a" },
    ],
  });
  assert.deepEqual(
    scene.nodes.map((n) => n.id),
    ["b", "a", "c"],
  );
  assert.deepEqual(scene.edges, [{ source: "b", target: "a" }]);
  assert.equal(scene.omittedEdges, 2);
  assert.ok(scene.nodes[0].position[0] < scene.nodes[1].position[0]);
  assert.ok(scene.nodes[1].position[0] < scene.nodes[2].position[0]);
});
test("all layouts are deterministic and finite without inventing relationships", () => {
  for (const kind of ["cluster", "pipeline", "timeline", "connections"]) {
    const scene = buildScene({ kind, nodes });
    assert.deepEqual(scene, buildScene({ kind, nodes }));
    assert.equal(scene.edges.length, 0);
    for (const node of scene.nodes)
      assert.ok(node.position.every(Number.isFinite));
  }
  assert.deepEqual(
    buildScene({ kind: "cluster", nodes })
      .nodes.map((n) => [n.id, n.position])
      .sort(),
    buildScene({ kind: "cluster", nodes: [...nodes].reverse() })
      .nodes.map((n) => [n.id, n.position])
      .sort(),
  );
});
test("caps node and edge budgets and reports truthful overflow", () => {
  const many = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    label: `节点 ${i}`,
  }));
  const edges = [];
  for (let i = 0; i < MAX_NODES; i++)
    for (let j = 0; j < 5; j++)
      edges.push({
        source: String(i),
        target: String((i + j + 1) % MAX_NODES),
      });
  const scene = buildScene({ nodes: many, edges });
  assert.equal(scene.total, 100);
  assert.equal(scene.shown, 80);
  assert.equal(scene.overflow, 20);
  assert.equal(scene.edges.length, MAX_EDGES);
  assert.equal(scene.edgeOverflow, 80);
  assert.ok(
    scene.edges.every((e) => Number(e.source) < 80 && Number(e.target) < 80),
  );
});
test("rejects malformed inputs and preserves zero-valued real nodes", () => {
  const scene = buildScene({
    kind: "unknown",
    nodes: [
      null,
      {},
      { id: "" },
      { id: 0, label: "zero", value: 0 },
      { id: 0, label: "duplicate" },
      { id: "neg", value: -1 },
      { id: "inf", value: Infinity },
    ],
    edges: [{}, null, { source: 0, target: "neg" }],
  });
  assert.equal(scene.kind, "cluster");
  assert.equal(scene.total, 3);
  assert.equal(scene.nodes[0].label, "zero");
  assert.equal(scene.nodes[0].value, 0);
  assert.equal(scene.nodes[1].value, null);
  assert.equal(scene.nodes[2].value, null);
  assert.deepEqual(scene.edges, [{ source: "0", target: "neg" }]);
  assert.equal(buildScene({ nodes: null, edges: null }).shown, 0);
});
test("geometry is bounded for dense and one-item data, status is not date inferred", () => {
  for (const kind of ["cluster", "pipeline", "timeline", "connections"]) {
    for (const amount of [0, 1, 2, 80]) {
      const scene = buildScene({
        kind,
        nodes: Array.from({ length: amount }, (_, i) => ({
          id: String(i),
          group: `组${i % 13}`,
        })),
      });
      for (const node of scene.nodes) {
        assert.ok(node.position.every(Number.isFinite));
        assert.ok(node.position.every((n) => Math.abs(n) < 10));
      }
    }
  }
  assert.notEqual(statusColor("失败"), statusColor("已完成"));
  assert.notEqual(statusColor("等待"), statusColor("已完成"));
  assert.equal(statusColor("2020-01-01"), statusColor("未设置"));
  assert.equal(statusColor("inactive"), statusColor("未设置"));
  assert.equal(statusColor("incomplete"), statusColor("未设置"));
});

test("known workflow states are localized without changing user labels", () => {
  assert.equal(displayStatus("attention"), "需关注");
  assert.equal(displayStatus("waiting_harness"), "等待宿主");
  assert.equal(displayStatus("succeeded"), "已完成");
  assert.equal(displayStatus("configured"), "已配置");
  assert.equal(displayStatus("unknown"), "未知");
  assert.equal(displayStatus("用户定义状态"), "用户定义状态");
  assert.equal(statusColor("succeeded"), statusColor("已完成"));
  assert.equal(statusColor("queued"), statusColor("等待"));
});
