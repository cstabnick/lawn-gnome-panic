# E26 meet screenshots

Shot with `node tools/gta-shots.mjs "http://localhost:5337/?offline" docs/roadmaps/gta-batch-3/E26/screens <name>:<x>,<z>,<yaw>` (camera looks along (sin yaw, cos yaw)), 960x600, noon, on foot.

## Shots (screens/)
- skyway-foot-1.png (-292,-20, yaw 3.14): wide from the grid road; scrap car on blocks, boombox, crowd, signs in the distance.
- skyway-foot-2.png (-290,-40, yaw 3.6): signs (NO RACING / ALL BETS IN ACORNS / CAR BOOT SALE) and the pit corner.
- skyway-foot-3.png (-275,-40, yaw 2.6): the grid lamp vignette, hubcap wall, drums, organiser area.
- skyway-foot-night.png (-285,-45, yaw 3.4, `?time=night`): after dark, lamps, tyre stack, signs, night crowd. Night is forced with `?time=night`.
- pardonlin-1.png (-1696,-91, yaw -1.57): wide from the closed road: cones, marshals, cafe tables, geraniums, signs, the square's frontage.
- pardonlin-2.png (-1712,-98, yaw -1.57): LA BOUCLE sign, bistro table and chairs, tyre pile by the bookie, spectators.
- pardonlin-3.png (-1712,-86, yaw -1.3): bench, tree and bollards, PARIS sign, Commissaire Fonce at the flag-dropper's cones.
- saltbucket-1.png (925,140, yaw 1.57): wide from the band road: signs along the lay-by, stall, crowd at the kerb.
- saltbucket-2.png (958,148, yaw 1.57): snack van stall, candyfloss cart, CHIPS and SALTBUCKET signs.
- saltbucket-3.png (960,128, yaw 1.2): sandcastle, beach umbrella and ball, BETS sign (deckchair bookie), MIND THE GULLS.

## Acceptance checklist
- Skyway Foot: vignettes hubcap wall, pit corner, grid lamp (3). Signs: SKYWAY FOOT, NO RACING, ALL BETS IN ACORNS, CAR BOOT SALE. Resident Verbena Plimsoll checks tyre pressures. Sound: crowd-murmur (louder at night), night crowd and lamps after dark.
- Quai de la Boucle: vignettes cafe grandstand, cone count, marshals' post (3). Signs: LA BOUCLE DE PARDONLIN, NO OVERTAKING, PARIS (bets are small envelopes), COMMISSAIRE (Form 7). Residents at the cafe and marshals. Sound: crowd-murmur.
- Saltbucket Lay-By: vignettes snack van, sandcastle line, plus the third from cast (3). Signs: SALTBUCKET LAY-BY, CHIPS, MIND THE GULLS, BETS (deckchair). Residents sell chips / mind the stall. Sound: crowd-murmur.

## Fixes made
- cast.ts: sign headlines that wrapped over their sub line (WATCH: ASK ME..., PRIERE DE NE PAS DEPASSER, TOUT PARI..., COMMISSAIRE: ..., BETS TAKEN...) shortened, jokes moved to the sub line.
- No floating, sunk or road-standing props found in the shots; no meetScene.ts or meets.ts change needed.

## Still rough
- Sign plates wrap a long headline into the sub text (plate() in pardonlin/town.ts, not ours); NO OVERTAKING still clips slightly.
- Saltbucket and Pardonlin read sparse from the road (props are small against the open lawn/square).
- `npm run zfight` only checks the spawn area, so the meets were not z-fight scanned; vignette props are not flat decals.
- Resident behaviours (Verbena etc.) are idle poses, not scripted actions.
