#!/usr/bin/env python3
"""Pick shops that can move onto the flagship kit: their trade has a kit group, the trade check passes,
and nothing in the name says the kit's story would be wrong for them.

  python3 _build/flagship/pick.py [--groups auto,lawn,...] [--add]

Reads _build/tiers/shops.json and _build/tiers/dealt.json. Prints the picks; --add appends them to
_build/flagship/shops.json (owner nolan)."""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import kit  # noqa: E402

spec = importlib.util.spec_from_file_location("tiers_build", os.path.join(ROOT, "_build/tiers/build.py"))
tb = importlib.util.module_from_spec(spec); spec.loader.exec_module(tb)

# kit group for each variant the kit can tell truthfully
KIT_V = {"lawn": "lawn", "landscape": "lawn", "tree": "tree", "painter": "painting",
         "auto": "auto", "transmission": "auto", "radiator": "auto", "muffler": "auto", "brake": "auto", "autobody": "body"}
KIT_V.update(getattr(kit, "KIT_V_EXTRA", {}))
# names where the group's story would be wrong (a mobile mechanic has no shop; a stump grinder doesn't trim trees)
NAME_OUT = {
 "auto": r"diesel|mobile|\btires?\b|alignment|custom|racing|undercoat|storage|road service|on site|truck|trailer|tow|wrecker|marine|\brv\b|motorcycle|cycle|small engine|mower|airframe|aircraft|accessor|sprinter",
 "lawn": r"stump|grind|handyman|construct|excavat|snow|concrete|paver|stone|masonry|fenc|pool|irrigat|sprinkler|tree",
 "tree": r"stump|grind|handyman|construct|excavat|property improve|landscap|lawn",
 "body": r"glass|windshield|tint|wrap|detail|upholst|mobile|marine|motorcycle|\brv\b",
 "painting": r"handyman|construct|excavat|farms|sandblast|sndblst|auto|body|gutter|clean|roof|floor|drywall",
}
NAME_OUT.update(getattr(kit, "NAME_OUT_EXTRA", {}))
# checked by hand: the name trips a filter but the kit story fits (Buck's is a tree crew that also landscapes)
KEEP = {"buck-s-tree-service-landscaping-peoria"}


def candidates():
    tiers = json.load(open(os.path.join(ROOT, "_build/tiers/shops.json")))
    dealt = json.load(open(os.path.join(ROOT, "_build/tiers/dealt.json")))
    done = {x["slug"] for x in json.load(open(os.path.join(HERE, "shops.json")))}
    checks = json.load(open(tb.CHECKS_PATH))
    out = []
    for s in tiers + dealt:
        if s["slug"] in done or s.get("copy"):
            continue
        if s.get("gstatus") == "closed" or s.get("wk") == "own":
            continue
        g = KIT_V.get(s["v"])
        if not g:
            continue
        if tb.trade_problem(s, checks):
            continue
        if s["slug"] not in KEEP and re.search(NAME_OUT.get(g, r"$^"), s["name"].lower()):
            continue
        if g in ("lawn", "tree", "painting") and kit.st(s) == "CA":
            continue
        out.append((g, s))
    return out


def main():
    a = sys.argv[1:]
    groups = set(a[a.index("--groups") + 1].split(",")) if "--groups" in a else None
    picks = [(g, s) for g, s in candidates() if not groups or g in groups]
    for g, s in picks:
        print(f"{g:9} {s['v']:12} {s['slug']}  | {s['name']}")
    print(len(picks), "shops")
    if "--add" in a:
        f = os.path.join(HERE, "shops.json")
        cur = json.load(open(f))
        seen = {x["slug"] for x in cur}
        for g, s in picks:
            if s["slug"] not in seen:
                cur.append({"slug": s["slug"], "owner": "nolan", "src": ["Google listing category (trade check)"]})
        json.dump(cur, open(f, "w"), indent=1, ensure_ascii=False)
        print("added to", f)


if __name__ == "__main__":
    main()
