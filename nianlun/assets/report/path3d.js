import * as THREE from "../portal/vendor/three.module.min.js";

// Enhance an existing, factual SVG flow. No inferred edges or remote resources.
export function captureFlow(svg) {
  if (svg.querySelector("[transform]")) return null;
  const elements = [...svg.querySelectorAll(".am-node")];
  if (elements.some((node) => node.getAttribute("transform"))) return null;
  const nodes = elements.map((node) => {
    const box = node.getBBox();
    return {
      label: node.getAttribute("data-key") || node.textContent.trim(),
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      width: box.width,
      height: box.height,
    };
  });
  if (
    !nodes.length ||
    nodes.length > 12 ||
    nodes.some((n) => !n.label || !Number.isFinite(n.x + n.y) || n.width <= 0)
  )
    return null;
  const paths = [...svg.querySelectorAll(".am-edge")];
  if (paths.some((path) => typeof path.getTotalLength !== "function"))
    return null;
  const edges = paths.map((path) => {
    const length = path.getTotalLength();
    const points = Array.from({ length: 25 }, (_, i) => {
      const point = path.getPointAtLength((length * i) / 24);
      return { x: point.x, y: point.y };
    });
    const hasArrow = (name) => {
      const value = path.getAttribute(name);
      return !!value && value !== "none";
    };
    return {
      points,
      arrowStart: hasArrow("marker-start"),
      arrowEnd: hasArrow("marker-end"),
    };
  });
  const box = svg.viewBox.baseVal;
  if (
    !(box.width > 0 && box.height > 0) ||
    !Number.isFinite(box.width + box.height + box.x + box.y)
  )
    return null;
  return {
    nodes,
    edges,
    width: box.width,
    height: box.height,
    x: box.x,
    y: box.y,
  };
}

export function install() {
  for (const svg of document.querySelectorAll("figure.am-flow svg")) {
    let wrap = svg.closest(".nl-flow-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "nl-flow-wrap";
      svg.replaceWith(wrap);
      wrap.append(svg);
    }
    let button = wrap.querySelector(".nl-path-open");
    if (!button) {
      button = document.createElement("button");
      wrap.append(button);
    }
    button.type = "button";
    button.className = "nl-path-open";
    button.textContent = "立体查看 ↗";
    button.disabled = false;
    button.setAttribute("aria-label", "以三维方式查看这条推进路径");
    button.onclick = () => {
      try {
        const data = captureFlow(svg);
        if (!data) throw Error("unsupported");
        openPath(data, button);
      } catch {
        button.textContent = "当前设备使用二维路径";
        button.disabled = true;
      }
    };
  }
}

