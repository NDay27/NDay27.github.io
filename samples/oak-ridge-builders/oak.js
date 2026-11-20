// Oak Ridge Builders sample site (a made-up business) by Nolan Day Studio.
// Drawing-to-built kitchen, exploded wall, tape-measure timeline, finish picker, survey map and the sample work order.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add("loaded"); }); });

  function onView(el, fn, opts) {
    if (!el) return;
    if (!hasIO || reduce) { fn(); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fn(); o.disconnect(); } }, opts || { threshold: .25 });
    o.observe(el);
  }

  // reveal on scroll
  var rv = $$(".rv,.rv-l");
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // ---------- the drawing that builds itself ----------
  (function () {
    var drw = $("#drw"); if (!drw) return;
    var p = 0, auto = true, raf = 0;
    function setW() { drw.style.setProperty("--w", drw.clientWidth + "px"); }
    setW();
    if ("ResizeObserver" in window) new ResizeObserver(setW).observe(drw); else addEventListener("resize", setW);
    function set(v) {
      p = Math.max(0, Math.min(1, v)); drw.style.setProperty("--p", p.toFixed(4));
      var pc = Math.round(p * 100);
      drw.setAttribute("aria-valuenow", pc);
      drw.setAttribute("aria-valuetext", pc < 5 ? "Drawing" : pc > 95 ? "Finished kitchen" : pc + " percent built");
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tween(to, ms, done) {
      var from = p, t0 = performance.now(); cancelAnimationFrame(raf);
      (function step(now) {
        if (!auto) return;
        var t = Math.min(1, (now - t0) / ms); set(from + (to - from) * ease(t));
        if (t < 1) raf = requestAnimationFrame(step); else if (done) done();
      })(t0);
    }
    function ready() { drw.classList.add("ready"); }
    function stopAuto() { if (auto) { auto = false; cancelAnimationFrame(raf); ready(); } }
    set(0);
    if (reduce) { drw.classList.add("drawn"); set(.55); ready(); auto = false; }
    else {
      setTimeout(function () { drw.classList.add("drawn"); }, 350);
      // let the drawing finish, then build it
      setTimeout(function () {
        if (!auto) return;
        ready();
        tween(1, 1900, function () { setTimeout(function () { if (auto) tween(.55, 1000, function () { auto = false; }); }, 700); });
      }, 2900);
    }
    var dragging = false;
    function fromEvent(e) { var r = drw.getBoundingClientRect(); return (e.clientX - r.left) / r.width; }
    drw.addEventListener("pointerdown", function (e) { stopAuto(); drw.classList.add("drawn"); dragging = true; drw.classList.add("drag"); try { drw.setPointerCapture(e.pointerId); } catch (x) {} set(fromEvent(e)); });
    drw.addEventListener("pointermove", function (e) { if (dragging) set(fromEvent(e)); });
    function end() { dragging = false; drw.classList.remove("drag"); }
    drw.addEventListener("pointerup", end); drw.addEventListener("pointercancel", end);
    drw.addEventListener("keydown", function (e) {
      var k = e.key, st = e.shiftKey ? .2 : .05, n = null;
      if (k === "ArrowRight" || k === "ArrowUp") n = p + st; else if (k === "ArrowLeft" || k === "ArrowDown") n = p - st; else if (k === "Home") n = 0; else if (k === "End") n = 1;
      if (n !== null) { stopAuto(); drw.classList.add("drawn"); set(n); e.preventDefault(); }
    });
  })();

  // ---------- header, call bar, and the scroll-driven pieces ----------
  var hdr = $("#hdr"), cbar = $("#cbar"), first = $("[data-first]"), est = $("#estimate"), close = $("#contact");
  var track = $("#wallTrack"), stack = $("#stack"), layersLi = $$("#layers li"), meter = $("#wallMeter");
  var tape = $("#tape"), steps = $(".steps");
  var wideWall = matchMedia("(min-width: 901px)");
  var ticking = false;
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function setLayer(active) {
    layersLi.forEach(function (li) { li.classList.toggle("on", +li.dataset.k === active); });
    $$(".layer", stack).forEach(function (l, i) { l.classList.toggle("on", i === active); });
  }
  function frame() {
    ticking = false;
    var vh = innerHeight;
    hdr.classList.toggle("stuck", scrollY > 40);
    if (cbar && first) {
      var hide = false;
      [est, close].forEach(function (s) { if (!s) return; var r = s.getBoundingClientRect(); if (r.top < vh * .75 && r.bottom > vh * .25) hide = true; });
      cbar.classList.toggle("on", first.getBoundingClientRect().bottom < vh * .4 && !hide);
    }
    // exploded wall: pinned on wide screens, scroll pulls the layers apart
    if (track && stack) {
      var pr;
      if (wideWall.matches) { var r = track.getBoundingClientRect(); pr = clamp(-r.top / Math.max(1, r.height - vh)); }
      else { var r2 = stack.getBoundingClientRect(); pr = clamp((vh * .85 - r2.top) / (vh * .7)); }
      if (reduce) pr = Math.max(pr, .7);
      var gap = 4 + pr * (wideWall.matches ? 58 : 38);
      stack.style.setProperty("--gap", gap.toFixed(1) + "px");
      if (meter) meter.style.setProperty("--wp", pr.toFixed(3));
      var active = pr < .08 ? -1 : 4 - Math.min(4, Math.floor((pr - .08) / .92 * 5));
      stack.classList.toggle("dim", active >= 0);
      setLayer(active);
    }
    // tape measure pulls out as the process section scrolls by
    if (tape && steps) {
      var t = steps.getBoundingClientRect();
      tape.style.setProperty("--tp", reduce ? 1 : clamp((vh * .9 - t.top) / (vh * .6)).toFixed(3));
    }
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener("resize", frame);
  frame();

  // ---------- finish picker ----------
  (function () {
    var view = $("#pkView"); if (!view) return;
    var names = { cab: function (n) { return n + ", shaker"; } };
    $$(".sw").forEach(function (g) {
      var v = g.dataset.v, s = g.dataset.s, out = $("#s-" + s);
      $$("button", g).forEach(function (b) {
        b.addEventListener("click", function () {
          $$("button", g).forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
          view.style.setProperty(v, b.dataset.c);
          var label = b.textContent.trim();
          out.textContent = names[s] ? names[s](label) : label;
          out.classList.remove("flash"); void out.offsetWidth; out.classList.add("flash");
        });
      });
    });
  })();

  // ---------- survey map ----------
  (function () {
    var sv = $("#survey"); if (!sv) return;
    onView(sv, function () { sv.classList.add("in"); }, { threshold: .3 });
    function hl(t, on) { $$('[data-t="' + t + '"]').forEach(function (el) { el.classList.toggle("hl", on); }); }
    $$("[data-t]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { hl(el.dataset.t, true); });
      el.addEventListener("mouseleave", function () { hl(el.dataset.t, false); });
    });
  })();

  // FAQ
  $$(".qa button").forEach(function (b) {
    b.addEventListener("click", function () {
      var qa = b.parentNode, open = !qa.classList.contains("open");
      qa.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
    });
  });

  // ---------- estimate form: fills a work order, sends nothing ----------
  (function () {
    var f = $("#eform"), wo = $("#wo"), msg = $("#sentMsg"); if (!f || !wo) return;
    var blanks = { type: "Pick one", budget: "Not sure yet", when: "Flexible", name: "—", details: "—" };
    function put(name, val) {
      var dd = $('dd[data-f="' + name + '"]', wo); if (!dd) return;
      var v = (val || "").trim();
      if (name === "details" && v.length > 70) v = v.slice(0, 68) + "…";
      var nv = v || blanks[name] || "—";
      if (dd.textContent !== nv) { dd.textContent = nv; dd.classList.remove("pop"); void dd.offsetWidth; dd.classList.add("pop"); }
      dd.classList.toggle("blank", !v);
      wo.classList.remove("sent"); msg.classList.remove("on");
    }
    f.addEventListener("input", function (e) { var t = e.target; if (t.name && t.name !== "phone" && t.name !== "email") put(t.name, t.value); });
    f.addEventListener("change", function (e) { var t = e.target; if (t.name && t.name !== "phone" && t.name !== "email") put(t.name, t.value); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      wo.classList.remove("sent"); void wo.offsetWidth; wo.classList.add("sent");
      msg.classList.add("on");
    });
  })();
})();
