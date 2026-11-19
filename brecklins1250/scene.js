// Brecklin's Servicenter: real-time 3D station for the Immersive sample site.
// Everything is modeled in code for this page (no stock models or photos).
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {EXRLoader} from "three/addons/loaders/EXRLoader.js";

const host = document.querySelector(".scene");
const canvas = document.getElementById("c");
await Promise.race([
  Promise.all(["900", "800"].map(w => document.fonts.load(w + ' 100px "Big Shoulders Display"', "BRECKLIN'S OPEN EVERY DAY SERVICE BAYS COUNTER AND FUEL FULL"))),
  new Promise(r => setTimeout(r, 2500))
]).catch(() => {});
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const small = innerWidth < 760 || coarse;

let R;
try { R = new THREE.WebGLRenderer({canvas, antialias: !small, powerPreference: "high-performance"}); }
catch (e) { host.classList.add("noGL"); throw e; }
R.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.6));
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 1.0;
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(R);
scene.environment = pmrem.fromScene(new RoomEnvironment(R), 0.04).texture;
const envMats = [];

const cam = new THREE.PerspectiveCamera(small ? 50 : 38, 1, 0.1, 400);
const HOME = small ? new THREE.Vector3(9, 13, 23) : new THREE.Vector3(21, 9, 30);
cam.position.copy(HOME);
const target = small ? new THREE.Vector3(3, 0.5, -3) : new THREE.Vector3(-5, 2, -4);

const controls = new OrbitControls(cam, canvas);
controls.target.copy(target);
controls.enablePan = false;
controls.enableZoom = false;
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minPolarAngle = 0.6;
controls.maxPolarAngle = 1.42;
controls.minAzimuthAngle = -0.6;
controls.maxAzimuthAngle = 1.5;
controls.rotateSpeed = 0.55;
if (coarse) controls.enabled = false; // one finger scrolls the page on phones; the buttons drive the scene

/* ---------- materials ---------- */
const M = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: 0.75, metalness: 0, ...o});
const mat = {
  asphalt: M(0x23272e, {roughness: 0.95}),
  concrete: M(0x8d9096, {roughness: 0.9}),
  curb: M(0xb9bcc1, {roughness: 0.85}),
  paint: M(0xf2f2ee, {roughness: 0.6}),
  yellow: M(0xf2b33d, {roughness: 0.6}),
  red: M(0xd23a2e, {roughness: 0.45}),
  white: M(0xf1f3f6, {roughness: 0.5}),
  navy: M(0x10213f, {roughness: 0.55}),
  steel: M(0x9aa3ad, {roughness: 0.35, metalness: 0.7}),
  dark: M(0x15181d, {roughness: 0.6}),
  block: M(0xd9d4c7, {roughness: 0.92}),
  trim: M(0x10213f, {roughness: 0.5}),
  bayIn: new THREE.MeshStandardMaterial({color: 0xc9ccd1, roughness: 0.8, side: THREE.BackSide}),
  glow: new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff3dc, emissiveIntensity: 2.4}),
  store: new THREE.MeshStandardMaterial({color: 0x1a1a1a, emissive: 0xffc985, emissiveIntensity: 1.25, roughness: 0.2}),
  screen: new THREE.MeshStandardMaterial({color: 0x0b1020, emissive: 0x7fd6ff, emissiveIntensity: 1.4}),
  rubber: M(0x0d0e10, {roughness: 0.9}),
  glass: new THREE.MeshPhysicalMaterial({color: 0x0b1220, roughness: 0.08, metalness: 0.1, clearcoat: 1}),
  paintCar: new THREE.MeshPhysicalMaterial({color: 0x2a5aa8, roughness: 0.28, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08}),
  head: new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 3}),
  tail: new THREE.MeshStandardMaterial({color: 0x400000, emissive: 0xff2a1a, emissiveIntensity: 2.2})
};

