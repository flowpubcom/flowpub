// ─────────────────────────────────────────────────────────────────────────
// FlowPub · «webxperience» de brag — lógica de la pieza.
// Vanilla JS + módulos. Sin frameworks, sin red.
//   · Campo de partículas Three.js (motas de amate/champagne a la deriva).
//   · Toggles ES/EN y claro/oscuro (persisten en localStorage).
//   · Revelado on-scroll (IntersectionObserver).
//   · Mini-animaciones: onda-vírgula, timer de grabación, morph transcript→artículo.
// Respeta prefers-reduced-motion en todo.
// ─────────────────────────────────────────────────────────────────────────

import * as THREE from "../three.module.js";

const html = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Paletas de partículas (heredadas del splash real; voltean con el tema) ──
const LIGHT = ["#1A1714", "#C0303A", "#D98A3D", "#9A2530", "#6E685D"];
const DARK = ["#F2EFE8", "#C0303A", "#D98A3D", "#F6D49A", "#EC9DA2"];

// ═══════════════════════════════════════════════════════════════════════════
// 1 · TEMA + IDIOMA
// ═══════════════════════════════════════════════════════════════════════════

// Screenshots que cambian según el tema activo (claro/oscuro).
const shotPub = document.getElementById("shotPub");
const shotFlow = document.getElementById("shotFlow");
function applyShots(theme) {
  if (shotPub) shotPub.src = `/shots/pub-desktop-${theme}.png`;
  if (shotFlow) shotFlow.src = `/shots/flow-mobile-${theme}.png`;
}

// Iconos sol/luna del botón de tema.
const icoSun = document.querySelector(".ico-sun");
const icoMoon = document.querySelector(".ico-moon");
function applyThemeIcons(theme) {
  const dark = theme === "dark";
  if (icoSun) icoSun.style.display = dark ? "none" : "";
  if (icoMoon) icoMoon.style.display = dark ? "" : "none";
}

let stage = null; // referencia al campo de partículas (para re-teñir al cambiar tema)

function setTheme(theme, persist = true) {
  html.setAttribute("data-theme", theme);
  if (persist) {
    try { localStorage.setItem("fp-brag-theme", theme); } catch (e) {}
  }
  applyShots(theme);
  applyThemeIcons(theme);
  if (stage) stage.recolor(theme === "dark");
}

function setLang(lang, persist = true) {
  html.setAttribute("lang", lang);
  html.setAttribute("data-lang", lang);
  if (persist) {
    try { localStorage.setItem("fp-brag-lang", lang); } catch (e) {}
  }
  // aria-pressed de los botones del segmento
  document.querySelectorAll("[data-lang-btn]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.langBtn === lang));
  });
  // etiqueta del botón de tema para lectores de pantalla
  const tb = document.getElementById("themeBtn");
  if (tb) tb.setAttribute("aria-label", lang === "es" ? "Cambiar tema" : "Toggle theme");
}

// Estado inicial (el bootstrap del <head> ya fijó los atributos; los sincronizamos).
const initialTheme = html.getAttribute("data-theme") || "light";
const initialLang = html.getAttribute("data-lang") || "es";
applyShots(initialTheme);
applyThemeIcons(initialTheme);
setLang(initialLang, false);

// Listeners de los toggles.
document.getElementById("themeBtn")?.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
});
document.querySelectorAll("[data-lang-btn]").forEach((b) => {
  b.addEventListener("click", () => setLang(b.dataset.langBtn));
});

// Si el usuario no ha elegido override, seguimos al SO en vivo.
try {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("fp-brag-theme")) setTheme(e.matches ? "dark" : "light", false);
  });
} catch (e) {}

// ═══════════════════════════════════════════════════════════════════════════
// 2 · REVELADO ON-SCROLL
// ═══════════════════════════════════════════════════════════════════════════
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ═══════════════════════════════════════════════════════════════════════════
// 3 · ONDA-VÍRGULA (reproductor: línea que ondula, no waveform genérico)
// ═══════════════════════════════════════════════════════════════════════════
(function buildWave() {
  const path = document.getElementById("wavePath");
  if (!path) return;
  const W = 320, H = 40, mid = H / 2;
  // Trazo senoidal suave, repetido para poder animar el dashoffset «fluyendo».
  let d = `M0 ${mid}`;
  for (let x = 0; x <= W; x += 8) {
    const y = mid + Math.sin(x * 0.09) * 11 * Math.sin(x * 0.013 + 0.6);
    d += ` L${x.toFixed(0)} ${y.toFixed(1)}`;
  }
  path.setAttribute("d", d);
  path.style.strokeDasharray = "6 10";
})();

