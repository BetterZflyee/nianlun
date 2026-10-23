import * as THREE from "./vendor/three.module.min.js";
import { buildScene, displayStatus } from "./insight-model.js";

/** Compact local data scene. Import insight-scene.css once in the host page.
 * mount(host,{kind,nodes,edges,onSelect(id),reducedMotion,onReady(meta),onError})
 * -> {update({nodes,edges,selectedId?}),focus(id),reset(),setPaused(bool),destroy()}.
 * Synchronous; onReady also runs after update. focus never moves DOM focus.
 * No continuous animation or inferred relationships. The caller owns host height.
 */
export function mount(host, options = {}) {
  let input = {
    kind: options.kind,
    nodes: options.nodes || [],
    edges: options.edges || [],
  };
  let model = buildScene(input),
    selected = null,
    hovered = null;
  let dead = false,
    paused = false,
    visible = true,
    frame = 0,
    dirty = true;
  let renderer = null,
    canvas = null,
    mode = "webgl",
    graph = null;
  let nodesMesh = null,
    haloMesh = null,
    selectionRing = null,
    edgeGeometry = null;
  let yaw = -0.08,
    pitch = 0.08,
    zoom = 1,
    drag = null;
  let horizontalSpread = 1;
  const scenePosition = (p) => [p[0] * horizontalSpread, p[1], p[2]];
  let width = 1,
    height = 1;
  const disposables = [],
    labels = new Map(),
    railButtons = new Map(),
    groupLabels = [];
  const canvasListeners = [];
  const root = element("section", "insight-scene");
  root.setAttribute("aria-label", "交互数据概览");
  const viewport = element("div", "insight-viewport");
  const labelsLayer = element("div", "insight-labels");
  const tools = element("div", "insight-tools");
  const minus = button("−", "缩小视角", () => changeZoom(0.87));
  const plus = button("＋", "放大视角", () => changeZoom(1.15));
  const resetButton = button("复位", "复位视角", reset);
  tools.append(minus, plus, resetButton);
  viewport.append(labelsLayer, tools);
  const caption = element("div", "insight-caption");
  const state = element("span");
  state.setAttribute("role", "status");
  const hint = element(
    "span",
    "insight-gesture-hint",
    "拖动旋转 · 滚轮缩放 · 点击查看",
  );
  caption.append(state, hint);
  const rail = element("div", "insight-node-rail");
  rail.setAttribute("aria-label", "图中条目，可用键盘选择");
  root.append(viewport, caption, rail);
  host.append(root);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 2, -2, 0.1, 100);
  camera.position.set(0, 0, 18);
  scene.add(new THREE.AmbientLight(0xb8dac8, 2));
  const key = new THREE.DirectionalLight(0xfff1c9, 3.1);
  key.position.set(-4, 6, 9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x63a2a0, 1.3);
  fill.position.set(5, -2, 2);
  scene.add(fill);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const dummy = new THREE.Object3D();
  const own = (resource) => (disposables.push(resource), resource);

  function metadata() {
    return {
      mode,
      kind: model.kind,
      total: model.total,
      shown: model.shown,
      overflow: model.overflow,
      edges: model.edges.length,
      edgeOverflow: model.edgeOverflow,
    };
  }
  function captionText() {
    state.textContent = model.total
      ? `${model.shown} 个节点 · ${model.edges.length} 条明确关联${model.overflow ? ` · 另 ${model.overflow} 项未在图中显示` : ""}${model.edgeOverflow ? ` · 另 ${model.edgeOverflow} 条关联未显示` : ""}`
      : "暂无可展示的数据";
    hint.textContent =
      mode === "fallback"
        ? "轻量视图"
        : paused
          ? "视角已锁定 · 仍可选择条目"
          : "拖动旋转 · 滚轮缩放 · 点击查看";
  }
  function describe(node) {
    return [
      node.label,
      node.group !== "未分组" ? node.group : "",
      displayStatus(node.status),
      node.value == null ? "" : `数量 ${node.value}`,
      node.detail,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  function makeNodeButton(node, className) {
    const result = element("button", className, node.label);
    result.type = "button";
    result.dataset.insightId = node.id;
    result.title = describe(node);
    result.setAttribute("aria-label", describe(node));
    result.setAttribute("aria-pressed", String(node.id === selected));
    result.style.setProperty("--node-color", node.color);
    return result;
  }
  function rebuildDOM() {
    labels.clear();
    railButtons.clear();
    groupLabels.length = 0;
    labelsLayer.replaceChildren();
    rail.replaceChildren();
    viewport.querySelector(".insight-fallback-grid")?.remove();
    viewport.querySelector(".insight-empty")?.remove();
    if (mode === "fallback") {
      const grid = element("div", "insight-fallback-grid");
      grid.append(
        element(
          "p",
          "insight-fallback-note",
          model.total
            ? "当前设备使用轻量视图，点击条目继续。"
            : "暂无可展示的数据",
        ),
      );
      model.nodes.forEach((node) => {
        const b = makeNodeButton(node, "insight-node-button");
        railButtons.set(node.id, b);
        grid.append(b);
      });
      viewport.append(grid);
    } else {
      for (const node of model.nodes) {
        const label = makeNodeButton(node, "insight-node-label");
        label.tabIndex = -1;
        label.hidden = true;
        labels.set(node.id, label);
        labelsLayer.append(label);
        const b = makeNodeButton(node, "insight-node-button");
        railButtons.set(node.id, b);
        rail.append(b);
      }
      for (const group of model.groups) {
        const label = element(
          "span",
          "insight-group-label",
          `${group.label} · ${group.count}`,
        );
        labelsLayer.append(label);
        groupLabels.push({ data: group, label });
      }
      if (!model.total)
        viewport.append(element("p", "insight-empty", "从一条真实记录开始"));
    }
    captionText();
    updateHighlight();
  }
  function clearGraph() {
    if (graph) {
      graph.traverse((object) => {
        if (object.isInstancedMesh) object.dispose();
      });
      scene.remove(graph);
    }
    for (const resource of disposables.splice(0)) resource.dispose();
    graph = null;
    nodesMesh = null;
    haloMesh = null;
    selectionRing = null;
    edgeGeometry = null;
  }
  function buildGraph() {
    clearGraph();
    if (!renderer) return;
    graph = new THREE.Group();
    scene.add(graph);
    const sphere = own(new THREE.SphereGeometry(1, 16, 12));
    const material = own(
      new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.13 }),
    );
    const haloMaterial = own(
      new THREE.MeshBasicMaterial({
        color: 0xa5d0ae,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
    );
    nodesMesh = new THREE.InstancedMesh(sphere, material, model.nodes.length);
    haloMesh = new THREE.InstancedMesh(
      sphere,
      haloMaterial,
      model.nodes.length,
    );
    model.nodes.forEach((node, i) => {
      dummy.position.set(...scenePosition(node.position));
      dummy.scale.setScalar(node.radius);
      dummy.updateMatrix();
      nodesMesh.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(node.radius * 1.75);
      dummy.updateMatrix();
      haloMesh.setMatrixAt(i, dummy.matrix);
      nodesMesh.setColorAt(i, new THREE.Color(node.color));
    });
    nodesMesh.instanceMatrix.needsUpdate = true;
    haloMesh.instanceMatrix.needsUpdate = true;
    graph.add(haloMesh, nodesMesh);
    const byId = new Map(model.nodes.map((node) => [node.id, node]));
    const positions = [];
    const arrowTransforms = [];
    for (const edge of model.edges) {
      const a = new THREE.Vector3(
          ...scenePosition(byId.get(edge.source).position),
        ),
        b = new THREE.Vector3(...scenePosition(byId.get(edge.target).position));
      const middle = a.clone().lerp(b, 0.5);
      middle.z += Math.min(0.6, a.distanceTo(b) * 0.12);
      const curve = new THREE.QuadraticBezierCurve3(a, middle, b);
      const points = curve.getPoints(20);
      for (let i = 0; i < 20; i++)
        positions.push(...points[i].toArray(), ...points[i + 1].toArray());
      if (model.kind === "pipeline" || model.kind === "timeline")
        arrowTransforms.push({
          position: curve.getPoint(0.7),
          tangent: curve.getTangent(0.7),
        });
    }
    edgeGeometry = own(new THREE.BufferGeometry());
    edgeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    edgeGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(positions.length), 3),
    );
    graph.add(
      new THREE.LineSegments(
        edgeGeometry,
        own(
          new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.58,
            depthWrite: false,
          }),
        ),
      ),
    );
    if (arrowTransforms.length) {
      const arrows = new THREE.InstancedMesh(
        own(new THREE.ConeGeometry(0.035, 0.13, 6)),
        own(
          new THREE.MeshBasicMaterial({
            color: 0xa1bca7,
            transparent: true,
            opacity: 0.65,
          }),
        ),
        arrowTransforms.length,
      );
      const up = new THREE.Vector3(0, 1, 0);
      arrowTransforms.forEach((arrow, i) => {
        dummy.position.copy(arrow.position);
        dummy.quaternion.setFromUnitVectors(up, arrow.tangent.normalize());
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        arrows.setMatrixAt(i, dummy.matrix);
      });
      graph.add(arrows);
    }
    const ringPoints = Array.from(
      { length: 49 },
      (_, i) =>
        new THREE.Vector3(
          Math.cos((i / 48) * Math.PI * 2),
          Math.sin((i / 48) * Math.PI * 2),
          0,
        ),
    );
    selectionRing = new THREE.Line(
      own(new THREE.BufferGeometry().setFromPoints(ringPoints)),
      own(
        new THREE.LineBasicMaterial({
          color: 0xf1edc6,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      ),
    );
    selectionRing.visible = false;
    graph.add(selectionRing);
    updateHighlight();
  }
  function updateHighlight() {
    const active = hovered || selected;
    for (const [id, b] of railButtons) {
      b.classList.toggle("is-selected", id === active);
      b.setAttribute("aria-pressed", String(id === selected));
    }
    for (const [id, b] of labels) {
      b.classList.toggle("is-selected", id === active);
      b.setAttribute("aria-pressed", String(id === selected));
    }
    if (!nodesMesh) return;
    const connected = new Set(active ? [active] : []);
    model.edges.forEach((edge) => {
      if (edge.source === active || edge.target === active) {
        connected.add(edge.source);
        connected.add(edge.target);
      }
    });
    model.nodes.forEach((node, i) => {
      const color = new THREE.Color(node.color);
      if (active && !connected.has(node.id)) color.multiplyScalar(0.48);
      nodesMesh.setColorAt(i, color);
    });
    if (nodesMesh.instanceColor) nodesMesh.instanceColor.needsUpdate = true;
    const colors = edgeGeometry?.getAttribute("color");
    if (colors) {
      model.edges.forEach((edge, i) => {
        const relevant = edge.source === active || edge.target === active;
        const color = new THREE.Color(relevant ? "#e3dfb4" : "#6b9d87");
        if (active && !relevant) color.multiplyScalar(0.35);
        for (let j = 0; j < 40; j++)
          colors.setXYZ(i * 40 + j, color.r, color.g, color.b);
      });
      colors.needsUpdate = true;
    }
    const selectedNode = model.nodes.find((node) => node.id === active);
    if (selectionRing) {
      selectionRing.visible = Boolean(selectedNode);
      if (selectedNode) {
        selectionRing.position.set(...scenePosition(selectedNode.position));
        selectionRing.scale.setScalar(selectedNode.radius * 2.05);
      }
    }
  }
  function project(position) {
    const vector = new THREE.Vector3(...scenePosition(position))
      .applyMatrix4(graph.matrixWorld)
      .project(camera);
    return {
      x: (vector.x * 0.5 + 0.5) * width,
      y: (-0.5 * vector.y + 0.5) * height,
      z: vector.z,
    };
  }
  function positionLabels() {
    if (!graph) return;
    for (const b of labels.values()) b.hidden = true;
    const first = new Map();
    for (const node of model.nodes)
      if (!first.has(node.group)) first.set(node.group, node.id);
    const ordered = [...model.nodes].sort((a, b) => {
      const priority = (node) =>
        node.id === hovered
          ? 0
          : node.id === selected
            ? 1
            : first.get(node.group) === node.id
              ? 2
              : 3;
      return priority(a) - priority(b);
    });
    const placed = [];
    let count = 0;
    const limit = width < 440 ? 5 : width < 750 ? 8 : 12;
    for (const node of ordered) {
      if (count >= limit) break;
      const p = project(node.position),
        label = labels.get(node.id);
      if (
        p.z < -1 ||
        p.z > 1 ||
        p.x < 5 ||
        p.x > width - 5 ||
        p.y < 3 ||
        p.y > height - 12
      )
        continue;
      const w = Math.min(
          width < 600 ? 118 : 156,
          Math.max(50, node.label.length * 10 + 20),
        ),
        h = 27;
      const x = Math.max(w / 2 + 6, Math.min(width - w / 2 - 6, p.x));
      let box = null;
      for (const y of [p.y + 12, p.y - 38]) {
        const candidate = {
          left: x - w / 2,
          right: x + w / 2,
          top: y,
          bottom: y + h,
        };
        if (
          candidate.top < 3 ||
          candidate.bottom > height - 3 ||
          (candidate.right > width - 130 && candidate.top < 43)
        )
          continue;
        if (
          placed.some(
            (r) =>
              candidate.left < r.right + 6 &&
              candidate.right > r.left - 6 &&
              candidate.top < r.bottom + 4 &&
              candidate.bottom > r.top - 4,
          )
        )
          continue;
        box = candidate;
        break;
      }
      if (!box) continue;
      label.style.left = x + "px";
      label.style.top = box.top + "px";
      label.hidden = false;
      placed.push(box);
      count++;
    }
    for (const { data, label } of groupLabels) {
      const p = project(data.position);
      label.style.left = p.x + "px";
      label.style.top = p.y + "px";
      label.hidden =
        p.x < 40 ||
        p.x > width - 40 ||
        p.y < 4 ||
        p.y > height - 10 ||
        model.groups.length > 8;
    }
  }
  function render() {
    frame = 0;
    if (dead || !renderer || document.hidden || !visible || !dirty) return;
    dirty = false;
    graph.rotation.set(pitch, yaw, 0);
    graph.updateMatrixWorld(true);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    try {
      renderer.render(scene, camera);
      positionLabels();
    } catch (error) {
      useFallback(error);
    }
  }
  function invalidate() {
    dirty = true;
    if (!dead && renderer && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    if (dead || !renderer) return;
    width = Math.max(1, viewport.clientWidth);
    height = Math.max(1, viewport.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    const nextSpread = Math.max(0.7, Math.min(4, width / height / 2.6));
    if (Math.abs(nextSpread - horizontalSpread) > 0.01) {
      horizontalSpread = nextSpread;
      buildGraph();
    }
    const xs = model.nodes.map((n) => n.position[0] * horizontalSpread),
      ys = model.nodes.map((n) => n.position[1]);
    const maxX = Math.max(1.1, ...xs.map(Math.abs)) + 0.65,
      maxY = Math.max(0.7, ...ys.map(Math.abs)) + 0.65;
    const aspect = width / height,
      halfHeight = Math.max(1.25, maxY, maxX / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    invalidate();
  }
  function pick(event) {
    if (!renderer || !nodesMesh || !graph) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
      -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1,
    );
    camera.updateMatrixWorld(true);
    graph.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(haloMesh, false)[0];
    return hit?.instanceId == null
      ? null
      : model.nodes[hit.instanceId]?.id || null;
  }
  function selectNode(id) {
    if (dead || !model.nodes.some((node) => node.id === id)) return;
    focus(id);
    options.onSelect?.(id);
  }
  function down(event) {
    if (event.button !== 0) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
      pitch,
      moved: false,
    };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = paused ? "default" : "grabbing";
  }
  function move(event) {
    if (drag && drag.id === event.pointerId) {
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (paused) return;
      yaw = Math.max(-1.2, Math.min(1.2, drag.yaw + dx * 0.004));
      pitch = Math.max(-0.7, Math.min(0.7, drag.pitch + dy * 0.004));
      invalidate();
      return;
    }
    const id = pick(event);
    if (hovered !== id) {
      hovered = id;
      updateHighlight();
      invalidate();
    }
    canvas.style.cursor = paused ? "default" : id ? "pointer" : "grab";
  }
  function up(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const click = !drag.moved;
    drag = null;
    if (canvas.hasPointerCapture?.(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = paused ? "default" : "grab";
    if (click) selectNode(pick(event));
  }
  function cancel() {
    drag = null;
    if (canvas) canvas.style.cursor = paused ? "default" : "grab";
  }
  function leave() {
    if (!drag) {
      hovered = null;
      updateHighlight();
      invalidate();
    }
  }
  function changeZoom(factor) {
    if (!paused) {
      zoom = Math.max(0.65, Math.min(2.6, zoom * factor));
      invalidate();
    }
  }
  function wheel(event) {
    if (paused) return;
    event.preventDefault();
    changeZoom(Math.exp(-Math.max(-180, Math.min(180, event.deltaY)) * 0.002));
  }
  function keydown(event) {
    if (paused) return;
    if (event.key === "ArrowLeft") yaw = Math.max(-1.2, yaw - 0.08);
    else if (event.key === "ArrowRight") yaw = Math.min(1.2, yaw + 0.08);
    else if (event.key === "ArrowUp") pitch = Math.max(-0.7, pitch - 0.08);
    else if (event.key === "ArrowDown") pitch = Math.min(0.7, pitch + 0.08);
    else if (event.key === "+" || event.key === "=") changeZoom(1.15);
    else if (event.key === "-") changeZoom(0.87);
    else if (event.key === "Escape" || event.key.toLowerCase() === "r") reset();
    else return;
    event.preventDefault();
    invalidate();
  }
  function rootClick(event) {
    const b = event.target.closest?.("[data-insight-id]");
    if (b && root.contains(b)) selectNode(b.dataset.insightId);
  }
  function rootFocus(event) {
    const b = event.target.closest?.("[data-insight-id]");
    if (b && root.contains(b)) {
      hovered = b.dataset.insightId;
      updateHighlight();
      invalidate();
    }
  }
  function rootBlur(event) {
    if (
      !event.relatedTarget?.closest?.("[data-insight-id]") ||
      !root.contains(event.relatedTarget)
    ) {
      hovered = null;
      updateHighlight();
      invalidate();
    }
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  }
  function listenCanvas(name, handler, opts) {
    canvas.addEventListener(name, handler, opts);
    canvasListeners.push([name, handler, opts]);
  }
  function contextLost(event) {
    event.preventDefault();
    useFallback(new Error("三维绘图中断，已切换为可操作的条目列表"));
  }
  function releaseGraphics() {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const [name, handler, opts] of canvasListeners.splice(0))
      canvas?.removeEventListener(name, handler, opts);
    clearGraph();
    renderer?.dispose();
    renderer = null;
    canvas?.remove();
    canvas = null;
    drag = null;
  }
  function useFallback(error) {
    if (dead || mode === "fallback") return;
    mode = "fallback";
    releaseGraphics();
    root.classList.add("is-fallback");
    root.dataset.mode = mode;
    rebuildDOM();
    options.onError?.(error);
    options.onReady?.(metadata());
  }
  function update(next = {}) {
    if (dead) return;
    if (Object.prototype.hasOwnProperty.call(next, "nodes"))
      input.nodes = next.nodes;
    if (Object.prototype.hasOwnProperty.call(next, "edges"))
      input.edges = next.edges;
    model = buildScene(input);
    if (Object.prototype.hasOwnProperty.call(next, "selectedId"))
      selected = next.selectedId == null ? null : String(next.selectedId);
    if (!model.nodes.some((node) => node.id === selected)) selected = null;
    const focusedId = root.contains(document.activeElement)
      ? document.activeElement.dataset?.insightId
      : null;
    hovered = null;
    buildGraph();
    rebuildDOM();
    resize();
    if (focusedId) railButtons.get(focusedId)?.focus({ preventScroll: true });
    options.onReady?.(metadata());
  }
  function focus(id) {
    if (dead) return;
    selected = model.nodes.some((n) => n.id === String(id)) ? String(id) : null;
    hovered = null;
    updateHighlight();
    invalidate();
  }
  function reset() {
    if (dead) return;
    yaw = -0.08;
    pitch = 0.08;
    zoom = 1;
    hovered = null;
    updateHighlight();
    invalidate();
  }
  function setPaused(value) {
    if (dead) return;
    paused = Boolean(value);
    cancel();
    root.classList.toggle("is-paused", paused);
    minus.disabled = paused;
    plus.disabled = paused;
    captionText();
  }
  function destroy() {
    if (dead) return;
    dead = true;
    releaseGraphics();
    resizeObserver?.disconnect();
    intersection?.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    root.removeEventListener("click", rootClick);
    root.removeEventListener("focusin", rootFocus);
    root.removeEventListener("focusout", rootBlur);
    root.remove();
  }

  let failure = null;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    canvas = renderer.domElement;
    canvas.className = "insight-canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "交互数据图。拖动或方向键旋转，加减键或滚轮缩放，R 复位。下方按钮可选择图中条目。",
    );
    viewport.prepend(canvas);
    for (const [name, handler] of Object.entries({
      pointerdown: down,
      pointermove: move,
      pointerup: up,
      pointercancel: cancel,
      pointerleave: leave,
      keydown,
      webglcontextlost: contextLost,
    }))
      listenCanvas(name, handler);
    listenCanvas("wheel", wheel, { passive: false });
  } catch (error) {
    failure = error;
    mode = "fallback";
    root.classList.add("is-fallback");
    releaseGraphics();
  }
  root.dataset.mode = mode;
  root.addEventListener("click", rootClick);
  root.addEventListener("focusin", rootFocus);
  root.addEventListener("focusout", rootBlur);
  document.addEventListener("visibilitychange", visibility);
  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(viewport);
  if (!resizeObserver) window.addEventListener("resize", resize);
  const intersection =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0]?.isIntersecting !== false;
            if (!visible) {
              cancelAnimationFrame(frame);
              frame = 0;
            } else invalidate();
          },
          { threshold: 0.01 },
        )
      : null;
  intersection?.observe(host);
  update(input);
  if (failure) options.onError?.(failure);
  // All interaction is immediate; reduced motion never starts a transition or loop.
  return { update, focus, reset, setPaused, destroy };
}

function element(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text != null) result.textContent = text;
  return result;
}
function button(text, label, action) {
  const result = element("button", "", text);
  result.type = "button";
  result.title = label;
  result.setAttribute("aria-label", label);
  result.addEventListener("click", action);
  return result;
}
