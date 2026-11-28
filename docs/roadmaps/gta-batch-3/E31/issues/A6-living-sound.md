Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The Unmown and the new hamlets sound alive: positional one-shot sounds near their spots, like Pardonlin's.

## Read first
- `games/gnome-theft-auto/src/pardonlin/sound.ts` (the pattern to copy: SOUND_SPOTS, RANGE, GAIN, timers, night rules,
  `playAt` from '../sound/bus')
- `games/gnome-theft-auto/src/pardonlin/sounds.recipes.ts` (how its synthesized sound recipes are registered)
- `games/gnome-theft-auto/src/pardonlin/sound.test.ts` (test style)
- `games/gnome-theft-auto/src/living/sound.ts` (your stub: keep `LivingSound` and `createLivingSound()` exactly)
- `games/gnome-theft-auto/src/living/config.ts` (HAMLETS, HIGH_TARN, STATION, UNMOWN_HIDES, PLATFORM)

## Change
- `games/gnome-theft-auto/src/living/sound.ts`: fill `createLivingSound()` in the Pardonlin style, with an exported
  `LIVING_SOUND_SPOTS` table. Spots (kinds and places):
  - 'frogs' (a chorus of 3-6 short croaks): Reedmere north shore (-1150, -1600) and (-1060, -1610); louder at dusk and night.
  - 'bittern' (one deep "boom" twice): (-1200, -1660), every 40-80 s, dawn/dusk only.
  - 'reeds' (soft wind hiss through reeds, 2-3 s): (-1120, -1640), every 8-15 s.
  - 'ranger-radio' (crackle + a muffled two-tone beep): at the station door `STATION.door`, every 20-40 s, day only.
  - 'woodpecker' (a fast knock burst): Oldroot Wood (-1670, -1500), every 15-30 s, day.
  - per hamlet in `HAMLETS`: 'dog' (two woofs) and 'gate' (a creaky gate) near the centre, day; 'kettle' (a whistle
    rising) at night only.
  - 'tarn-loon' (a long wailing whistle): `HIGH_TARN`, every 30-60 s, dawn/dusk.
  Nothing plays when `inside` is true, or when the listener is more than RANGE from a spot. Use a fixed seed for timers.
- NEW `games/gnome-theft-auto/src/living/sounds.recipes.ts`: register the recipes the spots use (ids prefixed
  'living-'), exactly like `pardonlin/sounds.recipes.ts`; call the register function once from `createLivingSound()`.
- NEW `games/gnome-theft-auto/src/living/sound.test.ts`: each spot kind has a recipe id; spots lie in the right region
  (`regionAt` from '../levels': frogs/bittern/reeds/radio/woodpecker in 'the-unmown'); `createLivingSound().update(...)`
  does not throw under node with a mocked `playAt` (see how pardonlin/sound.test.ts mocks it).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/sound.test.ts src/pardonlin/sound.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`sound/` folder files, `pardonlin/`, `living/runtime.ts` (it already calls your update), `sound/watchLife.ts`.
