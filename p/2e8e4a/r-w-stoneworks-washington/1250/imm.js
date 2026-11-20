// R.W. Stoneworks Immersive sample by Nolan Day Studio: page behavior.
// The page works without WebGL: the story, the photos, the paver studio and the request all run here.
// patio3d.js adds the live 3D patio on top when the device can draw it.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); }, sm = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var film = $("#film"), beats = $$(".beat", film), walkBeat = $("#walk"), realBeat = $("#real");
  var RW = window.RW = window.RW || {};
  RW.yaw = 0; RW.yawTarget = 0; RW.walkTod = .93; RW.live = false;

  // ---------- the film: scroll position -> build progress, light and camera key ----------
  var A = [], vh = innerHeight;
  function measure() {
    vh = innerHeight; var r = film.getBoundingClientRect(), y0 = scrollY + r.top;
    A = beats.map(function (b, i) { var top = y0 + b.offsetTop; return i === 0 ? y0 : b === walkBeat ? top - (innerWidth < 761 ? vh * .1 : 0) : top + b.offsetHeight / 2 - vh / 2; });
  }
  function num(b, k) { var v = b.dataset[k]; return v === "walk" ? RW.walkTod : +v; }
  var S = {p: 1, tod: .56, a: "hero", b: "hero", t: 0, i: 0, walk: 0, photo: 0, fire: 1, m: 0};
  var iReal = beats.indexOf(realBeat), iWalk = beats.indexOf(walkBeat);
  RW.get = function () {
    var y = scrollY, n = beats.length, i = 0;
    if (y <= A[0]) i = 0; else if (y >= A[n - 1]) i = n - 1; else while (i < n - 2 && y >= A[i + 1]) i++;
    var b0 = beats[i], b1 = beats[Math.min(n - 1, i + 1)], t = i >= n - 1 ? 0 : clamp((y - A[i]) / (A[i + 1] - A[i] || 1), 0, 1);
    S.i = i; S.t = t; S.a = b0.dataset.cam; S.b = b1.dataset.cam;
    S.p = num(b0, "p") + (num(b1, "p") - num(b0, "p")) * t;
    S.tod = num(b0, "tod") + (num(b1, "tod") - num(b0, "tod")) * t;
    S.walk = i === iWalk ? 1 : i + 1 === iWalk ? t : 0;
    // m: 0 = the 3D patio, 1 = the real photo. Rises into the "real one" beat and falls away into the walk-around
    S.m = i + 1 === iReal ? sm(.35, 1, t) : i === iReal ? 1 - sm(0, .55, t) : 0;
    S.photo = S.m; S.fire = 1;
    return S;
  };

  // step counter and stage rail
  var LABELS = ["The drawing", "Dig it out", "A packed stone base", "Stone and pavers", "Fire pit and seat wall", "Caps, pillars and lights", "Light the fire"];
  var stN = $("#stN"), stL = $("#stL"), rail = $$("#rail i"), lastSt = -1, mDraw = $("#mDraw"), mPhoto = $("#mPhoto"), shade = $("#shade");
  function hud() {
    var s = RW.get(), k = s.i + (s.t > .5 ? 1 : 0), st = clamp(k - 1, 0, 6);
    film.classList.toggle("story", s.i >= 1 && !(s.i === 0 && s.t < .5) && k <= 7 && s.m < .6);
    film.classList.toggle("walkon", s.walk > .85 && walkBeat.getBoundingClientRect().bottom > vh * .4);
    if (st !== lastSt) { lastSt = st; stN.textContent = "Step " + (st + 1) + " of 7"; stL.textContent = LABELS[st]; }
    rail.forEach(function (r, j) { var e = clamp(s.i - 1 - j + s.t + .5, 0, 1); if (s.i === 0) e = 0; r.style.transform = "scaleX(" + e.toFixed(3) + ")"; });
    // the 3D night scene turns into the drawing of their real patio, then the real photo
    var m = s.m, d = sm(0, .45, m) * (1 - sm(.55, 1, m)), ph = sm(.5, 1, m);
    mDraw.style.opacity = (RW.live ? d : 0).toFixed(3); mPhoto.style.opacity = (RW.live ? ph : 0).toFixed(3);
    shade.style.opacity = (1 - ph * .55).toFixed(3);
    if (!RW.live) poster(s);
  }

  // without WebGL (or until it loads) the scene shows the drawing and their photos
  var pimgs = {}; $$("#poster img").forEach(function (im) { pimgs[im.dataset.k] = im; });
  var curImg = "photo", nogl = false;
  function poster(s) {
    if (!nogl) return;
    var b = beats[s.t > .5 ? Math.min(beats.length - 1, s.i + 1) : s.i], k = b.dataset.img;
    if (k === curImg) return; var im = pimgs[k]; if (!im) return; if (!im.src && im.dataset.src) im.src = im.dataset.src;
    pimgs[curImg].classList.remove("on"); im.classList.add("on"); curImg = k;
  }
  function goNoGL() { nogl = true; film.classList.add("nogl"); $("#load").hidden = true; hud(); }

  // captions come up as they reach the middle of the screen
  if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("on", e.isIntersecting); }); }, {rootMargin: "-38% 0px -38% 0px"});
    $$(".step").forEach(function (s) { io.observe(s); }); } else $$(".step").forEach(function (s) { s.classList.add("on"); });

  // ---------- header ----------
  var top = $("#top"), ticking = false;
  function frame() { ticking = false; top.classList.toggle("solid", film.getBoundingClientRect().bottom < 90); hud(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, {passive: true});
  addEventListener("resize", function () { measure(); onScroll(); });
  if (window.ResizeObserver) new ResizeObserver(function () { measure(); onScroll(); }).observe(film);
  measure(); frame();

  // ---------- walk around it: light and turning ----------
  $$("#light button").forEach(function (b) { b.addEventListener("click", function () { RW.walkTod = +b.dataset.t;
    $$("#light button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); }); onScroll(); }); });
  var TURN = .6, LIM = 1.9;
  $("#tl").addEventListener("click", function () { RW.yawTarget = clamp(RW.yawTarget - TURN, -LIM, LIM); });
  $("#tr").addEventListener("click", function () { RW.yawTarget = clamp(RW.yawTarget + TURN, -LIM, LIM); });
  var canvas = $("#c"), drag = null;
  canvas.addEventListener("pointerdown", function (e) { if (!film.classList.contains("walkon")) return; drag = {x: e.clientX, y: RW.yawTarget}; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} $("#turnHint").style.opacity = 0; });
  canvas.addEventListener("pointermove", function (e) { if (drag) RW.yawTarget = clamp(drag.y - (e.clientX - drag.x) / innerWidth * 3.4, -LIM, LIM); });
  canvas.addEventListener("pointerup", function () { drag = null; }); canvas.addEventListener("pointercancel", function () { drag = null; });
  // the scene sits behind the captions, so let the cursor say "Drag" only while you can turn it
  var sceneEl = $(".scene"); new MutationObserver(function () { if (film.classList.contains("walkon")) sceneEl.setAttribute("data-cur", "Drag"); else sceneEl.removeAttribute("data-cur"); }).observe(film, {attributes: true, attributeFilter: ["class"]});

  // ---------- photo strip at the end ----------
  var strip = $("#strip");
  if (strip) {
    var down = false, sx = 0, sl = 0, moved = 0;
    strip.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse" || e.button) return; down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft; });
    addEventListener("pointermove", function (e) { if (!down) return; var d = e.clientX - sx; moved = Math.max(moved, Math.abs(d)); if (moved > 4) strip.classList.add("drag"); strip.scrollLeft = sl - d; });
    addEventListener("pointerup", function () { if (!down) return; down = false; setTimeout(function () { strip.classList.remove("drag"); }, 0); });
    strip.addEventListener("click", function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    var stepG = function (dir) { var card = $(".ph", strip), w = card ? card.getBoundingClientRect().width + 14 : 400; strip.scrollBy({left: dir * w, behavior: reduce ? "auto" : "smooth"}); };
    var gp = $("#gp"), gn = $("#gn"); if (gp) gp.addEventListener("click", function () { stepG(-1); }); if (gn) gn.addEventListener("click", function () { stepG(1); });
  }

  // ---------- paver studio ----------
  var pv = $("#pv");
  if (pv && RW.studio) {
    var st = RW.studio({canvas: pv, pats: $("#pats"), blends: $("#blends"), border: $("#border"), capT: $("#capT"), capSw: $("#capSw")});
    var use = $("#usePat"), notes = $("#notes");
    if (use && notes) use.addEventListener("click", function () { var line = "Pattern idea: " + st.describe() + ".";
      var rest = notes.value.replace(/^Pattern idea:.*$/m, "").trim(); notes.value = line + (rest ? "\n" + rest : "");
      notes.dispatchEvent(new Event("input", {bubbles: true})); });
  }

  // ---------- motion: Lenis on mouse and trackpad, then the live 3D patio ----------
  function gl() { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
  var lenis = null;
  function boot3d() {
    var save = navigator.connection && navigator.connection.saveData;
    if (save || !gl() || /[?&]nogl=1/.test(location.search)) { goNoGL(); return; }
    import("./patio3d.js?v=1").then(function (m) { return m.start(RW); }).then(function () { RW.live = true; film.classList.add("live"); onScroll(); })
      .catch(function (e) { if (window.console) console.warn("3D patio unavailable", e); goNoGL(); });
  }
  addEventListener("load", function () {
    if (!reduce && fine && window.Lenis) {
      lenis = new Lenis({lerp: .1, smoothWheel: true});
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (e) { var id = a.getAttribute("href"); if (id.length < 2) return; var t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, {offset: t === walkBeat ? 0 : -70}); }); });
    }
    if (window.requestIdleCallback) requestIdleCallback(boot3d, {timeout: 1200}); else setTimeout(boot3d, 300);
  });
})();
