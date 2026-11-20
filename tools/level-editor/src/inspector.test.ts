import { ENEMIES, OBJECTS, SPAWNS } from '@gnomomia/content';
import { objectModelPrefab } from '@gnomomia/objectModels';
import { describe, expect, it } from 'vitest';
import { describeItem } from './inspector';

// Real ids from the pack, read from the data (not hard-coded).
const spawn = SPAWNS.find((s) => s.id !== undefined);
if (!spawn?.id) throw new Error('the game has no spawn with an id');
const objectId = Object.keys(OBJECTS)[0];
if (!objectId) throw new Error('the game has no world object');

function section(sections: ReturnType<typeof describeItem>, title: string) {
  return sections.find((s) => s.title === title);
}

function rowsOf(sections: ReturnType<typeof describeItem>, title: string): [string, string][] {
  const s = section(sections, title);
  if (!s || !('rows' in s)) throw new Error(`no rows section ${title}`);
  return s.rows;
}

describe('describeItem', () => {
  it('an objects item with a known id gets a pack section with its model and prefab', () => {
    const sections = describeItem({
      collection: 'objects',
      label: 'Object',
      zone: 'z1',
      index: 0,
      item: { id: objectId, x: 1, z: 2, yaw: 0, scale: 1 },
      marker: { id: objectId, kind: 'object', x: 1, z: 2 },
    });
    const keys = rowsOf(sections, 'Pack definition').map(([k]) => k);
    expect(keys).toContain('model');
    const prefab = rowsOf(sections, 'Pack definition').find(([k]) => k === 'prefab');
    expect(prefab?.[1]).toBe(objectModelPrefab(OBJECTS[objectId].model));
    expect(prefab?.[1].length).toBeGreaterThan(0);
  });

  it('a spawns item with a known id gets enemy and count in its pack section', () => {
    const sections = describeItem({
      collection: 'spawns',
      label: 'Enemy spawn',
      zone: 'z1',
      index: 0,
      item: { id: spawn.id, count: spawn.count, spread: spawn.spread },
      marker: { id: spawn.id!, kind: 'spawn', x: 0, z: 0 },
    });
    const keys = rowsOf(sections, 'Pack definition').map(([k]) => k);
    expect(keys).toContain('enemy');
    expect(keys).toContain('count');
    const enemyName = rowsOf(sections, 'Pack definition').find(([k]) => k === 'enemy name');
    expect(enemyName?.[1]).toBe(ENEMIES[spawn.enemy]?.name ?? '(unknown enemy)');
  });

  it('an unknown id gets no pack section, but still a placement and a raw section', () => {
    const sections = describeItem({
      collection: 'objects',
      label: 'Object',
      zone: 'z1',
      index: 3,
      item: { id: 'no-such-object-id', x: 0, z: 0 },
      marker: null,
    });
    expect(section(sections, 'Pack definition')).toBeUndefined();
    expect(section(sections, 'Placement')).toBeDefined();
    expect(section(sections, 'Raw')).toBeDefined();
  });

  it('a marker item shows the raw marker fields, with the zone', () => {
    const sections = describeItem({
      collection: 'spawns',
      label: 'Enemy spawn',
      zone: 'zone-a',
      index: 0,
      item: { id: spawn.id },
      marker: { id: spawn.id!, kind: 'spawn', x: 5, z: 6, data: { v: 1, count: 2 } },
    });
    const rows = rowsOf(sections, 'Placement');
    expect(rows).toContainEqual(['zone', 'zone-a']);
    expect(rows).toContainEqual(['kind', 'spawn']);
    expect(rows).toContainEqual(['x', '5']);
    expect(rows.find(([k]) => k === 'data')?.[1]).toContain('"count": 2');
  });

  it('a condition that holds a function reads as (condition), not as code', () => {
    const lookup = {
      object: () => ({ model: 'cart', when: { check: () => true } }) as never,
      spawn: () => undefined,
      enemy: () => undefined,
      objectPrefab: () => 'wooden-cart',
    };
    const sections = describeItem(
      { collection: 'objects', label: 'Object', zone: 'z1', index: 0, item: { id: 'x' }, marker: null },
      lookup,
    );
    expect(rowsOf(sections, 'Pack definition')).toContainEqual(['when', '(condition)']);
  });

  it('HTML in values is returned as plain text, not interpreted', () => {
    const evil = '<img src=x onerror="alert(1)"><b>hi</b>';
    const sections = describeItem({
      collection: 'objects',
      label: 'Object',
      zone: 'z1',
      index: 0,
      item: { id: 'x', name: evil },
      marker: null,
    });
    expect(rowsOf(sections, 'Placement')).toContainEqual(['name', evil]);
    const raw = section(sections, 'Raw');
    // JSON escapes the double quotes, so check a stretch without them.
    expect(raw && 'raw' in raw && raw.raw).toContain('<img src=x onerror=');
  });
});
