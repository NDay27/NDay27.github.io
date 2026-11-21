"""Home-service groups for the flagship kit, told on the Harlow house (lab.html, flag3d.js):
pressure washing (grimy siding and a stained drive washed clean) and concrete (a cracked drive replaced by a new slab).
The crew's pickup sits at the curb with the business name on the doors.

Pure data, the same shape as store.py: kit.py, tiers2.py, t1250.py, meetdata.py, room.py and make.py merge these tables.
Facts on the pages still come only from each shop's Google listing; nothing here claims hours, prices or years."""
from store import _t, QUIZ_CSS, _I, _G  # noqa: F401  (shared theme helper, quiz styles, icon paths)

GROUPS = {
 "wash": dict(vs=["pressurewash"], drive="wash", noun="pressure washing crew", truck="Pressure Washing"),
 "concrete": dict(vs=["concrete"], drive="concrete", noun="concrete crew", truck="Concrete"),
 "hvac": dict(vs=["hvac"], drive=None, noun="heating and cooling crew", truck="Heating & Air"),
}
KGROUP = {v: g for g, d in GROUPS.items() for v in d["vs"]}
KIT_V = dict(KGROUP)
# names where the story (a house, a driveway, a crew that comes to you) would be wrong
NAME_OUT = {
 "wash": r"industrial|commercial|fleet|truck|car ?wash|auto|mobile services",
 "concrete": r"pump|ranch|land serv|handyman|asphalt|excavat|precast|supply|ready.?mix|^(?!.*concrete).*construct",
 "hvac": r"commercial|industrial|refrigerat|supply|wholesale|distribut|radiator|auto|truck|duct clean|chimney|appliance",
}
TRADE = {"pressurewash": "Pressure washing", "concrete": "Concrete contractor", "hvac": "Heating and air conditioning"}
SCHEMA = {"pressurewash": "HomeAndConstructionBusiness", "concrete": "HomeAndConstructionBusiness", "hvac": "HVACBusiness"}
OVERRIDE = {}

THEME = {
 "wash": _t("#0f2e3a", "#16404f", "#f3f7f7", "#e5eeee", "#0d2630", "#55686d", "#d2dfdf", "#3fb6c6", "#86d6e0", "#1d7d8c", "#081c24", "brico", "dmsans"),
 "concrete": _t("#22252a", "#2f3339", "#f4f3f0", "#e9e7e2", "#1d2024", "#5f6268", "#d9d6cf", "#e07a2e", "#f0a465", "#4a5a6e", "#131518", "archivo", "plex"),
 "hvac": _t("#132640", "#1c3558", "#f4f6f9", "#e5eaf1", "#101c2e", "#566377", "#d3dbe6", "#e4583c", "#f39079", "#2f72b8", "#0a1526", "jost", "dmsans"),
}
EXTRA_CSS = {"wash": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:700;letter-spacing:-.035em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}",
             "concrete": None,
             "hvac": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:600;letter-spacing:-.025em}.hero0 h1 em{font-style:normal}h2{font-weight:600!important}"}

COPY = {
 "wash": dict(svc_h="What we wash", svc_intro="Siding, drives, walks, decks and fences. If it isn't on the list, ask anyway.",
              quote_h="Get a washing quote", cta="Get a washing quote", msg_ph="What needs washing, roughly how big, and when you'd like it done."),
 "concrete": dict(svc_h="What we pour", svc_intro="New slabs, replacements and repairs. If it isn't on the list, ask anyway.",
                  quote_h="Get a concrete quote", cta="Get a concrete quote", msg_ph="Driveway, patio or walk, the rough size, and what's there now."),
}
COPY["hvac"] = dict(svc_h="What we work on", svc_intro="Heating, cooling and the upkeep that keeps both running. If it isn't on the list, ask anyway.",
                   quote_h="Get heating or cooling help", cta="Ask about your system", msg_ph="What the system is doing, roughly how old it is, and when works for a visit.",
                   sheet=("A house in {town}", "Old unit out, new unit in"),
                   sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                   shot=("hvac-after", "A farmhouse with a new outdoor air conditioning unit on a clean pad beside the side wall", "Illustration. Your real job photos go here."))
COPY["wash"].update(sheet=("A house in {town}", "Siding and drive, washed"),
                    sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                    shot=("wash-after", "A white farmhouse with clean siding and a bright, freshly washed driveway, the crew's pickup at the curb", "Illustration. Your real job photos go here."))
