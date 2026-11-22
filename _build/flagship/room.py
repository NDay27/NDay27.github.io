"""Per-shop pitch room: the Harlow flagship deck (harlow/index.html) rebuilt around one shop's three sample sites.
Written to p/2e8e4a/<slug>/room/. Slides: cover, why a site, the three plans, live phone + computer with the plan bar,
one slide per plan, what each plan includes, how it works, and the close."""
import json
import os
import re

import kit
from kit import E

HERE = kit.HERE
CK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
HERO = {"lawn": ("lawn", "lawn-after"), "tree": ("tree", "tree-after"), "painting": ("paint", "paint-after"), "auto": ("auto", "auto-after"), "body": ("body", "body-after")}
HERO.update({g: (g, g + "-after") for g in kit.STORES + kit.HOMES})
OWNER = {"nolan": "Nolan Day", "cooper": "Cooper"}
FIRST = {"essential": "The drawing", "signature": "Before and after", "immersive": "Live 3D"}


def _deck():
    h = open(os.path.join(kit.ROOT, "harlow/index.html")).read()
    i = h.index("<body"); j = h.index("<script>", i); k = h.index("</script>", j)
    return h[:i], h[j:k + 9]


def page(s, meet):
    head, script = _deck()
    g = s["group"]; d = json.loads(meet.replace("<\\/", "</"))
    t, hero = HERO[g]
    u = f"{kit.BASE}{s['slug']}/"
    hi1, hi2 = f"/f/img/{t}/{hero}-1200.webp", f"/f/img/{t}/{hero}-2400.webp"
    short, town = E(s["short"]), E(s["town"])
    trade = (s.get("trade") or kit.TRADE[s["v"]]).lower()
    who = OWNER.get(s.get("owner"), "Nolan Day")
    # head: title, meta, art, absolute asset paths
    head = re.sub(r"<title>.*?</title>", f"<title>Three websites for {short} · Nolan Day Studio</title>", head, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{short} in {town}, shown as a $300, $750 and $1,250 website, side by side. By Nolan Day Studio.">', head)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="Three websites for {short}">', head)
    head = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="See {short} as a $300, $750 and $1,250 website.">', head)
    head = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{kit.SITE}{u}shots/v1250.jpg">', head)
    head = head.replace('href="img/hero-1200.webp" imagesrcset="img/hero-1200.webp 1200w, img/hero-2400.webp 2400w"', f'href="{hi1}" imagesrcset="{hi1} 1200w, {hi2} 2400w"')
    head = head.replace('href="assets/harlow.css"', 'href="/harlow/assets/harlow.css"')
    v = d["versions"]
    feats = lambda k: "".join(f"<li>{CK}{E(x)}</li>" for x in v[k]["features"])
    shot = lambda n, m="": f"{u}shots/{m}v{n}.jpg"
    rows = "".join(f'<tr><th scope="row">{E(r[0])}</th>' + "".join(
        f'<td{" class=" + chr(34) + ("col3 " if i == 2 else "") + ("no" if c == 0 else "") + chr(34) if (i == 2 or c == 0) else ""}>{"Yes" if c == 1 else "No" if c == 0 else E(str(c))}</td>' for i, c in enumerate(r[1:])) + "</tr>"
        for r in d["compare"])
    rating = (f" and its {d['rating']} stars from {d['reviews']} Google review{'' if str(d['reviews']) == '1' else 's'}" if d.get("rating") else "")
    body = f"""<body>
<header class="chrome">
  <a class="brand" href="https://nday27.github.io/" aria-label="Nolan Day Studio"><img src="/img/favicon.svg" alt="" width="30" height="30"><span><b>Nolan Day Studio</b></span></a>
  <span class="count" aria-live="polite"><b id="cn">1</b> / <span id="ct">10</span></span>
</header>
<nav class="dots" id="dots" aria-label="Slides"></nav>
<div class="nav"><button type="button" id="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg></button><button type="button" id="next" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>

<main>
<section class="sl cover" id="s1" aria-label="Cover">
  <div class="bg" aria-hidden="true"><img src="{hi1}" srcset="{hi1} 1200w, {hi2} 2400w" sizes="100vw" alt="" width="2400" height="1350" fetchpriority="high"></div>
  <div class="in">
    <p class="kick rv">Made for {E(s["name"])}</p>
    <h1 class="rv d1" style="margin-top:14px">{short}. <em class="g">Three websites.</em></h1>
    <p class="lead rv d2">Your {trade} business in {town}, built at three price points so you can see exactly what each plan gets you. Every one is a real, working site. Tap, scroll and try them.</p>
    <div class="tags rv d3"><span>Starter <b>$300</b></span><span>Signature <b>$750</b></span><span>Immersive <b>$1,250</b></span></div>
    <p class="fine rv d3">Built from your Google listing. The pictures are illustrations; your version uses your own photos.</p>
  </div>
</section>

<section class="sl" id="s2" aria-labelledby="h2">
  <div class="in">
    <p class="kick rv">Why a website</p>
    <h2 id="h2" class="rv d1">People look you up before they call.</h2>
    <p class="lead rv d1">{E(d["why"])}</p>
    <div class="jobs">
      <div class="job rv d1"><i>1</i><h3>Look like you do good work</h3><p>People judge the work by what they find online. A sharp site makes {short} the obvious call.</p></div>
      <div class="job rv d2"><i>2</i><h3>Answer the first questions</h3><p>What you do, which towns you cover and how to reach you, all on one screen{E(rating)}.</p></div>
      <div class="job rv d3"><i>3</i><h3>Make it easy to reach you</h3><p>Tap to call, tap to text, or a short request form. Every plan does this. The bigger plans just do it with more pull.</p></div>
    </div>
  </div>
</section>

<section class="sl" id="s3" aria-labelledby="h3">
  <div class="in">
    <p class="kick rv">The three plans</p>
    <h2 id="h3" class="rv d1">{short}, three levels of wow.</h2>
    <div class="plans">
      <a class="plan rv d1" href="../"><div class="shot"><img src="{shot(300)}" alt="Starter site for {short}" loading="lazy" width="1280" height="800"></div><div class="b"><div class="nm"><b>Starter</b><span>$300</span></div><p>{E(v["essential"]["blurb"])}</p><span class="go">Open the site →</span></div></a>
      <a class="plan rv d2" href="../750/"><div class="shot"><img src="{shot(750)}" alt="Signature site for {short}" loading="lazy" width="1280" height="800"></div><div class="b"><div class="nm"><b>Signature</b><span>$750</span></div><p>{E(v["signature"]["blurb"])}</p><span class="go">Open the site →</span></div></a>
      <a class="plan top rv d3" href="../1250/"><span class="badge">Most memorable</span><div class="shot"><img src="{shot(1250)}" alt="Immersive site for {short}" loading="lazy" width="1280" height="800"></div><div class="b"><div class="nm"><b>Immersive</b><span>$1,250</span></div><p>{E(v["immersive"]["blurb"])}</p><span class="go">Open the site →</span></div></a>
    </div>
  </div>
</section>

<section class="sl demo" id="s4" aria-labelledby="h4">
  <div class="in">
    <div class="hd">
      <div><p class="kick rv">Try them right here</p><h2 id="h4" class="rv d1">Phone and computer, side by side.</h2></div>
      <div class="sw rv d2" role="group" aria-label="Pick a plan to preview" id="sw"><button type="button" data-p="essential" aria-pressed="false"><span class="nm">Starter</span> <span>$300</span></button><button type="button" data-p="signature" aria-pressed="false"><span class="nm">Signature</span> <span>$750</span></button><button type="button" data-p="immersive" aria-pressed="true"><span class="nm">Immersive</span> <span>$1,250</span></button></div>
    </div>
    <div class="stagebox rv d2">
      <div class="mac"><div class="tb" aria-hidden="true"><i></i><i></i><i></i><span id="url">Your website</span></div><div class="vp" id="vpD"><p class="ld">Loading the site</p></div></div>
      <div class="phone"><div class="vp" id="vpM"><p class="ld">Loading</p></div></div>
    </div>
    <div class="cap rv d3"><span id="capT">Scroll inside either screen, or press Play to watch a tour.</span><div class="acts"><button class="btn gold" type="button" id="tour" aria-pressed="false">Play the tour</button><a class="btn line" id="openFull" href="../1250/">Open full screen</a></div></div>
  </div>
</section>
{''.join(plan_slide(i, k, nm, price, sub, d, feats, shot, u) for i, (k, nm, price, sub) in enumerate((("essential", "Starter", "$300", "one time, or $0 down and $99 a month"), ("signature", "Signature", "$750", "one time"), ("immersive", "Immersive", "$1,250", "one time"))))}
<section class="sl" id="s8" aria-labelledby="h8">
  <div class="in">
    <p class="kick rv">Side by side</p>
    <h2 id="h8" class="rv d1">What each plan includes.</h2>
    <div class="tw rv d2" tabindex="0" role="region" aria-label="Plan comparison table">
      <table>
        <thead><tr><th scope="col"><span class="sr">Feature</span></th><th scope="col">Starter<b>$300</b></th><th scope="col">Signature<b>$750</b></th><th scope="col" class="col3">Immersive<b>$1,250</b></th></tr></thead>
        <tbody>{rows}<tr><th scope="row">Hosting</th><td colspan="3">Free with every plan. A domain, if you want one, is the exact registrar price, usually $15 to $20 a year.</td></tr></tbody>
      </table>
    </div>
  </div>
</section>

<section class="sl" id="s9" aria-labelledby="h9">
  <div class="in">
    <p class="kick rv">How it works</p>
    <h2 id="h9" class="rv d1">You see it before you pay a cent.</h2>
    <ol class="steps">
      <li class="rv d1"><h3>Pick a plan</h3><p>Or tell us about the business and we'll agree on the right one together.</p></li>
      <li class="rv d1"><h3>Send what you have</h3><p>A logo if you have one, a few job photos and the services you want to show.</p></li>
      <li class="rv d2"><h3>See it finished</h3><p>We swap in your photos and details, often the same day you ask.</p></li>
      <li class="rv d3"><h3>Approve, then pay</h3><p>You pay only after you approve the final version, by Venmo, Cash App or a payment link.</p></li>
    </ol>
    <div class="alt rv d3"><span>Rather pay monthly? <b>Starter Site, $0 down and $99 a month.</b></span><span>Small text edits are free for 30 days after launch.</span></div>
  </div>
</section>

<section class="sl close" id="s10" aria-labelledby="h10">
  <div class="in">
    <p class="kick rv">Your turn</p>
    <h2 id="h10" class="rv d1">Which one feels like <em class="g">{short}?</em></h2>
    <div class="pick rv d2"><a class="btn line" href="../">Starter <span>$300</span></a><a class="btn line" href="../750/">Signature <span>$750</span></a><a class="btn gold" href="../1250/">Immersive <span>$1,250</span></a></div>
    <p class="rv d3" style="margin-top:22px"><a class="btn gold" href="/meet/?s={s["slug"]}&amp;by={s.get("owner", "nolan")}">Pick a plan and get started</a></p>
    <p class="sig rv d3">{E(who)}, Nolan Day Studio. <a href="https://nday27.github.io/">nday27.github.io</a></p>
  </div>
</section>
</main>
"""
    script = script.replace('var src = plan + "/?embed=1";', 'var src = {essential: "../", signature: "../750/", immersive: "../1250/"}[plan] + "?embed=1";')
    script = script.replace('$("#openFull").href = plan + "/";', '$("#openFull").href = {essential: "../", signature: "../750/", immersive: "../1250/"}[plan];')
    script = script.replace('var DOMAIN = {essential: "harlowbuilding.com", signature: "harlowbuilding.com", immersive: "harlowbuilding.com"};', 'var DOMAIN = {essential: "Your website", signature: "Your website", immersive: "Your website"};')
    script = script.replace('f.title = "Harlow sample site preview"', f'f.title = "{short} sample site preview"')
    assert "../750/" in script
    return head + body + script + "\n" + kit.count_script("room-" + s["slug"]) + "\n</body>\n</html>\n"


def plan_slide(i, k, nm, price, sub, d, feats, shot, u):
    n = (300, 750, 1250)[i]; href = ("../", "../750/", "../1250/")[i]
    return f"""
<section class="sl" id="s{5 + i}" aria-labelledby="h{5 + i}">
  <div class="in ps">
    <div>
      <p class="kick rv">Plan {i + 1}</p>
      <h2 id="h{5 + i}" class="rv d1">{nm}</h2>
      <div class="price rv d1"><b>{price}</b><span>{sub}</span></div>
      <p class="for rv d2">{E(d["versions"][k]["blurb"])}</p>
      <ul class="rv d2">{feats(k)}</ul>
      <div class="meta rv d3"><span>{("Up to 5 sections", "Up to 7 sections", "Up to 7 sections")[i]}</span><span>{("1 revision round", "2 revision rounds", "2 revision rounds")[i]}</span><span>Try it: {E(d["try"][k])}</span></div>
      <div class="acts rv d3"><a class="btn gold" href="{href}">Open {nm}</a></div>
    </div>
    <div class="pic rv d1"><div class="d"><img src="{shot(n)}" alt="" loading="lazy" width="1280" height="800"></div><div class="m"><img src="{shot(n, 'm')}" alt="" loading="lazy" width="390" height="844"></div></div>
  </div>
</section>"""
