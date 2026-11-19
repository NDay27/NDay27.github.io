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

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = "/p/2e8e4a/"
SITE = "https://nday27.github.io"
VER = "20261119"
E = html.escape

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
    d = {"tier": tier, "group": shop["group"], "v": shop["v"], "name": shop["name"], "short": shop["short"], "town": shop["town"],
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
<a class="maplink rv" href="{E(shop['maps'])}" target="_blank" rel="noopener">{ic('pin')} <span><b>Open in Google Maps</b><small>{E(shop.get('addr') or shop['town'] + ', IL')}</small></span>{ic('arrow')}</a></div></section>"""


def facts_row(shop):
    out = []
    r = rating_txt(shop)
    if r:
        out.append(f'<li>{ic("star", 16)} <b>{r}</b> on Google, {shop["reviews"]} review{"s" if shop["reviews"] != 1 else ""}</li>')
    out.append(f'<li>{ic("tag", 16)} {E(shop["cat"] or TRADE_LABEL[shop["v"]])}</li>')
    out.append(f'<li>{ic("pin", 16)} {E(street(shop) or shop["town"])}{", " + E(shop["town"]) if street(shop) else ", IL"}</li>')
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
            f'<p>{ic("pin", 16)} {E(shop.get("addr") or shop["town"] + ", IL")}</p><p>{ic("phone", 16)} {E(shop["phone"])}</p></aside>')


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
    return head(shop, f"{shop['name']} · {shop['town']}, IL", f"{TRADE_LABEL[shop['v']]} in {shop['town']}, IL. Sample website by Nolan Day Studio.",
                "family=Archivo:wght@500;800;900&family=Inter:wght@400;500;600;700",
                f'<style>:root{{--acc:{acc}}}</style>') + \
        f'<script type="application/json" id="nds-shop">{meet_json}</script>' + data_json(shop, 300) + f"""</head>
<body class="t300 g-{g}">{banner(shop, 'Starter')}
<header class="hd"><div class="w"><a class="brand" href="#top">{E(shop['short'])}</a><a class="btn pri sm" href="tel:{tel(shop['phone'])}">{ic('phone', 16)} {E(shop['phone'])}</a></div></header>
<main id="top"><section class="hero"><div class="w hgrid"><div><p class="addr">{E(shop.get('addr') or shop['town'] + ', Illinois')}</p>
<h1>{E(h[0])} <em>{E(h[1])}</em></h1><p class="lede">{E(fmt(v['lede'], shop))}</p>
<div class="ctas"><a class="btn pri" href="tel:{tel(shop['phone'])}">{ic('phone')} Call the {E(v['noun'])}</a><a class="btn ghost" href="{E(shop['maps'])}" target="_blank" rel="noopener">{ic('pin')} Get directions</a></div>
{facts_row(shop)}</div>{hcard(shop)}</div></section>
<section class="sec text"><div class="w"><div class="txt rv"><p class="ey">Text instead</p><h2>Rather text than call?</h2>
<p class="lead">Tap what you need and the message writes itself.</p><div class="chips" data-txt>{chips}</div>
<div class="bubble" data-bubble aria-live="polite">Hi {E(shop['short'])}, I'd like to ask about…</div>
<button class="btn pri" type="button" data-txtgo>{ic('msg')} Text {E(shop['phone'])}</button><p class="fine" data-txtnote></p></div></div></section>
<section class="sec"><div class="w"><p class="ey rv">What we do</p><h2 class="rv">The work people call {E(shop['short'])} for.</h2><div class="cards">{svc}</div></div></section>
<section class="sec dk"><div class="w"><p class="ey rv">How it works</p><h2 class="rv">Three steps. That's it.</h2><ol class="steps">{steps}</ol></div></section>
{area_block(shop, 'sec')}
{form_block(shop, 'sec alt', 'Call, or send a request.')}
</main><footer class="ft"><div class="w"><b>{E(shop['name'])}</b><span>{E(shop.get('addr') or shop['town'] + ', IL')} · <a href="tel:{tel(shop['phone'])}">{E(shop['phone'])}</a></span><small>Sample site by <a href="{SITE}/?src=preview">Nolan Day Studio</a>. Not the business's official site.</small></div></footer>
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


def body_750(shop, tier):
    v, g, L = V[shop["v"]], shop["group"], LOOK[shop["group"]]
    h = [fmt(x, shop) for x in (v["h750"] if tier == 750 else v["h1250"])]
    tools = tools_for(shop)
    mt = MOTION_TITLE[g]
    if shop["v"] == "snow":
        mt = ("Your property, all year.", "Tap a season to see what it needs and when.")
    svc = "".join(f'<li class="rv"><span>0{i + 1}</span><div><h3>{E(t)}</h3><p>{E(d)}</p></div></li>' for i, (t, d) in enumerate(v["services"]))
    steps = "".join(f'<li class="rv"><b>{E(t)}</b><span>{E(d)}</span></li>' for t, d in STEPS[g])
    r = rating_txt(shop)
    proof = (f'<div class="proof rv"><div class="big"><b data-count="{shop["rating"]}">{r}</b><span>{ic("star", 20)}{ic("star", 20)}{ic("star", 20)}{ic("star", 20)}{ic("star", 20)}</span></div>'
             f'<p><b>{shop["reviews"]} Google review{"s" if shop["reviews"] != 1 else ""}.</b> Real customers in {E(shop["town"])} took the time to rate {E(shop["short"])}. '
             f'<a href="{E(shop["maps"])}" target="_blank" rel="noopener">Read them on Google</a></p></div>') if r else ""
    mono = E(shop["short"][0].upper())
    plan = "Signature" if tier == 750 else "Immersive"
    cta = "Plan a visit" if g == "auto" else "Start an order" if g == "sweets" else "Get a quote"
    scene = ""
    if tier == 1250:
        scene = f"""<section class="scene" data-scene="{g}" data-v="{shop['v']}"><canvas id="c" aria-label="Interactive 3D view for {E(shop['short'])}"></canvas>
<div class="sc-ui"><div class="sc-btns" id="scBtns"></div><button class="sc-nt" id="scNight" type="button" aria-pressed="false">Night</button></div>
<p class="sc-hint" id="scHint">Drag to look around</p><div class="sc-fb"><b>{E(shop['short'])}</b><span>{E(tools[2][0].upper() + tools[2][1:])}. Open on a newer phone or computer to explore it.</span></div></section>"""
    hero = f"""<section class="hero{' over' if tier == 1250 else ''}"><div class="w hgrid"><div><p class="kick"><i></i>{E(shop['cat'] or TRADE_LABEL[shop['v']])} · {E(shop['town'])}, IL</p>
<h1><span>{E(h[0])}</span><em>{E(h[1])}</em></h1><p class="lede">{E(fmt(v['lede'], shop))}{' Try it: ' + E(tools[2]) + ', up top.' if tier == 1250 else ''}</p>
<div class="ctas"><a class="btn pri" href="#plan">{E(cta)}</a><a class="btn ghost" href="tel:{tel(shop['phone'])}">{ic('phone')} {E(shop['phone'])}</a></div></div>{hcard(shop)}</div></section>"""
    if tier == 1250:
        hero = scene + hero
    jobs = "".join(f'<button type="button" class="chip" aria-pressed="{str(i == 0).lower()}">{E(j)}</button>' for i, j in enumerate(v["jobs"]))
    when = "".join(f'<button type="button" class="chip" aria-pressed="{str(i == 0).lower()}">{E(j)}</button>' for i, j in enumerate(v["when"]))
    return f"""<body class="t750 t{tier} g-{g} v-{shop['v']}{' up' if L['up'] else ''}">{banner(shop, plan)}
<header class="hd"><div class="w"><a class="brand" href="#top"><span class="mono">{mono}</span><span class="bn">{E(shop['short'])}</span></a><a class="btn pri sm" href="tel:{tel(shop['phone'])}">{ic('phone', 16)} <span class="hp">{E(shop['phone'])}</span><span class="hc">Call</span></a></div></header>
<main id="top">{hero}
{proof and '<section class="sec"><div class="w">' + proof + '</div></section>'}
<section class="sec motion"><div class="w"><p class="ey rv">{E(tools[1])}</p><h2 class="rv">{E(mt[0])}</h2><p class="lead rv">{E(mt[1])}</p><div class="mp rv" id="mp" data-g="{g}"></div></div></section>
<section class="sec"><div class="w"><p class="ey rv">What we do</p><h2 class="rv">The work, spelled out.</h2><ol class="svc">{svc}</ol></div></section>
<section class="sec plan" id="plan"><div class="w two"><div><p class="ey rv">{'Plan a visit' if g == 'auto' else 'Start an order' if g == 'sweets' else 'Get a quote'}</p><h2 class="rv">Tell us once. We'll call you back.</h2>
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
</main><footer class="ft"><div class="w"><span class="mono">{mono}</span><b>{E(shop['name'])}</b><span>{E(shop.get('addr') or shop['town'] + ', IL')} · <a href="tel:{tel(shop['phone'])}">{E(shop['phone'])}</a></span><small>Sample {plan} site by <a href="{SITE}/?src=preview">Nolan Day Studio</a>. Not the business's official site.</small></div></footer>
<nav class="dock"><a class="btn dark" href="tel:{tel(shop['phone'])}">{ic('phone')} Call</a><a class="btn pri" href="#plan">{E(cta)}</a></nav>"""


def signature(shop, tier):
    g, L = shop["group"], LOOK[shop["group"]]
    style = (f"<style>:root{{--bg:{L['bg']};--bg2:{L['bg2']};--ink:{L['ink']};--acc:{L['acc']};--acc2:{L['acc2']};--paper:{L['paper']};"
             f"--disp:{L['fam']},Georgia,serif}}</style>")
    imp = ""
    if tier == 1250:
        imp = ('<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",'
               '"three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>')
    plan = "Signature" if tier == 750 else "Immersive"
    out = head(shop, f"{shop['name']} · {shop['town']}, IL ({plan} sample)", f"{TRADE_LABEL[shop['v']]} in {shop['town']}, IL. {plan} sample website by Nolan Day Studio.",
               f"family={L['font']}&family=Inter:wght@400;500;600;700", style) + data_json(shop, tier) + imp + "</head>\n" + body_750(shop, tier)
    out += f'\n<script src="/assets/tiers/t.js?v={VER}" defer></script>'
    if tier == 1250:
        out += f'<script type="module" src="/assets/tiers/scene.js?v={VER}"></script>'
    return out + count_script(f"t{tier}-{shop['slug']}") + "</body></html>"


# ---------- pitch room JSON ----------

TRY_1250 = {"auto": "Tap \"Raise the lift\" and \"Pop the hood\" on the 3D car up top, then switch to Night.",
            "tree": "Tap \"Trim a branch\" a few times on the 3D tree, then try Storm and Night.",
            "lawn": "Tap \"Mow the yard\" and watch the stripes go down, then switch to Night.",
            "snow": "Tap \"Plow the drive\" and watch it clear, then switch to Night.",
            "painting": "Tap the color buttons to repaint the 3D house, then switch to Night.",
            "cleaning": "Tap \"Clean it\" and watch the room get cleaned, then switch to Night.",
            "sweets": "Tap the add button to stack the 3D treat, then switch to Night."}

def meet_json(shop):
    v, g = V[shop["v"]], shop["group"]
    tools = tools_for(shop)
    url = BASE + shop["slug"] + "/"
    r = rating_txt(shop)
    loc = f"at {shop['addr'].split(',')[0]}" if shop.get("addr") else f"in {shop['town']}"
    wk = shop.get("wk", "none")
    why = (("Today your Google listing links only to a Facebook page, so people searching on their phone land somewhere that doesn't show your work, your area or a quick way to reach you."
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
    d = {"slug": shop["slug"], "name": shop["name"], "short": shop["short"], "town": shop["town"], "state": "IL", "phone": shop["phone"],
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


def main():
    a = sys.argv[1:]
    shops = json.load(open(os.path.join(ROOT, "_build/tiers/shops.json")))
    if "--only" in a:
        keep = set(a[a.index("--only") + 1].split(","))
        shops = [s for s in shops if s["slug"] in keep]
    if "--limit" in a:
        shops = shops[: int(a[a.index("--limit") + 1])]
    for s in shops:
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
