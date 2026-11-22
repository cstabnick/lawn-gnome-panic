Epic: 6 Wildlife and region life (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run `npm install`. Do not `git commit`, push or stash. Do not start a dev server and do not run `vite build` or `npm run build` (other workers share the tree).
- Many other workers are editing other files in `games/gnome-theft-auto/` and `packages/prefabs/` at the same time (water, terrain, other regions, the prefabs this issue uses). Edit ONLY the files named under Change. Type or test errors in files you did not touch are other workers mid-edit: ignore them, re-run later.
- The prefabs `cow`, `sheep`, `pig`, `hen` are being made right now by another worker. Until they land, `critterMesh` draws a grey box; that is fine. Use only the prefab ids written here.

## Goal

Cloverfield Farms has herds: cows and sheep loose in the fields, pigs in a pen by Granny's farm, hens pecking about. They scatter from mowers; the combine and the mulch spreader herd them instead; running into a cow on foot tips it (a stunt worth Acorns).

## Read first

- `docs/roadmaps/gnome-theft-auto-wild-world/epic-6/_runtime.md`: the critter runtime contract and the rules. Everything you call is listed there.
- `games/gnome-theft-auto/src/critters.ts`: the runtime itself (read `createCritters`, `step`, `knock`).
- `games/gnome-theft-auto/src/critters.test.ts`: how to build a runtime in a test with a fake world and deps.
- `games/gnome-theft-auto/src/critters/cloverfield.ts`: the stub you fill.

## Change

- `games/gnome-theft-auto/src/critters/cloverfield.ts`: replace the stub. Keep `export const cloverfieldLife: RegionLife` with `id: 'cloverfield-farms'`.
  1. **Groups** (all `region: 'cloverfield-farms'`, world coordinates; the runtime nudges each centre to open land):
     | id | kind | x, z | count | spread | leash |
     |---|---|---|---|---|---|
     | `clover-cows-west` | cow | -140, 480 | 6 | 10 | 30 |
     | `clover-cows-east` | cow | 200, 760 | 5 | 10 | 30 |
     | `clover-sheep-south` | sheep | 120, 560 | 8 | 12 | 35 |
     | `clover-sheep-west` | sheep | -220, 800 | 7 | 12 | 35 |
     | `clover-pigs` | pig | -130, 360 | 4 | 3 | 5 |
     | `clover-hens-granny` | hen | -50, 345 | 10 | 5 | 10 |
     | `clover-hens-east` | hen | 300, 650 | 8 | 5 | 10 |
  2. **Pig pen** (`init`): around the pig group's centre (`rt.inGroup('clover-pigs')[0].homeX/homeZ`), a square pen 14 x 14 of `wooden-fence` prefabs at scale 2 (`buildPrefab('wooden-fence', { scale: 2, lights: false })`; one section is 4.0 long along x, 1.2 tall, 0.16 thick; rotate `Math.PI / 2` for the sides along z), with a 4-unit gap in the south side as a gate, and one `water-trough` (scale 1.5) inside. Add each piece to `rt.scene`. Push one collider `Box` per side segment into `rt.world.boxes` (h 1.2, thickness 0.4), leaving the gate open. Keep fence sections from overlapping each other (step by the section length, no shared faces between touching boxes: leave 0.02 between them).
  3. **Herding** (`update`): if `ctx.playerVehicle` is a `'combine'` or `'mulch-spreader'` with `Math.abs(speed) > 2`, every cow, sheep or pig within 18 units of it that is not `down` gets `c.fleeDir = { x: Math.sin(v.yaw), z: Math.cos(v.yaw) }` (the vehicle's heading) and `rt.scare(c, v.x, v.z, 2)`: they run ahead of the machine instead of scattering. When 5 or more animals are herded at once, at most once every 60 s: `rt.deps.toast('Herding the herd!')`, `rt.deps.earn(10, 'Herding')`, `rt.deps.event('herd-herded')`.
  4. **onHit** for kinds cow, sheep, pig, hen only (return `false` for anything else): if `cause === 'vehicle'` and the player is driving a combine or mulch spreader slower than 8 units/s, return `true` (it nudges the herd, no knock-over). Otherwise return `false` (the default knock-over runs). Also, on any knock of a `hen`, 1 time in 3, `rt.deps.toast('Feathers everywhere.')`.
  5. **Cow tipping** (`update`): when the player is on foot (`!ctx.playerVehicle`), moving at `ctx.playerSpeed > 4`, and a cow that is `idle` or `wander` is within `c.spec.radius + 0.6` of the player, and that cow's `c.data.tipT` (seconds since its last tip, start at 999) is over 20: call `rt.knock(c, ctx.playerX, ctx.playerZ, 'foot')`, then `rt.deps.callout('COW TIPPED!', '+20 Acorns')`, `rt.deps.earn(20, 'Cow Tipping')`, `rt.deps.play('stunt')`, `rt.deps.event('cow-tipped')` (event at most once a minute). Count `tipT` up by `ctx.dt` for every cow.
  6. Export the pure helpers you write for tests, e.g. `export function isHerder(v: Vehicle | null): boolean` (true for kind 'combine' or 'mulch-spreader').
- `games/gnome-theft-auto/src/critters/cloverfield.test.ts` (new): with a runtime built like `critters.test.ts` (`createCritters(new THREE.Scene(), world, deps, [cloverfieldLife])`, a fake `world = { boxes: [], ... }`):
  - every group spawns with its count, each member's `region` is 'cloverfield-farms';
  - a moving combine (`{ kind: 'combine', x, z, yaw: 0, speed: 5, spec: { radius: 2, flies: false }, exploded: false }` as the `playerVehicle` and in `vehicles`) 10 units behind a cow sets its `fleeDir` to about (0, 1) and its mode to 'flee';
  - the player on foot running into an idle cow (`playerSpeed: 6`) knocks it over (`mode === 'down'`) and calls `earn(20, ...)` once; a second contact within 20 s does not earn again;
  - after 600 updates of 0.05 s no critter has been removed (`rt.list.length` unchanged).

## Contract

`export const cloverfieldLife: RegionLife` (type from `../critters`). Group ids exactly as in the table. Do not change `critters.ts`, `critters/index.ts` or `app.ts`.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/critters/cloverfield.ts` or `src/critters/cloverfield.test.ts`.
- `npx vitest run --root games/gnome-theft-auto src/critters/cloverfield.test.ts` passes.

## Out of scope

`src/critters.ts`, `src/critters/index.ts`, the other files in `src/critters/` (other workers: `dreyGang.ts`, `fells.ts`, `commons.ts`), `app.ts`, `config.ts`, `economy.ts`, `radio/`, `packages/`. No new buttons, no networking.
