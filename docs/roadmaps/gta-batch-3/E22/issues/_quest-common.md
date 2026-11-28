# E22 quest issues: the common contract (read this first, all of it)

You are writing one or two main-story quests (or two parts of an extended one) of Gnome Theft Auto
(`games/gnome-theft-auto`) from the 70-row story outline, act IV ("Sandpit Protocol / The Even Cut", rows 54-70): the
last act, where a coalition of outcasts takes Fort Sandpit and stops the Grand Combine. It is the payoff of every arc
set up in acts I to III, so most of your scenes are **reunions**: the player meets people they already know, and the
scene must show what changed. Writing and directing quality decides this work: your scenes must be as good as the best
existing ones (acts I to III, built by E20 and E21 in the same layout). The user asked for a world that feels
**polished and hand-crafted**: spend the time on details.

## Environment

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adec7594cd8bfc2db` (Git Bash; if `node`
  is missing: `export PATH="/c/Program Files/nodejs:$PATH"`). `npm install` is done. Do **not** commit, push, or run
  `git stash`/`git checkout`. Keep LF line endings.
- Up to seven other workers write other quests or lore in the same repo at the same time. Touch only the files your
  issue lists. `tsc` may briefly see another worker's half-written file: if an error is in a file you do not own, wait a
  minute and rerun; never edit it.
- Do not start a dev server (no ports). The headless checks below cover LOS, collisions and pacing.

## What is already in place (the lead's setup)

- Every quest id of rows 54-70 exists (the whole act's prereq chain works). New rows are **stubs**: one visit objective
  at the Dust Flats overlook safehouse, a stub briefing, `plans` `{ suite: 'story', expect: 'pass' }`, and the stub stage
  file adds the ids to `dust-safehouse`'s usedBy. **Replace the whole stub** with the real quest; keep the ids, the
  prereqs (they follow the outline), `chapter` (4 for rows 54-69, 5 for row 70) and the exported names/types. Remove the
  `dust-safehouse` USES line once your own stages carry the ids (keep it if your quest really uses the safehouse).
- Kept rows (55 `ch4-runway-flares`, 57 `ch4-sandpit-drop`, 59 `ch4-spade-truce`, 70 `ch5-even-cut`) were moved into
  their story files with their real objectives and comms; their old scenes stay in `cutscene/scenes/story/ch4.ts`,
  `ch4b.ts`, `ch4c.ts`, `ch5.ts`. For a kept row the objectives' **kinds, count and order must not change** (old saves
  store the step index); text, comms, scenes and rewards may.
- The finale (row 70) is split into `ch5-even-cut-p1` (Air Support: crack the Vanguard), `-p2` (Deck Drop: air-drop),
  `-p3` (The Gilded Lawn-Throne: `boss-combine` with `phase: 'guards'`, the deck fight) and `ch5-even-cut` (the final:
  `boss-combine` `phase: 'jam'`, crack Vesper, the A/B choice). Old saves are migrated (`quests/questSave.ts`
  `migrateFinaleSave`). Keep each part's objective kinds, count and order.
- Side-quest unlocks and world changes for these rows are already on the row ids (`unlocks.ts`, `worldChanges/defs.ts`):
  `race-snail-endurance` after m54, `sq-hum-at-three` after m60, `sq-porcelain-support` after m66; W15 fires after m60,
  W16 after m64, W17 after ch5-even-cut. You do not touch them.
- CAST presets, intro cards, voices and caller names exist (use them as `preset:` and comms `who:`): `pip`, `tansy`,
  `vesper`, `granny`, `diggs`, `bracken`, `wally`, `hogweed`, `tumblesoil`, `nubbin`, `'turncoat cam'`, `juniper`,
  `reginald`, `'don compost'`, `'big lou'`, `'mayor mulch'`, `samphire`, `brenda`, `'lugnut lulu'`, `wisteria`,
  `chicory`, `clara`, `hedda`, `bodega`, `hyssop`, `ernie`, `chard`, `betony`, `gary`, `saxifrage`, `peony`, `basil`,
  `thrift`, `driftwood`, `sorrel`, `loam`, `shelldon`; new in E22 (added by the foundation): `yarrow` (Reeve Yarrow
  Potsherd), `'burdock haybright'` (Head Ranger Burdock Haybright of the Unmown; the key `burdock` is a different gnome), `hector` (Hector Disdain, the waiter of Café
  Pardon), `velma` (Velma Crown of the Top Hat café, Brim Gap). Grep `src/cutscene/cast.ts` for the exact keys before
  using one. A cast member's home and workplace: `homeDoor(id)`, `workOf(id)` in `src/homes/data.ts`.
- Story props (`@lawn/prefabs` ids, E22 foundation, `packages/prefabs/src/catalog/gta-story-act4.ts`): `heist-board`,
  `door-mortar`, `parachute-rig`, `pump-impeller`, `roster-wall`, `diggs-medal`, `mole-pickaxe`, `cell-bunk`,
  `mulch-fountain-pen`, `first-vine-pot`, `shield-grate-key`, `porch-photograph`, `hatbrim-beacon`, `coalition-flag`,
  `hat-rail`, `crate-table`; and `stop-sign-lollipop` (a hand item, `gta-story-gear4.ts`). Existing ones that fit act IV:
  `grand-combine-boss`, `combine-test-deck`, `combine-harvester`, `stopping-stone`, `golden-acorn` (grep), `whirligig`
  pieces, `framed-photograph`, `ledger-book`, `flatbed-trailer`, `team-banner`, `bunting-span`, `street-banner-pole`,
  `hoa-clipboard`, `site-cone`, `fuel-can`, `camp-bedroll`, `broom`, `hay-bale`, `rolled-chart`, `dispatch-radio`.
  Grep `packages/prefabs/src/catalog/` for more (the area epics added hundreds). Props are prefab ids only.
- Achievements (E22, `packages/achievements/src/catalog.ts`): `gta-almost-certainly` (m56), `gta-salute-to-a-mole`
  (m60), `gta-all-hats` (m64 final), `gta-hairline` (m66), `gta-last-lift-home` (m68), `gta-lollipop-lady` (m69),
  `gta-hat-comes-off` (the finale's choice: the lead wires it), existing `gta-mid-air-jack` (57) and `gta-even-cut` (70
  final). Set `achievement: '<id>'` on the quest def named (it unlocks when that quest is finished).
- Map markers, journal items and grants: a quest that "marks X on the map", "puts Y in the journal" or "gives the
  player Z for keeps" (a vehicle in the garage) lists them in `src/quests/storyMarks.ts`, which **only the lead edits**:
  report the marker label + `[x, z]`, the item title + one-line text, and any grant (vehicle kind + name) in your final
  report. Already granted: Hangar Two and "The Crew's Crop Duster" after row 55.

## Files you own (and nothing else)

For each row in your issue (they exist):

1. `games/gnome-theft-auto/src/quests/story/<file>.ts`: `export const STORY: StoryFile` (quest defs, comms, sim plans,
   new givers, bulletins). Contract in `src/quests/story/kit.ts`:
   ```ts
   export interface StoryFile {
     quests: readonly QuestDef[];                 // p1, p2, ... then the row id
     comms: Record<questId, Record<step, CommsCall>>;   // build with brief(...) / call(...) from './kit'
     plans?: Record<questId, QuestPlan>;          // { suite: 'story', expect: 'pass' }; a choice needs variants: ['A', 'B']
     givers?: Record<giverId, GiverDef>;          // only for a giver that does not exist yet
     bulletins?: Record<questId, string[]>;       // Turfton FM bulletin per quest (radioBulletin = the quest id): >= 2 lines, no wet/no gore (R-021)
   }
   ```
   Import `brief`, `call`, `StoryFile` from `./kit`; never import `../comms`, `../defs` or `./index` (import cycles).
   Good examples: `src/quests/story/44-the-bathtub-queen.ts`, `50-trellisdown-tasting.ts`, `52-the-test-cut.ts`
   (extended), `34-forty-seven-wrenches.ts`.
2. `games/gnome-theft-auto/src/cutscene/scenes/story/m<file>.ts`: `export const SCENES: Record<string, SceneScript>` keyed
   by scene id (use the outline's scene ids). Examples: `m50-trellisdown-tasting.ts`, `m52-the-test-cut.ts`, `m44-the-bathtub-queen.ts`.
3. `games/gnome-theft-auto/src/quests/stages/story/s<file>.ts`: `export const STAGES: readonly Stage[]` (new stages your
   scenes stand on; each with `usedBy: ['<your quest ids>']`, and `givers: [...]` for any new giver) and
   `export const USES: Record<existingStageId, questId[]>` to add your quest ids to an existing stage's `usedBy` (grep
   `id: '` in `src/quests/stages/*.ts`: `east.ts` has `dust-safehouse`, `airfield-apron`, `fort-sandpit-gate`,
   `fort-sandpit-pad`; Pebblewick, downtown, Patio Heights, Mossy Wood, Cloverfield, Trellisdown, the coast, Rootwell,
   the societies and the second expansion all have stage files). **Every quest id (each part too) must appear in some
   stage's usedBy** (`stages.test.ts`).
