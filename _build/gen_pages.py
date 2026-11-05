#!/usr/bin/env python3
"""Generate the town, trade and guide landing pages for nday27.github.io.

Run from the repo root:  python3 _build/gen_pages.py
Every page uses the published prices only. Never add reviews, client counts or results.
"""
import html
import json
import os
import sys
from urllib.parse import quote

SITE = "https://nday27.github.io"
EMAIL = "hanbackj1@gmail.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Nolan Day Studio">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Figtree:wght@400;600;700&display=swap">
<link rel="stylesheet" href="/assets/site.css">
{schema}
</head>
<body>
<div class="navbar"><nav><a class="brand" href="/">Nolan Day <span>Studio</span></a><a class="pill" href="{start}">Free preview</a></nav></div>
<main class="wrap">
"""

FOOT = """
<h2>More from the studio</h2>
<ul class="links">
{links}
</ul>
</main>
<footer class="wrap"><span>© 2026 Nolan Day Studio · Morton, IL · websites for small businesses, all by email</span><span><a href="mailto:{email}">{email}</a></span></footer>
</body>
</html>
"""

TOWNS = [
    ("morton", "Morton", "the Pumpkin Capital, and my home town",
     ["Morton", "Tremont", "Deer Creek", "Mackinaw", "Groveland"],
     "I live in Morton, so if you'd rather sit down and look at your preview together, I can come to you."),
    ("peoria", "Peoria", "the biggest market in the area",
     ["Peoria", "Peoria Heights", "Bartonville", "Bellevue", "Dunlap"],
     "Peoria is a short drive from Morton, so we can meet in person if you'd like, or do the whole thing by email."),
    ("east-peoria", "East Peoria", "right across the river",
     ["East Peoria", "Creve Coeur", "Groveland", "Germantown Hills", "Metamora"],
     "East Peoria is next door to Morton, so meeting in person is easy if you'd like, or we can do everything by email."),
    ("pekin", "Pekin", "Tazewell County's biggest city",
     ["Pekin", "Marquette Heights", "North Pekin", "South Pekin", "Tremont"],
     "Pekin is just down the road from Morton, so meeting in person is easy if you'd like, or we can keep it all to email."),
    ("washington", "Washington", "just east of Peoria",
     ["Washington", "Sunnyland", "Metamora", "Germantown Hills", "Eureka"],
     "Washington is a few minutes from Morton, so I can meet you in person if you'd like, or we can keep it to email."),
    ("bloomington-normal", "Bloomington-Normal", "a busy twin-city market",
     ["Bloomington", "Normal", "Downs", "Hudson", "Heyworth"],
     "Bloomington-Normal is within driving distance of Morton for an in-person look at your preview, though most owners just do it by email."),
]

# slug, name, plural noun, what customers want, sections, phone angle, sample (path,label) or None, faq list
TRADES = [
    ("hvac", "HVAC", "HVAC companies",
     "When the furnace quits in January or the AC dies in July, people search, tap the first number that looks trustworthy, and call. If nobody answers, they call the next one.",
     ["Heating, cooling and maintenance services with clear names", "Your service area as a list of towns", "Emergency or after-hours line, if you offer one", "Brands you service and any maintenance plan", "A tap-to-call bar that stays on screen", "A short quote or service request form"],
     "No-heat calls come in at night and on weekends. Phone Desk answers the calls you miss, takes the address and the problem, and sends you a summary so you can call back first.",
     ("samples/oak-ridge-builders/", "Oak Ridge Builders sample"),
     [("Do I need a separate page for each service?", "Not at the start. A one-page Starter Site with clear sections for heating, cooling and maintenance covers it. Separate service pages come with the Launch plan if you want to rank for more searches."),
      ("Can it show financing?", "Yes, if you offer it. I'll add a short note and a link to your financing partner's page; I won't state rates or terms you haven't given me in writing.")]),
    ("plumbers", "Plumbing", "plumbers",
     "A burst pipe or a backed-up drain means a homeowner wants one thing: a plumber who picks up and can come today. Your site has to show your number, your area and that you handle their problem in about five seconds.",
     ["Repairs, drains, water heaters and remodel work in plain words", "Towns you cover", "Emergency availability, stated honestly", "License number, if you want it shown", "Tap-to-call at the top and bottom", "A request form for non-urgent jobs"],
     "Plumbing calls come while you're under a sink. Phone Desk answers when you can't, gets the address and the problem, and sends you a summary to call back.",
     ("samples/oak-ridge-builders/", "Oak Ridge Builders sample"),
     [("I get most work from referrals. Why bother?", "People you're referred to still look you up before they call. A clean site with your number and services confirms they've got the right plumber."),
      ("Can you add my reviews?", "I can link to your Google reviews so people read them there. I never write, copy or invent reviews.")]),
    ("roofers", "Roofing", "roofers",
     "Roofing jobs are big tickets, so homeowners compare. They look for photos of finished roofs, the materials you use, and an easy way to ask for an estimate.",
     ["Before and after photos of your real jobs", "Replacement, repair and storm work, explained simply", "Materials and brands you install", "Your service area", "A free-estimate request form", "Insurance-claim help, only if you actually offer it"],
     "After a storm your phone gets busy fast. Phone Desk answers the overflow, takes the address and what's damaged, and sends you the list so no estimate request slips through.",
     ("samples/oak-ridge-builders/", "Oak Ridge Builders sample"),
     [("Can you show my job photos?", "Yes. Send 5 to 15 photos of real jobs and I'll build a gallery. I don't use stock photos of other people's roofs as if they were yours."),
      ("Do you do storm-chasing style ads?", "No. The site states what you do and where; no fake urgency or countdowns.")]),
    ("electricians", "Electrical", "electricians",
     "People hiring an electrician want to know you're licensed, that you do their kind of job, and how fast they can reach you. Most of them are on a phone.",
     ["Residential and commercial work, listed separately", "Panel upgrades, EV chargers, generators, lighting, whatever you actually do", "License and insurance details you choose to show", "Service area", "Tap-to-call and a short request form"],
     "If you're on a job and can't pick up, Phone Desk answers, asks what they need done and where, and sends you a summary.",
     ("samples/oak-ridge-builders/", "Oak Ridge Builders sample"),
     [("Can you list EV charger installs?", "Yes, if you do them. Each service you offer gets a short plain-language line so searchers know you handle it.")]),
    ("auto-repair", "Auto repair", "auto repair shops",
     "Drivers with a check-engine light want three things: do you fix my problem, when are you open, and how do I get there. A shop with no website loses those people to the shop that has one.",
     ["Services you do (brakes, diagnostics, tires, oil changes, and so on)", "Hours and a map link", "Starting prices if you want to show them", "A link to your Google reviews", "Tap-to-call and a request-an-appointment button"],
     "When the bays are full nobody can grab the phone. Phone Desk answers, takes the car, the problem and a callback number, and sends you the summary.",
     ("samples/riverbend-mobile-detail/", "Riverbend Mobile Detail sample"),
     [("I already have a Google listing. Isn't that enough?", "It helps a lot. A website on your own name backs it up, shows your full service list, and gives Google more to go on. The Starter Site includes a Google listing fix-up.")]),
    ("cleaning", "Cleaning", "cleaning businesses",
     "People hiring a cleaner are letting someone into their home or office. They want to see what's included, rough prices, the area you cover and an easy way to book.",
     ["House, move-out and office cleaning, each described", "What a standard clean includes", "Starting prices or how you quote", "Towns you cover", "A request-a-quote form and tap-to-call"],
     "Most new customers call while you're cleaning. Phone Desk answers, takes the size of the place and the date they want, and sends it to you.",
     ("samples/maple-street-cleaning/", "Maple Street Cleaning sample"),
     [("Can people book online?", "With the Launch plan and up, yes. On the Starter Site they send a request with the date they want and you confirm.")]),
    ("lawn-care", "Lawn care", "lawn care and landscaping companies",
     "Every spring, homeowners search for mowing, cleanups and landscaping, and they pick whoever shows a clear service list, the area covered and a quick way to ask for a quote.",
     ["Mowing, cleanups, mulch, landscaping, snow removal", "Seasonal plans, if you offer them", "Your service area", "Photos of your real work", "A quote form and tap-to-call"],
     "Spring is when the phone rings while you're on the mower. Phone Desk answers, gets the address and what they want done, and sends it to you.",
     ("samples/prairie-lawn-co/", "Prairie Lawn Co. sample"),
     [("Can the site mention snow removal in winter?", "Yes. I can swap the top section by season so the site always leads with what you're selling now; small edits are part of the monthly plan.")]),
    ("tree-service", "Tree service", "tree service companies",
     "Tree work is expensive and a bit scary, so homeowners look for proof: photos of jobs, insurance, and a clear way to get an estimate. Storm damage brings urgent searches.",
     ["Removal, trimming, stump grinding and storm cleanup", "Insurance details you choose to show", "Photos of real jobs", "Service area", "A free-estimate form and tap-to-call"],
     "After a storm, Phone Desk answers the calls you can't get to, takes the address and what fell, and sends you the list in order.",
     ("samples/prairie-lawn-co/", "Prairie Lawn Co. sample"),
     [("Do you offer emergency messaging on the site?", "If you take emergency jobs, the site says so plainly with your number. If you don't, it won't pretend you do.")]),
]


def esc(s):
    return html.escape(s, quote=True)


def mailto(subject, src):
    body = "Business name: \nTown: \nPhone: \nWhat kind of work you do: \n\n(from " + src + ")"
    return "mailto:%s?subject=%s&amp;body=%s" % (EMAIL, quote(subject), quote(body))


def start_link(src):
    return "/?src=%s#start" % src


def faq_schema(faqs):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}


def service_schema(name, area_names, url):
    return {"@context": "https://schema.org", "@type": "ProfessionalService", "name": "Nolan Day Studio",
            "url": SITE + "/", "email": EMAIL, "image": SITE + "/img/og.png",
            "description": name,
            "address": {"@type": "PostalAddress", "addressLocality": "Morton", "addressRegion": "IL", "addressCountry": "US"},
            "areaServed": [{"@type": "City", "name": a + ", IL"} for a in area_names] if area_names else {"@type": "Country", "name": "United States"},
            "priceRange": "$99/mo–$1,500",
            "mainEntityOfPage": url}


def schema_tags(*objs):
    return "\n".join('<script type="application/ld+json">%s</script>' % json.dumps(o, ensure_ascii=False) for o in objs)


def offers(src):
    return """
