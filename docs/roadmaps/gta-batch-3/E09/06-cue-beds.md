Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
The eight new cutscene ambience beds (`ExtraBed` in `src/cutscene/script.ts`: snow, shore, cave, market, meadow, storm,
office, garden) make real sound. Today `src/cutscene/cueBeds.ts` has silent stubs.

## Read first
- `games/gnome-theft-auto/src/cutscene/cueBeds.ts`: `BedKit` (`c`, `gain`, `loop()`, `filt(type, f, q?)`,
  `level(v)`, `lfo(rate, depth, target)`, `link(...nodes)`, `every(minS, maxS, fn(t))`) and the `EXTRA_BED_BUILDERS`
  stubs.
- `games/gnome-theft-auto/src/cutscene/cueAudio.ts` function `startBed` (~line 331-470): how the old beds ('street',
  'forest', 'wind', 'water', 'rain', 'crowd') use the same helpers, and their levels (0.03..0.08). Match those levels.
- `games/gnome-theft-auto/src/cutscene/cueSynth.ts`: `ping(c, out, type, t, dur, f0, f1, peak)`,
  `noiseBurst(c, out, t, dur, type, f0, f1, peak)` for spot sounds inside `every`.
- `games/gnome-theft-auto/src/cutscene/script.ts`: the `ExtraBed` doc comment (what each bed is for).

## Change
- `src/cutscene/cueBeds.ts` only. Each builder wires 1-3 looping layers into `k.gain` and at most two `every` spot
  sounds (spot sounds go into `k.gain` too):
  - snow: hushed wind: `loop() -> filt('lowpass', 500) -> level(0.05) -> gain` with `lfo(0.08, 120, filter.frequency)`;
    a very soft highpass hiss (6 kHz, 0.008). No spot sounds (snow is quiet; that is the point).
  - shore: surf: lowpass 600 noise, level 0.07, a slow swell `lfo(0.11, 0.05, levelGain.gain)`; spot: a gull
    every 6-14 s (`ping(c, gain, 'sine', t, 0.35, 1900, 1300, 0.04)` twice 0.2 s apart).
  - cave: a dark room tone (lowpass 220, 0.05); spot: a drip every 1.5-4 s (`ping(c, gain, 'sine', t, 0.12, 1400 + rnd
    * 600, 700, 0.06)`).
  - market: crowd murmur (bandpass 800 Q 0.7, 0.05, lfo 0.5 on frequency 150); spots: a cup clink every 3-7 s (two
    pings 2600/3400 Hz, 0.05), a far bicycle bell every 12-25 s (two pings 1800 Hz 0.15 s apart, 0.03).
  - meadow: tall grass hiss (bandpass 3000 Q 0.6, 0.035, lfo 0.2 on the level 0.02); insects: a 4200 Hz square through
    `level(0.004)` pulsed by `lfo(11, 0.004, g.gain)` (like the existing 'night' crickets but quieter).
  - storm: heavy rain (highpass 1200, 0.09) plus gusts (bandpass 400 Q 0.8, 0.07, lfo 0.15 on frequency 200); spot: far
    thunder every 10-22 s (`noiseBurst(c, gain, t, 2.0, 'lowpass', 160, 60, 0.12)` and `ping(c, gain, 'sine', t, 1.2,
    55, 40, 0.1)`).
  - office: fluorescent hum as a narrow noise band (`loop() -> filt('bandpass', 120, 8) -> level(0.06) -> gain`) plus
    room tone (lowpass 300, 0.03); spot: keyboard bursts every 4-9 s (5-8 highpass 3 kHz noiseBurst clicks 0.07 s
    apart, peak 0.02).
  - garden: a fountain trickle (bandpass 1800 Q 0.5, 0.03, lfo 0.9 on the level 0.015); spot: a bird chirp every 3-8 s
    (`ping(c, gain, 'sine', t, 0.15, f0, f0 + 900, 0.035)` with f0 2400..3200).
  Only nodes made through the kit helpers are halted when the bed stops, so do not create raw oscillators or sources
  outside `k.loop()` / `k.lfo()`; spot sounds made with `ping` / `noiseBurst` stop themselves.
- New `src/cutscene/cueBeds.test.ts`: build a fake `BedKit` around `createFakeAudio()` from
  `src/sound/testing/fakeAudio.ts` (loop() returns `ctx.createBufferSource()` started; filt/level/lfo/link wrap the
  fake nodes; `every` records its calls) and check every `EXTRA_BEDS` id (exported from `./script`) builds without
  throwing and connects something to `gain` (count `connect` calls on the fake nodes, or simply that `loop` was called
  at least once).

## Contract
`EXTRA_BED_BUILDERS: Record<ExtraBed, BedBuilder>` and `BedKit` unchanged (cueAudio.ts calls them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/cutscene/cueBeds.test.ts` passes.
- `npx tsc --noEmit -p .` passes.

## Out of scope
`cueAudio.ts`, `cueFoley.ts` (issue 05), `script.ts`, `src/sound/` (the world ambience is issue 07).
