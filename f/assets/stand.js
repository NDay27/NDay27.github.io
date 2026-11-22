// Flagship drive-in kit: a freestanding walk-up ice cream stand on its own lot, all procedural.
// makeStand(world, {sign}) builds a one-storey painted-block stand with two walk-up windows behind roll-up shutters,
// a striped awning, a lit fascia sign, a giant soft-serve cone on the roof, picnic tables with umbrellas and a lot
// out front. Inside: soft-serve machines, a dipping cabinet and cone racks. Same set() contract as makeStore.
import {THREE, TEX, leafCard, signTexture, mix, clamp} from "../../harlow/assets/world.js";
import {AWN, canvasTex, stripes, hangTex, neonTex, chalkTex, hex} from "./storefront.js";

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// the stand's lot: the pad, the parking lot and the road stay clear of grass
export const standExclude = (x, z) => (Math.abs(x) < 8.2 && z > -7.6 && z < 4.8) || (Math.abs(x) < 21 && z > 4 && z < 23) || (z > 23.2 && z < 30.8);

// pictogram menu boards: a cone, a sundae and a shake over scribbled rows, no words or prices
function menuTex(seed) {
  return canvasTex(384, 448, (g, w, h) => {
    g.fillStyle = "#fbf6ee"; g.fillRect(0, 0, w, h); g.fillStyle = "#b3243a"; g.fillRect(0, 0, w, 64); g.fillRect(0, h - 14, w, 14);
    g.fillStyle = "#fbf6ee"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(20 + i * 43, 64, 13, 0, Math.PI); g.fill(); }
    const icon = (k, x, y) => { g.save(); g.translate(x, y); g.lineWidth = 5; g.lineJoin = g.lineCap = "round";
      if (k === 0) { g.fillStyle = "#d9a35a"; g.beginPath(); g.moveTo(-18, 0); g.lineTo(18, 0); g.lineTo(0, 42); g.closePath(); g.fill(); g.fillStyle = "#f3d9e0"; g.beginPath(); g.arc(0, -6, 19, Math.PI, 0); g.fill(); g.beginPath(); g.arc(0, -22, 11, Math.PI, 0); g.fill(); }
      if (k === 1) { g.fillStyle = "#e9eef0"; g.beginPath(); g.moveTo(-22, 8); g.lineTo(22, 8); g.lineTo(12, 30); g.lineTo(-12, 30); g.closePath(); g.fill(); g.fillStyle = "#7a4a2a"; g.beginPath(); g.arc(0, 6, 20, Math.PI, 0); g.fill(); g.fillStyle = "#c8323f"; g.beginPath(); g.arc(0, -18, 6, 0, 7); g.fill(); }
      if (k === 2) { g.fillStyle = "#f7c6d2"; g.beginPath(); g.moveTo(-16, -18); g.lineTo(16, -18); g.lineTo(11, 34); g.lineTo(-11, 34); g.closePath(); g.fill(); g.strokeStyle = "#2f8f86"; g.beginPath(); g.moveTo(6, -18); g.lineTo(14, -40); g.stroke(); }
      g.restore(); };
    [0, 1, 2].forEach((k, i) => icon((k + seed) % 3, 74 + i * 118, 110));
    g.strokeStyle = "#3b2f2a"; g.lineCap = "round"; let s = 7 + seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let row = 0; row < 7; row++) { const y = 196 + row * 34; g.lineWidth = 4; g.beginPath(); let x = 34; g.moveTo(x, y); while (x < 230 + r() * 50) { x += 8 + r() * 10; g.lineTo(x, y + (r() - .5) * 5); } g.stroke();
      g.beginPath(); g.moveTo(300, y); g.lineTo(346, y); g.stroke(); }
  });
}
// a waffle-cone lattice
function waffleTex() {
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#d39a52"; g.fillRect(0, 0, w, h); g.strokeStyle = "#a8692e"; g.lineWidth = 7;
    for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + h, h); g.stroke(); g.beginPath(); g.moveTo(i * 32, h); g.lineTo(i * 32 + h, 0); g.stroke(); } }, [3, 2]);
}

