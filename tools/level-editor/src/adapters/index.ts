import type { GameAdapter } from '../context';
import { clubAdapter } from './club';
import { snigmsAdapter } from './snigms';
import { frontAdapter } from './front';
import { golfAdapter } from './golf';
import { gnomeokemonAdapter } from './gnomeokemon';
import { gnomomiaAdapter } from './gnomomia';
import { gnomeSetRadioAdapter } from './gnomeSetRadio';

/** Every game the editor can open. The key is the ?game= value. */
export const ADAPTERS: Record<string, GameAdapter> = {
  [gnomomiaAdapter.id]: gnomomiaAdapter,
  [clubAdapter.id]: clubAdapter,
  [frontAdapter.id]: frontAdapter,
  [golfAdapter.id]: golfAdapter,
  [gnomeokemonAdapter.id]: gnomeokemonAdapter,
  [snigmsAdapter.id]: snigmsAdapter,
  [gnomeSetRadioAdapter.id]: gnomeSetRadioAdapter,
};

/** The adapter named by the page's ?game= (Gnomomia by default). */
export function pickAdapter(search: string): GameAdapter {
  const id = new URLSearchParams(search).get('game') ?? gnomomiaAdapter.id;
  return ADAPTERS[id] ?? gnomomiaAdapter;
}
