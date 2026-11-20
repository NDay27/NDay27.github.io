// Immersive sample tier: a real-time 3D hero per trade, built on world.js (physical sky, HDRI light, PBR textures,
// wind grass, day / golden / night, bloom + film grade). Everything is modeled in code: no stock models or photos.
// Reads #t-data for the shop's name. Trade buttons go in #scBtns, the light switch is #scTod.
import {makeWorld, THREE, TEX, leafCard, signTexture, reduce, small, hash, clamp} from "./world.js";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

const D = JSON.parse(document.getElementById("t-data").textContent);
const host = document.querySelector(".scene"), G = host.dataset.scene, VAR = host.dataset.v;
const css = getComputedStyle(document.documentElement);
const ACC = new THREE.Color(css.getPropertyValue("--acc").trim() || "#e2382b");
const ACC2 = new THREE.Color(css.getPropertyValue("--acc2").trim() || "#f5b83d");
const UP = document.body.classList.contains("up");
const PI = Math.PI;

const box = (w, h, d, r = .04) => new RoundedBoxGeometry(w, h, d, 2, Math.max(.001, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)));
const STD = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .7, ...o});
const ui = document.getElementById("scBtns"), hintEl = document.getElementById("scHint");
function button(label, fn, toggle = false) {
  const b = document.createElement("button"); b.type = "button"; b.textContent = label;
  if (toggle) b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", () => { if (toggle) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); fn(b); if (hintEl) hintEl.style.opacity = 0; });
  ui.appendChild(b); return b;
}
const tweens = [];
const easeOut = t => 1 - Math.pow(1 - t, 3), easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function tween(from, to, ms, set, ease = easeOut) { if (reduce) { set(to); return; } tweens.push({t0: performance.now(), from, to, ms, set, ease}); }
const lerp = (a, b, t) => a + (b - a) * t;

let W; // the world
const mesh = (...a) => W.mesh(...a);
function withRep(t, rx, ry) { for (const k of ["map", "normalMap", "roughnessMap"]) { t[k] = t[k].clone(); t[k].repeat.set(rx, ry); t[k].needsUpdate = true; } return t; }
// extruded wall with openings; uvs are in meters, so textures get repeat = 1 / tile size
function wall(w, h, holes, mat, depth = .3) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  for (const [x0, y0, x1, y1] of holes) { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false}); g.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
}
async function sign(text, sub, w, o = {}) {
  const tex = await signTexture(text, sub, {bg: o.bg ?? "#15171c", fg: o.fg ?? "#ffffff", upper: UP});
  const m = W.glowMat(0xffffff, o.p ?? .45, {map: tex, emissiveMap: tex, roughness: .45, metalness: 0});
  return mesh(new THREE.PlaneGeometry(w, w / 4), m, 0, 0, 0, o.parent ?? W.scene, false);
}
const glass = () => new THREE.MeshPhysicalMaterial({color: 0x1b2530, metalness: .1, roughness: .04, clearcoat: 1, envMapIntensity: 1.6});
function winGlass(p = .5) { return W.glowMat(0xffc27a, p * .55, {color: 0x1a232c, metalness: .3, roughness: .06}); }
const lum = c => c.r * .299 + c.g * .587 + c.b * .114, onAcc = lum(ACC) > .55 ? "#15171c" : "#ffffff";

// ---------------------------------------------------------------- shared props
function makeCar(color, {truck = false} = {}) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({color, metalness: .55, roughness: .3, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.3});
  const s = new THREE.Shape(), wr = truck ? .44 : .38, ar = wr + .06, rx = -1.4, fx = 1.38, wy = wr;
  const bot = truck ? .42 : .3, belt = truck ? 1.2 : 1.0;
  s.moveTo(-2.3, bot + .15); s.lineTo(-2.2, bot); s.lineTo(rx - ar, bot); s.absarc(rx, wy, ar, PI, 0, true); s.lineTo(fx - ar, bot); s.absarc(fx, wy, ar, PI, 0, true);
  s.lineTo(2.2, bot); s.lineTo(2.34, bot + .16); s.lineTo(2.32, belt - .2); s.quadraticCurveTo(2.24, belt - .06, 1.6, belt - .04); s.lineTo(.75, belt); s.lineTo(-1.75, belt);
  s.quadraticCurveTo(-2.28, belt - .02, -2.3, belt - .2); s.lineTo(-2.3, bot + .15);
  const bg = new THREE.ExtrudeGeometry(s, {depth: 1.72, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 4, curveSegments: 20}); bg.translate(0, 0, -.86);
  const body = mesh(bg, paint, 0, 0, 0, car);
  const c = new THREE.Shape(); const back = truck ? -.45 : -1.72;
  c.moveTo(.78, belt); c.lineTo(.06, belt + .46); c.lineTo(truck ? -.25 : -.95, belt + .5); c.lineTo(back, belt + (truck ? .45 : .02)); c.lineTo(back, belt); c.lineTo(.78, belt);
  const cg = new THREE.ExtrudeGeometry(c, {depth: 1.42, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3}); cg.translate(0, 0, -.71);
  mesh(cg, glass(), 0, 0, 0, car);
  mesh(box(truck ? .62 : 1.0, .05, 1.46, .02), paint, truck ? -.12 : -.42, belt + .52, 0, car); // roof skin
  mesh(box(.12, .5, 1.5, .03), paint, truck ? -.4 : -.35, belt + .24, 0, car); // pillar
  const tire = new THREE.TorusGeometry(wr - .1, .12, 12, 28), rimG = new THREE.CylinderGeometry(wr - .14, wr - .14, .2, 24); rimG.rotateX(PI / 2);
  const tm = STD(0x141518, {roughness: .85}), rm = STD(0xc8ccd2, {metalness: 1, roughness: .25}), wheels = [];
  for (const [x, z] of [[rx, .86], [fx, .86], [rx, -.86], [fx, -.86]]) {
    const w = new THREE.Group(); w.position.set(x, wy, z); car.add(w); wheels.push(w);
    mesh(tire, tm, 0, 0, 0, w); mesh(rimG, rm, 0, 0, 0, w);
    for (let i = 0; i < 5; i++) { const sp = mesh(new THREE.BoxGeometry(.05, wr - .16, .05), STD(0x8a8f96, {metalness: 1, roughness: .35}), 0, 0, z > 0 ? .1 : -.1, w); sp.rotation.z = i / 5 * PI * 2; sp.geometry.translate(0, (wr - .16) / 2, 0); }
  }
  const head = W.glowMat(0xfff6e0, .6, {color: 0xf2f4f6, roughness: .1}), tail = W.glowMat(0xff2a1a, .35, {color: 0x7a0a08});
  for (const z of [.6, -.6]) { mesh(box(.08, .16, .42, .04), head, 2.33, belt - .3, z, car, false); mesh(box(.08, .14, .4, .04), tail, -2.32, belt - .3, z, car, false); }
  mesh(box(.1, .14, 1.3, .04), STD(0x18191c, {roughness: .4}), 2.36, bot + .18, 0, car); // grille / bumper
  return {car, paint, body, wheels, belt};
}

let leafTex = null;
const leafG = new THREE.PlaneGeometry(1.25, 1.25);
function leafMat(h0 = 85) {
  leafTex ??= leafCard(h0);
  const m = new THREE.MeshStandardMaterial({map: leafTex, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, envMapIntensity: .6});
  m.userData.depth = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: .45});
  return m;
}
function cluster(n, r, mat, parent, x = 0, y = 0, z = 0, sq = .8) {
  const im = new THREE.InstancedMesh(leafG, mat, n); im.customDepthMaterial = mat.userData.depth; im.castShadow = im.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * PI * 2, u = Math.random() * 2 - 1, rr = Math.cbrt(Math.random()) * r, k = Math.sqrt(1 - u * u);
    e.set(Math.random() * PI, Math.random() * PI, Math.random() * PI); q.setFromEuler(e); const sc = .75 + Math.random() * .6;
    m4.compose(new THREE.Vector3(Math.cos(a) * k * rr, u * rr * sq, Math.sin(a) * k * rr), q, new THREE.Vector3(sc, sc, sc)); im.setMatrixAt(i, m4);
    c.setHSL(.24 + Math.random() * .05, .3, .55 + Math.random() * .3); im.setColorAt(i, c);
  }
  im.position.set(x, y, z); parent.add(im); return im;
}
const barkT = () => { const t = TEX.bark(); return STD(0xffffff, {...t, roughness: 1}); };
function makeTree(x, z, s = 1, n = 9, mat) {
  const tree = new THREE.Group(); tree.position.set(x, 0, z); W.scene.add(tree);
  const bark = makeTree.bark ??= barkT(), lm = mat || (makeTree.lm ??= leafMat());
  const th = 4.4 * s; mesh(new THREE.CylinderGeometry(.2 * s, .42 * s, th, 12), bark, 0, th / 2, 0, tree);
  const branches = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * PI * 2 + hash(i * 7) * .6, y = th * (.5 + hash(i, 3) * .42), len = (1.5 + hash(i, 9) * 1.1) * s;
    const br = new THREE.Group(); br.position.set(0, y, 0); br.rotation.y = a; tree.add(br);
    const arm = new THREE.Group(); arm.rotation.z = -.95 + hash(i, 5) * .35; br.add(arm);
    mesh(new THREE.CylinderGeometry(.05 * s, .12 * s, len, 7), bark, 0, len / 2, 0, arm);
    cluster(Math.round(26 * s), (.95 + hash(i, 11) * .35) * s, lm, arm, 0, len + .1, 0);
    branches.push({br, arm, v: new THREE.Vector3(), w: new THREE.Vector3(), fall: false});
  }
  cluster(Math.round(70 * s), 1.9 * s, lm, tree, 0, th + .9 * s, 0, .75);
  return {tree, branches};
}

