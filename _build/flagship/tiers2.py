"""Signature ($750) and Immersive ($1,250) pages for the flagship kit."""
import json
import os

import kit
from kit import E, V, COPY, THEME, IC

HERE = kit.HERE
G = {"lawn": "lawn", "tree": "tree", "painting": "paint", "auto": "auto", "body": "body"}
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
 "body": ("body-before", "body-after", "A red pickup out front with its front corner crumpled, the bumper bent and a headlight broken", "The same pickup with the corner straightened and fresh, glossy paint", "64% 55%"),
 "auto": ("auto-before", "auto-after", "A pickup up on the lift in the bay with its wheels off and the hood up", "The same pickup parked out front, back together and ready to go", "64% 55%"),
}
SVC_IMG = {
 "lawn": [("lawn-high", "A striped lawn seen from above the front walk"), ("lawn-back", "The back yard of a farmhouse, cut and tidy"), ("lawn-side", "Thick green grass along the side of a sage-green house")],
 "tree": [("tree-s3", "A tree taken down to a low stump beside a house"), ("tree-side", "A tall shade tree trimmed clear of the house"), ("tree-dusk", "A trimmed tree in front of a house at dusk")],
 "painting": [(None, ""), ("paint-after", "A farmhouse freshly painted navy with white trim"), ("paint-s2", "New white trim on window and door casings")],
 "body": [("body-close", "A pickup's front corner pushed in, with scraped paint down the side"), ("body-prime", "The same corner straightened and sprayed in grey primer, in the bay"), ("body-front", "The repaired pickup in fresh, glossy red paint")],
 "auto": [("auto-wheel", "A pickup on the lift with a wheel off, showing the brake rotor"), ("auto-hood", "A pickup with its hood up in front of the shop"), ("auto-front", "The front of a red pickup outside a brick repair shop")],
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
 "body": [("body-s1", "Drop-off", "A real look at the damage", "Every dent and scrape gets looked at up close, and you hear what it takes before work starts."),
          ("body-s3", "Body work", "Pulled straight, then primed", "The panel goes back to its shape and gets a coat of primer."),
          ("body-s4", "Paint", "Matched and blended", "Paint mixed to match, then clear coat, so the repair disappears."),
          ("body-s5", "Pick-up", "Like it never happened", "Polished up and parked out front, ready when you are.")],
 "auto": [("auto-s1", "Drop-off", "Into the bay", "Pull in, hand over the keys and say what it's been doing."),
          ("auto-s2", "A real look", "Up on the lift", "It goes up so the problem gets found, not guessed at."),
          ("auto-s3", "The work", "Wheels off, hood up", "You hear what it needs before any work starts. Then it gets fixed."),
          ("auto-s4", "Pick-up", "Back on the road", "Back together, checked over and parked out front.")],
}
VISIT = {"lawn": "From long to striped", "tree": "From overgrown to clear", "painting": "From faded to fresh", "auto": "From the bay to the road", "body": "From crumpled to like new"}
VISIT_INTRO = {"auto": "Shown on the same truck, start to finish.", "body": "Shown on the same truck, start to finish."}
TOOL_NAV = {"lawn": "Season planner", "tree": "Tree check", "painting": "Color picker", "auto": "Dash light check", "body": "Damage check"}
# body shops: tap where the damage is, then what it looks like, and get a plain answer
CAR_SVG = ('<svg viewBox="0 0 600 220" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'
           '<path class="zone" data-z="rearb" d="M26 138h36v34H26z"/><path class="zone" data-z="bed" d="M62 96h210v64h-62a42 42 0 0 0-84-4H62z"/>'
           '<path class="zone" data-z="doors" d="M282 98h150v66H282z"/><path class="zone" data-z="hood" d="M440 86h120l10 14H440z"/>'
           '<path class="zone" data-z="fender" d="M440 100h126v40l-4 14h-48a42 42 0 0 0-74-4z"/><path class="zone" data-z="frontb" d="M560 136h30v36h-30z"/>'
           '<path d="M30 172v-34l8-42h234l22-56h108l36 56h118l12 18 6 32v26h-14"/><path d="M106 172h-76M194 172h302M576 172h-14"/>'
           '<path d="M302 46h98l28 48H290z" stroke-width="2"/><path d="M362 46v48M282 96v70M436 96v70"/><path d="M62 96v62M272 96v64"/>'
           '<circle cx="150" cy="172" r="36"/><circle cx="150" cy="172" r="16"/><circle cx="520" cy="172" r="36"/><circle cx="520" cy="172" r="16"/>'
           '<path d="M566 112h18M556 150h34" stroke-width="2"/><path d="M8 208h584" stroke-width="1.4" opacity=".5"/></svg>')
