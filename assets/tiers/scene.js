// Immersive sample tier: one real-time 3D scene per trade, modeled in code (no stock models or photos).
// Reads #t-data for the shop's name; buttons come from the scene, the Night button is shared.
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

const D = JSON.parse(document.getElementById("t-data").textContent);
const host = document.querySelector(".scene");
const canvas = document.getElementById("c");
const G = host.dataset.scene, VAR = host.dataset.v;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const css = getComputedStyle(document.documentElement);
const ACC = new THREE.Color(css.getPropertyValue("--acc").trim() || "#e2382b");
const ACC2 = new THREE.Color(css.getPropertyValue("--acc2").trim() || "#f5b83d");
const BG = new THREE.Color(css.getPropertyValue("--bg").trim() || "#0e1726");
const DISP = css.getPropertyValue("--disp").split(",")[0].trim() || "sans-serif";

let R;
try { R = new THREE.WebGLRenderer({canvas, antialias: !coarse, alpha: false}); }
catch (e) { host.classList.add("noGL"); throw e; }
R.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
R.outputColorSpace = THREE.SRGBColorSpace;
R.toneMapping = THREE.ACESFilmicToneMapping;
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const DAY_BG = new THREE.Color(G === "auto" ? "#2a3446" : G === "cleaning" || G === "sweets" ? "#f3ede6" : "#bcd9ee");
scene.background = DAY_BG.clone();
scene.fog = new THREE.Fog(scene.background, 30, 70);
const cam = new THREE.PerspectiveCamera(40, 1, .1, 200);
const hemi = new THREE.HemisphereLight("#ffffff", "#6b7a5a", 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff4e0", 2.2);
sun.position.set(8, 14, 9); sun.castShadow = true;
sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
Object.assign(sun.shadow.camera, {left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50});
sun.shadow.bias = -0.0005;
scene.add(sun);
const nightLights = [];

const M = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .7, metalness: 0, ...o});
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
const box = (w, h, d, r = .06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2));

async function signTexture(text, sub, fg = "#fff", bg = "#" + ACC.getHexString()) {
  try { await Promise.race([document.fonts.load(`800 120px ${DISP}`, text), new Promise(r => setTimeout(r, 2000))]); } catch (e) { /* use fallback font */ }
  const c = document.createElement("canvas"); c.width = 1024; c.height = 256;
  const x = c.getContext("2d"); x.fillStyle = bg; x.fillRect(0, 0, 1024, 256);
  x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  let s = 120; const t = document.body.classList.contains("up") ? text.toUpperCase() : text;
  do { x.font = `800 ${s}px ${DISP}, sans-serif`; s -= 4; } while (x.measureText(t).width > 940 && s > 30);
  x.fillText(t, 512, sub ? 108 : 132);
  if (sub) { x.font = "600 40px Inter, sans-serif"; x.globalAlpha = .8; x.fillText(sub, 512, 200); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}

function ground(color = "#7FB069", size = 80) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), M(color, {roughness: 1}));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); return g;
}
function lamp(x, y, z, color = "#ffd59a", power = 30) {
  const l = new THREE.PointLight(color, 0, 18, 1.6); l.position.set(x, y, z); scene.add(l); nightLights.push([l, power]); return l;
}
function house(parent, w = 6, d = 5, h = 3.2, wall = "#E9E1D3", roof = "#5B3A2E") {
  const g = new THREE.Group(); parent.add(g);
  const walls = mesh(box(w, h, d, .05), M(wall), 0, h / 2, 0, g);
  const shape = new THREE.Shape(); shape.moveTo(-w / 2 - .35, 0); shape.lineTo(0, 1.9); shape.lineTo(w / 2 + .35, 0); shape.lineTo(-w / 2 - .35, 0);
  const rg = new THREE.ExtrudeGeometry(shape, {depth: d + .6, bevelEnabled: false}); rg.translate(0, 0, -(d + .6) / 2);
  mesh(rg, M(roof, {roughness: .9}), 0, h, 0, g);
  const win = M("#9cc7e4", {roughness: .2, metalness: .1, emissive: "#000"});
  const trim = M("#ffffff");
  [[-w / 4, 1.8], [w / 4, 1.8]].forEach(([x, y]) => { mesh(box(1.1, 1, .12, .03), trim, x, y, d / 2 + .02, g); mesh(box(.9, .8, .14, .02), win, x, y, d / 2 + .03, g); });
  const door = mesh(box(.9, 1.9, .12, .03), M("#7A3E2B"), 0, .95, d / 2 + .03, g);
  return {g, walls, win, door, trim};
}

