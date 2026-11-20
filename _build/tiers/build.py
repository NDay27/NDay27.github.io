#!/usr/bin/env python3
"""Build three sample sites for every Google-checked no-website shop (Nov 18 2026 list).

  python3 _build/tiers/build.py [--only slug,slug] [--limit N]

For each shop in _build/tiers/shops.json (facts from its public Google Maps listing, checked 2026-11-18/19):
  p/2e8e4a/<slug>/index.html       Starter ($300). Also the preview the pitch room (meet/) reads, so it
                                   carries the nds-shop JSON: samples, versions, compare, tour, tools, why.
  p/2e8e4a/<slug>/750/index.html   Signature ($750): art-directed, a motion piece and a live request ticket.
  p/2e8e4a/<slug>/1250/index.html  Immersive ($1,250): Signature plus a real-time 3D scene (assets/tiers/scene.js).
Shared look and behavior live in assets/tiers/ (t.css, t.js, scene.js), so a fix there lifts every shop.
Facts used: name, town, phone, address, Google rating and review count, Google category, listing link,
nearby towns. Nothing else is claimed: no hours, prices, years, licenses or review quotes.
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tiercopy import V, STEPS, LOOK, STARTER, TOOLS  # noqa: E402
import ill  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = "/p/2e8e4a/"
SITE = "https://nday27.github.io"
VER = "20261120"
E = html.escape
import tiercopy_mix as _mx  # noqa: E402  (mixed business types)

TRADE_LABEL = {"auto": "Auto Repair", "truck": "Auto Repair", "transmission": "Auto Repair", "radiator": "Auto Repair",
  "muffler": "Auto Repair", "brake": "Auto Repair", "autobody": "Auto Body", "autoglass": "Auto Glass", "tree": "Tree Service",
  "lawn": "Lawn & Landscaping", "landscape": "Lawn & Landscaping", "snow": "Lawn & Landscaping", "painter": "Painting",
  "houseclean": "House Cleaning", "janitorial": "House Cleaning", "bakery": "Ice Cream & Treats", "cake": "Ice Cream & Treats",
  "icecream": "Ice Cream & Treats", "candy": "Ice Cream & Treats", "donut": "Ice Cream & Treats"}

ICON = {
 "phone": '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
 "pin": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
 "star": '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
 "msg": '<path d="M4 5h16v11H8l-4 4z"/>',
 "check": '<path d="M5 12l5 5L20 7"/>',
 "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "tag": '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
}


STATE_NAME = {"IL": "Illinois", "MO": "Missouri", "IN": "Indiana", "KY": "Kentucky", "OH": "Ohio", "MI": "Michigan", "WI": "Wisconsin",
              "MN": "Minnesota", "IA": "Iowa", "KS": "Kansas", "NE": "Nebraska", "OK": "Oklahoma", "TX": "Texas", "AR": "Arkansas",
              "LA": "Louisiana", "MS": "Mississippi", "AL": "Alabama", "TN": "Tennessee", "GA": "Georgia", "SC": "South Carolina",
              "NC": "North Carolina", "VA": "Virginia", "PA": "Pennsylvania"}


def ST(shop):
    """The shop's two-letter state: shops.json carries `st` for leads outside Illinois."""
    return shop.get("st") or "IL"


def ic(name, size=18):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[name]}</svg>')


def short_name(n):
    s = re.sub(r"\s*\(.*?\)\s*", " ", n).strip()
    if re.search(r"\bdba\b", s, flags=re.I):
        s = re.split(r"\bdba\b", s, flags=re.I)[1].strip()
    s = re.split(r"\s+-\s*|\s*-\s+", s)[0]
    s = re.sub(r"[,.\s]+(LLC|L\.L\.C|Inc|Co|Corp|Ltd)\.?$", "", s.strip(" ,"), flags=re.I).strip(" ,.-")
    s = re.sub(r"[,.\s]+(LLC|L\.L\.C|Inc|Co|Corp|Ltd)\.?$", "", s, flags=re.I).strip(" ,.-")
    if len(s) > 34:
        for sep in (" & ", " and ", ", ", "/"):
            head = s.split(sep)[0].strip(" ,/")
            if sep in s and len(head.split()) >= 2 and len(head) <= 34:
                s = head
                break
    if len(s) > 34:
        w = s.split()
        while len(" ".join(w)) > 34 and len(w) > 2:
            w.pop()
        while w and w[-1].lower().strip(",") in ("&", "and", "in", "of", "the", "for", "a"):
            w.pop()
        s = " ".join(w).strip(" ,")
    return s or n


SMALL = {"AND": "and", "OF": "of", "THE": "the", "IN": "in", "FOR": "for", "A": "A"}


def nice_name(n):
    """Shouty all-caps names read as typos on a headline; keep short caps (R&P, DJ's) as they are."""
    out = []
    for i, w in enumerate(n.split()):
        bare = re.sub(r"[^A-Za-z]", "", w)
        if bare.isupper() and len(bare) > 1 and not re.search(r"[A-Za-z]\.[A-Za-z]", w):
            if w == "THE" and not i:
                w = "The"
            elif w in SMALL and i:
                w = SMALL[w]
            elif len(bare) > 3:
                w = "-".join(x[:1] + x[1:].lower() for x in w.split("-"))
        out.append(w)
    return " ".join(out)


def tel(p):
    d = re.sub(r"\D", "", p)
    return "+1" + d[-10:]


def fmt(s, shop):
    return s.replace("{town}", shop["town"])


