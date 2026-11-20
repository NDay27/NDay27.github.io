// R.W. Stoneworks Signature sample by Nolan Day Studio: the drawing-to-patio slider, header, service peeks,
// the four steps, the photo strip and the paver studio hook-up.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  // hero slider: starts on the drawing, eases to the middle, then it's theirs to drag
  var hero = $("#hero"), handle = $("#handle"), tagL = $("#tagL"), tagR = $("#tagR"), x = 100, anim = 0;
  function set(v) { x = Math.max(0, Math.min(100, v)); hero.style.setProperty("--x", x + "%"); handle.setAttribute("aria-valuenow", Math.round(x));
    handle.setAttribute("aria-valuetext", x > 66 ? "Mostly the drawing" : x < 34 ? "Mostly the finished patio" : "Half drawing, half patio");
    tagL.style.opacity = x < 12 ? 0 : 1; tagR.style.opacity = x > 88 ? 0 : 1; }
  function tween(to, ms) { cancelAnimationFrame(anim); var from = x, t0 = performance.now();
    (function f(now) { var k = Math.min(1, Math.max(0, (now - t0) / ms)), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; set(from + (to - from) * e); if (k < 1) anim = requestAnimationFrame(f); })(t0); }
  if (hero) {
    set(100);
    var img = $(".dw", hero), began = false, begin = function () { if (began) return; began = true; hero.classList.add("go"); var mid = innerWidth < 760 ? 46 : 54; if (reduce) set(mid); else setTimeout(function () { if (!touched) tween(mid, 1700); }, 900); };
    var touched = false;
    if (img.complete) begin(); else { img.addEventListener("load", begin); setTimeout(begin, 2500); }
    var drag = false, from = function (e) { var r = hero.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    var stage = $(".stage", hero);
    [stage, handle].forEach(function (el) {
      el.addEventListener("pointerdown", function (e) { if (e.button) return; drag = true; touched = true; cancelAnimationFrame(anim); try { el.setPointerCapture(e.pointerId); } catch (_) {} set(from(e)); });
      el.addEventListener("pointermove", function (e) { if (drag) set(from(e)); });
      el.addEventListener("pointerup", function () { drag = false; }); el.addEventListener("pointercancel", function () { drag = false; });
    });
    stage.style.touchAction = "pan-y"; handle.style.touchAction = "none";
    handle.addEventListener("keydown", function (e) { var s = e.shiftKey ? 10 : 4; touched = true; cancelAnimationFrame(anim);
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { set(x - s); e.preventDefault(); } else if (e.key === "ArrowRight" || e.key === "ArrowUp") { set(x + s); e.preventDefault(); }
      else if (e.key === "Home") { set(0); e.preventDefault(); } else if (e.key === "End") { set(100); e.preventDefault(); } });
  }

  // header turns solid once the hero is behind it
  var top = $("#top");
  if (top && hero) { var t = false, u = function () { t = false; top.classList.toggle("solid", hero.getBoundingClientRect().bottom < 90); };
    addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(u); } }, {passive: true}); u(); }

  // services: a photo follows the pointer over rows that have one
  var peek = $("#peek");
  if (peek && fine) {
    var pi = $("img", peek), px = 0, py = 0, qx = 0, qy = 0, on = false, run = false;
    var mv = function () { qx += (px - qx) * .16; qy += (py - qy) * .16; peek.style.left = qx + "px"; peek.style.top = qy + "px"; if (on || Math.abs(px - qx) > .5) requestAnimationFrame(mv); else run = false; };
    $$("#svc li").forEach(function (li) { var src = li.getAttribute("data-img");
      li.addEventListener("pointerenter", function (e) { if (!src) { peek.classList.remove("on"); on = false; return; } pi.src = src; px = qx = e.clientX + 150; py = qy = e.clientY; on = true; peek.classList.add("on"); if (!run) { run = true; requestAnimationFrame(mv); } });
      li.addEventListener("pointermove", function (e) { px = e.clientX + 150; py = e.clientY; });
      li.addEventListener("pointerleave", function () { on = false; peek.classList.remove("on"); }); });
  }

  // steps light up in order and the line fills behind them
  var steps = $("#steps");
  if (steps) { var lis = $$("li", steps), lit = function () { lis.forEach(function (li, i) { setTimeout(function () { li.classList.add("in"); steps.style.setProperty("--p", ((i + 1) / lis.length * 100) + "%"); }, reduce ? 0 : i * 380); }); };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { lit(); ob.disconnect(); } }, {threshold: .35}).observe(steps); else lit(); }

  // photo strip: drag with a mouse, swipe on a phone, arrows to step through; a real click still opens the photo
  var strip = $("#strip");
  if (strip) {
    var down = false, sx = 0, sl = 0, moved = 0;
    strip.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse" || e.button) return; down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft; });
    addEventListener("pointermove", function (e) { if (!down) return; var d = e.clientX - sx; moved = Math.max(moved, Math.abs(d)); if (moved > 4) strip.classList.add("drag"); strip.scrollLeft = sl - d; });
    addEventListener("pointerup", function () { if (!down) return; down = false; setTimeout(function () { strip.classList.remove("drag"); }, 0); });
    strip.addEventListener("click", function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
    var step = function (dir) { var card = $(".ph", strip), w = card ? card.getBoundingClientRect().width + 14 : 400; strip.scrollBy({left: dir * w, behavior: reduce ? "auto" : "smooth"}); };
    var gp = $("#gp"), gn = $("#gn"); if (gp) gp.addEventListener("click", function () { step(-1); }); if (gn) gn.addEventListener("click", function () { step(1); });
  }

  // paver studio, and "use this in my request" fills in the notes
  var pv = $("#pv");
  if (pv && window.RW && RW.studio) {
    var st = RW.studio({canvas: pv, pats: $("#pats"), blends: $("#blends"), border: $("#border"), capT: $("#capT"), capSw: $("#capSw")});
    var use = $("#usePat"), notes = $("#notes");
    if (use && notes) use.addEventListener("click", function () { var line = "Pattern idea: " + st.describe() + ".";
      var rest = notes.value.replace(/^Pattern idea:.*$/m, "").trim(); notes.value = line + (rest ? "\n" + rest : "");
      notes.dispatchEvent(new Event("input", {bubbles: true})); });
  }
})();
