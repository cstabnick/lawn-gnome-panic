Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (mobile rules matter here).

## Goal
"Post Sorting", a small full-screen tap game: letters arrive one at a time, each addressed to a resident of one of
Loamdeep's six halls; the player taps the matching pigeonhole before the clock runs out. Works with touch, mouse and
keys 1-6.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`HallId`, `HALL_IDS`, `HALL_NAMES`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/societies/loamdeep/sortingUi.ts` (yours: the stub with the exported signatures)
- `games/gnome-theft-auto/src/workplaces/shiftCard.ts` (a full-screen card appended to `ui`: how this game builds DOM,
  styles inline/with a scoped `<style>`, closes and cleans up; copy the approach)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/sortingUi.ts`: keep the exported signatures; add pure helpers:
  - `export const HALL_SYMBOL: Readonly<Record<HallId, string>> = { mothers: '👑', rootway: '🌱', lamplight: '🏮',
    postern: '✉️', hearth: '🍞', underChorus: '🎵' }`.
  - `export const HALL_RESIDENT: Readonly<Record<HallId, string>>`: mothers `SOCIETY_CAST.tumblesoil`, rootway
    `SOCIETY_CAST.tamp`, lamplight `SOCIETY_CAST.delve`, postern `SOCIETY_CAST.sift`, hearth `SOCIETY_CAST.crumb`,
    underChorus `'DJ Moleman (c/o Under-Chorus, in case he visits)'`.
  - `export function makeLetters(n: number, rand: () => number): HallId[]` (random halls, never 3 of the same in a row).
  - `export function checkSort(letter: HallId, hole: HallId): boolean`.
  - `openSortingGame(ui, opts)`: append ONE container to `ui` (never restyle `ui`): a dim full-screen overlay
    (`position: fixed; inset: 0; z-index` above the HUD, e.g. 60; padding with `env(safe-area-inset-*)`), a warm
    parchment panel max 520 px wide: title "Post Sorting, Postern Hall", a timer bar (opts.seconds, counts down with
    `requestAnimationFrame` or a 100 ms interval), a counter "3 / 10", the current letter as a card (an envelope with
    "To: <resident>, <Hall name>" and the hall's symbol small in the corner), and a 3 x 2 grid of pigeonhole buttons
    (each at least 64 x 64 px, showing the symbol big and the hall name small). Tap correct: `sorted + 1`, a quick green
    flash, next letter. Tap wrong: `misses + 1`, the card shakes (CSS animation), same letter stays. Keys 1-6 press
    the holes in grid order; Escape quits. A "Stop" button (44 px) quits early. Ends when every letter is sorted or time
    is up: remove the container and call `opts.onDone({ sorted, misses, seconds: elapsed, quit })` exactly once.
    Fits 390 x 844 portrait and 844 x 390 landscape (grid stays visible: in landscape put letter and grid side by side).
  - `sortingOpen()`: true while the container exists.
  Never touch `document` at import time.
- `games/gnome-theft-auto/src/societies/loamdeep/sortingUi.test.ts` (new): node tests for `makeLetters` (length, only
  HallIds, no three in a row over 200 letters with a seeded rand) and `checkSort`; and `sortingOpen()` is false before
  any game opened.

## Contract
`openSortingGame(ui, { letters, seconds, rand, onDone })`, `sortingOpen()`, `SortingResult` as in the stub; new exports
exactly as named above.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/sortingUi.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
