Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none

(Read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first: environment, coordinates and the new places.)

## Goal
The prefabs E28's gates, roundabouts and traffic gnomes need exist in `@lawn/prefabs`, and four new Gnome Theft Auto
achievements (two regions, a roundabout lap, the traffic hat's wave) are in the achievements catalog with cosmetic
rewards; entering Pardonlin or the Unmown unlocks its achievement through the existing band hook.

## Read first
- `packages/prefabs/README.md` and `docs/roadmaps/prefab-library/_common.md`: `PrefabDef` rules (parts `s`/`d`/`at`/
  `rot`/`c`/`seg`/`mirror`, `footprint`, `about`, `examine` lines, tags, categories, gear `uses: ['wear-head']` etc.).
- `packages/prefabs/src/catalog/gta-pebblewick-b.ts` (`pebblewick-welcome-sign`: a sign built from parts; signs carry
  painted symbols, no text) and `packages/prefabs/src/catalog/cosmetics-head-b.ts` (`snowcap-tuque`, a head gear item)
  and `cosmetics-neck.ts` (`trellisdown-cravat`).
- `packages/prefabs/src/catalog/index.ts`: how a catalog file is registered (import + list; "Add a new file here and
  nowhere else").
- `packages/achievements/src/catalog.ts` lines ~1149-1168 (`gta-band-highlands` ... `gta-band-estates`) and
  `packages/achievements/README.md`.
- `games/gnome-theft-auto/src/bandAchievements.ts` (biome -> achievement id map) and its test.

## Change
- New `packages/prefabs/src/catalog/gta-continental-kit.ts` exporting `GTA_CONTINENTAL_KIT: PrefabDef[]`, registered in
  `catalog/index.ts`. Life-size metres, front on +z, gnome-scale (a gnome is ~1 m tall), cheerful and a bit satirical:
  - `traffic-podium`: a round drum podium ~1.4 m wide, 0.6 m high, red/white stripes, a step. footprint r 0.8.
  - `stop-go-paddle`: a hand-held round paddle on a stick (~0.9 m), red face one side, green the other. category
    'tool', uses ['hold'] if other held tools use that; otherwise 'place'.
  - `wicket-gate`: a pair of tall square gate posts with ball finials and one open wrought-iron gate leaf swung back,
    6 m wide between posts, ~3.2 m tall. footprint r 3.5.
  - `customs-hut`: a small striped sentry booth (~2 x 2 m, 2.8 m tall) with a little window, a lamp on top and a raised
    red-and-white boom barrier beside it.
  - `roundabout-planter`: a circular raised flower bed, radius 1 m (it gets scaled), kerb ring, soil, a ring of
    flowers and a clipped box ball in the middle. footprint r 1.
  - `lost-suitcase`: a battered travel case, half open, a folded map sticking out. footprint r 0.5.
  - `wicket-sign`: a board on two posts with a painted hat and a big stamp mark (Pardonlin's welcome).
  - `unmown-sign`: a rustic board on a post with a painted crossed-out mower and a flower.
- Head and neck gear, in the cosmetics files (`cosmetics-head-b.ts`, `cosmetics-neck.ts`) like `snowcap-tuque`:
  - `hoa-traffic-hat` (head): a tall white-and-HOA-green striped hat with a peak and a little whistle on a cord.
  - `pardonlin-beret` (head): a floppy beret with a tiny stalk and a ribbon.
  - `meadow-crown` (head): a crown of woven grass and wildflowers.
  - `roundabout-rosette` (neck): a round rosette with an arrow ring going anticlockwise.
- `packages/achievements/src/catalog.ts`, after `gta-band-estates`, four entries (game 'gnome-theft-auto', gameTitle
  'Gnome Theft Auto'), each with a short dry title and description and its reward
  `{ slot, prefabId, label }`:
  - `gta-band-pardonlin`: enter Pardonlin through a Wicket. Reward head `pardonlin-beret`.
  - `gta-band-unmown`: walk or drive into the Unmown. Reward head `meadow-crown`.
  - `gta-roundabout-lap`: go all the way round a roundabout. Reward neck `roundabout-rosette`.
  - `gta-hat-wave`: wait at a traffic warden's line until you are waved through. Reward head `hoa-traffic-hat`.
- `games/gnome-theft-auto/src/bandAchievements.ts`: add `continental: 'gta-band-pardonlin', preserve: 'gta-band-unmown'`
  to `BAND_ACHIEVEMENTS`; update its test if it lists the map.

## Contract
Prefab ids exactly: `traffic-podium`, `stop-go-paddle`, `wicket-gate`, `customs-hut`, `roundabout-planter`,
`lost-suitcase`, `wicket-sign`, `unmown-sign`, `hoa-traffic-hat`, `pardonlin-beret`, `meadow-crown`,
`roundabout-rosette`. Achievement ids exactly: `gta-band-pardonlin`, `gta-band-unmown`, `gta-roundabout-lap`,
`gta-hat-wave`. Other workers place these prefabs by id right now.

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `cd games/gnome-theft-auto && npx vitest run src/bandAchievements.test.ts` passes; `npx tsc --noEmit -p games/gnome-theft-auto` passes.

## Out of scope
Every other game file. No game code beyond `bandAchievements.ts` (the lead wires the lap and wave unlocks).
