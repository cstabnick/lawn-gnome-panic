Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
L73 ("I like the intent and angles of the directed shots, but add a bit more variety"): `src/cutscene/direct.ts` gains a
small variation toolkit, so a scene keeps its intent (who is in shot, how big, on which side of the line) while
repeated set-ups vary their angle, height and movement.

## Read first
- `games/gnome-theft-auto/src/cutscene/direct.ts` (71 lines): `BEATS`, `beat`, `shot(who, size, opts)`, `cut(shot)`,
  `coverage(a, b, side, angle)` with `.single` / `.ots`, `reaction`, `exchangeLooks`.
- `games/gnome-theft-auto/src/cutscene/script.ts` lines ~165-205: `CamShot` kind 'frame' (`who`, `size`, `toward`,
  `over`, `side` degrees (positive swings to `who`'s left as it faces `toward`; the sign is the side of the 180-degree
  line, so never flip it), `height` 'eye' | 'low' | 'high', `fov`, and the new `push?: { to: ShotSize; s: number }` (a
  push-in / pull-out over `s` seconds). `Step` kind 'cam' is `{ do: 'cam', shot }`.
- `games/gnome-theft-auto/src/cutscene/pacing.test.ts` bottom half: how small made-up scenes are checked (to copy the
  pattern for a test that `vary` does not cross the line).

## Change
- `src/cutscene/direct.ts` (append; keep every existing export unchanged):
  ```ts
  export type ShotHeight = 'eye' | 'low' | 'high';
  /** A stable hash of a seed string (FNV-1a), for picking variants deterministically. */
  export function seedOf(seed: string): number;
  /**
   * An angle variant for a single: same side of the line (the sign of `side` kept), a different swing and sometimes a
   * different height. cu/mcu: swing 15..40 degrees, height eye (70 %) / low (15 %) / high (15 %); ms/fs: swing 20..55,
   * eye (60 %) / high (25 %) / low (15 %); ws: swing 10..70, eye (50 %) / high (50 %). Deterministic for a seed.
   */
  export function pickAngle(seed: string, size: ShotSize, side: 1 | -1 = 1): { side: number; height: ShotHeight };
  /** shot() with pickAngle applied: an eyeline single that differs per seed but keeps the line. */
  export function varied(who: string, size: ShotSize, seed: string, opts?: { toward?: string; side?: 1 | -1; handheld?: number }): CamShot;
  /** A slow push-in from `from` to `to` (default one size tighter) over `s` seconds: emphasis on a line or a realisation. */
  export function pushIn(who: string, from: ShotSize, s: number, opts?: { to?: ShotSize; toward?: string; side?: number; height?: ShotHeight }): CamShot;
  /** The reverse: pull out (default one size wider), for an exit, a reveal of the room, a deflation. */
  export function pullOut(who: string, from: ShotSize, s: number, opts?: { to?: ShotSize; toward?: string; side?: number; height?: ShotHeight }): CamShot;
  /** An insert: a close, high angle on what `who` is holding or doing (a cu looking down at the hands). */
  export function insert(who: string, opts?: { toward?: string; side?: number }): CamShot;
  /** A cutaway to someone else (a bystander, a listener) for `hold` (default 'beat'), then back is up to the caller. */
  export function cutaway(who: string, opts?: { size?: ShotSize; toward?: string; hold?: BeatName }): Step[];
  /**
   * Variety pass over a step list: wherever three or more cam steps in a row (ignoring non-cam steps between them) are
   * 'frame' shots of the same who + size + height, every second repeat gets pickAngle(seed + index) (side sign kept).
   * Returns a new list; nested 'parallel' tracks are walked too. Nothing else changes.
   */
  export function vary(steps: Step[], seed: string): Step[];
  ```
  Size order for "one tighter / wider": ws, fs, ms, mcu, cu (clamped at the ends). `pushIn`/`pullOut` return a 'frame'
  shot with `push: { to, s }`. `insert` = `{ kind: 'frame', who, size: 'cu', height: 'high', toward, side: side ?? 30 }`.
  Also extend `coverage(...)`'s returned object with `two(size: ShotSize = 'fs'): CamShot` (a two-shot from the same
  side of the line: frame on `a`, toward `b`, side `75 * side`, the camera swung wide enough to hold both).
- New `src/cutscene/direct.test.ts`: `pickAngle` is deterministic, keeps the side sign, stays in its ranges; `pushIn('a',
  'ms', 2)` gives `push: { to: 'mcu', s: 2 }` and `pullOut('a', 'ws', 2)` stays at 'ws'; `vary` changes a run of four
  identical frame cams (at least one differs) and leaves a varied run alone; `vary` never changes the sign of `side`.

## Contract
The signatures above, exactly. Existing helpers unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/cutscene/direct.test.ts src/cutscene/pacing.test.ts` passes.
- `npx tsc --noEmit -p .` passes.

## Out of scope
`script.ts`, `timeline.ts` (the push is already implemented), `pacing.ts` (issue 13), the scenes, the bible doc.
