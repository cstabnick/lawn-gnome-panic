Epic: E17 wave 2 (living parts)
Depends on: P6 achievements (done)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first.

## Goal
The E17 achievements fire from what the player does, and DJ Moleman's visit is recorded when the Under-Chorus quest is
done (so the Burrowfolk show him at the decks from then on).

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`SOCIETY_ACH`, `SOCIETY_EVENTS`, `SOCIETY_QUESTS`,
  `SOCIETY_INTERIORS`, `LOAMDEEP.halls.underChorus`, `MOLE_JOB_IDS`, `SocietyDeps`, `SocietyPart`)
- `games/gnome-theft-auto/src/quests/questSave.ts` (`parseSavesJson`) and `quests/quests.ts` line ~33 (`SAVE_KEY`
  'gta-quests-v1')
- `games/gnome-theft-auto/src/campus/achievements.ts` lines 1-40 (how an area's achievements read state)
- `games/gnome-theft-auto/src/societies/achievements.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/achievements.ts`: `installSocietyAchievements(deps)` returns a `SocietyPart`.
  - `window` listeners (guard `typeof window`): `SOCIETY_EVENTS.moleJobDone` -> `deps.unlock(SOCIETY_ACH.honestDirt)`;
    and when that job's count in `loadSocietySave()` is now exactly 1 (its first time) -> `deps.increment(SOCIETY_ACH.everyHall)`.
    `SOCIETY_EVENTS.updraft` -> `deps.unlock(SOCIETY_ACH.verticality)`.
  - At install, catch up from the save: any job count > 0 -> unlock honestDirt; all four kinds > 0 -> unlock everyHall
    (unlocking is idempotent); `updraftRides > 0` -> verticality.
  - `update(dt)`: once a second: (1) if the quest `SOCIETY_QUESTS.underChorus` is 'done' in
    `parseSavesJson(localStorage.getItem('gta-quests-v1'))` (guarded try/catch) and the save's `molemanVisits` is false
    -> `updateSocietySave((s) => { s.molemanVisits = true; })` and, if `currentInterior()` is 'loamdeep', call
    `refreshInterior()` (from '../interiors') so he appears at once; (2) if `molemanVisits` and `currentInterior()` is
    'loamdeep' and the player's local position (world minus the room origin: the inverse of
    `interiorToWorld('loamdeep', 0, 0)`) is inside `LOAMDEEP.halls.underChorus` -> `deps.unlock(SOCIETY_ACH.seat)`.
  - `gta-birds-of-a-feather` and `gta-sat-down` come from quests (QuestDef.achievement / a choice ending): nothing here.
- `games/gnome-theft-auto/src/societies/achievements.test.ts` (new): with fake deps (`unlock`, `increment` as `vi.fn()`)
  and a stubbed in-memory `localStorage` (vi.stubGlobal) holding a societies save with every job count 1: install unlocks
  honestDirt and everyHall; dispatching the updraft event (with a stubbed `window` EventTarget if node has none) unlocks
  verticality.

## Contract
`installSocietyAchievements(deps): SocietyPart` keeps its signature.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/achievements.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
