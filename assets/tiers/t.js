/* Sample-site tiers: shared behavior. Reads #t-data (written per shop by _build/tiers/build.py).
   Nothing here sends anything: forms and texts explain what the live site will do. */
(function () {
  "use strict";
  var D = {};
  try { D = JSON.parse(document.getElementById("t-data").textContent); } catch (e) { /* page still works without it */ }
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function svg(s) { var d = document.createElement("div"); d.innerHTML = s.trim(); return d.firstChild; }

  /* Immersive: the header turns solid once the 3D hero scrolls away. */
  var sc = $(".t1250 .scene");
  if (sc) { var onS = function () { document.body.classList.toggle("scrolled", scrollY > sc.offsetHeight - 90); }; addEventListener("scroll", onS, { passive: true }); onS(); }

  /* ---------- Signature + Immersive polish ---------- */
  var big = document.body.classList.contains("t750");
  if (big) {
    /* smooth scroll on desktop (Lenis, MIT) */
    if (window.Lenis && !reduce && !matchMedia("(pointer: coarse)").matches) {
      try { var lenis = new window.Lenis({ lerp: .11, anchors: { offset: -80 } }); window.__lenis = lenis;
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now()); } catch (e) { /* native scroll */ }
    }
    /* reading progress */
    var pg = $(".prog");
    if (pg) { var onP = function () { var h = document.documentElement.scrollHeight - innerHeight; pg.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")"; }; addEventListener("scroll", onP, { passive: true }); onP(); }
    /* headline: words rise in one after another */
    var h1 = $(".t750 h1");
    if (h1 && !reduce) {
      var wi = 0;
      Array.prototype.slice.call(h1.children.length ? h1.children : [h1]).forEach(function (part) {
        var words = part.textContent.split(/\s+/).filter(Boolean); part.textContent = "";
        words.forEach(function (w, k) { var sp = el("span", "ws", w); sp.style.setProperty("--i", wi++); part.appendChild(sp); if (k < words.length - 1) part.appendChild(document.createTextNode(" ")); });
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add("split-in"); }); });
    }
    /* line drawings draw themselves in when their card shows */
    $$(".art").forEach(function (a) {
      $$("path,circle,rect", a).forEach(function (p) { var L = 300; try { L = Math.ceil(p.getTotalLength()) + 2; } catch (e) { /* keep default */ } p.style.strokeDasharray = L; p.style.strokeDashoffset = reduce ? 0 : L; });
      var li = a.closest(".rv"); if (!li || reduce) return;
      var go = function () { $$("path,circle,rect", a).forEach(function (p) { p.style.strokeDashoffset = 0; }); };
      if (li.classList.contains("in")) { go(); return; }
      var mo = new MutationObserver(function () { if (li.classList.contains("in")) { go(); mo.disconnect(); } });
      mo.observe(li, { attributes: true, attributeFilter: ["class"] });
    });
    heroFx();
  }

  /* $750 hero: a live, trade-specific effect behind the headline (2D canvas, pauses off screen). */
  function heroFx() {
    var cv = $(".fxh .fx"); if (!cv) return;
    var g = (document.body.className.match(/g-(\w+)/) || [])[1] || "auto";
    var cs = getComputedStyle(document.documentElement), ACC = cs.getPropertyValue("--acc").trim(), ACC2 = cs.getPropertyValue("--acc2").trim(), PAPER = cs.getPropertyValue("--paper").trim();
    var x = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), P = [], t = 0, vis = true, small = innerWidth < 760, R = Math.random, sparks = [];
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); seed(); }
    function bub(any) { var r = 6 + Math.pow(R(), 2) * (small ? 30 : 46); return { x: W * (.35 + R() * .65), y: any ? R() * H : H + r, r: r, vy: 14 + R() * 26, ph: R() * 6 }; }
    function puff(any) { var k = any ? R() : 0; return { x0: W * (.5 + R() * .45), k: k, life: 5 + R() * 4, ph: R() * 6, r0: 18 + R() * 26 }; }
    function seed() {
      P = []; var i, n;
      if (g === "tree") { n = small ? 22 : 44; for (i = 0; i < n; i++) P.push({ x: R() * W, y: R() * H, s: 6 + R() * 10, r: R() * 6, vr: (R() - .5) * 2, vy: 18 + R() * 30, ph: R() * 6, c: [ACC, ACC2, "#6f8f3a", "#c4632b"][i % 4] }); }
      else if (g === "lawn") { n = Math.round(W / (small ? 5 : 4)); for (i = 0; i < n; i++) P.push({ x: i / n * W + R() * 4, h: 40 + Math.pow(R(), 1.6) * (small ? 110 : 190), w: 3 + R() * 4, ph: R() * 6, c: R() < .5 ? ACC2 : (R() < .5 ? ACC : "#2f6b3a") }); P.sort(function (a, b) { return b.h - a.h; }); }
      else if (g === "cleaning") { n = small ? 16 : 30; for (i = 0; i < n; i++) P.push(bub(true)); }
      else if (g === "sweets") { n = small ? 60 : 130; for (i = 0; i < n; i++) P.push({ x: R() * W, y: R() * H, l: 8 + R() * 8, r: R() * 6, vr: (R() - .5) * 3, vy: 30 + R() * 50, c: [ACC, ACC2, "#8fd3c1", "#fff4e8", "#b98ad6"][i % 5] }); }
      else if (g === "beauty" || g === "studio") { n = small ? 26 : 54; for (i = 0; i < n; i++) P.push({ x: W * (.3 + R() * .7), y: R() * H, r: 2 + Math.pow(R(), 3) * (small ? 22 : 34), vy: 4 + R() * 10, ph: R() * 6, c: i % 3 ? ACC : ACC2 }); }
      else if (g === "retail") { n = small ? 22 : 44; for (i = 0; i < n; i++) P.push({ x: R() * W, y: R() * H, s: 5 + R() * 7, r: R() * 6, vr: (R() - .5) * 2.4, vy: 16 + R() * 26, ph: R() * 6, c: [ACC, ACC2, "#fff3f0", ACC][i % 4] }); }
      else if (g === "food") { n = small ? 18 : 34; for (i = 0; i < n; i++) P.push(puff(true)); }
      else if (g === "pets") { n = small ? 14 : 26; for (i = 0; i < n; i++) P.push(bub(true)); }
    }
    function drawAuto(dt) {
      var ex = W * (small ? .8 : .58), ey = H * 1.02, i, p, px, py;
      var gl = x.createRadialGradient(ex, ey, 0, ex, ey, H * .7); gl.addColorStop(0, ACC2 + "55"); gl.addColorStop(.4, ACC + "22"); gl.addColorStop(1, "#0000"); x.fillStyle = gl; x.fillRect(0, 0, W, H);
      for (i = 0; i < (small ? 4 : 8); i++) { var a = -Math.PI / 2 + .12 + (R() - .5) * 1.0, v = 260 + R() * 420; sparks.push({ x: ex, y: ey, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: .7 + R() * .9 }); }
      x.globalCompositeOperation = "lighter"; x.lineCap = "round"; x.lineWidth = 1.6;
      for (i = sparks.length - 1; i >= 0; i--) { p = sparks[i]; px = p.x; py = p.y; p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt;
        if (p.l <= 0 || p.y > H + 10) { sparks.splice(i, 1); continue; }
        x.strokeStyle = p.l > .5 ? "#fff3c4" : ACC2; x.globalAlpha = Math.min(1, p.l * 1.4); x.beginPath(); x.moveTo(px - p.vx * .02, py - p.vy * .02); x.lineTo(p.x, p.y); x.stroke(); }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    }
    var paws = [], pawT = 0, pawK = 0;
    function drawMix(dt) {
      var i;
      if (g === "beauty" || g === "studio") {
        if (g === "studio") { x.globalCompositeOperation = "lighter"; for (i = 0; i < 3; i++) { var ang = -.9 + i * .5 + Math.sin(t * .3 + i * 2) * .18, ox = W * (.62 + i * .14), gr0 = x.createLinearGradient(ox, 0, ox + Math.sin(ang) * H, H);
            gr0.addColorStop(0, ACC + "40"); gr0.addColorStop(1, "#0000"); x.fillStyle = gr0; x.beginPath(); x.moveTo(ox - 8, -10); x.lineTo(ox + 8, -10); x.lineTo(ox + Math.sin(ang) * H * 1.2 + H * .22, H + 10); x.lineTo(ox + Math.sin(ang) * H * 1.2 - H * .22, H + 10); x.fill(); } x.globalCompositeOperation = "source-over"; }
        P.forEach(function (p) { p.y -= p.vy * dt; if (p.y < -p.r * 2) { p.y = H + p.r * 2; p.x = W * (.3 + R() * .7); }
          var a = .25 + .35 * (Math.sin(t * 1.3 + p.ph) * .5 + .5), gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          gr.addColorStop(0, p.c + "cc"); gr.addColorStop(.6, p.c + "44"); gr.addColorStop(1, p.c + "00"); x.globalAlpha = a; x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
          if (p.r < 6) { x.globalAlpha = a * 1.6; x.strokeStyle = "#fff"; x.lineWidth = 1; x.beginPath(); x.moveTo(p.x - p.r * 2, p.y); x.lineTo(p.x + p.r * 2, p.y); x.moveTo(p.x, p.y - p.r * 2); x.lineTo(p.x, p.y + p.r * 2); x.stroke(); } });
        x.globalAlpha = 1;
      } else if (g === "retail") P.forEach(function (p) { p.y += p.vy * dt; p.x += Math.sin(t * .7 + p.ph) * 26 * dt - 6 * dt; p.r += p.vr * dt; if (p.y > H + 20) { p.y = -20; p.x = R() * W; } if (p.x < -20) p.x = W + 20;
          x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.scale(Math.cos(t * 1.8 + p.ph) * .45 + .55, 1); x.fillStyle = p.c; x.globalAlpha = .8;
          x.beginPath(); x.moveTo(0, -p.s); x.bezierCurveTo(p.s, -p.s * .6, p.s * .7, p.s * .6, 0, p.s); x.bezierCurveTo(-p.s * .7, p.s * .6, -p.s, -p.s * .6, 0, -p.s); x.fill(); x.restore(); });
      else if (g === "food") { var gl = x.createRadialGradient(W * .74, H * 1.05, 0, W * .74, H * 1.05, H * .85); gl.addColorStop(0, ACC + "55"); gl.addColorStop(.5, ACC2 + "18"); gl.addColorStop(1, "#0000"); x.fillStyle = gl; x.fillRect(0, 0, W, H);
        P.forEach(function (p, k) { p.k += dt / p.life; if (p.k >= 1) { P[k] = puff(false); return; }
          var yy = H * (1.02 - p.k * .95), xx = p.x0 + Math.sin(p.k * 6 + p.ph + t * .4) * 30 * p.k, r = p.r0 * (1 + p.k * 2.6), a = Math.sin(p.k * Math.PI) * .13;
          var gr = x.createRadialGradient(xx, yy, 0, xx, yy, r); gr.addColorStop(0, "rgba(255,246,236," + a + ")"); gr.addColorStop(1, "rgba(255,246,236,0)"); x.fillStyle = gr; x.beginPath(); x.arc(xx, yy, r, 0, 7); x.fill(); }); }
      else if (g === "pets") {
        P.forEach(function (p, k) { p.y -= p.vy * dt; var bx = p.x + Math.sin(t + p.ph) * 8; if (p.y < -p.r) P[k] = bub(false);
          var gr = x.createRadialGradient(bx - p.r * .35, p.y - p.r * .35, p.r * .1, bx, p.y, p.r); gr.addColorStop(0, "#ffffff12"); gr.addColorStop(.85, ACC2 + "40"); gr.addColorStop(1, "#ffffff55");
          x.fillStyle = gr; x.beginPath(); x.arc(bx, p.y, p.r, 0, 7); x.fill(); });
        pawT += dt; if (pawT > .42) { pawT = 0; pawK++; var row = H * .82, px0 = (pawK * 46) % (W + 200) - 100; paws.push({ x: px0, y: row + (pawK % 2 ? -16 : 16), l: 3.2 }); }
        paws.forEach(function (q) { q.l -= dt; x.globalAlpha = Math.max(0, Math.min(1, q.l / 1.5)) * .55; x.fillStyle = ACC; x.beginPath(); x.ellipse(q.x, q.y, 9, 7.5, 0, 0, 7); x.fill();
          [[-9, -11], [-3, -15], [3, -15], [9, -11]].forEach(function (o) { x.beginPath(); x.ellipse(q.x + o[0], q.y + o[1], 3, 3.8, 0, 0, 7); x.fill(); }); });
        paws = paws.filter(function (q) { return q.l > 0; }); x.globalAlpha = 1;
      } else if (g === "fitness") { var y0 = H * .62, sp = (t * 220) % (W + 300); x.lineJoin = "round"; x.lineCap = "round";
        for (var L = 0; L < 2; L++) { x.strokeStyle = L ? ACC : ACC + "40"; x.lineWidth = L ? 3 : 10; x.beginPath();
          for (var X = 0; X <= W; X += 4) { var d = (X - sp + W + 300) % (W + 300), beat = d < 90 ? [0, -10, 28, -90, 70, -20, 0][Math.floor(d / 13)] || 0 : 0; var Y = y0 + beat * (small ? .6 : 1); if (X === 0) x.moveTo(X, Y); else x.lineTo(X, Y); }
          x.stroke(); }
        x.globalAlpha = .18; x.strokeStyle = ACC2; x.lineWidth = 2; for (i = 0; i < 14; i++) { var yy = (i * 53 + t * 140) % H, xx = W * (.4 + ((i * 37) % 60) / 100); x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 90, yy); x.stroke(); } x.globalAlpha = 1; }
      else if (g === "trades") { var gs = small ? 28 : 40; x.strokeStyle = ACC2 + "22"; x.lineWidth = 1; x.beginPath();
        for (var gx = (t * 6) % gs; gx < W; gx += gs) { x.moveTo(gx, 0); x.lineTo(gx, H); } for (var gy = 0; gy < H; gy += gs) { x.moveTo(0, gy); x.lineTo(W, gy); } x.stroke();
        var k = (t * .18) % 1, cx = W * (small ? .55 : .7), cy = H * .62, s = Math.min(W, H) * (small ? .32 : .42), pts = [[-1, .5], [-1, -.2], [0, -.9], [1, -.2], [1, .5], [-1, .5], [-.25, .5], [-.25, .05], [.25, .05], [.25, .5]], tot = pts.length - 1, upto = k * 1.4 * tot;
        x.strokeStyle = ACC; x.lineWidth = 2.5; x.lineCap = "round"; x.beginPath(); x.moveTo(cx + pts[0][0] * s, cy + pts[0][1] * s);
        for (var q = 1; q <= tot && q - 1 < upto; q++) { var f = Math.min(1, upto - (q - 1)), a0 = pts[q - 1], a1 = pts[q]; x.lineTo(cx + (a0[0] + (a1[0] - a0[0]) * f) * s, cy + (a0[1] + (a1[1] - a0[1]) * f) * s); } x.stroke();
        x.globalAlpha = .5; x.strokeStyle = ACC2; x.lineWidth = 1; x.setLineDash([4, 6]); x.beginPath(); x.moveTo(cx - s, cy + s * .5 + 18); x.lineTo(cx + s, cy + s * .5 + 18); x.moveTo(cx - s, cy + s * .5 + 10); x.lineTo(cx - s, cy + s * .5 + 26); x.moveTo(cx + s, cy + s * .5 + 10); x.lineTo(cx + s, cy + s * .5 + 26); x.stroke(); x.setLineDash([]); x.globalAlpha = 1; }
    }
    function draw(dt) {
      x.clearRect(0, 0, W, H);
      if ({beauty: 1, studio: 1, retail: 1, food: 1, pets: 1, fitness: 1, trades: 1}[g]) { drawMix(dt); return; }
      if (g === "auto") drawAuto(dt);
      else if (g === "tree") P.forEach(function (p) { p.y += p.vy * dt; p.x += Math.sin(t * .8 + p.ph) * 22 * dt + 10 * dt; p.r += p.vr * dt; if (p.y > H + 20) { p.y = -20; p.x = R() * W; } if (p.x > W + 20) p.x = -20;
          x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.scale(1, Math.cos(t * 1.6 + p.ph) * .5 + .6); x.fillStyle = p.c; x.globalAlpha = .85; x.beginPath(); x.ellipse(0, 0, p.s, p.s * .45, 0, 0, 7); x.fill(); x.strokeStyle = "#0003"; x.lineWidth = 1; x.beginPath(); x.moveTo(-p.s, 0); x.lineTo(p.s, 0); x.stroke(); x.restore(); });
      else if (g === "lawn") { P.forEach(function (p) { var sw = Math.sin(t * 1.4 + p.x * .012 + p.ph * .2) * p.h * .22 + Math.sin(t * 2.3 + p.ph) * 3;
          x.fillStyle = p.c; x.globalAlpha = .55 + p.h / 400; x.beginPath(); x.moveTo(p.x - p.w, H); x.quadraticCurveTo(p.x + sw * .3, H - p.h * .5, p.x + sw, H - p.h); x.quadraticCurveTo(p.x + sw * .3 + p.w * .3, H - p.h * .5, p.x + p.w, H); x.fill(); }); x.globalAlpha = 1; }
      else if (g === "painting") { x.lineCap = "round";
        [[ACC, 64, 0], [ACC2, 46, 2.1], [PAPER, 26, 4.2]].forEach(function (s, i) {
          x.strokeStyle = s[0]; x.lineWidth = small ? s[1] * .6 : s[1]; x.globalAlpha = .9; x.beginPath();
          for (var k = 0; k <= 40; k++) { var u = k / 40, px = W * (.5 + u * .62), py = H * (.2 + i * .22) + Math.sin(u * 5 + t * .6 + s[2]) * H * .07 + Math.sin(u * 11 - t * .4) * 10; if (k === 0) x.moveTo(px, py); else x.lineTo(px, py); }
          x.stroke(); }); x.globalAlpha = 1; }
      else if (g === "cleaning") P.forEach(function (p, i) { p.y -= p.vy * dt; var bx = p.x + Math.sin(t + p.ph) * 8; if (p.y < -p.r) P[i] = bub(false);
          var gr = x.createRadialGradient(bx - p.r * .35, p.y - p.r * .35, p.r * .1, bx, p.y, p.r); gr.addColorStop(0, "#ffffff12"); gr.addColorStop(.8, "#ffffff04"); gr.addColorStop(.93, ACC + "50"); gr.addColorStop(1, "#ffffff55");
          x.fillStyle = gr; x.beginPath(); x.arc(bx, p.y, p.r, 0, 7); x.fill(); x.fillStyle = "#ffffffcc"; x.beginPath(); x.ellipse(bx - p.r * .4, p.y - p.r * .42, p.r * .16, p.r * .09, -.7, 0, 7); x.fill(); });
      else if (g === "sweets") { x.lineCap = "round"; x.lineWidth = 4.5;
        P.forEach(function (p) { p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H + 10) { p.y = -10; p.x = R() * W; }
          x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.strokeStyle = p.c; x.beginPath(); x.moveTo(-p.l / 2, 0); x.lineTo(p.l / 2, 0); x.stroke(); x.restore(); }); }
    }
    size(); addEventListener("resize", function () { if (Math.abs(cv.getBoundingClientRect().width - W) > 2) size(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(cv);
    if (reduce) { for (var k = 0; k < 40; k++) { t += .05; draw(.05); } return; }
    var last = performance.now();
    (function loop(now) { requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (!vis || document.hidden) return; t += dt; draw(dt); })(last);
  }

  /* Reveal on scroll. */
  var els = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) els.forEach(function (e) { e.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* Chip groups: one pressed at a time. */
  function chipGroup(box, cb) {
    if (!box) return;
    $$(".chip", box).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".chip", box).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (cb) cb(b.textContent);
      });
    });
  }

  /* Starter: the text writes itself. */
  var bubble = $("[data-bubble]");
  if (bubble) {
    var picked = "";
    chipGroup($("[data-txt]"), function (t) {
      picked = t; bubble.classList.add("on");
      bubble.textContent = "Hi " + D.short + ", I'd like to ask about " + t.toLowerCase().replace(/^something else$/, "something") + ". Can you call or text me back?";
    });
    $("[data-txtgo]").addEventListener("click", function () {
      $("[data-txtnote]").textContent = picked ? "Sample site: nothing was sent. On the live site this opens a text to " + D.phone + " with that message filled in." : "Tap one of the choices above first.";
    });
  }

  /* Request forms (Starter): say what the live site does. */
  $$("[data-req]").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); $(".fine", f).textContent = "Sample site: nothing was sent. On the live site this goes straight to " + D.short + " at " + D.phone + "."; });
  });

  /* Signature: rating counts up. */
  var cnt = $("[data-count]");
  if (cnt && !reduce && "IntersectionObserver" in window) {
    var to = parseFloat(cnt.dataset.count), done = false;
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting || done) return; done = true; o.disconnect();
      var t0 = performance.now(); cnt.textContent = "0.0";
      (function f(t) { var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3); cnt.textContent = (to * e).toFixed(1); if (k < 1) requestAnimationFrame(f); else cnt.textContent = cnt.dataset.count.replace(/\.0$/, "") === cnt.dataset.count ? cnt.dataset.count : String(to); })(t0);
    }, { threshold: .4 }).observe(cnt);
  }

  /* Signature: planner fills a live ticket. */
  var pl = $("[data-planner]");
  function setT(k, v) { var d = $('[data-t="' + k + '"]'); if (!d) return; d.textContent = v || "–"; d.classList.remove("pop"); void d.offsetWidth; d.classList.add("pop"); }
  if (pl) {
    $$("[data-k]", pl).forEach(function (box) { chipGroup(box, function (t) { setT(box.dataset.k, t); }); });
    ["n", "p", "d"].forEach(function (k) { var i = pl.elements[k]; i.addEventListener("input", function () { setT(k, i.value.trim()); }); });
    pl.addEventListener("submit", function (e) { e.preventDefault(); $(".fine", pl).textContent = "Sample site: nothing was sent. On the live site this ticket lands on " + D.short + "'s phone at " + D.phone + "."; });
  }
  function pickJob(name) {
    if (!pl) return;
    var box = $('[data-k="job"]', pl), hit = null;
    $$(".chip", box).forEach(function (b) { if (!hit && b.textContent.toLowerCase().indexOf(name.toLowerCase()) >= 0) hit = b; });
    if (hit) hit.click();
    var d = pl.elements.d; if (d && !d.value) { d.value = name; setT("d", name); }
    if (window.__lenis) window.__lenis.scrollTo("#plan", { offset: -80 }); else $("#plan").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  /* Motion pieces, one per trade. */
  var mp = $("#mp");
  if (!mp) return;
  var G = mp.dataset.g;
  function options(list, onPick, cls) {
    var row = el("div", "row " + (cls || ""));
    list.forEach(function (o, i) {
      var b = el("button", "opt"); b.type = "button"; b.setAttribute("aria-pressed", "false");
      if (o.icon) b.appendChild(svg(o.icon));
      b.appendChild(el("span", null, o.label));
      b.addEventListener("click", function () { $$(".opt", row).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); onPick(o, i); });
      row.appendChild(b);
    });
    return row;
  }
  function outBox(art) {
    var o = el("div", "out"); if (art) o.appendChild(art);
    var t = el("div"); var h = el("h3"), p = el("p"), m = el("div", "meter"), i = el("i"); m.appendChild(i); i.style.width = "0%";
    var a = el("a", "go"); a.href = "#plan"; a.addEventListener("click", function (e) { e.preventDefault(); pickJob(a.dataset.job || ""); });
    t.appendChild(h); t.appendChild(p); t.appendChild(m); t.appendChild(a); o.appendChild(t);
    return { o: o, set: function (title, text, pct, cta, job) { h.textContent = title; p.textContent = text; i.style.width = pct + "%"; m.hidden = pct == null; a.textContent = cta + " →"; a.dataset.job = job || ""; } };
  }
  var I = {
    eng: '<svg viewBox="0 0 24 24" fill="none" stroke="#E8A317" stroke-width="2" stroke-linejoin="round"><path d="M4 10h3l2-2h5l2 2h2v3h2v-2h1v6h-1v-2h-2v3h-3l-2 2H8l-1-2H4z"/></svg>',
    brk: '<svg viewBox="0 0 24 24" fill="none" stroke="#D33A2C" stroke-width="2"><circle cx="12" cy="12" r="6"/><path d="M5 6a9 9 0 0 0 0 12M19 6a9 9 0 0 1 0 12M12 9v4M12 15v.5"/></svg>',
    bat: '<svg viewBox="0 0 24 24" fill="none" stroke="#D33A2C" stroke-width="2"><rect x="3" y="7" width="18" height="12" rx="1"/><path d="M7 7V5M17 7V5M7 13h3M15 11.5v3M13.5 13h3"/></svg>',
    tmp: '<svg viewBox="0 0 24 24" fill="none" stroke="#D33A2C" stroke-width="2"><path d="M12 3v11M9 6h3M9 9h3"/><circle cx="12" cy="17" r="3"/><path d="M4 21c2-1 3 1 5 0s3 1 5 0 3 1 5 0"/></svg>',
    oil: '<svg viewBox="0 0 24 24" fill="none" stroke="#D33A2C" stroke-width="2" stroke-linejoin="round"><path d="M3 12h4l2-2h8l4-2-5 7H7l-4-2zM20 16v1"/></svg>',
    tpm: '<svg viewBox="0 0 24 24" fill="none" stroke="#E8A317" stroke-width="2"><path d="M7 5C4 8 4 16 7 19h10c3-3 3-11 0-14M12 8v5M12 15.5v.5"/></svg>'
  };

  /* Mixed groups: two quick questions, a live picture and a result card. */
  var MIXQ = {
    beauty: { a: "What are you booking?", b: "What's the vibe?", B: ["Fresh and simple", "Something bold", "Classic", "Surprise me"],
      art: '<svg viewBox="0 0 200 170" aria-hidden="true" style="width:100%;max-width:230px;margin:auto"><ellipse cx="100" cy="74" rx="56" ry="64" fill="#fff" stroke="#C9B48A" stroke-width="7"/><ellipse id="mr" cx="100" cy="74" rx="48" ry="56" fill="#DDEBF3" style="transition:fill .6s"/><path id="hr" d="M70 92c-4-36 10-52 30-52s34 16 30 52c-6-18-16-26-30-26s-24 8-30 26z" fill="#5B3A2E" style="transition:fill .6s,transform .6s;transform-origin:100px 70px"/><circle cx="100" cy="84" r="20" fill="#F1C9A8"/><path d="M70 150h60l-6 14H76z" fill="#2b2f36"/><g id="spk"></g></svg>',
      pic: function (A, b) { $("#mr", this.svg).style.fill = ["#DDEBF3", "#F7D9E2", "#EFE6D2", "#E2F1E4"][b.i]; $("#hr", this.svg).style.fill = ["#5B3A2E", "#B5323C", "#2b2f36", "#C99A4A"][b.i]; $("#hr", this.svg).style.transform = "scale(" + [1, 1.12, .96, 1.06][b.i] + ")"; },
      res: function (A, b) { return [A + ", " + b.label.toLowerCase(), "Bring a photo if you have one. " + D.short + " will confirm a time with you."]; } },
    food: { a: "What can we get started?", b: "How many people?", B: ["Just me", "2 to 4", "5 to 10", "A big crowd"],
      art: '<svg viewBox="0 0 200 150" aria-hidden="true" style="width:100%;max-width:240px;margin:auto"><ellipse cx="100" cy="120" rx="84" ry="18" fill="#0001"/><ellipse cx="100" cy="108" rx="80" ry="24" fill="#fff" stroke="#E7DED2" stroke-width="4"/><g id="pl"></g></svg>',
      pic: function (A, b) { var g = $("#pl", this.svg), c = ["#F08A3C", "#F3C25B", "#8C5A3C", "#BFE3C0", "#E86A5A"], h = ""; for (var i = 0; i <= b.i; i++) h += '<ellipse cx="' + (70 + i * 20) + '" cy="' + (100 - i * 3) + '" rx="22" ry="10" fill="' + c[i % 5] + '"/>'; g.innerHTML = h + '<path d="M86 70c-6-8 6-14 0-22M100 66c-6-8 6-14 0-22M114 70c-6-8 6-14 0-22" stroke="#0002" stroke-width="3" fill="none" stroke-linecap="round"/>'; if (!reduce && g.animate) g.animate([{ transform: "translateY(-6px)", opacity: .4 }, { transform: "none", opacity: 1 }], { duration: 400 }); },
      res: function (A, b) { return [A + " · " + b.label.toLowerCase(), "Send it over and " + D.short + " will call you back to confirm the details and the time."]; } },
    retail: { a: "What's the occasion?", b: "Who is it for?", B: ["Her", "Him", "Family", "A friend"],
      art: '<svg viewBox="0 0 180 160" aria-hidden="true" style="width:100%;max-width:210px;margin:auto"><ellipse cx="90" cy="150" rx="62" ry="7" fill="#0001"/><rect x="34" y="66" width="112" height="80" rx="6" id="bx" fill="#D98C9F" style="transition:fill .6s"/><rect x="28" y="52" width="124" height="22" rx="5" id="ld" fill="#C77689" style="transition:fill .6s,transform .5s cubic-bezier(.3,1.5,.5,1);transform-origin:90px 74px"/><rect x="82" y="52" width="16" height="94" fill="#fff"/><path d="M90 52c-18-26-40-16-28-2 6 6 18 2 28 2s22 4 28-2c12-14-10-24-28 2z" fill="#fff"/></svg>',
      pic: function (A, b) { var c = [["#D98C9F", "#C77689"], ["#6E8FAE", "#5A7A99"], ["#B8C79A", "#9DB07E"], ["#F3C25B", "#DDAA3E"]][b.i]; $("#bx", this.svg).style.fill = c[0]; $("#ld", this.svg).style.fill = c[1]; $("#ld", this.svg).style.transform = "translateY(-10px) rotate(-6deg)"; },
      res: function (A, b) { return ["A " + A.toLowerCase() + " gift for " + b.label.toLowerCase(), "Ask " + D.short + " what's in the shop right now. They can set something aside for you."]; } },
    pets: { a: "What does your pet need?", b: "How big is your pet?", B: ["Small", "Medium", "Large", "It's a cat"],
      art: '<svg viewBox="0 0 200 150" aria-hidden="true" style="width:100%;max-width:240px;margin:auto"><rect width="200" height="150" rx="14" fill="#E8F4FA"/><g id="dg" style="transition:transform .6s cubic-bezier(.3,1.4,.4,1);transform-origin:100px 120px"><ellipse cx="100" cy="100" rx="40" ry="24" fill="#E3A857"/><circle cx="68" cy="76" r="22" fill="#E3A857"/><path d="M52 64l-8-18 16 8zM82 62l8-18-14 8z" fill="#B5762F"/><circle cx="62" cy="74" r="3" fill="#222"/><circle cx="76" cy="74" r="3" fill="#222"/><ellipse cx="66" cy="84" rx="5" ry="3.5" fill="#222"/><rect x="76" y="110" width="9" height="20" rx="4" fill="#E3A857"/><rect x="112" y="110" width="9" height="20" rx="4" fill="#E3A857"/><path id="tl" d="M138 94c14-6 18-20 12-28" fill="none" stroke="#E3A857" stroke-width="8" stroke-linecap="round"/></g><g id="bb"></g></svg>',
      pic: function (A, b) { $("#dg", this.svg).style.transform = "scale(" + [.72, .9, 1.1, .8][b.i] + ")"; var g = $("#bb", this.svg); g.innerHTML = ""; for (var i = 0; i < 6; i++) g.innerHTML += '<circle cx="' + (40 + Math.random() * 130) + '" cy="' + (20 + Math.random() * 60) + '" r="' + (4 + Math.random() * 6) + '" fill="#fff" stroke="#9fd3e6" stroke-width="2"/>'; },
      res: function (A, b) { return [A + " · " + b.label.toLowerCase() + (b.i === 3 ? "" : " dog"), "Tell " + D.short + " your pet's name and anything they should know. They'll call to set a time."]; } },
    fitness: { a: "What's the goal?", b: "Days a week you can make it", B: ["2 days", "3 days", "4 days", "5 days"], A: ["Get stronger", "Lose weight", "Feel better", "Learn something new", "Just ask a question"],
      art: '<svg viewBox="0 0 220 90" aria-hidden="true" style="width:100%;max-width:280px;margin:auto"><g id="wk"></g></svg>',
      pic: function (A, b) { var n = b.i + 2, on = [[1, 4], [0, 2, 4], [0, 1, 3, 4], [0, 1, 2, 3, 4]][b.i], h = ""; "MTWTFSS".split("").forEach(function (d, i) { var o = on.indexOf(i) >= 0; h += '<rect x="' + (4 + i * 30) + '" y="10" width="26" height="56" rx="7" fill="' + (o ? getComputedStyle(document.documentElement).getPropertyValue("--acc") : "#0000000f") + '"/><text x="' + (17 + i * 30) + '" y="82" text-anchor="middle" font-size="11" font-weight="700" fill="#0008">' + d + "</text>"; }); $("#wk", this.svg).innerHTML = h; return n; },
      res: function (A, b) { return [A + ", " + b.label, "A simple start: " + b.label + " a week, every week. " + D.short + " can help you set it up on your first visit."]; } },
    studio: { a: "What do you need?", b: "When?", B: null,
      art: '<svg viewBox="0 0 200 140" aria-hidden="true" style="width:100%;max-width:240px;margin:auto"><rect width="200" height="140" rx="14" fill="#262632"/><path d="M20 20l40 0-20 100z" fill="#E9B44C" opacity=".18"/><path d="M180 20l-40 0 20 100z" fill="#8FB3E8" opacity=".18"/><rect x="64" y="34" width="72" height="56" rx="6" fill="#F7F6F2"/><rect id="fr" x="72" y="42" width="56" height="40" fill="#E9B44C" style="transition:fill .6s"/><path d="M60 118h80" stroke="#F7F6F2" stroke-width="4" stroke-linecap="round"/><circle id="fl" cx="100" cy="62" r="70" fill="#fff" opacity="0"/></svg>',
      pic: function (A, b) { $("#fr", this.svg).style.fill = ["#E9B44C", "#8FB3E8", "#D98C9F", "#B8C79A"][b.i % 4]; var f = $("#fl", this.svg); if (!reduce && f.animate) f.animate([{ opacity: .9 }, { opacity: 0 }], { duration: 500 }); },
      res: function (A, b) { return [A + " · " + b.label.toLowerCase(), "Send the details and " + D.short + " will call you back with a plan and a straight price."]; } },
    trades: { a: "What's going on?", b: "How bad is it?", B: ["Just noticed it", "Getting worse", "Needs help now"],
      art: '<svg class="dial" viewBox="0 0 200 130" aria-hidden="true"><path d="M20 110a80 80 0 0 1 160 0" fill="none" stroke="#0001" stroke-width="16" stroke-linecap="round"/><path id="arc" d="M20 110a80 80 0 0 1 160 0" fill="none" stroke="url(#gr2)" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" style="transition:stroke-dasharray .9s cubic-bezier(.2,.8,.2,1)"/><defs><linearGradient id="gr2"><stop offset="0" stop-color="#58B368"/><stop offset=".5" stop-color="#F5B83D"/><stop offset="1" stop-color="#E2382B"/></linearGradient></defs><g id="nd" style="transform-origin:100px 110px;transform:rotate(-90deg);transition:transform .9s cubic-bezier(.3,1.4,.4,1)"><path d="M98 110 100 40 102 110z" fill="#16181d"/></g><circle cx="100" cy="110" r="9" fill="#16181d"/><text x="22" y="128" font-size="10" font-weight="700" fill="#0008">CAN WAIT</text><text x="178" y="128" font-size="10" font-weight="700" fill="#0008" text-anchor="end">CALL NOW</text></svg>',
      pic: function (A, b) { var u = [30, 64, 96][b.i]; $("#arc", this.svg).setAttribute("stroke-dasharray", u + " 100"); $("#nd", this.svg).style.transform = "rotate(" + (-90 + u * 1.8) + "deg)"; },
      res: function (A, b) { return [["Worth a quote soon", "Get it looked at this week", "Call today"][b.i], (b.i === 2 ? "Small problems get expensive fast. Call " + D.short + " at " + D.phone + " and tell them what's going on." : b.i === 1 ? "It's easier and cheaper to fix before it gets worse. Send a request and " + D.short + " will call you back." : "No emergency. A good time to get a straight quote while it's on your mind.")]; } }
  };
  if (MIXQ[G]) {
    var M = MIXQ[G], art0 = svg(M.art), obM = outBox(art0), stM = { a: null, b: null }; M.svg = art0;
    var As = (M.A || D.jobs.filter(function (j) { return j !== "Something else"; })).map(function (l) { return { label: l }; });
    var Bs = (M.B || D.when).map(function (l, i) { return { label: l, i: i }; });
    function updM() {
      if (stM.b) M.pic(stM.a ? stM.a.label : "", stM.b);
      if (!stM.a || !stM.b) { obM.set("Two quick questions", "Tap an answer to each one.", G === "trades" ? 0 : null, "Or just ask " + D.short, ""); return; }
      var r = M.res(stM.a.label, stM.b); obM.set(r[0], r[1], G === "trades" ? [30, 64, 96][stM.b.i] : null, "Add this to my request", stM.a.label);
    }
    var la = el("p", null, M.a), lb = el("p", null, M.b); la.style.fontWeight = lb.style.fontWeight = 700; lb.style.marginTop = "14px"; la.style.marginBottom = lb.style.marginBottom = "8px";
    mp.appendChild(la); mp.appendChild(options(As, function (o) { stM.a = o; updM(); }));
    mp.appendChild(lb); mp.appendChild(options(Bs, function (o) { stM.b = o; updM(); }));
    mp.appendChild(obM.o); updM(); return;
  }

  if (G === "auto") {
    var dial = svg('<svg class="dial" viewBox="0 0 200 130" aria-hidden="true"><path d="M20 110a80 80 0 0 1 160 0" fill="none" stroke="#0001" stroke-width="16" stroke-linecap="round"/><path id="arc" d="M20 110a80 80 0 0 1 160 0" fill="none" stroke="url(#gr)" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" style="transition:stroke-dasharray .9s cubic-bezier(.2,.8,.2,1)"/><defs><linearGradient id="gr"><stop offset="0" stop-color="#58B368"/><stop offset=".5" stop-color="#F5B83D"/><stop offset="1" stop-color="#E2382B"/></linearGradient></defs><g id="nd" style="transform-origin:100px 110px;transform:rotate(-90deg);transition:transform .9s cubic-bezier(.3,1.4,.4,1)"><path d="M98 110 100 40 102 110z" fill="#16181d"/></g><circle cx="100" cy="110" r="9" fill="#16181d"/><text x="22" y="128" font-size="10" font-weight="700" fill="#0008">CAN WAIT</text><text x="178" y="128" font-size="10" font-weight="700" fill="#0008" text-anchor="end">RIGHT NOW</text></svg>');
    var ob = outBox(dial);
    var L = [
      { label: "Check engine", icon: I.eng, u: 60, t: "Check engine light", p: "Steady usually means get it checked soon. Flashing means ease off and have it looked at right away, because driving on it can damage more parts." },
      { label: "Brakes", icon: I.brk, u: 88, t: "Brake warning", p: "It can be the parking brake, low brake fluid or a problem in the system. Brakes are not worth guessing on: have them checked before a long drive." },
      { label: "Battery", icon: I.bat, u: 70, t: "Charging system", p: "The battery or alternator may not be keeping up. The car might not start next time you turn it off, so get it tested soon." },
      { label: "Temperature", icon: I.tmp, u: 96, t: "Engine running hot", p: "Pull over when it's safe and let the engine cool. Driving hot can do serious damage. Call before you go further." },
      { label: "Oil pressure", icon: I.oil, u: 96, t: "Low oil pressure", p: "Stop when it's safe and check the oil. Running an engine without oil pressure can ruin it in minutes." },
      { label: "Tire pressure", icon: I.tpm, u: 38, t: "Tire pressure low", p: "One or more tires are low. Check the pressures soon, and have a tire looked at if one keeps losing air." }];
    mp.appendChild(options(L, function (o) {
      $("#arc", dial).setAttribute("stroke-dasharray", o.u + " 100"); $("#nd", dial).style.transform = "rotate(" + (-90 + o.u * 1.8) + "deg)";
      ob.set(o.t, o.p, null, "Add this to my request", "Warning light");
    }));
    mp.appendChild(ob.o); ob.set("Pick a light", "Tap the symbol that matches your dashboard. " + D.short + " can take it from there.", null, "Or just ask " + D.short, "");
    return;
  }

  if (G === "tree") {
    var tr = svg('<svg viewBox="0 0 220 170" aria-hidden="true" style="width:100%;max-width:260px;margin:auto"><rect width="220" height="170" rx="14" fill="#DCEBF5"/><rect y="140" width="220" height="30" fill="#7FB069"/><g id="hs"><path d="M130 100l35-28 35 28v40h-70z" fill="#E9E1D3"/><path d="M124 104l41-34 41 34" fill="none" stroke="#7A3E2B" stroke-width="7" stroke-linejoin="round"/><rect x="157" y="115" width="16" height="25" fill="#7A3E2B"/></g><path id="ln" d="M0 40 220 26" stroke="#333" stroke-width="1.5" opacity="0"/><g id="tr" style="transform-origin:60px 140px;transition:transform 1s cubic-bezier(.3,1.3,.4,1)"><path d="M55 140c2-30 1-50-2-70h12c-3 20-4 40-2 70z" fill="#6B4A2F"/><circle cx="58" cy="58" r="30" fill="#3E7B3A"/><circle cx="38" cy="72" r="20" fill="#4C8C45"/><circle cx="80" cy="70" r="22" fill="#356C33"/><path id="dd" d="M78 52l18-10M30 60l-14-8" stroke="#6B4A2F" stroke-width="3" opacity="0"/></g></svg>');
    var ob2 = outBox(tr), st = { w: null, s: null };
    var W = [{ label: "Over the house", u: 30 }, { label: "Near the drive", u: 15 }, { label: "Near power lines", u: 45, lines: 1 }, { label: "Open yard", u: 0 }];
    var S = [{ label: "Leaning", u: 45, tilt: 14 }, { label: "Dead branches", u: 35, dead: 1 }, { label: "Cracked trunk", u: 55, tilt: 6 }, { label: "Storm damage", u: 60, tilt: 9 }, { label: "Just overgrown", u: 10 }];
    function upd() {
      var u = (st.w ? st.w.u : 0) + (st.s ? st.s.u : 0);
      $("#tr", tr).style.transform = "rotate(" + ((st.s && st.s.tilt) || 0) + "deg)";
      $("#dd", tr).setAttribute("opacity", st.s && st.s.dead ? 1 : 0);
      $("#ln", tr).setAttribute("opacity", st.w && st.w.lines ? 1 : 0);
      if (!st.w || !st.s) { ob2.set("Two quick questions", "Pick where the tree is and what you're seeing.", u, "Or just ask " + D.short, ""); return; }
      var lines = st.w.lines ? " Stay well away from the lines and call the utility company first." : "";
      var hi = u >= 75, mid = u >= 40;
      ob2.set(hi ? "Get it looked at soon" : mid ? "Worth a look this season" : "No rush, but plan for it",
        (hi ? "A " + st.s.label.toLowerCase() + " tree " + st.w.label.toLowerCase() + " is the kind of thing that gets worse in the next storm." : mid ? "It's not an emergency, but it's easier and safer to deal with before it becomes one." : "Good time to get a quote while it's on your mind.") + lines,
        Math.min(100, u), "Add this to my request", st.s.label === "Storm damage" ? "Storm" : "Remove");
    }
    var lb1 = el("p", null, "Where is it?"), lb2 = el("p", null, "What do you see?"); lb1.style.fontWeight = lb2.style.fontWeight = 700; lb2.style.marginTop = "14px"; lb1.style.marginBottom = lb2.style.marginBottom = "8px";
    mp.appendChild(lb1); mp.appendChild(options(W, function (o) { st.w = o; upd(); }));
    mp.appendChild(lb2); mp.appendChild(options(S, function (o) { st.s = o; upd(); }));
    mp.appendChild(ob2.o); upd(); return;
  }

  if (G === "lawn") {
    var snow = D.v === "snow";
    var yd = svg('<svg viewBox="0 0 220 150" aria-hidden="true" style="width:100%;max-width:280px;margin:auto"><rect id="sk" width="220" height="150" rx="14" fill="#CFE6F7" style="transition:fill .8s"/><circle id="sun" cx="180" cy="34" r="16" fill="#FFD166" style="transition:all .8s"/><rect id="gd" y="96" width="220" height="54" fill="#58B368" style="transition:fill .8s"/><g id="st" opacity="1" style="transition:opacity .8s"><path d="M0 106h220M0 118h220M0 130h220M0 142h220" stroke="#ffffff30" stroke-width="5"/></g><path d="M40 96l35-26 35 26v30H40z" fill="#F3EDE2"/><path d="M34 100l41-32 41 32" fill="none" stroke="#5B4636" stroke-width="6" stroke-linejoin="round"/><circle cx="170" cy="78" r="20" id="tc" fill="#3E7B3A" style="transition:fill .8s"/><rect x="167" y="92" width="6" height="18" fill="#6B4A2F"/><g id="fx"></g></svg>');
    var ob3 = outBox(yd);
    var SE = [
      { label: "Spring", sky: "#D4ECF7", g: "#6CC070", t: "#5FA35A", s: 1, h: "Spring", p: snow ? "Cleanup after the plow season: gravel and edges put back, and the property ready for warm weather." : "Cleanup after winter, first cuts as the grass wakes up, and beds made ready.", j: snow ? "Seasonal" : "Spring" },
      { label: "Summer", sky: "#BFE0F7", g: "#4FA357", t: "#2F6B2E", s: 1, h: "Summer", p: snow ? "Book your winter plan early, before the first snow catches everyone at once." : "Mowing on a schedule, trimmed edges, and a yard that looks sharp all season.", j: snow ? "Seasonal" : "mowing" },
      { label: "Fall", sky: "#F3E3C7", g: "#9AA84E", t: "#D2782F", s: 1, leaves: 1, h: "Fall", p: snow ? "Get on the list before the first storm so your drive and walks are covered." : "Leaves cleared and hauled off, and the yard put to bed for winter.", j: snow ? "Seasonal" : "Fall" },
      { label: "Winter", sky: "#DDE6EE", g: "#F4F7FA", t: "#C8D3DC", s: 0, flakes: 1, h: "Winter", p: snow ? "Drives, lots and walks cleared after the snow, so you can get out in the morning." : "Quiet season. A good time to plan next year's yard and get on the schedule early.", j: snow ? "Driveway" : "Something" }];
    mp.appendChild(options(SE, function (o) {
      $("#sk", yd).style.fill = o.sky; $("#gd", yd).style.fill = o.g; $("#tc", yd).style.fill = o.t; $("#st", yd).style.opacity = o.s;
      var fx = $("#fx", yd); fx.innerHTML = "";
      var n = o.leaves || o.flakes ? 14 : 0;
      for (var i = 0; i < n; i++) { var c = document.createElementNS("http://www.w3.org/2000/svg", o.flakes ? "circle" : "ellipse"); var x = 10 + Math.random() * 200;
        c.setAttribute("cx", x); c.setAttribute("cy", -5); if (o.flakes) c.setAttribute("r", 2 + Math.random() * 2); else { c.setAttribute("rx", 3); c.setAttribute("ry", 2); }
        c.setAttribute("fill", o.flakes ? "#fff" : ["#D2782F", "#E8A33D", "#B5502A"][i % 3]);
        if (!reduce && c.animate) c.animate([{ transform: "translate(0,0)" }, { transform: "translate(" + (Math.random() * 30 - 15) + "px,160px)" }], { duration: 2400 + Math.random() * 2400, delay: Math.random() * 2000, iterations: Infinity });
        fx.appendChild(c); }
      ob3.set(o.h, o.p, null, "Add this to my request", o.j);
    }));
    mp.appendChild(ob3.o); ob3.set("Pick a season", "See what the " + (snow ? "property" : "yard") + " needs and when " + D.short + " can help.", null, "Or just ask " + D.short, "");
    return;
  }

  if (G === "painting") {
    var rm = svg('<svg class="room" viewBox="0 0 320 200" aria-label="A room you can recolor"><rect id="wl" width="320" height="160" fill="#E9E4DA"/><rect id="ac" x="200" width="120" height="160" fill="#D9D2C5"/><rect y="152" width="320" height="8" id="tm" fill="#FFFFFF"/><rect y="160" width="320" height="40" fill="#B98C5E"/><path d="M0 172h320M0 186h320" stroke="#0001"/><rect x="40" y="38" width="70" height="62" rx="3" id="fr" fill="#FFFFFF"/><rect x="46" y="44" width="58" height="50" fill="#CFE6F7"/><rect x="232" y="56" width="58" height="96" rx="3" id="dr" fill="#FFFFFF"/><circle cx="280" cy="106" r="3" fill="#B9A37A"/><rect x="72" y="118" width="110" height="34" rx="10" fill="#5A6B7A"/><rect x="66" y="110" width="20" height="42" rx="8" fill="#4D5D6B"/><rect x="168" y="110" width="20" height="42" rx="8" fill="#4D5D6B"/><circle cx="150" cy="30" r="0" fill="none"/></svg>');
    var ob4 = outBox(rm), target = "wall";
    var C = [["Swiss Cream", "#F1E7D0"], ["Sage", "#B8C4A6"], ["Harbor Blue", "#6E8FAE"], ["Clay", "#C9876A"], ["Charcoal", "#4A4E57"], ["Butter", "#F3D98B"], ["Blush", "#E9C2BA"], ["Forest", "#3F5E4A"]];
    var tg = options([{ label: "Walls" }, { label: "Accent wall" }, { label: "Trim and door" }], function (o) { target = o.label; });
    $(".opt", tg).setAttribute("aria-pressed", "true"); target = "Walls";
    mp.appendChild(rm); mp.appendChild(tg);
    var sw = el("div", "swatches");
    C.forEach(function (c) {
      var b = el("button", "sw"); b.type = "button"; b.style.background = c[1]; b.setAttribute("aria-label", c[0]); b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        $$(".sw", sw).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (target === "Walls") { $("#wl", rm).style.fill = c[1]; }
        else if (target === "Accent wall") $("#ac", rm).style.fill = c[1];
        else ["#tm", "#fr", "#dr"].forEach(function (s) { $(s, rm).style.fill = c[1]; });
        ob4.set(c[0] + " on the " + target.toLowerCase(), "Picking colors is the fun part. " + D.short + " handles the prep, the clean lines and the cleanup.", null, "Add this to my request", "Interior");
      });
      sw.appendChild(b);
    });
    mp.appendChild(sw); ob4.o.style.gridTemplateColumns = "1fr"; mp.appendChild(ob4.o);
    ob4.set("Tap a swatch", "Choose walls, an accent wall or the trim, then tap a color.", null, "Or just ask " + D.short, "");
    return;
  }

  if (G === "cleaning") {
    var biz = D.v === "janitorial";
    var R = biz ? ["Offices", "Restrooms", "Break room", "Lobby", "Floors", "Windows"] : ["Kitchen", "Bathrooms", "Bedrooms", "Living room", "Floors", "Windows"];
    var plan = svg('<svg viewBox="0 0 240 150" aria-hidden="true" style="width:100%;max-width:300px;margin:auto"><rect width="240" height="150" rx="12" fill="#fff"/>' +
      [[8, 8, 110, 64], [122, 8, 110, 40], [122, 52, 52, 54], [8, 76, 110, 66], [178, 52, 54, 54], [122, 110, 110, 32]].map(function (r, i) {
        return '<g class="rm" data-i="' + i + '"><rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="6" fill="#E8EEF0" stroke="#C9D3D6" style="transition:fill .5s"/><text x="' + (r[0] + 8) + '" y="' + (r[1] + 14) + '" font-size="' + (r[2] < 60 ? 7.5 : 10) + '" font-weight="700" fill="#0009">' + R[i] + '</text></g>';
      }).join("") + "</svg>");
    var ob5 = outBox(plan), on = {};
    var row = el("div", "row");
    R.forEach(function (name, i) {
      var b = el("button", "opt", name); b.type = "button"; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        on[i] = !on[i]; b.setAttribute("aria-pressed", String(!!on[i]));
        var g = $('[data-i="' + i + '"] rect', plan); g.style.fill = on[i] ? "#BDF0EC" : "#E8EEF0";
        if (on[i] && !reduce) { for (var k = 0; k < 4; k++) { var s = document.createElementNS("http://www.w3.org/2000/svg", "path"); var bx = +g.getAttribute("x") + Math.random() * +g.getAttribute("width"), by = +g.getAttribute("y") + 10 + Math.random() * (+g.getAttribute("height") - 10);
          s.setAttribute("d", "M" + bx + " " + (by - 5) + "l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"); s.setAttribute("fill", "#33C3C8"); plan.appendChild(s);
          if (s.animate) s.animate([{ opacity: 0, transform: "scale(.3)" }, { opacity: 1, transform: "scale(1)" }, { opacity: 0 }], { duration: 1100, delay: k * 120 }).onfinish = (function (x) { return function () { x.remove(); }; })(s); else s.remove(); } }
        var n = Object.keys(on).filter(function (k) { return on[k]; }).length;
        ob5.set(n ? n + " of " + R.length + " picked" : "Pick the rooms", n ? "Your clean, your way. " + D.short + " will confirm the details and the price when they call you back." : "Tap each one you want done.", n / R.length * 100, "Add this to my request", biz ? "Regular" : n >= 5 ? "Deep" : "Regular");
      });
      row.appendChild(b);
    });
    mp.appendChild(row); mp.appendChild(ob5.o); ob5.set("Pick the rooms", "Tap each one you want done.", 0, "Or just ask " + D.short, "");
    return;
  }

  if (G === "sweets") {
    var cake = D.v === "icecream";
    var art = svg('<svg viewBox="0 0 160 170" aria-hidden="true" style="width:100%;max-width:200px;margin:auto"><ellipse cx="80" cy="160" rx="60" ry="7" fill="#0001"/><g id="lay"></g></svg>');
    var ob6 = outBox(art), occ = null, size = null;
    var O = [{ label: "Birthday" }, { label: "Office" }, { label: "Holiday" }, { label: "Just because" }];
    var Z = [{ label: "A few people", n: 1 }, { label: "A party", n: 2 }, { label: "A big crowd", n: 3 }];
    function draw() {
      var g = $("#lay", art); g.innerHTML = ""; var n = size ? size.n : 1;
      var cols = ["#FF7AA2", "#FFD39A", "#8C5A3C", "#BFE3C0"];
      if (cake) {
        g.innerHTML = '<path d="M62 100 80 158 98 100z" fill="#E3A857"/><path d="M66 106h28M70 118h20M74 130h12" stroke="#C78B3D" stroke-width="2"/>';
        for (var i = 0; i < n + 1; i++) g.innerHTML += '<circle cx="80" cy="' + (92 - i * 24) + '" r="' + (22 - i) + '" fill="' + cols[i % 4] + '"/>';
      } else {
        for (var k = 0; k < n; k++) { var w = 110 - k * 26, y = 150 - (k + 1) * 32;
          g.innerHTML += '<rect x="' + (80 - w / 2) + '" y="' + y + '" width="' + w + '" height="32" rx="6" fill="' + cols[k % 4] + '"/><path d="M' + (80 - w / 2) + ' ' + (y + 6) + 'q' + w / 8 + ' 8 ' + w / 4 + ' 0t' + w / 4 + ' 0t' + w / 4 + ' 0t' + w / 4 + ' 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'; }
        if (occ && occ.label === "Birthday") { var top = 150 - n * 32; g.innerHTML += '<rect x="78" y="' + (top - 16) + '" width="4" height="16" fill="#5B8DEF"/><path d="M80 ' + (top - 26) + 'c4 4 4 8 0 9-4-1-4-5 0-9z" fill="#FFB020"/>'; }
      }
      if (!reduce && g.animate) g.animate([{ transform: "translateY(-8px)", opacity: .4 }, { transform: "none", opacity: 1 }], { duration: 450, easing: "cubic-bezier(.3,1.5,.5,1)" });
      if (occ && size) ob6.set(occ.label + " · " + size.label.toLowerCase(), "Tell " + D.short + " the date and they'll call you back to sort out the details.", null, "Add this to my request", occ.label === "Office" ? "Office" : occ.label === "Birthday" ? "Birthday" : "Party");
      else ob6.set("Pick the occasion and the size", "Watch your order come together.", null, "Or just ask " + D.short, "");
    }
    mp.appendChild(options(O, function (o) { occ = o; draw(); }));
    var s2 = options(Z, function (o) { size = o; draw(); }); s2.style.marginTop = "8px"; mp.appendChild(s2);
    mp.appendChild(ob6.o); draw();
  }

})();
