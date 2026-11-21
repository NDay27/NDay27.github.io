#!/usr/bin/env node
/*
  Nolan Day Studio: demo reels.
  Makes a 1080x1920 H.264 video for one lead that walks through every website built for them
  (Starter, Signature, Immersive), plus a 1080x1080 cover image.

    node tools/reels/make_reel.js <slug> [more slugs...] [--out DIR] [--repo-copy] [--fps 30] [--keep]

  How it works
  - Serves this repo on a local port (python3 -m http.server), reads the lead's name, trade, colors and plan
    links from the nds-shop JSON in p/2e8e4a/<slug>/index.html (the same data the pitch room reads).
  - Loads tools/reels/stage.html (the branded frame) at 450x800 CSS px x 2.4 = 1080x1920, with each site in a
    390px-wide phone iframe, so the site renders at 2.4x and stays sharp.
  - Records frame by frame on a virtual clock: JS timers and requestAnimationFrame are faked (Playwright clock),
    CSS animations are paused and stepped by hand, so motion plays at true speed however slow the capture is.
  - ffmpeg (two-pass, sized to stay under ~3.8 MB) turns the frames into an MP4.

  Needs: node 22, playwright-core + @sparticuz/chromium (REELS_NODE_MODULES, default /root/br/node_modules), ffmpeg,
  python3, npm (only the first time, to mirror three/lenis/gsap from the npm registry: the CDN the sites use is
  not reachable from build boxes, so requests to cdn.jsdelivr.net are answered from that local mirror).
*/
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http");
const { spawn, execFileSync } = require("child_process");

const NM = process.env.REELS_NODE_MODULES || "/root/br/node_modules";
const nmRequire = require("module").createRequire(path.join(NM, "_"));
const chromiumPkg = nmRequire("@sparticuz/chromium");
const chromium = chromiumPkg.default || chromiumPkg;
const { chromium: pw } = nmRequire("playwright-core");

const ROOT = path.resolve(__dirname, "..", "..");
const CDN = process.env.REELS_CDN || path.join(os.homedir(), ".cache", "nds-reels-cdn");
const MIRROR = ["three@0.160.0", "lenis@1.1.13", "gsap@3.12.5", "@pmndrs/assets@1.7.0"];
const PLANS = [
  ["essential", "Starter", "$300", "One fast page that gets the call"],
  ["signature", "Signature", "$750", "A custom look with motion, made for your shop"],
  ["immersive", "Immersive", "$1,250", "A real-time 3D centerpiece people remember"]
];
const W = 450, H = 800, DSF = 2.4;           // 1080x1920
const VIDEO_BUDGET_MB = 3.75;

/* ---------- args ---------- */
const argv = process.argv.slice(2), slugs = [], opt = { out: "/mnt/project-files/reels", fps: 30, repoCopy: false, keep: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") opt.out = argv[++i];
  else if (a === "--fps") opt.fps = +argv[++i];
  else if (a === "--repo-copy") opt.repoCopy = true;
  else if (a === "--keep") opt.keep = true;
  else if (a === "--quick") opt.quick = true;
  else if (a === "--port") opt.port = +argv[++i];
  else if (a.startsWith("--")) { console.error("unknown option " + a); process.exit(2); }
  else slugs.push(a.toLowerCase());
}
if (!slugs.length) { console.error("usage: node tools/reels/make_reel.js <slug> [...] [--out DIR] [--repo-copy] [--fps 30] [--keep]"); process.exit(2); }