function makeHouse({x = 0, z = 0, ry = 0, w = 9, d = 7, h = 3.1, siding, tone = [228, 224, 214], roof = [62, 60, 66], snowRoof = false, door = 0x6e2a20, glow = .5} = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; W.scene.add(g);
  const sm = siding || STD(0xffffff, {...withRep(TEX.siding([1, 1], tone), w / 2.2, h / 2.2), roughness: .75});
  const walls = mesh(new THREE.BoxGeometry(w, h, d), sm, 0, h / 2, 0, g);
  const rise = Math.min(2.4, w * .26), hs = w / 2 + .45, L = Math.hypot(hs, rise), ang = Math.atan2(rise, hs);
  const rm = snowRoof ? STD(0xffffff, {...TEX.snow(), roughness: .6}) : STD(0xffffff, {...withRep(TEX.shingle([1, 1], roof), L / 1.6, (d + 1) / 1.6), roughness: .9});
  for (const sx of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(L, .14, d + 1), rm, sx * hs / 2, h + rise / 2 + .05, 0, g); r.rotation.z = -sx * ang; }
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rise); tri.lineTo(-w / 2, 0);
  const gg = new THREE.ExtrudeGeometry(tri, {depth: d, bevelEnabled: false}); gg.translate(0, 0, -d / 2); mesh(gg, sm, 0, h, 0, g);
  const trim = STD(0xf4f2ec, {roughness: .5}), wg = winGlass(glow), wins = [];
  const addWin = (wx, wy, ww = 1.15, wh = 1.35, face = 1) => {
    const zz = face * (d / 2 + .04);
    mesh(box(ww + .22, wh + .22, .1, .02), trim, wx, wy, zz, g); wins.push(mesh(new THREE.BoxGeometry(ww, wh, .1), wg, wx, wy, zz + face * .02, g));
    mesh(new THREE.BoxGeometry(.05, wh, .06), trim, wx, wy, zz + face * .07, g); mesh(new THREE.BoxGeometry(ww, .05, .06), trim, wx, wy, zz + face * .07, g);
    mesh(box(ww + .4, .08, .22, .02), trim, wx, wy - wh / 2 - .14, zz + face * .06, g);
  };
  addWin(-w * .3, h * .55); addWin(w * .3, h * .55); addWin(0, h + rise * .38, .8, .8); addWin(-w * .25, h * .55, 1.15, 1.35, -1); addWin(w * .25, h * .55, 1.15, 1.35, -1);
  mesh(box(1.02, 2.12, .14, .03), trim, 0, 1.06, d / 2 + .04, g); mesh(box(.9, 2.02, .12, .02), STD(door, {roughness: .45}), 0, 1.03, d / 2 + .09, g);
  mesh(new THREE.SphereGeometry(.04, 10, 8), STD(0xd9b45a, {metalness: 1, roughness: .3}), .32, 1.0, d / 2 + .17, g);
  mesh(box(2.2, .18, 1.1, .03), STD(0xffffff, {...TEX.concrete([1, 1]), roughness: .9}), 0, .09, d / 2 + .55, g);
  mesh(new THREE.BoxGeometry(.8, 1.8, .8), STD(0xffffff, {...withRep(TEX.brick([1, 1]), .5, 1.2), roughness: .9}), w * .28, h + rise * .7, -d * .15, g);
  const pl = W.lamp(0, 2.4, d / 2 + .6, 0xffc98a, .45, 7); g.add(pl); pl.position.set(0, 2.4, d / 2 + .6);
  mesh(new THREE.SphereGeometry(.07, 12, 10), W.glowMat(0xffd9a0, .4), .7, 2.25, d / 2 + .14, g, false);
  return {g, walls, sm, rise, wins};
}
function yardSign(x, z, ry, sub) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; W.scene.add(g);
  const post = STD(0xf2f2f2, {roughness: .5});
  mesh(new THREE.BoxGeometry(.08, 1.25, .08), post, -.72, .62, 0, g); mesh(new THREE.BoxGeometry(.08, 1.25, .08), post, .72, .62, 0, g);
  mesh(new THREE.BoxGeometry(1.6, .06, .06), post, 0, 1.2, 0, g);
  sign(D.short, sub, 1.44, {parent: g, bg: "#" + ACC.getHexString(), fg: onAcc, p: .35}).then(m => { m.position.set(0, .98, .045); const b = m.clone(); b.rotation.y = PI; b.position.z = -.045; g.add(b); });
  return g;
}
function shrub(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); W.scene.add(g); cluster(Math.round(16 * s), .55 * s, makeTree.lm ??= leafMat(), g, 0, .45 * s, 0, .7); return g; }
function bgTree(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = hash(x * 13 | 0, z * 7 | 0) * 6; W.scene.add(g); const lm = makeTree.lm ??= leafMat();
  mesh(new THREE.CylinderGeometry(.16 * s, .3 * s, 3.2 * s, 8), makeTree.bark ??= barkT(), 0, 1.6 * s, 0, g);
  cluster(Math.round(34 * s), 1.6 * s, lm, g, 0, 3.6 * s, 0, .8); cluster(Math.round(22 * s), 1.2 * s, lm, g, .9 * s, 2.9 * s, .5 * s, .8); cluster(Math.round(22 * s), 1.2 * s, lm, g, -.8 * s, 3 * s, -.6 * s, .8);
  return g;
}
// a loose tree line behind the subject, like the edge of a yard or a town block
function treeLine(n, r0, r1, a0 = -2.4, a1 = -.7) {
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + hash(i, 41) * .8) / n, r = r0 + hash(i, 17) * (r1 - r0); bgTree(Math.cos(a) * r, Math.sin(a) * r, .9 + hash(i, 5) * .6); }
}
function fence(x0, x1, z, y = 0) {
  const m = STD(0x6b5440, {roughness: .9}), n = Math.round((x1 - x0) / 2.4);
  for (let i = 0; i <= n; i++) mesh(box(.12, 1.1, .12, .02), m, x0 + i * (x1 - x0) / n, .55 + y, z);
  for (const h of [.45, .9]) mesh(box(x1 - x0, .08, .05, .02), m, (x0 + x1) / 2, h + y, z);
}
function streetLamp(x, z) {
  const m = STD(0x2a2d31, {metalness: .8, roughness: .4});
  mesh(new THREE.CylinderGeometry(.07, .1, 4.6, 10), m, x, 2.3, z); mesh(box(.5, .14, .3, .05), m, x, 4.6, z);
  mesh(box(.36, .05, .22, .02), W.glowMat(0xffe2b0, 1.6), x, 4.52, z, W.scene, false); W.lamp(x, 4.3, z, 0xffc98a, 1.4, 16);
}
function fall(list, dt) {
  for (const b of list) {
    if (!b.fall) continue;
    b.v.y -= 9.8 * dt; b.arm.position.addScaledVector(b.v, dt); b.arm.rotation.x += b.w.x * dt; b.arm.rotation.z += b.w.z * dt;
    if (b.arm.position.y < .3) { b.arm.position.y = .3; b.v.set(0, 0, 0); b.w.set(0, 0, 0); }
  }
}

// ---------------------------------------------------------------- auto: the shop, the lift, the car
async function buildAuto() {
  const inLot = (x, z) => (Math.abs(x) < 15 && z > -2.4 && z < 13.2) || (Math.abs(x) < 9.5 && z > -13.5 && z <= -2.4);
  W = await makeWorld({exclude: inLot, cam: {pos: [15, 6.2, 22], target: [-.5, 2.8, -3.5], minD: 12, maxD: 38, minAz: -.95, maxAz: 1.1}, tod: .55, grassH: .7});
  treeLine(14, 26, 42);
  const S = W.scene;
  const lot = mesh(new THREE.PlaneGeometry(30, 15), STD(0xffffff, {...TEX.asphalt([6, 3]), roughness: .9}), 0, .012, 5.5); lot.rotation.x = -PI / 2; lot.castShadow = false;
  const paintM = STD(0xf2f0ea, {roughness: .6});
  for (let i = 0; i < 4; i++) { const l = mesh(new THREE.PlaneGeometry(.12, 4.6), paintM, 6.5 + i * 2.7, .02, 8.5, S, false); l.rotation.x = -PI / 2; }
  // building: brick front with two open bays
  const bw = 18, bh = 6.2, bd = 11, fz = -2;
  const brick = STD(0xffffff, {...withRep(TEX.brick([1, 1], [150, 74, 56]), 1 / 2.4, 1 / 1.2), roughness: .85});
  const front = wall(bw, bh, [[-7.4, 0, -2.6, 4.4], [-1.2, 0, 3.6, 4.4], [4.9, 1.2, 7.6, 3.2]], brick, .35); front.position.set(0, 0, fz); S.add(front);
  const side = STD(0xffffff, {...withRep(TEX.metal([1, 1], [168, 172, 176]), 1 / 1.2, 1 / 3), roughness: .5, metalness: .4});
  mesh(new THREE.BoxGeometry(.3, bh, bd), side, -bw / 2 + .15, bh / 2, fz - bd / 2); mesh(new THREE.BoxGeometry(.3, bh, bd), side, bw / 2 - .15, bh / 2, fz - bd / 2);
  mesh(new THREE.BoxGeometry(bw, .3, bd), side, 0, bh, fz - bd / 2); mesh(new THREE.BoxGeometry(bw, bh, .3), STD(0xcfcbc3, {roughness: .9}), 0, bh / 2, fz - bd);
  mesh(box(bw + .4, .45, .7, .05), STD(0x2b2e33, {metalness: .6, roughness: .4}), 0, bh + .05, fz + .1); // parapet cap
  const floor = mesh(new THREE.PlaneGeometry(bw - .6, bd), STD(0xffffff, {...TEX.concrete([3, 2]), roughness: .55}), 0, .02, fz - bd / 2); floor.rotation.x = -PI / 2;
  // office window glass + glow
  mesh(new THREE.BoxGeometry(2.7, 2, .08), winGlass(.6), 6.25, 2.2, fz);
  // interior work lights: always on
  for (const x of [-5, 1.2]) { mesh(box(2.6, .08, .4, .03), W.glowMat(0xeef4ff, 2), x, bh - .4, fz - 4, S, false); const l = new THREE.PointLight(0xe9f0ff, 26, 13, 1.6); l.position.set(x, bh - 1, fz - 3.5); S.add(l); }
  // bay doors (roll-up): bay 1 open, bay 2 closed
  const doorM = STD(0xffffff, {...withRep(TEX.metal([1, 1], [196, 200, 204]), 1, 1 / .35), roughness: .45, metalness: .5});
  doorM.map.rotation = doorM.normalMap.rotation = doorM.roughnessMap.rotation = PI / 2;
  const doors = [-5, 1.2].map(x => { const d = mesh(new THREE.BoxGeometry(4.8, 4.4, .12), doorM, x, 2.2, fz - .25); d.userData.x = x; return d; });
  let open2 = 0; const setDoor = (d, v) => { d.scale.y = 1 - v * .92; d.position.y = 4.4 - (4.4 * d.scale.y) / 2; W.shadows(); };
  setDoor(doors[0], 1); setDoor(doors[1], 0);
  // the sign: shop name, lit at night
  const sg = await sign(D.short, D.town + ", " + (D.st || "IL"), 8.4, {p: .5}); sg.position.set(-1.3, 5.3, fz + .19);
  // lift + car in bay 1
  const liftM = STD(ACC, {roughness: .45, metalness: .35});
  for (const x of [-7.5, -2.5]) { mesh(box(.42, 4.4, .42, .05), liftM, x, 2.2, fz - 4.8); mesh(box(.8, .1, .8, .02), STD(0x333333), x, .05, fz - 4.8); }
  const arms = new THREE.Group(); S.add(arms); arms.position.set(-5, 0, fz - 4.8); arms.rotation.y = -PI / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const a = mesh(box(1.6, .1, .14, .03), STD(0x3a3d42, {metalness: .6, roughness: .4}), sx * 1.6, .32, sz * .8, arms); a.rotation.y = sz * sx * .25; }
  const A = makeCar(ACC2.clone().multiplyScalar(.9).getHex()); A.car.position.set(-5, .02, fz - 4.8); A.car.rotation.y = -PI / 2; S.add(A.car);
  const hood = new THREE.Group(); hood.position.set(.8, A.belt - .02, 0); A.car.add(hood);
  const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.lineTo(1.4, -.06); hs.lineTo(1.45, -.12); hs.lineTo(0, -.06);
  const hg = new THREE.ExtrudeGeometry(hs, {depth: 1.66, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2}); hg.translate(0, 0, -.83);
  mesh(hg, A.paint, 0, .08, 0, hood);
  const engine = new THREE.Group(); engine.position.set(1.55, A.belt - .06, 0); A.car.add(engine); engine.visible = false;
  mesh(box(.9, .2, 1.1, .06), STD(0x3a3e44, {metalness: .7, roughness: .4}), 0, 0, 0, engine); mesh(new THREE.CylinderGeometry(.12, .12, .1, 16), STD(ACC2, {roughness: .4}), -.2, .1, .3, engine); mesh(box(.5, .08, .3, .03), STD(0x1c1d20), .15, .1, -.25, engine);
  // parked car on the lot, tool chest, tire stack
  const P = makeCar(0x2b3e57); P.car.position.set(9.2, .02, 8.6); P.car.rotation.y = PI / 2; S.add(P.car);
  mesh(box(1.5, 1.7, .7, .05), STD(0xc62e2e, {roughness: .35, metalness: .3}), -8.2, .85, fz - 9.5);
  for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(.3, .13, 10, 24), STD(0x141518, {roughness: .9}), 4.2, .14 + i * .27, fz - 9.2).rotation.x = PI / 2;
  streetLamp(-12.5, 6); streetLamp(12.5, 2);
  makeTree(-19, -6, 1.1, 7); makeTree(19, -9, 1.2, 7); bgTree(-21, 8, 1);
  let up = 0, hoodOpen = 0;
  button("Raise the lift", b => { const to = up ? 0 : 1; tween(up, to, 1800, v => { up = v; A.car.position.y = .02 + v * 1.7; arms.position.y = v * 1.7; W.shadows(); }, easeIO); b.textContent = to ? "Lower the lift" : "Raise the lift"; b.classList.toggle("hot", !!to); });
  button("Pop the hood", b => { const to = hoodOpen ? 0 : 1; engine.visible = true; tween(hoodOpen, to, 1000, v => { hoodOpen = v; hood.rotation.z = v * 1.05; W.shadows(); }); b.textContent = to ? "Close the hood" : "Pop the hood"; });
  button("Open bay 2", b => { const to = open2 ? 0 : 1; tween(open2, to, 1600, v => { open2 = v; setDoor(doors[1], v); }, easeIO); b.textContent = to ? "Close bay 2" : "Open bay 2"; });
}

