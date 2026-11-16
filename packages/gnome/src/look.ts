// The palette, the look code and conversions between the two looks (see types.ts).
import type { GnomeLook, Look } from './types';

/**
 * The colours a gnome can have: 64 entries, so a colour is one character of the look code (ALPHABET[i] is PALETTE[i]).
 * FROZEN: a look code stores indices, so reordering or editing an entry changes how every saved code looks. Only append
 * a new palette (and a new code version) if this ever has to grow.
 *  0-7 skin tones, 8-15 neutrals, 16-23 naturals (hair, wood, ginger), 24-63 ten hues in four shades each (dark, mid, bright, pale).
 */
export const PALETTE: readonly number[] = [
  0xf8dcc8, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a1e, 0xffdbb4, 0xd9a066,
  0x222222, 0x444444, 0x6e6e6e, 0x9a9a9a, 0xc8c8c8, 0xf4f4f4, 0x6b4a2e, 0x3b2a1a,
  0x5d4037, 0x6d4c41, 0x8a5a2b, 0xa1887f, 0xd7b98e, 0xe2571e, 0xe6c27a, 0x9c6b3c,
  0x8e1f1f, 0xd93636, 0xff6b6b, 0xffb3b3, // red
  0xa84a00, 0xe2681e, 0xff9a3c, 0xffd0a1, // orange
  0xb38f00, 0xf2c230, 0xffe066, 0xfff3b0, // yellow
  0x5a7d12, 0x8bc34a, 0xc6ff4a, 0xe6ffb0, // lime
  0x1f5e34, 0x2e8b57, 0x5cd67a, 0xb9f0c8, // green
  0x0f6b66, 0x1fa89c, 0x3df5c8, 0xb3f5e8, // teal
  0x1a6f99, 0x2f9fd1, 0x4fd8ff, 0xb3ecff, // sky
  0x1d3f8f, 0x2f64c9, 0x6fa8ff, 0xbcd3ff, // blue
  0x4b2c82, 0x7e57c2, 0xa98bff, 0xd9ccff, // purple
  0x9c2a6e, 0xd6459f, 0xff6fd0, 0xffc2ea, // pink
];

/** One character per palette index: ALPHABET[i] stands for PALETTE[i]. */
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const LOOK_CODE_PREFIX = 'g1.';

/** The default gnome: Gnorman, every colour a palette colour. */
export const DEFAULT_LOOK: Look = {
  hatRgb: 0xd93636, coatRgb: 0x2f64c9, pantsRgb: 0x6b4a2e, bootsRgb: 0x222222, skinRgb: 0xf1c27d,
  beardRgb: 0xf4f4f4, freckles: false, dress: false, glasses: false,
};