const ui = document.getElementById("scBtns");
function button(label, fn, toggle = false) {
  const b = document.createElement("button"); b.type = "button"; b.textContent = label;
  if (toggle) b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", () => { if (toggle) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); fn(b); hint(""); });
  ui.appendChild(b); return b;
}
const hintEl = document.getElementById("scHint");
function hint(t) { if (t) { hintEl.textContent = t; hintEl.style.opacity = 1; } else hintEl.style.opacity = 0; }

const tweens = [], faces = [];
function tween(from, to, ms, set, ease = t => 1 - Math.pow(1 - t, 3)) {
  if (reduce) { set(to); return; }
  tweens.push({t0: performance.now(), from, to, ms, set, ease});
}
const lerp = (a, b, t) => a + (b - a) * t;
let update = () => {};
let target = new THREE.Vector3(0, 1.5, 0);

// ---------------------------------------------------------------- scenes
async function buildAuto() {
  scene.fog = new THREE.Fog(scene.background, 25, 60);
  const floor = ground("#5d6470", 60); floor.material.roughness = .55;
  const bayW = 11;
  mesh(box(bayW + 4, 7, .4), M("#d9d4cb"), 0, 3.5, -4.5);
  mesh(box(.4, 7, 10), M("#cfc9be"), -(bayW / 2 + 2), 3.5, .3);
  const sign = mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({map: await signTexture(D.short, D.town + ", IL")}), 0, 5.6, -4.28);
  sign.castShadow = false;
  // stripes on floor
  for (const x of [-3.2, 3.2]) mesh(new THREE.BoxGeometry(.18, .01, 7), M("#F5B83D"), x, .006, .3);
  // lift
  const post = M("#" + ACC.getHexString(), {roughness: .45, metalness: .3});
  [-2.6, 2.6].forEach(x => { mesh(box(.5, 4.2, .5, .05), post, x, 2.1, 0); mesh(box(.9, .14, .9, .03), M("#333"), x, .07, 0); });
  mesh(box(5.7, .25, .5, .05), post, 0, 4.25, 0);
  const car = new THREE.Group(); scene.add(car);
  const paint = M("#" + ACC2.getHexString(), {roughness: .25, metalness: .55});
  const glass = M("#1d2633", {roughness: .1, metalness: .6});
  mesh(box(4.4, .8, 1.9, .3), paint, 0, .75, 0, car);
  mesh(box(2.4, .7, 1.7, .28), glass, -.2, 1.42, 0, car);
  mesh(box(2.2, .08, 1.6, .04), paint, -.2, 1.78, 0, car);
  const hood = new THREE.Group(); hood.position.set(.9, 1.16, 0); car.add(hood);
  mesh(box(1.3, .07, 1.75, .03), paint, .65, 0, 0, hood);
  mesh(box(1, .4, 1.3, .08), M("#3b3f45", {metalness: .6, roughness: .4}), 1.4, .95, 0, car);
  const tire = new THREE.CylinderGeometry(.42, .42, .32, 24); tire.rotateX(Math.PI / 2);
  const tm = M("#15171a", {roughness: .9}), hub = new THREE.CylinderGeometry(.22, .22, .34, 16); hub.rotateX(Math.PI / 2);
  [[-1.4, .95], [1.4, .95], [-1.4, -.95], [1.4, -.95]].forEach(([x, z]) => { mesh(tire, tm, x, .42, z, car); mesh(hub, M("#c9ccd1", {metalness: .8, roughness: .3}), x, .42, z, car); });
  const head = M("#fff", {emissive: "#fff6d0", emissiveIntensity: .2});
  [.6, -.6].forEach(z => mesh(box(.08, .18, .4, .04), head, 2.2, .85, z, car));
  [.6, -.6].forEach(z => mesh(box(.08, .16, .4, .04), M("#c22", {emissive: "#f22", emissiveIntensity: .3}), -2.2, .85, z, car));
  // tool chest
  mesh(box(1.4, 1.6, .7, .05), M("#c62e2e", {roughness: .35, metalness: .3}), -5.6, .8, -3.6);
  [.5, .9, 1.3].forEach(y => mesh(box(1.3, .02, .02), M("#ddd", {metalness: .8}), -5.6, y, -3.24));
  // shop lights
  [-3, 3].forEach(x => { mesh(box(2.2, .08, .3, .03), M("#fff", {emissive: "#fff", emissiveIntensity: 1}), x, 6.8, 0); lamp(x, 6.2, 0, "#e8f0ff", 40); });
  scene.background = new THREE.Color("#2a3446");
  cam.position.set(7.5, 4.2, 9.5); target.set(0, 1.8, 0);
  let up = 0, hoodOpen = 0;
  button("Raise the lift", b => { const to = up ? 0 : 1; tween(up, to, 1600, v => { up = v; car.position.y = v * 2.3; }); b.textContent = to ? "Lower the lift" : "Raise the lift"; b.classList.toggle("hot", !!to); });
  button("Pop the hood", b => { const to = hoodOpen ? 0 : 1; tween(hoodOpen, to, 900, v => { hoodOpen = v; hood.rotation.z = v * 1.1; }); b.textContent = to ? "Close the hood" : "Pop the hood"; });
  update = () => {};
}

