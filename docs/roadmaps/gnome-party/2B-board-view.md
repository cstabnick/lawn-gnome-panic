~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
The 3D board: a loop of coloured spaces on a lawn, the star, four gnome tokens that hop along during a move, a die, and a camera that follows whoever is moving. It only draws PartyState; it never changes it.

## Read first
- games/gnome-party/src/config.ts: PartyState, Phase, MoveEvent, BoardState, BOARD, TIMING (hopS, afterMoveS)
- packages/party/src/types.ts: SeatInfo
- games/gnome-party/src/board/view.ts: the stub you replace
- games/gnome-bowling/src/lane.ts: example of building meshes from three primitives with lights (read only, do not import)

## Change
- games/gnome-party/src/board/view.ts: implement the Contract.

## Contract (keep these exports exactly)
import * as THREE from 'three';
import type { PartyState } from '../config';

export interface BoardView {
  /** The board's own scene; main.ts renders it with `camera` when no minigame runs. */
  readonly scene: THREE.Scene;
  /** Every frame. Builds the board on first call (and rebuilds if state.seed changes). */
  render(state: Readonly<PartyState>, dt: number): void;
  dispose(): void;
}
export function createBoardView(camera: THREE.PerspectiveCamera): BoardView;

What to draw:
- Lawn: large green plane, hemisphere + directional light with shadows, sky-blue background.
- Spaces: state.board.spaces.length discs (CylinderGeometry radius 0.55, height 0.12) on an oval: space i at
  angle a = i / n * 2π, x = 9 * cos(a), z = 6 * sin(a). Blue 0x3d7bff, red 0xff4a4a; space 0 has a white ring.
- Star: a spinning yellow (0xffd54f) OctahedronGeometry(0.45) floating 1.4 above space board.starAt.
  When a 'starMoved' event plays, it flies there along an arc over 0.8 s.
- Tokens: one createGnomeModel(seat.look) per seat (from '@lawn/gnome'); several on one space stand in a small square
  (offsets ±0.25). Drive each with a PlayerState ({ position, velocity, facing, grounded, jumpsUsed: 0 }) and g.update(pose, dt).
- Move animation, phase 'move': elapsed = phase.total - phase.left. Event k (only 'hop' events take time) plays during
  [k*TIMING.hopS, (k+1)*TIMING.hopS): token goes from its space to `to` with a hop arc (height 0.6 * sin(π t)), facing
  along the move. 'star' and 'coins' events show a floating text above the token for 1 s at the hop where they happen
  ("+3", "-3", "★ +1", "need 20 coins"): use a CanvasTexture on a Sprite.
  Outside 'move', tokens stand on board.players[seat].space. Before the phase arrives, players[].space is already the
  END space (the host moved them), so animate from the space `events.filter(hop).length` hops before it.
- Die: during 'roll', a white BoxGeometry(0.6) spinning above the current seat's token; during 'move', it shows phase.die
  (draw pips or the number on a CanvasTexture) and shrinks away after the last hop.
- Camera: lerp (1 - exp(-dt*3)) to 6 above and 7 behind (toward the oval centre's opposite side) the token of the seat
  in phase 'roll'/'move'; in other phases a wide view of the whole oval from (0, 16, 14) looking at the centre.
- dispose(): remove everything and dispose geometries, materials and textures.

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes.
- The file builds every piece above from state alone (no module-level state other than constants).

## Out of scope
main.ts calls this; hud.ts draws the scoreboard (not you). Do not edit any other file.
~~~~
