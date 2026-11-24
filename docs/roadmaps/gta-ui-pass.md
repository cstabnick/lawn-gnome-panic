# Gnome Theft Auto: UI pass (simplify the buttons, controller glyphs)

The user: "take a pass to simplify the buttons the UI. surely we don't need this. also add controller glyphs to the UI
when controller in use".

Goal: a calm base screen. Core actions always on screen; contextual buttons only while their action is possible; every
rarely used thing in one More menu. Hints show the device in use: key caps on keyboard, the pad family's glyphs on a
gamepad, plain words (no glyphs) on touch. Nothing is removed: features are relocated, and a test checks that every
action has a path on touch, keyboard and gamepad.

## Inventory (before)

Screenshots: `before-portrait.png`, `before-landscape.png`, `before-desktop.png` (390x844, 844x390, 1280x720, Turfton
spawn, on foot). Visible buttons on the base screen, on foot:

| Device | Count | Buttons |
|---|---|---|
| Touch portrait / landscape | 12 | Jump, Guns, Reload, Aim, Fire, 🔭, 📗, 😀, 📜, 🚕, 📱, ⚙ |
| Desktop (mouse) | 7 | 🔭, 📗, 😀, 📜, 🚕, 📱, ⚙ |

Plus, contextually: 🔧 Handling / 🎨 Pay 'n' Glaze (garages.ts), 🔒 Store (lockup/runtime.ts), 🛠 Slipway
(craft/craftShop.ts), 🎣 + fishing journal + cast / bait / stop (fishing/fishHud.ts), 📓 hunting journal
(hunting/huntHud.ts), 👥 party (party/panel.ts, when online), job action (jobs/hud.ts), 🛠 trainer (?debug only).
In landscape the 😀 overlapped the ⚙ and Jump overlapped the gun block. Each module placed its own button with its
own inline style at its own hard-coded offset (`right: 158px / 210px / 262px`, `top: 40%`, `top: 268px`...).

Keys: 31 pressed keys, of which Tab duplicated holding Q (weapon wheel). Pad: View opened the phone, D-pad up the
Slipway; there was no pad path for boost, horn, the radio banger, the journal, map, party, mute, Pocket Kit, Lock-Up
store, garages or the nature journals. Hints hard-coded keyboard letters ('E: ', 'Smiley button or G', 'Hold Q! Or
Tab!', 'Press X (pad B...)') whatever the device. Bug found: `gta:emote` meant both "toggle the emote menu"
(emoteMenu.ts, gamepad D-pad down) and "play this emote" (app.ts, park benches), so a bench sit also opened the menu.

## Rules (after)

1. **Core actions are always on screen** (touch cluster, input.ts): move stick, look drag, Jump, Fire, Aim, Reload,
   Guns, the action button (labelled with the thing: "Steal Mower"); in vehicles Handbrake / Up / Down, Boost, Horn,
   Radio, 🔥. One button style (`ui/style.ts`: `.gta-btn`), sizes 44 / 56 / 64 / 84 px.
2. **Contextual buttons exist only while possible** and live in one place, the dock (`ui/dock.ts`): above Fire on a
   phone, bottom-right on desktop. On a pad, D-pad up presses the top dock button (the 'context' action); keyboard keys
   stay (T, L, X, V). Each dock button wears its key / pad glyph as a corner badge (not on touch).
3. **Everything else is in the More menu** (`ui/moreMenu.ts`): ☰ (Tab, pad View). Phone, emotes, quest journal, map,
   taxi, Pocket Kit, party, field / hunting / catch journals, mute, options, plus a "Here" row repeating the dock.
   Up to 3 pins (long-press, pad X) show as one-tap buttons beside ☰; default pins: phone, journal. Minimal layout: no pins.
4. **One prompt line** for every E interaction (app.ts already merges them), prefixed by the interact glyph.
5. **Keys: one action per key** (keys.ts, keys.test.ts). Tab is now More (it duplicated Q).
6. **Glyphs everywhere a key is named**: `{actionId}` tokens in text (`fillHint`), filled per device.
7. **Options**: Touch layout standard / minimal / left-handed; Controls list for the active device. The Save Trainer is untouched.
8. The action table `src/ui/actions.ts` is the source of truth; `src/ui/actions.test.ts` checks the matrix.

## Glyph system

- `@lawn/gamepad` (shared, additive): `padFamily(id)`, `glyphLabel(family, button)`, `glyphName`, `glyphColor`,
  `glyphSvg(family, button, size)`, `PAD_FAMILIES`, `PAD_BUTTON_NAMES`, `PAD_BUTTON_INDEX`. Families: xbox,
  playstation, switch, steam, generic. Self-drawn SVG: coloured A/B/X/Y discs, ✕ ○ □ △ shapes, LB/RB/LT/RT,
  L1/R1/L2/R2, L/R/ZL/ZR, sticks, d-pad, View/Menu/Create/Options/−/+.
- GTA adapter: `src/ui/inputSource.ts` (`currentGlyphSet()`, `onInputSourceChange()`, debounced 500 ms, sets
  `<body data-input data-pad>`), `src/ui/glyphs.ts` (`glyphText`, `glyphHtml`, `fillHint`, `fillHintHtml`,
  `controlsFor`).

## Pad layout (after)

| | On foot | Driving | Flying |
|---|---|---|---|
| A | Jump | Handbrake | |
| B | Fish (near water, rod) | Radio banger 🔥 | Radio banger 🔥 |
| X | Reload | Reload | |
| Y | Enter / use | Exit | Exit |
| LB | Next gun / hold wheel | Boost | |
| RB / RT | Fire | RB squirt, RT gas | RB fire, RT climb |
| LT | Aim | Brake | Descend |
| L3 / R3 | - / job action | Horn / job action | - / job action |
| D-pad | ↑ context, ↓ emotes, ← taxi, → binoculars | ↑ context, → radio | ↑ context, → radio |
| View / Start | More / Options | More / Options | More / Options |

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0. Foundation (planner) | stubs with final signatures, action table + matrix test, Tab = More, app.ts installs the UI layer; `tsc` passes | - |
| 1. Systems | glyphs, input source, glyph adapter, dock, More menu implemented with tests; build passes | 5 |
| 2. Wiring | every module docks / registers instead of floating its own button; input / gamepad / hud / options / text use glyphs; build + tests pass; screenshots calmer | 7 |

Epic 0 was written by the planner: `packages/gamepad/src/glyphs.ts` (stub), `src/ui/{actions,actions.test,
inputSource,glyphs,dock,moreMenu,style}.ts`, keys.ts (`weaponWheel: 'Tab'` → `more: 'Tab'`), weaponWheel.ts (Q only),
app.ts (+12 lines: imports and `installInputSource(); ensureButtonStyle(); ensureGlyphStyle(); createDock(ui);
createMoreMenu(ui);` after `const ui`).

Online: unchanged (UI only). Party slice: unchanged (no slice module is touched).

## Epic 1: Systems

~~~~text
Epic: 1 Systems / 1A Controller glyphs in @lawn/gamepad
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". packages/gamepad is shared by several games (lawn-prix, aether-board,
sample-3d, gnome-theft-auto): changes must be ADDITIVE only. Other workers edit other files at the same time. Never
commit, push, stash or switch branches. No assets: glyphs are self-drawn SVG (simple shapes and letters, no logos).

## Goal
packages/gamepad/src/glyphs.ts (today a stub with final signatures) is implemented: pad family detection and a glyph
(text, accessible name, colour, inline SVG) for every standard control in every family, with tests and a README section.

## Read first
- packages/gamepad/src/glyphs.ts: the stub. Keep every exported name, type and signature exactly.
- packages/gamepad/src/steam.ts line 43: `export const STEAM_PAD_ID = 'Steam Controller (WebHID)';`
- packages/gamepad/src/gamepad.test.ts: test style (vitest).
- packages/gamepad/README.md: add a section.

