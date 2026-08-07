// Captura las 7 direcciones de arte de las portadas (claro y oscuro) para
// revisarlas de un vistazo. Usa puppeteer-core + el Chrome del sistema: el
// navegador del preview se atora con las animaciones (rAF), este no.
//
// Uso: node scripts/shot-portadas.mjs   (con el dev server en :3000)
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.env.TEMP + "/fp-portadas";
const KINDS = [
  "escher",
  "turrell",
  "flavin",
  "collage",
  "riley",
  "eliasson",
  "saraceno",
];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-prefers-reduced-motion=false"],
});

for (const theme of ["light", "dark"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem("fp-theme", t);
    localStorage.setItem("fp-lang", "es");
  }, theme);

  // Página mínima que monta las 7 portadas con seeds distintos.
  await page.goto("http://localhost:3000/styleguide", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Encuentra los SVG de portada (aspect 16/9) y captura la rejilla completa.
  const shot = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll("svg")].filter((s) => {
      const b = s.getBoundingClientRect();
      return b.width > 150 && Math.abs(b.width / b.height - 16 / 9) < 0.2;
    });
    if (!svgs.length) return null;
    const first = svgs[0].getBoundingClientRect();
    const last = svgs[svgs.length - 1].getBoundingClientRect();
    return {
      n: svgs.length,
      x: Math.max(0, first.left - 20),
      y: Math.max(0, first.top + window.scrollY - 20),
      w: Math.min(1280, 1240),
      h: Math.min(4000, last.bottom + window.scrollY - first.top - window.scrollY + 40),
    };
  });

  if (!shot) {
    console.log(`${theme}: no encontré portadas`);
    continue;
  }
  console.log(`${theme}: ${shot.n} portadas en pantalla`);
  await page.screenshot({
    path: `${OUT}/portadas-${theme}.png`,
    fullPage: true,
  });
}

await browser.close();
console.log("Listo →", OUT);
