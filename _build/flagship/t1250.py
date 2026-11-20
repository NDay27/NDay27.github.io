"""Immersive ($1,250): the Signature page with its hero swapped for a scroll-told live 3D yard, and a designer panel."""
import json
import os

import kit
from kit import E, V
import tiers2
from tiers2 import pic, src, srcset

HERE = kit.HERE

CSS = """
/* the live 3D story */
.story{position:relative;background:var(--navy);color:#fff}
.scene{position:sticky;top:0;height:100svh;overflow:hidden;z-index:0}
.scene canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.2s var(--ease)}
.scene.live canvas{opacity:1}
.scene .stills img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--pos,50% 50%);opacity:0;transition:opacity .9s var(--ease)}
.scene .stills img.on{opacity:1}
.scene.live .stills{opacity:0;transition:opacity 1.2s var(--ease) .2s;pointer-events:none}
.scene::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,color-mix(in srgb,var(--navy) 70%,transparent) 0,#0000 46%),linear-gradient(180deg,#0000 70%,color-mix(in srgb,var(--navy) 60%,transparent))}
.beats{position:relative;z-index:1;margin-top:-100svh}
.beat{min-height:100svh;display:flex;align-items:center;padding:calc(var(--bar) + 90px) 0 64px}
.beat .wrap{width:100%}
.cap{max-width:30rem;padding:clamp(22px,2.6vw,32px);border-radius:18px;background:color-mix(in srgb,var(--navy) 66%,transparent);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);border:1px solid #ffffff1c;box-shadow:0 30px 60px -30px #000a}
.cap .k{font:600 12.5px/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--pencil2)}
.cap h2{font-size:clamp(30px,3.6vw,48px);margin-top:12px;letter-spacing:-.02em;line-height:1.02}
.cap p{margin-top:12px;color:#ffffffc8;font-size:17px}
.beat.hero0{align-items:flex-end;padding-bottom:clamp(40px,8vh,96px)}
.hero0 h1{font-size:clamp(46px,7vw,100px);line-height:.95;letter-spacing:-.03em;max-width:9em;font-weight:500;text-shadow:0 2px 30px #0006}
.hero0 h1 em{font-style:italic;color:var(--pencil2)}
.hero0 .lede{margin-top:20px;font-size:clamp(17px,1.5vw,20px);color:#ffffffd6;max-width:30em;text-shadow:0 1px 16px #0008}
.hero0 .acts{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.hero0 .btn.line{color:#fff}
.scroll{display:inline-flex;align-items:center;gap:10px;margin-top:26px;font-size:13.5px;color:#ffffffb0}
.scroll i{width:22px;height:34px;border:2px solid #ffffff80;border-radius:12px;position:relative}
.scroll i::after{content:"";position:absolute;left:50%;top:6px;width:4px;height:7px;margin-left:-2px;border-radius:2px;background:#fff;animation:wheel 1.8s ease-in-out infinite}
@keyframes wheel{0%{opacity:0;transform:translateY(-2px)}30%{opacity:1}100%{opacity:0;transform:translateY(10px)}}
@media (prefers-reduced-motion:no-preference){.js .beat .cap,.js .beat .hcopy{opacity:.0;transform:translateY(24px);transition:opacity .7s var(--ease),transform .7s var(--ease)}.js .beat.on .cap,.js .beat.on .hcopy{opacity:1;transform:none}}
.beat.cfgb{min-height:130svh;align-items:flex-start}
.panel{max-width:27rem}
.panel h2{font-size:clamp(28px,3vw,40px)}
.ctl{margin-top:20px}
.ctl label,.ctl .lab{display:flex;justify-content:space-between;font:600 14px/1 var(--sans);color:#fff;margin-bottom:10px}
.ctl label span,.ctl .lab span{color:var(--pencil2);font-weight:500}
.ctl input[type=range]{width:100%;accent-color:var(--pencil);height:30px}
.seg{display:flex;flex-wrap:wrap;gap:8px}
.seg button{min-height:42px;padding:0 14px;border-radius:999px;border:1px solid #ffffff38;background:#ffffff0d;color:#fff;font-weight:600;font-size:14.5px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.seg button i{width:18px;height:18px;border-radius:50%;background:var(--c);border:1px solid #fff6}
.seg button[aria-pressed="true"]{background:var(--pencil);border-color:var(--pencil);color:var(--navy)}
.panel .fine{margin-top:18px;font-size:13px;color:#ffffff9c}
.illo3d{position:absolute;right:var(--gut);bottom:16px;z-index:2;font-size:12px;color:#ffffffa0}
@media (max-width:760px){
  .scene::after{background:linear-gradient(180deg,#0000 35%,color-mix(in srgb,var(--navy) 85%,transparent) 100%)}
  .beat{align-items:flex-end;padding-bottom:28px}
  .cap{max-width:none;padding:20px}
  .cap h2{font-size:28px}
  .cap p{font-size:16px}
  .hero0 h1{font-size:44px}
  .beat.cfgb{align-items:flex-end;min-height:150svh}
  .panel{position:sticky;bottom:12px}
}
"""


