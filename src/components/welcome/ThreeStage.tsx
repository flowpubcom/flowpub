"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Fondo generativo (Three.js) de la landing: un campo de partículas que fluye
// como una voz —ondula, deriva y responde al scroll y al cursor—. Paleta de
// marca; voltea con el tema. Respeta prefers-reduced-motion (pinta un frame
// quieto). Limpia TODO al desmontar (geo/mat/sprite/renderer/canvas/listeners).

type Props = { dark: boolean };

// Acentos de marca (fijos) + un tono base que cambia por tema.
const LIGHT = ["#1A1714", "#C0303A", "#D98A3D", "#9A2530", "#6E685D"];
const DARK = ["#F2EFE8", "#C0303A", "#D98A3D", "#F6D49A", "#EC9DA2"];

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

export default function ThreeStage({ dark }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progRef = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });

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
    const COUNT = reduce ? 260 : Math.min(1000, Math.round((w() * h()) / 1600));
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const palette = (dark ? DARK : LIGHT).map((hx) => new THREE.Color(hx));

    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() * 2 - 1) * 20;
      const y = (Math.random() * 2 - 1) * 11;
      const z = (Math.random() * 2 - 1) * 6;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const r = Math.random();
      const col =
        r < 0.52
          ? palette[0]
          : r < 0.8
            ? palette[1]
            : r < 0.92
              ? palette[2]
              : palette[3];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const base = positions.slice();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: dark ? 0.24 : 0.17,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      opacity: dark ? 0.92 : 0.62,
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const clock = new THREE.Clock();
    let raf = 0;

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
    };
    const onResize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w(), h());
      if (reduce) renderer.render(scene, camera); // sin loop: repinta al redimensionar
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    const frame = () => {
      const t = clock.getElapsedTime();
      const prog = progRef.current;
      for (let i = 0; i < COUNT; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];
        const s = seeds[i];
        const wave =
          Math.sin(t * 0.5 + bx * 0.33 + s) * 0.5 +
          Math.cos(t * 0.31 + bz * 0.4 + s) * 0.32;
        pos.setXYZ(
          i,
          bx + Math.sin(t * 0.14 + s) * 0.28,
          by + wave * (0.55 + prog * 0.85),
          bz,
        );
      }
      pos.needsUpdate = true;
      camera.position.x += (ptr.current.x * 1.7 - camera.position.x) * 0.04;
      camera.position.y += (-ptr.current.y * 1.05 - camera.position.y) * 0.04;
      camera.position.z = 14 - prog * 3.6;
      points.rotation.z = prog * 0.22;
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
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      sprite.dispose();
      renderer.forceContextLoss(); // suelta el contexto WebGL de forma determinista
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [dark]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}