COPY["concrete"].update(sheet=("A driveway in {town}", "Old slab out, new slab in"),
                        sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                        shot=("concrete-after", "A farmhouse with a new, bright concrete driveway, the crew's pickup at the curb", "Illustration. Your real job photos go here."))

STEPS = {
 "wash": [("Tell us what needs washing", "The house, the drive, a deck or all three."), ("Get a straight quote", "Know the price before anyone starts."), ("Watch it come clean", "Bright again, and the mess rinsed away.")],
 "concrete": [("Tell us about the project", "What's there now, the size and what you want."), ("Get a straight quote", "Know the plan and the price before work starts."), ("Poured and finished", "Formed, poured, finished and left clean.")],
 "hvac": [("Tell us what it's doing", "No heat, no cooling, an odd noise or just a tune-up."), ("Get a straight answer", "Know the options and the price before work starts."), ("Comfortable again", "Running right, with the mess cleaned up.")],
}

GLYPH = {
 "wash": _G.format("M6 22h8l3-4h6", "currentColor") + _G.format("M23 18l5-3M23 18l6 0M23 18l5 3", "var(--pencil)") + _G.format("M6 22v4h8", "currentColor"),
 "concrete": _G.format("M5 24h22v4H5z", "currentColor") + _G.format("M9 24l4-8h6l4 8M13 16v-6h6v6", "var(--pencil)"),
 "hvac": _G.format("M6 6h20v20H6z", "currentColor") + _G.format("M16 16V9M16 16l6 4M16 16l-6 4", "var(--pencil)"),
}

_J = {
 "house": '<path d="M8 28 28 12l20 16"/><path d="M12 25v21h32V25"/><path d="M24 46V35h8v11"/>',
 "drive": '<path d="M20 8h16l8 40H12z"/><path d="M28 14v6M28 26v6M28 38v6"/>',
 "deck": '<path d="M8 26h40M8 34h40M8 42h40"/><path d="M12 26v20M44 26v20"/><path d="M8 18h40v8H8z"/>',
 "slab": '<path d="M8 36l20-10 20 10-20 10z"/><path d="M8 36v4l20 10 20-10v-4"/><path d="M18 31l20 10M38 31 18 41"/>',
 "patio": '<path d="M8 24h40v20H8z"/><path d="M8 34h40M21 24v20M35 24v20"/>',
 "crack": '<path d="M8 12h40v34H8z"/><path d="M14 18l8 7-3 6 9 5-2 6"/><path d="M34 16l-4 8 7 4"/>',
 "flame": '<path d="M28 48c-9 0-14-6-14-13 0-8 7-12 8-20 6 4 7 9 6 13 2-2 4-4 4-8 5 4 10 9 10 15 0 7-5 13-14 13z"/><path d="M28 48c-3 0-6-2-6-6 0-3 3-5 4-9 3 2 6 5 6 9s-2 6-4 6z"/>',
 "snow": '<path d="M28 8v40M11 18l34 20M11 38l34-20"/><path d="M23 10l5 5 5-5M23 46l5-5 5 5M10 24l7-2-2-7M46 32l-7 2 2 7M10 32l7 2-2 7M46 24l-7-2 2-7"/>',
 "gauge": '<path d="M10 38a18 18 0 1 1 36 0"/><path d="M28 38l9-11"/><circle cx="28" cy="38" r="3"/><path d="M14 30l3 1M18 22l2 2M28 18v3M38 22l-2 2M42 30l-3 1"/><path d="M12 44h32"/>',
}
SVC_ICON = {"House washing": _J["house"], "Driveways and walks": _J["drive"], "Decks and fences": _J["deck"],
            "Driveways": _J["slab"], "Patios and walks": _J["patio"], ("concrete", "Repairs"): _J["crack"],
            "Heating": _J["flame"], "Cooling": _J["snow"], "Tune-ups": _J["gauge"]}

# ---------- Signature and Immersive ----------
_HERO = {
 "wash": ("wash-before", "wash-after", "A farmhouse with grey, grimy siding and a stained, mildewed driveway",
          "The same farmhouse washed bright white with a clean driveway, the crew's pickup at the curb", "60% 50%"),
 "concrete": ("concrete-before", "concrete-after", "A farmhouse driveway cracked and broken, with weeds in the cracks",
              "The same driveway replaced with a new, bright concrete slab, the crew's pickup at the curb", "60% 50%"),
 "hvac": ("hvac-before", "hvac-after", "A rusty, dented old air conditioning unit beside a farmhouse, weeds around its pad",
          "The same spot with a clean new air conditioning unit on the pad, lines run neatly to the wall", "62% 50%"),
}


