"""Shared pieces for the flagship shop samples: trade themes, copy, icons, the drawn hero sheet and shop facts.
Facts come only from each shop's Google listing (name, town, phone, rating, review count, listing link, nearby towns).
No prices, hours, years, licenses, guarantees or review quotes anywhere."""
import html
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, "_build/tiers"))
from tiercopy import V, STEPS  # noqa: E402

STEPS = dict(STEPS, body=[("Call or send a few photos", "Tell us the year, make and model, and show where it got hit."),
                          ("Get a straight answer", "Know what the repair takes before any work starts."),
                          ("Drive it home fixed", "Straightened, painted to match and ready to go.")])

E = html.escape
BASE = "/p/2e8e4a/"
SITE = "https://nday27.github.io"
VER = "20261120"

THEME = {
 "lawn": dict(navy="#173322", navy2="#1f4430", paper="#f1f3ec", paper2="#e6eadf", white="#fbfcf8", ink="#14261b", muted="#55635a", line="#d3dacd",
              pencil="#b5d94a", pencil2="#cde77a", blue="#3a7541", barbg="#0c1a11",
              serif='"Fraunces",Georgia,serif', sans='"Instrument Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
              fonts="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..500&family=Instrument+Sans:wght@400..700&display=swap"),
 "tree": dict(navy="#1e2a21", navy2="#2a3a2d", paper="#f3f1ea", paper2="#e9e5d9", white="#fbfaf6", ink="#1b241d", muted="#5c6157", line="#dad6ca",
              pencil="#e3a33b", pencil2="#f0bd63", blue="#83552a", barbg="#121a14",
              serif='"Bricolage Grotesque",system-ui,sans-serif', sans='"Instrument Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
              fonts="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:wght@400..700&display=swap"),
 "painting": dict(navy="#172033", navy2="#22304a", paper="#f5f2ec", paper2="#ebe6dc", white="#fcfbf8", ink="#172033", muted="#596072", line="#dcd7cd",
              pencil="#ef8a5b", pencil2="#f5a882", blue="#3d5a99", barbg="#0e1422",
              serif='"DM Serif Display",Georgia,serif', sans='"DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
              fonts="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400..700&display=swap"),
 "body": dict(navy="#121519", navy2="#1f242b", paper="#f2f1ee", paper2="#e7e5e0", white="#fbfbf9", ink="#121519", muted="#5b6068", line="#d8d6d0",
              pencil="#ff6a3d", pencil2="#ff9a77", blue="#2d6cdf", barbg="#0a0c0f",
              serif='"Archivo",system-ui,sans-serif', sans='"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
              fonts="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"),
 "auto": dict(navy="#15181c", navy2="#22272e", paper="#f2f2ef", paper2="#e6e6e1", white="#fbfbf9", ink="#15181c", muted="#5a6067", line="#d6d6d0",
              pencil="#f2b632", pencil2="#f7cb66", blue="#b3261c", barbg="#0b0d10",
              serif='"Archivo",system-ui,sans-serif', sans='"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
              fonts="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"),
}
# tree's display face has no italic: keep the second headline line upright
EXTRA_CSS = {"tree": ".hero h1 .l2{font-style:normal;font-weight:400}.hero h1{font-weight:700;letter-spacing:-.035em}h1,h2,h3{letter-spacing:-.025em}h2{font-weight:600!important}",
             "lawn": "", "painting": ".hero h1{font-weight:400}h2{font-weight:400!important}",
             "auto": "h1,h2,h3,.strip .n,.mo{font-stretch:112%}.hero h1,.hero0 h1{font-weight:800!important;letter-spacing:-.035em;text-transform:uppercase;line-height:.92}"
                     ".hero h1 .l2,.hero h1 em,.hero0 h1 em{font-style:normal!important;font-weight:800!important}h2{font-weight:700!important;letter-spacing:-.025em}h3{font-weight:700}"
                     ".hero:has(.sheet) h1{font-size:clamp(42px,4vw,56px)}.hero0 h1{font-size:clamp(40px,5.4vw,84px)!important}.hero h1,.hero0 h1{overflow-wrap:break-word}.draw .sign{color:var(--navy)}[hidden]{display:none!important}.draw .l-trim,.draw .l-tire{color:var(--blue)}.draw .l-porch{color:#1d58b8}.dash button{display:grid;justify-items:center;gap:8px;padding:14px 8px!important;min-height:92px!important;font-size:13.5px!important;line-height:1.15}"
                     ".dash{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:26px}.dash svg{width:34px;height:34px;color:#c98a00}.dash button[aria-pressed=true] svg{color:var(--pencil)}"}

