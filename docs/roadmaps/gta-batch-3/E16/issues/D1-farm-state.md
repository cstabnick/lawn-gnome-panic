Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/farm/state.ts` is the pure Windfall Croft simulation (plant, water, grow on game time,
offline growth capped at two hours, harvest, the slow oak, save/load/merge), with `src/farm/state.test.ts` covering it.

## Read first
- `games/gnome-theft-auto/src/farm/types.ts`: the contract (`CROPS`, `cropDef`, `BED_CROPS`, `FARM`, `BEDS`,
  `BedState`, `OakState`, `FarmState`, `FarmResult`, `FarmEvent`, `BedStatus`). Do not edit it.
- `games/gnome-theft-auto/src/farm/state.ts`: the stub you replace (keep every exported name and signature).
- `games/gnome-theft-auto/src/winter/save.ts` (or any small `*save.ts`): the lenient-parse style used in this game.

## Change
`src/farm/state.ts` (pure: no three.js, no DOM, no localStorage; time is passed in). Keep these exports and signatures:
- `newFarm(nowMs = 0): FarmState`: as the stub (8 empty beds `{ crop: null, stage: 0, grown: 0, wet: false }`, oak not
  planted, empty crate, seed 'radish', zero stats, `savedAt: nowMs`).
- `bedStatus(s, bed): BedStatus`: 'empty' when no crop; 'ripe' at stage 2; else 'dry' when not wet, 'growing' when wet.
- `plantCrop(s, bed, crop): FarmResult`: errors 'No such bed.' (index outside 0..7), 'Something is growing here.' (bed
  not empty), 'The oak goes in its own spot.' (crop 'oak'). Else sets `{ crop, stage: 0, grown: 0, wet: false }`,
  `stats.planted += 1`, ok. (Charging the seed cost is the runtime's job.)
- `waterBed(s, bed): FarmResult`: errors 'No such bed.', 'Nothing planted.' (empty), 'Ready to harvest.' (stage 2),
  'Already watered.' (wet). Else `wet = true`, ok.
- `harvest(s, bed)`: errors 'No such bed.', 'Nothing planted.', 'Not ripe yet.' (stage < 2). Else returns
  `{ ok: true, crop, n: cropDef(crop).yield }`, empties the bed (`crop: null, stage: 0, grown: 0, wet: false`) and adds
  `n` to `stats.harvested`. (The runtime puts produce in the bag and the crate.)
- `plantOak(s): FarmResult`: error 'The oak is already planted.' if planted; else
  `oak = { planted: true, stage: 0, grown: 0, sinceShake: 0 }`, `stats.planted += 1`. The oak never needs water.
- `oakReady(s): boolean`: planted, stage 2 and `sinceShake >= FARM.oakShakeS`.
- `shakeOak(s): number`: if `oakReady`, sets `sinceShake = 0`, adds `FARM.oakShakeAcorns` to `stats.acornsFromOak` and
  returns it; else 0.
- `stepFarm(s, dt): FarmEvent[]`: grows by `dt` seconds (dt <= 0 or not finite: no change, []):
  - each bed with a crop, stage < 2 and `wet`: `grown += dt`; while `grown >= stageS` and stage < 2: `grown -= stageS`,
    `stage += 1`, push `{ kind: 'stage', bed, crop, stage }`; after a stage change the bed is dry again (`wet = false`)
    and the rest of `dt` is NOT carried into the next stage (`grown = 0`); if the new stage < 2 also push
    `{ kind: 'thirsty', bed, crop }`. Dry beds do not grow.
  - the oak (planted): while stage < 2 it grows like a wet crop (no watering, leftover dt carries over: loop stages)
    pushing `{ kind: 'oak-stage', stage }`; at stage 2, `sinceShake += dt`, and push `{ kind: 'oak-ready' }` once on the
    step where `sinceShake` crosses `FARM.oakShakeS` (from below to >=). A newly grown oak starts `sinceShake` at 0.
- `applyOffline(s, nowMs): FarmEvent[]`: `secs = clamp((nowMs - s.savedAt) / 1000, 0, FARM.offlineCapS)`; returns
  `stepFarm(s, secs)` and sets `s.savedAt = nowMs`. (So a wet bed can grow at most to the end of its stage while the
  game is closed, and the oak at most 2 hours.)
- `bedSecondsLeft(s, bed)`: seconds of wet growth to the next stage (`stageS - grown`), 0 when empty or ripe.
- `oakSecondsLeft(s)`: to the next oak stage while growing; at stage 2 the seconds to the next shake (0 when ready);
  0 when not planted.
- `serializeFarm(s, nowMs): string`: JSON of the state with `savedAt: nowMs`.
- `parseFarm(raw, nowMs = 0): FarmState`: lenient: null, bad JSON, wrong `v` → `newFarm(nowMs)`. Otherwise build a
  fresh farm and copy over only valid values: exactly 8 beds (missing or bad beds empty; a bed's crop must be a
  `BED_CROPS` id; stage 0..2 integer; grown finite >= 0; wet boolean), the oak (stage 0..2, finite numbers), crate
  counts (known crop ids, integers >= 0), seed (a `BED_CROPS` id, else 'radish'), stats (finite numbers >= 0),
  `savedAt` (finite, else nowMs).
- `mergeFarm(a, b): FarmState`: the one with the later `savedAt` (ties: a).

`src/farm/state.test.ts` (vitest, new) covers at least: plant → water → step stageS → stage 1 and dry + 'thirsty' event;
water → step → ripe → harvest gives the yield and empties the bed; dry beds do not grow; every plantCrop/waterBed/harvest
error; leftover time is not carried across a crop stage; the oak grows without water through stages 0→1→2 in
2 * 1200 s (check with one big step: carries over), then 'oak-ready' after FARM.oakShakeS, `shakeOak` returns
FARM.oakShakeAcorns once and 0 right after; applyOffline caps at 2 hours (a planted oak and 10 hours closed → grown by
exactly 7200 s) and ignores a clock that went backwards; serialize → parse round-trips; parse of junk gives a fresh
farm; mergeFarm picks the later savedAt.

## Contract
Every exported name and signature of the stub stays exactly as it is (`farm/runtime.ts` and the Farm app call them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/farm/state.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/farm/`.

## Out of scope
`src/farm/types.ts`, `src/farm/runtime.ts`, `src/farm/farmApp.ts`, every other file.
