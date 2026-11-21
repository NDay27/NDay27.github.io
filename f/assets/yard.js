// Flagship home-trade kit: the yard around the Harlow house.
// mow(): grass height and stripes for lawn crews. yardTree(): a big front-yard shade tree that a tree crew can trim, raise or take down.
import {THREE, leafCard, signTexture} from "../../harlow/assets/world.js";

// lawn(world, house): h = how overgrown (1 = freshly cut, 5 = two weeks too long), stripes 0..1, cut 0..1 = how much of the yard is done (the mower sweeps from -x to +x).
// Long grass is its own tall, seedy blade field; stripes are a mowing pattern laid on the ground (light and dark bands like a roller leaves) plus the short blades.
export function lawn(world, house) {
  const g = world.grass; if (!g) return {set() {}};
  const ex = (x, z) => house && house.exclude(x, z);
  const X0 = -30, X1 = 34;
  // stripes: a canvas of 45-degree bands on a ground-hugging plane
  const cv = document.createElement("canvas"); cv.width = cv.height = 1024; const cx = cv.getContext("2d");
  const W = 70, band = 2.6, px = 1024 / W;
  cx.save(); cx.translate(512, 512); cx.rotate(-Math.PI / 4.6);
  for (let i = -40; i < 40; i++) { const x0 = i * band * px, gr = cx.createLinearGradient(x0, 0, x0 + band * px, 0), a = i & 1 ? "rgba(226,246,170," : "rgba(10,40,12,", o = i & 1 ? .24 : .2;
    gr.addColorStop(0, a + o * .55 + ")"); gr.addColorStop(.12, a + o + ")"); gr.addColorStop(.88, a + o + ")"); gr.addColorStop(1, a + o * .55 + ")"); cx.fillStyle = gr; cx.fillRect(x0, -900, band * px, 1800); }
  cx.restore();
  // fade out toward the edge of the yard
  cx.globalCompositeOperation = "destination-in"; const rg = cx.createRadialGradient(512, 512, 300, 512, 512, 512); rg.addColorStop(0, "#000"); rg.addColorStop(1, "rgba(0,0,0,0)"); cx.fillStyle = rg; cx.fillRect(0, 0, 1024, 1024);
  const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace; st.anisotropy = 8;
  const sm = new THREE.MeshStandardMaterial({map: st, transparent: true, opacity: 0, depthWrite: false, roughness: 1, envMapIntensity: .4});
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(W, W), sm); sp.rotation.x = -Math.PI / 2; sp.position.set(2, .008, 2); sp.receiveShadow = true; world.scene.add(sp);
  // long grass: tall seedy blades over the yard
  const small = innerWidth < 760 || matchMedia("(pointer: coarse)").matches, N = small ? 14000 : 34000;
  const lg = new THREE.InstancedMesh(world.bladeG, world.bladeM, N); lg.receiveShadow = true; const LP = [], LC = [];
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
    for (let i = 0; LP.length < N && i < N * 6; i++) { const r = Math.sqrt(Math.random()) * 30, a = Math.random() * Math.PI * 2, x = Math.cos(a) * r + 2, z = Math.sin(a) * r + 4;
      if (ex(x, z)) continue; e.set((Math.random() - .5) * .6, Math.random() * Math.PI, (Math.random() - .5) * .6); q.setFromEuler(e);
      LP.push([x, z, .45 + Math.random() * .75, q.clone()]); const dry = Math.random() < .22; LC.push(new THREE.Color().setHSL(dry ? .13 + Math.random() * .03 : .2 + Math.random() * .07, dry ? .38 : .34 + Math.random() * .18, dry ? .42 + Math.random() * .1 : .26 + Math.random() * .13)); } }
  lg.count = 0; lg.frustumCulled = false; world.scene.add(lg);
  const m = new THREE.Matrix4(), v = new THREE.Vector3(), s = new THREE.Vector3();
  let last = "";
  function set({h = 1, stripes = 0, cut = 1} = {}) {
    const key = [h, stripes, cut].map(n => (+n).toFixed(3)).join(); if (key === last) return; last = key;
    const edge = X0 + (X1 - X0) * cut, k = Math.max(0, Math.min(1, (h - 1) / 4));
    // stripes only where it's been cut: scale the plane to the cut part
    const cw = Math.max(.001, Math.min(W, edge - (2 - W / 2)));
    sp.scale.x = cw / W; sp.position.x = (2 - W / 2) + cw / 2; st.repeat.set(cw / W, 1); st.offset.set(0, 0); st.needsUpdate = true;
    sm.opacity = stripes; sp.visible = stripes > .01 && cut > .001;
    let n = 0;
    if (k > .001) for (let i = 0; i < LP.length; i++) { const [x, z, hh, q] = LP[i]; if (x < edge) continue; m.compose(v.set(x, 0, z), q, s.set(1.3, hh * k, 1.3)); lg.setMatrixAt(n, m);
      lg.setColorAt(n, LC[i]); n++; }
    lg.count = n; lg.instanceMatrix.needsUpdate = true; if (lg.instanceColor) lg.instanceColor.needsUpdate = true;
    if (world.R && world.R.shadowMap) world.R.shadowMap.needsUpdate = true;
  }
  return {set, stripes: sp, long: lg};
}

