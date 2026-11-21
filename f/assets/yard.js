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