def beats(s):
    g = s["group"]; v = V[s["v"]]; c = kit.COPY[g]
    h = [x.replace("{town}", s["town"]) for x in v["h1250"]]
    if g == "lawn":
        B = [("hero", .56, {"cut": 0, "stripes": 1}, None, "lawn-before", None),
             ("high", .5, {"cut": 0}, None, "lawn-s1", ("01 · Before", "Two weeks of growth", "Long, seedy grass that has started to take over the yard.")),
             ("high", .5, {"cut": 0}, {"cut": 1}, "lawn-s3", ("02 · Mowing", "Straight, overlapping passes", "Keep scrolling and watch the yard get cut, row by row.")),
             ("side", .45, {"cut": 1}, None, "lawn-side", ("03 · Done", "Light and dark stripes", "Even height, clean lines, a yard that looks cared for.")),
             ("dusk", .84, {"cut": 1}, None, "lawn-dusk", ("04 · Evening", "Still sharp at dusk", "The kind of yard people slow down to look at.")),
             ("cfg", .56, {}, None, "lawn-after", "cfg")]
        user = {"cut": 1, "stripes": 1, "tod": .56}
        ctl = ('<div class="ctl"><label for="u-cut">Mow the yard <span>drag</span></label><input id="u-cut" type="range" min="0" max="100" value="100" data-set="cut"></div>'
               '<div class="ctl"><div class="lab">Stripes</div><div class="seg" role="group" aria-label="Stripes"><button type="button" aria-pressed="true" data-set="stripes" data-v="1">On</button><button type="button" aria-pressed="false" data-set="stripes" data-v="0">Off</button></div></div>')
        ttl = "Your turn: mow it yourself"
    elif g == "tree":
        B = [("hero", .56, {"trim": 0, "down": 0}, None, "tree-before", None),
             ("close", .5, {"trim": 0, "down": 0}, None, "tree-s1", ("01 · Before", "Limbs over the roof", "Heavy limbs hang low over the house, with some deadwood mixed in.")),
             ("close", .5, {"trim": 0, "down": 0}, {"trim": 1, "down": 0}, "tree-s2", ("02 · Trimming", "Cut back and raised", "Keep scrolling and watch the limbs come off the roof.")),
             ("side", .45, {"trim": 1, "down": 0}, None, "tree-side", ("03 · Done", "Clear of the house", "The roof is clear, the canopy is lifted and the yard gets light again.")),
             ("dusk", .84, {"trim": 1, "down": 0}, None, "tree-dusk", ("04 · Evening", "No limbs over the roof", "Nothing scraping the shingles in the next storm.")),
             ("cfg", .56, {}, None, "tree-after", "cfg")]
        user = {"trim": 1, "down": 0, "tod": .56}
        ctl = ('<div class="ctl"><label for="u-trim">Trim the tree <span>drag</span></label><input id="u-trim" type="range" min="0" max="100" value="100" data-set="trim"></div>'
               '<div class="ctl"><div class="lab">Or take it down</div><div class="seg" role="group" aria-label="Tree"><button type="button" aria-pressed="true" data-set="down" data-v="0">Keep the tree</button><button type="button" aria-pressed="false" data-set="down" data-v="1" data-img="' + src(g, "tree-s3", True) + '">Take it down</button></div></div>')
        ttl = "Your turn: trim it or take it down"
    else:
        B = [("hero", .56, {"body": 0, "trimT": 0}, None, "paint-before", None),
             ("close", .5, {"body": 0, "trimT": 0}, None, "paint-s1", ("01 · Before", "Faded and tired", "Siding and trim that have seen too many summers.")),
             ("close", .5, {"body": 0, "trimT": 0}, {"body": 0, "trimT": 1}, "paint-s2", ("02 · Trim first", "Crisp white trim", "Keep scrolling: corners, windows and doors get their clean lines.")),
             ("hero", .5, {"body": 0, "trimT": 1}, {"body": 1, "trimT": 1}, "paint-s3", ("03 · Body color", "A whole new look", "The siding goes on and the house looks new again.")),
             ("dusk", .84, {"body": 1, "trimT": 1}, None, "paint-c-navy", ("04 · Evening", "Looks right in any light", "Clean lines that still read at dusk.")),
             ("cfg", .56, {}, None, "paint-c-navy", "cfg")]
        user = {"body": 1, "trimT": 1, "color": 0x2c3e55, "trimColor": 0xf2f1ec, "tod": .56}
        sw = "".join(f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}" data-set="color" data-v="#{h[1:]}" data-label="{E(n)}" data-img="{src(g, "paint-c-" + k, True)}" style="--c:{h}"><i></i>{E(n)}</button>'
                     for i, (k, n, h) in enumerate([("navy", "Navy", "#2c3e55"), ("white", "White", "#f4f2ec"), ("sage", "Sage", "#a9b8a0"), ("charcoal", "Charcoal", "#3b3e42"),
                                                     ("red", "Barn red", "#7a2e26"), ("wheat", "Wheat", "#d6c49a"), ("slate", "Slate blue", "#5d7489")]))
        ctl = (f'<div class="ctl"><div class="lab">Siding <span id="cfgName">Navy</span></div><div class="seg" role="group" aria-label="Siding color">{sw}</div></div>'
               '<div class="ctl"><div class="lab">Trim</div><div class="seg" role="group" aria-label="Trim color"><button type="button" aria-pressed="true" data-set="trimColor" data-v="#f2f1ec">White</button><button type="button" aria-pressed="false" data-set="trimColor" data-v="#1b1d20">Black</button></div></div>')
        ttl = "Your turn: pick the color"
    tod = ('<div class="ctl"><div class="lab">Light</div><div class="seg" role="group" aria-label="Time of day"><button type="button" aria-pressed="true" data-set="tod" data-v=".56">Day</button>'
           '<button type="button" aria-pressed="false" data-set="tod" data-v=".84">Dusk</button></div></div>')
    out, stills = [], []
    for i, (cam, td, fr, to, still, cap) in enumerate(B):
        d = {"cam": cam, "tod": td, "from": fr}
        if to:
            d["to"] = to
        if cap == "cfg":
            d["cfg"] = 1
        attr = E(json.dumps(d), quote=True)
        stills.append(pic(g, still, "", sizes="100vw", cls="on" if i == 0 else "", eager=i == 0).replace(' loading="lazy"', ""))
        if cap is None:
            out.append(f'<section class="beat hero0" data-hero data-beat="{attr}" aria-labelledby="h1"><div class="wrap"><div class="hcopy">'
                       f'<h1 id="h1">{E(h[0])} <em>{E(h[1])}</em></h1><p class="lede">{E(v["lede"].replace("{town}", s["town"]))}</p>'
                       f'<div class="acts"><a class="btn gold" href="#plan">{c["cta"]}</a><a class="btn line" href="tel:{s["tel"]}">{kit.IC["PHONE_ICON"]}<span class="tnum">{s["phone"]}</span></a></div>'
                       f'<p class="scroll"><i></i>Scroll to see the work happen, live in 3D</p></div></div></section>')
        elif cap == "cfg":
            out.append(f'<section class="beat cfgb" id="design" data-beat="{attr}" aria-labelledby="h-design"><div class="wrap"><div class="cap panel"><span class="k">05 · Live 3D</span>'
                       f'<h2 id="h-design">{ttl}</h2>{ctl}{tod}<p class="fine">A live 3D illustration, drawn in your browser. Your real job photos go on the site too.</p></div></div></section>')
        else:
            out.append(f'<section class="beat" data-beat="{attr}"><div class="wrap"><div class="cap"><span class="k">{E(cap[0])}</span><h2>{E(cap[1])}</h2><p>{E(cap[2])}</p></div></div></section>')
    story = (f'<div class="story" id="story" data-user="{E(json.dumps(user), quote=True)}"><div class="scene" style="--pos:{tiers2.HERO[g][4]}" aria-hidden="true"><div class="stills">{"".join(stills)}</div><canvas id="c"></canvas></div>'
             f'<div class="beats">{"".join(out)}</div><p class="illo3d">Illustration</p></div>')
    return story


