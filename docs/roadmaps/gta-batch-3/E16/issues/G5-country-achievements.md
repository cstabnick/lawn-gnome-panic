Epic: E16-D (countryside, last wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/achievements.ts` tracks the countryside visits and unlocks the six countryside
achievements: First Sprout, Oak Patience (from farm harvests), Mansion on the Hill (the front door), Deer Me (12 calm
deer up close), Camp Crasher (10 camps), Level Best (the three building-site gates); progress saved locally.

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `COUNTRY_ACH`, `COUNTRY_SAVE_KEY`, `EVEN_ESTATES` (`hoarding` rects),
  `MANOR.door`, `CountryPart`.
- `games/gnome-theft-auto/src/country/camps.ts` `CAMPS`; `games/gnome-theft-auto/src/critters/countryside.ts`
  `deerWithin(x, z, r): number[]` (critter ids of calm deer; ids are per session, not stable across saves);
  `games/gnome-theft-auto/src/farm/events.ts` `onHarvest(cb)` (`{ crop, n, bed }`; crop 'oak' is the oak's shake).
- `games/gnome-theft-auto/src/campus/achievements.ts`: a finished module of the same kind (visit tracking, saving, unlock /
  increment through `deps.unlock` / `deps.increment`) and its test `campus/achievements.test.ts`.
- `packages/achievements/src/catalog.ts`: the six entries (`target` 12 for Deer Me, 10 for Camp Crasher, 3 for Level
  Best).

## Change
`src/country/achievements.ts` (keep `export function installCountryAchievements(deps): CountryPart`):
- Save `COUNTRY_SAVE_KEY` as `{ v: 1, sites: string[], camps: string[], deer: number, mansion: boolean }` (lenient load,
  try/catch storage; save on every change).
- `update(dt)`: every 0.5 s (not every frame), with `deps.player` (x, z):
  - inside any `EVEN_ESTATES[i].hoarding` rect and its id not in `sites` → add, `deps.increment(COUNTRY_ACH.levelBest)`.
  - within 8 m of any `CAMPS` centre not in `camps` → add, `increment(COUNTRY_ACH.campCrasher)`, toast
    "Camp found: <name> (<n>/<total>)".
  - `deerWithin(x, z, 25)`: each id not seen this session (a Set) counts: `deer += 1` up to 12,
    `increment(COUNTRY_ACH.deerMe)` per new deer while `deer <= 12`.
  - within 1.5 m of `MANOR.door` and not `mansion` → `mansion = true`, `deps.unlock(COUNTRY_ACH.mansion)`.
- At install: `onHarvest((e) => e.crop === 'oak' ? deps.unlock(COUNTRY_ACH.oakPatience) : deps.unlock(COUNTRY_ACH.firstSprout))`.
- Only on foot or in a vehicle alike (no condition); nothing during the first 2 s after install (spawn settling).

New test `src/country/achievements.test.ts` (copy the setup of `campus/achievements.test.ts`): walking into a hoarding
increments Level Best once per site; a camp counts once; standing at the manor door unlocks Mansion on the Hill once;
an `emitHarvest({ crop: 'radish', n: 4, bed: 0 })` unlocks First Sprout and `{ crop: 'oak', ... }` Oak Patience; the
save round-trips. (Mock `../critters/countryside` `deerWithin` with `vi.mock` to return ids.)

## Contract
`installCountryAchievements(deps): CountryPart` unchanged; save key `gta-country-v1` with the shape above.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/country/achievements.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
