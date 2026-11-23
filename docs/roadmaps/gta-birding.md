# Gnome Theft Auto: birding

User request: "add birding. add new types of birds."

Birding is a peaceful hobby (birds are never harmed: R-021, R-049, R-141). The gnome raises binoculars (hold or tap V,
hold D-pad right on a pad, or the 🔭 touch button), looks and zooms; a bird kept in view for a moment goes on the
**life list** (the field journal, with silhouettes until seen). Calls are heard first: a call near the gnome puts the
species on the heard list and shows an arrow toward it. Which birds turn up depends on region, time of day and the
wind (a slow calm/breezy/blustery cycle shown on the HUD). 28 new species, from pigeons to two mythic birds, built from
15 shared prefab body plans and drawn **instanced** (3 draw calls per species on screen, hard caps of 48 birds desktop /
28 phone, far flocks stepped every 3rd frame, flocking by slot offsets instead of neighbour search, no per-frame
allocation). Birds perch on roofs, fences, walls, tree trunks, the ground, the shore and the water; they flush from a
walking gnome, a fast vehicle or a gunshot; soarers and ambient sky flocks circle overhead even if the player never
birds. The **Reedwatch Hide** on the south shore of Loch Moss, kept by **Dunnock Pell**, pays Acorns for life-list
milestones and sells better optics. Snapping a photo of a centred bird is the cheap photo mode. Six achievements with
cosmetic gear. Online: birds are local to each browser like every other animal (critters, hunting); not relayed.

Debug: `?debug` exposes `__gta.birding` (`spawn(id, x, z)`, `markSeen(id)`, `species`, `stats()`); `?bird=<id>` spawns a
flock in front of the player.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner, done) | types.ts, stubs for every module, prefab catalog files registered, save key in saveIO/cloudSave, KEYS.binoculars, app.ts wired against the stub; tsc passes | 0 (planner) |
| 2 Build | every module filled; `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore` pass | 15 (2A-2O, all parallel) |
| 3 Check | planner: build, tests, smoke check at a phone and a desktop viewport, fixes | 0-2 |

Foundation files (written by the planner, the contract for every issue):
`games/gnome-theft-auto/src/birding/types.ts` (all types, tuning, HIDE, OPTICS, MILESTONES, BIRD_ACHIEVEMENTS), stubs
`species.ts sounds.ts flock.ts perches.ts spawner.ts birdView.ts birdSave.ts scope.ts scopeUi.ts journalUi.ts hide.ts birding.ts`,
`packages/prefabs/src/catalog/gta-birds.ts` + `gta-birding-gear.ts` (empty, registered in `catalog/index.ts`),
`keys.ts` (`binoculars: 'KeyV'`), `saveIO.ts` + `saveIO.test.ts` + `cloudSave.ts` (`gta-birding-v1`, merged by
`mergeBirdSaves`, in GROWS), `app.ts` (createBirding, prompts, blips, input hold while viewing, update, applyCamera after
chase.update, `__gta.birding`).

Hot-file edits (all additive): app.ts, keys.ts, saveIO.ts, saveIO.test.ts, cloudSave.ts, packages/prefabs/src/catalog/index.ts,
packages/achievements/src/catalog.ts (issue 2M), docs/lore/rulings.md (issue 2O).

## Common environment (every issue)

~~~~text
- Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto
  (Vite + TypeScript + three.js r16x). If `node` is not found: export PATH="/c/Program Files/nodejs:$PATH".
- Many other workers and planners are editing OTHER files in this same worktree right now. Touch ONLY the files your
  issue lists under Change. Do not run `vite build` or `npm run build`, do not start a dev server, do not commit,
  push, stash or switch branches, do not run npm install.
- Every shared type, constant and tuning number is in games/gnome-theft-auto/src/birding/types.ts. Read it first.
  Do not edit it. If you think it is wrong, say so in your report and work with it as it is.
- The other files in games/gnome-theft-auto/src/birding/ are stubs that other workers are filling at the same time.
  Keep every exported name and signature of YOUR file exactly as its stub has it (you may add exports). Import other
  birding modules only through the signatures in their stubs.
- Type-check from the repo root: npx tsc --noEmit -p games/gnome-theft-auto
  Errors in files you do not own are someone else's work in progress: ignore them. Your files must have none.
- Run one test file from games/gnome-theft-auto: npx vitest run src/birding/<file>.test.ts
  (vitest runs in node: no DOM in tests. Test pure functions only.)
- Performance matters (the game already has frame-rate trouble): no allocation in per-frame paths (reuse objects and
  arrays), no per-frame scans of large arrays, no shadows on birds.
- Plain, short code comments. No emojis in code except UI glyph strings the issue gives you.
- Animals in Turfton are never harmed (no "kill", "shoot down", "dead", "meat"). Birding is watching.
~~~~

## Species table (used by 2A, 2B, 2C, 2O)

`regions` keys are RegionId: turfton, dust-flats, mossy-wood, frostbite-fells, cloverfield-farms, loch-moss, tallgrass-commons.
Call = kind hz slide notes note gap.

| # | id | name | group | rarity | regions | time | wind | prefab | tint | trim | scale | size | flight | speed | alt | perches | flock | shy | call | callEvery | ambient |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | turfton-pigeon | Turfton Rooftop Pigeon | city | common | turfton 3, cloverfield-farms 0.5 | DAY | WIND_ANY | bird-pigeon | 0x8a8f99 | 0x5f6670 | 1 | 0.45 | flap | 7 | 10 | roof, ground, fence | 4-10 | 6 | coo 420 0.9 3 0.28 0.32 | 6-12 | yes |
| 2 | gutter-sparrow | Gutter Sparrow | city | common | turfton 2, cloverfield-farms 1.5, tallgrass-commons 0.5, dust-flats 0.5 | DAY | WIND_STILL | bird-songbird | 0x9a7350 | 0x6b4a2e | 0.6 | 0.25 | bound | 6 | 5 | fence, ground, roof | 3-8 | 5 | chirp 3200 1.1 4 0.06 0.12 | 3-7 | yes |
| 3 | commons-starling | Commons Starling | songbird | common | tallgrass-commons 2, cloverfield-farms 2, turfton 1 | TWILIGHT | WIND_ANY | bird-songbird | 0x2b2f3a | 0x3f4a5c | 0.65 | 0.3 | flap | 9 | 14 | tree, roof, fence | 10-18 | 8 | warble 2400 1.4 6 0.08 0.1 | 4-8 | yes |
| 4 | loch-gull | Loch Gull | seabird | common | loch-moss 3, turfton 0.8 | DAY | WIND_GUSTY | bird-gull | 0xf2f2f0 | 0x9aa3ad | 1.2 | 0.6 | soar | 8 | 14 | water, shore, roof | 2-6 | 9 | screech 1500 0.7 3 0.22 0.3 | 5-10 | yes |
| 5 | hedge-robin | Hedge Robin | songbird | common | mossy-wood 2, cloverfield-farms 1.5, tallgrass-commons 1, turfton 0.6 | { Dawn: 1, Morning: 1, Noon: 0.8, 'Golden Hour': 1, Dusk: 0.6 } | WIND_STILL | bird-robin | 0x8a6a4a | 0x6e5236 | 0.6 | 0.28 | flap | 6 | 4 | fence, tree, ground | 1-2 | 5 | trill 3600 0.8 7 0.05 0.07 | 4-9 | |
| 6 | mossy-wren | Mossy Wren | songbird | uncommon | mossy-wood 3 | DAY | WIND_STILL | bird-songbird | 0x7a5a3a | 0x5a4028 | 0.45 | 0.2 | bound | 5 | 3 | ground, fence, tree | 1-1 | 4 | trill 4200 1 12 0.03 0.045 | 5-10 | |
| 7 | acorn-tit | Acorn Tit | songbird | common | mossy-wood 2, tallgrass-commons 1.5, turfton 0.4 | DAY | WIND_ANY | bird-songbird | 0xe8c840 | 0x4a7ab8 | 0.5 | 0.22 | bound | 6 | 5 | tree, fence | 3-6 | 4 | chirp 4000 0.85 3 0.08 0.15 | 3-7 | |
| 8 | dandelion-finch | Dandelion Finch | songbird | common | tallgrass-commons 3, cloverfield-farms 1 | DAY | WIND_STILL | bird-songbird | 0xe8c33a | 0x2b2b2b | 0.5 | 0.22 | bound | 7 | 6 | fence, ground, tree | 4-9 | 5 | warble 3400 1.2 5 0.07 0.09 | 3-6 | yes |
| 9 | tallgrass-skylark | Tallgrass Skylark | songbird | uncommon | tallgrass-commons 2.5, cloverfield-farms 1 | { Dawn: 1, Morning: 1.2, Noon: 0.8 } | WIND_STILL | bird-songbird | 0xa88a62 | 0x7a6040 | 0.55 | 0.25 | hover | 5 | 12 | ground | 1-2 | 6 | warble 3800 1.3 10 0.06 0.075 | 3-6 | |
| 10 | reed-heron | Grey Reed Heron | wader | uncommon | loch-moss 2.5, mossy-wood 0.3 | DAY | WIND_ANY | bird-wader | 0x9aa0a8 | 0x6b7480 | 1.6 | 1.1 | glide | 6 | 12 | shore, water, tree | 1-1 | 12 | croak 260 0.8 1 0.4 0.5 | 10-20 | |
| 11 | loch-sandpiper | Loch Sandpiper | wader | common | loch-moss 3 | DAY | WIND_ANY | bird-wader | 0xb8a080 | 0x7a6650 | 0.55 | 0.3 | flap | 8 | 5 | shore, ground | 3-8 | 6 | whistle 3000 1.2 3 0.09 0.13 | 4-8 | |
| 12 | lawn-flamingo | Lawn Flamingo | comical | rare | dust-flats 1, loch-moss 1, turfton 0.3 | DAY | WIND_STILL | bird-flamingo | 0xf28ab0 | 0xe0607f | 1.4 | 1.3 | flap | 7 | 12 | shore, water, ground | 1-3 | 10 | honk 520 0.85 2 0.18 0.24 | 8-16 | |
| 13 | verge-kestrel | Verge Kestrel | raptor | uncommon | cloverfield-farms 2, tallgrass-commons 2, turfton 0.4 | DAY | WIND_GUSTY | bird-raptor | 0xb86a3a | 0x8a4a2a | 0.8 | 0.45 | hover | 8 | 14 | tree, fence, roof | 1-1 | 10 | kek 2600 1 5 0.07 0.1 | 8-16 | |
| 14 | fells-buzzard | Fells Buzzard | raptor | uncommon | frostbite-fells 2, mossy-wood 1 | DAY | WIND_GUSTY | bird-raptor | 0x6b4a32 | 0x4a3222 | 1.2 | 0.7 | soar | 7 | 22 | tree, ground | 1-2 | 14 | screech 1800 0.6 1 0.7 0.8 | 10-18 | |
| 15 | dust-hawk | Dust Flats Hawk | raptor | rare | dust-flats 2.5 | { Morning: 1, Noon: 1.2, 'Golden Hour': 1 } | WIND_GUSTY | bird-raptor | 0xc9a27a | 0xa8552e | 1.3 | 0.75 | soar | 8 | 26 | tree, roof, ground | 1-1 | 16 | screech 2100 0.55 1 0.9 1 | 12-22 | |
| 16 | barn-owl | Barn Owl | owl | uncommon | cloverfield-farms 2.5, tallgrass-commons 0.8, dust-flats 0.8 | NIGHT | WIND_STILL | bird-owl | 0xf2e6cc | 0xc9a36b | 1 | 0.5 | glide | 5 | 6 | roof, tree, fence | 1-1 | 8 | screech 1200 0.9 1 0.8 1 | 10-18 | |
| 17 | tawny-owl | Tawny Owl | owl | common | mossy-wood 3, turfton 0.4 | NIGHT | WIND_STILL | bird-owl | 0x8a5a32 | 0x6b4224 | 1 | 0.5 | glide | 5 | 8 | tree, roof | 1-2 | 8 | hoot 420 0.92 3 0.35 0.55 | 8-14 | |
| 18 | snowy-owl | Snowy Owl | owl | rare | frostbite-fells 2.5 | { 'Neon Night': 1, Dusk: 0.8, Dawn: 0.8, Noon: 0.3 } | WIND_ANY | bird-owl | 0xf6f8fa | 0xdfe4ea | 1.25 | 0.65 | glide | 6 | 4 | ground, roof | 1-1 | 12 | hoot 300 0.85 2 0.5 0.7 | 12-20 | |
| 19 | loch-puffin | Loch Puffin | seabird | uncommon | loch-moss 2 | DAY | WIND_GUSTY | bird-puffin | 0x1e1e22 | 0x1e1e22 | 0.7 | 0.3 | swim | 9 | 4 | water, shore | 2-5 | 7 | croak 180 1.1 3 0.2 0.25 | 8-14 | |
| 20 | loch-swan | Loch Swan | waterfowl | uncommon | loch-moss 2.5 | ALWAYS | WIND_STILL | bird-swan | 0xf8f8f6 | 0xeeeeea | 1.4 | 1 | swim | 7 | 6 | water | 1-3 | 10 | honk 330 0.9 2 0.3 0.4 | 10-18 | |
| 21 | snow-bunting | Snow Bunting | songbird | common | frostbite-fells 3 | DAY | WIND_ANY | bird-songbird | 0xf2f2f2 | 0x3a3a3a | 0.55 | 0.25 | bound | 7 | 4 | ground, roof, fence | 6-14 | 6 | chirp 3600 1.15 3 0.07 0.1 | 3-6 | yes |
| 22 | fells-ptarmigan | Fells Ptarmigan | comical | uncommon | frostbite-fells 2 | ALWAYS | WIND_ANY | bird-pigeon | 0xeef0f2 | 0xd8dce0 | 1.15 | 0.5 | flap | 7 | 3 | ground | 2-5 | 5 | croak 220 0.9 4 0.12 0.16 | 6-12 | |
| 23 | dust-roadrunner | Dust Flats Roadrunner | comical | uncommon | dust-flats 3 | DAY | WIND_ANY | bird-runner | 0x8a6e4e | 0x5a4632 | 1 | 0.6 | runner | 11 | 0 | ground | 1-1 | 9 | coo 300 0.75 4 0.2 0.28 | 8-14 | |
| 24 | turfton-parakeet | Turfton Parakeet | exotic | uncommon | turfton 2, tallgrass-commons 1.5 | DAY | WIND_ANY | bird-longtail | 0x5cbf3a | 0x3f9a2a | 0.7 | 0.4 | flap | 10 | 12 | tree, roof | 4-9 | 8 | screech 2800 1.1 4 0.1 0.14 | 3-6 | |
| 25 | hat-magpie | Hat-Pinching Magpie | comical | uncommon | turfton 1.5, mossy-wood 1, cloverfield-farms 1 | DAY | WIND_ANY | bird-longtail | 0x1c1c20 | 0xf2f2f2 | 0.8 | 0.45 | flap | 7 | 8 | roof, tree, fence, ground | 1-3 | 7 | kek 1400 0.9 6 0.06 0.09 | 5-10 | |
| 26 | cloverfield-dodo | Cloverfield Dodo | comical | rare | cloverfield-farms 2 | DAY | WIND_STILL | bird-dodo | 0x8a8478 | 0x6e685c | 1 | 0.7 | runner | 3 | 0 | ground | 1-2 | 4 | honk 200 0.8 2 0.3 0.4 | 8-14 | |
| 27 | kiln-phoenix | Kiln Phoenix | mythic | mythic | dust-flats 1 | { 'Golden Hour': 1 } | WIND_ANY | bird-phoenix | 0xff7a1a | 0xffc23a | 1.4 | 1.2 | soar | 10 | 30 | tree, roof | 1-1 | 20 | chime 880 1.5 3 0.5 0.4 | 10-18 | |
| 28 | moon-heron | Moon Heron | mythic | mythic | loch-moss 1 | { 'Neon Night': 1 } | WIND_STILL | bird-moon-heron | 0xcfd8ff | 0xa8b8ff | 1.6 | 1.2 | glide | 5 | 10 | shore, water | 1-1 | 18 | chime 660 0.75 4 0.6 0.5 | 10-18 | |

