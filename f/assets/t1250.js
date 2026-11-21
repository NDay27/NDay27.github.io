// Flagship kit, Immersive tier: scroll drives the 3D yard. Each [data-beat] holds a camera key, light and trade values;
// values blend from "from" to "to" as the beat scrolls past, and the camera moves to the next beat's key near its end.
// Without WebGL (or before the scene is ready) the matching rendered still shows instead.
(function () {
  var D = document, $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var C = JSON.parse(D.getElementById("cfg").textContent), story = $("#story");
  if (!story) return;
  var beats = $$("[data-beat]", story).map(function (el) { var b = JSON.parse(el.getAttribute("data-beat")); b.el = el; return b; });
  var stills = $$(".stills img", story), scene = $(".scene", story);
  var user = JSON.parse(story.getAttribute("data-user")), cfgOn = false;
  var lerp = function (a, b, t) { return a + (b - a) * t; }, clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var cur = {i: 0, p: 0};

  function measure() {
    var vh = innerHeight, i = 0, p = 0;
    for (var k = 0; k < beats.length; k++) { var r = beats[k].el.getBoundingClientRect(); if (r.top <= vh * .5) { i = k; p = clamp((vh * .5 - r.top) / r.height); } }
    cur.i = i; cur.p = p;
    beats.forEach(function (b, k) { b.el.classList.toggle("on", k === i); });
    stills.forEach(function (m, k) { m.classList.toggle("on", k === i); });
    cfgOn = !!beats[i].cfg;
    story.classList.toggle("cfg-on", cfgOn);
  }
  addEventListener("scroll", measure, {passive: true}); addEventListener("resize", measure); measure();

  var HB = window.HB = {
    group: C.group, name: C.short || C.name, yaw: 0,
    get: function () {
      var b = beats[cur.i], n = beats[Math.min(cur.i + 1, beats.length - 1)], t = clamp((cur.p - .62) / .38), v = {};
      var from = b.from || {}, to = b.to || from;
      Object.keys(from).forEach(function (k) { v[k] = typeof from[k] === "number" ? lerp(from[k], to[k] === undefined ? from[k] : to[k], clamp(cur.p / .62)) : from[k]; });
      if (b.cfg) { Object.keys(user).forEach(function (k) { v[k] = user[k]; }); }
      var tod = b.cfg ? user.tod : lerp(b.tod, n.tod, t);
      return {a: b.cam, b: b.cfg ? b.cam : n.cam, t: b.cfg ? 0 : t, tod: tod, v: v, yaw: b.cfg ? user.yaw : 0};
    },
  };

  // the designer panel
  $$("[data-set]", story).forEach(function (el) {
    var k = el.getAttribute("data-set");
    if (el.type === "range") el.addEventListener("input", function () { user[k] = +el.value / 100; });
    else el.addEventListener("click", function () {
      var g = el.closest("[role=group]"); if (g) $$("button", g).forEach(function (x) { x.setAttribute("aria-pressed", x === el ? "true" : "false"); });
      var v = el.getAttribute("data-v"); user[k] = /^-?[\d.]+$/.test(v) ? +v : v.charAt(0) === "#" ? parseInt(v.slice(1), 16) : v;
      var lab = el.getAttribute("data-label"); if (lab) { var o = $("#cfgName"); if (o) o.textContent = lab; }
      var im = el.getAttribute("data-img"); if (im) { var s = $(".stills img:last-child", story); if (s) { s.src = im; s.removeAttribute("srcset"); } }
    });
  });

  // 3D: only with WebGL; the stills stay as the fallback
  function gl() { try { var c = D.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
  if (gl() && !/[?&]still=1/.test(location.search)) {
    import("/f/assets/flag3d.js").then(function (m) { return m.start(HB); }).then(function () { scene.classList.add("live"); measure(); })
      .catch(function (e) { if (window.console) console.warn("3D scene unavailable, showing renders instead.", e); scene.classList.add("noGL"); });
  } else scene.classList.add("noGL");
})();
