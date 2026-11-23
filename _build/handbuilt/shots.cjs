// Thumbnails and cover stills for the hand-built samples' decks and pitch rooms.
//   node _build/handbuilt/shots.cjs            (needs `python3 -m http.server 8811` at the repo root)
// Writes p/2e8e4a/<slug>/shots/v{300,750,1250}.jpg (1280x800), mv*.jpg (390x844) and cover.png (the $1,250 3D canvas alone).
const { chromium } = require("playwright"); const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const SHOPS = [["justdents", "just-dents-of-illinois-inc-morton"], ["brecklins", "brecklin-s-servicenter-washington"]];
const only = process.argv[2];
(async () => {
  const b = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
  for (const [shop, slug] of SHOPS) { const out = path.join(ROOT, "p/2e8e4a", slug, "shots"); fs.mkdirSync(out, {recursive: true});
    if (only !== "cover") for (const [pre, w, h] of [["", 1280, 800], ["m", 390, 844]]) for (const t of [300, 750, 1250]) {
      const p = await b.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1});
      await p.goto(`http://localhost:8811/${shop}${t}/`, {waitUntil: "load"}); await p.addStyleTag({content: ".sbar{display:none!important}"});
      await p.waitForTimeout(t === 1250 ? 16000 : 5000);
      await p.screenshot({path: path.join(out, `${pre}v${t}.jpg`), type: "jpeg", quality: 76, timeout: 240000}); await p.close(); process.stdout.write(`${pre}v${t} `); }
    if (!only || only === "cover") { const p = await b.newPage({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1});
      await p.goto(`http://localhost:8811/${shop}1250/`, {waitUntil: "load"});
      await p.addStyleTag({content: "body *{visibility:hidden!important}#c{visibility:visible!important}.sbar{display:none!important}"});
      await p.waitForTimeout(20000); await p.locator("#c").screenshot({path: path.join(out, "cover.png"), timeout: 240000}); await p.close(); process.stdout.write("cover "); }
    console.log(slug); }
  await b.close(); })();
