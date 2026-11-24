// Determinism of the static world (online play): two builds of every static part, each in a fresh module graph and with
// Math.random, Date.now and performance.now returning different values, must produce identical text. Every client builds
// the same world without messages, so anything that reads a clock or an unseeded random number, or iterates a Set/Map
// built from something unordered, shows up here as a difference. A failing key names the first differing line.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

type Lines = Record<string, string[]>;

/** A small seeded generator (mulberry32) for the faked Math.random. */
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

/** Numbers rounded to two decimals; everything else is printed as it is (nested objects and arrays included). */
function fmt(v: unknown): string {
  if (typeof v === 'number') return v.toFixed(2);
  if (Array.isArray(v)) return `[${v.map(fmt).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.entries(v).map(([k, x]) => `${k}:${fmt(x)}`).join(',')}}`;
  return String(v);
}

/** One line per record: `key=value` pairs in insertion order. */
function line(o: object): string {
  return Object.entries(o).map(([k, v]) => `${k}=${fmt(v)}`).join(' ');
}

/** Runs one builder; if it throws, records `<name>-error` instead of failing the whole build. */
function step<T>(out: Lines, name: string, fn: () => T): T | undefined {
  try {
    return fn();
  } catch (e) {
    out[`${name}-error`] = [e instanceof Error ? e.message : String(e)];
    return undefined;
  }
}

async function buildOnce(seed: number): Promise<Lines> {
  vi.resetModules();
  const { installFakeDom } = await import('../testing/fakeDom');
  installFakeDom();
  const gen = mulberry32(seed);
  const spies = [
    vi.spyOn(Math, 'random').mockImplementation(gen),
    vi.spyOn(Date, 'now').mockReturnValue(1.7e12 + seed * 1e6),
    vi.spyOn(performance, 'now').mockReturnValue(seed * 12345.678),
  ];
  const out: Lines = {};
  try {
    const { beginPlantHarvest, drainHarvest } = await import('../flora/harvest');
    const { buildWorld } = await import('../world');
    const { installSkyways } = await import('../highways/install');
    const { buildLockupMarking } = await import('../lockup/marking');
    const { buildStageSets } = await import('../stageSets');
    const { buildTown } = await import('../outskirts/build');
    const { buildEstates } = await import('../lockup/estates');
    const { installCityDressing } = await import('../cityScenery/install');
    const { spawnAirfieldCraft } = await import('../craft/spawns');
    const { planParked, parkLegally } = await import('../fleet');
    const { SPAWN } = await import('../config');
    const { worldParkingGround } = await import('../fleetRuntime');
    const { mulberry32: levelRng } = await import('@lawn/level');
    const { spawnPlan } = await import('../hunting/hunting');

    beginPlantHarvest();
    const scene = new THREE.Scene();
    const world = buildWorld(scene, null as unknown as THREE.WebGLRenderer);
    installSkyways(scene, world);
    world.boxes.push(...buildLockupMarking(scene));
    buildStageSets(scene, world.boxes);
    const town = step(out, 'town', () => buildTown(scene));
    if (town) world.boxes.push(...town.boxes);
    world.boxes.push(...buildEstates(scene).boxes);
    installCityDressing(scene, world);
    const craft = spawnAirfieldCraft(scene, world, []);
    const seeds = drainHarvest();

    const rng = levelRng(0x9a7c0);
    const parkedPlans = parkLegally(
      planParked(world.parked, SPAWN, rng).map((plan) => ({ ...plan.spot, kind: plan.entry ? plan.entry.kind : plan.spot.kind, plan })),
      worldParkingGround(world),
    );
    // Control: the unseeded deal (what app.ts did before the audit) must differ between the builds, or the faked
    // Math.random is not reaching the builders and every check above proves nothing.
    out.control = planParked(world.parked, SPAWN).map((p) => `${p.entry ? p.entry.id : '-'} ${p.tint}`);
    const hunting = step(out, 'hunting', () => spawnPlan(world, mulberry32(0x5eed)));

    out.boxes = world.boxes.map((b) => line(b));
    scene.updateMatrixWorld(true);
    const sceneLines: string[] = [];
    scene.traverse((o) => {
      const g = o as unknown as { isMesh?: boolean; isPoints?: boolean; isLineSegments?: boolean; isInstancedMesh?: boolean; geometry?: unknown; count?: number; instanceMatrix?: { array: ArrayLike<number> } };
      if (!(g.isMesh || g.isPoints || g.isLineSegments || g.isInstancedMesh) || !g.geometry) return;
      const m = o.matrixWorld.elements.map((v) => v.toFixed(2)).join(',');
      const count = g.isInstancedMesh ? (g.count ?? 1) : 1;
      let sum = 0;
      if (g.isInstancedMesh && g.instanceMatrix) for (let i = 0; i < g.instanceMatrix.array.length; i++) sum += g.instanceMatrix.array[i];
      sceneLines.push(`${o.type}|${o.name}|${m}|${count}|${sum.toFixed(2)}`);
    });
    out.scene = sceneLines;
    out.roads = [
      ...world.roads.nodes.map((n) => `node ${line(n)}`),
      `laneOffset=${fmt(world.roads.laneOffset)}`,
      ...(('edges' in world.roads) ? ((world.roads as unknown as { edges: unknown[] }).edges.map((e) => `edge ${fmt(e)}`)) : []),
    ];
    out.parked = parkedPlans.map((p) => `kind=${p.kind} entry=${p.plan.entry ? p.plan.entry.id : '-'} tint=${p.plan.tint} x=${fmt(p.x)} z=${fmt(p.z)} yaw=${fmt(p.yaw)}`);
    out.craft = craft.map((v) => `kind=${v.kind} x=${fmt(v.x)} z=${fmt(v.z)} yaw=${fmt(v.yaw)}`);
    out.plants = seeds.map((s) => `id=${s.p.id} kind=${s.kind} x=${fmt(s.x)} z=${fmt(s.z)}`);
    if (hunting) out.hunting = hunting.map((q) => line({ ...q, species: q.species.id }));
  } finally {
    for (const s of spies) s.mockRestore();
  }
  return out;
}

let a: Lines = {};
let b: Lines = {};

beforeAll(async () => {
  a = await buildOnce(1);
  b = await buildOnce(2);
}, 600_000);

describe('static world is deterministic across clients', () => {
  it('builds the same key set in both builds', () => {
    expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
  });

  for (const key of ['boxes', 'scene', 'roads', 'parked', 'craft', 'plants', 'hunting', 'town']) {
    it(`${key} is identical in both builds`, () => {
      const x = a[key] ?? [];
      const y = b[key] ?? [];
      expect(y.length, `${key} length`).toBe(x.length);
      for (let i = 0; i < x.length; i++) {
        expect(y[i], `${key}[${i}]`).toBe(x[i]);
      }
    });
  }

  it('the control (unseeded parked deal) differs, so the faked randomness reaches the builders', () => {
    expect(b.control.join(';')).not.toBe(a.control.join(';'));
  });

  it('reports builder errors', () => {
    const errs = [...Object.keys(a), ...Object.keys(b)].filter((k) => k.endsWith('-error'));
    expect(errs, errs.map((k) => `${k}: ${(a[k] ?? b[k])?.[0]}`).join('\n')).toEqual([]);
  });
});
