/* Good Word app: the owner's side. State lives on this phone only (localStorage). */
(function () {
  'use strict';

  var GW = window.GW;
  var SITE = 'https://nday27.github.io/goodword/';
  var HELP_URL = '/?src=goodword-app#start';
  var TOAST_MS = 4200;
  var QR_PNG_SIZE = 1024;
  var params = new URLSearchParams(location.search);
  var EMBED = params.get('embed') === '1';
  var IS_APPLE = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  var IS_PHONE = window.matchMedia('(pointer: coarse)').matches;

  var el = {
    app: document.getElementById('app'), sheet: document.getElementById('sheet'),
    toast: document.getElementById('toast'), sign: document.getElementById('sign')
  };
  var shop = null;
  var slug = '';
  var storeKey = '';
  var state = null;
  var ui = { tab: 'today', open: '', query: '', stars: 5, round: 0, drafts: [], dupOk: '', rname: '', rtext: '', draft: { name: '', phone: '' } };
  var toastTimer = 0;
  var toastUndo = null;

  /* ---------- small helpers ---------- */

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c];
    });
  }

  function icon(name) {
    var paths = {
      today: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/>',
      people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.3 3-5 6-5s5.400 1.700 6 5M16 5.200a3 3 0 010 5.600M18 14.500c1.700.700 2.700 2.200 3 4.500"/>',
      counter: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
      replies: '<path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5"/>',
      gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>'
    };
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + paths[name] + '</svg>';
  }

  function toast(message, undo) {
    clearTimeout(toastTimer);
    toastUndo = undo || null;
    el.toast.innerHTML = '<span>' + esc(message) + '</span>' + (undo ? '<button type="button" data-act="undo">Undo</button>' : '');
    el.toast.hidden = false;
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, TOAST_MS);
  }

  function copyText(value, done) {
    var ok = function () { toast(done || 'Copied'); };
    var fallback = function () {
      var area = document.createElement('textarea');
      area.value = value; area.setAttribute('readonly', ''); area.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(area); area.select();
      try { document.execCommand('copy'); ok(); } catch (err) { toast('Could not copy. Press and hold the text instead.'); }
      area.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(value).then(ok, fallback);
    else fallback();
  }

  function download(href, filename) {
    var link = document.createElement('a');
    link.href = href; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
  }

  /* ---------- state ---------- */

  function freshState() {
    return { v: 1, people: [], tone: 'friendly', ask: '', nudge: '', goal: shop.goal, owner: shop.owner, start: shop.start, count: shop.start };
  }

  function loadState() {
    var base = freshState();
    if (!storeKey) return base;
    try {
      var saved = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (!saved || saved.v !== 1 || !Array.isArray(saved.people)) return base;
      return Object.assign(base, saved);
    } catch (err) {
      return base;
    }
  }

  function setState(patch) {
    state = Object.assign({}, state, patch);
    if (!storeKey) return;
    try { localStorage.setItem(storeKey, JSON.stringify(state)); }
    catch (err) { toast('This phone would not save that. Check that private browsing is off.'); }
  }

  function samplePeople() {
    var now = Date.now();
    var rows = [['Dana', '+13095550112', 0, 'asked'], ['Marcus', '+13095550127', 0, 'reviewed'], ['Priya', '+13095550139', 1, 'asked'],
      ['Tom', '+13095550151', 3, 'asked'], ['Elena', '+13095550164', 4, 'reviewed'], ['Walt', '+13095550178', 4, 'asked'],
      ['Grace', '+13095550185', 8, 'reviewed'], ['Hank', '+13095550193', 9, 'reviewed'], ['Renee', '+13095550106', 15, 'reviewed']];
    return rows.map(function (r, i) {
      return { id: 'sample' + i, name: r[0], phone: r[1], at: now - r[2] * GW.DAY_MS - i * 60000, nudgedAt: 0, status: r[3], sample: true };
    });
  }

  function messageFor(kind, first) {
    var tone = GW.TONES[state.tone] || GW.TONES.friendly;
    var template = state[kind] || tone[kind];
    return GW.fillMessage(template, { first: first, owner: state.owner, shop: shop.name, link: GW.reviewUrl(shop) });
  }

  /* ---------- QR ---------- */

  function qrTarget() {
    return slug ? SITE + 'r/?s=' + slug : GW.reviewUrl(shop);
  }

  function qrSvg(data, cls) {
    var qr = window.qrcode(0, 'M');
    qr.addData(data); qr.make();
    var n = qr.getModuleCount();
    var quiet = 3;
    var path = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) if (qr.isDark(r, c)) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
    }
    var size = n + quiet * 2;
    return '<svg class="' + (cls || 'qr') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size +
      '" role="img" aria-label="QR code that opens the Google review page" shape-rendering="crispEdges">' +
      '<rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + path + '" fill="#111"/></svg>';
  }

  function saveQrPng() {
    if (EMBED) { toast('On your phone, this saves the QR code as a picture.'); return; }
    var svg = qrSvg(qrTarget()).replace('<svg ', '<svg width="' + QR_PNG_SIZE + '" height="' + QR_PNG_SIZE + '" ');
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = QR_PNG_SIZE;
      canvas.getContext('2d').drawImage(img, 0, 0, QR_PNG_SIZE, QR_PNG_SIZE);
      download(canvas.toDataURL('image/png'), 'review-qr.png');
      toast('QR image saved');
    };
    img.onerror = function () { toast('Could not make the image. Use Print instead.'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------- views ---------- */

  function header() {
    var place = [shop.town, shop.state].filter(Boolean).join(', ');
    return '<header class="top"><div><p class="eyebrow"><span class="mark" aria-hidden="true"></span>Good Word</p>' +
      '<h1>' + esc(shop.name) + '</h1>' + (place ? '<p class="place">' + esc(place) + '</p>' : '') + '</div>' +
      '<button class="round" type="button" data-act="settings" aria-label="Settings">' + icon('gear') + '</button></header>';
  }

  function notice() {
    if (shop.sample) return '<p class="notice">Sample shop with made-up customers. Tap around, nothing is sent.</p>';
    if (shop.status === 'preview') {
      return '<p class="notice">Preview for ' + esc(shop.name) + '. ' +
        (GW.hasDirectLink(shop) ? '' : 'The link opens your Google listing for now. Setup swaps in your direct review link. ') +
        '<a href="../#price">Turn it on</a></p>';
    }
    if (shop.status === 'trial') return '<p class="notice">Free trial. Everything works.</p>';
    return '';
  }

  function ring(done, goal) {
    var r = 34;
    var len = 2 * Math.PI * r;
    var part = Math.min(1, goal ? done / goal : 0);
    return '<svg class="ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="40" cy="40" r="' + r + '" class="ring-fg" stroke-dasharray="' + (len * part).toFixed(1) + ' ' + len.toFixed(1) + '"/></svg>';
  }

  function scoreCard() {
    var now = Date.now();
    var week = GW.asksThisWeek(state.people, now);
    var reviewed = state.people.filter(function (p) { return p.status === 'reviewed'; }).length;
    var streak = GW.weekStreak(state.people, now);
    var left = Math.max(0, state.goal - week);
    var line = week === 0 ? 'Ask every customer, the same day.' : left === 0 ? 'Goal met. Keep asking every customer.' : left + ' more to hit this week\'s goal.';
    return '<section class="score" aria-label="This week"><div class="ringbox">' + ring(week, state.goal) +
      '<p class="ringnum"><b>' + week + '</b><span>of ' + state.goal + '</span></p></div>' +
      '<div class="scoretext"><h2>Asked this week</h2><p>' + esc(line) + '</p>' +
      '<dl class="stats"><div><dt>Asked in all</dt><dd>' + state.people.length + '</dd></div>' +
      '<div><dt>Left a review</dt><dd>' + reviewed + '</dd></div>' +
      '<div><dt>Week streak</dt><dd>' + streak + '</dd></div></dl></div></section>';
  }

  function askCard() {
    var first = GW.firstName(ui.draft.name);
    var label = IS_PHONE || EMBED ? 'Text ' + (first || 'them') : 'Copy the message';
    return '<section class="card ask"><h2>Ask for a review</h2>' +
      '<form data-form="ask" novalidate><div class="fields">' +
      '<label>First name<input name="name" autocomplete="off" autocapitalize="words" maxlength="40" required value="' + esc(ui.draft.name) + '" placeholder="Dana"></label>' +
      '<label>Mobile <small>optional</small><input name="phone" type="tel" inputmode="tel" autocomplete="off" maxlength="20" value="' + esc(ui.draft.phone) + '" placeholder="(309) 555-0112"></label></div>' +
      '<p class="bubble" id="preview">' + esc(messageFor('ask', ui.draft.name)) + '</p>' +
      '<p class="err" id="askErr" role="alert" hidden></p>' +
      '<button class="btn" type="submit" id="askBtn">' + esc(label) + '</button>' +
      '<div class="row"><button class="link" type="button" data-act="ask-copy">Copy</button>' +
      (navigator.share ? '<button class="link" type="button" data-act="ask-share">Share</button>' : '') +
      '<button class="link" type="button" data-act="settings">Change the wording</button></div></form></section>';
  }

  function reminderCard() {
    var due = GW.dueReminders(state.people, Date.now());
    if (!due.length) return '';
    var rows = due.slice(0, 5).map(function (p) {
      return '<li><div><b>' + esc(p.name) + '</b><span>Asked ' + esc(GW.whenLabel(p.at, Date.now()).toLowerCase()) + '</span></div>' +
        '<div class="acts"><button class="chip" type="button" data-act="reviewed" data-id="' + esc(p.id) + '">Reviewed</button>' +
        '<button class="chip dark" type="button" data-act="nudge" data-id="' + esc(p.id) + '">Remind</button></div></li>';
    }).join('');
    return '<section class="card"><h2>One friendly reminder</h2><p class="sub">Asked ' + GW.REMIND_AFTER_DAYS +
      ' or more days ago. One reminder each, then let it go.</p><ul class="list">' + rows + '</ul></section>';
  }

  function countCard() {
    if (state.start == null) {
      return '<section class="card"><h2>Your Google reviews</h2><p class="sub">How many reviews does your listing have today? This is your starting line.</p>' +
        '<form data-form="start" class="inline"><input name="start" type="number" inputmode="numeric" min="0" max="100000" required aria-label="Reviews today" placeholder="12">' +
        '<button class="btn small" type="submit">Set</button></form></section>';
    }
    var gain = state.count - state.start;
    return '<section class="card count"><h2>Your Google reviews</h2><div class="countrow">' +
      '<button class="round" type="button" data-act="count-down" aria-label="One fewer">−</button>' +
      '<p class="big" aria-live="polite">' + state.count + '</p>' +
      '<button class="round" type="button" data-act="count-up" aria-label="One more">+</button></div>' +
      '<p class="sub center">Started at ' + state.start + '. ' + (gain > 0 ? '<b class="up">+' + gain + ' since you began</b>' : 'Tap + when a new one shows up.') + '</p></section>';
  }

  function todayView() {
    return notice() + scoreCard() + askCard() + reminderCard() + countCard();
  }

  function personTag(p) {
    if (p.status === 'reviewed') return '<span class="tag good">Reviewed</span>';
    if (p.status === 'skip') return '<span class="tag">Do not ask</span>';
    return '<span class="tag">' + (p.nudgedAt ? 'Reminded' : 'Asked') + '</span>';
  }

  function personActions(p) {
    var id = '" data-id="' + esc(p.id) + '">';
    return '<div class="more">' +
      (p.status !== 'reviewed' ? '<button class="chip dark" type="button" data-act="reviewed' + id + 'They reviewed</button>' :
        '<button class="chip" type="button" data-act="unreview' + id + 'Not yet</button>') +
      (p.status === 'asked' && !p.nudgedAt ? '<button class="chip" type="button" data-act="nudge' + id + 'Send reminder</button>' : '') +
      (p.status !== 'skip' ? '<button class="chip" type="button" data-act="skip' + id + 'Do not ask again</button>' : '') +
      '<button class="chip" type="button" data-act="remove' + id + 'Remove</button></div>';
  }

  function personRow(p) {
    var open = ui.open === p.id;
    var meta = [GW.whenLabel(p.at, Date.now()), GW.prettyPhone(p.phone)].filter(Boolean).join(' · ');
    return '<li class="person' + (open ? ' open' : '') + '"><button class="prow" type="button" data-act="toggle" data-id="' + esc(p.id) + '" aria-expanded="' + open + '">' +
      '<span class="avatar" aria-hidden="true">' + esc(p.name.charAt(0).toUpperCase()) + '</span>' +
      '<span class="pmain"><b>' + esc(p.name) + '</b><span>' + esc(meta) + '</span></span>' +
      personTag(p) + '</button>' + (open ? personActions(p) : '') + '</li>';
  }

  function peopleList() {
    var q = ui.query.toLowerCase();
    var shown = state.people.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) !== -1 || String(p.phone).indexOf(q) !== -1; });
    return shown.length ? '<ul class="people">' + shown.map(personRow).join('') + '</ul>' : '<p class="sub pad">No match.</p>';
  }

  function peopleView() {
    if (!state.people.length) {
      return '<section class="empty"><h2>Nobody asked yet</h2><p>Everyone you ask shows up here, so nobody gets asked twice.</p>' +
        '<button class="btn" type="button" data-tab="today">Ask your first customer</button></section>';
    }
    return '<section class="card flush"><div class="cardhead"><h2>Everyone you asked</h2>' +
      '<button class="link" type="button" data-act="csv">Save list</button></div>' +
      '<input class="search" type="search" id="search" placeholder="Find a name or number" aria-label="Find a name or number" value="' + esc(ui.query) + '">' +
      '<div id="plist">' + peopleList() + '</div></section>';
  }

  function counterView() {
    var url = GW.reviewUrl(shop);
    return '<section class="card qrcard"><h2>At the counter</h2><p class="sub">They point their phone camera at this and land on your Google review page.</p>' +
      '<div class="qrbox">' + qrSvg(qrTarget()) + '</div>' +
      '<button class="btn" type="button" data-act="qr-full">Show it full screen</button>' +
      '<div class="grid2"><button class="btn ghost" type="button" data-act="print">Print a counter sign</button>' +
      '<button class="btn ghost" type="button" data-act="qr-save">Save the QR image</button></div></section>' +
      '<section class="card"><h2>Your review link</h2><p class="mono">' + esc(url) + '</p>' +
      '<div class="grid2"><button class="btn ghost" type="button" data-act="link-copy">Copy link</button>' +
      '<a class="btn ghost" href="' + esc(url) + '" target="_blank" rel="noopener"' + (EMBED ? ' data-act="blocked"' : '') + '>Test it</a></div>' +
      '<p class="sub">Put it on receipts, invoices and your email signature.</p></section>';
  }

  function starPicker() {
    var out = '<div class="stars" role="radiogroup" aria-label="Stars on the review">';
    for (var i = 1; i <= 5; i++) {
      out += '<button type="button" role="radio" aria-checked="' + (ui.stars === i) + '" aria-label="' + i + ' star' + (i > 1 ? 's' : '') +
        '" class="' + (i <= ui.stars ? 'on' : '') + '" data-act="stars" data-n="' + i + '">★</button>';
    }
    return out + '</div>';
  }

  function repliesView() {
    var drafts = ui.drafts.map(function (d, i) {
      return '<li class="draft"><p>' + esc(d).replace(/\n/g, '<br>') + '</p><button class="chip dark" type="button" data-act="draft-copy" data-i="' + i + '">Copy</button></li>';
    }).join('');
    return '<section class="card"><h2>Answer a review</h2><p class="sub">Replying to every review shows the next customer you care. Paste one in and get three drafts.</p>' +
      '<form data-form="reply">' + starPicker() +
      '<label>Their first name <small>optional</small><input name="rname" maxlength="40" autocapitalize="words" autocomplete="off" value="' + esc(ui.rname) + '"></label>' +
      '<label>What they wrote <small>optional</small><textarea name="rtext" rows="4" maxlength="2000" placeholder="Paste the review here">' + esc(ui.rtext) + '</textarea></label>' +
      '<button class="btn" type="submit">' + (ui.drafts.length ? 'Write three more' : 'Write replies') + '</button></form></section>' +
      (drafts ? '<section class="card" id="drafts"><h2>Pick one and make it yours</h2><ul class="drafts">' + drafts + '</ul>' +
        '<p class="sub">Read it once before posting. Never offer anything in return for a review.</p></section>' : '');
  }

  function tabbar() {
    var tabs = [['today', 'Today'], ['people', 'People'], ['counter', 'Counter'], ['replies', 'Replies']];
    return '<nav class="tabs" aria-label="Sections">' + tabs.map(function (t) {
      return '<button type="button" data-tab="' + t[0] + '"' + (ui.tab === t[0] ? ' aria-current="page"' : '') + '>' + icon(t[0]) + '<span>' + t[1] + '</span></button>';
    }).join('') + '</nav>';
  }

  function render() {
    var views = { today: todayView, people: peopleView, counter: counterView, replies: repliesView };
    el.app.innerHTML = header() + '<main class="view" id="view">' + views[ui.tab]() + '</main>' + tabbar();
    el.app.removeAttribute('aria-busy');
  }

  /* ---------- sheets ---------- */

  function openSheet(html, full) {
    el.sheet.innerHTML = '<div class="scrim" data-act="close"></div><div class="panel' + (full ? ' full' : '') + '" role="dialog" aria-modal="true">' +
      '<button class="round close" type="button" data-act="close" aria-label="Close">' + icon('x') + '</button>' + html + '</div>';
    el.sheet.hidden = false;
    var focus = el.sheet.querySelector('.close');
    if (focus) focus.focus();
  }

  function closeSheet() { el.sheet.hidden = true; el.sheet.innerHTML = ''; }

  function settingsSheet() {
    var tones = Object.keys(GW.TONES).map(function (key) {
      return '<button type="button" class="seg' + (state.tone === key && !state.ask ? ' on' : '') + '" data-act="tone" data-tone="' + key + '">' + GW.TONES[key].label + '</button>';
    }).join('');
    var tone = GW.TONES[state.tone] || GW.TONES.friendly;
    openSheet('<h2>Settings</h2><form data-form="settings">' +
      '<label>Your first name <small>goes in the text</small><input name="owner" maxlength="40" autocapitalize="words" value="' + esc(state.owner) + '"></label>' +
      '<label>Asks per week goal<input name="goal" type="number" inputmode="numeric" min="1" max="' + GW.MAX_GOAL + '" value="' + state.goal + '"></label>' +
      '<p class="lab">Wording</p><div class="segs">' + tones + '</div>' +
      '<label>The ask<textarea name="ask" rows="5" maxlength="480">' + esc(state.ask || tone.ask) + '</textarea></label>' +
      '<label>The reminder<textarea name="nudge" rows="4" maxlength="480">' + esc(state.nudge || tone.nudge) + '</textarea></label>' +
      '<p class="sub">{first} is their name, {owner} is yours, {shop} is the business and {link} is your review link. Keep {link} in.</p>' +
      '<p class="err" id="setErr" role="alert" hidden></p>' +
      '<button class="btn" type="submit">Save</button></form>' +
      '<div class="rules"><h3>The three rules</h3><ol><li>Ask every customer, not only the happy ones.</li>' +
      '<li>Never offer a discount or gift for a review.</li><li>Only text people who gave you their number. One ask, one reminder.</li></ol></div>' +
      '<button class="link danger" type="button" data-act="erase">Erase the list on this phone</button>' +
      '<p class="sub">Your customer list stays on this phone. It is never uploaded. <a href="' + HELP_URL + '">Get help</a></p>');
  }

  function fullQr() {
    openSheet('<div class="fullqr"><p class="eyebrow">' + esc(shop.name) + '</p><h2>How did we do?</h2>' + qrSvg(qrTarget()) +
      '<p>Open your camera and point it here.</p></div>', true);
  }

  function printSign() {
    if (EMBED) { toast('On your phone or computer, this prints a counter sign.'); return; }
    el.sign.innerHTML = '<div class="sign-in"><p class="sign-shop">' + esc(shop.name) + '</p><h1>How did we do?</h1>' +
      '<p class="sign-lede">Your review helps a small local business more than you know.</p>' + qrSvg(qrTarget(), 'qr sign-qr') +
      '<ol><li>Open your phone camera</li><li>Point it at the square</li><li>Tap the stars on Google</li></ol>' +
      '<p class="sign-foot">Thank you.</p></div>';
    window.print();
  }

  /* ---------- actions ---------- */

  function updatePerson(id, patch) {
    setState({ people: state.people.map(function (p) { return p.id === id ? Object.assign({}, p, patch) : p; }) });
  }

  function findPerson(id) {
    return state.people.filter(function (p) { return p.id === id; })[0];
  }

  function openText(phone, body) {
    if (EMBED) { toast('On your phone, this opens your texts with the message ready to send.'); return; }
    location.href = GW.smsHref(phone, body, IS_APPLE);
  }

  function readAskForm(form) {
    var name = GW.text(form.elements.name.value, 40);
    var phoneRaw = GW.text(form.elements.phone.value, 20);
    var err = '';
    if (!name) err = 'Add their first name.';
    else if (phoneRaw && !GW.dialable(phoneRaw)) err = 'That number looks short. Use all 10 digits, or leave it blank.';
    return { name: name.charAt(0).toUpperCase() + name.slice(1), phone: GW.dialable(phoneRaw), err: err };
  }

  function showAskError(message) {
    var box = document.getElementById('askErr');
    if (!box) return;
    box.textContent = message; box.hidden = !message;
  }

  function logAsk(input) {
    var before = state.people;
    var id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var person = { id: id, name: input.name, phone: input.phone, at: Date.now(), nudgedAt: 0, status: 'asked' };
    setState({ people: [person].concat(before.filter(function (p) { return !p.sample || shop.sample; })) });
    ui.draft = { name: '', phone: '' }; ui.dupOk = '';
    return function () { setState({ people: before }); render(); };
  }

  function askedBefore(input) {
    return state.people.filter(function (p) {
      if (input.phone) return p.phone === input.phone;
      return !p.phone && p.name.toLowerCase() === input.name.toLowerCase();
    })[0];
  }

  function submitAsk(form, how) {
    var input = readAskForm(form);
    if (input.err) { showAskError(input.err); return; }
    var before = askedBefore(input);
    var key = input.name + '|' + input.phone;
    if (before && before.status === 'skip') { showAskError(before.name + ' is marked do not ask.'); return; }
    if (before && ui.dupOk !== key) {
      ui.dupOk = key;
      showAskError('You asked ' + before.name + ' ' + GW.whenLabel(before.at, Date.now()).toLowerCase() + '. Press again to ask anyway.');
      return;
    }
    var body = messageFor('ask', input.name);
    var undo = logAsk(input);
    render();
    if (how === 'share') { navigator.share({ text: body }).catch(function () {}); toast(input.name + ' added to your list', undo); return; }
    if (how === 'copy' || (!IS_PHONE && !EMBED)) { copyText(body, 'Message copied. ' + input.name + ' is on your list.'); return; }
    toast(input.name + ' added to your list', undo);
    openText(input.phone, body);
  }

  function nudge(id) {
    var p = findPerson(id);
    if (!p) return;
    var body = messageFor('nudge', p.name);
    updatePerson(id, { nudgedAt: Date.now() });
    render();
    if (IS_PHONE || EMBED) openText(p.phone, body);
    else copyText(body, 'Reminder copied. Paste it into a text.');
  }

  function saveCsv() {
    var real = state.people.filter(function (p) { return !p.sample; });
    if (!real.length) { toast('Nothing to save yet.'); return; }
    var href = URL.createObjectURL(new Blob([GW.toCsv(real)], { type: 'text/csv' }));
    download(href, 'good-word-list.csv');
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }

  function saveSettings(form) {
    var ask = form.elements.ask.value.trim();
    var nudgeText = form.elements.nudge.value.trim();
    if (ask.indexOf('{link}') === -1 || nudgeText.indexOf('{link}') === -1) {
      var box = document.getElementById('setErr');
      box.textContent = 'Keep {link} in both messages so the customer gets your review link.'; box.hidden = false;
      return;
    }
    var tone = GW.TONES[state.tone] || GW.TONES.friendly;
    setState({
      owner: GW.text(form.elements.owner.value, 40),
      goal: GW.wholeNumber(form.elements.goal.value, 1, GW.MAX_GOAL) || GW.DEFAULT_GOAL,
      ask: ask === tone.ask ? '' : ask.slice(0, 480),
      nudge: nudgeText === tone.nudge ? '' : nudgeText.slice(0, 480)
    });
    closeSheet(); render(); toast('Saved');
  }

  function keepReplyInputs() {
    var form = document.querySelector('[data-form="reply"]');
    if (!form) return;
    ui.rname = form.elements.rname.value; ui.rtext = form.elements.rtext.value;
  }

  function writeDrafts() {
    keepReplyInputs();
    ui.drafts = window.GWReplies.writeReplies({ stars: ui.stars, name: ui.rname, text: ui.rtext },
      { name: shop.name, owner: state.owner, phone: GW.prettyPhone(shop.phone) }, ui.round);
    ui.round += 1; render();
    var box = document.getElementById('drafts');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function removePeople(keep, label) {
    var before = state.people;
    setState({ people: before.filter(keep) });
    render(); toast(label, function () { setState({ people: before }); render(); });
  }

  var actions = {
    settings: settingsSheet,
    close: closeSheet,
    undo: function () { if (toastUndo) { toastUndo(); toastUndo = null; el.toast.hidden = true; } },
    'ask-copy': function () { submitAsk(document.querySelector('[data-form="ask"]'), 'copy'); },
    'ask-share': function () { submitAsk(document.querySelector('[data-form="ask"]'), 'share'); },
    reviewed: function (d) { updatePerson(d.id, { status: 'reviewed' }); render(); toast('Marked as reviewed'); },
    unreview: function (d) { updatePerson(d.id, { status: 'asked' }); render(); },
    skip: function (d) { updatePerson(d.id, { status: 'skip' }); render(); toast('They will not be asked again'); },
    nudge: function (d) { nudge(d.id); },
    remove: function (d) { removePeople(function (p) { return p.id !== d.id; }, 'Removed'); },
    toggle: function (d) { ui.open = ui.open === d.id ? '' : d.id; render(); },
    csv: saveCsv,
    'count-up': function () { setState({ count: Math.min(100000, state.count + 1) }); render(); },
    'count-down': function () { setState({ count: Math.max(0, state.count - 1) }); render(); },
    'qr-full': fullQr,
    'qr-save': saveQrPng,
    print: printSign,
    'link-copy': function () { copyText(GW.reviewUrl(shop), 'Review link copied'); },
    blocked: function () { toast('In the real app this opens your Google review page.'); },
    stars: function (d) { keepReplyInputs(); ui.stars = parseInt(d.n, 10); ui.drafts = []; ui.round = 0; render(); },
    'draft-copy': function (d) { copyText(ui.drafts[parseInt(d.i, 10)], 'Reply copied. Paste it under the review on Google.'); },
    tone: function (d) { setState({ tone: d.tone, ask: '', nudge: '' }); settingsSheet(); },
    erase: function () { closeSheet(); removePeople(function () { return false; }, 'List erased'); }
  };

  function onClick(event) {
    var tab = event.target.closest('[data-tab]');
    if (tab) { ui.tab = tab.dataset.tab; ui.open = ''; render(); window.scrollTo(0, 0); return; }
    var target = event.target.closest('[data-act]');
    if (!target || !actions[target.dataset.act]) return;
    if (target.tagName === 'A') event.preventDefault();
    actions[target.dataset.act](target.dataset);
  }

  function onSubmit(event) {
    var form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    var kind = form.dataset.form;
    if (kind === 'ask') submitAsk(form, 'send');
    else if (kind === 'settings') saveSettings(form);
    else if (kind === 'reply') writeDrafts();
    else if (kind === 'start') {
      var n = GW.wholeNumber(form.elements.start.value, 0, 100000);
      if (n != null) { setState({ start: n, count: n }); render(); }
    }
  }

  function onInput(event) {
    var t = event.target;
    if (t.id === 'search') { ui.query = t.value; document.getElementById('plist').innerHTML = peopleList(); return; }
    var form = t.closest('[data-form="ask"]');
    if (!form) return;
    ui.draft = { name: form.elements.name.value, phone: form.elements.phone.value };
    document.getElementById('preview').textContent = messageFor('ask', ui.draft.name);
    if (IS_PHONE || EMBED) document.getElementById('askBtn').textContent = 'Text ' + (GW.firstName(ui.draft.name) || 'them');
    showAskError('');
  }

  /* ---------- boot ---------- */

  function screen(title, body) {
    el.app.removeAttribute('aria-busy');
    el.app.innerHTML = '<div class="boot"><span class="mark" aria-hidden="true"></span><h1>' + esc(title) + '</h1><p>' + body + '</p></div>';
  }

  function start(found) {
    shop = found;
    if (shop.status === 'paused') {
      screen('This account is paused', 'Your printed QR codes still work. <a href="' + HELP_URL + '">Message Nolan</a> to turn the app back on.');
      return;
    }
    document.title = 'Good Word · ' + shop.name;
    var localName = (shop.name + '-' + shop.town).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    storeKey = EMBED ? '' : 'gw1:' + (slug || 'd-' + localName);
    state = loadState();
    if (shop.sample && !state.people.length) state = Object.assign({}, state, { people: samplePeople(), count: (state.start || 0) + 5 });
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.sheet.hidden) closeSheet(); });
    if (EMBED) document.documentElement.classList.add('embed');
    render();
  }

  function boot() {
    var code = new URLSearchParams(location.hash.slice(1)).get('d');
    var fromHash = code ? GW.decodeShop(code) : null;
    if (fromHash) { start(Object.assign({}, fromHash, { status: 'preview', sample: false })); return; }
    var wanted = params.get('s') || '';
    if (!GW.SLUG_RE.test(wanted)) {
      screen('No business picked', 'Open Good Word from the link Nolan sent you, or <a href="../">see how it works</a>.');
      return;
    }
    fetch('../shops/' + wanted + '.json', { cache: 'no-cache' })
      .then(function (res) { if (!res.ok) throw new Error('missing'); return res.json(); })
      .then(function (raw) {
        var found = GW.cleanShop(raw);
        if (!found) throw new Error('bad');
        slug = wanted; start(found);
      })
      .catch(function () {
        screen('We could not open that business', 'Check your connection and try again, or <a href="' + HELP_URL + '">message Nolan</a>.');
      });
  }

  boot();
})();
