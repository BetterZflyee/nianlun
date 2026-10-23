import * as THREE from "./vendor/three.module.min.js";
import { hash, seedLayout, neighborhood, colorFor } from "./galaxy-model.js";

// Local, batched Three.js rendering. Galaxy View inspired the exploration model;
// the renderer and adapter are native Nianlun code, with no Obsidian dependency.
export function mount(host, options) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return fallback(host, options);
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let dead = false,
    fallbackView = null,
    raf = 0,
    worker = null,
    revision = 0,
    nodes = [],
    edges = [],
    groups = [],
    groupCenters = [];
  let positions = new Float32Array(),
    selected = null,
    focusedGroups = null,
    hovered = null,
    focusDepth = 1,
    focus = new Set();
  let mode = "galaxy",
    auto = options.motion !== false && !reduced.matches,
    inView = true,
    width = 1,
    height = 1,
    baseDistance = 700;
  let theta = 0.12,
    phi = 1.3,
    distance = 700,
    target = new THREE.Vector3(),
    flight = null;
  let lastTime = 0,
    lastLabels = 0,
    interactionTime = 0,
    drag = null,
    pinch = null;
  let points = null,
    lines = null,
    mist = null,
    nodeIndex = new Map(),
    degree = new Map();
  const pointers = new Map(),
    projected = new THREE.Vector3(),
    resources = [];
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(46, 1, 1, 12000);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "三维记忆星图：拖动旋转，Shift 加拖动平移，滚轮缩放；也可通过目录选择记忆，Escape 返回全景",
  );
  host.append(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  const labels = document.createElement("div");
  labels.className = "graph-label-layer";
  host.append(labels);
  const labelPool = Array.from({ length: 26 }, () => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "constellation-label";
    b.hidden = true;
    b.onclick = () => options.onSelect(b.dataset.node);
    labels.append(b);
    return b;
  });
  const groupPool = Array.from({ length: 12 }, () => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "constellation-group-label";
    b.hidden = true;
    b.onclick = () => options.onGroup?.(b.dataset.group);
    labels.append(b);
    return b;
  });
  const status = document.createElement("span");
  status.className = "galaxy-render-status";
  status.textContent = "三维布局准备中…";
  host.append(status);
  const own = (obj) => {
    resources.push(obj);
    return obj;
  };
  const nodeShader = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uScale: { value: 700 }, uOpacity: { value: 1 } },
    vertexShader: `attribute float aSize; attribute float aDim; varying vec3 vColor; varying float vDim;
      uniform float uScale; void main(){ vColor=color; vDim=aDim; vec4 p=modelViewMatrix*vec4(position,1.);
      gl_PointSize=clamp(aSize*uScale/max(1.,-p.z),2.,110.); gl_Position=projectionMatrix*p; }`,
    fragmentShader: `varying vec3 vColor; varying float vDim; uniform float uOpacity;
      void main(){ float r=length(gl_PointCoord-.5)*2.; if(r>1.) discard;
      float core=1.-smoothstep(.03,.29,r); float glow=pow(1.-r,3.)*.64;
      gl_FragColor=vec4(mix(vColor,vec3(1.),core*.68),(core+glow)*vDim*uOpacity); }`,
  });
  own(nodeShader);
  const starsGeo = own(new THREE.BufferGeometry()),
    starPositions = [],
    starColors = [];
  for (let i = 0; i < (options.ambientStars === false ? 0 : 1100); i++) {
    const a = ((hash("star-a" + i) % 10000) / 10000) * Math.PI * 2,
      z = (hash("star-z" + i) % 10000) / 5000 - 1;
    const r = 2300 + (i % 13) * 20,
      d = Math.sqrt(1 - z * z);
    starPositions.push(Math.cos(a) * d * r, z * r, Math.sin(a) * d * r);
    const light = 0.3 + (hash("light" + i) % 100) / 160;
    starColors.push(light * 0.72, light * 0.86, light);
  }
  starsGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3),
  );
  starsGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(starColors, 3),
  );
  const stars = new THREE.Points(
    starsGeo,
    own(
      new THREE.PointsMaterial({
        size: 1.2,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      }),
    ),
  );
  scene.add(stars);
  function remove(object) {
    if (!object) return;
    scene.remove(object);
    object.geometry.dispose();
    if (object.material !== nodeShader) object.material.dispose();
  }
  function setCamera() {
    camera.position
      .set(
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.cos(theta),
      )
      .multiplyScalar(distance)
      .add(target);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }
  function rebuildLines() {
    remove(lines);
    const vertices = [],
      colors = [];
    for (const e of edges) {
      const a = nodeIndex.get(e.source),
        b = nodeIndex.get(e.target);
      if (a === undefined || b === undefined) continue;
      const p = new THREE.Vector3().fromArray(positions, a * 3),
        q = new THREE.Vector3().fromArray(positions, b * 3);
      const bend = new THREE.Vector3(-(q.y - p.y), q.x - p.x, 0)
        .normalize()
        .multiplyScalar(Math.min(18, p.distanceTo(q) * 0.08));
      const linked =
          selected && (e.source === selected || e.target === selected),
        near = focus.has(e.source) && focus.has(e.target);
      const c = new THREE.Color(
        nodes[a].color || colorFor(nodes[a].group),
      ).lerp(new THREE.Color(nodes[b].color || colorFor(nodes[b].group)), 0.5);
      const inGroup =
        focusedGroups &&
        focusedGroups.has(nodes[a].group) &&
        focusedGroups.has(nodes[b].group);
      c.multiplyScalar(
        selected
          ? linked
            ? 0.85
            : near
              ? 0.38
              : 0.025
          : focusedGroups
            ? inGroup
              ? 0.6
              : 0.035
            : 0.38,
      );
      for (let j = 0; j < 6; j++)
        for (const t of [j / 6, (j + 1) / 6]) {
          const v = p
            .clone()
            .lerp(q, t)
            .addScaledVector(bend, 4 * t * (1 - t));
          vertices.push(v.x, v.y, v.z);
          colors.push(c.r, c.g, c.b);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    scene.add(lines);
  }
  function updateAppearance() {
    focus = neighborhood(selected, edges, focusDepth);
    if (points) {
      const dims = points.geometry.attributes.aDim,
        sizes = points.geometry.attributes.aSize;
      nodes.forEach((n, i) => {
        dims.setX(
          i,
          selected
            ? focus.has(n.id)
              ? 1
              : 0.08
            : focusedGroups
              ? focusedGroups.has(n.group)
                ? 1
                : 0.12
              : 1,
        );
        sizes.setX(
          i,
          (14 + Math.min(10, Math.sqrt(degree.get(n.id) || 0) * 3)) *
            (n.id === selected ? 1.65 : n.id === hovered ? 1.3 : 1),
        );
      });
      dims.needsUpdate = sizes.needsUpdate = true;
    }
    rebuildLines();
    lastLabels = 0;
    schedule();
  }
  function geometryFromPositions() {
    if (!points) return;
    points.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    points.geometry.computeBoundingSphere();
    rebuildLines();
    rebuildMist();
    lastLabels = 0;
    schedule();
  }
  function rebuildMist() {
    remove(mist);
    const centers = [],
      colors = [],
      sizes = [],
      dims = [];
    const membership = new Map();
    nodes.forEach((n, i) => {
      if (!membership.has(n.group)) membership.set(n.group, []);
      membership.get(n.group).push(i);
    });
    groupCenters = [];
    for (const g of groups) {
      const groupNodes = membership.get(g.id) || [];
      if (!groupNodes.length) continue;
      const center = new THREE.Vector3();
      for (const i of groupNodes)
        center.add(new THREE.Vector3().fromArray(positions, i * 3));
      center.divideScalar(groupNodes.length);
      groupCenters.push({
        ...g,
        center: center.clone(),
        count: groupNodes.length,
      });
      centers.push(...center.toArray());
      const c = new THREE.Color(g.color || colorFor(g.id));
      colors.push(c.r, c.g, c.b);
      sizes.push(Math.min(280, 80 + groupNodes.length * 3));
      dims.push(0.05);
    }
    groupCenters.sort((a, b) => b.count - a.count);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(centers, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    geom.setAttribute("aDim", new THREE.Float32BufferAttribute(dims, 1));
    // A separate, very soft point shader avoids extra textures and postprocessing passes.
    const material = nodeShader.clone();
    material.fragmentShader = `varying vec3 vColor; varying float vDim; uniform float uOpacity;
      void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vColor,pow(1.-r,3.)*vDim);}`;
    mist = new THREE.Points(geom, material);
    scene.add(mist);
  }
  function launchLayout() {
    revision++;
    worker?.terminate();
    worker = null;
    status.textContent = "正在整理星系…";
    try {
      worker = new Worker(new URL("./galaxy-worker.js", import.meta.url), {
        type: "module",
      });
      worker.onmessage = ({ data }) => {
        if (dead || data.revision !== revision) return;
        positions = data.positions;
        geometryFromPositions();
        if (selected) select(selected);
        else if (focusedGroups) focusGroupCamera();
        status.textContent = "";
        worker.terminate();
        worker = null;
      };
      worker.onerror = () => {
        worker?.terminate();
        worker = null;
        status.textContent = "使用轻量星系布局";
      };
      worker.postMessage({
        nodes: nodes.map(({ id, group }) => ({ id, group })),
        edges,
        mode,
        revision,
      });
    } catch {
      status.textContent = "使用轻量星系布局";
    }
  }
  function update(next) {
    nodes = next.nodes.slice(0, 1500);
    edges = next.edges;
    groups = next.groups || [];
    nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));
    degree = new Map();
    for (const e of edges)
      for (const id of [e.source, e.target])
        degree.set(id, (degree.get(id) || 0) + 1);
    if (selected && !nodeIndex.has(selected)) selected = null;
    const first = !points;
    remove(points);
    positions = seedLayout(nodes, mode);
    const geom = new THREE.BufferGeometry(),
      colors = [];
    for (const n of nodes) {
      const c = new THREE.Color(n.color || colorFor(n.group));
      colors.push(c.r, c.g, c.b);
    }
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute(
      "aSize",
      new THREE.Float32BufferAttribute(
        nodes.map(() => 16),
        1,
      ),
    );
    geom.setAttribute(
      "aDim",
      new THREE.Float32BufferAttribute(
        nodes.map(() => 1),
        1,
      ),
    );
    points = new THREE.Points(geom, nodeShader);
    scene.add(points);
    const radius = Math.max(
      140,
      ...nodes.map((n, i) => Math.hypot(...positions.slice(i * 3, i * 3 + 3))),
    );
    baseDistance =
      (radius * 2.65) / Math.min(1.5, Math.max(0.6, width / height));
    if (first || (!selected && !focusedGroups)) {
      distance = baseDistance;
      target.set(0, 0, 0);
      flight = null;
    }
    rebuildMist();
    updateAppearance();
    launchLayout();
    if (selected) select(selected);
  }
  function updateEdges(nextEdges) {
    edges = nextEdges;
    degree = new Map();
    for (const e of edges)
      for (const id of [e.source, e.target])
        degree.set(id, (degree.get(id) || 0) + 1);
    updateAppearance(); // Preserve camera and positions as background link reads arrive.
  }
  function select(id, fly = true) {
    selected = nodeIndex.has(id) ? id : null;
    if (selected && fly) {
      const p = new THREE.Vector3().fromArray(
        positions,
        nodeIndex.get(selected) * 3,
      );
      const neighbors = neighborhood(selected, edges, 1),
        spread = Math.max(
          65,
          ...[...neighbors]
            .filter((n) => nodeIndex.has(n))
            .map((n) =>
              p.distanceTo(
                new THREE.Vector3().fromArray(positions, nodeIndex.get(n) * 3),
              ),
            ),
        );
      flyTo(p, Math.max(310, Math.min(baseDistance, spread * 3.3)));
    }
    updateAppearance();
  }
  function flyTo(position, nextDistance) {
    flight = {
      start: performance.now(),
      from: target.clone(),
      to: position.clone(),
      fromDistance: distance,
      toDistance: nextDistance,
    };
    interactionTime = performance.now();
    if (reduced.matches) {
      target.copy(position);
      distance = nextDistance;
      flight = null;
    }
    schedule();
  }
  function reset() {
    selected = null;
    hovered = null;
    focusedGroups = null;
    flyTo(new THREE.Vector3(), baseDistance);
    updateAppearance();
  }
  function focusGroupCamera() {
    const members = nodes.filter((n) => focusedGroups?.has(n.group));
    if (!members.length) return;
    const center = new THREE.Vector3();
    for (const n of members)
      center.add(
        new THREE.Vector3().fromArray(positions, nodeIndex.get(n.id) * 3),
      );
    center.multiplyScalar(1 / members.length);
    const radius = Math.max(
      60,
      ...members.map((n) =>
        center.distanceTo(
          new THREE.Vector3().fromArray(positions, nodeIndex.get(n.id) * 3),
        ),
      ),
    );
    const vertical = THREE.MathUtils.degToRad(23);
    const fov = Math.min(
      vertical,
      Math.atan((Math.tan(vertical) * width) / height),
    );
    flyTo(center, Math.max(240, (radius / Math.sin(fov)) * 1.2));
  }
  function focusGroups(ids, fly = true) {
    focusedGroups = ids == null ? null : new Set(ids);
    selected = null;
    hovered = null;
    if (fly) {
      if (focusedGroups) focusGroupCamera();
      else flyTo(new THREE.Vector3(), baseDistance);
    }
    updateAppearance();
  }
  function labelFrame() {
    const candidates = [...nodes].sort((a, b) => {
      const score = (n) =>
        (n.id === selected ? 10000 : 0) +
        (n.id === hovered ? 9000 : 0) +
        (focus.has(n.id) ? 200 : 0) +
        (degree.get(n.id) || 0) * 3 +
        (hash(n.id) % 17) / 17;
      return score(b) - score(a);
    });
    const occupied = [];
    let groupCount = 0;
    if (!selected && options.onGroup) {
      const candidates = groupCenters.filter(
        (group) => !focusedGroups || focusedGroups.has(group.id),
      );
      for (const group of candidates) {
        if (groupCount >= groupPool.length) break;
        const center = group.center.clone().project(camera);
        const x = (center.x * 0.5 + 0.5) * width,
          y = (-center.y * 0.5 + 0.5) * height - 35;
        const w = Math.min(200, Math.max(100, group.title.length * 12 + 40));
        const rect = { x: x - w / 2, y, w, h: 29 };
        if (
          center.z < -1 ||
          center.z > 1 ||
          rect.x < 8 ||
          rect.x + w > width - 8 ||
          y < 8 ||
          y > height - 45 ||
          occupied.some(
            (r) =>
              rect.x < r.x + r.w + 10 &&
              rect.x + w > r.x - 10 &&
              rect.y < r.y + r.h + 8 &&
              rect.y + 29 > r.y - 8,
          )
        )
          continue;
        const b = groupPool[groupCount++];
        b.hidden = false;
        b.dataset.group = group.id;
        b.textContent = `${group.title} · ${group.count}`;
        b.title = `${group.title} · ${group.count} 篇 · ${group.basis}`;
        b.setAttribute(
          "aria-label",
          `聚焦 ${group.title}，${group.count} 篇记忆`,
        );
        b.style.setProperty("--group-color", group.color || colorFor(group.id));
        b.style.transform = `translate3d(${x}px,${y}px,0) translateX(-50%)`;
        occupied.push(rect);
      }
    }
    for (let i = groupCount; i < groupPool.length; i++)
      groupPool[i].hidden = true;
    let count = 0;
    for (const n of candidates) {
      if (count >= labelPool.length) break;
      const important = n.id === selected || n.id === hovered;
      if (selected && !focus.has(n.id) && !important) continue;
      if (!selected && focusedGroups && !focusedGroups.has(n.group)) continue;
      projected.fromArray(positions, nodeIndex.get(n.id) * 3).project(camera);
      const x = (projected.x * 0.5 + 0.5) * width,
        y = (-projected.y * 0.5 + 0.5) * height + 15;
      if (
        projected.z > 1 ||
        projected.z < -1 ||
        x < 35 ||
        x > width - 35 ||
        y < 50 ||
        y > height - 55
      )
        continue;
      const w = Math.min(180, n.title.length * 11),
        rect = { x: x - w / 2, y, w, h: 20 };
      if (
        !important &&
        occupied.some(
          (r) =>
            rect.x < r.x + r.w + 12 &&
            rect.x + w > r.x - 12 &&
            rect.y < r.y + r.h + 10 &&
            rect.y + 20 > r.y - 10,
        )
      )
        continue;
      if (!important && count > (selected ? 16 : 10)) continue;
      occupied.push(rect);
      const b = labelPool[count++];
      b.hidden = false;
      b.dataset.node = n.id;
      if (b.textContent !== n.title) b.textContent = n.title;
      b.title = n.title;
      b.setAttribute("aria-label", "查看记忆节点 " + n.title);
      b.classList.toggle("selected", important);
      b.style.transform = `translate3d(${x}px,${y}px,0) translateX(-50%)`;
    }
    for (let i = count; i < labelPool.length; i++) labelPool[i].hidden = true;
  }
  function render(now) {
    raf = 0;
    if (dead || document.hidden || !inView) return;
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
    lastTime = now;
    if (flight) {
      let t = Math.min(1, (now - flight.start) / 850);
      t = t * t * (3 - 2 * t);
      target.lerpVectors(flight.from, flight.to, t);
      distance =
        flight.fromDistance + (flight.toDistance - flight.fromDistance) * t;
      if (t >= 1) flight = null;
    }
    if (
      auto &&
      !reduced.matches &&
      !drag &&
      !flight &&
      now - interactionTime > 4000
    )
      theta += dt * 0.035;
    setCamera();
    nodeShader.uniforms.uScale.value =
      height / (2 * Math.tan(THREE.MathUtils.degToRad(23)));
    if (mist)
      mist.material.uniforms.uScale.value = nodeShader.uniforms.uScale.value;
    if (now - lastLabels > 90) {
      labelFrame();
      lastLabels = now;
    }
    renderer.render(scene, camera);
    // Exposed as DOM diagnostics, not a global mutable renderer handle.
    host.dataset.drawCalls = String(renderer.info.render.calls);
    host.dataset.nodes = String(nodes.length);
    host.dataset.edges = String(edges.length);
    if (flight || (auto && !reduced.matches)) schedule();
  }
  function schedule() {
    if (!dead && !raf && !document.hidden && inView)
      raf = requestAnimationFrame(render);
  }
  function resize() {
    const was = width;
    height = Math.max(1, host.clientHeight);
    width = Math.max(1, host.clientWidth);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (was === 1) distance = baseDistance;
    lastLabels = 0;
    schedule();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibleObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) schedule();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  visibleObserver.observe(host);
  function pick(e) {
    const r = canvas.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top;
    let nearest = null,
      threshold = 15;
    for (let i = 0; i < nodes.length; i++) {
      projected.fromArray(positions, i * 3).project(camera);
      if (projected.z > 1 || projected.z < -1) continue;
      const d = Math.hypot(
        (projected.x * 0.5 + 0.5) * width - x,
        (-projected.y * 0.5 + 0.5) * height - y,
      );
      if (d < threshold) {
        threshold = d;
        nearest = nodes[i].id;
      }
    }
    return nearest;
  }
  const onDown = (e) => {
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag = {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pan: e.shiftKey || e.metaKey || e.button === 2,
    };
    flight = null;
    interactionTime = performance.now();
    if (pointers.size === 2) {
      const p = [...pointers.values()];
      pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      drag.moved = true;
    }
  };
  const onMove = (e) => {
    if (pointers.has(e.pointerId))
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag) {
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      drag.moved =
        drag.moved ||
        Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4;
      if (pointers.size === 2) {
        const p = [...pointers.values()],
          span = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinch > 0)
          distance = Math.max(
            100,
            Math.min(baseDistance * 3, (distance * pinch) / Math.max(1, span)),
          );
        pinch = span;
      } else if (drag.pan) {
        const right = new THREE.Vector3().setFromMatrixColumn(
            camera.matrixWorld,
            0,
          ),
          up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        target
          .addScaledVector(right, ((-dx * distance) / height) * 0.8)
          .addScaledVector(up, ((dy * distance) / height) * 0.8);
      } else {
        theta -= dx * 0.005;
        phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi - dy * 0.005));
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
      lastLabels = 0;
      interactionTime = performance.now();
      schedule();
    } else {
      const id = pick(e);
      if (id !== hovered) {
        hovered = id;
        canvas.style.cursor = id ? "pointer" : "grab";
        updateAppearance();
      }
    }
  };
  const onUp = (e) => {
    const moved = drag?.moved;
    const active = pointers.has(e.pointerId);
    pointers.delete(e.pointerId);
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
    if (pointers.size) {
      if (drag) drag.moved = true;
      return;
    }
    drag = null;
    pinch = null;
    if (active && !moved) {
      const id = pick(e);
      if (id) options.onSelect(id);
      else {
        reset();
        options.onClear?.();
      }
    }
  };
  const onCancel = (e) => {
    pointers.delete(e.pointerId);
    drag = null;
    pinch = null;
  };
  const onWheel = (e) => {
    e.preventDefault();
    flight = null;
    distance = Math.max(
      100,
      Math.min(
        baseDistance * 3,
        distance * Math.exp(Math.max(-150, Math.min(150, e.deltaY)) * 0.0016),
      ),
    );
    interactionTime = performance.now();
    lastLabels = 0;
    schedule();
  };
  const onKey = (e) => {
    if (e.key === "Escape" || e.key.toLowerCase() === "r") {
      e.preventDefault();
      reset();
      options.onClear?.();
      return;
    }
    const moves = {
      ArrowLeft: [-0.08, 0],
      ArrowRight: [0.08, 0],
      ArrowUp: [0, -0.08],
      ArrowDown: [0, 0.08],
    };
    if (moves[e.key]) {
      e.preventDefault();
      theta += moves[e.key][0];
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi + moves[e.key][1]));
    } else if (["+", "=", "-"].includes(e.key)) {
      e.preventDefault();
      distance = Math.max(
        100,
        Math.min(baseDistance * 3, distance * (e.key === "-" ? 1.15 : 0.87)),
      );
    } else return;
    interactionTime = performance.now();
    lastLabels = 0;
    schedule();
  };
  const noContext = (e) => e.preventDefault();
  for (const [event, fn] of [
    ["pointerdown", onDown],
    ["pointermove", onMove],
    ["pointerup", onUp],
    ["pointercancel", onCancel],
    ["contextmenu", noContext],
    ["keydown", onKey],
  ])
    canvas.addEventListener(event, fn);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  const visibility = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
    schedule();
  };
  document.addEventListener("visibilitychange", visibility);
  const reduceChange = () => {
    if (reduced.matches) auto = false;
    options.onMotion?.(auto);
    schedule();
  };
  reduced.addEventListener("change", reduceChange);
  const lost = (e) => {
    e.preventDefault();
    destroy();
    host.replaceChildren();
    fallbackView = fallback(host, { ...options, nodes, edges, groups });
  };
  canvas.addEventListener("webglcontextlost", lost);
  function destroy() {
    if (fallbackView) {
      fallbackView.destroy();
      fallbackView = null;
    }
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    worker?.terminate();
    resizeObserver.disconnect();
    visibleObserver.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    reduced.removeEventListener("change", reduceChange);
    canvas.removeEventListener("webglcontextlost", lost);
    remove(points);
    remove(lines);
    remove(mist);
    for (const resource of resources) resource.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    labels.remove();
    status.remove();
    canvas.remove();
  }
  resize();
  update(options);
  const api = {
    update,
    updateEdges,
    select,
    reset,
    focusGroups,
    destroy,
    relayout: launchLayout,
    setDepth(value) {
      focusDepth = value;
      updateAppearance();
    },
    setMotion(value) {
      auto = !!value && !reduced.matches;
      options.onMotion?.(auto);
      schedule();
    },
    setMode(value) {
      mode = value;
      positions = seedLayout(nodes, mode);
      geometryFromPositions();
      launchLayout();
    },
    zoom(factor) {
      flight = null;
      distance = Math.max(100, Math.min(baseDistance * 3, distance * factor));
      lastLabels = 0;
      schedule();
    },
  };
  return Object.fromEntries(
    Object.entries(api).map(([name, fn]) => [
      name,
      (...args) =>
        fallbackView && name !== "destroy"
          ? fallbackView[name]?.(...args)
          : fn(...args),
    ]),
  );
}

