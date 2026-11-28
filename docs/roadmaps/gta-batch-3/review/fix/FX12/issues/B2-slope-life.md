Epic: FX12 · Issue B2: the slope's life (ambient skiers, the lodge lit at night, chimney smoke, a tow-base lantern)
Depends on: none (the lead created the stub `src/winter/slopeLife.ts` and wired it into hill.ts)
Model: Sonnet (staging, taste)
Port: 5523

(Paste of `_env.md` goes here when launched.)

## Goal
Snowdrop Slope has people on it and the Woolly Sock Lodge looks like a ski lodge at dusk (G4#7 life half, G4#10 night
half): 2-3 ambient skiers or sledders going down the slope on loops, warm lit windows on every side of the lodge at
night, one warm point light on the porch at night (within the light budget: one light, only when the player is near),
a chimney smoke puff, and a lantern on the tow base.

## Read first
- `src/winter/slopeLife.ts` (the stub: keep the exported signatures exactly).
- `src/winter/hill.ts` (how the lodge is placed: `LODGE` = centre (-449, -1020), door faces east (+x), sized so its
  longest side is `LODGE.size` = 14 m; `lodgeBounds()`; `makeGnome` + `gnomeState` usage for Gentian and the learners;
  `heightAt`). Do not edit hill.ts.
- `src/winter/types.ts`: `LODGE`, `TOW`, `TEA_TRAY_RUN`, `NURSERY_RUN`, `WOOL_RUN` (read only; another worker is moving
  the Wool Run's start up to the summit, so read positions at build time).
- `src/winter/slideRider.ts` (`newSlide`, `stepSlide`) if you drive the ambient riders with the real slide physics
  (the E12 brief allowed "the slide rider on autopilot"); a simpler path follower along the ground is fine too.
- `src/homes/pieces.ts` `litWindow(x, y, z, yaw, w, h)`: a pane that is dark by day and warm yellow at night (app.ts
  updates it every frame). `src/country/campsBuild.ts` ~line 155-230: how a single night-only PointLight near the
  player is done (it reads a time label; find the same kind of night signal you can reach from slopeLife.ts, e.g. by
  grepping `timeLabel` / `nightF` / `skyNight`; if none is importable without touching app.ts, drive the light from the
  same night factor `litWindow` panes use: read one pane material's colour or export nothing new from app.ts).
- `packages/prefabs/src/catalog/gta-winter-lodge.ts` `woolly-sock-lodge` parts (chimney at local (3.0, top ~5.3,
  -1.2) before scaling; another worker is adding side and back windows to the prefab right now and keeps the
  chimney where it is).

## Change
- `src/winter/slopeLife.ts` (you own it):
  - Ambient riders: 2 skiers and 1 sledder (gnomes from `makeGnome`, on `snow-skis` / `tea-tray-sled` prefabs from
    `buildPrefab`), each descending a different line (Nursery strip, Wool Run corridor, Tea-Tray lane), then fading out
    at the foot and reappearing at the top after a pause (no visible walk back), never crossing the lodge, the tow line
    or the porch. They are scenery: no colliders, no interaction. Only update them when the player is within ~300 m.
    Keep them clear of the player's own run if the player is riding (a simple rule: hide them while the player is
    within 15 m of one).
  - Night: `litWindow` panes over the lodge's window positions on every side (match the prefab's window positions after
    scale and yaw; a pane 0.03 m in front of the wall), one PointLight (warm, ~0xffb25a, distance ~14) on the porch,
    visible only at night and when the player is within ~120 m, and a lantern on the tow base (prefab
    `camp-lantern-post`, check `getPrefab`) with its own glow (emissive part or the same light budget rule: only one
    extra light, near the player, at night).
  - Chimney smoke: a few soft grey-white puffs (sprites with a radial-gradient CanvasTexture, `depthWrite: false`,
    transparent) rising and fading from the chimney top, only when the player is within ~250 m.
- A small pure test `src/winter/slopeLife.test.ts`: `buildSlopeLife(new THREE.Group())` builds and `update` runs near
  and far without throwing; the riders stay inside the `ski-hill` site (x -460..-240, z -1350..-1000) over 60 s of
  updates.

## Contract
`export interface SlopeLife { update(dt: number, t: number, px: number, pz: number): void }` and
`export function buildSlopeLife(parent: THREE.Object3D): SlopeLife` stay exactly as in the stub (hill.ts calls them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files; `cd games/gnome-theft-auto && npx vitest
  run src/winter/slopeLife.test.ts src/winter/hill.test.ts` passes.
- Shots on port 5523: `nightLodge` with url `http://localhost:5523/?time=night` at (-405,-1012,-1.57) and a day shot
  `slopeFoot` (-360,-985,3.14) showing at least one rider on the slope (raise `--wait` if needed). Compare with the
  editor's `nightLodge.png`: warm windows and porch light.

## Out of scope
hill.ts, types.ts, runtime.ts, the prefab catalog (another worker), pond and bears.
