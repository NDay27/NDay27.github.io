/* Main Street Diner: sample site by Nolan Day Studio.
   Neon sign switch-on, open/closed status from example hours, menu tabs, specials board,
   scroll-filled coffee mug, live guest check for the sample order form, reveals. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- example hours ---------- */
  var HOURS = { 0: [7, 13], 1: [6, 14], 2: [6, 14], 3: [6, 14], 4: [6, 14], 5: [6, 20], 6: [6, 14] };
  function fmt(h) { var ap = h >= 12 ? "pm" : "am", x = h % 12 || 12; return x + " " + ap; }
  var now = new Date(), dow = now.getDay(), hr = now.getHours() + now.getMinutes() / 60, today = HOURS[dow], isOpen = hr >= today[0] && hr < today[1];
  var st = $("#status"), msg;
  if (isOpen) msg = "Open now · until " + fmt(today[1]);
  else if (hr < today[0]) msg = "Closed now · opens " + fmt(today[0]) + " today";
  else msg = "Closed now · opens " + fmt(HOURS[(dow + 1) % 7][0]) + " tomorrow";
  if (st) { st.classList.add(isOpen ? "open" : "closed"); $("span", st).textContent = msg + " (example hours)"; }
  var ho = $("#hcOpen"); if (ho) { ho.textContent = isOpen ? "Open" : "Closed"; ho.classList.add(isOpen ? "open" : "closed"); }
  $$("#hoursList [data-day]").forEach(function (r) { if (+r.dataset.day === dow) r.classList.add("today"); });

  /* ---------- sign bulbs + neon ---------- */
  var bulbs = $("#bulbs");
  if (bulbs) {
    var x0 = 182, x1 = 618, y0 = 38, y1 = 142, i = 0, add = function (x, y) { var c = document.createElementNS(SVGNS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 3.2); c.setAttribute("fill", "#FFE7AE"); c.style.setProperty("--i", i++); bulbs.appendChild(c); };
    for (var x = x0; x <= x1; x += 22) add(x, y0);
    for (var y = y0 + 26; y < y1; y += 26) add(x1, y);
    for (x = x1 - 22; x >= x0; x -= 22) add(x, y1);
    for (y = y1 - 26; y > y0; y -= 26) add(x0, y);
    $$(".neon-diner text").forEach(function (t, k) { t.style.setProperty("--i", k); });
  }
  $$(".lamp").forEach(function (l) {
    var m = l.querySelector("path").getAttribute("d").match(/M(\d+) ?(\d+)/);
    if (m) l.style.transformOrigin = m[1] + "px " + m[2] + "px";
  });
  var front = $("#storefront");
  function light() { if (front) front.classList.add("lit"); }

  /* ---------- menu tabs ---------- */
  var tabs = $$(".tabs [role=tab]");
  function show(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab, p = document.getElementById(t.getAttribute("aria-controls"));
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; p.hidden = !on; p.classList.toggle("on", on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { show(t); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(tabs[(k + 1) % tabs.length], true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(tabs[(k - 1 + tabs.length) % tabs.length], true); }
    });
  });
  $$(".items").forEach(function (ul) { $$("li", ul).forEach(function (li, k) { li.style.setProperty("--i", k); }); });

  /* ---------- specials: circle today ---------- */
  var week = $("#week"), ring = $(".ring");
  function placeRing() {
    var li = week && $('[data-day="' + dow + '"]', week); if (!li || !ring) return;
    li.classList.add("today");
    ring.style.top = (week.offsetTop + li.offsetTop - 8) + "px";
    ring.style.height = (li.offsetHeight + 16) + "px";
  }
  placeRing(); addEventListener("resize", placeRing);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeRing);

  /* ---------- coffee mug fills with scroll ---------- */
  var ahead = $("#ahead"), mug = $(".mug"), refill = $("#refill"), coffee = $("#coffee");
  function pour() {
    if (!ahead) return;
    var r = ahead.getBoundingClientRect(), k = (innerHeight * .85 - r.top) / (r.height * .75);
    k = reduce ? 1 : Math.max(0, Math.min(1, k));
    coffee.style.setProperty("--fill", (190 - 182 * k).toFixed(1) + "px");
    refill.textContent = Math.round(k * 100);
    mug.classList.toggle("hot", k > .25);
    $(".refill").lastChild.textContent = k >= .99 ? "% full. Refills are free." : "% full. Keep scrolling for a refill.";
  }

  /* ---------- guest check ---------- */
  var of = $("#of"), lines = $("#chkLines");
  if (of) {
    var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var prev = [];
    var render = function () {
      var out = [], f = of.elements;
      out.push(["Party of", f.count.value]);
      if (f.date.value) { var p = f.date.value.split("-"); out.push(["Pickup", MON[+p[1] - 1] + " " + (+p[2])]); }
      $$("[name=what]:checked", of).forEach(function (c) { out.push([c.value, "✓"]); });
      if (f.name.value.trim()) out.push(["For", f.name.value.trim().slice(0, 22)]);
      out = out.slice(0, 6);
      var html = "";
      out.forEach(function (o, k) {
        var same = prev[k] && prev[k][0] === o[0] && prev[k][1] === o[1];
        html += '<li' + (same ? ' style="animation:none"' : "") + "><span>" + esc(o[0]) + "</span><span>" + esc(o[1]) + "</span></li>";
      });
      lines.innerHTML = html; prev = out;
    };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    of.addEventListener("input", render); of.addEventListener("change", render); render();
    of.addEventListener("submit", function (e) {
      e.preventDefault();
      $("#chkDone").hidden = false;
      if (innerWidth < 980) $(".check").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      $("#chkAgain").focus({ preventScroll: true });
    });
    $("#chkAgain").addEventListener("click", function () { $("#chkDone").hidden = true; of.reset(); prev = []; render(); });
  }

  /* ---------- header, dock, parallax ---------- */
  var dock = $("#dock"), ft = $(".ft"), ftOn = false, sky = $(".sky-l"), hero = $(".hero");
  if (ft) new IntersectionObserver(function (es) { ftOn = es[0].isIntersecting; onScroll(); }).observe(ft);
  var ticking = false;
  function onScroll() {
    var y = scrollY;
    dock.classList.toggle("show", y > 560 && !ftOn);
    if (sky && !reduce && y < hero.offsetHeight + 200) sky.style.transform = "translateY(" + (y * .12).toFixed(1) + "px)";
    pour();
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- reveals ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
  $$("[data-r]").forEach(function (el) { io.observe(el); });
  var cs = $(".closer-sign");
  if (cs) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { cs.classList.add("on"); o.disconnect(); } }, { threshold: .4 }).observe(cs);

  /* ---------- entrance ---------- */
  var started = false;
  function go() {
    if (started) return; started = true;
    $$(".hero [data-r]").forEach(function (el) { el.classList.add("in"); });
    setTimeout(light, reduce ? 0 : 500);
    placeRing();
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { requestAnimationFrame(go); }); setTimeout(go, 900); } else go();
})();
