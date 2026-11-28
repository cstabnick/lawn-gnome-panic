// Parity guard for the trick layer: a fixed scripted run of the recognizer and the combo is compared with a recorded
// result (tricks.golden.json). Captured once before the layer moved to @lawn/trickboard; never recapture to make it pass.
import { describe, expect, it } from 'vitest';
import { AIR_GESTURES, GROUND_GESTURES, SIM_HZ, type Mode, type PhysEvent, type Player } from './config';
import { createCombo, createRecognizer } from './tricks';

const DT = 1 / SIM_HZ;
const GOLDEN = new URL('./tricks.golden.json', import.meta.url);
// This game has no node typings, so load fs by a computed name.
const FS = 'node:fs';
const { readFileSync, writeFileSync } = (await import(/* @vite-ignore */ FS)) as {
  readFileSync(url: URL, enc: string): string;
  writeFileSync(url: URL, data: string): void;
};

type Hold = [x: number, y: number, secs: number, mode: Mode, mod: boolean];
const ZONE_XY: Record<string, [number, number]> = {
  N: [0, 1], NE: [0.7, 0.7], E: [1, 0], SE: [0.7, -0.7], S: [0, -1], SW: [-0.7, -0.7], W: [-1, 0], NW: [-0.7, 0.7],
};

function stickScript(): Hold[] {
  const h: Hold[] = [];
  // every ground gesture with its own grab state, then again with the opposite one
  for (const flip of [false, true]) {
    for (const g of GROUND_GESTURES) {
      h.push([0, 0, 0.1, 'ground', false], [0, -1, 0.15, 'ground', g.mod !== flip]);
      for (const z of g.path) h.push([...ZONE_XY[z], 0.05, 'ground', g.mod !== flip] as Hold);
      h.push([0, 0, 0.3, 'ground', false]);
    }
  }
  // plain flick, idle wobble
  h.push([0, 0, 0.2, 'ground', false], [0, 1, 0.1, 'ground', false], [0, 0, 0.3, 'ground', false]);
  h.push([0, -0.45, 0.2, 'ground', false], [0.4, 0.3, 0.2, 'ground', false], [0, 0, 0.2, 'ground', false]);
  // every air zone, with and without a grab, plus a slow flick
  for (const mod of [false, true]) {
    for (const g of AIR_GESTURES) h.push([0, 0, 0.1, 'air', mod], [...ZONE_XY[g.zone], 0.05, 'air', mod] as Hold, [0, 0, 0.2, 'air', mod]);
  }
  h.push([0, 0, 0.1, 'air', false], [0.7, 0, 0.3, 'air', false], [-1, 0, 0.1, 'air', false], [0, 0, 0.2, 'air', false]);
  // a ground pop straight into the air, and a bail
  h.push([0, -1, 0.15, 'ground', false], [0, 1, 0.1, 'ground', false], [0, 1, 0.3, 'air', false], [0, 0, 0.2, 'air', false]);
  h.push([0, -1, 0.15, 'bail', false], [0, 1, 0.1, 'bail', false], [0, 0, 0.1, 'ground', false]);
  // rim sweeps
  for (const [from, to] of [[180, 0], [180, 360], [180, 45]] as const) {
    h.push([0, -1, 0.15, 'ground', false]);
    for (let i = 0; i <= 20; i++) {
      const a = ((from + ((to - from) * i) / 20) * Math.PI) / 180;
      h.push([Math.sin(a), Math.cos(a), DT, 'ground', false]);
    }
    h.push([Math.sin((to * Math.PI) / 180), Math.cos((to * Math.PI) / 180), 0.15, 'ground', false], [0, 0, 0.3, 'ground', false]);
  }
  return h;
}

function recordStick(): unknown[] {
  const r = createRecognizer();
  const out: unknown[] = [];
  let step = 0;
  for (const [x, y, secs, mode, mod] of stickScript()) {
    const n = Math.max(1, Math.round(secs * SIM_HZ));
    for (let i = 0; i < n; i++) {
      const cmd = r.feed({ x, y }, mode, DT, mod);
      if (cmd) out.push({ step, ...cmd });
      step++;
    }
  }
  out.push({ step, trail: r.trail() });
  return out;
}