/* ---------- surface textures, painted in code: aggregate, slab joints, oil, damp patches ---------- */
function rng(seed) { seed = seed % 2147483647 || 1; return () => (seed = seed * 16807 % 2147483647, (seed - 1) / 2147483646); }
function canvasTex(w, h, draw, {rep = [1, 1], srgb = true} = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy()); return t;
}
function grain(x, w, h, r, n, cols, size) { for (let i = 0; i < n; i++) { x.fillStyle = cols[(r() * cols.length) | 0]; const q = size * (0.4 + r()); x.fillRect(r() * w, r() * h, q, q); } }
function blot(x, r, w, h, n, col, min, max, at) {
  for (let i = 0; i < n; i++) {
    const cx = at ? at[0] + (r() - 0.5) * at[2] : r() * w, cy = at ? at[1] + (r() - 0.5) * at[2] : r() * h, rad = min + r() * (max - min);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rad, rad * (0.55 + r() * 0.45), r() * 3, 0, 7); x.fill();
  }
}
const asR = rng(7), asR2 = rng(11);
const asphaltMap = canvasTex(512, 512, (x, w, h) => {
  x.fillStyle = "#2b2f36"; x.fillRect(0, 0, w, h);
  blot(x, asR, w, h, 10, "rgba(8,10,14,.16)", 70, 220);
  grain(x, w, h, asR, small ? 14000 : 26000, ["#3b4048", "#1b1e23", "#474c55", "#24272d"], 1.6);
}, {rep: [30, 30]});
const asphaltRough = canvasTex(512, 512, (x, w, h) => {
  x.fillStyle = "#e8e8e8"; x.fillRect(0, 0, w, h);
  blot(x, asR2, w, h, 5, "rgba(60,60,60,.7)", 50, 160);
  grain(x, w, h, asR2, 8000, ["#ffffff", "#bcbcbc"], 1.5);
}, {rep: [30, 30], srgb: false});
Object.assign(mat.asphalt, {map: asphaltMap, roughnessMap: asphaltRough, roughness: 1}); mat.asphalt.color.set(0xffffff);
const streetMap = asphaltMap.clone(); streetMap.repeat.set(30, 0.9); streetMap.needsUpdate = true;
const streetRough = asphaltRough.clone(); streetRough.repeat.set(30, 0.9); streetRough.needsUpdate = true;
const streetMat = new THREE.MeshStandardMaterial({color: 0xa9adb5, map: streetMap, roughnessMap: streetRough, roughness: 1});
const apR = rng(3), apR2 = rng(5);
const PX = 64; // 64 px per metre on the 16 x 11 m apron
function apronDraw(rough) {
  return (x, w, h) => {
    x.fillStyle = rough ? "#e2e2e2" : "#9b9da1"; x.fillRect(0, 0, w, h);
    const r = rough ? apR2 : apR;
    if (!rough) { blot(x, r, w, h, 40, "rgba(255,255,255,.07)", 30, 130); blot(x, r, w, h, 30, "rgba(40,40,46,.10)", 20, 90); grain(x, w, h, r, small ? 16000 : 30000, ["#aaacb0", "#8b8d91", "#b6b8bb"], 1.4); }
    // where cars stop beside each island: oil drips and a damp patch that catches the canopy light
    [[w / 2, h / 2 - 0.6 * PX], [w / 2 - 5.2 * PX, h / 2], [w / 2 + 5.2 * PX, h / 2]].forEach(([cx, cy]) =>
      blot(x, r, w, h, 7, rough ? "rgba(70,70,70,.85)" : "rgba(28,26,24,.3)", 10, 40, [cx, cy, 2.2 * PX]));
    x.strokeStyle = rough ? "rgba(255,255,255,1)" : "rgba(58,58,62,.6)"; x.lineWidth = 3;
    for (let m = -6; m <= 6; m += 3) { x.beginPath(); x.moveTo(w / 2 + m * PX, 0); x.lineTo(w / 2 + m * PX, h); x.stroke(); }
    for (let m = -4.5; m <= 4.5; m += 3) { x.beginPath(); x.moveTo(0, h / 2 + m * PX); x.lineTo(w, h / 2 + m * PX); x.stroke(); }
  };
}
const apronMat = new THREE.MeshStandardMaterial({map: canvasTex(16 * PX, 11 * PX, apronDraw(false)), roughnessMap: canvasTex(16 * PX, 11 * PX, apronDraw(true), {srgb: false}), roughness: 0.95});

function box(w, h, d, m, x = 0, y = 0, z = 0, parent = scene, cast = true) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  g.position.set(x, y, z); g.castShadow = cast; g.receiveShadow = true; parent.add(g); return g;
}

/* ---------- text on canvas (signs) ---------- */
function signTex(lines, {w = 1024, h = 256, bg = "#d23a2e", fg = "#ffffff", font = "Big Shoulders Display", sizes = [150], weights = [900]} = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d");
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  const total = sizes.reduce((a, b) => a + b * 0.95, 0);
  let y = h / 2 - total / 2;
  lines.forEach((t, i) => {
    const s = sizes[i] || sizes[0];
    x.font = `${weights[i] || weights[0]} ${s}px "${font}", Impact, sans-serif`;
    y += s * 0.95 / 2; x.fillText(t, w / 2, y + s * 0.04); y += s * 0.95 / 2;
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function slatTex() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const x = c.getContext("2d"); x.fillStyle = "#e9ebee"; x.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 16; i++) { x.fillStyle = "#b8bdc4"; x.fillRect(0, i * 16 + 13, 64, 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.4); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- image-based light: Poly Haven HDRIs via @pmndrs/assets, RoomEnvironment until they load ---------- */
const envs = {};
let hdri = false;
Promise.all([["night", "night"], ["day", "park"]].map(async ([k, n]) => {
  try { const m = await import(`@pmndrs/assets/hdri/${n}.exr.js`); const t = await new EXRLoader().loadAsync(m.default); t.mapping = THREE.EquirectangularReflectionMapping; envs[k] = pmrem.fromEquirectangular(t).texture; t.dispose(); } catch (e) {}
})).then(() => { hdri = !!(envs.night && envs.day); if (hdri) applyLook(1); });

/* ---------- sky ---------- */
const skyU = {top: {value: new THREE.Color(0x061026)}, bot: {value: new THREE.Color(0x29467a)}, st: {value: 1}};
const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms: skyU,
  vertexShader: "varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader: "uniform vec3 top;uniform vec3 bot;uniform float st;varying vec3 v;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}void main(){float t=smoothstep(-.05,.55,v.y);vec3 c=mix(bot,top,t);c+=vec3(1.,.5,.22)*.22*st*exp(-abs(v.y-.03)*14.);vec3 q=floor(v*520.);float s=step(.9965,h(q))*smoothstep(.1,.45,v.y)*st*(.55+.45*h(q+1.));c+=vec3(s);gl_FragColor=vec4(c,1.);}"
}));
scene.add(sky);
scene.fog = new THREE.Fog(0x162a4f, 45, 120);

