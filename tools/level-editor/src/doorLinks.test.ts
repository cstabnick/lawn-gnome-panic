import { describe, expect, it } from 'vitest';
import { doorLinks, linksIn, type ZoneLike } from './doorLinks';

const ex = (o: Partial<ZoneLike['exits'][number]> & { to: string }): ZoneLike['exits'][number] => ({ x: 1, z: 2, arriveX: 3, arriveZ: 4, label: 'out', ...o });

const zones: Record<string, ZoneLike> = {
  a: { id: 'a', name: 'Alpha', exits: [ex({ to: 'b' }), ex({ to: 'a/h1', door: true }), ex({ to: 'nowhere' })] },
  b: { id: 'b', name: 'Beta', exits: [ex({ to: 'a' })] },
  'a/h1': { id: 'a/h1', name: 'Alpha house', indoor: true, exits: [ex({ to: 'a' })] },
};

describe('doorLinks', () => {
  const links = doorLinks(zones);
  it('makes one link per exit, in zone then exit order', () => {
    expect(links.map((l) => `${l.zone}#${l.index}->${l.to}`)).toEqual(['a#0->b', 'a#1->a/h1', 'a#2->nowhere', 'b#0->a', 'a/h1#0->a']);
  });
  it('names the destination and its arrival point', () => {
    expect(links[0]).toMatchObject({ toName: 'Beta', arrive: { x: 3, z: 4 }, from: { x: 1, z: 2 }, destKnown: true, destIndoor: false, kind: 'exit' });
  });
  it('marks house doors and indoor destinations', () => {
    expect(links[1]).toMatchObject({ kind: 'door', destIndoor: true, toName: 'Alpha house' });
  });
  it('flags an unknown destination', () => {
    expect(links[2]).toMatchObject({ destKnown: false, toName: '(unknown zone)', destIndoor: false });
  });
  it('linksIn keeps one zone', () => {
    expect(linksIn(links, 'a')).toHaveLength(3);
  });
});
