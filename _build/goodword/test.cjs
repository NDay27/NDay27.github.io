/* Good Word checks. Run: node _build/goodword/test.cjs  (serves the repo root itself) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const core = require(path.join(ROOT, 'goodword/app/core.js'));
const replies = require(path.join(ROOT, 'goodword/app/replies.js'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let passed = 0;
const failed = [];

function check(name, ok, detail) {
  if (ok) { passed += 1; return; }
  failed.push(name + (detail ? ' -> ' + detail : ''));
}

function serve() {
  const server = http.createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('missing'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

function unitChecks() {
  const now = new Date('2026-11-25T12:00:00').getTime();
  check('cleanShop needs a name', core.cleanShop({ town: 'x' }) === null);
  check('cleanShop drops non-Google links', core.cleanShop({ name: 'A', link: 'https://evil.example/x' }).link === '');
  check('cleanShop drops javascript links', core.cleanShop({ name: 'A', link: 'javascript:alert(1)' }).link === '');
  check('cleanShop keeps g.page link', core.cleanShop({ name: 'A', link: 'https://g.page/r/abc/review' }).link !== '');
  check('cleanShop rejects lookalike host', core.cleanShop({ name: 'A', link: 'https://google.com.evil.example/r' }).link === '');
  check('place id makes a write-review link', core.reviewUrl(core.cleanShop({ name: 'A', placeid: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })).indexOf('writereview?placeid=ChIJ') > 0);
  check('fallback is a Google search', core.reviewUrl(core.cleanShop({ name: 'Bob & Sons', town: 'Pekin' })).indexOf('https://www.google.com/search?q=Bob+%26+Sons+Pekin+reviews') === 0);
  check('hash round trip keeps accents', core.decodeShop(core.encodeShop({ name: 'Café Niño', town: 'Peoria' })).name === 'Café Niño');
  check('bad hash returns null', core.decodeShop('%%%') === null);
  check('status defaults to preview', core.cleanShop({ name: 'A', status: 'hacked' }).status === 'preview');
  const msg = core.fillMessage(core.TONES.friendly.ask, { first: 'dana', owner: 'sam', shop: 'Harlow Co.', link: 'L' });
  check('message fills names', msg.indexOf('Hi Dana, it\'s Sam from Harlow Co. Thanks') === 0, msg);
  Object.keys(core.TONES).forEach((tone) => ['ask', 'nudge'].forEach((kind) => {
    const out = core.fillMessage(core.TONES[tone][kind], { first: '', owner: '', shop: 'Shop', link: 'LINK' });
    check(tone + ' ' + kind + ' has no leftovers', !/[{}]|  | ,|undefined/.test(out) && out.indexOf('LINK') > 0, out);
  }));
  check('10 digits get +1', core.dialable('(309) 555-0112') === '+13095550112');
  check('short number rejected', core.dialable('555-0112') === '');
  check('apple sms link', core.smsHref('3095550112', 'a b', true) === 'sms:+13095550112&body=a%20b');
  check('android sms link', core.smsHref('3095550112', 'a b', false) === 'sms:+13095550112?body=a%20b');
  const people = [{ at: now, status: 'asked' }, { at: now - 3 * core.DAY_MS, status: 'asked' }, { at: now - 4 * core.DAY_MS, status: 'asked', nudgedAt: 1 },
    { at: now - 5 * core.DAY_MS, status: 'reviewed' }, { at: now - 9 * core.DAY_MS, status: 'asked' }];
  check('week count starts Monday', core.asksThisWeek(people, now) === 1, String(core.asksThisWeek(people, now)));
  check('reminders: 3+ days, once, not reviewed', core.dueReminders(people, now).length === 2);
  check('streak counts weeks in a row', core.weekStreak(people, now) === 2, String(core.weekStreak(people, now)));
  check('csv guards formulas', core.toCsv([{ name: '=SUM(A1)', phone: '', at: now, status: 'asked' }]).indexOf('"\'=SUM(A1)"') > 0);
  [1, 2, 3, 4, 5].forEach((stars) => {
    const drafts = replies.writeReplies({ stars, name: 'kim', text: 'fast but expensive, never called back' }, { name: 'Shop', owner: 'sam', phone: '(309) 555-0148' }, 0);
    check(stars + ' star gives 3 different drafts', drafts.length === 3 && new Set(drafts).size === 3);
    check(stars + ' star drafts are clean', drafts.every((d) => !/[{}]|undefined|  |,\.| ,/.test(d) && /Kim/.test(d)), drafts.join(' | '));
    check(stars + ' star never offers a reward', drafts.every((d) => !/discount|free|coupon|gift|refund/i.test(d)));
    if (stars <= 3) check(stars + ' star gives a way to reach the owner', drafts.every((d) => d.indexOf('(309) 555-0148') > 0));
  });
  check('no name still reads well', /^(Thank|Thanks|This|We)/.test(replies.writeReplies({ stars: 5 }, { name: 'Shop' }, 0)[0]));
}

async function newPage(browser, opts, errors) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, opts));
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('Failed to load resource') === -1) errors.push('console ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().indexOf('/shops/nope') === -1) errors.push(r.status() + ' ' + r.url()); });
  return page;
}

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const toastText = (page) => page.textContent('#toast');

async function appChecks(browser, base, errors) {
  const page = await newPage(browser, { hasTouch: true, isMobile: true }, errors);
  await page.goto(base + 'app/?s=harlow&embed=1');
  await page.waitForSelector('.tabs');
  check('sample shop shows its name', (await page.textContent('h1')) === 'Harlow Building Co.');
  check('today fits the phone', await noOverflow(page));
  check('ring shows asks of goal', (await page.textContent('.ringnum')).replace(/\s/g, '') === '3of8');
  await page.click('#askBtn');
  check('empty name is refused', (await page.textContent('#askErr')) === 'Add their first name.');
  await page.fill('input[name=name]', 'jordan');
  check('preview uses the name', (await page.textContent('#preview')).indexOf('Hi Jordan, it\'s Sam from Harlow Building Co. Thanks') === 0);
  check('button names the customer', (await page.textContent('#askBtn')) === 'Text Jordan');
  await page.fill('input[name=phone]', '555-01');
  await page.click('#askBtn');
  check('short number is refused', (await page.textContent('#askErr')).indexOf('looks short') > 0);
  await page.fill('input[name=phone]', '309 555 0199');
  await page.click('#askBtn');
  check('ask is counted', (await page.textContent('.ringnum')).replace(/\s/g, '') === '4of8');
  check('form clears after an ask', (await page.inputValue('input[name=name]')) === '');
  await page.fill('input[name=name]', 'Jordan'); await page.fill('input[name=phone]', '3095550199');
  await page.click('#askBtn');
  check('second ask to same number warns first', (await page.textContent('#askErr')).indexOf('You asked Jordan today') === 0);
  await page.click('.acts [data-act=nudge]');
  check('reminder leaves the due list', (await page.locator('.list li').count()) === 1);
  await page.click('[data-act=count-up]');
  check('review count goes up', (await page.textContent('.big')) === '18');

  await page.click('[data-tab=people]');
  check('people list has everyone', (await page.locator('.person').count()) === 10);
  check('people fits the phone', await noOverflow(page));
  await page.fill('#search', 'jord');
  check('search narrows the list', (await page.locator('.person').count()) === 1);
  check('search keeps focus', await page.evaluate(() => document.activeElement.id === 'search'));
  await page.click('.prow'); await page.click('[data-act=reviewed]');
  check('marking reviewed shows the tag', (await page.textContent('.person .tag')) === 'Reviewed');
  await page.click('[data-act=remove]');
  await page.fill('#search', '');
  check('remove takes one away', (await page.locator('.person').count()) === 9);
  await page.click('#toast [data-act=undo]');
  check('undo brings them back', (await page.locator('.person').count()) === 10);

  await page.click('[data-tab=counter]');
  check('qr code is drawn', (await page.locator('.qrbox svg path').getAttribute('d')).length > 500);
  check('counter fits the phone', await noOverflow(page));
  await page.click('[data-act=qr-full]');
  check('full screen qr opens', await page.isVisible('.fullqr svg'));
  await page.keyboard.press('Escape');
  check('escape closes the sheet', await page.isHidden('#sheet'));

  await page.click('[data-tab=replies]');
  await page.click('.stars [data-n="1"]');
  await page.fill('input[name=rname]', 'pat'); await page.fill('textarea[name=rtext]', 'never called me back');
  await page.click('form[data-form=reply] .btn');
  check('three reply drafts show', (await page.locator('.draft').count()) === 3);
  check('bad review reply apologises', /sorry|not the experience/i.test(await page.textContent('.draft p')));
  check('replies fit the phone', await noOverflow(page));

  await page.click('[data-act=settings]');
  await page.fill('textarea[name=ask]', 'no link here');
  await page.click('form[data-form=settings] .btn');
  check('settings need the link token', (await page.textContent('#setErr')).indexOf('Keep {link}') === 0);
  await page.click('[data-tone=short]');
  await page.fill('input[name=owner]', 'Riley');
  await page.click('form[data-form=settings] .btn');
  await page.click('[data-tab=today]');
  check('short wording is used', (await page.textContent('#preview')).indexOf('Hi Jordan, thanks for choosing Harlow Building Co. Would you') === 0, await page.textContent('#preview'));
  await page.context().close();
}

async function edgeChecks(browser, base, errors) {
  const page = await newPage(browser, {}, errors);
  const evil = core.encodeShop({ name: '<img src=x onerror="window.__x=1">Bob\'s', town: 'Pekin', link: 'https://evil.example/phish' });
  await page.goto(base + 'app/#d=' + evil);
  await page.waitForSelector('.tabs');
  check('shop name is shown as text, not run', (await page.evaluate(() => window.__x)) === undefined && (await page.locator('h1 img').count()) === 0);
  check('preview banner shows', (await page.textContent('.notice')).indexOf('Preview for') === 0);
  await page.click('[data-tab=counter]');
  check('unsafe link falls back to Google', (await page.textContent('.mono')).indexOf('https://www.google.com/search?q=') === 0);
  await page.click('[data-tab=today]');
  check('desktop button copies', (await page.textContent('#askBtn')) === 'Copy the message');
  await page.fill('form[data-form=start] input', '7'); await page.click('form[data-form=start] button');
  check('starting count is set', (await page.textContent('.big')) === '7');
  await page.fill('input[name=name]', 'Ana'); await page.click('#askBtn');
  await page.reload(); await page.waitForSelector('.tabs');
  check('list survives a reload', (await page.textContent('.ringnum')).replace(/\s/g, '') === '1of5' && (await page.textContent('.big')) === '7');
  await page.goto(base + 'app/?s=nope'); await page.waitForSelector('.boot h1');
  check('unknown shop explains itself', (await page.textContent('.boot h1')) === 'We could not open that business');
  await page.goto(base + 'app/'); await page.waitForSelector('.boot h1');
  check('no shop explains itself', (await page.textContent('.boot h1')) === 'No business picked');

  await page.route('**/shops/harlow.json', (route) => route.fulfill({ json: { name: 'Paused Shop', status: 'paused' } }));
  await page.goto(base + 'app/?s=harlow'); await page.waitForSelector('.boot h1');
  check('paused shop is locked', (await page.textContent('.boot h1')) === 'This account is paused');
  await page.unroute('**/shops/harlow.json');

  let sentTo = '';
  await page.route('https://www.google.com/**', (route) => { sentTo = route.request().url(); route.fulfill({ body: 'ok' }); });
  await page.goto(base + 'r/?s=harlow'); await page.waitForURL('https://www.google.com/**');
  check('qr page sends people to Google', sentTo.indexOf('https://www.google.com/search?q=Harlow+Building+Co.') === 0, sentTo);
  await page.goto(base + 'r/?s=../x'); await page.waitForTimeout(200);
  check('qr page handles a bad code', (await page.textContent('#title')).indexOf('not set up') > 0);
  await page.context().close();
}

