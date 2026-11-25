Epic: E17 wave 2 (living parts)
Depends on: wave 1 mole prefabs (done)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section; who the Burrowfolk and DJ Moleman are).

## Goal
Loamdeep is alive: small moles going about their tidy business in every hall (bobbing, nodding, waving their big pink
paws, a few walking errands along the tunnels), each named mole with a "Talk to" spot and gentle lines; once DJ Moleman
has visited, he plays at the Under-Chorus decks with moles dancing. On the surface, Nubbin waits by the Burrow Door
and a mole peeks out of a molehill now and then.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`LOAMDEEP` halls, tunnels, spots; `BURROW_DOOR`; `SOCIETY_CAST`;
  `SOCIETY_INTERIORS`; `SocietyDeps`, `SocietyPart`)
- `games/gnome-theft-auto/src/societies/loamdeep/folk.ts` and `surface.ts` (yours: the stubs)
- `packages/prefabs/src/catalog/gta-moles.ts` (ids `burrowfolk-mole`, `mole-nubbin`, `mole-tumblesoil`, `dj-moleman`,
  `moleman-decks`, `mole-pup`; each figure has pivot groups named `body`, `head`, `arm-l`, `arm-r`: find them with
  `obj.getObjectByName('body')` etc. after `buildPrefab`; check the exact names in `packages/prefabs/src/build.ts` or
  wherever pivots are created: grep `pivots` there)
- `games/gnome-theft-auto/src/interiors/types.ts` lines 40-100 (kit.put returns the Object3D; kit.spot)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/folk.ts`: keep both exported signatures.
  - `buildMoleFolk(kit)`: clear the module's list of animated moles, then `kit.put(id, x, z, yaw, { solid: false })` each
    mole (keep the returned objects and their pivots in the list). Positions inside their hall, at least 1.2 m from every
    `LOAMDEEP.spots` point (except where said) and never on a lamp point:
    - Old Mother Tumblesoil (`mole-tumblesoil`) standing beside her chair at `spots.tumblesoil` + (1.3, 0.3), facing
      south; a spot at `spots.tumblesoil` + (1.3, 1.6) 'Talk to Old Mother Tumblesoil'.
    - Old Tamp (`burrowfolk-mole`, slightly larger scale) in Rootway Hall; Mistress Delve in Lamplight Hall; Mister Sift
      in Postern Hall beside the pigeonholes; Auntie Crumb in Hearth Hall by the oven; Nubbin (`mole-nubbin`) in Postern
      Hall; Pim and Pod (`mole-pup` x2) circling the moss rug in the Mother's Hall. Each named mole gets a 'Talk to
      <name>' spot 1.3 m in front of it that cycles through 3 lines each (write them: polite, formal, gently funny, "if
      it pleases you", misunderstood by the surface; e.g. Tamp: "Gnomes say we eat roots. We store them. For the grubs.
      Who eat them. It is a long story and nobody stays for the end.").
    - 6 more `burrowfolk-mole` about the halls doing things (by a root crate, at a table, sweeping a tunnel mouth), and
      3 walkers that go back and forth along a tunnel's centre line (westGallery, eastGallery, mothersNorth) at 0.7 m/s
      turning round at the ends.
    - When `loadSocietySave().molemanVisits` (import from '../save'): `moleman-decks` at `spots.decks` facing south,
      `dj-moleman` behind it (0.7 m north) facing south, and 8 dancers on a ring of radius 3.5 round `spots.danceFloor`.
  - `updateMoleFolk(dt, t)`: when `currentInterior()` (from '../../interiors') is not 'loamdeep', do nothing; else
    animate: idle moles bob the `body` pivot (y +- 0.02 at ~1.2 Hz, phase per mole), nod the `head` pivot, now and then
    lift a paw; walkers move and turn; dancers bounce (y +- 0.06 at the beat 2.1 Hz) and sway; Moleman nods to the beat
    and moves one paw over the decks. Every ~6-12 s play `playAt('mole-squeak' | 'burrow-drip', worldPoint)` at a random
    mole (world via `interiorToWorld('loamdeep', x, z)`). No allocation per frame.
- `games/gnome-theft-auto/src/societies/loamdeep/surface.ts`: `installBurrowSurface(deps)`: build `mole-nubbin` at
  `BURROW_DOOR.nubbin` on the ground (`heightAt`), facing east, added to `deps.scene`; a `burrowfolk-mole` hidden in the
  molehill at `BURROW_DOOR.molehills[0]` that rises 0.35 m and sinks again every ~20 s (stay down 15-25 s, up 3 s).
  `update(dt, t)`: only when the player is within 60 m: Nubbin bobs and sniffs (head pivot); the peeking mole moves.
  Register Nubbin's and Tumblesoil's homes once: `registerHome({ ...homeOf('nubbin')!, door: [BURROW_DOOR.door.x,
  BURROW_DOOR.door.z, BURROW_DOOR.door.yaw], interiorId: SOCIETY_INTERIORS.loamdeep })` and the same for 'tumblesoil'
  (import from '../../homes/data'; guard when `homeOf` returns undefined).
- `games/gnome-theft-auto/src/societies/loamdeep/folk.test.ts` (new): with `createKit` (see `src/interiors/kit.test.ts`)
  after `kit.room()`, `buildMoleFolk(kit)` adds at least 12 objects and the spot 'Talk to Old Mother Tumblesoil'; no talk
  spot lies within 1.0 m of a `LOAMDEEP.spots` point other than its own; `updateMoleFolk(0.016, 1)` does not throw.

## Contract
`buildMoleFolk(kit)`, `updateMoleFolk(dt, t)`, `installBurrowSurface(deps): SocietyPart` keep their signatures.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/folk.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (runtime.ts, the halls, interior.ts, config.ts, save.ts).
