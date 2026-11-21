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
 "plumb": dict(vs=["plumbing"], drive=None, noun="plumbing crew", truck="Plumbing"),
 "handy": dict(vs=["handyman"], drive=None, noun="handyman", truck="Handyman"),
 "clean": dict(vs=["houseclean"], drive=None, noun="cleaning team", truck="House Cleaning"),
 "stump": dict(vs=["stump"], drive=None, noun="stump grinding crew", truck="Stump Grinding"),
 "office": dict(vs=["janitorial"], drive=None, noun="cleaning team", truck="Janitorial"),
 "tow": dict(vs=["towing"], drive=None, noun="towing crew", truck="Towing"),
 "engine": dict(vs=["smallengine"], drive=None, noun="repair shop", truck="Small Engine Repair"),
 "weld": dict(vs=["welding"], drive=None, noun="welding shop", truck="Welding"),
 "carpet": dict(vs=["carpetclean"], drive=None, noun="cleaning team", truck="Carpet Cleaning"),
}
KGROUP = {v: g for g, d in GROUPS.items() for v in d["vs"]}
KIT_V = dict(KGROUP)
# names where the story (a house, a driveway, a crew that comes to you) would be wrong
NAME_OUT = {
 "wash": r"industrial|commercial|fleet|truck|car ?wash|auto|mobile services",
 "concrete": r"pump|ranch|land serv|handyman|asphalt|excavat|precast|supply|ready.?mix|^(?!.*concrete).*construct",
 "hvac": r"commercial|industrial|refrigerat|supply|wholesale|distribut|radiator|auto|truck|duct clean|chimney|appliance",
 "plumb": r"commercial|industrial|supply|wholesale|distribut|septic|well drill|irrigat|pool|porta|fire sprinkler",
 "clean": r"commercial|janitor|office|carpet|window|pressure|power wash|restoration|duct|chimney|pool|maid supply|supply",
 "handy": r"excavat|digging|well|metal|insulation|roofing|gates?\b|concrete|property manag|fenc",
 "stump": r"$^",
 "tow": r"$^",
 "weld": r"$^",
 "carpet": r"\brugs?\b|commercial|restoration|flood|water damage",
 "engine": r"mobile|salvage|marine|outboard|auto|truck|diesel",
 "office": r"carpet|window|pressure|power wash|restoration|duct|chimney|pool|supply|house|home|maid|residential",
}
TRADE = {"pressurewash": "Pressure washing", "concrete": "Concrete contractor", "hvac": "Heating and air conditioning", "plumbing": "Plumber", "handyman": "Handyman", "houseclean": "House cleaning service", "stump": "Stump grinding", "janitorial": "Janitorial service", "towing": "Towing service", "smallengine": "Small engine repair", "welding": "Welding and fabrication", "carpetclean": "Carpet cleaning service"}
SCHEMA = {"pressurewash": "HomeAndConstructionBusiness", "concrete": "HomeAndConstructionBusiness", "hvac": "HVACBusiness", "plumbing": "Plumber", "handyman": "HomeAndConstructionBusiness", "houseclean": "LocalBusiness", "stump": "HomeAndConstructionBusiness", "janitorial": "LocalBusiness", "towing": "AutomotiveBusiness", "smallengine": "LocalBusiness", "welding": "HomeAndConstructionBusiness", "carpetclean": "LocalBusiness"}
OVERRIDE = {}
# stump grinders are tree-service leads on Google; pick.py moves the ones with "stump" in the name onto their own variant
V_NEW = {"stump": dict(group="tree", noun="crew", h300=["Stumps gone.", "Lawn back."], h750=["Grind it out.", "Mow right over."],
                       h1250=["Down to the dirt.", "Gone for good."],
                       lede="Stump grinding in {town} and nearby. Tell us about the stump and get a straight answer on what it takes.",
                       services=[("Stump grinding", "Old stumps ground down so you can mow right over the spot."),
                                 ("More than one stump", "One stump or a whole row, done in the same visit."),
                                 ("Surface roots", "Roots that trip the mower, ground down along with the stump.")],
                       jobs=["One stump", "A few stumps", "Surface roots", "Something else"],
                       when=["As soon as possible", "In the next two weeks", "This season", "Just getting a quote"],
                       who="homeowners", ask="What needs grinding?")}
TRADE_LABEL = {"stump": "Stump Grinding"}

THEME = {
 "wash": _t("#0f2e3a", "#16404f", "#f3f7f7", "#e5eeee", "#0d2630", "#55686d", "#d2dfdf", "#3fb6c6", "#86d6e0", "#1d7d8c", "#081c24", "brico", "dmsans"),
 "concrete": _t("#22252a", "#2f3339", "#f4f3f0", "#e9e7e2", "#1d2024", "#5f6268", "#d9d6cf", "#e07a2e", "#f0a465", "#4a5a6e", "#131518", "archivo", "plex"),
 "clean": _t("#173b3a", "#1f4c4a", "#f6f8f6", "#e7efec", "#122e2d", "#5b6f6c", "#d3e2de", "#e0735a", "#f0a593", "#2f8f7a", "#0c2423", "fraunces", "dmsans"),
 "handy": _t("#2a2320", "#3a302b", "#f6f2ec", "#ece5da", "#241d19", "#6a5f56", "#ddd3c5", "#e8a33a", "#f3c57a", "#3f6e5a", "#18120f", "brico", "dmsans"),
 "plumb": _t("#0e2a47", "#163a5f", "#f3f6f8", "#e3eaf0", "#0c2036", "#53657a", "#d0dbe5", "#1f8fe0", "#6cb9f0", "#e0563a", "#071a2e", "archivo", "dmsans"),
 "stump": _t("#2a2a1e", "#38382a", "#f5f3ec", "#e9e6da", "#22221a", "#64645a", "#d9d5c6", "#e8762c", "#f3a46e", "#5d7a3a", "#16160f", "brico", "dmsans"),
 "office": _t("#1a2a3f", "#233752", "#f4f6f8", "#e4e9ef", "#141f2e", "#58657a", "#d3dae4", "#2fb38f", "#7fd6bc", "#d9774f", "#0d1624", "archivo", "dmsans"),
 "tow": _t("#1b1d22", "#272a31", "#f5f4f1", "#e8e6e1", "#16181c", "#62656d", "#d8d5ce", "#f0b400", "#f6d266", "#c8261b", "#0f1013", "archivo", "dmsans"),
 "engine": _t("#20261f", "#2c342a", "#f5f4ee", "#e8e7dc", "#1a1f19", "#626a5f", "#d8d8ca", "#d9452b", "#ee8a72", "#4f7a3a", "#11150f", "brico", "dmsans"),
 "weld": _t("#1c2228", "#273039", "#f3f4f5", "#e4e7ea", "#161b20", "#5e6670", "#d3d8dd", "#3aa0e0", "#8ccaf0", "#e8862c", "#0e1216", "archivo", "dmsans"),
 "carpet": _t("#2b2340", "#382e52", "#f7f5f2", "#ece8e1", "#231c35", "#655e72", "#ddd6e2", "#e0a43a", "#f0c97c", "#5a7fb8", "#171225", "fraunces", "dmsans"),
 "hvac": _t("#132640", "#1c3558", "#f4f6f9", "#e5eaf1", "#101c2e", "#566377", "#d3dbe6", "#e4583c", "#f39079", "#2f72b8", "#0a1526", "jost", "dmsans"),
}
EXTRA_CSS = {"wash": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:700;letter-spacing:-.035em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}",
             "concrete": None,
             "plumb": None,
             "clean": None,
             "carpet": None,
             "weld": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:800;letter-spacing:-.035em}h2{font-weight:700!important}.hero0 h1 em{font-style:normal}",
             "engine": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:700;letter-spacing:-.035em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}",
             "tow": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:800;letter-spacing:-.035em}h2{font-weight:700!important}.hero0 h1 em{font-style:normal}",
             "office": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:700;letter-spacing:-.03em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}",
             "stump": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:700;letter-spacing:-.035em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}",
             "handy": ".hero h1 .l2{font-style:normal}.hero h1{font-weight:700;letter-spacing:-.035em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}",
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
COPY["clean"] = dict(svc_h="How we clean", svc_intro="Regular visits, deep cleans and move-outs. If it isn't on the list, ask anyway.",
                    quote_h="Get a cleaning quote", cta="Get a cleaning quote", msg_ph="How many bedrooms and bathrooms, the kind of clean, and how often.",
                    sheet=("A home in {town}", "Every room, spotless"),
                    sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                    shot=("clean-after", "A bright, tidy living room with a shining wood floor, pillows on the sofa and fresh flowers on the table", "Illustration. Your real photos go here."))
