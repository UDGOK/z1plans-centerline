// Circuit-board section: a top-down board drawn in 2D. World units are pixels at zoom 1 (1920 x 1080).
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function monotone(keys) { // piecewise smooth interpolation through keys [[x, y], ...]
  const xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  return (x) => { if (x <= xs[0]) return ys[0]; const n = xs.length; if (x >= xs[n - 1]) return ys[n - 1]; let i = 0; while (x > xs[i + 1]) i++; const k = (x - xs[i]) / (xs[i + 1] - xs[i]); const e = k * k * (3 - 2 * k); return ys[i] + (ys[i + 1] - ys[i]) * e; };
}

const C = { lam: '#05190F', pour: '#1C6A44', rim: '#4AA977', fill: '#2C8A5C', gold: '#D9B25B', goldHi: '#F0D48A', silk: '#F2EEE1', amber: 'rgb(255,190,84)', core: '#FFF4DC' };
const GLY = {
  A: [[[0,6],[0,2],[2,0],[4,2],[4,6]],[[0,4],[4,4]]], B: [[[0,0],[0,6],[3,6],[4,5],[4,4],[3,3],[0,3]],[[3,3],[4,2],[4,1],[3,0],[0,0]]],
  C: [[[4,1],[3,0],[1,0],[0,1],[0,5],[1,6],[3,6],[4,5]]], D: [[[0,0],[0,6],[3,6],[4,5],[4,1],[3,0],[0,0]]],
  E: [[[4,0],[0,0],[0,6],[4,6]],[[0,3],[3,3]]], I: [[[2,0],[2,6]],[[1,0],[3,0]],[[1,6],[3,6]]], J: [[[4,0],[4,5],[3,6],[1,6],[0,5]]],
  L: [[[0,0],[0,6],[4,6]]], M: [[[0,6],[0,0],[2,2],[4,0],[4,6]]], N: [[[0,6],[0,0]],[[0,1],[4,5]],[[4,0],[4,6]]],
  O: [[[1,0],[3,0],[4,1],[4,5],[3,6],[1,6],[0,5],[0,1],[1,0]]], P: [[[0,6],[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]]],
  R: [[[0,6],[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]],[[2,3],[4,5],[4,6]]], S: [[[4,1],[3,0],[1,0],[0,1],[0,2],[1,3],[3,3],[4,4],[4,5],[3,6],[1,6],[0,5]]],
  T: [[[0,0],[4,0]],[[2,0],[2,6]]], U: [[[0,0],[0,5],[1,6],[3,6],[4,5],[4,0]]], V: [[[0,0],[0,1],[2,6],[4,1],[4,0]]],
  W: [[[0,0],[0,6],[2,4],[4,6],[4,0]]], Y: [[[0,0],[0,1],[2,3],[4,1],[4,0]],[[2,3],[2,6]]], Z: [[[0,0],[4,0],[4,1],[0,5],[0,6],[4,6]]],
  '1': [[[1,1],[2,0],[2,6]],[[1,6],[3,6]]], ' ': [], '-': [[[1,3],[3,3]]],
};
const plen = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); return L; };
function partial(ctx, p, L) { // draw the first L units of polyline p
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length && L > 0; i++) { const d = Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); const k = Math.min(1, L / d); ctx.lineTo(lerp(p[i-1][0], p[i][0], k), lerp(p[i-1][1], p[i][1], k)); L -= d; }
  ctx.stroke();
}
function pointAt(p, L) { for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); if (L <= d) { const k = L / d; return [lerp(p[i-1][0], p[i][0], k), lerp(p[i-1][1], p[i][1], k)]; } L -= d; } return p[p.length - 1]; }
// silkscreen text, plotted stroke by stroke. u = glyph unit in px, a: 'l' | 'c'
function silk(ctx, str, x, y, u, prog, a = 'l', lw = null) {
  const adv = 5.6 * u, w = str.length * adv - 1.6 * u; if (a === 'c') x -= w / 2;
  let total = 0; const strokes = [];
  [...str].forEach((ch, i) => (GLY[ch] || []).forEach(s => { const q = s.map(([gx, gy]) => [x + i * adv + gx * u, y + gy * u]); strokes.push(q); total += plen(q); }));
  let L = prog * total; ctx.strokeStyle = C.silk; ctx.lineWidth = lw || u * 0.62; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const q of strokes) { if (L <= 0) break; partial(ctx, q, L); L -= plen(q); }
  return { x0: x, y0: y, x1: x + w, y1: y + 6 * u };
}
const HUB = [960, 600];
const TR = { // traces, hub outwards
  in:  [[80, 600], [885, 600]],
  bat: [[885, 560], [700, 560], [470, 330], [330, 330]],
  bms: [[885, 640], [720, 640], [530, 830], [330, 830]],
  inv: [[1035, 560], [1220, 560], [1450, 330], [1590, 330]],
  ess: [[1035, 640], [1200, 640], [1390, 830], [1590, 830]],
  bess: [[960, 675], [960, 900]],
};
const PADS = [
  { k: 'bat', name: 'BATTERY LAB', lx: 330, ly: 222, a: 'c', t0: 25.8, t1: 27.6 },
  { k: 'inv', name: 'INVERTER LAB', lx: 1590, ly: 222, a: 'c', t0: 29.2, t1: 30.3 },
  { k: 'bms', name: 'BMS LAB', lx: 330, ly: 892, a: 'c', t0: 29.8, t1: 30.9 },
  { k: 'ess', name: 'ESS LAB', lx: 1590, ly: 892, a: 'c', t0: 30.4, t1: 31.5 },
  { k: 'bess', name: 'BESS LAB', lx: 1030, ly: 880, a: 'l', t0: 31.0, t1: 31.8 },
];
const T_IN = [24.3, 25.6], T_TITLE = [32.4, 34.6];
// static board, drawn once at 2x (3840 x 2160), reused at every zoom up to about 2x; redrawn sharp in macro via vector pass
let base = null, mott = null;
function buildBase() {
  const S = 2, cv = document.createElement('canvas'); cv.width = 1920 * S; cv.height = 1080 * S; const c = cv.getContext('2d'); c.scale(S, S);
  const R = mulberry(7);
  c.fillStyle = C.lam; c.fillRect(0, 0, 1920, 1080);
  // pour with a bevelled rim
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  c.fillStyle = C.rim; rr(36, 36, 1848, 1008, 26); c.fill(); c.fillStyle = C.pour; rr(39, 39, 1842, 1002, 24); c.fill();
  // solder-mask mottling
  for (let i = 0; i < 2600; i++) { const x = 40 + R() * 1840, y = 40 + R() * 1000, r = 6 + R() * 26; c.fillStyle = R() < .5 ? 'rgba(255,255,255,.012)' : 'rgba(0,0,0,.022)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  // glass weave, faint
  c.strokeStyle = 'rgba(0,0,0,.05)'; c.lineWidth = .6; for (let x = 40; x < 1880; x += 7) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x, 1040); c.stroke(); } for (let y = 40; y < 1040; y += 7) { c.beginPath(); c.moveTo(40, y); c.lineTo(1880, y); c.stroke(); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  const poly = (p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.stroke(); };
  const W = { in: 16, bat: 11, bms: 11, inv: 11, ess: 11, bess: 11 };
  for (const k in TR) { c.strokeStyle = C.lam; c.lineWidth = W[k] + 13; poly(TR[k]); }
  for (const k in TR) { c.strokeStyle = C.rim; c.lineWidth = W[k]; poly(TR[k]); c.strokeStyle = C.fill; c.lineWidth = W[k] - 3.4; poly(TR[k]); }
  const pad = (x, y, r) => { c.fillStyle = C.lam; c.beginPath(); c.arc(x, y, r + 9, 0, 7); c.fill(); const g = c.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, C.goldHi); g.addColorStop(.34, C.gold); g.addColorStop(1, '#B58F3F'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#04120b'; c.beginPath(); c.arc(x, y, r * .36, 0, 7); c.fill(); };
  const via = (x, y, r = 4.2) => { c.fillStyle = C.lam; c.beginPath(); c.arc(x, y, r + 2.6, 0, 7); c.fill(); c.fillStyle = C.gold; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#04120b'; c.beginPath(); c.arc(x, y, r * .45, 0, 7); c.fill(); };
  // stitching vias along the board edge (a via fence), mounting holes, fiducials
  for (let x = 110; x <= 1810; x += 50) { via(x, 62); via(x, 1018); } for (let y = 112; y <= 968; y += 50) { via(62, y); via(1858, y); }
  for (const [x, y] of [[92, 92], [1828, 92], [92, 988], [1828, 988]]) { pad(x, y, 20); }
  for (const [x, y] of [[170, 92], [1750, 988], [170, 988]]) { c.fillStyle = C.lam; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.fillStyle = C.gold; c.beginPath(); c.arc(x, y, 5.5, 0, 7); c.fill(); }
  for (const p of PADS) { const e = TR[p.k][TR[p.k].length - 1]; pad(e[0], e[1], 26); }
  // J1 edge connector: a row of gold fingers; the wide trace leaves the middle one
  for (let i = -2; i <= 2; i++) { c.fillStyle = C.lam; c.fillRect(56, 600 + i * 26 - 10, 54, 20); const g = c.createLinearGradient(0, 600 + i * 26 - 8, 0, 600 + i * 26 + 8); g.addColorStop(0, C.goldHi); g.addColorStop(.4, C.gold); g.addColorStop(1, '#B58F3F'); c.fillStyle = g; c.fillRect(58, 600 + i * 26 - 8, 50, 16); }
  // hub IC: pins on four sides, plain package top
  const [hx, hy] = HUB, hs = 75;
  for (let i = -3; i <= 3; i++) for (const [dx, dy, w, h] of [[-hs - 16, i * 20 - 5, 22, 10], [hs - 6, i * 20 - 5, 22, 10], [i * 20 - 5, -hs - 16, 10, 22], [i * 20 - 5, hs - 6, 10, 22]]) { c.fillStyle = C.lam; c.fillRect(hx + dx - 2.5, hy + dy - 2.5, w + 5, h + 5); c.fillStyle = C.gold; c.fillRect(hx + dx, hy + dy, w, h); }
  const g = c.createLinearGradient(hx - hs, hy - hs, hx + hs, hy + hs); g.addColorStop(0, '#1b1f1d'); g.addColorStop(1, '#0b0e0c'); c.fillStyle = g; rr(hx - hs, hy - hs, hs * 2, hs * 2, 6); c.fill();
  c.fillStyle = '#2a302d'; c.beginPath(); c.arc(hx - hs + 16, hy - hs + 16, 5, 0, 7); c.fill();
  c.strokeStyle = C.silk; c.lineWidth = 2; rr(hx - hs - 22, hy - hs - 22, hs * 2 + 44, hs * 2 + 44, 4); c.stroke();
  // board-native micro text
  silk(c, 'U1', hx + hs + 34, hy - hs - 18, 2.6, 1); silk(c, 'J1', 60, 520, 2.6, 1); silk(c, 'Z1P-LABS  REV A', 230, 980, 2.2, 1);
  base = cv;
}
// camera keys: t, cx, cy, zoom
const KEYS = [[23.2, 960, 600, 5.0], [25.0, 960, 600, 3.0], [25.8, 900, 580, 2.6]];
const CAMX = monotone(KEYS.map(k => [k[0], k[1]])), CAMY = monotone(KEYS.map(k => [k[0], k[2]])), CAMZ = monotone(KEYS.map(k => [k[0], k[3]]));
const BATL = plen(TR.bat);
function camAt(t) {
  if (t < 25.8) return [CAMX(t), CAMY(t), CAMZ(t)];
  if (t < 27.6) { const [x, y] = pointAt(TR.bat, eio(seg(t, 25.8, 27.6)) * BATL); const k = seg(t, 25.8, 26.3); return [lerp(900, x + 40, eio(k)), lerp(580, y - 10, eio(k)), lerp(2.6, 2.1, seg(t, 25.8, 27.6))]; }
  const k = eio(seg(t, 28.9, 31.8)); return [lerp(370, 960, k), lerp(320, 540, k), lerp(2.1, 1.0, k)];
}
function glowLine(ctx, p, L, w, a) { // lit copper: wide soft amber + near-white core
  if (L <= 0 || a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = a * .55; ctx.strokeStyle = C.amber; ctx.shadowColor = C.amber; ctx.shadowBlur = 26; ctx.lineWidth = w + 8; partial(ctx, p, L);
  ctx.shadowBlur = 6; ctx.globalAlpha = a * .9; ctx.lineWidth = w; partial(ctx, p, L);
  ctx.shadowBlur = 0; ctx.globalAlpha = a; ctx.strokeStyle = C.core; ctx.lineWidth = Math.max(1.6, w * .32); partial(ctx, p, L); ctx.restore();
}
function head(ctx, x, y, r, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,246,224,1)'); g.addColorStop(.25, 'rgba(255,200,100,.8)'); g.addColorStop(1, 'rgba(255,190,84,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); }
let TEX = [];
export const LABS = PADS.map(p => ({ k: p.k, name: p.name, x: TR[p.k][TR[p.k].length - 1][0], y: TR[p.k][TR[p.k].length - 1][1], lx: p.lx, ly: p.ly, a: p.a }));
export const SETTLED = 35.0;
export function drawBoard(ctx, t, W, H, hot) {
  if (!base) buildBase(); TEX = [];
  const [cx, cy, z] = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.lam; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(base, 0, 0, 1920, 1080);
  // energised copper
  const kin = eio(seg(t, T_IN[0], T_IN[1])); const Lin = plen(TR.in);
  glowLine(ctx, TR.in, kin * Lin, 9, .85 + .1 * Math.sin(t * 5));
  if (kin > 0 && kin < 1) { const [x, y] = pointAt(TR.in, kin * Lin); head(ctx, x, y, 46, 1); }
  // hub conducts: its outline glows while current passes
  const hub = seg(t, T_IN[1] - .1, T_IN[1] + .5);
  if (hub > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = hub * (.55 + .12 * Math.sin(t * 3)); ctx.strokeStyle = C.amber; ctx.shadowColor = C.amber; ctx.shadowBlur = 22; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(HUB[0] - 75, HUB[1] - 75, 150, 150, 6); ctx.stroke(); ctx.restore(); }
  for (const p of PADS) {
    const k = eio(seg(t, p.t0, p.t1)), L = plen(TR[p.k]), e = TR[p.k][TR[p.k].length - 1];
    glowLine(ctx, TR[p.k], k * L, 6, .8 + .12 * Math.sin(t * 4 + p.t0));
    if (k > 0 && k < 1) { const [x, y] = pointAt(TR[p.k], k * L); head(ctx, x, y, 40, 1); }
    const arr = t - p.t1; if (arr > 0) { const fl = Math.exp(-arr * 3.2); head(ctx, e[0], e[1], 60 + 130 * fl, .5 + .5 * fl); }
    // silkscreen label plots on arrival and stays
    const pr = seg(t, p.t1 + .05, p.t1 + 1.0); if (pr > 0) { const b = silk(ctx, p.name, p.lx, p.ly, 5.2, pr, p.a); TEX.push({ id: p.k, text: p.name, wb: b }); }
  }
  if (hot) { const e = TR[hot][TR[hot].length - 1]; head(ctx, e[0], e[1], 120, .9); glowLine(ctx, TR[hot], plen(TR[hot]), 9, 1); const k = (t * .8) % 1; const q = pointAt(TR[hot], k * plen(TR[hot])); head(ctx, q[0], q[1], 44, 1); }
  const tp = seg(t, T_TITLE[0], T_TITLE[1]); if (tp > 0) { const b = silk(ctx, 'Z1 POWER LABS', 960, 118, 12.5, tp, 'c', 6.6); TEX.push({ id: 'title', text: 'Z1 POWER LABS', wb: b }); }
  // screen space: warm key from the upper left, vignette
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const kx = 380 + 60 * Math.sin(t * .23), ky = 180 + 40 * Math.cos(t * .19); const g = ctx.createRadialGradient(kx, ky, 0, kx, ky, 1300); g.addColorStop(0, 'rgba(255,236,200,.13)'); g.addColorStop(1, 'rgba(255,236,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // screen boxes of plotted text, for the reading check
  return TEX.map(o => ({ id: 'b_' + o.id, text: o.text, x0: (o.wb.x0 - cx) * z + W / 2, y0: (o.wb.y0 - cy) * z + H / 2, x1: (o.wb.x1 - cx) * z + W / 2, y1: (o.wb.y1 - cy) * z + H / 2 }));
}
