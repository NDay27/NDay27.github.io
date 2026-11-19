"""Illustrated, lightly animated hero scene for the Starter ($300) tier, one per trade.

Flat vector art drawn here (no stock images). Colors come from the page: .a = accent, .a2 = darker accent.
Facts on the floating chips are only Google-listing facts (rating, review count, town, phone).
"""
import html

E = html.escape

DEFS = """<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7ecfa"/><stop offset="1" stop-color="#f6f2e9"/></linearGradient>
<pattern id="door" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#dfe3e8"/><rect y="8" width="10" height="2" fill="#c3c9d1"/></pattern>
<pattern id="brick" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#b9553f"/><path d="M0 11.5h24M12 0v6M0 6h24M0 6v6M24 6v6" stroke="#a3452f" stroke-width="1.2"/></pattern>
<pattern id="siding" width="10" height="9" patternUnits="userSpaceOnUse"><rect width="10" height="9" fill="#f4efe4"/><rect y="7.5" width="10" height="1.5" fill="#e2dbcc"/></pattern>
<pattern id="stripes" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="20" class="a"/><rect y="20" width="40" height="20" fill="#fff7ee"/></pattern></defs>"""


def _bg(ground="#8cc56a", hills="#b9dba0"):
    return (f'<rect width="480" height="400" fill="url(#sky)"/><circle class="sun" cx="392" cy="78" r="34" fill="#ffd98a"/>'
            f'<path d="M0 250C80 220 150 236 230 222s170 4 250-14V320H0z" fill="{hills}"/><rect y="296" width="480" height="104" fill="{ground}"/>')


def _house(x, y, w=170, roof="#3b4250", door=True, fill="url(#siding)", cls=""):
    h = w * .6
    out = (f'<g transform="translate({x} {y})" class="{cls}"><rect x="0" y="{h * .38:.0f}" width="{w}" height="{h * .62:.0f}" fill="{fill}"/>'
           f'<path d="M-12 {h * .4:.0f}L{w / 2:.0f} -6L{w + 12} {h * .4:.0f}z" fill="{roof}"/>'
           f'<rect x="{w * .12:.0f}" y="{h * .52:.0f}" width="{w * .2:.0f}" height="{h * .2:.0f}" fill="#a9d3ef" stroke="#fff" stroke-width="3"/>'
           f'<rect x="{w * .68:.0f}" y="{h * .52:.0f}" width="{w * .2:.0f}" height="{h * .2:.0f}" fill="#a9d3ef" stroke="#fff" stroke-width="3"/>')
    if door:
        out += f'<rect class="a" x="{w * .42:.0f}" y="{h * .6:.0f}" width="{w * .16:.0f}" height="{h * .4:.0f}"/>'
    return out + "</g>"


def _tree(x, y, s=1, cls=""):
    return (f'<g class="{cls}" transform="translate({x} {y}) scale({s})"><rect x="-6" y="-10" width="12" height="70" fill="#7a5236"/>'
            f'<circle cx="0" cy="-30" r="40" fill="#4e8a3e"/><circle cx="-28" cy="-6" r="26" fill="#5c9a47"/><circle cx="26" cy="-10" r="28" fill="#447c37"/></g>')


def _car(x, y, cls="a"):
    return (f'<g transform="translate({x} {y})"><path class="{cls}" d="M0 30c0-10 6-14 14-14h18l16-16h50l18 16h14c8 0 12 4 12 14v8H0z"/>'
            f'<path d="M38 16l12-12h20v12zM76 4h20l12 12H76z" fill="#cfe6f6"/>'
            f'<circle cx="28" cy="40" r="11" fill="#1e2228"/><circle cx="28" cy="40" r="4.5" fill="#c9ced6"/><circle cx="104" cy="40" r="11" fill="#1e2228"/><circle cx="104" cy="40" r="4.5" fill="#c9ced6"/></g>')