Prefab body plans (2B): bird-songbird, bird-robin, bird-pigeon, bird-gull, bird-wader, bird-flamingo, bird-raptor,
bird-owl, bird-puffin, bird-swan, bird-runner, bird-longtail, bird-dodo, bird-phoenix, bird-moon-heron.

## Epic 2: Build (15 issues, all parallel)

Files per issue (no file is under two issues):
2A species.ts + species.test.ts · 2B prefabs/catalog/gta-birds.ts · 2C sounds.ts + sounds.test.ts · 2D flock.ts + flock.test.ts ·
2E perches.ts + perches.test.ts · 2F spawner.ts + spawner.test.ts · 2G birdView.ts · 2H birdSave.ts + birdSave.test.ts ·
2I scope.ts + scope.test.ts · 2J scopeUi.ts · 2K journalUi.ts · 2L hide.ts + hide.test.ts ·
2M prefabs/catalog/gta-birding-gear.ts + achievements/src/catalog.ts · 2N birding.ts · 2O docs/lore (new entries + one ruling).
No issue starts a server. Every check is tsc --noEmit or vitest on the issue's own test file (2B/2M: the package tests, 2O: npm run lore).

### 2A: species table

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/species.ts holds the 28 bird species as data (BirdSpecies rows), and a test checks them.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: BirdSpecies, CallRecipe, the presets DAY, NIGHT, TWILIGHT, ALWAYS,
  WIND_ANY, WIND_STILL, WIND_GUSTY. Every field's comment is the rule for it.
- games/gnome-theft-auto/src/birding/species.ts: the stub (keep BIRDS and birdById).
- games/gnome-theft-auto/src/hunting/species.ts: the house style of a data table with hint and blurb lines.
- docs/roadmaps/gta-birding.md section "Species table": the 28 rows, in order. Copy every value exactly.

## Change
- species.ts: `export const BIRDS: readonly BirdSpecies[] = [ ...28 rows in table order... ]`. For each row:
  regions as an object ({ 'loch-moss': 3, turfton: 0.8 }), time = the named preset or the literal object in the table,
  wind = the named preset, flock as a tuple [min, max], callEvery [min, max], call as
  { kind, hz, slide, notes, note, gap }, ambient: true only where the table says yes.
  Write `hint` (where and when to look, one sentence, under 120 characters, e.g. "Bobs along the Loch Moss shore by day,
  in little nervous groups.") and `blurb` (one or two sentences, under 180 characters, a dry gnome's-eye fact or joke,
  e.g. "It runs from every wave, then chases it back. Neither side has ever won.").
  Voice: plain, short, garden-scale; Turfton place names: Turfton, Dust Flats, Mossy Wood, Frostbite Fells, Cloverfield
  Farms, Loch Moss, Tallgrass Commons, the Reedwatch Hide. Birds are never hurt. Mythic birds (kiln-phoenix, moon-heron):
  hint says only when and where they were "said to be seen" (Golden Hour over the Dust Flats; Neon Night on the
  Loch Moss shore), blurb keeps the mystery (never explains what they are). Lawn Flamingo: gnomes mistake it for a plastic
  lawn ornament until it walks off. Hat-Pinching Magpie: steals shiny things and hats (in the blurb only).
  Cloverfield Dodo: never seen to fly, never seen to want to.
  Keep birdById (you may rewrite it as a Map lookup built once).
- species.test.ts (new): BIRDS has 28 rows; ids unique and kebab-case; every regions weight > 0 and every key a valid
  RegionId (check against REGION_IDS from '../levels'); every species has at least one time weight > 0; flock[0] >= 1
  and flock[0] <= flock[1]; callEvery[0] < callEvery[1]; call.notes 1..12; hint and blurb non-empty and under 200 chars;
  every RegionId has at least 3 species; exactly the 3 owls have group 'owl'; exactly 2 rows have group 'mythic'.

## Contract
`BIRDS` and `birdById(id)` as in the stub. Row order = table order.

## Done when
- npx vitest run src/birding/species.test.ts passes (from games/gnome-theft-auto)
- npx tsc --noEmit -p games/gnome-theft-auto shows no error in src/birding/species*.ts

## Out of scope
Every other file. Do not edit types.ts.
~~~~

### 2B: bird prefabs

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.) Plus: this issue works in packages/prefabs, not the game.

## Goal
packages/prefabs/src/catalog/gta-birds.ts defines 15 bird body-plan prefabs that the game draws as instanced meshes.

## Read first
- docs/roadmaps/prefab-library/_common.md: read "What a prefab is", "Modelling rules", "Data rules", "Checks". IGNORE its
  Environment (wrong path), its place-name list and its "Out of scope" section; use this issue's instead.
- packages/prefabs/src/types.ts: PrefabDef, Part, pivots, groups.
- packages/prefabs/src/catalog/gta-hunt-quarry-b.ts: hunt-mallard and hunt-pheasant: finished bird prefabs in the house
  style (pivots, wing groups, examine voice). Copy that style.
- packages/prefabs/src/catalog/gta-birds.ts: the empty stub (already registered in catalog/index.ts; do not touch index.ts).

