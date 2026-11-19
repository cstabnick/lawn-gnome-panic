# Gnome Sweet Gnome: more homes and levels

Goal: Project Makeover-style progression. Three homes (Mossy Lane, Oakwood Treehouse, Shell Cove), each a set of
areas made over with stars from one global line of levels (1-60). A home opens when the one before it is finished;
a Homes map lets the player visit any open home. Cloud saves get the same handling as Gnomomia (title note, sign-in
link, a message when another device takes over the save).

Data: `games/gnome-sweet-gnome/src/house/houseData.ts` (`HOMES`, `AREAS`). Planner-owned: levels, HouseScene,
save, cloud. Workers own only the art files below.

## Epic 1: art for the new homes (parallel)

### Issue A: `src/house/houseArtTreehouse.ts`

Replace the stub. Export `DRAW_TREEHOUSE: Record<string, DrawFn>` and `BACKDROP_TREEHOUSE: Record<string, BackdropFn>`
(types in `src/house/artTypes.ts`).

- Backdrops (1000 x 700 design space, `(g, done)`; `done` = brighter, tidier, sparkles): `treedeck` (open deck high
  in an oak: sky, distant treetops, big trunk at one side, plank floor below y 520), `treebed` (inside a hollow tree:
  curved bark walls, wooden floor below y 560), `treeshop` (workshop inside the trunk: plank walls, sawdust floor
  below y 560, a hanging bulb).
- Draw functions: `ladder`, `railing`, `hammock`, `birdhouse`, `telescope`, `bed`, `knothole` (round window in bark
  with the sky colour inside), `nightstand` (with candle/glow on top using colour 3), `mobile` (three items hanging
  from a stick), `workbench`, `toolrack` (board with hammer, saw, wrench), `barrels` (two or three barrels),
  `cuckoo` (cuckoo clock with a little bird).

### Issue B: `src/house/houseArtCove.ts`

Same contract, export `DRAW_COVE` and `BACKDROP_COVE`.

- Backdrops: `covedock` (sea to the horizon, sky, wooden shore; water below y 450 except where the pier goes),
  `covebath` (tiled walls in sea colours, a round porthole, tiled floor below y 580), `covebeach` (sand, sea at the
  top third, a few rocks, sun; `done` adds a bright sun and sparkles on the water).
- Draw functions: `pier`, `rowboat`, `harbourlamp`, `nets` (net draped over two posts with floats), `lobsterpots`,
  `bathtub` (clawfoot tub with bubbles), `shellmirror` (scallop-framed mirror), `towelrack`, `fern` (potted fern),
  `rockpool` (rock ring with water and a starfish/anemone in colour 3), `deckchair`, `parasol` (beach umbrella on a
  pole, canopy at the top of its box), `windchime`.

### Rules for both

- Signature `(g, x, y, w, h, [c0, c1, c2])`: draw centred on (x, y), filling about w x h. Every coordinate is computed
  from x, y, w, h, so the same function draws full size and small preview cards (about 100 px). No fixed pixel sizes
  except line widths `Math.max(2, Math.min(w, h) * 0.03)`.
- c0 = main colour, c1 = second, c2 = accent. All three variants of a slot must look clearly different, so colour the
  big shapes with c0/c1.
- Style: copy the helpers and look of `src/house/houseArtOutdoor.ts` and `houseArtIndoor.ts` (darker outlines,
  `shade.ts` helpers `slab`, `panel`, `cylinder`, `ball`, `blob`, `gloss`, `groundShadow`; light from the top-left).
  Import from `./shade`; copy small private helpers (darken, ol, lw) into your file rather than editing other files.
- Slot sizes and positions are in `houseData.ts` (OAKWOOD / SHELL_COVE). Do not edit any file except yours.
- Phaser Graphics only (fillRect, fillCircle, fillTriangle, fillEllipse, fillPoints, lineBetween, strokeRect...).
  No textures, no external assets.
- Done when: `npm run build -w games/gnome-sweet-gnome` passes and `npx vitest run src/house` (from the game folder)
  passes (`houseData.test.ts` checks every art key exists).

## Epic 2 (planner): levels 31-60, Homes map, saves

- `targetFor` extended past 30 with a floor; 30 new levels tuned with `npm run tune -- --levels=31-60`.
- HouseScene: a Homes button and map; area arrows stay inside one home.
- Save: `normalizeSave` on load (local and cloud text both land in localStorage, so both go through it).
- Cloud: title note (synced / sign in), message when `stopped`, summary names the home.
