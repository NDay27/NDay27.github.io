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

// fixList(world): a handyman's list on the Harlow house. set({fix}) works through it in order:
// the porch gutter hanging loose (fixed by .5, with a downspout), the cracked top step (new tread by .7),
// and the mailbox leaning at the curb (straight by .9). A ladder and a toolbox show up while the work is on.
export function fixList(world) {
  const root = new THREE.Group(); world.scene.add(root);
  const std = (c, ro = .6, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, envMapIntensity: .5, ...o});
  const box = (w, h, d, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; return o; };
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  // gutter along the porch roof's front edge: a pivot at the right end so the left run can hang down
  const gM = std(0xe9e8e3, .35, {metalness: .3}), gy = 3.86, gz = 7.08, x0 = -5.36, x1 = 5.36;
  const gut = (len) => { const g = new THREE.Group(); const b = box(len, .03, .13, gM); b.position.y = -.05; g.add(b);
    const f = box(len, .12, .02, gM); f.position.set(0, 0, .065); g.add(f); const k = box(len, .08, .02, gM); k.position.set(0, -.02, -.065); g.add(k); return g; };
  const right = gut(x1 - .2); right.position.set((x1 + .2) / 2, gy, gz); root.add(right);
  const leftP = new THREE.Group(); leftP.position.set(.2, gy, gz); root.add(leftP);
  const left = gut(.2 - x0); left.position.x = -(.2 - x0) / 2; leftP.add(left);
  const spout = new THREE.Group(); root.add(spout); spout.position.set(x0 + .06, 0, gz - .02);
  { const p = box(.07, gy - .2, .07, gM); p.position.y = (gy - .2) / 2 + .2; spout.add(p); const e = box(.07, .07, .3, gM); e.position.set(0, .2, .12); spout.add(e); const s = box(.3, .03, .4, std(0x9a978f, .9)); s.position.set(0, .015, .4); spout.add(s); }
  // top porch step: a cracked, sunken board, then a fresh tread
  const oldW = std(0x857a6c, .95), newW = std(0xc9a06d, .55);
  const crackA = box(1.1, .03, .34, oldW), crackB = box(1.1, .03, .34, oldW); crackA.position.set(-.56, .455, 6.77); crackB.position.set(.62, .4, 6.8); crackB.rotation.set(.16, .1, -.24);
  const gap = box(.2, .012, .34, std(0x15120e, 1)); gap.position.set(.02, .447, 6.77); root.add(gap); root.add(crackA, crackB);
  const tread = box(2.22, .035, .36, newW); tread.position.set(0, .458, 6.77); root.add(tread);
  // ladder against the left porch post, toolbox on the walk
  const ladder = new THREE.Group(); root.add(ladder); const lM = std(0xb9bec4, .35, {metalness: .6});
  { for (const dx of [-.22, .22]) { const r = box(.05, 4.1, .07, lM); r.position.set(dx, 2.05, 0); ladder.add(r); }
    for (let i = 0; i < 12; i++) { const r = box(.44, .035, .035, lM); r.position.set(0, .3 + i * .32, 0); ladder.add(r); } }
  ladder.position.set(-4.3, 0, 7.55); ladder.rotation.x = -.2;
  const tool = new THREE.Group(); root.add(tool);
  { const b = box(.5, .22, .22, std(0xc8382a, .45)); b.position.y = .13; tool.add(b); const h = box(.32, .04, .04, std(0x222426, .5)); h.position.y = .28; tool.add(h); }
  tool.position.set(.95, .02, 9.2); tool.rotation.y = .4;
  // the mailbox the house already has at the curb
  let mail = null; world.scene.traverse(o => { if (!mail && o.isGroup && Math.abs(o.position.x + 2.4) < .01 && Math.abs(o.position.z - 30.4) < .01) mail = o; });
  let last = -1;
  const set = ({fix: f = 0} = {}) => { if (Math.abs(f - last) < 1e-4) return; last = f;
    const g = ss(.15, .45, f), s = ss(.45, .68, f), m = ss(.7, .9, f);
    leftP.rotation.z = (1 - g) * .42; left.rotation.x = (1 - g) * .5; spout.visible = g > .98;
    crackA.visible = crackB.visible = gap.visible = s < .5; tread.visible = s >= .5; tread.position.y = .458 + (1 - s) * .25;
    ladder.visible = f > .08 && f < .55; tool.visible = f > .05 && f < .95;
    if (mail) { mail.rotation.z = (1 - m) * .34; mail.rotation.y = (1 - m) * .3; } };
  set({fix: 0});
  return {root, set};
}

