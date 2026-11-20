/* Riverbend Mobile Detail — sample site by Nolan Day Studio (made-up business).
   The foam-and-shine hero loop, package pricing by vehicle size, the swirl-correction slider,
   the van that drives as you scroll, the route line and the live booking ticket. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(u) { return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function inView(node, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, opts || {}).observe(node);
  }

  /* ---------- reveal ---------- */
  var hero = $(".hero");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(function (n) { if (!hero.contains(n)) io.observe(n); });
  } else $$(".rv").forEach(function (n) { n.classList.add("in"); });
  requestAnimationFrame(function () {
    $$(".rv", hero).forEach(function (n, i) { setTimeout(function () { n.classList.add("in"); }, reduce ? 0 : 60 + i * 110); });
  });

  /* ---------- header, call bar, van, current link ---------- */
  var nav = $("#nav"), cbar = $("#cbar"), book = $("#book"), links = $$(".links a");
  var secs = links.map(function (a) { return $(a.getAttribute("href")); });
  var road = $("#road"), van = $("#van"), stepEls = $$("#how .step"), wheels = $$(".vw", van);
  var ticking = false;
  function onScroll() {
    ticking = false;
    nav.classList.toggle("scrolled", scrollY > 8);
    var hb = hero.getBoundingClientRect().bottom, b = book.getBoundingClientRect();
    cbar.classList.toggle("on", hb < innerHeight * 0.3 && !(b.top < innerHeight * 0.85 && b.bottom > 0));
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("cur", i === cur); });
    if (road) {
      var r = road.getBoundingClientRect(), p = reduce ? 1 : clamp((innerHeight * 0.92 - r.top) / (innerHeight * 0.62), 0, 1);
      var span = r.width - van.getBoundingClientRect().width, x = span * ease(p);
      van.style.setProperty("--vx", x.toFixed(1) + "px");
      wheels.forEach(function (w) { w.style.setProperty("--vr", (x * 2.4).toFixed(1) + "deg"); });
      stepEls.forEach(function (s, i) { s.classList.toggle("lit", p >= (i + .35) / stepEls.length); });
    }
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);

  /* ---------- hero: foam, rinse, polish, loop ----------
     Every moving part is a CSS animation on transform or opacity (see "wash loop" in detail.css),
     so it stays smooth on phones. JS only builds the foam and dust and keeps the step labels in sync. */
  (function wash() {
    var stage = $("#stage"); if (!stage) return;
    var hud = $$("#hud span"), CYCLE = 10200;
    // road dust: random specks, denser low on the body, one path per colour
    var sp = $("#specks"), dcol = ["#d9c8a8", "#c7b38f", "#a89878", "#e8dcc0", "#8a7558"];
    dcol.forEach(function (c, ci) {
      var d = "";
      for (var q = 0; q < 110; q++) {
        var sx = rnd(50, 955), sy = 120 + Math.pow(Math.random(), .7) * 200, sr = rnd(.5, 2.2), r1 = sr.toFixed(1);
        d += "M" + (sx - sr).toFixed(1) + " " + sy.toFixed(1) + "a" + r1 + " " + r1 + " 0 1 0 " + (2 * sr).toFixed(1) + " 0a" + r1 + " " + r1 + " 0 1 0 " + (-2 * sr).toFixed(1) + " 0";
      }
      el("path", { d: d, fill: c, opacity: (.35 + ci * .08).toFixed(2) }, sp);
    });
    // foam: bubbles in a band that rides the wash edge (band is 160 units wide, the edge sits 90 in)
    var foam = $("#foam"), html = "";
    for (var i = 0; i < 64; i++) {
      var dx = rnd(-90, 26), y = rnd(108, 340), r = rnd(7, 24);
      if (dx < -50) r *= .55 + .45 * ((dx + 90) / 40);
      html += '<i style="left:' + ((dx + 90 - r) / 160 * 100).toFixed(2) + "%;top:" + ((y - r) / 540 * 100).toFixed(2) + "%;width:" + (2 * r / 160 * 100).toFixed(2) + "%;--d:" + (-rnd(0, 2)).toFixed(2) + "s;--s:" + rnd(1.6, 2.8).toFixed(2) + 's"></i>';
    }
    foam.innerHTML = html;
    if (reduce) { stage.classList.add("still"); hud.forEach(function (h, i) { h.classList.toggle("on", i === 3); }); return; }
    // step labels follow the CSS clock
    var clock = $(".dm", stage), anim = null, last = -1, t0 = performance.now();
    function phase() {
      if (!anim && clock.getAnimations) anim = clock.getAnimations()[0] || null;
      var ct = anim && anim.currentTime != null ? anim.currentTime : performance.now() - t0;
      var t = (ct + 400) % CYCLE;
      var k = t < 1000 ? 0 : t < 4800 ? 1 : t < 6200 ? 2 : t < 9100 ? 3 : 0;
      if (k !== last) { last = k; hud.forEach(function (h, j) { h.classList.toggle("on", j === k); }); }
    }
    setInterval(phase, 120); phase();
    inView(stage, function (v) { stage.classList.toggle("paused", !v); });
    document.addEventListener("visibilitychange", function () { stage.classList.toggle("paused", document.hidden); });
  })();

  /* ---------- package prices by vehicle size ---------- */
  var size = "car";
  (function sizes() {
    var btns = $$(".size button"), amts = $$(".amt");
    function count(elm, to) {
      var from = parseInt(elm.textContent.replace(/\D/g, ""), 10) || to, t0 = performance.now(), d = reduce ? 1 : 520;
      elm.classList.remove("bump"); void elm.offsetWidth; elm.classList.add("bump");
      (function step(now) { var u = clamp((now - t0) / d, 0, 1); elm.textContent = "$" + Math.round(from + (to - from) * ease(u)); if (u < 1) requestAnimationFrame(step); })(t0);
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        size = b.dataset.size;
        btns.forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        amts.forEach(function (a) { count(a, +a.dataset[size]); });
        var r = $('input[name="veh"][value="' + size + '"]'); if (r) { r.checked = true; ticket(); }
      });
    });
  })();

  /* ---------- swirl correction slider ---------- */
  (function cmp() {
    var box = $("#cmp"), range = $(".cmp-range", box), sw = $("#swirls"); if (!box) return;
    var centers = [[260, 200], [420, 180], [590, 168], [330, 330], [540, 320]];
    for (var i = 0; i < 170; i++) {
      var c = centers[i % centers.length], r = rnd(16, 230), a0 = rnd(0, Math.PI * 2), span = rnd(.25, 1.1);
      var x1 = c[0] + Math.cos(a0) * r, y1 = c[1] + Math.sin(a0) * r, x2 = c[0] + Math.cos(a0 + span) * r, y2 = c[1] + Math.sin(a0 + span) * r;
      el("path", { d: "M" + x1.toFixed(1) + " " + y1.toFixed(1) + "A" + r.toFixed(1) + " " + r.toFixed(1) + " 0 0 1 " + x2.toFixed(1) + " " + y2.toFixed(1), "stroke-width": rnd(.5, 1.4).toFixed(2), opacity: rnd(.08, .32).toFixed(2) }, sw);
    }
    for (i = 0; i < 14; i++) { var x = rnd(40, 760), y = rnd(60, 520), l = rnd(30, 120), an = rnd(-.6, .6); el("path", { d: "M" + x.toFixed(0) + " " + y.toFixed(0) + "l" + (Math.cos(an) * l).toFixed(0) + " " + (Math.sin(an) * l).toFixed(0), "stroke-width": ".8", opacity: ".22" }, sw); }
    var touched = false;
    function set(v) { box.style.setProperty("--x", v + "%"); range.value = v; }
    range.addEventListener("input", function () { touched = true; box.style.setProperty("--x", range.value + "%"); });
    if (reduce) return;
    inView(box, function (v) {
      if (!v || touched || box.dataset.hinted) return; box.dataset.hinted = 1;
      var t0 = performance.now(), keys = [[0, 50], [.35, 78], [.75, 26], [1, 50]];
      (function step(now) {
        if (touched) return;
        var u = clamp((now - t0) / 2600, 0, 1), k = 1; while (keys[k][0] < u) k++;
        var a = keys[k - 1], b = keys[k], f = ease((u - a[0]) / (b[0] - a[0]));
        set((a[1] + (b[1] - a[1]) * f).toFixed(1));
        if (u < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: .5 });
  })();

  /* ---------- route line ---------- */
  (function lineMap() {
    var box = $("#linemap"); if (!box) return;
    var svg = $("svg", box), path = $("#lmpath"), dot = $("#dot");
    var mover = el("path", { d: path.getAttribute("d"), fill: "none", stroke: "none" }, svg);
    $$(".lm-line", box).forEach(function (p) { p.setAttribute("pathLength", 1); });
    var L = mover.getTotalLength(), d = 0, dir = 1, raf = 0, vis = false, last = 0;
    function place() { var p = mover.getPointAtLength(d); dot.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")"); }
    function tick(now) { raf = 0; var dt = Math.min(.05, (now - last) / 1000 || 0); last = now; d += dir * dt * 110; if (d > L) { d = L; dir = -1; } if (d < 0) { d = 0; dir = 1; } place(); if (vis && !document.hidden) raf = requestAnimationFrame(tick); }
    d = L * .45; place();
    if (reduce) { box.classList.add("in"); return; }
    inView(box, function (v) { vis = v; if (v) { box.classList.add("in"); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } } }, { threshold: .25 });
  })();

  /* ---------- booking ticket ---------- */
  var PRICES = { "Exterior refresh": { car: 79, suv: 99, truck: 109 }, "Interior reset": { car: 149, suv: 179, truck: 189 }, "Full detail": { car: 229, suv: 269, truck: 289 }, "Correction + ceramic": { car: 699, suv: 799, truck: 849 } };
  var VEH = { car: "Car or coupe", suv: "SUV or crossover", truck: "Truck or van" };
  var form = $("#bkform"), tk = $(".ticket");
  (function days() {
    var box = $("#days"); if (!box) return;
    var D = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var d = new Date(), n = 0;
    while (n < 7) {
      d.setDate(d.getDate() + 1); if (d.getDay() === 0) continue;
      var lab = document.createElement("label");
      lab.innerHTML = '<input type="radio" name="day" value="' + D[d.getDay()] + ", " + M[d.getMonth()] + " " + d.getDate() + '"' + (n === 1 ? " checked" : "") + '><span><small>' + D[d.getDay()] + "</small><b>" + d.getDate() + "</b></span>";
      box.appendChild(lab); n++;
    }
  })();
  function val(name) { var i = $('input[name="' + name + '"]:checked', form); return i ? i.value : ""; }
  function setDD(id, text) { var e = $(id); if (e.textContent !== text) { e.textContent = text; e.classList.remove("chg"); void e.offsetWidth; e.classList.add("chg"); } }
  var amtShown = 229;
  function ticket() {
    if (!form) return;
    var veh = val("veh") || "car", pkg = val("pkg") || "Full detail", day = val("day"), win = val("win"), addr = $("#addr").value.trim();
    setDD("#tk-veh", VEH[veh]); setDD("#tk-pkg", pkg);
    setDD("#tk-when", day ? day + " · " + win : "Pick a day");
    setDD("#tk-where", addr || "Your driveway");
    var to = PRICES[pkg][veh], from = amtShown, t0 = performance.now(), a = $("#tk-amt");
    amtShown = to;
    (function step(now) { var u = clamp((now - t0) / (reduce ? 1 : 450), 0, 1); a.textContent = "$" + Math.round(from + (to - from) * ease(u)); if (u < 1) requestAnimationFrame(step); })(t0);
    tk.classList.remove("flash"); void tk.offsetWidth; tk.classList.add("flash");
  }
  if (form) {
    form.addEventListener("change", ticket);
    $("#addr").addEventListener("input", function () { setDD("#tk-where", this.value.trim() || "Your driveway"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var done = $("#tkdone"); done.hidden = false; done.style.animation = "none"; void done.offsetWidth; done.style.animation = "";
      tk.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    });
    ticket();
  }

  onScroll();
})();
