Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files in `games/final-collectathon/src/` right now. Edit only your files. `tsc` may show errors in their files mid-edit; only yours must be clean.

## Goal

Replace the stub `games/final-collectathon/src/collect.ts` with the real, pure collecting simulation (items, magnet
pickups, multiplier, falling "rain", number formatting) and cover it with a vitest file. It is pure (no DOM, no
three) because the game, its chapters and its party slice all call it.

## Read first

- `games/final-collectathon/src/collect.ts`: the stub; keep every exported name and signature.
- `games/final-collectathon/src/types.ts`: `Item`, `Pickup`, `CollectState`, `ItemKind`, `Rect`.
- `games/final-collectathon/src/config.ts`: `TUNING` (`magnet`, `itemRestY` 0.35, `itemFallG` 14, `rainHeight` 6, `maxLiveItems` 400) and `ITEM_KINDS[kind].value`.

## Change

`games/final-collectathon/src/collect.ts`, every function:

- `emptyCounts()`, `createCollectState(seed)`: as in the stub (seed stored as an unsigned 32-bit int: `seed >>> 0`).
- `rand(s)`: mulberry32 on `s.seed` (advance `s.seed`, return [0,1)). Deterministic: the same seed gives the same sequence. Never `Math.random`.
- `spawnItem(s, kind, x, z, y?, prefab?)`: if `s.items.length >= TUNING.maxLiveItems` return null. Else push `{ id: s.nextId++, kind, x, y: y ?? TUNING.itemRestY, z, vy: 0, falling: false, prefab }` (omit `prefab` when undefined) and return it.
- `scatter(s, kind, n, r, y?)`: n `spawnItem`s at `x = r.x0 + rand*(r.x1-r.x0)`, same for z, keeping 0.4 m from the rectangle's edges. Returns how many spawned.
- `rain(s, kind, n, r, height = TUNING.rainHeight)`: like scatter but each item starts at `y = height + rand*2`, `falling: true`.
- `stepCollect(s, collectors, dt)`: `s.t += dt`. Falling items: `vy -= TUNING.itemFallG * dt; y += vy * dt`; when `y <= TUNING.itemRestY` set `y = itemRestY, vy = 0, falling = false`. Then for each item, the first collector (index `by`) with xz distance `< s.magnet` and `|collector.y + 0.5 - item.y| < 1.5` takes it: remove it from `s.items`, `amount = ITEM_KINDS[kind].value * s.multiplier`, `s.counts[kind] += amount`, `s.total += amount`, push a `Pickup { id, kind, x, y, z, amount, by, prefab? }`. Falling items can be taken in the air. Return the pickups (empty array if none). Remove taken items in one pass (filter), not with splice in a loop.
- `clearItems(s, kind?)`: as in the stub.
- `formatCount(n)`: 
  - not finite or `n >= 1e100` → `'∞'`
  - `n < 1000` → `String(Math.floor(n))`
  - `n < 1e6` → thousands with commas: `Math.floor(n).toLocaleString('en-US')` (e.g. `'12,345'`)
  - `n < 1e15` → one decimal with a suffix: M, B (1e9), T (1e12): `'1.2M'`, `'3.0B'`, `'4.5T'`
  - else scientific with one decimal: `'1.2e18'` (use `n.toExponential(1).replace('e+', 'e')`)

`games/final-collectathon/src/collect.test.ts` (new, vitest: `import { describe, expect, it } from 'vitest'`):
- same seed → same `rand` sequence; different seeds differ
- `scatter` puts every item inside the rectangle and returns n; `spawnItem` returns null past `maxLiveItems`
- a collector standing on an item picks it up, counts and total go up by `value * multiplier`, the item is gone
- a collector 5 m away picks nothing up; raising `magnet` to 6 picks it up
- rained items fall and come to rest at `itemRestY`
- `formatCount`: 0 → '0', 999 → '999', 12345 → '12,345', 1_200_000 → '1.2M', 3e9 → '3.0B', 4.5e12 → '4.5T', 1.2e18 → '1.2e18', Infinity → '∞', 1e120 → '∞'

## Contract

Keep exactly these exports (other modules and the party slice call them):
```ts
export function emptyCounts(): Record<ItemKind, number>;
export function createCollectState(seed: number): CollectState;
export function rand(s: CollectState): number;
export function spawnItem(s: CollectState, kind: ItemKind, x: number, z: number, y?: number, prefab?: string): Item | null;
export function scatter(s: CollectState, kind: ItemKind, n: number, r: Rect, y?: number): number;
export function rain(s: CollectState, kind: ItemKind, n: number, r: Rect, height?: number): number;
export function stepCollect(s: CollectState, collectors: readonly { x: number; y: number; z: number }[], dt: number): Pickup[];
export function clearItems(s: CollectState, kind?: ItemKind): void;
export function formatCount(n: number): string;
```
No DOM, `window` or three imports in `collect.ts`. `CollectState` must stay plain JSON.

## Done when

- `npm test -w games/final-collectathon` passes (runs your test).
- `npx tsc --noEmit -p games/final-collectathon` shows no errors in `collect.ts` or `collect.test.ts`.

## Out of scope

Every other file under `games/final-collectathon/` (`types.ts` and `config.ts` are fixed), all packages.
