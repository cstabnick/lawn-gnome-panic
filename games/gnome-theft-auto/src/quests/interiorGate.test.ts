import '../questSim/globals';
import { describe, expect, it } from 'vitest';
import { defineInterior, interiorToWorld } from '../interiors/registry';
import { buildSimWorld } from '../questSim/harness';
import { staticFindings } from '../questSim/checks';
import { GIVERS } from './defs';
import type { QuestDef } from './types';

describe('interior quest positions', () => {
  defineInterior({
    id: 'test-gate-room',
    name: 'Test Gate Room',
    door: { x: 10, z: 10, yaw: 0 },
    exit: { x: 10, z: 12, yaw: 0 },
    size: { w: 20, d: 20, h: 4 },
    theme: 'gnome-home' as never,
    build() {},
  });

  it('converts a visit target to world coordinates in the pocket area', () => {
    const [x] = interiorToWorld('test-gate-room', 1, 2);
    expect(x).toBeGreaterThanOrEqual(5000);
  });

  it('the static checks skip the ground checks for an interior visit', () => {
    const q: QuestDef = {
      id: 'test-gate-quest',
      title: 'T',
      doneText: 'd',
      giver: Object.keys(GIVERS)[0],
      objectives: [{ kind: 'visit', text: 't', at: [1, 2], radius: 2, hint: 'h', interior: 'test-gate-room' }],
    };
    const found = staticFindings(q, buildSimWorld().world).filter((f) => f.check.startsWith('spot-'));
    expect(found).toEqual([]);
  });
});
