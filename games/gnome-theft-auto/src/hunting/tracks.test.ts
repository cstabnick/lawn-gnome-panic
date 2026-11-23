// Tuft hunting: footprints. Ageing and the cap of the ring, the order of near(), and when a quarry leaves a print.
import { describe, expect, it } from 'vitest';
import { createQuarry, type QuarryEnv } from './quarry';
import { createTracks, leavePrints } from './tracks';
import { SPECIES } from './species';

const env: QuarryEnv = { ground: () => 0, open: () => true, rnd: Math.random };
const hedgehog = SPECIES.find((s) => s.id === 'hedgehog')!;

describe('tracks ring', () => {
  it('add() stores a print at age 0; update() ages it and drops it past the life', () => {
    const t = createTracks(10, 5);
    t.add({ x: 0, z: 0, yaw: 0, left: true, species: 'fox' });
    expect(t.prints).toHaveLength(1);
    expect(t.prints[0].age).toBe(0);
    t.update(2);
    expect(t.prints[0].age).toBe(2);
    t.update(2.5);
    expect(t.prints).toHaveLength(1);
    t.update(0.6);
    expect(t.prints).toHaveLength(0);
  });

  it('caps at max, dropping the oldest first', () => {
    const t = createTracks(2, 100);
    t.add({ x: 1, z: 0, yaw: 0, left: true, species: 'fox' });
    t.add({ x: 2, z: 0, yaw: 0, left: true, species: 'fox' });
    t.add({ x: 3, z: 0, yaw: 0, left: true, species: 'fox' });
    expect(t.prints.map((p) => p.x)).toEqual([2, 3]);
  });

  it('near() returns prints within r, newest first', () => {
    const t = createTracks(10, 100);
    t.add({ x: 0, z: 0, yaw: 0, left: true, species: 'fox' });
    t.update(4);
    t.add({ x: 1, z: 0, yaw: 0, left: false, species: 'fox' });
    t.update(1);
    t.add({ x: 50, z: 0, yaw: 0, left: true, species: 'fox' });
    const hits = t.near(0, 0, 5);
    expect(hits.map((p) => p.x)).toEqual([1, 0]);
    expect(hits[0].age).toBeLessThan(hits[1].age);
  });

  it('clear() empties the ring', () => {
    const t = createTracks();
    t.add({ x: 0, z: 0, yaw: 0, left: true, species: 'fox' });
    t.clear();
    expect(t.prints).toHaveLength(0);
  });
});

describe('leavePrints', () => {
  it('leaves a print after a stride and resets moved', () => {
    const t = createTracks();
    const q = createQuarry(1, hedgehog, 0, 0, env);
    q.mode = 'walk';
    q.moved = hedgehog.stride;
    leavePrints(t, q);
    expect(t.prints).toHaveLength(1);
    expect(t.prints[0].species).toBe('hedgehog');
    expect(t.prints[0].yaw).toBe(q.yaw);
    expect(q.moved).toBe(0);
  });

  it('leaves nothing short of a stride', () => {
    const t = createTracks();
    const q = createQuarry(1, hedgehog, 0, 0, env);
    q.mode = 'walk';
    q.moved = hedgehog.stride * 0.5;
    leavePrints(t, q);
    expect(t.prints).toHaveLength(0);
    expect(q.moved).toBe(hedgehog.stride * 0.5);
  });

  it('leaves no print while flying, and keeps moved', () => {
    const t = createTracks();
    const q = createQuarry(1, hedgehog, 0, 0, env);
    q.mode = 'flying';
    q.moved = hedgehog.stride * 2;
    leavePrints(t, q);
    expect(t.prints).toHaveLength(0);
    expect(q.moved).toBe(hedgehog.stride * 2);
  });

  it('alternates feet between prints', () => {
    const t = createTracks();
    const q = createQuarry(1, hedgehog, 0, 0, env);
    q.mode = 'walk';
    q.moved = hedgehog.stride;
    leavePrints(t, q);
    q.moved = hedgehog.stride;
    leavePrints(t, q);
    expect(t.prints[0].left).not.toBe(t.prints[1].left);
  });
});
