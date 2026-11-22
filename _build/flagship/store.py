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
 "tattoo": dict(vs=["tattoo"], kind="tattoo", sign="Tattoo", word="Tattoo", noun="tattoo studio"),
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
 "tattoo": r"academy|school|supply|removal|laser|mobile|cosmetic|microblad|permanent makeup|brow|lash|piercing only",
 "scoop": r"food truck|truck|mobile|cart\b|trailer|wholesale|distribut|dairy farm|creamery|dairy dream|freeze|frost|drive.?in|dip\b|\bstand\b|soft serve",
}
WORD = {"bakery": "Bakery", "cake": "Cakes", "donut": "Donuts", "salon": "Hair", "barber": "Barber", "nails": "Nails", "restaurant": "Eat",
        "thrift": "Thrift", "boutique": "Boutique", "petgroom": "Grooming", "tailor": "Tailor", "upholstery": "Upholstery", "icecream": "Ice Cream", "antique": "Antiques", "tattoo": "Tattoo"}

TRADE = {"bakery": "Bakery", "cake": "Cake shop", "donut": "Donut shop", "salon": "Hair salon", "barber": "Barber shop", "nails": "Nail salon",
         "restaurant": "Restaurant", "thrift": "Thrift store", "boutique": "Boutique", "petgroom": "Pet grooming", "tailor": "Tailoring and alterations",
         "upholstery": "Upholstery", "icecream": "Ice cream shop", "antique": "Antique store", "tattoo": "Tattoo shop"}
SCHEMA = {"bakery": "Bakery", "cake": "Bakery", "donut": "Bakery", "salon": "HairSalon", "barber": "HairSalon", "nails": "NailSalon",
          "restaurant": "Restaurant", "thrift": "Store", "boutique": "ClothingStore", "petgroom": "LocalBusiness", "tailor": "LocalBusiness",
          "upholstery": "LocalBusiness", "icecream": "IceCreamShop", "antique": "Store", "tattoo": "TattooParlor"}

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
 "tattoo": {"services": [("Custom work", "Bring an idea, a sketch or a photo and talk it through."), ("Cover-ups", "Old tattoo you're done with? Ask about it."), ("Touch-ups", "Faded or healed rough? Ask about a touch-up.")]},
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
 "tattoo": _t("#161618", "#232327", "#f4f1ea", "#e8e3d8", "#141416", "#5f5c57", "#d8d2c6", "#c23a2e", "#e9786a", "#24497a", "#0c0c0e", "archivo", "dmsans"),
 "antique": _t("#2a1f18", "#3a2b21", "#f7f2ea", "#ece4d6", "#231a14", "#6a5d50", "#ddd2c1", "#c9952f", "#e3bd6e", "#6b3a2a", "#160f0b", "fraunces", "dmsans"),
 "scoop": _t("#1f3f44", "#295257", "#fbf6f1", "#f4eae2", "#1b3236", "#5f6e70", "#e7dbd2", "#ef8fa8", "#f7bccb", "#2f8f86", "#122a2e", "fraunces", "dmsans"),
 "uphol": _t("#23322b", "#2f4239", "#f5f1e9", "#ebe5d9", "#1e2a24", "#5e675f", "#dad3c4", "#c8793e", "#e0a275", "#2f6b4f", "#141f1a", "fraunces", "dmsans"),
}
_UPRIGHT = ".hero h1 .l2{font-style:normal;font-weight:400}.hero h1{font-weight:700;letter-spacing:-.035em}h1,h2,h3{letter-spacing:-.025em}h2{font-weight:600!important}.hero0 h1 em{font-style:normal}"
EXTRA_CSS = {
 "bakery": ".hero h1 em,.hero0 h1 em{font-weight:400}", "salon": ".hero h1,h1,h2{font-weight:400!important;letter-spacing:-.01em}",
 "barber": None, "nails": ".hero h1{font-weight:400}h2{font-weight:400!important}", "eat": _UPRIGHT,
 "shop": ".hero h1,h1{font-weight:500!important;letter-spacing:-.02em}h2{font-weight:500!important}", "groom": _UPRIGHT,
 "tailor": ".hero h1,h1,h2{font-weight:600!important;letter-spacing:-.01em}", "uphol": "", "scoop": ".hero h1 em,.hero0 h1 em{font-weight:400}", "antique": ".hero h1 em,.hero0 h1 em{font-weight:400}", "tattoo": _UPRIGHT,
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
 "tattoo": dict(svc_h="What we do", svc_intro="Custom pieces, cover-ups and touch-ups. Have an idea? Send it over.",
                quote_h="Talk through your idea", cta="Send your idea", msg_ph="The idea, where on the body, roughly how big, and a photo or sketch if you have one."),
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
 "tattoo": [("Send your idea", "What you want, where it goes and roughly how big."), ("Talk it through", "Get a call or text back to go over it."), ("Sit for it", "Line by line, made to last.")],
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
 "tattoo": _G.format("M7 25l8-8M13 9h11v7H13zM16 9V6h5v3", "currentColor") + _G.format("M24 12h4", "var(--pencil)"),
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
 "machine": '<path d="M10 46 26 30"/><path d="M22 18h22v14H22z"/><path d="M27 18v-7h12v7"/><path d="M26 32l-5 5"/><path d="M44 25h6"/>',
 "rose": '<circle cx="28" cy="22" r="10"/><path d="M28 16a5 5 0 1 0 5 5"/><path d="M28 32v16M28 40c-6-1-9-5-10-9M28 42c6-1 9-5 10-9"/>',
 "touch": '<path d="M12 44 32 24"/><path d="M30 18l8 8M34 14l8 8"/><path d="M40 34l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/>',
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
 "Custom work": "machine", "Cover-ups": "rose", "Touch-ups": "touch",
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
 "tattoo": ("Pull up a chair", "Flash on the wall, two clean stations and the lamps on.", "Inside the tattoo studio: framed flash on the wall and two tattoo stations with lamps"),
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
         "groom": "From the street to the tub", "tailor": "From the street to the fitting", "uphol": "From the street to the shop floor", "scoop": "From the street to the case", "antique": "From the street to the shop floor", "tattoo": "From the street to the chair"}
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
 "tattoo": ("Idea check", "What are you thinking?", "Pick the kind of piece and how big, and know what to send so the artist can give a straight answer.",
            "How big?", [("s", "Small", "Palm-sized or smaller. Send a photo or sketch and where it goes."), ("m", "Medium", "Hand to forearm size. Mention the placement and any style you like."),
                         ("l", "Large or a sleeve", "Bigger pieces often take more than one sitting. Ask how it's planned."), ("c", "A cover-up", "Send a clear photo of the old tattoo and roughly its size.")],
            "A photo or sketch and the placement get you a straight answer fastest.", "A quick guide, not a quote. The artist will tell you what it really takes."),
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
 "tattoo": "The idea, where it goes, roughly how big, and a photo or sketch if you have one.",
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
AWN_DEFAULT = {"bakery": "Pink", "salon": "Black", "barber": "Red", "nails": "Pink", "eat": "Green", "shop": "Navy", "groom": "Teal", "tailor": "Plum", "uphol": "Plum", "scoop": "Teal", "antique": "Gold", "tattoo": "Black"}

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


