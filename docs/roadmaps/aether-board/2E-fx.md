Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/aether-board/_env.md`: environment and repo rules.)

## Goal
`src/view/fx.ts`: the effects that sell speed and impact: anime speed lines, wind streaks rushing past, landing bursts,
grind sparks, boost afterimages, pops of dust, and screen flashes. Loud, bright, cheap.

## Read first
- `games/aether-board/src/view/fx.ts`: the stub you replace (keep `Fx`, `createFx(scene, camera, ui)`).
- `games/aether-board/src/config.ts`: `Player` (vel, mode, boosting, flow, normal, grind), `PhysEvent` (land: perfect,
  impact; bail; pop; grindStart/grindEnd (ley); boostStart; warp; respawn), `PALETTE`.
- `games/aether-board/src/app.ts`: `fx.update(player, renderPos, dt, frameEvents)` once per frame (events of this frame).

## Change
- `src/view/fx.ts`:
  - **Speed lines (screen space)**: a `<canvas>` in your own container appended to `ui` (`position:fixed; inset:0;
    pointer-events:none`; never restyle `#ui`). Backing size = half the window size (CSS-scaled), resized on `resize`.
    Every frame clear it and draw N thin wedges from the screen edge toward the centre (random angle, start radius 0.75-1.1
    of the half-diagonal, length 15-40 % of it, white with alpha 0.25-0.6). N = 0 below 22 m/s, up to 70 at 55 m/s; while
    boosting +30 and tinted pink/cyan. The centre keeps a clear oval (lines never reach within 35 % of the half-diagonal).
  - **Wind streaks (3D)**: one `LineSegments` of 90 streaks (pre-allocated `BufferGeometry`, additive white, transparent,
    `depthWrite: false`, `fog: false`) living in a 40 m box around the rider. Each streak moves by `−vel × dt × 0.6` (they
    rush past), length `min(6, speed × 0.08)` along the velocity; respawn ahead of the rider (random point in front within
    the box) when it falls 20 m behind. Opacity by speed (0 below 15 m/s).
  - **Particles**: one pooled `Points` system (600 particles, `vertexColors`, size ~0.35, additive, `depthWrite: false`)
    with per-particle position, velocity, gravity, life. Emitters:
    - 'land': a ring burst of 18 at the rider's feet (outward along the ground plane from `p.normal`), colours from
      PALETTE; 'perfect' → 36, yellow and pink, faster.
    - 'pop': 8 dust puffs (lilac) under the board.
    - grinding (`p.mode === 'grind'`): 6 sparks per frame thrown back and up; yellow/orange on rails, cyan/pink on
      ley-lines (track `ley` from the last 'grindStart').
    - boosting: 4 afterimage particles per frame behind the rider, pink/cyan, slow.
    - 'bail': 30 stars in all directions.
  - **Rings**: a pool of 6 flat additive rings (`RingGeometry(0.6, 0.9, 32)`) for 'land': placed at the feet aligned to
    `p.normal`, scaling 1 → 6 over 0.45 s while fading. Perfect landings get a second, yellow ring.
  - **Flashes**: a CSS overlay `div` in your container: 'land' perfect → white-pink flash (opacity 0.22 → 0 in 0.15 s);
    'warp' → a rainbow (`linear-gradient` of PALETTE colours) at 0.8 → 0 over 0.7 s; 'bail' → a red tint 0.25 → 0.
    While boosting, a soft pink/cyan vignette (`radial-gradient`, transparent centre) at opacity 0.5 that fades out when
    boosting stops.
  - No per-frame allocations (reuse vectors, colours and arrays). On a teleport (rider moves > 8 m in a frame), reset the
    streaks around the new position.

## Contract
```ts
export interface Fx { update(p: Player, pos: THREE.Vector3, dt: number, events: PhysEvent[]): void }
export function createFx(scene: THREE.Scene, camera: THREE.PerspectiveCamera, ui: HTMLElement): Fx;
```

## Done when
- `npx tsc --noEmit -p games/aether-board` passes for your file.
- `grep -n "new THREE\.\|new Float32Array" games/aether-board/src/view/fx.ts` shows allocations only inside
  `createFx` (not in `update` or functions it calls each frame).

## Out of scope
Every other file in `games/aether-board/src`.
