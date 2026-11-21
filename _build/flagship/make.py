#!/usr/bin/env python3
"""Build the flagship sample sites for the Nov 20 2026 lead deal (50 lawn, painting and tree crews).

  python3 _build/flagship/make.py [--only slug,slug] [--img RENDER_DIR]

Writes, per shop in _build/flagship/shops.json (same paths as the older tier samples, so links keep working):
  p/2e8e4a/<slug>/index.html       Starter ($300): the drawn sheet hero, services, how it works, Google proof, text + quote.
  p/2e8e4a/<slug>/750/index.html   Signature ($750): before/after hero, visit stages, a trade tool, a live request ticket.
  p/2e8e4a/<slug>/1250/index.html  Immersive ($1,250): a live 3D yard (Harlow engine + f/assets/yard.js) told by scroll.
The $300 page also carries the nds-shop JSON the pitch room (meet/) reads.
--img converts render PNGs (from render.cjs) into f/img/<trade>/ WebPs first.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kit  # noqa: E402
from kit import E, V, STEPS, BASE, SITE, VER, COPY, THEME, TRADE  # noqa: E402

ROOT = kit.ROOT
GROUP_IMG = {"lawn": "lawn", "tree": "tree", "painting": "paint", "auto": "auto", "body": "body"}
GROUP_IMG.update({g: g for g in kit.STORES})


def img(g, name, w):
    return f"/f/img/{GROUP_IMG[g]}/{name}-{w}.webp"


def convert(src):
    from PIL import Image
    sizes = {2400: (2400, 1200), 1600: (1600, 800), 1200: (1200, 800)}
    for fn in sorted(os.listdir(src)):
        if not fn.endswith(".png"):
            continue
        name = fn[:-4]; trade = name.split("-")[0]
        out = os.path.join(ROOT, "f/img", trade); os.makedirs(out, exist_ok=True)
        im = Image.open(os.path.join(src, fn)).convert("RGB")
        for w in sizes[im.width]:
            r = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            r.save(os.path.join(out, f"{name}-{w}.webp"), "WEBP", quality=80 if w >= 1600 else 82, method=6)
        print("img", name)


def base_vals(s, tier):
    g = s["group"]; v = V[s["v"]]; t = THEME[g]
    return {
        "NAME": E(s["name"]), "SHORT": E(s["short"]), "SHORT_POSS": E(kit.poss(s["short"])), "TOWN": E(s["town"]), "ST": kit.st(s), "STATE": kit.state(s),
        "TRADE": TRADE[s["v"]], "PHONE": s["phone"], "TEL": s["tel"], "MAPS": E(s.get("maps") or f"https://www.google.com/maps/search/{s['name']} {s['town']} {kit.st(s)}"),
        "THEME": kit.theme_vars(g), "EXTRA_CSS": kit.EXTRA_CSS[g], "PAPER": t["paper"], "FONTS": t["fonts"], "FAVICON": kit.favicon(g), "VER": VER,
        "LOGO": kit.logo(g), "BAR": kit.bar(s, tier), "LDJSON": kit.ldjson(s), "CFG": kit.cfg(s, tier),
        "OG": f"{SITE}{BASE}{s['slug']}/shots/v{tier}.jpg",
        "DESC": E(v["lede"].replace("{town}", s["town"]) + f" Call or text {s['phone']}."),
        "ASK": E(v["ask"]), "JOB_OPTS": "".join(f"<option>{E(j)}</option>" for j in v["jobs"]),
        "TOWNS": "".join(f"<span>{E(x)}</span>" for x in kit.towns(s)),
        "SMS_CHIPS": "".join(f'<button type="button" aria-pressed="false">{E(j)}</button>' for j in v["jobs"] if j != "Something else"),
        "MSG_PH": COPY[g]["msg_ph"], "QUOTE_H": COPY[g]["quote_h"], "CTA": COPY[g]["cta"],
        "BODYCLS": ' class="longname"' if len(s["short"]) > 24 else "",
        "COUNT": kit.count_script(s["slug"] if tier == 300 else f"t{tier}-{s['slug']}"),
    }


def facts(s):
    ck = kit.IC["CHECK"]; tw = kit.towns(s)
    out = [f"{s['town']} and {len(tw) - 1} nearby towns" if len(tw) > 2 else f"Based in {s['town']}, {kit.state(s)}",
           f"Call or text {s['phone']}",
           f"Rated {kit.rnum(s)} on Google" if kit.rating_ok(s) else "Find us on Google Maps",
           "Quote request in about a minute"]
    return "".join(f"<li>{ck}{E(x)}</li>" for x in out)


def rows(s):
    v = V[s["v"]]; out = []
    jobs = v["jobs"]
    for i, (h, p) in enumerate(v["services"]):
        job = jobs[i] if i < len(jobs) - 1 else jobs[0]
        out.append(f'<div class="row rv">{kit._I.format(kit.SVC_ICON.get(h, kit.SVC_ICON["_more"]))}<div><h3>{E(h)}</h3></div><p>{E(p)}</p>'
                   f'<a class="btn line ask" href="#quote" data-job="{E(job)}">Ask about this {kit.IC["ARROW"]}</a></div>')
    out.append(f'<div class="row rv">{kit._I.format(kit.SVC_ICON["_more"])}<div><h3>Something else?</h3></div><p>Ask anyway. If it isn\'t a fit, {E(s["short"])} will tell you straight.</p>'
               f'<a class="btn line ask" href="#quote" data-job="Something else">Ask about it {kit.IC["ARROW"]}</a></div>')
    return "".join(out)


def rate_card(s):
    g = s["group"]
    tw = "".join(f"<span>{E(x)}</span>" for x in kit.towns(s))
    if kit.rating_ok(s):
        n = s["reviews"]
        top = (f'<div><div class="big"><span class="num" data-count="{kit.rnum(s)}">{kit.rnum(s)}</span><div><div class="stars" aria-hidden="true">{kit.IC["STARS"]}</div>'
               f'<p>on Google, from {n} review{"s" if n != 1 else ""}</p></div></div></div>')
    else:
        top = f'<div><p style="font:500 26px/1.2 var(--serif);color:var(--ink)">On Google Maps in {E(s["town"])}.</p><p style="margin-top:8px">The listing link, your number and your area, all one tap away.</p></div>'
    return (f'<div class="rate rv">{top}<div><p style="margin-bottom:10px">Works in</p><div class="towns">{tw}</div></div>'
            f'<a class="btn line gm" href="{E(s.get("maps") or "")}" target="_blank" rel="noopener">{kit.IC["PIN"]}See it on Google Maps</a></div>')


def page300(s, meet):
    g = s["group"]; v = V[s["v"]]; c = COPY[g]
    h = [x.replace("{town}", s["town"]) for x in v["h300"]]
    shot = c["shot"][0]
    vals = base_vals(s, 300)
    vals.update({
        "SHOPJSON": f'<script type="application/json" id="nds-shop">{meet}</script>',
        "H1A": E(h[0]), "H1B": E(h[1]), "LEDE": E(v["lede"].replace("{town}", s["town"])),
        "FACTS": facts(s), "ELEV": kit.elevation(g, s), "SHEET_LABEL": c["sheet_label"],
        "SHEET_JOB": E(c["sheet"][0].replace("{town}", s["town"])), "SHEET_DRAW": c["sheet"][1],
        "SVC_H": c["svc_h"], "SVC_INTRO": c["svc_intro"], "ROWS": rows(s),
        "STEPS": "".join(f"<li><h3>{E(a)}</h3><p>{E(b)}</p></li>" for a, b in STEPS[g]),
        "AROUND_INTRO": E(f"{s['short']} works in {s['town']} and the towns around it." + (" Here's what people say on Google." if kit.rating_ok(s) else "")),
        "RATE": rate_card(s), "SHOT": img(g, shot, 1200), "SHOT_SET": f"{img(g, shot, 1200)} 1200w, {img(g, shot, 2400)} 2400w",
        "SHOT_ALT": c["shot"][1], "SHOT_CAP": c["shot"][2],
    })
    src = open(os.path.join(HERE, "t300.src.html")).read()
    if g in kit.SHOPS:
        src = src.replace(">Crew<", ">Shop<")
    return kit.fill(src, vals)


def main():
    a = sys.argv[1:]
    if "--img" in a:
        convert(a[a.index("--img") + 1])
    shops = kit.load_shops()
    if "--only" in a:
        keep = set(a[a.index("--only") + 1].split(","))
        shops = [s for s in shops if s["slug"] in keep]
    import meetdata
    for s in shops:
        s["group"] = kit.group_of(s["v"])
        d = os.path.join(ROOT, "p/2e8e4a", s["slug"])
        os.makedirs(os.path.join(d, "750"), exist_ok=True); os.makedirs(os.path.join(d, "1250"), exist_ok=True)
        meet = meetdata.meet(s)
        open(os.path.join(d, "index.html"), "w").write(page300(s, meet))
        import room
        os.makedirs(os.path.join(d, "room"), exist_ok=True)
        open(os.path.join(d, "room", "index.html"), "w").write(room.page(s, meet))
        if True:
            import tiers2
            open(os.path.join(d, "750", "index.html"), "w").write(tiers2.page750(s))
            open(os.path.join(d, "1250", "index.html"), "w").write(tiers2.page1250(s))
    print(f"built {len(shops)} shops")


if __name__ == "__main__":
    main()