4. One direction note per new or rewritten scene: `docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md` (copy
   the shape of `direction/TEMPLATE.md`; `two-coat-intro.md` and the E21 notes such as `m50-trellisdown-tasting-mid.md`
   are good ones), and the scene's `direction: { notes: '<that path>', kind: ... }`.
5. Only if your issue says so: an existing scene file it names (kept rows), or a new file it names.

You never edit: `quests/defs.ts`, `quests/comms.ts`, `quests/unlocks.ts`, `quests/storyRows.ts`, `quests/storyMarks.ts`,
`quests/questSave.ts`, `questSim/plans.ts`, `cutscene/scenes/index.ts`, any `act*.ts` / `index.ts` aggregator,
`quests/stages.ts`, `cutscene/cast.ts`, `castIntros.ts`, `voice/voices.ts`, `packages/**`, `worldChanges/**`, any area
module (`src/pardonlin/`, `src/unmown/`, `src/mountainRoutes/`, `src/living/`, `src/coast/`, `src/societies/`, `src/country/`,
`src/campus/`, ...: areas belong to their epics), `docs/lore/**`. If you need a change there (a CAST tweak, a prefab, a
lore ruling, an area hook), say so in your final report: the lead does it.

## Read first (in this order, skim what you already know)

- Your rows in the issue (pasted). The full outline is `docs/design/gnome-theft-auto/story-outline.md` (the "## Act 4"
  section: premise, tension curve, who changes; and the earlier acts for the setups your rows pay off). The E04 spine
  `docs/roadmaps/gta-batch-3/E04/spine.md` for names.
