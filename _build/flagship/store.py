"""Storefront groups for the flagship kit: bakeries, salons, barbers, nail salons, restaurants, shops, groomers,
tailors and upholsterers, all told on one main-street storefront (f/assets/storefront.js).

Pure data: kit.py, tiers2.py, t1250.py, meetdata.py and room.py merge these tables into their own.
Facts on the pages still come only from each shop's Google listing; nothing here claims hours, prices or years."""

# kit group -> verticals it covers, 3D interior, sign and window word on the rendered pictures, noun for alt text
GROUPS = {
 "bakery": dict(vs=["bakery", "cake", "donut"], kind="bakery", sign="Bakery", word="Bakery", noun="bakery"),
 "salon": dict(vs=["salon"], kind="salon", sign="Salon", word="Hair", noun="hair salon"),
 "barber": dict(vs=["barber"], kind="barber", sign="Barber Shop", word="Barber", noun="barber shop"),
 "nails": dict(vs=["nails"], kind="nails", sign="Nail Salon", word="Nails", noun="nail salon"),
 "eat": dict(vs=["restaurant"], kind="eat", sign="Restaurant", word="Eat", noun="restaurant"),
 "shop": dict(vs=["thrift", "boutique"], kind="shop", sign="Shop", word="Shop", noun="shop"),
 "groom": dict(vs=["petgroom"], kind="groom", sign="Pet Grooming", word="Grooming", noun="pet groomer"),
 "tailor": dict(vs=["tailor"], kind="sew", sign="Alterations", word="Tailor", noun="tailor shop"),
 "uphol": dict(vs=["upholstery"], kind="sew", sign="Upholstery", word="Upholstery", noun="upholstery shop"),
 "scoop": dict(vs=["icecream"], kind="scoop", sign="Ice Cream", word="Ice Cream", noun="ice cream shop"),
 "antique": dict(vs=["antique"], kind="antique", sign="Antiques", word="Antiques", noun="antique shop"),
}
KGROUP = {v: g for g, d in GROUPS.items() for v in d["vs"]}
KIT_V = dict(KGROUP)
# names where the storefront story would be wrong
NAME_OUT = {
 "bakery": r"wholesale|distribut|commissary|food truck|mobile|catering only|home ?based|funnel",
 "salon": r"academy|school|college|mobile|suite|tanning|spa\b|lash|brow|wax|barber|nail",
 "barber": r"academy|school|college|mobile|supply|salon|styling",
 "nails": r"academy|school|supply|mobile|spa\b",
 "eat": r"food truck|truck|catering|mobile|bar\b|tavern|pub\b|brewery|winery|lounge|club|drive.?in|kitchen\b",
 "shop": r"online|warehouse|outlet|auction|pawn|mobile|antique|collectib|flea|market|mall",
 "groom": r"mobile|van|boarding|kennel|vet|hospital|clinic|training|daycare|ranch",
 "tailor": r"mobile|uniform|embroid|screen|print|dry ?clean|cleaner|laundr",
 "uphol": r"mobile|marine|boat|auto|truck|car\b|cars\b|awning|canvas",
 "antique": r"online|auction|pawn|mobile|appraisal|estate sale|restoration",
 "scoop": r"food truck|truck|mobile|cart\b|trailer|wholesale|distribut|dairy farm|creamery|dairy dream|freeze|frost|drive.?in|dip\b|\bstand\b|soft serve",
}
WORD = {"bakery": "Bakery", "cake": "Cakes", "donut": "Donuts", "salon": "Hair", "barber": "Barber", "nails": "Nails", "restaurant": "Eat",
        "thrift": "Thrift", "boutique": "Boutique", "petgroom": "Grooming", "tailor": "Tailor", "upholstery": "Upholstery", "icecream": "Ice Cream", "antique": "Antiques"}

TRADE = {"bakery": "Bakery", "cake": "Cake shop", "donut": "Donut shop", "salon": "Hair salon", "barber": "Barber shop", "nails": "Nail salon",
         "restaurant": "Restaurant", "thrift": "Thrift store", "boutique": "Boutique", "petgroom": "Pet grooming", "tailor": "Tailoring and alterations",
         "upholstery": "Upholstery", "icecream": "Ice cream shop", "antique": "Antique store"}
SCHEMA = {"bakery": "Bakery", "cake": "Bakery", "donut": "Bakery", "salon": "HairSalon", "barber": "HairSalon", "nails": "NailSalon",
          "restaurant": "Restaurant", "thrift": "Store", "boutique": "ClothingStore", "petgroom": "LocalBusiness", "tailor": "LocalBusiness",
          "upholstery": "LocalBusiness", "icecream": "IceCreamShop", "antique": "Store"}

# antique stores are thrift leads on Google; pick.py moves the ones whose Google category is "Antique store" onto their own variant
V_NEW = {"antique": dict(group="retail", noun="shop", h300=["Old things,", "new homes."], h750=["Come browse.", "Find a story."],
                         h1250=["Every piece.", "Its own story."],
                         lede="An antique shop in {town}. Stop in and browse, or call to ask about a piece.",
                         services=[("Browse the floor", "Furniture, glass, clocks and more, with new pieces coming in."), ("Looking for a piece", "Call or text and ask if they have it."), ("Selling something", "Call to ask what they take and when.")],
                         jobs=["Looking for a piece", "Selling something", "A question", "Something else"],
                         when=["Today", "This week", "This month", "Just asking"], who="shoppers", ask="What can we help with?")}
TRADE_LABEL = {"antique": "Antiques"}

