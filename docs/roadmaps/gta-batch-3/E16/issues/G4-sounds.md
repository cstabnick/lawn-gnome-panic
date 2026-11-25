Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
Every countryside sound id in `COUNTRY_SOUNDS` has a procedural recipe registered on the world sound bus, and the
critter watcher gives deer a bark and goats a bleat of their own.

## Read first
- `games/gnome-theft-auto/src/golf/sounds.ts`: a finished module of the same kind (a `Record<Id, Recipe>`, `pitch`,
  `lvl`, `PEAK_MAX`, `registerGolfSounds()` with `hasSound`/`registerSound`). Copy its structure.
- `games/gnome-theft-auto/src/sound/synth.ts` (`burst`, `tone` and any other helpers it exports) and
  `games/gnome-theft-auto/src/sound/ids.ts` (`Recipe`, `SoundInfo`, `CRITTER_SOUNDS`, `CritterSoundId`).
- `games/gnome-theft-auto/src/sound/recipes/critters.ts` (the critter recipes, e.g. 'baa', 'squirrel') and
  `games/gnome-theft-auto/src/sound/bus.ts` line ~22 (per-id ranges/priorities keyed by sound id).
- `games/gnome-theft-auto/src/sound/watchLife.ts` (`CRITTER_CALL`) and `src/sound/watchLife.test.ts`.
- `games/gnome-theft-auto/src/country/types.ts`: `COUNTRY_SOUNDS`, `CountrySoundId`.

## Change
- `src/country/sounds.ts` (replace the stub; keep `export function registerCountrySounds(): void`): a
  `Record<CountrySoundId, Recipe>` and registration exactly like `registerGolfSounds`. Soft, cartoonish, garden-scale;
  peaks never above 0.25:
  - `country-campfire`: ~1.2 s of soft crackle (a few random short highpass bursts over a low brown-noise bed).
  - `country-site-hammer`: three quick wooden-metal taps (~0.5 s).
  - `country-site-mixer`: a ~1.5 s churning drum: low rumble with a slow wobble and a gritty noise layer.
  - `country-crane-whir`: a ~1.2 s rising electric whine with a ratchet tick at the end.
  - `country-vine-snip`: two short crisp shear snips.
  - `country-deer-bark`: a short hoarse bark (~0.3 s), noisy with a fast pitch drop.
  - `country-goat-bleat`: a wobbly nasal "meh-eh-eh" (~0.6 s, a sawtooth with vibrato through a bandpass).
  - `country-manor-knocker`: two heavy brass knocks with a hollow ring (~0.9 s).
  - `country-snore`: one slow snore: a rough low inhale and a whistling exhale (~2 s).
  - `farm-plant`: a soft soil pat. `farm-water`: ~0.8 s of watering-can patter. `farm-harvest`: a leafy pull and a
    pop. `farm-sell`: a couple of acorns clinking into a tin. `farm-oak-shake`: leafy rustle then 6-8 small knocks of
    acorns landing.
- `src/sound/ids.ts`: add `'deer-bark'` and `'goat-bleat'` to the end of `CRITTER_SOUNDS`.
- `src/sound/recipes/critters.ts`: recipes for `'deer-bark'` and `'goat-bleat'` (same character as the two above; you
  may share the synthesis with country/sounds.ts by writing it in critters.ts and importing it, or simply write it twice).
- `src/sound/bus.ts`: add `'deer-bark'` and `'goat-bleat'` to the per-id table on line ~22 (deer 70, goat 50) if that
  table must list every critter id (tsc will tell you).
- `src/sound/watchLife.ts`: `deer`, `stag`, `fawn` → `'deer-bark'`; `goat` → `'goat-bleat'` (they are 'critter-thud' and
  'baa' as placeholders now).
- `src/sound/watchLife.test.ts`: if it lists every kind → call, add the four rows.

## Contract
`registerCountrySounds()` signature unchanged; every id in `COUNTRY_SOUNDS` registered; critter sound ids
`'deer-bark'`, `'goat-bleat'`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sound` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`src/country/types.ts` and every other file in `src/country/`, `src/critters*`, `src/hunting/*`.
