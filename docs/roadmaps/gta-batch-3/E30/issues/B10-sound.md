Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Many workers edit other files of
`games/gnome-theft-auto` at the same time; touch only the files below. World axes: +x east, +z south, metres.

## Goal
Pardonlin sounds like a town: the steeple bell tolls on the town's hour, an accordion phrase drifts off the quay,
cups clink on café terraces, pigeons coo on the squares, boules clack on the Grand Platz, the bakery door bell rings.

## Read first
- `games/gnome-theft-auto/src/pardonlin/sound.ts`: your file (stub with the final signature; app.ts already calls it).
- `games/gnome-theft-auto/src/fishing/sounds.ts`: how a module defines its own synthesized recipes and registers them
  (`registerSound(id, recipe)`), the `Recipe` type and the synth helpers it uses (`../sound/synth`).
- `games/gnome-theft-auto/src/sound/bus.ts`: `registerSound`, `hasSound`, `playAt(id, { x, z }, { gain, maxDist,
  param, bus: 'ambience' })` (positional one-shot; returns false when dropped).
- `games/gnome-theft-auto/src/atmosphere.ts`: `CYCLE_SECONDS` (360 s day) if you tie the bell to the day clock;
  simpler: a bell every 90 s of real time.

## Change
- `games/gnome-theft-auto/src/pardonlin/sounds.recipes.ts` (new): synthesized recipes (no audio files), ids prefixed
  `pl-`: `pl-bell` (a deep church bell: inharmonic partials, long decay, 3-4 s), `pl-accordion` (a short wheezy
  reed phrase: 3-5 detuned square/saw notes in a minor-key waltz figure, 2-3 s, bellows swell), `pl-cup-clink`
  (porcelain tink), `pl-coo` (pigeon coo: a soft low warble), `pl-boules-clack` (metal knock), `pl-shop-bell` (a little
  door bell ting-a-ling), `pl-murmur` (a short burst of café chatter: filtered noise with syllable-like amplitude
  wobble). Export `PL_SOUND_IDS` and `registerPardonlinSounds()` (registers each once, `hasSound` guard).
- `games/gnome-theft-auto/src/pardonlin/sound.ts`: keep the exported names and signature:
  ```ts
  export interface PardonlinSound { update(dt: number, px: number, pz: number, night: number, inside: boolean): void }
  export function createPardonlinSound(): PardonlinSound
  ```
  Export `SOUND_SPOTS: readonly { id: string; kind: 'bell' | 'accordion' | 'cafe' | 'pigeons' | 'boules' | 'bakery'; x: number; z: number; every: [number, number] }[]`
  with: bell at the Grand Platz (-1500,-250) every [90, 90] (tolls 3 times, 2.2 s apart); accordion on the quay
  (-1586,180) every [14, 26]; cafés at (-1522,160), (-1522,200), (-1530,-215) every [3, 7] (clinks and murmurs
  alternating); pigeons at (-1510,-240), (-1733,150), (-1520,-340) every [5, 11]; boules at (-1545,-250) every [6, 14];
  bakery at (-1522,140) every [10, 20]. Register the recipes on the first update (not at import). Each spot plays only
  when the listener is within its range (bell 400 m, accordion 45, others 30), with `bus: 'ambience'`; no street
  sounds while `inside`; at night (night > 0.6) only the bell and an occasional murmur. Timers per spot, seeded
  offsets so spots do not fire together. Nothing at all when the listener is more than 700 m from (-1600, 100).
- `games/gnome-theft-auto/src/pardonlin/sound.test.ts` (new): every `SOUND_SPOTS` entry is inside Pardonlin
  (x -1800..-1398, z -900..1100), `every[0] <= every[1]`, and every `PL_SOUND_IDS` id starts with `pl-`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/pardonlin/sound.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`sound/bus.ts`, `sound/ambience.ts`, `app.ts`, every other file.
