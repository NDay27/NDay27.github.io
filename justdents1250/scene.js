// Just Dents of Illinois: real-time 3D hood for the Immersive sample.
// The hood, the hail and the light board are built in code for this page. The shop and street lighting are
// free CC0 HDRIs from Poly Haven (Autoshop 01 and Wide Street 01), served from this folder.
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {RGBELoader} from "three/addons/loaders/RGBELoader.js";

const S=window.HOOD;
const canvas=document.getElementById("c"),host=document.querySelector(".scene");
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const small=innerWidth<760||matchMedia("(pointer: coarse)").matches;
let R;try{R=new THREE.WebGLRenderer({canvas,antialias:!small,alpha:true,powerPreference:"high-performance"})}catch(e){host.classList.add("noGL");throw e}
R.setPixelRatio(Math.min(devicePixelRatio,small?1.5:2));
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;

const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(34,1,.1,200);
const ctl=new OrbitControls(cam,canvas);ctl.enableDamping=true;ctl.dampingFactor=.07;ctl.enablePan=false;
ctl.minPolarAngle=Math.PI*.16;ctl.maxPolarAngle=Math.PI*.44;ctl.minAzimuthAngle=-1.05;ctl.maxAzimuthAngle=1.05;
ctl.autoRotate=!reduce;ctl.autoRotateSpeed=.35;
canvas.addEventListener("pointerdown",()=>{const h=document.getElementById("hint");if(h)h.style.opacity=0;ctl.autoRotate=false});

