// Flagship auto kit: a small-town repair shop and a pickup, both procedural.
// makeGarage(world) builds a two-bay brick shop with a two-post lift, a lot and a truck that can sit on the lift,
// lose its wheels, lift its hood and drive out front. One model drives the Immersive scroll story and every
// rendered picture on the Starter and Signature tiers, so drawings, stills and live 3D always line up.
import {THREE, TEX, leafCard, signTexture, mix, clamp} from "../../harlow/assets/world.js";
import {toCreasedNormals} from "three/addons/utils/BufferGeometryUtils.js";

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const BAY1 = {x: -2.6, z: -4.7};          // lift centre (bay 1)
const OUT1 = {x: -1.2, z: 9.4, yaw: -.62}; // parked out front, nose toward the camera
export const PAINT = {red: 0xb3241c, white: 0xe9e9e4, blue: 0x1f4f8f, black: 0x16181b, silver: 0xa9afb5, green: 0x2f5a44};

// scrapes and crumples for the body-shop overlay (u runs tail to nose, v bottom to top of the side panels)
function scuffTex() {
  const W = 1024, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  let sd = 11; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const X = z => (z + .8) / 3.56 * W, Y = y => H - (y - .3) / .95 * H;
  // shade the crushed corner so the dent reads in flat light
  const sh = g.createRadialGradient(X(2.55), Y(.68), 4, X(2.55), Y(.68), 120); sh.addColorStop(0, "rgba(10,8,8,.5)"); sh.addColorStop(.6, "rgba(10,8,8,.22)"); sh.addColorStop(1, "rgba(10,8,8,0)");
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  // a long scrape down the door and bed side: bare primer and metal streaks
  for (let i = 0; i < 220; i++) { const y = .6 + r() * .16, z0 = -.6 + r() * 2.2, len = .2 + r() * .9; g.strokeStyle = r() < .65 ? "rgba(226,224,218," + (.45 + r() * .5) + ")" : "rgba(50,52,54," + (.3 + r() * .4) + ")";
    g.lineWidth = .8 + r() * 2.6; g.beginPath(); g.moveTo(X(z0), Y(y)); g.lineTo(X(z0 + len), Y(y + (r() - .5) * .025)); g.stroke(); }
  // folds at the front corner: dark creases with a bright edge
  for (let i = 0; i < 14; i++) { const z = 2.28 + i * .032 + r() * .02, y0 = .45 + r() * .1, y1 = .85 + r() * .1;
    g.lineWidth = 2 + r() * 2.5; g.strokeStyle = "rgba(20,16,14,.55)"; g.beginPath(); g.moveTo(X(z), Y(y0)); g.quadraticCurveTo(X(z + (r() - .5) * .08), Y((y0 + y1) / 2), X(z + (r() - .5) * .05), Y(y1)); g.stroke();
    g.lineWidth = 1; g.strokeStyle = "rgba(240,236,228,.35)"; g.beginPath(); g.moveTo(X(z) + 3, Y(y0)); g.lineTo(X(z) + 3, Y(y1)); g.stroke(); }
  // chipped paint along the folds
  for (let i = 0; i < 30; i++) { const z = 2.25 + r() * .45, y = .5 + r() * .4, s = 2 + r() * 6; g.fillStyle = "rgba(196,196,190," + (.5 + r() * .4) + ")";
    g.beginPath(); g.moveTo(X(z), Y(y)); for (let k = 0; k < 5; k++) g.lineTo(X(z) + (r() - .5) * s * 2, Y(y) + (r() - .5) * s); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function primerTex() {
  const W = 512, H = 128, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const X = z => (z + .8) / 3.56 * W, Y = y => H - (y - .3) / .95 * H;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H); g.filter = "blur(6px)"; g.fillStyle = "#fff";
  g.beginPath(); g.ellipse(X(2.5), Y(.7), X(2.95) - X(2.5) + 30, (Y(.4) - Y(.7)) * 1.15, 0, 0, 6.3); g.fill();
  g.beginPath(); g.roundRect(X(-.7), Y(.82), X(.95) - X(-.7), Y(.54) - Y(.82), 14); g.fill();
  const t = new THREE.CanvasTexture(c); return t;
}

// a windshield hit by a rock: a star break low on the driver side and a long crack running across (u runs driver to passenger, v bottom to top)
function crackTex() {
  const W = 1024, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  let sd = 23; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const cx = W * .3, cy = H * .62, line = (pts, w, a) => { g.lineWidth = w; g.strokeStyle = `rgba(236,242,246,${a})`; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  g.lineCap = g.lineJoin = "round";
  // the bullseye and the star around it
  const bull = g.createRadialGradient(cx, cy, 0, cx, cy, 34); bull.addColorStop(0, "rgba(240,244,248,.95)"); bull.addColorStop(.5, "rgba(220,228,234,.55)"); bull.addColorStop(1, "rgba(220,228,234,0)");
  g.fillStyle = bull; g.beginPath(); g.arc(cx, cy, 34, 0, 6.3); g.fill();
  for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28 + r() * .3, len = 40 + r() * 90; const pts = [[cx, cy]]; let x = cx, y = cy;
    for (let k = 1; k <= 6; k++) { x = cx + Math.cos(a + (r() - .5) * .25) * len * k / 6; y = cy + Math.sin(a + (r() - .5) * .25) * len * k / 6 * .9; pts.push([x, y]); }
    line(pts, 3 + r() * 1.5, .9); line(pts, 1, .55); }
  for (const rad of [22, 38]) { g.lineWidth = 1.1; g.strokeStyle = "rgba(236,242,246,.6)"; g.beginPath(); g.arc(cx, cy, rad + r() * 4, r() * 2, 2 + r() * 3); g.stroke(); }
  // the running crack, across toward the passenger side and up
  let x = cx + 60, y = cy - 10; const run = [[cx + 20, cy - 4], [x, y]];
  while (x < W * .93) { x += 24 + r() * 30; y += (r() - .62) * 22; run.push([x, Math.max(H * .12, y)]); }
  line(run, 3.6, .92); line(run.map(([a, b]) => [a + 2, b + 2]), 1.2, .4);
  for (let i = 0; i < 5; i++) { const k = 3 + Math.floor(r() * (run.length - 4)); const [a, b] = run[k]; line([[a, b], [a + 24 + r() * 36, b + (r() - .5) * 48]], 2, .75); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- the truck ----------
// The body is a loft: a cross-section swept from tail to nose. The sill follows the wheel arches, so the
// arches are real openings. The hood is the same surface cut out as its own panel, hinged at the cowl.
export function makeTruck(world, {color = PAINT.red, lights = true, glass: glassKit = false} = {}) {
  const car = new THREE.Group(), L = 5.5, Z0 = -L / 2, Z1 = L / 2, R = .39, RA = .53, AX = [1.66, -1.52];
  const paint = new THREE.MeshPhysicalMaterial({color, metalness: .2, roughness: .4, clearcoat: .6, clearcoatRoughness: .12, envMapIntensity: .55, side: THREE.DoubleSide});
  const glass = new THREE.MeshPhysicalMaterial({color: 0x0b1013, metalness: .1, roughness: .08, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: .9});
  const dark = new THREE.MeshStandardMaterial({color: 0x17191c, roughness: .78, envMapIntensity: .5});
  const rubber = new THREE.MeshStandardMaterial({color: 0x111214, roughness: .93, envMapIntensity: .3});
  const chrome = new THREE.MeshStandardMaterial({color: 0xd8dde2, metalness: .9, roughness: .24, envMapIntensity: .8});
  const alloy = new THREE.MeshStandardMaterial({color: 0xaeb3b8, metalness: .7, roughness: .42, envMapIntensity: .6});
  const steel = new THREE.MeshStandardMaterial({color: 0x8d9298, metalness: .9, roughness: .42, envMapIntensity: 1});
  const red = new THREE.MeshStandardMaterial({color: 0xc8261b, roughness: .5});
  const M = {paint, glass, dark, rubber, chrome, alloy, steel};
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = car) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);

  const halfW = z => .97 - .15 * Math.pow(smooth(2.25, 2.75, z), 1.6) - .04 * smooth(-2.45, -2.75, z);
  const top = z => z > .95 ? mix(1.11, 1.0, smooth(.95, 2.55, z)) - .1 * Math.pow(smooth(2.5, 2.75, z), 2) : mix(1.2, 1.14, smooth(-.78, -.7, z));
  const sill = z => { let b = z > 2.3 ? mix(.33, .47, smooth(2.3, 2.6, z)) : z < -2.4 ? mix(.33, .5, smooth(-2.4, -2.7, z)) : .33;
    for (const a of AX) { const d = z - a; if (Math.abs(d) < RA) b = Math.max(b, R + Math.sqrt(RA * RA - d * d)); } return b; };
  const HOOD = [1.0, 2.6];
  // stations: dense near the arches so they read as round
  const zs = []; for (let z = Z0; z <= Z1 + 1e-6; z += .055) zs.push(Math.min(z, Z1));
  const ring = z => { const w = halfW(z), b = sill(z), t = top(z), m = Math.max(.74, b + .12);
    const r = [[0, b], [w - .1, b], [w, b + .09], [w + .014, m], [w, t - .1], [w - .065, t], [0, t]];
    return r.concat(r.slice(1, 6).reverse().map(([x, y]) => [-x, y])); };
  const NR = 12, pos = [], body = [], hood = [];
  zs.forEach(z => ring(z).forEach(([x, y]) => pos.push(x, y, z)));
  for (let i = 0; i < zs.length - 1; i++) for (let k = 0; k < NR; k++) {
    const a = i * NR + k, b = i * NR + (k + 1) % NR, c = a + NR, d = b + NR, zm = (zs[i] + zs[i + 1]) / 2;
    (((k === 5 || k === 6) && zm > HOOD[0] && zm < HOOD[1]) ? hood : body).push(a, b, c, b, d, c);
  }
  // nose and tail caps
  const cap = (i, flip) => { const c = pos.length / 3, z = zs[i], r = ring(z); pos.push(0, (r[0][1] + r[6][1]) / 2, z); for (let k = 0; k < NR; k++) { const a = i * NR + k, b = i * NR + (k + 1) % NR; flip ? body.push(c, a, b) : body.push(c, b, a); } };
  cap(0, false); cap(zs.length - 1, true);
  const geo = (idx, P = pos, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); if (uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return toCreasedNormals(g, .62); };
  // body-shop states: the driver-side front corner pushed in (a morph target on the same loft), with an overlay
  // that shows the scrapes, then grey primer, then disappears under fresh paint. The hood seam never moves.
  const dentV = (x, y, z) => { if (x > -.25 || z < 1.9) return [0, 0];
    const k = smooth(-.25, -.6, x) * (1 - smooth(.9, 1.04, y)) * smooth(1.95, 2.25, z);
    const f = Math.exp(-((z - 2.55) ** 2) / (2 * .26 ** 2) - ((y - .7) ** 2) / (2 * .2 ** 2));
    const fold = Math.sin((z - 2.2) * 26 + y * 9) * Math.exp(-((y - .68) ** 2) / .03);
    return [k * (.25 * f + .04 * fold * f), -k * .22 * smooth(2.4, 2.75, z) * Math.exp(-((y - .68) ** 2) / .09)]; };
  const dpos = pos.slice(); for (let i = 0; i < pos.length; i += 3) { const [dx, dz] = dentV(pos[i], pos[i + 1], pos[i + 2]); dpos[i] += dx; dpos[i + 2] += dz; }
  const dented = (idx, P = pos, D = dpos, uv) => { const a = geo(idx, P, uv), b = geo(idx, D, uv); a.morphAttributes.position = [b.attributes.position]; a.morphAttributes.normal = [b.attributes.normal]; return a; };
  const shell = add(dented(body), paint); shell.userData.layer = "trim";
  // the overlay: driver-side panels from the cab back pillar to the nose, a few millimetres proud of the paint
  const PZ = [-.8, 2.76], ppos = pos.map((v, i) => i % 3 === 0 && v < 0 ? v - .005 : v), pdpos = dpos.map((v, i) => i % 3 === 0 && v < 0 ? v - .005 : v), puv = [], pidx = [];
  for (let i = 0; i < pos.length; i += 3) puv.push((pos[i + 2] - PZ[0]) / (PZ[1] - PZ[0]), (pos[i + 1] - .3) / .95);
  for (let i = 0; i < zs.length - 1; i++) if (zs[i] >= PZ[0] && zs[i + 1] <= PZ[1]) for (const k of [8, 9, 10]) { const a = i * NR + k, b = i * NR + (k + 1) % NR, c = a + NR, d = b + NR; pidx.push(a, b, c, b, d, c); }
  const patchG = dented(pidx, ppos, pdpos, puv);
  const scuffM = new THREE.MeshStandardMaterial({map: scuffTex(), transparent: true, opacity: 0, roughness: .75, metalness: .1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
  const primerM = new THREE.MeshStandardMaterial({color: 0xc6c8c8, alphaMap: primerTex(), transparent: true, opacity: 0, roughness: .92, envMapIntensity: .4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3});
  const scuff = add(patchG, scuffM), primer = add(patchG, primerM); scuff.castShadow = primer.castShadow = false; scuff.visible = primer.visible = false;
  // hood: pivot at the cowl
  const hoodPivot = new THREE.Group(); hoodPivot.position.set(0, top(HOOD[0]), HOOD[0]); car.add(hoodPivot);
  const hg = geo(hood); hg.translate(0, -top(HOOD[0]), -HOOD[0]);
  const hoodM = add(hg, paint, 0, 0, 0, hoodPivot); hoodM.material = paint.clone(); hoodM.material.side = THREE.DoubleSide; hoodM.userData.layer = "trim"; M.hood = hoodM.material;
  const prop = add(new THREE.CylinderGeometry(.012, .012, 1, 6), steel, .55, 0, 0); prop.visible = false;
  // engine bay
  const bay = new THREE.Group(); car.add(bay);
  box(1.62, .3, 1.56, dark, 0, .68, 1.8, bay).castShadow = false; bay.position.y = -.06; box(1.7, .5, .05, dark, 0, .9, 1.0, bay);
  box(.62, .3, .78, steel, 0, .86, 1.72, bay); box(.5, .05, .7, red, 0, 1.0, 1.72, bay);                 // block and valve cover
  box(.3, .2, .36, dark, -.55, .92, 1.42, bay); box(.24, .06, .3, new THREE.MeshStandardMaterial({color: 0x2b2f34, roughness: .5}), -.55, 1.03, 1.42, bay); // airbox
  box(.26, .2, .18, new THREE.MeshStandardMaterial({color: 0x101114, roughness: .6}), .56, .93, 1.36, bay);
  add(new THREE.CylinderGeometry(.018, .018, .05, 8), red, .49, 1.05, 1.36, bay); add(new THREE.CylinderGeometry(.018, .018, .05, 8), steel, .63, 1.05, 1.36, bay); // battery posts
  add(new THREE.CylinderGeometry(.075, .075, .2, 14), new THREE.MeshStandardMaterial({color: 0xe8ecef, roughness: .35, transparent: true, opacity: .85}), .58, .92, 2.2, bay); // washer bottle
  add(new THREE.CylinderGeometry(.05, .05, .03, 12), new THREE.MeshStandardMaterial({color: 0x2d6cdf, roughness: .5}), .58, 1.03, 2.2, bay);
  box(1.3, .34, .06, steel, 0, .86, 2.5, bay);                                                                // radiator
  add(new THREE.CylinderGeometry(.045, .045, .03, 12), new THREE.MeshStandardMaterial({color: 0xe7b416, roughness: .5}), -.18, 1.035, 1.98, bay); // oil cap
  for (const [x, z, r] of [[-.3, 2.2, .2], [.28, 1.3, .16]]) { const h = add(new THREE.TorusGeometry(r, .026, 8, 16, Math.PI), rubber, x, .84, z, bay); h.rotation.y = Math.PI / 2; }

  // cab: a glass house with a painted roof and pillars
  const CZ = [-.74, .98], BELT = 1.14, ROOF = 1.82, wb = .9, wt = .71;
  const roofY = z => z < -.6 ? mix(BELT, ROOF, smooth(-.74, -.6, z)) : z > .28 ? mix(ROOF, BELT, Math.pow(clamp((z - .28) / (CZ[1] - .28)), 1.15)) : ROOF + .018 * Math.sin((z + .6) / .88 * Math.PI);
  const wAt = y => mix(wb, wt, clamp((y - BELT) / (ROOF - BELT)));
  const cz = []; for (let z = CZ[0]; z <= CZ[1] + 1e-6; z += .06) cz.push(Math.min(z, CZ[1]));
  const cp = [], ci = [], rp = [], ri = [];
  cz.forEach(z => { const y = roofY(z), w = wAt(y); [[wb, BELT - .02], [w, y], [0, y + .012], [-w, y], [-wb, BELT - .02]].forEach(([x, yy]) => cp.push(x, yy, z)); });
  for (let i = 0; i < cz.length - 1; i++) for (let k = 0; k < 4; k++) { const a = i * 5 + k, b = a + 1, c = a + 5, d = b + 5; ci.push(a, b, c, b, d, c); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci);
  const cab = add(toCreasedNormals(cg, .5), glass); cab.material = glass; cab.userData.layer = "open";
  // roof panel, a touch proud of the glass
  const rz = cz.filter(z => z >= -.61 && z <= .3);
  rz.forEach(z => { const y = roofY(z) + .012; [[wt + .02, y - .05], [wt + .012, y], [0, y + .016], [-wt - .012, y], [-wt - .02, y - .05]].forEach(([x, yy]) => rp.push(x, yy, z)); });
  for (let i = 0; i < rz.length - 1; i++) for (let k = 0; k < 4; k++) { const a = i * 5 + k, b = a + 1, c = a + 5, d = b + 5; ri.push(a, b, c, b, d, c); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
  const roofM = add(toCreasedNormals(rg, .5), paint); roofM.material = paint.clone(); roofM.material.side = THREE.DoubleSide; M.roof = roofM.material; roofM.userData.layer = "trim";
  const strut = (a, b, w, d, mat) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B), m = add(new THREE.BoxGeometry(w, len, d), mat); m.position.copy(A).add(B).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m; };
  for (const s of [1, -1]) {
    strut([s * (wb + .005), BELT - .02, CZ[1] - .02], [s * (wt + .012), ROOF, .29], .05, .075, paint);       // A pillar
    strut([s * (wb + .005), BELT - .02, .12], [s * (wt + .012), ROOF, .1], .05, .09, dark);                   // B pillar
    strut([s * (wb + .005), BELT - .02, -.73], [s * (wt + .012), ROOF, -.6], .05, .13, paint);                // C pillar
    strut([s * (wt + .014), ROOF - .012, -.6], [s * (wt + .014), ROOF - .012, .3], .05, .05, paint);
    // mirror, handles, seams
    box(.14, .1, .07, dark, s * 1.08, 1.2, .82); box(.1, .03, .03, dark, s * 1.0, 1.17, .84);
    for (const z of [.5, -.3]) box(.02, .028, .14, chrome, s * .985, 1.02, z);
    for (const z of [.94, .1, -.72]) box(.008, .62, .012, dark, s * .986, .78, z);
    box(.012, .05, 2.1, dark, s * .975, .37, .07);                                                              // rocker trim
    for (const a of AX) { const f = add(new THREE.TorusGeometry(RA, .04, 8, 28, Math.PI), dark, s * .975, R, a); f.rotation.y = Math.PI / 2; f.scale.z = .7; }
  }
  // bed cover, tailgate, bumpers, lights
  box(1.64, .03, 1.82, dark, 0, 1.205, -1.72); box(1.5, .012, .02, chrome, 0, .93, -2.756); box(.3, .06, .02, dark, 0, 1.02, -2.756);
  box(1.9, .17, .16, chrome, 0, .5, -2.77); box(.34, .17, .012, new THREE.MeshStandardMaterial({color: 0xf2f2ee, roughness: .5}), 0, .5, -2.853);
  const tail = world.glowMat(0xd0221c, .35, {roughness: .35}); for (const s of [1, -1]) box(.1, .34, .04, tail, s * .87, .98, -2.74);
  const bumper = [box(1.86, .2, .17, dark, 0, .43, 2.72), box(1.5, .05, .02, chrome, 0, .5, 2.81)];
  box(1.12, .36, .05, dark, 0, .76, 2.735); for (let i = 0; i < 4; i++) box(1.06, .022, .02, chrome, 0, .63 + i * .085, 2.765); box(1.2, .03, .03, chrome, 0, .955, 2.74); box(1.2, .03, .03, chrome, 0, .57, 2.74);
  const lens = new THREE.MeshStandardMaterial({color: 0xd5dade, roughness: .7, metalness: 0, envMapIntensity: .4}), headOn = lights ? world.glowMat(0xfff1cf, .8, {roughness: .2}) : lens, heads = [];
  for (const s of [1, -1]) { heads.push(box(.2, .15, .05, lens, s * .7, .86, 2.715)); box(.24, .19, .03, chrome, s * .7, .86, 2.7); box(.1, .05, .03, new THREE.MeshStandardMaterial({color: 0xe08a1a, roughness: .4}), s * .7, .73, 2.715); }
  const cracked = new THREE.MeshStandardMaterial({color: 0x34393d, roughness: .35, metalness: .2, envMapIntensity: .8});
  const beams = []; if (lights) for (const s of [1, -1]) { const l = world.lamp(0, 0, 0, 0xfff1cf, .35, 9); car.add(l); l.position.set(s * .7, .8, 3.2); l.visible = false; beams.push(l); }

  // wheels: tire and rim are lathes; the hub, rotor and caliper stay on the truck when the wheel comes off
  const tireG = new THREE.LatheGeometry([[.245, -.14], [.33, -.14], [.375, -.115], [.39, -.06], [.39, .06], [.375, .115], [.33, .14], [.245, .14]].map(([r, x]) => new THREE.Vector2(r, x)), 36);
  const rimG = new THREE.LatheGeometry([[.245, -.13], [.25, .1], [.225, .12], [.2, .09], [.06, .1], [.06, .13], [0, .13]].map(([r, x]) => new THREE.Vector2(r, x)), 28);
  const wheels = [];
  for (const a of AX) for (const s of [1, -1]) {
    const hub = new THREE.Group(); hub.position.set(s * .84, R, a); car.add(hub);
    const rot = add(new THREE.CylinderGeometry(.2, .2, .03, 28), steel, 0, 0, 0, hub); rot.rotation.z = Math.PI / 2;
    const hat = add(new THREE.CylinderGeometry(.085, .085, .09, 16), steel, s * .03, 0, 0, hub); hat.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const st = add(new THREE.CylinderGeometry(.009, .009, .06, 6), chrome, s * .07, Math.cos(i * 1.2566) * .055, Math.sin(i * 1.2566) * .055, hub); st.rotation.z = Math.PI / 2; }
    box(.09, .13, .2, red, s * -.01, .13, -.1, hub);
    const well = add(new THREE.CylinderGeometry(RA - .02, RA - .02, .42, 20, 1, true, 0, Math.PI), dark, s * -.16, 0, 0, hub); well.rotation.z = Math.PI / 2; well.material = dark.clone(); well.material.side = THREE.DoubleSide; well.castShadow = false;
    const w = new THREE.Group(); hub.add(w);
    const tg = new THREE.Group(); tg.rotation.z = -s * Math.PI / 2; w.add(tg);
    add(tireG, rubber, 0, 0, 0, tg); add(rimG, alloy, 0, 0, 0, tg);
    for (let i = 0; i < 6; i++) { const sp = add(new THREE.BoxGeometry(.05, .016, .17), alloy, 0, .112, 0, tg); sp.position.set(Math.sin(i * 1.0472) * .14, .112, Math.cos(i * 1.0472) * .14); sp.rotation.y = i * 1.0472; }
    add(new THREE.CylinderGeometry(.045, .045, .02, 12), chrome, 0, .135, 0, tg);
    wheels.push({w, s, a});
  }
  car.traverse(o => { if (o.isMesh && !o.userData.layer) o.userData.layer = o.material === rubber ? "tire" : null; });
  let hoodT = -1, wheelT = -1, liftY = 0;
  // fix: 0 = damaged, about .55 = dent out and in grey primer, 1 = painted and polished. Undefined leaves the truck as built.
  let fixT = null, crash = 0;
  function setFix(f) {
    if (f === fixT) return; fixT = f;
    const dent = 1 - smooth(.1, .45, f), sc = 1 - smooth(.15, .3, f), pr = smooth(.25, .45, f) * (1 - smooth(.7, .95, f)), fr = smooth(.7, 1, f);
    shell.morphTargetInfluences[0] = dent; scuff.morphTargetInfluences[0] = primer.morphTargetInfluences[0] = dent;
    scuffM.opacity = sc; scuff.visible = sc > .01; primerM.opacity = pr; primer.visible = pr > .01;
    bumper.forEach(b => { b.rotation.y = -.2 * dent; b.rotation.z = .1 * dent; b.position.z = -.08 * dent; b.position.y = -.03 * dent; }); crash = dent;
    for (const m of [paint, M.roof, M.hood]) { m.roughness = mix(.55, .3, fr); m.clearcoat = mix(.3, .95, fr); m.clearcoatRoughness = mix(.25, .04, fr); }
  }
  function set({hood: h = 0, wheels: wt_ = 1, y = 0, lights: on = false, fix} = {}) {
    if (fix !== undefined && fix !== null) setFix(clamp(fix));
    const broken = fixT !== null && fixT < .45;
    liftY = y; car.position.y = y; heads.forEach((m, i) => m.material = i === 1 && broken ? cracked : on ? headOn : lens); beams.forEach((l, i) => l.visible = on && !(i === 1 && broken));
    hoodPivot.rotation.x = -h * 1.02 - .07 * crash; hoodPivot.rotation.z = .03 * crash;
    if (h !== hoodT) { hoodT = h; prop.visible = h > .5;
      if (prop.visible) { const A = new THREE.Vector3(.55, 1.0, 2.5), B = new THREE.Vector3(.55, top(HOOD[0]) + Math.sin(1.02 * h) * 1.35, HOOD[0] + Math.cos(1.02 * h) * 1.35); prop.position.copy(A).add(B).multiplyScalar(.5); prop.scale.y = A.distanceTo(B); prop.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize()); } }
    const k = 1 - wt_; wheelT = wt_;
    wheels.forEach(({w, s, a}) => { const out = smooth(0, .45, k), dn = smooth(.3, 1, k);
      w.position.set(s * (out * .5 + dn * .42), -dn * y, (a > 0 ? 1 : -1) * dn * .32); w.rotation.y = s * dn * .35; w.rotation.z = -s * dn * .07; });
  }
  // auto glass shops: a crack overlay that lies on the windshield, suction cups that set the new glass, and tape that holds the moulding while it cures
  let setGlass = () => {};
  if (glassKit) {
    const wsY = z => roofY(z) + .006, wsZ0 = .31, wsZ1 = .96, gp = [], gu = [], gi = [], NX = 14, NZ = 12;
    for (let j = 0; j <= NZ; j++) { const z = mix(wsZ0, wsZ1, j / NZ), y = wsY(z), w = wAt(y - .006) * .93;
      for (let i = 0; i <= NX; i++) { const u = i / NX; gp.push(mix(w, -w, u), y, z + .004); gu.push(u, 1 - j / NZ); } }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; gi.push(a, c, b, b, c, d); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3)); wg.setAttribute("uv", new THREE.Float32BufferAttribute(gu, 2)); wg.setIndex(gi); wg.computeVertexNormals();
    const crackM = new THREE.MeshStandardMaterial({map: crackTex(), transparent: true, roughness: .2, metalness: .1, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2});
    const crack = add(wg, crackM); crack.castShadow = false;
    const at = (u, v) => { const z = mix(wsZ1, wsZ0, v), y = wsY(z), w = wAt(y - .006) * .93; return new THREE.Vector3(mix(w, -w, u), y, z); };
    const nrm = new THREE.Vector3(0, .78, .62).normalize(), cups = new THREE.Group(); car.add(cups);
    const cupM = new THREE.MeshStandardMaterial({color: 0x2a2d31, roughness: .5}), barM = new THREE.MeshStandardMaterial({color: 0xd9a21b, roughness: .4, metalness: .2});
    for (const u of [.22, .78]) { const h = new THREE.Group(); h.position.copy(at(u, .5)); h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); cups.add(h);
      for (const dx of [-.09, .09]) { const c = add(new THREE.CylinderGeometry(.07, .075, .02, 18), cupM, dx, .012, 0, h); c.castShadow = false; }
      add(new THREE.BoxGeometry(.26, .035, .05), barM, 0, .07, 0, h); for (const dx of [-.09, .09]) add(new THREE.BoxGeometry(.025, .06, .03), barM, dx, .04, 0, h); }
    const tapeM = new THREE.MeshStandardMaterial({color: 0x2f7fd0, roughness: .8}), tape = new THREE.Group(); car.add(tape);
    for (const u of [.12, .32, .5, .68, .88]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.05, .004, .18), tapeM); t.position.copy(at(u, .97)); t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); t.translateZ(-.04); tape.add(t); }
    setGlass = f => { crackM.opacity = 1 - smooth(.38, .5, f); crack.visible = crackM.opacity > .01; cups.visible = f > .22 && f < .66; tape.visible = f > .6 && f < .96; };
    setGlass(0);
  }
  const set0 = set;
  set = function (o = {}) { set0(o); if (o.glass !== undefined && o.glass !== null) setGlass(clamp(o.glass)); };
  set();
  return {car, set: o => set(o), M, beams, setColor(c) { paint.color.setHex(c); M.hood.color.setHex(c); M.roof.color.setHex(c); }, get liftY() { return liftY; }};
}