async function buildTree() {
  ground("#7FB069");
  const h = house(scene, 6, 5, 3.2); h.g.position.set(3.5, 0, -2.5);
  const yard = mesh(new THREE.PlaneGeometry(.9, .6), new THREE.MeshBasicMaterial({map: await signTexture(D.short, "Tree service · " + D.town, "#fff", "#" + ACC.getHexString()), side: THREE.DoubleSide}), -1.6, 1.1, 3.4);
  mesh(new THREE.BoxGeometry(.05, 1, .05), M("#555"), -1.95, .5, 3.38); mesh(new THREE.BoxGeometry(.05, 1, .05), M("#555"), -1.25, .5, 3.38);
  yard.scale.set(1.6, 1.6, 1); faces.push(yard);
  const tree = new THREE.Group(); tree.position.set(-2.6, 0, -.5); scene.add(tree);
  const bark = M("#6B4A2F", {roughness: 1});
  const trunk = mesh(new THREE.CylinderGeometry(.32, .55, 4.6, 12), bark, 0, 2.3, 0, tree);
  const leaf = [M("#3E7B3A", {roughness: .95}), M("#4C8C45", {roughness: .95}), M("#356C33", {roughness: .95})];
  const branches = [];
  const rnd = (i) => { const x = Math.sin(i * 91.7) * 43758.5; return x - Math.floor(x); };
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + rnd(i) * .5, y = 2.6 + rnd(i + 9) * 1.9, len = 1.6 + rnd(i + 3) * 1.1;
    const br = new THREE.Group(); br.position.set(0, y, 0); br.rotation.y = a; tree.add(br);
    const arm = new THREE.Group(); arm.rotation.z = -.9 + rnd(i + 5) * .3; br.add(arm);
    mesh(new THREE.CylinderGeometry(.07, .14, len, 7), bark, 0, len / 2, 0, arm);
    const cl = mesh(new THREE.IcosahedronGeometry(.75 + rnd(i + 7) * .35, 1), leaf[i % 3], 0, len + .2, 0, arm);
    cl.scale.y = .8;
    branches.push({g: br, arm, v: new THREE.Vector3(), w: new THREE.Vector3(), fall: false, t: 0});
  }
  const crown = mesh(new THREE.IcosahedronGeometry(1.5, 1), leaf[0], 0, 5.2, 0, tree); crown.scale.set(1, .85, 1);
  lamp(3.5, 2.5, 0.3, "#ffcf8a", 25);
  cam.position.set(4, 4.5, 11); target.set(-1, 2.6, 0);
  let wind = 0, n = 0;
  const trim = button("Trim a branch", b => {
    const br = branches.find(x => !x.fall); if (!br) return;
    br.fall = true; const wp = new THREE.Vector3(); br.arm.getWorldPosition(wp); const q = new THREE.Quaternion(); br.arm.getWorldQuaternion(q);
    scene.attach(br.arm); br.v.set((Math.random() - .5) * 1.5, 1, (Math.random() - .5) * 1.5); br.w.set(Math.random() * 3, 0, Math.random() * 3);
    n++; b.textContent = n >= branches.length ? "All trimmed" : `Trim a branch (${branches.length - n} left)`;
  });
  button("Storm", b => { wind = b.getAttribute("aria-pressed") === "true" ? 1 : 0; }, true);
  button("Start over", () => {
    branches.forEach(br => { if (br.fall) { br.g.add(br.arm); br.arm.position.set(0, 0, 0); br.arm.rotation.set(0, 0, -.9 + Math.random() * .3); br.arm.scale.setScalar(1); br.fall = false; } });
    n = 0; trim.textContent = "Trim a branch";
  });
  let t = 0, last = performance.now();
  update = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    const s = (Math.sin(t * (wind ? 2.6 : 1)) * (wind ? .05 : .012));
    tree.rotation.z = s; tree.rotation.x = s * .4;
    branches.forEach(br => {
      if (!br.fall) return;
      br.v.y -= 9.8 * dt; br.arm.position.addScaledVector(br.v, dt);
      br.arm.rotation.x += br.w.x * dt; br.arm.rotation.z += br.w.z * dt;
      if (br.arm.position.y < .25) { br.arm.position.y = .25; br.v.set(0, 0, 0); br.w.set(0, 0, 0); br.arm.scale.multiplyScalar(.985); }
    });
  };
}

