// Blackjack strategy simulation: optimal hit / stand / split decisions.
//
// Two engines:
//  1. Exact dynamic programming on an infinite deck (no card counting, no shoe
//     depletion). Gives the optimal hit/stand decision for every hand and the
//     optimal split / don't-split decision for every pair, against every
//     dealer upcard.
//  2. Monte Carlo over a finite 6-deck shoe with reshuffles. Plays hands with
//     each policy and checks the DP's predicted EV against realized results.
//
// Rules modelled: dealer stands on all 17s (S17), no blackjack bonus (a natural
// is just 21), no doubling, no surrender, split once (no re-split), split aces
// get one card each. Payout: win +1, lose -1, push 0, per unit bet.
//
// Usage: node tools/blackjack-sim/simulate.mjs [--hands=500000] [--seed=1]

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'results');
mkdirSync(OUT, { recursive: true });

const arg = (name, def) => {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  return m ? Number(m.split('=')[1]) : def;
};
const HANDS = arg('hands', 500000);
const SEED = arg('seed', 1);

// ---- card model -----------------------------------------------------------
// rank 1 = ace, 2..9 pip cards, 10 = ten/J/Q/K.
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const PROB = [1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 1 / 13, 4 / 13];
const UPS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1]; // dealer upcards, ace last
const label = (r) => (r === 1 ? 'A' : String(r));

// best total for a hand given hard total (aces counted as 1) and "has ace"
const best = (hard, ace) => (ace && hard + 10 <= 21 ? hard + 10 : hard);

// ---- dealer (infinite deck) -----------------------------------------------
// dealerDist(h, ace) -> probabilities of ending at 17,18,19,20,21,bust (index 0..5)
const dealerMemo = new Map();
function dealerDist(h, ace) {
  const key = h * 2 + (ace ? 1 : 0);
  const hit = dealerMemo.get(key);
  if (hit) return hit;
  let out = [0, 0, 0, 0, 0, 0];
  if (h > 21) {
    out[5] = 1;
  } else if (best(h, ace) >= 17) {
    out[best(h, ace) - 17] = 1;
  } else {
    RANKS.forEach((c, i) => {
      const d = dealerDist(h + c, ace || c === 1);
      for (let k = 0; k < 6; k++) out[k] += PROB[i] * d[k];
    });
  }
  dealerMemo.set(key, out);
  return out;
}

// EV (per unit bet) of standing with a hand against a dealer upcard u.
function standEV(h, ace, u) {
  if (h > 21) return -1;
  const t = best(h, ace);
  const d = dealerDist(u, u === 1);
  let ev = 0;
  for (let k = 0; k < 6; k++) {
    if (k === 5) ev += d[k]; // dealer busts: player wins
    else if (t > k + 17) ev += d[k];
    else if (t < k + 17) ev -= d[k];
  }
  return ev;
}

// ---- optimal hit/stand (infinite deck) -------------------------------------
const valueMemo = new Map();
// value(h, ace, u) -> { ev, stand, hit, action } with optimal play from here.
function value(h, ace, u) {
  const key = `${h}|${ace ? 1 : 0}|${u}`;
  const hit = valueMemo.get(key);
  if (hit) return hit;
  const stand = standEV(h, ace, u);
  let hitEV = null;
  if (best(h, ace) < 21) {
    hitEV = 0;
    RANKS.forEach((c, i) => {
      const nh = h + c;
      const nv = nh > 21 ? -1 : value(nh, ace || c === 1, u).ev;
      hitEV += PROB[i] * nv;
    });
  }
  const res = {
    ev: hitEV === null ? stand : Math.max(stand, hitEV),
    stand,
    hit: hitEV,
    action: hitEV !== null && hitEV > stand ? 'Hit' : 'Stand',
  };
  valueMemo.set(key, res);
  return res;
}

