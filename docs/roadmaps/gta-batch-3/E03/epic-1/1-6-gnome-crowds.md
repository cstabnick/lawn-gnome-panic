Epic: 1 Fixes (parallel) · Item: L41 "fix the fact that a million gnomes sometimes are just chilling in one area" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
Pedestrian gnomes spread out: no 12 m patch of the world ever holds a pile of idle gnomes. Find which system clusters
them, fix it at the source, and add a global safety cap.

## What is known (cause NOT confirmed - find it first)
Systems that place gnomes: `npcs.ts` pedestrians (`RECYCLE_MIN/MAX`, `pickNear` prefers 8 m from other gnomes,
`crowded ? 0.35` idle chance ~line 468), `ambientGnomes.ts` (26 fixed chatter gnomes), street events `events/` and
`worldEvents.ts` (event crowds), parties `party/`, quest actors parked at `near` marks, `vibeNpcs.ts`. Likely suspects:
`pickNear` falling back to one spot (the player's cell, a single walk point) when no candidate passes, recycled gnomes
all respawning at the same walk point, an event leaving its crowd behind after it ends, or idle gnomes never being
recycled because the recycle only checks distance from the player.

## Change
1. Repro test first: new `crowds.test.ts` that drives the real pedestrian system headless (see how `ambientGnomes.test.ts`,
   `worldEvents.test.ts`, `traffic.test.ts` build their worlds) for a few simulated minutes with the player parked in
   town and also moving, then buckets every gnome (`npcs.list` plus any other systems you suspect) into 12 m cells and
   reports the max per cell. Record the max you see before the fix and which system/code path produced it.
2. Fix the cause in the owning module (e.g. spawn-point choice, recycle of idle gnomes, event cleanup).
3. Safety cap in `npcs.ts`: at most `CROWD_CAP = 6` idle pedestrians per 12 m cell (count `npcs.list` only); when over,
   send the extras walking to a far walk point or recycle the one farthest from the player (no visible pop within 40 m
   of the player: prefer walking away). Put `CROWD_CAP` and the cell size in `npcs.ts` constants (or `config.ts` is
   NOT allowed in this issue).
4. The test asserts max idle pedestrians per 12 m cell <= `CROWD_CAP` after the fix (gnomes in a scripted event crowd
   may be excluded only if the event is active).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/crowds.test.ts src/ambientGnomes.test.ts src/worldEvents.test.ts src/traffic.test.ts`
  pass (`traffic.test.ts` "keep moving" is timing-flaky under load: rerun that file alone before treating it as broken).
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files. Report: the root cause with the before/after counts.

## Out of scope
`config.ts`, `types.ts`, `app.ts`, `quests/`, `traffic.ts` vehicles.
