// The Lost & Found Speedway's geometry, its terrain and the minimum lap time: the fastest sensible car (the Zero-Turn
// Racer, both driving models) is driven round by a simple racing driver at several levels of nerve; the quickest clean
// lap must still take at least 35 s.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { VehicleController, qYaw, v3 } from '@lawn/vehicle';
import { AIRFIELD, VEHICLES } from '../config';
import { heightAt, terrainProbe } from '../terrain';
import type { VehicleKind, World } from '../types';
import { markersOf, markerNum, regionAt } from '../levels';
import { racingLine as plan, steerTo } from './autopilot';
import {
  GateTracker, TRACK, gates, locate, onTrackRoad, sampleAt, trackFrame, trackLength, trackSamples,
} from './track';

vi.mock('../audio', () => ({ play: () => undefined }));
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { createVehicle, stepVehicle } = await import('../vehicles');
const { mowerConfig } = await import('../simdrive');

const world = { boxes: [], half: 900, biomeAt: () => 'desert', airfield: AIRFIELD } as unknown as World;
const MIN_LAP = 35;

describe('track geometry', () => {
  it('is a 1.1-1.4 km loop inside its reserve, in the Dust Flats', () => {
    const L = trackLength();
    expect(L).toBeGreaterThan(1100);
    expect(L).toBeLessThan(1400);
    const r = TRACK.reserve;
    const m = markersOf('reserve').find((x) => x.id === 'reserve/speedway')!;
    expect(m.x).toBe(r.x);
    expect(m.z).toBe(r.z);
    expect(markerNum(m, 'hw')).toBe(r.hw);
    expect(markerNum(m, 'hd')).toBe(r.hd);
    for (const p of trackSamples()) {
      expect(Math.abs(p.x - r.x) + TRACK.barrierOffset).toBeLessThan(r.hw);
      expect(Math.abs(p.z - r.z) + TRACK.barrierOffset).toBeLessThan(r.hd);
      expect(regionAt(p.x, p.z)).toBe('dust-flats');
    }
  });

  it('keeps every two parts of the track apart (barriers never cross)', () => {
    const S = trackSamples();
    const n = S.length;
    let closest = Infinity;
    for (let i = 0; i < n; i += 2) {
      for (let k = i + 2; k < n; k += 2) {
        const along = Math.min(k - i, n - (k - i));
        if (along < 90) continue;
        closest = Math.min(closest, Math.hypot(S[i].x - S[k].x, S[i].z - S[k].z));
      }
    }
    expect(closest).toBeGreaterThan(2 * TRACK.barrierOffset + 8);
  });

  it('counts laps through the gates in order, and not backwards', () => {
    const t = new GateTracker();
    const L = trackLength();
    const events: string[] = [];
    for (let s = -20; s < 2 * L + 5; s += 2) {
      const p = trackFrame(s);
      const ev = t.update(0.1, p.x, p.z);
      if (ev && ev !== 'gate') events.push(ev);
    }
    expect(events).toEqual(['start', 'lap', 'lap']);
    expect(t.laps).toBe(2);
    const back = new GateTracker();
    for (let s = L + 20; s > -L; s -= 2) {
      const p = trackFrame(s);
      back.update(0.1, p.x, p.z);
    }
    expect(back.laps).toBe(0);
    expect(gates()).toHaveLength(TRACK.gates);
  });

  it('locates points, and the road and pit lane are asphalt', () => {
    const p = sampleAt(300);
    const spot = locate(p.x + p.nx * 3, p.z + p.nz * 3)!;
    expect(Math.abs(spot.s - 300)).toBeLessThan(2);
    expect(spot.lat).toBeCloseTo(3, 0);
    expect(onTrackRoad(p.x, p.z)).toBe(true);
    expect(onTrackRoad(p.x + p.nx * 11, p.z + p.nz * 11)).toBe(false);
    expect(onTrackRoad(760, -384)).toBe(true);
  });
});

describe('track terrain', () => {
  it('raises the road for the climbs and jumps, and leaves the pan flat away from it', () => {
    // Beyond the shoulder and fade (11 + 9 m from the centre line) the road leaves the pan alone.
    const far: number[] = [];
    for (let x = 610; x <= 870; x += 10) {
      for (let z = -600; z <= -335; z += 10) {
        const spot = locate(x, z, 60);
        if (spot && spot.dist < 22) continue;
        far.push(heightAt(x, z));
      }
    }
    expect(far.length).toBeGreaterThan(80);
    const base = far[0];
    for (const h of far) expect(Math.abs(h - base)).toBeLessThan(0.05);
    const top = sampleAt(330);
    expect(heightAt(top.x, top.z) - base).toBeGreaterThan(2.5);
    for (const j of TRACK.jumps) {
      const lip = sampleAt(j.s);
      const before = sampleAt(j.s - j.up - 3);
      const landing = sampleAt(j.s + j.down + 3);
      expect(heightAt(lip.x, lip.z) - heightAt(before.x, before.z)).toBeGreaterThan(j.rise * 0.6);
      expect(heightAt(lip.x, lip.z) - heightAt(landing.x, landing.z)).toBeGreaterThan(j.rise * 0.6);
    }
  }, 60_000);
});

