Epic: FX12 · Issue P: prefabs (a lodge that reads from the slope, piste poles, snow fence, the Bear Deck)
Depends on: none
Model: Sonnet (modelling taste)
Port: 5526 (only if you use the prefab gallery: `npm run dev -w games/prefab-gallery -- --port 5526 --strictPort`)

(Paste of `_env.md` goes here when launched. Your files are in `packages/prefabs`, not the game.)

## Goal
Four prefab changes other workers place in Gnome Theft Auto (they guard with `getPrefab(id)` until yours land):
1. `woolly-sock-lodge` (edit, G4#10): it reads as a plain brown shed with a blank north gable and a sock too small to
   see from the slope. Add windows on every side (sides and back, same style as the two front ones: `c: 'yellow',
   glow: true`), and a much larger red-and-white striped sock hung from the roof ridge on the front gable side so it
   reads from 60 m (several stripes, a heel and a toe, maybe a dangling bobble). Keep the footprint, the porch, the
   door on +z, and the chimney exactly where it is (local x 3.0, z -1.2, top ~5.31: another worker puts smoke there).
2. `piste-pole` (new, `gta-winter-rides.ts`): a ~1.8 m piste marker pole, 5 cm thick, with alternating bands (`tint`
   for the main colour: callers tint it blue or red; dark bands between) and a small reflective top cap. Footprint r
   ~0.1.
3. `snow-fence` (new, `gta-winter-rides.ts`): a 4 m long, 1.2 m tall section of orange plastic snow fence along local
   x (from x -2 to 2), held by two wooden stakes at its ends, the mesh suggested by a few horizontal orange slats and
   thin vertical strips (boxes, not a texture). `tint` for the orange.
4. `bear-deck` (new, `gta-winter-lodge.ts`): a timber sun deck for five deck chairs: about 22 m wide (local x) x 6 m
   deep (local z), deck top at 0.25 m, planks along x with thin dark gaps (or alternating plank tones), a low rail
   (~0.6 m) on the back (-z) and both short sides, open on the front (+z), with two steps at the front centre.
   Footprint r ~11.5, h ~0.9. Mind the z-fight rule: plank boxes that touch must not share a face (offset tops by a
   few mm or vary heights).

## Read first
- `packages/prefabs/README.md` and `docs/roadmaps/prefab-library/_common.md` (the PrefabDef rules: parts, colours,
  `tint`/`trim`, footprint, `examine` lines, tags, the tests).
- `packages/prefabs/src/catalog/gta-winter-lodge.ts` (the lodge and the kit, the writing voice of `about` and
  `examine`) and `packages/prefabs/src/catalog/gta-winter-rides.ts` (the slalom flag, start hut).
- Lore for the examine lines: `npm run lore -- find "Woolly Sock"` and `npm run lore -- find "polar bear"` (the bears
  are "really chill"; Gentian Bootlace keeps the lodge; the Bear Deck sign says "They are not asleep.").

## Change
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: the lodge edit and `bear-deck`.
- `packages/prefabs/src/catalog/gta-winter-rides.ts`: `piste-pole` and `snow-fence`.
- If the catalog index or a golden/snapshot test lists ids, update it as the README says.

## Contract
Ids exactly `piste-pole`, `snow-fence`, `bear-deck`; `woolly-sock-lodge` keeps its id, its front door on +z, its
footprint and its chimney position.

## Done when
- `npm test -w packages/prefabs` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- Optional but wanted: a look in the prefab gallery (port 5526) or in the game (the lodge is at (-449, -1020)), with
  a screenshot you looked at.

## Out of scope
Any file under `games/` (other workers place these prefabs), other catalog files.
