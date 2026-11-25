Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/estatesLife.ts` gives the three Even-Estates sites their story: nine small
vignettes (three per site, at the sites' `story` spots), joke signs on the hoardings, hard-hat crews walking their loop,
Chard Levelright at Plot 1, site sounds, and two things to press E on (knock on a show-home door, read the plans).

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `EVEN_ESTATES` (`story[3]`, `crewLoop`, `homes`, `hoarding`, `gate`,
  `caravan`, `hq`), `CountryPart`.
- `games/gnome-theft-auto/src/homes/pieces.ts`: `buildPieces`, `textPlate`.
- `games/gnome-theft-auto/src/campus/story.ts` (static vignettes and signs of the same kind) and
  `games/gnome-theft-auto/src/campus/life.ts` (walking people on routes, sleeping when far, `playAt`).
- `games/gnome-theft-auto/src/ambientGnomes.ts`: `createAmbientGnomes(scene, defs)`, `AmbientGnomeDef` (a standing gnome
  with a bubble line and an `idle` animation id; look at the ids used in `AMBIENT_GNOMES` for valid idles).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps` (you get `scene`, `player`, `hud`, `play`, ...).

The three sites (read real values from `EVEN_ESTATES`): construction-1 (-295, -120), gate west, Chard's caravan at
(-312, -102), story spots (-313, -129), (-293, -114), (-282, -124); construction-2 (195, 325), gate east; construction-3
(1050, 250), gate west, four show-homes.

## Change
`src/country/estatesLife.ts` (keep both exported signatures):
- `buildEstatesStory(scene, boxes)`: static vignettes, each within 4 m of its story spot, built from prefabs with
  `buildPieces` (colliders only for things taller than 0.5 m; keep a gnome-wide gap to walk round). Nine different ones,
  three per site; readable without text. Use existing prefabs (`acorn-hard-hat`, `site-plans-table`,
  `spirit-level-giant`, `clay-brick-pallet`, `mushroom-girder-stack`, `site-cone`, `wheelbarrow`, `brick-stack`,
  `bench`, `crate`, `thermos`-like or any mug/flask prefab you find with grep, `dandelion` or a small flower prefab,
  `lawn-chair` or `deck-chair`, `newspaper`/`tattler` prop if one exists: grep `packages/prefabs/src/catalog` for ids).
  Ideas (pick nine, vary them across sites):
  1. Lunch break: three identical lunchboxes in a perfect row on a girder, three acorn-cap hard hats beside them, one
     sandwich with a bite out of it (the one crew member who broke ranks).
  2. A single dandelion left standing in the middle of the levelled yard with a ring of four cones around it, and a
     spirit level lying next to it (nobody had the heart).
  3. The plans table with the top sheet blowing off toward the hoarding (two sheets on the ground, one caught on a cone).
  4. A spirit level balanced on a brick on a pallet, and a crew member's empty camp chair facing it (watching it all
     shift).
  5. A wheelbarrow tipped over with clay bricks spilled, and a "sorry" stack of bricks rebuilt perfectly beside it.
  6. A show-home's front step with a doormat, a milk bottle and a newspaper delivered to a house nobody lives in.
  7. A crane-bucket full of daisies set down on the ground (somebody's lunch-hour planting), at Plot 3 only.
  8. A tea urn on a trestle with nine identical mugs, one turned upside down.
  9. A half-buried garden gnome statue dug up from the old lawn, propped against the hoarding facing out, as if
     looking for the way home.
- Signs (`textPlate`, mounted 0.04 in front of a hoarding panel face, facing out of the site, at ~1.6 m, beige or white
  on pale blue): at least four per site, different per site, in the house voice. Examples: "LEVEL IS KIND",
  "HARD HATS MUST BE ACORN CAPS", "THORNE EVEN-ESTATES: A HOME WHERE NOTHING IS OUT OF PLACE, INCLUDING YOU",
  "NO WILDFLOWERS BEYOND THIS POINT", "THIS SITE HAS GONE 0 DAYS WITHOUT A CROOKED LINE", "SHOW-HOME OPEN (BY APPOINTMENT,
  NEVER)", "LEVELRIGHT CONSTRUCTION: WE BUILD WHAT THE PLANS SAY", "PLOTS FROM 1 TO 1".
- `installEstatesLife(deps): CountryPart`:
  - Two hard-hat crew gnomes per site walk `s.crewLoop` (walk-and-pause like `campus/life.ts`; look: brown acorn-cap
    hat 0x8a5a2b, orange vest shirt 0xe8731c, beige pants), pausing 3-5 s at each point; asleep (hidden, not stepped)
    while the player is more than 250 m from the site.
  - Chard Levelright (only where `s.hq`): a standing gnome by his caravan (2.5 m from `s.caravan` on the gate side)
    through `createAmbientGnomes` with look `{ hat: 0xd9c8a5, shirt: 0xe8731c, pants: 0x5a3e2b, beard: 0xb8b8b8 }`,
    name 'Chard Levelright', bubble "That wall is out of square. Everything else is fine.", idle any 'inspect' or
    'think'-like idle id you find valid.
  - A night watchman at each site after dark (`deps.timeLabel()` is 'Night' or similar: check the `TimeLabel` values in
    `src/atmosphere.ts`): one ambient gnome with a lantern standing at the gate inside (bubble "Site's closed. The
    houses are closed too. They're always closed.").
  - Sounds: while the player is within 120 m of a site, every 6-12 s play one of `country-site-hammer`,
    `country-site-mixer` (at the yard), `country-crane-whir` (at the crane) with `playAt` at that spot; daytime only.
  - `prompt(x, z)` / `interact(x, z)`: within 2 m in front of any show-home door ("Knock on the door" → toast "Nobody
    answers. Nobody has ever answered."; play `metal-clang` or any knock-like world sound quietly, or none) and within
    2 m of the plans table you placed at Plot 1 ("Read the plans" → toast "The plans show the same house forty times,
    and a note: DO NOT ASK WHO FOR."). Return true from `interact` only when you handled it.

## Contract
Both exported signatures unchanged; nothing placed within 1 m of a `crewLoop` leg or in the gate lane.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/flora src/sites.test.ts` passes.

## Out of scope
`src/country/estates.ts` (the structure: hoardings, homes, crane, yard, caravan), `src/country/types.ts`, every other
file.
