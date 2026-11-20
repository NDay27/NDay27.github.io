// Thumbnails for the pitch room and the deck: p/2e8e4a/<slug>/shots/v{300,750,1250}.jpg (1280x800) and mv*.jpg (390x844).
// Needs a static server at the repo root:  python3 -m http.server 8811 &  node _build/flagship/shots.cjs [slug,slug]
// The $1,250 shot uses the rendered still (?still=1) so it is fast and identical to the 3D opening frame.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
(async () => {
  const only = process.argv[2] ? process.argv[2].split(",") : null;
  const slugs = JSON.parse(fs.readFileSync(path.join(__dirname, "shops.json"), "utf8")).map(s => s.slug).filter(s => !only || only.includes(s));
  const b = await chromium.launch();
  const views = [["", 1280, 800], ["m", 390, 844]];
  for (const [pre, w, h] of views) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    for (const slug of slugs) {
      const out = path.join(ROOT, "p/2e8e4a", slug, "shots"); fs.mkdirSync(out, { recursive: true });
      for (const [t, sub] of [[300, ""], [750, "750/"], [1250, "1250/?still=1"]]) {
        await p.goto(`http://localhost:8811/p/2e8e4a/${slug}/${sub}${sub.includes("?") ? "&" : "?"}embed=1#nc`.replace("/?embed", "/?embed").replace("??", "?"), { waitUntil: "load" });
        await p.waitForTimeout(700);
        await p.screenshot({ path: path.join(out, `${pre}v${t}.jpg`), type: "jpeg", quality: 74 });
      }
      process.stdout.write(pre + slug + " ");
    }
    await ctx.close();
  }
  await b.close();
})();
