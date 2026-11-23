Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first. Another chunk of work is editing `hud.ts`: do not edit it.

## Goal
`createAimHud(ui)` in `games/gnome-theft-auto/src/aimHud.ts` draws the aim-down-sights overlay: a ring that closes in around the plain
crosshair while aiming, and a full-screen scope view (dark vignette, a round lens, fine cross hairs) when a strong optic is fully aimed.

## Read first
- `games/gnome-theft-auto/src/aimHud.ts`: the stub (keep `AimHud` and `createAimHud` exactly).
- `games/gnome-theft-auto/src/hud.ts` lines 240-260: the existing centred crosshair SVG (24 px, white with a dark halo). Yours sits on top of it.
- `games/gnome-theft-auto/src/gunMods.ts`: `AIM.scopeOverlayAt` (2.4).

## Change
- `games/gnome-theft-auto/src/aimHud.ts`:
  - One container `div#gta-aim` appended to `ui`: `position:fixed; inset:0; pointer-events:none; z-index:6;` (no other element changes).
  - Ring: a centred circle `div` (border 2px solid rgba(255,255,255,0.85), box-shadow 0 0 0 1px rgba(0,0,0,0.55), border-radius 50%), its
    diameter going from 64 px at t = 0 to 22 px at t = 1, opacity `t` (hidden when t < 0.02). Four short orange (`#ff7a1a`) ticks at 12, 3, 6
    and 9 o'clock on its edge.
  - Scope view: shown when `scoped && zoom >= AIM.scopeOverlayAt && t > 0.85`, fading in with `(t - 0.85) / 0.15`. A full-screen `div` with
    `background: radial-gradient(circle at 50% 50%, transparent 0, transparent R, rgba(0,0,0,0.92) R + 2px)` where R = 38 % of the smaller
    screen side (use `vmin`), a thin dark ring at the lens edge, and two 1 px black cross hairs across the lens with a small gap at the centre.
    The ring is hidden while the scope view shows.
  - `update(t, zoom, scoped)` changes the DOM only when a rounded value changed (cache the last diameter / opacity / scope-on), so it is cheap
    every frame.
  - Respects safe areas implicitly (everything is centred); works in portrait and landscape.

## Contract
```ts
export interface AimHud { update(t: number, zoom: number, scoped: boolean): void }
export function createAimHud(ui: HTMLElement): AimHud
```
The app calls `aimHud.update(aimT, aimZoom(weapons.spec(), 1), !!weapons.spec().loadout.optic)` every frame.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `aimHud.ts`.
- Read through: `update(0, 1, false)` leaves nothing visible and nothing catches pointer events.

## Out of scope
`hud.ts`, `app.ts`, every other file.
