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
 "auto": r"diesel|\bmobile\b|\btires?\b|alignment|custom|racing|undercoat|storage|road service|on site|truck|trailer|\btow|wrecker|marine|\brv\b|motorcycle|cycle|small engine|mower|airframe|aircraft|accessor|sprinter",
 "lawn": r"stump|grind|handyman|construct|excavat|snow|concrete|paver|stone|masonry|fenc|pool|irrigat|sprinkler|tree",
 "tree": r"stump|grind|handyman|construct|excavat|property improve|landscap|lawn",
 "body": r"glass|windshield|tint|wrap|detail|upholst|mobile|marine|motorcycle|\brv\b",
 "painting": r"handyman|construct|excavat|farms|sandblast|sndblst|auto|body|gutter|clean|roof|floor|drywall",
}
NAME_OUT.update(getattr(kit, "NAME_OUT_EXTRA", {}))
STUMP_V = ("tree", "lawn")
# checked by hand: the name trips a filter but the kit story fits (Buck's is a tree crew that also landscapes)
KEEP = {"buck-s-tree-service-landscaping-peoria",
        # Nov 21: Google lists these as car repair shops; the diesel/truck/tire/alignment word in the name is extra work, the car story still fits
        "j-m-automotive-diesel-lincoln", "pages-diesel-automotive-marion-in", "j-m-automotive-and-diesel-repair-springfield", "kma-truck-auto-kokomo-in",
        "haager-s-auto-truck-service-richmond-in", "sooner-auto-truck-repair-midwest-city-ok", "palmetto-truck-car-services-hardeeville-sc",
        "walt-s-auto-repair-towing-sandusky-oh", "bonao-tires-auto-repair-wilkes-barre-pa", "brad-s-auto-repair-and-alignment-mason-city-ia",
        # nail salons named "& Spa", salons/barbers that also do nails or styling, family restaurants named Kitchen
        "art-nails-spa-monroe-la", "a-j-elite-nails-spa-branson-mo", "rio-nails-and-spa-cedar-city-ut", "gallery-nail-spa-bloomingdale-nj", "yg-nail-spa-oakland-nj",
        "lv-spa-nails-ringwood-nj", "serenity-salon-and-day-spa-hartwell-ga", "stylz-hair-nail-salon-saginaw-mi", "sweeney-braz-s-barbershop-salon-green-river-wy",
        "elvira-s-hair-styling-williamsport-pa", "mountain-view-kitchen-fountain-hills-az", "texas-kountry-kitchen-dayton-tx",
        # Google lists these as a lawn care service, and concrete contractors; the extra word in the name doesn't change the story
        "grindstone-lawn-care-berea-oh", "fridley-construction-livingston-mt", "mr-concrete-asphalt-sandia-park-nm",
        # Nov 22: Google lists these as landscapers / a landscape designer; "Construction" in the name is the hardscape side of the same crew
        "king-landscaping-construction-pekin", "ferguson-landscape-construction-llc-abingdon",
        # Nov 22: Google lists these as landscape designers, an alteration service and a mower repair shop; the tree / handyman /
        # cleaners / salvage word is extra work, the kit story still fits
        "gonzalez-landscaping-and-tree-service-memphis-tn", "above-n-beyond-landscaping-n-handyman-services-ogden-ut",
        "yong-s-alterations-cleaners-arvada-co", "john-s-small-engine-repair-salvage-reeds-mo",
        "stone-hill-landscaping-bloomington", "bb-s-salon-barbershop-belpre-oh",
        # Nov 22: Google lists these as car repair shops / mechanics, a muffler shop, tree services and painters; the tire / cycle / custom /
        # property improvements / handyman / construction / sandblasting word is extra work, the kit story still fits
        "twin-city-tire-service-bloomington", "city-tire-kokomo-in", "chicago-tire-sioux-city-ia", "northside-cycle-auto-llc-richmond-in",
        "carmichael-exhaust-custom-terre-haute-in", "gfactor-property-improvements-peoria", "carmelo-duarte-handyman-kewanee",
        "tri-county-painting-sndblstg-pekin", "defiant-construction-maintenance-llc-macomb",
        "alpha-and-omega-painting-and-construction-jesus-is-our-foundation-jackson-mi",
        # Nov 22: Google lists these as an air conditioning repair service and a Mexican restaurant; "Refrigeration" / "& Bar" in the name doesn't change the story
        "j-r-refrigeration-service-parts-llc-union-city-nj", "el-patron-mexican-grill-bar-austin-mn"}

