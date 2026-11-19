// Sample bar with the plan switcher. Hidden when a page is shown inside the pitch deck's device frames.
(function () {
  var framed = false;
  try { framed = window.self !== window.top || /[?&]embed=1/.test(location.search); } catch (e) { framed = true; }
  if (framed) document.documentElement.classList.add("framed");
  var bar = document.querySelector(".hb-bar");
  if (!bar || framed) return;
  // keep the scroll position's section when hopping between plans
  bar.querySelectorAll(".hb-plans a").forEach(function (a) {
    a.addEventListener("click", function () { try { sessionStorage.setItem("hb-from", location.pathname); } catch (e) { /* private mode */ } });
  });
})();
