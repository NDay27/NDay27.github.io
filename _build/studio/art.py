"""Self-drawing line art for the Nolan Day Studio sample sites (the RW Stoneworks standard).

Every drawing is an architect's-sheet line drawing on a 600 x 600 board. Strokes draw themselves in order
(pathLength=1 dash animation, delay in --t), the trade's own parts are drawn in the accent color (class f),
soft fills fade in last, and small labels with leader lines name the parts.

Each drawing is split into beats (data-b="1".."6"). The Starter plays all beats in order on load, the
Signature uses the same drawing as a plain plan on one side of a slider and the finished, colored version
on the other, and the Immersive scrubs the beats with the scroll.

No stock art: everything here is drawn in code.
"""
import math, html

E = html.escape


class Art:
    def __init__(self):
        self.beats = {}
        self.b = 1
        self.t = 0.0
        self.fills = {}
        self.labels = []
        self.extra = []

    # timing ----------------------------------------------------------------
    def beat(self, n, t=None):
        self.b = n
        if t is not None:
            self.t = t
        return self

    def _put(self, s):
        self.beats.setdefault(self.b, []).append(s)

    # strokes ---------------------------------------------------------------
    def p(self, d, c="b", dt=0.05, extra=""):
        self._put(f'<path class="{c}" d="{d}" pathLength="1" style="--t:{self.t:.2f}s"{extra}/>')
        self.t += dt
        return self

    def L(self, x1, y1, x2, y2, c="b", dt=0.04):
        return self.p(f"M{x1:g} {y1:g}L{x2:g} {y2:g}", c, dt)

    def R(self, x, y, w, h, c="b", dt=0.05, r=0):
        if r:
            d = (f"M{x + r:g} {y:g}H{x + w - r:g}Q{x + w:g} {y:g} {x + w:g} {y + r:g}V{y + h - r:g}Q{x + w:g} {y + h:g} {x + w - r:g} {y + h:g}"
                 f"H{x + r:g}Q{x:g} {y + h:g} {x:g} {y + h - r:g}V{y + r:g}Q{x:g} {y:g} {x + r:g} {y:g}z")
        else:
            d = f"M{x:g} {y:g}H{x + w:g}V{y + h:g}H{x:g}z"
        return self.p(d, c, dt)

    def C(self, cx, cy, r, c="b", dt=0.05):
        return self.p(f"M{cx - r:g} {cy:g}a{r:g} {r:g} 0 1 0 {2 * r:g} 0a{r:g} {r:g} 0 1 0 {-2 * r:g} 0", c, dt)

    def E(self, cx, cy, rx, ry, c="b", dt=0.05):
        return self.p(f"M{cx - rx:g} {cy:g}a{rx:g} {ry:g} 0 1 0 {2 * rx:g} 0a{rx:g} {ry:g} 0 1 0 {-2 * rx:g} 0", c, dt)

    def poly(self, pts, c="b", dt=0.05, close=False):
        d = "M" + "L".join(f"{x:g} {y:g}" for x, y in pts) + ("z" if close else "")
        return self.p(d, c, dt)

    def cloud(self, cx, cy, w, h, c="b", dt=0.06, n=5):
        # a scalloped shrub / tree canopy outline
        pts = []
        for i in range(n * 6 + 1):
            a = math.pi * 2 * i / (n * 6)
            bump = 1 + 0.12 * math.cos(n * a)
            pts.append((cx + w / 2 * math.cos(a) * bump, cy + h / 2 * math.sin(a) * bump))
        d = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "z"
        return self.p(d, c, dt)

    def star(self, cx, cy, r, c="f", dt=0.03):
        # four-point sparkle
        k = r * 0.22
        d = (f"M{cx:g} {cy - r:g}Q{cx + k:g} {cy - k:g} {cx + r:g} {cy:g}Q{cx + k:g} {cy + k:g} {cx:g} {cy + r:g}"
             f"Q{cx - k:g} {cy + k:g} {cx - r:g} {cy:g}Q{cx - k:g} {cy - k:g} {cx:g} {cy - r:g}z")
        return self.p(d, c, dt)

    # fills, lights, labels ----------------------------------------------------
    def fill(self, d, color, op=1, cls="fill"):
        self.fills.setdefault(self.b, []).append(f'<path class="{cls}" d="{d}" style="fill:{color};opacity:{op}"/>')
        return self

    def frect(self, x, y, w, h, color, op=1, cls="fill"):
        return self.fill(f"M{x:g} {y:g}h{w:g}v{h:g}h{-w:g}z", color, op, cls)

    def fcirc(self, cx, cy, r, color, op=1, cls="fill"):
        return self.fill(f"M{cx - r:g} {cy:g}a{r:g} {r:g} 0 1 0 {2 * r:g} 0a{r:g} {r:g} 0 1 0 {-2 * r:g} 0", color, op, cls)

    def light(self, cx, cy, r=4.5):
        self._put(f'<circle class="lt" cx="{cx:g}" cy="{cy:g}" r="{r:g}" style="--t:{self.t:.2f}s"/>')
        self.t += 0.04
        return self

    def raw(self, s):
        self._put(s)
        return self

    def label(self, x, y, text, tx, ty, anchor="start"):
        """A small caps label at (tx, ty) with a leader line to the part at (x, y)."""
        self.labels.append((self.b, f'<path class="ldr" d="M{x:g} {y:g}L{tx:g} {ty + (4 if ty > y else -14):g}"/>'
                                    f'<text x="{tx:g}" y="{ty:g}" text-anchor="{anchor}">{E(text)}</text>'))
        return self

    # output ----------------------------------------------------------------
    def svg(self, title, sid="art", cls="plan"):
        out = [f'<svg class="{cls}" id="{sid}" viewBox="0 0 600 600" role="img" aria-label="{E(title)}">']
        for b in sorted(set(self.beats) | set(self.fills)):
            if b in self.fills:
                out.append(f'<g class="fills" data-b="{b}">' + "".join(self.fills[b]) + "</g>")
        for b in sorted(self.beats):
            out.append(f'<g data-b="{b}">' + "".join(self.beats[b]) + "</g>")
        if self.labels:
            for b in sorted(set(k for k, _ in self.labels)):
                out.append(f'<g class="lbl" data-b="{b}">' + "".join(s for k, s in self.labels if k == b) + "</g>")
        out.extend(self.extra)
        out.append("</svg>")
        return "".join(out)

    def total(self):
        return self.t


# ============================================================================ the house (front elevation)
SKY = "#e9eef2"
WALL = "#efe6d6"
ROOF = "#5d5a56"
GLASS = "#cfe0ea"
GRASS = "#c9d6b3"