# ---------- Nov 22: martial arts schools, jewelers, appliance stores, massage studios ----------
GROUPS.update({
 "dojo": dict(vs=["martial"], kind="dojo", sign="Martial Arts", word="Martial Arts", noun="martial arts school"),
 "jewel": dict(vs=["jewelry"], kind="jewel", sign="Jewelers", word="Jewelry", noun="jewelry store"),
 "appst": dict(vs=["applstore"], kind="appst", sign="Appliances", word="Appliances", noun="appliance store"),
 "massage": dict(vs=["massage"], kind="massage", sign="Massage", word="Massage", noun="massage studio"),
})
KGROUP.update({v: g for g in ("dojo", "jewel", "appst", "massage") for v in GROUPS[g]["vs"]}); KIT_V.update(KGROUP)
NAME_OUT.update({
 "dojo": r"boxing|mma\b|cage|fight club|crossfit|fitness|gym\b|yoga|mobile",
 "jewel": r"pawn|gold buyer|cash for|wholesale|supply|mobile|piercing|online",
 "appst": r"repair|parts|service center|mobile",
 "massage": r"asian|parlor|spa\b|mobile|in.?home|chair|clinic|chiro|physical therapy",
})
WORD.update({"martial": "Martial Arts", "jewelry": "Jewelry", "applstore": "Appliances", "massage": "Massage"})
TRADE.update({"martial": "Martial arts school", "jewelry": "Jewelry store", "applstore": "Appliance store", "massage": "Massage therapist"})
SCHEMA.update({"martial": "SportsActivityLocation", "jewelry": "JewelryStore", "applstore": "Store", "massage": "HealthAndBeautyBusiness"})
# appliance stores are appliance leads on Google; pick.py moves the ones whose Google category is a store onto their own variant
V_NEW["applstore"] = dict(group="retail", noun="store", h300=["Fridges, washers,", "ranges and more."], h750=["Come see it", "in person."],
                          h1250=["Pick it out.", "Take it home."],
                          lede="An appliance store in {town}. Stop in to look around, or call to ask what's on the floor.",
                          services=[("Fridges and freezers", "Come see what's on the floor, side by side."), ("Washers and dryers", "Call or text to ask what's in."),
                                    ("Ranges and more", "Ask about ovens, dishwashers and more.")],
                          jobs=["Fridge or freezer", "Washer or dryer", "Range or oven", "Something else"],
                          when=["Today", "This week", "This month", "Just asking"], who="shoppers", ask="What are you looking for?")