COPY["office"] = dict(svc_h="What we clean", svc_intro="Offices, break rooms and restrooms, on a schedule that fits your hours. If it isn't on the list, ask anyway.",
                     quote_h="Get a cleaning quote", cta="Get a cleaning quote", msg_ph="What kind of space, roughly how big, and how often you'd like it cleaned.",
                     sheet=("A workplace in {town}", "Every desk, every floor"),
                     sheet_label="Line drawing of a two-storey brick office building on main street with a striped awning and a big front window",
                     shot=("office-after", "A tidy office with clear desks, a wiped whiteboard and fresh vacuum lines in the carpet", "Illustration. Your real photos go here."))
COPY["carpet"] = dict(svc_h="What we clean", svc_intro="Whole houses, single rooms, stains and upholstery. If it isn't on the list, ask anyway.",
                     quote_h="Get a carpet cleaning quote", cta="Get a cleaning quote", msg_ph="Which rooms, roughly how big, any pets or stains, and when works for a visit.",
                     sheet=("A home in {town}", "Every room, every fiber"),
                     sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                     shot=("carpet-after", "A bright living room with fresh, even cleaning stripes in a stain-free carpet", "Illustration. Your real photos go here."))
COPY["tow"] = dict(svc_h="How we help", svc_intro="Tows, roadside help and moving a vehicle from one place to another. If it isn't on the list, ask anyway.",
                  quote_h="Get a tow", cta="Call for a tow", msg_ph="Where the vehicle is, what kind it is, what happened and where it needs to go.",
                  sheet=("A street in {town}", "Loaded up, ready to roll"),
                  sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                  shot=("tow-after", "A rollback tow truck at the curb with a blue pickup strapped down on its bed", "Illustration. Your real job photos go here."))
COPY["engine"] = dict(svc_h="What we fix", svc_intro="Mowers, riders, saws, trimmers and the tune-ups that keep them going. If it isn't on the list, ask anyway.",
                     quote_h="Ask about a repair", cta="Ask about a repair", msg_ph="What it is, the make if you know it, and what it's doing or not doing.",
                     sheet=("A driveway in {town}", "Starts on the first pull"),
                     sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                     shot=("engine-after", "A red riding mower out on the front lawn of a white farmhouse, ready to mow", "Illustration. Your real job photos go here."))
COPY["weld"] = dict(svc_h="What we weld", svc_intro="Repairs, custom pieces, trailers and gates. If it isn't on the list, ask anyway.",
                   quote_h="Ask about a job", cta="Ask about a job", msg_ph="What it is, what's broken or what you want built, and a rough size.",
                   sheet=("A driveway in {town}", "Gate welded and hung true"),
                   sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                   shot=("weld-after", "A black steel double gate swung open at the end of a farmhouse driveway", "Illustration. Your real job photos go here."))
COPY["stump"] = dict(svc_h="What we grind", svc_intro="Old stumps, rows of them and the roots that come with them. If it isn't on the list, ask anyway.",
                    quote_h="Get a stump quote", cta="Get a stump quote", msg_ph="How many stumps, roughly how wide across, and where they are in the yard.",
                    sheet=("A yard in {town}", "Stump out, grass back"),
                    sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                    shot=("stump-after", "A side yard beside a white farmhouse with fresh new grass where an old stump used to be", "Illustration. Your real job photos go here."))
COPY["handy"] = dict(svc_h="What's on the list", svc_intro="Repairs, installs and the projects that keep getting pushed back. If it isn't on the list, ask anyway.",
                    quote_h="Send your list", cta="Send your list", msg_ph="What needs doing, a rough size for each thing, and when works for a visit.",
                    sheet=("A house in {town}", "The to-do list, done"),
                    sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                    shot=("handy-after", "A farmhouse porch with the gutter back up, a new top step and a straight mailbox at the curb", "Illustration. Your real job photos go here."))
COPY["plumb"] = dict(svc_h="What we fix", svc_intro="Leaks, clogs, water heaters and new fixtures. If it isn't on the list, ask anyway.",
                    quote_h="Get plumbing help", cta="Ask about your plumbing", msg_ph="What's going on, where in the house, and how soon you need someone.",
                    sheet=("A house in {town}", "Line dug up and fixed"),
                    sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                    shot=("plumb-after", "A farmhouse front lawn with a neat strip of fresh sod where a broken water line was dug up and replaced", "Illustration. Your real job photos go here."))
COPY["wash"].update(sheet=("A house in {town}", "Siding and drive, washed"),
                    sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                    shot=("wash-after", "A white farmhouse with clean siding and a bright, freshly washed driveway, the crew's pickup at the curb", "Illustration. Your real job photos go here."))
COPY["concrete"].update(sheet=("A driveway in {town}", "Old slab out, new slab in"),
                        sheet_label="Line drawing of a two-storey farmhouse with a porch and a garage wing",
                        shot=("concrete-after", "A farmhouse with a new, bright concrete driveway, the crew's pickup at the curb", "Illustration. Your real job photos go here."))

STEPS = {
 "wash": [("Tell us what needs washing", "The house, the drive, a deck or all three."), ("Get a straight quote", "Know the price before anyone starts."), ("Watch it come clean", "Bright again, and the mess rinsed away.")],
 "concrete": [("Tell us about the project", "What's there now, the size and what you want."), ("Get a straight quote", "Know the plan and the price before work starts."), ("Poured and finished", "Formed, poured, finished and left clean.")],
 "clean": [("Tell us about your home", "Rooms, the kind of clean and how often."), ("Get a straight quote", "Know the price before the first visit."), ("Come home to clean", "Every room done, top to bottom.")],
 "carpet": [("Tell us about the rooms", "Which rooms, roughly how big, and any stains."), ("Get a straight quote", "Know the price before the team shows up."), ("Walk on clean carpet", "Stains out, fibers lifted, and fresh all over.")],
 "office": [("Tell us about the space", "What kind of space, how big and how often."), ("Get a straight quote", "Know the price before the first visit."), ("Walk in to clean", "Desks wiped, bins out, floors done.")],
 "tow": [("Call and say where you are", "The street, a landmark or a mile marker."), ("Know what to expect", "What it takes and the price before the hook goes on."), ("Loaded and on the way", "Strapped down and taken where it needs to go.")],
 "engine": [("Tell us what's not running", "What it is and what it's doing, or not doing."), ("Get a straight answer", "What it needs and the price before work starts."), ("Running right", "Back to you ready for the season.")],
 "weld": [("Tell us about the job", "What's broken or what you want built."), ("Get a straight answer", "What it takes and the price before work starts."), ("Welded and done right", "Strong joints, clean beads, and a finish that lasts.")],
 "stump": [("Tell us about the stump", "How many, roughly how wide, and where."), ("Get a straight quote", "Know the price before the grinder shows up."), ("Gone for good", "Ground out, chips raked and ready for grass.")],
 "handy": [("Send the list", "One thing or ten. A photo of each helps."), ("Get a straight quote", "Know the price before work starts."), ("Crossed off", "Done right, and cleaned up after.")],
 "plumb": [("Tell us what's going on", "A leak, a clog, no hot water or something new."), ("Get a straight answer", "Know what it needs and the price before work starts."), ("Fixed and cleaned up", "Running right, with the mess cleaned up.")],
 "hvac": [("Tell us what it's doing", "No heat, no cooling, an odd noise or just a tune-up."), ("Get a straight answer", "Know the options and the price before work starts."), ("Comfortable again", "Running right, with the mess cleaned up.")],
}

