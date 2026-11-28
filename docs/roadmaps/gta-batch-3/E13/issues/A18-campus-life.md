Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): residents and ambient life

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/life.ts` makes Rootwell University feel lived in: students walk between the buildings with books, a pair
throw a paper plane back and forth on the quad, one reads on a bench, the groundsman mows stripes into the quad lawn,
Dean Lovage Inkwell strolls from his lodge to Tilth Hall with his ledger, idle students say short lines when the player
passes, and Plumbob Hall's clock rings the university bell.

## Background (confirmed)
- Places (`src/campus/types.ts`): `CAMPUS.quad` x 1080..1210, z -265..-140, `quadCentre` (1145, -202) (a statue stands
  there: keep 5 m off it), a 3 m gravel path ring just inside the quad edge and two diagonals to the centre (another
  worker paints them); `CAMPUS_BUILDINGS` with each `door` spot (walk targets) and footprints (w along x, d along z for
  yaw 0/PI, swapped for +-PI/2; never walk through one); the Dean's lodge door (1063.5, -245), Tilth Hall's door
  (1110, -125.5). Ground: `heightAt`; the campus is flat.
- `src/ambientGnomes.ts`: `createAmbientGnomes(scene, defs)` returns `{ update(dt, px, pz) }`; `AmbientGnomeDef { id,
  name, x, z, yaw, look: Partial<GnomeLook>, bubble, idle? }`: standing gnomes that say their `bubble` line when the
  player passes (rate-limited). Use it for the idle students and the reader.
- Walking/moving residents: `makeGnome(group, look)` and `gnomeState` from `../gnomes` (see how `src/winter/hill.ts`
  animates Gentian's learners and `src/coast/life.ts` its residents: a walk cycle while moving, an idle otherwise);
  `registerCull(obj, 'gnome')` from `../cull`. Props carried or used (a book, a paper plane, a push mower) are prefabs:
  `buildPrefab(id)` from `@lawn/prefabs` (`book-pile` or a single book prefab if one exists, `paper-plane` (new E13),
  `push-mower-bike` or another push-mower prefab: grep `packages/prefabs/src/catalog/` for 'mower').
- Sound: `playAt('campus-bell', { x, z }, { bus: 'ambience' })` from `../sound/bus` (a recipe that exists). The clock
  tower is on Plumbob Hall's back-left corner, about (1194, -302).
- Lore: Dean Lovage Inkwell (smooth, well-meaning, a gown, a ledger of late rent to the ants; signed the survey over to
  the HOA for a grant). Students: "Rootwell men do not dig. They study digging."; "Four years and a hat. Some of them
  leave with the hat." Nobody is hurt; dry, gentle satire.
- Performance: everything here does nothing when the player is more than 300 m from `quadCentre` (one distance check
  per frame), at most ~14 animated gnomes in total.

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/life.ts` (stub: keep the signature).
- `games/gnome-theft-auto/src/ambientGnomes.ts` (the def and `createAmbientGnomes`).
- `games/gnome-theft-auto/src/coast/life.ts` (a finished "life" module: residents, a sound timer, a range check).
- `games/gnome-theft-auto/src/winter/hill.ts` (`makeGnome`, `gnomeState`, a moving resident).

## Change
`src/campus/life.ts`, `installCampusLife(deps): RootwellPart`:
- 6 walking students: each loops between two or three building door spots along straight legs that stay on the quad
  ring/diagonals or the lawn (never through a building footprint: route via the quad corners), carrying a book, walking
  at 1.2-1.6 m/s, pausing 2-4 s at each door. Rootwell look: scarves/jumpers in deep red 0x8b1e2b and cream 0xefe3c8,
  varied hats.
- A pair on the quad lawn (one corner) throwing a paper plane: the plane flies a slow arc between them every ~4 s
  (a `paper-plane` mesh moved along a parabola), they turn to face it.
- The groundsman: a gnome pushing a mower in straight stripes up and down one half of the quad lawn (avoiding the
  centre 5 m and the paths' crossing at the middle), turning at the ends; slow (0.8 m/s).
- Dean Lovage Inkwell (a gown look: dark purple-black shirt 0x2a2238, a red stole if the look has a slot, grey beard)
  walks from his lodge door to Tilth Hall's door and back every ~90 s, stopping at the founder's statue to tip his hat
  (a small bow), carrying a ledger (`book-pile` scaled down, or a ledger prefab if one exists: grep 'ledger').
- 4-5 idle students via `createAmbientGnomes`: one reading on the quad's west bench, two chatting outside the Trencher,
  one outside Bedstraw House, one at the Cold Frame Club door (a lecturer). Lines (short, dry), e.g.: "I study digging.
  I have never dug."; "Four years, one hat. I am on the hat."; "The ants shut the library again. Rent day."; "Plumbob
  Hall drops things off the roof. For science. Mostly my lunch."; "The Dean says the grant is a gift. Gifts do not
  usually come with a survey."
- The bell: every 60-90 s while the player is within 250 m, `playAt('campus-bell', { x: 1194, z: -302 }, { bus:
  'ambience' })`.
- New `src/campus/life.test.ts` (vitest, `installFakeDom`): `installCampusLife(fakeDeps)` (a minimal deps object cast
  `as never`: `scene`, `player: { x: 1145, z: -202 }`, `ui`/`hud` only if you use them) then 600 updates of 0.1 s with
  `t` rising: no walking resident's position is ever inside a building footprint (grown by 0.5 m) or within 4 m of
  `quadCentre`; with the player at (0, 0) the update does no work (positions do not change).

## Contract
`installCampusLife(deps): RootwellPart` (stub signature). No colliders (residents are not solid).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/life*.ts`.

## Out of scope
Every other file.