// stumpGrind(world): an old cut stump in the side yard, ground out by a stump grinder. set({fix}): the grinder rolls in (.04-.2),
// its cutter wheel chews the stump and roots down into a pile of chips (.2-.62), the grinder backs away (.62-.74), the chips are
// raked into fresh soil (.72-.86) and new grass comes up over the spot (.86-1). exclude(x, z) keeps lawn blades off the spot.
export function stumpGrind(world, {x = -11.5, z = 3.2} = {}) {
  const root = new THREE.Group(); root.position.set(x, 0, z); world.scene.add(root);
  const mat = (c, ro = .8, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .5, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  let seed = 11; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const tex = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  // ---------- the stump: weathered bark, a grey cut face with rings and checks, roots into the lawn, suckers and mushrooms ----------
  const barkT = tex(256, 128, (g, w, h) => { g.fillStyle = "#6b5d4f"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const px = r() * w; g.fillStyle = `rgba(${r() < .5 ? "22,18,14" : "120,108,92"},${.25 + r() * .35})`; g.fillRect(px, 0, 1.5 + r() * 4, h); }
    for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(108,122,70,.35)"; g.beginPath(); g.ellipse(r() * w, h * (.55 + r() * .45), 6 + r() * 14, 3 + r() * 6, 0, 0, 7); g.fill(); } });
  barkT.wrapS = THREE.RepeatWrapping; barkT.repeat.set(3, 1);
  const ringT = tex(512, 512, (g, w, h) => { const c = w / 2; g.fillStyle = "#9c8a70"; g.fillRect(0, 0, w, h);
    for (let k = 1; k < 34; k++) { g.strokeStyle = `rgba(78,60,40,${.25 + (k % 3) * .12})`; g.lineWidth = 1.5 + (k % 4); g.beginPath();
      for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, rr = k * 7.2 * (1 + .04 * Math.sin(a * 3 + k)); g.lineTo(c + 12 + Math.cos(a) * rr, c - 8 + Math.sin(a) * rr); } g.stroke(); }
    const gr = g.createRadialGradient(c, c, 120, c, c, 256); gr.addColorStop(0, "rgba(130,124,114,0)"); gr.addColorStop(1, "rgba(118,112,104,.85)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(40,30,22,.8)"; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = r() * 6.28, r0 = 40 + r() * 80; g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a + .05) * 250, c + Math.sin(a + .05) * 250); g.stroke(); } });
  const barkM = mat(0xffffff, .95, 0, {map: barkT});
  const stump = new THREE.Group(); root.add(stump);
  add(new THREE.CylinderGeometry(.6, .74, .52, 22, 1, true), barkM, 0, .26, 0, stump);
  const face = add(new THREE.CircleGeometry(.6, 32), mat(0xffffff, .95, 0, {map: ringT}), 0, .52, 0, stump); face.rotation.set(-Math.PI / 2 + .05, 0, r() * 6);
  const roots = new THREE.Group(); root.add(roots);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + r() * .6, len = .45 + r() * .4, g = new THREE.Group(); g.rotation.y = -a; roots.add(g);
    const c = add(new THREE.CylinderGeometry(.02, .15, len, 9), barkM, .5 + len / 2, .0, 0, g); c.rotation.z = Math.PI / 2 + .22; c.scale.z = .55; }
  const leafM = mat(0x5c8a34, .7, 0, {side: THREE.DoubleSide});
  for (const [a, n] of [[.6, 7], [2.6, 5], [4.4, 6]]) for (let i = 0; i < n; i++) {
    const l = add(new THREE.SphereGeometry(.07, 7, 5), leafM, Math.cos(a) * .55 + (r() - .5) * .16, .55 + r() * .28, Math.sin(a) * .55 + (r() - .5) * .16, stump); l.scale.set(1, .35, .6); l.rotation.set(r(), r() * 3, r()); }
  for (const [a, s] of [[1.4, 1], [1.7, .7], [5.3, .85]]) { const mx = Math.cos(a) * .8, mz = Math.sin(a) * .8;
    add(new THREE.CylinderGeometry(.018 * s, .024 * s, .09 * s, 8), mat(0xe9e2d0, .8), mx, .045 * s, mz, stump);
    add(new THREE.SphereGeometry(.06 * s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xb4683a, .6), mx, .085 * s, mz, stump).scale.y = .6; }
  // ---------- chips, soil and new grass ----------
  const chipT = tex(512, 512, (g, w, h) => { g.fillStyle = "#7a5a3c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 6.28); g.fillStyle = ["#c7a274", "#a9824f", "#5a3f28", "#d9bf94", "#8c6a44"][i % 5]; g.fillRect(-4 - r() * 5, -1.5, 8 + r() * 10, 2.5 + r() * 2); g.restore(); } });
  chipT.wrapS = chipT.wrapT = THREE.RepeatWrapping; chipT.repeat.set(2, 2);
  const pile = add(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff, 1, 0, {map: chipT}), 0, 0, 0);
  { const p = pile.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const X = p.getX(i), Z = p.getZ(i), k = 1 + .08 * Math.sin(X * 9) * Math.sin(Z * 7); p.setXYZ(i, X * k, p.getY(i) * k, Z * k); } pile.geometry.computeVertexNormals(); }
  const soilT = tex(512, 512, (g, w, h) => { const gr = g.createRadialGradient(256, 256, 150, 256, 256, 256); gr.addColorStop(0, "rgba(70,52,36,1)"); gr.addColorStop(.85, "rgba(82,64,44,.9)"); gr.addColorStop(1, "rgba(82,64,44,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const a = r() * 6.28, rr = Math.sqrt(r()) * 230; g.fillStyle = ["rgba(40,28,18,.6)", "rgba(150,120,84,.5)", "rgba(196,170,126,.5)"][i % 3]; g.fillRect(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr, 2 + r() * 3, 2 + r() * 2); } });
  const soilM = mat(0xffffff, 1, 0, {map: soilT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
  const soil = add(new THREE.CircleGeometry(1.5, 40), soilM, 0, .012, 0); soil.rotation.x = -Math.PI / 2; soil.castShadow = false; soil.renderOrder = 2;
  const N = 1300, blade = new THREE.PlaneGeometry(.045, .15); blade.translate(0, .075, 0); { const bp = blade.attributes.position; for (let i = 0; i < bp.count; i++) if (bp.getY(i) > .1) bp.setX(i, bp.getX(i) * .08); }
  const sprouts = new THREE.InstancedMesh(blade, mat(0x6fa53a, .8, 0, {side: THREE.DoubleSide}), N); sprouts.castShadow = false; sprouts.receiveShadow = true; root.add(sprouts);
  const SP = []; for (let i = 0; i < N; i++) { const a = r() * 6.28, rr = Math.sqrt(r()) * 1.42; SP.push([Math.cos(a) * rr, Math.sin(a) * rr, r() * 6.28, (.55 + r() * .6) * (rr > 1.1 ? .75 : 1), r()]); sprouts.setColorAt(i, new THREE.Color().setHSL(.22 + r() * .04, .42, .3 + r() * .14)); }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E3 = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
  // ---------- the stump grinder: orange body, engine, two wheels, handlebars and a toothed cutter wheel on a swinging boom ----------
  const orange = mat(0xe36d1b, .45, .2), dark = mat(0x26282b, .6, .3), steel = mat(0xb9bcbf, .3, .85), rubber = mat(0x1a1a1a, .9);
  const gr = new THREE.Group(); root.add(gr);
  add(new THREE.BoxGeometry(.62, .34, 1.0), orange, 0, .42, .2, gr);
  add(new THREE.BoxGeometry(.42, .34, .44), dark, 0, .76, .38, gr); add(new THREE.CylinderGeometry(.05, .05, .2, 10), steel, .14, 1.0, .5, gr);
  for (const sx of [-1, 1]) { const w = add(new THREE.CylinderGeometry(.24, .24, .14, 22), rubber, sx * .4, .24, .45, gr); w.rotation.z = Math.PI / 2; const hub = add(new THREE.CylinderGeometry(.1, .1, .15, 14), steel, sx * .4, .24, .45, gr); hub.rotation.z = Math.PI / 2; }
  for (const sx of [-1, 1]) { const h = add(new THREE.CylinderGeometry(.022, .022, .76, 8), dark, sx * .2, .8, .96, gr); h.rotation.x = .83; }
  { const h = add(new THREE.CylinderGeometry(.026, .026, .5, 8), dark, 0, 1.06, 1.24, gr); h.rotation.z = Math.PI / 2; }
  const boom = new THREE.Group(); boom.position.set(0, .5, -.25); gr.add(boom);
  add(new THREE.BoxGeometry(.16, .14, 1.0), orange, 0, 0, -.45, boom);
  const wheel = new THREE.Group(); wheel.position.set(.12, -.05, -.95); boom.add(wheel);
  { const d = add(new THREE.CylinderGeometry(.3, .3, .05, 28), steel, 0, 0, 0, wheel); d.rotation.z = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, t = add(new THREE.BoxGeometry(.08, .07, .05), dark, 0, Math.cos(a) * .32, Math.sin(a) * .32, wheel); t.rotation.x = -a; } }
  { const gd = add(new THREE.CylinderGeometry(.36, .36, .14, 24, 1, true, 0, Math.PI), orange, .12, -.02, -.95, boom); gd.rotation.set(0, 0, Math.PI / 2); gd.material = orange.clone(); gd.material.side = THREE.DoubleSide; }
  // flying chips while it cuts
  const chips = []; const chipM = mat(0xc7a274, .9);
  for (let i = 0; i < 36; i++) { const c = add(new THREE.BoxGeometry(.05, .012, .03), chipM, 0, 0, 0); c.castShadow = false; chips.push([c, r() * 6.28, .8 + r() * .9, r(), r() * 6.28]); }
  let fix = -1, tt = 0, cutting = false;
  const spray = (time) => { const wp = new THREE.Vector3(); wheel.getWorldPosition(wp); root.worldToLocal(wp);
    for (const [c, a, v, ph, sp] of chips) { if (!cutting) { c.visible = false; continue; } const p = (time * 1.6 + ph) % 1; c.visible = true;
      c.position.set(wp.x + Math.cos(a) * v * p * .9, wp.y + 1.6 * p - 2.2 * p * p, wp.z + Math.abs(Math.sin(a)) * v * p * .9 + .15); c.rotation.set(sp + time * 9, sp, time * 7); } };
  world.onTick.push((t, dt) => { tt += dt; if (!cutting) return; wheel.rotation.x -= dt * 22; spray(tt); });
  const set = ({fix: f = 0} = {}) => { if (Math.abs(f - fix) < 1e-4) return; fix = f;
    const g = ss(.2, .62, f), rake = ss(.72, .86, f), grow = ss(.86, 1, f);
    stump.visible = g < .98; stump.scale.set(1, Math.max(.02, 1 - g), 1); roots.visible = g < .9; roots.scale.set(1 - g * .5, Math.max(.05, 1 - g * 1.1), 1 - g * .5);
    const vol = Math.min(1, g * 1.15) * (1 - rake); pile.visible = vol > .02; pile.scale.set(.5 + .9 * Math.sqrt(Math.max(vol, .01)), .5 * vol + .02, .5 + .9 * Math.sqrt(Math.max(vol, .01)));
    soil.visible = g > .3 && grow < .99; soilM.opacity = Math.min(1, (g - .3) * 3) * (1 - grow);
    const n = grow > .01 ? N : 0; sprouts.count = n;
    for (let i = 0; i < n; i++) { const [px, pz, ry, h, d] = SP[i]; const k = Math.min(1, Math.max(0, grow * 1.6 - d * .6)); Q.setFromEuler(E3.set((d - .5) * .4, ry, 0)); M4.compose(V3.set(px, 0, pz), Q, S3.set(1, Math.max(.001, k * h), 1)); sprouts.setMatrixAt(i, M4); }
    sprouts.instanceMatrix.needsUpdate = true; if (sprouts.instanceColor) sprouts.instanceColor.needsUpdate = true;
    const inn = ss(.04, .2, f), out = ss(.62, .74, f); gr.visible = f > .04 && f < .74;
    gr.position.set(.1, 0, 1.45 + (1 - inn) * 5 + out * 5); gr.rotation.y = out * .5;
    boom.rotation.x = .1 - Math.min(1, g * 1.2) * .1; boom.rotation.y = Math.sin(g * Math.PI * 5) * .3 * (g > 0 && g < 1 ? 1 : 0);
    wheel.position.y = -.05 - g * .45 + .15 * (1 - inn);
    cutting = f > .2 && f < .62; wheel.rotation.x = -f * 60; spray(f * 23); };
  set({fix: 0});
  return {root, set, exclude: (px, pz) => Math.hypot(px - x, pz - z) < 1.45};
}

// towJob(world, {sign}): a broken-down pickup at the curb (hood up, hazards on) and a rollback tow truck with the business name
// on its doors. set({fix}): the truck pulls in ahead (0-.18), the bed slides back (.18-.28) and tilts to the road (.28-.38),
// the winch pulls the pickup up (.38-.68), the bed tilts back (.68-.78) and slides home (.78-.88), then it's strapped down.
export async function towJob(world, {sign = "", font, x = 0, z = 35.4, ry = Math.PI / 2} = {}) {
  const {makeTruck} = await import("./garage.js");
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; world.scene.add(G);
  const mat = (c, ro = .6, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .6, ...o});
  const add = (geo, m, px, py, pz, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const tex = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  // ---------- the customer's pickup: hood up, hazards blinking ----------
  const car = makeTruck(world, {color: 0x2f5d8a, lights: false}); G.add(car.car);
  const hazM = mat(0xffa21a, .4, 0, {emissive: 0xff8a00, emissiveIntensity: 2.2});
  const haz = [[1, 2.72], [-1, 2.72], [1, -2.72], [-1, -2.72]].map(([sx, sz]) => box(.18, .1, .05, hazM, sx * .78, .95, sz, car.car));
  // ---------- the rollback: cab, frame, three axles, a bed that slides and tilts ----------
  const T = new THREE.Group(); G.add(T);
  const paint = new THREE.MeshPhysicalMaterial({color: 0xf3f3ef, metalness: .15, roughness: .35, clearcoat: .7, clearcoatRoughness: .1, envMapIntensity: .6});
  const accent = new THREE.MeshPhysicalMaterial({color: 0xc8261b, metalness: .2, roughness: .4, clearcoat: .6, envMapIntensity: .6});
  const glass = new THREE.MeshPhysicalMaterial({color: 0x0b1013, metalness: .1, roughness: .08, clearcoat: 1, envMapIntensity: .9});
  const dark = mat(0x1b1d20, .75), rubber = mat(0x111214, .93), chrome = mat(0xd8dde2, .25, .9), steel = mat(0x5d6268, .5, .7);
  for (const sx of [-.45, .45]) box(.2, .26, 9, dark, sx, .8, -.3, T);
  const wheel = (wx, wz, dual) => { const g = new THREE.Group(); g.position.set(wx, .52, wz); T.add(g);
    const tyre = add(new THREE.CylinderGeometry(.52, .52, dual ? .62 : .34, 28), rubber, 0, 0, 0, g); tyre.rotation.z = Math.PI / 2;
    const hub = add(new THREE.CylinderGeometry(.3, .3, (dual ? .62 : .34) + .02, 20), chrome, 0, 0, 0, g); hub.rotation.z = Math.PI / 2; };
  for (const s of [-1, 1]) { wheel(s * 1.0, 3.15, false); wheel(s * .98, -1.85, true); wheel(s * .98, -3.15, true); }
  // cab
  box(2.3, 1.05, 2.2, paint, 0, 1.45, 2.75, T); box(2.16, .8, 1.35, paint, 0, 1.3, 4.5, T); box(2.36, .5, .9, paint, 0, 1.05, 3.2, T);
  box(1.9, .62, .06, chrome, 0, 1.3, 5.19, T); for (let i = 0; i < 5; i++) box(1.8, .03, .07, dark, 0, 1.08 + i * .11, 5.2, T);
  box(2.4, .3, .3, chrome, 0, .68, 5.3, T);
  const headM = mat(0xfff6dc, .2, 0, {emissive: 0xfff0c8, emissiveIntensity: .8}); for (const s of [-1, 1]) box(.36, .2, .05, headM, s * .82, 1.42, 5.19, T);
  box(2.18, .64, 1.7, glass, 0, 2.3, 2.6, T); box(2.24, .12, 1.88, paint, 0, 2.66, 2.58, T);
  for (const [px, pz] of [[1.09, 3.42], [-1.09, 3.42], [1.09, 1.75], [-1.09, 1.75]]) box(.06, .66, .1, paint, px, 2.3, pz, T);
  box(2.3, .07, .08, accent, 0, 1.95, 2.75, T); for (const s of [-1, 1]) box(.02, .14, 2.22, accent, s * 1.155, 1.0, 2.75, T);
  for (const s of [-1, 1]) { box(.1, .3, .14, dark, s * 1.25, 2.25, 3.4, T); box(.04, .22, .3, chrome, s * 1.3, 2.25, 3.55, T); }
  // fenders over the front wheels and the rear duals
  for (const s of [-1, 1]) { box(.42, .14, 1.4, dark, s * 1.0, 1.12, 3.15, T); box(.62, .1, 2.6, dark, s * .98, 1.12, -2.5, T); }
  // light bar and exhaust stack
  box(1.7, .08, .3, dark, 0, 2.76, 2.35, T); const barM = mat(0xffb21a, .3, 0, {emissive: 0xff9000, emissiveIntensity: 0}); const bar = box(1.6, .12, .24, barM, 0, 2.86, 2.35, T);
  const stack = add(new THREE.CylinderGeometry(.07, .07, 1.6, 12), chrome, -1.0, 2.0, 1.45, T);
  // the name on both doors
  if (sign) { const st = await signTexture(sign, "", {fg: "#172033", bg: null, font, w: 1024, h: 340});
    const m = new THREE.MeshStandardMaterial({map: st, transparent: true, roughness: .5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .56), m); p.position.set(s * 1.157, 1.45, 2.72); p.rotation.y = s * Math.PI / 2; T.add(p); } }
  // subframe and the bed (origin at its front top edge; the deck runs back along -z)
  box(1.6, .2, 6, steel, 0, 1.03, -1.3, T);
  const B = new THREE.Group(); T.add(B); const DL = 6.6;
  const treadT = tex(256, 256, (g, w, h) => { g.fillStyle = "#7c8187"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(220,225,230,.55)"; g.lineWidth = 3;
    for (let yy = 0; yy < h; yy += 32) for (let xx = (yy / 32) % 2 * 16; xx < w; xx += 32) { g.beginPath(); g.moveTo(xx - 6, yy - 6); g.lineTo(xx + 6, yy + 6); g.stroke(); } });
  treadT.wrapS = treadT.wrapT = THREE.RepeatWrapping; treadT.repeat.set(3, 8);
  box(2.4, .16, DL, mat(0xffffff, .45, .6, {map: treadT}), 0, -.08, -DL / 2, B);
  for (const s of [-1, 1]) box(.12, .26, DL, accent, s * 1.2, -.05, -DL / 2, B);
  const stripeT = tex(256, 32, (g, w, h) => { for (let i = -2; i < 18; i++) { g.fillStyle = i % 2 ? "#c8261b" : "#f3f3ef"; g.beginPath(); g.moveTo(i * 16, h); g.lineTo(i * 16 + 16, h); g.lineTo(i * 16 + 32, 0); g.lineTo(i * 16 + 16, 0); g.fill(); } });
  const rear = add(new THREE.PlaneGeometry(2.4, .26), mat(0xffffff, .5, 0, {map: stripeT}), 0, -.05, -DL - .005, B); rear.rotation.y = Math.PI;
  for (const s of [-1, 1]) box(.22, .1, .04, mat(0xd01010, .3, 0, {emissive: 0xa00000, emissiveIntensity: .8}), s * .95, -.06, -DL - .02, B);
  // headboard with a grid, winch drum at its foot
  for (const s of [-1, 1]) box(.12, 1.4, .12, accent, s * 1.12, .7, -.12, B); box(2.36, .12, .12, accent, 0, 1.4, -.12, B);
  for (let i = 1; i < 6; i++) box(.05, 1.3, .05, steel, -1.1 + i * .366, .68, -.12, B); for (let i = 1; i < 4; i++) box(2.2, .04, .04, steel, 0, i * .33, -.12, B);
  const drum = add(new THREE.CylinderGeometry(.16, .16, .9, 16), dark, 0, .2, -.4, B); drum.rotation.z = Math.PI / 2;
  // winch cable and tie-down straps
  const cable = add(new THREE.CylinderGeometry(.018, .018, 1, 6), dark, 0, 0, 0, G); cable.castShadow = false;
  const strapM = mat(0xf0b400, .7); const straps = [];
  for (const sz of [1.66, -1.52]) for (const s of [-1, 1]) { const st = box(.07, .7, .02, strapM, s * .98, .35, sz, car.car); st.rotation.x = .35 * (sz > 0 ? 1 : -1); straps.push(st); }
  // geometry of the move, in the frame of G (front of the tow truck toward +z)
  const FZ = 1.6, FY0 = 1.25, PHI = .235, S_END = 3.5, S0 = -3.4;
  const rearAt = (sl, lift, phi, tz) => ({z: tz + FZ - sl - DL * Math.cos(phi), y: FY0 + lift - DL * Math.sin(phi)});
  const R1 = rearAt(2.3, .3, PHI, 0);
  let fixT = -1, lastSh = -1; const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  function set({fix = 0, t = 0} = {}) {
    fixT = fix; const f = fix;
    const arrive = ss(0, .18, f), sl = 2.3 * ss(.18, .28, f) * (1 - ss(.78, .88, f)), lift = .3 * ss(.18, .24, f) * (1 - ss(.82, .88, f));
    const phi = PHI * ss(.28, .38, f) * (1 - ss(.68, .78, f)), w = ss(.38, .68, f);
    const tz = 24 * (1 - arrive); T.position.z = tz; T.visible = f > .005;
    B.position.set(0, FY0 + lift, FZ - sl); B.rotation.x = -phi;
    car.set({hood: 1 - ss(.05, .16, f)});  // (resets the pickup's height, so before placing it)
    // the pickup: on the road behind the bed until the winch pulls it up, then riding the deck
    const s = S0 + (S_END - S0) * w, R = rearAt(sl, lift, phi, tz);
    if (s < 0) { car.car.position.set(0, 0, R1.z + s); car.car.rotation.x = 0; }
    else { const k = Math.min(1, s / 1.2); car.car.position.set(0, (R.y + s * Math.sin(phi)) * k + (1 - k) * 0 + .02, R.z + s * Math.cos(phi)); car.car.rotation.x = -phi * k; }
    const on = f < .88, blink = on && (Math.floor(t * 1.6) % 2 === 0); haz.forEach(h => h.visible = blink || t === 0 && on);
    barM.emissiveIntensity = f > .1 ? 2.4 : 0;
    if (Math.abs(f - lastSh) > .004 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
    straps.forEach(st => st.visible = f > .9);
    cable.visible = f > .3 && f < .9;
    if (cable.visible) { B.updateMatrixWorld(true); car.car.updateMatrixWorld(true); G.updateMatrixWorld(true);
      vA.set(0, .22, -.45); B.localToWorld(vA); G.worldToLocal(vA); vB.set(0, .55, 2.8); car.car.localToWorld(vB); G.worldToLocal(vB);
      cable.position.copy(vA).add(vB).multiplyScalar(.5); cable.scale.y = vA.distanceTo(vB); cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vB.clone().sub(vA).normalize()); }
  }
  set({fix: 0});
  return {root: G, set, get fix() { return fixT; }};
}

// mowerFix(world): a riding mower that won't run, in the driveway: hood up, a flat front tire, an old plug, a clogged filter and a
// dull blade laid out on a tarp. set({fix}): the tire comes back up (.05-.3), the parts go in and the tarp clears (.3-.6),
// the hood closes (.6-.7), then the mower drives off the drive onto the lawn (.72-1).
export function mowerFix(world, {x = 9.6, z = 22} = {}) {
  const root = new THREE.Group(); root.position.set(x, 0, z); world.scene.add(root);
  const M = new THREE.Group(); root.add(M);
  const mat = (c, ro = .6, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .6, ...o});
  const add = (geo, m, px, py, pz, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const paint = new THREE.MeshPhysicalMaterial({color: 0xb8231a, metalness: .2, roughness: .38, clearcoat: .6, clearcoatRoughness: .15, envMapIntensity: .6});
  const blk = mat(0x1a1b1d, .7), rub = mat(0x121314, .92), steel = mat(0x8d9298, .45, .8), grey = mat(0x4a4d52, .6, .4), cream = mat(0xe8e1cf, .6);
  // the mower (front toward +z): deck, rear body and fenders, seat, steering, wheels
  box(1.12, .1, .62, grey, 0, .2, .05, M); box(1.16, .05, .66, steel, 0, .26, .05, M);
  box(.98, .3, .95, paint, 0, .52, -.42, M); box(1.1, .06, .5, paint, 0, .7, -.55, M); box(.6, .18, .6, blk, 0, .4, .25, M);
  box(.5, .1, .45, blk, 0, .78, -.42, M); const back = box(.5, .38, .08, blk, 0, .98, -.66, M); back.rotation.x = -.18;
  const col = add(new THREE.CylinderGeometry(.03, .03, .55, 8), blk, 0, .82, .12, M); col.rotation.x = -.5;
  const sw = add(new THREE.TorusGeometry(.17, .025, 8, 24), blk, 0, 1.06, .02, M); sw.rotation.x = Math.PI / 2 - .5;
  const wheel = (wx, wz, r, w) => { const g = new THREE.Group(); g.position.set(wx, r, wz); M.add(g);
    const t = add(new THREE.CylinderGeometry(r, r, w, 22), rub, 0, 0, 0, g); t.rotation.z = Math.PI / 2;
    const h = add(new THREE.CylinderGeometry(r * .55, r * .55, w + .01, 16), cream, 0, 0, 0, g); h.rotation.z = Math.PI / 2; return g; };
  box(.84, .06, .07, blk, 0, .2, .72, M); box(.1, .14, .5, blk, 0, .28, .5, M); wheel(.56, -.55, .3, .24); wheel(-.56, -.55, .3, .24); const fl = wheel(.42, .72, .18, .13); wheel(-.42, .72, .18, .13);
  // engine under a hood that tilts forward
  box(.46, .3, .4, grey, 0, .55, .62, M); const filt = add(new THREE.CylinderGeometry(.1, .1, .08, 16), mat(0x2a2a2a, .8), .08, .75, .6, M);
  const filterTop = add(new THREE.CylinderGeometry(.09, .09, .02, 16), mat(0x6b5a3a, .95), .08, .8, .6, M);
  const plugWire = add(new THREE.CylinderGeometry(.012, .012, .3, 6), mat(0x2f2f2f, .6), -.15, .72, .55, M); plugWire.rotation.z = 1.2;
  const HP = new THREE.Group(); HP.position.set(0, .44, 1.0); M.add(HP);
  box(.7, .36, .78, mat(0xb8231a, .5, .15), 0, .2, -.4, HP); box(.5, .2, .03, blk, 0, .18, .005, HP);
  for (let i = 0; i < 5; i++) box(.46, .015, .035, grey, 0, .1 + i * .04, .02, HP);
  const lampM = mat(0xfff6dc, .2, 0, {emissive: 0xfff0c8, emissiveIntensity: 0}); for (const s of [-1, 1]) box(.12, .06, .02, lampM, s * .2, .33, .005, HP);
  // the tarp beside it with the old parts and a few tools
  const T = new THREE.Group(); T.position.set(1.4, .045, .1); root.add(T);
  const tarp = add(new THREE.PlaneGeometry(1.3, 1.6), mat(0x2f5f9a, .85, 0, {side: THREE.DoubleSide}), 0, .012, 0, T); tarp.rotation.x = -Math.PI / 2; tarp.rotation.z = .08;
  const parts = new THREE.Group(); T.add(parts);
  const blade = box(.08, .015, 1.0, steel, -.3, .03, .1, parts); blade.rotation.y = .3;
  add(new THREE.CylinderGeometry(.1, .1, .08, 16), mat(0x5a4a30, .95), .25, .055, .45, parts);
  const plug = add(new THREE.CylinderGeometry(.015, .015, .09, 8), cream, .1, .03, -.3, parts); plug.rotation.z = Math.PI / 2;
  const wr = box(.04, .015, .3, steel, .3, .03, -.1, parts); wr.rotation.y = -.6;
  const can = new THREE.Group(); can.position.set(.35, 0, -.6); T.add(can); box(.26, .3, .18, paint, 0, .15, 0, can); add(new THREE.CylinderGeometry(.025, .025, .14, 8), blk, .1, .34, 0, can).rotation.z = -.6;
  const tb = new THREE.Group(); tb.position.set(-.1, 0, -.55); T.add(tb); box(.5, .22, .24, mat(0x1d1f22, .5, .3), 0, .11, 0, tb); box(.46, .04, .03, steel, 0, .24, 0, tb);
  let fixT = -1, lastSh = -1;
  function set({fix = 0} = {}) {
    if (fix === fixT) return; fixT = fix; const f = fix;
    const flat = 1 - ss(.05, .3, f); fl.scale.set(1, 1 - .28 * flat, 1 - .1 * flat); fl.position.y = .18 * (1 - .28 * flat); M.rotation.z = .025 * flat; M.position.y = -.025 * flat;
    const out = ss(.3, .6, f); parts.visible = out < .98; parts.position.y = -out * .05; parts.scale.setScalar(1 - .6 * out);
    filterTop.material.color.setHex(f > .45 ? 0xf0ede4 : 0x6b5a3a);
    HP.rotation.x = .95 * (1 - ss(.6, .7, f));
    const go = ss(.72, 1, f); M.position.x = -4.6 * go; M.position.z = 1.6 * Math.sin(go * Math.PI / 2); M.rotation.y = -Math.PI / 2 * ss(.72, .9, f);
    tarp.visible = f < .96; T.position.y = .045; lampM.emissiveIntensity = f > .7 ? 1.4 : 0;
    if (Math.abs(f - lastSh) > .004 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, exclude: (px, pz) => false};
}

// weldGate(world): a steel double gate across the end of the drive. Before: rusted, the right leaf sagging to the ground with
// its brace snapped and a picket lying in the gravel. set({fix}): the leaf is jacked level (.05-.3), the picket goes back (.3-.4),
// the welder works the joints with sparks and an arc glow (.4-.7), fresh black paint (.7-.85), then both leaves swing open (.88-1).
export function weldGate(world, {z = 30.2, xa = 6.45, xb = 12.55} = {}) {
  const root = new THREE.Group(); world.scene.add(root);
  const mat = (c, ro = .6, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .6, ...o});
  const add = (geo, m, px, py, pz, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const RUST = new THREE.Color(0xffffff), BLACK = new THREE.Color(0x1c1d1f);
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g2 = cv.getContext("2d"); g2.fillStyle = "#6a4a36"; g2.fillRect(0, 0, 128, 128);
  { let sd = 9; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 90; k++) { g2.fillStyle = ["rgba(176,92,40,.7)", "rgba(60,52,48,.6)", "rgba(140,70,34,.6)", "rgba(96,88,80,.5)"][k % 4]; g2.beginPath(); g2.ellipse(rr() * 128, rr() * 128, 2 + rr() * 9, 1 + rr() * 5, rr() * 3, 0, 7); g2.fill(); } }
  const rustT = new THREE.CanvasTexture(cv); rustT.colorSpace = THREE.SRGBColorSpace; rustT.wrapS = rustT.wrapT = THREE.RepeatWrapping;
  const gm = mat(0xffffff, .92, .25, {map: rustT}), post = mat(0x3a3b3d, .7, .5), conc = mat(0xb9b4aa, .9);
  for (const px of [xa, xb]) { box(.16, 1.7, .16, gm, px, .85, z, root); box(.22, .04, .22, gm, px, 1.72, z, root); add(new THREE.CylinderGeometry(.3, .3, .06, 16), conc, px, .03, z, root); }
  const W = (xb - xa) / 2 - .12, H = 1.25;
  const leaf = (hx, dir) => { const L = new THREE.Group(); L.position.set(hx + dir * .1, .18, z); root.add(L);
    const P = [];
    box(W, .06, .06, gm, dir * W / 2, H, 0, L); box(W, .06, .06, gm, dir * W / 2, 0, 0, L); box(W, .04, .04, gm, dir * W / 2, H * .5, 0, L);
    box(.06, H + .06, .06, gm, 0, H / 2, 0, L); box(.06, H + .06, .06, gm, dir * W, H / 2, 0, L);
    for (let i = 1; i < 8; i++) P.push(box(.025, H, .025, gm, dir * W * i / 8, H / 2, 0, L));
    const br = box(.04, Math.hypot(W, H) * .96, .04, gm, dir * W / 2, H / 2, 0, L); br.rotation.z = -dir * Math.atan2(W, H);
    for (const y of [.15, H - .15]) { const h = add(new THREE.CylinderGeometry(.045, .045, .14, 10), post, -dir * .06, y, 0, L); }
    return {L, P, br}; };
  const A = leaf(xa, 1), B = leaf(xb, -1);
  // the snapped brace (two halves) and a picket fallen in the drive
  const brT = B.br; const brA = box(.04, 1.1, .04, gm, 0, 0, 0, B.L), brB = box(.04, .9, .04, gm, 0, 0, 0, B.L);
  brA.position.set(-W * .78, H * .78, 0); brA.rotation.z = Math.atan2(W, H) + .25; brB.position.set(-W * .22, H * .25, .02); brB.rotation.z = Math.atan2(W, H) - .35;
  const pk = B.P[2]; const pkHome = pk.position.clone();
  // the welder's cart, the lead to the torch, sparks and the arc glow
  const C = new THREE.Group(); C.position.set(10.4, 0, z + 1.3); root.add(C);
  box(.55, .5, .7, mat(0x2d5d8a, .45, .3), 0, .55, 0, C); box(.5, .08, .66, post, 0, .27, 0, C); for (const s of [-1, 1]) { const w = add(new THREE.CylinderGeometry(.11, .11, .06, 14), mat(0x121314, .9), s * .3, .11, -.25, C); w.rotation.z = Math.PI / 2; }
  box(.5, .02, .02, post, 0, .95, .34, C); add(new THREE.CylinderGeometry(.11, .11, .9, 14), mat(0x6b7f4a, .5, .3), .05, .75, -.5, C);
  const lead = add(new THREE.CylinderGeometry(.018, .018, 1, 6), mat(0x151515, .8), 0, 0, 0, root); lead.castShadow = false;
  const J = new THREE.Vector3(xb - .1 - W * .5, .18 + H * .5, z + .05);
  const SP = new THREE.Group(); SP.position.copy(J); root.add(SP);
  const spM = mat(0xffd27a, .3, 0, {emissive: 0xffa020, emissiveIntensity: 4}); let seed = 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, d = .05 + r() * .5, s = box(.012, .012, .05 + r() * .12, spM, Math.cos(a) * d * .8, -r() * .5 + Math.sin(a) * d * .3, .05 + r() * .35, SP); s.lookAt(SP.position.clone().multiplyScalar(0)); s.castShadow = false; }
  const core = add(new THREE.SphereGeometry(.05, 12, 8), mat(0xffffff, .2, 0, {emissive: 0xd8ecff, emissiveIntensity: 6}), 0, 0, .03, SP); core.castShadow = false;
  const glow = new THREE.PointLight(0x9fc8ff, 0, 5, 2); glow.position.set(0, .1, .3); SP.add(glow);
  const torch = box(.05, .05, .3, post, .08, .05, .2, SP); torch.rotation.x = -.6;
  let fixT = -1, lastSh = -1; const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  function set({fix = 0, t = 0} = {}) {
    if (fix === fixT && !(fix > .4 && fix < .7)) return; fixT = fix; const f = fix;
    const sag = 1 - ss(.05, .3, f); B.L.rotation.z = -.13 * sag;
    const pb = ss(.3, .4, f); pk.position.set(pkHome.x + .25 * (1 - pb), pkHome.y * pb - .17 * (1 - pb), pkHome.z + .5 * (1 - pb)); pk.rotation.set((1 - pb) * Math.PI / 2, 0, (1 - pb) * .4);
    const fixed = f > .55; brT.visible = fixed; brA.visible = brB.visible = !fixed;
    const weld = f > .4 && f < .7; SP.visible = weld; glow.intensity = weld ? 6 + 2 * Math.sin(t * 40) : 0;
    SP.scale.setScalar(weld ? .9 + .15 * Math.sin(t * 23) : 1);
    const pnt = ss(.7, .85, f); gm.color.copy(RUST).lerp(BLACK, pnt); gm.roughness = .92 - .5 * pnt; gm.metalness = .25 + .2 * pnt;
    const wantMap = pnt < .5 ? rustT : null; if (gm.map !== wantMap) { gm.map = wantMap; gm.needsUpdate = true; } if (!wantMap) gm.color.copy(BLACK).lerp(new THREE.Color(0x3a3530), 1 - pnt);
    const open = ss(.88, 1, f); A.L.rotation.y = 1.15 * open; B.L.rotation.y = -1.15 * open;
    C.visible = f > .08 && f < .86; lead.visible = weld;
    if (weld) { vA.set(10.4, .85, z + 1.0); vB.copy(J).add(new THREE.Vector3(.08, .05, .35)); lead.position.copy(vA).add(vB).multiplyScalar(.5); lead.scale.y = vA.distanceTo(vB); lead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vB.clone().sub(vA).normalize()); }
    if (Math.abs(f - lastSh) > .004 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, exclude: (px, pz) => false};
}

// roofJob(world, house): an old, worn shingle roof (curled and missing tabs, moss, a blue tarp over a leak) is torn off from the
// ridge down into a roll-off dumpster in the drive, the deck shows, then new charcoal shingles go on from the eaves up.
// set({fix}): 0..1. Needs the finished house (setProgress(1)); the house's own roof skins are hidden and replaced by two layers.
export function roofJob(world, house) {
  const root = new THREE.Group(); world.scene.add(root);
  world.R.localClippingEnabled = true;
  const mat = (c, ro = .6, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .5, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  let seed = 11; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // shingle canvases: 1024 x 512 covers 6 m along the eave by 3 m up the slope (tabs 1 m wide, 14 cm courses)
  const shingles = (old) => { const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512; const g = cv.getContext("2d");
    g.fillStyle = old ? "#6e665c" : "#34373b"; g.fillRect(0, 0, 1024, 512);
    const rowH = 512 / 21, tabW = 1024 / 18;
    for (let row = 0; row < 22; row++) { const y = row * rowH, off = (row % 2) * tabW * .5;
      for (let k = -1; k < 19; k++) { const x = k * tabW + off, v = r();
        g.fillStyle = old ? `hsl(${30 + v * 8},${7 + v * 6}%,${34 + v * 9}%)` : `hsl(210,${3 + v * 4}%,${17 + v * 9}%)`; g.fillRect(x + 1, y + 1, tabW - 2, rowH - 2);
        for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < .5 ? "0,0,0" : "255,255,255"},${old ? .1 : .07})`; g.fillRect(x + r() * tabW, y + r() * rowH, 2, 2); }
        if (old && v > .965) { g.fillStyle = "#1c1a18"; g.fillRect(x + 1, y + 1, tabW - 2, rowH - 2); }   // missing tab: black tar paper
        else if (old && v > .88) { g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x + 1, y + rowH - 6, tabW - 2, 4); } }   // curled edge catching light
      g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, y + rowH - 2, 1024, 2); }
    if (old) { for (let i = 0; i < 16; i++) { const x = r() * 1024, y = r() * 512, gr = g.createRadialGradient(x, y, 0, x, y, 10 + r() * 34);
        gr.addColorStop(0, "rgba(78,96,46,.42)"); gr.addColorStop(1, "rgba(70,88,40,0)"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512); }   // moss
      for (let i = 0; i < 14; i++) { const x = r() * 1024, gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(20,18,14,.0)"); gr.addColorStop(1, "rgba(20,18,14,.18)"); g.fillStyle = gr; g.fillRect(x, 0, 18 + r() * 40, 512); } }   // streaks
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const oldT = shingles(true), newT = shingles(false);
  const oldPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100), newPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
  const lay = [];
  house.root.updateMatrixWorld(true);
  const skins = []; house.root.traverse(o => { if (o.isMesh && o.userData.seams && (o.material === house.M.roof || o.material === house.M.wingRoof)) skins.push(o); });
  const bb = new THREE.Box3(); skins.forEach(o => bb.expandByObject(o));
  for (const o of skins) {
    const p = o.geometry.parameters, along = o.userData.seams, len = along === "x" ? p.width : p.depth, up = (along === "x" ? p.depth : p.width) * 1;
    for (const [tex, plane, lift] of [[newT, newPlane, .012], [oldT, oldPlane, .03]]) {
      const t = tex.clone(); t.needsUpdate = true; t.repeat.set(len / 6, up / 3); if (along === "z") { t.center.set(.5, .5); t.rotation = Math.PI / 2; t.repeat.set(up / 3, len / 6); }
      const m = new THREE.Mesh(o.geometry, new THREE.MeshStandardMaterial({map: t, roughness: .95, envMapIntensity: .3, clippingPlanes: [plane], clipShadows: true}));
      m.matrixAutoUpdate = false; m.matrix.copy(o.matrixWorld); m.matrix.multiply(new THREE.Matrix4().makeTranslation(0, lift / o.scale.y, 0)); m.castShadow = m.receiveShadow = true; root.add(m); lay.push(m); }
    o.visible = false; }
  // a blue tarp over a leak on the front slope of the main roof, torn off with the old layer
  const main = skins.find(o => o.userData.seams === "x" && new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).z > 0);
  const onRoof = (obj) => { obj.updateMatrix(); const w = obj; w.matrixAutoUpdate = false; w.matrix.premultiply(main.matrixWorld); root.add(w); return w; };
  if (main) { const tarp = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9, 8, 6), mat(0x2f6fc0, .7, 0, {clippingPlanes: [oldPlane], side: THREE.DoubleSide}));
    const pp = tarp.geometry.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, (1 + Math.sin(pp.getX(i) * 3.1) * Math.cos(pp.getY(i) * 2.7)) * .012); tarp.geometry.computeVertexNormals();
    tarp.rotation.x = -Math.PI / 2; tarp.position.set(-2.2, .052 / main.scale.y, .3); tarp.scale.set(1, 1, 1 / main.scale.y); onRoof(tarp); tarp.castShadow = true; }
  // roll-off dumpster in the drive and a ladder at the front eave
  const DX = 9.6, DZ = 17.5, green = mat(0x2f5a3c, .55, .3), dk = mat(0x22262a, .6, .4);
  const dump = new THREE.Group(); dump.position.set(DX, 0, DZ); root.add(dump);
  box(2.3, .12, 5.6, dk, 0, .18, 0, dump); box(2.3, 1.3, .08, green, 0, .9, 2.76, dump); box(2.3, 1.3, .08, green, 0, .9, -2.76, dump); for (const s of [1, -1]) { box(.08, 1.3, 5.6, green, s * 1.11, .9, 0, dump); for (let k = -2; k <= 2; k++) box(.1, 1.3, .1, green, s * 1.16, .9, k * 1.2, dump); }
  box(2.2, .06, 5.5, mat(0x3a3530, .9), 0, .3, 0, dump);
  const debris = new THREE.Group(); dump.add(debris);
  for (let i = 0; i < 70; i++) { const s = box(.9 + r() * .5, .04, .35 + r() * .2, mat([0x6e665c, 0x5a5249, 0x7a7064, 0x1c1a18][i % 4], .95), (r() - .5) * 1.5, .4 + (i / 70) * 1.25 + r() * .2, (r() - .5) * 4.6, debris); s.rotation.set((r() - .5) * .9, r() * 3, (r() - .5) * .9); s.userData.y = s.position.y; }
  const eaveZ = bb.max.z, eaveY = bb.min.y;
  const ladder = new THREE.Group(); ladder.position.set(-4.6, 0, eaveZ + .9); ladder.rotation.x = -.2; root.add(ladder); const al = mat(0xb8bcc0, .4, .7);
  for (const s of [-.24, .24]) box(.06, eaveY + 1.1, .1, al, s, (eaveY + 1.1) / 2, 0, ladder); for (let y = .3; y < eaveY + 1; y += .3) box(.48, .04, .04, al, 0, y, 0, ladder);
  // bundles of new shingles on the roof (gone when it's done)
  const bundles = new THREE.Group(); root.add(bundles); const bm = mat(0x8a8e94, .8);
  if (main) for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1, .16, .35), bm); b.position.set(1.5 + i * 1.15, .1 / main.scale.y, -1.6); b.scale.y = 1 / main.scale.y; b.castShadow = true;
    b.updateMatrix(); b.matrixAutoUpdate = false; b.matrix.premultiply(main.matrixWorld); bundles.add(b); }
  const mb = new THREE.Box3(); skins.filter(o => o.userData.seams === "x").forEach(o => mb.expandByObject(o));
  const Y0 = mb.min.y - .3, Y1 = mb.max.y + .4;   // the main roof sets the pace; the lower wing roof goes first on and last off
  let lastSh = -1, cur = -1;
  function set({fix: f = 0} = {}) { if (f === cur) return; cur = f;
    const tear = ss(.06, .42, f), lay2 = ss(.5, .92, f);
    oldPlane.constant = tear <= 0 ? 100 : tear >= 1 ? -100 : Y1 - (Y1 - Y0) * tear;      // keep y <= c: torn off from the ridge down
    newPlane.constant = lay2 <= 0 ? -100 : lay2 >= 1 ? 100 : Y0 + (Y1 - Y0) * lay2;     // laid from the eaves up
    debris.visible = tear > .02 && f < .97; debris.children.forEach((s, i) => { s.visible = i / debris.children.length < tear; });
    dump.visible = f > .02 && f < .97; ladder.visible = f > .02 && f < .985; bundles.visible = f > .3 && f < .9;
    if (Math.abs(f - lastSh) > .004 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, exclude: (px, pz) => false};
}

// elecJob(world, house): a service upgrade on the left gable wall, then the lights come back on. set({fix, t}): 0 = dusk with
// most rooms dark, one window flickering, the porch light dead and a rusted meter + fuse box; ~.15-.6 = power off, ladder up,
// old gear out and a new meter + breaker panel in (door open on the breakers); .6-1 = the porch, rooms, lanterns and new
// path lights come on in turn. House glows and lamps are scaled after each time-of-day update (world.onTod).
export function elecJob(world, house) {
  const root = new THREE.Group(); world.scene.add(root);
  const mat = (c, ro = .6, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .6, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const WX = -6.08, MZ = .45, PZ = -.25;   // the left gable wall face, meter and panel positions along it
  const rustT = (base) => { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 30; i++) { const x = r() * 128, y = r() * 128, gr = g.createRadialGradient(x, y, 0, x, y, 4 + r() * 16); gr.addColorStop(0, "rgba(120,62,24,.85)"); gr.addColorStop(1, "rgba(120,62,24,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    for (let i = 0; i < 8; i++) { const x = r() * 128, gr = g.createLinearGradient(0, 40, 0, 128); gr.addColorStop(0, "rgba(110,56,20,0)"); gr.addColorStop(1, "rgba(110,56,20,.6)"); g.fillStyle = gr; g.fillRect(x, 40 + r() * 30, 2 + r() * 3, 128); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // old gear: a rusted meter socket with a cloudy glass meter, a small fuse box, a bent mast
  const old = new THREE.Group(); root.add(old); const rm = mat(0xffffff, .8, .3, {map: rustT("#8a8a82")});
  box(.1, .42, .3, rm, WX - .05, 1.55, MZ, old);
  { const g = add(new THREE.CylinderGeometry(.11, .11, .14, 20), mat(0xcfd2c8, .35, 0, {transparent: true, opacity: .75}), WX - .17, 1.6, MZ, old); g.rotation.z = Math.PI / 2; }
  box(.1, .46, .36, rm, WX - .05, 1.12, PZ, old);
  { const m = add(new THREE.CylinderGeometry(.028, .028, 3.9, 8), rm, WX - .07, 3.75, MZ, old); m.rotation.x = .045; }
  // new gear: meter base + digital meter, a 200 A panel with a door that swings open, straight mast + weatherhead
  const nu = new THREE.Group(); root.add(nu); const gm = mat(0x8f969b, .45, .55), dk = mat(0x1b1d20, .5, .2);
  box(.12, .48, .32, gm, WX - .06, 1.55, MZ, nu);
  { const g = add(new THREE.CylinderGeometry(.12, .12, .16, 24), mat(0xe8eef2, .15, 0, {transparent: true, opacity: .6}), WX - .2, 1.6, MZ, nu); g.rotation.z = Math.PI / 2;
    const face = add(new THREE.PlaneGeometry(.12, .05), world.glowMat(0x9fe8b0, .35, {color: 0x203024}), WX - .281, 1.62, MZ, nu); face.rotation.y = -Math.PI / 2; face.castShadow = false; }
  const PW = .5, PH = .75;
  box(.12, PH, PW, gm, WX - .06, 1.2, PZ, nu);
  const inner = box(.01, PH - .08, PW - .06, mat(0xd6d9d6, .6), WX - .121, 1.2, PZ, nu); inner.castShadow = false;
  for (let row = 0; row < 7; row++) for (const s of [-1, 1]) { const b = box(.03, .055, .1, dk, WX - .13, 1.46 - row * .085, PZ + s * .07, nu); b.castShadow = false; }
  const door = new THREE.Group(); door.position.set(WX - .125, 1.2, PZ + PW / 2); nu.add(door);
  { const d = box(.02, PH, PW, gm, -.01, 0, -PW / 2, door); box(.025, .06, .02, dk, -.02, 0, -PW + .05, door); }
  add(new THREE.CylinderGeometry(.03, .03, 4.05, 8), gm, WX - .08, 3.8, MZ, nu);
  { const h = add(new THREE.SphereGeometry(.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), gm, WX - .08, 5.84, MZ, nu); h.scale.set(1, .7, 1); }
  // the service drop from a pole off the side of the lot
  const pole = new THREE.Group(); pole.position.set(-14, 0, 5.5); root.add(pole); const wood = mat(0x5e4b3a, .95);
  add(new THREE.CylinderGeometry(.13, .17, 9.2, 10), wood, 0, 4.6, 0, pole); box(1.8, .12, .12, wood, 0, 8.6, 0, pole);
  add(new THREE.CylinderGeometry(.26, .26, .7, 14), mat(0x8a9096, .5, .5), .32, 7.7, 0, pole);
  { const a = new THREE.Vector3(-13.8, 7.6, 5.5), b = new THREE.Vector3(WX - .1, 5.78, MZ), pts = [];
    for (let i = 0; i <= 16; i++) { const k = i / 16, p = a.clone().lerp(b, k); p.y -= Math.sin(k * Math.PI) * .55; pts.push(p); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, .018, 5), dk, 0, 0, 0); }
  // ladder against the wall, tool bag and a coil of wire at its foot
  const ladder = new THREE.Group(); ladder.position.set(WX - .85, 0, MZ + .95); ladder.rotation.z = -.2; root.add(ladder); const fg = mat(0xe0b21c, .5);
  for (const s of [-.22, .22]) box(.07, 4.4, .09, fg, 0, 2.2, s, ladder); for (let y = .3; y < 4.3; y += .3) box(.04, .035, .44, mat(0x9aa0a6, .4, .7), 0, y, 0, ladder);
  const kit = new THREE.Group(); kit.position.set(WX - 1.1, 0, PZ - .5); root.add(kit);
  box(.42, .28, .24, mat(0x2a2d31, .8), 0, .14, 0, kit); box(.42, .04, .26, mat(0xd95a26, .6), 0, .29, 0, kit);
  { const c = add(new THREE.TorusGeometry(.17, .045, 8, 20), mat(0x1d1f22, .6), .1, .05, -.55, kit); c.rotation.x = Math.PI / 2;
    const c2 = add(new THREE.TorusGeometry(.13, .04, 8, 20), mat(0xb84a26, .6), .1, .12, -.55, kit); c2.rotation.x = Math.PI / 2; }
  // new path lights along the front walk
  const path = new THREE.Group(); root.add(path); const bronze = mat(0x2a2420, .5, .5), PL = [];
  for (const z of [8.6, 10.8, 13]) for (const x of [-1.05, 1.05]) { const g = new THREE.Group(); g.position.set(x, 0, z); path.add(g);
    add(new THREE.CylinderGeometry(.035, .045, .46, 8), bronze, 0, .23, 0, g);
    const cap = world.glowMat(0xffd6a0, .3, {color: 0x3a2a18}); add(new THREE.CylinderGeometry(.07, .06, .07, 12), cap, 0, .47, 0, g);
    box(.16, .02, .16, bronze, 0, .52, 0, g); PL.push(cap); }
  const pathLamps = [world.lamp(-1.05, .5, 10.8, 0xffc58a, .12, 3.5), world.lamp(1.05, .5, 10.8, 0xffc58a, .12, 3.5)];

  // what to dim: every glowing material on the house (window rooms, lamp shades, porch fixture, lanterns) and its lamps
  house.root.updateMatrixWorld(true);
  const E = [], seen = new Set(), wp = new THREE.Vector3();
  house.root.traverse(o => { if (!o.isMesh || !o.material || !o.material.emissive || !o.material.emissive.getHex() || seen.has(o.material)) return; seen.add(o.material);
    o.getWorldPosition(wp); E.push({m: o.material, x: wp.x, y: wp.y, z: wp.z}); });
  (house.lamps || []).forEach(l => E.push({l, x: l.position.x, y: l.position.y, z: l.position.z}));
  E.forEach(e => { const porch = e.z > 4.6 && Math.abs(e.x) < 1, lantern = e.z > 3 && e.x > 5.5;
    e.kind = porch ? "porch" : lantern ? "lantern" : "room";
    e.rank = porch ? 0 : lantern ? .82 : .12 + .6 * ((e.y > 3.6 ? .5 : 0) + (e.x + 7) / 22);
    e.before = e.kind === "room" ? ((Math.round(e.x * 3) & 3) === 1 ? .55 : 0) : e.kind === "lantern" && e.x < 9 ? .7 : 0; });
  const fl = E.filter(e => e.kind === "room" && e.before === 0 && e.y < 3.6).sort((a, b) => a.x - b.x)[0];
  if (fl) fl.flick = true;
  PL.forEach(m => E.push({m, kind: "path", rank: .9, before: 0})); pathLamps.forEach(l => E.push({l, kind: "path", rank: .93, before: 0}));
  let F = 0, flick = .3;
  const level = e => { if (F < .15) return e.flick ? flick : e.before * (1 - ss(.08, .15, F));
    return ss(.6 + .3 * e.rank, .66 + .3 * e.rank, F); };
  const base = e => e.base ?? (e.base = e.m ? e.m.emissiveIntensity : e.l.intensity);
  const apply = () => { for (const e of E) { const v = base(e) * level(e); if (e.m) e.m.emissiveIntensity = v; else e.l.intensity = v; } };
  world.onTod.push(() => { for (const e of E) e.base = e.m ? e.m.emissiveIntensity : e.l.intensity; apply(); });
  let cur = -1, lastSh = -1;
  function set({fix: f = 0, t} = {}) {
    if (t != null && f < .15 && fl) { const k = Math.sin(t * 23) * Math.sin(t * 7.3 + 1) > .2 ? .75 : (Math.sin(t * 61) > .6 ? .4 : .04); if (k !== flick) { flick = k; if (f === cur) apply(); } }
    if (f === cur) return; cur = f; F = f;
    const swap = f > .34;
    old.visible = !swap; nu.visible = swap; door.rotation.y = -1.9 * ss(.36, .44, f) * (1 - ss(.56, .62, f));
    ladder.visible = kit.visible = f > .12 && f < .9; path.visible = f > .5;
    apply();
    if (Math.abs(f - lastSh) > .02 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, exclude: () => false};
}

// lockJob(world, house): the front door gets new locks. set({fix}): 0 = a tarnished brass knob and an old deadbolt,
// ~.25-.55 = the old hardware off, holes showing, the locksmith's case open on the porch, .55-.75 = a black lever and a
// keypad deadbolt go on, the keypad lights, then the door swings open on a warm hallway.
export function lockJob(world, house) {
  const root = new THREE.Group(); world.scene.add(root);
  const mat = (c, ro = .5, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .7, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const cyl = (a, b, h, m, px, py, pz, parent, s = 18) => add(new THREE.CylinderGeometry(a, b, h, s), m, px, py, pz, parent);
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  // find the front door slab, hide it and its knob and lite, and hang our own on a hinge in the same place
  house.root.updateMatrixWorld(true);
  let slab = null; house.root.traverse(o => { if (o.isMesh && o.material === house.M.door && o.geometry.parameters && o.geometry.parameters.height > 2) slab = o; });
  const wp = new THREE.Vector3(), W = slab ? slab.geometry.parameters.width : .97, H = slab ? slab.geometry.parameters.height : 2.26;
  if (slab) { slab.getWorldPosition(wp); slab.parent.children.forEach(c => { if (c !== slab && c.isMesh && (c.material === house.M.metal || c.material === house.M.glass || (c.material.emissive && c.material.emissive.getHex()))) c.visible = false; }); slab.visible = false; }
  else wp.set(0, 1.91, 3.94);
  const FZ = wp.z + .03;   // the outside face of the door
  const hinge = new THREE.Group(); hinge.position.set(wp.x - W / 2, wp.y, wp.z); root.add(hinge);
  const door = new THREE.Group(); door.position.x = W / 2; hinge.add(door);
  if (house.M.door.normalScale) house.M.door.normalScale.multiplyScalar(.2);   // the fir grain reads as ripples this close
  box(W, H, .05, house.M.door, 0, 0, 0, door);
  for (const [y, h] of [[.55, .7], [-.55, .9]]) for (const s of [-1, 1]) box(.34, h, .012, house.M.door, s * .22, y, .03, door);   // raised panels
  // warm hallway behind the opening, seen when the door swings in
  const hall = add(new THREE.PlaneGeometry(W + .2, H + .1), world.glowMat(0xffc98a, .28, {color: 0x3a2614, roughness: .9}), wp.x, wp.y, wp.z - 1.2); hall.castShadow = false;
  const hallL = world.lamp(wp.x, wp.y + 1.3, wp.z - 1, 0xffc58a, .25, 3.5);
  // hardware: old brass knob + deadbolt, holes, new black lever + keypad deadbolt
  const HX = W / 2 - .14, brass = mat(0x8a6a35, .62, .8), black = mat(0x1a1b1d, .35, .6);
  const old = new THREE.Group(); door.add(old);
  cyl(.035, .035, .015, brass, HX, -.06, .033, old, 20).rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(.03, 16, 12), brass, HX, -.06, .075, old); cyl(.012, .016, .04, brass, HX, -.06, .05, old, 10).rotation.x = Math.PI / 2;
  cyl(.03, .03, .015, brass, HX, .14, .033, old, 20).rotation.x = Math.PI / 2; box(.012, .03, .01, mat(0x2a2014, .8), HX, .14, .043, old);
  const holes = new THREE.Group(); door.add(holes); for (const y of [-.06, .14]) { const h = add(new THREE.CircleGeometry(.027, 20), mat(0x120d08, .9), HX, y, .0265, holes); h.castShadow = false; }
  const nu = new THREE.Group(); door.add(nu);
  box(.06, .17, .016, black, HX, -.06, .033, nu); { const lv = box(.13, .022, .022, black, HX - .05, -.04, .07, nu); cyl(.012, .012, .04, black, HX, -.04, .05, nu, 10).rotation.x = Math.PI / 2; }
  box(.075, .2, .028, black, HX, .17, .039, nu);
  const keypad = new THREE.Group(); keypad.position.set(HX, .19, .054); nu.add(keypad);
  const keyM = world.glowMat(0xbfe3ff, .5, {color: 0x1b2430});
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const k = add(new THREE.CircleGeometry(.008, 12), keyM, (c - 1) * .018, .03 - r * .02, 0, keypad); k.castShadow = false; }
  const ring = add(new THREE.CircleGeometry(.012, 16), world.glowMat(0x7fd6a0, .6, {color: 0x14301f}), 0, -.06, 0, keypad); ring.castShadow = false;
  // the locksmith's case open on the porch, a drill, the new lock's box
  const kit = new THREE.Group(); kit.position.set(wp.x + .95, .52, FZ + .7); kit.rotation.y = -.3; root.add(kit);
  box(.5, .1, .34, mat(0xb3241c, .5), 0, .05, 0, kit); box(.46, .02, .3, mat(0x1d1f22, .9), 0, .1, 0, kit);
  { const lid = box(.5, .34, .03, mat(0xb3241c, .5), 0, .27, -.18, kit); lid.rotation.x = -.25; }
  for (let i = 0; i < 6; i++) box(.012, .006, .14, mat(0xc9ccd0, .3, .9), -.16 + i * .06, .115, 0, kit);
  for (let i = 0; i < 4; i++) { const k = box(.05, .006, .02, brass, .12 + (i % 2) * .06, .115, -.08 + (i >> 1) * .05, kit); }
  const drill = new THREE.Group(); drill.position.set(wp.x + .45, .52, FZ + .55); drill.rotation.y = .8; root.add(drill);
  box(.2, .08, .07, mat(0xe0a82e, .5), 0, .14, 0, drill); box(.06, .14, .06, mat(0x1d1f22, .6), .05, .06, 0, drill); cyl(.006, .006, .08, mat(0xc9ccd0, .3, .9), -.14, .14, 0, drill, 8).rotation.z = Math.PI / 2;
  const pkg = box(.2, .26, .09, mat(0xe9e4dc, .7), wp.x + 1.35, .52 + .13, FZ + .45, root);
  // a key ring hanging from the new deadbolt once it's done
  const keys = new THREE.Group(); keys.position.set(HX, .13, .06); nu.add(keys);
  add(new THREE.TorusGeometry(.016, .003, 6, 16), mat(0xc9ccd0, .3, .9), 0, -.02, 0, keys);
  for (const [a, c] of [[.2, 0xc9a14a], [-.25, 0xc9ccd0]]) { const k = box(.012, .055, .003, mat(c, .35, .9), Math.sin(a) * .02, -.06, .004, keys); k.rotation.z = a; }
  let cur = -1, lastSh = -1;
  function set({fix: f = 0} = {}) { if (f === cur) return; cur = f;
    old.visible = f < .25; holes.visible = f >= .25 && f < .55; nu.visible = f >= .55;
    nu.position.z = (1 - ss(.55, .62, f)) * .05; keypad.visible = f >= .55;
    keys.visible = f > .72 && f < .8;
    kit.visible = drill.visible = f > .2 && f < .9; pkg.visible = f > .2 && f < .6;
    const open = ss(.8, .97, f); hinge.rotation.y = 1.15 * open; hallL.intensity = (hallL.userData.b ?? 0) * open; hall.visible = open > .01;
    const lit = ss(.68, .74, f);
    keypad.children.forEach(c => { c.visible = lit > .5; });
    if (Math.abs(f - lastSh) > .02 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  // the hallway lamp follows the time of day like the house's own lights, but only once the door is open
  world.onTod.push(() => { hallL.userData.b = hallL.intensity; hallL.intensity *= ss(.8, .97, cur); });
  set({fix: 0});
  return {root, set, exclude: () => false};
}

// Fence crew: a tired side-yard fence beside the house comes out and a new cedar privacy fence goes up, post by post.
// set({fix}): old fence leaning, gappy and half down (<.2); torn out from the house end and piled on the lawn (.2-.42);
// new posts set in concrete (.36-.56); rails then boards run out from the house (.5-.9); the gate, caps and cleanup (.9-1).
export function fenceJob(world, {x0 = -6.7, x1 = -16.9, z = 5.8} = {}) {
  const root = new THREE.Group(); world.scene.add(root);
  const mat = (c, ro = .8, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .5, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  let seed = 31; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const L = x0 - x1, N = 4, SP = L / N, BW = .14, BH = 1.8;
  const posts = []; for (let i = 0; i <= N; i++) posts.push(x0 - i * SP);
  // ---------- the old fence: grey boards with gaps and missing pickets, leaning posts, one section fallen in the grass ----------
  const old = [], oldM = [mat(0x8f897e, .95), mat(0x7d776c, .95), mat(0x9a9488, .95)], oPost = mat(0x6e685e, .95);
  posts.forEach((px, i) => { const p = box(.1, 1.95, .1, oPost, px, .95, z, root); p.rotation.z = (r() - .5) * .16; p.rotation.x = (r() - .5) * .1; old.push([p, px]); });
  for (let s = 0; s < N; s++) { const a = posts[s], b = posts[s + 1], fallen = s === 2, sec = new THREE.Group(); root.add(sec);
    if (fallen) { sec.position.set((a + b) / 2, .02, z + .1); sec.rotation.x = -Math.PI / 2 + .12; } else { sec.position.set((a + b) / 2, 0, z); sec.rotation.z = (r() - .5) * .08; }
    for (const y of [.35, 1.5]) box(SP - .1, .08, .04, oPost, 0, fallen ? -y : y, fallen ? .06 : -.05, sec);
    for (let k = 0; k < SP / (BW + .05); k++) { if (r() < .16) continue; const h = BH - r() * .25, bx = -SP / 2 + .1 + k * (BW + .05);
      const bd = box(BW, h, .02, oldM[(k + s) % 3], bx, fallen ? -h / 2 : h / 2 + .06, fallen ? .03 : .0, sec); if (!fallen) bd.rotation.z = (r() - .5) * .06; }
    old.push([sec, (a + b) / 2]); }
  // the pile of torn-out boards on the lawn, hauled away before the new boards go up
  const pile = new THREE.Group(); pile.position.set(-11.5, 0, 9.3); root.add(pile);
  for (let i = 0; i < 14; i++) { const b = box(1.6 + r() * .3, .025, BW, oldM[i % 3], (r() - .5) * .3, .02 + i * .026, (r() - .5) * .5, pile); b.rotation.y = (r() - .5) * .5; }
  // ---------- the new fence: posts in concrete, three rails, cedar boards, caps, a gate by the house ----------
  const cedar = [mat(0xb7814f, .7), mat(0xa9744a, .7), mat(0xc08b58, .7)], pM = mat(0x9c6a40, .7), conc = mat(0xa8a49c, .95);
  const newPosts = posts.map(px => { const g = new THREE.Group(); g.position.set(px, 0, z); root.add(g); box(.11, 2.05, .11, pM, 0, 1.02, 0, g); box(.15, .05, .15, pM, 0, 2.07, 0, g);
    const c = add(new THREE.CylinderGeometry(.16, .16, .04, 16), conc, 0, .02, 0, g); c.castShadow = false; return [g, px]; });
  const rails = []; for (let s = 0; s < N; s++) { const g = new THREE.Group(); g.position.set((posts[s] + posts[s + 1]) / 2, 0, z - .07); root.add(g); for (const y of [.3, 1.0, 1.7]) box(SP - .11, .09, .04, pM, 0, y, 0, g); rails.push([g, (posts[s] + posts[s + 1]) / 2]); }
  const GW = 1.15, gx = x0 - .06;   // gate: first section, hung off the post by the house
  const boardGeo = new THREE.BoxGeometry(BW, BH, .02), bds = [];
  for (let s = 0; s < N; s++) for (let k = 0; ; k++) { const bx = posts[s] - .06 - BW / 2 - k * (BW + .008); if (bx < posts[s + 1] + .06 + BW / 2) break;
    if (s === 0 && bx > gx - GW) continue; const m = add(boardGeo, cedar[(k * 7 + s) % 3], bx, BH / 2 + .08, z + .07); m.visible = false; bds.push([m, bx]); }
  const gate = new THREE.Group(); gate.position.set(gx, 0, z + .07); root.add(gate);
  for (let k = 0; k < Math.floor(GW / (BW + .008)); k++) box(BW, BH - .05, .02, cedar[k % 3], -BW / 2 - k * (BW + .008), BH / 2 + .1, 0, gate);
  for (const y of [.4, 1.55]) box(GW - .04, .09, .035, pM, -GW / 2, y, -.03, gate); { const d = box(.06, 1.5, .03, pM, -GW / 2, .98, -.03, gate); d.rotation.z = .78; }
  const iron = mat(0x1d1f22, .5, .6); for (const y of [.42, 1.57]) box(.24, .03, .01, iron, -.12, y, .02, gate); box(.06, .08, .03, iron, -GW + .12, 1.15, .03, gate);
  // the crew's bits: a stack of new boards, concrete bags, a post-hole digger, a level
  const kit = new THREE.Group(); kit.position.set(-13.4, 0, 9.8); root.add(kit);
  for (let i = 0; i < 10; i++) box(1.9, .022, BW, cedar[i % 3], 0, .03 + (i % 5) * .024, -.2 + Math.floor(i / 5) * (BW + .01), kit);
  for (let i = 0; i < 3; i++) { const b = box(.42, .12, .28, mat(0xd8d2c2, .9), 1.3 + (i % 2) * .05, .06 + i * .12, .25, kit); b.rotation.y = (r() - .5) * .3; }
  const dig = new THREE.Group(); dig.position.set(-1.0, 0, .5); dig.rotation.z = .35; kit.add(dig); for (const dx of [-.06, .06]) { const h = add(new THREE.CylinderGeometry(.016, .016, 1.4, 8), mat(0xc9a46e, .7), dx, .7, 0, dig); h.rotation.z = dx * 2; } box(.22, .2, .04, iron, 0, .05, 0, dig);
  box(1.2, .04, .05, mat(0xe0a82e, .5), .2, .03, .9, kit);
  let cur = -1, lastSh = -1;
  function set({fix: f = 0} = {}) { if (f === cur) return; cur = f;
    const rx = x0 + .4 - (L + 1) * ss(.1, .34, f);   // tear-out line moves away from the house
    for (const [o, px] of old) o.visible = px < rx;
    pile.visible = f > .12 && f < .62; pile.scale.y = .3 + .7 * ss(.1, .34, f);
    const px_ = x0 + .2 - (L + .6) * ss(.24, .46, f); for (const [g, px] of newPosts) g.visible = f > .24 && px >= px_;
    const rl = x0 - (L + .4) * ss(.4, .58, f); for (const [g, px] of rails) g.visible = px >= rl;
    const bl = x0 - (L + .4) * ss(.56, .9, f); for (const [m, bx] of bds) m.visible = bx >= bl;
    gate.visible = f > .9; gate.rotation.y = -.9 * (1 - ss(.9, .98, f));
    kit.visible = f > .3 && f < .96;
    if (Math.abs(f - lastSh) > .01 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, exclude: (px, pz) => px < x0 + .3 && px > x1 - .3 && Math.abs(pz - z) < .3};
}

// snowJob(world, house, {sign, font}): the morning after a snowfall. Snow on the roof, the lawn and the trees; the drive, the walk and
// the path buried with tire tracks in them. set({fix, t}): snow still falling (<.25), the crew's pickup with a plow drives up from the
// street pushing the snow off to the side (.12-.48), backs down and parks (.5-.62), the path and the walk are cleared (.6-.82), salt goes
// down (.82-.96). Banks grow along the edges as each part is cleared.
export async function snowJob(world, house, {sign = "", font} = {}) {
  const root = new THREE.Group(); world.scene.add(root); world.R.localClippingEnabled = true;
  const mat = (c, ro = .8, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .5, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  let seed = 53; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const tex = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  // ---------- winter on the house: a white roof, frosted trees and shrubs ----------
  if (house) { for (const k of ["roof", "porchRoof"]) { const m = house.M[k]; if (!m) continue; m.color.setHex(0xeef2f6); m.metalness = 0; m.roughness = .9; m.needsUpdate = true; }
    // the leaf cards get a snow-laden texture (clumps of white over dark needles) and lose most of their green tint
    const lv = house.leaves; if (lv && lv.instanceColor) { const c = new THREE.Color(), w = new THREE.Color(0xffffff);
      lv.material.map = tex(256, 256, (g) => { for (let i = 0; i < 190; i++) { const a = r() * 6.28, rr = Math.pow(r(), .7) * 104, x = 128 + Math.cos(a) * rr, y = 128 + Math.sin(a) * rr * .9, sz = 7 + r() * 10, snow = r() < .58;
        g.save(); g.translate(x, y); g.rotate(r() * 6.28); g.fillStyle = snow ? `hsl(210,${12 + r() * 14}%,${86 + r() * 10}%)` : `hsl(${95 + r() * 40},${14 + r() * 14}%,${16 + r() * 12}%)`; g.beginPath(); g.ellipse(0, 0, sz, sz * (snow ? .62 : .45), 0, 0, 6.29); g.fill(); g.restore(); } });
      lv.material.needsUpdate = true;
      for (let i = 0; i < lv.count; i++) { lv.getColorAt(i, c); c.lerp(w, .8); lv.setColorAt(i, c); } lv.instanceColor.needsUpdate = true; } }
  // ---------- the snow on the drive, the path and the walk: a layer with depth, tire tracks on the drive ----------
  const snowTop = (W, L, tracks) => tex(256, Math.round(256 * L / W / 2) * 2, (g, w, h) => { g.fillStyle = "#f3f6f9"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rad = 6 + r() * 26, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${r() < .5 ? "206,216,228" : "255,255,255"},.5)`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    if (tracks) for (const tx of [.25, .75]) { g.fillStyle = "rgba(150,160,172,.55)"; g.fillRect(tx * w - 12, 0, 24, h); g.fillStyle = "rgba(118,126,136,.35)"; for (let y = 0; y < h; y += 10) g.fillRect(tx * w - 10, y, 20, 4); } });
  const sideM = mat(0xe6ecf2, .9);
  const layer = (x0, x1, z0, z1, hgt, tracks, plane) => { const W = x1 - x0, L = z1 - z0, topM = mat(0xffffff, .85, 0, {map: snowTop(W, L, tracks), clippingPlanes: [plane]}), sM = sideM.clone(); sM.clippingPlanes = [plane];
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, hgt, L), [sM, sM, topM, sM, sM, sM]); m.position.set((x0 + x1) / 2, hgt / 2 + .02, (z0 + z1) / 2); m.receiveShadow = true; root.add(m); return m; };
  const cDrive = new THREE.Plane(new THREE.Vector3(0, 0, -1), 99), cPath = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 99), cWalk = new THREE.Plane(new THREE.Vector3(0, 0, -1), 99);
  layer(6.8, 12.2, 3, 31, .16, true, cDrive); layer(-.1, 6.8, 13.55, 14.85, .14, false, cPath); layer(-.7, .7, 7.6, 14.85, .14, false, cWalk);
  // ---------- banks: lumps along the edges that grow as each stretch is cleared ----------
  const bankM = mat(0xf1f4f7, .9), banks = [];
  const lumpGs = [0, 1, 2].map(k => { const g = new THREE.SphereGeometry(1, 18, 12), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + .16 * Math.sin(v.x * 3.1 + k * 2) * Math.cos(v.z * 2.7 + k) + .08 * Math.sin(v.y * 6 + v.x * 4 + k); v.multiplyScalar(n); if (v.y > 0) v.y *= .8 + .2 * Math.cos(v.x * 2 + k); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g; });
  let lk = 0; const lump = (x, z, sx, sy, sz, key) => { const m = add(lumpGs[lk++ % 3], bankM, x, 0, z); m.rotation.y = r() * 6.28; m.scale.set(sx, sy, sz); m.userData.s = [sx, sy, sz]; m.visible = false; banks.push([m, key]); return m; };
  for (let z = 3.8; z < 30.8; z += .95) { lump(13.0 + r() * .35, z, .7 + r() * .35, .38 + r() * .3, .8 + r() * .4, ["d", z]); if (r() < .7) lump(13.6 + r() * .3, z + .4, .5 + r() * .2, .24 + r() * .14, .6, ["d", z + .4]);
    lump(6.35 - r() * .12, z + .5, .32 + r() * .14, .18 + r() * .1, .62 + r() * .2, ["d", z + .5]); }
  for (let x = .5; x < 6.7; x += .7) lump(x, 15.32 + r() * .12, .42 + r() * .12, .18 + r() * .07, .26 + r() * .06, ["p", x]);
  for (let z = 7.9; z < 14.4; z += .7) { lump(-1.05 - r() * .08, z, .26 + r() * .08, .17 + r() * .06, .42 + r() * .1, ["w", z]); lump(1.05 + r() * .08, z + .35, .26 + r() * .08, .16 + r() * .06, .42 + r() * .1, ["w", z + .35]); }
  // ---------- the plow truck: the crew's pickup with a blade on the front and a roll of snow ahead of it ----------
  const T = await workTruck(world, {sign, font, x: 9.5, z: 36, ry: Math.PI, color: 0x24394f, ink: "#f3f5f7"});
  const steel = mat(0x2a2d31, .5, .6), yellow = mat(0xf0b416, .45, .2), blade = new THREE.Group(); blade.position.set(0, 0, 3.05); T.car.add(blade);
  box(.14, .3, .5, steel, -.5, .55, -.2, blade); box(.14, .3, .5, steel, .5, .55, -.2, blade); box(1.3, .12, .14, steel, 0, .62, .05, blade);
  const bl = new THREE.Group(); bl.position.set(0, 0, .2); bl.rotation.y = -.28; blade.add(bl);
  { const g = new THREE.CylinderGeometry(.55, .55, 2.7, 24, 1, true, Math.PI * .58, Math.PI * .7), b = add(g, yellow, 0, .5, -.12, bl); b.rotation.z = Math.PI / 2; b.material.side = THREE.DoubleSide;
    box(2.7, .06, .08, steel, 0, .06, .18, bl); for (const x of [-1.2, 0, 1.2]) box(.05, .6, .05, steel, x, .5, -.3, bl); }
  const roll = add(new THREE.CylinderGeometry(.32, .32, 2.2, 14), bankM, .2, .3, .75, bl); roll.rotation.z = Math.PI / 2;
  const beacon = add(new THREE.CylinderGeometry(.08, .1, .12, 12), mat(0xff9a1a, .3, 0, {emissive: 0xff7a00, emissiveIntensity: 0}), 0, 1.98, .2, T.car);
  // ---------- salt: granules on the cleared drive and walks; a bag and a shovel by the steps ----------
  const saltT = tex(512, 512, (g, w, h) => { for (let i = 0; i < 2600; i++) { g.fillStyle = r() < .35 ? "rgba(170,205,232,.95)" : "rgba(250,250,250,.95)"; const s = 1.5 + r() * 2.2; g.fillRect(r() * w, r() * h, s, s); } });
  saltT.wrapS = saltT.wrapT = THREE.RepeatWrapping;
  const saltM = new THREE.MeshStandardMaterial({map: saltT, transparent: true, opacity: 0, depthWrite: false, roughness: .4, polygonOffset: true, polygonOffsetFactor: -4});
  const salt = [[9.5, 17, 5.4, 28], [3.4, 14.2, 6.8, 1.3], [0, 11.2, 1.4, 7.2]].map(([x, z, w, l]) => { const t = saltT.clone(); t.repeat.set(w / 2.5, l / 2.5); t.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), saltM.clone()); m.material.map = t; m.rotation.x = -Math.PI / 2; m.position.set(x, .035, z); m.renderOrder = 4; root.add(m); return m; });
  // wet, dark concrete right after the plow
  const wetM = new THREE.MeshStandardMaterial({color: 0x3c4046, transparent: true, opacity: 0, roughness: .15, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3});
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 28), wetM); wet.rotation.x = -Math.PI / 2; wet.position.set(9.5, .03, 17); root.add(wet);
  const kit = new THREE.Group(); kit.position.set(2.2, 0, 9.4); root.add(kit);
  { const bag = box(.42, .62, .24, mat(0x2f6fb5, .7), 0, .31, 0, kit); bag.rotation.y = .3; box(.3, .2, .01, mat(0xf2f2ee, .7), .02, .38, .125, bag);
    const sh = new THREE.Group(); sh.position.set(.55, 0, .1); sh.rotation.z = -.42; kit.add(sh); add(new THREE.CylinderGeometry(.018, .018, 1.25, 8), mat(0x6b4a32, .6), 0, .75, 0, sh);
    const sc = box(.42, .03, .36, mat(0x1d1f22, .5, .3), 0, .1, .02, sh); sc.rotation.x = .2; }
  // ---------- falling snow ----------
  const N = (innerWidth < 760 ? 1400 : 3200), P = new Float32Array(N * 3), S = [];
  for (let i = 0; i < N; i++) { const x = -24 + r() * 48, y = r() * 14, z = -6 + r() * 46; S.push([x, y, z, .6 + r() * .6, r() * 6.3]); }
  const flakeT = tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.5, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const fG = new THREE.BufferGeometry(); fG.setAttribute("position", new THREE.BufferAttribute(P, 3));
  const fM = new THREE.PointsMaterial({map: flakeT, size: .13, transparent: true, depthWrite: false, opacity: 1}); const flakes = new THREE.Points(fG, fM); flakes.frustumCulled = false; root.add(flakes);
  let cur = -1, lastT = -1, lastSh = -1;
  function set({fix: f = 0, t = 0} = {}) {
    const fall = 1 - ss(.08, .26, f); fM.opacity = fall; flakes.visible = fall > .01;
    if (flakes.visible && t !== lastT) { lastT = t; for (let i = 0; i < N; i++) { const s = S[i]; P[i * 3] = s[0] + Math.sin(t * .7 + s[4]) * .35; P[i * 3 + 1] = ((s[1] - t * s[3]) % 14 + 14) % 14; P[i * 3 + 2] = s[2]; } fG.attributes.position.needsUpdate = true; }
    if (f === cur) return; cur = f;
    // the plow: up the drive (.12-.48), back down and park (.5-.62)
    const up = ss(.12, .48, f), back = ss(.5, .62, f), go = ss(.62, .76, f), tz = 36 - 28.6 * up + 26.6 * back + 1.4 * ss(.62, .66, f);
    T.car.position.set(9.5 + 34 * go * go, 0, tz); T.car.rotation.y = Math.PI - Math.PI / 2 * ss(.62, .67, f); T.car.visible = go < .999;
    blade.position.y = back > 0 ? .18 * back : .18 * (1 - ss(.08, .14, f)); beacon.material.emissiveIntensity = f > .08 && f < .76 ? 2.6 : 0;
    const zc = up > .985 ? 2.9 : up > 0 ? tz - 3.4 : 99; cDrive.constant = zc; roll.visible = up > .02 && up < .99; roll.scale.set(1, .6 + .6 * up, 1 + .4 * up);
    // path (from the drive toward the walk) then the walk (from the path up to the porch)
    const p = ss(.6, .7, f), w = ss(.7, .82, f), px = 6.8 - 7 * p, wz = 14.85 - 7.4 * w; cPath.constant = p > 0 ? px : 99;
    cWalk.constant = w > 0 ? wz : 99;
    for (const [m, [k, v]] of banks) { const done = k === "d" ? up > 0 && v > zc : k === "p" ? p > 0 && v > px : w > 0 && v > wz; m.visible = done;
      if (done) { const g = k === "d" ? Math.min(1, (v - zc) / 3 + .25) : 1; m.scale.set(m.userData.s[0], m.userData.s[1] * g, m.userData.s[2]); } }
    wetM.opacity = .35 * ss(.2, .5, f) * (1 - ss(.82, .96, f)); wet.visible = wetM.opacity > .01;
    const sa = ss(.82, .96, f); for (const m of salt) { m.material.opacity = sa; m.visible = sa > .01; }
    kit.visible = f > .58;
    if (Math.abs(f - lastSh) > .004 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, truck: T};
}