def page(s, vals):
    t = open(os.path.join(HERE, "t750.src.html")).read()
    a = t.index('<section class="hero"'); b = t.index('<div class="strip">')
    t = t[:a] + "{{STORY}}\n\n" + t[b:]
    a = t.index('<section class="sec visit"'); b = t.index('<section class="sec" id="tool"')
    t = t[:a] + t[b:]
    t = t.replace('<a href="#visit">How it goes</a>', '<a href="#design">Live 3D</a>')
    t = t.replace("{{CONTACT_CSS}}", "{{CONTACT_CSS}}" + CSS)
    i = t.index('<link rel="preload" as="image"'); j = t.index("\n", i)
    t = t[:i] + '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/","@pmndrs/assets/":"https://cdn.jsdelivr.net/npm/@pmndrs/assets@1.7.0/"}}</script>' + t[j:]
    t = t.replace('<script src="/f/assets/t750.js?v={{VER}}"></script>', '<script src="/f/assets/t750.js?v={{VER}}"></script>\n<script src="/f/assets/t1250.js?v={{VER}}"></script>')
    t = t.replace("A $750 Signature site preview", "A $1,250 Immersive site preview")
    vals = dict(vals); vals["STORY"] = beats(s)
    return kit.fill(kit.fill_partial(t, vals), vals)