## Change
- packages/gamepad/src/glyphs.ts: fill the bodies.
  - padFamily(id): test in this order on id.toLowerCase(): steam if id === STEAM_PAD_ID or /steam|28de/;
    xbox if /xbox|xinput|045e|microsoft/; playstation if /dualsense|dualshock|playstation|054c|sony/ or the id
    starts with 'wireless controller'; switch if /nintendo|switch|pro controller|joy-con|057e/; else 'generic'.
  - glyphLabel(family, button) table:
    xbox and generic: south A, east B, west X, north Y, lb LB, rb RB, lt LT, rt RT, select View (generic: Back),
      start Menu (generic: Start), l3 LS, r3 RS, up ↑, down ↓, left ←, right →, home Home, lstick L, rstick R, dpad D-pad.
    steam: as xbox, home Steam.
    playstation: south ✕, east ○, west □, north △, lb L1, rb R1, lt L2, rt R2, select Create, start Options, l3 L3,
      r3 R3, d-pad arrows as above, home PS, lstick L, rstick R, dpad D-pad.
    switch (by POSITION, the standard mapping's south button is Switch B): south B, east A, west Y, north X, lb L,
      rb R, lt ZL, rt ZR, select −, start +, l3 LS, r3 RS, arrows, home Home, lstick L, rstick R, dpad D-pad.
  - glyphName: 'A button', 'Cross button', 'Circle button', 'Square button', 'Triangle button', 'Left bumper' /
    'L1 button' / 'L button', 'Left trigger' / 'L2 trigger' / 'ZL button', 'View button', 'Menu button',
    'Create button', 'Options button', 'Minus button', 'Plus button', 'Left stick press' (l3), 'Left stick',
    'Right stick', 'D-pad up' / 'D-pad down' / 'D-pad left' / 'D-pad right', 'D-pad', 'Home button' etc.
    Never empty.
  - glyphColor: xbox and generic face buttons: south #3fae29, east #e0362c, west #2a6fdb, north #f2b705.
    playstation face buttons (the shape colour): south #7fa6ff, east #ff6b6b, west #ff8ad8, north #3fd6a0.
    Everything else, and steam / switch: null.
  - glyphSvg(family, button, size = 22): `<svg xmlns="http://www.w3.org/2000/svg" width=size height=size
    viewBox="0 0 24 24" role="img" aria-label="${glyphName}">...</svg>`. No `id=` attributes, no `href`, no external refs.
    Face buttons: circle r=11; xbox/generic fill glyphColor with the letter in white (#fff, font-weight 800,
    font-size 13, text-anchor middle, y≈16.5); steam/switch: fill #2a2f36, white letter; playstation: fill #1d1f24
    and the shape stroked in glyphColor, stroke-width 2.2 (✕ two lines 7..17, ○ circle r=5.5, □ rect 7,7 10x10,
    △ polygon 12,6 18,17 6,17). Bumpers lb/rb: rounded rect x=1 y=6 w=22 h=12 rx=5, fill #2a2f36 stroke #fff,
    label text font-size 9. Triggers lt/rt: path with a rounded top (rect x=3 y=2 w=18 h=20 rx=8), same colours,
    font-size 9. select/start/home: rounded pill rect x=1 y=7 w=22 h=10 rx=5, font-size 6.5 (long labels like
    'Options' and 'Create' must fit: use textLength="20" lengthAdjust="spacingAndGlyphs" when label length > 4).
    lstick/rstick/l3/r3: circle r=10 fill #2a2f36 stroke #fff, inner circle r=6 stroke #fff fill none, label
    font-size 8; l3/r3 also a small down chevron under the label. D-pad: a plus shape (two rects 8x22 and 22x8 centred)
    fill #2a2f36 stroke #fff; for up/down/left/right fill that arm #fff (a third rect over the arm); dpad: no arm lit.
    Escape label text for XML (& < > ").
- packages/gamepad/src/glyphs.test.ts (new): padFamily for these ids:
  'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)' → xbox;
  'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)' → playstation;
  'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)' → playstation;
  '054c-0ce6-DualSense Wireless Controller' → playstation; 'Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)'
  → switch; STEAM_PAD_ID → steam; 'Logitech Dual Action (Vendor: 046d Product: c216)' → generic; '' → generic.
  For every family in PAD_FAMILIES x every button in PAD_BUTTON_NAMES: glyphLabel and glyphName non-empty;
  glyphSvg starts with '<svg', contains 'aria-label=', contains no ' id=' and no 'href'; glyphSvg(f, b, 30) contains
  'width="30"'. Spot checks: glyphLabel('playstation','south') === '✕', glyphLabel('switch','south') === 'B',
  glyphLabel('xbox','lt') === 'LT', glyphLabel('playstation','lt') === 'L2', glyphColor('xbox','south') === '#3fae29',
  glyphColor('switch','south') === null, PAD_BUTTON_INDEX.north === 3.
- packages/gamepad/README.md: a "## Glyphs" section: what padFamily returns, the label table in short, a usage
  example (`el.innerHTML = glyphSvg(padFamily(pad.id), 'south')`), that the SVGs are self-drawn (no logos), and that
  Switch labels are by position.

## Contract
Exported names and signatures exactly as in the stub (index.ts already re-exports them):
PadFamily, PadButtonName, PAD_FAMILIES, PAD_BUTTON_NAMES, PAD_BUTTON_INDEX, padFamily, glyphLabel, glyphName,
glyphColor, glyphSvg. Pure functions, no DOM access.

## Done when
- `npx vitest run --root packages/gamepad` passes (existing tests too).
- `npx tsc --noEmit -p packages/gamepad` passes.

## Out of scope
Every file outside packages/gamepad/src/glyphs.ts, packages/gamepad/src/glyphs.test.ts, packages/gamepad/README.md.
Do not edit index.ts, pads.ts, steam.ts, connect.ts.
~~~~

~~~~text
Epic: 1 Systems / 1B Input source tracker
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto. Other workers edit other files of this
game at the same time; some files may be mid-edit. Never commit, push, stash or switch branches.
Performance rule: nothing here may allocate or touch the DOM per frame when nothing changed.

## Goal
games/gnome-theft-auto/src/ui/inputSource.ts (today a stub with final signatures) knows which device the player used
last (touch, keyboard+mouse, or a gamepad of a given family), debounced so it does not flicker, and tells listeners.

## Read first
- games/gnome-theft-auto/src/ui/inputSource.ts: the stub. Keep every export and signature exactly.
- packages/gamepad/src/glyphs.ts: `PadFamily` and `padFamily(id)` (another worker is filling its body right now;
  call it, do not test its exact results).
- games/gnome-theft-auto/src/keys.ts: `isTyping(e)`.

## Change
- src/ui/inputSource.ts:
  - reduceSource(s, seen, now, family?): pure. If seen === s.current and (seen !== 'pad' or family is undefined or
    family === s.family): clear any pending (return a new object only if pending was set, else return s).
    Otherwise, if now - s.lastFlip >= SOURCE_DEBOUNCE_MS: flip at once: {current: seen, family: (seen === 'pad' &&
    family) ? family : s.family, lastFlip: now, pending: null, pendingFamily: null}. Otherwise remember it:
    {...s, pending: seen, pendingFamily: family ?? null} (return s itself if pending and pendingFamily are already equal).
  - settleSource(s, now): if s.pending and now - s.lastFlip >= SOURCE_DEBOUNCE_MS, flip to the pending one (as above,
    lastFlip = now); else return s.
  - Module state: `let state = initialSource(touchFirst, performance.now())` created in installInputSource(), where
    touchFirst = matchMedia('(pointer: coarse)').matches. Before install, current*() return the 'keyboard' defaults.
  - installInputSource(): idempotent. window listeners (passive where possible, capture: true so menus that stop
    propagation still count): keydown (ignore isTyping(e)) → keyboard; pointerdown: pointerType 'touch' or 'pen' →
    touch, 'mouse' → keyboard; wheel → keyboard; mousemove only when Math.abs(e.movementX) + Math.abs(e.movementY) > 6
    → keyboard. A setInterval every 250 ms calls settleSource. After every state change that changes the glyph set
    (glyphSetOf before vs after): set document.body.dataset.input = state.current, set document.body.dataset.pad =
    family when current is 'pad' else delete it, then call every listener with the new glyph set. Also apply the body
    dataset once at install.
  - notePad(id): cache the last id string and its padFamily(id) result so a repeated id does not re-run the regexes;
    then apply reduceSource(state, 'pad', performance.now(), family). Allocation-free when nothing changes
    (reduceSource returns s).
  - currentInputSource / currentPadFamily / currentGlyphSet read the state. onInputSourceChange adds to a Set and
    returns a remover.
- src/ui/inputSource.test.ts (new, vitest, no DOM: only the pure functions): flip at once when the window has
  passed; a different source inside the window stays pending and settleSource applies it once the window passes;
  a newer pending replaces an older; seeing the current source again clears pending; a pad family change while on
  the pad flips the family (debounced); glyphSetOf gives 'touch' / 'keyboard' / the family; reduceSource returns the
  same object when nothing changes.

## Contract
Signatures exactly as in the stub: InputSource, GlyphSet, SOURCE_DEBOUNCE_MS (500), SourceState, initialSource,
reduceSource, settleSource, glyphSetOf, installInputSource, notePad, currentInputSource, currentPadFamily,
currentGlyphSet, onInputSourceChange. Body attributes: data-input = 'touch' | 'keyboard' | 'pad';
data-pad = the PadFamily (only while on the pad).

## Done when
- `npx vitest run --root games/gnome-theft-auto src/ui/inputSource.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/ui/inputSource*.ts (errors in files other
  workers are editing can be ignored).

## Out of scope
Every other file. input.ts will call notePad (another issue). Do not edit app.ts.
~~~~

~~~~text
Epic: 1 Systems / 1C Glyph adapter for GTA hints
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto. Other workers fill
packages/gamepad/src/glyphs.ts and src/ui/inputSource.ts at the same time (their signatures are final; their bodies
are stubs until they finish), so tests must compare against those functions, never hard-code '✕' or 'Y'.
Never commit, push, stash or switch branches.

## Goal
games/gnome-theft-auto/src/ui/glyphs.ts (stub) turns an action from the action table into what the current device
shows, and fills `{actionId}` tokens in hint text.

## Read first
- games/gnome-theft-auto/src/ui/glyphs.ts: the stub; keep every export and signature.
- games/gnome-theft-auto/src/ui/actions.ts: ACTIONS, ActionDef (kb, pad, touchText, label, listed), actionDef(id),
  padBinding(id, mode).
- games/gnome-theft-auto/src/keys.ts: KEYS, MOVE_KEYS, keyLabel.
- packages/gamepad/src/glyphs.ts: glyphLabel, glyphName, glyphSvg, PadFamily, PadButtonName.
- games/gnome-theft-auto/src/ui/inputSource.ts: GlyphSet, currentGlyphSet().

## Change
- src/ui/glyphs.ts:
  - Defaults: set = currentGlyphSet(); mode = (document.body.dataset.mode as CameraMode) || 'foot' (guard
    `typeof document === 'undefined'` → 'foot').
  - keyName(code): 'Space' → 'Space', 'Tab' → 'Tab', 'Escape' → 'Esc', 'Enter' → 'Enter', 'ShiftLeft'/'ShiftRight'
    → 'Shift', 'Backquote' → '`', 'ArrowUp' → '↑' (and the other arrows), otherwise keyLabel(code).
  - glyphText(action, set, mode):
    touch → actionDef(action).touchText.
    keyboard → by kb: {key: k} → keyName(KEYS[k]); {move: m} → for action 'move' 'WASD', otherwise
      keyName(MOVE_KEYS[m][0]); {mouse: 'left'} 'Click', 'right' 'Right mouse', 'move' 'Mouse';
      {via: 'more'} → `${keyName(KEYS.more)} › ${label}`; {via: 'options'} → `${keyName(KEYS.options)} › ${label}`.
    pad family f → b = padBinding(action, mode): 'more' → `${glyphLabel(f, 'select')} › ${label}`; 'options' →
      `${glyphLabel(f, 'start')} › ${label}`; else glyphLabel(f, b).
  - glyphHtml(action, set, mode): touch → ''. keyboard → `<kbd class="gta-key">${esc(glyphText(...))}</kbd>`.
    pad → for a button binding `<span class="gta-glyph" title="${esc(glyphName(f,b))}">${glyphSvg(f, b, 18)}</span>`;
    for 'more' / 'options' the select / start glyph span followed by ` › ${esc(label)}`.
  - fillHint(text, set, mode): replace /\{([a-zA-Z]+)\}/g; when the name is an ActionId (in ACTIONS) use glyphText,
    else leave the token unchanged.
  - fillHintHtml(text, set, mode): escape the literal text parts; tokens → glyphHtml, except on touch → esc(touchText).
  - controlsFor(set, mode): ACTIONS where listed !== false; when mode !== 'all' keep only actions with a pad entry for
    that mode or 'any'. Row: {id, label, html: set === 'touch' ? esc(touchText) : glyphHtml(id, set, mode === 'all'
    ? (first mode key of the action's pad other than 'any', else 'foot') : mode)}.
  - ensureGlyphStyle(): once, a <style id="gta-glyph-style">:
    `.gta-key{display:inline-block;min-width:1.5em;padding:0 .35em;box-sizing:border-box;border:1.5px solid
    rgba(255,255,255,.85);border-bottom-width:3px;border-radius:5px;background:rgba(255,255,255,.14);color:#fff;
    font:800 .82em/1.35 system-ui,sans-serif;text-align:center;vertical-align:middle;text-shadow:none;}
    .gta-glyph{display:inline-flex;vertical-align:middle;line-height:0;margin:0 .1em;}
    .gta-glyph svg{width:1.35em;height:1.35em;}` (guard typeof document).
  - esc(): & < > " ' to entities.
- src/ui/glyphs.test.ts (new, vitest, node environment: pass `set` and `mode` explicitly so no document is needed):
  keyboard: glyphText('interact','keyboard') === 'E', glyphText('move','keyboard') === 'WASD',
  glyphText('fire','keyboard') === 'Click', glyphText('party','keyboard') starts with 'Tab ›'.
  pad: for every family in PAD_FAMILIES and every action, glyphText(a, f, 'foot') is non-empty, and
  glyphText('interact', f) === glyphLabel(f, 'north'); glyphText('phone', f) === `${glyphLabel(f,'select')} › Phone`.
  touch: glyphText('fire','touch') === 'Fire'; glyphHtml(any,'touch') === ''.
  tokens: fillHint('Press {interact} to talk', 'keyboard') === 'Press E to talk'; unknown '{nope}' unchanged;
  fillHintHtml('a<b {interact}', 'keyboard') contains '&lt;' and '<kbd class="gta-key">E</kbd>';
  fillHintHtml('{interact}', 'xbox') contains '<svg'. controlsFor('keyboard','all').length > 20 and every row has
  a non-empty html; controlsFor('xbox','drive') contains 'boost' and not 'aim'.

## Contract
Exports exactly as in the stub: glyphText, glyphHtml, fillHint, fillHintHtml, ControlRow, controlsFor,
ensureGlyphStyle. CSS classes .gta-key and .gta-glyph. Token syntax `{actionId}` with ActionId from ui/actions.ts.

## Done when
- `npx vitest run --root games/gnome-theft-auto src/ui/glyphs.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/ui/glyphs*.ts.

## Out of scope
Every other file, including ui/actions.ts (do not change the table; if a test needs a change there, report it).
~~~~

~~~~text
Epic: 1 Systems / 1D The dock (contextual buttons)
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto. Other workers fill src/ui/glyphs.ts,
src/ui/inputSource.ts and packages/gamepad/src/glyphs.ts at the same time (signatures final, bodies may still be
stubs). Never commit, push, stash or switch branches. Mobile rules: 44 px targets, safe-area insets, portrait and
landscape. Performance: no per-frame DOM writes; update only on events.

## Goal
games/gnome-theft-auto/src/ui/dock.ts (stub) holds all contextual buttons in one place with one style and a key /
pad glyph badge, and D-pad up presses the top one.

## Read first
- games/gnome-theft-auto/src/ui/dock.ts: the stub; keep exports and signatures.
- games/gnome-theft-auto/src/ui/style.ts: BUTTON_CSS (.gta-btn, .gta-btn--pill, [data-glyph]::after badge using
  --glyph-bg), ensureButtonStyle().
- games/gnome-theft-auto/src/ui/actions.ts: ActionId, padBinding(id, mode).
- games/gnome-theft-auto/src/ui/glyphs.ts: glyphText(action, set, mode).
- games/gnome-theft-auto/src/ui/inputSource.ts: currentGlyphSet(), onInputSourceChange(); packages/gamepad glyphColor, glyphLabel.

## Change
- src/ui/dock.ts:
  - createDock(ui): once; ensureButtonStyle(); a <style id="gta-dock-style"> and `<div id="gta-dock">` appended to ui.
    CSS:
    `#gta-dock{position:fixed;z-index:21;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;
     right:calc(env(safe-area-inset-right) + 16px);bottom:calc(env(safe-area-inset-bottom) + 16px);}
     body[data-input="touch"] #gta-dock{right:calc(env(safe-area-inset-right) + max(24px,9vw));bottom:calc(env(safe-area-inset-bottom) + max(24px,7vh) + 184px);}
     @media (max-height:500px){body[data-input="touch"] #gta-dock{flex-direction:row-reverse;align-items:flex-end;bottom:calc(env(safe-area-inset-bottom) + max(16px,4vh) + 96px);}}
     body[data-touch-layout="left-handed"][data-input="touch"] #gta-dock{right:auto;left:calc(env(safe-area-inset-left) + max(24px,9vw));align-items:flex-start;}
     body.gta-in-scene #gta-dock{display:none!important;}
     #gta-dock .gta-dock-btn{font-size:15px;}`
    Stop pointerdown propagation on the dock (so a tap does not start the touch stick or camera drag).
    Listen window 'gta:context' → pressTopDock(). Listen 'gta:mode' (fired by input.ts when the camera mode changes)
    and onInputSourceChange → repaint badges.
  - dockButton(button, action): createDock(document.getElementById('ui')!) if needed; remove inline position, left,
    right, top, bottom, transform, z-index (button.style.removeProperty); add classes 'gta-btn', 'gta-btn--pill',
    'gta-dock-btn'; append to the dock; remember {button, action}; paint its badge.
  - Badge paint (per entry, only when set or mode changed): mode = document.body.dataset.mode || 'foot'; set =
    currentGlyphSet(). touch → removeAttribute('data-glyph'). keyboard → data-glyph = glyphText(action,'keyboard'),
    --glyph-bg unset. pad family f → b = padBinding(action, mode); label = b === 'more' ? glyphLabel(f,'select') :
    glyphLabel(f, b); data-glyph = label; style.setProperty('--glyph-bg', glyphColor(f, b) ?? '#2a2f36') (for 'more'
    use '#2a2f36'). Only write when the value differs.
  - pressTopDock(): mode as above; first remembered entry in DOM order whose button is visible
    (button.style.display !== 'none' && button.offsetParent !== null) and padBinding(action, mode) === 'up' →
    button.click(); return true. Else false.
  - visibleDockActions(): the actions of visible entries, DOM order.

## Contract
Exports exactly as in the stub. Window events: listens 'gta:context' and 'gta:mode'. Element id #gta-dock; classes
gta-dock-btn. Modules keep toggling button.style.display; the dock never shows or hides a button itself.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/ui/dock.ts.
- `npx vitest run --root games/gnome-theft-auto src/ui/actions.test.ts` still passes.

## Out of scope
Every other file. Modules start calling dockButton in a later issue.
~~~~

~~~~text
Epic: 1 Systems / 1E The More menu
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto. Other workers fill src/ui/glyphs.ts,
src/ui/inputSource.ts, src/ui/dock.ts and packages/gamepad/src/glyphs.ts at the same time (signatures final).
Never commit, push, stash or switch branches. Mobile rules: 44 px targets, safe-area insets, portrait 390x844 and
landscape 844x390 must fit, no hover-only UI. Performance: build the grid only when opening; no per-frame DOM writes.

## Goal
games/gnome-theft-auto/src/ui/moreMenu.ts (stub) becomes the one hub for every non-core action: a ☰ button (Tab,
pad View) opening a grid, up to 3 pinned one-tap buttons beside ☰, full keyboard and gamepad navigation.

## Read first
- games/gnome-theft-auto/src/ui/moreMenu.ts: the stub; keep exports and signatures.
- games/gnome-theft-auto/src/ui/actions.ts: ACTIONS (inMore, icon, label), isRegistered, isAvailable, runAction,
  registerAction, onActionsChange.
- games/gnome-theft-auto/src/options.ts lines 200-252: the pattern for a panel that owns the gamepad while open
  (polls firstPad() in requestAnimationFrame, ignores buttons already held when it opened, B closes).
- games/gnome-theft-auto/src/ui/style.ts (.gta-btn classes, getTouchLayout) and src/ui/glyphs.ts (glyphText),
  src/ui/inputSource.ts (currentGlyphSet, onInputSourceChange), src/ui/dock.ts (visibleDockActions).
- games/gnome-theft-auto/src/keys.ts: KEYS.more ('Tab'), KEYS.close, KEYS.confirm, MOVE_KEYS, isTyping.

## Change
- src/ui/moreMenu.ts, createMoreMenu(ui):
  - ☰ button: `<button id="gta-more-btn" class="gta-btn gta-btn--icon" aria-label="More">☰</button>`, fixed at
    right:calc(env(safe-area-inset-right) + 10px); top:calc(env(safe-area-inset-top) + max(18px,4vw) +
    var(--gta-map,128px) + 8px); z-index:30. Its data-glyph = glyphText('more') when the glyph set is not touch
    (update in onInputSourceChange; remove the attribute on touch).
  - Pins: `<div id="gta-more-pins">` fixed at right:calc(env(safe-area-inset-right) + 158px), same top, display:flex;
    flex-direction:row-reverse; gap:8px; pointer-events:none. One `.gta-btn.gta-btn--icon` per pinned id that
    isRegistered (icon as text, aria-label = label, title = label), click → runAction(id). Stored in localStorage
    'gta-more-pins' (JSON ActionId[], wrap in try/catch), default ['phone','journal'], at most 3. Rebuilt when pins
    change and in onActionsChange. CSS: `body[data-touch-layout="minimal"] #gta-more-pins{display:none}`,
    `body.gta-in-scene #gta-more-btn, body.gta-in-scene #gta-more-pins{display:none!important}`.
  - Panel: `<div id="gta-more" role="dialog" aria-label="More">` fixed inset:0; z-index:44; display:none (flex when
    open); align/justify center; background rgba(0,0,0,.45); padding with the four safe-area insets + 16px.
    Card: width min(92vw,520px); max-height calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    overflow-y:auto; background rgba(14,16,18,.95); border 2px solid rgba(255,255,255,.6); border-radius 16px; padding 12px;
    color #fff; font 600 13px system-ui. Header row: "More" + ✕ close button (44x44). Then, when visibleDockActions()
    is non-empty, a "Here" heading and tiles for those; then the grid of ACTIONS with inMore && isRegistered(id) &&
    isAvailable(id), table order. Grid: display:grid; grid-template-columns:repeat(4,1fr) (3 columns under 360 px
    width, 6 columns when the viewport is landscape and under 500 px tall); gap 8px. Tile: a <button> min-height 72px,
    border-radius 12px, background rgba(255,255,255,.08), border 2px solid rgba(255,255,255,.2); icon (26px) above
    label (12px); under it a small hint glyphText(id) only when the glyph set is 'keyboard' and the action's kb is
    {key} (for example 'P'), or when on a pad and padBinding(id) is a button (not 'more'). Pinned tiles show '📌' in a corner.
  - Tile press: close(), then runAction(id). Long-press 500 ms (pointerdown starts a timer; pointerup, pointercancel
    or a move over 10 px cancels; if it fired, swallow the click) toggles the pin (max 3: pinning a 4th drops the oldest).
  - open(): rebuild the grid, display flex, document.body.dataset.more = 'open', if document.pointerLockElement
    document.exitPointerLock(), focus index 0, start pad polling. close(): hide, document.body.dataset.more = ''.
  - Gamepad while open (rAF loop like options.ts, using firstPad from '@lawn/gamepad'): record the buttons held at open
    as already pressed; D-pad (12-15) or left stick past 0.6 moves the focus (left/right ±1, up/down ± the column
    count, clamped); A (0) presses the focused tile; X (2) toggles its pin; B (1) or View (8) closes. Focus ring:
    outline 3px solid #7cf0ff on the focused tile only when the glyph set is not touch.
  - Keyboard: keydown on window: ignore isTyping(e) and e.repeat; KEYS.more toggles (e.preventDefault(), Tab must not
    move browser focus). While open: arrows move the focus, KEYS.confirm presses, KEYS.close closes.
  - window 'gta:more' event toggles (the gamepad's View button fires it). registerAction('more', { run: toggle }).
  - Stop pointerdown propagation on the ☰ button, the pins row and the panel (the touch stick and camera drag listen
    on window); the panel also stops touchmove propagation (passive) so it scrolls.

## Contract
Exports exactly as in the stub (MoreMenu, createMoreMenu). Element ids #gta-more-btn, #gta-more-pins, #gta-more.
body[data-more="open"] while open (input.ts blocks the pad then). Window event 'gta:more'. localStorage 'gta-more-pins'.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/ui/moreMenu.ts.
- `npx vitest run --root games/gnome-theft-auto src/ui/actions.test.ts src/keys.test.ts` passes (keys.test.ts fails
  if a module compares e.code to a literal key string: always compare against KEYS / MOVE_KEYS constants).

## Out of scope
Every other file. Modules register their actions in a later issue; with none registered the grid is just empty.
~~~~

## Epic 2: Wiring

Shared environment for every issue below (pasted into each):

~~~~text
## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Game: games/gnome-theft-auto. Six other workers edit OTHER files of this
game right now, and other teams edit net.ts, remotes.ts, src/online/, src/questSim/: never touch files outside your
list. Never commit, push, stash or switch branches; do not start a dev server or browser; do not run `vite build`.
Repo rules: touch targets >= 44 px, portrait and landscape phones, safe-area insets, no hover-only UI; no per-frame
DOM writes when nothing changed; keys come from src/keys.ts constants only (src/keys.test.ts fails on a literal
`e.code === 'KeyX'` for a key not in keys.ts or a key read by two modules for different things).
The UI layer you plug into (already in place, do not edit):
- src/ui/actions.ts: `registerAction(id, { run, available? })` — the More menu (☰, Tab, pad View) lists actions with
  inMore; the dock and More's "Here" row use dock actions. ActionIds: phone, emote, journal, map, taxi, modKit, party,
  birdJournal, huntJournal, fishJournal, mute, options, garage, lockupStore, craftShop, fish, binoculars, more, ...
- src/ui/dock.ts: `dockButton(button, actionId)` moves a contextual button into the one dock (bottom-right, above the
  touch Fire button), gives it the shared style and a key / pad glyph badge. The module keeps its click handler and
  keeps toggling `button.style.display`. D-pad up presses the top dock button.
- src/ui/glyphs.ts: `glyphText(actionId)` ('E' / 'Y' / '△' / touch words), `glyphHtml(actionId)` (kbd or svg; '' on
  touch), `fillHint(text)` / `fillHintHtml(text)` replace `{actionId}` tokens (e.g. '{interact}', '{emote}',
  '{phone}', '{switchGun}', '{modKit}', '{fish}', '{fishBait}', '{jump}', '{close}') for the device in use,
  `controlsFor(set, mode)`.
- src/ui/inputSource.ts: `currentGlyphSet()` ('touch' | 'keyboard' | 'xbox' | 'playstation' | 'switch' | 'steam' |
  'generic'), `onInputSourceChange(cb)`. <body data-input="touch|keyboard|pad">.
- src/ui/style.ts: classes `gta-btn` (44 px round), `gta-btn--md/--lg/--xl` (56/64/84), `gta-btn--icon`,
  `gta-btn--pill`, `.on`; `getTouchLayout()` / `setTouchLayout()` ('standard' | 'minimal' | 'left-handed'),
  event 'gta:touch-layout', <body data-touch-layout>.
~~~~

~~~~text
Epic: 2 Wiring / 2A Touch cluster and gamepad (input.ts, gamepad.ts)
Depends on: Epic 1

## Goal
The touch action cluster uses the shared button style, fits phone landscape without overlapping the HUD, supports the
three touch layouts, tells the UI the camera mode and pad activity, and the gamepad gets the new layout (View = More,
D-pad up = context, LB boost / B banger / L3 horn in vehicles).

## Read first
- games/gnome-theft-auto/src/input.ts (whole file, 345 lines): the touch DOM, button(), applyMode(), read().
- games/gnome-theft-auto/src/gamepad.ts (whole file): PadState, BTN, read().
- games/gnome-theft-auto/src/ui/style.ts: classes, getTouchLayout, 'gta:touch-layout'.
- games/gnome-theft-auto/src/ui/inputSource.ts: notePad(id).

## Change
- src/gamepad.ts:
  - PadState: add `id: string` (the pad's id), `boost: boolean` (held), `banger: boolean` (edge), `horn: boolean` (edge).
  - BTN: add L3: 10, R3: 11.
  - Window events: View/BACK edge → 'gta:more' (was 'gta:phone'); D-pad UP edge → 'gta:context' (was 'gta:craft-shop');
    D-pad DOWN edge → 'gta:emote-menu' and only on foot (mode 'foot'); D-pad LEFT 'gta:taxi' only on foot. Keep
    Start → 'gta:options'. `if (blocked) return null` stays before these dispatches.
  - drive: boost = !!down[BTN.LB]; banger = edge(BTN.B); horn = edge(BTN.L3). fly: banger = edge(BTN.B).
  - Include boost/banger/horn in `active`. Update the header comment table to the new layout:
    foot: A jump, B fish (near water), X reload, Y enter, LB gun / wheel, RT or RB fire, LT aim, D-pad up context,
    down emotes, left taxi, right binoculars, R3 job; drive: RT gas, LT brake, A handbrake, B banger, LB boost,
    RB squirt, L3 horn, Y exit, D-pad right radio, up context; fly: RT climb, LT descend, RB fire, B banger, Y exit;
    anywhere: View More menu, Start Options.
- src/input.ts:
  - Buttons: in button(), replace the inline look with classes: `b.className = 'gta-btn'` plus a size class from the
    size argument (56 → 'gta-btn--md', 58 / 64 / 72 → 'gta-btn--lg', 84 → 'gta-btn--xl'); keep only
    `display:none;touch-action:none;` inline. Aim lit state: toggle class 'on' instead of inline colours. Boost and
    banger keep their accent via an inline borderColor (fine). Import ensureButtonStyle from './ui/style' and call it.
  - Landscape: in a <style> element add `@media (max-height:500px){#gta-touch .gta-cluster{flex-direction:row;
    align-items:flex-end;bottom:calc(env(safe-area-inset-bottom) + max(16px,4vh));} #gta-touch .gta-cluster > div{flex-direction:row;}}`.
    Give the cluster div class 'gta-cluster' and move its inline right/bottom/position into that stylesheet
    (portrait values unchanged: right calc(env(safe-area-inset-right) + max(24px, 9vw)), bottom
    calc(env(safe-area-inset-bottom) + max(24px, 7vh))).
  - Touch layouts (getTouchLayout(), re-read on window 'gta:touch-layout'):
    'left-handed': CSS `body[data-touch-layout="left-handed"] #gta-touch .gta-cluster{left:calc(env(safe-area-inset-left)
    + max(24px,9vw));right:auto;align-items:flex-start;}` and the stick zone flips: a touch with
    clientX > innerWidth * (1 - LEFT_ZONE) starts the stick, the rest look.
    'minimal': `body[data-touch-layout="minimal"] #gta-touch .gta-btn{transform:scale(.9)}` and the Reload button is
    hidden on foot (guns reload themselves when empty; reload stays on R / pad X).
  - applyMode(mode): also set `document.body.dataset.mode = mode` and `window.dispatchEvent(new Event('gta:mode'))`.
  - read(): block the pad also while `document.body.dataset.more === 'open'`; when p?.active call notePad(p.id)
    (import from './ui/inputSource'); boost = shownMode === 'drive' && (keyboard || touch || !!p?.boost);
    banger = s.banger || !!p?.banger; horn = s.horn || !!p?.horn.
  - The action button (enterBtn) keeps its label behaviour.

## Contract
Window events fired: 'gta:more', 'gta:context', 'gta:emote-menu', 'gta:taxi', 'gta:options', 'gta:mode'.
<body data-mode="foot|drive|fly|chute">. Input interface (types.ts) unchanged. Do not edit types.ts or keys.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/input.ts or src/gamepad.ts.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/ui` passes.

## Out of scope
Every other file (hud.ts, options.ts, emoteMenu.ts, craftShop.ts belong to other workers).
~~~~

~~~~text
Epic: 2 Wiring / 2B HUD: glyph prompt, help, quest text, vehicle hints (hud.ts)
Depends on: Epic 1

## Goal
The HUD shows the interact glyph of the device in use in front of the prompt, fills `{actionId}` tokens in quest
lines, toasts and help text, shows a short controls strip when the player first enters a vehicle or aircraft
(keyboard / pad only), registers the 'map' action, and its landscape prompt no longer collides with the touch cluster.

## Read first
- games/gnome-theft-auto/src/hud.ts: CSS (lines 14-128), HELP_DESKTOP / HELP_TOUCH (~line 272), the help element
  (~804), the bottom area and promptEl (~822-831), bigHint (~839), setBig (~990), set() prompt update (~1207),
  toast (~1266), setObjective (~1275), richNodes(text) (turns {{Name}} into gold spans).
- games/gnome-theft-auto/src/ui/glyphs.ts: glyphText, glyphHtml, fillHint, controlsFor.
- games/gnome-theft-auto/src/ui/inputSource.ts: currentGlyphSet, onInputSourceChange.

## Change (src/hud.ts only)
- Prompt: replace `(fine ? 'E: ' : '') + s.prompt` with two child spans of promptEl: a glyph span (innerHTML =
  glyphHtml('interact') + ' ', empty on touch) and a text span (textContent = s.prompt). Repaint the glyph span only
  in onInputSourceChange and once at creation; the text span only when s.prompt changes.
- Help line: build it from controlsFor(currentGlyphSet(), 'foot'), first 8 rows, as `${html} ${label}` items joined
  with ' · ' via innerHTML (labels are plain ASCII from the action table; escape them anyway). On touch keep
  HELP_TOUCH text. Remove HELP_DESKTOP. Keep the 8 s auto-remove.
- bigHint: `Click, tap, ${glyphText('map')} or ${glyphText('close')} to close`; refresh in onInputSourceChange.
- toast(text): pass fillHint(text) to richNodes. setObjective: fillHint(line) before richNodes for every line.
- Vehicle hint strip: a `.gta-pill.gta-vhint` element in the bottom area, hidden by default. In set(), derive
  mode = s.altitude !== null ? 'fly' : s.vehicle !== null ? 'drive' : 'foot' and compare with the last one. On
  entering 'drive' or 'fly', if currentGlyphSet() !== 'touch' and that mode was shown fewer than 2 times this
  session, fill it with controlsFor(set, mode) rows whose id is in ['move','fire','boost','handbrake','horn',
  'banger','radio','climb','descend','interact'] and whose html is non-empty, as `${html} ${label}` items; show
  it 6 s (setTimeout), then hide. No work in other frames.
- registerAction('map', { run: () => setBig(!bigOpen) }) after setBig exists (import from './ui/actions').
- CSS: `#gta-hud .gta-vhint{font-size:12px;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;
  max-width:min(92vw,640px);}` and inside the existing `@media (max-height:500px)` block change `.gta-bottom` to
  `bottom:calc(var(--sab) + 104px);left:22%;right:22%;` (the touch cluster becomes one row there).

## Contract
HudState and the Hud interface (types.ts) unchanged. Do not edit types.ts or app.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/hud.ts.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/ui src/mapIcons.test.ts` passes.

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 2 Wiring / 2C Emotes, weapon wheel, Pocket Kit (anim/emoteMenu.ts, weaponWheel.ts, gunModKit.ts)
Depends on: Epic 1

## Goal
The floating 😀 button is gone (emotes are in the More menu, G, pad D-pad down); a bug is fixed where the event that
plays an emote ('gta:emote' with an anim id as detail, used by park benches) also toggled the menu; the wheel and kit
hints use glyphs.

## Read first
- games/gnome-theft-auto/src/anim/emoteMenu.ts: the 😀 button (~line 108-121), toggle(), the 'gta:emote' listener
  (~283), any hint text and the pad handling.
- games/gnome-theft-auto/src/weaponWheel.ts: text shown in the wheel (search 'textContent').
- games/gnome-theft-auto/src/gunModKit.ts: createGunModKit's returned open / close / isOpen and the K key handler (~94).

## Change
- anim/emoteMenu.ts: delete the 😀 button element, its `.gta-emote-btn` CSS (keep the panel rule) and the code that
  shows / hides it. Toggle listener: window 'gta:emote-menu' (was 'gta:emote'; app.ts keeps using 'gta:emote' with
  a detail to PLAY an emote, so the menu must not listen to it any more). registerAction('emote', { run: () =>
  toggle() }) (import from '../ui/actions'). Hint text naming keys or pad buttons → fillHint tokens ({close},
  {confirm}) from '../ui/glyphs'. Update the header comment ("☰ More › Emotes, G, D-pad down").
- weaponWheel.ts: visible hint text that names keys / buttons → fillHint tokens ({switchGun}, {modKit}, {close}).
  If there is none, add a small footer line in the wheel, set when the wheel opens:
  fillHint('Release {switchGun} to equip · {modKit} Pocket Kit'), hidden when currentGlyphSet() === 'touch'.
- gunModKit.ts: registerAction('modKit', { run: () => same as the K key handler does }).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these three files.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/weaponWheel.test.ts src/anim src/gunModKit.test.ts` passes.
- No `addEventListener('gta:emote'` remains in anim/emoteMenu.ts.

## Out of scope
app.ts, gamepad.ts (another worker makes D-pad down fire 'gta:emote-menu'), every other file.
~~~~

~~~~text
Epic: 2 Wiring / 2D Phone, taxi, quest journal, party (phone/phone.ts, taxi.ts, quests/journal.ts, party/panel.ts)
Depends on: Epic 1

## Goal
Floating buttons leave the base screen: 📱 phone, 🚕 taxi and 📜 journal move into the More menu (phone and journal
are its default one-tap pins beside ☰), and 👥 party shows only while it has something to say.

## Read first
- games/gnome-theft-auto/src/phone/phone.ts: #gta-phone-btn CSS (~35-37) and element (~61-68), toggle, the panel's
  top offset (BUTTON_TOP + 52px), btn.classList uses (~174, ~190).
- games/gnome-theft-auto/src/taxi.ts: #gta-taxi-btn CSS (~208) and element (~241-266), toggle.
- games/gnome-theft-auto/src/quests/journal.ts: #gta-journal-btn CSS (~12) and element (~49-56, 238-241), the KeyJ
  handler (~251), where objective / step text is rendered.
- games/gnome-theft-auto/src/party/panel.ts: .gta-party-btn CSS (~44-62), btn and badge (~98-111), how the panel
  opens and when the badge shows.

## Change
- phone/phone.ts: remove the #gta-phone-btn element, its CSS rules and the btn.classList uses. Keep the panel where
  it was. registerAction('phone', { run: toggle }) (import from '../ui/actions'). Hint text naming keys → fillHint tokens.
- taxi.ts: remove #gta-taxi-btn, its CSS and the btn?.classList call; registerAction('taxi', { run: toggle }).
- quests/journal.ts: remove #gta-journal-btn and its CSS; registerAction('journal', { run: toggle });
  `e.code === 'KeyJ'` → `e.code === KEYS.journal` (import KEYS from '../keys'); wrap the objective / step text it
  renders in fillHint (from '../ui/glyphs').
- party/panel.ts: keep the 👥 button but show it only while the player is in a party or the badge shows something
  (use the existing state; display:none otherwise); registerAction('party', { run: <what a click on btn does> }).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these four files.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/ui src/quests src/taxi.test.ts` passes.

## Out of scope
app.ts and every other file. Do not change the phone's apps or the taxi's logic.
~~~~

~~~~text
Epic: 2 Wiring / 2E Birding, hunting, fishing HUD buttons (birding/scopeUi.ts, hunting/huntHud.ts, fishing/fishHud.ts, fishing/fishing.ts)
Depends on: Epic 1

## Goal
The field journal 📗, hunting journal 📓 and catch journal move into the More menu; the binoculars 🔭 and the 🎣
rod toggle become dock buttons (on screen only while usable); fishing help text uses glyphs.

## Read first
- games/gnome-theft-auto/src/birding/scopeUi.ts: the HUD row (~108-160: row, rowButtons, scopeBtn, journalBtn, pill),
  the row show/hide (~305-320), handlers.onJournal / onScopeDown, the scope help line (~265).
- games/gnome-theft-auto/src/hunting/huntHud.ts: journalBtn (~47-71), onJournal.
- games/gnome-theft-auto/src/fishing/fishHud.ts: makeButton (~69), toggleBtn + toggleKeyTag (~109-119), journalBtn
  (~121-126), helpLine (~196-200), update() toggleOn / journalOn (~284-295).
- games/gnome-theft-auto/src/fishing/fishing.ts: the toast at ~170 ('Press X (pad B, or the fishing button)').

## Change
- birding/scopeUi.ts: dockButton(scopeBtn, 'binoculars') (from '../ui/dock') right after it is created (it leaves
  the row; its pointer handlers stay). It must be visible exactly when the row would be (hudVisible && !viewing):
  set scopeBtn.style.display ('' or 'none') where the row display is set, only when it changes. Remove journalBtn
  from the row; registerAction('birdJournal', { run: () => handlers.onJournal() }). Scope help line →
  fillHint('{look} look · wheel zoom · {fire} snap · {binoculars} lower'), filled when the scope opens.
- hunting/huntHud.ts: remove journalBtn from the row; registerAction('huntJournal', { run: onJournal }).
- fishing/fishHud.ts: dockButton(toggleBtn, 'fish'); delete toggleKeyTag (the dock badge replaces it); strip the
  toggle's inline position and size (keep its font-size). Remove journalBtn and its show / hide;
  registerAction('fishJournal', { run: onJournal }). helpLine text → fillHint('Hold {jump} to cast & reel ·
  {fishBait} bait · {fish} put away'), re-filled each time fishing starts. Remove now-unused imports.
- fishing/fishing.ts: that toast → `Bought: ${name}. Use {fish} by the water to fish.` (the HUD toast fills tokens).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these files.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/ui src/fishing src/hunting src/birding` passes.

## Out of scope
Every other file (birding.ts, hunting.ts, fishInput.ts unchanged).
~~~~

~~~~text
Epic: 2 Wiring / 2F Garage, Lock-Up, Slipway, job buttons (garages.ts, lockup/runtime.ts, craft/craftShop.ts, jobs/hud.ts)
Depends on: Epic 1

## Goal
The contextual shop buttons (🔧 Handling, 🎨 Pay 'n' Glaze, 🔒 Store, 🛠 Slipway) all live in the dock with one style
and a glyph badge, reachable on a pad with D-pad up and from the More menu's "Here" row; the job action button shows
its key / pad glyph.

## Read first
- games/gnome-theft-auto/src/garages.ts: .gta-tune-fab CSS (~50-66), fab + glazeFab (~159-184), show logic (~445-456).
- games/gnome-theft-auto/src/lockup/runtime.ts: FAB_CSS (~98-110), fab (~420-450), tryStore.
- games/gnome-theft-auto/src/craft/craftShop.ts: .gta-craft-fab CSS (~47-52), fab (~98-103), toggle (~278).
- games/gnome-theft-auto/src/jobs/hud.ts: the action button (~88-121, ~207-215) and its CSS.

## Change
- garages.ts: right after creating fab and glazeFab: dockButton(fab, 'garage'); dockButton(glazeFab, 'garage')
  (import from './ui/dock'; do not append them to root any more). Delete the .gta-tune-fab position / size / transform
  CSS. registerAction('garage', { run: () => (fab visible ? fab.click() : glazeFab.click()), available: () => fab or
  glazeFab has style.display !== 'none' }).
- lockup/runtime.ts: dockButton(fab, 'lockupStore') instead of deps.ui.appendChild(fab); remove `position:fixed` and
  offsets from FAB_CSS (keep the gold accent); registerAction('lockupStore', { run: tryStore, available: () =>
  fab.style.display !== 'none' }).
- craft/craftShop.ts: dockButton(fab, 'craftShop'); drop its position CSS; registerAction('craftShop', { run: toggle,
  available: () => fab.style.display !== 'none' }). Keep the 'gta:craft-shop' listener.
- jobs/hud.ts: the action button stays inside the job widget with its own style. Add a glyph badge: set
  `action.dataset.glyph = glyphText('jobAction')` when currentGlyphSet() !== 'touch', remove it on touch; do it at
  creation and in onInputSourceChange. CSS: `.gta-jh-action{position:relative}` and
  `.gta-jh-action[data-glyph]::after{content:attr(data-glyph);position:absolute;left:-6px;top:-6px;min-width:20px;
  height:20px;padding:0 4px;box-sizing:border-box;border-radius:10px;background:#2a2f36;color:#fff;border:1.5px solid
  rgba(255,255,255,.85);font:800 11px/17px system-ui,sans-serif;text-align:center;pointer-events:none;}`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these files.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/ui src/jobs src/lockup src/craft` passes.

## Out of scope
Every other file. The shop sheets' contents are unchanged.
~~~~

~~~~text
Epic: 2 Wiring / 2G Options: no gear, touch layout, controls list, mute (options.ts, sound/volumeUi.ts)
Depends on: Epic 1

## Goal
Options has no floating gear (it opens from the More menu, O, pad Start); it gains a Touch layout picker (standard /
minimal / left-handed) and a Controls list for the device in use; mute is reachable from the More menu.

## Read first
- games/gnome-theft-auto/src/options.ts (whole file, 255 lines).
- games/gnome-theft-auto/src/sound/volumeUi.ts: the mute button (~75-90).
- games/gnome-theft-auto/src/audio.ts: setMuted(m), isGameMuted() (do not edit audio.ts).
- games/gnome-theft-auto/src/ui/style.ts and src/ui/glyphs.ts (controlsFor, ControlRow).

## Change
- options.ts:
  - Remove the gear button, its .gta-opt-gear CSS and its click listener. The root keeps its position; the panel
    opens in the same place. registerAction('options', { run: toggle }) (from './ui/actions').
  - A "Touch layout" group right after the Controls heading: three .gta-opt-mode buttons: Standard ('Every button');
    Minimal ('Fewer buttons, no pinned shortcuts'); Left-handed ('Stick on the right, buttons on the left'). The
    current one (getTouchLayout()) gets the gold border like the other groups; click → setTouchLayout(id) and repaint.
    Add them to the `buttons` map so the pad can focus them (make sure mark() does not clear their gold border:
    paint them in their own function after mark()).
  - A controls list after it: a <div class="gta-opt-controls"> (display:grid;grid-template-columns:1fr auto;gap:4px 10px;
    font-size:12px) with one row per controlsFor(currentGlyphSet(), 'all') entry: label then html (innerHTML).
    Rebuilt when the panel opens and in onInputSourceChange while open. A small heading above it: 'Your controls
    (keyboard)' / '(touch)' / '(gamepad)'.
  - Delete the 'Handbrake: Space, A on a pad, or the Handbrake button on touch.' hint.
  - Trainer button text: 'Export, import or reset your save; edit the character, spawn things, play cutscenes.'
    plus ' F9 or ` too.' only when currentGlyphSet() === 'keyboard' at build time.
- sound/volumeUi.ts: registerAction('mute', { run: () => muteBtn.click() }) (or setMuted(!isGameMuted()) plus the
  repaint). Replace the `Keyboard: ${keyLabel(KEYS.mute)}` wording with fillHint('... {mute} ...') wording that reads
  on every device (e.g. 'Everything, the radio too ({mute}).').

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these files.
- `npx vitest run --root games/gnome-theft-auto src/keys.test.ts src/ui` passes.

## Out of scope
Every other file. Do not touch src/trainer/ or the mountSteamConnect slot (createOptions still returns `extras`).
~~~~

~~~~text
Epic: 2 Wiring / 2H Tutorial and comms text tokens (quests/newcomerQuests.ts, quests/commsNewcomers.ts, briefing/briefing.ts, tubing/runtime.ts, handling.ts)
Depends on: Epic 1

## Goal
Tutorial, comms and toast text that names keys or buttons uses `{actionId}` tokens so it reads right on every device,
and the comms panel fills them.

## Read first
- games/gnome-theft-auto/src/quests/newcomerQuests.ts: lines ~60-110.
- games/gnome-theft-auto/src/quests/commsNewcomers.ts: lines ~15-30.
- games/gnome-theft-auto/src/briefing/briefing.ts: where a line's text is shown (~line 222 `text = line.text`).
- games/gnome-theft-auto/src/tubing/runtime.ts ~347 toast; games/gnome-theft-auto/src/handling.ts ~34 'Hold Space'.

## Change
- newcomerQuests.ts / commsNewcomers.ts: rewrite only the key mentions, keeping each speaker's voice:
  'Smiley button or G, sugar. Pick anything. Make it loud.' → 'Emote menu, sugar: {emote}. Pick anything. Make it loud.';
  "Smiley button, or G. Strike something..." → "Emote menu, {emote}. Strike something..."; objective 'Open the emote
  menu (😀 button or G) and play any emote' → 'Open the emote menu ({emote}) and play any emote'; 'Hold Q! Or Tab! Or
  the Guns button! The wheel! Go on!' → 'Hold {switchGun}! The wheel! Go on!'; "Hold Q, or Tab, or tap Guns! That's
  the wheel! Pick one!" → "Hold {switchGun}! That's the wheel! Pick one!"; 'Open the weapon wheel (hold Q / Tab / LB,
  or tap Guns)' → 'Open the weapon wheel (hold {switchGun})'; 'Tap the 🔧 in the wheel (or press K) to open the
  Pocket Kit' → 'Open the Pocket Kit (the 🔧 in the wheel, or {modKit})'; 'Open the phone (📱 or P), Lock-Up, and
  call the Sling-Lift' → 'Open the phone ({phone}), Lock-Up, and call the Sling-Lift'. Do not change probe ids,
  hints or structure. Any other key mention in these two files: same treatment.
- briefing/briefing.ts: show fillHint(line.text) instead of line.text (import from '../ui/glyphs').
- tubing/runtime.ts toast → 'Hooked on! Lean with {move}, hop with {jump}.' (the HUD toast fills tokens).
- handling.ts: blurb 'Loose rear, keeps the slide going. Hold Space.' → 'Loose rear, keeps the slide going. Hold the handbrake.'.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these files.
- `npx vitest run --root games/gnome-theft-auto src/quests src/keys.test.ts src/handling.test.ts` passes.

## Out of scope
Every other file, including quests/journal.ts and hud.ts (other workers fill tokens there) and src/questSim/.
~~~~

## Result

Base screen, on foot at the Turfton spawn (`?offline&no-intro`), visible buttons:

| Device | Before | After |
|---|---|---|
| Touch portrait / landscape | 12 | 9 (Jump, Guns, Reload, Aim, Fire, ☰, 2 pins, 🔭 dock) |
| Desktop / gamepad | 7 | 4 (☰, 2 pins, 🔭 dock) |

Keys: 31 → 31 bindings, one action each (Tab now opens More instead of duplicating Q). Pad: View = More, D-pad up =
the top dock button, and new vehicle bindings (LB boost, B radio banger, L3 horn). Fixed: 'gta:emote' no longer both
plays and toggles (the menu listens to 'gta:emote-menu').

Checked: tsc clean; targeted tests (src/ui, keys, lockup runtime, weapon wheel) and `npm test -w packages/gamepad`
pass; screenshots at 390x844, 844x390, 1280x720 and with stubbed Xbox / DualSense pads (More open shows the View /
Create badge and pad hints) had no page errors. Not checked: a real phone or pad; the vehicle hint strip and the
prompt glyph were not captured in a screenshot.

Left: shop sheets' footers have no glyph hints (B / Esc close them, ✕ on screen); app.ts still names
`#gta-journal-btn` / `#gta-taxi-btn` in a cutscene-hide rule (dead, harmless); 'minimal' layout only drops pins and
Reload and scales buttons.
