Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/gnome-blackjack/_env.md`: environment and repo rules.)

## Goal
The 3D table: a cosy felt blackjack table with the dealer gnome behind it, five seated gnomes, cards that slide out of the shoe, chip stacks for bets and a ring for whose turn it is. `src/scene.ts` renders any `TableState` it is given.

## Read first
- `games/gnome-blackjack/src/scene.ts`: the stub you replace.
- `games/gnome-blackjack/src/config.ts`: `TableState`, `Seat`, `Card`, `SEAT_COUNT`, `DEALER` (-1).
- `games/gnome-blackjack/src/characters.ts`: `CHARACTERS[id].look` (CPU looks), `DEALER_CHAR.look`.
- `packages/gnome/src/types.ts` lines 90-150: `GnomeLook`, `GNORMAN_LOOK`, `PlayerState`, `GnomeModel` (`object`, `arms.left/right` pivots: rotation.x -2.4 = arms up, `update(p, dt)`). The model is about 1.25 tall, head centre at y 0.8, faces +z at facing 0.
- `games/gnome-blackjack/src/app.ts`: the camera (read only): `PerspectiveCamera(50)`, position (0, 3.4, 4.2), lookAt (0, 0.5, 0.2); portrait screens pull it back ×1.6.

## Change
- `src/scene.ts`, three 0.187 (`import * as THREE from 'three'`; `import { createGnomeModel, resolveLook, GNORMAN_LOOK, type GnomeModel, type PlayerState } from '@lawn/gnome'`):
  - **Room and light**: floor plane 30×30 colour 0x2a1a10 (`MeshStandardMaterial`, roughness 0.9) at y 0; `HemisphereLight(0xffe8c0, 0x201008, 0.8)`; a warm `SpotLight(0xffd9a0, 40, 12, 0.7, 0.5)` at (0, 5, 0.5) aimed at (0, 0, 0.2), `castShadow` (shadow map 1024); a few dim warm `PointLight`s far off for a pub feel. Everything must fit x -2.8..2.8, z -1.8..2.6.
  - **Table**: felt top at `TABLE_Y = 0.5`: a half disc (`CylinderGeometry(2.3, 2.3, 0.06, 48, 1, false, 0, Math.PI)`, rotated so the flat edge runs along x at z = -0.9 and the round side points to +z, toward the camera), felt green 0x1f6b3a; a wooden rim (`TorusGeometry` half arc, colour 0x5a3418) along the curved edge; a dark base under it; a few simple legs. `receiveShadow` on the felt.
  - **Seats** on an arc of radius 2.55 around (0, -, -0.9): seat i angle `θ = Math.PI * (0.12 + 0.76 * i / (SEAT_COUNT - 1))`, `x = 2.55 * Math.cos(θ)`, `z = -0.9 + 2.55 * Math.sin(θ)`. Seat 0 is at +x (screen right), seat 4 at -x. A small toadstool stool at each seat. Each gnome faces the table centre: `facing = Math.atan2(0 - x, -0.9 - z)`.
  - **Gnomes**: one `GnomeModel` per occupied seat, rebuilt when that seat's `id` changes (remove the old `object`). Look: CPU → `CHARACTERS[seat.character].look`; human → `resolveLook({ id: seat.id, character: seat.character }) ?? GNORMAN_LOOK`, with `hat: seat.color`. Every frame call `model.update(pose, dt)` with a `PlayerState` `{ position, velocity: new Vector3(), facing, grounded: true, jumpsUsed: 0 }` (reuse the objects). The turn seat's gnome bobs (y + 0.03 × sin(4t)); in 'payout' a gnome whose hand result is 'win' or 'blackjack' hops (y + |sin(8t)| × 0.15) with both arms up (`arms.left.rotation.x = arms.right.rotation.x = -2.4` after update), a 'bust'/'lose' gnome slumps (rig.rotation.x = 0.25). The dealer gnome (`DEALER_CHAR.look`) stands at (0, 0, -1.4) facing +z, and is scaled 1.15.
  - **Cards**: `PlaneGeometry(0.22, 0.31)` lying flat on the felt (`rotation.x = -Math.PI / 2`), y = `TABLE_Y + 0.035 + 0.002 × k` for the k-th card. Face textures: a `CanvasTexture` per distinct card (cache by `${r}${s}`) on a 128×180 canvas: cream rounded rectangle, rank + suit in the top-left and bottom-right, a big suit in the middle, red (#c0262d) for H/D, near-black for S/C; set `texture.colorSpace = THREE.SRGBColorSpace`. One back texture: deep red with a gold mushroom-ish pattern. Player cards: in front of the seat at radius 1.75 on the same arc, fanned 0.13 apart along the arc tangent, each rotated to face its seat. Dealer cards: row centred at (0, -, -0.45), 0.16 apart. The dealer's second card shows the back while `st.holeHidden`.
  - **Animation**: keep one mesh per (owner, index) slot; when a slot's card first appears, its mesh starts at the shoe (1.7, TABLE_Y + 0.12, -0.6) and moves to its target over 0.3 s (lerp by dt). When a hand is cleared (cards gone), remove the meshes. A dealer card flipping from back to face swaps texture.
  - **Shoe**: a small dark box at (1.7, TABLE_Y + 0.08, -0.6).
  - **Chips**: per seat with `bet > 0` (or `hand.bet` once dealt), a stack of `min(12, ceil(bet / 5))` chips (`CylinderGeometry(0.06, 0.06, 0.016, 20)`), colours by value step (5 red 0xd03030, 10 blue 0x3050d0, 25 green 0x30a050, 50 black 0x202020), at radius 1.35 on the seat's arc. Rebuild the stack only when the amount changes.
  - **Turn ring**: a `RingGeometry(0.28, 0.34, 32)` flat on the felt under the turn seat's cards, coloured `seat.color`, pulsing opacity; hidden when `st.turn < 0`.
  - `headPos(seat, out)`: world point 0.25 above the top of that gnome's hat: seat position + (0, 1.45, 0); `DEALER` → (0, 1.65, -1.4). Works for empty seats too.
  - No DOM, no `window` use (the canvas and camera belong to app.ts).

## Contract
```ts
export interface TableView {
  sync(st: TableState, dt: number): void;
  headPos(seat: number, out: THREE.Vector3): THREE.Vector3;
}
export function createTableView(scene: THREE.Scene): TableView;
```

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes for your file.
- Optional visual check (only you use this port): `cd games/gnome-blackjack && npx vite --port 5196 --strictPort` in the background, then a Playwright screenshot of `http://localhost:5196/#offline` after 6 s (`require('playwright')` works from any directory; `chromium.launch()` needs no options; save the PNG in /tmp/bj-scene/). The table may still be empty if the rules worker has not finished: that is fine. Stop the server afterwards.

## Out of scope
table.ts, cards.ts, banter.ts, mutter.ts, hud.ts, net.ts, app.ts, config.ts, characters.ts.
