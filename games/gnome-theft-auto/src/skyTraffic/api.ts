// One door for tools (the Save Trainer) to list, spawn and clear NPC aircraft. app.ts binds the running sky traffic once;
// until then the list still works (nothing active) and spawning returns false.
import { registerTrainerSpawnable } from '../trainer/registry';
import { SKY_BEHAVIOURS } from './behaviours';
import type { SkyTraffic, SkyTrafficInfo } from './runtime';

let bound: SkyTraffic | null = null;

/** app.ts only. */
export function bindSkyTraffic(s: SkyTraffic | null): void {
  bound = s;
}

/** Every behaviour (data table order) and whether it is flying now. */
export function listSkyBehaviours(): SkyTrafficInfo[] {
  return bound ? bound.list() : SKY_BEHAVIOURS.map((b) => ({ id: b.id, title: b.title, active: false }));
}

/** Fly behaviour `id` now. False for an unknown id, one already flying, or before the game runs. */
export function spawnSkyNpc(id: string): boolean {
  return bound ? bound.spawn(id) : false;
}

/** Remove every NPC aircraft now. */
export function clearSkyNpcs(): void {
  bound?.clear();
}

/** Ambient spawning on or off (off also clears the sky). */
export function setSkyTrafficEnabled(on: boolean): void {
  bound?.setEnabled(on);
}

// Save Trainer: Spawn > Sky has one button per flight (docs/roadmaps/gta-save-trainer.md, Extension points).
for (const b of SKY_BEHAVIOURS) {
  registerTrainerSpawnable('Sky', b.id, b.title, () => (spawnSkyNpc(b.id) ? `${b.title} flying` : `${b.title}: already flying or game not running`));
}
