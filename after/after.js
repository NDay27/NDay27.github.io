/* Nolan Day Studio: shared behavior for /welcome/, /live/ and /care/.
   Needs /assets/journey.js (window.NDS) loaded first. Exposes window.AFTER. */
(function (w, d) {
  "use strict";
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Stagger index for children of [data-stagger] and for .flow steps */
  function indexKids() {
    d.querySelectorAll("[data-stagger],.flow").forEach(function (p) {
      Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty("--i", i); });
    });
  }

  /* Self-drawing SVG strokes: normalise every .draw path to length 1 */
  function prepDraw() {
    d.querySelectorAll(".draw").forEach(function (p) { p.setAttribute("pathLength", "1"); });
  }

  /* One observer adds .in to anything that should animate on first sight */
  function observe() {
    var els = d.querySelectorAll(".rv,[data-stagger],[data-draw],.flow,[data-count],[data-seen]");
    if (reduce || !("IntersectionObserver" in w)) {
      els.forEach(function (e) { e.classList.add("in"); if (e.hasAttribute("data-count")) countUp(e, true); fireSeen(e); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var e = en.target; e.classList.add("in"); io.unobserve(e);
        if (e.hasAttribute("data-count")) countUp(e);
        fireSeen(e);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    els.forEach(function (e) { io.observe(e); });
  }
  function fireSeen(e) { if (e.hasAttribute("data-seen")) e.dispatchEvent(new CustomEvent("seen")); }

  /* Numbers that count up: <b data-count="412">412</b> (the real number is in the markup for no-JS and readers) */
  function countUp(el, now) {
    var to = parseFloat(el.getAttribute("data-count")) || 0, dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (now || reduce) { el.textContent = to.toFixed(dec); return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * e).toFixed(dec);
      if (k < 1) w.requestAnimationFrame(step);
    }
    w.requestAnimationFrame(step);
  }

  /* Gentle parallax for [data-par] (transform only, paused when reduced motion) */
  function parallax() {
    var els = Array.prototype.slice.call(d.querySelectorAll("[data-par]"));
    if (!els.length || reduce) return;
    var ticking = false;
    function run() {
      var vh = w.innerHeight;
      els.forEach(function (e) {
        var r = e.getBoundingClientRect(), k = parseFloat(e.getAttribute("data-par")) || 0.08;
        var off = (r.top + r.height / 2 - vh / 2) * -k;
        e.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    w.addEventListener("scroll", function () { if (!ticking) { ticking = true; w.requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  function toast(msg) {
    var t = d.getElementById("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove("on"); }, 2400);
  }

  /* Storage that never throws (private mode, blocked storage, previews) */
  var store = {
    get: function (k) { try { return JSON.parse(w.localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { w.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  /* Put the shop's name everywhere a [data-shop] slot asks for it. Returns the shop object. */
  function personalize() {
    return w.NDS.loadShop().then(function (s) {
      w.NDS.applyColors(s.colors);
      if (s.name) {
        d.querySelectorAll("[data-shop]").forEach(function (e) { e.textContent = s.name; });
        d.querySelectorAll("[data-shop-short]").forEach(function (e) { e.textContent = s.short || s.name; });
        d.querySelectorAll("[data-shop-init]").forEach(function (e) { e.textContent = (s.short || s.name).replace(/^the\s+/i, "").charAt(0).toUpperCase(); });
      }
      d.querySelectorAll("a[data-keep]").forEach(function (a) { a.href = w.NDS.link(a.getAttribute("data-keep")); });
      return s;
    });
  }

  /* Wires a "send by email" button plus copy and webmail fallbacks.
     ids: { send, copy, gmail, outlook, done }; subject() and body() build the message on demand. */
  function mailer(ids, subject, body, onDone) {
    var $ = function (id) { return id ? d.getElementById(id) : null; };
    function refresh() {
      var c = w.NDS.composeLinks(subject(), body());
      if ($(ids.send)) $(ids.send).href = c.mailto;
      if ($(ids.gmail)) $(ids.gmail).href = c.gmail;
      if ($(ids.outlook)) $(ids.outlook).href = c.outlook;
    }
    if ($(ids.send)) $(ids.send).addEventListener("click", function () { refresh(); if (onDone) onDone("mail"); });
    if ($(ids.copy)) $(ids.copy).addEventListener("click", function () {
      w.NDS.copy("To: " + w.NDS.STUDIO.email + "\nSubject: " + subject() + "\n\n" + body()).then(function () { toast("Copied. Paste it into a text or email."); if (onDone) onDone("copy"); });
    });
    refresh();
    return refresh;
  }

  function init() { indexKids(); prepDraw(); observe(); parallax(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();

  w.AFTER = { reduce: reduce, toast: toast, store: store, personalize: personalize, mailer: mailer, countUp: countUp, observe: observe };
})(window, document);