async function buildLawn() {
  const snow = VAR === "snow";
  const N = 512, cv = document.createElement("canvas"); cv.width = cv.height = N;
  const x = cv.getContext("2d");
  function resetCanvas() {
    x.fillStyle = snow ? "#f4f7fb" : "#6aa84f"; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 2200; i++) { x.fillStyle = snow ? `rgba(200,215,230,${Math.random() * .4})` : `rgba(${40 + Math.random() * 40},${110 + Math.random() * 60},40,.5)`; x.fillRect(Math.random() * N, Math.random() * N, 2, snow ? 2 : 5); }
  }
  resetCanvas();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  ground(snow ? "#e8eef4" : "#5f9a48");
  const lawn = mesh(new THREE.PlaneGeometry(12, 12), M("#fff", {map: tex, roughness: 1}), 0, .01, 0); lawn.rotation.x = -Math.PI / 2;
  const h = house(scene, 6, 5, 3.2, "#F3EDE2", "#4b5563"); h.g.position.set(0, 0, -9);
  const sgn = faces[faces.push(mesh(new THREE.PlaneGeometry(1.6, .45), new THREE.MeshBasicMaterial({map: await signTexture(D.short, D.town + ", IL"), side: THREE.DoubleSide}), 5.4, 1.1, 6.3)) - 1]; sgn.scale.set(1.5, 1.5, 1);
  mesh(new THREE.BoxGeometry(.05, 1, .05), M("#555"), 4.8, .5, 6.3); mesh(new THREE.BoxGeometry(.05, 1, .05), M("#555"), 6, .5, 6.3);
  // the machine
  const mower = new THREE.Group(); scene.add(mower);
  const body = M("#" + (snow ? ACC2 : ACC).getHexString(), {roughness: .4, metalness: .2});
  if (snow) {
    mesh(box(1.6, .9, 1.1, .12), body, 0, .65, 0, mower); mesh(box(.9, .6, 1, .1), M("#1d2633", {roughness: .2}), -.2, 1.35, 0, mower);
    const blade = mesh(box(.12, .5, 1.8, .04), M("#d8dde3", {metalness: .7}), 1.05, .3, 0, mower); blade.rotation.y = .2;
  } else {
    mesh(box(1.1, .35, .9, .1), body, 0, .32, 0, mower);
    mesh(box(.5, .3, .5, .08), M("#222"), -.1, .62, 0, mower);
    const hb = mesh(new THREE.CylinderGeometry(.03, .03, 1.2), M("#222"), -.85, .8, 0, mower); hb.rotation.z = 1;
  }
  const wg = new THREE.CylinderGeometry(.16, .16, .1, 14); wg.rotateX(Math.PI / 2);
  [[-.4, .45], [.4, .45], [-.4, -.45], [.4, -.45]].forEach(([a, b]) => mesh(wg, M("#111"), a, .16, b, mower));
  lamp(0, 3, -5.8, "#ffcf8a", 30);
  cam.position.set(9, 7, 11); target.set(0, .5, -1);
  // path: back-and-forth stripes across the 12x12 lawn
  const lanes = 8, path = [];
  for (let i = 0; i < lanes; i++) { const z = -5.25 + i * 1.5; path.push([i % 2 ? 5.5 : -5.5, z], [i % 2 ? -5.5 : 5.5, z]); }
  let seg = 0, k = 0, going = false;
  mower.position.set(-5.5, 0, -5.25);
  const go = button(snow ? "Plow the drive" : "Mow the yard", b => { going = !going; b.textContent = going ? "Pause" : (snow ? "Keep plowing" : "Keep mowing"); b.classList.toggle("hot", going); });
  button("Start over", () => { seg = 0; k = 0; going = false; resetCanvas(); tex.needsUpdate = true; mower.position.set(-5.5, 0, -5.25); go.textContent = snow ? "Plow the drive" : "Mow the yard"; go.classList.remove("hot"); });
  let last = performance.now();
  update = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!going || seg >= path.length - 1) { if (seg >= path.length - 1 && going) { going = false; go.textContent = snow ? "All clear" : "All mowed"; go.classList.remove("hot"); } return; }
    const [ax, az] = path[seg], [bx, bz] = path[seg + 1];
    const len = Math.hypot(bx - ax, bz - az); k += dt * 3.2 / len;
    if (k >= 1) { k = 0; seg++; return; }
    const px = lerp(ax, bx, k), pz = lerp(az, bz, k);
    mower.position.set(px, 0, pz); mower.rotation.y = Math.atan2(-(bz - az), bx - ax);
    const u = (px + 6) / 12 * N, v = (pz + 6) / 12 * N, lane = Math.round((pz + 5.25) / 1.5);
    x.fillStyle = snow ? "#3b4048" : (lane % 2 ? "#5d9a3f" : "#8cc965");
    x.fillRect(u - 10, v - N / 16, 20, N / 8); tex.needsUpdate = true;
  };
}

