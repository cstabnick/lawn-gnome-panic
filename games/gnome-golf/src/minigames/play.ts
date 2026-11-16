// Plays this game's slice alone (#minigame=<id>, or the first slice) against 3 CPUs.
import { playMinigame, type AnyMinigame } from '@lawn/party';
import { minigames } from './index';

export function playOwnSlice(): void {
  const id = /[#&]minigame=([a-z0-9-]+)/.exec(location.hash)?.[1];
  const def: AnyMinigame | undefined = minigames.find((m) => m.meta.id === id) ?? minigames[0];
  if (!def) throw new Error('gnome-golf has no party slice');
  playMinigame(def, {
    canvas: document.getElementById('game') as HTMLCanvasElement,
    ui: document.getElementById('ui') as HTMLElement,
  });
}
