// Flagship kit, Signature tier: before/after hero, the "how it goes" stage and the trade tool.
(function () {
  var D = document, $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // before/after: drag anywhere on the picture, or use the arrow keys on the hidden range
  var ba = $("#ba");
  if (ba) {
    var rng = $("#baR"), x0 = +ba.getAttribute("data-x") || 50, x = x0, raf = 0, drag = false, touched = false;
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
      var t0 = 0, path = [[0, x0], [900, x0], [2100, 82], [3500, 24], [4600, x0]];
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

  // auto: tap a dash light, get a plain answer
  var dc = $("#dashCheck");
  if (dc) {
    var DL = JSON.parse($("#dashData").textContent), vd = $("#verdict"), dl = $("#dlAdd");
    $$("button", dc).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", dc).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var d = DL[b.getAttribute("data-k")];
        $(".lvl", vd).className = "lvl" + (d.lvl === "stop" ? " soon" : ""); $(".lvl span", vd).textContent = d.lt;
        $("h3", vd).textContent = d.name + " light"; $("p", vd).textContent = d.text;
        dl.hidden = false; dl.setAttribute("data-note", d.name + " light is on");
      });
    });
    dl.addEventListener("click", function () {
      var j = "Warning light", chip = $('[data-pick="job"] [data-v="' + j + '"]'); if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      var sel = $("#f-job"); if (sel) sel.value = j;
    });
  }

  // storefronts: two taps, a plain answer, and the pick goes into the request
  var qz = $("#quiz");
  if (qz) {
    var QD = JSON.parse($("#quizData").textContent), qv = $("#verdict"), qa = $("#qzAdd"), qp = {};
    var qshow = function () {
      var j = qp.job, o = qp.two && QD.q2[qp.two], sw = $(".sw", qv);
      $(".lvl span", qv).textContent = j && o ? "Ready to send" : j || o ? "One more tap" : "Two taps";
      sw.hidden = !(o && o.c); if (o && o.c) sw.style.setProperty("--c", o.c);
      $(".t", qv).textContent = j && o ? j + ": " + o.l : j ? QD.q2h : QD.ask;
      $("p", qv).textContent = j && o ? o.t + " " + QD.tip : o ? o.t : j ? "One more tap and you're set." : "Pick one from each list and get a plain answer.";
      qa.hidden = !(j && o);
    };
    $$("[data-q] .opts", qz).forEach(function (grp) {
      var k = grp.parentNode.getAttribute("data-q");
      $$("button", grp).forEach(function (b) {
        b.addEventListener("click", function () {
          $$("button", grp).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          qp[k] = b.getAttribute("data-v"); qshow();
        });
      });
    });
    qa.addEventListener("click", function () {
      var j = qp.job, o = QD.q2[qp.two], chip = $('[data-pick="job"] [data-v="' + j + '"]'); if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      var sel = $("#f-job"); if (sel) sel.value = j;
      var m = $("#f-msg"); if (m && o && m.value.indexOf(o.l) < 0) m.value = (m.value ? m.value + "\n" : "") + QD.q2h + " " + o.l;
    });
  }

  // body shop: tap where it got hit, then what it looks like
  var bc = $("#bodyCheck");
  if (bc) {
    var BD = JSON.parse($("#bodyData").textContent), bv = $("#verdict"), ba = $("#bcAdd"), pick = {};
    var show = function () {
      $$(".zone", bc).forEach(function (z) { z.classList.toggle("on", z.getAttribute("data-z") === pick.where); });
      var w = pick.where && BD.where[pick.where], d = pick.what && BD.what[pick.what];
      $(".lvl", bv).className = "lvl" + (d && d.lvl !== "plan" ? " soon" : "");
      $(".lvl span", bv).textContent = d ? d.lt : w ? "One more tap" : "Two taps";
      $("h3", bv).textContent = w && d ? d.name + ": " + w.toLowerCase() : w ? w + ". What does it look like?" : "Where did it get hit?";
      $("p", bv).textContent = d ? d.text : w ? "Pick what it looks like below the truck." : "Tap the spot on the truck, then pick what it looks like.";
      ba.hidden = !(w && d); if (d) ba.setAttribute("data-job", d.job);
    };
    $$(".hs", bc).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".hs", bc).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        pick.where = b.getAttribute("data-z"); show();
      });
    });
    $$("[data-q=what] button", bc).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-q=what] button", bc).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        pick.what = b.getAttribute("data-v"); show();
      });
    });
    ba.addEventListener("click", function () {
      var j = ba.getAttribute("data-job"), chip = $('[data-pick="job"] [data-v="' + j + '"]'); if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      var sel = $("#f-job"); if (sel) sel.value = j;
    });
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