# kit groups that differ from the tier templates' groups (an auto body shop gets its own kit, not the repair shop's)
KGROUP = {"autobody": "body"}
SHOPS = ("auto", "body")  # groups that are a shop people drive to, not a crew that comes out


def group_of(v):
    return KGROUP.get(v, V[v]["group"])


TRADE = {"autobody": "Auto body", "lawn": "Lawn care", "landscape": "Landscaping", "tree": "Tree service", "painter": "Painting",
         "auto": "Auto repair", "transmission": "Transmission shop", "radiator": "Radiator shop", "muffler": "Muffler and exhaust", "brake": "Brake shop"}

COPY = {
 "lawn": dict(svc_h="What we take care of", svc_intro="Tell us what the yard needs. If it isn't on the list, ask anyway and get a straight answer.",
              quote_h="Get the yard on the schedule", cta="Get a lawn quote", msg_ph="Yard size, how often, anything to know about the yard.",
              sheet=("A yard in {town}", "Front yard, after"), sheet_label="Line drawing of a farmhouse with a freshly striped front lawn",
              shot=("lawn-after", "A freshly striped front lawn in front of a white farmhouse", "Illustration. Your real job photos go here.")),
 "tree": dict(svc_h="What we handle", svc_intro="Tell us about the tree. If the job isn't on the list, ask anyway and get a straight answer.",
              quote_h="Get a look at the tree", cta="Get a tree quote", msg_ph="How big it is, where it stands, and what's worrying you.",
              sheet=("A yard in {town}", "Trim plan, front"), sheet_label="Line drawing of a big shade tree beside a house, with a trim line keeping the limbs off the roof",
              shot=("tree-after", "A big shade tree trimmed back from a farmhouse roof", "Illustration. Your real job photos go here.")),
 "painting": dict(svc_h="What we paint", svc_intro="Inside or out, tell us what you have in mind. If it isn't on the list, ask anyway.",
              quote_h="Get a painting quote", cta="Get a painting quote", msg_ph="Rooms or the outside, colors you're thinking about, timing.",
              sheet=("A house in {town}", "Exterior repaint"), sheet_label="Line drawing of a farmhouse with roller strokes of new paint across the siding",
              shot=("paint-after", "A farmhouse freshly painted navy with white trim", "Illustration. Your real job photos go here.")),
 "body": dict(svc_h="What we fix", svc_intro="Tell us what happened to it. If the job isn't on the list, ask anyway and get a straight answer.",
              quote_h="Get the damage looked at", cta="Get a body quote", msg_ph="Year, make and model, and where the damage is. Photos help.",
              sheet=("A shop in {town}", "Bay 1, body work"), sheet_label="Line drawing of a two-bay brick body shop with a pickup raised in bay one",
              shot=("body-after", "A red pickup with fresh, glossy paint in front of a brick body shop", "Illustration. Your real shop photos go here.")),
 "auto": dict(svc_h="What we fix", svc_intro="Tell us what it's doing. If the job isn't on the list, ask anyway and get a straight answer.",
              quote_h="Get it on the schedule", cta="Get a repair quote", msg_ph="Year, make and model, and what it's doing.",
              sheet=("A shop in {town}", "Bay 1, up on the lift"), sheet_label="Line drawing of a two-bay brick repair shop with a pickup raised on the lift in bay one",
              shot=("auto-after", "A red pickup parked in front of a brick two-bay repair shop", "Illustration. Your real shop photos go here.")),
}

