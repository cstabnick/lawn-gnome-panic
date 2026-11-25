Epic: 3 Life and quests (runs alongside epic 2)
Depends on: epic 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Worker: Sonnet. At the same time other workers build
`src/coast/boardwalk.ts` (the deck, six stalls along z ~1100, lamps, benches, signs, beach huts at x -300..-180, umbrellas,
a lifeguard chair at (60, 1170), sandcastles, Long Spoon Pier as walkable rooftops at y `COAST.pier.deckY` with Marram's
hut on the bowl), `src/coast/spokewheel.ts` (the wheel and its ride), `src/coast/pirateShip.ts` (the moored ship, its deck
rooftop at `COAST.ship.deckY`, cannons, a cabin interior with Captain Bilge inside), `src/tubing/runtime.ts` (the Last
Tube hut at `COAST.lastTube.hut` and its racks) and `src/quests/*`. You own only `src/coast/life.ts` and
`src/coast/life.test.ts`. Keep clear of those builders' spots (stay >= 4 m from stall fronts, the racks, the wheel
platform and the pier gangplank).

## Goal
Saltbucket Shore feels lived in (acceptance criteria for every new area): at least three readable story vignettes in each
of the four districts (boardwalk, pier, beach, pirate ship) told with props and no text, residents doing things specific to
the place, and ambient sound — plus map blips for the boardwalk and the pier.

## Read first
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST` positions; `COAST.soundSpots`), `src/coast/life.ts` (stub: keep
  `installCoastLife(deps: JobsDeps): CoastPart`), `src/coast/types.ts` (`CoastPart`: `update`, `blips`).
- `games/gnome-theft-auto/src/ambientGnomes.ts`: `AmbientGnomeDef`, `AMBIENT_GNOMES` (examples of a resident doing a
  thing), `createAmbientGnomes(scene, defs)` returning `{ update(dt, px, pz) }`, `makeBubbleSprite(name, text)`.
  Use `createAmbientGnomes(deps.scene, COAST_RESIDENTS)` with your own defs (do not edit ambientGnomes.ts).
- `games/gnome-theft-auto/src/sound/bus.ts` `playAt(id, pos, { bus: 'ambience' })` and `src/sound/ids.ts`
  `REGION_SOUNDS` (`surf-wash`, `buoy-bell`, ...): play surf along the shore and the buoy bell offshore now and then
  (randomised 8-20 s), only within ~120 m of the player.
- `games/gnome-theft-auto/src/pardonlin/wickets.ts` `place()` (prefab placement on the ground) — and for props on a deck
  (pier, ship) set `obj.position.y` to the deck height instead of `placeOnGround`.
- `games/gnome-theft-auto/src/cull.ts` `registerCull(obj, 'prop')` (things added after the world is built must register).
- `docs/lore/entries/apocrypha/saltbucket-boardwalk.md`, `long-spoon-pier.md`, `the-bathtub-queen.md`,
  `marram-teaspoon.md`, `samphire-bilge.md`, `driftwood-castaway.md`, `driftwoods-shark.md` (if present) for who lives
  here and running jokes (Driftwood's "lawn sharks", the Lucky Limpet's one fortune, the barnacled spoon).
- `docs/rendering.md` (flat props: towels, spilled things, footprints use `flatLayer(material, LAYER.decal or a ground
  layer)`; never coplanar boxes).

## Change
`src/coast/life.ts`:
1. **Vignettes** (props only, `@lawn/prefabs`; browse ids in `packages/prefabs/src/catalog/gta-coast*.ts`, `props.ts`,
   `gta-world*.ts`, `gta-street-kit*.ts`; `getPrefab(id)` guards a missing id). At least 3 per district, e.g.:
   - Boardwalk: a dropped candyfloss (a pink ball prop on the planks) with two `bird-gull`s standing over it and an empty
     paper cone; the tin shy's cans all standing and a heap of thrown balls beside a sulking gnome's hat; a lost hat on a
     bench with a stack of other lost hats beside the office (the "LOST PROPERTY" joke).
   - Pier: a fishing rod propped on the rail with its line taut, an empty bucket and a single sock; a pair of boots at the
     bowl's edge, neatly side by side, facing the sea; Marram's mop and bucket mid-clean with a trail of wet planks (decal).
   - Beach: a half-washed sandcastle next to a bigger, smug one with a flag planted on top (rivalry); a towel (flat decal)
     with a book face down and footprints (decals) leading into the sea and not back; Driftwood's hand-painted
     "LAWN SHARKS" warning sign (use `coastSign` from `./sign`) beside a rubber-ring with a bite out of it.
   - Ship: a half-painted rail with a paint pot and brush; a stack of crates marked as souvenirs with one lid off showing
     mower-blade shapes (the smuggling joke, lore: the HOA's spare blades); a tour rope barrier with one forgotten tourist hat.
2. **Residents** (`AmbientGnomeDef`s, at least 6): Marram at the Spokewheel platform beckoning riders; Driftwood
   fiddling with a tube by the Last Tube hut (`COAST.lastTube.hut`, 4 m to the side); a lifeguard dozing in the chair at
   (60, 1170) (sitting on top: y offset if the def supports it, else standing beside it with binoculars); a candyfloss seller
   by Spun Sugar Sal's; two sunbathers on deck chairs; an angler on the pier bowl (deck height); Captain Bilge pacing the
   ship's deck (deck height) if the def supports a y, else on the bowl by the gangplank. Each gets one or two bubble lines
   in its own voice when the player is near (lore voice: dry, plain; Marram "Hat on, hands in, wait for the bell.",
   Driftwood "The sharks are lawn sharks. Smaller. Meaner. Mostly grass.").
3. **Ambient sound**: surf at `COAST.soundSpots.surf`, buoy bell at `COAST.soundSpots.buoyBell`, gull cries if a gull id
   exists in `REGION_SOUNDS` or the birding sounds; only near the player, never every frame.
4. `blips()`: `{ x: 0, z: 1115, color: '#f2b134', label: 'Saltbucket Boardwalk' }` and
   `{ x: 300, z: 1245, color: '#9aa7b0', label: 'Long Spoon Pier' }` (check the `Blip` type in `src/types.ts`).
5. Everything built once at install; `update(dt)` only steps residents and the sound timers; no per-frame allocation.

`src/coast/life.test.ts` (new): the vignette table (export it as `export const COAST_VIGNETTES: readonly { district:
'boardwalk' | 'pier' | 'beach' | 'ship'; id: string; props: readonly { prefab: string; x: number; z: number }[] }[]`)
has >= 3 entries per district; every prefab id exists (`getPrefab` from `@lawn/prefabs`); every beach/boardwalk prop is on
dry ground (`waterDepthAt(x, z) === 0`); every resident def is within 400 m of (0, 1150).

## Contract
`installCoastLife(deps: JobsDeps): CoastPart` (unchanged signature); `COAST_VIGNETTES` exported.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/coast/life.test.ts` passes.

## Out of scope
Every other file (including `ambientGnomes.ts`, `config.ts`, other coast modules and the prefab catalog: report a
missing prefab instead of adding one).