async function buildPainting() {
  ground("#7FB069");
  const h = house(scene, 7, 5.5, 3.4, "#E9E4DA", "#3f4650");
  mesh(box(7.6, .3, .6, .05), M("#bbb"), 0, .15, 3.1);
  const sgn = faces[faces.push(mesh(new THREE.PlaneGeometry(1.7, .45), new THREE.MeshBasicMaterial({map: await signTexture(D.short, "Painting · " + D.town), side: THREE.DoubleSide}), 3.6, 1.05, 5.2)) - 1]; sgn.scale.set(1.5, 1.5, 1);
  mesh(new THREE.BoxGeometry(.05, 1, .05), M("#555"), 3, .5, 5.2); mesh(new THREE.BoxGeometry(.05, 1, .05), M("#555"), 4.2, .5, 5.2);
  // ladder
  const lad = new THREE.Group(); lad.position.set(-2.6, 0, 3); lad.rotation.x = -.18; scene.add(lad);
  [-.3, .3].forEach(xx => mesh(box(.08, 3.4, .08, .02), M("#c9b27c"), xx, 1.7, 0, lad));
  for (let i = 0; i < 7; i++) mesh(box(.6, .05, .06, .02), M("#c9b27c"), 0, .35 + i * .45, 0, lad);
  lamp(0, 2.3, 3.6, "#ffcf8a", 25);
  cam.position.set(7, 4, 11); target.set(0, 1.8, 0);
  const C = [["Harbor Blue", "#6E8FAE"], ["Sage", "#9FB08C"], ["Clay", "#C9876A"], ["Charcoal", "#4A4E57"], ["Butter", "#F1D98E"]];
  const cur = new THREE.Color();
  C.forEach(([name, hex]) => {
    const b = button(name, () => {
      const from = h.walls.material.color.clone(), to = new THREE.Color(hex);
      tween(0, 1, 1200, v => { cur.copy(from).lerp(to, v); h.walls.material.color.copy(cur); });
      ui.querySelectorAll("button").forEach(x => x.classList.toggle("hot", x === b));
    });
    b.style.boxShadow = `inset 0 -4px 0 ${hex}`;
  });
  update = () => {};
}