/* ---------- ground ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat.asphalt);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
box(16, 0.04, 11, apronMat, 0, 0.02, 0, scene, false); // apron under the canopy
box(240, 0.03, 7, streetMat, 0, 0.015, 13, scene, false); // Walnut Street
for (let x = -60; x < 60; x += 4) box(2, 0.035, 0.14, mat.yellow, x, 0.02, 13, scene, false);
box(240, 0.25, 0.4, mat.curb, 0, 0.12, 9.3, scene, false);
// the curb opens where cars pull in
const gap = box(9, 0.27, 0.42, mat.asphalt, 0, 0.13, 9.3, scene, false);
box(2.2, 0.04, 22, M(0x2a2e35, {roughness: 0.95}), 0, 0.01, 0, scene, false);
// parking stripes by the store
for (let i = 0; i < 4; i++) box(0.12, 0.04, 4.2, mat.paint, -10.5 + i * 2.8, 0.03, -6.6, scene, false);

/* ---------- canopy ---------- */
const canopy = new THREE.Group(); scene.add(canopy);
const CH = 4.8;
[[-5.5, -3], [5.5, -3], [-5.5, 3], [5.5, 3]].forEach(([x, z]) => {
  box(0.45, CH, 0.45, mat.white, x, CH / 2, z, canopy);
});
box(15, 0.5, 9.6, mat.white, 0, CH + 0.25, 0, canopy);
const fasciaTex = signTex(["BRECKLIN'S SERVICENTER"], {w: 2048, h: 160, sizes: [118]});
const fasciaMat = new THREE.MeshStandardMaterial({map: fasciaTex, emissive: 0xffffff, emissiveMap: fasciaTex, emissiveIntensity: 0.55, roughness: 0.5});
const fF = box(15.1, 1.0, 0.12, fasciaMat, 0, CH + 0.5, 4.86, canopy); fF.castShadow = false;
const fB = box(15.1, 1.0, 0.12, fasciaMat, 0, CH + 0.5, -4.86, canopy); fB.rotation.y = Math.PI; fB.castShadow = false;
box(0.12, 1.0, 9.7, mat.red, -7.56, CH + 0.5, 0, canopy); box(0.12, 1.0, 9.7, mat.red, 7.56, CH + 0.5, 0, canopy);
// light panels under the canopy
const panels = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
  const p = box(1.6, 0.05, 0.9, mat.glow, -4.5 + i * 4.5, CH - 0.03, -2 + j * 4, canopy, false); panels.push(p);
}
const canopyLight = new THREE.SpotLight(0xfff1dc, 260, 26, 1.1, 0.55, 1.6);
canopyLight.position.set(0, CH - 0.2, 0); canopyLight.target.position.set(0, 0, 0);
canopyLight.castShadow = true; canopyLight.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
canopyLight.shadow.bias = -0.0004; canopyLight.shadow.radius = 4;
scene.add(canopyLight, canopyLight.target);
const fill1 = new THREE.PointLight(0xfff1dc, 40, 14, 1.8); fill1.position.set(-4.5, CH - 0.5, 0); scene.add(fill1);
const fill2 = new THREE.PointLight(0xfff1dc, 40, 14, 1.8); fill2.position.set(4.5, CH - 0.5, 0); scene.add(fill2);

/* ---------- pump islands ---------- */
function island(x, full) {
  const g = new THREE.Group(); g.position.set(x, 0, 0); scene.add(g);
  box(1.3, 0.22, 5.2, mat.curb, 0, 0.11, 0, g);
  box(1.1, 0.06, 5.0, mat.yellow, 0, 0.25, 0, g, false);
  [-1.2, 1.2].forEach(z => {
    const pump = new THREE.Group(); pump.position.set(0, 0.25, z); g.add(pump);
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.9, 1.9, 0.62, 3, 0.08), mat.white);
    body.position.y = 0.95; body.castShadow = true; pump.add(body);
    box(0.92, 0.36, 0.64, mat.red, 0, 1.75, 0, pump);
    [-1, 1].forEach(s => { const sc = box(0.04, 0.34, 0.42, mat.screen, s * 0.46, 1.12, 0, pump, false); });
    box(0.06, 0.5, 0.08, mat.dark, 0.48 * (x < 0 ? 1 : -1), 0.85, 0.18, pump);
  });
  if (full) {
    const t = signTex(["FULL", "SERVICE"], {w: 512, h: 512, bg: "#10213f", sizes: [190, 150]});
    const sm = new THREE.MeshStandardMaterial({map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.45});
    box(0.08, 2.3, 0.08, mat.steel, 0, 1.4, 2.4, g);
    const s1 = box(0.06, 0.9, 0.9, sm, 0, 2.6, 2.4, g); s1.rotation.y = x < 0 ? 0 : Math.PI;
  }
  return g;
}
island(-2.6, true); island(2.6, false);
// the pump screen facing the car lane shows the gallons while the tank is filled by hand
const pumpCv = document.createElement("canvas"); pumpCv.width = 256; pumpCv.height = 200;
const pumpCx = pumpCv.getContext("2d");
const pumpTex = new THREE.CanvasTexture(pumpCv); pumpTex.colorSpace = THREE.SRGBColorSpace;
function drawPump(g, note) {
  pumpCx.fillStyle = "#06101f"; pumpCx.fillRect(0, 0, 256, 200);
  pumpCx.fillStyle = "#7fd6ff"; pumpCx.textAlign = "center";
  pumpCx.font = '700 26px "Barlow", sans-serif'; pumpCx.fillText(note, 128, 46);
  pumpCx.font = '800 88px "Big Shoulders Display", sans-serif'; pumpCx.fillText(g.toFixed(2), 128, 140);
  pumpCx.font = '600 22px "Barlow", sans-serif'; pumpCx.fillText("GALLONS", 128, 182);
  pumpTex.needsUpdate = true;
}
drawPump(0, "FULL SERVICE");
const pumpScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), new THREE.MeshStandardMaterial({map: pumpTex, emissive: 0xffffff, emissiveMap: pumpTex, emissiveIntensity: 0.9}));
pumpScreen.position.set(-2.6 + 0.475, 0.25 + 1.12, 1.2); pumpScreen.rotation.y = Math.PI / 2; scene.add(pumpScreen);

