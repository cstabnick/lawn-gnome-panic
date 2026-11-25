Epic: E07 step 1 · Issue 01 big map zoom and pan, legend on phones (L26, L27; raised buildings as a bonus)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, registry API, rules).

## Goal
The big map works like a phone map: wheel / pinch / double-tap to zoom, drag to pan, +/- and recenter buttons, a 44 px
X button to close (tap-anywhere-closes goes away), labels re-laid out per zoom, crisp at every zoom level, and it
covers the whole 3600 m world (`WORLD_HALF` is now 1800). On phones the legend no longer covers the map: off by
default when either side of the viewport is under 700 px, and drawn as a collapsible chip list outside the map square
when there is room, capped to the place kinds actually on the map. Bonus, only if the rest is done and solid: a
"Buildings: flat / raised" option that draws `world.boxes` as a cheap 2.5D oblique extrusion.

## Read first
- `games/gnome-theft-auto/src/hud.ts` (1457 lines): `buildBackground(world)` (~line 645, pre-renders the whole world
  to `bgCanvas`; buildings from `world.boxes` with `bx.h >= 2`), the big-map block from ~line 900: `legendOn =
  window.innerWidth >= 600` (~915), `legendBtn` `.gta-legendbtn`, `setBig(open)` (~1074), `big.addEventListener(
  'pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); setBig(false); })` (~1082, the tap-anywhere close
  that must go), `drawBig(s)` (~1090; square of `px = min(innerWidth-24, innerHeight-120)`, mirrored transform
  `X(x) = (W/2 - x) * k`), markers via `drawMarker` (~391) and `drawPlaceIcon`, labels via `layoutMapLabels`, legend
  via `drawLegend(g, px)` (~488) with `LEGEND` rows, region names (`REGIONS`, `LABEL_AT`), `setWorld(world)` (~1261).
  Read the whole big-map part before changing it.
- `games/gnome-theft-auto/src/mapIcons.ts`: `layoutMapLabels(wishes, measure)` (~line 68, wishes with `prio`),
  `PlaceKind`, `PLACE_STYLE`, `RIM_PLACES`.
- `games/gnome-theft-auto/src/config.ts`: `WORLD_HALF`.

## Change
- New `games/gnome-theft-auto/src/bigMapView.ts` (pure, no DOM) + `bigMapView.test.ts`:
  ```ts
  export interface MapView { cx: number; cz: number; scale: number }   // world point at the screen centre; scale = screen px per world unit
  export interface MapViewport { w: number; h: number; half: number; minScale: number; maxScale: number }
  export function fitView(vp: MapViewport): MapView;                    // whole world fits (minScale)
  export function clampView(v: MapView, vp: MapViewport): MapView;      // scale in [minScale, maxScale]; centre kept so the world edge never leaves a gap bigger than the viewport allows
  export function worldToScreen(v: MapView, vp: MapViewport, x: number, z: number): { sx: number; sy: number };  // keep the map's existing mirroring
  export function screenToWorld(v: MapView, vp: MapViewport, sx: number, sy: number): { x: number; z: number };
  export function zoomAt(v: MapView, vp: MapViewport, sx: number, sy: number, factor: number): MapView;  // the world point under (sx, sy) stays put
  export function panBy(v: MapView, vp: MapViewport, dsx: number, dsy: number): MapView;
  ```
  Tests: round trip world->screen->world, zoomAt keeps the anchor, clamp limits, fitView shows the whole world.
- `games/gnome-theft-auto/src/hud.ts`:
  - The big map draws through a `MapView` (start fitted; zooming in up to about 12x). Rendering sharp at zoom: do not
    scale one bitmap. Either draw the background as tiles re-rasterised for the current zoom level (a small LRU of
    tile canvases, each <= 1024 px; the whole-world bitmap stays <= 4096 px, the iOS canvas limit), or draw roads /
    water / buildings as vectors from the same data `buildBackground` uses. Pick what reads best and stays smooth at
    390x844 (budget: a pan frame under ~8 ms on desktop).
  - Input on the map canvas (keep `touch-action:none` and `preventDefault()`): one-finger / mouse drag pans; wheel
    zooms at the cursor; two-finger pinch zooms at the midpoint; double-tap / double-click zooms in 2x at the point;
    buttons (44 px, safe-area aware): `+`, `-`, `◎` recenter on the player, `✕` close. Keep the existing close paths
    (M key, Escape, the minimap toggle, the "close" hint) and drop tap-anywhere-to-close. Stop propagation so nothing
    reaches the game underneath.
  - Markers and icons keep their pixel size at every zoom; labels go through `layoutMapLabels` per frame with the
    zoomed positions (more labels fit when zoomed in); region names fade out when zoomed far in.
  - Legend (L27): default on only when `min(innerWidth, innerHeight) >= 700`; when the viewport has room beside or
    below the map square (landscape: to the right; portrait: below), draw it there as a list of chips (icon + name)
    in a scrollable DOM panel instead of over the map; otherwise it is a toggleable overlay that covers at most a
    third of the map. Only list kinds that have at least one blip on the map, grouped as `LEGEND` groups them.
  - Expose on the object `createHud` returns: `bigMap: { open(): void; close(): void; isOpen(): boolean;
    zoomTo(x: number, z: number, scale: number): void }` (`zoomTo` opens the map centred on (x, z) at `scale` screen px
    per world unit, clamped). Add it to the Hud type there. Keep `setWorld` as it is.
- New `games/gnome-theft-auto/src/mapViewPrefs.ts` (only if you do the bonus): `getMapBuildings(): 'flat' | 'raised'`
  (key `gta.mapBuildings`, default `'flat'`, event `'gta:map-prefs'`) and at import time
  `registerOption({ section: 'map', id: 'map-buildings', label: 'Map buildings', kind: 'cycle', values: [{ id: 'flat',
  label: 'Flat' }, { id: 'raised', label: 'Raised' }], desc: 'Raised draws the town in 3D on the big map. Costs a
  little more on phones.', get, set, watch: 'gta:map-prefs' })`. Raised = each building box drawn as an oblique
  extrusion (offset top face by `h * k` up-left, darker side faces), painter-sorted back to front, pre-rendered per
  zoom tile like the flat map.
- `games/gnome-theft-auto/src/mapIcons.ts` only if the label layout needs a change for zoom.

## Done when
- From games/gnome-theft-auto: `npx tsc --noEmit -p .`, `npx vitest run src/bigMapView.test.ts src/mapIcons src/hud`
  pass (run whichever of those exist).
- Browser check on your own port (see _env.md) at 1280x800, 390x844 and 844x390 with touch emulation for the phone
  sizes (puppeteer-core with Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`; set
  `localStorage 'gta-intro-seen-v1' = '1'` before load to skip the intro; press `KeyM` or tap the minimap to open):
  drag pans without closing, wheel / pinch (use CDP `Input.dispatchTouchEvent` with two points, or test the pinch math
  in the unit test and wheel in the browser) zooms, +/- and recenter work, ✕ closes, the legend leaves the map usable
  on both phone orientations. Take screenshots and describe them in your report.

## Out of scope
`src/options.ts`, `src/optionsRegistry.ts`, `src/gnomlet/*`, `src/mapPois.ts` content, every other file.
