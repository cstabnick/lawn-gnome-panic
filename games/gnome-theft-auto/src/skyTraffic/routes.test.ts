import { describe, expect, it } from 'vitest';
import { SKY_BEHAVIOURS, skyBehaviour } from './behaviours';
import type { SkyContext, SkyWaypoint } from './types';
import { airfieldCircuit, cropPasses, skyWriterRoute } from './routes';

const AF = { x: 480, z: -110, yaw: Math.PI / 2, length: 170 };

function ctx(over: Partial<SkyContext> = {}): SkyContext {
  return {
    playerX: 0, playerZ: 0, heat: 0, eventActive: false, airfield: AF, time: 0, rng: () => 0.5, ...over,
  };
}

function allFinite(route: SkyWaypoint[]): boolean {
  return route.every((p) => [p.x, p.z, p.agl, p.speed, p.hold ?? 0, p.loop ?? 0].every((v) => Number.isFinite(v)));
}

describe('airfieldCircuit', () => {
  const route = airfieldCircuit(AF, { x: 440, z: -132, yaw: Math.PI / 2 });

  it('has 12 points with the apron hold first', () => {
    expect(route).toHaveLength(12);
    expect(route[0].ground).toBe(true);
    expect(route[0].hold).toBe(30);
  });

  it('rotates 34 m along the runway from the centre', () => {
    expect(route[3].ground).toBe(true);
    expect(route[3].x).toBeCloseTo(480 + 34, 2);
  });

  it('climbs out at 35 m', () => {
    expect(route[4].ground).toBeFalsy();
    expect(route[4].agl).toBe(35);
  });

  it('touches down on the ground', () => {
    expect(route[9].ground).toBe(true);
  });

  it('has only finite numbers', () => {
    expect(allFinite(route)).toBe(true);
  });
});

describe('cropPasses', () => {
  const route = cropPasses({ x: 40, z: 440, w: 160, d: 90 }, 4, 7, 26);

  it('has 12 points with 4 spray points', () => {
    expect(route).toHaveLength(12);
    expect(route.filter((p) => p.spray)).toHaveLength(4);
  });

  it('alternates the spray side in x', () => {
    const sprays = route.filter((p) => p.spray).map((p) => Math.sign(p.x - 40));
    expect(sprays).toEqual([1, -1, 1, -1]);
  });

  it('has only finite numbers', () => {
    expect(allFinite(route)).toBe(true);
  });
});

describe('skyWriterRoute', () => {
  const route = skyWriterRoute({ x: 220, z: 160 }, 90, 120, 34);

  it('has 12 smoking points with exactly two loops', () => {
    expect(route).toHaveLength(12);
    expect(route.every((p) => p.smoke === true)).toBe(true);
    expect(route.filter((p) => p.loop !== undefined)).toHaveLength(2);
  });
});

describe('SKY_BEHAVIOURS', () => {
  it('has 10 entries with unique ids', () => {
    expect(SKY_BEHAVIOURS).toHaveLength(10);
    expect(new Set(SKY_BEHAVIOURS.map((b) => b.id)).size).toBe(10);
  });

  it('every route is non-empty with finite numbers', () => {
    for (const b of SKY_BEHAVIOURS) {
      const route = b.route(ctx());
      expect(route.length, b.id).toBeGreaterThan(0);
      expect(allFinite(route), b.id).toBe(true);
    }
  });

  it('exactly one banner', () => {
    expect(SKY_BEHAVIOURS.filter((b) => b.banner === true)).toHaveLength(1);
  });

  it('watch-copter spawns only at heat 2 and up', () => {
    const watch = skyBehaviour('watch-copter');
    expect(watch?.when?.(ctx({ heat: 0 }))).toBe(false);
    expect(watch?.when?.(ctx({ heat: 2 }))).toBe(true);
  });

  it('looks up the balloon by id', () => {
    expect(skyBehaviour('balloon')?.kind).toBe('dandelion-drifter');
  });
});