TRADE_LABEL["applstore"] = "Appliance Store"
OVERRIDE.update({
 "martial": {"services": [("Classes", "Ask about the class schedule and who each class is for."), ("First class", "Ask about trying a class before you sign up."),
                          ("Kids and adults", "Ask which classes fit your age and level.")],
             "jobs": ["Classes", "First class", "Kids or adults", "Something else"]},
 "jewelry": {"services": [("Fine jewelry", "Rings, necklaces, earrings and more to see in person."), ("Repairs", "Ask about sizing, clasps, chains and stones."),
                          ("Custom ideas", "Ask if they can make what you have in mind.")],
             "jobs": ["A piece I saw", "Repair", "Custom idea", "Something else"]},
 "massage": {"lede": "Massage in {town}. Tell us what's bothering you and ask for a time that works for you.",
             "services": [("Relaxation", "Ask about a session to unwind."), ("Deep tissue", "Ask if deep tissue work is offered."), ("Gift a session", "Ask about giving a session as a gift.")],
             "jobs": ["Relaxation", "Deep tissue", "Gift", "Something else"]},
})
THEME.update({
 "dojo": _t("#1f2a44", "#2a3656", "#f6f3ec", "#ebe6dc", "#161e33", "#5f6473", "#d9d4c8", "#b3343a", "#e2747a", "#24497a", "#111829", "archivo", "dmsans"),
 "jewel": _t("#1d2a44", "#283756", "#f7f4ee", "#ece6da", "#141d31", "#62666f", "#dcd5c6", "#b98f3e", "#e2c27a", "#3a5f8a", "#0f1626", "fraunces", "dmsans"),
 "appst": _t("#2b3a4a", "#36485b", "#f5f6f4", "#e8eae6", "#212d3a", "#5f6670", "#d5d9d6", "#d0632f", "#eea27a", "#2f6f68", "#18222d", "archivo", "dmsans"),
 "massage": _t("#3e4b3c", "#4b5a48", "#f7f3ec", "#ece5d8", "#2f3a2e", "#666a60", "#dcd4c4", "#b8794a", "#e0b08a", "#5a7a8a", "#232b22", "fraunces", "dmsans"),
})
EXTRA_CSS.update({"dojo": _UPRIGHT, "jewel": ".hero h1 em,.hero0 h1 em{font-weight:400}", "appst": _UPRIGHT, "massage": ".hero h1 em,.hero0 h1 em{font-weight:400}"})
COPY.update({
 "dojo": dict(svc_h="On the mat", svc_intro="Tell us who the class is for, and ask which one fits their age and level.",
              quote_h="Ask about a class", cta="Ask about a class", msg_ph="Who the class is for, their age, and any experience so far."),
 "jewel": dict(svc_h="What you'll find", svc_intro="Rings, necklaces and more in the cases. Looking for a repair or something custom? Ask about it.",
               quote_h="Ask about a piece", cta="Ask about a piece", msg_ph="What you're looking for, a repair, or an idea, and a photo if you have one."),
 "appst": dict(svc_h="On the floor", svc_intro="Looking for a fridge, washer, dryer or range? Ask what's on the floor.",
               quote_h="Ask what's in", cta="Ask what's in", msg_ph="What you need, the size or space it has to fit, and when you need it."),
 "massage": dict(svc_h="What we offer", svc_intro="Tell us what's bothering you or what you'd like, and ask which session fits.",
                 quote_h="Ask for a time", cta="Ask for a time", msg_ph="What's bothering you, the kind of massage, and a few days or times that work."),
})
for g in ("dojo", "jewel", "appst", "massage"):
    d = GROUPS[g]
    COPY[g].update(sheet=("A storefront in {town}", "Main street, open for the day"),
                   sheet_label=f"Line drawing of a two-storey brick {d['noun']} on main street with a striped awning and a big display window",
                   shot=(f"{g}-after", f"A brick {d['noun']} storefront with a striped awning, the lights on and the OPEN sign lit", "Illustration. Your real shop photos go here."))
