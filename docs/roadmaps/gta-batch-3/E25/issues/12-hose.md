Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Pure maths (`hose.ts`) plus a small three.js view (`hoseView.ts`).

## Goal
The fire hose: ballistic stream maths (where it lands, the arc points), tank and ladder helpers, and the stream drawn as
water droplets running along the arc with a splash where it lands.

## Read first
- `games/gnome-theft-auto/src/workplaces/firefighter/hose.ts`: the stub (`HoseAim`, `HOSE`, `hoseLanding`, `hoseArc`,
  `Tank`, `drainTank`, `refillTank` (done), `LadderStep`, `LADDER`, `stepLadder`).
- `games/gnome-theft-auto/src/workplaces/firefighter/hoseView.ts`: the stub (`HoseView`, `createHoseView`).
- `games/gnome-theft-auto/src/fx.ts`: how its instanced particles are built (reuse the approach, do not import fx).

## Change
- `games/gnome-theft-auto/src/workplaces/firefighter/hose.ts`:
  - `hoseLanding(nozzle, aim, groundY)`: velocity v = HOSE.speed * (sin(yaw) cos(pitch), sin(pitch), cos(yaw)
    cos(pitch)); solve y(t) = nozzle.y + vy t - g t^2 / 2 = groundY for the positive root (if the nozzle is below
    groundY, still return the later root, or t 0 when none); return the point and t.
  - `hoseArc(nozzle, aim, groundY, n, out)`: n points evenly in time from 0 to the landing t (n >= 2), written x, y, z;
    returns n (clamped to out.length / 3).
  - `stepLadder(ext, hold, wasHeld, dt, band)`: while hold, ext += LADDER.rate * dt; if ext > 1 -> { ext: 0, event:
    'bonk' }. On release (wasHeld && !hold): ext within band -> event 'rescue' (ext kept); else nothing. Not held:
    ext stays.
- `games/gnome-theft-auto/src/workplaces/firefighter/hose.test.ts` (new): level shot from 1 m lands where the formula
  says; 45 degrees lands farther than 10 and 80 degrees (same height); arc first point is the nozzle and last is the
  landing; drainTank never goes below 0 and returns less when nearly empty; stepLadder bonk and rescue cases.
- `games/gnome-theft-auto/src/workplaces/firefighter/hoseView.ts`: `createHoseView(scene)`: an InstancedMesh of ~120
  small stretched spheres (pale blue-white, slightly transparent, MeshStandardMaterial or Basic) that flow along the
  given arc (each droplet has a phase 0..1 along the arc that advances by dt / 0.6 and wraps; interpolate along the
  points; a little random jitter growing toward the end); a splash at the last point: a ring of 12 short-lived
  droplets bouncing up (built in code). `set(null, 0, dt)` hides it (count 0). `frustumCulled = false`. `dispose`
  removes and disposes its own geometry and material.

## Contract
Stub signatures unchanged in both files.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/firefighter/hose.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`firefighter/types.ts`, every other file.
