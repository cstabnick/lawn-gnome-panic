# Gnome Theft Auto: re-directing the Story A cutscenes (prologue, chapters 1-2)

Goal: every story scene of the prologue and chapters 1-2 re-directed against the direction bible
(`docs/design/gnome-theft-auto/direction/bible.md`), with director's notes per scene
(`direction/scenes/<id>.md`), zero pacing faults, the line-of-sight check passing, and out of
`src/cutscene/pacing.baseline.ts`. Plus a new scripted `first-contract-intro` (Don Compost's taps) replacing the old
wanted-poster card. Lane list and priorities: `docs/design/gnome-theft-auto/direction/lanes.md` (Story A).

Online and mobile: unchanged (cutscenes already play on phones; every scene is checked at 390x844 by the reviewer).

During the run the planner kept a local check, `src/cutscene/scenecheck.dev.test.ts` (not committed), that prints
`checkPacing` and `checkScript` for the scene ids in `SCENES=` with `TIMELINE=1` listing every shot and line. The
committed equivalents are `npm run cutscene-report -w games/gnome-theft-auto` and `npm test` (`scenes.test.ts`,
`pacing.test.ts`).

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0. Foundation and anchors (planner) | the story files are split so each worker owns one; new props `asphalt-cat`, `cigar-box`, `wrench-rack` in `@lawn/prefabs`; anchors `prologue-intro`, `prologue-outro`, `first-contract-intro` (new, wired in `chapter1.ts`), `first-contract-outro` re-directed with notes; ruling R-100 (the Don's tap code) | planner |
| 1. Re-direct the rest (parallel) | each worker's scenes pass the pacing and line-of-sight checks and have notes | 7 |
| 2. Review (planner) | every scene watched at 960x600 and 390x844 and fixed; baseline entries removed; build, tests, lore, smoke pass | planner |

File ownership in epic 1 (one file per issue, plus its notes files):

| Issue | Scene file | Scenes |
| --- | --- | --- |
| 1A | `scenes/story/ch1b.ts` | `two-coat-intro`, `two-coat-handover`, `two-coat-outro` |
| 1B | `scenes/story/ch1c.ts` | `mowers-keepers-outro`, `tax-break-in-intro`, `tax-break-in-outro` |
| 1C | `scenes/story/ch1d.ts` | `founders-boot-intro`, `founders-boot-outro` |
| 1D | `scenes/story/ch2.ts` | `dew-run-intro`, `dew-run-outro` |
| 1E | `scenes/story/ch2c.ts` | `sprinkler-intro`, `sprinkler-outro`, `compost-forge` |
| 1F | `scenes/story/ch2b.ts` | `vespers-offer-intro`, `vesper-diner` |
| 1G | `scenes/story/ch2d.ts` | `tablet-intro`, `tablet-outro` |

Nobody but the planner edits `pacing.baseline.ts`, `scenes/index.ts`, `quests/*`, `docs/lore/*` or another issue's file.

## The common part of every epic-1 issue

~~~~text
## Environment
Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a94c5091dd7fe8a84 (a git worktree).
In Git Bash, first: export PATH="/c/Program Files/nodejs:$PATH". Dependencies are installed; do not run npm install,
do not commit, do not start a dev server or a browser. Six other workers are editing the OTHER scene files in
games/gnome-theft-auto/src/cutscene/scenes/story/ at the same time: edit only the files your issue names.

## Read first (in this order; they are the standard you are held to)
- docs/design/gnome-theft-auto/direction/bible.md: the rules. Sections 1 (five laws), 2 (the characters' voices and the
  running-joke ladders), 4 (pacing numbers), 5 (camera), 6 (music).
- docs/design/gnome-theft-auto/direction/TEMPLATE.md: the notes template you fill per scene.
- docs/design/gnome-theft-auto/direction/scenes/mowers-keepers-intro.md and
  docs/design/gnome-theft-auto/direction/scenes/prologue-outro.md: two finished notes files (copy their depth).
- games/gnome-theft-auto/src/cutscene/scenes/story/ch1.ts: MOWERS_KEEPERS_INTRO, PROLOGUE_OUTRO, FIRST_CONTRACT_INTRO:
  finished re-directed scenes. Copy their technique: open on an action or a sound, then cover dialogue with `frame`
  shots from direct.ts; reactions; one coverage() per two-hander; `direction: { notes, kind? }` on the scene.
- games/gnome-theft-auto/src/cutscene/direct.ts: the helpers `beat`, `shot`, `cut`, `coverage`, `reaction`,
  `exchangeLooks` (all return plain Step / CamShot values).
- docs/design/gnome-theft-auto/cutscenes.md: the scene format (steps, shots, audio cue names, vehicles).

## What to do, per scene
1. Run the checker on your scenes to see the faults (command under "Done when").
2. Write docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md from TEMPLATE.md, every section filled.
3. Re-direct the scene in your file to match the notes:
   - Hook in the first 3 s: an action, a sound or a line by a character (never narration first; never a still wide
     with nothing happening). A turn at about 60%. A button in the last 3 s (a punchline, a threat or a look, never a
     walk-off and never a line that only gives directions).
   - Stage-spot cameras (`spot(stage, 'wide')` etc.) only to establish a place, never for dialogue. Every line is
     covered by a `frame` shot of the speaker (MCU for lines, CU for threats, MS for a gag with movement), using
     `coverage(a, b, side)` for any two people talking so the camera stays on one side of their line.
     Example: `const TALK = coverage('tansy', 'player', 1); cut(TALK.single('tansy', 'mcu')), {do:'say',...}`.
   - Never two `cam` steps in a row (the first is never seen). One shot per idea.
   - Big line -> a `...reaction(who, { toward, gesture, size: 'mcu', hold: 'pause' })` on the person it hits.
     (hold 'beat' is 0.7 s, which is a flash cut: use 'pause' unless a line follows in the same shot.)
   - Lines: aim 12 words, never more than 16. Nobody says what the picture shows. No coordinates or road names
     read out ("z = -300", "block (60, -60)"): one place name per briefing at most.
   - Narration: at most 1 narrator line in an intro/outro/arrival, 2 in a chapter opener or closer, and never the first
     line. Prefer zero.
   - Night or dusk scenes: add `sky: 'golden'` to the scene (or keep the scene by day).
   - Music: `music: null` (fade 0.4-0.8) before a reveal or a threat line; at most two `stinger`s per scene; `villain`
     only for Vesper; `comic` at most once and only on a physical gag.
   - Keep the scene's plot facts (who learns what, what vehicle/prop exists at the end, what `call` steps fire, where
     the player actor ends) unless the issue says to change them. Keep every `keep: true` vehicle.
   - Set `direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md' }` on the scene (add
     `kind` only if the issue says).
   - Check names and facts with `npm run lore -- find <word>` before writing new names.
4. Make it pass: zero pacing faults and "all shots pass". Fix LOS problems by moving the camera (a different `side`,
   a different coverage side 1/-1, `height`), or moving an actor's mark 0.5-1 m. A `crosses-line` fault means two
   consecutive lines of the same pair were shot from different sides: use one coverage() for that pair.
   A `shot-long` fault: cut to a reaction or a new angle. `dead-air`: something must happen every 3 s.
   `speaker-small`: the speaker's shot is too wide; `speaker-back`: the camera is behind them (turn them with a
   `face` step or move the camera); `speaker-unseen`: the speaker is out of the shot.