STEPS.update({
 "dojo": [("Say who it's for", "Kids, teens or adults, and any experience."), ("Get an answer", "Get a call or text back about the classes."), ("Step on the mat", "Come try a class.")],
 "jewel": [("Tell us what you're after", "A piece, a repair or an idea."), ("Get an answer", "Get a call or text back."), ("See it in person", "Stop in and see it up close.")],
 "appst": [("Tell us what you need", "The appliance and the space it has to fit."), ("Get an answer", "Find out what's on the floor."), ("Come see it", "Look it over in person before you buy.")],
 "massage": [("Tell us what would help", "What's bothering you and what kind of massage."), ("Pick a time", "Get a call or text back to set it up."), ("Breathe out", "Come in, lie down and let go.")],
})
GLYPH.update({
 "dojo": _G.format("M4 13h24M4 18h24M13 11h6v9h-6z", "currentColor") + _G.format("M14 20l-3 8M18 20l3 8", "var(--pencil)"),
 "jewel": _G.format("M8 20a8 8 0 1 0 16 0a8 8 0 1 0-16 0", "currentColor") + _G.format("M12 8l4-4 4 4-4 4z", "var(--pencil)"),
 "appst": _G.format("M9 3h14v26H9zM9 12h14", "currentColor") + _G.format("M13 6v3M13 15v6", "var(--pencil)"),
 "massage": _G.format("M16 26c-5-4-6-9 0-17 6 8 5 13 0 17z", "currentColor") + _G.format("M16 26c-6 0-11-4-12-9 5 0 9 3 12 9zM16 26c6 0 11-4 12-9-5 0-9 3-12 9z", "var(--pencil)"),
})
_I.update({
 "mat": '<path d="M8 36l20-10 20 10-20 10z"/><path d="M8 36v4l20 10 20-10v-4"/><path d="M18 31l20 10"/>',
 "belt": '<path d="M8 24h40M8 31h40"/><path d="M24 22h8v11h-8z"/><path d="M26 33l-5 13M30 33l5 13"/>',
 "kids": '<circle cx="20" cy="18" r="6"/><circle cx="38" cy="22" r="4.5"/><path d="M8 46c1-9 6-14 12-14s11 5 12 14"/><path d="M30 46c1-6 4-10 8-10s7 4 8 10"/>',
 "ring": '<circle cx="28" cy="36" r="12"/><path d="M22 16l6-7 6 7-6 6z"/>',
 "wrench": '<path d="M36 10a9 9 0 0 0-8 12L12 38a4 4 0 0 0 6 6l16-16a9 9 0 0 0 12-8l-6 2-4-4z"/>',
 "spark": '<path d="M28 8l4 14 14 4-14 4-4 14-4-14-14-4 14-4z"/>',
 "fridge": '<path d="M17 6h22v44H17z"/><path d="M17 21h22"/><path d="M22 11v5M22 26v10"/>',
 "washer": '<path d="M12 6h32v44H12z"/><path d="M12 15h32"/><circle cx="28" cy="32" r="10"/><circle cx="18" cy="10.5" r="1.5"/>',
 "range": '<path d="M8 10h40v38H8z"/><path d="M8 20h40"/><path d="M15 26h26v15H15z"/><path d="M15 15h2M23 15h2M31 15h2M39 15h2"/>',
 "leaf": '<path d="M28 46c-9-7-11-16 0-30 11 14 9 23 0 30z"/><path d="M28 46V24"/>',
 "knot": '<path d="M14 40c6-12 22-12 28-24"/><path d="M14 16c6 12 22 12 28 24"/><circle cx="28" cy="28" r="4"/>',
 "gift": '<path d="M10 24h36v8H10zM13 32h30v14H13z"/><path d="M28 24v22"/><path d="M28 24c-4-8-12-8-10-2 1 2 6 2 10 2zM28 24c4-8 12-8 10-2-1 2-6 2-10 2z"/>',
})
SVC_ICON.update({k: _I[v] for k, v in {"Classes": "mat", "First class": "belt", "Kids and adults": "kids", "Fine jewelry": "ring", ("jewel", "Repairs"): "wrench", "Custom ideas": "spark",
                                       "Fridges and freezers": "fridge", "Washers and dryers": "washer", "Ranges and more": "range",
                                       "Relaxation": "leaf", "Deep tissue": "knot", "Gift a session": "gift"}.items()})