def hero(g):
    return _HERO[g]


_SVC = {
 "wash": [("wash-house", "Farmhouse siding washed bright white"), ("wash-drive", "A driveway washed clean down to bright concrete"), ("wash-porch", "A clean porch deck and front steps")],
 "concrete": [("concrete-drive", "A new concrete driveway leading up to a garage"), ("concrete-walk", "A clean concrete front walk to the porch"), ("concrete-cracks", "A cracked, stained driveway before the work")],
 "hvac": [("hvac-house", "A white farmhouse with warm lights in the windows at dusk"), ("hvac-unit", "A new outdoor air conditioning unit on a clean pad"), ("hvac-old", "A worn, rusty outdoor unit before the service call")],
}


def svc_img(g):
    return _SVC[g]


_STAGES = {
 "wash": [("wash-s1", "Before", "Years of grime", "Grey siding, tire marks, oil spots and mildew creeping in from the edges."),
          ("wash-s2", "The house", "Siding washed back to white", "Soft wash on the siding, top to bottom."),
          ("wash-s3", "The drive", "One clean pass at a time", "Stains lifted off in straight, overlapping rows."),
          ("wash-s4", "Done", "Like the day it was poured", "A bright drive and a house that looks new again.")],
 "concrete": [("concrete-s1", "Before", "Cracked and sinking", "Broken slabs, weeds in every crack and a corner falling apart."),
              ("concrete-s2", "Pouring", "Old slab out, new slab in", "Formed up straight, then poured from the garage out."),
              ("concrete-s3", "Finishing", "Smooth and even", "Floated, edged and jointed so it cracks where it should, not where it wants."),
              ("concrete-s4", "Done", "A drive that lasts", "Clean edges, even joints and a bright new surface.")],
 "hvac": [("hvac-s1", "Before", "Worn out and working hard", "Rust, bent fins and weeds growing up around the pad."),
          ("hvac-s2", "Out", "The old unit comes out", "Disconnected safely and hauled away."),
          ("hvac-s3", "In", "The new unit goes in", "Set level on the pad, lines run neat and tight to the wall."),
          ("hvac-s4", "Done", "Comfortable again", "A quiet new unit and a clean spot beside the house.")],
}


def stages(g):
    return _STAGES[g]


VISIT = {"wash": "From grimy to bright", "concrete": "From cracked to brand new", "hvac": "From worn out to brand new"}
VISIT_INTRO = "Shown on the same house, from before to done."

TOOL = {
 "wash": ("Wash planner", "What needs a wash?", "Pick what needs cleaning and how bad it is, and know what to mention when you ask.",
          "How bad is it?", [("light", "A little dull", "A light wash usually brings it right back."), ("grime", "Grey and grimy", "Years of dirt come off. Mention any spots that never seem to come clean."),
                             ("green", "Green or black streaks", "That's usually mildew or algae, and it needs the right cleaner, not just pressure. Ask about it."),
                             ("oil", "Oil or rust stains", "Some stains lift right out and some only fade. Ask what to expect.")],
          "A couple of photos help get a straight quote.", "A quick guide, not a quote. The crew will tell you what it really needs."),
 "concrete": ("Slab check", "Fix it or replace it?", "Pick the job and what it looks like now, and get a plain answer on where to start.",
              "What does it look like now?", [("hair", "Small cracks", "Hairline cracks are common. Some can be sealed instead of replaced, so ask."),
                                              ("wide", "Wide cracks or sinking", "Sunken or lifting slabs are usually a sign it's time to look at replacing that section."),
                                              ("broken", "Broken and crumbling", "When it's coming apart, tearing out and pouring new is usually the answer."),
                                              ("new", "Nothing there yet", "A new slab starts with the size and what it'll carry. Have rough measurements ready.")],
              "Rough measurements and a few photos help most.", "A quick guide, not a quote. The crew will tell you what it really needs."),
 "hvac": ("System check", "What is the system doing?", "Pick what's going on and roughly how old the system is, and get a plain answer on where to start.",
          "How old is the system?", [("new", "Under 10 years", "Often worth repairing. Mention the brand if you know it."),
                                     ("mid", "10 to 15 years", "Repair or replace can go either way at this age. Ask about both."),
                                     ("old", "Over 15 years", "Older systems are often near the end of their life. Ask what a replacement would look like."),
                                     ("idk", "Not sure", "No problem. A photo of the label on the outdoor unit tells the crew a lot.")],
          "A photo of the label on the unit helps get a straight answer.", "A quick guide, not a quote. The crew will tell you what it really needs."),
}

