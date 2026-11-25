Epic: E07 step 1 · Issue 02 bird toggles (L34, L65)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, registry API, rules).

## Goal
Two options under Sound: "Bird alerts" (the on-screen ♪ call arrow and the chime/callout sound that goes with it) and
"Bird sounds" (flock calls, the flush whoosh, and the ambience bird beds). "Bird sounds: off" also silences the alert
sound; "Bird alerts: off" hides only the ♪ arrow and its chime. Both default on.

## Read first
- `games/gnome-theft-auto/src/viewPrefs.ts`: the pattern for a per-browser pref module (read once, setter writes
  localStorage, fires a window event).
- `games/gnome-theft-auto/src/birding/birding.ts`: line ~218 and ~533 `playAt(BIRD_SFX.flush, ...)`; ~231
  `play2d(BIRD_SFX.tick)` + ~232 `deps.hud.callout?.('NEW ON THE LIFE LIST', ...)` (keep the callout text, it is a
  milestone, not an alert; but its tick sound counts as an alert sound); ~542 `playAt(birdSoundId(s.id), fl, {...})`
  (the species call) then ~548 `scopeUi.showCall(...)` (the ♪ arrow).
- `games/gnome-theft-auto/src/sound/ambience.ts` around line 175-195: the ambience picker returns `{ id: 'crow' }`,
  `{ id: 'bird-song' }`, `{ id: 'bird-chirp' }` among others (wind, moo).

## Change
- New `games/gnome-theft-auto/src/birdPrefs.ts`:
  ```ts
  export function getBirdAlerts(): boolean;            // default true, key 'gta.birdAlerts' ('on' | 'off')
  export function setBirdAlerts(on: boolean): void;    // writes, fires window event 'gta:bird-prefs'
  export function getBirdSounds(): boolean;            // default true, key 'gta.birdSounds'
  export function setBirdSounds(on: boolean): void;    // writes, fires 'gta:bird-prefs'
  /** Whether an alert chime may play: alerts on AND sounds on. */
  export function birdAlertSoundOn(): boolean;
  export const BIRD_AMBIENCE_IDS: readonly string[] = ['bird-chirp', 'bird-song', 'crow'];
  ```
  Guard `typeof window !== 'undefined'` / `typeof localStorage` so it imports in node tests. At module top level
  (import time) register two rows with `registerOption` from `./optionsRegistry`: section `'audio'`, ids
  `'bird-alerts'` (order 50, label 'Bird alerts', desc 'The ♪ arrow when a bird calls nearby, and its chime.') and
  `'bird-sounds'` (order 60, label 'Bird sounds', desc 'Bird calls, flushing flocks and birdsong in the air. Off also
  silences the alerts.'), both `kind: 'toggle'`, `watch: 'gta:bird-prefs'`.
- New `games/gnome-theft-auto/src/birdPrefs.test.ts`: defaults, setters, `birdAlertSoundOn()` truth table (use a
  fake `localStorage` on `globalThis` if needed, or just test the in-memory values), and that both rows are registered
  (`getOption('bird-alerts')` from `./optionsRegistry`).
- `games/gnome-theft-auto/src/birding/birding.ts`: the species call `playAt(birdSoundId(...))` and both flush
  `playAt(BIRD_SFX.flush, ...)` only when `getBirdSounds()`; `scopeUi.showCall(...)` only when `getBirdAlerts()`;
  the life-list `play2d(BIRD_SFX.tick)` only when `birdAlertSoundOn()`. Do not change anything else (spotting,
  journal, the callout text stay).
- `games/gnome-theft-auto/src/sound/ambience.ts`: when `!getBirdSounds()`, a picked ambience id in
  `BIRD_AMBIENCE_IDS` is not played (return/skip at the point where the pick is used, or re-pick a non-bird id such as
  `'wind-gust'` if the code expects a sound every time; read the code and pick the smaller change).

## Contract
`getBirdAlerts`, `setBirdAlerts`, `getBirdSounds`, `setBirdSounds`, `birdAlertSoundOn`, event `'gta:bird-prefs'`,
keys `gta.birdAlerts` / `gta.birdSounds` (not cloud-saved).

## Done when
- `npx tsc --noEmit -p .` and `npx vitest run src/birdPrefs.test.ts src/birding src/sound` pass (from games/gnome-theft-auto).
- `git diff --stat` shows small diffs in birding.ts and ambience.ts only, plus the two new files.

## Out of scope
`src/options.ts`, `src/optionsRegistry.ts`, `src/birding/scopeUi.ts`, every other file.
