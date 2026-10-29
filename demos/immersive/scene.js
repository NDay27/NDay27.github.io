// Willow Creek Barn: real-time 3D scene for the Immersive demo.
// Everything here is built in code for this page. Lighting uses CC0 HDRI skies
// (Poly Haven, via the @pmndrs/assets package) loaded at runtime from jsDelivr.
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {BokehPass} from "three/addons/postprocessing/BokehPass.js";
import {Sky} from "three/addons/objects/Sky.js";
import {EXRLoader} from "three/addons/loaders/EXRLoader.js";

const canvas=document.getElementById("c"),host=document.querySelector(".scene");
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const small=innerWidth<760||matchMedia("(pointer: coarse)").matches;
let R;try{R=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:"high-performance"})}catch(e){host.classList.add("noGL");throw e}
R.setPixelRatio(Math.min(devicePixelRatio,small?1.1:1.5));
// the sun only moves when the light changes, so the shadow map is redrawn on demand instead of every frame
R.shadowMap.enabled=true;R.shadowMap.autoUpdate=false;R.shadowMap.needsUpdate=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=.9;

const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(34,1,.1,900);cam.position.set(2.5,8.4,74);
const ctl=new OrbitControls(cam,canvas);ctl.target.set(0,4.2,0);ctl.enableDamping=true;ctl.dampingFactor=.06;
ctl.minDistance=16;ctl.maxDistance=90;ctl.minPolarAngle=Math.PI*.28;ctl.maxPolarAngle=Math.PI*.485;ctl.enablePan=false;
ctl.minAzimuthAngle=-1.15;ctl.maxAzimuthAngle=1.15;ctl.autoRotate=!reduce;ctl.autoRotateSpeed=.28;
canvas.addEventListener("pointerdown",()=>{const h=document.getElementById("hint");if(h)h.style.opacity=0});

// ---------------- noise + texture helpers (all original, generated at load) ----------------
const PERM=new Uint8Array(512);for(let i=0;i<256;i++)PERM[i]=i;for(let i=255;i>0;i--){const j=Math.random()*(i+1)|0;[PERM[i],PERM[j]]=[PERM[j],PERM[i]]}for(let i=0;i<256;i++)PERM[i+256]=PERM[i];
const fade=t=>t*t*(3-2*t);
function vn(x,y,p){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,m=v=>((v%p)+p)%p;
  const h=(a,b)=>PERM[PERM[m(a)&255]+(m(b)&255)]/255,u=fade(xf),v=fade(yf);
  return (h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v}
function fbm(x,y,p,o=5){let a=.5,s=0,n=0;for(let i=0;i<o;i++){s+=a*vn(x,y,p);n+=a;x*=2;y*=2;p*=2;a*=.5}return s/n}
// Builds color, height and roughness fields with fn(u,v) -> [r,g,b, height, rough], then derives a normal map.
function pbr(size,fn,rep,normalStrength=2.5){
  const n=size*size,col=new Uint8ClampedArray(n*4),rgh=new Uint8ClampedArray(n*4),hgt=new Float32Array(n);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x,o=fn(x/size,y/size);
    col[i*4]=o[0];col[i*4+1]=o[1];col[i*4+2]=o[2];col[i*4+3]=255;hgt[i]=o[3];const r=o[4]*255;rgh[i*4]=rgh[i*4+1]=rgh[i*4+2]=r;rgh[i*4+3]=255}
  const nrm=new Uint8ClampedArray(n*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const at=(a,b)=>hgt[((b+size)%size)*size+((a+size)%size)];
    const dx=(at(x+1,y)-at(x-1,y))*normalStrength,dy=(at(x,y+1)-at(x,y-1))*normalStrength,l=Math.hypot(dx,dy,1),i=(y*size+x)*4;
    nrm[i]=(-dx/l*.5+.5)*255;nrm[i+1]=(dy/l*.5+.5)*255;nrm[i+2]=(1/l*.5+.5)*255;nrm[i+3]=255}
  const mk=(data,srgb)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=R.capabilities.getMaxAnisotropy();if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t};
  return {map:mk(col,true),normalMap:mk(nrm),roughnessMap:mk(rgh)}}
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

// weathered barn boards: red paint over gray wood, peeling in patches, dark gaps between boards
const BOARDS=8;
const boardTex=pbr(512,(u,v)=>{const bu=u*BOARDS,bi=Math.floor(bu),f=bu-bi,seed=bi*13.7;
  const gap=f<.035||f>.985;const grain=fbm(u*6+seed,v*48,6,5),fine=fbm(u*60,v*6,60,3);
  const peel=fbm(u*5+3.1,v*5+seed*.1,5,5)>.6+.06*Math.sin(bi);const dirt=clamp((1-v)*1.6-1.0)*.35+fbm(u*3,v*3,3,3)*.25;
  if(gap)return[18,12,10,0,1];
  let r,g,b,h,ro;
  if(peel){const w=.55+grain*.45;r=118*w;g=106*w;b=92*w;h=.55+grain*.25;ro=.95}
  else{const w=.78+grain*.25+fine*.08;r=132*w;g=34*w;b=26*w;h=.75+grain*.12;ro=.62+fine*.15}
  const d=1-dirt;return[r*d,g*d,b*d,h,ro]},[3,1],3);
// corrugated galvanized roof with rust streaks
const roofTex=pbr(512,(u,v)=>{const ridge=Math.sin(u*Math.PI*2*16)*.5+.5,rust=fbm(u*4,v*4,4,5)*.8+clamp(v*1.2-.4)*.35,rs=clamp((rust-.55)*4);
  const g=110+ridge*30+fbm(u*40,v*40,40,2)*20;const r=mix(g,128,rs),gg=mix(g*1.03,70,rs),b=mix(g*1.08,40,rs);
  return[r,gg,b,ridge*.9+rs*.05,mix(.32,.9,rs)]},[6,2],4);
