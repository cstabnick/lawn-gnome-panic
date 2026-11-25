Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/campsBuild.ts` builds the 26 hunter camps from `CAMPS` (tents, shared camps round a
fire, shacks, deer stands, duck blinds, drying racks) in one culled static batch with colliders, and brings them to life:
a crackling fire glow at night near the player, a sleeping hunter snoring at some, and a little loot to take with E
that refills later.

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `CampDef`, `CampKind`, `CampLoot`, `CAMP_LOOT_REFILL_S`,
  `FIRE_LIGHT_RANGE`, `CountryPart`, `COUNTRY_SAVE_KEY`.
- `games/gnome-theft-auto/src/country/camps.ts`: `CAMPS` (26 entries) and `camps.test.ts` (it checks no collider of the
  world lies within 6 m of a camp, except ones centred within 7 m of a camp: keep every camp piece within 6 m of its
  camp centre).
- `games/gnome-theft-auto/src/homes/pieces.ts`: `planPieces`, `buildPieces`, `HomePiece`.
- `games/gnome-theft-auto/src/ambientGnomes.ts` (`createAmbientGnomes`, idle ids: look for a sleep/sit idle in
  `AMBIENT_GNOMES` or `src/anim/`).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps`; `src/inventory.ts` `addItem`, `itemDef`; `src/sound/bus.ts`
  `playAt`.
- Prefabs: `hunter-tent`, `hunter-shack` (4 x 3), `deer-stand` (platform 3 m), `duck-blind`, `camp-tripod-kettle`,
  `camp-bedroll`, `camp-stool`, `game-feeder`, `antler-shed`, `camp-lantern-post` (all in
  `packages/prefabs/src/catalog/gta-country-camp.ts`), existing `campfire`, `fire-ring`, `tuft-drying-rack`,
  `drying-rack`, `timber-log`, `fallen-log`, `crate`.

## Change
`src/country/campsBuild.ts` (keep both exported signatures):
- `buildCamps(scene, boxes)`: for each camp, a layout in the camp's local frame (turned by `yaw`; front = +z local),
  every piece within 6 m of the centre:
  - `tent`: `hunter-tent` at (0, -1.5) facing +z, `fire-ring` + `campfire` at (0, 2), `camp-stool` at (1.5, 2.5),
    `camp-lantern-post` at (-1.6, -0.2), a `timber-log` seat at (-1.6, 2.3).
  - `camp`: two `hunter-tent`s at (-2.5, -2) and (2.5, -2) angled 20 degrees toward the fire, `fire-ring` + `campfire` +
    `camp-tripod-kettle` at (0, 1.5), two `camp-stool`s and a `fallen-log`, a `crate` of supplies.
  - `shack`: `hunter-shack` at (0, -1) (front +z), a `timber-log` chopping block and an `antler-shed` by the door, a
    `game-feeder` at (3.5, 2).
  - `stand`: `deer-stand` at (0, 0) (ladder on +z), a `game-feeder` 5 m in front at (0, 5)... keep within 6 m: (0, 5).
  - `blind`: `duck-blind` at (0, 0) (slot facing +z: toward the water), two `camp-stool`s inside behind it.
  - `drying`: `tuft-drying-rack` (or `drying-rack`) at (0, 0), a `camp-bedroll` at (-1.8, 1.2), a `camp-lantern-post`.
  Pieces go into ONE `buildPieces(scene, allPieces, 'hunter-camps')` call (a single culled static batch). Colliders:
  `buildPieces`' default for solid pieces is fine, but no collider on bedrolls, stools, fires or logs (`solid: false`).
  Push them into `boxes`.
- `installCamps(deps): CountryPart`:
  - Fires: one shared `THREE.PointLight` (warm, range ~12, intensity tuned to look like a campfire) moved to the nearest
    camp with a fire within `FIRE_LIGHT_RANGE` of the player at night (`deps.timeLabel()` night labels; check `TimeLabel`
    values in `src/atmosphere.ts`), flickering a little; off by day or when none is near. While the player is within
    25 m of a camp with a fire, play `country-campfire` there every 1.2 s.
  - Sleepers (`sleeper: true`): an ambient gnome lying or sitting asleep by the fire (or the shack door), hunter look
    (olive coat 0x6b7a3a, tan hat 0xc9b98f), built only when the player is within 120 m, removed beyond 160 m; bubble
    line one of "Zzz... Not the tuft, the other tuft...", "Mm. Five more minutes. Then the deer.", "Leave the tin. It's
    for the next one."; `country-snore` every 4-6 s within 20 m.
  - Loot: per camp, a "taken at" wall-clock ms saved in `COUNTRY_SAVE_KEY`... NO: that key belongs to the achievements
    module. Save loot times under your own key `gta-camp-loot-v1` (a JSON `{ [campId]: ms }`; tell the lead in your
    report so it can add the key to `saveIO.ts`). `prompt(x, z)`: within 2.5 m of a camp centre and the loot is ready
    (never taken, or taken more than `CAMP_LOOT_REFILL_S` ago) → `loot.prompt` (e.g. "Check the biscuit tin"); taken
    recently → null. `interact`: acorns → `deps.economy.earn(acorns, 'Camp tin')`, item → `addItem(item, n)` (0 fitted →
    toast "Your bag is full." and do not mark taken); mark taken; toast "<camp name>: +<what>. Somebody will fill it
    again." Return true only when handled.
  - Map: no blips (camps are for finding).

## Contract
Both signatures unchanged. Every piece within 6 m of its camp centre. Loot save key `gta-camp-loot-v1`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/country/camps.test.ts src/flora src/sites.test.ts` passes (the camps test now also sees your
  colliders: they must stay within 6 m of each camp).

## Out of scope
`src/country/camps.ts`, `src/country/types.ts`, `src/country/achievements.ts`, `src/saveIO.ts`, every other file.
