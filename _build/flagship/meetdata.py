"""The nds-shop JSON that the pitch room (meet/) reads from each shop's $300 page, for the flagship kit."""
import importlib.util
import json
import os

import kit

_spec = importlib.util.spec_from_file_location("tiers_build", os.path.join(kit.ROOT, "_build/tiers/build.py"))
tb = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(tb)

TOOLS = {
 "lawn": ("Text-the-crew button", "Before-and-after yard slider and a season planner", "a live 3D yard you can mow and stripe yourself"),
 "tree": ("Text-the-crew button", "Before-and-after tree slider and a quick tree check", "a live 3D yard where you trim the tree or take it down"),
 "painting": ("Text-the-painter button", "Color picker that repaints a real house", "a live 3D house you can repaint in any color"),
 "auto": ("Text-the-shop button", "Before-and-after slider and a dash light check", "a live 3D shop where you raise the lift, pull the wheels and pop the hood"),
 "body": ("Text-the-shop button", "Before-and-after slider and a tap-the-damage check", "a live 3D shop where you take a crumpled truck from damaged to primer to fresh paint"),
}
TRY = {
 "lawn": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
          "Drag the slider on the top picture from overgrown to striped, then pick a month in the season planner.",
          "Scroll and watch the mower cut the yard, then drag the controls to mow and stripe it yourself."),
 "tree": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
          "Drag the slider on the top picture from overgrown to trimmed, then answer the three tree-check questions.",
          "Scroll to trim the tree off the roof, then try taking it down to a stump."),
 "painting": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
          "Drag the before-and-after slider, then tap a color and watch the house change.",
          "Scroll to watch the house get repainted, then pick any color and see it on the 3D house."),
 "body": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
          "Drag the slider on the top picture from damaged to fixed, then tap where the damage is in the damage check.",
          "Scroll to watch the dent come out, the primer go on and the paint come back, then drag the repair slider yourself."),
 "auto": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
          "Drag the slider on the top picture from in the bay to back on the road, then tap a warning light in the dash light check.",
          "Scroll to watch the truck go up on the lift and come apart, then raise the lift and pop the hood yourself."),
}


import store  # noqa: E402
TOOLS.update(store.TOOLS); TRY.update(store.TRY)
import home  # noqa: E402
TOOLS.update(home.TOOLS); TRY.update(home.TRY)
tb.TRADE_LABEL.update(home.TRADE_LABEL); tb.TRADE_LABEL.update(store.TRADE_LABEL)
tb.TRADE_LABEL.setdefault("alignment", "Auto Repair")  # kit.V["alignment"]: alignment shops on the auto garage


def meet(s):
    g = s["group"]
    t = TOOLS[g]
    who = "shop" if g in kit.SHOPS else "crew"
    shop = dict(s); shop["group"] = kit.V[s["v"]]["group"]  # the tier template's group, for the shared pitch-room text
    d = json.loads(tb.meet_json(shop).replace("<\\/", "</"))
    r = tb.rating_txt(shop)
    d["tools"] = {"essential": t[0], "signature": t[1], "immersive": t[2]}
    d["versions"]["essential"]["features"] = [
        "One fast page, up to 5 sections, with a hand-drawn hero that draws itself",
        "Tap-to-call bar on every phone screen",
        f"{t[0]}: tap what you need and the text writes itself",
        ("Your Google rating, " if kit.rating_ok(s) else "Your Google listing, ") + "the towns you work in and a request form",
        "Set up for Google search, live the same day"]
    d["versions"]["signature"] = {
        "blurb": f"Art-directed with {"3D-rendered" if g in kit.SHOPS else "photo-real"} pictures: {t[1][0].lower() + t[1][1:]}, and a request planner that fills in a ticket as people choose.",
        "features": ["Everything in Starter, up to 7 sections", "Custom look and type made for your " + who,
                     "Before-and-after hero people can drag", t[1], "\"How a visit goes\" story in four pictures",
                     "Request planner that fills in a live ticket as people choose", "Two rounds of changes"]}
    d["versions"]["immersive"] = {
        "blurb": f"The showpiece: {t[2]}, told as people scroll, with day and dusk light. Everything in Signature too.",
        "features": ["Everything in Signature", "A real-time 3D centerpiece: " + t[2], "Scroll-told story from before to after",
                     "Day and dusk light", "Built to be the site people remember and share"]}
    d["compare"] = [["Built for phones first, tap-to-call on every screen", 1, 1, 1],
                    ["Your Google " + ("rating, " if kit.rating_ok(s) else "listing, ") + "your towns and a request form", 1, 1, 1],
                    [t[0], 1, 1, 1], ["Business details set up for Google search", 1, 1, 1], ["Live the same day you approve it", 1, 1, 1],
                    ["Custom look and type made for your " + who + ", not a template", 0, 1, 1],
                    [("3D-rendered" if g in kit.SHOPS else "Photo-real") + " before-and-after people can drag", 0, 1, 1], [t[1], 0, 1, 1], ["Request planner with a live ticket", 0, 1, 1],
                    ["A real-time 3D centerpiece (" + t[2] + ")", 0, 0, 1], ["Day and dusk light", 0, 0, 1],
                    ["Rounds of changes included", "1 (any time on $99/mo)", "2", "2"], ["Sections", "up to 5", "up to 7", "up to 7"]]
    d["try"] = {"essential": TRY[g][0], "signature": TRY[g][1], "immersive": TRY[g][2]}
    if not kit.rating_ok(s):
        d["why"] = d["why"].split(" Your ")[0]
        d.pop("rating", None); d.pop("reviews", None)
    sh = os.path.join(kit.ROOT, "p/2e8e4a", s["slug"], "shots", "v300.jpg")
    if os.path.exists(sh):
        d["thumbs"] = {k: f"{kit.BASE}{s['slug']}/shots/v{n}.jpg" for k, n in (("essential", 300), ("signature", 750), ("immersive", 1250))}
    d["kit"] = "flagship"
    d["room"] = f"{kit.BASE}{s['slug']}/room/"
    return json.dumps(d, ensure_ascii=False).replace("</", "<\\/")
