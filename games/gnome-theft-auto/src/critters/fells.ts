// Frostbite Fells locals (snowmen, sgnowmes, really chill polar bears): issue 6E.
// Snowmen break when shot or driven through and are rebuilt overnight; sgnowmes wander their village and put their
// hands up; polar bears sit in deck chairs, and only ever shrug. Nothing dies, nothing is removed (R-021, R-049).
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { type Critter, type CritterRuntime, critterMesh, type RegionLife, openSpot } from '../critters';
import { clearHandsUp, gnomeState, makeGnome, poseHandsUp, randomGnomeName, randomTownLook } from '../gnomes';
import { heightAt, waterAt } from '../terrain';
import type { Box } from '../types';

const REGION = 'frostbite-fells' as const;
const SNOWMAN_CX = -120;
const SNOWMAN_CZ = -720;
const VILLAGE_CX = 160;
const VILLAGE_CZ = -720;
const DECK_CX = 330;
const DECK_CZ = -640;
/** Height of the bear-deck prefab's plank top above its base. */
const DECK_TOP = 0.25;

export const SNOWMAN_COUNT = 14;
const SNOWMAN_RISE_NIGHT = 0.6;
const SNOWMAN_REBUILD_S = 300;
const SMASH_EVENT_GAP = 60;
const SGNOWME_COUNT = 8;
const SGNOWME_RANGE = 20;
const SGNOWME_WALK = 1.4;
const SGNOWME_FLEE = 4;
const SGNOWME_SCARE_S = 5;
const SGNOWME_SIM_RADIUS = 190;
const BEAR_SHRUG_S = 1.6;
const BEAR_TOAST_GAP = 8;
const BEAR_EVENT_GAP = 60;

const SG_HATS = [0xf4f8ff, 0xbfe6ff, 0x9ec6de];
const SG_SHIRTS = [0xe6f2ff, 0xcfe3f5, 0x7fb2d9];

export const SGNOWME_LINES: readonly string[] = [
  'It is frost glaze, not snow. I do not melt.',
  'Mind the snowmen, we only just built them.',
  'Hands up, that is what the sign says. I am being polite.',
  'You have a very loud hat, friend. I mean that kindly.',
  'Frost makes you tough. It also makes you cold. Mostly cold.',
];

export const BEAR_SHRUGS: readonly string[] = [
  'The polar bear shrugs.',
  'The polar bear lowers its sunglasses, looks at you, and pushes them back up.',
  '"Whatever, little guy."',
  'The polar bear does not get up. It has nowhere to be.',
  'The polar bear shrugs again, slower this time.',
];

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** True when night has just come in: the light was below the rebuild threshold last frame and is at or past it now. */
export function nightRose(prev: number, now: number): boolean {
  return prev < SNOWMAN_RISE_NIGHT && now >= SNOWMAN_RISE_NIGHT;
}

/** A townsgnome in frost glaze: white or ice-blue hat, pale clothes, a white beard most of the time, an icicle scarf if the prefab exists. */
export function sgnowmeLook(): GnomeLook {
  const look: GnomeLook = {
    ...randomTownLook(),
    hat: pick(SG_HATS),
    shirt: pick(SG_SHIRTS),
    pants: 0xdfe9f2,
    skin: 0xf4f8fb,
    beard: Math.random() < 0.7 ? 0xffffff : null,
    hair: null,
    dress: false,
  };
  if (getPrefab('icicle-scarf')) look.equipment = { neck: 'icicle-scarf' };
  return look;
}

interface Snowman { mesh: THREE.Group; x: number; z: number; smashed: boolean; smashedAt: number }
interface Sgnowme {
  model: GnomeModel; x: number; z: number; yaw: number; goalX: number; goalZ: number;
  idleT: number; scaredT: number; name: string;
}
interface FellsState {
  t: number; lastNight: number; lastSmashEvent: number; lastBearEvent: number;
  deckTop: number; snowmen: Snowman[]; sgnowmes: Sgnowme[]; cabins: Box[]; bears: Critter[]; village: { x: number; z: number };
}

// Per-runtime state: the RegionLife object is a shared constant, so a runtime's own state is kept by key.
const states = new WeakMap<CritterRuntime, FellsState>();

