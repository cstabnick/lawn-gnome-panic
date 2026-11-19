import type { GameAdapter } from '../context';
import { clubAdapter } from './club';
import { gnomomiaAdapter } from './gnomomia';

/** Every game the editor can open. The key is the ?game= value. */
export const ADAPTERS: Record<string, GameAdapter> = {
  [gnomomiaAdapter.id]: gnomomiaAdapter,
  [clubAdapter.id]: clubAdapter,
};

/** The adapter named by the page's ?game= (Gnomomia by default). */
export function pickAdapter(search: string): GameAdapter {
  const id = new URLSearchParams(search).get('game') ?? gnomomiaAdapter.id;
  return ADAPTERS[id] ?? gnomomiaAdapter;
}
