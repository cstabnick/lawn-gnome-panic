// Computer-controlled gnomes drawn through avatars.ts. STUB: issue 2I fills it in.
import type { MapId, NpcDef } from './config';
import type { Avatars } from './avatars';

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

export function createNpcs(avatars: Avatars): Npcs {
  void avatars;
  return { load() {}, update() {}, say() {}, talk() {}, npcNear: () => null };
}