// ---------------------------------------------------------------- tree: the house, the big tree, the storm
async function buildTree() {
  W = await makeWorld({exclude: (x, z) => Math.abs(x - 7) < 5 && Math.abs(z + 6) < 4.6, cam: {pos: [11, 5, 22], target: [2.4, 3.4, -2], minD: 12, maxD: 36, minAz: -.9, maxAz: 1}, tod: .55, grassH: .55});
  treeLine(16, 24, 40); fence(-14, 14, -13);
  makeHouse({x: 7, z: -6, w: 9, d: 7});
  const T = makeTree(.6, -.5, 1.4, 11); T.tree.rotation.y = .4;
  bgTree(-16, -12, 1.1); bgTree(18, -14, 1.3); bgTree(-24, 4, 1); shrub(3, -2.2, 1); shrub(11.2, -2.2, .9);
  yardSign(5.4, 4.4, -.35, "Tree service · " + D.town);
  // rain: streaks that only fall during the storm
  const RN = small ? 900 : 2200, rp = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) { const x = (Math.random() - .5) * 40, y = Math.random() * 18, z = (Math.random() - .5) * 30; rp.set([x, y, z, x + .06, y - .5, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({color: 0xbfd4e8, transparent: true, opacity: 0})); W.scene.add(rain);
  let storm = 0, stormT = 0, n = 0;
  W.onTod.push(() => { if (stormT > 0) { W.sun.intensity *= 1 - stormT * .75; W.hemi.intensity *= 1 - stormT * .3; W.cloudU.cov.value -= stormT * .32; W.cloudU.amt.value = Math.min(1, W.cloudU.amt.value + stormT * .2); W.cloudU.lit.value.lerp(new THREE.Color(0x7d8794), stormT * .8); } });
  const trim = button("Trim a branch", b => {
    const br = T.branches.find(x => !x.fall); if (!br) return;
    br.fall = true; W.scene.attach(br.arm); br.v.set((Math.random() - .5) * 1.2, .8, 1 + Math.random()); br.w.set(Math.random() * 2, 0, Math.random() * 2 + 1);
    n++; b.textContent = n >= T.branches.length ? "All trimmed" : `Trim a branch (${T.branches.length - n} left)`; W.shadows();
  });
  button("Storm", b => { storm = b.getAttribute("aria-pressed") === "true" ? 1 : 0; }, true);
  button("Start over", () => {
    T.branches.forEach(b => { if (b.fall) { b.br.attach(b.arm); b.arm.position.set(0, 0, 0); b.arm.rotation.set(0, 0, -.9); b.fall = false; } });
    n = 0; trim.textContent = "Trim a branch"; W.shadows();
  });
  W.onTick.push((t, dt) => {
    if (Math.abs(storm - stormT) > .001) { stormT += (storm - stormT) * Math.min(1, dt * 1.5); W.grassU.wind.value = 1 + stormT * 2.4; W.refresh(); }
    const s = Math.sin(t * (1 + stormT * 1.8)) * (.012 + stormT * .045);
    T.tree.rotation.z = s; T.tree.rotation.x = s * .4;
    rain.material.opacity = stormT * .55;
    if (stormT > .01 && !reduce) { const p = rg.attributes.position.array; for (let i = 0; i < RN; i++) { let y = p[i * 6 + 1] - dt * 22; if (y < 0) y += 18; p[i * 6 + 1] = y; p[i * 6 + 4] = y - .5; } rg.attributes.position.needsUpdate = true; }
    fall(T.branches, dt); if (T.branches.some(b => b.fall && b.v.y !== 0)) W.shadows();
  });
}

// ---------------------------------------------------------------- lawn: a real mown lawn (and the snow variant)
async function buildLawn() {
  if (VAR === "snow") return buildSnow();
  const X0 = -9, X1 = 9, Z0 = -1.2, Z1 = 10;
  const inLawn = (x, z) => x > X0 - .2 && x < X1 + .2 && z > Z0 - .2 && z < Z1 + .2;
  W = await makeWorld({exclude: (x, z) => inLawn(x, z) || (Math.abs(x) < 6 && z < -1 && z > -10), cam: {pos: [11, 6.5, 22], target: [0, 1.6, 0], minD: 12, maxD: 36, minAz: -.9, maxAz: 1.1}, tod: .55, grassH: .5, grassN: .6});
  treeLine(14, 24, 40); fence(-13, 13, -12);
  makeHouse({x: 0, z: -5.6, w: 10, d: 7, tone: [236, 230, 214], roof: [70, 66, 64]});
  const base = mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), STD(0x3f6b2a, {roughness: 1}), 0, .01, (Z0 + Z1) / 2); base.rotation.x = -PI / 2; base.castShadow = false;
  const walk = mesh(new THREE.PlaneGeometry(1.3, Z1 - Z0 + 1), STD(0xffffff, {...TEX.concrete([1, 6]), roughness: .9}), 0, .025, (Z0 + Z1) / 2 + .5); walk.rotation.x = -PI / 2; walk.castShadow = false;
  for (const x of [-4.2, 4.2]) { const bed = mesh(new THREE.BoxGeometry(3.6, .12, 1.2), STD(0x3b2618, {roughness: 1}), x, .06, -1.6); shrub(x - .9, -1.6, .8); shrub(x + .9, -1.6, .9); }
  // dense lawn blades we can actually cut
  const N = reduce ? 8000 : small ? 14000 : 30000, lawn = new THREE.InstancedMesh(W.bladeG, W.bladeM, N);
  const m4 = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion(), c = new THREE.Color(), P = [], grid = new Map(), key = (x, z) => (Math.floor(x) + 50) * 1000 + Math.floor(z) + 50;
  let n = 0;
  while (n < N) {
    const x = X0 + Math.random() * (X1 - X0), z = Z0 + Math.random() * (Z1 - Z0); if (Math.abs(x) < .75) continue;
    e.set((Math.random() - .5) * .4, Math.random() * PI, (Math.random() - .5) * .4); q.setFromEuler(e); const sc = .26 + Math.random() * .22;
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, sc, 1)); lawn.setMatrixAt(n, m4);
    c.setHSL(.24 + Math.random() * .06, .42 + Math.random() * .15, .3 + Math.random() * .1); lawn.setColorAt(n, c);
    P.push({x, z, sc, q: q.clone(), cut: false, c: c.clone()}); const k = key(x, z); (grid.get(k) || grid.set(k, []).get(k)).push(n); n++;
  }
  lawn.receiveShadow = true; W.scene.add(lawn);
  yardSign(6.6, 9.4, -.4, "Lawn care · " + D.town);
  makeTree(-14, -2, 1.1, 8); bgTree(15, -6, 1.1);
  // zero-turn mower
  const mower = new THREE.Group(); W.scene.add(mower);
  const body = new THREE.MeshPhysicalMaterial({color: ACC, roughness: .35, metalness: .2, clearcoat: .8});
  mesh(box(1.5, .34, 1.15, .1), body, 0, .42, 0, mower); mesh(box(1.1, .12, 1.4, .05), STD(0x222428, {metalness: .5, roughness: .5}), .25, .2, 0, mower);
  mesh(box(.5, .55, .55, .12), STD(0x1b1c1f, {roughness: .8}), -.3, .82, 0, mower); mesh(box(.45, .1, .5, .05), STD(0x1b1c1f), -.05, .62, 0, mower);
  for (const z of [.3, -.3]) { const bar = mesh(new THREE.CylinderGeometry(.025, .025, .7), STD(0x111111), .2, .95, z, mower); bar.rotation.z = .5; }
  const wg = new THREE.CylinderGeometry(.26, .26, .2, 18); wg.rotateX(PI / 2);
  for (const [a, b] of [[-.55, .62], [-.55, -.62]]) mesh(wg, STD(0x141518, {roughness: .9}), a, .26, b, mower);
  const fg = new THREE.CylinderGeometry(.13, .13, .1, 12); fg.rotateX(PI / 2);
  for (const b of [.5, -.5]) mesh(fg, STD(0x141518), .7, .13, b, mower);
  const clipN = 220, cp = new Float32Array(clipN * 3), cv = []; for (let i = 0; i < clipN; i++) { cp[i * 3 + 1] = -5; cv.push([0, 0, 0, 0]); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.BufferAttribute(cp, 3));
  W.scene.add(new THREE.Points(cg, new THREE.PointsMaterial({color: 0x6f9a3c, size: .05})));
  const lanes = [], LW = 1.05; for (let z = Z0 + .5, i = 0; z < Z1; z += LW, i++) lanes.push(i % 2 ? [X1 - .4, z, X0 + .4, z] : [X0 + .4, z, X1 - .4, z]);
  let li = 0, k = 0, going = false, ci = 0, mown = 0;
  const place = () => { const [ax, az, bx, bz] = lanes[li]; mower.position.set(lerp(ax, bx, k), 0, lerp(az, bz, k)); mower.rotation.y = bx > ax ? 0 : PI; };
  place();
  const go = button("Mow the yard", b => { going = !going; b.textContent = going ? "Pause" : "Keep mowing"; b.classList.toggle("hot", going); });
  button("Start over", () => {
    for (let i = 0; i < P.length; i++) { const p = P[i]; if (!p.cut) continue; p.cut = false; m4.compose(new THREE.Vector3(p.x, 0, p.z), p.q, new THREE.Vector3(1, p.sc, 1)); lawn.setMatrixAt(i, m4); lawn.setColorAt(i, p.c); }
    lawn.instanceMatrix.needsUpdate = lawn.instanceColor.needsUpdate = true; li = 0; k = 0; going = false; mown = 0; place(); go.textContent = "Mow the yard"; go.classList.remove("hot");
  });
  const v3 = new THREE.Vector3(), one = new THREE.Vector3();
  W.onTick.push((t, dt) => {
    for (let i = 0; i < clipN; i++) { const p = cv[i]; if (p[3] <= 0) continue; p[3] -= dt; cp[i * 3] += p[0] * dt; cp[i * 3 + 1] = Math.max(.02, cp[i * 3 + 1] + p[1] * dt); cp[i * 3 + 2] += p[2] * dt; p[1] -= 6 * dt; if (p[3] <= 0) cp[i * 3 + 1] = -5; }
    cg.attributes.position.needsUpdate = true;
    if (!going) return;
    const [ax, az, bx, bz] = lanes[li]; k += dt * 2.6 / Math.abs(bx - ax);
    if (k >= 1) { k = 0; li++; if (li >= lanes.length) { li = lanes.length - 1; k = 1; going = false; go.textContent = "All mowed"; go.classList.remove("hot"); return; } }
    place(); W.shadows(); const mx = mower.position.x, mz = mower.position.z;
    let changed = false;
    for (let gx = Math.floor(mx - 1); gx <= Math.floor(mx + 1); gx++) for (let gz = Math.floor(mz - 1); gz <= Math.floor(mz + 1); gz++) {
      const cell = grid.get(key(gx, gz)); if (!cell) continue;
      for (const i of cell) { const p = P[i]; if (p.cut || Math.abs(p.x - mx) > .55 || Math.abs(p.z - mz) > LW / 2 + .02) continue;
        p.cut = true; changed = true; mown++; v3.set(p.x, 0, p.z); one.set(1, p.sc * .42, 1); m4.compose(v3, p.q, one); lawn.setMatrixAt(i, m4);
        c.copy(p.c).offsetHSL(0, .02, li % 2 ? -.05 : .07); lawn.setColorAt(i, c);
        if (Math.random() < .05) { const j = ci++ % clipN; cp[j * 3] = p.x; cp[j * 3 + 1] = .3; cp[j * 3 + 2] = p.z - .6; cv[j] = [(Math.random() - .5) * 1.2, 1.5 + Math.random(), -1 - Math.random(), .7]; } }
    }
    if (changed) lawn.instanceMatrix.needsUpdate = lawn.instanceColor.needsUpdate = true;
  });
}

