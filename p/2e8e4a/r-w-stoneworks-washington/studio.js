// R.W. Stoneworks sample sites by Nolan Day Studio: the paver pattern studio (Signature and Immersive).
// Draws a patio from above on a canvas and lays the pavers down in a sweep whenever the pattern or blend changes.
(function () {
  "use strict";
  var RW = window.RW = window.RW || {};
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BLENDS = {
    tan: {name: "tan and gray", c: ["#b9ab95", "#8e8a84", "#a69a86", "#7d7b78", "#c3b8a6"], j: "#3b3631", b: "#5a5753"},
    brick: {name: "red brick", c: ["#a8634c", "#8d4f3d", "#b77a5f", "#7b4434", "#9a5a44"], j: "#3a2a22", b: "#54504c"},
    char: {name: "charcoal", c: ["#57575a", "#45464a", "#6a6a6c", "#3a3b3f", "#4f4f53"], j: "#1f1f21", b: "#c9c4ba"},
    light: {name: "light gray", c: ["#d7d4cd", "#c4c0b8", "#e2dfd8", "#b5b2ab", "#cdc9c1"], j: "#8e887e", b: "#5d5d61"},
    blue: {name: "blue-gray stone", c: ["#8a919a", "#9c9a92", "#77808a", "#b1aa9c", "#6e747b"], j: "#3a3a3a", b: "#55565b"}
  };
  var NAMES = {herring: "Herringbone", running: "Running bond", basket: "Basketweave", circle: "Circle", ashlar: "Large slabs", flag: "Flagstone"};
  function rnd(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function rot(p, a, cx, cy) { var c = Math.cos(a), s = Math.sin(a); return p.map(function (q) { var x = q[0] - cx, y = q[1] - cy; return [cx + x * c - y * s, cy + x * s + y * c]; }); }

  // every pattern returns polygons in pixels covering the box [x0,y0]-[x1,y1] (the caller clips)
  function build(kind, W, H, u) {
    var P = [], cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2 + u * 3, i, j, k;
    if (kind === "herring") {
      var n = Math.ceil(R / u) + 4;
      for (i = -n; i <= n; i++) for (j = -Math.ceil(n / 2); j <= Math.ceil(n / 2); j++) {
        var ox = (i - 3 * j) * u, oy = (i + j) * u;
        if (Math.abs(ox) > R + 3 * u || Math.abs(oy) > R + 3 * u) continue;
        P.push(rot(rect(cx + ox, cy + oy, 2 * u, u), Math.PI / 4, cx, cy));
        P.push(rot(rect(cx + ox, cy + oy + u, u, 2 * u), Math.PI / 4, cx, cy));
      }
    } else if (kind === "running") {
      for (j = 0, k = 0; j * u < H; j++) for (i = -(j % 2); i * u < W; i += 2) P.push(rect(i * u, j * u, 2 * u, u));
    } else if (kind === "basket") {
      for (j = 0; j * 2 * u < H; j++) for (i = 0; i * 2 * u < W; i++) {
        var x = i * 2 * u, y = j * 2 * u;
        if ((i + j) % 2) { P.push(rect(x, y, 2 * u, u)); P.push(rect(x, y + u, 2 * u, u)); } else { P.push(rect(x, y, u, 2 * u)); P.push(rect(x + u, y, u, 2 * u)); }
      }
    } else if (kind === "circle") {
      var c0 = 1.6 * u, rr = c0;
      var pts = []; for (k = 0; k < 24; k++) pts.push([cx + Math.cos(k / 24 * Math.PI * 2) * c0, cy + Math.sin(k / 24 * Math.PI * 2) * c0]); P.push(pts);
      while (rr < R) {
        var r2 = rr + u, m = Math.max(8, Math.round(Math.PI * 2 * (rr + u / 2) / (1.5 * u))), off = rnd(rr) * Math.PI;
        for (k = 0; k < m; k++) { var a0 = off + k / m * Math.PI * 2, a1 = off + (k + 1) / m * Math.PI * 2, q = [], s;
          for (s = 0; s <= 3; s++) { var a = a0 + (a1 - a0) * s / 3; q.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
          for (s = 3; s >= 0; s--) { var b = a0 + (a1 - a0) * s / 3; q.push([cx + Math.cos(b) * r2, cy + Math.sin(b) * r2]); }
          P.push(q); }
        rr = r2;
      }
    } else if (kind === "ashlar") {
      var U = u * 1.5, y0 = 0, row = 0;
      while (y0 < H) { var h = (row % 2 ? 2 : 3) * U, x0 = -rnd(row + 3) * 2 * U, t = row * 17;
        while (x0 < W) { var w = (2 + Math.floor(rnd(t++) * 3)) * U; P.push(rect(x0, y0, w, h)); x0 += w; }
        y0 += h; row++; }
    } else if (kind === "flag") {
      var S = u * 2.6, seeds = [], nx = Math.ceil(W / S) + 2, ny = Math.ceil(H / S) + 2;
      for (j = -1; j < ny; j++) for (i = -1; i < nx; i++) seeds.push([(i + .5 + (rnd(i * 31 + j * 7) - .5) * .8) * S, (j + .5 + (rnd(i * 13 + j * 57 + 3) - .5) * .8) * S]);
      seeds.forEach(function (sd, si) {
        var poly = rect(sd[0] - S * 2, sd[1] - S * 2, S * 4, S * 4);
        seeds.forEach(function (o, oi) { if (oi === si || Math.abs(o[0] - sd[0]) > S * 2.6 || Math.abs(o[1] - sd[1]) > S * 2.6) return;
          var A = o[0] - sd[0], B = o[1] - sd[1], C = (o[0] * o[0] + o[1] * o[1] - sd[0] * sd[0] - sd[1] * sd[1]) / 2, out = [];
          for (var q = 0; q < poly.length; q++) { var p1 = poly[q], p2 = poly[(q + 1) % poly.length], f1 = A * p1[0] + B * p1[1] - C, f2 = A * p2[0] + B * p2[1] - C;
            if (f1 <= 0) out.push(p1); if (f1 * f2 < 0) { var tt = f1 / (f1 - f2); out.push([p1[0] + (p2[0] - p1[0]) * tt, p1[1] + (p2[1] - p1[1]) * tt]); } }
          poly = out; });
        if (poly.length > 2) P.push(poly);
      });
    }
    return P;
  }

  RW.studio = function (o) {
    var cv = o.canvas, ctx = cv.getContext("2d"), st = {pat: "herring", blend: "tan", border: true}, items = [], t0 = 0, raf = 0, W = 0, H = 0, dpr = 1, grain = null;
    function size() { var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(10, r.width); H = Math.max(10, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); grain = null; }
    function makeGrain() { var g = document.createElement("canvas"); g.width = 256; g.height = 256; var c = g.getContext("2d"), d = c.createImageData(256, 256);
      for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } c.putImageData(d, 0, 0); return c.createPattern(g, "repeat"); }
    function layout() {
      var u = Math.max(14, Math.min(W, H) / 17), bw = st.border ? u * 1.6 : 0, inset = Math.round(u * .9);
      var bx = inset, by = inset, bwid = W - inset * 2, bhei = H - inset * 2;
      var polys = build(st.pat, W, H, st.pat === "flag" || st.pat === "ashlar" ? u * .9 : u * .8), bl = BLENDS[st.blend];
      items = [];
      polys.forEach(function (p, i) { var cx = 0, cy = 0; p.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= p.length; cy /= p.length;
        if (cx < bx + bw - u * 2.5 || cy < by + bw - u * 2.5 || cx > bx + bwid - bw + u * 2.5 || cy > by + bhei - bw + u * 2.5) return;
        var r = rnd(i * 3.1 + st.pat.length), col = bl.c[Math.floor(r * bl.c.length)];
        var d = st.pat === "circle" ? Math.hypot(cx - W / 2, cy - H / 2) / Math.hypot(W, H) * 1.6 : (cx / W * .6 + cy / H * .4);
        items.push({p: p, c: col, l: (rnd(i + 9) - .5) * .12, d: d, clip: 1}); });
      // the soldier-course border: pavers standing on end around the edge
      if (st.border) {
        var bc = bl.b, L = u * .8, add = function (x, y, w, h, d) { items.push({p: rect(x, y, w, h), c: bc, l: (rnd(x * 7 + y) - .5) * .1, d: .55 + d * .75, clip: 0}); };
        for (var x = bx; x < bx + bwid - .5; x += L) { var w = Math.min(L, bx + bwid - x); add(x, by, w, bw, x / W * .3); add(x, by + bhei - bw, w, bw, .3 + x / W * .3); }
        for (var y = by + bw; y < by + bhei - bw - .5; y += L) { var h = Math.min(L, by + bhei - bw - y); add(bx, y, bw, h, .6 + y / H * .2); add(bx + bwid - bw, y, bw, h, .6 + y / H * .2); }
      }
      st.box = [bx + bw, by + bw, bwid - bw * 2, bhei - bw * 2]; st.outer = [bx, by, bwid, bhei]; st.u = u;
    }
    function shade(hex, l) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, k = 1 + l;
      return "rgb(" + Math.min(255, r * k | 0) + "," + Math.min(255, g * k | 0) + "," + Math.min(255, b * k | 0) + ")"; }
    function path(p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
    function draw(now) {
      var bl = BLENDS[st.blend], T = reduce ? 9 : (now - t0) / 900, done = true, u = st.u, ob = st.outer;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // lawn and soil around the patio
      ctx.fillStyle = "#1b1a16"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#26251f"; ctx.fillRect(ob[0] - 3, ob[1] - 3, ob[2] + 6, ob[3] + 6);
      // compacted base shows through until the pavers land
      ctx.fillStyle = "#6b655c"; ctx.fillRect(ob[0], ob[1], ob[2], ob[3]);
      ctx.fillStyle = bl.j; ctx.globalAlpha = .9; ctx.fillRect(ob[0], ob[1], ob[2], ob[3]); ctx.globalAlpha = 1;
      for (var pass = 0; pass < 2; pass++) {
        ctx.save();
        if (pass === 0) { ctx.beginPath(); ctx.rect(st.box[0], st.box[1], st.box[2], st.box[3]); ctx.clip(); }
        items.forEach(function (it) {
          if (it.clip !== (pass === 0 ? 1 : 0)) return;
          var k = Math.max(0, Math.min(1, (T - it.d * .75) * 3.2)); if (k < 1) done = false; if (k <= 0) return;
          var e = 1 - Math.pow(1 - k, 3), cx = 0, cy = 0; it.p.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= it.p.length; cy /= it.p.length;
          ctx.save(); ctx.translate(cx, cy - (1 - e) * u * .6); var s = .82 + .18 * e; ctx.scale(s, s); ctx.translate(-cx, -cy); ctx.globalAlpha = e;
          path(it.p); ctx.fillStyle = shade(it.c, it.l); ctx.fill();
          ctx.lineWidth = Math.max(1.2, u * .09); ctx.strokeStyle = bl.j; ctx.stroke();
          ctx.restore();
        });
        ctx.restore();
      }
      // surface grain, warm evening light and a vignette
      if (!grain) grain = makeGrain(); ctx.fillStyle = grain; ctx.fillRect(ob[0], ob[1], ob[2], ob[3]);
      var g = ctx.createRadialGradient(W * .32, H * .28, 10, W * .5, H * .5, Math.max(W, H) * .8);
      g.addColorStop(0, "rgba(255,214,160,.16)"); g.addColorStop(.5, "rgba(255,200,140,0)"); g.addColorStop(1, "rgba(0,0,0,.34)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (!done) raf = requestAnimationFrame(draw); else raf = 0;
    }
    function go() { layout(); t0 = performance.now(); if (!raf) raf = requestAnimationFrame(draw);
      if (o.capT) o.capT.textContent = NAMES[st.pat] + ", " + BLENDS[st.blend].name + (st.border ? ", dark border" : "");
      if (o.capSw) o.capSw.style.background = BLENDS[st.blend].c[0];
      if (o.onChange) o.onChange(api.describe()); }
    var api = {state: st, describe: function () { return NAMES[st.pat] + " pattern in " + BLENDS[st.blend].name + (st.border ? " with a dark soldier border" : ""); }};
    function bind(group, key) { if (!group) return; group.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { st[key] = b.getAttribute("data-v"); group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); go(); }); }); }
    bind(o.pats, "pat"); bind(o.blends, "blend");
    if (o.border) o.border.addEventListener("click", function () { st.border = !st.border; o.border.setAttribute("aria-checked", st.border ? "true" : "false"); go(); });
    cv.addEventListener("click", function () { go(); });
    var started = false;
    function start() { if (started) return; started = true; size(); go(); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { start(); ob.disconnect(); } }, {threshold: .25}).observe(cv); else start();
    var rt = 0; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (!started) return; size(); layout(); t0 = -1e5; if (!raf) raf = requestAnimationFrame(draw); }, 120); });
    return api;
  };
})();
