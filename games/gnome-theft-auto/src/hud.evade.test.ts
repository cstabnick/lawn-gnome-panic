import { describe, expect, it } from 'vitest';
import { evadeLabel } from './hud';
import type { WatchSearch } from './types';

const base: WatchSearch = { x: 0, z: 0, r: 45, seen: false, inside: true, evade: 0, level: 1, dispatchIn: 0 };

describe('evadeLabel', () => {
  it('shows the dispatch countdown first', () => {
    expect(evadeLabel({ ...base, seen: true, dispatchIn: 2.1 })).toBe('Units en route 3s');
  });
  it('tells you to break line of sight when seen', () => {
    expect(evadeLabel({ ...base, seen: true })).toBe('SEEN — break line of sight');
  });
  it('shows lying low progress outside the circle', () => {
    expect(evadeLabel({ ...base, inside: false, evade: 0.4 })).toBe('Lying low 40%');
  });
  it('asks you to leave the circle when inside', () => {
    expect(evadeLabel(base)).toBe('Leave the circle');
  });
});