export async function makeStand(world, {sign = "Ice Cream", font = "Archivo", awning, word = "", second = true} = {}) {
  const {scene} = world, root = new THREE.Group(); scene.add(root);
  const blk = new THREE.Group(); blk.position.y = .16; root.add(blk);   // the stand sits on a concrete pad
  const W = 8, X0 = -W / 2, X1 = W / 2, GH = 3.1, D = 5.6, T = .24, FH = 3.85;
  const trimC = 0xb3243a, cream = 0xfbf6ee;
  const blockM = new THREE.MeshStandardMaterial({...TEX.brick([1, 1], [238, 234, 226]), envMapIntensity: .45});
  const baseM = new THREE.MeshStandardMaterial({...TEX.brick([1, 1], [178, 46, 62]), envMapIntensity: .45});
  const trim = new THREE.MeshStandardMaterial({color: trimC, roughness: .45, envMapIntensity: .7});
  const creamM = new THREE.MeshStandardMaterial({color: cream, roughness: .5, envMapIntensity: .6});
  const cope = new THREE.MeshStandardMaterial({color: 0x26292d, metalness: .5, roughness: .5, envMapIntensity: .8});
  const glass = new THREE.MeshPhysicalMaterial({color: 0xffffff, roughness: .03, metalness: 0, transparent: true, opacity: .1, envMapIntensity: 1.6, depthWrite: false});
  const dark = new THREE.MeshStandardMaterial({color: 0x1b1d20, roughness: .6});
  const steel = new THREE.MeshStandardMaterial({color: 0xc3c8cc, metalness: .85, roughness: .3, envMapIntensity: .9});
  const woodM = new THREE.MeshStandardMaterial({color: 0x8a5d3b, roughness: .6, envMapIntensity: .25});
  const wallM = new THREE.MeshStandardMaterial({...TEX.plaster([2, 2], [250, 248, 244]), envMapIntensity: .1});
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = blk, layer) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (layer) m.userData.layer = layer; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent, layer) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent, layer);
  const cyl = (r0, r1, h, mat, x, y, z, parent, seg = 18) => add(new THREE.CylinderGeometry(r0, r1, h, seg), mat, x, y, z, parent);
  const wbox = (w, h, d, mat, x, y, z, U, V, layer, parent = blk) => { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); const X = p.getX(i) + x, Y = p.getY(i) + y, Z = p.getZ(i) + z; uv.setXY(i, (ax > .5 ? Z : X) / U, (ay > .5 ? Z : Y) / V); }
    return add(g, mat, x, y, z, parent, layer); };
  const flat = (w, d, mat, x, y, z, parent = blk) => { const m = add(new THREE.PlaneGeometry(w, d), mat, x, y, z, parent); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; };
  const mat = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: m, envMapIntensity: .6});
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lights = [], glows = [];
  const lamp = (x, y, z, p = 1, dist = 9, color = 0xffd3a0) => { const l = new THREE.PointLight(color, 0, dist, 1.6); l.position.set(x, y, z); blk.add(l); lights.push([l, p]); return l; };
  const glow = (color, p = 1, o = {}) => { const m = new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 0, roughness: .3, ...o}); glows.push([m, p]); return m; };
  const blockBox = (w, h, d, x, y, z, m = blockM, layer = "wall") => wbox(w, h, d, m, x, y, z, 3.2, 3.2, layer);

  // ---------- the pad, the lot and the road ----------
  const conc = new THREE.MeshStandardMaterial({...TEX.concrete([1, 1]), envMapIntensity: .5});
  wbox(16, .16, 12.2, conc, 0, -.08, -1.5, 2.2, 2.2, "ground").castShadow = false;
  const asph = new THREE.MeshStandardMaterial({...TEX.asphalt([8, 4]), envMapIntensity: .5});
  { const m = add(new THREE.PlaneGeometry(42, 19), asph, 0, .01, 13.9, root, "ground"); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  { const rd = new THREE.MeshStandardMaterial({...TEX.asphalt([20, 2]), envMapIntensity: .5}); const m = add(new THREE.PlaneGeometry(160, 7.6), rd, 0, .012, 27, root); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  const paint = new THREE.MeshStandardMaterial({color: 0xe9e5d8, roughness: .8}), yel = new THREE.MeshStandardMaterial({color: 0xd9a520, roughness: .7});
  for (const z of [26.88, 27.12]) { const m = add(new THREE.PlaneGeometry(160, .1), yel, 0, .016, z, root); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  for (const zc of [8.4, 17.6]) for (let i = -6; i <= 6; i++) { if (zc < 10 && Math.abs(i) < 2) continue; const m = add(new THREE.PlaneGeometry(.1, 4.6), paint, i * 2.9, .016, zc, root); m.rotation.x = -Math.PI / 2; m.rotation.z = .35; m.castShadow = false; }
  box(16, .18, .2, new THREE.MeshStandardMaterial({color: 0xd8d0bf, roughness: .8}), 0, -.07, 4.5, blk, "ground");

  // ---------- the stand: painted block, a red base band, two walk-up windows and a door ----------
  const BH = 1.0, WY0 = 1.02, WY1 = 2.3, WX = [-1.65, 1.65], WW = 1.6, DW = 1.0, DH = 2.3;
  const segs = [[X0, -2.45], [-.85, -.5], [.5, .85], [2.45, X1]];
  for (const [a, b] of segs) blockBox(b - a, WY1 - BH, T, (a + b) / 2, (BH + WY1) / 2, -T / 2);
  for (const [a, b] of [[X0, -.5], [.5, X1]]) blockBox(b - a, BH, T, (a + b) / 2, BH / 2, -T / 2, baseM, "porch");
  blockBox(W, GH - WY1, T, 0, (WY1 + GH) / 2, -T / 2);
  for (const s of [-1, 1]) { blockBox(T, GH, D - T, s * (W / 2 - T / 2), GH / 2, -(D + T) / 2 + T / 2); blockBox(T, BH, D - T, s * (W / 2 - T / 2 + .005), BH / 2, -(D + T) / 2 + T / 2, baseM, "porch"); }
  blockBox(W, GH, T, 0, GH / 2, -D + T / 2);
  box(W + .3, .22, D + .3, cope, 0, GH + .11, -D / 2 + .05, blk, "roof");
  // fascia across the front with the lit sign, a cap and two gooseneck lamps
  box(W + .3, FH - GH + .2, .3, trim, 0, (GH + FH) / 2, .1, blk, "trim"); box(W + .44, .1, .42, creamM, 0, FH + .05, .1, blk, "trim");
  const signT = await signTexture(sign, null, {fg: "#b3243a", bg: "#fbf6ee", font, w: 3072, h: 256, upper: true});
  const signM = new THREE.MeshStandardMaterial({map: signT, emissiveMap: signT, emissive: 0xffffff, emissiveIntensity: .06, roughness: .5}); world.glow.push([signM, .14]);
  const signMesh = box(W - .5, .6, .04, signM, 0, (GH + FH) / 2 + .02, .27, blk, "roof");
  for (const x of [-2.6, 2.6]) { add(new THREE.SphereGeometry(.05, 10, 8), world.glowMat(0xffe7bf, 1.0), x, FH + .02, .62); box(.03, .03, .4, cope, x, FH + .1, .42); world.lamp(x, FH + .1, 1.5, 0xffd7a3, .22, 6); }
  // walk-up windows: trim frames, a steel ledge, two sliding panes, a roll-up shutter in its housing
  const panes = [], shutters = [];
  const shutT = new THREE.MeshStandardMaterial({...TEX.metal([1, 6], [196, 200, 204]), metalness: .6, roughness: .45, envMapIntensity: .8});
  for (const x of WX) {
    for (const s of [-1, 1]) box(.08, WY1 - WY0 + .1, .3, trim, x + s * (WW / 2 + .04), (WY0 + WY1) / 2, -.05, blk, "trim");
    box(WW + .16, .08, .3, trim, x, WY1 + .04, -.05, blk, "trim");
    box(WW + .3, .05, .5, steel, x, WY0 - .02, .05, blk, "porch"); for (const s of [-1, 1]) { const b = box(.04, .3, .04, steel, x + s * .6, WY0 - .17, .2); b.rotation.x = .7; }
    for (const k of [0, 1]) { const pg = new THREE.Group(); pg.position.set(x + (k ? WW / 4 : -WW / 4), (WY0 + WY1) / 2, -.1 - k * .05); blk.add(pg);
      const gl = add(new THREE.PlaneGeometry(WW / 2 - .08, WY1 - WY0 - .08), glass, 0, 0, 0, pg); gl.castShadow = false;
      box(WW / 2, .04, .04, trim, 0, (WY1 - WY0) / 2 - .02, 0, pg); box(WW / 2, .04, .04, trim, 0, -(WY1 - WY0) / 2 + .02, 0, pg); box(.04, WY1 - WY0, .04, trim, (k ? -1 : 1) * (WW / 4 - .02), 0, 0, pg);
      panes.push([pg, k ? 1 : -1, pg.position.x]); }
    box(WW + .2, .26, .32, creamM, x, WY1 + .2, .02, blk, "trim");
    const sh = new THREE.Group(); sh.position.set(x, WY1 + .08, .1); blk.add(sh); const sp = new THREE.PlaneGeometry(WW, 1); sp.translate(0, -.5, 0);
    const m = add(sp, shutT, 0, 0, 0, sh, "open"); m.castShadow = false; box(WW, .05, .04, cope, 0, -1, 0, sh); shutters.push([m, sh.children[1]]);
    const lb = add(new THREE.PlaneGeometry(.7, .16), new THREE.MeshStandardMaterial({map: canvasTex(256, 64, (g, w, h) => { g.fillStyle = "#fbf6ee"; g.fillRect(0, 0, w, h); g.fillStyle = "#b3243a"; g.font = "800 40px Archivo, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(x < 0 ? "ORDER" : "PICK UP", w / 2, h / 2 + 2); }), roughness: .5}), x, WY1 + .2, .185, blk);
    lb.castShadow = false; }
  // menu boards on the outer piers, lit from inside
  for (const [x, k] of [[-3.22, 0], [3.22, 1]]) { box(1.22, 1.42, .1, trim, x, 1.68, .05, blk, "trim"); const mm = new THREE.MeshStandardMaterial({map: menuTex(k), emissiveMap: menuTex(k), emissive: 0xffffff, emissiveIntensity: 0, roughness: .5}); glows.push([mm, .35]);
    add(new THREE.PlaneGeometry(1.1, 1.3), mm, x, 1.68, .105, blk).castShadow = false; }
  // the door: steel frame, glass, the open/closed card
  for (const s of [-1, 1]) box(.06, DH, T + .04, trim, s * (DW / 2 + .03), DH / 2, -T / 2, blk, "porch");
  box(DW + .12, .08, T + .04, trim, 0, DH + .04, -T / 2, blk, "porch");
  const doorG = new THREE.Group(); doorG.position.set(-DW / 2, 0, -.04); blk.add(doorG);
  box(DW, .3, .05, trim, DW / 2, .15, 0, doorG, "trim"); box(DW, .1, .05, trim, DW / 2, DH - .05, 0, doorG, "trim"); for (const x of [.05, DW - .05]) box(.1, DH, .05, trim, x, DH / 2, 0, doorG, "trim");
  add(new THREE.PlaneGeometry(DW - .2, DH - .4), glass, DW / 2, DH / 2 + .1, 0, doorG).castShadow = false; box(.04, .04, .4, steel, DW - .14, 1.05, .05, doorG);
  const openT = hangTex(true), closedT = hangTex(false), hangM = new THREE.MeshStandardMaterial({map: closedT, roughness: .6});
  add(new THREE.PlaneGeometry(.4, .2), hangM, DW / 2, 1.7, .03, doorG).castShadow = false;
  const neonM = new THREE.MeshBasicMaterial({map: neonTex(), transparent: true, depthWrite: false});
  add(new THREE.PlaneGeometry(.7, .35), neonM, WX[1] + .35, WY1 - .32, -.3).castShadow = false;
  if (word) { const dt = canvasTex(1024, 256, (g, w, h) => { g.textAlign = "center"; g.textBaseline = "middle"; g.font = `italic 600 132px ${font}, Georgia, serif`;
      const gr = g.createLinearGradient(0, 40, 0, 210); gr.addColorStop(0, "#f7e2a0"); gr.addColorStop(.5, "#c99a3c"); gr.addColorStop(1, "#f2d78a");
      g.lineWidth = 10; g.strokeStyle = "rgba(30,20,10,.75)"; g.strokeText(word, w / 2, h / 2); g.fillStyle = gr; g.fillText(word, w / 2, h / 2); });
    add(new THREE.PlaneGeometry(1.4, .35), new THREE.MeshStandardMaterial({map: dt, transparent: true, metalness: .6, roughness: .3, depthWrite: false}), WX[0], WY1 - .3, -.3).castShadow = false; }
  // a round cone badge on the side wall that faces the road in
  { const bt = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#b3243a"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = "#fbf6ee"; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 108, 0, 7); g.stroke();
      g.fillStyle = "#d9a35a"; g.beginPath(); g.moveTo(92, 128); g.lineTo(164, 128); g.lineTo(128, 214); g.closePath(); g.fill(); g.fillStyle = "#fbf6ee"; for (const [y, r] of [[118, 40], [86, 28], [62, 16]]) { g.beginPath(); g.ellipse(128, y, r, r * .62, 0, 0, 7); g.fill(); } });
    const b = add(new THREE.CircleGeometry(.75, 40), new THREE.MeshStandardMaterial({map: bt, roughness: .5}), X0 - .01, 2.0, -2.6); b.rotation.y = -Math.PI / 2; b.castShadow = false; }

  // ---------- the giant soft-serve cone on the roof ----------
  { const cg = new THREE.Group(); cg.position.set(2.45, GH + .22, -2.6); blk.add(cg); box(.9, .2, .9, cope, 0, .1, 0, cg, "roof"); cyl(.07, .07, .9, cope, 0, .65, 0, cg, 10);
    const wm = new THREE.MeshStandardMaterial({map: waffleTex(), roughness: .7, envMapIntensity: .4}); const cone = add(new THREE.ConeGeometry(.55, 1.6, 28, 1, true), wm, 0, 1.9, 0, cg); cone.rotation.x = Math.PI;
    // an eight-sided stand-in, never drawn, gives the line drawing the cone's outline
    { const gh = add(new THREE.ConeGeometry(.55, 1.6, 8, 1, true), new THREE.MeshBasicMaterial({visible: false}), 0, 1.9, 0, cg, "roof"); gh.rotation.set(Math.PI, Math.PI / 8, 0); gh.castShadow = gh.receiveShadow = false; }
    add(new THREE.CylinderGeometry(.58, .55, .08, 28), mat(0xc58a46, .6), 0, 2.72, 0, cg);
    const ice = new THREE.MeshStandardMaterial({color: 0xfdf8ee, roughness: .35, envMapIntensity: .7});
    const sw = [[.58, .2, 2.86], [.47, .19, 3.16], [.35, .17, 3.42], [.22, .14, 3.63]];
    sw.forEach(([R, r, y]) => { const t = add(new THREE.TorusGeometry(R - r * .4, r, 14, 36), ice, 0, y, 0, cg, "roof"); t.rotation.x = Math.PI / 2; });
    const tip = add(new THREE.ConeGeometry(.16, .4, 20), ice, 0, 3.86, 0, cg); tip.rotation.z = .25;
    const sp = new THREE.SpotLight(0xfff1d6, 0, 9, .5, .6, 1.4); sp.position.set(0, 0, 3); sp.target.position.set(0, 2.9, 0); cg.add(sp); cg.add(sp.target); lights.push([sp, 2.2]); }

  // ---------- the awning over the windows ----------
  const AWW = 6.0, AL = 1.35, SL = .36;
  const awT = canvasTex(1024, 64, () => {}), vaT = canvasTex(1024, 128, () => {});
  const umbT = canvasTex(512, 64, () => {});
  const paintAwn = col => { stripes(awT.image.getContext("2d"), 1024, 64, hex(col), 14, false); awT.needsUpdate = true; stripes(vaT.image.getContext("2d"), 1024, 128, hex(col), 14, true); vaT.needsUpdate = true;
    stripes(umbT.image.getContext("2d"), 512, 64, hex(col), 8, false); umbT.needsUpdate = true; };
  const awM = new THREE.MeshStandardMaterial({map: awT, roughness: .92, side: THREE.DoubleSide, envMapIntensity: .4});
  const vaM = new THREE.MeshStandardMaterial({map: vaT, roughness: .92, side: THREE.DoubleSide, alphaTest: .5, envMapIntensity: .4});
  const awG = new THREE.Group(); awG.position.set(0, WY1 + .38, .12); blk.add(awG);
  const fabG = new THREE.PlaneGeometry(AWW, 1); fabG.translate(0, -.5, 0);
  const fab = add(fabG, awM, 0, 0, 0, awG, "roof"); fab.rotation.x = -(Math.PI / 2 - SL);
  const vaG = new THREE.PlaneGeometry(AWW, .28); vaG.translate(0, -.14, 0); const val = add(vaG, vaM, 0, 0, 0, awG, "roof");
  const bar = box(AWW, .05, .05, cope, 0, 0, 0, awG);
  const roll = add(new THREE.CylinderGeometry(.09, .09, AWW + .1, 18), cope, 0, 0, -.02, awG); roll.rotation.z = Math.PI / 2;
  const arms = [-1, 1].map(s => box(.04, .04, 1, cope, s * (AWW / 2 - .15), 0, 0, awG));
  function setAwning(a) {
    const L = Math.max(.001, a * AL), fy = -Math.sin(SL) * L, fz = Math.cos(SL) * L;
    fab.scale.y = L; fab.visible = a > .01; val.position.set(0, fy, fz); val.scale.y = mix(.15, 1, smooth(0, .3, a)); bar.position.set(0, fy, fz);
    arms.forEach(m => { const ay = -.55, dy = fy - ay, len = Math.hypot(dy, fz); m.scale.z = Math.max(.01, len); m.position.set(m.position.x, ay + dy / 2, fz / 2); m.rotation.x = -Math.atan2(dy, fz); m.visible = a > .05; });
  }

  // ---------- inside: checker floor, white walls, the machines along the back, a dipping cabinet on the left ----------
  const IZ0 = -T, IZ1 = -D + T, IW = W - 2 * T;
  const fl = canvasTex(512, 512, (g, w, h) => { const n = 8, s = w / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? "#b3243a" : "#f4efe6"; g.fillRect(x * s, y * s, s, s); } }, [IW / 1.6, (D - 2 * T) / 1.6]);
  flat(IW, D - 2 * T, new THREE.MeshStandardMaterial({map: fl, roughness: .35, envMapIntensity: .3}), 0, .005, (IZ0 + IZ1) / 2);
  box(IW, GH - .05, .02, wallM, 0, GH / 2, IZ1 - .01).castShadow = false;
  for (const s of [-1, 1]) box(.02, GH, D - 2 * T, wallM, s * (IW / 2 - .01), GH / 2, (IZ0 + IZ1) / 2).castShadow = false;
  box(IW, .02, D - 2 * T, wallM, 0, GH - .01, (IZ0 + IZ1) / 2).castShadow = false;
  // tile band along the walls at counter height
  const tileT = canvasTex(256, 64, (g, w, h) => { g.fillStyle = "#e9eef0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c7d0d4"; g.lineWidth = 2; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, [IW / 2, 1]);
  { const tm = new THREE.MeshStandardMaterial({map: tileT, roughness: .25, envMapIntensity: .5}); box(IW, .7, .01, tm, 0, 1.3, IZ1 + .005).castShadow = false; }
  for (const z of [-1.6, -3.6]) { const p = box(2.8, .04, .3, glow(0xf4f7ff, 1.4), 0, GH - .04, z); p.castShadow = false; lamp(0, GH - .35, z, 1, 7.5, 0xfff4e4); }
  lamp(-2.2, 2.2, -1.0, .7, 5, 0xfff0d8); lamp(2.2, 2.2, -1.0, .7, 5, 0xfff0d8);
  const P = new THREE.Group(); blk.add(P);
  const counter = (x, z, w, d, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; P.add(g); box(w, .88, d, creamM, 0, .44, 0, g); box(w + .04, .05, d + .04, steel, 0, .905, 0, g); box(w, .1, .02, trim, 0, .78, d / 2 + .005, g); return g; };
  // back counter with two soft-serve machines, a shake mixer, cone stacks and cups
  counter(-.4, IZ1 + .38, 5.6, .7);
  const machine = (x) => { const g = new THREE.Group(); g.position.set(x, .93, IZ1 + .42); P.add(g); box(.62, .95, .62, steel, 0, .475, 0, g); box(.56, .4, .02, mat(0x9aa2a8, .3, .8), 0, .62, .315, g);
    for (const dx of [-.16, 0, .16]) { cyl(.035, .035, .12, steel, dx, .34, .36, g, 10); const h = box(.04, .22, .04, dark, dx, .52, .38, g); h.rotation.x = -.3; add(new THREE.SphereGeometry(.035, 10, 8), mat(0xb3243a, .4), dx, .64, .42, g); }
    box(.5, .03, .14, steel, 0, .1, .36, g); box(.64, .06, .64, mat(0xe9eef0, .3, .5), 0, .98, 0, g); box(.3, .08, .02, glow(0x7fd3ff, 1), 0, .85, .315, g).castShadow = false; };
  machine(-2.3); machine(-1.4);
  { const g = new THREE.Group(); g.position.set(-.45, .93, IZ1 + .4); P.add(g); box(.22, .06, .3, steel, 0, .03, 0, g); box(.08, .5, .08, steel, 0, .3, -.1, g); box(.2, .14, .26, steel, 0, .6, -.02, g); cyl(.012, .012, .22, steel, 0, .42, .05, g, 6); cyl(.06, .05, .2, steel, 0, .2, .05, g, 14); }
  { const wc = waffleTex(); wc.repeat.set(1, 1); const wm = new THREE.MeshStandardMaterial({map: wc, roughness: .7});
    for (const [x, n] of [[.2, 6], [.38, 5], [.56, 7]]) for (let k = 0; k < n; k++) { const c = add(new THREE.ConeGeometry(.05, .17, 14, 1, true), wm, x, 1.02 + k * .045, IZ1 + .35, P); c.rotation.x = Math.PI; c.castShadow = k === n - 1; }
    for (let k = 0; k < 6; k++) cyl(.055, .045, .09, mat(0xfbf6ee, .5), .85, .98 + k * .05, IZ1 + .35, P, 14); }
  box(1.6, .03, .26, woodM, 1.4, 1.75, IZ1 + .14); for (let i = 0; i < 6; i++) cyl(.05, .05, .2, mat([0xb3243a, 0x2f8f86, 0xd9a520, 0xf7c6d2, 0x7a4a2a, 0xf4efe6][i], .5), .8 + i * .24, 1.865, IZ1 + .14, P, 14);
  box(1.6, .03, .26, woodM, 1.4, 2.2, IZ1 + .14); for (let i = 0; i < 9; i++) { const c = add(new THREE.ConeGeometry(.05, .17, 12, 1, true), mat(0xd39a52, .6), .7 + i * .17, 2.305, IZ1 + .14, P); c.rotation.x = Math.PI; }
  // a sink and a dipping cabinet down the left wall, colored tubs under a glass lid
  { const dc = new THREE.Group(); dc.position.set(-IW / 2 + .45, 0, -2.2); dc.rotation.y = Math.PI / 2; P.add(dc); box(1.8, .82, .7, creamM, 0, .41, 0, dc); box(1.82, .05, .72, steel, 0, .84, 0, dc); box(1.8, .08, .02, trim, 0, .7, .36, dc);
    const cols = [0xf4e6c8, 0x6b3f26, 0xf3b8c6, 0x9fd0a8, 0xe9e2d0, 0xd9a35a, 0x5a3a2a, 0xf6d6a0, 0xc8a2c8, 0xf4efe6];
    for (let i = 0; i < 10; i++) { const x = -.68 + (i % 5) * .34, z = i < 5 ? -.14 : .14; box(.3, .02, .26, mat(cols[i], .7), x, .82, z, dc); }
    const lid = add(new THREE.PlaneGeometry(1.7, .7), glass, 0, .97, 0, dc); lid.rotation.x = -Math.PI / 2 + .25; lid.castShadow = false; }
  // inside the windows: a ledge with napkins, a register and a tip jar
  for (const x of WX) { box(WW + .1, .05, .5, steel, x, .92, -.5); box(WW + .1, .88, .04, creamM, x, .44, -.74); }
  box(.34, .14, .3, dark, WX[0] + .45, 1.02, -.5); box(.3, .02, .2, mat(0x4f5a60, .3, .5), WX[0] + .45, 1.12, -.52).rotation.x = -.4;
  box(.14, .1, .1, steel, WX[1] - .5, 1.0, -.45); cyl(.06, .06, .14, glass, WX[1] + .45, 1.02, -.45, P, 14);

  // ---------- the lot: picnic tables with umbrellas, a bin, lamp posts, trees, the chalkboard ----------
  const umbM = new THREE.MeshStandardMaterial({map: umbT, roughness: .9, side: THREE.DoubleSide, envMapIntensity: .4}), umbs = [];
  const table = (x, z, ry, umb) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; blk.add(g);
    for (let i = 0; i < 4; i++) box(1.8, .05, .16, woodM, 0, .74, -.27 + i * .18, g); for (const s of [-1, 1]) { box(1.8, .05, .26, woodM, 0, .45, s * .68, g); for (const x of [-.65, .65]) { const l = box(.07, .78, .07, woodM, x, .39, s * .25, g); l.rotation.x = s * .55; } }
    if (umb) { cyl(.025, .025, 2.3, cope, 0, 1.15, 0, g, 8); const u = new THREE.Group(); u.position.set(0, 2.25, 0); g.add(u); add(new THREE.ConeGeometry(1.25, .42, 8, 1, true), umbM, 0, 0, 0, u); umbs.push(u); } };
  table(-5.7, 1.4, .1, true); table(5.8, 1.2, -.12, true); table(-5.9, -3.2, Math.PI / 2, false); table(6.0, -3.0, Math.PI / 2 + .1, false);
  { cyl(.26, .24, .85, mat(0x2f6b4f, .5), 4.55, .425, .7, blk, 18); cyl(.28, .28, .06, mat(0x2f6b4f, .5), 4.55, .88, .7, blk, 18); }
  for (const x of [-7.4, 7.4]) { cyl(.11, .14, .5, cope, x, .25, 4.0); cyl(.055, .07, 4.2, cope, x, 2.4, 4.0); box(.34, .06, .34, cope, x, 4.52, 4.0);
    add(new THREE.CylinderGeometry(.17, .12, .48, 6), world.glowMat(0xfff0d0, 1.6, {transparent: true, opacity: .92}), x, 4.8, 4.0); add(new THREE.ConeGeometry(.24, .2, 6), cope, x, 5.14, 4.0); world.lamp(x, 4.6, 4.0, 0xffe2b8, 1.3, 16); }
  const lm = new THREE.MeshStandardMaterial({map: leafCard(84, 30), alphaTest: .45, side: THREE.DoubleSide, roughness: .85, envMapIntensity: .5}), cards = [];
  const bark = new THREE.MeshStandardMaterial({...TEX.bark(), envMapIntensity: .3});
  for (const [x, z, s] of [[-7.2, -7.4, 1.15], [6.8, -8.2, 1.25], [-12.5, 1.5, 1.05], [12.8, 2.5, 1.0], [1.5, -10.5, 1.3]]) { cyl(.11 * s, .17 * s, 3.4 * s, bark, x, 1.7 * s, z, root);
    for (let k = 0; k < 130; k++) { const u = rnd() * 2 - 1, t = rnd() * 6.28, rr = Math.cbrt(rnd()) * 2.0 * s, q = Math.sqrt(1 - u * u); cards.push([x + Math.cos(t) * q * rr, 4.4 * s + u * rr * .75, z + Math.sin(t) * q * rr, s * (1.0 + rnd() * .6), rnd() * 3, rnd() * 3, rnd() * 3, .24 + rnd() * .06, .3 + rnd() * .12]); } }
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), lm, cards.length); leaves.castShadow = true;
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: lm.map, alphaTest: .45});
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); cards.forEach(([x, y, z, sc, a, b, cc, h, l], i) => { q.setFromEuler(new THREE.Euler(a, b, cc)); m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sc, sc, sc)); leaves.setMatrixAt(i, m); leaves.setColorAt(i, c.setHSL(h, .45, l)); }); }
  root.add(leaves);
  const ab = new THREE.Group(); ab.position.set(-2.95, 0, 1.5); ab.rotation.y = .3; blk.add(ab);
  const cbM = new THREE.MeshStandardMaterial({map: chalkTex(["Come", "on by"]), roughness: .9});
  for (const s of [-1, 1]) { const f = new THREE.Group(); f.rotation.x = s * .2; ab.add(f); box(.62, .9, .03, cbM, 0, .48, s * .05, f); box(.68, .04, .04, woodM, 0, .94, s * .05, f); }

  // ---------- a car in the lot ----------
  if (second) { const {makeTruck} = await import("./garage.js"); const car = makeTruck(world, {color: 0x24394f, lights: false}); car.car.position.set(-13.2, 0, 8.6); car.car.rotation.y = .3; root.add(car.car); car.set({lights: false}); }

  // ---------- state ----------
  const S = {key: "", color: -1};
  paintAwn(awning ?? AWN.red); S.color = awning ?? AWN.red;
  function set({open = 1, lights: li = 1, awning: a = 1, door = 0, color} = {}) {
    if (color !== undefined && color !== S.color) { S.color = color; paintAwn(color); }
    const key = [open, li, a, door].map(n => (+n).toFixed(3)).join();
    if (key === S.key) return; S.key = key;
    lights.forEach(([l, p]) => l.intensity = 7 * p * li); glows.forEach(([m, p]) => m.emissiveIntensity = 1.4 * p * li);
    { const on = smooth(.3, .7, open); neonM.color.setScalar(mix(.35, 3.2, on)); neonM.opacity = mix(.45, 1, on); }
    hangM.map = open > .5 ? openT : closedT; hangM.needsUpdate = true;
    const up = smooth(.05, .6, open), drop = (WY1 - WY0 + .06) * (1 - up);
    shutters.forEach(([m, edge]) => { m.scale.y = Math.max(.001, drop); m.visible = drop > .01; edge.position.y = -drop; });
    const sl = smooth(0, 1, door); panes.forEach(([g, s, x0]) => { g.position.x = x0 - s * sl * (WW / 2 - .1) * (s > 0 ? 1 : 0); });
    doorG.rotation.y = smooth(0, 1, door) * 1.35;
    ab.visible = open > .5; ab.scale.setScalar(Math.max(.001, smooth(.5, .8, open)));
    umbs.forEach(u => { const k = Math.max(.05, smooth(.2, .8, open)); u.scale.set(k, mix(.4, 1, k), k); });
    setAwning(clamp(a));
    world.shadows();
  }
  set();
  const exclude = (x, z) => z > -D - 1 && z < 40;
  return {root, set, exclude, signMesh, P, stand: true, dims: {X0, X1, W, GH, H2: FH, D, SX: 2.45, EX: .5, ER: 0}};
}
