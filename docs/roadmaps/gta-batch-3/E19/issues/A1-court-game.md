Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/court/game.ts` and `court/game.test.ts`. Others edit other court/ files at the same time.

## Goal
A pickup basketball game at Drainpipe Court is GBA GJAM's own simulation (`JamSimulation` from `@lawn/jam`) run 2v2:
the player and Pansy against two regulars or against Cardoon "Swish" Trowelly and Lintel, first to N points. This
module wraps the sim with no three.js scene and no DOM: create, step with the player's control, report events, and
give a world-space view for rendering.

## Read first
- `games/gnome-theft-auto/src/court/types.ts` (all: `COURT_*`, `simToWorld`, `PICKUP`, `Opponents`, `PickupOpts`,
  `CourtEvent`, `CourtGnomeView`, `PickupView`, `CourtControl`, `CourtGameResult`, `COURT_PEOPLE`).
- `games/gnome-theft-auto/src/sports/types.ts` (`SPORTS_CAST` looks for cardoon, lintel, pansy).
- `packages/jam/README.md` and `packages/jam/src/index.ts`; `packages/jam/src/sim.ts` (constructor, `step(dt, p1In,
  p2In)`, `score`, `phase`, `players` (`pos`, `vel`, `facing`, `grounded`, `turbo`, `shootHold`, `dunk`, `isShooting`),
  `ball` (`pos`, `carrier`, `mode`, `shooter`), `p1ControlIdx`, `SimCallbacks`), `packages/jam/src/types.ts`
  (`MatchConfig`, `GnomePlayerProfile`, `PlayerStats`, `MatchResult`), `packages/jam/src/sim.test.ts` (a headless match).
- `games/gba-gjam/src/main.ts`: how GJAM steps the sim each frame (fixed step or variable dt, how edge inputs are
  passed) and how it builds a `MatchConfig` for an AI match. Copy its step pattern.
- `packages/gnome/src/types.ts` (`GnomeLook`, `GNORMAN_LOOK` to fill a `Partial<GnomeLook>` into a full look).

## Change
`src/court/game.ts`:
```ts
import type { GnomeLook } from '@lawn/gnome';
export interface PickupGame { /* the JamSimulation, target, opponents, t (seconds), groundY, done, won, events queue... */ }
/** groundY: the court's ground height (heightAt(COURT_ORIGIN)). myLook: the player's gnome (null: GNORMAN_LOOK). */
export function newPickup(myLook: GnomeLook | null, groundY: number, opts?: PickupOpts): PickupGame;
/** Advance by dt seconds (the sim stepped at the fixed rate GJAM uses; edge inputs only on the first sub-step). */
export function stepPickup(g: PickupGame, dt: number, ctl: CourtControl): CourtEvent[];
export function pickupView(g: PickupGame): PickupView;
export function pickupResult(g: PickupGame): CourtGameResult | null;   // null until done
export function disposePickup(g: PickupGame): void;
```
- Rosters: home = [the player (name 'You', number 1, `myLook` filled to a full `GnomeLook`, stats 65/60/60/60), Pansy
  (from `COURT_PEOPLE.pansy` stats and `SPORTS_CAST.pansy.look`)]; away = opponents 'swish' -> Cardoon and Lintel
  (their stats and looks); 'regulars' -> two passers-by from a small fixed list in this file (names like 'Sorrel
  Dribblesby', 'Clem Hookshot', 'Teasel Brick', 'Ivy Layup'; plain looks; stats around 45-55), picked by `opts.seed`
  (default 0). `opponentMode: 'ai'`, `difficulty` from `PICKUP.difficulty[opponents]`, `quarterSeconds:
  PICKUP.quarterSeconds`, every bot slot the default (classic) bot. Fill every `GnomePlayerProfile` field the type needs.
- Ending: done when a team reaches `target` (default `PICKUP.target`), or when `t >= PICKUP.maxSeconds` and the score
  is not tied (the leader wins; tied: play on until the next basket), or if the sim's phase becomes 'finished'
  (the leader wins; a tie there counts as a loss). Emit `{ kind: 'end', won, score }` once.
- Events from the callbacks: `onSound` -> `{ kind: 'sound', id, x, z }` at the ball's world position ('bounce' ->
  'jam-bounce', 'swish'/'swish3' -> 'jam-swish', 'clang' -> 'jam-clang', 'dunk'/'dunkFire' -> 'jam-dunk',
  'whistle'/'buzzer' -> 'jam-whistle', 'cheer' -> 'jam-cheer'; drop the rest); `onBurst` -> `burst` in world
  coordinates; `onRimShake` -> `rim`. A score: compare `sim.score` before and after each sub-step; `points` = the
  difference (2 or 3), `dunk` true when that basket was a dunk (the scoring player had a `dunk` state or a dunk sound
  came this sub-step), `byPlayer` true when the scorer (the ball's `shooter`, or the dunker) is home index 0.
  Ignore `onAnnounce`, `onCameraPunch`, `onAchievement`, `onMatchEnd` (the runtime decides achievements from events).
- `pickupView`: every sim player through `simToWorld`, `y = groundY + pos.y * COURT_SCALE`, `yaw = facing`, speed from
  `vel`, `hasBall` from `ball.carrier`, `air` from `!grounded`, slot = index, names; the ball likewise; `score` [home,
  away]; `charge` = the controlled home player's `shootHold` normalised to 0..1 (look at how GJAM's UI shows it);
  `turbo` of the controlled player; `controlled` = `sim.p1ControlIdx`; `phase` mapped ('quarterBreak' -> 'live').
- The player's control: `stepPickup` passes `ctl` as p1's `PlayerControlInput` (same fields) and an idle input for p2.

`src/court/game.test.ts` (vitest; stub `Math.random` with `mulberry32` from `@lawn/jam` via `vi.spyOn` so runs repeat):
- a game to 5 with an idle player (no input) and a game to 5 with a simple scripted player (move toward the ball,
  shoot when holding it) both end with exactly one 'end' event within 400 simulated seconds at dt 1/60;
- every 'score' event has points 2 or 3 and the view's score matches the running sum;
- every gnome in `pickupView` stays within `COURT.halfX + 2`, `COURT.halfZ + 2` of the court centre;
- `pickupResult` is null before the end and matches the end event after; `opponents: 'swish'` puts Cardoon's name in
  the view.

## Contract
The signatures above, exactly (court/runtime.ts calls them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court/game.test.ts` passes (keep it under ~10 s).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`packages/jam` and `games/gba-gjam` (do not change them; if the package lacks something, say so in your report),
other court/ files.
