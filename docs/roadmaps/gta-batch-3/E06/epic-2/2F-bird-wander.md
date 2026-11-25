Epic: E06-2 Fill (Sky, weather and time), issue 2F bird flight variety (L19)
Depends on: none
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto`. Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the files listed under Change. Do not commit. Keep LF line endings.

## Goal
User request (L19): "more variation in bird flying path. don't just have follow static route". Today a birding flock flies
a straight line to its perch at a fixed altitude, and circles at a fixed radius, always counter-clockwise, round a fixed
centre. After this issue flights wander (heading drift, altitude changes), and circles vary in radius and direction and
their centre drifts.

## Read first
- `games/gnome-theft-auto/src/birding/flock.ts`: `createFlock`, `circleFlock`, `stepFlying`, `stepCircling`. The module is pure and allocates nothing per step; keep it so. Randomness only through `env.rnd()`.
- `games/gnome-theft-auto/src/birding/types.ts`: `interface Flock` (line ~147).
- `games/gnome-theft-auto/src/birding/flock.test.ts`: existing expectations to keep green.

## Change
- `games/gnome-theft-auto/src/birding/types.ts`: add to `Flock` (with doc comments):
  `wanderT: number` (seconds to the next wander re-roll), `wanderYaw: number` (rad, added to the steering heading),
  `wanderAlt: number` (m, added to cruise altitude), `circleR: number` (multiplier on the circling radius), `circleDir: 1 | -1` (1 = the old counter-clockwise).
- `games/gnome-theft-auto/src/birding/flock.ts`:
  - `createFlock`: initialise `wanderT: 0, wanderYaw: 0, wanderAlt: 0, circleR: 1, circleDir: 1`.
  - `sendFlock`: `f.wanderT = 0` (roll on the first flying step).
  - In `stepFlying` (not for runners; they use stepRunning): `f.wanderT -= dt; if (f.wanderT <= 0) { f.wanderT = 2 + env.rnd() * 3; f.wanderYaw = (env.rnd() - 0.5) * 1.2; f.wanderAlt = (env.rnd() - 0.5) * 0.8 * sp.altitude; }`. Steer at `Math.atan2(dx, dz) + f.wanderYaw * fade` where `fade = clamp((dH - 20) / 40, 0, 1)` (no wander within 20 m of the target, so landings stay exact). Cruise height `base + sp.altitude + f.wanderAlt * fade` (the `near` branch unchanged). Because the heading turn rate is limited (2.5 rad/s), the path curves gently.
  - `circleFlock`: also roll `f.circleR = 0.7 + env.rnd() * 0.9` and `f.circleDir = env.rnd() < 0.5 ? 1 : -1`.
  - `stepCircling` (non-hover): `R = (8 + sp.size * 12) * f.circleR`; angular step `f.circleDir * (sp.speed / R) * dt`; heading for `circleDir === 1` stays `Math.atan2(-Math.sin(a), Math.cos(a))`, for `-1` it is `Math.atan2(Math.sin(a), -Math.cos(a))`; the centre drifts slowly: `f.tx += Math.cos(t * 0.07 + f.id) * 1.2 * dt; f.tz += Math.sin(t * 0.05 + f.id * 1.7) * 1.2 * dt;`. Bank sign keeps following which side the centre is on (the existing `side` code already does).
- `games/gnome-theft-auto/src/birding/flock.test.ts`: add tests: two flocks of the same species sent to the same far target with different `rnd` sequences take different paths (positions differ by > 1 m halfway) and both still arrive (mode becomes 'perched' within a generous time); a circling flock with `circleDir -1` moves clockwise (the angle round the centre decreases); `circleR` stays within 0.7..1.6 after `circleFlock`.

## Contract
New `Flock` fields exactly: `wanderT: number; wanderYaw: number; wanderAlt: number; circleR: number; circleDir: 1 | -1;`. No signature of an exported function changes. Online bird mirrors (`src/online/birdSync.ts`) send positions only; no change there.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes (if another file builds a `Flock` literal and breaks, report it; the lead will fix it).
- `npx vitest run src/birding src/online/birdSync.test.ts` passes.

## Out of scope
`src/critters*` (critter birds are a separate system), `src/birding/birding.ts`, `src/birding/spawner.ts`, every other file.