async function pageChecks(browser, base, errors) {
  for (const size of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const page = await newPage(browser, { viewport: size }, errors);
    await page.goto(base); await page.waitForSelector('#rdDraft');
    check('pitch page fits ' + size.width, await noOverflow(page));
    check('reply demo has a draft ' + size.width, (await page.textContent('#rdDraft')).length > 40);
    await page.click('.chipb[data-stars="1"]');
    check('upset review gets a calm reply ' + size.width, /sorry|not the experience/i.test(await page.textContent('#rdDraft')));
    const before = await page.textContent('#rdDraft');
    await page.click('#rdMore');
    check('another draft is different ' + size.width, (await page.textContent('#rdDraft')) !== before);
    await page.click('#tryForm .btn');
    check('preview needs a name ' + size.width, await page.isVisible('#tryErr'));
    await page.fill('#tName', 'Prairie Line Lawn Co.'); await page.fill('#tOwner', 'Sam');
    const [popup] = await Promise.all([page.waitForEvent('popup'), page.click('#tryForm .btn')]);
    await popup.waitForSelector('.tabs');
    check('preview opens with their name ' + size.width, (await popup.textContent('h1')) === 'Prairie Line Lawn Co.');
    check('page has one h1 ' + size.width, (await page.locator('h1').count()) === 1);
    await page.context().close();
  }
  const page = await newPage(browser, { viewport: { width: 390, height: 844 } }, errors);
  await page.goto(base + 'setup/');
  await page.fill('#name', 'Bob\'s Tire & Lube'); await page.fill('#town', 'Pekin'); await page.fill('#owner', 'bob');
  await page.fill('#link', 'https://evil.example/x'); await page.click('#f .btn');
  check('setup refuses a non-Google link', await page.isVisible('#err'));
  await page.fill('#link', 'https://g.page/r/CabcDEF123/review'); await page.fill('#start', '14'); await page.click('#f .btn');
  check('setup names the file', (await page.textContent('#fileName')) === 'goodword/shops/bob-s-tire-and-lube-pekin.json');
  const file = JSON.parse(await page.textContent('#json'));
  check('setup file is valid', file.name === 'Bob\'s Tire & Lube' && file.start === 14 && file.status === 'trial' && core.cleanShop(file).link !== '');
  const link = await page.textContent('#demoLink');
  await page.goto(link.replace('https://nday27.github.io/goodword/', base)); await page.waitForSelector('.tabs');
  check('setup link opens the shop', (await page.textContent('h1')) === 'Bob\'s Tire & Lube' && (await page.textContent('.big')) === '14');
  check('setup page fits the phone', await noOverflow(page));
  await page.context().close();
}

(async () => {
  unitChecks();
  const server = await serve();
  const base = 'http://localhost:' + server.address().port + '/goodword/';
  const browser = await chromium.launch();
  const errors = [];
  try {
    await appChecks(browser, base, errors);
    await edgeChecks(browser, base, errors);
    await pageChecks(browser, base, errors);
  } catch (err) {
    failed.push('crashed: ' + err.message.slice(0, 900));
  }
  check('no console errors or failed requests', errors.length === 0, errors.join(' ; '));
  await browser.close(); server.close();
  console.log(passed + ' passed, ' + failed.length + ' failed');
  failed.forEach((f) => console.log('FAIL ' + f));
  process.exit(failed.length ? 1 : 0);
})();
