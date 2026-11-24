# E21 Story act III (quests 36-53)
Wave: 8 · Depends on: E04, E20, E11 to E17 (every new area the act visits; E19 optional) · Kind: Story (build)
Source items: L45, L83, L84 quests 36-53

- L45 add some more quests to the main story that interact with these newer areas so they are all tied in. ensure same quality with cutscenes and character development
- L83 in general, make it so quests explore the world some and not just the main city.
- L84 add more quests to the main questline. I think we need some more character development. write out the docs, write out the direction, the characters, then start developing. I'm looking for 70 main quests, with a few extended quests at pivotal moments.

## Goal
Build rows 36 to 53 of `docs/design/gnome-theft-auto/story-outline.md`: the act that takes the story out to the new
edges of the map (coast and boardwalk, campus and observatory, golf course, dirt and rally, toadstool forest, vineyard
and mansion, farm, the underground societies, the ski hill, wind farm, as the outline places them), so that the places
built in E11 to E17 are tied into the main plot with the same cutscene quality and character development as acts I and
II. Follow the **build protocol of E20** (`docs/roadmaps/gta-batch-3/E20-story-acts-1-2.md`: layout, per-quest
checklist, load rules): this brief lists only what differs.

## Scope
In: quests 36 to 53 (18 quests): new `m<NN>-*` quests, any existing quest the outline places in 36 to 53 (likely the
Frostbite Fells chapter-3 trio and the chapter-4 openers; they keep their ids, rewritten in place if the outline says
so), extended multi-part quests that fall here (at least the act II to III turn and the mid-act pivotal one),
cutscenes, comms, stages in the new areas, voices and CAST presets for the new characters, home/workplace beats for
the new characters (golf owner, pro and groundskeeper; the professor; vintner; mole society; cult leader, as the
outline names them), side-quest unlocks and world changes tied to these quests, achievements.
Out: quests 1 to 35 and 54 to 70; building or changing areas (a quest needing a missing prop or interior gets a prefab, a
stage addition or a reduced beat, never an area edit: areas belong to E11 to E17); the final lore pass.

## Code pointers (confirmed)
All the E20 pointers apply (quest defs `src/quests/`, scenes `src/cutscene/scenes/story/`, stages `src/quests/stages/`,
comms `src/quests/comms*.ts`, voices `src/voice/voices.ts`, sim `src/questSim/plans.ts`, pacing `src/cutscene/pacing.ts`).
Additional for this epic:
- E21's own layout (created in its setup issue, following E20): `src/quests/story/actIII.ts`, `src/cutscene/scenes/story/actIII.ts`,
  `src/quests/stages/story<Area>.ts` per new area (check E01's site registry and each content epic's stage or stage-like
  files first; if an area epic already added `stages/<area>.ts`, add story stages in a separate `story<Area>.ts` rather than editing it).
- Region ids and the world map: `src/levels.ts` (RegionId), region documents added by E01, site registry from E01
  (look it up in `AGENT_INDEX.md` after E01 merges); area constants in `src/config.ts` (hot file: one setup issue adds all needed constants).
- Objectives likely needed here beyond existing kinds: `race`/`checkpoints` on the E14 dirt and rally tracks, a golf
  round or putt (`gnome-golf` shared package from E15), basketball or skate (E19), a boat or tubing leg (E11), a
  helicopter landing on a roof (E05), a ski run (E12), a farm task (E16), a tunnel dig (E17). Each reuses the activity's own
  API; the quest runner only starts the activity with a goal and listens for its result. One new `objectives<Area>.ts` per
  area, owned by the sub-epic for that area. Add solver support for each in `questSim/solvers/` or mark `expect` with a class and reason.
- Time of day: scenes set at night, dawn or dusk use E06's time-lapse transition; if the weather option is on, check scenes under rain and snow.

## Contracts this epic provides
- Quests 36 to 53 complete; ids per outline; `m<NN>-*` file layout like E20; a quest-to-area table in the lead's roadmap
  that E22 uses to confirm every new area has at least one main quest (L45).
- New CAST presets and voices for the new characters, available to E22.
- The act III to IV turn: the pivotal extended quest at the end of the act leaves the world in the state the outline
  names (and fires its world-change id) so E22 can start from a known save.