async function buildCleaning() {
  scene.background = new THREE.Color("#f3ede6"); scene.fog = null;
  const floor = mesh(new THREE.BoxGeometry(12, .2, 10), M("#c9a97e", {roughness: .5}), 0, -.1, 0);
  mesh(box(12, 5, .3), M("#eef3f2"), 0, 2.5, -5);
  mesh(box(.3, 5, 10), M("#e4ecea"), -6, 2.5, 0);
  const art = mesh(new THREE.PlaneGeometry(3, .75), new THREE.MeshBasicMaterial({map: await signTexture(D.short, "Clean, every room")}), 1.5, 3.4, -4.84);
  const sofa = M("#5a7d8a", {roughness: .9});
  mesh(box(3.6, .6, 1.3, .15), sofa, 1.5, .5, -3.6); mesh(box(3.6, 1, .35, .15), sofa, 1.5, 1.1, -4.15);
  mesh(box(1.8, .1, 1, .04), M("#3b2f28"), 1.5, .55, -1.6); [-.7, .7].forEach(xx => mesh(box(.08, .5, .08, .02), M("#3b2f28"), 1.5 + xx, .27, -1.6));
  mesh(new THREE.CylinderGeometry(.35, .3, .7, 16), M("#e8e0d5"), -4.8, .35, -4.2);
  mesh(new THREE.IcosahedronGeometry(.6, 1), M("#4C8C45"), -4.8, 1.1, -4.2);
  const rug = mesh(new THREE.PlaneGeometry(5, 3.4), M("#" + ACC.getHexString(), {roughness: 1}), 1.5, .01, -1.6); rug.rotation.x = -Math.PI / 2;
  // dust and crumbs
  const n = 600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = -5.5 + Math.random() * 11; pos[i * 3 + 1] = .03 + Math.random() * .05; pos[i * 3 + 2] = -4.5 + Math.random() * 9; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({color: "#6b5a48", size: .07})); scene.add(dust);
  const home = pos.slice();
  const bot = new THREE.Group(); scene.add(bot);
  mesh(new THREE.CylinderGeometry(.5, .5, .18, 28), M("#f4f6f8", {roughness: .3}), 0, .12, 0, bot);
  mesh(new THREE.CylinderGeometry(.18, .18, .04, 16), M("#" + ACC.getHexString(), {emissive: "#" + ACC.getHexString(), emissiveIntensity: .5}), 0, .23, 0, bot);
  bot.position.set(-5, 0, 4);
  const spark = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({color: "#ffffff", size: .18, transparent: true}));
  scene.add(spark);
  lamp(-2, 4, 0, "#ffe2b0", 30);
  cam.position.set(6.5, 6.5, 9); target.set(0, .8, -1);
  let going = false, t = 0, cleaned = 0;
  const go = button("Clean it", b => { going = !going; b.textContent = going ? "Pause" : "Keep cleaning"; b.classList.toggle("hot", going); });
  button("Mess it up", () => { pos.set(home); pg.attributes.position.needsUpdate = true; cleaned = 0; t = 0; go.textContent = "Clean it"; });
  let last = performance.now();
  const sp = [];
  update = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (going) {
      t += dt * .35;
      const lane = Math.floor(t) , f = t - lane, z = 4 - lane * 1.1; const xx = lane % 2 ? lerp(5, -5, f) : lerp(-5, 5, f);
      if (z < -4.6) { going = false; go.textContent = "Spotless"; go.classList.remove("hot"); }
      bot.position.set(xx, 0, z);
      for (let i = 0; i < n; i++) { const dx = pos[i * 3] - xx, dz = pos[i * 3 + 2] - z; if (pos[i * 3 + 1] > 0 && dx * dx + dz * dz < .55) { pos[i * 3 + 1] = -5; cleaned++; if (sp.length < 60) sp.push([pos[i * 3], .3, pos[i * 3 + 2], 1]); } }
      pg.attributes.position.needsUpdate = true;
    }
    for (const s of sp) { s[1] += dt * .8; s[3] -= dt * 1.2; }
    while (sp.length && sp[0][3] <= 0) sp.shift();
    const a = new Float32Array(sp.length * 3); sp.forEach((s, i) => { a[i * 3] = s[0]; a[i * 3 + 1] = s[1]; a[i * 3 + 2] = s[2]; });
    spark.geometry.setAttribute("position", new THREE.BufferAttribute(a, 3));
  };
}

