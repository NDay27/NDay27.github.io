// A living room for house cleaners, seen from inside. makeRoom(world, {card}) builds it around the origin.
// set({fix}) sweeps the room clean from left to right: dust and footprints come off the floor, the clutter goes,
// the window clears, the floor picks up a shine, and the tidy things (pillows, folded throw, flowers, a card) appear.
import {THREE, TEX} from "../../harlow/assets/world.js";

const X0 = -3.2, X1 = 3.2, ZB = -4.6, ZF = 2.4, H = 2.7;

function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function makeRoom(world, {card = "Cleaned with care", font = "sans-serif", kind = "home"} = {}) {
  const office = kind === "office", floor = kind === "floor", carpet = kind === "carpet" || floor;   // floor: old carpet out, subfloor, new hardwood
  const appl = kind === "appl";   // appliance repair: a kitchen with the dishwasher pulled out and leaking, fixed and running again
  const root = new THREE.Group(); root.position.y = .03; world.scene.add(root);   // just above the world's ground disc
  world.R.localClippingEnabled = true;   // the dust and the fresh floor lines are swept by clip planes
  let seed = 23; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const std = (c, ro = .7, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: ro, envMapIntensity: .55, ...o});
  const add = (geo, m, x, y, z, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, h, d, m, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
  const cyl = (a, b, h, m, x, y, z, parent, s = 20) => add(new THREE.CylinderGeometry(a, b, h, s), m, x, y, z, parent);

  // ---------- shell: wood floor, plaster walls, ceiling, a big window behind the sofa ----------
  const carpetT = office ? canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 112 + ((i * 3 + j * 5) % 4) * 4; g.fillStyle = `rgb(${v - 8},${v + 2},${v + 14})`; g.fillRect(i * 128, j * 128, 128, 128); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() < .5 ? "rgba(40,48,60,.18)" : "rgba(220,226,235,.12)"; g.fillRect(r() * w, r() * h, 2, 2); }
    g.fillStyle = "rgba(30,36,46,.35)"; for (let k = 0; k <= 4; k++) { g.fillRect(k * 128 - 1, 0, 2, h); g.fillRect(0, k * 128 - 1, w, 2); } }) : null;
  if (carpetT) { carpetT.wrapS = carpetT.wrapT = THREE.RepeatWrapping; carpetT.repeat.set(3, 3.3); }
  // wall-to-wall plush for carpet cleaners
  const plushT = carpet ? canvasTex(512, 512, (g, w, h) => { g.fillStyle = floor ? "#a99a82" : "#c9bca8"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { const v = r(); g.fillStyle = v < .5 ? `rgba(120,104,84,${.08 + r() * .14})` : `rgba(240,232,218,${.08 + r() * .14})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }) : null;
  if (plushT) { plushT.wrapS = plushT.wrapT = THREE.RepeatWrapping; plushT.repeat.set(4, 4.4); }
  // big porcelain tiles for the kitchen
  const tileT = appl ? canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 214 + ((i + j) % 2) * 6; g.fillStyle = `rgb(${v},${v - 4},${v - 12})`; g.fillRect(i * 256, j * 256, 256, 256); }
    for (let i = 0; i < 5000; i++) { g.fillStyle = r() < .5 ? "rgba(120,110,96,.08)" : "rgba(255,255,255,.12)"; g.fillRect(r() * w, r() * h, 2 + r() * 3, 2); }
    g.fillStyle = "rgba(120,112,100,.55)"; for (let k = 0; k <= 2; k++) { g.fillRect(k * 256 - 2, 0, 4, h); g.fillRect(0, k * 256 - 2, w, 4); } }) : null;
  if (tileT) { tileT.wrapS = tileT.wrapT = THREE.RepeatWrapping; tileT.repeat.set((X1 - X0) / 1.2, (ZF - ZB) / 1.2); }
  const floorM = appl ? std(0xffffff, .45, {map: tileT, envMapIntensity: .6}) : office ? std(0xffffff, 1, {map: carpetT, envMapIntensity: .3}) : carpet && !floor ? std(0xffffff, 1, {map: plushT, envMapIntensity: .25}) : new THREE.MeshStandardMaterial({...TEX.wood([4, 5]), roughness: 1, envMapIntensity: .9});
  const fl = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), floorM, 0, 0, (ZB + ZF) / 2); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  if (floor) floorM.roughness = .55;
  // flooring: the old carpet and the bare subfloor lie over the new hardwood, each cut back by its own sweep line
  const oldClip = new THREE.Plane(new THREE.Vector3(1, 0, 0), -X0 + .4), subClip = new THREE.Plane(new THREE.Vector3(1, 0, 0), -X0 + .4);
  if (floor) {
    world.R.localClippingEnabled = true;
    const ov = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), std(0xffffff, 1, {map: plushT, envMapIntensity: .25, clippingPlanes: [oldClip], polygonOffset: true, polygonOffsetFactor: -1}), 0, .008, (ZB + ZF) / 2);
    ov.rotation.x = -Math.PI / 2; ov.castShadow = false; ov.renderOrder = 1;
    const osbT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#c9a46e"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) { g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 3.14); g.fillStyle = `hsl(${30 + r() * 10},${35 + r() * 20}%,${48 + r() * 22}%)`; g.fillRect(-14, -4, 18 + r() * 18, 5 + r() * 5); g.restore(); }
      g.fillStyle = "rgba(70,50,30,.55)"; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); });
    osbT.wrapS = osbT.wrapT = THREE.RepeatWrapping; osbT.repeat.set((X1 - X0) / 2.44, (ZF - ZB) / 1.22);
    const sub = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), std(0xffffff, .95, {map: osbT, envMapIntensity: .2, clippingPlanes: [subClip], polygonOffset: true, polygonOffsetFactor: -.5}), 0, .004, (ZB + ZF) / 2);
    sub.rotation.x = -Math.PI / 2; sub.castShadow = false;
  }
  const wallM = new THREE.MeshStandardMaterial({...TEX.plaster([2, 2], [255, 255, 255]), color: 0xf0ebe2, envMapIntensity: .25});
  const trimM = std(0xfbfaf6, .45);
  const WX0 = -1.75, WX1 = .55, WY0 = .95, WY1 = 2.35;   // window opening in the back wall
  box(WX0 - X0, H, .14, wallM, (X0 + WX0) / 2, H / 2, ZB - .07); box(X1 - WX1, H, .14, wallM, (WX1 + X1) / 2, H / 2, ZB - .07);
  box(WX1 - WX0, WY0, .14, wallM, (WX0 + WX1) / 2, WY0 / 2, ZB - .07); box(WX1 - WX0, H - WY1, .14, wallM, (WX0 + WX1) / 2, (WY1 + H) / 2, ZB - .07);
  box(.14, H, ZF - ZB, wallM, X0 - .07, H / 2, (ZB + ZF) / 2); box(.14, H, ZF - ZB, wallM, X1 + .07, H / 2, (ZB + ZF) / 2);
  box(X1 - X0 + .3, .1, ZF - ZB, std(0xf7f5f0, .9), 0, H + .05, (ZB + ZF) / 2);
  // baseboards, crown, window casing and muntins
  box(X1 - X0, .12, .025, trimM, 0, .06, ZB + .012); box(.025, .12, ZF - ZB, trimM, X0 + .012, .06, (ZB + ZF) / 2); box(.025, .12, ZF - ZB, trimM, X1 - .012, .06, (ZB + ZF) / 2);
  box(X1 - X0, .08, .05, trimM, 0, H - .04, ZB + .025);
  for (const [w, h, x, y] of [[WX1 - WX0 + .24, .1, (WX0 + WX1) / 2, WY1 + .05], [WX1 - WX0 + .3, .06, (WX0 + WX1) / 2, WY0 - .03], [.1, WY1 - WY0, WX0 - .05, (WY0 + WY1) / 2], [.1, WY1 - WY0, WX1 + .05, (WY0 + WY1) / 2]]) box(w, h, .06, trimM, x, y, ZB + .03);
  box(.04, WY1 - WY0, .04, trimM, (WX0 + WX1) / 2, (WY0 + WY1) / 2, ZB - .04); box(WX1 - WX0, .04, .04, trimM, (WX0 + WX1) / 2, (WY0 + WY1) / 2, ZB - .04);
  const glass = new THREE.MeshPhysicalMaterial({color: 0xffffff, roughness: .02, transparent: true, opacity: .08, envMapIntensity: 1.2, depthWrite: false});
  add(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), glass, (WX0 + WX1) / 2, (WY0 + WY1) / 2, ZB - .05).castShadow = false;
  // smudges and water spots on the glass (fade as it's cleaned)
  const smM = new THREE.MeshBasicMaterial({map: canvasTex(512, 320, (g, w, h) => { for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, rad = 10 + r() * 40, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, "rgba(200,196,180,.5)"); gr.addColorStop(1, "rgba(200,196,180,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.strokeStyle = "rgba(210,206,190,.45)"; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); const x = r() * w; g.moveTo(x, 0); g.quadraticCurveTo(x + 40, h / 2, x - 20, h); g.stroke(); } }), transparent: true, depthWrite: false, opacity: .9});
  if (carpet || appl) smM.opacity = 0;
  const smudge = add(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), smM, (WX0 + WX1) / 2, (WY0 + WY1) / 2, ZB - .03); smudge.castShadow = false;
  // curtains either side of the window (blinds in an office)
  if (office) { const slat = std(0xf2f0ea, .5); for (let y = WY0 + .06; y < WY1 - .02; y += .085) box(WX1 - WX0 - .04, .012, .06, slat, (WX0 + WX1) / 2, y, ZB + .06).rotation.x = .9;
    box(WX1 - WX0 + .04, .05, .07, slat, (WX0 + WX1) / 2, WY1 - .01, ZB + .06); cyl(.003, .003, WY1 - WY0 - .2, std(0xdddddd, .6), WX1 - .1, (WY0 + WY1) / 2 + .08, ZB + .1, root, 4); }
  else if (!appl) {
  const curM = std(0xe7dcc8, .95, {side: THREE.DoubleSide});
  for (const x of [WX0 - .32, WX1 + .32]) { const g = new THREE.PlaneGeometry(.5, H - .25, 12, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 26) * .035); g.computeVertexNormals(); add(g, curM, x, (H - .25) / 2 + .05, ZB + .12); }
  cyl(.015, .015, WX1 - WX0 + 1.5, std(0x2b2b2b, .4, {metalness: .6}), (WX0 + WX1) / 2, H - .12, ZB + .12).rotation.z = Math.PI / 2; }
  const mess = [], tidy = [];   // [object, x]: mess goes and tidy things appear as the sweep passes x
  const m = (o, x = o.position.x) => { mess.push([o, x]); return o; };
  const t = (o, x = o.position.x) => { tidy.push([o, x]); return o; };
  const crumple = (c, x, y, z, s) => { const g = new THREE.IcosahedronGeometry(.2, 2), p = g.attributes.position; const ph = r() * 6, pq = r() * 6; for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), k = .72 + .32 * (.5 + .5 * Math.sin(X * 16 + ph) * Math.sin(Z * 13 + pq + Y * 9)); p.setXYZ(i, X * k, Y * k * .5, Z * k); } g.computeVertexNormals();
    const o = add(g, std(c, .95), x, y, z); o.scale.setScalar(s); o.rotation.y = r() * 3; return m(o); };
  // a folded card with the cleaner's name
  const cardT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#fbf8f2"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c9a46a"; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = "#2a2724"; g.textAlign = "center"; g.font = `600 30px ${font}`; g.fillText(floor ? (card ? "New floors by" : "New floors") : appl ? (card ? "Fixed by" : "Fixed and") : card ? "Cleaned by" : "Freshly cleaned", w / 2, 92); const big = card || (office ? "Ready for Monday" : appl ? "running again" : "Welcome home"); let fs = 52; g.font = `700 ${fs}px ${font}`; while (g.measureText(big).width > w - 60 && fs > 22) { fs -= 2; g.font = `700 ${fs}px ${font}`; } g.fillText(big, w / 2, 170); });
  const cardAt = (x, y, z, ry) => { const g = new THREE.Group(), cm = std(0xffffff, .8, {map: cardT}); const a = add(new THREE.PlaneGeometry(.24, .12), cm, 0, .055, .02, g); a.rotation.x = -.35; const b = add(new THREE.PlaneGeometry(.24, .12), std(0xfbf8f2, .8), 0, .055, -.02, g); b.rotation.x = .35; b.rotation.y = Math.PI;
    g.position.set(x, y, z); g.rotation.y = ry; root.add(g); t(g, x); };
  let sparkAt = [], vacClip = null, KIT = null;
  const paperM = std(0xf7f5ef, .9, {side: THREE.DoubleSide});
  const mug = (x, y, z, c) => { const g = new THREE.Group(); cyl(.045, .04, .1, std(c, .4), 0, .05, 0, g); const h = add(new THREE.TorusGeometry(.03, .008, 6, 12), std(c, .4), .05, .05, 0, g); h.rotation.y = Math.PI / 2; g.position.set(x, y, z); root.add(g); return m(g, x); };
  if (office) {
    // ---------- an office: two desks under the window, a filing cabinet, a water cooler, a whiteboard ----------
    const top = std(0xf1efea, .4), leg = std(0x3a3d42, .5, {metalness: .4}), blk = std(0x1d1f22, .5), chairM = std(0x2f3a48, .85);
    const desk = (x, z) => { box(1.5, .04, .72, top, x, .74, z); for (const dx of [-.7, .7]) box(.04, .72, .66, leg, x + dx, .36, z); box(1.36, .3, .02, leg, x, .55, z - .32);
      box(.56, .34, .03, blk, x, 1.06, z - .2); box(.52, .3, .005, std(0x31475e, .3, {emissive: 0x1c2c3c, emissiveIntensity: .6}), x, 1.06, z - .184); box(.06, .14, .06, blk, x, .83, z - .22); box(.24, .015, .18, blk, x, .755, z - .22);
      box(.44, .015, .14, std(0x2b2d30, .6), x, .755, z + .05); box(.06, .02, .1, std(0x2b2d30, .6), x + .32, .755, z + .06); };
    const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); box(.5, .08, .48, chairM, 0, .48, 0, g); box(.48, .55, .07, chairM, 0, .82, -.24, g); cyl(.025, .025, .36, leg, 0, .27, 0, g, 8);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, b = box(.3, .03, .04, leg, Math.cos(a) * .15, .06, Math.sin(a) * .15, g); b.rotation.y = -a; } return g; };
    desk(-1.5, -3.85); desk(1.3, -3.85); chair(-1.4, -3.05, .25); chair(1.25, -3.0, -.3);
    box(.5, 1.3, .6, std(0x8d939a, .4, {metalness: .5}), 2.75, .65, -4.2); for (let i = 0; i < 3; i++) box(.3, .03, .02, leg, 2.75, .35 + i * .4, -3.89);
    cyl(.16, .16, .9, std(0xe9ecef, .4), -2.85, .45, -1.2, root, 18); cyl(.15, .15, .4, std(0x9cc8e6, .05, {transparent: true, opacity: .7}), -2.85, 1.12, -1.2, root, 18);
    box(.04, .9, 1.5, std(0xfdfdfb, .3), X0 + .03, 1.6, -2.2); box(.05, .96, 1.56, leg, X0 + .02, 1.6, -2.2);
    const clockT = canvasTex(128, 128, (g) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 6; g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke(); });
    add(new THREE.CircleGeometry(.17, 24), std(0xffffff, .5, {map: clockT}), 1.9, 2.25, ZB + .01);
    const PX = 2.75; cyl(.2, .15, .34, std(0xc7c0b2, .6), PX, .17, -1.3); const leafM = std(0x3f6b3a, .7, {side: THREE.DoubleSide});
    for (let i = 0; i < 16; i++) { const l = add(new THREE.SphereGeometry(.16, 8, 6), leafM, PX + (r() - .5) * .4, .5 + r() * .7, -1.3 + (r() - .5) * .35); l.scale.set(.5, 1.3, .14); l.rotation.set(r() - .5, r() * 3, (r() - .5) * 1.2); }
    // a round meeting table with two chairs, and a shelf of binders in the back left corner
    cyl(.5, .5, .035, top, -1.1, .72, -1.75, root, 32); cyl(.04, .04, .7, leg, -1.1, .36, -1.75, root, 10); cyl(.28, .3, .03, leg, -1.1, .015, -1.75, root, 20);
    chair(-1.78, -1.8, -Math.PI / 2); chair(-1.1, -2.45, Math.PI);
    const SHX = X0 + .22, SHZ = -3.95; const shM = std(0x6f5b48, .6); box(.03, 1.6, .9, shM, X0 + .03, .8, SHZ); for (const dz of [-.45, .45]) box(.4, 1.6, .03, shM, SHX, .8, SHZ + dz); box(.42, .03, .92, shM, SHX, 1.6, SHZ);
    
    for (let i = 0; i < 4; i++) { const y = .1 + i * .38; box(.42, .03, .92, std(0x5d4b3b, .6), SHX + .01, y, SHZ); if (i < 3) { let z = SHZ - .4; while (z < SHZ + .36) { const bw = .06 + r() * .02; box(.3, .3, bw, std([0x2f5d8a, 0x9a3b30, 0x3e6b4a, 0xd6b450, 0x3a3d42][(r() * 5) | 0], .7), SHX + .03, y + .17, z + bw / 2); z += bw + .008; } } }
    // mess: an overflowing bin, cups, a pizza box, papers everywhere, scribbled whiteboard
    cyl(.17, .14, .42, std(0x3b3f45, .6), -.45, .21, -3.4);
    for (let i = 0; i < 6; i++) crumple(0xf2efe6, -.45 + (r() - .5) * .25, .43 + r() * .08, -3.4 + (r() - .5) * .25, .45);
    for (let i = 0; i < 5; i++) crumple(0xf2efe6, -.2 + r() * .8, .04, -3.1 + r() * .6, .4);
    mug(-1.0, .76, -3.7, 0xe8e2d6); mug(-1.95, .76, -3.6, 0xc65b3e); mug(1.75, .76, -3.65, 0x2d5d7b); mug(.75, .76, -3.55, 0xf3efe6);
    m(box(.42, .05, .42, std(0xd8c3a0, .9), 1.7, .785, -3.95)).rotation.y = .3; m(box(.15, .2, .12, std(0xf3efe6, .8), .85, .86, -3.95));
    for (let i = 0; i < 12; i++) { const x = -2.6 + r() * 5.2, z = -3.3 + r() * 3.2; const p = add(new THREE.PlaneGeometry(.21, .28), paperM, x, .008 + i * .0004, z); p.rotation.set(-Math.PI / 2, 0, r() * 3); p.castShadow = false; m(p); }
    for (let i = 0; i < 6; i++) { const x = (i < 3 ? -1.5 : 1.3) + (r() - .5) * 1.1, p = add(new THREE.PlaneGeometry(.21, .28), paperM, x, .765 + i * .001, -3.75 + (r() - .5) * .3); p.rotation.set(-Math.PI / 2, 0, r() * 3); p.castShadow = false; m(p); }
    const wbT = canvasTex(512, 300, (g, w, h) => { g.strokeStyle = "rgba(40,70,140,.7)"; g.lineWidth = 5; for (let i = 0; i < 14; i++) { g.beginPath(); let x = 30 + r() * 300, y = 30 + r() * 240; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .3) * 60; y += (r() - .5) * 30; g.lineTo(x, y); } g.stroke(); } });
    const wb = m(add(new THREE.PlaneGeometry(1.44, .84), std(0xffffff, .3, {map: wbT, transparent: true}), X0 + .055, 1.6, -2.2)); wb.rotation.y = Math.PI / 2; wb.castShadow = false;
    // tidy: neat stacks, pen cups, a small plant on each desk, the card
    for (const x of [-1.5, 1.3]) { t(box(.24, .05, .3, std(0xf7f5ef, .8), x - .55, .785, -3.8)); t(cyl(.04, .035, .1, std(0x3a3d42, .5), x + .55, .81, -3.95, root, 12));
      const g = new THREE.Group(); g.position.set(x + .5, .76, -3.65); root.add(g); cyl(.05, .04, .08, std(0xe9e4dc, .6), 0, .04, 0, g, 12); for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(.03, 8, 6), std(0x5c8a3a, .7), Math.cos(k * 1.3) * .025, .1 + (k % 2) * .02, Math.sin(k * 1.3) * .025, g); t(g, x + .5); }
    cardAt(1.0, .76, -3.6, -.3);
    // fresh vacuum lines on the carpet behind the sweep
    const vacT = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)"; g.fillRect(0, i * 32, w, 32); } }); vacT.wrapS = vacT.wrapT = THREE.RepeatWrapping; vacT.repeat.set(1, 5);
    vacClip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), X0);
    const vac = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), new THREE.MeshBasicMaterial({map: vacT, transparent: true, depthWrite: false, clippingPlanes: [vacClip]}), 0, .01, (ZB + ZF) / 2); vac.rotation.x = -Math.PI / 2; vac.castShadow = false; vac.renderOrder = 3;
    sparkAt = [[-1.5, .8, -3.6], [1.3, .8, -3.6], [-1.9, .02, -1.2], [.9, .02, -.8], [WX0 + .4, 1.9, ZB - .02], [WX1 - .3, 1.3, ZB - .02], [1.9, .02, -2.6]];
  } else if (appl) {
    // ---------- a kitchen: sage cabinets, quartz tops, a range on the left, the sink under the window, the dishwasher right of it, a fridge ----------
    const cabM = std(0x52695f, .55), topM = std(0xebe7df, .22), steel = std(0xc9cdd1, .3, {metalness: .85}), blk = std(0x1b1d20, .35), hdl = std(0xb8a27a, .3, {metalness: .8});
    const CH = .88, CD = .6, TOP = CH + .04, BZ0 = ZB + CD / 2;
    const RX = -2.35, DX = .25, SKX = (WX0 + WX1) / 2;   // range, dishwasher and sink centers
    for (const [a, b] of [[X0, RX - .38], [RX + .38, DX - .3], [DX + .3, 1.98]]) { const w = b - a, cx = (a + b) / 2; box(w, CH - .1, CD, cabM, cx, .1 + (CH - .1) / 2, BZ0); box(w - .04, .1, CD - .06, blk, cx, .05, BZ0 - .03);
      const n = Math.max(1, Math.round(w / .5)); for (let i = 0; i < n; i++) { const x0 = a + i * w / n; box(.006, CH - .16, .004, std(0x3c4f47, .6), x0 + .003, .12 + (CH - .16) / 2, ZB + CD + .002); const h = box(.012, .14, .02, hdl, x0 + w / n - .06, CH - .2, ZB + CD + .015); }
      box(w - .004, .006, .004, std(0x3c4f47, .6), cx, CH - .12, ZB + CD + .002); }
    box(1.98 - X0 + .02, .04, CD + .04, topM, (X0 + 1.98) / 2, CH + .02, BZ0 + .02);
    // subway-tile backsplash and upper cabinets either side of the window
    const subT = canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#b9b4aa"; g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = -1; i < 9; i++) { g.fillStyle = `rgb(${244 - (i * 7 + j * 3) % 6},${242 - (i * 5 + j) % 5},${236 - (i * 3 + j * 7) % 6})`; g.fillRect(i * 64 + (j % 2) * 32 + 2, j * 32 + 2, 60, 28); } });
    subT.wrapS = subT.wrapT = THREE.RepeatWrapping; subT.repeat.set((1.98 - X0) / 1.2, 1);
    const spl = add(new THREE.PlaneGeometry(1.98 - X0, .53), std(0xffffff, .3, {map: subT, envMapIntensity: .5}), (X0 + 1.98) / 2, TOP + .265, ZB + .004); spl.castShadow = false;
    for (const [a, b] of [[X0, WX0 - .16], [WX1 + .16, 1.98]]) { const w = b - a, cx = (a + b) / 2; box(w, .78, .34, cabM, cx, 1.86, ZB + .17);
      const n = Math.max(1, Math.round(w / .45)); for (let i = 1; i < n; i++) box(.006, .74, .004, std(0x3c4f47, .6), a + i * w / n, 1.86, ZB + .342); for (let i = 0; i < n; i++) box(.012, .12, .02, hdl, a + (i + .5) * w / n + (i % 2 ? -.16 : .16) * (w / n > .3 ? 1 : 0), 1.55, ZB + .35); }
    // range with a hood
    box(.76, CH - .02, CD, steel, RX, (CH - .02) / 2, BZ0); box(.76, .025, CD, blk, RX, CH - .01, BZ0);
    box(.6, .4, .01, std(0x111214, .05, {metalness: .2}), RX, .45, ZB + CD + .005); { const b = cyl(.012, .012, .56, steel, RX, .72, ZB + CD + .05, root, 8); b.rotation.z = Math.PI / 2; }
    for (const [dx, dz, rr] of [[-.18, -.13, .09], [.18, -.13, .07], [-.18, .13, .07], [.18, .13, .09]]) { const t2 = add(new THREE.TorusGeometry(rr, .008, 6, 24), std(0x3a3c40, .5), RX + dx, CH + .005, BZ0 + dz); t2.rotation.x = Math.PI / 2; t2.castShadow = false; }
    for (let i = 0; i < 4; i++) { const k = cyl(.022, .022, .03, blk, RX - .24 + i * .16, CH - .08, ZB + CD + .02, root, 12); k.rotation.x = Math.PI / 2; }
    box(.78, .14, .5, steel, RX, 1.53, ZB + .25); box(.3, .5, .3, steel, RX, 2.0, ZB + .15);
    // sink and faucet under the window
    box(.66, .03, .42, std(0xa9aeb3, .25, {metalness: .9}), SKX, TOP - .005, BZ0 - .02); box(.6, .02, .36, std(0x6e7378, .3, {metalness: .9}), SKX, TOP - .012, BZ0 - .02);
    cyl(.018, .022, .3, steel, SKX, TOP + .15, ZB + .1, root, 12); { const sp = add(new THREE.TorusGeometry(.1, .016, 8, 16, Math.PI), steel, SKX, TOP + .3, ZB + .2); sp.rotation.y = Math.PI / 2; }
    // fridge in the right corner, with a small display on the door
    const FX = 2.5; box(.9, 1.82, .74, steel, FX, .91, ZB + .4); box(.004, 1.0, .004, blk, FX, 1.3, ZB + .772); box(.9, .006, .004, blk, FX, .78, ZB + .772);
    for (const dx of [-.06, .06]) box(.02, .55, .03, std(0xdadde0, .2, {metalness: .9}), FX + dx, 1.32, ZB + .8); box(.5, .02, .03, std(0xdadde0, .2, {metalness: .9}), FX, .7, ZB + .8);
    box(.12, .07, .005, world.glowMat ? world.glowMat(0x7fc8ff, .35, {color: 0x14202b}) : blk, FX - .22, 1.42, ZB + .773).castShadow = false;
    box(.9, .5, .36, cabM, FX, 2.38, ZB + .2);
    // the dishwasher: steel front, control strip, a door that drops open on its bottom hinge, racks of plates inside
    const dw = new THREE.Group(); root.add(dw); const DW = .59;
    { const inM = std(0x7c8186, .45, {metalness: .5}), hh = CH - .12, yc = .1 + hh / 2; for (const dx of [-DW / 2 + .01, DW / 2 - .01]) box(.02, hh, .56, inM, dx, yc, 0, dw);
      box(DW, .02, .56, inM, 0, .1 + hh - .01, 0, dw); box(DW, .02, .56, inM, 0, .11, 0, dw); box(DW, hh, .02, std(0x5d6267, .6), 0, yc, -.27, dw); }
    for (const y of [.32, .58]) { box(DW - .1, .008, .46, std(0xbfc3c7, .4, {metalness: .7}), 0, y, -.02, dw); for (let i = 0; i < 7; i++) { const pl = cyl(.1, .1, .006, std(0xf4f2ec, .3), -.2 + i * .065, y + .1, -.02, dw, 22); pl.rotation.z = Math.PI / 2; } }
    const door = new THREE.Group(); door.position.set(0, .1, .29); dw.add(door);
    box(DW, CH - .12, .04, steel, 0, (CH - .12) / 2, .0, door); box(DW - .04, .05, .045, blk, 0, CH - .16, .002, door);
    const led = box(.03, .012, .005, world.glowMat ? world.glowMat(0x58e08a, .9, {color: 0x123a20}) : blk, .18, CH - .16, .026, door); led.castShadow = false;
    box(.4, .018, .03, std(0xdadde0, .2, {metalness: .9}), 0, CH - .24, .04, door);
    const kick = box(DW, .09, .015, blk, 0, .05, .27, dw);
    // the leak: a wide puddle in front of the dishwasher, a towel, the tech's bag, a meter and the new pump in its box
    const pudT = canvasTex(512, 512, (g, w, h) => { const blobs = [[256, 230, 150], [170, 300, 110], [350, 300, 100], [250, 360, 90], [120, 220, 60], [400, 210, 70], [300, 140, 70]];
      for (const [x, y, rr] of blobs) { const gr = g.createRadialGradient(x, y, rr * .55, x, y, rr); gr.addColorStop(0, "rgba(58,92,112,.72)"); gr.addColorStop(.75, "rgba(58,92,112,.6)"); gr.addColorStop(1, "rgba(58,92,112,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 6; g.lineCap = "round"; for (const [x, y, l] of [[200, 230, 70], [300, 290, 50]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y - l * .35); g.stroke(); }
      for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 170 + r() * 70, gr = g.createRadialGradient(256 + Math.cos(a) * d, 260 + Math.sin(a) * d * .8, 0, 256 + Math.cos(a) * d, 260 + Math.sin(a) * d * .8, 8 + r() * 12); gr.addColorStop(0, "rgba(58,92,112,.65)"); gr.addColorStop(1, "rgba(58,92,112,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); } });
    const puddle = add(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshStandardMaterial({map: pudT, roughness: .04, metalness: .2, transparent: true, envMapIntensity: 1.4, polygonOffset: true, polygonOffsetFactor: -3, depthWrite: false}), DX + .1, .006, ZB + 1.2);
    puddle.rotation.x = -Math.PI / 2; puddle.scale.set(1.3, 1, 1); puddle.castShadow = false; puddle.receiveShadow = false; puddle.renderOrder = 4;
    const towel = crumple(0x7aa0b8, DX + .75, .05, ZB + 1.6, 1.2); mess.pop();
    const kit = new THREE.Group(); kit.position.set(1.05, 0, ZB + 1.55); kit.rotation.y = -.4; root.add(kit);
    box(.48, .26, .24, std(0x2f3b33, .9), 0, .13, 0, kit); box(.5, .03, .26, std(0x1d2420, .8), 0, .27, 0, kit); { const hd = add(new THREE.TorusGeometry(.12, .012, 6, 16, Math.PI), std(0x1d1f22, .6), 0, .28, 0, kit); }
    box(.05, .02, .2, std(0xb3241c, .5), .3, .01, .12, kit).rotation.y = .5; cyl(.014, .014, .22, std(0xf0c419, .5), -.32, .016, .14, kit, 8).rotation.z = Math.PI / 2;
    const meter = box(.08, .03, .15, std(0xf0b419, .5), -.15, .015, .3, kit); meter.rotation.y = .7;
    const kickOff = box(DW, .09, .015, blk, DX - .45, .01, ZB + 1.15); kickOff.rotation.set(-Math.PI / 2, 0, .3);
    const part = new THREE.Group(); part.position.set(DX + .55, 0, ZB + 1.0); root.add(part);
    box(.2, .14, .16, std(0xc9a46e, .9), 0, .07, 0, part); cyl(.045, .045, .09, std(0x2a2d31, .5), 0, .2, 0, part, 16); cyl(.016, .016, .12, std(0x2a2d31, .5), .07, .2, 0, part, 8).rotation.z = Math.PI / 2;
    // dirty dishes stacked by the sink (they end up in the clean racks)
    const dishes = new THREE.Group(); root.add(dishes);
    for (let i = 0; i < 5; i++) cyl(.12 - i * .004, .1 - i * .004, .016, std([0xf4f2ec, 0xe7d9c3, 0xf4f2ec][i % 3], .35), SKX + .52, TOP + .01 + i * .018, BZ0 - .05, dishes, 22);
    for (const [dx, c] of [[-.5, 0xc65b3e], [.72, 0x2d5d7b], [.6, 0xe8e2d6]]) { const g = new THREE.Group(); cyl(.045, .04, .1, std(c, .4), 0, .05, 0, g); g.position.set(SKX + dx, TOP, BZ0 + .08 + (dx > .65 ? -.15 : 0)); dishes.add(g); }
    // tidy: a bowl of lemons and a folded towel on the oven bar, plus the card
    const tidyK = new THREE.Group(); root.add(tidyK);
    { const b = cyl(.16, .1, .08, std(0xf4f2ec, .4), -1.2, TOP + .04, BZ0 + .05, tidyK, 24); for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(.045, 12, 10), std(0xf2cf3a, .5), -1.2 + Math.cos(i * 1.6) * .06, TOP + .1, BZ0 + .05 + Math.sin(i * 1.6) * .06, tidyK).scale.set(1, .85, 1.25); }
    box(.2, .26, .015, std(0xe9e1d2, .9), RX + .1, .6, ZB + CD + .06, tidyK);
    const cardG = new THREE.Group(), cm = std(0xffffff, .8, {map: cardT}); const ca = add(new THREE.PlaneGeometry(.24, .12), cm, 0, .055, .02, cardG); ca.rotation.x = -.35; const cb = add(new THREE.PlaneGeometry(.24, .12), std(0xfbf8f2, .8), 0, .055, -.02, cardG); cb.rotation.x = .35; cb.rotation.y = Math.PI;
    cardG.position.set(DX + .62, TOP, BZ0 + .12); cardG.rotation.y = -.35; tidyK.add(cardG);
    // a small oak table with two chairs and a jug of flowers on the open side of the room, a runner by the sink
    { const oak = std(0xb08455, .55), seat = std(0x2f3a36, .7), TX = -2.1, TZ = -2.0;
      cyl(.55, .55, .04, oak, TX, .74, TZ, root, 36); cyl(.05, .07, .7, oak, TX, .37, TZ, root, 12); cyl(.32, .34, .03, oak, TX, .015, TZ, root, 24);
      for (const [dx, dz, a] of [[.78, .1, -Math.PI / 2 - .2], [-.15, .78, Math.PI + .15]]) { const c = new THREE.Group(); c.position.set(TX + dx, 0, TZ + dz); c.rotation.y = a; root.add(c);
        box(.42, .04, .42, oak, 0, .46, 0, c); for (const [x, z] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) box(.035, .46, .035, oak, x, .23, z, c);
        for (const x of [-.18, .18]) box(.035, .48, .035, oak, x, .72, -.19, c); box(.42, .1, .03, seat, 0, .9, -.19, c); }
      cyl(.07, .06, .2, std(0x3f5a6a, .3), TX + .1, .86, TZ - .05, root, 16);
      for (let i = 0; i < 6; i++) { const a2 = i / 6 * 6.28; add(new THREE.SphereGeometry(.04, 8, 6), std([0xf3f0ea, 0xf5c542, 0xe8a0a8][i % 3], .6), TX + .1 + Math.cos(a2) * .06, 1.02 + (i % 2) * .03, TZ - .05 + Math.sin(a2) * .06); }
      const runT = canvasTex(256, 512, (g, w, h) => { g.fillStyle = "#b5583e"; g.fillRect(0, 0, w, h); g.strokeStyle = "#e9d9bf"; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28); g.fillStyle = "#2f4c4a"; for (let i = 0; i < 6; i++) g.fillRect(60, 60 + i * 70, w - 120, 18); });
      const run = add(new THREE.PlaneGeometry(.7, 1.6), std(0xffffff, .95, {map: runT}), SKX - .55, .004, ZB + 1.3); run.rotation.set(-Math.PI / 2, 0, Math.PI / 2); run.castShadow = false; }
    KIT = {dw, door, led, kick, kickOff, puddle, towel, kit, part, dishes, tidyK, DX, BZ0};
    sparkAt = [[DX, .9, ZB + .7], [DX + .2, .02, ZB + 1.2], [SKX, TOP + .05, BZ0], [-1.2, TOP + .15, BZ0], [DX - .3, .02, ZB + 1.6], [FX - .2, 1.5, ZB + .8]];
  } else {
  if (carpet && !floor) {
    // fresh wand strokes behind the sweep: wide stripes front to back, a touch darker where it's still damp
    const stT = canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(255,250,240,.10)" : "rgba(60,50,40,.07)"; g.fillRect(i * 32, 0, 32, h); } }); stT.wrapS = stT.wrapT = THREE.RepeatWrapping; stT.repeat.set(5, 1);
    vacClip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), X0);
    const st = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), new THREE.MeshBasicMaterial({map: stT, transparent: true, depthWrite: false, clippingPlanes: [vacClip]}), 0, .01, (ZB + ZF) / 2); st.rotation.x = -Math.PI / 2; st.castShadow = false; st.renderOrder = 3;
  }

  // ---------- furniture ----------
  const fab = std(0x56677a, .92), wood = std(0x8a5a3a, .5), dk = std(0x2a2724, .5);
  const SX = (WX0 + WX1) / 2, SZ = ZB + .55;
  box(2.4, .4, .9, fab, SX, .24, SZ); box(2.4, .55, .2, fab, SX, .7, SZ - .36); box(.2, .6, .9, fab, SX - 1.1, .52, SZ); box(.2, .6, .9, fab, SX + 1.1, .52, SZ);
  for (const dx of [-.66, 0, .66]) box(.64, .13, .68, std(0x5f7186, .95), SX + dx, .5, SZ + .07);
  for (const dx of [-1.1, 1.1]) for (const dz of [-.38, .38]) cyl(.025, .02, .06, dk, SX + dx, .03, SZ + dz);
  // rug
  const rugT = canvasTex(512, 360, (g, w, h) => { g.fillStyle = "#c9b79a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a4a3a"; g.lineWidth = 14; g.strokeRect(20, 20, w - 40, h - 40);
    g.strokeStyle = "#3f5a6a"; g.lineWidth = 5; g.strokeRect(44, 44, w - 88, h - 88); g.fillStyle = "#8a4a3a"; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { g.save(); g.translate(96 + i * 80, 100 + j * 80); g.rotate(Math.PI / 4); g.fillRect(-14, -14, 28, 28); g.restore(); } });
  if (!carpet) { const rug = add(new THREE.PlaneGeometry(2.8, 1.9), std(0xffffff, .95, {map: rugT}), SX, .006, -2.45); rug.rotation.x = -Math.PI / 2; rug.castShadow = false; }
  // coffee table
  const TZ = -2.5; box(1.2, .05, .62, wood, SX, .42, TZ); for (const dx of [-.55, .55]) for (const dz of [-.26, .26]) box(.05, .4, .05, wood, SX + dx, .2, TZ + dz); box(1.1, .03, .52, wood, SX, .12, TZ);
  // bookshelf in the back right corner
  const BX = 1.85, BZ = ZB + .22; box(1.1, 1.95, .04, wood, BX, .975, BZ - .16); for (const dx of [-.53, .53]) box(.04, 1.95, .36, wood, BX + dx, .975, BZ);
  for (let i = 0; i < 5; i++) { const y = .05 + i * .46; box(1.06, .03, .34, wood, BX, y, BZ);
    if (i < 4) { let x = BX - .48; while (x < BX + .44) { const bw = .03 + r() * .04, bh = .24 + r() * .14; box(bw, bh, .22, std(new THREE.Color().setHSL(r(), .35, .3 + r() * .25), .8), x + bw / 2, y + .015 + bh / 2, BZ + .02); x += bw + .006; if (r() < .12) x += .1; } } }
  // floor lamp left of the sofa, plant on the right
  const LX = SX - 1.6; cyl(.16, .18, .03, dk, LX, .015, ZB + .4); cyl(.015, .015, 1.5, dk, LX, .77, ZB + .4);
  const shade = cyl(.2, .26, .32, world.glowMat ? world.glowMat(0xf6e6c8, .25, {roughness: .9, side: THREE.DoubleSide}) : std(0xf6e6c8), LX, 1.62, ZB + .4, root, 24);
  const PX = SX + 1.55; cyl(.2, .15, .34, std(0xc7c0b2, .6), PX, .17, ZB + .38);
  const leafM = std(0x3f6b3a, .7, {side: THREE.DoubleSide});
  for (let i = 0; i < 16; i++) { const l = add(new THREE.SphereGeometry(.16, 8, 6), leafM, PX + (r() - .5) * .4, .5 + r() * .7, ZB + .38 + (r() - .5) * .35); l.scale.set(.5, 1.3, .14); l.rotation.set(r() - .5, r() * 3, (r() - .5) * 1.2); }
  // art on the left wall
  const artT = canvasTex(400, 300, (g, w, h) => { g.fillStyle = "#efe8dc"; g.fillRect(0, 0, w, h); const c = ["#c86b4a", "#3f5a6a", "#d9b25a", "#7a8f6a"]; for (let i = 0; i < 4; i++) { g.fillStyle = c[i]; g.beginPath(); g.arc(80 + i * 80, 150 + Math.sin(i) * 40, 50, 0, 7); g.fill(); } });
  box(.04, .72, .96, dk, X0 + .03, 1.55, -2.3); add(new THREE.PlaneGeometry(.88, .64), std(0xffffff, .8, {map: artT}), X0 + .055, 1.55, -2.3).rotation.y = Math.PI / 2;

  // ---------- the mess (gone as the sweep passes) ----------
  if (!carpet) {
  // laundry piled on the sofa and a throw bunched on the floor
  for (const [c, dx, s] of [[0xd8d2c4, -.75, 1.3], [0x8e3b3b, -.45, 1], [0x2f4c6e, -.62, .9], [0xe7e3da, -.3, .8], [0x4b6b4f, .25, 1.1]]) crumple(c, SX + dx, .62, SZ + .05 + (r() - .5) * .2, s);
  crumple(0x7f6a8c, SX + 1.35, .08, SZ + .75, 1.8); crumple(0x6d7f92, SX - .9, .1, -3.0, 1.2);   // throw on the floor, cushion knocked off
  // coffee table: mugs, a plate, a takeout box, a can, loose papers
  mug(SX - .4, .445, TZ + .12, 0xe8e2d6); mug(SX + .32, .445, TZ - .15, 0x2d5d7b); mug(SX - .1, .445, TZ - .2, 0xc65b3e);
  m(cyl(.13, .12, .015, std(0xf1eee8, .3), SX + .1, .452, TZ + .12));
  m(box(.2, .1, .14, std(0xf3efe6, .8), SX + .42, .495, TZ + .1)).rotation.y = .4;
  m(cyl(.033, .033, .12, std(0xc0392b, .3, {metalness: .7}), SX - .52, .505, TZ - .1));
  for (let i = 0; i < 9; i++) { const x = SX - 1.3 + r() * 2.9, z = -3.3 + r() * 2.2, onT = Math.abs(x - SX) < .55 && Math.abs(z - TZ) < .28; const p = add(new THREE.PlaneGeometry(.21, .28), paperM, x, onT ? .448 : .008 + i * .0004, z); p.rotation.set(-Math.PI / 2, 0, r() * 3); p.castShadow = false; m(p); }
  // toys on the rug, shoes by the door side
  const toyC = [0xd64541, 0x2e86de, 0xf5b041, 0x27ae60];
  for (let i = 0; i < 9; i++) { const x = SX - .9 + r() * 1.8, z = -2.0 + r() * .7; m(box(.08, .08, .08, std(toyC[i % 4], .5), x, .04, z)).rotation.y = r() * 3; }
  m(add(new THREE.SphereGeometry(.11, 18, 12), std(0xd64541, .4), SX + 1.05, .11, -1.7));
  for (const [x, z, a] of [[1.6, -.9, .3], [1.85, -.7, 1.2], [-2.4, -1.2, 2]]) { const s = box(.11, .08, .28, std(0x3b3633, .6), x, .04, z); s.rotation.y = a; m(s); }
  }
  }
  // cobweb in the top left corner
  const web = new THREE.Group(); root.add(web); const wm = new THREE.LineBasicMaterial({color: 0xdddddd, transparent: true, opacity: .55});
  for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI / 2; web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * .5, -Math.sin(a) * .5, 0)]), wm)); }
  for (let k = 1; k < 5; k++) { const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2, rr = k * .11 * (1 - .12 * Math.sin(i * 1.7)); pts.push(new THREE.Vector3(Math.cos(a) * rr, -Math.sin(a) * rr, 0)); } web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wm)); }
  web.position.set(X0 + .02, H - .02, ZB + .3); web.rotation.y = Math.PI / 2; m(web, X0); web.visible = !carpet && !appl; if (carpet || appl) mess.pop();
  // dust, crumbs and footprints over the floor and rug, wiped away by a moving clip plane
  const W = X1 - X0, D = ZF - ZB, px = (x) => (x - X0) / W * 1024, pz = (z) => (z - ZB) / D * 1024;   // world x,z -> canvas
  const blot = (g, x, y, rad, c, a, n = 9) => { for (let i = 0; i < n; i++) { const ox = x + (r() - .5) * rad * .9, oy = y + (r() - .5) * rad * .7, rr = rad * (.4 + r() * .6), gr = g.createRadialGradient(ox, oy, 0, ox, oy, rr);
    gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(.7, `rgba(${c},${a * .8})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(ox, oy, rr, 0, 7); g.fill(); } };
  const dustT = carpet ? canvasTex(1024, 1024, (g, w, h) => {
    // a grey traffic lane from the doorway side to the sofa, coffee by the table, red wine, a pet spot, muddy paw prints
    g.lineCap = "round"; for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(92,82,68,${.07})`; g.lineWidth = 150 - k * 18; g.beginPath(); g.moveTo(px(1.4), pz(2.4)); g.bezierCurveTo(px(1.0), pz(.6), px(-.2), pz(-.4), px(-.6), pz(-1.6)); g.stroke(); }
    for (let i = 0; i < 2600; i++) { const t = r(), x = px(1.4 - 2 * t) + (r() - .5) * 140, y = pz(2.4 - 4 * t) + (r() - .5) * 60; g.fillStyle = "rgba(70,60,48,.22)"; g.fillRect(x, y, 2, 2); }
    blot(g, px(.25), pz(-1.95), 46, "120,78,40", .5); blot(g, px(.5), pz(-1.75), 16, "120,78,40", .45, 4);
    blot(g, px(-1.7), pz(-1.55), 54, "128,30,48", .55); blot(g, px(-1.45), pz(-1.35), 14, "128,30,48", .5, 3);
    blot(g, px(2.3), pz(-2.7), 40, "168,140,60", .4);
    for (let i = 0; i < 9; i++) { const t = i / 8, x = px(2.5 - 2.2 * t) + (i % 2) * 18, y = pz(1.9 - 3.1 * t);
      g.fillStyle = "rgba(78,58,38,.62)"; g.beginPath(); g.ellipse(x, y, 8, 6.5, 0, 0, 7); g.fill(); for (let k = 0; k < 4; k++) { const a = -2.35 + k * .52; g.beginPath(); g.ellipse(x + Math.cos(a) * 12, y + Math.sin(a) * 11, 3.2, 3.8, a + 1.57, 0, 7); g.fill(); } } }) : canvasTex(1024, 1024, (g, w, h) => {
    for (let i = 0; i < 500; i++) { const x = r() * w, y = r() * h, rad = 20 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(120,110,92,.22)"); gr.addColorStop(1, "rgba(120,110,92,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.fillStyle = "rgba(70,58,44,.5)"; for (let i = 0; i < 1600; i++) g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
    for (let k = 0; k < 2; k++) { let x = 120 + r() * 300, y = 980; for (let i = 0; i < 9; i++) { g.save(); g.translate(x + (i % 2) * 34, y); g.rotate(-.5); g.fillStyle = "rgba(80,66,50,.35)"; g.beginPath(); g.ellipse(0, 0, 14, 30, 0, 0, 7); g.fill(); g.restore(); x += 46; y -= 90; } } });
  const clip = new THREE.Plane(new THREE.Vector3(1, 0, 0), -X0);   // world space; the room sits at x = 0
  const dustM = new THREE.MeshStandardMaterial({map: dustT, transparent: true, depthWrite: false, roughness: 1, envMapIntensity: .2, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: -2});
  const dust = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), dustM, 0, .012, (ZB + ZF) / 2); dust.rotation.x = -Math.PI / 2; dust.castShadow = false; dust.renderOrder = 2;

  // ---------- the tidy room (appears as the sweep passes) ----------
  if (carpet) {
    const SX = (WX0 + WX1) / 2, TZ = -2.5;
    cardAt(SX - .05, .445, TZ + .15, -.25);
    sparkAt = [[.25, .02, -1.95], [-1.7, .02, -1.55], [2.3, .02, -2.7], [1.2, .02, .6], [.4, .02, -.6], [-.4, .5, TZ + .2], [1.9, .02, -1.2]];
  } else if (!office && !appl) {
  const SX = (WX0 + WX1) / 2, SZ = ZB + .55, TZ = -2.5;
  for (const [dx, c, a] of [[-.9, 0xd9b25a, .25], [.9, 0xe9e1d2, -.25], [-.62, 0xe9e1d2, .1]]) { const p = box(.42, .38, .12, std(c, .95), SX + dx, .73, SZ - .18); p.rotation.set(-.25, a, 0); t(p); }
  t(box(.5, .08, .34, std(0x8e3b3b, .95), SX + 1.1, .87, SZ + .05));   // throw folded over the arm
  { const g = new THREE.Group(); cyl(.06, .05, .2, std(0xdfe8ec, .05, {transparent: true, opacity: .55}), 0, .1, 0, g);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, s = cyl(.004, .004, .22, std(0x4f7a3a, .6), Math.cos(a) * .03, .3, Math.sin(a) * .03, g, 5); s.rotation.set(Math.sin(a) * .25, 0, Math.cos(a) * .25);
      add(new THREE.SphereGeometry(.035, 8, 6), std([0xf3f0ea, 0xe8a0a8, 0xf5c542][i % 3], .6), Math.cos(a) * .06, .41, Math.sin(a) * .06, g); }
    g.position.set(SX + .25, .445, TZ - .05); root.add(g); t(g, SX + .25); }
  t(box(.26, .04, .2, std(0x2f4c6e, .7), SX - .3, .465, TZ + .05)).rotation.y = .2; t(box(.24, .035, .18, std(0xc9a46a, .7), SX - .3, .5, TZ + .05)).rotation.y = .1;
  { const g = new THREE.Group(), wv = std(0xa8845a, .95); cyl(.2, .17, .22, wv, 0, .11, 0, g, 20); const rim = add(new THREE.TorusGeometry(.2, .018, 6, 24), std(0x7d5f3e, .9), 0, .22, 0, g); rim.rotation.x = Math.PI / 2;
    for (const [dx, dz, c] of [[-.06, .03, 0xd64541], [.05, -.04, 0x2e86de], [.02, .07, 0xf5b041]]) box(.08, .08, .08, std(c, .5), dx, .23, dz, g).rotation.y = dx * 9;
    g.position.set(SX + 1.25, 0, -1.75); root.add(g); t(g, SX + 1.25); }   // toys put away in a basket
  cardAt(SX - .05, .445, TZ + .15, -.25);
  sparkAt = [[SX - .3, .5, TZ + .2], [SX + .5, .46, TZ - .2], [-1.9, .02, -1.2], [.9, .02, -.8], [WX0 + .4, 1.9, ZB - .02], [WX1 - .3, 1.3, ZB - .02], [1.9, .02, -2.6]];
  }
  // a portable carpet extractor and its wand ride along the sweep line (flooring: the old carpet rolls up, boards go down)
  let rig = null, roll = null, edge = null, stack = null;
  if (floor) {
    // the old carpet, rolled up against the left wall until it's hauled out
    roll = new THREE.Group(); roll.position.set(X0 + .3, 0, -.6); root.add(roll);
    { const rl = cyl(.17, .17, 2.6, std(0xffffff, 1, {map: plushT}), 0, .17, 0, roll, 22); rl.rotation.x = Math.PI / 2;
      for (const z of [-1.3, 1.3]) { const e = cyl(.172, .172, .01, std(0x8a7a62, 1), 0, .17, z, roll, 22); e.rotation.x = Math.PI / 2; e.castShadow = false; }
      const tp = add(new THREE.TorusGeometry(.172, .012, 6, 22), std(0xd8d2c4, .6), 0, .17, .4, roll); }
    edge = new THREE.Group(); root.add(edge); const plank = std(0xffffff, .6, {map: floorM.map}), mal = std(0x1d1f22, .6);
    for (const [dx, z, a] of [[.75, -1.6, .03], [.95, -.9, -.02], [.7, .1, .02], [1.0, .5, -.03]]) { const b = box(1.2, .018, .14, plank, dx, .012, z, edge); b.rotation.y = a; }
    { const h = cyl(.016, .016, .3, std(0xa87b4f, .6), .75, .03, .1, edge, 8); h.rotation.x = Math.PI / 2; cyl(.045, .045, .12, mal, .75, .045, -.07, edge, 14).rotation.z = Math.PI / 2; }
    stack = new THREE.Group(); stack.position.set(2.35, 0, 1.35); stack.rotation.y = -.15; root.add(stack);
    for (let i = 0; i < 5; i++) box(1.25, .09, .4, std([0xd9c7a8, 0xcbb894, 0xe2d2b4][i % 3], .8), (r() - .5) * .04, .045 + i * .09, (r() - .5) * .03, stack);
    box(1.28, .005, .02, std(0x2a2a2a, .5), 0, .46, .1, stack); box(1.28, .005, .02, std(0x2a2a2a, .5), 0, .46, -.1, stack);
  }
  if (carpet && !floor) {
    rig = new THREE.Group(); root.add(rig); const body = std(0x2f6fb0, .35, {metalness: .1}), dkM = std(0x1d2126, .5), chrome = std(0xc9cdd2, .25, {metalness: .9});
    const unit = new THREE.Group(); unit.position.set(-.85, 0, .35); unit.rotation.y = .5; rig.add(unit);
    box(.42, .46, .56, body, 0, .33, 0, unit); box(.4, .14, .5, std(0xdfe6ec, .1, {transparent: true, opacity: .75}), 0, .63, 0, unit);
    for (const dx of [-.2, .2]) { const wh = cyl(.08, .08, .05, dkM, dx, .08, -.22, unit, 16); wh.rotation.z = Math.PI / 2; }
    cyl(.025, .025, .06, dkM, -.15, .03, .22, unit, 8); cyl(.025, .025, .06, dkM, .15, .03, .22, unit, 8);
    for (const dx of [-.17, .17]) cyl(.014, .014, .5, chrome, dx, .92, -.25, unit, 8); { const hb = cyl(.016, .016, .36, dkM, 0, 1.17, -.25, unit, 8); hb.rotation.z = Math.PI / 2; }
    // wand: floor head, chrome tube, handle
    const wand = new THREE.Group(); wand.position.set(0, 0, -1.15); rig.add(wand);
    box(.36, .05, .1, dkM, 0, .03, 0, wand); box(.3, .015, .03, chrome, 0, .055, .04, wand);
    const tube = cyl(.016, .016, 1.0, chrome, 0, .5, .2, wand, 10); tube.rotation.x = .38;
    box(.06, .05, .16, dkM, 0, .97, .39, wand).rotation.x = .38; { const tb = cyl(.014, .014, .2, dkM, 0, .99, .45, wand, 8); tb.rotation.z = Math.PI / 2; }
    const a = new THREE.Vector3(-.85 + Math.sin(.5) * -.0, .6, .35), b = new THREE.Vector3(0, .9, -1.15 + .37);
    const hose = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, new THREE.Vector3(-.75, .05, -.1), new THREE.Vector3(-.3, .05, -.55), new THREE.Vector3(0, .35, -.75), b]), 40, .022, 8);
    add(hose, std(0x9aa3ab, .6), 0, 0, 0, rig);
  }
  // sparkles that twinkle once the room is done
  const spT = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(32, 0); g.lineTo(35, 29); g.lineTo(64, 32); g.lineTo(35, 35); g.lineTo(32, 64); g.lineTo(29, 35); g.lineTo(0, 32); g.lineTo(29, 29); g.fill(); });
  const sparks = []; for (const [x, y, z] of sparkAt) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: spT, transparent: true, depthWrite: false, opacity: 0})); s.position.set(x, y + .06, z); s.scale.setScalar(.14); root.add(s); sparks.push(s); }

  // ---------- lights: a warm ceiling fixture and window fill, so the room reads in daylight and at dusk ----------
  const ceil = new THREE.PointLight(0xfff1dc, 9, 14, 1.4); ceil.position.set(-.4, H - .3, -1.6); root.add(ceil);
  const fill = new THREE.PointLight(0xdfe9ff, 5, 10, 1.6); fill.position.set((WX0 + WX1) / 2, 1.8, ZB + 1.1); root.add(fill);
  const front = new THREE.PointLight(0xfff6ea, 4, 12, 1.5); front.position.set(1.2, 2.2, 1.4); root.add(front);
  add(new THREE.CylinderGeometry(.28, .3, .06, 28), std(0xf8f4ea, .4, {emissive: 0xfff1dc, emissiveIntensity: .7}), -.4, H - .03, -1.6).castShadow = false;

  let fix = -1, tt = 0;
  world.onTick.push((tm, dt) => { tt += dt; if (fix < .98) return; sparks.forEach((s, i) => { const k = Math.max(0, Math.sin(tt * 2.2 + i * 1.9)); s.material.opacity = k * k; s.scale.setScalar(.06 + k * .14); }); });
  const set = ({fix: f = 0} = {}) => { if (Math.abs(f - fix) < 1e-4) return; fix = f;
    const ss = (a, b) => { const k = Math.min(1, Math.max(0, (f - a) / (b - a))); return k * k * (3 - 2 * k); };
    const c1 = X0 - .4 + (X1 - X0 + .8) * ss(0, .45), c2 = X0 - .4 + (X1 - X0 + .8) * ss(.4, .95);
    const cx = floor ? c2 : X0 - .4 + (X1 - X0 + .8) * f;   // the sweep line, left to right
    if (floor) { oldClip.constant = -c1; subClip.constant = -c2;
      roll.visible = f > .15 && f < .42;
      edge.visible = f > .4 && f < .95; edge.position.x = Math.min(X1 - .9, c2); stack.visible = f > .3 && f < .97; }
    clip.constant = floor ? -c1 : -cx; dust.visible = appl ? false : floor ? f < .46 : f < .999;
    if (KIT) {   // appliance repair: the leak mopped, the new pump in, the dishwasher slid home, door shut and running
      const K2 = KIT, out = 1 - ss(.5, .72), open = 1 - ss(.6, .8);
      K2.dw.position.set(K2.DX, 0, K2.BZ0 + .02 + .5 * out); K2.door.rotation.x = 1.45 * open;
      K2.puddle.visible = f < .42; K2.puddle.scale.set(1.3 * (1 - .85 * ss(.08, .42)), 1 - .85 * ss(.08, .42), 1); K2.towel.visible = f > .06 && f < .45;
      K2.kit.visible = f < .9; K2.part.visible = f > .2 && f < .52; K2.kick.visible = f >= .78; K2.kickOff.visible = f < .78;
      K2.led.visible = f > .84; K2.dishes.visible = f < .6; K2.tidyK.visible = f > .9;
    }
    for (const [o, x] of mess) o.visible = x > cx; for (const [o, x] of tidy) o.visible = x <= cx;
    smM.opacity = carpet || appl ? 0 : .9 * (1 - Math.min(1, Math.max(0, (cx - WX0) / (WX1 - WX0))));
    if (vacClip) vacClip.constant = cx; else if (!floor && !appl) floorM.roughness = 1 - .36 * f;
    if (rig) { rig.visible = f > .001 && f < .985; rig.position.x = Math.min(X1 - .25, cx); }
    if (f < .98) sparks.forEach(s => { s.material.opacity = 0; }); };
  set({fix: 0});
  return {root, set, exclude: (x, z) => x > X0 - .5 && x < X1 + .5 && z > ZB - .5 && z < ZF + .5};
}
