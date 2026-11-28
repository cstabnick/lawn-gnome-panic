# FX01 result (R1 fix round)

Branch `fix/FX01`. Plan: [roadmap.md](roadmap.md) (foundation by the lead, 9 worker issues in one parallel wave).
Shots: `docs/roadmaps/gta-batch-3/review/shots/FX01/` (git-ignored, local), dev server on port 5501.

## Shared contracts delivered (for FX06-FX16)

- `homes/pieces.ts`: `textPlate(text, x, y, z, yaw, { w, h, bg, fg, back?, backing? })` wraps words to the plate's
  aspect (`layoutPlate`, pure), canvas 512 px (1024 over 3 m; 256 only for short text on small plates), minimum glyph
  18 px at 512 (or a 6 cm glyph on huge banners), textures cached by text + size + colours. `back` prints the reverse
  face, `backing` adds a wooden box between faces.
- `signBoard({ front, back?, twoSided?, x, z, yaw, board?, w?, h?, scale?, bg?, fg?, tint? })` + `BOARD_FACES`
  (garden-sign, notice-board, manifesto-board, euro-poster-board): plate seated flush on the board face, both faces
  printed; returns `{ piece, plates }`.
- `homes/notices.ts` `addNoticeSpot(pos, lines, prompt?)`: "Read the notices" spot, toasts the lines in turn.
- `undersides.ts` `undersideMat(color, params?)`: emissive floor (0.3 day, 0.1 night), updated from app.ts.
- `weather/config.ts` `weatherOvercast(kind, i)`: rain overcast floor 0.45 (never above full rain's 0.75).
- `WATER.bodies[id]` optional look fields `colour`, `crest`, `opacity`, `shoreM` (only the Saltwater sets them).

## Per finding

| ID | Status | What landed | Evidence |
|---|---|---|---|
| G1#5 | fixed | Double Pot slab and every skyway deck (incl. the Unfinished Span) and the Underspan Roost deck use `undersideMat`; tunnel lamps every 6 m in two rows (new prefab `tunnel-lamp`), "DOUBLE POT TUNNEL / HEADROOM 8 M" portal plates, THORNE plates inside, "SALES FLOOR →" by the door. Column bents with posters under the downtown skyway: not done (carried, could). | `dpot-tunnel.png`, `dpot-in.png`, `n-tunnel.png`, `underspan-road.png` |
| G1#17 | fixed | Manifesto boards: 2.6 x 1.5 m posters, two per face on both faces, + "Read the manifesto" spots. Saucer Court plates enlarged (rules 1.3 x 0.8 off the door leaf, rota 1.5 x 0.9, residents-only 1.2 x 0.8) + notice spots; Kerb Row sign 1.8 x 0.8, two-faced with backing. | `underspan-road.png`, `underspan-backclose.png`, `saucer-stair.png` |
| G2#11 | fixed | Every Pardonlin poster board and menu chalkboard prints its back face (same atlas cell); `signBoard` prints both faces by default. | `poster-back.png` |
| G2#12 | fixed | Pardonlin sign atlas is shelf-packed with cells sized by `plateCanvasWidth` (512 / 1024), min font scaled; Radio Adagio roof banner now the name only (8 x 1.5), door banner 4.6 x 0.95, the long joke on an eye-level poster in the forecourt. | `adagiofront.png` |
| G2#30 | fixed | Ambient motes are soft tumbling sprites (glow, petal, leaf, seed fluff), capped at 22 px, faded within ~3 m of the camera; night shows round firefly glows. | `station.png` |
| G3#10 | fixed | Saltwater: own deep-blue texture (sRGB), white crests on a narrower band, opacity 0.94, wave shore fade 45 m (no bed through troughs). Loch and canals unchanged. | `a08-beachE.png`, `a10-beachW.png`, `a07-pierbeach.png` |
| G3#11 | fixed | Foam is a lit Lambert material (dark at night), width and brightness vary along the shore, opacity washes slowly. | `c02-night-pier.png` |
| G3#28 | fixed | "HIRE 1 ACORN"; Dunelow and Espalier End boards carry a 4-row headline + notice spot with the full lines. Lore: R-237, dunelow.md. | `dunelow-board.png`, `npm run lore` |
| G4#3 | fixed | Snow points: size cap 14 px x DPR, near fade 1-2.5 m, tighter round flake, alphaTest. (The squares the editors saw in the north were mostly the motes, fixed under G2#30.) | `snow-close.png`, `weather/render.test.ts` |
| G6#2 | fixed | Shared wrap in `textPlate` fixes every caller (Wader's Rest, Hedgeworth, Moleman excluded, see below); vineyard signs 1.75 x 0.9 on garden-sign boards; test `country/trellisSigns.test.ts`; 70-char unit test in `homes/plates.test.ts`. | `sign-pickers.png`, `waders-gate.png` |
| G6#13 | fixed | Vineyard/manor signs and Bottom Garden signs use `signBoard` (flush on the face, both faces printed); signposts replaced by garden-sign boards. | `sign-pickers.png`, `drip-sign.png` |
| G6#26 | carried over (could) | The ghost towers are landmark towers drawn past fog far in the fog colour, which is close to but not the sky colour. The fix belongs in the tower/landmark materials or `cull.ts` (fog-capped landmark material or culling at fog far), not in files FX01 owns. | - |
| G6#29 | fixed | Same as G2#30. | `station.png` |
| G9#26 | fixed | Rain overcast floor 0.45 (light rain greys the sky), sun shadow intensity drops with overcast, shorter fainter rain streaks on screens under 600 px. | `rain-light.png`, `plates.test.ts` |

Counts: 13 fixed, 0 partly, 1 carried over (G6#26, could).

## Notes for other epics

- `interiors/kit.ts` `sign` (Moleman's "KICK DRUM" sign, G6#2) and `coast/sign.ts` have their own plate painters; they
  should call `layoutPlate` from `homes/pieces.ts` (FX02 / FX11 own those files).
- `pardonlin/districts/leftBank.ts`: only the Opera Hall lines changed (FX09 owns the file).
- `layout.golden.json` regenerated on purpose: the vineyard signposts became garden-sign boards (colliders and plate
  bounds changed).
- The Saltbucket pier's underside is still a black lid at night (`c02-night-pier.png`): coast/** is FX11's; it should
  use `undersideMat`. Same for the Underspan scrap-shed's overhang (a prefab roof).
- Rain overcast was shot 12 s after load, while the forced weather was still fading in; the sky is only part grey in
  `rain-light.png`. The floor is unit-tested.

## Checks

- `npm run build -w games/gnome-theft-auto`: OK.
- `npm test -w games/gnome-theft-auto`: 5344/5346 in the full run; the two failures (`canalCruise`, `sandpitJump`) were
  timing-sensitive under parallel browser load and pass alone. `npm test -w packages/prefabs`: 4098 passed.
  `npm run lore`: OK.
- `bash tools/smoke.sh "http://localhost:5501/?offline&no-intro" gta-gnomlet "#ui" canvas`: SMOKE OK.
- `npm run zfight` at the tunnel, Underspan, vineyard, Opera Hall, Saucer Court, Bottom Garden and pier: no pairs from
  FX01's objects after moving garden-sign plates clear of the posts (the remaining pairs are boats and other objects on
  water and existing scenery, none new).
- Perf (`gta-perf.mjs`) not run: no density change (same mote count, 14 small lamps, plate textures cached and capped
  at 1024 px).
- Phone 390x844 shots: `p-sign-pickers.png` (the PICKERS joke reads at 6 m), `p-underspan-road.png`, `p-adagio.png`,
  `p-dpot.png`.