# copy that would promise something we can't check (online booking, walk-ins) gets a plainer line
OVERRIDE = {
 "salon": {"lede": "A hair salon in {town}. Tell us what you're after and ask for a time that works for you."},
 "barber": {"lede": "A barber shop in {town}. Call or text ahead, and leave looking sharp."},
 "nails": {"lede": "A nail salon in {town}. Pick your service and ask for a time that works for you."},
 "petgroom": {"lede": "Pet grooming in {town}. Tell us about your dog and ask for a time that works for you."},
 "icecream": {"h300": ["Grab a cone.", "Pick a flavor."]},
}

_F = {
 "fraunces": "family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..500",
 "dmsans": "family=DM+Sans:opsz,wght@9..40,400..700",
 "iserif": "family=Instrument+Serif:ital@0;1", "isans": "family=Instrument+Sans:wght@400..700",
 "archivo": "family=Archivo:wdth,wght@62..125,400..900", "plex": "family=IBM+Plex+Sans:wght@400;500;600;700",
 "dmserif": "family=DM+Serif+Display:ital@0;1", "brico": "family=Bricolage+Grotesque:opsz,wght@12..96,400..800",
 "bodoni": "family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900", "jost": "family=Jost:wght@400..700",
 "corm": "family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600",
}
_FACE = {"fraunces": '"Fraunces",Georgia,serif', "dmsans": '"DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
         "iserif": '"Instrument Serif",Georgia,serif', "isans": '"Instrument Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
         "archivo": '"Archivo",system-ui,sans-serif', "plex": '"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
         "dmserif": '"DM Serif Display",Georgia,serif', "brico": '"Bricolage Grotesque",system-ui,sans-serif',
         "bodoni": '"Bodoni Moda",Georgia,serif', "jost": '"Jost",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
         "corm": '"Cormorant Garamond",Georgia,serif'}


def _t(navy, navy2, paper, paper2, ink, muted, line, pencil, pencil2, blue, barbg, disp, body):
    return dict(navy=navy, navy2=navy2, paper=paper, paper2=paper2, white="#fdfcf9", ink=ink, muted=muted, line=line, pencil=pencil, pencil2=pencil2,
                blue=blue, barbg=barbg, serif=_FACE[disp], sans=_FACE[body], fonts=f"https://fonts.googleapis.com/css2?{_F[disp]}&{_F[body]}&display=swap")


THEME = {
 "bakery": _t("#3b2a22", "#4d382e", "#f8f1e7", "#efe4d4", "#2e211b", "#6b5a50", "#e2d5c3", "#e47a92", "#f3a6b8", "#8a5a3c", "#24180f", "fraunces", "dmsans"),
 "salon": _t("#1f2124", "#2c2f33", "#f5f2ed", "#ebe6de", "#1f2124", "#64605a", "#dcd5ca", "#c9a46a", "#e0c79a", "#7a5c3e", "#121315", "iserif", "isans"),
 "barber": _t("#14213d", "#1f2e52", "#f3f1eb", "#e8e4da", "#14213d", "#5a6070", "#d8d4c8", "#d23a30", "#ee6a60", "#1f3d8a", "#0b1326", "archivo", "plex"),
 "nails": _t("#4a2233", "#5c2d42", "#fcf4f2", "#f4e6e3", "#3a1b28", "#7a5e68", "#ecd8d6", "#e8869c", "#f4b3c2", "#a05a74", "#2c1220", "dmserif", "dmsans"),
 "eat": _t("#1f3a2b", "#2a4a38", "#f7f2e7", "#ede5d4", "#1b2a21", "#5f6a5f", "#ddd5c2", "#e0a43a", "#f0c46a", "#b5462e", "#11221a", "brico", "isans"),
 "shop": _t("#1e2a44", "#2a3858", "#f6f3ed", "#ece7de", "#1b2235", "#5f6577", "#dcd6cb", "#d9775b", "#eda08a", "#3c5a8a", "#121a2c", "bodoni", "jost"),
 "groom": _t("#17393c", "#21494d", "#f2f6f4", "#e4ece9", "#142b2d", "#58696a", "#d3dfdb", "#f2a541", "#f7c27a", "#2f7f86", "#0d2426", "brico", "dmsans"),
 "tailor": _t("#3a2236", "#4a2d45", "#f7f2ec", "#ede5dc", "#2e1b2b", "#6a5b66", "#e0d5cb", "#c9a46a", "#dfc395", "#7a4a6e", "#231421", "corm", "jost"),
 "antique": _t("#2a1f18", "#3a2b21", "#f7f2ea", "#ece4d6", "#231a14", "#6a5d50", "#ddd2c1", "#c9952f", "#e3bd6e", "#6b3a2a", "#160f0b", "fraunces", "dmsans"),
 "scoop": _t("#1f3f44", "#295257", "#fbf6f1", "#f4eae2", "#1b3236", "#5f6e70", "#e7dbd2", "#ef8fa8", "#f7bccb", "#2f8f86", "#122a2e", "fraunces", "dmsans"),
 "uphol": _t("#23322b", "#2f4239", "#f5f1e9", "#ebe5d9", "#1e2a24", "#5e675f", "#dad3c4", "#c8793e", "#e0a275", "#2f6b4f", "#141f1a", "fraunces", "dmsans"),
}
_UPRIGHT = ".hero h1 .l2{font-style:normal;font-weight:400}.hero h1{font-weight:700;letter-spacing:-.035em}h1,h2,h3{letter-spacing:-.025em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}"
EXTRA_CSS = {
 "bakery": ".hero h1 em,.hero0 h1 em{font-weight:400}", "salon": ".hero h1,h1,h2{font-weight:400!important;letter-spacing:-.01em}",
 "barber": None, "nails": ".hero h1{font-weight:400}h2{font-weight:400!important}", "eat": _UPRIGHT,
 "shop": ".hero h1,h1{font-weight:500!important;letter-spacing:-.02em}h2{font-weight:500!important}", "groom": _UPRIGHT,
 "tailor": ".hero h1,h1,h2{font-weight:600!important;letter-spacing:-.01em}", "uphol": "", "scoop": ".hero h1 em,.hero0 h1 em{font-weight:400}", "antique": ".hero h1 em,.hero0 h1 em{font-weight:400}",
}
# each store page carries the quiz card styles
QUIZ_CSS = (".qz .opts button i{display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--c);margin-right:8px;vertical-align:-2px;border:1px solid #0002}"
            ".verdict .sw{display:inline-block;width:18px;height:18px;border-radius:50%;background:var(--c,transparent);vertical-align:-3px;margin-right:8px;border:1px solid #0002}"
            ".verdict .sw[hidden]{display:none}")

