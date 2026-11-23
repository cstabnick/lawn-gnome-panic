// Regression: "driving into water crashes the game". checkSink clears v.sim on the frame a physics-driven mower sinks,
// and app.ts used to read v.sim.ctrl.telemetry right after it: a TypeError that stopped the frame loop (the game froze).
import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import { checkSink } from './swim';
import { heightAt, waterAt } from './terrain';
import type { Vehicle } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

// node:fs is loaded untyped: the game's tsconfig has no node types.
const NODE_FS = 'node:fs';
type Fs = { readFileSync(p: URL, enc: 'utf8'): string };

describe('sinking with the physics drive', () => {
  it('checkSink clears v.sim in deep water (so callers must keep their own reference)', () => {
    const w = waterAt(-700, -680);
    expect(w).not.toBeNull();
    const v = {
      id: 1, kind: 'ride-on', spec: VEHICLES['ride-on'], x: -700, y: heightAt(-700, -680), z: -680, yaw: 0, speed: 5, vy: 0,
      driver: 'player', sim: { ctrl: {} } as never, hp: 1, damage: 0, lastHit: 0,
    } as unknown as Vehicle;
    expect(checkSink(v)).toBe(true);
    expect(v.sim).toBeUndefined();
  });

  it('app.ts never reads v.sim.ctrl in the driving step (it reads the chassis it kept before checkSink)', async () => {
    const fs = (await import(/* @vite-ignore */ NODE_FS)) as Fs;
    const src = fs.readFileSync(new URL('./app.ts', import.meta.url), 'utf8');
    const step = src.slice(src.indexOf('else if (v.sim) {'), src.indexOf('if (v.sunk && v.driver === \'player\')'));
    expect(step.length).toBeGreaterThan(0);
    expect(step).toContain('checkSink(v)');
    expect(step).not.toMatch(/v\.sim\.ctrl/);
  });
});
