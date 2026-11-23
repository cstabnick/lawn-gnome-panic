Epic: 1 Modules (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). Game:
games/gnome-theft-auto (Vite + TypeScript + three.js). If node/npx is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other workers edit other files of this game and repo at the same time: touch ONLY the files listed under Change. Do not
commit, push, stash, switch branches, run vite build / npm run build, or start a dev server. Do not edit AGENT_INDEX.md.
tsc over the whole game may show errors in files other workers are editing; only errors in YOUR files matter.

## Goal
Two pure spot finders for the Sling-Lift delivery helicopter: `findWaterSpot` (open water deep enough to set a boat
down) and `findStripSpot` (a clear, flat, dry take-off strip for a fixed-wing aircraft). No three.js, no DOM.

## Read first
- games/gnome-theft-auto/src/lockup/safeSpot.ts: `findSafeSpot`, the ring search to copy (rings from minDist to maxDist
  every RING_STEP, spokes per ring, a per-ring angle offset).
- games/gnome-theft-auto/src/lockup/safeSpot.test.ts: how a fake `SpotProbe` is built in tests.
- games/gnome-theft-auto/src/lockup/types.ts: `SpotProbe`, `DropSpot`, `WaterSpotOpts`, `StripOpts`.
- games/gnome-theft-auto/src/lockup/waterSpot.ts and stripSpot.ts: the stubs (keep their export signatures).

## Change
- games/gnome-theft-auto/src/lockup/waterSpot.ts:
  `export function findWaterSpot(cx: number, cz: number, probe: SpotProbe, opts: WaterSpotOpts): DropSpot | null`
  - Same ring search as findSafeSpot (RING_STEP 2.5, RING_ANGLE_STEP 0.37, MIN_SPOKES 8, SPOKE_SPACING 3) from
    opts.minDist to opts.maxDist. First good candidate wins (nearest ring first).
  - A candidate (x, z) is good when, checked in this order (cheap first): `probe.water(px, pz) >= opts.minDepth` at the
    centre and at the 4 points (x +- r, z) and (x, z +- r) with r = opts.radius; then `!probe.blocked(x, z, r)`.
  - Returns `{ x, y: probe.ground(x, z) + probe.water(x, z), z, yaw: Math.atan2(cx - x, cz - z) }` (y = the water
    surface: ground is the bed under water; yaw faces the search centre).
- games/gnome-theft-auto/src/lockup/stripSpot.ts:
  `export function findStripSpot(cx: number, cz: number, probe: SpotProbe, opts: StripOpts): DropSpot | null`
  - Coarser ring search (it is more expensive): RING_STEP 5, SPOKE_SPACING 6, MIN_SPOKES 8, RING_ANGLE_STEP 0.37, from
    opts.minDist to opts.maxDist (a minDist of 0 means the first ring is the centre point itself, one candidate).
  - At each candidate try 8 headings `yaw = k * Math.PI / 4` (k = 0..7). Forward is `(Math.sin(yaw), Math.cos(yaw))`.
  - A (candidate, yaw) is good when every sample point `p_s = (x + sin(yaw) * s, z + cos(yaw) * s)` for
    s = 0, 6, 12, ... up to and including the last s <= opts.length passes, checked cheap first:
    `probe.water(p) <= opts.maxWater`, `probe.slope(p) <= opts.maxSlope`; then, after all samples pass those,
    `!probe.blocked(p, opts.radius)` for every sample; and the spread (max - min) of `probe.ground(p)` over all samples
    is <= 1.5.
  - Returns `{ x, y: probe.ground(x, z), z, yaw }` for the first good one (the aircraft is set down at the strip's start,
    facing down it).
- games/gnome-theft-auto/src/lockup/waterSpot.test.ts (new, vitest, fake probes, no world):
  a lake (water depth 3 where x < 0, 0 where x >= 0; ground 0 on land, -3 in the lake, blocked never) searched from
  (10, 0) with radius 2, minDepth 1, minDist 4, maxDist 40 returns a spot with x <= -2 and y === 0 (surface = -3 + 3)
  and nearest ring first (distance from (10, 0) <= 15); all-dry returns null; a lake where `blocked` is always true
  returns null; minDepth larger than the lake depth returns null.
- games/gnome-theft-auto/src/lockup/stripSpot.test.ts (new, vitest, fake probes): open flat dry ground from (0, 0)
  with length 60, radius 4, minDist 8, maxDist 60, maxSlope 0.12, maxWater 0.05 returns a spot 8 m from the centre;
  a world blocked everywhere except a corridor `|z| < 10, x > 20` (blocked(x, z, r) true when |z| > 10 - r or x < 20 + r)
  returns a spot with yaw = PI/2 (pointing +x) inside the corridor (if no ring spoke lands in the corridor, widen it,
  but keep the assertion that yaw is PI/2); water everywhere returns null; slope 0.5 everywhere
  returns null.

## Contract
```ts
export function findWaterSpot(cx: number, cz: number, probe: SpotProbe, opts: WaterSpotOpts): DropSpot | null;
export function findStripSpot(cx: number, cz: number, probe: SpotProbe, opts: StripOpts): DropSpot | null;
// WaterSpotOpts { radius; minDist; maxDist; minDepth }   StripOpts { radius; length; minDist; maxDist; maxSlope; maxWater }
```

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/waterSpot.test.ts src/lockup/stripSpot.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your four files.

## Out of scope
safeSpot.ts (do not change it), lockup/types.ts, lockup/config.ts, runtime.ts, every other file.