GLYPH = {
 "wash": _G.format("M6 22h8l3-4h6", "currentColor") + _G.format("M23 18l5-3M23 18l6 0M23 18l5 3", "var(--pencil)") + _G.format("M6 22v4h8", "currentColor"),
 "concrete": _G.format("M5 24h22v4H5z", "currentColor") + _G.format("M9 24l4-8h6l4 8M13 16v-6h6v6", "var(--pencil)"),
 "clean": _G.format("M10 27l6-14h4l-2 14", "currentColor") + _G.format("M22 8l1.5 3.5L27 13l-3.5 1.5L22 18l-1.5-3.5L17 13l3.5-1.5z", "var(--pencil)"),
 "carpet": _G.format("M8 27h16M16 27V10", "currentColor") + _G.format("M24 6l1.5 3.5L28 11l-3.5 1.5L24 16l-1.5-3.5L19 11l3.5-1.5z", "var(--pencil)"),
 "office": _G.format("M6 24h20M9 24v4M23 24v4M10 24v-8h12v8", "currentColor") + _G.format("M24 6l1.5 3.5L29 11l-3.5 1.5L24 16l-1.5-3.5L19 11l3.5-1.5z", "var(--pencil)"),
 "tow": _G.format("M4 22h14v-6h5l3 4v2h2", "currentColor") + _G.format("M8 25a2 2 0 1 0 0 .1M22 25a2 2 0 1 0 0 .1M18 16l8-8", "var(--pencil)"),
 "engine": _G.format("M6 22h14l4-6h4v6", "currentColor") + _G.format("M10 25a2.5 2.5 0 1 0 0 .1M24 25a2 2 0 1 0 0 .1M14 16V8h4", "var(--pencil)"),
 "weld": _G.format("M5 26h22M8 26V12M24 26V12M8 12h16M8 26l16-14", "currentColor") + _G.format("M17 18l2-3M19 20l3-1M15 21l-3 2", "var(--pencil)"),
 "stump": _G.format("M8 26h16M10 26l1-8h10l1 8", "currentColor") + _G.format("M14 18c0-3 2-5 4-5s4 2 4 5M24 9l2-3M27 12l3-1", "var(--pencil)"),
 "handy": _G.format("M8 26l12-12M17 11l4 4", "currentColor") + _G.format("M20 6l6 6-3 3-6-6z", "var(--pencil)"),
 "plumb": _G.format("M5 12h10v8h12", "currentColor") + _G.format("M24 24c0 2 1.5 3.5 3 3.5S30 26 30 24c0-2-3-6-3-6s-3 4-3 6z", "var(--pencil)"),
 "hvac": _G.format("M6 6h20v20H6z", "currentColor") + _G.format("M16 16V9M16 16l6 4M16 16l-6 4", "var(--pencil)"),
}

_J = {
 "house": '<path d="M8 28 28 12l20 16"/><path d="M12 25v21h32V25"/><path d="M24 46V35h8v11"/>',
 "drive": '<path d="M20 8h16l8 40H12z"/><path d="M28 14v6M28 26v6M28 38v6"/>',
 "deck": '<path d="M8 26h40M8 34h40M8 42h40"/><path d="M12 26v20M44 26v20"/><path d="M8 18h40v8H8z"/>',
 "slab": '<path d="M8 36l20-10 20 10-20 10z"/><path d="M8 36v4l20 10 20-10v-4"/><path d="M18 31l20 10M38 31 18 41"/>',
 "patio": '<path d="M8 24h40v20H8z"/><path d="M8 34h40M21 24v20M35 24v20"/>',
 "crack": '<path d="M8 12h40v34H8z"/><path d="M14 18l8 7-3 6 9 5-2 6"/><path d="M34 16l-4 8 7 4"/>',
 "spray": '<path d="M20 22h14v26H20z"/><path d="M22 22l2-8h8l-4 8"/><path d="M32 14h8l-4 4"/><path d="M42 10l3-2M43 15h4M42 20l3 2"/>',
 "sparkle": '<path d="M28 8l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/><path d="M44 36l1.5 4.5L50 42l-4.5 1.5L44 48l-1.5-4.5L38 42l4.5-1.5z"/>',
 "boxes": '<path d="M8 26h18v20H8zM26 30h18v16H26z"/><path d="M14 18h18v8H14z"/><path d="M8 32h18M26 36h18"/><path d="M40 14l6 6-6 6"/>',
 "drill": '<path d="M10 18h24v10H10z"/><path d="M34 21h10M44 23h4"/><path d="M16 28l-3 18h10l2-18"/><path d="M14 22h8"/>',
 "plan": '<path d="M10 10h28l8 8v28H10z"/><path d="M38 10v8h8"/><path d="M17 24h22M17 31h22M17 38h14"/><path d="M14 24h0M14 31h0M14 38h0"/>',
 "heater": '<rect x="18" y="8" width="20" height="40" rx="6"/><path d="M22 8V5M34 8V5"/><path d="M28 34c-3 0-5-2-5-5 0-3 3-5 3-8 3 2 6 5 6 8 0 3-2 5-4 5z"/><path d="M18 42h20"/>',
 "faucet": '<path d="M10 24h20a6 6 0 0 1 6 6v4"/><path d="M10 20v8M24 16v8M18 16h12"/><path d="M36 40c0 2-1.5 4-3 4s-3-2-3-4 3-5 3-5 3 3 3 5z"/><path d="M6 48h44"/>',
 "flame": '<path d="M28 48c-9 0-14-6-14-13 0-8 7-12 8-20 6 4 7 9 6 13 2-2 4-4 4-8 5 4 10 9 10 15 0 7-5 13-14 13z"/><path d="M28 48c-3 0-6-2-6-6 0-3 3-5 4-9 3 2 6 5 6 9s-2 6-4 6z"/>',
 "snow": '<path d="M28 8v40M11 18l34 20M11 38l34-20"/><path d="M23 10l5 5 5-5M23 46l5-5 5 5M10 24l7-2-2-7M46 32l-7 2 2 7M10 32l7 2-2 7M46 24l-7-2 2-7"/>',
 "stump": '<path d="M14 46h28"/><path d="M17 46l2-18h18l2 18"/><ellipse cx="28" cy="28" rx="9" ry="3"/><path d="M12 46l-4 3M44 46l4 3"/>',
 "stumps": '<path d="M6 46h44"/><path d="M9 46l1-10h10l1 10M27 46l1-14h12l1 14"/><ellipse cx="15" cy="36" rx="5" ry="2"/><ellipse cx="34" cy="32" rx="6" ry="2"/>',
 "roots": '<path d="M8 22h40"/><path d="M28 22c0 8-6 10-12 14M28 22c2 7 8 9 14 12M28 22v20M20 28c-4 0-8 2-10 4M36 28c4 1 7 3 9 6"/>',
 "wand": '<path d="M14 48h28"/><path d="M28 48V12l8-4"/><path d="M22 12h12"/><path d="M10 44h6M40 44h6"/>',
 "drop": '<path d="M28 8c8 10 14 18 14 25a14 14 0 0 1-28 0c0-7 6-15 14-25z"/><path d="M8 48l40-40"/>',
 "sofa": '<path d="M10 26v-6a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v6"/><path d="M6 26h8v10h28V26h8v14H6z"/><path d="M10 40v6M46 40v6"/>',
 "desk": '<path d="M6 34h44M10 34v14M46 34v14"/><path d="M18 12h20v14H18z"/><path d="M28 26v8M22 34h12"/>',
 "calendar": '<path d="M10 14h36v32H10z"/><path d="M10 22h36M18 8v10M38 8v10"/><path d="M19 34l5 5 10-10"/>',
 "tow": '<path d="M4 38h24V24h10l8 8v6h4"/><circle cx="14" cy="42" r="4"/><circle cx="40" cy="42" r="4"/><path d="M8 24l14-12M22 12v10"/><path d="M22 22a3 3 0 1 0 3 3"/>',
 "roadside": '<path d="M10 48 22 8M46 48 34 8"/><path d="M28 12v6M28 26v6M28 40v6"/><path d="M40 46l4-14 4 14z"/><path d="M38 46h12"/>',
 "flatbed": '<path d="M4 34h34l6-10h6v14H4z"/><circle cx="12" cy="42" r="4"/><circle cx="40" cy="42" r="4"/><path d="M10 34v-8h18l4 8"/><path d="M14 26l2-4h8l2 4"/>',
 "mower": '<path d="M8 36h30l6-10h4"/><path d="M14 36v-8h14l4 8"/><circle cx="14" cy="42" r="5"/><circle cx="40" cy="42" r="3"/><path d="M22 28v-8l6-4"/><path d="M6 46h44"/>',
 "saw": '<path d="M6 30h12v-8h10l4 4h18v8H32l-4 4H18v-8"/><path d="M32 26h18M34 30h2M40 30h2M46 30h2"/><path d="M12 22v-6h8"/>',
 "weld": '<path d="M8 40h40"/><path d="M12 40c2-3 4-3 6 0s4 3 6 0 4-3 6 0 4 3 6 0 4-3 6 0"/><path d="M30 30 40 12l4 2-10 18"/><path d="M26 28l-4-4M30 26l2-6M24 32l-6 0"/>',
 "beam": '<path d="M10 12h36M10 44h36M28 12v32"/><path d="M10 12v4h36v-4M10 44v-4h36v4"/>',
 "van": '<path d="M4 38V20h28l10 8h8v10z"/><circle cx="14" cy="40" r="4"/><circle cx="40" cy="40" r="4"/><path d="M32 20v8h10"/><path d="M12 26h12"/>',
 "gauge": '<path d="M10 38a18 18 0 1 1 36 0"/><path d="M28 38l9-11"/><circle cx="28" cy="38" r="3"/><path d="M14 30l3 1M18 22l2 2M28 18v3M38 22l-2 2M42 30l-3 1"/><path d="M12 44h32"/>',
}
SVC_ICON = {"House washing": _J["house"], "Driveways and walks": _J["drive"], "Decks and fences": _J["deck"],
            "Driveways": _J["slab"], "Patios and walks": _J["patio"], ("concrete", "Repairs"): _J["crack"],
            "Heating": _J["flame"], "Cooling": _J["snow"], "Tune-ups": _J["gauge"],
            "Water heaters": _J["heater"], "New fixtures": _J["faucet"], "Installs": _J["drill"], "Projects": _J["plan"],
            "Regular cleaning": _J["spray"], "Deep cleaning": _J["sparkle"], "Move-in and move-out": _J["boxes"],
            ("weld", "Repairs"): _J["weld"], "Fabrication": _J["beam"], "Mobile work": _J["van"],
            "Mowers": _J["mower"], "Saws and trimmers": _J["saw"],
            "Towing": _J["tow"], "Roadside help": _J["roadside"], "Hauling": _J["flatbed"],
            "Carpet cleaning": _J["wand"], "Spots and stains": _J["drop"], "Upholstery": _J["sofa"],
            "Office cleaning": _J["desk"], "Regular service": _J["calendar"],
            "Stump grinding": _J["stump"], "More than one stump": _J["stumps"], "Surface roots": _J["roots"]}

