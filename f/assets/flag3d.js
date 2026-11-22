// Flagship kit, Immersive tier: the live 3D yard for lawn, tree and painting crews.
// t1250.js turns scroll into a state (camera keys, light, trade values); this file draws it on the Harlow engine.
import {makeWorld, reduce, small} from "../../harlow/assets/world.js";
import {makeHouse} from "../../harlow/assets/house.js";
import {lawn, yardTree, flatwork, workTruck, acUnit, yardLine, fixList, stumpGrind, towJob, mowerFix, weldGate, roofJob, elecJob, lockJob, fenceJob, snowJob, digJob, wellJob} from "./yard.js";

// camera keys: position, target, field of view (desktop)
const K = {
  lawn: {hero: [[-15, 2.9, 27], [-1.5, 3.8, 2], 38], high: [[-16, 9, 24], [2.5, 1, 4], 38], side: [[24, 3.4, 18], [4, 2.5, 2], 38],
         dusk: [[22, 2.6, 19], [3, 3.8, 0], 36], cfg: [[-12, 4.2, 30], [2, 3, 3], 36]},
  tree: {hero: [[-17, 2.8, 31], [-3.5, 5.2, 2], 40], close: [[-24, 6, 22], [-4, 5, 2], 40], side: [[-26, 3.4, 4], [-6, 5, 2], 40],
         dusk: [[-20, 2.6, 24], [-3, 5, 2], 38], cfg: [[-19, 3.4, 30], [-3.5, 5, 2], 38]},
  painting: {hero: [[-14, 2.0, 25], [-1.5, 4.4, 2], 36], close: [[-16, 7, 24], [2.5, 3.6, 0], 36], side: [[24, 3.4, 18], [4, 2.5, 2], 38],
             dusk: [[22, 2.6, 19], [3, 3.8, 0], 36], cfg: [[-11.5, 2.6, 32], [2, 4.4, 1.5], 33]},
  body: {hero: [[-7.6, 1.5, 14.6], [-2.7, 1.0, 10.3], 34], close: [[-7.2, 1.5, 13.6], [-3.2, .8, 10.5], 34], bay: [[-5.0, 1.6, 5.5], [-2.8, 1.0, -2.5], 34],
         dusk: [[-11, 1.8, 19], [0, 2.4, 3], 36], cfg: [[-8.4, 1.9, 15.2], [-2.6, .9, 9.9], 36]},
  // home services: the drive is the subject, the crew's pickup at the curb
  wash: {hero: [[-4, 2.8, 44], [7.5, 1.8, 12], 36], house: [[-7, 2.0, 19], [2.5, 3.0, 3], 40], close: [[4.2, 1.5, 27], [9.6, .3, 14], 42],
         dusk: [[-4, 2.4, 42], [7.5, 2.0, 12], 36], cfg: [[1.2, 2.9, 31.5], [8.6, .9, 12], 40]},
  auto: {hero: [[-13, 3.4, 23], [1, 2.6, 0], 34], bay: [[-6.5, 2.2, 9], [-2.4, 1.9, -3.5], 40], dusk: [[-11, 1.8, 19], [0, 2.4, 3], 36],
         cfg: [[-7.4, 2.5, 10.5], [-2.2, 2.0, -3.2], 40]},
};

// main-street storefronts share one set of keys; the walk inside runs straight through the open door
const SK = {hero: [[-9, 2.3, 17.5], [.8, 3.5, 0], 36], front: [[-4.6, 2.4, 11.5], [.6, 2.7, 0], 40], door: [[0, 1.6, 5.5], [0, 1.5, -2], 40],
            inside: [[0, 1.6, -3.4], [-.4, 1.2, -7.2], 50], dusk: [[.6, 2.0, 16], [.4, 3.0, 0], 36], cfg: [[-6.5, 2.2, 13.5], [.6, 2.6, 0], 38]};
// every store group in _build/flagship/store.py GROUPS must be listed here (make.py checks), or its live 3D falls back to stills
const STORE = {bakery: "bakery", salon: "salon", barber: "barber", nails: "nails", eat: "eat", shop: "shop", groom: "groom", tailor: "sew", uphol: "sew", scoop: "scoop",
               antique: "antique", tattoo: "tattoo", dojo: "dojo", jewel: "jewel", appst: "appst", massage: "massage", cafe: "cafe", gym: "gym", music: "music", photo: "photo", stand: "stand", kids: "kids", dogs: "dogs", train: "dogs"};