_I = '<svg class="ic" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{}</svg>'
SVC_ICON = {
 "Mowing": '<path d="M10 40h26l4-10H16z"/><circle cx="16" cy="42" r="4"/><circle cx="34" cy="42" r="4"/><path d="M40 30 48 14"/><path d="M45 14h6"/><path d="M6 50c3-3 5-3 8 0s5 3 8 0 5-3 8 0 5 3 8 0 5-3 8 0"/>',
 "Cleanups": '<path d="M36 8 20 40"/><path d="M12 36l12 8 4-6-12-8z"/><path d="M14 40l-4 6M18 42l-3 6M22 44l-2 6"/><path d="M40 30c5-1 8 2 7 7-5 1-8-2-7-7z"/><path d="M36 44c4-2 8 0 8 4-4 2-8 0-8-4z"/>',
 "Lawn care": '<path d="M8 46h40"/><path d="M14 46c0-10 2-16 6-20M20 46c0-8 4-14 10-18M28 46c0-10-2-16-6-22M34 46c1-9 5-15 11-18M42 46c0-6-1-10-4-14"/><path d="M28 18c0-5 4-8 8-8 0 5-4 8-8 8z"/>',
 "Landscaping": '<path d="M6 46h44"/><path d="M14 46v-8M14 38c-6 0-8-6-4-10 1-5 7-6 9-2 5 0 6 6 2 9-1 2-4 3-7 3z"/><path d="M36 46V30M36 30c-8 0-10-8-5-13 1-6 9-7 12-2 6 1 6 9 1 12-2 2-5 3-8 3z"/><path d="M24 46c2-3 4-3 6 0"/>',
 "Yard projects": '<path d="M6 46h44"/><path d="M12 46l6-14h20l6 14"/><path d="M18 32l2-6h16l2 6"/><path d="M22 46v-7h12v7"/><path d="M28 18v-8M24 14h8"/>',
 "Upkeep": '<path d="M14 42 34 22"/><path d="M42 42 22 22"/><circle cx="14" cy="44" r="5"/><circle cx="42" cy="44" r="5"/><path d="M26 18 34 8M30 18 22 8"/>',
 "Tree removal": '<path d="M20 48h18"/><path d="M26 48V30M32 48V30"/><path d="M29 30c-10 0-14-8-9-15 1-7 11-9 15-3 8 1 9 11 3 15-3 2-6 3-9 3z"/><path d="M10 34l10 4M10 38l9 2"/><path d="M40 44l8-8"/>',
 "Trimming and pruning": '<path d="M8 20c12 0 22 4 30 14"/><path d="M22 22c2-6 7-8 12-7M30 27c4-3 9-3 12 0"/><path d="M38 34l8 12M46 34l-8 12"/><circle cx="37" cy="47" r="3"/><circle cx="47" cy="47" r="3"/>',
 "Storm cleanup": '<path d="M14 22a8 8 0 0 1 8-10 10 10 0 0 1 18 2 7 7 0 0 1 2 14H16a6 6 0 0 1-2-6z"/><path d="M28 30l-4 8h6l-4 8"/><path d="M8 48c8-4 18-2 26 0 6 1 10 0 14-2"/>',
 "Interior painting": '<rect x="10" y="10" width="30" height="12" rx="2"/><path d="M40 16h6v10H25v8"/><rect x="22" y="34" width="6" height="14" rx="1.5"/>',
 "Exterior painting": '<path d="M6 28 24 14l18 14"/><path d="M10 25v21h28V25"/><path d="M20 46V35h8v11"/><path d="M42 10l6 6-12 12-6-6z"/><path d="M30 22l-4 4"/>',
 "Prep and repair": '<path d="M10 40 30 20l8 8-20 20H10z"/><path d="M30 20l6-6 8 8-6 6"/><path d="M16 46h28"/><path d="M42 36c3 0 5 2 5 5"/>',
 "Repairs": '<path d="M38 10a10 10 0 0 0-12 13L10 39a4.2 4.2 0 0 0 6 6l16-16a10 10 0 0 0 13-12l-7 7-6-1-1-6z"/>',
 "Truck repair": '<path d="M38 10a10 10 0 0 0-12 13L10 39a4.2 4.2 0 0 0 6 6l16-16a10 10 0 0 0 13-12l-7 7-6-1-1-6z"/>',
 "Maintenance": '<path d="M12 44h26a4 4 0 0 0 4-4V26l-8-10H20"/><path d="M12 44V20h14"/><path d="M34 16l8-6 4 4-6 8"/><path d="M24 28c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z"/>',
 "Service": '<path d="M12 44h26a4 4 0 0 0 4-4V26l-8-10H20"/><path d="M12 44V20h14"/><path d="M34 16l8-6 4 4-6 8"/><path d="M24 28c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z"/>',
 "Diagnostics": '<path d="M12 22v16h8l4 4h14v-6h4V24h-4v-4H28v-4h-8v4z"/><path d="M6 26v8M48 26v8M20 12h10"/><path d="M27 26l-4 6h6l-4 6"/>',
 "Inspections": '<rect x="12" y="10" width="26" height="36" rx="3"/><path d="M20 10V7h10v3"/><path d="M18 22l3 3 5-6M18 34l3 3 5-6M30 23h4M30 35h4"/>',
 "Transmission repair": '<circle cx="28" cy="28" r="9"/><circle cx="28" cy="28" r="3"/><path d="M28 10v8M28 38v8M10 28h8M38 28h8M15 15l6 6M35 35l6 6M41 15l-6 6M21 35l-6 6"/>',
 "Radiator repair": '<rect x="10" y="14" width="36" height="28" rx="3"/><path d="M18 14v28M24 14v28M30 14v28M36 14v28"/><path d="M16 14V9h8M40 42v5"/>',
 "Cooling system": '<path d="M28 8v24"/><circle cx="28" cy="38" r="8"/><path d="M28 8a4 4 0 0 1 4 4v19M24 31V12a4 4 0 0 1 4-4"/><path d="M38 14h6M38 20h4M38 26h6"/>',
 "Mufflers": '<rect x="14" y="18" width="26" height="18" rx="9"/><path d="M4 27h10M40 27h8"/><path d="M48 23v8"/><path d="M22 18v18M32 18v18"/>',
 "Exhaust systems": '<path d="M6 34h14l6-10h10l4 6h10"/><rect x="24" y="20" width="14" height="10" rx="5" transform="rotate(0)"/><path d="M50 26v8"/><path d="M12 34v6M30 30v8"/>',
 "Brakes": '<circle cx="28" cy="28" r="17"/><circle cx="28" cy="28" r="6"/><path d="M28 14v3M28 39v3M14 28h3M39 28h3"/><path d="M40 12a22 22 0 0 1 6 12"/>',
 "Collision repair": '<path d="M6 38h6l4-10h18l8 8h6v8H6z"/><circle cx="16" cy="44" r="4"/><circle cx="40" cy="44" r="4"/><path d="M44 30l4-6M47 34l6-2M42 26l1-7"/>',
 "Dents and scratches": '<path d="M8 40c6-2 10-8 20-8s14 6 20 8"/><path d="M8 46h40"/><path d="M14 22l12-6M18 26l14-7M24 28l10-5"/>',
 "Paint": '<path d="M14 18h16v10H14z"/><path d="M30 21h6l4-4M22 28v6h-4v12h8V34"/><path d="M42 12c1 2 1 3 0 4M46 10c2 3 2 6 0 9M38 14c0 1 0 2-1 3"/>',
 "_more": '<path d="M10 12h36v24H24l-10 8v-8h-4z"/><path d="M20 22h16M20 28h10"/>',
}
GLYPH = {  # logo marks on a 32px box, drawn with the accent and the ink
 "lawn": '<path d="M5 26h22" stroke="currentColor" stroke-width="2.6"/><path d="M8 26c0-7 1.6-11 4-14M14.5 26c0-9 2-14 5.5-17M21 26c.4-6 2.4-9.5 5-11" fill="none" stroke="var(--pencil)" stroke-width="2.6" stroke-linecap="round"/>',
 "tree": '<path d="M16 28V17" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M16 4 7 17h18z" fill="none" stroke="var(--pencil)" stroke-width="2.6" stroke-linejoin="round"/><path d="M16 11 10 21h12z" fill="var(--pencil)"/>',
 "painting": '<rect x="4" y="5" width="20" height="8" rx="2" fill="none" stroke="var(--pencil)" stroke-width="2.6"/><path d="M24 9h4v7H16v5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 21v7" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
 "body": '<path d="M5 12h12v8H5z" fill="none" stroke="var(--pencil)" stroke-width="2.4" stroke-linejoin="round"/><path d="M17 15h5l3-3M11 20v4H8v5h6v-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M27 8c1 1.5 1 3 0 4.5M30 6c1.6 2.6 1.6 5.4 0 8" fill="none" stroke="var(--pencil)" stroke-width="2" stroke-linecap="round"/>',
 "auto": '<path d="M24 5a7.5 7.5 0 0 0-9.2 9.8L4.6 25a3.2 3.2 0 0 0 4.5 4.5l10.2-10.2A7.5 7.5 0 0 0 29 10l-5 5-4.2-.8-.8-4.2z" fill="none" stroke="var(--pencil)" stroke-width="2.4" stroke-linejoin="round"/><circle cx="7" cy="27" r="1.2" fill="currentColor"/>',
}
IC = {
 "PHONE_ICON": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/></svg>',
 "CHECK": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
 "CONTACT_ICON": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7.5 17.5a5 5 0 0 1 9 0"/></svg>',
 "MSG_ICON": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
 "ARROW": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 "PIN": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
 "STARS": ''.join('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.8 2.8 6 6.5.6-4.9 4.3 1.5 6.4L12 16.8 6.1 20.1l1.5-6.4L2.7 9.4l6.5-.6z"/></svg>' for _ in range(5)),
 "PLUS": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
}


