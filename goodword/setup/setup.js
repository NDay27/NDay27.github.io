/* Good Word setup helper for the team. Builds a preview link and the shop file text. */
(function () {
  'use strict';

  var GW = window.GW;
  var SITE = 'https://nday27.github.io/goodword/';
  var form = document.getElementById('f');
  var err = document.getElementById('err');

  function slugify(name, town) {
    return (name + ' ' + town).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function readForm() {
    var raw = {};
    ['name', 'town', 'state', 'owner', 'phone', 'start'].forEach(function (key) { raw[key] = form.elements[key].value; });
    var link = form.elements.link.value.trim();
    if (/^https:\/\//i.test(link)) raw.link = link;
    else if (link) raw.placeid = link;
    return { raw: raw, link: link };
  }

  function fileText(shop) {
    var out = { name: shop.name, town: shop.town, state: shop.state, owner: shop.owner, phone: shop.phone };
    if (shop.placeid) out.placeid = shop.placeid;
    if (shop.link) out.link = shop.link;
    if (shop.start != null) out.start = shop.start;
    out.goal = GW.DEFAULT_GOAL;
    out.status = 'trial';
    return JSON.stringify(out, null, 2);
  }

  function show(shop) {
    var code = GW.encodeShop({ name: shop.name, town: shop.town, state: shop.state, owner: shop.owner, phone: shop.phone, placeid: shop.placeid, link: shop.link, start: shop.start });
    var demo = SITE + 'app/#d=' + code;
    var slug = slugify(shop.name, shop.town);
    var hello = shop.owner ? 'Hi ' + GW.firstName(shop.owner) + ', ' : 'Hi, ';
    document.getElementById('demoLink').textContent = demo;
    document.getElementById('openDemo').href = demo;
    document.getElementById('pitch').textContent = hello + 'it\'s Nolan Day. Here is the review app I mentioned, already set up with ' + shop.name +
      ' on it. Open it on your phone and try the Ask button: ' + demo + ' It is free for 14 days, then $39 a month if you keep it.';
    document.getElementById('fileName').textContent = 'goodword/shops/' + slug + '.json';
    document.getElementById('liveLink').textContent = SITE + 'app/?s=' + slug;
    document.getElementById('json').textContent = fileText(shop);
    document.getElementById('result').hidden = false;
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var input = readForm();
    var shop = GW.cleanShop(input.raw);
    var message = '';
    if (!shop) message = 'Add the business name.';
    else if (input.link && !GW.hasDirectLink(shop)) message = 'That review link is not a Google link or Place ID. Check it, or leave it blank for a preview.';
    err.textContent = message; err.hidden = !message;
    if (!message) show(shop);
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy]');
    if (!button) return;
    var value = document.getElementById(button.dataset.copy).textContent;
    var done = function () { var old = button.textContent; button.textContent = 'Copied'; setTimeout(function () { button.textContent = old; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(value).then(done, function () { window.prompt('Copy this:', value); });
    else window.prompt('Copy this:', value);
  });
})();
