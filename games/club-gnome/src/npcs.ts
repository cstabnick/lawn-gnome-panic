// Computer-controlled gnomes drawn through avatars.ts. Their place is a pure function of the clock (npcPose), so
// every player online sees them in the same spot without any network messages.
import type { AvatarPose, MapId, NpcDef } from './config';
import { NPC_ID_BASE } from './config';
import type { Avatars } from './avatars';
import { NPCS } from './npcData';

/** Walking speed of townsfolk, units per second. */
const WALK_SPEED = 1.1;
/** Seconds a walker stands still at each waypoint. */
const PAUSE_S = 2;

export interface Npcs {
  /** Shows the NPCs of this map (call after avatars.removeAllExcept on every map change). */
  load(map: MapId): void;
  /** Moves walking NPCs to where the clock says (nowMs = Date.now()). Call every frame before avatars.update. */
  update(nowMs: number): void;
  /** Speech bubble over this NPC if it is on the current map. */
  say(npcId: string, text: string): void;
  /** This NPC says its next line (NpcDef.lines, in turn) in a bubble. */
  talk(npcId: string): void;
  /** The NPC standing within r (default 0.9) of (x, z) on the current map, or null (a tap on the ground near one). */
  npcNear(x: number, z: number, r?: number): NpcDef | null;
}

/** A stable number in [0, 1) from a text (FNV-1a), so each NPC starts its walk at its own phase. */
function hash01(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

/**
 * Where an NPC is at nowMs. A one-point path stands still facing def.facing. A loop walks its closed polyline at
 * WALK_SPEED, pausing PAUSE_S at each waypoint; the walk starts at a per-NPC phase.
 */
export function npcPose(def: NpcDef, nowMs: number): AvatarPose {
  const path = def.path;
  const n = path.length;
  if (n <= 1) {
    return { x: path[0].x, z: path[0].z, facing: def.facing, moving: false, busy: false };
  }

  const segLen: number[] = [];
  let walkTotal = 0;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    segLen.push(len);
    walkTotal += len / WALK_SPEED;
  }
  const period = walkTotal + n * PAUSE_S;
  const t0 = nowMs / 1000 + hash01(def.id) * period;
  let t = ((t0 % period) + period) % period;

  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    const facing = Math.atan2(b.x - a.x, b.z - a.z);
    if (t < PAUSE_S) return { x: a.x, z: a.z, facing, moving: false, busy: false };
    t -= PAUSE_S;
    const walk = segLen[i] / WALK_SPEED;
    if (t < walk) {
      const f = walk > 0 ? t / walk : 0;
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, facing, moving: true, busy: false };
    }
    t -= walk;
  }
  // Only reached through floating-point rounding at the very end of a period: back at the start.
  return { x: path[0].x, z: path[0].z, facing: def.facing, moving: false, busy: false };
}

export function createNpcs(avatars: Avatars): Npcs {
  /** NPCs shown on the current map, by id. */
  const shown = new Map<string, { index: number; def: NpcDef }>();
  /** Next line index per NPC (talk). */
  const lineAt = new Map<string, number>();
  let lastNow = Date.now();

  const avatarId = (index: number): number => NPC_ID_BASE - index;

  return {
    load(map) {
      shown.clear();
      NPCS.forEach((def, index) => {
        if (def.map !== map) return;
        shown.set(def.id, { index, def });
        avatars.upsert(avatarId(index), def.look, def.name, def.color);
        avatars.setPose(avatarId(index), npcPose(def, lastNow));
      });
    },

    update(nowMs) {
      lastNow = nowMs;
      for (const { index, def } of shown.values()) {
        avatars.setPose(avatarId(index), npcPose(def, nowMs));
      }
    },

    say(npcId, text) {
      const s = shown.get(npcId);
      if (s) avatars.say(avatarId(s.index), text);
    },

    talk(npcId) {
      const s = shown.get(npcId);
      if (!s || s.def.lines.length === 0) return;
      const k = lineAt.get(npcId) ?? 0;
      lineAt.set(npcId, k + 1);
      avatars.say(avatarId(s.index), s.def.lines[k % s.def.lines.length]);
    },

    npcNear(x, z, r = 0.9) {
      let best: NpcDef | null = null;
      let bestD = Infinity;
      for (const { def } of shown.values()) {
        const p = npcPose(def, lastNow);
        const d = Math.hypot(p.x - x, p.z - z);
        if (d <= r && d < bestD) {
          best = def;
          bestD = d;
        }
      }
      return best;
    },
  };
}
