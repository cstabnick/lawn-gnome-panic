Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none (issue 10 adds the rows at the same time; ids already exist in `src/anim/types.ts`)
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. `src/anim/persona.ts`, `src/anim/playerIdle.ts` and `src/npcs.ts`
are CRLF: edit with the Edit tool only and check `git diff --stat`.

## Goal
L63: the game picks among the new variants: each townsgnome gets a seeded gait (its own walk overlay and a walking
speed a few percent off the norm), flee, horn-startle, anger and cheer reactions vary, and the player's fidgets have
three more picks and never repeat back to back.

## Read first
- `games/gnome-theft-auto/src/anim/persona.ts`: `Persona`, `walkStyleFor(p, r, w)`, `WALK`, `idleFor`, `pick`.
- `games/gnome-theft-auto/src/anim/playerIdle.ts`: `POOL`, `pickFidget(biome, night, r)`, `createIdleFidget(r)`.
- `games/gnome-theft-auto/src/npcs.ts`: `startFlee` (~262: `a.panic = Math.random() < 0.5 && a.anim.play('panic', {
  loop: true })`), `startWalkStyle(a)` (~274), the walking speed use (`PEDESTRIANS.walkSpeed` ~492-494), the horn
  reaction (~687-694: `a.anim.play('shake-fist')`, `a.anim.play(a.persona === 'nervous' ? 'jump-back' :
  'startle-horn')`), `cheerAt` (~700: `a.anim.play(a.trait === 'spectator' ? 'cheer' : 'clap')`). `Npc.id` is a number.
- `games/gnome-theft-auto/src/anim/types.ts` `VARIANT_IDS` (the new ids).

## Change
- `src/anim/persona.ts` (pure, add):
  ```ts
  export interface Gait { style: LibId | null; speedMul: number }
  /** A townsgnome's own gait, stable per id: plain walkers get walk-easy / walk-brisk / walk-amble / none; everyone gets
   *  speedMul 0.9..1.12. Night still makes most walk sleepily (as walkStyleFor). */
  export function gaitFor(id: number | string, p: Persona, r: Rand = Math.random, w: AnimWorld = world): Gait;
  /** Flee arms: 'panic' or one of run-cover-head / run-look-back / run-arms-up (null = the hands-up pose in npcs.ts). */
  export function fleeStyleFor(r: Rand = Math.random): LibId | null;
  export function startleFor(p: Persona, r: Rand = Math.random): LibId;   // nervous: 'jump-back' | 'startle-hop'; else 'startle-horn' | 'startle-hop' | 'startle-spin' (spin rare, 10 %)
  export function angerFor(r: Rand = Math.random): LibId;                  // 'shake-fist' | 'fist-wave-both' | 'stomp-off'
  export function cheerFor(trait: string | undefined, r: Rand = Math.random): LibId; // spectator: 'cheer' | 'cheer-jump' | 'cheer-whistle'; else 'clap' | 'cheer'
  ```
  `gaitFor` hashes `String(id)` (FNV-1a like `pickFor` in `anim/index.ts`) for the stable part: style for 'plain' =
  `['walk-easy', 'walk-brisk', 'walk-amble', null][h % 4]`, other personas keep `WALK[p]`; `speedMul = 0.9 + ((h >>> 8)
  % 23) / 100`; the night rule uses `r` exactly like `walkStyleFor`. `fleeStyleFor`: 40 % 'panic', 15 % each variant,
  15 % null.
- `src/anim/playerIdle.ts`: add 'idle-weight-shift', 'idle-hat-adjust', 'idle-look-back' to `POOL`; `createIdleFidget`
  remembers the last pick and re-rolls once if the same id comes up again.
- `src/npcs.ts`: `startFlee` uses `fleeStyleFor()` (play it looped when non-null; `a.panic` true when one plays);
  `startWalkStyle` uses `gaitFor(n.id, a.persona)` (change its signature to take `n` too, update its callers) and the
  walking speed multiplies `PEDESTRIANS.walkSpeed` by the gnome's `speedMul` (store it on the aux record `a.speedMul`,
  set when the aux is made; default 1); horn: `angerFor()` instead of 'shake-fist', `startleFor(a.persona)` instead of the
  jump-back / startle-horn choice; `cheerAt`: `cheerFor(a.trait)`. Change nothing else in npcs.ts.
- New `src/anim/variety.test.ts`: `gaitFor` is stable for the same id and gives speedMul within [0.9, 1.12]; over ids
  0..199 plain walkers get at least 3 different styles; `startleFor`, `angerFor`, `cheerFor`, `fleeStyleFor` only return
  ids that `animById` knows (or null) once issue 10 lands; until then assert only that they are in the expected lists;
  `createIdleFidget` with a fixed random never returns the same id twice in a row over 50 fidgets.

## Contract
Signatures above, exactly. `walkStyleFor` stays (other callers may use it).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/anim/variety.test.ts src/anim/round3.test.ts` passes.
- `npx tsc --noEmit -p .` passes.
- `npm test -w games/gnome-theft-auto -- src/minigames` passes (the party slice must still work).

## Out of scope
`src/anim/variants.ts`, `src/anim/anim.test.ts` (issue 10), `src/anim/types.ts`, `src/anim/index.ts`, `src/online/`.
