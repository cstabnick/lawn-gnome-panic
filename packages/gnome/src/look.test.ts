import { describe, expect, it } from 'vitest';
import {
  ALPHABET,
  DEFAULT_LOOK,
  PALETTE,
  decodeLook,
  encodeLook,
  fromModelLook,
  nearestPaletteIndex,
  snapLook,
  toModelLook,
} from './look';
import type { Look } from './types';

const rgbDistance = (a: number, b: number): number => {
  const d = (shift: number) => ((a >> shift) & 0xff) - ((b >> shift) & 0xff);
  return d(16) ** 2 + d(8) ** 2 + d(0) ** 2;
};

// Off-palette looks: a gnome with pigtails, no beard, and every flag on.
const hairNoBeard: Look = {
  hatRgb: 0xd93636,
  coatRgb: 0x2f64c9,
  pantsRgb: 0x6b4a2e,
  bootsRgb: 0x222222,
  skinRgb: 0xf1c27d,
  hairRgb: 0xe2571e,
  freckles: true,
  dress: true,
  glasses: true,
};

describe('palette and alphabet', () => {
  it('PALETTE has 64 different entries', () => {
    expect(PALETTE.length).toBe(64);
    expect(new Set(PALETTE).size).toBe(64);
  });

  it('ALPHABET has 64 different characters', () => {
    expect(ALPHABET.length).toBe(64);
    expect(new Set(ALPHABET).size).toBe(64);
  });
});

describe('encodeLook', () => {
  it('encodes DEFAULT_LOOK as g1.Z1OIBN.A', () => {
    expect(encodeLook(DEFAULT_LOOK)).toBe('g1.Z1OIBN.A');
  });

  it('keeps every code at most 16 characters', () => {
    for (const look of [DEFAULT_LOOK, hairNoBeard, { ...DEFAULT_LOOK, beardRgb: undefined }]) {
      expect(encodeLook(look).length).toBeLessThanOrEqual(16);
    }
    expect(encodeLook(DEFAULT_LOOK).length).toBe(11);
  });
});

describe('decodeLook round trip', () => {
  it('returns the snapped look for DEFAULT_LOOK', () => {
    expect(decodeLook(encodeLook(DEFAULT_LOOK))).toEqual(snapLook(DEFAULT_LOOK));
  });

  it('round-trips hair, no beard, and all flags', () => {
    expect(decodeLook(encodeLook(hairNoBeard))).toEqual(snapLook(hairNoBeard));
  });

  it('round-trips an off-palette colour as its snapped palette colour', () => {
    const look: Look = { ...DEFAULT_LOOK, hatRgb: 0xd93637 };
    expect(snapLook(look).hatRgb).toBe(0xd93636);
    expect(decodeLook(encodeLook(look))).toEqual(snapLook(look));
  });
});

describe('decodeLook rejects bad codes', () => {
  it.each([
    '',
    'gnorman',
    'g1.',
    'g1.Z1OIBN.', // too short
    'g1.Z1OIBN.AA', // too long
    'g2.Z1OIBN.A', // wrong prefix
    'g1.Z1OIBN.!', // bad flags char
    'g1.Z1OIBN.I', // flags index 8
    'g1.!1OIBN.A', // bad colour char
  ])('returns null for %j', (code) => {
    expect(decodeLook(code)).toBeNull();
  });

  it('never throws for non-string input', () => {
    expect(decodeLook(undefined as unknown as string)).toBeNull();
    expect(decodeLook(42 as unknown as string)).toBeNull();
    expect(decodeLook(null as unknown as string)).toBeNull();
  });
});

describe('nearestPaletteIndex', () => {
  it('finds the palette entry for 0xd93636', () => {
    expect(nearestPaletteIndex(0xd93636)).toBe(25);
  });

  it('masks off bits above 24', () => {
    expect(nearestPaletteIndex(0xff000000 | 0xd93636)).toBe(25);
  });

  it('returns the lowest index on a tie', () => {
    // Midpoints of palette pairs are equidistant from both ends. Check every one that has a tie.
    let ties = 0;
    for (let i = 0; i < PALETTE.length; i++) {
      for (let j = i + 1; j < PALETTE.length; j++) {
        const a = PALETTE[i];
        const b = PALETTE[j];
        // Only an even channel sum gives an integer midpoint.
        const channels = [16, 8, 0].map((s) => ((a >> s) & 0xff) + ((b >> s) & 0xff));
        if (channels.some((sum) => sum % 2 !== 0)) continue;
        const [r, g, bl] = channels.map((sum) => sum / 2);
        const rgb = (r << 16) | (g << 8) | bl;
        const best = Math.min(...PALETTE.map((p) => rgbDistance(rgb, p)));
        const tied = PALETTE.flatMap((p, k) => (rgbDistance(rgb, p) === best ? [k] : []));
        if (tied.length < 2) continue;
        ties++;
        expect(nearestPaletteIndex(rgb)).toBe(tied[0]);
      }
    }
    expect(ties).toBeGreaterThan(0);
  });
});

describe('model look conversion', () => {
  it('round-trips a look with beard and hair', () => {
    const look: Look = { ...DEFAULT_LOOK, hairRgb: 0xe2571e };
    expect(fromModelLook(toModelLook(look))).toEqual(look);
  });

  it('round-trips a look with neither beard nor hair', () => {
    const look: Look = { ...DEFAULT_LOOK, beardRgb: undefined };
    const back = fromModelLook(toModelLook(look));
    expect(back).toEqual(look);
    expect('beardRgb' in back).toBe(false);
    expect('hairRgb' in back).toBe(false);
  });
});

describe('snapLook', () => {
  it('leaves absent beard and hair absent', () => {
    const snapped = snapLook({ ...DEFAULT_LOOK, beardRgb: undefined });
    expect('beardRgb' in snapped).toBe(false);
    expect('hairRgb' in snapped).toBe(false);
  });
});
