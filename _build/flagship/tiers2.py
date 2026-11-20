"""Signature ($750) and Immersive ($1,250) pages for the flagship kit."""
import json
import os

import kit
from kit import E, V, COPY, THEME, IC

HERE = kit.HERE
G = {"lawn": "lawn", "tree": "tree", "painting": "paint"}
NATIVE = {}  # render name -> native width, filled from renders.json
for r in json.load(open(os.path.join(HERE, "renders.json"))):
    NATIVE[r["name"]] = r["w"]
SIZES = {2400: (1200, 2400), 1600: (800, 1600), 1200: (800, 1200)}


def src(g, name, small=False):
    w = SIZES[NATIVE[name]]
    return f"/f/img/{G[g]}/{name}-{w[0] if small else w[1]}.webp"


def srcset(g, name):
    return ", ".join(f"/f/img/{G[g]}/{name}-{w}.webp {w}w" for w in SIZES[NATIVE[name]])


def pic(g, name, alt, sizes="(max-width:900px) 100vw, 40vw", cls="", eager=False):
    w = NATIVE[name]; h = {2400: 1350, 1600: 1000 if not name.startswith("paint-c") else 900, 1200: 800}[w]
    return (f'<img{" class=" + chr(34) + cls + chr(34) if cls else ""} src="{src(g, name, True)}" srcset="{srcset(g, name)}" sizes="{sizes}" width="{w}" height="{h}" alt="{E(alt)}"'
            f'{"" if eager else " loading=" + chr(34) + "lazy" + chr(34)} decoding="async">')


HERO = {
 "lawn": ("lawn-before", "lawn-after", "A farmhouse yard grown long and seedy", "The same yard cut short with light and dark mowing stripes", "45% 50%"),
 "tree": ("tree-before", "tree-after", "A big shade tree with heavy limbs hanging over a farmhouse roof", "The same tree trimmed back off the roof with its canopy raised", "34% 50%"),
 "painting": ("paint-before", "paint-after", "A farmhouse with faded tan siding and dull trim", "The same farmhouse painted navy with crisp white trim", "48% 50%"),
}
SVC_IMG = {
 "lawn": [("lawn-high", "A striped lawn seen from above the front walk"), ("lawn-back", "The back yard of a farmhouse, cut and tidy"), ("lawn-side", "Thick green grass along the side of a sage-green house")],
 "tree": [("tree-s3", "A tree taken down to a low stump beside a house"), ("tree-side", "A tall shade tree trimmed clear of the house"), ("tree-dusk", "A trimmed tree in front of a house at dusk")],
 "painting": [(None, ""), ("paint-after", "A farmhouse freshly painted navy with white trim"), ("paint-s2", "New white trim on window and door casings")],
}
STAGES = {
 "lawn": [("lawn-s1", "Before", "Two weeks of growth", "Long, seedy grass that has started to take over the yard."),
          ("lawn-s2", "First passes", "Straight lines", "The mower works across the yard in clean, overlapping rows."),
          ("lawn-s3", "Halfway", "The pattern shows", "Light and dark stripes appear wherever it's been cut."),
          ("lawn-s4", "Done", "Cut and striped", "The whole yard even, striped and tidy.")],
 "tree": [("tree-s1", "Before", "Limbs over the roof", "Heavy limbs hang over the house, low and in the way."),
          ("tree-s2", "Trimmed", "Off the roof, canopy raised", "The limbs over the house come off and the canopy is lifted."),
          ("tree-s3", "Or taken down", "Down to a stump", "When a tree has to go, it comes down and the stump stays low.")],
 "painting": [("paint-s1", "Before", "Faded and tired", "Siding and trim that have seen too many summers."),
              ("paint-s2", "Trim first", "Crisp white trim", "Corners, windows and doors get their clean lines."),
              ("paint-s3", "Body color", "A whole new look", "The siding goes on and the house looks new again.")],
}
VISIT = {"lawn": "From long to striped", "tree": "From overgrown to clear", "painting": "From faded to fresh"}
TOOL_NAV = {"lawn": "Season planner", "tree": "Tree check", "painting": "Color picker"}