// wide-plank floor
const floorTex=pbr(512,(u,v)=>{const pv=v*7,pi=Math.floor(pv),f=pv-pi,gap=f<.03;const g=fbm(u*28+pi*7.3,v*2,28,5);
  if(gap)return[40,26,16,0,1];const w=.7+g*.4+Math.sin(pi*12.9)*.06;return[150*w,104*w,66*w,.8+g*.1,.55+g*.2]},[3,4],2.5);
// gravel path
const gravelTex=pbr(256,(u,v)=>{let h=0,c=[96,88,76];for(let k=0;k<3;k++){const s=12+k*9,cx=u*s,cy=v*s,ix=Math.floor(cx),iy=Math.floor(cy),fx=cx-ix-.5,fy=cy-iy-.5,d=Math.hypot(fx,fy);
  const rnd=PERM[(ix*7+iy*13+k*29)&511]/255;if(d<.32+rnd*.12){h=Math.max(h,1-d*2);const t=60+rnd*90;c=[t+12,t+6,t-4]}}
  return[...c,h,.9]},[1,12],3);
// meadow soil + grass base
const soilTex=pbr(512,(u,v)=>{const g=fbm(u*20,v*20,20,6),m=fbm(u*4,v*4,4,4);const gr=[52+g*40,78+g*55,34+g*20],dirt=[86+g*40,70+g*30,52+g*20],t=clamp((m-.5)*3);
  return[mix(gr[0],dirt[0],t*.5),mix(gr[1],dirt[1],t*.5),mix(gr[2],dirt[2],t*.5),g,.95]},[50,50],2);
// bark
const barkTex=pbr(256,(u,v)=>{const g=fbm(u*10,v*2,10,5),c=fbm(u*30,v*6,30,3);const w=.45+g*.5;const crack=c<.35;return[crack?30:92*w,crack?24:76*w,crack?20:62*w,crack?0:g,.95]},[2,3],4);
// straw for hay bales
const strawTex=pbr(256,(u,v)=>{const s=fbm(u*80,v*6,80,3),g=fbm(u*8,v*8,8,3);const w=.65+s*.5;return[200*w*(0.9+g*.2),168*w,96*w,s,.9]},[3,2],2);