def theme_vars(g):
    t = THEME[g]
    return "".join(f"--{k}:{t[k]};" for k in ("navy", "navy2", "paper", "paper2", "white", "ink", "muted", "line", "pencil", "pencil2", "blue", "barbg", "serif", "sans"))


def logo(g):
    return f'<svg viewBox="0 0 32 32" aria-hidden="true">{GLYPH[g]}</svg>'


def favicon(g):
    t = THEME[g]
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='{t['navy']}'/>{GLYPH[g].replace('currentColor', '#fff').replace('var(--pencil)', t['pencil'])}</svg>"
    return "data:image/svg+xml," + re.sub(r"[<>#\"]", lambda m: {"<": "%3C", ">": "%3E", "#": "%23", '"': "'"}[m.group()], svg)


STATE_NAME = {"IL": "Illinois", "MO": "Missouri", "IN": "Indiana", "KY": "Kentucky", "OH": "Ohio", "MI": "Michigan", "WI": "Wisconsin",
              "MN": "Minnesota", "IA": "Iowa", "KS": "Kansas", "NE": "Nebraska", "OK": "Oklahoma", "TX": "Texas", "AR": "Arkansas",
              "LA": "Louisiana", "MS": "Mississippi", "AL": "Alabama", "TN": "Tennessee", "GA": "Georgia", "SC": "South Carolina",
              "NC": "North Carolina", "VA": "Virginia", "PA": "Pennsylvania", "CA": "California", "OR": "Oregon", "WA": "Washington",
              "CO": "Colorado", "MA": "Massachusetts", "NY": "New York", "NJ": "New Jersey", "FL": "Florida", "AZ": "Arizona", "NM": "New Mexico",
              "UT": "Utah", "NV": "Nevada", "ID": "Idaho", "MT": "Montana", "WY": "Wyoming", "ND": "North Dakota", "SD": "South Dakota",
              "WV": "West Virginia", "MD": "Maryland", "DE": "Delaware", "CT": "Connecticut", "RI": "Rhode Island", "VT": "Vermont",
              "NH": "New Hampshire", "ME": "Maine", "AK": "Alaska", "HI": "Hawaii"}