INSIDE.update({
 "dojo": ("Step on the mat", "Mats wall to wall, heavy bags, a mirror and the belts on the wall.", "Inside the martial arts school: puzzle mats, two heavy bags and a rack of colored belts"),
 "jewel": ("Take a closer look", "Lit glass cases of rings, pendants on the back wall and a seat at the counter.", "Inside the jewelry store: lit glass cases of rings and pendants on the back wall"),
 "appst": ("Walk the floor", "Fridges down the wall, washers in a row and ranges at the back.", "Inside the appliance store: fridges along the wall, a row of washers and ranges at the back"),
 "massage": ("Slow everything down", "A table with fresh towels, a paper screen, candles and plants.", "Inside the massage studio: a massage table with towels, a paper screen and candles on a shelf"),
})
VISIT.update({"dojo": "From the street to the mat", "jewel": "From the street to the case", "appst": "From the street to the floor", "massage": "From the street to the table"})
TOOL.update({
 "dojo": ("Class finder", "Who's the class for?", "Pick who it's for and their experience, and know what to ask.",
          "Who's training?", [("kid", "A child", "Mention their age and whether they've trained before."), ("teen", "A teen", "Mention their age and any sports they play."),
                              ("adult", "An adult", "Mention your goals, like fitness, self-defense or competing."), ("family", "The family", "Ask if there are classes you can take together.")],
          "Ask about trying a class first.", "A quick guide. The school will tell you which class fits."),
 "jewel": ("Piece finder", "What are you after?", "Pick what you're looking for, and know what to mention so they can help.",
           "What is it?", [("ring", "A ring", "Mention the size if you know it, and the metal and stone you like."), ("neck", "A necklace or pendant", "Say the length and the style you have in mind."),
                           ("fix", "A repair", "Say what's wrong, like a broken clasp, a loose stone or a resize."), ("idea", "A custom idea", "Send a sketch or a photo of something close.")],
           "A photo helps them answer fastest.", "A quick guide. The store will tell you what they have."),
 "appst": ("Fit check", "What do you need?", "Pick the appliance, and know what to measure before you ask.",
           "Which appliance?", [("fridge", "Fridge or freezer", "Measure the width, height and depth of the space, and the door it has to fit through."),
                                ("wash", "Washer or dryer", "Measure the space, and check gas or electric for a dryer."),
                                ("range", "Range or oven", "Check gas or electric and the width of the opening."), ("dish", "Dishwasher", "Measure the opening under the counter.")],
           "Measurements and a photo of the space help them answer fastest.", "A quick guide. The store will tell you what's on the floor."),
 "massage": ("Session finder", "What would help most?", "Pick what's going on, and know what to mention when you ask for a time.",
             "What's going on?", [("relax", "I need to relax", "A relaxation massage is a good place to start."), ("knots", "Tight back or neck", "Mention where it's tight and how long it's been."),
                                  ("sore", "Sore after training", "Mention the activity and the sore spots."), ("gift", "It's a gift", "Ask about giving a session as a gift.")],
             "Mention any injuries or anything to avoid.", "A quick guide. The therapist will tell you what fits."),
})
READY.update({
 "dojo": "Who the class is for, their age, any experience, and the days that work.",
 "jewel": "What you're looking for or what needs fixing, and a photo if you have one.",
 "appst": "The appliance, the space it has to fit (measurements), and gas or electric.",
 "massage": "What's bothering you, the kind of massage, and a few days or times that work.",
})
for _g in ("dojo", "jewel", "appst", "massage"):
    TOOLS[_g] = ("Text-the-shop button", f"Before-and-after slider and a{'n' if TOOL[_g][0][0] in 'AEIOU' else ''} {TOOL[_g][0].lower()}",
                 "a live 3D storefront that opens up for the day and lets you step inside")
    TRY[_g] = ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
               f"Drag the slider on the top picture from closed to open, then try the {TOOL[_g][0].lower()}.",
               "Scroll to watch the shop open up and walk inside, then change the awning color and flip the sign yourself.")
AWN_DEFAULT.update({"dojo": "Red", "jewel": "Navy", "appst": "Navy", "massage": "Green"})


