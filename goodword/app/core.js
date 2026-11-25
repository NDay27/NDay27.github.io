/* Good Word core: shop config, review links, messages, dates. Pure functions, no DOM. */
(function (root) {
  'use strict';

  var DAY_MS = 86400000;
  var REMIND_AFTER_DAYS = 3;
  var DEFAULT_GOAL = 5;
  var MAX_GOAL = 100;
  var SLUG_RE = /^[a-z0-9][a-z0-9-]{1,59}$/;
  var PLACE_RE = /^[A-Za-z0-9_-]{20,255}$/;
  var REVIEW_HOSTS = ['g.page', 'google.com', 'www.google.com', 'search.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'];

  var TONES = {
    friendly: {
      label: 'Friendly',
      ask: 'Hi {first}, it\'s {owner} from {shop}. Thanks for choosing us! If you have 30 seconds, a quick Google review would mean a lot to a small business like ours: {link}',
      nudge: 'Hi {first}, {owner} from {shop} again. No pressure at all. Here is that review link in case it got buried: {link} Thank you either way!'
    },
    short: {
      label: 'Short',
      ask: 'Hi {first}, thanks for choosing {shop}. Would you leave us a quick Google review? {link}',
      nudge: 'Hi {first}, one last nudge from {shop}. The review link is here if you have a minute: {link}'
    },
    formal: {
      label: 'Formal',
      ask: 'Hello {first}, this is {owner} with {shop}. Thank you for your business. We would be grateful if you shared your experience in a Google review: {link}',
      nudge: 'Hello {first}, this is {owner} with {shop}. If you have a moment, we would still value your review: {link} Thank you.'
    }
  };

  function text(value, max) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function wholeNumber(value, min, max) {
    var n = parseInt(value, 10);
    if (isNaN(n)) return null;
    return Math.min(max, Math.max(min, n));
  }

  function isReviewLink(link) {
    try {
      var url = new URL(link);
      return url.protocol === 'https:' && REVIEW_HOSTS.indexOf(url.hostname) !== -1;
    } catch (err) {
      return false;
    }
  }

  /** Turn untrusted JSON into a safe shop object, or null when there is no usable name. */
  function cleanShop(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = text(raw.name, 80);
    if (!name) return null;
    var status = ['trial', 'active', 'paused'].indexOf(raw.status) !== -1 ? raw.status : 'preview';
    return {
      name: name,
      town: text(raw.town, 60),
      state: text(raw.state, 20),
      owner: text(raw.owner, 40),
      phone: text(raw.phone, 30),
      placeid: PLACE_RE.test(String(raw.placeid || '')) ? String(raw.placeid) : '',
      link: isReviewLink(raw.link) ? String(raw.link) : '',
      start: wholeNumber(raw.start, 0, 100000),
      goal: wholeNumber(raw.goal, 1, MAX_GOAL) || DEFAULT_GOAL,
      status: status,
      sample: raw.sample === true
    };
  }

  function encodeShop(shop) {
    var json = JSON.stringify(shop);
    var bytes = new TextEncoder().encode(json);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeShop(code) {
    try {
      var b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return cleanShop(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (err) {
      return null;
    }
  }

  /** The page where a customer writes the review. Always a Google address. */
  function reviewUrl(shop) {
    if (shop.placeid) return 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(shop.placeid);
    if (shop.link) return shop.link;
    var query = [shop.name, shop.town, shop.state, 'reviews'].filter(Boolean).join(' ');
    return 'https://www.google.com/search?q=' + encodeURIComponent(query).replace(/%20/g, '+');
  }

  function hasDirectLink(shop) {
    return Boolean(shop.placeid || shop.link);
  }

  function firstName(name) {
    var first = text(name, 40).split(' ')[0] || '';
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
  }

  /** Fill a message template. Tidies up when the owner or customer name is missing. */
  function fillMessage(template, vars) {
    var owner = firstName(vars.owner);
    var first = firstName(vars.first);
    var out = String(template || '');
    if (!owner) {
      out = out.replace(/it's \{owner\} from \{shop\}/g, 'it\'s {shop}')
        .replace(/this is \{owner\} with \{shop\}/g, 'this is {shop}')
        .replace(/\{owner\} from \{shop\} again/g, '{shop} again')
        .replace(/\{owner\}/g, '');
    }
    out = out.replace(/\{first\}/g, first).replace(/\{owner\}/g, owner)
      .replace(/\{shop\}/g, vars.shop || '').replace(/\{link\}/g, vars.link || '');
    return out.replace(/\b(Hi|Hello|Hey) ,/g, '$1,').replace(/\.\.(\s|$)/g, '.$1').replace(/\s{2,}/g, ' ').trim();
  }

  /** US numbers get +1. Returns '' when it does not look like a phone number. */
  function dialable(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) return '+1' + digits;
    if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
    if (digits.length > 11 && digits.length <= 15) return '+' + digits;
    return '';
  }

  function prettyPhone(phone) {
    var d = dialable(phone);
    if (d.length === 12 && d.indexOf('+1') === 0) return '(' + d.slice(2, 5) + ') ' + d.slice(5, 8) + '-' + d.slice(8);
    return text(phone, 30);
  }

  function smsHref(phone, body, isApple) {
    var sep = isApple ? '&' : '?';
    return 'sms:' + dialable(phone) + sep + 'body=' + encodeURIComponent(body);
  }

  function weekStart(now) {
    var d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  }

  function daysAgo(then, now) {
    var a = new Date(then); a.setHours(0, 0, 0, 0);
    var b = new Date(now); b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / DAY_MS);
  }

  function whenLabel(then, now) {
    var days = daysAgo(then, now);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function asksThisWeek(people, now) {
    var start = weekStart(now);
    return people.filter(function (p) { return p.at >= start; }).length;
  }

  function dueReminders(people, now) {
    return people.filter(function (p) {
      return p.status === 'asked' && !p.nudgedAt && daysAgo(p.at, now) >= REMIND_AFTER_DAYS;
    });
  }

  /** Weeks in a row (ending this week or last week) with at least one ask. */
  function weekStreak(people, now) {
    var weeks = {};
    people.forEach(function (p) { weeks[weekStart(p.at)] = true; });
    var cursor = weekStart(now);
    if (!weeks[cursor]) cursor = weekStart(cursor - DAY_MS);
    var streak = 0;
    while (weeks[cursor]) { streak++; cursor = weekStart(cursor - DAY_MS); }
    return streak;
  }

  function toCsv(people) {
    var cell = function (v) {
      var s = String(v == null ? '' : v);
      if (/^[=+\-@]/.test(s)) s = '\'' + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    var rows = [['Name', 'Phone', 'Asked', 'Reminded', 'Status'].map(cell).join(',')];
    people.forEach(function (p) {
      var day = function (t) { return t ? new Date(t).toISOString().slice(0, 10) : ''; };
      rows.push([p.name, p.phone, day(p.at), day(p.nudgedAt), p.status].map(cell).join(','));
    });
    return rows.join('\r\n');
  }

  var api = {
    DAY_MS: DAY_MS, REMIND_AFTER_DAYS: REMIND_AFTER_DAYS, DEFAULT_GOAL: DEFAULT_GOAL, MAX_GOAL: MAX_GOAL,
    SLUG_RE: SLUG_RE, TONES: TONES,
    text: text, wholeNumber: wholeNumber, cleanShop: cleanShop, encodeShop: encodeShop, decodeShop: decodeShop,
    reviewUrl: reviewUrl, hasDirectLink: hasDirectLink, isReviewLink: isReviewLink,
    firstName: firstName, fillMessage: fillMessage, dialable: dialable, prettyPhone: prettyPhone, smsHref: smsHref,
    weekStart: weekStart, daysAgo: daysAgo, whenLabel: whenLabel, asksThisWeek: asksThisWeek,
    dueReminders: dueReminders, weekStreak: weekStreak, toCsv: toCsv
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GW = api;
})(typeof window !== 'undefined' ? window : this);
