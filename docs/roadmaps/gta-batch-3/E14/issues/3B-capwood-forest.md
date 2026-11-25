Epic: E14-3 (places and quests)
Depends on: E14-2 (merged in the worktree: the Capwood Run route, the toadstool prefabs, achievements)
Worker: Sonnet (general-purpose) — dressing and environmental storytelling

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, places, people, contracts).

## Goal
Capwood, the toadstool forest (source request L17 "add a toadstool forest somewhere"), built in
`src/capwood/forest.ts`: a forest of giant toadstools gnomes drive and walk under, glowing at night, with drifting
spores, a glowing fairy ring, the Warden's hut, residents, signs, story vignettes and its own sound. It must read as a
place with a story, not a scatter (acceptance criteria below).

## Read first
- `games/gnome-theft-auto/src/capwood/forest.ts` (stub to fill; keep the signature), `src/capwood/spots.ts`,
  `src/dirtCountry/types.ts`
- `packages/prefabs/src/catalog/gta-dirt-rally.ts` (the new prefabs: `capwood-toadstool-tall` 9 m, `-squat`, `-cluster`,
  `capwood-puffball`, `capwood-stage-flag`, `capwood-ford-sign`), existing: `toadstool-cottage` (Warden's hut),
  `giant-spotted-toadstool`, `mushroom-lamp`, `red-mushroom`, `hay-bale`; any other prop via `npm run lore`-style search:
  `grep -rn "id: '" packages/prefabs/src/catalog/<file>.ts`
- `src/pardonlin/town.ts` (how a place turns plan data into `buildStaticCells` cells, colliders with `shape: 'round'`,
  and sign text: `buildSignText(signs: PlanSign[])` is exported; `PlanSign`, `PlanProp`, `Vignette` types in
  `src/pardonlin/plan.ts`) and `src/pardonlin/life.ts` (moving ambient life, seeded randomness)
- `src/ambientGnomes.ts` (`AmbientGnomeDef`, `createAmbientGnomes(scene, defs)` → `{ update(dt, px, pz) }`),
  `src/homes/data.ts` (`registerHome`, `homeOf`), `src/cull.ts` (`buildStaticCells`, `registerCull`), `src/quality.ts`
- sound: `src/sound/index.ts` (`playAt(id, pos, opts)`), `src/sound/ids.ts` (existing sound ids), `src/pardonlin/sound.ts`
  (a place's ambient sound spots as a worked example)
- lore: `docs/lore/entries/apocrypha/capwood.md`, `chanterelle-stook.md`, rulings R-189..R-192 at the end of
  `docs/lore/rulings.md`

## Change
- `src/capwood/forestPlan.ts` (new, pure data, no three.js): deterministic (seeded) placements inside the
  `toadstool-forest` site (x 100..400, z -1280..-1080): about 25 `capwood-toadstool-tall` (tints from a red/orange/brown
  palette, scales 0.7-1.3), 35 `-squat`, 45 `-cluster`, 15 `capwood-puffball`, with density highest round the centre and
  thinning at the edges, plus small `red-mushroom` / `mushroom-lamp` filler. Keep-outs: `nearTrack(x, z, 4)` (the
  Capwood Run, `src/raceTrack/tracks.ts`), 12 m round `WARDEN_HUT`, `GREAT_RING.r + 4` round the ring centre, 6 m round
  each `CAP_COUNT_SPOTS` point (each of those gets one hand-placed tall or squat cap with a white `capwood-stage-flag`
  (scale 0.5) stuck beside it: "a ticket-flag"), no two stems closer than the sum of their footprint radii + 1. Export
  `CAPWOOD_PLAN: { props: PlanProp[]; signs: PlanSign[]; vignettes: Vignette[]; residents: AmbientGnomeDef[] }`.
- Storytelling content in the plan (tone: dry, gnome-scale; follow the lore):
  - at least 4 vignettes (props arranged to tell a story without text, each with a `story` sentence): e.g. a mower
    nose-first in a bruised cap with a ticket stuck under its wiper and a dropped pen; a picnic abandoned under a giant
    cap with an umbrella open beneath it; a half-dug hole by a stump, shovel left standing, a "Tall-One wood: do not dig"
    sign knocked flat; a camera tripod and folding stool aimed at the Great Ring;
  - at least 5 signs with jokes that fit (e.g. "CAPWOOD. Section Nine applies.", "Do not lick the caps (Section Four).",
    "Fines payable in acorns or a sincere apology.", "Bruise-free zone", a notice board of fines);
  - residents: Warden Chanterelle Stook by her hut (her look from `_env.md`; a ticket-writing idle if an anim fits;
    bubble lines in her voice) and at least one more gnome doing something Capwood-specific (a spore-sweeper with a
    broom, a forager with a basket being careful not to bruise anything).
- `src/capwood/forest.ts` `createCapwoodForest(scene, world, deps)`:
  - builds the plan with `buildStaticCells(placements, { lights: false, name: 'capwood' })` and pushes colliders to
    `world.boxes`: round boxes for tall/squat stems (radius = stem, height = stem top: walk/drive under the caps) and
    puffballs; clusters and filler have no collider. The Warden's hut is `toadstool-cottage` at `WARDEN_HUT` with a round
    collider; call `registerHome({ ...homeOf('chanterelle')!, door: [x, z, yaw] })` with the spot outside its door.
  - night glow: caps glow faintly after dark (R-192): an `InstancedMesh` of emissive/additive dome shells (or discs
    under the caps), opacity = `0.15 + 0.6 * night`, one per tall/squat cap; the Great Ring: a ring of 16 small glowing
    toadstools (instanced) round `GREAT_RING` and a darker "fairy ring" of grass on the ground (a `RingGeometry` with
    `flatLayer(material, LAYER.decal)` or the layer other ground decals use; check `@lawn/depth` `LAYER`).
  - spores: one `THREE.Points` cloud of at most 240 points (scale by the quality tier if `quality.ts` exposes a particle
    budget) drifting slowly upward round the player while the player is inside the site rect (+30 m), hidden otherwise,
    pale yellow and brighter at night.
  - sound: ambient spots (2-4) in the forest using existing sound ids that fit (wind, leaves, a drip, birds at day,
    crickets/owl at night; whatever ids exist), played with `playAt` on a timer when the player is within ~60 m, as
    `pardonlin/sound.ts` does.
  - achievement: the first time the player is within `GREAT_RING.r` of its centre while `night > 0.5`, call
    `deps.unlock('gta-toadstool-trail')` and `deps.toast('The Great Ring glows. Section Nine does not apply to looking.')`.
  - `blips()`: one blip `{ x: 250, z: -1180, color: '#c8382e', kind: 'landmark' (or the kind other landmarks use), label: 'Capwood' }`.
  - everything static is culled through `buildStaticCells`/`registerCull`; the update does nothing heavy when the player
    is far (> 400 m from the site centre).
- `src/capwood/forest.test.ts` (new): plan props all inside the site rect; none within `nearTrack(x, z, 3)`; none within
  the hut/ring/spot keep-outs except the hand-placed ones; stems do not overlap; counts (>= 20 tall, >= 4 vignettes,
  >= 5 signs, >= 2 residents); `createCapwoodForest` builds into a `THREE.Scene` with the fake DOM
  (`installFakeDom` from `src/testing/fakeDom`, see `src/raceTrack/trackMesh.test.ts`) and adds colliders, none of
  them on a mowable plant (`src/flora/world.test.ts` guards that rule; run it).

## Contract
Keep `createCapwoodForest(scene, world, deps): Area`. Do not move `spots.ts` values. Achievement id
`gta-toadstool-trail` (exists in `packages/achievements`).

## Done when
- `npx tsc --noEmit -p .` passes for your files.
- `npx vitest run src/capwood/forest.test.ts src/flora/world.test.ts` passes.
- Report: counts, vignette list (name, x, z, story), sign texts, residents, sound ids used, keep-out results.

## Out of scope
`capwood/run.ts` (another worker), `capwood/spots.ts`, `rutbottom/`, quests, `raceTrack/`, `app.ts`, prefab files (if a
prop you need does not exist, use the closest existing prefab and say so).
