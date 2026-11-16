// Every party slice in the repo: each game surfaces its own from games/<game>/src/minigames/index.ts
// (export const minigames: AnyMinigame[]). Nothing here names a game, so adding or deleting a game needs no change.
import type { AnyMinigame } from '@lawn/party';
import template from '../../../packages/party/template/minigame';

const found = import.meta.glob<AnyMinigame[]>('../../*/src/minigames/index.ts', { eager: true, import: 'minigames' });

function collect(): AnyMinigame[] {
  const byId = new Map<string, AnyMinigame>();
  for (const [path, list] of Object.entries(found)) {
    for (const m of list ?? []) {
      if (byId.has(m.meta.id)) {
        console.error(`Duplicate party slice id "${m.meta.id}" in ${path}; skipped`);
        continue;
      }
      byId.set(m.meta.id, m);
    }
  }
  // Until a game surfaces a slice, the template keeps the party playable.
  if (byId.size === 0) byId.set('mash', { ...template, meta: { ...template.meta, id: 'mash', title: 'Mash', game: 'gnome-party' } });
  return [...byId.values()].sort((a, b) => a.meta.id.localeCompare(b.meta.id));
}

export const MINIGAMES: readonly AnyMinigame[] = collect();

export function minigameById(id: string): AnyMinigame | undefined {
  return MINIGAMES.find((m) => m.meta.id === id);
}

/** The slices a party may play: those in `allowed` (every slice when it is absent or names none that exist). */
export function minigamePool(allowed?: readonly string[]): readonly AnyMinigame[] {
  if (!allowed || allowed.length === 0) return MINIGAMES;
  const ids = new Set(allowed);
  const pool = MINIGAMES.filter((m) => ids.has(m.meta.id));
  return pool.length > 0 ? pool : MINIGAMES;
}

/** Uniform among the allowed slices not in the last 2 of recent (any allowed one, if that leaves none). */
export function pickMinigame(rng: () => number, recent: readonly string[], allowed?: readonly string[]): AnyMinigame {
  const all = minigamePool(allowed);
  const skip = new Set(recent.slice(-2));
  const fresh = all.filter((m) => !skip.has(m.meta.id));
  const from = fresh.length > 0 ? fresh : all;
  return from[Math.floor(rng() * from.length) % from.length];
}
