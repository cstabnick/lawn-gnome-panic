// Scoreboard, ROLL button, intro/results/final cards. STUB: issue 2F fills it in. Keep the exported signatures.
import type { PartyState } from '../config';
import type { SeatIndex } from '@lawn/party';

export interface Hud {
  show(s: Readonly<PartyState>, mySeat: SeatIndex | null): void;
  update(dt: number): void;
}

export function createHud(parent: HTMLElement, h: { onRoll(): void; onBackToMenu(): void }): Hud {
  const root = document.createElement('div');
  root.id = 'gp-hud';
  root.style.cssText = 'position:absolute;left:0;right:0;top:8px;text-align:center;font:600 18px system-ui;text-shadow:0 1px 3px #000';
  parent.appendChild(root);
  void h;
  return {
    show(s) { root.textContent = `Round ${s.board.round} / ${s.board.rounds} · ${s.phase.p}`; },
    update() {},
  };
}
