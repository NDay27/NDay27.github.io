// Flagship truck kit: a day-cab semi tractor and a parked dry-van trailer, both procedural.
// makeSemi has the same set() as the pickup in garage.js ({hood, y, lights}), so the garage can drive either one.
// The hood is a conventional tilt hood: fenders, grille and headlights are one piece, hinged at the bumper.
import {THREE, mix, clamp} from "../../harlow/assets/world.js";
import {toCreasedNormals} from "three/addons/utils/BufferGeometryUtils.js";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function makeSemi(world, {color = 0xb3241c, lights = true} = {}) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({color, metalness: .2, roughness: .35, clearcoat: .8, clearcoatRoughness: .1, envMapIntensity: .6, side: THREE.DoubleSide});
  const glass = new THREE.MeshPhysicalMaterial({color: 0x0b1013, metalness: .1, roughness: .06, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1});
  const dark = new THREE.MeshStandardMaterial({color: 0x17191c, roughness: .75, envMapIntensity: .5});
  const frameM = new THREE.MeshStandardMaterial({color: 0x101113, roughness: .6, metalness: .3, envMapIntensity: .5});
  const rubber = new THREE.MeshStandardMaterial({color: 0x111214, roughness: .93, envMapIntensity: .3});
  const chrome = new THREE.MeshStandardMaterial({color: 0xe2e6ea, metalness: 1, roughness: .16, envMapIntensity: 1.1});
  const alloy = new THREE.MeshStandardMaterial({color: 0xd3d7db, metalness: .95, roughness: .22, envMapIntensity: 1});
  const steel = new THREE.MeshStandardMaterial({color: 0x8d9298, metalness: .85, roughness: .4, envMapIntensity: .9});
  const engM = new THREE.MeshStandardMaterial({color: 0x3a3f45, metalness: .5, roughness: .5, envMapIntensity: .7});
  const red = new THREE.MeshStandardMaterial({color: 0xb3241c, roughness: .45});
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = car) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const cylZ = (r, len, mat, x, y, z, parent, seg = 20) => { const m = add(new THREE.CylinderGeometry(r, r, len, seg), mat, x, y, z, parent); m.rotation.x = Math.PI / 2; return m; };
  const cylX = (r, len, mat, x, y, z, parent, seg = 20) => { const m = add(new THREE.CylinderGeometry(r, r, len, seg), mat, x, y, z, parent); m.rotation.z = Math.PI / 2; return m; };
  const R = .52, FA = 2.3, RAX = [-1.95, -3.25], ARCH = .68;

  // frame rails, crossmembers, the bumper
  for (const s of [1, -1]) box(.1, .3, 7.3, frameM, s * .47, .9, -.35);
  for (const z of [3.0, 1.2, -.6, -2.6, -3.9]) box(.86, .22, .1, frameM, 0, .9, z);
  box(2.5, .36, .26, chrome, 0, .6, 3.5); box(2.3, .06, .2, dark, 0, .4, 3.48); box(.7, .12, .04, dark, 0, .62, 3.64);

  // ---------- the tilt hood: a loft from the cowl to the nose, fenders included ----------
  const HZ0 = 1.24, HZ1 = 3.36, HY = .72;
  const top = z => mix(2.06, 1.86, (z - HZ0) / (HZ1 - HZ0)) - .1 * Math.pow(smooth(3.16, HZ1, z), 2);
  const hw = z => mix(.64, .56, (z - HZ0) / (HZ1 - HZ0));
  const fw = z => 1.2 - .14 * Math.pow(smooth(2.95, HZ1, z), 1.5);
  const ft = z => 1.42 - .06 * smooth(1.4, 1.24, z);
  const sill = z => { const d = z - FA; let b = HY + .02 * smooth(3.0, HZ1, z); if (Math.abs(d) < ARCH) b = Math.max(b, R + .08 + Math.sqrt(ARCH * ARCH - d * d) * .92); return b; };
  const ring = z => { const t = top(z), h = hw(z), f = fw(z), y = ft(z), b = sill(z);
    const r = [[0, t + .01], [h - .1, t], [h, t - .07], [h + .05, t - .32], [f - .2, y + .02], [f - .04, y - .05], [f, y - .16], [f, Math.min(b, y - .2)]];
    return r.concat(r.slice(1).reverse().map(([x, yy]) => [-x, yy])); };
  const NR = 15, pos = [], idx = [], zs = [];
  for (let z = HZ0; z <= HZ1 + 1e-6; z += .045) zs.push(Math.min(z, HZ1));
  if (zs[zs.length - 1] < HZ1) zs.push(HZ1);
  zs.forEach(z => ring(z).forEach(([x, y]) => pos.push(x, y, z)));
  for (let i = 0; i < zs.length - 1; i++) for (let k = 0; k < NR - 1; k++) { const a = i * NR + k, b = a + 1, c = a + NR, d = b + NR; idx.push(a, b, c, b, d, c); }
  { const c = pos.length / 3, i = zs.length - 1, r = ring(HZ1); pos.push(0, (r[0][1] + HY) / 2, HZ1); for (let k = 0; k < NR - 1; k++) idx.push(c, i * NR + k + 1, i * NR + k); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hg.setIndex(idx);
  const hoodGeo = toCreasedNormals(hg, .55); hoodGeo.translate(0, -HY, -HZ1);
  const hoodPivot = new THREE.Group(); hoodPivot.position.set(0, HY, HZ1); car.add(hoodPivot);
  const hoodOut = paint.clone(); hoodOut.side = THREE.BackSide; const hood = add(hoodGeo, hoodOut, 0, 0, 0, hoodPivot); hood.userData.layer = "trim";
  add(hoodGeo, new THREE.MeshStandardMaterial({color: 0x45484c, roughness: .85, side: THREE.FrontSide, envMapIntensity: .3}), 0, 0, 0, hoodPivot).castShadow = false;
  const hp = (x, y, z) => [x, y - HY, z - HZ1];
  // grille, headlights, markers and a hood stripe ride on the hood
  const gT = top(HZ1) - .12, gW = hw(HZ1) * 2 - .1;
  box(gW + .08, gT - .86, .05, chrome, ...hp(0, (gT + .86) / 2, HZ1 + .02), hoodPivot);
  box(gW - .06, gT - 1.0, .04, dark, ...hp(0, (gT + .86) / 2, HZ1 + .035), hoodPivot);
  for (let i = 0; i < 9; i++) box(gW - .08, .025, .03, chrome, ...hp(0, .97 + i * (gT - 1.08) / 8, HZ1 + .05), hoodPivot);
  const lens = new THREE.MeshStandardMaterial({color: 0xd5dade, roughness: .6, envMapIntensity: .5}), headOn = lights ? world.glowMat(0xfff1cf, .9, {roughness: .2}) : lens, heads = [];
  const amber = world.glowMat(0xe08a1a, .5, {roughness: .4});
  for (const s of [1, -1]) {
    const x = s * (fw(HZ1) - .32);
    box(.44, .24, .06, chrome, ...hp(x, 1.17, HZ1 - .01), hoodPivot); heads.push(box(.38, .18, .05, lens, ...hp(x, 1.17, HZ1 + .01), hoodPivot));
    box(.12, .06, .05, amber, ...hp(x + s * .12, 1.0, HZ1 - .02), hoodPivot);
    box(.1, .05, .1, amber, ...hp(s * (fw(2.9) - .18), ft(2.9) + .04, 2.9), hoodPivot);
  }
  for (const s of [1, -1]) box(.05, .02, 1.6, chrome, ...hp(s * (hw(2.3) - .05), top(2.3) + .005, 2.3), hoodPivot).rotation.x = Math.atan2(top(HZ0) - top(HZ1), HZ1 - HZ0);

  // ---------- engine, radiator, fan (stays with the chassis) ----------
  box(.78, .72, 1.5, engM, 0, 1.22, 2.0); box(.62, .14, 1.36, red, 0, 1.65, 2.0); for (let i = 0; i < 6; i++) box(.08, .05, .08, steel, .18, 1.74, 1.45 + i * .22);
  box(.9, .3, 1.1, engM, 0, .78, 2.0);
  const turbo = add(new THREE.TorusGeometry(.14, .07, 10, 18), steel, .5, 1.5, 1.55); turbo.rotation.y = Math.PI / 2; cylX(.07, .3, steel, .62, 1.5, 1.55);
  cylZ(.06, .9, steel, -.48, 1.32, 2.1); box(.2, .26, .3, dark, -.52, 1.1, 2.6);
  box(1.32, 1.02, .12, dark, 0, 1.36, 3.08); box(1.38, 1.08, .06, steel, 0, 1.36, 3.0);
  cylZ(.45, .08, dark, 0, 1.32, 2.88, car, 24);
  for (const [x, z, r] of [[.42, 2.7, .2], [-.4, 2.75, .18]]) { const hs = add(new THREE.TorusGeometry(r, .04, 8, 16, Math.PI), rubber, x, 1.6, z); hs.rotation.y = Math.PI / 2; }
  box(2.1, .05, 1.9, frameM, 0, .7, 2.2).castShadow = false;
  // fender liners, so the open hood shows the wheel tops, not the sky
  for (const s of [1, -1]) { const ln = add(new THREE.CylinderGeometry(ARCH - .04, ARCH - .04, .36, 20, 1, true, -Math.PI / 2, Math.PI), dark, s * 1.0, R + .06, FA); ln.rotation.z = Math.PI / 2; ln.material = dark.clone(); ln.material.side = THREE.DoubleSide; }

  // ---------- cab ----------
  const CZ0 = -.95, CZ1 = 1.24, CB = 1.2, CT = 3.25, CW = 2.32;
  const cab = add(new RoundedBoxGeometry(CW, CT - CB, CZ1 - CZ0, 4, .12), paint, 0, (CB + CT) / 2, (CZ0 + CZ1) / 2); cab.userData.layer = "trim";
  // windshield in two panes, side windows, a sleeper-less back window
  for (const s of [1, -1]) { box(1.0, .82, .03, glass, s * .54, 2.62, CZ1 + .005).userData.layer = "open"; box(.03, .78, .92, glass, s * (CW / 2 + .005), 2.6, .5).userData.layer = "open"; }
  box(.08, .86, .05, paint, 0, 2.62, CZ1 + .01); box(1.3, .5, .03, glass, 0, 2.7, CZ0 - .005);
  const visor = box(2.2, .05, .34, paint, 0, 3.1, CZ1 + .15); visor.rotation.x = .22;
  for (let i = 0; i < 5; i++) box(.1, .05, .06, amber, -.6 + i * .3, 3.29, CZ1 - .08);
  for (const s of [1, -1]) {
    const x = s * (CW / 2 + .006);
    for (const z of [1.02, -.1]) box(.01, 1.7, .012, dark, x, 2.05, z);                       // door seams
    box(.01, .012, 1.12, dark, x, 1.24, .46);
    box(.03, .05, .2, chrome, s * (CW / 2 + .02), 2.05, -.02);                                    // handle
    add(new THREE.CylinderGeometry(.018, .018, 1.0, 8), chrome, s * (CW / 2 + .05), 2.0, 1.14);
    // west-coast mirror on two arms
    box(.09, .5, .2, dark, s * 1.52, 2.55, 1.06); box(.07, .44, .16, chrome, s * 1.52, 2.55, 1.06 + .005).scale.x = .9;
    for (const y of [2.32, 2.78]) { const arm = add(new THREE.CylinderGeometry(.015, .015, .38, 6), chrome, s * 1.34, y, 1.08); arm.rotation.z = Math.PI / 2; }
    // steps and the fuel tank behind them
    box(.34, .05, .5, alloy, s * 1.24, 1.0, .72); box(.34, .05, .5, alloy, s * 1.24, .62, .72); box(.04, .5, .5, dark, s * 1.06, .84, .72);
    const tank = cylZ(.34, 1.25, alloy, s * 1.02, .86, -.35, car, 28); tank.userData.layer = "tire";
    for (const z of [-.85, .15]) cylZ(.35, .06, dark, s * 1.02, .86, z, car, 28);
    cylZ(.07, .02, chrome, s * 1.02, 1.21, -.35).rotation.x = 0;
    // stacks behind the cab
    const st = add(new THREE.CylinderGeometry(.1, .1, 2.9, 18), chrome, s * 1.0, 2.55, CZ0 - .16); st.userData.layer = "porch";
    add(new THREE.CylinderGeometry(.125, .125, 1.1, 18), alloy, s * 1.0, 2.35, CZ0 - .16);
    const cut = add(new THREE.CylinderGeometry(.1, .1, .08, 18), dark, s * 1.0, 4.02, CZ0 - .16); cut.rotation.x = .5;
    // air cleaner can beside the stack
    add(new THREE.CylinderGeometry(.2, .2, .8, 20), dark, s * .66, 2.55, CZ0 - .22);
  }
  // deck plate, air lines, fifth wheel
  box(1.9, .04, 1.0, alloy, 0, 1.1, -1.5);
  for (const [x, c] of [[-.18, 0xc8261b], [.18, 0x1f4f8f]]) { const coil = add(new THREE.TorusGeometry(.16, .015, 6, 18), new THREE.MeshStandardMaterial({color: c, roughness: .5}), x, 2.0, CZ0 - .06); }
  const fifth = add(new THREE.CylinderGeometry(.72, .72, .1, 28), frameM, 0, 1.22, -2.6); box(.3, .12, .5, frameM, 0, 1.2, -3.15);
  box(.3, .02, .6, new THREE.MeshStandardMaterial({color: 0x1a1a1a, roughness: .4}), 0, 1.28, -2.95);

  // ---------- wheels ----------
  const tireG = new THREE.LatheGeometry([[.3, -.14], [.46, -.14], [.505, -.12], [.52, -.07], [.52, .07], [.505, .12], [.46, .14], [.3, .14]].map(([r, x]) => new THREE.Vector2(r, x)), 36);
  const rimG = new THREE.LatheGeometry([[.3, -.13], [.31, .1], [.28, .125], [.13, .13], [.11, .17], [0, .17]].map(([r, x]) => new THREE.Vector2(r, x)), 30);
  const wheel = (x, z, s, rim = alloy) => { const g = new THREE.Group(); g.position.set(x, R, z); g.rotation.z = -s * Math.PI / 2; car.add(g);
    add(tireG, rubber, 0, 0, 0, g).userData.layer = "tire"; add(rimG, rim, 0, 0, 0, g);
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; add(new THREE.CylinderGeometry(.018, .018, .04, 6), chrome, Math.sin(a) * .16, .155, Math.cos(a) * .16, g); }
    return g; };
  for (const s of [1, -1]) { wheel(s * 1.02, FA, s); for (const z of RAX) { wheel(s * 1.1, z, s); wheel(s * .8, z, -s, steel); } }
  for (const s of [1, -1]) for (const z of RAX) { const f = add(new THREE.CylinderGeometry(R + .1, R + .1, .64, 22, 1, true, -Math.PI / 2, Math.PI), dark, s * .95, R, z); f.rotation.z = Math.PI / 2; f.material = dark.clone(); f.material.side = THREE.DoubleSide; }
  for (const s of [1, -1]) { box(.62, .62, .02, dark, s * .95, .46, -3.95); box(.5, .05, .1, chrome, s * .95, .8, -3.92); }
  const tail = world.glowMat(0xd0221c, .35, {roughness: .35}); for (const s of [1, -1]) box(.16, .1, .04, tail, s * .3, .84, -4.0);

  car.traverse(o => { if (o.isMesh && o.userData.layer === undefined) o.userData.layer = null; });
  const beams = []; if (lights) for (const s of [1, -1]) { const l = world.lamp(0, 0, 0, 0xfff1cf, .4, 11); car.add(l); l.position.set(s * .9, 1.1, 4.2); l.visible = false; beams.push(l); }
  let liftY = 0;
  function set({hood: h = 0, y = 0, lights: on = false} = {}) {
    liftY = y; car.position.y = y;
    hoodPivot.rotation.x = clamp(h) * 1.18;
    heads.forEach(m => m.material = on ? headOn : lens); beams.forEach(l => l.visible = on && h < .1);
  }
  set();
  return {car, set, M: {paint}, beams, setColor(c) { paint.color.setHex(c); hoodOut.color.setHex(c); }, get liftY() { return liftY; }};
}

