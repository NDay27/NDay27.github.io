#!/usr/bin/env python3
"""Harlow-style presentation decks for the two hand-built shops (Just Dents, Brecklin's).

Reuses the kit's deck builder (_build/flagship/room.py) with each shop's own pitch data (the nds-shop JSON on its $300
page), its own three sample sites and its own $1,250 3D scene as the cover.

  node _build/handbuilt/shots.cjs        thumbnails + cover.png (needs the local server on 8811)
  python3 _build/handbuilt/decks.py      -> p/2e8e4a/<slug>/room/index.html and shots/cover-{1200,1920}.webp
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, "_build/flagship"))
import room  # noqa: E402

SHOPS = [
    {"page": "justdents", "group": "body", "owner": "nolan", "meet_extra": "&amp;n=Kurt"},
    {"page": "brecklins", "group": "auto", "owner": "nolan", "meet_extra": "", "trade": "full-service station and repair"},
]


def cover(slug):
    from PIL import Image
    d = os.path.join(ROOT, "p/2e8e4a", slug, "shots"); src = os.path.join(d, "cover.png")
    if os.path.exists(src):
        im = Image.open(src).convert("RGB"); w, h = im.size; th = round(w * 9 / 16)
        if th < h:
            im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
        im.save(os.path.join(d, "cover-1920.webp"), "WEBP", quality=78, method=6)
        im.resize((1200, round(1200 * im.height / im.width)), Image.LANCZOS).save(os.path.join(d, "cover-1200.webp"), "WEBP", quality=80, method=6)
        os.remove(src)
    return Image.open(os.path.join(d, "cover-1920.webp")).size


def build(cfg):
    page = cfg["page"]
    h = open(os.path.join(ROOT, page + "300/index.html")).read()
    raw = re.search(r'<script type="application/json" id="nds-shop">(.*?)</script>', h, re.S).group(1)
    d = json.loads(raw); slug = d["slug"]
    s = {"slug": slug, "name": d["name"], "short": d["short"], "town": d["town"], "trade": cfg.get("trade") or d["trade"], "group": cfg["group"], "owner": cfg["owner"], "v": cfg["group"]}
    # a deck slide holds about six short features; the pitch room and the compare slide keep the full list
    deck = json.loads(raw)
    for v in deck["versions"].values():
        f = v["features"]; keep = []; room_left = 330 - len(f[-1])
        for x in f[:-1][:5]:          # as many as fit on the slide, always ending on the last line
            if len(x) > room_left:
                break
            keep.append(x); room_left -= len(x)
        v["features"] = keep + f[-1:]
    out = room.page(s, json.dumps(deck))
    u = f"/p/2e8e4a/{slug}/"; w, hh = cover(slug)
    # the cover is the shop's own 3D scene, not the kit render
    g, hero = room.HERO[cfg["group"]]
    for size, mine in ((1200, "cover-1200.webp"), (2400, "cover-1920.webp")):
        out = out.replace(f"/f/img/{g}/{hero}-{size}.webp", f"{u}shots/{mine}")
    out = out.replace("cover-1920.webp 2400w", "cover-1920.webp 1920w").replace('width="2400" height="1350" fetchpriority', f'width="{w}" height="{hh}" fetchpriority')
    # the three sites live at their own paths
    for a, b in (('"../750/"', f'"/{page}750/"'), ('"../1250/"', f'"/{page}1250/"'), ('href="../"', f'href="/{page}300/"'), ('essential: "../"', f'essential: "/{page}300/"')):
        assert a in out, a
        out = out.replace(a, b)
    assert "../" not in out.replace("../../", ""), "relative link left in deck"
    out = out.replace(f'/meet/?s={slug}&amp;by=nolan"', f'/meet/?s={slug}&amp;by=nolan{cfg["meet_extra"]}"')
    dst = os.path.join(ROOT, "p/2e8e4a", slug, "room"); os.makedirs(dst, exist_ok=True)
    open(os.path.join(dst, "index.html"), "w").write(out); print(slug, len(out), "bytes")


if __name__ == "__main__":
    for c in SHOPS:
        build(c)
