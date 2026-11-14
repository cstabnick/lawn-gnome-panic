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

/** Uniform among slices not in the last 2 of recent (any, if that leaves none). */
export function pickMinigame(rng: () => number, recent: readonly string[]): AnyMinigame {
  const skip = new Set(recent.slice(-2));
  const pool = MINIGAMES.filter((m) => !skip.has(m.meta.id));
  const from = pool.length > 0 ? pool : MINIGAMES;
  return from[Math.floor(rng() * from.length) % from.length];
}
