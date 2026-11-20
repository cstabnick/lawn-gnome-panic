// The select tool's writes to an object (drag commit, nudge, Q/E rotate, field edit), made on the same flat view the
// tool gets from the `objects` collection. Each one must land on the object marker in the zone file.
import type { MarkerDef } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import type { MutableZone } from './context';
import { collection } from './profile';

function zoneWith(markers: MarkerDef[]): MutableZone {
  return { markers } as unknown as MutableZone;
}

describe('picking and moving object markers', () => {
  it('a drag commit writes the rounded x and z onto the marker', () => {
    const def = zoneWith([{ id: 'valve', kind: 'object', x: 3, z: 4, data: { v: 1 } }]);
    const c = collection('objects');
    // select.ts: onPointerMove previews on the view; endDrag puts the start back, then writes the rounded end position.
    const preview = c.items(def)[0];
    preview.x = 3.04;
    preview.z = 9.36;
    const x = Math.round(preview.x * 10) / 10;
    const z = Math.round(preview.z * 10) / 10;
    const live = c.items(def)[0];
    live.x = 3;
    live.z = 4;
    const commit = c.items(def)[0];
    commit.x = x;
    commit.z = z;
    expect(def.markers?.[0]).toMatchObject({ id: 'valve', x: 3, z: 9.4 });
  });

  it('a nudge moves the marker by the step, rounded to 0.01', () => {
    const def = zoneWith([{ id: 'statue', kind: 'object', x: 1.1, z: -2 }]);
    const it = collection('objects').items(def)[0];
    // select.ts nudgeSelected
    it.x = Math.round((it.x + 0.5) * 100) / 100;
    it.z = Math.round((it.z + -0.5) * 100) / 100;
    expect(def.markers?.[0]).toMatchObject({ x: 1.6, z: -2.5 });
  });

  it('a Q/E rotate writes rot.y into the marker data and keeps the other rotation keys', () => {
    const def = zoneWith([{ id: 'sign', kind: 'object', x: 0, z: 0, data: { v: 1, rot: { x: 0, y: 3.1, z: 0 } } }]);
    const it = collection('objects').items(def)[0];
    // select.ts rotateSelected: the key is 'yaw' for an object; the value wraps into -pi..pi and rounds to 0.01.
    let a = Number(it.yaw) + Math.PI / 12;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    it.yaw = Math.round(a * 100) / 100;
    // 3.1 + pi/12 is past pi, so it wraps to about -2.92.
    expect(def.markers?.[0].data).toEqual({ v: 1, rot: { x: 0, y: -2.92, z: 0 } });
  });

  it('a scale field edit writes data.scale on the marker', () => {
    const def = zoneWith([{ id: 'chest', kind: 'object', x: 0, z: 0, data: { v: 1 } }]);
    const it = collection('objects').items(def)[0];
    it.scale = 2.5;
    expect(def.markers?.[0].data).toEqual({ v: 1, scale: 2.5 });
    expect(it.scale).toBe(2.5);
  });

  it('objects are fixed: the tool offers no add, delete or duplicate for them', () => {
    expect(collection('objects').fixed).toBe(true);
  });
});
