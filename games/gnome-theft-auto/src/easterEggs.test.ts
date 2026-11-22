import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  BIOMES,
  GNOMA_TRUCK,
  VEHICLES,
  VIEW,
  WORLD_HALF,
  biomeAt,
  type BiomeId,
} from './config';
import {
  COLLECTIBLES_KEY,
  GOLDEN_ACORN_SPOTS,
  HOA_SIGN_SPOTS,
  STOPPING_SHARD_SPOTS,
  createEasterEggs,
  loadCollected,
  saveCollected,
  type CollectedSave,
} from './easterEggs';
import type { Hud, Player, Vehicle, World } from './types';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function makeStubHud() {
  const toasts: string[] = [];
  const hud: Hud = {
    setWorld: vi.fn(),
    set: vi.fn(),
    toast: (text: string) => {
      toasts.push(text);
    },
    banner: vi.fn(),
    setObjective: vi.fn(),
    setVisible: vi.fn(),
  };
  return { hud, toasts };
}

function makeStubWorld(): World {
  return {
    boxes: [],
    roads: { nodes: [], laneOffset: 2.5 },
    walkPoints: [],
    spawn: { x: 0, z: 0, yaw: 0 },
    hospital: { x: 30, z: 30, yaw: 0 },
    parked: [],
    base: { minX: 340, maxX: 408, minZ: -34, maxZ: 34, padX: 358, padZ: -8, gateX: 374, gateZ: 34, guardPosts: [] },
    half: WORLD_HALF,
    biomeAt,
    airfield: { x: 480, z: -110, yaw: Math.PI / 2, length: 170, width: 18, planeSpots: [] },
    update: vi.fn(),
  };
}

function makeStubPlayer(x = 0, z = 0): Player {
  return {
    x,
    y: 0,
    z,
    yaw: 0,
    vy: 0,
    grounded: true,
    health: 1,
    vehicle: null,
    seat: 0,
    model: {} as Player['model'],
    updateFoot: vi.fn(),
    updateRiding: vi.fn(),
    enter: vi.fn(),
    exit: vi.fn(),
    hurt: vi.fn(),
    respawn: vi.fn(),
    airborne: false,
    chute: 0,
    bail: vi.fn(),
    updateAir: vi.fn(),
    hand: vi.fn() as unknown as Player['hand'],
    muzzle: vi.fn() as unknown as Player['muzzle'],
  };
}

function makeStubVehicle(x: number, z: number, speed: number): Vehicle {
  return {
    id: 1,
    kind: 'zero-turn',
    spec: VEHICLES['zero-turn'],
    x,
    y: 0,
    z,
    yaw: 0,
    speed,
    vy: 0,
    driver: 'player',
    tint: 0xd8342c,
    object: new THREE.Group(),
    rider: null,
    riderLook: null,
    wheelSpin: 0,
    steerVis: 0,
    hp: 1,
    damage: 0,
    lastHit: 0,
  };
}

describe('collectible spot definitions', () => {
  const limit = WORLD_HALF - 10;

  it('has exact required counts for Golden Acorns, Stopping-Stone Shards, and HOA Signs', () => {
    expect(GOLDEN_ACORN_SPOTS).toHaveLength(25);
    expect(STOPPING_SHARD_SPOTS).toHaveLength(10);
    expect(HOA_SIGN_SPOTS).toHaveLength(15);
  });

  it('has unique IDs and coordinates within [-WORLD_HALF + 10, WORLD_HALF - 10]', () => {
    for (const list of [GOLDEN_ACORN_SPOTS, STOPPING_SHARD_SPOTS, HOA_SIGN_SPOTS]) {
      const ids = new Set(list.map((s) => s.id));
      expect(ids.size).toBe(list.length);
      for (const spot of list) {
        expect(spot.id.trim().length).toBeGreaterThan(0);
        expect(spot.x).toBeGreaterThanOrEqual(-limit);
        expect(spot.x).toBeLessThanOrEqual(limit);
        expect(spot.z).toBeGreaterThanOrEqual(-limit);
        expect(spot.z).toBeLessThanOrEqual(limit);
      }
    }
  });

  it('spreads Golden Acorns across all 5 biomes with at least 2 inside Biscuit\'s Nap crater', () => {
    const biomes = new Set<BiomeId>(GOLDEN_ACORN_SPOTS.map((s) => biomeAt(s.x, s.z)));
    for (const b of BIOMES) {
      expect(biomes.has(b)).toBe(true);
    }

    const inBiscuitsNap = GOLDEN_ACORN_SPOTS.filter(
      (s) => Math.hypot(s.x - 80, s.z - 380) <= 24,
    );
    expect(inBiscuitsNap.length).toBeGreaterThanOrEqual(2);
  });
});

