# FX03 issues (epic 1, all parallel)

Every issue below starts with this shared block (pasted into each worker prompt).

~~~~text
## Environment (shared)
- Repo worktree: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a050d8ecd0957fc34 (use absolute paths;
  Git Bash; if node is missing: export PATH="/c/Program Files/nodejs:$PATH"). Game: games/gnome-theft-auto (Vite + TS +
  three.js). Paths below are under games/gnome-theft-auto/src/.
- Other workers edit OTHER files of this game at the same time. Edit only the files your issue names. Do not commit, do
  not run `vite build` / `npm run build`, do not start a dev server. Keep LF line endings (do not rewrite whole files).
- A dev server is already running at http://localhost:5503/ (do not stop it). To look at your change at a phone size
  with touch emulation, and to list visible buttons and any overlapping button rects, run:
    node C:/Users/cpsai/AppData/Local/Temp/claude/5c6e1ad7636bf755/491bbd90-be40-460d-b246-8599e60336ab/scratchpad/tshot.mjs <outdir> "<name>|<url query>|<WxH>|<touch 0|1>|<wait s>[|<js to eval>]"
  e.g. "courtP|court=game&at=-90,40,3.14|390x844|1|12". Use an outdir under
  C:/Users/cpsai/AppData/Local/Temp/claude/5c6e1ad7636bf755/491bbd90-be40-460d-b246-8599e60336ab/scratchpad/<your issue id>/
  and look at the PNG with the Read tool. Check 390x844 touch, 844x390 touch and 960x600 desktop (touch 0).
- Checks: `npx tsc --noEmit -p games/gnome-theft-auto` (from the repo root) and the vitest files next to what you touched
  (`npx vitest run <path>` from games/gnome-theft-auto).
- Mobile rules: touch targets at least 44 px, no overlap between any two visible buttons, fits 390x844 and 844x390 with
  safe-area insets (env(safe-area-inset-*)).

## Activity mode API (src/activityMode.ts, already written; import with a relative path)
  export type ActivityKey = 'golf' | 'comedy' | 'court' | 'skate' | 'winter' | 'chef' | 'gnomazon' | 'lift' | 'hose' | 'farm' | 'shift' | 'workplace';
  export type ActivityButton = 'enter' | 'jump' | 'down' | 'horn' | 'boost' | 'radio' | 'banger' | 'swap' | 'reload' | 'aim' | 'fire';
  export interface TouchActivity { stick: boolean; buttons: ActivityButton[] }
  /** Mark an activity as running (holsters the gun: app.ts reads activityHidesGun()). Cheap to call every frame. */
  export function setActivityOn(key: ActivityKey, active: boolean): void;
  /** Ask for (null: give back) a touch layout: input.ts hides every cluster button (Guns, Reload, Aim, Fire, Jump,
   *  Horn, Boost, Radio, the 🔥 banger, Enter/Exit...) except `buttons`, and the move stick when stick is false.
   *  Also hides the keyboard hint bar / vehicle key card and the birding telescope button. Cheap every frame. */
  export function setTouchActivity(key: string, t: TouchActivity | null): void;
  /** Put a panel element in the shared activity HUD slot (adds class 'gta-act-slot': position:fixed; top centre,
   *  width max(220px,min(380px,100vw-440px)) on wide screens; on a portrait phone (max-width:600px, min-height:501px)
   *  full width at top: safe-area + 172px, under the top button row; in landscape (max-height:500px) top: safe + 6px).
   *  While it is visible the HUD toasts move below it. The element keeps showing/hiding itself with style.display.
   *  Do not set position/top/left/transform/width on that element yourself. Returns an unregister function. */
  export function registerActivityPanel(el: HTMLElement): () => void;
  /** Hide the "Entering <region>" banner for ms (an activity just started). */
  export function quietRegionBanner(ms?: number): void;
Input-source helpers (src/ui/inputSource.ts): currentGlyphSet(): 'touch' | 'keyboard' | <pad family>,
onInputSourceChange(cb): () => void. Key glyph text: glyphText(action) from src/ui/glyphs.ts.
~~~~

---

## Issue 1: Court HUD (Sonnet)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
At Drainpipe Court on a phone the game's own touch cluster is gone (activity mode), the scoreboard sits in the activity
slot under the top button row with QUIT inside it (not in the minimap column), and the SHOOT / TURBO / PASS / FAKE
buttons form a bottom-right arc that touches nothing. The gun is holstered for the whole game and shootaround.