## Done when (all scenes of the issue)
- From games/gnome-theft-auto:
  SCENES=<your ids, comma separated> TIMELINE=1 npx vitest run src/cutscene/scenecheck.dev.test.ts --testTimeout=300000
  prints "<id> [...] OK" and "<id>: all shots pass" for each of your scenes. (TIMELINE=1 also prints every shot and
  line with its time: use it to check the scene reads the way the notes say.)
- npx tsc --noEmit -p games/gnome-theft-auto (from the worktree root) shows no error in your file.
- One notes file per scene exists and every section is filled; its beat sheet times match the TIMELINE output.

## Out of scope
src/cutscene/pacing.baseline.ts (the planner removes the ids), src/cutscene/scenes/index.ts, any other scene file,
src/quests/*, docs/lore/*, packages/*, engine files in src/cutscene/*.ts. If you believe one of them must change,
say so in your report instead.

## Report
For each scene: faults before -> after, one line on what changed and why, and anything you could not fix.
~~~~

## Issue texts (the scene-specific part)

Each worker got the common part above plus a block naming its file, its scenes, the stage data to read, and per scene
the bible's priorities: the faults to fix, the lines to keep word for word, the ladder rung it owns and the setups it
must plant. The rungs and plants assigned:

- 1A `two-coat-handover`: hat ladder rung 1, exactly "Nice hat."; the Mayor's coats rung 1 ("A second coat? Streaky.").
  `two-coat-intro`: Mabel's "Not on a job, dear." (R-071).
- 1B `tax-break-in-intro`: hat ladder rung 2, the only full "Nice hat. Shame if it cracked."; the golden kazoo plant.
  `mowers-keepers-outro`: pays off "Not my bay, not my problem"; Vesper's first drive-by.
- 1C `founders-boot-intro`: Pip's first "Okay, hear me out"; the Whirligig plant ("unauthorised verticality"); the
  Mayor's fresh coat. `founders-boot-outro`: Asphalt rung 1 ("she knew"); "Then we stop asking." as the last line.
- 1D `dew-run-intro`: chapter 2's question as a picture (the Dew convoy). `dew-run-outro`: the debt paid.
- 1E `sprinkler-outro`: Granny's pie rung 1 (not the words "I brought pie", saved for chapter 4).
- 1F `vesper-diner`: hat ladder rung 3: no hat line, he buys.
- 1G `tablet-intro`: the Stopping Stone's shape on the tablet. `tablet-outro`: the first sincere scene, one silence;
  Cam's envy at a racing Zero-Turn before the sale.

## Outcome

All 22 Story A scenes pass with zero unwaived faults (one waiver: Pip's lap of joy is a wide physical gag) and every
shot passes line of sight; the lane's block is gone from `pacing.baseline.ts`. Review fixes after the workers: the
chapter 1 closer now ends on Vesper (the empty Lowrider leaving was cut), the diner's Lowrider is parked from the start
and its button is the player's face, not a distant wide.