const WORD = {bakery: "Bakery", cake: "Cakes", donut: "Donuts", salon: "Hair", barber: "Barber", nails: "Nails", restaurant: "Eat",
              thrift: "Thrift", boutique: "Boutique", petgroom: "Grooming", tailor: "Tailor", upholstery: "Upholstery", icecream: "Ice Cream",
              antique: "Antiques", tattoo: "Tattoo", martial: "Martial Arts", jewelry: "Jewelry", applstore: "Appliances", massage: "Massage",
              coffee: "Coffee", gym: "Fitness", music: "Music", photo: "Studio", dairystand: "Ice Cream", daycare: "Child Care", petcare: "Dog Care", dogtrain: "Training"};
for (const g in STORE) K[g] = SK;
// the drive-in stand is one storey on its own lot: the camera comes in closer and lower
K.stand = {...SK, inside: [[1.6, 1.75, -1.6], [-.8, 1.15, -5.2], 55], hero: [[-8, 2.1, 14], [.6, 2.4, 0], 36], front: [[-4.2, 2.0, 9.5], [.4, 1.9, 0], 40], dusk: [[-6.2, 1.7, 12.2], [.6, 2.3, 0], 36], cfg: [[-6, 2.0, 11], [.5, 2.0, 0], 38]};
K.concrete = {...K.wash, hero: [[1.2, 2.9, 31.5], [8.6, .9, 12], 40]};
// heating and cooling: the outdoor unit beside the house is the subject, the crew's truck at the curb
K.hvac = {hero: [[-11.4, 1.5, 6.2], [-7.2, 1.0, -.3], 40], close: [[-10.2, 1.3, 3.4], [-7.3, .75, -.3], 40], dusk: [[-17, 3.2, 50], [-4, 1.6, 6], 34],
          cfg: [[-11.8, 1.7, 6.6], [-7.2, .9, -.3], 42]};
// plumbing: a broken water line under the front lawn, dug up and fixed; the truck at the curb near the line
K.plumb = {hero: [[-7.4, 1.9, 24.6], [-3.0, .2, 17.6], 40], close: [[-6.2, 1.4, 21.6], [-3.3, .05, 18.2], 40], dusk: [[-12, 2.8, 46], [-3, 1.2, 14], 36],
           cfg: [[-7, 1.8, 23.8], [-3.2, .1, 18], 42]};
// handyman: a to-do list on the porch (gutter, top step) and the mailbox at the curb
K.handy = {hero: [[-5.2, 2.0, 15], [-1.4, 2.0, 6.4], 42], close: [[-3.6, 1.6, 12.6], [-1.0, 1.7, 6.4], 44], street: [[-7, 1.7, 46], [-1, 1.6, 22], 40],
           dusk: [[-7, 1.7, 46], [-1, 1.6, 22], 40], cfg: [[-5.6, 2.1, 15.6], [-1.4, 1.9, 6.4], 44]};
// stump grinding: an old stump in the side yard, ground out and grown back in
K.stump = {hero: [[-15.2, 1.9, 9.6], [-10.6, .6, 2.9], 40], close: [[-14.4, 1.5, 7.8], [-10.9, .4, 2.9], 40], dusk: [[-19, 2.6, 14], [-8, 1.6, 2], 40],
           cfg: [[-15, 1.8, 9.2], [-10.8, .5, 2.9], 42]};
// towing: a pickup broken down at the curb, a rollback pulls in, tilts its bed and winches it up
K.tow = {hero: [[3, 2.4, 48], [-3.5, 1.2, 35.4], 44], close: [[-12, 2.2, 45], [-5.5, 1.0, 35.4], 44], dusk: [[3, 2.4, 48], [-3.5, 1.2, 35.4], 44],
         cfg: [[-10, 2.4, 47], [-3.5, 1.1, 35.4], 44]};