/** Index into PALETTE of the entry closest to rgb (squared distance in RGB; the lowest index wins a tie). */
export function nearestPaletteIndex(rgb: number): number {
  const c = rgb & 0xffffff;
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  const b = c & 0xff;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const p = PALETTE[i];
    const dr = r - ((p >> 16) & 0xff);
    const dg = g - ((p >> 8) & 0xff);
    const db = b - (p & 0xff);
    const d = dr * dr + dg * dg + db * db;
    // Strict less-than keeps the lowest index on a tie.
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** The look with every colour replaced by its nearest palette colour. */
export function snapLook(look: Look): Look {
  const snap = (rgb: number): number => PALETTE[nearestPaletteIndex(rgb)];
  const out: Look = {
    hatRgb: snap(look.hatRgb),
    coatRgb: snap(look.coatRgb),
    pantsRgb: snap(look.pantsRgb),
    bootsRgb: snap(look.bootsRgb),
    skinRgb: snap(look.skinRgb),
    freckles: look.freckles,
    dress: look.dress,
    glasses: look.glasses,
  };
  // Absent stays absent: an `undefined` key would still show up in JSON-like comparisons.
  if (look.beardRgb !== undefined) out.beardRgb = snap(look.beardRgb);
  if (look.hairRgb !== undefined) out.hairRgb = snap(look.hairRgb);
  return out;
}

/** Look -> the model's look: coat -> shirt, beardRgb absent -> beard null, hairRgb -> { color, style: 'pigtails' }, bowlCut null. */
export function toModelLook(look: Look): GnomeLook {
  return {
    hat: look.hatRgb,
    shirt: look.coatRgb,
    pants: look.pantsRgb,
    skin: look.skinRgb,
    boots: look.bootsRgb,
    beard: look.beardRgb ?? null,
    hair: look.hairRgb !== undefined ? { color: look.hairRgb, style: 'pigtails' } : null,
    freckles: look.freckles,
    dress: look.dress,
    glasses: look.glasses,
    bowlCut: null,
  };
}

/** The model's look -> Look (not snapped). beard null -> beardRgb absent; hair -> hairRgb; bowlCut is dropped. */
export function fromModelLook(look: GnomeLook): Look {
  const out: Look = {
    hatRgb: look.hat,
    coatRgb: look.shirt,
    pantsRgb: look.pants,
    bootsRgb: look.boots,
    skinRgb: look.skin,
    freckles: look.freckles,
    dress: look.dress,
    glasses: look.glasses,
  };
  if (look.beard !== null) out.beardRgb = look.beard;
  if (look.hair !== null) out.hairRgb = look.hair.color;
  return out;
}

/**
 * The look code: `g1.` + 8 characters, 11 in all (PlayerInfo.character allows 16). The 8 characters, in order:
 * hat, coat, pants, boots, skin, beard, hair, flags. The first five and the beard and hair characters are ALPHABET[palette
 * index]; beard and hair are '.' when absent. Flags is ALPHABET[freckles ? 1 : 0 | dress ? 2 : 0 | glasses ? 4 : 0].
 * Colours are snapped to the palette first. Example: DEFAULT_LOOK encodes to 'g1.Z1OIBN.A' (hat 25 = Z, coat 53 = 1,
 * pants 14 = O, boots 8 = I, skin 1 = B, beard 13 = N, no hair = '.', no flags = A).
 */
export function encodeLook(look: Look): string {
  const s = snapLook(look);
  const char = (rgb: number): string => ALPHABET[nearestPaletteIndex(rgb)];
  const optional = (rgb: number | undefined): string => (rgb === undefined ? '.' : char(rgb));
  const flags = (s.freckles ? 1 : 0) | (s.dress ? 2 : 0) | (s.glasses ? 4 : 0);
  return (
    LOOK_CODE_PREFIX +
    char(s.hatRgb) +
    char(s.coatRgb) +
    char(s.pantsRgb) +
    char(s.bootsRgb) +
    char(s.skinRgb) +
    optional(s.beardRgb) +
    optional(s.hairRgb) +
    ALPHABET[flags]
  );
}

/** The look of a code, or null when it is not a valid `g1.` code (wrong prefix, length or characters). Never throws. */
export function decodeLook(code: string): Look | null {
  // Callers may pass anything (JS has no types at runtime), so check the type before touching the string.
  if (typeof code !== 'string' || code.length !== 11 || !code.startsWith(LOOK_CODE_PREFIX)) return null;
  const index = (pos: number): number => ALPHABET.indexOf(code.charAt(pos));
  const colour = (pos: number): number | null => {
    const i = index(pos);
    return i < 0 ? null : PALETTE[i];
  };
  const hat = colour(3);
  const coat = colour(4);
  const pants = colour(5);
  const boots = colour(6);
  const skin = colour(7);
  if (hat === null || coat === null || pants === null || boots === null || skin === null) return null;

  // Beard and hair are '.' when absent, otherwise a palette character.
  const beardChar = code.charAt(8);
  const hairChar = code.charAt(9);
  const beard = beardChar === '.' ? undefined : colour(8);
  const hair = hairChar === '.' ? undefined : colour(9);
  if (beard === null || hair === null) return null;

  const flags = index(10);
  if (flags < 0 || flags >= 8) return null;

  const out: Look = {
    hatRgb: hat,
    coatRgb: coat,
    pantsRgb: pants,
    bootsRgb: boots,
    skinRgb: skin,
    freckles: (flags & 1) !== 0,
    dress: (flags & 2) !== 0,
    glasses: (flags & 4) !== 0,
  };
  if (beard !== undefined) out.beardRgb = beard;
  if (hair !== undefined) out.hairRgb = hair;
  return out;
}

/** True when the string starts with LOOK_CODE_PREFIX (a game's own look id such as 'gnorman' is false). */
export function isLookCode(character: string): boolean {
  return character.startsWith(LOOK_CODE_PREFIX);
}