def house(v, acc):
    """Front elevation of a house; v picks the trade overlay."""
    a = Art()
    hv = ("hvac", "generator", "plumbing", "septic")
    # beat 1: the ground and the house shell
    a.beat(1, 0)
    a.L(24, 470, 576, 470, "w", .12)
    for i in range(14):
        a.L(40 + i * 40, 470, 28 + i * 40, 482, "j", .01)
    a.poly([(120, 470), (120, 270), (400, 270), (400, 470)], "w", .14)
    a.poly([(95, 270), (150, 170), (370, 170), (425, 270)], "w", .14, close=True)
    a.poly([(400, 470), (400, 330), (548, 330), (548, 470)], "w", .1)
    a.poly([(392, 330), (418, 296), (532, 296), (556, 330)], "w", .1, close=True)
    a.R(316, 140, 26, 44, "b", .06)
    a.L(312, 140, 346, 140, "b", .02)
    a.fill("M120 270H400V470H120z", WALL, 1)
    a.fill("M400 330H548V470H400z", WALL, 1)
    a.fill("M95 270L150 170H370L425 270z", ROOF, .9)
    a.fill("M392 330L418 296H532L556 330z", ROOF, .9)
    a.fill("M24 470H576V486H24z", GRASS, .9)
    # beat 2: openings
    a.beat(2)
    for x in (150, 312):
        a.R(x, 352, 58, 70, "b", .05)
        a.L(x + 29, 352, x + 29, 422, "j", .02)
        a.L(x, 387, x + 58, 387, "j", .02)
        a.L(x - 6, 422, x + 64, 422, "b", .02)
        a.frect(x, 352, 58, 70, GLASS, 1)
    a.R(238, 372, 44, 98, "b", .05)
    a.C(274, 424, 2.6, "j", .02)
    a.frect(238, 372, 44, 98, "#7c6a58", .85)
    a.poly([(228, 470), (228, 462), (292, 462), (292, 470)], "j", .02)
    a.R(196, 206, 34, 34, "j", .03)
    a.R(290, 206, 34, 34, "j", .03)
    a.frect(196, 206, 34, 34, GLASS, 1)
    a.frect(290, 206, 34, 34, GLASS, 1)
    a.R(420, 362, 108, 108, "b", .05)
    if v != "garagedoor":
        for k in range(1, 4):
            a.L(420, 362 + k * 27, 528, 362 + k * 27, "j", .02)
    if v not in hv + ("fence", "pest", "wash", "junk"):
        # a tree and shrubs
        a.L(62, 470, 62, 380, "b", .04)
        a.cloud(62, 352, 74, 82, "b", .06, 6)
        a.fcirc(62, 352, 36, "#b8c99a", .9)
    a.cloud(110, 458, 34, 24, "j", .03)
    a.cloud(312, 460, 30, 20, "j", .03)

    # beat 3..5: the trade
    a.beat(3)
    lab = []
    if v == "roofing":
        for k, y in enumerate(range(184, 268, 12)):
            x0 = 150 - (y - 170) * 55 / 100
            x1 = 370 + (y - 170) * 55 / 100
            a.L(x0, y, x1, y, "f", .03)
            off = 0 if k % 2 else 9
            for x in range(int(x0 + 10 + off), int(x1 - 6), 18):
                a.L(x, y, x, y + 10, "j", .004)
        a.beat(4)
        a.L(150, 170, 370, 170, "f", .06)
        a.R(176, 176, 14, 8, "f", .03)
        a.R(250, 176, 14, 8, "f", .03)
        a.L(95, 270, 425, 270, "f", .05)
        for y in range(304, 330, 10):
            x0 = 418 - (y - 296) * 26 / 34
            x1 = 532 + (y - 296) * 24 / 34
            a.L(x0, y, x1, y, "f", .02)
        a.label(260, 210, "New shingles", 430, 120)
        a.label(160, 172, "Ridge cap", 30, 120)
        a.fill("M95 270L150 170H370L425 270z", acc, .55, "fill new")
    elif v in ("gutter", "guttercleaning"):
        a.R(92, 266, 336, 9, "f", .08, 3)
        a.R(388, 326, 172, 8, "f", .06, 3)
        a.beat(4)
        a.poly([(104, 275), (104, 290), (110, 298), (110, 462), (100, 470)], "f", .06)
        a.poly([(552, 334), (552, 462), (562, 470)], "f", .05)
        for y in (330, 380, 430):
            a.raw(f'<circle class="drip" cx="110" cy="{y}" r="2.6" style="--d:{(y - 330) / 100:.1f}s"/>')
        a.label(300, 270, "Seamless gutters", 430, 238)
        a.label(110, 400, "Downspout", 30, 520)
        if v == "guttercleaning":
            for x in (180, 230, 300, 350):
                a.cloud(x, 262, 12, 7, "old", .01, 4)
    elif v == "siding":
        for y in range(282, 466, 12):
            a.L(124, y, 396, y, "f", .012)
        a.beat(4)
        for y in range(342, 466, 12):
            a.L(404, y, 544, y, "f", .012)
        a.R(120, 270, 8, 200, "f", .03)
        a.R(392, 270, 8, 200, "f", .03)
        a.label(130, 300, "Lap siding", 30, 240)
        a.label(396, 300, "Corner trim", 450, 240)
        a.fill("M120 270H400V470H120z", acc, .32, "fill new")
    elif v == "window":
        for x in (150, 312):
            a.R(x - 4, 348, 66, 78, "f", .05)
            a.R(x + 4, 356, 50, 62, "f", .04)
        a.R(192, 202, 42, 42, "f", .04)
        a.R(286, 202, 42, 42, "f", .04)
        a.beat(4)
        a.R(234, 368, 52, 102, "f", .05)
        a.label(180, 390, "Energy-efficient windows", 30, 300)
        a.label(260, 380, "New entry door", 300, 520)
        a.frect(234, 368, 52, 102, acc, .55, "fill new")
    elif v == "windowclean":
        for x in (150, 312):
            for k in range(3):
                a.p(f"M{x + 6} {356 + k * 20}q26 -10 46 0", "f", .03)
        a.beat(4)
        for (x, y, r) in ((168, 362, 7), (348, 372, 9), (212, 214, 5), (306, 214, 6), (472, 380, 6)):
            a.star(x, y, r)
        for (x, y) in ((160, 400), (190, 368), (330, 410), (356, 362)):
            a.cloud(x, y, 9, 6, "old", .01, 3)
        a.label(180, 370, "Streak-free glass", 30, 300)
    elif v == "garagedoor":
        for k in range(1, 4):
            a.L(420, 362 + k * 27, 528, 362 + k * 27, "f", .03)
        for k in range(4):
            a.R(426 + k * 26, 368, 20, 14, "f", .02)
        a.beat(4)
        a.L(474, 362, 474, 340, "j", .02)
        a.p("M420 362V470M528 362V470", "f", .04)
        a.light(474, 352, 3.6)
        a.label(474, 420, "New garage door", 440, 520)
        a.frect(420, 362, 108, 108, acc, .5, "fill new")
    elif v == "hvac":
        a.R(36, 404, 70, 66, "w", .06, 4)
        for y in range(414, 466, 7):
            a.L(42, y, 100, y, "j", .006)
        a.raw('<g class="spin" style="transform-origin:71px 437px"><path class="f" d="M71 437L71 414M71 437L91 448M71 437L51 448" pathLength="1" style="--t:%.2fs"/></g>' % a.t)
        a.t += .05
        a.C(71, 437, 22, "f", .05)
        a.p("M106 440H120", "f", .03)
        a.beat(4)
        a.p("M140 250H380M200 250V270M320 250V270", "f", .08)
        for (x, y) in ((179, 300), (341, 300)):
            for k in range(3):
                a.raw(f'<path class="air" d="M{x - 18} {y + k * 10}q9 -6 18 0t18 0" style="--d:{k * .3:.1f}s"/>')
        a.label(71, 404, "High-efficiency unit", 30, 380)
        a.label(260, 250, "Ductwork", 300, 120)
    elif v == "generator":
        a.R(32, 410, 78, 60, "w", .06, 5)
        for y in range(420, 462, 6):
            a.L(40, y, 72, y, "j", .006)
        a.p("M90 420l-8 16h10l-8 18", "f", .05)
        a.p("M110 446H120", "f", .03)
        a.beat(4)
        for x in (179, 341):
            a.light(x, 387, 7)
        a.light(260, 362, 4)
        a.label(71, 410, "Standby generator", 30, 385)
        a.label(341, 387, "Lights stay on", 430, 290)
    elif v == "plumbing":
        a.p("M150 470V300H210", "f", .06)
        a.p("M170 470V320H360V300", "f", .06)
        a.R(430, 376, 30, 80, "f", .05, 12)
        a.L(445, 376, 445, 360, "f", .02)
        a.beat(4)
        a.p("M210 300v-10h14", "f", .03)
        a.p("M360 300v-8", "f", .02)
        a.L(140, 470, 140, 505, "f", .03)
        a.L(140, 505, 90, 505, "f", .03)
        a.raw('<circle class="drip" cx="224" cy="296" r="2.6"/><circle class="drip" cx="360" cy="296" r="2.6" style="--d:.6s"/>')
        a.label(445, 410, "Water heater", 470, 520)
        a.label(170, 360, "New supply lines", 30, 245)
        a.label(110, 505, "Sewer line", 30, 530)
    elif v == "septic":
        a.p("M260 470V510H330", "f", .05)
        a.R(330, 492, 120, 50, "f", .06, 14)
        a.R(370, 482, 20, 10, "f", .02)
        a.beat(4)
        for k in range(4):
            a.L(460, 506 + k * 10, 568, 506 + k * 10, "f", .03)
        a.p("M450 506H460", "f", .02)
        for x in range(40, 570, 30):
            a.L(x, 472, x - 8, 486, "j", .002)
        a.label(390, 520, "Septic tank", 330, 575)
        a.label(520, 520, "Drain field", 470, 470)
    elif v == "electrical":
        a.R(128, 300, 24, 34, "f", .04, 2)
        a.p("M152 312H260V250M260 312H340V372", "f", .08)
        a.p("M200 312V430M300 312V430", "f", .06)
        a.beat(4)
        for x in (200, 300):
            a.R(x - 5, 430, 10, 14, "f", .02, 2)
        a.L(260, 250, 260, 236, "f", .02)
        a.light(260, 232, 6)
        a.light(232, 366, 4)
        a.light(288, 366, 4)
        a.light(474, 352, 4)
        a.label(140, 316, "Panel", 30, 300)
        a.label(260, 236, "New lighting", 300, 120)
        a.label(300, 437, "Outlets", 330, 520)
    elif v == "paintext":
        a.p("M440 120L520 190", "j", .04)
        a.R(512, 186, 30, 14, "f", .03, 3)
        a.p("M470 210c20 40 -10 80 10 130", "f", .06)
        a.beat(4)
        for (x, y) in ((140, 300), (370, 300), (430, 350), (150, 440), (520, 440)):
            a.p(f"M{x} {y}l8 6l-4 8l7 4", "old", .01)
        a.label(500, 300, "Fresh exterior paint", 430, 560)
        a.fill("M120 270H400V470H120z", acc, .42, "fill new")
        a.fill("M400 330H548V470H400z", acc, .42, "fill new")
    elif v == "wash":
        a.p("M560 520L470 420", "b", .05)
        a.R(462, 412, 12, 8, "f", .02)
        a.beat(4)
        for k in range(-3, 4):
            a.raw(f'<path class="spray" d="M466 414L{380 + k * 10} {330 + abs(k) * 6}" style="--d:{abs(k) * .08:.2f}s"/>')
        for (x, y) in ((140, 300), (180, 420), (330, 300), (350, 440), (430, 380), (510, 440), (230, 300), (280, 440)):
            a.cloud(x, y, 18, 10, "old", .01, 3)
        for (x, y, r) in ((180, 300, 7), (350, 300, 6), (290, 430, 6)):
            a.star(x, y, r)
        a.label(400, 350, "Soft wash and pressure wash", 300, 120)
    elif v == "fence":
        a.L(24, 446, 576, 446, "f", .06)
        a.L(24, 466, 576, 466, "f", .06)
        a.beat(4)
        for x in range(30, 572, 16):
            if 226 < x < 296:
                continue
            a.p(f"M{x} 470V432l4 -6l4 6V470", "f", .004)
        a.label(140, 440, "New fence", 30, 400)
    elif v == "insulation":
        a.p("M150 254" + "".join(f"l10 -10l10 10" for _ in range(11)), "f", .07)
        a.p("M175 232" + "".join(f"l10 -10l10 10" for _ in range(9)), "f", .06)
        a.beat(4)
        a.p("M200 210" + "".join(f"l10 -10l10 10" for _ in range(6)), "f", .05)
        a.label(260, 225, "Attic insulation", 430, 120)
    elif v == "chimney":
        for y in range(146, 184, 8):
            a.L(316, y, 342, y, "f", .01)
        a.R(310, 132, 38, 8, "f", .03)
        a.beat(4)
        a.p("M318 132V122H340V132", "f", .03)
        for k in range(3):
            a.raw(f'<path class="smoke" d="M329 118c-6 -10 6 -16 0 -26" style="--d:{k * .9:.1f}s"/>')
        a.label(330, 160, "Chimney sweep and repair", 380, 110)
    elif v == "pest":
        a.p("M110 476H558", "f", .08, ' stroke-dasharray="6 6"')
        a.beat(4)
        a.p("M300 90l70 26v50c0 40 -30 62 -70 78c-40 -16 -70 -38 -70 -78v-50z", "f", .1)
        a.p("M272 162l20 20l38 -40", "f", .05)
        a.label(500, 476, "Perimeter treatment", 430, 530)
    elif v == "junk":
        a.R(120, 420, 150, 40, "f", .06, 3)
        a.C(150, 466, 9, "b", .03)
        a.C(240, 466, 9, "b", .03)
        a.beat(4)
        a.R(132, 392, 40, 28, "f", .03)
        a.R(176, 380, 34, 40, "f", .03)
        a.p("M216 420l20 -40l20 40", "f", .03)
        a.label(200, 420, "Hauled away", 30, 360)
    else:  # general home
        a.R(150, 352, 58, 70, "f", .05)
        a.R(312, 352, 58, 70, "f", .05)
        a.beat(4)
        a.R(238, 372, 44, 98, "f", .05)
        a.label(260, 380, "Done right", 300, 520)

    # beat 6: lights on, fills, the finish
    a.beat(6, max(a.t, 3.0))
    if v not in ("generator", "electrical"):
        a.light(474, 352, 3.6)
    a.raw('<g class="sun"><circle cx="520" cy="90" r="22"/></g>')
    return a


