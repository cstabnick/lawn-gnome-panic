Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first (working directory, toolchain, parallel workers, rules).
Then read `docs/roadmaps/prefab-library/_common.md` for the prefab format and examine voice, but IGNORE its
"Environment" section (the working directory there is a different worktree) and its "Units" line: these are Gnome Theft
Auto world prefabs in LIFE-SIZE METRES (a gnome is about 1 m tall), like the other `gta-*` catalog files.

## Goal
The Unmown nature preserve's structures exist as prefabs: the ranger station building, a bird hide, the marsh boardwalk
pieces, the viewing platform, and three interior props.

## Read first
- `packages/prefabs/src/types.ts` (the `PrefabDef` / `Part` contract)
- `packages/prefabs/src/catalog/gta-continental-kit.ts` (finished GTA world prefabs in metres: copy the style)
- `packages/prefabs/src/catalog/gta-coast-kit.ts` (more buildings/structures in metres, e.g. a hut)

## Change
- `packages/prefabs/src/catalog/gta-preserve-kit.ts` (exists, exports an empty `GTA_PRESERVE_KIT`; it is already
  registered in `catalog/index.ts`). Fill the array with these prefabs. Category 'prop' (or 'furniture' where it fits),
  `uses: ['place']`, tags include 'gta', 'unmown', 'preserve' plus their nouns. Front faces +z, centred on x/z, lowest
  point at y 0. Give each a `footprint` like the examples.
  1. `unmown-ranger-hut` — the Unmown Ranger Station: a timber cabin 12 m wide (x) x 8 m deep (z) x ~5.5 m tall with a
     pitched moss-green roof (trim), plank walls (tint 'wood-light'), a covered porch 2 m deep across the front (+z) with
     two posts and a step, a front door at x 0 (dark panel on the front wall, no pivot needed), two windows, a stovepipe
     chimney, a small weather vane shaped like a dandelion, a blank name board above the porch 3 m x 0.6 m whose front face
     is at z = 4.0 + 2.0 + 0.06 (porch front) — state its exact centre in `about` so the game can put text 0.03 m in front.
     Keep it under 40 parts.
  2. `bird-hide` — a wooden bird hide 5 m wide x 3.5 m deep x 2.8 m tall: plank box (tint), sloped roof (trim, mossy
     green), a long dark horizontal viewing slot across the FRONT (+z) wall at 1.3-1.6 m height (a thin dark box set 0.02 m
     proud of the wall), a door on the back (-z) wall, a little bench inside visible through the slot is optional.
  3. `marsh-boardwalk-deck` — one 3 m section of raised boardwalk: deck 2.0 m wide (x) x 3.0 m long (z), 0.12 m thick,
     deck TOP at y 1.0, four round posts from y 0 to the deck underside at the corners (inset 0.1 m), cross planks
     suggested by 3-4 thin darker strips on top (lifted 0.01 m; they are boxes so no z-fight). tint 'wood', trim 'wood-light'.
  4. `marsh-boardwalk-rail` — one 3 m rail section along z: two posts 1.0 m tall at z ±1.45, a top rail and a mid rail,
     lowest point y 0 (it stands ON the deck; the game lifts it).
  5. `viewing-platform` — 8 m (x) x 6 m (z) deck, TOP at y 1.0, posts underneath, a railing on the +z, +x and -x sides
     (the -z side is open where the boardwalk arrives), a bench on the deck and a coin-free telescope on a post at the +z
     rail. Lowest point y 0.
  6. `specimen-jar` — interior prop: a big glass jar (pale blue-green, slightly transparent look via a light colour) of
     uncut grass, 0.5 m tall, cork lid, a paper label.
  7. `display-case` — interior prop: a waist-high glass-topped display case 1.6 x 0.7 x 1.1 m with a rusty mower blade
     inside (grey/rust shapes under a pale glass box).
  8. `lost-hat-box` — interior prop: an open crate 0.8 x 0.6 x 0.5 m overflowing with confiscated HOA hats (small
     cylinders/cones in black and red) with a tag.
  Each needs 5-6 examine lines in the Gnomes of Gnomomia voice (see the prefab common doc). Theme: the preserve no one has
  mown; rangers who protect it from mowers and from the HOA's hat-wearing inspectors. Keep it warm and dry-funny.

## Contract
Prefab ids exactly as above (other workers place them by id). Deck tops at y 1.0 for `marsh-boardwalk-deck` and
`viewing-platform`. `bird-hide` slot faces +z.

## Done when
- `npm test -w packages/prefabs` passes for these ids (if it fails only on ids from another `gta-living-*`,
  `gta-preserve-trail` or `gta-hamlet-kit` file, that is another worker mid-edit: rerun once, then report it).
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` has no errors from your file.

## Out of scope
Every other catalog file, `catalog/index.ts`, anything under `games/`.
