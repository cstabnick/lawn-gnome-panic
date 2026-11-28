Epic: FX11 A (coast fixes, parallel) · Issue A3: Saltbucket strand prefabs (beach scenes, Saltcut, Last Tube dressing, the fishing smack)
Depends on: none · Agent: Sonnet (modelling taste) · No dev server needed (gallery optional: `npm run dev -w games/prefab-gallery -- --port 5523 --strictPort`)

(The Environment section the lead gave you applies.)

## Goal
Add the beach-scene kit to `packages/prefabs/src/catalog/gta-coast-beach.ts` (exists with an empty `GTA_COAST_BEACH` array, already registered in the catalog index). Other workers place these by these exact ids.

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`, `docs/roadmaps/prefab-library/_common.md` (format and modelling rules: lowest point y = 0 +-0.03, centred, front +z, `at` = centre, `rot` in degrees, 40 parts max).
- `packages/prefabs/src/catalog/gta-coast-kit.ts` and `gta-coast.ts` (same look and examine voice: five lines, a look line, a saying, a "Tip:", a "Joke:", an odd detail).
- Existing ids you must NOT duplicate (reuse is the game's job): `walnut-dinghy`, `dayg-story-sunken-boat`, `critter-crab`, `garden-rock`, `reed-clump`, `reed-bed`, `wooden-post`, `rope-coil`, `life-ring-back`, `tow-buoy`, `buoy-pennant`, `picnic-blanket-spread`, `deck-chair`, `beach-umbrella`.

## Change: `packages/prefabs/src/catalog/gta-coast-beach.ts`
Add (category `'prop'`, `uses: ['place']`, tags include `'saltbucket'`, `'beach'`, `'gta'`, `emoji: []`, an `about:` line with the built size at scale 1 and the origin, five examine lines). Game scales in brackets.

1. `groyne` (scale 3): a timber sea groyne section 3.0 long along z (it runs down the beach into the sea): a row of 8-10 weathered upright piles (`0x6b5a45`, `0x5a4a38`, uneven heights 0.3-0.5) with two horizontal planks bolted along them, a little green weed (`0x4f6b3a`) at the foot of the seaward piles (+z end). Lowest point y 0.
2. `rowing-boat` (scale 2.5): a small clinker rowing boat pulled up on the sand, about 1.4 long (along z, bow +z), tilted a little onto one side (rot z about 8 deg): hull from boxes/wedges (white with a blue `0x2f6fa8` stripe), two thwarts, a pair of oars lying across, a painter rope trailing from the bow. Lowest point y 0.
3. `rock-pool` (scale 3): a ring of 6-8 rounded rocks (squashed balls `0x7d7a72`, `0x8e8a80`, weed `0x4f6b3a`) about 1.2 across around a low flat disc of shallow water (`0x6fa8b8`, a `cyl` 0.02 tall, its top at y 0.03), a starfish (5 thin boxes, orange) on one rock. Lowest point y 0.
4. `windbreak` (tint = canvas stripes): a striped canvas windbreak about 1.6 long along x, 0.7 tall, on 5 wooden poles, gently zig-zagged (each panel turned +-10 deg), tint/white stripes.
5. `wreck-rib` (scale 4): the bleached ribs of an old wreck half-sunk in sand: a keel timber along z (1.8 long) and 5 curved ribs (each 3-4 boxes making a U open to the sky) of decreasing size, `0xb8ac94`/`0x9e927a`, one rib broken. Lowest point y 0.
6. `lifebuoy-post` (scale 2): a short red-and-white post (0.9 tall) with a lifebuoy (`ring`, red `0xd8342c` with 4 white bands) hung on a hook and a little "IN EMERGENCY" plate (a white box). Front faces +z.
7. `fishing-winch` (scale 2): a beach capstan winch: a wooden drum on a frame with four handle spokes, a rope wound round it leading off along +z, a stake in the sand; about 0.6 tall.
8. `saltcut-daymark` (scale 4): a tiny lighthouse / daymark: a striped red-and-white tower (cylinders stacked, about 2.0 tall, 0.35 across at the base), a little gallery ring, a lantern room on top (a short `cyl` of `glass` with `glow: true` amber `0xffc46b` light inside), a cone cap, standing on a rocky base. Front +z.
9. `fishing-smack` (scale 6): a small sea-going fishing boat seen far out: hull 2.0 long along z (bow +z, dark `0x3b4a5a` with a red waterline band), a wheelhouse aft (white box with dark windows), one mast with a tan `0xb06a3a` sail, a little net boom. Its waterline is y 0.15 (the hull bottom at y 0); say so in `about`.
10. `lawn-shark-fin` (scale 2): a fibreglass shark fin made of grass: a grey-green wedge fin (`0x5f7a4a`, a `wedge` or 2-3 rotated boxes) with a ragged trailing edge and a tuft of grass on the tip, on a little flat mount (it goes on a hut roof). About 0.5 tall, 0.5 long.
11. `driftwood-pile` (scale 2): a heap of 6-8 bleached driftwood planks and branches leaning together, `0xb8ac94`, `0xa89c84`, `0xc8bca4`, about 0.8 long, 0.4 tall.
12. `hung-net` (scale 2): a fishing net hung to dry between two posts: posts 1.2 apart along x, 1.0 tall, the net as a sagging grid (thin boxes in `0x5a6b5a`) with three cork floats (small balls `0xc9a06a`).
13. `oar-pair` (scale 2): two oars crossed and leaning, blades up, blue blades; about 1.2 tall.
14. `x-marker-post` (scale 2): a crooked wooden marker post (0.8 tall) with a red rag tied on top and a shovel leaning against it.
15. `towel-line` (scale 2): a washing line between two short posts 1.4 apart along x (0.9 tall), with three beach towels hanging from it (thin boxes 0.35 wide x 0.5 tall x 0.02, striped: red/white, blue/yellow, green/white), one hanging crooked, and a peg or two.

## Contract
The 15 ids above, exactly. Each on y = 0 at its origin, centred, front +z (bow +z for boats). Built size in each `about:`.

## Done when
- `npm test -w packages/prefabs` passes.
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in `packages/prefabs`.

## Out of scope
Every other catalog file and `index.ts`; the game code.