# ============================================================================ the room (interior, one-point perspective)
def room(v, acc):
    a = Art()
    a.beat(1, 0)
    a.R(110, 120, 380, 270, "w", .14)
    a.L(110, 120, 30, 60, "b", .04)
    a.L(490, 120, 570, 60, "b", .04)
    a.L(110, 390, 30, 520, "w", .05)
    a.L(490, 390, 570, 520, "w", .05)
    a.L(30, 520, 570, 520, "w", .08)
    a.L(110, 376, 490, 376, "j", .03)
    a.fill("M110 120H490V390H110z", WALL, 1)
    a.fill("M110 390H490L570 520H30z", "#e4d6bf", 1)
    a.fill("M30 60L110 120V390L30 520z", "#e8dcc9", 1)
    a.fill("M570 60L490 120V390L570 520z", "#e8dcc9", 1)
    a.beat(2)
    a.R(320, 160, 130, 130, "b", .06)
    a.L(385, 160, 385, 290, "j", .02)
    a.L(320, 225, 450, 225, "j", .02)
    a.frect(320, 160, 130, 130, GLASS, 1)
    a.R(150, 170, 70, 56, "j", .04)
    a.p("M158 216l18 -22l14 14l10 -8l12 16", "j", .04)
    kitchen = v in ("cabinets", "kitchen")
    laundry = v == "appliance"
    if kitchen:
        a.R(120, 300, 360, 76, "w", .08)
        a.L(116, 300, 484, 300, "w", .03)
        for x in range(120, 480, 60):
            a.R(x + 4, 308, 52, 64, "b", .02)
            a.L(x + 26, 318, x + 34, 318, "j", .01)
        a.R(120, 130, 190, 80, "b", .06)
        for x in range(120, 310, 63):
            a.R(x + 4, 134, 55, 72, "j", .02)
        a.p("M210 300v-14h30v14", "j", .03)
        a.fill("M120 300H480V376H120z", "#d9cbb2", 1)
    elif laundry:
        for x in (170, 300):
            a.R(x, 250, 110, 126, "w", .07, 6)
            a.L(x, 278, x + 110, 278, "j", .02)
            a.C(x + 55, 330, 34, "b", .05)
            a.C(x + 55, 330, 24, "j", .03)
            a.C(x + 18, 264, 4, "j", .01)
            a.C(x + 34, 264, 4, "j", .01)
        a.fill("M170 250h110v126h-110zM300 250h110v126h-110z", "#f7f4ee", 1)
    else:
        # sofa, lamp, plant, rug
        a.p("M140 376V330q0 -12 12 -12H318q12 0 12 12V376", "w", .07)
        a.p("M150 318V292q0 -10 10 -10H310q10 0 10 10V318", "b", .06)
        a.L(235, 282, 235, 330, "j", .02)
        a.p("M132 376V338q0 -10 10 -10h8v48M338 376V338q0 -10 -10 -10h-8v48", "b", .05)
        a.L(372, 376, 372, 262, "b", .04)
        a.poly([(354, 262), (362, 232), (382, 232), (390, 262)], "b", .04, close=True)
        a.p("M456 376l-8 -30h36l-8 30z", "b", .03)
        a.p("M466 346c-10 -24 -30 -30 -32 -50c18 4 30 22 32 50c2 -30 14 -46 30 -54c0 24 -18 34 -30 54", "j", .04)
        a.fill("M140 376V330q0 -12 12 -12H318q12 0 12 12V376z", "#a8a39a", .9)
        a.fill("M150 318V292q0 -10 10 -10H310q10 0 10 10V318z", "#bdb8ae", .9)
    a.beat(3)
    if v in ("flooring", "hardwood", "lvp"):
        vx, vy = 300, 81
        for k in range(-7, 8):
            x0 = 300 + k * 27
            x1 = vx + (x0 - vx) * (520 - vy) / (390 - vy)
            a.L(x0, 390, x1, 520, "f", .015)
        a.beat(4)
        for (y, off) in ((415, 0), (442, 1), (472, 0), (500, 1)):
            f = (y - vy) / (390 - vy)
            for k in range(-6, 7, 2):
                x = 300 + (k + off + .5) * 27 * f
                a.L(x - 5 * f, y, x + 5 * f, y, "j", .004)
        a.label(220, 470, "New plank floors", 30, 560)
        a.fill("M110 390H490L570 520H30z", acc, .35, "fill new")
    elif v == "tile":
        vx, vy = 300, 81
        for k in range(-6, 7):
            x0 = 300 + k * 32
            x1 = vx + (x0 - vx) * (520 - vy) / (390 - vy)
            a.L(x0, 390, x1, 520, "f", .015)
        a.beat(4)
        for y in (410, 436, 468, 505):
            f = (y - vy) / (390 - vy)
            a.L(300 - 190 * f, y, 300 + 190 * f, y, "f", .02)
        a.R(150, 300, 160, 76, "f", .04)
        for x in range(150, 310, 20):
            a.L(x, 300, x, 376, "j", .004)
        a.label(220, 460, "Tile floors", 30, 560)
        a.label(230, 300, "Backsplash", 30, 260)
    elif v in ("carpet", "carpetclean"):
        for k in range(14):
            y = 398 + k * 9
            f = (y - 81) / (390 - 81)
            a.L(300 - 190 * f, y, 300 + 190 * f, y, "f" if v == "carpetclean" and k % 2 else "j", .01)
        a.beat(4)
        if v == "carpetclean":
            a.p("M520 300L430 470", "b", .05)
            a.R(404, 466, 50, 12, "f", .03, 4)
            for (x, y) in ((180, 430), (250, 480), (360, 450), (120, 500), (430, 420)):
                a.cloud(x, y, 22, 9, "old", .01, 4)
            for (x, y, r) in ((200, 440, 8), (380, 470, 7)):
                a.star(x, y, r)
            a.label(430, 470, "Hot-water extraction", 400, 560)
        else:
            a.label(240, 470, "New carpet", 30, 560)
        a.fill("M110 390H490L570 520H30z", acc, .3, "fill new")
    elif v == "clean":
        a.p("M500 520V430h30v90", "b", .04)
        a.p("M515 430V300", "b", .04)
        a.p("M490 300h50l-6 -14h-38z", "f", .03)
        a.R(52, 470, 46, 50, "b", .04, 4)
        a.p("M58 470q17 -26 34 0", "j", .02)
        a.beat(4)
        for (x, y) in ((200, 300), (360, 340), (250, 450), (430, 480), (150, 500), (420, 180), (220, 200)):
            a.cloud(x, y, 18, 8, "old", .01, 3)
        a.p("M120 130q16 10 0 26q18 2 14 22", "old", .02)
        for (x, y, r) in ((200, 300, 10), (360, 330, 8), (260, 452, 12), (430, 470, 8), (420, 180, 9), (150, 495, 7), (240, 200, 7)):
            a.star(x, y, r)
        a.label(260, 452, "Spotless, top to bottom", 300, 570)
    elif v == "paintint":
        a.p("M114 124H486M114 386H486", "f", .05, ' stroke-dasharray="3 5"')
        a.p("M230 200V120", "j", .03)
        a.beat(4)
        a.p("M230 200h40v-16h-40z", "f", .03)
        a.p("M250 200v26h-6v60", "b", .04)
        a.R(400, 488, 70, 22, "b", .03, 3)
        a.label(170, 260, "Fresh coat", 30, 560)
        a.fill("M110 120H490V390H110z", acc, .4, "fill new")
    elif v == "drywall":
        for x in (206, 302, 398):
            a.L(x, 120, x, 376, "f", .04)
        a.L(110, 248, 490, 248, "f", .05)
        a.beat(4)
        for x in (206, 302, 398):
            for y in range(140, 376, 24):
                a.raw(f'<circle class="dot" cx="{x - 8}" cy="{y}" r="1.4"/><circle class="dot" cx="{x + 8}" cy="{y}" r="1.4"/>')
        a.p("M300 470l50 -40h40l-50 40z", "f", .04)
        a.label(302, 200, "Taped and finished seams", 300, 100)
    elif kitchen:
        for x in range(120, 480, 60):
            a.R(x + 4, 308, 52, 64, "f", .03)
        for x in range(120, 310, 63):
            a.R(x + 4, 134, 55, 72, "f", .02)
        a.beat(4)
        a.L(116, 300, 484, 300, "f", .04)
        a.R(340, 280, 60, 20, "b", .03)
        a.light(170, 116, 4)
        a.light(260, 116, 4)
        a.label(300, 340, "Custom cabinets", 30, 560)
        a.fill("M120 300H480V376H120z", acc, .45, "fill new")
    elif laundry:
        for x in (170, 300):
            a.C(x + 55, 330, 34, "f", .05)
        a.beat(4)
        a.raw('<g class="spin" style="transform-origin:225px 330px"><path class="f" d="M225 330l0 -20M225 330l17 10M225 330l-17 10" pathLength="1" style="--t:%.2fs"/></g>' % a.t)
        a.t += .05
        a.p("M430 300l20 -20l14 14l-20 20z", "f", .03)
        a.L(444, 314, 480, 350, "b", .03)
        a.label(225, 300, "Back up and running", 30, 560)
    elif v == "upholstery":
        a.p("M140 376V330q0 -12 12 -12H318q12 0 12 12V376", "f", .07)
        a.p("M150 318V292q0 -10 10 -10H310q10 0 10 10V318", "f", .06)
        a.beat(4)
        for x in range(160, 320, 16):
            a.L(x, 286, x, 316, "j", .005)
        a.p("M400 470l60 -50", "b", .03)
        a.p("M440 470q30 -40 60 0", "f", .03)
        a.label(240, 330, "Reupholstered", 30, 560)
        a.fill("M140 376V330q0 -12 12 -12H318q12 0 12 12V376z", acc, .55, "fill new")
        a.fill("M150 318V292q0 -10 10 -10H310q10 0 10 10V318z", acc, .4, "fill new")
    else:  # handyman
        a.L(130, 250, 290, 250, "f", .04)
        a.p("M150 250v12l8 -12M270 250v12l-8 -12", "f", .03)
        a.R(150, 232, 20, 18, "j", .02)
        a.R(176, 226, 14, 24, "j", .02)
        a.beat(4)
        a.R(400, 470, 90, 40, "f", .04, 3)
        a.p("M425 470v-10h40v10", "f", .02)
        a.R(170, 150, 120, 14, "f", .03, 4)
        a.C(230, 157, 4, "f", .01)
        a.p("M90 520l40 -60h14l-30 60", "b", .03)
        a.label(230, 150, "Hung level", 300, 100)
        a.label(445, 480, "Fix-it list, done", 380, 570)
    a.beat(6, max(a.t, 3.0))
    if not kitchen and not laundry and v not in ("clean",):
        a.light(372, 248, 6)
    return a