// small engine repair: a riding mower that won't run in the drive, fixed and driven onto the lawn
K.engine = {hero: [[14.5, 2.4, 30], [7.6, .5, 22], 40], close: [[13.5, 1.8, 26.5], [9.5, .5, 22], 42], dusk: [[14.5, 2.4, 30], [7.6, .5, 22], 40],
            cfg: [[13, 2.2, 29], [7.5, .5, 21.5], 42]};
const HOME = {wash: "wash", concrete: "concrete", hvac: "ac", plumb: "pipe", handy: "list", stump: "stump", tow: "tow", engine: "engine", weld: "weld", roof: "roof", elec: "elec", lock: "lock", fence: "fence", snow: "snow", dig: "dig", well: "well"};
// welding: a rusted, sagging double gate at the end of the drive, welded, painted and hung true
K.weld = {hero: [[14, 1.9, 37], [9.5, .7, 30], 44], close: [[12.8, 1.3, 33.2], [11, .7, 30.2], 44], dusk: [[14, 1.9, 37], [9.5, .7, 30], 44],
          cfg: [[13.4, 1.7, 35.5], [9.8, .7, 30], 44]};
// truck repair: a semi nosed out of bay one of a tall-bay shop; the hood tilts forward, then it drives out onto the lot
// auto glass: the pickup out front with a cracked windshield; the glass comes out and new glass goes in
K.glass = {hero: [[-6.2, 1.8, 14.4], [-2.2, 1.15, 10.0], 32], close: [[-4.4, 2.2, 12.2], [-1.55, 1.45, 9.9], 36], dusk: [[-11, 1.8, 19], [0, 2.4, 3], 36],
           cfg: [[-8.4, 1.9, 15.2], [-2.6, .9, 9.9], 36]};
K.semi = {hero: [[-14, 3.6, 24], [.5, 2.6, 2], 36], side: [[-11.5, 2.6, 4.8], [-2.6, 1.6, .4], 40], close: [[-7.6, 2.2, 3.6], [-2.8, 1.4, 1.3], 42],
          dusk: [[-12, 2.4, 24], [2, 2.4, 5], 40], cfg: [[-10.5, 2.8, 15], [-1.2, 1.8, 2.5], 40]};
// electrical: dusk with most rooms dark and an old fuse box on the side wall; a new panel goes in and the lights come on room by room
K.elec = {hero: [[-15, 3, 24], [-1, 3.4, 2], 38], close: [[-11.5, 2.2, 7.5], [-6, 1.9, 1.2], 36], dusk: [[-4.4, 1.5, 19], [.2, .9, 9], 40],
          cfg: [[-14, 3, 22], [-1.5, 3.2, 2], 38]};
// locksmith: the front door at golden hour; the old knob and deadbolt come out, a keypad deadbolt and lever go in, keys on the ring, door opens
K.lock = {hero: [[-6, 2.4, 15], [0, 2.2, 4], 36], close: [[-.9, 1.7, 7.4], [.3, 1.45, 4], 40], key: [[-.6, 1.8, 5.8], [.35, 1.7, 4], 36],
          dusk: [[-6, 2.4, 15], [0, 2.2, 4], 36], cfg: [[-3.6, 2, 10.5], [.2, 1.8, 4], 38]};
// fence: the side yard left of the house; the old grey fence comes out and a cedar privacy fence goes up
K.fence = {hero: [[-14, 2.0, 16], [-11.2, 1.1, 5.8], 40], close: [[-9.6, 1.5, 10.5], [-11.6, 1.0, 5.8], 42], dusk: [[-16, 2.6, 22], [-9, 1.6, 4], 40],
           cfg: [[-13, 2.1, 15], [-10.8, 1.0, 5.8], 40]};
// snow removal: the morning after a snowfall; the plow clears the drive, then the path and the front walk are shoveled and salted
K.snow = {hero: [[-6, 3.5, 32], [6, 1.2, 10], 40], close: [[1.5, 3.2, 27], [10, .6, 14], 42], walk: [[-3.5, 1.8, 18], [1.5, .4, 11], 40],
          dusk: [[-12, 4.5, 38], [4, 1.5, 6], 40], cfg: [[-5, 3.4, 30], [6, 1.2, 10], 40]};
