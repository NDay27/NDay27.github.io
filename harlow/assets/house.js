// Harlow Building Co. — procedural modern farmhouse that builds itself.
// One model drives the Immersive scroll story, the "design yours" configurator and the rendered images on the
// Essential and Signature tiers. Every board is real geometry: survey stakes, footings, joists, studs at 16" on
// center with headers over openings, rafters, OSB, house wrap, board-and-batten, roofing, windows, porch.
import {THREE, pbr, fbm, hash, mix, clamp, leafCard} from "./world.js";

const S16 = 0.406;                    // 16" on center
const LUM = [0.038, 0.14];            // 2x6 (thickness, depth)
const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
const smooth = (a, b, x) => clamp((x - a) / (b - a));

// ---------- textures ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const TX = {
  lumber: () => pbr(256, (u, v) => { const g = fbm(u * 3, v * 40, 3, 5), k = fbm(u * 9, v * 2, 9, 3); const w = .86 + g * .2 - (k > .72 ? .18 : 0);
    return [226 * w, 196 * w, 146 * w, g, .78]; }, [1, 1], 1.2),
  osb: () => pbr(512, (u, v) => { const a = hash((u * 46) | 0, (v * 18 + ((u * 46) | 0) * .37) | 0), b = fbm(u * 60, v * 60, 60, 3);
    const w = .72 + a * .32 + b * .1; return [196 * w, 160 * w, 104 * w, a * .6 + b * .4, .9]; }, [1, 1], 2.2),
  boardBatten: () => pbr(512, (u, v) => { const f = (u * 3) % 1, bat = f < .16, edge = f < .02 || (f > .14 && f < .16), g = fbm(u * 6, v * 30, 6, 4);
    const w = (bat ? 1 : .93) * (edge ? .82 : 1) + g * .04; return [234 * w, 234 * w, 230 * w, bat ? 1 : .2 + g * .05, .62 + g * .1]; }, [1, 1], 3.5),
  concrete: () => pbr(512, (u, v) => { const g = fbm(u * 8, v * 8, 8, 5), s = fbm(u * 80, v * 80, 80, 2); const w = 160 + g * 36 + s * 14;
    return [w, w - 2, w - 7, g * .5, .9]; }, [1, 1], 1.4),
  slab: () => pbr(512, (u, v) => { const g = fbm(u * 8, v * 8, 8, 5), s = fbm(u * 90, v * 90, 90, 2), j = (u % .5) < .004 || (v % .5) < .004;
    const w = 176 + g * 30 + s * 12; return j ? [118, 114, 108, 0, 1] : [w, w - 3, w - 8, g * .3, .86]; }, [1, 1], 1.4),
  shingle: () => pbr(512, (u, v) => { const rows = 14, rv = v * rows, ri = Math.floor(rv), off = ri % 2 ? .5 : 0, cu = u * 9 + off, ci = Math.floor(cu);
    const fv = rv - ri, g = fbm(u * 70, v * 70, 70, 3), k = .82 + hash(ci * 5, ri * 11) * .3, gap = (cu - ci) < .03 || fv > .94;
    return gap ? [30, 30, 32, 0, 1] : [150 * k + g * 30, 150 * k + g * 30, 152 * k + g * 30, 1 - fv * .7, .92]; }, [1, 1], 3),
  seam: () => pbr(256, (u, v) => { const f = (u * 2) % 1, rib = f < .035, g = fbm(u * 20, v * 20, 20, 3);
    return [rib ? 255 : 196 + g * 20, rib ? 255 : 196 + g * 20, rib ? 255 : 200 + g * 20, rib ? 1 : 0, rib ? .3 : .42 + g * .1]; }, [1, 1], 4),
  timber: () => pbr(256, (u, v) => { const g = fbm(u * 4, v * 30, 4, 5), k = fbm(u * 2, v * 6, 2, 3); const w = .72 + g * .3 + k * .1;
    return [150 * w, 110 * w, 76 * w, g, .55]; }, [1, 1], 1.6),
  deck: () => pbr(256, (u, v) => { const pv = u * 7, pi = Math.floor(pv), f = pv - pi, g = fbm(v * 3 + pi * 7.1, u * 40, 3, 5);
    if (f < .05) return [34, 24, 18, 0, 1]; const w = .7 + g * .35 + Math.sin(pi * 12.9) * .05; return [140 * w, 104 * w, 74 * w, .8, .62]; }, [1, 1], 2),
  soil: () => pbr(512, (u, v) => { const g = fbm(u * 18, v * 18, 18, 6), s = fbm(u * 90, v * 90, 90, 2); const w = .8 + g * .35 + s * .1;
    return [104 * w, 80 * w, 58 * w, g, .98]; }, [1, 1], 2),
};

