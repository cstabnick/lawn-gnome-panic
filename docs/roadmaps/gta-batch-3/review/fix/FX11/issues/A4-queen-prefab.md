Epic: FX11 A (coast fixes, parallel) · Issue A4: The Bathtub Queen as a bath toy (prefab), finding G3#9 (shape half)
Depends on: none · Agent: Sonnet (modelling taste) · Dev port 5524

(The Environment section the lead gave you applies.)

## Goal
The `bathtub-queen` prefab reads, from the beach 100 m away, as a bright BATH-TOY pirate ship, not a red box barge: rounded bathtub-like hull with a roll-top rim, bigger slightly billowed sails turned so the skull faces the beach, a real rubber-duck figurehead (head, bill, eye), a Jolly Roger flag, a plug-chain anchor line, and stern windows. Editor's words: "The 3 m toy prefab, scaled about 16 times, is a flat red box hull with two small sails. From the shore the sails are edge-on and grey. The duck figurehead is one yellow ball. There is no flag colour and no lanterns." Keep the moored-only Queen and the "Tours at noon. Cargo at midnight." joke (not your file, just do not change her into something else).

## Read first
- `packages/prefabs/src/catalog/gta-coast.ts`: the current `bathtub-queen` def (edit it in place) and its siblings.
- `packages/prefabs/src/types.ts`, `docs/roadmaps/prefab-library/_common.md` (format and rules; 40 parts is the hard maximum per prefab: plan your parts).
- `games/gnome-theft-auto/src/coast/pirateShip.ts` `buildPirateShip`: how the game places it (read only, do not edit): `rotation.y = PI/2`, scale 16, `DECK_Y - 0.4 * S` so the prefab's deck top must stay at local y 0.4; local z maps to world +x (bow east), local +x maps to world -z, which is the BEACH side (north). The game's colliders assume: hull 3.0 long (local z about -1.55..1.45) and 1.0 beam (x +-0.5), deck top y 0.4, stern cabin at local z -1.45..-0.85, beam +-0.45, 0.35 tall (top y 0.75), main mast at local z 0.2 and fore mast at z 0.9 (1 m thick in the world, i.e. about 0.03 local). Keep all of those where they are.

## Change: `packages/prefabs/src/catalog/gta-coast.ts` (only the `bathtub-queen` entry)
- Hull: still red `0xd8342c`, but rounded like a toy bathtub: round off bow and stern (e.g. a squashed `pill` or `cyl` laid along z for the bilge, or a box body with half-cylinder ends), a fat white roll-top rim (a rounded `pill`/`cyl` band, `0xf4f0e6`) running round the deck edge at about y 0.4-0.45, yellow trim line kept. Deck planks (`wood`) at the top, top surface exactly y 0.4 (the walkable deck is a separate invisible rooftop at that height; nothing may stick up through the deck between local z -0.8 and 1.3 except the masts, the stern cabin and a low rim at the edge, because players walk there).
- Sails: bigger (main about 1.0 x 0.75, fore about 0.75 x 0.55), white `0xf4f0e6`, each made of 2-3 slightly angled panels so it billows; turn both sails about 35 degrees about y (rot y) so their face shows to local +x (the beach side). The skull-and-crossbones goes on the main sail's +x-facing side (black disc or box skull, two white eye balls, two crossed white bones). Yards (wood) across the top of each sail.
- Jolly Roger: a black flag (box, `0x1b1b1b`) on the main mast top with a tiny white skull, plus a red pennant on the fore mast.
- Figurehead: a rubber duck at the bow (local z about 1.5-1.6, y 0.4-0.6): a yellow `0xffd23f` body ball, a head ball, an orange `0xf08a24` flat bill (squashed box or cone), black eyes (`mirror: true`), and a little pirate bandana or patch for the joke.
- Stern: the cabin keeps its place; add a row of three stern windows on the stern face (local z about -1.46, y about 0.55, each about 0.12 x 0.1, `glass`) and two lanterns (small `cyl` or `ball` in `0xffc46b`, NOT `glow`: the game lights them at night) on the cabin's aft corners at about (+-0.4, 0.82, -1.42). State in `about:` the local positions of the stern windows and the two lanterns (the game puts night-glow meshes there).
- Plug-chain: a bath-plug (a black `cyl` disc) on a chain (5-6 small `ring`s or balls in `iron`) hanging off the bow down to the waterline, as the anchor line's joke.
- Keep it under 40 parts. Update the `about:` (sizes, deck top y 0.4, bow +z, beach side +x) and keep five examine lines (you may refresh one to mention the plug).

## Contract
Same id `bathtub-queen`; same bounds the game relies on (above). The `about:` names the stern-window and lantern positions.

## Done when
- `npm test -w packages/prefabs` passes.
- You looked at it in the game: dev server on port 5524, shots `node tools/gta-shots.mjs http://localhost:5524/ <dir> qbE:340,1182,-0.4 qbW:255,1180,0.47` and the same spots with `http://localhost:5524/?time=night`; compare with the editors' `a07-pierbeach.png` and `b01-ship.png`. From the beach (340, 1182) the skull, the duck and the flag must read. Iterate.
- `cd games/gnome-theft-auto && npx vitest run src/coast/pirateShip.test.ts` passes.

## Out of scope
`src/coast/pirateShip.ts` (another worker adds the lanterns' night glow and the cabin changes there), other catalog files.