- `docs/design/gnome-theft-auto/direction/batch-3-notes.md` sections 2 (the act IV tone ladder), 3 (running jokes and
  where they pay off), 4 (context rule), 5 (world use), 6 (shot variety), 7 "Act IV" (time of day per scene).
- `docs/design/gnome-theft-auto/direction/bible.md` sections 4 (pacing numbers, scene length targets), 5 (camera), 6
  (sound), 6a (intro cards), 8 (common faults), 9 (engine vocabulary). And section 2 for your characters' voices.
- `docs/design/gnome-theft-auto/characters.md` for each character in your rows (look, voice, home, workplace, **arc by
  act**: your scene is where that arc lands).
- `docs/design/gnome-theft-auto/world-changes.md` if your row fires or follows a W-id (what the world shows after).
- `docs/lore/rulings.md` R-233 and **R-234** (act IV world use: the Mayor at Café Pardon, the vine to the Unmown, the
  Hatbrim beacon, Hangar Two).
- Reference code: an E21 story row (above), `src/cutscene/scenes/story/kit.ts` (`up`, `spot`, `markOf`, `carMark`,
  `pathOf`, `rideOf`), `src/cutscene/direct.ts` (`shot`, `cut`, `beat`, `reaction`, `coverage`, `pushIn`, `pullOut`,
  `insert`, `cutaway`, `varied`, `vary`), `src/cutscene/script.ts` (every step kind), `src/quests/stages/kit.ts` (Stage).
