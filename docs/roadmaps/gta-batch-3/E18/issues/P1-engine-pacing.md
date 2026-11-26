Epic: E18-A (pacing, Dewdrop, hobbies, world-change engine)
Depends on: none (foundation is in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first.

## Goal
The quest engine marks on the map, beams and announces only the side quests that pacing *offers* (a few at a time);
the rest stay takeable from their giver. Finished quests record `doneAt`, and a 'choice' ending records `ending`.

## Read first
- `games/gnome-theft-auto/src/quests/pacing.ts` (done, do not edit): `sidePacing(saves, quests)` -> `{ row, beats, cap,
  offered, later, upcoming }`, `isPaced(id)`, `beatsDone(saves, quests)`.
- `games/gnome-theft-auto/src/quests/quests.ts`: `createQuests`. Key spots: `waitingAt` / `giverKind` / `giverColor`
  (~l.510-516), `giverOf` (~l.524), notices (`known`, `notices`, `noticeUnlocks` ~l.518 and ~l.720-735), quest completion
  (`save.state = 'done'` ~l.633 and any other place a quest is set done, e.g. ~l.605-612), `update` marker loop (~l.770),
  `blips()` (~l.832-850), pinned-giver waypoint (~l.961).
- `games/gnome-theft-auto/src/quests/objectivesAction.ts` (~l.270-310): the 'choice' runner (`chosen`, `ending`).
- `games/gnome-theft-auto/src/quests/types.ts`: `QuestSave.doneAt?: number`, `QuestSave.ending?: 'A' | 'B'` (exist).
- `games/gnome-theft-auto/src/quests/unlocks.test.ts` "side unlock engine" tests (they must keep passing).

## Change
- `quests.ts`:
  - Keep a cached `let pacing = sidePacing(saves, questList)` and an `offeredSet = new Set(pacing.offered)`; recompute both
    in a `refreshPacing()` called once at creation and after every `storeSaves(saves)` call (add the call next to each).
  - Split the giver checks: `waitingAt(id)` stays as is (any available quest: used by `giverOf`, `interact`, `prompt`,
    the pinned waypoint). Add `markedAt(id)`: `activeId === null && questList.some((qd) => qd.giver === id &&
    isQuestAvailable(qd, saves) && (markerKind(qd) === 'main' || !isPaced(qd.id) || offeredSet.has(qd.id)))`. Use
    `markedAt` (not `waitingAt`) for the beam/star/ring/badge visibility in `update` and for which givers `blips()`
    lists (both places that loop givers there). `giverKind` for a marked giver must prefer a main quest, then an offered
    side quest (use the same filter).
  - Notices: `known` holds offered ids. At creation fill it from `pacing.offered`. `noticeUnlocks()` walks
    `pacing.offered` (after `refreshPacing()`) instead of `unlockedSideIds(saves)`; everything else (queue timing, Tessie
    skip, `deps.onSideUnlock`) unchanged. Remove the `unlockedSideIds` import if unused.
  - On every completion (`save.state = 'done'` for any quest), set `save.doneAt = beatsDone(saves, questList)` right
    after the state change (for a main quest this counts itself).
- `objectivesAction.ts` 'choice' runner: when option A is chosen set `_save.ending = 'A'` (rename the param to `save`),
  for option B `save.ending = 'B'`. Nothing else.

## Contract
- `isQuestAvailable` and `unlockMet` keep their signatures and behaviour (a Later-shelf quest is still taken by walking up
  to its giver and pressing interact).
- The engine's public `Quests` interface does not change.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes for your files.
- `npx vitest run src/quests/unlocks.test.ts src/quests/quests.test.ts src/quests/quests.retry.test.ts src/quests/tessieUnlock.test.ts` pass.
- Add one test to `src/quests/unlocks.test.ts` ("side unlock engine" describe, reuse its `makeDeps`, `pipQ`, `gridQ`,
  `givers`): after Pip's quest is done the `sq-grid-truthers` giver is in `engine.blips()` as kind 'side', and the saved
  entry of Pip's quest has `doneAt === 1`.

## Out of scope
`journal.ts`, `pacing.ts`, `unlocks.ts` (other issues own them).
