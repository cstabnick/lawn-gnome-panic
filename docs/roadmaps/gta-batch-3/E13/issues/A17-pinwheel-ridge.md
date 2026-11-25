Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): the wind farm, its animation, sound and storytelling

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
Pinwheel Ridge exists: ten giant garden pinwheels stand along the ridge crest and turn (cheaply), with a soft whoosh as
the vanes sweep past; a gravel service track climbs from the north-band-east road to Ragwort Coilspring's control hut
and the substation; the ridge tells its story (the HOA's cables, Ragwort's names for her pinwheels) and Ragwort is seen
at work.

## Background (confirmed)
- Places (`src/campus/types.ts` `WIND_FARM`, `PINWHEEL_SIZE`): `site` x 700..1000, z -1245..-1155 (natural ground on
  the landscape ridge `ridge/wind-farm`: crest line (640, -1200) → (850, -1205) → (1060, -1195), radius 60, ~24 m
  high); `pinwheels`: ten `{ id: 'pinwheel-1'.., x 715..985 step 30, z on the crest, yaw 0 (rotor faces south),
  colour 'red' | 'yellow' | 'blue' }`; `PINWHEEL_SIZE` { hub 24 (m above the ground), rotorR 9, spin 0.9 rad/s };
  `hut` (860, -1234) yaw PI (faces north, toward the road); `substation` (905, -1236) yaw PI; `trackStart` (850, -1290).
  The `north-band-east` road passes north of the ridge at z ~-1295 (world; in `north-highlands.level.json` it is local
  z ~-145, the document origin is (0, -1150), so world z = local z - 1150).
- Prefabs (new E13 ones are being added right now; a missing id is skipped with a warning): `giant-pinwheel-mast`
  (**half size: place with scale 2**; its hub housing centre is at local (0, 12, ~0.6), so world hub height = ground +
  24), `giant-pinwheel-rotor` (**half size, scale 2**; vanes in the local x-y plane facing +z; its centre is at local
  (0, 4.5, 0); `tint` = vane colour, `trim` = second colour), `pinwheel-control-hut`, `pinwheel-substation`, `cable-drum`
  (life-size); existing `signpost`, `crate`, `site-cone`, `site-barrier`, `ladder`, `bench`, `portacabin`,
  `gsr-subsoil-cable-reel`, `glaze-extra-toolbox`.
