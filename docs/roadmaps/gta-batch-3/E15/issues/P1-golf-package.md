Epic: E15-0 (golf course: the shared golf package)
Depends on: none
Agent: general-purpose (Sonnet): a careful extraction that must not change Gnome Golf's behaviour

## Environment
- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a4e21ba147e1c7b8b` (Git Bash). Use absolute
  paths; `cd` resets between commands. Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed; after adding the new package run `npm install` once at the repo root (it links the
  workspace; no new external dependencies).
- The lead edits `games/gnome-theft-auto` at the same time. You own `packages/golf/` and `games/gnome-golf/`. Never commit,
  never push, never `git stash`.
- Line endings: keep LF. Edit existing files with the Edit tool (never `sed -i`). `git diff --stat` must show only real changes.
- Repo rule: Gnome Golf's build and tests must still pass and its behaviour must not change. If making something
  instance-based would change Gnome Golf's behaviour, leave Gnome Golf's version alone and put a separate copy-free API
  in the package only where it is pure and identical.

## Goal
A new workspace package `packages/golf` (`@lawn/golf`) holds Gnome Golf's pure golf maths: club and lie tuning, ball
physics (`simulateShot` against any course given as plain functions), the swing meter step, scoring names, seeded wind,
water drops, and a generic hole-feature lie. Gnome Golf imports these from the package (its own modules re-export them,
so every other Gnome Golf import is unchanged) and plays exactly as before. Gnome Theft Auto will import the same
package next (not your job).

## Read first
- `games/gnome-golf/src/config.ts` lines 1-140 and 200-270: `ClubId`, `CLUB_ORDER`, `ClubDef`, `CLUBS`, `Lie`, `LieDef`,
  `LIES`, `WEDGE_SAND_POWER`, `PHYS`, `SWING`, `Circle`, `HoleDef`, `TEE_HALF`, `FRINGE`, `FlightEvent`, `ShotResult`,
  `SwingState`, `Shot`, `Wind`. (`HOLES`, `ISLAND`, `ROUND`, `PARTY`, cart and disc things stay in the game.)
- `games/gnome-golf/src/physics.ts` (all of it): `launchSpeed`, `liePower`, `powerScale`, `estimateCarry`, `powerFor`,
  `windVelocity`, `simulateShot`, `previewShot`, `previewLanding`. It reads the singleton course (`heightAt`, `gradientAt`,
  `lieAt` from `./course`) and `collide` from `./obstacles`, and builds `THREE.Vector3`s.
- `games/gnome-golf/src/course.ts` (all): `createCourse`, `distToPath`, `holeLength`, the singletons.
- `games/gnome-golf/src/round.ts` lines 80-130 and 400-415: `SEA_MOWER_CHANCE`, `seaMowerCatch`, `playableLie`,
  `restingSpot`, `seededWind`, `scoreName`.
- `games/gnome-golf/src/controls.ts` lines 290-320 and 530-559 (the three-tap swing: tap logic and meter travel).
- `packages/oakcount/package.json`, `tsconfig.json`, `README.md`: the shape of a small package (exports `./src/index.ts`).

## Change
1. **Golden first.** Before touching any Gnome Golf source, add `games/gnome-golf/src/shot.golden.test.ts`: a fixed table
   of about 24 shots on the real course (every club at least once, tee/fairway/rough/sand/green lies, wind on and off,
   accuracy -1/-0.3/0/0.5/1, power 0.4/1/1.1, starts on several holes' tees and greens, `previewShot` too) run through
   today's `simulateShot`; record per shot `end` (x,y,z), `endLie`, `holed`, `carry`, `apex`, `total`, `duration`,
   `points.length`, the event kinds, and a hash of all points rounded to 1e-9, into `shot.golden.json` (capture with
   `GOLDEN_CAPTURE=1`, like `course.golden.test.ts` does). Commit nothing; just make sure it passes before and after.
2. **`packages/golf/`**: `package.json` (`"name": "@lawn/golf"`, private, type module, `exports` `./src/index.ts`, scripts
   `typecheck` and `test`, devDependencies `typescript` 7.0.2 and `vitest` 5.1.0 like oakcount; **no three.js**),
   `tsconfig.json` (copy oakcount's), `README.md`, and `src/`:
   - `tuning.ts`: the types and tables listed above, moved verbatim from config.ts (`ClubId`, `CLUB_ORDER`, `ClubDef`,
     `CLUBS`, `Lie`, `LieDef`, `LIES`, `WEDGE_SAND_POWER`, `PHYS`, `SWING`, `Circle`, `HoleDef`, `TEE_HALF`, `FRINGE`,
     `FlightEvent`, `Shot`, `Wind`, `SwingState`) plus `interface Vec3 { x: number; y: number; z: number }`.
   - `physics.ts`: the same functions, made course-agnostic:
     ```ts
     export interface CourseEnv {
       heightAt(x: number, z: number): number;          // ground height, yards
       gradientAt(x: number, z: number): { gx: number; gz: number };
       lieAt(x: number, z: number): Lie;
       /** Optional obstacles (trees, carts): as gnome-golf's obstacles.ts collide; may push p and change v. */
       collide?(p: Vec3, v: Vec3, r: number): 'trunk' | 'leaves' | 'cart' | null;
     }
     export interface ShotResult { points: Vec3[]; sampleDt: number; duration: number; events: FlightEvent[]; end: Vec3;
       endLie: Lie; holed: boolean; carry: number; apex: number; total: number; dropPoint: Vec3 | null }
     export function simulateShot(env: CourseEnv, start: Vec3, shot: Shot, lie: Lie, wind: Wind, pin: { x: number; z: number },
       opts?: { noWind?: boolean; stopAtLanding?: boolean }): ShotResult;
     export function previewShot(env: CourseEnv, start: Vec3, club: ClubId, lie: Lie, yaw: number, pin: { x: number; z: number }): ShotResult;
     export function launchSpeed(club: ClubId): number;           // unchanged
     export function liePower(club: ClubId, lie: Lie): number;
     export function powerScale(club: ClubId, power: number): number;
     export function estimateCarry(club: ClubId, lie?: Lie, power?: number): number;
     export function powerFor(club: ClubId, lie: Lie, dist: number): number;
     export function windVelocity(wind: Wind): { x: number; z: number };
     ```
     The body of `simulateShot` is today's, with `heightAt`/`gradientAt`/`lieAt`/`collide` read from `env` (when
     `env.collide` is missing, treat it as returning null) and plain `{x,y,z}` objects instead of `Vector3` (copy points,
     never share one object between two samples). Keep every numeric step identical (same order of operations), the
     sea check (`ground < 0.02 && p.y <= 0`) and the `ground > 0.3` dry tracking included.
   - `swing.ts`: the pure three-tap meter lifted from controls.ts:
     ```ts
     export type SwingEvent = { kind: 'start' } | { kind: 'power'; power: number } | { kind: 'fire'; power: number; accuracy: number } | null;
     /** A tap: idle -> power (start), power -> accuracy (locks power = marker), accuracy -> fire with accuracy = clamp(-marker / SWING.accuracyWindow, -1, 1). */
     export function swingTap(sw: SwingState): SwingEvent;
     /** Meter travel for dt seconds (scale = speed multiplier, 1 normally; putts rise SWING.puttRiseScale times slower).
      *  Overswing past SWING.maxPower locks power automatically; falling past -0.3 fires with accuracy 1. */
     export function swingStep(sw: SwingState, dt: number, club: ClubId, scale?: number): SwingEvent;
     ```
     Both mutate `sw` in place exactly as controls.ts does today. Gnome Golf's controls.ts may call them if that keeps
     its behaviour identical (its sound/flash side effects stay in controls.ts); otherwise leave controls.ts as is.
   - `scoring.ts`: `scoreName(strokes, par, mode?: 'golf' | 'disc')`, `SEA_MOWER_CHANCE`, `seaMowerCatch(f: { end: { x: number; z: number }; endLie: Lie })`,
     `restingSpot(from, f)`, `seededWindFrom(seed: number, hole: number, maxWind: number): Wind` (today's `seededWind`
     body with `ROUND.maxWind` as a parameter), `playableLie(lieAt: (x: number, z: number) => Lie, x: number, z: number): Lie`.
   - `course.ts`: `createCourse`, `IslandParams`, `CourseSource`, `distToPath`, `holeLength` moved from Gnome Golf
     (pure; they import `TEE_HALF`, `FRINGE`, `HoleDef`, `Lie` from `./tuning`), plus a NEW generic helper for other
     courses (do not use it inside `createCourse`, so the island stays byte-identical):
     ```ts
     /** The lie from hole features only (no island, no coast): green > sand (bunker r * 0.9) > fringe (green r + FRINGE)
      *  > tee (TEE_HALF square) > fairway (distToPath < width / 2 and along > fairwayStart) > water (pond r) > 'rough'.
      *  Same priorities and tests as createCourse's lieAt minus the coast and height checks. */
     export function featureLie(holes: readonly HoleDef[], x: number, z: number): Lie;
     ```
   - `index.ts`: re-exports everything above.
   - Tests in `packages/golf/src/`: `physics.test.ts` (a flat env `{ heightAt: () => 1, gradientAt: () => ({gx:0,gz:0}), lieAt: () => 'fairway' }`:
     a perfect full driver from the tee with no wind carries `CLUBS.DR.carry` within 0.5 yd; same input twice gives
     deep-equal results; a putt toward the pin on a flat green holes when the pin is at 0.9 x `estimateCarry('PT','green',p)`),
     `swing.test.ts` (tap/step sequences: start, power lock, fire accuracy sign; overswing auto-lock; late fire = 1),
     `scoring.test.ts` (score names -3..+4 and hole in one; seededWindFrom deterministic and within maxWind),
     `course.test.ts` (featureLie on a hand-made hole: each lie at a chosen point).
3. **Gnome Golf uses the package** (`games/gnome-golf/package.json` dependency `"@lawn/golf": "*"`):
   - `config.ts`: replace the moved definitions by `export { ... } from '@lawn/golf'` / `export type { ... }` so every
     existing `import { CLUBS, type Lie } from './config'` still works. Gnome Golf's own `ShotResult` keeps
     `THREE.Vector3` points (its ball, camera and audio use Vector3 methods): define it in config.ts as today.
   - `course.ts`: `createCourse`, `distToPath`, `holeLength`, `IslandParams`, `CourseSource` re-exported from the package;
     keep the module-level `DEFAULT` and the exported singletons exactly as now.
   - `physics.ts`: a thin wrapper: `const ENV: CourseEnv = { heightAt, gradientAt, lieAt, collide }` (the game's
     singletons and obstacles.ts `collide`), and `simulateShot(start: THREE.Vector3, ...)` / `previewShot` /
     `previewLanding` with today's signatures call the package and convert `points`, `end`, `dropPoint` to Vector3.
     Re-export `launchSpeed`, `liePower`, `powerScale`, `estimateCarry`, `powerFor`, `windVelocity` from the package.
   - `round.ts`: `scoreName`, `SEA_MOWER_CHANCE`, `seaMowerCatch`, `restingSpot` re-exported from the package;
     `seededWind(seed, hole)` = `seededWindFrom(seed, hole, ROUND.maxWind)`; `playableLie(x, z)` = package
     `playableLie(lieAt, x, z)`. `discPhysics.ts` stays in the game.
4. `AGENT_INDEX.md`: do NOT edit (the lead adds the package row).

## Contract
The exports named above, with exactly those names and signatures; `@lawn/golf` has no three.js and no DOM. The lead's
Gnome Theft Auto code will call `simulateShot(env, start, shot, lie, wind, pin)`, `previewShot`, `swingTap`, `swingStep`,
`scoreName`, `seededWindFrom`, `restingSpot`, `seaMowerCatch`, `featureLie`, `distToPath`, `holeLength`, `CLUBS`,
`CLUB_ORDER`, `LIES`, `PHYS`, `SWING`, `estimateCarry`, `powerFor` and the types.

## Done when
- `npm test -w packages/golf` passes; `npx tsc --noEmit -p packages/golf` passes.
- `npm test -w games/gnome-golf` passes, including the unchanged `course.golden.test.ts` and your new
  `shot.golden.test.ts` whose fixture was captured BEFORE the refactor and was not recaptured after.
- `npm run build -w games/gnome-golf` passes.
- `git diff --stat` shows no whole-file rewrites from line endings.
- Report: what moved, what stayed, whether controls.ts uses `swingStep`/`swingTap`, any behaviour question.

## Out of scope
`games/gnome-theft-auto/**`, `AGENT_INDEX.md`, Gnome Golf's lobby, party slice, level editor, disc physics, UI.
