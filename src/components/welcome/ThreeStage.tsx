"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSound } from "@/providers/SoundProvider";

// Fondo generativo (Three.js) de la landing: DOS capas de partículas (cerca +
// lejos, para dar profundidad) que fluyen como una voz, ondulan, derivan y
// responden al scroll y al cursor. Interactivo de dos formas:
//   · TAP/click en zona vacía → onda que empuja las cercanas + «burbuja».
//   · el cursor PASA cerca de una → estalla suavecito + «spark».
// Paleta de marca; voltea con el tema. Respeta prefers-reduced-motion (frame
// quieto, sin interacción). Limpia TODO al desmontar.

type Props = { dark: boolean };

const LIGHT = ["#1A1714", "#C0303A", "#D98A3D", "#9A2530", "#6E685D"];
const DARK = ["#F2EFE8", "#C0303A", "#D98A3D", "#F6D49A", "#EC9DA2"];

// Onda de un tap.
const TAP = { strength: 1, speed: 9, life: 0.85, width: 1.8 };
// Estallido suave al pasar el cursor.
const HOVER = { strength: 0.55, speed: 6, life: 0.5, width: 1.1 };
const HOVER_R2 = 0.5 * 0.5; // radio² (unidades de mundo) para "tocar" una partícula
const HOVER_COOLDOWN = 2.0; // s antes de que una partícula pueda re-estallar
const SPARK_THROTTLE = 0.09; // s entre sonidos de spark

interface Ripple {
  x: number;
  y: number;
  t: number;
  strength: number;
  speed: number;
  life: number;
  width: number;
}

function roundSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
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
}

interface Layer {
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  mat: THREE.PointsMaterial;
  pos: THREE.BufferAttribute;
  base: Float32Array;
  seeds: Float32Array;
  popAt: Float32Array;
  count: number;
  waveScale: number;
  rippleAmp: number;
}

