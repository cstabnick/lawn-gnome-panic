// attachLoadout lifecycle: the shell, the wheels, ride height, camber, lights, damage rebuilds, dispose. Run: npx vitest run packages/glaze/src/attach.test.ts
import * as THREE from 'three';
import { setPrefabDamage } from '@lawn/prefabs';
import { describe, expect, it } from 'vitest';
import { RIDE_TRAVEL, attachLoadout, buildGlazeBody } from './attach';
import { defineMounts, deriveMounts } from './mounts';

/** The ride-on mower's biggest wheel has radius 0.275, so a full slam drops the body 0.2 of that. */
const DOWN = 0.2 * 0.275;
import { defaultLoadout } from './loadout';

const PREFAB = 'ride-on-mower';
const SCALE = 1.5;
const stock = defaultLoadout(0xd8342c);

const shellsIn = (root: THREE.Object3D) => root.children.filter((c) => c.name === 'glaze-shell');
const groundsIn = (root: THREE.Object3D) => root.children.filter((c) => c.name === 'glaze-ground');
const wheelsIn = (root: THREE.Object3D) => root.children.filter((c) => /^wheel-\d$/.test(c.name));

/** Every mesh and light under `root`, sorted: its path, visibility, material colour and transform relative to `root`, to 4 decimals. */
function signature(root: THREE.Object3D): string[] {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const out: string[] = [];
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) && !(o instanceof THREE.Light)) return;
    const path: string[] = [];
    for (let p: THREE.Object3D | null = o; p && p !== root; p = p.parent) path.unshift(p.name || p.type);
    const m = o.matrixWorld.clone().premultiply(inv).elements.map((x) => (Math.abs(x) < 5e-5 ? 0 : x).toFixed(4)).join(',');
    const mats = o instanceof THREE.Mesh ? ([] as THREE.Material[]).concat(o.material) : [];
    const col = mats.map((mt) => (mt as THREE.MeshStandardMaterial).color?.getHexString() ?? mt.type).join('|');
    out.push(`${path.join('/')} ${o.visible} ${col} ${m}`);
  });
  return out.sort();
}

function tintCount(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.userData.tint === true) n++;
  });
  return n;
}

