Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
L73 + L46 audit: `npm run cutscene-report -w games/gnome-theft-auto` also prints, per scene, a tally of its shots (sizes,
heights, moves) and its sound cues, flags scenes whose shots are monotone (the same set-up three times running), and
ends with a list of the monotone scenes and the scenes with fewer than 2 sound cues. Report only: no new pacing fault,
no test fails because of it.

## Read first
- `games/gnome-theft-auto/src/cutscene/pacing.ts`: `checkPacing(script, env, opts)` returns `PacingResult`
  (`id, kind, duration, shots, lines, faults, waived`); how it walks `tl.steps` (`compile` from `./timeline`); exports.
- `games/gnome-theft-auto/src/cutscene/pacing.test.ts`: `report()` (prints per lane with `formatPacing(r)`), how `all`,
  `results`, `byId` are built, `wantReport`.
- `games/gnome-theft-auto/src/cutscene/script.ts`: `CamShot` kinds ('cut', 'dolly', 'orbit', 'follow', 'track',
  'frame' with `size`, `height`, `push?`), `Step` kinds 'sfx', 'stinger', 'ambience', 'music', and 'say' with `sfx` /
  `stinger` fields.

## Change
- `src/cutscene/pacing.ts` (append, pure):
  ```ts
  export interface ShotTally {
    id: string;
    /** Camera steps by kind ('frame' counted by size below). */
    moves: Record<'cut' | 'dolly' | 'orbit' | 'follow' | 'track' | 'frame' | 'push', number>;
    sizes: Record<ShotSize, number>;
    heights: Record<'eye' | 'low' | 'high', number>;
    /** Longest run of consecutive cam steps with the same set-up (frame: who + size + height + side sign; others: kind). */
    longestRun: number;
    /** longestRun >= 3. */
    monotone: boolean;
    /** Sound cues: 'sfx' steps + say.sfx, 'stinger' steps + say.stinger, 'ambience' steps (+1 if the script has ambience), 'music' steps (+1 if script.music). */
    sound: { sfx: number; stingers: number; beds: number; music: number };
  }
  export function tallyShots(script: SceneScript): ShotTally;   // walks script.steps, including 'parallel' tracks in order
  export function formatTally(t: ShotTally): string;           // one line: "  shots: frame 6 (cu 1 mcu 3 ms 2) dolly 1 | eye 5 low 1 | run 3 MONOTONE | sound: sfx 2 stingers 1 beds 1 music 1"
  ```
- `src/cutscene/pacing.test.ts`: in `report()`, after each scene's `formatPacing(r)` line print `formatTally(tallyShots(scene))`;
  at the end print `=== Variety ===` with the ids of monotone scenes and `=== Sound ===` with the ids of scenes whose
  `sfx + stingers < 2`. Add a unit test on a made-up scene: three identical `frame` cams in a row give `monotone: true`,
  `longestRun: 3`; alternating sizes give `monotone: false`; a 'say' with `sfx` counts as one sfx.

## Contract
`tallyShots`, `formatTally`, `ShotTally` as above. `checkPacing` and the fault codes unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/cutscene/pacing.test.ts` passes.
- `npm run cutscene-report -w games/gnome-theft-auto` (from the worktree root) prints the tallies and both lists.
- `npx tsc --noEmit -p .` passes.

## Out of scope
`direct.ts` (issue 12), the scenes, `pacing.baseline.ts`, `lanes.ts`.
