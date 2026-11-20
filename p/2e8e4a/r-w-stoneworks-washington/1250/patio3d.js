// R.W. Stoneworks Immersive sample by Nolan Day Studio: the live 3D patio.
// imm.js turns scroll position into build progress (p), light (tod) and a camera key; this file draws it.
// The build: layout paint and stakes, a mini excavator digs it out, a compacted gravel base, the paver bands
// and flagstone field, the fire pit and seat wall course by course, caps, pillars, steps and lights, then fire.
import {makeWorld, pbr, fbm, TEX, reduce, small} from "./world.js";

const K = {
  hero: [[11.8, 6.2, 15.2], [-.4, .3, -1.8], 36],
  plan: [[0, 19, 6.5], [0, 0, -.6], 40],
  dig: [[11, 7.2, 10.5], [1.5, 0, -.5], 38],
  base: [[-10.5, 6.8, 10.5], [0, 0, -.5], 38],
  stone: [[2.5, 13.5, 9.5], [0, 0, -.6], 40],
  wall: [[-8.8, 4.6, 9.2], [0, .5, -.8], 38],
  caps: [[7.6, 3.9, 9.4], [0, .7, -1.6], 38],
  fire: [[0, 4.3, 8.6], [0, .2, -1], 46],
  photo: [[0, 3.75, 7.3], [0, 0, -.75], 54],
  walk: [[8.4, 4.6, 10.6], [0, .5, -1.2], 38],
};
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
// angle from the back of the patio: 0 at the back (toward the house), 1 at the front (toward the camera), mirrored left and right
const sweep = (x, z) => Math.abs(Math.atan2(x, -z)) / Math.PI;

