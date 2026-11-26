# E21 quest issues: the common contract (read this first, all of it)

You are writing one or two main-story quests of Gnome Theft Auto (`games/gnome-theft-auto`) from the 70-row story
outline, act III ("Cold Clay, Far Edges", rows 36-53): the act that takes the story out to the new edges of the map.
Writing and directing quality decides this work: the scenes must be as good as the best existing ones (acts I and II,
built by E20 in the same layout). The user asked for a world that feels **polished and hand-crafted**: spend the time on
details.

## Environment

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adcca8ae7d2f22e45` (Git Bash; if `node` is
  missing: `export PATH="/c/Program Files/nodejs:$PATH"`). `npm install` is done. Do **not** commit, push, or run
  `git stash`/`git checkout`. Keep LF line endings.
- Up to seven other workers write other quests in the same game at the same time. Touch only the files your issue lists.
  `tsc` may briefly see another worker's half-written file: if an error is in a file you do not own, wait a minute and
  rerun; never edit it.
- Do not start a dev server (no ports). The headless checks below cover LOS, collisions and pacing.

## What is already in place (the lead's setup)

- Every quest id of rows 36-53 already exists as a **stub** (the whole act's prereq chain works): one visit objective at
  the Frozen Birdbath Basin, a stub briefing, `plans` `{ suite: 'story', expect: 'pass' }`, the stub stage file adds the
  ids to `birdbath-basin`'s usedBy. **Replace the whole stub** with the real quest; keep the ids, the prereqs shown in
  the stub (they follow the outline) and the exported names/types. Remove the `birdbath-basin` USES line once your own
  stages carry the ids.
- Side-quest unlocks and world changes for these rows are already moved onto the row ids (`unlocks.ts`,
  `worldChanges/defs.ts`): finishing your quest opens its side quests and fires its W-id. You do not touch them.
- CAST presets, intro cards, voices and caller names for every act III character exist under these keys (use them as
  `preset:` and comms `who:`): existing `pip`, `tansy`, `vesper`, `loam`, `bracken`, `shelldon`, `wally`, `driftwood`,
  `juniper`, `chicory`, `wisteria`, `peony`, `basil`, `thrift`, `nubbin`, `tumblesoil`, `saxifrage`, `hyssop`,
  `'lugnut lulu'`; new (E21) `gentian`, `'thermos theo'`, `chanterelle`, `ragwort`, `clary`, `betony`, `lovage`,
  `samphire`, `marram`, `'silt-diver sal'`, `'dj moleman'`. A cast member's home and workplace: `homeDoor(id)`,
  `workOf(id)` in `src/homes/data.ts`.
- Story props (`@lawn/prefabs` ids, E21): `hoa-radio`, `hoa-cable-reel`, `blade-crate`, `registrar-desk`,
  `guidance-lens`, `mole-trap`, `ledger-book`, `tasting-tray`, `flatbed-trailer`, `combine-test-deck`, `caddy-bib`,
  `toy-cutlass`, `sock-map`. Existing ones that fit act III: `tea-tray-sled`, `woolly-sock-lodge`, `spokewheel-gondola`,
  `capwood-toadstool-tall`, `capwood-toadstool-squat`, `giant-spotted-toadstool`, `capwood-rally-pennant`,
  `sugar-cube-crate`, `sugar-sack`, `ant-door`, `anthill-telescope`, `golf-flagstick`, `golf-ball`, `mole-lamp`,
  `mole-lamp-lit`, `post-sack`, `standing-lady`, `stopping-stone`, `rolled-scroll`, `ledger`, `serving-tray`,
  `grand-combine-boss`, `combine-harvester`, `dispatch-radio`, `radio-jammer`, `beach-umbrella`, `pirate-bandana`,
  `rootwell-college-scarf`, `reception-desk`, `office-desk`. Grep `packages/prefabs/src/catalog/` for more (the area
  epics added hundreds: `gta-coast*.ts`, `gta-winter*.ts`, `gta-campus*.ts`, `gta-dirt-rally*.ts`, `gta-golf*.ts`,
  `gta-loamdeep*.ts`, `gta-moles.ts`, `gta-flock.ts`, `gta-country-*.ts`, `gta-pinwheel-campus-props.ts`).
  If the E21 props are not in the catalog yet when you start, another worker is adding them: use the ids anyway.
- Achievements (E21, already defined in `packages/achievements/src/catalog.ts`): `gta-woolly-sock-regular` (m37),
  `gta-cap-bruiser` (m40), `gta-pirate-for-a-night` (m44), `gta-sugar-landlord` (m46 final), `gta-everyone-digs`
  (m49), `gta-nothing-works` (m52 final). Set `achievement: '<id>'` on that quest def (unlocks when it is finished).
- Map markers and journal items (E21): a quest that "marks X on the map" or "puts Y in the journal" lists them in
  `src/quests/storyMarks.ts` (another worker builds it; **you do not edit it**): report the marker label + `[x, z]` and
  the item title + one-line text in your final report, and the lead adds them.

## Files you own (and nothing else)

For each row `NN-slug` in your issue (they exist as stubs):

1. `games/gnome-theft-auto/src/quests/story/NN-slug.ts`: `export const STORY: StoryFile` (quest defs, comms, sim plans,
   new givers, bulletins). Contract in `src/quests/story/kit.ts`:
   ```ts
   export interface StoryFile {
     quests: readonly QuestDef[];                 // p1, p2, ... then the row id
     comms: Record<questId, Record<step, CommsCall>>;   // build with brief(...) / call(...) from './kit'
     plans?: Record<questId, QuestPlan>;          // { suite: 'story', expect: 'pass' }
     givers?: Record<giverId, GiverDef>;          // only for a giver that does not exist yet
     bulletins?: Record<questId, string[]>;       // Turfton FM bulletin per quest (radioBulletin = the quest id): >= 2 lines, no wet/no gore (R-021)
   }
   ```
   Import `brief`, `call`, `StoryFile` from `./kit`; never import `../comms`, `../defs` or `./index` (import cycles).
   Good examples: `src/quests/story/32-driftwoods-chart.ts`, `34-forty-seven-wrenches.ts`, `35-salvage-raid.ts` (extended).
2. `games/gnome-theft-auto/src/cutscene/scenes/story/mNN-slug.ts`: `export const SCENES: Record<string, SceneScript>` keyed
   by scene id (use the outline's scene ids). Examples: `m32-driftwoods-chart.ts`, `m34-forty-seven-wrenches.ts`, `m35-salvage-raid.ts`.
3. `games/gnome-theft-auto/src/quests/stages/story/sNN-slug.ts`: `export const STAGES: readonly Stage[]` (new stages your
   scenes stand on; each with `usedBy: ['<your quest ids>']`, and `givers: [...]` for any new giver) and
   `export const USES: Record<existingStageId, questId[]>` to add your quest ids to an existing stage's `usedBy` (the
   area epics already made stages for most act III places: grep `id: '` in `src/quests/stages/*.ts`, e.g. `winter.ts`,
   `coast.ts`, `rootwell.ts`, `dirt.ts`, `golf*.ts`, `societies*.ts`, `country*.ts`).
   **Every quest id (each part too) must appear in some stage's usedBy** (`stages.test.ts`).
