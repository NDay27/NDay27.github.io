// Harlow Building Co. — Immersive plan demo behavior.
// The page works without WebGL: the story, the designer, the gallery and booking all run here.
// imm3d.js adds the live 3D house on top when the device can draw it.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(pointer: fine)").matches;
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var film = $("#film"), beats = $$(".beat", film), cfgBeat = $("#design");

  // ---------- design state (shared with the 3D layer) ----------
  var NAMES = {
    siding: {white: "Classic white", sage: "Prairie sage", navy: "Harbor navy", charcoal: "Iron charcoal", clay: "Clay"},
    roof: {black: "Matte black", weathered: "Weathered gray", brown: "Dark bronze"},
    trim: {black: "Black", white: "White", bronze: "Bronze"},
    door: {fir: "Fir", black: "Black", red: "Barn red", sage: "Sage"}
  };
  var COST = {siding: {navy: 3800, charcoal: 3800, clay: 2600}, roof: {brown: 2100}, trim: {bronze: 1600}, door: {fir: 2400}};
  var PER = 230, PORCH = 18500, SIZES = [1900, 2400, 3000];
  var cfg = {siding: "white", roof: "black", trim: "black", door: "fir", porch: true, tod: .56, size: 2400};
  (function fromUrl() {
    var q = new URLSearchParams(location.search);
    Object.keys(NAMES).forEach(function (k) { var v = q.get(k); if (v && NAMES[k][v]) cfg[k] = v; });
    if (q.get("porch") === "0") cfg.porch = false;
    var s = +q.get("size"); if (SIZES.indexOf(s) >= 0) cfg.size = s;
    var t = q.get("light"); if (t === "morning") cfg.tod = .3; else if (t === "night") cfg.tod = .93;
  })();
  var HB = window.HB = {cfg: cfg, onCfg: [], yaw: 0, yawTarget: 0, get: null, live: false};

  // ---------- the film: scroll position -> build progress, light and camera key ----------
  var A = [], vh = innerHeight, filmTop = 0, filmEnd = 0;
  function measure() {
    vh = innerHeight; var r = film.getBoundingClientRect(), y0 = scrollY + r.top; filmTop = y0; filmEnd = y0 + film.offsetHeight;
    A = beats.map(function (b, i) { var top = y0 + b.offsetTop;
      return i === 0 ? y0 : b === cfgBeat ? top - (innerWidth < 761 ? vh * .1 : 0) : top + b.offsetHeight / 2 - vh / 2; });
  }
  function num(b, k) { var v = b.dataset[k]; return v === "cfg" ? cfg.tod : +v; }
  var S = {p: 1, tod: .56, a: "hero", b: "hero", t: 0, i: 0, cfg: 0};
  HB.get = function () {
    var y = scrollY, n = beats.length, i = 0;
    if (y <= A[0]) i = 0; else if (y >= A[n - 1]) i = n - 1; else while (i < n - 2 && y >= A[i + 1]) i++;
    var b0 = beats[i], b1 = beats[Math.min(n - 1, i + 1)], t = i >= n - 1 ? 0 : clamp((y - A[i]) / (A[i + 1] - A[i] || 1), 0, 1);
    S.i = i; S.t = t; S.a = b0.dataset.cam; S.b = b1.dataset.cam;
    S.p = num(b0, "p") + (num(b1, "p") - num(b0, "p")) * t;
    S.tod = num(b0, "tod") + (num(b1, "tod") - num(b0, "tod")) * t;
    S.cfg = b0 === cfgBeat ? 1 : b1 === cfgBeat ? t : 0;
    return S;
  };

  // week counter and stage rail
  var WK = [[0, 0], [.02, 0], [.15, 3], [.36, 6], [.575, 9], [.705, 12], [.88, 18], [1, 34]], RAILP = [.15, .36, .575, .705, .88, 1, 1.0001];
  var wkN = $("#wkN"), wkL = $("#wkL"), rail = $$("#rail i"), lastWk = -1;
  function week(p) { for (var k = 1; k < WK.length; k++) if (p <= WK[k][0]) { var a = WK[k - 1], b = WK[k]; return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0] || 1); } return 34; }
  function hud() {
    var s = HB.get(), story = s.i >= 1 || s.t > .35, w = Math.round(week(s.p));
    if (s.i === 0 && s.t < .5) story = false;
    film.classList.toggle("story", story && s.cfg < .5);
    film.classList.toggle("cfgon", s.cfg > .85 && cfgBeat.getBoundingClientRect().bottom > vh * .4);
    var wv = s.i === 0 ? 34 : w;
    if (wv !== lastWk) { lastWk = wv; if (s.p < .03 && s.i > 0) { wkL.textContent = "Day"; wkN.textContent = "1"; } else { wkL.textContent = "Week"; wkN.textContent = wv; } }
    var prev = 0; rail.forEach(function (r, k) { var e = clamp((s.p - prev) / (RAILP[k] - prev), 0, 1); if (k === 6) e = s.i >= 7 ? clamp(s.i - 6 + s.t, 0, 1) : 0; r.style.transform = "scaleX(" + e.toFixed(3) + ")"; prev = RAILP[k]; });
    if (!HB.live) poster(s);
  }

  // without WebGL (or until it loads) the scene shows the matching render
  var pimgs = {}; $$("#poster img").forEach(function (im) { pimgs[im.dataset.k] = im; });
  var curImg = "hero", nogl = false;
  function want(k) { var im = pimgs[k]; if (im && !im.src && im.dataset.src) im.src = im.dataset.src; return im; }
  function poster(s) {
    if (!nogl) return;
    var b = beats[s.t > .5 ? Math.min(beats.length - 1, s.i + 1) : s.i], k = b.dataset.img;
    if (k === "cfg") k = "fin-" + ({white: "white", navy: "navy", sage: "sage", charcoal: "charcoal"}[cfg.siding] || "white");
    if (k === curImg) return; var im = want(k); if (!im) return;
    pimgs[curImg].classList.remove("on"); im.classList.add("on"); curImg = k;
  }
  function goNoGL() { nogl = true; film.classList.add("nogl"); $("#load").hidden = true; $("#turn").hidden = true; hud(); }

  // captions come up as they reach the middle of the screen
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("on", e.isIntersecting); }); }, {rootMargin: "-38% 0px -38% 0px"});
  $$(".step").forEach(function (s) { io.observe(s); });

  // ---------- header + phone bar ----------
  var top = $("#top"), cbar = $("#cbar"), walk = $("#walk");
  var ticking = false;
  function frame() { ticking = false;
    var fb = film.getBoundingClientRect().bottom; top.classList.toggle("solid", fb < 90);
    var w = walk.getBoundingClientRect();
    cbar.classList.toggle("on", fb < vh * .5 && !(w.top < vh && w.bottom > 0));
    hud(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, {passive: true});
  addEventListener("resize", function () { measure(); onScroll(); });
  if (window.ResizeObserver) new ResizeObserver(function () { measure(); onScroll(); }).observe(film);
  measure(); frame();

  // ---------- designer ----------
  function pressed(group, fn) { $$("button", group).forEach(function (b) { b.setAttribute("aria-pressed", fn(b) ? "true" : "false"); }); }
  function price() {
    var base = cfg.size * PER, list = [["Base home, " + cfg.size.toLocaleString("en-US") + " sq ft", base]], tot = base;
    Object.keys(COST).forEach(function (k) { var c = COST[k][cfg[k]]; if (c) { list.push([NAMES[k][cfg[k]] + (k === "door" ? " door" : k === "roof" ? " roof" : k === "trim" ? " trim" : " siding"), c]); tot += c; } });
    if (cfg.porch) { list.push(["Timber front porch", PORCH]); tot += PORCH; }
    return {tot: tot, list: list};
  }
  var shownTot = 0;
  function countTo(el, to) { var from = shownTot, t0 = performance.now(), ms = reduce ? 0 : 420;
    (function f(t) { var k = ms ? Math.min(1, (t - t0) / ms) : 1, e = 1 - Math.pow(1 - k, 3); el.textContent = money(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); else shownTot = to; })(t0); }
  function summary() { return "The Morton, " + cfg.size.toLocaleString("en-US") + " sq ft: " + NAMES.siding[cfg.siding].toLowerCase() + " siding, " + NAMES.roof[cfg.roof].toLowerCase() + " roof, " +
      NAMES.trim[cfg.trim].toLowerCase() + " trim, " + NAMES.door[cfg.door].toLowerCase() + " front door, " + (cfg.porch ? "with" : "without") + " the timber porch"; }
  function link() { var q = new URLSearchParams(); ["siding", "roof", "trim", "door"].forEach(function (k) { q.set(k, cfg[k]); }); if (!cfg.porch) q.set("porch", "0"); q.set("size", cfg.size);
    q.set("light", cfg.tod < .45 ? "morning" : cfg.tod > .8 ? "night" : "golden"); return location.origin + location.pathname + "?" + q.toString() + "#design"; }
  function paint(changed) {
    $$(".cfg .sw").forEach(function (g) { var k = g.dataset.o; pressed(g, function (b) { return b.dataset.v === cfg[k]; }); $("#o-" + k).textContent = NAMES[k][cfg[k]]; });
    pressed($("#light"), function (b) { return Math.abs(+b.dataset.t - cfg.tod) < .05; });
    pressed($("#sizes"), function (b) { return +b.dataset.s === cfg.size; });
    $("#porch").setAttribute("aria-checked", cfg.porch ? "true" : "false");
    var pr = price(); countTo($("#pTotal"), pr.tot); $("#pSize").textContent = cfg.size.toLocaleString("en-US") + " sq ft";
    $("#pList").innerHTML = pr.list.map(function (l, i) { return "<li><span>" + l[0] + "</span><span>" + (i ? "+" : "") + money(l[1]) + "</span></li>"; }).join("");
    if (changed) HB.onCfg.forEach(function (f) { f(cfg, changed); });
    if (nogl) poster(HB.get());
  }
  $$(".cfg .sw button").forEach(function (b) { b.addEventListener("click", function () { var k = b.parentNode.dataset.o; cfg[k] = b.dataset.v; paint(k); }); });
  $$("#light button").forEach(function (b) { b.addEventListener("click", function () { cfg.tod = +b.dataset.t; paint("tod"); hud(); }); });
  $$("#sizes button").forEach(function (b) { b.addEventListener("click", function () { cfg.size = +b.dataset.s; paint("size"); }); });
  $("#porch").addEventListener("click", function () { cfg.porch = !cfg.porch; paint("porch"); });
  $("#sendCfg").addEventListener("click", function () { $("#b-note").value = "My design: " + summary() + ". Shown at " + money(price().tot) + "."; });
  $("#share").addEventListener("click", function () {
    var url = link(), fineEl = $("#fine"), done = function () { fineEl.textContent = "Link copied. Anyone who opens it sees this exact design."; };
    try { history.replaceState(null, "", url); } catch (e) { /* file:// or sandboxed frame */ }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { fineEl.textContent = url; });
    else fineEl.textContent = url; });
  paint(null);

  // turn the house: buttons everywhere, drag on the scene itself
  var TURN = .55;
  $("#tl").addEventListener("click", function () { HB.yawTarget = clamp(HB.yawTarget - TURN, -1.25, 1.25); });
  $("#tr").addEventListener("click", function () { HB.yawTarget = clamp(HB.yawTarget + TURN, -1.25, 1.25); });
  var canvas = $("#c"), drag = null;
  canvas.addEventListener("pointerdown", function (e) { if (!film.classList.contains("cfgon")) return; drag = {x: e.clientX, y: HB.yawTarget}; canvas.setPointerCapture(e.pointerId); $("#turnHint").style.opacity = 0; });
  canvas.addEventListener("pointermove", function (e) { if (drag) HB.yawTarget = clamp(drag.y - (e.clientX - drag.x) / innerWidth * 3.2, -1.25, 1.25); });
  ["pointerup", "pointercancel"].forEach(function (n) { canvas.addEventListener(n, function () { drag = null; }); });
  $("#design").style.pointerEvents = "none"; $("#cfg").style.pointerEvents = "auto";

  // ---------- Friday update ----------
  var mail = $("#mail");
  new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { mail.classList.add("seen"); ob.disconnect(); } }, {threshold: .35}).observe(mail);

  // ---------- portfolio: filter + project drawer ----------
  var P = [
    {img: "../img/hero-2400.webp", alt: "White board-and-batten farmhouse with a timber porch at golden hour", h: "The Morton farmhouse", town: "Morton", size: "2,400 sq ft, 4 bedrooms", time: "8 months", scope: "New home, Harlow plan",
      txt: "A young family's first build on land they'd owned for years. White board-and-batten, a standing-seam roof and a cedar porch facing the sunset.", q: "“They gave us one price in the first week and never moved it. We moved in two days early.”", who: "Dana K., homeowner"},
    {img: "../img/pj-navy-1600.webp", alt: "Navy farmhouse with white trim and lit windows at dusk", h: "Harbor navy", town: "Washington", size: "2,650 sq ft, 4 bedrooms", time: "9 months", scope: "New home, client's architect",
      txt: "Built from the family's own architect plans. Deep navy siding, crisp white trim and a two-car garage with a bonus room above.", q: "“We still drive past at night just to see the windows lit.”", who: "Jordan P., homeowner"},
    {img: "../img/pj-sage-1600.webp", alt: "Sage green farmhouse with white trim on a sunny day", h: "Prairie sage", town: "Eureka", size: "2,200 sq ft, 3 bedrooms", time: "7 months", scope: "New home, Harlow plan",
      txt: "A soft sage exterior with a weathered-gray metal roof, set back on a corner lot with three mature oaks we built around.", q: "“Tom walked us through every selection, so nothing was a surprise.”", who: "The Haddad family"},
    {img: "../img/pj-charcoal-1600.webp", alt: "Charcoal house from the back yard with a wide glass slider", h: "Charcoal kitchen bump-out", town: "Tremont", size: "320 sq ft added", time: "7 weeks", scope: "Kitchen addition and slider",
      txt: "We pushed the kitchen out eight feet, added a nine-foot glass slider to the yard and wrapped the whole house in charcoal to tie it together.", q: "“They said we'd cook Thanksgiving in it, and we did.”", who: "Karen L., homeowner"},
    {img: "../img/pj-porch-1600.webp", alt: "Covered porch with cedar timber posts and a wood door", h: "Cedar timber porch", town: "Germantown Hills", size: "26 ft wide, 8 ft deep", time: "3 weeks", scope: "Porch rebuild",
      txt: "The old porch was sagging. We rebuilt it on new footings with 6x6 cedar posts, knee braces and a metal roof that drums nicely in the rain.", q: "“It's where we eat dinner now, April to October.”", who: "Ben and Ali S."}
  ];
  var gal = $("#gal"), dr = $("#dr"), cur = 0, lenis = null;
  $$(".chip").forEach(function (c) { c.addEventListener("click", function () {
    $$(".chip").forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
    var f = c.dataset.f; gal.classList.toggle("filtered", f !== "all");
    $$(".pj", gal).forEach(function (p) { p.hidden = !(f === "all" || p.dataset.k === f); }); }); });
  function fill(i) { cur = i; var p = P[i]; $("#dr-img").src = p.img; $("#dr-img").alt = p.alt; $("#dr-h").textContent = p.h; $("#dr-town").textContent = p.town; $("#dr-size").textContent = p.size;
    $("#dr-time").textContent = p.time; $("#dr-scope").textContent = p.scope; $("#dr-txt").textContent = p.txt; $("#dr-q").textContent = p.q; $("#dr-who").textContent = p.who; $(".in", dr).scrollTop = 0; }
  $$(".pj", gal).forEach(function (b) { b.addEventListener("click", function () { fill(+b.dataset.i); if (dr.showModal) dr.showModal(); else dr.setAttribute("open", ""); if (lenis) lenis.stop(); }); });
  function closeDr() { if (dr.close) dr.close(); else dr.removeAttribute("open"); }
  $("#dr-x").addEventListener("click", closeDr);
  dr.addEventListener("close", function () { if (lenis) lenis.start(); });
  dr.addEventListener("click", function (e) { if (e.target === dr) closeDr(); });
  $("#dr-next").addEventListener("click", function () { fill((cur + 1) % P.length); });
  $("#dr-go").addEventListener("click", function () { $("#b-note").value = "Something like “" + P[cur].h + "” (" + P[cur].scope.toLowerCase() + ")."; closeDr(); });

  // ---------- site-walk booking ----------
  var days = $("#days"), times = $("#times"), pick = {d: null, t: null}, TIMES = ["7:30 AM", "10:00 AM", "1:00 PM", "3:30 PM"];
  var DNF = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var list = [], d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 1);
  while (list.length < 10) { if (d.getDay() % 6) list.push(new Date(d)); d.setDate(d.getDate() + 1); }
  list.forEach(function (dt, i) { var b = document.createElement("button"); b.type = "button"; b.className = "day"; b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", DN[dt.getDay()] + " " + MN[dt.getMonth()] + " " + dt.getDate()); b.innerHTML = "<small>" + DN[dt.getDay()] + "</small><b>" + dt.getDate() + "</b>";
    b.addEventListener("click", function () { $$(".day", days).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); }); pick.d = dt; pick.t = null; drawTimes(i); sum(); }); days.appendChild(b); });
  function drawTimes(seed) { times.innerHTML = ""; TIMES.forEach(function (t, k) { var b = document.createElement("button"); b.type = "button"; b.className = "time"; b.textContent = t; b.setAttribute("aria-pressed", "false");
      if (seed >= 0 && (seed * 7 + k * 3) % 5 === 0) { b.disabled = true; b.setAttribute("aria-label", t + ", taken"); }
      b.addEventListener("click", function () { $$(".time", times).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); }); pick.t = t; sum(); }); times.appendChild(b); }); }
  drawTimes(-1);
  function when() { return DNF[pick.d.getDay()] + ", " + MN[pick.d.getMonth()] + " " + pick.d.getDate() + " at " + pick.t; }
  function sum() { $("#sum").textContent = pick.d && pick.t ? when() : pick.d ? "Now pick a time." : "Pick a day and a time above."; }
  $("#bookBtn").addEventListener("click", function () {
    if (!pick.d || !pick.t) { $("#sum").textContent = !pick.d ? "Pick a day first." : "Pick a time first."; (pick.d ? times : days).querySelector("button:not(:disabled)").focus(); return; }
    var ok = true, first = null;
    [["b-name", function (v) { return v.trim().length > 1; }], ["b-phone", function (v) { return v.replace(/\D/g, "").length >= 10; }]].forEach(function (c) { var el = $("#" + c[0]), g = c[1](el.value);
      el.closest(".fld").classList.toggle("bad", !g); el.setAttribute("aria-invalid", g ? "false" : "true"); if (!g) { ok = false; first = first || el; } });
    if (!ok) { first.focus(); return; }
    $("#okName").textContent = $("#b-name").value.trim().split(" ")[0]; $("#okWhen").textContent = when() + ". Plan on about an hour on site.";
    $("#card").classList.add("sent"); $("#okp").focus(); });
  $$(".fld input").forEach(function (el) { el.addEventListener("input", function () { el.closest(".fld").classList.remove("bad"); el.removeAttribute("aria-invalid"); }); });
  $("#rebook").addEventListener("click", function () { $("#card").classList.remove("sent"); });
  $("#ics").addEventListener("click", function () {
    var m = pick.t.match(/(\d+):(\d+) (AM|PM)/), h = +m[1] % 12 + (m[3] === "PM" ? 12 : 0), s = new Date(pick.d); s.setHours(h, +m[2], 0, 0); var e = new Date(s.getTime() + 3600000);
    var f = function (x) { var p = function (n) { return (n < 10 ? "0" : "") + n; }; return x.getFullYear() + p(x.getMonth() + 1) + p(x.getDate()) + "T" + p(x.getHours()) + p(x.getMinutes()) + "00"; };
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Harlow Building Co sample//EN", "BEGIN:VEVENT", "UID:" + Date.now() + "@harlow-sample", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(s), "DTEND:" + f(e),
      "SUMMARY:Site walk with Harlow Building Co.", "DESCRIPTION:Sample booking from a Nolan Day Studio demo site.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], {type: "text/calendar"})); a.download = "Harlow-site-walk.ics"; document.body.appendChild(a); a.click(); a.remove(); });

  // ---------- motion: Lenis on mouse and trackpad, then the live 3D house ----------
  function gl() { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
  function boot3d() {
    var save = navigator.connection && navigator.connection.saveData;
    if (save || !gl() || /[?&]nogl=1/.test(location.search)) { goNoGL(); return; }
    import("./imm3d.js").then(function (m) { return m.start(HB); }).then(function () { HB.live = true; film.classList.add("live"); onScroll(); })
      .catch(function (e) { if (window.console) console.warn("3D scene unavailable, showing renders instead.", e); goNoGL(); });
  }
  addEventListener("load", function () {
    measure(); onScroll();
    if (!reduce && fine && window.Lenis) {
      lenis = new Lenis({lerp: .1, smoothWheel: true});
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (e) { var id = a.getAttribute("href"); if (id.length < 2) return; var t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, {offset: t === cfgBeat ? 0 : -70}); }); });
    }
    if (window.requestIdleCallback) requestIdleCallback(boot3d, {timeout: 1200}); else setTimeout(boot3d, 300);
  });
})();