# ---------- Signature and Immersive ----------
_HERO = {
 "wash": ("wash-before", "wash-after", "A farmhouse with grey, grimy siding and a stained, mildewed driveway",
          "The same farmhouse washed bright white with a clean driveway, the crew's pickup at the curb", "60% 50%"),
 "concrete": ("concrete-before", "concrete-after", "A farmhouse driveway cracked and broken, with weeds in the cracks",
              "The same driveway replaced with a new, bright concrete slab, the crew's pickup at the curb", "60% 50%"),
 "weld": ("weld-before", "weld-after", "A rusted double gate at the end of a farmhouse drive, one leaf sagging to the ground with its brace snapped",
          "The same gate welded, hung level and painted black, both leaves swung open", "58% 50%"),
 "engine": ("engine-before", "engine-after", "A red riding mower in a farmhouse driveway with its hood up, a flat front tire and old parts on a tarp",
            "The same mower fixed and out on the front lawn, hood down and lights on", "60% 50%"),
 "tow": ("tow-before", "tow-after", "A blue pickup broken down at the curb with its hood up and hazards on, in front of a white farmhouse",
         "The same pickup strapped down on a rollback tow truck at the curb, ready to roll", "60% 50%"),
 "carpet": ("carpet-before", "carpet-after", "A living room carpet with a coffee spill, a red wine stain, muddy paw prints and a grey traffic path",
            "The same carpet cleaned: stains gone and fresh, even cleaning stripes wall to wall", "62% 50%"),
 "office": ("office-before", "office-after", "An office at the end of the day: a bin spilling over, papers on the carpet, a scribbled whiteboard and dust",
            "The same office ready for the morning: clear desks, a wiped whiteboard and fresh vacuum lines in the carpet", "62% 50%"),
 "clean": ("clean-before", "clean-after", "A living room with laundry on the sofa, toys and papers on the floor, dust and a smudged window",
           "The same living room clean and bright, the floor shining, pillows on the sofa and fresh flowers on the table", "62% 50%"),
 "stump": ("stump-before", "stump-after", "An old tree stump with roots and suckers in a side yard beside a farmhouse",
           "The same spot ground out and grown back in with fresh new grass", "60% 55%"),
 "handy": ("handy-before", "handy-after", "A farmhouse porch with a gutter hanging loose off the roof edge and a cracked top step",
           "The same porch with the gutter back up and a downspout, and a new top step", "60% 40%"),
 "plumb": ("plumb-before", "plumb-after", "A soggy front lawn with water pooling up over a broken water line",
           "The same lawn with a neat strip of fresh sod where the new line went in", "60% 50%"),
 "hvac": ("hvac-before", "hvac-after", "A rusty, dented old air conditioning unit beside a farmhouse, weeds around its pad",
          "The same spot with a clean new air conditioning unit on the pad, lines run neatly to the wall", "62% 50%"),
}


def hero(g):
    return _HERO[g]


