Epic: E07 step 1 · Issue 07 Gnomey Bird, the Gnomlet toy (L94)
Depends on: none (the Gnomlet and its app registry exist)

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, rules).

## Goal
A small original flap-through-the-gaps game on the Gnomlet tablet: tap / Space / pad A flaps, a gnome in a pointy hat
falls under gravity, hedges with gaps scroll past, one point per gap, best score saved and shown. An achievement
"Flappy Gnome" (score 10) with a wearable head reward. Original canvas art drawn in code; nothing borrowed from any
existing game's look, names or sounds (no green pipes, no yellow bird, no "Flappy Bird" text anywhere in the UI).

## Read first
- `games/gnome-theft-auto/src/gnomlet/registry.ts`: `GnomletApp` with `open(root, ctx): void | (() => void)`; `root`
  is an empty `div` that fills the tablet screen (it scrolls vertically; the tablet sets `touch-action:pan-y` on
  everything under it except `canvas` and `[data-gnl-touch="none"]`, which get `touch-action:none`).
- `games/gnome-theft-auto/src/gnomlet/gnomlet.ts`: how the tablet drives apps. While open it owns the pad: A clicks
  the focused element (the first focusable in the app gets focus on open), B goes back home (cleanup runs), View or
  Start closes. Keyboard: arrows move focus, Enter clicks the focused element, Escape goes back. Space is free.
- `games/gnome-theft-auto/src/gnomlet/apps/gnomeyBird.ts`: the stub you replace (keep `registerGnomeyBird(deps)` and
  `GnomeyBirdDeps { unlock(id: string): void }`; app.ts already calls `registerGnomeyBird({ unlock })`).
- `packages/gnome/README.md` (only the `getMyGnome()?.look` part: the player's colours; fall back to a red hat, blue
  coat, pale skin, white beard when null). Import from `@lawn/gnome`.
- `packages/achievements/src/catalog.ts`: GTA entries (`game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`,
  e.g. `id: 'gta-hat-wave'` near line 1200) and a head reward example `reward: { slot: 'head', prefabId: 'propeller-beanie', label: 'Propeller Beanie' }`.
- `packages/prefabs/src/catalog/cosmetics-head-b.ts`: `propeller-beanie` (~line 237) as the model for a new head prefab.

## Change
- `games/gnome-theft-auto/src/gnomlet/apps/gnomeyBirdSim.ts` (new, pure, no DOM): the game state and step.
  ```ts
  export interface GbState { t: number; y: number; vy: number; gaps: { x: number; gapY: number; scored: boolean }[];
    score: number; over: boolean; started: boolean; seed: number }
  export const GB = { width: 320, height: 480, gravity: 1300, flap: -420, gapH: 150, gapEvery: 1.55, speed: 140,
    gnomeX: 90, gnomeR: 14, hedgeW: 54 };  // tune for fun; world units are canvas px at 320x480
  export function newGame(seed?: number): GbState;
  export function flap(s: GbState): void;          // starts the run on the first flap; ignored when over
  export function step(s: GbState, dt: number): void; // gravity, scrolling, spawn (seeded RNG), scoring, collision (ground, ceiling, hedges)
  ```
  Clamp `dt` to 1/30. Deterministic with the seed (for tests).
- `games/gnome-theft-auto/src/gnomlet/apps/gnomeyBirdSim.test.ts`: falls without flaps and ends on the ground; a flap
  rises; passing a gap scores exactly once; hitting a hedge ends the run; same seed -> same gaps.
- `games/gnome-theft-auto/src/gnomlet/apps/gnomeyBird.ts`: the app. `open(root, ctx)` builds: a score line ("Best: n"),
  a `<canvas>` scaled to fit the screen (keep the 2:3 world, letterbox; device-pixel-ratio aware, max 2), and a big
  44 px+ "Flap" `<button>` under it (the pad's A and Enter click the focused button, so make the Flap button the first
  focusable element in `root`). Input: `pointerdown` on the canvas and on the button flap (use `pointerdown`, not
  `click`: `index.html` swallows a second tap within 350 ms, which would eat fast flaps; set `data-gnl-touch="none"` on
  the button and call `e.preventDefault()`); the button's `click` (from pad A / Enter) flaps too but ignore a click
  that follows a pointerdown within 400 ms; Space flaps via a `keydown` listener on `window` that checks
  `e.code === KEYS.jump` (import `KEYS` from `../../keys`; do not write the string literal) and calls
  `e.preventDefault()`. After a crash: "Tap to try again" (next flap restarts after a 0.6 s grace). Loop with
  `requestAnimationFrame`; the cleanup returned from `open` cancels the frame and removes every listener (the game
  underneath must get its input back).
  Art (canvas, drawn in code): a soft dusk garden sky gradient, a scrolling lawn strip, hedges as rounded dark-green
  box hedges with a few lighter leaf dots and a little brick-red flower here and there; the gnome: a round body in the
  coat colour, a beard, a face dot, and a tall pointy hat in the hat colour that tilts with `vy`; a puff of
  white dots on each flap. Score in big white text with a dark outline at the top.
  Best score: localStorage key `'gta-gnomeybird-v1'` as JSON `{ "best": n }` (already in `GTA_SAVE_KEYS` and cloud
  merged as "higher best wins"), read on open, written when beaten (try/catch), then call `notifySaveChanged()` from
  `../../saveHook`. On reaching score 10 in a run, `deps.unlock('gta-flappy-gnome')` once per run.
  Register with `id: 'gnomey-bird', label: 'Gnomey Bird', icon: '🐦', group: 'fun', order: 30`,
  `detail: () => best ? \`Best ${best}\` : 'Flap through the hedges'`.
- `packages/prefabs/src/catalog/cosmetics-head-b.ts`: add a head prefab `id: 'hedge-hopper-cap'`, name "Hedge-Hopper
  Cap" (a little leafy cap with a tiny bird perched on top), modelled on `propeller-beanie` (same `category`, `uses`,
  slot fields; read the file and `docs/roadmaps/prefab-library/_common.md` for the rules). Then
  `npm test -w packages/prefabs` must pass.
- `packages/achievements/src/catalog.ts`: add after the last GTA entry
  `{ id: 'gta-flappy-gnome', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Flappy Gnome',
  description: 'Score 10 in Gnomey Bird on the Gnomlet.', reward: { slot: 'head', prefabId: 'hedge-hopper-cap', label: 'Hedge-Hopper Cap' } }`
  (match the field order and any extra required fields of neighbouring GTA entries). Then
  `npm test -w packages/achievements` must pass.

## Done when
- From games/gnome-theft-auto: `npx tsc --noEmit -p .` and `npx vitest run src/gnomlet` pass.
- From the repo root: `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- Browser check on your own port (see _env.md): open the game, tap ☰ (`#gta-more-btn`), tap the Gnomey Bird tile
  (`#gta-gnomlet .gnl-app[data-app="gnomey-bird"]`), play: flaps work by tap at 390x844 (touch emulation), the best
  score survives a reload, Back (‹) returns to the home screen and the game's controls work again. Report what you saw.

## Out of scope
`src/gnomlet/gnomlet.ts`, `src/gnomlet/registry.ts`, `src/app.ts`, `src/saveIO.ts`, `src/cloudSave.ts`, other games.