COPY = {
 "bakery": dict(svc_h="What's in the case", svc_intro="Stop in and see what's out, or call ahead for an order. If it isn't on the list, ask anyway.",
                quote_h="Plan an order", cta="Plan an order", msg_ph="What it's for, how many people, and the day you need it."),
 "salon": dict(svc_h="What we do", svc_intro="Tell us what you have in mind. If it isn't on the list, ask anyway.",
               quote_h="Ask for a time", cta="Ask for a time", msg_ph="What you'd like done, and days or times that work for you."),
 "barber": dict(svc_h="What we do", svc_intro="Cuts, fades and beard work. If it isn't on the list, ask anyway.",
                quote_h="Ask for a time", cta="Ask for a time", msg_ph="Cut, beard or both, and when you'd like to come in."),
 "nails": dict(svc_h="What we do", svc_intro="Hands, feet or a little art. If it isn't on the list, ask anyway.",
               quote_h="Ask for a time", cta="Ask for a time", msg_ph="Mani, pedi or both, any color or art ideas, and when works."),
 "eat": dict(svc_h="Come hungry", svc_intro="Grab a table, call ahead for carry out, or ask about feeding a crowd.",
             quote_h="Plan a visit or an order", cta="Plan an order", msg_ph="Carry out, a table or a party: how many people and when."),
 "shop": dict(svc_h="What you'll find", svc_intro="Stop in and look around. Looking for something? Ask anyway.",
              quote_h="Ask about something", cta="Ask the shop", msg_ph="What you're looking for, a size, or a question."),
 "groom": dict(svc_h="What we do", svc_intro="Tell us about your dog. If it isn't on the list, ask anyway.",
               quote_h="Get your dog on the schedule", cta="Ask for a groom", msg_ph="Breed or size, the coat, and when the last groom was."),
 "tailor": dict(svc_h="What we fit and fix", svc_intro="Bring it in or tell us about it. If it isn't on the list, ask anyway.",
                quote_h="Get it fitted or fixed", cta="Ask about a fitting", msg_ph="What the piece is, what needs doing, and when you need it."),
 "antique": dict(svc_h="What you'll find", svc_intro="Furniture, glass, clocks and the odd surprise. Looking for something? Ask anyway.",
                 quote_h="Ask about a piece", cta="Ask about a piece", msg_ph="What you're looking for, or what you'd like to sell, and a photo if you have one."),
 "scoop": dict(svc_h="What's in the case", svc_intro="Stop in and see what's scooping today, or ask about treats for a group.",
               quote_h="Plan a party order", cta="Plan a treat order", msg_ph="What it's for, how many people, and the day you need it."),
 "uphol": dict(svc_h="What we redo", svc_intro="Furniture, car or boat: tell us about the piece. If it isn't on the list, ask anyway.",
               quote_h="Get a quote on your piece", cta="Get an upholstery quote", msg_ph="What the piece is, what's worn or torn, and a photo if you have one."),
}
for g, d in GROUPS.items():
    COPY[g].update(sheet=("A storefront in {town}", "Main street, open for the day"),
                   sheet_label=f"Line drawing of a two-storey brick {d['noun']} on main street with a striped awning and a big display window",
                   shot=(f"{g}-after", f"A brick {d['noun']} storefront with a striped awning, the lights on and the OPEN sign lit", "Illustration. Your real shop photos go here."))

STEPS = {
 "bakery": [("Tell us what you need", "The occasion, the day and how many people."), ("Get a call back", "Sort out the details before anything gets made."), ("Pick it up", "Stop in and enjoy.")],
 "salon": [("Tell us what you're after", "A cut, color or something for a big day."), ("Ask for a time", "Get a call or text back to set it up."), ("Walk out happy", "Sit back and enjoy it.")],
 "barber": [("Tell us what you need", "A cut, a fade, a beard trim or all three."), ("Ask for a time", "Call or text to set it up."), ("Leave looking sharp", "Sit back. Done right.")],
 "nails": [("Pick your service", "Mani, pedi, gel or a little art."), ("Ask for a time", "Get a call or text back to set it up."), ("Show them off", "Sit back and enjoy it.")],
 "eat": [("Tell us what you need", "Carry out, a table or a party, and how many people."), ("Get a call back", "Sort out the details ahead of time."), ("Come hungry", "Pick it up or pull up a seat.")],
 "shop": [("Tell us what you're after", "An item, a size, a gift or a question."), ("Get an answer", "Get a call or text back."), ("Stop in", "Come see it in person.")],
 "groom": [("Tell us about your dog", "Breed or size, the coat and anything to know."), ("Ask for a time", "Get a call or text back to set it up."), ("Pick up a happy dog", "Clean, brushed and ready to go home.")],
 "tailor": [("Tell us about the piece", "What it is and what needs doing."), ("Get a straight answer", "Know what it takes before any work starts."), ("Pick it up", "Fitted or fixed, ready when you are.")],
 "antique": [("Tell us what you're after", "A piece you're hunting for, or one you'd like to sell."), ("Get an answer", "Get a call or text back."), ("Come browse", "See it in person, and find a few things you weren't looking for.")],
 "scoop": [("Tell us what you're planning", "A party, a team or a group visit, and how many people."), ("Get a call back", "Sort out the details ahead of time."), ("Grab a spoon", "Stop in and enjoy.")],
 "uphol": [("Tell us about the piece", "What it is, what's worn and a few photos."), ("Get a straight answer", "Know what it takes before any work starts."), ("Bring it home", "Redone and ready to use.")],
}