export default function ThreeStage({ dark }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progRef = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef(0);
  const { play } = useSound();
  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const w = () => mount.clientWidth || window.innerWidth;
    const h = () => mount.clientHeight || window.innerHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return; // sin WebGL: el gradiente/glow de CSS sostienen el fondo
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w(), h());
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w() / h(), 0.1, 100);
    camera.position.set(0, 0, 14);

    const sprite = roundSprite();
    const palette = (dark ? DARK : LIGHT).map((hx) => new THREE.Color(hx));
    const area = w() * h();

    const buildLayer = (opts: {
      count: number;
      size: number;
      opacity: number;
      zMin: number;
      zMax: number;
      waveScale: number;
      rippleAmp: number;
    }): Layer => {
      const { count } = opts;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const x = (Math.random() * 2 - 1) * 21;
        const y = (Math.random() * 2 - 1) * 12;
        const z = opts.zMin + Math.random() * (opts.zMax - opts.zMin);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        const r = Math.random();
        const col =
          r < 0.52 ? palette[0] : r < 0.8 ? palette[1] : r < 0.92 ? palette[2] : palette[3];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
        seeds[i] = Math.random() * Math.PI * 2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: opts.size,
        map: sprite,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        opacity: opts.opacity,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return {
        points,
        geo,
        mat,
        pos: geo.attributes.position as THREE.BufferAttribute,
        base: positions.slice(),
        seeds,
        popAt: new Float32Array(count),
        count,
        waveScale: opts.waveScale,
        rippleAmp: opts.rippleAmp,
      };
    };

    // Más chicas y más transparentes que antes. Cerca (presentes) + lejos (tenues).
    const near = buildLayer({
      count: reduce ? 200 : Math.min(640, Math.round(area / 2500)),
      size: dark ? 0.15 : 0.11,
      opacity: dark ? 0.3 : 0.34,
      zMin: -3,
      zMax: 3,
      waveScale: 1,
      rippleAmp: 1.7,
    });
    const far = buildLayer({
      count: reduce ? 120 : Math.min(440, Math.round(area / 3600)),
      size: dark ? 0.07 : 0.055,
      opacity: dark ? 0.14 : 0.18,
      zMin: -16,
      zMax: -9,
      waveScale: 0.7,
      rippleAmp: 1.1,
    });
    const layers = [near, far];

    const clock = new THREE.Clock();
    let raf = 0;
    const ripples: Ripple[] = [];
    let lastSpark = 0;

    // ── interacción: tap → onda + burbuja ──────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const rayDir = new THREE.Vector3();
    const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hitPt = new THREE.Vector3();
    let down: { x: number; y: number; t: number; skip: boolean } | null = null;

    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      down = {
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        skip: !!el?.closest?.(
          'a,button,input,textarea,select,label,[role="button"]',
        ),
      };
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || reduce) return;
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
      if (d.skip || moved > 12 || performance.now() - d.t > 500) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(planeZ0, hitPt)) return;
      ripples.push({ x: hitPt.x, y: hitPt.y, t: clock.getElapsedTime(), ...TAP });
      if (ripples.length > 22) ripples.shift();
      playRef.current?.("bubble");
    };

    const onScroll = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      progRef.current = Math.min(1, Math.max(0, window.scrollY / max));
    };
    const onPointer = (e: PointerEvent) => {
      ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      lastMoveRef.current = performance.now();
    };
    const onResize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w(), h());
      if (reduce) renderer.render(scene, camera);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    const frame = () => {
      const t = clock.getElapsedTime();
      const prog = progRef.current;
      while (ripples.length && t - ripples[0].t > ripples[0].life) ripples.shift();

      // Estallido suave al pasar el cursor cerca de una partícula (capa cercana).
      if (performance.now() - lastMoveRef.current < 1100) {
        // NDC: la Y va invertida respecto a la coordenada de pantalla; sin este
        // signo las partículas estallaban en el espejo vertical del cursor.
        rayDir
          .set(ptr.current.x, -ptr.current.y, 0.5)
          .unproject(camera)
          .sub(camera.position)
          .normalize();
        const ox = camera.position.x;
        const oy = camera.position.y;
        const oz = camera.position.z;
        let pops = 0;
        for (let i = 0; i < near.count && pops < 3; i++) {
          if (t < near.popAt[i]) continue;
          const vx = near.base[i * 3] - ox;
          const vy = near.base[i * 3 + 1] - oy;
          const vz = near.base[i * 3 + 2] - oz;
          // distancia² punto→rayo = |v × dir|²  (dir normalizado)
          const cx = vy * rayDir.z - vz * rayDir.y;
          const cy = vz * rayDir.x - vx * rayDir.z;
          const cz = vx * rayDir.y - vy * rayDir.x;
          if (cx * cx + cy * cy + cz * cz < HOVER_R2) {
            ripples.push({
              x: near.base[i * 3],
              y: near.base[i * 3 + 1],
              t,
              ...HOVER,
            });
            if (ripples.length > 22) ripples.shift();
            near.popAt[i] = t + HOVER_COOLDOWN;
            pops++;
            if (t - lastSpark > SPARK_THROTTLE) {
              playRef.current?.("spark", 0.6);
              lastSpark = t;
            }
          }
        }
      }

      for (const L of layers) {
        for (let i = 0; i < L.count; i++) {
          const bx = L.base[i * 3];
          const by = L.base[i * 3 + 1];
          const bz = L.base[i * 3 + 2];
          const s = L.seeds[i];
          const wave =
            (Math.sin(t * 0.5 + bx * 0.33 + s) * 0.5 +
              Math.cos(t * 0.31 + bz * 0.4 + s) * 0.32) *
            L.waveScale;
          let dx = 0;
          let dy = 0;
          for (let r = 0; r < ripples.length; r++) {
            const rp = ripples[r];
            const age = t - rp.t;
            if (age > rp.life) continue;
            const ex = bx - rp.x;
            const ey = by - rp.y;
            const dist = Math.hypot(ex, ey);
            const front = age * rp.speed;
            const band = Math.exp(
              -((dist - front) * (dist - front)) / (2 * rp.width * rp.width),
            );
            const amp = L.rippleAmp * rp.strength * (1 - age / rp.life) * band;
            if (dist > 0.001) {
              dx += (ex / dist) * amp;
              dy += (ey / dist) * amp;
            }
          }
          L.pos.setXYZ(
            i,
            bx + Math.sin(t * 0.14 + s) * 0.24 + dx,
            by + wave * (0.55 + prog * 0.7) + dy,
            bz,
          );
        }
        L.pos.needsUpdate = true;
      }

      camera.position.x += (ptr.current.x * 1.7 - camera.position.x) * 0.04;
      camera.position.y += (-ptr.current.y * 1.05 - camera.position.y) * 0.04;
      camera.position.z = 14 - prog * 3.6;
      near.points.rotation.z = prog * 0.22;
      far.points.rotation.z = prog * 0.13;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    if (reduce) renderer.render(scene, camera);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      for (const L of layers) {
        L.geo.dispose();
        L.mat.dispose();
      }
      sprite.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [dark]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}
