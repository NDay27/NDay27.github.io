"""Hand-written pages rendered by gen_pages.py. Placeholders: {M_START} {M_PHONE} {M_GBP} {M_PARTNER} {OFFERS} {EMAIL}."""

CALC = r"""
<p class="crumbs"><a href="/">Home</a> › Free tools › Missed-call cost calculator</p>
<h1>What are missed calls costing your business?</h1>
<p class="lede">Most owners know they miss calls while they're on a job. Few have put a number on it. Enter your own numbers below; nothing is sent anywhere.</p>
<div class="card">
<form id="calc" onsubmit="return false">
<label for="calls">Calls you miss in a typical week</label><input id="calls" type="number" inputmode="numeric" min="0" max="500" value="5">
<label for="newp">Of those, how many are new customers? (%)</label><input id="newp" type="number" inputmode="numeric" min="0" max="100" value="50">
<label for="win">If you'd answered, how often would you win the job? (%)</label><input id="win" type="number" inputmode="numeric" min="0" max="100" value="40">
<label for="val">Average value of a job ($)</label><input id="val" type="number" inputmode="numeric" min="0" max="100000" value="350">
</form>
<p style="margin-top:20px">Estimated work you could be losing each month:</p>
<p class="result" id="out" role="status" aria-live="polite">$1,516</p>
<p class="fine" id="detail"></p>
</div>
<p class="fine">This is a rough estimate from the numbers you entered (a month counted as 4.33 weeks), not a promise of what any service will win back.</p>

<h2>What to do about it</h2>
<ol class="steps">
<li><b>Look at your call log</b> for last week and count the missed calls you never returned. That's your real first number.</li>
<li><b>Turn on voicemail and a text-back</b> if your phone plan has one, so callers know you'll get back to them.</li>
<li><b>Call back fast.</b> People who can't reach you often call the next business on the list.</li>
<li><b>Or let Phone Desk answer.</b> My AI receptionist picks up calls you forward to it, takes the name, number, address and job, and sends you the summary.</li>
</ol>
{OFFERS}
<script>
(function(){
  function n(id){var v=parseFloat(document.getElementById(id).value);return isFinite(v)&&v>0?v:0}
  function fmt(x){return "$"+Math.round(x).toLocaleString("en-US")}
  function run(){
    var calls=n("calls"),newp=Math.min(n("newp"),100)/100,win=Math.min(n("win"),100)/100,val=n("val");
    var jobs=calls*4.33*newp*win, lost=jobs*val;
    document.getElementById("out").textContent=fmt(lost);
    document.getElementById("detail").textContent="About "+jobs.toFixed(1)+" jobs a month ("+fmt(lost*12)+" a year).";
  }
  document.getElementById("calc").addEventListener("input",run);run();
})();
</script>
"""

CALC_FAQ = [
    ("How do I work out how many calls I miss?", "Open your phone's recent calls list and count the missed calls from numbers you didn't call back last week. Do it for two or three weeks to get a fair average."),
    ("What is Phone Desk?", "An AI receptionist from Nolan Day Studio that answers calls you forward to it when you can't pick up, takes the caller's details and job, and sends you a summary. The founding price is $197 a month with setup included for the first 3 businesses."),
]

PARTNERS = """
<p class="crumbs"><a href="/">Home</a> › Referral partners</p>
<h1>Know a business that needs a website? Get $50.</h1>
<p class="lede">If you work with small business owners (accounting, insurance, printing, signs, photography, coaching, real estate), you hear "our website is a mess" or "we don't have one" all the time. Send them my way. <b>When they become a paying client, I send you $50</b> by Venmo or Cash App.</p>
<div class="ctas"><a class="btn" href="{M_PARTNER}">Become a referral partner</a></div>

<h2>How it works</h2>
<ol class="steps">
<li><b>Introduce us by email.</b> Send one email to the owner and to {EMAIL} saying who they are. Ask them first; I only contact people who expect to hear from me.</li>
<li><b>I build them a free preview.</b> They see their new site before they pay anything, so there's no risk to your relationship with them.</li>
<li><b>You get $50</b> once they've paid me at least $300: the one-time Essential site, or their third month on a $99-a-month plan.</li>
</ol>

<h2>What your clients get</h2>
<ul class="checks">
<li>Starter Site: $0 down and $99 a month, or $300 one time, live within 2 days of their yes</li>
<li>Custom sites from $750 to $1,500 one time</li>
<li>Phone Desk, an AI receptionist for missed calls, from $197 a month</li>
<li>A free preview first, everything by email, and plain-language pricing</li>
</ul>

<h2>The fine print</h2>
<ul class="checks">
<li>One $50 payment per new client you introduce, paid within 7 days of qualifying.</li>
<li>The business has to be new to me (not already talking with me).</li>
<li>No limit on how many businesses you refer.</li>
<li>Please don't add my email to lists or send me contacts who haven't agreed to it.</li>
</ul>
"""