## Change
- gta-birds.ts: `export const GTA_BIRDS: readonly PrefabDef[] = [...]` with these ids (category 'prop', uses ['place'],
  emoji [], tags include 'bird', 'gta', 'birding' and the bird's nouns; 5 examine lines in the voice of gta-hunt-quarry-b.ts):
  bird-songbird (small round body, short beak; used for sparrow, starling, wren, tit, finch, skylark, bunting),
  bird-robin (songbird shape + a fixed red-orange breast patch 0xd8572a),
  bird-pigeon (plump, small head, short legs; also ptarmigan),
  bird-gull (long narrow wings, yellow beak; wings longer than body),
  bird-wader (long thin legs and neck, long beak; heron at scale 1.6, sandpiper at 0.55),
  bird-flamingo (long legs, S-curved neck from 2-3 parts, bent black-tipped beak),
  bird-raptor (hooked yellow beak, broad wings, fanned tail),
  bird-owl (round, big flat face disc of trim, big round eyes 0xf2c230 with black pupils, ear tufts small),
  bird-puffin (upright, white face/belly fixed 'white', big orange-red striped beak 0xe8602a, orange feet),
  bird-swan (long upright neck, orange beak, body sits low: it floats),
  bird-runner (long tail, crest, long legs, leaning forward: a roadrunner),
  bird-longtail (slim body, very long tail; parakeet and magpie),
  bird-dodo (big round grey body, huge hooked beak 0xd8c08a, tiny wings, stubby legs),
  bird-phoenix (raptor-like, flame tail of 3-4 cones and a crest; tint and trim parts and the tail parts glow: true),
  bird-moon-heron (wader shape, pale; a few glow: true parts: crest plumes and the back of the wings).
  The tint (body) and trim (wings) are set per species by the game; set default tint/trim on each prefab anyway.
- Rules that make them cheap to draw (the game turns every mesh into an InstancedMesh, so parts must merge well):
  1. Origin at the feet: lowest point y = 0. Forward is +z (beak toward +z). Length about 0.5 along z at scale 1
     (owls, dodo, swan, wader may be taller). 4 to 14 parts each.
  2. `pivots` has exactly two entries: 'wing-0' at the left shoulder [-w, yS, zS] and 'wing-1' at the right shoulder
     [+w, yS, zS] (w = half the body width). NO other pivots and NO other `group` values.
  3. Each wing group holds EXACTLY ONE part, no `mirror`: wing-0 is a flat box (or squashed ball) that extends from the
     shoulder outward along -x, i.e. spread flat: `{ s: 'box', d: [span, 0.02, chord], at: [-w - span/2, yS, zS], c: 'trim', group: 'wing-0' }`;
     wing-1 is the same at +x (`at: [w + span/2, yS, zS]`, group 'wing-1'). span = wing length (about 0.3-0.5 at scale 1;
     gull and raptor longer). The game folds the wings down against the body by rotating them about the shoulder.
  4. Every other part has no group (it merges into one static body mesh). Mirror is fine for eyes and legs.
  5. Each prefab's `about` says: "Gnome Theft Auto birding body plan: <what it is>. Body tints; wings are trim. Pivots: wing-0, wing-1."

## Contract
The 15 ids above, exactly. Pivot names 'wing-0' (left, -x) and 'wing-1' (right, +x). One part per wing group.

## Done when
- npx tsc --noEmit -p packages/prefabs: no error in gta-birds.ts
- npm test -w packages/prefabs: every test naming one of your ids passes (other failures: not yours, report them)

## Out of scope
Everything else, including catalog/index.ts, gta-birding-gear.ts and the game.
~~~~

### 2C: synth bird calls

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/sounds.ts turns a species' CallRecipe (data) into a world-sound recipe and registers
one sound per species plus three birding sounds.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: CallRecipe, CallKind, birdSoundId, BIRD_SFX, BirdSpecies.
- games/gnome-theft-auto/src/birding/sounds.ts: the stub (keep recipeFor and registerBirdSounds signatures).
- games/gnome-theft-auto/src/hunting/sounds.ts: a finished module of the same kind (pitch(), lvl(), PEAK_MAX 0.25, registerSound). Copy its approach.
- games/gnome-theft-auto/src/sound/synth.ts: burst, tone, voiced (the only helpers; each schedules and stops its own nodes).
- games/gnome-theft-auto/src/sound/ids.ts: Recipe, SoundInfo (info.param 0..1 = calm..alarmed, info.rand per-play random).
- games/gnome-theft-auto/src/sound/bus.ts: registerSound(id, recipe), hasSound(id).

## Change
- sounds.ts:
  - `export function recipeFor(call: CallRecipe): Recipe`: returns (c, out, t, info) => duration. For k in 0..notes-1 a
    note starts at t + k * gap and lasts `note` seconds, pitch from p*hz to p*hz*slide where p = (1 + (info.rand - 0.5) * 0.12)
    * (1 + (info.param - 0.5) * 0.2). Peak = min(0.25, base * (0.75 + 0.5 * info.param)). Per kind:
    whistle: tone 'sine' (base 0.14). chirp: tone 'triangle', note shortened to min(note, 0.06) (base 0.12).
    trill: tone 'sine' with every other note 8% higher (base 0.11). warble: voiced 'triangle' rate 18 depth 0.06 cutoff 6000 (base 0.12).
    coo: voiced 'sine' rate 6 depth 0.04 cutoff 900 (base 0.16). hoot: voiced 'sine' rate 4 depth 0.03 cutoff 700, attack 0.06 (base 0.18).
    screech: voiced 'sawtooth' rate 30 depth 0.05 cutoff 3500 plus a burst 'bandpass' at hz*1.5 (base 0.12).
    kek: tone 'square' with note min(note, 0.07), through nothing else (base 0.07).
    quack: voiced 'sawtooth' rate 28 depth 0.04 cutoff 1400 (base 0.15). honk: voiced 'sawtooth' rate 10 depth 0.03 cutoff 1100 (base 0.15).
    croak: voiced 'sawtooth' rate 40 depth 0.08 cutoff 800 (base 0.15).
    chime: tone 'sine' at hz plus tone 'sine' at hz*2.01 with half the peak, note decays long (base 0.12).
    Returns (notes - 1) * gap + note (+ a little tail for chime). Never peak above 0.25.
  - Register BIRD_SFX recipes: 'bird-flush' (8 bandpass bursts 0.04 s, 0.06 s apart, 2200 Hz, peak 0.1, like hunt-flush
    but lighter), 'bird-shutter' (a click: highpass burst 0.02 s at 4000, then a lowpass burst 0.05 s at 900, peak 0.15),
    'bird-tick' (two sine tones 1320 then 1760 Hz, 0.12 s each, 0.1 s apart, peak 0.12).
  - `registerBirdSounds(birds)`: for each species, if !hasSound(birdSoundId(s.id)) registerSound(birdSoundId(s.id), recipeFor(s.call));
    and the three BIRD_SFX ids the same way. Safe to call twice.
- sounds.test.ts (new): for every CallKind, recipeFor({kind, hz: 1000, slide: 1.2, notes: 3, note: 0.1, gap: 0.15}) is a
  function; calling it with a fake AudioContext is NOT needed (no DOM): instead test an exported pure helper
  `callDuration(call: CallRecipe): number` that you add (= (notes - 1) * gap + note, chime + 0.3) and that recipeFor uses.

## Contract
Stub signatures unchanged. Sound ids: birdSoundId(species.id) = 'bird-<id>', and BIRD_SFX values.

## Done when
- npx vitest run src/birding/sounds.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/sounds*.ts

## Out of scope
Every other file (do not edit sound/ids.ts or sound/bus.ts).
~~~~

### 2D: flock simulation

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/flock.ts simulates flocks of birds: perching, flying to a perch, circling, swimming,
running, flushing, and writes each bird's pose. Pure functions of plain data, no three.js, no DOM, no allocation per step.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: Bird, Flock, FlockMode, FlockEnv, FlockFrame, Threat, PerchSpot,
  BirdSpecies (flight, speed, altitude, perches, flock, shy, size), BIRDING (flushVehicleSpeed, shotFlush).
- games/gnome-theft-auto/src/birding/flock.ts: the stub. Keep the 5 exported function signatures exactly.
- games/gnome-theft-auto/src/hunting/quarry.ts (skim): the house style of a pure animal step function.

## Change
flock.ts. Conventions: yaw 0 faces +z; heading from a direction (dx, dz) is Math.atan2(dx, dz). Forward vector of a
yaw: (sin yaw, cos yaw); right vector: (cos yaw, -sin yaw) is fine for slot placement as long as it is consistent.
Keep one module-level scratch PerchSpot for env.perch calls (no allocation in steps).

1. createFlock(id, species, size, x, y, z, mode, env, nextBirdId): builds `size` members with ids from nextBirdId(),
   seed = env.rnd(), phase = seed * 2PI. Slots (a loose blob): spacing = max(0.7, species.size * 2.2);
   for i: a = i * 2.39996, r = spacing * 0.6 * Math.sqrt(i); slotX = cos(a) * r, slotZ = sin(a) * r,
   slotY = (env.rnd() - 0.5) * spacing * 0.6 (0 for i = 0). Members start at centre + slot; perchX/Y/Z = their position.
   For mode 'perched' or 'swimming', give each member its own perch: env.perch([kind], x + slotX, z + slotZ, 2 + spacing, scratch)
   where kind = 'water' for swimming, else species.perches[0]; on success copy scratch into perchX/Y/Z and position;
   on failure use ground (env.ground) or water surface at the slot point. heading = env.rnd() * 2PI; home = (x, z);
   modeT: perched 20-60 s, swimming 25-60 s, circling 20-40 s, else 0; callT = callEvery[0] + rnd * span;
   sinceFlush = 999; acc = 0; targetKind = mode === 'swimming' ? 'water' : species.perches[0]; tx,ty,tz = x,y,z.
2. sendFlock(f, x, y, z, kind, env): mode 'flying' (or 'running' when species.flight === 'runner'), target = (x, y, z),
   targetKind = kind, modeT = 0.
3. circleFlock(f, cx, cz, env): runner species: do nothing. Else mode 'circling', tx = cx, tz = cz,
   ty = env.ground(cx, cz) + species.altitude * (1.2 + env.rnd() * 0.8), modeT = 20 + rnd * 20.
4. flushFlock(f, fromX, fromZ, env): away = heading from (fromX, fromZ) to the flock centre (+-0.5 rad random);
   dist = 40 + rnd * 30; destination (dx, dz) = centre + away * dist; look for a perch there:
   env.perch(species.perches, dx, dz, 25, scratch) -> sendFlock to it; else sendFlock to (dx, ground + 0, dz) kind 'ground'
   (runner: always kind 'ground' at (dx, dz) with dist 15 + rnd * 10). sinceFlush = 0. Swimming birds that flush
   ('swim' flight) fly low: they still use sendFlock (their cruise altitude is small).
5. stepFlock(f, frame, env): returns true when this step flushed the flock.
   a. sinceFlush += dt; phase of every member += dt * flapRate (below).
   b. Threat check, only in modes 'perched' and 'swimming' (and not within 3 s of the last flush):
      on foot: dist from player to centre < species.shy * k where k = 0.5 if footSpeed < 0.5, 0.8 if footSpeed < 4,
      else 1.2; and x0.5 more while frame.viewing (only when frame.onFoot).
      vehicle: any threat with speed > BIRDING.flushVehicleSpeed within max(6, species.shy * 2) of the centre.
      shot: frame.shot && player within BIRDING.shotFlush.
      On a threat: flushFlock(f, threatX, threatZ, env); return true at the end of the step.
   c. Mode behaviour (centre = f.x/y/z):
      - perched: each member sits at its perch (x,z = perch; y = perch y). Wing folded: wingAngle -1.35. Small life:
        every member turns its yaw by (rnd - 0.5) * 1.5 when sin(time * 0.7 + seed * 40) crosses 0.98 (cheap random hop);
        ground perchers bob y by up to 0.03 (pecking) with sin(time * 6 + seed * 20) > 0.9. pitch = bank = 0.
        modeT -= dt; at 0: pick a new perch near home: env.perch(species.perches, homeX + (rnd-0.5)*60, homeZ + (rnd-0.5)*60, 30, scratch)
        -> sendFlock; soar/hover species instead circleFlock(home) half the time; runner species walk instead
        (sendFlock -> 'running' at speed * 0.25 to a ground point 5-10 units away).
      - swimming: members float at water surface (env.water at their x,z; if null, set mode 'perched'), drift 0.25 u/s
        along their own yaw, turning slowly (yaw += sin(time * 0.3 + seed * 9) * 0.3 * dt); stay within 12 of the
        flock centre (turn back toward it when farther). wingAngle -1.35. modeT -> 0: fly to a new 'water' or 'shore'
        perch near home as in perched.
      - flying: move the centre toward (tx, tz) at species.speed: heading eases toward the target direction (turn rate
        2.5 rad/s), so curves are smooth. cruise y = max(env.ground(x,z), water) + species.altitude; within 20 units of
        the target (horizontal), y eases toward ty + 1.5 (descent); else toward cruise y (rate 2 u/s vertical, never
        below ground + 0.5 while far). Members: position = centre + slot rotated by heading, plus wobble
        (sin(time * 1.3 + seed * 10) * 0.3 on y and x). Members within 12 of the target ease (lerp factor 1 - exp(-3 dt))
        toward their own landing perch (perchX/Y/Z, assigned when the centre first comes within 12: env.perch(
        [targetKind], tx + slotX, tz + slotZ, 3, scratch), fallback = target + slot at target height).
        Arrival: centre within 1.5 of target horizontally -> mode 'swimming' if targetKind === 'water' else 'perched',
        modeT as in createFlock, home = target. Members snap to their perches.
        yaw of each member = heading; pitch = clamp(-vy / speed, -0.5, 0.5); bank = 0.
      - circling: the centre orbits (tx, tz) at radius R = 8 + species.size * 12 with angular speed speed / R, at height
        ty (+ sin(time * 0.4 + id) * 2). Hover species: R = 0, the centre hangs at (tx, ty, tz) with a 0.3 bob.
        Members: centre + slot rotated by heading (heading = the tangent direction), bank = 0.35 toward the centre.
        modeT -> 0: find a perch near the circle centre (radius 40) and sendFlock; none -> circle again (modeT reset).
      - running: runner species run along the ground toward (tx, tz) at species.speed (or the walk speed set by perched),
        y = ground; wings flutter (wingAngle = -0.6 + 0.5 * sin(phase)); arrival within 1 -> 'perched' with each
        member's perch = its current position (no env.perch call).
   d. Wing angle while airborne, by species.flight (members, using their phase):
      flap: 0.9 * sin(phase), rate 14. bound: cycle of 1 s per bird (phase-based): flapping (0.9 sin, rate 16) for the
      first 0.6, folded (-1.2) for 0.4; the bird's y dips by 0.25 during the fold. glide: flap 1 s (rate 10) then hold
      0.1 for 2 s. soar: 0.05 + 0.05 * sin(phase * 0.3). hover: 0.7 * sin(phase), rate 22. swim (flying): as flap.
      runner: never airborne. Perched/swimming: -1.35.
   e. f.x/y/z = the centre; keep it in sync when perched/swimming (average of the members, or just leave the centre).
   No allocation inside stepFlock (no arrays, no objects, no closures).
6. flock.test.ts (new): a fake env (ground = 0, water = null except x < -50 -> 0.2, perch writes a point near the asked
   spot of the first kind and returns true; rnd = a seeded LCG) and a fake species object (spread a minimal BirdSpecies:
   write it inline in the test with every field). Tests: createFlock makes `size` members with distinct ids; a perched
   flock with a walking gnome 1 unit away flushes (stepFlock returns true, mode becomes 'flying'); a perched flock with a
   gnome 100 away does not; a flying flock reaches its target and becomes 'perched' within 60 s of 0.05 s steps; a
   vehicle threat at speed 20 within range flushes it; a runner species never goes above ground + 0.01; wingAngle is
   -1.35 when perched.

## Contract
The 5 exported functions exactly as in the stub. Pose fields written: Bird.x/y/z, yaw, pitch, bank, wingAngle, phase.

## Done when
- npx vitest run src/birding/flock.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/flock*.ts

## Out of scope
Every other file.
~~~~

### 2E: perch index

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/perches.ts finds places for birds to settle: roof tops, fence and wall tops, tree
trunk and post tops (all from the world's collision boxes), and sampled ground, water and shore spots.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: PerchKind, PerchSpot.
- games/gnome-theft-auto/src/birding/perches.ts: the stub. Keep PerchIndex, classifyBox, createPerchIndex signatures.
- games/gnome-theft-auto/src/types.ts: `interface Box { minX, maxX, minZ, maxZ, h }` where h is the ABSOLUTE top height
  (world y), not a height above ground.

## Change
perches.ts:
- classifyBox(b, groundY): height = b.h - groundY; w = maxX - minX; d = maxZ - minZ; short = min(w, d); long = max(w, d).
  null when height < 0.6 or height > 25. 'tree' when long <= 1.6 and height >= 1.5 (tree trunks, posts, lamp-like
  things). 'fence' when short <= 0.8 and long >= 1.6 and height <= 3.5 (fences, walls). 'roof' when short >= 2.5 and
  height >= 2 (buildings). Else null.
- createPerchIndex(boxes, ground, water): LAZY. On the first find() (and again whenever boxes.length changed since the
  last build), build a grid: cell size 32, key = cx * 100003 + cz (numbers, not strings), values = arrays of
  { b: Box, kind } for every box with a non-null class (groundY = ground at the box centre). Building once over a few
  thousand boxes is fine; never per frame.
- find(kinds, x, z, radius, rnd, out): for each kind in order, try it; return true on the first success (write
  out.x/y/z/kind).
  - roof / fence / tree: collect candidates from the grid cells overlapping the circle (reuse ONE module-level array,
    clear it with length = 0), keep those of this kind whose centre is within radius; pick one with rnd. Point:
    roof = a random point inset 0.4 from the edges, y = b.h; fence = a random point along the long axis on the centre
    line, y = b.h; tree = the centre, y = b.h. Then out = that point.
  - ground: up to 6 tries of a random point in the circle (sqrt(rnd) * radius); accept when water(px, pz) === null;
    y = ground(px, pz).
  - water: up to 8 tries; accept when water(px, pz) !== null; y = that surface.
  - shore: up to 10 tries of a random dry point (water null) that has water within 3 units in one of 4 directions
    (x +- 3, z +- 3); y = ground.
- size(): number of indexed box perches (0 before the first find).
- perches.test.ts (new): classifyBox cases (a 0.3 x 0.3 x 4 post = tree, a 0.2 x 6 x 1.2 fence = fence, a 8 x 6 x 5
  house = roof, a 3 x 3 x 0.3 slab = null, ground offset respected: same house with groundY 10 and h 15 = roof);
  find('roof') near a house box returns a point on top of it; find(['water']) with a water function that is wet only for
  x < 0 returns x < 0; find(['fence', 'ground']) with no fences falls back to ground; find returns false when nothing fits.

## Contract
Stub signatures unchanged.

## Done when
- npx vitest run src/birding/perches.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/perches*.ts

## Out of scope
Every other file.
~~~~

### 2F: spawner

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/spawner.ts decides which species turns up where and when: the wind cycle, weights
by rarity x region x time x wind, a weighted pick, flock sizes. Pure.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: BirdSpecies, Wind, RARITY_WEIGHT, TimeLabel, RegionId.
- games/gnome-theft-auto/src/birding/spawner.ts: the stub. Keep its 4 signatures.

## Change
spawner.ts:
- windAt(time): s = sin(time * 2PI / 240) + 0.5 * sin(time * 2PI / 97 + 1). s < -0.45 -> 'calm', s > 0.6 -> 'blustery',
  else 'breezy'. Deterministic.
- speciesWeight(s, region, label, wind) = RARITY_WEIGHT[s.rarity] * (s.regions[region] ?? 0) * (s.time[label] ?? 0)
  * s.wind[wind] * (s.ambient ? 1.5 : 1).
- pickSpecies(birds, region, label, wind, rnd): weighted pick over speciesWeight (no array allocation: two passes over
  `birds`, first to sum, then to find); null when the sum is 0.
- flockSize(s, rnd): integer in [s.flock[0], s.flock[1]] inclusive.
- Also export `export function wildName(w: Wind): string` -> 'Calm' / 'Breezy' / 'Blustery'.
- spawner.test.ts (new): with two inline fake species (common in turfton by day; mythic in loch-moss only at
  'Neon Night'): weight 0 outside region or time; pickSpecies returns null when all weights are 0; over 2000 picks the
  common one wins far more often when both are possible; flockSize always within range; windAt returns all three values
  somewhere in 0..1000 s and the same value for the same time.

## Contract
Stub signatures unchanged plus wildName.

## Done when
- npx vitest run src/birding/spawner.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/spawner*.ts

## Out of scope
Every other file.
~~~~

### 2G: instanced bird view

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/birdView.ts draws every bird with InstancedMeshes: per species one InstancedMesh
per body mesh of its prefab plus one per wing, so a whole flock costs about 3 draw calls.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: Bird (x, y, z, yaw, pitch, bank, wingAngle), Flock (members, species), BirdSpecies (prefab, tint, trim, scale).
- games/gnome-theft-auto/src/birding/birdView.ts: the stub. Keep createBirdView(scene, capacity) and BirdView.
- packages/prefabs/src/instances.ts: how a prefab becomes InstancedMeshes (traverse, mesh.matrixWorld).
- packages/prefabs/src/build.ts lines 300-360 (fillPrefab / buildPrefab): a built prefab root has its static parts as
  direct Mesh children (merged, vertex-coloured), and each pivot as a child THREE.Group named 'wing-0' / 'wing-1'
  positioned at the pivot, holding that wing's mesh (positioned relative to the pivot).

## Change
birdView.ts:
- Per species, lazily on the first bird of that species: root = buildPrefab(s.prefab, { tint: s.tint, trim: s.trim,
  shadows: false, lights: false }) from '@lawn/prefabs'; root.updateMatrixWorld(true). Never add root to the scene and
  never dispose prefab geometry or materials (they are shared caches).
  - body: every direct child of root that is a Mesh -> new THREE.InstancedMesh(mesh.geometry, mesh.material, capacity),
    with local = mesh.matrix.clone().
  - wings: for k of [0, 1]: g = root.getObjectByName(`wing-${k}`); if present, for each Mesh child m of g ->
    InstancedMesh(m.geometry, m.material, capacity) with local = m.matrix.clone(), pivot = g.position.clone(), side k.
  - Every InstancedMesh: frustumCulled = false, castShadow = false, receiveShadow = false, count = 0,
    instanceMatrix.setUsage(THREE.DynamicDrawUsage), name `birds:${s.id}`; scene.add it once and keep it.
  - If buildPrefab throws (unknown prefab), remember the species as broken and skip it (console.warn once).
- update(flocks): reset every species' count to 0; for each flock, for each member: n = count of its species; skip if
  n >= capacity. Build the bird matrix in module-level scratch objects (no allocation): position (x, y, z), quaternion
  from Euler(pitch, yaw, bank, 'YXZ'), scale s.scale -> M. Body: setMatrixAt(n, M * local). Wing k: W = M * T(pivot) *
  Rz(angle) * local where angle = -wingAngle for wing-0 and +wingAngle for wing-1 (so positive wingAngle raises both
  tips, -1.35 folds both down). Then count++. After the loop: for each species set inst.count = its count on every one
  of its InstancedMeshes and instanceMatrix.needsUpdate = true when count > 0; mesh.visible = count > 0.
- stats(): { species: built species, drawn: birds drawn last update }.
- Keep it under ~150 lines. No test file (three.js needs WebGL for a real check; the planner checks it in the browser).

## Contract
Stub signatures unchanged. Wing rotation sign exactly as above (it matches flock.ts and the prefabs: wing-0 is at -x).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/birdView.ts

## Out of scope
Every other file.
~~~~

### 2H: birding save

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/birdSave.ts keeps the life list, heard list, photos, claimed milestones and optics in
localStorage (key 'gta-birding-v1'), parses tolerantly and merges two saves for the cloud save.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: BirdSaveData, BirdSighting, Milestone, MILESTONES, OPTICS.
- games/gnome-theft-auto/src/birding/birdSave.ts: the stub. Keep every export and signature.
- games/gnome-theft-auto/src/hunting/huntSave.ts and huntSave.test.ts: the same kind of module (tolerant parse, a store
  over Pick<Storage, 'getItem' | 'setItem'>, notifySaveChanged() after every write). Copy the approach.
- games/gnome-theft-auto/src/saveHook.ts: notifySaveChanged.

## Change
birdSave.ts:
- parseBirdSave(raw): null or broken JSON -> empty. Keep seen entries whose key is a non-empty string and value has
  first (string matching /^\d{4}-\d{2}-\d{2}$/) and count (integer >= 1); heard/photos: arrays of non-empty strings,
  deduplicated and sorted; claimed: integer 0..MILESTONES.length, else 0; optics: integer 0..OPTICS.length - 1, else 0.
- mergeBirdSaves(a, b): parse both; seen = union (for a key in both: the earlier `first`, the larger count); heard and
  photos = sorted unions; claimed = max; optics = max. Return JSON.stringify with keys in a fixed order and seen keys
  sorted, so merge(a, b) === merge(b, a) as text.
- createBirdStore(storage = localStorage when it exists, else an in-memory map): loads with parseBirdSave(getItem(BIRD_KEY));
  every change writes JSON and calls notifySaveChanged(); try/catch around storage (a throwing storage must not break
  the game).
  markSeen(id, now = new Date()): first sighting adds { first: now ISO date (YYYY-MM-DD), count: 1 } and returns true;
  later ones count++ and return false. markHeard / markPhoto: add to the sorted list, true when newly added.
  claimable(total): MILESTONES from index `claimed` on whose count (or `total` when count is 0) <= seenCount(), stopping
  at the first not reached. claim(total): sums their acorns, sets claimed past them, saves, returns the sum.
  setOptics(i) keeps the max of current and i.
- birdSave.test.ts (new): parse of garbage / null / partial; markSeen first true then false with count 2; claimable with
  5 seen -> the first milestone only, claim pays 50 and then claimable is empty; the count-0 milestone needs `total`;
  merge is symmetric as text and keeps the earliest first date and the larger count; storage that throws on setItem
  does not throw out of markSeen.

## Contract
Stub signatures unchanged. BIRD_KEY = 'gta-birding-v1' (already listed in saveIO.ts GTA_SAVE_KEYS and cloudSave.ts MERGES/GROWS
by the planner; do not edit those).

## Done when
- npx vitest run src/birding/birdSave.test.ts src/saveIO.test.ts src/cloudSave.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/birdSave*.ts

## Out of scope
Every other file, including saveIO.ts and cloudSave.ts.
~~~~

### 2I: scope (binocular view)

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/scope.ts is the binocular view: raised and lowered by the V key (KEYS.binoculars),
a gamepad's D-pad right, or setHeld() from the touch button; steers its own yaw/pitch from the look input; zooms;
asks for photos; and puts the camera at the gnome's eye with a narrow field of view.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: ScopeFrame, BIRDING (tapSeconds, eyeForward, pitchMin, pitchMax).
- games/gnome-theft-auto/src/birding/scope.ts: the stub. Keep every export and signature.
- games/gnome-theft-auto/src/keys.ts: KEYS.binoculars ('KeyV'), isTyping(e). Use KEYS.binoculars, never the literal
  'KeyV' (keys.test.ts scans modules for hard-coded keys).
- games/gnome-theft-auto/src/camera.ts lines 140-200: the chase camera's convention: forward = (sin(yaw) cos(pitch),
  -sin(pitch), cos(yaw) cos(pitch)), pitch positive = looking down. Do NOT edit camera.ts.
- games/gnome-theft-auto/src/gamepad.ts lines 30-110: the standard button indices (RIGHT = 15, RB = 5, RT = 7) and how it
  reads navigator.getGamepads(). Do NOT edit gamepad.ts; poll the pad yourself in update().

## Change
scope.ts:
- Pure helpers (exported, tested): angleToView(...) = the angle between the forward vector of (yaw, pitch) and the
  normalised direction from the eye to the point (acos of the clamped dot product; 0 when the point is at the eye);
  bearingTo(yaw, fromX, fromZ, x, z) = atan2(dx * cos(yaw) - dz * sin(yaw), dx * sin(yaw) + dz * cos(yaw)) negated if
  needed so that a point to the camera's RIGHT gives a positive bearing. The camera's right vector at yaw is
  (-cos(yaw), sin(yaw)) (from camera.ts: rightX = -Math.cos(chase.yaw), rightZ = Math.sin(chase.yaw)); so
  bearing = atan2(dx * -cos(yaw) + dz * sin(yaw), dx * sin(yaw) + dz * cos(yaw)). Test both with numbers.
- createScope(camera):
  - State: held (button or key down), latched, pressT (seconds the current press has lasted, -1 when not pressed),
    viewing, yaw, pitch, zoomIndex, snap flag, baseFov (camera.fov when raised), fovNow.
  - setHeld(down): on down: pressT = 0, and if latched -> unlatch (that press lowers). On up: if pressT >= 0 and pressT <
    BIRDING.tapSeconds and the press did not just unlatch -> latched = true. pressT = -1.
    Wanted = (held && pressT >= 0) || latched.
  - Keyboard: window keydown with e.code === KEYS.binoculars and !e.repeat and !isTyping(e) -> setHeld(true); keyup ->
    setHeld(false). While viewing: window 'wheel' (passive) -> zoom in/out by one step; window 'mousedown' with button 0
    -> requestSnap(). Store the listeners so dispose() removes them.
  - Gamepad (in update): first connected pad from navigator.getGamepads() (guard: typeof navigator, getGamepads may be
    undefined); D-pad right (buttons[15].pressed) edge down -> setHeld(true), edge up -> setHeld(false); while viewing:
    RT (7, value > 0.5) edge -> requestSnap(); RB (5) edge -> cycleZoom().
  - update(f): pressT += dt while pressed. wanted && f.canView -> if not viewing: raise (viewing = true, yaw = f.camYaw,
    pitch = clamp(f.camPitch - 0.15, BIRDING.pitchMin, BIRDING.pitchMax), baseFov = camera.fov, fovNow = camera.fov,
    zoomIndex = min(zoomIndex, f.zooms.length - 1)). !f.canView or !wanted -> lower (viewing false, latched false).
    While viewing: s = 1 / (0.6 + 0.4 * zoom()); yaw += f.lookYaw * s; pitch = clamp(pitch + f.lookPitch * s, pitchMin, pitchMax).
    Keep the last f.zooms for zoom()/cycleZoom().
  - zoom() = zooms[zoomIndex] (1 when not viewing); zoomLabel() = `${zoom()}x`; fov() = baseFov / zoom().
    cycleZoom(): zoomIndex = (zoomIndex + 1) % zooms.length.
  - takeSnap(): returns the flag and clears it. requestSnap(): sets it (only while viewing).
  - applyCamera(eyeX, eyeY, eyeZ, dt): no-op when not viewing. Forward f from (yaw, pitch); camera.position = eye + f *
    BIRDING.eyeForward; camera.lookAt(position + f) (use module-level scratch Vector3s); fovNow += (fov() - fovNow) *
    (1 - exp(-12 dt)); camera.fov = fovNow; camera.updateProjectionMatrix().
  - lower(): viewing = false, latched = false.
- scope.test.ts (new): angleToView 0 straight ahead (yaw 0 pitch 0, point at +z), ~PI/2 for a point at +x; bearingTo
  positive for a point on the camera's right at yaw 0 (the right vector at yaw 0 is (-1, 0), so x < 0 is right) and at
  yaw PI/2; the tap/hold logic through a scope built with a fake camera object
  ({ fov: 62, position: new THREE.Vector3(), lookAt() {}, updateProjectionMatrix() {} } cast as PerspectiveCamera) and
  update() with canView true: a short press latches (still viewing after release), a second press lowers, a long
  press views only while held, canView false lowers. Guard window/navigator use with typeof checks so tests run in node.

## Contract
Stub signatures unchanged.

## Done when
- npx vitest run src/birding/scope.test.ts src/keys.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/scope*.ts

## Out of scope
Every other file (camera.ts, gamepad.ts, input.ts and keys.ts are read-only).
~~~~

### 2J: scope UI (HUD row, overlay, call arrows)

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.) Plus: mobile by default. Every touch target is at least 44 x 44 px, no hover-only
UI, layout fits a 390 x 844 portrait and an 844 x 390 landscape phone with safe-area insets.