// excavating: the side yard left of the house; a mini excavator digs a pit, gravel and footing forms go in
K.dig = {hero: [[-14, 7, 15], [-10.5, -.3, .5], 40], close: [[-7.5, 4.2, 9], [-11.2, .2, 1.5], 42], pit: [[-17.2, 4.8, -2.2], [-10.8, -1.2, .4], 42],
         dusk: [[-19, 7.5, 19], [-9, 0, 1], 40], cfg: [[-15, 7, 16], [-10.5, -.3, .5], 40]};
// well drilling: a rig in the front yard; the mast goes up, it drills to water, then the casing gets its cap and the rig leaves
K.well = {hero: [[-24, 4.2, 23.5], [-9.5, 4.4, 11], 40], close: [[-13.5, 1.9, 7.4], [-11, .9, 11.6], 42], done: [[-13.2, 2.6, 6.6], [-11, .3, 11.6], 40],
          dusk: [[-14, 2.4, 16.5], [-11, .3, 11.4], 40], cfg: [[-25, 4.6, 25], [-9.5, 4.2, 11], 40]};
K.roof = {hero: [[-11, 8, 27], [1.5, 4.6, 0], 40], close: [[-6, 9.5, 14], [0, 6.6, 0], 40], dusk: [[-11, 8, 27], [1.5, 4.6, 0], 40],
          cfg: [[-10, 7.6, 25], [1.5, 4.8, 0], 40]};

// The camera rig every trade shares: blend between two keys, drift a little, frame the subject clear of the captions.
function makeRig(world, keys, HB) {
  const {THREE, cam, ctl} = world;
  ctl.enabled = false; ctl.autoRotate = false; ctl.enableDamping = false;
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3(), b0 = new THREE.Vector3(), b1 = new THREE.Vector3(), off = new THREE.Vector3();
  const ease = t => t * t * (3 - 2 * t);
  let intro = reduce ? 1 : 0, fov = 0, vo = "";
  return (t, dt, s) => {
    const A = keys[s.a], B = keys[s.b], e = ease(s.t);
    a0.fromArray(A[0]); a1.fromArray(A[1]); b0.fromArray(B[0]); b1.fromArray(B[1]);
    pos.lerpVectors(a0, b0, e); tgt.lerpVectors(a1, b1, e);
    let f = A[2] + (B[2] - A[2]) * e;
    const idle = reduce ? 0 : Math.sin(t * .16) * .04;
    off.subVectors(pos, tgt).applyAxisAngle(THREE.Object3D.DEFAULT_UP, idle + (s.yaw || 0));
    const w = world.host.clientWidth, h = world.host.clientHeight, asp = w / h, phone = asp < .8;
    if (phone) { off.multiplyScalar(asp < .55 ? 1.42 : 1.25); f += 10; }
    if (intro < 1) { intro = Math.min(1, intro + dt / 2.6); const k = 1 - Math.pow(1 - intro, 3); off.multiplyScalar(1 + .2 * (1 - k)); off.y += 2.2 * (1 - k); }
    cam.position.copy(tgt).add(off); ctl.target.copy(tgt); cam.lookAt(tgt);
    // frame the subject right of the captions on desktop, above them on a phone
    const ox = phone ? 0 : -w * (w > 1100 ? .14 : .09), oy = phone ? h * .16 : 0, key = w + "," + h + "," + ox.toFixed(0) + "," + oy.toFixed(0);
    if (Math.abs(f - fov) > .01 || key !== vo) { fov = f; vo = key; cam.fov = f; cam.setViewOffset(w, h, ox, oy, w, h); cam.updateProjectionMatrix(); }
  };
}

