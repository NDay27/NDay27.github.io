# Good Word

A phone app Nolan Day Studio sells to local businesses for $39 a month. It makes asking every customer for a Google review a one-tap habit.

- Pitch page: `/goodword/`
- Sample app: `/goodword/app/?s=harlow` (Harlow Building Co. is made up)
- Team setup page: `/goodword/setup/` (builds a preview link for any shop in seconds)
- QR hop page: `/goodword/r/?s=<slug>` (printed signs point here, then it sends people to Google)
- Sales script: `SELL.md` in this folder

## How it works

Static files only, no server and no cost. A shop is one JSON file in `goodword/shops/`. The owner's customer list lives in that phone's localStorage and is never uploaded. Texts are sent by the owner from their own texting app through an `sms:` link, so there is no texting bill.

Files: `app/core.js` (shop config, links, messages, dates), `app/replies.js` (reply writer), `app/app.js` (screens), `page.js` (pitch page), `setup/setup.js`.

## Turn a shop on

1. Get their direct review link. The owner opens Google Business Profile, taps "Ask for reviews" and copies the link (`https://g.page/r/.../review`). A Place ID works too.
2. Open `/goodword/setup/`, fill it in, and copy the file text.
3. Save it as `goodword/shops/<slug>.json` and merge. Their app link is `/goodword/app/?s=<slug>`.
4. Text the owner the link and tell them to add it to their home screen.

Shop file fields: `name` (needed), `town`, `state`, `owner`, `phone`, `link` or `placeid`, `start` (review count on day one), `goal` (asks per week, default 5), `status`.

`status`: `trial` (free 14 days), `active` (paying), `paused` (app locked, printed QR codes keep working). Only Google addresses are accepted as review links; anything else is ignored and the app falls back to a Google search for the shop.

## Rules the app follows

- Ask every customer, not only happy ones (Google forbids review gating).
- Never offer anything in return for a review.
- One ask and one reminder, only to people who gave their number.
- No fake reviews, no promises about rankings or review counts.

## Tests

`node _build/goodword/test.cjs` (103 checks: unit, app flows on a phone, unsafe input, pitch page, setup page). Run it before every change goes live.

## Sales validation: pending

No one has paid for Good Word yet. Scored with the ai-app-validation skill on 2026-11-25:

| | Score (5 = best) | Why |
|---|---|---|
| Pain evidence we hold | 2 | No buyer quotes yet. Paid review tools exist, which only shows the category exists. |
| Difference vs the best free option | 2 | Google gives every business a free review link and QR code. Our edge is done-for-you setup, the habit (list, goal, reminder) and the reply writer. |
| Distribution we control | 4 | About 2,000 checked leads with phone numbers, call scripts, 3 callers, sample sites already built. |
| Integration burden | 5 | A link on the owner's phone. Nothing to connect. |
| Data and risk | 4 | Customer names stay on the owner's phone. The owner presses send. |
| Economics | 4 | $39 a month, zero hosting or model cost, a few minutes of setup. |

Weakest scores decide the risk: we do not yet know if owners will pay for this over the free Google link.

Gaps and the cheapest test for each:
- Will owners pay $39? Offer it on the next 30 live conversations and count yeses.
- Do owners keep using it? Check in at day 7 and day 14 of each trial and ask how many asks they sent.
- Does it lift reviews? Compare the Google count at day 30 with the `start` number.

Economics: $1,000 a month needs 26 shops, $10,000 needs 257. Payments by Venmo or Cash App need a manual check each month, and business payments there can carry a small fee. Assume some shops cancel each month and plan to replace them. It is best used as a low-price first yes that leads to a website plan.

Stop rule: if fewer than 3 of the first 30 owners who hear the offer start a trial by 2026-12-20, or no trial turns into a paid month, stop selling it alone and keep it only as a free extra inside website plans.
