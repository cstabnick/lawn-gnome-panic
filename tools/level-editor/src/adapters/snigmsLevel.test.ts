// The Snigms town in the level editor: it opens the town document, saves it back unchanged, and refuses saves the game could not load.
import { describe, expect, it } from 'vitest';
import townDoc from '@snigms/data/levels/town.level.json';
import type { EditorContext, World } from '../context';
import { snigmsAdapter } from './snigms';

interface TownZone {
  props: Record<string, unknown>[];
  markers: Record<string, unknown>[];
}

function openTown(): { world: World; zone: TownZone } {
  const world = snigmsAdapter.createWorld('town');
  const zone = world.zones['town' as keyof World['zones']] as unknown as TownZone;
  return { world, zone };
}

const ctxOf = (world: World) => ({ zones: world.zones, zone: 'town' }) as unknown as EditorContext;

describe('Snigms town in the level editor', () => {
  it('opens the town document with its props and markers', () => {
    const { zone } = openTown();
    expect(zone.props.length).toBe(townDoc.props.length);
    expect(zone.markers.length).toBe(townDoc.markers.length);
  });

  it('saves back the same document when nothing was changed', () => {
    const { world } = openTown();
    const out = snigmsAdapter.toDoc(world.zones['town' as keyof World['zones']]);
    expect(out.game).toBe('snigms');
    expect(out.doc).toEqual(townDoc);
  });

  it('accepts the shipped town', () => {
    const { world } = openTown();
    expect(() => snigmsAdapter.beforeSave?.(ctxOf(world), ['town'])).not.toThrow();
  });

  it('refuses a prop that is not a town piece', () => {
    const { world, zone } = openTown();
    zone.props.push({ prefab: 'fridge', x: 0, z: 0, rot: 0, scale: 1 });
    expect(() => snigmsAdapter.beforeSave?.(ctxOf(world), ['town'])).toThrow(/not a town piece/);
  });

  it('needs exactly one gate marker', () => {
    const { world, zone } = openTown();
    zone.markers = zone.markers.filter((m) => m.kind !== 'gate');
    (world.zones['town' as keyof World['zones']] as unknown as TownZone).markers = zone.markers;
    expect(() => snigmsAdapter.beforeSave?.(ctxOf(world), ['town'])).toThrow(/exactly one gate/);
  });

  it('refuses a duplicate marker id', () => {
    const { world, zone } = openTown();
    const spot = zone.markers.find((m) => m.kind === 'spot');
    expect(spot).toBeDefined();
    zone.markers.push({ ...spot! });
    expect(() => snigmsAdapter.beforeSave?.(ctxOf(world), ['town'])).toThrow(/used twice/);
  });
});