ZONES = [("frontb", "Front bumper", 88, 86), ("hood", "Hood", 80, 27), ("fender", "Fender", 81, 57), ("doors", "Doors", 59, 55), ("bed", "Bed or side", 27, 50), ("rearb", "Back bumper", 11, 86)]
HURT = [
 ("scratch", "Scratch or scrape", "plan", "Good to plan ahead", "Scratch or scrape",
  "If your fingernail doesn't catch in it, it may polish out. If you can see grey primer or bare metal, it usually needs paint so rust can't start."),
 ("dent", "Dent, paint okay", "plan", "Good to plan ahead", "Dent",
  "When the paint isn't cracked, some dents can be worked back out without repainting. Ask whether yours is one of them."),
 ("both", "Dent with scratches", "soon", "Get it looked at soon", "Accident damage",
  "A dent with broken paint usually means the panel gets straightened, primed and painted to match. Bare metal can start to rust, so don't let it sit."),
 ("crack", "Cracked or torn", "soon", "Get it looked at soon", "Accident damage",
  "Cracks and tears in a bumper cover can often be repaired. When they're bad, the part gets replaced and painted to match."),
 ("crushed", "Crushed or pushed in", "stop", "Have it looked at before driving far", "Accident damage",
  "A pushed-in panel can hide damage behind it, like brackets, lights or the radiator. Have it looked at before you drive far, and keep photos for your insurance."),
]
_DL = '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{}</svg>'
DASH = [
 ("engine", "Check engine", '<path d="M8 16v12h5l3 3h12v-5h4V17h-4v-3H18v-3h-6v3z"/><path d="M4 19v7M36 19v7M13 8h7"/>', "soon", "Get it checked soon",
  "Usually an engine or emissions fault. If the light is steady, most cars are fine to drive to the shop. If it's flashing, ease off and get it in right away."),
 ("oil", "Oil pressure", '<path d="M6 20h6l4-4h10l8 6-6 8H12z"/><path d="M34 22l3-2M6 20v-5h5"/><path d="M36 28c-1.4 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.6-2-2-4z"/>', "stop", "Stop when it's safe",
  "Low oil pressure can hurt an engine fast. Pull over when it's safe, shut it off and call before driving any farther."),
 ("temp", "Temperature", '<path d="M20 6v16"/><circle cx="20" cy="27" r="5"/><path d="M26 10h5M26 15h4M26 20h5"/><path d="M6 34c3-2 5-2 8 0s5 2 8 0 5-2 8 0 5 2 6 0"/>', "stop", "Stop when it's safe",
  "The engine is running hot. Pull over when it's safe, let it cool down and call before you drive on."),
 ("battery", "Battery", '<rect x="6" y="13" width="28" height="18" rx="2"/><path d="M12 13V9h5v4M23 13V9h5v4"/><path d="M11 22h6M24 22h6M27 19v6"/>', "soon", "Get it checked soon",
  "The charging system isn't keeping up. The car may run for a while and then not start again, so don't put it off."),
 ("brake", "Brake", '<circle cx="20" cy="20" r="10"/><path d="M20 14v7M20 25v.5"/><path d="M6 10a17 17 0 0 0 0 20M34 10a17 17 0 0 1 0 20"/>', "soon", "Get it checked soon",
  "Check that the parking brake is all the way off. If the light stays on, or the pedal feels soft, have the brakes looked at before you drive far."),
 ("tire", "Tire pressure", '<path d="M10 8c-3 6-4 14-1 22h22c3-8 2-16-1-22"/><path d="M9 34h22"/><path d="M20 13v9M20 26v.5"/>', "plan", "Good to plan ahead",
  "One or more tires is low. Add air soon, and have it checked if the light comes back."),
]

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