def st(s):
    """Two-letter state; shops.json carries `st` only for leads outside Illinois."""
    return s.get("st") or "IL"


def state(s):
    return STATE_NAME.get(st(s), st(s))


def tel(p):
    return "+1" + re.sub(r"\D", "", p)[-10:]


def poss(n):
    return n + ("'" if n.endswith("s") else "'s")


def rating_ok(s):
    return bool(s.get("rating") and s.get("reviews") and s["rating"] >= 4.5)


def rnum(s):
    return f'{s["rating"]:.1f}'


def towns(s):
    t = [x for x in (s.get("towns") or []) if x != s["town"]]
    return [s["town"]] + t[:8]


# ---------- the drawn hero sheet ----------

def _stripes():
    out, i = [], 0
    for x in range(-40, 1420, 64):
        d = "d" if i % 2 else ""
        out.append(f'<path class="stripe {d}" style="--w:{2.2 + i * .05:.2f}s" d="M{x} 648L{x + 64} 648L{x + 4} 760L{x - 60} 760Z"/>')
        i += 1
    return "".join(out)


def _rolls():
    out, i = [], 0
    for x in range(104, 850, 60):
        out.append(f'<path class="roll" stroke-width="54" pathLength="1" style="--w:{2.3 + i * .09:.2f}s;--d:.55s" d="M{x} 232V578"/>'); i += 1
    for x in range(880, 1300, 60):
        out.append(f'<path class="roll" stroke-width="54" pathLength="1" style="--w:{2.3 + i * .09:.2f}s;--d:.45s" d="M{x} 420V598"/>'); i += 1
    return "".join(out)