function inCabin(x: number, z: number, cabins: readonly Box[]): boolean {
  return cabins.some((b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
}

function blocked(x: number, z: number, cabins: readonly Box[]): boolean {
  return inCabin(x, z, cabins) || !!waterAt(x, z);
}

function pickGoal(s: Sgnowme, st: FellsState): void {
  for (let i = 0; i < 30; i++) {
    const r = SGNOWME_RANGE * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    const gx = st.village.x + Math.cos(a) * r, gz = st.village.z + Math.sin(a) * r;
    if (!blocked(gx, gz, st.cabins)) { s.goalX = gx; s.goalZ = gz; return; }
  }
  s.goalX = s.x;
  s.goalZ = s.z;
}

function smashSnowman(rt: CritterRuntime, st: FellsState, s: Snowman): void {
  s.smashed = true;
  s.smashedAt = st.t;
  s.mesh.visible = false;
  rt.deps.fx.smash?.(s.x, heightAt(s.x, s.z) + 1.2, s.z, 0xffffff);
  rt.deps.play('smash');
  rt.deps.earn(2, 'Snowman');
  if (st.t - st.lastSmashEvent >= SMASH_EVENT_GAP) {
    st.lastSmashEvent = st.t;
    rt.deps.event('snowman-smashed');
  }
}

function scareSgnowme(rt: CritterRuntime, s: Sgnowme, toast: boolean): void {
  s.scaredT = SGNOWME_SCARE_S;
  if (toast && Math.random() < 0.5) rt.deps.toast(`${s.name}: "${pick(SGNOWME_LINES)}"`);
}

function shrugBear(c: Critter): void {
  c.data.shrugT = BEAR_SHRUG_S;
}

export const fellsLife: RegionLife = {
  id: 'frostbite-fells',
  groups: [],

  init(rt) {
    const st: FellsState = {
      t: 0, lastNight: 0, lastSmashEvent: -Infinity, lastBearEvent: -Infinity,
      deckTop: 0, snowmen: [], sgnowmes: [], cabins: [], bears: [], village: { x: VILLAGE_CX, z: VILLAGE_CZ },
    };
    states.set(rt, st);

    // 1. Snowman field: a jittered 4 x 4 grid, 6 apart, two cells skipped.
    const field = openSpot(SNOWMAN_CX, SNOWMAN_CZ, 1, REGION, rt.world) ?? { x: SNOWMAN_CX, z: SNOWMAN_CZ };
    const cells: [number, number][] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cells.push([i, j]);
    for (let k = cells.length - 1; k > 0; k--) {
      const m = Math.floor(Math.random() * (k + 1));
      [cells[k], cells[m]] = [cells[m], cells[k]];
    }
    for (const [i, j] of cells.slice(0, SNOWMAN_COUNT)) {
      const x = field.x + (i - 1.5) * 6 + (Math.random() - 0.5) * 1.2;
      const z = field.z + (j - 1.5) * 6 + (Math.random() - 0.5) * 1.2;
      const mesh = buildPrefab('snowman', { scale: 1.3, lights: false });
      mesh.position.set(x, heightAt(x, z), z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      rt.scene.add(mesh);
      st.snowmen.push({ mesh, x, z, smashed: false, smashedAt: 0 });
    }

    // 2. Sgnowme village: four log cabins facing the centre, each with a collider.
    const village = openSpot(VILLAGE_CX, VILLAGE_CZ, 12, REGION, rt.world) ?? { x: VILLAGE_CX, z: VILLAGE_CZ };
    st.village = village;
    for (const [ox, oz] of [[-14, -12], [14, -12], [-14, 12], [14, 12]] as const) {
      const x = village.x + ox, z = village.z + oz;
      const cabin = buildPrefab('log-cabin', { scale: 4, lights: false });
      cabin.position.set(x, heightAt(x, z), z);
      cabin.rotation.y = Math.atan2(village.x - x, village.z - z);
      rt.scene.add(cabin);
      const box: Box = { minX: x - 5.2, maxX: x + 5.2, minZ: z - 3.7, maxZ: z + 3.7, h: 6.8 };
      rt.world.boxes.push(box);
      st.cabins.push(box);
    }
    for (let i = 0; i < SGNOWME_COUNT; i++) {
      const model = makeGnome(rt.scene, sgnowmeLook());
      const s: Sgnowme = {
        model, x: village.x, z: village.z, yaw: 0, goalX: village.x, goalZ: village.z,
        idleT: 0, scaredT: 0, name: randomGnomeName(),
      };
      pickGoal(s, st);
      // Start each one at its first goal so none stands inside a cabin.
      s.x = s.goalX;
      s.z = s.goalZ;
      st.sgnowmes.push(s);
    }

    // 3. Polar bears in a row of deck chairs on the sun deck, facing south.
    const deck = openSpot(DECK_CX, DECK_CZ, 2, REGION, rt.world) ?? { x: DECK_CX, z: DECK_CZ };
    // A timber deck under the chairs (prefab 'bear-deck', 22 x 6 m, top 0.25 m, open at +z). Its base sits at the
    // highest ground under it so no corner is sunk; the chairs and bears stand on its top.
    let deckTop = 0;
    if (getPrefab('bear-deck')) {
      let base = -Infinity;
      for (let i = -4; i <= 4; i++) for (let j = -1; j <= 1; j++) base = Math.max(base, heightAt(deck.x + i * 2.75, deck.z + j * 3));
      const planks = buildPrefab('bear-deck', { lights: false });
      planks.position.set(deck.x, base, deck.z);
      rt.scene.add(planks);
      deckTop = base + DECK_TOP;
      // Two parasols behind the chairs, and a cool box of sardines at the east end.
      for (const [dx, tint] of [[-6, 0xd9473b], [6, 0xf0c244]] as const) {
        const um = critterMesh('beach-umbrella', 2.6, tint);
        um.position.set(deck.x + dx, deckTop, deck.z - 1.6);
        um.rotation.z = dx < 0 ? 0.06 : -0.06;
        rt.scene.add(um);
      }
      const cool = critterMesh('bait-cooler', 1.8);
      cool.position.set(deck.x + 9.6, deckTop, deck.z - 1.4);
      cool.rotation.y = -0.4;
      rt.scene.add(cool);
      for (const [dx, dz, ry] of [[10.5, -0.4, 0.8], [9.6, -0.1, -0.3]] as const) {
        const tin = critterMesh('sardine-tin', 2);
        tin.position.set(deck.x + dx, deckTop, deck.z + dz);
        tin.rotation.y = ry;
        rt.scene.add(tin);
      }
    }
    st.deckTop = deckTop;
    for (let i = 0; i < 5; i++) {
      const x = deck.x + (i - 2) * 4, z = deck.z;
      const chair = critterMesh('deck-chair', 1.2);
      chair.position.set(x, deckTop || heightAt(x, z), z);
      chair.rotation.y = 0;
      rt.scene.add(chair);
      st.bears.push(rt.spawn('polar-bear', x, z, { region: REGION, group: 'fells-bears', mode: 'script', yaw: 0 }));
    }
  },

  update(rt, ctx) {
    const st = states.get(rt);
    if (!st) return;
    const { dt } = ctx;
    st.t = ctx.time;

    // Snowmen: a vehicle driven through smashes one; they are rebuilt at nightfall or 300 s after a smash.
    const rose = nightRose(st.lastNight, ctx.night);
    st.lastNight = ctx.night;
    for (const s of st.snowmen) {
      if (s.smashed) {
        if (rose || st.t - s.smashedAt >= SNOWMAN_REBUILD_S) {
          s.smashed = false;
          s.mesh.visible = true;
        }
        continue;
      }
      for (const v of ctx.vehicles) {
        if (v.exploded) continue;
        if (Math.abs(v.speed) > 3 && Math.hypot(v.x - s.x, v.z - s.z) < v.spec.radius + 0.7) {
          smashSnowman(rt, st, s);
          break;
        }
      }
    }

    // Sgnowmes: walk the village, flee when scared, hands up while running.
    for (const s of st.sgnowmes) {
      const dP = Math.hypot(s.x - ctx.playerX, s.z - ctx.playerZ);
      if (dP > SGNOWME_SIM_RADIUS) {
        s.model.object.visible = false;
        continue;
      }
      s.model.object.visible = true;
      for (const v of ctx.vehicles) {
        if (v.exploded) continue;
        if (Math.abs(v.speed) > 2 && Math.hypot(v.x - s.x, v.z - s.z) < 3) scareSgnowme(rt, s, false);
      }

      const wasScared = s.scaredT > 0;
      if (wasScared) s.scaredT -= dt;
      const y = heightAt(s.x, s.z);

      if (s.scaredT > 0) {
        let dx = s.x - ctx.playerX, dz = s.z - ctx.playerZ;
        let d = Math.hypot(dx, dz);
        if (d < 0.01) { dx = 1; dz = 0; d = 1; }
        const nx = s.x + (dx / d) * SGNOWME_FLEE * dt, nz = s.z + (dz / d) * SGNOWME_FLEE * dt;
        if (!blocked(nx, nz, st.cabins)) { s.x = nx; s.z = nz; }
        s.yaw = Math.atan2(dx, dz);
        s.model.update(gnomeState(s.x, y, s.z, s.yaw, SGNOWME_FLEE), dt);
        poseHandsUp(s.model, ctx.time);
        continue;
      }
      if (wasScared) {
        s.idleT = 1;
        s.model.update(gnomeState(s.x, y, s.z, s.yaw, 0), dt);
        clearHandsUp(s.model);
        continue;
      }

      let speed = 0;
      if (s.idleT > 0) {
        s.idleT -= dt;
        if (s.idleT <= 0) pickGoal(s, st);
      } else {
        const dx = s.goalX - s.x, dz = s.goalZ - s.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.2) {
          s.idleT = 2 + Math.random() * 3;
        } else {
          const step = Math.min(SGNOWME_WALK * dt, d);
          const nx = s.x + (dx / d) * step, nz = s.z + (dz / d) * step;
          if (blocked(nx, nz, st.cabins)) {
            s.idleT = 0.5;
          } else {
            s.x = nx;
            s.z = nz;
            s.yaw = Math.atan2(dx, dz);
            speed = SGNOWME_WALK;
          }
        }
      }
      s.model.update(gnomeState(s.x, heightAt(s.x, s.z), s.z, s.yaw, speed), dt);
    }

    // Polar bears: pinned to their chairs. A shrug lifts the arms and turns the head; otherwise a slow idle.
    for (const c of st.bears) {
      c.y = (st.deckTop || heightAt(c.x, c.z)) + 0.36;
      const obj = c.object;
      const shrugT = Number(c.data.shrugT ?? 0);
      if (shrugT > 0) {
        const s = Math.sin(Math.PI * (1 - shrugT / BEAR_SHRUG_S));
        const arm0 = obj?.getObjectByName('arm-0');
        const arm1 = obj?.getObjectByName('arm-1');
        const head = obj?.getObjectByName('head');
        if (arm0) arm0.rotation.z = -0.9 * s;
        if (arm1) arm1.rotation.z = 0.9 * s;
        if (head) head.rotation.z = 0.25 * s;
        c.data.shrugT = shrugT - dt;
      } else {
        const head = obj?.getObjectByName('head');
        if (head) head.rotation.y = 0.3 * Math.sin(ctx.time * 0.3 + c.id);
        const arm0 = obj?.getObjectByName('arm-0');
        const arm1 = obj?.getObjectByName('arm-1');
        if (arm0) arm0.rotation.z = 0;
        if (arm1) arm1.rotation.z = 0;
      }
    }
  },

  onHit(rt, c, _cause, _fromX, _fromZ) {
    // Only the deck's own bears: the Snowcap bears (critters/snowcap.ts) shrug through their own life.
    if (c.kind !== 'polar-bear' || c.group !== 'fells-bears') return false;
    const st = states.get(rt);
    const now = st?.t ?? 0;
    const shrugT = Number(c.data.shrugT ?? 0);
    if (!(shrugT > 0)) shrugBear(c);
    const last = c.data.lastShrugToast as number | undefined;
    if (last === undefined || now - last >= BEAR_TOAST_GAP) {
      c.data.lastShrugToast = now;
      rt.deps.toast(pick(BEAR_SHRUGS));
    }
    if (st && now - st.lastBearEvent >= BEAR_EVENT_GAP) {
      st.lastBearEvent = now;
      rt.deps.event('bear-shrug');
    }
    return true;
  },

  hitTest(rt, x, y, z) {
    const st = states.get(rt);
    if (!st) return false;
    for (const s of st.snowmen) {
      if (s.smashed) continue;
      if (Math.hypot(x - s.x, z - s.z) < 0.8 && y < heightAt(s.x, s.z) + 2.9) {
        smashSnowman(rt, st, s);
        return true;
      }
    }
    for (const s of st.sgnowmes) {
      if (!s.model.object.visible) continue;
      const g = heightAt(s.x, s.z);
      if (Math.hypot(x - s.x, z - s.z) < 0.45 && y >= g && y <= g + 1.1) {
        scareSgnowme(rt, s, true);
        return true;
      }
    }
    return false;
  },
};
