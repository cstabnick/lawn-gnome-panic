Epic: 6 Wildlife and region life (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run `npm install`. Do not `git commit`, push or stash. Do not start a dev server and do not run `vite build` or `npm run build` (other workers share the tree).
- Many other workers are editing other files in `games/gnome-theft-auto/` and `packages/prefabs/` at the same time. Edit ONLY the files named under Change. Type or test errors in files you did not touch are other workers mid-edit: ignore them, re-run later.
- The prefab `squirrel` is being made right now by another worker. Until it lands `critterMesh` draws a grey box; that is fine.

## Goal

The Drey Gang, Cloverfield's squirrel gang, lives in three dens. When the player comes near on foot they raid: some pick the player's pocket for Acorns, others pelt the player with acorns that chip their clay. Now and then two of them mob a parked mower and drive off with it. Shooting one scatters the gang; they regroup.

## Read first

- `docs/roadmaps/gnome-theft-auto-wild-world/epic-6/_runtime.md`: the critter runtime contract and the rules.
- `games/gnome-theft-auto/src/critters.ts`: the runtime (read `createCritters`, `step`, `knock`).
- `games/gnome-theft-auto/src/critters.test.ts`: how to build a runtime in a test.
- `games/gnome-theft-auto/src/vehicles.ts`: `seatWorld(v: Vehicle, out: THREE.Vector3, seat = 0): THREE.Vector3` (the driver's seat in world space).
- `games/gnome-theft-auto/src/critters/dreyGang.ts`: the stub you fill.

## Change

- `games/gnome-theft-auto/src/critters/dreyGang.ts`: replace the stub. Keep `export const dreyGangLife: RegionLife` with `id: 'drey-gang'`.
  1. **Dens and groups** (all `region: 'cloverfield-farms'`, kind `squirrel`, spread 4, leash 14): `drey-hedge-west` at (-260, 520) count 6, `drey-hedge-east` at (260, 640) count 6, `drey-silo` at (420, 820) count 8. Export `DREY_DENS` (an array of `{ id, x, z, silo: boolean }`) so the test can use it.
  2. **Den props** (`init`), at each group's centre (`rt.inGroup(id)[0].homeX/homeZ`): two `fallen-log` prefabs (scale 2.5; 6.3 long, 1.1 tall, 1.05 thick) crossed in a V for the hedge dens; for `drey-silo` one `silo` prefab at scale 5 (6 wide, 12 tall), 6 units north of the centre, plus one collider `Box` for it pushed into `rt.world.boxes` (`{ minX: x-3, maxX: x+3, minZ: z-3, maxZ: z+3, h: 12 }`). Add meshes to `rt.scene`. Log colliders are not needed.
  3. **Raid** (`update`): a den is raided when the player is on foot within 45 units of it. On the first frame of a raid (and at most once every 90 s per den): `rt.deps.toast('The Drey Gang! Mind your Acorns.')`, `rt.deps.event('drey-raid')` (event at most once a minute overall). During a raid, every 3 s each squirrel of that den that is `idle` or `wander` takes a role in `c.data.role`: half (even index) are **pickers**: `rt.chase(c, 6)`; the rest are **throwers**: they stay 10 to 16 units from the player (use `rt.moveToward` with `c.mode = 'script'` while repositioning; set `c.y = heightAt(c.x, c.z)` yourself in script mode, and face the player) and throw an acorn every 1.6 s.
     - **Picking pockets:** a squirrel chasing within 1.2 units of the player on foot, at most once every 6 s per den: `const n = rt.deps.steal(5, 'Drey Gang')`; if `n > 0`, `rt.deps.toast(\`A Drey squirrel picked your pocket: -${n} Acorns\`)`; then that squirrel flees with the loot (`c.mode = 'idle'` then `rt.scare(c, ctx.playerX, ctx.playerZ, 6)`).
     - **Acorns:** a pool of at most 12 acorn meshes (`buildPrefab('acorn', { scale: 2, lights: false })`, created lazily, hidden when not flying). An acorn flies from the thrower (y + 0.6) to where the player is at the moment of the throw, on an arc (straight line in x/z at 14 units/s, plus `y = lerp + 2.5 * 4 * t * (1 - t)`), spinning. When it lands: if within 0.9 of the player's current position and the player is on foot, `rt.deps.hurtPlayer(0.03)`, `rt.deps.play('bump')`; then hide it. `rt.deps.fx.spark(x, y, z)` where it lands.
     - When the player leaves (more than 60 units from the den) or gets in a vehicle, the raid ends: throwers go back to `idle` (`c.mode = 'idle'`, the runtime walks them home).
  4. **Shooting scatters** (`onHit`, squirrels only; return `false` for every other kind): on cause 'shot' or 'blast', every squirrel of the same group that is not down flees from the player for 6 s (`rt.scare(other, fromX, fromZ, 6)`; set `mode = 'idle'` first if it was 'script' or 'chase'), and at most once per raid `rt.deps.event('drey-scattered')`. Return `false` so the shot one is also knocked over by the runtime. If the squirrel has `c.data.riding` set (on a stolen mower), return `true` for cause 'vehicle' (its own mower must not knock it).
  5. **Mower theft** (`update`): every 60 to 120 s (random), if the player is within 150 units of a den, look for a vehicle with `driver === 'none'`, `!questOwned`, `!exploded`, not flying (`!spec.flies`), `kind` one of 'ride-on', 'push-bike', 'zero-turn', 'lowrider', 'mulch-spreader', within 60 units of that den, and not within 8 units of the player. Two squirrels of the den run to it (`c.mode = 'script'`, `rt.moveToward(c, v.x, v.z, c.spec.run, dt)`). When both are within 1.5 units (or after 12 s), they jump on: set `v.questOwned = true`, `c.data.riding = v` on both, `rt.deps.toast('The Drey Gang stole a mower!')`, `rt.deps.event('drey-mower-stolen')`. Then drive it to a getaway point: the next den in `DREY_DENS` order: each frame turn `v.yaw` towards the target at up to 1.5 rad/s, `v.speed = 9`, `v.x += Math.sin(v.yaw) * 9 * dt`, `v.z += Math.cos(v.yaw) * 9 * dt`, `v.y = heightAt(v.x, v.z)`; put the riders on the seat each frame (`seatWorld(v, tmp, 0)`; `c.x/y/z` from it, the second rider 0.4 behind: subtract `0.4 * Math.sin(v.yaw)` / `0.4 * Math.cos(v.yaw)`; `c.yaw = v.yaw`). The ride ends when the mower is within 12 of the target, after 30 s, or at once if `ctx.playerVehicle === v` (the player took it back): `v.speed = 0`, `v.questOwned = false`, riders get `c.data.riding = undefined`, `c.mode = 'idle'` and `rt.scare(c, ctx.playerX, ctx.playerZ, 4)`. Only one theft at a time.
  6. Export small pure helpers for tests, e.g. `export function canSteal(v: Vehicle, denX: number, denZ: number, px: number, pz: number): boolean`.
- `games/gnome-theft-auto/src/critters/dreyGang.test.ts` (new), with a runtime built as in `critters.test.ts` and deps whose `steal` / `hurtPlayer` / `event` record their calls (`steal: (n) => { stolen += n; return n; }`):
  - three groups spawn (6, 6, 8 squirrels), all in 'cloverfield-farms';
  - the player standing on foot 20 units from `drey-hedge-west`'s centre for 20 simulated seconds (400 updates of 0.05 s, `time` advancing) causes at least one `steal` and at least one `event('drey-raid')`;
  - shooting one squirrel (`rt.hitTest(c.x, c.y + 0.3, c.z)`) knocks it down and puts at least 3 of its den mates in 'flee';
  - `canSteal` is false for a vehicle with driver 'player', with `questOwned`, or 80 units from the den, and true for a parked ride-on 30 units away;
  - no squirrel is ever removed.

## Contract

`export const dreyGangLife: RegionLife`, `export const DREY_DENS`. Group ids exactly `drey-hedge-west`, `drey-hedge-east`, `drey-silo`. Do not change `critters.ts`, `critters/index.ts`, `app.ts`, `economy.ts` or `vehicles.ts`.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/critters/dreyGang.ts` or its test.
- `npx vitest run --root games/gnome-theft-auto src/critters/dreyGang.test.ts` passes.

## Out of scope

`src/critters.ts`, `src/critters/index.ts`, the other files in `src/critters/` (other workers: `cloverfield.ts`, `fells.ts`, `commons.ts`), `app.ts`, `config.ts`, `economy.ts`, `vehicles.ts`, `traffic.ts`, `radio/` (Turfton FM bulletin text is a later epic; `event()` is the only hook), `packages/`. No new buttons, no networking.
