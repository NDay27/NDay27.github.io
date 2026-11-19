"""Build the Harlow Building Co. demo pages from their .src.html templates.
Line drawings come from lab.html?mode=svg dumps (see renders.json); run from the repo root:
  python3 _build/harlow/build.py /tmp/claude-0/out
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.dirname(os.path.abspath(__file__))
DUMPS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SRC, 'dumps')

ORDER = ['ground', 'wall', 'roof', 'open', 'trim', 'porch', 'batten', 'seam']
WIDTH = {'ground': 1.1, 'wall': 1.7, 'roof': 1.7, 'open': 1.25, 'trim': 1.0, 'porch': 1.2, 'batten': .55, 'seam': .6}
# pen timing per layer (delay, duration) for the self-drawing hero
PEN = {'ground': (.2, 1.0), 'wall': (.25, 1.5), 'roof': (.7, 1.3), 'open': (1.1, 1.5), 'trim': (1.4, 1.4), 'porch': (1.6, 1.3), 'batten': (2.3, 0), 'seam': (2.4, 0)}


def load(name):
    return json.load(open(os.path.join(DUMPS, name + '.json')))


def bounds(d):
    segs = [s for n, L in d['layers'].items() if n != 'glass' for s in L]
    xs = [v for s in segs for v in (s[0], s[2])]; ys = [v for s in segs for v in (s[1], s[3])]
    return min(xs), min(ys), max(xs), max(ys)


def path(L, x0, y0, k=1.0):
    out, last = [], None
    for a1, b1, a2, b2 in L:
        if abs(a2 - a1) + abs(b2 - b1) < .6:
            continue
        a = f'{(a1 - x0) * k:.1f} {(b1 - y0) * k:.1f}'; b = f'{(a2 - x0) * k:.1f} {(b2 - y0) * k:.1f}'
        out.append(('L' + b) if last == a else ('M' + a + 'L' + b)); last = b
    return ''.join(out)


def drawing(name, cls='draw', animate=False, dims=None, margin=14, label=None, k=1.0, sw=1.0, wash=None, full=False):
    d = load(name)
    x0, y0, x1, y1 = bounds(d)
    ml, mb = (54, 50) if dims else (margin, margin)
    vx0, vy0, vx1, vy1 = (0, 0, d['W'], d['H']) if full else (x0 - ml, y0 - margin, x1 + margin, y1 + mb)
    w, h = (vx1 - vx0) * k, (vy1 - vy0) * k
    aria = f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"'
    out = [f'<svg class="{cls}" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"{aria}>']
    for L in ORDER:
        if L not in d['layers']:
            continue
        if L == 'open' and wash and d['layers'].get('glass'):
            polys = ''.join('M' + 'L'.join(f'{(g[i] - vx0) * k:.1f} {(g[i + 1] - vy0) * k:.1f}' for i in range(0, len(g), 2)) + 'Z' for g in d['layers']['glass'])
            out.append(f'<path class="wash" fill="{wash}" stroke="none" d="{polys}"/>')
        p = path(d['layers'][L], vx0, vy0, k)
        if not p:
            continue
        extra = ''
        if animate:
            w0, du = PEN[L]
            extra = f' pathLength="1" style="--w:{w0}s;--d:{du or 1}s"'
        out.append(f'<path class="l-{L}" stroke-width="{WIDTH[L] * sw:.2f}"{extra} d="{p}"/>')
    if dims:
        # overall width under the drawing and ridge height at the left, drafted like a real elevation
        wx0, wx1 = min(v for s in d['layers']['wall'] for v in (s[0], s[2])), max(v for s in d['layers']['wall'] for v in (s[0], s[2]))
        gy = max(v for s in d['layers']['wall'] for v in (s[1], s[3]))
        ty = min(v for s in d['layers']['roof'] for v in (s[1], s[3]))
        X0, X1, Y = (wx0 - vx0) * k, (wx1 - vx0) * k, (y1 - vy0) * k + 26
        GX, G, T = (x0 - vx0) * k - 30, (gy - vy0) * k, (ty - vy0) * k
        t = lambda x, y: f'M{x - 5:.1f} {y + 5:.1f}L{x + 5:.1f} {y - 5:.1f}'
        out.append('<g class="dim" stroke-width="1">'
                   f'<path d="M{X0:.1f} {Y - 14:.1f}V{Y + 6:.1f}M{X1:.1f} {Y - 14:.1f}V{Y + 6:.1f}M{X0:.1f} {Y:.1f}H{X1:.1f}{t(X0, Y)}{t(X1, Y)}"/>'
                   f'<rect x="{(X0 + X1) / 2 - 34:.1f}" y="{Y - 11:.1f}" width="68" height="22" fill="var(--white)" stroke="none"/>'
                   f'<text x="{(X0 + X1) / 2:.1f}" y="{Y + 5:.1f}" text-anchor="middle">{dims[0]}</text>'
                   f'<path d="M{GX - 6:.1f} {G:.1f}H{GX + 14:.1f}M{GX - 6:.1f} {T:.1f}H{GX + 14:.1f}M{GX:.1f} {G:.1f}V{T:.1f}{t(GX, G)}{t(GX, T)}"/>'
                   f'<rect x="{GX - 11:.1f}" y="{(G + T) / 2 - 32:.1f}" width="22" height="64" fill="var(--white)" stroke="none"/>'
                   f'<text transform="translate({GX + 5:.1f} {(G + T) / 2:.1f}) rotate(-90)" text-anchor="middle">{dims[1]}</text></g>')
    out.append('</svg>')
    return ''.join(out)


ICON = {
    'LOGO': '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 15.5 16 6l12 9.5" fill="none" stroke="var(--pencil)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M8.6 15v12.5M23.4 15v12.5M8.6 20.6h14.8" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
    'PHONE_ICON': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/></svg>',
    'CHECK': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    'CONTACT_ICON': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7.5 17.5a5 5 0 0 1 9 0"/></svg>',
    'STARS': ''.join('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.8 2.8 6 6.5.6-4.9 4.3 1.5 6.4L12 16.8 6.1 20.1l1.5-6.4L2.7 9.4l6.5-.6z"/></svg>' for _ in range(5)),
}
_ic = '<svg class="ic" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{}</svg>'
ICON.update({
    'IC_HOME': _ic.format('<path d="M8 27 28 11l20 16"/><path d="M13 23v22h30V23"/><path d="M24 45V33h8v12"/><path d="M17 28h5v5h-5zM34 28h5v5h-5z"/><path d="M36 15v-4h5v8" />'),
    'IC_ADD': _ic.format('<path d="M6 29 20 18l14 11"/><path d="M10 26v19h20V26"/><path d="M30 33h18v12H30" stroke-dasharray="3 3"/><path d="M30 33l9-7 9 7" stroke-dasharray="3 3"/><path d="M16 33h6v6h-6z"/>'),
    'IC_KITCHEN': _ic.format('<path d="M8 30h40v15H8z"/><path d="M8 30v-4h40v4"/><path d="M20 30v15M36 30v15"/><path d="M10 12h16v9H10zM30 12h16v9H30z"/><path d="M24 36h-2M34 36h-2"/><path d="M27 26v-4h4"/>'),
    'IC_BASE': _ic.format('<path d="M6 22h44"/><path d="M6 46h44"/><path d="M14 46V34h6v-4h6v-4h6v-4"/><path d="M38 30h8v8h-8z"/><path d="M28 10 38 18M18 18l10-8"/>'),
    'IC_PORCH': _ic.format('<path d="M8 24 28 14l20 10"/><path d="M10 24h36"/><path d="M13 24v20M43 24v20M24 24v20M32 24v20"/><path d="M8 44h40"/><path d="M13 36h11M32 36h11"/><path d="M24 44v4h8v-4"/>'),
})


def svg_file(name, out, k=.7, color='#14212e', label='', wash='#f3c64e'):
    svg = drawing(name, cls='d', k=k, sw=1.9, wash=wash).replace('stroke="currentColor"', f'stroke="{color}"').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
    svg = svg.replace('class="l-batten"', 'opacity=".42" class="l-batten"').replace('class="l-seam"', 'opacity=".42" class="l-seam"')
    open(os.path.join(ROOT, 'harlow/img', out), 'w').write(svg)
    m = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg)
    return f'<img src="../img/{out}" width="{m.group(1)}" height="{m.group(2)}" alt="{label}" loading="lazy" decoding="async">'


def build(src, dst, extra):
    html = open(os.path.join(SRC, src)).read()
    for k, v in {**ICON, **extra}.items():
        html = html.replace('{{' + k + '}}', v)
    left = re.findall(r'{{[A-Z_]+}}', html)
    if left:
        raise SystemExit(f'{src}: unfilled {sorted(set(left))}')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w').write(html)
    print(dst, len(html) // 1024, 'KB')


if __name__ == '__main__':
    build('essential.src.html', os.path.join(ROOT, 'harlow/essential/index.html'), {
        'ELEV': drawing('elev-draw', animate=True, dims=('62′-4″', '31′-2″'), sw=2.1, wash='var(--pencil)'),
        'DRAW_HERO': svg_file('hero-draw', 'draw-farmhouse.svg', label='Line drawing of the farmhouse from the front corner'),
        'DRAW_WING': svg_file('wing-draw', 'draw-garage.svg', label='Line drawing of the two-car garage wing with a bonus room window'),
        'DRAW_PORCH': svg_file('back-draw', 'draw-back.svg', label='Line drawing of the back of the house with a wide glass slider'),
    })
    stage = ''.join('<img%s src="../img/st-%d-1200.webp" alt="" width="1200" height="800" loading="lazy">' % (' class="on"' if i == 1 else '', i) for i in range(1, 7))
    build('signature.src.html', os.path.join(ROOT, 'harlow/signature/index.html'), {
        'HERO_DRAW': drawing('hero-draw', animate=True, full=True, sw=1.15),
        'STAGE_IMGS': stage,
        'PLUS': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        'XICON': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    })