// shared bits for the dig and the well: materials, a seeded random, smoothstep, canvas textures, a bar between two points
const kit3 = (root, seed0) => {
  const mat = (c, ro = .8, m = 0, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, metalness: m, envMapIntensity: .5, ...o});
  const add = (geo, m, px, py, pz, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, parent = root) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, parent);
  const cyl = (r0, r1, h, m, px, py, pz, parent = root, n = 14) => add(new THREE.CylinderGeometry(r0, r1, h, n), m, px, py, pz, parent);
  let seed = seed0; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ss = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const tex = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const bar = (p0, p1, th, m, parent = root, round = false) => { const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1), len = a.distanceTo(b);
    const o = round ? cyl(th, th, len, m, 0, 0, 0, parent, 10) : box(th, len, th, m, 0, 0, 0, parent); o.position.copy(a).add(b).multiplyScalar(.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return o; };
  const mound = (rad, h, m, px, pz, parent = root, jit = .14) => { const g = new THREE.SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (r() - .5) * jit; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals();
    const o = add(g, m, px, 0, pz, parent); o.userData.s = [rad, h]; return o; };
  const soilTex = (dark = "62,46,32") => tex(512, 512, (g, w, h) => { const gr = g.createRadialGradient(256, 256, 120, 256, 256, 256); gr.addColorStop(0, `rgba(${dark},1)`); gr.addColorStop(.8, `rgba(${dark},.9)`); gr.addColorStop(1, `rgba(${dark},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const a = r() * 6.28, rr = Math.sqrt(r()) * 236; g.fillStyle = ["rgba(36,26,16,.6)", "rgba(140,112,80,.5)", "rgba(184,160,120,.45)"][i % 3]; g.fillRect(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr, 2 + r() * 3, 2 + r() * 2); } });
  return {mat, add, box, cyl, r, ss, tex, bar, mound, soilTex};
};

// digJob(world): an excavating crew digs for an addition in the side yard left of the house. A hole is cut in the ground disc
// (four clip planes, clipIntersection) and a real pit sits below it. set({fix}): stakes and string lines mark the dig (<.22),
// a mini excavator tracks in from the street (.03-.18), digs in five swings, dumping on a spoil pile (.22-.66), trims the floor
// (.66-.74), gravel goes down (.7-.8), footing forms go in (.78-.9) and the machine backs off and parks (.88-.98).
export function digJob(world, {x0 = -13.8, x1 = -7.9, z0 = -2.6, z1 = 2.2, D = 1.35} = {}) {
  const root = new THREE.Group(); world.scene.add(root); world.R.localClippingEnabled = true;
  const {mat, add, box, cyl, r, ss, tex, bar, mound, soilTex} = kit3(root, 47);
  const W = x1 - x0, L = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  // ---------- the hole: clip the ground disc inside the rectangle, a pit box (inside faces only) below it ----------
  const gnd = world.scene.children.find(o => o.isMesh && o.geometry.type === "CircleGeometry" && o.geometry.parameters.radius > 500);
  const holePl = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), x0), new THREE.Plane(new THREE.Vector3(1, 0, 0), -x1), new THREE.Plane(new THREE.Vector3(0, 0, -1), z0), new THREE.Plane(new THREE.Vector3(0, 0, 1), -z1)];
  let holeOn = false; const hole = on => { if (!gnd || on === holeOn) return; holeOn = on; gnd.material.clippingPlanes = on ? holePl : null; gnd.material.clipIntersection = true; gnd.material.needsUpdate = true; };
  const wallT = tex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3b2c1f"); gr.addColorStop(.16, "#4a3624"); gr.addColorStop(.2, "#7a5634"); gr.addColorStop(.62, "#8a6440"); gr.addColorStop(.66, "#9b7a52"); gr.addColorStop(1, "#8d6e4a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 2400; i++) { g.fillStyle = ["rgba(30,20,12,.45)", "rgba(190,160,120,.35)", "rgba(120,90,60,.4)"][i % 3]; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    g.strokeStyle = "rgba(40,28,18,.35)"; g.lineWidth = 2; for (let i = 0; i < 26; i++) { const x = r() * w; g.beginPath(); g.moveTo(x, h * .2); g.lineTo(x + (r() - .5) * 12, h); g.stroke(); }
    g.fillStyle = "rgba(60,90,40,.9)"; for (let i = 0; i < 90; i++) g.fillRect(r() * w, 0, 2, 4 + r() * 10); });
  wallT.wrapS = THREE.RepeatWrapping;
  const pit = new THREE.Group(); pit.position.set(cx, 0, cz); root.add(pit);
  const pitG = new THREE.BoxGeometry(1, 1, 1); pitG.translate(0, -.5, 0);
  const walls = add(pitG, mat(0xffffff, 1, 0, {map: wallT, side: THREE.BackSide}), 0, 0, 0, pit); walls.castShadow = false;
  const floorT = tex(512, 512, (g, w, h) => { g.fillStyle = "#86663f"; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = ["rgba(60,42,26,.5)", "rgba(170,140,100,.45)"][i % 2]; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3); }
    g.strokeStyle = "rgba(70,50,30,.5)"; g.lineWidth = 6; for (let i = 0; i < 7; i++) { const y = (i + .5) / 7 * h; g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * .05 + i) * 5); g.stroke(); } });
  const floor = add(new THREE.PlaneGeometry(1, 1), mat(0xffffff, 1, 0, {map: floorT}), 0, -.01, 0, pit); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const gravT = tex(512, 512, (g, w, h) => { g.fillStyle = "#8f8c86"; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = ["#6f6c66", "#b3afa7", "#a29d94", "#5d5a55"][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 1.5 + r() * 2.5, 1 + r() * 2, r() * 3, 0, 7); g.fill(); } });
  const gravel = add(new THREE.PlaneGeometry(W - .5, L - .5), mat(0xffffff, .95, 0, {map: gravT}), cx, -D + .03, cz); gravel.rotation.x = -Math.PI / 2; gravel.castShadow = false;
  // footing forms: boards on edge around the floor, stakes behind them, a strip of rebar inside
  const forms = new THREE.Group(); forms.position.set(cx, -D + .03, cz); root.add(forms); const fM = mat(0xc49a63, .75), rb = mat(0x7a4a2c, .6, .5);
  const fw = W - 1.3, fl = L - 1.3;
  for (const [w, d, px, pz] of [[fw, .05, 0, -fl / 2], [fw, .05, 0, fl / 2], [.05, fl, -fw / 2, 0], [.05, fl, fw / 2, 0], [fw - .9, .05, 0, -fl / 2 + .45], [fw - .9, .05, 0, fl / 2 - .45], [.05, fl - .9, -fw / 2 + .45, 0], [.05, fl - .9, fw / 2 - .45, 0]]) box(w, .3, d, fM, px, .15, pz, forms);
  for (const s of [-1, 1]) { const b = cyl(.012, .012, fw - .3, rb, 0, .12, s * (fl / 2 - .22), forms, 6); b.rotation.z = Math.PI / 2; const c = cyl(.012, .012, fl - .3, rb, s * (fw / 2 - .22), .12, 0, forms, 6); c.rotation.x = Math.PI / 2; }
  // the lip: loose soil around the edge, the middle cut out so the pit shows
  const lipT = tex(512, 512, (g, w, h) => { const m = 70; g.fillStyle = "rgba(78,58,38,.95)"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2200; i++) { g.fillStyle = ["rgba(40,28,18,.6)", "rgba(150,120,84,.5)", "rgba(110,86,58,.6)"][i % 3]; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3); }
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.fillRect(m, m, w - 2 * m, h - 2 * m);
    const e = g.createLinearGradient(0, 0, m * .8, 0); for (const [x0g, rot] of [[0, 0], [w, Math.PI], [0, -Math.PI / 2], [0, Math.PI / 2]]) { g.save(); if (rot === Math.PI) { g.translate(w, h); g.rotate(Math.PI); } else if (rot === -Math.PI / 2) { g.translate(0, h); g.rotate(-Math.PI / 2); } else if (rot) { g.translate(w, 0); g.rotate(Math.PI / 2); }
      e.addColorStop(0, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0)"); for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, r() * w, 10 + r() * m * .7, 6 + r() * 20); } g.restore(); } });
  const lipM = mat(0xffffff, 1, 0, {map: lipT, transparent: true, alphaTest: .3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
  const lip = add(new THREE.PlaneGeometry(W * 512 / (512 - 140), L * 512 / (512 - 140)), lipM, cx, .012, cz); lip.rotation.x = -Math.PI / 2; lip.castShadow = false; lip.renderOrder = 2;
  // ---------- stakes and string lines marking the dig ----------
  const stakes = new THREE.Group(); root.add(stakes); const stM = mat(0xd9b98a, .8), strM = mat(0xff6a1a, .6), flagM = mat(0xff4d6d, .6, 0, {side: THREE.DoubleSide});
  const strings = new THREE.Group(); root.add(strings);
  const C = [[x0 - .35, z0 - .35], [x1 + .35, z0 - .35], [x1 + .35, z1 + .35], [x0 - .35, z1 + .35]];
  C.forEach(([px, pz], i) => { box(.05, .6, .05, stM, px, .3, pz, stakes); const f = add(new THREE.PlaneGeometry(.14, .09), flagM, px + .07, .55, pz, stakes); f.rotation.y = .5;
    const [qx, qz] = C[(i + 1) % 4]; bar([px, .32, pz], [qx, .32, qz], .008, strM, strings, true); });
  for (const t of [.25, .5, .75]) for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1]]) { const px = ax + (bx - ax) * t, pz = az + (bz - az) * t; const p = add(new THREE.CircleGeometry(.05, 10), mat(0xff6a1a, .6), px, .014, pz, strings); p.rotation.x = -Math.PI / 2; }
  // ---------- the spoil pile ----------
  const spoilT = tex(512, 512, (g, w, h) => { g.fillStyle = "#6e5236"; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = ["#4d3826", "#8a6a46", "#9b7a52", "#3e2d1e"][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 6, 2 + r() * 4, r() * 3, 0, 7); g.fill(); } });
  spoilT.wrapS = spoilT.wrapT = THREE.RepeatWrapping; spoilT.repeat.set(2, 2);
  const PX = x1 - 1.1, PZ = z1 + 5.6;
  const spoil = mound(1, 1, mat(0xffffff, 1, 0, {map: spoilT}), PX, PZ); spoil.scale.set(.01, .01, .01);
  const skirt = add(new THREE.CircleGeometry(1, 40), mat(0xffffff, 1, 0, {map: soilTex("78,58,38"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2}), PX, .013, PZ); skirt.rotation.x = -Math.PI / 2; skirt.castShadow = false; skirt.renderOrder = 2;
  // ---------- the mini excavator (faces -z): tracks and blade, the house on a turntable, cab, boom, stick and bucket ----------
  const yel = mat(0xf2b01e, .42, .15), dk = mat(0x2a2b2e, .6, .3), rub = mat(0x1b1b1c, .92), stl = mat(0xb9bcbf, .3, .85), gl = mat(0x22303a, .08, .2, {transparent: true, opacity: .55});
  const ex = new THREE.Group(); root.add(ex);
  const trackT = tex(64, 256, (g, w, h) => { g.fillStyle = "#1c1c1d"; g.fillRect(0, 0, w, h); g.fillStyle = "#3a3a3c"; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 6); });
  trackT.wrapT = THREE.RepeatWrapping; trackT.repeat.set(1, 3); const trkM = mat(0xffffff, .85, .2, {map: trackT});
  for (const sx of [-1, 1]) { const tg = new THREE.Group(); tg.position.set(sx * .78, 0, 0); ex.add(tg);
    box(.42, .34, 1.9, trkM, 0, .27, 0, tg); for (const ez of [-.95, .95]) { const e = cyl(.27, .27, .42, trkM, 0, .27, ez, tg, 18); e.rotation.z = Math.PI / 2; }
    box(.3, .2, 1.6, dk, 0, .3, 0, tg); for (const z of [-.6, -.2, .2, .6]) { const w = cyl(.09, .09, .44, stl, 0, .14, z, tg, 10); w.rotation.z = Math.PI / 2; } }
  box(1.0, .3, 1.2, dk, 0, .42, 0, ex);
  const blade = box(2.0, .42, .1, yel, 0, .26, -1.32, ex); bar([-.4, .45, -.6], [-.4, .3, -1.25], .045, yel, ex); bar([.4, .45, -.6], [.4, .3, -1.25], .045, yel, ex);
  const up = new THREE.Group(); up.position.y = .62; ex.add(up);
  cyl(.62, .62, .1, dk, 0, .05, 0, up, 24);
  box(1.62, .62, 1.55, yel, 0, .42, .2, up);
  const cw = cyl(.82, .82, .62, yel, 0, .42, .42, up, 28); cw.scale.set(1, 1, .7); cw.geometry.translate(0, 0, 0);
  box(.8, .34, .9, yel, .38, .88, .35, up);
  { const grill = tex(128, 64, (g, w, h) => { g.fillStyle = "#2a2b2e"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; for (let x = 6; x < w; x += 10) g.fillRect(x, 6, 5, h - 12); }); const gr = box(.5, .2, .01, mat(0xffffff, .6, .2, {map: grill}), .55, .55, -.58, up); }
  // cab: posts, a roof and glass all round
  const cab = new THREE.Group(); cab.position.set(-.36, .72, -.12); up.add(cab);
  for (const [px, pz] of [[-.4, -.48], [.4, -.48], [-.4, .48], [.4, .48]]) box(.06, 1.2, .06, dk, px, .6, pz, cab);
  box(.9, .07, 1.04, yel, 0, 1.22, 0, cab); box(.86, 1.12, .98, gl, 0, .6, 0, cab).castShadow = false;
  box(.5, .14, .5, dk, 0, .2, .05, cab); box(.5, .55, .1, dk, 0, .5, .28, cab);
  // boom (bent), stick and bucket; hydraulic rams ride along them
  const boom = new THREE.Group(); boom.position.set(.28, .62, -.72); up.add(boom);
  box(.3, .5, .3, yel, 0, .1, .05, boom);
  bar([0, 0, 0], [0, 1.25, -1.0], .2, yel, boom); bar([0, 1.25, -1.0], [0, 1.0, -2.5], .2, yel, boom);
  bar([0, -.1, .02], [0, .9, -.9], .05, stl, boom, true); bar([0, 1.35, -.9], [0, 1.3, -1.9], .045, stl, boom, true);
  const stick = new THREE.Group(); stick.position.set(0, 1.0, -2.5); boom.add(stick);
  bar([0, .25, 0], [0, -1.75, 0], .16, yel, stick); bar([0, .3, -.08], [0, -1.2, -.12], .04, stl, stick, true);
  const bkt = new THREE.Group(); bkt.position.set(0, -1.75, 0); stick.add(bkt);
  { const sh = add(new THREE.CylinderGeometry(.34, .34, .62, 18, 1, true, Math.PI * .5, Math.PI * 1.1), mat(0x3a3b3e, .55, .4, {side: THREE.DoubleSide}), 0, -.3, -.12, bkt); sh.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const e = add(new THREE.CircleGeometry(.34, 18, Math.PI * .5, Math.PI * 1.1), mat(0x3a3b3e, .55, .4, {side: THREE.DoubleSide}), s * .31, -.3, -.12, bkt); e.rotation.y = s * Math.PI / 2; e.rotation.z = 0; }
    for (let i = 0; i < 4; i++) box(.06, .12, .05, stl, -.22 + i * .147, -.66, -.06, bkt); box(.2, .14, .2, yel, 0, 0, 0, bkt); }
  const load = mound(1, 1, mat(0xffffff, 1, 0, {map: spoilT}), 0, 0, bkt); load.position.set(0, -.34, -.14); load.scale.set(.27, .18, .2);
  // pose: [boom, stick, bucket curl, swing]
  const P = {park: [.55, -.95, 1.4, 0], reach: [-.05, .75, -.5, 0], down: [-.42, .12, -.1, 0], curl: [-.3, -.25, 1.25, 0], lift: [.45, -.25, 1.35, 0],
             pile: [.45, -.1, 1.35, -2.46], dump: [.38, .45, -.75, -2.46], trim: [-.5, .35, .25, 0]};
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const cyc = u => { const K = [[0, P.lift], [.14, P.reach], [.28, P.down], [.4, P.curl], [.52, P.lift], [.66, P.pile], [.78, P.dump], [.88, P.pile], [1, P.lift]];
    for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const t = (u - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return [mix(K[i - 1][1], K[i][1], t * t * (3 - 2 * t)), i]; } return [P.lift, 8]; };
  const EX = (x0 + x1) / 2 - .9, EZ = z1 + 2.25, N = 5, A = .22, B = .66;
  let fix = -1;
  const set = ({fix: f = 0} = {}) => { if (Math.abs(f - fix) < 1e-4) return; fix = f;
    const dig = ss(A + .02, B, f), dep = Math.max(.001, dig * D);
    hole(dig > .003); pit.visible = dig > .003; pit.scale.set(W, 1, L); walls.scale.y = dep; floor.position.y = -dep + .005; floor.scale.set(1, 1, 1);
    lipM.opacity = Math.min(1, dig * 6); lip.visible = dig > .003;
    gravel.visible = f > .7; gravel.material.opacity = 1; gravel.scale.setScalar(Math.max(.01, ss(.7, .8, f)));
    const fm = ss(.78, .9, f); forms.visible = fm > .01; forms.scale.set(1, fm, 1);
    strings.visible = f < A; stakes.visible = f < .9;
    // the pile grows with each dump; the skirt of loose soil around it
    const pv = Math.min(1, ss(A, B, f) * 1.05); spoil.visible = skirt.visible = pv > .01; spoil.scale.set(.6 + 1.7 * Math.sqrt(pv), .08 + 1.25 * pv, .5 + 1.4 * Math.sqrt(pv)); skirt.scale.setScalar(1 + 1.9 * Math.sqrt(pv));
    // the machine: in from the street, digs, trims, then backs off and parks
    const inn = ss(.03, .18, f), out = ss(.88, .98, f);
    ex.position.set(EX - out * 4.3, 0, EZ + (1 - inn) * 26 + out * 3); ex.rotation.y = out * .5;
    let pose = P.park, loaded = false;
    if (f > .18 && f < A) pose = mix(P.park, P.lift, ss(.18, A, f));
    else if (f >= A && f < B) { const u = (f - A) / (B - A) * N, [p, k] = cyc(u % 1); pose = p; loaded = k >= 4 && k <= 7; }
    else if (f >= B && f < .74) pose = mix(P.trim, [P.trim[0], P.trim[1] - .5, P.trim[2], 0], .5 - .5 * Math.cos((f - B) / (.74 - B) * Math.PI * 4));
    else if (f >= .74 && f < .88) pose = mix(P.trim, P.park, ss(.74, .84, f));
    boom.rotation.x = pose[0]; stick.rotation.x = pose[1]; bkt.rotation.x = pose[2]; up.rotation.y = pose[3];
    load.visible = loaded; blade.position.y = f > .2 && f < .88 ? .2 : .26; };
  set({fix: 0});
  return {root, set, exclude: (px, pz) => (px > x0 - .5 && px < x1 + .5 && pz > z0 - .5 && pz < z1 + .5) || Math.hypot((px - PX) / 2.4, (pz - PZ) / 2.1) < 1};
}

// wellJob(world): a well drilling rig in the front yard left of the path. The rig backs in (.03-.18), the jacks go down and the
// mast swings up (.18-.32), it drills rod after rod with cuttings piling up (.32-.62), hits water and it sprays out of the hole
// (.6-.7), the casing goes in and gets its cap (.7-.78), the mast lays back down (.76-.86) and the rig drives off (.88-.98),
// leaving the well cap in a ring of raked soil. A flag marks the spot before it starts.
export function wellJob(world, {x = -11, z = 11.4} = {}) {
  const root = new THREE.Group(); root.position.set(x, 0, z); world.scene.add(root);
  const {mat, add, box, cyl, r, ss, tex, bar, mound, soilTex} = kit3(root, 59);
  // ---------- the spot: a flag, then mud, cuttings, the casing and its cap, raked soil at the end ----------
  const flag = new THREE.Group(); root.add(flag); cyl(.006, .006, .6, mat(0x8a8d90, .5), 0, .3, 0, flag, 5); { const f = add(new THREE.PlaneGeometry(.16, .11), mat(0x2a64d6, .6, 0, {side: THREE.DoubleSide}), .08, .54, 0, flag); f.rotation.y = .6; }
  const mudT = tex(512, 512, (g, w, h) => { for (let i = 0; i < 300; i++) { const cx = w / 2 + (r() - .5) * w * .5, cy = h / 2 + (r() - .5) * h * .5, rad = 30 + r() * 90, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const c = r() < .5 ? "74,64,52" : "56,48,40"; gr.addColorStop(0, `rgba(${c},.45)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, w, h); } });
  const mudM = mat(0xffffff, .85, 0, {map: mudT, transparent: true, depthWrite: false, envMapIntensity: .3, polygonOffset: true, polygonOffsetFactor: -2});
  const mud = add(new THREE.CircleGeometry(2.0, 40), mudM, -.2, .013, -.3); mud.rotation.x = -Math.PI / 2; mud.castShadow = false; mud.renderOrder = 2;
  const pudM = mat(0x3e372e, .45, 0, {transparent: true, opacity: .8, depthWrite: false, envMapIntensity: .3, polygonOffset: true, polygonOffsetFactor: -3});
  const pud = add(new THREE.CircleGeometry(.9, 36), pudM, -.6, .016, -.4); pud.rotation.x = -Math.PI / 2; pud.scale.set(1, 1.4, 1); pud.castShadow = false; pud.renderOrder = 3;
  const cutT = tex(256, 256, (g, w, h) => { g.fillStyle = "#8d8478"; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = ["#6f675d", "#a49b8e", "#5c544b"][i % 3]; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } });
  const cuttings = mound(1, 1, mat(0xffffff, .9, 0, {map: cutT}), -1.15, .5, root, .2);
  const soil = add(new THREE.CircleGeometry(1.5, 40), mat(0xffffff, 1, 0, {map: soilTex("72,56,38"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2}), 0, .012, 0); soil.rotation.x = -Math.PI / 2; soil.castShadow = false; soil.renderOrder = 2;
  const straw = new THREE.Group(); root.add(straw); const strM = mat(0xd9c27a, .8);
  for (let i = 0; i < 160; i++) { const a = r() * 6.28, rr = .35 + Math.sqrt(r()) * 1.05, s = box(.12 + r() * .1, .006, .008, strM, Math.cos(a) * rr, .02, Math.sin(a) * rr, straw); s.rotation.y = r() * 3.14; s.castShadow = false; }
  const casing = new THREE.Group(); root.add(casing);
  cyl(.085, .085, .62, mat(0x4a4d52, .45, .7), 0, .31, 0, casing, 20); cyl(.105, .105, .1, mat(0xf2f1ec, .5), 0, .66, 0, casing, 20); cyl(.07, .07, .04, mat(0xf2f1ec, .5), 0, .73, 0, casing, 20);
  { const conduit = cyl(.012, .012, .2, mat(0x6b6e72, .5, .5), .09, .55, 0, casing, 6); conduit.rotation.z = .5; }
  const gravelRing = add(new THREE.RingGeometry(.09, .34, 28), mat(0x9a968e, .95), 0, .015, 0, casing); gravelRing.rotation.x = -Math.PI / 2; gravelRing.castShadow = false;
  // water spraying out when the drill hits it
  const dropM = mat(0xd4e3ee, .05, 0, {transparent: true, opacity: .55, envMapIntensity: 1.2}), drops = [];
  for (let i = 0; i < 220; i++) { const d = add(new THREE.SphereGeometry(.012 + r() * .016, 5, 4), dropM, 0, 0, 0); d.scale.y = 2.2; d.castShadow = false; drops.push([d, r() * 6.28, .2 + r() * .7, r(), 1.8 + r() * 1.8]); }
  const jet = add(new THREE.CylinderGeometry(.24, .05, 2.6, 18, 1, true), mat(0xeef4f8, .1, 0, {transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.5}), 0, 1.35, 0); jet.castShadow = false;
  // ---------- the rig: a straight truck, rear at the hole, cab toward the street (+z) ----------
  const red = mat(0xb8322a, .45, .2), wht = mat(0xf1efe9, .5, .1), dk = mat(0x26282b, .6, .3), stl = mat(0xb9bcbf, .3, .85), rub = mat(0x1a1a1a, .9), gl = mat(0x1e2a33, .06, .3);
  const rig = new THREE.Group(); root.add(rig);
  box(1.1, .3, 7.0, dk, 0, .82, 4.6, rig);
  for (const wz of [2.0, 3.25, 7.35]) for (const sx of [-1, 1]) { const w = cyl(.52, .52, .36, rub, sx * 1.0, .52, wz, rig, 22); w.rotation.z = Math.PI / 2; const h = cyl(.28, .28, .38, stl, sx * 1.0, .52, wz, rig, 14); h.rotation.z = Math.PI / 2; }
  for (const wz of [2.6, 7.35]) box(2.4, .1, wz > 5 ? 1.4 : 2.6, dk, 0, 1.12, wz, rig);
  box(2.5, .16, 5.2, mat(0x4b4e52, .7, .4), 0, 1.12, 3.6, rig);
  // cab with a windshield, side windows and a grille
  const cabG = new THREE.Group(); cabG.position.set(0, 0, 7.6); rig.add(cabG);
  box(2.4, 1.5, 1.7, wht, 0, 2.1, 0, cabG); box(2.4, .9, .9, wht, 0, 1.35, 1.2, cabG); box(2.3, .9, .04, gl, 0, 2.35, .86, cabG).castShadow = false;
  for (const sx of [-1, 1]) box(.04, .7, 1.0, gl, sx * 1.21, 2.4, .1, cabG).castShadow = false;
  box(1.6, .5, .05, dk, 0, 1.4, 1.66, cabG); box(2.5, .22, .2, stl, 0, .95, 1.7, cabG); for (const sx of [-1, 1]) cyl(.1, .1, .05, mat(0xfff4d6, .2, 0, {emissive: 0x332a10}), sx * .9, 1.45, 1.67, cabG, 12).rotation.x = Math.PI / 2;
  box(2.4, .1, .1, red, 0, 1.6, 1.66, cabG); box(.05, 1.5, 1.7, red, 1.21, 2.0, 0, cabG); box(.05, 1.5, 1.7, red, -1.21, 2.0, 0, cabG);
  box(2.0, .5, .1, dk, 0, 2.9, -.95, cabG); // the rack the mast rests on
  // the power unit, the pump, a water tank and a rack of drill rods on the deck
  box(1.6, 1.1, 1.5, red, -.2, 1.75, 4.6, rig); box(1.7, .1, 1.6, dk, -.2, 2.33, 4.6, rig); cyl(.06, .06, .5, dk, .3, 2.6, 4.9, rig, 8);
  { const t = cyl(.55, .55, 1.6, wht, .55, 1.75, 2.9, rig, 22); t.rotation.x = Math.PI / 2; }
  for (let i = 0; i < 8; i++) { const p = cyl(.045, .045, 3.0, stl, -1.0 + (i % 4) * .1, 1.32 + Math.floor(i / 4) * .1, 2.5, rig, 8); p.rotation.x = Math.PI / 2; }
  box(.08, .35, .08, dk, -1.15, 1.35, 1.2, rig); box(.08, .35, .08, dk, -1.15, 1.35, 3.8, rig);
  // rear jacks
  const jacks = []; for (const sx of [-1, 1]) { const j = new THREE.Group(); j.position.set(sx * 1.1, 0, 1.25); rig.add(j); box(.18, .5, .18, red, 0, 1.0, 0, j); const leg = cyl(.07, .07, 1.0, stl, 0, .5, 0, j, 10); const pad = box(.4, .05, .4, dk, 0, .03, 0, j); jacks.push([leg, pad]); }
  // ---------- the mast: a lattice tower pivoting at the back of the deck, the top head that drives the rods ----------
  const MH = 8.6, mast = new THREE.Group(); mast.position.set(0, 1.25, .95); rig.add(mast);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.1, MH, .1, red, sx * .26, MH / 2, sz * .2, mast);
  for (let y = .5; y < MH; y += .55) { for (const sz of [-1, 1]) bar([-.26, y, sz * .2], [.26, y + .5, sz * .2], .03, red, mast); for (const sx of [-1, 1]) bar([sx * .26, y, -.2], [sx * .26, y + .5, .2], .03, red, mast); }
  box(.7, .35, .6, red, 0, MH + .1, 0, mast); { const sh = cyl(.18, .18, .1, stl, 0, MH + .32, 0, mast, 16); sh.rotation.z = Math.PI / 2; }
  bar([0, MH + .32, -.18], [0, 1, -.62], .012, dk, mast, true);
  const head = new THREE.Group(); mast.add(head); head.position.set(0, 6, -.62);
  box(.62, .55, .5, mat(0x2f3134, .5, .5), 0, 0, .1, head); box(.4, .2, .4, red, 0, .35, .1, head); const spin = cyl(.14, .14, .2, stl, 0, -.38, 0, head, 12);
  for (const sx of [-1, 1]) cyl(.04, .04, .4, dk, sx * .22, .1, .25, head, 8);
  const rodT = tex(32, 128, (g, w, h) => { g.fillStyle = "#9da2a6"; g.fillRect(0, 0, w, h); g.fillStyle = "#6b7074"; g.fillRect(0, 0, w / 3, h); g.fillStyle = "#c9cdd0"; g.fillRect(w * .55, 0, w / 6, h); });
  rodT.wrapT = THREE.RepeatWrapping; const rod = cyl(.05, .05, 1, mat(0xffffff, .35, .7, {map: rodT}), 0, 0, -.62, mast, 12);
  // a helper at the back: hard hat and vest
  const man = new THREE.Group(); man.position.set(2.2, 0, .2); man.rotation.y = -1.4; root.add(man);
  { const skin = mat(0xc89270, .7), jeans = mat(0x2f3f5a, .9), vest = mat(0xe8f23a, .6), hat = mat(0xf2f1ec, .4);
    for (const sx of [-1, 1]) cyl(.07, .07, .85, jeans, sx * .1, .43, 0, man, 8); box(.38, .55, .22, mat(0x4a5560, .8), 0, 1.15, 0, man); box(.4, .5, .24, vest, 0, 1.17, 0, man);
    for (const sx of [-1, 1]) { const a = cyl(.05, .05, .6, mat(0x4a5560, .8), sx * .24, 1.1, .05, man, 8); a.rotation.x = -.3; }
    add(new THREE.SphereGeometry(.12, 14, 10), skin, 0, 1.56, 0, man); const h = add(new THREE.SphereGeometry(.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat, 0, 1.6, 0, man); box(.3, .02, .32, hat, 0, 1.6, -.03, man); }
  // ---------- timeline ----------
  let fix = -1, tt = 0, drilling = false, spray = 0;
  const water = time => { for (const [d, a, v, ph, hgt] of drops) { if (spray < .01) { d.visible = false; continue; } const p = (time * 1.4 + ph) % 1; d.visible = true;
    d.position.set(Math.cos(a) * v * p * .8, .7 + (hgt * p - 3.4 * p * p) * spray, Math.sin(a) * v * p * .8); } dropM.opacity = .55 * spray; };
  world.onTick.push((t, dt) => { tt += dt; if (drilling) { spin.rotation.y += dt * 14; rod.rotation.y += dt * 14; } if (spray > .01) water(tt); });
  const set = ({fix: f = 0} = {}) => { if (Math.abs(f - fix) < 1e-4) return; fix = f;
    const inn = ss(.03, .18, f), out = ss(.88, .98, f);
    rig.position.z = (1 - inn) * 22 + out * 22; rig.visible = f > .02 && f < .985; man.visible = f > .18 && f < .88;
    const jk = ss(.18, .22, f) * (1 - ss(.84, .88, f)); for (const [leg, pad] of jacks) { leg.scale.y = .25 + .75 * jk; leg.position.y = 1.0 - .5 * (.25 + .75 * jk); pad.position.y = 1.0 - (.25 + .75 * jk) + .03; }
    const raise = ss(.21, .32, f) * (1 - ss(.76, .86, f)); mast.rotation.x = (1 - raise) * 1.22;
    // drilling: four rods, the head runs down each one and back up for the next
    const dr = ss(.32, .66, f) * 4; let hy = 7.4;
    if (f >= .32 && f < .7) { const k = dr % 1, n = Math.floor(dr); hy = n >= 4 ? 1.2 : k < .82 ? 7.4 - (k / .82) * 6.2 : 1.2 + ((k - .82) / .18) * 6.2; }
    else if (f >= .7) hy = 7.4;
    head.position.y = hy; const showRod = f > .3 && f < .72; rod.visible = showRod; rod.scale.y = hy + 1.25; rod.position.y = (hy - 1.25) / 2 - .35;
    drilling = f > .32 && f < .66;
    spray = ss(.6, .63, f) * (1 - ss(.67, .7, f)); water(tt || 0); jet.visible = spray > .01; jet.scale.set(1, Math.max(.01, spray), 1); jet.position.y = .05 + 1.3 * spray; jet.material.opacity = .35 * spray;
    const wet = ss(.33, .5, f) * (1 - ss(.8, .9, f)); mudM.opacity = wet; mud.visible = wet > .01;
    const pw = ss(.6, .66, f) * (1 - ss(.78, .9, f)); pudM.opacity = .8 * pw; pud.visible = pw > .01;
    const cv = ss(.34, .62, f) * (1 - ss(.82, .9, f)); cuttings.visible = cv > .01; cuttings.scale.set(.35 + .55 * Math.sqrt(cv), .05 + .3 * cv, .3 + .45 * Math.sqrt(cv));
    casing.visible = f > .7; casing.position.y = -.62 * (1 - ss(.7, .76, f)); casing.children[1].visible = casing.children[2].visible = f > .76;
    const sv = ss(.8, .9, f); soil.visible = straw.visible = sv > .01; soil.material.opacity = sv; straw.scale.setScalar(Math.max(.01, ss(.9, .96, f)));
    flag.visible = f < .3; };
  set({fix: 0});
  return {root, set, exclude: (px, pz) => Math.hypot(px - x, pz - z) < 1.8};
}