_G = '<path d="{}" fill="none" stroke="{}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
GLYPH = {
 "bakery": _G.format("M8 15h16l-2.4 12H10.4z", "currentColor") + _G.format("M7 15c0-4.6 3.4-7 5.8-7 1.2-3.4 5.2-3.4 6.4 0 2.4 0 5.8 2.4 5.8 7", "var(--pencil)"),
 "salon": _G.format("M10 6l12 20M22 6 10 26", "currentColor") + '<circle cx="9" cy="27" r="3" fill="none" stroke="var(--pencil)" stroke-width="2.4"/><circle cx="23" cy="27" r="3" fill="none" stroke="var(--pencil)" stroke-width="2.4"/>',
 "barber": '<rect x="11" y="4" width="10" height="24" rx="5" fill="none" stroke="currentColor" stroke-width="2.4"/>' + _G.format("M11 10l10 4M11 17l10 4", "var(--pencil)"),
 "nails": _G.format("M11 14h10v11a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z", "currentColor") + _G.format("M13 14V5h6v9", "var(--pencil)"),
 "eat": _G.format("M16 26a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "currentColor") + _G.format("M4 6v7a2 2 0 0 0 4 0V6M6 13v14M28 6c-3 3-3 8 0 9v12", "var(--pencil)"),
 "shop": _G.format("M7 11h18l-1.4 17H8.4z", "currentColor") + _G.format("M11.5 13V9a4.5 4.5 0 0 1 9 0v4", "var(--pencil)"),
 "groom": '<path d="M16 27c-5 0-7.5-2.5-6.2-5.6S13.6 17 16 17s4.9 1.3 6.2 4.4S21 27 16 27z" fill="var(--pencil)"/>' + "".join(f'<ellipse cx="{x}" cy="{y}" rx="2.4" ry="3" fill="currentColor"/>' for x, y in ((8.5, 15), (23.5, 15), (12.5, 9.5), (19.5, 9.5))),
 "tailor": _G.format("M6 26 25 7", "currentColor") + _G.format("M25 7c2-2 4-1.3 4 .7S27 10.4 25 8.4", "currentColor") + _G.format("M5 18c4-4 8 0 12-2.6S22.4 8.6 27 8.6", "var(--pencil)"),
 "antique": _G.format("M16 5a11 11 0 1 0 .1 0", "currentColor") + _G.format("M16 10v6l4 3", "var(--pencil)"),
 "scoop": _G.format("M10 15h12l-6 13z", "currentColor") + _G.format("M10 15a6 6 0 0 1 12 0M13 9a4 4 0 0 1 6 0", "var(--pencil)"),
 "uphol": _G.format("M6 14h20v9H6z", "currentColor") + _G.format("M9 14V9h14v5M8 23v4M24 23v4", "var(--pencil)"),
}

_I = {
 "cake": '<path d="M10 30h36v16H10z"/><path d="M14 30v-8h28v8"/><path d="M10 38c4 3 8 3 12 0s8-3 12 0 8 3 12 0"/><path d="M28 22v-8M28 10c-2-2 0-5 0-5s2 3 0 5"/>',
 "box": '<path d="M10 20h36v24H10z"/><path d="M10 20 28 12l18 8"/><path d="M28 20v24M20 16l18 8"/>',
 "star": '<path d="m28 9 5.5 11.2 12.4 1.8-9 8.7 2.1 12.3L28 37.2 16.9 43l2.1-12.3-9-8.7 12.4-1.8z"/>',
 "donut": '<circle cx="28" cy="28" r="17"/><circle cx="28" cy="28" r="6"/><path d="M16 22l3 1M36 16l1 3M40 32l-3 1M22 38l1-3M33 37l2 2"/>',
 "coffee": '<path d="M12 22h26v12a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10z"/><path d="M38 26h3a5 5 0 0 1 0 10h-4"/><path d="M20 8c-2 3 2 5 0 8M28 8c-2 3 2 5 0 8"/>',
 "scissors": '<path d="M20 12 38 42M38 12 20 42"/><circle cx="16" cy="44" r="5"/><circle cx="42" cy="44" r="5"/>',
 "drop": '<path d="M28 8c-8 11-12 18-12 24a12 12 0 0 0 24 0c0-6-4-13-12-24z"/><path d="M22 34a6 6 0 0 0 6 6"/>',
 "flower": '<circle cx="28" cy="24" r="4"/><path d="M28 20c-3-7 3-11 0-12M32 24c7-3 11 3 12 0M28 28c3 7-3 11 0 12M24 24c-7 3-11-3-12 0"/><path d="M28 40v8M22 46c3-3 9-3 12 0"/>',
 "comb": '<path d="M10 22h36v8H10z"/><path d="M14 30v12M19 30v12M24 30v12M29 30v12M34 30v12M39 30v12M44 30v12"/>',
 "beard": '<path d="M14 18c0 18 6 28 14 28s14-10 14-28"/><path d="M20 30c3 2 13 2 16 0"/><path d="M22 22h4M30 22h4"/>',
 "kid": '<circle cx="28" cy="20" r="8"/><path d="M14 46c2-9 8-13 14-13s12 4 14 13"/><path d="M24 14c2-3 6-3 8 0"/>',
 "hand": '<path d="M20 46V24a3 3 0 0 1 6 0v8M26 30V18a3 3 0 0 1 6 0v12M32 30V20a3 3 0 0 1 6 0v14c0 8-4 12-11 12h-2c-5 0-8-3-11-8l-4-7a3 3 0 0 1 5-3l3 4"/>',
 "foot": '<path d="M20 46c-6 0-8-6-6-14l3-12c1-5 5-7 9-6 5 1 7 6 6 11l-2 9c-1 6 2 12-10 12z"/><circle cx="34" cy="12" r="2.5"/><circle cx="40" cy="15" r="2"/><circle cx="43" cy="20" r="1.8"/>',
 "brush": '<path d="M38 8 22 30"/><path d="M18 30c-4 0-8 4-8 10 0 3-2 5-4 6 8 2 16-1 18-6 1-4 0-7-6-10z"/>',
 "plate": '<circle cx="28" cy="28" r="14"/><circle cx="28" cy="28" r="7"/><path d="M8 12v12a3 3 0 0 0 6 0V12M11 24v20M48 12c-4 4-4 12 0 14v18"/>',
 "bag": '<path d="M12 20h32l-3 26H15z"/><path d="M21 24v-8a7 7 0 0 1 14 0v8"/>',
 "group": '<circle cx="20" cy="20" r="6"/><circle cx="38" cy="22" r="5"/><path d="M8 44c1-8 6-12 12-12s11 4 12 12"/><path d="M32 34c2-1 4-2 6-2 5 0 9 4 10 10"/>',
 "hanger": '<path d="M28 14a4 4 0 1 1 4 4c-2 0-4 2-4 4v2L8 38h40L28 24"/>',
 "heart": '<path d="M28 44S10 33 10 21a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23z"/>',
 "tag": '<path d="M10 10h18l18 18-18 18L10 28z"/><circle cx="19" cy="19" r="3"/>',
 "paw": '<path d="M28 46c-8 0-12-4-10-9s6-7 10-7 8 2 10 7-2 9-10 9z"/><ellipse cx="15" cy="27" rx="4" ry="5"/><ellipse cx="41" cy="27" rx="4" ry="5"/><ellipse cx="22" cy="18" rx="4" ry="5"/><ellipse cx="34" cy="18" rx="4" ry="5"/>',
 "tub": '<path d="M8 28h40v4a12 12 0 0 1-12 12H20A12 12 0 0 1 8 32z"/><path d="M14 28V14a5 5 0 0 1 10 0"/><path d="M14 48l2-4M42 48l-2-4"/><circle cx="34" cy="18" r="2"/><circle cx="40" cy="14" r="1.6"/>',
 "clip": '<path d="M16 12 40 44M40 12 16 44"/><path d="M12 44h12M32 44h12"/>',
 "needle": '<path d="M12 44 40 16"/><path d="M40 16c3-3 6-2 6 1s-3 4-6 1"/><path d="M10 30c6-6 12 0 18-4s8-10 14-10"/>',
 "dress": '<path d="M22 8h12l-2 8 10 30H14l10-30z"/><path d="M24 16h8"/>',
 "chair": '<path d="M14 26h28v12H14z"/><path d="M18 26V12h20v14M16 38v8M40 38v8"/><path d="M10 24v12M46 24v12"/>',
 "scoop": '<path d="M18 26h20l-10 24z"/><path d="M18 26a10 10 0 0 1 20 0"/><path d="M22 16a7 7 0 0 1 12 0"/><path d="M22 32l10 8M34 32l-8 10"/>',
 "clock": '<circle cx="28" cy="26" r="16"/><path d="M28 16v10l7 5"/><path d="M20 48h16"/>',
 "lamp": '<path d="M18 26h20l-5-14H23z"/><path d="M28 26v16M20 46h16"/>',
 "sell": '<path d="M8 30l14-14h12l6 6v12L26 48z"/><circle cx="30" cy="22" r="3"/><path d="M40 8v8M36 12h8"/>',
 "car": '<path d="M8 36h40v-8l-6-10H16l-6 10z"/><circle cx="17" cy="38" r="4"/><circle cx="39" cy="38" r="4"/><path d="M14 26h28"/>',
}
SVC_ICON = {
 "Fresh baked goods": "cake", "Orders": "box", "Something special": "star", "Celebration cakes": "cake", "Custom orders": "star", "Treats": "heart",
 "Donuts": "donut", "Dozens to go": "box", "Coffee runs": "coffee",
 "Cuts and styling": "scissors", "Color": "drop", "Special occasions": "flower", "Haircuts": "comb", "Beard work": "beard", "Kids' cuts": "kid",
 "Manicures": "hand", "Pedicures": "foot", "Nail art": "brush",
 "Dine in": "plate", "Carry out": "bag", "Groups and parties": "group",
 "Shop the racks": "hanger", "Donations": "heart", "Ask about an item": "tag", "New arrivals": "tag", "Gifts": "box", "Personal help": "hanger",
 "Bath and brush": "tub", "Full groom": "paw", "Nails and touch-ups": "clip",
 "Alterations": "needle", "Formal wear": "dress", "Furniture": "chair", "Auto and boat": "car",
 "Scoops": "scoop", "Parties": "group",
 "Browse the floor": "lamp", "Looking for a piece": "clock", "Selling something": "sell",
}
SVC_ICON = {k: _I[v] for k, v in SVC_ICON.items()}

# ---------- Signature and Immersive ----------
def hero(g):
    n = GROUPS[g]["noun"]
    return (f"{g}-before", f"{g}-after", f"A brick main-street {n} before opening, with the lights off and the awning rolled up",
            f"The same {n} open for the day, with the awning out, the lights on and the OPEN sign lit", "50% 50%")


INSIDE = {
 "bakery": ("A case worth the trip", "Cakes up top, donuts and cookies below, and bread on the back shelves.", "Inside the bakery: a glass case of cakes, donuts and cookies"),
 "salon": ("Your chair is ready", "Styling chairs, good light and the wash bowls at the back.", "Inside the salon: styling chairs facing mirrors, wash bowls at the back"),
 "barber": ("Pull up a chair", "Classic chairs, sharp mirrors and the clippers ready.", "Inside the barber shop: red barber chairs facing mirrors"),
 "nails": ("Pick your color", "A wall of polish, manicure tables and comfy pedicure chairs.", "Inside the nail salon: manicure tables, pedicure chairs and a wall of polish"),
 "eat": ("Grab a table", "Tables by the window, stools at the counter and a board on the wall.", "Inside the restaurant: tables by the window and stools at the counter"),
 "shop": ("Take a look around", "Racks, shelves and a table of finds.", "Inside the shop: clothing racks, a table of folded finds and full shelves"),
 "groom": ("A spa day for the dog", "A grooming table, a dryer and a tub at the back.", "Inside the grooming shop: a grooming table, a dryer and a tub"),
 "tailor": ("Fitted right here", "Dress forms, a cutting table, the machine and a wall of thread.", "Inside the tailor shop: a cutting table, a sewing machine and fabric shelves"),
 "antique": ("Come browse", "A grandfather clock, a china hutch, a rocker and a gramophone in the window.", "Inside the antique shop: a grandfather clock, a china hutch and a rocking chair"),
 "scoop": ("Pick a flavor", "A case full of tubs, cones stacked high and sundaes in the window.", "Inside the ice cream shop: a dipping case of colorful tubs and stacked cones"),
 "uphol": ("Where the work happens", "A cutting table, the machine and fabric to pick from.", "Inside the upholstery shop: a cutting table, a sewing machine and fabric bolts"),
}


def svc_img(g):
    n = GROUPS[g]["noun"]
    return [(f"{g}-window", f"The display window of a {n}, lit up for the day"), (f"{g}-inside", INSIDE[g][2]), (f"{g}-door", f"The front door of a {n} with the OPEN sign hung on the glass")]


def stages(g):
    i = INSIDE[g]
    return [(f"{g}-s1", "Early", "Before the doors open", "A quiet street, the lights off and the awning rolled up."),
            (f"{g}-s2", "Getting ready", "Lights on, awning out", "The shop wakes up and the window comes alive."),
            (f"{g}-s3", "Open", "The sign flips", "The neon's on and the door's open. Come on in."),
            (f"{g}-s4", "Inside", i[0], i[1])]


VISIT = {"bakery": "From the street to the case", "salon": "From the street to the chair", "barber": "From the street to the chair",
         "nails": "From the street to the chair", "eat": "From the street to your seat", "shop": "From the street to the racks",
         "groom": "From the street to the tub", "tailor": "From the street to the fitting", "uphol": "From the street to the shop floor", "scoop": "From the street to the case", "antique": "From the street to the shop floor"}
VISIT_INTRO = "Shown on the same shop, from opening to inside."

# the Signature tool: two quick questions and a plain answer; question one is always the shop's own job list
TOOL = {
 "bakery": ("Order planner", "Plan an order in two taps", "Pick the occasion and how many people, and see roughly how much to ask for.",
            "How many people?", [("12", "Under 12", "Figure about one to two dozen treats."), ("24", "12 to 24", "Figure about two to four dozen treats."),
                                 ("50", "25 to 50", "Figure about four to eight dozen treats."), ("99", "50 or more", "Figure eight dozen or more, and ask early.")],
            "Bigger orders need more notice, so say the day you need it.", "A rough guide, not a quote."),
 "salon": ("Visit planner", "Plan your visit", "Pick what you're after and your hair length, and know what to mention when you ask for a time.",
           "How long is your hair?", [("s", "Short", "Short hair is usually the quickest visit."), ("m", "Shoulder length", "Mention if it's thick or curly so the right time gets set aside."),
                                      ("l", "Long", "Long hair can take longer, especially for color, so say so when you ask."), ("xl", "Very long or thick", "Very long or thick hair often needs extra time. Mention it up front.")],
           "Bring a photo of what you like if you have one.", "A quick guide. The salon will tell you what your hair needs."),
 "barber": ("Chair planner", "Get in the chair", "Pick the cut and who's coming, and know what to say when you call or text.",
            "Who's coming in?", [("me", "Just me", "Call or text ahead to grab a time."), ("kid", "Me and my kid", "Ask for back-to-back times so you're in and out together."),
                                 ("group", "A group", "Wedding party or team? Ask early so there's room for everyone.")],
            "A photo of the cut you want always helps.", "A quick guide. The shop will set the time with you."),
 "nails": ("Color picker", "Pick a color family", "Pick your service and a color family, and send it over when you ask for a time.",
           "Pick a color family", [("nude", "Nudes", "Soft and easy with everything.", "#d9b7a4"), ("pink", "Pinks", "From blush to bright.", "#e8869c"),
                                   ("red", "Reds", "A classic that always works.", "#b3241c"), ("dark", "Darks", "Deep plums, navies and near-black.", "#3a1b28"),
                                   ("bright", "Brights", "Corals, blues and summer colors.", "#2fb3c4"), ("any", "Surprise me", "Ask what's new on the wall.", "#c9a46a")],
           "Bring a photo if you have a look in mind.", "A quick guide. The salon will help you pick."),
 "eat": ("Order planner", "Plan a visit or an order", "Pick what you need and how many people, and know what to mention when you call.",
         "How many people?", [("4", "1 to 4", "Call ahead and it can be ready when you get there."), ("10", "5 to 10", "Give a heads-up for a group so there's room."),
                              ("25", "11 to 25", "Bigger groups and orders need more notice, so ask early."), ("99", "More than 25", "Feeding a crowd? Ask early so there's time to plan it.")],
         "Mention any allergies when you call.", "A quick guide. The restaurant will confirm the details."),
 "shop": ("Item finder", "Looking for something?", "Pick what you need and what kind of thing, and send it over. They'll check for you.",
          "What kind of thing?", [("clothes", "Clothing", "Mention the size and the style you're after."), ("shoes", "Shoes and bags", "Mention the size, the color and the brand if it matters."),
                                  ("home", "Home and decor", "A photo or measurements help."), ("gift", "A gift", "Say who it's for and what they like.")],
          "Ask anyway. Stock changes, so a quick call or text saves a trip.", "A quick guide. The shop will tell you what's in."),
 "groom": ("Coat check", "Tell us about the coat", "Pick the groom and the coat, and know what to mention when you ask for a time.",
           "What's the coat like?", [("short", "Short and smooth", "Short coats are usually the quickest groom."), ("double", "Thick or double", "Double coats shed a lot, and a good bath and brush-out helps."),
                                     ("long", "Long or curly", "Long and curly coats need regular grooms to stay tangle-free."), ("mat", "Matted", "Mats can hurt. Mention them up front so the right time gets set aside.")],
           "Mention your dog's size and anything they don't love, like nails or the dryer.", "A quick guide. The groomer will tell you what your dog needs."),
 "tailor": ("Fitting check", "Get the fitting right", "Pick the job and the piece, and know what to bring.",
            "What's the piece?", [("pants", "Pants", "Bring the shoes you'll wear so the hem lands right."), ("dress", "Dress or skirt", "Bring the shoes and what you'll wear under it."),
                                  ("suit", "Suit or jacket", "Bring the shirt and shoes you'll wear with it."), ("bridal", "Wedding dress", "Start early. Bridal fittings usually take more than one visit.")],
            "Say the date you need it by when you ask.", "A quick guide. The tailor will tell you what it really needs."),
 "antique": ("Piece finder", "Looking for something?", "Pick what you're after and what kind of piece, and send it over. They'll check for you.",
             "What kind of piece?", [("furn", "Furniture", "Mention the size and the room it's for."), ("glass", "Glass and china", "A pattern name or a photo helps a lot."),
                                     ("decor", "Clocks, lamps and decor", "Say the era or style if you know it."), ("other", "Something else", "Describe it, or send a photo.")],
             "A photo or a pattern name helps them check fastest.", "A quick guide. The shop will tell you what they have."),
 "scoop": ("Party planner", "Plan treats for a group", "Pick the occasion and how many people, and know what to mention when you ask.",
           "How many people?", [("10", "Under 10", "A quick call or text ahead is usually plenty."), ("25", "10 to 25", "Give a heads-up so there's enough of the favorites."),
                                ("50", "25 to 50", "Ask early so there's time to plan it."), ("99", "50 or more", "Feeding a crowd? Ask well ahead and mention any allergies.")],
           "Mention any allergies when you ask.", "A quick guide. The shop will confirm the details."),
 "uphol": ("Piece check", "What's going on with it?", "Pick the piece and what's wrong, and get a plain answer on where to start.",
           "What's wrong with it?", [("worn", "Worn fabric", "Photos and the size of the piece help get a straight answer."), ("torn", "Torn or split", "Small tears can sometimes be repaired without redoing the whole piece. Ask."),
                                     ("flat", "Flat cushions", "New foam can bring flat cushions back without new fabric. Ask."), ("new", "Want a new look", "Bring fabric ideas, or ask what's available.")],
           "A few photos from different angles help most.", "A quick guide, not a quote. The shop will tell you what it takes."),
}

READY = {
 "bakery": "The occasion, the day you need it and how many people. A photo of an idea helps for anything special.",
 "salon": "What you'd like done, a photo if you have one, and a few days or times that work.",
 "barber": "The cut you want, a photo if you have one, and when you'd like to come in.",
 "nails": "The service you want, any color or art ideas, and a few days or times that work.",
 "eat": "What you'd like, how many people and when. Mention any allergies.",
 "shop": "What you're looking for, the size, and a photo if you have one.",
 "groom": "Your dog's breed or size, the coat, when the last groom was and anything they don't love.",
 "tailor": "What the piece is, what needs doing and the date you need it by.",
 "uphol": "What the piece is, a few photos and roughly how big it is.",
 "scoop": "What it's for, how many people, the day you need it and any allergies.",
 "antique": "What you're looking for (or selling), rough size or era, and a photo if you have one.",
}

# pitch room and meet page lines
TOOLS = {g: ("Text-the-shop button", f"Before-and-after slider and a{'n' if TOOL[g][0][0] in 'AEIOU' else ''} {TOOL[g][0].lower()}",
             "a live 3D storefront that opens up for the day and lets you step inside") for g in GROUPS}
TRY = {g: ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
           f"Drag the slider on the top picture from closed to open, then try the {TOOL[g][0].lower()}.",
           "Scroll to watch the shop open up and walk inside, then change the awning color and flip the sign yourself.") for g in GROUPS}

