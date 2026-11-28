# E04 Story bible and world writing
Wave: 1 · Depends on: none (runs beside E01 and E02) · Kind: Story (docs only, no game code)
Source items: L04, L83, L84 (writing), L86 (first pass), L58 (who lives where), L67 + L68 (design)

- L04 make sure dialog is written in such a way that player has enough context
- L83 in general, make it so quests explore the world some and not just the main city.
- L84 add more quests to the main questline. I think we need some more character development. write out the docs, write out the direction, the characters, then start developing. I'm looking for 70 main quests, with a few extended quests at pivotal moments.
- L86 take another pass writing out menial lore for the new extended world.
- L58 introduce buildings or apartments or stuff where the main characters and side characters live and work. Right now we have just work in most cases, but no homes. I'd like to have it be that we can recognize special places where people live and ground us in the world. all characters should have a home. some may never be acknowledged. some quests should be re-written or extended to have us pick up or drop people off at homes, places of work, etc. (E04 writes who lives where; E10 builds; E20 uses.)
- L67 rework the side quests available to player so that they aren't overwhelmed. unlock some as game progresses and other characters make sense to appear
- L68 when completing a series of quests, make some change in the world so the player can feel the world developing

## Goal
Produce the written source of truth that E10, E11 to E19 (place names, who is where), E18 (side-quest schedule, world
changes) and the three build epics E20, E21, E22 read. After E04 nobody should have to invent plot: a build worker opens
a table row and has the quest's giver, place, beats, objective kinds, cast, stakes and what changes afterwards. Writing
only: no file under `games/` or `packages/` changes.

## Scope
In:
- A 70-quest main story outline in four acts (I Turfton, II the farms and woods, III the new edges of the map, IV the
  Dust Flats and the finale) built on the existing 17 quests, plus the "extended" pivotal quests (about 5 to 7, each 3
  to 5 parts with its own cutscenes: one at each act turn plus the finale).
- A character bible: existing cast (`CAST` in `src/quests/stages.ts`, `src/cutscene/cast.ts`) and new cast: motivation,
  arc by act, what they want from the player, voice notes, and **home and workplace for every character** (L58).
- Direction notes for the new material (extends the directing bible), including the L04 context rules and the L83 world-use rules.
- The side-quest unlock schedule (L67) and the world-change-after-series list (L68), as tables.
- First-pass lore entries and rulings for every new area and every new named person or thing (L86).

Out: any quest def, scene script, stage or code; geometry (E01 owns site coordinates); actual dialog lines (leads write
them while building); the final lore pass (E22).

## Code pointers (confirmed)
- Existing 17 main quests: `games/gnome-theft-auto/src/quests/chapter1.ts` to `chapter5.ts` (ids: prologue-fresh-kiln,
  first-contract, ch1-mowers-keepers, ch1-two-coat-tail, ch1-tax-break-in, ch1-founders-boot, ch2-dew-run,
  ch2-sprinkler-gauntlet, ch2-vespers-offer, ch2-unmowed-tablet, ch3-salvage-raid, ch3-kiln-resin-ice,
  ch3-tundra-drift-run, ch4-runway-flares, ch4-sandpit-drop, ch4-spade-truce, ch5-even-cut with variants A/B).
  Registered in `src/quests/defs.ts` (spread of CHAPTER_n_QUESTS, SIDE_QUESTS, OUTSKIRTS_QUESTS, CITY_QUESTS, NEWCOMER_QUESTS).
- Objective kinds an outline row can name (`src/quests/types.ts`): crack, visit, steal-deliver, chase-follow,
  convoy-ambush, air-drop, survive-derby, boss-combine, choice, race, checkpoints, probe, tessie-*. A row names the kind
  it wants; when a new kind is needed the row says "needs new kind: ..." so E20/E21/E22 can plan it.
