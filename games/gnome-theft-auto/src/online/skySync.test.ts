import { describe, expect, it, vi } from 'vitest';
import type { SkyNetRec, SkyTraffic } from '../skyTraffic/runtime';
import type { SkyBody } from '../skyTraffic/types';
import { SKY_BEHAVIOURS } from '../skyTraffic/behaviours';
import type { Vehicle } from '../types';
import type { SyncLink } from './hub';
import { createSkySync } from './skySync';
import { SYS } from './protocol';

function fakeSky(rec: SkyNetRec | null) {
  return {
    netList: vi.fn((): SkyNetRec[] => (rec ? [rec] : [])),
    setSpawning: vi.fn(),
    tearBanner: vi.fn(),
    adopt: vi.fn(() => true),
  };
}

function fakeLink(): SyncLink {
  return { command: vi.fn(), pay: vi.fn(), online: () => true, myId: () => 1 };
}

function makeRec(overrides: Partial<SkyNetRec> = {}): SkyNetRec {
  const body: SkyBody = { x: 12.3, y: 40, z: -7.5, yaw: 1, speed: 20, vy: 0, pitch: 0.1, roll: -0.2 };
  const v = { kind: 'plane', hp: 1 } as unknown as Vehicle;
  const bannerDef = SKY_BEHAVIOURS.findIndex((b) => b.banner);
  return {
    key: 7,
    id: SKY_BEHAVIOURS[bannerDef >= 0 ? bannerDef : 0].id,
    v,
    body,
    state: 'flying',
    adId: 'ad-1',
    banner: 1,
    ...overrides,
  };
}

function deps(sky: unknown) {
  return {
    sky: sky as unknown as SkyTraffic,
    scene: {} as never,
    fx: { spark: vi.fn(), explode: vi.fn() } as never,
    damage: vi.fn(),
  };
}

describe('skySync (pure parts)', () => {
  it('collect publishes the behaviour index, the banner flag and the advert', () => {
    const rec = makeRec();
    const sky = fakeSky(rec);
    const adapter = createSkySync(fakeLink(), deps(sky));
    expect(adapter.sys).toBe(SYS.sky);

    const out: { id: number; rec: number[]; str?: string }[] = [];
    adapter.collect(out as never, {} as never);
    expect(out).toHaveLength(1);
    const e = out[0];
    expect(e.id).toBe(7);
    expect(e.rec[0]).toBe(7);
    expect(e.rec[1]).toBe(SKY_BEHAVIOURS.findIndex((b) => b.id === rec.id));
    expect(e.rec[11]).toBe(1);
    expect(e.str).toBe('ad-1');
    expect(e.rec.every((n) => Number.isInteger(n))).toBe(true);
  });

  it('collect skips wrecks', () => {
    const sky = fakeSky(makeRec({ state: 'wreck' }));
    const adapter = createSkySync(fakeLink(), deps(sky));
    const out: unknown[] = [];
    adapter.collect(out as never, {} as never);
    expect(out).toHaveLength(0);
  });

  it('a command 2 tears the banner of the aircraft with that id', () => {
    const sky = fakeSky(makeRec());
    const adapter = createSkySync(fakeLink(), deps(sky));
    adapter.command?.(3, 7, 2, []);
    expect(sky.tearBanner).toHaveBeenCalledWith(7);
  });

  it('a command 1 damages the aircraft with the given amount', () => {
    const rec = makeRec();
    const dp = deps(fakeSky(rec));
    const adapter = createSkySync(fakeLink(), dp);
    adapter.command?.(3, 7, 1, [15]);
    expect(dp.damage).toHaveBeenCalledWith(rec.v, 0.15);
  });

  it('reset restores local spawning', () => {
    const sky = fakeSky(makeRec());
    const adapter = createSkySync(fakeLink(), deps(sky));
    adapter.reset();
    expect(sky.setSpawning).toHaveBeenCalledWith(true);
  });
});