async function buildSnow() {
  W = await makeWorld({ground: "snow", cam: {pos: [13, 6.5, 21], target: [1, 1.8, 0], minD: 12, maxD: 36, minAz: -.9, maxAz: 1.1}, tod: .55});
  makeHouse({x: -2, z: -6, w: 10, d: 7, snowRoof: true, tone: [180, 70, 56]});
  // the drive: concrete under a real snow layer we push off
  const dx = 4.5, dz0 = -2.6, dz1 = 12, dw = 3.6;
  const drv = mesh(new THREE.PlaneGeometry(dw, dz1 - dz0), STD(0xffffff, {...TEX.concrete([1, 4]), roughness: .7}), dx, .015, (dz0 + dz1) / 2); drv.rotation.x = -PI / 2; drv.castShadow = false;
  mesh(new THREE.BoxGeometry(4.2, 3, 4), STD(0xffffff, {...withRep(TEX.siding([1, 1], [180, 70, 56]), 2, 1.4), roughness: .75}), dx, 1.5, -4.5);
  mesh(new THREE.BoxGeometry(3.4, 2.5, .1), STD(0xffffff, {...withRep(TEX.metal([1, 1], [230, 230, 228]), 1, 1 / .4), roughness: .5}), dx, 1.25, -2.48);
  const SX = 36, SZ = 120, sgeo = new THREE.PlaneGeometry(dw + .2, dz1 - dz0, SX, SZ); sgeo.rotateX(-PI / 2);
  const sp = sgeo.attributes.position, sh = new Float32Array(sp.count);
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i), edge = Math.min(1, (dw / 2 + .1 - Math.abs(x)) * 4); sh[i] = (.16 + Math.sin(x * 3 + z * .7) * .02 + Math.sin(z * 2.3) * .015) * edge; sp.setY(i, sh[i]); }
  sgeo.computeVertexNormals();
  const snowM = STD(0xffffff, {roughness: .55, envMapIntensity: .8}), cover = mesh(sgeo, snowM, dx, .02, (dz0 + dz1) / 2);
  makeTree(-15, -4, 1, 7, (() => { const m = leafMat(); m.color.set(0x6c7c70); return m; })());
  const pine = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); W.scene.add(g); const m = STD(0x23402c, {roughness: .9});
    mesh(new THREE.CylinderGeometry(.12 * s, .18 * s, 1 * s), STD(0x4a3426), 0, .5 * s, 0, g);
    for (let i = 0; i < 4; i++) { mesh(new THREE.ConeGeometry((1.5 - i * .3) * s, 1.6 * s, 10), m, 0, (1.2 + i * .9) * s, 0, g); mesh(new THREE.ConeGeometry((1.3 - i * .28) * s, .5 * s, 10), STD(0xf4f7fa, {roughness: .6}), 0, (1.75 + i * .9) * s, 0, g); } };
  pine(-9, 1, 1); pine(13, -5, 1.2); pine(16, 4, .9); pine(-20, -12, 1.4); pine(22, -16, 1.3);
  yardSign(-.8, 9, -.3, "Snow removal · " + D.town);
  streetLamp(8.6, 11);
  const T = makeCar(0x23324a, {truck: true}); T.car.rotation.y = PI / 2; W.scene.add(T.car);
  const bgeo = new THREE.CylinderGeometry(.9, .9, 2.9, 24, 1, true, -.9, 1.8); bgeo.rotateX(PI / 2); bgeo.rotateZ(PI / 2);
  mesh(bgeo, STD(ACC2, {roughness: .4, metalness: .3, side: THREE.DoubleSide}), 1.85, .66, 0, T.car); mesh(box(.5, .12, .12, .03), STD(0x222222, {metalness: .6}), 2.45, .66, 0, T.car);
  const beacon = mesh(box(.3, .12, .2, .04), W.glowMat(0xffa21a, 2), -.1, T.belt + .62, 0, T.car, false);
  // snowfall
  const FN = small ? 1200 : 3000, fp = new Float32Array(FN * 3); for (let i = 0; i < FN; i++) { fp[i * 3] = (Math.random() - .5) * 50; fp[i * 3 + 1] = Math.random() * 16; fp[i * 3 + 2] = (Math.random() - .5) * 40; }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute("position", new THREE.BufferAttribute(fp, 3));
  W.scene.add(new THREE.Points(fgeo, new THREE.PointsMaterial({color: 0xffffff, size: .07, transparent: true, opacity: .85, depthWrite: false})));
  let pz = dz1 + 3, going = false;
  const place = () => { T.car.position.set(dx, 0, pz); };
  place();
  const go = button("Plow the drive", b => { going = !going; b.textContent = going ? "Pause" : "Keep plowing"; b.classList.toggle("hot", going); });
  button("Fresh snow", () => { for (let i = 0; i < sp.count; i++) sp.setY(i, sh[i]); sgeo.computeVertexNormals(); sp.needsUpdate = true; pz = dz1 + 3; going = false; place(); go.textContent = "Plow the drive"; go.classList.remove("hot"); W.shadows(); });
  let nf = 0;
  W.onTick.push((t, dt) => {
    if (!reduce) { for (let i = 0; i < FN; i++) { let y = fp[i * 3 + 1] - dt * 1.4; if (y < 0) y += 16; fp[i * 3 + 1] = y; fp[i * 3] += Math.sin(t + i) * dt * .2; } fgeo.attributes.position.needsUpdate = true; }
    beacon.rotation.y += dt * 6;
    if (!going) return;
    pz -= dt * 2.4; if (pz < dz0 + 1.2) { pz = dz0 + 1.2; going = false; go.textContent = "All clear"; go.classList.remove("hot"); }
    place(); W.shadows(); const bladeZ = pz - 2.7 - (dz0 + dz1) / 2; let ch = false;
    for (let i = 0; i < sp.count; i++) { const z = sp.getZ(i); if (z > bladeZ && sp.getY(i) > .004) { const x = sp.getX(i), side = Math.abs(x) > dw / 2 - .05; sp.setY(i, side ? Math.min(.4, sp.getY(i) + .004) : .002); ch = true; } }
    if (ch) { sp.needsUpdate = true; if (++nf % 6 === 0) { sgeo.computeVertexNormals(); W.shadows(); } }
  });
}

// ---------------------------------------------------------------- painting: repaint the house, wet edge sweeping up
async function buildPainting() {
  W = await makeWorld({exclude: (x, z) => Math.abs(x) < 6.5 && z < 4.4 && z > -5.6, cam: {pos: [12, 5, 20], target: [0, 2.8, -1], minD: 12, maxD: 34, minAz: -.9, maxAz: 1.1}, tod: .55, grassH: .55});
  treeLine(14, 24, 40); fence(-13, 13, -11);
  const sm = STD(0xffffff, {...withRep(TEX.siding([1, 1], [250, 250, 250]), 10 / 2.2, 3.4 / 2.2), roughness: .7});
  const U = {uOld: {value: new THREE.Color(0xe6e1d6)}, uNew: {value: new THREE.Color(0xe6e1d6)}, uP: {value: -1}};
  sm.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = "varying float vWy;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vWy=(modelMatrix*vec4(transformed,1.)).y;");
    sh.fragmentShader = "uniform vec3 uOld,uNew;uniform float uP;varying float vWy;\n" + sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n float pk=1.-smoothstep(uP-.06,uP+.06,vWy);vec3 pc=mix(uOld,uNew,pk);float wet=(1.-smoothstep(0.,.35,abs(vWy-uP)))*step(0.,uP);diffuseColor.rgb*=pc*(1.+wet*.25);"); };
  sm.customProgramCacheKey = () => "paint-sweep";
  const H = makeHouse({x: 0, z: -1.5, w: 10, d: 7, h: 3.4, siding: sm, roof: [52, 54, 60]});
  // porch with columns
  const trim = STD(0xf4f2ec, {roughness: .5});
  mesh(box(4.4, .3, 2.2, .04), STD(0xffffff, {...TEX.wood([2, 1]), roughness: .6}), 0, .15, 3.1);
  for (const x of [-2, 2]) mesh(new THREE.CylinderGeometry(.1, .12, 2.8, 14), trim, x, 1.7, 4);
  const pr = mesh(box(4.8, .14, 2.6, .03), STD(0x3a3d44, {roughness: .8}), 0, 3.15, 3); pr.rotation.x = -.12;
  // ladder, cans, drop cloth
  const lad = new THREE.Group(); lad.position.set(-3.7, 0, 2.4); lad.rotation.x = -.2; W.scene.add(lad);
  const al = STD(0xc9ced4, {metalness: .9, roughness: .35}); for (const x of [-.28, .28]) mesh(box(.07, 3.8, .1, .02), al, x, 1.9, 0, lad);
  for (let i = 0; i < 9; i++) mesh(new THREE.CylinderGeometry(.025, .025, .56, 8), al, 0, .3 + i * .4, 0, lad).rotation.z = PI / 2;
  const cloth = mesh(new THREE.PlaneGeometry(3.2, 1.6, 12, 6), STD(0xe9e3d6, {roughness: 1, side: THREE.DoubleSide}), -3.5, .03, 3); cloth.rotation.x = -PI / 2; cloth.castShadow = false;
  const cans = []; for (const [x, z] of [[-2.7, 3.3], [-3.1, 3.6]]) { mesh(new THREE.CylinderGeometry(.16, .16, .3, 20), STD(0xd7dadf, {metalness: .8, roughness: .3}), x, .17, z); cans.push(mesh(new THREE.CylinderGeometry(.15, .15, .01, 20), STD(0xe6e1d6, {roughness: .2}), x, .325, z)); }
  shrub(-4.2, 2.6, .9); shrub(4.4, 2.6, 1); shrub(5.6, 2.2, .7);
  bgTree(-12, -6, 1.2); bgTree(13, -9, 1.3);
  yardSign(5.6, 7.2, -.35, "Painting · " + D.town);
  const C = [["Harbor Blue", 0x7193b3], ["Sage", 0xa4b593], ["Clay", 0xc98b6e], ["Charcoal", 0x55595f], ["Butter", 0xf0d892], ["Classic White", 0xe6e1d6]];
  const top = 3.4 + H.rise + .2;
  for (const [name, hex] of C.slice(0, small ? 4 : 5)) {
    const b = button(name, () => {
      U.uOld.value.copy(U.uNew.value); U.uNew.value.set(hex); cans.forEach(c => c.material.color.set(hex));
      tween(-.1, top, 2600, v => { U.uP.value = v; }, easeIO); setTimeout(() => { U.uOld.value.set(hex); U.uP.value = -1; }, reduce ? 0 : 2700);
      ui.querySelectorAll("button").forEach(x => x.classList.toggle("hot", x === b));
    });
    b.style.boxShadow = `inset 0 -4px 0 #${new THREE.Color(hex).getHexString()}`;
  }
}