_SVC = {
 "wash": [("wash-house", "Farmhouse siding washed bright white"), ("wash-drive", "A driveway washed clean down to bright concrete"), ("wash-porch", "A clean porch deck and front steps")],
 "concrete": [("concrete-drive", "A new concrete driveway leading up to a garage"), ("concrete-walk", "A clean concrete front walk to the porch"), ("concrete-cracks", "A cracked, stained driveway before the work")],
 "clean": [("clean-sofa", "A tidy sofa with pillows and a folded throw in front of a clear window"), ("clean-table", "Fresh flowers and a folded card on a clean coffee table"), ("clean-floor", "A wood floor wiped to a shine")],
 "weld": [("weld-arc", "Sparks flying as a joint on a steel gate is welded"), ("weld-gate", "A black steel double gate across a farmhouse drive"), ("weld-rust", "A rusted gate leaf sagging with a snapped brace")],
 "engine": [("engine-bench", "A riding mower with its hood up and old parts laid out on a blue tarp"), ("engine-lawn", "A red riding mower out on the lawn in front of a white farmhouse"), ("engine-parts", "An old spark plug, a clogged air filter and a dull blade on a tarp")],
 "tow": [("tow-ramp", "A rollback tow truck with its bed tilted down to the road and a pickup being winched up"), ("tow-front", "The front of a white tow truck with the pickup loaded behind the cab"), ("tow-stuck", "A pickup stopped at the curb with its hood up")],
 "carpet": [("carpet-wand", "A carpet cleaning wand lifting a stain, with fresh stripes behind it"), ("carpet-stripes", "Fresh, even cleaning stripes across a living room carpet"), ("carpet-stains", "Coffee, red wine and muddy paw prints on a beige carpet")],
 "office": [("office-desk", "A clean desk by the window with a monitor, a small plant and a neat stack of papers"), ("office-board", "A wiped whiteboard and a water cooler in a tidy office"), ("office-floor", "Office carpet vacuumed in fresh, even lines")],
 "stump": [("stump-grind", "A stump grinder's cutter wheel chewing an old stump down into chips"), ("stump-yard", "A white farmhouse side yard with a clear, open lawn"), ("stump-old", "An old stump with roots, suckers and mushrooms before the work")],
 "handy": [("handy-gutter", "A porch gutter hanging loose with a ladder against the post"), ("handy-steps", "Porch steps with a fresh new top tread"), ("handy-street", "A white farmhouse with a straight mailbox at the curb")],
 "plumb": [("plumb-pipe", "A new blue water line coupled into the old one in an open trench"), ("plumb-house", "A white farmhouse with the crew's truck at the curb"), ("plumb-new", "A neat strip of fresh sod across the front lawn")],
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
 "clean": [("clean-s1", "Before", "Life happened", "Laundry on the sofa, toys on the rug, dust on the floor and a smudged window."),
           ("clean-s2", "Halfway", "Room by room", "Picked up, dusted and wiped down as the team works across the room."),
           ("clean-s3", "Floors", "Floors that shine", "Dust and footprints gone, and the wood floor back to a glow."),
           ("clean-s4", "Done", "Come home to clean", "Pillows set, the throw folded and fresh flowers on the table.")],
 "weld": [("weld-s1", "Before", "Sagging and snapped", "Rust, a broken brace, a picket in the drive and a leaf dragging on the ground."),
          ("weld-s2", "Welding", "Every joint, welded", "Jacked level, the picket set back and the brace welded in."),
          ("weld-s3", "Finish", "Fresh black paint", "Ground smooth and painted so the rust stays gone."),
          ("weld-s4", "Done", "Swings like new", "Hung true, and both leaves open and close easy.")],
 "engine": [("engine-s1", "Before", "Won't start", "Hood up, a flat front tire, and the old parts laid out on a tarp."),
            ("engine-s2", "Tire", "Back up on all four", "The flat front tire fixed and aired up."),
            ("engine-s3", "Parts", "New plug, clean filter, sharp blade", "The worn parts swapped out and the tarp cleared."),
            ("engine-s4", "Done", "Starts on the first pull", "Hood down, lights on, and out to the lawn.")],
 "tow": [("tow-s1", "Before", "Stuck at the curb", "Hood up, hazards on and nowhere to go."),
         ("tow-s2", "On scene", "Bed down to the road", "The truck pulls in ahead, slides the bed back and tilts it down."),
         ("tow-s3", "Loading", "Winched up slow and straight", "The cable pulls it up the bed one foot at a time."),
         ("tow-s4", "Done", "Strapped down and rolling", "Bed back in place, straps on all four wheels, and on the way.")],
 "carpet": [("carpet-s1", "Before", "Spills and paw prints", "Coffee by the table, a red wine spot, muddy paw prints and a grey path where everyone walks."),
            ("carpet-s2", "Halfway", "Stroke by stroke", "The wand works across the room, lifting stains and leaving fresh stripes behind."),
            ("carpet-s3", "Stains", "Spots gone", "Coffee, wine and paw prints lifted out, and the traffic path back to the same color."),
            ("carpet-s4", "Done", "Fresh all over", "Clean, even stripes wall to wall, and carpet that feels new underfoot.")],
 "office": [("office-s1", "Before", "End of the day", "A bin spilling over, papers on the carpet, cups on the desks and a scribbled whiteboard."),
            ("office-s2", "Halfway", "Desk by desk", "Bins emptied, papers picked up and desks wiped as the team works across the room."),
            ("office-s3", "Floors", "Fresh lines in the carpet", "Vacuumed wall to wall, with the dust and crumbs gone."),
            ("office-s4", "Done", "Ready for the morning", "Clear desks, a clean whiteboard and an office people are glad to walk into.")],
 "stump": [("stump-s1", "Before", "In the way for years", "Roots that catch the mower, suckers sprouting and mushrooms at the base."),
           ("stump-s2", "Grinding", "Chewed down into chips", "The cutter wheel works back and forth until the stump is gone."),
           ("stump-s3", "Cleanup", "Chips raked out", "The hole filled and leveled with fresh soil."),
           ("stump-s4", "Done", "Grass where the stump was", "Mow right over the spot like it was never there.")],
 "handy": [("handy-s1", "Before", "The list keeps growing", "A gutter hanging off the porch, a cracked step and a mailbox leaning at the curb."),
           ("handy-s2", "First", "Gutter back up", "Hung straight and tight, with a downspout to carry the water away."),
           ("handy-s3", "Next", "A new top step", "The cracked board out and a solid new tread in."),
           ("handy-s4", "Done", "Crossed off the list", "Even the mailbox stands up straight again.")],
 "plumb": [("plumb-s1", "Before", "Water where it shouldn't be", "A soggy lawn and a puddle that never dries out."),
           ("plumb-s2", "Found", "Dug right to the leak", "The line marked, then a clean trench straight down to the break."),
           ("plumb-s3", "Fixed", "A new section, coupled in tight", "The split pipe cut out and new line put in its place."),
           ("plumb-s4", "Done", "Back to a dry lawn", "Backfilled, fresh sod down and the mess gone.")],
 "hvac": [("hvac-s1", "Before", "Worn out and working hard", "Rust, bent fins and weeds growing up around the pad."),
          ("hvac-s2", "Out", "The old unit comes out", "Disconnected safely and hauled away."),
          ("hvac-s3", "In", "The new unit goes in", "Set level on the pad, lines run neat and tight to the wall."),
          ("hvac-s4", "Done", "Comfortable again", "A quiet new unit and a clean spot beside the house.")],
}


def stages(g):
    return _STAGES[g]


VISIT = {"wash": "From grimy to bright", "concrete": "From cracked to brand new", "hvac": "From worn out to brand new", "plumb": "From soggy lawn to fixed", "handy": "From to-do list to done", "clean": "From lived-in to spotless", "stump": "From stump to grass", "office": "From end of day to ready for the morning", "tow": "From stuck to on the way", "engine": "From won't start to mowing", "weld": "From broken to built strong", "carpet": "From stained to fresh"}
VISIT_INTRO = "Shown on the same house, from before to done."
VISIT_INTRO_G = {"clean": "Shown in the same room, from before to done.", "office": "Shown in the same office, from before to done.", "carpet": "Shown in the same room, from before to done."}

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
 "clean": ("Clean planner", "What kind of clean?", "Pick the kind of clean and the size of your home, and know what to mention for a straight quote.",
           "How big is the home?", [("s", "1 to 2 bedrooms", "Mention how many bathrooms and any pets."),
                                    ("m", "3 bedrooms", "Mention bathrooms, pets and any rooms to skip."),
                                    ("l", "4 or more bedrooms", "Mention bathrooms, pets and how often you'd like visits."),
                                    ("x", "Not a house", "Apartment, office or rental? Say which, with the rough size.")],
           "The number of bedrooms and bathrooms gets you a straight quote fastest.", "A quick guide, not a quote. The team will tell you what it really takes."),
 "weld": ("Job check", "What are we welding?", "Pick the kind of job and what it's made of, and know what to mention when you ask.",
          "What's it made of?", [("steel", "Steel or iron", "The most common. Mention how thick if you know."),
                                  ("alum", "Aluminum", "Aluminum takes different gear. Say what it is, like a trailer or a boat part."),
                                  ("stain", "Stainless", "Say what it's for, like food equipment or a railing."),
                                  ("idk", "Not sure", "No problem. A photo up close tells the shop a lot.")],
          "A photo and a rough size help get a straight answer fastest.", "A quick guide, not a quote. The shop will tell you what it really takes."),
 "engine": ("Repair check", "What isn't running?", "Pick what it is and what it's doing, and know what to mention when you ask.",
            "What's it doing?", [("start", "Won't start", "Mention how long it sat and whether it has fresh gas."),
                                  ("rough", "Runs rough or dies", "Say when it happens: at start, under load or after a while."),
                                  ("smoke", "Smokes or leaks", "Say what color the smoke is or where the leak is."),
                                  ("tune", "Just needs a tune-up", "Mention the make and model if you know it.")],
            "The make and model, if you know it, gets you a straight answer fastest.", "A quick guide, not a quote. The shop will tell you what it really needs."),
 "tow": ("Tow check", "What happened?", "Pick what happened and what you're driving, and know what to say when you call.",
         "What are you driving?", [("car", "A car or small SUV", "Most tows. Say where it is and where it needs to go."),
                                   ("truck", "A pickup or a big SUV", "Say what it is so the right truck comes. Mention four-wheel drive or a lift."),
                                   ("van", "A van or something with a trailer", "Say the length and whether the trailer comes too."),
                                   ("other", "Something else", "A mower, a motorcycle or a project car? Say what it is.")],
         "Where you are and where it's going gets you a straight answer fastest.", "A quick guide, not a quote. The crew will tell you what it really takes."),
 "carpet": ("Carpet planner", "What needs cleaning?", "Pick what needs cleaning and how much of it, and know what to mention for a straight quote.",
            "How much carpet?", [("one", "One room or a hallway", "Mention the room and any stains you want gone."),
                                 ("few", "A few rooms", "Mention which rooms, stairs, and any pets."),
                                 ("whole", "The whole house", "Mention bedrooms, stairs and hallways, and any spots that need extra work."),
                                 ("up", "Furniture or upholstery", "Sofa, chairs or a mattress? Say what it is and roughly how big.")],
            "Which rooms and any stains gets you a straight quote fastest.", "A quick guide, not a quote. The team will tell you what it really takes."),
 "office": ("Space planner", "What kind of space?", "Pick the kind of space and how big it is, and know what to mention for a straight quote.",
            "How big is the space?", [("s", "A small office", "A few desks and a restroom. Mention how often you'd like visits."),
                                      ("m", "A full floor or suite", "Mention the rough square footage, restrooms and any kitchen or break room."),
                                      ("l", "A whole building", "Mention floors, restrooms and the hours the building is empty."),
                                      ("x", "Not an office", "Store, clinic, church or something else? Say which, with the rough size.")],
            "The rough size and how often you'd like cleaning gets you a straight quote fastest.", "A quick guide, not a quote. The team will tell you what it really takes."),
 "stump": ("Stump check", "What needs grinding?", "Pick how many stumps and how big, and know what to mention for a straight quote.",
           "How big across?", [("small", "Smaller than a dinner plate", "Usually quick. Mention how many there are."),
                                ("mid", "About a foot to two feet", "The most common size. A photo with something for scale helps."),
                                ("big", "Bigger than two feet", "Big stumps take longer. Mention how close it is to the house, a fence or a driveway."),
                                ("idk", "Not sure", "No problem. A photo from a few steps back tells the crew a lot.")],
           "A photo of each stump helps get a straight quote.", "A quick guide, not a quote. The crew will tell you what it really takes."),
 "handy": ("Job sizer", "What's on the list?", "Pick the kind of job and how big the list is, and know what to send so you get a straight quote.",
           "How big is the list?", [("one", "Just one thing", "A quick visit. A photo of it helps get a straight quote."),
                                    ("few", "A few small things", "Put them in one visit. A short list with photos saves time."),
                                    ("big", "A bigger project", "Rough measurements and a few photos help plan it out."),
                                    ("unsure", "Not sure what it needs", "Describe what you're seeing. You'll get a straight answer on what it takes.")],
           "A photo of each thing helps get a straight quote.", "A quick guide, not a quote. You'll hear what it really needs."),
 "plumb": ("Leak check", "What's going on?", "Pick the problem and how urgent it is, and get a plain answer on what to do first.",
           "How urgent is it?", [("now", "Water is running now", "Shut the main water valve off if you can, then call right away."),
                                 ("drip", "A slow drip or leak", "Worth fixing soon, before it damages anything. A photo helps."),
                                 ("slow", "It drains slowly", "Often a clog building up. Mention which drains and how long it's been."),
                                 ("plan", "Planning ahead", "A good time to ask. Mention the size or model if it's a replacement.")],
           "A photo of the problem helps get a straight answer.", "A quick guide, not a quote. The crew will tell you what it really needs."),
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
 "clean": "How many bedrooms and bathrooms, any pets, the kind of clean and how often you'd like it.",
 "weld": "What it is, what's broken or what you want built, a rough size, and a photo up close.",
 "engine": "What it is, the make and model if you know it, what it's doing, and a photo of the label.",
 "tow": "Where the vehicle is, what it is, what happened, and where it needs to go.",
 "carpet": "Which rooms, roughly how big, any stairs or pets, and a photo of the worst stains.",
 "office": "What kind of space, the rough square footage, how many restrooms, and how often you'd like it cleaned.",
 "stump": "How many stumps, roughly how wide each one is, and a photo from a few steps back.",
 "handy": "A list of what needs doing, a photo of each thing, and rough sizes where it matters.",
 "plumb": "What's going on, where in the house, and a photo of the problem if you can.",
 "hvac": "What the system is doing, roughly how old it is, and a photo of the label on the outdoor unit if you can.",
}