// ---- split (infinite deck, no re-split) ------------------------------------
// EV of the TOTAL bet after splitting a pair of rank r against upcard u (2 units).
function splitEV(r, u) {
  let s = 0;
  RANKS.forEach((c, i) => {
    if (r === 1) s += PROB[i] * standEV(1 + c, true, u); // split aces: one card each
    else s += PROB[i] * value(r + c, c === 1, u).ev;
  });
  return 2 * s;
}
// EV of NOT splitting: the pair is played as one hand (1 unit).
function noSplitEV(r, u) {
  return r === 1 ? value(2, true, u).ev : value(2 * r, false, u).ev;
}

// ---- finite shoe Monte Carlo -----------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Shoe {
  constructor(seed, decks = 6) {
    this.rng = mulberry32(seed);
    this.decks = decks;
    this.reshuffle();
  }
  reshuffle() {
    const cards = [];
    for (let d = 0; d < this.decks; d++) {
      for (let r = 1; r <= 9; r++) for (let k = 0; k < 4; k++) cards.push(r);
      for (let k = 0; k < 16; k++) cards.push(10);
    }
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    this.cards = cards;
    this.i = 0;
  }
  maybeReshuffle() {
    if (this.i > this.cards.length * 0.75) this.reshuffle(); // cut card at 75%
  }
  draw() {
    return this.cards[this.i++];
  }
}

// Policies decide split and hit from the table or a fixed rule.
const POLICIES = {
  'Optimal (hit/stand + split)': {
    split: (r, u) => splitEV(r, u) > noSplitEV(r, u),
    hit: (h, ace, u) => value(h, ace, u).action === 'Hit',
  },
  'Optimal hit/stand, never split': {
    split: () => false,
    hit: (h, ace, u) => value(h, ace, u).action === 'Hit',
  },
  'Hit to 17': {
    split: () => false,
    hit: (h, ace) => best(h, ace) < 17,
  },
  'Always stand': {
    split: () => false,
    hit: () => false,
  },
};

function playOut(shoe, h, ace, u, policy) {
  for (;;) {
    if (h > 21) return 0; // bust
    if (best(h, ace) >= 21 || !policy.hit(h, ace, u)) return best(h, ace);
    const c = shoe.draw();
    h += c;
    ace = ace || c === 1;
  }
}

function dealerPlay(shoe, h, ace) {
  for (;;) {
    if (h > 21) return 0;
    const t = best(h, ace);
    if (t >= 17) return t;
    const c = shoe.draw();
    h += c;
    ace = ace || c === 1;
  }
}

function outcome(player, dealer) {
  if (player === 0) return -1;
  if (dealer === 0) return 1;
  return player > dealer ? 1 : player < dealer ? -1 : 0;
}

function runPolicy(policy, n, seed, predict) {
  const shoe = new Shoe(seed);
  let sum = 0;
  let sumSq = 0;
  let pred = 0;
  let splits = 0;
  for (let i = 0; i < n; i++) {
    shoe.maybeReshuffle();
    const a = shoe.draw();
    const up = shoe.draw();
    const b = shoe.draw();
    const hole = shoe.draw();
    let res = 0;
    // Player hands are settled after the player finishes and the dealer plays
    // (the dealer draws after the player).
    const finals = [];
    if (a === b && policy.split(a, up)) {
      splits++;
      for (let k = 0; k < 2; k++) {
        const c = shoe.draw();
        finals.push(a === 1 ? best(1 + c, true) : playOut(shoe, a + c, c === 1, up, policy));
      }
    } else {
      finals.push(playOut(shoe, a + b, a === 1 || b === 1, up, policy));
    }
    const dl = dealerPlay(shoe, up + hole, up === 1 || hole === 1);
    for (const f of finals) res += outcome(f, dl);
    sum += res;
    sumSq += res * res;
    if (predict) pred += optimalStartEV(a, b, up);
  }
  const mean = sum / n;
  const sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  return { mean, stderr: sd / Math.sqrt(n), predicted: pred / n, splits };
}

// The DP's EV for the optimal decision on a dealt starting hand.
function optimalStartEV(a, b, up) {
  if (a === b) return Math.max(splitEV(a, up), noSplitEV(a, up));
  return value(a + b, a === 1 || b === 1, up).ev;
}

