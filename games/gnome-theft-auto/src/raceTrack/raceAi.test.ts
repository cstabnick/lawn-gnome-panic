// A rival on the Speedway: it grids, drives a full lap on its own line and stays on the road.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { AIRFIELD } from '../config';
import type { Vehicle, World } from '../types';

vi.mock('../audio', () => ({ play: () => undefined }));

// Some modules read location.search when they load; the test runs in node.
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { spawnRival, driveRival, removeRival } = await import('./raceAi');
const { TRACK, locate, trackLength } = await import('./track');

const world = { boxes: [], half: 900, biomeAt: () => 'desert', airfield: AIRFIELD } as unknown as World;

describe('race rival', () => {
  it('drives a full lap on its line without leaving the road', { timeout: 60_000 }, () => {
    const scene = new THREE.Scene();
    const vehicles: Vehicle[] = [];
    const def = { name: 'Test Rival', look: {}, pace: 0.95, grip: 1, line: 0, aggression: 0.3, taunts: [] };
    const r = spawnRival(scene, vehicles, def, 'ride-on', 1);
    expect(vehicles).toContain(r.v);
    expect(r.v.driver).toBe('npc');
    expect(r.v.questOwned).toBe(true);

    const L = trackLength();
    const startDist = r.dist;
    const dt = 1 / 60;
    let time = 0;
    let offRoadTime = 0;
    let lapTime: number | null = null;

    for (let frame = 0; frame < 120 * 60; frame++) {
      driveRival(r, dt, world, { hold: false, playerDist: r.dist, time });
      time += dt;
      const spot = locate(r.v.x, r.v.z, 60, r.hint);
      if (!spot || Math.abs(spot.lat) > TRACK.barrierOffset) offRoadTime += dt;
      if (lapTime === null && r.dist - startDist >= L) lapTime = time;
    }

    console.log(`[raceAi] rival "${def.name}" lap time: ${lapTime === null ? 'no lap' : lapTime.toFixed(2)} s`);
    expect(r.dist > 0).toBe(true);
    expect(r.dist - startDist).toBeGreaterThanOrEqual(L);
    expect(offRoadTime).toBeLessThanOrEqual(1);

    removeRival(scene, vehicles, r);
    expect(vehicles).not.toContain(r.v);
  });
});

const { TRACKS } = await import('./tracks');
// The dirt tracks lie outside the Speedway test's 900 m world.
const bigWorld = { ...world, half: 3000 } as World;

describe('race rival on the dirt tracks', () => {
  for (const id of ['rutbottom', 'capwood-run'] as const) {
    it(`makes progress on ${id} and stays near the centre line`, { timeout: 60_000 }, () => {
      const track = TRACKS[id];
      const scene = new THREE.Scene();
      const vehicles: Vehicle[] = [];
      const def = { name: 'Dirt Rival', look: {}, pace: 0.95, grip: 1, line: 0, aggression: 0.3, taunts: [] };
      const r = spawnRival(scene, vehicles, def, 'ride-on', 1, track);
      expect(r.track).toBe(track);

      const dt = 1 / 60;
      let time = 0;
      let near = 0;
      const frames = 60 * 60;
      for (let frame = 0; frame < frames; frame++) {
        driveRival(r, dt, bigWorld, { hold: false, playerDist: r.dist, time });
        time += dt;
        const spot = track.locate(r.v.x, r.v.z, 60, r.hint);
        if (spot && Math.abs(spot.lat) <= track.def.barrierOffset + 3) near++;
      }
      console.log(`[raceAi] ${id}: dist ${r.dist.toFixed(0)} m in 60 s, ${((near / frames) * 100).toFixed(1)}% near the line`);
      expect(r.dist).toBeGreaterThan(150);
      expect(near / frames).toBeGreaterThanOrEqual(0.9);
      removeRival(scene, vehicles, r);
    });
  }
});
