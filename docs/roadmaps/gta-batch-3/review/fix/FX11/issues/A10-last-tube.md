Epic: FX11 A (coast fixes, parallel) · Issue A10: the Last Tube faces the sea and looks like Driftwood's (G3#19, D58)
Depends on: none · Agent: Sonnet · Dev port 5530

(The Environment section the lead gave you applies.)

## Goal
Editor (G3#19, a must under D58): "The hut is the stock blue `beach-hut` (the stage says 'Driftwood's driftwood hut') and it faces north, so from the beach and the water it is a plain blue back wall. The price sign also faces north, so from the beach its back is a large grey board. None of the lore notices are placed: 'Refunds: stories only', 'NO TUBES IN THE BOWL', 'IF YOU LOSE YOUR HAT, I'LL LOOK FIRST', the driftwood rack tags." Fix: turn the hut to face the sea (customers come back from the water), dress it as a castaway's driftwood hut (driftwood planks, nets, oars, a lawn-shark fin on the roof), make the signs readable from both sides, place the lore notices.

## Read first
- `games/gnome-theft-auto/src/tubing/view.ts` `buildLastTube()` (lines ~262-282; the rest of the file is the tubing ropes/NPC view: do not change it).
- `games/gnome-theft-auto/src/coast/config.ts` `COAST.lastTube` (hut (150, 1150) yaw PI, rack (150, 1172) where the "rent a tube / skis" E prompt is, launch (150, 1224); tube 8, skis 11).
- `games/gnome-theft-auto/src/coast/sign.ts` `coastSign(text, { w, h, post, bg, fg, back? })` (another worker is making free-standing signs print both faces by default; you may pass `back: '<second joke>'`).
- Lore: `docs/lore/entries/apocrypha/the-last-tube.md` ("Everyday" lists the price board, the notices and the house rule "I tow. You hold on.") and `driftwood-castaway.md`.
- Prefabs: `packages/prefabs/src/catalog/gta-coast-kit.ts` `beach-hut` (1.4 x 1.1 x 1.2 at scale 1, door on +z, `tint` = walls, `trim` = trim) and `water-ski-rack`. Being added right now in `gta-coast-beach.ts` (guard every id with `getPrefab`): `lawn-shark-fin` (a grassy fin on a small flat mount, about 0.5 tall and long, for a roof), `driftwood-pile` (bleached planks leaning, about 0.8 x 0.4), `hung-net` (a net drying between two posts 1.2 apart along x, 1.0 tall), `oar-pair` (two crossed oars, about 1.2 tall). Existing: `rope-coil`, `life-ring-back`, `tow-buoy`, `wooden-post`.

## Change: `src/tubing/view.ts` (`buildLastTube` only; plus `view.test.ts` if useful)
1. Turn the hut so its door faces the sea (yaw 0: +z, south). Tint it driftwood: walls a weathered grey-tan (e.g. `tint: 0xb8ac94`, `trim: 0x8a7a5e`) so it no longer reads as the stock blue hut. Keep its position (150, 1150); keep a solid collider if it had one (it did not; add `world`-free: do not add colliders here unless view.ts already has access to boxes; it does not, so skip).
2. Dress it: a `lawn-shark-fin` on the roof ridge (scale about 2.5-3, sitting on the roof, the joke visible from the beach), a `driftwood-pile` leaning on one side wall, a `hung-net` drying between the hut and the rack, an `oar-pair` by the door, a `rope-coil` and a `tow-buoy` on the sand. Hand-place each with its own yaw; nothing in the 3 m round the rack (150, 1172) or on the line from the rack to the sea.
3. Signs (via `coastSign`; all free-standing ones print both faces):
   - The price board, moved so it faces the beach/sea side where customers come back, readable from the boardwalk side too: front `"THE LAST TUBE\nTubes 8 · Skis 11\nWake ramp: yours to find"`, back `"Driftwood tows.\nDriftwood is not sorry."`. Under it a small plate `"Refunds: stories only."`.
   - `"NO TUBES IN THE BOWL"` on a post by the water's edge facing the sea (the pier bowl is east of here).
   - `"IF YOU LOSE YOUR HAT,\nI'LL LOOK FIRST"` fixed on the hut wall by the door (`post: 0`, mounted 0.03 m proud of the wall).
   - `"I TOW. YOU HOLD ON."` over the rack.
   - The rack's driftwood tags: 3-4 tiny plates (`w` about 0.5, `h` 0.18) on the `water-ski-rack` with owner names and dates in Driftwood's voice (e.g. "BEV · TUES", "NOT YOURS", "LENNY · ONE DAY").
4. Keep `registerCull(obj, 'prop')` on everything you add.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/tubing` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your file.
- Shots (port 5530): `tube:150,1200,3.14159` (from the water's edge looking at the hut: compare the editors' `a09-lasttube.png`), `tubeN:150,1135,0` (from the boardwalk side), `tubeP:150,1200,3.14159 --size 390x844` (compare `p03-phone-tube.png`). No blank wall or blank board facing the sea. Iterate.

## Out of scope
The rest of `view.ts`, `tubing/runtime.ts` (another worker), `coast/*`.
