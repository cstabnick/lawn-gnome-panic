import { describe, expect, it } from 'vitest';
import { BOARD_FACES, layoutPlate, PLATE_MIN_PX, plateCanvasWidth, signBoard, textPlate } from './pieces';
import { noticeLine } from './notices';
import { undersideGlow, UNDERSIDE_GLOW } from '../undersides';
import { weatherOvercast, WEATHER_LOOK } from '../weather/config';

/** A bold sans glyph is about 0.6 em wide on average (caps a little wider): a stand-in for canvas measureText. */
const measure = (s: string, px: number): number => s.length * px * 0.62;

describe('textPlate layout (D58)', () => {
  it('wraps a 70-character single line to two rows or more, at least 18 px tall at 512', () => {
    const text = 'PLEASE DO NOT SAY MOWER AND KICK DRUM IN THE SAME BREATH. SAY SEAT OK.';
    expect(text.length).toBe(70);
    const lay = layoutPlate(text, 1.8, 0.6, measure);
    expect(lay.cw).toBe(512);
    expect(lay.lines.length).toBeGreaterThanOrEqual(2);
    expect(lay.px).toBeGreaterThanOrEqual(PLATE_MIN_PX);
    expect(lay.fits).toBe(true);
  });

  it('sizes the canvas to the plate: 512 over 1.5 m, 1024 over 3 m, never 256 for long text', () => {
    expect(plateCanvasWidth(1.6, 'A')).toBe(512);
    expect(plateCanvasWidth(3.2, 'A')).toBe(1024);
    expect(plateCanvasWidth(0.6, 'No. 4')).toBe(256);
    expect(plateCanvasWidth(0.6, 'A LONG LINE FOR A SMALL PLATE')).toBe(512);
  });

  it('keeps short names on one row at a big size', () => {
    const lay = layoutPlate('BOOTH', 0.6, 0.2, measure);
    expect(lay.lines).toEqual(['BOOTH']);
    expect(lay.px).toBeGreaterThan(40);
  });

  it('keeps explicit line breaks', () => {
    const lay = layoutPlate('THE ROOST.\nNO STAIRS.', 1.6, 0.6, measure);
    expect(lay.lines).toEqual(['THE ROOST.', 'NO STAIRS.']);
  });

  it('prints the back face and the backing when asked', () => {
    const m = textPlate('A', 0, 1, 0, 0, { back: 'B', backing: true });
    expect(m.children.map((c) => c.name).sort()).toEqual(['home-plate-back', 'home-plate-backing']);
  });
});

describe('signBoard', () => {
  it('prints both faces by default, flush on the board face', () => {
    const { piece, plates } = signBoard({ front: 'FRONT', back: 'BACK', x: 0, z: 0, yaw: 0, board: 'garden-sign' });
    expect(piece.prefab).toBe('garden-sign');
    expect(plates.children).toHaveLength(2);
    const [f, b] = plates.children;
    expect(f.position.z).toBeCloseTo(BOARD_FACES['garden-sign'].front + 0.02);
    expect(b.position.z).toBeCloseTo(BOARD_FACES['garden-sign'].back - 0.02);
    expect(b.rotation.y).toBeCloseTo(Math.PI);
  });

  it('scales the board up to carry a bigger plate, and a wall board prints one face', () => {
    const { piece, plates } = signBoard({ front: 'X', x: 0, z: 0, yaw: 0, board: 'notice-board', w: 2.6, twoSided: false });
    expect(piece.scale).toBeGreaterThan(1.9);
    expect(plates.children).toHaveLength(1);
  });
});

describe('notices, undersides, rain overcast', () => {
  it('reads the notices in turn and wraps round', () => {
    expect([0, 1, 2, 3].map((n) => noticeLine(['a', 'b', 'c'], n))).toEqual(['a', 'b', 'c', 'a']);
  });

  it('dims the underside glow at night', () => {
    expect(undersideGlow(0)).toBeCloseTo(UNDERSIDE_GLOW.day);
    expect(undersideGlow(1)).toBeCloseTo(UNDERSIDE_GLOW.night);
  });

  it('gives light rain an overcast floor, never above full rain', () => {
    expect(weatherOvercast('rain', 0.35)).toBeGreaterThanOrEqual(0.45);
    expect(weatherOvercast('rain', 1)).toBeCloseTo(WEATHER_LOOK.rain.overcast);
    expect(weatherOvercast('rain', 0)).toBe(0);
    expect(weatherOvercast('cloud', 0.5)).toBeCloseTo(WEATHER_LOOK.cloud.overcast * 0.5);
  });
});