# ============================================================================ the site plan (top-down)
def plan(v, acc):
    a = Art()
    a.beat(1, 0)
    a.p("M40 40H560V500H40z", "j", .1, ' stroke-dasharray="8 6"')
    a.L(24, 524, 576, 524, "b", .04)
    a.L(24, 584, 576, 584, "b", .04)
    for x in range(40, 560, 60):
        a.L(x, 554, x + 30, 554, "j", .005)
    a.L(24, 512, 576, 512, "j", .03)
    a.poly([(140, 230), (420, 230), (420, 260), (510, 260), (510, 380), (140, 380)], "w", .12, close=True)
    for k in range(9):
        a.L(140 + k * 31, 230, 140 + k * 31 + 30, 380, "j", .004)
    a.fill("M140 230H420V260H510V380H140z", "#d7cfc2", 1)
    a.fill("M40 40H560V500H40z", GRASS, .55)
    # north arrow and scale
    a.p("M532 60l10 30l-10 -8l-10 8z", "b", .03)
    a.raw('<text x="532" y="112" text-anchor="middle" class="nn">N</text>')
    a.p("M60 480h80M60 474v12M100 476v8M140 474v12", "j", .03)
    a.beat(2)
    drive = (432, 380, 70, 132)
    a.R(*drive, "b", .05)
    a.p("M282 380V512", "b", .03)
    a.p("M262 380V512", "b", .03)
    for (x, y, r) in ((90, 110, 40), (500, 120, 46), (86, 420, 34)):
        a.cloud(x, y, r * 2, r * 2, "b", .05, 7)
        a.C(x, y, 3, "j", .01)
        a.fcirc(x, y, r, "#a9bd8c", .9)
    a.beat(3)
    if v == "concrete":
        a.R(*drive, "f", .05)
        for y in range(412, 512, 33):
            a.L(432, y, 502, y, "f", .02)
        a.L(467, 380, 467, 512, "f", .02)
        a.R(200, 150, 140, 80, "f", .05)
        a.L(270, 150, 270, 230, "f", .02)
        a.L(200, 190, 340, 190, "f", .02)
        a.beat(4)
        for y in range(386, 510, 6):
            a.L(436, y, 462, y, "j", .002)
        a.R(262, 380, 20, 132, "f", .04)
        a.label(467, 440, "New driveway", 300, 470)
        a.label(270, 190, "Patio slab", 380, 170)
        a.frect(432, 380, 70, 132, acc, .35, "fill new")
        a.frect(200, 150, 140, 80, acc, .35, "fill new")
    elif v in ("masonry", "hardscape", "pavers"):
        a.C(270, 150, 62, "f", .07)
        a.C(270, 150, 16, "f", .03)
        a.p("M205 104a80 80 0 0 1 130 0", "f", .05)
        a.beat(4)
        a.raw('<g clip-path="url(#pit)">' + "".join(f'<path class="j" d="M{180 + k * 12} 90L{250 + k * 12} 220" pathLength="1" style="--t:{a.t:.2f}s"/>' for k in range(-2, 14)) + "</g>")
        a.extra.append('<defs><clipPath id="pit"><path d="M208 150a62 62 0 1 0 124 0a62 62 0 1 0 -124 0zM254 150a16 16 0 1 1 32 0a16 16 0 1 1 -32 0z" clip-rule="evenodd"/></clipPath></defs>')
        a.t += .2
        a.R(250, 212, 40, 18, "f", .03)
        a.light(214, 108, 3.5)
        a.light(326, 108, 3.5)
        a.label(270, 150, "Fire pit", 380, 70)
        a.label(206, 104, "Seat wall", 60, 190)
        a.fcirc(270, 150, 62, acc, .35, "fill new")
    elif v == "excavation":
        for k in range(5):
            a.p(f"M40 {60 + k * 30}C160 {40 + k * 28} 300 {90 + k * 26} 560 {54 + k * 24}", "f", .05)
        a.beat(4)
        a.p("M200 110H360V200H200z", "f", .05, ' stroke-dasharray="6 5"')
        a.p("M150 300", "j", .01)
        a.cloud(470, 220, 60, 34, "f", .04, 5)
        a.label(280, 155, "Cut and graded pad", 330, 30)
        a.label(470, 220, "Spoils", 470, 160)
    elif v in ("landscape", "landscaping"):
        a.p("M130 400C160 430 240 440 262 400", "f", .06)
        a.p("M282 400C320 440 400 430 430 400", "f", .06)
        a.p("M150 226C180 190 260 200 300 226", "f", .05)
        a.beat(4)
        for (x, y) in ((160, 410), (190, 420), (222, 418), (310, 418), (350, 422), (392, 412), (180, 214), (230, 206), (276, 216)):
            a.cloud(x, y, 18, 18, "f", .015, 5)
        a.label(200, 420, "New beds and plants", 60, 470)
        a.label(240, 210, "Edged and mulched", 300, 160)
    elif v in ("lawn", "lawncare", "mowing"):
        for k in range(10):
            a.L(44 + k * 44, 44, 44 + k * 44, 226, "f", .02)
        a.beat(4)
        for k in range(9):
            x = 44 + k * 44
            if 250 < x < 290 or 425 < x < 510:
                continue
            a.L(x, 384, x, 496, "f", .015)
        a.label(200, 120, "Mowed in clean lines", 300, 30)
    elif v == "fence":
        a.p("M140 230V44H560", "f", .07)
        a.p("M510 260V44", "f", .04)
        a.beat(4)
        for y in range(44, 230, 20):
            a.raw(f'<circle class="dot" cx="140" cy="{y}" r="2.4"/>')
        for x in range(140, 560, 20):
            a.raw(f'<circle class="dot" cx="{x}" cy="44" r="2.4"/>')
        a.p("M140 150l26 -18", "f", .02)
        a.label(330, 44, "New fence line", 300, 24)
        a.label(150, 140, "Gate", 60, 170)
    elif v == "deck":
        a.R(200, 130, 170, 100, "f", .06)
        a.beat(4)
        for y in range(136, 230, 8):
            a.L(200, y, 370, y, "f", .004)
        a.p("M260 130v-20h50v20", "f", .03)
        a.label(285, 180, "New deck", 400, 150)
        a.frect(200, 130, 170, 100, acc, .4, "fill new")
    elif v == "sealcoat":
        a.R(*drive, "f", .05)
        a.beat(4)
        for y in range(384, 512, 6):
            a.L(434, y, 500, y, "f", .002)
        a.label(467, 440, "Sealcoated driveway", 300, 470)
        a.frect(432, 380, 70, 132, "#3a3a3d", .8, "fill new")
    elif v == "irrigation":
        a.p("M60 470H300V390M60 470V60H540V220", "f", .08, ' stroke-dasharray="7 5"')
        a.beat(4)
        for (x, y) in ((60, 60), (300, 60), (540, 60), (60, 220), (540, 220), (60, 470), (300, 470)):
            a.C(x, y, 6, "f", .01)
        a.label(300, 60, "Sprinkler zones", 300, 24)
    a.beat(6, max(a.t, 3.0))
    return a


