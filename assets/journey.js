/* Nolan Day Studio: the client journey pages (/meet/, /proposal/, /yes/, /start/, /review/) share this file.
   One place for the plans, the payment handles and the shop lookup, so a price changes in one line.
   Every page works from a short link: ?s=<preview slug>. The shop's name, town, trade, phone and colors
   are read from its preview page, so nobody types them twice. */
(function (w) {
  "use strict";

  var STUDIO = {
    name: "Nolan Day Studio",
    owner: "Nolan Day",
    town: "Morton, Illinois",
    email: "hanbackj1@gmail.com",
    // Payment handles. Fill these in once and every pay button on every page appears. Blank hides them.
    venmo: "",
    cashapp: "",
    // Nolan Day Studio's own Google review link, once the Google Business Profile is verified. Blank hides it.
    reviewUrl: ""
  };

  /* The offer. Starter is the one we lead with (FOCUS.md). Bigger sites keep the Studio prices. */
  var PLANS = {
    starter: { id: "starter", name: "Starter Site", short: "$0 down, $99 a month", setup: 0, monthly: 99,
      tag: "Most pick this",
      line: "Your site live today. Hosting, changes whenever you ask, and your Google listing pointed at it. Cancel any time.",
      includes: ["The site you just saw, finished with your photos, hours and services",
        "Live on its own link the same day you approve it",
        "Hosting included, nothing else to pay for",
        "Changes whenever you ask: new prices, photos, hours, a new service",
        "Your Google listing pointed at the new site",
        "Cancel any time with a text. No contract"] },
    own: { id: "own", name: "Starter Site, owned", short: "$300 one time", setup: 300, monthly: 0,
      tag: "Pay once",
      line: "The same site, paid once and yours. Free hosting. One round of changes included.",
      includes: ["The site you just saw, finished with your photos, hours and services",
        "Up to 5 sections, built for phones first",
        "Live the same day you approve it, on free hosting",
        "One round of changes included",
        "You own it. Later changes are quoted before any work"] },
    signature: { id: "signature", name: "Signature", short: "$750 one time", setup: 750, monthly: 0,
      tag: "Custom look",
      line: "A custom site with its own art direction, up to 7 sections, a photo gallery and two rounds of changes.",
      demo: "/demos/signature/",
      includes: ["A custom design, not a template", "Up to 7 sections, including a photo gallery",
        "Booking or quote request flow", "Two rounds of changes", "Free hosting, you own it"] },
    immersive: { id: "immersive", name: "Immersive", short: "$1,250 to $1,500 one time", setup: 1250, monthly: 0,
      tag: "Stand-out",
      line: "Everything in Signature plus motion and a 3D centerpiece that people remember.",
      demo: "/demos/immersive/",
      includes: ["Everything in Signature", "A 3D or motion centerpiece made for your business",
        "Up to 7 sections", "Two rounds of changes", "Free hosting, you own it"] }
  };
  var PLAN_ORDER = ["starter", "own", "signature", "immersive"];

  var SLUG = /^[a-z0-9][a-z0-9-]{1,79}$/;
  var PREVIEW_BASE = "/p/2e8e4a/";

  function clean(s, max) { return String(s == null ? "" : s).replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max || 120); }
  function params() { return new URLSearchParams(w.location.search); }
  function money(n) { return "$" + Math.round(+n || 0).toLocaleString("en-US"); }
  function digits(s) { return String(s || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""); }
  function firstName(s) { return clean(s, 40).split(" ")[0] || ""; }

  /* Read the shop from its preview page. Newer previews carry a JSON block; older ones are read from
     their title, description, phone link and colors, which every preview has had since Nov 6. */
  function parseShop(html, slug) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var shop = { slug: slug, url: PREVIEW_BASE + slug + "/", services: [], towns: [] };
    var block = doc.getElementById("nds-shop");
    if (block) { try { var j = JSON.parse(block.textContent); for (var k in j) shop[k] = j[k]; } catch (e) { /* fall through to the page itself */ } }
    var t = (doc.title || "").match(/^(.*) · (.*), ([A-Z]{2}) \(free preview\)$/);
    if (t) { shop.name = shop.name || t[1]; shop.town = shop.town || t[2]; shop.state = shop.state || t[3]; }
    var d = doc.querySelector('meta[name="description"]');
    var dm = d && (d.getAttribute("content") || "").match(/^(.*?) in /);
    if (dm) shop.trade = shop.trade || dm[1];
    var tel = doc.querySelector('a[href^="tel:"]');
    if (tel && !shop.phone) { var dg = digits(tel.getAttribute("href")); if (dg.length === 10) shop.phone = "(" + dg.slice(0, 3) + ") " + dg.slice(3, 6) + "-" + dg.slice(6); }
    var style = doc.documentElement.getAttribute("style") || "";
    shop.colors = shop.colors || {};
    style.split(";").forEach(function (p) { var m = p.match(/--(\w+):\s*(#[0-9A-Fa-f]{3,8})/); if (m) shop.colors[m[1]] = m[2]; });
    if (!shop.services.length) shop.services = Array.prototype.map.call(doc.querySelectorAll(".cards .card h3"), function (h) { return clean(h.textContent, 60); });
    if (!shop.towns.length) shop.towns = Array.prototype.map.call(doc.querySelectorAll(".towns li"), function (li) { return clean(li.textContent, 40); });
    shop.name = clean(shop.name, 80); shop.town = clean(shop.town, 40); shop.trade = clean(shop.trade, 40);
    return shop;
  }

  /* Resolves the shop for this page: from its preview when ?s= names one, else from ?biz=&town= (warm leads
     without a preview). Never rejects: a page always gets an object, at worst with no name. */
  function loadShop() {
    var q = params(), src = q.get("src") || "";
    /* Previews built before Nov 17 link here with src=preview-<slug> instead of s=<slug>. */
    var slug = (q.get("s") || (src.indexOf("preview-") === 0 ? src.slice(8) : "")).toLowerCase();
    var fallback = { slug: SLUG.test(slug) ? slug : "", name: clean(q.get("biz") || q.get("n2") || ""), town: clean(q.get("town") || ""),
      trade: clean(q.get("trade") || ""), services: [], towns: [], colors: {}, url: "" };
    if (!SLUG.test(slug)) return Promise.resolve(fallback);
    return fetch(PREVIEW_BASE + slug + "/", { credentials: "omit" })
      .then(function (r) { if (!r.ok) throw new Error("no preview"); return r.text(); })
      .then(function (html) { var s = parseShop(html, slug); if (!s.name) { s.name = fallback.name; s.town = s.town || fallback.town; } return s; })
      .catch(function () { return fallback; });
  }

  /* Who sent this link: ?by=Nolan (a partner's first name works too). Shown as the person, never invented. */
  function sender() { var b = firstName(params().get("by")); return b || "Nolan"; }
  function contactName() { return firstName(params().get("n")); }

  /* Visit counter shared with the previews (abacus, free, no cookies). Keys stay under 60 characters.
     Skipped for the team's own devices (#nc once) and for robots. */
  function count(prefix, slug) {
    try {
      var skip = false;
      try { if (w.location.hash === "#nc") w.localStorage.setItem("nds_nc", "1"); skip = !!w.localStorage.getItem("nds_nc"); } catch (e) { /* storage blocked: count anyway */ }
      if (skip || navigator.webdriver) return;
      var key = (prefix + (slug || "page")).replace(/[^A-Za-z0-9-]/g, "-").slice(0, 60);
      fetch("https://abacus.jasoncameron.dev/hit/ndstudio/" + key, { keepalive: true }).catch(function () {});
    } catch (e) { /* counting never breaks a page */ }
  }

  function payLinks(amount, note) {
    var out = [];
    if (STUDIO.venmo) out.push({ label: "Pay with Venmo", href: "https://venmo.com/" + encodeURIComponent(STUDIO.venmo.replace(/^@/, "")) + "?txn=pay&amount=" + (+amount || "") + "&note=" + encodeURIComponent(note || "Website") });
    if (STUDIO.cashapp) out.push({ label: "Pay with Cash App", href: "https://cash.app/$" + encodeURIComponent(STUDIO.cashapp.replace(/^\$/, "")) + (amount ? "/" + (+amount) : "") });
    return out;
  }


  /* Thread the shop's own color through the page, but only where it stays readable: its accent when it has
     enough contrast against this theme's background, else its deep brand color (light theme) or the studio blue. */
  function lum(h) {
    h = String(h || "").replace("#", ""); if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h.slice(0, 6), 16); if (!isFinite(n)) return 0.5;
    return [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function applyColors(c) {
    if (!c || !c.acc) return;
    var root = document.documentElement, dark = root.getAttribute("data-theme") === "dark" ||
      (root.getAttribute("data-theme") !== "light" && w.matchMedia && w.matchMedia("(prefers-color-scheme: dark)").matches);
    var a = lum(c.acc), d = lum(c.deep || "#000"), pick = "";
    if (dark) pick = a > 0.12 ? c.acc : (d > 0.12 ? c.deep : "");
    else pick = a < 0.3 ? c.acc : (d < 0.3 ? c.deep : "");
    if (pick) { root.style.setProperty("--shop", pick); root.style.setProperty("--shop-ink", lum(pick) > 0.4 ? "#111111" : "#FFFFFF"); }
    if (c.deep) root.style.setProperty("--shop-deep", c.deep);
  }

  /* Opens the visitor's own mail app, or Gmail/Outlook/Yahoo on the web, with a message filled in. */
  function composeLinks(subject, body) {
    var sj = encodeURIComponent(subject), bd = encodeURIComponent(body), to = STUDIO.email;
    return {
      mailto: "mailto:" + to + "?subject=" + sj + "&body=" + bd,
      gmail: "https://mail.google.com/mail/?view=cm&fs=1&to=" + to + "&su=" + sj + "&body=" + bd,
      outlook: "https://outlook.live.com/mail/0/deeplink/compose?to=" + to + "&subject=" + sj + "&body=" + bd,
      yahoo: "https://compose.mail.yahoo.com/?to=" + to + "&subject=" + sj + "&body=" + bd
    };
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var a = document.createElement("textarea"); a.value = text; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0";
    document.body.appendChild(a); a.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; } a.remove(); return ok;
  }

  /* Links between the journey pages keep the shop and the people. */
  function link(path, extra) {
    var q = params(), out = new URLSearchParams();
    ["s", "n", "by", "biz", "town", "trade"].forEach(function (k) { if (q.get(k)) out.set(k, q.get(k)); });
    for (var k in (extra || {})) { if (extra[k] == null || extra[k] === "") out.delete(k); else out.set(k, extra[k]); }
    var s = out.toString(); return path + (s ? "?" + s : "");
  }

  function planFromParam() {
    var p = (params().get("plan") || "").toLowerCase();
    if (PLANS[p]) return p;
    if (p.indexOf("own") === 0 || p === "300") return "own";
    if (p.indexOf("starter") === 0 || p === "99" || p === "monthly") return "starter";
    return "";
  }

  w.NDS = { STUDIO: STUDIO, PLANS: PLANS, PLAN_ORDER: PLAN_ORDER, clean: clean, params: params, money: money, digits: digits,
    firstName: firstName, loadShop: loadShop, parseShop: parseShop, sender: sender, contactName: contactName, count: count,
    payLinks: payLinks, applyColors: applyColors, composeLinks: composeLinks, copy: copy, link: link, planFromParam: planFromParam };
})(window);