def rating_txt(shop):
    if shop.get("rating") and shop.get("reviews"):
        return f'{shop["rating"]:.1f}'.rstrip("0").rstrip(".") if shop["rating"] == int(shop["rating"]) else f'{shop["rating"]}'
    return ""


def street(shop):
    a = shop.get("addr") or ""
    return a.split(",")[0] if a else ""


def tools_for(shop):
    t = TOOLS[shop["group"]]
    if shop["v"] == "snow":
        t = (t[0], "Season planner for the property", "a 3D drive you can plow clear")
    return t


# ---------- shared bits ----------

def head(shop, title, desc, fonts, css_extra=""):
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><title>{E(title)}</title><meta name="description" content="{E(desc)}">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<link rel="stylesheet" href="/assets/tiers/t.css?v={VER}">{css_extra}
<script>try{{if(window.top!==window.self)document.documentElement.classList.add("framed")}}catch(e){{document.documentElement.classList.add("framed")}}</script>"""


def banner(shop, plan):
    meet = f"{SITE}/meet/?s={shop['slug']}"
    yes = f"{SITE}/yes/?s={shop['slug']}&amp;src=preview"
    return (f'<div class="tb">Sample {plan} site made for {E(shop["name"])} by Nolan Day Studio. Not the official site. '
            f'<a href="{yes}">Make it mine</a> · <a href="{meet}">See all 3 versions</a></div>')


def count_script(key):
    k = re.sub(r"[^A-Za-z0-9-]", "-", key)[:60]
    return ('<script>(function(){try{if(location.hash==="#nc")try{localStorage.setItem("nds_nc","1")}catch(e){}'
            'var s=null;try{s=localStorage.getItem("nds_nc")}catch(e){}if(navigator.webdriver||s)return;'
            f'fetch("https://abacus.jasoncameron.dev/hit/ndstudio/{k}",{{keepalive:true}}).catch(function(){{}})}}catch(e){{}}}})();</script>')


def data_json(shop, tier):
    v = V[shop["v"]]
    d = {"tier": tier, "group": shop["group"], "v": shop.get("v0", shop["v"]), "name": shop["name"], "short": shop["short"], "town": shop["town"], "st": ST(shop),
         "phone": shop["phone"], "tel": tel(shop["phone"]), "rating": shop.get("rating") or 0, "reviews": shop.get("reviews") or 0,
         "jobs": v["jobs"], "when": v["when"], "ask": v["ask"], "noun": v["noun"]}
    return '<script type="application/json" id="t-data">' + json.dumps(d, ensure_ascii=False).replace("</", "<\\/") + "</script>"


def area_block(shop, cls):
    towns = shop.get("towns") or []
    lis = "".join(f'<li{" class=me" if i == 0 else ""}>{E(t)}</li>' for i, t in enumerate(towns[:9])) if towns else f"<li class=me>{E(shop['town'])}</li>"
    where = f"at {E(shop['addr'])}" if shop.get("addr") else f"in {E(shop['town'])}"
    return f"""<section class="{cls} area" id="area"><div class="w"><p class="ey rv">Where</p><h2 class="rv">{E(shop['town'])} and the towns around it.</h2>
<p class="lead rv">Find {E(shop['short'])} {where}. Not sure you're close enough? Call and ask.</p>
<ul class="towns rv">{lis}</ul>
<a class="maplink rv" href="{E(shop['maps'])}" target="_blank" rel="noopener">{ic('pin')} <span><b>Open in Google Maps</b><small>{E(shop.get('addr') or shop['town'] + ', ' + ST(shop))}</small></span>{ic('arrow')}</a></div></section>"""


def facts_row(shop):
    out = []
    r = rating_txt(shop)
    if r:
        out.append(f'<li>{ic("star", 16)} <b>{r}</b> on Google, {shop["reviews"]} review{"s" if shop["reviews"] != 1 else ""}</li>')
    out.append(f'<li>{ic("tag", 16)} {E(shop["cat"] or TRADE_LABEL[shop["v"]])}</li>')
    out.append(f'<li>{ic("pin", 16)} {E(street(shop) or shop["town"])}{", " + E(shop["town"]) if street(shop) else ", " + ST(shop)}</li>')
    return '<ul class="facts">' + "".join(out) + "</ul>"


def form_block(shop, cls, title):
    v = V[shop["v"]]
    opts = "".join(f"<option>{E(j)}</option>" for j in v["jobs"])
    return f"""<section class="{cls}" id="contact"><div class="w two"><div class="rv"><p class="ey">Get in touch</p><h2>{E(title)}</h2>