// ---------- the shop ----------
export async function makeGarage(world, {sign = "Auto Repair", color = PAINT.red, second = true, font = "Archivo", kind = "auto"} = {}) {
  const {scene} = world, root = new THREE.Group(); scene.add(root);
  // truck shops: taller walls and wider, taller bay doors so a semi tractor fits; the office end stays the same
  const T = kind === "truck", X0 = -5.4, X1 = 9.2, D = 10.5, H = T ? 6.7 : 5.1, BW = T ? 4.2 : 3.7, BH = T ? 4.9 : 3.55, B2 = T ? 1.75 : 1.9; // bay 2 centre
  const BAY = T ? {x: -2.85, z: -.5} : BAY1, OUT = T ? {x: -1.8, z: 11.2, yaw: .12} : OUT1;
  const brickT = TEX.brick([1, 1], [142, 66, 50]), concT = TEX.concrete([1, 1]), asphT = TEX.asphalt([10, 5]), floorT = TEX.concrete([3, 2]);
  const brick = new THREE.MeshStandardMaterial({...brickT, envMapIntensity: .5});
  const cope = new THREE.MeshStandardMaterial({color: 0x23272c, metalness: .6, roughness: .5, envMapIntensity: .8});
  const white = new THREE.MeshStandardMaterial({color: 0xe9e8e2, roughness: .6, envMapIntensity: .6});
  const inner = new THREE.MeshStandardMaterial({color: 0xd9d6cc, roughness: .9, envMapIntensity: .35});
  const floor = new THREE.MeshStandardMaterial({...floorT, color: 0xb9bcbd, roughness: .55, envMapIntensity: .7});
  const conc = new THREE.MeshStandardMaterial({...concT, envMapIntensity: .5});
  const asph = new THREE.MeshStandardMaterial({...asphT, envMapIntensity: .5});
  const steel = new THREE.MeshStandardMaterial({color: 0x9aa0a6, metalness: .85, roughness: .4});
  const dark = new THREE.MeshStandardMaterial({color: 0x1b1e22, roughness: .7});
  const yellow = new THREE.MeshStandardMaterial({color: 0xe9b320, roughness: .5});
  const liftC = new THREE.MeshStandardMaterial({color: 0x1d58b8, metalness: .3, roughness: .45, envMapIntensity: .9});
  const redBox = new THREE.MeshStandardMaterial({color: 0xb4241b, metalness: .4, roughness: .4, envMapIntensity: .9});
  const paneG = new THREE.MeshPhysicalMaterial({color: 0x24313a, metalness: .1, roughness: .08, envMapIntensity: 1.5, clearcoat: 1});
  const M = {brick, cope, white, floor, conc, asph, liftC};
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, layer) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (layer) m.userData.layer = layer; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent, layer) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent, layer);

  // boxes whose texture is laid in world units, so brick coursing lines up around every corner and pier
  const wbox = (w, h, d, mat, x, y, z, U, V, layer) => { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); const X = p.getX(i) + x, Y = p.getY(i) + y, Z = p.getZ(i) + z;
      uv.setXY(i, (ax > .5 ? Z : X) / U, (ay > .5 ? Z : Y) / V); }
    return add(g, mat, x, y, z, root, layer); };
  const bk = (w, h, d, x, y, z) => wbox(w, h, d, brick, x, y, z, 1.9, 1.3, "wall");
  // ground: lot, apron, stripes
  const lot = add(new THREE.PlaneGeometry(64, 30.6), asph, 2, .012, 14.9, root, "ground"); lot.rotation.x = -Math.PI / 2; lot.castShadow = false;
  wbox(X1 - X0 + 2.4, .09, 5.2, conc, (X0 + X1) / 2, .02, 2.55, 7.2, 7.2, "ground").castShadow = false;
  const line = new THREE.MeshStandardMaterial({color: 0xe8e6dc, roughness: .8});
  for (let i = 0; i < 6; i++) { const m = add(new THREE.PlaneGeometry(.12, 5), line, 11.5 + i * 2.9, .02, 9.5); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  for (let i = 0; i < 9; i++) { const m = add(new THREE.PlaneGeometry(.12, 4.6), line, -22 + i * 2.9, .02, 21.5); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  box(64, .14, .3, conc, 2, .07, 30.1).castShadow = false;

  // walls: front with two bay openings, an office door and a window
  const front = [[X0, BAY.x - BW / 2], [BAY.x + BW / 2, B2 - BW / 2], [B2 + BW / 2, 4.9], [5.95, 6.5], [8.7, X1]];
  for (const [a, b] of front) bk(b - a, H, .34, (a + b) / 2, H / 2, -.17);
  for (const c of [BAY.x, B2]) bk(BW, H - BH, .34, c, BH + (H - BH) / 2, -.17);
  bk(1.05, H - 2.25, .34, 5.425, 2.25 + (H - 2.25) / 2, -.17);
  bk(2.2, .95, .34, 7.6, .475, -.17); bk(2.2, H - 2.5, .34, 7.6, 2.5 + (H - 2.5) / 2, -.17);
  bk(.34, H, D, X0 + .17, H / 2, -D / 2); bk(.34, H, D, X1 - .17, H / 2, -D / 2); bk(X1 - X0, H, .34, (X0 + X1) / 2, H / 2, -D + .17);
  box(X1 - X0 + .3, .16, D + .3, cope, (X0 + X1) / 2, H + .08, -D / 2, root, "roof");
  box(X1 - X0 + .44, .34, .5, cope, (X0 + X1) / 2, H + .33, -.12, root, "roof"); box(.5, .34, D + .3, cope, X0 + .1, H + .33, -D / 2); box(.5, .34, D + .3, cope, X1 - .1, H + .33, -D / 2);
  // lintels and a soldier course
  for (const c of [BAY.x, B2]) box(BW + .5, .22, .38, cope, c, BH + .11, -.16, root, "open");
  for (const c of [BAY.x, B2]) box(BW, .07, .5, conc, c, .035, -.2).castShadow = false;
  // interior: floor, back wall, a partition between the bays and the office
  const fl = add(new THREE.PlaneGeometry(X1 - X0 - .6, D - .6), floor, (X0 + X1) / 2, .07, -D / 2); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  box(X1 - X0 - .7, H - .2, .1, inner, (X0 + X1) / 2, H / 2, -D + .4).castShadow = false;
  box(.1, H - .2, D - .6, inner, X0 + .4, H / 2, -D / 2).castShadow = false; box(.14, H - .2, D - .6, inner, 4.3, H / 2, -D / 2).castShadow = false;
  box(X1 - X0 - .7, .08, D - .6, inner, (X0 + X1) / 2, H - .1, -D / 2).castShadow = false;
  // a stripe of safety yellow on the floor, tool chest, bench, shelves, tyres
  for (const s of [1, -1]) { const m = add(new THREE.PlaneGeometry(.1, 6.6), yellow, BAY.x + s * (T ? 1.95 : 1.75), .075, -4.2); m.rotation.x = -Math.PI / 2; m.castShadow = false; }
  const chest = new THREE.Group(); chest.position.set(-.35, 0, -D + .85); root.add(chest);
  box(1.5, .95, .55, redBox, 0, .58, 0, chest); box(1.4, .5, .5, redBox, 0, 1.32, 0, chest); box(1.5, .04, .57, steel, 0, 1.07, 0, chest);
  for (let i = 0; i < 4; i++) box(1.36, .02, .02, steel, 0, .28 + i * .2, .285, chest); for (let i = 0; i < 2; i++) box(1.26, .02, .02, steel, 0, 1.22 + i * .2, .26, chest);
  for (const x of [-.6, .6]) { const c = add(new THREE.CylinderGeometry(.06, .06, .05, 10), dark, x, .06, .2, chest); c.rotation.x = Math.PI / 2; }
  box(2.6, .08, .7, new THREE.MeshStandardMaterial({...TEX.wood([1, 1]), envMapIntensity: .4}), -3.6, .98, -D + .85); for (const x of [-4.8, -2.4]) box(.08, .96, .6, dark, x, .48, -D + .85);
  box(2.6, 1.3, .04, new THREE.MeshStandardMaterial({color: 0x8a8d8f, roughness: .8}), -3.6, 2.0, -D + .47);
  for (let i = 0; i < 7; i++) box(.03, .32 + (i % 3) * .12, .02, steel, -4.6 + i * .33, 2.1, -D + .5);     // tools on the board
  for (let i = 0; i < 3; i++) box(.16, .24, .16, new THREE.MeshStandardMaterial({color: [0x1d58b8, 0xe9b320, 0x2f5a44][i], roughness: .5}), -4.5 + i * .3, 1.14, -D + .8);
  const tyreG = new THREE.TorusGeometry(.27, .12, 10, 22), tyreM = new THREE.MeshStandardMaterial({color: 0x121315, roughness: .95});
  for (let i = 0; i < 4; i++) { const t = add(tyreG, tyreM, 3.55, .16 + i * .25, -D + 1.1); t.rotation.x = Math.PI / 2; }
  for (let i = 0; i < 3; i++) { const t = add(tyreG, tyreM, 2.85, .16 + i * .25, -D + 1.05); t.rotation.x = Math.PI / 2; }
  const drum = add(new THREE.CylinderGeometry(.3, .3, .9, 18), new THREE.MeshStandardMaterial({color: 0x1d58b8, metalness: .5, roughness: .45}), X0 + 1, .52, -D + 1.1);
  // shop lights: tubes that always glow a little, plus warm lamps that come up toward dusk
  const tube = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xeaf2ff, emissiveIntensity: 2.2, roughness: .4});
  for (const x of [BAY.x - 1.1, BAY.x + 1.1, B2 - 1.1, B2 + 1.1]) for (const z of [-2.6, -6.6]) { box(.12, .05, 2.2, tube, x, H - .26, z).castShadow = false; }
  for (const [x, z] of [[BAY.x, -3.2], [BAY.x, -6.6], [B2, -4.5]]) { const l = new THREE.PointLight(0xf2f6ff, 26, 13, 1.7); l.position.set(x, H - .6, z); root.add(l); }
  world.lamp(BAY.x, 3.6, -1.6, 0xffe2b8, .9, 12); world.lamp(6.6, 2.4, -2.2, 0xffc98a, .7, 9);

  // two-post lift in bay 1
  const lift = new THREE.Group(); lift.position.set(BAY.x, 0, BAY.z); root.add(lift); lift.visible = !T;
  const carr = [];
  if (!T) for (const s of [1, -1]) {
    box(.26, 3.75, .34, liftC, s * 1.5, 1.95, 0, lift, "porch"); box(.6, .05, .7, liftC, s * 1.5, .1, 0, lift, "porch");
    const c = new THREE.Group(); lift.add(c); carr.push(c);
    box(.34, .5, .42, liftC, s * 1.5, 0, 0, c);
    for (const z of [1, -1]) { const A = new THREE.Vector3(s * 1.34, -.2, z * .12), B = new THREE.Vector3(s * .72, -.2, z * 1.08), len = A.distanceTo(B), arm = box(.1, .09, len, liftC, 0, 0, 0, c, "porch");
      arm.position.copy(A).add(B).multiplyScalar(.5); arm.rotation.set(0, Math.atan2(B.x - A.x, B.z - A.z), 0);
      add(new THREE.CylinderGeometry(.09, .09, .06, 14), dark, B.x, -.13, B.z, c); }
  }
  if (!T) box(3.26, .18, .2, liftC, 0, 3.82, 0, lift, "porch");

  // bay doors: sectional, glass in the top rows
  const doors = [BAY.x, B2].map(c => { const g = new THREE.Group(); g.position.set(c, 0, -.3); root.add(g); const rows = 5, ph = BH / rows, P = [];
    for (let r = 0; r < rows; r++) { const p = new THREE.Group(); p.position.y = r * ph + ph / 2; g.add(p); const gl = r >= 2 && r <= 3;
      box(BW - .04, ph - .025, .05, white, 0, 0, 0, p, "open");
      if (gl) for (let k = 0; k < 4; k++) box(BW / 4 - .2, ph - .2, .06, paneG, (k - 1.5) * (BW / 4 - .01), 0, 0, p, "open");
      P.push(p); }
    return {g, P, ph, t: -1}; });
  function setDoor(i, t) { const d = doors[i]; if (d.t === t) return; d.t = t; d.P.forEach((p, r) => { const y = r * d.ph + d.ph / 2 + t * (BH - .15); p.position.y = Math.min(y, H - .35 - (d.P.length - 1 - r) * .02); p.position.z = y > BH + .2 ? -.25 : 0; p.visible = y < H - .2; }); }
  // office door, window, awning, sign band, lamps, bollards
  const lit = world.glowMat(0xffd9a0, .35, {roughness: .2});
  box(1.0, 2.2, .06, paneG, 5.425, 1.13, -.2, root, "open"); box(1.08, 2.28, .08, cope, 5.425, 1.14, -.24); box(.04, .3, .06, steel, 5.8, 1.1, -.15);
  box(2.14, 1.5, .05, lit, 7.6, 1.72, -.24, root, "open"); for (const x of [6.5, 7.6, 8.7]) box(.06, 1.56, .1, cope, x, 1.72, -.14, root, "open"); for (const y of [.96, 2.48]) box(2.26, .07, .12, cope, 7.6, y, -.14, root, "open");
  box(4.1, .1, 1.1, cope, 6.75, 2.86, .5).rotation.x = .12; for (const x of [4.9, 8.6]) box(.05, .05, 1.1, steel, x, 2.72, .5);
  const st = await signTexture(sign, null, {fg: "#f4f1e8", bg: "#1b2026", font: font, w: 2048, h: 256, upper: true});
  const signM = new THREE.MeshStandardMaterial({map: st, emissiveMap: st, emissive: 0xffffff, emissiveIntensity: .12, roughness: .55}); world.glow.push([signM, .22]);
  const signMesh = box(BW * 2 + .9, .82, .1, signM, (BAY.x + B2) / 2, BH + .86, .06, root, "roof"); box(BW * 2 + 1.06, .94, .06, cope, (BAY.x + B2) / 2, BH + .86, 0, root, "roof");
  const bulb = world.glowMat(0xffe6bd, 1.2);
  for (const x of [BAY.x - 2.3, (BAY.x + B2) / 2, B2 + 2.3]) { box(.04, .04, .5, cope, x, H - .05, .22); const sh = add(new THREE.ConeGeometry(.2, .18, 16, 1, true), cope, x, H - .14, .46); sh.material = cope.clone(); sh.material.side = THREE.DoubleSide;
    add(new THREE.SphereGeometry(.06, 10, 8), bulb, x, H - .2, .46); world.lamp(x, H - .5, .9, 0xffd7a3, .55, 9); }
  for (const x of [BAY.x - BW / 2 - .28, BAY.x + BW / 2 + .28, B2 - BW / 2 - .28, B2 + BW / 2 + .28]) { add(new THREE.CylinderGeometry(.09, .09, 1.05, 12), yellow, x, .58, .5, root, "open"); add(new THREE.SphereGeometry(.09, 12, 8), yellow, x, 1.1, .5); }
  const num = async (t, x) => { const tx = await signTexture(t, null, {fg: "#f4f1e8", bg: "#1b2026", font: font, w: 128, h: 128}); box(.46, .46, .04, new THREE.MeshStandardMaterial({map: tx, roughness: .6}), x, BH + .05, .03); };
  await num("1", BAY.x); await num("2", B2);
  // outside: tyre stack, pole light, a strip of planting
  for (let i = 0; i < 3; i++) { const t = add(tyreG, tyreM, X0 - .7, .16 + i * .25, .9); t.rotation.x = Math.PI / 2; }
  add(new THREE.CylinderGeometry(.07, .09, 6.4, 10), cope, 13.5, 3.2, 6); box(1.2, .08, .1, cope, 13, 6.4, 6); box(.5, .08, .26, world.glowMat(0xfff0d0, 1.4), 12.5, 6.34, 6); world.lamp(12.5, 6, 6, 0xffe2b8, 1.3, 20);

  // trees behind the lot
  const leafT = leafCard(84, 30), lm = new THREE.MeshStandardMaterial({map: leafT, alphaTest: .45, side: THREE.DoubleSide, roughness: .85, envMapIntensity: .5});
  const spots = [[-13, -9, 1.5], [-18, 2, 1.2], [-9.5, -15, 1.7], [1, -17, 1.4], [13, -15, 1.6], [19, -6, 1.3], [24, 6, 1.5], [-24, 12, 1.4]], cards = [];
  const bark = new THREE.MeshStandardMaterial({...TEX.bark(), envMapIntensity: .3});
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [x, z, s] of spots) { add(new THREE.CylinderGeometry(.16 * s, .3 * s, 4.2 * s, 8), bark, x, 2.1 * s, z);
    for (let k = 0; k < 150; k++) { const u = rnd() * 2 - 1, t = rnd() * 6.28, rr = Math.cbrt(rnd()) * 2.9 * s, q = Math.sqrt(1 - u * u); cards.push([x + Math.cos(t) * q * rr, 5.2 * s + u * rr * .8, z + Math.sin(t) * q * rr, s * (1.3 + rnd() * .7), rnd() * 3, rnd() * 3, rnd() * 3, .23 + rnd() * .05, .2 * (.75 + rnd() * .6)]); } }
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), lm, cards.length); leaves.castShadow = true;
  leaves.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: leafT, alphaTest: .45});
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); cards.forEach(([x, y, z, sc, a, b, cc, h, l], i) => { q.setFromEuler(new THREE.Euler(a, b, cc)); m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sc, sc, sc)); leaves.setMatrixAt(i, m); leaves.setColorAt(i, c.setHSL(h, .45, l * 1.7)); }); }
  scene.add(leaves);

  // body shops: a paint cart, masking paper and spare panels by the left wall
  if (kind === "body") {
    const cart = new THREE.Group(); cart.position.set(-.2, 0, -7.7); root.add(cart);
    box(.9, .05, .55, steel, 0, .78, 0, cart); box(.9, .05, .55, steel, 0, .3, 0, cart); for (const [x, z] of [[-.42, -.24], [.42, -.24], [-.42, .24], [.42, .24]]) box(.035, .78, .035, steel, x, .4, z, cart);
    [0xb3241c, 0x1f4f8f, 0xe9e9e4, 0x16181b, 0xa9afb5].forEach((c, i) => add(new THREE.CylinderGeometry(.08, .08, .17, 14), new THREE.MeshStandardMaterial({color: c, metalness: .3, roughness: .4}), -.32 + i * .16, .89, -.1, cart));
    const gun = new THREE.Group(); gun.position.set(.2, .86, .14); cart.add(gun); box(.05, .16, .05, dark, 0, 0, 0, gun); box(.05, .05, .18, steel, 0, .08, .07, gun); add(new THREE.CylinderGeometry(.05, .04, .12, 12), steel, 0, .18, -.01, gun);
    const roll = add(new THREE.CylinderGeometry(.09, .09, .95, 16), new THREE.MeshStandardMaterial({color: 0xcbb98f, roughness: .9}), -4.8, 1.05, -6.4); roll.rotation.x = Math.PI / 2;
    box(.04, 1.1, .9, dark, -4.95, .55, -6.4);
    for (let i = 0; i < 3; i++) box(.86, .62, .02, new THREE.MeshStandardMaterial({color: [0x8d9296, 0x2a2d31, 0xb3241c][i], roughness: .6}), -4.95 + .06 + i * .02, 2.15, -4.5 - i * .9).rotation.y = Math.PI / 2;
  }

  // the truck, and a second one parked by the office so the lot isn't empty
  const truck = T ? (await import("./semi.js")).makeSemi(world, {color}) : makeTruck(world, {color, glass: kind === "glass"}); root.add(truck.car);
  if (second && !T) { const t2 = makeTruck(world, {color: PAINT.white, lights: false}); t2.car.position.set(15.9, 0, 9.2); t2.car.rotation.y = Math.PI; root.add(t2.car); }
  if (second && T) { const tr = (await import("./semi.js")).makeTrailer(world); tr.position.set(17.5, 0, 9.6); tr.rotation.y = Math.PI / 2 - .08; root.add(tr); }
  // truck shops: a rolling tool cart and a work light on a stand beside the tilted hood
  let workLight = null;
  if (T) { const cart = new THREE.Group(); cart.position.set(.2, 0, 3.6); cart.rotation.y = -.6; root.add(cart);
    box(.95, .85, .5, redBox, 0, .55, 0, cart); box(.97, .04, .52, steel, 0, 1.0, 0, cart); for (let i = 0; i < 4; i++) box(.85, .02, .02, steel, 0, .3 + i * .18, .26, cart);
    for (const [x, z] of [[-.4, -.2], [.4, -.2], [-.4, .2], [.4, .2]]) add(new THREE.SphereGeometry(.05, 10, 8), dark, x, .05, z, cart);
    const st = new THREE.Group(); st.position.set(-.55, 0, 1.6); root.add(st); add(new THREE.CylinderGeometry(.02, .02, 1.9, 8), steel, 0, .95, 0, st);
    for (let k = 0; k < 3; k++) { const l = add(new THREE.CylinderGeometry(.012, .012, .5, 6), steel, Math.cos(k * 2.1) * .18, .12, Math.sin(k * 2.1) * .18, st); l.rotation.set(Math.sin(k * 2.1) * .9, 0, -Math.cos(k * 2.1) * .9); }
    const head = world.glowMat(0xfff4dc, 1.6); box(.36, .26, .1, dark, 0, 1.95, 0, st).rotation.y = .9; const face = box(.3, .2, .02, head, .04, 1.95, .05, st); face.rotation.y = .9; st.rotation.y = -1.6;
    workLight = new THREE.PointLight(0xfff1dc, 0, 7, 1.6); workLight.position.set(-.9, 1.9, 1.6); workLight.userData.st = st; root.add(workLight); }

  const S = {door: -1, door2: -1, lift: -1, hood: -1, wheels: -1, pos: -1, key: ""};
  function set({door = 1, door2 = 0, lift: lf = 0, hood = 0, wheels = 1, pos = 0, color: col, lights, fix} = {}) {
    const key = [door, door2, lf, hood, wheels, pos, fix ?? -1].map(n => (+n).toFixed(3)).join() + lights;
    if (col !== undefined && col !== S.color) { S.color = col; truck.setColor(col); }
    if (key === S.key) return; S.key = key;
    setDoor(0, clamp(door)); setDoor(1, clamp(door2));
    const y = clamp(lf) * 1.72; carr.forEach(c => c.position.y = y + .5);
    // out of the bay in a straight line, then a turn onto the lot
    const p = clamp(pos), a = smooth(0, .55, p), b = smooth(.4, 1, p);
    truck.car.position.x = mix(BAY.x, OUT.x, b); truck.car.position.z = mix(BAY.z, mix(3.2, OUT.z, b), a); truck.car.rotation.y = OUT.yaw * b;
    truck.set({hood, wheels, y: p > .001 ? 0 : y, lights: lights ?? p > .5, fix: kind === "glass" ? undefined : fix, glass: kind === "glass" ? fix ?? 1 : undefined});
    if (workLight) { workLight.intensity = 9 * clamp(hood) * (1 - smooth(0, .2, p)); workLight.userData.st.visible = hood > .05 && p < .1; }
    world.shadows();
  }
  set();
  const exclude = (x, z) => (x > X0 - 1.6 && x < X1 + 1.6 && z > -D - .8 && z < 6) || (z > -.6 && z < 30.6 && x > -30.4 && x < 34.4);
  return {root, truck, set, exclude, M, doors, lift, signMesh, dims: {X0, X1, D, H, BAY, B2, BW, BH, OUT}};
}
