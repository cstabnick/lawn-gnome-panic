Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first.

## Goal
`createGunShop(ui, hud, deps)` in `games/gnome-theft-auto/src/gunShop.ts` is the Ammu-Gnation shop sheet: weapon tabs, one row of mod cards
per slot, a stats readout that compares stock and the draft, test fire, Reset, and Buy & Fit. It looks and lays out like the Pay 'n' Glaze
sheet (bottom sheet in portrait, side panel in landscape) because it reuses that sheet's CSS and widgets.

## Read first
- `games/gnome-theft-auto/src/gunShop.ts`: the stub. Keep `GunFit`, `GunShopDeps`, `GunShop` and the `createGunShop` signature exactly.
- `games/gnome-theft-auto/src/glazeShop.ts`: the whole file (286 lines). Copy its structure: frame / head / tabs / body / foot, the Escape
  handler, `pointerdown`/`touchmove` stopPropagation, `document.exitPointerLock()` on open, the price line, the Buy flow.
- `games/gnome-theft-auto/src/glazeUi.ts` lines 1-100 and 225-260: `optionGrid({ items, value, onPick, thumb })`, `sectionLabel`, and the
  comment above `GLAZE_CSS` (the class names). All its CSS selectors start with `#gta-glaze`.
- `games/gnome-theft-auto/src/gunMods.ts`: the catalogue and helpers.
- `games/gnome-theft-auto/src/gunModStore.ts`: `ownedMods`, `fittedLoadout`, `buyMods`, `fitLoadout`.

## Change
- `games/gnome-theft-auto/src/gunShop.ts`:
  - Style: inject once a `<style id="gta-ammu-style">` with `GLAZE_CSS.split('#gta-glaze').join('#gta-ammu')` plus a few overrides under
    `#gta-ammu`: active tab and buy button in safety orange `#ff7a1a` with dark text, the title in orange, and `.am-stats` (a two-column grid
    of small rows, 12 px text, ▲ green `#7be08a`, ▼ red `#ff7a7a`). Root `div#gta-ammu` appended to `ui`.
  - Head: title "Ammu-Gnation", slogan `BRANDS['ammu-gnation'].slogan` (import `BRANDS` from './brands'), a ✕ close button (aria-label
    "Close Ammu-Gnation").
  - Tabs (`.gz-tabs`): one `.gz-tab` button per weapon in `GUN_ORDER` with `prefabIconElement(GUNS[k].prefab, '🔫', 22)` (from '@lawn/prefabs')
    and `GUNS[k].name`. Clicking a tab selects that weapon: draft = `fittedLoadout(k)`, rebuild the body, `deps.preview(k, draft)`.
  - Body (`.gz-body`) for the selected gun `g`:
    1. `sectionLabel('Stats')` and a `div.am-stats` comparing `moddedGun(g, {})` (stock) with `moddedGun(g, draft)`: Damage `x1.00`,
       Fire rate `/s`, Accuracy as spread in degrees (`±(spread * 57.3).toFixed(2)°`, smaller is better), Range `m`, Magazine, Reload `s`
       (smaller is better), Recoil, Aim zoom `x(AIM.zoom * zoom).toFixed(1)`, Sound (`Stock`, `Suppressed`, `Heavy`, `Kazoo`, `Squeaky duck`).
       Each row: label, `stock -> draft`, and ▲ / ▼ when better / worse. Refresh it on every change.
    2. For each `slot` of `slotsFor(g)`: `sectionLabel(SLOT_ICONS[slot] + ' ' + SLOT_NAMES[slot])` and an `optionGrid` with
       `{ id: 'none', name: 'Stock', blurb: 'Nothing bolted on.', price: 0 }` first, then every `modsFor(g, slot)` as `{ id, name, blurb, price }`;
       `value: draft[slot] ?? 'none'`; `onPick(id)`: set or delete `draft[slot]`, refresh stats and price, `deps.preview(g, draft)`.
       `thumb(id)`: for a mod with a prefab `prefabIconElement(mod.prefab, SLOT_ICONS[slot], 40)`; for a finish a 40 px rounded `span` with
       `background: #rrggbb` of `mod.finish.color`; none for 'none'.
       After building a grid, relabel its `.gz-card-price` spans (same order as items): an owned mod says `Owned`, the fitted one `Fitted`.
  - Foot (`.gz-foot`): price line `Total N 🌰 (you have M)` where N = `loadoutCost(ownedMods(g), draft)`, the list of unowned mods with
    prices under it; buttons `🔊 Test fire` (`deps.testFire(g, draft)`), `Reset` (draft = `fittedLoadout(g)`, rebuild body, preview), and the
    main button: label `Buy & Fit` when N > 0, `Fit` when N = 0; disabled when the draft equals the fitted loadout (same ids in every slot)
    or N > acorns.
  - Buy & Fit: if N > 0 and `!deps.spend(N, 'Ammu-Gnation')`: `hud.toast('Ammu-Gnation: not enough Acorns.')`, `deps.play('alarm')`, stop.
    Else `bought = loadoutIds(draft).filter(id => !ownedMods(g).has(id))` (computed BEFORE buying), `buyMods(g, bought)`,
    `fitLoadout(g, draft)`, `deps.play('reload')`, toast `AMMU-GNATION: Bolted on.` (or `Fitted.` when nothing was bought), rebuild the body
    (prices now say Owned/Fitted), and `deps.onFit({ gun: g, bought, spent: N, loadout: fittedLoadout(g) })`.
  - `open(gun)`: show the frame, select `gun`'s tab (draft = `fittedLoadout(gun)`), `deps.preview(gun, draft)`, exit pointer lock, add the
    Escape listener (`e.code === 'Escape'` closes). `close()`: no-op when closed; else hide, drop the draft, remove the listener,
    `deps.onClose()`. `isOpen()`.
  - Touch: every button and card is at least 44 px (the glaze CSS already does that for `.gz-btn`, `.gz-tab`, `.gz-card`); the tab row scrolls
    sideways on a phone.

## Contract
The exports of the stub, unchanged:
```ts
export interface GunFit { gun: GunKind; bought: string[]; spent: number; loadout: GunLoadout }
export interface GunShopDeps { acorns(): number; spend(amount: number, reason: string): boolean; play(sfx: Sfx): void;
  preview(gun: GunKind, loadout: GunLoadout): void; testFire(gun: GunKind, loadout: GunLoadout): void;
  onFit(info: GunFit): void; onClose(): void }
export interface GunShop { open(gun: GunKind): void; close(): void; isOpen(): boolean }
export function createGunShop(ui: HTMLElement, hud: Hud, deps: GunShopDeps): GunShop
```

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `gunShop.ts`.
- Read through: Escape and ✕ both close and call `deps.onClose` exactly once; the main button is disabled when nothing changed.

## Out of scope
`glazeShop.ts`, `glazeUi.ts` (import from it, never edit it), `gunStore.ts` (another worker builds the world side and calls your shop),
every other file.
