// STUB (Epic 1). Draws a Board, takes swipe/tap input, and animates BoardEvents with juice.
import Phaser from 'phaser';
import type { Board, BoardEvent, Pos } from '../engine/types';
import type { Rect } from '../layout';

export class BoardView {
  /** Called when the player asks for a swap (swipe, or tap one piece then a neighbour). */
  onSwap: (a: Pos, b: Pos) => void = () => {};

  constructor(scene: Phaser.Scene, board: Board, rect: Rect, cell: number) {
    void scene; void board; void rect; void cell;
  }

  /** Move/resize to a new rect (screen resize). */
  layout(rect: Rect, cell: number): void {
    void rect; void cell;
  }

  setInputEnabled(on: boolean): void {
    void on;
  }

  /** Animate events in order; resolves when done. Afterwards the sprites match `board` exactly (resync). */
  play(events: readonly BoardEvent[], board: Board, speed = 1): Promise<void> {
    void events; void board; void speed;
    return Promise.resolve();
  }

  /** Screen centre of a cell, for HUD effects (goal fly-ins). */
  cellCenter(p: Pos): { x: number; y: number } {
    void p;
    return { x: 0, y: 0 };
  }

  destroy(): void {}
}
