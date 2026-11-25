Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Three new synthesized world sounds exist for Rootwell: `turbine-whoosh` (a giant pinwheel's vane sweeping past), 
`ant-skitter` (a busy patter of tiny feet at an ant door) and `telescope-whirr` (the observatory's dome motor and the
telescope slewing). Other workers play them with `playAt(id, { x, z }, { bus: 'ambience' })`.

## Background (confirmed)
- `src/sound/ids.ts` `REGION_SOUNDS` (a const tuple) lists the batch-3 region spot sounds; its doc comment names them.
- `src/sound/recipes/regions.ts`: one `Recipe` function per id (`(c, out, t, info) => duration`), built from the helpers
  the file already uses (`tone(c, out, wave, t, dur, f0, f1, gain, attack)`, `burst(c, out, t, dur, filter, f0, f1, gain,
  ...)`, `amp(info, g)`), and the `REGION_RECIPES` table. Copy the style of `campusBell`, `sprinklerTick`, `surfWash`.
- `src/sound/bus.ts` `MAX_DIST` (metres a sound carries, default 60).
- `src/sound/recipes/recipes.test.ts` checks every id has a recipe that renders.
- `docs/design/gnome-theft-auto/sound-design.md`: the sound bible (a table of region sounds).

## Read first
- `games/gnome-theft-auto/src/sound/ids.ts`, `src/sound/recipes/regions.ts`, `src/sound/bus.ts` (lines 1-40),
  `src/sound/recipes/recipes.test.ts`, the region-sounds part of `docs/design/gnome-theft-auto/sound-design.md`.

## Change
- `src/sound/ids.ts`: append `'turbine-whoosh', 'ant-skitter', 'telescope-whirr'` to `REGION_SOUNDS` and mention them
  in its comment ("Pinwheel Ridge's turning pinwheels, the Anthill's ants, the observatory telescope").
- `src/sound/recipes/regions.ts`: three recipes + table rows:
  - `turbine-whoosh`: a slow, deep, soft "whoom" ~1.6 s: band-passed noise sweeping down (e.g. 500 → 180 Hz) with a slow
    swell and fade, plus a faint low hum (sine ~70 Hz, very quiet). Calm, not scary.
  - `ant-skitter`: ~1.2 s of very quick, tiny, dry ticks (20-30 short high-passed bursts at irregular small gaps, using
    the recipe's random source the way other recipes do, or a fixed pattern), quiet.
  - `telescope-whirr`: ~2.2 s: a gear motor whirr (a sawtooth or square tone gliding 90 → 140 Hz through a lowpass) with
    a soft clunk at the end (a short low burst).
- `src/sound/bus.ts` `MAX_DIST`: `'turbine-whoosh': 140`, `'ant-skitter': 25`, `'telescope-whirr': 45`.
- `docs/design/gnome-theft-auto/sound-design.md`: three rows in the region sounds table (where, when, what).

## Contract
Sound ids exactly `turbine-whoosh`, `ant-skitter`, `telescope-whirr`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sound` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/sound/`.

## Out of scope
Every other file (the places that play these sounds are other workers').