- Static vs moving: the masts go into one static batch (`buildPieces`). The rotors cannot (static batches never move):
  build each with `buildPrefab('giant-pinwheel-rotor', { tint, trim })` from `@lawn/prefabs`, scale 2, inside a pivot
  `THREE.Group` positioned at the hub (x, ground + 24, z + 1.4 in front of the hub along the rotor's facing) with the
  rotor offset by (0, -9, 0) (its centre is 4.5 x 2 above its own origin) so it spins about the hub; spin the pivot's
  `rotation.z` (the pivot is turned to the rotor's yaw first: nest pivot-spin inside a yaw group). Register each rotor
  group with `registerCull(group, 'landmark')` from `../cull` (landmarks draw far and are culled cheaply). Only the
  rotors are per-frame work: 10 rotations per frame, nothing else, and nothing at all when the player is more than
  900 m away.
- Track: a `trail/` path (`kind: 'road'`, id prefix `trail/`) in a region document is an off-road dirt trail, flattened
  across its width and following the natural ground along it. Look at the existing `trail/` paths in
  `src/data/levels/north-highlands.level.json` for the exact JSON shape. Keep the file's exact JSON format
  (`JSON.stringify(doc, null, 2)` + newline): edit it by script (read, parse, push, write) or a careful Edit.
- Sound: `playAt('turbine-whoosh', { x, z }, { bus: 'ambience' })` from `../sound/bus` (another worker adds the recipe;
  until then `playAt` returns false). Ragwort (`docs/lore/entries/apocrypha/ragwort-coilspring.md`): silver hard hat with
  a tiny pinwheel on top, grey overalls, tool belt, no beard, goggles, a wrench; quick, windblown steps; dry, deadpan,
  says "naturally"; she names each pinwheel and cried at the first one she freed (that is later, in the story). The HOA
  (Vesper Thorne) re-cabled the Ridge to charge the Grand Combine: their cable clamps are the story here. Homes:
  `homeOf('ragwort')` + `registerHome` (`src/homes/data.ts`), door `[x, z, yaw]`.

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/windFarm.ts` (stub: keep both signatures).
- `games/gnome-theft-auto/src/winter/hill.ts` (a builder with a static batch, a moving group updated per frame, a
  resident).
- `games/gnome-theft-auto/src/homes/pieces.ts`, `src/homes/data.ts`.
- `games/gnome-theft-auto/src/data/levels/north-highlands.level.json` (the `paths` with `trail/` ids).

## Change
- `src/data/levels/north-highlands.level.json`: one path `trail/pinwheel-track`, `kind: 'road'`, width 6, local
  coordinates: from `trackStart` (850, -1290) up the north flank to the hut's door side (about (858, -1240)), then a branch
  along the north flank below the crest from x 705 to 995 (z ~-1225, so the masts on the crest stay off it), grade at most
  16 degrees (zig-zag if needed). Only this key changes.
- `src/campus/windFarm.ts`:
  - `buildWindFarm(scene, boxes)`: the ten masts (scale 2, yaw = the pinwheel's yaw, solid: their collider is the plinth;
    if the prefab's bounds are bigger than the plinth, use `solid: false` and push a 4 x 4 box yourself with h = ground +
    24), the rotors as above (colours from `colour`: red 0xd8342c, yellow 0xf2c12e, blue 0x2a6fdb as tint, white trim),
    each slightly out of phase; the hut (solid) and substation (solid); 2 `cable-drum`s and a run of cable (a thin dark
    box chain) from the substation off downhill north toward Turfton.
  - Story (at least three vignettes, off the track and at least 6 m from every mast): (1) the HOA's re-cabling: at three
    masts, a fat new black cable clamped to the plinth with a padlocked box and a plate "PROPERTY OF THE HOA\nDO NOT
    UNPLUG\n(WE WILL KNOW)", and the old thin cable cut and coiled beside it; (2) Ragwort's names: a small hand-painted
    plate on each plinth with the pinwheel's name (make up ten short affectionate names, e.g. "MARGARET", "OLD SPIN",
    "THE NEW ONE", "DOROTHY", "SULKS", "BIG RED", "LITTLE RED", "WHIRLY BOB", "SPARE", "NO. 10 (SHY)"); (3) a picnic of
    one at the hut: a `bench`, a thermos and a sandwich, a spare tiny pinwheel stuck in a flowerpot, an ear-defender set
    on the bench; (4) a blown-away hard hat caught on the substation fence and a plate "HIGH WIND\nHOLD ON TO EVERYTHING
    \nINCLUDING OPINIONS"; signs at the track bottom "PINWHEEL RIDGE\nTURFTON'S LIGHTS\nARE UP HERE" and on the hut
    "CONTROL HUT\nKNOCK. LOUDLY. (WIND)".
  - Ragwort's home: `registerHome({ ...homeOf('ragwort')!, door: [x, z, yaw] })` 1.5 m in front of the hut's door.
- `installWindFarm(deps)` returns a `RootwellPart`:
  - `update(dt, t)`: when the player (deps.player) is within 900 m, set each rotor's spin angle = `t * PINWHEEL_SIZE.spin
    + phase` (so every player sees the same rate); every 3-5 s, if the player is within 140 m of a pinwheel, play
    `turbine-whoosh` at the nearest hub.
  - Ragwort (`makeGnome` from `../gnomes`: silver hat 0xc0c4c8, grey overalls 0x7a7f86, no beard if the look allows, skin as
    usual) walks slowly back and forth between the hut and the nearest mast (pinwheel-5, x 835) along the track, stopping
    to look up at the vanes; skip when the player is > 250 m away; `registerCull(group, 'gnome')`.
- New `src/campus/windFarm.test.ts` (vitest, `installFakeDom`): after `buildWindFarm(new THREE.Scene(), boxes)`: ten
  rotors exist (the module may export a read-only `rotorCount()` or the test finds groups by name 'pinwheel-rotor');
  `installWindFarm(fakeDeps).update(0.5, 10)` turns them (a rotor's rotation changes between two updates); no collider
  sits on the track (sample every 3 m of `trail/pinwheel-track` from the level document, world coordinates); every
  collider is inside `WIND_FARM.site` (grown by 20 m for the cable); `homeOf('ragwort')!.door` is set.
  (`fakeDeps`: `{ player: { x: 850, z: -1220 }, scene } as never`.)

## Contract
`buildWindFarm(scene, boxes): void`, `installWindFarm(deps): RootwellPart` (stub signatures); trail id
`trail/pinwheel-track`; rotor groups named 'pinwheel-rotor'.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/windFarm.test.ts src/levels.test.ts src/sites.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/windFarm*.ts`.
- Do not run or update `src/layout.golden.test.ts` (the lead does).

## Out of scope
Every other file (`east-campus.level.json` and every other region document are other workers' or the lead's).