- Existing story docs to extend, not replace: `docs/design/gnome-theft-auto/story.md` (arc, chapters, factions, section 6
  chapters), `story-edit-pass.md` (character introductions, comms connections), `society.md`, `world-lore.md`,
  `brands.md`, `environments.md`, `cutscenes.md`, and the direction bible `direction/bible.md` (cast section 2, spine and
  tension curve and setups to plant section 3, pacing numbers section 4, waivers section 7) with `direction/scenes/*.md` per scene.
- Side quests and when they open: `src/quests/sideQuests.ts`, `src/quests/unlocks.ts` (`SIDE_UNLOCKS`: questId, after,
  why), `outskirtsQuests.ts`, `cityQuests.ts`, `newcomerQuests.ts`, `tessieQuest.ts`.
- Cast data (homes, haunts, routines, vehicles): `CAST` in `src/quests/stages.ts`; most main characters already carry a
  `home`. Voices: `src/voice/voices.ts`. Comms rules (max 16 words per line): `src/quests/comms.ts`.
- Lore: `docs/lore/canon.md`, `settings.md` (gnome-theft-auto sits in `apocrypha`), `rulings.md` (take the next free R-numbers
  at the time you write), `entries/apocrypha/<slug>.md`. Search with `npm run lore -- find <word>` (Git Bash: `export
  PATH="/c/Program Files/nodejs:$PATH"`), validate with `npm run lore`.
