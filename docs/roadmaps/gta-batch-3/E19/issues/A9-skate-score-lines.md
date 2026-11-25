Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/skate/score.ts`, `skate/score.test.ts`, `skate/lines.ts`, `skate/lines.test.ts`.
Others edit other skate/ files.

## Goal
Two small pure modules for the skateboard: the combo score (Aether Board's `createCombo` from `@lawn/trickboard` fed
with the board's events) and Fennel's lines (ride through gates in order within a time).

## Read first
- `games/gnome-theft-auto/src/skate/types.ts`: `BoardState` (x, z, mode, t), `SkateEvent` (PhysEvent plus 'wall',
  'push', 'fullRail'), `SkateLine`, `LineGate`, `SKATE_LINES`, `LineId`, `LineEvent`, `SKATE_ORIGIN`.
- `packages/trickboard/src/tricks.ts`: `createCombo()`, `Combo` (`event(ev, p)`, `tick(dt, p)`, `view()`),
  `ComboPlayer` ({ t, mode }); `packages/trickboard/src/tables.ts`: `PhysEvent`, `ComboView` (lines, points, mult,
  linkLeft, total, best, last {text, points, t, kind 'landed'|'bailed'}).

## Change
`src/skate/score.ts`:
```ts
export interface SkateScore {
  event(ev: SkateEvent, b: BoardState): void;   // passes PhysEvents to the combo; ignores 'wall', 'push', 'fullRail'
  tick(dt: number, b: BoardState): void;
  view(): ComboView;
  /** A combo banked since the last call (points and how many trick lines it had), else null. */
  takeBanked(): { points: number; tricks: number } | null;
}
export function createSkateScore(): SkateScore;
```
Pass `{ t: b.t, mode: b.mode }` as the `ComboPlayer` (BoardMode is the same union as trickboard's Mode). Detect a bank
when `view().last` changes to a new object/time with kind 'landed'; `tricks` = the number of lines the combo had just
before it banked (track the running lines length each call).

`src/skate/lines.ts`:
```ts
export interface LineRun { line: SkateLine; next: number; t: number; started: boolean; done: boolean }
export function lineById(id: LineId): SkateLine;
export function newLineRun(line: SkateLine): LineRun;
/** One frame: the board's position and mode. A gate counts when the board is within its r (park frame: u = b.x -
 *  SKATE_ORIGIN.x, v = b.z - SKATE_ORIGIN.z) in the state it needs ('air': mode 'air', 'grind': mode 'grind').
 *  The clock starts at the first gate. Fails on time (t > timeLimit) or when the board bails (mode 'bail'). */
export function stepLineRun(run: LineRun, b: BoardState, dt: number): LineEvent;
export function abortLineRun(run: LineRun): LineEvent;  // { kind: 'fail', reason: 'off' } unless done
```
Gate events `{ kind: 'gate', index, of }`; the last gate gives `{ kind: 'done', time }`; after done or fail it returns
null.

Tests (`score.test.ts`, `lines.test.ts`): an ollie + kickflip + land then 2 s on the ground banks once with tricks 3
(Ollie, Kickflip... check what createCombo adds) and positive points; a bail gives no bank; 'wall' events are ignored.
Lines: walking a fake board through the 'first-push' gates with the right modes finishes with a time; skipping the
'air' state at gate 2 never finishes; exceeding the time limit fails; a 'bail' mode fails.

## Contract
The exports above, exactly (skate/runtime.ts uses them).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate/score.test.ts src/skate/lines.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file; `packages/trickboard`.
