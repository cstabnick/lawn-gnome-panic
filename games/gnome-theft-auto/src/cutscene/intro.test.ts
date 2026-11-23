// Every shot of the first-time intro flyover must pass the line-of-sight and collision check against the real world.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

describe('intro flyover', () => {
  it('every shot passes against the real world', async () => {
    installFakeDom();
    // audio.ts (loaded through the vehicle modules) listens on window at import time: a no-op stand-in is enough here.
    const g = globalThis as Record<string, unknown>;
    if (!g.window) g.window = { addEventListener() {}, removeEventListener() {} };
    // Loaded after the stand-ins are in place (the game's modules expect a browser at import time).
    const cfg = await import('../config');
    const { buildWorld } = await import('../world');
    const { introScript } = await import('./intro');
    const { checkScript, formatIssues } = await import('./check');
    const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    const issues = checkScript(introScript(cfg.SPAWN), world.boxes);
    expect(formatIssues('intro', issues)).toBe('intro: all shots pass');
  }, 120_000);
});
