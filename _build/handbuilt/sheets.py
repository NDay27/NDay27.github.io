#!/usr/bin/env python3
"""Pen-drawn hero sheets for the two hand-built $300 samples (Just Dents, Brecklin's).

The line work comes from the 3D models, like the Harlow and kit sheets:
  dumps/truck.json    labcar.html (kit pickup, side elevation)     -> justdents300 dent map
  dumps/station.json  labstation.html (brecklins1250/scene.js)    -> brecklins300 station sheet
Re-dump with a headless browser (see the lab files), then:

  node _build/handbuilt/color.cjs DIR          color stills from the same cameras
  python3 _build/handbuilt/sheets.py [--img DIR]

--img turns the stills into the WebP cut-outs the sheets fill in with (brecklins300/station-{day,night}.webp, justdents300/truck.webp).
The script rewrites the block between <!--sheet--> and <!--/sheet--> and the CSS between /*sheet*/ and /*/sheet*/ in each page,
and copies brecklins300 and justdents300 over their /p/ previews (those must stay byte copies).
"""
import json
import math
import os
import shutil
import sys

import lines

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

PEN = """.sheet{position:relative;border-radius:28px;overflow:hidden;background:var(--sp);box-shadow:0 40px 80px -44px var(--sh);border:1px solid var(--sl);max-width:520px;width:100%;justify-self:center;color:var(--si);transition:background .6s,color .6s}
.sheet::before{content:"";position:absolute;inset:0;background-image:linear-gradient(var(--sg) 1px,transparent 1px),linear-gradient(90deg,var(--sg) 1px,transparent 1px);background-size:20px 20px;background-position:-1px -1px;pointer-events:none}
.sheet .draw{position:relative;display:block;width:100%;height:auto;aspect-ratio:auto}
.draw .p{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.draw .p.thin{stroke-width:1.5}.draw .p.acc{stroke:var(--sa)}
.draw text{font:700 30px var(--sf);fill:currentColor}.draw text.s{font-weight:500;font-size:25px;opacity:.72}
.draw .nt path{fill:none;stroke:currentColor;stroke-width:1.8}.draw .nt circle{fill:currentColor}
.sheet .tb{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:0;border-top:1.5px solid var(--si)}
.sheet .tb div{padding:10px 12px 12px;min-width:0}.sheet .tb div+div{border-left:1.5px solid var(--si)}
.sheet .tb dt{font:600 10.5px/1.2 var(--sf);letter-spacing:.12em;text-transform:uppercase;opacity:.6;margin-bottom:3px}
.sheet .tb dd{margin:0;font:700 14.5px/1.25 var(--sf)}.sheet .tb dd small{display:block;font-weight:500;font-size:12.5px;opacity:.72}
@media(max-width:420px){.sheet .tb dd{font-size:13px}.sheet .tb dd small{font-size:11.5px}.sheet .tb div{padding:9px 9px 10px}}
.draw .p{opacity:.3}.draw .p.thin{opacity:.22}
@media(prefers-reduced-motion:no-preference){.draw .p{stroke-dasharray:1;stroke-dashoffset:1;animation:pen var(--d,1.2s) cubic-bezier(.5,0,.3,1) var(--w,0s) forwards,dim 1s ease 2.5s backwards}
.draw .nt,.draw .ink,.draw .wash{animation:ink .7s ease var(--w,2s) backwards}.draw .col{animation:ink 1.1s ease 2.3s backwards}}
@keyframes pen{to{stroke-dashoffset:0}}@keyframes ink{from{opacity:0}}@keyframes dim{from{opacity:1}}"""