# t1250: the scroll story
def beats(g):
    s1, s2, s3, s4 = stages(g)
    return [("hero", .62, {"open": 0, "lights": 0, "awning": 0, "door": 0}, None, f"{g}-before", None),
            ("front", .45, {"open": 0, "lights": 0, "awning": 0, "door": 0}, {"open": 0, "lights": 1, "awning": 1, "door": 0}, f"{g}-s2", ("01 · " + s2[1], s2[2], "Keep scrolling and watch the shop wake up for the day.")),
            ("door", .14, {"open": 0, "lights": 1, "awning": 1, "door": 0}, {"open": 1, "lights": 1, "awning": 1, "door": 1}, f"{g}-s3", ("02 · " + s3[1], s3[2], s3[3])),
            ("inside", .14, {"open": 1, "lights": 1, "awning": 1, "door": 1}, None, f"{g}-s4", ("03 · Inside", s4[2], s4[3])),
            ("dusk", .84, {"open": 1, "lights": 1, "awning": 1, "door": 1}, {"open": 1, "lights": 1, "awning": 1, "door": 0}, f"{g}-dusk", ("04 · Evening", "Still glowing at dusk", "The window lit, the neon on and the street lamps coming up.")),
            ("cfg", .14, {}, None, f"{g}-after", "cfg")]


