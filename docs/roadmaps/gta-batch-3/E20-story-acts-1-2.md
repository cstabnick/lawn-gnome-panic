# E20 Story acts I-II (quests 1-35)
Wave: 7 · Depends on: E04 (outline, characters), E10 (homes and downtown life), and transitively E01, E05, E08 · Kind: Story (build)
Source items: L04 (applied), L45, L58 (quest pickups and drop-offs at homes), L84 quests 1-35

- L04 make sure dialog is written in such a way that player has enough context
- L45 add some more quests to the main story that interact with these newer areas so they are all tied in. ensure same quality with cutscenes and character development
- L58 introduce buildings or apartments or stuff where the main characters and side characters live and work. ... some quests should be re-written or extended to have us pick up or drop people off at homes, places of work, etc.
- L84 add more quests to the main questline. I think we need some more character development. write out the docs, write out the direction, the characters, then start developing. I'm looking for 70 main quests, with a few extended quests at pivotal moments.

## Goal
Turn rows 1 to 35 of `docs/design/gnome-theft-auto/story-outline.md` (E04) into playable quests: quest defs, comms,
cutscene scenes with the same quality as the existing ones, stages, voices, quest-sim coverage. Acts I (Turfton) and II
(farms and woods, and the first reach to the edges) end with a working, saved, completable story up to quest 35. This
brief also defines the **build protocol** that E21 and E22 reuse.

## Scope
In: quests 1 to 35: the existing quests the outline places here (rewritten in place where it says `rewrite`, same ids),
the new `m<NN>-*` quests, the extended multi-part quests that fall in 1 to 35, their cutscenes (intro, mid, outro), comms,
journal text, stages, new CAST presets and voices, home/workplace pickups and drop-offs (L58) using E10's homes,
side-quest unlocks that the outline attaches to these quests, world-change hooks for these quests (E18 owns the generic
mechanism; this epic only fires the triggers the outline names), achievements for these quests.
Out: quests 36 and up; building new places (E10 to E17 did); engine changes except small new objective kinds a quest truly
needs (see risks); editing other games; the final lore pass (E22).

## Code pointers (confirmed)
- Quest data: `src/quests/chapter1.ts` to `chapter5.ts` (`CHAPTER_n_QUESTS`), registry `src/quests/defs.ts` (spreads at ~line 188),
  types `src/quests/types.ts` (`QuestDef`: id, title, giver, prereq, chapter, objectives, cutscene, outro, beats, radioBulletin,
  rewardAcorns, achievement, doneText), objective runners `objectives*.ts`, journal `journal.ts`, saves `questSave.ts`.
- Unlocks: `src/quests/unlocks.ts` (`SIDE_UNLOCKS`, story order comment at the top, keep it in sync).
- Comms: `src/quests/comms.ts` (`COMMS[questId][step]`, `CALLER_NAMES`), per-area files `commsCity.ts`, `commsNewcomers.ts`
  (pattern to copy for a story-only file). Lines: 16 words max, one place name per call.
- Scenes: `src/cutscene/scenes/story/ch1.ts` ... `ch5.ts` (+ `kit.ts` helpers `markOf, pathOf, rideOf, spot, up`), collected in
  `src/cutscene/scenes/index.ts` (`SCENES`), built with `beat/coverage/cut/reaction/shot` from `src/cutscene/direct.ts`;
  engine in `director.ts`, `script.ts`, `rooms.ts`, `los.ts`, `check.ts`, `checkStage.ts`, `cast.ts` (CAST presets), `pacing.ts`.
  Per-scene direction notes `docs/design/gnome-theft-auto/direction/scenes/<scene>.md` (copy `direction/TEMPLATE.md`).
- Stages (where scenes play): `src/quests/stages.ts` (`CAST` with home, haunts, routine, vehicle; registry of stage files)
  and `src/quests/stages/<region>.ts` (cloverfield, east, turfton, turftonB, turftonC, wilds, speedway, pebblewick), types in `stages/kit.ts`.
  `stages.test.ts` checks every spot against the world (on land, out of colliders, camera LOS, vehicle paths).
- Voices: `src/voice/voices.ts` (`VOICES` by lowercase CAST key).
- Quest sim: `src/questSim/plans.ts` (`QUEST_PLANS`, one row per quest; `coverage.test.ts` fails without one), solvers in
  `questSim/solvers/`, doc `docs/roadmaps/gta-quest-sim.md`; scripts `npm run quest-sim`, `quest-sim:suites` in the game package.
- Pacing: `npm run cutscene-report -w games/gnome-theft-auto` (`src/cutscene/pacing.test.ts`, baseline `pacing.baseline.ts`);
  LOS/collision check: open the dev server with `?cutscenecheck` (and `npm test` runs it on all scenes); play one scene with `?cutscene=<id>`.
- Achievements: `packages/achievements/src/catalog.ts`; prefabs `packages/prefabs/src/catalog/`.

## Contracts this epic provides
- Quests 1 to 35 complete and in order; `ch1-*`, `ch2-*` ids unchanged; new ids `m01-...` as E04 assigned.
- File layout other epics extend (E21/E22 copy it): `src/quests/story/<NN>-<slug>.ts` one file per quest (def + its comms
  export), `src/quests/story/actI.ts` and `actII.ts` aggregators (the only files that import the per-quest files),
  `src/cutscene/scenes/story/m<NN>-<slug>.ts` one file per quest's scenes, `src/cutscene/scenes/story/actI.ts` /
  `actII.ts` aggregators, `src/quests/stages/story<Area>.ts` per area, `src/quests/commsStory.ts` merging per-quest comms.
