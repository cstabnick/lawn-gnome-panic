// Draws both mowers, crew, fires, shields and projectiles for CombatScene.
// STUB: bodies below are placeholders; signatures are final.
import Phaser from 'phaser';
import type { CombatState, Side } from '../sim/types';

export class CombatView {
  /** Set by CombatScene. Called when a room rectangle is clicked (left button). */
  onRoomClicked: (side: Side, roomId: number) => void = () => {};
  /** Set by CombatScene. Called when a crew sprite is clicked. */
  onCrewClicked: (side: Side, crewId: number) => void = () => {};

  constructor(protected scene: Phaser.Scene, _state: CombatState) {}

  /** Call every frame (also while paused). Reads state.log for effects; CombatScene empties the log afterwards. */
  update(_state: CombatState): void {}

  /** Highlight this player crew member (null = none). */
  setSelectedCrew(_crewId: number | null): void {}

  /** While true, enemy rooms highlight on hover (a weapon is being aimed). */
  setTargeting(_active: boolean): void {}

  /** Pixel centre of a room. */
  roomCenter(_side: Side, _roomId: number): { x: number; y: number } {
    return { x: 0, y: 0 };
  }
}
