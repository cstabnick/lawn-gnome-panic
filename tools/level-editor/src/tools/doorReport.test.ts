import { describe, expect, it } from 'vitest';
import type { DoorLink } from '../doorLinks';
import { doorProblems } from './doorReport';

const link = (o: Partial<DoorLink> & { zone: string; index: number }): DoorLink => ({
  label: 'out', kind: 'exit', from: { x: 0, z: 0 }, to: 'b', toName: 'Beta', arrive: { x: 10, z: 20 },
  destKnown: true, destIndoor: false, ...o,
});

describe('doorProblems', () => {
  it('reports an exit to an unknown zone', () => {
    const links = [link({ zone: 'a', index: 0, label: 'north', to: 'nowhere', toName: '(unknown zone)', destKnown: false })];
    expect(doorProblems(links, 'a', () => true)).toEqual(['exit "north" goes to unknown zone "nowhere"']);
  });

  it('reports an outdoor arrival point that cannot be reached, with its coordinates', () => {
    const links = [link({ zone: 'a', index: 0, label: 'east', arrive: { x: 10.04, z: 20.26 } })];
    expect(doorProblems(links, 'a', () => false)).toEqual(['exit "east" arrives at 10.0, 20.3 (Beta), which is blocked or unreachable']);
  });

  it('is silent for a reachable arrival point', () => {
    expect(doorProblems([link({ zone: 'a', index: 0 })], 'a', () => true)).toEqual([]);
  });

  it('never reports an indoor destination as unreachable', () => {
    const links = [link({ zone: 'a', index: 0, destIndoor: true })];
    expect(doorProblems(links, 'a', () => false)).toEqual([]);
  });

  it('skips house doors and links of other zones', () => {
    const links = [
      link({ zone: 'a', index: 0, kind: 'door', destKnown: false }),
      link({ zone: 'b', index: 0, destKnown: false }),
    ];
    expect(doorProblems(links, 'a', () => false)).toEqual([]);
  });

  it('asks the predicate only for outdoor, known destinations', () => {
    const asked: [number, number][] = [];
    const links = [
      link({ zone: 'a', index: 0, destKnown: false }),
      link({ zone: 'a', index: 1, destIndoor: true }),
      link({ zone: 'a', index: 2 }),
    ];
    doorProblems(links, 'a', (x, z) => { asked.push([x, z]); return true; });
    expect(asked).toEqual([[10, 20]]);
  });
});
