// Plays one of this game's slices alone against 3 CPUs: #minigame=<id>, or the first slice when no id is given.
import { playMinigame } from '@lawn/party';
import { minigames } from '.';

export function playOwnSlice(): void {
  const id = /[#&]minigame=([a-z0-9-]+)/.exec(location.hash)?.[1];
  const def = minigames.find((m) => m.meta.id === id) ?? minigames[0];
  playMinigame(def, {
    canvas: document.getElementById('game') as HTMLCanvasElement,
    ui: document.getElementById('ui') as HTMLElement,
  });
}
