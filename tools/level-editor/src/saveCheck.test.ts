import { describe, expect, it, vi } from 'vitest';
import type { MarkerDef } from '@lawn/level';
import { checkMarkersBeforeSave, findUnknownRefs, unknownMessage } from './saveCheck';
import type { MarkerKnown } from './markerCheck';

const known: MarkerKnown = {
  object: (id) => id === 'house',
  spawn: (id) => id === 'gnome',
};

const m = (kind: string, id: string): MarkerDef => ({ id, kind, x: 0, z: 0 }) as MarkerDef;

describe('checkMarkersBeforeSave', () => {
  it('does not ask when every marker is known', () => {
    const confirm = vi.fn((_msg: string) => false);
    checkMarkersBeforeSave([{ id: 'a', markers: [m('object', 'house'), m('spawn', 'gnome')] }], confirm, known);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks once with both ids and the zone when two markers are unknown', () => {
    const confirm = vi.fn((_msg: string) => true);
    checkMarkersBeforeSave(
      [{ id: 'mossbottom', markers: [m('object', 'nope'), m('spawn', 'ghost')] }],
      confirm,
      known,
    );
    expect(confirm).toHaveBeenCalledTimes(1);
    const msg = confirm.mock.calls[0][0];
    expect(msg).toContain('object "nope" in mossbottom');
    expect(msg).toContain('spawn "ghost" in mossbottom');
  });

  it('throws a Save cancelled error when the author declines', () => {
    expect(() =>
      checkMarkersBeforeSave([{ id: 'a', markers: [m('object', 'nope')] }], () => false, known),
    ).toThrow(/^Save cancelled/);
    expect(() =>
      checkMarkersBeforeSave([{ id: 'a', markers: [m('object', 'nope'), m('spawn', 'ghost')] }], () => false, known),
    ).toThrow('Save cancelled: nope, ghost');
  });

  it('does not throw when the author confirms', () => {
    expect(() =>
      checkMarkersBeforeSave([{ id: 'a', markers: [m('object', 'nope')] }], () => true, known),
    ).not.toThrow();
  });

  it('ignores markers of other kinds', () => {
    const confirm = vi.fn((_msg: string) => false);
    checkMarkersBeforeSave([{ id: 'a', markers: [m('sign', 'anything')] }], confirm, known);
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe('findUnknownRefs and unknownMessage', () => {
  it('reports the zone, kind and id of each unknown marker', () => {
    expect(findUnknownRefs([{ id: 'z', markers: [m('object', 'x'), m('house', 'y')] }], known)).toEqual([
      { zone: 'z', kind: 'object', id: 'x' },
    ]);
  });

  it('lists ten refs and says how many more', () => {
    const refs = Array.from({ length: 12 }, (_, i) => ({ zone: 'z', kind: 'object', id: `o${i}` }));
    const msg = unknownMessage(refs);
    expect(msg).toContain('and 2 more');
    expect(msg).toContain('object "o9" in z');
    expect(msg).not.toContain('object "o10" in z');
  });
});