READY = {
 "wash": "What needs washing, roughly how big it is, and a photo or two of the worst spots.",
 "concrete": "What the project is, rough measurements, and a few photos of what's there now.",
 "hvac": "What the system is doing, roughly how old it is, and a photo of the label on the outdoor unit if you can.",
}

TOOLS = {g: ("Text-the-crew button", f"Before-and-after slider and a {TOOL[g][0].lower()}",
             "a live 3D house where you " + {"wash": "wash the drive yourself", "concrete": "pour the new drive yourself", "hvac": "swap in the new unit yourself"}[g]) for g in GROUPS}
TRY = {"wash": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                "Drag the slider on the top picture from grimy to clean, then try the wash planner.",
                "Scroll to watch the siding and the drive come clean, then drag the wand down the drive yourself."),
       "concrete": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                    "Drag the slider on the top picture from cracked to new, then try the slab check.",
                    "Scroll to watch the old drive go and the new slab go in, then pour it yourself."),
       "hvac": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                "Drag the slider on the top picture from old to new, then try the system check.",
                "Scroll to watch the old unit come out and the new one go in, then swap it yourself.")}


# t1250: the scroll story. State: fix = how much of the drive is done, house = siding washed (wash only)
def beats(g):
    s1, s2, s3, s4 = stages(g)
    if g == "wash":
        return [("hero", .3, {"house": 0, "fix": 0}, None, "wash-before", None),
                ("house", .3, {"house": 0, "fix": 0}, {"house": 1, "fix": 0}, "wash-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch years of grime come off the siding.")),
                ("close", .3, {"house": 1, "fix": 0}, {"house": 1, "fix": 1}, "wash-s3", ("02 · " + s3[1], s3[2], "Tire marks, oil spots and mildew lifted off, row by row.")),
                ("hero", .3, {"house": 1, "fix": 1}, None, "wash-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"house": 1, "fix": 1}, None, "wash-dusk", ("04 · Evening", "Still bright at dusk", "The kind of house people slow down to look at.")),
                ("cfg", .3, {}, None, "wash-after", "cfg")]
    if g == "hvac":
        return [("hero", .3, {"fix": 0}, None, "hvac-before", None),
                ("close", .3, {"fix": 0}, None, "hvac-s1", ("01 · Before", s1[2], s1[3])),
                ("close", .3, {"fix": 0}, {"fix": 1}, "hvac-s3", ("02 · Out and in", "Old unit out, new unit in", "Keep scrolling and watch the old unit go and the new one drop onto the pad.")),
                ("hero", .3, {"fix": 1}, None, "hvac-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "hvac-dusk", ("04 · Evening", "Quiet and cool at dusk", "The crew's truck at the curb and a house that's comfortable inside.")),
                ("cfg", .3, {}, None, "hvac-after", "cfg")]
    return [("hero", .3, {"fix": 0}, None, "concrete-before", None),
            ("close", .3, {"fix": 0}, None, "concrete-s1", ("01 · Before", s1[2], s1[3])),
            ("close", .3, {"fix": 0}, {"fix": 1}, "concrete-s3", ("02 · " + s2[1], s2[2], "Keep scrolling and watch the new slab go in, from the garage to the street.")),
            ("hero", .3, {"fix": 1}, None, "concrete-after", ("03 · Done", s4[2], s4[3])),
            ("dusk", .84, {"fix": 1}, None, "concrete-dusk", ("04 · Evening", "Solid under the porch light", "Even joints and clean edges that still look sharp at dusk.")),
            ("cfg", .3, {}, None, "concrete-after", "cfg")]


def controls(g):
    if g == "wash":
        return ('<div class="ctl"><label for="u-fix">Wash the drive <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'
                '<div class="ctl"><div class="lab">Siding</div><div class="seg" role="group" aria-label="Siding"><button type="button" aria-pressed="false" data-set="house" data-v="0">Before</button>'
                '<button type="button" aria-pressed="true" data-set="house" data-v="1">Washed</button></div></div>'), "Your turn: wash it yourself", {"house": 1, "fix": 1, "tod": .3}
    if g == "hvac":
        return ('<div class="ctl"><label for="u-fix">Swap in the new unit <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: swap it yourself", {"fix": 1, "tod": .3}
    return ('<div class="ctl"><label for="u-fix">Pour the new drive <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: pour it yourself", {"fix": 1, "tod": .3}


# renders on the Harlow lab: the crew's pickup at the curb carries a generic trade name on the pictures
CAM = {"hero": ("-4,2.8,44", "7.5,1.8,12", 36), "close": ("4.2,1.5,27", "9.6,.3,14", 42), "house": ("-7,2.0,19", "2.5,3.0,3", 40),
       "porch": ("-3.2,1.7,13.5", "0,1.5,5", 44), "walk": ("-4.5,1.6,18", "1.6,.2,9.5", 44), "dusk": ("-4,2.4,42", "7.5,2.0,12", 36),
       "slab": ("1.2,2.9,31.5", "8.6,.9,12", 40),
       "unit": ("-11.4,1.5,6.2", "-7.2,1.0,-.3", 40), "unitc": ("-10.2,1.3,3.4", "-7.3,.75,-.3", 40), "street": ("-17,3.2,50", "-4,1.6,6", 34),
       "side": ("-15,2.4,13", "-5,2.0,-.5", 40)}
_DIRTY = "siding=a9a68f&trim=6f6d60"


def renders(g):
    d = GROUPS[g]; tr = d["truck"].replace(" ", "+").replace("&", "%26")
    base = (f"p=1&drive={d['drive']}&truck={tr}&tx=-1.5" if d["drive"] else f"p=1&truck={tr}&tx=-11") + "&tz=35.4&tr=1.5708"
    def r(name, w, h, cam, tod, st, ox=0):
        c, t, f = CAM[cam]
        q = f"{base}&tod={tod}&cam={c}&tgt={t}&fov={f}&{st}" + (f"&ox={ox}" if ox else "")
        return {"name": f"{g}-{name}", "w": w, "h": h, "q": q}
    if g == "wash":
        return [r("before", 2400, 1350, "hero", .3, f"{_DIRTY}&fix=0", .13), r("after", 2400, 1350, "hero", .3, "fix=1", .13),
                r("s1", 1200, 800, "close", .3, f"{_DIRTY}&fix=0"), r("s2", 1200, 800, "house", .3, "fix=0"),
                r("s3", 1200, 800, "close", .3, "fix=.5"), r("s4", 1200, 800, "close", .3, "fix=1"),
                r("dusk", 1600, 1000, "dusk", .84, "fix=1"), r("house", 1600, 1000, "house", .3, "fix=1"),
                r("drive", 1600, 1000, "close", .3, "fix=1"), r("porch", 1600, 1000, "porch", .3, "fix=1")]
    if g == "hvac":
        return [r("before", 2400, 1350, "unit", .3, "ac=0", .13), r("after", 2400, 1350, "unit", .3, "ac=1", .13),
                r("s1", 1200, 800, "unitc", .3, "ac=0"), r("s2", 1200, 800, "unitc", .3, "ac=.3"),
                r("s3", 1200, 800, "unitc", .3, "ac=.85"), r("s4", 1200, 800, "unitc", .3, "ac=1"),
                r("dusk", 1600, 1000, "street", .84, "ac=1"), r("house", 1600, 1000, "street", .3, "ac=1"),
                r("unit", 1600, 1000, "unitc", .3, "ac=1"), r("old", 1600, 1000, "unitc", .3, "ac=0")]
    return [r("before", 2400, 1350, "slab", .3, "fix=0", .13), r("after", 2400, 1350, "slab", .3, "fix=1", .13),
            r("s1", 1200, 800, "close", .3, "fix=0"), r("s2", 1200, 800, "close", .3, "fix=.35"),
            r("s3", 1200, 800, "close", .3, "fix=.7"), r("s4", 1200, 800, "close", .3, "fix=1"),
            r("dusk", 1600, 1000, "dusk", .84, "fix=1"), r("drive", 1600, 1000, "close", .3, "fix=1"),
            r("walk", 1600, 1000, "walk", .3, "fix=1"), r("cracks", 1600, 1000, "close", .3, "fix=0")]
