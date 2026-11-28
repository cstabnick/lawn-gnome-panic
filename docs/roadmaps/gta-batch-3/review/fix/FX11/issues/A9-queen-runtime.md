Epic: FX11 A (coast fixes, parallel) · Issue A9: the Bathtub Queen lit at night, the chest under the bed, the cabin's sound (G3#9 lights, G3#12 Queen, G3#14 chest + line, G3#24 cabin)
Depends on: none · Agent: Sonnet · Dev port 5529

(The Environment section the lead gave you applies.)

## Goal
- G3#9 / G3#12: at night the Queen is a dark silhouette. Give her glowing stern windows, lanterns at her stern and bow and at the masthead, a short string of lantern bulbs along her rails, and warm light pools on her deck, all switching on at dusk.
- G3#14: "Step 2 says 'Open the sea chest where Bilge sleeps', and the finale says 'Under my own bed, the whole time'. The chest is at cabin local (3, -2), but the bed is at (-5.6, 2.8), in the opposite corner." and "The chest spot always says 'Not that one. That one is for the tourists.' Opening it during the quest therefore plays that line and then, at once, 'You found it.'" Move the chest to the foot of the bed, and only say the tourists line when the treasure quest is not on its chest step.
- G3#24: the cabin is `ambience: 'silent'`; it should hear the sea through the walls.
Keep: the moored-only Queen (R-185), "Tours at noon. Cargo at midnight.", the cabin's signs and Bilge's line.

## Read first
- `games/gnome-theft-auto/src/coast/pirateShip.ts` (all of it, 204 lines) and `pirateShip.test.ts`.
- `games/gnome-theft-auto/src/coast/nightLights.ts` (new: `nightGlowMat(color, peak?, day?)` returns a MeshStandardMaterial that is pale by day and glows at night; `lightPool(x, y, z, r, color?, peak?)` returns a flat additive disc mesh (decal layer, invisible by day) you add to the scene; `onCoastNight(fn)` per-frame hook with the eased night 0..1).
- `games/gnome-theft-auto/src/coast/config.ts` `COAST.ship` (deck x 276..324, z 1260..1276 at y -3.0; `treasureLocal: [3, -2]`).
- `games/gnome-theft-auto/src/quests/questSave.ts` `parseSavesJson(raw)` (per quest `{ state: 'active' | 'done', step }`); `src/societies/achievements.ts` lines 1-20 show reading `localStorage.getItem('gta-quests-v1')` safely.
- `games/gnome-theft-auto/src/interiors/types.ts` (interior `ambience?: BiomeId | 'silent'`; `'coast'` is a BiomeId).

## Change: `src/coast/pirateShip.ts` (+ its test), and in `src/coast/config.ts` ONLY the `ship.treasureLocal` value
1. Night lights in `buildPirateShip` (all meshes merged per material where you can; no real lights):
   - The `bathtub-queen` prefab is being reworked right now by another worker. Its contract: three stern windows on the stern face at prefab-local (x -0.25 / 0 / 0.25, y 0.55, z -1.47), each about 0.12 x 0.1; two stern lanterns at local (+-0.4, 0.82, -1.42). Local -> world for the placed hull (rotation.y PI/2, scale S = 16): world x = `hullX + lz * S`, world z = `SHIP.z - lx * S`, world y = `DECK_Y - 0.4 * S + ly * S`. Put a thin glowing pane (a box 0.05 m deep, slightly bigger than the window, `nightGlowMat(0xffc46b, 2.2)`) just outside each stern window, and a small glowing ball (radius about 0.45 m) at each stern lantern. If the prefab's windows end up elsewhere, read its `about:` line in `packages/prefabs/src/catalog/gta-coast.ts` and follow it.
   - A masthead lantern on the main mast (local z 0.2, near its top) and a bow lantern by the figurehead.
   - Lantern bulbs strung along the deck's north and south rails (every 3 m, small warm balls on a thin dark line at about rail height + 0.4).
   - Three `lightPool`s on the deck (radius 3-4 m) under the lanterns, added to the scene.
2. G3#14 chest: in `defineCabin()` the bed is `kit.put('bed', -5.6, 2.8, Math.PI / 2)`. Find the bed prefab's footprint (`getPrefab('bed')` or the interiors kit) and move `COAST.ship.treasureLocal` (config.ts) so the `wooden-chest` sits at the foot of the bed (or half under it), clear of the table and chairs; the `queen-treasure` spot follows it (`tz + 1.2` may need to become an offset that keeps the prompt reachable from the floor side). Keep the chest solid unless it now overlaps the bed's collider.
3. G3#14 line: in the `queen-treasure` spot's `run`, always dispatch `gta:queen-chest`, but dispatch the `gta:interior-say` "Not that one. That one is for the tourists." only when the treasure quest is NOT active on its chest step: read the quest save (`parseSavesJson(localStorage.getItem('gta-quests-v1'))['coast-queens-treasure']`, guarded with try/catch and `typeof localStorage`); skip the line when `state === 'active' && step === 1`. When the quest is done, say a different line instead: `'Empty. I spent it on rope. Good rope, mind.'`.
4. G3#24 cabin: `ambience: 'coast'` (the shore's bed heard through the walls) instead of `'silent'`.
5. Test: the new treasureLocal is within the cabin (size 14 x 10, so |x| < 6.5, |z| < 4.5) and within 2.5 m of the bed's foot; keep the existing tests passing.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast/pirateShip.test.ts src/coast/config.test.ts` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Shots (port 5529): `shipN:340,1182,-0.4 pierN:255,1180,0.47` with `http://localhost:5529/?time=night` (compare `c02-night-pier.png`), and the same two by day (compare `b01-ship.png`). The cabin: `http://localhost:5529/?interior=bathtub-queen-cabin` with a shot at `cab:0,0,0` if the tool supports it (if not, say so; the chest move is checked by the test).

## Out of scope
The `bathtub-queen` prefab itself (another worker), `src/coast/life.ts` (Bilge's resident, the ship vignettes), `src/coast/ambience.ts` (rigging sounds), the quest text (another worker).
