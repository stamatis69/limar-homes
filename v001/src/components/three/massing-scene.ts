import {
  NeutralToneMapping,
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  FogExp2,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import type { DrawingSpec } from "@/lib/types";

/**
 * Schematic massing model generated from a development's DrawingSpec (floor count, bays, roof,
 * ground-floor type, site features). Architectural "card model" language: ivory slabs, dark
 * glazing, champagne edge lines. It is a diagram, never a depiction of the real façade.
 */

export interface MassingOptions {
  reduced: boolean;
  tone: "dark" | "light";
  /** Explode floors apart and swing the camera as the host scrolls away (hero behaviour). */
  scrollExplode: boolean;
  onReady?: () => void;
}

export interface MassingHandle {
  dispose(): void;
}

const BAY = 3.4;
const FLOOR = 3.2;
const GROUND = 3.9;
const DEPTH = 12.5;
const SLAB = 0.34;

const PALETTE = {
  dark: { bg: 0x0e1114, slab: 0xf4ede2, edge: 0xdcc7a1, glass: 0x3a4f63, glow: 0x9a6a2e, fin: 0xe6ddcf, shadow: 0.42 },
  light: { bg: 0xf4efe7, slab: 0xfbf8f3, edge: 0x7a5629, glass: 0x33475a, glow: 0x6a4a1e, fin: 0xe4dccd, shadow: 0.2 },
};

export function createMassing(canvas: HTMLCanvasElement, spec: DrawingSpec, opts: MassingOptions): MassingHandle | null {
  // Without GPU acceleration (software rasterisers) a continuous render loop, MSAA and shadow passes
  // would saturate the CPU: probe first, then render on demand only, at 1x, without those passes.
  const software = isSoftwareGL();
  const still = opts.reduced || software;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !software, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const pal = PALETTE[opts.tone];
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(software ? 1 : Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = opts.tone === "dark" ? 1.05 : 1;
  renderer.shadowMap.enabled = !software;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.fog = new FogExp2(pal.bg, 0.0105);

  // ---------- Materials (Lambert/Phong: a card model needs no PBR, and compiles far faster) ----------
  const disposables: Array<BufferGeometry | Material | { dispose(): void }> = [];
  const mat = <T extends Material>(m: T) => (disposables.push(m), m);
  const geo = <T extends BufferGeometry>(g: T) => (disposables.push(g), g);

  const slabMat = mat(new MeshLambertMaterial({ color: pal.slab }));
  const finMat = mat(new MeshLambertMaterial({ color: pal.fin }));
  const glassMat = mat(new MeshPhongMaterial({ color: pal.glass, specular: 0x9fb4c8, shininess: 90, emissive: pal.glow, emissiveIntensity: 0.18 }));
  const railMat = mat(new MeshPhongMaterial({ color: 0xcfd9e0, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.28, depthWrite: false }));
  const edgeMat = mat(new LineBasicMaterial({ color: pal.edge, transparent: true, opacity: opts.tone === "dark" ? 0.55 : 0.45 }));
  const poolMat = mat(new MeshPhongMaterial({ color: 0x5f86a8, specular: 0xffffff, shininess: 140, emissive: 0x0d2233, emissiveIntensity: 0.6 }));
  const treeMat = slabMat;

  const W = spec.bays * BAY;
  const D = DEPTH;

  // One shared unit cube (and its edge outline); every block is that cube, scaled.
  const unitBox = geo(new BoxGeometry(1, 1, 1));
  const unitEdges = geo(new EdgesGeometry(unitBox));
  const box = (w: number, h: number, d: number, m: Material, edges = false) => {
    const mesh = new Mesh(unitBox, m);
    mesh.scale.set(w, h, d);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (edges) mesh.add(new LineSegments(unitEdges, edgeMat));
    return mesh;
  };

  // ---------- Building ----------
  const building = new Group();
  const floors: Group[] = [];

  // Ground level
  const ground = new Group();
  {
    const podium = box(W + 0.8, SLAB, D + 0.8, slabMat, true);
    podium.position.y = SLAB / 2;
    ground.add(podium);
    if (spec.ground === "pilotis") {
      const lobby = box(W * 0.42, GROUND - SLAB, D * 0.5, glassMat);
      lobby.position.set(-W * 0.18, SLAB + (GROUND - SLAB) / 2, 0);
      ground.add(lobby);
      const colGeo = geo(new CylinderGeometry(0.2, 0.2, GROUND - SLAB, 20));
      for (let i = 0; i <= spec.bays; i++) {
        for (const z of [-D / 2 + 0.5, D / 2 - 0.5]) {
          const c = new Mesh(colGeo, finMat);
          c.castShadow = true;
          c.position.set(-W / 2 + i * BAY, SLAB + (GROUND - SLAB) / 2, z);
          ground.add(c);
        }
      }
    } else {
      const inset = spec.ground === "retail" ? 0.25 : 1.2;
      const shop = box(W - inset, GROUND - SLAB, D - inset, glassMat);
      shop.position.y = SLAB + (GROUND - SLAB) / 2;
      ground.add(shop);
      if (spec.ground === "retail") {
        for (let i = 0; i <= spec.bays; i++) {
          const f = box(0.16, GROUND - SLAB, 0.3, finMat);
          f.position.set(-W / 2 + i * BAY, SLAB + (GROUND - SLAB) / 2, D / 2 - 0.1);
          ground.add(f);
        }
      }
    }
  }
  building.add(ground);

  // Typical floors
  for (let f = 1; f <= spec.floors; f++) {
    const g = new Group();
    const baseY = GROUND + (f - 1) * FLOOR;
    g.userData.baseY = baseY;
    g.position.y = baseY;

    const slab = box(W + 0.6, SLAB, D + 0.6, slabMat, true);
    slab.position.y = SLAB / 2;
    g.add(slab);

    const glass = box(W - 0.5, FLOOR - SLAB, D - 0.5, glassMat);
    glass.position.y = SLAB + (FLOOR - SLAB) / 2;
    g.add(glass);

    // Vertical fins on the long façades, one per bay line.
    for (let i = 0; i <= spec.bays; i++) {
      for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) {
        const fin = box(0.14, FLOOR - SLAB, 0.42, finMat);
        fin.position.set(-W / 2 + i * BAY, SLAB + (FLOOR - SLAB) / 2, z);
        g.add(fin);
      }
    }
    // Side fins
    const sideBays = Math.max(2, Math.round(D / 3.2));
    for (let j = 1; j < sideBays; j++) {
      for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) {
        const fin = box(0.42, FLOOR - SLAB, 0.14, finMat);
        fin.position.set(x, SLAB + (FLOOR - SLAB) / 2, -D / 2 + (j * D) / sideBays);
        g.add(fin);
      }
    }
    // Balconies on alternating bays of the front façade.
    for (let b = 0; b < spec.bays; b++) {
      if ((b + f) % 2 !== 0) continue;
      const x = -W / 2 + b * BAY + BAY / 2;
      const bal = box(BAY - 0.3, 0.2, 1.5, slabMat, true);
      bal.position.set(x, 0.1, D / 2 + 0.75);
      g.add(bal);
      const rail = box(BAY - 0.3, 1.05, 0.05, railMat);
      rail.castShadow = false;
      rail.position.set(x, 0.2 + 0.525, D / 2 + 1.48);
      g.add(rail);
    }
    floors.push(g);
    building.add(g);
  }

  // Roof
  const roof = new Group();
  const roofY = GROUND + spec.floors * FLOOR;
  roof.userData.baseY = roofY;
  roof.position.y = roofY;
  {
    const slab = box(W + 0.6, SLAB, D + 0.6, slabMat, true);
    slab.position.y = SLAB / 2;
    roof.add(slab);
    const pH = 1.05;
    for (const [w, d, x, z] of [
      [W + 0.6, 0.18, 0, D / 2 + 0.21],
      [W + 0.6, 0.18, 0, -D / 2 - 0.21],
      [0.18, D + 0.6, W / 2 + 0.21, 0],
      [0.18, D + 0.6, -W / 2 - 0.21, 0],
    ] as const) {
      const p = box(w, pH, d, slabMat);
      p.position.set(x, SLAB + pH / 2, z);
      roof.add(p);
    }
    if (spec.roof === "terrace") {
      const coreW = Math.max(3.2, W * 0.26);
      const core = box(coreW, 2.7, D * 0.36, slabMat, true);
      core.position.set(W / 2 - coreW / 2 - 0.6, SLAB + 1.35, -D * 0.18);
      roof.add(core);
      if (spec.features.includes("pergola")) {
        const span = W * 0.5;
        const slats = Math.round(span / 0.6);
        for (let i = 0; i <= slats; i++) {
          const s = box(0.1, 0.14, D * 0.62, finMat);
          s.position.set(-W / 2 + 0.8 + i * (span / slats), SLAB + 2.6, 0);
          roof.add(s);
        }
        for (const x of [-W / 2 + 0.8, -W / 2 + 0.8 + span]) {
          for (const z of [-D * 0.3, D * 0.3]) {
            const post = box(0.14, 2.5, 0.14, finMat);
            post.position.set(x, SLAB + 1.3, z);
            roof.add(post);
          }
        }
      }
    }
  }
  building.add(roof);

  // Site: model trees, pool
  const site = new Group();
  if (spec.features.includes("garden")) {
    const trunk = geo(new CylinderGeometry(0.07, 0.09, 2.2, 8));
    const crown = geo(new SphereGeometry(1.25, 24, 16));
    const spots: Array<[number, number, number]> = [
      [-W / 2 - 4.2, D / 2 + 2.5, 1],
      [W / 2 + 3.8, D / 2 + 1.2, 0.85],
      [-W / 2 - 3.2, -D / 2 + 1.5, 0.9],
      [W / 2 + 4.6, -D / 2 - 0.5, 1.1],
    ];
    for (const [x, z, s] of spots) {
      const t = new Group();
      const tr = new Mesh(trunk, treeMat);
      tr.position.y = 1.1;
      const cr = new Mesh(crown, treeMat);
      cr.position.y = 2.2 + 1.0;
      cr.scale.setScalar(1);
      tr.castShadow = cr.castShadow = true;
      t.add(tr, cr);
      t.scale.setScalar(s);
      t.position.set(x, 0, z);
      site.add(t);
    }
  }
  if (spec.features.includes("pool")) {
    const pool = box(W * 0.55, 0.12, 4.2, poolMat);
    pool.castShadow = false;
    pool.position.set(0, 0.06, D / 2 + 5.2);
    site.add(pool);
  }
  building.add(site);
  scene.add(building);

  // Table: soft shadow catcher + fading plan grid drawn in brass.
  const shadowPlane = new Mesh(geo(new PlaneGeometry(160, 160)), mat(new ShadowMaterial({ opacity: pal.shadow })));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
  const gridTex = planGridTexture(opts.tone === "dark" ? "rgba(220,199,161,0.22)" : "rgba(122,86,41,0.2)");
  disposables.push(gridTex);
  const grid = new Mesh(geo(new PlaneGeometry(90, 90)), mat(new MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false })));
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.005;
  scene.add(grid);

  // ---------- Light ----------
  scene.add(new HemisphereLight(0xfbf3e6, opts.tone === "dark" ? 0x3a342d : 0xd9cfbf, opts.tone === "dark" ? 1.9 : 1.6));
  const sun = new DirectionalLight(0xffe4c2, opts.tone === "dark" ? 5.2 : 4.4);
  const H = roofY + 3;
  sun.position.set(W * 1.1 + 10, H * 2.6 + 24, D * 1.2 + 12);
  sun.castShadow = true;
  const ext = Math.max(W, D, H) * 1.1 + 6;
  sun.shadow.camera.left = -ext;
  sun.shadow.camera.right = ext;
  sun.shadow.camera.top = ext;
  sun.shadow.camera.bottom = -ext;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  const shadowRes = coarse || software ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowRes, shadowRes);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 5;
  scene.add(sun);
  const rim = new DirectionalLight(0x9fb7d6, opts.tone === "dark" ? 0.9 : 0.4);
  rim.position.set(-W - 20, H + 6, -D - 24);
  scene.add(rim);

  // ---------- Camera ----------
  const camera = new PerspectiveCamera(26, 1, 0.5, 400);
  const target = new Vector3(0, H * 0.46, 0);
  const radiusFit = () => {
    const r = Math.hypot(W + 10, D + 8, H + 2) / 2;
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    return (r / Math.sin(Math.min(vFov, hFov) / 2)) * 0.9;
  };

  // ---------- Loop bookkeeping (declared before anything can call kick()) ----------
  let raf = 0;
  let last = performance.now();
  let settleFrames = 0;
  let readySent = false;
  let compiled = false; // nothing renders until every shader program is ready

  // ---------- Interaction state ----------
  const state = {
    yaw: -0.62,
    pitch: 0.2,
    yawVel: 0,
    dragYaw: 0,
    pointerX: 0,
    pointerY: 0,
    lookX: 0,
    lookY: 0,
    explode: 0,
    progress: 0,
    visible: true,
    running: false,
    dragging: false,
    lastX: 0,
  };

  const onPointerMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    state.pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (state.dragging) {
      const dx = e.clientX - state.lastX;
      state.lastX = e.clientX;
      state.dragYaw += dx * 0.006;
      state.yawVel = dx * 0.006;
      kick();
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    state.dragging = true;
    state.lastX = e.clientX;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = (e: PointerEvent) => {
    state.dragging = false;
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  const onPointerLeave = () => {
    state.pointerX = 0;
    state.pointerY = 0;
  };
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);

  // ---------- Size ----------
  const host = canvas.parentElement ?? canvas;
  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    kick();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const io = new IntersectionObserver(([e]) => {
    state.visible = Boolean(e?.isIntersecting);
    if (state.visible) kick();
  });
  io.observe(canvas);
  const onVisibility = () => document.visibilityState === "visible" && kick();
  document.addEventListener("visibilitychange", onVisibility);

  // ---------- Loop ----------

  function scrollProgress() {
    if (!opts.scrollExplode) return 0;
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const centre = r.top + r.height / 2;
    return Math.min(1, Math.max(0, (vh / 2 - centre) / (vh * 0.75)));
  }

  function tick(now: number) {
    // rAF timestamps can precede the performance.now() taken in kick(): never let dt go negative.
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const target01 = scrollProgress();
    const ease = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing

    if (!still) {
      if (!state.dragging) {
        state.yaw += dt * 0.07; // slow turntable
        state.dragYaw += state.yawVel;
        state.yawVel *= Math.pow(0.02, dt);
      }
      state.lookX += (state.pointerX - state.lookX) * ease * 0.6;
      state.lookY += (state.pointerY - state.lookY) * ease * 0.6;
    } else {
      state.lookX = state.lookY = 0;
    }
    state.progress += (target01 - state.progress) * (still ? 1 : ease);
    state.progress = Math.min(1, Math.max(0, state.progress));
    const p = smooth(state.progress);
    state.explode = p;

    floors.forEach((g, i) => {
      g.position.y = (g.userData.baseY as number) + p * (i + 1) * 1.35;
    });
    roof.position.y = (roof.userData.baseY as number) + p * (floors.length + 1) * 1.35;

    const yaw = state.yaw + state.dragYaw + state.lookX * 0.14 + p * 0.9;
    const pitch = state.pitch + state.lookY * -0.05 + p * 0.32;
    const R = radiusFit() * (1 + p * 0.18);
    const tgt = target.clone();
    tgt.y += p * floors.length * 0.6;
    camera.position.set(tgt.x + Math.sin(yaw) * Math.cos(pitch) * R, tgt.y + Math.sin(pitch) * R, tgt.z + Math.cos(yaw) * Math.cos(pitch) * R);
    camera.lookAt(tgt);

    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      opts.onReady?.();
    }

    const moving = !still || state.dragging || Math.abs(target01 - state.progress) > 0.0005 || Math.abs(state.yawVel) > 0.0001;
    if (moving) settleFrames = 0;
    else settleFrames++;
    const shouldRun = state.visible && document.visibilityState === "visible" && settleFrames < 2;
    if (shouldRun) raf = requestAnimationFrame(tick);
    else state.running = false;
  }

  function kick() {
    if (state.running || !compiled) return;
    state.running = true;
    settleFrames = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  // Reduced motion still follows scroll (as a static state change) — listen for scroll to wake.
  const onScroll = () => {
    if (opts.scrollExplode) kick();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Compile every program up front without stalling the main thread (KHR_parallel_shader_compile
  // where available), then start rendering.
  let disposed = false;
  camera.aspect = Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight);
  renderer
    .compileAsync(scene, camera)
    .catch(() => undefined)
    .then(() => {
      if (disposed) return;
      compiled = true;
      kick();
    });

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}

function isSoftwareGL() {
  try {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** A drawn site-plan grid that fades out radially, as a CanvasTexture. */
function planGridTexture(stroke: string) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cells = 36;
  const step = size / cells;
  ctx.strokeStyle = stroke;
  for (let i = 0; i <= cells; i++) {
    ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.75;
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  // Radial fade to transparent at the edges.
  ctx.globalCompositeOperation = "destination-in";
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