- New areas by master-plan placeholder (E01 decides geometry, E04 decides names and records them in lore): ocean coast +
  boardwalk + ferris wheel + pirate ship; research university + observatory on an ant-hill mound + new runway; the
  neighbour's yard / golf course; dirt track; rally route + toadstool forest; ski hill (Frostbite Fells); vineyard +
  mansion; wind farm; the mole society under the highway; the cult camp; construction sites; basketball court; skate
  park; downtown park and the 2x1 mega block with a tunnel; character homes (incl. the player's downtown apartment).

## Files this epic produces (formats for the build epics)
All under `docs/design/gnome-theft-auto/` unless noted. Tables are Markdown pipe tables, one row per item, stable ids,
so a lead can paste a row into an issue.
1. `story-outline.md`: act summaries (premise, stakes, what the player wants and learns, emotional curve), then **the
   quest table** with columns: `# | id | title | act | status (keep / rewrite / new / extended-part) | old id | giver
   (place) | region | prereq id | cast | beats (3 to 6 one-line beats) | objective kinds | cutscenes (intro / mid / outro,
   each with time of day) | comms steps | reward and unlock | world change id | side quests it opens | notes (L58 home or
   workplace pickups, L83 region tag)`. Numbers 1 to 70: 1 to 35 act I+II, 36 to 53 act III, 54 to 70 act IV. A second
   table lists each extended quest's parts (`<id>.p1..pN`, each with its own cutscene and objective). A third lists
   candidate achievements and cosmetic rewards per act turn.
2. `characters.md`: one block per character: id (the CAST key), full name, role, faction, first and last quest, want /
   fear / secret, arc beats by act, how they talk (voice notes for `voices.ts`), **home** (place name plus site slot or
   building), **work**, vehicle, visual hook, `L58 visibility` (acknowledged or never shown), new or existing. Plus one
   table `character | home | home site slot | workplace | pickup/drop-off quests` that E10 reads to build homes.
3. `direction/batch-3-notes.md`: tone ladders for the new acts; recurring motifs and setups planted by quest N and
   paid off by quest M (extends bible section 3); the **context rule** (every quest intro or comms step 0 says who is
   asking, what they want, where, why now and what the player gets, in the speaker's voice; a one-line "previously" in
   the journal entry; no quest depends on a cutscene the player may have skipped); the **world-use rule** (no more than
   2 consecutive main quests in one region; each act visits at least 3 regions; every new area gets at least one main
   quest and one side quest); shot-variety notes (feeds L73); time of day per scene (feeds E06's time-lapse).
4. `side-quest-schedule.md`: `side quest id | unlocks after (main quest number and id) | giver appears because
   (character event) | region | max open at once`. Rule: at most 3 side quests offered at once early, rising to about 6
   by act III. Covers existing side quests and the ones E10 to E19 add (use placeholder ids `sq-<slug>`).
5. `world-changes.md`: `id | after quest series (from..to) | what changes | where | visible as (prop, npc, sign, shop,
   skyline, radio line) | engine support needed`. About 12 to 16 entries, at least one per act turn and per region.
6. In `docs/lore/`: `entries/apocrypha/*.md` (one per new place, person or thing named in the outline, following the
   template and neighbouring entries), a `settings.md` line for the new areas under `apocrypha`, `rulings.md` additions
   for decisions that touch canon (the ocean exists, the Underground, the cult), and `INDEX` regenerated if the tool
   does it. `npm run lore` must pass. Also add the new docs to `docs/design/gnome-theft-auto/README.md` and to the
   gnome-theft-auto row of `AGENT_INDEX.md`.

## Contracts this epic provides
- Stable quest ids and numbering: kept quests keep their old id (saves and `QUEST_PLANS` in `src/questSim/plans.ts`
  depend on them). New main quests use id `m<NN>-<slug>` (NN = outline number, zero padded); extended parts
  `m<NN>-<slug>-p<k>`.
- The outline says which existing quests are rewritten in place (same id, new text and cutscenes) and which are only renumbered.
- Place and character names, homes and workplaces recorded in lore so E10 to E19 use the same names.
- Every quest row has a prereq, giver, region and cutscene list (E20/E21/E22 leads rely on that).

## Contracts this epic consumes
- The master plan's placeholder area list and standing decisions. E01 runs in parallel and records site slots in its own
  files: do not wait. Refer to areas by placeholder name, mark each `site: TBD by E01`. If E01's later names disagree with
  your lore entries, the lore entry wins on names and E01 on geometry (the orchestrator reconciles at merge).
- The 17 main quests and the existing side quests as they are in code today.

## Online / mobile / achievements / prefabs / lore notes
- Achievements: candidate list per act turn and extended quest (the build epics edit `packages/achievements/src/catalog.ts`).
- Mobile: note any beat that would need a new touch control; story quests must not depend on desktop-only input.
- Online: story quests stay single-player (as today); say so once in the outline.
- Lore: follow `docs/lore/canon.md` (clay gnomes, Tall Ones, cracking and gluing, no gore: R-021) and the setting rulings.
- Prefabs: where a quest needs a unique object (a trophy, a key, a telescope), list it as "prefab needed" in the row.

## Risks and open questions (decisions taken)
- Old saves with later quests already done: decision, a quest is offered when its `prereq` is done; renumbered or
  inserted quests simply appear as available catch-up quests, nothing hides or resets. Every inserted quest therefore
  gets a prereq that exists in old saves (usually an old quest id), and the finale `ch5-even-cut` keeps its id and sits last.
- 70 quests is a lot of plot: decision, about 20 are short connective quests (one place, one cutscene, one objective)
  that carry character and context; the heavy ones are the extended quests plus the existing setpieces.
- Tone drift: keep the contract in story.md section 1. Review the outline against `story-edit-pass.md`.
- E01 may move or rename sites: the outline refers to sites by slot name (e.g. "the observatory mound"), never coordinates.
- Cast growth: every new character gets a voice note and a visual hook (hat, beard, vehicle) so a CAST preset can be added later.

## Done when
- The six outputs exist and are linked from `docs/design/gnome-theft-auto/README.md`; the quest table has exactly 70
  numbered rows (plus extended-part rows), each of the 17 existing quests appears once, every character has a home and a
  workplace, every new area has a main quest, a side quest and a lore entry.
- `npm run lore` passes; no file outside `docs/` and `AGENT_INDEX.md` changed.
- Spot check: pick 5 random rows; a build worker could implement each from the row plus the character block alone.
