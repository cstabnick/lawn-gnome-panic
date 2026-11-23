Epic: 1 Modules
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (TypeScript, DOM UI).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your files.
Repo rules: UI modules append their own container to the shared `ui` element and never restyle or hide `ui` itself.
Mobile: every button at least 44 x 44 px, no hover-only UI, safe-area insets. Gamepad support required (below).
Prefab rule for icons: the phone button shows the 'tin-can-phone' prefab icon via
`prefabIconElement('tin-can-phone', '📱', 24)` from '@lawn/prefabs' (it returns an HTMLElement: an <img> or the emoji
fallback).

## Goal
Fill `games/gnome-theft-auto/src/phone/phone.ts`: the in-game phone. A round 44 px button in the top-right button row,
the P key, and the pad's Back/View button (gamepad.ts already fires a window event 'gta:phone') open a small menu of
apps; other modules register apps with `addApp`.

## Read first
- games/gnome-theft-auto/src/phone/phone.ts: the stub; `PhoneApp`, `PhoneDeps`, `Phone` are the contract (keep them).
- games/gnome-theft-auto/src/taxi.ts lines 181-182 and 210-221: the taxi's round corner button (#gta-taxi-btn CSS:
  right 210px in the row under the minimap; pointerdown stopPropagation; click toggles).
- games/gnome-theft-auto/src/options.ts lines 297-340: gamepad polling while a panel is open (`firstPad()` from
  '@lawn/gamepad'; D-pad 12/13 or stick axis 1 moves focus, button 0 (A) clicks, 1 (B) closes; seed previous buttons at
  open; `document.body.dataset.options = open ? 'open' : ''` makes the game's pad reader stand down).
- games/gnome-theft-auto/src/keys.ts: `KEYS.phone` ('KeyP'), `KEYS.close` ('Escape'), `isTyping(e)`.
- games/gnome-theft-auto/src/app.ts lines 204-212: in a cutscene `body.gta-in-scene` hides the corner buttons with a
  CSS rule; add `body.gta-in-scene #gta-phone-btn{display:none!important}` to YOUR OWN style element instead (do not edit app.ts).

## Change
- games/gnome-theft-auto/src/phone/phone.ts: implement `createPhone(ui, deps)`.
  - Style element + `button#gta-phone-btn` appended to `ui`: same look as #gta-taxi-btn but
    `right:calc(env(safe-area-inset-right) + 262px)` and the same `top` expression as the taxi button; aria-label and
    title 'Phone (P)'; content = `prefabIconElement('tin-can-phone', '📱', 24)`. pointerdown stopPropagation; click toggles.
  - Panel `div#gta-phone` appended to `ui`: fixed, right-aligned under the button row on wide screens
    (`right:calc(env(safe-area-inset-right) + 10px)`, `top` = the button's top + 52px, width min(300px, calc(100vw - 24px)),
    max-height 70vh, overflow-y auto), dark rounded "handset" look (#14181c, border 2px rgba(255,255,255,.25),
    radius 18px), z-index 36, pointer-events auto, display none until open. Header 'Phone' and a ✕ close button.
    One row-button per app: icon (emoji), label (bold), and `detail?.()` in small text under it; min-height 52px, full width.
    pointerdown and touchmove stopPropagation on the panel.
  - `addApp(app)`: append to the list (replace an app with the same id); re-render if open.
  - `open()`: `const why = deps.blocked()`; if why, `deps.toast(why)` and return. Render (detail() is re-read now), show,
    exitPointerLock, set body.dataset.options = 'open', start pad polling, focus index 0.
  - Clicking an app: `close()` first, then `app.run()`.
  - `close()`: hide, stop polling, body.dataset.options = ''. `toggle()`, `isOpen()`.
  - Keyboard: window keydown: `e.code === KEYS.phone && !e.repeat && !isTyping(e)` toggles; `e.code === KEYS.close`
    while open closes it and calls `e.stopImmediatePropagation()`.
  - Gamepad: `window.addEventListener('gta:phone', toggle)`. While open, poll like options.ts: D-pad up/down or the
    stick moves the focus (outline 3px solid #7cf0ff on the focused row only when firstPad() is non-null), A clicks it,
    B (1) or Back (8) closes.
  - Export nothing new beyond the stub's exports.

## Contract
`PhoneApp`, `PhoneDeps`, `Phone`, `createPhone(ui: HTMLElement, deps: PhoneDeps): Phone` unchanged from the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/phone/phone.ts.
- `cd games/gnome-theft-auto && npx vitest run src/keys.test.ts` passes (it checks no module hard-codes a key code
  outside keys.ts: use KEYS.phone / KEYS.close, never the string 'KeyP').

## Out of scope
Every other file (keys.ts, gamepad.ts, app.ts, taxi.ts are read-only for you).
