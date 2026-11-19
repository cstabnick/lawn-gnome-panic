Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/club-gnome/_env.md` first: environment and shared rules.)

## Goal
`games/club-gnome/src/walk.ts` implements click-to-walk movement as pure functions (no three.js, no DOM), with tests.

## Read first
- `games/club-gnome/src/config.ts`: `MapDef`, `Rect`, `PortalDef`, `SpotDef`, `WALK` (speed 4.2, radius 0.35, edge 0.8, arrive 0.08, turn 12).
- `games/club-gnome/src/walk.ts`: the stub you replace (keep every export and signature).

## Change
- `games/club-gnome/src/walk.ts`:
  - `Walker` keeps its fields; you may add optional fields (e.g. `stuck?: number`). `newWalker(x, z)` unchanged.
  - `obstacles(map)`: buildings and blockers as `Rect`s (a `BuildingDef` already has x, z, w, d).
  - `isBlocked(map, x, z)`: true when the point is outside `|x| <= map.w/2 - WALK.edge`, `|z| <= map.d/2 - WALK.edge`,
    or inside any obstacle rect grown by `WALK.radius` on every side (`|x - r.x| < r.w/2 + radius && |z - r.z| < r.d/2 + radius`).
  - `stepWalker(w, dt, map)`: with no target: `moving = false`, return false. Otherwise, with dist to target <=
    `WALK.arrive`: put w on the target, clear the target, `moving = false`, return true. Otherwise move
    `min(dist, WALK.speed * dt)` toward the target. If the full move lands on a blocked point, try only the x part,
    then only the z part (slide along walls), taking the first that is free. If none is free, or the walker has made
    less than 0.02 progress toward the target for 0.4 s in total (stuck sliding into a corner), clear the target, set
    `moving = false` and return true. While moving: `moving = true`, and turn `facing` toward the direction actually moved
    (`Math.atan2(dx, dz)`) at most `WALK.turn * dt` radians, along the shortest arc (wrap to [-PI, PI]). Returns false while still walking.
  - `portalAt(map, x, z)`: the first portal with `Math.hypot(p.x - x, p.z - z) <= p.r`, else null.
  - `spotNear(map, x, z)`: the nearest spot with distance <= its r, else null.
  - `nearestWalkable(map, x, z)`: clamp into the bounds (less edge); if still blocked, search rings of radius 0.25,
    0.5, ... up to 6, 16 directions each, and return the first free point (closest ring first); if none, return the clamped point.
- `games/club-gnome/src/walk.test.ts` (new, vitest). Build a small `MapDef` inside the test (do not import `maps.ts`;
  another worker is writing it): w 20, d 20, one building rect at (0, -5, 4, 2), one blocker, one portal, two spots.
  Test: walking across open ground arrives at the target in about dist / speed seconds (step dt = 1/60); walking into
  the building slides along it or stops (never ends inside a blocked point); `isBlocked` at the bounds; `nearestWalkable`
  pushes a point out of the building; `portalAt` / `spotNear` (nearest of two overlapping spots wins); facing turns toward +x
  when walking right (ends near PI/2).

## Contract
The stub's exports, verbatim signatures:
```ts
export interface Walker { x: number; z: number; facing: number; target: { x: number; z: number } | null; moving: boolean }
export function newWalker(x: number, z: number): Walker;
export function obstacles(map: MapDef): Rect[];
export function isBlocked(map: MapDef, x: number, z: number): boolean;
export function stepWalker(w: Walker, dt: number, map: MapDef): boolean;
export function portalAt(map: MapDef, x: number, z: number): PortalDef | null;
export function spotNear(map: MapDef, x: number, z: number): SpotDef | null;
export function nearestWalkable(map: MapDef, x: number, z: number): { x: number; z: number };
```

## Done when
- `npx tsc --noEmit -p games/club-gnome` shows no error in `walk.ts` or `walk.test.ts`.
- `npm test -w games/club-gnome -- src/walk.test.ts` passes.

## Out of scope
Every other file. Do not edit `config.ts`, `main.ts` or `maps.ts`.