// ═══════════════════════════════════════════════════════════════════════════
// 4 · TIMER DE GRABACIÓN (cuenta al entrar en viewport; se detiene en reduce)
// ═══════════════════════════════════════════════════════════════════════════
(function recTimer() {
  const el = document.getElementById("recTimer");
  const recorder = document.getElementById("recorder");
  if (!el || !recorder || reduce) return;
  let started = false;
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !started) {
        started = true;
        const t0 = performance.now();
        const tick = () => {
          const s = Math.min(180, (performance.now() - t0) / 1000);
          const m = Math.floor(s / 60);
          const ss = Math.floor(s % 60).toString().padStart(2, "0");
          el.textContent = `${m}:${ss}`;
          if (s < 180) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  }, { threshold: 0.4 });
  obs.observe(recorder);
})();

// ═══════════════════════════════════════════════════════════════════════════
// 5 · MORPH: transcript crudo → artículo pulido → portada (secuencial on-scroll)
// ═══════════════════════════════════════════════════════════════════════════
(function morphSequence() {
  const morph = document.getElementById("morph");
  const steps = Array.from(document.querySelectorAll("#steps .step"));
  if (!morph) return;

  const lightStep = (i) => steps.forEach((s, k) => s.classList.toggle("on", k === i));

  const run = () => {
    if (reduce) {
      // Sin animación: mostramos el estado final (artículo + portada), paso 3 activo.
      morph.classList.add("article", "cover");
      lightStep(2);
      return;
    }
    // Reinicia y reproduce la secuencia.
    morph.classList.remove("article", "cover");
    lightStep(0);
    setTimeout(() => { lightStep(1); morph.classList.add("article"); }, 1100);
    setTimeout(() => { lightStep(2); morph.classList.add("cover"); }, 2300);
  };

  let played = false;
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !played) { played = true; run(); }
    }
  }, { threshold: 0.4 });
  obs.observe(morph);

  // Al cambiar de idioma reproducimos de nuevo (el copy cambió); solo si ya se vio.
  html.addEventListener("fp:relang", () => { if (played && !reduce) run(); });
})();