# Nov 22: leads with hand-written copy (multi-trade names) checked by hand: the group's 3D story fits, so they join with their own
# service names and jobs re-worded as "Ask about ..." (kit.own_copy). Left out: Piercings By Spencer (the window would say Tattoo),
# Mince's Creatures (a rural kennel, not a storefront), Home Improvements Plus and The Grease Spot (no Google listing found).
COPY_OK = {"101-corvette-paint-body-shop-macomb", "a-a-paint-seamless-gutters-washington", "tnt-painting-cleaning-bloomington",
           "309-lawn-care-landscaping-excavating-peoria", "bird-dog-diesel-repair-llc-washington", "cns-forestry-and-landscaping-llc-lincoln",
           "marks-lawn-care-and-small-engine-repair-galesburg", "hughes-tree-landscaping-pekin", "bd-auto-truck-body-inc-plymouth-wi",
           "moore-s-lawncare-handy-man-cleaning-services-shelby-oh", "suit-expo-florence-sc", "four-eyes-a-brush-painting-and-pressure-washing-valdosta-ga",
           "root-eaters-plumbing-and-drain-cleaning-services-llc-saginaw-mi", "wright-personal-fitness-rome-ga", "hoff-s-machine-welding-inc-salina-ks",
           "bywaters-plumbing-repair-services-drain-cleaning-cairo-ga"}
# Nov 24: partner-called leads checked by hand on their directory listings (same phone, address and trade): Allen Automotive
# (performance parts and repair, 427 Taylor St), The Grease Spot (oil and lube, 3332 Court St) and Home Improvements Plus
# (home improvements and landscaping, 1915 S Main St). They were held on Nov 22 because no Google listing turned up.
COPY_OK |= {"allen-automotive-east-peoria", "the-grease-spot-pekin", "home-improvements-plus-morton"}
KEEP = KEEP | COPY_OK
# checked by hand: the kit's story would be wrong (Nov 22: a boxing gym whose listing address looks like a house, not a storefront)
HOLD = {"bearcityboxing-new-bern-nc"}