def scene(g, v, short):
    name = E(short.upper() if len(short) <= 22 else short)
    tl = ' textLength="150" lengthAdjust="spacingAndGlyphs"' if len(short) > 16 else ""
    if g == "auto":
        art = (_bg("#596069", "#c8d3cf") + '<path d="M0 340h480" stroke="#f1f1ee" stroke-width="3" stroke-dasharray="26 18"/>'
               '<rect x="40" y="132" width="320" height="166" fill="url(#brick)"/><rect x="30" y="120" width="340" height="16" fill="#2b2f36"/>'
               f'<rect class="a" x="110" y="144" width="180" height="30" rx="4"/><text x="200" y="165" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" font-family="Archivo,Inter,sans-serif"{tl}>{name}</text>'
               '<rect x="62" y="186" width="120" height="112" fill="url(#door)"/><rect x="214" y="186" width="120" height="112" fill="#2a2e35"/>'
               '<rect class="a" x="222" y="200" width="8" height="98"/><rect class="a" x="318" y="200" width="8" height="98"/>'
               '<g class="lift">' + _car(214, 222, "a2") + '<rect x="226" y="268" width="96" height="5" fill="#8a9099"/></g>'
               '<g class="drive">' + _car(330, 288, "a") + '</g>')
    elif g == "tree":
        art = (_bg() + _house(240, 196, 180) + '<g class="sway">' + _tree(150, 236, 1.6) + '</g>'
               '<g class="leaf"><ellipse cx="210" cy="140" rx="7" ry="3.5" fill="#5c9a47"/></g><g class="leaf l2"><ellipse cx="120" cy="120" rx="6" ry="3" class="a"/></g><g class="leaf l3"><ellipse cx="180" cy="100" rx="6" ry="3" fill="#447c37"/></g>')
    elif g == "lawn" and v == "snow":
        art = (_bg("#eef3f8", "#dfe8f0") + _house(70, 190, 190, "#ffffff") + '<rect x="0" y="292" width="480" height="8" fill="#fff"/>'
               '<path d="M300 400L330 296h70l40 104z" fill="#8f969e"/><path class="snowcover" d="M300 400L330 296h70l40 104z" fill="#fbfdff"/>'
               '<g class="plow"><rect class="a" x="336" y="310" width="62" height="34" rx="6"/><rect x="346" y="296" width="36" height="18" fill="#cfe6f6"/><rect x="330" y="344" width="74" height="10" fill="#f5b83d"/></g>'
               + "".join(f'<circle class="flake f{i % 3}" cx="{30 + i * 37 % 450}" cy="{20 + (i * 53) % 200}" r="{2 + i % 3}" fill="#fff"/>' for i in range(18)))
    elif g == "lawn":
        stripes = "".join(f'<rect y="{300 + i * 20}" width="480" height="20" fill="{"#7dbb5a" if i % 2 else "#93cd6c"}"/>' for i in range(5))
        art = (_bg() + _house(160, 186, 170) + _tree(70, 246, 1) + _tree(420, 250, .9) + stripes +
               '<g class="mow"><rect class="a" x="0" y="0" width="46" height="20" rx="5"/><circle cx="8" cy="22" r="6" fill="#222"/><circle cx="38" cy="22" r="6" fill="#222"/><path d="M4 2L-14 -26" stroke="#222" stroke-width="4" stroke-linecap="round"/></g>')
    elif g == "painting":
        art = (_bg() + '<g transform="translate(90 120)"><rect y="56" width="300" height="124" fill="url(#siding)"/><path d="M-14 60L150 -10 314 60z" fill="#3b4250"/>'
               '<rect class="paint a" y="56" width="300" height="124" style="opacity:.82"/>'
               '<rect x="40" y="86" width="56" height="50" fill="#a9d3ef" stroke="#fff" stroke-width="4"/><rect x="204" y="86" width="56" height="50" fill="#a9d3ef" stroke="#fff" stroke-width="4"/><rect x="128" y="110" width="44" height="70" fill="#5b3a2e"/></g>'
               '<g class="roller"><rect x="0" y="0" width="54" height="18" rx="6" fill="#f4efe4" stroke="#2b2f36" stroke-width="3"/><path d="M54 9h10v26H27v40" stroke="#2b2f36" stroke-width="4" fill="none"/></g>')
    elif g == "cleaning":
        art = ('<rect width="480" height="400" fill="#f3eee6"/><rect y="296" width="480" height="104" fill="#c99d6c"/>'
               '<path d="M0 320h480M0 352h480M0 384h480" stroke="#b78a5a" stroke-width="2"/>'
               '<rect x="150" y="70" width="180" height="150" fill="#cfe9f7" stroke="#fff" stroke-width="10"/><path d="M240 70v150M150 145h180" stroke="#fff" stroke-width="6"/>'
               '<rect x="60" y="226" width="200" height="56" rx="16" class="a"/><rect x="60" y="200" width="200" height="40" rx="16" class="a2"/><rect x="70" y="282" width="10" height="16" fill="#3b2f28"/><rect x="240" y="282" width="10" height="16" fill="#3b2f28"/>'
               '<rect x="330" y="246" width="70" height="50" rx="6" fill="#e8e0d5"/><circle cx="365" cy="226" r="26" fill="#4e8a3e"/>'
               '<g class="bot"><ellipse cx="0" cy="0" rx="34" ry="10" fill="#2a2d31"/><ellipse cx="0" cy="-5" rx="34" ry="10" fill="#f4f6f8"/><circle cx="0" cy="-6" r="4" class="a"/></g>'
               + "".join(f'<path class="spark s{i}" d="M{x} {y}l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff"/>' for i, (x, y) in enumerate([(200, 100), (300, 160), (420, 300), (110, 320)])))
    else:  # sweets
        art = (_bg("#d8cfc4", "#e9d6cf") + '<rect x="60" y="110" width="300" height="190" fill="url(#brick)"/><rect x="50" y="98" width="320" height="16" fill="#2b2f36"/>'
               f'<rect x="100" y="120" width="220" height="32" rx="4" fill="#1b1412"/><text x="210" y="142" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="Georgia,serif"{tl}>{E(short)}</text>'
               '<rect x="84" y="196" width="160" height="80" fill="#fff4dc"/><path d="M76 168h256l-14 32H90z" fill="url(#stripes)"/>'
               '<circle cx="120" cy="250" r="12" class="a"/><circle cx="160" cy="250" r="12" fill="#ffd39a"/><circle cx="200" cy="250" r="12" fill="#8c5a3c"/>'
               '<rect x="262" y="206" width="56" height="94" fill="#5b3a2e"/>'
               '<g class="bob"><path d="M400 330l-20-60h40z" fill="#e3a857"/><circle cx="400" cy="262" r="22" class="a"/><circle cx="400" cy="232" r="19" fill="#fff1d6"/></g>')
    return (f'<svg class="il" viewBox="0 0 480 400" role="img" aria-label="Illustration">{DEFS}{art}</svg>')


def card(g, v, short, chips):
    ch = "".join(f'<span class="fc fc{i}">{c}</span>' for i, c in enumerate(chips))
    return f'<figure class="ill" aria-hidden="true">{scene(g, v, short)}{ch}</figure>'