<p class="lead">Tell {E(shop['short'])} what you need and get a call back.</p>
<a class="bigphone" href="tel:{tel(shop['phone'])}">{ic('phone', 26)} {E(shop['phone'])}</a></div>
<form class="req rv" data-req><label>Your name<input name="n" autocomplete="name" required></label><label>Phone<input name="p" type="tel" autocomplete="tel" required></label>
<label>{E(v['ask'])}<select name="s">{opts}</select></label><label>Details<textarea name="d" rows="3"></textarea></label>
<button class="btn pri" type="submit">Send request</button><p class="fine" aria-live="polite">Sample form: nothing is sent. On the live site this goes straight to {E(shop['short'])}.</p></form></div></section>"""


def hcard(shop):
    """Desktop-only card beside the hero: the facts a first-time visitor checks."""
    r = rating_txt(shop)
    stars = (f'<div class="hc-r"><b>{r}</b><span>{ic("star", 18) * 5}</span><small>{shop["reviews"]} Google review{"s" if shop["reviews"] != 1 else ""}</small></div>') if r else ""
    return (f'<aside class="hcard" aria-hidden="true"><span class="mono">{E(shop["short"][0].upper())}</span><b class="hc-n">{E(shop["short"])}</b>'
            f'<small>{E(shop["cat"] or TRADE_LABEL[shop["v"]])}</small>{stars}'
            f'<p>{ic("pin", 16)} {E(shop.get("addr") or shop["town"] + ", " + ST(shop))}</p><p>{ic("phone", 16)} {E(shop["phone"])}</p></aside>')


def ill_card(shop):
    r = rating_txt(shop)
    chips = []
    if r:
        chips.append(f'{ic("star", 15)} <b>{r}</b> <small>{shop["reviews"]} Google review{"s" if shop["reviews"] != 1 else ""}</small>')
    chips.append(f'{ic("pin", 15)} <b>{E(shop["town"])}, {ST(shop)}</b> <small>{E(shop["phone"])}</small>')
    return ill.card(shop["group"], shop["v"], shop["short"], chips)


# ---------- Starter ($300) ----------

def starter(shop, meet_json):
    v, g = V[shop["v"]], shop["group"]
    acc = STARTER[g]
    h = [fmt(x, shop) for x in v["h300"]]
    tools = tools_for(shop)
    svc = "".join(f'<article class="card rv"><span class="n">0{i + 1}</span><h3>{E(t)}</h3><p>{E(d)}</p><a href="tel:{tel(shop["phone"])}">Call for a quote {ic("arrow", 14)}</a></article>'
                  for i, (t, d) in enumerate(v["services"]))
    steps = "".join(f'<li class="rv"><b>{E(t)}</b><span>{E(d)}</span></li>' for t, d in STEPS[g])
    chips = "".join(f'<button type="button" class="chip" aria-pressed="false">{E(j)}</button>' for j in v["jobs"][:5])
    return head(shop, f"{shop['name']} · {shop['town']}, {ST(shop)}", f"{TRADE_LABEL[shop['v']]} in {shop['town']}, {ST(shop)}. Sample website by Nolan Day Studio.",
                "family=Archivo:wght@500;800;900&family=Inter:wght@400;500;600;700",
                f'<style>:root{{--acc:{acc}}}</style>') + \
        f'<script type="application/json" id="nds-shop">{meet_json}</script>' + data_json(shop, 300) + f"""</head>