## Read first
- court/hud.ts (whole file, 258 lines): createCourtHud, show(mode), the scoreboard strip, the button column, QUIT.
- court/runtime.ts lines 100-230 (read only): when show('game' | 'shootaround' | 'none') is called.

## Change (court/hud.ts only)
- In show(next): setActivityOn('court', next !== 'none'); setTouchActivity('court', next === 'none' ? null :
  { stick: true, buttons: [] }) (the court's own buttons replace the cluster; the stick still moves the player).
  Also call both with off/null in dispose().
- Scoreboard: registerActivityPanel(scoreboardEl) once at creation (remove its own fixed positioning; keep the chalk
  look). In the portrait slot make it a slim bar: one or two lines, e.g. "You & Pansy 0 : 2 Sorrel & Ivy · to 11 · 0:11".
- Move the QUIT button into the scoreboard panel (right end, 44 px min, keep its key glyph sub-label "E" for keyboard),
  so nothing of the court sits in the minimap column on the right (top ~170 px on a phone).
- Buttons: SHOOT (largest), TURBO, PASS, FAKE as a bottom-right arc (right: safe + 12px, bottom: safe + 16px, about
  8-10 px gaps), clear of the bottom meters (Turbo / Shot bars: keep them readable, move them left/up if needed).
  Keep the key sub-labels ("F / click", "Shift", "Space", "Q") but show them only when currentGlyphSet() !== 'touch'
  (subscribe onInputSourceChange).
- No two visible buttons may overlap at 390x844, 844x390 and 960x600.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes; npx vitest run src/court passes.
- tshot "courtP|court=game&at=-90,40,3.14|390x844|1|12" reports "overlaps: none" and the buttons list has no Guns /
  Reload / Aim / Fire / Jump; the PNG shows the score bar under the top button row and the court visible. Same for
  "courtL|court=game&at=-90,40,3.14|844x390|1|12", "courtD|court=game&at=-90,40,3.14|960x600|0|12" and
  "courtS|court=shoot&at=-90,40,3.14|390x844|1|12".

## Out of scope
court/runtime.ts, court/view.ts (camera), input.ts, activityMode.ts, any other file.
~~~~

---

## Issue 2: Skate HUD (Sonnet)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
On the skateboard the driving cluster (Horn, Boost, Handbrake, Radio, Reload, Fire, 🔥) is gone and only Exit stays
beside OLLIE / FLIP / GRAB; the key hint shows only for keyboard players, as glyph chips; the speed/combo pill sits in
the activity slot and hides its zero state.

## Read first
- skate/hud.ts (whole file, 233 lines): createSkateHud, show(on), setInfo(text), the hint line
  ("Ollie: Space - Flip: F/click + direction - Grab: right click + direction - Off: E"), the OLLIE/FLIP/GRAB pad
  (bottom ~170 px), the info pill.
- skate/runtime.ts lines 425-450 (read only): it calls hud.show(riding) and hud.setInfo(`${kmh} km/h  best combo N`)
  every frame.

## Change (skate/hud.ts only)
- In show(on): setActivityOn('skate', on); setTouchActivity('skate', on ? { stick: true, buttons: ['enter'] } : null)
  ('enter' is the cluster's Exit button, which steps off the board). Off/null again in dispose().
- Hint line: show only when currentGlyphSet() === 'keyboard' (or a pad: use pad glyphs if easy, else hide), re-check
  on onInputSourceChange. Render as chips like "OLLIE Space · FLIP F / click · GRAB right-click · OFF E" (small
  rounded key chips), placed so it never runs into the minimap column or the weapon label (bottom centre above the
  combo, max-width ~60vw on desktop).
- Touch buttons: show the key glyph sub-label only for keyboard/pad (like the court's "SHOOT F / click").
- Info pill: registerActivityPanel(pillEl). In setInfo, parse the leading km/h number (/^(\d+)\s*km\/h/); hide the
  pill while that number is below 4 (about 1 m/s); drop "best combo 0" when the best is 0 (show "18 km/h" alone).
- Pad layout: OLLIE / FLIP / GRAB must not overlap the cluster's Exit button (bottom-right, ~64 px, at right
  max(24px,9vw), bottom max(24px,7vh)); place the pad clear of it (e.g. above it or to its left), 8+ px gaps.

## Done when
- tsc passes; npx vitest run src/skate passes.
- tshot "skateP|skate=board|390x844|1|12": buttons are Exit / FLIP / GRAB / OLLIE (+ the top HUD icons), overlaps none,
  no key hint on the phone. "skateL|skate=board|844x390|1|12" overlaps none. "skateD|skate=board|960x600|0|12": the
  chips show and do not touch the minimap or the weapon label.

## Out of scope
skate/runtime.ts, input.ts, activityMode.ts, any other file.
~~~~

---

## Issue 3: Golf HUD (Sonnet)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
During a round of Hedgeworth Links the cluster is gone for the whole round (activity mode), the hole strip is a compact
two-line bar in the activity slot with Card / Quit in it, and the aim / club / SWING buttons have room and never sit on
another button. On a portrait phone the line of play (horizon, pin) is no longer behind the strip.

## Read first
- golf/hud.ts (whole file, 335 lines): createGolfHud, show(on), set(view), the buttons (lines ~110-131), the row
  layout (~133), placeTop (~192-213), onResize.
- golf/types.ts: HudView, HudAction, GolfHud (read only; do not change the interface).

## Change (golf/hud.ts only)
- In show(on): setActivityOn('golf', on); setTouchActivity('golf', on ? { stick: true, buttons: ['enter'] } : null)
  ('enter' is the cluster's context button, labelled Swing / Use near the ball). Off/null in dispose().
- Hole strip: registerActivityPanel(stripEl) once; delete placeTop's positioning of the strip (keep any meter placement
  it does). Two lines max: line 1 "Hole 1 · The Mortgage · Par 4  Stroke 0 · E"; line 2 short club + distance, e.g.
  "Driver 205 · 347 to pin · ▲3 mph" (abbreviate long club names: Pitching Wedge -> PW, Sand Wedge -> SW,
  n Iron -> nI, n Wood -> nW; never cut mid-word; ellipsis only as last resort).
- Card and Quit: move inside the strip panel (right side, 44 px tall, 8 px apart), not over the minimap.
- Buttons: ◀ Aim, Aim ▶, Club −, Club + with 8 px gaps (a 2x2 block on narrow screens, max-width:600px), SWING big at
  bottom right, clear of the cluster's context button (bottom-right ~64-84 px, right max(24px,9vw), bottom max(24px,7vh))
  — e.g. SWING to its left or above it. The telescope button is hidden by activity mode CSS already.
- No two visible buttons overlap at 390x844, 844x390, 960x600, at the tee (walking) and while addressing.

## Done when
- tsc passes; npx vitest run src/golf passes.
- tshot "golfP|golf=1&at=-1080,476,0|390x844|1|14": no Guns/Reload/Aim/Fire/Jump, overlaps none, the strip under the
  top button row and the fairway/horizon visible below it. Also "golf5|golf=5&at=-1320,616,0|390x844|1|14",
  "golfL|golf=1&at=-1080,476,0|844x390|1|14" and "golfD|golf=1&at=-1080,476,0|960x600|0|14": overlaps none. For the
  address view, add the eval js "window.__gta.golf.api.address?.() ?? Object.keys(window.__gta.golf.api)" (if the api
  has no address call, walk the ball check by reading the code and shoot after a key press is not possible: then
  judge the address layout from the code and the tee shots).

## Out of scope
golf/runtime.ts (another worker adds the club and swing there), golf/view.ts, golf/types.ts, input.ts, any other file.
~~~~

---

## Issue 4: Golf club and swing (Sonnet)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
While a round is on, the gnome holds a golf club (prefab `golf-club`, a putter look is optional on the green) and the
gun is put away; a swing tap plays a short backswing then follow-through on the gnome's arms, and the gnome never
stands inside a tee-marker ball.

## Read first
- golf/runtime.ts (468 lines): installGolf, putPlayer (~227), standAtBall, startRound / quitRound, onAction ('swing'
  -> tapSwing), stepRound (~323: phases 'walk' | 'aim' | 'swing' | 'flight' ...), the `update(dt, inp)` it returns
  (app.ts calls golf.update(dt, rawInp) every frame AFTER the player model is updated and after the gun pose).
- fishing/fishPose.ts (whole): the pattern to copy: hold a prefab with buildGear('hand', prefabId) from '@lawn/gnome'
  added to the right arm, pose arms with animById(...) rows + applyPose(model, parts, pose, w) / resetParts from
  '../anim/animator', blend in over 0.2 s, clear() puts the arms back and drops the prop.
- anim/index.ts and anim/types.ts (AnimDef shape, how rows are registered); fishing rows 'fish-cast' are an example.
- packages/prefabs/src/catalog/gta-golf-gear.ts: the `golf-club` prefab (hold pivots).
- golf/types.ts: HOLES (tee, teeY), the tee markers' positions if defined (grep 'marker').

## Change
- New golf/swingPose.ts: createSwingPose() -> { apply(model, phase, charge, dt), swing(): void (starts the
  follow-through clip), clear(model) } holding `golf-club` via buildGear('hand', 'golf-club'). Address pose during
  'aim', backswing raised with the meter while 'swing' charges (or a fixed 0.35 s backswing if there is no charge),
  a ~0.45 s follow-through after the tap that launches the ball. Arms parts only (armL, armR, body). You may add
  AnimDef rows (e.g. 'golf-address', 'golf-backswing', 'golf-follow') in a NEW file anim/golf.ts if the registry
  takes extra row files cleanly; otherwise keep the pose maths inside swingPose.ts. New test golf/swingPose.test.ts
  (pure parts: e.g. the pose function returns finite angles, follow-through ends).
- golf/runtime.ts: while round !== null, call setActivityOn('golf', true) (false when the round ends / quits; this
  holsters the gun via app.ts) and every frame in update() apply the swing pose to deps.player.model (find how the
  player model is reached: deps.player has .model — check types); call swing() when tapSwing launches the ball; clear()
  on quit/end. The ball launch may stay immediate; the backswing is visible before it while the meter runs.
- putPlayer/standAtBall: if the address spot is within 0.7 m of a tee-marker ball, nudge the player sideways off it.

## Done when
- tsc passes; npx vitest run src/golf passes (incl. the new test). npm test -w games/gnome-theft-auto later by the lead.
- tshot "golfClub|golf=1&at=-1080,476,0|960x600|0|14": the gnome holds a club, no pistol (Read the PNG).

## Out of scope
golf/hud.ts (another worker), golf/view.ts, app.ts, input.ts, activityMode.ts.
~~~~

---

## Issue 5: Winter rides (Haiku)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
On the tea-tray sled and the skis the touch cluster shows only Exit (no Horn, Boost, Handbrake, Radio, Reload, Fire,
🔥), the winter Hop / Let go / Grab tow / Ride again column never overlaps Exit, and starting a run does not stack the
region banner on the rider.

## Read first
- winter/runtime.ts lines 130-200 (buildHud: the button column `col` at left: safe+12px, bottom: safe+150px) and the
  code that knows the player is riding a winter run (grep `riding`, `drives(`, `startRun`, `setButtons`).

## Change (winter/runtime.ts only)
- Every frame in update (or wherever the ride state is known): const riding = <player is on a winter sled/skis run>;
  setActivityOn('winter', riding); setTouchActivity('winter', riding ? { stick: true, buttons: ['enter'] } : null).
- When a run starts (startRun), call quietRegionBanner(8000).
- Move the button column so it cannot overlap the cluster's Exit button (bottom-right, ~64 px) or the stick: keep it
  on the left but higher, e.g. bottom: calc(env(safe-area-inset-bottom,0px) + 260px) on portrait and keep min 44 px
  targets; check 844x390 too (there use bottom: safe + 110px if 260 does not fit — use a matchMedia('(max-height:500px)')
  check or a CSS class + media query).

## Done when
- tsc passes; npx vitest run src/winter passes.
- tshot "sledP|winter=tea-tray-run|390x844|1|12": buttons are Exit and Hop (+ top HUD icons), overlaps none.
  "skiP|winter=wool-run|390x844|1|12" and "sledL|winter=tea-tray-run|844x390|1|12": overlaps none.

## Out of scope
Every file except winter/runtime.ts.
~~~~

---

## Issue 6: Shift panel and the bin round (Sonnet)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
The bin / fire shift panel no longer covers the toasts, the region banner, the money or the minimap: it lives in the
activity slot (two lines max on a phone), shows an optional spoken `note` line, and while it is up the gun is
holstered. The bin round's HUD drops its debug-looking zero state, and the bin lift uses the activity touch mode.

## Read first
- workplaces/shiftHud.ts (whole, 229 lines): CSS (#gta-shift-hud fixed top centre z 35), createShiftHud, set(v).
  ShiftHudView already has `note?: string | null` (added by the lead; render it).
- workplaces/garbage/runtime.ts (331 lines): the round, `lift` (the bin-lift panel is open while lift !== null),
  the HUD view built around line 230-245 (meter { label: 'Round', frac }), round start (~90-100).

## Change
- shiftHud.ts: registerActivityPanel(root) at creation; remove root's own top/left/transform/width rules from CSS (the
  slot places it); keep z-index and the look. On a portrait phone (max-width:600px) show the title + at most 2 lines
  (hide line 3, smaller padding), full width. Render `note` (when non-empty) as an italic quote line under the title,
  wrapping (white-space:normal), max 2 lines. In set(): setActivityOn('shift', v !== null); on the first set() with a
  view after none, call quietRegionBanner(8000). In dispose: setActivityOn('shift', false).
  Update shiftHud.test.ts if it asserts the removed CSS; add a test that note renders.
- garbage/runtime.ts (HUD text and touch only): before the first bin is done, show no meter (meter: null) and a line
  like "First bin: 120 m" instead of "Round 0%"; every frame setTouchActivity('lift', lift !== null ? { stick: false,
  buttons: [] } : null) so the lift panel's own controls are the only buttons (the lift panel is open while
  lift !== null). Do not change the round rules.

## Done when
- tsc passes; npx vitest run src/workplaces passes.
- tshot "binP|binround&at=-218,-89,0|390x844|1|14" and "binD|binround&at=-218,-89,0|960x600|0|14" (if ?binround
  needs a value, read garbage/runtime.ts line ~37): the panel sits under the top button row on the phone, toasts below
  it, the minimap and acorn panel uncovered; overlaps none.

## Out of scope
firefighter/* (another worker), garbage/liftUi.ts, hud.ts, activityMode.ts, any other file.
~~~~

---

## Issue 7: Fire brigade (Sonnet)

~~~~text
Epic: FX03-1 Activity HUDs. Depends on: none.
<shared block>

## Goal
A fire shift opens with the Pumper on the apron outside the bay and the camera behind it (not in the red walls), the
station has a back wall, the shift panel says each thing once (one Tank figure, the caller's line in the panel for its
first 6 s instead of a toast, a one-time line when a fire spreads), and the hose has keyboard glyphs, a first-time hint,
Space that sprays, and the activity touch mode.

## Read first
- workplaces/firefighter/station.ts (195 lines): the house boxes/meshes, the `engine` spot (x, z, yaw), bay doors.
- workplaces/firefighter/runtime.ts (850 lines): engine spawn (~265-280, createVehicle(deps.scene, 'fire-engine',
  e.x, e.z, e.yaw)), the call start (where the caller's line is toasted), fire spread (grep 'spread' / 'fires left'),
  the shift HUD view (~673-692: lines and meter; "Tank" appears twice), hose open/close.
- workplaces/firefighter/hoseUi.ts (216 lines): the hose UI (its own stick and water button, ~157-174), keys.
- workplaces/shiftHud.ts lines 1-25 (read only): ShiftHudView incl. `note?: string | null` (rendered by another worker).
- keys.ts (KEYS) and ui/glyphs.ts glyphText (read only).

## Change
- station.ts: move the `engine` spot onto the apron just outside the bay doors, same facing (out), so the camera
  behind it is outside the house; add the house's back wall (a box mesh using the house's existing wall material, and
  a collision box in the same list the other walls use; no shared faces with touching boxes; nothing flat co-planar).
- runtime.ts: after spawning the engine and putting the player in it, snap the follow camera behind it if there is a
  hook for it (grep chase / camera in deps; skip if none). HUD: show the tank once (keep the meter "Tank NN%", drop the
  "Tank NN%" text line). Pass the caller's line as `note` in the ShiftHudView for the first 6 s of a call instead of
  hud.toast-ing it. When a fire spreads to a new spot, toast once per call "It has spread to <place>!" (or "It has
  reached the awning!" style, using the spot's name if there is one) instead of the count jumping silently. Every
  frame: setActivityOn('hose', hose open); setTouchActivity('hose', hose open ? { stick: false, buttons: [] } : null).
- hoseUi.ts: for keyboard/pad (currentGlyphSet() !== 'touch', onInputSourceChange) show glyph chips on the water
  button (Space) and the Ladder button (L), hide the on-screen stick for keyboard players, and the first time the hose
  opens show a one-line hint "WASD aim · Space spray · L ladder" for 5 s. Verify holding Space sprays (read the key
  handling; fix it if Space is swallowed, e.g. by preventDefault ordering or a keydown handler that only fires once).

## Done when
- tsc passes; npx vitest run src/workplaces/firefighter passes.
- tshot "fireD|firecall&at=-221,140,3.14|960x600|0|16" and "fireP|firecall&at=-221,140,3.14|390x844|1|16" (read
  runtime.ts line ~133 for ?firecall's accepted values and adjust): the first frames show the Pumper outside the
  house, not 70% red wall; overlaps none. Then run `npm run zfight -- "http://localhost:5503/?offline&no-intro&at=<station x>,<z+12>,3.14"` from the repo root: clean.

## Out of scope
shiftHud.ts and garbage/* (another worker), hud.ts, app.ts, input.ts, activityMode.ts.
~~~~