// Auto shops: a two-bay garage with the shop's own name on the sign and a pickup that goes up on the lift.
async function startAuto(HB) {
  const body = HB.group === "body" || HB.group === "glass", glass = HB.group === "glass", semi = HB.group === "semi", keys = K[HB.group], {makeGarage} = await import("./garage.js");
  const lot = (x, z) => (x > -7.2 && x < 11 && z > -11.5 && z < 6) || (z > -.6 && z < 30.6 && x > -30.4 && x < 34.4);
  const world = await makeWorld({
    cam: {pos: keys.hero[0], target: keys.hero[1], minD: 1, maxD: 400, minAz: -99, maxAz: 99, maxPolar: Math.PI * .62},
    tod: .3, ground: "lawn", grassR: 44, grassH: .15, grassW: .04, grassN: small ? .9 : 1.6, offset: false, fov: () => 36, exclude: lot,
  });
  const font = getComputedStyle(document.documentElement).getPropertyValue("--serif").split(",")[0].trim() || "sans-serif";
  const G = await makeGarage(world, {sign: HB.name || (semi ? "Truck Repair" : glass ? "Auto Glass" : body ? "Auto Body" : "Auto Repair"), font, kind: semi ? "truck" : glass ? "glass" : body ? "body" : "auto"});
  const rig = makeRig(world, keys, HB), cur = body ? {lift: 0, wheels: 1, hood: 0, pos: 1, fix: 0} : {lift: 0, wheels: 1, hood: 0, pos: 0};
  let first = true;
  world.onTick.push((t, dt) => {
    const s = HB.get(), P = s.v;
    world.setTod(s.tod);
    // ease toward the scroll or panel values so taps and fast scrolls still read as motion
    const k = first || reduce ? 1 : Math.min(1, dt * 4.5); first = false;
    for (const n in cur) { const to = P[n] ?? cur[n]; cur[n] += (to - cur[n]) * k; if (Math.abs(to - cur[n]) < .002) cur[n] = to; }
    // the truck only leaves once it is back together and on the floor
    const pos = cur.lift > .04 || cur.wheels < .96 || (semi && cur.hood > .04) ? 0 : cur.pos;
    G.set({door: 1, door2: 0, lift: cur.lift, wheels: cur.wheels, hood: cur.hood, pos, color: P.color, fix: body ? cur.fix : undefined});
    rig(t, dt, s);
  });
  world.size(); world.setTodNow(HB.get().tod);
  await world.ready;
  world.setTodNow(HB.get().tod);
  world.start();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return world;
}

// Storefronts: the shop's own name on the sign band, its trade on the window, an interior dressed for the trade.
async function startStore(HB) {
  const keys = K[HB.group], stand = STORE[HB.group] === "stand", {makeStore} = await import("./storefront.js"), SM = stand ? await import("./stand.js") : null;
  const world = await makeWorld({
    cam: {pos: keys.hero[0], target: keys.hero[1], minD: 1, maxD: 400, minAz: -99, maxAz: 99, maxPolar: Math.PI * .62},
    tod: .62, ground: "lawn", grassR: 30, grassH: .15, grassW: .04, grassN: .12, offset: false, fov: () => 36, exclude: stand ? SM.standExclude : (x, z) => z > -11 && z < 40,
  });
  const font = getComputedStyle(document.documentElement).getPropertyValue("--serif").split(",")[0].trim() || "sans-serif";
  const S = await (stand ? SM.makeStand : makeStore)(world, {kind: STORE[HB.group], sign: HB.name || "Open", font, word: WORD[HB.v] || ""});
  const rig = makeRig(world, keys, HB), cur = {open: 0, lights: 0, awning: 0, door: 0};
  let first = true;
  world.onTick.push((t, dt) => {
    const s = HB.get(), P = s.v;
    world.setTod(s.tod);
    const k = first || reduce ? 1 : Math.min(1, dt * 4.5); first = false;
    for (const n in cur) { const to = P[n] ?? cur[n]; cur[n] += (to - cur[n]) * k; if (Math.abs(to - cur[n]) < .002) cur[n] = to; }
    S.set({open: cur.open, lights: cur.lights, awning: cur.awning, door: cur.door, color: P.color});
    rig(t, dt, s);
  });
  world.size(); world.setTodNow(HB.get().tod);
  await world.ready;
  world.setTodNow(HB.get().tod);
  world.start();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return world;
}

// house cleaning: inside a living room, swept clean from left to right
K.clean = {hero: [[2.4, 1.6, 1.4], [-.8, .85, -2.8], 46], close: [[2.4, 1.6, 1.4], [-.8, .85, -2.8], 46], floor: [[2.2, .9, .4], [-.6, .05, -2.0], 46],
           dusk: [[2.4, 1.6, 1.4], [-.8, .85, -2.8], 46], cfg: [[1.6, 1.4, .4], [-.7, .7, -2.7], 46]};