# ============================================================================ the salon station
def salon(v, acc):
    a = Art()
    a.beat(1, 0)
    a.L(24, 510, 576, 510, "w", .1)
    a.fill("M24 510H576V530H24z", "#d8cdbd", 1)
    nails, spa = v == "nails", v in ("spa", "massage", "lash", "wax", "facial")
    if not nails and not spa:
        a.p("M200 330V210a100 100 0 0 1 200 0V330z", "w", .12)
        a.p("M212 322V212a88 88 0 0 1 176 0V322z", "j", .06)
        a.fill("M212 322V212a88 88 0 0 1 176 0V322z", GLASS, 1)
        a.R(160, 330, 280, 16, "w", .05)
        a.L(176, 346, 176, 400, "b", .03)
        a.L(424, 346, 424, 400, "b", .03)
        a.beat(2)
        a.E(300, 500, 70, 10, "b", .04)
        a.R(294, 432, 12, 64, "b", .03)
        a.p("M230 432q0 -14 14 -14h112q14 0 14 14v8H230z", "w", .05)
        a.p("M246 418V330q0 -26 26 -26h56q26 0 26 26V418", "w", .06)
        a.p("M224 404h-12v-20h34M376 404h12v-20h-34", "b", .04)
        a.fill("M246 418V330q0 -26 26 -26h56q26 0 26 26V418z", "#6e6760", .9)
        a.fill("M230 432q0 -14 14 -14h112q14 0 14 14v8H230z", "#6e6760", .9)
        if v == "barber":
            a.R(276, 284, 48, 22, "b", .03, 8)
        for x in (190, 410):
            a.L(x, 24, x, 80, "j", .03)
            a.p(f"M{x - 16} 96l6 -16h20l6 16z", "b", .03)
    elif nails:
        for y in (150, 200, 250):
            a.L(140, y, 460, y, "b", .04)
        a.R(150, 380, 300, 16, "w", .05, 3)
        a.L(170, 396, 170, 510, "b", .03)
        a.L(430, 396, 430, 510, "b", .03)
        a.beat(2)
        a.p("M240 380q-6 -24 18 -26l34 -2q12 0 12 10t-12 10h-20", "b", .05)
        a.p("M268 352q4 -16 16 -18M282 352q6 -18 18 -20M296 354q8 -14 18 -14", "j", .04)
        a.E(270, 380, 50, 6, "j", .02)
        a.p("M360 380v-28a32 32 0 0 1 64 0v28", "b", .04)
    else:
        a.R(110, 380, 380, 22, "w", .06, 8)
        a.p("M490 386h40q14 0 14 14v4q0 10 -14 10h-40", "b", .04)
        for x in (140, 460):
            a.p(f"M{x} 402l-14 108M{x} 402l14 108", "b", .03)
        a.beat(2)
        a.C(470, 170, 56, "b", .06)
        a.C(470, 170, 46, "j", .03)
        a.p("M70 510l-8 -40h52l-8 40z", "b", .03)
        a.p("M88 470c-14 -40 -40 -50 -40 -86c26 8 40 40 40 86c2 -46 20 -70 46 -80c0 40 -28 56 -46 80", "j", .04)
        a.fill("M110 380h380v22h-380z", "#ece4d6", 1)
    a.beat(3)
    if v == "barber":
        a.R(486, 150, 30, 210, "b", .05, 6)
        a.raw('<g clip-path="url(#pole)"><g class="pole">' + "".join(
            f'<path class="f" d="M480 {130 + k * 30}l42 -36" pathLength="1" style="--t:{a.t + k * .02:.2f}s"/>' for k in range(10)) + "</g></g>")
        a.extra.append('<defs><clipPath id="pole"><rect x="488" y="152" width="26" height="206" rx="4"/></clipPath></defs>')
        a.t += .3
        a.p("M480 150h42M480 360h42", "b", .03)
        a.beat(4)
        a.R(196, 312, 34, 18, "f", .03, 4)
        a.p("M196 318h-10", "f", .02)
        a.p("M360 330l30 -20M360 314l30 20", "f", .03)
        a.C(356, 312, 5, "f", .01)
        a.C(356, 330, 5, "f", .01)
        a.label(500, 250, "Barber pole", 430, 450)
        a.label(212, 318, "Clipper cuts and fades", 30, 120)
    elif v == "nails":
        for k, x in enumerate((170, 196, 222, 330, 356, 382, 408)):
            a.R(x, 226, 16, 22, "b", .015, 3)
            a.R(x + 4, 214, 8, 12, "f", .01)
        for k, x in enumerate((160, 186, 212, 238, 340, 366, 392, 418)):
            a.R(x, 176, 16, 22, "b", .01, 3)
            a.R(x + 4, 164, 8, 12, "f", .008)
        a.beat(4)
        a.p("M308 342l10 -6M318 340l10 -6", "f", .02)
        a.light(392, 350, 4)
        a.label(220, 226, "Polish wall", 30, 120)
        a.label(392, 360, "Gel and dip", 440, 450)
    elif spa:
        a.p("M220 380v-10h100v10M232 370v-8h76v8", "f", .04)
        a.E(370, 366, 22, 9, "f", .02)
        a.E(372, 350, 17, 7, "f", .02)
        a.E(370, 337, 12, 5, "f", .02)
        a.beat(4)
        a.R(510, 330, 22, 36, "f", .03, 3)
        a.L(521, 330, 521, 320, "j", .01)
        a.light(521, 316, 4)
        for k in range(3):
            a.raw(f'<path class="smoke" d="M{514 + k * 7} 304c-6 -10 6 -16 0 -26" style="--d:{k * .9:.1f}s"/>')
        a.label(370, 340, "Hot stone", 400, 270)
        a.label(270, 372, "Fresh linens", 160, 450)
    else:  # salon
        a.p("M190 320v-20q0 -16 16 -16h26v20h-12v16", "f", .04)
        a.p("M232 288h18", "f", .02)
        a.p("M380 330v-30h20v30", "f", .03)
        a.p("M376 300h28", "f", .02)
        a.beat(4)
        a.p("M262 222c10 -30 66 -30 76 0c8 26 -6 60 -38 70c-32 -10 -46 -44 -38 -70z", "f", .06)
        a.p("M270 230c16 -10 44 -10 60 0", "f", .03)
        a.label(206, 300, "Blowouts", 30, 120)
        a.label(300, 250, "Color and cuts", 440, 120, "start")
    a.beat(6, max(a.t, 3.0))
    if not nails and not spa:
        a.light(190, 100, 5)
        a.light(410, 100, 5)
    return a


# ============================================================================ the pet studio
DOG = ("M230 300c-8 -30 10 -52 36 -56c10 -24 40 -32 56 -16c14 -4 26 6 24 20c-2 10 -12 14 -22 12"
       "c-4 10 -4 24 4 36h92c26 0 40 20 40 44c18 -2 30 -18 30 -38c10 8 10 34 -6 50c-8 10 -22 14 -30 14"
       "v56h-18v-46h-80v46h-18v-50c-14 -6 -28 -6 -40 0v50h-18v-58c-26 -12 -40 -38 -40 -64z")


def pet(v, acc):
    a = Art()
    a.beat(1, 0)
    a.L(24, 510, 576, 510, "w", .1)
    a.fill("M24 510H576V530H24z", "#d8cdbd", 1)
    if v in ("training",):
        a.p("M380 510V420M520 510V420M380 440H520", "w", .08)
        a.p("M90 510l20 -50l20 50z", "b", .04)
        a.beat(2)
        a.raw(f'<g transform="translate(-120 90) scale(.9)"><path class="w" d="{DOG}" pathLength="1" style="--t:{a.t:.2f}s"/></g>')
        a.t += .3
    elif v in ("boarding", "daycare", "petsit"):
        a.p("M360 510V380l80 -70l80 70V510", "w", .1)
        a.p("M420 510v-60a20 20 0 0 1 40 0v60", "b", .04)
        a.fill("M360 510V380l80 -70l80 70V510z", "#d9c7a8", 1)
        a.beat(2)
        a.raw(f'<g transform="translate(-140 86) scale(.88)"><path class="w" d="{DOG}" pathLength="1" style="--t:{a.t:.2f}s"/></g>')
        a.t += .3
    else:
        a.R(170, 470, 300, 14, "w", .05, 3)
        a.L(190, 484, 190, 510, "b", .02)
        a.L(450, 484, 450, 510, "b", .02)
        a.p("M450 470V170H330", "b", .06)
        a.p("M330 170v40", "j", .03)
        a.beat(2)
        a.raw(f'<g transform="translate(-10 82) scale(.86)"><path class="w" d="{DOG}" pathLength="1" style="--t:{a.t:.2f}s"/></g>')
        a.t += .3
    a.beat(3)
    if v == "training":
        a.R(96, 420, 40, 30, "f", .03, 6)
        a.p("M380 440h140", "f", .04)
        a.beat(4)
        a.p("M210 330q30 -60 90 -40", "f", .05, ' stroke-dasharray="4 6"')
        a.label(450, 440, "Obedience and agility", 380, 380)
    elif v in ("boarding", "daycare", "petsit"):
        a.E(120, 500, 30, 8, "f", .03)
        a.p("M90 500v-10h60v10", "f", .02)
        a.p("M250 480l14 -10l14 10l-14 10z", "f", .02)
        a.beat(4)
        a.p("M380 380h120", "f", .03)
        a.light(440, 340, 4)
        a.label(120, 495, "Fed on schedule", 30, 420)
        a.label(440, 360, "Safe, cozy stay", 440, 260)
    else:
        a.p("M120 470v-80q0 -20 20 -20h10", "f", .05)
        a.R(98, 470, 44, 40, "f", .03, 4)
        a.p("M500 300l30 -20M500 284l30 20", "f", .03)
        a.C(496, 284, 6, "f", .01)
        a.C(496, 300, 6, "f", .01)
        a.beat(4)
        for (x, y, r) in ((240, 250, 9), (270, 220, 6), (330, 236, 8), (220, 212, 5)):
            a.C(x, y, r, "f", .01)
        a.p("M262 218l-10 -10l-10 10l10 10z", "f", .02)
        a.label(150, 380, "Bath and blow-dry", 30, 300)
        a.label(512, 292, "Breed cuts", 470, 380)
    a.beat(6, max(a.t, 3.0))
    return a


