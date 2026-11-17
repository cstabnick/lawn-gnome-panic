Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/view/rider.ts`: the player's gnome, cel-shaded, riding a graffiti snowboard. It shows everything the physics does:
leaning into carves, crouching to pop, spins and flips, the board flipping under the feet for kickflips and shove-its,
grabs, boardslides on rails, tumbling bails, a blob shadow, and a glowing trail.

## Read first
- `games/aether-board/src/view/rider.ts`: the stub you replace (keep `RiderView`, `createRider(scene, w)`).
- `games/aether-board/src/config.ts`: `Player` (pos, vel, heading, mode, normal, crouch, spin, flip, trick, grab, grind,
  switchStance, flow, boosting), `PALETTE`.
- `games/aether-board/src/physics.ts`: `boardPose(p)` → `{ roll, shove, pitch }` (board-only trick rotation, radians) and
  `forwardOf(heading, out)`. Heading convention: nose along (sin h, 0, cos h); increasing h turns left.
- `games/aether-board/src/world.ts`: `groundAt(w, x, z, maxY)` → `{ y, normal } | null`.
- `games/aether-board/src/view/toon.ts`: `toonify(root, thickness)`, `toonMat`, `addOutline`.
- `packages/gnome/src/types.ts` lines 90-150: `GnomeModel` (`object`, `rig`, `arms.left/right` pivots: rotation.x
  −2.4 = arms up, `legs`, `update(p, dt)`), `GNORMAN_LOOK`. Model ~1.25 tall, faces +z.

## Change
- `src/view/rider.ts`:
  - **Gnome**: `import { createGnomeModel, getMyGnome, GNORMAN_LOOK } from '@lawn/gnome'`. Look:
    `getMyGnome()?.look ?? { ...GNORMAN_LOOK, hat: PALETTE.pink, shirt: PALETTE.cyan, pants: 0x3a2a6a }`. Then
    `toonify(model.object, 0.02)`. Call `model.update(pose, dt)` each frame with a still `PlayerState` (velocity 0,
    grounded true) so it stands, then set limb rotations yourself after it. Snowboard stance: the gnome stands across
    the board, turned −90° about y (it faces the board's right side).
  - **Board**: deck 1.35 long (along z) × 0.36 wide × 0.05 thick, rounded ends (two half-discs). Top: a `CanvasTexture`
    (256×64) with a JSR graffiti design (hot pink base, yellow zigzag, cyan "AETHER" in bold italic) on a toon material;
    edges cyan with emissive 0.6; `addOutline(deck, 0.02)`.
  - **Hierarchy**: `root` (at `pos`, oriented: up = `p.normal` on the ground / grind, world up in the air, eased with
    slerp at rate 14/s; yaw = `p.heading`) → `body` (flips and lean) → { `boardPivot` (board-only trick rotations) → deck;
    `riderPivot` (crouch, hop, grabs) → gnome }.
  - **Ground**: lean into carves: roll `body` about the board's long axis by `−steer * 0.35 * min(1, speed / 20)`. Crouch:
    `riderPivot` y −0.28 × `p.crouch`, gnome rig slightly bent (`rig.rotation.x = 0.3 * crouch`), arms swing back. Idle
    sway with speed. Brake (lean < 0 is not given to you: use speed dropping fast) is optional.
  - **Air**: `p.heading` already includes the spin. Flip: rotate `body` about the board's lateral axis (x) by `p.flip`.
    Arms out for balance (rotation.z ±0.8). During a board trick (`p.trick`), apply `boardPose(p)` to `boardPivot`
    (roll about z, shove about y, pitch about x) and lift `riderPivot` 0.3 m (the board flips under the feet), easing back
    at the end. Grabs: `p.grab === 1` (Indy) crouch 0.6 and the right arm reaches down to the toe edge
    (`arms.right.rotation.x ≈ 1.6`, z −0.4); `2` (Melon) the left arm to the heel edge. Board tilts 0.25 rad while grabbing.
  - **Grind**: boardslide: `boardPivot` yaw +π/2 (board across the rail), the gnome faces forward, arms out, slight crouch.
  - **Bail**: tumble: `body` rotates about x at 9 rad/s and about z at 4 rad/s while `p.mode === 'bail'`; reset smoothly
    after.
  - **Shadow**: a dark transparent disc (`CircleGeometry(0.7)`, `MeshBasicMaterial` 0x2b0a5a, opacity 0.45,
    `depthWrite: false`) placed on `groundAt(w, pos.x, pos.z, pos.y + 0.5)` (+0.04, aligned to its normal), shrinking and
    fading with height above it (gone above 25 m). Hidden when no ground.
  - **Trail**: a ribbon from the board's tail: keep the last 48 positions of the left and right tail corners (sample
    every frame when moved > 0.15 m); one `BufferGeometry` triangle strip, vertex colours with alpha fade along its length
    (use a `ShaderMaterial` or `MeshBasicMaterial` with `vertexColors`, `transparent`, `blending: AdditiveBlending`,
    `depthWrite: false`, `side: DoubleSide`). Colour by flow: cyan (0) → pink (0.5) → yellow (1); brighter while boosting.
    Shown when speed > 14 or in the air; fades out otherwise. Pre-allocate the buffers; no per-frame allocations.
  - Reset trail and orientation instantly on a teleport (the position jumps more than 8 m in a frame).

## Contract
```ts
export interface RiderView { update(p: Player, pos: THREE.Vector3, dt: number, steer: number): void }
export function createRider(scene: THREE.Scene, w: World): RiderView;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- Visual check (only you use this port): `cd games/aether-board && npx vite --port 5199 --strictPort` in the background,
  Playwright screenshot of `http://localhost:5199/` after 4 s (`require('playwright')`; `chromium.launch()`; save to
  /tmp/ab-rider/): the gnome stands on its board at the spawn. No console errors. Stop the server afterwards.

## Out of scope
Every other file in `games/aether-board/src`.