MONTHS = [
 ("March", ["Spring cleanup: leaves, sticks and what winter left behind", "A first look at bare or thin spots"], "Spring cleanup"),
 ("April", ["The first mows of the year", "Spring cleanup if it hasn't happened yet", "Seeding bare spots while it's cool"], "Spring cleanup"),
 ("May", ["Weekly mowing as the grass grows fastest", "Crisp edges along beds, walks and the drive"], "Weekly mowing"),
 ("June", ["Weekly mowing, cut a little higher as it heats up", "Trimming along fences and beds"], "Weekly mowing"),
 ("July", ["Mowing high and less often in dry spells", "Keeping edges sharp"], "Weekly mowing"),
 ("August", ["Mowing through the late summer", "Planning fall seeding for thin spots"], "Weekly mowing"),
 ("September", ["The best time of year to seed and fix thin spots", "Mowing picks back up as it cools"], "Weekly mowing"),
 ("October", ["Leaves start coming down", "Fall cleanup before the snow"], "Fall cleanup"),
 ("November", ["Leaf removal", "The last mow of the season"], "Leaves"),
]
SWATCH = [("navy", "Navy", "#26324a"), ("white", "White", "#f2f1ec"), ("sage", "Sage", "#9aab8f"), ("charcoal", "Charcoal", "#3a3d40"),
          ("red", "Barn red", "#7a2e26"), ("wheat", "Wheat", "#d6c49a"), ("slate", "Slate blue", "#5d7489")]


def strip(s):
    tw = kit.towns(s); items = []
    if kit.rating_ok(s):
        n = s["reviews"]
        items.append(f'<span class="n" data-count="{kit.rnum(s)}">{kit.rnum(s)}</span><p><b>Stars on Google</b>from {n} review{"s" if n != 1 else ""}</p>')
    if len(tw) > 1:
        items.append(f'<span class="n">{len(tw)}</span><p><b>Towns</b>{E(s["town"])} and nearby</p>')
    items.append(f'<span class="n">1 tap</span><p><b>To call or text</b><a href="tel:{s["tel"]}" class="tnum" style="color:inherit">{s["phone"]}</a></p>')
    if len(items) < 3:
        items.append('<span class="n">1 min</span><p><b>To ask for a quote</b>with the planner below</p>')
    return "".join(f'<div class="it">{x}</div>' for x in items[:3])


def services(s):
    g = s["group"]; v = V[s["v"]]; out = []
    for i, (h, p) in enumerate(v["services"]):
        job = v["jobs"][i] if i < len(v["jobs"]) - 1 else v["jobs"][0]
        im, alt = SVC_IMG[g][i]
        fig = (pic(g, im, alt) if im else
               f'<div style="width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#f3e2d3,#e9d5c9 50%,#d9dde8);color:var(--navy)">{kit._I.format(kit.SVC_ICON.get(h, kit.SVC_ICON["_more"])).replace("class=\"ic\"", "style=\"width:96px;height:96px\"")}</div>')
        out.append(f'<div class="sv rv"><span class="no">0{i + 1}</span><div><h3>{E(h)}</h3></div><div><p>{E(p)}</p>'
                   f'<a class="btn line ask" href="#plan" data-job="{E(job)}">Ask about this {IC["ARROW"]}</a></div><figure>{fig}</figure></div>')
    return "".join(out)


def stage(s):
    g = s["group"]; st = STAGES[g]
    imgs = "".join(pic(g, n, f"{k}: {h}", sizes="(max-width:860px) 100vw, 56vw", cls="on" if i == 0 else "") for i, (n, k, h, p) in enumerate(st))
    steps = "".join(f'<li{" class=" + chr(34) + "on" + chr(34) if i == 0 else ""}><span class="k">{i + 1} · {E(k)}</span><h3>{E(h)}</h3><p>{E(p)}</p></li>' for i, (n, k, h, p) in enumerate(st))
    return imgs, steps