// ---------- reflections: a dark room with a striped dent-repair light board overhead ----------
const env=new THREE.Scene();
env.add(new THREE.Mesh(new THREE.BoxGeometry(40,20,40),new THREE.MeshBasicMaterial({color:0x0c0b0a,side:THREE.BackSide})));
const barM=new THREE.MeshBasicMaterial({color:new THREE.Color(5,4.8,4.4)});
for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(16,.08,.6),barM);b.position.set(0,7,-8+i*2);env.add(b)}
const warm=new THREE.Mesh(new THREE.PlaneGeometry(30,4),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.05,.15)}));warm.position.set(0,2,-19);env.add(warm);
const side=new THREE.Mesh(new THREE.PlaneGeometry(4,10),new THREE.MeshBasicMaterial({color:new THREE.Color(.9,.9,1)}));side.position.set(19,3,0);side.rotation.y=-Math.PI/2;env.add(side);
const shopSphere=new THREE.Mesh(new THREE.SphereGeometry(18,48,24),new THREE.MeshBasicMaterial({side:THREE.BackSide,color:new THREE.Color(.16,.16,.16),visible:false}));env.add(shopSphere);
const pm=new THREE.PMREMGenerator(R);let envBoard=pm.fromScene(env,.02).texture;
// daylight: an open sky with soft sun, where shallow hail dents are hard to see
const day=new THREE.Scene();day.add(new THREE.Mesh(new THREE.SphereGeometry(30,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
  vertexShader:"varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader:"varying vec3 v;void main(){float t=clamp(v.y*.5+.5,0.,1.);vec3 c=mix(vec3(.42,.40,.36),vec3(1.1,1.18,1.3),smoothstep(.35,.9,t));c+=vec3(2.2,1.9,1.4)*pow(max(dot(v,normalize(vec3(.4,.8,-.4))),0.),48.);gl_FragColor=vec4(c,1.);}"})));
let envDay=pm.fromScene(day,.06).texture,envShop=null,bgShop=null,bgDay=null;scene.environment=envBoard;
// real lighting: a CC0 auto-shop HDRI for the room and its fluorescent tubes, a CC0 street HDRI for daylight
const here=new URL(".",import.meta.url).href,hdr=new RGBELoader();
function asEnv(t){t.mapping=THREE.EquirectangularReflectionMapping;return t}
function setBg(){const v=S.view||"board";const bg=v==="day"?bgDay:bgShop;scene.background=bg||null;scene.backgroundBlurriness=v==="day"?.2:.24;scene.backgroundIntensity=v==="board"?.3:v==="day"?.85:.75}
hdr.loadAsync(here+"env/autoshop_01_1k.hdr").then(t=>{bgShop=asEnv(t);envShop=pm.fromEquirectangular(t).texture;
  const sm=t.clone();sm.mapping=THREE.UVMapping;sm.needsUpdate=true;shopSphere.material.map=sm;shopSphere.material.visible=true;shopSphere.material.needsUpdate=true;
  envBoard=pm.fromScene(env,.02).texture;
  applyView();host.classList.add("hdr")}).catch(()=>{});
function loadDay(){if(bgDay||loadDay.p)return;loadDay.p=hdr.loadAsync(here+"env/wide_street_01_1k.hdr").then(t=>{bgDay=asEnv(t);envDay=pm.fromEquirectangular(t).texture;applyView()}).catch(()=>{})}

// ---------- the car front: one sculpted surface (hood, fenders rolling down, front fascia) with panel seams ----------
const W=7.2,H=4.8,SX=small?220:320,SY=small?146:212;
const geo=new THREE.PlaneGeometry(W,H,SX,SY),pos=geo.attributes.position,N=pos.count;
const base=new Float32Array(N),dentH=new Float32Array(N),XS=new Float32Array(N),YS=new Float32Array(N);
const HX=2.7,HF=-1.95;// hood half-width and front edge
const halfW=()=>HX;
function crown(x,y){const lx=Math.abs(x);let z=-.3*(x/2.8)**2-.15*((y+.3)/2)**2;
  z+=.035*Math.exp(-(((lx-1.05)/.09)**2))*(y>HF?1:0);
  const ax=lx-HX;if(ax>0)z-=3.4*ax*ax+.05*ax;
  const ay=HF-y;if(ay>0)z-=5.5*ay*ay+.05*ay;
  if(y>HF-.05)z-=.03*Math.exp(-(((lx-HX)/.022)**2));
  if(lx<HX+.05)z-=.03*Math.exp(-(((y-HF)/.022)**2));
  if(y>1.9)z+=.6*(y-1.9)**2;return z}
for(let i=0;i<N;i++){const x=pos.getX(i),y=pos.getY(i)-.3;XS[i]=x;YS[i]=y;base[i]=crown(x,y);pos.setXYZ(i,x,y,base[i])}
geo.computeVertexNormals();
const paint=new THREE.MeshPhysicalMaterial({color:S.paint,metalness:.5,roughness:.36,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.25});
const hood=new THREE.Mesh(geo,paint);hood.rotation.x=-Math.PI/2;scene.add(hood);
const bodyM=paint;
// cabin behind the hood: painted pillars and roof with the windshield set into them, so it reads as a car
const Z0=crown(0,2.1)+.02;
function cab(u,t,inset){// u: -1..1 across, t: 0..1.4 from cowl up the glass (0..1) and onto the roof (1..1.4)
  const rise=Math.min(t,1),roof=Math.max(t-1,0);const hw=2.62-.62*rise-.1*roof-inset;const x=u*hw;
  const y=2.16+rise*2.05+roof*1.7,z=Z0+rise*1.6+roof*.12-.26*((x/2.7)**2)+inset*.04;return[x,y,z]}
function cabGeo(t0,t1,inset){const g=new THREE.PlaneGeometry(1,1,28,14),a=g.attributes.position;
  for(let i=0;i<a.count;i++){const u=a.getX(i)*2,v=a.getY(i)+.5;const [x,y,z]=cab(u,t0+(t1-t0)*v,inset);a.setXYZ(i,x,y,z)}g.computeVertexNormals();return g}
const shell=new THREE.Mesh(cabGeo(0,1.4,0),paint);shell.rotation.x=-Math.PI/2;scene.add(shell);
const glass=new THREE.MeshPhysicalMaterial({color:0x07090c,metalness:.2,roughness:.03,clearcoat:1,clearcoatRoughness:.01,envMapIntensity:1.8});
const shield=new THREE.Mesh(cabGeo(.03,.94,.2),glass);shield.rotation.x=-Math.PI/2;scene.add(shield);
const cowl=new THREE.Mesh(new THREE.BoxGeometry(4.5,.06,.16),new THREE.MeshStandardMaterial({color:0x0b0b0c,roughness:.6}));cowl.position.set(0,Z0+.05,-2.2);scene.add(cowl);
// soft contact shadow
const sc=document.createElement("canvas");sc.width=sc.height=128;const sx=sc.getContext("2d"),gr=sx.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,"rgba(0,0,0,.8)");gr.addColorStop(1,"rgba(0,0,0,0)");sx.fillStyle=gr;sx.fillRect(0,0,128,128);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(11,8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.4;scene.add(shadow);

// the light board itself, hanging above the hood
const bc=document.createElement("canvas");bc.width=512;bc.height=256;const bx=bc.getContext("2d");bx.fillStyle="#0d0c0a";bx.fillRect(0,0,512,256);
for(let i=0;i<8;i++){bx.fillStyle="#fff7dc";bx.fillRect(22,22+i*28.5,468,12)}bx.strokeStyle="#F5B301";bx.lineWidth=6;bx.strokeRect(3,3,506,250);
const boardT=new THREE.CanvasTexture(bc);boardT.colorSpace=THREE.SRGBColorSpace;
const board=new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.1),new THREE.MeshBasicMaterial({map:boardT,toneMapped:false}));
board.position.set(0,3.5,-3.6);board.rotation.x=.42;scene.add(board);
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,4.4),new THREE.MeshStandardMaterial({color:0x222222,metalness:.8,roughness:.4}));pole.position.set(2.25,1.2,-3.9);scene.add(pole);
const key=new THREE.DirectionalLight(0xfff4e0,1.2);key.position.set(3,8,4);scene.add(key);

