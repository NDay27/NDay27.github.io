// Pitch-room thumbnails for the tier samples: p/2e8e4a/<slug>/shots/v300.jpg, v750.jpg, v1250.jpg (640x400).
// Needs a local server on the repo root:  python3 -m http.server 8811  then  node _build/tiers/thumbs.cjs [slug,slug]
const {chromium} = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const shops = JSON.parse(fs.readFileSync(path.join(__dirname, "shops.json")));
const only = process.argv[2] && !process.argv[2].startsWith("--") ? new Set(process.argv[2].split(",")) : null;
const jobs = [];
const redo = process.argv.includes("--redo");
for (const s of shops) if (!only || only.has(s.slug)) for (const [t, sub] of [[300, ""], [750, "750/"], [1250, "1250/"]])
  if (redo || !fs.existsSync(path.join(ROOT, "p/2e8e4a", s.slug, "shots", `v${t}.jpg`))) jobs.push([s.slug, t, sub]);
(async () => {
  const b = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]});
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, deviceScaleFactor: .5});
  let i = 0, done = 0;
  async function worker() {
    const p = await ctx.newPage();
    while (i < jobs.length) {
      const [slug, t, sub] = jobs[i++];
      const dir = path.join(ROOT, "p/2e8e4a", slug, "shots"); fs.mkdirSync(dir, {recursive: true});
      try {
        await p.goto(`http://localhost:8811/p/2e8e4a/${slug}/${sub}#nc`, {waitUntil: "load", timeout: 30000});
        await p.evaluate(() => document.querySelectorAll(".rv").forEach(e => e.classList.add("in")));
        await p.waitForTimeout(t === 1250 ? 3500 : 700);
        await p.screenshot({path: path.join(dir, `v${t}.jpg`), type: "jpeg", quality: 72});
      } catch (e) { console.log("fail", slug, t, e.message); }
      if (++done % 30 === 0) console.log(new Date().toISOString().slice(11, 19), done, "/", jobs.length);
    }
    await p.close();
  }
  await Promise.all(Array.from({length: 6}, worker));
  await b.close(); console.log("thumbs done", done);
})();