<body class="t300 g-{g}">{banner(shop, 'Starter')}
<header class="hd"><div class="w"><a class="brand" href="#top">{E(shop['short'])}</a><a class="btn pri sm" href="tel:{tel(shop['phone'])}">{ic('phone', 16)} {E(shop['phone'])}</a></div></header>
<main id="top"><section class="hero"><div class="w hgrid"><div><p class="addr">{E(shop.get('addr') or shop['town'] + ', ' + STATE_NAME.get(ST(shop), ST(shop)))}</p>
<h1>{E(h[0])} <em>{E(h[1])}</em></h1><p class="lede">{E(fmt(v['lede'], shop))}</p>
<div class="ctas"><a class="btn pri" href="tel:{tel(shop['phone'])}">{ic('phone')} Call the {E(v['noun'])}</a><a class="btn ghost" href="{E(shop['maps'])}" target="_blank" rel="noopener">{ic('pin')} Get directions</a></div>
{facts_row(shop)}</div>{ill_card(shop)}</div></section>
<section class="sec text"><div class="w"><div class="txt rv"><p class="ey">Text instead</p><h2>Rather text than call?</h2>
<p class="lead">Tap what you need and the message writes itself.</p><div class="chips" data-txt>{chips}</div>
<div class="bubble" data-bubble aria-live="polite">Hi {E(shop['short'])}, I'd like to ask about…</div>
<button class="btn pri" type="button" data-txtgo>{ic('msg')} Text {E(shop['phone'])}</button><p class="fine" data-txtnote></p></div></div></section>
<section class="sec"><div class="w"><p class="ey rv">What we do</p><h2 class="rv">The work people call {E(shop['short'])} for.</h2><div class="cards">{svc}</div></div></section>
<section class="sec dk"><div class="w"><p class="ey rv">How it works</p><h2 class="rv">Three steps. That's it.</h2><ol class="steps">{steps}</ol></div></section>
{area_block(shop, 'sec')}
{form_block(shop, 'sec alt', 'Call, or send a request.')}
</main><footer class="ft"><div class="w"><b>{E(shop['name'])}</b><span>{E(shop.get('addr') or shop['town'] + ', ' + ST(shop))} · <a href="tel:{tel(shop['phone'])}">{E(shop['phone'])}</a></span><small>Sample site by <a href="{SITE}/?src=preview">Nolan Day Studio</a>. Not the business's official site.</small></div></footer>
<nav class="dock"><a class="btn dark" href="tel:{tel(shop['phone'])}">{ic('phone')} Call</a><a class="btn pri" href="{E(shop['maps'])}" target="_blank" rel="noopener">{ic('pin')} Directions</a></nav>
<script src="/assets/tiers/t.js?v={VER}" defer></script>{count_script(shop['slug'])}</body></html>"""


# ---------- Signature ($750) and Immersive ($1,250) ----------

MOTION_TITLE = {
 "auto": ("Dashboard light on?", "Tap the light you're seeing. Here's what it usually means and what to do next."),
 "tree": ("Worried about a tree?", "Answer two quick questions and see how soon it should be looked at."),
 "lawn": ("Your yard, all year.", "Tap a season to see what the yard needs and when."),
 "painting": ("Try a color.", "Tap a swatch and watch the room change."),
 "cleaning": ("Pick the rooms.", "Tap the rooms you want done and build your clean."),
 "sweets": ("Build your order.", "Pick the occasion and the size and watch your order come together."),
}

# Line drawings for the three service cards, per trade (stroke only; t.js draws them in on scroll).
ART = {
 "auto": ['<path d="M12 64h96M22 64c0-9 4-13 10-13h5l11-15h33l13 15h8c6 0 10 4 10 13"/><circle cx="38" cy="65" r="8"/><circle cx="86" cy="65" r="8"/><path d="M52 36v15M74 36l6 15"/>',
          '<path d="M22 46h48l18-10 14 4-20 18H22z"/><path d="M38 46v-8h14v8"/><path d="M22 58v12h50V58"/><path d="M100 46c0 6-4 9-4 13"/>',
          '<path d="M18 72a42 42 0 0 1 84 0"/><path d="M60 72l22-26"/><circle cx="60" cy="72" r="4"/><path d="M27 52l7 4M60 30v9M93 52l-7 4M38 37l5 7M82 37l-5 7"/>'],
 "tree": ['<path d="M60 86V48M60 62l-13-11M60 55l15-13"/><path d="M60 10c-23 0-35 17-31 33 3 11 15 15 31 15s28-4 31-15c4-16-8-33-31-33z"/><path d="M38 86h44"/>',
          '<path d="M16 68l62-42 8 11-62 42z"/><path d="M25 76l4-4M33 71l4-4M41 66l4-4M49 61l4-4M57 56l4-4M65 51l4-4"/><path d="M86 37l14-10a6 6 0 0 1 4 10l-12 8"/>',
          '<path d="M33 52a16 16 0 0 1 4-31 22 22 0 0 1 43 4 14 14 0 0 1 4 27z"/><path d="M61 56l-9 15h13l-9 16"/><path d="M36 62l-4 9M86 62l-4 9"/>'],
 "lawn": ['<path d="M18 58h58l7-15H27z"/><circle cx="32" cy="65" r="7"/><circle cx="70" cy="65" r="7"/><path d="M83 43l20-27M99 16h9"/><path d="M8 76h104"/>',
          '<path d="M22 82C22 41 49 16 98 14c0 47-27 68-60 68z"/><path d="M22 82l58-52M50 57l-2-16M66 43l14 1"/>',
          '<circle cx="38" cy="46" r="12"/><path d="M38 23v6M38 63v6M15 46h6M55 46h6M22 30l4 4M50 58l4 4M22 62l4-4M50 34l4-4"/><path d="M88 28v40M68 48h40M74 34l28 28M74 62l28-28"/>'],
 "painting": ['<rect x="20" y="16" width="64" height="22" rx="7"/><path d="M84 27h13v19H56v14"/><path d="M51 60h10v24H51z"/>',
              '<path d="M72 12l17 17-31 31-17-17z"/><path d="M41 43c-11 0-19 8-19 19 0 8-6 12-11 14 15 4 35 0 37-14l2-7"/>',
              '<path d="M16 54L60 18l44 36"/><path d="M27 45v37h66V45"/><path d="M52 82V61h16v21"/><path d="M35 53h11v11H35zM74 53h11v11H74z"/>'],
 "cleaning": ['<path d="M40 36h28v48H40z"/><path d="M46 36v-9h16v9M62 27h15l6 6"/><path d="M92 22l6-4M94 33h9M92 44l6 4"/>',
              '<path d="M16 56L55 23l39 33"/><path d="M27 48v34h56V48"/><path d="M98 12l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/><path d="M45 63l7 7 14-15"/>',
              '<path d="M28 42h62l-7 42H35z"/><path d="M28 42c0-19 62-19 62 0"/><circle cx="74" cy="20" r="6"/><circle cx="90" cy="27" r="3.5"/><circle cx="57" cy="24" r="4"/>'],
 "sweets": ['<path d="M43 47l17 39 17-39"/><path d="M41 47a19 19 0 0 1 38 0z"/><path d="M47 31a13 13 0 0 1 26 0"/><path d="M50 58h20M54 68h12"/>',
            '<path d="M24 84h72V55H24z"/><path d="M24 66c8 6 15-4 23 2s15-4 23 2 15-4 26 2"/><path d="M40 55V44M60 55V40M80 55V44"/><path d="M40 37c-3 2-3 5 0 6M60 33c-3 2-3 5 0 6M80 37c-3 2-3 5 0 6"/>',
            '<path d="M22 47h76v37H22zM18 34h84v13H18z"/><path d="M60 34v50"/><path d="M60 34c-9-17-28-15-21-2 2 3 12 2 21 2s19 1 21-2c7-13-12-15-21 2z"/>'],
}


def cta_for(g):
    return _mx.CTA.get(g) or ("Plan a visit" if g == "auto" else "Start an order" if g == "sweets" else "Get a quote")


def art(g, i):
    return (f'<svg class="art" viewBox="0 0 120 96" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{ART[g][i % 3]}</svg>')


def body_750(shop, tier):
    v, g, L = V[shop["v"]], shop["group"], LOOK[shop["group"]]
    h = [fmt(x, shop) for x in (v["h750"] if tier == 750 else v["h1250"])]
    tools = tools_for(shop)
    mt = MOTION_TITLE[g]
    if shop["v"] == "snow":
        mt = ("Your property, all year.", "Tap a season to see what it needs and when.")
    svc = "".join(f'<li class="rv" style="--d:{i * 90}ms"><div class="svc-top"><span>0{i + 1}</span>{art(g, i)}</div><h3>{E(t)}</h3><p>{E(d)}</p>'
                  f'<a href="#plan">{E(cta_for(g))} {ic("arrow", 14)}</a></li>' for i, (t, d) in enumerate(v["services"]))
    words = [j for j in v["jobs"]] + [t for t in (shop.get("towns") or [shop["town"]])[:6]]
    mq_row = "".join(f"<span>{E(w)}</span><i>✦</i>" for w in words)
    marquee = f'<div class="mq" aria-hidden="true"><div class="mq-t">{mq_row}{mq_row}</div></div>'
    steps = "".join(f'<li class="rv"><b>{E(t)}</b><span>{E(d)}</span></li>' for t, d in STEPS[g])
    r = rating_txt(shop)
    proof = (f'<div class="proof rv"><div class="big"><b data-count="{shop["rating"]}">{r}</b><span>{ic("star", 20)}{ic("star", 20)}{ic("star", 20)}{ic("star", 20)}{ic("star", 20)}</span></div>'
             f'<p><b>{shop["reviews"]} Google review{"s" if shop["reviews"] != 1 else ""}.</b> Real customers in {E(shop["town"])} took the time to rate {E(shop["short"])}. '
             f'<a href="{E(shop["maps"])}" target="_blank" rel="noopener">Read them on Google</a></p></div>') if r else ""
    mono = E(shop["short"][0].upper())
    plan = "Signature" if tier == 750 else "Immersive"
    cta = cta_for(g)
    hero = f"""<section class="hero fxh"><canvas class="fx" aria-hidden="true"></canvas><div class="w hgrid"><div><p class="kick"><i></i>{E(shop['cat'] or TRADE_LABEL[shop['v']])} · {E(shop['town'])}, {ST(shop)}</p>
