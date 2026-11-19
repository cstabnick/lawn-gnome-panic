// The arena level document: valid, complete, and what config.ts exports is read from it.
import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { BASES, FLAGS, VEHICLE_SLOTS } from './config';
import { ARENA_DOC, docBases, docFlags, docVehicleSlots } from './levelDoc';

describe('arena level document', () => {
  it('passes the shared level checks', () => {
    expect(validateLevelDoc(ARENA_DOC)).toEqual([]);
  });

  it('has 5 flags A..E, 2 bases and 9 vehicle slots', () => {
    expect(FLAGS.map((f) => f.id)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(BASES).toHaveLength(2);
    expect(VEHICLE_SLOTS).toHaveLength(9);
  });

  it('gives config.ts the same flags, bases and slots as its markers', () => {
    expect(FLAGS).toEqual(docFlags(ARENA_DOC));
    expect(BASES).toEqual(docBases(ARENA_DOC));
    expect(VEHICLE_SLOTS).toEqual(docVehicleSlots(ARENA_DOC));
    const flagMarkers = ARENA_DOC.markers.filter((m) => m.kind === 'flag').map((m) => [m.id, m.x, m.z]);
    expect(flagMarkers).toEqual(FLAGS.map((f) => [f.id, f.x, f.z]));
  });

  it('has cover layers that add up to 143 objects', () => {
    const total = ARENA_DOC.data.cover.layers.reduce((sum, l) => sum + l.count, 0);
    expect(total).toBe(143);
  });

  it('survives a JSON round trip unchanged', () => {
    expect(JSON.parse(JSON.stringify(ARENA_DOC))).toEqual(ARENA_DOC);
  });
});