# ---------- Nov 22: coffee shops, gyms, music schools, a photography studio ----------
_B78 = ("cafe", "gym", "music", "photo")
GROUPS.update({
 "cafe": dict(vs=["coffee"], kind="cafe", sign="Coffee", word="Coffee", noun="coffee shop"),
 "gym": dict(vs=["gym"], kind="gym", sign="Fitness", word="Fitness", noun="gym"),
 "music": dict(vs=["music"], kind="music", sign="Music", word="Music", noun="music school"),
 "photo": dict(vs=["photo"], kind="photo", sign="Photography", word="Studio", noun="photography studio"),
})
KGROUP.update({v: g for g in _B78 for v in GROUPS[g]["vs"]}); KIT_V.update(KGROUP)
NAME_OUT.update({
 "cafe": r"roaster|wholesale|supply|mobile|truck|cart|drive.?thru|kiosk",
 "gym": r"crossfit|yoga|boxing|mma\b|martial|physical therapy|rehab|mobile|equipment|supply",
 "music": r"store|repair|rental|supply|records?\b|recording|\bdj\b",
 "photo": r"boudoir|booth|lab\b|print|supply|drone",
})
WORD.update({"coffee": "Coffee", "gym": "Fitness", "music": "Music", "photo": "Photography"})
TRADE.update({"coffee": "Coffee shop", "gym": "Gym", "music": "Music lessons", "photo": "Photography studio"})
SCHEMA.update({"coffee": "CafeOrCoffeeShop", "gym": "ExerciseGym", "music": "EducationalOrganization", "photo": "LocalBusiness"})
# the mix copy promised group orders, results, one-on-one lessons and weddings no listing confirms: every service is an "ask about"
OVERRIDE.update({
 "coffee": {"lede": "A coffee shop in {town}. Stop in, or call to ask what's on today.",
            "services": [("Coffee and espresso", "Your usual, or try something new."), ("Something to eat", "Ask what's on the counter today."),
                         ("Orders for a group", "Ask about coffee for the office or a meeting.")],
            "jobs": ["Order ahead", "Group order", "Question", "Something else"]},
 "gym": {"services": [("Memberships", "Ask what fits your schedule."), ("Training", "Ask about help with a plan."), ("Get started", "New to the gym? Ask about a tour.")]},
 "music": {"services": [("Lessons", "Ask about lessons, instruments and times."), ("Kids and adults", "Ask which ages they teach."), ("First lesson", "Ask about getting started.")]},
 "photo": {"services": [("Portraits", "Ask about family, senior and headshot sessions."), ("Weddings and events", "Ask about weddings and events."),
                        ("Business", "Ask about photos for your business.")],
           "jobs": ["Family photos", "Senior photos", "Headshots", "An event", "Something else"]},
})
THEME.update({
 "cafe": _t("#2f2420", "#3c2e28", "#f7f1e8", "#ece3d5", "#241b17", "#6a5f57", "#ddd2c2", "#b8733a", "#e2a979", "#2f6b4f", "#1a1310", "fraunces", "dmsans"),
 "gym": _t("#1d1f22", "#2a2d31", "#f4f4f1", "#e7e7e3", "#141517", "#62656a", "#d6d6d1", "#d4452f", "#f08a6f", "#2f5fa8", "#0e0f11", "archivo", "dmsans"),
 "music": _t("#2a2440", "#362f52", "#f6f2ea", "#ebe5da", "#1e1a2f", "#655f72", "#dad3c6", "#c9952f", "#e8c27a", "#8a1f2a", "#141123", "fraunces", "dmsans"),
 "photo": _t("#1d1f22", "#2b2e33", "#f6f5f2", "#ebe9e4", "#151618", "#64666b", "#d9d7d1", "#c06a3a", "#e6a27e", "#3a5f8a", "#0f1012", "fraunces", "dmsans"),
})
EXTRA_CSS.update({"cafe": ".hero h1 em,.hero0 h1 em{font-weight:400}", "gym": _UPRIGHT, "music": ".hero h1 em,.hero0 h1 em{font-weight:400}", "photo": ".hero h1 em,.hero0 h1 em{font-weight:400}"})
COPY.update({
 "cafe": dict(svc_h="On the counter", svc_intro="Coffee, espresso and something to go with it. Ask what's on today.",
              quote_h="Order ahead", cta="Ask about an order", msg_ph="What you'd like, how many people, and the time you need it."),
 "gym": dict(svc_h="On the floor", svc_intro="Tell us your goals, and ask about memberships and training.",
             quote_h="Ask about a tour", cta="Ask about a tour", msg_ph="Your goals, your schedule, and any questions about memberships."),
 "music": dict(svc_h="Lessons", svc_intro="Tell us who's learning and what they'd like to play, and ask about times.",
               quote_h="Ask about lessons", cta="Ask about lessons", msg_ph="Who the lessons are for, their age, the instrument and any experience."),
 "photo": dict(svc_h="Sessions", svc_intro="Tell us about the shoot, who's in it and what it's for, and ask about a time.",
               quote_h="Get a shoot quote", cta="Get a shoot quote", msg_ph="The kind of shoot, how many people, and the dates that work."),
})
for g in _B78:
    d = GROUPS[g]
    COPY[g].update(sheet=("A storefront in {town}", "Main street, open for the day"),
                   sheet_label=f"Line drawing of a two-storey brick {d['noun']} on main street with a striped awning and a big display window",
                   shot=(f"{g}-after", f"A brick {d['noun']} storefront with a striped awning, the lights on and the OPEN sign lit", "Illustration. Your real shop photos go here."))