// ---------------------------------------------------------------- cleaning: a sunlit living room and a robot that cleans it
async function buildCleaning() {
  W = await makeWorld({outdoor: false, interior: 0x1b1a19, cam: {pos: [6.2, 4.6, 8.4], target: [-.6, 1.2, -1], minD: 7, maxD: 16, minAz: .05, maxAz: 1.15, maxPolar: PI * .42}, tod: .55});
  const S = W.scene;
  S.fog = null;
  const floor = mesh(new THREE.BoxGeometry(10.4, .12, 8.4), STD(0xffffff, {...TEX.wood([3, 3.4]), roughness: .5, envMapIntensity: .9}), 0, -.06, 0);
  const plaster = STD(0xffffff, {...withRep(TEX.plaster([1, 1], [234, 228, 218]), 1 / 3, 1 / 3), roughness: .92});
  const back = wall(10.4, 3.6, [[-1.6, .9, 1.6, 3.1]], plaster, .25); back.position.set(0, 0, -4.2); S.add(back);
  const left = wall(8.4, 3.6, [], plaster, .25); left.rotation.y = PI / 2; left.position.set(-5.2, 0, 0); S.add(left);
  const trimM = STD(0xf7f5f0, {roughness: .45});
  mesh(new THREE.BoxGeometry(10.4, .14, .06), trimM, 0, .07, -4.05); mesh(new THREE.BoxGeometry(.06, .14, 8.4), trimM, -5.05, .07, 0);
  for (const [w, h, x, y] of [[3.4, .1, 0, .85], [3.4, .1, 0, 3.15], [.1, 2.4, -1.65, 2], [.1, 2.4, 1.65, 2], [.06, 2.2, 0, 2], [3.2, .06, 0, 2.1]]) mesh(box(w, h, .16, .02), trimM, x, y, -4.18);
  mesh(box(3.6, .08, .34, .02), trimM, 0, .86, -4);
  // the view out the window, day to night
  const vc = document.createElement("canvas"); vc.width = 64; vc.height = 128; const vx = vc.getContext("2d");
  const drawView = n => { const g = vx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, n > .7 ? "#0b1222" : n > .4 ? "#f0a26a" : "#9ec6ee"); g.addColorStop(.62, n > .7 ? "#1a2238" : n > .4 ? "#ffd3a0" : "#e8f3ff"); g.addColorStop(.63, n > .7 ? "#0d1410" : "#5f7f4a"); g.addColorStop(1, n > .7 ? "#090c08" : "#3e5a32"); vx.fillStyle = g; vx.fillRect(0, 0, 64, 128); vt.needsUpdate = true; };
  const vt = new THREE.CanvasTexture(vc); vt.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshBasicMaterial({map: vt, toneMapped: true}), 0, 2, -6.5, S, false);
  drawView(.2);
  // furniture
  const fab = STD(new THREE.Color(ACC).lerp(new THREE.Color(0x5a6b74), .65), {roughness: .95}), wood = STD(0xffffff, {...TEX.wood([1, 1]), roughness: .5});
  const sofa = new THREE.Group(); sofa.position.set(-4.1, 0, .2); sofa.rotation.y = PI / 2; S.add(sofa);
  mesh(box(3.8, .45, 1.2, .12), fab, 0, .42, 0, sofa); mesh(box(3.8, .9, .32, .14), fab, 0, .85, -.48, sofa);
  for (const x of [-1.75, 1.75]) mesh(box(.32, .7, 1.2, .14), fab, x, .55, 0, sofa);
  for (const x of [-.9, .9]) mesh(box(1.7, .2, 1, .12), fab, x, .72, .06, sofa);
  mesh(box(.5, .5, .16, .1), STD(ACC2, {roughness: .95}), -1.3, .95, -.25, sofa).rotation.z = .2;
  const rc = document.createElement("canvas"); rc.width = rc.height = 256; const rx = rc.getContext("2d");
  rx.fillStyle = "#efe7d8"; rx.fillRect(0, 0, 256, 256); rx.strokeStyle = "#" + ACC.getHexString(); rx.lineWidth = 10; rx.strokeRect(14, 14, 228, 228); rx.lineWidth = 3; rx.strokeRect(34, 34, 188, 188);
  for (let i = 0; i < 4000; i++) { rx.fillStyle = `rgba(120,100,80,${Math.random() * .08})`; rx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  const rt = new THREE.CanvasTexture(rc); rt.colorSpace = THREE.SRGBColorSpace;
  const rug = mesh(new THREE.PlaneGeometry(4.6, 3.4), STD(0xffffff, {map: rt, roughness: 1}), -.6, .012, .2, S, false); rug.rotation.x = -PI / 2; rug.receiveShadow = true;
  mesh(box(1.9, .08, 1, .04), wood, -.8, .48, .2); for (const [x, z] of [[-1.6, -.2], [0, -.2], [-1.6, .6], [0, .6]]) mesh(new THREE.CylinderGeometry(.035, .03, .44, 8), STD(0x2a2420), -.8 + x * .5 + .4, .23, .2 + z * .5);
  mesh(new THREE.CylinderGeometry(.06, .1, .25, 12), STD(0xe8e4dc, {roughness: .3}), -1.1, .64, .2); mesh(new THREE.TorusGeometry(.12, .02, 8, 20), STD(0x8a6a4a), -.5, .54, .35).rotation.x = PI / 2;
  const lampG = new THREE.Group(); lampG.position.set(-4.4, 0, -3.4); S.add(lampG);
  mesh(new THREE.CylinderGeometry(.02, .02, 1.7), STD(0x2b2b2b, {metalness: .8}), 0, .85, 0, lampG); mesh(new THREE.CylinderGeometry(.24, .32, .38, 20, 1, true), W.glowMat(0xffd9a6, .6, {color: 0xf3ead8, side: THREE.DoubleSide}), 0, 1.8, 0, lampG);
  W.lamp(-4.4, 1.7, -3.4, 0xffc98a, .8, 9);
  mesh(new THREE.CylinderGeometry(.3, .24, .5, 18), STD(0xd9d2c6, {roughness: .4}), 2.6, .25, -3.4); const pl = new THREE.Group(); pl.position.set(2.6, .55, -3.4); S.add(pl); cluster(26, .55, makeTree.lm ??= leafMat(), pl, 0, .45, 0, 1.2);
  mesh(box(2.6, .9, .45, .03), wood, 3.4, .45, -3.85); mesh(new THREE.CylinderGeometry(.12, .1, .3, 16), STD(0x9fb5c4, {roughness: .2}), 2.8, 1.05, -3.85);
  const art = await sign(D.short, "Every room, top to bottom", 2.6, {bg: "#f4efe6", fg: "#" + ACC.getHexString(), p: .05}); art.position.set(-5.06, 2.2, .2); art.rotation.y = PI / 2;
  mesh(box(2.75, .76, .05, .02), STD(0x2b2522), -5.1, 2.2, .2).rotation.y = PI / 2;
  // dirt: crumbs + dust you can see, dust motes in the sunbeam
  const DN = 900, dp = new Float32Array(DN * 3), home = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { const cl = Math.random() < .6, x = cl ? -1 + (Math.random() - .5) * 3 : -3 + Math.random() * 7, z = cl ? .4 + (Math.random() - .5) * 2.4 : -3.4 + Math.random() * 6.8; dp.set([x, .02, z], i * 3); }
  home.set(dp);
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3)); S.add(new THREE.Points(dg, new THREE.PointsMaterial({color: 0x5a4a3a, size: .045})));
  const mN = 240, mp = new Float32Array(mN * 3); for (let i = 0; i < mN; i++) mp.set([(Math.random() - .5) * 3, .5 + Math.random() * 2.6, -4 + Math.random() * 5], i * 3);
  const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(mp, 3)); const motes = new THREE.PointsMaterial({color: 0xfff4dc, size: .025, transparent: true, opacity: .8, depthWrite: false}); S.add(new THREE.Points(mg, motes));
  // robot
  const bot = new THREE.Group(); S.add(bot);
  mesh(new THREE.CylinderGeometry(.34, .34, .09, 36), new THREE.MeshPhysicalMaterial({color: 0x1d1f23, roughness: .25, clearcoat: 1}), 0, .07, 0, bot);
  mesh(new THREE.CylinderGeometry(.35, .35, .05, 36), STD(0xb7bcc2, {metalness: .8, roughness: .3}), 0, .04, 0, bot);
  const ring = mesh(new THREE.TorusGeometry(.12, .012, 8, 32), W.glowMat(ACC.getHex(), 3), 0, .12, 0, bot, false); ring.rotation.x = PI / 2;
  const sp = [], sN = 80, spp = new Float32Array(sN * 3); for (let i = 0; i < sN; i++) spp[i * 3 + 1] = -5;
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(spp, 3)); S.add(new THREE.Points(sg, new THREE.PointsMaterial({color: 0xffffff, size: .07, transparent: true, opacity: .9, depthWrite: false})));
  const path = []; for (let i = 0, z = 3; z > -3.5; z -= .62, i++) path.push(i % 2 ? [4.2, z, -3, z] : [-3, z, 4.2, z]);
  let li = 0, k = 0, going = false, clean = 0, si = 0;
  bot.position.set(-3, 0, 3);
  W.onTod.push(t => { W.sun.position.set(-3, 10, -18); W.sun.target.position.set(0, 0, 0); W.sun.intensity *= 1.6; drawView(t); motes.opacity = .8 * (1 - clean) * (t > .7 ? .2 : 1); });
  const go = button("Clean it", b => { going = !going; b.textContent = going ? "Pause" : "Keep cleaning"; b.classList.toggle("hot", going); });
  button("Mess it up", () => { dp.set(home); dg.attributes.position.needsUpdate = true; li = 0; k = 0; clean = 0; going = false; bot.position.set(-3, 0, 3); go.textContent = "Clean it"; go.classList.remove("hot"); W.refresh(); });
  W.onTick.push((t, dt) => {
    if (!reduce) { for (let i = 0; i < mN; i++) { mp[i * 3 + 1] += Math.sin(t * .6 + i) * .0015; mp[i * 3] += Math.cos(t * .4 + i * 1.3) * .0012; } mg.attributes.position.needsUpdate = true; }
    for (let i = 0; i < sN; i++) if (spp[i * 3 + 1] > -1) { spp[i * 3 + 1] += dt * .5; if (spp[i * 3 + 1] > 1.1) spp[i * 3 + 1] = -5; }
    sg.attributes.position.needsUpdate = true;
    if (!going) return;
    const [ax, az, bx, bz] = path[li]; k += dt * 1.6 / Math.abs(bx - ax);
    if (k >= 1) { k = 0; li++; if (li >= path.length) { li = path.length - 1; going = false; go.textContent = "Spotless"; go.classList.remove("hot"); clean = 1; W.refresh(); return; } }
    const x = lerp(ax, bx, k), z = lerp(az, bz, k); bot.position.set(x, 0, z); W.shadows(); bot.rotation.y = bx > ax ? 0 : PI;
    let ch = false;
    for (let i = 0; i < DN; i++) { const ddx = dp[i * 3] - x, ddz = dp[i * 3 + 2] - z; if (dp[i * 3 + 1] > 0 && ddx * ddx + ddz * ddz < .14) { dp[i * 3 + 1] = -5; ch = true; if (Math.random() < .25) { const j = si++ % sN; spp.set([dp[i * 3], .12, dp[i * 3 + 2]], j * 3); } } }
    if (ch) dg.attributes.position.needsUpdate = true;
    clean = Math.min(1, (li + k) / path.length); motes.opacity = .8 * (1 - clean);
  });
}

// ---------------------------------------------------------------- sweets: the storefront and a treat you build
async function buildSweets() {
  const cone = VAR === "icecream";
  W = await makeWorld({exclude: (x, z) => z > -14 && z < 16 && Math.abs(x) < 30, cam: {pos: [10, 4.2, 16], target: [1, 2.8, -1], minD: 10, maxD: 30, minAz: -.8, maxAz: 1}, tod: .55, grassH: .6});
  treeLine(12, 30, 46);
  const S = W.scene, fz = -3;
  const walkM = STD(0xffffff, {...TEX.concrete([8, 2]), roughness: .85}); const walk = mesh(new THREE.PlaneGeometry(60, 6), walkM, 0, .1, fz + 3); walk.rotation.x = -PI / 2; walk.castShadow = false;
  mesh(new THREE.BoxGeometry(60, .2, .3), STD(0xb9b4aa, {roughness: .9}), 0, .1, fz + 6.1);
  const road = mesh(new THREE.PlaneGeometry(60, 12), STD(0xffffff, {...TEX.asphalt([10, 2]), roughness: .9}), 0, .01, fz + 12.2); road.rotation.x = -PI / 2; road.castShadow = false;
  for (let i = -6; i <= 6; i++) { const l = mesh(new THREE.PlaneGeometry(1.8, .12), STD(0xf0c84a, {roughness: .6}), i * 4.5, .02, fz + 12, S, false); l.rotation.x = -PI / 2; }
  // the shop: brick front, big window, door, awning, name sign
  const brick = STD(0xffffff, {...withRep(TEX.brick([1, 1], [160, 82, 66]), 1 / 2.4, 1 / 1.2), roughness: .85});
  const front = wall(13, 7.2, [[-5.4, .7, 1.4, 3.6], [2.2, 0, 3.8, 3.0]], brick, .4); front.position.set(0, 0, fz); S.add(front);
  for (const x of [-6.35, 6.35]) mesh(new THREE.BoxGeometry(.3, 7.2, 8), brick, x, 3.6, fz - 4.2);
  mesh(new THREE.BoxGeometry(13, .3, 8), STD(0x3a3532, {roughness: .9}), 0, 7.2, fz - 4.2); mesh(new THREE.BoxGeometry(12.4, .1, 3.4), STD(0xf6ede2, {roughness: .9}), 0, 3.9, fz - 1.6);
  mesh(box(13.3, .35, .6, .04), STD(0x2b2e33, {roughness: .5, metalness: .5}), 0, 7.3, fz + .05);
  const inside = new THREE.PointLight(0xffd6a6, 9, 10, 1.6); inside.position.set(-1.5, 2.8, fz - 1.6); S.add(inside);
  mesh(new THREE.BoxGeometry(12.4, 7, .1), STD(0xf3e1cf, {roughness: .9}), 0, 3.5, fz - 3.2);
  mesh(box(6.4, 1, .9, .04), STD(0xf6efe6, {roughness: .4}), -2, .5, fz - 1.5);
  const cols = [0xff7aa2, 0xffd39a, 0x8c5a3c, 0xbfe3c0, 0xf7f2e8, 0xc9a0dc];
  for (let r = 0; r < 3; r++) { mesh(new THREE.BoxGeometry(6, .05, .5), STD(0xffffff, {...TEX.wood([1, 1])}), -2, 1.5 + r * .7, fz - 3); for (let i = 0; i < 10; i++) mesh(i % 2 ? new THREE.SphereGeometry(.14, 14, 10) : box(.26, .3, .26, .06), STD(cols[(i + r) % 6], {roughness: .5}), -4.6 + i * .58, 1.68 + r * .7, fz - 3); }
  const pane = mesh(new THREE.BoxGeometry(6.8, 2.9, .04), new THREE.MeshPhysicalMaterial({color: 0xffffff, metalness: 0, roughness: .03, transparent: true, opacity: .18, envMapIntensity: 2}), -2, 2.15, fz + .05, S, false);
  mesh(new THREE.BoxGeometry(1.6, 3, .08), new THREE.MeshPhysicalMaterial({color: 0x2a1b14, roughness: .3, clearcoat: .6}), 3, 1.5, fz - .05);
  mesh(new THREE.BoxGeometry(1.4, 1.6, .05), winGlass(.5), 3, 1.9, fz);
  const ac = document.createElement("canvas"); ac.width = 256; ac.height = 64; const ax = ac.getContext("2d");
  for (let i = 0; i < 16; i++) { ax.fillStyle = i % 2 ? "#f6efe4" : "#" + ACC.getHexString(); ax.fillRect(i * 16, 0, 16, 64); }
  const at = new THREE.CanvasTexture(ac); at.colorSpace = THREE.SRGBColorSpace; at.wrapS = THREE.RepeatWrapping;
  const awnM = STD(0xffffff, {map: at, roughness: .95, side: THREE.DoubleSide});
  const awn = mesh(new THREE.PlaneGeometry(10, 1.6), awnM, -1.2, 3.85, fz + .72); awn.rotation.x = -PI / 2 + .55;
  const val = mesh(new THREE.PlaneGeometry(10, .32), awnM, -1.2, 3.28, fz + 1.38); val.castShadow = false;
  const band = await sign(D.short, D.town + ", " + (D.st || "IL"), 6.8, {p: .55, bg: "#1b1412"}); band.position.set(-.4, 5.35, fz + .22);
  // neighbors
  for (const [x, tone, h] of [[-11.5, [120, 112, 104], 8.4], [11.5, [176, 120, 84], 6.4]]) {
    const b = STD(0xffffff, {...withRep(TEX.brick([1, 1], tone), 1 / 2.4, 1 / 1.2), roughness: .85}); mesh(new THREE.BoxGeometry(9.8, h, 9), b, x, h / 2, fz - 4.5);
    for (let i = 0; i < 3; i++) for (let j = 0; j < (h > 7 ? 2 : 1); j++) mesh(new THREE.BoxGeometry(1.4, 1.8, .06), winGlass(.4), x - 3 + i * 3, 4.5 + j * 2.4 - (h > 7 ? 0 : .4), fz + .02);
    mesh(new THREE.BoxGeometry(7, 2.6, .06), winGlass(.25), x, 1.7, fz + .02);
  }
  streetLamp(-6.5, fz + 5.2); streetLamp(8, fz + 5.2);
  const bench = new THREE.Group(); bench.position.set(-5, 0, fz + 2.4); S.add(bench);
  const bw = STD(0xffffff, {...TEX.wood([1, 1]), roughness: .6}); mesh(box(2, .08, .5, .02), bw, 0, .5, 0, bench); mesh(box(2, .5, .06, .02), bw, 0, .8, -.24, bench);
  for (const x of [-.85, .85]) mesh(box(.06, .5, .5, .02), STD(0x23252a, {metalness: .7}), x, .25, 0, bench);
  // the treat on its plinth
  const pl = mesh(new THREE.CylinderGeometry(.75, .85, .9, 32), STD(0xffffff, {...TEX.concrete([1, 1]), roughness: .7}), 5.4, .55, fz + 2.2);
  const stack = new THREE.Group(); stack.position.set(5.4, 1.0, fz + 2.2); S.add(stack);
  const scoopC = [0xff7aa2, 0xfff1d6, 0x6e432b, 0xbfe3c0, 0xc9a0dc], flavors = ["Strawberry", "Vanilla", "Chocolate", "Mint", "Berry"];
  let items = [], base = 0;
  if (cone) {
    const wc = document.createElement("canvas"); wc.width = wc.height = 128; const wx = wc.getContext("2d"); wx.fillStyle = "#d9a15a"; wx.fillRect(0, 0, 128, 128); wx.strokeStyle = "#a86f33"; wx.lineWidth = 6;
    for (let i = -128; i < 256; i += 26) { wx.beginPath(); wx.moveTo(i, 0); wx.lineTo(i + 128, 128); wx.moveTo(i + 128, 0); wx.lineTo(i, 128); wx.stroke(); }
    const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 2);
    const cg = new THREE.ConeGeometry(.55, 1.7, 32, 1, true); cg.rotateX(PI); mesh(cg, STD(0xffffff, {map: wt, roughness: .8, side: THREE.DoubleSide}), 0, .85, 0, stack); base = 1.7;
  } else mesh(new THREE.CylinderGeometry(.95, .5, .12, 32), STD(0xf3f1ec, {metalness: .3, roughness: .2}), 0, .06, 0, stack);
  const backOut = t => { const s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; };
  const addB = button(cone ? "Add a scoop" : "Add a layer", add);
  function add() {
    if (items.length >= 4) return;
    const i = items.length; let m, y;
    if (cone) { m = mesh(new THREE.SphereGeometry(.6 - i * .03, 32, 24), STD(scoopC[i], {roughness: .75}), 0, 0, 0, stack); m.scale.y = .86; y = base + .25 + i * .82; }
    else { const r = .9 - i * .15, hh = .42; m = mesh(new THREE.CylinderGeometry(r, r, hh, 48), STD(scoopC[(i + 1) % 5], {roughness: .55}), 0, 0, 0, stack); mesh(new THREE.TorusGeometry(r, .045, 8, 48), STD(0xfffaf2, {roughness: .3}), 0, hh / 2, 0, m).rotation.x = PI / 2; y = .12 + hh / 2 + i * hh; }
    items.push(m); tween(y + 3, y, 750, v => { m.position.y = v; W.shadows(); }, backOut);
    addB.textContent = items.length >= 4 ? "That's plenty" : (cone ? `Add a scoop (${flavors[items.length]})` : "Add a layer");
  }
  button("Start over", () => { items.forEach(m => stack.remove(m)); items = []; addB.textContent = cone ? "Add a scoop (Strawberry)" : "Add a layer"; W.shadows(); });
  add(); if (!cone) add();
  W.onTick.push(t => { stack.rotation.y = reduce ? 0 : t * .25; });
}

