# Sample-site tiers (Nov 19 2026)

Three sample sites per lead, generated from each shop's public Google Maps facts, so every pitch room
(`/meet/?s=<slug>`) shows the plan bar ($300 / $750 / $1,250) on that shop's own site.

| Path | Plan | What makes it different |
|---|---|---|
| `p/2e8e4a/<slug>/` | Starter $300 | Animated illustrated hero per trade (`ill.py`) with floating Google facts, clean light page, tap-to-call bar, "text instead" button that writes the text, Google rating, map link, request form. Also the preview meet/ reads (nds-shop JSON). |
| `p/2e8e4a/<slug>/750/` | Signature $750 | Dark art-directed look per trade, a live hero effect per trade (sparks, leaves, grass, paint, bubbles, sprinkles), word-by-word headline, line-art service cards that draw in, marquee, Lenis smooth scroll, reading bar, rating count-up, a trade motion piece (dash light checker, storm check, season planner, room recolor, room picker, order builder), request planner with a live ticket. |
| `p/2e8e4a/<slug>/1250/` | Immersive $1,250 | Signature plus a full-screen 3D hero per trade on `assets/tiers/world.js` (the Studio demo's engine: physical sky, clouds, CC0 HDRI light, PBR textures, wind grass, bloom + film grade, day / golden / night): shop with a lift and bay doors, a tree you trim in a storm, a lawn that really gets mown in stripes, a drive you plow, a house you repaint with a wet edge, a sunlit room a robot cleans, a storefront and a treat you stack. |

Files: `shops.json` (facts: name, town, phone, address, rating, reviews, Google category, listing link, nearby towns, HQ score),
`tiercopy.py` (trade copy, only things true of every shop in a Google category), `build.py` (writes the pages and the
pitch room JSON), `thumbs.cjs` (pitch room thumbnails), shared look and behavior in `assets/tiers/` (`t.css`, `t.js`, `world.js` engine, `scene.js` trade scenes).

Quality bar (Nolan, Nov 19): every tier must clearly beat the matching Studio demo in `demos/`. Screenshot both at 390px and 1280px before shipping.

Run from the repo root: `python3 _build/tiers/build.py [--only slug,slug]`, then with `python3 -m http.server 8811`
running, `node _build/tiers/thumbs.cjs [slug,slug] [--redo]` (skips shots that exist unless `--redo`).

Rules: no hours, prices, years, licenses or review quotes unless a shop's listing shows them; samples never send anything
(forms and text buttons say what the live site will do); free paths only, no domains.
Shops with hand-built samples (Just Dents, Brecklin's) are not in `shops.json` and must stay out of it.
