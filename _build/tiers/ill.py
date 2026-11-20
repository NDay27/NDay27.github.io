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


def _store(short, tl, awn="url(#stripes)", sign="#1b1412", wall="url(#brick)", font="Georgia,serif", win="#fff4dc", goods=""):
    """A shopfront: wall, name band, awning, big window (goods drawn inside), door."""
    return (f'<rect x="60" y="110" width="300" height="190" fill="{wall}"/><rect x="50" y="98" width="320" height="16" fill="#2b2f36"/>'
            f'<rect x="96" y="120" width="228" height="32" rx="4" fill="{sign}"/><text x="210" y="142" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="{font}"{tl}>{E(short)}</text>'
            f'<rect x="84" y="196" width="160" height="96" fill="{win}"/>{goods}<path d="M84 196h160v96H84z" fill="none" stroke="#2b2f36" stroke-width="5"/>'
            f'<path d="M76 168h256l-14 32H90z" fill="{awn}"/><rect x="262" y="206" width="56" height="94" fill="#5b3a2e"/><circle cx="308" cy="256" r="3" fill="#e9c46a"/>')


def scene_mix(g, v, short, tl):
    """Starter art for the mixed groups (beauty, food, retail, pets, fitness, studio, trades)."""
    if g == "beauty":
        if v == "barber":
            fg = ('<g transform="translate(398 196)"><rect x="-12" y="-8" width="24" height="10" rx="4" fill="#c9ced6"/><rect x="-9" y="0" width="18" height="96" fill="#fff"/>'
                  '<clipPath id="pc"><rect x="-9" y="0" width="18" height="96"/></clipPath><g clip-path="url(#pc)"><g class="pole">'
                  + "".join(f'<path d="M-12 {y}l24 -14v10l-24 14z" fill="{"#d33a2c" if i % 2 else "#2f5fa8"}"/>' for i, y in enumerate(range(-40, 120, 12))) +
                  '</g></g><rect x="-12" y="96" width="24" height="10" rx="4" fill="#c9ced6"/></g>')
        else:
            fg = ('<g class="bob"><g transform="translate(400 250)"><path d="M-20 -40l40 52M-20 12l40-52" stroke="#2b2f36" stroke-width="6" stroke-linecap="round"/>'
                  '<circle cx="-24" cy="20" r="11" fill="none" class="as" stroke-width="6"/><circle cx="24" cy="20" r="11" fill="none" class="as" stroke-width="6"/></g></g>')
        goods = ('<ellipse cx="164" cy="232" rx="30" ry="36" fill="#cfe6f6" stroke="#c9b48a" stroke-width="5"/><path d="M134 292v-20h60v20" class="a"/><rect x="150" y="262" width="28" height="12" class="a2"/>'
                 + "".join(f'<path class="spark s{i}" d="M{x} {y}l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff"/>' for i, (x, y) in enumerate([(120, 214), (206, 222), (186, 206)])))
        art = _bg("#d8cfc4", "#e9d6cf") + _store(short, tl, sign="#2a1f24", goods=goods) + fg
    elif g == "food":
        goods = ('<rect x="96" y="250" width="136" height="6" fill="#8c5a3c"/><circle cx="124" cy="240" r="10" class="a"/><circle cx="164" cy="240" r="10" fill="#f3c25b"/><circle cx="204" cy="240" r="10" fill="#8c5a3c"/>'
                 '<path d="M100 214h128" stroke="#2b2f36" stroke-width="2"/><text x="164" y="212" text-anchor="middle" font-size="11" font-weight="700" fill="#2b2f36" font-family="Georgia,serif">OPEN</text>')
        cup = (('<rect x="378" y="282" width="44" height="40" rx="6" fill="#fff"/><path d="M422 292h8a8 8 0 0 1 0 16h-8" fill="none" stroke="#fff" stroke-width="5"/><rect x="378" y="290" width="44" height="8" class="a"/>')
               if v == "coffee" else '<ellipse cx="400" cy="312" rx="34" ry="9" fill="#fff"/><path d="M372 308c0-18 56-18 56 0z" class="a"/><circle cx="400" cy="290" r="4" fill="#f3c25b"/>')
        steam = "".join(f'<path class="steam st{i}" d="M{392 + i * 10} 276c-6-8 6-14 0-22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>' for i in range(3))
        art = (_bg("#d8cfc4", "#e9d6cf") + _store(short, tl, goods=goods) +
               '<rect x="360" y="322" width="80" height="8" rx="3" fill="#5b3a2e"/><rect x="396" y="330" width="8" height="40" fill="#5b3a2e"/>' + cup + steam)
    elif g == "retail":
        if v == "florist":
            goods = "".join(f'<g class="sway s{i % 3}"><path d="M{x} 292v-38" stroke="#4e8a3e" stroke-width="3"/><circle cx="{x}" cy="250" r="12" fill="{c}"/><circle cx="{x}" cy="250" r="4" fill="#ffd98a"/></g>'
                            for i, (x, c) in enumerate([(110, "#e86a8a"), (140, "#f3a9c0"), (170, "#ffffff"), (200, "#d98c9f"), (226, "#f6c453")]))
            fg = '<g class="bob"><path d="M380 330l-14-44h48l-14 44z" class="a2"/><circle cx="374" cy="276" r="14" fill="#e86a8a"/><circle cx="398" cy="270" r="15" fill="#fff"/><circle cx="414" cy="282" r="12" fill="#f6c453"/></g>'
        else:
            goods = ('<path d="M120 208h88" stroke="#8a9099" stroke-width="3"/>' + "".join(f'<path d="M{x} 208v8l-14 12h28l-14-12" fill="none" stroke="#2b2f36" stroke-width="2"/><rect x="{x - 14}" y="228" width="28" height="44" rx="4" fill="{c}"/>'
                     for x, c in [(132, "#d98c9f"), (164, "#b8c79a"), (196, "#2b2f36")]))
            fg = '<g class="bob"><path d="M374 300h52l-6 46h-40z" class="a"/><path d="M386 300v-10a14 14 0 0 1 28 0v10" fill="none" stroke="#2b2f36" stroke-width="4"/></g>'
        art = _bg("#d8cfc4", "#e9d6cf") + _store(short, tl, sign="#1e2420", awn="#8c5a6e", goods=goods) + fg
    elif g == "pets":
        bubbles = "".join(f'<circle class="spark s{i % 4}" cx="{x}" cy="{y}" r="{r}" fill="#fff" stroke="#cfe6f6" stroke-width="2"/>' for i, (x, y, r) in enumerate([(360, 250, 9), (384, 232, 6), (420, 244, 8), (440, 222, 5), (400, 214, 7)]))
        dog = ('<path d="M352 300h104l-8 40h-88z" fill="#e8eef3" stroke="#8a9099" stroke-width="3"/>'
               '<circle cx="404" cy="282" r="22" fill="#e3a857"/><path d="M386 270l-10-14 16 6zM422 270l10-14-16 6z" fill="#b5762f"/><circle cx="396" cy="280" r="3" fill="#222"/><circle cx="412" cy="280" r="3" fill="#222"/><ellipse cx="404" cy="290" rx="5" ry="3.5" fill="#222"/>'
               '<g class="wag"><path d="M438 300c12-6 18-18 14-28" fill="none" stroke="#e3a857" stroke-width="7" stroke-linecap="round"/></g>')
        goods = '<circle cx="130" cy="246" r="18" fill="#e3a857"/><circle cx="170" cy="252" r="14" fill="#8c5a3c"/><circle cx="204" cy="246" r="16" fill="#fff"/><rect x="96" y="268" width="136" height="6" fill="#8c5a3c"/>'
        art = _bg() + _store(short, tl, sign="#16283a", awn="#2c7da0", wall="url(#siding)", goods=goods) + dog + bubbles
    elif g == "fitness":
        goods = ('<rect x="96" y="276" width="136" height="6" fill="#2b2f36"/><path d="M110 250h108" stroke="#2b2f36" stroke-width="5"/>'
                 '<rect x="112" y="234" width="10" height="32" rx="2" class="a"/><rect x="206" y="234" width="10" height="32" rx="2" class="a"/><rect x="124" y="240" width="8" height="20" rx="2" fill="#2b2f36"/><rect x="196" y="240" width="8" height="20" rx="2" fill="#2b2f36"/>')
        fg = '<g class="bob"><path d="M390 300a26 26 0 1 0 0.1 0z" fill="#2b2f36"/><path d="M378 300a12 12 0 0 1 24 0" fill="none" stroke="#2b2f36" stroke-width="8" transform="translate(0 -10)"/><text x="390" y="336" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Archivo,sans-serif">16</text></g>'
        art = _bg("#596069", "#c8d3cf") + _store(short, tl, sign="#0e0f12", awn="#d33a2c", wall="#3b4250", font="Archivo,Inter,sans-serif", win="#dfe7ee", goods=goods) + fg
    elif g == "studio":
        if v == "music":
            fg = "".join(f'<g class="leaf l{i}"><path d="M{380 + i * 22} {240 - i * 10}v-24l14-4v24" fill="none" stroke="#2b2f36" stroke-width="3"/><circle cx="{376 + i * 22}" cy="{241 - i * 10}" r="5" class="a"/></g>' for i in range(3))
        elif v == "daycare":
            fg = '<g class="bob"><rect x="370" y="300" width="30" height="30" class="a"/><rect x="404" y="300" width="30" height="30" fill="#8fb3e8"/><rect x="387" y="268" width="30" height="30" fill="#f3c25b"/><text x="385" y="321" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">A</text><text x="419" y="321" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">B</text><text x="402" y="289" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">C</text></g>'
        else:
            fg = ('<g transform="translate(400 260)"><path d="M0 20l-22 70M0 20l22 70M0 20v70" stroke="#2b2f36" stroke-width="4"/><rect x="-26" y="-6" width="52" height="34" rx="6" fill="#2b2f36"/>'
                  '<circle cx="0" cy="11" r="11" fill="#8fb3e8" stroke="#fff" stroke-width="3"/><rect x="10" y="-14" width="12" height="8" fill="#2b2f36"/><circle class="flash" cx="16" cy="-12" r="22" fill="#fff"/></g>')
        goods = '<rect x="104" y="212" width="52" height="40" fill="#fff" stroke="#c9b48a" stroke-width="4"/><rect x="170" y="220" width="52" height="40" fill="#fff" stroke="#c9b48a" stroke-width="4"/><circle cx="130" cy="232" r="9" class="a"/><path d="M178 254l14-18 10 12 6-6 8 12z" fill="#8fb3e8"/>'
        art = _bg() + _store(short, tl, sign="#1b1b22", awn="#e9b44c", wall="url(#siding)", goods=goods) + fg
    else:  # trades: the house, the work van, a ladder
        van = ('<g class="drive"><g transform="translate(300 286)"><path d="M0 10h110v40H0z" fill="#fff"/><path d="M110 18h24l14 16v16h-38z" fill="#fff"/><path d="M116 22h16l10 12h-26z" fill="#cfe6f6"/>'
               '<rect class="a" x="0" y="28" width="148" height="7"/><path d="M6 4h96" stroke="#8a9099" stroke-width="3"/><path d="M10 0h88M14 4v-8M30 4v-8M46 4v-8M62 4v-8M78 4v-8M94 4v-8" stroke="#8a9099" stroke-width="2"/>'
               '<circle cx="28" cy="52" r="11" fill="#1e2228"/><circle cx="28" cy="52" r="4.5" fill="#c9ced6"/><circle cx="122" cy="52" r="11" fill="#1e2228"/><circle cx="122" cy="52" r="4.5" fill="#c9ced6"/></g></g>')
        roof = '<g class="paint" style="animation-duration:7s"><path d="M58 226L150 160 242 226z" class="a" opacity=".9"/></g>' if v == "roofing" else ""
        art = (_bg() + _house(60, 166, 180, "#3b4250") + roof + '<path d="M236 300l26-130M256 300l26-130M240 280h20M244 258h20M248 236h20M252 214h20M256 192h20" stroke="#c9a15a" stroke-width="5" stroke-linecap="round"/>' + van)
    return art


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
    elif g not in ("sweets",):
        art = scene_mix(g, v, short, tl)
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
