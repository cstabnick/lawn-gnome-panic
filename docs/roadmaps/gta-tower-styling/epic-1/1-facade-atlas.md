Epic: 1 tower kit
Depends on: none

(Read `docs/roadmaps/gta-tower-styling/epic-1/_env.md` first: environment and rules.)

## Goal
`games/gnome-theft-auto/src/towers/facadeAtlas.ts` paints 16 distinct building facades into one 1024 x 1024 canvas
atlas (the day look) and a matching glow atlas (lit windows on black, for night).

## Read first
- `games/gnome-theft-auto/src/towers/facadeAtlas.ts`: the stub. Keep `FACADE`, `BODY_FACADES` and the signature of `buildFacadeAtlas` exactly.
- `games/gnome-theft-auto/src/towers/kit.ts`: `seeded(seed)` (deterministic random), `TILE_W` = 6 m, `TILE_H` = 6.4 m, `LOBBY_H` = 4.5 m.
- `games/gnome-theft-auto/src/towers/material.ts`: how the atlas is sampled (only to understand; do not edit).
- `games/gnome-theft-auto/src/world.ts` lines 308-365 (`windowTexture`): the old single-pattern window painter, a good style reference (gradient glass, mullions, sills, soot).

## Change
- `games/gnome-theft-auto/src/towers/facadeAtlas.ts`: replace the stub body of `buildFacadeAtlas()`.
  - Make two canvases with `document.createElement('canvas')`, 1024 x 1024 each: `day` and `glow`. Wrap each in
    `new THREE.CanvasTexture(canvas)`, set `colorSpace = THREE.SRGBColorSpace` on both. Return `{ map: dayTex, glow: glowTex }`.
  - If `getContext('2d')` returns null, return the textures anyway (tests run with a fake DOM whose context accepts every call).
  - Use ONE `const rnd = seeded(0x7a11)` for all random choices so the atlas is the same every run.
  - Tile `i` (0..15) is painted in the 256 x 256 square at canvas x = (i % 4) * 256, y = Math.floor(i / 4) * 256.
    Each tile is one repeat unit: 6 m wide and 6.4 m tall in the world, i.e. two floors of 3.2 m (canvas rows 0-127 = upper
    floor, 128-255 = lower floor) and usually two window bays (columns 0-127 and 128-255). It repeats seamlessly in both
    directions, so whatever touches the left edge must continue at the right edge (same for top/bottom). Keep a 3 px
    margin of plain wall colour round every tile edge so mipmaps do not bleed tiles into each other.
  - Glow canvas: fill black. For every window you paint on the day canvas, decide (rnd() < 0.45) whether it is lit; if
    lit, paint the same window rectangle on the glow canvas in a warm colour (`#ffd27a`, `#ffc46b`, `#ffe9b0`) or, one in
    five, a cool one (`#bfe3ff`); about one lit window in four at half brightness (`globalAlpha = 0.5`). Unlit windows
    and walls stay black on the glow canvas. On the DAY canvas a lit window shows a slightly warmer glass gradient (like
    the old windowTexture), an unlit one reflects the sky (blue-grey gradient with a pale diagonal glint).
  - The 16 designs (the ids are in `FACADE`). Each must read clearly different from 40 m away:
    0 BRICK: warm red brick (`#a5523a`, mortar lines every 8 px, slight per-brick shade jitter), two punched windows per floor with white sills and lintels.
    1 BLUE_GLASS: blue curtain wall (`#3f7fb5` to `#2b5a80` gradient), thin light mullions on a 64 px grid, spandrel band at each floor line.
    2 CONCRETE_BANDS: grey concrete (`#9aa0a6`) with one long horizontal ribbon window per floor running across the whole tile (continues across tiles), thin vertical mullions every 32 px.
    3 SANDSTONE: sandstone (`#d9c08b`) with arched-top windows (a semicircle on top of the rectangle), a carved string course at each floor line.
    4 OBSIDIAN: near-black (`#14151b`) glass with thin gold (`#c9a227`) vertical fins every 64 px and dark windows.
    5 GREEN_GLASS: green glass (`#2f7d5b` to `#1f5a40`) with a light frame grid and a small planter strip (green dots) under each window.
    6 WHITE_GRID: white render (`#eef0f2`) with four square punched windows per floor (a 4 x 2 grid), dark frames.
    7 DECO_CREAM: cream (`#efe6d2`) art deco: two tall vertical piers per tile in a slightly darker cream, dark spandrel panels (`#4a4f55`) between the windows of the two floors so the windows read as tall vertical strips.
    8 BRICK_WEATHERED: dark brown brick (`#6e3f2e`) like BRICK but with dark rain streaks running down from every sill (vertical `rgba(0,0,0,0.25)` smears of varying length), one window boarded up (planks), soot near the top.
    9 COPPER: verdigris copper (`#5fa58e` with darker `#3f7f6c` panel seams on a 64 px grid), narrow vertical windows.
    10 PASTEL_BALCONY: pastel pink stucco (`#f2b8c6`), French windows (tall) with a painted white balcony railing in front of each (vertical bars).
    11 GOLD_MIRROR: gold mirror glass (`#c9a24a` to `#8a6a2a` gradient), very thin dark mullions, a strong diagonal sheen.
    12 CHECKER: candy panels: red (`#c62828`) and white (`#fafafa`) squares of 64 px alternating like a chessboard, with a small window in each white square.
    13 TERRACOTTA: terracotta (`#c0673f`) with horizontal louvre fins (darker stripes every 12 px) over recessed windows.
    14 SHOPS: a ground-floor shopfront tile. The world only shows the BOTTOM 70% of this tile (canvas rows 77-255 of the tile = 0..4.5 m), so paint the shopfront there: a stone base 10 px tall, two big shop windows with a door between (door in the middle, 40 px wide), small display shapes (boxes, a pot, a hat) inside the windows, and at the top of that 70% band a dark sign fascia strip 22 px tall. Rows 0-76 of the tile: plain wall. On the glow canvas ALL the shop glass is lit warm (full brightness), the door half.
    15 LOBBY: a ground-floor lobby tile, also only its bottom 70% is seen: one tall glass wall (light blue-grey glass, thin dark frames every 64 px), a revolving door drawn as a darker circle-ish shape in the centre, a polished stone base strip. Glow: all glass lit cool white (`#e8f4ff`) at 0.8 alpha.
  - Keep the code plain: one small function per design (`paintBrick(c, x, y, rnd, glowC)` and so on) and a shared
    `paintWindow(...)` helper for glass + glow.

## Contract
`export const FACADE`, `export const BODY_FACADES` (unchanged) and
`export function buildFacadeAtlas(): { map: THREE.Texture; glow: THREE.Texture }`.
No other export is needed. The file imports only `three` and `./kit`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no error in `src/towers/facadeAtlas.ts`.
- Reading the file top to bottom, all 16 designs are painted, each in its own tile, each respecting the 3 px margin and the seamless-repeat rule.

## Out of scope
Every other file. Do not touch `types.ts`, `kit.ts`, `material.ts`, `index.ts`.