def cutout(color, mask, crop, out, width, erode=3, clear=None):
    """Color still + flat mask -> WebP with alpha, cropped to the sheet's window. The mask is shrunk a little so no background rims the edges."""
    from PIL import Image, ImageFilter, ImageDraw
    c = Image.open(color).convert("RGB"); m = Image.open(mask).convert("L").filter(ImageFilter.MinFilter(erode))
    k = m.width / c.width
    if clear:
        ImageDraw.Draw(m).rectangle([v * k for v in clear], fill=0)
    m = m.resize(c.size, Image.LANCZOS); c.putalpha(m)
    s = c.width / crop[4]; c = c.crop([round(v * s) for v in crop[:4]])
    c = c.resize((width, round(width * c.height / c.width)), Image.LANCZOS)
    c.save(out, "WEBP", quality=82, method=6); print(os.path.relpath(out, ROOT), c.size, os.path.getsize(out) // 1024, "KB")


def station():
    d = json.load(open(os.path.join(HERE, "dumps/station.json")))
    box = (330, -40, 1900, 1080); k = 960 / (box[2] - box[0]); H = round((box[3] - box[1]) * k)
    fx, fy = (lambda x: (x - box[0]) * k), (lambda y: (y - box[1]) * k)
    L = {n: [c for c in (lines.clip(s, *box) for s in v) if c] for n, v in d["layers"].items()}
    S = d["signs"]
    # the slab edge behind the fascia shows through the sign face: keep it off the lettering
    (ax, ay), (bx, by), (qx, qy) = S["fascia"]; ux, uy, vx, vy = bx - ax, by - ay, qx - ax, qy - ay; det = ux * vy - uy * vx
    def on_face(s):
        mx, my = (s[0] + s[2]) / 2 - ax, (s[1] + s[3]) / 2 - ay
        return .02 < (mx * vy - my * vx) / det < .98 and .15 < (ux * my - uy * mx) / det < .85
    L["canopy"] = [s for s in L["canopy"] if not on_face(s)]
    P = {n: lines.path(v, fx, fy) for n, v in L.items()}
    iy = max(0, box[1]); img = (fx(box[0]), fy(iy), 960, (box[3] - iy) * k)     # the color still covers the dump window below the top margin
    cx = [fx(v) for s in L["car"] for v in (s[0], s[2])]; cy = [fy(v) for s in L["car"] for v in (s[1], s[3])]
    c0 = (max(cx) - 16, max(cy) - 6)
    svg = (f'<svg class="draw" viewBox="0 0 960 {H}" role="img" aria-labelledby="sct"><title id="sct">Brecklin&#39;s Servicenter, drawn and then filled in with color: a car at the full-service pump under the canopy, with the counter and the service bays behind it</title>'
           f'<image class="col" x="{img[0]:.0f}" y="{img[1]:.1f}" width="{img[2]:.0f}" height="{img[3]:.1f}" href="/brecklins300/station-day.webp" data-img-night="/brecklins300/station-night.webp"/>'
           f'<path class="p thin" pathLength="1" style="--w:.1s;--d:1.1s" d="{P["site"]}"/>'
           f'<path class="p" pathLength="1" style="--w:.35s;--d:1.3s" d="{P["wall"]}"/>'
           f'<path class="p" pathLength="1" style="--w:.8s;--d:1.2s" d="{P["canopy"]}"/>'
           f'<path class="p" pathLength="1" style="--w:1.3s;--d:1.1s" d="{P["pump"]}"/>'
           f'<path class="p acc" pathLength="1" style="--w:1.8s;--d:.9s" d="{P["car"]}"/>'
           f'<g class="nt" style="--w:2.6s"><circle cx="{c0[0]:.0f}" cy="{c0[1]:.0f}" r="5"/><path d="M{c0[0]:.0f} {c0[1]:.0f}L650 {H - 52}H664"/><text x="676" y="{H - 44}">Full-service pump</text><text class="s" x="676" y="{H - 14}">Stay in the car</text></g>'
           f'<g class="nt" style="--w:2.9s"><text class="s" x="30" y="{H - 72}" transform="rotate(-5 30 {H - 72})" style="letter-spacing:.14em">WALNUT STREET</text></g>'
           f'</svg>')
    html = (f'<div class="sc sheet" data-sc>\n    {svg}\n'
            '    <script>addEventListener("DOMContentLoaded",function(){var s=document.querySelector("[data-sc]"),i=s&&s.querySelector("image");if(i&&s.classList.contains("night"))i.setAttribute("href",i.getAttribute("data-img-night"))})</script>\n'
            '    <div class="status chipa" data-status><i></i><span>Checking hours<small>Central time</small></span></div>\n'
            '    <dl class="tb"><div><dt>On Google</dt><dd>4.8 stars<small>from 21 reviews</small></dd></div><div><dt>Service bays</dt><dd>Oil and repairs<small>Seven days a week</small></dd></div><div><dt>Pull in at</dt><dd>119 Walnut St<small>Washington, IL</small></dd></div></dl>\n'
            '  </div>')
    css = (PEN + "\n"
           ".sc{--sp:#FBFAF6;--si:#14213A;--sg:#14213A0F;--sl:#14213A1F;--sa:#2E6DB4;--sh:#14213A99;--sf:Archivo,sans-serif}\n"
           ".sc.night{--sp:#13233F;--si:#E4ECF8;--sg:#E4ECF814;--sl:#E4ECF826;--sa:#FFD86B}\n"
           ".sc .chipa{position:absolute;left:14px;top:14px;margin:0;color:#14213A;max-width:calc(100% - 28px);box-shadow:0 14px 30px -14px #14213A99}\n"
           "@media(prefers-reduced-motion:no-preference){.sc .chipa{animation:pop .7s cubic-bezier(.2,.9,.3,1.25) both}}\n"
           "@keyframes pop{from{opacity:0;transform:translateY(12px) scale(.94)}to{opacity:1;transform:none}}")
    return html, css


def dentmap():
    d = json.load(open(os.path.join(HERE, "dumps/truck.json")))
    CROP = (780, 250, 1640, 580)          # the truck's window in dump pixels (truck.webp covers exactly this)
    k = 1.05; fx, fy = (lambda x: (x - 808) * k + 60), (lambda y: (y - 277) * k + 230)
    D = d["sign"]            # door front-top, door rear-bottom, B pillar, nose, tail, hood, bed (dump pixels)
    L = dict(d["layers"])
    # a prop that sits on the floor under the cab is not part of the truck
    L["detail"] = [s for s in L["detail"] if not (min(s[1], s[3]) > D[3][1] - 34 and D[0][0] - 40 < (s[0] + s[2]) / 2 < D[1][0] + 40)]
    P = {n: lines.path(v, fx, fy) for n, v in L.items()}
    pt = [(fx(x), fy(y)) for x, y in D]
    x0, y0, x1, y1 = pt[0][0] + 8, pt[0][1] + 8, pt[1][0] - 8, pt[1][1] - 6
    nose, tail, base = pt[3][0], pt[4][0], pt[3][1] + 2
    cx, cy = x0 + (pt[2][0] - pt[0][0]) * .5, (y0 + y1) / 2 + 2   # the ding: middle of the front door
    rows = [y0 + 8 + i * (y1 - y0 - 16) / 4 for i in range(5)]

    def refl(amp):
        out = []
        for y in rows:
            pts = []
            for i in range(41):
                x = x0 + (x1 - x0) * i / 40
                dy = (cy - y) * amp * math.exp(-((x - cx) ** 2) / (2 * 22 ** 2)) * math.exp(-((y - cy) ** 2) / (2 * 26 ** 2))
                pts.append(f"{x:.0f} {y + dy:.1f}")
            out.append("M" + "L".join(pts))
        return "".join(out)

    bent, flat = refl(.85), refl(0)
    board = "".join(f'<path d="M268 {74 + i * 12}H692"/>' for i in range(6))
    hatch = "".join(f"M{x} {base:.0f}l-10 12" for x in range(50, 931, 30))
    H = 612
    svg = (f'<svg class="draw" viewBox="0 0 960 {H}" role="img" aria-labelledby="dmt"><title id="dmt">A red pickup, drawn and then filled in with color, under a dent repair light board. The reflected lines bend around a door ding, then run straight again once it is pushed out from behind.</title>'
           f'<g class="wash" style="--w:.2s"><rect x="250" y="58" width="460" height="92" rx="10"/></g>'
           f'<g class="nt" style="--w:.2s"><path d="M300 0V58M660 0V58"/><rect x="250" y="58" width="460" height="92" rx="10" fill="none" stroke="currentColor" stroke-width="2.6"/><g class="bl">{board}</g><text class="s" x="726" y="112">Light board</text></g>'
           f'<defs><radialGradient id="shd"><stop offset="0" stop-color="#15130F" stop-opacity=".34"/><stop offset="1" stop-color="#15130F" stop-opacity="0"/></radialGradient><radialGradient id="dnt"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>'
           f'<path class="p thin" pathLength="1" style="--w:.1s;--d:.8s" d="M30 {base:.0f}H930{hatch}"/>'
           f'<ellipse class="col" cx="{(nose + tail) / 2:.0f}" cy="{base - 3:.0f}" rx="{(tail - nose) * .53:.0f}" ry="15" fill="url(#shd)"/>'
           f'<image class="col" x="{fx(CROP[0]):.1f}" y="{fy(CROP[1]):.1f}" width="{(CROP[2] - CROP[0]) * k:.1f}" height="{(CROP[3] - CROP[1]) * k:.1f}" href="/justdents300/truck.webp"/>'
           f'<path class="p" pathLength="1" style="--w:.5s;--d:1.4s" d="{P["trim"]}{P["open"]}"/>'
           f'<path class="p" pathLength="1" style="--w:1.1s;--d:1.2s" d="{P["tire"]}"/>'
           f'<path class="p thin" pathLength="1" style="--w:1.5s;--d:1.2s" d="{P["detail"]}"/>'
           f'<g class="nt" style="--w:2.4s"><ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="34" ry="26" fill="url(#dnt)"><animate attributeName="opacity" dur="8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.4;.6;.92;1" keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1" values="1;1;0;0;1"/></ellipse><path class="rf" d="{bent}"><animate attributeName="d" dur="8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.4;.6;.92;1" keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1" values="{bent};{bent};{flat};{flat};{bent}"/></path>'
           f'<circle class="mk" cx="{cx:.0f}" cy="{cy:.0f}" r="40"><animate attributeName="r" dur="8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.4;.6;.92;1" keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1" values="40;40;10;10;40"/></circle>'
           f'<path class="ld" d="M{cx - 29:.0f} {cy - 29:.0f}L306 312"/><text x="300" y="276" text-anchor="end">Door ding</text><text class="s" x="300" y="306" text-anchor="end">Paint untouched</text></g>'
           f'<g class="nt dim" style="--w:2.8s"><path d="M{nose:.0f} {base + 34:.0f}V{base + 70:.0f}M{tail:.0f} {base + 34:.0f}V{base + 70:.0f}M{nose:.0f} {base + 52:.0f}H{tail:.0f}M{nose + 14:.0f} {base + 45:.0f}l-14 7 14 7M{tail - 14:.0f} {base + 45:.0f}l14 7-14 7"/>'
           f'<rect class="bk" x="{(nose + tail) / 2 - 232:.0f}" y="{base + 34:.0f}" width="464" height="38" rx="4"/><text x="{(nose + tail) / 2:.0f}" y="{base + 62:.0f}" text-anchor="middle">No filler · No sanding · No repaint</text></g>'
           f'</svg>')
    html = (f'<div class="art sheet">\n    {svg}\n'
            '    <script>(function(s){if(s&&s.pauseAnimations&&matchMedia("(prefers-reduced-motion:reduce)").matches){s.pauseAnimations();s.setCurrentTime(5.5)}})(document.querySelector(".art .draw"))</script>\n'
            '    <dl class="tb"><div><dt>The method</dt><dd>No filler. No paint.<small>Pushed out from behind</small></dd></div><div><dt>The finish</dt><dd>Factory paint<small>The original stays on</small></dd></div><div><dt>The shop</dt><dd>832 N Main St<small>Morton, Illinois</small></dd></div></dl>\n'
            '  </div>')
    css = (PEN + "\n"
           ".art{--sp:#FFFDF8;--si:#15130F;--sg:#15130F0D;--sl:#e8e0cd;--sa:#D62D20;--sh:#15130f80;--sf:Inter,sans-serif}\n"
           ".art .wash rect{fill:var(--y);opacity:.5}.art .bl path{stroke-width:3.2;stroke-linecap:round}\n"
           ".art .nt .rf{fill:none;stroke:#FFF3C4;stroke-width:2.4;stroke-linecap:round;opacity:.85}.art .nt .mk{fill:none;stroke:#FFF3C4;stroke-width:2.6;stroke-dasharray:7 7}.art .ld{stroke:var(--si)}\n"
           ".art .dim{color:var(--red)}.art .dim .bk{fill:var(--sp)}.art .dim text{font-size:27px}")
    return html, css


def put(page, html, css):
    fn = os.path.join(ROOT, page, "index.html"); h = open(fn).read()
    for a, b, new in (("<!--sheet-->", "<!--/sheet-->", html), ("/*sheet*/", "/*/sheet*/", css)):
        i, j = h.index(a) + len(a), h.index(b)
        h = h[:i] + new + h[j:]
    open(fn, "w").write(h); print(page, len(h), "bytes; sheet", len(html))


def images(src):
    cutout(f"{src}/station-day.png", f"{src}/station-mask.png", (330, 0, 1900, 1080, 2000), os.path.join(ROOT, "brecklins300/station-day.webp"), 1280)
    cutout(f"{src}/station-night.png", f"{src}/station-mask.png", (330, 0, 1900, 1080, 2000), os.path.join(ROOT, "brecklins300/station-night.webp"), 1280)
    cutout(f"{src}/truck.png", f"{src}/truck-mask.png", (780, 250, 1640, 580, 2400), os.path.join(ROOT, "justdents300/truck.webp"), 860, erode=5, clear=(1100, 504, 1300, 800))


if __name__ == "__main__":
    if "--img" in sys.argv:
        images(sys.argv[sys.argv.index("--img") + 1])
    put("brecklins300", *station())
    put("justdents300", *dentmap())
    for page, slug in (("brecklins300", "brecklin-s-servicenter-washington"), ("justdents300", "just-dents-of-illinois-inc-morton")):
        shutil.copyfile(os.path.join(ROOT, page, "index.html"), os.path.join(ROOT, "p/2e8e4a", slug, "index.html"))
