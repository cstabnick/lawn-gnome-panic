Epic: 4 (manuals, snow, polish; in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/view/rider.ts`: show manuals (the board tipped onto its nose or tail, the gnome balancing), and stop the board
from looking like it clips into the ground: the board and gnome sit visibly on top of the surface.

## Read first
- `games/aether-board/src/view/rider.ts`: the rider (you own it; keep `RiderView` and `createRider(scene, w, camera?)`).
- `games/aether-board/src/config.ts`: `Player.manual` (`{ kind: 'nose' | 'tail'; balance: -1..1; vel; t } | null`;
  0 = perfect balance, ±1 = dropping out), `Player.normal`, `Player.mode`.

## Change
- `src/view/rider.ts`:
  - **No clipping**: the island meshes are a coarse grid, so between grid points the drawn ground can sit above the
    exact physics surface. Lift the whole rider (board + gnome, not the shadow or trail) by 0.12 m along the ground
    normal on the ground and on rails (ease it to 0 in the air over 0.2 s). Also make sure the deck's bottom is at the
    root (the board's thickness sits above `pos`, not centred on it). Check by eye in screenshots on slopes and kickers.
  - **Manual pose** while `p.manual` is set: tip the board pivot about its lateral axis so one end touches down: nose
    manual = nose down, tail up (pitch about 0.32 rad, the pivot moved to the nose end so the nose stays on the ground);
    tail manual = the mirror (tail down). Ease in over 0.1 s, out over 0.15 s. The gnome: weight over that end
    (rig leans 0.25 rad toward it), arms out wide for balance; `balance` drives a visible wobble: the gnome and board
    roll by `balance × 0.35` rad and the arms windmill faster as |balance| grows past 0.6. When `p.manual` ends (it was
    set last frame and is null now) with the gnome still on the ground, a quick 0.2 s "drop" (board slaps flat, small
    squash).
  - Keep everything else (grabs, grinds, personality, shadow, trail). No per-frame allocations.

## Contract
`RiderView` and `createRider(scene: THREE.Scene, w: World, camera?: THREE.Camera)` unchanged.

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5205 --strictPort` in the
  background; Playwright (`require('playwright')`; `chromium.launch()`): open `http://localhost:5205/#mute`, wait for
  `window.ab`, click the canvas, hold `KeyW` 1.5 s, then hold `KeyQ` (GRAB 1 → nose manual) for 2 s while pressing
  `KeyS` / `KeyW` briefly to balance; screenshot during it to /tmp/ab-manual/nose.png; release, hold `KeyE` (tail
  manual), screenshot /tmp/ab-manual/tail.png; also a screenshot riding normally on a slope (/tmp/ab-manual/ride.png)
  showing the board on top of the ground. No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.
