/* Lager appikonene i icons/ fra én felles tegning: node tools/lag-ikoner.mjs
   Hvit hake over to linjer (sjekkliste) på appens teal. SVG og PNG tegnes fra de samme målene.
   PNG-ene rastreres her i ren Node (innebygd zlib), med 4×4 supersampling for glatte kanter. */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";

const BG = "#0f6e7a", FG = "#ffffff", FG2 = "#9fd3d9";
const W = 40; // strektykkelse i en 512-rute
const CHECK = [[150, 190], [210, 250], [340, 120]];
const LINES = [[[150, 330], [362, 330]], [[150, 400], [300, 400]]];
const RADIUS = 112; // hjørneradius for vanlig ikon. Maskerbart ikon og Apple-ikon er helfylte.

const out = new URL("../icons/", import.meta.url);
mkdirSync(out, { recursive: true });

/* ---------- SVG ---------- */
const pts = p => p.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
writeFileSync(new URL("icon.svg", out), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${RADIUS}" fill="${BG}"/>
  <path d="${pts(CHECK)}" fill="none" stroke="${FG}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${LINES.map(pts).join(" ")}" fill="none" stroke="${FG2}" stroke-width="${W}" stroke-linecap="round"/>
</svg>
`);

/* ---------- PNG ---------- */
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const segs = [...CHECK.slice(1).map((p, i) => [CHECK[i], p, FG]), ...LINES.map(([a, b]) => [a, b, FG2])];

function distSeg(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function inRoundRect(x, y, r) {
  if (r === 0) return true;
  const cx = Math.max(r, Math.min(512 - r, x)), cy = Math.max(r, Math.min(512 - r, y));
  return Math.hypot(x - cx, y - cy) <= r;
}
/* Farge og dekning for ett punkt i 512-ruten */
function sample(x, y, r) {
  if (!inRoundRect(x, y, r)) return null;
  for (const [a, b, c] of segs) if (distSeg(x, y, a, b) <= W / 2) return c;
  return BG;
}

function png(size, r) {
  const k = 512 / size, N = 4, raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) {
        const c = sample((x + (sx + 0.5) / N) * k, (y + (sy + 0.5) / N) * k, r);
        if (!c) continue;
        const [cr, cg, cb] = rgb(c); R += cr; G += cg; B += cb; A++;
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      if (A) { raw[o] = Math.round(R / A); raw[o + 1] = Math.round(G / A); raw[o + 2] = Math.round(B / A); }
      raw[o + 3] = Math.round(255 * A / (N * N));
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; // 8 bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const files = [["icon-192.png", 192, RADIUS], ["icon-512.png", 512, RADIUS], ["icon-maskable-512.png", 512, 0], ["apple-touch-icon.png", 180, 0]];
for (const [name, size, r] of files) writeFileSync(new URL(name, out), png(size, r));
console.log("Laget icons/icon.svg og " + files.map(f => f[0]).join(", "));
