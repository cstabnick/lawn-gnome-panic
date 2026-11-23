import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import {
  conditionMix, engineHz, engineMixFor, engineSoundDef, engineSoundFor, newMisfireState, registerEngineSound,
  stepMisfire, voiceParams,
} from './engines';

const ROSTER = Object.values(VEHICLES);

describe('engine sound table', () => {
  it('gives every vehicle in the roster its own entry', () => {
    for (const spec of ROSTER) {
      expect(engineSoundDef(spec.kind), spec.kind).toBeDefined();
      expect(engineSoundFor(spec).id).toBe(spec.kind);
    }
  });

  it('has a monotonic pitch curve in audible range for every engine', () => {
    for (const spec of ROSTER) {
      const p = engineSoundFor(spec);
      if (p.silent) continue;
      expect(p.idleHz, spec.kind).toBeGreaterThanOrEqual(6);
      expect(p.maxHz, spec.kind).toBeLessThanOrEqual(400);
      let prev = -Infinity;
      for (let i = 0; i <= 50; i++) {
        const hz = engineHz(p, i / 50);
        expect(hz, spec.kind).toBeGreaterThan(prev);
        prev = hz;
      }
      expect(engineHz(p, 0)).toBeCloseTo(p.idleHz);
      expect(engineHz(p, 1)).toBeCloseTo(p.maxHz);
      expect(p.maxHz * p.whineRatio, spec.kind).toBeLessThanOrEqual(8000);
      expect(p.gain, spec.kind).toBeGreaterThan(0.5);
    }
  });

  it('makes the vehicles sound different from each other', () => {
    const keyOf = (k: keyof typeof VEHICLES) => {
      const p = engineSoundFor(VEHICLES[k]);
      return `${p.wave}|${p.idleHz}|${p.maxHz}`;
    };
    const keys = new Set(ROSTER.filter((s) => !engineSoundFor(s).silent).map((s) => keyOf(s.kind)));
    expect(keys.size).toBe(ROSTER.filter((s) => !engineSoundFor(s).silent).length);
    expect(engineSoundFor(VEHICLES['golf-cart']).wave).toBe('electric');
    expect(engineSoundFor(VEHICLES.combine).maxHz).toBeLessThan(engineSoundFor(VEHICLES['zero-turn']).maxHz);
  });

  it('keeps push bikes and Tessie silent', () => {
    for (const k of ['push-bike', 'tessie'] as const) {
      const p = engineSoundFor(VEHICLES[k]);
      expect(p.silent).toBe(true);
      const v = voiceParams(p, { revs: 1, load: 1, cond: conditionMix(p), gate: 1, base: 1 });
      expect(v.level).toBe(0);
    }
  });

  it('falls back for unknown vehicles and lets them register with one call', () => {
    const spec = { kind: 'hover-shed', maxSpeed: 20, accel: 10, mass: 3, flies: true };
    const p = engineSoundFor(spec);
    expect(p.id).toBe('default');
    expect(p.wave).toBe('drone');
    expect(p.maxHz).toBeGreaterThan(p.idleHz);
    registerEngineSound('hover-shed', { wave: 'electric', idleHz: 40, maxHz: 120 });
    const q = engineSoundFor(spec);
    expect(q.id).toBe('hover-shed');
    expect(q.wave).toBe('electric');
    expect(q.idleHz).toBe(40);
  });

  it('prefers a fleet variant entry and applies the pitch multiplier', () => {
    registerEngineSound('test-screamer', { idleHz: 50, maxHz: 150 });
    const p = engineSoundFor({ ...VEHICLES['ride-on'], pitch: 1.2 }, 'test-screamer');
    expect(p.id).toBe('test-screamer');
    expect(p.idleHz).toBeCloseTo(60);
    expect(p.maxHz).toBeCloseTo(180);
    expect(engineSoundFor(VEHICLES['ride-on'], 'no-such-variant').id).toBe('ride-on');
  });
});

describe('condition', () => {
  it('adds misfires and roughness with damage and water, and sags the pitch', () => {
    const p = engineSoundFor(VEHICLES['ride-on']);
    const ok = conditionMix(p, {});
    const bad = conditionMix(p, { hp: 0.2, waterlog: 0.8 });
    expect(ok.misfire).toBe(0);
    expect(bad.misfire).toBeGreaterThan(1);
    expect(bad.rough).toBeGreaterThan(ok.rough);
    expect(bad.pitch).toBeLessThan(1);
    const stalled = conditionMix(p, { waterlog: 1, stalled: true });
    expect(stalled.level).toBeLessThan(1);
    expect(stalled.misfire).toBeGreaterThanOrEqual(4);
  });

  it('misfires drop the level briefly', () => {
    const st = newMisfireState();
    expect(stepMisfire(st, 0, 0.016, () => 0)).toBe(1);
    expect(stepMisfire(st, 10, 0.016, () => 0)).toBeLessThan(1);
    let t = 0;
    while (st.gap > 0 && t < 1) {
      stepMisfire(st, 0, 0.016);
      t += 0.016;
    }
    expect(t).toBeLessThan(0.2);
    expect(stepMisfire(st, 0, 0.016)).toBe(1);
  });
});

describe('mix', () => {
  it('puts other players above traffic and parked vehicles', () => {
    expect(engineMixFor('remote')).toBeGreaterThan(engineMixFor('npc'));
    expect(engineMixFor('npc')).toBeGreaterThan(engineMixFor('none'));
  });

  it('builds voice params: electric idles quiet, load raises the turbo whine', () => {
    const cart = engineSoundFor(VEHICLES['golf-cart']);
    const idle = voiceParams(cart, { revs: 0, load: 0, cond: conditionMix(cart), gate: 1, base: 1 });
    const full = voiceParams(cart, { revs: 1, load: 1, cond: conditionMix(cart), gate: 1, base: 1 });
    expect(idle.level).toBeLessThan(full.level * 0.3);
    expect(full.whineHz).toBeGreaterThan(idle.whineHz ?? 0);
    const zt = engineSoundFor(VEHICLES['zero-turn']);
    const coast = voiceParams(zt, { revs: 0.8, load: 0, cond: conditionMix(zt), gate: 1, base: 1 });
    const pull = voiceParams(zt, { revs: 0.8, load: 1, cond: conditionMix(zt), gate: 1, base: 1 });
    expect(pull.whine ?? 0).toBeGreaterThan(coast.whine ?? 0);
  });
});
