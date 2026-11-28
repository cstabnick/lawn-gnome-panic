Epic: FX06 epic 1, issue A: speech bubbles stay on screen and small (G2#20, G6#3, D58)
Depends on: none (dev port 5516)

(Paste of `_env.md` goes here when launched.)

## Goal
Ambient-gnome speech bubbles never run off screen, never cover the HUD corners, are capped in on-screen size (smaller
on a phone), hide when the camera is within about 3 m of them, and at most two show at once (the nearest two).

## The problem today
- `src/ambientGnomes.ts` `makeBubbleSprite(name, text)` returns a `THREE.Sprite` (512x176 canvas, `depthTest: false`,
  `renderOrder = 20`). `createAmbientGnomes().update()` sets `bubble.scale.set(3.4 * s, 1.18 * s, 1)` and the position
  `gy + 2.25` over the gnome when the player is within 10.5 m. A world-size sprite grows without limit as the camera
  nears: at 390x844 the bubble covers half the screen and is cut off at the edges ("Wilhelmina Mar..."), and it
  covers the minimap (top right) and the stats panel (top left).
- At Wader's Rest (the Flock ring, `src/societies/flock/life.ts` RING_FIVE: five members 6 m round a centre) the camera
  stands inside the ring and the five bubbles fill the whole screen.
- `makeBubbleSprite` is also used by `src/country/campsBuild.ts` and `src/country/trellisLife.ts` (they set scale and
  position themselves). The fix should live inside `makeBubbleSprite` so they get it too, with no change to callers.

## Read first
- `src/ambientGnomes.ts` (all of it; the bubble code is `makeBubbleSprite` and the end of `update`). NOTE: this file
  is CRLF; the lead already added `y`/`surface`/`ambientFeetY` near the top: keep those as they are.
- three.js r1xx `WebGLRenderer.renderObject`: it calls `object.onBeforeRender(renderer, scene, camera, geometry,
  material, group)` and only AFTER that computes `object.modelViewMatrix = camera.matrixWorldInverse * object.matrixWorld`.
  So writing `sprite.matrixWorld` inside `onBeforeRender` moves/scales what is drawn this pass; `scene.updateMatrixWorld()`
  rebuilds it from position/scale on the next render. Confirm in `node_modules/three/src/renderers/WebGLRenderer.js`
  (search `onBeforeRender`).

## Change
1. New pure module `src/bubbleClamp.ts` (no three.js, no DOM) with exactly:
   ```ts
   export interface ScreenRect { x: number; y: number; w: number; h: number } // CSS px, origin top-left
   export interface BubbleView { w: number; h: number; insets?: { top: number; right: number; bottom: number; left: number } }
   export const BUBBLE = {
     /** Widest a bubble may be on screen, px (desktop) and as a fraction of the view width on a phone. */
     maxW: 340, maxWPhoneFrac: 0.6,
     /** Narrower views than this are phones. */
     phoneBelow: 600,
     /** Keep this far inside the view (plus safe-area insets), px. */
     margin: 10,
     /** Hide a bubble when the camera is within this many metres (horizontal) of it. */
     hideNear: 3,
     /** At most this many bubbles on screen at once (the nearest to the camera). */
     maxShown: 2,
   } as const;
   /** The HUD corners a bubble must keep clear of (top-left stats panel, top-right minimap + buttons), for a view. */
   export function hudCorners(view: BubbleView): ScreenRect[];
   /** Fit a bubble whose centre projects to (cx, cy) with an unclamped on-screen size w x h px: returns the new centre
    *  and a scale factor k <= 1 for the size (k = 0 means hide). */
   export function clampBubble(cx: number, cy: number, w: number, h: number, view: BubbleView): { cx: number; cy: number; k: number };
   /** Of the candidates (id, distance to camera), the ids allowed to show: the maxShown nearest. */
   export function pickShown<T>(cands: readonly { id: T; dist: number }[], max?: number): Set<T>;
   ```
   Rules for `clampBubble`: cap width at `maxW` (or `maxWPhoneFrac * view.w` when `view.w < phoneBelow`), keeping the
   aspect; then move the rect inside `[margin + inset]` of every edge; then if it overlaps a `hudCorners` rect, push it
   straight down below that rect (if that would leave the view, push it toward the horizontal centre instead). Measure
   the corner rects from the real HUD at 960x600 and 390x844 (screenshots; look at the top-left panel and the top-right
   minimap + round buttons) and express them as px with sensible fractions of the view so they hold at other sizes.
2. New `src/bubbleClamp.test.ts` (vitest): a big bubble is capped (desktop 340 px, phone 0.6 x 390); a bubble off the
   right edge comes back inside; one over the top-right corner moves below it; `pickShown` keeps the two nearest.
3. `src/ambientGnomes.ts` `makeBubbleSprite`: set `sprite.frustumCulled = false` and an `onBeforeRender` that, for a
   `PerspectiveCamera` only (leave other cameras alone, e.g. the minimap):
   - takes the bubble's world position and size from `sprite.matrixWorld` (position + scale; respects parents),
   - hides it (zero scale in `matrixWorld`) when it is behind the camera, when the camera is within `BUBBLE.hideNear`
     m horizontally, or when it is not among the `pickShown` nearest (see 4),
   - projects it to CSS px (`renderer.getSize(v)`; px per metre at distance d is `viewH / (2 * d * tan(fov/2))`),
     runs `clampBubble`, and writes the clamped centre (unprojected at the same depth) and scaled size back into
     `sprite.matrixWorld`.
   - Safe-area insets: read once from CSS (`env(safe-area-inset-top)` etc. via a hidden probe element's computed
     padding), cached; zeros without a DOM.
4. "At most two": keep a module-level registry of live bubble sprites (add in `makeBubbleSprite`; a sprite that is not
   `visible` or whose scale is ~0 is not a candidate). On the first `onBeforeRender` of a new frame (key:
   `renderer.info.render.frame`) rank every candidate by camera distance with `pickShown`; the rest are hidden that
   frame. Ease each bubble's own fade factor (0..1, about 0.15 s) toward shown/hidden so they do not pop.
5. Keep everything else in `ambientGnomes.ts` (speech, waves, idles, the bubble appearing within 10.5 m) unchanged.

## Contract
`makeBubbleSprite(name: string, text: string): THREE.Sprite` keeps its signature. `AmbientGnomeDef` and
`createAmbientGnomes` keep theirs (FX10/FX11/FX14 rely on `y`, `surface`).

## Done when
- `npx vitest run src/bubbleClamp.test.ts src/ambientGnomes*.test.ts` passes (whatever ambient tests exist) and
  `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- Screenshots (dev server on 5516) at 960x600 and `--size 390x844`: next to a Pardonlin resident (find one in
  `src/pardonlin/` `pardonlinResidents()`; stand 2-4 m away facing it), and inside the Flock ring at Wader's Rest (find
  RING_FIVE's centre in `src/societies/flock/life.ts`; stand at the centre). Bubbles readable, inside the screen,
  clear of the minimap/stats panel, at most two. Also a coast resident on the beach (e.g. Lookout Lenny 56.5, 1172.5).

## Out of scope
Every file but the three above. Do not move Flock members (`societies/` is another epic's). Do not change bubble text.
