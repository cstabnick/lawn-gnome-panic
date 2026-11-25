Epic: E01-2 Fill (GTA batch 3, world expansion)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af7a6a91d2dd2fbef` (a git worktree). Game: `games/gnome-theft-auto`.
- Git Bash. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing other files of this game at the same time (world.ts, biomes.ts, landforms, app.ts, lore).
  Touch only the file listed under Change. Do not commit. Do not run `vite build` or a dev server.
- Keep the file's line endings as they are (use the Edit tool; do not rewrite the file with sed or a script).
- `src/layout.golden.test.ts` fails on purpose right now; ignore it and never touch `src/data/layout.golden.json`.

## Goal
The world map grew from 1800 to 2800 units square (`WORLD_HALF` 1400). The minimap/big-map background picture is
drawn at 1 pixel per world unit, which is now 2800 x 2800 px (31 MB) and too heavy for phones. Draw it at a capped
resolution and make the minimap and big map read the picture at that scale.

## Read first
- `games/gnome-theft-auto/src/hud.ts`:
  - `MAP_RANGE` / `MAP_VIEW` (~line 273).
  - `drawHillshade(g, H, W)` (~line 567): draws an offscreen image into `g` with `g.drawImage(off, 0, 0, W, W)`.
  - `buildBackground(world: World)` (~line 612): `const H = world.half; const W = 2 * H;` canvas `W x W`, every drawing
    call uses world units through `X(x) = H - x`, `Y(z) = H - z`.
  - `drawMap(s)` (~line 908): uses `const H = bgCanvas.width / 2` and treats one background pixel as one world unit.
  - `drawBig(s)` (~line 1036): `const W = bgCanvas.width; const k = px / W;` and `X = (x) => (W / 2 - x) * k`.
  - where `bgCanvas = buildBackground(world)` is assigned (~line 1200).

## Change
- `games/gnome-theft-auto/src/hud.ts` only:
  1. Add near `MAP_RANGE`: `/** Longest side of the map background picture, px (a phone-sized texture); the world is drawn scaled to fit. */ const MAP_BG_MAX_PX = 2048;`
  2. Add a module-level `let bgHalf = 0;` next to wherever `bgCanvas` is declared (the world half the picture covers).
  3. In `buildBackground(world)`: keep `H = world.half` and `W = 2 * H` (world units). Compute
     `const k = Math.min(1, MAP_BG_MAX_PX / W);` and size the canvas `c.width = c.height = Math.round(W * k);`. Right
     after `const g = c.getContext('2d'); if (!g) return c;` call `g.scale(k, k);` so every existing drawing call keeps
     working in world units unchanged (including `g.fillRect(0, 0, W, W)` and `drawHillshade(g, H, W)`). Do not change
     any other drawing code in it.
  4. Where `bgCanvas = buildBackground(world)` is assigned, also set `bgHalf = world.half;`.
  5. `drawMap`: replace the background window code so it works in world units and converts to picture pixels with
     `const s = bgCanvas.width / (2 * bgHalf);` (picture px per world unit):
     ```ts
     const H = bgHalf;
     const s = bgCanvas.width / (2 * H);
     const k = dev / MAP_VIEW; // device pixels per world unit
     const bx0 = H - px0 - MAP_RANGE; // window's left edge, world units in the mirrored picture
     const by0 = H - pz0 - MAP_RANGE;
     g.fillStyle = MAP_BLANK;
     g.fillRect(0, 0, dev, dev);
     const cx0 = Math.max(bx0, 0), cy0 = Math.max(by0, 0);
     const cx1 = Math.min(bx0 + MAP_VIEW, 2 * H), cy1 = Math.min(by0 + MAP_VIEW, 2 * H);
     if (cx1 > cx0 && cy1 > cy0) {
       g.drawImage(bgCanvas, cx0 * s, cy0 * s, (cx1 - cx0) * s, (cy1 - cy0) * s,
         (cx0 - bx0) * k, (cy0 - by0) * k, (cx1 - cx0) * k, (cy1 - cy0) * k);
     }
     ```
     Everything after it in `drawMap` (blips, route, arrow) is already in world units: leave it.
  6. `drawBig`: replace `const W = bgCanvas.width;` with `const W = 2 * bgHalf; // world units across the picture`.
     Keep `g.drawImage(bgCanvas, 0, 0, px, px)` (the whole picture into the whole map). `k = px / W` and `X`, `Y` are
     then correct.
  7. Grep the file for any other `bgCanvas.width` / `bgCanvas.height` use and convert it the same way (picture px =
     world units x `s`).

## Contract
- No exported signature changes. `buildBackground` stays a private function returning an `HTMLCanvasElement`.
- With `world.half = 900` the picture is 1800 px (k = 1, identical to before); with 1400 it is 2048 px.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` succeeds.
- `npx vitest run src/hud src/mapIcons.test.ts` (from `games/gnome-theft-auto`) passes (if no hud test matches, run `npx vitest run src/mapIcons.test.ts`).
- Reading the code: a player at (1300, -1300) is drawn at the right spot on both maps (the minimap window clips at the
  picture's edge, the big map maps x = +1400 to the left edge as before, since east (-x) is on the right).

## Out of scope
- Any other file. Map zoom, legend changes and new POIs belong to a later epic (E07).