// ---------------------------------------------------------------- mixed groups: a main-street shop and one hands-on prop each
async function storefront({tone = [160, 82, 66], awn = ACC, signBg = "#1b1412", sub, goods} = {}) {
  W = await makeWorld({exclude: (x, z) => z > -14 && z < 16 && Math.abs(x) < 30, cam: {pos: [10, 4.2, 16], target: [1, 2.8, -1], minD: 10, maxD: 30, minAz: -.8, maxAz: 1}, tod: .55, grassH: .6});
  treeLine(12, 30, 46);
  const S = W.scene, fz = -3;
  const walk = mesh(new THREE.PlaneGeometry(60, 6), STD(0xffffff, {...TEX.concrete([8, 2]), roughness: .85}), 0, .1, fz + 3); walk.rotation.x = -PI / 2; walk.castShadow = false;
  mesh(new THREE.BoxGeometry(60, .2, .3), STD(0xb9b4aa, {roughness: .9}), 0, .1, fz + 6.1);
  const road = mesh(new THREE.PlaneGeometry(60, 12), STD(0xffffff, {...TEX.asphalt([10, 2]), roughness: .9}), 0, .01, fz + 12.2); road.rotation.x = -PI / 2; road.castShadow = false;
  for (let i = -6; i <= 6; i++) { const l = mesh(new THREE.PlaneGeometry(1.8, .12), STD(0xf0c84a, {roughness: .6}), i * 4.5, .02, fz + 12, S, false); l.rotation.x = -PI / 2; }
  const brick = STD(0xffffff, {...withRep(TEX.brick([1, 1], tone), 1 / 2.4, 1 / 1.2), roughness: .85});
  const front = wall(13, 7.2, [[-5.4, .7, 1.4, 3.6], [2.2, 0, 3.8, 3.0]], brick, .4); front.position.set(0, 0, fz); S.add(front);
  for (const x of [-6.35, 6.35]) mesh(new THREE.BoxGeometry(.3, 7.2, 8), brick, x, 3.6, fz - 4.2);
  mesh(new THREE.BoxGeometry(13, .3, 8), STD(0x3a3532, {roughness: .9}), 0, 7.2, fz - 4.2); mesh(new THREE.BoxGeometry(12.4, .1, 3.4), STD(0xf6ede2, {roughness: .9}), 0, 3.9, fz - 1.6);
  mesh(box(13.3, .35, .6, .04), STD(0x2b2e33, {roughness: .5, metalness: .5}), 0, 7.3, fz + .05);
  const inside = new THREE.PointLight(0xffd6a6, 9, 10, 1.6); inside.position.set(-1.5, 2.8, fz - 1.6); S.add(inside);
  mesh(new THREE.BoxGeometry(12.4, 7, .1), STD(0xf3e1cf, {roughness: .9}), 0, 3.5, fz - 3.2);
  if (goods) goods(fz);
  mesh(new THREE.BoxGeometry(6.8, 2.9, .04), new THREE.MeshPhysicalMaterial({color: 0xffffff, metalness: 0, roughness: .03, transparent: true, opacity: .18, envMapIntensity: 2}), -2, 2.15, fz + .05, S, false);
  mesh(new THREE.BoxGeometry(1.6, 3, .08), new THREE.MeshPhysicalMaterial({color: 0x2a1b14, roughness: .3, clearcoat: .6}), 3, 1.5, fz - .05);
  mesh(new THREE.BoxGeometry(1.4, 1.6, .05), winGlass(.5), 3, 1.9, fz);
  const ac = document.createElement("canvas"); ac.width = 256; ac.height = 64; const ax = ac.getContext("2d"), ah = "#" + new THREE.Color(awn).getHexString();
  for (let i = 0; i < 16; i++) { ax.fillStyle = i % 2 ? "#f6efe4" : ah; ax.fillRect(i * 16, 0, 16, 64); }
  const at = new THREE.CanvasTexture(ac); at.colorSpace = THREE.SRGBColorSpace;
  const awnM = STD(0xffffff, {map: at, roughness: .95, side: THREE.DoubleSide});
  const aw = mesh(new THREE.PlaneGeometry(10, 1.6), awnM, -1.2, 3.85, fz + .72); aw.rotation.x = -PI / 2 + .55;
  mesh(new THREE.PlaneGeometry(10, .32), awnM, -1.2, 3.28, fz + 1.38).castShadow = false;
  const band = await sign(D.short, sub || (D.town + ", " + (D.st || "IL")), 6.8, {p: .55, bg: signBg}); band.position.set(-.4, 5.35, fz + .22);
  for (const [x, tn, h] of [[-11.5, [120, 112, 104], 8.4], [11.5, [176, 120, 84], 6.4]]) {
    const b = STD(0xffffff, {...withRep(TEX.brick([1, 1], tn), 1 / 2.4, 1 / 1.2), roughness: .85}); mesh(new THREE.BoxGeometry(9.8, h, 9), b, x, h / 2, fz - 4.5);
    for (let i = 0; i < 3; i++) for (let j = 0; j < (h > 7 ? 2 : 1); j++) mesh(new THREE.BoxGeometry(1.4, 1.8, .06), winGlass(.4), x - 3 + i * 3, 4.5 + j * 2.4 - (h > 7 ? 0 : .4), fz + .02);
    mesh(new THREE.BoxGeometry(7, 2.6, .06), winGlass(.25), x, 1.7, fz + .02);
  }
  streetLamp(-6.5, fz + 5.2); streetLamp(8, fz + 5.2);
  const pl = mesh(new THREE.CylinderGeometry(.85, .95, .9, 32), STD(0xffffff, {...TEX.concrete([1, 1]), roughness: .7}), 5.4, .55, fz + 2.2);
  const hero = new THREE.Group(); hero.position.set(5.4, 1.0, fz + 2.2); hero.scale.setScalar(1.35); S.add(hero);
  return {S, fz, hero, pl};
}
const backOut = t => { const s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; };
const shelfGoods = (cols, shape) => fz => {
  for (let r = 0; r < 3; r++) { mesh(new THREE.BoxGeometry(6, .05, .5), STD(0xffffff, {...TEX.wood([1, 1])}), -2, 1.5 + r * .7, fz - 3);
    for (let i = 0; i < 10; i++) mesh(shape(i, r), STD(cols[(i + r) % cols.length], {roughness: .5}), -4.6 + i * .58, 1.68 + r * .7, fz - 3); }
};
// a stack you add to with one button, shared by food, retail and fitness
function stacker(hero, makers, label, done, again) {
  let items = [];
  const addB = button(label, () => {
    if (items.length >= makers.length) return;
    const [m, y] = makers[items.length](hero); items.push(m); tween(y + 3, y, 750, v => { m.position.y = v; W.shadows(); }, backOut);
    addB.textContent = items.length >= makers.length ? done : label;
  });
  button(again, () => { items.forEach(m => m.parent.remove(m)); items = []; addB.textContent = label; W.shadows(); });
  return addB;
}

async function buildBeauty() {
  const barber = VAR === "barber";
  const {S, fz, hero} = await storefront({tone: [196, 176, 166], awn: ACC, signBg: "#2a1f24", goods: shelfGoods([0xf3e6dd, 0xe3a08f, 0xc9b48a, 0xffffff], (i) => i % 2 ? new THREE.CylinderGeometry(.1, .12, .34, 16) : box(.18, .3, .12, .04))});
  // the chair: chrome base, hydraulic post, seat and back in the accent color
  const chrome = STD(0xdfe3e8, {metalness: 1, roughness: .18}), uph = new THREE.MeshPhysicalMaterial({color: ACC, roughness: .45, clearcoat: .6, sheen: 1, sheenColor: new THREE.Color(0xffffff)});
  mesh(new THREE.CylinderGeometry(.7, .78, .08, 40), chrome, 0, .04, 0, hero);
  const post = mesh(new THREE.CylinderGeometry(.09, .12, .7, 20), chrome, 0, .43, 0, hero);
  const seatG = new THREE.Group(); seatG.position.y = .8; hero.add(seatG);
  mesh(box(1, .22, .95, .1), uph, 0, 0, 0, seatG); mesh(box(1, 1.05, .2, .1), uph, 0, .6, -.42, seatG); mesh(box(.5, .3, .14, .07), uph, 0, 1.3, -.4, seatG);
  for (const x of [-.56, .56]) { mesh(box(.12, .1, .82, .04), chrome, x, .32, 0, seatG); mesh(new THREE.CylinderGeometry(.03, .03, .32), chrome, x, .17, .3, seatG); }
  mesh(box(.7, .06, .3, .02), chrome, 0, -.42, .62, seatG).rotation.x = -.5;
  // the mirror wall inside the window and a ring light
  const mir = mesh(new THREE.CircleGeometry(.9, 48), new THREE.MeshPhysicalMaterial({color: 0xffffff, metalness: 1, roughness: .02, envMapIntensity: 2}), -2, 2.3, fz - 3.1, S, false);
  const rl = mesh(new THREE.TorusGeometry(.98, .05, 10, 64), W.glowMat(0xfff4e6, 1.8), -2, 2.3, fz - 3.08, S, false);
  if (barber) { // the classic striped pole, turning
    const pc = document.createElement("canvas"); pc.width = 64; pc.height = 256; const px = pc.getContext("2d");
    px.fillStyle = "#fff"; px.fillRect(0, 0, 64, 256); px.lineWidth = 22; ["#d33a2c", "#2f5fa8"].forEach((c, k) => { px.strokeStyle = c; for (let y = -256 + k * 64; y < 512; y += 128) { px.beginPath(); px.moveTo(-10, y); px.lineTo(74, y + 84); px.stroke(); } });
    const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(1, 2);
    const pole = mesh(new THREE.CylinderGeometry(.17, .17, 1.6, 32), STD(0xffffff, {map: pt, roughness: .25}), 4.3, 2.2, fz + .3);
    mesh(new THREE.SphereGeometry(.21, 20, 14), chrome, 4.3, 3.08, fz + .3); mesh(new THREE.CylinderGeometry(.21, .21, .14, 20), chrome, 4.3, 1.36, fz + .3);
    W.onTick.push((t, dt) => { if (!reduce) pt.offset.y -= dt * .35; });
  }
  let up = false, spin = 0;
  const looks = [ACC.clone(), new THREE.Color(0x2b2f36), new THREE.Color(0xc9b48a), new THREE.Color(0x6e8fae), new THREE.Color(0xb5323c)];
  let li = 0;
  button("Book the chair", b => { up = !up; b.textContent = up ? "Lower the chair" : "Book the chair"; tween(seatG.position.y, up ? 1.25 : .8, 900, v => { seatG.position.y = v; post.scale.y = v / .8; post.position.y = .08 + v * .44; W.shadows(); }, backOut); spin = PI * 2; });
  button("New look", () => { li = (li + 1) % looks.length; const c0 = uph.color.clone(), c1 = looks[li]; tween(0, 1, 600, k => uph.color.copy(c0).lerp(c1, k)); });
  W.onTick.push((t, dt) => { if (spin > 0) { const d = Math.min(spin, dt * 4); spin -= d; seatG.rotation.y += d; W.shadows(); } else if (!reduce) seatG.rotation.y = Math.sin(t * .4) * .5; rl.material.emissiveIntensity = Math.max(rl.material.emissiveIntensity, .8); });
}