def _cloud(cx, cy, rx, ry, n, seed, bump=.16):
    pts = []
    for k in range(n):
        a = k / n * math.tau
        r = 1 + bump * math.sin(seed + k * 2.3) * .6
        pts.append((cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for k in range(n):
        a, b = pts[k], pts[(k + 1) % n]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        ox, oy = mx - cx, my - cy; L = math.hypot(ox, oy) or 1
        c = (mx + ox / L * 26, my + oy / L * 26)
        d += f"Q{c[0]:.1f} {c[1]:.1f} {b[0]:.1f} {b[1]:.1f}"
    return d


def _tree():
    trunk = "M-232 640C-226 560-222 470-214 380M-178 640C-184 560-190 470-192 380M-246 640H-164"
    limbs = ("M-214 380C-236 330-262 290-300 250M-205 384C-200 320-205 270-198 210M-192 380C-170 330-140 300-96 270"
             "M-198 210C-210 170-230 140-250 120M-198 215C-180 170-160 140-130 118M-300 250C-330 230-350 210-362 190")
    keep = "M-150 300C-110 260-60 225 40 196"
    gone = "M40 196C110 176 170 168 236 172M120 182C140 150 160 132 190 120"
    canopy = _cloud(-205, 200, 205, 170, 15, 1.3)
    over = _cloud(205, 150, 70, 46, 7, 2.1, .1)
    return (f'<g class="ov">'
            f'<path class="l-wall" stroke-width="4" pathLength="1" style="--w:.3s;--d:1.2s" d="{trunk}"/>'
            f'<path class="l-roof" stroke-width="3" pathLength="1" style="--w:.9s;--d:1.2s" d="{limbs}"/>'
            f'<path class="l-trim" stroke-width="3.4" pathLength="1" style="--w:1.4s;--d:1.6s" d="{canopy}"/>'
            f'<path class="l-porch" stroke-width="3" pathLength="1" style="--w:1.6s;--d:.8s" d="{keep}"/>'
            f'<path class="gone" stroke-width="3" pathLength="1" style="--w:2.2s;--d:.8s" d="{gone}"/>'
            f'<path class="gone" stroke-width="2.6" pathLength="1" style="--w:2.4s;--d:1s" d="{over}"/>'
            f'<path class="trimline" stroke-width="4" style="--w:2.9s" d="M40 30V600"/>'
            f'<g class="note" style="--w:3.1s"><text x="-205" y="690" text-anchor="middle" style="font-size:40px">Trim line keeps limbs off the roof</text></g></g>')


def sign_text(svg, name):
    """Letter the shop's own name on the drawn sign band, squeezed to fit."""
    m = re.search(r'data-w="(\d+)" data-h="(\d+)">{{SIGN}}', svg)
    w, h = int(m.group(1)), int(m.group(2)); t = name.upper(); fs = h * .56
    est = len(t) * fs * .66
    fit = f' textLength="{w * .9:.0f}" lengthAdjust="spacingAndGlyphs"' if est > w * .9 else ""
    return svg.replace("{{SIGN}}", f'<text x="{w / 2:.0f}" y="{h * .7:.0f}" text-anchor="middle" style="font:800 {fs:.0f}px var(--serif);font-stretch:100%"{fit}>{E(t)}</text>')


def elevation(g, s=None):
    if g == "office":  # a cleaning team's client: an office block on main street
        svg = open(os.path.join(HERE, "elev-store.svg")).read().replace("Awning out, door open", "Every desk, every floor")
        return sign_text(svg, "Offices")
    if g in STORES:
        svg = open(os.path.join(HERE, "elev-store.svg")).read()
        return sign_text(svg, s["short"] if s else store.GROUPS[g]["sign"])
    if g in SHOPS:
        svg = open(os.path.join(HERE, "elev-auto.svg")).read()
        if g == "body":
            svg = svg.replace("Bay 1: up on the lift", "Bay 1: body work")
        return sign_text(svg, s["short"] if s else "Auto Repair")
    svg = open(os.path.join(HERE, "elev.svg")).read()
    svg = svg.replace('class="draw"', 'class="draw" role="img"', 1).replace(' aria-hidden="true"', "", 1)
    if g == "lawn":
        svg = re.sub(r'<g class="dim".*?</g>', "", svg, flags=re.S)
        svg = svg.replace('viewBox="0 0 1352 713" width="1352" height="713"', 'viewBox="0 0 1352 770" width="1352" height="770"')
        i = svg.index("<path"); svg = svg[:i] + '<clipPath id="yard"><rect x="0" y="600" width="1352" height="170"/></clipPath><g clip-path="url(#yard)">' + _stripes() + "</g>" + svg[i:]
        svg = svg.replace("</svg>", '<g class="note" style="--w:3.2s"><text x="1340" y="745" text-anchor="end">cut, striped, edged</text></g></svg>')
    elif g == "tree":
        svg = re.sub(r'<g class="dim".*?</g>', "", svg, flags=re.S)
        svg = svg.replace('viewBox="0 0 1352 713" width="1352" height="713"', 'viewBox="-400 0 1752 713" width="1752" height="713"')
        svg = svg.replace("</svg>", _tree() + "</svg>")
    elif g in HOMES:
        svg = re.sub(r'<g class="dim".*?</g>', "", svg, flags=re.S)
        note = {"wash": "siding and drive, washed", "concrete": "new drive, poured and jointed", "hvac": "new unit on the pad, lines to the wall", "plumb": "water line dug, fixed and sodded", "handy": "gutter up, new step, list done", "clean": "every room, top to bottom", "stump": "stump out, grass back", "office": "every desk, every floor", "tow": "loaded up, ready to roll", "engine": "fixed and back on the lawn", "weld": "welded, painted, hung true", "carpet": "every room, every fiber", "roof": "old roof off, new roof on"}[g]
        svg = svg.replace("</svg>", f'<g class="note" style="--w:3.2s"><text x="1340" y="700" text-anchor="end">{note}</text></g></svg>')
    else:
        i = svg.index("<path"); svg = svg[:i] + _rolls() + svg[i:]
    return svg


# ---------- shop facts ----------

def load_shops():
    shops = json.load(open(os.path.join(ROOT, "_build/tiers/shops.json")))
    # dealt HQ leads (in calling/interested) live in their own file; they get the kit too
    shops += json.load(open(os.path.join(ROOT, "_build/tiers/dealt.json")))
    final = json.load(open(os.path.join(HERE, "shops.json")))
    own = {x["slug"]: x["owner"] for x in final}
    vov = {x["slug"]: x["v"] for x in final if x.get("v")}
    # capitals only, same words as the Google listing ("Shaun's fab llc" reads as a typo on a headline)
    nov = {x["slug"]: x["name"] for x in final if x.get("name")}
    import importlib.util
    spec = importlib.util.spec_from_file_location("tiers_build", os.path.join(ROOT, "_build/tiers/build.py"))
    tb = importlib.util.module_from_spec(spec); spec.loader.exec_module(tb)
    nice_name, short_name = tb.nice_name, tb.short_name
    out = []
    for s in shops:
        if s["slug"] not in own:
            continue
        s = dict(s)
        s["owner"] = own[s["slug"]]
        s["v"] = vov.get(s["slug"], s["v"])  # e.g. a stump grinder listed as a tree service gets the stump variant
        s["name"] = nice_name(nov.get(s["slug"], s["name"]))
        s["short"] = short_name(s["name"])
        s["tel"] = tel(s["phone"])
        out.append(s)
    return out


def fill(src, vals):
    for k, v in list(vals.items()) + list(IC.items()):
        src = src.replace("{{" + k + "}}", v)
    left = re.findall(r"{{[A-Z0-9_]+}}", src)
    if left:
        raise SystemExit(f"unfilled {sorted(set(left))}")
    return src


def count_script(key):
    k = re.sub(r"[^A-Za-z0-9-]", "-", key)[:60]
    return ('<script>(function(){try{if(location.hash==="#nc")try{localStorage.setItem("nds_nc","1")}catch(e){}'
            'var s=null;try{s=localStorage.getItem("nds_nc")}catch(e){}if(navigator.webdriver||s)return;'
            f'fetch("https://abacus.jasoncameron.dev/hit/ndstudio/{k}",{{keepalive:true}}).catch(function(){{}})}}catch(e){{}}}})();</script>')


def bar(s, tier):
    u = BASE + s["slug"] + "/"
    cur = {300: "", 750: "750/", 1250: "1250/"}
    ac = ' aria-current="page"'
    links = "".join(f'<a href="{u}{cur[t]}"{ac if t == tier else ""}><span class="nm">{n}</span><span>{p}</span></a>'
                    for t, n, p in ((300, "Starter", "$300"), (750, "Signature", "$750"), (1250, "Immersive", "$1,250")))
    return (f'<div class="hb-bar" role="region" aria-label="Sample site notice"><p class="note"><b>Sample site</b><span class="long"> for {E(s["short"])} by Nolan Day Studio.</span> '
            f'<a href="/meet/?s={s["slug"]}">See all 3 plans</a></p><nav class="hb-plans" aria-label="Plan versions">{links}</nav></div>')


def ldjson(s):
    typ = store.SCHEMA.get(s["v"]) or home.SCHEMA.get(s["v"]) or {"painting": "HousePainter", "auto": "AutoRepair", "body": "AutoBodyShop"}.get(s["group"], "HomeAndConstructionBusiness")
    d = {"@context": "https://schema.org", "@type": typ, "name": s["name"], "telephone": s["tel"],
         "address": {"@type": "PostalAddress", "addressLocality": s["town"], "addressRegion": st(s), "addressCountry": "US"},
         "areaServed": [t + " " + st(s) for t in towns(s)]}
    return json.dumps(d, ensure_ascii=False).replace("</", "<\\/")


def cfg(s, tier):
    v = V[s["v"]]
    d = {"tier": tier, "group": s["group"], "v": s["v"], "name": s["name"], "short": s["short"], "town": s["town"], "st": st(s), "phone": s["phone"], "tel": s["tel"],
         "jobs": v["jobs"], "when": v["when"]}
    return json.dumps(d, ensure_ascii=False).replace("</", "<\\/")


def fill_partial(src, vals):
    for k, v in vals.items():
        src = src.replace("{{" + k + "}}", v)
    return src

EXTRA_CSS["body"] = EXTRA_CSS["auto"] + (
    ".car{position:relative;margin-top:22px;border:1px solid var(--line);border-radius:18px;background:var(--white);padding:14px 10px 6px}"
    ".car svg{display:block;width:100%;height:auto;color:var(--muted)}.car .zone{fill:var(--pencil);opacity:0;transition:opacity .25s}.car .zone.on{opacity:.38}"
    ".car .hs{position:absolute;transform:translate(-50%,-50%);min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--white);font:600 13px/1 var(--sans);cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 6px 16px -8px #0004}"
    ".car .hs i{width:8px;height:8px;border-radius:50%;background:var(--pencil)}.car .hs[aria-pressed=true]{background:var(--navy);border-color:var(--navy);color:#fff}"
    "@media (max-width:520px){.car .hs{font-size:12px;padding:0 9px;min-height:32px}}")


# ---------- storefront groups (store.py) ----------
import store  # noqa: E402
THEME.update(store.THEME); COPY.update(store.COPY); GLYPH.update(store.GLYPH); TRADE.update(store.TRADE); KGROUP.update(store.KGROUP); STEPS.update(store.STEPS)
SVC_ICON.update(store.SVC_ICON)
for _g, _c in store.EXTRA_CSS.items():
    EXTRA_CSS[_g] = (EXTRA_CSS["auto"] if _c is None else _c) + store.QUIZ_CSS
for _v, _o in store.OVERRIDE.items():
    V[_v].update(_o)
STORES = tuple(store.GROUPS)
SHOPS = SHOPS + STORES
KIT_V_EXTRA = dict(store.KIT_V)
NAME_OUT_EXTRA = dict(store.NAME_OUT)
V.update(store.V_NEW)

# ---------- home-service groups on the Harlow house (home.py) ----------
import home  # noqa: E402
V.update(home.V_NEW)
THEME.update(home.THEME); COPY.update(home.COPY); GLYPH.update(home.GLYPH); TRADE.update(home.TRADE); KGROUP.update(home.KGROUP); STEPS.update(home.STEPS)
SVC_ICON.update(home.SVC_ICON)
for _g, _c in home.EXTRA_CSS.items():
    EXTRA_CSS[_g] = (EXTRA_CSS["auto"] if _c is None else _c) + home.QUIZ_CSS
HOMES = tuple(home.GROUPS)


def svc_icon(g, h):
    """Service icon, group-specific first (two trades can both list "Repairs")."""
    return SVC_ICON.get((g, h)) or SVC_ICON.get(h, SVC_ICON["_more"])
QUIZ = STORES + HOMES  # groups whose Signature tool is the two-question quiz
KIT_V_EXTRA.update(home.KIT_V)
NAME_OUT_EXTRA.update(home.NAME_OUT)