// leaf cluster card (alpha): many small leaves in varied greens, drawn to a canvas
function leafCard(){const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");
  for(let i=0;i<170;i++){const a=Math.random()*Math.PI*2,r=Math.pow(Math.random(),.7)*104,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r*.9,s=7+Math.random()*9;
    g.save();g.translate(x,y);g.rotate(Math.random()*Math.PI*2);const l=40+Math.random()*30;g.fillStyle=`hsl(${85+Math.random()*30},${35+Math.random()*25}%,${l*.55}%)`;
    g.beginPath();g.ellipse(0,0,s,s*.48,0,0,Math.PI*2);g.fill();g.fillStyle="#0002";g.fillRect(-s,-.6,s*2,1.2);g.restore()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const leafT=leafCard();

// ---------------- sky: physical atmosphere + cloud layer + stars ----------------
const sky=new Sky();sky.scale.setScalar(700);sky.renderOrder=-1;scene.add(sky);
// a little grading inside the sky shader: near the horizon the physical model is pale, and a clear Illinois day should read blue
sky.material.uniforms.skyTint={value:new THREE.Color(1,1,1)};sky.material.uniforms.skySat={value:1};
sky.material.fragmentShader=sky.material.fragmentShader.replace("uniform vec3 up;","uniform vec3 up;uniform vec3 skyTint;uniform float skySat;").replace("gl_FragColor = vec4( retColor, 1.0 );","retColor=mix(vec3(dot(retColor,vec3(.299,.587,.114))),retColor,skySat)*skyTint;gl_FragColor = vec4( retColor, 1.0 );");
const su=sky.material.uniforms;su.turbidity.value=5;su.rayleigh.value=2;su.mieCoefficient.value=.005;su.mieDirectionalG.value=.82;
const cloudU={t:{value:0},sunDir:{value:new THREE.Vector3()},lit:{value:new THREE.Color()},dark:{value:new THREE.Color()},amt:{value:1},cov:{value:.5}};
const clouds=new THREE.Mesh(new THREE.SphereGeometry(640,64,32,0,Math.PI*2,0,Math.PI*.5),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,fog:false,uniforms:cloudU,
vertexShader:`varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`uniform float t,amt,cov;uniform vec3 sunDir,lit,dark;varying vec3 v;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
void main(){if(v.y<.02)discard;vec2 uv=v.xz/(v.y+.18)*1.3+vec2(t*.004,t*.002);float d=fbm(uv*1.4);float c=smoothstep(cov,cov+.16,d)*amt;
float edge=smoothstep(.07,.32,v.y);float sl=max(dot(normalize(v),normalize(sunDir)),0.);vec3 col=mix(dark,lit,clamp(.35+.65*fbm(uv*1.4+.25)+pow(sl,6.)*.6,0.,1.4));
gl_FragColor=vec4(col,c*edge*.92);}`}));
scene.add(clouds);
const starG=new THREE.BufferGeometry(),sp=[];for(let i=0;i<1800;i++){const a=Math.random()*Math.PI*2,y=Math.random()*.95+.05,r=Math.sqrt(1-y*y);sp.push(Math.cos(a)*r*600,y*600,Math.sin(a)*r*600)}
starG.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));const starM=new THREE.PointsMaterial({color:0xffffff,size:1.4,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false});scene.add(new THREE.Points(starG,starM));

// ---------------- lights ----------------
const hemi=new THREE.HemisphereLight(0xcfe3ff,0x3a4a2a,.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,3);sun.castShadow=true;sun.shadow.mapSize.set(small?2048:4096,small?2048:4096);
Object.assign(sun.shadow.camera,{left:-46,right:46,top:46,bottom:-46,near:1,far:260});sun.shadow.bias=-.0002;sun.shadow.normalBias=.03;sun.shadow.radius=3;scene.add(sun,sun.target);

// image-based lighting from real CC0 skies (falls back to the procedural sky if the files can't load)
const pmrem=new THREE.PMREMGenerator(R);const envs={};
const hdris={day:"park",golden:"sunset",night:"night"};
Promise.all(Object.entries(hdris).map(async([k,name])=>{try{const m=await import(`@pmndrs/assets/hdri/${name}.exr.js`);const tex=await new EXRLoader().loadAsync(m.default);tex.mapping=THREE.EquirectangularReflectionMapping;envs[k]=pmrem.fromEquirectangular(tex).texture;tex.dispose()}catch(e){}})).then(()=>applyTod(true));

// ---------------- ground ----------------
const groundM=new THREE.MeshStandardMaterial({...soilTex,roughness:1,envMapIntensity:.5});
const ground=new THREE.Mesh(new THREE.CircleGeometry(560,96),groundM);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const pathM=new THREE.MeshStandardMaterial({...gravelTex,roughness:1,envMapIntensity:.4});
const path=new THREE.Mesh(new THREE.PlaneGeometry(4.6,44),pathM);path.rotation.x=-Math.PI/2;path.position.set(0,.03,39);path.receiveShadow=true;scene.add(path);
const hillFog={value:new THREE.Color(0x9fb8cf)};
// distant hills: two rings so the horizon has depth (the fog fades the far one more)
for(const [r,base,amp,col,ph] of [[520,14,1,0x2f4a2c,0],[330,6,.45,0x2a3f26,2.1]]){const hg=new THREE.CylinderGeometry(r,r,1,240,1,true),hp=hg.attributes.position;
 for(let i=0;i<hp.count;i++){const a=Math.atan2(hp.getZ(i),hp.getX(i))+ph,top=Math.max(1.5,base+amp*(Math.sin(a*4)*9+Math.sin(a*11+1)*4+Math.sin(a*27)*1.5));hp.setY(i,hp.getY(i)>0?top:-.5)}
 hg.computeVertexNormals();const hmM=new THREE.MeshStandardMaterial({color:col,roughness:1,side:THREE.BackSide});
 // the hills fade into their own haze color, so at golden hour they go dusky mauve instead of the warm ground fog
 hmM.onBeforeCompile=sh=>{sh.uniforms.hillFog=hillFog;sh.fragmentShader="uniform vec3 hillFog;\n"+sh.fragmentShader.replace("#include <fog_fragment>",THREE.ShaderChunk.fog_fragment.replace(/fogColor/g,"hillFog"))};
 scene.add(new THREE.Mesh(hg,hmM))}

// ---------------- the barn ----------------
const W=22,D=34,H=7;const barn=new THREE.Group();scene.add(barn);
const wallM=new THREE.MeshStandardMaterial({...boardTex,side:THREE.DoubleSide,envMapIntensity:.6});
const trimM=new THREE.MeshStandardMaterial({color:0xe6dfd0,roughness:.75,envMapIntensity:.35});
const beamM=new THREE.MeshStandardMaterial({...barkTex,color:0x9a7a5a,roughness:.9,envMapIntensity:.4});
beamM.map=null;
const roofM=new THREE.MeshStandardMaterial({...roofTex,metalness:.75,envMapIntensity:1});
function box(w,h,d,m,x,y,z,parent=barn){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;parent.add(b);return b}
// UVs on side walls: scale so boards stay the same width everywhere
function wall(w,h,d,x,y,z){const b=box(w,h,d,wallM,x,y,z);const uv=b.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.max(w,d)/8,uv.getY(i)*h/7);return b}
wall(.4,H,D,-W/2,H/2,0);wall(.4,H,D,W/2,H/2,0);
const prof=new THREE.Shape();prof.moveTo(-W/2,0);prof.lineTo(W/2,0);prof.lineTo(W/2,H);prof.lineTo(W/2-3,H+4.2);prof.lineTo(0,H+6.6);prof.lineTo(-W/2+3,H+4.2);prof.lineTo(-W/2,H);prof.lineTo(-W/2,0);
function shapeWall(shape,z,flip){const g=new THREE.ShapeGeometry(shape);const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(p.getX(i)+W/2)/8,p.getY(i)/7);const m=new THREE.Mesh(g,wallM);m.position.z=z;if(flip)m.rotation.y=Math.PI;m.castShadow=m.receiveShadow=true;barn.add(m);return m}
shapeWall(prof,-D/2);
const gab=new THREE.Shape();gab.moveTo(-W/2,H);gab.lineTo(W/2,H);gab.lineTo(W/2-3,H+4.2);gab.lineTo(0,H+6.6);gab.lineTo(-W/2+3,H+4.2);gab.lineTo(-W/2,H);
shapeWall(gab,D/2);
// hayloft door with X trim on the front gable
const loft=box(3.2,3,.2,wallM,0,H+2.2,D/2+.12);[[.95],[-.95]].forEach(([r])=>{const x=new THREE.Mesh(new THREE.BoxGeometry(4.2,.22,.08),trimM);x.rotation.z=r;x.position.z=.12;loft.add(x)});
box(3.6,.24,.1,trimM,0,H+3.75,D/2+.2);box(3.6,.24,.1,trimM,0,H+.65,D/2+.2);box(.24,3.2,.1,trimM,-1.7,H+2.2,D/2+.2);box(.24,3.2,.1,trimM,1.7,H+2.2,D/2+.2);
// sliding doors pushed open, with trim
const doors=[];[-1,1].forEach(s=>{const d=box(5,H-.2,.25,wallM,s*(W/2+2.3),H/2,D/2+.45);[.95,-.95].forEach(r=>{const x=new THREE.Mesh(new THREE.BoxGeometry(5.6,.25,.1),trimM);x.rotation.z=r;x.position.z=.15;d.add(x)});
  [[0,H/2-.2-.12,5,.24],[0,-H/2+.2+.12,5,.24]].forEach(([x,y,w,h])=>{const t=new THREE.Mesh(new THREE.BoxGeometry(w,h,.1),trimM);t.position.set(x,y,.15);d.add(t)});
  [-2.4,2.4].forEach(x=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.24,H-.2,.1),trimM);t.position.set(x,0,.15);d.add(t)});doors.push(d)});
box(W+12,.3,.3,beamM,0,H+.15,D/2+.62);
// corner + eave trim
[[-W/2,D/2],[W/2,D/2],[-W/2,-D/2],[W/2,-D/2]].forEach(([x,z])=>box(.5,H,.5,trimM,x,H/2,z));
box(.5,.4,D,trimM,-W/2,H-.1,0);box(.5,.4,D,trimM,W/2,H-.1,0);
// side windows with warm interior glow at night
const glassM=new THREE.MeshStandardMaterial({color:0x1a2230,roughness:.05,metalness:.2,emissive:0xffb060,emissiveIntensity:0,envMapIntensity:1.2});
for(let z=-D/2+5;z<D/2-3;z+=6)[-1,1].forEach(s=>{const g=box(.08,1.6,2.2,glassM,s*(W/2+.22),4.4,z);g.castShadow=false;
  box(.12,.18,2.6,trimM,s*(W/2+.26),5.3,z);box(.12,.18,2.6,trimM,s*(W/2+.26),3.5,z);box(.12,1.9,.18,trimM,s*(W/2+.26),4.4,z-1.2);box(.12,1.9,.18,trimM,s*(W/2+.26),4.4,z+1.2);box(.12,1.6,.1,trimM,s*(W/2+.26),4.4,z)});
// roof panels following the gambrel profile, with corrugation running down the slope
function panel(x1,y1,x2,y2){const len=Math.hypot(x2-x1,y2-y1),g=new THREE.BoxGeometry(len+.7,.18,D+1.8);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(D/24),uv.getY(i)*(len/6));
  const p=new THREE.Mesh(g,roofM);p.position.set((x1+x2)/2,(y1+y2)/2+.12,0);p.rotation.z=Math.atan2(y2-y1,x2-x1);p.castShadow=p.receiveShadow=true;barn.add(p)}
panel(-W/2-.45,H-.35,-W/2+3,H+4.2);panel(-W/2+3,H+4.2,0,H+6.6);panel(0,H+6.6,W/2-3,H+4.2);panel(W/2-3,H+4.2,W/2+.45,H-.35);
box(.5,.5,D+1.9,roofM,0,H+6.75,0);
// cupola with louvers and weathervane
box(2.4,2.1,2.4,trimM,0,H+7.6,0);for(let i=0;i<5;i++){box(1.9,.08,.05,beamM,0,H+7.1+i*.22,1.23);box(1.9,.08,.05,beamM,0,H+7.1+i*.22,-1.23)}
const cap=new THREE.Mesh(new THREE.ConeGeometry(2.1,1.2,4),roofM);cap.position.set(0,H+9.25,0);cap.rotation.y=Math.PI/4;cap.castShadow=true;barn.add(cap);
const vane=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.6),new THREE.MeshStandardMaterial({color:0x222,metalness:.8,roughness:.4}));vane.position.set(0,H+10.6,0);barn.add(vane);
const arrow=new THREE.Mesh(new THREE.BoxGeometry(1.4,.08,.04),vane.material);arrow.position.set(0,H+11.1,0);barn.add(arrow);
// floor, posts, tie beams, rafters
const floor=new THREE.Mesh(new THREE.PlaneGeometry(W-.4,D-.4),new THREE.MeshStandardMaterial({...floorTex,envMapIntensity:.5}));floor.rotation.x=-Math.PI/2;floor.position.y=.06;floor.receiveShadow=true;barn.add(floor);
const postM=new THREE.MeshStandardMaterial({color:0x6b4a2e,roughness:.85,envMapIntensity:.4});
for(let z=-D/2+4;z<D/2;z+=6){box(.5,H,.5,postM,-W/2+.6,H/2,z);box(.5,H,.5,postM,W/2-.6,H/2,z);box(W-1,.45,.45,postM,0,H-.3,z);
  [-1,1].forEach(s=>{const r=box(.3,7.2,.3,postM,s*(W/4+.5),H+2.6,z);r.rotation.z=s*.9})}

// ---------------- Edison string lights ----------------
const bulbM=new THREE.MeshStandardMaterial({color:0xffe2b0,emissive:0xffa94d,emissiveIntensity:0,roughness:.2});
const wireM=new THREE.LineBasicMaterial({color:0x111111});
const bulbG=new THREE.SphereGeometry(.085,10,8);bulbG.scale(1,1.35,1);const bulbs=[];
function strand(a,b,sag,n,parent=barn){const pts=[];for(let i=0;i<=n;i++){const t=i/n,p=a.clone().lerp(b,t);p.y-=sag*4*t*(1-t);pts.push(p.clone());const m=new THREE.Mesh(bulbG,bulbM);m.position.copy(p).y-=.14;parent.add(m);bulbs.push(m)}
  parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wireM))}
for(let z=-D/2+2;z<D/2;z+=3)strand(new THREE.Vector3(-W/2+.8,H-.4,z),new THREE.Vector3(W/2-.8,H-.4,z),1.3,20);
const poleM=postM;[-3.2,3.2].forEach(x=>{for(let z=D/2+6;z<=D/2+22;z+=8){const p=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,4.8,10),poleM);p.position.set(x,2.4,z);p.castShadow=true;scene.add(p)}});
[-3.2,3.2].forEach(x=>{strand(new THREE.Vector3(x,4.6,D/2+.7),new THREE.Vector3(x,4.6,D/2+6),.5,9,scene);strand(new THREE.Vector3(x,4.6,D/2+6),new THREE.Vector3(x,4.6,D/2+14),.8,14,scene);strand(new THREE.Vector3(x,4.6,D/2+14),new THREE.Vector3(x,4.6,D/2+22),.8,14,scene)});
strand(new THREE.Vector3(-3.2,4.6,D/2+14),new THREE.Vector3(3.2,4.6,D/2+14),.9,10,scene);
const warm=[];for(let z=-D/2+6;z<D/2;z+=11){const l=new THREE.PointLight(0xffa850,0,30,1.7);l.position.set(0,H-1.6,z);barn.add(l);warm.push(l)}
const porch=new THREE.PointLight(0xffa850,0,22,1.8);porch.position.set(0,4,D/2+10);scene.add(porch);

// lanterns along the path
const lanternM=new THREE.MeshStandardMaterial({color:0xfff0c8,emissive:0xffa040,emissiveIntensity:0,roughness:.3});
for(let z=D/2+4;z<D/2+24;z+=4)[-2.7,2.7].forEach(x=>{const g=new THREE.Group();const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.9,8),new THREE.MeshStandardMaterial({color:0x1d1d1d,metalness:.6,roughness:.5}));post.position.y=.45;g.add(post);
  const l=new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.22),lanternM);l.position.y=1.0;g.add(l);const c=new THREE.Mesh(new THREE.ConeGeometry(.2,.14,4),post.material);c.position.y=1.22;c.rotation.y=Math.PI/4;g.add(c);g.position.set(x,0,z);g.traverse(o=>o.castShadow=true);scene.add(g)});

// split-rail fence and hay bales
const railM=new THREE.MeshStandardMaterial({color:0x8a7356,roughness:.95,envMapIntensity:.4});
function fenceRun(x1,z1,x2,z2){const len=Math.hypot(x2-x1,z2-z1),n=Math.ceil(len/3.2),a=Math.atan2(z2-z1,x2-x1);for(let i=0;i<=n;i++){const t=i/n,p=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,1.4,7),railM);p.position.set(mix(x1,x2,t),.7,mix(z1,z2,t));p.castShadow=true;scene.add(p)}
  [.55,1.05].forEach(y=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,len,6),railM);r.rotation.z=Math.PI/2;r.rotation.y=-a;r.position.set((x1+x2)/2,y,(z1+z2)/2);r.castShadow=true;scene.add(r)})}
fenceRun(-4.4,D/2+25,-36,D/2+25);fenceRun(4.4,D/2+25,36,D/2+25);fenceRun(-36,D/2+25,-38,D/2-14);fenceRun(36,D/2+25,38,D/2-14);
const hayM=new THREE.MeshStandardMaterial({...strawTex,envMapIntensity:.5});
[[-7,D/2+7,.3],[-8.6,D/2+8.2,1.2],[7.4,D/2+6.5,-.4],[-6.4,D/2+9.5,.9]].forEach(([x,z,r])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,1.3,24),hayM);b.rotation.set(Math.PI/2,0,r);b.position.set(x,.8,z);b.castShadow=b.receiveShadow=true;scene.add(b)});

// ---------------- trees: bark trunks + instanced leaf cards that sway ----------------
const trunkM=new THREE.MeshStandardMaterial({...barkTex,envMapIntensity:.4});
const leafCards=[],leafCol=[];const palettes=[[.27,.45,.28],[.25,.5,.32],[.22,.45,.36],[.1,.6,.42],[.07,.55,.4],[.14,.5,.38]];
function tree(x,z,s){const hT=(3.4+Math.random()*1.4)*s;const t=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.42*s,hT,10),trunkM);t.position.set(x,hT/2,z);t.castShadow=true;scene.add(t);
  for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.06*s,.14*s,2.2*s,7),trunkM);const a=Math.random()*Math.PI*2;b.position.set(x+Math.cos(a)*.6*s,hT*.75+i*.35*s,z+Math.sin(a)*.6*s);b.rotation.set(Math.sin(a)*.8,0,-Math.cos(a)*.8);b.castShadow=true;scene.add(b)}
  const pal=palettes[Math.random()*palettes.length|0],cy=hT+1.6*s,rx=2.6*s,ry=2.4*s,n=Math.round(70*s);
  for(let i=0;i<n;i++){const u=Math.random()*2-1,th=Math.random()*Math.PI*2,rr=Math.cbrt(Math.random())*.9,sq=Math.sqrt(1-u*u);
    leafCards.push([x+Math.cos(th)*sq*rx*rr,cy+u*ry*rr,z+Math.sin(th)*sq*rx*rr,s*(1.3+Math.random()*.7)]);const c=new THREE.Color().setHSL(pal[0]+Math.random()*.04,pal[1],pal[2]*(.75+Math.random()*.5));leafCol.push(c)}}
for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=40+Math.random()*90,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>14&&Math.abs(x)<80)continue;tree(x,z,.85+Math.random()*.8)}
[[-30,-2,1.4],[28,-12,1.6],[-24,-26,1.2],[33,8,1.3],[-40,14,1.5],[44,20,1.2]].forEach(a=>tree(...a));
const leafU={t:{value:0}};
const leafM=new THREE.MeshStandardMaterial({map:leafT,alphaTest:.45,side:THREE.DoubleSide,roughness:.85,envMapIntensity:.5});
leafM.onBeforeCompile=sh=>{sh.uniforms.t=leafU.t;sh.vertexShader="uniform float t;\n"+sh.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
  vec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);float sw=sin(t*1.1+wp0.x*.2+wp0.z*.15)*.12+sin(t*2.3+wp0.y)*.05;transformed.x+=sw*(1.+position.y);transformed.z+=sw*.6;`)};
const leafDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:leafT,alphaTest:.45});
const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafM,leafCards.length);leaves.customDepthMaterial=leafDepth;
{const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();leafCards.forEach((c,i)=>{e.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);q.setFromEuler(e);m.compose(new THREE.Vector3(c[0],c[1],c[2]),q,new THREE.Vector3(c[3],c[3],c[3]));leaves.setMatrixAt(i,m);leaves.setColorAt(i,leafCol[i])})}
leaves.castShadow=true;leaves.receiveShadow=true;scene.add(leaves);

