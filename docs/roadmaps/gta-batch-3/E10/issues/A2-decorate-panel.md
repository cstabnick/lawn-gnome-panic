Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
A touch-first "Decorate" panel for the player's flat: a top-down floor plan where pieces are tapped, dragged and
rotated; a storage strip to place owned pieces; a furniture shop that sells pieces for Acorns into storage; wall and
floor colours. Works inside the flat (the 3D room moves live) and from anywhere through the tablet (plan only).

## Read first
- `games/gnome-theft-auto/src/home/types.ts`: `FURNITURE_SHOP`, `FurnitureStock`, `WALL_COLOURS`, `FLOOR_COLOURS`,
  `FLAT_ROOM` (room 12 x 10 m centred on 0,0; door on the south wall at (0, 4.8)), `FLAT_ID`.
- `games/gnome-theft-auto/src/home/layout.ts`: every edit function (`placeFromStore`, `movePiece`, `rotatePiece`,
  `storePiece`, `addStored`, `setColours`, `clampPose`, `fits`, `halfSize`, `storedList`, `commitLayout`, `loadLayout`,
  `pieceObject`, `stockOf`).
- `games/gnome-theft-auto/src/interiors/runtime.ts`: `currentInterior()`, `refreshInterior()`.
- `games/gnome-theft-auto/src/ledger.ts`: an existing modal panel in this game (style, DOM helpers, how it is appended
  to `#ui`, how it closes). Match its look (dark card, rounded, system font).
- `packages/prefabs/src/icon.ts` (skim): `prefabIconElement(id: string | undefined, fallbackEmoji: string, px = 24)`
  gives a small icon element for a prefab (import from `@lawn/prefabs`; fallback emoji '🪑').

## Change
- New `games/gnome-theft-auto/src/home/decorUi.ts`:
  ```ts
  import type { Economy } from '../economy';
  export type DecorTab = 'room' | 'shop' | 'colours';
  export interface DecorDeps {
    ui: HTMLElement;
    economy: Pick<Economy, 'spend' | 'state'>;
    toast(text: string): void;
  }
  export interface DecorPanel { open(tab?: DecorTab): void; close(): void; isOpen(): boolean }
  export function createDecorPanel(deps: DecorDeps): DecorPanel;
  ```
  - One root `div.gta-decor` appended to `deps.ui` once (hidden until open), with its own `<style>` (class-prefixed
    `gta-decor-`). Layout: a full-width bottom sheet on phones (max-height 62vh, so the 3D room stays visible above),
    a right-side card (min(420px, 40vw)) when the window is wider than tall. `padding-bottom: env(safe-area-inset-bottom)`.
    z-index above the HUD (look at ledger.ts for the value it uses). `pointer-events: auto` on the panel only.
  - Header: title "Flat 3B", the Acorn count (`economy.state().acorns`), tab buttons Room / Shop / Colours, a Close (✕)
    button. All buttons at least 44 x 44 px.
  - **Room tab**: a `<canvas>` floor plan of the 12 x 10 m room (keep the 6:5 aspect, scale to the panel width, draw
    with devicePixelRatio). Draw: floor (floor colour), walls (wall colour, thick border), the door gap on the south
    wall, the no-furniture door square (hatched), and each `loadLayout().items` piece as its footprint rectangle
    (`halfSize(prefab, yaw)`) with a short label (first word of the stock name) and a front tick on the side it faces;
    the selected piece outlined in orange. Wall pieces (stock.wall) draw as thin bars on their wall; rugs (stock.flat)
    under everything, semi-transparent.
    - Pointer events (`pointerdown` / `pointermove` / `pointerup`, `setPointerCapture`; `touch-action: none` on the
      canvas): tap selects the piece under the finger (topmost; rugs last); dragging a selected piece moves a ghost:
      compute the room point under the finger, `clampPose(prefab, x, z, yaw)`, colour the ghost green when
      `fits(layout, prefab, p.x, p.z, p.yaw, uid)` else red, and while inside the flat (`currentInterior() === FLAT_ID`)
      also move the live 3D object: `const o = pieceObject(uid); if (o) { o.position.x = p.x; o.position.z = p.z }`.
      On release: `movePiece(layout, uid, x, z)`; if it changed, `commitLayout(layout)` and, inside the flat,
      `refreshInterior()` (rebuilds meshes and colliders); if it did not fit, put the live object back where the
      piece is and toast "No room there."
    - Buttons under the plan for the selected piece (disabled when none): Rotate ⟳ (`rotatePiece`), nudge ◀ ▲ ▼ ▶
      (one grid step, `FLAT_ROOM.grid`, through `movePiece`), Store (`storePiece`). Each successful change:
      `commitLayout` + `refreshInterior()` when inside. Keyboard while open: arrows nudge, R rotates, Delete stores,
      Escape closes (only while the panel is open; `stopPropagation` so the game does not also act).
    - Storage strip: `storedList(layout)` as tappable tiles (prefab icon, name, ×count). Tapping one calls
      `placeFromStore(layout, prefab, 0, 0, 0)`; on success select the new piece, `commitLayout`, `refreshInterior()`
      when inside; on null toast "No free floor for that. Store something first."
    - Empty states: "Nothing in storage. Buy furniture in the Shop tab."
  - **Shop tab**: a scrolling list of `FURNITURE_SHOP` rows: icon, name, price "🌰 120", how many you own (placed +
    stored), a Buy button (disabled when `economy.state().acorns < price`). Buy: `economy.spend(price, 'Furniture')`;
    on true `addStored(layout, prefab, 1)`, `commitLayout(layout)`, toast "<name> delivered to your storage." and redraw.
    A line at the top in the game's voice: "Gnome & Garden Furnishings. Delivery to Saucer Court, stairs extra (free)."
  - **Colours tab**: two rows of swatches (44 px circles) for `WALL_COLOURS` and `FLOOR_COLOURS` with names; the current
    one ringed. Tap: `setColours(layout, wallId)` / `setColours(layout, undefined, floorId)`, `commitLayout`,
    `refreshInterior()` when inside. Free.
  - When opened outside the flat, show a small line at the top of the Room tab: "Arranging from afar: you will see it
    next time you are home."
  - Redraw on `onHomeChange` while open; unsubscribe on close. `open()` re-reads `loadLayout()`.
  - While open, add `data-decor="open"` to `document.body` (remove on close) so the game can ignore taps meant for the panel.
- New `games/gnome-theft-auto/src/home/decorUi.test.ts`: with the repo's fake DOM (`installFakeDom` from
  `src/testing/fakeDom` — read it; if canvas `getContext` returns null there, the draw code must tolerate that), create
  the panel with a stub economy (`{ state: () => ({ acorns: 500 }), spend: (n) => true }` cast as needed), open the shop
  tab, click the first Buy button, and assert `loadLayout().stored.bed === 1` (call `resetLayoutCache()` and
  `loadLayout(undefined)` first so no storage is used). Keep the test small.

## Contract
`createDecorPanel(deps): DecorPanel` exactly as above; home/runtime.ts (another worker) calls `panel.open()`,
`panel.open('shop')` and `panel.open('colours')`.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/home/decorUi.test.ts` passes.
- The panel is usable at 390x844 (all targets >= 44 px, the plan at least 300 px wide) and 844x390.

## Out of scope
home/layout.ts, home/types.ts, interiors/*, ledger.ts (read only), app.ts (the lead wires the panel in).