const log = (...a) => console.log("[reel]", ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- local CDN mirror ---------- */
function mirrorDir(spec) { return path.join(CDN, spec.replace("/", "_")); }
function ensureMirror() {
  fs.mkdirSync(CDN, { recursive: true });
  for (const spec of MIRROR) {
    const dir = mirrorDir(spec);
    if (fs.existsSync(path.join(dir, "package.json"))) continue;
    log("mirroring " + spec + " from the npm registry (first run only)");
    const tgz = execFileSync("npm", ["pack", spec, "--silent", "--pack-destination", CDN], { cwd: CDN, encoding: "utf8" }).trim().split("\n").pop();
    fs.mkdirSync(dir, { recursive: true });
    execFileSync("tar", ["xzf", path.join(CDN, tgz), "-C", dir, "--strip-components=1"]);
    fs.unlinkSync(path.join(CDN, tgz));
  }
}
const TYPES = { ".js": "application/javascript", ".mjs": "application/javascript", ".json": "application/json", ".css": "text/css", ".wasm": "application/wasm" };
async function cdnRoute(route) {
  const u = new URL(route.request().url());
  const m = u.pathname.match(/^\/npm\/((?:@[^/]+\/)?[^/@]+)@([^/]+)\/(.*)$/);
  if (m) {
    const f = path.join(mirrorDir(m[1] + "@" + m[2]), m[3]);
    if (f.startsWith(CDN) && fs.existsSync(f) && fs.statSync(f).isFile())
      return route.fulfill({ status: 200, path: f, headers: { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "access-control-allow-origin": "*" } });
  }
  return route.fulfill({ status: 404, body: "not mirrored" });
}

/* ---------- local server ---------- */
function get(url) {
  return new Promise(res => { http.get(url, r => { let b = ""; r.on("data", c => b += c); r.on("end", () => res({ status: r.statusCode, body: b })); }).on("error", () => res({ status: 0, body: "" })); });
}
async function startServer() {
  const port = opt.port || 8800 + Math.floor(Math.random() * 900);
  const srv = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", ROOT], { stdio: "ignore" });
  const base = "http://127.0.0.1:" + port;
  for (let i = 0; i < 50; i++) { if ((await get(base + "/robots.txt")).status) return { srv, base }; await sleep(100); }
  throw new Error("local server did not start on " + port);
}

/* ---------- lead data (same fields the pitch room reads) ---------- */
async function readShop(ctx, base, slug) {
  const r = await get(base + "/p/2e8e4a/" + slug + "/");
  if (r.status !== 200) return null;
  const m = r.body.match(/<script type="application\/json" id="nds-shop">([\s\S]*?)<\/script>/);
  let shop = { slug };
  if (m) { try { Object.assign(shop, JSON.parse(m[1])); } catch (e) { /* fall back to the title */ } }
  const t = r.body.match(/<title>(.*) · (.*), ([A-Z]{2}) \(free preview\)<\/title>/);
  if (t) { shop.name = shop.name || t[1]; shop.town = shop.town || t[2]; }
  if (!shop.name) return null;
  shop.short = shop.short || shop.name;
  const S = shop.samples || {
    essential: "/p/2e8e4a/" + slug + "/", signature: "/p/2e8e4a/" + slug + "/750/", immersive: "/p/2e8e4a/" + slug + "/1250/"
  };
  shop.plans = [];
  for (const [k, label, price, line] of PLANS) {
    if (!S[k] || !S[k].startsWith("/")) continue;
    if ((await get(base + S[k])).status !== 200) continue;
    const tool = shop.tools && shop.tools[k];
    shop.plans.push({ key: k, label, price, url: S[k], line: tool ? tool.charAt(0).toUpperCase() + tool.slice(1) : line });
  }
  /* the shop's own colors: from its page's root style, else what its first site computes */
  const p = await ctx.newPage();
  try {
    await p.goto(base + shop.plans[0].url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const c = await p.evaluate(() => {
      const st = getComputedStyle(document.body), rt = getComputedStyle(document.documentElement);
      const g = k => (st.getPropertyValue(k) || rt.getPropertyValue(k) || "").trim();
      return { acc: g("--acc") || g("--accent") || g("--brand"), deep: g("--deep") || g("--ink") };
    });
    const hex = s => (/^#[0-9a-f]{3,8}$/i.test(s) ? s : "");
    shop.acc = hex((shop.colors || {}).acc || c.acc); shop.deep = hex((shop.colors || {}).deep || c.deep);
  } catch (e) { /* default colors */ }
  await p.close();
  return shop;
}

/* ---------- choreography ---------- */
/* Each version: hold on the hero while it animates in, then three or four eased moves down the page,
   each coming to rest on a section start, like someone flicking through it on their phone. */
function planScroll(m, D, start) {
  const end = D - 0.42, moves = D >= 6.2 && end - start > 4.4 ? 4 : 3;
  const span = (end - start) / moves, mv = Math.min(0.95, span * 0.66);
  const step = Math.min(m.vh * 1.08, Math.max(m.vh * 0.6, (m.max * 0.82) / moves));
  const stops = []; let y = 0;
  for (let i = 1; i <= moves; i++) {
    const want = Math.min(m.max, y + step);
    let best = want, bd = step * 0.34;
    for (const tp of m.tops) { const d = Math.abs(tp - want); if (tp > y + step * 0.45 && d < bd) { bd = d; best = tp; } }
    y = Math.min(m.max, Math.round(best)); stops.push(y);
  }
  const keys = [];
  let prev = 0;
  stops.forEach((s, i) => { const t0 = start + i * span; keys.push([t0, t0 + mv, prev, s]); prev = s; });
  return t => {
    let v = 0;
    for (const [a, b, y0, y1] of keys) {
      if (t <= a) { v = y0; break; }
      if (t < b) { const x = (t - a) / (b - a); const e = x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2; v = y0 + (y1 - y0) * e; break; }
      v = y1;
    }
    return Math.round(v * 2) / 2;
  };
}

/* ---------- one reel ---------- */
async function makeReel(browser, base, slug) {
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, hasTouch: true, reducedMotion: "no-preference", colorScheme: "light" });
  await ctx.route("https://cdn.jsdelivr.net/**", cdnRoute);
  await ctx.route(/abacus\.jasoncameron\.dev/, r => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  const shop = await readShop(ctx, base, slug);
  if (!shop || !shop.plans.length) { await ctx.close(); return { slug, error: "no preview found at p/2e8e4a/" + slug + "/" }; }
  log(slug + ": " + shop.name + " · " + shop.plans.map(p => p.label).join(", "));

  const fps = opt.fps, dt = 1000 / fps, n = shop.plans.length;
  const INTRO = 1.9, OUTRO = 2.8, SEG = opt.quick ? 2.4 : n === 3 ? 5.6 : n === 2 ? 6.6 : 8.4;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reel-" + slug.slice(0, 20) + "-"));
  const page = await ctx.newPage();
  const errs = [], warnings = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.clock.install({ time: new Date("2026-11-20T15:00:00") });
  await page.clock.pauseAt(new Date("2026-11-20T15:00:05"));
  await page.goto(base + "/tools/reels/stage.html", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const u = "nday27.github.io/meet/", q = "?s=" + slug;
  await page.evaluate(c => R.setup(c), {
    name: shop.name, short: shop.short, trade: shop.trade || "", town: shop.town || "", acc: shop.acc, deep: shop.deep,
    plans: shop.plans.map(p => ({ key: p.key, label: p.label, price: p.price, line: p.line })), urlHost: u, urlQuery: q
  });
  await page.evaluate(() => document.fonts.ready);

  /* Straight CDP captures of the whole frame. Playwright's page.screenshot waits on animation frames (which never
     come on a frozen clock) and clipped captures re-render the page, so both are many times slower. The browser is
     launched at a real 2.4 device scale, so a plain capture is the full 1080 px wide frame. */
  const cdp = await ctx.newCDPSession(page);
  const capture = async () => Buffer.from((await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 92, optimizeForSpeed: true })).data, "base64");
  /* a crop of one element out of a full capture, cut in the page with a canvas */
  const grab = async sel => page.evaluate(([src, s]) => R.crop(src, s), ["data:image/jpeg;base64," + (await capture()).toString("base64"), sel]);
  let fi = 0, T = 0, vclock = 0;
  const shot = async () => {
    fs.writeFileSync(path.join(tmp, String(fi).padStart(5, "0") + ".jpg"), await capture());
    fi++; T = fi / fps;
  };
  /* virtual time for the site: whole milliseconds, no drift */
  const advance = async () => { const next = Math.round((fi + 1) * dt); const d = Math.max(1, next - vclock); vclock += d; await page.clock.runFor(d); return d; };

  async function loadSite(url) {
    await page.evaluate(src => { const f = document.getElementById("site"); f.src = src; }, base + url);
    /* wait for the new document itself (the old one can still answer for a moment after the switch) */
    const t0 = Date.now(); let ready = false;
    while (!ready && Date.now() - t0 < 30000) {
      ready = await page.evaluate(u => { try { const w = document.getElementById("site").contentWindow; return w.location.href === u && w.document.readyState === "complete" && !!w.document.body; } catch (e) { return false; } }, base + url);
      if (!ready) await sleep(150);
    }
    if (!ready) log("  (load timeout on " + url + ", continuing)");
    await Promise.race([page.evaluate(() => R.loadImages()), sleep(9000)]);
    /* warm-up: let scripts start, scenes fetch their models and textures (about 0.5 s of page time) */
    const m0 = await page.evaluate(() => R.measure());
    const steps = m0.canvas ? 30 : 10;
    for (let i = 0; i < steps; i++) { await page.clock.runFor(16); vclock += 16; await sleep(m0.canvas ? 120 : 40); }
    await page.evaluate(() => R.scroll(0));
    const m = await page.evaluate(() => R.measure());
    /* a broken page should never go out in a reel: flag leftover merge-conflict lines and failed images */
    const qa = await page.evaluate(() => {
      const d = document.getElementById("site").contentWindow.document, txt = d.body ? d.body.innerText : "";
      return { conflict: /^(<{7}|>{7}) /m.test(txt), broken: Array.prototype.filter.call(d.images, i => i.complete && !i.naturalWidth && i.src && !/^data:/.test(i.src)).map(i => i.src).slice(0, 3) };
    });
    if (qa.conflict) warnings.push(url + ": the page shows git merge-conflict markers");
    if (qa.broken.length) warnings.push(url + ": images failed to load: " + qa.broken.join(", "));
    log("  " + url + "  page " + Math.round(m.max + m.vh) + "px, " + m.tops.length + " sections" + (m.canvas ? ", 3D canvas" : "") + (m.coarse ? ", phone mode" : ""));
    return m;
  }

  /* 1. intro (first site loads underneath, frozen) */
  let m = await loadSite(shop.plans[0].url);
  const introFrames = Math.round(INTRO * fps);
  for (let i = 0; i < introFrames; i++) { await page.evaluate(s => R.frame(s), { scene: "intro", t: i / fps, dur: INTRO, T }); await shot(); }

  /* 2. each version */
  const heroes = [];
  for (let s = 0; s < n; s++) {
    if (s > 0) {
      const prev = await grab("#vp");
      await page.evaluate(src => R.setShot(src), prev);
      m = await loadSite(shop.plans[s].url);
    }
    /* A 3D hero gets a longer look, and if its scene has a control on screen (Raise the lift, Trim a branch,
       a paint swatch) the reel taps it so the owner sees the scene move. */
    const tap = opt.quick ? null : await page.evaluate(() => R.tapInfo());
    const t0 = s === 0 ? 1.3 : 1.1;
    if (tap) { tap.t0 = t0; log("    taps \"" + tap.label + "\""); }
    const start = tap ? t0 + 1.5 : m.canvas && /1250|immersive/i.test(shop.plans[s].key + shop.plans[s].url) ? 2.0 : s === 0 ? 1.25 : 1.05;
    const scrollAt = planScroll(m, SEG, opt.quick ? (s === 0 ? 1.25 : 1.05) : start);
    const frames = Math.round(SEG * fps);
    let clicked = false;
    await page.evaluate(() => R.seek(0, true));
    for (let i = 0; i < frames; i++) {
      const t = i / fps;
      await page.evaluate(y => R.scroll(y), scrollAt(t));
      if (tap && !clicked && t >= t0 + 0.4) { clicked = await page.evaluate(() => R.tapClick()); }
      const d = await advance();
      await page.evaluate(([s2, dd]) => { R.seek(dd, false); return R.frame(s2); }, [{ scene: "site", seg: s, segT: t, segDur: SEG, T, tap }, d]);
      await shot();
      if (i === Math.round((opt.quick ? 1.0 : 1.15) * fps)) heroes.push({ src: await grab("#site"), label: shop.plans[s].label, price: shop.plans[s].price });
    }
  }

  /* 3. outro: the three heroes come back as a fan of phones */
  await page.evaluate(h => R.heroShots(h), heroes);
  const outFrames = Math.round(OUTRO * fps);
  for (let i = 0; i < outFrames; i++) { await page.evaluate(s => R.frame(s), { scene: "outro", t: i / fps, dur: OUTRO, T }); await shot(); }

  /* 4. cover, 1080x1080 */
  fs.mkdirSync(opt.out, { recursive: true });
  const coverPath = path.join(opt.out, slug + "-cover.jpg");
  await page.setViewportSize({ width: W, height: W });
  await page.evaluate(c => { R.setup(c); return R.coverShots(c.heroes); }, {
    name: shop.name, short: shop.short, trade: shop.trade || "", town: shop.town || "", acc: shop.acc, deep: shop.deep, cover: true, heroes,
    plans: shop.plans.map(p => ({ key: p.key, label: p.label, price: p.price, line: p.line })), urlHost: u, urlQuery: q
  });
  await page.evaluate(() => R.frame({ scene: "cover", T: 2.2 }));
  const rawCover = path.join(tmp, "cover-raw.jpg");
  fs.writeFileSync(rawCover, Buffer.from((await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 95 })).data, "base64"));
  execFileSync("ffmpeg", ["-y", "-i", rawCover, "-vf", "crop=1080:1080:0:0", "-q:v", "2", coverPath], { stdio: "ignore" });
  await ctx.close();

  /* 5. encode: two-pass, bitrate sized to the length so the file stays under the budget */
  const dur = fi / fps, kbps = Math.floor((VIDEO_BUDGET_MB * 8192) / dur) - 40;
  const mp4 = path.join(opt.out, slug + ".mp4");
  const common = ["-y", "-framerate", String(fps), "-i", path.join(tmp, "%05d.jpg"), "-vf", "crop=1080:1920:0:0", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-level", "4.2",
    "-pix_fmt", "yuv420p", "-b:v", kbps + "k", "-maxrate", Math.round(kbps * 1.9) + "k", "-bufsize", Math.round(kbps * 3) + "k", "-g", String(fps * 2), "-an",
    "-passlogfile", path.join(tmp, "x264")];
  execFileSync("ffmpeg", [...common, "-pass", "1", "-f", "mp4", "/dev/null"], { stdio: "ignore" });
  execFileSync("ffmpeg", [...common, "-pass", "2", "-movflags", "+faststart", mp4], { stdio: "ignore" });
  /* a tall poster for players (the first version on screen) */
  const poster = path.join(opt.out, slug + "-poster.jpg");
  execFileSync("ffmpeg", ["-y", "-ss", String(INTRO + 1.3), "-i", mp4, "-frames:v", "1", "-q:v", "4", "-vf", "scale=540:960", poster], { stdio: "ignore" });
  if (!opt.keep) fs.rmSync(tmp, { recursive: true, force: true }); else log("  frames kept in " + tmp);

  if (opt.repoCopy) {
    const rd = path.join(ROOT, "reels"); fs.mkdirSync(rd, { recursive: true });
    for (const f of [mp4, coverPath, poster]) fs.copyFileSync(f, path.join(rd, path.basename(f)));
  }
  const size = fs.statSync(mp4).size;
  const res = { slug, name: shop.name, trade: shop.trade || "", town: shop.town || "", plans: shop.plans.map(p => p.label + " " + p.price),
    seconds: +dur.toFixed(2), mb: +(size / 1048576).toFixed(2), mp4, cover: coverPath, poster, pageErrors: errs.slice(0, 5), warnings, took: Math.round((Date.now() - t0) / 1000) + "s" };
  log(slug + ": " + res.seconds + " s, " + res.mb + " MB, " + res.took);
  warnings.forEach(w => log("  WARNING " + w + " (fix the page and run this reel again)"));
  return res;
}

