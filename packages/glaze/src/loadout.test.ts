import { describe, expect, it } from 'vitest';
import {
  BEAM_IDS, BUMPER_IDS, CANOPY_IDS, DECAL_IDS, EXHAUST_IDS, EXTRA_IDS, FINISH_IDS, GRILLE_IDS, HORN_IDS, LAMP_IDS, MIRROR_IDS,
  ORNAMENT_IDS, RIM_IDS, SEAT_IDS, SPOILER_IDS, STEER_IDS, TYRE_IDS,
} from './ids';
import { PRICES, modById } from './catalog';
import {
  decodeLoadout, defaultLoadout, encodeLoadout, isStockLoadout, loadoutCost, loadoutCostLines, normalizeLoadout, sameLoadout,
} from './loadout';
import { CAMBER_MAX, CAMBER_MIN, Loadout, MAX_EXTRAS, WHEEL_SIZE_MAX, WHEEL_SIZE_MIN } from './types';

const RED = 0xd8342c;

/** Small seeded PRNG (mulberry32) so the random loadouts are the same on every run. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomLoadout(r: () => number): Loadout {
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(r() * list.length)] as T;
  const pickNone = <T extends string>(list: readonly T[]): T | 'none' => (r() < 0.2 ? 'none' : pick(list));
  const extras = EXTRA_IDS.filter(() => r() < 0.5).slice(0, MAX_EXTRAS);
  return {
    paint: Math.floor(r() * 0x1000000),
    finish: pick(FINISH_IDS),
    decal: pickNone(DECAL_IDS),
    decalColor: Math.floor(r() * 0x1000000),
    decalNumber: Math.floor(r() * 100),
    tyre: pick(TYRE_IDS),
    rim: pick(RIM_IDS),
    rimColor: Math.floor(r() * 0x1000000),
    wheelSize: Math.round((WHEEL_SIZE_MIN + r() * (WHEEL_SIZE_MAX - WHEEL_SIZE_MIN)) * 100) / 100,
    camberFront: Math.round((CAMBER_MIN + r() * (CAMBER_MAX - CAMBER_MIN)) * 10) / 10,
    camberRear: Math.round((CAMBER_MIN + r() * (CAMBER_MAX - CAMBER_MIN)) * 10) / 10,
    rideHeight: Math.round((-1 + r() * 2) * 100) / 100,
    steer: pick(STEER_IDS),
    lamp: pick(LAMP_IDS),
    beam: pick(BEAM_IDS),
    spoiler: pickNone(SPOILER_IDS),
    seat: pickNone(SEAT_IDS),
    ornament: pickNone(ORNAMENT_IDS),
    extras,
    underglow: r() < 0.5 ? null : Math.floor(r() * 0x1000000),
    grille: pick(GRILLE_IDS),
    bumper: pick(BUMPER_IDS),
    canopy: pickNone(CANOPY_IDS),
    mirror: pickNone(MIRROR_IDS),
    exhaust: pickNone(EXHAUST_IDS),
    horn: pick(HORN_IDS),
  };
}

const fullLoadout: Loadout = {
  paint: 0x123456, finish: 'chameleon', decal: 'number', decalColor: 0xabcdef, decalNumber: 99,
  tyre: 'saucer', rim: 'turbine', rimColor: 0x010203, wheelSize: 1.5, camberFront: -25, camberRear: 8, rideHeight: -1,
  steer: 'pretzel', lamp: 'acorn', beam: 'violet', spoiler: 'leaf', seat: 'throne', ornament: 'gnomelet',
  extras: ['dice', 'flag', 'pipes', 'bell'], underglow: 0x7dff6a,
  grille: 'slot', bumper: 'cowcatcher', canopy: 'bubble', mirror: 'periscope', exhaust: 'trumpet', horn: 'kazoo',
};

describe('normalizeLoadout', () => {
  it('returns the default for garbage input', () => {
    expect(normalizeLoadout(null, RED)).toEqual(defaultLoadout(RED));
    expect(normalizeLoadout(undefined, RED)).toEqual(defaultLoadout(RED));
    expect(normalizeLoadout({}, RED)).toEqual(defaultLoadout(RED));
    expect(normalizeLoadout({ paint: Number.NaN, wheelSize: Number.POSITIVE_INFINITY }, RED)).toEqual(defaultLoadout(RED));
    expect(normalizeLoadout('nope' as unknown as Loadout, RED)).toEqual(defaultLoadout(RED));
  });

  it('replaces unknown ids with the default', () => {
    const n = normalizeLoadout({ finish: 'sparkle' as never, tyre: 'nope' as never, decal: 'wrong' as never, spoiler: 'xyz' as never }, RED);
    expect(n.finish).toBe('gloss');
    expect(n.tyre).toBe('stock');
    expect(n.decal).toBe('none');
    expect(n.spoiler).toBe('none');
  });

  it('clamps out-of-range numbers and rounds them', () => {
    const n = normalizeLoadout({
      decalNumber: 500, wheelSize: 9, camberFront: -99, camberRear: 99.44, rideHeight: 5, paint: 0x1ff123456,
    }, RED);
    expect(n.decalNumber).toBe(99);
    expect(n.wheelSize).toBe(WHEEL_SIZE_MAX);
    expect(n.camberFront).toBe(CAMBER_MIN);
    expect(n.camberRear).toBe(CAMBER_MAX);
    expect(n.rideHeight).toBe(1);
    expect(n.paint).toBe(0x123456);
    expect(normalizeLoadout({ wheelSize: 0.123, camberFront: 1.27, rideHeight: -0.456 }, RED)).toMatchObject({
      wheelSize: 0.8, camberFront: 1.3, rideHeight: -0.46,
    });
    expect(normalizeLoadout({ wheelSize: 1.234 }, RED).wheelSize).toBe(1.23);
  });

  it('removes duplicate extras (keeping the first) and caps them at MAX_EXTRAS', () => {
    const n = normalizeLoadout({ extras: ['dice', 'dice', 'flag', 'bogus' as never, 'pipes', 'bell', 'roobar'] }, RED);
    expect(n.extras).toEqual(['dice', 'flag', 'pipes', 'bell']);
    expect(n.extras.length).toBe(MAX_EXTRAS);
  });

  it('ignores non-array extras and keeps the default', () => {
    expect(normalizeLoadout({ extras: 'dice' as never }, RED).extras).toEqual([]);
  });

  it('validates the six new fields: unknown ids become the default, none is allowed where it means no part', () => {
    const n = normalizeLoadout({
      grille: 'chrome' as never, bumper: 'nope' as never, canopy: 'none', mirror: 'xyz' as never, exhaust: 'bogus' as never,
      horn: 'air-raid' as never,
    }, RED);
    expect(n.grille).toBe('stock');
    expect(n.bumper).toBe('stock');
    expect(n.canopy).toBe('none');
    expect(n.mirror).toBe('none');
    expect(n.exhaust).toBe('none');
    expect(n.horn).toBe('stock');
    expect(normalizeLoadout({ canopy: 'umbrella', mirror: 'spoon', exhaust: 'twin', horn: 'moo', grille: 'wire', bumper: 'log' }, RED))
      .toMatchObject({ canopy: 'umbrella', mirror: 'spoon', exhaust: 'twin', horn: 'moo', grille: 'wire', bumper: 'log' });
    expect(normalizeLoadout({ grille: 'none' as never, horn: 'none' as never }, RED)).toMatchObject({ grille: 'stock', horn: 'stock' });
  });

  it('returns a fresh object, never the input', () => {
    const input = normalizeLoadout(fullLoadout, RED);
    const out = normalizeLoadout(input, RED);
    expect(out).not.toBe(input);
    expect(out.extras).not.toBe(input.extras);
  });
});

describe('encodeLoadout / decodeLoadout', () => {
  it('round-trips the default loadout', () => {
    const l = defaultLoadout(RED);
    const code = encodeLoadout(l);
    expect(code.startsWith('g1.')).toBe(true);
    expect(decodeLoadout(code)).toEqual(normalizeLoadout(l));
  });

  it('round-trips a loadout with every field set', () => {
    expect(decodeLoadout(encodeLoadout(fullLoadout))).toEqual(normalizeLoadout(fullLoadout));
  });

  it('round-trips 200 seeded random loadouts within the length limit', () => {
    const r = seeded(20260815);
    for (let i = 0; i < 200; i++) {
      const l = randomLoadout(r);
      const code = encodeLoadout(l);
      expect(code.length).toBeLessThanOrEqual(120);
      expect(/^[A-Za-z0-9._-]+$/.test(code)).toBe(true);
      expect(decodeLoadout(code)).toEqual(normalizeLoadout(l));
    }
  });

  it('decodes to null for bad codes', () => {
    expect(decodeLoadout('g1.')).toBeNull();
    expect(decodeLoadout('x')).toBeNull();
    expect(decodeLoadout('')).toBeNull();
    expect(decodeLoadout('g1.' + 'a'.repeat(130))).toBeNull();
    const parts = encodeLoadout(defaultLoadout(RED)).split('.');
    parts.splice(4, 1);
    expect(decodeLoadout(parts.join('.'))).toBeNull();
  });

  it('decodes to null for characters outside the allowed set or unparsable fields', () => {
    const code = encodeLoadout(defaultLoadout(RED));
    expect(decodeLoadout(code + ' ')).toBeNull();
    expect(decodeLoadout(code.replace('.', '/'))).toBeNull();
    const parts = code.split('.');
    parts[1] = 'zzzzzz';
    expect(decodeLoadout(parts.join('.'))).toBeNull();
  });

  it('keeps the stock code short', () => {
    expect(encodeLoadout(defaultLoadout(RED)).length).toBeLessThanOrEqual(120);
  });

  it('encodes the six new fields last, as 26 fields in total', () => {
    const code = encodeLoadout(defaultLoadout(RED));
    expect(code.slice(3).split('.')).toHaveLength(26);
    expect(code.endsWith('.0.0.-.-.-.0')).toBe(true);
  });

  it('keeps a full loadout with every new field set within 120 characters', () => {
    const code = encodeLoadout(fullLoadout);
    expect(code.length).toBeLessThanOrEqual(120);
    expect(decodeLoadout(code)).toEqual(normalizeLoadout(fullLoadout));
  });

  it('rejects a code with the old 20-field layout', () => {
    const parts = encodeLoadout(fullLoadout).split('.');
    expect(decodeLoadout(parts.slice(0, 21).join('.'))).toBeNull();
  });
});

describe('sameLoadout / isStockLoadout', () => {
  it('compares field by field, extras as sets', () => {
    const a = normalizeLoadout({ extras: ['dice', 'flag'] }, RED);
    expect(sameLoadout(a, { ...a, extras: ['flag', 'dice'] })).toBe(true);
    expect(sameLoadout(a, { ...a, extras: ['flag'] })).toBe(false);
    expect(sameLoadout(a, { ...a, paint: 0 })).toBe(false);
    expect(sameLoadout(a, { ...a })).toBe(true);
  });

  it('treats a loadout that differs only in paint as stock', () => {
    expect(isStockLoadout(defaultLoadout(RED))).toBe(true);
    expect(isStockLoadout(defaultLoadout(0x00ff00))).toBe(true);
    expect(isStockLoadout({ ...defaultLoadout(RED), tyre: 'fat' })).toBe(false);
    expect(isStockLoadout({ ...defaultLoadout(RED), extras: ['dice'] })).toBe(false);
  });
});

describe('loadoutCost', () => {
  const stock = defaultLoadout(RED);

  it('costs nothing from stock to stock', () => {
    expect(loadoutCost(stock, stock)).toBe(0);
    expect(loadoutCostLines(stock, defaultLoadout(RED))).toEqual([]);
  });

  it('charges only the paint when only the paint changes', () => {
    const wanted = { ...stock, paint: 0x00ff00 };
    expect(loadoutCost(stock, wanted)).toBe(PRICES.paint);
    expect(loadoutCostLines(stock, wanted)).toEqual([{ label: 'Body colour', price: PRICES.paint }]);
  });

  it('charges both product prices for fat tyres and mesh rims', () => {
    const wanted = { ...stock, tyre: 'fat' as const, rim: 'mesh' as const };
    const tyre = modById('tyre', 'fat');
    const rim = modById('rim', 'mesh');
    expect(tyre && rim).toBeTruthy();
    expect(loadoutCost(stock, wanted)).toBe((tyre?.price ?? 0) + (rim?.price ?? 0));
  });

  it('makes going back to stock free', () => {
    const owned = { ...stock, tyre: 'fat' as const, rim: 'mesh' as const };
    expect(loadoutCost(owned, stock)).toBe(0);
  });

  it('charges the sum of three new extras', () => {
    const wanted = { ...stock, extras: ['dice', 'flag', 'bell'] as Loadout['extras'] };
    const sum = (['dice', 'flag', 'bell'] as const).reduce((n, id) => n + (modById('extra', id)?.price ?? 0), 0);
    expect(loadoutCost(stock, wanted)).toBe(sum);
    expect(sum).toBe(85);
  });

  it('charges camber as one line for both wheels', () => {
    const wanted = { ...stock, camberFront: -3, camberRear: -5 };
    expect(loadoutCostLines(stock, wanted)).toEqual([{ label: 'Camber', price: PRICES.camber }]);
  });

  it('charges a new spray and its colour only once', () => {
    const wanted = { ...stock, decal: 'flames' as const, decalColor: 0x111111 };
    const flames = modById('decal', 'flames');
    expect(loadoutCost(stock, wanted)).toBe(flames?.price ?? 0);
  });

  it('charges the spray colour alone when the spray stays the same', () => {
    const owned = { ...stock, decal: 'flames' as const };
    expect(loadoutCost(owned, { ...owned, decalColor: 0x111111 })).toBe(PRICES.decalColor);
  });

  it('charges underglow when it is switched on, and colour changes but not switching it off', () => {
    expect(loadoutCost(stock, { ...stock, underglow: 0x4fb7ff })).toBe(PRICES.underglow);
    const glowing = { ...stock, underglow: 0x4fb7ff };
    expect(loadoutCost(glowing, { ...glowing, underglow: 0xff4fb0 })).toBe(PRICES.rimColor);
    expect(loadoutCost(glowing, stock)).toBe(0);
  });

  it('charges each new part at its ModDef price, one line per part', () => {
    const wanted = { ...stock, grille: 'picket' as const, bumper: 'cowcatcher' as const, canopy: 'bubble' as const };
    const lines = loadoutCostLines(stock, wanted);
    expect(lines).toEqual([
      { label: 'Picket Grille', price: 60 },
      { label: 'Cowcatcher', price: 110 },
      { label: 'Glass Bubble', price: 130 },
    ]);
    expect(loadoutCost(stock, { ...stock, mirror: 'periscope', exhaust: 'stack', horn: 'siren' })).toBe(125 + 85 + 110);
  });

  it('charges nothing for stock grille, bumper, horn or the none choices, and is free to sell back', () => {
    expect(loadoutCost(stock, { ...stock, grille: 'stock', bumper: 'stock', horn: 'stock', canopy: 'none' })).toBe(0);
    const owned = { ...stock, grille: 'grin' as const, canopy: 'leaf' as const, horn: 'kazoo' as const };
    expect(loadoutCost(owned, stock)).toBe(0);
    expect(loadoutCost(owned, owned)).toBe(0);
  });

  it('does not charge a part the owner already has', () => {
    const owned = { ...stock, mirror: 'spoon' as const };
    expect(loadoutCost(owned, { ...owned, mirror: 'spoon' as const })).toBe(0);
  });
});
