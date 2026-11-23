// The sprays draw without throwing, deterministically, and the planes sit on their panels. Run: npx vitest run packages/glaze/src/decals.test.ts
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DECAL_IDS } from './ids';
import { buildDecals, drawDecal, type Ctx2D, type DecalPanelKind } from './decals';
import type { Loadout, VehicleMounts } from './types';

const PANEL_KINDS: DecalPanelKind[] = ['side', 'top', 'rear'];
const DRAWING = /^(fill|stroke|fillRect|fillText)\(/;

/** A fake 2D context: every method call and property set is recorded as a string, in order. */
function recorder(): { ctx: Ctx2D; calls: string[] } {
  const calls: string[] = [];
  const props = new Map<string, unknown>();
  const proxy = new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (props.has(prop)) return props.get(prop);
      return (...args: unknown[]) => {
        calls.push(`${prop}(${args.map(String).join(',')})`);
      };
    },
    set(_target, prop, value) {
      if (typeof prop !== 'string') return false;
      props.set(prop, value);
      calls.push(`${prop}=${String(value)}`);
      return true;
    },
  });
  return { ctx: proxy as unknown as Ctx2D, calls };
}

const loadout = (over: Partial<Loadout> = {}): Loadout => ({
  paint: 0xd8342c,
  finish: 'gloss',
  decal: 'flames',
  decalColor: 0x2255ff,
  decalNumber: 7,
  tyre: 'stock',
  rim: 'stock',
  rimColor: 0xcccccc,
  wheelSize: 1,
  camberFront: 0,
  camberRear: 0,
  rideHeight: 0,
  steer: 'stock',
  lamp: 'stock',
  beam: 'warm',
  spoiler: 'none',
  seat: 'none',
  ornament: 'none',
  extras: [],
  underglow: null,
  ...over,
});

const mounts: VehicleMounts = {
  width: 1.2,
  length: 2,
  height: 1,
  points: {},
  lamps: null,
  steer: null,
  wheels: [],
  panels: [
    { id: 'left', at: [0.6, 0.3, 0], size: [1.6, 0.6], rot: [0, 90, 0] },
    { id: 'right', at: [-0.6, 0.3, 0], size: [1.6, 0.6], rot: [0, -90, 0] },
    { id: 'hood', at: [0, 0.5, 0.4], size: [1.1, 1.0], rot: [-90, 0, 0] },
    { id: 'rear', at: [0, 0.4, -0.9], size: [1.1, 0.3], rot: [0, 180, 0] },
  ],
};

describe('drawDecal', () => {
  for (const id of DECAL_IDS) {
    for (const panel of PANEL_KINDS) {
      it(`${id} on ${panel} draws at least 8 marks and is deterministic`, () => {
        const size = panel === 'side' ? [512, 256] : panel === 'top' ? [256, 256] : [512, 128];
        const run = () => {
          const { ctx, calls } = recorder();
          drawDecal(ctx, id, size[0], size[1], '#2255ff', '#f4f4f4', 42, panel);
          return calls;
        };
        const first = run();
        expect(first.filter((c) => DRAWING.test(c)).length).toBeGreaterThanOrEqual(8);
        expect(run()).toEqual(first);
      });
    }
  }
});

describe('buildDecals', () => {
  it('returns null for no spray', () => {
    expect(buildDecals(mounts, loadout({ decal: 'none' }))).toBeNull();
  });

  it('returns null when the vehicle has no panels', () => {
    expect(buildDecals({ ...mounts, panels: [] }, loadout())).toBeNull();
  });

  it('builds one plane per panel, at the panel position, facing the panel normal', () => {
    const group = buildDecals(mounts, loadout());
    expect(group).not.toBeNull();
    if (!group) return;
    expect(group.name).toBe('glaze-decals');
    const meshes = group.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
    expect(meshes).toHaveLength(mounts.panels.length);
    mounts.panels.forEach((panel, i) => {
      const mesh = meshes[i];
      expect(mesh.position.x).toBeCloseTo(panel.at[0]);
      expect(mesh.position.y).toBeCloseTo(panel.at[1]);
      expect(mesh.position.z).toBeCloseTo(panel.at[2]);
    });
    const left = meshes[0];
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(left.rotation);
    expect(normal.x).toBeCloseTo(1);
    expect(normal.y).toBeCloseTo(0);
    expect(normal.z).toBeCloseTo(0);
  });
});