/* ---------- the building: store and two service bays ---------- */
const BX = 8; // the building sits to the right of the canopy so the bays stay in view
const bld = new THREE.Group(); bld.position.x = BX; scene.add(bld);
const BZ = -11, BH = 4.4;
box(12, BH, 6, mat.block, -5, BH / 2, BZ - 3, bld);                    // store block
box(11.6, 2.5, 0.08, mat.store, -5, 1.55, BZ + 0.02, bld, false);          // storefront glass
for (let i = 0; i < 5; i++) box(0.12, 2.6, 0.14, mat.trim, -10.6 + i * 2.8, 1.55, BZ + 0.06, bld);
box(12, 0.18, 0.2, mat.trim, -5, 2.88, BZ + 0.05, bld);
const storeTex = signTex(["COUNTER AND FUEL"], {w: 1024, h: 160, bg: "#10213f", sizes: [104], weights: [800]});
const ss = box(6.4, 1.0, 0.1, new THREE.MeshStandardMaterial({map: storeTex, emissive: 0xffffff, emissiveMap: storeTex, emissiveIntensity: 0.5}), -5, 3.65, BZ + 0.08, bld, false);
// bay facade: pillars and header, the doors sit in the openings
box(0.6, BH, 0.6, mat.block, 1.3, BH / 2, BZ - 0.3, bld);
box(0.7, BH, 0.6, mat.block, 5.75, BH / 2, BZ - 0.3, bld);
box(1.1, BH, 0.6, mat.block, 10.45, BH / 2, BZ - 0.3, bld);
box(10, 0.8, 0.6, mat.block, 6, BH - 0.4, BZ - 0.3, bld);
box(10, 0.16, 0.66, mat.red, 6, BH - 0.86, BZ - 0.28, bld);
const bayTex = signTex(["SERVICE BAYS"], {w: 1024, h: 160, bg: "#d23a2e", sizes: [108]});
box(5.4, 0.7, 0.08, new THREE.MeshStandardMaterial({map: bayTex, emissive: 0xffffff, emissiveMap: bayTex, emissiveIntensity: 0.5}), 6, BH - 0.38, BZ + 0.04, bld, false);
const bayRoom = new THREE.Mesh(new THREE.BoxGeometry(10, BH, 6.2), mat.bayIn);
bayRoom.position.set(6, BH / 2, BZ - 3.4); bayRoom.receiveShadow = true; bld.add(bayRoom);
box(22.4, 0.35, 6.9, mat.trim, 0.2, BH + 0.17, BZ - 3.1, bld);       // roof edge
const bayLamp = new THREE.PointLight(0xfff4e2, 0, 12, 1.6); bayLamp.position.set(BX + 3.5, BH - 0.8, BZ - 3); scene.add(bayLamp);
for (let i = 0; i < 2; i++) box(2.4, 0.06, 0.4, mat.glow, 3.5 + i * 4.5, BH - 0.62, BZ - 3, bld, false);
// lift in bay one
const liftArms = new THREE.Group(); bld.add(liftArms);
box(0.35, 3.0, 0.35, M(0x2c5fb8, {roughness: 0.5}), 3.5 - 1.55, 1.5, BZ - 3.4, bld);
box(0.35, 3.0, 0.35, M(0x2c5fb8, {roughness: 0.5}), 3.5 + 1.55, 1.5, BZ - 3.4, bld);
[-1, 1].forEach(s => box(1.0, 0.1, 0.25, mat.steel, 3.5 + s * 1.1, 0.12, BZ - 3.4, liftArms));
// roll-up doors: pivot at the top so they roll up into the header
const slats = slatTex();
const doorMat = new THREE.MeshStandardMaterial({color: 0xffffff, map: slats, roughness: 0.6, metalness: 0.15});
function door(x) {
  const g = new THREE.BoxGeometry(3.8, 3.6, 0.1); g.translate(0, -1.8, 0);
  const d = new THREE.Mesh(g, doorMat); d.position.set(x, 3.6, BZ - 0.1); d.castShadow = true; d.receiveShadow = true; bld.add(d); return d;
}
const door1 = door(3.5), door2 = door(8);
box(3.6, 1.6, 0.06, mat.store, 8, 2.4, BZ - 0.04, bld, false).visible = false; // reserved for a window if the shop wants one

