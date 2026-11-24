// Nolan Day Studio sample sites, studio generation: every moving part for the Starter, Signature and Immersive versions.
// Reads the shop's details from <script id="nds-site" type="application/json">. Nothing on these pages sends anything:
// the forms are samples, and the text buttons only open the visitor's own messages app.
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var S = {};
  try { S = JSON.parse(d.getElementById("nds-site").textContent); } catch (e) {}
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  de.classList.add("js");
  try { if (W.self !== W.top) de.classList.add("framed"); } catch (e) { de.classList.add("framed"); }
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var ND = W.ND = {S: S, state: {}};

  // ---------------------------------------------------------------- the request, shared by every tool on the page
  var listeners = [];
  ND.set = function (k, v) {
    ND.state[k] = v;
    $$('[data-t="' + k + '"]').forEach(function (el) {
      el.textContent = v || "—"; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    });
    listeners.forEach(function (f) { f(k, v); });
  };
  ND.on = function (f) { listeners.push(f); };

  // ---------------------------------------------------------------- word-by-word headings
  $$("[data-wr]").forEach(function (h) {
    var i = 0;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var w = d.createElement("span"); w.className = "w"; var x = d.createElement("i"); x.style.setProperty("--i", i++); x.textContent = p; w.appendChild(x); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(h);
    h.classList.add("wr");
  });

  // ---------------------------------------------------------------- reveal on scroll
  var io = "IntersectionObserver" in W ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {rootMargin: "0px 0px -8% 0px", threshold: .08}) : null;
  $$(".rv,.wr,.ico,.steps li").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });
  // the hero's words come in right away
  $$(".hero .wr,.slide .wr,.scene .wr").forEach(function (el) { setTimeout(function () { el.classList.add("in"); }, 120); });

  // ---------------------------------------------------------------- the self-drawing art
  function play(svg) {
    if (svg.classList.contains("go")) return;
    svg.classList.add("go");
    var tot = parseFloat(svg.getAttribute("data-total") || "4");
    setTimeout(function () { svg.classList.add("live"); }, reduce ? 0 : (tot + 1.6) * 1000);
  }
  ND.play = play;
  $$(".art[data-auto]").forEach(function (svg) {
    if (svg.getAttribute("data-auto") === "load") { setTimeout(function () { play(svg); }, 250); return; }
    if (!io) { play(svg); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { play(svg); o.disconnect(); } }, {threshold: .25});
    o.observe(svg);
  });

  // ---------------------------------------------------------------- header, progress bar, phone bar, parallax
  var top = $(".top"), prog = $("#prog"), cbar = $("#cbar"), first = $("[data-first]"), sheet = $(".sheet[data-par]");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = W.scrollY, h = de.scrollHeight - innerHeight;
    if (prog) prog.style.setProperty("--sp", h > 0 ? (y / h).toFixed(4) : 0);
    var fb = first ? first.getBoundingClientRect().bottom : 400;
    if (top && top.classList.contains("over")) top.classList.toggle("solid", fb < 90);
    if (cbar) cbar.classList.toggle("on", fb < 60);
    if (sheet && !reduce && innerWidth > 900) sheet.style.setProperty("--py", Math.min(y, 900) * -.06 + "px");
    steps();
    story();
  }
  W.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
  W.addEventListener("resize", onScroll);

  // steps line fills as the list passes
  var st = $(".steps");
  function steps() {
    if (!st) return;
    var r = st.getBoundingClientRect(), vh = innerHeight;
    var p = Math.max(0, Math.min(1, (vh * .78 - r.top) / (r.height + vh * .3)));
    st.style.setProperty("--p", (p * 100).toFixed(1) + "%");
  }

  // ---------------------------------------------------------------- count-up numbers
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    function run() {
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      var t0 = performance.now();
      (function f(now) { var k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(f); })(t0);
    }
    if (!io) { run(); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, {threshold: .4}); o.observe(el);
  });

  // ---------------------------------------------------------------- magnetic buttons
  if (fine && !reduce) $$(".btn.acc,.btn.ghost,.handle").forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      if (b.classList.contains("handle")) return;
      var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.transform = "translate(" + (x * .18).toFixed(1) + "px," + (y * .28).toFixed(1) + "px)";
    });
    b.addEventListener("pointerleave", function () { b.style.transform = ""; });
  });

  // ---------------------------------------------------------------- custom cursor
  if (fine && !reduce) {
    var cur = d.createElement("div"); cur.id = "cur"; cur.innerHTML = '<div class="cr"><b></b></div><div class="cd"></div>'; d.body.appendChild(cur);
    de.classList.add("cc");
    var cr = cur.firstChild, cd = cur.lastChild, lab = cr.firstChild, mx = -99, my = -99, rx = -99, ry = -99;
    d.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY; cur.classList.add("on");
      var t = e.target.closest ? e.target : null;
      var l = t && t.closest("[data-cur]"), h = t && t.closest("a,button,[role=slider],label,.chip,.ph,canvas");
      var tx = t && t.closest("input:not([type=range]),textarea,select");
      cur.classList.toggle("lab", !!l); lab.textContent = l ? l.getAttribute("data-cur") : "";
      cur.classList.toggle("hov", !!h && !l); cur.classList.toggle("txt", !!tx);
      cur.classList.toggle("lt", !!(t && t.closest(".light,.story,.t750 .svc,.ticket")));
    }, {passive: true});
    d.addEventListener("pointerdown", function () { cur.classList.add("dn"); });
    d.addEventListener("pointerup", function () { cur.classList.remove("dn"); });
    d.addEventListener("pointerleave", function () { cur.classList.remove("on"); });
    (function f() { rx += (mx - rx) * .2; ry += (my - ry) * .2; cd.style.transform = "translate(" + mx + "px," + my + "px)"; cr.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)"; requestAnimationFrame(f); })();
  }

  // ---------------------------------------------------------------- lightbox
  var shots = $$(".ph[data-lb]");
  if (shots.length) {
    var lb = d.createElement("div"); lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Photo");
    var ic = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>'; };
    lb.innerHTML = '<figure><img alt=""></figure><figcaption></figcaption><button class="x" type="button" aria-label="Close">' + ic("M6 6l12 12M18 6 6 18") + '</button><button class="pv" type="button" aria-label="Previous photo">' + ic("M15 5l-7 7 7 7") + '</button><button class="nx" type="button" aria-label="Next photo">' + ic("M9 5l7 7-7 7") + "</button>";
    d.body.appendChild(lb);
    var li = 0, img = lb.querySelector("img"), cap = lb.querySelector("figcaption"), last;
    var show = function (i) { li = (i + shots.length) % shots.length; var s = shots[li]; img.src = s.getAttribute("data-lb"); img.alt = s.getAttribute("data-h") || ""; cap.textContent = s.getAttribute("data-h") || ""; };
    shots.forEach(function (s, i) { s.addEventListener("click", function () { if (s.closest(".strip.moved")) return; last = s; show(i); lb.classList.add("on"); lb.querySelector(".x").focus(); }); });
    var close = function () { lb.classList.remove("on"); if (last) last.focus(); };
    lb.querySelector(".x").onclick = close; lb.querySelector(".pv").onclick = function () { show(li - 1); }; lb.querySelector(".nx").onclick = function () { show(li + 1); };
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "FIGURE") close(); });
    d.addEventListener("keydown", function (e) { if (!lb.classList.contains("on")) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") show(li - 1); if (e.key === "ArrowRight") show(li + 1); });
  }

  // ---------------------------------------------------------------- chip groups (texter and planner)
  $$("[data-chips]").forEach(function (g) {
    var k = g.getAttribute("data-chips"), multi = g.hasAttribute("data-multi");
    g.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      if (multi) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
      else $$(".chip", g).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var v = $$('.chip[aria-pressed="true"]', g).map(function (x) { return x.textContent; }).join(", ");
      ND.set(k, v);
    });
  });

  // ---------------------------------------------------------------- the texter: builds a text to the shop's own number
  $$("[data-texter]").forEach(function (tx) {
    var msg = $("[data-msg]", tx), send = $("[data-send]", tx), typing = $(".typing", tx);
    function build() {
      var job = ND.state.job, when = ND.state.when, extra = ND.state.pick;
      var s = "Hi " + (S.short || "there") + ", ";
      s += job ? "I'm looking for help with " + job.toLowerCase().replace(/^an? /, "a ").replace(/^something else$/, "something") : "I have a question";
      if (extra) s += " (" + extra + ")";
      s += when ? ". " + when.replace(/^Just /, "I'm just ") + "." : ".";
      s += " Can you get back to me?";
      msg.textContent = s; msg.classList.remove("pop"); void msg.offsetWidth; msg.classList.add("pop");
      if (send && S.tel) send.href = "sms:" + S.tel + "?&body=" + encodeURIComponent(s);
      if (typing && !reduce) { typing.classList.add("on"); clearTimeout(typing._t); typing._t = setTimeout(function () { typing.classList.remove("on"); }, 1400); }
    }
    ND.on(function (k) { if (k === "job" || k === "when" || k === "pick") build(); });
    build();
  });

  // ---------------------------------------------------------------- sample request forms (nothing is sent)
  $$("form[data-req]").forEach(function (f) {
    $$("input,textarea,select", f).forEach(function (i) {
      var k = i.getAttribute("data-k"); if (!k) return;
      i.addEventListener("input", function () { ND.set(k, i.value.trim()); });
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $(".fine", f), tk = $(".ticket");
      if (out) out.textContent = "This is a sample form, so nothing was sent. On the real site this goes straight to " + (S.short || "the shop") + ".";
      if (tk) tk.classList.add("sent");
    });
  });

  // ---------------------------------------------------------------- Signature: the before/after slider
  $$(".slide").forEach(function (h) {
    var hd = $(".handle", h), tl = $(".tag.l", h), tr = $(".tag.r", h), x = 100, dragging = false;
    function setX(v) { x = Math.max(0, Math.min(100, v)); h.style.setProperty("--x", x + "%"); if (hd) hd.setAttribute("aria-valuenow", Math.round(x)); if (tl) tl.style.opacity = x < 12 ? 0 : 1; if (tr) tr.style.opacity = x > 88 ? 0 : 1; }
    function tween(to, ms) { if (reduce) { setX(to); return; } var f0 = x, t0 = performance.now(); (function f(n) { if (dragging) return; var k = Math.min(1, (n - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; setX(f0 + (to - f0) * e); if (k < 1) requestAnimationFrame(f); })(t0); }
    setX(100);
    setTimeout(function () { h.classList.add("go"); $$(".art", h).forEach(play); }, 200);
    var to = h.classList.contains("nophoto") ? (innerWidth < 760 ? 50 : 66) : (innerWidth < 760 ? 50 : 56);
    setTimeout(function () { tween(to, 1800); }, reduce ? 0 : 2600);
    function fromEvent(e) { var r = h.getBoundingClientRect(); setX((e.clientX - r.left) / r.width * 100); }
    if (hd) {
      hd.addEventListener("pointerdown", function (e) { dragging = true; hd.setPointerCapture(e.pointerId); e.preventDefault(); });
      hd.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
      hd.addEventListener("pointerup", function () { dragging = false; });
      hd.addEventListener("pointercancel", function () { dragging = false; });
      hd.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") { setX(x - 5); e.preventDefault(); } if (e.key === "ArrowRight") { setX(x + 5); e.preventDefault(); } if (e.key === "Home") setX(0); if (e.key === "End") setX(100); });
    }
    var stage = $(".stage", h);
    if (stage) stage.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && !e.target.closest("a,button")) { dragging = true; fromEvent(e); var mv = function (ev) { fromEvent(ev); }, up = function () { dragging = false; d.removeEventListener("pointermove", mv); d.removeEventListener("pointerup", up); }; d.addEventListener("pointermove", mv); d.addEventListener("pointerup", up); } });
  });

  // ---------------------------------------------------------------- services peek
  var peek = $(".peek");
  if (peek && fine) {
    var px = 0, py = 0, qx = 0, qy = 0, on = false;
    $$(".svc li").forEach(function (li) {
      li.addEventListener("pointerenter", function () { var tpl = $("template", li); peek.innerHTML = tpl ? tpl.innerHTML : ""; peek.classList.add("on"); on = true; });
      li.addEventListener("pointerleave", function () { peek.classList.remove("on"); on = false; });
    });
    d.addEventListener("pointermove", function (e) { px = e.clientX + 150; py = e.clientY; }, {passive: true});
    (function f() { qx += (px - qx) * .14; qy += (py - qy) * .14; if (on) { peek.style.left = qx + "px"; peek.style.top = qy + "px"; } requestAnimationFrame(f); })();
  }

  // ---------------------------------------------------------------- gallery strip
  $$(".strip").forEach(function (s) {
    var down = false, sx = 0, sl = 0, moved = 0;
    s.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = 0; sx = e.clientX; sl = s.scrollLeft; s.classList.add("drag"); });
    d.addEventListener("pointermove", function (e) { if (!down) return; moved = Math.abs(e.clientX - sx); s.scrollLeft = sl - (e.clientX - sx); s.classList.toggle("moved", moved > 6); });
    d.addEventListener("pointerup", function () { if (!down) return; down = false; s.classList.remove("drag"); setTimeout(function () { s.classList.remove("moved"); }, 0); });
    var nav = s.parentNode.querySelector(".gnav");
    if (nav) nav.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; s.scrollBy({left: (b.hasAttribute("data-next") ? 1 : -1) * s.clientWidth * .7, behavior: "smooth"}); });
  });

  // ---------------------------------------------------------------- Immersive: the drawing builds with the story
  var beats = $$(".story .beat"), sart = $(".story .art"), rail = $(".story .rail"), curB = 0;
  function story() {
    if (!beats.length || !sart) return;
    var mid = innerHeight * .55, n = 0;
    beats.forEach(function (b, i) { var r = b.getBoundingClientRect(); if (r.top < mid) n = i + 1; b.classList.toggle("on", r.top < mid && r.bottom > innerHeight * .2); });
    var sr = $(".story").getBoundingClientRect();
    if (rail) rail.style.setProperty("--sp2", Math.max(0, Math.min(1, (innerHeight * .5 - sr.top) / sr.height)).toFixed(3));
    var key = n || (sr.top < innerHeight * .7 ? -1 : 0);
    if (key === curB) return;
    curB = key;
    var lim = n ? parseInt(beats[n - 1].getAttribute("data-b"), 10) : (sr.top < innerHeight * .7 ? 1 : 0);
    $$("g[data-b]", sart).forEach(function (g) {
      var b = parseInt(g.getAttribute("data-b"), 10), was = g.classList.contains("on"), now = b <= lim;
      if (now && !was) {
        var paths = $$("path[pathLength]", g), t0 = Infinity;
        paths.forEach(function (p) { var t = parseFloat(p.style.getPropertyValue("--t")) || 0; if (t < t0) t0 = t; });
        paths.forEach(function (p) { var t = parseFloat(p.style.getPropertyValue("--t")) || 0; p.style.transitionDelay = Math.min(1.6, (t - t0) * .6).toFixed(2) + "s"; });
      }
      g.classList.toggle("on", now);
    });
    sart.classList.toggle("live", lim >= 6);
  }

  // ---------------------------------------------------------------- smooth scroll for the Immersive version
  if (W.Lenis && !reduce && d.body.classList.contains("t1250")) {
    try { var lenis = new W.Lenis({lerp: .1, smoothWheel: true}); (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now()); lenis.on("scroll", onScroll); } catch (e) {}
  }

  onScroll();
})();