// A 53-foot dry van, parked: white panels with ribs, rear doors, landing gear, a tandem, conspicuity tape.
export function makeTrailer(world) {
  const g = new THREE.Group(), L = 14.6, W = 2.58, Y0 = 1.28, Y1 = 4.05;
  const white = new THREE.MeshStandardMaterial({color: 0xeeeeea, roughness: .55, metalness: .1, envMapIntensity: .6});
  const dark = new THREE.MeshStandardMaterial({color: 0x17191c, roughness: .7});
  const alum = new THREE.MeshStandardMaterial({color: 0xc6cbd0, metalness: .8, roughness: .35, envMapIntensity: .8});
  const rubber = new THREE.MeshStandardMaterial({color: 0x111214, roughness: .93});
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  box(W, Y1 - Y0, L, white, 0, (Y0 + Y1) / 2, 0).userData.layer = "wall";
  for (let z = -L / 2 + .6; z < L / 2 - .3; z += .6) for (const s of [1, -1]) box(.03, Y1 - Y0 - .1, .06, white, s * (W / 2 + .012), (Y0 + Y1) / 2, z);
  for (const s of [1, -1]) { box(.05, .14, L, alum, s * (W / 2 + .02), Y0 + .05, 0); box(.05, .1, L, alum, s * (W / 2 + .02), Y1 - .04, 0); }
  // conspicuity tape: red and white blocks along the bottom rail
  const tR = new THREE.MeshStandardMaterial({color: 0xc8261b, roughness: .4}), tW = new THREE.MeshStandardMaterial({color: 0xf4f4f0, roughness: .3});
  for (const s of [1, -1]) for (let i = 0; i < 24; i++) box(.01, .05, .3, i % 2 ? tW : tR, s * (W / 2 + .05), Y0 + .05, -L / 2 + .4 + i * .58);
  // rear frame and doors
  box(W + .08, Y1 - Y0 + .08, .08, alum, 0, (Y0 + Y1) / 2, -L / 2 - .04);
  for (const s of [1, -1]) { box(W / 2 - .06, Y1 - Y0 - .1, .03, white, s * W / 4, (Y0 + Y1) / 2, -L / 2 - .09); for (const y of [Y0 + .5, Y1 - .5]) box(.18, .06, .04, dark, s * (W / 2 - .1), y, -L / 2 - .1);
    for (const x of [.15, .55]) box(.03, Y1 - Y0 - .4, .04, alum, s * x, (Y0 + Y1) / 2, -L / 2 - .12); }
  box(W, .18, .15, dark, 0, Y0 - .3, -L / 2 + .1);
  const tl = world.glowMat(0xd0221c, .3); for (const s of [1, -1]) box(.14, .14, .03, tl, s * (W / 2 - .3), Y0 - .3, -L / 2);
  // underneath: rails, landing gear, tandem axles
  for (const s of [1, -1]) box(.12, .3, L - .4, dark, s * .5, Y0 - .15, 0);
  for (const s of [1, -1]) { box(.12, Y0 - .05, .12, dark, s * .75, (Y0 - .05) / 2 + .05, L / 2 - 3.6); box(.3, .04, .3, dark, s * .75, .02, L / 2 - 3.6); }
  const tireG = new THREE.CylinderGeometry(.5, .5, .28, 26);
  for (const z of [-L / 2 + 1.6, -L / 2 + 2.85]) for (const s of [1, -1]) for (const x of [.8, 1.1]) { const t = add(tireG, rubber, s * x, .5, z); t.rotation.z = Math.PI / 2; t.userData.layer = "tire"; const h = add(new THREE.CylinderGeometry(.28, .28, .29, 18), alum, s * x, .5, z); h.rotation.z = Math.PI / 2; }
  box(W - .2, .5, .03, dark, 0, .5, -L / 2 + .7);
  g.traverse(o => { if (o.isMesh && o.userData.layer === undefined) o.userData.layer = null; });
  return g;
}