STEPS.update({
 "cafe": [("Tell us what you need", "Your usual, or an order for a group."), ("Get an answer", "Get a call or text back."), ("Pick it up", "Stop in and enjoy.")],
 "gym": [("Tell us your goals", "Stronger, fitter or just getting started."), ("Ask about a tour", "Get a call or text back to set it up."), ("Show up", "Walk the floor and get started.")],
 "music": [("Say who it's for", "The instrument, the age and any experience."), ("Get an answer", "Get a call or text back about lessons."), ("Play your first song", "Come in for a lesson.")],
 "photo": [("Tell us about the shoot", "Who's in it and what it's for."), ("Get an answer", "Get a call or text back about a time."), ("Smile", "Step in front of the lens.")],
})
GLYPH.update({
 "cafe": _G.format("M8 12h14v8a7 7 0 0 1-14 0zM22 14h2a3 3 0 0 1 0 6h-2", "currentColor") + _G.format("M11 8c0-2 2-2 2-4M16 8c0-2 2-2 2-4", "var(--pencil)"),
 "gym": _G.format("M8 10v12M5 13v6M24 10v12M27 13v6", "currentColor") + _G.format("M8 16h16", "var(--pencil)"),
 "music": _G.format("M12 24V8l12-3v16", "currentColor") + _G.format("M12 24a3 2.5 0 1 1-.1 0M24 21a3 2.5 0 1 1-.1 0", "var(--pencil)"),
 "photo": _G.format("M5 10h22v15H5zM12 10l2-3h4l2 3", "currentColor") + _G.format("M16 22a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z", "var(--pencil)"),
})
_I.update({
 "cup": '<path d="M12 22h26v12a11 11 0 0 1-11 11h-4a11 11 0 0 1-11-11z"/><path d="M38 25h3a5 5 0 0 1 0 10h-3"/><path d="M19 15c0-3 3-3 3-6M27 15c0-3 3-3 3-6"/>',
 "croissant": '<path d="M8 36c4-14 36-14 40 0-6-3-10-2-12 2-3-6-13-6-16 0-2-4-6-5-12-2z"/><path d="M22 26l2 10M34 26l-2 10"/>',
 "group": '<circle cx="20" cy="20" r="6"/><circle cx="36" cy="20" r="6"/><path d="M8 46c1-9 6-14 12-14s11 5 12 14"/><path d="M28 46c1-9 4-14 8-14s11 5 12 14"/>',
 "dumbbell": '<path d="M10 22v12M16 17v22M40 17v22M46 22v12"/><path d="M16 28h24"/>',
 "coach": '<circle cx="28" cy="15" r="6"/><path d="M16 48l4-18h16l4 18"/><path d="M20 30l-8-6M36 30l8-6"/>',
 "door": '<path d="M16 8h24v40H16z"/><path d="M34 28h2"/><path d="M8 48h40"/>',
 "note": '<path d="M22 40V12l20-4v28"/><path d="M22 40a5 4 0 1 1-.1 0M42 36a5 4 0 1 1-.1 0"/><path d="M22 20l20-4"/>',
 "play": '<circle cx="28" cy="28" r="18"/><path d="M24 20v16l12-8z"/>',
 "portrait": '<path d="M10 8h36v40H10z"/><circle cx="28" cy="22" r="6"/><path d="M17 42c1-7 5-11 11-11s10 4 11 11"/>',
 "rings": '<circle cx="22" cy="32" r="10"/><circle cx="34" cy="32" r="10"/><path d="M30 14l4-5 4 5-4 4z"/>',
 "case": '<path d="M8 18h40v28H8z"/><path d="M21 18v-6h14v6"/><path d="M8 30h40"/>',
})
SVC_ICON.update({k: _I[v] for k, v in {("cafe", "Coffee and espresso"): "cup", ("cafe", "Something to eat"): "croissant", ("cafe", "Orders for a group"): "group",
                                       ("gym", "Memberships"): "dumbbell", ("gym", "Training"): "coach", ("gym", "Get started"): "door",
                                       ("music", "Lessons"): "note", ("music", "Kids and adults"): "kids", ("music", "First lesson"): "play",
                                       ("photo", "Portraits"): "portrait", ("photo", "Weddings and events"): "rings", ("photo", "Business"): "case"}.items()})
