Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read the "Environment" section of `docs/roadmaps/gta-batch-3/E29/_common.md` (working directory, node path, do not
commit, other workers edit other files). Game: `games/gnome-theft-auto` (TypeScript, vitest).

## Goal
`planStreetRow()` in `games/gnome-theft-auto/src/eurokit/street.ts` packs European buildings into a dense, irregular
terrace row (pure maths, deterministic), with a test.

## Read first
- `games/gnome-theft-auto/src/eurokit/street.ts` (the stub: keep every exported name and signature)
- `games/gnome-theft-auto/src/eurokit/catalog.ts` (`EURO_BUILDINGS`, `EuroBuilding`, `EURO_WALL_TINTS`, `EURO_ROOF_TINTS`, `euroBuilding`)

## Change
- `games/gnome-theft-auto/src/eurokit/street.ts`: implement `planStreetRow(o: StreetRowOpts): EuroPlacement[]`:
  - Frame: the row runs along local +x from the start point; building fronts face local +z. A local point (a, c)
    (a along the row, c across, + toward the street) maps to world
    `x = o.x + a * Math.cos(o.yaw) + c * Math.sin(o.yaw)`, `z = o.z - a * Math.sin(o.yaw) + c * Math.cos(o.yaw)`
    (three.js `rotation.y = yaw`). Every placement's `yaw = o.yaw`, `scale = 1`.
  - Deterministic RNG from `o.seed` (write a small mulberry32: `let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }`).
  - Candidates: `o.mix` (ids; unknown ids are skipped) or, by default, every `EURO_BUILDINGS` entry with role `'terrace'`.
  - Walk a cursor `a` from 0. Pick a candidate at random, never the same id twice in a row when there are 2+ candidates.
    If `a + width > o.length` try the narrower candidates; stop when none fits. Place it at along `a + width / 2`,
    across `-(depth / 2) - setbackJitter` where `setbackJitter = rng() * (o.setback ?? 0.35)` (so fronts sit 0..setback
    behind the frontage line: an irregular street face). Then `a += width + PARTY_GAP`.
  - Paint: `tint` from `EURO_WALL_TINTS`, never equal to the previous building's tint; `trim` from `EURO_ROOF_TINTS`.
  - `o.corner`: when true, before filling, reserve the corner building (`'euro-corner-cafe'`, width from the table) at the
    END of the row (its right side at `o.length`), fill the rest up to `o.length - cornerWidth - PARTY_GAP`, then append
    the corner. If the corner alone does not fit, skip it.
  - Return placements in order along the row.
- `games/gnome-theft-auto/src/eurokit/street.test.ts` (new, vitest): 
  - same seed gives the same result; different seeds differ;
  - with yaw 0 and start (0, 0): every building's x-extent `[x - w/2, x + w/2]` lies in `[0, length]`, consecutive
    buildings are separated by at least `PARTY_GAP - 1e-9` and at most `PARTY_GAP + 1e-9` (packed tight);
  - no two neighbours share an id or a tint (when 2+ choices exist);
  - every front (`z + depth/2` at yaw 0) is between `-setback` and 0;
  - with yaw `Math.PI / 2` the placements are the yaw-0 ones rotated (check one point with the formula above);
  - `corner: true` puts `'euro-corner-cafe'` last with its right side at `length` (within 1e-6);
  - a length shorter than every width returns `[]`.

## Contract
```ts
export const PARTY_GAP = 0.12;
export interface EuroPlacement { id: string; x: number; z: number; yaw: number; scale: number; tint?: number; trim?: number }
export interface StreetRowOpts { x: number; z: number; yaw: number; length: number; seed: number; mix?: readonly string[]; setback?: number; corner?: boolean }
export function planStreetRow(o: StreetRowOpts): EuroPlacement[];
```
`x`/`z` are the building's centre on the ground (its prefab origin). Do not import three.js.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your two files.
- `cd games/gnome-theft-auto && npx vitest run src/eurokit/street.test.ts` passes.

## Out of scope
`eurokit/catalog.ts` (read only), `eurokit/showcase.ts`, `eurokit/signs.ts`, and every other file.