## Goal
games/gnome-theft-auto/src/birding/scopeUi.ts is all of birding's on-screen DOM except the journal: a small HUD row
(binocular button, journal button, life-list count, wind, one hint line), the binocular overlay (vignette, reticle,
zoom label, target label with a progress ring, Zoom / Snap / Done touch buttons), call arrows at the screen edge, and a
shutter flash.

## Read first
- games/gnome-theft-auto/src/birding/scopeUi.ts: the stub (ScopeUiHandlers, ScopeHudState, ScopeTarget, ScopeUi). Keep it.
- games/gnome-theft-auto/src/hunting/huntHud.ts: the house style (inline styles, 44 px buttons, panel colours, setHidden).

## Change
scopeUi.ts, createScopeUi(ui, handlers): append ONE container div (id 'gta-birding-ui') to `ui` (never restyle #ui).
- HUD row: position fixed, left calc(env(safe-area-inset-left) + 12px), top calc(env(safe-area-inset-top) + 268px),
  z-index 40, pointer-events none on the row, auto on buttons. Buttons (44 x 44, rounded 10px, panel
  rgba(20,40,38,0.88), border 1px #5a9a8a, light text): '🔭' (aria-label 'Binoculars (hold or tap, V)') and '📗'
  (aria-label 'Field journal'). Next to them a pill: `${seen}/${total}` + (claimable ? ' ★' : '') + ' · ' + wind.
  Under it, the hint line (small, hidden when null). Binocular button: pointerdown -> preventDefault, stopPropagation,
  setPointerCapture, handlers.onScopeDown(); pointerup and pointercancel -> handlers.onScopeUp(). Journal button:
  click -> handlers.onJournal(). Both also stopPropagation on touchstart so the game's floating joystick does not start.
  setHud(s): row display none when !s.visible; write texts only when they changed (no DOM churn per frame).
- Overlay (shown by setViewing(true), hidden otherwise; while shown the HUD row is hidden): position fixed, inset 0,
  pointer-events none, z-index 35. A vignette: radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.92) 62%),
  plus two overlapping circle outlines (the binocular look) using borders, sized min(70vw, 70vh). A small reticle (+)
  in the centre. Zoom label (top centre, under the safe-area top). Target label under the centre: name text + a 36 px
  SVG ring whose stroke-dashoffset shows progress (0..1); the ring turns gold (#f2c230) when centred. setTarget(null)
  hides it.
  Touch buttons, bottom centre row (bottom calc(env(safe-area-inset-bottom) + 24px)), pointer-events auto, each at
  least 56 x 56: 'Zoom' -> onZoom, '📷' (aria 'Snap photo') -> onSnap, 'Done' -> onLower. Use pointerdown with
  stopPropagation for snappy response. Desktop help text above them, small: 'Mouse: look · Wheel: zoom · Click: snap · V: lower'.
- Call arrows: a pool of 4 small elements (pre-made, no per-call creation) placed on an ellipse near the screen edge
  at angle `bearing` (0 = top centre, positive = clockwise, i.e. to the right): left = 50% + sin(b) * 42vw, top = 50% -
  cos(b) * 40vh, rotated to point outward; text '♪' plus '?' when !known. Each fades over 2.5 s (update(dt) reduces
  opacity); visible both in and out of the scope.
- flash(): a full-screen white div whose opacity goes 0.8 -> 0 over 0.25 s (driven by update(dt), no CSS animation needed).
- setHidden(true) hides everything (cutscenes, menus).
- No test file (DOM). Check with tsc.

## Contract
Stub signatures unchanged.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/scopeUi.ts
- Read the file once as a phone user: every button >= 44 px, nothing hover-only.

## Out of scope
Every other file.
~~~~

### 2K: field journal and hide counter

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.) Plus: mobile by default (44 px targets, fits 390 x 844 and 844 x 390 with
safe-area insets, scrolls inside itself).

