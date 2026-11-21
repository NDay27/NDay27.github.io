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
  const office = kind === "office";
  const root = new THREE.Group(); root.position.y = .03; world.scene.add(root);   // just above the world's ground disc
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
  const floorM = office ? std(0xffffff, 1, {map: carpetT, envMapIntensity: .3}) : new THREE.MeshStandardMaterial({...TEX.wood([4, 5]), roughness: 1, envMapIntensity: .9});
  const fl = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), floorM, 0, 0, (ZB + ZF) / 2); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
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
  const smudge = add(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), smM, (WX0 + WX1) / 2, (WY0 + WY1) / 2, ZB - .03); smudge.castShadow = false;
  // curtains either side of the window (blinds in an office)
  if (office) { const slat = std(0xf2f0ea, .5); for (let y = WY0 + .06; y < WY1 - .02; y += .085) box(WX1 - WX0 - .04, .012, .06, slat, (WX0 + WX1) / 2, y, ZB + .06).rotation.x = .9;
    box(WX1 - WX0 + .04, .05, .07, slat, (WX0 + WX1) / 2, WY1 - .01, ZB + .06); cyl(.003, .003, WY1 - WY0 - .2, std(0xdddddd, .6), WX1 - .1, (WY0 + WY1) / 2 + .08, ZB + .1, root, 4); }
  else {
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
    g.fillStyle = "#2a2724"; g.textAlign = "center"; g.font = `600 30px ${font}`; g.fillText(card ? "Cleaned by" : "Freshly cleaned", w / 2, 92); const big = card || (office ? "Ready for Monday" : "Welcome home"); let fs = 52; g.font = `700 ${fs}px ${font}`; while (g.measureText(big).width > w - 60 && fs > 22) { fs -= 2; g.font = `700 ${fs}px ${font}`; } g.fillText(big, w / 2, 170); });
  const cardAt = (x, y, z, ry) => { const g = new THREE.Group(), cm = std(0xffffff, .8, {map: cardT}); const a = add(new THREE.PlaneGeometry(.24, .12), cm, 0, .055, .02, g); a.rotation.x = -.35; const b = add(new THREE.PlaneGeometry(.24, .12), std(0xfbf8f2, .8), 0, .055, -.02, g); b.rotation.x = .35; b.rotation.y = Math.PI;
    g.position.set(x, y, z); g.rotation.y = ry; root.add(g); t(g, x); };
  let sparkAt = [], vacClip = null;
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
  } else {

  // ---------- furniture ----------
  const fab = std(0x56677a, .92), wood = std(0x8a5a3a, .5), dk = std(0x2a2724, .5);
  const SX = (WX0 + WX1) / 2, SZ = ZB + .55;
  box(2.4, .4, .9, fab, SX, .24, SZ); box(2.4, .55, .2, fab, SX, .7, SZ - .36); box(.2, .6, .9, fab, SX - 1.1, .52, SZ); box(.2, .6, .9, fab, SX + 1.1, .52, SZ);
  for (const dx of [-.66, 0, .66]) box(.64, .13, .68, std(0x5f7186, .95), SX + dx, .5, SZ + .07);
  for (const dx of [-1.1, 1.1]) for (const dz of [-.38, .38]) cyl(.025, .02, .06, dk, SX + dx, .03, SZ + dz);
  // rug
  const rugT = canvasTex(512, 360, (g, w, h) => { g.fillStyle = "#c9b79a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a4a3a"; g.lineWidth = 14; g.strokeRect(20, 20, w - 40, h - 40);
    g.strokeStyle = "#3f5a6a"; g.lineWidth = 5; g.strokeRect(44, 44, w - 88, h - 88); g.fillStyle = "#8a4a3a"; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { g.save(); g.translate(96 + i * 80, 100 + j * 80); g.rotate(Math.PI / 4); g.fillRect(-14, -14, 28, 28); g.restore(); } });
  const rug = add(new THREE.PlaneGeometry(2.8, 1.9), std(0xffffff, .95, {map: rugT}), SX, .006, -2.45); rug.rotation.x = -Math.PI / 2; rug.castShadow = false;
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
  // cobweb in the top left corner
  const web = new THREE.Group(); root.add(web); const wm = new THREE.LineBasicMaterial({color: 0xdddddd, transparent: true, opacity: .55});
  for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI / 2; web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * .5, -Math.sin(a) * .5, 0)]), wm)); }
  for (let k = 1; k < 5; k++) { const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2, rr = k * .11 * (1 - .12 * Math.sin(i * 1.7)); pts.push(new THREE.Vector3(Math.cos(a) * rr, -Math.sin(a) * rr, 0)); } web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wm)); }
  web.position.set(X0 + .02, H - .02, ZB + .3); web.rotation.y = Math.PI / 2; m(web, X0);
  // dust, crumbs and footprints over the floor and rug, wiped away by a moving clip plane
  const dustT = canvasTex(1024, 1024, (g, w, h) => {
    for (let i = 0; i < 500; i++) { const x = r() * w, y = r() * h, rad = 20 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(120,110,92,.22)"); gr.addColorStop(1, "rgba(120,110,92,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.fillStyle = "rgba(70,58,44,.5)"; for (let i = 0; i < 1600; i++) g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
    for (let k = 0; k < 2; k++) { let x = 120 + r() * 300, y = 980; for (let i = 0; i < 9; i++) { g.save(); g.translate(x + (i % 2) * 34, y); g.rotate(-.5); g.fillStyle = "rgba(80,66,50,.35)"; g.beginPath(); g.ellipse(0, 0, 14, 30, 0, 0, 7); g.fill(); g.restore(); x += 46; y -= 90; } } });
  const clip = new THREE.Plane(new THREE.Vector3(1, 0, 0), -X0);   // world space; the room sits at x = 0 world.R.localClippingEnabled = true;
  const dustM = new THREE.MeshStandardMaterial({map: dustT, transparent: true, depthWrite: false, roughness: 1, envMapIntensity: .2, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: -2});
  const dust = add(new THREE.PlaneGeometry(X1 - X0, ZF - ZB), dustM, 0, .012, (ZB + ZF) / 2); dust.rotation.x = -Math.PI / 2; dust.castShadow = false; dust.renderOrder = 2;

  // ---------- the tidy room (appears as the sweep passes) ----------
  if (!office) {
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
    const cx = X0 - .4 + (X1 - X0 + .8) * f;   // the sweep line, left to right
    clip.constant = -cx; dust.visible = f < .999;
    for (const [o, x] of mess) o.visible = x > cx; for (const [o, x] of tidy) o.visible = x <= cx;
    smM.opacity = .9 * (1 - Math.min(1, Math.max(0, (cx - WX0) / (WX1 - WX0))));
    if (office) vacClip.constant = cx; else floorM.roughness = 1 - .36 * f;
    if (f < .98) sparks.forEach(s => { s.material.opacity = 0; }); };
  set({fix: 0});
  return {root, set, exclude: (x, z) => x > X0 - .5 && x < X1 + .5 && z > ZB - .5 && z < ZF + .5};
}
