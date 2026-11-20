// Flagship kit: behavior shared by every tier of a shop sample site.
// Reads the shop's facts from <script type="application/json" id="cfg">. Sample forms never send anything.
(function () {
  var D = document, H = D.documentElement;
  H.classList.add("js");
  var C = {};
  try { C = JSON.parse(D.getElementById("cfg").textContent); } catch (e) { C = {}; }
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };

  // sample bar: hidden inside the pitch room's device frames
  var framed = false;
  try { framed = window.self !== window.top || /[?&]embed=1/.test(location.search); } catch (e) { framed = true; }
  if (framed) H.classList.add("framed");

  // header shadow + phone call bar (hidden over the hero and the contact section)
  var top = $(".top"), cbar = $("#cbar"), hero = $("[data-hero]"), contact = $("#quote");
  function onScroll() {
    if (top) top.classList.toggle("stuck", scrollY > 8);
    if (!cbar) return;
    var past = hero ? hero.getBoundingClientRect().bottom < 0 : scrollY > 400, r = contact ? contact.getBoundingClientRect() : null;
    cbar.classList.toggle("on", past && !(r && r.top < innerHeight && r.bottom > 0));
  }
  addEventListener("scroll", onScroll, {passive: true}); onScroll();

  // "Ask about this" buttons pick the job in the form, then jump to it
  $$("[data-job]").forEach(function (b) {
    b.addEventListener("click", function () {
      var sel = $("#f-job"); if (sel) { sel.value = b.getAttribute("data-job"); sel.dispatchEvent(new Event("change", {bubbles: true})); }
      var chip = $('[data-pick="job"] [data-v="' + b.getAttribute("data-job") + '"]'); if (chip) chip.click();
    });
  });

  // Rather text? chips write the text message for the visitor
  var sms = $("#sms"), smsLink = $("#smsGo");
  if (sms && smsLink) {
    var setSms = function (job) {
      var body = "Hi " + (C.short || "") + ", I found you on Google. I'm in " + (C.town || "the area") + " and I'm looking for help with: " + job.toLowerCase() + ". ";
      $("#smsText").textContent = body;
      smsLink.href = "sms:" + C.tel + (/iP(hone|ad|od)/.test(navigator.userAgent) ? "&" : "?") + "body=" + encodeURIComponent(body);
    };
    $$("button", sms).forEach(function (b) {
      b.addEventListener("click", function () { $$("button", sms).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); setSms(b.textContent); });
    });
    var first = $("button", sms); if (first) { first.setAttribute("aria-pressed", "true"); setSms(first.textContent); }
  }

  // request form: inline checks, then a friendly sample confirmation
  var f = $("#form");
  if (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var ok = true, first = null;
      [["f-name", function (v) { return v.trim().length > 1; }], ["f-phone", function (v) { return v.replace(/\D/g, "").length >= 10; }], ["f-job", function (v) { return !!v; }]].forEach(function (c) {
        var el = D.getElementById(c[0]); if (!el) return; var good = c[1](el.value);
        el.closest(".fld").classList.toggle("bad", !good); el.setAttribute("aria-invalid", good ? "false" : "true"); if (!good) { ok = false; first = first || el; }
      });
      if (!ok) { first.focus(); return; }
      $("#who").textContent = D.getElementById("f-name").value.trim().split(" ")[0];
      f.classList.add("sent"); var d = $(".done", f); d.setAttribute("tabindex", "-1"); d.focus();
    });
    f.addEventListener("input", function (e) { var fl = e.target.closest(".fld"); if (fl && fl.classList.contains("bad")) { fl.classList.remove("bad"); e.target.removeAttribute("aria-invalid"); } });
  }

  // save-to-contacts card
  var vc = $("#vcard");
  if (vc) vc.addEventListener("click", function () {
    var v = "BEGIN:VCARD\nVERSION:3.0\nFN:" + C.name + "\nORG:" + C.name + "\nTEL;TYPE=WORK,VOICE:" + C.tel + "\nADR;TYPE=WORK:;;;" + C.town + ";" + (C.st || "IL") + ";;USA\nNOTE:Sample contact from a Nolan Day Studio preview site.\nEND:VCARD";
    var a = D.createElement("a"); a.href = URL.createObjectURL(new Blob([v], {type: "text/vcard"})); a.download = (C.short || "contact").replace(/[^A-Za-z0-9]+/g, "-") + ".vcf"; D.body.appendChild(a); a.click(); a.remove();
  });

  // Google rating counts up when it comes into view
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (reduce || !("IntersectionObserver" in window)) { el.textContent = to.toFixed(dec); return; }
    el.textContent = (0).toFixed(dec);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect(); var t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1200); k = 1 - Math.pow(1 - k, 3); el.textContent = (to * k).toFixed(dec); if (k < 1) requestAnimationFrame(step); })(t0);
    }, {threshold: .5});
    io.observe(el);
  });

  // reveal on scroll
  if (!reduce && "IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } }); }, {rootMargin: "0px 0px -8% 0px"});
    $$(".rv").forEach(function (el) { ro.observe(el); });
  } else $$(".rv").forEach(function (el) { el.classList.add("in"); });

  // live request ticket (Signature + Immersive): chips fill in a ticket, then the form
  var tick = $(".tick");
  if (tick) {
    var state = {};
    $$("[data-pick]").forEach(function (g) {
      var k = g.getAttribute("data-pick"), multi = g.hasAttribute("data-multi");
      $$("button", g).forEach(function (b) {
        b.addEventListener("click", function () {
          if (multi) { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); state[k] = $$('button[aria-pressed="true"]', g).map(function (x) { return x.getAttribute("data-v"); }); }
          else { $$("button", g).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); state[k] = b.getAttribute("data-v"); }
          render(k);
        });
      });
    });
    var render = function (k) {
      $$("[data-out]").forEach(function (o) {
        var v = state[o.getAttribute("data-out")]; v = Array.isArray(v) ? v.join(", ") : v;
        o.textContent = v || "—"; o.classList.toggle("set", !!v);
        if (o.getAttribute("data-out") === k) { o.classList.remove("pop"); void o.offsetWidth; o.classList.add("pop"); }
      });
      var sel = $("#f-job"); if (sel && state.job) sel.value = state.job;
      var msg = $("#f-msg"); if (msg) msg.value = ["when", "reach"].filter(function (x) { return state[x] && state[x].length; }).map(function (x) { return (x === "when" ? "When: " : "Reach me: ") + (Array.isArray(state[x]) ? state[x].join(", ") : state[x]); }).join(". ");
      var n = $$("[data-out]").filter(function (o) { return o.classList.contains("set"); }).length, all = $$("[data-out]").length;
      var bar = $(".tick-bar i", tick); if (bar) bar.style.width = (n / all * 100) + "%";
    };
  }
})();
