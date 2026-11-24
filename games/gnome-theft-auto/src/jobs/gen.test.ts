// Gig generators: a seeded rng and a fake road grid, one check per job shape, and same-seed determinism.
import { describe, expect, it } from 'vitest';
import { makeBoatGig, makeCourierRoute, makePilotGig, makePlayerFare, makeTaxiFare, type GenCtx, type GenVehicle } from './gen';
import { perksFor } from './defs';
import { AIR_PADS, LAND_PLACES } from './places';
import type { Gig, JobId, Surge } from './types';

// mulberry32: a small seeded generator, 0..1.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Road nodes every 20 m over x, z in -300..300.
const ROADS: { x: number; z: number }[] = [];
for (let x = -300; x <= 300; x += 20) for (let z = -300; z <= 300; z += 20) ROADS.push({ x, z });

const NO_SURGE: Surge = { rush: false, storm: false, celebrity: false, payMult: 1, spawnMult: 1, label: null };

function vehicle(over: Partial<GenVehicle> = {}): GenVehicle {
  return { kind: 'hoa-van', seats: 1, mass: 1.2, flies: false, fixedWing: false, boat: false, ...over };
}

function ctx(job: JobId, level: number, rng: () => number, from: { x: number; z: number }, v: GenVehicle, home: { x: number; z: number } | null = null): GenCtx {
  return { rng, from, level, perks: perksFor(job, level), surge: NO_SURGE, roads: ROADS, vehicle: v, home };
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }): number => Math.hypot(a.x - b.x, a.z - b.z);

describe('taxi fares', () => {
  it('a ground car with a spare seat gets a fare 50..220 m away and 120 m+ to the drop', () => {
    const g = makeTaxiFare(ctx('taxi', 1, mulberry32(3), { x: 0, z: 0 }, vehicle())) as Gig;
    expect(g).not.toBeNull();
    const [kerb, drop] = g.stops;
    expect(kerb.action).toBe('pickup');
    expect(drop.action).toBe('drop');
    const d0 = dist({ x: 0, z: 0 }, kerb);
    expect(d0).toBeGreaterThanOrEqual(50);
    expect(d0).toBeLessThanOrEqual(220);
    expect(dist(kerb, drop)).toBeGreaterThanOrEqual(120);
    expect(g.kind).toBe('fare');
    expect(g.passengers).toBe(1);
  });

  it('a boat gets null', () => {
    expect(makeTaxiFare(ctx('taxi', 1, mulberry32(3), { x: 0, z: 0 }, vehicle({ boat: true, seats: 1 })))).toBeNull();
  });
});

describe('courier rounds', () => {
  it('a push-bike round has at most 2 drops and no heavy parcel', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = makeCourierRoute(ctx('courier', 1, mulberry32(seed), { x: 0, z: 0 }, vehicle({ kind: 'push-bike', mass: 0.4 }), { x: 0, z: 0 })) as Gig;
      expect(g).not.toBeNull();
      expect(g.parcels.length).toBeLessThanOrEqual(2);
      expect(g.parcels).not.toContain('heavy');
    }
  });
});

describe('pilot gigs', () => {
  it('a copter charter ends on an air pad land stop', () => {
    const home = { x: 500, z: -80 };
    const g = makePilotGig(ctx('pilot', 1, mulberry32(9), home, vehicle({ kind: 'plane', flies: true, seats: 1 }), home), 'charter') as Gig;
    expect(g).not.toBeNull();
    const last = g.stops[g.stops.length - 1];
    expect(last.action).toBe('land');
    expect(AIR_PADS.map((p) => p.id)).toContain(last.id);
  });

  it('a fixed-wing charter has a gate and ends at home', () => {
    const home = { x: 500, z: -80 };
    const g = makePilotGig(ctx('pilot', 1, mulberry32(4), home, vehicle({ kind: 'plane', flies: true, fixedWing: true }), home), 'charter') as Gig;
    expect(g.stops.some((s) => s.action === 'gate')).toBe(true);
    const last = g.stops[g.stops.length - 1];
    expect(last.x).toBe(home.x);
    expect(last.z).toBe(home.z);
  });
});

describe('boat gigs', () => {
  it('a boat near Loch Moss dock gets a 5-stop ferry with rising dues', () => {
    const v = vehicle({ kind: 'walnut-dinghy', boat: true, seats: 2 });
    const g = makeBoatGig(ctx('boat', 2, mulberry32(5), { x: -705, z: -578 }, v), 'ferry') as Gig;
    expect(g).not.toBeNull();
    expect(g.stops.length).toBe(5);
    const dues = g.stops.map((s) => s.due ?? 0);
    for (let i = 1; i < dues.length; i++) expect(dues[i]).toBeGreaterThan(dues[i - 1]);
  });
});

describe('player fares', () => {
  it('the pickup needs the player aboard', () => {
    const call = { key: 'k1', owner: 7, id: 3, name: 'Bess Rootley', x: 10, z: 20, dest: 'the-gnomecino' };
    const g = makePlayerFare(ctx('taxi', 1, mulberry32(2), { x: 0, z: 0 }, vehicle()), call) as Gig;
    expect(g).not.toBeNull();
    expect(g.stops[0].needsPlayer).toBe(true);
    expect(g.playerFare).toEqual({ key: 'k1', id: 3, from: 7 });
  });

  it('an unknown destination gives null', () => {
    const call = { key: 'k1', owner: 7, id: 3, name: 'Bess', x: 10, z: 20, dest: 'nowhere' };
    expect(makePlayerFare(ctx('taxi', 1, mulberry32(2), { x: 0, z: 0 }, vehicle()), call)).toBeNull();
  });
});

describe('determinism and places', () => {
  it('the same seed gives deep-equal gigs', () => {
    const a = makeTaxiFare(ctx('taxi', 1, mulberry32(42), { x: 0, z: 0 }, vehicle()));
    const b = makeTaxiFare(ctx('taxi', 1, mulberry32(42), { x: 0, z: 0 }, vehicle()));
    expect(a).toEqual(b);
    const c1 = makeCourierRoute(ctx('courier', 3, mulberry32(42), { x: 0, z: 0 }, vehicle({ mass: 3 }), { x: 0, z: 0 }));
    const c2 = makeCourierRoute(ctx('courier', 3, mulberry32(42), { x: 0, z: 0 }, vehicle({ mass: 3 }), { x: 0, z: 0 }));
    expect(c1).toEqual(c2);
  });

  it('every land place is a candidate for fares', () => {
    expect(LAND_PLACES.filter((p) => p.area === 'city').length).toBeGreaterThan(0);
  });
});
