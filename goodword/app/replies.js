/* Good Word reply writer. Pure functions, no DOM. Works in the browser and in Node tests. */
(function (root) {
  'use strict';

  var MAX_NAME = 40;

  var TOPICS = [
    { key: 'speed', words: ['fast', 'quick', 'same day', 'right away', 'on time', 'prompt', 'showed up'],
      good: ['Getting to you quickly is something we work hard at', 'We know your time matters, so that means a lot'] },
    { key: 'price', words: ['price', 'fair', 'afford', 'reasonable', 'quote', 'estimate', 'value'],
      good: ['Fair, clear pricing matters to us', 'We always want the price to make sense before we start'] },
    { key: 'people', words: ['friendly', 'kind', 'nice', 'polite', 'professional', 'respectful', 'courteous', 'helpful'],
      good: ['I will pass your kind words on to the crew', 'The team will be glad to hear that'] },
    { key: 'quality', words: ['quality', 'great job', 'great work', 'amazing', 'excellent', 'perfect', 'beautiful', 'looks great', 'thorough', 'detail'],
      good: ['We care a lot about getting the details right', 'Doing the job properly is the whole point for us'] },
    { key: 'clean', words: ['clean', 'tidy', 'spotless', 'cleaned up'],
      good: ['Leaving the place clean is part of the job', 'We always want to leave things better than we found them'] },
    { key: 'talk', words: ['communicat', 'explained', 'kept me', 'updates', 'honest', 'answered'],
      good: ['Keeping you in the loop is how we like to work', 'Straight answers are what we would want too'] }
  ];

  var ISSUES = [
    { key: 'late', words: ['late', 'wait', 'slow', 'took forever', 'no show', 'never showed', 'didn\'t show', 'never came'],
      line: 'Running behind or leaving you waiting is not the standard we hold ourselves to' },
    { key: 'cost', words: ['expensive', 'overcharg', 'overpriced', 'rip off', 'ripoff', 'too much', 'charged'],
      line: 'Nobody should feel unsure about what they were charged' },
    { key: 'rude', words: ['rude', 'unprofessional', 'attitude', 'disrespect', 'ignored'],
      line: 'Everyone who calls us should be treated with respect' },
    { key: 'work', words: ['poor', 'bad job', 'sloppy', 'not fixed', 'still broken', 'damage', 'mess', 'worse', 'missed'],
      line: 'If the work was not right, I want the chance to look at it myself' },
    { key: 'call', words: ['call back', 'called back', 'no answer', 'voicemail', 'never heard', 'no response', 'didn\'t respond'],
      line: 'You should have heard back from us, and I am sorry you did not' }
  ];

  var OPEN_GOOD = [
    'Thank you, {name}.', 'Thanks so much, {name}.', '{name}, thank you for taking the time to write this.',
    'This made our day, {name}.', 'We really appreciate this, {name}.'
  ];
  var CLOSE_GOOD = [
    'We are here whenever you need us again.', 'Thanks for trusting a small local business.',
    'See you next time.', 'It was a pleasure working with you.', 'Thank you for choosing {shop}.'
  ];
  var OPEN_MID = [
    'Thank you for the honest feedback, {name}.', '{name}, thanks for telling us how it went.',
    'We appreciate you taking the time, {name}.'
  ];
  var OPEN_BAD = [
    '{name}, thank you for telling us, and I am sorry.', 'I am sorry to read this, {name}.',
    '{name}, this is not the experience we want anyone to have.'
  ];

  function clean(text, max) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function firstName(name) {
    var first = clean(name, MAX_NAME).split(' ')[0] || '';
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
  }

  function findMatches(list, text) {
    var lower = String(text || '').toLowerCase();
    return list.filter(function (item) {
      return item.words.some(function (word) { return lower.indexOf(word) !== -1; });
    });
  }

  function pick(list, seed) {
    return list[((seed % list.length) + list.length) % list.length];
  }

  function fill(text, vars) {
    var out = text.replace(/\{(\w+)\}/g, function (_, key) { return vars[key] || ''; });
    return out.replace(/^,\s*/, '').replace(/\s+([,.])/g, '$1').replace(/,\./g, '.').replace(/\s{2,}/g, ' ').trim();
  }

  function capitalise(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  function signOff(shop) {
    var owner = firstName(shop.owner);
    var name = clean(shop.name, 80);
    if (owner && name) return owner + ', ' + name;
    return owner || name;
  }

  function contactLine(shop, seed) {
    var phone = clean(shop.phone, 30);
    var owner = firstName(shop.owner);
    var who = owner ? 'ask for ' + owner : 'ask for the owner';
    if (!phone) return 'Please get in touch with us directly so we can make it right.';
    return pick([
      'Please call ' + phone + ' and ' + who + ' so we can make it right.',
      'I would like to fix this. You can reach me at ' + phone + '.',
      'Could you call ' + phone + ' and ' + who + '? I want to sort this out with you directly.'
    ], seed || 0);
  }

  function goodReply(input, shop, seed) {
    var vars = { name: firstName(input.name), shop: clean(shop.name, 80) };
    var topics = findMatches(TOPICS, input.text);
    var parts = [fill(pick(OPEN_GOOD, seed), vars)];
    if (topics.length) parts.push(pick(pick(topics, seed).good, seed + 1) + '.');
    if (topics.length > 1 && seed % 3 === 2) parts.push(pick(pick(topics, seed + 1).good, seed) + '.');
    parts.push(fill(pick(CLOSE_GOOD, seed + (topics.length ? 1 : 0)), vars));
    return capitalise(parts.join(' ')) + '\n' + signOff(shop);
  }

  function midReply(input, shop, seed) {
    var vars = { name: firstName(input.name), shop: clean(shop.name, 80) };
    var topics = findMatches(TOPICS, input.text);
    var issues = findMatches(ISSUES, input.text);
    var parts = [fill(pick(OPEN_MID, seed), vars)];
    if (topics.length) parts.push('I am glad some of it went well.');
    if (issues.length) parts.push(pick(issues, seed).line + '.');
    parts.push('I would like to hear what would have made this a five-star visit.');
    parts.push(contactLine(shop, seed));
    return capitalise(parts.join(' ')) + '\n' + signOff(shop);
  }

  function badReply(input, shop, seed) {
    var vars = { name: firstName(input.name), shop: clean(shop.name, 80) };
    var issues = findMatches(ISSUES, input.text);
    var parts = [fill(pick(OPEN_BAD, seed), vars)];
    if (issues.length) parts.push(pick(issues, seed).line + '.');
    else parts.push('I want to understand what happened.');
    parts.push(contactLine(shop, seed));
    return capitalise(parts.join(' ')) + '\n' + signOff(shop);
  }

  /**
   * Write reply drafts for one review.
   * input: {stars 1-5, name, text}; shop: {name, owner, phone}; round: which batch of drafts.
   * Returns 3 different drafts. Never offers anything in return for a review.
   */
  function writeReplies(input, shop, round) {
    var stars = Math.min(5, Math.max(1, parseInt(input.stars, 10) || 5));
    var writer = stars >= 4 ? goodReply : stars === 3 ? midReply : badReply;
    var base = (parseInt(round, 10) || 0) * 3;
    var seen = {};
    var drafts = [];
    for (var seed = base; drafts.length < 3 && seed < base + 12; seed++) {
      var draft = writer(input, shop || {}, seed);
      if (!seen[draft]) { seen[draft] = true; drafts.push(draft); }
    }
    return drafts;
  }

  var api = { writeReplies: writeReplies, firstName: firstName };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GWReplies = api;
})(typeof window !== 'undefined' ? window : this);
