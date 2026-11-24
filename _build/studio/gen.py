"""Build the three sample sites (Starter $300, Signature $750, Immersive $1,250) and the pitch-room data for a shop.

Usage: python3 gen.py leads.json [slug ...]
Each lead: name, town, phone, kind (optional), services/yp_cats/trade_label (its own listing words), rating, reviews,
web ("none", "facebook", "dead", "directory"), slug.
Writes p/2e8e4a/<slug>/index.html, 750/index.html, 1250/index.html. Never touches a folder that already exists
unless it was made by this generator (marker comment nds-studio-gen).
"""
import json, os, re, sys, hashlib, html
import art, trades

E = html.escape
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = "/p/2e8e4a/"
SITE = "https://nday27.github.io"
V = "20261120"
MARK = "<!-- nds-studio-gen -->"

FONTS = {
    "Fraunces": "family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600",
    "DM Serif Display": "family=DM+Serif+Display:ital@0;1",
    "Bricolage Grotesque": "family=Bricolage+Grotesque:opsz,wght@12..96,400..800",
}
SCENE_DESC = {
    "lawn": "a 3D yard you can mow yourself", "painting": "a 3D house you can repaint", "cleaning": "a 3D room that gets cleaned while you watch",
    "sweets": "a 3D bakery case you can fill", "beauty": "a 3D salon you can look around", "food": "a 3D counter you can look around",
    "retail": "a 3D shop you can look around", "pets": "a 3D grooming station you can try", "fitness": "a 3D studio you can look around",
    "studio": "a 3D studio you can light up", "trades": "a 3D job site where the work truck pulls up and does the job",
}
DRAWN = {"house": "house", "room": "room", "plan": "site plan", "salon": "salon", "pet": "grooming table", "cake": "counter", "bench": "workbench"}
CLOSE = {"project": ("Let's talk about ", "your project."), "service": ("Something not right? ", "Let's fix it."),
         "visit": ("Ready for ", "your next visit?"), "order": ("Let's make it ", "something special.")}
EXTRA_GROUP = {
    "flowers": ("Colors", ["Bright", "Soft pastels", "White and green", "Seasonal"]),
    "kids": ("Days", ["Full time", "Part time", "A few days a week", "Summer only"]),
    "fit": ("Who's it for", ["Kids", "Teens", "Adults", "The whole family"]),
    "food": ("How many", ["Just a few", "About a dozen", "A party", "A big event"]),
    "pet": ("Size", ["Small", "Medium", "Large", "Extra large"]),
    None: ("When", ["Morning", "Afternoon", "Evening", "Weekend"]),
}