async function buildSweets() {
  const cone = VAR === "icecream";
  scene.background = new THREE.Color("#fff1ea"); scene.fog = null;
  mesh(new THREE.CylinderGeometry(3.2, 3.2, .3, 48), M("#f6e7dc", {roughness: .4}), 0, .15, 0);
  mesh(box(16, 8, .3), M("#ffe3ec"), 0, 4, -4);
  mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({map: await signTexture(D.short, D.town + ", IL")}), 0, 5.6, -3.84);
  const stack = new THREE.Group(); stack.position.y = .3; scene.add(stack);
  const cols = ["#FF7AA2", "#FFD39A", "#8C5A3C", "#BFE3C0", "#F7F2E8", "#C9A0DC"];
  let items = [], top = 0;
  if (cone) {
    const cg = new THREE.ConeGeometry(.75, 2.6, 24, 1, true); cg.rotateX(Math.PI);
    mesh(cg, M("#E3A857", {roughness: .8, side: THREE.DoubleSide}), 0, 1.3, 0, stack); top = 2.6;
  }
  const flavors = ["Strawberry", "Vanilla", "Chocolate", "Mint", "Coconut", "Berry"];
  function add() {
    if (items.length >= 5) return;
    const i = items.length, c = cols[i % cols.length];
    let m;
    if (cone) { m = mesh(new THREE.SphereGeometry(.85 - i * .04, 28, 20), M(c, {roughness: .85}), 0, 0, 0, stack); m.scale.y = .9; const y = top + .55 + i * 1.15; m.userData.y = y; m.position.y = y + 4; }
    else { const r = 2.2 - i * .35, hh = .8; m = mesh(new THREE.CylinderGeometry(r, r, hh, 48), M(c, {roughness: .6}), 0, 0, 0, stack);
      const drip = mesh(new THREE.TorusGeometry(r, .09, 8, 48), M("#fff", {roughness: .4}), 0, hh / 2, 0, m); drip.rotation.x = Math.PI / 2;
      const y = hh / 2 + i * hh; m.userData.y = y; m.position.y = y + 4; }
    items.push(m);
    tween(m.userData.y + 4, m.userData.y, 700, v => { m.position.y = v; }, t => { const s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; });
    addB.textContent = items.length >= 5 ? "That's plenty" : (cone ? `Add a scoop (${flavors[items.length]})` : "Add a layer");
  }
  const addB = button(cone ? "Add a scoop (Strawberry)" : "Add a layer", add);
  button("Start over", () => { items.forEach(m => stack.remove(m)); items = []; addB.textContent = cone ? "Add a scoop (Strawberry)" : "Add a layer"; });
  add(); if (!cone) add();
  lamp(0, 5, 3, "#ffd8b0", 30);
  cam.position.set(5, 5, 9); target.set(0, 2.4, 0);
  update = (now) => { stack.rotation.y = reduce ? 0 : now * .0003; };
}