<h2>Two ways to start</h2>
<div class="grid">
  <div class="card offer hot"><span class="tag">Easiest start</span><h3 style="margin-top:8px">Starter Site</h3><div class="p">$99 <small>/ month, $0 down</small></div>
    <ul><li>One-page site on your own business name, built for phones</li><li>Tap-to-call, services, area and hours</li><li>Google listing fix-up included</li><li>Hosting and small edits handled</li><li>You see it before you pay. Cancel any time.</li></ul>
    <p class="fine">Prefer to own it outright? The Essential site is $300 one time.</p>
    <a class="btn" href="{m1}">Get my free preview</a></div>
  <div class="card offer"><span class="tag">For missed calls</span><h3 style="margin-top:8px">Phone Desk</h3><div class="p">$197 <small>/ month, founding price</small></div>
    <ul><li>An AI receptionist for missed and after-hours calls forwarded from your number</li><li>Takes the name, number, address and job</li><li>Every call summarized to your phone or email</li><li>Founding price with setup included for the first 3 businesses, then $297 a month plus $497 setup</li></ul>
    <a class="btn ghost" href="{m2}">Ask about Phone Desk</a></div>
</div>
<p class="fine" style="margin-top:12px">Bigger plans with booking, chat and review requests: <a href="/#plans">see all plans and prices</a>. All prices in USD. I never promise rankings or a number of customers.</p>
""".format(m1=mailto("Starter Site free preview", src), m2=mailto("Phone Desk question", src))


def related(current):
    items = []
    for slug, name, *_ in TOWNS:
        href = "/websites/%s-il/" % slug
        if href != current:
            items.append('<li><a href="%s">Websites in %s</a></li>' % (href, esc(name)))
    for t in TRADES:
        href = "/for/%s/" % t[0]
        if href != current:
            items.append('<li><a href="%s">Websites for %s</a></li>' % (href, esc(t[2])))
    for href, label in [("/tools/missed-call-calculator/", "Missed-call cost calculator"),
                        ("/guides/website-cost-small-business/", "What a small business website costs"),
                        ("/guides/google-business-profile-setup/", "Set up your Google listing (free guide)"),
                        ("/refer/", "Refer a business, get $50"),
                        ("/partners/", "White-label sites for agencies")]:
        if href != current:
            items.append('<li><a href="%s">%s</a></li>' % (href, label))
    return "\n".join(items)


def write(path, content):
    full = os.path.join(ROOT, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    return path


def page(path, title, desc, schema, body):
    url = SITE + path
    src = "seo-" + path.strip("/").replace("/", "-")
    return HEAD.format(title=esc(title), desc=esc(desc), url=url, site=SITE, schema=schema,
                       start=start_link(src)) + body + FOOT.format(links=related(path), email=EMAIL)


def town_page(t):
    slug, name, blurb, nearby, meet = t
    path = "/websites/%s-il/" % slug
    src = "seo-town-" + slug
    faqs = [
        ("How much does a website cost in %s?" % name, "With me, a Starter Site is $0 down and $99 a month, or $300 one time for the Essential site. Bigger custom sites are $750 to $1,500 one time. You see a free preview before paying anything."),
        ("Do I have to meet in person?", "No. " + meet),
        ("How fast can my site be live?", "A Starter Site goes live within 2 days of your yes, once I have your details."),
        ("Do you only work with %s businesses?" % name, "No. I build for small businesses across Central Illinois and the rest of the US, but I'm local to the Peoria area."),
    ]
    trades = "".join('<li><a href="/for/%s/">%s</a></li>' % (tr[0], esc(tr[2][0].upper() + tr[2][1:])) for tr in TRADES)
    body = """