AWNINGS = [("Red", "#b3343a"), ("Green", "#2f6b4f"), ("Navy", "#24365e"), ("Black", "#1d1f22"), ("Pink", "#d9879a"), ("Teal", "#2f7f86"), ("Gold", "#c9952f"), ("Plum", "#6b3a5e")]
AWN_DEFAULT = {"bakery": "Pink", "salon": "Black", "barber": "Red", "nails": "Pink", "eat": "Green", "shop": "Navy", "groom": "Teal", "tailor": "Plum", "uphol": "Plum", "scoop": "Teal", "antique": "Gold"}

# render list for one group: hero pair, the four stages, dusk, window, inside, door
CAM = {"hero": ("-9,2.3,17.5", ".8,3.5,0", 36), "front": ("-4.6,2.4,11.5", ".6,2.7,0", 40), "door": ("0,1.6,5.5", "0,1.5,-2", 40),
       "inside": ("1.6,1.75,-1.6", "-.8,1.15,-5.2", 55), "window": ("-3.6,1.55,3.6", "-1.6,1.3,-1.0", 40), "dusk": ("-7.5,1.9,15", ".8,3.2,0", 36)}


def renders(g):
    d = GROUPS[g]; base = f"kind={d['kind']}&sign={d['sign'].replace(' ', '+')}&word={d['word']}"
    def r(name, w, h, cam, tod, st, ox=0):
        c, t, f = CAM[cam]
        q = f"{base}&tod={tod}&cam={c}&tgt={t}&fov={f}&{st}" + (f"&ox={ox}" if ox else "")
        return {"name": f"{g}-{name}", "lab": "labstore", "w": w, "h": h, "q": q}
    closed, opened, inside = "open=0&lights=0&awning=0&door=0", "open=1&lights=1&awning=1&door=0", "open=1&lights=1&awning=1&door=1&second=0"
    return [r("before", 2400, 1350, "hero", .62, closed, .13), r("after", 2400, 1350, "hero", .14, opened, .13),
            r("s1", 1200, 800, "front", .62, closed), r("s2", 1200, 800, "front", .45, "open=0&lights=1&awning=1&door=0"),
            r("s3", 1200, 800, "door", .14, "open=1&lights=1&awning=1&door=1"), r("s4", 1200, 800, "inside", .14, inside),
            r("dusk", 1600, 1000, "dusk", .84, opened), r("window", 1600, 1000, "window", .14, opened),
            r("inside", 1600, 1000, "inside", .14, inside), r("door", 1600, 1000, "door", .14, opened)]


