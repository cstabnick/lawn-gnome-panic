import { beforeEach, describe, expect, it, vi } from 'vitest';

const playAtMock = vi.fn<(id: string, pos: unknown, opts?: unknown) => boolean>(() => true);
vi.mock('../sound/bus', () => ({
  playAt: (id: string, pos: unknown, opts?: unknown) => playAtMock(id, pos, opts),
  hasSound: () => false,
  registerSound: () => {},
}));

import { regionAt } from '../levels';
import { LIVING_RECIPE, LIVING_SOUND_SPOTS, createLivingSound } from './sound';
import { LIVING_SOUND_IDS } from './sounds.recipes';

describe('living sound spots', () => {
  it('every spot kind has a registered recipe id', () => {
    for (const s of LIVING_SOUND_SPOTS) {
      expect(LIVING_SOUND_IDS, s.id).toContain(LIVING_RECIPE[s.kind]);
    }
    for (const id of LIVING_SOUND_IDS) expect(id.startsWith('living-')).toBe(true);
  });

  it('Unmown spots lie in the Unmown', () => {
    const unmown = ['frogs', 'bittern', 'reeds', 'ranger-radio', 'woodpecker'];
    for (const s of LIVING_SOUND_SPOTS.filter((p) => unmown.includes(p.kind))) {
      expect(regionAt(s.x, s.z), s.id).toBe('the-unmown');
    }
  });

  it('every interval is ordered', () => {
    for (const s of LIVING_SOUND_SPOTS) expect(s.every[0], s.id).toBeLessThanOrEqual(s.every[1]);
  });
});

describe('living sound update', () => {
  beforeEach(() => playAtMock.mockClear());

  it('does not throw under node and plays nothing indoors', () => {
    const snd = createLivingSound();
    for (let i = 0; i < 200; i++) snd.update(1, -1100, -1600, 0.1, true);
    expect(playAtMock).not.toHaveBeenCalled();
  });

  it('plays a frog chorus when the listener is at Reedmere by day', () => {
    const snd = createLivingSound();
    for (let i = 0; i < 120; i++) snd.update(1, -1100, -1600, 0.1, false);
    const ids = playAtMock.mock.calls.map((c) => c[0]);
    expect(ids).toContain('living-frogs');
    expect(ids).not.toContain('living-bittern');
  });

  it('plays nothing far from every spot', () => {
    const snd = createLivingSound();
    for (let i = 0; i < 300; i++) snd.update(1, 0, 0, 0.1, false);
    expect(playAtMock).not.toHaveBeenCalled();
  });
});