# ============================================================================ the cake / kitchen table
def cake(v, acc):
    a = Art()
    a.beat(1, 0)
    a.L(24, 470, 576, 470, "w", .1)
    a.p("M24 470v40M576 470v40", "b", .02)
    a.fill("M24 470H576V510H24z", "#e9dfcf", 1)
    if v in ("catering",):
        a.R(130, 400, 160, 58, "w", .06, 6)
        a.p("M130 400q80 -60 160 0", "w", .05)
        a.L(210, 352, 210, 342, "b", .02)
        a.R(330, 410, 140, 48, "w", .05, 6)
        a.p("M330 410q70 -50 140 0", "w", .05)
        a.beat(2)
        a.p("M150 458l-6 12M270 458l6 12M350 458l-6 12M450 458l6 12", "b", .03)
        for k in range(3):
            a.raw(f'<path class="smoke" d="M{190 + k * 20} 330c-6 -10 6 -16 0 -26" style="--d:{k * .8:.1f}s"/>')
        a.fill("M130 400h160v58h-160zM330 410h140v48h-140z", "#c9c3bb", 1)
    elif v in ("coffee",):
        a.p("M220 330h150v70q0 50 -50 50h-50q-50 0 -50 -50z", "w", .08)
        a.p("M370 350h20q24 0 24 24t-24 24h-24", "b", .04)
        a.E(295, 462, 120, 8, "b", .04)
        a.beat(2)
        for k in range(3):
            a.raw(f'<path class="smoke" d="M{270 + k * 24} 316c-8 -14 8 -22 0 -36" style="--d:{k * .8:.1f}s"/>')
        a.fill("M220 330h150v70q0 50 -50 50h-50q-50 0 -50 -50z", "#f3eee6", 1)
    elif v in ("bakery", "bread"):
        a.p("M140 460q-10 -60 60 -70q80 -6 90 50q2 20 -10 20z", "w", .08)
        a.p("M170 420l20 -20M200 420l20 -20M230 420l20 -20", "j", .03)
        a.p("M330 460q-8 -40 50 -48q66 -4 74 36q2 12 -10 12z", "w", .06)
        a.beat(2)
        a.R(470, 340, 70, 120, "b", .05, 10)
        a.L(470, 360, 540, 360, "j", .02)
        a.fill("M140 460q-10 -60 60 -70q80 -6 90 50q2 20 -10 20z", "#d9a96a", .9)
        a.fill("M330 460q-8 -40 50 -48q66 -4 74 36q2 12 -10 12z", "#d9a96a", .9)
    else:  # cake
        a.E(300, 430, 110, 12, "w", .05)
        a.p("M290 442v20h20v-20M270 470l10 -8h40l10 8", "b", .04)
        a.R(212, 356, 176, 70, "w", .07, 4)
        a.beat(2)
        a.R(238, 292, 124, 64, "w", .06, 4)
        a.R(262, 236, 76, 56, "w", .05, 4)
        a.fill("M212 356h176v70h-176zM238 292h124v64h-124zM262 236h76v56h-76z", "#f6efe6", 1)
    a.beat(3)
    if v == "catering":
        a.p("M120 340l50 -10", "f", .03)
        for (x, y) in ((360, 430), (400, 430), (440, 430)):
            a.C(x, y, 6, "f", .01)
        a.beat(4)
        a.p("M480 470v-50l20 -20l20 20v50", "f", .04)
        a.label(210, 400, "Hot, on time", 60, 300)
        a.label(400, 410, "Full spreads", 420, 330)
    elif v == "coffee":
        a.p("M240 350h110", "f", .03)
        a.p("M278 372q18 -14 36 0q-18 14 -36 0z", "f", .03)
        a.beat(4)
        for (x, y) in ((120, 450), (150, 440), (450, 450), (480, 444)):
            a.E(x, y, 9, 6, "f", .01)
        a.label(296, 372, "Latte art", 60, 300)
    elif v in ("bakery", "bread"):
        a.p("M140 460q60 -14 150 0", "f", .03)
        for (x, y) in ((490, 390), (520, 410), (500, 430)):
            a.C(x, y, 9, "f", .01)
        a.beat(4)
        a.p("M100 440h-60M100 430l10 10l-10 10", "f", .03)
        a.label(220, 410, "Fresh every morning", 60, 300)
        a.label(505, 360, "Cookies", 460, 300)
    else:
        for (y0, x0, x1) in ((356, 212, 388), (292, 238, 362), (236, 262, 338)):
            n = int((x1 - x0) / 12)
            d = f"M{x0} {y0}" + "".join(f"q6 {12 + (k % 3) * 4} 12 0" for k in range(n))
            a.p(d, "f", .04)
        a.beat(4)
        for (x, y) in ((240, 400), (270, 380), (320, 410), (350, 388), (260, 330), (330, 324)):
            a.C(x, y, 2.2, "f", .004)
        a.p("M300 236v-26", "b", .02)
        a.light(300, 204, 5)
        a.p("M286 224c-10 -14 -2 -30 14 -30c16 0 24 16 14 30", "f", .03)
        a.label(388, 380, "Custom tiers", 440, 300)
        a.label(300, 230, "Your topper", 380, 180)
        a.fill("M212 356h176v14h-176zM238 292h124v12h-124zM262 236h76v10h-76z", acc, .6, "fill new")
    a.beat(6, max(a.t, 3.0))
    return a


# ============================================================================ the workbench (shops and studios)
def bench(v, acc):
    a = Art()
    a.beat(1, 0)
    pegs = v not in ("photo", "dance", "daycare", "florist", "martial", "gym")
    if pegs:
        a.R(60, 80, 480, 250, "b", .08, 4)
        for y in range(100, 330, 20):
            a.raw("".join(f'<circle class="dot" cx="{x}" cy="{y}" r="1.2"/>' for x in range(80, 540, 20)))
        a.fill("M60 80h480v250h-480z", "#e2d6c2", 1)
    if v != "photo":
        a.R(40, 400, 520, 18, "w", .06, 3)
        a.p("M70 418V520M530 418V520", "w", .04)
        a.fill("M40 400h520v18h-520z", "#b99a73", 1)
    a.L(24, 520, 576, 520, "w", .06)
    a.beat(2)
    if pegs:
        a.p("M110 120v70M96 120h28", "b", .03)
        a.p("M170 120l-8 70l16 0z", "j", .03)
        a.p("M470 120c10 0 16 8 16 16s-6 16 -16 16v40", "b", .04)
    a.beat(3)
    if v == "photo":
        a.p("M120 60v380M480 60v380M110 60h380", "b", .06)
        a.p("M130 70h340v330q0 60 60 80", "j", .04)
        a.p("M300 400l-60 118M300 400l60 118M300 400v118", "b", .05)
        a.R(250, 330, 100, 64, "w", .05, 8)
        a.C(300, 362, 22, "f", .04)
        a.C(300, 362, 12, "f", .02)
        a.beat(4)
        a.R(270, 318, 26, 12, "f", .02, 3)
        a.light(330, 344, 4)
        a.p("M70 200l40 -20v80l-40 -20z", "f", .04)
        a.L(90, 260, 90, 520, "b", .03)
        a.label(300, 362, "Sessions that look like you", 340, 560)
    elif v == "locksmith":
        a.C(220, 300, 40, "f", .05)
        a.C(220, 300, 16, "f", .02)
        a.p("M260 300h160v20h-20v20h-20v-20h-20v20h-20v-20h-80", "f", .06)
        a.beat(4)
        a.p("M440 400v-50a30 30 0 0 1 60 0v50", "f", .04)
        a.R(430, 360, 80, 40, "b", .03, 6)
        a.label(330, 320, "Keys cut", 330, 470)
        a.label(470, 330, "Locks fixed", 440, 250)
    elif v in ("tailor", "alterations", "sewing"):
        a.p("M130 400v-90h170q30 0 30 30v60", "w", .06)
        a.p("M130 310v-40h230v40", "b", .04)
        a.p("M290 340v40", "f", .03)
        a.beat(4)
        a.p("M460 520v-90M430 300c0 -40 60 -40 60 0c0 30 -14 50 -10 90h-40c4 -40 -10 -60 -10 -90z", "f", .06)
        a.p("M200 290q30 30 60 0", "f", .03)
        a.label(220, 330, "Hems and fittings", 30, 470)
        a.label(460, 360, "Alterations", 470, 250)
    elif v == "welding":
        a.p("M200 400l40 -60h140l40 60", "b", .05)
        a.p("M380 300l-60 60", "f", .04)
        a.R(370, 280, 30, 14, "f", .02, 3)
        a.beat(4)
        for k in range(9):
            ang = -math.pi * (0.1 + 0.8 * k / 8)
            a.raw(f'<path class="spark" d="M320 360l{40 * math.cos(ang):.1f} {40 * math.sin(ang):.1f}" style="--d:{k * .12:.2f}s"/>')
        a.light(320, 360, 6)
        a.label(300, 370, "Custom welding", 30, 470)
    elif v in ("smallengine", "mower"):
        a.R(220, 440, 200, 50, "w", .06, 8)
        a.C(250, 494, 20, "b", .03)
        a.C(390, 494, 20, "b", .03)
        a.p("M400 440l80 -110h30", "b", .04)
        a.beat(4)
        a.R(280, 412, 70, 28, "f", .03, 4)
        a.p("M500 330h20", "f", .02)
        a.p("M100 400v-50h50v50", "f", .03)
        a.label(316, 412, "Engines tuned", 30, 360)
    elif v == "appliance":
        a.R(200, 230, 150, 170, "w", .07, 6)
        a.C(275, 320, 50, "b", .05)
        a.C(275, 320, 36, "j", .03)
        a.beat(4)
        a.raw('<g class="spin" style="transform-origin:275px 320px"><path class="f" d="M275 320v-28M275 320l24 14M275 320l-24 14" pathLength="1" style="--t:%.2fs"/></g>' % a.t)
        a.t += .05
        a.p("M400 400l30 -60l14 8l-30 60", "f", .03)
        a.label(275, 260, "Repairs on all major brands", 330, 470)
    elif v == "florist":
        a.p("M260 400l-14 -110h108l-14 110z", "w", .06)
        a.beat(4)
        for (x, y, r) in ((240, 190, 22), (300, 160, 26), (360, 196, 22), (270, 230, 18), (334, 236, 18)):
            a.p(f"M300 290Q{(300 + x) / 2} {y + 40} {x} {y}", "j", .02)
            a.C(x, y, r, "f", .03)
            a.C(x, y, r * .35, "f", .01)
        a.label(300, 160, "Arrangements for any day", 330, 80)
    elif v == "daycare":
        a.R(80, 90, 440, 220, "b", .06, 6)
        a.raw('<text x="300" y="220" text-anchor="middle" class="big">A B C</text>')
        a.beat(4)
        for k, (x, y) in enumerate(((180, 350), (226, 350), (203, 304))):
            a.R(x, y, 44, 44, "f", .03, 4)
        a.C(420, 370, 28, "f", .04)
        a.p("M392 370h56M420 342v56", "j", .02)
        a.label(225, 330, "Learning through play", 30, 470)
    elif v == "martial":
        a.p("M300 40v60", "b", .03)
        a.p("M260 100h80v170q0 30 -40 30t-40 -30z", "w", .07)
        a.beat(4)
        a.p("M120 400v-30h80v30", "f", .03)
        a.p("M160 370v-20l-20 -20M160 350l20 -20", "f", .03)
        a.p("M260 170h80", "f", .03)
        a.label(300, 170, "Classes for every age", 360, 470)
    elif v == "dance":
        a.L(60, 230, 540, 230, "w", .06)
        for x in (80, 300, 520):
            a.L(x, 230, x, 400, "b", .03)
        a.beat(4)
        a.p("M200 400q-30 -10 -20 -40q30 0 40 30z", "f", .03)
        a.p("M250 400q-30 -10 -20 -40q30 0 40 30z", "f", .03)
        a.p("M400 160v-50l40 -10v50", "f", .04)
        a.C(392, 162, 9, "f", .01)
        a.C(432, 152, 9, "f", .01)
        a.label(225, 380, "Ballet to hip hop", 30, 470)
    elif v == "gym":
        a.L(100, 330, 500, 330, "b", .05)
        for x in (140, 460):
            a.R(x - 14, 290, 28, 80, "f", .04, 4)
        a.beat(4)
        a.p("M300 400v-30a30 30 0 1 1 0 -60", "f", .04)
        a.label(300, 330, "Training that sticks", 330, 470)
    else:  # generic shop / repair
        a.R(220, 300, 160, 100, "w", .06, 8)
        a.R(236, 316, 128, 60, "f", .04, 4)
        a.beat(4)
        a.p("M420 400l40 -80l16 8l-40 80z", "f", .04)
        a.label(300, 340, "Fixed right", 330, 470)
    a.beat(6, max(a.t, 3.0))
    return a


