"""Shared helpers: turn a hidden-line dump (list of [x0,y0,x1,y1] per layer) into compact SVG path data."""


def clip(s, x0, y0, x1, y1):
    """Liang-Barsky: the part of segment s inside the box, or None."""
    a, b, c, e = s; dx, dy = c - a, e - b; t0, t1 = 0.0, 1.0
    for p, q in ((-dx, a - x0), (dx, x1 - a), (-dy, b - y0), (dy, y1 - b)):
        if p == 0:
            if q < 0:
                return None
            continue
        r = q / p
        if p < 0:
            t0 = max(t0, r)
        else:
            t1 = min(t1, r)
        if t0 > t1:
            return None
    return [a + t0 * dx, b + t0 * dy, a + t1 * dx, b + t1 * dy]


def path(segs, fx, fy, minlen=1.5):
    """Quantise to whole units, drop dust and doubles, chain shared endpoints, emit relative commands."""
    seen = set(); q = []
    for a, b, c, e in segs:
        p, r = (round(fx(a)), round(fy(b))), (round(fx(c)), round(fy(e)))
        if p == r or (p[0] - r[0]) ** 2 + (p[1] - r[1]) ** 2 < minlen ** 2:
            continue
        k = (p, r) if p < r else (r, p)
        if k in seen:
            continue
        seen.add(k); q.append(k)
    ends = {}
    for i, (p, r) in enumerate(q):
        ends.setdefault(p, []).append(i); ends.setdefault(r, []).append(i)
    used = [False] * len(q); out = []
    for i in range(len(q)):
        if used[i]:
            continue
        used[i] = True; chain = [q[i][0], q[i][1]]
        for head in (False, True):
            while True:
                tip = chain[0] if head else chain[-1]
                nxt = next((j for j in ends[tip] if not used[j]), None)
                if nxt is None:
                    break
                used[nxt] = True; o = q[nxt][1] if q[nxt][0] == tip else q[nxt][0]
                chain.insert(0, o) if head else chain.append(o)
        d = f"M{chain[0][0]} {chain[0][1]}"
        for u, v in zip(chain, chain[1:]):
            dx, dy = v[0] - u[0], v[1] - u[1]
            d += f"h{dx}" if dy == 0 else f"v{dy}" if dx == 0 else f"l{dx} {dy}"
        out.append(d)
    return "".join(out)