def tool(s):
    g = s["group"]
    if g == "lawn":
        data = json.dumps({str(i + 2): {"name": m, "items": it, "job": j} for i, (m, it, j) in enumerate(MONTHS)})
        btns = "".join(f'<button type="button" data-m="{i + 2}" aria-pressed="false">{m[:3]}</button>' for i, (m, it, j) in enumerate(MONTHS))
        return (f'<div class="tool"><div><p class="eyebrow">Season planner</p><h2 id="h-tool" style="margin-top:16px">What the yard needs, month by month</h2>'
                f'<p class="intro">Tap a month to see what yards around {E(s["town"])} usually need then, and add it to your request.</p>'
                f'<div class="months" id="months" role="group" aria-label="Month">{btns}</div><script type="application/json" id="monthData">{data}</script></div>'
                f'<div class="card rv" id="moCard" data-check=\'{IC["CHECK"]}\' aria-live="polite"><p class="eyebrow" style="color:var(--muted)">In your yard</p><p class="mo" style="margin-top:10px">March</p><ul></ul>'
                f'<button class="btn solid" type="button" id="moAdd" data-job="Spring cleanup">Ask about spring cleanup</button>'
                f'<p class="note">A general guide for {"Central Illinois" if kit.st(s) == "IL" else kit.state(s)} yards. {E(s["short"])} will tell you what yours needs.</p></div></div>')
    if g == "tree":
        q = [("size", "How tall is it?", [("small", "Under 20 ft"), ("mid", "20 to 40 ft"), ("big", "Over 40 ft")]),
             ("near", "How close to the house?", [("touching", "Touching it"), ("close", "Within 10 ft"), ("clear", "Farther away")]),
             ("what", "What's going on?", [("roof", "Limbs over the roof"), ("dead", "Dead limbs"), ("leaning", "Leaning"), ("storm", "Storm damage"), ("gone", "I want it gone"), ("stump", "A stump")])]
        qs = "".join(f'<div data-q="{k}"><h3>{E(t)}</h3><div class="opts">' + "".join(f'<button type="button" aria-pressed="false" data-v="{v}">{E(l)}</button>' for v, l in o) + "</div></div>" for k, t, o in q)
        return (f'<div class="tool"><div><p class="eyebrow">Tree check</p><h2 id="h-tool" style="margin-top:16px">Three taps, and you know where you stand</h2>'
                f'<p class="intro">Answer three questions about the tree and get a plain summary to send.</p><div class="qs" id="treeCheck">{qs}</div></div>'
                f'<div class="card verdict rv" id="verdict" aria-live="polite"><span class="lvl"><i></i><span>Answer all three</span></span><h3>Tell us about the tree</h3><p></p>'
                f'<button class="btn solid" type="button" id="tcAdd" hidden>Send this to {E(s["short"])}</button>'
                f'<p class="note">A quick guide, not an inspection. {E(s["short"])} will tell you what the tree really needs.</p></div></div>')
    sw = "".join(f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}" data-src="{src(g, "paint-c-" + k, True)}" data-srcset="{srcset(g, "paint-c-" + k)}" '
                 f'data-alt="The farmhouse painted {E(n.lower())}" style="--c:{c}"><i></i>{E(n)}</button>' for i, (k, n, c) in enumerate(SWATCH))
    return (f'<div class="tool"><div><p class="eyebrow">Color picker</p><h2 id="h-tool" style="margin-top:16px">Pick a color. Watch the house change.</h2>'
            f'<p class="intro">Tap a color to see it on the whole house, trim and all. On your site this can use your own past jobs.</p>'
            f'<div class="swatches" id="swatches" role="group" aria-label="Siding color">{sw}</div>'
            f'<p class="note" style="margin-top:16px;font-size:14px;color:var(--muted)">Showing: <b id="paintName" style="color:var(--ink)">Navy</b></p></div>'
            f'<div class="paint rv" id="paintPic">{pic(g, "paint-c-navy", "The farmhouse painted navy", sizes="(max-width:900px) 100vw, 680px")}</div></div>')