FAMILIES = {"house": house, "room": room, "plan": plan, "salon": salon, "pet": pet, "cake": cake, "bench": bench}


def draw(family, v, acc):
    return FAMILIES[family](v, acc)


# ============================================================================ service icons (64 x 52, line art)
ICONS = {
    "roof": '<path d="M6 30 32 8l26 22"/><path d="M12 25v21h40V25"/><path class="a" d="M14 22 32 8l18 14"/><path d="M26 46V34h12v12"/>',
    "gutter": '<path d="M6 14h52"/><path class="a" d="M8 14v6h48v-6M48 20v24h6"/><path d="M14 24l2 4M24 26l2 4M34 24l2 4"/>',
    "siding": '<path d="M8 10h48v34H8z"/><path class="a" d="M8 18h48M8 26h48M8 34h48"/>',
    "window": '<path d="M14 6h36v40H14z"/><path class="a" d="M32 6v40M14 26h36"/><path d="M10 46h44"/>',
    "door": '<path d="M18 4h28v44H18z"/><path class="a" d="M24 10h16v14H24zM24 30h16v12H24z"/><circle cx="41" cy="28" r="1.5"/>',
    "garage": '<path d="M4 22 32 6l28 16v24H4z"/><path class="a" d="M12 26h40v20H12zM12 31h40M12 36h40M12 41h40"/>',
    "hvac": '<rect x="10" y="8" width="44" height="36" rx="4"/><circle class="a" cx="32" cy="26" r="11"/><path class="a" d="M32 26v-9M32 26l8 5M32 26l-8 5"/>',
    "thermo": '<circle cx="32" cy="26" r="18"/><path class="a" d="M32 14v12l7 5"/><path d="M20 26h3M41 26h3"/>',
    "flame": '<path class="a" d="M32 6c8 10 14 16 14 26a14 14 0 0 1-28 0c0-6 4-10 6-14 2 6 4 8 8 8-2-8-2-14 0-20z"/>',
    "snow": '<path class="a" d="M32 6v40M15 16l34 20M49 16 15 36"/><path d="M26 8l6 6 6-6M26 44l6-6 6 6"/>',
    "pipe": '<path d="M8 14h20v24h28"/><path class="a" d="M6 10h8v8H6zM24 34h8v8h-8zM50 34h8v8h-8z"/><path class="a" d="M44 44l2 4"/>',
    "drop": '<path class="a" d="M32 6c10 14 16 22 16 30a16 16 0 0 1-32 0c0-8 6-16 16-30z"/><path d="M24 36a8 8 0 0 0 8 8"/>',
    "heater": '<rect x="20" y="6" width="24" height="40" rx="8"/><path class="a" d="M26 34c2-4 4-4 6-8 2 4 4 4 6 8"/><path d="M32 6V2"/>',
    "drain": '<circle cx="32" cy="26" r="18"/><circle class="a" cx="32" cy="26" r="6"/><path d="M32 8v8M32 36v8M14 26h8M42 26h8"/>',
    "bolt": '<path class="a" d="M36 4 16 30h14l-4 18 22-28H34z"/>',
    "bulb": '<path d="M24 34c-6-4-8-10-8-14a16 16 0 0 1 32 0c0 4-2 10-8 14v6H24z"/><path class="a" d="M26 46h12M28 28l4-8 4 8"/>',
    "outlet": '<rect x="14" y="6" width="36" height="40" rx="6"/><path class="a" d="M26 18v6M38 18v6M28 34a4 4 0 0 0 8 0"/>',
    "panel": '<rect x="16" y="4" width="32" height="44" rx="2"/><path class="a" d="M22 12h8M34 12h8M22 20h8M34 20h8M22 28h8M34 28h8"/>',
    "spark": '<path class="a" d="M32 4c2 12 6 16 18 18-12 2-16 6-18 18-2-12-6-16-18-18 12-2 16-6 18-18z"/><path d="M50 36c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z"/>',
    "spray": '<path d="M22 20h14v28H22z"/><path d="M24 20v-8h14l6 4"/><path class="a" d="M48 12l8-4M48 18h10M48 24l8 4"/>',
    "mop": '<path d="M36 4 26 34"/><path class="a" d="M14 34h26l4 12H10z"/>',
    "vacuum": '<path d="M20 4v30"/><path class="a" d="M10 34h22l4 10H10z"/><circle cx="16" cy="46" r="2"/><circle cx="30" cy="46" r="2"/>',
    "carpet": '<path d="M8 40 18 12h28l10 28z"/><path class="a" d="M14 32h36M16 24h32M18 18h28"/>',
    "squeegee": '<path class="a" d="M10 14h32"/><path d="M26 14v8l14 22"/><path d="M48 12l4-2M48 18h6"/>',
    "wash": '<path d="M6 44h22"/><path d="M14 44V30l10-4"/><path class="a" d="M24 26l30-14M24 26l32-4M24 26l30 6"/>',
    "bug": '<ellipse cx="32" cy="30" rx="10" ry="14"/><path d="M32 16v-6M24 24l-10-4M24 32H12M24 40l-10 4M40 24l10-4M40 32h12M40 40l10 4"/><path class="a" d="M10 6l44 40"/>',
    "shield": '<path d="M32 4 52 10v14c0 12-8 20-20 24C20 44 12 36 12 24V10z"/><path class="a" d="M22 26l7 7 13-14"/>',
    "truck": '<path d="M4 12h32v24H4zM36 20h12l10 10v6H36z"/><circle class="a" cx="14" cy="40" r="5"/><circle class="a" cx="46" cy="40" r="5"/>',
    "chimney": '<path d="M20 48V14h24v34"/><path class="a" d="M16 8h32v6H16zM20 22h24M20 30h24M20 38h24"/>',
    "fence": '<path d="M6 30h52M6 40h52"/><path class="a" d="M10 46V16l4-6 4 6v30M26 46V16l4-6 4 6v30M42 46V16l4-6 4 6v30"/>',
    "deck": '<path d="M6 22h52l-6 12H12z"/><path class="a" d="M10 26h44M12 30h40"/><path d="M14 34v12M50 34v12"/>',
    "slab": '<path d="M4 38 20 14h40L44 38z"/><path class="a" d="M24 14 10 38M40 14 28 38M12 26h40"/>',
    "brick": '<path d="M6 8h52v36H6z"/><path class="a" d="M6 20h52M6 32h52M22 8v12M42 8v12M14 20v12M32 20v12M50 20v12M22 32v12M42 32v12"/>',
    "patio": '<circle cx="32" cy="26" r="20"/><circle class="a" cx="32" cy="26" r="7"/><path d="M14 18h36M14 34h36"/>',
    "dig": '<path d="M6 44h52"/><path d="M10 44V34h18v10"/><path class="a" d="M28 34l12-18 10 6-6 10"/><path d="M50 32l6 6-6 4"/>',
    "plant": '<path d="M24 46l-4-12h24l-4 12z"/><path class="a" d="M32 34c-2-12-12-16-18-16 2 8 8 14 18 16 0-14 6-22 16-26 0 12-8 20-16 26"/>',
    "lawn": '<path d="M6 44h52"/><path class="a" d="M10 44l2-12 2 12M18 44l2-16 2 16M26 44l2-10 2 10M34 44l2-14 2 14M42 44l2-12 2 12M50 44l2-16 2 16"/>',
    "floor": '<path d="M4 40 16 12h32l12 28z"/><path class="a" d="M14 40 22 12M28 40 30 12M42 40 38 12M52 40 46 12"/>',
    "tile": '<path d="M8 8h48v36H8z"/><path class="a" d="M8 20h48M8 32h48M20 8v36M32 8v36M44 8v36"/>',
    "roller": '<path class="a" d="M10 8h36v12H10z"/><path d="M46 14h6v12H28v22"/>',
    "brush": '<path class="a" d="M20 6h24v14H20z"/><path d="M24 20h16v6H24zM30 26h4v20h-4z"/>',
    "wall": '<path d="M6 8h52v36H6z"/><path class="a" d="M24 8v36M40 8v36M6 26h52"/><circle cx="20" cy="16" r="1.5"/><circle cx="28" cy="34" r="1.5"/>',
    "cabinet": '<path d="M6 24h52v22H6zM6 6h52v12H6z"/><path class="a" d="M32 24v22M28 32h-4M40 32h-4M32 6v12"/>',
    "wrench": '<path class="a" d="M42 6a10 10 0 0 0-12 13L10 39l5 5 20-20a10 10 0 0 0 13-12l-6 6-6-2-2-6z"/>',
    "hammer": '<path d="M30 20 12 46"/><path class="a" d="M26 8h20l6 6-6 4-4-2-6 6-8-6 2-2z"/>',
    "level": '<rect x="4" y="18" width="56" height="16" rx="3"/><path class="a" d="M26 22h12v8H26z"/><circle cx="32" cy="26" r="2"/>',
    "washer": '<rect x="12" y="4" width="40" height="44" rx="4"/><circle class="a" cx="32" cy="30" r="11"/><path d="M12 14h40"/>',
    "fridge": '<rect x="16" y="4" width="32" height="44" rx="4"/><path class="a" d="M16 20h32M22 10v6M22 26v8"/>',
    "scissors": '<circle cx="16" cy="38" r="7"/><circle cx="16" cy="14" r="7"/><path class="a" d="M22 34 56 10M22 18l34 24"/>',
    "comb": '<path d="M8 18h48v8H8z"/><path class="a" d="M12 26v14M18 26v14M24 26v14M30 26v14M36 26v14M42 26v14M48 26v14"/>',
    "dryer": '<path d="M10 12h28a12 12 0 0 1 0 24H24l-4 14h-8l4-14h-6z"/><path class="a" d="M44 18h10M44 24h12M44 30h10"/>',
    "color": '<path d="M10 22h44l-6 22H16z"/><path class="a" d="M40 22 52 4"/><path d="M18 30h28"/>',
    "nail": '<path d="M20 48V22a12 12 0 0 1 24 0v26"/><path class="a" d="M24 22a8 8 0 0 1 16 0v8H24z"/>',
    "polish": '<path d="M20 22h24v24H20z"/><path class="a" d="M26 4h12v18H26z"/>',
    "lotus": '<path class="a" d="M32 40c-10-6-14-16-10-28 8 6 10 16 10 28 0-12 2-22 10-28 4 12 0 22-10 28z"/><path d="M8 40c8 4 16 6 24 6s16-2 24-6"/>',
    "stones": '<ellipse cx="32" cy="40" rx="20" ry="6"/><ellipse class="a" cx="32" cy="28" rx="15" ry="5"/><ellipse cx="32" cy="17" rx="10" ry="4"/>',
    "barber": '<rect x="24" y="6" width="16" height="40" rx="4"/><path class="a" d="M24 14l16-6M24 24l16-6M24 34l16-6M24 44l16-6"/>',
    "razor": '<path d="M8 30h26l4-4v-6H12z"/><path class="a" d="M38 24h18v6H38z"/>',
    "dog": '<path d="M14 26c0-8 6-14 14-14l6-6 4 8c6 2 10 8 10 14v6c4 0 8 2 8 6H44v8h-6v-8H24v8h-6v-8c-2-4-4-8-4-14z"/><circle class="a" cx="36" cy="20" r="2"/>',
    "paw": '<ellipse class="a" cx="32" cy="34" rx="10" ry="9"/><circle cx="18" cy="22" r="5"/><circle cx="28" cy="12" r="5"/><circle cx="40" cy="12" r="5"/><circle cx="48" cy="22" r="5"/>',
    "bath": '<path d="M6 24h52v8a12 12 0 0 1-12 12H18A12 12 0 0 1 6 32z"/><path class="a" d="M14 24V12a6 6 0 0 1 12 0"/><circle class="a" cx="40" cy="14" r="3"/><circle class="a" cx="48" cy="8" r="2"/>',
    "house": '<path d="M8 26 32 6l24 20"/><path d="M14 22v24h36V22"/><path class="a" d="M26 46V32h12v14"/>',
    "cake": '<path d="M12 46V30h40v16"/><path d="M18 30V18h28v12"/><path class="a" d="M12 34c4 4 6 4 10 0s6-4 10 0 6 4 10 0 6-4 10 0M32 18v-8"/><circle class="a" cx="32" cy="7" r="2"/>',
    "cupcake": '<path d="M18 26h28l-4 20H22z"/><path class="a" d="M16 26c-4-12 8-18 16-18s20 6 16 18"/><path d="M26 30l2 14M36 30l-2 14"/>',
    "bread": '<path d="M8 40c-2-16 10-24 24-24s26 8 24 24z"/><path class="a" d="M20 24l6 8M30 22l6 8M40 24l6 8"/>',
    "cookie": '<circle cx="32" cy="26" r="18"/><circle class="a" cx="26" cy="20" r="2.5"/><circle class="a" cx="38" cy="22" r="2.5"/><circle class="a" cx="30" cy="32" r="2.5"/><circle class="a" cx="40" cy="34" r="2"/>',
    "dish": '<path d="M6 36h52"/><path d="M10 36a22 22 0 0 1 44 0"/><path class="a" d="M32 14v-6M28 8h8"/>',
    "cup": '<path d="M12 18h32v14a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z"/><path d="M44 22h4a6 6 0 0 1 0 12h-4"/><path class="a" d="M22 12c-2-4 2-6 0-10M30 12c-2-4 2-6 0-10"/>',
    "camera": '<rect x="6" y="14" width="52" height="32" rx="5"/><circle class="a" cx="32" cy="30" r="10"/><path d="M22 14l4-6h12l4 6"/>',
    "key": '<circle class="a" cx="18" cy="26" r="10"/><path d="M28 26h28v6h-6v6h-6v-6h-6v6h-6v-6"/>',
    "lock": '<rect x="14" y="22" width="36" height="26" rx="4"/><path class="a" d="M22 22v-6a10 10 0 0 1 20 0v6"/><circle cx="32" cy="34" r="3"/>',
    "needle": '<path class="a" d="M50 6 14 42"/><path d="M14 42c-6 4-8 0-4-4M48 8l2 2"/><path d="M8 18c10-6 22 6 32 0"/>',
    "dress": '<path d="M24 4h16M26 4c0 8-6 10-6 14l-8 30h40l-8-30c0-4-6-6-6-14"/><path class="a" d="M20 22h24"/>',
    "torch": '<path d="M8 40 30 18"/><path class="a" d="M30 18l6-6M40 8l4-4M44 14l6-2M38 16l2 6"/>',
    "mower": '<path d="M14 34h34v8H14z"/><path d="M48 34 58 10"/><circle class="a" cx="18" cy="44" r="4"/><circle class="a" cx="44" cy="44" r="4"/>',
    "engine": '<rect x="10" y="16" width="36" height="26" rx="3"/><path class="a" d="M46 22h8v14h-8M18 16V8h20v8"/><path d="M20 28h16"/>',
    "flower": '<circle class="a" cx="32" cy="18" r="6"/><circle cx="32" cy="8" r="6"/><circle cx="42" cy="18" r="6"/><circle cx="32" cy="28" r="6"/><circle cx="22" cy="18" r="6"/><path d="M32 34v14"/>',
    "blocks": '<path d="M8 28h18v18H8zM30 28h18v18H30zM19 10h18v18H19z"/><path class="a" d="M14 34h6M36 40l6-6M25 16h6"/>',
    "belt": '<path d="M6 22h52v8H6z"/><path class="a" d="M28 18h8v16h-8zM30 34l-6 12M34 34l6 12"/>',
    "music": '<path d="M24 38V10l26-6v28"/><circle class="a" cx="18" cy="38" r="6"/><circle class="a" cx="44" cy="32" r="6"/>',
    "dumbbell": '<path d="M18 26h28"/><path class="a" d="M8 16h10v20H8zM46 16h10v20H46z"/>',
    "calendar": '<rect x="8" y="10" width="48" height="36" rx="4"/><path d="M8 20h48M20 4v10M44 4v10"/><path class="a" d="M18 28h8v8h-8z"/>',
    "star": '<path class="a" d="M32 6l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z"/>',
    "check": '<circle cx="32" cy="26" r="20"/><path class="a" d="M22 26l7 7 14-14"/>',
    "clock": '<circle cx="32" cy="26" r="20"/><path class="a" d="M32 14v12l8 6"/>',
    "phone": '<path class="a" d="M18 6h28v44H18z"/><path d="M28 44h8"/>',
    "septic": '<path d="M6 16h52"/><rect x="14" y="24" width="36" height="20" rx="6"/><path class="a" d="M26 24v-6h12v6M6 30h8"/>',
    "generator": '<rect x="8" y="12" width="48" height="30" rx="4"/><path class="a" d="M34 16l-8 12h8l-6 10"/><path d="M14 42v4M50 42v4"/>',
    "insulation": '<path d="M6 40 32 10l26 30"/><path class="a" d="M14 36l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4"/>',
    "kitchen": '<path d="M6 26h52v20H6z"/><path d="M6 22h52"/><path class="a" d="M14 30h14v12H14zM36 30h14v12H36zM40 22v-8h10"/>',
}
