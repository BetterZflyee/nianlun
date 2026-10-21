import * as THREE from "./vendor/three.module.min.js";
// On-demand rendering: no idle animation loop, no third-party network resources.
const colors = [
  "#bacb8d",
  "#86b59b",
  "#b9ab79",
  "#89a8b0",
  "#bd9e8b",
  "#a0b775",
  "#a9a1b8",
];
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function mount(host, { nodes, edges, onSelect }) {
  let dead = false,
    selected = null,
    hovered = null;
  const groups = nodes.filter((n) => n.kind === "group"),
    pages = nodes.filter((n) => n.kind !== "group");
  const positions = new Map(),
    groupPositions = new Map();
  groups.forEach((g, i) => {
    const a = i * 2.399963,
      r = groups.length === 1 ? 0 : 85 * Math.sqrt(i + 1);
    const p = { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8, z: 0 };
    groupPositions.set(g.group, p);
    positions.set(g.id, p);
  });
  pages.forEach((n) => {
    const siblings = pages.filter((p) => p.group === n.group),
      i = siblings.indexOf(n),
      a = i * 2.399963 + (hash(n.group) % 10),
      r = 25 + 11 * Math.sqrt(i + 1),
      g = groupPositions.get(n.group) || { x: 0, y: 0 };
    positions.set(n.id, {
      x: g.x + Math.cos(a) * r,
      y: g.y + Math.sin(a) * r,
      z: ((hash(n.id) % 100) - 50) * 0.6,
    });
  });
  // A short deterministic relaxation separates clusters without implying extra links.
  const pageNodes = pages.slice(0, 600);
  for (let iter = 0; iter < 35; iter++)
    for (let i = 0; i < pageNodes.length; i++)
      for (let j = i + 1; j < pageNodes.length; j++) {
        const a = positions.get(pageNodes[i].id),
          b = positions.get(pageNodes[j].id);
        let dx = a.x - b.x,
          dy = a.y - b.y,
          dist = dx * dx + dy * dy;
        if (dist < 225 && dist > 0.01) {
          const force = (15 - Math.sqrt(dist)) * 0.1;
          a.x += (dx * force) / 15;
          a.y += (dy * force) / 15;
          b.x -= (dx * force) / 15;
          b.y -= (dy * force) / 15;
        }
      }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return fallback(host, nodes, edges, positions, onSelect);
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  const canvas = renderer.domElement;
  canvas.setAttribute(
    "aria-label",
    "交互记忆星图；拖动平移，滚轮缩放，可通过目录使用键盘选取页面",
  );
  canvas.setAttribute("role", "img");
  host.append(canvas);
  const labels = document.createElement("div");
  labels.className = "graph-label-layer";
  host.append(labels);
  const scene = new THREE.Scene(),
    world = new THREE.Group();
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 3000);
  camera.position.z = 650;
  const colorFor = (id) =>
    new THREE.Color(colors[Math.abs(hash(id)) % colors.length]);
  const meshes = [],
    geometries = [],
    materials = [],
    labelNodes = [],
    map = new Map();
  const shape = new THREE.SphereGeometry(1, 12, 8);
  geometries.push(shape);
  for (const node of nodes) {
    const p = positions.get(node.id),
      material = new THREE.MeshBasicMaterial({
        color: node.kind === "group" ? 0xe0ebc3 : colorFor(node.group),
      });
    materials.push(material);
    const mesh = new THREE.Mesh(shape, material);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.setScalar(
      node.kind === "group" ? 4.2 : 2.3 + (hash(node.id) % 10) / 12,
    );
    mesh.userData.node = node;
    world.add(mesh);
    meshes.push(mesh);
    map.set(node.id, mesh);
    const label = document.createElement("button");
    label.type = "button";
    label.setAttribute("aria-label", "查看记忆节点 " + node.title);
    label.onclick = () => onSelect(node.id);
    label.className =
      "constellation-label" + (node.kind === "group" ? " group" : "");
    const groupTitle = groups.find((g) => g.group === node.group)?.title;
    label.textContent =
      node.kind === "group"
        ? node.title
        : node.title
            .replace(groupTitle || "__none__", "")
            .replace(/^[ ·—-]+/, "");
    label.title = node.title;
    labels.append(label);
    labelNodes.push({ node, mesh, label });
  }
  const groupVertices = [],
    refVertices = [];
  for (const edge of edges) {
    const a = positions.get(edge.source),
      b = positions.get(edge.target);
    if (!a || !b) continue;
    const dest = edge.kind === "reference" ? refVertices : groupVertices;
    dest.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  for (const [vertices, dashed] of [
    [groupVertices, true],
    [refVertices, false],
  ]) {
    if (!vertices.length) continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometries.push(geometry);
    const material = dashed
      ? new THREE.LineDashedMaterial({
          color: 0x9cb281,
          transparent: true,
          opacity: 0.4,
          dashSize: 3,
          gapSize: 4,
        })
      : new THREE.LineBasicMaterial({
          color: 0xc0d39c,
          transparent: true,
          opacity: 0.65,
        });
    materials.push(material);
    const lines = new THREE.LineSegments(geometry, material);
    lines.computeLineDistances();
    world.add(lines);
  }
  // Small background particles are purely decorative and non-interactive.
  const starGeometry = new THREE.BufferGeometry(),
    stars = [];
  for (let i = 0; i < 200; i++)
    stars.push(
      Math.sin(i * 12.9898) * 600,
      Math.cos(i * 78.233) * 400,
      -150 - (i % 80),
    );
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(stars, 3),
  );
  const starMaterial = new THREE.PointsMaterial({
    color: 0x71896d,
    size: 0.75,
    transparent: true,
    opacity: 0.25,
  });
  geometries.push(starGeometry);
  materials.push(starMaterial);
  scene.add(new THREE.Points(starGeometry, starMaterial));
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let width = 1,
    height = 1,
    drag = null,
    raf = 0;
  const extent = Math.max(
    160,
    ...[...positions.values()].map((p) =>
      Math.max(Math.abs(p.x), Math.abs(p.y)),
    ),
  );
  let baseZ = 650;
  function render() {
    if (dead || document.hidden) return;
    scene.updateMatrixWorld();
    const projected = new THREE.Vector3(),
      occupied = [];
    const order = [...labelNodes].sort(
      (a, b) =>
        (b.node.id === selected || b.node.id === hovered
          ? 4
          : b.node.kind === "group"
            ? 2
            : 0) -
        (a.node.id === selected || a.node.id === hovered
          ? 4
          : a.node.kind === "group"
            ? 2
            : 0),
    );
    let visibleCount = 0;
    for (const { node, mesh, label } of order) {
      mesh.getWorldPosition(projected);
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * width,
        y = (-projected.y * 0.5 + 0.5) * height + 14,
        important =
          node.kind === "group" || node.id === selected || node.id === hovered;
      label.style.left = x + "px";
      label.style.top = y + "px";
      label.classList.toggle(
        "selected",
        selected === node.id || hovered === node.id,
      );
      const w = Math.min(130, label.textContent.length * 9),
        rect = { x: x - w / 2, y: y - 6, w, h: 16 };
      const collision = occupied.some(
        (r) =>
          rect.x < r.x + r.w + 12 &&
          rect.x + rect.w > r.x - 12 &&
          rect.y < r.y + r.h + 8 &&
          rect.y + rect.h > r.y - 8,
      );
      if (important && collision) {
        for (const offset of [20, -20, 40, -40, 60, -60]) {
          const proposed = { ...rect, y: rect.y + offset };
          if (proposed.y < 90 || proposed.y > height - 70) continue;
          if (
            !occupied.some(
              (r) =>
                proposed.x < r.x + r.w + 12 &&
                proposed.x + proposed.w > r.x - 12 &&
                proposed.y < r.y + r.h + 8 &&
                proposed.y + proposed.h > r.y - 8,
            )
          ) {
            rect.y = proposed.y;
            label.style.top = y + offset + "px";
            break;
          }
        }
      }
      label.hidden =
        projected.z > 1 ||
        x < 25 ||
        x > width - 25 ||
        y < 90 ||
        y > height - 70 ||
        (!important && (collision || visibleCount > 18));
      if (!label.hidden) {
        occupied.push(rect);
        visibleCount++;
      }
      mesh.scale.setScalar(
        (node.kind === "group" ? 4.2 : 2.3 + (hash(node.id) % 10) / 12) *
          (selected === node.id ? 1.9 : hovered === node.id ? 1.45 : 1),
      );
    }
    renderer.render(scene, camera);
  }
  function schedule() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }
  function resize() {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    baseZ = Math.max(410, (extent * 2.8) / Math.min(camera.aspect, 1));
    camera.position.z = baseZ;
    schedule();
  }
  const obs = new ResizeObserver(resize);
  obs.observe(host);
  function eventPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function pick(e) {
    const p = eventPoint(e);
    pointer.set((p.x / width) * 2 - 1, (-p.y / height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(meshes)[0]?.object;
  }
  function down(e) {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  }
  function move(e) {
    if (drag) {
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      world.position.x += ((dx * camera.position.z) / height) * 0.8;
      world.position.y -= ((dy * camera.position.z) / height) * 0.8;
      drag.x = e.clientX;
      drag.y = e.clientY;
      schedule();
    } else {
      const hit = pick(e);
      canvas.style.cursor = hit ? "pointer" : "grab";
      const next = hit?.userData.node.id || null;
      if (next !== hovered) {
        hovered = next;
        schedule();
      }
    }
  }
  function up(e) {
    const click = drag && drag.moved < 5;
    drag = null;
    canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
    if (click) {
      const m = pick(e);
      if (m) onSelect(m.userData.node.id);
    }
  }
  function wheel(e) {
    e.preventDefault();
    camera.position.z = Math.max(
      130,
      Math.min(
        2000,
        camera.position.z *
          Math.exp(Math.max(-100, Math.min(100, e.deltaY)) * 0.001),
      ),
    );
    schedule();
  }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", () => (drag = null));
  canvas.addEventListener("wheel", wheel, { passive: false });
  document.addEventListener("visibilitychange", schedule);
  const detached = new MutationObserver(() => {
    if (!host.isConnected) destroy();
  });
  detached.observe(document.body, { childList: true, subtree: true });
  function destroy() {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    obs.disconnect();
    detached.disconnect();
    document.removeEventListener("visibilitychange", schedule);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    labels.remove();
  }
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    if (!dead) {
      destroy();
      fallback(host, nodes, edges, positions, onSelect);
    }
  });
  resize();
  return {
    select(id) {
      selected = id;
      schedule();
    },
    reset() {
      world.position.set(0, 0, 0);
      camera.position.z = baseZ;
      schedule();
    },
    destroy,
  };
}
function fallback(host, nodes, edges, positions, onSelect) {
  const ns = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "-350 -280 700 560");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("aria-label", "二维记忆星图（WebGL 不可用）");
  host.append(svg);
  const make = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const scale =
    250 /
    Math.max(
      250,
      ...[...positions.values()].map((p) =>
        Math.max(Math.abs(p.x), Math.abs(p.y)),
      ),
    );
  for (const e of edges) {
    const a = positions.get(e.source),
      b = positions.get(e.target);
    if (a && b)
      svg.append(
        make("line", {
          x1: a.x * scale,
          y1: -a.y * scale,
          x2: b.x * scale,
          y2: -b.y * scale,
          stroke: "#7b946a",
          "stroke-opacity": e.kind === "reference" ? 0.7 : 0.3,
          "stroke-dasharray": e.kind === "reference" ? "0" : "3 4",
        }),
      );
  }
  const elements = new Map();
  for (const n of nodes) {
    const p = positions.get(n.id),
      g = make("g", {
        role: "button",
        tabindex: 0,
        "aria-label": n.title,
        style: "cursor:pointer",
      }),
      c = make("circle", {
        cx: p.x * scale,
        cy: -p.y * scale,
        r: n.kind === "group" ? 5 : 3,
        fill: n.kind === "group" ? "#e4eebf" : "#92b58c",
      }),
      t = make("text", {
        x: p.x * scale,
        y: -p.y * scale + 15,
        fill: "#c2d2ad",
        "font-size": 8,
        "text-anchor": "middle",
      });
    t.textContent = n.title.slice(0, 15);
    g.append(c, t);
    g.onclick = () => onSelect(n.id);
    g.onkeydown = (e) => {
      if (e.key === "Enter") onSelect(n.id);
    };
    svg.append(g);
    elements.set(n.id, c);
  }
  return {
    select(id) {
      elements.forEach((c, key) =>
        c.setAttribute("stroke", key === id ? "#fff8ca" : "none"),
      );
    },
    reset() {},
    destroy() {
      svg.remove();
    },
  };
}
