Epic: FX11 B (placement, parallel) · Issue B4: residents and vignettes tell the right story (G3#4, G3#20, G3#21, G3#22)
Depends on: epic A · Agent: Sonnet · Dev port 5544

(The Environment section the lead gave you applies.)

## Goal
- G3#4: "Resident `coast-captain-bilge` is at (262, 1160), facing west into the dunes. At the same time she is the cabin NPC. The stage `coast-pier` and the lore put her at the head of the pier with a chalk board of tour times." Fix: move her to (300, 1168) on the pier handle, facing up the beach, beside the chalk tour board (placed at (302.5, 1166) this epic), and hide her while the player is inside her cabin.
- G3#20: "Speech bubbles repeat the sign next to the speaker: Marram ('Hat on, hands in, wait for the bell'), Driftwood ('Lawn sharks... Mostly grass') and Sal ('Candyfloss is a vegetable'). Meanwhile good lore lines go unused: 'Driftwood has a hut now. We do not mention the sharks.', 'I tow. You hold on.', 'Eight acorns for a tube. Eleven if you want it to come back with you.'" Swap in the unused lore lines so each joke lands once.
- G3#21: "`candyfloss-dropped`: a beach ball, two gulls and a construction cone. There is no candyfloss. `souvenir-crates`: uses `mower-scrap-panel`. `tour-rope-and-a-hat`: a `site-barrier`, building-site tape on a pirate deck. `boots-by-the-bowl`: `court-boots`, which are basketball boots." Fix: "A dropped candyfloss on its stick, with gulls fighting over it. The lore's souvenir stall: tin hooks, a rubber seagull, 'Authentic' hats. A rope stanchion pair. Wellies."
- G3#22: "The lost-property sign is at (155, 1106) by Marram's Office; the hats are at (176-180, 1120)." Fix: pile the hats against the office counter, under the sign (the sign is now a plate on the office counter front at x about 150, z 1106.65).

## Read first
- `games/gnome-theft-auto/src/coast/life.ts` (all; the sound timers at the bottom were replaced by `ambience.ts` in epic A), `life.test.ts`.
- `src/coast/config.ts` (deck z 1102..1132; stalls at z 1105.5; pier handle x 296..304; the ship's deck x 276..324, z 1260..1276).
- `src/ambientGnomes.ts` (`createAmbientGnomes(scene, defs)` returns only `update`; it adds the models to the `scene` you pass), `src/interiors/index.ts` (`currentInterior()` returns the interior id or null), `src/coast/pirateShip.ts` (`QUEEN_CABIN_INTERIOR`).
- New prefabs: `packages/prefabs/src/catalog/gta-coast-town.ts` (`dropped-candyfloss`, `rubber-seagull`, `wellies`, `souvenir-rack`), `gta-coast-fair.ts` (`rope-stanchion`); existing `bird-gull`, `cargo-crate`, `saltbucket-boater`, `straw-boater`, `pointy-hat`, `fc-sun-hat`, `umbrella-hat`, `eye-patch`, `pirate-bandana`.
- Lore lines: `docs/lore/entries/apocrypha/saltbucket-boardwalk.md`, `the-last-tube.md`, `marram-teaspoon.md`, `spun-sugar-sal.md`, `driftwood-castaway.md`, `samphire-bilge.md` ("What gnomes say", "Everyday").

## Change: `src/coast/life.ts` (+ `life.test.ts`)
1. Bilge: resident at (300, 1168), `surface: 'rooftop'` (she stands on the handle deck), yaw PI (facing up the pier to the beach), bubble from her lore that is not the deck sign's joke (e.g. "Tours at noon. Ask me about midnight and I will ask you about noon."). Hide her while the player is in the cabin: create her with her own `createAmbientGnomes(bilgeLayer, [def])` where `bilgeLayer` is a `new THREE.Scene()` added as a child of `deps.scene` (a Scene can be a child object), and in `update` set `bilgeLayer.visible = currentInterior() !== QUEEN_CABIN_INTERIOR` (check what `currentInterior()` returns: an id or an object). Keep her out of `COAST_RESIDENTS` or filter her out of the main list so she is not made twice.
2. Bubbles (G3#20): Marram (at the wheel): a Marram lore line that is not on a sign there (e.g. "Six stalls, six prices, one change-counter. I count it twice."); Driftwood: "I tow. You hold on."; Sal: a line about pink ("Pink, or the other pink. There is no third pink." or the lore's own); give "Driftwood has a hut now. We do not mention the sharks." to another beach resident (e.g. Lookout Lenny or Bev Nell, swapping her current line). Check each new line against the signs within 15 m of the speaker (grep the coast signs) so nothing repeats.
3. Vignettes (G3#21): `candyfloss-dropped`: a `dropped-candyfloss` with 2-3 `bird-gull`s round it (one pecking, two squaring up), no cone; `souvenir-crates`: `cargo-crate`s with a `souvenir-rack` and a `rubber-seagull` on a crate, plus an "Authentic" hat (`saltbucket-boater` or a pirate hat) on top; `tour-rope-and-a-hat`: a `rope-stanchion` pair and the hat; `boots-by-the-bowl`: `wellies`. Check each spot is still clear of new stuff (stalls' keepers stand in front of the north row; the south row of rides is at z about 1122-1128: keep boardwalk vignettes on the walkway z 1110-1121 or move them).
4. Lost property (G3#22): the hats (straw boater, pointy hat, sun hat, umbrella hat, plus one more) piled on the deck against the office counter's front, at x 148.5-151.5, z 1107.0-1108.0, at different yaws, one on top of another (y + a few cm).
5. `life.test.ts`: update the residents tests (Bilge on the handle at the pier deck height, inside the rails), and keep "uses only prefab ids that exist" passing.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean.
- Shots (port 5544): `bilge:300,1150,0` (from the spur end looking down the handle: Bilge and her board; note the shot tool may put you under the deck: if so, take `bilge2:285,1150,0.6` from the beach), `office:150,1118,3.14159`, `floss:-120,1128,3.14159`, `ship:255,1180,0.47`.

## Out of scope
`stalls.ts` (keepers, the sign), `promenade.ts`, `pirateShip.ts`, `ambience.ts`, `ambientGnomes.ts`.
