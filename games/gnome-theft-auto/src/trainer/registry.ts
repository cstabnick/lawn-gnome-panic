// The Save Trainer's two registries: tabs (sections) and Spawn-tab buttons (spawnables). Import-light on purpose (no DOM,
// no game modules), so any system can plug in at load time without pulling the panel in:
//   registerTrainerSection({ id: 'birding', label: 'Birds', order: 45, build(el, ctx) { ... } });
//   registerTrainerSpawnable('Birds', 'robin', 'Robin', (at, ctx) => { ... });
import type { TrainerCtx, TrainerSection, TrainerSpawnable, TrainerSpot } from './types';

const sections = new Map<string, TrainerSection>();
const spawnables = new Map<string, TrainerSpawnable>();

/** Add (or replace, by id) a trainer tab. */
export function registerTrainerSection(s: TrainerSection): void {
  sections.set(s.id, s);
}

/** Every tab, by `order` then id. */
export function listTrainerSections(): TrainerSection[] {
  return [...sections.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/** Add (or replace, by group + id) a Spawn-tab button. */
export function registerTrainerSpawnable(
  group: string,
  id: string,
  label: string,
  spawn: (at: TrainerSpot, ctx: TrainerCtx) => string | void,
): void {
  spawnables.set(`${group}\u0000${id}`, { group, id, label, spawn });
}

/** Every spawnable, grouped: groups in first-registered order, entries in registration order. */
export function listTrainerSpawnables(): { group: string; items: TrainerSpawnable[] }[] {
  const out = new Map<string, TrainerSpawnable[]>();
  for (const s of spawnables.values()) {
    if (!out.has(s.group)) out.set(s.group, []);
    out.get(s.group)!.push(s);
  }
  return [...out].map(([group, items]) => ({ group, items }));
}

/** Tests only. */
export function clearTrainerRegistryForTest(): void {
  sections.clear();
  spawnables.clear();
}
