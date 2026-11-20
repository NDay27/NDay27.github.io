// Shared 3D world (copied from the Studio demo) for the R.W. Stoneworks Immersive sample.
// (physical sky, cloud layer, stars, CC0 Poly Haven HDRI lighting via @pmndrs/assets, procedural PBR textures,
// wind-blown instanced grass, time of day, bloom + film grade, quality tiers). Each trade scene adds its subject.
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {Sky} from "three/addons/objects/Sky.js";
import {EXRLoader} from "three/addons/loaders/EXRLoader.js";

export {THREE};
export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const small = innerWidth < 760 || matchMedia("(pointer: coarse)").matches;

// ---------- noise + procedural PBR textures ----------
const PERM = new Uint8Array(512);
{let s = 1337; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
 for (let i = 0; i < 256; i++) PERM[i] = i; for (let i = 255; i > 0; i--) { const j = rnd() * (i + 1) | 0; [PERM[i], PERM[j]] = [PERM[j], PERM[i]]; } for (let i = 0; i < 256; i++) PERM[i + 256] = PERM[i];}
const fade = t => t * t * (3 - 2 * t);
function vn(x, y, p) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, m = v => ((v % p) + p) % p;
  const h = (a, b) => PERM[PERM[m(a) & 255] + (m(b) & 255)] / 255, u = fade(xf), v = fade(yf);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
}
export function fbm(x, y, p, o = 5) { let a = .5, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x, y, p); n += a; x *= 2; y *= 2; p *= 2; a *= .5; } return s / n; }
export const mix = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const hash = (a, b = 0) => PERM[(PERM[a & 255] + (b & 255)) & 511] / 255;

