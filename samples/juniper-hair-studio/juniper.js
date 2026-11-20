/* Juniper Hair Studio: sample site by Nolan Day Studio.
   Canvas hair strands (hero, shade studio, closer), service tabs, shade fan, booking mock, reveals. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- colour helpers ---------- */
  function hex(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")"; }
  function lift(c, k) { return [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]; }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------- strands renderer ---------- */
  function Strands(canvas, o) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = 1, strands = [], t = 0, raf = 0, visible = false, last = 0;
    var cols = o.colors.map(hex), target = cols.slice(), from = cols.slice(), blend = 1;
    var p = { x: -999, y: -999, tx: -999, ty: -999, on: false, infl: 0 };
    var R = rnd(o.seed || 7);

    function build() {
      strands = [];
      var locks = o.locks, per = o.per;
      for (var l = 0; l < locks; l++) {
        var u = locks === 1 ? .5 : l / (locks - 1);
        var lock = { u: u, ph: R() * 6.28, amp: .6 + R() * .7, freq: .8 + R() * .5, sp: .5 + R() * .5 };
        for (var s = 0; s < per; s++) {
          strands.push({
            lock: lock, j: (R() - .5), ph: (R() - .5) * .7, len: o.lenMin + R() * (o.lenMax - o.lenMin),
            w: .5 + R() * 1.4, a: .35 + R() * .6, hi: R() < .22
          });
        }
      }
    }
    function size() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function grads() {
      var c0 = cols[0], c1 = cols[1], c2 = cols[2], g, h;
      if (o.mode === "flow") {
        g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, rgba(c0, 0)); g.addColorStop(.3, rgba(c1, .9)); g.addColorStop(.7, rgba(c2, .9)); g.addColorStop(1, rgba(c0, 0));
        return [g, g];
      }
      var end = o.mode === "card" ? H * .97 : H * 1.05;
      g = ctx.createLinearGradient(0, 0, 0, end);
      g.addColorStop(0, rgba(c0, 1)); g.addColorStop(.42, rgba(c1, 1)); g.addColorStop(.82, rgba(c2, 1)); g.addColorStop(1, rgba(c2, o.mode === "card" ? 0 : 1));
      h = ctx.createLinearGradient(0, 0, 0, end);
      h.addColorStop(0, rgba(lift(c0, .18), 1)); h.addColorStop(.45, rgba(lift(c1, .35), 1)); h.addColorStop(.85, rgba(lift(c2, .45), 1)); h.addColorStop(1, rgba(lift(c2, .45), o.mode === "card" ? 0 : 1));
      return [g, h];
    }
    function pt(s, k, out) {
      var L = s.lock, tm = t * L.sp, x, y, push;
      if (o.mode === "flow") {
        x = k * W;
        var base = H * (.18 + L.u * .64) + s.j * H * .08;
        y = base + Math.sin(k * 6.28 * L.freq + L.ph + s.ph + tm) * H * .09 * L.amp + Math.sin(k * 3 + tm * .6) * H * .03;
        out[0] = x; out[1] = y; return;
      }
      // crown -> fall
      var cx = W * .5, spread = o.mode === "card" ? .32 : .62;
      var x0 = cx + (L.u - .5) * W * spread * .35 + s.j * W * .03;
      var xEnd = cx + (L.u - .5) * W * (o.mode === "card" ? .62 : 1.15) + s.j * W * .06;
      y = o.top * H + k * s.len * H;
      var e = 1 - Math.pow(1 - k, 2);
      x = x0 + (xEnd - x0) * e;
      var wave = Math.sin(k * 6.28 * L.freq * 1.4 + L.ph + s.ph + tm) * W * (o.mode === "card" ? .03 : .05) * L.amp * Math.pow(k, .8);
      wave += Math.sin(k * 14 + s.ph * 4 + tm * 1.3) * W * .004 * k;
      x += wave;
      if (p.infl > .01) {
        var dx = x - p.x, dy = y - p.y, d = Math.sqrt(dx * dx + dy * dy), rad = Math.max(70, W * .2);
        if (d < rad) { push = (1 - d / rad); push = push * push * p.infl * rad * .55; x += (dx >= 0 ? 1 : -1) * push * (.6 + .4 * k); }
      }
      out[0] = x; out[1] = y;
    }
    var P = [0, 0], Q = [0, 0];
    function draw() {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      var gs = grads(), n = o.seg, i, k, s;
      ctx.lineCap = "round";
      for (i = 0; i < strands.length; i++) {
        s = strands[i];
        ctx.strokeStyle = s.hi ? gs[1] : gs[0];
        ctx.globalAlpha = s.hi ? s.a * .55 : s.a;
        ctx.lineWidth = s.w * (o.mode === "flow" ? .8 : 1);
        ctx.beginPath();
        pt(s, 0, P); ctx.moveTo(P[0], P[1]);
        for (k = 1; k <= n; k++) {
          pt(s, k / n, Q);
          ctx.quadraticCurveTo(P[0], P[1], (P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2);
          P[0] = Q[0]; P[1] = Q[1];
        }
        ctx.lineTo(P[0], P[1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (o.mode === "card") clip();
    }
    function clip() {
      var cw = W * .36, ch = Math.max(16, H * .045), x = W * .5 - cw / 2, y = o.top * H - ch * .55;
      var g = ctx.createLinearGradient(0, y, 0, y + ch);
      g.addColorStop(0, "#E9D3A7"); g.addColorStop(.5, "#B8915A"); g.addColorStop(1, "#7E6136");
      ctx.fillStyle = g; ctx.beginPath();
      var r = ch / 2; ctx.moveTo(x + r, y); ctx.arcTo(x + cw, y, x + cw, y + ch, r); ctx.arcTo(x + cw, y + ch, x, y + ch, r); ctx.arcTo(x, y + ch, x, y, r); ctx.arcTo(x, y, x + cw, y, r); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x + r, y + ch * .2, cw - 2 * r, 1.5);
    }
    function frame(now) {
      raf = 0;
      if (!visible) return;
      var dt = Math.min(50, now - (last || now)); last = now;
      t += dt * .0009;
      p.x += (p.tx - p.x) * .18; p.y += (p.ty - p.y) * .18;
      p.infl += ((p.on ? 1 : 0) - p.infl) * (p.on ? .12 : .035);
      if (blend < 1) { blend = Math.min(1, blend + dt / 650); var e = 1 - Math.pow(1 - blend, 3); cols = [0, 1, 2].map(function (i) { return mix(from[i], target[i], e); }); }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } }
    function local(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    if (o.interactive) {
      canvas.addEventListener("pointermove", function (e) { var l = local(e); if (!p.on) { p.x = l[0]; p.y = l[1]; } p.tx = l[0]; p.ty = l[1]; p.on = true; if (reduce) { p.x = p.tx; p.y = p.ty; p.infl = 1; draw(); } });
      canvas.addEventListener("pointerleave", function () { p.on = false; if (reduce) { p.infl = 0; draw(); } });
      canvas.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") p.on = false; });
    }
    build();
    new ResizeObserver(size).observe(canvas);
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { rootMargin: "80px" }).observe(canvas);
    return {
      setColors: function (c) { from = cols.slice(); target = c.map(hex); blend = 0; if (reduce) { cols = target.slice(); draw(); } else start(); },
      sweep: function (y0, y1, ms) {
        if (reduce) return;
        var t0 = performance.now();
        (function f(now) {
          var k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          p.tx = W * (-.1 + 1.2 * e); p.ty = H * (y0 + (y1 - y0) * e); if (k === 0) { p.x = p.tx; p.y = p.ty; }
          p.on = k < 1; if (k < 1) requestAnimationFrame(f);
        })(t0);
      }
    };
  }

  /* ---------- hero, shade studio, closer canvases ---------- */
  var SHADES = [
    { n: "Espresso brunette", lv: "Level 3", tone: "cool brown", c: ["#1E130E", "#3B271D", "#5E4030"], svc: "Usually booked as all-over color · about 2 hr · from $95 (example)" },
    { n: "Honey balayage", lv: "Level 7", tone: "warm gold", c: ["#3A281B", "#875A33", "#DDB073"], svc: "Usually booked as balayage · about 3 hr · from $185 (example)" },
    { n: "Copper glow", lv: "Level 7", tone: "copper", c: ["#4E1E10", "#A2441D", "#E58A4E"], svc: "Usually booked as all-over color plus gloss · about 2.5 hr · from $140 (example)" },
    { n: "Champagne blonde", lv: "Level 9", tone: "soft beige", c: ["#6A5134", "#C7A577", "#F1E0BC"], svc: "Usually booked as full highlights · about 2.5 hr · from $150 (example)" },
    { n: "Smoky ash", lv: "Level 8", tone: "ash", c: ["#3A3836", "#7D7A75", "#CBC7BF"], svc: "Usually booked as highlights plus toner · about 3 hr · from $165 (example)" },
    { n: "Rosewood", lv: "Level 5", tone: "rose brown", c: ["#3A1D21", "#7A3B40", "#C88A87"], svc: "Usually booked as gloss and tone · about 45 min · from $45 (example)" },
    { n: "Blue-black gloss", lv: "Level 1", tone: "cool black", c: ["#0D0E12", "#20232C", "#4A5266"], svc: "Usually booked as all-over color · about 2 hr · from $95 (example)" }
  ];
  var hero, card, band;
  var hc = $("#strands");
  if (hc) hero = Strands(hc, { mode: "hero", colors: ["#2A1C14", "#6E4A2E", "#C99A62"], locks: 12, per: 12, lenMin: 1.05, lenMax: 1.25, top: -.04, seg: 24, interactive: true, seed: 11 });
  var cc = $("#strands2");
  if (cc) card = Strands(cc, { mode: "card", colors: SHADES[1].c, locks: 11, per: 20, lenMin: .62, lenMax: .82, top: .12, seg: 26, interactive: true, seed: 5 });
  var bc = $("#strands3");
  if (bc) band = Strands(bc, { mode: "flow", colors: ["#C9A36A", "#E8D6B4", "#9FB8A8"], locks: 6, per: 9, lenMin: 1, lenMax: 1, top: 0, seg: 34, interactive: false, seed: 3 });

  /* ---------- shade fan ---------- */
  var fan = $("#fan");
  if (fan) {
    SHADES.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "sw"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", s.n);
      b.setAttribute("aria-checked", i === 1 ? "true" : "false"); b.tabIndex = i === 1 ? 0 : -1;
      b.style.setProperty("--a", s.c[0]); b.style.setProperty("--b", s.c[1]); b.style.setProperty("--c", s.c[2]);
      b.addEventListener("click", function () { pick(i, true); });
      fan.appendChild(b);
    });
    var sws = $$(".sw", fan);
    var pick = function (i, focus) {
      var s = SHADES[i];
      sws.forEach(function (b, j) { b.setAttribute("aria-checked", j === i ? "true" : "false"); b.tabIndex = j === i ? 0 : -1; });
      if (focus) sws[i].focus({ preventScroll: true });
      $("#shName").textContent = s.n; $("#shSvc").textContent = s.svc; $("#shLevel").textContent = s.lv; $("#shTone").textContent = s.tone;
      if (card) card.setColors(s.c);
    };
    fan.addEventListener("keydown", function (e) {
      var cur = sws.findIndex(function (b) { return b.getAttribute("aria-checked") === "true"; });
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); pick((cur + 1) % sws.length, true); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); pick((cur - 1 + sws.length) % sws.length, true); }
    });
  }

  /* ---------- service tabs ---------- */
  var tabs = $$(".menu-tabs [role=tab]");
  function showTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab, panel = document.getElementById(t.getAttribute("aria-controls"));
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      panel.hidden = !on; panel.classList.toggle("on", on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showTab(t); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); showTab(tabs[(i + 1) % tabs.length], true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); showTab(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
  });
  $$(".svc").forEach(function (ul) { $$("li", ul).forEach(function (li, i) { li.style.setProperty("--i", i); }); });

  /* ---------- booking mock ---------- */
  var bk = $("#bk");
  if (bk) {
    var DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var SLOTS = ["9:00 am", "9:45 am", "10:30 am", "11:15 am", "12:30 pm", "1:15 pm", "2:00 pm", "3:30 pm", "4:15 pm", "5:00 pm", "6:15 pm"];
    var daysEl = $("#bkDays"), timesEl = $("#bkTimes"), chosenDay = null, chosenTime = null;
    var d = new Date(); d.setHours(12, 0, 0, 0); var made = 0;
    while (made < 6) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 1) continue;
      var lab = document.createElement("label"), key = d.toISOString().slice(0, 10);
      lab.innerHTML = '<input type="radio" name="day" value="' + key + '"><span>' + DAYN[d.getDay()] + "<b>" + d.getDate() + "</b></span>";
      lab.firstChild.dataset.label = DAYN[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate();
      lab.firstChild.dataset.dow = d.getDay();
      daysEl.appendChild(lab); made++;
    }
    var renderTimes = function (inp) {
      var seed = 0; for (var i = 0; i < inp.value.length; i++) seed = (seed * 31 + inp.value.charCodeAt(i)) % 2147483647;
      var r = rnd(seed || 1), dow = +inp.dataset.dow, list = SLOTS.filter(function (s) {
        if (dow === 6) return /am$/.test(s) || /^(12|1|2):/.test(s);
        if (dow === 5) return !/^(6):/.test(s);
        return true;
      }).filter(function () { return r() > .45; }).slice(0, 6);
      timesEl.innerHTML = ""; chosenTime = null;
      if (!list.length) { timesEl.innerHTML = '<p class="none">Fully booked that day in this sample. Try another.</p>'; return; }
      list.forEach(function (s, i) {
        var l = document.createElement("label"); l.style.setProperty("--i", i);
        l.innerHTML = '<input type="radio" name="time" value="' + s + '"><span>' + s + "</span>";
        timesEl.appendChild(l);
      });
    };
    var set = function (id, v) { var el = $(id); if (el.textContent === v) return; el.textContent = v; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); };
    var sync = function () {
      var svc = bk.querySelector("[name=svc]:checked"), who = bk.querySelector("[name=who]:checked");
      set("#tkSvc", svc.value); set("#tkLen", svc.dataset.len); set("#tkWho", who.value);
      set("#tkWhen", chosenDay ? chosenDay.dataset.label + (chosenTime ? " · " + chosenTime : ", pick a time") : "Pick a day and time");
      var nm = bk.name.value.trim(); set("#tkName", nm ? nm : "–");
    };
    bk.addEventListener("change", function (e) {
      if (e.target.name === "day") { chosenDay = e.target; renderTimes(e.target); }
      if (e.target.name === "time") chosenTime = e.target.value;
      sync();
    });
    bk.addEventListener("input", function (e) { if (e.target.name === "name") sync(); });
    var first = daysEl.querySelector("input"); first.checked = true; chosenDay = first; renderTimes(first); sync();
    bk.addEventListener("submit", function (e) {
      e.preventDefault();
      var done = $("#tkDone"); done.hidden = false;
      if (innerWidth < 960) $("#ticket").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      $("#tkAgain").focus({ preventScroll: true });
    });
    $("#tkAgain").addEventListener("click", function () { $("#tkDone").hidden = true; bk.reset(); first.checked = true; chosenDay = first; renderTimes(first); sync(); });
  }

  /* ---------- hours: mark today ---------- */
  var dow = new Date().getDay();
  $$("#hours [data-day]").forEach(function (row) { if (row.dataset.day.split(",").indexOf(String(dow)) > -1) row.classList.add("today"); });

  /* ---------- header, drawer, dock ---------- */
  var hd = $("#hd"), dock = $("#dock"), burger = $("#burger"), drawer = $("#drawer"), ft = $(".ft");
  var ftVisible = false;
  if (ft) new IntersectionObserver(function (es) { ftVisible = es[0].isIntersecting; onScroll(); }).observe(ft);
  function onScroll() {
    var y = scrollY;
    hd.classList.toggle("scrolled", y > 40);
    dock.classList.toggle("show", y > 520 && !ftVisible);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  burger.addEventListener("click", function () {
    var open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); drawer.hidden = !open;
  });
  $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { burger.setAttribute("aria-expanded", "false"); drawer.hidden = true; }); });

  /* ---------- steps line: draws with scroll ---------- */
  var mp = $("#movesPath");
  if (mp) {
    var svg = mp.ownerSVGElement; svg.style.setProperty("--len", mp.getTotalLength());
    var stepLine = function () {
      var r = svg.getBoundingClientRect(), k = (innerHeight * .9 - r.top) / (innerHeight * .55);
      svg.style.setProperty("--p", Math.max(0, Math.min(1, k)).toFixed(3));
    };
    addEventListener("scroll", stepLine, { passive: true }); stepLine();
  }

  /* ---------- reveals ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
  $$("[data-r]").forEach(function (el) { io.observe(el); });

  /* ---------- entrance ---------- */
  var go = function () {
    root.classList.add("loaded");
    $$(".hero [data-r]").forEach(function (el) { el.classList.add("in"); });
    if (hero) setTimeout(function () { hero.sweep(.38, .62, 1900); }, 1500);
  };
  if (document.fonts && document.fonts.ready) { var once = false, g2 = function () { if (!once) { once = true; requestAnimationFrame(go); } }; document.fonts.ready.then(g2); setTimeout(g2, 900); }
  else go();
})();
