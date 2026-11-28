Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read the "Environment" section of `docs/roadmaps/gta-batch-3/E29/_common.md` (working directory, node path, do not
commit, other workers edit other files). Game: `games/gnome-theft-auto` (three.js + TypeScript).

## Goal
The five European ride kinds (`'euro-hatch'`, `'deux-pots'`, `'wespa'`, `'baguette-trike'`, `'crepe-van'`, already in
`VehicleKind` and `VEHICLES`) each have a handling profile, an engine sound and a horn.

## Read first
- `games/gnome-theft-auto/src/handling.ts` lines 60-150 (`PROFILES`: odd rides `pot-rod` .. `barrow-buggy` are the model)
- `games/gnome-theft-auto/src/sound/engines.ts` lines 40-110 (the engine table; odd rides and `golf-cart` entries)
- `games/gnome-theft-auto/src/audio.ts` lines 365-440 (`playHorn`: `switch (kind)`, `hornNote(c, out, wave, t, dur, hz, gain, cutoff)`)
- `games/gnome-theft-auto/src/config.ts` the `// ---- European rides (E29` block in `VEHICLES` (their speeds and masses)

## Change
- `handling.ts` `PROFILES`: add five entries after `'barrow-buggy'`, each with a one-line comment, same shape:
  - `'euro-hatch'`: nippy and planted city car: grip 1.1, balance 0.05, steering 1.25, assists 1.1, stiffness 1.05, comHeight 0.95; lean 0.7.
  - `'deux-pots'`: soft, leans hugely, never quite rolls: grip 0.95, balance 0, steering 1.0, assists 1.1, stiffness 0.7, comHeight 1.15; lean 1.8.
  - `wespa`: light and twitchy: grip 0.9, balance -0.1, steering 1.35, assists 0.9, stiffness 0.9, comHeight 1.1; lean 1.4.
  - `'baguette-trike'`: tippy three-wheeler: grip 0.9, balance 0.25, steering 1.0, assists 1.2, stiffness 0.85, comHeight 1.2; lean 1.3.
  - `'crepe-van'`: tall and wallowy: grip 1.0, balance 0.2, steering 0.9, assists 1.3, brakes 1.1, stiffness 0.9, comHeight 1.15; lean 0.9.
  Give each `ranges` like the odd rides (grip, balance, steering, assists at least) that contain the stock values.
- `sound/engines.ts`: add five entries after `'barrow-buggy'` under a `// European rides.` comment:
  - `'euro-hatch'`: `{ wave: 'buzz', idleHz: 30, maxHz: 110, gears: 4, bright: 0.55, rough: 0.25, gain: 0.85 }` (a buzzy little four)
  - `'deux-pots'`: `{ wave: 'chug', idleHz: 20, maxHz: 70, gears: 4, bright: 0.4, rough: 0.6, gain: 0.95, curve: 1.05, misfire: 0.1 }` (a flat-twin putter)
  - `wespa`: `{ wave: 'buzz', idleHz: 40, maxHz: 160, gears: 3, bright: 0.85, rough: 0.45, gain: 0.9, curve: 0.85, misfire: 0.15 }` (two-stroke wasp)
  - `'baguette-trike'`: `{ wave: 'buzz', idleHz: 36, maxHz: 120, gears: 2, bright: 0.7, rough: 0.6, gain: 0.85, misfire: 0.25 }`
  - `'crepe-van'`: `{ wave: 'rumble', idleHz: 15, maxHz: 50, gears: 3, bright: 0.3, rough: 0.5, gain: 1.05, curve: 1.1 }`
  Keep the field set valid for that table's type (read the type at the top of the file; drop a field it does not have).
- `audio.ts` `playHorn`: add cases before `default:`:
  - `'euro-hatch'`: a two-note "meep-meep": two short square notes at 880 Hz (0.08 s each, 0.12 s apart), gain 0.14, cutoff 2400.
  - `'deux-pots'`: one long nasal note: sawtooth 420 Hz, 0.35 s, gain 0.15, cutoff 1400.
  - `wespa`: three fast high beeps: square 1200 Hz, 0.05 s each, 0.08 s apart, gain 0.12, cutoff 3000.
  - `'baguette-trike'`: a bicycle bell: two quick sine notes at 2100 Hz and 2600 Hz, 0.12 s each, gain 0.12, cutoff 5000
    (use the wave names `hornNote` accepts: read its signature).
  - `'crepe-van'`: a jaunty four-note tune (like the lowrider's): 523, 659, 784, 659 Hz, 0.1 s each, sawtooth, gain 0.14, cutoff 2000.
  End each case with `return;` like the others.

## Contract
Partial maps keyed by `VehicleKind`; `sound/engines.test.ts` requires every kind in `VEHICLES` to have its own engine
entry; `handling.test.ts` requires every ground kind to have a profile and to survive every driving mode.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your three files.
- `cd games/gnome-theft-auto && npx vitest run src/handling.test.ts src/sound/engines.test.ts src/sound/engineModel.test.ts`
  passes for everything except failures that come from a missing prefab (another worker is building the prefabs
  `gta-euro-hatch`, `gta-deux-pots`, `gta-wespa`, `gta-baguette-trike`, `gta-crepe-van` right now; say so if you see that).

## Out of scope
`config.ts`, `types.ts`, `net.ts`, `driveGrips.ts`, `traffic.ts`, anything under `packages/` and every other file.
