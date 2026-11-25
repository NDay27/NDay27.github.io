/* Good Word pitch page: name preview, reply demo, scroll reveal. */
(function () {
  'use strict';

  var GW = window.GW;
  var Replies = window.GWReplies;
  var SAMPLE_SHOP = { name: 'Harlow Building Co.', owner: 'Sam', phone: '(309) 555-0148' };

  function setupTry() {
    var form = document.getElementById('tryForm');
    var err = document.getElementById('tryErr');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var shop = GW.cleanShop({
        name: form.elements.name.value, town: form.elements.town.value, owner: form.elements.owner.value
      });
      err.hidden = Boolean(shop);
      if (!shop) { form.elements.name.focus(); return; }
      var code = GW.encodeShop({ name: shop.name, town: shop.town, owner: shop.owner });
      var frame = document.getElementById('demo');
      frame.src = 'app/?embed=1&t=' + Date.now() + '#d=' + code;
      frame.title = 'Good Word preview for ' + shop.name;
      document.getElementById('cover').href = 'app/#d=' + code;
      document.getElementById('demoCap').textContent = 'Preview for ' + shop.name + '.';
      window.open('app/#d=' + code, '_blank', 'noopener');
    });
  }

  function setupReplyDemo() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chipb'));
    var review = document.getElementById('rdReview');
    var draft = document.getElementById('rdDraft');
    var current = chips[0];
    var index = 0;

    function show() {
      var data = current.dataset;
      var stars = parseInt(data.stars, 10);
      var drafts = Replies.writeReplies({ stars: stars, name: data.name, text: data.text }, SAMPLE_SHOP, Math.floor(index / 3));
      review.textContent = '';
      var starLine = document.createElement('b');
      starLine.textContent = '★★★★★'.slice(0, stars);
      starLine.setAttribute('aria-label', stars + ' stars');
      review.appendChild(starLine);
      review.appendChild(document.createTextNode('“' + data.text + '” ' + data.name));
      draft.textContent = drafts[index % drafts.length];
    }

    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip === current));
      chip.addEventListener('click', function () {
        current = chip; index = 0;
        chips.forEach(function (c) { c.classList.toggle('on', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
        show();
      });
    });
    document.getElementById('rdMore').addEventListener('click', function () { index += 1; show(); });
    show();
  }

  function setupReveal() {
    var items = document.querySelectorAll('.steps3 li, .f, .replydemo, .trybox, .pricecard, .side, .rulelist li');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        seen.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (item, i) {
      item.classList.add('rise');
      item.style.transitionDelay = (i % 3) * 70 + 'ms';
      seen.observe(item);
    });
  }

  setupTry();
  setupReplyDemo();
  setupReveal();
})();
