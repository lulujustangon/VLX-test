const root = document.querySelector(".vs-iso") || document;
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const carriageEl = svg.querySelector('[data-part="carriage"]');
const armEl = svg.querySelector('[data-part="arm"]');
const plungerEl = svg.querySelector('[data-part="plunger"]');
const keyEls = [...svg.querySelectorAll(".vs-key")];
const frameEls = [...svg.querySelectorAll(".vs-frame")];
const tabEls = [...svg.querySelectorAll(".vs-tab")];
const cardEls = [...svg.querySelectorAll(".vs-card")];
const readout = root.querySelector("[data-readout]");
const status = root.querySelector("[data-status]");
const chips = [...root.querySelectorAll(".vs-chip[data-query]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const NONE = KEYS_X.length - 1;
const speed = () => (typeof window.__driveSpeed === "number" ? window.__driveSpeed : 1);

// The figure follows the reader's theme on an artifact page.
const themeOf = () => {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark" || explicit === "light") return explicit;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};
if (root !== document) {
  const apply = () => root.setAttribute("data-theme", themeOf());
  apply();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

const s = {
  cx: KEYS_X[0], cxTarget: KEYS_X[0],
  plunge: 0, plungeTarget: 0,
  keys: KEYS_X.map(() => ({ at: 0, want: 0 })),
  cards: QUERIES.map(() => ({ at: 0, want: 0 })),
  lit: new Set(),
  query: 0, picks: [], pi: 0, said: [], sub: "hold", wait: 0,
};
let frame = 0, last = 0, visible = false, touring = !still.matches, idleTimer = 0;

const follow = (value, target, dt, tau) => (still.matches ? target : value + (target - value) * (1 - Math.exp(-dt / tau)));
const settle = (value, target, eps = 0.002) => (Math.abs(target - value) < eps ? target : value);
const words = (list) => list.map((k) => (k === NONE ? "None" : String(k))).join("、");

function draw() {
  const ct = translateAlong(P, [s.cx, 0, 0]);
  carriageEl.setAttribute("transform", ct);
  armEl.setAttribute("transform", ct);
  plungerEl.setAttribute("transform", translateAlong(P, [0, 0, -(PRESS + 0.6) * s.plunge]));
  s.keys.forEach((key, i) => keyEls[i].setAttribute("transform", key.at > 0.001 ? translateAlong(P, [0, 0, -PRESS * key.at]) : ""));
  s.cards.forEach((card, i) => cardEls[i].setAttribute("transform", card.at > 0.001 ? translateAlong(P, [0, 0, LIFT * card.at]) : ""));
}

function mark() {
  keyEls.forEach((el, i) => el.toggleAttribute("data-on", s.lit.has(i)));
  frameEls.forEach((el, i) => el.toggleAttribute("data-on", s.lit.has(i)));
  tabEls.forEach((el) => el.toggleAttribute("data-on", s.lit.has(Number(el.dataset.tab))));
  cardEls.forEach((el, i) => el.toggleAttribute("data-on", i === s.query));
  chips.forEach((chip, i) => chip.setAttribute("aria-pressed", String(i === s.query)));
}

function say() {
  const q = QUERIES[s.query];
  const text = "问“" + q.zh.replace(/（.*）/, "") + "” → " + (s.said.length ? "按 " + words(s.said) + (s.said[0] === NONE ? "" : " 号") : "…");
  if (readout.textContent !== text) readout.textContent = text;
}

function ask(index) {
  s.query = index;
  s.lit.clear();
  s.said = [];
  s.keys.forEach((key) => (key.want = 0));
  s.cards.forEach((card, i) => (card.want = i === index ? 1 : 0));
  const q = QUERIES[index];
  s.picks = q.picks.length ? q.picks.slice() : [NONE];
  s.pi = 0;
  s.sub = "lift";
  s.wait = 0.7;
  say();
  mark();
}

function finish() {
  const q = QUERIES[s.query];
  status.textContent = q.picks.length
    ? "问" + q.zh + "：按下 " + words(q.picks) + " 号键，这些号码的框亮起。"
    : "问" + q.zh + "：没有对应的框，按下 None 键。";
}

function direct(dt) {
  if (s.wait > 0) { s.wait -= dt; return; }
  if (s.sub === "lift") { s.sub = "seek"; return; }
  if (s.sub === "seek") {
    s.cxTarget = KEYS_X[s.picks[s.pi]];
    if (Math.abs(s.cx - s.cxTarget) < 0.08) { s.cx = s.cxTarget; s.sub = "down"; s.plungeTarget = 1; s.keys[s.picks[s.pi]].want = 1; }
    return;
  }
  if (s.sub === "down") {
    if (s.plunge > 0.96) {
      const k = s.picks[s.pi];
      s.lit.add(k);
      s.said.push(k);
      say();
      mark();
      s.sub = "up";
      s.wait = 0.18;
    }
    return;
  }
  if (s.sub === "up") {
    s.plungeTarget = 0;
    if (s.plunge < 0.05) {
      s.pi += 1;
      if (s.pi < s.picks.length) s.sub = "seek";
      else { s.sub = "hold"; s.wait = 3.6; finish(); }
    }
    return;
  }
  if (s.sub === "hold" && touring) ask((s.query + 1) % QUERIES.length);
}

function tick(now) {
  const dt = (last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60) * speed();
  last = now;
  direct(dt);
  s.cx = settle(follow(s.cx, s.cxTarget, dt, 0.2), s.cxTarget, 0.01);
  s.plunge = settle(follow(s.plunge, s.plungeTarget, dt, s.plungeTarget ? 0.05 : 0.09), s.plungeTarget);
  s.keys.forEach((key) => { key.at = settle(follow(key.at, key.want, dt, key.want ? 0.05 : 0.12), key.want); });
  s.cards.forEach((card) => { card.at = settle(follow(card.at, card.want, dt, 0.22), card.want); });
  draw();
  const moving = s.cx !== s.cxTarget || s.plunge !== s.plungeTarget || s.keys.some((key) => key.at !== key.want) || s.cards.some((card) => card.at !== card.want);
  const busy = moving || s.wait > 0 || s.sub !== "hold" || touring;
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}

function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }

function finishNow() {
  s.picks.forEach((k) => { s.lit.add(k); s.said.push(k); s.keys[k].want = 1; s.keys[k].at = 1; });
  s.cards.forEach((card) => (card.at = card.want));
  s.cx = s.cxTarget = KEYS_X[s.picks[s.picks.length - 1]];
  s.sub = "hold";
  s.wait = 0;
  say();
  finish();
  mark();
  draw();
}

function choose(index) {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (still.matches) return; touring = true; run(); }, 9000);
  ask(index);
  if (still.matches) finishNow();
  run();
}

chips.forEach((chip) => chip.addEventListener("click", () => choose(Number(chip.dataset.query))));
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); choose((s.query + 1) % QUERIES.length); }
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); choose((s.query + QUERIES.length - 1) % QUERIES.length); }
});
let hovered = -1;
function hover(index) {
  if (index === hovered) return;
  hovered = index;
  keyEls.forEach((el, i) => el.toggleAttribute("data-hover", i === index));
  frameEls.forEach((el, i) => el.toggleAttribute("data-hover", i === index));
  tabEls.forEach((el) => el.toggleAttribute("data-hover", Number(el.dataset.tab) === index));
}
svg.addEventListener("pointerover", (event) => {
  const el = event.target.closest("[data-key],[data-tab],[data-frame]");
  hover(el ? Number(el.dataset.key ?? el.dataset.tab ?? el.dataset.frame) : -1);
});
svg.addEventListener("pointerleave", () => hover(-1));
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

ask(0);
if (still.matches) finishNow();
draw();
mark();