PARTNER_FAQ = [
    ("How much do referral partners earn?", "$50 for each new client you introduce, once that client has paid Nolan Day Studio at least $300."),
    ("How is the referral paid?", "By Venmo or Cash App within 7 days of the client qualifying."),
]

COST = """
<p class="crumbs"><a href="/">Home</a> › Guides › Website cost</p>
<h1>How much does a small business website cost in 2026?</h1>
<p class="lede">Short answer: anywhere from about $15 a month if you build it yourself to many thousands of dollars from an agency. Here's what you actually get at each level, so you can pick what fits.</p>

<h2>The four usual options</h2>
<div class="tablewrap"><table>
<tr><th>Option</th><th>Typical cost</th><th>Good for</th><th>Watch out for</th></tr>
<tr><td>Do it yourself (website builder)</td><td>Roughly $15 to $50 a month for the plan, plus your time</td><td>Owners who enjoy tinkering and have evenings free</td><td>It takes longer than expected, and many DIY sites never get finished</td></tr>
<tr><td>Freelancer</td><td>Often $500 to $5,000 one time</td><td>A custom site with one person to talk to</td><td>Who hosts it and makes changes after launch</td></tr>
<tr><td>Agency</td><td>Often $3,000 to $15,000 or more</td><td>Larger businesses with big content needs</td><td>Long timelines and paying for meetings</td></tr>
<tr><td>Monthly website service</td><td>Often $50 to $300 a month</td><td>Owners who want it handled with no big upfront bill</td><td>Contract length and whether you keep the domain</td></tr>
</table></div>
<p class="fine">Ranges are typical prices seen across the US market, not quotes. Always ask what's included.</p>

<h2>Costs people forget</h2>
<ul class="checks">
<li><b>Domain name:</b> usually $15 to $20 a year. Make sure it's registered in your name.</li>
<li><b>Hosting:</b> sometimes free, sometimes $10 to $30 a month.</li>
<li><b>Changes after launch:</b> ask how much a new photo or price update costs before you sign.</li>
<li><b>Your time:</b> gathering photos, services and prices takes an hour or two whatever you choose.</li>
</ul>

<h2>Questions to ask any web designer</h2>
<ol class="steps">
<li>Will I own the domain and the content?</li>
<li>Can I see a preview or a sample before I pay?</li>
<li>What does a small change cost after launch?</li>
<li>Is there a contract, and how do I cancel?</li>
<li>Will it work well on phones? (Ask to see one on your own phone.)</li>
</ol>

<h2>What I charge</h2>
<p>I'm Nolan, a web designer in Morton, IL. My prices are on the page so you don't have to ask: a Starter Site is <b>$0 down and $99 a month</b>, or $300 one time to own it. Custom sites are $750, and modeled 3D sites $1,250 to $1,500. You see a free preview before paying anything.</p>
{OFFERS}
"""

COST_FAQ = [
    ("How much does a basic small business website cost?", "A basic one-page site usually costs somewhere between a few hundred and a couple of thousand dollars one time, or a monthly fee if you use a website service. At Nolan Day Studio it's $300 one time, or $0 down and $99 a month."),
    ("Do I need to pay for a domain?", "Usually yes, about $15 to $20 a year, and it should be registered in your business's name."),
]

