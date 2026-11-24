import { describe, expect, it } from 'vitest';
import {
  SOURCE_DEBOUNCE_MS,
  glyphSetOf,
  initialSource,
  reduceSource,
  settleSource,
  type SourceState,
} from './inputSource';

const W = SOURCE_DEBOUNCE_MS;

describe('input source', () => {
  it('flips at once when the debounce window has passed', () => {
    const s = initialSource(false, 0);
    const next = reduceSource(s, 'touch', W);
    expect(next.current).toBe('touch');
    expect(next.lastFlip).toBe(W);
    expect(next.pending).toBeNull();
  });

  it('keeps a different source inside the window pending until settleSource applies it', () => {
    const s = initialSource(false, 0);
    const pending = reduceSource(s, 'touch', W - 1);
    expect(pending.current).toBe('keyboard');
    expect(pending.pending).toBe('touch');
    expect(settleSource(pending, W - 2)).toBe(pending);
    const settled = settleSource(pending, W);
    expect(settled.current).toBe('touch');
    expect(settled.pending).toBeNull();
    expect(settled.lastFlip).toBe(W);
  });

  it('a newer pending replaces an older one', () => {
    const p1 = reduceSource(initialSource(false, 0), 'pad', 100, 'xbox');
    expect(p1.pending).toBe('pad');
    const p2 = reduceSource(p1, 'touch', 200);
    expect(p2.pending).toBe('touch');
    expect(p2.pendingFamily).toBeNull();
  });

  it('seeing the current source again clears a pending change', () => {
    const pending = reduceSource(initialSource(false, 0), 'pad', 100, 'xbox');
    expect(pending.pending).toBe('pad');
    const cleared = reduceSource(pending, 'keyboard', 200);
    expect(cleared.current).toBe('keyboard');
    expect(cleared.pending).toBeNull();
    expect(cleared.pendingFamily).toBeNull();
  });

  it('a pad family change while on the pad flips the family, debounced', () => {
    const onPad: SourceState = reduceSource(initialSource(false, 0), 'pad', W, 'xbox');
    expect(onPad.current).toBe('pad');
    expect(onPad.family).toBe('xbox');

    const pending = reduceSource(onPad, 'pad', W + 10, 'playstation');
    expect(pending.family).toBe('xbox');
    expect(pending.pending).toBe('pad');
    expect(pending.pendingFamily).toBe('playstation');

    const settled = settleSource(pending, W + 10 + W);
    expect(settled.current).toBe('pad');
    expect(settled.family).toBe('playstation');
    expect(settled.pending).toBeNull();

    const flipped = reduceSource(onPad, 'pad', W * 3, 'playstation');
    expect(flipped.family).toBe('playstation');
  });

  it('glyphSetOf gives touch, keyboard or the pad family', () => {
    const s = initialSource(false, 0);
    expect(glyphSetOf(s)).toBe('keyboard');
    expect(glyphSetOf(initialSource(true, 0))).toBe('touch');
    const pad = reduceSource(s, 'pad', W, 'switch');
    expect(glyphSetOf(pad)).toBe('switch');
  });

  it('reduceSource returns the same object when nothing changes', () => {
    const s = initialSource(false, 0);
    expect(reduceSource(s, 'keyboard', 10)).toBe(s);
    expect(settleSource(s, 10)).toBe(s);

    const pad = reduceSource(s, 'pad', W, 'generic');
    expect(reduceSource(pad, 'pad', W + 1, 'generic')).toBe(pad);

    const pending = reduceSource(s, 'touch', 10);
    expect(reduceSource(pending, 'touch', 20)).toBe(pending);
  });
});
