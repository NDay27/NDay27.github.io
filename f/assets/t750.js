// Flagship kit, Signature tier: before/after hero, the "how it goes" stage and the trade tool.
(function () {
  var D = document, $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // before/after: drag anywhere on the picture, or use the arrow keys on the hidden range
  var ba = $("#ba");
  if (ba) {
    var rng = $("#baR"), x = 50, raf = 0, drag = false, touched = false;
    var set = function (v) { x = Math.max(2, Math.min(98, v)); ba.style.setProperty("--x", x + "%"); rng.value = Math.round(x); };
    var at = function (e) { var r = ba.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    ba.addEventListener("pointerdown", function (e) { if (e.button) return; drag = true; touched = true; ba.classList.add("drag"); set(at(e)); try { ba.setPointerCapture(e.pointerId); } catch (er) { /* old browsers */ } });
    ba.addEventListener("pointermove", function (e) { if (drag) set(at(e)); });
    var up = function () { drag = false; ba.classList.remove("drag"); };
    ba.addEventListener("pointerup", up); ba.addEventListener("pointercancel", up);
    rng.addEventListener("input", function () { touched = true; set(+rng.value); });
    ba.addEventListener("click", function () { rng.focus({preventScroll: true}); });
    // a slow sweep on arrival shows people the picture moves
    if (!reduce) {
      var t0 = 0, path = [[0, 50], [900, 50], [2100, 82], [3500, 24], [4600, 50]];
      var step = function (t) {
        if (touched) return; if (!t0) t0 = t; var e = t - t0, i = 1;
        while (i < path.length - 1 && e > path[i][0]) i++;
        var a = path[i - 1], b = path[i], k = Math.min(1, Math.max(0, (e - a[0]) / (b[0] - a[0]))); k = k * k * (3 - 2 * k);
        set(a[1] + (b[1] - a[1]) * k); if (e < path[path.length - 1][0]) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
  }

  // how it goes: the picture follows the step in view
  var steps = $$("#vsteps li"), imgs = $$("#stage img");
  if (steps.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var i = steps.indexOf(e.target);
        steps.forEach(function (s, j) { s.classList.toggle("on", j === i); }); imgs.forEach(function (m, j) { m.classList.toggle("on", j === i); });
      });
    }, {rootMargin: "-45% 0px -45% 0px"});
    steps.forEach(function (s) { io.observe(s); });
  } else steps.forEach(function (s) { s.classList.add("on"); });

  // lawn: season planner
  var months = $("#months");
  if (months) {
    var data = JSON.parse($("#monthData").textContent), card = $("#moCard");
    var show = function (b) {
      $$("button", months).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var m = data[b.getAttribute("data-m")];
      $(".mo", card).textContent = m.name;
      $("ul", card).innerHTML = m.items.map(function (t) { return "<li>" + card.getAttribute("data-check") + "<span>" + t + "</span></li>"; }).join("");
      var add = $("#moAdd", card); add.setAttribute("data-job", m.job); add.textContent = "Ask about " + m.job.toLowerCase();
    };
    $$("button", months).forEach(function (b) { b.addEventListener("click", function () { show(b); }); });
    var now = new Date().getMonth(), pick = $$("button", months).filter(function (b) { return +b.getAttribute("data-m") === now; })[0] || $$("button", months)[0];
    show(pick);
    $("#moAdd").addEventListener("click", function () {
      var j = this.getAttribute("data-job"), chip = $('[data-pick="job"] [data-v="' + j + '"]'); if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      var sel = $("#f-job"); if (sel) sel.value = j;
    });
  }

  // tree: a three-question check
  var tc = $("#treeCheck");
  if (tc) {
    var ans = {};
    $$("[data-q]", tc).forEach(function (g) {
      $$("button", g).forEach(function (b) {
        b.addEventListener("click", function () {
          $$("button", g).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          ans[g.getAttribute("data-q")] = b.getAttribute("data-v"); verdict();
        });
      });
    });
    var verdict = function () {
      var v = $("#verdict"), soon = ans.near === "touching" || ans.what === "leaning" || ans.what === "dead" || ans.what === "storm";
      var job = ans.what === "gone" || ans.what === "dead" ? "Remove a tree" : ans.what === "storm" ? "Storm damage" : ans.what === "stump" ? "Stump" : "Trim or prune";
      var n = Object.keys(ans).length;
      $(".lvl", v).className = "lvl" + (soon ? " soon" : ""); $(".lvl span", v).textContent = n < 3 ? "Answer all three" : soon ? "Worth a look soon" : "Good to plan ahead";
      $("h3", v).textContent = n < 3 ? "Tell us about the tree" : "Sounds like: " + job.toLowerCase();
      $("p", v).textContent = n < 3 ? "Three taps and you'll have a summary to send." : (soon ? "A tree that touches the house, leans or has dead wood is worth having someone look at before the next storm. " : "Nothing here sounds urgent, so it's a good time to plan the work. ") + "Send this to the crew and they'll tell you what it really needs.";
      var add = $("#tcAdd"); add.hidden = n < 3; add.setAttribute("data-job", job);
    };
    $("#tcAdd").addEventListener("click", function () {
      var j = this.getAttribute("data-job"), chip = $('[data-pick="job"] [data-v="' + j + '"]'); if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      var sel = $("#f-job"); if (sel) sel.value = j;
    });
    verdict();
  }

  // painting: tap a color, the house changes
  var sw = $("#swatches");
  if (sw) {
    var pic = $("#paintPic"), name = $("#paintName");
    $$("button", sw).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", sw).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var cur = $("img:not(.out)", pic), nxt = D.createElement("img");
        nxt.src = b.getAttribute("data-src"); nxt.srcset = b.getAttribute("data-srcset"); nxt.sizes = "(max-width:900px) 100vw, 680px"; nxt.alt = b.getAttribute("data-alt"); nxt.className = "out"; nxt.width = 1600; nxt.height = 900;
        pic.appendChild(nxt);
        var go = function () { requestAnimationFrame(function () { nxt.classList.remove("out"); if (cur) { cur.classList.add("out"); setTimeout(function () { cur.remove(); }, 700); } }); };
        if (nxt.complete) go(); else nxt.onload = go;
        name.textContent = b.textContent.trim();
      });
    });
  }
})();