// House wrap with a repeat print, like the real thing.
function wrapTex() {
  return canvasTex(1024, 512, (x, w, h) => {
    x.fillStyle = "#eef0f2"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(150,160,170,${Math.random() * .07})`; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1); }
    x.font = "700 34px 'Schibsted Grotesk', Arial, sans-serif"; x.fillStyle = "rgba(32,64,104,.55)"; x.textBaseline = "middle";
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) x.fillText("HARLOW  BUILT SQUARE", c * 470 + (r % 2) * 235, 64 + r * 128);
  });
}
// The lit room you see through a window at dusk: warm ceiling falloff, a shelf, a lamp, a plant.
function roomTex(seed) {
  return canvasTex(256, 256, (x, w, h) => {
    const r = n => { const s = Math.sin(seed * 91.7 + n * 12.3) * 43758.5; return s - Math.floor(s); };
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffe6c4"); g.addColorStop(.55, "#d6a87a"); g.addColorStop(1, "#4a3424"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const rg = x.createRadialGradient(w * (.3 + r(1) * .4), h * .1, 4, w * .5, h * .3, w * .8); rg.addColorStop(0, "rgba(255,246,226,.9)"); rg.addColorStop(1, "rgba(255,214,160,0)"); x.fillStyle = rg; x.fillRect(0, 0, w, h);
    x.fillStyle = "rgba(60,30,12,.55)";
    if (r(2) > .4) { const sx = r(3) * w * .6; x.fillRect(sx, h * .35, w * .34, 6); x.fillRect(sx, h * .52, w * .34, 6); for (let i = 0; i < 7; i++) x.fillRect(sx + 6 + i * 10 + r(i + 4) * 4, h * .52 - 12 - r(i + 9) * 14, 7, 12 + r(i + 9) * 14); }
    if (r(5) > .3) { const lx = w * (.15 + r(6) * .7); x.fillRect(lx - 2, h * .5, 4, h * .3); x.beginPath(); x.moveTo(lx - 22, h * .5); x.lineTo(lx + 22, h * .5); x.lineTo(lx + 14, h * .38); x.lineTo(lx - 14, h * .38); x.fill(); }
    x.fillStyle = "rgba(40,20,8,.6)"; x.fillRect(0, h * .82, w, h * .18);
  });
}

// ---------- geometry helpers ----------
function wallShape(len, y0, y1, rise, holes) {
  const s = new THREE.Shape(); s.moveTo(0, y0); s.lineTo(len, y0); s.lineTo(len, y1); if (rise > 0) s.lineTo(len / 2, y1 + rise); s.lineTo(0, y1); s.closePath();
  for (const o of holes) { const p = new THREE.Path(); p.moveTo(o.u - o.w / 2, o.y0); p.lineTo(o.u - o.w / 2, o.y1); p.lineTo(o.u + o.w / 2, o.y1); p.lineTo(o.u + o.w / 2, o.y0); p.closePath(); s.holes.push(p); }
  return s;
}
function uvScale(geo, sx, sy) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return geo; }
function extrude(shape, depth) { return new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: false, curveSegments: 1}); }

export function makeHouse(world, opt = {}) {
  const {scene} = world, root = new THREE.Group(); scene.add(root);
  const env = m => (m.envMapIntensity = m.envMapIntensity ?? 1, m);
  const clipMats = [];
  const clipMat = (params, key) => { const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -100); const m = env(new THREE.MeshStandardMaterial({...params, clippingPlanes: [plane], clipShadows: true})); m.userData.plane = plane; m.userData.key = key; clipMats.push(m); return m; };
  world.R.localClippingEnabled = true;

  const tx = {lumber: TX.lumber(), osb: TX.osb(), bb: TX.boardBatten(), conc: TX.concrete(), slab: TX.slab(), shingle: TX.shingle(), seam: TX.seam(), timber: TX.timber(), deck: TX.deck(), soil: TX.soil()};
  const M = {
    lumber: env(new THREE.MeshStandardMaterial({...tx.lumber, roughness: .8})),
    conc: env(new THREE.MeshStandardMaterial({...tx.conc})),
    sheath: clipMat({...tx.osb, side: THREE.DoubleSide}, "sheath"),
    wrap: clipMat({map: wrapTex(), roughness: .55, side: THREE.DoubleSide}, "wrap"),
    siding: clipMat({...tx.bb, color: 0xf4f2ec}, "siding"),
    sidingWing: null,
    sub: null,
    roofDeck: clipMat({...tx.osb, side: THREE.DoubleSide}, "roofDeck"),
    roof: clipMat({...tx.seam, color: 0x2e3135, metalness: .7, roughness: .5}, "roof"),
    wingRoof: null,
    trim: env(new THREE.MeshStandardMaterial({color: 0x1d2024, roughness: .5})),
    frame: env(new THREE.MeshStandardMaterial({color: 0x15171a, roughness: .38, metalness: .2})),
    glass: new THREE.MeshPhysicalMaterial({color: 0x0f141a, roughness: .04, metalness: 0, transparent: true, opacity: .42, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .05, depthWrite: false}),
    seam: null,
    timber: env(new THREE.MeshStandardMaterial({...tx.timber})),
    deck: env(new THREE.MeshStandardMaterial({...tx.deck})),
    door: env(new THREE.MeshStandardMaterial({...TX.timber(), color: 0xb98a62, roughness: .45})),
    gdoor: env(new THREE.MeshStandardMaterial({color: 0x1d2024, roughness: .5, metalness: .1})),
    slab: env(new THREE.MeshStandardMaterial({...tx.slab})),
    soil: env(new THREE.MeshStandardMaterial({...tx.soil, transparent: true})),
    flag: new THREE.MeshStandardMaterial({color: 0xff5a1f, roughness: .6, side: THREE.DoubleSide}),
    string: new THREE.LineBasicMaterial({color: 0xfff1c9, transparent: true}),
    metal: env(new THREE.MeshStandardMaterial({color: 0x23262a, roughness: .35, metalness: .7})),
  };
  M.sidingWing = M.siding;
  { const r = k => { const t = tx.seam[k].clone(); t.center.set(.5, .5); t.rotation = Math.PI / 2; t.repeat.set(1, 10); t.needsUpdate = true; return t; };
    [tx.seam.map, tx.seam.normalMap, tx.seam.roughnessMap].forEach(t => t.repeat.set(16, 1));
    M.wingRoof = clipMat({map: r('map'), normalMap: r('normalMap'), roughnessMap: r('roughnessMap'), color: 0x2e3135, metalness: .7, roughness: .5}, "roof"); } M.sub = env(new THREE.MeshStandardMaterial({...tx.osb}));
  // per-material texture scale (ExtrudeGeometry UVs are in meters)
  [tx.bb.map, tx.bb.normalMap, tx.bb.roughnessMap].forEach(t => t.repeat.set(1, 1));
  [tx.osb.map, tx.osb.normalMap, tx.osb.roughnessMap].forEach(t => t.repeat.set(.42, .84));
  [tx.slab.map, tx.slab.normalMap, tx.slab.roughnessMap].forEach(t => t.repeat.set(.12, .12));
  M.slab.color.setHex(0xd2d0cb);

  const pieces = []; // {obj, t0, t1, kind, base}
  const add = (obj, t0, t1, kind = "drop", parent = root) => { parent.add(obj); obj.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); pieces.push({obj, t0, t1, kind, base: obj.position.clone(), sc: obj.scale.clone()}); return obj; };
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

  // ---------- instanced lumber ----------
  const lumber = []; // {p: Vector3, q: Quaternion, s: Vector3, t0, t1}
  const tmpQ = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  const board = (x, y, z, sx, sy, sz, t0, t1, rotY = 0, rotX = 0) => { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0, "YXZ")); lumber.push({p: new THREE.Vector3(x, y, z), q, s: new THREE.Vector3(sx, sy, sz), t0, t1}); };

  // ---------- dimensions ----------
  const W = 12, D = 8, hx = W / 2, hz = D / 2;
  const yF = .5, yF1 = .76, yP1 = 3.46, yF2 = 3.72, yP2 = 6.22, pitch = .75, rise = hz * pitch, yR = yP2 + rise; // main block
  const wx0 = 6, wx1 = 13, wz0 = -4, wz1 = 3, wy0 = .12, wyP = 3.02, wRise = (wx1 - wx0) / 2 * pitch; // garage wing
  const T = LUM[1];

  // ---------- timeline (0..1) ----------
  const ST = opt.stages || {stake: [0, .05], found: [.05, .15], deck1: [.15, .23], walls1: [.23, .35], deck2: [.35, .4], walls2: [.4, .5], rafters: [.5, .58], sheath: [.58, .64], wrap: [.62, .68], roof: [.66, .74], windows: [.68, .76], siding: [.74, .86], porch: [.78, .88], land: [.86, .96]};

  // ---------- site: stakes + string lines, dirt, foundation ----------
  const site = new THREE.Group(); root.add(site);
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(15, 64), M.soil); dirt.rotation.x = -Math.PI / 2; dirt.position.set(2.5, .015, 1); dirt.scale.set(1.15, .85, 1); dirt.receiveShadow = true; site.add(dirt);
  const stakes = new THREE.Group(); root.add(stakes);
  const corners = [[-hx - 1, hz + 1], [hx + 1, hz + 1], [wx1 + 1, wz1 + 1], [wx1 + 1, wz0 - 1], [-hx - 1, -hz - 1]];
  const stakeGeo = new THREE.BoxGeometry(.05, .9, .05), flagGeo = new THREE.PlaneGeometry(.18, .12);
  for (const [x, z] of corners) { const s = box(.05, .9, .05, M.lumber); s.position.set(x, .45, z); s.castShadow = true; stakes.add(s); const f = new THREE.Mesh(flagGeo, M.flag); f.position.set(x + .1, .84, z); stakes.add(f); }
  const sp = []; for (let i = 0; i < corners.length; i++) { const a = corners[i], b = corners[(i + 1) % corners.length]; sp.push(a[0], .55, a[1], b[0], .55, b[1]); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); stakes.add(new THREE.LineSegments(sg, M.string));

  const fnd = (x0, z0, x1, z1, y1) => { const g = new THREE.Group(); const h = y1 + .4, t = .25;
    [[x0, z0, x1, z0 + t], [x0, z1 - t, x1, z1], [x0, z0, x0 + t, z1], [x1 - t, z0, x1, z1]].forEach(([a, b, c, d]) => { const m = box(c - a, h, d - b, M.conc); m.position.set((a + c) / 2, h / 2 - .4, (b + d) / 2); g.add(m); });
    return g; };
  add(fnd(-hx, -hz, hx, hz, yF), ...ST.found, "rise");
  { const g = new THREE.Group(); const m = box(wx1 - wx0, wy0 + .3, wz1 - wz0, M.slab); m.position.set((wx0 + wx1) / 2, (wy0 - .3) / 2, (wz0 + wz1) / 2); g.add(m); add(g, ST.found[0] + .04, ST.found[1], "rise"); }

  // ---------- floor decks ----------
  const deck = (y, t0, t1) => {
    const n = Math.floor(W / S16); for (let i = 0; i <= n; i++) { const x = -hx + .02 + i * (W - .04) / n; board(x, y + .12, 0, LUM[0], .24, D - .08, t0 + (t1 - t0) * .6 * i / n, t0 + (t1 - t0) * .6 * i / n + .02); }
    board(0, y + .12, hz - .02, W, .24, LUM[0], t0, t0 + .02); board(0, y + .12, -hz + .02, W, .24, LUM[0], t0, t0 + .02);
    const sub = box(W, .022, D, M.sub); sub.position.set(0, y + .251, 0); add(sub, t0 + (t1 - t0) * .7, t1, "drop");
  };
  deck(yF, ...ST.deck1); deck(yP1, ...ST.deck2);

  // ---------- walls ----------
  // A wall runs from (x0,z0) along dir for len; openings in wall coordinates (u along wall, absolute y).
  const walls = [];
  function wall({x0, z0, dir, len, yb, yt, gable = 0, open = [], tf, finish = [yb, yt + gable], skinY0, skinY1, skinGable = 0, skinOpen, mat = "siding", noFrame = false}) {
    const rot = Math.atan2(-dir[1], dir[0]);
    const at = (u, y, out = 0) => new THREE.Vector3(x0 + dir[0] * u + Math.sin(rot) * out, y, z0 + dir[1] * u + Math.cos(rot) * out);
    // framing: plates, studs at 16" o.c., king/jack studs, headers, sills, cripples, gable studs
    if (!noFrame) {
      const [t0, t1] = tf, span = t1 - t0, plate = (y, tt) => { const c = at(len / 2, y, -T / 2); board(c.x, c.y, c.z, len, LUM[0], T, tt, tt + .025, rot); };
      plate(yb + .019, t0); plate(yt - .019, t1 - .03); plate(yt - .057, t1 - .03);
      const inOpen = u => open.find(o => u > o.u - o.w / 2 - .06 && u < o.u + o.w / 2 + .06);
      const n = Math.ceil(len / S16), studs = [];
      for (let i = 0; i <= n; i++) studs.push(Math.min(len - .02, Math.max(.02, i * S16)));
      for (const o of open) studs.push(o.u - o.w / 2 - .02, o.u - o.w / 2 - .058, o.u + o.w / 2 + .02, o.u + o.w / 2 + .058);
      studs.sort((a, b) => a - b);
      for (const u of studs) {
        const tt = t0 + span * .1 + span * .75 * (u / len), o = inOpen(u);
        if (o && u > o.u - o.w / 2 - .01 && u < o.u + o.w / 2 + .01) { // cripples above/below
          const hy = o.y1 + .24; if (yt - .076 - hy > .05) { const c = at(u, (hy + yt - .076) / 2, -T / 2); board(c.x, c.y, c.z, LUM[0], yt - .076 - hy, T, tt, tt + .02, rot); }
          if (o.y0 - yb > .3) { const c = at(u, (yb + .038 + o.y0 - .04) / 2, -T / 2); board(c.x, c.y, c.z, LUM[0], o.y0 - .04 - yb - .038, T, tt, tt + .02, rot); }
          continue;
        }
        const h = yt - .076 - (yb + .038), c = at(u, yb + .038 + h / 2, -T / 2); board(c.x, c.y, c.z, LUM[0], h, T, tt, tt + .03, rot);
      }
      for (const o of open) { const tt = t0 + span * .1 + span * .75 * (o.u / len) + .01;
        const c = at(o.u, o.y1 + .12, -T / 2); board(c.x, c.y, c.z, o.w + .15, .24, T, tt, tt + .03, rot); // header
        if (o.y0 - yb > .3) { const s = at(o.u, o.y0 - .02, -T / 2); board(s.x, s.y, s.z, o.w, LUM[0], T, tt, tt + .03, rot); } }
      if (gable > 0) { // gable-end studs and the rake plate
        for (let u = S16; u < len; u += S16) { const h = gable * (1 - Math.abs(u - len / 2) / (len / 2)) - .06; if (h < .12) continue; const c = at(u, yt + h / 2, -T / 2); board(c.x, c.y, c.z, LUM[0], h, T, t1 - .02, t1 + .01, rot); }
      }
    }
    // skins: OSB sheathing, house wrap, siding (all one shape per facade, with the openings cut out)
    const y0 = skinY0 ?? yb - .1, y1 = skinY1 ?? yt, g = skinGable || gable, holes = skinOpen || open;
    const sh = wallShape(len, y0, y1, g, holes), q = new THREE.Quaternion().setFromAxisAngle(UP, rot);
    const layer = (m, out, depth) => { const geo = extrude(sh, depth), mesh = new THREE.Mesh(geo, m); mesh.quaternion.copy(q); mesh.position.copy(at(0, 0, out)); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); return mesh; };
    layer(M.sheath, 0, .012); layer(M.wrap, .013, .002);
    const sd = layer(M[mat], .016, .022);
    walls.push({at, rot, open: holes, len, sd, y0, y1, g});
    return {at, rot};
  }
  const o = (u, w, y0, y1, kind = "win") => ({u, w, y0, y1, kind});
  // window heights
  const w1 = [yF1 + .62, yF1 + 2.5], w2 = [yF2 + .78, yF2 + 2.3], dr = [yF1, yF1 + 2.3];
  const frontOpen1 = [o(2.6, 1.2, ...w1), o(6, 1.05, ...dr, "door"), o(9.4, 1.2, ...w1)], frontOpen2 = [o(2.6, 1.1, ...w2), o(6, 1.1, ...w2), o(9.4, 1.1, ...w2)];
  const sideLen = D - 2 * T;
  const leftOpen1 = [o(2.2, 1.1, ...w1), o(5.5, 1.1, ...w1)], leftOpen2 = [o(2.2, 1.1, ...w2), o(5.5, 1.1, ...w2)], attic = o(sideLen / 2, .7, yP2 + 1.2, yP2 + 1.9);
  const backOpen1 = [o(2.6, 1.2, ...w1), o(6, 2.4, yF1, yF1 + 2.3, "slider"), o(9.4, 1.2, ...w1)], backOpen2 = [o(2.6, 1.1, ...w2), o(9.4, 1.1, ...w2)];
  const rightOpen2 = [o(2.2, 1.1, ...w2), o(5.5, 1.1, ...w2)];
  const Wl = ST.walls1, Wu = ST.walls2;
  // first floor
  wall({x0: -hx, z0: hz, dir: [1, 0], len: W, yb: yF1, yt: yP1, open: frontOpen1, tf: Wl, skinY0: yF - .1, skinY1: yP2, skinOpen: [...frontOpen1, ...frontOpen2]});
  wall({x0: -hx, z0: -hz + T, dir: [0, 1], len: sideLen, yb: yF1, yt: yP1, open: leftOpen1, tf: Wl, skinY0: yF - .1, skinY1: yP2, skinGable: rise, skinOpen: [...leftOpen1, ...leftOpen2, attic]});
  wall({x0: hx, z0: -hz, dir: [-1, 0], len: W, yb: yF1, yt: yP1, open: backOpen1, tf: Wl, skinY0: yF - .1, skinY1: yP2, skinOpen: [...backOpen1, ...backOpen2]});
  wall({x0: hx, z0: hz - T, dir: [0, -1], len: sideLen, yb: yF1, yt: yP1, open: [], tf: Wl, skinY0: yF - .1, skinY1: yP2, skinGable: rise, skinOpen: [...rightOpen2, {...attic}]});
  // second floor (framing only; the skins above already cover both floors)
  const frameOnly = a => { const s = {...a, noFrame: false}; return s; };
  const fw = a => { // framing-only wall: reuse wall() framing code without skins
    const save = root.children.length; wall(a); const extra = root.children.splice(save); extra.forEach(m => { m.geometry.dispose(); }); walls.pop(); };
  fw(frameOnly({x0: -hx, z0: hz, dir: [1, 0], len: W, yb: yF2, yt: yP2, open: frontOpen2, tf: Wu}));
  fw({x0: -hx, z0: -hz + T, dir: [0, 1], len: sideLen, yb: yF2, yt: yP2, gable: rise, open: [...leftOpen2, attic], tf: Wu});
  fw({x0: hx, z0: -hz, dir: [-1, 0], len: W, yb: yF2, yt: yP2, open: backOpen2, tf: Wu});
  fw({x0: hx, z0: hz - T, dir: [0, -1], len: sideLen, yb: yF2, yt: yP2, gable: rise, open: [...rightOpen2, attic], tf: Wu});
  // garage wing: gable front and back, right side wall
  const wl = wx1 - wx0, gdoor = o(wl / 2, 4.6, wy0, wy0 + 2.3, "garage"), gwin = o(wl / 2, .9, wyP + .55, wyP + 1.35);
  const wingT = [ST.walls1[0] + .03, ST.walls1[1] + .02];
  wall({x0: wx0 + .01, z0: wz1, dir: [1, 0], len: wl - .01, yb: wy0, yt: wyP, gable: wRise, open: [gdoor, gwin], tf: wingT, mat: "sidingWing"});
  wall({x0: wx1, z0: wz1 - T, dir: [0, -1], len: wz1 - wz0 - 2 * T, yb: wy0, yt: wyP, open: [o(3.4, 1.1, wy0 + 1, wy0 + 2.4)], tf: wingT, mat: "sidingWing"});
  wall({x0: wx1, z0: wz0, dir: [-1, 0], len: wl - .01, yb: wy0, yt: wyP, gable: wRise, open: [o(wl / 2, 1, wy0 + 1, wy0 + 2.4)], tf: wingT, mat: "sidingWing"});

  // ---------- roofs: rafters, ridge, OSB deck, roofing, fascia ----------
  const ang = Math.atan(pitch), slopeLen = Math.hypot(hz, rise), ovh = .5, rake = .35, rd = .235;
  function gableRoof({cx, cz, along, span, length, yPlate, riseH, tf, td, tr, roofMat}) {
    // along: "x" = ridge runs along x; "z" = ridge runs along z
    const half = span / 2, a = Math.atan(riseH / half), sl = Math.hypot(half, riseH), full = sl + ovh / Math.cos(a), n = Math.ceil(length / .61);
    for (const side of [1, -1]) {
      for (let i = 0; i <= n; i++) { const s = -length / 2 + i * length / n, tt = tf[0] + (tf[1] - tf[0]) * .85 * i / n;
        const mid = full / 2 - ovh / Math.cos(a), dx = Math.cos(a) * mid, dy = Math.sin(a) * mid; // from plate to ridge
        const hm0 = (half + ovh) / 2 - .1 * Math.cos(a), pOut = hm0, py = yPlate + rd + (half - hm0) * Math.tan(a) - rd / (2 * Math.cos(a)) - .004;
        if (along === "x") board(cx + s, py, cz + side * pOut, LUM[0], rd, full - .2, tt, tt + .025, 0, side * a);
        else board(cx + side * pOut, py, cz + s, LUM[0], rd, full - .2, tt, tt + .025, Math.PI / 2, side * a);
      }
      const hm = (half + ovh) / 2, yTop = yPlate + rd + (half - hm) * Math.tan(a);
      const plane = (mat, off, w = length + 2 * rake) => {
        const m = box(along === "x" ? w : full, .02, along === "x" ? full : w, mat);
        m.position.set(along === "x" ? cx : cx + side * hm, yTop + (off + .011) / Math.cos(a), along === "x" ? cz + side * hm : cz);
        if (along === "x") m.rotation.x = side * a; else m.rotation.z = -side * a;
        m.castShadow = m.receiveShadow = true; root.add(m); return m;
      };
      plane(M.roofDeck, 0);
      const rf = plane(roofMat, .025); rf.scale.y = 2.2; rf.userData.seams = along;
      // fascia + rake boards in trim color
      const fas = box(along === "x" ? length + 2 * rake : .04, .34, along === "x" ? .04 : length + 2 * rake, M.trim);
      const ex = half + ovh + .02, ey = yPlate + rd - ovh * Math.tan(a) - .1;
      const sof = box(along === "x" ? length + 2 * rake : ovh + .1, .02, along === "x" ? ovh + .1 : length + 2 * rake, M.trim);
      sof.position.set(along === "x" ? cx : cx + side * (half + ovh / 2), ey - .16, along === "x" ? cz + side * (half + ovh / 2) : cz); add(sof, tr[0], tr[1], "fade");
      fas.position.set(along === "x" ? cx : cx + side * ex, ey, along === "x" ? cz + side * ex : cz); add(fas, tr[0], tr[1], "fade");
      for (const end of [1, -1]) { const rk = box(along === "x" ? .05 : full, .2, along === "x" ? full : .05, M.trim);
        rk.position.set(along === "x" ? cx + end * (length / 2 + rake) : cx + side * hm, yTop - .04, along === "x" ? cz + side * hm : cz + end * (length / 2 + rake));
        if (along === "x") rk.rotation.x = side * a; else rk.rotation.z = -side * a; add(rk, tr[0], tr[1], "fade"); }
    }
    // ridge board
    if (along === "x") board(cx, yPlate + riseH + rd * .9, cz, length, rd * 1.1, LUM[0], tf[0] - .01, tf[0] + .02); else board(cx, yPlate + riseH + rd * .9, cz, LUM[0], rd * 1.1, length, tf[0] - .01, tf[0] + .02);
  }
  gableRoof({cx: 0, cz: 0, along: "x", span: D, length: W, yPlate: yP2, riseH: rise, tf: ST.rafters, td: ST.sheath, tr: ST.roof, roofMat: M.roof});
  gableRoof({cx: (wx0 + wx1) / 2, cz: (wz0 + wz1) / 2 - .02, along: "z", span: wl, length: wz1 - wz0, yPlate: wyP, riseH: wRise, tf: [ST.rafters[0], ST.rafters[1] - .02], td: ST.sheath, tr: ST.roof, roofMat: M.wingRoof});
  // wing ceiling joists
  for (let z = wz0 + .2; z < wz1; z += S16 * 1.5) board((wx0 + wx1) / 2, wyP + .1, z, wl, .19, LUM[0], ST.rafters[0], ST.rafters[0] + .03);

  // ---------- windows, doors, trim ----------
  const glows = [];
  const rooms = [0, 1, 2, 3, 4, 5].map(roomTex);
  function fitOpenings() {
    let k = 0;
    for (const w of walls) for (const op of w.open) {
      const g = new THREE.Group(), c = w.at(op.u, (op.y0 + op.y1) / 2, .03); g.position.copy(c); g.rotation.y = w.rot;
      const ww = op.w, hh = op.y1 - op.y0, f = .07;
      if (op.kind === "garage") {
        const dtex = canvasTex(512, 256, (x, W2, H) => { x.fillStyle = "#e9e9e6"; x.fillRect(0, 0, W2, H); for (let r = 0; r < 4; r++) { x.fillStyle = "#cfd0cc"; x.fillRect(0, r * H / 4, W2, 3); }
          for (let i = 0; i < 6; i++) { x.fillStyle = "#3a3f46"; x.fillRect(18 + i * 82, 14, 66, 40); } });
        const d = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), env(new THREE.MeshStandardMaterial({map: dtex, color: 0x2a2d31, roughness: .45, metalness: .2}))); d.position.z = -.05; g.add(d);
        M.gdoorFace = d.material;
      } else if (op.kind === "door") {
        const d = box(ww - .08, hh - .04, .05, M.door); d.position.z = -.06; g.add(d);
        const lite = new THREE.Mesh(new THREE.PlaneGeometry(.22, hh * .7), M.glass); lite.position.set(0, .1, -.03); g.add(lite);
        const lg = new THREE.Mesh(new THREE.PlaneGeometry(.22, hh * .7), world.glowMat(0xffc27a, .7, {emissiveMap: rooms[0], color: 0x332010})); lg.position.set(0, .1, -.09); g.add(lg);
        const knob = box(.04, .04, .06, M.metal); knob.position.set(ww / 2 - .16, -.1, -.02); g.add(knob);
      } else {
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(ww - .05, hh - .05), world.glowMat(0xffd2a0, op.kind === "slider" ? .6 : .32 + (k % 4) * .09, {emissiveMap: rooms[k % 6], color: 0x231a14, roughness: .9}));
        glow.position.z = -.16; g.add(glow); glows.push(glow);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), M.glass); gl.position.z = -.02; g.add(gl);
        if (op.w > 1.15) { const m = box(.05, hh, f, M.frame); g.add(m); }
        if (op.kind === "slider") { const m = box(.06, hh, f, M.frame); g.add(m); }
      }
      // frame + casing
      if (op.kind !== "garage") [[0, hh / 2, ww + .02, .06], [0, -hh / 2, ww + .02, .06], [-ww / 2, 0, .06, hh], [ww / 2, 0, .06, hh]].forEach(([x, y, a, b]) => { const m = box(a, b, f, M.frame); m.position.set(x, y, -.01); g.add(m); });
      const cs = .11; [[0, hh / 2 + cs / 2, ww + cs * 2, cs], [0, -hh / 2 - cs / 2, ww + cs * 2, cs * (op.kind === "win" ? 1.2 : 1)], [-ww / 2 - cs / 2, 0, cs, hh], [ww / 2 + cs / 2, 0, cs, hh]].forEach(([x, y, a, b]) => { if (op.kind !== "win" && op.kind !== "garage" && y < 0 && b === cs) return; const m = box(a, b, .025, M.trim); m.position.set(x, y, .022); g.add(m); });
      add(g, ST.windows[0] + (ST.windows[1] - ST.windows[0]) * .7 * (k % 9) / 9, ST.windows[1], "drop"); k++;
    }
  }
  fitOpenings();
  // corner boards
  const corner = (x, z, y0, y1) => { const m = box(.14, y1 - y0, .14, M.trim); m.position.set(x, (y0 + y1) / 2, z); add(m, ST.siding[1] - .03, ST.siding[1], "fade"); };
  corner(-hx - .02, hz + .02, yF - .1, yP2); corner(hx + .02, hz + .02, wyP, yP2); corner(-hx - .02, -hz - .02, yF - .1, yP2); corner(hx + .02, -hz - .02, wyP, yP2);
  corner(wx1 + .02, wz1 + .02, wy0 - .1, wyP); corner(wx1 + .02, wz0 - .02, wy0 - .1, wyP);
  { const b = box(W + .1, .16, .05, M.trim); b.position.set(0, yP2 - .08, hz + .05); add(b, ST.siding[1] - .03, ST.siding[1], "fade");
    const b2 = b.clone(); b2.position.z = -hz - .05; add(b2, ST.siding[1] - .03, ST.siding[1], "fade"); }

  // ---------- porch: deck, timber posts, beam, standing-seam shed roof, steps ----------
  const porch = new THREE.Group(); root.add(porch);
  const px0 = -5.2, px1 = 5.2, pz0 = hz + .04, pz1 = hz + 2.6, pTop = yF + .02, beamY = yF1 + 2.62;
  { const g = new THREE.Group(); const d = box(px1 - px0, .08, pz1 - pz0, M.deck); d.position.set(0, pTop - .04, (pz0 + pz1) / 2); g.add(d);
    const sk = box(px1 - px0, pTop - .04, .04, M.trim); sk.position.set(0, (pTop - .04) / 2, pz1); g.add(sk);
    for (let i = 0; i < 3; i++) { const st = box(2.2, .18, .34, M.timber); st.position.set(0, pTop - .1 - i * .17 - .09 + .09, pz1 + .17 + i * .34); st.scale.y = 1; st.position.y = (pTop - (i + 1) * .17) + .09 - .09; g.add(st); }
    add(g, ST.porch[0], ST.porch[0] + .03, "drop", porch); }
  const posts = [px0 + .15, -1.7, 1.7, px1 - .15];
  posts.forEach((x, i) => { const p = box(.16, beamY - pTop, .16, M.timber); p.position.set(x, pTop + (beamY - pTop) / 2, pz1 - .15); add(p, ST.porch[0] + .02 + i * .008, ST.porch[0] + .05 + i * .008, "drop", porch);
    const br = box(.1, .1, .7, M.timber); br.position.set(x, beamY - .32, pz1 - .45); br.rotation.x = .78; add(br, ST.porch[0] + .05, ST.porch[0] + .07, "drop", porch); });
  { const b = box(px1 - px0, .3, .2, M.timber); b.position.set(0, beamY + .15, pz1 - .15); add(b, ST.porch[0] + .05, ST.porch[0] + .07, "drop", porch); }
  { const pa = Math.atan(.32 / (pz1 - pz0 + .4)), L = (pz1 - pz0 + .45) / Math.cos(pa);
    const g = new THREE.Group(); for (let x = px0; x <= px1 + .01; x += .61) { const r = box(.05, .18, L, M.timber); r.position.set(x, beamY + .38 + .16, (pz0 + pz1 + .45) / 2); r.rotation.x = pa; g.add(r); }
    add(g, ST.porch[0] + .06, ST.porch[0] + .08, "drop", porch);
    const pm = clipMat({map: tx.seam.map.clone(), normalMap: tx.seam.normalMap.clone(), roughnessMap: tx.seam.roughnessMap.clone(), color: 0x2e3135, metalness: .7, roughness: .5}, "porchRoof"); [pm.map, pm.normalMap, pm.roughnessMap].forEach(t => { t.repeat.set(13, 1); t.needsUpdate = true; }); M.porchRoof = pm;
    const rf = box(px1 - px0 + .3, .03, L + .1, pm); rf.userData.seams = "x"; rf.position.set(0, beamY + .66, (pz0 + pz1 + .45) / 2); rf.rotation.x = pa;
    add(rf, ST.porch[0] + .08, ST.porch[1], "drop", porch);
    const ceil = box(px1 - px0, .02, pz1 - pz0, M.deck); ceil.position.set(0, beamY + .32, (pz0 + pz1) / 2); add(ceil, ST.porch[0] + .07, ST.porch[0] + .09, "fade", porch); }
  // porch light + garage lanterns
  const lamps = [];
  { const l = world.lamp(0, beamY + .1, hz + 1.3, 0xffc58a, .9, 8); lamps.push(l); const fx = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .14, 16), world.glowMat(0xffd6a0, .5)); fx.position.set(0, beamY + .24, hz + 1.3); add(fx, ST.porch[1] - .02, ST.porch[1], "fade", porch); }
  for (const x of [wx0 + .7, wx1 - .7]) { const l = world.lamp(x, 2.75, wz1 + .5, 0xffc58a, .28, 4.5); lamps.push(l);
    const fx = new THREE.Group(); const c = box(.16, .3, .16, world.glowMat(0xffd6a0, .22)); fx.add(c); const cap = box(.22, .04, .22, M.frame); cap.position.y = .17; fx.add(cap); fx.position.set(x, 2.75, wz1 + .1); add(fx, ST.windows[1] - .02, ST.windows[1], "fade"); }

  // ---------- landscape: driveway, walk, shrubs, trees, mailbox, job sign ----------
  const land = new THREE.Group(); root.add(land);
  { const dv = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(5.4, 28), 5.4 * 8.3, 28 * 8.3), M.slab); dv.rotation.x = -Math.PI / 2; dv.position.set((wx0 + wx1) / 2, .02, wz1 + 14); dv.receiveShadow = true; add(dv, ST.land[0], ST.land[0] + .04, "fade", land);
    const wk = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(1.4, 7.2), 1.4 * 8.3, 7.2 * 8.3), M.slab); wk.rotation.x = -Math.PI / 2; wk.position.set(0, .021, pz1 + 4.6); wk.receiveShadow = true; add(wk, ST.land[0], ST.land[0] + .04, "fade", land);
    const wk2 = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(6.8, 1.3), 6.8 * 8.3, 1.3 * 8.3), M.slab); wk2.rotation.x = -Math.PI / 2; wk2.position.set(3.4, .022, pz1 + 7.6); wk2.receiveShadow = true; add(wk2, ST.land[0], ST.land[0] + .04, "fade", land);
    // road + curb along the front
    const rd2 = new THREE.Mesh(new THREE.PlaneGeometry(220, 8), new THREE.MeshStandardMaterial({color: 0x2a2c30, roughness: .92})); rd2.rotation.x = -Math.PI / 2; rd2.position.set(0, .012, wz1 + 32); rd2.receiveShadow = true; root.add(rd2); }
  // trees and shrubs: bark trunks + instanced leaf cards that sway (same technique as the Studio's barn demo)
  const leafT = leafCard(78, 34), cards = [], cardCol = [];
  const barkM = env(new THREE.MeshStandardMaterial({color: 0x4b3d31, roughness: .95}));
  const rnd = seed => { let s0 = seed * 9301 + 49297; return () => (s0 = (s0 * 16807) % 2147483647) / 2147483647; };
  const pals = [[.25, .42, .26], [.22, .46, .3], [.19, .42, .33], [.27, .38, .3]];
  const tree = (x, z, s, seed) => { const r = rnd(seed), hT = (3 + r() * 1.4) * s, tr = new THREE.Mesh(new THREE.CylinderGeometry(.14 * s, .32 * s, hT, 9), barkM); tr.position.set(x, hT / 2, z); tr.castShadow = true; root.add(tr);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.05 * s, .12 * s, 2 * s, 6), barkM), a = r() * 6.28; b.position.set(x + Math.cos(a) * .5 * s, hT * .78 + i * .3 * s, z + Math.sin(a) * .5 * s); b.rotation.set(Math.sin(a) * .8, 0, -Math.cos(a) * .8); b.castShadow = true; root.add(b); }
    const pal = pals[(r() * pals.length) | 0], cy = hT + 1.5 * s, rx = 2.5 * s, ry = 2.3 * s, n = Math.round(90 * s);
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, th = r() * 6.28, rr = Math.cbrt(r()) * .92, sq = Math.sqrt(1 - u * u);
      cards.push({x: x + Math.cos(th) * sq * rx * rr, y: cy + u * ry * rr, z: z + Math.sin(th) * sq * rx * rr, s: s * (1.3 + r() * .7), t0: -1, r: [r() * 3.14, r() * 3.14, r() * 3.14]});
      cardCol.push(new THREE.Color().setHSL(pal[0] + r() * .04, pal[1], pal[2] * (.75 + r() * .5))); } };
  const shrub = (x, z, s, t0, seed) => { const r = rnd(seed + 50), n = Math.round(26 * s);
    for (let i = 0; i < n; i++) { const th = r() * 6.28, u = r(), rr = Math.sqrt(r()) * .55 * s;
      cards.push({x: x + Math.cos(th) * rr, y: .22 * s + u * .5 * s, z: z + Math.sin(th) * rr * .8, s: (.42 + r() * .25) * s, t0, r: [r() * 3.14, r() * 3.14, r() * 3.14]});
      cardCol.push(new THREE.Color().setHSL(.24 + r() * .06, .45, .2 + r() * .1)); } };
  [-4.4, -3.2, -2, 2, 3.2, 4.4].forEach((x, i) => shrub(x, pz1 + .7, 1 + (i % 2) * .2, ST.land[0] + .02 + i * .006, i));
  [-5.9, -6, 13.6].forEach((x, i) => shrub(x, [1.6, -1.8, 1][i], 1.2, ST.land[0] + .05, i + 7));
  [[-1.4, pz1 + 8.6], [1.4, pz1 + 8.6]].forEach(([x, z], i) => shrub(x, z, .8, ST.land[0] + .06, i + 11));
  tree(-13, -7, 1.35, 1); tree(-17, 4, 1.1, 2); tree(19, -8, 1.4, 3); tree(-9, -15, 1.2, 4); tree(21, 6, 1, 5); tree(5, -16, 1.5, 6); tree(-24, 14, 1.3, 7); tree(28, -3, 1.2, 8);
  const leafU = {t: {value: 0}};
  const leafMat = new THREE.MeshStandardMaterial({map: leafT, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, envMapIntensity: .55});
  leafMat.onBeforeCompile = sh => { sh.uniforms.t = leafU.t; sh.vertexShader = "uniform float t;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
  vec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);float sw=sin(t*1.1+wp0.x*.2+wp0.z*.15)*.06+sin(t*2.3+wp0.y)*.03;transformed.x+=sw*(1.+position.y);transformed.z+=sw*.6;`); };
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), leafMat, cards.length);
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: leafT, alphaTest: .45});
  { const e = new THREE.Euler(), qq = new THREE.Quaternion(); cards.forEach((c, i) => { e.set(...c.r); qq.setFromEuler(e); c.q = qq.clone(); leaves.setColorAt(i, cardCol[i]); }); }
  leaves.castShadow = leaves.receiveShadow = true; root.add(leaves);
  world.onTick.push(t => { leafU.t.value = t; });
  // mailbox with the house number
  { const g = new THREE.Group(); const p = box(.1, 1.1, .1, M.timber); p.position.y = .55; g.add(p); const b = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .5, 16, 1, false, 0, Math.PI), M.frame); b.rotation.z = Math.PI / 2; b.rotation.y = Math.PI / 2; b.position.y = 1.12; g.add(b); const bb = box(.28, .14, .5, M.frame); bb.position.y = 1.05; g.add(bb);
    g.position.set(-2.4, 0, wz1 + 27.4); add(g, ST.land[0] + .03, ST.land[0] + .06, "drop", land); }
  // job sign (comes down when the house is done)
  const jobSign = new THREE.Group(); root.add(jobSign);
  const signTex = canvasTex(1024, 640, (x, w, h) => { x.fillStyle = "#14212e"; x.fillRect(0, 0, w, h); x.fillStyle = "#f0b429"; x.fillRect(0, h - 120, w, 120);
    x.fillStyle = "#f3f4f0"; x.font = "500 64px 'Newsreader', Georgia, serif"; x.fillText("Another home by", 70, 150); x.font = "700 132px 'Newsreader', Georgia, serif"; x.fillText("Harlow", 66, 300);
    x.font = "600 46px 'Schibsted Grotesk', Arial, sans-serif"; x.fillText("BUILDING CO.", 74, 380); x.fillStyle = "#14212e"; x.font = "700 64px 'Schibsted Grotesk', Arial, sans-serif"; x.fillText("(309) 555-0148", 70, h - 40); });
  { const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshStandardMaterial({map: signTex, roughness: .6})); face.position.set(0, 1.35, .03); jobSign.add(face);
    const back = box(1.64, 1.04, .04, M.frame); back.position.set(0, 1.35, 0); jobSign.add(back);
    [-.7, .7].forEach(x => { const p = box(.08, 1.4, .08, M.timber); p.position.set(x, .7, -.04); jobSign.add(p); });
    jobSign.position.set(-7.5, 0, wz1 + 13); jobSign.rotation.y = .35; jobSign.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
  // lumber pile on site during framing
  const pile = new THREE.Group(); root.add(pile);
  for (let r = 0; r < 5; r++) for (let i = 0; i < 9 - r; i++) { const b = box(.14, .038, 4.8, M.lumber); b.position.set(-10.5 + i * .16 + r * .08, .06 + r * .04, 7.5); b.castShadow = true; pile.add(b); }
  [-1.6, 0, 1.6].forEach(z => { const s = box(1.6, .08, .1, M.timber); s.position.set(-9.85, .02, 7.5 + z); pile.add(s); });

  // ---------- instanced lumber mesh ----------
  const IM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.lumber, lumber.length); IM.castShadow = IM.receiveShadow = true; root.add(IM);
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

  // ---------- progress ----------
  let P = -1;
  function setProgress(p) {
    p = clamp(p); if (Math.abs(p - P) < 1e-4) return; P = p;
    for (let i = 0; i < lumber.length; i++) { const L = lumber[i], e = ease(smooth(L.t0, L.t1, p));
      if (e <= 0) { m4.makeScale(0, 0, 0); } else { v3.copy(L.p); v3.y += (1 - e) * (1 - e) * 2.2; s3.copy(L.s); m4.compose(v3, L.q, s3); }
      IM.setMatrixAt(i, m4); }
    IM.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < cards.length; i++) { const c = cards[i], e = c.t0 < 0 ? 1 : ease(smooth(c.t0, c.t0 + .04, p)); v3.set(c.x, c.y, c.z); s3.setScalar(Math.max(1e-4, c.s * e)); m4.compose(v3, c.q, s3); leaves.setMatrixAt(i, m4); }
    leaves.instanceMatrix.needsUpdate = true;
    for (const pc of pieces) { const e = ease(smooth(pc.t0, pc.t1, p)), o = pc.obj; o.visible = e > 0.001;
      if (!o.visible) continue;
      if (pc.kind === "drop") { o.position.copy(pc.base); o.position.y += (1 - e) * (1 - e) * 2.4; }
      else if (pc.kind === "rise") { o.scale.set(1, Math.max(.001, e), 1); }
      else if (pc.kind === "grow") { o.scale.copy(pc.sc).multiplyScalar(Math.max(.001, e)); }
    }
    // skins reveal bottom-up with clipping planes
    const rev = (key, [a, b], top) => { const k = ease(smooth(a, b, p)); clipMats.filter(m => m.userData.key === key).forEach(m => m.userData.plane.constant = k <= 0 ? -100 : k >= 1 ? 100 : mix(-.2, top, k)); };
    rev("sheath", ST.sheath, 9.8); rev("wrap", ST.wrap, 9.8); rev("siding", ST.siding, 9.8); rev("roofDeck", ST.sheath, 10.2); rev("roof", ST.roof, 10.2); rev("porchRoof", [ST.porch[0] + .06, ST.porch[1]], 5);
    stakes.visible = p < ST.found[1]; M.string.opacity = 1 - smooth(ST.found[0], ST.found[1], p);
    M.soil.opacity = 1 - smooth(ST.land[0], ST.land[1], p); dirt.visible = M.soil.opacity > .01;
    pile.visible = p > ST.deck1[0] - .04 && p < ST.siding[0];
    jobSign.visible = p < ST.land[1] - .02;
    world.shadows();
  }
  // ---------- finishes ----------
  const FIN = {
    siding: {white: 0xf4f2ec, sage: 0xa9b8a0, navy: 0x2c3e55, charcoal: 0x3b3e42, clay: 0xc9b39a},
    roof: {black: 0x2e3135, weathered: 0x6f7378, brown: 0x5a4636},
    trim: {black: 0x1b1d20, white: 0xf2f1ec, bronze: 0x4a3b2c},
    door: {fir: 0xb98a62, black: 0x1f2226, red: 0x8e2f2a, sage: 0x7d8f73},
  };
  function setFinish(f = {}) {
    if (f.siding) M.siding.color.setHex(FIN.siding[f.siding] ?? f.siding);
    if (f.roof) M.roof.color.setHex(FIN.roof[f.roof] ?? f.roof);
    if (f.trim) { M.trim.color.setHex(FIN.trim[f.trim] ?? f.trim); }
    if (f.door) { M.door.color.setHex(FIN.door[f.door] ?? f.door); M.door.map = f.door === "fir" ? tx.timber.map : null; M.door.needsUpdate = true; }
    if (f.porch !== undefined) porch.visible = !!f.porch;
    world.shadows();
  }
  return {root, setProgress, setFinish, FIN, ST, exclude: (x, z) => (x > -hx - 1.2 && x < wx1 + 1 && z > -hz - 1 && z < pz1 + 1.5) || (x > wx0 - .3 && x < wx1 + .3 && z > wz1 && z < wz1 + 29) || (Math.abs(x) < 1 && z > pz1 && z < pz1 + 8.5) || (x > -.8 && x < 7 && z > pz1 + 6.8 && z < pz1 + 8.4) || z > wz1 + 27.5,
    get progress() { return P; }, lamps, M, walls, leaves, glows, dims: {W, D, yR, wx1}};
}
