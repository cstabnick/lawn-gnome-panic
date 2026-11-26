# E20 quest issues: the common contract (read this first, all of it)

You are writing one or two main-story quests of Gnome Theft Auto (`games/gnome-theft-auto`) from the 70-row story
outline. Writing and directing quality decides this work: the scenes must be as good as the best existing ones.

## Environment

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da` (Git Bash; if `node` is
  missing: `export PATH="/c/Program Files/nodejs:$PATH"`). `npm install` is done. Do **not** commit, push, or run
  `git stash`/`git checkout`. Keep LF line endings.
- Up to seven other workers write other quests in the same game at the same time. Touch only the files your issue lists.
  `tsc` may briefly see another worker's half-written file: if an error is in a file you do not own, wait a minute and
  rerun; never edit it.
- Do not start a dev server (no ports). The headless checks below cover LOS, collisions and pacing.

## Files you own (and nothing else)

For each row `NN-slug` in your issue (they already exist as stubs; keep the exported names and types):

1. `games/gnome-theft-auto/src/quests/story/NN-slug.ts`: `export const STORY: StoryFile` (quest defs, comms, sim plans,
   new givers). Contract in `src/quests/story/kit.ts`:
   ```ts
   export interface StoryFile {
     quests: readonly QuestDef[];                 // p1, p2, ... then the row id
     comms: Record<questId, Record<step, CommsCall>>;   // build with brief(...) / call(...) from './kit'
     plans?: Record<questId, QuestPlan>;          // { suite: 'story', expect: 'pass' }; a 'choice' quest adds variants: ['A', 'B']
     givers?: Record<giverId, GiverDef>;          // only for a giver that does not exist yet
     bulletins?: Record<questId, string[]>;       // Turfton FM bulletin per quest (radioBulletin = the quest id): >= 2 lines, no wet/no gore (R-021)
   }
   ```
   Import `brief`, `call`, `StoryFile` from `./kit`; never import `../comms`, `../defs` or `./index` (import cycles).
2. `games/gnome-theft-auto/src/cutscene/scenes/story/mNN-slug.ts`: `export const SCENES: Record<string, SceneScript>` keyed
   by scene id (use the outline's scene ids).
3. `games/gnome-theft-auto/src/quests/stages/story/sNN-slug.ts`: `export const STAGES: readonly Stage[]` (new stages your
   scenes stand on; each with `usedBy: ['<your quest ids>']`, and `givers: [...]` for any new giver) and
   `export const USES: Record<existingStageId, questId[]>` to add your quest ids to an existing stage's `usedBy`.
   **Every quest id (each part too) must appear in some stage's usedBy** (`stages.test.ts`).
4. One direction note per scene: `docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md` (copy the shape of
   `direction/TEMPLATE.md`; see `two-coat-intro.md` for a good one), and the scene's `direction: { notes: '<that path>',
   kind: ... }`.
5. Only if your issue says so: an existing chapter/scene file it names (rewritten rows).

You never edit: `quests/defs.ts`, `quests/comms.ts`, `quests/unlocks.ts`, `quests/storyRows.ts`, `questSim/plans.ts`,
`cutscene/scenes/index.ts`, any `act*.ts` / `index.ts` aggregator, `quests/stages.ts`, `cutscene/cast.ts`,
`castIntros.ts`, `voice/voices.ts`, `packages/**`, `worldChanges/**`, `docs/lore/**`. If you need a change there (a new
CAST preset, a prefab, an unlock move, a lore ruling), say so in your final report: the lead does it.

## Read first (in this order, skim what you already know)

- Your rows in the issue (pasted). The full outline is `docs/design/gnome-theft-auto/story-outline.md` (act intros at
  "## Act 1" and "## Act 2" give the tone ladder and tension curve).
- `docs/design/gnome-theft-auto/direction/batch-3-notes.md` sections 4 (context rule), 5 (world use), 6 (shot variety),
  7 (time of day per scene: find your scenes), 3 (running jokes).
- `docs/design/gnome-theft-auto/direction/bible.md` sections 4 (pacing numbers, scene length targets), 5 (camera), 6
  (sound), 6a (intro cards), 8 (common faults), 9 (engine vocabulary). And section 2 for your characters' voices.
- `docs/design/gnome-theft-auto/characters.md` for each character in your rows (look, voice, home, workplace).
- Reference code: `src/cutscene/scenes/story/ch1b.ts` (two-coat: a well-directed intro and a world scene),
  `src/cutscene/scenes/story/ch1.ts` (prologue), `src/cutscene/scenes/story/kit.ts` (`up`, `spot`, `markOf`, `carMark`,
  `pathOf`, `rideOf`), `src/cutscene/direct.ts` (`shot`, `cut`, `beat`, `reaction`, `coverage`, `pushIn`, `pullOut`,
  `insert`, `cutaway`, `varied`, `vary`), `src/cutscene/script.ts` (every step kind), `src/quests/stages/kit.ts` (Stage).
- Contracts: `docs/roadmaps/gta-batch-3/E09/contracts.md` (intro cards, foley, beds, shot variety),
  `src/homes/data.ts` (`homeDoor(characterId)`, `workOf(characterId)`), and for places outside downtown the area epic
  contracts under `docs/roadmaps/gta-batch-3/E1x/` named in your issue.

## Rules for the quest defs

- Ids, titles, givers, prereqs, rewards come from the outline row. A row marked keep/rewrite keeps its id. Every main
  quest has `chapter` (1 for rows 1-15, 2 for rows 16-35), `radioBulletin` (use the quest id), `doneText`, `rewardAcorns`.
- Objective kinds (`src/quests/types.ts`): crack, visit (with `scene:` to play a scene on arrival, `interior:`),
  steal-deliver (`maxDamage`, `banter`), chase-follow, checkpoints (`maxDamage`, `vehicle`, `requireVehicle`), probe
  (activity counters: `COURT_PROBES` in `court/types.ts`, skate lines `'skate-line-<id>'`, `SOCIETY_PROBES` in
  `societies/config.ts`), choice, survive-derby, convoy-ambush, race, and the two new E20 kinds:
  - `passenger` (L58 pick-up and drop-off at homes and workplaces): `{ kind: 'passenger', text, who: <CAST key>, name,
    pickup: [x, z], dropAt: [x, z], radius, hint, vehicle?, maxDamage?, banter?: string[], onBoard?, onDrop? }`. Use
    `homeDoor('juniper')` / `workOf('reginald')!.at` for the spots. The character waits at the pickup, gets in when the
    player stops beside them in a ground vehicle, and gets out and walks to the door at `dropAt`. Use it wherever the
    outline says "pick up X at ... drop at ...".
  - `inspect` (photograph, read, look through, hold, test): `{ kind: 'inspect', text, verb: 'Photograph', points: [{ at,
    label, note?, prop? }], holdSeconds?, ordered?, hint, scene? }`. The player walks up and taps (or holds) the 44 px
    action button. `note` is the toast that tells the player what they just learned: write it as story.
- Mid-quest scenes: `beats: { <objectiveIndex>: '<scene id>' }` plays a scene as that objective starts; or a visit's
  `scene:`. Intro `cutscene: { kind: 'script', script: '<id>' }`, `outro` likewise.
- Achievements are already defined (`packages/achievements/src/catalog.ts`); set `achievement: '<id>'` where your issue
  names one (a 'choice' option takes `achievement` on the option).
- `hoa`: story steps default to the E23 policy; set `hoa: 'off'` for gentle quests (passenger rides, farm errands).
- No new objective kind, no engine change. If something is impossible with the kinds above, use the outline's fallback
  and say so.

## Rules for the writing (L04, L105, keep the charm)

- Comms (`brief`/`call`): step 0 is the briefing: who, what, where, why now, and the reward, in the speaker's voice.
  At most 16 words a line, one place name per call. A player who skipped every scene must still know what to do and why.
- Dialogue in scenes: short lines, the character's own voice (bible section 2), jokes that come from character, one
  sincere beat where the outline says so with **no gag on top**. Keep the satire and the warmth: this game is already
  fun, do not flatten it.
- Intro cards (L105): at a character's **first story appearance** (your issue lists who), after their first line or
  action, on an mcu/ms of them: `{ do: 'intro', who: '<actor id>' }`. The actor needs `preset: '<CAST key>'` (the card
  text comes from `CAST_INTROS`). One card per character, ever.
- Lore: before naming anything new (a shop, a sign, a dish), `npm run lore -- find <word>` from the repo root and follow
  `docs/lore/canon.md`. Report any new fact that needs a ruling; do not edit `docs/lore/`.
- L95 environmental storytelling: give each quest at least one thing seen only in its scenes: a cutscene-only vehicle,
  a set prop arrangement that tells a small story, a scripted moment in the world (a van that pulls away as you arrive,
  a sign being taped up). Props are `@lawn/prefabs` ids only (`npx tsx` not needed: grep
  `packages/prefabs/src/catalog/` for an id). New E20 props: `radio-jammer`, `citation-slip`, `framed-photograph`,
  `squall-box-barometer`, `penthouse-key`, `bench-lock`, `fescue-vial`, `rolled-chart`, `carburettor`, `hoa-clipboard`,
  `cigar-crate`, `mole-lantern`; existing ones include `cigar-box`, `wrench-rack`, `asphalt-cat`, `brass-calipers`,
  `serving-tray`, `drainpipe-hoop`, `golf-ball`, `frost-pot`, `even-show-home`, `site-hoarding`, `buzzer-panel`,
  `tin-can-phone`, `bunting-span`, `broom`, `gta-skateboard`, `lawn-flamingo`.

## Rules for the scenes

- `stage: { kind: 'world' }` scenes at the real place (coordinates from your stage file, `homeDoor`, the area configs),
  `sky: 'noon' | 'golden' | 'night'` for the time of day in the outline (dawn and dusk are 'golden'), `ambience`, a music
  or stinger cue, at least 2 sfx/foley cues, and `direction: { notes, kind }`.
- Follow bible section 4 shot lengths and the scene length target for the kind (intro / mid / outro); connective
  quests get a short intro and a short outro, setpieces more. Vary shot sizes and heights (section 6 of the batch-3
  notes; `npm run cutscene-report` flags MONOTONE and thin sound).
- Use the stage helpers so marks and cameras are checked: put marks/cameras/paths in your stage file and read them with
  `markOf`/`spot`/`pathOf`, or use `up(x, z, h)` and `shot(...)` for world points (check them with the LOS test).
- Vehicles in scenes: `vehicles: [{ id, kind, at, yaw, keep? }]`; a cast member's own ride via `rideOf('<cast id>')`.

## Checks (all must pass before you report)

From `games/gnome-theft-auto`:

```
npx tsc --noEmit
npx vitest run src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts src/questSim/coverage.test.ts src/quests/comms.test.ts src/cutscene/castIntros.test.ts src/quests/quests.test.ts
npm run cutscene-report            # your scene ids: no fault, not in "=== Variety ===" or "=== Sound ===" lists
npm run quest-sim -- --quest <your ids comma-separated> --force --out <your scratch dir>/sim
npm run quest-fuzz -- --quest <your ids> --per-quest 2 --out <your scratch dir>/fuzz
```

`stages.test.ts` and `scenes.test.ts` run the camera line-of-sight and collision checks that `?cutscenecheck` runs in the
browser. Fix every failure in your files. If the sim fails for a reason in an engine file (not yours), set the plan to
the known failure (`expect: { status: 'fail', class: '<class>', reason: '<one line>' }`) and report it. Use a scratch dir
under `C:\Users\cpsai\AppData\Local\Temp\claude\` named after your issue, never the repo.

## Final report (at most 25 lines)

Files changed; quest ids and scene ids; intro cards placed (who, which scene); sim and fuzz result per quest; cutscene
report lines for your scenes (length, faults); anything the lead must do (unlock moves, a CAST preset, a prefab, a lore
ruling, a hot-file line); what you cut from the outline and why.