// Avisamos del cambio de idioma para re-disparar la secuencia del morph.
document.querySelectorAll("[data-lang-btn]").forEach((b) => {
  b.addEventListener("click", () => html.dispatchEvent(new CustomEvent("fp:relang")));
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · CAMPO DE PARTÍCULAS (Three.js) — heredado del splash de la app.
//     Dos capas (cerca + lejos) que derivan, ondulan y responden al cursor y
//     al scroll. Click → onda expansiva. Reduce → un frame quieto, sin rAF.
// ═══════════════════════════════════════════════════════════════════════════
function initStage() {
  const mount = document.getElementById("stage");
  if (!mount) return;

  const w = () => window.innerWidth;
  const h = () => window.innerHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    return; // sin WebGL: el degradado CSS del fondo sostiene la pieza
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w(), h());
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w() / h(), 0.1, 100);
  camera.position.set(0, 0, 14);

  // Sprite redondo suave (gota de luz).
  const sprite = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  })();

  let dark = html.getAttribute("data-theme") === "dark";
  const area = w() * h();

  const buildLayer = (opts) => {
    const { count } = opts;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const palette = (dark ? DARK : LIGHT).map((hx) => new THREE.Color(hx));
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * 21;
      const y = (Math.random() * 2 - 1) * 12;
      const z = opts.zMin + Math.random() * (opts.zMax - opts.zMin);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const r = Math.random();
      const col = r < 0.52 ? palette[0] : r < 0.8 ? palette[1] : r < 0.92 ? palette[2] : palette[3];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: opts.size, map: sprite, vertexColors: true, transparent: true,
      depthWrite: false, opacity: opts.opacity,
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    return {
      points, geo, mat,
      pos: geo.attributes.position, colAttr: geo.attributes.color,
      base: positions.slice(), seeds, count,
      waveScale: opts.waveScale, rippleAmp: opts.rippleAmp, opacity: opts.opacity,
    };
  };

  const near = buildLayer({
    count: reduce ? 200 : Math.min(640, Math.round(area / 2600)),
    size: dark ? 0.15 : 0.11, opacity: dark ? 0.32 : 0.36,
    zMin: -3, zMax: 3, waveScale: 1, rippleAmp: 1.7,
  });
  const far = buildLayer({
    count: reduce ? 120 : Math.min(440, Math.round(area / 3800)),
    size: dark ? 0.07 : 0.055, opacity: dark ? 0.14 : 0.18,
    zMin: -16, zMax: -9, waveScale: 0.7, rippleAmp: 1.1,
  });
  const layers = [near, far];

  // Re-teñido al cambiar el tema (sin reconstruir geometría).
  const recolor = (isDark) => {
    dark = isDark;
    for (const L of layers) {
      const palette = (dark ? DARK : LIGHT).map((hx) => new THREE.Color(hx));
      const c = L.colAttr.array;
      for (let i = 0; i < L.count; i++) {
        const r = ((L.seeds[i] * 97) % 1 + 1) % 1; // determinista por semilla
        const col = r < 0.52 ? palette[0] : r < 0.8 ? palette[1] : r < 0.92 ? palette[2] : palette[3];
        c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
      }
      L.colAttr.needsUpdate = true;
      L.mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      L.mat.needsUpdate = true;
    }
    if (reduce) renderer.render(scene, camera);
  };

  const clock = new THREE.Clock();
  const ptr = { x: 0, y: 0 };
  let prog = 0;
  let raf = 0;
  const ripples = [];

  const onScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    prog = Math.min(1, Math.max(0, window.scrollY / max));
  };
  const onPointer = (e) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onResize = () => {
    camera.aspect = w() / h();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w(), h());
    if (reduce) renderer.render(scene, camera);
  };

  // Click en zona vacía → onda expansiva (no sobre links/botones).
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPt = new THREE.Vector3();
  const onClick = (e) => {
    if (reduce) return;
    const el = e.target;
    if (el && el.closest && el.closest('a,button,input,textarea,select,label,[role="button"]')) return;
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(planeZ0, hitPt)) return;
    ripples.push({ x: hitPt.x, y: hitPt.y, t: clock.getElapsedTime(), strength: 1, speed: 9, life: 0.85, width: 1.8 });
    if (ripples.length > 18) ripples.shift();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("click", onClick, { passive: true });
  onScroll();

  const frame = () => {
    const t = clock.getElapsedTime();
    while (ripples.length && t - ripples[0].t > ripples[0].life) ripples.shift();

    for (const L of layers) {
      for (let i = 0; i < L.count; i++) {
        const bx = L.base[i * 3];
        const by = L.base[i * 3 + 1];
        const bz = L.base[i * 3 + 2];
        const s = L.seeds[i];
        const wave = (Math.sin(t * 0.5 + bx * 0.33 + s) * 0.5 + Math.cos(t * 0.31 + bz * 0.4 + s) * 0.32) * L.waveScale;
        let dx = 0, dy = 0;
        for (let r = 0; r < ripples.length; r++) {
          const rp = ripples[r];
          const age = t - rp.t;
          if (age > rp.life) continue;
          const ex = bx - rp.x, ey = by - rp.y;
          const dist = Math.hypot(ex, ey);
          const front = age * rp.speed;
          const band = Math.exp(-((dist - front) * (dist - front)) / (2 * rp.width * rp.width));
          const amp = L.rippleAmp * rp.strength * (1 - age / rp.life) * band;
          if (dist > 0.001) { dx += (ex / dist) * amp; dy += (ey / dist) * amp; }
        }
        L.pos.setXYZ(i, bx + Math.sin(t * 0.14 + s) * 0.24 + dx, by + wave * (0.55 + prog * 0.7) + dy, bz);
      }
      L.pos.needsUpdate = true;
    }

    camera.position.x += (ptr.x * 1.7 - camera.position.x) * 0.04;
    camera.position.y += (-ptr.y * 1.05 - camera.position.y) * 0.04;
    camera.position.z = 14 - prog * 3.6;
    near.points.rotation.z = prog * 0.22;
    far.points.rotation.z = prog * 0.13;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  if (reduce) renderer.render(scene, camera);
  else raf = requestAnimationFrame(frame);

  return { recolor };
}

stage = initStage() || null;