- Contracts: `docs/roadmaps/gta-batch-3/E09/contracts.md` (intro cards, foley, beds, shot variety), and the area epic
  contracts your issue names (each gives the place's coordinates, its activities and their quest hooks).

## Rules for the quest defs

- Ids, titles, givers, prereqs, rewards come from the outline row (the lead's decisions in your issue override it).
  Every main quest has `chapter`, `radioBulletin` (the quest id), `doneText`, `rewardAcorns`. An extended row's parts
  each have their own reward as the parts table says.
- Objective kinds (`src/quests/types.ts`): crack, visit (with `scene:` to play a scene on arrival, `interior:` to need
  the player inside an interior), steal-deliver (`maxDamage`, `banter`), chase-follow, checkpoints (`maxDamage`,
  `vehicle`, `requireVehicle`), probe, choice, survive-derby, convoy-ambush, race (`trackId`), air-drop, boss-combine,
  `passenger` and `inspect`:
  - `passenger`: `{ kind: 'passenger', text, who: <CAST key>, name, pickup: [x, z], dropAt: [x, z], radius, hint,
    vehicle?, maxDamage?, banter?: string[], onBoard?, onDrop? }`. The character waits at the pickup, gets in when the
    player stops beside them in a ground vehicle, gets out at `dropAt`. Use it wherever the outline says "pick up X",
    "drive X home" or "escort X out" (L58: reunions and drop-offs at homes).
  - `inspect` (photograph, read, look through, hold, fit, dig): `{ kind: 'inspect', text, verb: 'Photograph', points:
    [{ at, label, note?, prop? }], holdSeconds?, ordered?, hint, scene? }`. `note` is the toast that tells the player
    what they just learned: write it as story. It is also the fallback for the outline's "needs new kind: dig" (a hold
    at each dig point, `verb: 'Dig'`) and for "hold at the workbench".
  - The outline's "needs new kind: interior-visit" is a `visit` with `interior: '<interior id>'` where the interior
    exists (grep `defineInterior(` in `src/`), else the outline's fallback (the yard door and a scene).
  - Area activities count through `probe` (`{ kind: 'probe', text, probe: '<id>', count: 1, at?, hint }`): the ids
    are in each area's probes table (`SOCIETY_PROBES` in `src/societies/config.ts`, `COAST_PROBES`, `GOLF_PROBES`,
    `WINTER_PROBES`, the Pardonlin and living-world activity ids). Only use a probe id the quest sim already solves
    (grep `src/questSim/solvers/`).
- Mid-quest scenes: `beats: { <objectiveIndex>: '<scene id>' }` plays a scene as that objective starts; or a visit's
  `scene:`. Intro `cutscene: { kind: 'script', script: '<id>' }`, `outro` likewise.
- `hoa`: story steps default to the E23 policy; set `hoa: 'off'` for gentle quests (passenger rides, errands, reunions).
- No new objective kind, no engine change. If something is impossible with the kinds above, use the outline's fallback
  and say so.
- **Travel and context (L83, L03, L04):**
  - The quest visits its place for a reason the player can state, and its briefing (step 0) tells the player **where it
    is and how to get there** (road, ramp, canal, "west through the Wickets", "up the Brim Gap Road").
  - The quest can be started with the player's current vehicles; if a step needs a type (boat, plane), the objective
    spawns one nearby (`vehicle` on checkpoints, `vehicleKind`/`spawnAt` on steal-deliver, `planeAt` on air-drop), or
    the place's rental is right there and the text says so.
  - A follow or escort objective must be finishable if the player stops or goes off-route (chase-follow waits;
    passenger re-boards): say in your report how you checked it.
  - Previously-line: the first briefing line, or the intro's first beat, says in one breath what happened before (the
    outline's "Previously:" note), so a player returning after a week knows where the story is.

## Rules for the writing (L04, L105, keep the charm)

- Comms (`brief`/`call`): step 0 is the briefing: who, what, where, why now, and the reward, in the speaker's voice.
  At most 16 words a line, one place name per call. A player who skipped every scene must still know what to do and why.
- Dialogue in scenes: short lines, the character's own voice (bible section 2, characters.md tics), jokes that come
  from character, one sincere beat where the outline says so with **no gag on top**. Keep the satire and the warmth:
  this game is already fun, do not flatten it. From row 67 on: one gag a scene at most.