<h1><span>{E(h[0])}</span><em>{E(h[1])}</em></h1><p class="lede">{E(fmt(v['lede'], shop))}</p>
<div class="ctas"><a class="btn pri" href="#plan">{E(cta)}</a><a class="btn ghost" href="tel:{tel(shop['phone'])}">{ic('phone')} {E(shop['phone'])}</a></div></div>{hcard(shop)}</div></section>"""
    if tier == 1250:
        try_it = tools[2][0].upper() + tools[2][1:]
        hero = f"""<section class="scene" data-scene="{g}" data-v="{shop['v']}"><canvas id="c" aria-label="Interactive 3D view for {E(shop['short'])}: {E(tools[2])}. Use the buttons to try it and to switch between day, golden hour and night."></canvas>
<div class="sc-fb"><div><b>{E(shop['short'])}</b><span>{E(try_it)}. Open this page on a newer phone or computer to explore it in 3D.</span></div></div><div class="veil"></div>
<div class="hcopy"><p class="kick"><i></i>{E(shop['cat'] or TRADE_LABEL[shop['v']])} · {E(shop['town'])}, {ST(shop)}</p>
<h1><span>{E(h[0])}</span><em>{E(h[1])}</em></h1><p class="lede">{E(fmt(v['lede'], shop))} {E(try_it)}, right here.</p>
<div class="ctas"><a class="btn pri" href="#plan">{E(cta)}</a><a class="btn ghost" href="tel:{tel(shop['phone'])}">{ic('phone')} <span class="hp">{E(shop['phone'])}</span><span class="hc">Call</span></a></div></div>
<p class="sc-hint" id="scHint">Drag to look around</p>
<div class="sc-dock" role="group" aria-label="3D scene controls"><div class="panel"><span class="lab">Try it</span><div class="sc-btns" id="scBtns"></div></div>
<div class="panel"><span class="lab">Light</span><div class="seg" id="scTod"><button type="button" aria-pressed="false" data-v="0.1">Day</button><button type="button" aria-pressed="true" data-v="0.55">Golden</button><button type="button" aria-pressed="false" data-v="1">Night</button></div></div></div></section>"""
    jobs = "".join(f'<button type="button" class="chip" aria-pressed="{str(i == 0).lower()}">{E(j)}</button>' for i, j in enumerate(v["jobs"]))
    when = "".join(f'<button type="button" class="chip" aria-pressed="{str(i == 0).lower()}">{E(j)}</button>' for i, j in enumerate(v["when"]))
    return f"""<body class="t750 t{tier} g-{g} v-{shop['v']}{' up' if L['up'] else ''}">{banner(shop, plan)}
