Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/court/hud.ts` and `court/hud.test.ts`. Others edit other court/ files.

## Goal
The Drainpipe Court HUD: a chalk-style scoreboard strip during a pickup game, a shot meter and turbo bar, touch
buttons for every basketball action, a shootaround strip, and a result card; plus the pure function that turns the
game's input and the touch buttons into the player's basketball control.

## Read first
- `games/gnome-theft-auto/src/court/types.ts`: `PickupView`, `CourtControl`, `CourtTouch`.
- `games/gnome-theft-auto/src/types.ts` `InputState` (moveX/moveY are -1..1, `jump`/`switchGun`/`enterExit` are
  edges, `fire` and `boost` are held).
- `games/gnome-theft-auto/src/golf/hud.ts` (all): the model: DOM-only, its own container appended to `ui`, panel and
  button styles, `swallow` on pointer events, safe-area insets, hold buttons with pointerdown/up/cancel/leave.

## Change
`src/court/hud.ts`:
```ts
export interface CourtHud {
  show(mode: 'none' | 'game' | 'shootaround'): void;
  /** During a game, every frame. names: [home team, away team], e.g. ['You & Pansy', 'Swish & Lintel']. */
  setGame(v: PickupView, names: [string, string]): void;
  /** During a shootaround, every frame. */
  setShoot(s: { charge: number; makes: number; shots: number; three: boolean }): void;
  /** The end card ('You win 11-7. Swish gives the stake back.'), or null to hide. Has a Close button (44 px). */
  result(text: string | null): void;
  /** Touch buttons this frame; pressed flags are cleared by the read. */
  touch(): CourtTouch;
  dispose(): void;
}
export function createCourtHud(ui: HTMLElement): CourtHud;
/** The player's basketball control. The broadcast camera looks north (screen right = +x, screen up = -z), so
 *  moveZ = -moveY. prevShootDown: whether shoot was down last frame (for the pressed/released edges). */
export function courtControl(inp: InputState, touch: CourtTouch, prevShootDown: boolean): CourtControl;
```
- `courtControl`: moveX = inp.moveX, moveZ = -inp.moveY; shootDown = inp.fire || touch.shootHeld; shootPressed /
  shootReleased from prevShootDown; passPressed = inp.jump || touch.passPressed; turbo = !!inp.boost ||
  touch.turboHeld; fakePressed = inp.switchGun || touch.fakePressed.
- Game mode: a top-centre strip below the game's own top HUD (top: calc(env(safe-area-inset-top) + 64px)): "You &
  Pansy 4 : 6 Swish & Lintel" and "to 11" and the game clock (mm:ss of `t`), chalk-on-blackboard look (dark green
  panel, off-white text). A shot-charge bar (fills with `charge`, green band 0.72..0.88) and a turbo bar near the
  bottom centre. Touch buttons on the right side, stacked above the game's own bottom-right buttons (bottom:
  calc(env(safe-area-inset-bottom) + 170px), right: calc(env(safe-area-inset-right) + 12px)): SHOOT (hold, 72 px),
  PASS, TURBO (hold), FAKE, each >= 44 px; a QUIT button top-right below the strip. Keyboard hints in small text
  (Shoot: F / click, Pass: Space, Turbo: Shift, Fake: Q, Quit: E).
- Shootaround mode: a small strip "Shootaround 3/7 - three!" and the charge bar; a SHOOT hold button and QUIT.
- Hide everything in 'none'. Fit 390x844 portrait and 844x390 landscape (no overlap with each other; wrap the strip
  text). Never restyle `ui` itself.

`src/court/hud.test.ts` (vitest with jsdom/happy-dom as the other HUD tests in this game do; check golf/hud.test.ts):
`courtControl` mapping and edges; show('game') then setGame shows the score text; pointerdown on SHOOT makes
touch().shootHeld true until pointerup; a PASS tap is read once.

## Contract
The exports above, exactly.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court/hud.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
