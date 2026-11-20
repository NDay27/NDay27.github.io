/* Nolan Day Studio storefront v3: reveals, counters, hero parallax, showroom, timeline.
   No dependencies. Everything degrades to a static, fully visible page. */
(function(){
  "use strict";
  window.NDS3=true;
  var d=document,root=d.documentElement;
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine=matchMedia("(pointer: fine)").matches;
  var $=function(id){return d.getElementById(id)};
  var qa=function(s,el){return [].slice.call((el||d).querySelectorAll(s))};
  var clamp=function(v,a,b){return v<a?a:v>b?b:v};
  var hasIO="IntersectionObserver" in window;

  /* ---------- reveals ---------- */
  qa("[data-stagger]").forEach(function(c){qa(":scope > [data-r]",c).forEach(function(el,i){el.style.setProperty("--i",i)})});
  function done(el){el.classList.add("in");var i=+(el.style.getPropertyValue("--i")||0);setTimeout(function(){el.removeAttribute("data-r");el.style.removeProperty("--i")},1250+i*90)}
  var rs=qa("[data-r]"),rio=null;
  if(!hasIO||!root.classList.contains("mo")){rs.forEach(function(el){el.classList.add("in");el.removeAttribute("data-r")})}
  else{rio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){rio.unobserve(e.target);done(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.08});rs.forEach(function(el){rio.observe(el)})}
  /* safety net: anything already scrolled to (or past) is revealed even if an IO callback was missed */
  var lastSweep=0,trail=0;
  function sweep(force){
    var now=Date.now();clearTimeout(trail);
    if(!force&&now-lastSweep<150){trail=setTimeout(function(){sweep(true)},160);return}
    lastSweep=now;
    var pend=qa("[data-r]:not(.in)");if(!pend.length)return;
    var lim=innerHeight*.94;pend.forEach(function(el){if(el.getBoundingClientRect().top<lim){if(rio)rio.unobserve(el);done(el)}});
  }
  addEventListener("beforeprint",function(){qa("[data-r]").forEach(function(el){el.classList.add("in")})});

  /* ---------- counters (width locked first, so nothing shifts) ---------- */
  function fmt(n){return n.toLocaleString("en-US")}
  function count(el){
    var to=+el.dataset.count,pre=el.dataset.prefix||"",suf=el.dataset.suffix||"";
    var paint=function(v){el.textContent=pre+fmt(v);if(suf){var s=d.createElement("span");s.className="plus";s.textContent=suf;el.appendChild(s)}};
    if(reduce||!to){paint(to);return}
    el.style.minWidth=el.getBoundingClientRect().width+"px";
    var t0=null,dur=1500+Math.min(to,1000)*.4;
    paint(0);
    (function step(t){if(t0===null)t0=t;var p=clamp((t-t0)/dur,0,1),e=1-Math.pow(2,-10*p);paint(Math.round(to*(p===1?1:e)));if(p<1)requestAnimationFrame(step)})(performance.now());
  }
  var cs=qa(".proof .n[data-count]");
  if(hasIO&&cs.length){var cio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){cio.unobserve(e.target);count(e.target)}})},{threshold:.6});cs.forEach(function(el){cio.observe(el)})}
  else cs.forEach(count);

  /* ---------- towns ticker ---------- */
  var tw=d.querySelector(".towns-in");
  if(tw&&!reduce){qa(":scope > *",tw).forEach(function(n){var c=n.cloneNode(true);c.setAttribute("aria-hidden","true");tw.appendChild(c)});tw.classList.add("go")}

  /* ---------- scroll loop: read bar, hero parallax + tilt, timeline ---------- */
  var bar=$("readbar"),rig=$("rig"),topo=d.querySelector(".stagebg .topo"),stage=$("stage");
  var heroOn=true,tlOn=false,ticking=false;
  var tilt={x:0,y:0,tx:0,ty:0},py=0,tpy=0,raf=0;
  function heroFrame(){
    raf=0;
    tilt.x+=(tilt.tx-tilt.x)*.09;tilt.y+=(tilt.ty-tilt.y)*.09;py+=(tpy-py)*.14;
    if(rig)rig.style.transform="translate3d(0,"+py.toFixed(2)+"px,0) rotateX("+tilt.x.toFixed(2)+"deg) rotateY("+tilt.y.toFixed(2)+"deg)";
    if(topo)topo.style.transform="translate3d(0,"+(py*-.6).toFixed(2)+"px,0)";
    if(Math.abs(tilt.tx-tilt.x)>.01||Math.abs(tilt.ty-tilt.y)>.01||Math.abs(tpy-py)>.05)raf=requestAnimationFrame(heroFrame);
  }
  function kick(){if(!raf&&!reduce)raf=requestAnimationFrame(heroFrame)}
  if(stage&&fine&&!reduce){
    stage.addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();tilt.ty=((e.clientX-r.left)/r.width-.5)*9;tilt.tx=-((e.clientY-r.top)/r.height-.5)*6;kick()});
    stage.addEventListener("pointerleave",function(){tilt.tx=0;tilt.ty=0;kick()});
  }
  var tlw=$("tlw"),rail=$("tlRail"),fill=$("tlFill"),nodes=qa(".tn"),vert=false;
  function layoutRail(){
    if(!tlw||!nodes.length)return;
    var dots=nodes.map(function(n){return n.querySelector(".tn-dot")}),base=tlw.getBoundingClientRect();
    var a=dots[0].getBoundingClientRect(),b=dots[dots.length-1].getBoundingClientRect();
    var ax=a.left+a.width/2-base.left,ay=a.top+a.height/2-base.top,bx=b.left+b.width/2-base.left,by=b.top+b.height/2-base.top;
    vert=Math.abs(by-ay)>Math.abs(bx-ax);tlw.dataset.o=vert?"v":"h";
    if(vert){rail.style.cssText="left:"+(ax-1.5)+"px;top:"+ay+"px;width:3px;height:"+(by-ay)+"px"}
    else{rail.style.cssText="left:"+ax+"px;top:"+(ay-1.5)+"px;height:3px;width:"+(bx-ax)+"px"}
  }
  function timeline(){
    if(!tlw)return;
    var p=1;
    if(!reduce){var r=tlw.getBoundingClientRect(),vh=innerHeight;p=clamp((vh*.72-r.top)/Math.max(r.height,260),0,1)}
    fill.style.transform=vert?"scale(1,"+p.toFixed(4)+")":"scale("+p.toFixed(4)+",1)";
    var n=nodes.length;nodes.forEach(function(el,i){el.classList.toggle("on",p>=i/(n-1)-.02)});
  }
  function onScroll(){
    ticking=false;sweep();
    var y=scrollY,h=root.scrollHeight-innerHeight;
    if(bar)bar.style.transform="scaleX("+(h>0?clamp(y/h,0,1):0).toFixed(4)+")";
    if(heroOn&&!reduce){tpy=-Math.min(y,900)*.06;kick()}
    if(tlOn)timeline();
  }
  addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  addEventListener("resize",function(){layoutRail();timeline()});
  if(hasIO){
    var hero=d.querySelector(".hero");if(hero)new IntersectionObserver(function(es){heroOn=es[0].isIntersecting}).observe(hero);
    if(tlw)new IntersectionObserver(function(es){tlOn=es[0].isIntersecting;if(tlOn){layoutRail();timeline()}},{rootMargin:"20% 0px"}).observe(tlw);
  }else tlOn=true;
  layoutRail();timeline();onScroll();setTimeout(function(){sweep(true)},600);addEventListener("scrollend",function(){sweep(true)});
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){layoutRail();timeline()});

  /* ---------- care plan <-> compare table ---------- */
  var cmp=$("cmp");
  qa(".cplan[data-col]").forEach(function(c){
    var on=function(){if(cmp)cmp.dataset.hl=c.dataset.col},off=function(){if(cmp)delete cmp.dataset.hl};
    c.addEventListener("mouseenter",on);c.addEventListener("mouseleave",off);c.addEventListener("focusin",on);c.addEventListener("focusout",off);
  });

  /* phones: compare one care plan at a time */
  if(cmp){
    var wrapT=cmp.closest(".tblw"),sw=d.createElement("div");sw.className="cmp-sw";sw.setAttribute("role","group");sw.setAttribute("aria-label","Show one care plan");
    var setOne=function(c){cmp.dataset.one=c;qa("button",sw).forEach(function(x){x.setAttribute("aria-pressed",x.dataset.col===c?"true":"false")})};
    [["1","Keep It Running"],["2","Get Found"],["3","Grow"]].forEach(function(x){var b=d.createElement("button");b.type="button";b.dataset.col=x[0];b.textContent=x[1];b.addEventListener("click",function(){setOne(x[0])});sw.appendChild(b)});
    wrapT.parentNode.insertBefore(sw,wrapT);wrapT.classList.add("one");setOne("2");
    qa(".cplan[data-col]").forEach(function(c){c.addEventListener("click",function(e){if(!e.target.closest("button"))setOne(c.dataset.col)})});
  }

  /* ---------- showroom ---------- */
  var IC={
    leaf:'<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l8-8"/>',
    roof:'<path d="M2 12l10-8 10 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    car:'<path d="M3 16v-3l2-5h14l2 5v3"/><path d="M3 16h18v2H3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    scis:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L20 18M8.5 16.5L20 6"/>',
    fork:'<path d="M7 3v8a2 2 0 002 2v8M5 3v5M9 3v5M17 3c-2 2-2 6 0 8v10"/>',
    barn:'<path d="M3 10l3-5h12l3 5v11H3z"/><path d="M9 21v-7h6v7M9 14l6 7M15 14l-6 7"/>',
    hammer:'<path d="M14 6l4 4M3 21l9-9M12 4l3-1 6 6-1 3-3-1-5-5z"/>',
    cube:'<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>'
  };
  var PLANS={
    essential:{label:"Essential",price:"$300",blurb:"One phone-first page that gets people to call. Up to 5 sections and 1 round of changes. $300 once, or $0 down and $99 a month.",items:[
      ["demos/essential/","Prairie Line Lawn Co.","Lawn care","leaf","#2F8F4E"],
      ["harlow/essential/","Harlow Building Co.","Home builder","roof","#2C3E5C"],
      ["samples/riverbend-mobile-detail/","Riverbend Mobile Detail","Auto detailing","car","#C2410C"],
      ["samples/maple-street-cleaning/","Maple Street Cleaning","House cleaning","spark","#0E8A8A"],
      ["samples/juniper-hair-studio/","Juniper Hair Studio","Hair salon","scis","#BE185D"],
      ["samples/main-street-diner/","Main Street Diner","Diner","fork","#B91C1C"],
      ["samples/oak-ridge-builders/","Oak Ridge Builders","Builder","hammer","#7C5A2A"],
      ["samples/prairie-lawn-co/","Prairie Lawn Co.","Lawn care","leaf","#3F7D3A"]]},
    signature:{label:"Signature",price:"$750",blurb:"A custom look made for your business. Up to 7 sections, a photo gallery, a menu or price list, and 2 rounds of changes. $750 once.",items:[
      ["demos/signature/","Ember & Rye","Restaurant","fork","#9A3412"],
      ["harlow/signature/","Harlow Building Co.","Home builder","roof","#2C3E5C"]]},
    immersive:{label:"Immersive",price:"$1,250",blurb:"A modeled 3D scene of your space that visitors turn and explore, plus everything in Signature. $1,250, or $1,500 for three connected scenes.",items:[
      ["demos/immersive/","Willow Creek Barn","Event venue","barn","#7C4A1E"],
      ["harlow/immersive/","Harlow Building Co.","Home builder, in 3D","cube","#2C3E5C"]]}
  };
  var ORDER=["essential","signature","immersive"];
  var sh=$("sh"),stg=$("shStage");
  if(!sh||!stg)return;
  var list=$("shList"),plansEl=d.querySelector(".sh-plans"),scrP=$("shPhone"),scrD=$("shDesk"),dev=d.querySelector(".sh-dev");
  var st={plan:"essential",i:0,view:"phone"},armed=false;
  var W={phone:390,desk:1280};
  function cur(){return PLANS[st.plan].items[st.i]}
  function fitAll(){[[scrP,W.phone],[scrD,W.desk]].forEach(function(x){var box=x[0],w=box.clientWidth,h=box.clientHeight;if(!w)return;var s=w/x[1];qa("iframe",box).forEach(function(f){f.style.width=x[1]+"px";f.style.height=Math.ceil(h/s)+"px";f.style.transform="scale("+s+")"})})}
  function load(){
    if(!armed)return;
    var it=cur(),box=st.view==="phone"?scrP:scrD,src=it[0];
    if(box.dataset.src===src)return;
    box.dataset.src=src;
    var f=d.createElement("iframe");
    f.title="Working sample site for "+it[1]+", a made-up business";
    f.setAttribute("referrerpolicy","same-origin");f.dataset.src=src;
    box.appendChild(f);fitAll();stg.classList.add("busy");
    var shown=false,show=function(){
      if(shown)return;shown=true;
      if(box.dataset.src!==src){f.remove();return}
      requestAnimationFrame(function(){f.classList.add("in");box.classList.add("ready")});
      stg.classList.remove("busy");
      setTimeout(function(){qa("iframe",box).forEach(function(o){if(o!==f)o.remove()})},650);
    };
    f.addEventListener("load",show);setTimeout(show,7000);
    f.src=src;
  }
  function paintList(animate){
    var items=PLANS[st.plan].items;list.textContent="";
    items.forEach(function(it,i){
      var b=d.createElement("button");b.type="button";b.className="sh-item"+(animate&&!reduce?" enter":"");b.style.setProperty("--i",i);b.style.setProperty("--c",it[4]);
      b.setAttribute("aria-pressed",i===st.i?"true":"false");
      b.innerHTML='<span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[it[3]]+'</svg></span><span><b></b><small></small></span><svg class="go" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>';
      b.querySelector("b").textContent=it[1];b.querySelector("small").textContent=it[2]+" · made-up sample";
      b.addEventListener("click",function(){pick(st.plan,i)});
      list.appendChild(b);
    });
  }
  function paint(planChanged){
    var P=PLANS[st.plan],it=cur();
    plansEl.style.setProperty("--pi",ORDER.indexOf(st.plan));
    qa("button",plansEl).forEach(function(b){b.setAttribute("aria-pressed",b.dataset.plan===st.plan?"true":"false")});
    if(planChanged){
      paintList(true);
      var bl=$("shBlurb");if(reduce){bl.textContent=P.blurb}else{bl.classList.add("swap");setTimeout(function(){bl.textContent=P.blurb;bl.classList.remove("swap")},220)}
    }else qa(".sh-item",list).forEach(function(b,i){b.setAttribute("aria-pressed",i===st.i?"true":"false")});
    var pk=$("shPick");pk.textContent="Choose "+P.label+" · "+P.price;pk.dataset.pick=P.label;
    var op=$("shOpen");op.href=it[0];
    var now=$("shNow");now.querySelector("b").textContent=it[1];now.querySelector("span").textContent="Made-up sample · "+P.label;
    $("shUrl").textContent="nday27.github.io/"+it[0];
  }
  function bump(){if(reduce||!dev)return;dev.classList.remove("bump");void dev.offsetWidth;dev.classList.add("bump")}
  function pick(plan,i){var pc=plan!==st.plan;if(!pc&&i===st.i)return;st.plan=plan;st.i=i;paint(pc);bump();load()}
  qa("button",plansEl).forEach(function(b){b.addEventListener("click",function(){pick(b.dataset.plan,0)})});
  qa(".sh-views button").forEach(function(b){b.addEventListener("click",function(){
    st.view=b.dataset.view;stg.dataset.view=st.view;
    qa(".sh-views button").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});
    requestAnimationFrame(function(){fitAll();load()});
  })});
  if("ResizeObserver" in window){var ro=new ResizeObserver(fitAll);ro.observe(scrP);ro.observe(scrD)}else addEventListener("resize",fitAll);
  paint(true);
  function arm(){if(armed)return;armed=true;load()}
  if(hasIO){var aio=new IntersectionObserver(function(es){if(es[0].isIntersecting){aio.disconnect();arm()}},{rootMargin:"500px 0px"});aio.observe(sh)}else arm();

  /* "Try it here" links elsewhere on the page open the sample in the showroom */
  function find(src){for(var k in PLANS){var its=PLANS[k].items;for(var i=0;i<its.length;i++)if(its[i][0]===src)return[k,i]}return null}
  qa("[data-show]").forEach(function(a){a.addEventListener("click",function(e){
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return;
    var hit=find(a.dataset.show);if(!hit)return;e.preventDefault();
    pick(hit[0],hit[1]);arm();
    var narrow=innerWidth<1000,target=narrow?stg:$("showroom");
    var top=0,el=target;while(el){top+=el.offsetTop;el=el.offsetParent}top-=narrow?80:0;
    scrollTo({top:Math.max(0,top),behavior:reduce?"auto":"smooth"});
    var it=qa(".sh-item",list)[hit[1]];if(it&&narrow)list.scrollTo({left:Math.max(0,it.offsetLeft-20),behavior:reduce?"auto":"smooth"});
  })});
})();
