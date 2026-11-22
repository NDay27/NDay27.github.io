// Flagship storefront kit: a main-street shop on a small-town block, all procedural.
// makeStore(world, {kind}) builds a two-storey brick storefront with a sign band, a retractable striped awning,
// a recessed glass door with an open/closed sign, a neon OPEN in the window and an interior dressed for the trade
// (bakery case, salon chairs, nail bar, tables, racks, grooming table, sewing room). One model drives the
// Immersive scroll story and every rendered picture on the Starter and Signature tiers.
import {THREE, TEX, leafCard, signTexture, mix, clamp} from "../../harlow/assets/world.js";

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const AWN = {red: 0xb3343a, green: 0x2f6b4f, navy: 0x24365e, black: 0x1d1f22, pink: 0xd9879a, teal: 0x2f7f86, gold: 0xc9952f, plum: 0x6b3a5e};

// per trade: storefront paint, awning, interior wall, floor, sign colors, blade-sign icon, chalkboard line
export const KIND = {
  bakery: {trim: 0xead6b8, awn: AWN.pink, wall: 0xf3dcc0, wain: 0x7a4a3a, floor: "check", sign: ["#3b2a22", "#f4e9da"], icon: "cupcake"},
  salon:  {trim: 0x1f2124, awn: AWN.black, wall: 0xefe5d6, wain: 0xb8a28a, floor: "wood", sign: ["#f2ede4", "#1f2124"], icon: "scissors"},
  barber: {trim: 0x14213d, awn: AWN.red, wall: 0xe8e4dc, floor: "check", sign: ["#14213d", "#f1efe8"], icon: "razor", pole: true},
  nails:  {trim: 0xf0e3e0, awn: AWN.pink, wall: 0xf8e9df, wain: 0xc98d99, floor: "wood", sign: ["#f7efea", "#7a3b4f"], icon: "polish"},
  eat:    {trim: 0x23412f, awn: AWN.green, wall: 0xe8dfcf, floor: "check", sign: ["#23412f", "#f3ead7"], icon: "plate"},
  shop:   {trim: 0x24365e, awn: AWN.navy, wall: 0xf0e9dd, floor: "wood", sign: ["#24365e", "#f4f0e6"], icon: "bag"},
  groom:  {trim: 0x2f7f86, awn: AWN.teal, wall: 0xeef0e8, floor: "tile", sign: ["#f2f5f4", "#235f65"], icon: "paw"},
  scoop:  {trim: 0xf4efe4, awn: AWN.teal, wall: 0xfbefe6, wain: 0x7fc4b4, floor: "check", sign: ["#f6efe4", "#2f7f86"], icon: "cone"},
  tattoo: {trim: 0x161618, awn: AWN.black, wall: 0x4a4a50, wain: 0x1b1b1e, floor: "check", sign: ["#161618", "#f1e6d0"], icon: "machine"},
  antique: {trim: 0x3b2a1e, awn: AWN.gold, wall: 0xeadcc6, wain: 0x5a3e2b, floor: "wood", sign: ["#2a1f18", "#f1e6d0"], icon: "clock"},
  dojo:   {trim: 0x1f2a44, awn: AWN.red, wall: 0xf1ede4, wain: 0x1f2a44, floor: "wood", sign: ["#1f2a44", "#f4efe4"], icon: "belt"},
  jewel:  {trim: 0x1d2a44, awn: AWN.navy, wall: 0xf3efe8, wain: 0x2b3550, floor: "wood", sign: ["#1d2a44", "#ecd9a8"], icon: "ring"},
  appst:  {trim: 0x2b3a4a, awn: AWN.navy, wall: 0xf2f2ef, floor: "tile", sign: ["#2b3a4a", "#f3f3f0"], icon: "fridge"},
  massage: {trim: 0x4a5a48, awn: AWN.green, wall: 0xefe6da, wain: 0x7d8a73, floor: "wood", sign: ["#3e4b3c", "#f1ead9"], icon: "lotus"},
  cafe:   {trim: 0x3b2a22, awn: AWN.green, wall: 0xf0e6d6, wain: 0x6b4a32, floor: "check", sign: ["#2f2420", "#f2e6d0"], icon: "cup"},
  gym:    {trim: 0x1d1f22, awn: AWN.black, wall: 0xe9e9e6, wain: 0x2b2e33, floor: "wood", sign: ["#1d1f22", "#f2f2ee"], icon: "dumbbell"},
  music:  {trim: 0x2a2440, awn: AWN.plum, wall: 0xf1ebe2, wain: 0x4a3f66, floor: "wood", sign: ["#2a2440", "#f2ead8"], icon: "note"},
  photo:  {trim: 0x1d1f22, awn: AWN.black, wall: 0xf3f1ec, wain: 0x3a3c40, floor: "wood", sign: ["#f3f1ec", "#1d1f22"], icon: "camera"},
  sew:    {trim: 0x5a3550, awn: AWN.plum, wall: 0xefe7df, floor: "wood", sign: ["#5a3550", "#f6eee6"], icon: "needle"},
};
KIND.tailor = KIND.sew; KIND.uphol = KIND.sew;

// blade-sign icons, drawn with Path2D on a 56 box
const ICON = {
  machine: ["M12 44 26 30", "M22 20h18v12H22z", "M26 20v-6h10v6", "M26 32l-4 4", "M40 26h6"],
  clock: ["M28 10a18 18 0 1 0 .1 0", "M28 18v10l7 5", "M22 48h12"],
  cupcake: ["M14 30h28l-4 16H18z", "M12 30c0-8 6-12 10-12 2-6 10-6 12 0 4 0 10 4 10 12", "M28 12v-4"],
  scissors: ["M20 14 36 42", "M36 14 20 42", "M16 44a5 5 0 1 0 0 .1", "M40 44a5 5 0 1 0 0 .1"],
  razor: ["M12 36 36 12l6 6-24 24z", "M36 12l8-4 4 4-4 8", "M18 30l6 6"],
  polish: ["M20 26h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z", "M24 26V10h8v16", "M20 34h16"],
  plate: ["M28 44a14 14 0 1 0 0-28 14 14 0 0 0 0 28z", "M28 36a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M8 14v12a3 3 0 0 0 6 0V14M11 26v18", "M46 14c-4 4-4 12 0 14v16"],
  bag: ["M14 20h28l-2 28H16z", "M22 24v-8a6 6 0 0 1 12 0v8"],
  paw: ["M28 46c-8 0-12-4-10-9s6-7 10-7 8 2 10 7-2 9-10 9z", "M16 28a4 5 0 1 0 0-.1", "M40 28a4 5 0 1 0 0-.1", "M23 20a4 5 0 1 0 0-.1", "M33 20a4 5 0 1 0 0-.1"],
  cone: ["M18 26h20L28 50z", "M18 26a10 10 0 0 1 20 0", "M22 16a7 7 0 0 1 12 0", "M22 32l10 8M34 32l-8 10"],
  belt: ["M8 24h40", "M8 31h40", "M24 22h8v11h-8z", "M26 33l-5 13", "M30 33l5 13"],
  ring: ["M16 36a12 12 0 1 0 24 0a12 12 0 1 0-24 0", "M22 16l6-7 6 7-6 6z"],
  fridge: ["M17 6h22v44H17z", "M17 21h22", "M22 11v5", "M22 26v10"],
  lotus: ["M28 44c-7-6-9-14 0-26 9 12 7 20 0 26z", "M28 44c-10 0-17-6-19-14 8 0 14 4 19 14z", "M28 44c10 0 17-6 19-14-8 0-14 4-19 14z"],
  cup: ["M14 24h24v12a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z", "M38 28h3a5 5 0 0 1 0 10h-4", "M20 18c0-3 3-3 3-6M28 18c0-3 3-3 3-6", "M10 50h34"],
  dumbbell: ["M8 22v12M14 18v20M42 18v20M48 22v12", "M14 28h28"],
  note: ["M22 40V12l20-4v28", "M22 40a5 4 0 1 1-.1 0", "M42 36a5 4 0 1 1-.1 0", "M22 20l20-4"],
  camera: ["M8 18h40v28H8z", "M20 18l4-6h8l4 6", "M28 40a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M40 24h3"],
  needle: ["M14 42 40 16", "M40 16c3-3 6-2 6 1s-3 4-6 1", "M12 30c6-6 12 0 18-4s8-10 14-10"],
};

function iconTex(icon, fg, bg) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.fillStyle = bg; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.strokeStyle = fg; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke();
  g.save(); g.translate(38, 38); g.scale(3.2, 3.2); g.strokeStyle = fg; g.lineWidth = 2.6; g.lineCap = g.lineJoin = "round";
  for (const d of ICON[icon]) g.stroke(new Path2D(d)); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function canvasTex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t;
}
const hex = n => "#" + n.toString(16).padStart(6, "0");

// awning canvas: stripes across the width, cream between; the valance gets a scalloped hem
function stripes(g, w, h, col, n, hem) {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? "#efe8da" : col; g.fillRect(i * w / n, 0, w / n + 1, h); }
  const sh = g.createLinearGradient(0, 0, 0, h); sh.addColorStop(0, "rgba(0,0,0,.08)"); sh.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sh; g.fillRect(0, 0, w, h);
  if (hem) { g.globalCompositeOperation = "destination-out"; const k = w / n; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(i * k + k, h, k / 2, h * .3, 0, 0, 7); g.fill(); } g.globalCompositeOperation = "source-over"; }
}

// floors
function floorTex(kind) {
  if (kind === "wood") return null;
  return canvasTex(512, 512, (g, w, h) => {
    const n = kind === "tile" ? 8 : 8, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dark = kind === "check" ? (x + y) % 2 : 0;
      g.fillStyle = dark ? "#2a2c2e" : kind === "tile" ? ((x * 7 + y * 3) % 5 ? "#aeb9b7" : "#a3afad") : "#ece8de"; g.fillRect(x * s, y * s, s, s);
      g.fillStyle = kind === "tile" ? "rgba(40,50,50,.35)" : "rgba(0,0,0,.05)"; g.fillRect(x * s, y * s, s, kind === "tile" ? 4 : 2); g.fillRect(x * s, y * s, kind === "tile" ? 4 : 2, s); }
  }, [1, 1]);
}

// the entry mosaic: small hex tiles with a border
function mosaicTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#f0ece2"; g.fillRect(0, 0, w, h); const r = 9;
    for (let y = 0, j = 0; y < h + r; y += r * 1.5, j++) for (let x = (j % 2) * r * .866; x < w + r; x += r * 1.732) {
      const edge = x < 46 || x > w - 46 || y < 46 || y > h - 46, ring = x < 62 || x > w - 62 || y < 62 || y > h - 62;
      g.fillStyle = edge ? "#2f3a34" : ring ? "#a8442f" : ((x * 7 + y * 3) % 11 < 1 ? "#d9d2c2" : "#f3efe6");
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1)); } g.fill(); }
  });
}

function hangTex(open) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#faf7f0"; g.beginPath(); g.roundRect(6, 10, w - 12, h - 16, 14); g.fill(); g.lineWidth = 5; g.strokeStyle = open ? "#b3241c" : "#2b2d30"; g.stroke();
    g.fillStyle = open ? "#b3241c" : "#2b2d30"; g.font = "800 62px Archivo, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(open ? "OPEN" : "CLOSED", w / 2, h / 2 + 4);
  });
}

function neonTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.font = "700 150px 'Archivo', Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    g.shadowColor = "#ff3b5c"; g.shadowBlur = 34; g.lineWidth = 10; g.strokeStyle = "#ff6f86"; g.strokeText("OPEN", w / 2, h / 2 + 6);
    g.shadowBlur = 10; g.lineWidth = 4; g.strokeStyle = "#ffe3ea"; g.strokeText("OPEN", w / 2, h / 2 + 6);
    g.shadowBlur = 0; g.lineWidth = 6; g.strokeStyle = "#4fc3ff"; g.beginPath(); g.roundRect(24, 22, w - 48, h - 44, 40); g.stroke();
  });
}

function chalkTex(line) {
  return canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = "#2c3a33"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a5a3a"; g.lineWidth = 26; g.strokeRect(0, 0, w, h);
    g.fillStyle = "#f2efe6"; g.textAlign = "center"; g.font = "700 76px 'Archivo', Arial, sans-serif"; g.fillText(line[0], w / 2, 170); g.fillText(line[1], w / 2, 260);
    g.strokeStyle = "#f2efe6"; g.lineWidth = 5; g.beginPath(); g.moveTo(130, 330); g.bezierCurveTo(200, 300, 310, 360, 382, 320); g.stroke();
    g.font = "600 46px 'Archivo', Arial, sans-serif"; g.fillStyle = "#f3c6a8"; g.fillText(line[2] || "", w / 2, 440);
  });
}

// chalk "menu" lines on the back wall: scribbles, no words
function boardTex() {
  return canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = "#23272a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#e9e4d8"; g.lineCap = "round"; let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.lineWidth = 7; g.beginPath(); g.moveTo(150, 52); g.lineTo(362, 52); g.stroke();
    for (let row = 0; row < 7; row++) { const y = 100 + row * 30; g.lineWidth = 3.4; g.beginPath(); let x = 46; g.moveTo(x, y);
      while (x < 300 + r() * 60) { x += 8 + r() * 10; g.lineTo(x, y + (r() - .5) * 6); } g.stroke(); g.beginPath(); g.moveTo(420, y); g.lineTo(462, y); g.stroke(); }
  });
}