TOOLS = {g: ("Text-the-team button" if g in ("clean", "office", "carpet") else "Text-the-shop button" if g in ("engine", "weld") else "Text-the-crew button", f"Before-and-after slider and a {TOOL[g][0].lower()}",
             ("a live 3D room where you " if g in ("clean", "carpet") else "a live 3D office where you " if g == "office" else "a live 3D street where you " if g == "tow" else "a live 3D driveway where you " if g in ("engine", "weld") else "a live 3D house where you ") + {"wash": "wash the drive yourself", "concrete": "pour the new drive yourself", "hvac": "swap in the new unit yourself", "plumb": "dig down and fix the line yourself", "handy": "work through the list yourself", "clean": "tidy it up yourself", "stump": "grind the stump out yourself", "office": "clean it up yourself", "tow": "load the pickup yourself", "engine": "fix the mower yourself", "weld": "weld the gate yourself", "carpet": "clean the carpet yourself"}[g]) for g in GROUPS}
TRY = {"wash": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                "Drag the slider on the top picture from grimy to clean, then try the wash planner.",
                "Scroll to watch the siding and the drive come clean, then drag the wand down the drive yourself."),
       "concrete": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                    "Drag the slider on the top picture from cracked to new, then try the slab check.",
                    "Scroll to watch the old drive go and the new slab go in, then pour it yourself."),
       "clean": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                 "Drag the slider on the top picture from lived-in to spotless, then try the clean planner.",
                 "Scroll to watch the room come clean, then sweep it clean yourself."),
       "weld": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                "Drag the slider on the top picture from broken to fixed, then try the job check.",
                "Scroll to watch the gate get welded and painted, then weld it yourself."),
       "engine": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                  "Drag the slider on the top picture from won't start to mowing, then try the repair check.",
                  "Scroll to watch the mower get fixed and drive off, then fix it yourself."),
       "tow": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
               "Drag the slider on the top picture from stuck to loaded, then try the tow check.",
               "Scroll to watch the truck pull in and load the pickup, then load it yourself."),
       "carpet": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                  "Drag the slider on the top picture from stained to fresh, then try the carpet planner.",
                  "Scroll to watch the wand clean the carpet, then clean it yourself."),
       "office": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                  "Drag the slider on the top picture from end of day to ready, then try the space planner.",
                  "Scroll to watch the office come clean, then clean it up yourself."),
       "stump": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                 "Drag the slider on the top picture from stump to grass, then try the stump check.",
                 "Scroll to watch the grinder chew the stump down, then grind it out yourself."),
       "handy": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                 "Drag the slider on the top picture from before to done, then try the job sizer.",
                 "Scroll to watch the list get crossed off, then work through it yourself."),
       "plumb": ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
                 "Drag the slider on the top picture from soggy to fixed, then try the leak check.",
                 "Scroll to watch the line get dug up and fixed, then do it yourself."),
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
    if g == "clean":
        return [("hero", .3, {"fix": 0}, None, "clean-before", None),
                ("close", .3, {"fix": 0}, {"fix": .5}, "clean-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the room come clean from one side to the other.")),
                ("floor", .3, {"fix": .5}, {"fix": .95}, "clean-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .3, {"fix": .95}, {"fix": 1}, "clean-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "clean-dusk", ("04 · Evening", "Lamp on, feet up", "The kind of room you want to come home to.")),
                ("cfg", .3, {}, None, "clean-after", "cfg")]
    if g == "weld":
        return [("hero", .4, {"fix": 0}, None, "weld-before", None),
                ("close", .4, {"fix": 0}, {"fix": .6}, "weld-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the leaf come level and the sparks fly.")),
                ("hero", .4, {"fix": .6}, {"fix": .86}, "weld-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .4, {"fix": .86}, {"fix": 1}, "weld-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": .5}, None, "weld-dusk", ("04 · Arc light", "Lit up by the arc", "Sparks and a blue glow as the last joint goes in.")),
                ("cfg", .4, {}, None, "weld-after", "cfg")]
    if g == "engine":
        return [("hero", .4, {"fix": 0}, None, "engine-before", None),
                ("close", .4, {"fix": 0}, {"fix": .45}, "engine-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the flat tire come back up and the old parts go.")),
                ("close", .4, {"fix": .45}, {"fix": .7}, "engine-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .4, {"fix": .7}, {"fix": 1}, "engine-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "engine-dusk", ("04 · Evening", "Ready when you are", "Parked on the lawn with the lights on, ready for the next mow.")),
                ("cfg", .4, {}, None, "engine-after", "cfg")]
    if g == "tow":
        return [("hero", .3, {"fix": 0}, None, "tow-before", None),
                ("close", .3, {"fix": 0}, {"fix": .5}, "tow-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the truck pull in and tilt its bed down to the road.")),
                ("close", .3, {"fix": .5}, {"fix": .88}, "tow-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .3, {"fix": .88}, {"fix": 1}, "tow-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "tow-dusk", ("04 · After dark", "Loaded up under the beacon", "Strapped down at the curb and ready to roll, day or night.")),
                ("cfg", .3, {}, None, "tow-after", "cfg")]
    if g == "carpet":
        return [("hero", .3, {"fix": 0}, None, "carpet-before", None),
                ("close", .3, {"fix": 0}, {"fix": .5}, "carpet-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the wand clean the carpet from one side to the other.")),
                ("floor", .3, {"fix": .5}, {"fix": .95}, "carpet-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .3, {"fix": .95}, {"fix": 1}, "carpet-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "carpet-dusk", ("04 · Evening", "Lamp on, shoes off", "Soft, clean carpet for the whole family.")),
                ("cfg", .3, {}, None, "carpet-after", "cfg")]
    if g == "office":
        return [("hero", .3, {"fix": 0}, None, "office-before", None),
                ("close", .3, {"fix": 0}, {"fix": .5}, "office-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the office come clean from one side to the other.")),
                ("floor", .3, {"fix": .5}, {"fix": .95}, "office-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .3, {"fix": .95}, {"fix": 1}, "office-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "office-dusk", ("04 · After hours", "Done after everyone leaves", "Cleaned after hours, so the morning starts fresh.")),
                ("cfg", .3, {}, None, "office-after", "cfg")]
    if g == "stump":
        return [("hero", .45, {"fix": 0}, None, "stump-before", None),
                ("close", .45, {"fix": 0}, {"fix": .6}, "stump-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the grinder chew the stump down into chips.")),
                ("close", .45, {"fix": .6}, {"fix": .86}, "stump-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .45, {"fix": .86}, {"fix": 1}, "stump-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "stump-dusk", ("04 · Evening", "Room to breathe", "An open side yard and nothing left to trip over.")),
                ("cfg", .45, {}, None, "stump-after", "cfg")]
    if g == "handy":
        return [("hero", .3, {"fix": 0}, None, "handy-before", None),
                ("close", .3, {"fix": 0}, {"fix": .5}, "handy-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the gutter go back up where it belongs.")),
                ("close", .3, {"fix": .5}, {"fix": .7}, "handy-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("street", .3, {"fix": .7}, {"fix": 1}, "handy-s4", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "handy-dusk", ("04 · Evening", "Nothing left on the list", "Porch light on, and nothing waiting for this weekend.")),
                ("cfg", .3, {}, None, "handy-after", "cfg")]
    if g == "plumb":
        return [("hero", .3, {"fix": 0}, None, "plumb-before", None),
                ("close", .3, {"fix": 0}, {"fix": .45}, "plumb-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the line get dug up, right down to the break.")),
                ("close", .3, {"fix": .45}, {"fix": .7}, "plumb-s3", ("02 · " + s3[1], s3[2], s3[3])),
                ("hero", .3, {"fix": .7}, {"fix": 1}, "plumb-after", ("03 · Done", s4[2], s4[3])),
                ("dusk", .84, {"fix": 1}, None, "plumb-dusk", ("04 · Evening", "Dry, quiet and done", "The crew's truck at the curb and nothing left to show but fresh grass.")),
                ("cfg", .3, {}, None, "plumb-after", "cfg")]
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
    if g == "clean":
        return ('<div class="ctl"><label for="u-fix">Clean the room <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: clean it yourself", {"fix": 1, "tod": .3}
    if g == "weld":
        return ('<div class="ctl"><label for="u-fix">Weld the gate <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: weld it yourself", {"fix": 1, "tod": .4}
    if g == "engine":
        return ('<div class="ctl"><label for="u-fix">Fix the mower <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: fix it yourself", {"fix": 1, "tod": .4}
    if g == "tow":
        return ('<div class="ctl"><label for="u-fix">Load the pickup <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: load it up", {"fix": 1, "tod": .3}
    if g == "carpet":
        return ('<div class="ctl"><label for="u-fix">Clean the carpet <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: clean it yourself", {"fix": 1, "tod": .3}
    if g == "office":
        return ('<div class="ctl"><label for="u-fix">Clean the office <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: clean it yourself", {"fix": 1, "tod": .3}
    if g == "stump":
        return ('<div class="ctl"><label for="u-fix">Grind the stump <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: grind it out", {"fix": 1, "tod": .45}
    if g == "handy":
        return ('<div class="ctl"><label for="u-fix">Work through the list <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: cross it off", {"fix": 1, "tod": .3}
    if g == "plumb":
        return ('<div class="ctl"><label for="u-fix">Fix the water line <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: fix it yourself", {"fix": 1, "tod": .3}
    if g == "hvac":
        return ('<div class="ctl"><label for="u-fix">Swap in the new unit <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: swap it yourself", {"fix": 1, "tod": .3}
    return ('<div class="ctl"><label for="u-fix">Pour the new drive <span>drag</span></label><input id="u-fix" type="range" min="0" max="100" value="100" data-set="fix"></div>'), "Your turn: pour it yourself", {"fix": 1, "tod": .3}


# renders on the Harlow lab: the crew's pickup at the curb carries a generic trade name on the pictures
CAM = {"hero": ("-4,2.8,44", "7.5,1.8,12", 36), "close": ("4.2,1.5,27", "9.6,.3,14", 42), "house": ("-7,2.0,19", "2.5,3.0,3", 40),
       "porch": ("-3.2,1.7,13.5", "0,1.5,5", 44), "walk": ("-4.5,1.6,18", "1.6,.2,9.5", 44), "dusk": ("-4,2.4,42", "7.5,2.0,12", 36),
       "slab": ("1.2,2.9,31.5", "8.6,.9,12", 40),
       "unit": ("-11.4,1.5,6.2", "-7.2,1.0,-.3", 40), "unitc": ("-10.2,1.3,3.4", "-7.3,.75,-.3", 40), "street": ("-17,3.2,50", "-4,1.6,6", 34),
       "side": ("-15,2.4,13", "-5,2.0,-.5", 40),
       "yard": ("-7.4,1.9,24.6", "-3.0,.2,17.6", 40), "yardc": ("-6.6,1.6,22.6", "-3.2,.05,18.2", 40), "curb": ("-12,2.8,46", "-3,1.2,14", 36),
       "porch": ("-3.6,1.6,12.6", "-1.0,1.7,6.4", 44), "porchw": ("-5.2,2.0,15", "-1.4,2.0,6.4", 42), "street": ("-7,1.7,46", "-1,1.6,22", 40),
       "steps": ("-1.6,1.2,10", "0,.4,6.8", 40),
       "stumph": ("-15.2,1.9,9.6", "-10.6,.6,2.9", 40), "stumpc": ("-14.4,1.5,7.8", "-10.9,.4,2.9", 40), "stumpw": ("-19,2.6,14", "-8,1.6,2", 40),
       "room": ("2.4,1.6,1.4", "-.8,.85,-2.8", 46), "roomc": ("1.3,1.25,-.6", "-.7,.5,-2.6", 44), "floorc": ("2.2,.9,.4", "-.6,.05,-2.0", 46), "win": ("1.0,1.5,-1.2", "-.7,1.1,-4.4", 44),
       "board": ("1.2,1.5,-.4", "-2.6,1.2,-2.4", 46),
       "towh": ("3,2.4,48", "-3.5,1.2,35.4", 44), "towc": ("-12,2.2,45", "-5.5,1.0,35.4", 44), "towcar": ("-15,1.8,41.5", "-9,.9,35.4", 44),
       "towf": ("9,2.2,42", "0,1.4,35.4", 44),
       "engh": ("14.5,2.4,30", "7.6,.5,22", 40), "engc": ("13.5,1.8,26.5", "9.5,.5,22", 42), "engp": ("12.2,1.5,23.4", "10.8,.1,22.1", 42),
       "weldh": ("14,1.9,37", "9.5,.7,30", 44), "weldc": ("12.8,1.3,33.2", "11,.7,30.2", 44)}
_DIRTY = "siding=a9a68f&trim=6f6d60"


def renders(g):
    d = GROUPS[g]; tr = d["truck"].replace(" ", "+").replace("&", "%26")
    base = (f"p=1&drive={d['drive']}&truck={tr}&tx=-1.5" if d["drive"] else f"p=1&truck={tr}&tx={ {'plumb': -6, 'handy': 1.5}.get(g, -11) }") + "&tz=35.4&tr=1.5708"
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
    if g == "weld":
        def rw(name, w, h, cam, tod, fx, ox=0):
            c, t, f = CAM[cam]
            return {"name": f"weld-{name}", "w": w, "h": h, "q": f"p=1&weld={fx}&tod={tod}&cam={c}&tgt={t}&fov={f}" + (f"&ox={ox}" if ox else "")}
        return [rw("before", 2400, 1350, "weldh", .4, 0, .13), rw("after", 2400, 1350, "weldh", .4, 1, .13),
                rw("s1", 1200, 800, "weldc", .4, 0), rw("s2", 1200, 800, "weldc", .4, .5),
                rw("s3", 1200, 800, "weldh", .4, .82), rw("s4", 1200, 800, "weldh", .4, 1),
                rw("dusk", 1600, 1000, "weldh", .84, .5), rw("arc", 1600, 1000, "weldc", .4, .5),
                rw("gate", 1600, 1000, "weldh", .4, .86), rw("rust", 1600, 1000, "weldc", .4, 0)]
    if g == "engine":
        def re_(name, w, h, cam, tod, fx, ox=0):
            c, t, f = CAM[cam]
            return {"name": f"engine-{name}", "w": w, "h": h, "q": f"p=1&eng={fx}&tod={tod}&cam={c}&tgt={t}&fov={f}" + (f"&ox={ox}" if ox else "")}
        return [re_("before", 2400, 1350, "engh", .4, 0, .13), re_("after", 2400, 1350, "engh", .4, 1, .13),
                re_("s1", 1200, 800, "engc", .4, 0), re_("s2", 1200, 800, "engc", .4, .35),
                re_("s3", 1200, 800, "engc", .4, .65), re_("s4", 1200, 800, "engh", .4, 1),
                re_("dusk", 1600, 1000, "engh", .84, 1), re_("bench", 1600, 1000, "engc", .4, 0),
                re_("lawn", 1600, 1000, "engh", .4, 1), re_("parts", 1600, 1000, "engp", .4, 0)]
    if g == "tow":
        def rt(name, w, h, cam, tod, fx, ox=0):
            c, t, f = CAM[cam]
            return {"name": f"tow-{name}", "w": w, "h": h, "q": f"p=1&truck=Towing&tow={fx}&tod={tod}&cam={c}&tgt={t}&fov={f}" + (f"&ox={ox}" if ox else "")}
        return [rt("before", 2400, 1350, "towh", .3, 0, .13), rt("after", 2400, 1350, "towh", .3, 1, .13),
                rt("s1", 1200, 800, "towcar", .3, 0), rt("s2", 1200, 800, "towc", .3, .36),
                rt("s3", 1200, 800, "towc", .3, .55), rt("s4", 1200, 800, "towf", .3, 1),
                rt("dusk", 1600, 1000, "towh", .84, 1), rt("ramp", 1600, 1000, "towc", .3, .5),
                rt("front", 1600, 1000, "towf", .3, 1), rt("stuck", 1600, 1000, "towcar", .3, 0)]
    if g == "office":
        def ro(name, w, h, cam, tod, fx, ox=0):
            c, t, f = CAM[cam]
            return {"name": f"office-{name}", "w": w, "h": h, "lab": "labroom", "q": f"kind=office&tod={tod}&cam={c}&tgt={t}&fov={f}&fix={fx}" + (f"&ox={ox}" if ox else "")}
        return [ro("before", 2400, 1350, "room", .3, 0, .13), ro("after", 2400, 1350, "room", .3, 1, .13),
                ro("s1", 1200, 800, "roomc", .3, 0), ro("s2", 1200, 800, "room", .3, .5),
                ro("s3", 1200, 800, "floorc", .3, 1), ro("s4", 1200, 800, "roomc", .3, 1),
                ro("dusk", 1600, 1000, "room", .84, 1), ro("desk", 1600, 1000, "win", .3, 1),
                ro("board", 1600, 1000, "board", .3, 1), ro("floor", 1600, 1000, "floorc", .3, 1)]
    if g == "carpet":
        def rc(name, w, h, cam, tod, fx, ox=0):
            c, t, f = CAM[cam]
            return {"name": f"carpet-{name}", "w": w, "h": h, "lab": "labroom", "q": f"kind=carpet&tod={tod}&cam={c}&tgt={t}&fov={f}&fix={fx}" + (f"&ox={ox}" if ox else "")}
        return [rc("before", 2400, 1350, "room", .3, 0, .13), rc("after", 2400, 1350, "room", .3, 1, .13),
                rc("s1", 1200, 800, "floorc", .3, 0), rc("s2", 1200, 800, "room", .3, .5),
                rc("s3", 1200, 800, "floorc", .3, 1), rc("s4", 1200, 800, "roomc", .3, 1),
                rc("dusk", 1600, 1000, "room", .84, 1), rc("wand", 1600, 1000, "floorc", .3, .55),
                rc("stripes", 1600, 1000, "roomc", .3, 1), rc("stains", 1600, 1000, "floorc", .3, 0)]
    if g == "clean":
        def rr(name, w, h, cam, tod, fx, ox=0):
            c, t, f = CAM[cam]
            return {"name": f"clean-{name}", "w": w, "h": h, "lab": "labroom", "q": f"tod={tod}&cam={c}&tgt={t}&fov={f}&fix={fx}" + (f"&ox={ox}" if ox else "")}
        return [rr("before", 2400, 1350, "room", .3, 0, .13), rr("after", 2400, 1350, "room", .3, 1, .13),
                rr("s1", 1200, 800, "roomc", .3, 0), rr("s2", 1200, 800, "room", .3, .5),
                rr("s3", 1200, 800, "floorc", .3, 1), rr("s4", 1200, 800, "roomc", .3, 1),
                rr("dusk", 1600, 1000, "room", .84, 1), rr("sofa", 1600, 1000, "win", .3, 1),
                rr("table", 1600, 1000, "roomc", .3, 1), rr("floor", 1600, 1000, "floorc", .3, 1)]
    if g == "stump":
        return [r("before", 2400, 1350, "stumph", .45, "stump=0", .13), r("after", 2400, 1350, "stumph", .45, "stump=1", .13),
                r("s1", 1200, 800, "stumpc", .45, "stump=0"), r("s2", 1200, 800, "stumpc", .45, "stump=.42"),
                r("s3", 1200, 800, "stumpc", .45, "stump=.84"), r("s4", 1200, 800, "stumpc", .45, "stump=1"),
                r("dusk", 1600, 1000, "stumpw", .84, "stump=1"), r("grind", 1600, 1000, "stumpc", .45, "stump=.3"),
                r("yard", 1600, 1000, "stumpw", .45, "stump=1"), r("old", 1600, 1000, "stumpc", .45, "stump=0")]
    if g == "handy":
        return [r("before", 2400, 1350, "porchw", .3, "hm=0", .13), r("after", 2400, 1350, "porchw", .3, "hm=1", .13),
                r("s1", 1200, 800, "porch", .3, "hm=0"), r("s2", 1200, 800, "porch", .3, "hm=.5"),
                r("s3", 1200, 800, "steps", .3, "hm=.72"), r("s4", 1200, 800, "street", .3, "hm=1"),
                r("dusk", 1600, 1000, "street", .84, "hm=1"), r("gutter", 1600, 1000, "porch", .3, "hm=.3"),
                r("steps", 1600, 1000, "steps", .3, "hm=1"), r("street", 1600, 1000, "street", .3, "hm=0")]
    if g == "plumb":
        return [r("before", 2400, 1350, "yard", .3, "pipe=0", .3), r("after", 2400, 1350, "yard", .3, "pipe=1", .3),
                r("s1", 1200, 800, "yardc", .3, "pipe=0"), r("s2", 1200, 800, "yardc", .3, "pipe=.45"),
                r("s3", 1200, 800, "yardc", .3, "pipe=.62"), r("s4", 1200, 800, "yardc", .3, "pipe=1"),
                r("dusk", 1600, 1000, "curb", .84, "pipe=1"), r("house", 1600, 1000, "curb", .3, "pipe=.45"),
                r("pipe", 1600, 1000, "yardc", .3, "pipe=.62"), r("new", 1600, 1000, "yardc", .3, "pipe=1")]
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