INSIDE.update({
 "cafe": ("Pull up a stool", "An espresso machine on the counter, a pastry case and bistro tables by the wall.", "Inside the coffee shop: an espresso machine on the counter, a pastry case and bistro tables"),
 "gym": ("Walk the floor", "A dumbbell rack, a squat rack, a bench and treadmills facing the mirror.", "Inside the gym: a dumbbell rack, a squat rack with a loaded bar and treadmills facing a mirror"),
 "music": ("Pick it up", "A piano, a drum kit, guitars on the wall and music stands ready.", "Inside the music school: an upright piano, a drum kit and guitars on the back wall"),
 "photo": ("Step in front of the lens", "A paper backdrop, two softboxes, a stool and a camera on a tripod.", "Inside the photography studio: a paper backdrop, two softbox lights and a camera on a tripod"),
})
VISIT.update({"cafe": "From the street to the counter", "gym": "From the street to the floor", "music": "From the street to the lesson", "photo": "From the street to the backdrop"})
TOOL.update({
 "cafe": ("Order helper", "What's the order for?", "Pick what it's for, and know what to mention when you call.",
          "What's it for?", [("me", "Just me", "Ask what's on the counter today."), ("office", "The office", "Mention how many people and the time you need it."),
                             ("meet", "A meeting", "Mention the day, the time and how many cups."), ("q", "A question", "Call or text and ask.")],
          "Ordering for a group? Call ahead.", "A quick guide. The shop will tell you what they can do."),
 "gym": ("Goal finder", "What are your goals?", "Pick your goal, and know what to ask when you call.",
         "What's the goal?", [("strong", "Get stronger", "Ask about strength training."), ("cardio", "Cardio", "Ask what's on the floor for cardio."),
                              ("start", "Just starting", "Ask about a tour first."), ("coach", "A coach", "Ask about training.")],
         "Ask about a tour before you sign up.", "A quick guide. The gym will tell you what fits."),
 "music": ("Lesson finder", "What would you like to play?", "Pick the instrument, and know what to mention when you ask.",
           "Which instrument?", [("piano", "Piano", "Mention the age and any experience."), ("guitar", "Guitar", "Say acoustic or electric, and any experience."),
                                 ("drums", "Drums", "Mention the age and whether there's a kit at home."), ("other", "Something else", "Ask which instruments they teach.")],
           "Ask about a first lesson.", "A quick guide. The teacher will tell you what fits."),
 "photo": ("Shoot planner", "What's the shoot?", "Pick the shoot, and know what to mention for a straight quote.",
           "What kind?", [("family", "Family", "Mention how many people and any pets."), ("senior", "Senior photos", "Mention the season and any spots you like."),
                          ("head", "Headshots", "Mention how many people and where they'll be used."), ("event", "An event", "Mention the date, the place and how long.")],
           "The date and how many people help the studio answer fastest.", "A quick guide, not a quote. The studio will tell you what it takes."),
})
READY.update({
 "cafe": "What it's for, how many people, and the time you need it.",
 "gym": "Your goals, your schedule, and any questions about memberships.",
 "music": "Who the lessons are for, their age, the instrument and any experience.",
 "photo": "The kind of shoot, how many people, and the dates that work.",
})
for _g in _B78:
    TOOLS[_g] = ("Text-the-shop button", f"Before-and-after slider and a{'n' if TOOL[_g][0][0] in 'AEIOU' else ''} {TOOL[_g][0].lower()}",
                 "a live 3D storefront that opens up for the day and lets you step inside")
    TRY[_g] = ("Tap a choice under \"Rather text than call?\" and watch the text write itself.",
               f"Drag the slider on the top picture from closed to open, then try the {TOOL[_g][0].lower()}.",
               "Scroll to watch the shop open up and walk inside, then change the awning color and flip the sign yourself.")
AWN_DEFAULT.update({"cafe": "Green", "gym": "Black", "music": "Plum", "photo": "Black"})