async function buildFood() {
  const coffee = VAR === "coffee";
  const {S, fz, hero} = await storefront({tone: [150, 86, 60], awn: ACC, signBg: "#2a1810", goods: shelfGoods([0xf3c25b, 0xf08a3c, 0x8c5a3c, 0xfff4e8], (i) => i % 3 ? new THREE.SphereGeometry(.14, 14, 10) : new THREE.CylinderGeometry(.13, .13, .3, 16))});
  // bistro table and chairs out front
  const iron = STD(0x23252a, {metalness: .7, roughness: .4});
  for (const [x, z] of [[-4.6, fz + 2.4], [-2.4, fz + 2.6]]) { mesh(new THREE.CylinderGeometry(.42, .42, .05, 28), iron, x, .78, z); mesh(new THREE.CylinderGeometry(.04, .04, .76), iron, x, .39, z); mesh(new THREE.CylinderGeometry(.24, .26, .04, 20), iron, x, .02, z);
    mesh(new THREE.CylinderGeometry(.06, .06, .14, 14), STD(0xffffff, {roughness: .2}), x + .1, .87, z); }
  mesh(new THREE.CylinderGeometry(.95, .95, .06, 48), STD(0xfaf7f2, {roughness: .25}), 0, .04, 0, hero); // the plate
  const steamN = 60, sp = new Float32Array(steamN * 3), sv = [];
  for (let i = 0; i < steamN; i++) { sp.set([(Math.random() - .5) * .6, Math.random() * 1.6, (Math.random() - .5) * .6], i * 3); sv.push(.3 + Math.random() * .4); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const pc = document.createElement("canvas"); pc.width = pc.height = 64; const pg = pc.getContext("2d"), rg = pg.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, "rgba(255,255,255,.9)"); rg.addColorStop(1, "rgba(255,255,255,0)"); pg.fillStyle = rg; pg.fillRect(0, 0, 64, 64);
  const steam = new THREE.Points(sg, new THREE.PointsMaterial({color: 0xffffff, map: new THREE.CanvasTexture(pc), size: .5, transparent: true, opacity: .0, depthWrite: false})); steam.position.y = .4; hero.add(steam);
  const M = c => STD(c, {roughness: .6});
  const makers = coffee ? [
    h => { const g = new THREE.Group(); h.add(g); const cup = mesh(new THREE.CylinderGeometry(.42, .32, .62, 36, 1, true), STD(0xffffff, {roughness: .2, side: THREE.DoubleSide}), 0, .31, 0, g); mesh(new THREE.CircleGeometry(.4, 32), M(0x6e432b), 0, .58, 0, g).rotation.x = -PI / 2; mesh(new THREE.TorusGeometry(.17, .045, 10, 24, PI * 1.2), STD(0xffffff, {roughness: .2}), .44, .32, 0, g).rotation.z = -PI * .6; return [g, .06]; },
    h => { const m = mesh(new THREE.TorusGeometry(.22, .1, 14, 28), M(0xd9a15a), -.62, 0, .3, h); m.rotation.x = PI / 2; return [m, .12]; },
    h => { const m = mesh(box(.42, .18, .3, .06), M(0xc98a4a), .55, 0, .45, h); return [m, .15]; },
    h => { const m = mesh(new THREE.SphereGeometry(.16, 18, 12), M(ACC2), -.3, 0, -.6, h); m.scale.y = .7; return [m, .16]; }] : [
    h => { const m = mesh(new THREE.SphereGeometry(.62, 32, 16, 0, PI * 2, 0, PI / 2), M(0xd9a15a), 0, 0, 0, h); m.scale.y = .45; return [m, .07]; },
    h => { const m = mesh(new THREE.CylinderGeometry(.6, .6, .14, 36), M(0x6e432b), 0, 0, 0, h); return [m, .22]; },
    h => { const m = mesh(new THREE.CylinderGeometry(.66, .64, .05, 36), M(0xf3c25b), 0, 0, 0, h); return [m, .32]; },
    h => { const m = mesh(new THREE.SphereGeometry(.6, 32, 16, 0, PI * 2, 0, PI / 2), M(0xd9a15a), 0, 0, 0, h); m.scale.y = .62; return [m, .36]; }];
  stacker(hero, makers, coffee ? "Add to the order" : "Add a course", "Order up", "Clear the plate");
  W.onTick.push((t, dt) => { steam.material.opacity = hero.children.length > 2 ? .22 : 0; if (reduce) return; for (let i = 0; i < steamN; i++) { sp[i * 3 + 1] += dt * sv[i]; sp[i * 3] += Math.sin(t + i) * dt * .05; if (sp[i * 3 + 1] > 1.8) sp[i * 3 + 1] = 0; } sg.attributes.position.needsUpdate = true; });
}

async function buildRetail() {
  const flowers = VAR === "florist";
  const {S, fz, hero} = await storefront({tone: [124, 132, 120], awn: ACC, signBg: "#1e2420", goods: shelfGoods([0xd98c9f, 0xb8c79a, 0xf7f4ec, 0xe9b44c], (i) => i % 2 ? box(.24, .3, .2, .04) : new THREE.CylinderGeometry(.1, .1, .34, 14))});
  // planters by the door
  for (const x of [1.6, 4.4]) { mesh(box(.8, .6, .8, .06), STD(0x2b2e33, {roughness: .6}), x, .4, fz + .7); const g = new THREE.Group(); g.position.set(x, .8, fz + .7); S.add(g); cluster(18, .45, makeTree.lm ??= leafMat(), g, 0, .3, 0, .9); }
  const petal = [0xe86a8a, 0xf3a9c0, 0xffffff, 0xf6c453, ACC.getHex()];
  const makers = flowers ? [0, 1, 2, 3, 4].map(i => h => { const g = new THREE.Group(); h.add(g); const a = i / 5 * PI * 2, r = i ? .32 : 0;
      mesh(new THREE.CylinderGeometry(.02, .02, 1.3), STD(0x4e8a3e), Math.cos(a) * r * .5, .65, Math.sin(a) * r * .5, g);
      for (let k = 0; k < 6; k++) { const p = mesh(new THREE.SphereGeometry(.13, 12, 8), STD(petal[i], {roughness: .6}), Math.cos(a) * r + Math.cos(k) * .12, 1.32, Math.sin(a) * r + Math.sin(k) * .12, g); p.scale.y = .5; }
      mesh(new THREE.SphereGeometry(.08, 10, 8), STD(0xffd98a), Math.cos(a) * r, 1.38, Math.sin(a) * r, g); return [g, .55]; })
    : [0, 1, 2, 3].map(i => h => { const s = .9 - i * .16, m = mesh(box(s, .44, s, .04), STD([ACC.getHex(), 0xf7f4ec, ACC2.getHex(), 0x2b2f36][i], {roughness: .5}), 0, 0, 0, h);
      mesh(new THREE.BoxGeometry(s + .01, .45, .08), STD(0xffffff, {roughness: .3}), 0, 0, 0, m); mesh(new THREE.BoxGeometry(.08, .45, s + .01), STD(0xffffff, {roughness: .3}), 0, 0, 0, m); return [m, .22 + i * .44]; });
  if (flowers) mesh(new THREE.CylinderGeometry(.42, .3, .9, 28), new THREE.MeshPhysicalMaterial({color: 0xcfe6f6, roughness: .05, transmission: .6, thickness: .3, transparent: true, opacity: .7}), 0, .45, 0, hero);
  stacker(hero, makers, flowers ? "Add a flower" : "Dress the window", flowers ? "What a bouquet" : "All wrapped up", "Start over");
  W.onTick.push(t => { if (!reduce) hero.rotation.y = t * .25; });
}

async function buildPets() {
  const {S, fz, hero} = await storefront({tone: [210, 214, 220], awn: ACC2, signBg: "#16283a", goods: shelfGoods([0xffb547, 0x6fd3c4, 0xffffff, 0xe3a857], (i) => i % 2 ? new THREE.SphereGeometry(.13, 14, 10) : box(.26, .3, .18, .05))});
  const tub = mesh(new THREE.CylinderGeometry(.95, .8, .55, 40, 1, true), STD(0xf2f6f8, {roughness: .2, metalness: .3, side: THREE.DoubleSide}), 0, .28, 0, hero);
  mesh(new THREE.TorusGeometry(.95, .06, 10, 48), STD(0xdfe3e8, {metalness: 1, roughness: .2}), 0, .55, 0, hero).rotation.x = PI / 2;
  const fur = STD(0xe3a857, {roughness: .9}), dark = STD(0xb5762f, {roughness: .9}), dog = new THREE.Group(); dog.position.y = .35; hero.add(dog);
  const body = mesh(new THREE.CapsuleGeometry(.32, .55, 8, 16), fur, 0, .3, 0, dog); body.rotation.z = PI / 2;
  const head = new THREE.Group(); head.position.set(.55, .62, 0); dog.add(head);
  mesh(new THREE.SphereGeometry(.28, 24, 18), fur, 0, 0, 0, head); mesh(new THREE.SphereGeometry(.14, 16, 12), fur, .22, -.06, 0, head);
  mesh(new THREE.SphereGeometry(.05, 10, 8), STD(0x1a1a1a, {roughness: .3}), .35, -.02, 0, head);
  for (const z of [-.12, .12]) { mesh(new THREE.SphereGeometry(.04, 10, 8), STD(0x111111, {roughness: .1}), .2, .08, z, head); const e = mesh(new THREE.SphereGeometry(.12, 12, 10), dark, -.05, .1, z * 2.1, head); e.scale.set(.6, 1.4, .4); e.rotation.x = z > 0 ? .4 : -.4; }
  const tail = new THREE.Group(); tail.position.set(-.6, .45, 0); dog.add(tail); mesh(new THREE.CapsuleGeometry(.06, .35, 6, 10), fur, 0, .2, 0, tail).rotation.z = .5;
  for (const [x, z] of [[.3, .18], [.3, -.18], [-.3, .18], [-.3, -.18]]) mesh(new THREE.CapsuleGeometry(.08, .2, 6, 10), fur, x, .02, z, dog);
  // bubbles you add with bath time
  const BN = 160, bp = new Float32Array(BN * 3); for (let i = 0; i < BN; i++) bp[i * 3 + 1] = -9;
  const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
  const bm = new THREE.PointsMaterial({color: 0xffffff, size: .14, transparent: true, opacity: .9, depthWrite: false}); hero.add(new THREE.Points(bg, bm));
  let bath = 0, fluff = 0;
  button("Bath time", () => { bath = 1; fluff = 0; for (let i = 0; i < BN; i++) { const a = Math.random() * PI * 2, r = Math.random() * .8; bp.set([Math.cos(a) * r, .5 + Math.random() * .9, Math.sin(a) * r], i * 3); } bg.attributes.position.needsUpdate = true; bm.opacity = .9; });
  button("Fluff dry", () => { bath = 0; fluff = 1; tween(1, 1.18, 700, v => { body.scale.set(v, v, v); head.scale.setScalar(v * .95); W.shadows(); }, backOut); });
  W.onTick.push((t, dt) => {
    tail.rotation.x = reduce ? 0 : Math.sin(t * 12) * .5; head.rotation.z = reduce ? 0 : Math.sin(t * 1.3) * .08;
    if (!bath && bm.opacity > 0) { bm.opacity = Math.max(0, bm.opacity - dt * .8); }
    if (bath && !reduce) { for (let i = 0; i < BN; i++) { bp[i * 3 + 1] += dt * .12; if (bp[i * 3 + 1] > 1.6) bp[i * 3 + 1] = .5; } bg.attributes.position.needsUpdate = true; }
  });
}

