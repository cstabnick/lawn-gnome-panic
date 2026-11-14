// src/ui/hud.ts: crosshair, health, ammo, tickets, flags, kill feed, minimap, prompts, title and end screens. STUB: filled in by epic 2.
import { DOM_IDS, type Game, type InputState } from '../config';

export type Overlay = 'title' | 'paused' | 'none';

export interface Hud {
  update(dt: number, input: InputState): void;
  setOverlay(mode: Overlay): void;
}

/** root is the shared #ui element: append your own container, never restyle #ui. onPlay runs on a click of the Play / Resume button. */
export function createHud(root: HTMLElement, game: Game, onPlay: () => void): Hud {
  void game;
  const el = document.createElement('div');
  el.id = DOM_IDS.hud;
  root.appendChild(el);
  const title = document.createElement('div');
  title.id = DOM_IDS.title;
  title.style.pointerEvents = 'auto';
  const play = document.createElement('button');
  play.id = DOM_IDS.play;
  play.textContent = 'PLAY';
  play.onclick = onPlay;
  title.appendChild(play);
  root.appendChild(title);
  return {
    update() {},
    setOverlay(mode) {
      title.style.display = mode === 'none' ? 'none' : 'block';
    },
  };
}
