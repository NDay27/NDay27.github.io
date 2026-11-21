# Demo reels

A 20-second vertical video for one lead: "Made for <shop>", then each website built for them scrolling on a phone
(Starter $300, Signature $750, Immersive $1,250, whichever exist), then their pitch room link. Partners text it or
hand over their phone instead of only sending a link.

## Make one

```sh
node tools/reels/make_reel.js <slug> --repo-copy
```

`<slug>` is the folder name under `p/2e8e4a/` (the same `?s=` the pitch room uses), for example
`r-w-stoneworks-washington`. Several slugs in one command work too.

Output, by default in `/mnt/project-files/reels/`:

| File | What it is |
| --- | --- |
| `<slug>.mp4` | 1080x1920 H.264, 30 fps, no audio, about 21 s, under 4 MB (sized to text) |
| `<slug>-cover.jpg` | 1080x1080 cover: the name and the versions as a fan of phones |
| `<slug>-poster.jpg` | 540x960 still from the video, used as the player poster |
| `reels.json` | list of every reel made, read by `reels/index.html` |

`--repo-copy` also copies them into `reels/` in this repo, so after a push they are at
`https://nday27.github.io/reels/<slug>.mp4` and listed on the internal page `https://nday27.github.io/reels/`
(noindex, not linked from the site).

Options: `--out DIR` (another output folder), `--quick` (short version of each site, for checking a layout fast),
`--keep` (keep the frame JPEGs, path is printed), `--fps N`, `--port N`.

Time: about 5 to 9 minutes per reel on a build box, longer when a long page has a 3D scene (software WebGL
is slow there). Run two in separate terminals with different `--port` values to go faster.

## Where the data comes from

Everything is read from the lead's preview page, the same way `meet/index.html` does it:

- `<script type="application/json" id="nds-shop">` in `p/2e8e4a/<slug>/index.html`: `name`, `short`, `trade`,
  `town`, `samples` (the URL of each plan's site, e.g. Brecklin's points at `/brecklins300/` etc.) and `tools`
  (the one-line feature shown under each plan name).
- Colors: `--acc` / `--deep` from the first site's own CSS, so each reel wears the shop's colors.
- A plan is skipped if its site is not there (the reel then says "See both" or "See it live").

Nothing is invented: no reviews, no numbers, no claims beyond "Live the same day you say yes" and
"Pay only after you approve", which match the pitch room.

## How it records

- `tools/reels/stage.html` is the branded frame (intro, phone, lower third, progress bar, outro, cover). It is
  loaded at 450x800 CSS px with a 2.4 device scale, so the video is 1080x1920 and each site renders natively at
  2.4x inside a 390x640 phone viewport (sharp text, the site's real phone layout, with `pointer: coarse` like a
  phone so it skips desktop-only smooth scrolling).
- Time is virtual. Playwright's clock fakes timers and `requestAnimationFrame` (three.js scenes, GSAP, counters),
  and every CSS animation and transition is paused and stepped by hand each frame. So reveals, drawings and
  3D scenes play at their real speed in the video no matter how slow the capture is.
- The scroll rests on section starts with eased moves, like a person flicking through on their phone, after a
  pause on the hero while it animates in. Each version swipes in over the last one.
- When a version's first screen has a scene button (Raise the lift, Trim a branch, a paint color), a finger
  taps it so the video shows the site reacting. Nothing else on the page is clicked.
- ffmpeg two-pass encode, bitrate sized to the length so the file lands just under 4 MB.
- The sites load three.js, Lenis and GSAP from cdn.jsdelivr.net, which build boxes can't reach. The recorder
  answers those requests from a local copy pulled once from the npm registry (into `~/.cache/nds-reels-cdn`, or
  `REELS_CDN`), so 3D scenes appear in the video exactly as they do for a visitor.

Needs node 22, ffmpeg, python3 and `playwright-core` + `@sparticuz/chromium` (`REELS_NODE_MODULES`,
default `/root/br/node_modules`).

## Check a reel before sending it

```sh
ffmpeg -ss 9 -i reels/<slug>.mp4 -frames:v 1 /tmp/check.jpg
```

Look at a few timestamps (intro about 1.5 s, each version, the end). If a site changed, just run the command again.
