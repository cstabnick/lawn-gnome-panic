// Pebblewick's townsfolk: nine named gnomes on daily schedules (NPC_STATIONS in town.ts), walking between their
// stations along the streets, idling with anim rows, greeting the player when near; and the hens in the pen.
// Nothing runs while the player is farther than ACTIVE_RADIUS from the town centre.
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { VoiceSpec } from '@lawn/mutter';
import { buildPrefab } from '@lawn/prefabs';
import { mulberry32 } from '@lawn/level';
import type { TimeLabel } from '../atmosphere';
import { angleDiff } from '../collide';
import { animStride, newAnimClock, stepAnimClock, type AnimClock } from '../animStride';
import { createAnimator, type Animator } from '../anim/animator';
import { makeBubbleSprite } from '../ambientGnomes';
import { gnomeState, makeGnome } from '../gnomes';
import { heightAt } from '../terrain';
import { speakAt } from '../voice/speech';
import { voiceFor } from '../voice/voices';
import { HEN_PEN, NPC_STATIONS, TOWN, type Schedule, type Station, type TownNpcId } from './town';
import { TOWN_NPCS, type TownNpcDef } from './npcData';
import { routeBetween } from './npcRoute';

export interface TownNpcs {
  /** Every frame. Does no per-NPC work while the player is farther than 160 m from TOWN.centre. */
  update(dt: number, px: number, pz: number, time: TimeLabel): void;
  /** Standing at (not walking to) their station `index` right now. */
  presentAt(id: TownNpcId, index: number): boolean;
  /** Every visible NPC within r of (x, z) plays 'cheer' once, then goes back to its idle. */
  cheer(x: number, z: number, r: number): void;
  /** Display name, e.g. 'Thistle Twine'. */
  nameOf(id: TownNpcId): string;
}

const ACTIVE_RADIUS = 160;
const WALK_SPEED = 1.4;
const GREET_DIST = 6;
const GREET_COOLDOWN = 25;
const BUBBLE_TIME = 5;
const SPEAK_RANGE = 16;
const BUBBLE_Y = 2.25;
/** Idle rows that keep their pose: no wave on greeting. */
const NO_WAVE = new Set(['sit-ground', 'sleep', 'sweep', 'rake', 'read']);

const HEN_COUNT = 4;
const HEN_SCALE = 1.4;
const HEN_SPEED = 0.8;
const HEN_SEED = 0x6e1f;

const BASE_LOOK: GnomeLook = {
  hat: 0xd93636,
  shirt: 0x3b6ea5,
  pants: 0x2c3e50,
  skin: 0xf1c27d,
  boots: 0x222222,
  beard: 0xdddddd,
  hair: null,
  freckles: false,
  dress: false,
  glasses: false,
  bowlCut: null,
};

interface Walker {
  def: TownNpcDef;
  stations: readonly Station[];
  schedule: Schedule;
  model: GnomeModel;
  anim: Animator;
  clock: AnimClock;
  voice: VoiceSpec;
  bubbles: Map<string, THREE.Sprite>;
  bubble: THREE.Sprite | null;
  bubbleT: number;
  x: number;
  z: number;
  yaw: number;
  /** Station index at rest, or -1 when hidden (indoors). */
  here: number;
  walking: boolean;
  /** Station the current walk ends at, and whether it hides on arrival. */
  dest: number;
  hideAfter: boolean;
  route: [number, number][];
  routeI: number;
  lastGreet: number;
  lineI: number;
  phase: number;
  idle: string;
}

interface Hen {
  obj: THREE.Object3D;
  head: THREE.Object3D | null;
  x: number;
  z: number;
  tx: number;
  tz: number;
  yaw: number;
  nextT: number;
  phase: number;
}