<header class="hd"><div class="w"><a class="brand" href="#top"><span class="mono">{mono}</span><span class="bn">{E(shop['short'])}</span></a><a class="btn pri sm" href="tel:{tel(shop['phone'])}">{ic('phone', 16)} <span class="hp">{E(shop['phone'])}</span><span class="hc">Call</span></a></div></header>
<main id="top">{hero}
{proof and '<section class="sec"><div class="w">' + proof + '</div></section>'}
<section class="sec motion"><div class="w"><p class="ey rv">{E(tools[1])}</p><h2 class="rv">{E(mt[0])}</h2><p class="lead rv">{E(mt[1])}</p><div class="mp rv" id="mp" data-g="{g}"></div></div></section>
<section class="sec"><div class="w"><p class="ey rv">What we do</p><h2 class="rv">The work, spelled out.</h2><ol class="svc">{svc}</ol></div></section>
{marquee}
<section class="sec plan" id="plan"><div class="w two"><div><p class="ey rv">{cta_for(g)}</p><h2 class="rv">Tell us once. We'll call you back.</h2>
<form class="planner rv" data-planner><fieldset><legend>{E(v['ask'])}</legend><div class="chips" data-k="job">{jobs}</div></fieldset>
<fieldset><legend>When?</legend><div class="chips" data-k="when">{when}</div></fieldset>
<div class="row"><label>Name<input name="n" autocomplete="name"></label><label>Phone<input name="p" type="tel" autocomplete="tel"></label></div>
<label>Anything else?<textarea name="d" rows="2"></textarea></label>
<button class="btn pri" type="submit">Send to {E(shop['short'])}</button><p class="fine" aria-live="polite"></p></form></div>
<aside class="ticket rv" aria-live="polite"><div class="tk-h"><span class="mono">{mono}</span><b>{E(shop['short'])}</b><small>Request</small></div>
<dl><dt>Need</dt><dd data-t="job">{E(v['jobs'][0])}</dd><dt>When</dt><dd data-t="when">{E(v['when'][0])}</dd><dt>Name</dt><dd data-t="n">–</dd><dt>Phone</dt><dd data-t="p">–</dd><dt>Notes</dt><dd data-t="d">–</dd></dl>
<div class="tk-f">Goes straight to {E(shop['phone'])}</div></aside></div></section>
<section class="sec dk"><div class="w"><p class="ey rv">How it works</p><h2 class="rv">Three steps. That's it.</h2><ol class="steps">{steps}</ol></div></section>
{area_block(shop, 'sec')}
</main><footer class="ft"><div class="w"><span class="mono">{mono}</span><b>{E(shop['name'])}</b><span>{E(shop.get('addr') or shop['town'] + ', ' + ST(shop))} · <a href="tel:{tel(shop['phone'])}">{E(shop['phone'])}</a></span><small>Sample {plan} site by <a href="{SITE}/?src=preview">Nolan Day Studio</a>. Not the business's official site.</small></div></footer>
<nav class="dock"><a class="btn dark" href="tel:{tel(shop['phone'])}">{ic('phone')} Call</a><a class="btn pri" href="#plan">{E(cta)}</a></nav>"""


def signature(shop, tier):
    g, L = shop["group"], LOOK[shop["group"]]
    style = (f"<style>:root{{--bg:{L['bg']};--bg2:{L['bg2']};--ink:{L['ink']};--acc:{L['acc']};--acc2:{L['acc2']};--paper:{L['paper']};"
             f"--disp:{L['fam']},Georgia,serif}}</style>")
    imp = ""
    if tier == 1250:
        imp = ('<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",'
               '"three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",'
               '"@pmndrs/assets/":"https://cdn.jsdelivr.net/npm/@pmndrs/assets@1.7.0/"}}</script>')
    plan = "Signature" if tier == 750 else "Immersive"
    out = head(shop, f"{shop['name']} · {shop['town']}, {ST(shop)} ({plan} sample)", f"{TRADE_LABEL[shop['v']]} in {shop['town']}, {ST(shop)}. {plan} sample website by Nolan Day Studio.",
               f"family={L['font']}&family=Inter:wght@400;500;600;700", style) + data_json(shop, tier) + imp + "</head>\n" + body_750(shop, tier)
    out = out.replace('<main id="top">', '<div class="prog" aria-hidden="true"></div><main id="top">', 1)
    out += '\n<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>'
    out += f'\n<script src="/assets/tiers/t.js?v={VER}" defer></script>'
    if tier == 1250:
        out += f'<script type="module" src="/assets/tiers/scene.js?v={VER}"></script>'
    return out + count_script(f"t{tier}-{shop['slug']}") + "</body></html>"


# Mixed business types (Nov 20 2026).
TRADE_LABEL.update(_mx.TRADE_LABEL); MOTION_TITLE.update(_mx.MOTION_TITLE); ART.update(_mx.ART)


# ---------- pitch room JSON ----------

TRY_1250 = {"auto": "Tap \"Raise the lift\" and \"Pop the hood\" on the 3D car up top, then switch to Night.",
            "tree": "Tap \"Trim a branch\" a few times on the 3D tree, then try Storm and Night.",
            "lawn": "Tap \"Mow the yard\" and watch the stripes go down, then switch to Night.",
            "snow": "Tap \"Plow the drive\" and watch it clear, then switch to Night.",
            "painting": "Tap the color buttons to repaint the 3D house, then switch to Night.",
            "cleaning": "Tap \"Clean it\" and watch the room get cleaned, then switch to Night.",
            "sweets": "Tap the add button to stack the 3D treat, then switch to Night."}
TRY_1250.update(_mx.TRY_1250)

def meet_json(shop):
    v, g = V[shop["v"]], shop["group"]
    tools = tools_for(shop)
    url = BASE + shop["slug"] + "/"
    r = rating_txt(shop)
    loc = f"at {shop['addr'].split(',')[0]}" if shop.get("addr") else f"in {shop['town']}"
    wk = shop.get("wk", "none")
    why = (("When we searched Google Maps we couldn't find a listing for you, so people searching on their phone have no page of yours to land on, no map pin and no tap-to-call."
            if wk == "nf" else "Here's what a new site could look like next to the one you have now: built for phones first, with tap-to-call on every screen and a request form that works while you're on a job."
            if wk == "own" else "Today your Google listing links only to a Facebook page, so people searching on their phone land somewhere that doesn't show your work, your area or a quick way to reach you."
            if wk == "fb" else "Today the website link on your Google listing doesn't load, so people who tap it from their phone hit a dead end."
            if wk == "dead" else "Today your Google listing shows a map pin, a phone number and an \"Add website\" button, so people searching on their phone have no page of yours to tap through to.")
           + (f" Your {r} stars from {shop['reviews']} reviews deserve somewhere to land." if r and shop["reviews"] >= 5 else ""))
    feats = {
      "essential": ["One fast page, up to 5 sections", "Tap-to-call bar on every phone screen",
                    f"{tools[0]}: tap what you need and the text writes itself",
                    ("Your Google rating, " if r else "") + f"a map to {shop['addr'].split(',')[0] if shop.get('addr') else shop['town']} and a request form",
                    "Set up for Google search, live the same day"],
      "signature": ["Everything in Starter, up to 7 sections", "Custom look and type made for your " + v["noun"],
                    tools[1], "Request planner that fills in a live ticket as people choose",
                    *(["Your Google rating, counted up front and center"] if r else []), "Two rounds of changes"],
      "immersive": ["Everything in Signature", "A real-time 3D centerpiece: " + tools[2], "Day and night views",
                    "Built to be the site people remember and share"],
    }
    compare = [["Built for phones first, tap-to-call on every screen", 1, 1, 1],
               ["Your Google " + ("rating, " if r else "listing, ") + "a map and a request form", 1, 1, 1],
               [tools[0], 1, 1, 1], ["Business details set up for Google search", 1, 1, 1], ["Live the same day you approve it", 1, 1, 1],
               ["Custom look and type made for your " + v["noun"] + ", not a template", 0, 1, 1],
               [tools[1], 0, 1, 1], ["Request planner with a live ticket", 0, 1, 1],
               ["A real-time 3D centerpiece (" + tools[2] + ")", 0, 0, 1], ["Day and night views", 0, 0, 1],
               ["Rounds of changes included", "1 (any time on $99/mo)", "2", "2"], ["Sections", "up to 5", "up to 7", "up to 7"]]
    tour = [["Tap-to-call on every screen", f"Your number, {shop['phone']}, sits at the top and stays on screen as people scroll, so {v['who']} reach you in one tap."],
            ["Rather text? One tap", "People tap what they need and the text to you writes itself. Easy for anyone who hates phone calls."],
            ["Your shop on a map" if g == "auto" else "Your area on a map",
             f"It shows you {loc} with a Google Maps button" + (f" and the towns around {shop['town']}" if shop.get("towns") else "") + ", so first-timers find you without calling to ask."],
            ["Requests while you work", f"People who'd rather not call can leave their name, number and what they need. Those go straight to you."]]
    d = {"slug": shop["slug"], "name": shop["name"], "short": shop["short"], "town": shop["town"], "state": ST(shop), "phone": shop["phone"],
         "trade": TRADE_LABEL[shop["v"]], "services": [s[0] for s in v["services"]],
         "samples": {"essential": url, "signature": url + "750/", "immersive": url + "1250/"},
         "why": why, "tools": {"essential": tools[0], "signature": tools[1], "immersive": tools[2]},
         "versions": {"essential": {"blurb": "The clean, fast version: one page that answers every question and gets the call. Or $0 down and $99 a month with hosting and changes included.", "features": feats["essential"]},
                      "signature": {"blurb": f"Art-directed: a custom look, {tools[1][0].lower() + tools[1][1:]}, and a request planner that fills in a ticket as people choose.", "features": feats["signature"]},
                      "immersive": {"blurb": f"The showpiece: {tools[2]}, with day and night views. Everything in Signature too.", "features": feats["immersive"]}},
         "compare": compare, "tour": tour,
         "try": {"essential": "Tap a choice under \"Rather text than call?\" and watch the text to " + shop["short"] + " write itself.",
                 "signature": "Scroll to \"" + ("Your property, all year." if shop["v"] == "snow" else MOTION_TITLE[g][0]) + "\" and tap the choices, then pick options in the request and watch the ticket fill in.",
                 "immersive": TRY_1250[shop["v"] if shop["v"] == "snow" else g]}}
    if shop.get("addr"):
        d["address"] = shop["addr"]
    if r:
        d["rating"], d["reviews"] = r, shop["reviews"]
    if shop.get("thumbs"):
        d["thumbs"] = shop["thumbs"]
    return json.dumps(d, ensure_ascii=False).replace("</", "<\\/")


# ---- Trade guard (Nov 20 2026) -------------------------------------------------------------------
# A sample site built for the wrong trade kills the sale (R.W. Stoneworks, a masonry company, got a
# lawn-mowing site). So no shop is built unless _build/tiers/trade_checks.json confirms its trade:
#   "<slug>": {"v": "<variant>", "trade": "what they really do", "src": "where that was seen", "on": "YYYY-MM-DD"}
# and the check's "v" must equal the "v" being built. The name test below also refuses a build when
# the business name points at another trade (e.g. "Stoneworks" on a lawn site) unless the check says
# "name_ok": true after a person or a source confirmed it.
CHECKS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "trade_checks.json")
NAME_SIGNS = [(r"stone|masonry|paver|hardscap|brick|retaining", "hardscape"), (r"excavat|grading|trenching|septic", "excavation"),
              (r"concrete|cement|flatwork", "concrete"), (r"roof", "roofing"), (r"\bfenc", "fence"), (r"\btrees?\b|stump|\barbor|forestry", "tree"),
              (r"lawn|mow|turf", "lawn"), (r"\btow(ing)?\b|wrecker", "towing"), (r"\bbody\b|autobody|collision", "autobody"),
              (r"glass|windshield", "autoglass"), (r"paint", "painting"), (r"plumb|rooter", "plumbing"), (r"electric", "electrical"),
              (r"hvac|heating|cooling|furnace", "hvac"), (r"barber", "barber"), (r"groom", "petgroom"), (r"clean(?! cut| shave)|\bmaids?\b|janitor", "cleaning")]
NAME_FITS = {  # signals a variant can carry without a conflict
    "auto": {"autobody", "towing", "electrical", "hvac", "autoglass"}, "truck": {"autobody", "towing"}, "transmission": set(), "radiator": {"hvac"},
    "muffler": set(), "brake": set(), "autobody": {"painting", "autoglass", "towing"}, "autoglass": set(), "towing": {"autobody"},
    "tree": {"lawn", "excavation"}, "lawn": {"tree", "cleaning"}, "landscape": {"lawn", "tree", "hardscape", "concrete"}, "snow": {"lawn"},
    "hardscape": {"concrete", "excavation", "lawn"}, "landinstall": {"lawn", "tree", "hardscape", "concrete", "excavation"}, "excavation": {"hardscape", "concrete", "lawn", "tree"}, "concrete": {"hardscape", "excavation"},
    "painter": {"cleaning", "roofing"}, "houseclean": set(), "janitorial": set(), "pressurewash": {"cleaning", "painting"}, "carpetclean": {"cleaning"}, "tailor": {"cleaning"},
    "handyman": {"painting", "cleaning", "lawn", "roofing", "fence"}, "roofing": set(), "petgroom": {"cleaning"}, "plumbing": {"cleaning", "hvac"},
    "hvac": {"plumbing", "electrical"}, "electrical": {"hvac"}, "smallengine": {"lawn"}}


def trade_problem(s, checks):
    c = checks.get(s["slug"])
    if not c:
        return "no confirmed trade in trade_checks.json"
    if c.get("hand_built"):
        return "its pages were built by hand; edit them directly so this script doesn't overwrite them"
    if c.get("v") != s["v"]:
        return f'confirmed trade is "{c.get("v")}" ({c.get("trade")}), not "{s["v"]}"'
    if not c.get("name_ok"):
        n = s["name"].lower()
        fits = NAME_FITS.get(s["v"], set()) | {s["v"], {"painter": "painting", "houseclean": "cleaning", "janitorial": "cleaning"}.get(s["v"], s["v"])}
        clash = sorted({t for rx, t in NAME_SIGNS if re.search(rx, n)} - fits)
        if clash:
            return f'the name says {"/".join(clash)} but the site would be "{s["v"]}"; confirm it and set "name_ok": true'
    return None


def main():
    a = sys.argv[1:]
    src = a[a.index("--shops") + 1] if "--shops" in a else "_build/tiers/shops.json"
    shops = json.load(open(os.path.join(ROOT, src)))
    if "--only" in a:
        keep = set(a[a.index("--only") + 1].split(","))
        shops = [s for s in shops if s["slug"] in keep]
    if "--limit" in a:
        shops = shops[: int(a[a.index("--limit") + 1])]
    checks = json.load(open(CHECKS_PATH)) if os.path.exists(CHECKS_PATH) else {}
    refused = []
    for s in shops:
        why = trade_problem(s, checks)
        if why:
            refused.append((s["slug"], why))
    if refused:
        for slug, why in refused:
            print(f"REFUSED {slug}: {why}", file=sys.stderr)
        print(f"{len(refused)} shop(s) not built: confirm the real trade first (see the trade guard in build.py).", file=sys.stderr)
        keep = {r[0] for r in refused}
        shops = [s for s in shops if s["slug"] not in keep]
    for s in shops:
        if s.get("copy"):  # per-shop wording from the business's own pages, on top of its variant
            key = f'{s["v"]}~{s["slug"]}'
            V[key] = dict(V[s["v"]], **{k: (v if k != "services" else [tuple(x) for x in v]) for k, v in s["copy"].items() if k != "label"})
            TRADE_LABEL[key] = s["copy"].get("label", TRADE_LABEL[s["v"]])
            s["v0"], s["v"] = s["v"], key
        s["group"] = V[s["v"]]["group"]
        s["name"] = nice_name(s["name"])
        s["short"] = short_name(s["name"])
        d = os.path.join(ROOT, "p/2e8e4a", s["slug"])
        if os.path.exists(os.path.join(d, "shots", "v300.jpg")):
            s["thumbs"] = {k: f"{BASE}{s['slug']}/shots/v{n}.jpg" for k, n in (("essential", 300), ("signature", 750), ("immersive", 1250))}
        os.makedirs(os.path.join(d, "750"), exist_ok=True)
        os.makedirs(os.path.join(d, "1250"), exist_ok=True)
        open(os.path.join(d, "index.html"), "w").write(starter(s, meet_json(s)))
        open(os.path.join(d, "750", "index.html"), "w").write(signature(s, 750))
        open(os.path.join(d, "1250", "index.html"), "w").write(signature(s, 1250))
    print(f"built {len(shops)} shops x 3")


if __name__ == "__main__":
    main()