let R; // renderer, set in makeWorld
export function pbr(size, fn, rep, normalStrength = 2.5) {
  const n = size * size, col = new Uint8ClampedArray(n * 4), rgh = new Uint8ClampedArray(n * 4), hgt = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, o = fn(x / size, y / size);
    col[i * 4] = o[0]; col[i * 4 + 1] = o[1]; col[i * 4 + 2] = o[2]; col[i * 4 + 3] = 255; hgt[i] = o[3];
    const r = o[4] * 255; rgh[i * 4] = rgh[i * 4 + 1] = rgh[i * 4 + 2] = r; rgh[i * 4 + 3] = 255;
  }
  const nrm = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const at = (a, b) => hgt[((b + size) % size) * size + ((a + size) % size)];
    const dx = (at(x + 1, y) - at(x - 1, y)) * normalStrength, dy = (at(x, y + 1) - at(x, y - 1)) * normalStrength, l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
    nrm[i] = (-dx / l * .5 + .5) * 255; nrm[i + 1] = (dy / l * .5 + .5) * 255; nrm[i + 2] = (1 / l * .5 + .5) * 255; nrm[i + 3] = 255;
  }
  const mk = (data, srgb) => {
    const t = new THREE.DataTexture(data, size, size); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.anisotropy = R ? R.capabilities.getMaxAnisotropy() : 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  };
  return {map: mk(col, true), normalMap: mk(nrm), roughnessMap: mk(rgh)};
}
export const TEX = {
  soil: () => pbr(512, (u, v) => { const g = fbm(u * 20, v * 20, 20, 6), m = fbm(u * 4, v * 4, 4, 4); const t = clamp((m - .5) * 3) * .5;
    return [mix(52 + g * 40, 86 + g * 40, t), mix(78 + g * 55, 70 + g * 30, t), mix(34 + g * 20, 52 + g * 20, t), g, .95]; }, [50, 50], 2),
  lawn: () => pbr(512, (u, v) => { const g = fbm(u * 24, v * 24, 24, 6), s = fbm(u * 140, v * 140, 140, 2), m = fbm(u * 3, v * 3, 3, 4);
    const w = .78 + g * .3 + s * .18; return [mix(58, 84, m) * w, mix(96, 112, m) * w, mix(40, 46, m) * w, s * .7 + g * .3, .96]; }, [140, 140], 2.2),
  snow: () => pbr(512, (u, v) => { const g = fbm(u * 16, v * 16, 16, 5), s = fbm(u * 70, v * 70, 70, 2); const w = 226 + g * 24 + s * 6; return [w - 6, w - 2, w + 4, g * .8 + s * .2, .55 + s * .3]; }, [40, 40], 1.2),
  asphalt: (rep = [8, 8]) => pbr(512, (u, v) => { const g = fbm(u * 40, v * 40, 40, 4), s = fbm(u * 160, v * 160, 160, 2), crack = fbm(u * 6, v * 6, 6, 5); const c = Math.abs(crack - .5) < .01;
    const w = 52 + g * 22 + s * 18; return c ? [28, 28, 30, 0, 1] : [w, w, w + 3, s, .82 + g * .12]; }, rep, 2),
  concrete: (rep = [6, 6]) => pbr(512, (u, v) => { const g = fbm(u * 10, v * 10, 10, 5), s = fbm(u * 90, v * 90, 90, 2), j = (u * 4 % 1) < .006 || (v * 4 % 1) < .006;
    const w = 150 + g * 40 + s * 12; return j ? [92, 90, 86, 0, 1] : [w, w - 2, w - 6, g * .4, .85]; }, rep, 1.5),
  brick: (rep = [3, 3], tone = [148, 70, 52]) => pbr(512, (u, v) => { const rows = 16, cols = 8, rv = v * rows, ri = Math.floor(rv), off = ri % 2 ? .5 : 0, cu = u * cols + off, ci = Math.floor(cu);
    const fu = cu - ci, fv = rv - ri, mortar = fu < .05 || fv < .1; const g = fbm(u * 30, v * 30, 30, 4), k = hash(ci * 7 + 3, ri * 13) * .3 + .82;
    return mortar ? [170, 164, 152, .1, .95] : [tone[0] * k + g * 30, tone[1] * k + g * 18, tone[2] * k + g * 12, .8 + g * .2, .8]; }, rep, 3),
  siding: (rep = [2, 2], tone = [226, 222, 212]) => pbr(512, (u, v) => { const n = 14, f = (v * n) % 1, g = fbm(u * 8, v * 40, 8, 4), edge = f > .9;
    const k = edge ? .62 : .9 + f * .12; return [tone[0] * k + g * 8, tone[1] * k + g * 8, tone[2] * k + g * 8, edge ? 0 : f, .7]; }, rep, 4),
  metal: (rep = [4, 1], tone = [150, 156, 162]) => pbr(256, (u, v) => { const r = Math.sin(u * Math.PI * 2 * 12) * .5 + .5, g = fbm(u * 30, v * 30, 30, 3);
    return [tone[0] + r * 26 + g * 10, tone[1] + r * 26 + g * 10, tone[2] + r * 26 + g * 10, r, .45 + g * .2]; }, rep, 3),
  shingle: (rep = [4, 4], tone = [58, 56, 62]) => pbr(512, (u, v) => { const rows = 10, rv = v * rows, ri = Math.floor(rv), off = ri % 2 ? .5 : 0, cu = u * 8 + off, ci = Math.floor(cu);
    const fv = rv - ri, g = fbm(u * 60, v * 60, 60, 3), k = .8 + hash(ci * 5, ri * 11) * .35, gap = (cu - ci) < .04 || fv > .93;
    return gap ? [20, 20, 22, 0, 1] : [tone[0] * k + g * 20, tone[1] * k + g * 20, tone[2] * k + g * 20, 1 - fv * .6, .9]; }, rep, 3),
  wood: (rep = [3, 4]) => pbr(512, (u, v) => { const pv = v * 7, pi = Math.floor(pv), f = pv - pi; const g = fbm(u * 28 + pi * 7.3, v * 2, 28, 5);
    if (f < .03) return [40, 26, 16, 0, 1]; const w = .7 + g * .4 + Math.sin(pi * 12.9) * .06; return [170 * w, 120 * w, 78 * w, .8 + g * .1, .45 + g * .2]; }, rep, 2.5),
  plaster: (rep = [3, 3], tone = [236, 232, 224]) => pbr(256, (u, v) => { const g = fbm(u * 12, v * 12, 12, 5); const w = .94 + g * .08; return [tone[0] * w, tone[1] * w, tone[2] * w, g, .92]; }, rep, 1),
  bark: () => pbr(256, (u, v) => { const g = fbm(u * 10, v * 2, 10, 5), c = fbm(u * 30, v * 6, 30, 3); const w = .45 + g * .5; const k = c < .35; return [k ? 30 : 92 * w, k ? 24 : 76 * w, k ? 20 : 62 * w, k ? 0 : g, .95]; }, [2, 3], 4),
};
export function leafCard(h0 = 85, h1 = 30) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  for (let i = 0; i < 170; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), .7) * 104, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r * .9, s = 7 + Math.random() * 9;
    g.save(); g.translate(x, y); g.rotate(Math.random() * Math.PI * 2); const l = 40 + Math.random() * 30;
    g.fillStyle = `hsl(${h0 + Math.random() * h1},${35 + Math.random() * 25}%,${l * .55}%)`; g.beginPath(); g.ellipse(0, 0, s, s * .48, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0002"; g.fillRect(-s, -.6, s * 2, 1.2); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// Sign face: the shop's name set in the page's display font. Emissive so it glows at night.
export async function signTexture(text, sub, {fg = "#fff", bg = "#d33", font, w = 1024, h = 256, upper = false} = {}) {
  const fam = font || getComputedStyle(document.documentElement).getPropertyValue("--disp").split(",")[0].trim() || "sans-serif";
  try { await Promise.race([document.fonts.load(`800 120px ${fam}`, text), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fallback font */ }
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  const t = upper ? text.toUpperCase() : text; let s = h * .5;
  do { x.font = `800 ${s}px ${fam}, sans-serif`; s -= 3; } while (x.measureText(t).width > w * .9 && s > 20);
  x.fillText(t, w / 2, sub ? h * .42 : h * .52);
  if (sub) { x.font = `600 ${h * .15}px Inter, sans-serif`; x.globalAlpha = .85; x.fillText(sub, w / 2, h * .8); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

// ---------- the world ----------
export async function makeWorld(opt = {}) {
  const {outdoor = true, ground = "grass", grassR = 60, exclude = () => false, cam: camO = {}, interior = null, grassN: grassCount = 1, grassH = 1} = opt;
  const host = document.querySelector(".scene"), canvas = document.getElementById("c");
  try { R = new THREE.WebGLRenderer({canvas, antialias: false, powerPreference: "high-performance"}); }
  catch (e) { host.classList.add("noGL"); throw e; }
  R.shadowMap.enabled = true; R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .9;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 900); cam.position.fromArray(camO.pos || [10, 6, 22]);
  const ctl = new OrbitControls(cam, canvas); ctl.target.fromArray(camO.target || [0, 2, 0]); ctl.enableDamping = true; ctl.dampingFactor = .06;
  ctl.minDistance = camO.minD || 8; ctl.maxDistance = camO.maxD || 45; ctl.minPolarAngle = Math.PI * .2; ctl.maxPolarAngle = camO.maxPolar || Math.PI * .47;
  ctl.enablePan = false; ctl.minAzimuthAngle = camO.minAz ?? -1.2; ctl.maxAzimuthAngle = camO.maxAz ?? 1.2; ctl.autoRotate = !reduce; ctl.autoRotateSpeed = .3;
  if (small) { ctl.enableRotate = false; ctl.enableZoom = false; } // phones: the page scrolls; the camera drifts on its own
  else ctl.enableZoom = false;

  // sky, clouds, stars
  let su = null, cloudU = null, starM = null;
  if (outdoor) {
    const sky = new Sky(); sky.scale.setScalar(700); sky.renderOrder = -1; scene.add(sky);
    sky.material.uniforms.skyTint = {value: new THREE.Color(1, 1, 1)}; sky.material.uniforms.skySat = {value: 1};
    sky.material.fragmentShader = sky.material.fragmentShader.replace("uniform vec3 up;", "uniform vec3 up;uniform vec3 skyTint;uniform float skySat;")
      .replace("gl_FragColor = vec4( retColor, 1.0 );", "retColor=mix(vec3(dot(retColor,vec3(.299,.587,.114))),retColor,skySat)*skyTint;gl_FragColor = vec4( retColor, 1.0 );");
    su = sky.material.uniforms; su.mieDirectionalG.value = .82;
    cloudU = {t: {value: 0}, sunDir: {value: new THREE.Vector3()}, lit: {value: new THREE.Color()}, dark: {value: new THREE.Color()}, amt: {value: 1}, cov: {value: .5}};
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(640, 64, 32, 0, Math.PI * 2, 0, Math.PI * .5), new THREE.ShaderMaterial({side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, uniforms: cloudU,
      vertexShader: `varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float t,amt,cov;uniform vec3 sunDir,lit,dark;varying vec3 v;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
void main(){if(v.y<.02)discard;vec2 uv=v.xz/(v.y+.18)*1.3+vec2(t*.004,t*.002);float d=fbm(uv*1.4);float c=smoothstep(cov,cov+.16,d)*amt;
float edge=smoothstep(.07,.32,v.y);float sl=max(dot(normalize(v),normalize(sunDir)),0.);vec3 col=mix(dark,lit,clamp(.35+.65*fbm(uv*1.4+.25)+pow(sl,6.)*.6,0.,1.4));
gl_FragColor=vec4(col,c*edge*.92);}`})));
    const sp = []; for (let i = 0; i < 1800; i++) { const a = Math.random() * Math.PI * 2, y = Math.random() * .95 + .05, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 600, y * 600, Math.sin(a) * r * 600); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    starM = new THREE.PointsMaterial({color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false}); scene.add(new THREE.Points(sg, starM));
  } else scene.background = new THREE.Color(interior || 0x1a1612);

  // lights
  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x3a4a2a, .25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
  Object.assign(sun.shadow.camera, {left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 260}); sun.shadow.bias = -.0002; sun.shadow.normalBias = .03; sun.shadow.radius = 3; scene.add(sun, sun.target);
  const pmrem = new THREE.PMREMGenerator(R), envs = {};
  const hdris = {day: "park", golden: "sunset", night: "night"};
  if (!outdoor) { hdris.day = "apartment"; hdris.golden = "apartment"; hdris.night = "apartment"; }
  const ready = Promise.all([...new Set(Object.values(hdris))].map(async name => { try { const m = await import(`@pmndrs/assets/hdri/${name}.exr.js`); const tex = await new EXRLoader().loadAsync(m.default);
    tex.mapping = THREE.EquirectangularReflectionMapping; const e = pmrem.fromEquirectangular(tex).texture; tex.dispose(); for (const k in hdris) if (hdris[k] === name) envs[k] = e; } catch (e) { /* procedural sky only */ } }))
    .then(() => applyTod());

  // ground: textured disc, distant hills, grass
  const hillFog = {value: new THREE.Color(0x9fb8cf)};
  let grass = null, grassU = {t: {value: 0}, wind: {value: 1}}, grassN = 0;
  const bladeG = new THREE.PlaneGeometry(opt.grassW || .1, 1, 1, 5); {const p = bladeG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + .5; p.setX(i, p.getX(i) * (1 - y * .92)); p.setY(i, y); }}
  const bladeM = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .9, side: THREE.DoubleSide, envMapIntensity: .35});
  bladeM.onBeforeCompile = sh => { sh.uniforms.t = grassU.t; sh.uniforms.wind = grassU.wind; sh.vertexShader = "uniform float t,wind;varying float vH;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
 vH=position.y;vec4 wp=instanceMatrix*vec4(0.,0.,0.,1.);float g=sin(t*.6+wp.x*.05)*.5+.5;float w=(sin(t*1.7*(.6+wind*.4)+wp.x*.35+wp.z*.25)*.45+sin(t*2.9+wp.z*.6)*.2)*(.4+g)*wind;float h=position.y;transformed.x+=w*h*h*.5;transformed.z+=w*h*h*.25;`);
    sh.fragmentShader = "varying float vH;\n" + sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb*=mix(.35,1.25,vH);"); };
  if (outdoor) {
    const gt = ground === "snow" ? TEX.snow() : ground === "lawn" ? TEX.lawn() : TEX.soil();
    const g = new THREE.Mesh(new THREE.CircleGeometry(560, 96), new THREE.MeshStandardMaterial({...gt, roughness: 1, envMapIntensity: .5})); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    for (const [r, base, amp, col, ph] of [[520, 14, 1, ground === "snow" ? 0x8a97a3 : 0x2f4a2c, 0], [330, 6, .45, ground === "snow" ? 0xb8c3cc : 0x2a3f26, 2.1]]) {
      const hg = new THREE.CylinderGeometry(r, r, 1, 240, 1, true), hp = hg.attributes.position;
      for (let i = 0; i < hp.count; i++) { const a = Math.atan2(hp.getZ(i), hp.getX(i)) + ph, top = Math.max(1.5, base + amp * (Math.sin(a * 4) * 9 + Math.sin(a * 11 + 1) * 4 + Math.sin(a * 27) * 1.5)); hp.setY(i, hp.getY(i) > 0 ? top : -.5); }
      hg.computeVertexNormals(); const hm = new THREE.MeshStandardMaterial({color: col, roughness: 1, side: THREE.BackSide});
      hm.onBeforeCompile = sh => { sh.uniforms.hillFog = hillFog; sh.fragmentShader = "uniform vec3 hillFog;\n" + sh.fragmentShader.replace("#include <fog_fragment>", THREE.ShaderChunk.fog_fragment.replace(/fogColor/g, "hillFog")); };
      scene.add(new THREE.Mesh(hg, hm));
    }
    if (ground !== "snow") {
      const NB = Math.floor((reduce ? 8000 : (small ? 16000 : 46000)) * grassCount); grass = new THREE.InstancedMesh(bladeG, bladeM, NB);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), col = new THREE.Color(); let n = 0;
      grass.userData.pos = [];
      for (let i = 0; n < NB && i < NB * 5; i++) {
        const r = Math.sqrt(Math.random()) * grassR, a = Math.random() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (exclude(x, z)) continue;
        e3.set((Math.random() - .5) * .35, Math.random() * Math.PI, (Math.random() - .5) * .35); q.setFromEuler(e3); const sc = (.3 + Math.random() * .5) * grassH;
        m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, sc, 1)); grass.setMatrixAt(n, m4); grass.userData.pos.push([x, z, sc, q.clone()]);
        if (ground === "lawn") col.setHSL(.25 + Math.random() * .06, .42 + Math.random() * .16, .26 + Math.random() * .12); else col.setHSL(.2 + Math.random() * .09, .38 + Math.random() * .2, .32 + Math.random() * .14); grass.setColorAt(n, col); n++;
      }
      grass.count = grassN = n; grass.receiveShadow = true; scene.add(grass);
    }
  }
  // fireflies / dust motes
  const ffN = 160, ffP = new Float32Array(ffN * 3);
  for (let i = 0; i < ffN; i++) { ffP[i * 3] = (Math.random() - .5) * 50; ffP[i * 3 + 1] = .4 + Math.random() * 3.5; ffP[i * 3 + 2] = (Math.random() - .5) * 50; }
  const ffG = new THREE.BufferGeometry(); ffG.setAttribute("position", new THREE.BufferAttribute(ffP, 3));
  const ffM = new THREE.PointsMaterial({color: 0xfff3a0, size: .12, transparent: true, opacity: 0, depthWrite: false}); if (outdoor && ground !== "snow") scene.add(new THREE.Points(ffG, ffM));

  // time of day: day, golden hour, night (same keys as the Studio demo)
  const C = h => new THREE.Color(h);
  const K = [{t: 0, elev: 48, az: -35, sunC: C(0xfff4e6), sunI: 5, hemi: .45, turb: 1.6, ray: 2.6, mie: .0025, tint: C(0xc2dbff), sat: 1.5, exp: .5, warm: 0, glow: .15, ff: 0, stars: 0, cl: C(0xffffff), cd: C(0xb9c6d8), camt: .9, cov: .6, fog: C(0x9fb8cf), hf: C(0x9fb8cf), fogN: 160, env: "day", envI: 1.6},
    {t: .55, elev: 3.5, az: -62, sunC: C(0xffa860), sunI: 2.4, hemi: .18, turb: 7, ray: 2.6, mie: .005, tint: C(0xffffff), sat: 1.1, exp: .85, warm: 10, glow: 2.2, ff: 0, stars: 0, cl: C(0xffc79a), cd: C(0x7a5a6e), camt: .95, cov: .5, fog: C(0xd6a27a), hf: C(0x8c7480), fogN: 100, env: "golden", envI: .75},
    {t: 1, elev: 28, az: 40, sunC: C(0x9db2ff), sunI: .55, hemi: .12, turb: 1, ray: .3, mie: .005, tint: C(0xffffff), sat: 1, exp: .95, warm: 16, glow: 4.5, ff: 1, stars: 1, cl: C(0x2a3044), cd: C(0x0c0f18), camt: .55, cov: .52, fog: C(0x0b0f1c), hf: C(0x0b0f1c), fogN: 70, env: "night", envI: .35}];
  if (!outdoor) K.forEach(k => { k.sunI *= .6; k.exp = mix(.8, 1, k.t); });
  let todNow = opt.tod ?? .3, todTarget = todNow;
  function key(t) { const a = t > .55 ? K[1] : K[0], b = t > .55 ? K[2] : K[1], k = (t - a.t) / (b.t - a.t || 1), L = (x, y) => x + (y - x) * k, LC = (x, y) => x.clone().lerp(y, k);
    const o = {}; for (const n in a) { const v = a[n]; o[n] = v instanceof THREE.Color ? LC(v, b[n]) : typeof v === "number" ? L(v, b[n]) : (k < .5 ? v : b[n]); } return o; }
  const warm = [], glow = [], sunDir = new THREE.Vector3();
  function applyTod() {
    const k = key(todNow); R.shadowMap.needsUpdate = true;
    const skyElev = todNow > .75 ? mix(3.5, -12, (todNow - .55) / .45) : k.elev;
    const th = THREE.MathUtils.degToRad(k.az); sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - skyElev), th);
    if (su) { su.sunPosition.value.copy(sunDir); su.turbidity.value = k.turb; su.rayleigh.value = k.ray; su.mieCoefficient.value = k.mie; su.skyTint.value.copy(k.tint); su.skySat.value = k.sat; }
    const ld = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - Math.max(k.elev, 4)), th); sun.position.copy(ld).multiplyScalar(120); sun.target.position.set(0, 0, 0);
    sun.color.copy(k.sunC); sun.intensity = k.sunI; hemi.intensity = k.hemi; R.toneMappingExposure = k.exp;
    bloom.threshold = 1.5 / k.exp; bloom.strength = .3 + .3 * Math.min(1, k.warm / 10);
    if (cloudU) { cloudU.sunDir.value.copy(sunDir); cloudU.lit.value.copy(k.cl); cloudU.dark.value.copy(k.cd); cloudU.amt.value = k.camt; cloudU.cov.value = k.cov; }
    if (starM) starM.opacity = k.stars; ffM.opacity = k.ff * .9;
    warm.forEach(([l, p]) => l.intensity = k.warm * p); glow.forEach(([m, p]) => m.emissiveIntensity = k.glow * p);
    if (outdoor) { if (!scene.fog) scene.fog = new THREE.Fog(0, 1, 650); scene.fog.color.copy(k.fog); hillFog.value.copy(k.hf); scene.fog.near = k.fogN; }
    const e = envs[k.env]; if (e && scene.environment !== e) scene.environment = e;
    scene.traverse(o => { if (o.material && o.material.envMapIntensity !== undefined) { o.material.userData.base ??= o.material.envMapIntensity; o.material.envMapIntensity = o.material.userData.base * k.envI; } });
    world.onTod.forEach(f => f(todNow));
  }

  // post: bloom, chromatic edge, vignette, film grain
  const rt = new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: small ? 0 : 4});
  const comp = new EffectComposer(R, rt); comp.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .5, .45, 1.6); comp.addPass(bloom);
  comp.addPass(new OutputPass());
  const grade = new ShaderPass({uniforms: {tDiffuse: {value: null}, t: {value: 0}}, vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D tDiffuse;uniform float t;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 d=vUv-.5;vec3 c;c.r=texture2D(tDiffuse,vUv+d*.0016).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-d*.0016).b;
float v=smoothstep(.9,.25,length(d));c*=mix(.62,1.,v);c=mix(c,c*vec3(1.03,1.,.95),.6);float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.06);
c+=(h(vUv*vec2(1920.,1080.)+t)-.5)*.02;gl_FragColor=vec4(c,1.);}`}); comp.addPass(grade);

  const base = cam.position.clone().sub(ctl.target);
  function size() {
    const w = host.clientWidth, h = host.clientHeight; R.setSize(w, h, false); comp.setSize(w, h); cam.aspect = w / h; cam.fov = opt.fov ? opt.fov(w, h) : (w < 700 ? 50 : 34);
    // desktop: the subject sits right of the headline; phone: push back so it fits the tall frame
    if (opt.offset !== false) cam.setViewOffset(w, h, w >= 900 ? -w * .16 : 0, w < 700 ? -h * .15 : 0, w, h);
    if (!size.set && opt.offset !== false) { const k = w / h < .6 ? 1.5 : w / h < .8 ? 1.3 : 1; cam.position.copy(ctl.target).addScaledVector(base, k); ctl.maxDistance *= k; size.set = 1; }
    cam.updateProjectionMatrix();
  }
  const Q = [{dpr: .75, ms: 0, sh: 1024, grass: .45}, {dpr: 1.1, ms: 2, sh: 2048, grass: .7}, {dpr: 1.5, ms: 4, sh: 4096, grass: 1}];
  let qi = small ? 1 : 2;
  function applyQ() { const q = Q[qi], pr = Math.min(devicePixelRatio, q.dpr); R.setPixelRatio(pr); comp.setPixelRatio(pr);
    [comp.renderTarget1, comp.renderTarget2].forEach(t => { if (t.samples !== q.ms) { t.samples = q.ms; t.dispose(); } });
    if (sun.shadow.mapSize.x !== q.sh) { sun.shadow.mapSize.set(q.sh, q.sh); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } R.shadowMap.needsUpdate = true;
    if (grass) grass.count = Math.floor(grassN * q.grass); size(); }

  const world = {THREE, R, scene, cam, ctl, sun, hemi, grass, warm, glow, onTick: [], onTod: [], host, bladeG, bladeM, cloudU, grassU, bloom,
    refresh() { applyTod(); }, get tod() { return todNow; }, comp, ready, size, grade,
    setTodNow(t) { todNow = todTarget = t; applyTod(); }, setQuality(i) { qi = i; applyQ(); }, get quality() { return qi; },
    renderOnce() { ctl.update(); comp.render(); },
    setTod(t) { todTarget = t; }, shadows() { R.shadowMap.needsUpdate = true; },
    lamp(x, y, z, color = 0xffc98a, p = 1, dist = 14) { const l = new THREE.PointLight(color, 0, dist, 1.8); l.position.set(x, y, z); scene.add(l); warm.push([l, p]); return l; },
    glowMat(color, p = 1, o = {}) { const m = new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 0, roughness: .3, ...o}); glow.push([m, p]); return m; },
    mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m; },
    start() {
      addEventListener("resize", size); applyQ(); applyTod();
      let intro = reduce ? 1 : 0; const to = cam.position.clone(), from = to.clone().add(new THREE.Vector3(-14, 6, 14));
      if (!reduce) cam.position.copy(from);
      canvas.addEventListener("pointerdown", () => { intro = 1; const h = document.getElementById("scHint"); if (h) h.style.opacity = 0; });
      let vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(host);
      const clock = new THREE.Clock(); let pf = 0, pacc = 0, pn = 0;
      (function loop() {
        requestAnimationFrame(loop); if (!vis) { clock.getDelta(); pf = 0; return; }
        const raw = clock.getDelta(), dt = Math.min(raw, .05), t = clock.elapsedTime;
        if (raw > .25) pf = 0; else if (++pf > 45 && qi > 0) { pacc += raw; if (++pn >= 75) { if (pacc / pn > 1 / 40) { qi--; applyQ(); pf = 0; } pacc = 0; pn = 0; } }
        const mt = reduce ? 0 : t; grassU.t.value = mt; if (cloudU) cloudU.t.value = mt; grade.uniforms.t.value = mt % 100;
        if (intro < 1) { intro = Math.min(1, intro + dt / 3.4); const e = 1 - Math.pow(1 - intro, 3); cam.position.lerpVectors(from, to, e); }
        if (Math.abs(todTarget - todNow) > .002) { todNow += (todTarget - todNow) * Math.min(1, dt * 2.4); applyTod(); }
        if (!reduce && ffM.opacity > 0) { const p = ffG.attributes.position.array; for (let i = 0; i < ffN; i++) { p[i * 3 + 1] += Math.sin(t * 1.3 + i) * .004; p[i * 3] += Math.cos(t * .7 + i) * .006; } ffG.attributes.position.needsUpdate = true; }
        world.onTick.forEach(f => f(t, dt));
        const az = ctl.getAzimuthalAngle(); if (az > ctl.maxAzimuthAngle - .5 && ctl.autoRotateSpeed > 0 || az < ctl.minAzimuthAngle + .5 && ctl.autoRotateSpeed < 0) ctl.autoRotateSpeed *= -1;
        ctl.update(); comp.render();
      })();
    }};
  return world;
}