# shop-wide wording: the flagship pages were written for trades that come to you; a store is a place you visit
WORDING = [
    ("<dt>Works in</dt>", "<dt>Customers from</dt>"),
    ('<p style="margin-bottom:10px">Works in</p>', '<p style="margin-bottom:10px">Customers from</p>'),
    ("a little about the job and get a call back.", "what you need and get a call back."),
    ("<h3>Ask for a quote</h3>", "<h3>Send a request</h3>"),
    ('href="#quote">Get a quote</a>', 'href="#quote">Send a request</a>'),
    ("Every job gets its own quote. Call, text or send the form and", "Questions about anything? Call, text or send the form and"),
    ("will tell you what it takes.", "will get back to you."),
    ("<b>To ask for a quote</b>", "<b>To send a request</b>"),
    ("Ask for a quote", "Send a request"),
    ("Quote request in about a minute", "Send a request in about a minute"),
    ('<div class="t1">Job<b>', '<div class="t1">Shop<b>'),
    ("<dt>Job</dt>", "<dt>Visit</dt>"),
    (" works in ", " serves "),
    ("the towns you work in", "the towns your customers come from"),
    ("real job photos", "real shop photos"),
    ("a few job photos", "a few shop photos"),
]


def wording(html):
    for a, b in WORDING:
        html = html.replace(a, b)
    return html
