// R.W. Stoneworks sample sites by Nolan Day Studio: shared behavior for all three versions.
// Sample bar, reveal on scroll, phone call bar, the custom cursor, the photo lightbox and the text-the-crew builder.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RW = window.RW = window.RW || {};
  RW.tel = "+13096428736";

  // shown inside the pitch room's phone and laptop frames: no sample bar
  var framed = false;
  try { framed = window.self !== window.top || /[?&]embed=1/.test(location.search); } catch (e) { framed = true; }
  if (framed) document.documentElement.classList.add("framed");

  // reveal on scroll
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, {rootMargin: "0px 0px -8% 0px"});
    $$(".rv").forEach(function (el) { io.observe(el); });
  } else $$(".rv").forEach(function (el) { el.classList.add("in"); });

  // phone call bar: after the first screen, hidden while the contact section is on screen
  var cbar = $("#cbar"), first = $("[data-first]"), contact = $("#contact");
  if (cbar && first) {
    var tick = false;
    var upd = function () { tick = false; var fb = first.getBoundingClientRect().bottom, c = contact ? contact.getBoundingClientRect() : null;
      cbar.classList.toggle("on", fb < innerHeight * .35 && !(c && c.top < innerHeight * .8 && c.bottom > 0)); };
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, {passive: true}); upd();
  }

  // custom cursor: a warm ember dot and a stone-shaped ring that rounds off over anything you can press
  (function () {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    var cur = $("#cur"); if (!cur) return;
    var dot = $(".cd", cur), ring = $(".cr", cur), lab = $("b", ring), x = -100, y = -100, rx = -100, ry = -100, run = false, seen = false, rot = 0;
    document.documentElement.classList.add("cc");
    function tick() { var k = reduce ? 1 : .18; rx += (x - rx) * k; ry += (y - ry) * k; ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      if (Math.abs(x - rx) > .3 || Math.abs(y - ry) > .3) requestAnimationFrame(tick); else run = false; }
    addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; x = e.clientX; y = e.clientY; if (!seen) { seen = true; rx = x; ry = y; }
      cur.classList.add("on"); dot.style.transform = "translate3d(" + x + "px," + y + "px,0)"; if (!run) { run = true; requestAnimationFrame(tick); } }, {passive: true});
    document.addEventListener("pointerover", function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return;
      var lb = t.closest("[data-cur]"), a = t.closest("a,button,input[type=range],label,summary,[role=slider]"), tx = t.matches("input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea,select");
      var light = !!t.closest("[data-light]");
      cur.classList.toggle("lab", !!lb); lab.textContent = lb ? lb.getAttribute("data-cur") : "";
      cur.classList.toggle("hov", !lb && !!a); cur.classList.toggle("txt", tx); cur.classList.toggle("lt", light);
      if (!lb && a) { rot += 45; ring.style.setProperty("--rot", rot + "deg"); }
    });
    addEventListener("pointerdown", function () { cur.classList.add("dn"); });
    addEventListener("pointerup", function () { cur.classList.remove("dn"); });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) cur.classList.remove("on"); });
  })();

  // photo lightbox for the gallery
  (function () {
    var items = $$("[data-lb]"); if (!items.length) return;
    var box = document.createElement("div"); box.className = "lb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Photo");
    var ico = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
    box.innerHTML = '<figure><img alt=""><figcaption><b></b><span></span></figcaption></figure>' +
      '<button class="x" type="button" aria-label="Close">' + ico('<path d="M6 6l12 12M18 6 6 18"/>') + '</button>' +
      '<button class="pv" type="button" aria-label="Previous photo">' + ico('<path d="m15 5-7 7 7 7"/>') + '</button>' +
      '<button class="nx" type="button" aria-label="Next photo">' + ico('<path d="m9 5 7 7-7 7"/>') + '</button>';
    document.body.appendChild(box);
    var img = $("img", box), cap = $("b", box), sub = $("figcaption span", box), i = 0, back = null;
    function show(k) { i = (k + items.length) % items.length; var it = items[i], im = $("img", it);
      img.src = it.getAttribute("data-lb"); img.alt = im ? im.alt : ""; cap.textContent = it.getAttribute("data-h") || ""; sub.textContent = it.getAttribute("data-s") || ""; }
    function open(k) { back = document.activeElement; show(k); box.classList.add("on"); document.documentElement.style.overflow = "hidden"; $(".x", box).focus(); }
    function close() { box.classList.remove("on"); document.documentElement.style.overflow = ""; if (back) back.focus(); }
    items.forEach(function (it, k) { it.addEventListener("click", function (e) { e.preventDefault(); open(k); }); });
    $(".x", box).addEventListener("click", close); $(".pv", box).addEventListener("click", function () { show(i - 1); }); $(".nx", box).addEventListener("click", function () { show(i + 1); });
    box.addEventListener("click", function (e) { if (e.target === box || e.target.tagName === "FIGURE") close(); });
    addEventListener("keydown", function (e) { if (!box.classList.contains("on")) return; if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(i - 1); else if (e.key === "ArrowRight") show(i + 1); });
  })();

  // text-the-crew: tap what you need and the text writes itself (opens the phone's own Messages app)
  (function () {
    var box = $("[data-texter]"); if (!box) return;
    var pick = {job: null, when: null}, out = $("[data-msg]", box), go = $("[data-send]", box);
    function msg() {
      var s = "Hi R.W. Stoneworks, I found you online. ";
      s += pick.job ? "I'm looking at " + pick.job.toLowerCase() + (pick.when ? ", " + pick.when.toLowerCase() : "") + "." : "I have a project I'd like to talk about.";
      s += " Could you call or text me back? Thanks!";
      return s;
    }
    function draw() { var s = msg(); out.textContent = s; go.href = "sms:" + RW.tel + (/iP(hone|ad|od)/.test(navigator.userAgent) ? "&" : "?") + "body=" + encodeURIComponent(s); }
    $$("[data-k] button", box).forEach(function (b) {
      b.addEventListener("click", function () { var k = b.parentNode.getAttribute("data-k"), on = b.getAttribute("aria-pressed") !== "true";
        $$("button", b.parentNode).forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", on ? "true" : "false"); pick[k] = on ? b.getAttribute("data-v") || b.textContent : null; draw();
        out.classList.remove("pop"); void out.offsetWidth; out.classList.add("pop"); });
    });
    draw();
  })();

  // request form and live ticket: a sample, so nothing is sent anywhere
  (function () {
    $$("form[data-req]").forEach(function (f) {
      var tk = $("[data-ticket]"), fine = $(".fine", f);
      function set(k, v) { if (!tk) return; var d = $('[data-t="' + k + '"]', tk); if (d) { d.textContent = v || "–"; d.classList.remove("flash"); void d.offsetWidth; d.classList.add("flash"); } }
      $$("[data-k] button", f).forEach(function (b) {
        b.addEventListener("click", function () { var g = b.parentNode, multi = g.hasAttribute("data-multi");
          if (multi) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
          else $$("button", g).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
          set(g.getAttribute("data-k"), $$('button[aria-pressed="true"]', g).map(function (o) { return o.textContent; }).join(", ")); });
      });
      $$("input,textarea", f).forEach(function (el) { el.addEventListener("input", function () { set(el.name, el.value.trim()); }); });
      f.addEventListener("submit", function (e) { e.preventDefault();
        var n = f.elements.n, p = f.elements.p;
        if (n && n.value.trim().length < 2) { n.focus(); fine.textContent = "Add your name first."; return; }
        if (p && p.value.replace(/\D/g, "").length < 10) { p.focus(); fine.textContent = "Add a phone number so the crew can call you back."; return; }
        fine.textContent = "This is a sample site, so nothing was sent. On the real site this goes straight to R.W. Stoneworks.";
        if (tk) tk.classList.add("sent"); });
    });
  })();
})();