interface LapResult { time: number | null; worstLat: number }

/** Drive the Zero-Turn round from a rolling start on the main straight, return the clean lap time (null if it went off). */
function lapSim(grip: number): LapResult {
  const spec = VEHICLES['zero-turn' as VehicleKind];
  const ctrl = new VehicleController(mowerConfig(spec), { ground: terrainProbe() });
  const s0 = trackFrame(trackLength() - 60);
  ctrl.place(v3(s0.x, heightAt(s0.x, s0.z), s0.z), s0.yaw, 15);
  const tracker = new GateTracker();
  let hint = -1;
  let worstLat = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 60 * 150; i++) {
    const b = ctrl.body;
    const spot = locate(b.pos.x, b.pos.z, 60, hint);
    if (!spot) return { time: null, worstLat: Infinity };
    hint = spot.i;
    worstLat = Math.max(worstLat, Math.abs(spot.lat));
    if (Math.abs(spot.lat) > TRACK.barrierOffset) return { time: null, worstLat };
    const speed = ctrl.telemetry.forwardSpeed;
    const { aimS, target } = plan(spot.s, speed, grip);
    const steer = steerTo(b.pos.x, b.pos.z, qYaw(b.quat), aimS);
    const throttle = speed < target ? 1 : 0;
    const brake = speed > target + 1.5 ? 1 : 0;
    ctrl.update(dt, { steer, throttle, brake, handbrake: 0, source: 'stick' });
    const ev = tracker.update(dt, b.pos.x, b.pos.z);
    if (ev === 'lap') return { time: tracker.lapTime, worstLat };
  }
  return { time: null, worstLat };
}

/**
 * The same with the arcade model (Options > Driving realism > Arcade). With `boost`, the boost is held on every
 * straight whenever the meter allows (app.ts: it drains 38 a second above 8, refills 6 a second; 1.32x top speed).
 */
function lapArcade(grip: number, boost = false): LapResult {
  const s0 = trackFrame(trackLength() - 60);
  const v = createVehicle(new THREE.Scene(), 'zero-turn', s0.x, s0.z, s0.yaw);
  v.driver = 'player';
  v.speed = 15;
  const tracker = new GateTracker();
  let hint = -1;
  let worstLat = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 60 * 150; i++) {
    const spot = locate(v.x, v.z, 60, hint);
    if (!spot) return { time: null, worstLat: Infinity };
    hint = spot.i;
    worstLat = Math.max(worstLat, Math.abs(spot.lat));
    if (Math.abs(spot.lat) > TRACK.barrierOffset) return { time: null, worstLat };
    const { aimS, target } = plan(spot.s, v.speed, grip);
    const steer = steerTo(v.x, v.z, v.yaw, aimS);
    const throttle = v.speed < target ? 1 : v.speed > target + 1.5 ? -1 : 0;
    const wantBoost = boost && throttle > 0 && (v.boost ?? 100) > 8;
    v.boostActive = wantBoost;
    v.boost = wantBoost ? Math.max(0, (v.boost ?? 100) - 38 * dt) : Math.min(100, (v.boost ?? 100) + 6 * dt);
    stepVehicle(v, { throttle, steer, lift: 0 }, dt, world);
    const ev = tracker.update(dt, v.x, v.z);
    if (ev === 'lap') return { time: tracker.lapTime, worstLat };
  }
  return { time: null, worstLat };
}

describe('minimum lap time', () => {
  it('the fastest clean Zero-Turn lap takes at least 35 s (sim and arcade)', () => {
    const results: string[] = [];
    let best = Infinity;
    const arcadeBoost = (grip: number): LapResult => lapArcade(grip, true);
    for (const [name, run] of [['sim', lapSim], ['arcade', lapArcade], ['arcade + boost', arcadeBoost]] as const) {
      for (const grip of [0.6, 0.9, 1.2, 1.6, 2.2, 3, 6, 100]) {
        const r = run(grip);
        results.push(`${name} grip ${grip}: ${r.time === null ? 'off' : r.time.toFixed(2) + ' s'} (widest ${r.worstLat.toFixed(1)} m)`);
        if (r.time !== null) best = Math.min(best, r.time);
      }
    }
    console.log(['Speedway laps, Zero-Turn Racer:', ...results, `fastest ${best.toFixed(2)} s`].join('\n  '));
    expect(Number.isFinite(best)).toBe(true);
    expect(best).toBeGreaterThanOrEqual(MIN_LAP);
  }, 120_000);
});