K.office = K.carpet = K.floor = K.clean;
// appliance repair: a kitchen; the dishwasher is pulled out and leaking, fixed, and slid back in
K.appl = {hero: [[1.9, 1.45, -.4], [-.4, .8, -4.0], 46], close: [[1.3, 1.1, -2.0], [.2, .45, -3.9], 44], dusk: [[1.9, 1.45, -.4], [-.4, .8, -4.0], 46],
          cfg: [[1.6, 1.35, -1.0], [-.2, .7, -4.0], 44]};  // janitorial: the same room, fitted out as an office
async function startRoom(HB) {
  const keys = K[HB.group] || K.clean, {makeRoom} = await import("./room.js");
  const world = await makeWorld({
    cam: {pos: keys.hero[0], target: keys.hero[1], minD: .5, maxD: 200, minAz: -99, maxAz: 99, maxPolar: Math.PI * .62},
    tod: .3, ground: "lawn", grassR: 30, grassH: .15, grassW: .04, grassN: small ? .3 : .6, offset: false, fov: () => 46, exclude: (x, z) => x > -3.8 && x < 3.8 && z > -5.2 && z < 3,
  });
  const font = getComputedStyle(document.documentElement).getPropertyValue("--serif").split(",")[0].trim() || "sans-serif";
  const R = makeRoom(world, {card: HB.name || "", font, kind: HB.group === "office" ? "office" : HB.group === "carpet" ? "carpet" : HB.group === "floor" ? "floor" : HB.group === "appl" ? "appl" : "home"});
  const rig = makeRig(world, keys, HB), cur = {fix: 0};
  let first = true;
  world.onTick.push((t, dt) => {
    const s = HB.get(), P = s.v;
    world.setTod(s.tod);
    const k = first || reduce ? 1 : Math.min(1, dt * 4.5); first = false;
    const to = P.fix ?? cur.fix; cur.fix += (to - cur.fix) * k; if (Math.abs(to - cur.fix) < .002) cur.fix = to;
    R.set({fix: cur.fix});
    rig(t, dt, s);
  });
  world.size(); world.setTodNow(HB.get().tod);
  await world.ready;
  world.setTodNow(HB.get().tod);
  world.start();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return world;
}

