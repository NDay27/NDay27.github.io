# Sample-site tiers (Nov 19 2026)

Three sample sites per lead, generated from each shop's public Google Maps facts, so every pitch room
(`/meet/?s=<slug>`) shows the plan bar ($300 / $750 / $1,250) on that shop's own site.

| Path | Plan | What makes it different |
|---|---|---|
| `p/2e8e4a/<slug>/` | Starter $300 | Clean light page, tap-to-call bar, "text instead" button that writes the text, Google rating, map link, request form. Also the preview meet/ reads (nds-shop JSON). |
| `p/2e8e4a/<slug>/750/` | Signature $750 | Dark art-directed look per trade, rating count-up, a trade motion piece (dash light checker, storm check, season planner, room recolor, room picker, order builder), request planner with a live ticket. |
| `p/2e8e4a/<slug>/1250/` | Immersive $1,250 | Signature plus a real-time 3D scene per trade (car on a lift, tree you trim, yard you mow or plow, house you repaint, room you clean, treat you stack) with day and night. |

Files: `shops.json` (facts: name, town, phone, address, rating, reviews, Google category, listing link, nearby towns, HQ score),
`tiercopy.py` (trade copy, only things true of every shop in a Google category), `build.py` (writes the pages and the
pitch room JSON), `thumbs.cjs` (pitch room thumbnails), shared look and behavior in `assets/tiers/` (`t.css`, `t.js`, `scene.js`).

Run from the repo root: `python3 _build/tiers/build.py [--only slug,slug]`, then with `python3 -m http.server 8811`
running, `node _build/tiers/thumbs.cjs [slug,slug] [--redo]` (skips shots that exist unless `--redo`).

Rules: no hours, prices, years, licenses or review quotes unless a shop's listing shows them; samples never send anything
(forms and text buttons say what the live site will do); free paths only, no domains.
Shops with hand-built samples (Just Dents, Brecklin's) are not in `shops.json` and must stay out of it.
