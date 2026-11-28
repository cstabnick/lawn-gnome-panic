Epic: FX11 A (coast fixes, parallel) · Issue A13: Long Spoon Pier reads as a spoon (G3#8), its underside, its notices, Bilge's chalk board, Marram's lit window (G3#4 board, G3#12, G3#23 pier)
Depends on: none · Agent: Sonnet · Dev port 5533

(The Environment section the lead gave you applies.)

## Goal
Editor (G3#8): "The handle is a brown plank walkway with a 1.2 m steel strip down the middle. The silver bowl oval can only be seen from above, so from the beach it is an ordinary pier." Fix: "Make the handle polished silver (the `silver` material already exists), with a raised rim along both edges and a rounded handle end coming up out of the sand at the beach (half-buried, as the lore says). Give the bowl a visible lip and a slight dish. Keep the planks on the spur only." Also (FX01 hand-off): "The pier's underside is still a black lid at night: use FX01's `undersideMat()`." G3#4: the stage and lore put Captain Bilge "at the head of the pier with a chalk board of tour times. There is no chalk board." G3#12: Marram's hut lamp is "lit at dusk" in the lore but dark. G3#23: the lore's pier notices are not placed: "FISHING FROM THE HANDLE ONLY. THE BOWL IS NOT AVAILABLE." and "PLEASE DO NOT STIR".

## Read first
- `games/gnome-theft-auto/src/coast/pier.ts` (all of it: `buildPier(scene, boxes, boardwalkTop)`, moved out of boardwalk.ts this epic) and `src/coast/deckKit.ts` (helpers: `Bins` merges geometry per material key; `MATS` holds the materials by key and you may add your own keys from pier.ts at import time, e.g. `MATS.spoonTop = ...`; `deckSlabs`, `railLine`, `place`, `placeAt`, `signAt`, `solid`, `bedHeight`).
- `games/gnome-theft-auto/src/coast/config.ts` `COAST.pier` (handle x 296..304 from z 1120 to 1236; bowl x 289..311 z 1236..1254; spur x 210..304 z 1120..1130; deck y -3.0; Marram's hut (292, 1244)).
- `games/gnome-theft-auto/src/undersides.ts` (`undersideMat(color, params?)`: lit from below at night), `src/coast/nightLights.ts` (`nightGlowMat(color, peak?, day?)` for a window that glows at night, `lightPool(...)`).
- `games/gnome-theft-auto/src/coast/boardwalk.test.ts` (the pier rooftops and "keeps every deck above the ground" tests must keep passing).
- Lore: `docs/lore/entries/apocrypha/long-spoon-pier.md`, `marram-teaspoon.md`, `samphire-bilge.md`.

## Change: `src/coast/pier.ts` (+ a new `src/coast/pier.test.ts` if useful)
1. Handle (z 1130..1238): replace the plank slabs and the steel strip with a polished spoon handle: a thin silver top plate (key `silver`, top exactly at `Y`, the walkable rooftop height: nothing may rise above Y inside x 296.45..303.55 except at the rails) on a body underneath in `undersideMat(0x9aa6ad)` (add it as a new MATS key). Raised rounded rims along both long edges (silver, about 0.25 m high, 0.35 m wide, outside the walking strip, under/at the rails). The rails may stay (safety), but recolour them to match (white or silver rail key) so the silhouette reads as a spoon.
2. The handle's end: north of the spur (the spur meets the handle at z 1120..1130), continue the silver handle on north for about 10-14 m, widening slightly to a rounded end (a flattened half-disc) and sloping down into the sand, half-buried, as the lore says. Decorative (not walkable, no rooftop), with one collider box for the part above 0.5 m.
3. Spur (x 216..296): keep the planks (the only planks left), on a skirt.
4. Bowl: keep the oval top flat at `Y + 0.07` (walkable). Add a visible lip: a raised silver ring round the oval's edge (a torus or ring of boxes, about 0.3 m high, outside the walkable rect corners where possible), and suggest a slight dish with a darker inner oval band (a flat ring on `flatLayer(..., LAYER.decal)` 1-2 cm above the top) and a polished highlight. Underside of the bowl: `undersideMat`.
5. Posts and the underside of the spur: `undersideMat` for the skirt and any flat underside so the pier is not a black lid at night.
6. Notices (via `signAt` / `coastSign`, both faces printed by default): on the handle by the spur end `"FISHING FROM THE HANDLE ONLY.\nTHE BOWL IS NOT AVAILABLE."`; on the bowl `"PLEASE DO NOT STIR"`. Keep the "MARRAM'S / No refunds, many opinions" sign.
7. Bilge's chalk board (G3#4): a `chalk-tour-board` prefab (being added this epic: an A-frame chalkboard about 0.9 tall, 0.6 wide at scale 1; guard with `getPrefab`) at (302.5, 1166) on the handle deck (`placeAt(scene, 'chalk-tour-board', 302.5, Y, 1166, yaw, 2)`) turned to face up the handle towards the beach end (yaw PI), with a text plate on its front face (use `textPlate` from `../homes/pieces` or a small `coastSign` with `post: 0`, chalk-white text on `0x2b2b2b`): `"PIRATE TOURS\nNoon. Also noon.\nMidnight is cargo.\nNot a tour."`. Bilge herself is moved next to it by another worker (resident at (300, 1168)).
8. Marram's hut window: a glowing pane (`nightGlowMat(0xffc46b, 2)`, a thin box) on the hut's side that faces the handle, 0.03 m proud of the wall, plus a small `lightPool` on the bowl in front of the door: lit at dusk.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast/boardwalk.test.ts src/coast/pirateShip.test.ts` (+ your pier test) passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your file.
- Shots (port 5533): `pierbeach:330,1185,-0.55` (compare the editors' `a07-pierbeach.png`), `ship:255,1180,0.47` (compare `b01-ship.png`), `underpier:310,1190,3.0` (compare `b08-underpier.png`), `pierNight:330,1185,-0.55` with `?time=night` (compare `c02-night-pier.png`), `handleEnd:285,1100,0.6`. From the beach it must read as a giant silver spoon. Iterate.
- `npm run zfight -- "http://localhost:5533/?at=300,1200,0"` reports nothing new on the pier (if the tool times out, say so).

## Out of scope
`src/coast/boardwalk.ts` (another worker), `deckKit.ts` (another worker owns its existing contents; you only ADD MATS keys from pier.ts), `life.ts` (Ruth and Bilge), `pirateShip.ts`.
