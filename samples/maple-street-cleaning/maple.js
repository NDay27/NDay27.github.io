// Maple Street Cleaning sample site (a made-up business) by Nolan Day Studio.
// Squeegee before/after, reveals, the room-by-room checklist, the example price calculator and the sample form.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  // entrance
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add("loaded"); }); });

  // reveal on scroll
  var revealEls = $$(".rv,.rv-s");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("in"); });

  // header shadow + phone call bar
  var hdr = $("#hdr"), cbar = $("#cbar"), first = $("[data-first]"), quote = $("#quote"), close = $("#contact");
  var ticking = false;
  function onScroll() {
    ticking = false;
    hdr.classList.toggle("stuck", scrollY > 60);
    if (cbar && first) {
      var fb = first.getBoundingClientRect().bottom, hide = false;
      [quote, close].forEach(function (s) { if (!s) return; var r = s.getBoundingClientRect(); if (r.top < innerHeight * .75 && r.bottom > innerHeight * .25) hide = true; });
      cbar.classList.toggle("on", fb < innerHeight * .4 && !hide);
    }
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---------- squeegee: wipe the dusty room clean ----------
  (function () {
    var scene = $("#scene"), stage = $("#stage"); if (!scene) return;
    var p = 0, auto = true, raf = 0;
    function setW() { scene.style.setProperty("--w", scene.clientWidth + "px"); }
    setW();
    if ("ResizeObserver" in window) new ResizeObserver(setW).observe(scene); else addEventListener("resize", setW);
    function set(v) {
      p = Math.max(0, Math.min(1, v));
      scene.style.setProperty("--p", p.toFixed(4));
      var pc = Math.round(p * 100);
      scene.setAttribute("aria-valuenow", pc); scene.setAttribute("aria-valuetext", pc + " percent clean");
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tween(to, ms, done) {
      var from = p, t0 = performance.now();
      cancelAnimationFrame(raf);
      (function step(now) {
        if (!auto) return;
        var t = Math.min(1, (now - t0) / ms); set(from + (to - from) * ease(t));
        if (t < 1) raf = requestAnimationFrame(step); else if (done) done();
      })(t0);
    }
    function ready() { scene.classList.add("ready"); stage.classList.add("ready"); }
    function stopAuto() { if (auto) { auto = false; cancelAnimationFrame(raf); scene.classList.add("shine"); ready(); } }

    if (reduce) { set(.56); scene.classList.add("shine"); ready(); auto = false; }
    else {
      set(0);
      setTimeout(function () {
        if (!auto) return;
        tween(1, 2200, function () {
          scene.classList.add("shine");
          setTimeout(function () { if (auto) tween(.56, 1000, function () { auto = false; ready(); }); }, 900);
        });
      }, 600);
    }

    var dragging = false;
    function fromEvent(e) { var r = scene.getBoundingClientRect(); return (e.clientX - r.left) / r.width; }
    scene.addEventListener("pointerdown", function (e) {
      stopAuto(); dragging = true; scene.classList.add("drag");
      try { scene.setPointerCapture(e.pointerId); } catch (x) {}
      set(fromEvent(e));
    });
    scene.addEventListener("pointermove", function (e) { if (dragging) set(fromEvent(e)); });
    function end() { dragging = false; scene.classList.remove("drag"); }
    scene.addEventListener("pointerup", end); scene.addEventListener("pointercancel", end);
    scene.addEventListener("keydown", function (e) {
      var k = e.key, step = e.shiftKey ? .2 : .05;
      if (k === "ArrowRight" || k === "ArrowUp") { stopAuto(); set(p + step); e.preventDefault(); }
      else if (k === "ArrowLeft" || k === "ArrowDown") { stopAuto(); set(p - step); e.preventDefault(); }
      else if (k === "Home") { stopAuto(); set(0); e.preventDefault(); }
      else if (k === "End") { stopAuto(); set(1); e.preventDefault(); }
    });
  })();

  // ---------- room by room checklist ----------
  (function () {
    var rooms = {
      kitchen: ["Kitchen", "Counters to floors, every visit. The room people notice first.", ["Counters and backsplash wiped and sanitized", "Sink scrubbed, faucet polished", "Stovetop degreased, grates cleaned", "Microwave cleaned inside and out", "Outside of fridge, oven and dishwasher", "Cabinet fronts and handles spot-cleaned", "Floors vacuumed and mopped", "Trash out, fresh liner in"]],
      bath: ["Bathrooms", "Scrubbed, shined and smelling like nothing at all.", ["Toilets inside, outside and behind", "Tub and shower scrubbed, soap scum gone", "Shower glass squeegeed streak-free", "Mirrors polished", "Sinks, counters and fixtures shined", "Floors hand-wiped along the edges", "Towels folded or hung", "Trash out, fresh liner in"]],
      bed: ["Bedrooms", "Fresh, dusted and ready for a good night.", ["Beds made, sheets changed if left out", "Dressers, nightstands and headboards dusted", "Mirrors and glass cleaned", "Lamps, switches and handles wiped", "Window sills dusted", "Floors vacuumed, including under the bed edge", "Trash emptied"]],
      living: ["Living areas", "Where everyone ends up, so it gets extra care.", ["Shelves, frames and surfaces dusted", "Cushions straightened and vacuumed", "TV and electronics dusted (dry cloth only)", "Door handles and switches sanitized", "Baseboards spot-wiped", "Stairs and railings cleaned", "Floors vacuumed and mopped"]],
      deep: ["Deep clean extras", "Everything in a regular visit, plus the spots that get skipped all year.", ["Baseboards hand-wiped, every room", "Doors and door frames", "Ceiling fans and air vents", "Light fixtures and lamp shades", "Window sills and tracks", "Behind and under movable furniture", "Inside oven and fridge (on request)", "Cabinet fronts washed top to bottom"]]
    };
    var list = $("#checklist"), ring = $("#ring"), fg = $(".fg", ring), nEl = $("#ringN"), ofEl = $("#ringOf"), title = $("#roomTitle"), sub = $("#roomSub");
    var tabs = $$(".tab"), timers = [], visible = false, current = "kitchen";
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function setRing(n, total) {
      fg.style.strokeDashoffset = String(1 - n / total);
      nEl.textContent = n; ofEl.textContent = "of " + total + " done";
      ring.classList.toggle("full", n === total && total > 0);
    }
    function render(key, animate) {
      clear(); current = key;
      var r = rooms[key]; title.textContent = r[0]; sub.textContent = r[1];
      list.classList.remove("show");
      list.innerHTML = r[2].map(function (t, i) {
        return '<li style="--i:' + i + '"><span class="bx"><svg viewBox="0 0 18 18" aria-hidden="true"><path pathLength="1" d="m4 9.5 3.2 3.2L14 5.5"/></svg></span><span class="t">' + t + '</span></li>';
      }).join("");
      var items = $$("li", list), total = items.length;
      ring.classList.remove("full");
      if (!animate || reduce) { list.classList.add("show"); items.forEach(function (li) { li.classList.add("on"); }); setRing(total, total); return; }
      setRing(0, total);
      void list.offsetWidth; list.classList.add("show");
      items.forEach(function (li, i) {
        timers.push(setTimeout(function () {
          li.classList.add("on", "fresh");
          timers.push(setTimeout(function () { li.classList.remove("fresh"); }, 500));
          setRing(i + 1, total);
        }, 500 + i * 260));
      });
    }
    tabs.forEach(function (t, idx) {
      t.addEventListener("click", function () {
        tabs.forEach(function (o) { var on = o === t; o.setAttribute("aria-selected", on); o.tabIndex = on ? 0 : -1; });
        list.setAttribute("aria-labelledby", t.id);
        render(t.dataset.room, true);
      });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
        var n = tabs[(idx + d + tabs.length) % tabs.length]; n.focus(); n.click(); e.preventDefault();
      });
    });
    render("kitchen", false);
    list.classList.remove("show"); $$("li", list).forEach(function (li) { li.classList.remove("on"); }); setRing(0, rooms.kitchen[2].length);
    if ("IntersectionObserver" in window && !reduce) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting && !visible) { visible = true; render(current, true); o.disconnect(); } }, { threshold: .35 });
      o.observe($("#board"));
    } else render("kitchen", false);
  })();

  // how it works: the dotted path draws in
  (function () {
    var s = $("#steps"); if (!s) return;
    if (!("IntersectionObserver" in window) || reduce) { s.classList.add("in"); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { s.classList.add("in"); o.disconnect(); } }, { threshold: .3 }); o.observe(s);
  })();

  // ---------- example price calculator ----------
  (function () {
    var state = { bed: 3, bath: 2 };
    var freqName = { weekly: "every week", biweekly: "every 2 weeks", monthly: "once a month", deep: "one-time deep clean", move: "move-out clean" };
    // made-up example math: base by visit type, plus rooms and pets
    var rate = { weekly: [95, 18, 22, 10], biweekly: [110, 18, 22, 10], monthly: [130, 20, 25, 12], deep: [210, 30, 35, 20], move: [260, 35, 40, 20] };
    var lo = $("#estLo"), hi = $("#estHi"), per = $("#estPer"), desc = $("#estD"), pets = $("#pets"), shown = [170, 195], raf = 0;
    function r5(n) { return Math.round(n / 5) * 5; }
    function calc() {
      var f = ($("input[name=freq]:checked") || {}).value || "biweekly", r = rate[f];
      var base = r[0] + (state.bed - 1) * r[1] + (state.bath - 1) * r[2] + (pets.checked ? r[3] : 0);
      var a = r5(base), b = r5(base * 1.15);
      per.textContent = (f === "deep" || f === "move") ? "one time" : "/ visit";
      desc.textContent = state.bed + " bedroom" + (state.bed > 1 ? "s" : "") + ", " + state.bath + " bathroom" + (state.bath > 1 ? "s" : "") + ", " + freqName[f] + (pets.checked ? ", with pets." : ".");
      roll([a, b]);
    }
    function roll(to) {
      cancelAnimationFrame(raf);
      if (reduce) { shown = to; lo.textContent = "$" + to[0]; hi.textContent = "$" + to[1]; return; }
      var from = shown.slice(), t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - t, 3);
        shown = [Math.round(from[0] + (to[0] - from[0]) * e), Math.round(from[1] + (to[1] - from[1]) * e)];
        lo.textContent = "$" + shown[0]; hi.textContent = "$" + shown[1];
        if (t < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    $$(".stepper").forEach(function (st) {
      var k = st.dataset.k, min = +st.dataset.min, max = +st.dataset.max, out = $("output", st), b = $$("button", st);
      function upd() { out.textContent = state[k] + (state[k] === max ? "+" : ""); b[0].disabled = state[k] <= min; b[1].disabled = state[k] >= max; }
      b[0].addEventListener("click", function () { state[k] = Math.max(min, state[k] - 1); upd(); calc(); });
      b[1].addEventListener("click", function () { state[k] = Math.min(max, state[k] + 1); upd(); calc(); });
      upd();
    });
    $$("input[name=freq]").forEach(function (i) { i.addEventListener("change", calc); });
    pets.addEventListener("change", calc);
    calc();
  })();

  // ---------- sample form: says plainly that nothing is sent ----------
  (function () {
    var form = $("#qform"), panel = $("#formPanel"); if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault(); panel.classList.add("sent");
      var d = $(".done", panel); d.setAttribute("tabindex", "-1"); d.focus({ preventScroll: true });
    });
    $("#again").addEventListener("click", function () { panel.classList.remove("sent"); form.reset(); });
  })();

  // FAQ accordion
  $$(".qa button").forEach(function (b) {
    b.addEventListener("click", function () {
      var qa = b.parentNode, open = !qa.classList.contains("open");
      qa.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
    });
  });

  // service area: map dots and town chips light up together
  (function () {
    var map = $("#map"); if (!map) return;
    if ("IntersectionObserver" in window && !reduce) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { map.classList.add("in"); o.disconnect(); } }, { threshold: .3 }); o.observe(map);
    } else map.classList.add("in");
    function hl(t, on) {
      $$('[data-t="' + t + '"]').forEach(function (el) { el.classList.toggle("hl", on); });
    }
    $$("#towns li").forEach(function (li) {
      li.addEventListener("mouseenter", function () { hl(li.dataset.t, true); });
      li.addEventListener("mouseleave", function () { hl(li.dataset.t, false); });
    });
    $$(".map .town").forEach(function (g) {
      g.addEventListener("mouseenter", function () { hl(g.dataset.t, true); });
      g.addEventListener("mouseleave", function () { hl(g.dataset.t, false); });
    });
  })();
})();
