Epic: FX11 A (coast fixes, parallel) · Issue A1: Saltbucket town prefabs (bucket, spade, marram grass, stall wares)
Depends on: none · Agent: Sonnet (modelling taste) · No dev server needed (use the prefab gallery only if you want: `npm run dev -w games/prefab-gallery -- --port 5521 --strictPort`)

(Paste of `_env.md` applies: see the Environment section the lead gave you.)

## Goal
Add the prefabs Saltbucket's town needs to `packages/prefabs/src/catalog/gta-coast-town.ts` (the file exists with an empty `GTA_COAST_TOWN` array and is already registered in the catalog index). Other workers will place them in the game by these exact ids.

## Read first
- `packages/prefabs/src/types.ts` (the format: `PrefabDef`, `Part`, shapes `box | cyl | cone | ball | ring | pill | wedge`, what `d` means for each, `glow`, `mirror`, `scale`, `tint`/`trim`).
- `packages/prefabs/src/palette.ts` (colour names).
- `packages/prefabs/src/catalog/gta-coast.ts` and `gta-coast-kit.ts` (same game, same style and examine voice: five lines: a look line, a "saying", a "Tip:", a "Joke:", a small odd detail).
- `docs/roadmaps/prefab-library/_common.md` (modelling rules: 1 unit = one gnome's height; lowest point at y = 0 (+-0.03); centred on x and z; front faces +z; `at` is the centre; `rot` in degrees; 3-15 parts typical, 40 max; low `seg`).

## Change: `packages/prefabs/src/catalog/gta-coast-town.ts`
Add these PrefabDefs (category `'prop'`, `uses: ['place']`, tags include `'saltbucket'` and `'gta'`, `emoji: []`, an `about:` line that states the size and the origin convention, five examine lines in the voice). Sizes are at scale 1; the game scales the giant ones up (scale given). Big structures stay at most 3 units on a side.

1. `giant-bucket-rim-arc` (game scale 20): one 120-degree arc of the rolled rim of a giant galvanised tin bucket, as it breaks out of sand. Exact convention: the arc runs from angle -60 deg to +60 deg around a centre at local (-1.0, 0, 0), radius 1.0, so its middle point is at local (0, y, 0) and its ends at about (-0.5, y, +-0.866). Build it from 8-10 short boxes (or pills) laid tangent along the arc, each with a rolled lip: a thick tube (radius about 0.05) plus a thinner band below it (the bucket wall, about 0.1 tall, 0.02 thick) in `0xb9c2c8` / `0x9aa6ad` (galvanised grey, a little rust `0x8a5a3a` on one or two segments). The middle of the arc stands highest (the tube's top at about y 0.12) and the last two segments at each end dip down into the ground (their centres at y about 0.02 and -0.02, rotated so they slope down), so it reads as a rim sinking into sand at both ends. The test needs the lowest point at y 0 (+-0.03): make sure the lowest part's bottom is at y = 0 (raise everything if needed). Two small lug ears (`ring` or box with a hole look) on the arc's middle, outside face, where the handle hooks in.
2. `giant-bucket-handle` (game scale 20): the bucket's wire handle as an arch. Spans local x -1.0..1.0 (the lugs, at y 0), rising to an apex at x 0, y about 0.7. Build from 10-14 thin boxes or cylinders (radius about 0.025) along a smooth arch (an ellipse quarter each side), galvanised grey `0xb9c2c8`, with a fat wooden grip in the middle (a `pill` or `cyl` along x, radius 0.05, length 0.35, `wood`). Small hook ends at each foot. Lowest point y 0.
3. `giant-spade` (game scale 8): the Tall One's toy beach spade stuck blade-down in sand, so only the top shows: a red plastic (`0xd8342c`) shaft (radius 0.04, about 1.4 long) leaning a little, a T or D-grip at the top, and the top 0.15 of a broad blade at the bottom (box 0.5 wide x 0.15 tall x 0.04) disappearing into the ground at y 0. Front faces +z. Lowest point y 0.
4. `marram-grass` (game scale 1.5-3): a tuft of bleached dune grass, about 0.5 tall, 0.4 across: 7-11 thin tall cones or flattened boxes splaying out from a base at different lean angles, two tints of pale straw-green (`0xc9c28a`, `0xa9b07a`) and one dry `0xd8cfa0`. Lowest point y 0.
5. `dune-fence` (game scale 2): a weathered sand fence section, 2.0 long along x: two leaning posts and 9-12 grey, sun-bleached slats (`0xb8b2a4`, `0x9e978a`) of uneven height, a wire line top and bottom, one slat missing, one leaning. Lowest point y 0. Centred.
6. `pickle-barrel` (scale 2.4 on the counter): a small brine barrel with an open top showing green gherkins (a few `pill`s in `0x6f8f3a`) in pale green brine (a disc `0xb7c98a`), a ladle; about 0.35 tall.
7. `cone-bucket-tray` (scale 2.4): a tray holding three small tin buckets, each with an ice-cream cone (cone + scoop ball: vanilla `0xf4ead0`, "sand-coloured" `0xd8c08a`, pink `0xf2a1b8`) and a tiny spade sticking out; about 0.4 wide, 0.3 tall.
8. `fortune-shell` (scale 2.4): a big scallop shell standing on its hinge on a little stand, with a white paper strip curling out of it; about 0.35 tall.
9. `stub-shelf` (scale 2.4): Marram's Office ledger shelf: a short wall shelf unit (two shelves, about 0.7 wide, 0.6 tall, 0.18 deep) packed with ledger spines (boxes in dull reds, greens, browns) and a spike of paper stubs; front faces +z.
10. `dropped-candyfloss` (scale 2-3): a candyfloss on its paper stick dropped on the ground: a pink fluffy ball (2-3 overlapping squashed balls `0xf7a8c8`, one a little `0xf2c8dc`) lying on its side with the white stick poking out, about 0.25 long. Lowest point y 0.
11. `rubber-seagull` (scale 2-3): a squeaky rubber gull toy (white body, grey wing tops, yellow beak, on a little squashed base), about 0.2 tall.
12. `wellies` (scale 2-3): a pair of green wellington boots standing side by side (use `mirror: true`), one slumped/folded at the top, about 0.3 tall, `0x3f6b3a`, black soles.
13. `souvenir-rack` (scale 2): a spinning souvenir stand: a post with three tiers of tin hooks (small `cone`s / bent boxes in `iron`), two rubber seagulls and two straw "Authentic" pirate hats (black tricorn-ish caps) hanging on it; about 1.0 tall.
14. `fare-tin` (scale 2-3): a dented tin money box with a coin slot, on a short post, about 0.6 tall, painted blue `0x2f6fa8` with a white stripe.
15. `spokewheel-bell` (scale 2.2): a brass ship's bell (`cone`/`cyl` in `0xc9a227`) hanging from a small wooden gallows on a post, with a pull rope; about 1.2 tall, 0.5 wide; the bell mouth about 0.75 up. Front faces +z.
16. `chalk-tour-board` (scale 2): an A-frame chalkboard (two boards leaning together, black faces `0x2b2b2b` with a wooden frame), about 0.9 tall, 0.6 wide; a little white chalk scribble (two thin white boxes) on the front face. The game prints its text on a plate in front of it, so keep the front board face flat and unobstructed: say in `about` the front face's centre height and its depth (the z of its outer surface at that height, and the board's lean angle).

## Contract
The 16 ids above, exactly. Each stands on y = 0 at its origin, centred on x and z (except as stated for the rim arc), front +z. Put the sizes, as built at scale 1, into each `about:` line (other workers read them).

## Done when
- `npm test -w packages/prefabs` passes (fix any of your prefabs it flags: ground contact, examine lines, colours, sizes).
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in `packages/prefabs`.

## Out of scope
Every other catalog file (`gta-coast.ts`, `gta-coast-beach.ts`, `gta-coast-fair.ts` and `index.ts` belong to other workers or are done). The game code.
