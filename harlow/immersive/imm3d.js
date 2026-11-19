// Harlow Building Co. — the live 3D house for the Immersive demo.
// imm.js turns scroll position into build progress, light and a camera key; this file draws it.
import {makeWorld, reduce, small} from "../assets/world.js";
import {makeHouse} from "../assets/house.js";

// camera keys: position, target, field of view (desktop). All sit off the front-left corner so moves never cross the house.
const K = {
  hero: [[-18.5, 2.3, 32], [1, 4.3, 1], 36],
  day1: [[-21, 12.5, 21], [3.5, 1.2, 0], 34],
  found: [[-20, 11.5, 23.5], [3.5, 1.8, 0], 34],
  walls: [[-18.5, 10.5, 26], [3.5, 2.8, 0], 34],
  frame: [[-16, 9.5, 28], [3.5, 3.6, 0], 34],
  dry: [[-13, 7.8, 30], [3, 3.9, 0], 34],
  side: [[-9.5, 5.2, 31], [2.5, 4.0, 1], 34],
  keys: [[-12, 2.6, 25], [0, 4.3, 2], 36],
  night: [[-5, 2.0, 24], [1, 4.0, 2], 38],
  cfg: [[-11.5, 2.6, 32], [2, 4.4, 1.5], 33],
};

export async function start(HB) {
  let house = null;
  const world = await makeWorld({
    cam: {pos: K.hero[0], target: K.hero[1], minD: 1, maxD: 400, minAz: -99, maxAz: 99, maxPolar: Math.PI * .62},
    tod: .56, ground: "lawn", grassR: 34, grassH: .15, grassW: .04, grassN: small ? 1.5 : 2.6, offset: false, fov: () => 36,
    exclude: (x, z) => house ? house.exclude(x, z) : false,
  });
  const {THREE, cam, ctl} = world;
  house = makeHouse(world);
  // grass was planted before the house existed: keep only the blades outside its footprint
  if (world.grass) { const g = world.grass, m = new THREE.Matrix4(), c = new THREE.Color(), P = g.userData.pos; let n = 0;
    for (let i = 0; i < P.length; i++) { const [x, z, sc, q] = P[i]; if (house.exclude(x, z)) continue; m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, sc, 1)); g.setMatrixAt(n, m); g.getColorAt(i, c); g.setColorAt(n, c); n++; }
    g.count = n; g.instanceMatrix.needsUpdate = true; if (g.instanceColor) g.instanceColor.needsUpdate = true; }
  const fin = c => house.setFinish({siding: c.siding, roof: c.roof, trim: c.trim, door: c.door, porch: c.porch});
  fin(HB.cfg); house.setProgress(1);
  HB.onCfg.push((c, k) => { if (k !== "tod" && k !== "size") fin(c); });

  ctl.enabled = false; ctl.autoRotate = false; ctl.enableDamping = false;
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3(), b0 = new THREE.Vector3(), b1 = new THREE.Vector3(), off = new THREE.Vector3();
  const ease = t => t * t * (3 - 2 * t);
  let intro = reduce ? 1 : 0, fov = 0, vo = "", yawCur = 0, w = 0, h = 0;
  world.onTick.push((t, dt) => {
    const s = HB.get();
    house.setProgress(s.p);
    world.setTod(s.tod);
    const A = K[s.a], B = K[s.b], e = ease(s.t);
    a0.fromArray(A[0]); a1.fromArray(A[1]); b0.fromArray(B[0]); b1.fromArray(B[1]);
    pos.lerpVectors(a0, b0, e); tgt.lerpVectors(a1, b1, e);
    let f = A[2] + (B[2] - A[2]) * e;
    // the designer: turn around the target; a slow breath on the opener
    HB.yaw += (HB.yawTarget * s.cfg - HB.yaw) * Math.min(1, dt * 4); yawCur = HB.yaw;
    const idle = reduce ? 0 : (s.i === 0 ? Math.sin(t * .18) * .05 * (1 - s.t) : 0);
    off.subVectors(pos, tgt).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yawCur + idle);
    // tall phone screens: step back and widen so the whole house fits above the captions
    w = world.host.clientWidth; h = world.host.clientHeight; const asp = w / h, phone = asp < .8;
    if (phone) { off.multiplyScalar(asp < .55 ? 1.42 : 1.25); f += 10; }
    if (intro < 1) { intro = Math.min(1, intro + dt / 2.6); const k = 1 - Math.pow(1 - intro, 3); off.multiplyScalar(1 + .22 * (1 - k)); off.y += 2.5 * (1 - k); }
    cam.position.copy(tgt).add(off); ctl.target.copy(tgt); cam.lookAt(tgt);
    // frame the subject: right of the captions on desktop, above them on a phone
    const ox = phone ? 0 : -w * (w > 1100 ? .15 : .1), oy = phone ? h * (s.cfg > .5 ? .2 : s.i === 0 ? .17 - .05 * s.t : .12) : 0, key = w + "," + h + "," + ox.toFixed(0) + "," + oy.toFixed(0);
    if (Math.abs(f - fov) > .01 || key !== vo) { fov = f; vo = key; cam.fov = f; cam.setViewOffset(w, h, ox, oy, w, h); cam.updateProjectionMatrix(); }
  });
  world.size(); world.setTodNow(HB.get().tod); house.setProgress(HB.get().p);
  await world.ready;
  world.setTodNow(HB.get().tod);
  world.start();
  // two frames so the first thing people see is a finished picture, then fade it in
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return world;
}
