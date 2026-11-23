// Color stills for the hand-built $300 heroes, from the same cameras as dumps/*.json.
//   node _build/handbuilt/color.cjs OUTDIR     (needs `python3 -m http.server 8811` at the repo root)
// Writes OUTDIR/station-{night,day,mask}.png (2x) and OUTDIR/truck.png + truck-mask.png; sheets.py --img OUTDIR turns them into WebP cut-outs.
const { chromium } = require("playwright"); const fs = require("fs");
const out = process.argv[2]; fs.mkdirSync(out, {recursive: true});
const save = (name, url) => fs.writeFileSync(`${out}/${name}.png`, Buffer.from(url.split(",")[1], "base64"));
(async () => { const b = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
  const go = async (url, w, h) => { const p = await b.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1}); p.on("pageerror", e => console.log("ERR", String(e)));
    await p.goto("http://localhost:8811/_build/handbuilt/" + url, {timeout: 120000}); await p.waitForFunction(() => window.__done, null, {timeout: 900000, polling: 1000}); return p; };
  if (process.argv[3] !== "truck") { const p = await go("labstation.html?cam=-14,5.2,36&tgt=3.2,2.3,-3&fov=21&color=1", 2000, 1100);
    const d = await p.evaluate(() => window.__png); for (const k of ["night", "day", "mask"]) save("station-" + k, d[k]); await p.close(); console.log("station"); }
  if (process.argv[3] !== "station") { const p = await go("labcar.html?kind=body&tod=.3&cam=23.2,1.25,26.8&tgt=-1.2,.98,9.4&fov=11&pos=1&fix=1&second=0&door=0&lights=0&color=red", 2400, 800);
    await p.screenshot({path: `${out}/truck.png`, timeout: 240000}); save("truck-mask", await p.evaluate(() => window.__mask)); await p.close(); console.log("truck"); }
  await b.close(); })();
