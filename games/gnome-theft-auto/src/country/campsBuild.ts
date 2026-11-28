// The hunter camps (E16, issue F2): one culled static batch of tents, shacks, stands, blinds and drying racks from
// CAMPS, with colliders, and their life: a fire glow at night, a crackle near the fire, hunters asleep by the fire who
// snore, and a little loot to take with E that refills later.
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { makeBubbleSprite } from '../ambientGnomes';
import { createAnimator, type Animator } from '../anim/animator';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, type HomePiece } from '../homes/pieces';
import { addItem, itemDef } from '../inventory';
import type { JobsDeps } from '../jobs/types';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { speakAt } from '../voice/speech';
import { voiceFor } from '../voice/voices';
import { CAMPS } from './camps';
import { CAMP_LOOT_REFILL_S, FIRE_LIGHT_RANGE, type CampDef, type CountryPart } from './types';

/** Taken-at wall-clock times (ms) per camp id. Saved under this key (lead: add it to saveIO.ts GTA_SAVE_KEYS). */
const LOOT_KEY = 'gta-camp-loot-v1';
const LOOT_REACH = 2.5;
const SLEEP_HEAR = 120, SLEEP_GONE = 160;
const SNORE_HEAR = 20, FIRE_SOUND_HEAR = 25, BUBBLE_SEE = 10.5;

const HUNTER_LOOK: GnomeLook = {
  hat: 0xc9b98f, shirt: 0x6b7a3a, pants: 0x4a3b2a, skin: 0xf1c27d, boots: 0x222222, beard: 0x9a8a6a,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

const SLEEP_LINES = [
  'Zzz... Not the tuft, the other tuft...',
  'Mm. Five more minutes. Then the deer.',
  "Leave the tin. It's for the next one.",
];

/** A piece in a camp's local frame (front = +z; yaw is added to the camp's). */
interface Local { prefab: string; x: number; z: number; yaw?: number; solid?: boolean }

const FIRE_SPOT: Record<string, { x: number; z: number }> = {
  tent: { x: 0, z: 2 },
  camp: { x: 0, z: 1.5 },
};

function layout(c: CampDef): Local[] {
  switch (c.kind) {
    case 'tent':
      return [
        { prefab: 'hunter-tent', x: 0, z: -1.5 },
        { prefab: 'fire-ring', x: 0, z: 2, solid: false },
        { prefab: 'campfire', x: 0, z: 2, solid: false },
        { prefab: 'camp-stool', x: 1.5, z: 2.5, solid: false },
        { prefab: 'camp-lantern-post', x: -1.6, z: -0.2 },
        { prefab: 'timber-log', x: -1.6, z: 2.3, solid: false },
      ];
    case 'camp':
      return [
        { prefab: 'hunter-tent', x: -2.5, z: -2, yaw: 0.35 },
        { prefab: 'hunter-tent', x: 2.5, z: -2, yaw: -0.35 },
        { prefab: 'fire-ring', x: 0, z: 1.5, solid: false },
        { prefab: 'campfire', x: 0, z: 1.5, solid: false },
        { prefab: 'camp-tripod-kettle', x: 0, z: 1.5, solid: false },
        { prefab: 'camp-stool', x: -1.5, z: 2.2, solid: false },
        { prefab: 'camp-stool', x: 1.5, z: 2.2, solid: false },
        { prefab: 'fallen-log', x: 2.2, z: 0.5, solid: false },
        { prefab: 'crate', x: -2.2, z: 1.4 },
      ];
    case 'shack':
      return [
        { prefab: 'hunter-shack', x: 0, z: -1 },
        { prefab: 'timber-log', x: 1.4, z: 1.6, solid: false },
        { prefab: 'antler-shed', x: -1.4, z: 1.6, solid: false },
        { prefab: 'game-feeder', x: 3.5, z: 2 },
      ];
    case 'stand':
      return [
        { prefab: 'deer-stand', x: 0, z: 0 },
        { prefab: 'game-feeder', x: 0, z: 5 },
      ];
    case 'blind':
      return [
        { prefab: 'duck-blind', x: 0, z: 0 },
        { prefab: 'camp-stool', x: -0.6, z: -0.8, solid: false },
        { prefab: 'camp-stool', x: 0.6, z: -0.8, solid: false },
      ];
    case 'drying':
      return [
        { prefab: 'tuft-drying-rack', x: 0, z: 0 },
        { prefab: 'camp-bedroll', x: -1.8, z: 1.2, solid: false },
        { prefab: 'camp-lantern-post', x: 1.8, z: -0.6 },
      ];
  }
}

/** Local (x, z) of a camp to world. Matches estateLocal: a camp's front (+z) turns with its yaw. */
function worldOf(c: CampDef, lx: number, lz: number): { x: number; z: number } {
  const s = Math.sin(c.yaw), k = Math.cos(c.yaw);
  return { x: c.x + lx * k + lz * s, z: c.z - lx * s + lz * k };
}

function toPiece(c: CampDef, l: Local): HomePiece {
  const p = worldOf(c, l.x, l.z);
  return {
    prefab: l.prefab, x: p.x, z: p.z, yaw: c.yaw + (l.yaw ?? 0),
    ...(l.solid === undefined ? {} : { solid: l.solid }),
  };
}

/** Every camp's pieces, in one batch. Pushes the colliders into `boxes`. */
export function buildCamps(scene: THREE.Scene, boxes: Box[]): void {
  const pieces: HomePiece[] = [];
  for (const c of CAMPS) for (const l of layout(c)) pieces.push(toPiece(c, l));
  for (const b of buildPieces(scene, pieces, 'hunter-camps')) boxes.push(b);
}

function hasFire(c: CampDef): boolean {
  return c.kind === 'tent' || c.kind === 'camp';
}

function fireWorld(c: CampDef): { x: number; y: number; z: number } {
  const f = FIRE_SPOT[c.kind] ?? { x: 0, z: 0 };
  const p = worldOf(c, f.x, f.z);
  return { x: p.x, y: heightAt(p.x, p.z), z: p.z };
}

function readTaken(): Record<string, number> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(LOOT_KEY) ?? '{}');
    return v && typeof v === 'object' ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeTaken(taken: Record<string, number>): void {
  try {
    localStorage.setItem(LOOT_KEY, JSON.stringify(taken));
  } catch {
    // Private window or blocked storage: the loot simply refills on reload.
  }
}