## Contracts this epic consumes
- E20: layout, aggregators, setup done; CAST and voices for act I and II cast; the quest numbering 1 to 35.
- E11 to E17: the places, their activities and interiors, their NPC spawn points and any local stage files. E05: interiors
  and rooftops. E08: ownership (a quest may reward a vehicle, a property or an inventory item). E06: time-lapse. E04: outline
  rows, characters, direction notes.
- E18 (if finished before): side-quest schedule hooks and world-change mechanism; otherwise note which world changes are deferred.

## How to split
Wave 8 has only this epic so the lead can run up to 3 sub-epics in parallel. About 18 quests: 6 to 7 sub-epics of 2 to 3
quests, grouped by **area** (each owns its `story<Area>.ts` stage file and its `objectives<Area>.ts`), at most 2 quests
per worker:
1. Setup (serial): aggregators, one-line registrations in `defs.ts`, `scenes/index.ts`, `comms.ts`, `stages.ts`, `config.ts`
   constants, `QUEST_PLANS` stubs with `expect` unknown, a `unlocks.ts` reorder.
2. Coast and boardwalk; campus and observatory; golf course and neighbour's yard; dirt, rally and toadstool forest;
   vineyard, mansion, farm and wind farm; the underground societies and cult; ski hill (adjust to the outline's
   actual placement). Within a sub-epic: issue per quest or pair, ordered stage file, scenes, def, comms, sim.
3. Extended quests: one issue per part pair for the scenes; the lead assembles the def and runs the whole quest by hand once.
4. Integration (lead): run the whole act in order with the quest sim story suite; walk the new-area transitions.
Hot files (`config.ts`, `defs.ts`, `stages.ts`, scenes `index.ts`, `comms.ts`, `unlocks.ts`, `plans.ts`) are edited only by the
lead or the setup issue; workers report the lines.

## Per-quest checklist
Same ten points as E20 (def matches outline row; L04 context; direction note and cutscene quality; `?cutscenecheck`
LOS on every new stage; `npm run cutscene-report -w games/gnome-theft-auto`; quest sim completes it or documents the
failure; voices and CAST; homes and workplaces used; build and tests pass; prefabs and lore) plus:
- The quest visits the new area for a reason the player can state (L83), and its intro tells the player where it is and
  how to get there (map marker, road, ferry, ramp), since new areas sit far from Turfton.
- The quest can be reached and started with the player's current vehicles; if it needs a type (boat, plane, dirt bike),
  an earlier row grants or sells it (E08 shops) or the quest spawns one nearby (L09).
- A follow or escort objective is finishable if the player stops or goes off-route (L03): test by hand once.

## Online / mobile / achievements / prefabs / lore notes
- Single-player story. Mobile: new activities (golf, skate, basketball, ski) must be playable by touch in the quest; if a
  minigame lacks touch controls, E21 reports it instead of shipping a desktop-only quest.
- Achievements: act III candidates from E04 plus one per new area visited via story; `npm test -w packages/achievements`.
- Prefabs: unique story objects (the trophy, the lens, the cult idol, a vintage bottle) go through `@lawn/prefabs`.
- Lore: every new character, object and place must already have an E04 entry; if the build invents more, add an entry or ruling and run `npm run lore`.

## Risks and open questions (with the decision taken)
- A content epic (E11 to E17) merged partially or without a promised feature: decision, the quest uses the nearest
  working beat and the lead lists the cut in its report; never edit the area epic's code beyond adding a stage file.
- Area geography differs from the outline: the outline wins on story, E01's site registry wins on geometry; stage spots are chosen on the actual map.
- Long travel: new areas are far; quests chain two or three beats per area to justify the trip, with a fast-travel or taxi
  hook only if the existing taxi system already offers it (see `docs/roadmaps/gta-quest-flow-taxi.md`).
- Sim and LOS cost: scenes in new terrain often fail the LOS check; budget one fix issue per area.
- Context overload on the lead: the lead reads the act's 18 rows, E20's brief and this one only, and does not re-read finished scenes.

## Done when
- Quests 36 to 53 playable in order after quest 35 on a fresh and an old save; each new area has a main quest in this act (or the outline says it belongs in act IV).
- `npm run build`, `npm test` (game), `quest-sim:suites` for the story rows, `?cutscenecheck`, cutscene report, `npm run lore` and `bash tools/smoke.sh` pass; deferred beats and known-failure sim rows listed in the lead's 30-line report; commit on the lead's branch, no push.
