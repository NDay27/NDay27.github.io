// Harlow Building Co. — Signature plan demo behavior.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(pointer: fine)").matches;
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var short = function (n) { return n >= 100000 ? "$" + Math.round(n / 5000) * 5 + "k" : n >= 10000 ? "$" + Math.round(n / 1000) + "k" : money(n); };

  // ---------- hero: draw the plan, then open the divider onto the finished house ----------
  var hero = $("#hero"), handle = $("#handle"), X = 0, target = function () { return innerWidth < 760 ? 46 : 54; };
  function setX(v) { X = Math.max(0, Math.min(100, v)); hero.style.setProperty("--x", X + "%"); handle.setAttribute("aria-valuenow", Math.round(X)); handle.setAttribute("aria-valuetext", Math.round(X) + "% finished house"); }
  function tween(to, ms) { var from = X, t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 4); setX(from + (to - from) * e); if (k < 1 && !dragging) requestAnimationFrame(f); })(t0); }
  var dragging = false;
  function start() {
    if (reduce) { setX(target()); return; }
    setX(0); hero.classList.add("go");
    setTimeout(function () { if (!dragging) tween(target(), 1500); }, 2500);
  }
  var img = $(".stage img", hero);
  if (img.complete) requestAnimationFrame(start); else { img.addEventListener("load", start, {once: true}); img.addEventListener("error", start, {once: true}); }
  function fromEvent(e) { var r = hero.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
  handle.addEventListener("pointerdown", function (e) { dragging = true; handle.setPointerCapture(e.pointerId); e.preventDefault(); });
  handle.addEventListener("pointermove", function (e) { if (dragging) setX(fromEvent(e)); });
  ["pointerup", "pointercancel"].forEach(function (n) { handle.addEventListener(n, function () { dragging = false; }); });
  handle.addEventListener("keydown", function (e) { var s = e.shiftKey ? 20 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setX(X - s); e.preventDefault(); } else if (e.key === "ArrowRight" || e.key === "ArrowUp") { setX(X + s); e.preventDefault(); }
    else if (e.key === "Home") { setX(0); e.preventDefault(); } else if (e.key === "End") { setX(100); e.preventDefault(); } });

  // ---------- header + phone bar ----------
  var top = $("#top"), cbar = $("#cbar"), walk = $("#walk");
  function onScroll() { var hb = hero.getBoundingClientRect().bottom; top.classList.toggle("solid", hb < 90);
    var w = walk.getBoundingClientRect(); cbar.classList.toggle("on", hb < 0 && !(w.top < innerHeight && w.bottom > 0)); }
  addEventListener("scroll", onScroll, {passive: true}); onScroll();

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
  var gal = $("#gal"), dr = $("#dr"), cur = 0;
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

  // ---------- exterior picker ----------
  var fimgs = $$("#finFrame img");
  $$("#sw button").forEach(function (b) { b.addEventListener("click", function () {
    $$("#sw button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
    fimgs.forEach(function (im, i) { im.classList.toggle("on", i === +b.dataset.i); }); }); });
  // warm the other exterior images once the section is near
  new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { fimgs.forEach(function (im) { im.loading = "eager"; }); ob.disconnect(); } }, {rootMargin: "600px"}).observe($("#exterior"));

  // ---------- build stages ----------
  var simgs = $$("#stFrame img"), bars = $$("#prog i"), wk = $("#wk"), steps = $$("#steps li");
  function stage(i) { simgs.forEach(function (im, k) { im.classList.toggle("on", k === i); }); bars.forEach(function (b, k) { b.classList.toggle("on", k <= i); });
    steps.forEach(function (s, k) { s.classList.toggle("on", k === i); }); wk.textContent = $(".w", steps[i]).textContent; }
  if (matchMedia("(min-width: 861px)").matches) {
    simgs.forEach(function (im) { im.loading = "eager"; });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) stage(+e.target.dataset.i); }); }, {rootMargin: "-45% 0px -45% 0px"});
    steps.forEach(function (s) { io.observe(s); }); stage(0);
  }

  // ---------- estimator ----------
  var J = {
    home: {min: 1200, max: 4500, step: 50, def: 2400, unit: "sq ft", per: [[195, 225], [225, 255], [265, 310]], time: function (s) { return s > 3200 ? "9 to 11 months" : "7 to 9 months"; }, name: "New home"},
    add: {min: 200, max: 1200, step: 10, def: 500, unit: "sq ft added", per: [[260, 300], [300, 350], [350, 420]], time: function (s) { return s > 700 ? "14 to 18 weeks" : "10 to 14 weeks"; }, name: "Addition"},
    kit: {min: 100, max: 400, step: 10, def: 200, unit: "sq ft kitchen", per: [[190, 230], [240, 290], [310, 380]], time: function () { return "6 to 8 weeks"; }, name: "Kitchen"},
    base: {min: 400, max: 1600, step: 20, def: 900, unit: "sq ft finished", per: [[40, 52], [55, 68], [72, 90]], time: function (s) { return s > 1100 ? "7 to 9 weeks" : "5 to 7 weeks"; }, name: "Basement"},
    porch: {min: 100, max: 600, step: 10, def: 240, unit: "sq ft porch", per: [[60, 75], [80, 100], [110, 140]], time: function () { return "2 to 4 weeks"; }, name: "Porch"}
  };
  var NOTES = ["Builder-grade finishes, LVP floors, laminate counters.", "Quartz counters, LVP floors, painted cabinets.", "Hardwood floors, custom cabinets, tile showers."];
  var LV = ["Standard", "Upgraded", "Premium"], job = "home", lvl = 1, size = $("#size"), shown = [0, 0], est = "";
  function count(el, a, b) { var from = shown.slice(), t0 = performance.now(), ms = reduce ? 0 : 450;
    (function f(t) { var k = ms ? Math.min(1, (t - t0) / ms) : 1, e = 1 - Math.pow(1 - k, 3), x = from[0] + (a - from[0]) * e, y = from[1] + (b - from[1]) * e;
      el.innerHTML = short(x) + "<small>to</small>" + short(y); if (k < 1) requestAnimationFrame(f); else shown = [a, b]; })(t0); }
  function calc() { var j = J[job], s = +size.value, p = j.per[lvl];
    $("#sizeOut").textContent = s.toLocaleString("en-US") + " " + j.unit;
    count($("#range"), s * p[0], s * p[1]); $("#rTime").textContent = j.time(s); $("#rPer").textContent = "$" + p[0] + " to $" + p[1]; $("#finNote").textContent = NOTES[lvl];
    est = j.name + ", " + s.toLocaleString("en-US") + " " + j.unit + ", " + LV[lvl] + " finishes (" + short(s * p[0]) + " to " + short(s * p[1]) + ")"; }
  $$("#job button").forEach(function (b) { b.addEventListener("click", function () { $$("#job button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
    job = b.dataset.j; var j = J[job]; size.min = j.min; size.max = j.max; size.step = j.step; size.value = j.def; calc(); }); });
  $$("#finish button").forEach(function (b) { b.addEventListener("click", function () { $$("#finish button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); }); lvl = +b.dataset.l; calc(); }); });
  size.addEventListener("input", calc); calc();
  $("#sendEst").addEventListener("click", function () { $("#b-note").value = "My estimate: " + est + "."; });

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

  // ---------- motion layer: Lenis smooth scroll on mouse/trackpad, a quiet parallax on the hero ----------
  var lenis = null;
  addEventListener("load", function () {
    if (reduce) return;
    if (fine && window.Lenis) {
      lenis = new Lenis({lerp: .11, smoothWheel: true});
      if (window.gsap && window.ScrollTrigger) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
      else (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (e) { var id = a.getAttribute("href"); if (id.length < 2) return; var t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, {offset: -70}); }); });
    }
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(".hero .copy", {yPercent: -10, opacity: .2, ease: "none", scrollTrigger: {trigger: hero, start: "top top", end: "bottom top", scrub: true}});
    }
  });
})();
