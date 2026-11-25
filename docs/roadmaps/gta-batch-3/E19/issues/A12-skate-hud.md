Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/skate/hud.ts` and `skate/hud.test.ts`. Others edit other skate/ files.

## Goal
The skateboard HUD: the running combo (trick names, points x multiplier, a link bar), the big landed/bailed text, a
line strip, a speed/best line, and touch buttons OLLIE, FLIP and GRAB; plus the input reader that turns the game's
input and the touch buttons into one frame of skateboard control.

## Read first
- `games/gnome-theft-auto/src/skate/types.ts`: `SkateInput` (ollie and flip are edges, grab held, stick).
- `packages/trickboard/src/tables.ts`: `ComboView` (lines, points, mult, linkLeft, total, best, last).
- `games/gnome-theft-auto/src/types.ts` `InputState` (`jump` is an edge; `fire`, `aim`, `boost` held; moveX/moveY).
- `games/gnome-theft-auto/src/golf/hud.ts`: the model for a HUD module (own container in `ui`, styles, `swallow`,
  safe-area insets, hold buttons with pointerdown/up/cancel/leave).
- `games/aether-board/src/hud.ts`: how Aether Board shows a combo (for the look; do not import it).

## Change
`src/skate/hud.ts`:
```ts
export interface SkateTouch { olliePressed: boolean; flipPressed: boolean; grabHeld: boolean }
export interface SkateHud {
  show(on: boolean): void;
  setCombo(v: ComboView, now: number): void;   // now = board clock, for fading `last` after ~1.5 s
  setLine(text: string | null): void;           // e.g. 'First Push  gate 2/3  12.4 s'; null hides
  setInfo(text: string): void;                  // e.g. '18 km/h  best combo 2,450'
  touch(): SkateTouch;                          // pressed flags cleared by the read
  dispose(): void;
}
export function createSkateHud(ui: HTMLElement): SkateHud;
/** Stateful: keeps last frame's fire to make `flip` an edge. */
export function createSkateInputReader(): {
  read(inp: InputState, raw: InputState, touch: SkateTouch): SkateInput;
};
```
- Reader: steer = inp.moveX; push = max(0, inp.moveY), brake = max(0, -inp.moveY), except while a trick button is
  held (raw.fire, raw.aim or touch.grabHeld) when push = brake = 0 and `stick` = (inp.moveX, inp.moveY) clamped to the
  unit disc (else stick 0,0); ollie = inp.jump || touch.olliePressed; flip = (raw.fire && !lastFire) ||
  touch.flipPressed; grab = !!raw.aim || touch.grabHeld.
- Combo panel: lower-middle of the screen, trick names joined with ' + ' (last 4 visible), "1,250 x 3" big, a thin
  link bar for `linkLeft / 1.4`; `last` shows as a big centred word ('LANDED 3,750' in green, 'BAILED' in red) that
  fades. Info and line strips top-left under the game's top HUD (calc(env(safe-area-inset-top) + 64px)).
- Touch buttons right side above the game's own driving buttons (bottom: calc(env(safe-area-inset-bottom) + 170px)):
  OLLIE (72 px), FLIP, GRAB (hold), each >= 44 px; a hint line "Ollie: Space - Flip: F/click + direction - Grab: right
  click + direction - Off: E". Fit 390x844 and 844x390.

`src/skate/hud.test.ts` (DOM environment as golf/hud.test.ts uses): reader mapping (push/brake/steer, the stick only
while a trick button is held, flip edge only once per press, ollie from jump or touch); setCombo shows the lines and
points; pointerdown GRAB holds until pointerup.

## Contract
The exports above, exactly.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate/hud.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