/* ---------- trees and a neighbour ---------- */
const leafMats = [0x1f3b2c, 0x27482f, 0x2f5636, 0x1a3125].map(c => M(c, {roughness: 0.9, flatShading: true}));
const barkMat = M(0x3b2a1e, {roughness: 0.95});
function lump(rad, seed) {
  const g = new THREE.IcosahedronGeometry(rad, 2), p = g.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const X = p.getX(k), Y = p.getY(k), Z = p.getZ(k), n = Math.sin(X * 12.99 + Y * 78.23 + Z * 37.72 + seed) * 43758.55, f = 0.82 + 0.32 * (n - Math.floor(n));
    p.setXYZ(k, X * f, Y * f * 0.86, Z * f);
  }
  g.computeVertexNormals(); return g;
}
function tree(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  const r = rng(Math.abs(Math.round(x * 31 + z * 17)) + 3);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 2.8, 7), barkMat); trunk.position.y = 1.4; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(lump(0.85 + r() * 0.75, i * 9.1 + x), leafMats[i % 4]);
    m.position.set((r() - 0.5) * 1.9, 2.9 + r() * 1.7, (r() - 0.5) * 1.9); m.rotation.y = r() * 6; m.castShadow = true; g.add(m);
  }
}
tree(-16, -6, 1.1); tree(-14, -12, 1.3); tree(-19, 4, 0.9); tree(29, 2, 1); tree(-24, -14, 1.4); tree(25, -9, 1.2);
box(9, 5.5, 7, M(0x7d4b3c, {roughness: 0.95}), -24, 2.75, -20); box(10, 4, 7, M(0x8a8f96, {roughness: 0.95}), 31, 2, -21);
// street lamps along Walnut
[-18, 18].forEach(x => {
  box(0.18, 6, 0.18, mat.steel, x, 3, 10.2);
  box(1.4, 0.12, 0.3, mat.steel, x + (x < 0 ? 0.6 : -0.6), 6, 10.2);
  box(0.5, 0.08, 0.3, mat.glow, x + (x < 0 ? 1.1 : -1.1), 5.94, 10.2, scene, false);
});

/* ---------- the attendant who comes out to pump the gas ---------- */
const att = new THREE.Group(); scene.add(att);
const shirt = M(0x10213f, {roughness: 0.8}), skin = M(0xd9a27e, {roughness: 0.7});
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.5, 4, 10), shirt); torso.position.y = 1.12; torso.castShadow = true; att.add(torso);
const headM = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), skin); headM.position.y = 1.62; headM.castShadow = true; att.add(headM);
const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 16), mat.red); capM.position.y = 1.73; att.add(capM);
const brim = box(0.16, 0.02, 0.14, mat.red, 0, 1.71, 0.13, att, false);
const legs = [-0.09, 0.09].map(x => { const g = new THREE.BoxGeometry(0.13, 0.72, 0.15); g.translate(0, -0.36, 0); const l = new THREE.Mesh(g, M(0x2b2f36)); l.position.set(x, 0.8, 0); l.castShadow = true; att.add(l); return l; });
const arms = [-0.27, 0.27].map(x => { const g = new THREE.BoxGeometry(0.1, 0.55, 0.12); g.translate(0, -0.27, 0); const a = new THREE.Mesh(g, shirt); a.position.set(x, 1.4, 0); att.add(a); return a; });
const ATT_PATH = new THREE.CatmullRomCurve3([V3(BX - 5, BZ + 0.7), V3(BX - 5.5, -7.5), V3(-1.2, -5), V3(-1.48, -2.2), V3(-1.48, 2.1)]);
function V3(x, z) { return new THREE.Vector3(x, 0, z); }
let attWalk = null, attIdle = 0;
function placeAtt(u, back) {
  const p = ATT_PATH.getPointAt(u), tn = ATT_PATH.getTangentAt(u);
  att.position.copy(p); const lk = p.clone().add(back ? tn.negate() : tn); att.lookAt(lk);
}
placeAtt(0, false); att.visible = false;
function walkAtt(out, dur, done) { att.visible = true; attWalk = {out, t: 0, dur: reduce ? 0.01 : dur, done}; }