type Step = { ev: PhysEvent } | { tick: number; mode?: Mode };
const land = (over: Partial<Extract<PhysEvent, { e: 'land' }>>): PhysEvent =>
  ({ e: 'land', perfect: false, spin: 0, flips: 0, airT: 0.5, impact: 5, switchLand: false, ...over });
const COMBO: Step[] = [
  { ev: { e: 'takeoff', speed: 20, ollie: true } }, { ev: { e: 'pop', trick: 'ollie' } },
  { ev: { e: 'trickDone', trick: 'kickflip' } }, { ev: { e: 'grabStart', kind: 1, name: 'indy' } },
  { ev: { e: 'grabEnd', kind: 1, t: 0.1, name: 'indy' } }, { ev: { e: 'grabEnd', kind: 2, t: 0.6, name: 'melon' } },
  { ev: land({ perfect: true, spin: 540, flips: 0, airT: 1.7, near: true }) },
  { tick: 60 }, { tick: 120 }, { tick: 30 },
  { ev: { e: 'takeoff', speed: 25, ollie: false } }, { ev: { e: 'pop', trick: 'treFlip' } },
  { ev: { e: 'trickDone', trick: 'treFlip' } }, { ev: { e: 'trickDone', trick: 'doubleTre' } },
  { ev: land({ spin: -360, flips: 2, switchLand: true }) }, { tick: 200 },
  { ev: { e: 'takeoff', speed: 22, ollie: true } }, { ev: land({ spin: 180, flips: -1 }) }, { tick: 10 },
  { ev: { e: 'grindStart', rail: 1, ley: true, spin: 180, kind: 'fiftyFifty' } },
  { ev: { e: 'grindSwitch', from: 'fiftyFifty', to: 'boardslide', t: 0.8, ley: true } },
  { ev: { e: 'grindSwitch', from: 'boardslide', to: 'noseGrind', t: 0.4, ley: true } },
  { ev: { e: 'grindEnd', t: 0.7, ley: true, kind: 'noseGrind' } },
  { ev: { e: 'manualStart', kind: 'nose' } }, { tick: 150, mode: 'ground' },
  { ev: { e: 'manualEnd', kind: 'nose', t: 1.2, fell: false } }, { tick: 100, mode: 'ground' }, { tick: 100, mode: 'ground' },
  { ev: { e: 'manualStart', kind: 'tail' } }, { ev: { e: 'manualEnd', kind: 'tail', t: 0.1, fell: true } }, { tick: 200, mode: 'ground' },
  { ev: { e: 'takeoff', speed: 20, ollie: true } }, { ev: { e: 'trickDone', trick: 'heelflip' } },
  { ev: { e: 'bail', reason: 'test' } }, { tick: 50 },
  { ev: { e: 'takeoff', speed: 20, ollie: true } }, { ev: { e: 'trickDone', trick: 'impossible' } },
  { ev: { e: 'skyfall' } }, { ev: { e: 'respawn' } },
  { ev: { e: 'takeoff', speed: 20, ollie: true } }, { ev: { e: 'warp' } },
  { ev: { e: 'trickDone', trick: 'nightmare' } }, { ev: { e: 'respawn' } }, { tick: 20 },
];

function recordCombo(): unknown[] {
  const combo = createCombo();
  const p = { t: 0, mode: 'air' as Mode };
  const out: unknown[] = [];
  for (const s of COMBO) {
    if ('ev' in s) {
      combo.event(s.ev, p as unknown as Player);
    } else {
      p.mode = s.mode ?? 'ground';
      for (let i = 0; i < s.tick; i++) { p.t += DT; combo.tick(DT, p as unknown as Player); }
    }
    out.push(JSON.parse(JSON.stringify(combo.view())));
  }
  return out;
}

describe('trick layer golden', () => {
  const actual = { stick: recordStick(), combo: recordCombo() };
  if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.GOLDEN_CAPTURE) writeFileSync(GOLDEN, JSON.stringify(actual, null, 1) + '\n');

  it('the recognizer returns the recorded commands', () => {
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));
    expect(actual.stick.length).toBeGreaterThan(40);
    expect(JSON.parse(JSON.stringify(actual.stick))).toEqual(golden.stick);
  });

  it('the combo shows the recorded view after every step', () => {
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));
    expect(actual.combo).toHaveLength(COMBO.length);
    expect(JSON.parse(JSON.stringify(actual.combo))).toEqual(golden.combo);
  });
});