async function buildFitness() {
  const {S, fz, hero, pl} = await storefront({tone: [70, 74, 82], awn: ACC, signBg: "#0e0f12", goods: fz => { // dumbbell rack in the window
    const ir = STD(0x1c1d21, {metalness: .6, roughness: .4}); mesh(new THREE.BoxGeometry(6, .08, .6), ir, -2, 1.3, fz - 2.9); mesh(new THREE.BoxGeometry(6, .08, .6), ir, -2, 2.1, fz - 2.9);
    for (let i = 0; i < 8; i++) for (const y of [1.45, 2.25]) { const g = new THREE.Group(); g.position.set(-4.7 + i * .78, y, fz - 2.9); W.scene.add(g); mesh(new THREE.CylinderGeometry(.03, .03, .5), STD(0xc8ccd2, {metalness: 1}), 0, 0, 0, g).rotation.z = PI / 2; for (const x of [-.22, .22]) mesh(new THREE.CylinderGeometry(.1, .1, .1, 6), STD(i % 3 ? 0x2b2f36 : ACC.getHex(), {roughness: .5}), x, 0, 0, g).rotation.z = PI / 2; } }});
  pl.scale.set(1.6, .4, 1.6); pl.position.y = .18; hero.position.y = .4;
  const bar = new THREE.Group(); bar.position.y = .45; hero.add(bar);
  const steel = STD(0xd3d7dc, {metalness: 1, roughness: .2});
  mesh(new THREE.CylinderGeometry(.035, .035, 2.6, 16), steel, 0, 0, 0, bar).rotation.z = PI / 2;
  for (const x of [-.9, .9]) mesh(new THREE.CylinderGeometry(.06, .06, .1, 16), steel, x, 0, 0, bar).rotation.z = PI / 2;
  for (const x of [-.55, .55]) { mesh(box(.08, .5, .08, .02), STD(0x1c1d21, {metalness: .6}), x, -.22, 0, hero); }
  const plateC = [ACC.getHex(), 0x2f5fa8, ACC2.getHex(), 0x2b2f36];
  let n = 0; const plates = [];
  const addB = button("Add a plate", () => { if (n >= 4) return; const r = .42 - n * .06, xo = 1.0 + n * .12;
    for (const sx of [-1, 1]) { const m = mesh(new THREE.CylinderGeometry(r, r, .1, 36), STD(plateC[n], {roughness: .5}), sx * xo, 0, 0, bar); m.rotation.z = PI / 2; plates.push(m); tween(sx * (xo + 1.2), sx * xo, 600, v => { m.position.x = v; W.shadows(); }, backOut); }
    n++; addB.textContent = n >= 4 ? "Fully loaded" : "Add a plate"; });
  let lift = false;
  button("Lift it", b => { lift = !lift; b.textContent = lift ? "Rack it" : "Lift it"; });
  button("Strip the bar", () => { plates.forEach(m => bar.remove(m)); plates.length = 0; n = 0; addB.textContent = "Add a plate"; W.shadows(); });
  addB.click();
  W.onTick.push(t => { if (lift && !reduce) { bar.position.y = .45 + (Math.sin(t * 2.4) * .5 + .5) * 1.4; W.shadows(); } else if (bar.position.y !== .45) { bar.position.y = .45; W.shadows(); } });
}

async function buildStudio() {
  const {S, fz, hero} = await storefront({tone: [196, 186, 170], awn: ACC, signBg: "#1b1b22", goods: fz => { // framed prints in the window
    for (let i = 0; i < 4; i++) { mesh(box(1.1, .85, .05, .02), STD(0x2b2522), -4.4 + i * 1.6, 2.3, fz - 3.1); mesh(new THREE.PlaneGeometry(.95, .7), STD([ACC.getHex(), ACC2.getHex(), 0xd98c9f, 0xb8c79a][i], {roughness: .9}), -4.4 + i * 1.6, 2.3, fz - 3.07, W.scene, false); } }});
  // tripod + camera on the plinth, a softbox each side
  const blk = STD(0x1c1d21, {roughness: .5, metalness: .4});
  const tri = new THREE.Group(); hero.add(tri);
  for (let i = 0; i < 3; i++) { const l = mesh(new THREE.CylinderGeometry(.025, .02, 1.3), blk, 0, .6, 0, tri); l.rotation.z = .25; l.rotation.y = i / 3 * PI * 2; l.position.set(Math.cos(i / 3 * PI * 2) * .15, .6, Math.sin(i / 3 * PI * 2) * .15); }
  const cam = new THREE.Group(); cam.position.y = 1.32; tri.add(cam);
  mesh(box(.6, .4, .3, .06), blk, 0, 0, 0, cam); mesh(new THREE.CylinderGeometry(.13, .15, .32, 24), blk, 0, 0, .3, cam).rotation.x = PI / 2;
  mesh(new THREE.CircleGeometry(.11, 24), new THREE.MeshPhysicalMaterial({color: 0x223344, metalness: .2, roughness: .02, clearcoat: 1}), 0, 0, .465, cam, false);
  const fl = W.glowMat(0xffffff, 0, {color: 0xeeeeee}); mesh(box(.18, .08, .1, .02), fl, .14, .24, 0, cam, false);
  const boxes = [];
  for (const x of [-1.8, 1.8]) { const g = new THREE.Group(); g.position.set(x, 0, -.3); hero.add(g); mesh(new THREE.CylinderGeometry(.02, .02, 1.8), blk, 0, .9, 0, g);
    const sm = W.glowMat(0xfff4e6, .3, {color: 0xf7f6f2, side: THREE.DoubleSide}); const sb = mesh(new THREE.BoxGeometry(.8, .8, .06), sm, 0, 1.9, 0, g, false); sb.rotation.y = -Math.sign(x) * .6; boxes.push(sm); }
  const flash = new THREE.PointLight(0xffffff, 0, 12, 1.6); flash.position.set(0, 1.6, .6); hero.add(flash);
  let on = false, fT = 0;
  button("Lights", b => { on = !on; b.classList.toggle("hot", on); boxes.forEach(m => { m.userData.p = on ? 3 : 0; }); });
  button("Take the shot", () => { fT = .25; });
  W.onTick.push((t, dt) => { boxes.forEach(m => { m.emissiveIntensity = Math.max(m.emissiveIntensity, m.userData.p || 0); });
    if (fT > 0) { fT -= dt; flash.intensity = 40 * Math.max(0, fT / .25); fl.emissiveIntensity = 6 * Math.max(0, fT / .25); } else if (flash.intensity) { flash.intensity = 0; fl.emissiveIntensity = 0; }
    if (!reduce) tri.rotation.y = Math.sin(t * .35) * .4; });
}

async function buildTrades() {
  W = await makeWorld({exclude: (x, z) => Math.abs(x) < 7 && z < 6 && z > -6, cam: {pos: [13, 5, 19], target: [0, 2.4, 0], minD: 12, maxD: 34, minAz: -.9, maxAz: 1.1}, tod: .55, grassH: .55});
  treeLine(14, 24, 40);
  const H = makeHouse({x: -1, z: -1.5, w: 9, d: 7, h: 3.2, tone: [226, 222, 212], roof: [70, 66, 70]});
  const drive = mesh(new THREE.PlaneGeometry(3.6, 12), STD(0xffffff, {...TEX.concrete([1, 3]), roughness: .9}), 5.6, .03, 4); drive.rotation.x = -PI / 2; drive.castShadow = false;
  shrub(-4.6, 2.4, .9); shrub(2.6, 2.4, .8); bgTree(-11, -6, 1.2); bgTree(12, -8, 1.3);
  yardSign(-4.2, 6.6, .3, (TRADE_NAME[VAR] || "Home repair") + " · " + D.town);
  // the work truck with a ladder rack and a door decal in the accent color
  const v = makeCar(0xf2f4f6, {truck: true}); v.car.position.set(5.6, 0, 26); v.car.rotation.y = PI / 2; W.scene.add(v.car);
  const rack = STD(0x9aa0a8, {metalness: .9, roughness: .3});
  for (const z of [-.5, .5]) mesh(box(.06, .06, 2.4, .02), rack, z * 1.4, 2.0, -.6, v.car).rotation.y = PI / 2;
  const lad = new THREE.Group(); lad.position.set(-.6, 2.06, 0); v.car.add(lad);
  for (const z of [-.25, .25]) mesh(box(3.6, .06, .06, .02), STD(0xc9a15a, {roughness: .5}), 0, 0, z, lad);
  for (let i = 0; i < 9; i++) mesh(new THREE.CylinderGeometry(.02, .02, .5, 8), STD(0xc9a15a), -1.6 + i * .4, 0, 0, lad).rotation.x = PI / 2;
  const dec = await sign(D.short, TRADE_NAME[VAR] || "", 1.6, {bg: "#" + ACC.getHexString(), fg: onAcc, p: .2}); dec.position.set(.1, .82, .95); v.car.add(dec);
  const dec2 = dec.clone(); dec2.rotation.y = PI; dec2.position.z = -.95; v.car.add(dec2);
  // what the job changes
  const job = new THREE.Group(); W.scene.add(job);
  let jobFx;
  if (VAR === "fence") { const posts = []; for (let i = 0; i < 9; i++) posts.push(mesh(box(.14, 1.2, .14, .02), STD(0xf6f4ef, {roughness: .5}), -6 + i * 1.5, -1.3, 4.6, job));
    const rails = [.4, .95].map(y => mesh(box(12, .08, .06, .02), STD(0xf6f4ef, {roughness: .5}), -0, y, 4.6, job)); rails.forEach(r => r.scale.x = .001);
    jobFx = () => { posts.forEach((p, i) => setTimeout(() => tween(-1.3, .6, 500, y => { p.position.y = y; W.shadows(); }, backOut), i * 120)); setTimeout(() => rails.forEach(r => tween(.001, 1, 900, s => { r.scale.x = s; W.shadows(); })), 1300); };
  } else if (VAR === "concrete" || VAR === "pressurewash") { const sl = mesh(box(3.6, .1, 6, .02), STD(0xf3f2ee, {roughness: .5}), 5.6, -.2, 5, job); sl.scale.z = .001;
    jobFx = () => { sl.position.y = .06; tween(.001, 1, 1800, s => { sl.scale.z = s; sl.position.z = 2 + s * 3; W.shadows(); }, easeIO); };
  } else if (VAR === "roofing") { const nr = STD(new THREE.Color(ACC).lerp(new THREE.Color(0x3a3a40), .55), {roughness: .8});
    const rise = Math.min(2.4, 9 * .26), hs = 9 / 2 + .45, L = Math.hypot(hs, rise), ang = Math.atan2(rise, hs), pieces = [];
    for (const sx of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(L, .16, 8.05), nr, -1 + sx * hs / 2, 3.2 + rise / 2 + .08, -1.5, job); r.rotation.z = -sx * ang; r.scale.z = .001; pieces.push(r); }
    jobFx = () => pieces.forEach((r, i) => setTimeout(() => tween(.001, 1, 1400, s => { r.scale.z = s; W.shadows(); }, easeIO), i * 300));
  } else { // lights on through the house, a toolbox on the porch and a done tag
    const tb = mesh(box(.7, .36, .34, .04), STD(ACC, {roughness: .4, metalness: .3}), 1.6, -.5, 2.6, job); mesh(box(.4, .06, .06, .02), STD(0x2b2f36), 0, .22, 0, tb);
    jobFx = () => { tween(-.5, .18, 700, y => { tb.position.y = y; W.shadows(); }, backOut); H.wins.forEach((w, i) => setTimeout(() => { w.material = W.glowMat(0xffd9a0, 2.2, {color: 0x1a232c}); W.refresh(); }, 300 + i * 200)); };
  }
  let done = false;
  const go = button("Start the job", b => { if (done) return; done = true; b.textContent = "On the way"; tween(26, 7.4, 2600, z => { v.car.position.z = z; v.wheels.forEach(w => w.rotation.z -= .08); W.shadows(); }, easeIO); setTimeout(() => { jobFx(); b.textContent = "Job done"; b.classList.add("hot"); }, reduce ? 0 : 2700); });
}
const TRADE_NAME = {roofing: "Roofing", plumbing: "Plumbing", electrical: "Electrical", hvac: "Heating & Air", handyman: "Handyman", flooring: "Flooring", fence: "Fencing",
  concrete: "Concrete", pressurewash: "Pressure Washing", welding: "Welding", appliance: "Appliance Repair", locksmith: "Locksmith", smallengine: "Small Engines"};

// ---------------------------------------------------------------- run
const builders = {auto: buildAuto, tree: buildTree, lawn: buildLawn, painting: buildPainting, cleaning: buildCleaning, sweets: buildSweets,
  beauty: buildBeauty, food: buildFood, retail: buildRetail, pets: buildPets, fitness: buildFitness, studio: buildStudio, trades: buildTrades};
try {
  await (builders[G] || buildAuto)();
  W.onTick.push(() => { const now = performance.now(); for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = Math.min(1, (now - w.t0) / w.ms); w.set(lerp(w.from, w.to, w.ease(k))); if (k >= 1) tweens.splice(i, 1); } });
  const seg = document.getElementById("scTod");
  if (seg) seg.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); W.setTod(parseFloat(b.dataset.v)); });
  if (hintEl) hintEl.textContent = small ? "Tap the buttons below" : "Drag to look around";
  W.start(); host.classList.add("ready");
} catch (e) { host.classList.add("noGL"); console.error(e); }