/* ---------- the car ---------- */
const car = new THREE.Group(); scene.add(car);
const carBody = new THREE.Group(); car.add(carBody);
const lower = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.72, 4.3, 4, 0.2), mat.paintCar); lower.position.y = 0.66; lower.castShadow = true; carBody.add(lower);
const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.66, 0.62, 2.2, 4, 0.22), mat.paintCar); cabin.position.set(0, 1.25, -0.25); cabin.castShadow = true; carBody.add(cabin);
const glassM = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.46, 2.0, 3, 0.16), mat.glass); glassM.position.set(0, 1.27, -0.25); carBody.add(glassM);
box(1.92, 0.1, 4.32, mat.dark, 0, 0.36, 0, carBody);
[-0.62, 0.62].forEach(x => { box(0.42, 0.14, 0.06, mat.head, x, 0.78, 2.16, carBody, false); box(0.42, 0.12, 0.06, mat.tail, x, 0.8, -2.16, carBody, false); });
const wheels = [];
[[-0.92, 1.35], [0.92, 1.35], [-0.92, -1.35], [0.92, -1.35]].forEach(([x, z]) => {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.28, 20), mat.rubber);
  w.rotation.z = Math.PI / 2; w.position.set(x, 0.37, z); w.castShadow = true; car.add(w); wheels.push(w);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12), mat.steel); hub.rotation.z = Math.PI / 2; hub.position.copy(w.position); car.add(hub);
});
const beam = new THREE.SpotLight(0xfff3dd, 0, 22, 0.5, 0.6, 1.4); beam.position.set(0, 0.8, 2.2); car.add(beam);
const beamT = new THREE.Object3D(); beamT.position.set(0, 0, 10); car.add(beamT); beam.target = beamT;

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0x8fb0e8, 0x1a1d22, 0.35); scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9db7ff, 0.35); moon.position.set(-20, 30, 10); scene.add(moon);
const storeGlow = new THREE.PointLight(0xffc985, 30, 12, 1.8); storeGlow.position.set(BX - 5, 2, BZ + 2); scene.add(storeGlow);

/* ---------- day and night ---------- */
const LOOK = {
  night: {top: 0x061026, bot: 0x29467a, fog: 0x162a4f, hemi: 0.5, moon: 0.3, moonC: 0x9db7ff, exp: 1.0, glow: 1, env: 0.12},
  day: {top: 0x2f6fd0, bot: 0xd6e8f8, fog: 0xc6dbf0, hemi: 1.5, moon: 3.4, moonC: 0xfff1d8, exp: 1.0, glow: 0.2, env: 0.7}
};
let mode = "night", modeT = 1, from = LOOK.night, to = LOOK.night;
function setMode(m) { if (m === mode) return; from = curLook(); to = LOOK[m]; mode = m; modeT = 0; }
let cur = {...LOOK.night};
function curLook() { return {...cur}; }
const cA = new THREE.Color(), cB = new THREE.Color();
function lerpC(a, b, t) { return cA.set(a).lerp(cB.set(b), t).getHex(); }
function applyLook(t) {
  const k = {}; for (const key in to) k[key] = typeof to[key] === "number" && key.match(/top|bot|fog|moonC/) ? lerpC(from[key], to[key], t) : from[key] + (to[key] - from[key]) * t;
  cur = k;
  skyU.top.value.set(k.top); skyU.bot.value.set(k.bot); scene.fog.color.set(k.fog);
  hemi.intensity = k.hemi; moon.intensity = k.moon; moon.color.set(k.moonC);
  R.toneMappingExposure = k.exp;
  const g = k.glow;
  skyU.st.value = Math.max(0, (g - 0.2) / 0.8);
  canopyLight.intensity = 70 * g; fill1.intensity = fill2.intensity = 10 * g; storeGlow.intensity = 8 * g;
  mat.glow.emissiveIntensity = 0.5 + 1.5 * g; mat.store.emissiveIntensity = 0.25 + 0.6 * g;
  fasciaMat.emissiveIntensity = 0.15 + 0.5 * g;
  mat.head.emissiveIntensity = 0.6 + 2.4 * g;
  beam.intensity = (carMoving || carState === "road") ? 40 * g : 10 * g;
  if (hdri) scene.environment = envs[mode];
  envMats.forEach(m => { m.envMapIntensity = hdri ? (mode === "night" ? 1.4 : 1.25) * (k.env > 0.4 ? 1 : 0.8) : k.env; });
  if (bloom) bloom.strength = 0.15 + 0.3 * g;
}
moon.position.set(-20, 30, 10);
moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
Object.assign(moon.shadow.camera, {left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 80});