// ---------- dents and hail ----------
const SIZES={1:{r:.065,d:.02,n:72,ice:.045},2:{r:.1,d:.032,n:46,ice:.07},3:{r:.16,d:.05,n:26,ice:.11}};
let dents=0,dirty=true;
function stamp(dx,dy,r,d){const r3=r*3;for(let i=0;i<N;i++){const ex=XS[i]-dx;if(ex>r3||ex<-r3)continue;const ey=YS[i]-dy;if(ey>r3||ey<-r3)continue;
  const q=(ex*ex+ey*ey)/(r*r);if(q<9)dentH[i]+=d*Math.exp(-q)}dents++;dirty=true}
function surface(x,y){return crown(x,y)}
function apply(){const k=1-S.fix/100;for(let i=0;i<N;i++)pos.setZ(i,base[i]-dentH[i]*k);pos.needsUpdate=true;geo.computeVertexNormals();dirty=false}
function randSpot(){const y=HF+.25+Math.random()*3.45,xm=HX-.25;return[(Math.random()*2-1)*xm,y]}
const iceGeo=new THREE.IcosahedronGeometry(1,2),iceM=new THREE.MeshPhysicalMaterial({color:0xe8f6ff,roughness:.08,metalness:0,transparent:true,opacity:.85,clearcoat:1,envMapIntensity:1.6});
let ice=[];
function state(){S.dents=dents;dispatchEvent(new Event("hoodstate"))}
function storm(){ice.forEach(s=>scene.remove(s.m));ice=[];dentH.fill(0);dents=0;S.fix=0;S.anim=false;dirty=true;const z=SIZES[S.hail];
  for(let i=0;i<z.n;i++){const [x,y]=randSpot(),r=z.r*(.75+Math.random()*.5),d=z.d*(.7+Math.random()*.6);
    if(reduce){stamp(x,y,r,d);continue}
    const m=new THREE.Mesh(iceGeo,iceM);const s=z.ice*(.8+Math.random()*.4);m.scale.setScalar(s);
    m.position.set(x,6+Math.random()*7,-y);scene.add(m);ice.push({m,x,y,r,d,s,vy:-2-Math.random()*3,hit:false,life:1,vx:0,vz:0})}
  state()}
addEventListener("hoodstorm",storm);
addEventListener("hoodpaint",()=>{paint.color.set(S.paint)});
addEventListener("hoodfix",()=>{dirty=true});
function applyView(){const v=S.view||"board",d=v==="day";if(d)loadDay();
  scene.environment=d?envDay:v==="shop"?(envShop||envBoard):envBoard;board.material.opacity=v==="board"?1:.2;board.material.transparent=v!=="board";
  host.classList.toggle("day",d);setBg()}
addEventListener("hoodview",applyView);
addEventListener("hoodauto",()=>{if(S.fix>=100)storm();S.anim=true;S.a0=performance.now();S.f0=S.fix});

// ---------- frame ----------
function fit(){const w=host.clientWidth,h=host.clientHeight;R.setSize(w,h,false);cam.aspect=w/h;
  const narrow=w/h<1;cam.fov=narrow?46:34;cam.updateProjectionMatrix();
  board.visible=pole.visible=false;const dist=narrow?16.5:12.5;cam.position.set(narrow?0:1.6,dist*(narrow?.6:.5),dist);ctl.target.set(narrow?0:-1.9,narrow?2.6:-.25,.2);ctl.update()}
addEventListener("resize",fit);fit();
let vis=true;new IntersectionObserver(e=>{vis=e[0].isIntersecting}).observe(host);
let last=performance.now(),sent=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(!vis)return;
  for(const s of ice){if(!s.hit){s.vy-=16*dt;s.m.position.y+=s.vy*dt;const top=surface(s.x,s.y)+s.s*.6;
      if(s.m.position.y<=top){s.hit=true;s.m.position.y=top;stamp(s.x,s.y,s.r,s.d);s.vy=-s.vy*.28;s.vx=(Math.random()-.5)*1.6;s.vz=(Math.random()-.5)*1.6;if(now-sent>120){sent=now;state()}}}
    else{s.vy-=16*dt;s.m.position.x+=s.vx*dt;s.m.position.z+=s.vz*dt;s.m.position.y=Math.max(surface(s.x,s.y)+s.s*.6,s.m.position.y+s.vy*dt);s.life-=dt*1.4;s.m.scale.setScalar(s.s*Math.max(s.life,0));}}
  const before=ice.length;ice=ice.filter(s=>{if(s.life<=0){scene.remove(s.m);return false}return true});if(before&&!ice.length)state();
  if(S.anim){const t=Math.min(1,(now-S.a0)/3800),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;S.fix=S.f0+(100-S.f0)*e;dirty=true;if(now-sent>80||t===1){sent=now;state()}if(t===1)S.anim=false}
  if(dirty)apply();
  board.material.color.setScalar(.92+.08*Math.sin(now*.002));
  ctl.update();R.render(scene,cam)}
storm();requestAnimationFrame(loop);
