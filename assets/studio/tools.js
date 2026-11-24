// Nolan Day Studio sample sites, studio generation: the hands-on tool in the Signature and Immersive versions.
// One of four, picked for the trade: a color swatch studio, a symptom checker, a drag-to-clean pad or a visit builder.
// Whatever the visitor picks goes into the request on the same page (ND.set), nothing is sent anywhere.
(function () {
  "use strict";
  var d = document, ND = window.ND || {set: function () {}};
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$(".tool").forEach(function (t) {
    var kind = t.getAttribute("data-tool"), pad = $(".pad", t), cap = $(".cap b", t), extra = "";
    var pick = function (v) { ND.set("pick", [v, extra].filter(Boolean).join(", ")); };

    if (kind === "swatch") {
      var sw = $(".sw", t), nm = $(".swn", t), cur = "";
      sw.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        $$("button", sw).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        pad.style.setProperty("--paint", b.getAttribute("data-c"));
        cur = b.getAttribute("data-n"); if (nm) nm.textContent = cur; if (cap) cap.textContent = cur;
        pick(cur);
      });
      var art = $(".art", pad);
      if (art) { var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ND.play && ND.play(art); o.disconnect(); } }, {threshold: .3}); o.observe(art); }
    }

    if (kind === "symptom" || kind === "menu") {
      var multi = t.hasAttribute("data-multi") || kind === "menu";
      var note = $(".note", t);
      $$(".sym,.menu", t).forEach(function (g) {
        g.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return;
          if (multi && !g.hasAttribute("data-one")) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
          else $$("button", g).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          if (note && b.getAttribute("data-note")) {
            note.classList.remove("on"); void note.offsetWidth;
            $("b", note).textContent = b.getAttribute("data-h") || b.textContent;
            $("p", note).textContent = b.getAttribute("data-note"); note.classList.add("on");
          }
          var all = $$('button[aria-pressed="true"]', t).map(function (x) { return x.getAttribute("data-h") || x.firstChild.textContent.trim(); });
          pick(all.join(", "));
        });
      });
      var art2 = $(".art", t);
      if (art2) { var o2 = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ND.play && ND.play(art2); o2.disconnect(); } }, {threshold: .3}); o2.observe(art2); }
    }

    if (kind === "wipe") {
      var cv = $("canvas.grime", t), meter = $(".meter", t), art3 = $(".art", t);
      if (art3) { art3.classList.add("go", "live"); }
      var ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), Wd = 0, Ht = 0, total = 0, done = false;
      function rnd(s) { var x = Math.sin(s * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); }
      function grime() {
        var r = cv.getBoundingClientRect(); Wd = Math.round(r.width * dpr); Ht = Math.round(r.height * dpr); cv.width = Wd; cv.height = Ht;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(92,78,52,.82)"; ctx.fillRect(0, 0, Wd, Ht);
        for (var i = 0; i < 260; i++) {
          var x = rnd(i) * Wd, y = rnd(i + 400) * Ht, rr = (8 + rnd(i + 900) * 60) * dpr;
          var g = ctx.createRadialGradient(x, y, 0, x, y, rr), c = i % 3 ? "70,82,44" : "60,48,30";
          g.addColorStop(0, "rgba(" + c + "," + (.35 + rnd(i + 3) * .4) + ")"); g.addColorStop(1, "rgba(" + c + ",0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
        }
        ctx.fillStyle = "rgba(255,255,255,.08)";
        for (var k = 0; k < 900; k++) ctx.fillRect(rnd(k + 7) * Wd, rnd(k + 77) * Ht, 1.5 * dpr, 1.5 * dpr);
        total = 0; done = false; if (meter) meter.textContent = "0% clean";
      }
      var lastP = null;
      function wipe(x, y) {
        ctx.globalCompositeOperation = "destination-out";
        var r = 34 * dpr; ctx.lineCap = "round"; ctx.lineWidth = r * 2;
        ctx.beginPath(); if (lastP) { ctx.moveTo(lastP[0], lastP[1]); ctx.lineTo(x, y); ctx.stroke(); } else { ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
        lastP = [x, y]; total++;
        if (total % 12 === 0) measure();
      }
      function measure() {
        var data = ctx.getImageData(0, 0, Wd, Ht).data, clear = 0, n = 0;
        for (var i = 3; i < data.length; i += 4 * 64) { n++; if (data[i] < 40) clear++; }
        var p = Math.round(clear / n * 100); if (meter) meter.textContent = p + "% clean";
        if (p > 72 && !done) { done = true; cv.style.transition = "opacity 1s"; cv.style.opacity = 0; if (meter) meter.textContent = "Spotless"; pick("Tried the cleaner"); }
      }
      function pos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; }
      var down = false;
      cv.addEventListener("pointerdown", function (e) { down = true; lastP = null; cv.setPointerCapture(e.pointerId); var p = pos(e); wipe(p[0], p[1]); });
      cv.addEventListener("pointermove", function (e) { if (!down) return; var p = pos(e); wipe(p[0], p[1]); });
      cv.addEventListener("pointerup", function () { down = false; lastP = null; measure(); });
      var reset = $("[data-reset]", t);
      if (reset) reset.addEventListener("click", function () { cv.style.transition = "none"; cv.style.opacity = 1; grime(); });
      grime();
      var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (!done) grime(); }, 200); });
      // a little demo swipe so people see what to do
      if (!reduce) {
        var o3 = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return; o3.disconnect();
          var t0 = performance.now();
          (function f(n) { var k = (n - t0) / 900; if (k > 1 || down) { lastP = null; measure(); return; } wipe(Wd * (.25 + k * .4), Ht * (.5 + Math.sin(k * 6) * .06)); requestAnimationFrame(f); })(t0);
        }, {threshold: .5});
        o3.observe(cv);
      }
    }

    var tg = $(".switch", t);
    if (tg) tg.addEventListener("click", function () {
      var onx = tg.getAttribute("aria-checked") !== "true"; tg.setAttribute("aria-checked", String(onx));
      extra = onx ? tg.getAttribute("data-n") : ""; if (pad) pad.classList.toggle("tg-on", onx);
      var p = $('[aria-pressed="true"]', t); pick(p ? (p.getAttribute("data-h") || p.getAttribute("data-n") || p.textContent.trim()) : "");
    });
  });
})();
