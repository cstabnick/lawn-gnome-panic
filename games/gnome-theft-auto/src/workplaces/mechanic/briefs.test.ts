import { describe, expect, it } from 'vitest';
import { defaultLoadout, loadoutCost, normalizeLoadout, type Loadout } from '@lawn/glaze';
import { BRIEFS, briefsForLevel, hueFamily, pickBrief, scoreBrief, wantMet } from './briefs';
import { GLAZE_KINDS } from '../../glazeStore';
import type { Brief, HueFamily } from './types';

const HUE_PAINT: Record<HueFamily, number> = {
  red: 0xd8342c, orange: 0xf05a24, yellow: 0xf2c230, green: 0x2e7d32, teal: 0x1d6b63, blue: 0x1f6feb, purple: 0x8e44ad,
  pink: 0xff7eb6, brown: 0x6b4a2f, black: 0x1c1c22, white: 0xf1f1ee, grey: 0x808080,
};

const startOf = (b: Brief): Loadout => normalizeLoadout({ ...defaultLoadout(0x888888), ...b.start });

/** A loadout that meets every want of the brief (cheapest obvious choices). */
function solve(b: Brief): Loadout {
  const start = startOf(b);
  const l: Loadout = { ...start, extras: [...start.extras] };
  const empty: Record<string, string> = { tyre: 'stock', rim: 'stock', steer: 'stock', lamp: 'stock', grille: 'stock', bumper: 'stock', horn: 'stock' };
  for (const { want } of b.wants) {
    switch (want.kind) {
      case 'paint': l.paint = HUE_PAINT[want.hue]; break;
      case 'finish': l.finish = want.any[0] as Loadout['finish']; break;
      case 'loud': l.horn = 'kazoo'; break;
      case 'quiet': l.horn = 'stock'; l.exhaust = 'none'; break;
      case 'glow': l.underglow = 0x7dff6a; break;
      case 'low': l.rideHeight = -0.5; break;
      case 'high': l.rideHeight = 0.5; break;
      case 'bigWheels': l.wheelSize = 1.3; break;
      case 'part': {
        const rec = l as unknown as Record<string, string>;
        rec[want.slot] = want.any?.[0] ?? (want.slot === 'rim' ? 'fivespoke' : want.slot === 'canopy' ? 'umbrella' : want.slot === 'spoiler' ? 'ducktail' : 'chrome');
        break;
      }
      case 'noPart': (l as unknown as Record<string, string>)[want.slot] = empty[want.slot] ?? 'none'; break;
      case 'extra': l.extras = [...new Set([...l.extras, want.any[0] as Loadout['extras'][number]])]; break;
      case 'keep': break;
      case 'changed': l.tyre = 'fat'; l.rim = 'mesh'; l.steer = 'racing'; break;
    }
  }
  return l;
}

describe('hueFamily', () => {
  it('names the swatches', () => {
    expect(hueFamily(0xff7eb6)).toBe('pink');
    expect(hueFamily(0xd8342c)).toBe('red');
    expect(hueFamily(0x6b4a2f)).toBe('brown');
    expect(hueFamily(0x1d6b63)).toBe('teal');
    expect(hueFamily(0x8e44ad)).toBe('purple');
    expect(hueFamily(0x1c1c22)).toBe('black');
    expect(hueFamily(0xf1f1ee)).toBe('white');
    expect(hueFamily(0x808080)).toBe('grey');
  });
});

describe('briefs', () => {
  it('has 16 well-formed briefs', () => {
    expect(BRIEFS.length).toBe(16);
    expect(new Set(BRIEFS.map((b) => b.id)).size).toBe(16);
    for (const b of BRIEFS) {
      expect(b.id.startsWith('brief-')).toBe(true);
      expect(GLAZE_KINDS).toContain(b.vehicle);
      expect(b.wants.length).toBeGreaterThanOrEqual(2);
      expect(b.wants.length).toBeLessThanOrEqual(4);
      expect(b.budget).toBeGreaterThanOrEqual(60);
      expect(b.budget).toBeLessThanOrEqual(400);
    }
  });

  it('keeps every start value valid', () => {
    for (const b of BRIEFS) {
      const merged = { ...defaultLoadout(0x888888), ...b.start };
      expect(normalizeLoadout(merged)).toEqual(merged);
    }
  });

  it('is satisfiable inside the budget for five stars', () => {
    for (const b of BRIEFS) {
      const start = startOf(b);
      const final = solve(b);
      for (const x of b.wants) expect(wantMet(x.want, start, final), `${b.id}: ${x.says}`).toBe(true);
      const cost = loadoutCost(start, final);
      expect(cost, b.id).toBeLessThanOrEqual(b.budget);
      expect(scoreBrief(b, start, final, cost).stars, b.id).toBe(5);
    }
  });

  it('scores an unchanged car 10 or less', () => {
    for (const b of BRIEFS) {
      const start = startOf(b);
      expect(scoreBrief(b, start, start, 0).score).toBeLessThanOrEqual(10);
    }
  });

  it('lowers the score when far over budget', () => {
    const b = BRIEFS.find((x) => x.id === 'brief-pink-loud') as Brief;
    const start = startOf(b);
    const final = solve(b);
    const ok = scoreBrief(b, start, final, 50);
    const over = scoreBrief(b, start, final, b.budget * 3);
    expect(over.score).toBeLessThan(ok.score);
    expect(over.overBudget).toBe(b.budget * 2);
    expect(over.lines.some((l) => l.startsWith('Over budget by'))).toBe(true);
  });

  it('opens at least one brief at every level, and picks without repeating', () => {
    for (let lv = 1; lv <= 5; lv++) expect(briefsForLevel(lv).some((b) => b.minLevel === lv)).toBe(true);
    const a = pickBrief(3, 5, null);
    expect(a).not.toBeNull();
    expect(pickBrief(3, 5, a?.id ?? null)?.id).not.toBe(a?.id);
  });
});
