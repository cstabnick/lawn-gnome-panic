Epic: E09 step 2 (apply the sound and variety toolkit to the existing scenes)
Depends on: step 1 (landed)
Worker: Sonnet, four in parallel, one per file group (A, B, C, D below). This file is the shared issue text; the
prompt names your group.

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. Change only your group's files. Other scene workers edit the other
groups at the same time.

## Goal
L46 "more sound in cutscenes" and L73 "add a bit more variety to the directed shots, keep the intent": every scene in
your files gets a sound pass, and the scenes the audit flagged as monotone get varied set-ups, without changing what
any scene says or shows.

## Read first
- `docs/design/gnome-theft-auto/sound-design.md` section "Cutscene cue grammar" and the region palette (which bed where).
- `docs/design/gnome-theft-auto/direction/bible.md` sections 5 (Camera language, incl. "Variety without changing
  intent"), 6 (Sound and music).
- `games/gnome-theft-auto/src/cutscene/script.ts`: `CueSfx` (incl. `FoleySfx`: cloth, paper, pour, clink, chair, keys,
  zip, bell, crunch, creak, thunder, gulp, tap, pop, clatter, latch, squeak, shovel, flutter, static, snap, rustle),
  `AmbienceBed` (incl. snow, shore, cave, market, meadow, storm, office, garden), `Stinger`, the `sfx` step
  (`{ do: 'sfx', id, at?: actorId, gain? }`, add `async: true` so it does not wait) and `say.sfx`.
- `games/gnome-theft-auto/src/cutscene/direct.ts`: `varied`, `pushIn`, `pullOut`, `insert`, `cutaway`,
  `coverage(...).two`, `vary`, `pickAngle`.
- Run `npm run cutscene-report -w games/gnome-theft-auto` (from the worktree root) once first: each scene prints a
  `shots:` tally line (sizes, heights, moves, longest identical run, `MONOTONE`, sound cue counts).

## Change (your group's files only)
1. Sound pass, every scene in your files:
   - It has an ambience bed fitting the place (`ambience:` on the script or an `ambience` step), or a deliberate
     silence with a code comment saying why.
   - At least two foley / sfx cues tied to on-screen action (a give gets `paper` or `keys`, a sit gets `chair`, a drink
     `pour` + `clink`, a door `latch` / `door-creak`, a gesture of shock `gulp`, rummaging `clatter`, outdoors `rustle`,
     a radio or phone `static`), placed a beat before the reaction, `async: true`, `at:` the actor when it is on stage.
   - At most two stingers per scene (count the existing ones). Ambience changes on a cut, never mid-shot.
   - Never put an sfx over a line's first words if it would mask them: prefer the pause before or after.
2. Variety, only where it helps and the intent stays: in scenes marked `MONOTONE` (in your files) break every run of
   three identical set-ups with `varied(...)`, an `insert(...)`, a `cutaway(...)` or a `pushIn(...)` on the line that
   lands; in other scenes add at most one or two such touches where a scene repeats itself. Never flip the side of the
   line (keep the sign of `side`), never change who is framed when they speak, never change dialogue text, actor
   placement, paths or `call` steps.
3. Notes: for each scene whose shots changed, add a short "E09 variety" bullet to its notes file in
   `docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md` if one exists (what changed, one line). Sound-only
   changes need no note.
4. Do not add `intro` steps to story scenes (E20 places character intros).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/cutscene` passes (pacing, cutscenes, side, scenes, los tests). A scene that is not in
  `pacing.baseline.ts` must stay fault-free; do not add waivers to hide new faults (fix the cause).
- `npm run cutscene-report -w games/gnome-theft-auto`: none of your scenes in the `=== Variety ===` list and none in the
  `=== Sound ===` list (dev labs `seat-lab`, `exit-lab`, `gun-lab` excepted). Paste your scenes' tally lines in the
  report.

## Groups
- A: `src/cutscene/scenes/story/ch1.ts`, `ch1b.ts`, `ch1c.ts`, `ch1d.ts`, `ch2.ts`, `ch2b.ts`, `ch2c.ts`, `ch2d.ts`, and
  their scene notes.
- B: `src/cutscene/scenes/story/ch3.ts`, `ch3b.ts`, `ch3c.ts`, `ch4.ts`, `ch4b.ts`, `ch4c.ts`, `ch5.ts`, `story/kit.ts`
  (only if you need a shared helper there), and their scene notes.
- C: every file in `src/cutscene/scenes/side/` (not `side.test.ts` unless a count it asserts must change), and their
  scene notes.
- D: every file in `src/cutscene/scenes/city/`, plus `src/cutscene/scenes/backRoom.ts`, `pullUp.ts`, `streetPickup.ts`,
  `speedway.ts` (race intros and podiums), and their scene notes. Also add one example scene `intro-demo` in
  `src/cutscene/scenes/lab.ts` (registered the way the other lab scenes are, lane 'Examples'): a short room or world
  scene where Pip says one line, then `{ do: 'intro', who: 'pip' }`, Tansy answers, `{ do: 'intro', who: 'tansy' }`,
  with a bed and two foley cues; it must pass the pacing checker. It exists to smoke-test the intro card with
  `?cutscene=intro-demo`.

## Out of scope
`script.ts`, `timeline.ts`, `director.ts`, `direct.ts`, `pacing.ts`, `cueAudio.ts`, `cueFoley.ts`, `cueBeds.ts`, the
bible docs, other groups' files.
