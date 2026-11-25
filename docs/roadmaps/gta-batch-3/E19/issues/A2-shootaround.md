Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/court/shootaround.ts` and `court/shootaround.test.ts`. Others edit other court/ files.

## Goal
Free shooting at Drainpipe Court: the player walks round with a ball, holds Shoot to fill a release meter, lets go,
and the ball arcs to the nearer hoop and goes in or not depending on the release timing and the distance. Pure: no
three.js, no DOM.

## Read first
- `games/gnome-theft-auto/src/court/types.ts`: `COURT` (hoops, hoopY, threeRadius), `SHOOT` (fillS, sweetLo,
  sweetHi, flightPerM), `ShootEvent`.

## Change
`src/court/shootaround.ts`:
```ts
export interface ShootState {
  phase: 'hold' | 'charge' | 'flight';
  charge: number;            // 0..1 while charging
  makes: number; shots: number;
  /** In flight: start (world), the hoop aimed at, flight time and clock, whether it goes in, and if it was a three. */
  flight: { sx: number; sy: number; sz: number; hx: number; hz: number; dur: number; t: number; make: boolean; three: boolean; swish: boolean } | null;
}
export function newShoot(): ShootState;
/** One frame. down = the shoot control held now. (px, pz) the player's feet, groundY the court ground height.
 *  rand: a 0..1 random number (Math.random in the game, fixed in tests). */
export function stepShoot(s: ShootState, dt: number, down: boolean, px: number, pz: number, groundY: number, rand: number): ShootEvent;
/** The ball's world position: in flight along the arc, else in the player's hands (px, groundY + 0.7, pz). */
export function ballAt(s: ShootState, px: number, pz: number, groundY: number): { x: number; y: number; z: number };
/** The nearer hoop to (x, z). */
export function nearestHoop(x: number, z: number): { x: number; z: number; side: 'left' | 'right' };
/** A three: farther than COURT.threeRadius from that hoop. */
export function isThree(x: number, z: number): boolean;
```
- 'hold' -> 'charge' when `down`; charge rises by dt / SHOOT.fillS (capped at 1); on release ('charge' and not down):
  phase 'flight', shots + 1, event `{ kind: 'release', charge, three }`.
- Make chance: in the sweet spot (sweetLo..sweetHi) 0.85 at the rim falling linearly to 0.45 at 7 m; outside it the
  chance is halved for each 0.1 the charge is off the sweet spot; threes get x0.85; farther than 9 m always misses.
  `make = rand < chance`; `swish` when make and the charge is within the middle third of the sweet spot.
- Flight: dur = max(0.6, distance * SHOOT.flightPerM); the arc is a parabola from (px, groundY + 1.1, pz) to the rim
  (hoop x, groundY + COURT.hoopY, hoop z) with an apex 1.2 m above the higher end; a miss ends 0.35 m short of the rim
  centre (an off-rim clang). When t >= dur: event make `{ kind: 'make', three, swish }` (makes + 1) or
  `{ kind: 'miss', clang: true }`; phase 'hold'.
- Else null.

`src/court/shootaround.test.ts`: charge to 0.8 and release next to a hoop with rand 0.1 -> release then make; release
at 0.2 with rand 0.5 -> miss; isThree at the centre line true and under the hoop false; `ballAt` mid-flight is above
both ends; makes/shots counts.

## Contract
The exports above, exactly (court/runtime.ts uses them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court/shootaround.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