# ---------------------------------------------------------------- small helpers
def h(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def digits(p):
    d = re.sub(r"\D", "", p or "")
    return d[-10:] if len(d) >= 10 else ""


def fphone(p):
    d = digits(p)
    return f"({d[:3]}) {d[3:6]}-{d[6:]}"


def tel(p):
    return "+1" + digits(p)


def slugify(s):
    s = s.lower().replace("&", " and ").replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def hex2rgb(c):
    c = c.lstrip("#")
    return [int(c[i:i + 2], 16) for i in (0, 2, 4)]


def rgb2hex(r):
    return "#" + "".join(f"{max(0, min(255, round(x))):02x}" for x in r)


def mix(a, b, t):
    A, B = hex2rgb(a), hex2rgb(b)
    return rgb2hex([A[i] + (B[i] - A[i]) * t for i in range(3)])


def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4
    r, g, b = hex2rgb(c)
    return .2126 * ch(r) + .7152 * ch(g) + .0722 * ch(b)


def andlist(xs):
    xs = [x for x in xs if x]
    if len(xs) <= 1:
        return "".join(xs)
    return ", ".join(xs[:-1]) + " and " + xs[-1]


def short_name(name):
    s = re.sub(r",?\s+(LLC|L\.L\.C\.|Inc\.?|Incorporated|Co\.?|Corp\.?|Company|Ltd\.?)$", "", name.strip(), flags=re.I)
    s = re.sub(r",?\s+(LLC|Inc\.?)$", "", s, flags=re.I)
    return s.strip(" ,")


def initials(s):
    w = [x for x in re.split(r"[\s&/-]+", re.sub(r"[^A-Za-z0-9&/ -]", "", s)) if x and x.lower() not in ("the", "and", "of")]
    return (w[0][0] + (w[1][0] if len(w) > 1 else "")).upper() if w else "N"


def ico(name, cls="ico"):
    p = art.ICONS.get(name) or art.ICONS["check"]
    p = re.sub(r"<(path|circle|rect)(?![^>]*pathLength)", r'<\1 pathLength="1"', p)
    return f'<svg class="{cls}" viewBox="0 0 64 52" aria-hidden="true">{p}</svg>'


SV = lambda d, w=2: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"/></svg>'
PHONE = SV("M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2")
CHAT = SV("M21 12a8 8 0 0 1-11.8 7L4 20l1.2-4.6A8 8 0 1 1 21 12z")
PIN = SV("M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5")
ARROW = SV("M7 17 17 7M8 7h9v9")
DRAG = SV("M9 6 3 12l6 6M15 6l6 6-6 6", 2.2)
STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>'


# ---------------------------------------------------------------- the shop, worked out from its own listing
SKIP_SVC = re.compile(r"walk-?in|estimate|hours|special|seasonal|appointment|commercial &|residential &|retail|dealer|^cosmetology$|^(hair|spa|electrical|esthetician|general florist) services?$", re.I)


def _clean_svc(x):
    x = re.sub(r"\s*\(.*?\)", "", x).strip().rstrip(".")
    x = x.replace("&", "and").replace("/", " and ")
    return x[:1].upper() + x[1:]


def services_for(lead, K):
    out = _services_for(lead, K)
    fix = lead.get("svc_d") or {}
    return [dict(x, d=fix[x["t"]]) if x["t"] in fix else x for x in out]


def _services_for(lead, K):
    own = [_clean_svc(x) for x in (lead.get("services") or []) if x and not SKIP_SVC.search(x.strip())]
    own = [x for x in own if 2 < len(x) <= 34]
    if len(own) >= 2:
        # the business's own words first; borrow an icon and a line from the trade catalog when one fits
        out, used = [], set()
        for x in own:
            m = next((s for s in K["svc"] if re.search(s["kw"], x.lower()) and s["t"] not in used), None)
            if m:
                used.add(m["t"])
            out.append({"t": x, "d": m["d"] if m else "", "i": m["i"] if m else K["svc"][0]["i"], "kw": "", "core": False})
            if len(out) == 6:
                break
        return out
    text = " ".join([lead.get("trade_label") or "", " ".join(lead.get("yp_cats") or []), " ".join(lead.get("services") or []),
                     lead.get("blurb") or "", lead.get("category") or ""]).lower()
    got = [s for s in K["svc"] if re.search(s["kw"], text)]
    if len(got) < 3:
        for s in K["svc"]:
            if s["core"] and s not in got:
                got.append(s)
    order = {id(s): i for i, s in enumerate(K["svc"])}
    got.sort(key=lambda s: order[id(s)])
    return got[:6]


def shop(lead):
    key = lead.get("kind") or trades.pick_kind(lead)
    K = trades.K[key]
    name = lead["name"].strip()
    short = lead.get("short") or short_name(name)
    town = lead["town"].strip()
    slug = lead.get("slug") or slugify(f"{short}-{town}")
    svc = services_for(lead, K)
    fill = ["Call or text {s} to set it up.", "Ask {s} about it.", "{s} can walk you through it."]
    for i, s in enumerate(svc):
        if not s["d"]:
            s["d"] = fill[i % 3].format(s=short)
    deep, acc = trades.PAL[K["pal"]]
    rating = lead.get("rating")
    try:
        rating = float(rating) if rating not in (None, "", 0) else None
    except Exception:
        rating = None
    m = re.search(r"\d+", str(lead.get("reviews") or ""))
    reviews = int(m.group()) if m else None
    if not rating or not reviews:
        rating, reviews = None, None
    hv = h(slug)
    head = K["heads"][hv % len(K["heads"])]
    head2 = K["heads"][(hv + 1) % len(K["heads"])]
    head3 = K["heads"][(hv + 2) % len(K["heads"])]
    words = [s["t"] if (s["t"].isupper() or s["t"][1:2].isupper()) else s["t"][0].lower() + s["t"][1:] for s in svc[:3]]
    lede = lead.get("lede") or K["lede"].format(name=short, svc=andlist(words), town=town)
    font = trades.FONT[K["font"]]
    S = dict(key=key, K=K, name=name, short=short, town=town, st="IL", slug=slug, phone=fphone(lead["phone"]), tel=tel(lead["phone"]),
             svc=svc, deep=deep, acc=acc, acc2=mix(acc, "#ffffff", .38), accink=deep if lum(acc) > .3 else "#ffffff",
             paper=mix("#f3eee5", acc, .035), rating=rating, reviews=reviews, head=head, head2=head2, head3=head3, lede=lede,
             font=font, fcls={"warm": "", "chic": "f-chic", "bold": "f-bold"}[K["font"]], mk=initials(short), web={"fb": "facebook"}.get(lead.get("web"), lead.get("web") or "none"),
             steps=[(t, x.format(short=short)) for t, x in trades.STEPS[K["steps"]]], label=K["label"])
    return S


# ---------------------------------------------------------------- shared page parts
def page_head(S, tier):
    nm = {300: "Starter", 750: "Signature", 1250: "Immersive"}[tier]
    title = f"{S['name']} · {S['town']}, IL ({nm} sample)"
    desc = f"{S['label']} in {S['town']}, IL: {andlist([s['t'].lower() for s in S['svc'][:4]])}. {nm} sample website by Nolan Day Studio."
    fam = FONTS[S["font"]]
    fav = ("data:image/svg+xml," + f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='{S['deep']}'/>"
           f"<text x='16' y='22' text-anchor='middle' font-family='Georgia,serif' font-size='15' font-weight='700' fill='{S['acc']}'>{S['mk']}</text></svg>").replace("#", "%23").replace("<", "%3C").replace(">", "%3E").replace("'", "%27").replace(" ", "%20")
    ldtype = "HomeAndConstructionBusiness" if S["K"]["fam"] in ("house", "room", "plan") else "LocalBusiness"
    ld = {"@context": "https://schema.org", "@type": ldtype, "name": S["name"], "description": S["lede"], "telephone": "+1-" + digits(S["phone"])[:3] + "-" + digits(S["phone"])[3:6] + "-" + digits(S["phone"])[6:],
          "address": {"@type": "PostalAddress", "addressLocality": S["town"], "addressRegion": "IL", "addressCountry": "US"}}
    if S["rating"]:
        ld["aggregateRating"] = {"@type": "AggregateRating", "ratingValue": S["rating"], "reviewCount": S["reviews"]}
    up = "../" if tier != 300 else ""
    root = (f":root{{--deep:{S['deep']};--deep2:{mix(S['deep'], '#ffffff', .05)};--char:{mix(S['deep'], '#ffffff', .08)};--char2:{mix(S['deep'], '#ffffff', .12)};"
            f"--acc:{S['acc']};--acc2:{S['acc2']};--accink:{S['accink']};--paper:{S['paper']};--serif:\"{S['font']}\",Georgia,serif}}")
    return (f"<!doctype html>\n{MARK}\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
            f"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<meta name=\"robots\" content=\"noindex,nofollow\">\n"
            f"<title>{E(title)}</title>\n<meta name=\"description\" content=\"{E(desc)}\">\n<meta name=\"theme-color\" content=\"{S['deep']}\">\n"
            f"<link rel=\"icon\" href=\"{fav}\">\n"
            f"<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
            f"<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?{fam}&family=Inter:wght@400;500;600;700&display=swap\">\n"
            f"<link rel=\"stylesheet\" href=\"/assets/studio/s.css?v={V}\">\n<style>{root}</style>\n"
            f"<script type=\"application/ld+json\">{json.dumps(ld)}</script>\n")


def bar(S, tier):
    base = {300: "./", 750: "../", 1250: "../"}[tier]
    p = lambda t, href, nm, price: (f'<a href="{href}"' + (' aria-current="page"' if t == tier else "") + f'><b class="nm">{nm}</b> <span>{price}</span></a>')
    plans = (p(300, base, "Starter", "$300") + p(750, base + "750/" if tier != 750 else "./", "Signature", "$750")
             + p(1250, base + "1250/" if tier != 1250 else "./", "Immersive", "$1,250"))
    return (f'<a class="skip" href="#main">Skip to content</a>\n<div class="nd-bar"><p class="note"><b>Sample site</b><span class="long"> made for {E(S["name"])} by Nolan Day Studio. Not the official site.</span> '
            f'<a href="{SITE}/yes/?s={S["slug"]}&amp;src=preview">Make it mine</a> · <a href="{SITE}/meet/?s={S["slug"]}">See all 3 versions</a></p>'
            f'<nav class="nd-plans" aria-label="Sample versions">{plans}</nav></div>\n<div id="prog" aria-hidden="true"></div>\n')


def header(S, over=False, nav=("Services", "#services"), nav2=("How it works", "#how")):
    return (f'<header class="top{" over" if over else ""}"><div class="wrap"><a class="logo" href="#main"><span class="mk">{E(S["mk"])}</span>'
            f'<span class="wm"><b>{E(S["short"])}</b><small>{E(S["label"])} · {E(S["town"])}</small></span></a>'
            f'<nav aria-label="Sections"><a href="{nav[1]}">{nav[0]}</a><a href="{nav2[1]}">{nav2[0]}</a><a href="#contact">Contact</a></nav>'
            f'<a class="btn acc" href="tel:{S["tel"]}" aria-label="Call {E(S["short"])}">{PHONE}<span class="n">{S["phone"]}</span></a></div></header>\n')


def h1(pair, wr=True):
    a, b = pair
    return f'<h1{" data-wr" if wr else ""}>{E(a)}<em>{E(b)}</em></h1>'


def proof(S):
    if S["rating"]:
        return (f'<div class="proof"><span><b>{S["rating"]:g}</b><span class="stars">{STAR * 5}</span> from {S["reviews"]} review{"s" if S["reviews"] != 1 else ""}</span>'
                f'<span>{PIN}{E(S["town"])}, IL</span></div>')
    return f'<div class="proof"><span>{PIN}{E(S["town"])}, IL</span><span>{PHONE}Call or text {S["phone"]}</span></div>'


def drawing(S, sid, auto="load", extra_cls=""):
    a = art.draw(S["K"]["fam"], S["K"]["v"], "var(--paint)")
    svg = a.svg(f"A line drawing for {S['short']}: {S['label'].lower()}", sid=sid, cls=("art " + extra_cls).strip())
    attrs = f' data-total="{a.total():.2f}"' + (f' data-auto="{auto}"' if auto else "")
    return svg.replace("<svg ", "<svg" + attrs + " ", 1)


def marquee(S, dark=False):
    items = "".join(f"<span>{E(s['t'])}</span>" for s in S["svc"]) + f"<span>{E(S['town'])}, IL</span>"
    return f'<div class="mq{" dk" if dark else ""}" aria-hidden="true"><div>{items}</div><div>{items}</div></div>\n'


def footer(S):
    return (f'<footer class="foot"><div class="wrap"><span>{E(S["name"])} · {E(S["town"])}, IL · <a href="tel:{S["tel"]}">{S["phone"]}</a></span>'
            f'<span>Sample site by Nolan Day Studio. Not the business\'s official site.</span></div></footer>\n'
            f'<div class="cbar" id="cbar"><a class="btn acc" href="tel:{S["tel"]}">{PHONE}Call</a><a class="btn ghost" href="sms:{S["tel"]}">{CHAT}Text</a></div>\n')


def site_json(S):
    return f'<script type="application/json" id="nds-site">{json.dumps({"name": S["name"], "short": S["short"], "town": S["town"], "tel": S["tel"]})}</script>\n'


def counter(cid):
    return ('<script>/*nds-count*/(function(){try{var ls=function(){try{return localStorage.getItem("nds_nc")}catch(e){return null}};'
            'if(location.hash==="#nc"){try{localStorage.setItem("nds_nc","1")}catch(e){}}if(navigator.webdriver||ls())return;'
            f'fetch("https://abacus.jasoncameron.dev/hit/ndstudio/{cid}",{{keepalive:true}}).catch(function(){{}})}}catch(e){{}}}})();</script>\n')


def chips(key, opts, multi=False):
    return (f'<div class="chips" data-chips="{key}"{" data-multi" if multi else ""}>'
            + "".join(f'<button class="chip" type="button" aria-pressed="false">{E(o)}</button>' for o in opts) + "</div>")


# ---------------------------------------------------------------- Starter
def starter(S):
    K = S["K"]
    o = [page_head(S, 300), shop_json(S), "</head>\n", f'<body class="t300 {S["fcls"]}">\n', bar(S, 300), header(S), '<main id="main">\n']
    o.append(f'<section class="hero" data-first><div class="wrap"><div><p class="eyebrow">{E(S["label"])} · {E(S["town"])}, IL</p>{h1(S["head"])}'
             f'<p class="lede">{E(S["lede"])} Call or text, or send a request in a minute.</p>'
             f'<div class="acts"><a class="btn acc" href="tel:{S["tel"]}">{PHONE}Call {S["phone"]}</a><a class="btn ghost" href="#text">{CHAT}Text instead</a></div>{proof(S)}</div>'
             f'<div class="sheet" data-par>{drawing(S, "art1")}'
             f'<div class="tblock"><b>{E(S["short"])}</b><span>Sheet 1 · {E(S["label"])}</span></div>'
             f'<a class="built" href="#services" style="--bt:{min(4.4, art.draw(K["fam"], K["v"], "x").total() + .6):.1f}s"><i>{ico(S["svc"][0]["i"], "")}</i><span>Drawn for {E(S["short"])}<small>{E(S["town"])}, IL</small></span></a>'
             '</div></div></section>\n')
    o.append(marquee(S))
    cards = "".join(f'<li class="card rv" style="--d:{i * .07:.2f}s">{ico(s["i"])}<h3>{E(s["t"])}</h3><p>{E(s["d"])}</p></li>' for i, s in enumerate(S["svc"]))
    o.append(f'<section class="sec light" id="services"><div class="wrap"><div class="head split"><div><p class="eyebrow">What {E(S["short"])} does</p>'
             f'<h2 data-wr>The work, <em>spelled out.</em></h2></div><p class="intro">Every kind of job, in plain words. Call or text about any of it.</p></div>'
             f'<ul class="cards{" c2" if len(S["svc"]) == 4 else ""}">{cards}</ul></div></section>\n')
    o.append(f'<section class="sec dark" id="text"><div class="wrap tx"><div><p class="eyebrow">Rather text than call?</p><h2 data-wr>Tap it. <em>The text writes itself.</em></h2>'
             f'<p class="intro">Pick what you need and when. It opens your own messages app, addressed to {E(S["short"])}.</p>'
             f'<div class="grp"><p class="k">{E(K["ask"])}</p>{chips("job", K["chips"])}</div>'
             f'<div class="grp"><p class="k">When?</p>{chips("when", K["when"])}</div></div>'
             f'<div class="phone rv" data-texter><div class="scr"><div class="who"><div class="av">{E(S["mk"])}</div><b>{E(S["short"])}</b>{S["phone"]}</div>'
             f'<div class="typing" aria-hidden="true"><i></i><i></i><i></i></div><p class="bub" data-msg aria-live="polite"></p>'
             f'<a class="btn acc send" data-send href="sms:{S["tel"]}">{CHAT}Send this text</a><small>Nothing is sent from this page.</small></div></div></div></section>\n')
    how = "".join(f'<li class="rv" style="--d:{i * .08:.2f}s"><b>{i + 1}</b><h3>{E(t)}</h3><p>{E(x)}</p></li>' for i, (t, x) in enumerate(S["steps"]))
    o.append(f'<section class="sec light" id="how"><div class="wrap"><div class="head"><p class="eyebrow">How it goes</p><h2 data-wr>Simple, <em>start to finish.</em></h2></div>'
             f'<ol class="how">{how}</ol></div></section>\n')
    o.append(contact(S, form=True))
    o += ["</main>\n", footer(S), site_json(S), f'<script src="/assets/studio/s.js?v={V}"></script>\n', counter(S["slug"]), "</body>\n</html>\n"]
    return "".join(o)


def contact(S, form=True):
    K = S["K"]
    rt = (f'<li>{STAR}{S["rating"]:g} stars from {S["reviews"]} reviews</li>' if S["rating"] else "")
    f = ""
    if form:
        f = (f'<form class="form rv" data-req><h3>Send a request</h3><p class="sub">A few details and {E(S["short"])} gets back to you.</p>'
             f'<div class="row2"><label>Name<input name="name" autocomplete="name" data-k="name"></label><label>Phone<input name="phone" type="tel" autocomplete="tel" data-k="phone"></label></div>'
             f'<label>{E(K["ask"])}<select name="job" data-k="job"><option value="">Choose one</option>' + "".join(f"<option>{E(s['t'])}</option>" for s in S["svc"]) + "<option>Something else</option></select></label>"
             f'<label>Anything else?<textarea name="note" data-k="note"></textarea></label><button class="btn acc" type="submit">Send request</button><p class="fine" aria-live="polite"></p></form>')
    return (f'<section class="sec dark" id="contact"><div class="wrap ct"><div><p class="eyebrow">Get in touch</p><h2 data-wr>Ready when <em>you are.</em></h2>'
            f'<a class="big" href="tel:{S["tel"]}">{S["phone"]}</a><ul><li>{PHONE}Call or text {E(S["short"])} directly</li><li>{PIN}{E(S["town"])}, Illinois</li>{rt}</ul></div>'
            f'{f}</div></section>\n')


# ---------------------------------------------------------------- Signature and Immersive parts
def svc_index(S):
    rows = "".join(f'<li class="rv"><span class="n">{i + 1:02d}</span><h3>{E(s["t"])}</h3><p>{E(s["d"])}</p><span class="ar">{ARROW}</span>'
                   f'<template>{ico(s["i"], "")}</template></li>' for i, s in enumerate(S["svc"]))
    return (f'<section class="sec light" id="services"><div class="wrap"><div class="head split"><div><p class="eyebrow">Services</p><h2 data-wr>{E(S["head2"][0])}<em>{E(S["head2"][1])}</em></h2></div>'
            f'<p class="intro">{E(S["lede"])}</p></div><ul class="svc">{rows}</ul></div><div class="peek" aria-hidden="true"></div></section>\n')


def studio(S, sid):
    st = S["K"].get("studio")
    if not st:
        return ""
    t = st["type"]
    k = f'<p class="eyebrow">Try it</p><h3>{E(st["title"])}</h3><p class="sub2">{E(st["sub"])}</p>'
    go = '<a class="btn acc" href="#plan">Add it to my request</a><p class="fine">Whatever you pick shows up on the request below.</p>'
    if t == "swatch":
        first = st["opts"][0]
        pad = (f'<div class="pad" style="--paint:{first[1]}">{drawing(S, sid, auto=None)}<p class="cap"><i></i><b>{E(first[0])}</b></p></div>')
        sw = "".join(f'<button type="button" style="--c:{c}" data-c="{c}" data-n="{E(n)}" aria-label="{E(n)}" aria-pressed="{"true" if i == 0 else "false"}"></button>'
                     for i, (n, c) in enumerate(st["opts"]))
        tg = ""
        if st.get("tog"):
            tg = f'<div class="tg"><span>{E(st["tog"][0])}<small>{E(st["tog"][1])}</small></span><button class="switch" type="button" role="switch" aria-checked="false" aria-label="{E(st["tog"][0])}" data-n="{E(st["tog"][0])}"></button></div>'
        ctl = f'{k}<p class="k">Colors</p><div class="sw">{sw}</div><p class="swn">{E(first[0])}</p>{tg}{go}'
    elif t == "wipe":
        pad = f'<div class="pad">{drawing(S, sid, auto=None)}<canvas class="grime" aria-label="Drag to clean"></canvas><p class="meter">0% clean</p></div>'
        ctl = f'{k}<button class="btn line" type="button" data-reset style="margin-top:22px;color:#fff">Mess it up again</button>{go}'
    else:
        note = f'<div class="note on"><b>{E(st["title"])}</b><p>Tap an option to see it here.</p></div>'
        pad = f'<div class="pad"><div class="diag">{drawing(S, sid, auto=None)}{note}</div></div>'
        if t == "symptom":
            g = "".join(f'<button type="button" aria-pressed="false" data-h="{E(n)}" data-note="{E(x)}">{E(n)}</button>' for n, x in st["opts"])
            ctl = f'{k}<div class="sym"{" data-one" if not st.get("multi") else ""}>{g}</div>{go}'
        else:
            g1 = "".join(f'<button type="button" aria-pressed="false" data-h="{E(s["t"])}" data-note="{E(s["d"])}">{E(s["t"])}<small>{E(s["d"])}</small></button>' for s in S["svc"][:5])
            flag = next((f for f in ("flowers", "kids", "fit", "food", "pet") if st.get(f)), None)
            lab, opts = EXTRA_GROUP[flag]
            g2 = "".join(f'<button type="button" aria-pressed="false" data-h="{E(x)}">{E(x)}</button>' for x in opts)
            ctl = f'{k}<p class="k">Pick what you want</p><div class="menu">{g1}</div><p class="k">{E(lab)}</p><div class="menu" data-one style="grid-template-columns:1fr 1fr">{g2}</div>{go}'
    multi = ' data-multi' if st.get("multi") else ""
    return (f'<section class="sec dark" id="studio"><div class="wrap"><div class="studio tool" data-tool="{t}"{multi}>{pad}<div class="ctl">{ctl}</div></div></div></section>\n')


def steps_sec(S):
    li = "".join(f'<li><b>{i + 1}</b><h3>{E(t)}</h3><p>{E(x)}</p></li>' for i, (t, x) in enumerate(S["steps"]))
    return (f'<section class="sec light" id="how"><div class="wrap"><div class="head"><p class="eyebrow">How it goes</p><h2 data-wr>Four steps, <em>no surprises.</em></h2></div>'
            f'<ol class="steps">{li}</ol></div></section>\n')


def proof_sec(S):
    if not S["rating"]:
        return ""
    return (f'<section class="sec dark"><div class="wrap rev"><div class="score rv"><b data-count="{S["rating"]:.1f}">{S["rating"]:.1f}</b><div><span class="stars">{STAR * 5}</span>'
            f'<small>from {S["reviews"]} review{"s" if S["reviews"] != 1 else ""}</small></div></div>'
            f'<div class="big3"><div class="rv"><b data-count="{S["reviews"]}">{S["reviews"]}</b><span>people took the time to leave a review</span></div>'
            f'<div class="rv" style="--d:.08s"><b data-count="{len(S["svc"])}">{len(S["svc"])}</b><span>kinds of work, each spelled out</span></div>'
            f'<div class="rv" style="--d:.16s"><b>1 tap</b><span>to call or text from any phone</span></div></div></div></section>\n')


def planner(S):
    K = S["K"]
    return (f'<section class="sec dark" id="plan"><div class="wrap planner"><div><p class="eyebrow">Plan your request</p><h2 data-wr>Tell us what <em>you need.</em></h2>'
            f'<p class="intro">Tap through it and watch your request fill in. It takes about a minute.</p>'
            f'<form data-req style="margin-top:30px"><fieldset><legend>{E(K["ask"])}</legend>{chips("job", K["chips"])}</fieldset>'
            f'<fieldset><legend>When?</legend>{chips("when", K["when"])}</fieldset>'
            f'<div class="row2"><label>Name<input name="name" autocomplete="name" data-k="name"></label><label>Phone<input name="phone" type="tel" autocomplete="tel" data-k="phone"></label></div>'
            f'<label>Anything else?<textarea name="note" data-k="note"></textarea></label><button class="btn acc" type="submit">Send request</button><p class="fine" aria-live="polite"></p></form>'
            f'<p class="direct"><a href="tel:{S["tel"]}">Call {S["phone"]}</a><a href="sms:{S["tel"]}">Text instead</a></p></div>'
            f'<aside class="ticket" aria-label="Your request"><div class="tk-h"><span class="mk">{E(S["mk"])}</span><b>{E(S["short"])}</b><small>Request</small></div>'
            f'<dl><dt>Need</dt><dd data-t="job">—</dd><dt>Picked</dt><dd data-t="pick">—</dd><dt>When</dt><dd data-t="when">—</dd><dt>Name</dt><dd data-t="name">—</dd><dt>Phone</dt><dd data-t="phone">—</dd><dt>Note</dt><dd data-t="note">—</dd></dl>'
            f'<span class="stamp">Sample</span><div class="tk-f"><span>To {E(S["short"])}</span><span>{E(S["town"])}, IL</span></div></aside></div></section>\n')


def close_sec(S):
    a, b = CLOSE[S["K"]["steps"]]
    return (f'<section class="sec dark close" id="contact"><div class="orb" aria-hidden="true"></div><div class="wrap"><p class="eyebrow">{E(S["short"])} · {E(S["town"])}, IL</p>'
            f'<h2 data-wr>{E(a)}<em>{E(b)}</em></h2><div class="acts"><a class="btn acc" href="tel:{S["tel"]}">{PHONE}Call {S["phone"]}</a>'
            f'<a class="btn ghost" href="sms:{S["tel"]}">{CHAT}Text</a></div></div></section>\n')


def signature(S):
    o = [page_head(S, 750), shop_json(S), "</head>\n", f'<body class="t750 {S["fcls"]}">\n', bar(S, 750), header(S, over=True), '<main id="main">\n']
    o.append(f'<section class="slide nophoto" data-first aria-label="From the plan to the finished job"><div class="stage">'
             f'<div class="board bp">{drawing(S, "artbp", auto=None)}</div><div class="board done">{drawing(S, "artdone", auto=None)}</div><div class="shade"></div>'
             f'<div class="tags"><div class="wrap"><span class="tag l">The plan</span><span class="tag r">Finished</span></div></div>'
             f'<div class="divider"><button class="handle" type="button" role="slider" aria-label="Drag between the plan and the finished drawing" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" data-cur="Drag">{DRAG}</button></div></div>'
             f'<div class="hcopy"><div class="wrap"><p class="eyebrow">{E(S["label"])} · {E(S["town"])}, IL</p>{h1(S["head"])}<p class="lede">{E(S["lede"])}</p>'
             f'<div class="acts"><a class="btn acc" href="tel:{S["tel"]}">{PHONE}Call {S["phone"]}</a><a class="btn ghost" href="#plan">Plan a request</a></div>'
             f'<p class="hint"><i></i>Drag the handle to go from the plan to the finished job</p></div></div></section>\n')
    o.append(marquee(S, dark=True))
    o += [svc_index(S), studio(S, "art3"), steps_sec(S), proof_sec(S), planner(S), close_sec(S)]
    o += ["</main>\n", footer(S), site_json(S), f'<script src="/assets/studio/s.js?v={V}"></script>\n<script src="/assets/studio/tools.js?v={V}"></script>\n',
          counter("t750-" + S["slug"]), "</body>\n</html>\n"]
    return "".join(o)


def immersive(S):
    K = S["K"]
    G, VR = K["scene"]
    td = {"tier": 1250, "group": G, "v": VR, "name": S["name"], "short": S["short"], "town": S["town"], "st": "IL", "phone": S["phone"], "tel": S["tel"],
          "rating": S["rating"] or 5, "reviews": S["reviews"] or 0, "jobs": K["chips"] + ["Something else"] if "Something else" not in K["chips"] else K["chips"],
          "when": K["when"], "ask": K["ask"], "noun": K["noun"]}
    desc = SCENE_DESC.get(G, "a 3D scene you can explore")
    o = [page_head(S, 1250), shop_json(S),
         '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/","@pmndrs/assets/":"https://cdn.jsdelivr.net/npm/@pmndrs/assets@1.7.0/"}}</script>\n',
         "</head>\n", f'<body class="t1250 {S["fcls"]}">\n', bar(S, 1250), header(S, over=True), '<main id="main">\n']
    o.append(f'<section class="scene" data-first data-scene="{G}" data-v="{VR}"><canvas id="c" aria-label="Interactive 3D view for {E(S["short"])}: {E(desc)}. Use the buttons to try it and to switch between day, golden hour and night."></canvas>'
             f'<div class="sc-fb">{drawing(S, "artfb")}</div><div class="veil"></div>'
             f'<div class="hcopy"><div class="wrap"><p class="eyebrow">{E(S["label"])} · {E(S["town"])}, IL</p>{h1(S["head"])}<p class="lede">{E(S["lede"])}</p>'
             f'<div class="acts"><a class="btn acc" href="tel:{S["tel"]}">{PHONE}Call {S["phone"]}</a><a class="btn ghost" href="#plan">Plan a request</a></div></div></div>'
             f'<p class="sc-hint" id="scHint">Drag to look around</p><div class="sc-dock" role="group" aria-label="3D scene controls"><div class="panel"><span class="lab">Try it</span><div class="sc-btns" id="scBtns"></div></div>'
             '<div class="panel"><span class="lab">Light</span><div class="seg" id="scTod"><button type="button" aria-pressed="false" data-v="0.1">Day</button><button type="button" aria-pressed="true" data-v="0.55">Golden</button><button type="button" aria-pressed="false" data-v="1">Night</button></div></div></div></section>\n')
    bmap = [2, 4, 5, 6]
    beats = "".join(f'<div class="beat" data-b="{bmap[i]}"><p class="n">Step {i + 1} of 4</p><h3>{E(t)}</h3><p>{E(x)}</p></div>' for i, (t, x) in enumerate(K["story"][:4]))
    o.append(f'<section class="story" aria-label="How the work comes together"><div class="wrap"><div class="beats">{beats}</div>'
             f'<div class="pin"><div class="rail"><i></i></div><div class="sheet">{drawing(S, "artstory", auto=None, extra_cls="scrub")}'
             f'<div class="tblock"><b>{E(S["short"])}</b><span>{E(S["label"])} · {E(S["town"])}</span></div></div></div></div></section>\n')
    o.append(marquee(S))
    o += [svc_index(S), studio(S, "art3"), steps_sec(S), proof_sec(S), planner(S), close_sec(S)]
    o += ["</main>\n", footer(S), site_json(S), f'<script type="application/json" id="t-data">{json.dumps(td)}</script>\n',
          '<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>\n',
          f'<script src="/assets/studio/s.js?v={V}" defer></script>\n<script src="/assets/studio/tools.js?v={V}" defer></script>\n',
          f'<script type="module" src="/assets/tiers/scene.js?v={V}"></script>\n', counter("t1250-" + S["slug"]), "</body>\n</html>\n"]
    return "".join(o)


# ---------------------------------------------------------------- pitch room data (same shape as R.W. Stoneworks)
def pitch(S):
    K = S["K"]
    G = K["scene"][0]
    desc = SCENE_DESC.get(G, "a 3D scene you can explore")
    drawn = DRAWN[K["fam"]]
    svcl = [s["t"] for s in S["svc"]]
    lab = S["label"].lower()
    seen = {"facebook": "a Facebook page and no website", "dead": "a website link that no longer opens",
            "directory": "a directory listing and no website of its own"}.get(S["web"], "a map pin, a phone number and no website to tap through to")
    rt = f", your {S['rating']:g} rating" if S["rating"] else ""
    why = (f"People looking for {lab} want to see what you do before they call. Right now {S['short']} shows up online with {seen}. "
           f"These give your work{rt} and every service you offer a place to land, with your number one tap away.")
    tool = K["tool"]
    st = K.get("studio")
    sig_tool = tool[0].lower() + tool[1:] if st else "a request planner that fills in as people choose"
    b = f"/p/2e8e4a/{S['slug']}/"
    noun = K["noun"]
    tools = {"essential": f"A {drawn} drawing that draws itself", "signature": f"Plan-to-finished slider and {sig_tool}", "immersive": desc}
    versions = {
        "essential": {"blurb": f"The clean, fast version: one page with your services and your number, opening on a {drawn} drawing that draws itself. Or $0 down and $99 a month with hosting and changes included.",
                      "features": ["One fast page, up to 5 sections", "Tap-to-call bar on every phone screen", f"A {drawn} drawing that draws itself as the page opens",
                                   f"Text-the-{noun} button: tap what you need and the text writes itself", "Your services, your number and a request form" + (f", plus your {S['rating']:g} rating" if S["rating"] else "")]},
        "signature": {"blurb": f"Art-directed: drag from the plan to the finished drawing, {sig_tool}, and a request planner that fills in a ticket as people choose.",
                      "features": ["Everything in Starter, up to 7 sections", f"Custom look and type made for {S['short']}", "Drag from the plan to the finished drawing",
                                   tool if st else "A services list with a moving preview", "Request planner that fills in a live ticket", "Two rounds of changes"]},
        "immersive": {"blurb": f"The showpiece: {desc}, then a drawing that builds itself step by step as people scroll. Everything in Signature too.",
                      "features": ["Everything in Signature", f"A real-time 3D scene: {desc}", "Day, golden hour and night lighting", "A drawing that builds step by step with the scroll",
                                   "Built to be the site people remember and share"]},
    }
    compare = [["Built for phones first, tap-to-call on every screen", 1, 1, 1],
               ["Your services, your number and a request form" + (f", with your {S['rating']:g} rating" if S["rating"] else ""), 1, 1, 1],
               [f"Text-the-{noun} button", 1, 1, 1], ["Business details set up for Google search", 1, 1, 1], ["Live the same day you approve it", 1, 1, 1],
               [f"Custom look and type made for {S['short']}, not a template", 0, 1, 1], ["From the plan to the finished drawing", 0, 1, 1]]
    if st:
        compare.append([tool, 0, 1, 1])
    compare += [["Request planner with a live ticket", 0, 1, 1], [desc[0].upper() + desc[1:], 0, 0, 1],
                ["Rounds of changes included", "1 (any time on $99/mo)", "2", "2"], ["Sections", "up to 5", "up to 7", "up to 7"]]
    tour = [["Tap-to-call on every screen", f"Your number, {S['phone']}, sits at the top and stays on screen as people scroll, so anyone who needs you reaches you in one tap."],
            ["Every service spelled out", andlist(svcl) + ", each with its own line in plain words."],
            ["Made for your trade", f"The drawings, colors and wording are made for {lab} in {S['town']}, not a template with your name dropped in."],
            ["Requests while you're busy", "People who'd rather not call can tap what they need and send you a text, or fill in a short request."]]
    trys = {"essential": "Watch the drawing finish itself, then scroll to \"Rather text than call?\" and tap what you need.",
            "signature": "Drag the handle on the first screen between the plan and the finished drawing" + (", then try the tool further down." if st else ", then fill in the request planner."),
            "immersive": "Use the buttons on the first screen to try the 3D scene, then scroll slowly and watch the drawing build."}
    return {"slug": S["slug"], "name": S["name"], "short": S["short"], "town": S["town"], "state": "IL", "phone": S["phone"], "trade": S["label"], "services": svcl,
            "samples": {"essential": b, "signature": b + "750/", "immersive": b + "1250/"}, "why": why, "tools": tools, "versions": versions, "compare": compare,
            "tour": tour, "try": trys, "rating": f"{S['rating']:g}" if S["rating"] else "", "reviews": S["reviews"] or 0,
            "thumbs": {"essential": b + "shots/v300.jpg", "signature": b + "shots/v750.jpg", "immersive": b + "shots/v1250.jpg"}}


def shop_json(S):
    return f'<script type="application/json" id="nds-shop">{json.dumps(pitch(S))}</script>\n'


def build(lead, force=False):
    S = shop(lead)
    d = os.path.join(ROOT, "p", "2e8e4a", S["slug"])
    idx = os.path.join(d, "index.html")
    if os.path.exists(idx):
        with open(idx) as f:
            if MARK not in f.read(400):
                raise SystemExit(f"refusing to overwrite hand-built page {S['slug']}")
    for sub, fn in (("", starter), ("750", signature), ("1250", immersive)):
        p = os.path.join(d, sub)
        os.makedirs(p, exist_ok=True)
        with open(os.path.join(p, "index.html"), "w") as f:
            f.write(fn(S))
    return S


if __name__ == "__main__":
    leads = json.load(open(sys.argv[1]))
    want = set(sys.argv[2:])
    for L in leads:
        if want and L.get("slug") not in want:
            continue
        S = build(L)
        print(S["slug"], S["key"], len(S["svc"]))