interface Sleeper {
  camp: CampDef;
  x: number; z: number; yaw: number;
  line: string;
  model: GnomeModel | null;
  animator: Animator | null;
  bubble: THREE.Sprite | null;
  spoken: boolean;
  snoreT: number;
}

/** Per camp: a fire light near the player at night, a crackle, and sleepers that snore. */
export function installCamps(deps: JobsDeps): CountryPart {
  const scene = deps.scene;
  const light = new THREE.PointLight(0xff9a4a, 0, 12, 1.5);
  light.visible = false;
  scene.add(light);

  const sleepers: Sleeper[] = CAMPS.filter((c) => c.sleeper).map((c, i) => {
    const spot = c.kind === 'shack' ? { x: 0.6, z: 1.9 } : c.kind === 'tent' ? { x: 1.2, z: 1 } : { x: -1, z: 0.4 };
    const p = worldOf(c, spot.x, spot.z);
    return {
      camp: c, x: p.x, z: p.z, yaw: c.yaw, line: SLEEP_LINES[i % SLEEP_LINES.length],
      model: null, animator: null, bubble: null, spoken: false, snoreT: 1 + i,
    };
  });

  const fires = CAMPS.filter(hasFire);
  const playerDist = (x: number, z: number): number => Math.hypot(deps.player.x - x, deps.player.z - z);
  let taken = readTaken();
  let fireT = 0;

  const ready = (c: CampDef): boolean => {
    const t = taken[c.id];
    return t === undefined || Date.now() - t > CAMP_LOOT_REFILL_S * 1000;
  };

  const lootAt = (x: number, z: number): CampDef | null => {
    let best: CampDef | null = null;
    let bestD = LOOT_REACH;
    for (const c of CAMPS) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d <= bestD && ready(c)) { best = c; bestD = d; }
    }
    return best;
  };

  const buildSleeper = (s: Sleeper): void => {
    const model = makeGnome(scene, HUNTER_LOOK);
    const y = heightAt(s.x, s.z);
    model.update(gnomeState(s.x, y, s.z, s.yaw, 0), 1);
    const animator = createAnimator();
    animator.play('sleep', { loop: true });
    const bubble = makeBubbleSprite(s.camp.name, s.line);
    bubble.position.set(s.x, y + 2.25, s.z);
    bubble.visible = false;
    scene.add(bubble);
    s.model = model;
    s.animator = animator;
    s.bubble = bubble;
  };

  const dropSleeper = (s: Sleeper): void => {
    if (s.model) scene.remove(s.model.object);
    if (s.bubble) scene.remove(s.bubble);
    s.model = null;
    s.animator = null;
    s.bubble = null;
  };

  return {
    update(dt, t) {
      // Fire light: one shared light on the nearest fire, at night only, flickering a little.
      let nearFire: CampDef | null = null;
      let nearD = Infinity;
      for (const c of fires) {
        const d = playerDist(c.x, c.z);
        if (d < nearD) { nearFire = c; nearD = d; }
      }
      const label = deps.timeLabel();
      const night = label === 'Dusk' || label === 'Neon Night';
      if (nearFire && night && nearD <= FIRE_LIGHT_RANGE) {
        const f = fireWorld(nearFire);
        light.position.set(f.x, f.y + 1.1, f.z);
        light.intensity = 3 * (0.85 + 0.1 * Math.sin(t * 9.1) + 0.05 * Math.sin(t * 23.7));
        light.visible = true;
      } else {
        light.visible = false;
      }

      // The crackle: every 1.2 s while the player is within 25 m of a fire.
      fireT -= dt;
      if (fireT <= 0 && nearFire && nearD <= FIRE_SOUND_HEAR) {
        const f = fireWorld(nearFire);
        playAt('country-campfire', { x: f.x, z: f.z });
        fireT = 1.2;
      }

      // Sleepers: built within 120 m, gone beyond 160 m; they snore within 20 m.
      for (const s of sleepers) {
        const d = playerDist(s.x, s.z);
        if (!s.model && d <= SLEEP_HEAR) buildSleeper(s);
        if (s.model && d > SLEEP_GONE) { dropSleeper(s); continue; }
        if (!s.model || !s.animator || !s.bubble) continue;
        s.model.update(gnomeState(s.x, heightAt(s.x, s.z), s.z, s.yaw, 0), dt);
        s.animator.apply(s.model, dt);
        s.bubble.visible = d <= BUBBLE_SEE;
        if (d <= BUBBLE_SEE && !s.spoken) {
          speakAt(s.line, voiceFor(s.camp.name), s.x, s.z, BUBBLE_SEE);
          s.spoken = true;
        } else if (d > SNORE_HEAR * 1.5) {
          s.spoken = false;
        }
        s.snoreT -= dt;
        if (s.snoreT <= 0 && d <= SNORE_HEAR) {
          playAt('country-snore', { x: s.x, z: s.z });
          s.snoreT = 4 + Math.random() * 2;
        }
      }
    },
    prompt(x, z) {
      const c = lootAt(x, z);
      return c ? c.loot.prompt : null;
    },
    interact(x, z) {
      const c = lootAt(x, z);
      if (!c) return false;
      const loot = c.loot;
      const parts: string[] = [];
      if (loot.item) {
        const n = loot.n ?? 1;
        const fitted = addItem(loot.item, n);
        if (fitted <= 0) {
          deps.hud.toast('Your bag is full.');
          return true;
        }
        parts.push(`${fitted} ${itemDef(loot.item)?.name ?? loot.item}`);
      }
      if (loot.acorns) {
        deps.economy.earn(loot.acorns, 'Camp tin');
        parts.push(`${loot.acorns} acorns`);
      }
      taken = { ...taken, [c.id]: Date.now() };
      writeTaken(taken);
      deps.hud.toast(`${c.name}: +${parts.join(', ')}. Somebody will fill it again.`);
      return true;
    },
  };
}