- Existing chapter files keep only the quests that stay as they are; rewritten ones move to the one-file-per-quest layout
  in the same commit (keep their id).
- `QUEST_PLANS` rows, journal text and comms for each quest, new CAST presets, `VOICES` entries.

## Contracts this epic consumes
- E04: outline, characters, direction notes, side schedule, world-changes. E10: homes and workplaces (interior or exterior
  stage per character), downtown park and mega block. E05 interiors, E08 inventory and ownership (a quest may give or
  take items, a loaned apartment adds debt: check the E08/E10 APIs in their briefs and `AGENT_INDEX.md`), E06 time-lapse transition
  for scenes at another time of day, E09 voices/sound cues, E03 follow-quest reliability fixes (L03) and spawn-vehicle-near
  (L09) already in place.

## How to split (so no worker owns more than about 2 quests)
The lead creates 5 to 6 sub-epics, each about 5 to 7 quests grouped by **region** (so a stage file has one owner), run
in parallel after a short serial setup:
- Setup issue (serial, lead or one worker): create the folder layout above, empty aggregators, one-line additions to
  `defs.ts`, `scenes/index.ts`, `comms.ts`, `stages.ts` so the hot files are touched exactly once, move nothing else.
- Sub-epic per region (e.g. A downtown Turfton, B Patio Heights and east, C Cloverfield, D Mossy Wood and Hollow, E the
  first new-area reaches, F extended quests): each sub-epic has 3 to 4 issues, each issue at most 2 quests, one worker
  each; a worker writes only its quest files, its `scenes/story/m<NN>-*.ts`, its direction note and, if it owns the
  region's stage file, additions to that file. A worker never edits an aggregator or a hot file: it reports the one-line
  entry for the lead to add (or the lead pre-registers `m<NN>` slots in the setup issue as stubs the worker fills).
- Extended quests: one worker per part pair, scenes only; the lead assembles the quest def.
- Never two workers on one stage file at once; same-region sub-epics run sequentially, different regions in parallel.
- If decompose finds more than about 30 issues, stop after the first 30, commit a working state and report the rest as deferred.

## Per-quest checklist (a worker's issue ends only when all hold)
1. Def complete and matches the outline row: giver, prereq, objectives, reward, achievement, `radioBulletin`, journal text, `doneText`.
2. Context (L04): intro or comms step 0 states who, what, where, why now, reward in the speaker's voice, 16 words per comms line; nothing assumes a skipped scene.
3. Cutscenes: direction note in `direction/scenes/`, follows the bible (shot lengths, beats, setups), has audio cues, a time of day, sensible actors and vehicles; at most the target length in bible section 4.
4. Stage LOS: `?cutscenecheck` clean for every new stage and scene (camera LOS, colliders, on land); `npm test -w games/gnome-theft-auto` includes `stages.test.ts` and `scenes.test.ts`.
5. Pacing: `npm run cutscene-report -w games/gnome-theft-auto` shows no new fault; update `pacing.baseline.ts` only for accepted values and say why.
6. Quest sim: a `QUEST_PLANS` row, and the sim completes it (`expect: 'pass'`) or the row documents a known failure class and reason; update the roadmap table.
7. Voices: every speaker has a `VOICES` entry distinct from the others; CAST preset exists.
8. Home/workplace (L58) used where the outline says; the characters' home exists (E10) or the beat is cut and noted.
9. `npm run build -w games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass; mobile: no new desktop-only input.
10. Prefabs through `@lawn/prefabs`, lore searched before naming anything.

## Online / mobile / achievements / prefabs / lore notes
- Single-player story; no `@lawn/mp` work. Mobile: any quest-specific HUD or choice prompt has touch targets of 44 px.
- Achievements: the outline's candidates for quests 1 to 35, each with a cosmetic reward through an existing prefab where one fits; `npm test -w packages/achievements`.
- Lore: new names go through `npm run lore -- find`; undecided facts become a ruling; `npm run lore` passes.

## Risks and open questions (with the decision taken)
- Hot-file collisions: one file per quest and aggregator-only registration (above); the lead alone edits aggregators and hot files.
- Rewriting an existing quest breaks saves or the sim: keep ids, objective counts and `beats` indexes unless the outline says otherwise; update `QUEST_PLANS` and `unlocks.ts` in the same commit.
- New objective kind needed: allowed only if two or more quests use it; put the runner in a new `objectives<Name>.ts`, with a solver in `questSim/solvers/`, or the quest falls back to `visit/steal-deliver/choice`.
- Scene count: about 60 scenes in this epic. Decision: connective quests get one intro and a short outro (or comms only); the full three-scene treatment goes to the extended and setpiece quests.
- E10/E05 not ready for a home or interior: the beat uses the building's exterior stage; note it as deferred.

## Done when
- Quests 1 to 35 playable start to finish in order on a fresh save and from an old save; every quest's checklist ticked in the lead's roadmap.
- Build, game tests, `npm run quest-sim:suites` for story rows, `?cutscenecheck`, cutscene report, `npm run lore` (if lore changed), and `bash tools/smoke.sh <url> <dom-marker>` clean.
- The lead reports quests deferred and sim rows that are known failures (30 lines max); one commit per sub-epic or one for the epic on its own branch, no push.
