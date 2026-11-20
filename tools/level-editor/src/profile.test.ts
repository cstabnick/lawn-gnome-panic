import type { MarkerDef } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import type { MutableZone } from './context';
import { gnomomiaAdapter } from './adapters/gnomomia';
import { collection } from './profile';
import { createContext } from './state';
import { createWorld } from './world';

function zoneWith(markers: MarkerDef[]): MutableZone {
  return { markers } as unknown as MutableZone;
}

describe('objects collection', () => {
  it('lists only object markers as flat views with yaw and scale read from data', () => {
    const def = zoneWith([
      { id: 'spawn', kind: 'spawn', x: 0, z: 0 },
      { id: 'a', kind: 'object', x: 3, z: 4, data: { v: 1 } },
      { id: 'b', kind: 'object', x: -2, z: 5, data: { v: 1, rot: { y: 0.5 }, scale: 2 } },
    ]);
    const items = collection('objects').items(def);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(items[0]).toMatchObject({ id: 'a', x: 3, z: 4, yaw: 0, scale: 1 });
    expect(items[1]).toMatchObject({ id: 'b', x: -2, z: 5, yaw: 0.5, scale: 2 });
    expect(collection('objects').fixed).toBe(true);
  });

  it('writes yaw and scale into the marker data and keeps the rest of it', () => {
    const def = zoneWith([{ id: 'a', kind: 'object', x: 3, z: 4, data: { v: 1, rot: { x: 0.3, y: 0.5, z: 0.1 } } }]);
    const view = collection('objects').items(def)[0];
    view.yaw = 1.2;
    view.scale = 2.5;
    expect(def.markers?.[0]).toEqual({ id: 'a', kind: 'object', x: 3, z: 4, data: { v: 1, rot: { x: 0.3, y: 1.2, z: 0.1 }, scale: 2.5 } });
  });

  it('creates v: 1 data when a marker had none, and moves x and z on the marker', () => {
    const def = zoneWith([{ id: 'a', kind: 'object', x: 3, z: 4 }]);
    const view = collection('objects').items(def)[0];
    view.yaw = -0.4;
    view.x = 7;
    view.z = 8;
    expect(def.markers?.[0]).toEqual({ id: 'a', kind: 'object', x: 7, z: 8, data: { v: 1, rot: { y: -0.4 } } });
  });

  it('an edit through the editor context is one undo step that restores the marker', () => {
    const ctx = createContext(createWorld(), gnomomiaAdapter);
    ctx.viewport = { refresh() {} } as never;
    ctx.editZone('Add object', 'mossbottom', (def) => { def.markers = [{ id: 'obj-1', kind: 'object', x: 1, z: 2, data: { v: 1 } }]; });
    ctx.editZone('Edit Object', 'mossbottom', (def) => {
      const view = collection('objects').items(def)[0];
      view.yaw = 0.8;
      view.scale = 1.5;
    });
    expect(ctx.zones.mossbottom.markers?.[0].data).toEqual({ v: 1, rot: { y: 0.8 }, scale: 1.5 });
    ctx.history.undo();
    expect(ctx.zones.mossbottom.markers?.[0].data).toEqual({ v: 1 });
  });
});
