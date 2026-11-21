#!/usr/bin/env python3
"""Turn the hidden-line dump of the repair shop (render.cjs, name auto-elev) into the drawn hero sheet for auto shops.

  python3 _build/flagship/elevauto.py RENDER_DIR      -> _build/flagship/elev-auto.svg
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ORDER = ["ground", "wall", "roof", "open", "porch", "trim", "tire", "batten"]
WIDTH = {"ground": 1.1, "wall": 1.7, "roof": 1.7, "open": 1.25, "porch": 1.5, "trim": 1.35, "tire": 1.35, "batten": .55}
PEN = {"ground": (.2, 1.0), "wall": (.25, 1.5), "roof": (.7, 1.3), "open": (1.1, 1.5), "porch": (1.5, 1.2), "trim": (1.9, 1.6), "tire": (2.2, 1.2), "batten": (2.6, 0)}
OUT_W = 1352
SW = 2.1


def main(src):
    d = json.load(open(os.path.join(src, "auto-elev.json")))
    L = d["layers"]
    segs = [s for k in ORDER for s in L.get(k, []) if k != "batten"]
    xs = [v for s in segs for v in (s[0], s[2])]; ys = [v for s in segs for v in (s[1], s[3])]
    x0, x1, y0, y1 = min(xs) - 14, max(xs) + 14, min(ys) - 14, max(ys) + 14
    k = OUT_W / (x1 - x0); H = (y1 - y0) * k + 64
    out = [f'<svg class="draw" role="img" viewBox="0 0 {OUT_W} {H:.0f}" width="{OUT_W}" height="{H:.0f}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">']
    for name in ORDER:
        ss = [s for s in L.get(name, []) if (s[0] - s[2]) ** 2 + (s[1] - s[3]) ** 2 > .6]
        if not ss:
            continue
        p = "".join(f"M{(a - x0) * k:.1f} {(b - y0) * k:.1f}L{(c - x0) * k:.1f} {(e - y0) * k:.1f}" for a, b, c, e in ss)
        w0, du = PEN[name]
        out.append(f'<path class="l-{name}" stroke-width="{WIDTH[name] * SW:.2f}" pathLength="1" style="--w:{w0}s;--d:{du or 1}s" d="{p}"/>')
    tl, tr, bl = [((x - x0) * k, (y - y0) * k) for x, y in d["sign"]]
    import math
    sw_, sh_ = math.dist(tl, tr), math.dist(tl, bl)
    a, b, c, e = (tr[0] - tl[0]) / sw_, (tr[1] - tl[1]) / sw_, (bl[0] - tl[0]) / sh_, (bl[1] - tl[1]) / sh_
    out.append(f'<g class="note sign" style="--w:2.4s" transform="matrix({a:.4f} {b:.4f} {c:.4f} {e:.4f} {tl[0]:.1f} {tl[1]:.1f})" data-w="{sw_:.0f}" data-h="{sh_:.0f}">{{{{SIGN}}}}</g>')
    out.append(f'<g class="note" style="--w:3.1s"><text x="{OUT_W - 12}" y="{H - 14:.0f}" text-anchor="end">Bay 1: up on the lift</text></g></svg>')
    open(os.path.join(HERE, "elev-auto.svg"), "w").write("".join(out))
    print("elev-auto.svg", len(out[1:-1]), "layers", f"{H:.0f} tall")


if __name__ == "__main__":
    main(sys.argv[1])