## Goal
games/gnome-theft-auto/src/birding/journalUi.ts is the field journal sheet: the life list (every species as a card, a
black silhouette until seen), and at the Reedwatch Hide a counter tab (Dunnock Pell's tip, milestone pay-out, optics shop).

## Read first
- games/gnome-theft-auto/src/birding/journalUi.ts: the stub (JournalDeps, JournalUi). Keep it.
- games/gnome-theft-auto/src/birding/birdSave.ts: the BirdStore interface (stub; another worker fills it).
- games/gnome-theft-auto/src/birding/types.ts: BirdSpecies, OPTICS, MILESTONES, HIDE, NEW_SPECIES_ACORNS.
- games/gnome-theft-auto/src/hunting/lodgeUi.ts: a finished sheet of the same kind (tabs, cards, close button, Esc).
  Copy its structure and look, with a teal/reed palette (#5a9a8a accents) instead of the lodge's browns.
- packages/prefabs/src/icon.ts: prefabIconElement(id, fallbackEmoji, px, tint) from '@lawn/prefabs'.
- games/gnome-theft-auto/src/keys.ts: KEYS.close (Escape), isTyping.

## Change
journalUi.ts, createJournalUi(ui, deps): one sheet element appended to `ui`, built once, hidden until open().
- Header: title 'Field Journal' (tab 'list') or HIDE.name (tab 'hide'); tabs 'Life list' and (only when atHide)
  'Counter'; close button (44 x 44, '✕') -> close(); Escape (KEYS.close, !isTyping) closes when open.
- Life list tab: line `Life list ${seenCount}/${birds.length} · Photos ${photoCount}` and the next milestone
  (`Next: ${label} (${count || birds.length})` or 'All milestones reached'). A grid of cards, one per species in
  table order (auto-fill, min 150 px columns; one column under 360 px). Card: prefabIconElement(s.prefab, '🐦', 48,
  s.tint). Not seen: icon with style filter 'brightness(0)' and opacity 0.55, name '???' unless heard (then the name
  in italics and a small 'heard' tag), rarity shown only as '?', and s.hint. Seen: name, a rarity badge (common grey,
  uncommon green, rare blue, mythic gold), group, s.blurb, `First seen ${first} · seen ${count}x`, '📷' if photographed.
  Heard or seen cards have a 44 px '▶' button -> deps.playCall(s.id).
- Counter tab (atHide only): HIDE.keeper's line in quotes: deps.tip(). Milestones: list MILESTONES with ✓ for claimed,
  and a 'Collect N Acorns' button when store.claimable(birds.length) is not empty -> n = store.claim(birds.length);
  deps.earn(n, 'Birding milestone'); deps.onClaim(n); refresh. Optics: each OPTICS row with name, zooms ('2x / 4x'),
  blurb, and a button: 'Owned' (disabled) when index <= store.optics(), else `Buy (${price})` enabled when
  deps.acorns() >= price -> if deps.spend(price, o.name) { store.setOptics(i); deps.onOptics(i); refresh }.
- refresh() rebuilds the open tab's content (cheap enough: only on open and after changes, never per frame). Build card
  icons once per species and reuse them (prefabIconElement renders a canvas; do not re-render on every refresh).
- open(tab, atHide) shows it (tab 'hide' falls back to 'list' when !atHide); close() hides; isOpen().
- deps.play('shutter') on purchases is fine; no other sounds.
- No test file (DOM). Check with tsc.

## Contract
Stub signatures unchanged.

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/journalUi.ts

## Out of scope
Every other file.
~~~~

### 2L: the Reedwatch Hide (world)

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/hide.ts builds the Reedwatch Hide on the south shore of Loch Moss: the hide (a
wooden bird hide whose viewing slot faces the loch), a sign, a bird feeder, Dunnock Pell the keeper by the back door,
collision boxes, a map blip and the counter spot.

## Read first
- games/gnome-theft-auto/src/birding/types.ts: HIDE (x -630, z -546, yaw Math.PI, scale 2.5, name, keeper, blip).
- games/gnome-theft-auto/src/birding/hide.ts: the stub (HideWorld, HIDE_PROPS, createHide). Keep it.
- games/gnome-theft-auto/src/hunting/lodge.ts and lodge.test.ts: the same thing for the hunting lodge. Copy the approach
  (critterMesh for props, makeGnome + gnomeState for the keeper, boxAt helper, nearCounter, keeper turning to the player).

## Change
- hide.ts. Prefab ids (made by another worker at the same time, in packages/prefabs gta-birding-gear.ts):
  'reedwatch-hide' (about 3 wide (x) x 2 deep (z) x 1.6 tall at scale 1; front +z is the viewing slot; the door is on
  its back, -z), 'reedwatch-sign', 'bird-feeder'. Place them with critterMesh(id, scale) from '../critters'. Read
  critterMesh: if it throws for an unknown prefab id, wrap each build in try/catch and skip that prop, so the game runs
  before the prefabs land.
  World layout (the hide faces the loch to the north, -z; its back with the door faces south, +z, toward the road):
  - hide at (HIDE.x, HIDE.z), rotation.y = HIDE.yaw, scale HIDE.scale; box half sizes 3.9 (x) x 2.6 (z), height 4.2.
  - keeper Dunnock Pell at (HIDE.x + 1.2, HIDE.z + 3.6), facing +z (yaw 0) when idle, turning to the player within 12.
  - counter spot (where the player stands) at (HIDE.x + 1.2, HIDE.z + 5.2); nearCounter = within 3 of it.
  - sign 'reedwatch-sign' at (HIDE.x - 4.5, HIDE.z + 3.5), scale 1.5; feeder 'bird-feeder' at (HIDE.x + 5, HIDE.z + 2.5),
    scale 1.5, each with a small 0.3 x 0.3 box, height 1.6.
  - HIDE_PROPS: [{ id: 'hide' }, { id: 'keeper' }, { id: 'counter' }, { id: 'sign' }, { id: 'feeder' }] with their x, z.
  - Dunnock's look (same shape as HAZEL_LOOK in lodge.ts): hat 0x2f6b5e, shirt 0x8a7a52, pants 0x4a4a3a,
    skin 0xd9a066, boots 0x2a2a2a, beard 0xd8d8d0 (white beard), hair null-equivalent as lodge.ts allows (copy
    the HAZEL_LOOK field set and adjust; if the type wants a hair object, use { color: 0xd8d8d0, style: whatever value
    lodge.ts uses }), glasses true, freckles false, dress false, bowlCut null.
  - blip: { x: HIDE.x, z: HIDE.z, color: HIDE.blip, kind: 'shop', label: 'Reedwatch Hide' }.
- hide.test.ts (new, like lodge.test.ts): HIDE_PROPS ids in that order; every prop off every road (roadDistance > 10),
  in region 'loch-moss' (regionAt), and dry (waterAt(x, z) === null from '../terrain').

## Contract
Stub signatures unchanged.

## Done when
- npx vitest run src/birding/hide.test.ts passes
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/hide*.ts

## Out of scope
Every other file.
~~~~

### 2M: hide props, birding gear and achievements

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.) Plus: other planners may be appending to packages/achievements/src/catalog.ts at
the same time: add your block with one small Edit next to the existing 'gta-patient-eye' entry, never rewrite the file.

## Goal
Three Reedwatch Hide props and six birding reward items exist as prefabs, and six birding achievements reward them.

## Read first
- docs/roadmaps/prefab-library/_common.md: "What a prefab is", "Modelling rules", "Data rules", "Checks" (ignore its
  Environment, place names and Out of scope).
- packages/prefabs/src/catalog/gta-hunt-gear.ts: the same kind of file (props + gear rewards: lodge-cap wear-head,
  tuft-game-bag wear-back, quill-collar wear-neck with `wear`, grizzle-brush hold with grip). Copy its style exactly.
- packages/prefabs/src/catalog/gta-birding-gear.ts: the empty stub (already registered in catalog/index.ts).
- packages/achievements/src/catalog.ts around 'gta-tuft-trader' .. 'gta-patient-eye': the entry format.
- packages/achievements/src/achievements.test.ts: the reward rules (slot -> use: head 'wear-head', back 'wear-back',
  neck 'wear-neck', hand: read SLOT_USE there; every reward prefab used by ONE achievement only).

## Change
- gta-birding-gear.ts, `GTA_BIRDING_GEAR` with:
  props (category 'prop', uses ['place']):
  'reedwatch-hide': a wooden bird hide: a box shed about 3 wide (x) x 2 deep (z) x 1.6 tall, plank walls (wood colours),
  a sloping roof slightly overhanging, a long low horizontal viewing slot (a dark 'black' box inset) on the FRONT (+z)
  at eye height, a door on the BACK (-z), a few reed bundles at the base. Under 30 parts.
  'reedwatch-sign': a sign board on a post with a painted bird silhouette (like tuft-lodge-sign).
  'bird-feeder': a post with a small square tray and a little pitched roof, seeds on the tray.
  rewards:
  'birders-bobble-hat' (armor, wear-head): a knitted green-and-cream bobble hat.
  'field-binoculars' (trinket, wear-neck, with `wear`): small black binoculars on a strap.
  'plume-cape' (armor, wear-back): a short cape of overlapping feathers in many colours.
  'owl-feather-cap' (armor, wear-head): a brown cap with two owl ear-tuft feathers.
  'kiln-feather-quill' (tool, hold, grip): a long glowing orange feather (glow: true parts).
  'box-camera' (tool, hold, grip): a small boxy camera with a round lens.
  Tags include 'birding', 'gta', 'reward' (rewards) and the nouns. 5 examine lines each, voice like gta-hunt-gear.ts.
- packages/achievements/src/catalog.ts: append after 'gta-patient-eye' (game 'gnome-theft-auto', gameTitle 'Gnome Theft Auto'):
  { id: 'gta-first-tick', title: 'First Tick', description: 'Spot your first bird through the binoculars.',
    reward: { slot: 'head', prefabId: 'birders-bobble-hat', label: "Birder's Bobble Hat" } },
  { id: 'gta-life-list-10', title: 'Twitcher', description: 'Spot 10 species of bird.', target: 10,
    reward: { slot: 'neck', prefabId: 'field-binoculars', label: 'Field Binoculars' } },
  { id: 'gta-full-life-list', title: 'The Full Life List', description: 'Spot every species of bird in Turfton.',
    reward: { slot: 'back', prefabId: 'plume-cape', label: 'Plume Cape', exclusive: true } },
  { id: 'gta-night-owl', title: 'Night Owl', description: 'Spot all three owls.',
    reward: { slot: 'head', prefabId: 'owl-feather-cap', label: 'Owl-Feather Cap' } },
  { id: 'gta-mythic-sighting', title: 'Said To Be Seen', description: 'Spot a bird nobody believes in.',
    reward: { slot: 'hand', prefabId: 'kiln-feather-quill', label: 'Kiln-Feather Quill', exclusive: true } },
  { id: 'gta-bird-photographer', title: 'Hide Photographer', description: 'Photograph 10 species of bird.', target: 10,
    reward: { slot: 'hand', prefabId: 'box-camera', label: 'Box Camera' } },
  Check first that none of these achievement ids or prefab ids exist anywhere (grep packages/); if one does, add
  a '-gta' suffix to the prefab id and report it.

## Contract
Prefab ids and achievement ids exactly as above (the game uses them; hide.ts builds the three props).

## Done when
- npm test -w packages/prefabs: every test naming one of your ids passes
- npm test -w packages/achievements passes
- npx tsc --noEmit -p packages/prefabs: no error in gta-birding-gear.ts

## Out of scope
gta-birds.ts, catalog/index.ts, every games/ file.
~~~~

### 2N: the birding system (orchestrator)

~~~~text
Epic: 2 Build
Depends on: none (written against the stubs; the other modules are filled in parallel)

## Environment
(Paste of "Common environment" above.)

## Goal
games/gnome-theft-auto/src/birding/birding.ts wires every birding module into the one system app.ts already calls
(createBirding, already wired in app.ts by the planner): spawning and stepping flocks around the player, calls and the
heard list, the scope and spotting, photos, rewards, achievements, the hide and the journal.

## Read first
- games/gnome-theft-auto/src/birding/birding.ts: the stub: BirdingDeps, BirdingFrame, Birding. Keep them exactly.
- games/gnome-theft-auto/src/birding/types.ts: everything (BIRDING tuning, HIDE, OPTICS, NEW_SPECIES_ACORNS,
  BIRD_ACHIEVEMENTS, BIRD_SFX, birdSoundId, Flock, FlockFrame, FlockEnv, Threat, PerchSpot).
- The stubs (signatures only): species.ts (BIRDS, birdById), sounds.ts (registerBirdSounds), flock.ts (createFlock,
  sendFlock, circleFlock, stepFlock), perches.ts (createPerchIndex), spawner.ts (windAt, pickSpecies, flockSize,
  speciesWeight, and wildName(w) -> 'Calm' | 'Breezy' | 'Blustery' which 2F adds: if it is not there yet when you
  compile, write a local helper instead), birdView.ts, birdSave.ts (createBirdStore), scope.ts (createScope,
  angleToView, bearingTo), scopeUi.ts (createScopeUi), journalUi.ts (createJournalUi), hide.ts (createHide).
- games/gnome-theft-auto/src/hunting/hunting.ts: the sibling system (LCG rnd, debug ?hunt= spawn, prompt/interact,
  playAt / play2d from '../sound'). Copy its patterns.
- games/gnome-theft-auto/src/levels.ts: regionAt(x, z), REGIONS[id].name. src/terrain.ts: heightAt, waterAt(x, z) ->
  { surface, depth } | null.

## Change
birding.ts, createBirding(deps):
- Setup: registerBirdSounds(BIRDS); store = createBirdStore(deps.storage); hide = createHide(deps.scene);
  view = createBirdView(deps.scene, 32); perchIndex = createPerchIndex(deps.world.boxes, heightAt, waterSurface) where
  waterSurface(x, z) = waterAt(x, z)?.surface ?? null; LCG rnd like hunting.ts; env: FlockEnv = { ground: heightAt,
  water: waterSurface, perch: (kinds, x, z, r, out) => perchIndex.find(kinds, x, z, r, rnd, out), rnd }.
  scope = createScope(deps.camera). scopeUi = createScopeUi(deps.ui, { onScopeDown: () => scope.setHeld(true),
  onScopeUp: () => scope.setHeld(false), onZoom: () => scope.cycleZoom(), onSnap: () => scope.requestSnap(),
  onLower: () => scope.lower(), onJournal: () => (journal.isOpen() ? journal.close() : journal.open('list', false)) }).
  journal = createJournalUi(deps.ui, { birds: BIRDS, store, acorns: () => deps.economy.state().acorns,
  spend: (n, r) => deps.economy.spend(n, r), earn: (n, r) => deps.economy.earn(n, r), play: deps.play,
  playCall: (id) => play2d(birdSoundId(id), { param: 0.5 }), tip, onClaim: (n) => deps.hud.toast(`${HIDE.keeper} pays
  ${n} Acorns for your life list.`, 4000), onOptics: (i) => deps.hud.toast(`${OPTICS[i].name}: zoom to ${max zoom}x.`, 4000) }).
  cap = coarse pointer (matchMedia('(pointer: coarse)'), guarded) ? BIRDING.maxBirdsPhone : BIRDING.maxBirds.
  flocks: Flock[]; ids from counters. Reused objects: one FlockFrame, one threats array (fill it by index from a pool of
  Threat objects, set threats.length), one PerchSpot scratch.
- tip(): among species not yet seen (else all), the one with the highest speciesWeight over all (region, time label,
  'calm') combinations; return `Try ${REGIONS[bestRegion].name} at ${bestLabel} for a ${s.name}.` (when all are seen:
  'You have them all. Now find them again.'). Compute lazily on call (it is only used when the counter opens).
- recordSighting(s): first = store.markSeen(s.id). If first: deps.economy.earn(NEW_SPECIES_ACORNS[s.rarity],
  'New bird'); play2d(BIRD_SFX.tick); deps.hud.callout?.('NEW ON THE LIFE LIST', s.name); deps.unlock(firstTick);
  deps.increment(lifeList10); if every BIRDS species with group 'owl' is seen -> unlock(nightOwl); s.group === 'mythic'
  -> unlock(mythic); store.seenCount() >= BIRDS.length -> unlock(fullList); if store.claimable(BIRDS.length).length > 0
  -> toast `Milestone reached! ${HIDE.keeper} at ${HIDE.name} on Loch Moss has a reward for you.`; journal.refresh().
  Return first.
- update(f):
  1. Store px, py, pz (for applyCamera). shot = lastAmmo >= 0 && f.ammo < lastAmmo; lastAmmo = f.ammo.
  2. canView = f.onFoot && !f.paused && !journal.isOpen(). scope.update({ dt, canView, lookYaw, lookPitch, camYaw,
     camPitch, zooms: OPTICS[store.optics()].zooms }). viewing = scope.viewing(); scopeUi.setViewing(viewing);
     scopeUi.setZoom(scope.zoomLabel()).
  3. Threats: for each f.vehicles entry with |speed| > BIRDING.flushVehicleSpeed within 150 of the player -> next pool
     slot { x, z, speed: |speed| }.
  4. Spawn: spawnT -= dt; at <= 0: spawnT = BIRDING.spawnEvery; trySpawn(f.timeLabel, windAt(f.time)).
     trySpawn: total birds = sum of members; stop if flocks.length >= BIRDING.maxFlocks or total >= cap. Point: random
     angle, distance spawnMin..spawnMax from the player, clamped to +-(deps.world.half - 5). region = regionAt(point);
     s = pickSpecies(BIRDS, region, label, wind, rnd); none -> return. size = min(flockSize(s, rnd), cap - total).
     If env.perch(s.perches, x, z, 30, scratch): with chance 0.5 create it settled there (mode 'swimming' if
     scratch.kind === 'water', else 'perched'), else create it 'flying' 30 units farther out at ground + altitude and
     sendFlock(f, scratch.x, scratch.y, scratch.z, scratch.kind, env). If no perch: soar species or ambient ones are
     created 'flying' at ground + altitude and circleFlock(f, x, z, env); others are skipped. Ambient species: with
     chance 0.3 make it a sky flock (circleFlock at the point) even when a perch exists.
  5. Step: frameNo++. For each flock (index loop; remove with swap-and-pop): d = distance from the player to its centre;
     d > BIRDING.despawnRadius -> remove. f.acc += dt; if d <= BIRDING.nearRadius or (frameNo + flock.id) %
     BIRDING.farEvery === 0 -> fill the shared FlockFrame ({ dt: acc, time, playerX, playerZ, onFoot, footSpeed, threats,
     shot, viewing }) and stepFlock; acc = 0; if it returned true and d < 60 -> playAt(BIRD_SFX.flush, flock,
     { param: Math.min(1, flock.members.length / 10) }).
     Calls: flock.callT -= dt; at <= 0 reset to callEvery[0] + rnd * span; if d < BIRDING.callRadius: playAt(
     birdSoundId(s.id), flock, { bus: 'ambience', maxDist: BIRDING.callRadius, param: flock.sinceFlush < 5 ? 1 : 0.5 });
     if d < BIRDING.hearRange: store.markHeard(s.id) (journal.refresh() when it returns true) and scopeUi.showCall(
     bearingTo(viewing ? scope.yaw() : f.camYaw, px, pz, flock.x, flock.z), store.hasSeen(s.id)).
  6. view.update(flocks).
  7. Spotting, only while viewing: eye = (px, py + BIRDING.eyeHeight, pz); halfFov = scope.fov() * PI / 360; best =
     the member with the smallest angleToView(scope.yaw(), scope.pitch(), eye, member) among members with distance <=
     min(BIRDING.spotMax, (BIRDING.spotBase + s.size * BIRDING.spotPerSize) * scope.zoom()) and angle < halfFov *
     BIRDING.viewCone (skip whole flocks whose centre is farther than spotMax + 20). Dwell: same species as last frame
     -> dwellT += dt, else dwellId = id, dwellT = 0, counted = false. When dwellT >= BIRDING.spotSeconds and !counted:
     counted = true; recordSighting(s). Target: { label: store.hasSeen(id) ? s.name : '???', progress: hasSeen ? 1 :
     min(1, dwellT / spotSeconds), centred: angle < halfFov * BIRDING.photoCone }; none -> setTarget(null) and dwellId = null.
     Snap: if scope.takeSnap(): play2d(BIRD_SFX.shutter); scopeUi.flash(); if best is centred: if !hasSeen -> recordSighting;
     if store.markPhoto(id): earn(BIRDING.photoAcorns, 'Bird photo'), increment(photographer), toast `Photo: ${s.name}.`;
     else toast 'Photo taken. Nothing in the middle of the frame.' When not viewing: scope.takeSnap() (drain) and setTarget(null).
  8. hide.update(dt, px, pz). scopeUi.setHud({ visible: f.onFoot && !f.paused && !viewing, seen: store.seenCount(),
     total: BIRDS.length, claimable: store.claimable(BIRDS.length).length > 0, wind: wildName(windAt(f.time)),
     hint: near the hide (within 30) ? `${HIDE.name}: talk to ${HIDE.keeper}` : null }); scopeUi.setHidden(f.paused);
     scopeUi.update(dt).
  9. Debug: ?bird=<id> (URLSearchParams, guarded) spawns once on the first update, 12 units in front of the player
     (use f.camYaw for the direction); unknown id -> toast.
- prompt(player): null in a vehicle or airborne; hide.nearCounter -> `Talk to ${HIDE.keeper} (${HIDE.name})`.
  interact: when near the counter, journal.open('hide', true); return true. isOpen/close -> journal.
- applyCamera(dt): null when !scope.viewing(); else scope.applyCamera(px, py + BIRDING.eyeHeight, pz, dt) and return
  { yaw: scope.yaw(), pitch: clamp(scope.pitch(), -0.5, 1.2) }.
- spawn(id, x, z): species = birdById(id) or false; size = flockSize; a perch within 20 of (x, z) -> settled flock
  there; else a flying flock at ground + altitude circling (x, z). Returns true. Bypasses the caps.
- markSeen(id): unknown -> false; else recordSighting(species).
- region(): regionAt(px, pz). stats(): { flocks: flocks.length, birds: total members }.
- boxes: hide.boxes; blips: [hide.blip]; species: BIRDS.
- No test file required (it needs three.js and the DOM); keep pure decisions in the other modules.

## Contract
Stub signatures unchanged (app.ts already calls them).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto: no error in src/birding/birding.ts and src/app.ts

## Out of scope
Every other file, including app.ts (already wired) and the other birding modules (if one of their stubs lacks
something you need, write a local helper and say so in your report).
~~~~

### 2O: lore

~~~~text
Epic: 2 Build
Depends on: none

## Environment
(Paste of "Common environment" above.) Plus: other planners may append rulings to docs/lore/rulings.md at the same
time. Re-read the end of the file right before you append, take the next free R-number, and append with one Edit.

## Goal
The lore knows about birding in Turfton: a ruling on birds and birding, and entries for the Reedwatch Hide and Dunnock Pell.

## Read first
- docs/lore/README.md: how entries and rulings are written (front matter fields, sections).
- docs/lore/canon.md (skim) and docs/lore/rulings.md: R-021, R-049 and R-141 (animals are never harmed; sizes; hunting
  is tuft hunting). The last ruling's number.
- docs/lore/entries/apocrypha/tuft-and-tally-lodge.md and hazel-mattock.md: the sibling entries to copy.
- docs/lore/entries/apocrypha/loch-moss.md (the setting of the hide), mossy-wood.md (the "birds go quiet" loose thread:
  keep it unexplained), knot-hole-nora.md (a "pink plastic bird taller than Thorne Tower": a different, giant plastic
  thing; do not connect it to the Lawn Flamingo).
- Run first: npm run lore -- find bird ; npm run lore -- find owl ; npm run lore -- find flamingo ; npm run lore -- find magpie
  ; npm run lore -- find phoenix ; npm run lore -- find heron ; npm run lore -- find dunnock ; npm run lore -- find reedwatch.
  If any of the names below clash with canon, pick a close new name, use it consistently and REPORT it (the game code
  uses the names; the planner will sync them).

## Change
- docs/lore/rulings.md: append a ruling (next number), Applies to: apocrypha, gnome-theft-auto. Date 2026-11-23.
  Question: Gnome Theft Auto adds birding and many new birds. What is birding in Turfton, which birds are there, and
  are any of them more than birds? Ruling (plain prose): birding is watching; no license, no harm (R-021, R-049): gnomes
  look through binoculars, keep a life list and sometimes take a photograph. The Reedwatch Hide on the south shore of
  Loch Moss is kept by Dunnock Pell, who pays Acorns for life-list milestones and sells optics (Pocket Binoculars,
  Field Glasses, the Reedwatch Scope). Birds are gnome-sized per R-049 (a sparrow about a quarter of a gnome, a heron
  taller than one). List the 28 species by name and region, grouped: Turfton Rooftop Pigeon, Gutter Sparrow, Commons
  Starling, Loch Gull, Hedge Robin, Mossy Wren, Acorn Tit, Dandelion Finch, Tallgrass Skylark, Grey Reed Heron, Loch
  Sandpiper, Lawn Flamingo, Verge Kestrel, Fells Buzzard, Dust Flats Hawk, Barn Owl, Tawny Owl, Snowy Owl, Loch Puffin,
  Loch Swan, Snow Bunting, Fells Ptarmigan, Dust Flats Roadrunner, Turfton Parakeet, Hat-Pinching Magpie, Cloverfield
  Dodo, Kiln Phoenix, Moon Heron. The Lawn Flamingo is a real bird that gnomes keep mistaking for a lawn ornament. The
  Turfton Parakeets are said to have escaped from somewhere downtown long ago. The Kiln Phoenix (seen only at Golden
  Hour over the Dust Flats) and the Moon Heron (only on Neon Nights on the Loch Moss shore) are "said to be seen":
  whether they are birds at all stays a loose thread. Why: the user asked for birding and new birds; watching keeps
  every animal rule and gives a collecting hobby beside the tuft hunt.
- docs/lore/entries/apocrypha/reedwatch-hide.md (kind place) and dunnock-pell.md (kind person; an old, patient,
  white-bearded gnome in a teal hat and round glasses who whispers everything; never raises his voice near the water;
  says the phoenix is real and the heron is "probably real"). Front matter like hazel-mattock.md, sources:
  [docs/roadmaps/gta-birding.md, docs/lore/rulings.md#r-<n>, games/gnome-theft-auto/src/birding/types.ts], related:
  [loch-moss, tuft-and-tally-lodge, each other]. Sections: the one-line summary, What gnomes say (2 quotes),
  The truth, In the games, Loose threads.
- Do not edit existing entries (other planners may be editing them).

## Done when
- npm run lore passes (from the repo root). If it regenerates docs/lore/INDEX.md, keep that change.

## Out of scope
Everything outside docs/lore/; existing lore entries.
~~~~

## Epic 3: Check (planner)

- `npx tsc --noEmit -p games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`,
  `npm test -w packages/achievements`, `npm run lore`.
- Dev server on port 5411 (`--strictPort`), `bash tools/smoke.sh http://localhost:5411/ gta-birding-ui` at desktop and
  390x844; look at birds near Turfton and the Loch Moss hide (`?debug`, `__gta.birding.spawn(...)`), the scope, the
  journal; then kill the server and the browser.
- Party slice: none. A birding round needs a big world to roam and time to wait; it does not fit 20-60 s, four at once.