// mobileJob(world): a mobile mechanic at the house. The customer's pickup sits in the drive, nose to the street, hood up and
// won't start; the mechanic's own truck (workTruck, placed by the caller) parks nose to nose. set({fix}): the mechanic walks up
// with a rolling tool chest (.04-.16), the work light comes on (.16-.22), the old battery and belt come out onto a mat (.4-.5),
// the light goes off and the hood comes down (.72-.8), the headlights come on and a puff from the tailpipe (.82-.95), and the
// chest and mat are packed up (.88-.98).
export async function mobileJob(world, {x = 9.5, z = 13} = {}) {
  const {makeTruck} = await import("./garage.js");
  const root = new THREE.Group(); root.position.set(x, 0, z); world.scene.add(root);
  const {mat, add, box, cyl, ss} = kit3(root, 71);
  const car = makeTruck(world, {color: 0x1f4f8f, lights: true}); root.add(car.car);
  // the mechanic: work shirt, dark pants, cap; stands at the front bumper facing the engine
  const man = new THREE.Group(); root.add(man);
  const skin = mat(0xc89270, .7), pants = mat(0x2b2f36, .9), shirt = mat(0x5d6b7a, .8), cap = mat(0x1d1f22, .6);
  const legs = []; for (const sx of [-1, 1]) legs.push(cyl(.075, .07, .86, pants, sx * .1, .43, 0, man, 8));
  const torso = new THREE.Group(); torso.position.set(0, .86, 0); man.add(torso);
  box(.4, .58, .24, shirt, 0, .3, 0, torso); box(.4, .04, .25, mat(0x1a1b1d, .7), 0, .02, 0, torso);
  for (const sx of [-1, 1]) { const a = cyl(.052, .05, .62, shirt, sx * .25, .32, .12, torso, 8); a.rotation.x = -.9; }
  add(new THREE.SphereGeometry(.12, 14, 10), skin, 0, .72, 0, torso);
  add(new THREE.SphereGeometry(.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap, 0, .75, 0, torso); box(.2, .02, .16, cap, 0, .76, .14, torso);
  // rolling tool chest: red drawers, chrome pulls, casters
  const chest = new THREE.Group(); root.add(chest);
  const red = new THREE.MeshPhysicalMaterial({color: 0xb3241c, metalness: .3, roughness: .35, clearcoat: .6, envMapIntensity: .6}), chrome = mat(0xd8dde2, .25, .9), blk = mat(0x1a1b1d, .7);
  box(.7, .78, .45, red, 0, .52, 0, chest); box(.72, .05, .47, blk, 0, .93, 0, chest);
  for (let i = 0; i < 5; i++) { box(.66, .006, .01, blk, 0, .26 + i * .14, .226, chest); box(.3, .02, .03, chrome, 0, .33 + i * .14, .24, chest); }
  for (const [cx, cz] of [[-.28, -.17], [.28, -.17], [-.28, .17], [.28, .17]]) cyl(.05, .05, .04, blk, cx, .06, cz, chest, 12).rotation.z = Math.PI / 2;
  const hdl = box(.04, .04, .5, chrome, .38, .9, 0, chest); hdl.rotation.y = 0;
  // work light on a stand, aimed at the engine bay
  const lamp = new THREE.Group(); root.add(lamp); lamp.position.set(1.55, 0, 3.55);
  for (let k = 0; k < 3; k++) { const l = cyl(.012, .012, .9, blk, Math.cos(k * 2.1) * .16, .42, Math.sin(k * 2.1) * .16, lamp, 6); l.rotation.set(-Math.sin(k * 2.1) * .35, 0, Math.cos(k * 2.1) * .35); }
  cyl(.016, .016, .9, chrome, 0, 1.2, 0, lamp, 8);
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); head.rotation.set(-.55, -.75, 0); lamp.add(head);
  box(.3, .22, .08, mat(0xe0b31a, .5, .2), 0, 0, 0, head);
  const lampM = mat(0xfff6e0, .3, 0, {emissive: 0xfff2d6, emissiveIntensity: 0}); box(.26, .18, .01, lampM, 0, 0, -.045, head);
  const beam = new THREE.SpotLight(0xfff2d6, 0, 7, .7, .6, 1.4); beam.position.set(0, 1.62, 0); lamp.add(beam); beam.target.position.set(-1.5, .6, -1.9); lamp.add(beam.target);
  // a mat by the front wheel with the old battery and belt
  const M = new THREE.Group(); root.add(M); M.position.set(-1.55, 0, 2.2);
  const matt = box(.9, .012, 1.1, mat(0x2a2d31, .95), 0, .008, 0, M);
  const old = new THREE.Group(); M.add(old);
  box(.32, .22, .18, mat(0x222428, .6), .05, .13, -.2, old); box(.32, .02, .18, mat(0x3a3d42, .5), .05, .25, -.2, old);
  cyl(.02, .02, .03, mat(0xc8261b, .5), -.06, .27, -.2, old, 8); cyl(.02, .02, .03, mat(0x1d1f22, .5), .16, .27, -.2, old, 8);
  const belt = add(new THREE.TorusGeometry(.17, .012, 6, 28), mat(0x151617, .85), -.05, .02, .25, old); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 1.6, 1);
  // exhaust puff when it starts
  const puffM = mat(0xd9dbde, 1, 0, {transparent: true, opacity: 0, depthWrite: false});
  const puffs = [0, 1, 2].map(i => { const p = add(new THREE.SphereGeometry(.14, 12, 8), puffM, .5 + i * .05, .32 + i * .08, -2.85 - i * .22); p.castShadow = false; return p; });
  let fixT = -1, lastSh = -1;
  function set({fix = 0} = {}) {
    if (fix === fixT) return; fixT = fix; const f = fix;
    const walk = ss(.04, .16, f), pack = ss(.88, .98, f);
    man.visible = f > .03 && f < .985; man.position.set(-.35 + pack * -1.6, 0, 3.75 + (1 - walk) * 9 + pack * 7); man.rotation.y = pack > 0 ? 0 : Math.PI;
    torso.rotation.x = .38 * ss(.18, .26, f) * (1 - ss(.7, .76, f)); torso.position.z = -.1 * torso.rotation.x;
    const stride = Math.sin(f * 220) * .35 * ((walk > 0 && walk < 1) || (pack > 0 && pack < 1) ? 1 : 0); legs[0].rotation.x = stride; legs[1].rotation.x = -stride;
    chest.visible = man.visible; chest.position.set(-1.45 + pack * -1.2, 0, 4.15 + (1 - walk) * 9 + pack * 7); chest.rotation.y = .35;
    lamp.visible = f > .12 && f < .88; const on = ss(.16, .22, f) * (1 - ss(.7, .74, f)); lampM.emissiveIntensity = 2.2 * on; beam.intensity = 9 * on;
    M.visible = f > .3 && f < .9; old.visible = f > .44; old.scale.setScalar(.6 + .4 * ss(.4, .5, f));
    const hood = 1 - ss(.72, .8, f), lights = f > .84;
    car.set({hood, lights});
    const pf = ss(.84, .97, f); puffM.opacity = .55 * Math.sin(Math.PI * pf); puffs.forEach((p, i) => { p.visible = pf > 0 && pf < 1; p.scale.setScalar(.6 + pf * (1.4 + i * .5)); p.position.y = .32 + i * .08 + pf * .35; });
    if (Math.abs(f - lastSh) > .004 || ((f === 0 || f === 1) && f !== lastSh)) { lastSh = f; world.shadows(); }
  }
  set({fix: 0});
  return {root, set, car, exclude: () => false};
}