4. One direction note per scene: `docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md` (copy the shape of
   `direction/TEMPLATE.md`; `two-coat-intro.md` is a good one), and the scene's `direction: { notes: '<that path>', kind: ... }`.
5. Only if your issue says so: an existing scene file it names (rewritten rows), or a new file it names.

You never edit: `quests/defs.ts`, `quests/comms.ts`, `quests/unlocks.ts`, `quests/storyRows.ts`, `quests/storyMarks.ts`,
`questSim/plans.ts`, `cutscene/scenes/index.ts`, any `act*.ts` / `index.ts` aggregator, `quests/stages.ts`,
`cutscene/cast.ts`, `castIntros.ts`, `voice/voices.ts`, `packages/**`, `worldChanges/**` (unless your issue names a
file there), any area module (`src/coast/`, `src/winter/`, `src/campus/`, `src/capwood/`, `src/rutbottom/`, `src/golf/`,
`src/country/`, `src/societies/`, ...: areas belong to their epics), `docs/lore/**`. If you need a change there (a CAST
tweak, a prefab, a lore ruling, an area hook), say so in your final report: the lead does it.

## Read first (in this order, skim what you already know)

- Your rows in the issue (pasted). The full outline is `docs/design/gnome-theft-auto/story-outline.md` ("## Act 3"
  section: premise, tension curve, who changes). The E04 spine `docs/roadmaps/gta-batch-3/E04/spine.md` for names.
- `docs/design/gnome-theft-auto/direction/batch-3-notes.md` sections 4 (context rule), 5 (world use), 6 (shot variety),
  7 (time of day per scene: find your scenes), 3 (running jokes).
- `docs/design/gnome-theft-auto/direction/bible.md` sections 4 (pacing numbers, scene length targets), 5 (camera), 6
  (sound), 6a (intro cards), 8 (common faults), 9 (engine vocabulary). And section 2 for your characters' voices.
