import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { docToLevel, levelToDoc, TOWN_FILE, pebblecrossAdapter } from './pebblecross';

describe('Pebblecross town in the level editor', () => {
  it('saves exactly the values and key order of the file it loaded', () => {
    const back = levelToDoc(docToLevel(TOWN_FILE));
    expect(JSON.stringify(back)).toBe(JSON.stringify(TOWN_FILE));
    expect(validateLevelDoc(back)).toEqual([]);
  });

  it('has the markers the roadmap names: one spawn, the places and the forage patches', () => {
    const level = docToLevel(TOWN_FILE);
    expect(level.spawn.map((m) => m.id)).toEqual(['spawn']);
    expect(level.places).toHaveLength(19);
    expect(level.forage).toHaveLength(14);
    expect(level.places.find((m) => m.id === 'bakery')?.label).toBe('Crumb & Crock');
  });

  it('moving a place moves its marker in the file and keeps its id', () => {
    const level = docToLevel(TOWN_FILE);
    const bakery = level.places.find((m) => m.id === 'bakery')!;
    bakery.x += 3;
    const marker = levelToDoc(level).markers.find((m) => m.id === 'bakery')!;
    expect(marker.kind).toBe('place');
    expect(marker.x).toBe(TOWN_FILE.markers.find((m) => m.id === 'bakery')!.x + 3);
    expect(marker.data).toEqual({ label: 'Crumb & Crock' });
  });

  it('a building keeps its colours as #rrggbb strings in the file', () => {
    const level = docToLevel(TOWN_FILE);
    level.buildings[0].color = 0x112233;
    expect(levelToDoc(level).data.buildings[0].color).toBe('#112233');
    expect(levelToDoc(docToLevel(TOWN_FILE)).data.buildings[0].roof).toBe(TOWN_FILE.data.buildings[0].roof);
  });

  it('is a copy: editing it does not change the loaded file', () => {
    const level = docToLevel(TOWN_FILE);
    const props = TOWN_FILE.props.length;
    const radius = TOWN_FILE.data.ponds[0].r;
    level.props.push({ prefab: 'bench', x: 0, z: 0 });
    level.ponds[0].r = 9;
    expect(TOWN_FILE.props.length).toBe(props);
    expect(TOWN_FILE.data.ponds[0].r).toBe(radius);
  });

  it('is registered under its game id', () => {
    expect(pebblecrossAdapter.id).toBe('pebblecross');
    expect(pebblecrossAdapter.levels()).toEqual([{ id: 'pebblecross', name: 'Pebblecross' }]);
  });
});
