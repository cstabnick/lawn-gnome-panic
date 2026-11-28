Epic: FX06 epic 1, issue C: the Anthill eases into its flank; Rutbottom's raised corners get a wide batter (G5#1, G5#2, D58)
Depends on: none (dev port 5518)

## Goal
The Anthill summit no longer drops 12 m over a 12 m ring (a cliff crown); it eases into the mound's flank over a wide
blend. Rutbottom Dirt Bowl's raised corners stand on gentle earth embankments (about 1:2 or gentler), not 4-5 m
walls. (Another worker, in parallel, stops `terrainPaint.ts` painting these slopes as rock: they will be painted
dirt/grass. Your part is the shape.)

## The problem today
- The summit flatten stamp is data in `src/data/levels/east-campus.level.json` (`"stamps"` near the top):
  `{ "op": "flatten", "x": 90, "z": 150, "inner": 30, "outer": 42, "to": 47.2 }` (level coordinates; world summit is
  (1240, 150)). The natural mound (`src/data/landscape.json` `hill/observatory-mound`, r 120, h 45) is about 35 m at r
  40, so the 30 -> 42 m blend falls 12 m in 12 m (probe from the editor: S r36 = 46.7, r40 = 34.9; E r32 = 46.6,
  r40 = 35.8). Editor's fix: widen the blend to 25-30 m (keep the road's grade under 20%), re-check that the run-up and
  the road end still reach the summit.
- `src/campus/types.ts` `OBSERVATORY` has `flatR: 30` and a comment "blend to flatR + 12": update the comment to the
  new blend. `flatR` stays 30 (tests use it for the dome and Dean's Leap).
- `src/raceTrack/defs/rutbottom.ts`: `relief: 'raise'`, `shoulder: 3`, `fade: 8`, lifts up to 3.5 m plus banks up to
  4 m: so 5-7 m of fill falls back to the pan over 8 m. The relief code is `applyRelief` in
  `src/raceTrack/trackDef.ts` (read only; do not edit): `w = d <= inner ? 1 : 1 - smooth((d - inner) / def.fade)`,
  inner = width/2 + shoulder; each cell takes its nearest centre-line sample.

## Read first
- `src/data/levels/east-campus.level.json` (the stamp near the top; `trail/anthill-road` path around line 168).
- `src/campus/types.ts` lines 105-135 (`OBSERVATORY`), `src/campus/mound.test.ts` (summit flatness, summit >= 35 m
  above the plain, road steepest grade <= 16 deg, Dean's Leap) and `src/campus/campus.test.ts` lines 105-140.
- `src/raceTrack/defs/rutbottom.ts`, `src/raceTrack/rutbottom.test.ts`, `src/raceTrack/trackDef.ts` lines 505-605.

## Change
1. `east-campus.level.json`: widen the stamp's `outer` so the blend is 25-30 m (e.g. `outer: 58`). Keep `inner: 30`
   and `to: 47.2`. If the road (`trail/anthill-road`) grade test fails, adjust only the blend, not the road. If the
   stamp format allows a softer falloff already (look at how `flatten` stamps are applied: grep `'flatten'` in
   `src/terrain.ts` / `packages/level/src`), use what exists; do not add new stamp options.
2. `campus/types.ts`: comment only ("blend to flatR + <new>").
3. `rutbottom.ts`: raise `fade` so the embankments are about 1:2 or gentler (e.g. 14-16 m). Check the track does not
   collide with itself: `fade` + inner (8.5 m) must stay under half the closest gap between two parts of the track
   (measure it in a scratch vitest from `trackById('rutbottom').samples()` if unsure) and the barriers
   (`barrierOffset: 10`) must still stand on sensible ground. If the lip still steps (sawtooth along the top edge),
   smooth it from the data side (e.g. ease lift/bank changes between neighbouring control points) since trackDef.ts is
   not yours.
4. Update/extend tests next to these files only if a number changed on purpose (e.g. a new test in
   `src/campus/mound.test.ts`: the steepest ground within 28-62 m of the summit is under 0.6 rise/run; in
   `src/raceTrack/rutbottom.test.ts`: the ground 9-25 m off the centre line on the north side of the start straight
   falls at under 0.55 rise/run). Use `setTerrainOptions({ amplitude: 1, testHill: false, landforms: true })` as the
   existing tests in those files do.
5. `src/data/layout.golden.json`: if `npx vitest run src/layout.golden.test.ts` fails only because these shapes
   moved scenery, regenerate it with `UPDATE_GOLDEN=1 npx vitest run src/layout.golden.test.ts` and say so in your
   report. (Another worker may also need to; the lead regenerates once at the end, so a conflict there is fine.)

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus src/raceTrack src/layout.golden.test.ts` passes;
  `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Screenshots (dev server on 5518) vs the editors' (`...\shots\G5\`): `x-mound-n` (about 1240, 330, yaw Math.PI),
  `a-summit` (walk the summit edge, e.g. 1240, 185 facing south), `b-stands` (1215, -520 facing north, yaw Math.PI),
  `b-start` (on the start straight near 1124, -543 facing east). The mound should read as an ant mound easing to its
  top; the bowl's corners as earth banks. (Rock paint may still show until the paint worker's change lands in the
  same tree; judge the shape.)

## Out of scope
`terrainPaint.ts`, `trackDef.ts`, `trackMesh.ts`, `trackDressing.ts` (hay bales), every other file.