- **Payoffs (act IV is where the arcs land).** Read the "Arc by act" of every character in your rows and the running
  jokes in batch-3-notes section 3; your scene pays them off with a gesture or a line, not a speech: e.g. Tansy lets Pip
  run a plan ("Okay, hear me out"), Diggs goes from hardliner to ally (salutes a mole), the Mayor's coat ladder,
  Granny's pie, the golden kazoo, the forty-seventh wrench. A character who appeared in acts I-III and returns should
  show they remember the player (one line that names what they did together).
- Intro cards (L105): at a character's **first story appearance** (your issue lists who), after their first line or
  action, on an mcu/ms of them: `{ do: 'intro', who: '<actor id>' }`. The actor needs `preset: '<CAST key>'`. One card
  per character, ever (grep `do: 'intro'` in `src/cutscene/scenes/` first).
- Lore: before naming anything new (a shop, a sign, a dish), `npm run lore -- find <word>` from the repo root and follow
  `docs/lore/canon.md`. Report any new fact that needs a ruling; do not edit `docs/lore/`.
- L95 environmental storytelling: each quest has at least one thing seen only in its scenes: a cutscene-only vehicle,
  a set prop arrangement that tells a small story without text, a scripted moment in the world (a convoy cresting the
  dune, a tarp pulled over a rotor, a bell rung once). Props are `@lawn/prefabs` ids only.

## Rules for the scenes

- `stage: { kind: 'world' }` scenes at the real place (coordinates from your stage file, `homeDoor`, the area configs),
  `sky: 'noon' | 'golden' | 'night'` for the time of day in the outline (dawn and dusk are 'golden'), `ambience`, a music
  or stinger cue, at least 2 sfx/foley cues, and `direction: { notes, kind }`. Scenes cannot play inside interiors:
  stage interior beats as a world set beside the building, as E21 did.
- Follow bible section 4 shot lengths and the scene length target for the kind (intro / mid / outro); connective
  quests get a short intro and a short outro, setpieces more. Vary shot sizes and heights (`npm run cutscene-report`
  flags MONOTONE and thin sound).
- Use the stage helpers so marks and cameras are checked: put marks/cameras/paths in your stage file and read them with
  `markOf`/`spot`/`pathOf`, or use `up(x, z, h)` and `shot(...)` for world points (check them with the LOS test). Hills,
  dunes and the Hatbrim often fail LOS: raise or move the camera, never delete the shot.
- Vehicles in scenes: `vehicles: [{ id, kind, at, yaw, keep? }]`; a cast member's own ride via `rideOf('<cast id>')`.
- World changes: after W15 (m60) Fort Sandpit's gate flies coalition colours; after W16 (m64) the overlook is the
  coalition camp (six tinted tents in a ring of radius 9 round (246, 82), a crate table, a hat rail, an unlit Bobble
  beacon, a flag, a campfire): scenes at the overlook from row 65 on must fit around it (the
  lead's W16 builder keeps the `dust-safehouse` marks clear) and should show it.

## Checks (all must pass before you report)

From `games/gnome-theft-auto` (use a scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e22-<your issue id>`, never the repo):

```
npx tsc --noEmit
npx vitest run src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts src/questSim/coverage.test.ts src/quests/comms.test.ts src/cutscene/castIntros.test.ts src/quests/quests.test.ts src/quests/unlocks.test.ts src/worldChanges src/quests/finaleSave.test.ts
npm run cutscene-report            # your scene ids: no fault, not in "=== Variety ===" or "=== Sound ===" lists
npm run quest-sim -- --quest <your ids comma-separated> --force --out <scratch>/sim
npm run quest-fuzz -- --quest <your ids> --per-quest 2 --out <scratch>/fuzz
```

`stages.test.ts` and `scenes.test.ts` run the camera line-of-sight and collision checks that `?cutscenecheck` runs in the
browser. Fix every failure in your files. If the sim fails for a reason in an engine or area file (not yours), set the
plan to the known failure (`expect: { status: 'fail', class: '<class>', reason: '<one line>' }`) and report it.

## Final report (at most 25 lines)

Files changed; quest ids and scene ids; intro cards placed (who, which scene); sim and fuzz result per quest; cutscene
report lines for your scenes (length, faults); map markers / journal items / grants for `storyMarks.ts` (label, `[x, z]`
/ title, text / kind, name); anything the lead must do (a CAST tweak, a prefab, a lore ruling, an area hook); what you
cut from the outline and why.
