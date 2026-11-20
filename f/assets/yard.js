// Flagship home-trade kit: the yard around the Harlow house.
// mow(): grass height and stripes for lawn crews. yardTree(): a big front-yard shade tree that a tree crew can trim, raise or take down.
import {THREE, leafCard} from "../../harlow/assets/world.js";

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
