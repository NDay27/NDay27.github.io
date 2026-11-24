// The shop's own name on the garage sign in the shared garage pictures (auto, body, glass and truck shops).
// Those pictures were rendered once per trade with a stock sign ("Auto Repair", "Auto Body", ...). Here the stock
// lettering is painted out and the shop's name is drawn back in perspective, the way the live 3D scene writes it,
// so every shop's site shows its own name. Sign corners (top-left, top-right, bottom-right, bottom-left, as
// fractions of the picture) come from projecting the sign through each render's camera (renders.json + garage.js).
const Q = {
  "auto-before": [[0.45151,0.35428],[0.70979,0.36912],[0.70973,0.41667],[0.4517,0.41041]],
  "auto-after": [[0.45151,0.35428],[0.70979,0.36912],[0.70973,0.41667],[0.4517,0.41041]],
  "auto-hero": [[0.45151,0.35428],[0.70979,0.36912],[0.70973,0.41667],[0.4517,0.41041]],
  "auto-hood": [[-0.34918,-0.08341],[0.28699,0.06943],[0.28784,0.1515],[-0.34395,0.0442]],
  "auto-front": [[0.0579,0.21059],[0.48543,0.32172],[0.48538,0.38067],[0.05599,0.29481]],
  "auto-dusk": [[0.23407,0.30705],[0.55979,0.35409],[0.55986,0.40647],[0.23372,0.37212]],
  "auto-s1": [[0.41152,0.06903],[1.0542,0.15817],[1.05331,0.25569],[0.41171,0.19468]],
  "auto-s2": [[0.41152,0.06903],[1.0542,0.15817],[1.05331,0.25569],[0.41171,0.19468]],
  "auto-s3": [[0.41152,0.06903],[1.0542,0.15817],[1.05331,0.25569],[0.41171,0.19468]],
  "auto-s4": [[0.13602,0.19965],[0.54514,0.24758],[0.54507,0.30637],[0.13676,0.27356]],
  "body-before": [[-0.07162,-0.09492],[0.45593,0.06896],[0.45654,0.14525],[-0.06785,0.02294]],
  "body-after": [[-0.07162,-0.09492],[0.45593,0.06896],[0.45654,0.14525],[-0.06785,0.02294]],
  "body-dusk": [[0.23407,0.30705],[0.55979,0.35409],[0.55986,0.40647],[0.23372,0.37212]],
  "semi-before": [[0.42656,0.2812],[0.68712,0.30874],[0.68706,0.35122],[0.42681,0.33252]],
  "semi-after": [[0.42656,0.2812],[0.68712,0.30874],[0.68706,0.35122],[0.42681,0.33252]],
  "semi-s1": [[0.32354,-0.31087],[0.65881,0.04616],[0.65798,0.11989],[0.32549,-0.15066]],
  "semi-s2": [[0.32354,-0.31087],[0.65881,0.04616],[0.65798,0.11989],[0.32549,-0.15066]],
  "semi-s4": [[0.25888,0.2812],[0.5677,0.30874],[0.56763,0.35122],[0.25918,0.33252]],
  "semi-dusk": [[0.17906,0.27741],[0.4639,0.32007],[0.4639,0.35921],[0.17906,0.32582]],
  "semi-side": [[0.33457,-0.31087],[0.64888,0.04616],[0.64811,0.11989],[0.3364,-0.15066]],
  "semi-front": [[0.17906,0.27741],[0.4639,0.32007],[0.4639,0.35921],[0.17906,0.32582]],
  "glass-before": [[-0.09391,-0.15858],[0.50133,-0.00462],[0.502,0.08185],[-0.08826,-0.02885]],
  "glass-after": [[-0.09391,-0.15858],[0.50133,-0.00462],[0.502,0.08185],[-0.08826,-0.02885]],
  "glass-s4": [[-0.35797,-0.15858],[0.3475,-0.00462],[0.3483,0.08185],[-0.35127,-0.02885]],
  "glass-dusk": [[0.23407,0.30705],[0.55979,0.35409],[0.55986,0.40647],[0.23372,0.37212]],
  "glass-clear": [[-0.30434,-0.15858],[0.35703,-0.00462],[0.35778,0.08185],[-0.29806,-0.02885]]
};
const RX = /\/f\/img\/(?:auto|body|glass|semi)\/((?:auto|body|glass|semi)-[a-z0-9]+)-\d+\.webp/;

// projective map of the unit square onto a quad (Heckbert), and its inverse
function square2quad(p) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}
function inv3(m) {
  const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C;
  return [A / det, (c * h - b * i) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, (c * d - a * f) / det, C / det, (b * g - a * h) / det, (a * e - b * d) / det];
}

function lettering(text, font) {
  // same layout as the 3D sign texture (harlow world.js signTexture: 2048x256, 800 weight, fit to 90% width)
  const w = 2048, h = 256, c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"), t = text.toUpperCase(); let s = h * .5;
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
  do { x.font = `800 ${s}px ${font}, sans-serif`; s -= 3; } while (x.measureText(t).width > w * .9 && s > 20);
  x.fillText(t, w / 2, h * .52);
  const d = x.getImageData(0, 0, w, h).data, a = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) a[k] = d[k * 4 + 3] / 255;
  return {w, h, a};
}

const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

