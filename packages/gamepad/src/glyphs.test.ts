import { describe, expect, it } from 'vitest';
import {
  PAD_BUTTON_INDEX, PAD_BUTTON_NAMES, PAD_FAMILIES, glyphColor, glyphLabel, glyphName, glyphSvg, padFamily,
} from './glyphs';
import { STEAM_PAD_ID } from './steam';

describe('padFamily', () => {
  it('recognises each pad family from its id', () => {
    expect(padFamily('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')).toBe('xbox');
    expect(padFamily('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe('playstation');
    expect(padFamily('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)')).toBe('playstation');
    expect(padFamily('054c-0ce6-DualSense Wireless Controller')).toBe('playstation');
    expect(padFamily('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)')).toBe('switch');
    expect(padFamily(STEAM_PAD_ID)).toBe('steam');
    expect(padFamily('Logitech Dual Action (Vendor: 046d Product: c216)')).toBe('generic');
    expect(padFamily('')).toBe('generic');
  });
});

describe('glyph labels, names and colours', () => {
  it('spot checks the per-family tables', () => {
    expect(glyphLabel('playstation', 'south')).toBe('✕');
    expect(glyphLabel('switch', 'south')).toBe('B');
    expect(glyphLabel('xbox', 'lt')).toBe('LT');
    expect(glyphLabel('playstation', 'lt')).toBe('L2');
    expect(glyphLabel('steam', 'home')).toBe('Steam');
    expect(glyphLabel('generic', 'select')).toBe('Back');
    expect(glyphColor('xbox', 'south')).toBe('#3fae29');
    expect(glyphColor('playstation', 'north')).toBe('#3fd6a0');
    expect(glyphColor('switch', 'south')).toBe(null);
    expect(glyphColor('xbox', 'lb')).toBe(null);
    expect(glyphName('playstation', 'south')).toBe('Cross button');
    expect(PAD_BUTTON_INDEX.north).toBe(3);
  });
});

describe('glyph table coverage', () => {
  for (const family of PAD_FAMILIES) {
    for (const button of PAD_BUTTON_NAMES) {
      it(`${family} / ${button} has a label, a name and an svg`, () => {
        expect(glyphLabel(family, button).length).toBeGreaterThan(0);
        expect(glyphName(family, button).length).toBeGreaterThan(0);
        const svg = glyphSvg(family, button);
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).toContain('aria-label=');
        expect(svg).not.toContain(' id=');
        expect(svg).not.toContain('href');
        expect(glyphSvg(family, button, 30)).toContain('width="30"');
      });
    }
  }
});