def candidates():
    tiers = json.load(open(os.path.join(ROOT, "_build/tiers/shops.json")))
    dealt = json.load(open(os.path.join(ROOT, "_build/tiers/dealt.json")))
    done = {x["slug"] for x in json.load(open(os.path.join(HERE, "shops.json")))}
    checks = json.load(open(tb.CHECKS_PATH))
    out = []
    for s in tiers + dealt:
        if s["slug"] in done or (s.get("copy") and s["slug"] not in COPY_OK) or s["slug"] in HOLD:
            continue
        if s.get("gstatus") in ("closed", "temp") or s.get("wk") == "own":
            continue
        g = KIT_V.get(s["v"])
        if not g:
            continue
        if tb.trade_problem(s, checks):
            continue
        # a tree or lawn lead whose name says stump grinding gets the stump kit (its own variant, see home.V_NEW)
        if s["v"] in STUMP_V and re.search(r"stump", s["name"].lower()) and kit.st(s) != "CA":
            out.append(("stump", dict(s, kv="stump")))
            continue
        # a handyman lead listed only as a contractor / construction company whose name says roofing or concrete gets that kit
        if g == "handy" and re.search(r"^(general )?contractor$|^construction company$", (s.get("cat") or "").lower()):
            k = "roof" if re.search(r"roof", s["name"].lower()) else "concrete" if re.search(r"concrete", s["name"].lower()) else None
            if k and not re.search(NAME_OUT[k], s["name"].lower()):
                out.append((k, dict(s, kv={"roof": "roofing", "concrete": "concrete"}[k])))
                continue
        # a handyman lead whose Google category is an excavating or well drilling contractor gets the dig or the well kit (own variants, see home.V_NEW)
        if g == "handy" and re.search(r"excavat|well drill", (s.get("cat") or "").lower()):
            k = "well" if "well" in s["cat"].lower() else "dig"
            if not re.search(NAME_OUT[k], s["name"].lower()):
                out.append((k, dict(s, kv={"well": "welldrill", "dig": "excavation"}[k])))
            continue
        # a lawn or landscape lead whose name says snow removal gets the snow kit (its own variant, see home.V_NEW)
        if g == "lawn" and re.search(r"\bsnow\b", s["name"].lower()) and kit.st(s) != "CA":
            out.append(("snow", dict(s, kv="snow")))
            continue
        # an antique store listed as a thrift store gets the antique shop kit (its own variant, see store.V_NEW)
        if s["v"] == "thrift" and "antique" in (s.get("cat") or "").lower():
            if not re.search(NAME_OUT["antique"], s["name"].lower()):
                out.append(("antique", dict(s, kv="antique")))
            continue
        # an ice cream lead whose name says drive-in gets the walk-up stand kit (its own variant, see store.V_NEW)
        if s["v"] == "icecream" and re.search(r"dairy dream|freeze|frost|drive.?in|dip\b|\bstand\b|soft serve|dairy bar", s["name"].lower()):
            if not re.search(NAME_OUT["stand"], s["name"].lower()):
                out.append(("stand", dict(s, kv="dairystand")))
            continue
        # a martial arts lead whose Google category is a boxing gym gets the boxing gym storefront (its own variant, see store.V_NEW)
        if s["v"] == "martial" and "boxing" in (s.get("cat") or "").lower():
            if not re.search(NAME_OUT["boxing"], s["name"].lower()):
                out.append(("boxing", dict(s, kv="boxing")))
            continue
        # an auto repair lead whose name says mobile gets the mobile mechanic driveway kit (its own variant, see home.V_NEW)
        if g == "auto" and re.search(r"\bmobile\b", s["name"].lower()):
            if not re.search(NAME_OUT["mobile"], s["name"].lower()):
                out.append(("mobile", dict(s, kv="mobilemech")))
            continue
        # a repair or brake shop whose name says alignment gets the auto garage with alignment copy (its own variant, see kit.V["alignment"])
        if g == "auto" and re.search(r"alignment", s["name"].lower()) and s["slug"] not in KEEP:
            if not re.search(NAME_OUT["auto"].replace("alignment|", ""), s["name"].lower()):
                out.append(("auto", dict(s, kv="alignment")))
            continue
        # an upholstery lead whose name says auto / marine / top / trim gets the auto upholstery storefront (its own variant, see store.V_NEW)
        if s["v"] == "upholstery" and re.search(r"\bauto\b|marine|\btop\b|\btrim\b", s["name"].lower()):
            if not re.search(NAME_OUT["autotrim"], s["name"].lower()):
                out.append(("autotrim", dict(s, kv="autotrim")))
            continue
        # appliance: only repair services get the kitchen repair story (stores and small-appliance repair are listed as appliance too)
        if g == "appl" and re.search(r"store|small appliance", (s.get("cat") or "").lower()):
            if "store" in (s.get("cat") or "").lower() and not re.search(NAME_OUT["appst"], s["name"].lower()):
                out.append(("appst", dict(s, kv="applstore")))
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
                cur.append({"slug": s["slug"], "owner": "nolan", "src": ["Google listing category (trade check)"], **({"v": s["kv"]} if s.get("kv") else {})})
        json.dump(cur, open(f, "w"), indent=1, ensure_ascii=False)
        print("added to", f)


if __name__ == "__main__":
    main()