export async function makeStore(world, {kind = "bakery", sign = "Bakery", font = "Archivo", awning, word = "", second = true} = {}) {
  const K = KIND[kind] || KIND.bakery, {scene} = world, root = new THREE.Group(); scene.add(root);
  const blk = new THREE.Group(); blk.position.y = .16; root.add(blk);   // the block sits on a curb above the street
  const W = 8, X0 = -W / 2, X1 = W / 2, GH = 4.4, H2 = 8.7, T = .36, D = 10;
  const brickT = TEX.brick([1, 1], [150, 72, 54]);
  const brick = new THREE.MeshStandardMaterial({...brickT, envMapIntensity: .5});
  const trim = new THREE.MeshStandardMaterial({color: K.trim, roughness: .45, envMapIntensity: .7});
  const cope = new THREE.MeshStandardMaterial({color: 0x26292d, metalness: .5, roughness: .5, envMapIntensity: .8});
  const stone = new THREE.MeshStandardMaterial({color: 0xd8d0bf, roughness: .8, envMapIntensity: .5});
  const glass = new THREE.MeshPhysicalMaterial({color: 0xffffff, roughness: .03, metalness: 0, transparent: true, opacity: .1, envMapIntensity: 1.6, depthWrite: false});
  const dark = new THREE.MeshStandardMaterial({color: 0x1b1d20, roughness: .6});
  const steel = new THREE.MeshStandardMaterial({color: 0xb7bcc0, metalness: .9, roughness: .28});
  const brass = new THREE.MeshStandardMaterial({color: 0xc49a4a, metalness: .9, roughness: .35});
  const wallM = new THREE.MeshStandardMaterial({...TEX.plaster([2, 2], [255, 255, 255]), color: K.wall, envMapIntensity: .08});
  const woodM = new THREE.MeshStandardMaterial({color: 0x7a5236, roughness: .5, envMapIntensity: .25});
  const ft = floorTex(K.floor);
  const floorM = ft ? new THREE.MeshStandardMaterial({map: ft, roughness: .35, envMapIntensity: .3}) : new THREE.MeshStandardMaterial({...TEX.wood([3, 5]), roughness: .5, envMapIntensity: .3});
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = blk, layer) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (layer) m.userData.layer = layer; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent, layer) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent, layer);
  const cyl = (r0, r1, h, mat, x, y, z, parent, seg = 18) => add(new THREE.CylinderGeometry(r0, r1, h, seg), mat, x, y, z, parent);
  const wbox = (w, h, d, mat, x, y, z, U, V, layer, parent = blk) => { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); const X = p.getX(i) + x, Y = p.getY(i) + y, Z = p.getZ(i) + z; uv.setXY(i, (ax > .5 ? Z : X) / U, (ay > .5 ? Z : Y) / V); }
    return add(g, mat, x, y, z, parent, layer); };
  const flat = (w, d, mat, x, y, z, parent = blk) => { const m = add(new THREE.PlaneGeometry(w, d), mat, x, y, z, parent); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lights = [], glows = [];   // interior lamps and glowing bits, driven by set({lights})
  const lamp = (x, y, z, p = 1, dist = 9, color = 0xffd3a0) => { const l = new THREE.PointLight(color, 0, dist, 1.6); l.position.set(x, y, z); blk.add(l); lights.push([l, p]); return l; };
  const glow = (color, p = 1, o = {}) => { const m = new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 0, roughness: .3, ...o}); glows.push([m, p]); return m; };

  // ---------- street, sidewalk, curb ----------
  const asph = new THREE.MeshStandardMaterial({...TEX.asphalt([14, 6]), envMapIntensity: .5});
  const st = add(new THREE.PlaneGeometry(160, 64), asph, 0, .012, 36.6, root, "ground"); st.rotation.x = -Math.PI / 2; st.castShadow = false;
  const conc = new THREE.MeshStandardMaterial({...TEX.concrete([1, 1]), envMapIntensity: .5});
  wbox(90, .16, 4.6, conc, 0, -.08, 2.3, 1.5, 1.5, "ground").castShadow = false;
  wbox(90, .18, .22, stone, 0, -.07, 4.7, 4, 4, "ground");
  wbox(90, .16, 4, conc, 0, -.08, 20.4, 1.5, 1.5).castShadow = false; box(90, .18, .22, stone, 0, -.07, 18.3);
  const paint = new THREE.MeshStandardMaterial({color: 0xe9e5d8, roughness: .8}), yel = new THREE.MeshStandardMaterial({color: 0xd9a520, roughness: .7});
  for (const z of [11.35, 11.6]) { const m = add(new THREE.PlaneGeometry(160, .1), yel, 0, .016, z, root); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  for (let i = -6; i <= 6; i++) { const m = add(new THREE.PlaneGeometry(.1, 2.3), paint, i * 6.4 + 3.2, .016, 6.0, root); m.rotation.x = -Math.PI / 2; m.castShadow = false; }

  // ---------- the shop: brick piers, upper floor, cornice ----------
  const bk = (w, h, d, x, y, z, layer = "wall", mat = brick, parent = blk) => wbox(w, h, d, mat, x, y, z, 1.9, 1.3, layer, parent);
  bk(.46, GH, T, X0 + .23, GH / 2, -T / 2); bk(.46, GH, T, X1 - .23, GH / 2, -T / 2);
  const UW = [[-2.45, 1.15], [0, 1.15], [2.45, 1.15]], UY0 = 5.35, UY1 = 7.55;
  bk(W, UY0 - GH, T, 0, (GH + UY0) / 2, -T / 2); bk(W, H2 - UY1, T, 0, (UY1 + H2) / 2, -T / 2);
  { let x = X0; for (const [cx, w] of UW) { bk(cx - w / 2 - x, UY1 - UY0, T, (x + cx - w / 2) / 2, (UY0 + UY1) / 2, -T / 2); x = cx + w / 2; } bk(X1 - x, UY1 - UY0, T, (x + X1) / 2, (UY0 + UY1) / 2, -T / 2); }
  bk(.36, H2, D, X0 + .18, H2 / 2, -D / 2, "wall"); bk(.36, H2, D, X1 - .18, H2 / 2, -D / 2, "wall");
  box(W, .3, D, cope, 0, H2 - .15, -D / 2);
  // corbelled brick band and a sheet-metal cornice on brackets
  bk(W + .1, .14, T + .08, 0, H2 - .6, -T / 2 + .04, "trim"); bk(W + .18, .14, T + .16, 0, H2 - .46, -T / 2 + .08, "trim");
  box(W + .5, .34, .62, cope, 0, H2 + .2, -.06, blk, "roof"); box(W + .62, .08, .7, cope, 0, H2 + .4, -.06, blk, "roof");
  for (let i = 0; i < 7; i++) box(.16, .3, .32, cope, X0 + .3 + i * (W - .6) / 6, H2 - .12, .1, blk, "roof");
  // upper windows: stone sill and lintel, two-over-two sash, a curtain that glows at night
  const pane = new THREE.MeshPhysicalMaterial({color: 0x1d262c, roughness: .06, metalness: .2, envMapIntensity: 1.4, clearcoat: 1});
  UW.forEach(([cx, w], i) => {
    box(w + .3, .12, .2, stone, cx, UY0 - .02, .04, blk, "open"); box(w + .26, .3, .1, stone, cx, UY1 + .15, .02, blk, "open");
    box(w, UY1 - UY0, .05, pane, cx, (UY0 + UY1) / 2, -.2);
    const cur = i === 1 ? world.glowMat(0xffd7a0, .5, {roughness: .9}) : new THREE.MeshStandardMaterial({color: 0xd9cdb8, roughness: .9});
    box(w - .1, (UY1 - UY0) * .55, .02, cur, cx, UY1 - (UY1 - UY0) * .3, -.24);
    for (const y of [UY0 + .04, (UY0 + UY1) / 2, UY1 - .04]) box(w, .07, .08, stone, cx, y, -.15, blk, "open");
    for (const x of [cx - w / 2 + .035, cx, cx + w / 2 - .035]) box(.07, UY1 - UY0, .08, stone, x, (UY0 + UY1) / 2, -.15, blk, "open");
  });

  // ---------- the storefront ----------
  const SX = 3.55, EX = .82, ER = 1.15, BH = .6, WY0 = .62, WY1 = 2.98, TY1 = 3.46, SB0 = 3.5, SB1 = 4.22;
  // bulkheads with raised panels
  for (const s of [-1, 1]) { const cx = s * (SX + EX) / 2, w = SX - EX;
    box(w, BH, .22, trim, cx, BH / 2, -.11, blk, "porch"); for (const k of [-1, 1]) box(w / 2 - .22, BH - .2, .04, trim, cx + k * w / 4, BH / 2, .015, blk, "trim");
    box(w + .04, .07, .3, trim, cx, BH + .02, -.08); }
  // plate glass, posts, head, transom lights
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(SX - EX - .08, WY1 - WY0), glass, s * (SX + EX) / 2, (WY0 + WY1) / 2, -.12, blk, "open").castShadow = false;
  for (const x of [-SX, -EX, EX, SX]) box(.1, TY1, .16, trim, x - Math.sign(x) * .05, TY1 / 2, -.1, blk, "porch");
  box(SX * 2, .1, .2, trim, 0, WY1 + .05, -.1, blk, "trim"); box(SX * 2, .08, .2, trim, 0, TY1, -.1, blk, "trim");
  const transom = glow(0xffe8c4, 1.2, {roughness: .2, transparent: true, opacity: .55});
  add(new THREE.PlaneGeometry(SX * 2 - .1, TY1 - WY1 - .1), transom, 0, (WY1 + TY1) / 2 + .02, -.13).castShadow = false;
  for (let i = 1; i < 12; i++) box(.04, TY1 - WY1 - .08, .1, trim, -SX + i * SX * 2 / 12, (WY1 + TY1) / 2 + .02, -.1);
  // sign band and its frame, then a small cornice under the brick
  box(SX * 2 + .1, SB1 - SB0 + .14, .18, trim, 0, (SB0 + SB1) / 2, -.06, blk, "trim");
  const signT = await signTexture(sign, null, {fg: K.sign[1], bg: K.sign[0], font, w: 2048, h: 256, upper: true});
  const signM = new THREE.MeshStandardMaterial({map: signT, emissiveMap: signT, emissive: 0xffffff, emissiveIntensity: .06, roughness: .5}); world.glow.push([signM, .2]);
  const signMesh = box(SX * 2 - .5, SB1 - SB0 - .1, .04, signM, 0, (SB0 + SB1) / 2, .045, blk, "roof");
  box(SX * 2 + .3, .1, .3, trim, 0, SB1 + .12, -.02, blk, "trim");
  for (const x of [-SX + .3, SX - .3]) { const l = add(new THREE.SphereGeometry(.05, 10, 8), world.glowMat(0xffe7bf, 1.4), x, SB1 + .02, .32); box(.03, .03, .28, cope, x, SB1 + .08, .18); world.lamp(x, SB1 - .2, .9, 0xffd7a3, .45, 6); }

  // recessed entry: side glass, ceiling, mosaic floor, the door
  for (const s of [-1, 1]) { box(.06, BH, ER, trim, s * EX, BH / 2, -ER / 2 - .02, blk, "porch");
    const g = add(new THREE.PlaneGeometry(ER - .1, WY1 - BH), glass, s * EX, (BH + WY1) / 2, -ER / 2 - .02); g.rotation.y = Math.PI / 2; g.castShadow = false; }
  box(EX * 2, .06, ER, trim, 0, WY1 + .02, -ER / 2 - .02);
  const mos = flat(EX * 2, ER + .1, new THREE.MeshStandardMaterial({map: mosaicTex(), roughness: .4, envMapIntensity: .6}), 0, .012, -ER / 2 - .02); mos.receiveShadow = true;
  const DW = 1.0, DH = 2.62, DZ = -ER - .02;
  for (const s of [-1, 1]) box(EX - DW / 2, WY1, .1, trim, s * (EX + DW / 2) / 2, WY1 / 2, DZ, blk, "porch");
  box(EX * 2, WY1 - DH, .1, trim, 0, (DH + WY1) / 2, DZ, blk, "porch");
  const doorG = new THREE.Group(); doorG.position.set(-DW / 2, 0, DZ); blk.add(doorG);
  box(DW, .26, .06, trim, DW / 2, .13, 0, doorG, "trim"); box(DW, .12, .06, trim, DW / 2, DH - .06, 0, doorG, "trim");
  for (const x of [.06, DW - .06]) box(.12, DH, .06, trim, x, DH / 2, 0, doorG, "trim");
  add(new THREE.PlaneGeometry(DW - .2, DH - .4), glass, DW / 2, DH / 2 + .07, 0, doorG).castShadow = false;
  box(.05, .05, .5, brass, DW - .16, 1.05, .06, doorG); box(.5, .04, .04, brass, DW / 2, 1.05, -.06, doorG);
  const openT = hangTex(true), closedT = hangTex(false), hangM = new THREE.MeshStandardMaterial({map: closedT, roughness: .6});
  const hang = add(new THREE.PlaneGeometry(.46, .23), hangM, DW / 2, 1.72, .045, doorG); hang.castShadow = false;
  // the neon OPEN in the right window
  const neonM = new THREE.MeshBasicMaterial({map: neonTex(), transparent: true, depthWrite: false});
  const neon = add(new THREE.PlaneGeometry(1.0, .5), neonM, 2.55, 2.3, -.42); neon.castShadow = false;
  // gold-leaf trade word on the left window
  let decal = null;
  if (word) { const dt = canvasTex(1024, 256, (g, w, h) => { g.textAlign = "center"; g.textBaseline = "middle"; g.font = `italic 600 132px ${font}, Georgia, serif`;
      const gr = g.createLinearGradient(0, 40, 0, 210); gr.addColorStop(0, "#f7e2a0"); gr.addColorStop(.5, "#c99a3c"); gr.addColorStop(1, "#f2d78a");
      g.lineWidth = 10; g.strokeStyle = "rgba(30,20,10,.75)"; g.strokeText(word, w / 2, h / 2); g.fillStyle = gr; g.fillText(word, w / 2, h / 2); });
    decal = add(new THREE.PlaneGeometry(2.2, .55), new THREE.MeshStandardMaterial({map: dt, transparent: true, metalness: .6, roughness: .3, depthWrite: false}), -(SX + EX) / 2, 2.45, -.11); decal.castShadow = false; }

  // ---------- the awning ----------
  const AWW = SX * 2 + .2, AL = 1.75, SL = .42;   // width, reach, slope (radians below level)
  const awT = canvasTex(1024, 64, () => {}), vaT = canvasTex(1024, 128, () => {});
  const paintAwn = col => { const c = awT.image.getContext("2d"); stripes(c, 1024, 64, hex(col), 16, false); awT.needsUpdate = true; const v = vaT.image.getContext("2d"); stripes(v, 1024, 128, hex(col), 16, true); vaT.needsUpdate = true; };
  const awM = new THREE.MeshStandardMaterial({map: awT, roughness: .92, side: THREE.DoubleSide, envMapIntensity: .4});
  const vaM = new THREE.MeshStandardMaterial({map: vaT, roughness: .92, side: THREE.DoubleSide, alphaTest: .5, envMapIntensity: .4});
  const awG = new THREE.Group(); awG.position.set(0, TY1 + .02, .06); blk.add(awG);
  const fabG = new THREE.PlaneGeometry(AWW, 1); fabG.translate(0, -.5, 0);
  const fab = add(fabG, awM, 0, 0, 0, awG, "roof"); fab.rotation.x = -(Math.PI / 2 - SL);
  const vaG = new THREE.PlaneGeometry(AWW, .3); vaG.translate(0, -.15, 0); const val = add(vaG, vaM, 0, 0, 0, awG, "roof");
  const bar = box(AWW, .05, .05, cope, 0, 0, 0, awG);
  const roll = add(new THREE.CylinderGeometry(.1, .1, AWW + .1, 18), cope, 0, 0, -.02, awG); roll.rotation.z = Math.PI / 2;
  const arms = [-1, 1].map(s => box(.04, .04, 1, cope, s * (AWW / 2 - .15), 0, 0, awG));
  function setAwning(a) {
    const L = Math.max(.001, a * AL), fy = -Math.sin(SL) * L, fz = Math.cos(SL) * L;
    fab.scale.y = L; fab.visible = a > .01; val.position.set(0, fy, fz); val.scale.y = mix(.15, 1, smooth(0, .3, a)); bar.position.set(0, fy, fz);
    arms.forEach(m => { const ay = -.62, dy = fy - ay, len = Math.hypot(dy, fz); m.scale.z = Math.max(.01, len); m.position.set(m.position.x, ay + dy / 2, fz / 2); m.rotation.x = -Math.atan2(dy, fz); m.visible = a > .05; });
  }

  // ---------- inside ----------
  const IZ0 = -T, IZ1 = -D + .4; let IW = W - .72;
  const fl = flat(IW, D - .7, floorM, 0, .005, (IZ0 + IZ1) / 2); if (ft) ft.repeat.set(IW / 1.6, (D - .7) / 1.6);
  box(IW, GH - .1, .1, wallM, 0, GH / 2, IZ1 - .05).castShadow = false;
  for (const s of [-1, 1]) box(.1, GH, D - .7, wallM, s * (IW / 2 - .06), GH / 2, (IZ0 + IZ1) / 2).castShadow = false;
  box(IW, .1, D - .7, wallM, 0, GH - .05, (IZ0 + IZ1) / 2).castShadow = false;
  box(IW, .12, .03, new THREE.MeshStandardMaterial({color: 0x5a4636, roughness: .5}), 0, .06, IZ1 + .02); // baseboard
  IW -= .24;  // props stand against the plaster face
  { const wm = new THREE.MeshStandardMaterial({color: K.wain || K.trim, roughness: .55, envMapIntensity: .3}), cap = new THREE.MeshStandardMaterial({color: 0xf4efe6, roughness: .5, envMapIntensity: .3}), L = D - .9, zc = (IZ0 + IZ1) / 2 - .1;
    for (const s of [-1, 1]) { box(.02, 1.0, L, wm, s * (IW / 2 + .0), .5, zc).castShadow = false; box(.05, .05, L, cap, s * (IW / 2 - .01), 1.02, zc).castShadow = false; }
    box(IW, 1.0, .02, wm, 0, .5, IZ1 + .01).castShadow = false; box(IW, .05, .05, cap, 0, 1.02, IZ1 + .02).castShadow = false; }
  // back-room door and a crown line
  box(1.0, 2.2, .04, trim, 2.2, 1.1, IZ1 + .02); for (const y of [.6, 1.55]) box(.7, .6, .02, trim, 2.2, y, IZ1 + .05); box(.05, .05, .1, brass, 2.55, 1.05, IZ1 + .06); box(1.14, .08, .06, trim, 2.2, 2.24, IZ1 + .03);
  box(IW, .08, .06, trim, 0, GH - .2, IZ1 + .03);
  // pendant lights in two rows, plus a soft window wash
  const shadeM = new THREE.MeshStandardMaterial({color: 0x1d1f22, roughness: .4, metalness: .3, side: THREE.DoubleSide}), bulbM = glow(0xffe2b0, 3);
  for (const z of [-2.4, -5.4]) for (const x of [-1.7, 1.7]) {
    cyl(.006, .006, .9, dark, x, GH - .5, z, blk, 6); const sh = add(new THREE.ConeGeometry(.22, .2, 20, 1, true), shadeM, x, GH - 1.0, z); sh.castShadow = false;
    add(new THREE.SphereGeometry(.06, 12, 8), bulbM, x, GH - 1.06, z).castShadow = false; lamp(x, GH - 1.2, z, 1, 8.5); }
  lamp(-2.2, 2.6, -1.0, .9, 5.5, 0xfff0d8); lamp(2.2, 2.6, -1.0, .9, 5.5, 0xfff0d8); lamp(0, 2.4, -7.6, .8, 7);

  const P = new THREE.Group(); blk.add(P);  // the trade's own furniture
  const mat = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: m, envMapIntensity: .6});
  const plant = (x, z, s = 1) => { cyl(.22 * s, .16 * s, .42 * s, mat(0x2b2d30, .5), x, .21 * s, z, P);
    const lm = new THREE.MeshStandardMaterial({map: leafT, alphaTest: .45, side: THREE.DoubleSide, roughness: .8, envMapIntensity: .4});
    for (let k = 0; k < 26; k++) { const a = rnd() * 6.3, r = rnd() * .3 * s, y = .45 * s + rnd() * .8 * s; const m = add(new THREE.PlaneGeometry(.38 * s, .38 * s), lm, x + Math.cos(a) * r, y, z + Math.sin(a) * r, P); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.castShadow = false; } };
  const leafT = leafCard(110, 34);
  const chairB = (x, z, ry, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g); const m = mat(col, .5);
    box(.42, .05, .42, m, 0, .46, 0, g); box(.42, .42, .04, m, 0, .7, -.2, g); for (const [a, b] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) cyl(.016, .016, .46, dark, a, .23, b, g, 6); return g; };
  const bottles = (x0, y, z, n, dx, h = .16, cols) => { for (let i = 0; i < n; i++) { const c = cols ? cols[i % cols.length] : new THREE.Color().setHSL(rnd(), .5, .55).getHex(); cyl(.03, .03, h, mat(c, .25), x0 + i * dx, y + h / 2, z, P, 10); } };
  const shelf = (x, z, w, ys, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g); for (const y of ys) box(w, .04, .34, woodM, 0, y, 0, g); return g; };

  if (kind === "bakery") {
    // the case: painted base, glass top, two shelves of treats
    const CX = -.4, CZ = -4.4, CW = 4.4, Y0 = .97;
    box(CW, .92, .82, trim, CX, .46, CZ); box(CW + .06, .05, .86, mat(0x3b3631, .4), CX, .945, CZ);
    add(new THREE.BoxGeometry(CW - .1, .5, .74), glass, CX, Y0 + .25, CZ, P).castShadow = false; box(CW - .1, .015, .66, glass, CX, Y0 + .24, CZ - .02).castShadow = false;
    box(CW - .06, .03, .78, mat(0x3b3631, .4), CX, Y0 + .51, CZ); for (const x of [CX - CW / 2 + .04, CX + CW / 2 - .04]) box(.04, .5, .78, mat(0x3b3631, .4), x, Y0 + .25, CZ);
    lamp(CX, Y0 + .4, CZ + .1, .5, 3, 0xfff1dc);
    const icing = [0xf3c6d4, 0xfbf3e4, 0x5a3426, 0xffffff, 0xe7a9bd, 0xd8a56b], sponge = [0xf2dcb0, 0xe9c48c, 0x6b4430], dn = [0xd9a066, 0x6b4430, 0xf0c8d4, 0xf6efe4];
    for (let i = 0; i < 9; i++) { const x = CX - CW / 2 + .32 + i * .47, z = CZ - .05;
      cyl(.15, .15, .01, mat(0xf4f1ea, .3), x, Y0 + .255, z, P, 24); cyl(.12, .12, .1, mat(sponge[i % 3], .7), x, Y0 + .31, z, P, 24); cyl(.125, .125, .03, mat(icing[i % 6], .45), x, Y0 + .375, z, P, 24);
      for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(.018, 8, 6), mat(icing[(i + 2) % 6], .4), x + Math.cos(k) * .09, Y0 + .395, z + Math.sin(k) * .09, P);
      add(new THREE.SphereGeometry(.022, 8, 6), mat(0xb3241c, .3), x, Y0 + .4, z, P); }
    for (let i = 0; i < 15; i++) { const x = CX - CW / 2 + .24 + i * .28, t = add(new THREE.TorusGeometry(.06, .028, 8, 18), mat(dn[i % 4], .55), x, Y0 + .03, CZ + .14, P); t.rotation.x = Math.PI / 2; }
    for (let i = 0; i < 15; i++) { const x = CX - CW / 2 + .24 + i * .28; add(new THREE.SphereGeometry(.07, 12, 8), mat(i % 3 ? 0xc8894a : 0xe0b27a, .7), x, Y0 + .04, CZ - .16, P).scale.set(1.1, .5, 1); }
    // register and a cake under a dome on the counter
    box(.4, .25, .3, dark, CX + CW / 2 - .35, 1.66, CZ); cyl(.2, .2, .03, mat(0xf2efe8, .3), CX - CW / 2 + .5, 1.55, CZ, P, 24); cyl(.16, .16, .18, mat(0xf3d9e3, .5), CX - CW / 2 + .5, 1.65, CZ, P, 24);
    const dome = add(new THREE.SphereGeometry(.22, 20, 12, 0, 6.3, 0, Math.PI / 2), glass, CX - CW / 2 + .5, 1.56, CZ, P); dome.castShadow = false;
    // back wall: bread on shelves, boxes, the board
    const sh = shelf(-1.4, IZ1 + .25, 3.2, [1.1, 1.6, 2.1]);
    for (const y of [1.12, 1.62]) for (let i = 0; i < 7; i++) add(new THREE.CapsuleGeometry(.08, .2, 4, 10), mat(i % 2 ? 0xb87a3e : 0xd39b57, .8), -1.25 + i * .42, y + .07, 0, sh).rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) box(.34, .22, .3, mat(i % 2 ? 0xf6d7e0 : 0xffffff, .6), -1.2 + i * .62, 2.23, 0, sh);
    box(1.8, 1.1, .04, new THREE.MeshStandardMaterial({map: boardTex(), roughness: .9}), 1.2, 2.7, IZ1 + .03);
    // window displays: a tiered stand left, a tall cake right
    for (const [x, c] of [[-2.2, 0xf3d9e3], [2.0, 0xf6efe4]]) box(.9, .5, .6, trim, x, .85, -.85);
    for (let k = 0; k < 3; k++) { cyl(.36 - k * .1, .36 - k * .1, .02, mat(0xf2efe8, .3), -2.2, 1.12 + k * .28, -.85, P, 24); cyl(.01, .01, .28, brass, -2.2, 1.24 + k * .28, -.85, P, 6);
      for (let i = 0; i < 6 - k * 2; i++) { const a = i / (6 - k * 2) * 6.28, r = .25 - k * .08; cyl(.05, .04, .06, mat(0xf2e3c6), -2.2 + Math.cos(a) * r, 1.16 + k * .28, -.85 + Math.sin(a) * r, P, 10); add(new THREE.SphereGeometry(.05, 10, 8), mat([0xf3c6d4, 0x6b4430, 0xffffff][(i + k) % 3], .5), -2.2 + Math.cos(a) * r, 1.21 + k * .28, -.85 + Math.sin(a) * r, P); } }
    for (let k = 0; k < 3; k++) cyl(.3 - k * .07, .3 - k * .07, .2, mat(0xf8f3ea, .5), 2.0, 1.2 + k * .2, -.85, P, 28);
    add(new THREE.SphereGeometry(.05, 10, 8), mat(0xd9879a, .4), 2.0, 1.75, -.85, P);
    plant(3.0, -7.6, 1.2);
  } else if (kind === "scoop") {
    // the dipping cabinet: tubs of ice cream under slanted glass, cones stacked on top, sundaes in the window
    const CX = -.4, CZ = -4.4, CW = 4.4, Y0 = .97, chrome = mat(0xd9dcdf, .25, .7);
    box(CW, .92, .82, trim, CX, .46, CZ); for (let i = 0; i < 9; i++) box(.03, .7, .02, mat(0x7fc4b4, .5), CX - CW / 2 + .25 + i * .49, .46, CZ + .42);
    box(CW + .06, .05, .86, chrome, CX, .945, CZ);
    const gl = add(new THREE.BoxGeometry(CW - .1, .02, .62), glass, CX, Y0 + .3, CZ + .1, P); gl.rotation.x = -.75; gl.castShadow = false;
    box(CW - .06, .04, .34, chrome, CX, Y0 + .52, CZ - .24); for (const x of [CX - CW / 2 + .04, CX + CW / 2 - .04]) box(.04, .5, .8, chrome, x, Y0 + .25, CZ);
    lamp(CX, Y0 + .45, CZ + .1, .5, 3, 0xfff6ea);
    const flav = [0xf6efe0, 0x5a3426, 0xf2a7b8, 0xa8dcc0, 0xf2d27a, 0x9bb7ee, 0xe0b787, 0xc94a5a, 0xf6efe0, 0x8a5a3c, 0xf7c6d8, 0x7ccf9a, 0xf5e08a, 0xd88a5a, 0xb6a1e0, 0xf3ece0];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) { const x = CX - CW / 2 + .33 + i * .53, z = CZ - .18 + row * .3, c = flav[row * 8 + i];
      cyl(.13, .13, .12, steel, x, Y0 + .06, z, P, 20);
      const top = add(new THREE.SphereGeometry(.125, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(c, .75), x, Y0 + .11, z, P); top.scale.y = .42;
      for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(.035, 8, 6), mat(c, .75), x + Math.cos(k * 2.1 + i) * .06, Y0 + .145, z + Math.sin(k * 2.1 + i) * .06, P).scale.y = .6; }
    // cone towers and a register on the top ledge
    for (const x of [CX - 1.5, CX - 1.25]) { cyl(.055, .055, .3, glass, x, Y0 + .69, CZ - .24, P, 16).castShadow = false; cyl(.06, .06, .02, chrome, x, Y0 + .55, CZ - .24, P, 16);
      for (let k = 0; k < 4; k++) { const c = add(new THREE.ConeGeometry(.05, .17, 14, 1, true), mat(0xd9a066, .8), x, Y0 + .66 + k * .04, CZ - .24, P); c.rotation.x = Math.PI; } }
    box(.4, .25, .3, dark, CX + CW / 2 - .35, Y0 + .67, CZ - .24);
    // back wall: the flavor board, sundae glasses and waffle-cone jars on a shelf
    box(2.4, 1.1, .04, new THREE.MeshStandardMaterial({map: boardTex(), roughness: .9}), -1.0, 2.7, IZ1 + .03);
    const sh = shelf(1.5, IZ1 + .25, 1.8, [1.3, 1.8]);
    for (let i = 0; i < 4; i++) { const x = -.6 + i * .4; cyl(.09, .05, .2, glass, x, 1.42, 0, sh, 16).castShadow = false; for (let k = 0; k < 2; k++) add(new THREE.SphereGeometry(.07, 12, 8), mat(flav[i * 3 + k], .7), x, 1.52 + k * .09, 0, sh); add(new THREE.SphereGeometry(.025, 8, 6), mat(0xb3241c, .3), x, 1.7, 0, sh); }
    for (let i = 0; i < 3; i++) { cyl(.11, .11, .3, glass, -.5 + i * .5, 1.97, 0, sh, 16).castShadow = false; for (let k = 0; k < 4; k++) { const c = add(new THREE.ConeGeometry(.05, .2, 12, 1, true), mat(0xc98a4a, .8), -.5 + i * .5, 1.98 + k * .03, 0, sh); c.rotation.x = Math.PI; } }
    // window: a giant three-scoop cone left, a big sundae right, and two little tables
    box(.9, .5, .6, trim, -2.2, .85, -.85); { const g = new THREE.Group(); g.position.set(-2.2, 1.1, -.85); P.add(g); const cn = add(new THREE.ConeGeometry(.17, .62, 20), mat(0xd9a066, .8), 0, .31, 0, g); cn.rotation.x = Math.PI;
      for (const [y, c] of [[.66, 0xf6efe0], [.88, 0xa8dcc0], [1.08, 0xf2a7b8]]) add(new THREE.SphereGeometry(.17, 18, 12), mat(c, .7), 0, y, 0, g); add(new THREE.SphereGeometry(.04, 10, 8), mat(0xb3241c, .3), 0, 1.27, 0, g); }
    box(.8, .5, .5, trim, 2.1, .85, -.85); cyl(.22, .1, .3, glass, 2.1, 1.25, -.85, P, 20).castShadow = false; cyl(.12, .12, .02, glass, 2.1, 1.1, -.85, P, 16);
    for (const [dx, c] of [[-.08, 0xa8dcc0], [.09, 0xf2a7b8], [0, 0xf6efe0]]) add(new THREE.SphereGeometry(.11, 14, 10), mat(c, .7), 2.1 + dx, 1.42 + (dx === 0 ? .1 : 0), -.85, P);
    add(new THREE.SphereGeometry(.035, 10, 8), mat(0xb3241c, .3), 2.1, 1.66, -.85, P);
    const table = (x, z) => { cyl(.3, .3, .03, mat(0xf6f2ea, .3), x, .74, z, P, 24); cyl(.03, .03, .72, chrome, x, .37, z, P, 8); cyl(.2, .2, .03, chrome, x, .015, z, P, 16);
      for (const a of [Math.PI / 2, -Math.PI / 2]) chairB(x + Math.sin(a) * .52, z + Math.cos(a) * .52, a + Math.PI, 0x2f7f86); };
    table(-1.9, -2.1); table(-1.9, -3.3);
    plant(3.0, -6.6, 1.1);
  } else if (kind === "salon" || kind === "barber") {
    const bar = kind === "barber", chairC = bar ? 0x7a1f1f : 0x1b1c1f;
    const mirror = mirror_();
    const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g);
      cyl(.28, .3, .06, steel, 0, .03, 0, g, 24); cyl(.06, .06, .4, steel, 0, .25, 0, g, 12); const m = mat(chairC, .35, .1);
      box(.56, .14, .52, m, 0, .5, 0, g); box(.56, .62, .12, m, 0, .86, -.24, g); for (const s of [-1, 1]) { box(.08, .06, .44, m, s * .3, .7, 0, g); box(.04, .16, .04, steel, s * .3, .6, .14, g); }
      box(.4, .03, .16, steel, 0, .2, .34, g); if (bar) box(.3, .14, .08, m, 0, 1.25, -.26, g); return g; };
    for (const [i, z] of [-2.8, -4.7, -6.6].entries()) {
      box(.04, 1.15, .82, mirror, -IW / 2 + .045, 1.75, z).castShadow = false; box(.06, 1.25, .92, trim, -IW / 2 + .01, 1.75, z);
      box(.4, .05, 1.0, woodM, -IW / 2 + .2, 1.0, z); bottles(-IW / 2 + .12, 1.025, z - .3, 4, 0, .14, [0x2b2d30, 0xc9952f, 0xf2efe8, 0x9b2335]); chair(-IW / 2 + 1.05, z, -Math.PI / 2);
      if (i === 1 && !bar) { cyl(.18, .14, .38, steel, -1.4, 1.5, z, P, 20); }
    }
    // shampoo bowls at the back, a waiting bench and a product wall on the right
    for (const x of [-1.6, -.4]) { box(.7, .8, .6, dark, x, .4, IZ1 + .5); const b = add(new THREE.SphereGeometry(.26, 20, 10, 0, 6.3, 0, Math.PI / 2), mat(0xf2f2f0, .2), x, .98, IZ1 + .5, P); b.rotation.x = Math.PI; chair(x, IZ1 + 1.2, Math.PI); }
    box(.5, .45, 2.2, mat(0x3a2f2a, .6), IW / 2 - .3, .23, -5.2); box(.12, .5, 2.2, mat(0x3a2f2a, .6), IW / 2 - .1, .7, -5.2);
    const sh = shelf(IW / 2 - .22, -2.6, 1.6, [1.0, 1.5, 2.0], -Math.PI / 2);
    for (const y of [1.02, 1.52, 2.02]) for (let i = 0; i < 8; i++) { cyl(.035, .035, .18, mat([0xf2efe8, 0x2b2d30, 0xc9952f, 0x7a3b4f][(i + y * 3 | 0) % 4], .3), -.7 + i * .2, y + .09, 0, sh, 10); }
    // window: a styled head on a stand left, product display right
    box(.8, .7, .5, trim, 2.1, .95, -.85); bottles(1.8, 1.3, -.85, 6, .12, .2, [0xf2efe8, 0x2b2d30, 0xc9952f]);
    plant(-2.3, -.95, 1.15);
    if (bar) for (let i = 0; i < 3; i++) { box(.5, .64, .03, dark, -.2 + i * .7, 2.55, IZ1 + .03); box(.4, .54, .02, mat([0xb3241c, 0xe9e4dc, 0x1f3d8a][i], .7), -.2 + i * .7, 2.55, IZ1 + .05); }
  } else if (kind === "nails") {
    // a row of manicure tables, the polish wall, pedicure chairs at the back
    const cols = []; for (let h = 0; h < 40; h++) cols.push(new THREE.Color().setHSL((h * .618) % 1, .55 + (h % 3) * .12, .38 + (h % 5) * .08));
    for (const [i, z] of [-2.6, -4.2, -5.8].entries()) { const x = -1.6;
      box(1.0, .05, .5, mat(0xf6f4f0, .25), x, .76, z); box(.04, .74, .44, mat(0xe9e4dc, .4), x - .45, .37, z); box(.04, .74, .44, mat(0xe9e4dc, .4), x + .45, .37, z);
      box(.12, .02, .12, mat(0x2b2d30), x + .25, .79, z); const lamp_ = add(new THREE.CylinderGeometry(.07, .07, .18, 14), mat(0xf2efe8, .3), x + .3, .9, z - .1, P); lamp_.rotation.x = .5;
      bottles(x - .3, .785, z - .12, 5, .08, .08, cols.slice(i * 5, i * 5 + 5).map(c => c.getHex()));
      chairB(x, z + .62, Math.PI, 0xe7c6c6); chairB(x, z - .62, 0, 0x2b2d30); }
    const NB = 28 * 5, bot = new THREE.InstancedMesh(new THREE.CylinderGeometry(.032, .032, .11, 8), mat(0xffffff, .2), NB), m4 = new THREE.Matrix4(), c = new THREE.Color();
    box(4.7, 1.55, .06, mat(0xfbf6f2, .4), -.45, 2.32, IZ1 + .05); box(4.8, .06, .14, mat(0xc98d99, .5), -.45, 3.12, IZ1 + .08);
    for (let r = 0; r < 5; r++) { box(4.5, .025, .14, mat(0xffffff, .3), -.45, 1.66 + r * .3, IZ1 + .13);
      for (let i = 0; i < 28; i++) { m4.makeTranslation(-2.6 + i * .16, 1.73 + r * .3, IZ1 + .13); bot.setMatrixAt(r * 28 + i, m4); bot.setColorAt(r * 28 + i, c.setHSL(((r * 28 + i) * .618) % 1, .62, .38 + (i % 4) * .07)); } }
    bot.castShadow = false; P.add(bot); lamp(-.45, 2.9, IZ1 + .9, .6, 3.2, 0xfff4ea);
    for (const x of [-1.5, -.1, 1.3]) { box(1.0, .3, 1.0, mat(0xf6f4f0, .4), x, .15, IZ1 + .8); box(.8, .5, .7, mat(0xa57983, .45), x, .55, IZ1 + .7); box(.8, .7, .16, mat(0xa57983, .45), x, 1.1, IZ1 + .4);
      for (const s of [-1, 1]) box(.12, .2, .6, mat(0xa57983, .45), x + s * .42, .9, IZ1 + .7); cyl(.22, .18, .2, mat(0xf2f2f0, .2), x, .1, IZ1 + 1.45, P, 20); }
    box(.8, .7, .5, trim, 2.1, .95, -.85); bottles(1.82, 1.3, -.85, 7, .095, .12, cols.slice(15, 22).map(q => q.getHex()));
    plant(-2.3, -.95, 1.1);
  } else if (kind === "eat") {
    // tables by the windows, a counter with a coffee machine at the back
    const top = mat(0xf2efe8, .3), cup = mat(0xffffff, .3);
    const table = (x, z) => { cyl(.36, .36, .04, top, x, .76, z, P, 24); cyl(.035, .035, .74, dark, x, .38, z, P, 8); cyl(.22, .22, .03, dark, x, .015, z, P, 16);
      for (const a of [0, Math.PI]) chairB(x + Math.sin(a) * .6, z + Math.cos(a) * .6, a + Math.PI, 0x23412f);
      cyl(.04, .035, .08, cup, x + .12, .82, z + .05, P, 10); cyl(.1, .1, .015, cup, x - .1, .79, z - .05, P, 16); };
    table(-2.2, -1.5); table(2.2, -1.5); table(-1.1, -3.4); table(1.3, -3.4); table(-2.4, -5.0);
    const CZ = -6.9; box(4.4, 1.0, .7, trim, .6, .5, CZ); for (let i = 0; i < 8; i++) box(.04, .8, .02, mat(0x1a3324, .5), -1.4 + i * .57, .5, CZ + .36); box(4.5, .05, .78, mat(0x2b2d30, .3), .6, 1.02, CZ);
    const mch = new THREE.Group(); mch.position.set(1.8, 1.05, CZ - .1); P.add(mch); box(.7, .45, .45, steel, 0, .22, 0, mch); box(.72, .06, .47, dark, 0, .46, 0, mch); for (const x of [-.18, .18]) box(.06, .08, .12, dark, x, .16, .24, mch);
    cyl(.08, .09, .3, dark, 1.1, 1.2, CZ - .1, P, 14); box(.9, .35, .5, glass, -.6, 1.22, CZ).castShadow = false;
    for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(.06, 10, 8), mat([0xd39b57, 0xb87a3e, 0xf3d9e3][i % 3], .7), -.95 + i * .14, 1.11, CZ, P).scale.set(1.3, .6, 1);
    for (let i = 0; i < 4; i++) { const g = chairB(-.9 + i * .7, CZ + .7, Math.PI, 0x2b2d30); g.scale.set(1, 1.55, 1); }
    const sh = shelf(.6, IZ1 + .22, 3.6, [1.5, 2.0]); for (const y of [1.52, 2.02]) for (let i = 0; i < 10; i++) cyl(.045, .04, .1, mat(i % 2 ? 0xffffff : 0x23412f, .3), -1.6 + i * .36, y + .05, 0, sh, 10);
    box(2.2, 1.0, .04, new THREE.MeshStandardMaterial({map: boardTex(), roughness: .9}), -1.6, 2.75, IZ1 + .03);
    plant(3.0, -4.8, 1.1);
  } else if (kind === "shop") {
    // clothing racks, a folded-stack table, mannequins in the window
    const garm = [0xb3343a, 0x24365e, 0xe9e4dc, 0x2f6b4f, 0xc9952f, 0x6b3a5e, 0x1d1f22, 0x8aa2b8, 0xd9879a];
    const rack = (x, z, ry, n) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g);
      for (const s of [-1, 1]) { cyl(.015, .015, 1.6, steel, s * .9, .8, 0, g, 8); box(.04, .03, .5, steel, s * .9, .02, 0, g); }
      const r = add(new THREE.CylinderGeometry(.015, .015, 1.84, 8), steel, 0, 1.58, 0, g); r.rotation.z = Math.PI / 2;
      for (let i = 0; i < n; i++) { const h = .7 + rnd() * .3; box(.05, h, .46, mat(garm[(i * 5 + n) % garm.length], .85), -.8 + i * 1.6 / (n - 1), 1.5 - h / 2, 0, g); } return g; };
    rack(-1.8, -3.2, 0, 13); rack(-1.8, -5.6, 0, 11); rack(2.4, -5.0, Math.PI / 2, 12);
    box(1.4, .8, .8, woodM, .6, .4, -3.6); for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) box(.32, .06, .26, mat(garm[(i + k * 2) % garm.length], .85), .1 + i * .33, .83 + k * .06, -3.6);
    const sh = shelf(-.6, IZ1 + .22, 4.6, [.9, 1.5, 2.1]); for (const y of [.92, 1.52, 2.12]) for (let i = 0; i < 9; i++) box(.34, .14, .28, mat(garm[(i + y * 5 | 0) % garm.length], .85), -2 + i * .5, y + .07, 0, sh);
    box(1.2, 1.0, .6, mat(0x2b2d30, .4), 2.3, .5, -2.6);
    const form = (x, z, col) => { const pts = [[0, 0], [.17, 0], [.2, .25], [.16, .5], [.14, .62], [.18, .78], [.06, .88], [0, .9]].map(([a, b]) => new THREE.Vector2(a, b));
      const g = new THREE.Group(); g.position.set(x, .62, z); P.add(g); add(new THREE.LatheGeometry(pts, 24), mat(col, .8), 0, .5, 0, g); cyl(.02, .02, .5, brass, 0, .25, 0, g, 8); cyl(.16, .18, .03, dark, 0, 0, 0, g, 18);
      const dress = [[.18, 0], [.32, .0], [.24, .3], [.17, .55]].map(([a, b]) => new THREE.Vector2(a, b)); add(new THREE.LatheGeometry(dress, 24), mat(col, .85), 0, .5 - .02, 0, g); add(new THREE.SphereGeometry(.09, 14, 10), mat(0xe9e4dc, .5), 0, 1.5, 0, g); };
    box(1.9, .1, .9, trim, -2.2, .57, -.9); form(-2.6, -.95, 0xb3343a); form(-1.8, -.9, 0x24365e);
    box(.9, .5, .6, trim, 2.0, .85, -.85); for (let k = 0; k < 4; k++) box(.4, .07, .3, mat(garm[k + 2], .85), 2.0, 1.14 + k * .07, -.85);
    cyl(.07, .05, .3, mat(0xf2efe8, .3), 2.3, 1.25, -.8, P, 14);
  } else if (kind === "antique") {
    const oldPaint = (c, asp) => { const W = 256, H = Math.round(256 / asp), cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d"), col = new THREE.Color(c);
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#c9b98a"); sky.addColorStop(.55, "#e6d6a8"); sky.addColorStop(1, "#8a7a52"); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = "#" + col.clone().multiplyScalar(.75).getHexString(); g.beginPath(); g.moveTo(0, H * .62); for (let x = 0; x <= W; x += 16) g.lineTo(x, H * (.58 + .07 * Math.sin(x / 37 + c % 7))); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = "#" + col.clone().multiplyScalar(.45).getHexString(); g.beginPath(); g.moveTo(0, H * .78); for (let x = 0; x <= W; x += 16) g.lineTo(x, H * (.76 + .05 * Math.sin(x / 23 + c % 5))); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      for (let i = 0; i < 3; i++) { const x = W * (.2 + .3 * i + .05 * (c % 3)), y = H * .6; g.fillStyle = "#3f4a2e"; g.beginPath(); g.ellipse(x, y - H * .08, W * .05, H * .1, 0, 0, 6.3); g.fill(); g.fillRect(x - 2, y - H * .02, 4, H * .08); }
      const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .7); v.addColorStop(0, "rgba(60,40,10,0)"); v.addColorStop(1, "rgba(40,25,8,.65)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
    // a grandfather clock, a china hutch, a rocking chair, a trunk, a gramophone in the window and framed pictures
    const walnut = mat(0x4a2e1c, .45), oak = mat(0x8a5a32, .5), china = mat(0xf3efe6, .25), BZ = IZ1 + .3;
    const clock = new THREE.Group(); clock.position.set(-.95, 0, BZ + .02); P.add(clock);
    box(.62, .3, .42, walnut, 0, .15, 0, clock); box(.5, 1.3, .34, walnut, 0, .95, 0, clock); box(.6, .62, .4, walnut, 0, 1.91, 0, clock); box(.66, .1, .44, walnut, 0, 2.27, 0, clock);
    const face = add(new THREE.CylinderGeometry(.2, .2, .02, 28), china, 0, 1.92, .21, clock); face.rotation.x = Math.PI / 2; box(.01, .14, .01, dark, 0, 1.97, .225, clock); box(.1, .01, .01, dark, .04, 1.92, .225, clock);
    box(.3, .9, .01, glass, 0, .95, .175, clock).castShadow = false; cyl(.008, .008, .62, brass, 0, 1.1, .1, clock, 6); cyl(.08, .08, .02, brass, 0, .78, .1, clock, 18).rotation.x = Math.PI / 2;
    const hutch = new THREE.Group(); hutch.position.set(-2.3, 0, BZ); P.add(hutch);
    box(1.6, .9, .5, oak, 0, .45, 0, hutch); box(1.5, 1.1, .03, oak, 0, 1.45, -.225, hutch); for (const x of [-.74, .74]) box(.05, 1.1, .32, oak, x, 1.45, -.08, hutch); box(1.66, .08, .5, oak, 0, 2.04, -.05, hutch);
    for (const y of [1.2, 1.58]) box(1.42, .03, .28, oak, 0, y, -.06, hutch);
    for (const y of [1.22, 1.6]) for (let i = 0; i < 5; i++) { const pl = add(new THREE.CylinderGeometry(.11, .11, .015, 22), mat([0xf3efe6, 0xdde6ef, 0xf1e2c8][i % 3], .25), -.56 + i * .28, y + .13, -.14, hutch); pl.rotation.x = Math.PI / 2 - .2; }
    for (const x of [-.36, .36]) cyl(.02, .02, .04, brass, x, .7, .26, hutch, 8);
    // rocking chair
    const rock = new THREE.Group(); rock.position.set(-.9, 0, -5.4); rock.rotation.y = .5; P.add(rock);
    box(.5, .05, .46, oak, 0, .44, 0, rock); for (let i = 0; i < 5; i++) box(.04, .62, .03, oak, -.18 + i * .09, .78, -.22, rock); box(.5, .06, .05, oak, 0, 1.1, -.22, rock);
    for (const x of [-.22, .22]) { for (const z of [-.18, .18]) cyl(.02, .02, .4, oak, x, .25, z, rock, 6); const rn = add(new THREE.TorusGeometry(.9, .02, 6, 24, .7), oak, x, .92, 0, rock); rn.rotation.set(0, Math.PI / 2, -Math.PI / 2 - .35); }
    // an old wool rug under the table, and a stack of suitcases
    const rugCv = document.createElement("canvas"); rugCv.width = 512; rugCv.height = 340; { const g = rugCv.getContext("2d"); g.fillStyle = "#7a2b24"; g.fillRect(0, 0, 512, 340);
      g.strokeStyle = "#d9b26a"; g.lineWidth = 10; g.strokeRect(14, 14, 484, 312); g.strokeStyle = "#1f2f4a"; g.lineWidth = 16; g.strokeRect(34, 34, 444, 272);
      g.fillStyle = "#1f2f4a"; g.beginPath(); g.moveTo(256, 90); g.lineTo(360, 170); g.lineTo(256, 250); g.lineTo(152, 170); g.closePath(); g.fill();
      g.fillStyle = "#d9b26a"; g.beginPath(); g.moveTo(256, 125); g.lineTo(314, 170); g.lineTo(256, 215); g.lineTo(198, 170); g.closePath(); g.fill();
      for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${rnd() < .5 ? "0,0,0" : "255,240,220"},.08)`; g.fillRect(rnd() * 512, rnd() * 340, 2, 2); } }
    const rugT = new THREE.CanvasTexture(rugCv); rugT.colorSpace = THREE.SRGBColorSpace; const rug = add(new THREE.PlaneGeometry(2.6, 1.75), new THREE.MeshStandardMaterial({map: rugT, roughness: .95, envMapIntensity: .2}), .4, .012, -4.3, P); rug.rotation.x = -Math.PI / 2; rug.castShadow = false;
    for (const [y, w, c] of [[.12, .75, 0x5a3a26], [.33, .66, 0x3b4a5a], [.52, .56, 0x8a6a3a]]) { box(w, .2, .42, mat(c, .6), 2.9, y, -4.6); box(.12, .03, .03, brass, 2.9, y + .11, -4.6 + .22); }
    // trunk, a round table with a fringe lamp and teacups
    box(.9, .5, .5, mat(0x6b4a2e, .6), 1.4, .25, -6.6); for (const x of [1.05, 1.75]) box(.06, .52, .52, brass, x, .25, -6.6); box(.92, .04, .52, mat(0x3b2a1e, .5), 1.4, .51, -6.6);
    cyl(.5, .5, .04, oak, .9, .74, -4.0, P, 28); cyl(.05, .06, .72, oak, .9, .37, -4.0, P, 10); cyl(.3, .32, .04, oak, .9, .02, -4.0, P, 18);
    cyl(.05, .07, .3, brass, .75, .91, -4.1, P, 12); const shade = add(new THREE.ConeGeometry(.24, .2, 24, 1, true), glow(0xe9a35a, 1.4), .75, 1.16, -4.1, P); shade.castShadow = false; lamp(.75, 1.05, -4.1, .8, 4, 0xffcf8a);
    for (const [x, z] of [[1.1, -3.85], [1.2, -4.15]]) { cyl(.05, .035, .06, china, x, .79, z, P, 14); cyl(.08, .08, .01, china, x, .765, z, P, 18); }
    // framed pictures on the side wall and a shelf of crocks
    for (const [z, y, w, h, c] of [[-3.0, 2.3, .7, .9, 0x6f7f5a], [-4.2, 2.5, .9, .6, 0x8a6a4a], [-5.4, 2.2, .6, .8, 0x4f6a7a], [-6.5, 2.45, .8, .6, 0xa0784a]]) { box(.05, h + .1, w + .1, mat(0xb08a4a, .4, .5), -IW / 2 + .14, y, z); const pic = add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: oldPaint(c, w / h), roughness: .85, envMapIntensity: .3}), -IW / 2 + .175, y, z, P); pic.rotation.y = Math.PI / 2; pic.castShadow = false; }
    const sh = shelf(.65, BZ, 1.8, [1.6, 2.1]); for (const y of [1.62, 2.12]) for (let i = 0; i < 6; i++) cyl(.08, .07, .2 + (i % 2) * .06, mat([0xd8cbb0, 0x7a5a3a, 0x9aa6a8][i % 3], .7), -.65 + i * .26, y + .12, 0, sh, 14);
    // window: a gramophone on a little table
    box(.7, .7, .5, walnut, -2.2, .35, -1.0); const gr = new THREE.Group(); gr.position.set(-2.2, .7, -1.0); P.add(gr); box(.4, .18, .4, walnut, 0, .09, 0, gr); cyl(.16, .16, .01, dark, 0, .19, 0, gr, 24);
    const horn = add(new THREE.CylinderGeometry(.3, .02, .55, 24, 1, true), mat(0xb8893a, .3, .8), .08, .55, .1, gr); horn.material.side = THREE.DoubleSide; horn.rotation.set(-.6, 0, -.5); cyl(.012, .012, .3, brass, .04, .3, .02, gr, 6);
    plant(3.0, -1.4, .9);
  } else if (kind === "tattoo") {
    // flash sheets framed up the left wall, two stations (bed, stool, lamp, cart), a front counter with a portfolio
    const flash = (seed) => { const cv = document.createElement("canvas"); cv.width = 256; cv.height = 320; const g = cv.getContext("2d");
      g.fillStyle = "#efe6d2"; g.fillRect(0, 0, 256, 320); g.lineWidth = 5; g.lineJoin = g.lineCap = "round"; g.strokeStyle = "#1b1b1d";
      const red = "#b3241c", grn = "#2f6b4f", yel = "#d9a72e", blu = "#24497a";
      const heart = (x, y, s) => { g.beginPath(); g.moveTo(x, y + s * .9); g.bezierCurveTo(x - s * 1.4, y, x - s * .6, y - s * .9, x, y - s * .2); g.bezierCurveTo(x + s * .6, y - s * .9, x + s * 1.4, y, x, y + s * .9); g.fillStyle = red; g.fill(); g.stroke(); };
      const rose = (x, y, s) => { g.fillStyle = red; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y, s * .55, .5, 5.2); g.stroke(); g.beginPath(); g.arc(x + s * .15, y - s * .1, s * .25, 2, 7); g.stroke();
        g.fillStyle = grn; for (const a of [-2.4, -.7]) { g.beginPath(); g.ellipse(x + Math.cos(a) * s * 1.35, y - Math.sin(a) * s * 1.1, s * .55, s * .25, -a, 0, 7); g.fill(); g.stroke(); } };
      const star = (x, y, s) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .42 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fillStyle = yel; g.fill(); g.stroke(); };
      const anchor = (x, y, s) => { g.strokeStyle = "#1b1b1d"; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x, y + s); g.moveTo(x - s * .5, y - s * .55); g.lineTo(x + s * .5, y - s * .55); g.stroke(); g.beginPath(); g.arc(x, y + s * .3, s * .7, .2, Math.PI - .2); g.stroke(); g.beginPath(); g.arc(x, y - s * 1.15, s * .18, 0, 7); g.stroke(); };
      const swallow = (x, y, s) => { g.beginPath(); g.moveTo(x - s, y - s * .2); g.quadraticCurveTo(x - s * .2, y - s * .5, x, y); g.quadraticCurveTo(x + s * .3, y - s * .9, x + s * 1.1, y - s * .7); g.lineTo(x + s * .4, y + s * .1); g.lineTo(x + s * .9, y + s * .6); g.lineTo(x, y + s * .3); g.closePath(); g.fillStyle = blu; g.fill(); g.stroke(); };
      const dagger = (x, y, s) => { g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * .14, y + s * .35); g.lineTo(x - s * .14, y + s * .35); g.closePath(); g.fillStyle = "#c9ccd0"; g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - s * .35, y + s * .38); g.lineTo(x + s * .35, y + s * .38); g.stroke(); g.fillStyle = yel; g.fillRect(x - s * .07, y + s * .42, s * .14, s * .4); g.strokeRect(x - s * .07, y + s * .42, s * .14, s * .4); };
      const all = [heart, rose, star, anchor, swallow, dagger];
      [[70, 80, 34], [180, 90, 30], [80, 210, 30], [180, 220, 36], [128, 150, 22]].forEach(([x, y, sz], i) => all[(seed + i * 2) % 6](x, y, sz));
      g.fillStyle = "#1b1b1d"; g.fillRect(0, 0, 256, 6); g.fillRect(0, 314, 256, 6);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const frameM = mat(0x111113, .4, .3), vinyl = mat(0x141416, .35, .05), chromeM = mat(0xcfd3d7, .2, .9);
    let k = 0; for (const y of [1.6, 2.35]) for (let i = 0; i < 6; i++) { const z = -2.0 - i * .78; box(.04, .58, .48, frameM, -IW / 2 + .03, y, z);
      const pic = add(new THREE.PlaneGeometry(.42, .52), new THREE.MeshStandardMaterial({map: flash(k++), roughness: .7, envMapIntensity: .3}), -IW / 2 + .055, y, z, P); pic.rotation.y = Math.PI / 2; pic.castShadow = false; }
    const station = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g);
      // the bed: chrome base, black padded top with a raised back
      cyl(.05, .07, .5, chromeM, 0, .25, 0, g, 12); box(.6, .04, .4, chromeM, 0, .03, 0, g); box(.62, .1, 1.3, vinyl, 0, .58, .15, g);
      const back = box(.62, .1, .7, vinyl, 0, .78, -.72, g); back.rotation.x = -.6; box(.2, .06, .3, vinyl, 0, .66, .88, g);
      // stool, lamp, cart with ink caps and a machine
      cyl(.2, .2, .08, vinyl, .75, .55, .2, g, 20); cyl(.025, .025, .5, chromeM, .75, .28, .2, g, 8); for (let a = 0; a < 5; a++) { const b = box(.3, .025, .04, chromeM, .75 + Math.cos(a * 1.257) * .14, .04, .2 + Math.sin(a * 1.257) * .14, g); b.rotation.y = -a * 1.257; }
      cyl(.02, .02, 1.6, chromeM, -.55, .8, -.3, g, 8); const arm = box(.03, .03, .7, chromeM, -.55, 1.6, .02, g); arm.rotation.x = .25;
      const head = add(new THREE.CylinderGeometry(.13, .16, .06, 20), mat(0x1d1f22, .4, .3), -.55, 1.5, .36, g); add(new THREE.CircleGeometry(.12, 20), glow(0xfff4e0, 1.6), -.55, 1.466, .36, g).rotation.x = Math.PI / 2;
      box(.5, .03, .36, chromeM, -.6, .9, .55, g); cyl(.015, .015, .88, chromeM, -.6, .45, .55, g, 6); box(.36, .02, .3, chromeM, -.6, .3, .55, g);
      for (let i = 0; i < 7; i++) cyl(.015, .013, .025, mat([0x111111, 0xb3241c, 0x24497a, 0x2f6b4f, 0xd9a72e, 0x6b3a5e, 0xe9e4dc][i], .4), -.78 + i * .055, .93, .45, g, 8);
      box(.05, .06, .11, mat(0x3a3d42, .3, .7), -.5, .945, .62, g); cyl(.006, .006, .1, chromeM, -.5, .93, .7, g, 6).rotation.x = Math.PI / 2;
      lamp(x - .55, 1.42, z + .36, .5, 3.5, 0xfff4e0); return g; };
    station(-1.55, -3.4, .0); station(-1.55, -5.9, .0);
    // half-wall divider between the stations, a mirror, and a front counter with a portfolio and a card stand
    box(1.4, 1.1, .08, trim, -1.75, .55, -4.65);
    box(.04, 1.3, .7, mat(0xdfe4e8, .05, .9), IW / 2 - .03, 1.6, -5.6).castShadow = false; box(.06, 1.4, .8, trim, IW / 2 - .01, 1.6, -5.6);
    box(1.6, .95, .6, trim, 1.6, .475, -3.2); box(1.66, .05, .66, mat(0x3a2f2a, .4), 1.6, .975, -3.2);
    box(.5, .05, .36, mat(0x7a1f1f, .6), 1.4, 1.025, -3.15).rotation.y = .2; box(.08, .1, .05, mat(0xe9e4dc, .4), 2.0, 1.05, -3.05);
    for (let i = 0; i < 3; i++) box(.02, .5, .38, frameM, IW / 2 - .02, 2.2, -2.2 - i * .7);
    for (let i = 0; i < 3; i++) { const pic = add(new THREE.PlaneGeometry(.32, .42), new THREE.MeshStandardMaterial({map: flash(20 + i), roughness: .7, envMapIntensity: .3}), IW / 2 - .035, 2.2, -2.2 - i * .7, P); pic.rotation.y = -Math.PI / 2; pic.castShadow = false; }
    // window: a flash binder on a stand and a plant
    box(.9, .6, .5, trim, -2.1, .3, -.95); const bind = box(.5, .04, .36, mat(0x161618, .5), -2.1, .63, -.95); bind.rotation.x = -.15;
    const open_ = add(new THREE.PlaneGeometry(.44, .32), new THREE.MeshStandardMaterial({map: flash(31), roughness: .7, envMapIntensity: .3}), -2.1, .66, -.95, P); open_.rotation.x = -Math.PI / 2 - .15; open_.castShadow = false;
    plant(2.6, -1.2, 1.0);
  } else if (kind === "dojo") {
    // puzzle mats wall to wall, two heavy bags, a mirror wall, belts on a rack, a trophy shelf, pads and gloves in the window
    const matT = canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#24497a" : "#a8323a"; g.fillRect(i * 128, j * 128, 128, 128); }
      g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, h); g.moveTo(0, k * 128); g.lineTo(w, k * 128); g.stroke(); } }, [IW / 2.4, 5.6 / 2.4]);
    flat(IW, 5.6, new THREE.MeshStandardMaterial({map: matT, roughness: .85, envMapIntensity: .25}), 0, .02, -4.8, P);
    const bag = (x, z, c) => { cyl(.008, .008, .9, steel, x, GH - .5, z, P, 6); cyl(.05, .05, .04, dark, x, GH - .96, z, P, 10); cyl(.19, .19, 1.05, mat(c, .45), x, GH - 1.52, z, P, 22); cyl(.19, .17, .04, dark, x, GH - 2.06, z, P, 22); };
    bag(1.6, -3.4, 0x7a1f1f); bag(1.6, -5.2, 0x1d1f22);
    box(.04, 1.5, 3.2, mat(0xdfe4e8, .05, .9), -IW / 2 + .03, 1.55, -4.7).castShadow = false; box(.06, 1.58, 3.3, trim, -IW / 2 + .01, 1.55, -4.7);
    box(2.0, .1, .06, woodM, -.9, 1.82, IZ1 + .06); const belts = [0xf4f2ec, 0xf2cf3a, 0xe8822a, 0x2f8a4f, 0x2f5fa8, 0x6b4428, 0x161618];
    belts.forEach((c, i) => { box(.06, .56, .012, mat(c, .85), -1.75 + i * .28, 1.5, IZ1 + .1); cyl(.012, .012, .08, brass, -1.75 + i * .28, 1.8, IZ1 + .12, P, 6).rotation.x = Math.PI / 2; });
    const tr = shelf(.9, IZ1 + .22, 1.1, [1.25]); for (let i = 0; i < 4; i++) { const x = -.4 + i * .27, h = .14 + (i % 2) * .08; box(.1, .05, .1, dark, x, 1.3, 0, tr); cyl(.012, .012, h, brass, x, 1.33 + h / 2, 0, tr, 6); add(new THREE.CylinderGeometry(.05, .025, .07, 14), brass, x, 1.36 + h, 0, tr); }
    box(1.6, .06, .36, woodM, -2.0, .44, -2.5); for (const dz of [-.65, .65]) box(.06, .42, .3, woodM, -2.0 + dz, .21, -2.5);
    box(1.9, .1, .9, trim, -2.2, .57, -.9); for (const [x, c] of [[-2.7, 0xb3241c], [-2.45, 0xb3241c]]) { const g = add(new THREE.SphereGeometry(.1, 14, 10), mat(c, .4), x, .7, -.85); g.scale.set(1, .8, 1.3); }
    { const sh = box(.38, .52, .14, mat(0x24497a, .6), -1.75, .9, -1.0); sh.rotation.set(-.25, .3, 0); } box(.5, .1, .3, mat(0x1d1f22, .6), -2.1, .67, -.7);
  } else if (kind === "jewel") {
    // lit glass cases with rings and pendants, a necklace niche on the back wall, two stools, a mirror, risers in the window
    const glass = new THREE.MeshPhysicalMaterial({color: 0xffffff, roughness: .02, transparent: true, opacity: .16, envMapIntensity: 1.4, depthWrite: false});
    const velvet = mat(0x1d2a44, .95), gold = mat(0xd9b15a, .22, 1), silver = mat(0xe2e5e9, .16, 1);
    const gem = c => new THREE.MeshPhysicalMaterial({color: c, roughness: 0, clearcoat: 1, envMapIntensity: 2.4, emissive: c, emissiveIntensity: .12});
    const ringAt = (x, y, z, i, g) => { box(.07, .045, .07, velvet, x, y + .022, z, g); const r = add(new THREE.TorusGeometry(.024, .005, 8, 22), i % 2 ? gold : silver, x, y + .07, z, g); r.castShadow = false;
      add(new THREE.OctahedronGeometry(.011), gem([0xffffff, 0x3a6fd8, 0xc0263a, 0x2f9a5f, 0xffffff][i % 5]), x, y + .098, z, g).castShadow = false; };
    const caseAt = (x, z, w, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g);
      box(w, .72, .6, trim, 0, .36, 0, g); box(w - .04, .02, .56, velvet, 0, .73, 0, g); box(w - .08, .012, .02, glow(0xfff4e0, 1.4), 0, 1.04, -.26, g).castShadow = false;
      for (const m of [box(w, .015, .6, glass, 0, 1.07, 0, g), box(w, .33, .015, glass, 0, .9, .3, g), box(.015, .33, .6, glass, -w / 2, .9, 0, g), box(.015, .33, .6, glass, w / 2, .9, 0, g)]) m.castShadow = false;
      const n = Math.max(4, Math.round(w / .22)); for (let i = 0; i < n; i++) ringAt(-w / 2 + .14 + i * (w - .28) / (n - 1), .74, i % 2 ? .1 : -.08, i, g); return g; };
    caseAt(-2.3, -4.3, 2.4, Math.PI / 2); caseAt(-.2, -6.3, 2.8, 0); caseAt(1.0, -3.3, 1.6, 0);
    for (const x of [-.7, .3]) { cyl(.17, .17, .05, mat(0x1d2a44, .7), x, .76, -5.6, P, 18); cyl(.02, .02, .74, brass, x, .37, -5.6, P, 8); cyl(.16, .16, .02, brass, x, .02, -5.6, P, 18); }
    box(1.66, .74, .02, glow(0xfff4e0, .22, {color: 0x1d2a44}), 1.2, 1.78, IZ1 + .02).castShadow = false;
    for (const y of [1.36, 2.2]) box(1.8, .08, .34, trim, 1.2, y, IZ1 + .17); for (const x of [.34, 2.06]) box(.08, .92, .34, trim, x, 1.78, IZ1 + .17);
    for (let i = 0; i < 3; i++) { const x = .75 + i * .45; add(new THREE.ConeGeometry(.08, .28, 16), velvet, x, 1.54, IZ1 + .2); add(new THREE.SphereGeometry(.05, 12, 10), velvet, x, 1.72, IZ1 + .2);
      const ch = add(new THREE.TorusGeometry(.07, .004, 6, 26), i === 1 ? silver : gold, x, 1.62, IZ1 + .25); ch.scale.y = 1.3; ch.castShadow = false; add(new THREE.OctahedronGeometry(.016), gem([0xc0263a, 0xffffff, 0x3a6fd8][i]), x, 1.53, IZ1 + .27).castShadow = false; }
    lamp(1.2, 1.9, IZ1 + .7, .5, 3, 0xfff4e0);
    box(1.9, .1, .9, trim, -2.2, .57, -.9); for (const [x, h] of [[-2.7, .12], [-2.2, .22], [-1.7, .08]]) { box(.4, h, .4, velvet, x, .62 + h / 2, -.95); ringAt(x, .62 + h, -.95, Math.abs(x * 10 | 0), P); }
    lamp(-2.2, 1.4, -.6, .5, 2.5, 0xfff4e0);
  } else if (kind === "appst") {
    // fridges down the left wall, washers in a row, ranges at the back, each with a blank tag; a counter on the right; a washer and range in the window
    const white = mat(0xf2f1ee, .32), stl = mat(0xc9cdd1, .28, .85), bl = mat(0x1b1d20, .35), tagM = mat(0xf6d64a, .6);
    const unit = (x, y, z, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; P.add(g); return g; };
    const fridge = (x, z, ry, m) => { const g = unit(x, 0, z, ry); box(.8, 1.75, .7, m, 0, .875, 0, g); box(.006, 1.0, .006, bl, 0, 1.25, .352, g); box(.8, .008, .006, bl, 0, .72, .352, g);
      for (const dx of [-.05, .05]) box(.02, .5, .03, stl, dx, 1.25, .37, g); box(.4, .02, .03, stl, 0, .62, .37, g); box(.12, .08, .006, tagM, .26, 1.5, .356, g); };
    const washer = (x, y, z, ry, m) => { const g = unit(x, y, z, ry); box(.62, .86, .62, m, 0, .43, 0, g); box(.62, .1, .04, m === white ? mat(0xdedcd6, .35) : bl, 0, .81, .3, g);
      const d = add(new THREE.TorusGeometry(.19, .03, 10, 28), stl, 0, .42, .315, g); add(new THREE.CircleGeometry(.17, 28), mat(0x2a3138, .05, .3), 0, .42, .316, g); box(.12, .08, .006, tagM, .2, .7, .312, g); };
    const range = (x, y, z, ry) => { const g = unit(x, y, z, ry); box(.76, .9, .64, stl, 0, .45, 0, g); box(.76, .02, .64, bl, 0, .91, 0, g); box(.6, .38, .01, mat(0x111214, .05, .2), 0, .42, .325, g);
      box(.76, .12, .06, stl, 0, .98, -.29, g); for (let i = 0; i < 4; i++) cyl(.02, .02, .03, bl, -.24 + i * .16, .8, .33, g, 10).rotation.x = Math.PI / 2; box(.12, .08, .006, tagM, .26, .72, .326, g); };
    [stl, white, stl, bl].forEach((m, i) => fridge(-IW / 2 + .45, -2.8 - i * .95, Math.PI / 2, m));
    for (let i = 0; i < 4; i++) washer(-.75 + i * .75, 0, -4.3, 0, i % 2 ? stl : white);
    for (let i = 0; i < 3; i++) range(-.7 + i * .9, 0, IZ1 + .4, 0);
    box(1.4, .95, .6, trim, 2.0, .475, -2.8); box(1.46, .05, .66, mat(0x3a3f45, .4), 2.0, .975, -2.8); box(.34, .22, .26, bl, 2.3, 1.11, -2.85);
    box(1.9, .1, .9, trim, -2.2, .57, -.9); washer(-2.6, .62, -.95, .2, white); range(-1.8, .62, -.95, -.15);
  } else if (kind === "massage") {
    // a massage table with folded towels, a paper screen, a shelf of candles and stones, plants, warm low light
    const pad = mat(0xe9e1d2, .9), wd = mat(0x6b4a32, .55), towel = mat(0xf4f1ea, .95);
    const tbl = new THREE.Group(); tbl.position.set(-.9, 0, -4.6); P.add(tbl);
    box(.76, .1, 1.9, pad, 0, .72, 0, tbl); for (const [x, z] of [[-.32, -.85], [.32, -.85], [-.32, .85], [.32, .85]]) box(.06, .67, .06, wd, x, .335, z, tbl); box(.66, .04, 1.7, wd, 0, .2, 0, tbl);
    { const hr = add(new THREE.TorusGeometry(.13, .045, 10, 20, Math.PI), pad, 0, .76, -1.05, tbl); hr.rotation.x = -Math.PI / 2; }
    box(.62, .05, .4, towel, 0, .8, .7, tbl); { const rl = cyl(.06, .06, .6, towel, 0, .83, .35, tbl, 16); rl.rotation.z = Math.PI / 2; }
    flat(2.2, 3.0, mat(0xb9a58a, .95), -.9, .012, -4.6, P);
    const scr = new THREE.Group(); scr.position.set(1.3, 0, -4.4); scr.rotation.y = -.5; P.add(scr); const paper = glow(0xfff1da, .25, {color: 0xf3ead8, roughness: .9});
    for (let i = 0; i < 3; i++) { const p = new THREE.Group(); p.position.set((i - 1) * .52, 0, 0); p.rotation.y = (i - 1) * .35; scr.add(p); box(.5, 1.8, .04, wd, 0, .95, 0, p); box(.44, 1.68, .045, paper, 0, .97, 0, p);
      for (const y of [.55, 1.0, 1.45]) box(.44, .02, .05, wd, 0, y, 0, p); box(.02, 1.68, .05, wd, 0, .97, 0, p); }
    const sh = shelf(-.9, IZ1 + .22, 1.8, [1.0, 1.5]);
    for (let i = 0; i < 4; i++) { const x = -.7 + i * .45; cyl(.04, .04, .09 + (i % 2) * .05, mat(0xf4efe6, .7), x, 1.065 + (i % 2) * .025, 0, sh, 14); add(new THREE.SphereGeometry(.014, 8, 6), glow(0xffb45a, 2.2), x, 1.13 + (i % 2) * .05, 0, sh).castShadow = false; }
    for (let i = 0; i < 3; i++) { const st = add(new THREE.SphereGeometry(.07 - i * .015, 14, 10), mat(0x3a3b3d, .4), .4, 1.56 + i * .05, 0, sh); st.scale.y = .45; }
    for (let i = 0; i < 3; i++) box(.3, .06, .22, towel, -.6 + i * .32, 1.55, 0, sh);
    plant(2.5, -2.6, 1.1); plant(-2.5, -6.6, 1.0); lamp(-.9, 2.0, -4.6, .5, 4, 0xffd9a8);
    box(1.9, .1, .9, trim, -2.2, .57, -.9); for (let k = 0; k < 3; k++) box(.36, .07, .28, towel, -2.5, .66 + k * .07, -.9);
    for (let i = 0; i < 3; i++) { cyl(.045, .045, .12, mat(0xf4efe6, .7), -1.9 + i * .14, .68, -.85, P, 14); add(new THREE.SphereGeometry(.015, 8, 6), glow(0xffb45a, 2.2), -1.9 + i * .14, .755, -.85).castShadow = false; }
  } else if (kind === "cafe") {
    // a counter with an espresso machine and grinder, a pastry case, menu boards, stools; bistro tables by the window wall
    const CZ = -6.0, wood = mat(0x6b4a32, .5), top = mat(0x2e2a27, .35), cream = mat(0xf2ece0, .4), copper = mat(0xb8733a, .3, .9);
    box(4.6, .98, .7, trim, .9, .49, CZ); box(4.7, .05, .78, top, .9, 1.005, CZ); for (let i = 0; i < 6; i++) box(.04, .8, .02, wood, -1.1 + i * .8, .45, CZ + .36);
    const em = new THREE.Group(); em.position.set(1.6, 1.03, CZ - .1); P.add(em); box(.9, .5, .5, steel, 0, .25, 0, em); box(.92, .06, .52, mat(0x1d1f22, .4), 0, .53, 0, em);
    for (const x of [-.22, .22]) { box(.06, .08, .1, mat(0x1d1f22, .4), x, .2, .28, em); cyl(.035, .03, .1, steel, x, .12, .34, em, 10); cyl(.04, .03, .07, cream, x, .035, .3, em, 12); }
    for (let i = 0; i < 6; i++) cyl(.04, .032, .08, cream, -.3 + (i % 3) * .1, .6, -.1 + Math.floor(i / 3) * .1, em, 12);
    { const gr = new THREE.Group(); gr.position.set(.7, 1.03, CZ - .1); P.add(gr); box(.2, .32, .22, mat(0x1d1f22, .4), 0, .16, 0, gr); add(new THREE.ConeGeometry(.11, .26, 16), mat(0x2a2420, .2, .1, ), 0, .45, 0, gr).rotation.x = Math.PI; }
    // pastry case on the left end of the counter
    const CX = -.7; box(1.3, .02, .6, mat(0x3b3631, .4), CX, 1.03, CZ + .02); add(new THREE.BoxGeometry(1.26, .42, .58), glass, CX, 1.25, CZ + .02, P).castShadow = false;
    const pas = [0xd9a066, 0x6b4430, 0xf0c8d4, 0xe8c27a, 0xf6efe4, 0x9a5a34];
    for (let i = 0; i < 8; i++) { const x = CX - .5 + (i % 4) * .33, z = CZ - .1 + Math.floor(i / 4) * .22; const m = add(new THREE.SphereGeometry(.07, 14, 10), mat(pas[i % 6], .7), x, 1.09, z, P); m.scale.set(1.2, .55, 1); }
    lamp(CX, 1.4, CZ + .2, .4, 2.5, 0xfff1dc);
    // menu boards and a shelf of bags and cups on the back wall
    box(2.4, 1.0, .04, new THREE.MeshStandardMaterial({map: boardTex(), roughness: .9}), .4, 2.75, IZ1 + .03);
    const sh = shelf(-2.3, IZ1 + .22, 1.6, [1.3, 1.75]); for (let i = 0; i < 5; i++) { box(.18, .26, .1, mat([0x6b4a32, 0x2f6b4f, 0xc9952f][i % 3], .8), -.6 + i * .3, 1.45, 0, sh); cyl(.05, .04, .1, cream, -.6 + i * .3, 1.82, 0, sh, 12); }
    // stools at the counter, bistro tables down the left side
    for (let i = 0; i < 3; i++) { const x = .1 + i * .8; cyl(.17, .17, .05, wood, x, .74, CZ + .75, P, 18); cyl(.025, .025, .72, dark, x, .36, CZ + .75, P, 8); cyl(.18, .18, .02, dark, x, .01, CZ + .75, P, 18); }
    const bistro = (x, z) => { cyl(.34, .34, .04, cream, x, .74, z, P, 24); cyl(.03, .03, .72, dark, x, .37, z, P, 8); cyl(.22, .22, .02, dark, x, .01, z, P, 16);
      chairB(x - .55, z, Math.PI / 2, 0x2f4a3a); chairB(x + .55, z, -Math.PI / 2, 0x2f4a3a); cyl(.04, .032, .08, cream, x - .1, .8, z, P, 12); cyl(.04, .032, .08, cream, x + .12, .8, z + .06, P, 12); };
    bistro(-2.3, -3.0); bistro(-2.3, -4.5); plant(2.9, -2.6, 1.0);
    // the window: a crate of coffee bags, a stack of cups and a jar of beans
    box(1.9, .1, .9, trim, -2.2, .57, -.9); for (let i = 0; i < 3; i++) box(.2, .3, .12, mat([0x6b4a32, 0x2f6b4f, 0xc9952f][i], .8), -2.7 + i * .26, .77, -.95);
    for (let k = 0; k < 4; k++) cyl(.05, .04, .1, cream, -1.75, .67 + k * .1, -.85, P, 12); cyl(.09, .09, .22, glass, -1.95, .73, -1.05, P, 16); cyl(.08, .08, .14, mat(0x3a2418, .8), -1.95, .69, -1.05, P, 16);
  } else if (kind === "gym") {
    // rubber floor, a dumbbell rack, a squat rack with a loaded bar, a bench, two treadmills facing the mirror, kettlebells in the window
    flat(IW, 6.6, mat(0x4a4e54, .9), 0, .015, -4.6, P); lamp(.8, 3.7, -3.4, .7, 8, 0xfff1dc); flat(2.3, 2.0, woodM, .3 - .6, .03, IZ1 + 1.1, P); lamp(-.4, 3.7, -6.6, .9, 9, 0xfff1dc);
    const iron = mat(0x1d1f22, .45, .6), chromeM = mat(0xc9cdd1, .2, .9), red = mat(0xb3343a, .5);
    box(.04, 1.6, 3.4, mat(0xdfe4e8, .05, .9), IW / 2 - .03, 1.6, -4.4).castShadow = false; box(.06, 1.68, 3.5, trim, IW / 2 - .01, 1.6, -4.4);
    // dumbbells on a two-tier rack along the left wall
    const rack = new THREE.Group(); rack.position.set(-IW / 2 + .4, 0, -4.4); P.add(rack); for (const [y, dz] of [[.45, .1], [.8, -.12]]) { box(.36, .04, 3.0, iron, dz, y, 0, rack); }
    for (const z of [-1.4, 1.4]) box(.05, .82, .05, iron, 0, .41, z, rack);
    for (let i = 0; i < 9; i++) for (const [y, dz] of [[.45, .1], [.8, -.12]]) { const g = new THREE.Group(); g.position.set(dz, y + .08, -1.2 + i * .3); rack.add(g); const r = .05 + i * .006;
      for (const s of [-1, 1]) cyl(r, r, .07, iron, s * .1, 0, 0, g, 12).rotation.z = Math.PI / 2; cyl(.015, .015, .16, chromeM, 0, 0, 0, g, 8).rotation.z = Math.PI / 2; g.rotation.y = Math.PI / 2; }
    // squat rack and bar at the back
    const sq = new THREE.Group(); sq.position.set(-.3, 0, IZ1 + .9); P.add(sq); for (const x of [-.6, .6]) for (const z of [-.4, .4]) box(.07, 2.3, .07, iron, x, 1.15, z, sq);
    for (const z of [-.4, .4]) box(1.27, .07, .07, iron, 0, 2.3, z, sq); for (const x of [-.6, .6]) box(.07, .07, .87, iron, x, 2.3, 0, sq);
    { const bar = cyl(.016, .016, 2.1, chromeM, 0, 1.35, .4, sq, 8); bar.rotation.z = Math.PI / 2; for (const s of [-1, 1]) for (let k = 0; k < 2; k++) cyl(.22 - k * .05, .22 - k * .05, .05, k ? red : iron, s * (.78 + k * .06), 1.35, .4, sq, 22).rotation.z = Math.PI / 2; }
    // a flat bench and kettlebells on the floor
    box(1.2, .08, .32, mat(0x1d1f22, .6), .7, .45, -5.7); for (const x of [.2, 1.2]) box(.06, .42, .3, iron, x, .21, -5.7);
    [[.6, .5, .25], [.52, .4, .7], [.44, .3, 1.05]].forEach(([w, h, y]) => box(w, h, w * .85, woodM, 2.3, y, -7.6));
    const kb = (x, z, s = 1, m = iron) => { add(new THREE.SphereGeometry(.13 * s, 16, 12), m, x, .12 * s, z, P); const h = add(new THREE.TorusGeometry(.08 * s, .018 * s, 8, 16, Math.PI), m, x, .22 * s, z, P); };
    kb(-2.3, -6.6); kb(-1.95, -6.6, 1.2); kb(-1.6, -6.6, .9, red);
    // two treadmills facing the mirror wall
    const tread = (z) => { const g = new THREE.Group(); g.position.set(z, 0, IZ1 + 1.55); P.add(g); box(.75, .16, 1.7, iron, 0, .08, 0, g); box(.6, .02, 1.5, mat(0x111214, .9), 0, .17, .05, g);
      for (const x of [-.34, .34]) { const u = box(.05, 1.1, .05, iron, x, .7, -.75, g); u.rotation.x = .18; } box(.75, .3, .12, iron, 0, 1.25, -.88, g); box(.4, .18, .02, glow(0x4fc3ff, 1.2), 0, 1.28, -.82, g).castShadow = false; };
    tread(-2.75); tread(-1.85); box(2.3, 1.5, .03, mat(0xdfe4e8, .05, .9), -2.3, 1.75, IZ1 + .04).castShadow = false; box(2.38, 1.58, .02, trim, -2.3, 1.75, IZ1 + .025);
    // the window: kettlebells on risers, a medicine ball and a rope
    box(1.9, .1, .9, trim, -2.2, .57, -.9); kb(-2.7, -.9, 1.0, red); kb(-2.35, -.9, 1.3); kb(-1.95, -.95, .8, red);
    { const mb = add(new THREE.SphereGeometry(.16, 18, 14), mat(0x2f5fa8, .6), -1.7, .78, -.7); }
  } else if (kind === "music") {
    // an upright piano, a drum kit, guitars on the back wall, music stands and chairs; a guitar on a stand in the window
    const blackM = mat(0x111214, .2, .1), ivory = mat(0xf4efe4, .35), wood = mat(0x7a4a2a, .4), brassC = mat(0xc9a24a, .25, .9);
    const pi = new THREE.Group(); pi.position.set(-IW / 2 + .4, 0, -4.2); pi.rotation.y = Math.PI / 2; P.add(pi);
    box(1.5, 1.25, .6, blackM, 0, .62, 0, pi); box(1.52, .05, .38, blackM, 0, .74, .38, pi); box(1.3, .02, .16, ivory, 0, .77, .32, pi);
    for (let i = 0; i < 26; i++) if ([1, 2, 4, 5, 6][i % 7 % 5] && i % 7 !== 2 && i % 7 !== 6) box(.025, .025, .09, blackM, -.63 + i * .05, .79, .29, pi);
    box(.7, .04, .36, blackM, 0, .46, .75, pi); for (const x of [-.3, .3]) box(.04, .44, .04, blackM, x, .23, .75, pi);
    // drum kit
    const dk = new THREE.Group(); dk.position.set(.6, 0, IZ1 + 1.3); P.add(dk); const shellM = mat(0x8a1f2a, .3, .2), headM = mat(0xf2efe6, .6);
    { const bd = cyl(.3, .3, .4, shellM, 0, .32, 0, dk, 24); bd.rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(.29, 24), headM, 0, .32, .201, dk); }
    for (const [x, y, z, r] of [[-.5, .62, .25, .18], [.22, .78, -.05, .13], [-.18, .78, -.05, .13], [.6, .5, .2, .22]]) { cyl(r, r, .16, shellM, x, y, z, dk, 20); cyl(r, r, .005, headM, x, y + .081, z, dk, 20); cyl(.01, .01, y, steel, x, y / 2, z + .05, dk, 6); }
    for (const [x, y, z] of [[-.75, 1.15, .1], [.85, 1.25, -.1]]) { cyl(.012, .012, y, steel, x, y / 2, z, dk, 6); const c = cyl(.24, .24, .006, brassC, x, y, z, dk, 24); c.rotation.x = .15; }
    { const st = cyl(.17, .14, .05, blackM, 0, .5, .75, dk, 16); cyl(.02, .02, .48, steel, 0, .24, .75, dk, 6); }
    // guitars on the back wall
    const gtr = (x, y, z, c, ry = 0, parent = P) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); const bm = mat(c, .3, .1);
      const lo = cyl(.19, .19, .08, bm, 0, -.18, 0, g, 24); lo.rotation.x = Math.PI / 2; const up = cyl(.15, .15, .08, bm, 0, .08, 0, g, 24); up.rotation.x = Math.PI / 2;
      add(new THREE.CircleGeometry(.05, 16), blackM, 0, -.02, .041, g); box(.05, .62, .03, wood, 0, .5, .03, g); box(.07, .14, .03, wood, 0, .86, .03, g); return g; };
    [[-1.6, 0xc98a3a], [-1.0, 0x1d1f22], [-.4, 0x8a1f2a], [2.2, 0xe8d8b8]].forEach(([x, c]) => { gtr(x, 1.75, IZ1 + .12, c); box(.08, .04, .1, dark, x, 2.66, IZ1 + .06); });
    // music stands and chairs
    const stand = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g); cyl(.012, .012, 1.1, dark, 0, .55, 0, g, 6); const d = box(.48, .34, .015, dark, 0, 1.2, 0, g); d.rotation.x = -.35;
      const sheet = box(.4, .28, .005, mat(0xf6f3ea, .9), 0, 1.21, .02, g); sheet.rotation.x = -.35; for (const a of [0, 2.1, 4.2]) { const l = box(.02, .02, .3, dark, Math.sin(a) * .12, .03, Math.cos(a) * .12, g); l.rotation.y = a; } };
    stand(-.6, -3.2, .3); stand(.7, -3.0, -.3); chairB(-.6, -2.4, Math.PI + .3, 0x2a2440); chairB(.7, -2.2, Math.PI - .3, 0x2a2440);
    // the window: a guitar on a stand, sheet music and a metronome
    box(1.9, .1, .9, trim, -2.2, .57, -.9); { const g = gtr(-2.5, 1.12, -.95, 0xc98a3a); g.rotation.x = -.15; box(.3, .05, .3, dark, -2.5, .64, -.95); }
    for (let k = 0; k < 3; k++) { const sm = box(.3, .006, .4, mat(0xf6f3ea, .9), -1.85 + k * .04, .63 + k * .006, -.85); sm.rotation.y = .2 * k; }
    { const mt = add(new THREE.ConeGeometry(.09, .22, 4), wood, -1.6, .73, -1.1); mt.rotation.y = Math.PI / 4; }
  } else if (kind === "photo") {
    // a seamless paper backdrop, a stool, two softboxes, a camera on a tripod, framed prints on the walls and in the window
    const paperM = mat(0xe9e6df, .95), blackM = mat(0x1d1f22, .45, .3), white = mat(0xffffff, .9);
    { const bx = .2, bz = IZ1 + .35, w = 3.4; for (const x of [bx - w / 2 - .1, bx + w / 2 + .1]) cyl(.02, .02, 3.1, blackM, x, 1.55, bz, P, 8);
      const rl = cyl(.08, .08, w + .1, paperM, bx, 3.05, bz, P, 16); rl.rotation.z = Math.PI / 2;
      box(w, 2.9, .01, paperM, bx, 1.6, bz + .02).castShadow = false; const sweep = add(new THREE.CylinderGeometry(.5, .5, w, 16, 1, true, Math.PI, Math.PI / 2), new THREE.MeshStandardMaterial({color: 0xe9e6df, roughness: .95, side: THREE.DoubleSide}), bx, .5, bz + .52, P);
      sweep.rotation.z = Math.PI / 2; box(w, .01, 1.6, paperM, bx, .006, bz + 1.8).castShadow = false; }
    { const st = new THREE.Group(); st.position.set(.2, 0, -5.9); P.add(st); cyl(.18, .18, .04, woodM, 0, .66, 0, st, 18); for (const a of [0, 2.1, 4.2]) { const l = cyl(.015, .015, .7, blackM, Math.sin(a) * .12, .33, Math.cos(a) * .12, st, 6); l.rotation.set(-Math.cos(a) * .15, 0, Math.sin(a) * .15); } }
    const softbox = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g); cyl(.016, .016, 1.8, blackM, 0, .9, 0, g, 6);
      for (const a of [0, 2.1, 4.2]) { const l = box(.02, .02, .5, blackM, Math.sin(a) * .2, .03, Math.cos(a) * .2, g); l.rotation.y = a; }
      const hd = new THREE.Group(); hd.position.set(0, 1.85, 0); hd.rotation.x = .2; g.add(hd); add(new THREE.CylinderGeometry(.42, .14, .4, 4, 1, true), new THREE.MeshStandardMaterial({color: 0x1d1f22, roughness: .6, side: THREE.DoubleSide}), 0, 0, .2, hd).rotation.set(Math.PI / 2, Math.PI / 4, 0);
      const face = box(.56, .56, .01, glow(0xfff8ec, 1.6), 0, 0, .41, hd); face.castShadow = false; lamp(x + Math.sin(ry) * .8, 1.9, z + Math.cos(ry) * .8, .7, 4, 0xfff6e8); };
    softbox(-1.6, -4.6, .7); softbox(2.0, -4.8, -.75);
    { const tp = new THREE.Group(); tp.position.set(-.1, 0, -4.1); P.add(tp); for (const a of [0, 2.1, 4.2]) { const l = cyl(.012, .012, 1.4, blackM, Math.sin(a) * .2, .68, Math.cos(a) * .2, tp, 6); l.rotation.set(-Math.cos(a) * .3, 0, Math.sin(a) * .3); }
      box(.2, .14, .12, blackM, 0, 1.42, 0, tp); const lens = cyl(.045, .05, .14, blackM, 0, 1.42, -.12, tp, 16); lens.rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(.04, 16), mat(0x1a2a3a, .05, .5), 0, 1.42, -.191, tp).rotation.y = Math.PI; }
    // framed prints on the right wall and in the window
    const printT = (h1, h2) => canvasTex(256, 192, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `hsl(${h1},45%,72%)`); gr.addColorStop(.6, `hsl(${h2},35%,52%)`); gr.addColorStop(1, `hsl(${h2},30%,30%)`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(20,24,30,.55)"; g.beginPath(); g.moveTo(0, h * .75); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * (.62 + .1 * Math.sin(x * .03 + h1))); g.lineTo(w, h); g.lineTo(0, h); g.fill(); });
    const frame = (x, y, z, w, h, ry, k) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; P.add(g); box(w + .08, h + .08, .03, blackM, 0, 0, 0, g); box(w - .04, h - .04, .01, white, 0, 0, .018, g);
      box(w - .16, h - .16, .005, new THREE.MeshStandardMaterial({map: printT(20 + k * 60, 200 + k * 25), roughness: .6}), 0, 0, .025, g); return g; };
    [[-3.0, .9, .65, 0], [-4.4, .7, .5, 1], [-5.6, .9, .65, 2]].forEach(([z, w, h, k]) => frame(IW / 2 - .03, 1.75, z, w, h, -Math.PI / 2, k));
    box(1.9, .1, .9, trim, -2.2, .57, -.9);
    for (const [x, k, ry] of [[-2.6, 3, .15], [-1.85, 4, -.15]]) { const f = frame(x, .98, -.95, .5, .38, ry, k); f.rotation.x = -.12; const e = box(.03, .5, .03, woodM, x, .85, -1.05); e.rotation.x = .25; }
  } else if (kind === "groom") {
    // grooming table, the tub, dryer, a shelf of shampoos; a dog waiting in the window
    const tbl = new THREE.Group(); tbl.position.set(-1.1, 0, -4.2); P.add(tbl);
    box(1.1, .04, .6, steel, 0, .86, 0, tbl); box(1.06, .02, .56, mat(0x2b2d30, .9), 0, .89, 0, tbl); for (const [a, b] of [[-.48, -.24], [.48, -.24], [-.48, .24], [.48, .24]]) cyl(.02, .02, .84, steel, a, .42, b, tbl, 8);
    cyl(.018, .018, 1.2, steel, -.5, 1.48, -.24, tbl, 8); const arm = add(new THREE.CylinderGeometry(.018, .018, .6, 8), steel, -.2, 2.08, -.24, tbl); arm.rotation.z = Math.PI / 2;
    const dry = new THREE.Group(); dry.position.set(.4, 0, -5.2); P.add(dry); cyl(.25, .25, .04, dark, 0, .02, 0, dry, 16); cyl(.02, .02, 1.4, steel, 0, .72, 0, dry, 8); const hd = add(new THREE.CylinderGeometry(.11, .16, .34, 18), mat(0x2f7f86, .35), .12, 1.42, 0, dry); hd.rotation.z = -1.1;
    const hose = add(new THREE.TorusGeometry(.32, .035, 8, 20, 2.4), mat(0x2b2d30, .6), -.15, 1.1, 0, dry); hose.rotation.z = -.3;
    const tz = IZ1 + .55, tm = mat(0xdfe3e4, .25, .7); box(1.9, .9, .06, tm, -1.4, .45, tz + .42); box(1.9, .9, .06, tm, -1.4, .45, tz - .42); for (const s of [-1, 1]) box(.06, .9, .9, tm, -1.4 + s * .92, .45, tz);
    box(1.8, .05, .8, mat(0x8d9599, .4, .6), -1.4, .3, tz); for (const s of [-1, 1]) box(2.0, .04, .1, tm, -1.4, .92, tz + s * .45);
    box(2.0, .9, .03, mat(0xffffff, .2), -1.4, 1.4, IZ1 + .03); cyl(.02, .02, .5, steel, -1.4, 1.3, IZ1 + .12, P, 8); const sp = add(new THREE.CylinderGeometry(.03, .05, .12, 10), steel, -1.4, 1.03, IZ1 + .2, P); sp.rotation.x = -.8;
    const sh = shelf(1.6, IZ1 + .22, 2.6, [1.0, 1.5, 2.0]); for (const y of [1.02, 1.52, 2.02]) bottles(.6, y, IZ1 + .22, 9, .24, .2, [0x2f7f86, 0xf2efe8, 0xc9952f, 0x6b3a5e]);
    for (let i = 0; i < 5; i++) { const l = cyl(.012, .012, .7, mat([0xb3343a, 0x2f7f86, 0xc9952f, 0x24365e, 0x6b3a5e][i], .6), IW / 2 - .1, 1.6, -3.4 + i * .18, P, 6); }
    // dog bed and a sitting dog in the right window, treats jar left
    box(.9, .5, .6, trim, 2.1, .25 + .4, -.85);
    const bed = add(new THREE.TorusGeometry(.3, .1, 10, 24), mat(0x8a5a44, .9), 2.1, 1.0, -.85, P); bed.rotation.x = Math.PI / 2; cyl(.28, .28, .06, mat(0xe9dcc8, .9), 2.1, .96, -.85, P, 20);
    const mkDog = (x, y, z, ry, sc, fc, fc2) => { const dog = new THREE.Group(); dog.position.set(x, y, z); dog.rotation.y = ry; dog.scale.setScalar(sc); P.add(dog); const fur = mat(fc, .9), fur2 = mat(fc2, .9);
    add(new THREE.SphereGeometry(.16, 18, 14), fur, 0, .14, -.02, dog).scale.set(1, .8, 1.25);
    add(new THREE.SphereGeometry(.13, 18, 14), fur, 0, .3, .08, dog).scale.set(.95, 1.25, .9);
    add(new THREE.SphereGeometry(.1, 18, 14), fur, 0, .5, .14, dog); add(new THREE.SphereGeometry(.06, 14, 10), fur2, 0, .47, .24, dog).scale.set(.9, .75, 1.2);
    add(new THREE.SphereGeometry(.018, 8, 6), dark, 0, .485, .3, dog); for (const s of [-1, 1]) { add(new THREE.SphereGeometry(.014, 8, 6), dark, s * .04, .54, .225, dog); add(new THREE.SphereGeometry(.05, 12, 8), mat(0x8a5a2c, .9), s * .08, .5, .1, dog).scale.set(.45, 1.3, .8); }
    for (const s of [-1, 1]) { cyl(.03, .028, .24, fur, s * .06, .12, .14, dog, 8); add(new THREE.SphereGeometry(.035, 10, 8), fur2, s * .06, .01, .17, dog); add(new THREE.SphereGeometry(.07, 12, 10), fur, s * .1, .07, -.08, dog).scale.set(.8, .7, 1.3); }
    const tail = cyl(.02, .012, .2, fur, 0, .06, -.24, dog, 8); tail.rotation.x = 1.2; };
    mkDog(2.1, 1.0, -.85, -.5, 1, 0xc8924e, 0xe6c08a); mkDog(-1.1, .9, -4.2, .7, 1.25, 0xf2ede4, 0xfbf8f2);
    box(.9, .5, .6, trim, -2.2, .85, -.85); cyl(.14, .14, .3, glass, -2.2, 1.25, -.85, P, 18); for (let i = 0; i < 4; i++) box(.18, .26, .1, mat([0x2f7f86, 0xc9952f, 0xb3343a, 0x24365e][i], .6), -2.55 + i * .24, 1.23, -.75);
  } else if (kind === "sew" || kind === "tailor" || kind === "uphol") {
    // dress forms and an armchair in the window, the cutting table, the machine, fabric bolts and thread
    const fab = [0x5a3550, 0x24365e, 0xb3343a, 0x2f6b4f, 0xc9952f, 0xe9e4dc, 0x8aa2b8, 0x6b4430, 0xd9879a, 0x1d1f22];
    const form = (x, z, col) => { const pts = [[0, 0], [.16, 0], [.2, .22], [.15, .46], [.13, .58], [.17, .74], [.06, .84], [.03, .9], [0, .9]].map(([a, b]) => new THREE.Vector2(a, b));
      const g = new THREE.Group(); g.position.set(x, .6, z); P.add(g); add(new THREE.LatheGeometry(pts, 24), mat(col, .85), 0, .55, 0, g); cyl(.025, .025, .55, woodM, 0, .27, 0, g, 8);
      for (let k = 0; k < 3; k++) { const l = cyl(.015, .015, .45, woodM, Math.cos(k * 2.1) * .12, .1, Math.sin(k * 2.1) * .12, g, 6); l.rotation.set(Math.sin(k * 2.1) * .5, 0, -Math.cos(k * 2.1) * .5); }
      box(.05, .03, .05, brass, 0, 1.46, 0, g); };
    box(1.9, .1, .9, trim, -2.2, .55, -.9); form(-2.65, -.95, 0xe9e4dc); form(-1.8, -.9, 0x5a3550);
    const ch = new THREE.Group(); ch.position.set(2.1, .6, -.95); ch.rotation.y = -.35; P.add(ch); const up = mat(0x2f6b4f, .85);
    box(.8, .22, .7, up, 0, .3, 0, ch); box(.8, .75, .16, up, 0, .7, -.3, ch); for (const s of [-1, 1]) { box(.14, .3, .66, up, s * .38, .48, 0, ch); box(.12, .3, .12, up, s * .36, .95, -.24, ch); } for (const [a, b] of [[-.32, -.28], [.32, -.28], [-.32, .28], [.32, .28]]) cyl(.025, .018, .2, woodM, a, .1, b, ch, 8);
    box(.9, .5, .6, trim, 2.1, .3, -.95).scale.set(1.05, 1.2, 1.3);
    box(2.4, .05, 1.1, woodM, -.9, .9, -3.6); for (const [a, b] of [[-2, -4.05], [.2, -4.05], [-2, -3.15], [.2, -3.15]]) box(.06, .88, .06, woodM, a, .44, b);
    box(1.6, .012, .8, mat(0x24365e, .9), -1.1, .93, -3.6).rotation.y = .1; box(.5, .02, .03, steel, -.2, .935, -3.3);
    const sm = new THREE.Group(); sm.position.set(2.0, .9, -4.8); P.add(sm); box(1.0, .05, .6, woodM, 0, 0, 0, sm); for (const [a, b] of [[-.45, -.25], [.45, -.25], [-.45, .25], [.45, .25]]) box(.05, .9, .05, dark, a, -.45, b, sm);
    const wm = mat(0xf2efe8, .35); box(.46, .07, .2, wm, 0, .06, 0, sm); box(.08, .28, .16, wm, .19, .23, 0, sm); box(.46, .09, .16, wm, 0, .38, 0, sm); box(.06, .15, .1, wm, -.2, .26, 0, sm); cyl(.06, .06, .03, dark, .25, .38, .09, sm, 14);
    chairB(2.0, -4.1, 0, 0x5a3550);
    const sh = shelf(-.4, IZ1 + .22, 4.2, [.5, 1.1, 1.7, 2.3]); for (const y of [.52, 1.12, 1.72]) for (let i = 0; i < 12; i++) box(.12, .46, .34, mat(fab[(i + y * 7 | 0) % fab.length], .9), -1.95 + i * .34, y + .23, 0, sh);
    const NS = 8 * 14, sp = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .025, .06, 8), mat(0xffffff, .5), NS), m4 = new THREE.Matrix4(), c = new THREE.Color();
    box(.04, 1.3, 1.9, woodM, IW / 2 - .02, 2.0, -2.7);
    for (let r = 0; r < 8; r++) for (let i = 0; i < 14; i++) { m4.makeTranslation(IW / 2 - .07, 1.45 + r * .15, -3.55 + i * .13); sp.setMatrixAt(r * 14 + i, m4); sp.setColorAt(r * 14 + i, c.setHSL(((r * 14 + i) * .618) % 1, .6, .5)); }
    sp.castShadow = true; P.add(sp);
    box(.04, 1.7, .7, mirror_(), -IW / 2 + .03, 1.25, -6.4);
  }
  function mirror_() { return new THREE.MeshStandardMaterial({color: 0xc9d3d9, emissive: 0x56616a, metalness: .35, roughness: .08, envMapIntensity: 1.1}); }

  // ---------- neighbours: plain shopfronts either side, more of the block beyond ----------
  const neighbour = (x0, x1, h, tone, trimC, awnC) => {
    const w = x1 - x0, cx = (x0 + x1) / 2, nb = new THREE.MeshStandardMaterial({...TEX.brick([1, 1], tone), envMapIntensity: .5}), tm = mat(trimC, .5);
    const b = (bw, bh, bd, x, y, z, layer) => wbox(bw, bh, bd, nb, x, y, z, 1.9, 1.3, layer);
    b(.4, GH, T, x0 + .2, GH / 2, -T / 2); b(.4, GH, T, x1 - .2, GH / 2, -T / 2); b(w, h - GH, T, cx, (GH + h) / 2, -T / 2);
    b(.3, h, D, x0 + .15, h / 2, -D / 2); b(.3, h, D, x1 - .15, h / 2, -D / 2); box(w, .3, D, cope, cx, h - .15, -D / 2); box(w + .3, .3, .5, cope, cx, h + .1, -.05, blk, "roof");
    box(w - .8, .55, .2, tm, cx, .28, -.1, blk, "porch"); add(new THREE.PlaneGeometry(w - .9, 2.4), new THREE.MeshPhysicalMaterial({color: 0x2a3238, roughness: .05, metalness: .2, envMapIntensity: 1.3, clearcoat: 1}), cx, 1.8, -.12).castShadow = false;
    box(w - .8, .7, .16, tm, cx, 3.7, -.06, blk, "trim"); for (const x of [x0 + .45, cx - .6, cx + .6, x1 - .45]) box(.08, 3.2, .14, tm, x, 1.6, -.08);
    const n = Math.max(2, Math.round(w / 2.4)); for (let i = 0; i < n; i++) { const wx = x0 + (i + .5) * w / n;
      for (let f = 0; GH + .8 + f * 3.0 + 1.8 <= h - .3; f++) { const y0 = GH + .8 + f * 3.0; box(1.0, 1.8, .04, pane, wx, y0 + .9, .01); box(.06, 1.8, .06, stone, wx, y0 + .9, .03); box(1.2, .12, .18, stone, wx, y0 - .02, .02, blk, "open"); box(1.16, .22, .1, stone, wx, y0 + 1.9, .01, blk, "open");
        if ((i + f) % 3 === 1) box(.9, .8, .02, world.glowMat(0xffd09a, .35, {roughness: .9}), wx, y0 + 1.25, .035); } }
    if (awnC !== null) { const a = new THREE.Group(); a.position.set(cx, 3.32, .06); blk.add(a); const g = new THREE.PlaneGeometry(w - .7, 1.2); g.translate(0, -.6, 0);
      const m = add(g, mat(awnC, .9), 0, 0, 0, a, "roof"); m.material.side = THREE.DoubleSide; m.rotation.x = -(Math.PI / 2 - .5); }
  };
  neighbour(-12.4, X0 - .02, 7.4, [214, 196, 168], 0x2b3a33, 0x3b4a42);
  neighbour(X1 + .02, 11.8, 10.6, [120, 58, 46], 0x1f2124, null);
  neighbour(-20.8, -12.42, 6.2, [168, 92, 66], 0x6b4430, 0x8a2f2a);
  neighbour(11.82, 19.6, 8.2, [190, 170, 150], 0x24365e, 0x24365e);
  for (const [x0, x1, h, tone] of [[-34, -20.82, 7, [140, 70, 56]], [19.62, 34, 9.4, [160, 84, 62]]]) { const nb = new THREE.MeshStandardMaterial({...TEX.brick([1, 1], tone), envMapIntensity: .5});
    wbox(x1 - x0, h, D, nb, (x0 + x1) / 2, h / 2, -D / 2, 1.9, 1.3); box(x1 - x0 + .3, .3, .5, cope, (x0 + x1) / 2, h + .1, -.05); }

  // ---------- the sidewalk: lamps, trees, planters, a bench, the chalkboard ----------
  for (const x of [-6.6, 6.6]) { cyl(.11, .14, .5, cope, x, .25, 3.85); cyl(.055, .07, 4.0, cope, x, 2.3, 3.85); box(.34, .06, .34, cope, x, 4.32, 3.85);
    const ln = add(new THREE.CylinderGeometry(.17, .12, .48, 6), world.glowMat(0xfff0d0, 1.6, {transparent: true, opacity: .92}), x, 4.6, 3.85); add(new THREE.ConeGeometry(.24, .2, 6), cope, x, 4.94, 3.85);
    world.lamp(x, 4.4, 3.85, 0xffe2b8, 1.2, 16); }
  const lm = new THREE.MeshStandardMaterial({map: leafCard(84, 30), alphaTest: .45, side: THREE.DoubleSide, roughness: .85, envMapIntensity: .5}), cards = [];
  const bark = new THREE.MeshStandardMaterial({...TEX.bark(), envMapIntensity: .3});
  for (const [x, s] of [[-9.6, 1], [9.8, 1.1], [-24, 1.05], [24.5, .95]]) { cyl(.1 * s, .16 * s, 3.4 * s, bark, x, 1.7 * s, 3.3); box(1.1, .02, 1.1, cope, x, .01, 3.3);
    for (let k = 0; k < 130; k++) { const u = rnd() * 2 - 1, t = rnd() * 6.28, rr = Math.cbrt(rnd()) * 1.9 * s, q = Math.sqrt(1 - u * u); cards.push([x + Math.cos(t) * q * rr, 4.4 * s + u * rr * .75, 3.3 + Math.sin(t) * q * rr, s * (1.0 + rnd() * .6), rnd() * 3, rnd() * 3, rnd() * 3, .24 + rnd() * .06, .3 + rnd() * .12]); } }
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), lm, cards.length); leaves.castShadow = true;
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: lm.map, alphaTest: .45});
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); cards.forEach(([x, y, z, sc, a, b, cc, h, l], i) => { q.setFromEuler(new THREE.Euler(a, b, cc)); m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sc, sc, sc)); leaves.setMatrixAt(i, m); leaves.setColorAt(i, c.setHSL(h, .45, l)); }); }
  blk.add(leaves);
  // planters by the door: dark pots, clipped boxwood
  const box_ = new THREE.MeshStandardMaterial({color: 0x3e5b33, roughness: .9, envMapIntensity: .4}), potM = mat(0x2b2d30, .5);
  for (const s of [-1, 1]) { const x = s * 1.25; cyl(.26, .2, .55, potM, x, .275, .45); const bw = add(new THREE.SphereGeometry(.3, 28, 20), box_, x, .82, .45);
    const p = bw.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), k = 1 + .07 * Math.sin(X * 31 + Y * 17) * Math.cos(Z * 23 - Y * 11); p.setXYZ(i, X * k, Y * k, Z * k); } bw.geometry.computeVertexNormals(); }
  // bench in front of the neighbour
  { const g = new THREE.Group(); g.position.set(-7.9, 0, 1.6); blk.add(g); for (let i = 0; i < 3; i++) box(1.7, .04, .12, woodM, 0, .46, -.16 + i * .15, g); for (let i = 0; i < 2; i++) box(1.7, .1, .04, woodM, 0, .7 + i * .16, -.26, g);
    for (const s of [-1, 1]) { box(.05, .46, .5, cope, s * .75, .23, -.05, g); box(.05, .5, .05, cope, s * .75, .7, -.27, g); } }
  // the sidewalk chalkboard, out only while the shop is open
  const ab = new THREE.Group(); ab.position.set(-2.4, 0, 2.0); ab.rotation.y = .35; blk.add(ab);
  const cbT = chalkTex(["Come on", "in"]), cbM = new THREE.MeshStandardMaterial({map: cbT, roughness: .9});
  for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(0, 0, 0); f.rotation.x = s * .2; ab.add(f); box(.62, .9, .03, cbM, 0, .48, s * .05, f); box(.68, .04, .04, woodM, 0, .94, s * .05, f); }

  // ---------- barber pole ----------
  let pole = null;
  if (K.pole) { const pt = canvasTex(64, 256, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); for (let i = -4; i < 8; i++) { g.fillStyle = i % 2 ? "#b3241c" : "#1f3d8a"; g.beginPath(); g.moveTo(0, i * 48); g.lineTo(w, i * 48 - 64); g.lineTo(w, i * 48 - 40); g.lineTo(0, i * 48 + 24); g.fill(); } }, [1, 1]);
    const pm = new THREE.MeshStandardMaterial({map: pt, emissiveMap: pt, emissive: 0xffffff, emissiveIntensity: 0, roughness: .2});
    const x = X0 + .23; box(.12, .08, .3, brass, x, 2.6, .15); pole = add(new THREE.CylinderGeometry(.1, .1, .8, 24), pm, x, 2.0, .33); cyl(.12, .12, .1, brass, x, 2.45, .33); cyl(.12, .12, .1, brass, x, 1.55, .33);
    add(new THREE.SphereGeometry(.1, 16, 10), brass, x, 2.55, .33); world.onTick.push((t, dt) => { pt.offset.y = (pt.offset.y + dt * .35 * S.lights) % 1; }); glows.push([pm, .5]); }

  // ---------- the parked car ----------
  let car = null;
  if (second) { const {makeTruck} = await import("./garage.js"); car = makeTruck(world, {color: 0xe9e9e4, lights: false}); car.car.position.set(-14.6, 0, 6.3); car.car.rotation.y = Math.PI / 2; root.add(car.car); car.set({lights: false}); }

  // ---------- state ----------
  const S = {key: "", lights: 0, color: -1};
  paintAwn(awning ?? K.awn); S.color = awning ?? K.awn;
  function set({open = 1, lights: li = 1, awning: a = 1, door = 0, color} = {}) {
    if (color !== undefined && color !== S.color) { S.color = color; paintAwn(color); }
    const key = [open, li, a, door].map(n => (+n).toFixed(3)).join();
    if (key === S.key) return; S.key = key; S.lights = li;
    lights.forEach(([l, p]) => l.intensity = 7 * p * li); glows.forEach(([m, p]) => m.emissiveIntensity = 1.4 * p * li);
    transom.opacity = .35 + .4 * li;
    { const on = smooth(.3, .7, open); neonM.color.setScalar(mix(.35, 3.2, on)); neonM.opacity = mix(.45, 1, on); }
    hangM.map = open > .5 ? openT : closedT; hangM.needsUpdate = true;
    doorG.rotation.y = smooth(0, 1, door) * 1.35;
    ab.visible = open > .5; ab.position.y = 0; ab.scale.setScalar(Math.max(.001, smooth(.5, .8, open)));
    setAwning(clamp(a));
    world.shadows();
  }
  set();
  const exclude = (x, z) => z > -D - 1 && z < 40;
  return {root, set, exclude, signMesh, P, dims: {X0, X1, W, GH, H2, D, SX, EX, ER}};
}