/* ---------- driving ---------- */
const V = (x, z) => new THREE.Vector3(x, 0, z);
const PATHS = {
  arrive: new THREE.CatmullRomCurve3([V(-40, 12), V(-18, 12), V(-6, 12), V(0, 9.5), V(0, 5), V(0, 0.6)]),
  bay: new THREE.CatmullRomCurve3([V(0, 0.6), V(0, -3.6), V(3, -6.6), V(9.5, -7.6), V(11.5, -9.6), V(11.5, -14.4)])
};
let carState = "road", carMoving = false, drive = null, liftY = 0, liftTarget = 0;
function placeOn(curve, t, backwards) {
  const p = curve.getPointAt(t), tan = curve.getTangentAt(t);
  car.position.set(p.x, liftY, p.z);
  const look = p.clone().add(backwards ? tan.clone().negate() : tan);
  look.y = liftY; car.lookAt(look);
}
placeOn(PATHS.arrive, 0, false);
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function go(curve, dur, reverse, done) {
  carMoving = true; drive = {curve, dur: reduce ? 0.01 : dur, t: 0, reverse, done};
}
const doorOpen = {d1: 0, target: 0};
const ui = {
  status: document.querySelector("[data-scene-status]"),
  pump: document.querySelector("[data-act=pump]"),
  bay: document.querySelector("[data-act=bay]"),
  light: document.querySelector("[data-act=light]")
};
function say(t) { if (ui.status) ui.status.textContent = t; }
function busy(b) { lastDrag = -99; [ui.pump, ui.bay].forEach(x => x && (x.disabled = b)); }
let fueling = null;
function fillUp() {
  busy(true); say("Here comes the attendant…");
  walkAtt(true, 3.2, () => {
    att.lookAt(car.position.x, 0, att.position.z); say("Filling it up by hand. You stay in the car.");
    fueling = {t: 0, gal: 9 + Math.round(Math.random() * 60) / 10, done: () => {
      say("Filled up. That's full service at Brecklin's."); busy(false); walkAtt(false, 3.2, () => { att.visible = false; });
    }};
  });
}
function toPump() {
  if (carMoving) return;
  if (carState === "pump") { fillUp(); return; }
  busy(true);
  if (carState === "road") { say("Pulling in off Walnut Street…"); go(PATHS.arrive, 4.2, false, () => { carState = "pump"; fillUp(); }); }
  else if (carState === "bay") {
    liftTarget = 0; say("Lowering the lift…");
    waitLift(() => { say("Backing out of the bay…"); go(PATHS.bay, 3.6, true, () => { carState = "pump"; doorOpen.target = 0; say("Back at the pump and ready to go."); busy(false); }); });
  }
}
function toBay() {
  if (carMoving) return;
  if (carState === "bay") { liftTarget = liftTarget ? 0 : 1.15; say(liftTarget ? "Up on the lift for a look underneath." : "Lift down."); return; }
  busy(true);
  const into = () => { doorOpen.target = 1; say("Bay door going up…"); setTimeout(() => { say("Into the bay…"); go(PATHS.bay, 3.8, false, () => { carState = "bay"; liftTarget = 1.15; say("In the bay and up on the lift. Tap again to lower it."); busy(false); }); }, reduce ? 10 : 1100); };
  if (carState === "road") { say("Pulling in off Walnut Street…"); go(PATHS.arrive, 3.6, false, () => { carState = "pump"; into(); }); }
  else into();
}
let liftWait = null;
function waitLift(cb) { liftWait = cb; }
ui.pump && ui.pump.addEventListener("click", toPump);
ui.bay && ui.bay.addEventListener("click", toBay);
ui.light && ui.light.addEventListener("click", () => {
  setMode(mode === "night" ? "day" : "night");
  ui.light.setAttribute("aria-pressed", String(mode === "day"));
  ui.light.querySelector("span").textContent = mode === "day" ? "Night" : "Day";
  say(mode === "day" ? "Daytime on Walnut Street." : "Lights on after dark.");
});

/* ---------- post ---------- */
let composer = null, bloom = null;
try {
  composer = new EffectComposer(R);
  composer.addPass(new RenderPass(scene, cam));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.4, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
} catch (e) { composer = null; }

function resize() {
  const w = canvas.clientWidth || host.clientWidth, h = canvas.clientHeight || host.clientHeight;
  R.setSize(w, h, false); cam.aspect = w / h;
  cam.fov = w / h < 0.8 ? 56 : (small ? 50 : 38);
  /* Tall phone frames: shift the picture up so the station fills the frame instead of empty night sky. */
  if (w / h < 1.05) cam.setViewOffset(w, h, 0, Math.round(h * 0.17), w, h); else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  if (composer) { composer.setSize(w, h); if (bloom) bloom.resolution.set(w / 2, h / 2); }
}
addEventListener("resize", resize);
if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
resize();
scene.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && envMats.indexOf(o.material) < 0) envMats.push(o.material); });
applyLook(1);