<p class="crumbs"><a href="/">Home</a> › Websites in {name}, IL</p>
<h1>Websites for small businesses in {name}, IL</h1>
<p class="lede">I'm Nolan, a web designer from Morton. I build simple, fast websites for {name} businesses, and <b>you see a free preview of your site before you pay anything</b>.</p>
<div class="ctas"><a class="btn" href="{m}">Get a free preview</a><a class="btn ghost" href="/#work">See sample sites</a></div>
<p class="fine">No calls needed. Everything works by email, and</p>

<h2>Why a {name} business needs a real website</h2>
<p>When someone in {name} ({blurb}) needs a service, they search on their phone, look at the first few results, and call whoever looks clear and trustworthy. A Facebook page or a bare Google listing often isn't enough: people want your services, your area, your hours and a button that calls you.</p>
<p>A simple site on your own business name does that job, and it backs up your Google listing so you show up for searches like "<i>your service</i> near me" in {name}.</p>

<h2>What you get</h2>
<ul class="checks">
<li>A one-page site that loads fast on phones, with tap-to-call at the top</li>
<li>Your services, prices if you want them, hours and the towns you cover ({nearby})</li>
<li>Your Google Business Profile checked and fixed up so the details match</li>
<li>Hosting and small edits handled, so you don't touch anything technical</li>
</ul>
{offers}
<h2>Popular in the area</h2>
<ul class="links">{trades}</ul>