// ---------------- grass: tapered instanced blades with wind ----------------
const bladeG=new THREE.PlaneGeometry(.1,1,1,5);{const p=bladeG.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)+.5;p.setX(i,p.getX(i)*(1-y*.92));p.setY(i,y)}}
const grassU={t:{value:0}};
const bladeM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,side:THREE.DoubleSide,envMapIntensity:.35});
bladeM.onBeforeCompile=sh=>{sh.uniforms.t=grassU.t;sh.vertexShader="uniform float t;varying float vH;\n"+sh.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
 vH=position.y;vec4 wp=instanceMatrix*vec4(0.,0.,0.,1.);float g=sin(t*.6+wp.x*.05)*.5+.5;float w=(sin(t*1.7+wp.x*.35+wp.z*.25)*.45+sin(t*2.9+wp.z*.6)*.2)*(.4+g);float h=position.y;transformed.x+=w*h*h*.5;transformed.z+=w*h*h*.25;`);
 sh.fragmentShader="varying float vH;\n"+sh.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\n diffuseColor.rgb*=mix(.35,1.25,vH);")};
const NB=reduce?8000:(small?14000:42000),grass=new THREE.InstancedMesh(bladeG,bladeM,NB);
{const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e3=new THREE.Euler(),col=new THREE.Color();let n=0;
 for(let i=0;n<NB&&i<NB*4;i++){const r=Math.sqrt(Math.random())*70,a=Math.random()*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r+10;
  if(Math.abs(x)<W/2+1.2&&Math.abs(z)<D/2+1.2)continue;if(Math.abs(x)<2.8&&z>D/2&&z<D/2+28)continue;
  e3.set((Math.random()-.5)*.35,Math.random()*Math.PI,(Math.random()-.5)*.35);q.setFromEuler(e3);const sc=.3+Math.random()*.5;m4.compose(new THREE.Vector3(x,0,z),q,new THREE.Vector3(1,sc,1));grass.setMatrixAt(n,m4);
  col.setHSL(.2+Math.random()*.09,.38+Math.random()*.2,.32+Math.random()*.14);grass.setColorAt(n,col);n++}grass.count=n}
const grassN=grass.count;
grass.receiveShadow=true;scene.add(grass);

// fireflies at night
const ffN=220,ffP=new Float32Array(ffN*3);for(let i=0;i<ffN;i++){ffP[i*3]=(Math.random()-.5)*90;ffP[i*3+1]=.4+Math.random()*3.5;ffP[i*3+2]=(Math.random()-.5)*90+10}
const ffG=new THREE.BufferGeometry();ffG.setAttribute("position",new THREE.BufferAttribute(ffP,3));const ffM=new THREE.PointsMaterial({color:0xfff3a0,size:.16,transparent:true,opacity:0,depthWrite:false});scene.add(new THREE.Points(ffG,ffM));

// ---------------- furniture layouts ----------------
const furn=new THREE.Group();barn.add(furn);
const woodChairM=new THREE.MeshStandardMaterial({color:0x7a5236,roughness:.6,envMapIntensity:.5}),clothM=new THREE.MeshStandardMaterial({color:0xece6d8,roughness:.95,envMapIntensity:.3}),
 greenM=new THREE.MeshStandardMaterial({color:0x4f7d47,roughness:.9}),roseM=new THREE.MeshStandardMaterial({color:0xe8b4b8,roughness:.8}),
 floorGlow=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xff8cc8,emissiveIntensity:0,roughness:.15,metalness:.4}),candleM=new THREE.MeshStandardMaterial({color:0xfff2d0,emissive:0xffaa55,emissiveIntensity:0});
const chairParts=(()=>{const g=new THREE.Group();const seat=new THREE.Mesh(new THREE.BoxGeometry(.46,.05,.44),woodChairM);seat.position.y=.46;g.add(seat);
 [[-.2,-.19],[.2,-.19],[-.2,.19],[.2,.19]].forEach(([x,z])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.46,6),woodChairM);l.position.set(x,.23,z);g.add(l)});
 const back=new THREE.Mesh(new THREE.BoxGeometry(.46,.5,.04),woodChairM);back.position.set(0,.74,-.2);g.add(back);for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.42,5),woodChairM);s.position.set(-.15+i*.1,.72,-.2);g.add(s)}g.traverse(o=>o.castShadow=true);return g})();
const candles=[];
function chair(x,z,ry){const c=chairParts.clone();c.position.set(x,0,z);c.rotation.y=ry||0;furn.add(c)}
function table(x,z){const t=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.12,.78,32),clothM);t.position.set(x,.39,z);t.castShadow=t.receiveShadow=true;furn.add(t);
  const vase=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),greenM);vase.position.set(x,.86,z);furn.add(vase);
  const cd=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.22,10),candleM);cd.position.set(x+.28,.9,z);furn.add(cd);candles.push(cd);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;chair(x+Math.cos(a)*1.5,z+Math.sin(a)*1.5,-a-Math.PI/2)}}
function arch(z){const g=new THREE.Group();const tor=new THREE.Mesh(new THREE.TorusGeometry(2.4,.09,10,40,Math.PI),postM);tor.position.y=2.6;g.add(tor);
  for(let i=0;i<60;i++){const a=Math.random()*Math.PI,f=new THREE.Mesh(new THREE.IcosahedronGeometry(.12+Math.random()*.16,1),Math.random()<.35?roseM:greenM);f.position.set(Math.cos(a)*2.4+(Math.random()-.5)*.3,2.6+Math.sin(a)*2.4+(Math.random()-.5)*.3,(Math.random()-.5)*.3);g.add(f)}
  [-2.4,2.4].forEach(x=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2.6,10),postM);l.position.set(x,1.3,0);g.add(l)});g.traverse(o=>o.castShadow=true);g.position.z=z;furn.add(g)}
const chairGeometry=new Set();chairParts.traverse(o=>{if(o.geometry)chairGeometry.add(o.geometry)});
let builtLayout,builtGuests;
function build(){const S=window.VENUE;if(S.layout===builtLayout&&S.guests===builtGuests){applyTod(true);return}
  const obsolete=new Set();furn.traverse(o=>{if(o.geometry&&!chairGeometry.has(o.geometry))obsolete.add(o.geometry)});obsolete.forEach(g=>g.dispose());furn.clear();candles.length=0;const g=S.guests;
  builtLayout=S.layout;builtGuests=S.guests;
  if(S.layout==="ceremony"){arch(-D/2+3.5);const rows=Math.ceil(g/10);for(let r=0;r<rows;r++){const z=-D/2+7.5+r*1.15;if(z>D/2-1)break;for(let s=0;s<5;s++){chair(-1.7-s*.6,z,Math.PI);chair(1.7+s*.6,z,Math.PI)}}}
  else{const n=Math.ceil(g/8),dance=S.layout==="dance";
    if(dance){const f=new THREE.Mesh(new THREE.BoxGeometry(9,.06,11),floorGlow);f.position.set(0,.09,-2);f.receiveShadow=true;furn.add(f);box(4,1.1,1.2,postM,0,.55,-D/2+2,furn)}
    else{const head=new THREE.Mesh(new THREE.BoxGeometry(9,.78,1.3),clothM);head.position.set(0,.39,-D/2+2.5);head.castShadow=true;furn.add(head);for(let i=0;i<10;i++)chair(-4+i*.9,-D/2+3.5,Math.PI)}
    const spots=[];for(let z=-D/2+6;z<D/2-2;z+=4)for(const x of[-7.4,-3.7,0,3.7,7.4]){if(dance&&Math.abs(x)<5&&z<4.5&&z>-8.5)continue;spots.push([x,z])}
    for(let i=0;i<Math.min(n,spots.length);i++)table(spots[i][0],spots[i][1])}
  applyTod(true)}

// ---------------- time of day ----------------
const C=h=>new THREE.Color(h);
const K=[{t:0,elev:48,az:-35,sunC:C(0xfff4e6),sunI:5,hemi:.45,turb:1.6,ray:2.6,mie:.0025,tint:C(0xc2dbff),sat:1.5,exp:.5,warm:0,bulb:0,lan:0,glass:0,ff:0,stars:0,cl:C(0xffffff),cd:C(0xb9c6d8),camt:.9,cov:.6,fog:C(0x9fb8cf),hf:C(0x9fb8cf),fogN:220,env:"day",envI:1.6},
{t:.55,elev:3.5,az:-62,sunC:C(0xffa860),sunI:2.4,hemi:.18,turb:7,ray:2.6,mie:.005,tint:C(0xffffff),sat:1.1,exp:.85,warm:12,bulb:3.5,lan:1.5,glass:.35,ff:0,stars:0,cl:C(0xffc79a),cd:C(0x7a5a6e),camt:.95,cov:.5,fog:C(0xd6a27a),hf:C(0x8c7480),fogN:120,env:"golden",envI:.75},
{t:1,elev:28,az:40,sunC:C(0x9db2ff),sunI:.55,hemi:.12,turb:1,ray:.3,mie:.005,tint:C(0xffffff),sat:1,exp:.95,warm:18,bulb:6,lan:3.5,glass:1.6,ff:1,stars:1,cl:C(0x2a3044),cd:C(0x0c0f18),camt:.55,cov:.52,fog:C(0x0b0f1c),hf:C(0x0b0f1c),fogN:90,env:"night",envI:.35}];
let todNow=window.VENUE?window.VENUE.tod:.55,todTarget=todNow;
function key(t){const a=t>.55?K[1]:K[0],b=t>.55?K[2]:K[1],k=(t-a.t)/(b.t-a.t||1),L=(x,y)=>x+(y-x)*k,LC=(x,y)=>x.clone().lerp(y,k);
  const o={};for(const n in a){const v=a[n];o[n]=v instanceof THREE.Color?LC(v,b[n]):typeof v==="number"?L(v,b[n]):(k<.5?v:b[n])}return o}
const sunDir=new THREE.Vector3();
function applyTod(){const k=key(todNow);R.shadowMap.needsUpdate=true;
  // the visible sun sits low for golden hour; at night the physical sky is shown with the sun below the horizon
  const skyElev=todNow>.75?mix(3.5,-12,(todNow-.55)/.45):k.elev;
  const phi=THREE.MathUtils.degToRad(90-skyElev),th=THREE.MathUtils.degToRad(k.az);sunDir.setFromSphericalCoords(1,phi,th);su.sunPosition.value.copy(sunDir);su.turbidity.value=k.turb;su.rayleigh.value=k.ray;su.mieCoefficient.value=k.mie;su.skyTint.value.copy(k.tint);su.skySat.value=k.sat;
  const lphi=THREE.MathUtils.degToRad(90-Math.max(k.elev,4));const ld=new THREE.Vector3().setFromSphericalCoords(1,lphi,th);sun.position.copy(ld).multiplyScalar(120);sun.target.position.set(0,0,0);
  sun.color.copy(k.sunC);sun.intensity=k.sunI;hemi.intensity=k.hemi;R.toneMappingExposure=k.exp;
  // bloom runs before exposure, so its threshold scales with it: a bright day sky must not glow, the bulbs at dusk should
  bloom.threshold=1.5/k.exp;bloom.strength=.28+.24*Math.min(1,k.warm/12);
  cloudU.sunDir.value.copy(sunDir);cloudU.lit.value.copy(k.cl);cloudU.dark.value.copy(k.cd);cloudU.amt.value=k.camt;cloudU.cov.value=k.cov;starM.opacity=k.stars;
  warm.forEach(l=>l.intensity=k.warm);porch.intensity=k.warm*.5;bulbM.emissiveIntensity=k.bulb;candleM.emissiveIntensity=k.bulb*.6;lanternM.emissiveIntensity=k.lan;glassM.emissiveIntensity=k.glass;floorGlow.emissiveIntensity=k.bulb*.12;ffM.opacity=k.ff*.9;
  if(!scene.fog)scene.fog=new THREE.Fog(0,1,650);scene.fog.color.copy(k.fog);hillFog.value.copy(k.hf);scene.fog.near=k.fogN;const e=envs[k.env];if(e&&scene.environment!==e)scene.environment=e;
  scene.traverse(o=>{if(o.material&&o.material.envMapIntensity!==undefined){o.material.userData.base??=o.material.envMapIntensity;o.material.envMapIntensity=o.material.userData.base*k.envI}})}

// ---------------- post-processing ----------------
const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:small?0:4});
const comp=new EffectComposer(R,rt);comp.addPass(new RenderPass(scene,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.5,.45,1.6);comp.addPass(bloom);
let bokeh=null;if(!reduce){bokeh=new BokehPass(scene,cam,{focus:60,aperture:.00009,maxblur:.0055});comp.addPass(bokeh)}
comp.addPass(new OutputPass());
const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},t:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`uniform sampler2D tDiffuse;uniform float t;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 d=vUv-.5;vec3 c;c.r=texture2D(tDiffuse,vUv+d*.0016).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-d*.0016).b;
float v=smoothstep(.9,.25,length(d));c*=mix(.62,1.,v);c=mix(c,c*vec3(1.03,1.,.95),.6);float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.06);
c+=(h(vUv*vec2(1920.,1080.)+t)-.5)*.02;gl_FragColor=vec4(c,1.);}`});comp.addPass(grade);

function size(){const w=host.clientWidth,h=host.clientHeight;R.setSize(w,h,false);comp.setSize(w,h);cam.aspect=w/h;cam.fov=w<700?52:34;
  cam.setViewOffset(w,h,w>=900?-w*.15:0,w<700?-h*.06:0,w,h);if(w<700&&!size.done){cam.position.set(5,9,100);ctl.maxDistance=112;size.done=1}cam.updateProjectionMatrix()}
addEventListener("resize",size);size();

// ---------------- quality tiers: start sensible for the device, step down if it can't hold about 42 fps ----------------
const Q=[{dpr:.75,ms:0,sh:1024,dof:false,grass:.45},{dpr:1.1,ms:2,sh:2048,dof:false,grass:.7},{dpr:1.5,ms:4,sh:4096,dof:true,grass:1}];
let qi=small?1:2;
function applyQ(){const q=Q[qi],pr=Math.min(devicePixelRatio,q.dpr);R.setPixelRatio(pr);comp.setPixelRatio(pr);
  [comp.renderTarget1,comp.renderTarget2].forEach(t=>{if(t.samples!==q.ms){t.samples=q.ms;t.dispose()}});
  if(sun.shadow.mapSize.x!==q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}R.shadowMap.needsUpdate=true;
  if(bokeh)bokeh.enabled=q.dof;grass.count=Math.floor(grassN*q.grass);size()}
applyQ();
addEventListener("venue",()=>{todTarget=window.VENUE.tod;build()});
build();applyTod();

// cinematic fly-in, then a slow drift; any drag hands control to the visitor
let intro=reduce?1:0;const introTo=cam.position.clone(),introFrom=introTo.clone().add(new THREE.Vector3(-26,9,22)),maxD=ctl.maxDistance;
if(!reduce){cam.position.copy(introFrom);ctl.maxDistance=400}
function introDone(){intro=1;ctl.maxDistance=maxD;window.__venueIntroDone=true}
canvas.addEventListener("pointerdown",introDone);
let vis=true;new IntersectionObserver(e=>{vis=e[0].isIntersecting}).observe(host);
const clock=new THREE.Clock(),tmp=new THREE.Vector3();
let pf=0,pacc=0,pn=0;
(function loop(){requestAnimationFrame(loop);if(!vis){clock.getDelta();pf=0;return}const raw=clock.getDelta(),dt=Math.min(raw,.05),t=clock.elapsedTime;
  // frame-time watch: skip the first frames (shaders compile), ignore long gaps (tab switches), then average 75 frames
  if(raw>.25)pf=0;else if(++pf>45&&qi>0){pacc+=raw;if(++pn>=75){if(pacc/pn>1/42){qi--;applyQ();pf=0}pacc=0;pn=0}}
  const motionTime=reduce?0:t;grassU.t.value=motionTime;leafU.t.value=motionTime;cloudU.t.value=motionTime;grade.uniforms.t.value=motionTime%100;
  if(intro<1){intro=Math.min(1,intro+dt/3.6);const e=1-Math.pow(1-intro,3);cam.position.lerpVectors(introFrom,introTo,e);if(intro>=1)introDone()}
  if(Math.abs(todTarget-todNow)>.002){todNow+=(todTarget-todNow)*Math.min(1,dt*2.4);applyTod()}
  if(!reduce&&ffM.opacity>0){const p=ffG.attributes.position.array;for(let i=0;i<ffN;i++){p[i*3+1]+=Math.sin(t*1.3+i)*.004;p[i*3]+=Math.cos(t*.7+i)*.006}ffG.attributes.position.needsUpdate=true}
  if(!reduce)candles.forEach((c,i)=>c.scale.y=1+Math.sin(t*9+i)*.08);
  const az=ctl.getAzimuthalAngle();if(az>.55&&ctl.autoRotateSpeed<0||az<-.55&&ctl.autoRotateSpeed>0)ctl.autoRotateSpeed*=-1;
  ctl.update();if(bokeh)bokeh.uniforms.focus.value=cam.position.distanceTo(tmp.set(0,3,8));comp.render()})();
window.__venueReady=true;