// ---------------------------------------------------------------- run
const builders = {auto: buildAuto, tree: buildTree, lawn: buildLawn, painting: buildPainting, cleaning: buildCleaning, sweets: buildSweets};
await (builders[G] || buildAuto)();

faces.forEach(m => m.lookAt(cam.position.x, m.position.y, cam.position.z));
const controls = new OrbitControls(cam, canvas);
controls.target.copy(target); controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
controls.minPolarAngle = .35; controls.maxPolarAngle = 1.42;
controls.autoRotate = !reduce; controls.autoRotateSpeed = .5;
controls.minAzimuthAngle = -1.1; controls.maxAzimuthAngle = 1.1;
if (coarse) { controls.enabled = false; canvas.style.touchAction = "pan-y"; hint("Tap the buttons below"); }
else hint("Drag to look around");
canvas.addEventListener("pointerdown", () => { controls.autoRotate = false; hint(""); });
let dir = 1;

const dayBg = scene.background.clone(), nightBg = new THREE.Color("#0b1020");
const hemiDay = hemi.intensity, sunDay = sun.intensity;
let night = 0;
document.getElementById("scNight").addEventListener("click", e => {
  const b = e.currentTarget, to = night ? 0 : 1; b.setAttribute("aria-pressed", String(!!to)); b.textContent = to ? "Day" : "Night";
  tween(night, to, 1200, v => {
    night = v; scene.background.copy(dayBg).lerp(nightBg, v); if (scene.fog) scene.fog.color.copy(scene.background);
    hemi.intensity = lerp(hemiDay, .18, v); sun.intensity = lerp(sunDay, .15, v);
    nightLights.forEach(([l, p]) => { l.intensity = p * v; });
    R.toneMappingExposure = lerp(1, 1.15, v);
  });
});

const off0 = cam.position.clone().sub(target);
function size() {
  const w = host.clientWidth, h = host.clientHeight, a = w / h; R.setSize(w, h, false); cam.aspect = a; cam.fov = 40;
  const k = a < .8 ? 1.75 : a < 1.2 ? 1.3 : 1; cam.position.copy(target).addScaledVector(off0, k); frame.b = undefined;
  cam.updateProjectionMatrix(); cam.lookAt(target);
}
size(); addEventListener("resize", size);
let visible = true;
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
function frame(now) {
  requestAnimationFrame(frame);
  if (!visible) return;
  for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = Math.min(1, (now - w.t0) / w.ms); w.set(lerp(w.from, w.to, w.ease(k))); if (k >= 1) tweens.splice(i, 1); }
  update(now);
  if (coarse && !reduce) { // gentle sway instead of drag on phones, so the page still scrolls
    const a = Math.sin(now * .00025) * .5; const r = cam.position.clone().sub(target); const len = Math.hypot(r.x, r.z);
    const base = Math.atan2(r.x, r.z); cam.position.x = target.x + Math.sin(a + (frame.b ??= base)) * len; cam.position.z = target.z + Math.cos(a + frame.b) * len; cam.lookAt(target);
  } else controls.update();
  R.render(scene, cam);
}
requestAnimationFrame(frame);
