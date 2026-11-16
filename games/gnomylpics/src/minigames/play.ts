import { playMinigame } from '@lawn/party';
import { minigames } from '.';

// Plays this game's slice alone against 3 CPUs: open the page with #minigame=<id>, or get the first slice.
export function playOwnSlice(): void {
  const wanted = /[#&]minigame=([^&]+)/.exec(location.hash)?.[1];
  const def = minigames.find((m) => m.meta.id === wanted) ?? minigames[0];
  if (!def) throw new Error(`games/gnomylpics has no minigames`);
  playMinigame(def, { canvas: document.getElementById('game') as HTMLCanvasElement, ui: document.getElementById('ui') as HTMLElement });
}
