import { afterEach, describe, expect, it } from 'vitest';
import { ASSIST, NO_INPUT, SIM_HZ, type PhysEvent, type Player } from './config';
import { generateWorld, groundAt, type Hazard, type World } from './world';
import { createPlayer, stepPlayer } from './physics';

const DT = 1 / SIM_HZ;

afterEach(() => {
  ASSIST.landSaves = 0;
  ASSIST.bigAirTol = 1;
  ASSIST.closeCall = 1;
});

describe('aether spikes', () => {
  it('riding into a hazard bails with reason Spiked', () => {
    const w = generateWorld(3);
    const p = createPlayer(w);
    const sp = w.spawn;
    const x = sp.pos.x + Math.sin(sp.heading) * 10;
    const z = sp.pos.z + Math.cos(sp.heading) * 10;
    const y = groundAt(w, x, z, sp.pos.y + 50)?.y ?? sp.pos.y;
    const hz: Hazard = { kind: 'spike', x, y, z, r: 2, h: 2, island: 0 };
    w.hazards.push(hz);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < 4 * SIM_HZ; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    expect(ev).toContainEqual({ e: 'bail', reason: 'Spiked' });
  });

  it('the same ride with no hazards never bails Spiked', () => {
    const w = generateWorld(3);
    expect(w.hazards.length).toBe(0);
    const p = createPlayer(w);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < 4 * SIM_HZ; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    expect(ev.some((e) => e.e === 'bail' && e.reason === 'Spiked')).toBe(false);
  });

  it('jumping high enough over a hazard clears it', () => {
    const w = generateWorld(3);
    const p = createPlayer(w);
    const sp = w.spawn;
    const x = sp.pos.x;
    const z = sp.pos.z;
    const y = groundAt(w, x, z, sp.pos.y + 50)?.y ?? sp.pos.y;
    const hz: Hazard = { kind: 'spike', x, y, z, r: 2, h: 2, island: 0 };
    w.hazards.push(hz);
    p.pos.set(x, hz.y + hz.h + 3, z);
    p.mode = 'air';
    const ev: PhysEvent[] = [];
    stepPlayer(p, NO_INPUT, null, w, DT, ev);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
    expect(p.mode).toBe('air');
  });
});

describe('hazard bails push the rider clear', () => {
  it('riding into a tree bails once with Hit a tree, and the rider is pushed clear of it', () => {
    const w = generateWorld(3);
    const p = createPlayer(w);
    const sp = w.spawn;
    const x = sp.pos.x + Math.sin(sp.heading) * 10;
    const z = sp.pos.z + Math.cos(sp.heading) * 10;
    const y = groundAt(w, x, z, sp.pos.y + 50)?.y ?? sp.pos.y;
    w.hazards.push({ kind: 'tree', x, y, z, r: 0.8, h: 12, island: 0 });
    const ev: PhysEvent[] = [];
    for (let i = 0; i < 4 * SIM_HZ && !ev.some((e) => e.e === 'bail'); i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    expect(ev).toContainEqual({ e: 'bail', reason: 'Hit a tree' });
    // Let go of the stick for 4 s: no second bail from the same tree.
    for (let i = 0; i < 4 * SIM_HZ; i++) stepPlayer(p, NO_INPUT, null, w, DT, ev);
    expect(ev.filter((e) => e.e === 'bail')).toHaveLength(1);
    expect(Math.hypot(p.pos.x - x, p.pos.z - z)).toBeGreaterThan(0.8 + 0.3);
  });
});

type Pt = { x: number; y: number; z: number };

/**
 * Drop a rider 3 m above (x, z), moving at `speed` along `travel`, with the board held `offset` radians off the travel
 * every step, until it lands or bails. Deterministic: no input.
 */
function dropOnto(w: World, x: number, z: number, travel: number, speed: number, offset: number): { p: Player; ev: PhysEvent[] } {
  const p = createPlayer(w);
  const y = groundAt(w, x, z, w.spawn.pos.y + 50)?.y ?? w.spawn.pos.y;
  p.pos.set(x, y + 3, z);
  p.mode = 'air';
  p.airT = 0;
  p.vel.set(Math.sin(travel) * speed, 0, Math.cos(travel) * speed);
  const ev: PhysEvent[] = [];
  for (let i = 0; i < 3 * SIM_HZ && p.mode === 'air'; i++) {
    p.heading = Math.atan2(p.vel.x, p.vel.z) + offset;
    stepPlayer(p, NO_INPUT, null, w, DT, ev);
  }
  return { p, ev };
}

/** Where a clean drop on the spawn island lands (no hazards in the world). */
function landingSpot(w: World): Pt {
  const { p, ev } = dropOnto(w, w.spawn.pos.x, w.spawn.pos.z, w.spawn.heading, 10, 0);
  expect(ev.some((e) => e.e === 'land')).toBe(true);
  return { x: p.pos.x, y: p.pos.y, z: p.pos.z };
}

/** A rock whose edge is `gap` metres to the side of the landing spot, clear of the flight path. */
function hazardBeside(at: Pt, travel: number, gap: number): Hazard {
  const r = 1;
  const d = r + gap;
  return { kind: 'rock', x: at.x + Math.cos(travel) * d, y: at.y, z: at.z - Math.sin(travel) * d, r, h: 1.5, island: 0 };
}

describe('landing perks', () => {
  it('a landing that would bail is a bail with no saves left', () => {
    const w = generateWorld(3);
    const sp = w.spawn;
    // Board 90 degrees off the travel direction: lands sideways.
    const { ev } = dropOnto(w, sp.pos.x, sp.pos.z, sp.heading, 10, Math.PI / 2);
    expect(ev).toContainEqual({ e: 'bail', reason: 'Landed sideways' });
  });

  it('with a save left, the same landing is saved: a clean land, no bail, one save spent', () => {
    const w = generateWorld(3);
    const sp = w.spawn;
    ASSIST.landSaves = 1;
    const { p, ev } = dropOnto(w, sp.pos.x, sp.pos.z, sp.heading, 10, Math.PI / 2);
    expect(ev).toContainEqual({ e: 'saved', reason: 'Landed sideways' });
    expect(ev.some((e) => e.e === 'land')).toBe(true);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
    expect(p.mode).toBe('ground');
    expect(ASSIST.landSaves).toBe(0);
  });

  it('a clean landing 2 m from a hazard edge is a close call (near)', () => {
    const w = generateWorld(3);
    const sp = w.spawn;
    const at = landingSpot(w);
    w.hazards.push(hazardBeside(at, sp.heading, 2));
    const { ev } = dropOnto(w, sp.pos.x, sp.pos.z, sp.heading, 10, 0);
    expect(ev.find((e) => e.e === 'land')).toMatchObject({ e: 'land', near: true });
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
  });

  it('a clean landing 30 m from a hazard has no near field', () => {
    const w = generateWorld(3);
    const sp = w.spawn;
    const at = landingSpot(w);
    w.hazards.push(hazardBeside(at, sp.heading, 30));
    const { ev } = dropOnto(w, sp.pos.x, sp.pos.z, sp.heading, 10, 0);
    const land = ev.find((e) => e.e === 'land');
    expect(land).toBeDefined();
    expect(land).not.toHaveProperty('near');
  });
});
