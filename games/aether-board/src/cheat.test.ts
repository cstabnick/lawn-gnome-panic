import { describe, expect, it, vi } from 'vitest';
import { createCheatBuffer, DENSHATTACK_CODE } from './cheat';

describe('createCheatBuffer', () => {
  it('triggers when the exact code is typed', () => {
    const onTrigger = vi.fn();
    const cheat = createCheatBuffer(DENSHATTACK_CODE, onTrigger);
    for (const ch of 'denshattac') {
      expect(cheat.feed(ch)).toBe(false);
    }
    expect(cheat.feed('k')).toBe(true);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('is case-insensitive and ignores non-character keys', () => {
    const onTrigger = vi.fn();
    const cheat = createCheatBuffer(DENSHATTACK_CODE, onTrigger);
    for (const ch of 'DENSH') cheat.feed(ch);
    expect(cheat.feed('Shift')).toBe(false);
    expect(cheat.feed('Enter')).toBe(false);
    for (const ch of 'Attack') cheat.feed(ch);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('recovers from prefix noise and resets after triggering', () => {
    const onTrigger = vi.fn();
    const cheat = createCheatBuffer(DENSHATTACK_CODE, onTrigger);
    for (const ch of 'ddensdenshattack') cheat.feed(ch);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    for (const ch of 'denshattack') cheat.feed(ch);
    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it('clears partial progress on reset', () => {
    const onTrigger = vi.fn();
    const cheat = createCheatBuffer(DENSHATTACK_CODE, onTrigger);
    for (const ch of 'denshat') cheat.feed(ch);
    cheat.reset();
    for (const ch of 'tack') cheat.feed(ch);
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