describe('attachLoadout', () => {
  it('wraps the body in one shell and keeps the four wheel pivots on the root', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const shells = shellsIn(body);
    expect(shells).toHaveLength(1);
    const wheels = wheelsIn(body);
    expect(wheels).toHaveLength(4);
    for (const wheel of wheels) {
      expect(wheel.parent).toBe(body);
      expect(shells[0].children).not.toContain(wheel);
    }
    expect(rig.seatLift).toBe(0);
  });

  it('moves the shell by the ride height and reports the seat lift in parent space', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    rig.set({ ...stock, rideHeight: -1 });
    expect(shellsIn(body)[0].position.y).toBeCloseTo(-DOWN, 5);
    expect(rig.seatLift).toBeCloseTo(-DOWN * SCALE, 5);
    rig.set({ ...stock, rideHeight: 1 });
    expect(shellsIn(body)[0].position.y).toBe(RIDE_TRAVEL.up);
    expect(rig.seatLift).toBe(RIDE_TRAVEL.up * SCALE);
  });

  it('returns camber in radians per axle, and 0 for any other index', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, { ...stock, camberFront: -10, camberRear: 4 });
    expect(rig.camberOf(2)).toBe(-10 * Math.PI / 180);
    expect(rig.camberOf(3)).toBe(-10 * Math.PI / 180);
    expect(rig.camberOf(0)).toBe(4 * Math.PI / 180);
    expect(rig.camberOf(1)).toBe(4 * Math.PI / 180);
    expect(rig.camberOf(9)).toBe(0);
  });

  it('keeps one stable lights group through set and damage, and keeps its visibility', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const lights = rig.lights;
    expect(lights.visible).toBe(false);
    rig.set({ ...stock, rideHeight: 0.5 });
    expect(rig.lights).toBe(lights);
    setPrefabDamage(body, 1);
    rig.apply();
    expect(rig.lights).toBe(lights);
    rig.setLightsOn(true);
    expect(lights.visible).toBe(true);
    rig.apply();
    expect(lights.visible).toBe(true);
  });

  it('applied twice leaves no duplicate shell or ground group', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const tints = tintCount(body);
    rig.apply();
    rig.apply();
    expect(shellsIn(body)).toHaveLength(1);
    expect(groundsIn(body).length).toBeLessThanOrEqual(1);
    expect(tintCount(body)).toBe(tints);
  });

  it('after a damage rebuild the wheels are on the root again and the shell exists once', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    setPrefabDamage(body, 2);
    rig.apply();
    const wheels = wheelsIn(body);
    expect(wheels.length).toBeGreaterThan(0);
    for (const wheel of wheels) {
      expect(wheel.parent).toBe(body);
      expect(shellsIn(body)[0].children).not.toContain(wheel);
    }
    expect(shellsIn(body)).toHaveLength(1);
  });

  it('dispose leaves no shell and puts every original child back under the root', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const originals = [...body.children];
    const tints = tintCount(body);
    const rig = attachLoadout(body, PREFAB, { ...stock, rideHeight: -1 });
    rig.dispose();
    expect(shellsIn(body)).toHaveLength(0);
    expect(groundsIn(body)).toHaveLength(0);
    expect(rig.lights.parent).toBeNull();
    for (const child of originals) expect(child.parent).toBe(body);
    expect(tintCount(body)).toBe(tints);
  });

  it('a camber-only change does not rebuild the rig', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const shell = body.children.find((c) => c.name === 'glaze-shell');
    rig.set({ ...stock, camberFront: -10, camberRear: -5 });
    expect(body.children.find((c) => c.name === 'glaze-shell')).toBe(shell);
    expect(shell!.parent).toBe(body);
    expect(rig.camberOf(2)).toBeCloseTo(-10 * Math.PI / 180, 9);
  });

  it('keeps every tinted mesh through set, so nothing is lost in the unwrap', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const before = tintCount(body);
    const rig = attachLoadout(body, PREFAB, stock);
    expect(tintCount(body)).toBe(before);
    rig.set({ ...stock, rideHeight: 1, camberFront: -5 });
    expect(tintCount(body)).toBe(before);
  });

  it('setSuspension moves the shell up with heave and moves the seat with it', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    rig.setSuspension({ heave: 0.05, pitch: 0, roll: 0 });
    expect(shellsIn(body)[0].position.y).toBeCloseTo(0.05, 5);
    expect(rig.seatLift).toBeCloseTo(0.05 * SCALE, 5);
    rig.set({ ...stock, rideHeight: -1 });
    expect(shellsIn(body)[0].position.y).toBeCloseTo(-DOWN + 0.05, 5);
    expect(rig.seatLift).toBeCloseTo((-DOWN + 0.05) * SCALE, 5);
  });

  it('pitch and roll tilt the shell (not the seat) and zeros restore the stock pose', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const shell = shellsIn(body)[0];
    const seatBefore = rig.seatLift;
    rig.setSuspension({ heave: 0, pitch: 0.08, roll: -0.05 });
    expect(shell.rotation.x).toBeCloseTo(-0.08, 5);
    expect(shell.rotation.z).toBeCloseTo(-0.05, 5);
    expect(rig.seatLift).toBe(seatBefore);
    rig.setSuspension({ heave: 0, pitch: 0, roll: 0 });
    expect(shell.rotation.x).toBeCloseTo(0, 5);
    expect(shell.rotation.z).toBeCloseTo(0, 5);
    expect(shell.position.y).toBe(0);
    expect(rig.seatLift).toBe(0);
  });

  it('apply() keeps the stored suspension on the rebuilt shell', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    rig.setSuspension({ heave: 0.03, pitch: -0.04, roll: 0.02 });
    rig.set({ ...stock, rideHeight: 0.5 });
    const shell = shellsIn(body)[0];
    expect(shell.position.y).toBeCloseTo(RIDE_TRAVEL.up * 0.5 + 0.03, 5);
    expect(shell.rotation.x).toBeCloseTo(0.04, 5);
    expect(shell.rotation.z).toBeCloseTo(0.02, 5);
    setPrefabDamage(body, 1);
    rig.apply();
    expect(shellsIn(body)[0].rotation.z).toBeCloseTo(0.02, 5);
    expect(shellsIn(body)).toHaveLength(1);
  });

  it('re-applying never stacks the ride offset or suspension tilt onto the body parts (slider drag, paint change)', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const parts = [...shellsIn(body)[0].children];
    const local = new Map(parts.map((p) => [p, p.position.clone()]));
    const rot = new Map(parts.map((p) => [p, p.quaternion.clone()]));
    const shellWorldY = (p: THREE.Object3D) => {
      body.updateMatrixWorld(true);
      return new THREE.Vector3().setFromMatrixPosition(p.matrixWorld).y;
    };
    const probe = parts[0];
    const y0 = shellWorldY(probe);
    // A drag: every slider step re-applies the whole loadout, with the body springing in between.
    for (let r = -1; r <= 1.0001; r += 0.05) {
      rig.setSuspension({ heave: 0.02, pitch: 0.05, roll: -0.03 });
      rig.set({ ...stock, rideHeight: +r.toFixed(2) });
    }
    rig.setSuspension({ heave: 0, pitch: 0, roll: 0 });
    rig.set({ ...stock, rideHeight: 0.5, paint: 0x00ff00 });
    for (const p of parts) {
      if (p.parent !== shellsIn(body)[0]) continue;
      expect(p.position.distanceTo(local.get(p)!)).toBeLessThan(1e-9);
      expect(p.quaternion.angleTo(rot.get(p)!)).toBeLessThan(1e-9);
    }
    expect(shellWorldY(probe) - y0).toBeCloseTo(RIDE_TRAVEL.up * 0.5 * SCALE, 5);
    rig.set(stock);
    expect(shellWorldY(probe)).toBeCloseTo(y0, 6);
    rig.dispose();
    for (const p of parts) if (p.parent === body) expect(p.position.distanceTo(local.get(p)!)).toBeLessThan(1e-9);
  });

  it('ride height alone moves one transform: no rebuild, the same parts and grips stay', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const shell = shellsIn(body)[0];
    const grips = rig.grips;
    const kids = [...shell.children];
    for (const r of [-1, -0.35, 0.4, 1, 0]) {
      rig.set({ ...stock, rideHeight: r });
      expect(shellsIn(body)[0]).toBe(shell);
      expect(shell.children).toEqual(kids);
      expect(rig.grips).toBe(grips);
      const { down, up } = rig.rideRange;
      expect(shell.position.y).toBeCloseTo(r < 0 ? r * down : r * up, 9);
    }
  });

  it('a registered ride range is the slider limits', () => {
    const id = 'snail-coach';
    defineMounts(id, { ride: { down: 0.05, up: 0.1 } });
    const body = buildGlazeBody(id, { scale: 1 });
    const rig = attachLoadout(body, id, { ...stock, rideHeight: -1 });
    expect(rig.rideRange).toEqual({ down: 0.05, up: 0.1 });
    expect(rig.seatLift).toBeCloseTo(-0.05, 9);
    rig.set({ ...stock, rideHeight: 0.5 });
    expect(rig.seatLift).toBeCloseTo(0.05, 9);
  });

  it('after a full drag and every other rebuild trigger, back to stock is identical to a fresh stock body (same parts, same transforms)', () => {
    const fresh = buildGlazeBody(PREFAB, { scale: SCALE });
    attachLoadout(fresh, PREFAB, stock);
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    // Dressed while standing far out in a world, turned, as the shop's stage does.
    const world = new THREE.Group();
    world.position.set(900, 2, -650);
    world.rotation.y = 2.2;
    world.add(body);
    const rig = attachLoadout(body, PREFAB, stock);
    for (let r = -1; r <= 1.0001; r += 0.05) {
      rig.setSuspension({ heave: 0.02, pitch: 0.05, roll: -0.03 });
      rig.set({ ...stock, rideHeight: +r.toFixed(2) });
    }
    rig.set({ ...stock, rideHeight: 0.6, wheelSize: 1.3, tyre: 'balloon', rim: 'spinner', paint: 0x2050ff, spoiler: 'picket', lamp: 'lantern' });
    rig.set({ ...stock, rideHeight: -0.4, camberFront: -6 });
    setPrefabDamage(body, 1);
    rig.apply();
    setPrefabDamage(body, 0);
    rig.apply();
    rig.setSuspension({ heave: 0, pitch: 0, roll: 0 });
    rig.set(stock);
    expect(signature(body)).toEqual(signature(fresh));
  });

  it('wheel pivots never move under suspension', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const rig = attachLoadout(body, PREFAB, stock);
    const pos = (w: THREE.Object3D) => [w.position.x, w.position.y, w.position.z];
    const before = wheelsIn(body).map(pos);
    rig.setSuspension({ heave: 0.1, pitch: 0.1, roll: -0.1 });
    wheelsIn(body).forEach((w, i) => {
      expect(pos(w)).toEqual(before[i]);
      expect(w.rotation.x).toBeCloseTo(0, 5);
    });
  });
});

describe('deriveMounts', () => {
  it('measures in prefab-local units wherever the body stands (a world-space box moved every derived fitting with the vehicle)', () => {
    const body = buildGlazeBody(PREFAB, { scale: SCALE });
    const ref = JSON.parse(JSON.stringify(deriveMounts(body))) as unknown;
    const world = new THREE.Group();
    world.position.set(500, 3, -200);
    world.rotation.y = 1.1;
    world.scale.setScalar(2);
    world.add(body);
    const placed = JSON.parse(JSON.stringify(deriveMounts(body))) as unknown;
    const close = (a: unknown, b: unknown): void => {
      if (typeof a === 'number') expect(a).toBeCloseTo(b as number, 6);
      else if (a && typeof a === 'object') for (const k of Object.keys(a)) close((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
      else expect(a).toEqual(b);
    };
    close(placed, ref);
  });
});