- `docs/design/gnome-theft-auto/characters.md` for each character in your rows (look, voice, home, workplace).
- `docs/design/gnome-theft-auto/world-changes.md` if your row fires a W-id (what the world shows after).
- Reference code: an E20 story row (above), `src/cutscene/scenes/story/kit.ts` (`up`, `spot`, `markOf`, `carMark`,
  `pathOf`, `rideOf`), `src/cutscene/direct.ts` (`shot`, `cut`, `beat`, `reaction`, `coverage`, `pushIn`, `pullOut`,
  `insert`, `cutaway`, `varied`, `vary`), `src/cutscene/script.ts` (every step kind), `src/quests/stages/kit.ts` (Stage).
- Contracts: `docs/roadmaps/gta-batch-3/E09/contracts.md` (intro cards, foley, beds, shot variety), and the area epic
  contracts your issue names (each tells you the place's coordinates, its activities and their quest hooks).

## Rules for the quest defs

- Ids, titles, givers, prereqs, rewards come from the outline row. Every main quest has `chapter: 3`, `radioBulletin`
  (the quest id), `doneText`, `rewardAcorns`. An extended row's parts each have their own reward as the parts table says.
- Objective kinds (`src/quests/types.ts`): crack, visit (with `scene:` to play a scene on arrival, `interior:` to need
  the player inside an interior), steal-deliver (`maxDamage`, `banter`), chase-follow, checkpoints (`maxDamage`,
  `vehicle`, `requireVehicle`), probe, choice, survive-derby, convoy-ambush, race (`trackId` for the E14/E26 tracks),
  air-drop, `passenger` and `inspect` (E20):
  - `passenger`: `{ kind: 'passenger', text, who: <CAST key>, name, pickup: [x, z], dropAt: [x, z], radius, hint,
    vehicle?, maxDamage?, banter?: string[], onBoard?, onDrop? }`. The character waits at the pickup, gets in when the
    player stops beside them in a ground vehicle, gets out at `dropAt`. Use it wherever the outline says "pick up X".
  - `inspect` (photograph, read, look through, hold, test): `{ kind: 'inspect', text, verb: 'Photograph', points: [{ at,
    label, note?, prop? }], holdSeconds?, ordered?, hint, scene? }`. `note` is the toast that tells the player what
    they just learned: write it as story.
- **The outline's "needs new kind" items map onto the area activities' probes** (no new objective kind, no engine
  change): `{ kind: 'probe', text, probe: '<id>', count: 1, at?: [x, z], hint }` counts the activity once more after
  the step starts, and the quest sim already solves each of these ids:
  - ski-run (E12): `WINTER_PROBES` in `src/winter/types.ts`: `'winter-ski-runs'`, `'winter-sled-runs'`, `'ice-holes'`, `'ice-catches'`.
  - ride-passenger / tow-ski (E11): `COAST_PROBES` in `src/coast/probes.ts`: `'coast-spokewheel-rides'`,
    `'coast-tow-gates'`, `'coast-tow-finish'`, `'coast-queen-chest'`.
  - golf-hole (E15/E32): `GOLF_PROBES` in `src/golf/types.ts`: `'golf-holes-played'`, `'golf-par-holes'`, `'golf-rounds'`, ...
  - dig / mole jobs (E17): `SOCIETY_PROBES` in `src/societies/config.ts`: `'mole-job-roots'`, `'mole-job-lamps'`,
    `'mole-job-post'`, `'mole-job-dig'`, `'moleman-met'`, `'flock-sermon-stood'`, `'underspan-updraft'`.
  - interior-visit (E05): a `visit` with `interior: '<interior id>'` (ids: `src/campus/types.ts` `ROOTWELL_INTERIORS`,
    `src/country/manorInterior.ts`, `src/golf/clubhouse.ts`, `src/societies/loamdeep/interior.ts`, `src/coast/pirateShip.ts`).
  Where a probe would be unclear to the player, put the activity in the objective `text` and `hint` ("Ski the Wool Run
  through the gates", hint "Snowdrop Slope, the rope tow by the lodge").
- Mid-quest scenes: `beats: { <objectiveIndex>: '<scene id>' }` plays a scene as that objective starts; or a visit's
  `scene:`. Intro `cutscene: { kind: 'script', script: '<id>' }`, `outro` likewise.
- `hoa`: story steps default to the E23 policy; set `hoa: 'off'` for gentle quests (passenger rides, errands, the Flock).
- No new objective kind, no engine change. If something is impossible with the kinds above, use the outline's fallback
  and say so.
- **Act III additions (L83 and the brief):**
  - The quest visits its area for a reason the player can state, and its briefing (step 0) tells the player **where it
    is and how to get there** (road, ramp, ferry, "north past the Fells"), since the new areas sit far from Turfton.
  - The quest can be reached and started with the player's current vehicles; if a step needs a type (boat, plane, dirt
    bike, skis), the objective spawns one nearby (`vehicle` on checkpoints, `vehicleKind`/`spawnAt` on steal-deliver,
    the race's `vehicle`), or the area's rental is right there and the text says so.
  - A follow or escort objective must be finishable if the player stops or goes off-route (L03): use the existing
    kinds' behaviour (chase-follow waits; passenger re-boards) and say in your report how you checked it.
  - Previously-line: the first briefing line, or the intro's first beat, says in one breath what happened before (the
    outline's "Previously:" note), so a player returning after a week knows where the story is.

## Rules for the writing (L04, L105, keep the charm)

- Comms (`brief`/`call`): step 0 is the briefing: who, what, where, why now, and the reward, in the speaker's voice.
  At most 16 words a line, one place name per call. A player who skipped every scene must still know what to do and why.
- Dialogue in scenes: short lines, the character's own voice (bible section 2, characters.md), jokes that come from
  character, one sincere beat where the outline says so with **no gag on top**. Keep the satire and the warmth: this
  game is already fun, do not flatten it.
- Character development: every quest moves somebody (the outline's "who changes" for act III: Pip thaws toward the
  crew, Lulu and the Carburettors get their own scenes, Peony and Basil go from Vesper's tenants to allies, Vesper and
  the player share one frame for the first time at #50). Show it in a gesture or a line, not a speech.
- Intro cards (L105): at a character's **first story appearance** (your issue lists who), after their first line or
  action, on an mcu/ms of them: `{ do: 'intro', who: '<actor id>' }`. The actor needs `preset: '<CAST key>'` (the card
  text comes from `CAST_INTROS`). One card per character, ever (grep `do: 'intro'` in `src/cutscene/scenes/` first).
- Lore: before naming anything new (a shop, a sign, a dish), `npm run lore -- find <word>` from the repo root and follow
  `docs/lore/canon.md`. Report any new fact that needs a ruling; do not edit `docs/lore/`.
- L95 environmental storytelling: give each quest at least one thing seen only in its scenes: a cutscene-only vehicle,
  a set prop arrangement that tells a small story without text, a scripted moment in the world (a plow that crests the
  ridge, a sign being taped up, a barge that turns away). Props are `@lawn/prefabs` ids only.

## Rules for the scenes

- `stage: { kind: 'world' }` scenes at the real place (coordinates from your stage file, `homeDoor`, the area configs),
  `sky: 'noon' | 'golden' | 'night'` for the time of day in the outline (dawn and dusk are 'golden'), `ambience`, a music
  or stinger cue, at least 2 sfx/foley cues, and `direction: { notes, kind }`. Interiors: the interior's own room/stage if
  the area epic made one (grep `room:` in the area's stage file).
- Follow bible section 4 shot lengths and the scene length target for the kind (intro / mid / outro); connective
  quests get a short intro and a short outro, setpieces more. Vary shot sizes and heights (section 6 of the batch-3
  notes; `npm run cutscene-report` flags MONOTONE and thin sound).
- Use the stage helpers so marks and cameras are checked: put marks/cameras/paths in your stage file and read them with
  `markOf`/`spot`/`pathOf`, or use `up(x, z, h)` and `shot(...)` for world points (check them with the LOS test).
  New terrain (slopes, dunes, the Anthill, the ridge) often fails LOS: raise or move the camera, never delete the shot.
- Vehicles in scenes: `vehicles: [{ id, kind, at, yaw, keep? }]`; a cast member's own ride via `rideOf('<cast id>')`.

## Checks (all must pass before you report)

From `games/gnome-theft-auto` (use a scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e21-<your issue id>`, never the repo):

```
npx tsc --noEmit
npx vitest run src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts src/questSim/coverage.test.ts src/quests/comms.test.ts src/cutscene/castIntros.test.ts src/quests/quests.test.ts src/quests/unlocks.test.ts src/worldChanges
npm run cutscene-report            # your scene ids: no fault, not in "=== Variety ===" or "=== Sound ===" lists
npm run quest-sim -- --quest <your ids comma-separated> --force --out <scratch>/sim
npm run quest-fuzz -- --quest <your ids> --per-quest 2 --out <scratch>/fuzz
```

`stages.test.ts` and `scenes.test.ts` run the camera line-of-sight and collision checks that `?cutscenecheck` runs in the
browser. Fix every failure in your files. If the sim fails for a reason in an engine or area file (not yours), set the
plan to the known failure (`expect: { status: 'fail', class: '<class>', reason: '<one line>' }`) and report it.

## Final report (at most 25 lines)

Files changed; quest ids and scene ids; intro cards placed (who, which scene); sim and fuzz result per quest; cutscene
report lines for your scenes (length, faults); map markers / journal items for `storyMarks.ts` (label, `[x, z]` / title,
text); anything the lead must do (a CAST tweak, a prefab, a lore ruling, an area hook); what you cut from the outline and why.
