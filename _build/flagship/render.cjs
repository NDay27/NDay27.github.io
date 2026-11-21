// Render stills from lab.html: node _build/flagship/render.cjs renders.json outDir [names]
// needs `python3 -m http.server 8811` at the repo root. Writes <name>.png (or <name>.json for svg dumps).
const { chromium } = require("playwright"); const fs = require("fs");
const [list, out, only] = process.argv.slice(2); const R = JSON.parse(fs.readFileSync(list, "utf8")).filter(r => !only || only.split(",").includes(r.name));
fs.mkdirSync(out, {recursive: true});
(async () => { const b = await chromium.launch({args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]});
  for (const r of R) { const t0 = Date.now(); const p = await b.newPage({viewport: {width: r.w, height: r.h}, deviceScaleFactor: 1});
    const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await p.goto(`http://localhost:8811/_build/flagship/${r.lab || "lab"}.html?${r.q}${r.svg ? "&mode=svg" : ""}`, {timeout: 120000});
    try { await p.waitForFunction(() => window.__done, null, {timeout: 400000, polling: 1000}); } catch (e) { errs.push("timeout"); }
    if (r.svg) fs.writeFileSync(`${out}/${r.name}.json`, JSON.stringify(await p.evaluate(() => window.__svg)));
    else await p.screenshot({path: `${out}/${r.name}.png`});
    console.log(r.name, ((Date.now() - t0) / 1000).toFixed(0) + "s", errs.slice(0, 3).join(" | ")); await p.close(); }
  await b.close(); })();
