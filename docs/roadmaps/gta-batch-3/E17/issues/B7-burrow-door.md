Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (helpers, rules, who the Burrowfolk are).

## Goal
The Burrow Door stands on the surface: a grassy mound with a round stone door on its east face (always a little
open), molehills round it, a tiny mole post box, a doormat, a lamp, and signs that show how misunderstood the moles are.
Static scenery with colliders; the door prompt itself comes from the Loamdeep interior (already defined by the lead).

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`BURROW_DOOR`: site, mound, door, exit, nubbin, molehills)
- `games/gnome-theft-auto/src/societies/loamdeep/door.ts` (yours: the stub)
- `games/gnome-theft-auto/src/campus/story.ts` lines 1-120 (vignettes, textPlate, colliders)
- `packages/prefabs/src/catalog/gta-loamdeep.ts` (`burrow-mound` 11 m across with its flat door face on +z,
  `burrow-door-round`, `mole-lamp-lit`, `dug-speaker`) and `mole-hill` (in `gta-golf-plants.ts`)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/door.ts`: implement `buildBurrowDoor(scene, boxes)`. The ground slopes
  gently (about 0.5 west to -1.0 east across the site): stand everything on `heightAt(x, z)`. Everything stays inside
  `BURROW_DOOR.site` (x -1015..-985, z 285..315).
  - `burrow-mound` at `BURROW_DOOR.mound` (x -1000, z 300), yaw `Math.PI / 2` so its flat door face points east (+x),
    sunk 0.3 m so it does not float on the slope. Collider: a box of half-size 4 x 4 m round the mound centre, h
    ground + 2.4 (the door spot at x -993.5 stays OUTSIDE it: check).
  - `burrow-door-round` set into the flat face, at about x -994.6, z 300, yaw Math.PI / 2 (front faces east), its
    bottom at ground level; no collider.
  - Molehills: `mole-hill` at each `BURROW_DOOR.molehills` point (no colliders).
  - A doormat in front of the door (a rug/mat prefab if one exists, else a flat brown plane 1.2 x 0.8, lifted 0.03 m,
    `flatLayer`) with a plate "WIPE YOUR PAWS (if it pleases you)".
  - A small post box on a post at (-994, 296.5) (any mailbox/post-box prefab: grep 'mailbox\|post-box\|letterbox' in
    packages/prefabs/src/catalog; else a `post-sack` on a crate) with a plate "LOAMDEEP POST / letters for moles / no
    spades".
  - `mole-lamp-lit` on a short post beside the door at (-993.8, 302.2).
  - Signs (text plates on posts, facing east to the road): "THE BURROW DOOR / Loamdeep, below / Visitors: knock low";
    a gnome-made sign at the site's east edge, crooked: "WARNING: MOLES. ROOT-EATERS. KEEP SPADES HANDY. (HOA Pest
    Notice 12)" and right under it a tiny neat mole-made plate: "We eat grubs. The grubs eat the roots. Kind regards."
  - Two vignettes: (1) a gnome's spade stuck in a molehill with a polite note tied to the handle ("Is this yours? We
    found it in our ceiling."); (2) a little picnic for one on a cloth by the mound (a cup, a plate with half a grub
    bread, `grub-bread` if it exists) facing the sunset, a pair of tiny spectacles folded beside it (Nubbin goes up to see
    the sky, which the Burrowfolk consider a bad habit).
  - Static props via one `buildStaticCells` batch 'burrow-door'; signs in a group 'burrow-door-signs'.
- `games/gnome-theft-auto/src/societies/loamdeep/door.test.ts` (new): build into a fresh scene; every collider stays inside
  the site; the points `BURROW_DOOR.door`, `BURROW_DOOR.exit` and `BURROW_DOOR.nubbin` are not inside any collider.

## Contract
`buildBurrowDoor(scene, boxes)` keeps its signature.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/door.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the Loamdeep interior and its parts, config.ts).