function fallback(host, options) {
  const box = document.createElement("div");
  box.className = "galaxy-fallback";
  host.append(box);
  let selected = null,
    depth = 1,
    focusedGroups = null;
  function draw() {
    const near = neighborhood(selected, options.edges, depth);
    box.replaceChildren();
    const title = document.createElement("p");
    title.textContent = "当前设备使用二维记忆目录 · 正文和真实引用仍可浏览";
    box.append(title);
    for (const n of options.nodes) {
      if (focusedGroups && !focusedGroups.has(n.group) && !near.has(n.id))
        continue;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = n.title;
      b.className = near.has(n.id) ? "active" : "";
      b.onclick = () => options.onSelect(n.id);
      box.append(b);
    }
  }
  draw();
  options.onFallback?.();
  return {
    update(next) {
      options = { ...options, ...next };
      draw();
    },
    updateEdges(edges) {
      options.edges = edges;
      draw();
    },
    select(id) {
      selected = id;
      draw();
    },
    reset() {
      selected = null;
      focusedGroups = null;
      draw();
    },
    focusGroups(ids) {
      selected = null;
      focusedGroups = ids == null ? null : new Set(ids);
      draw();
    },
    destroy() {
      box.remove();
    },
    setDepth(d) {
      depth = d;
      draw();
    },
    setMotion() {},
    setMode() {},
    zoom() {},
  };
}