<h2>How it works</h2>
<ol class="steps">
<li><b>Tell me about your business</b> by email: name, what you do, and your phone number.</li>
<li><b>I build a free preview</b> and send you the link to look at on your own phone.</li>
<li><b>You decide.</b> If you like it, we go live and you pay. If not, you owe nothing.</li>
</ol>

<h2>Questions</h2>
<div class="faq">{faq}</div>
<div class="close card"><h2 style="margin-top:0">See your new site before you spend a dollar.</h2><div class="ctas"><a class="btn" href="{m}">Email me for a free preview</a></div><p class="fine">Or write to <a href="mailto:{email}">{email}</a> with your business name and town.</p></div>
""".format(name=esc(name), blurb=esc(blurb), nearby=esc(", ".join(nearby)), offers=offers(src), trades=trades,
           m=mailto("Free website preview - %s business" % name, src), email=EMAIL,
           faq="".join("<details><summary>%s</summary><p>%s</p></details>" % (esc(q), esc(a)) for q, a in faqs))
    schema = schema_tags(service_schema("Small business websites in %s, IL" % name, nearby, SITE + path), faq_schema(faqs))
    title = "Website Design in %s, IL from $99/mo · Nolan Day Studio" % name
    desc = "Small business websites in %s, IL. $0 down and $99 a month, or $300 one time. Free preview before you pay. Local web designer from Morton." % name
    return write(path, page(path, title, desc, schema, body))


def trade_page(t):
    slug, short, plural, why, sections, phone, sample, extra_faq = t
    path = "/for/%s/" % slug
    src = "seo-trade-" + slug
    faqs = [
        ("How much does a website for %s cost?" % plural, "A Starter Site is $0 down and $99 a month, or $300 one time for the Essential site. You see a free preview first and pay only if you want it."),
        ("Do you guarantee more calls?", "No. Nobody honest can. A clear site removes the reasons people leave, like no call button, no service list or a broken phone layout."),
    ] + list(extra_faq)
    sample_html = ""
    if sample:
        sample_html = '<p>Want to see the style first? Look at the <a href="/%s">%s</a> (a made-up business I built to show the layout).</p>' % (sample[0], esc(sample[1]))
    body = """