export function createTownNpcs(scene: THREE.Scene): TownNpcs {
  const walkers: Walker[] = [];
  const byId = new Map<TownNpcId, Walker>();
  let elapsed = 0;

  for (let i = 0; i < TOWN_NPCS.length; i++) {
    const def = TOWN_NPCS[i];
    const set = NPC_STATIONS.find((n) => n.id === def.id);
    if (!set) continue;
    const look: GnomeLook = { ...BASE_LOOK, ...def.look };
    const model = makeGnome(scene, look);
    const anim = createAnimator();
    const w: Walker = {
      def,
      stations: set.stations,
      schedule: set.schedule,
      model,
      anim,
      clock: newAnimClock(i),
      voice: voiceFor(def.name),
      bubbles: new Map(),
      bubble: null,
      bubbleT: 0,
      x: 0,
      z: 0,
      yaw: 0,
      here: set.schedule.Noon,
      walking: false,
      dest: -1,
      hideAfter: false,
      route: [],
      routeI: 0,
      lastGreet: -Infinity,
      lineI: 0,
      phase: i * 0.65,
      idle: '',
    };
    walkers.push(w);
    byId.set(def.id, w);
    if (w.here >= 0) {
      place(w, w.here);
    } else {
      model.object.visible = false;
      w.x = set.stations[0].x;
      w.z = set.stations[0].z;
    }
    model.update(gnomeState(w.x, heightAt(w.x, w.z), w.z, w.yaw, 0), 1);
  }

  const hens: Hen[] = [];
  const rng = mulberry32(HEN_SEED);
  const { minX, maxX, minZ, maxZ } = HEN_PEN;
  const pickInPen = (): [number, number] => [
    minX + 0.6 + rng() * (maxX - minX - 1.2),
    minZ + 0.6 + rng() * (maxZ - minZ - 1.2),
  ];
  for (let i = 0; i < HEN_COUNT; i++) {
    const obj = buildPrefab('hen', { lights: false, scale: HEN_SCALE });
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    const [x, z] = pickInPen();
    const [tx, tz] = pickInPen();
    obj.position.set(x, heightAt(x, z), z);
    scene.add(obj);
    hens.push({
      obj,
      head: obj.getObjectByName('head') ?? null,
      x, z, tx, tz,
      yaw: 0,
      nextT: 2 + rng() * 3,
      phase: rng() * Math.PI * 2,
    });
  }

  /** Put the NPC on station i at rest (visible, idle loop). */
  function place(w: Walker, i: number): void {
    const s = w.stations[i];
    w.here = i;
    w.x = s.x;
    w.z = s.z;
    w.yaw = s.yaw;
    w.walking = false;
    w.model.object.visible = true;
    startIdle(w);
  }

  function startIdle(w: Walker): void {
    const s = w.here >= 0 ? w.stations[w.here] : w.stations[0];
    w.idle = s.idle;
    w.anim.play(s.idle, { loop: true, offset: w.phase });
  }

  function hide(w: Walker): void {
    w.here = -1;
    w.walking = false;
    w.model.object.visible = false;
    w.anim.cancel(w.model);
    w.bubbleT = 0;
    if (w.bubble) w.bubble.visible = false;
    w.bubble = null;
  }

  function walkTo(w: Walker, dest: number, hideAfter: boolean): void {
    const from = w.stations[w.here];
    w.route = routeBetween(from, w.stations[dest]);
    w.routeI = 1;
    w.dest = dest;
    w.hideAfter = hideAfter;
    w.walking = true;
    w.anim.stop();
    if (w.route.length <= 1) arrive(w);
  }

  function arrive(w: Walker): void {
    w.walking = false;
    w.here = w.dest;
    if (w.hideAfter) {
      hide(w);
      return;
    }
    startIdle(w);
  }

  /** Walk the route for one frame's worth of distance. */
  function moveWalker(w: Walker, dt: number): void {
    let budget = WALK_SPEED * dt;
    while (budget > 0 && w.routeI < w.route.length) {
      const tp = w.route[w.routeI];
      const dx = tp[0] - w.x;
      const dz = tp[1] - w.z;
      const d = Math.hypot(dx, dz);
      if (d > 0) w.yaw = Math.atan2(dx, dz);
      if (d <= budget) {
        w.x = tp[0];
        w.z = tp[1];
        budget -= d;
        w.routeI++;
      } else {
        w.x += (dx / d) * budget;
        w.z += (dz / d) * budget;
        budget = 0;
      }
    }
    if (w.routeI >= w.route.length) arrive(w);
  }

  /** At rest and the schedule wants something else: start the next walk (or appear / hide). */
  function settle(w: Walker, want: number): void {
    if (w.here === -1) {
      if (want === -1) return;
      place(w, 0);
    }
    if (want === -1) {
      if (w.here === 0) hide(w);
      else walkTo(w, 0, true);
    } else if (want !== w.here) {
      walkTo(w, want, false);
    }
  }

  function bubbleFor(w: Walker, line: string): THREE.Sprite {
    let s = w.bubbles.get(line);
    if (!s) {
      s = makeBubbleSprite(w.def.name, line);
      s.scale.set(3.4, 1.18, 1);
      s.visible = false;
      scene.add(s);
      w.bubbles.set(line, s);
    }
    return s;
  }

  function greet(w: Walker): void {
    w.lastGreet = elapsed;
    const lines = w.def.lines;
    const line = lines[w.lineI % lines.length];
    w.lineI++;
    speakAt(line, w.voice, w.x, w.z, SPEAK_RANGE);
    if (w.bubble) w.bubble.visible = false;
    w.bubble = bubbleFor(w, line);
    w.bubble.visible = true;
    w.bubbleT = BUBBLE_TIME;
    if (!NO_WAVE.has(w.idle)) {
      w.anim.play('wave', {
        loop: false,
        onEnd: () => {
          if (!w.walking && w.here >= 0) startIdle(w);
        },
      });
    }
  }

  function updateWalker(w: Walker, dt: number, px: number, pz: number, time: TimeLabel): void {
    if (!w.walking) settle(w, w.schedule[time]);
    if (w.walking) moveWalker(w, dt);
    if (!w.model.object.visible) return;

    const d = Math.hypot(px - w.x, pz - w.z);
    let targetYaw = w.here >= 0 ? w.stations[w.here].yaw : w.yaw;
    if (!w.walking && w.here >= 0 && d < GREET_DIST) {
      targetYaw = Math.atan2(px - w.x, pz - w.z);
      if (elapsed - w.lastGreet >= GREET_COOLDOWN) greet(w);
    }
    if (!w.walking) w.yaw += angleDiff(targetYaw, w.yaw) * Math.min(1, 5 * dt);

    const gy = heightAt(w.x, w.z);
    const step = stepAnimClock(w.clock, dt, animStride(d));
    if (step > 0) {
      w.model.update(gnomeState(w.x, gy, w.z, w.yaw, w.walking ? WALK_SPEED : 0), step);
      if (w.anim.active) w.anim.apply(w.model, step);
    }

    if (w.bubble) {
      w.bubbleT -= dt;
      if (w.bubbleT <= 0 || w.here < 0) {
        w.bubble.visible = false;
        w.bubble = null;
      } else {
        w.bubble.position.set(w.x, gy + BUBBLE_Y, w.z);
      }
    }
  }

  // ---- Hens ----
  function updateHens(dt: number, t: number): void {
    for (const h of hens) {
      h.nextT -= dt;
      if (h.nextT <= 0) {
        [h.tx, h.tz] = pickInPen();
        h.nextT = 2 + rng() * 3;
      }
      const dx = h.tx - h.x;
      const dz = h.tz - h.z;
      const d = Math.hypot(dx, dz);
      const moving = d > 0.05;
      if (moving) {
        const step = Math.min(d, HEN_SPEED * dt);
        h.x += (dx / d) * step;
        h.z += (dz / d) * step;
        h.yaw = Math.atan2(dx, dz);
      }
      h.obj.position.set(h.x, heightAt(h.x, h.z), h.z);
      h.obj.rotation.y = h.yaw;
      if (h.head) {
        // Walking: a quick bob. Standing: pecking at the ground.
        h.head.rotation.x = moving
          ? Math.sin(t * 12 + h.phase) * 0.15
          : Math.max(0, Math.sin(t * 7 + h.phase)) * 0.6;
      }
    }
  }

  return {
    update(dt, px, pz, time) {
      if (Math.hypot(px - TOWN.centre.x, pz - TOWN.centre.z) > ACTIVE_RADIUS) return;
      elapsed += dt;
      for (const w of walkers) updateWalker(w, dt, px, pz, time);
      updateHens(dt, elapsed);
    },
    presentAt(id, index) {
      const w = byId.get(id);
      return !!w && w.model.object.visible && !w.walking && w.here === index;
    },
    cheer(x, z, r) {
      for (const w of walkers) {
        if (!w.model.object.visible) continue;
        if (Math.hypot(x - w.x, z - w.z) > r) continue;
        w.anim.play('cheer', {
          loop: false,
          onEnd: () => {
            if (!w.walking && w.here >= 0) startIdle(w);
          },
        });
      }
    },
    nameOf(id) {
      return TOWN_NPCS.find((n) => n.id === id)?.name ?? id;
    },
  };
}