/* ---------- loop ---------- */
let visible = true;
if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, {threshold: 0}).observe(host);
const clock = new THREE.Clock();
let t0 = 0, sway = 0;
const camGoal = new THREE.Vector3(), tgtGoal = new THREE.Vector3();
let dragging = false, lastDrag = -99;
const SHOTS = {
  desk: {pump: {pos: [21, 9, 30], tgt: [-5, 2, -4]}, bay: {pos: [25, 6.5, 6], tgt: [8, 1.8, -13]}},
  phone: {pump: {pos: [9, 13, 23], tgt: [3, 0.5, -3]}, bay: {pos: [18, 6.5, 3], tgt: [11, 2.4, -13]}}
};
function frame() {
  requestAnimationFrame(frame);
  if (!visible || document.hidden) { clock.getDelta(); return; }
  const dt = Math.min(clock.getDelta(), 0.05); t0 += dt;
  if (modeT < 1) { modeT = Math.min(1, modeT + dt * 1.2); applyLook(ease(modeT)); }
  if (drive) {
    drive.t = Math.min(1, drive.t + dt / drive.dur);
    const e = ease(drive.t), u = drive.reverse ? 1 - e : e;
    placeOn(drive.curve, u, drive.reverse);
    const spin = dt * 9 * (drive.t < 1 ? 1 : 0) * (drive.reverse ? -1 : 1);
    wheels.forEach(w => w.rotateY(spin));
    if (drive.t >= 1) { const d = drive.done; drive = null; carMoving = false; applyLook(1); d && d(); }
  }
  // lift
  const ly = liftY + (liftTarget - liftY) * Math.min(1, dt * 2.2);
  if (Math.abs(ly - liftY) > 1e-4) { liftY = ly; car.position.y = liftY; liftArms.position.y = liftY; }
  else if (liftWait && Math.abs(liftTarget - liftY) < 0.01) { const c = liftWait; liftWait = null; c(); }
  // doors
  doorOpen.d1 += (doorOpen.target - doorOpen.d1) * Math.min(1, dt * 2.4);
  door1.scale.y = Math.max(0.05, 1 - doorOpen.d1 * 0.95);
  bayLamp.intensity = 12 * doorOpen.d1;
  // a director moves the camera between shots, unless someone dragged the view in the last few seconds
  if (!dragging && t0 - lastDrag > 5) {
    sway = reduce ? 0 : Math.sin(t0 * 0.18) * 1.4;
    const inBay = carState === "bay" || (drive && drive.curve === PATHS.bay && !drive.reverse && drive.t > 0.35);
    const shot = SHOTS[small ? "phone" : "desk"][inBay ? "bay" : "pump"];
    camGoal.set(shot.pos[0] + sway, shot.pos[1], shot.pos[2] - sway * 0.5);
    tgtGoal.set(shot.tgt[0], shot.tgt[1], shot.tgt[2]);
    const k = Math.min(1, dt * 1.1);
    cam.position.lerp(camGoal, k); controls.target.lerp(tgtGoal, k);
    cam.lookAt(controls.target);
  }
  if (controls.enabled) controls.update();
  if (attWalk) {
    attWalk.t = Math.min(1, attWalk.t + dt / attWalk.dur);
    const u = attWalk.out ? attWalk.t : 1 - attWalk.t; placeAtt(u, !attWalk.out);
    const sw = Math.sin(t0 * 9) * 0.5; legs[0].rotation.x = sw; legs[1].rotation.x = -sw; arms[0].rotation.x = -sw * 0.8; arms[1].rotation.x = sw * 0.8;
    att.position.y = Math.abs(Math.sin(t0 * 9)) * 0.04;
    if (attWalk.t >= 1) { const d = attWalk.done; attWalk = null; legs.forEach(l => l.rotation.x = 0); arms.forEach(a => a.rotation.x = 0); att.position.y = 0; d && d(); }
  }
  if (fueling) {
    fueling.t = Math.min(1, fueling.t + dt / (reduce ? 0.01 : 3.4));
    arms[1].rotation.x = -1.1;
    if (Math.floor(fueling.t * 40) !== fueling.last) { fueling.last = Math.floor(fueling.t * 40); drawPump(fueling.gal * fueling.t, "PUMPING"); }
    if (fueling.t >= 1) { const d = fueling.done; drawPump(fueling.gal, "THANK YOU"); arms[1].rotation.x = 0; fueling = null; d && d(); }
  }
  placeLabels();
  composer ? composer.render() : R.render(scene, cam);
}
controls.addEventListener("start", () => { dragging = true; host.classList.add("touched"); });
controls.addEventListener("end", () => { dragging = false; lastDrag = t0; });

/* ---------- labels you can tap in the scene ---------- */
const HS = [
  {t: "Full-service pump", p: new THREE.Vector3(-2.6, 3.6, 2.4), act: () => toPump()},
  {t: "Service bays", p: new THREE.Vector3(BX + 6, BH + 1.1, BZ), act: () => toBay()},
  {t: "Counter and fuel", p: new THREE.Vector3(BX - 5, BH + 1.1, BZ), act: () => { const v = document.getElementById("visit"); v && v.scrollIntoView({behavior: reduce ? "auto" : "smooth"}); }}
].map(h => { const b = document.createElement("button"); b.type = "button"; b.className = "hs"; b.innerHTML = "<i></i>"; b.appendChild(document.createTextNode(h.t)); b.addEventListener("click", h.act); host.appendChild(b); h.el = b; return h; });
const hcopy = document.querySelector(".hcopy"), pv = new THREE.Vector3();
function placeLabels() {
  const cw = canvas.clientWidth, ch = canvas.clientHeight, ox = canvas.offsetLeft, oy = canvas.offsetTop;
  const hr = hcopy && getComputedStyle(hcopy).position === "absolute" ? {l: hcopy.offsetLeft, t: hcopy.offsetTop, r: hcopy.offsetLeft + hcopy.offsetWidth, b: hcopy.offsetTop + hcopy.offsetHeight} : null;
  HS.forEach(h => {
    pv.copy(h.p).project(cam);
    const x = ox + (pv.x + 1) / 2 * cw, y = oy + (1 - pv.y) / 2 * ch;
    const off = pv.z > 1 || x < ox + 40 || x > ox + cw - 40 || y < oy + 20 || y > oy + ch - 70 || (hr && x > hr.l - 20 && x < hr.r + 60 && y > hr.t - 20 && y < hr.b + 20);
    h.el.style.opacity = off ? "0" : "1"; h.el.style.pointerEvents = off ? "none" : "auto"; h.el.tabIndex = off ? -1 : 0;
    h.el.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px) translate(-50%,-100%)";
  });
}
host.classList.add("ready");
frame();
// the car pulls in on its own once the page has settled
setTimeout(() => { if (carState === "road" && !carMoving) toPump(); }, reduce ? 0 : 900);
