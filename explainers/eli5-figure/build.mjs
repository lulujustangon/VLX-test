import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

// One idea: stickers with numbers are already on the photo; the machine's finger only presses number keys.
const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 640;
const HEIGHT = 440;

const PLATE = { x: -186, y: -122, w: 272, d: 216, r: 10 };
const PLATE_H = 12;
const FOOT_H = 5;

const LT = { x: -132, y: -108, w: 152, d: 126, r: 4 };
const LT_H = 20;
const SCALE = 0.26;
const PHOTO = { x: LT.x + 11, y: LT.y + 11, w: M.IMAGE.w * SCALE, d: M.IMAGE.h * SCALE, r: 0.6 };
const PZ = LT_H + 0.6;
const toWorld = ([px, py]) => [PHOTO.x + px * SCALE, PHOTO.y + py * SCALE];
const boxPlan = ([x1, y1, x2, y2]) => {
  const [ax, ay] = toWorld([x1, y1]);
  const [bx, by] = toWorld([x2, y2]);
  return { x: ax, y: ay, w: bx - ax, d: by - ay, r: 0.8 };
};

// Question cards in a rack; the one being asked rides up out of it.
const RACK = { x: 34, y: -78, w: 40, d: 24, r: 2 };
const RACK_H = 7;
const CARD = { w: 32, h: 26, t: 1.6 };
const CARD_Y = (i) => RACK.y + 5 + i * 6;
const LIFT = 9;