export async function start(RW) {
  const R_PIT = .8, R_IN = .98, R_FLAG = 1.38, R_OUT = 3.9, R_EDGE = 4.9, R_WALL = 5.16, BACK_GAP = .33, FRONT_GAP = .23;
  const world = await makeWorld({
    cam: {pos: K.hero[0], target: K.hero[1], minD: 1, maxD: 400, minAz: -99, maxAz: 99, maxPolar: Math.PI * .62},
    tod: .56, ground: "lawn", grassR: 30, grassH: .13, grassW: .035, grassN: small ? 1.2 : 2.2, offset: false, fov: () => 38,
    exclude: (x, z) => Math.hypot(x, z) < 6.1 || (Math.abs(x) < 5.4 && z < -4.6 && z > -18) || (x > 2.5 && x < 11 && z > -7 && z < 1),
  });
  const {THREE, scene, cam, ctl} = world;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const own = []; // our own lights and glowing materials: [object, base strength, kind]

  // ---------- materials ----------
  const stoneTex = pbr(256, (u, v) => { const g = fbm(u * 9, v * 9, 9, 5), s = fbm(u * 60, v * 60, 60, 2); const w = 196 + g * 46 + s * 14; return [w, w, w, g * .7 + s * .3, .9]; }, [1, 1], 2.4);
  const splitTex = pbr(256, (u, v) => { const g = fbm(u * 14, v * 5, 14, 5), s = fbm(u * 80, v * 80, 80, 2); const w = 190 + g * 50 + s * 18; return [w, w - 3, w - 8, g, .95]; }, [1, 1], 4);
  const matPaver = new THREE.MeshStandardMaterial({...stoneTex, roughness: .88, envMapIntensity: .6});
  const matWall = new THREE.MeshStandardMaterial({...splitTex, roughness: .95, envMapIntensity: .55});
  const matCap = new THREE.MeshStandardMaterial({...stoneTex, color: 0xe6dccb, roughness: .8, envMapIntensity: .6});
  const tl = new THREE.TextureLoader();
  const flagC = tl.load("flag-c.jpg"), flagN = tl.load("flag-n.jpg");
  flagC.colorSpace = THREE.SRGBColorSpace; [flagC, flagN].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 2.2); t.anisotropy = 4; });
  const sweepU = {flag: {value: 0}, paint: {value: 0}};
  function sweepMat(mat, key) {
    mat.onBeforeCompile = sh => { sh.uniforms.uR = sweepU[key];
      sh.vertexShader = "varying vec3 vW;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;");
      sh.fragmentShader = "uniform float uR;varying vec3 vW;\n" + sh.fragmentShader.replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nfloat sw=abs(atan(vW.x,-vW.z))/3.14159265;if(sw>uR)discard;")
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb*=mix(1.,1.35,smoothstep(.05,0.,uR-sw)*step(uR,.999));"); };
    return mat;
  }
  const matFlag = sweepMat(new THREE.MeshStandardMaterial({map: flagC, normalMap: flagN, normalScale: new THREE.Vector2(1.6, 1.6), roughness: .86, envMapIntensity: .6}), "flag");
  const soilT = TEX.soil(); [soilT.map, soilT.normalMap, soilT.roughnessMap].forEach(t => t.repeat.set(3, 3));
  const matSoil = new THREE.MeshStandardMaterial({...soilT, color: 0x8a7462, roughness: 1});
  const gravT = pbr(512, (u, v) => { const g = fbm(u * 90, v * 90, 90, 3), c = fbm(u * 18, v * 18, 18, 3); const w = 120 + g * 90 + c * 20; return [w, w - 4, w - 10, g, .95]; }, [3, 3], 5);
  const matGravel = new THREE.MeshStandardMaterial({...gravT, roughness: 1, envMapIntensity: .5});
  const matPaint = sweepMat(new THREE.MeshBasicMaterial({color: 0xf6f2e8, transparent: true, opacity: .95, depthWrite: false}), "paint");
  const matDark = new THREE.MeshStandardMaterial({color: 0x23201d, roughness: .7, metalness: .2});
  const matYellow = new THREE.MeshStandardMaterial({color: 0xe5a524, roughness: .45, metalness: .25, envMapIntensity: .9});
  const matGlass = new THREE.MeshStandardMaterial({color: 0x1d2a33, roughness: .1, metalness: .6, envMapIntensity: 1.4});
  const glowMat = (c, s) => { const m = new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: 0, roughness: .4}); own.push([m, s, "glow"]); return m; };
  const lamp = (x, y, z, c, s, d) => { const l = new THREE.PointLight(c, 0, d, 1.7); l.position.set(x, y, z); scene.add(l); own.push([l, s, "lamp"]); return l; };
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m; };
  const flat = (geo, mat, y) => { const m = add(geo, mat, 0, y, 0, scene, false); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; };

  // ---------- the yard: the house behind, a raised terrace, shrubs ----------
  const siding = TEX.siding([3, 1.4], [74, 76, 80]); const shing = TEX.shingle([5, 2], [46, 46, 50]);
  const house = new THREE.Group(); scene.add(house);
  add(new THREE.BoxGeometry(17, 3.3, 7), new THREE.MeshStandardMaterial({...siding, roughness: .8}), 0, 1.65 + .5, -13.2, house);
  { const sh = new THREE.Shape(); sh.moveTo(-3.9, 0); sh.lineTo(0, 1.9); sh.lineTo(3.9, 0); sh.lineTo(-3.9, 0);
    const rg = new THREE.ExtrudeGeometry(sh, {depth: 17.8, bevelEnabled: false}); rg.translate(0, 0, -8.9); rg.rotateY(Math.PI / 2);
    add(rg, new THREE.MeshStandardMaterial({...shing, roughness: .9}), 0, 3.3 + .5, -13.2, house); }
  const winM = new THREE.MeshStandardMaterial({color: 0x15171a, emissive: 0xffc987, emissiveIntensity: 0, roughness: .2, metalness: .3}); own.push([winM, 1.4, "glow"]);
  for (const x of [-6.2, -3.6, 3.6, 6.2]) { add(new THREE.BoxGeometry(1.3, 1.4, .08), winM, x, 2.5, -9.66, house, false); add(new THREE.BoxGeometry(1.5, .1, .14), matCap, x, 1.76, -9.62, house); }
  add(new THREE.BoxGeometry(2.6, 2.1, .08), winM, 0, 1.6 + .5, -9.66, house, false);
  add(new THREE.BoxGeometry(2.8, .12, .16), matDark, 0, 3.2 + .5, -9.62, house);
  // terrace: block faces, paver top
  const terr = add(new THREE.BoxGeometry(9, .52, 3.4), [matWall, matWall, matPaver, matPaver, matWall, matWall], 0, .26, -7.95);
  terr.material = [matWall, matWall, new THREE.MeshStandardMaterial({...TEX.concrete([4, 2]), color: 0xd8cfc0, roughness: .85}), matWall, matWall, matWall];
  const leaf = new THREE.MeshStandardMaterial({color: 0x24361f, roughness: .95});
  for (const [x, z, s] of [[-7.6, -9.9, 1], [-5.6, -10.1, .8], [5.7, -10, .85], [7.8, -9.8, 1.1], [-9.6, -6.5, 1.2], [9.5, -6.2, 1.3], [-10.5, -2, .9]]) {
    const b = add(new THREE.IcosahedronGeometry(.75 * s, 1), leaf, x, .5 * s, z); b.scale.y = .8; }
  house.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });

  // ---------- 1. the drawing: blueprint grid, paint lines and stakes ----------
  const gridM = new THREE.ShaderMaterial({transparent: true, depthWrite: false, uniforms: {k: {value: 0}},
    vertexShader: "varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform float k;varying vec2 p;float ln(float v,float s,float w){float f=abs(fract(v/s-.5)-.5)*s;return 1.-smoothstep(w,w*2.,f);}" +
      "void main(){float g=max(ln(p.x,.5,.012),ln(p.y,.5,.012))*.35+max(ln(p.x,2.,.02),ln(p.y,2.,.02))*.6;float r=length(p);g*=1.-smoothstep(8.,11.,r);gl_FragColor=vec4(.78,.9,1.,g*k);}"});
  const grid = flat(new THREE.PlaneGeometry(26, 26), gridM, .03); grid.renderOrder = 2;
  const paint = new THREE.Group(); scene.add(paint);
  for (const [a, b] of [[R_PIT - .03, R_PIT + .03], [R_FLAG - .025, R_FLAG + .025], [R_OUT - .025, R_OUT + .025], [R_WALL + .17, R_WALL + .24]]) { const m = flat(new THREE.RingGeometry(a, b, 160), matPaint, .028); m.renderOrder = 3; paint.add(m); }
  const stakes = new THREE.Group(); scene.add(stakes);
  const stakeM = new THREE.MeshStandardMaterial({color: 0xc9a77c, roughness: .9}), flagM = new THREE.MeshStandardMaterial({color: 0xff6a2a, roughness: .6, side: THREE.DoubleSide});
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = Math.sin(a) * (R_WALL + .45), z = -Math.cos(a) * (R_WALL + .45);
    const s = add(new THREE.BoxGeometry(.05, .5, .05), stakeM, x, .25, z, stakes); const f = add(new THREE.PlaneGeometry(.16, .1), flagM, .08, .2, 0, s, false); f.rotation.y = a; }

  // ---------- 2. excavation: soil, a spoil pile and a mini excavator ----------
  const soil = flat(new THREE.CircleGeometry(R_WALL + .3, 96), matSoil, .016);
  const pile = add(new THREE.ConeGeometry(1.9, 1.25, 28, 4), matSoil, 7.6, .62, -3.6);
  { const p = pile.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < .6) { const n = 1 + (Math.sin(i * 12.9) * .5) * .18; p.setX(i, p.getX(i) * n); p.setZ(i, p.getZ(i) * n); } } pile.geometry.computeVertexNormals(); }
  const ex = new THREE.Group(); scene.add(ex);
  const tracks = new THREE.Group(); ex.add(tracks);
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(2.0, .42, .42), matDark, 0, .25, s * .62, tracks);
    for (const x of [-.98, .98]) { const w = add(new THREE.CylinderGeometry(.21, .21, .42, 16), matDark, x, .25, s * .62, tracks); w.rotation.x = Math.PI / 2; } }
  add(new THREE.BoxGeometry(1.2, .16, .8), matDark, 0, .5, 0, tracks);
  add(new THREE.BoxGeometry(.25, .34, 1.7), matYellow, 1.15, .2, 0, tracks); // dozer blade
  const turret = new THREE.Group(); turret.position.y = .58; ex.add(turret);
  add(new THREE.BoxGeometry(1.5, .55, 1.3), matYellow, -.15, .3, 0, turret);
  add(new THREE.BoxGeometry(.5, .5, 1.25), matDark, -.85, .32, 0, turret);
  const cab = add(new THREE.BoxGeometry(.78, .95, .78), matYellow, .05, 1.05, .22, turret);
  add(new THREE.BoxGeometry(.8, .62, .8), matGlass, .05, 1.12, .22, turret);
  add(new THREE.BoxGeometry(.9, .06, .9), matDark, .05, 1.55, .22, turret);
  const boom = new THREE.Group(); boom.position.set(.62, .45, -.25); turret.add(boom);
  add(new THREE.BoxGeometry(1.9, .22, .2), matYellow, .95, 0, 0, boom);
  const arm = new THREE.Group(); arm.position.set(1.9, 0, 0); boom.add(arm);
  add(new THREE.BoxGeometry(1.35, .16, .16), matYellow, .67, 0, 0, arm);
  const bucket = new THREE.Group(); bucket.position.set(1.35, 0, 0); arm.add(bucket);
  add(new THREE.BoxGeometry(.38, .42, .5), matDark, .1, -.16, 0, bucket);
  ex.traverse(o => { if (o.isMesh) o.castShadow = true; });

  // ---------- 3. the base: gravel and a plate compactor ----------
  const gravel = flat(new THREE.CircleGeometry(R_WALL + .2, 96), matGravel, .034);
  const comp = new THREE.Group(); scene.add(comp);
  add(new THREE.BoxGeometry(.6, .07, .5), matDark, 0, .04, 0, comp);
  add(new THREE.BoxGeometry(.34, .3, .34), new THREE.MeshStandardMaterial({color: 0xc23b22, roughness: .5}), 0, .25, 0, comp);
  const hb = add(new THREE.CylinderGeometry(.02, .02, 1.0, 8), matDark, -.42, .58, 0, comp); hb.rotation.z = .9;
  add(new THREE.CylinderGeometry(.025, .025, .4, 8), matDark, -.8, .86, 0, comp).rotation.x = Math.PI / 2;

  // ---------- 4. stone: paver bands and the flagstone field ----------
  const flag = flat(new THREE.RingGeometry(R_FLAG - .01, R_OUT + .01, 128, 4), matFlag, .072);
  const PAV = []; // instanced blocks: {mesh, list:[{x,y,z,ry,sx,sy,sz,a,d}]}
  function blocks(geo, mat, list, colors) {
    const m = new THREE.InstancedMesh(geo, mat, list.length); m.castShadow = m.receiveShadow = true; scene.add(m);
    const c = new THREE.Color(); list.forEach((b, i) => { c.set(colors[Math.floor(Math.abs(Math.sin(i * 91.7 + b.x * 3.1)) * colors.length) % colors.length]); c.offsetHSL(0, 0, (Math.sin(i * 17.3) * .5) * .05); m.setColorAt(i, c); });
    const o = {mesh: m, list, last: -1}; PAV.push(o); return o;
  }
  const bandC = ["#d8cfbf", "#cbbfac", "#e0d8ca", "#bfb3a0", "#d2c6b2"], wallC = ["#d9d0c0", "#cfc4b1", "#e1d9cb", "#c4b8a4"], pitC = ["#bdb3a3", "#cfc5b5", "#b3a998"];
  function ring(r0, r1, len, rows, start, span, radial = true) {
    const out = [], dr = (r1 - r0) / rows;
    for (let k = 0; k < rows; k++) { const r = r0 + dr * (k + .5), n = Math.round(Math.PI * 2 * r / len), off = (k % 2) * .5;
      for (let i = 0; i < n; i++) { const th = (i + off) / n * Math.PI * 2 - Math.PI, x = Math.sin(th) * r, z = -Math.cos(th) * r, d = Math.abs(th) / Math.PI;
        out.push({x, y: .045, z, ry: radial ? Math.PI / 2 - th : -th, a: start + d * span, d}); } }
    return out;
  }
  const inner = blocks(new THREE.BoxGeometry(R_FLAG - R_IN - .02, .07, .19), matPaver, ring(R_IN, R_FLAG, .21, 1, .41, .05), bandC);
  const outer = blocks(new THREE.BoxGeometry((R_EDGE - R_OUT) / 2 - .02, .07, .22), matPaver, ring(R_OUT, R_EDGE, .24, 2, .52, .08), bandC);
  // front landing: pavers running out through the front gap
  const land = []; for (let r = 0; r < 7; r++) for (let c = -3; c <= 3; c++) { const x = c * .3 + (r % 2 ? .15 : 0), z = R_EDGE + .12 + r * .2; if (Math.abs(x) > 1.0) continue; land.push({x, y: .045, z, ry: 0, a: .6 + r * .004}); }
  const landing = blocks(new THREE.BoxGeometry(.28, .07, .18), matPaver, land, bandC);

  // ---------- 5. walls: the fire pit ring and the seat wall, course by course ----------
  const CH = .15, wallList = [], capList = [], pitList = [];
  for (let k = 0; k < 4; k++) { const n = Math.round(Math.PI * 2 * R_WALL / .42);
    for (let i = 0; i < n; i++) { const th = (i + (k % 2) * .5) / n * Math.PI * 2 - Math.PI; if (Math.abs(th) < BACK_GAP || Math.abs(th) > Math.PI - FRONT_GAP) continue;
      const d = Math.abs(th) / Math.PI; wallList.push({x: Math.sin(th) * R_WALL, y: .08 + CH * (k + .5), z: -Math.cos(th) * R_WALL, ry: -th, a: .64 + k * .04 + d * .035, d}); } }
  { const n = Math.round(Math.PI * 2 * R_WALL / .5); for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2 - Math.PI; if (Math.abs(th) < BACK_GAP + .02 || Math.abs(th) > Math.PI - FRONT_GAP - .02) continue;
    const d = Math.abs(th) / Math.PI; capList.push({x: Math.sin(th) * R_WALL, y: .08 + CH * 4 + .035, z: -Math.cos(th) * R_WALL, ry: -th, a: .8 + d * .04, d}); } }
  for (let k = 0; k < 3; k++) { const n = 13; for (let i = 0; i < n; i++) { const th = (i + (k % 2) * .5) / n * Math.PI * 2 - Math.PI, d = Math.abs(th) / Math.PI;
    pitList.push({x: Math.sin(th) * R_PIT, y: .08 + CH * (k + .5), z: -Math.cos(th) * R_PIT, ry: -th, a: .62 + k * .02 + d * .015, d}); } }
  const wall = blocks(new THREE.BoxGeometry(.41, CH - .008, .32), matWall, wallList, wallC);
  const caps = blocks(new THREE.BoxGeometry(.5, .07, .42), matCap, capList, ["#e8dfd0", "#ddd3c2", "#ece5d8"]);
  const pit = blocks(new THREE.BoxGeometry(.38, CH - .008, .26), matWall, pitList, pitC);
  const pitCap = add(new THREE.TorusGeometry(R_PIT, .17, 6, 40), matCap, 0, .08 + CH * 3 + .02, 0); pitCap.rotation.x = Math.PI / 2; pitCap.scale.z = .25;
  const ash = flat(new THREE.CircleGeometry(R_PIT - .12, 32), new THREE.MeshStandardMaterial({color: 0x1b1714, roughness: 1}), .1);
  const coalM = glowMat(0xff6a1a, 1.2); const coals = add(new THREE.CircleGeometry(.42, 24), coalM, 0, .11, 0, scene, false); coals.rotation.x = -Math.PI / 2;

  // ---------- 6. caps, pillars, steps and lights ----------
  const fin = new THREE.Group(); scene.add(fin);
  const lanternM = glowMat(0xffe2b0, 2.2), wallLightM = glowMat(0xffd9a0, 1.8);
  const pillarAt = [BACK_GAP + .045, -(BACK_GAP + .045), Math.PI - FRONT_GAP - .045, -(Math.PI - FRONT_GAP - .045)], pillars = [];
  pillarAt.forEach((th, i) => { const g = new THREE.Group(); g.position.set(Math.sin(th) * R_WALL, 0, -Math.cos(th) * R_WALL); g.rotation.y = -th; fin.add(g);
    const tall = i < 2 ? 1.05 : .82; add(new THREE.BoxGeometry(.62, tall, .56), matWall, 0, tall / 2, 0, g); add(new THREE.BoxGeometry(.74, .08, .68), matCap, 0, tall + .04, 0, g);
    add(new THREE.BoxGeometry(.22, .24, .22), lanternM, 0, tall + .2, 0, g, false); add(new THREE.BoxGeometry(.28, .04, .28), matDark, 0, tall + .34, 0, g);
    pillars.push({g, tall}); });
  // lights tucked under the cap on the inside face, every few blocks
  const wl = []; { const n = 22; for (let i = 0; i < n; i++) { const th = (i + .5) / n * Math.PI * 2 - Math.PI; if (Math.abs(th) < BACK_GAP + .12 || Math.abs(th) > Math.PI - FRONT_GAP - .12) continue;
    const r = R_WALL - .17, m = add(new THREE.BoxGeometry(.16, .04, .02), wallLightM, Math.sin(th) * r, .08 + CH * 4 - .03, -Math.cos(th) * r, fin, false); m.rotation.y = -th; wl.push(m); } }
  const steps = new THREE.Group(); fin.add(steps);
  for (let i = 0; i < 3; i++) { const h = .17 * (i + 1); add(new THREE.BoxGeometry(3.1, h, .42), [matWall, matWall, matCap, matWall, matWall, matWall], 0, h / 2, -(R_WALL + .25) - i * .4, steps); }
  // the lights themselves: a few real ones, the rest is glow and bloom
  pillars.forEach((p, i) => { const wp = new THREE.Vector3(0, p.tall + .25, 0); p.g.localToWorld(wp); lamp(wp.x, wp.y, wp.z, 0xffcf96, i < 2 ? 2.2 : 1.6, 7); });
  for (const th of [-1.7, 1.7, -.9, .9]) lamp(Math.sin(th) * 4.4, .55, -Math.cos(th) * 4.4, 0xffc98a, 1.1, 4.5);
  const fireL = lamp(0, .9, 0, 0xff8a3a, 0, 9); own.pop(); // the fire light is driven on its own below
  const houseL = lamp(0, 2.4, -8.6, 0xffd59a, 1.4, 9);

  // ---------- 7. the fire ----------
  const fireU = {t: {value: 0}, k: {value: 0}};
  const fireM = new THREE.ShaderMaterial({uniforms: fireU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "uniform float t;varying vec2 vU;void main(){vU=uv;vec3 p=position;float h=uv.y;p.x+=sin(t*7.+p.y*9.)*.05*h;p.z+=cos(t*6.+p.y*7.)*.05*h;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}",
    fragmentShader: "uniform float t,k;varying vec2 vU;void main(){float h=vU.y;float f=.75+.25*sin(t*13.+vU.x*40.);vec3 c=mix(vec3(1.,.82,.45),vec3(1.,.36,.06),h);gl_FragColor=vec4(c*1.8,(1.-h)*(1.-h)*k*f*.8);}"});
  const fire = new THREE.Group(); fire.position.y = .12; scene.add(fire);
  for (const [x, z, s, r] of [[0, 0, 1, 0], [.14, .08, .7, 1], [-.13, .05, .75, 2], [.02, -.15, .6, 3]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.24 * s, .95 * s, 14, 6, true), fireM); c.position.set(x, .45 * s, z); c.rotation.y = r; c.renderOrder = 5; fire.add(c); }
  const logM = new THREE.MeshStandardMaterial({color: 0x3a2618, roughness: 1});
  for (const r of [0, 1.1, 2.2]) { const l = add(new THREE.CylinderGeometry(.06, .07, .7, 8), logM, 0, .17, 0); l.rotation.set(Math.PI / 2 - .25, r, 0); }
  const emN = 60, emP = new Float32Array(emN * 3), emS = []; for (let i = 0; i < emN; i++) emS.push(Math.random());
  const emG = new THREE.BufferGeometry(); emG.setAttribute("position", new THREE.BufferAttribute(emP, 3));
  const emM = new THREE.PointsMaterial({color: 0xffa040, size: .05, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending}); scene.add(new THREE.Points(emG, emM));

  // ---------- progress: where each piece is at build progress p ----------
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), vp = new THREE.Vector3(), vs = new THREE.Vector3();
  function layBlocks(o, p, dur = .025, drop = .45) {
    const key = Math.round(p * 4000); if (key === o.last) return false; o.last = key;
    o.list.forEach((b, i) => { const k = lin(b.a, b.a + dur, p), e = 1 - Math.pow(1 - k, 3);
      e3.set(0, b.ry + (1 - e) * .25, 0); q.setFromEuler(e3); vp.set(b.x, b.y + (1 - e) * drop, b.z); const s = k > 0 ? .7 + .3 * e : 0; vs.set(s, s, s);
      m4.compose(vp, q, vs); o.mesh.setMatrixAt(i, m4); });
    o.mesh.instanceMatrix.needsUpdate = true; return true;
  }
  let lastP = -1, exPhase = 0;
  function setProgress(p, t) {
    const changed = Math.abs(p - lastP) > 1e-4; lastP = p;
    gridM.uniforms.k.value = 1 - sm(.1, .2, p);
    sweepU.paint.value = sm(0, .09, p) * 1.001; paint.visible = p < .42;
    stakes.visible = p < .34; stakes.children.forEach((s, i) => { const k = sm(.01 + i * .004, .05 + i * .004, p); s.scale.set(1, Math.max(.001, k), 1); s.position.y = .25 * k; });
    const dig = sm(.13, .28, p); soil.visible = dig > 0 && p < .4; soil.scale.setScalar(Math.max(.001, dig));
    const pk = dig * (1 - sm(.36, .44, p)); pile.visible = pk > .01; pile.scale.set(.4 + .6 * pk, Math.max(.01, pk), .4 + .6 * pk);
    // excavator drives in, digs, drives off
    const inK = sm(.07, .13, p), outK = sm(.28, .34, p); ex.visible = inK > 0 && outK < 1;
    ex.position.set(6.2 + (1 - inK) * 10 + outK * 12, 0, 1.4 - outK * 2); ex.rotation.y = Math.PI * .92;
    const working = p > .12 && p < .29;
    if (working && !reduce) exPhase += .016; const ph = exPhase * 2.2, swing = (Math.sin(ph) * .5 + .5);
    turret.rotation.y = working ? .1 - swing * 1.9 : 0; boom.rotation.z = working ? .15 + Math.sin(ph * 2) * .22 : .5; arm.rotation.z = working ? -1.2 + Math.cos(ph * 2) * .4 : -1.6; bucket.rotation.z = working ? -.6 + Math.sin(ph * 2 + 1) * .5 : -1.2;
    const gv = sm(.29, .37, p); gravel.visible = gv > 0; gravel.scale.setScalar(Math.max(.001, gv));
    const ck = lin(.3, .42, p); comp.visible = ck > 0 && ck < 1; const ca = ck * Math.PI * 7, cr = 4.6 * (1 - ck * .85);
    comp.position.set(Math.sin(ca) * cr, reduce ? 0 : Math.abs(Math.sin(t * 40)) * .012, -Math.cos(ca) * cr); comp.rotation.y = -ca + Math.PI / 2;
    sweepU.flag.value = sm(.45, .58, p) * 1.001; flag.visible = sweepU.flag.value > 0;
    layBlocks(inner, p); layBlocks(outer, p); layBlocks(landing, p, .02); layBlocks(wall, p, .03, .6); layBlocks(caps, p, .03, .5); layBlocks(pit, p, .02, .4);
    pitCap.visible = p > .7; pitCap.scale.setScalar(pitCap.visible ? 1 : .001); pitCap.scale.z = .25;
    ash.visible = coals.visible = p > .66;
    const fk = sm(.8, .9, p); fin.visible = fk > 0;
    pillars.forEach((pl, i) => { const k = sm(.8 + i * .012, .86 + i * .012, p); pl.g.scale.set(1, Math.max(.001, k), 1); });
    steps.scale.set(1, Math.max(.001, sm(.84, .9, p)), 1); wl.forEach(m => m.visible = p > .88);
    if (changed) world.shadows();
    return sm(.86, .95, p);
  }

  // ---------- camera, light and fire every frame ----------
  ctl.enabled = false; ctl.autoRotate = false; ctl.enableDamping = false;
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3(), b0 = new THREE.Vector3(), b1 = new THREE.Vector3(), off = new THREE.Vector3();
  const ease = x => x * x * (3 - 2 * x);
  let intro = reduce ? 1 : 0, fov = 0, vo = "", w = 0, h = 0;
  world.onTick.push((t, dt) => {
    const s = RW.get();
    const lit = setProgress(s.p, t);
    world.setTod(s.tod);
    const night = sm(.6, .9, world.tod);
    own.forEach(([o, base, kind]) => { if (kind === "lamp") o.intensity = base * night * 3.2 * (o === houseL ? 1 : lit); else o.emissiveIntensity = base * (o === winM ? .12 + night * 1.5 : o === coalM ? night * lit : night * lit * 2); });
    const fireK = sm(.75, .92, world.tod) * sm(.9, 1, s.p) * s.fire, fl = reduce ? 1 : .82 + Math.sin(t * 11) * .08 + Math.sin(t * 23.7) * .06;
    fireU.t.value = reduce ? 0 : t; fireU.k.value = fireK; fireL.intensity = fireK * 9 * fl; fire.visible = fireK > .01;
    emM.opacity = fireK * .9; if (fireK > .01 && !reduce) { for (let i = 0; i < emN; i++) { const life = (t * .35 + emS[i]) % 1, a = emS[i] * 40 + t * .6;
      emP[i * 3] = Math.sin(a) * .25 * (1 + life); emP[i * 3 + 1] = .3 + life * 2.4; emP[i * 3 + 2] = Math.cos(a) * .25 * (1 + life); } emG.attributes.position.needsUpdate = true; }
    const A = K[s.a], B = K[s.b], e = ease(s.t);
    a0.fromArray(A[0]); a1.fromArray(A[1]); b0.fromArray(B[0]); b1.fromArray(B[1]);
    pos.lerpVectors(a0, b0, e); tgt.lerpVectors(a1, b1, e);
    let f = A[2] + (B[2] - A[2]) * e;
    RW.yaw += (RW.yawTarget * s.walk - RW.yaw) * Math.min(1, dt * 4);
    const idle = reduce ? 0 : (s.i === 0 ? Math.sin(t * .2) * .06 * (1 - s.t) : 0);
    off.subVectors(pos, tgt).applyAxisAngle(THREE.Object3D.DEFAULT_UP, RW.yaw + idle);
    w = world.host.clientWidth; h = world.host.clientHeight; const asp = w / h, phone = asp < .8, photo = s.photo;
    if (phone) { const k = (asp < .55 ? 1.45 : 1.25), kk = 1 + (k - 1) * (1 - photo); off.multiplyScalar(kk); f += 10 * (1 - photo); }
    if (intro < 1) { intro = Math.min(1, intro + dt / 2.8); const k = 1 - Math.pow(1 - intro, 3); off.multiplyScalar(1 + .25 * (1 - k)); off.y += 2.5 * (1 - k); }
    cam.position.copy(tgt).add(off); ctl.target.copy(tgt); cam.lookAt(tgt);
    // frame the subject: right of the captions on desktop, above them on a phone; centered as it turns into the photo
    const ox = phone ? 0 : -w * (w > 1100 ? .14 : .1) * (1 - photo), oy = phone ? h * (s.walk > .5 ? .18 : s.i === 0 ? .2 - .08 * s.t : .13) * (1 - photo) : 0, key = w + "," + h + "," + ox.toFixed(0) + "," + oy.toFixed(0);
    if (Math.abs(f - fov) > .01 || key !== vo) { fov = f; vo = key; cam.fov = f; cam.setViewOffset(w, h, ox, oy, w, h); cam.updateProjectionMatrix(); }
  });
  world.size(); world.setTodNow(RW.get().tod); setProgress(RW.get().p, 0);
  await world.ready;
  world.setTodNow(RW.get().tod);
  world.start();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return world;
}