describe('loadCollected & saveCollected', () => {
  it('round-trips collected IDs through an in-memory Storage mock', () => {
    const storage = createMemoryStorage();
    expect(loadCollected(storage)).toEqual({ acorns: [], shards: [], signs: [] });

    const sample: CollectedSave = {
      acorns: ['acorn-city-1', 'acorn-farm-1'],
      shards: ['shard-3'],
      signs: ['sign-1', 'sign-8'],
    };
    saveCollected(sample, storage);

    expect(storage.getItem(COLLECTIBLES_KEY)).not.toBeNull();
    expect(loadCollected(storage)).toEqual(sample);
  });

  it('falls back to empty arrays on corrupted or non-array storage payloads', () => {
    const storage = createMemoryStorage();
    storage.setItem(COLLECTIBLES_KEY, '{not-json');
    expect(loadCollected(storage)).toEqual({ acorns: [], shards: [], signs: [] });

    storage.setItem(COLLECTIBLES_KEY, JSON.stringify({ acorns: [123, 'acorn-city-1', 'acorn-city-1'], shards: null }));
    expect(loadCollected(storage)).toEqual({ acorns: ['acorn-city-1'], shards: [], signs: [] });
  });
});

describe('createEasterEggs interactive triggers & collectibles', () => {
  it('heals on foot and toasts on vehicle bump at Gnoma\'s Food Truck with cooldowns', () => {
    const scene = new THREE.Scene();
    const { hud, toasts } = makeStubHud();
    const eggs = createEasterEggs(scene, makeStubWorld(), hud, vi.fn());
    const player = makeStubPlayer(GNOMA_TRUCK.x + 2, GNOMA_TRUCK.z);
    player.health = 0.35;

    eggs.update(0.1, player, []);
    expect(player.health).toBe(1);
    expect(toasts).toContain('Gnoma: "Acorn-Flour Cake! Clay restored!"');

    // Cooldown prevents immediate re-trigger.
    player.health = 0.5;
    eggs.update(0.1, player, []);
    expect(player.health).toBe(0.5);

    // Vehicle bump at speed > 3 within 4.5 units.
    const veh = makeStubVehicle(GNOMA_TRUCK.x, GNOMA_TRUCK.z + 3, 6);
    player.vehicle = veh;
    eggs.update(0.1, player, [veh]);
    expect(toasts).toContain('Gnoma: "Oops, a little wobbly! We learn from it!"');
  });

  it('launches vehicles at the Aether Board Ley-Line Ramp and sets sim velocity when present', () => {
    const scene = new THREE.Scene();
    const { hud, toasts } = makeStubHud();
    const eggs = createEasterEggs(scene, makeStubWorld(), hud, vi.fn());
    const veh = makeStubVehicle(40, -540, 15);
    const bodyVel = { x: 0, y: 0, z: 0 };
    veh.sim = {
      ctrl: { body: { vel: bodyVel } },
    } as unknown as Vehicle['sim'];
    const player = makeStubPlayer(40, -540);
    player.vehicle = veh;

    eggs.update(0.1, player, [veh]);
    expect(veh.vy).toBeGreaterThanOrEqual(11);
    expect(bodyVel.y).toBeGreaterThanOrEqual(11);
    expect(toasts).toContain('Aether Ley-Line! +Zero-G Trick!');
  });

  it('dims fog at Tall House Porch and restores toward VIEW.fogFar when leaving', () => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8fd0f2, VIEW.fogNear, VIEW.fogFar);
    const { hud, toasts } = makeStubHud();
    const eggs = createEasterEggs(scene, makeStubWorld(), hud, vi.fn());
    const player = makeStubPlayer(-560, 40);

    eggs.update(0.2, player, []);
    expect((scene.fog as THREE.Fog).far).toBeLessThan(VIEW.fogFar);
    expect(toasts).toContain('"Don\'t look at the lantern."');

    const dimmedFar = (scene.fog as THREE.Fog).far;
    player.x = 0;
    player.z = 0;
    eggs.update(0.2, player, []);
    expect((scene.fog as THREE.Fog).far).toBeGreaterThan(dimmedFar);
  });

  it('toasts at Gnorwin Clayfoot Statue and Old Combine in the Dust Flats', () => {
    const scene = new THREE.Scene();
    const { hud, toasts } = makeStubHud();
    const eggs = createEasterEggs(scene, makeStubWorld(), hud, vi.fn());
    const player = makeStubPlayer(-30, 30);

    eggs.update(0.1, player, []);
    expect(toasts).toContain('Gnorwin Clayfoot Statue — Graffiti: "EVEN CUT WAS HERE"');

    // Old Combine starts at (520, -180) and loops across x: 320..520, z: -180.
    player.x = 515;
    player.z = -180;
    eggs.update(0.05, player, []);
    expect(toasts).toContain('Old Combine: "...hum..."');
  });

  it('awards +100/+200 for Golden Acorns, +150 for Shards, +50 for smashed HOA signs, and updates counts/blips', () => {
    const scene = new THREE.Scene();
    const { hud } = makeStubHud();
    const rewards: { amount: number; reason?: string }[] = [];
    const eggs = createEasterEggs(scene, makeStubWorld(), hud, (amount, reason) => {
      rewards.push({ amount, reason });
    });

    expect(eggs.counts()).toEqual({ acorns: 0, shards: 0, signs: 0 });
    expect(eggs.blips()).toHaveLength(50);

    // Normal Golden Acorn (+100).
    const normalAcorn = GOLDEN_ACORN_SPOTS.find((s) => Math.hypot(s.x - 80, s.z - 380) > 24)!;
    const player = makeStubPlayer(normalAcorn.x, normalAcorn.z);
    eggs.update(0.05, player, []);
    expect(rewards.at(-1)?.amount).toBe(100);

    // Biscuit's Nap Golden Acorn (+200).
    const biscuitAcorn = GOLDEN_ACORN_SPOTS.find((s) => Math.hypot(s.x - 80, s.z - 380) <= 24)!;
    player.x = biscuitAcorn.x;
    player.z = biscuitAcorn.z;
    eggs.update(0.05, player, []);
    expect(rewards.at(-1)?.amount).toBe(200);

    // Stopping-Stone Shard (+150).
    const shard = STOPPING_SHARD_SPOTS[0];
    player.x = shard.x;
    player.z = shard.z;
    eggs.update(0.05, player, []);
    expect(rewards.at(-1)?.amount).toBe(150);

    // HOA Foreclosure Sign requires a moving vehicle (|speed| > 4).
    const sign = HOA_SIGN_SPOTS[0];
    player.x = sign.x;
    player.z = sign.z;
    eggs.update(0.05, player, []);
    expect(eggs.counts().signs).toBe(0);

    const veh = makeStubVehicle(sign.x, sign.z, 8);
    player.vehicle = veh;
    eggs.update(0.05, player, [veh]);
    expect(rewards.at(-1)?.amount).toBe(50);

    expect(eggs.counts()).toEqual({ acorns: 2, shards: 1, signs: 1 });
    expect(eggs.blips()).toHaveLength(46);
  });
});