function openPath(data, opener) {
  const dialog = document.createElement("dialog");
  dialog.className = "nl-path-dialog";
  const heading = document.createElement("header");
  const title = document.createElement("h2");
  title.textContent = "推进路径";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "关闭立体路径");
  heading.append(title, close);
  const hint = document.createElement("p");
  hint.className = "nl-path-hint";
  hint.textContent = "拖动调整视角 · 点选节点聚焦 · 关系与原图一致";
  const host = document.createElement("div");
  host.className = "nl-path-stage";
  const nav = document.createElement("div");
  nav.className = "nl-path-nodes";
  nav.setAttribute("aria-label", "路径节点");
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "复位视角";
  reset.className = "nl-path-reset";
  dialog.append(heading, hint, host, nav, reset);
  document.body.append(dialog);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    dialog.remove();
    throw error;
  }
  const owned = [],
    own = (item) => (owned.push(item), item);
  const scene = new THREE.Scene(),
    group = new THREE.Group();
  scene.add(group);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
  camera.position.set(0, 0, 1000);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const labels = [],
    meshes = [],
    buttons = [];
  const center = { x: data.x + data.width / 2, y: data.y + data.height / 2 };
  const position = (point) =>
    new THREE.Vector3(point.x - center.x, center.y - point.y, 0);
  const fill = new THREE.Color("#e3ede1"),
    selected = new THREE.Color("#92b39c");
  for (const [i, node] of data.nodes.entries()) {
    const geometry = own(new THREE.BoxGeometry(node.width, node.height, 10));
    const material = own(new THREE.MeshLambertMaterial({ color: fill }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position(node));
    group.add(mesh);
    meshes.push(mesh);
    const outline = new THREE.LineSegments(
      own(new THREE.EdgesGeometry(geometry)),
      own(new THREE.LineBasicMaterial({ color: "#477660" })),
    );
    mesh.add(outline);
    const label = document.createElement("button");
    label.type = "button";
    label.className = "nl-path-label";
    label.textContent = node.label;
    label.onclick = () => select(i);
    host.append(label);
    labels.push(label);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = node.label;
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => select(i);
    nav.append(button);
    buttons.push(button);
  }
  for (const edge of data.edges) {
    const points = edge.points.map(position);
    const geometry = own(new THREE.BufferGeometry().setFromPoints(points));
    group.add(
      new THREE.Line(
        geometry,
        own(new THREE.LineBasicMaterial({ color: "#58846b" })),
      ),
    );
    function arrowAt(end, previous) {
      const direction = end.clone().sub(previous).normalize();
      if (!direction.lengthSq()) return;
      const arrow = new THREE.Mesh(
        own(new THREE.ConeGeometry(3, 8, 12)),
        own(new THREE.MeshBasicMaterial({ color: "#58846b" })),
      );
      arrow.position.copy(end).addScaledVector(direction, -4);
      arrow.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      );
      group.add(arrow);
    }
    if (points.length > 1 && edge.arrowEnd)
      arrowAt(points.at(-1), points.at(-2));
    if (points.length > 1 && edge.arrowStart) arrowAt(points[0], points[1]);
  }
  scene.add(new THREE.HemisphereLight("#ffffff", "#91a78e", 2));
  const light = new THREE.DirectionalLight("#ffffff", 2);
  light.position.set(-150, 250, 500);
  scene.add(light);
  group.rotation.set(-0.15, 0.12, 0);
  let disposed = false,
    frame = 0,
    drag = null;
  function select(index) {
    meshes.forEach((mesh, i) =>
      mesh.material.color.copy(i === index ? selected : fill),
    );
    buttons.forEach((b, i) =>
      b.setAttribute("aria-pressed", String(i === index)),
    );
    labels.forEach((b, i) => b.classList.toggle("selected", i === index));
    draw();
  }
  function draw() {
    if (disposed || frame || document.hidden) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      renderer.render(scene, camera);
      const rect = host.getBoundingClientRect();
      for (const [i, mesh] of meshes.entries()) {
        const point = mesh
          .localToWorld(new THREE.Vector3(0, 0, 8))
          .project(camera);
        labels[i].style.left = ((point.x + 1) * rect.width) / 2 + "px";
        labels[i].style.top = ((1 - point.y) * rect.height) / 2 + "px";
      }
    });
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const span = Math.max(
      data.width * 1.22,
      ((data.height * width) / height) * 1.4,
    );
    camera.left = -span / 2;
    camera.right = span / 2;
    camera.top = (span * height) / width / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  host.addEventListener("pointerdown", (event) => {
    if (event.target !== renderer.domElement) return;
    drag = {
      x: event.clientX,
      y: event.clientY,
      rx: group.rotation.x,
      ry: group.rotation.y,
    };
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener("pointermove", (event) => {
    if (!drag) return;
    group.rotation.x = Math.max(
      -0.55,
      Math.min(0.55, drag.rx + (event.clientY - drag.y) * 0.004),
    );
    group.rotation.y = Math.max(
      -0.65,
      Math.min(0.65, drag.ry + (event.clientX - drag.x) * 0.004),
    );
    draw();
  });
  const release = () => {
    drag = null;
  };
  host.addEventListener("pointerup", release);
  host.addEventListener("pointercancel", release);
  host.addEventListener("lostpointercapture", release);
  host.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      dialog.close();
    },
    { capture: true },
  );
  reset.onclick = () => {
    group.rotation.set(-0.15, 0.12, 0);
    draw();
  };
  close.onclick = () => dialog.close();
  const visibility = () => {
    if (!document.hidden) draw();
  };
  document.addEventListener("visibilitychange", visibility);
  dialog.addEventListener("dblclick", (event) => event.stopPropagation());
  dialog.addEventListener(
    "close",
    () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      owned.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      dialog.remove();
      opener.focus();
    },
    { once: true },
  );
  dialog.showModal();
  resize();
}

if (typeof document !== "undefined") install();