export async function start(HB) {
  if (["clean", "office", "carpet", "floor", "appl"].includes(HB.group)) return startRoom(HB);
  if (STORE[HB.group]) return startStore(HB);
  if (HB.group === "auto" || HB.group === "body" || HB.group === "semi" || HB.group === "glass") return startAuto(HB);
  const g = HB.group, keys = K[g];
  let house = null, tree = null;
  const world = await makeWorld({
    cam: {pos: keys.hero[0], target: keys.hero[1], minD: 1, maxD: 400, minAz: -99, maxAz: 99, maxPolar: Math.PI * .62},
    tod: .56, ground: g === "snow" ? "snow" : "lawn", grassR: 34, grassH: .15, grassW: .04, grassN: small ? 1.5 : 2.6, offset: false, fov: () => 36,
    exclude: (x, z) => (house ? house.exclude(x, z) : false) || (tree ? tree.exclude(x, z) : false),
  });
  const {THREE, cam, ctl} = world;
  house = makeHouse(world);
  if (g === "tree") tree = yardTree(world);
  const line = HOME[g] === "pipe" ? yardLine(world) : HOME[g] === "stump" ? stumpGrind(world) : HOME[g] === "dig" ? digJob(world) : HOME[g] === "well" ? wellJob(world) : null;
  // grass was planted before the house existed: keep only the blades outside its footprint
  if (world.grass) { const gr = world.grass, m = new THREE.Matrix4(), c = new THREE.Color(), P = gr.userData.pos; let n = 0;
    for (let i = 0; i < P.length; i++) { const [x, z, sc, q] = P[i]; if (house.exclude(x, z) || (tree && tree.exclude(x, z)) || (line && line.exclude(x, z))) continue; m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, sc, 1)); gr.setMatrixAt(n, m); gr.getColorAt(i, c); gr.setColorAt(n, c); n++; }
    gr.count = n; gr.instanceMatrix.needsUpdate = true; if (gr.instanceColor) gr.instanceColor.needsUpdate = true; }
  const yard = g === "lawn" ? lawn(world, {exclude: (x, z) => house.exclude(x, z)}) : null;
  house.setFinish({siding: "white", roof: "black", trim: "black", door: "fir", porch: true});
  house.setProgress(1);
  // home services: the drive overlay, the crew's truck, and (washing) grime on the siding
  let drive = null; const hcur = {fix: 0, house: 0}, GRIME = {siding: new THREE.Color(0xa9a68f), trim: new THREE.Color(0x6f6d60)}, CLEAN = {};
  if (HOME[g]) {
    const font = getComputedStyle(document.documentElement).getPropertyValue("--serif").split(",")[0].trim() || "sans-serif";
    drive = HOME[g] === "tow" ? await towJob(world, {sign: HB.name || "", font}) : HOME[g] === "engine" ? mowerFix(world) : HOME[g] === "weld" ? weldGate(world) : HOME[g] === "roof" ? roofJob(world, house) : HOME[g] === "elec" ? elecJob(world, house) : HOME[g] === "lock" ? lockJob(world, house) : HOME[g] === "fence" ? fenceJob(world) : HOME[g] === "snow" ? await snowJob(world, house, {sign: HB.name || "", font}) : HOME[g] === "ac" ? acUnit(world) : HOME[g] === "list" ? fixList(world) : line || flatwork(world, {kind: HOME[g]});
    if (!["tow", "engine", "weld", "snow"].includes(HOME[g])) await workTruck(world, {sign: HB.name || "", font, x: {ac: -11, pipe: -6, list: 1.5}[HOME[g]] ?? -1.5, z: 35.4, ry: Math.PI / 2});
    CLEAN.siding = house.M.siding.color.clone(); CLEAN.trim = house.M.trim.color.clone();
  }
  let hfirst = true;

  // painting: blend siding, trim and door from faded to the chosen colors
  const FADE = {siding: new THREE.Color(0xb9b2a0), trim: new THREE.Color(0x8a8476), door: new THREE.Color(0x8a6a55)};
  const cA = new THREE.Color(), cB = new THREE.Color();
  let doorFir = null, shadowKey = "";

  const rig = makeRig(world, keys, HB);
  world.onTick.push((t, dt) => {
    const s = HB.get(), P = s.v;
    world.setTod(s.tod);
    if (yard) yard.set({h: 5, stripes: P.stripes ?? 1, cut: P.cut ?? 1});
    if (tree) { tree.shape(+(P.trim ?? 0).toFixed(3)); tree.down(+(P.down ?? 0).toFixed(3)); const k = (P.trim ?? 0).toFixed(2) + (P.down ?? 0).toFixed(2); if (k !== shadowKey) { shadowKey = k; world.shadows(); } }
    if (drive) {
      const k = hfirst || reduce ? 1 : Math.min(1, dt * 4.5); hfirst = false;
      for (const n in hcur) { const to = P[n] ?? hcur[n]; hcur[n] += (to - hcur[n]) * k; if (Math.abs(to - hcur[n]) < .002) hcur[n] = to; }
      drive.set({fix: hcur.fix, t});
      if (g === "wash") { house.M.siding.color.copy(GRIME.siding).lerp(CLEAN.siding, hcur.house); house.M.trim.color.copy(GRIME.trim).lerp(CLEAN.trim, hcur.house); }
    }
    if (g === "painting") {
      house.M.siding.color.copy(FADE.siding).lerp(cB.setHex(P.color ?? 0x2c3e55), P.body ?? 0);
      house.M.trim.color.copy(FADE.trim).lerp(cA.setHex(P.trimColor ?? 0xf2f1ec), P.trimT ?? 0);
      const fir = (P.body ?? 0) > .5;
      if (fir !== doorFir) { doorFir = fir; house.setFinish({door: fir ? "fir" : 0x8a6a55}); }
    }
    rig(t, dt, s);
  });
  world.size(); world.setTodNow(HB.get().tod);
  await world.ready;
  world.setTodNow(HB.get().tod);
  world.start();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return world;
}