def picks(s):
    v = V[s["v"]]
    grp = [("job", v["ask"], v["jobs"]), ("when", "When?", v["when"]), ("reach", "How should we reach you?", ["Call me", "Text me", "Either is fine"])]
    p = "".join(f'<div><h3>{E(t)}</h3><div class="opts" data-pick="{k}" role="group" aria-label="{E(t)}">' + "".join(f'<button type="button" aria-pressed="false" data-v="{E(o)}">{E(o)}</button>' for o in opts) + "</div></div>" for k, t, opts in grp)
    rows = "".join(f'<div><dt>{t}</dt><dd data-out="{k}">—</dd></div>' for k, t in (("job", "Job"), ("when", "When"), ("reach", "Reach me")))
    return p, rows


def faq(s):
    g = s["group"]
    ready = {"lawn": "Your address and roughly how big the yard is. A photo helps if it's been a while since the last cut.",
             "tree": "Where the tree is, about how tall it is, and a photo if you can take one.",
             "painting": "Which rooms or which sides of the house, and any colors you're thinking about."}[g]
    items = [("How do I get a quote?", f"Call or text {s['phone']}, or plan your request above and send it with your name and number. Tell {s['short']} what you need and where you are."),
             ("What should I have ready?", ready),
             ("Which towns do you work in?", ", ".join(kit.towns(s)) + ". Close by but not listed? Ask anyway.")]
    return "".join(f'<details><summary>{E(q)}{IC["PLUS"]}</summary><p>{E(a)}</p></details>' for q, a in items)


def shared(s):
    t3 = open(os.path.join(HERE, "t300.src.html")).read()
    css = t3[t3.index(".contact{background"):t3.index("</style>")]
    contact = t3[t3.index('<section class="sec contact"'):t3.index("</main>")]
    foot = t3[t3.index('<footer class="foot">'):t3.index('<script src="/f/assets/kit.js')]
    return css, contact, foot


def vals750(s, tier):
    import make
    g = s["group"]; v = V[s["v"]]; c = COPY[g]
    b, a, balt, aalt, pos = HERO[g]
    h = [x.replace("{town}", s["town"]) for x in (v["h750"] if tier == 750 else v["h1250"])]
    css, contact, foot = shared(s)
    imgs, steps = stage(s); p, rows = picks(s)
    vals = make.base_vals(s, tier)
    vals.update({
        "NAVYHEX": THEME[g]["navy"], "HERO_BEFORE": src(g, b), "HERO_BEFORE_M": src(g, b, True), "HERO_AFTER": src(g, a), "HERO_AFTER_M": src(g, a, True),
        "BEFORE_ALT": balt, "AFTER_ALT": aalt, "POS": pos, "H1": f"{E(h[0])} <em>{E(h[1])}</em>",
        "LEDE": E(v["lede"].replace("{town}", s["town"])), "STRIP": strip(s), "SVC_H": c["svc_h"], "SVC_INTRO": c["svc_intro"], "SVC": services(s),
        "VISIT_H": VISIT[g], "VISIT_INTRO": "Shown on the same house, start to finish.", "STAGE_IMGS": imgs, "STAGE_STEPS": steps,
        "TOOL": tool(s), "TOOL_NAV": TOOL_NAV[g], "PICKS": p, "TICKET_ROWS": rows, "FAQ": faq(s),
        "CONTACT_CSS": css, "CONTACT": contact, "FOOT": foot,
    })
    return vals


def page750(s):
    vals = vals750(s, 750)
    src_ = open(os.path.join(HERE, "t750.src.html")).read()
    # the shared contact block carries its own placeholders: fill twice
    return kit.fill(kit.fill_partial(src_, vals), vals)


def page1250(s):
    import t1250
    return t1250.page(s, vals750(s, 1250))