GBP = """
<p class="crumbs"><a href="/">Home</a> › Guides › Google Business Profile</p>
<h1>How to set up your Google Business Profile (free, step by step)</h1>
<p class="lede">Your Google Business Profile is the box with your hours, reviews and call button that shows up when people search for you or "<i>your service</i> near me". It's free, and it's often the first thing a customer sees.</p>

<h2>Before you start</h2>
<ul class="checks">
<li>A Google account you'll keep (use a business email if you have one)</li>
<li>Your exact business name, as it appears on your sign, truck or cards</li>
<li>Your phone number, hours and the towns you serve</li>
<li>5 to 10 real photos: your work, your team, your vehicle or storefront</li>
</ul>

<h2>Step by step</h2>
<ol class="steps">
<li><b>Go to google.com/business</b> and sign in with your Google account.</li>
<li><b>Enter your business name.</b> If Google finds an existing listing, claim it instead of making a new one.</li>
<li><b>Pick your main category</b>, like "Plumber" or "House cleaning service". It matters more than almost anything else, so pick the closest match.</li>
<li><b>Add your location.</b> If customers come to you, add your address. If you go to them, choose a service area and hide your home address.</li>
<li><b>Add your phone number and website.</b> No website yet? You can add one later.</li>
<li><b>Verify.</b> Google will offer one or more ways to confirm you're real, such as a short video, a phone or email code, or a postcard. Follow its steps; the options vary by business.</li>
<li><b>Fill in everything else:</b> hours, services with short descriptions, a plain description of what you do, and your photos.</li>
<li><b>Get your review link</b> from the profile ("Ask for reviews") and send it to happy customers after each job.</li>
</ol>

<h2>Mistakes that hurt</h2>
<ul class="checks">
<li><b>Stuffing keywords into your name</b> ("Bob's Plumbing Best Plumber Peoria"). It breaks Google's rules and can get the profile suspended.</li>
<li><b>Hours that are wrong</b>, especially on holidays. Customers notice.</li>
<li><b>Buying or writing fake reviews.</b> It's against Google's rules and against the law in the US. Just ask real customers.</li>
<li><b>No photos.</b> Profiles with real photos look more trustworthy.</li>
</ul>

<h2>Want it done for you?</h2>
<p>The Google listing fix-up is <b>$149 one time</b>: I clean up your hours, categories, services, photos and description, and give you a review link and QR code to share. It's included free with every Starter Site.</p>
<div class="ctas"><a class="btn" href="{M_GBP}">Ask about the fix-up</a><a class="btn ghost" href="{M_START}">Get a free website preview</a></div>
"""

GBP_FAQ = [
    ("Is a Google Business Profile free?", "Yes. Creating and managing a Google Business Profile is free."),
    ("Can I hide my home address?", "Yes. If you travel to customers, set it up as a service-area business and hide your address."),
    ("How do I get more Google reviews?", "Copy your review link from the profile and send it to happy customers after each job. Never buy or write reviews."),
]

PAGES = [
    ("/tools/missed-call-calculator/", "Missed-Call Cost Calculator for Small Businesses · Nolan Day Studio",
     "Free calculator: see roughly how much work missed calls may be costing your business each month, from your own numbers.", CALC_FAQ, CALC),
    ("/refer/", "Referral Partners: Earn $50 per Client · Nolan Day Studio",
     "Refer a small business that needs a website. When they become a paying client, Nolan Day Studio sends you $50 by Venmo or Cash App.", PARTNER_FAQ, PARTNERS),
    ("/guides/website-cost-small-business/", "How Much Does a Small Business Website Cost in 2026? · Nolan Day Studio",
     "Honest 2026 guide to small business website costs: DIY builders, freelancers, agencies and monthly services, plus hidden costs and questions to ask.", COST_FAQ, COST),
    ("/guides/google-business-profile-setup/", "How to Set Up a Google Business Profile, Step by Step (Free Guide)",
     "Free step-by-step guide to creating and verifying your Google Business Profile, choosing categories, hiding your address and getting real reviews.", GBP_FAQ, GBP),
]