(async () => {
  ensureMirror();
  const { srv, base } = await startServer();
  const browser = await pw.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args.filter(a => a !== "--single-process"), "--autoplay-policy=no-user-gesture-required", "--force-device-scale-factor=" + DSF], headless: true });
  const results = [];
  try {
    for (const s of slugs) {
      try { results.push(await makeReel(browser, base, s)); }
      catch (e) { console.error(e); results.push({ slug: s, error: String(e.message || e) }); }
    }
  } finally { await browser.close(); srv.kill(); }
  /* keep a manifest next to the videos so the reels page and HQ can list them */
  fs.mkdirSync(opt.out, { recursive: true });
  const mf = path.join(opt.out, "reels.json");
  let all = []; try { all = JSON.parse(fs.readFileSync(mf, "utf8")); } catch (e) { /* new */ }
  for (const r of results.filter(r => !r.error)) {
    const row = { slug: r.slug, name: r.name, trade: r.trade, town: r.town, plans: r.plans, seconds: r.seconds, mb: r.mb, made: new Date().toISOString().slice(0, 10) };
    all = all.filter(x => x.slug !== r.slug).concat(row);
  }
  all.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(mf, JSON.stringify(all, null, 1));
  if (opt.repoCopy) fs.writeFileSync(path.join(ROOT, "reels", "reels.json"), JSON.stringify(all, null, 1));
  console.log(JSON.stringify(results, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