// ---- strategy tables ------------------------------------------------------
const hardRows = [];
for (let t = 4; t <= 20; t++) hardRows.push({ kind: 'hard', total: t, h: t, ace: false });
for (let x = 2; x <= 9; x++) hardRows.push({ kind: 'soft', total: 11 + x, h: x + 1, ace: true });

function tableRows() {
  const rows = [];
  for (const row of hardRows) {
    for (const u of UPS) {
      const v = value(row.h, row.ace, u);
      rows.push({
        kind: row.kind,
        total: row.total,
        upcard: label(u),
        standEV: v.stand,
        hitEV: v.hit,
        action: v.action,
      });
    }
  }
  return rows;
}

function pairRows() {
  const rows = [];
  for (const r of RANKS) {
    for (const u of UPS) {
      const s = splitEV(r, u);
      const n = noSplitEV(r, u);
      const v = r === 1 ? value(2, true, u) : value(2 * r, false, u);
      rows.push({
        pair: label(r),
        upcard: label(u),
        splitEV: s,
        noSplitEV: n,
        decision: s > n ? 'Split' : v.action,
      });
    }
  }
  return rows;
}

// ---- SVG charts -------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const C = { stand: '#1f77b4', hit: '#d62728', split: '#2ca02c', nosplit: '#ff7f0e', bar: '#4c78a8' };

function legendSvg(items, x, y) {
  return items
    .map(
      (it, i) =>
        `<rect x="${x + i * 130}" y="${y - 10}" width="14" height="4" fill="${it.color}"/>` +
        `<text x="${x + i * 130 + 20}" y="${y}">${esc(it.name)}</text>`,
    )
    .join('');
}