<p class="crumbs"><a href="/">Home</a> › Websites for {plural}</p>
<h1>Websites for {plural} that turn searches into calls</h1>
<p class="lede">{why}</p>
<div class="ctas"><a class="btn" href="{m}">Get a free preview</a><a class="btn ghost" href="/tools/missed-call-calculator/">What do missed calls cost me?</a></div>
<p class="fine">Free preview first. $0 down. Everything by email.</p>

<h2>What goes on your {short_l} website</h2>
<ul class="checks">{sections}</ul>
{sample}
<h2>Missed calls are missed jobs</h2>
<p>{phone}</p>
<p class="fine">Phone Desk only answers calls you forward to it, and it never quotes prices or promises dates you haven't approved.</p>
{offers}
<h2>Questions</h2>
<div class="faq">{faq}</div>
<div class="close card"><h2 style="margin-top:0">Get a free preview of your {short_l} site.</h2><div class="ctas"><a class="btn" href="{m}">Email me your business name</a></div><p class="fine">Or write to <a href="mailto:{email}">{email}</a>.</p></div>
""".format(plural=esc(plural), why=esc(why), short_l=esc(short if short.isupper() else short.lower()), m=mailto("Free website preview - %s" % short, src),
           sections="".join("<li>%s</li>" % esc(s) for s in sections), sample=sample_html, phone=esc(phone),
           offers=offers(src), email=EMAIL,
           faq="".join("<details><summary>%s</summary><p>%s</p></details>" % (esc(q), esc(a)) for q, a in faqs))
    schema = schema_tags(service_schema("Websites and AI call answering for %s" % plural, None, SITE + path), faq_schema(faqs))
    title = "%s Websites from $99/mo, Free Preview · Nolan Day Studio" % short
    desc = "Websites for %s: tap-to-call, service list, service area and quote form. $0 down and $99 a month, free preview first. Optional AI call answering." % plural
    return write(path, page(path, title, desc, schema, body))


def extra_pages():
    import extra_pages as ep
    out = []
    for path, title, desc, faqs, body in ep.PAGES:
        schema = schema_tags(faq_schema(faqs)) if faqs else ""
        src = "seo-" + path.strip("/").replace("/", "-")
        body = body.replace("{M_START}", mailto("Free website preview", src)).replace("{M_PHONE}", mailto("Phone Desk question", src)) \
                   .replace("{M_GBP}", mailto("Google listing fix-up", src)).replace("{M_PARTNER}", mailto("Referral partner", src)) \
                   .replace("{OFFERS}", offers(src)).replace("{EMAIL}", EMAIL)
        out.append(write(path, page(path, title, desc, schema, body)))
    return out


def main():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    made = [town_page(t) for t in TOWNS] + [trade_page(t) for t in TRADES] + extra_pages()
    print("\n".join(made))


if __name__ == "__main__":
    main()
