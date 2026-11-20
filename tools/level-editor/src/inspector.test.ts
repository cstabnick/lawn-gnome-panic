import { ENEMIES, OBJECTS, SPAWNS } from '@gnomomia/content';
import { objectModelPrefab } from '@gnomomia/objectModels';
import { describe, expect, it } from 'vitest';
import { describeItem, type InspectRow } from './inspector';
import type { DoorLink } from './doorLinks';

// Real ids from the pack, read from the data (not hard-coded).
const spawn = SPAWNS.find((s) => s.id !== undefined);
if (!spawn?.id) throw new Error('the game has no spawn with an id');
const objectId = Object.keys(OBJECTS)[0];
if (!objectId) throw new Error('the game has no world object');

function section(sections: ReturnType<typeof describeItem>, title: string) {
  return sections.find((s) => s.title === title);
}

function rowsOf(sections: ReturnType<typeof describeItem>, title: string): InspectRow[] {
  const s = section(sections, title);
  if (!s || !('rows' in s)) throw new Error(`no rows section ${title}`);
  return s.rows;
}

/** The key/value pairs only (no tooltip), for matching against plain tuples. */
function pairsOf(sections: ReturnType<typeof describeItem>, title: string): [string, string][] {
  return rowsOf(sections, title).map(([k, v]) => [k, v]);
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
    const rows = pairsOf(sections, 'Placement');
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
    expect(pairsOf(sections, 'Pack definition')).toContainEqual(['when', '(condition)']);
  });

  it('the objects and spawns pack sections carry the edit-boundary note', () => {
    const obj = describeItem({
      collection: 'objects', label: 'Object', zone: 'z1', index: 0,
      item: { id: objectId }, marker: null,
    });
    const spw = describeItem({
      collection: 'spawns', label: 'Enemy spawn', zone: 'z1', index: 0,
      item: { id: spawn.id }, marker: null,
    });
    for (const sections of [obj, spw]) {
      const s = section(sections, 'Pack definition');
      expect(s && 'note' in s ? s.note : undefined).toBe(
        'Pack values are set in code. Placement and spawn overrides are editable in the select panel.',
      );
    }
  });

  it('every pack row has a tooltip that names the id and the pack folder', () => {
    const obj = describeItem({
      collection: 'objects', label: 'Object', zone: 'z1', index: 0,
      item: { id: objectId }, marker: null,
    });
    const spw = describeItem({
      collection: 'spawns', label: 'Enemy spawn', zone: 'z1', index: 0,
      item: { id: spawn.id }, marker: null,
    });
    const packRows = [...rowsOf(obj, 'Pack definition'), ...rowsOf(spw, 'Pack definition')];
    expect(packRows.length).toBeGreaterThan(0);
    for (const row of rowsOf(obj, 'Pack definition')) {
      expect(row[2], `row ${row[0]}`).toContain(objectId);
      expect(row[2]).toContain('games/gnomes-of-gnomomia/src/data/packs');
    }
    for (const row of rowsOf(spw, 'Pack definition')) {
      expect(row[2], `row ${row[0]}`).toContain(spawn.id);
      expect(row[2]).toContain('games/gnomes-of-gnomomia/src/data/packs');
    }
  });

  it('a Placement row has no tooltip', () => {
    const sections = describeItem({
      collection: 'objects', label: 'Object', zone: 'z1', index: 0,
      item: { id: objectId, x: 1, z: 2 }, marker: null,
    });
    for (const row of rowsOf(sections, 'Placement')) expect(row).toHaveLength(2);
    expect(pairsOf(sections, 'Placement')).toContainEqual(['zone', 'z1']);
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
    expect(pairsOf(sections, 'Placement')).toContainEqual(['name', evil]);
    const raw = section(sections, 'Raw');
    // JSON escapes the double quotes, so check a stretch without them.
    expect(raw && 'raw' in raw && raw.raw).toContain('<img src=x onerror=');
  });

  it('an exit with a destination gets a Destination section with its rows', () => {
    const destination: DoorLink = {
      zone: 'a', index: 0, label: 'east', kind: 'exit', from: { x: 1, z: 1 }, to: 'b', toName: 'Beta',
      arrive: { x: 12.34, z: -5 }, destKnown: true, destIndoor: false,
    };
    const sections = describeItem({
      collection: 'exits', label: 'Exit', zone: 'a', index: 0,
      item: { x: 1, z: 1, to: 'b' }, marker: null, destination,
    });
    expect(rowsOf(sections, 'Destination')).toEqual([
      ['to', 'b'],
      ['name', 'Beta'],
      ['arrives at', '12.3, -5.0'],
      ['indoor', 'no'],
      ['known', 'yes'],
    ]);
    const titles = sections.map((s) => s.title);
    expect(titles.indexOf('Destination')).toBeLessThan(titles.indexOf('Raw'));
  });

  it('an exit without a destination has no Destination section', () => {
    const sections = describeItem({
      collection: 'exits', label: 'Exit', zone: 'a', index: 0,
      item: { x: 1, z: 1, to: 'b' }, marker: null,
    });
    expect(section(sections, 'Destination')).toBeUndefined();
    expect(section(sections, 'Raw')).toBeDefined();
  });
});