// Small multiples: each panel is a line chart with one or more series.
function panelsSvg({ title, legend, panels, cols = 5, W = 250, H = 200, yDomain, yStep, xDomain, xTicks }) {
  const rows = Math.ceil(panels.length / cols);
  const width = cols * W;
  const height = rows * H + 50;
  const pad = { l: 42, r: 10, t: 26, b: 30 };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Helvetica, Arial, sans-serif" font-size="11">`;
  s += `<rect width="100%" height="100%" fill="#ffffff"/>`;
  s += `<text x="10" y="22" font-size="16" font-weight="bold">${esc(title)}</text>`;
  s += legendSvg(legend, 10, 42);
  panels.forEach((p, k) => {
    const ox = (k % cols) * W;
    const oy = 50 + Math.floor(k / cols) * H;
    const x0 = ox + pad.l;
    const x1 = ox + W - pad.r;
    const y0 = oy + pad.t;
    const y1 = oy + H - pad.b;
    const X = (v) => x0 + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (x1 - x0);
    const Y = (v) => y1 - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (y1 - y0);
    s += `<text x="${x0}" y="${oy + 14}" font-weight="bold">${esc(p.title)}</text>`;
    for (let t = yDomain[0]; t <= yDomain[1] + 1e-9; t += yStep) {
      s += `<line x1="${x0}" x2="${x1}" y1="${Y(t)}" y2="${Y(t)}" stroke="${Math.abs(t) < 1e-9 ? '#888' : '#e6e6e6'}"/>`;
      s += `<text x="${x0 - 4}" y="${Y(t) + 4}" text-anchor="end" fill="#555">${t.toFixed(1)}</text>`;
    }
    for (const xt of xTicks) {
      s += `<text x="${X(xt.v)}" y="${y1 + 14}" text-anchor="middle" fill="#555">${esc(xt.label)}</text>`;
    }
    for (const sr of p.series) {
      const pts = sr.points.filter((q) => q[1] !== null);
      const d = pts.map((q, i) => `${i ? 'L' : 'M'}${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join('');
      s += `<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="2"/>`;
      for (const q of pts) s += `<circle cx="${X(q[0]).toFixed(1)}" cy="${Y(q[1]).toFixed(1)}" r="2.5" fill="${sr.color}"/>`;
    }
  });
  return s + `</svg>`;
}

// Bar chart with standard error bars.
function barsSvg({ title, bars, W = 760, H = 380 }) {
  const pad = { l: 60, r: 20, t: 50, b: 110 };
  const vals = bars.flatMap((b) => [b.value - b.err, b.value + b.err, 0]);
  const lo = Math.floor(Math.min(...vals) * 10) / 10 - 0.1;
  const hi = Math.ceil(Math.max(...vals) * 10) / 10 + 0.1;
  const x0 = pad.l;
  const x1 = W - pad.r;
  const y0 = pad.t;
  const y1 = H - pad.b;
  const Y = (v) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
  const slot = (x1 - x0) / bars.length;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif" font-size="12">`;
  s += `<rect width="100%" height="100%" fill="#ffffff"/>`;
  s += `<text x="${x0}" y="28" font-size="16" font-weight="bold">${esc(title)}</text>`;
  for (let t = Math.ceil(lo * 10) / 10; t <= hi + 1e-9; t += 0.1) {
    const v = Math.round(t * 10) / 10;
    s += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#888' : '#e6e6e6'}"/>`;
    s += `<text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" fill="#555">${v.toFixed(1)}</text>`;
  }
  bars.forEach((b, i) => {
    const cx = x0 + slot * (i + 0.5);
    const bw = slot * 0.55;
    const top = Math.min(Y(b.value), Y(0));
    const h = Math.abs(Y(b.value) - Y(0));
    s += `<rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${h}" fill="${b.color}"/>`;
    s += `<line x1="${cx}" x2="${cx}" y1="${Y(b.value - b.err)}" y2="${Y(b.value + b.err)}" stroke="#222"/>`;
    s += `<text x="${cx}" y="${b.value >= 0 ? top - 14 : top + h + 26}" text-anchor="middle" font-weight="bold">${b.value.toFixed(3)}</text>`;
    const lines = b.label.split('\n');
    lines.forEach((ln, j) => {
      s += `<text x="${cx}" y="${y1 + 18 + j * 15}" text-anchor="middle">${esc(ln)}</text>`;
    });
  });
  return s + `</svg>`;
}

// ---- main -------------------------------------------------------------------
function main() {
  // 1. Exact tables
  const rows = tableRows();
  const prow = pairRows();

  const csvHard = ['kind,total,dealer_upcard,stand_ev,hit_ev,optimal_action'];
  for (const r of rows) {
    csvHard.push(
      [r.kind, r.total, r.upcard, r.standEV.toFixed(4), r.hitEV === null ? '' : r.hitEV.toFixed(4), r.action].join(','),
    );
  }
  writeFileSync(join(OUT, 'strategy-hit-stand.csv'), csvHard.join('\n') + '\n');

  const csvPairs = ['pair,dealer_upcard,split_ev_total,no_split_ev,decision'];
  for (const r of prow) {
    csvPairs.push([r.pair, r.upcard, r.splitEV.toFixed(4), r.noSplitEV.toFixed(4), r.decision].join(','));
  }
  writeFileSync(join(OUT, 'strategy-split.csv'), csvPairs.join('\n') + '\n');

  // Printed strategy chart: H = hit, S = stand, P = split, N = don't split (use hit/stand)
  const cols = UPS.map(label);
  console.log('\nOptimal hard/soft strategy (H=hit, S=stand)');
  console.log('total  ' + cols.map((c) => c.padStart(3)).join(''));
  for (const row of hardRows) {
    const cells = UPS.map((u) => {
      const v = value(row.h, row.ace, u);
      return (v.action === 'Hit' ? 'H' : 'S').padStart(3);
    });
    console.log(`${(row.kind === 'soft' ? 'A,' + (row.total - 11) : String(row.total)).padEnd(6)} ` + cells.join(''));
  }
  console.log('\nPairs (P=split, else hit/stand as hand)');
  console.log('pair   ' + cols.map((c) => c.padStart(4)).join(''));
  for (const r of RANKS) {
    const cells = UPS.map((u) => {
      const p = prow.find((x) => x.pair === label(r) && x.upcard === label(u));
      return (p.decision === 'Split' ? 'P' : p.decision === 'Hit' ? 'H' : 'S').padStart(4);
    });
    console.log(`${(label(r) + label(r)).padEnd(6)} ` + cells.join(''));
  }

  // 2. Charts from the exact tables
  const hardPanels = UPS.map((u) => {
    const pts = (key) => {
      const out = [];
      for (let t = 4; t <= 20; t++) {
        const v = value(t, false, u);
        out.push([t, key === 'stand' ? v.stand : v.hit]);
      }
      return out;
    };
    return {
      title: `Dealer ${label(u)}`,
      series: [
        { color: C.stand, points: pts('stand') },
        { color: C.hit, points: pts('hit') },
      ],
    };
  });
  writeFileSync(
    join(OUT, 'chart-hit-vs-stand.svg'),
    panelsSvg({
      title: 'Hit vs stand EV by hard total (per unit bet), one panel per dealer upcard',
      legend: [
        { name: 'Stand EV', color: C.stand },
        { name: 'Hit EV (then optimal)', color: C.hit },
      ],
      panels: hardPanels,
      yDomain: [-1, 1],
      yStep: 0.5,
      xDomain: [4, 20],
      xTicks: [4, 8, 12, 16, 20].map((v) => ({ v, label: String(v) })),
    }),
  );

  const splitPanels = RANKS.map((r) => {
    const series = [
      { color: C.split, points: UPS.map((u, i) => [i, splitEV(r, u)]) },
      { color: C.nosplit, points: UPS.map((u, i) => [i, noSplitEV(r, u)]) },
    ];
    return { title: `Pair of ${label(r)}s`, series };
  });
  writeFileSync(
    join(OUT, 'chart-split-vs-nosplit.svg'),
    panelsSvg({
      title: 'Split vs no-split EV by pair, total bet (split = 2 units), one panel per pair',
      legend: [
        { name: 'Split (total EV)', color: C.split },
        { name: "Don't split (EV)", color: C.nosplit },
      ],
      panels: splitPanels,
      yDomain: [-2, 2],
      yStep: 1,
      xDomain: [0, UPS.length - 1],
      xTicks: UPS.map((u, i) => ({ v: i, label: label(u) })),
    }),
  );

  // 3. Monte Carlo validation on a 6-deck shoe, same seed for every policy
  const mc = [];
  for (const [name, policy] of Object.entries(POLICIES)) {
    const isOpt = name.startsWith('Optimal (');
    const r = runPolicy(policy, HANDS, SEED, isOpt);
    mc.push({ name, ...r });
    console.log(
      `\n${name}: EV/hand ${r.mean.toFixed(4)} ± ${r.stderr.toFixed(4)} (splits: ${r.splits})` +
        (isOpt ? `\n  infinite-deck DP prediction for the same dealt hands: ${r.predicted.toFixed(4)}` : ''),
    );
  }
  const colors = [C.split, C.stand, C.bar, C.hit];
  const bars = mc.map((m, i) => ({
    label: m.name.replace(' (hit/stand + split)', '\nhit/stand + split').replace('Optimal hit/stand, never split', 'Optimal hit/stand\nnever split').replace('Hit to 17', 'Hit to 17').replace('Always stand', 'Always stand'),
    value: m.mean,
    err: 2 * m.stderr,
    color: colors[i],
  }));
  writeFileSync(
    join(OUT, 'chart-policy-ev.svg'),
    barsSvg({
      title: `Simulated EV per hand by policy (6-deck shoe, ${HANDS.toLocaleString('en-US')} hands each, ±2 s.e.)`,
      bars,
    }),
  );

  const csvMc = ['policy,hands,ev_per_hand,stderr,splits'];
  for (const m of mc) csvMc.push([`"${m.name}"`, HANDS, m.mean.toFixed(5), m.stderr.toFixed(5), m.splits].join(','));
  writeFileSync(join(OUT, 'policy-ev.csv'), csvMc.join('\n') + '\n');
  console.log(`\nWrote CSVs and SVG charts to ${OUT}`);
}

main();
