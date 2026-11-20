// QA gate for the flagship samples: every page at phone and desktop width, zero console errors / failed requests,
// no sideways scroll, no unfilled placeholders, every in-page link target exists.
//   python3 -m http.server 8811 &  node _build/flagship/qa.cjs [slug,slug]
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
(async () => {
  const only = process.argv[2] ? process.argv[2].split(",") : null;
  const slugs = JSON.parse(fs.readFileSync(path.join(__dirname, "shops.json"), "utf8")).map(s => s.slug).filter(s => !only || only.includes(s));
  const b = await chromium.launch();
  let bad = 0, n = 0;
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage(); let errs = [];
    p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    p.on("pageerror", e => errs.push("pageerror " + e.message));
    p.on("response", r => { if (r.status() >= 400 && !/abacus/.test(r.url())) errs.push(r.status() + " " + r.url()); });
    for (const slug of slugs) for (const sub of ["", "750/", "1250/?still=1", "room/"]) {
      errs = []; n++;
      const url = `http://localhost:8811/p/2e8e4a/${slug}/${sub}${sub.includes("?") ? "&" : "?"}x=1#nc`;
      await p.goto(url, { waitUntil: "networkidle" }).catch(e => errs.push("goto " + e.message));
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } });
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth, iw: innerWidth,
        ph: (document.documentElement.outerHTML.match(/{{[A-Z_0-9]+}}/g) || []).length,
        anchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute("href")).filter(hh => hh.length > 1 && !document.getElementById(hh.slice(1))),
      }));
      const prob = [...errs];
      if (r.sw > r.iw + 1) prob.push(`sideways scroll ${r.sw}>${r.iw}`);
      if (r.ph) prob.push(`${r.ph} placeholders`);
      if (r.anchors.length) prob.push("dead anchors " + r.anchors.join(","));
      if (prob.length) { bad++; console.log(`${w} ${slug}/${sub}: ${prob.slice(0, 5).join(" | ")}`); }
    }
    await ctx.close();
  }
  console.log(`checked ${n} page views, ${bad} with problems`);
  await b.close();
})();