const SEL_RAIL = { x: -168, y: 33, w: 240, d: 5, r: 1 };
const SEL_RAIL_H = 5;
const BED = { x: -166, y: 42, w: 238, d: 44, r: 3 };
const BED_H = 7;
const KEY_PITCH = 22;
const KEY_X = M.PROPOSALS.map((_, i) => -150 + KEY_PITCH * i);
const NONE_X = KEY_X[KEY_X.length - 1] + 26;
const KEYS = [...KEY_X.map((x) => ({ x, w: 18 })), { x: NONE_X, w: 24 }];
const CAP_Y = 48;
const CAP_D = 22;
const CAP_Z = 13;
const CAP_TOP = 17;
const PRESS = 2.4;
const PLUNGE_Y = 59;
const TIP_Z = CAP_TOP + 0.6;
const ARM_Z = [24, 28];
const BAR = { x: -164, y: 77, w: 234, d: 3, r: 1 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [RACK.x + RACK.w, RACK.y, RACK_H + CARD.h + LIFT], [KEY_X[0], 40, ARM_Z[1]]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 46, elevation: 38 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
const slab = (plan, z, h, tone = "mid", steps = 3, bevel = 0, extra = {}) => S(k.slabOf(plan, z, h, P, steps, bevel), { tone, ...extra });
const screws = (points, z, size = 0.45) => D(points.map(([x, y]) => at([x, y, z])), { size });
const ellipse = ([cx, cy], [rx, ry], steps = 48) => Array.from({ length: steps }, (_, i) => {
  const a = (i / steps) * Math.PI * 2;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
});
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 4) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const hash = (a, b, c) => {
  const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(slab(PLATE, -PLATE_H, PLATE_H, "mid", 8, 1.6));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const corner = k.corners(PLATE, 10);
  out.push(L(corner.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(screws(corner, 0, 0.5));
  // label plate in the free back-left corner: three rule lines stand for printed text
  const label = { x: -178, y: -98, w: 36, d: 14, r: 1.2 };
  out.push(slab(label, 0, 0.8, "lo", 3, 0, { crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(L([24, 16, 20].map((len, i) => k.lineOnTop([label.x + 4, label.y + 4 + i * 3], [label.x + 4 + len, label.y + 4 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(screws([[label.x + label.w - 3, label.y + 3], [label.x + label.w - 3, label.y + label.d - 3]], 0.8));
  return out.join("");
}

function lightTable() {
  const out = [`<path class="iso-halo" d="${k.haloOf(LT, 0, 6, P)}"/>`];
  out.push(slab(k.insetPlan(LT, 3), 0, 4, "lo", 4));
  out.push(slab(LT, 4, LT_H - 4, "mid", 4, 1.2, { inner: L(k.sideSeam(LT, 8, P, 4), { tone: "faint" }) }));
  const glass = k.insetPlan(LT, 5);
  out.push(`<path class="vs-glass" d="${k.onTop(k.ringOf(glass, 3), LT_H, P, true)}"/>`);
  out.push(L(k.planOutline(glass, LT_H, P, 3), { tone: "lo" }));
  out.push(screws(k.corners(LT, 2.6), LT_H, 0.45));
  const front = LT.y + LT.d;
  out.push(`<g transform="${planeOf(front)}">${L(Array.from({ length: 12 }, (_, i) => flat(LT.x + 96 + i * 3.4, 9.5, LT.x + 97.2 + i * 3.4, 16, 0.6)).join(""), { tone: "lo" })}</g>`);
  out.push(`<g transform="${planeOf(front)}"><text class="iso-face-text" data-tone="lo" x="${LT.x + 12}" y="-11" font-size="4">VLX-SEEK 1.5</text></g>`);
  const rocker = { x: LT.x + LT.w, y: -6, w: 1.4, d: 10, r: 0.8 };
  out.push(slab(rocker, 9, 7, "mid", 2));
  out.push(slab({ x: rocker.x + 1.4, y: -4.6, w: 1.6, d: 7.2, r: 0.5 }, 12.2, 3.2, "mid", 2));
  return out.join("");
}

function photo() {
  const out = [];
  out.push(S(k.slabOf(PHOTO, LT_H, 0.6, P, 2), { tone: "lo", crease: "none", className: "vs-photo" }));
  for (const fruit of M.FRUIT) {
    const c = toWorld(fruit.c);
    const r = [fruit.r[0] * SCALE, fruit.r[1] * SCALE];
    const d = k.onTop(ellipse(c, r, 64), PZ, P, true);
    out.push(`<path class="vs-fruit" data-kind="${fruit.kind}" d="${d}"/>`);
    out.push(L(d, { tone: "mid" }));
    const m = toWorld(fruit.mark);
    if (fruit.kind === "orange") {
      const dimples = [];
      for (let i = 0; i < 26; i++) {
        const a = hash(i, fruit.c[0], 1) * Math.PI * 2;
        const q = Math.sqrt(hash(i, fruit.c[1], 2)) * 0.82;
        dimples.push(at([c[0] + Math.cos(a) * r[0] * q, c[1] + Math.sin(a) * r[1] * q, PZ]));
      }
      out.push(D(dimples, { size: 0.28, tone: "lo" }));
      out.push(L(k.onTop(ellipse(m, [0.9, 0.9], 12), PZ, P, true), { tone: "mid" }));
      out.push(D([at([m[0], m[1], PZ])], { size: 0.35, tone: "mid" }));
    } else {
      const dir = [m[0] - c[0], m[1] - c[1]];
      const len = Math.hypot(...dir);
      const tip = [m[0] + (dir[0] / len) * 2.6, m[1] + (dir[1] / len) * 2.6];
      out.push(L(k.onTop(ellipse(m, [1.4, 1.1], 12), PZ, P, true), { tone: "mid" }));
      out.push(L(k.onTop([m, tip], PZ, P), { tone: "mid" }));
      out.push(D([at([tip[0], tip[1], PZ])], { size: 0.45, tone: "mid" }));
      const arc = Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * (1.05 + i * 0.04);
        return [c[0] + Math.cos(a) * r[0] * 0.72, c[1] + Math.sin(a) * r[1] * 0.72];
      });
      out.push(k.fadeLineSvg(arc.map(([x, y]) => at([x, y, PZ])), { fade: [3, 3], tone: "faint" }));
    }
  }
  for (const [cx, cy, sx, sy] of [[PHOTO.x, PHOTO.y, 1, 1], [PHOTO.x + PHOTO.w, PHOTO.y, -1, 1], [PHOTO.x, PHOTO.y + PHOTO.d, 1, -1], [PHOTO.x + PHOTO.w, PHOTO.y + PHOTO.d, -1, -1]]) {
    const a = { x: sx > 0 ? cx - 1.2 : cx - 6.8, y: sy > 0 ? cy - 1.2 : cy - 2.6, w: 8, d: 3.8, r: 0.6 };
    const b = { x: sx > 0 ? cx - 1.2 : cx - 2.6, y: sy > 0 ? cy - 1.2 : cy - 6.8, w: 3.8, d: 8, r: 0.6 };
    out.push(slab(a, LT_H, 1.6, "mid", 2), slab(b, LT_H, 1.6, "mid", 2));
  }
  return out.join("");
}

function frames() {
  const out = [];
  M.PROPOSALS.forEach((p, i) => {
    out.push(`<g class="vs-frame" data-frame="${i}">${L(k.planOutline(boxPlan(p.box), PZ + 0.05, P, 2), { tone: "mid", className: "vs-frame-line" })}</g>`);
  });
  const tabs = M.PROPOSALS.map((p, i) => ({ i, plan: boxPlan(p.box) })).sort((a, b) => depth(a.plan.x, a.plan.y) - depth(b.plan.x, b.plan.y));
  for (const { i, plan } of tabs) {
    const tab = { x: plan.x + 0.6, y: plan.y + 0.6, w: 5.6, d: 4.6, r: 0.6 };
    out.push(`<g class="vs-tab" data-tab="${i}">${slab(tab, PZ, 0.6, "mid", 2)}${k.faceTextSvg(k.topMatrix([tab.x + tab.w / 2, tab.y + 3.8], PZ + 0.6, P, "x"), String(i), { size: 3.6, tone: "hi", anchor: "middle" })}</g>`);
  }
  return out.join("");
}

function rack() {
  const out = [`<path class="iso-halo" d="${k.haloOf(RACK, 0, 4, P)}"/>`];
  out.push(slab(RACK, 0, RACK_H, "mid", 3, 0.6, { inner: L(k.sideSeam(RACK, 2.4, P, 3), { tone: "faint" }) }));
  M.QUERIES.forEach((_, i) => out.push(L(k.planOutline({ x: RACK.x + 3, y: CARD_Y(i) - 0.6, w: CARD.w + 2, d: CARD.t + 1.2, r: 0.6 }, RACK_H, P, 2), { tone: "lo" })));
  out.push(screws([[RACK.x + 2, RACK.y + 2.4], [RACK.x + RACK.w - 2, RACK.y + 2.4], [RACK.x + 2, RACK.y + RACK.d - 2.4], [RACK.x + RACK.w - 2, RACK.y + RACK.d - 2.4]], RACK_H));
  M.QUERIES.forEach((_, i) => {
    const y = CARD_Y(i);
    const plan = { x: RACK.x + 4, y, w: CARD.w, d: CARD.t, r: 0.4 };
    const face = y + CARD.t;
    const rules = [0, 1, 2].map((n) => `M${plan.x + 4} ${-(RACK_H + CARD.h - 6 - n * 3.6)}H${plan.x + 4 + [22, 15, 18][n]}`).join("");
    out.push(`<g class="vs-card" data-card="${i}">${slab(plan, RACK_H - 2, CARD.h + 2, "hi", 2, 0, { crease: "lo" })}<g transform="${planeOf(face)}">${L(rules, { tone: "mid", free: true })}</g>${screws([[plan.x + CARD.w - 3, face]], RACK_H + CARD.h - 3, 0.5)}</g>`);
  });
  return out.join("");
}

function selectorRail() {
  const out = [slab(SEL_RAIL, 0, SEL_RAIL_H, "mid", 2, 0.4)];
  out.push(L(k.planOutline(k.insetPlan(SEL_RAIL, 1.6), SEL_RAIL_H, P, 2), { tone: "faint" }));
  for (const x of [SEL_RAIL.x - 4, SEL_RAIL.x + SEL_RAIL.w]) out.push(slab({ x, y: SEL_RAIL.y - 1.5, w: 4, d: SEL_RAIL.d + 3, r: 1 }, 0, 9, "mid", 2, 0.4));
  out.push(screws(Array.from({ length: 8 }, (_, i) => [SEL_RAIL.x + 12 + i * 31, SEL_RAIL.y + SEL_RAIL.d / 2]), SEL_RAIL_H, 0.4));
  return out.join("");
}

function carriageBody() {
  const out = [];
  const body = { x: -9, y: 30.5, w: 18, d: 11, r: 2 };
  out.push(slab({ x: -10.5, y: SEL_RAIL.y - 1.5, w: 21, d: SEL_RAIL.d + 3, r: 1.5 }, SEL_RAIL_H - 1, 5, "mid", 3, 0.4));
  out.push(slab(body, SEL_RAIL_H + 4, ARM_Z[0] - SEL_RAIL_H - 4, "mid", 4, 0.6, { inner: L(k.sideSeam(body, 16, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline({ x: -6, y: 32.5, w: 12, d: 6, r: 1 }, ARM_Z[0], P, 2), { tone: "lo" }));
  out.push(screws([[-6.5, 40], [6.5, 40]], ARM_Z[0], 0.45));
  return out.join("");
}

function carriageArm() {
  const out = [];
  const arm = { x: -3, y: 41.5, w: 6, d: PLUNGE_Y + 3.5 - 41.5, r: 1.2 };
  out.push(slab({ x: -4.5, y: 40.5, w: 9, d: 4, r: 1 }, 16, ARM_Z[0] - 16, "mid", 2, 0.3));
  out.push(slab(arm, ARM_Z[0], ARM_Z[1] - ARM_Z[0], "mid", 3, 0.5));
  out.push(screws([[0, 43], [0, PLUNGE_Y]], ARM_Z[1], 0.45));
  out.push(S(k.cylinder(0, PLUNGE_Y, 2.4, ARM_Z[0] - 2.4, 2.4, P, 20), { tone: "mid" }));
  return out.join("");
}

function plunger() {
  return S(k.cylinder(0, PLUNGE_Y, 1.1, TIP_Z + 1, ARM_Z[0] - 2.4 - TIP_Z - 1, P, 16), { tone: "hi", crease: "none" }) + S(k.cylinder(0, PLUNGE_Y, 2, TIP_Z, 1, P, 20), { tone: "hi" });
}

function bed() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BED, 0, 4, P)}"/>`];
  out.push(slab(BED, 0, BED_H, "mid", 4, 1, { inner: L(k.sideSeam(BED, 3, P, 4), { tone: "faint" }) }));
  for (const key of KEYS) out.push(L(k.planOutline({ x: key.x - 3.4, y: PLUNGE_Y - 3.4, w: 6.8, d: 6.8, r: 1.4 }, BED_H, P, 2), { tone: "lo" }));
  out.push(screws([[BED.x + 4, BED.y + 3], [BED.x + BED.w - 4, BED.y + 3], [BED.x + 4, BED.y + BED.d - 3], [BED.x + BED.w - 4, BED.y + BED.d - 3]], BED_H));
  out.push(slab(BAR, BED_H, 2.5, "mid", 2, 0.3));
  out.push(screws([[BAR.x + 4, BAR.y + 1.5], [BAR.x + BAR.w - 4, BAR.y + 1.5]], BED_H + 2.5, 0.4));
  return out.join("");
}

function keySvg(index) {
  const key = KEYS[index];
  const none = index === KEYS.length - 1;
  const cap = { x: key.x - key.w / 2, y: CAP_Y, w: key.w, d: CAP_D, r: 2 };
  const out = [];
  out.push(slab({ x: key.x - 2.2, y: PLUNGE_Y - 2.2, w: 4.4, d: 4.4, r: 1 }, BED_H, CAP_Z - BED_H, "mid", 2));
  out.push(slab(cap, CAP_Z, CAP_TOP - CAP_Z, "mid", 3, 0.5, { className: "vs-cap" }));
  const tile = { x: key.x - 4.4, y: CAP_Y + 1.8, w: 8.8, d: 8.2, r: 0.8 };
  out.push(L(k.planOutline(tile, CAP_TOP, P, 2), { tone: none ? "faint" : "lo" }));
  if (none) {
    out.push(k.faceTextSvg(k.topMatrix([key.x, CAP_Y + 19.6], CAP_TOP, P, "x"), "None", { size: 4.8, tone: "hi", anchor: "middle" }));
  } else {
    out.push(k.faceTextSvg(k.topMatrix([key.x, CAP_Y + 20], CAP_TOP, P, "x"), String(index), { size: 6.6, tone: "hi", anchor: "middle" }));
    // what the model reads for this region: the 14 x 14 RoI Align grid of the released config
    const box = M.PROPOSALS[index].box;
    const dots = [];
    const n = M.ROI_GRID;
    const gap = 7.2 / (n - 1);
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++) {
        const alpha = 0.25 + 0.75 * hash(col + box[0] * 0.01, row + box[1] * 0.01, box[2] * 0.003 + box[3] * 0.002);
        const [sx, sy] = at([key.x - 3.6 + col * gap, CAP_Y + 2.3 + row * gap, CAP_TOP]);
        dots.push([sx, sy, alpha]);
      }
    out.push(D(dots, { size: 0.19, tone: "hi" }));
  }
  return `<g class="vs-key" data-key="${index}">${out.join("")}</g>`;
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A light table holds the demo photo of five mandarins and two apples. Nine numbered frames sit on the photo, one per candidate region. In front is a row of number keys 0 to 8 and a None key, and a small carriage with a plunger that presses keys. A rack on the right holds three question cards. When a question is asked its card rises, the carriage presses the keys whose regions answer it, and those frames light up.",
  body: [
    plate(),
    lightTable(),
    photo(),
    frames(),
    rack(),
    selectorRail(),
    `<g data-part="carriage" transform="${k.translateAlong(P, [KEY_X[0], 0, 0])}">${carriageBody()}</g>`,
    bed(),
    KEYS.map((_, i) => keySvg(i)).join(""),
    `<g data-part="arm" transform="${k.translateAlong(P, [KEY_X[0], 0, 0])}">${carriageArm()}<g data-part="plunger">${plunger()}</g></g>`,
  ],
});

const QUERY_DATA = M.QUERIES.map((q) => ({ ...q, ref: M.refTokens(q), coord: M.coordTokens(q) }));
const data = `
const P = ${JSON.stringify(P)};
const QUERIES = ${JSON.stringify(QUERY_DATA)};
const KEYS_X = ${JSON.stringify(KEYS.map((key) => key.x))};
const PRESS = ${PRESS}, LIFT = ${LIFT};
`;
const live = readFileSync(join(HERE, "live.js"), "utf8");
const css = readFileSync(join(HERE, "figure.css"), "utf8");
const controls = `<div class="vs-controls" role="group" aria-label="问它一个问题">${QUERY_DATA.map((q, i) => `<button type="button" class="vs-chip" data-query="${i}" aria-pressed="${i === 0}">${q.zh.replace(/（.*）/, "")}在哪？${q.picks.length ? "" : "（图里没有）"}</button>`).join("")}</div>`;
const first = QUERY_DATA[0];
const plateHtml = k.plateHtml({
  fig: "图 1",
  title: "贴号码，按号码",
  hint: "点问题 · 悬停号码",
  readout: `问“${first.zh}” → 按 ${first.picks.join("、")} 号`,
  keys: [
    { mark: "lit", label: "被按下的号码键，和照片上亮起的同号框" },
    { mark: "raised", label: "号码键：每个框一个，键面的点阵是机器读到的那块区域" },
  ],
  caption:
    "照片是 VLX-Seek 仓库里的 demo 图：五个橘子、两个苹果。照片上已经贴好 0 到 8 号框（框是示意摆放的）。右边架子上是三张问题卡，被问到的那张会升起来。前面的小车就是模型的“手指”，它只按号码键，不写数字坐标；被按下的号码对应的框会亮起。问“梨”时图里没有梨，它就按 None。",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="贴号码的看图台。左右方向键换问题。">${svg}<span class="vs-sr" role="status" aria-live="polite" data-status></span></div>${controls}`,
});

const script = kitScript() + data + live;
const fragment = `<style>${k.ISO_CSS}${css}</style><div class="iso vs-iso" data-theme="light">${plateHtml}</div><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>`;
writeFileSync(join(HERE, "figure.fragment.html"), fragment);
writeFileSync(join(HERE, "figure-preview.html"), k.pageHtml({ title: "贴号码，按号码", theme: "light", body: `<style>${css}</style>${plateHtml}`, script, width: 700 }));
console.log("wrote figure.fragment.html and figure-preview.html");
