Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first.

## Goal
Eight new procedural world sounds exist for the three E17 places, so their builders and life modules can call
`playAt(id, pos)`.

## Read first
- `games/gnome-theft-auto/src/sound/ids.ts` (`REGION_SOUNDS` at line ~35 and the `Recipe` contract)
- `games/gnome-theft-auto/src/sound/recipes/regions.ts` (the region recipes, e.g. `antSkitter`, `telescopeWhirr`, and the
  exported map at line ~160-180)
- `games/gnome-theft-auto/src/sound/recipes/recipes.test.ts` (what every recipe must satisfy)
- `docs/design/gnome-theft-auto/sound-design.md` (search "Rootwell" or "Unmown" for the tone: short, soft, procedural)

## Change
- `games/gnome-theft-auto/src/sound/ids.ts`: append to `REGION_SOUNDS` (after 'telescope-whirr'):
  `'weld-crackle', 'pedal-whirr', 'reed-rustle', 'flock-hum', 'soil-crumble', 'lamp-whoomp', 'mole-squeak', 'burrow-drip'`.
- `games/gnome-theft-auto/src/sound/recipes/regions.ts`: one recipe each, in the same style (procedural WebAudio, short):
  - `weld-crackle`: 0.6-0.9 s of crackling filtered noise bursts (an arc welder under the Underspan).
  - `pedal-whirr`: ~1 s rising-falling whirr of a bicycle dynamo (a saw/triangle through a low-pass, slight wobble).
  - `reed-rustle`: ~0.8 s soft band-passed noise swell (wind in reeds at Wader's Rest).
  - `flock-hum`: ~1.6 s low, gentle two-note hum of several voices (sine pair ~140/210 Hz with slow vibrato), solemn but
    silly; quiet.
  - `soil-crumble`: ~0.5 s dry low noise crumble with a few ticks (digging).
  - `lamp-whoomp`: ~0.4 s soft whoomp of a lamp catching (low thump + brief bright noise).
  - `mole-squeak`: ~0.15 s tiny polite squeak (short sine chirp up, high).
  - `burrow-drip`: ~0.3 s single water drip with a little cave echo.
- Add a line for the new ids to `docs/design/gnome-theft-auto/sound-design.md` in the region/places section (one short
  paragraph "E17 societies: ...").

## Contract
Sound ids exactly as above, in `REGION_SOUNDS`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sound` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in sound files.

## Out of scope
Every other file.
