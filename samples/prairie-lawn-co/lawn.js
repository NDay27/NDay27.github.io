/* Prairie Lawn Co. — sample site by Nolan Day Studio (made-up business).
   The mowing hero, the stripe pattern plate, the season ring, the route map and the sample quote form. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- reveal on scroll ---------- */
  var hero = $(".hero");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(function (n) { if (!hero.contains(n)) io.observe(n); });
  } else $$(".rv").forEach(function (n) { n.classList.add("in"); });
  // hero comes in on load, staggered
  requestAnimationFrame(function () {
    hero.classList.add("go");
    $$(".rv", hero).forEach(function (n, i) { setTimeout(function () { n.classList.add("in"); }, reduce ? 0 : 80 + i * 110); });
  });

  /* ---------- header state + current section ---------- */
  var nav = $("#nav"), cbar = $("#cbar"), quote = $("#quote");
  var links = $$(".links a");
  var secs = links.map(function (a) { return $(a.getAttribute("href")); });
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = scrollY;
    nav.classList.toggle("scrolled", y > 8);
    var hb = hero.getBoundingClientRect().bottom, q = quote.getBoundingClientRect();
    cbar.classList.toggle("on", hb < innerHeight * 0.3 && !(q.top < innerHeight * 0.85 && q.bottom > 0));
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("cur", i === cur); });
    // hero parallax
    if (!reduce && hb > 0) {
      tl.style.transform = "translate3d(0," + (y * 0.2).toFixed(1) + "px,0)";
      house.style.setProperty("--py", (y * 0.12).toFixed(1) + "px");
      sun.style.transform = "translate3d(0," + (y * 0.32).toFixed(1) + "px,0)";
    }
    steps();
  }
  var tl = $(".treeline"), house = $(".house"), sun = $(".sun");
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);

  /* ---------- the mowing hero ---------- */
  (function lawn() {
    var cv = $("#lawn"); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var Z = 3.4, W, H, dpr, vx, S, yN, N, base, cut, shrubs, lw = 0.2;
    var t = 0, last = 0, raf = 0, onScreen = true, parts = [];
    var LANE = 2.3, TURN = 0.55, HOLD = 2.6, GROW = 1.4;
    function yz(z) { return yN * (1 / z - 1 / Z) / (1 - 1 / Z); }
    function zy(y) { return 1 / ((y / yN) * (1 - 1 / Z) + 1 / Z); }
    function px(X, z) { return vx + X * S / z; }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function layer() { var c = document.createElement("canvas"); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); var x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); return [c, x]; }
    function quad(x, X1, X2, z1, z2) { x.moveTo(px(X1, z1), yz(z1)); x.lineTo(px(X2, z1), yz(z1)); x.lineTo(px(X2, z2), yz(z2)); x.lineTo(px(X1, z2), yz(z2)); x.closePath(); }
    function haze(x) { var g = x.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, "rgba(244,238,214,.42)"); g.addColorStop(1, "rgba(244,238,214,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H * 0.6); }

    function build() {
      W = cv.clientWidth; H = cv.clientHeight; if (!W || !H) return false;
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      vx = W * (parseFloat(getComputedStyle(hero).getPropertyValue("--vx")) || 0.7);
      var hw = house.getBoundingClientRect().width || W * 0.33;
      S = hw * 0.34 * Z; yN = H * 1.04;
      N = W < 700 ? 8 : 10; lw = 2 / N;
      var area = W * H;
      // base: neighbour grass, mulch beds, steel edging and the uncut lawn
      var b = layer(), x = b[1]; base = b[0];
      var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#86a866"); g.addColorStop(1, "#6f9a50"); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (var i = 0; i < area / 40; i++) { var yy = rnd(0, H), zz = zy(yy); x.fillStyle = Math.random() < .5 ? "rgba(40,70,30,.16)" : "rgba(220,235,180,.14)"; x.fillRect(rnd(0, W), yy, 1.4 / zz + .4, 1.4 / zz + .4); }
      x.fillStyle = "#5c3d27"; x.beginPath(); quad(x, 1, 1.2, 1, Z); quad(x, -1.2, -1, 1, Z); x.fill();
      x.save(); x.clip();
      for (i = 0; i < area / 60; i++) { yy = rnd(0, H); zz = zy(yy); x.fillStyle = ["#6e4a31", "#4a2f1e", "#7a5338", "#3f2818"][i % 4]; x.fillRect(rnd(0, W), yy, 3 / zz, 1.6 / zz); }
      x.restore();
      x.fillStyle = "#517f3c"; x.beginPath(); quad(x, -1, 1, 1, Z); x.fill();
      x.save(); x.beginPath(); quad(x, -1, 1, 1, Z); x.clip();
      var cols = ["#3f7430", "#5c9a44", "#6aa24c", "#4a8236", "#8fb35c", "#a7bd66"];
      // blades, batched by colour and by depth band so it builds fast
      for (var band = 0; band < 6; band++) {
        var y0 = H * band / 6, y1 = H * (band + 1) / 6, zb = zy((y0 + y1) / 2);
        x.lineWidth = Math.max(.6, 1.7 / zb);
        for (var ci = 0; ci < cols.length; ci++) {
          x.strokeStyle = cols[ci]; x.beginPath();
          for (i = 0; i < area / 9 / 6 / cols.length; i++) {
            yy = rnd(y0 - 4, y1); zz = zy(Math.max(yy, 0)); var X = rnd(-1, 1), xx = px(X, zz), len = (12 + Math.random() * 10) / zz * (H / 360);
            x.moveTo(xx, yy); x.lineTo(xx + rnd(-3, 3) / zz, yy - len);
          }
          x.stroke();
        }
      }
      x.restore();
      x.strokeStyle = "#e6dcc0"; x.lineCap = "round";
      [-1, 1].forEach(function (s) { x.lineWidth = 1.2; x.beginPath(); x.moveTo(px(s, Z), yz(Z)); x.lineTo(px(s, 1), yz(1)); x.lineWidth = 2.6; x.stroke(); });
      haze(x);

      // cut lawn: alternating light and dark lanes
      var c2 = layer(); cut = c2[0]; x = c2[1];
      for (i = 0; i < N; i++) {
        x.fillStyle = i % 2 ? "#5d9a40" : "#8ac55c"; x.beginPath(); quad(x, -1 + i * lw - .002, -1 + (i + 1) * lw + .002, 1, Z); x.fill();
      }
      x.save(); x.beginPath(); quad(x, -1, 1, 1, Z); x.clip();
      for (i = 0; i < area / 22; i++) { yy = rnd(0, H); zz = zy(yy); x.fillStyle = Math.random() < .5 ? "rgba(20,60,20,.12)" : "rgba(255,255,220,.10)"; x.fillRect(rnd(0, W), yy, 2.2 / zz, .9 / zz + .3); }
      x.restore();
      haze(x);

      // shrubs and fall mums along the beds, far to near
      var c3 = layer(); shrubs = c3[0]; x = c3[1];
      for (var z = Z - 0.08, k = 0; z > 0.9; z -= 0.27, k++) {
        [-1.1, 1.1].forEach(function (Xs, side) {
          var cx = px(Xs, z), cy = yz(z), r = 0.075 * S / z;
          if (cx < -r * 2 || cx > W + r * 2) return;
          x.fillStyle = "rgba(30,40,20,.25)"; x.beginPath(); x.ellipse(cx, cy + r * .1, r * 1.25, r * .32, 0, 0, Math.PI * 2); x.fill();
          if ((k + side) % 3 === 1) {
            x.fillStyle = "#3d6a3a"; x.beginPath(); x.ellipse(cx, cy - r * .5, r * 1.05, r * .62, 0, 0, Math.PI * 2); x.fill();
            for (var m = 0; m < 26; m++) { var a = Math.random() * Math.PI, rr = Math.random() * r * .95; x.fillStyle = m % 3 ? "#e8a52a" : "#c8643b"; x.beginPath(); x.arc(cx + Math.cos(a) * rr, cy - r * .6 - Math.sin(a) * rr * .55, Math.max(.8, r * .13), 0, Math.PI * 2); x.fill(); }
          } else {
            x.fillStyle = "#355d33"; x.beginPath(); x.arc(cx - r * .45, cy - r * .55, r * .62, 0, Math.PI * 2); x.arc(cx + r * .45, cy - r * .55, r * .62, 0, Math.PI * 2); x.fill();
            x.fillStyle = "#467a40"; x.beginPath(); x.arc(cx, cy - r * .85, r * .72, 0, Math.PI * 2); x.fill();
            x.fillStyle = "#5f9450"; x.beginPath(); x.arc(cx - r * .22, cy - r * 1.05, r * .34, 0, Math.PI * 2); x.fill();
          }
        });
      }
      return true;
    }

    // timeline: lane i mows for LANE seconds, then turns into lane i+1
    function total() { return N * LANE + (N - 1) * TURN; }
    function state(tt) {
      var T = total();
      if (tt >= T) return { done: N, lane: N - 1, u: 1, turn: 0, hold: tt - T };
      var per = LANE + TURN, i = Math.floor(tt / per), r = tt - i * per;
      if (r < LANE) return { done: i, lane: i, u: r / LANE, turn: 0 };
      return { done: i + 1, lane: i, u: 1, turn: (r - LANE) / TURN };
    }
    function ease(u) { return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
    function laneX(i) { return -1 + (i + .5) * lw; }
    function mowY(i, u) { return (i % 2 ? 1 - u : u) * yN * .985; }

    function drawMower(x, y, w, bob) {
      var u = w / 100;
      ctx.save(); ctx.translate(x, y + bob); ctx.scale(u, u);
      ctx.fillStyle = "rgba(18,36,14,.32)"; ctx.beginPath(); ctx.ellipse(0, -2, 64, 9, 0, 0, Math.PI * 2); ctx.fill();
      function rr(a, b, c, d, r, f) { ctx.fillStyle = f; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(a, b, c, d, r); else ctx.rect(a, b, c, d); ctx.fill(); }
      rr(-52, -18, 104, 15, 6, "#2b322e"); rr(-52, -18, 104, 4, 3, "#46504a");
      rr(-58, -40, 17, 36, 6, "#141916"); rr(41, -40, 17, 36, 6, "#141916");
      rr(-54, -28, 9, 10, 2, "#f0b429"); rr(45, -28, 9, 10, 2, "#f0b429");
      rr(-31, -50, 62, 34, 11, "#f0b429"); rr(-31, -28, 62, 12, 6, "#d6950f");
      rr(-12, -42, 24, 9, 3, "#2b322e");
      rr(-21, -74, 42, 26, 8, "#232b27");
      rr(-17, -92, 34, 32, 12, "#2f6b3f");
      ctx.strokeStyle = "#141916"; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, -56, 12, 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#d9a074"; ctx.beginPath(); ctx.arc(0, -100, 9.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#163824"; ctx.beginPath(); ctx.arc(0, -102, 10, Math.PI, 0); ctx.fill(); rr(-13, -103, 26, 3.4, 2, "#163824");
      ctx.restore();
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(.05, (now - last) / 1000 || 0); last = now; t += dt;
      var T = total(), st = state(t), alpha = 1, grow = 0;
      if (st.hold != null) {
        if (st.hold > HOLD) { grow = clamp((st.hold - HOLD) / GROW, 0, 1); alpha = 1 - grow; }
        if (st.hold > HOLD + GROW + .3) { t = 0; parts.length = 0; st = state(0); grow = 0; alpha = 1; }
      }
      draw(st, grow, alpha, dt, now);
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function draw(st, grow, alpha, dt, now) {
      if (!base) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // mowed area
      ctx.save(); ctx.beginPath();
      for (var i = 0; i < st.done; i++) quad(ctx, -1 + i * lw, -1 + (i + 1) * lw, 1, Z);
      if (st.done === st.lane && st.u > 0) {
        var y2 = mowY(st.lane, st.u), z2 = zy(Math.max(.5, Math.min(y2, yN)));
        var a = st.lane % 2 ? 1 : Z;
        quad(ctx, -1 + st.lane * lw, -1 + (st.lane + 1) * lw, a, z2);
      }
      ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cut, 0, 0); ctx.restore();
      if (grow > 0) { ctx.globalAlpha = grow; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0); ctx.globalAlpha = 1; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(shrubs, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce || !mowerOn) return;
      // mower position
      var X = laneX(st.lane), y = mowY(st.lane, st.u);
      if (st.turn) { X = laneX(st.lane) + lw * ease(st.turn); }
      if (st.hold != null && st.hold < .01) {}
      var z = zy(clamp(y, 1, yN)), mx = px(X, z), w = 0.15 * S / z;
      // fade in at the start of a cycle, out while it regrows
      var fa = Math.min(1, t / .5) * alpha;
      // clippings
      if (st.hold == null && !st.turn && dt > 0) {
        for (var k = 0; k < 3; k++) {
          var sc = w / 100;
          parts.push({ x: mx + w * .5, y: y - w * .12, vx: rnd(70, 190) * sc, vy: -rnd(60, 170) * sc, g: 520 * sc, l: rnd(.5, .9), a: 0, r: rnd(1.4, 3.2) * sc + .4, c: Math.random() < .5 ? "#7fbf52" : "#a9d27a" });
        }
      }
      ctx.globalAlpha = fa;
      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p]; q.a += dt; if (q.a > q.l) { parts.splice(p, 1); continue; }
        q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        ctx.globalAlpha = fa * (1 - q.a / q.l); ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, q.r * 1.6, q.r);
      }
      ctx.globalAlpha = fa;
      drawMower(mx, y, w, st.hold == null ? Math.sin(now / 38) * w * .006 : 0);
      ctx.globalAlpha = 1;
    }
    var mowerOn = true;
    function start() { if (!raf && onScreen && !reduce && base) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stillFrame() { draw({ done: N, lane: N - 1, u: 1, turn: 0, hold: 0 }, 0, 1, 0, 0); }
    function init() {
      if (!build()) return;
      if (reduce) { stillFrame(); return; }
      if (!t) t = 3 * (LANE + TURN) + .2; // open with a few lanes already striped
      draw(state(t), 0, 1, 0, performance.now());
      start();
    }
    var rw = 0, rt;
    addEventListener("resize", function () { if (cv.clientWidth === rw) return; clearTimeout(rt); rt = setTimeout(function () { rw = cv.clientWidth; init(); }, 150); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) start(); }).observe(cv);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
    rw = cv.clientWidth;
    init();
    // houses take a moment to size: build again once everything has loaded
    addEventListener("load", function () { if (cv.clientWidth) { rw = cv.clientWidth; build(); } });
  })();

  /* ---------- stripe pattern plate ---------- */
  (function plate() {
    var A = $("#layA"), B = $("#layB"), note = $("#pat-note"), btns = $$(".pat-pick button");
    if (!A) return;
    var pats = {
      lines: { a: [0], txt: "Classic lines: one direction, back and forth. Clean, and easy on the turf." },
      diag: { a: [45], txt: "Diagonal: lines run corner to corner, which makes a small yard look longer." },
      check: { a: [0, 90], txt: "Checkerboard: mowed one way, then across. The ballpark look." },
      diamond: { a: [45, -45], txt: "Diamond: two diagonal passes that cross. The showiest of the four." }
    };
    function fill(g, ang, d0, two) {
      g.innerHTML = ""; g.classList.remove("on");
      g.setAttribute("transform", "rotate(" + ang + " 200 200)");
      var w = 40, n = Math.ceil(620 / w);
      for (var i = 0; i < n; i++) {
        var r = el("rect", { x: -110 + i * w, y: -110, width: w + .5, height: 620, fill: i % 2 ? (two ? "rgba(0,0,0,.085)" : "rgba(0,0,0,.13)") : (two ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.2)") }, g);
        r.setAttribute("class", i % 2 ? "up" : "dn"); r.style.setProperty("--d", d0 + i * 55);
      }
    }
    var cur = "lines", touched = false;
    function set(k) {
      cur = k; var p = pats[k], two = p.a.length > 1;
      fill(A, p.a[0], 0, two);
      if (two) fill(B, p.a[1], 900, true); else { B.innerHTML = ""; B.classList.remove("on"); }
      btns.forEach(function (b) { b.setAttribute("aria-checked", b.dataset.pat === k ? "true" : "false"); });
      note.textContent = p.txt;
      void A.getBoundingClientRect();
      requestAnimationFrame(function () { requestAnimationFrame(function () { A.classList.add("on"); if (two) B.classList.add("on"); }); });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { touched = true; set(b.dataset.pat); }); });
    set("lines");
    // keep cycling patterns while it's on screen, until someone picks one
    var keys = Object.keys(pats), timer = 0;
    function cycle() { if (touched) return; set(keys[(keys.indexOf(cur) + 1) % keys.length]); }
    if (!reduce && "IntersectionObserver" in window) new IntersectionObserver(function (es) {
      clearInterval(timer); if (es[0].isIntersecting && !touched) timer = setInterval(cycle, 4800);
    }, { threshold: .35 }).observe($("#plate"));
  })();

  /* ---------- the season ring ---------- */
  (function ring() {
    var svg = $("#ring"); if (!svg) return;
    var mg = $("#ring-months"), ag = $("#ring-arcs"), C = 220;
    var MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function pt(m, r) { var a = m / 12 * Math.PI * 2 - Math.PI / 2; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; }
    var now = new Date(), mf = now.getMonth() + (now.getDate() - 1) / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (var m = 0; m < 12; m++) {
      var p = pt(m + .5, 207), t = el("text", { x: p[0].toFixed(1), y: p[1].toFixed(1), "text-anchor": "middle", "dominant-baseline": "central", "class": "mlab" + (m === now.getMonth() ? " now" : "") }, mg); t.textContent = MO[m];
      var a = pt(m, 190), b = pt(m, 197); el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], "class": "tick" }, mg);
    }
    var S = [
      { k: "spring", c: "#c8643b", a: 2.45, b: 4 },
      { k: "mulch", c: "#6b4630", a: 3, b: 5 },
      { k: "mow", c: "#5f9c41", a: 3, b: 10 },
      { k: "aerate", c: "#f0b429", a: 7.6, b: 9 },
      { k: "fall", c: "#a34a2a", a: 9.45, b: 11 },
      { k: "snow", c: "#7fb0c9", a: 10.5, b: 14.5 }
    ];
    var arcs = {};
    S.forEach(function (s, i) {
      var r = 178 - i * 15;
      el("circle", { cx: C, cy: C, r: r, "class": "trk" }, ag);
      var p1 = pt(s.a, r), p2 = pt(s.b, r), big = (s.b - s.a) > 6 ? 1 : 0;
      var path = el("path", { d: "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + "A" + r + " " + r + " 0 " + big + " 1 " + p2[0].toFixed(1) + " " + p2[1].toFixed(1), pathLength: 1, stroke: s.c, "class": "arc", "stroke-dasharray": "1 2", "stroke-dashoffset": reduce ? 0 : 1 }, ag);
      path.style.setProperty("--i", i); arcs[s.k] = path;
      var on = (mf >= s.a && mf < s.b) || (mf + 12 >= s.a && mf + 12 < s.b);
      if (on) { var li = $('[data-k="' + s.k + '"] b'); if (li) { var tag = document.createElement("span"); tag.className = "now-tag"; tag.textContent = "Now"; li.appendChild(tag); } }
    });
    $("#ring-now").textContent = FULL[now.getMonth()];
    var hand = $("#ring-hand");
    function go() { ag.querySelectorAll(".arc").forEach(function (a) { a.setAttribute("stroke-dashoffset", 0); a.style.strokeDashoffset = 0; }); hand.style.transform = "rotate(" + (mf / 12 * 360).toFixed(1) + "deg)"; }
    if (reduce || !("IntersectionObserver" in window)) go();
    else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { go(); o.disconnect(); } }, { threshold: .3 }).observe(svg);
    $$("#season-list button").forEach(function (b) {
      function on() { svg.classList.add("dim"); $$("#season-list button").forEach(function (x) { x.classList.toggle("on", x === b); }); for (var k in arcs) arcs[k].classList.toggle("hi", k === b.dataset.k); }
      function off() { svg.classList.remove("dim"); b.classList.remove("on"); }
      b.addEventListener("mouseenter", on); b.addEventListener("focus", on); b.addEventListener("click", on);
      b.addEventListener("mouseleave", off); b.addEventListener("blur", off);
    });
  })();

  /* ---------- booking steps progress ---------- */
  var sw = $(".steps-wrap"), fillEl = $("#track-fill"), stepEls = $$(".step");
  function steps() {
    if (!sw) return;
    var r = sw.getBoundingClientRect(), p = clamp((innerHeight * 0.72 - r.top) / (r.height * 0.9), 0, 1);
    if (reduce) p = 1;
    fillEl.style.setProperty("--p", p.toFixed(3));
    stepEls.forEach(function (s, i) { s.classList.toggle("lit", p >= i / (stepEls.length - 1) - .02); });
  }

  /* ---------- the route map ---------- */
  (function map() {
    var m = $("#map"); if (!m) return;
    $$(".rd", m).forEach(function (p) { p.setAttribute("pathLength", 1); });
    var van = $("#van"), route = el("path", { d: "M458 318L557 91L380 140L246 190L330 248L458 318L311 380L125 431L311 380L458 318L395 531L466 460L652 507L466 460L458 318", fill: "none" }, m);
    var L = route.getTotalLength(), d = 0, raf = 0, lastT = 0, vis = false, lastX = 0;
    function place() { var p = route.getPointAtLength(d), f = p.x < lastX - .01 ? -1 : 1; lastX = p.x; van.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") scale(" + f + " 1)"); }
    function tick(now) { raf = 0; var dt = Math.min(.05, (now - lastT) / 1000 || 0); lastT = now; d = (d + dt * 70) % L; place(); if (vis && !document.hidden) raf = requestAnimationFrame(tick); }
    place();
    if (reduce || !("IntersectionObserver" in window)) { m.classList.add("in"); return; }
    new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting;
      if (vis) { m.classList.add("in"); if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(tick); } }
    }, { threshold: .2 }).observe(m);
  })();

  /* ---------- sample quote form ---------- */
  (function form() {
    var f = $("#qform"), done = $("#qdone"), msg = $("#qdone-p"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var svc = $$('input[name="svc"]:checked', f).map(function (i) { return i.value; });
      var lot = ($('input[name="lot"]:checked', f) || {}).value || "typical";
      var what = svc.length ? (svc.length > 1 ? svc.slice(0, -1).join(", ") + " and " + svc[svc.length - 1] : svc[0]) : "a quote";
      msg.textContent = "Nothing was sent. On a real site, your request for " + what + " on a " + lot + " yard would land on the owner's phone as a text and in their email.";
      done.hidden = false; done.style.animation = "none"; void done.offsetWidth; done.style.animation = "";
      done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    });
  })();

  onScroll();
})();