function paint(img, quad, L) {
  const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
  const P = quad.map(([u, v]) => [u * W, v * H]), M = inv3(square2quad(P));
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const bx = Math.max(0, Math.floor(Math.min(...xs)) - 2), by = Math.max(0, Math.floor(Math.min(...ys)) - 2);
  const bw = Math.min(W, Math.ceil(Math.max(...xs)) + 2) - bx, bh = Math.min(H, Math.ceil(Math.max(...ys)) + 2) - by;
  if (bw < 8 || bh < 4) return null;
  const im = ctx.getImageData(bx, by, bw, bh), d = im.data, N = bw * bh, U = new Float32Array(N), V = new Float32Array(N);
  for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
    const X = bx + i + .5, Y = by + j + .5, z = M[6] * X + M[7] * Y + M[8], k = j * bw + i;
    U[k] = (M[0] * X + M[1] * Y + M[2]) / z; V[k] = (M[3] * X + M[4] * Y + M[5]) / z;
  }
  // the sign's own background, column by column, from the bands above and below the lettering
  const NB = 160, top = new Float32Array(NB * 4), bot = new Float32Array(NB * 4);
  for (let k = 0; k < N; k++) {
    const u = U[k], v = V[k]; if (u < 0 || u > 1) continue;
    const band = v > .08 && v < .26 ? top : v > .78 && v < .93 ? bot : null; if (!band) continue;
    const b = Math.min(NB - 1, u * NB | 0) * 4; band[b] += d[k * 4]; band[b + 1] += d[k * 4 + 1]; band[b + 2] += d[k * 4 + 2]; band[b + 3]++;
  }
  const ok = new Uint8Array(NB);
  for (let b = 0; b < NB; b++) {
    const nt = top[b * 4 + 3], nb = bot[b * 4 + 3]; if (nt < 2 && nb < 2) continue; ok[b] = 1;
    for (let ch = 0; ch < 3; ch++) { top[b * 4 + ch] = nt < 2 ? bot[b * 4 + ch] / nb : top[b * 4 + ch] / nt; bot[b * 4 + ch] = nb < 2 ? top[b * 4 + ch] : bot[b * 4 + ch] / nb; }
  }
  const bg = (u, v, ch) => { const b = Math.min(NB - 1, u * NB | 0) * 4, t = Math.min(1, Math.max(0, (v - .17) / (.855 - .17))); return top[b + ch] + (bot[b + ch] - top[b + ch]) * t; };
  // the lettering's lit colour, from the stock lettering in this very picture
  let fr = 0, fg = 0, fb = 0, fn = 0, best = 0; const ex = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const u = U[k], v = V[k]; if (u < .03 || u > .97 || v < .33 || v > .71 || !ok[Math.min(NB - 1, u * NB | 0)]) continue;
    const e = (d[k * 4] + d[k * 4 + 1] + d[k * 4 + 2] - bg(u, v, 0) - bg(u, v, 1) - bg(u, v, 2)) / 3; ex[k] = e; if (e > best) best = e;
  }
  if (best < 40) return null;
  for (let k = 0; k < N; k++) if (ex[k] > best * .6) { fr += d[k * 4]; fg += d[k * 4 + 1]; fb += d[k * 4 + 2]; fn++; }
  const F = [fr / fn, fg / fn, fb / fn];
  // paint out the stock lettering and draw the shop's name (2x2 samples per pixel against the 2048-wide lettering)
  const al = (u, v) => {
    const x = u * L.w - .5, y = v * L.h - .5, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
    const at = (a, b) => a < 0 || b < 0 || a >= L.w || b >= L.h ? 0 : L.a[b * L.w + a];
    return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
  };
  for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
    const k = j * bw + i, u = U[k], v = V[k];
    if (u < .02 || u > .98 || v < .27 || v > .77 || !ok[Math.min(NB - 1, u * NB | 0)]) continue;
    const w = sstep(.02, .04, u) * sstep(.98, .96, u) * sstep(.27, .31, v) * sstep(.77, .73, v);
    let a = 0;
    for (const [sx, sy] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {
      const X = bx + i + sx, Y = by + j + sy, z = M[6] * X + M[7] * Y + M[8];
      a += al((M[0] * X + M[1] * Y + M[2]) / z, (M[3] * X + M[4] * Y + M[5]) / z);
    }
    a /= 4;
    for (let ch = 0; ch < 3; ch++) { const n = bg(u, v, ch) * (1 - a) + F[ch] * a; d[k * 4 + ch] = d[k * 4 + ch] * (1 - w) + n * w; }
  }
  ctx.putImageData(im, bx, by);
  return c;
}

export async function run(imgs, name, font) {
  try { await Promise.race([document.fonts.load(`800 120px ${font}`, name.toUpperCase()), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fallback font */ }
  const L = lettering(name, font), queue = [];
  let busy = false;
  const next = () => {
    if (busy || !queue.length) return; busy = true;
    const img = queue.shift(), m = RX.exec(img.currentSrc || img.src), quad = m && Q[m[1]];
    let c = null; try { if (quad) c = paint(img, quad, L); } catch (e) { c = null; }
    const done = () => { busy = false; (window.requestIdleCallback || setTimeout)(next); };
    if (!c) return done();
    c.toBlob(b => {
      if (b) { img.removeAttribute("srcset"); img.removeAttribute("sizes"); img.src = URL.createObjectURL(b); }
      done();
    }, "image/jpeg", .92);
  };
  imgs.forEach(img => {
    img.dataset.sign = "1";
    const go = () => { queue.push(img); next(); };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, {once: true});
  });
}