// A big front-left shade tree. shape(t): 0 = overgrown (low, heavy limbs over the roof, one dead limb), 1 = trimmed (crown raised, roof cleared, deadwood out).
// down(t): 0 = standing, 1 = removed to a ground-level stump.
export function yardTree(world, {x = -11.5, z = 3.2, s = 1.5} = {}) {
  const {scene} = world, root = new THREE.Group(); root.position.set(x, 0, z); scene.add(root);
  const bark = new THREE.MeshStandardMaterial({color: 0x3a332d, roughness: .95, envMapIntensity: .35}), dead = new THREE.MeshStandardMaterial({color: 0x8a7f72, roughness: 1});
  const cyl = (r0, r1, len, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 9), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const th = 5.2 * s, trunk = cyl(.26 * s, .5 * s, th, bark); trunk.position.y = th / 2; root.add(trunk);
  const stump = cyl(.5 * s, .56 * s, .35, bark); stump.position.y = .17; stump.visible = false; root.add(stump);
  const ring = new THREE.Mesh(new THREE.CircleGeometry(.5 * s, 24), new THREE.MeshStandardMaterial({color: 0xc9a77c, roughness: .9})); ring.rotation.x = -Math.PI / 2; ring.position.y = .352; ring.visible = false; root.add(ring);
  const leafT = leafCard(80, 30), cards = [];
  const rnd = seed => { let s0 = seed * 9301 + 49297; return () => (s0 = (s0 * 16807) % 2147483647) / 2147483647; };
  // limbs: angle around trunk, height on trunk, length, droop. "over" limbs reach toward the house (+x); low ones hang over the walk.
  const L = [[.25, .55, 5.2, -.12, "over"], [-.35, .48, 3.0, .15, "low"], [2.3, .58, 3.1, -.1, ""], [3.6, .62, 2.8, -.2, ""], [4.8, .55, 3.0, .05, "low"], [1.2, .72, 2.6, -.35, ""], [5.6, .7, 2.5, -.3, ""], [.7, .64, 4.8, -.22, "over"], [-1.2, .78, 2.2, -.45, "dead"]];
  const limbs = L.map(([a, hy, len, droop, kind], i) => {
    const g = new THREE.Group(); g.position.y = th * hy; g.rotation.y = a; root.add(g);
    const arm = new THREE.Group(); arm.rotation.z = -1.05 - droop; g.add(arm);
    const b = cyl(.06 * s, .17 * s, len * s, kind === "dead" ? dead : bark); b.position.y = len * s / 2; arm.add(b);
    const r = rnd(i + 3), tip = new THREE.Vector3(0, len * s, 0), n = kind === "dead" ? 0 : Math.round(70 * s);
    for (let k = 0; k < n; k++) { const u = r() * 2 - 1, t = r() * 6.28, rr = Math.cbrt(r()) * 1.35 * s, q = Math.sqrt(1 - u * u);
      cards.push({arm, p: new THREE.Vector3(Math.cos(t) * q * rr, len * s * .78 + u * rr * .7, Math.sin(t) * q * rr), sc: s * (1.15 + r() * .6), r: [r() * 3, r() * 3, r() * 3], col: new THREE.Color().setHSL(.24 + r() * .05, .44, .23 * (.75 + r() * .55))}); }
    return {g, arm, kind, len};
  });
  // crown top
  const top = new THREE.Group(); top.position.y = th + 1.2 * s; root.add(top);
  { const r = rnd(99); for (let k = 0; k < 260 * s; k++) { const u = r() * 2 - 1, t = r() * 6.28, rr = Math.cbrt(r()) * 2.8 * s, q = Math.sqrt(1 - u * u);
      cards.push({arm: top, p: new THREE.Vector3(Math.cos(t) * q * rr, u * rr * .72, Math.sin(t) * q * rr), sc: s * (1.2 + r() * .6), r: [r() * 3, r() * 3, r() * 3], col: new THREE.Color().setHSL(.23 + r() * .05, .44, .24 * (.75 + r() * .55))}); } }
  const leafU = {t: {value: 0}};
  const lm = new THREE.MeshStandardMaterial({map: leafT, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, envMapIntensity: .55});
  lm.onBeforeCompile = sh => { sh.uniforms.t = leafU.t; sh.vertexShader = "uniform float t;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
  vec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);float sw=sin(t*1.1+wp0.x*.2+wp0.z*.15)*.06+sin(t*2.3+wp0.y)*.03;transformed.x+=sw*(1.+position.y);transformed.z+=sw*.6;`); };
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), lm, cards.length); leaves.castShadow = true; leaves.receiveShadow = true;
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: leafT, alphaTest: .45});
  cards.forEach((c, i) => { c.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...c.r)); leaves.setColorAt(i, c.col); });
  scene.add(leaves);
  const M = new THREE.Matrix4(), W = new THREE.Vector3(), S = new THREE.Vector3(), Z = new THREE.Vector3();
  let shapeT = 0, downT = 0;
  function apply() {
    const t = shapeT, d = downT;
    trunk.visible = d < .98; stump.visible = ring.visible = d >= .98; top.visible = d < .98;
    trunk.scale.y = 1; top.position.y = th + (1.2 + .9 * t) * s; top.scale.setScalar(1 - .12 * t);
    limbs.forEach(l => {
      // trimming: low limbs and roof-side limbs come off, deadwood goes, the rest lift a little
      const gone = (l.kind === "low" || l.kind === "dead") ? t > .5 : l.kind === "over" ? t > .5 : false;
      l.g.visible = !gone && d < .98; l.arm.rotation.z += 0; l.g.scale.setScalar(l.kind === "over" && !gone ? 1 - .3 * t : 1);
    });
    root.updateMatrixWorld(true); let n = 0;
    cards.forEach(c => { if (!c.arm.parent.visible && c.arm !== top) return; if (c.arm === top && !top.visible) return; if (c.arm !== top && !c.arm.parent.visible) return;
      W.copy(c.p).applyMatrix4(c.arm.matrixWorld); M.compose(W, c.q, S.set(c.sc, c.sc, c.sc)); leaves.setMatrixAt(n, M); leaves.setColorAt(n, c.col); n++; });
    leaves.count = n; leaves.instanceMatrix.needsUpdate = true; if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    if (world.R && world.R.shadowMap) world.R.shadowMap.needsUpdate = true;
  }
  apply();
  world.onTick && world.onTick.push(t => { leafU.t.value = t; });
  return {root, shape(t) { if (t !== shapeT) { shapeT = t; apply(); } }, down(t) { if (t !== downT) { downT = t; apply(); } }, exclude: (px, pz) => Math.hypot(px - x, pz - z) < .7 * s};
}


// flatwork(world, {kind}): the driveway in front of the garage wing, dirty ("wash") or cracked ("concrete").
// set({fix}) sweeps the job along the drive: a clipping plane eats the old surface, a wet band rides the edge.
// Driveway on the Harlow house: x 6.8..12.2, z 3..31 (house.js wx0/wx1/wz1).
export function flatwork(world, {kind = "wash", x0 = 6.8, x1 = 12.2, z0 = 3, z1 = 31} = {}) {
  const W = x1 - x0, L = z1 - z0, cv = document.createElement("canvas"); cv.width = 512; cv.height = 2048; const g = cv.getContext("2d");
  let seed = kind === "wash" ? 7 : 19; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const px = cv.width / W, pz = cv.height / L;  // canvas y runs from the street (top) to the garage (bottom)
  const blob = (x, y, rad, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rad, rad * (.6 + r() * .8), r() * 3, 0, 7); g.fill(); };
  // everyone's driveway: a grey film, tire tracks, oil where the car sits, mildew along the edges
  g.fillStyle = kind === "wash" ? "rgba(58,62,44,.6)" : "rgba(64,64,60,.58)"; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 900; i++) blob(r() * cv.width, r() * cv.height, 6 + r() * 34, r() < .5 ? "40,48,30" : "52,50,42", .12 + r() * .2);
  for (const tx of [1.35, 4.05]) for (let i = 0; i < 160; i++) blob(tx * px + (r() - .5) * 40, r() * cv.height, 14 + r() * 18, "28,28,26", .16 + r() * .14);
  for (let i = 0; i < 9; i++) blob((1.6 + r() * 2.2) * px, (L - 4 - r() * 6) * pz, 30 + r() * 50, "20,20,22", .35 + r() * .2);
  for (let i = 0; i < 260; i++) { const e = r() < .5 ? r() * 26 : cv.width - r() * 26; blob(e, r() * cv.height, 14 + r() * 30, "46,72,30", .3 + r() * .3); }
  if (kind === "concrete") {
    // the old slab: cracks with weeds in them, a broken corner and patched spots
    const crack = (x, y, n, ang) => { g.strokeStyle = "rgba(28,28,26,.92)"; g.lineWidth = 4 + r() * 4; g.lineJoin = "round"; g.beginPath(); g.moveTo(x, y); const pts = [[x, y]];
      for (let i = 0; i < n; i++) { ang += (r() - .5) * .9; x += Math.cos(ang) * (14 + r() * 22); y += Math.sin(ang) * (14 + r() * 22); g.lineTo(x, y); pts.push([x, y]); } g.stroke();
      g.strokeStyle = "rgba(215,212,204,.35)"; g.lineWidth = 1; g.stroke();
      for (const [a, b] of pts) if (r() < .35) { g.strokeStyle = "rgba(84,126,44,.95)"; g.lineWidth = 3.5; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(a, b); g.lineTo(a + (r() - .5) * 34, b - 8 - r() * 26); g.stroke(); } } return pts; };
    for (let i = 0; i < 14; i++) { const p0 = crack(r() * cv.width, r() * cv.height, 10 + r() * 14, r() * 6.3); if (r() < .6) crack(p0[3][0], p0[3][1], 6, r() * 6.3); }
    for (let i = 0; i < 6; i++) { const y = (2 + i * 4.6) * pz; g.strokeStyle = "rgba(30,30,28,.8)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= cv.width; x += 32) g.lineTo(x, y + (r() - .5) * 10); g.stroke(); }
    for (let i = 0; i < 5; i++) { const x = r() * cv.width, y = r() * cv.height, n = 7, rad = 26 + r() * 40; g.fillStyle = r() < .5 ? "rgba(48,46,42,.85)" : "rgba(120,116,106,.8)"; g.beginPath();
      for (let k = 0; k < n; k++) { const a = k / n * 6.28, rr = rad * (.6 + r() * .5); g[k ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.3); } g.closePath(); g.fill(); }
    g.fillStyle = "rgba(40,38,34,.9)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(150, 0); g.lineTo(90, 60); g.lineTo(30, 130); g.lineTo(0, 120); g.fill();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, 1), -z0);
  const mat = new THREE.MeshStandardMaterial({map: tex, transparent: true, depthWrite: false, roughness: .95, envMapIntensity: .2, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: -2});
  world.R.localClippingEnabled = true;
  const old = new THREE.Mesh(new THREE.PlaneGeometry(W, L), mat); old.rotation.x = -Math.PI / 2; old.rotation.z = Math.PI; old.position.set((x0 + x1) / 2, .028, (z0 + z1) / 2); old.receiveShadow = true; old.renderOrder = 2; world.scene.add(old);
  // the working edge: wet, dark concrete behind a washer, or fresh grey mud on a pour
  const bandM = new THREE.MeshStandardMaterial({color: kind === "wash" ? 0x3a3d40 : 0x8d8c88, transparent: true, opacity: 0, depthWrite: false, roughness: kind === "wash" ? .12 : .35, envMapIntensity: .8, polygonOffset: true, polygonOffsetFactor: -3});
  const band = new THREE.Mesh(new THREE.PlaneGeometry(W, 2.4), bandM); band.rotation.x = -Math.PI / 2; band.position.set((x0 + x1) / 2, .03, z0); band.renderOrder = 3; world.scene.add(band);
  let last = -1;
  return {mesh: old, set({fix = 0} = {}) {
    if (Math.abs(fix - last) < 1e-4) return; last = fix;
    const zc = z0 + (L + 1.2) * fix; clip.constant = -zc; old.visible = fix < .999;
    band.position.z = zc - 1.2; bandM.opacity = fix > .001 && fix < .999 ? (kind === "wash" ? .55 : .9) : 0;
  }};
}

// workTruck(world, {sign}): the crew's pickup in the drive, the business name on both doors.
export async function workTruck(world, {sign = "", sub = "", font, color = 0xf2f2ee, ink = "#172033", x = 9.5, z = 21.5, ry = 0} = {}) {
  const {makeTruck} = await import("./garage.js");
  const t = makeTruck(world, {color, lights: false}); t.set({lights: false}); t.car.position.set(x, 0, z); t.car.rotation.y = ry; world.scene.add(t.car);
  if (sign) { const tex = await signTexture(sign, sub, {fg: ink, bg: null, font, w: 1024, h: 340});
    const m = new THREE.MeshStandardMaterial({map: tex, transparent: true, roughness: .5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .5), m); p.position.set(s * .995, .8, .05); p.rotation.y = s * Math.PI / 2; t.car.add(p); } }
  return t;
}

// acUnit(world): the outdoor condenser beside the house on a pad. set({fix}) swaps the old, rusted unit (fan stopped,
// weeds at the pad) for a new one (fan spinning): the old one slides off, the new one is set down in its place.
export function acUnit(world, {x = -7.4, z = -.2, ry = 0} = {}) {
  const root = new THREE.Group(); root.position.set(x, 0, z); root.rotation.y = ry; world.scene.add(root);
  const mat = (c, r = .6, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: m, envMapIntensity: .6, ...o});
  const add = (geo, m, px, py, pz, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const fins = (c, rust) => { const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const g = cv.getContext("2d");
    g.fillStyle = c; g.fillRect(0, 0, 512, 256); g.fillStyle = "rgba(0,0,0,.5)"; for (let i = 0; i < 512; i += 3) g.fillRect(i, 22, 1.2, 214);
    g.fillStyle = "rgba(255,255,255,.12)"; for (let i = 1; i < 512; i += 3) g.fillRect(i, 22, .8, 214);
    g.fillStyle = c; g.fillRect(0, 0, 512, 22); g.fillRect(0, 236, 512, 20); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(0, 21, 512, 2); g.fillRect(0, 235, 512, 2);
    if (rust) { let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 46; i++) { const x = r() * 512, y = 120 + r() * 136, gr = g.createRadialGradient(x, y, 0, x, y, 8 + r() * 26); gr.addColorStop(0, "rgba(118,58,22,.8)"); gr.addColorStop(1, "rgba(118,58,22,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); }
      g.strokeStyle = "rgba(170,160,128,.6)"; g.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = r() * 470, y = 40 + r() * 170; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 12, y + 6, x + 26, y - 5, x + 40, y + 3); g.stroke(); }  // bent fins
      const gr = g.createLinearGradient(0, 160, 0, 256); gr.addColorStop(0, "rgba(40,34,20,0)"); gr.addColorStop(1, "rgba(40,34,20,.7)"); g.fillStyle = gr; g.fillRect(0, 160, 512, 96); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const unit = (old) => {
    const u = new THREE.Group(), W = .92, H = .86, top = old ? 0x8d8670 : 0xe9e9e4, side = mat(0xffffff, .55, .25, {map: fins(old ? "#77735f" : "#b4b9bc", old)});
    add(new THREE.BoxGeometry(W, H, W), side, 0, H / 2 + .1, 0, u);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.BoxGeometry(.07, H + .02, .07), mat(top, .5, .2), a * (W / 2 - .02), H / 2 + .1, b * (W / 2 - .02), u);
    add(new THREE.BoxGeometry(W + .04, .06, W + .04), mat(top, .45, .25), 0, H + .13, 0, u);
    add(new THREE.CylinderGeometry(.36, .36, .02, 28), mat(0x1c1e20, .7), 0, H + .165, 0, u);
    const grille = add(new THREE.TorusGeometry(.3, .012, 6, 28), mat(0x2a2c2e, .5, .4), 0, H + .18, 0, u); grille.rotation.x = Math.PI / 2;
    const fan = new THREE.Group(); fan.position.set(0, H + .16, 0); u.add(fan);
    for (let k = 0; k < 4; k++) { const bl = add(new THREE.BoxGeometry(.28, .012, .1), mat(0x3a3d40, .5, .3), .15, 0, 0, fan); bl.rotation.x = .35; bl.parent.remove(bl); const arm = new THREE.Group(); arm.rotation.y = k * Math.PI / 2; arm.add(bl); fan.add(arm); }
    add(new THREE.BoxGeometry(.3, .18, .04), mat(old ? 0x5a5446 : 0x2f3236, .5), W / 2 - .2, .35, W / 2 + .02, u);  // service panel
    for (const [r, c, zz] of [[.025, 0xb87333, -.3], [.045, 0x111214, -.16]]) { const l = add(new THREE.CylinderGeometry(r, r, .95, 8), mat(c, c === 0x111214 ? .9 : .35, c === 0x111214 ? 0 : .8), W / 2 + .47, .4, zz, u); l.rotation.z = Math.PI / 2; }  // line set to the wall
    u.userData.fan = fan; return u; };
  add(new THREE.BoxGeometry(1.4, .1, 1.4), mat(0xbdbab2, .9), 0, .05, 0, root);
  add(new THREE.BoxGeometry(.07, .32, .24), mat(0x8e9296, .5, .3), 1.36, 1.05, .25, root);  // disconnect box on the wall
  { const c = add(new THREE.CylinderGeometry(.018, .018, .62, 6), mat(0x55595c, .6), 1.36, .62, .25, root); }
  const oldU = unit(true), newU = unit(false); root.add(oldU, newU);
  // weeds around the old pad
  const weeds = new THREE.Group(); root.add(weeds); const wm = mat(0x4f6e2e, .9, 0, {side: THREE.DoubleSide});
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28, r = .72 + (i % 3) * .05, b = add(new THREE.PlaneGeometry(.06, .18 + (i % 4) * .06), wm, Math.cos(a) * r, .12, Math.sin(a) * r, weeds); b.rotation.set(.3, a, 0); b.castShadow = false; }
  let fix = 0, spin = 0;
  world.onTick.push((t, dt) => { spin += dt * 14 * Math.max(0, (fix - .9) * 10); newU.userData.fan.rotation.y = spin; });
  const set = ({fix: f = 0} = {}) => { fix = f;
    const a = Math.min(1, f * 2), b = Math.max(0, f * 2 - 1);
    oldU.visible = a < 1; oldU.position.set(-a * 1.8, 0, a * .6); oldU.rotation.y = -a * .5; weeds.visible = f < .5;
    newU.visible = b > 0; newU.position.set(0, (1 - b) * .8, 0); };
  set({fix: 0});
  return {root, set};
}

// yardLine(world, {x, z0, z1}): a broken water line under the front lawn. set({fix}): 0 = a soggy patch with a puddle and
// locate flags, ~.5 = the trench open with the old pipe split, then a new blue section coupled in, 1 = backfilled with fresh sod.
// exclude(x, z) keeps grass blades out of the trench strip.
export function yardLine(world, {x = -3.4, z0 = 15.5, z1 = 20.5, leak = 18.1} = {}) {
  const root = new THREE.Group(); world.scene.add(root);
  const L = z1 - z0, zc = (z0 + z1) / 2;
  let seed = 31; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const canvas = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const flat = (w, l, m, y, px = x, pz = zc) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, l), m); o.rotation.x = -Math.PI / 2; o.position.set(px, y, pz); o.receiveShadow = true; root.add(o); return o; };
  const std = (c, ro = .9, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, envMapIntensity: .4, ...o});
  const mesh = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; root.add(o); return o; };
  // soggy ground: dark mud fading out into the grass
  const mudM = new THREE.MeshStandardMaterial({map: canvas(256, 640, (g, w, h) => {
    for (let i = 0; i < 260; i++) { const cx = w / 2 + (r() - .5) * w * .55, cy = h * (.08 + r() * .84), rad = 14 + r() * 44, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const c = r() < .5 ? "58,44,30" : "40,32,24"; gr.addColorStop(0, `rgba(${c},.5)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }),
    transparent: true, depthWrite: false, roughness: .55, envMapIntensity: .5, polygonOffset: true, polygonOffsetFactor: -2});
  const mud = flat(2.2, L + 1.6, mudM, .012); mud.renderOrder = 2;
  // the puddle where the water comes up
  const pudM = new THREE.MeshStandardMaterial({color: 0x34414a, roughness: .04, metalness: .2, envMapIntensity: 1.4, transparent: true, opacity: .88, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3});
  const pud = new THREE.Mesh(new THREE.CircleGeometry(.5, 40), pudM); pud.rotation.x = -Math.PI / 2; pud.scale.set(1.5, 2.6, 1); pud.position.set(x + .1, .016, leak); pud.renderOrder = 3; root.add(pud);
  const ringM = new THREE.MeshBasicMaterial({color: 0xdfe9ee, transparent: true, opacity: .4, depthWrite: false});
  const ring = new THREE.Mesh(new THREE.RingGeometry(.1, .13, 32), ringM); ring.rotation.x = -Math.PI / 2; ring.position.set(x + .05, .02, leak); ring.renderOrder = 4; root.add(ring);
  // the dig: a dark channel between two spoil piles, the shovel left in the pile
  const chanM = std(0x2a2017, 1, {transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4});
  const chan = flat(.72, L, chanM, .02); chan.renderOrder = 5;
  const soil = new THREE.MeshStandardMaterial({color: 0x3f3329, roughness: 1, envMapIntensity: .3});
  const pileGeo = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2); { const p = pileGeo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (r() - .5) * .22; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } pileGeo.computeVertexNormals(); }
  const mounds = []; for (let i = 0; i < 9; i++) { const side = i < 6, k = side ? i : i - 6, n = side ? 6 : 3;
    const o = mesh(pileGeo, soil, x + (side ? .72 : -.7) + (r() - .5) * .14, 0, z0 + .5 + (k + .5) / n * (L - 1) + (r() - .5) * .3);
    o.userData.s = side ? [.42 + r() * .14, .3 + r() * .14, .55 + r() * .25] : [.26 + r() * .06, .1 + r() * .05, .6 + r() * .3]; o.rotation.y = r() * 3; mounds.push(o); }
  const shovel = new THREE.Group(); root.add(shovel); shovel.position.set(x + .9, .2, zc - 1.2); shovel.rotation.set(.35, 0, -.25);
  { const h = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.1, 8), std(0x9a7b52, .6)); h.position.y = .55; h.castShadow = true; shovel.add(h);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.22, .28, .02), std(0x3b3f44, .45, {metalness: .6})); b.position.y = -.05; b.castShadow = true; shovel.add(b); }
  // pipe: the old grey line split open, then a blue section with brass couplings
  const pipeGeo = (len) => { const c = new THREE.CylinderGeometry(.045, .045, len, 14); c.rotateX(Math.PI / 2); return c; };
  const oldA = mesh(pipeGeo(leak - .12 - z0), std(0x7b8086, .5), x, .06, (z0 + leak - .12) / 2), oldB = mesh(pipeGeo(z1 - leak - .12), std(0x7b8086, .5), x, .06, (leak + .12 + z1) / 2);
  const split = mesh(new THREE.SphereGeometry(.06, 10, 8), std(0x6a6f74, .5), x + .02, .07, leak); split.scale.set(1, .7, 1.6);
  const newP = new THREE.Group(); root.add(newP);
  { const p = new THREE.Mesh(pipeGeo(2.6), std(0x2f6fd0, .35)); p.position.set(x, .06, leak); p.castShadow = true; newP.add(p);
    for (const dz of [-1.3, 1.3]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .14, 14), std(0xb58a3a, .3, {metalness: .8})); c.rotation.x = Math.PI / 2; c.position.set(x, .06, leak + dz); newP.add(c); } }
  // fresh sod over the patch afterwards: a lighter strip with seams
  const sodM = new THREE.MeshStandardMaterial({map: canvas(128, 640, (g, w, h) => {
    g.fillStyle = "#567f33"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.strokeStyle = r() < .5 ? "rgba(40,78,22,.55)" : "rgba(140,180,80,.45)"; g.lineWidth = 1; const a = r() * w, b = r() * h; g.beginPath(); g.moveTo(a, b); g.lineTo(a + (r() - .5) * 3, b - 4 - r() * 6); g.stroke(); }
    g.fillStyle = "rgba(48,40,28,.6)"; for (let y = 0; y < h; y += h / 8) g.fillRect(0, y, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); }),
    transparent: true, depthWrite: false, roughness: .9, envMapIntensity: .3, polygonOffset: true, polygonOffsetFactor: -4});
  const sod = flat(.95, L + .3, sodM, .022); sod.renderOrder = 6;
  // locate flags along the line, house to street
  const flags = new THREE.Group(); root.add(flags); const flagM = std(0x2a64d6, .6, {side: THREE.DoubleSide}), wire = std(0x8a8d90, .5);
  for (const fz of [7.5, 10.5, 13.5, 23, 26, 29]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .5, 5), wire); st.position.set(x, .25, fz); flags.add(st);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(.12, .08), flagM); f.position.set(x + .06, .46, fz); f.rotation.y = .4; flags.add(f); }
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  let fix = -1, tt = 0;
  world.onTick.push((t, dt) => { tt += dt; if (ring.visible) { const k = (tt * .7) % 1; ring.scale.setScalar(1 + k * 3); ringM.opacity = .45 * (1 - k); } });
  const set = ({fix: f = 0} = {}) => { if (Math.abs(f - fix) < 1e-4) return; fix = f;
    const dig = f < .5 ? ss(.12, .4, f) : 1 - ss(.66, .86, f), wet = 1 - ss(0, .28, f);
    pudM.opacity = .88 * wet; pud.visible = wet > .01; ring.visible = wet > .2;
    mudM.opacity = Math.max(wet, dig * .85, .0); mud.visible = mudM.opacity > .01;
    chanM.opacity = dig; chan.visible = dig > .01;
    for (const o of mounds) { const [a, b, c] = o.userData.s; o.scale.set(a, b * dig + .001, c); o.visible = dig > .01; }
    shovel.visible = dig > .3;
    const swap = f >= .55; oldA.visible = oldB.visible = dig > .05 && !swap; split.visible = oldA.visible; newP.visible = dig > .05 && swap;
    const s = ss(.8, .95, f); sodM.opacity = s * .9; sod.visible = s > .01;
    flags.visible = f < .9; };
  set({fix: 0});
  return {root, set, exclude: (px, pz) => Math.abs(px - x) < .5 && pz > z0 - .2 && pz < z1 + .2};
}