import store  # noqa: E402
for _g in store.GROUPS:
    G[_g] = _g; HERO[_g] = store.hero(_g); SVC_IMG[_g] = store.svc_img(_g); STAGES[_g] = store.stages(_g)
    VISIT[_g] = store.VISIT[_g]; VISIT_INTRO[_g] = store.VISIT_INTRO; TOOL_NAV[_g] = store.TOOL[_g][0]
import home  # noqa: E402
for _g in home.GROUPS:
    G[_g] = _g; HERO[_g] = home.hero(_g); SVC_IMG[_g] = home.svc_img(_g); STAGES[_g] = home.stages(_g)
    VISIT[_g] = home.VISIT[_g]; VISIT_INTRO[_g] = home.VISIT_INTRO; TOOL_NAV[_g] = home.TOOL[_g][0]


def quiz(s):
    """Signature tool for storefronts: question one is the shop's own job list, question two is the trade's own."""
    g = s["group"]; v = V[s["v"]]; nav, title, intro, q2, opts, tip, note = (store.TOOL.get(g) or home.TOOL[g])
    jobs = [j for j in v["jobs"] if j not in ("Something else", "Question")]
    b1 = "".join(f'<button type="button" aria-pressed="false" data-v="{E(j)}">{E(j)}</button>' for j in jobs)
    b2 = "".join(f'<button type="button" aria-pressed="false" data-v="{o[0]}"' + (f' style="--c:{o[3]}"><i></i>' if len(o) > 3 else ">") + f'{E(o[1])}</button>' for o in opts)
    data = json.dumps({"q2": {o[0]: {"l": o[1], "t": o[2], "c": o[3] if len(o) > 3 else ""} for o in opts}, "tip": tip, "ask": v["ask"], "q2h": q2})
    return (f'<div class="tool"><div><p class="eyebrow">{E(nav)}</p><h2 id="h-tool" style="margin-top:16px">{E(title)}</h2>'
            f'<p class="intro">{E(intro)}</p><div class="qs qz" id="quiz"><div data-q="job"><h3>{E(v["ask"])}</h3><div class="opts">{b1}</div></div>'
            f'<div data-q="two"><h3>{E(q2)}</h3><div class="opts">{b2}</div></div></div><script type="application/json" id="quizData">{data}</script></div>'
            f'<div class="card verdict rv" id="verdict" aria-live="polite"><span class="lvl"><i></i><span>Two taps</span></span><h3><span class="sw" hidden></span><span class="t">{E(v["ask"])}</span></h3><p>Pick one from each list and get a plain answer.</p>'
            f'<button class="btn solid" type="button" id="qzAdd" hidden>Send this to {E(s["short"])}</button>'
            f'<p class="note">{E(note)}</p></div></div>')


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
               f'<div style="width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#f3e2d3,#e9d5c9 50%,#d9dde8);color:var(--navy)">{kit._I.format(kit.svc_icon(g, h)).replace("class=\"ic\"", "style=\"width:96px;height:96px\"")}</div>')
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
    if g in kit.QUIZ:
        return quiz(s)
    if g == "body":
        hs = "".join(f'<button type="button" class="hs" aria-pressed="false" data-z="{k}" style="left:{x}%;top:{y}%"><i></i>{E(n)}</button>' for k, n, x, y in ZONES)
        hurt = "".join(f'<button type="button" aria-pressed="false" data-v="{k}">{E(n)}</button>' for k, n, lv, lt, job, tx in HURT)
        data = json.dumps({"where": {k: n for k, n, x, y in ZONES}, "what": {k: {"name": n, "lvl": lv, "lt": lt, "job": job, "text": tx} for k, n, lv, lt, job, tx in HURT}})
        return (f'<div class="tool"><div><p class="eyebrow">Damage check</p><h2 id="h-tool" style="margin-top:16px">Show us where it got hit</h2>'
                f'<p class="intro">Tap where the damage is, then what it looks like, and get a plain answer on what it usually takes.</p>'
                f'<div id="bodyCheck"><div class="car"><div class="cv" style="position:relative">{CAR_SVG}{hs}</div></div>'
                f'<div class="qs"><div data-q="what"><h3>What does it look like?</h3><div class="opts">{hurt}</div></div></div></div>'
                f'<script type="application/json" id="bodyData">{data}</script></div>'
                f'<div class="card verdict rv" id="verdict" aria-live="polite"><span class="lvl"><i></i><span>Two taps</span></span><h3>Where did it get hit?</h3><p>Tap the spot on the truck, then pick what it looks like.</p>'
                f'<button class="btn solid" type="button" id="bcAdd" hidden>Send this to {E(s["short"])}</button>'
                f'<p class="note">A quick guide, not an estimate. {E(s["short"])} will tell you what it really needs.</p></div></div>')
    if g == "auto":
        btns = "".join(f'<button type="button" aria-pressed="false" data-k="{k}">{_DL.format(ic)}{E(n)}</button>' for k, n, ic, lv, lt, tx in DASH)
        data = json.dumps({k: {"name": n, "lvl": lv, "lt": lt, "text": tx} for k, n, ic, lv, lt, tx in DASH})
        return (f'<div class="tool"><div><p class="eyebrow">Dash light check</p><h2 id="h-tool" style="margin-top:16px">A light came on. Now what?</h2>'
                f'<p class="intro">Tap the light you\'re seeing and get a plain answer on what it usually means and how soon to deal with it.</p>'
                f'<div class="opts dash" id="dashCheck" role="group" aria-label="Warning light">{btns}</div><script type="application/json" id="dashData">{data}</script></div>'
                f'<div class="card verdict rv" id="verdict" aria-live="polite"><span class="lvl"><i></i><span>Tap a light</span></span><h3>Which light is on?</h3><p>One tap and you\'ll know where you stand.</p>'
                f'<button class="btn solid" type="button" id="dlAdd" data-job="Warning light" hidden>Send this to {E(s["short"])}</button>'
                f'<p class="note">A quick guide, not a diagnosis. {E(s["short"])} will tell you what it really needs.</p></div></div>')
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
             "painting": "Which rooms or which sides of the house, and any colors you're thinking about.",
             "auto": "The year, make and model, and what it's doing. A photo or a short video of the noise or the light helps.",
             "body": "The year, make and model, where the damage is, and a few photos from different angles. A claim number too, if you have one.", **store.READY, **home.READY}[g]
    items = [("How do I get a quote?", f"Call or text {s['phone']}, or plan your request above and send it with your name and number. Tell {s['short']} what you need and where you are."),
             ("What should I have ready?", ready),
             ("Which towns do you work in?", ", ".join(kit.towns(s)) + ". Close by but not listed? Ask anyway.")]
    if g in store.GROUPS:
        q = COPY[g]["quote_h"].replace("your ", "my ")
        items[0] = (f"How do I {q[0].lower() + q[1:]}?", f"Call or text {s['phone']}, or pick your choices above and send them with your name and number.")
        items[2] = ("Where are you?", f"{s['short']} is in {s['town']}, {kit.state(s)}. The Google Maps link on this page has directions.")
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
        "BA_X": "74" if g == "body" else "50",
        "NAVYHEX": THEME[g]["navy"], "HERO_BEFORE": src(g, b), "HERO_BEFORE_M": src(g, b, True), "HERO_AFTER": src(g, a), "HERO_AFTER_M": src(g, a, True),
        "BEFORE_ALT": balt, "AFTER_ALT": aalt, "POS": pos, "H1": f"{E(h[0])} <em>{E(h[1])}</em>",
        "LEDE": E(v["lede"].replace("{town}", s["town"])), "STRIP": strip(s), "SVC_H": c["svc_h"], "SVC_INTRO": c["svc_intro"], "SVC": services(s),
        "VISIT_H": VISIT[g], "VISIT_INTRO": VISIT_INTRO.get(g, "Shown on the same house, start to finish."), "STAGE_IMGS": imgs, "STAGE_STEPS": steps,
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
