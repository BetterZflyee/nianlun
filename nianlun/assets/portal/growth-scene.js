import * as THREE from "./vendor/three.module.min.js";
import { buildOverview, contourPoint, hash } from "./growth-scene-model.js";

/** Local project overview. The contour sculpture is decorative, not a graph edge.
 * mount(host, {projects, records, milestones, sites, onSelect(id), onReady(meta),
 * onError(error), reducedMotion, showCaption})
 * -> {destroy(), setPaused(bool), focus(id), clearFocus(), reset()}.
 * The caller gives host a height and calls destroy before leaving the page.
 */
export function mount(host, options = {}) {
  const model = buildOverview(options);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    options.onError?.(error);
    return fallback(host, model, options);
  }
  const root = document.createElement("div");
  root.className = "growth-scene-root";
  root.style.cssText =
    "position:absolute;inset:0;overflow:hidden;color:#d5eadc;background:radial-gradient(ellipse at 54% 60%,#204c3b88,transparent 62%);";
  host.append(root);
  const canvas = renderer.domElement;
  canvas.style.cssText =
    "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-4px;";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "项目生长全景。拖动或方向键旋转，点击光点打开项目，Escape 返回全景。轮廓不表示项目间关联。",
  );
  root.append(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0, 5.5, 8.8);
  camera.lookAt(0, 0, 0);
  const sculpture = new THREE.Group();
  sculpture.rotation.y = -0.15;
  sculpture.rotation.z = -0.08;
  scene.add(sculpture);
  const resources = [];
  const own = (resource) => (resources.push(resource), resource);

  // A continuous organic relief: luminous contours, open centre and depth.
  const ringVertices = [],
    ringColors = [];
  const sage = new THREE.Color("#85bfa0"),
    cream = new THREE.Color("#d7deb8"),
    deep = new THREE.Color("#456e57");
  for (let ring = 0; ring < 42; ring++) {
    const radius = 0.4 + ring * 0.073;
    const color = deep.clone().lerp(sage, ring / 52);
    if (ring % 7 === 0) color.lerp(cream, 0.6);
    for (let step = 0; step < 192; step++) {
      for (const offset of [0, 1]) {
        const angle = ((step + offset) / 192) * Math.PI * 2;
        const p = contourPoint(radius, angle, ring * 0.018);
        p[1] += Math.exp(-radius * 0.75) * 0.7;
        ringVertices.push(...p);
        ringColors.push(color.r, color.g, color.b);
      }
    }
  }
  const ringsGeo = own(new THREE.BufferGeometry());
  ringsGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(ringVertices, 3),
  );
  ringsGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(ringColors, 3),
  );
  const rings = new THREE.LineSegments(
    ringsGeo,
    own(
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  sculpture.add(rings);

  // Two fine highlights give the relief a changing silhouette without a costly post-process.
  for (const [radius, color, opacity] of [
    [3.47, "#c0d4a1", 0.56],
    [1.82, "#cfe7b7", 0.64],
  ]) {
    const points = [];
    for (let i = 0; i <= 192; i++)
      points.push(
        new THREE.Vector3(...contourPoint(radius, (i / 192) * Math.PI * 2)),
      );
    sculpture.add(
      new THREE.Line(
        own(new THREE.BufferGeometry().setFromPoints(points)),
        own(
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ),
      ),
    );
  }

  const dustPositions = [];
  for (let i = 0; i < 150; i++) {
    const a = (hash("dust-a" + i) / 4294967295) * Math.PI * 2;
    const r = 1.4 + ((hash("dust-r" + i) % 1000) / 1000) * 3.5;
    dustPositions.push(
      Math.cos(a) * r,
      ((hash("dust-y" + i) % 1000) / 1000) * 2 - 0.7,
      Math.sin(a) * r,
    );
  }
  const dustGeo = own(new THREE.BufferGeometry());
  dustGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(dustPositions, 3),
  );
  const dust = new THREE.Points(
    dustGeo,
    own(
      new THREE.PointsMaterial({
        color: "#9bbfa7",
        size: 1.2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    ),
  );
  sculpture.add(dust);

  const nodeGeo = own(new THREE.BufferGeometry());
  nodeGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      model.nodes.flatMap((node) => node.position),
      3,
    ),
  );
  nodeGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(
      model.nodes.flatMap((node) => {
        const color = new THREE.Color(node.color);
        return [color.r, color.g, color.b];
      }),
      3,
    ),
  );
  const nodeMaterial = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
      },
      vertexShader:
        "varying vec3 vColor; uniform float uPixelRatio; void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(30.*uPixelRatio*9./max(1.,-p.z),12.,70.);}",
      fragmentShader:
        "varying vec3 vColor; void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float core=1.-smoothstep(.05,.23,r);float glow=pow(1.-r,3.);gl_FragColor=vec4(mix(vColor,vec3(1.),core*.55),core+glow*.7);}",
    }),
  );
  sculpture.add(new THREE.Points(nodeGeo, nodeMaterial));
  const selectedRing = new THREE.Mesh(
    own(new THREE.RingGeometry(0.12, 0.135, 48)),
    own(
      new THREE.MeshBasicMaterial({
        color: "#dce9bf",
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    ),
  );
  selectedRing.visible = false;
  scene.add(selectedRing);

  const label = document.createElement("button");
  label.type = "button";
  label.className = "growth-scene-label";
  label.style.cssText =
    "position:absolute;display:none;max-width:min(250px,70%);padding:9px 12px;text-align:left;border:1px solid #b6d1b533;border-radius:9px;background:#102d24ed;color:#e4efdf;backdrop-filter:blur(10px);box-shadow:0 8px 28px #0003;line-height:1.45;z-index:2;";
  const labelTitle = document.createElement("strong"),
    labelInfo = document.createElement("small");
  labelTitle.style.cssText =
    "display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:550;";
  labelInfo.style.cssText =
    "display:block;color:#a3c2af;font-size:10px;margin-top:3px;white-space:normal;";
  label.append(labelTitle, labelInfo);
  root.append(label);
  const caption = document.createElement("div");
  caption.className = "growth-scene-caption";
  caption.style.cssText =
    "position:absolute;left:18px;bottom:14px;color:#9bbbA7;font:10px/1.5 system-ui,sans-serif;pointer-events:none;letter-spacing:.04em;";
  caption.textContent = model.total
    ? "光点是项目 · 点击打开 · 拖动旋转"
    : "项目从这里生长";
  if (model.overflow)
    caption.textContent += ` · 展示 ${model.shown}/${model.total} 个项目`;
  if (options.showCaption !== false) root.append(caption);
  // Every represented project is keyboard reachable, even if its point is occluded.
  const access = document.createElement("div");
  access.style.cssText =
    "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);";
  access.setAttribute("aria-label", "生长全景中的项目");
  for (const node of model.nodes) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${node.title} · ${node.status}`;
    button.addEventListener("focus", () => {
      focus(node.id);
      label.style.outline = "2px solid #dbeacb";
    });
    button.addEventListener("blur", () => {
      label.style.outline = "";
    });
    button.addEventListener("click", () => options.onSelect?.(node.id));
    access.append(button);
  }
  root.append(access);

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = Boolean(options.reducedMotion ?? media.matches),
    paused = false,
    inView = true;
  let dead = false,
    frame = 0,
    lastFrame = 0,
    width = 1,
    height = 1,
    selected = null,
    hovered = null;
  let yaw = -0.15,
    pitch = -0.08,
    drag = null,
    dirty = true,
    fallbackView = null;
  const projected = new THREE.Vector3(),
    world = new THREE.Vector3();
  const screenPoints = new Map();
  const buttonFocus = () => selected || hovered || model.nodes[0]?.id;
  label.addEventListener("click", () => {
    if (buttonFocus()) options.onSelect?.(buttonFocus());
  });

  function animateAllowed() {
    return !paused && !reduced && inView && !document.hidden;
  }
  function schedule() {
    if (!dead && !frame && inView && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function invalidate() {
    dirty = true;
    schedule();
  }
  function updateLabel() {
    const id = buttonFocus();
    const node = model.nodes.find((item) => item.id === id);
    const point = screenPoints.get(id);
    if (!node || !point || point.z < -1 || point.z > 1) {
      label.style.display = "none";
      return;
    }
    labelTitle.textContent = node.title;
    labelInfo.textContent = `${node.status} · ${node.counts.records} 条记录 · ${node.counts.milestones} 个里程碑`;
    label.title = "打开项目：" + node.title;
    label.style.display = "block";
    const labelWidth = label.offsetWidth || 230,
      labelHeight = label.offsetHeight || 58;
    label.style.left =
      Math.max(10, Math.min(width - labelWidth - 10, point.x + 14)) + "px";
    label.style.top =
      Math.max(
        10,
        Math.min(height - labelHeight - 32, point.y - labelHeight / 2),
      ) + "px";
  }
  function draw(time) {
    frame = 0;
    if (dead || document.hidden || !inView) return;
    if (time - lastFrame < 1000 / 30 && !dirty) {
      schedule();
      return;
    }
    const delta = lastFrame ? Math.min(50, time - lastFrame) : 0;
    lastFrame = time;
    if (animateAllowed() && !drag && !selected && !hovered)
      yaw += delta * 0.000018;
    sculpture.rotation.y = yaw;
    sculpture.rotation.z = pitch;
    sculpture.updateMatrixWorld();
    camera.updateMatrixWorld();
    for (const node of model.nodes) {
      world.set(...node.position).applyMatrix4(sculpture.matrixWorld);
      projected.copy(world).project(camera);
      screenPoints.set(node.id, {
        x: ((projected.x + 1) * width) / 2,
        y: ((1 - projected.y) * height) / 2,
        z: projected.z,
      });
      if (node.id === buttonFocus()) selectedRing.position.copy(world);
    }
    selectedRing.visible = Boolean(buttonFocus());
    selectedRing.quaternion.copy(camera.quaternion);
    renderer.render(scene, camera);
    updateLabel();
    dirty = false;
    if (animateAllowed()) schedule();
  }
  function resize() {
    if (dead) return;
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 5.5, width < height * 1.15 ? 11.8 : 8.8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }
  function pick(event) {
    const rect = canvas.getBoundingClientRect(),
      x = event.clientX - rect.left,
      y = event.clientY - rect.top;
    let nearest = null,
      distance = 22 * 22;
    for (const [id, point] of screenPoints) {
      const squared = (point.x - x) ** 2 + (point.y - y) ** 2;
      if (point.z >= -1 && point.z <= 1 && squared < distance) {
        distance = squared;
        nearest = id;
      }
    }
    return nearest;
  }
  function pointerDown(event) {
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
    canvas.style.cursor = "grabbing";
  }
  function pointerMove(event) {
    if (drag && event.pointerId === drag.id) {
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      yaw = drag.yaw + dx * 0.006;
      pitch = Math.max(-0.4, Math.min(0.35, drag.pitch + dy * 0.002));
    } else hovered = pick(event);
    canvas.style.cursor = drag ? "grabbing" : hovered ? "pointer" : "grab";
    invalidate();
  }
  function pointerUp(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = "grab";
    if (!moved) {
      const id = pick(event);
      if (id) options.onSelect?.(id);
    }
    invalidate();
  }
  function pointerCancel() {
    drag = null;
    canvas.style.cursor = "grab";
    invalidate();
  }
  function pointerLeave(event) {
    if (!drag && !label.contains(event.relatedTarget)) {
      hovered = null;
      invalidate();
    }
  }
  label.addEventListener("pointerleave", () => {
    if (!drag) {
      hovered = null;
      invalidate();
    }
  });
  function keyDown(event) {
    if (event.key === "Escape") reset();
    else if (event.key === "ArrowLeft") yaw -= 0.15;
    else if (event.key === "ArrowRight") yaw += 0.15;
    else if (event.key === "ArrowUp") pitch = Math.max(-0.4, pitch - 0.06);
    else if (event.key === "ArrowDown") pitch = Math.min(0.35, pitch + 0.06);
    else return;
    event.preventDefault();
    invalidate();
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    } else invalidate();
  }
  function motionChanged(event) {
    reduced = Boolean(options.reducedMotion ?? event.matches);
    invalidate();
  }
  function focus(id) {
    if (fallbackView) return fallbackView.focus(id);
    selected = model.nodes.some((node) => node.id === String(id))
      ? String(id)
      : null;
    hovered = null;
    invalidate();
  }
  function reset() {
    if (fallbackView) return fallbackView.reset();
    selected = null;
    hovered = null;
    yaw = -0.15;
    pitch = -0.08;
    invalidate();
  }
  function clearFocus() {
    if (fallbackView) return fallbackView.clearFocus();
    selected = null;
    hovered = null;
    label.style.outline = "";
    invalidate();
  }
  function setPaused(value) {
    if (fallbackView) return fallbackView.setPaused(value);
    paused = Boolean(value);
    invalidate();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersection =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            inView = entries[0]?.isIntersecting !== false;
            if (!inView) {
              cancelAnimationFrame(frame);
              frame = 0;
              lastFrame = 0;
            } else invalidate();
          },
          { threshold: 0.02 },
        )
      : null;
  intersection?.observe(host);
  const events = {
    pointerdown: pointerDown,
    pointermove: pointerMove,
    pointerup: pointerUp,
    pointercancel: pointerCancel,
    pointerleave: pointerLeave,
    keydown: keyDown,
  };
  for (const [name, handler] of Object.entries(events))
    canvas.addEventListener(name, handler);
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", motionChanged);
  function release() {
    cancelAnimationFrame(frame);
    frame = 0;
    resizeObserver.disconnect();
    intersection?.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", motionChanged);
    for (const [name, handler] of Object.entries(events))
      canvas.removeEventListener(name, handler);
    canvas.removeEventListener("webglcontextlost", contextLost);
    resources.forEach((resource) => resource.dispose());
    renderer.dispose();
    root.remove();
  }
  function contextLost(event) {
    event.preventDefault();
    if (dead) return;
    dead = true;
    release();
    options.onError?.(new Error("三维绘图暂不可用，已切换项目目录"));
    fallbackView = fallback(host, model, options);
  }
  canvas.addEventListener("webglcontextlost", contextLost);
  function destroy() {
    if (fallbackView) {
      fallbackView.destroy();
      fallbackView = null;
      return;
    }
    if (dead) return;
    dead = true;
    release();
  }
  resize();
  options.onReady?.({
    mode: "webgl",
    total: model.total,
    shown: model.shown,
    overflow: model.overflow,
  });
  return { destroy, setPaused, focus, clearFocus, reset };
}

function fallback(host, model, options) {
  const root = document.createElement("div");
  root.className = "growth-scene-fallback";
  root.style.cssText =
    "position:absolute;inset:0;overflow:auto;padding:25px;display:flex;align-content:center;justify-content:center;flex-wrap:wrap;gap:9px;background:radial-gradient(ellipse at center,#315c42aa,#102b20);";
  const heading = document.createElement("p");
  heading.textContent = model.total
    ? "项目生长全景 · 当前设备使用轻量视图"
    : "从第一个项目开始积累";
  heading.style.cssText =
    "flex:0 0 100%;text-align:center;color:#b9d2c0;font-size:12px;";
  root.append(heading);
  const buttons = new Map();
  for (const node of model.nodes) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = node.title;
    button.title = node.status;
    button.style.cssText =
      "height:38px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:8px 14px;border-radius:22px;border:1px solid #99bd9e55;background:#28553b99;color:#e0efdd;font:12px system-ui,sans-serif;cursor:pointer;";
    button.addEventListener("click", () => options.onSelect?.(node.id));
    root.append(button);
    buttons.set(node.id, button);
  }
  if (model.overflow) {
    const note = document.createElement("p");
    note.textContent = `此处展示 ${model.shown}/${model.total} 个项目，其余项目可在下方列表查看。`;
    note.style.cssText =
      "flex:0 0 100%;text-align:center;color:#a8c5b0;font-size:11px;";
    root.append(note);
  }
  host.append(root);
  options.onReady?.({
    mode: "fallback",
    total: model.total,
    shown: model.shown,
    overflow: model.overflow,
  });
  return {
    destroy: () => root.remove(),
    setPaused() {},
    focus(id) {
      for (const [key, button] of buttons)
        button.style.outline = key === String(id) ? "2px solid #e0efdd" : "";
    },
    clearFocus() {
      for (const button of buttons.values()) button.style.outline = "";
    },
    reset() {
      for (const button of buttons.values()) button.style.outline = "";
    },
  };
}
