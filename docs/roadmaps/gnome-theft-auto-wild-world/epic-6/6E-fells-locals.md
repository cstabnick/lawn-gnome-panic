Epic: 6 Wildlife and region life (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run `npm install`. Do not `git commit`, push or stash. Do not start a dev server and do not run `vite build` or `npm run build` (other workers share the tree).
- Many other workers are editing other files in `games/gnome-theft-auto/` and `packages/prefabs/` at the same time. Edit ONLY the files named under Change. Type or test errors in files you did not touch are other workers mid-edit: ignore them, re-run later.
- The prefabs `polar-bear`, `deck-chair` and `icicle-scarf` are being made right now by another worker. Use `critterMesh(id, scale)` from `../critters` for the bear and chair (a grey box until they land). For the scarf, check `getPrefab('icicle-scarf')` from `@lawn/prefabs` and only add the equipment when it exists.

## Goal

Frostbite Fells has its locals: a field of snowmen that break when shot or driven through and are rebuilt overnight; a sgnowme village of frost-glazed townsgnomes who wander about and put their hands up when shot at; and a row of really chill polar bears lounging in deck chairs in sunglasses, who only ever shrug.

## Read first

- `docs/roadmaps/gnome-theft-auto-wild-world/epic-6/_runtime.md`: the critter runtime contract and the rules.
- `games/gnome-theft-auto/src/critters.ts`: the runtime (`createCritters`, `knock`, the `calm` spec flag: a polar bear is `calm`, so the runtime never moves it).
- `games/gnome-theft-auto/src/gnomes.ts`: `randomTownLook()`, `makeGnome(scene, look)` (adds a `GnomeModel` to the scene), `gnomeState(x, y, z, yaw, speed)` (pass to `model.update(state, dt)` each frame), `poseHandsUp(model, t)` (call AFTER `model.update`), `clearHandsUp(model)`, `randomGnomeName()`.
- `games/gnome-theft-auto/src/critters.test.ts`: how to build a runtime in a test.
- `games/gnome-theft-auto/src/critters/fells.ts`: the stub you fill.

## Change

- `games/gnome-theft-auto/src/critters/fells.ts`: replace the stub. Keep `export const fellsLife: RegionLife` with `id: 'frostbite-fells'`, `groups: []` (everything is spawned in `init`). All positions are world coordinates in region 'frostbite-fells'; nudge each centre with `openSpot(x, z, r, 'frostbite-fells', rt.world) ?? { x, z }`.
  1. **Snowman field** around (-120, -720): 14 snowmen (`buildPrefab('snowman', { scale: 1.3, lights: false })`, 1.3 wide x 2.9 tall at that scale), on a jittered 4 x 4 grid with 6-unit spacing (skip 2 cells), random yaw, `y = heightAt(x, z)`. Keep each in a list `{ mesh, x, z, smashed: boolean }`.
     - Shot (`hitTest`): a point within 0.8 (x/z) of a standing snowman and below `heightAt + 2.9` smashes it. Driven through (`update`): any vehicle with `Math.abs(speed) > 3` within `v.spec.radius + 0.7` smashes it.
     - Smash: `mesh.visible = false`, `rt.deps.fx.smash?.(x, y + 1.2, z, 0xffffff)`, `rt.deps.play('smash')`, `rt.deps.earn(2, 'Snowman')`, and at most once a minute `rt.deps.event('snowman-smashed')`.
     - Rebuilt overnight: when `ctx.night` rises past 0.6 (it was below 0.6 last frame), every smashed snowman stands again (`visible = true`, `smashed = false`). Also rebuild any snowman that has been smashed for 300 s (so a session with no night still sees them come back). The sgnowmes build them (lore R-049); no animation needed.
  2. **Sgnowme village** around (160, -720): 4 `log-cabin` prefabs (scale 4: 10 wide, 6.8 tall, 7 deep) at offsets (-14, -12), (14, -12), (-14, 12), (14, 12) from the centre, each facing the centre (yaw `Math.atan2(cx - x, cz - z)`), each with one collider `Box` pushed into `rt.world.boxes` (half-sizes 5.2 x 3.7 around its position whatever its yaw, h 6.8; do this in `init` only). Then 8 sgnowmes:
     - Look: `export function sgnowmeLook(): GnomeLook` = `{ ...randomTownLook(), hat: pick([0xf4f8ff, 0xbfe6ff, 0x9ec6de]), shirt: pick([0xe6f2ff, 0xcfe3f5, 0x7fb2d9]), pants: 0xdfe9f2, skin: 0xf4f8fb, beard: Math.random() < 0.7 ? 0xffffff : null, hair: null, dress: false }` plus `equipment: { neck: 'icicle-scarf' }` when `getPrefab('icicle-scarf')` exists. (`GnomeLook` from `@lawn/gnome`; `equipment` is a field of it.)
     - Built with `makeGnome(rt.scene, sgnowmeLook())`. Each walks between random points within 20 units of the village centre that are not inside a cabin collider, at 1.4 units/s, idles 2 to 5 s at each, and each frame calls `model.update(gnomeState(x, heightAt(x, z), z, yaw, speed), dt)`. Hide (`model.object.visible = false`) and skip updating any sgnowme further than 190 units from the player.
     - Shot (`hitTest`: within 0.45 in x/z and between ground and ground + 1.1): hands up and runs away from the player at 4 units/s for 5 s (call `poseHandsUp(model, t)` after `model.update` while scared, `clearHandsUp(model)` when it ends), and 1 time in 2 `rt.deps.toast(\`${name}: "${line}"\`)` with `name` from `randomGnomeName()` (picked once per sgnowme) and a line from `SGNOWME_LINES` (export it; 5 short lines in the lore voice, e.g. 'It is frost glaze, not snow. I do not melt.', 'Mind the snowmen, we only just built them.'). They do not crack and are never removed. A vehicle within 3 units moving faster than 2 scares them the same way (no toast).
  3. **Polar bears** at the sun deck around (330, -640): 5 deck chairs in a row along x, 4 units apart, facing south (+z, yaw 0): `critterMesh('deck-chair', 1.2)` at `y = heightAt`. In each chair a bear: `rt.spawn('polar-bear', x, z, { region: 'frostbite-fells', group: 'fells-bears', mode: 'script', yaw: 0 })`; keep `c.y = heightAt(x, z) + 0.36` every frame (script mode: the runtime does not set y). The runtime builds the bear mesh lazily (`c.object` may be null until the player is within 190).
     - **Really chill** (`onHit`, only for `c.kind === 'polar-bear'`, return `false` for every other critter; ALWAYS return `true` for a bear): whatever the cause (shot, vehicle, blast), the bear shrugs: if it is not already shrugging (`c.data.shrugT` undefined or <= 0), set `c.data.shrugT = 1.6`; at most once every 8 s per bear `rt.deps.toast(pick(BEAR_SHRUGS))` (export `BEAR_SHRUGS`, 5 lines, e.g. 'The polar bear shrugs.', 'The polar bear lowers its sunglasses, looks at you, and pushes them back up.', '"Whatever, little guy."'); at most once a minute `rt.deps.event('bear-shrug')`. Bears never chase, never flee, never move, never fall over, never join a fight.
     - Shrug animation (`update`, when `c.object` exists): while `shrugT > 0`, `s = Math.sin(Math.PI * (1 - shrugT / 1.6))`; arms: `c.object.getObjectByName('arm-0').rotation.z = -0.9 * s`, `arm-1` `+0.9 * s`; head: `head.rotation.z = 0.25 * s`. Otherwise a slow idle: head turns `rotation.y = 0.3 * Math.sin(ctx.time * 0.3 + c.id)`. Count `shrugT` down by `dt`. Guard every `getObjectByName` against null.
  4. Export `SNOWMAN_COUNT = 14` and the pure helpers you write (e.g. `export function nightRose(prev: number, now: number): boolean`).
- `games/gnome-theft-auto/src/critters/fells.test.ts` (new), with a runtime built as in `critters.test.ts` (fake `world = { boxes: [], ... }`, recording deps):
  - after create: 5 critters of kind 'polar-bear', `rt.world.boxes` grew by 4;
  - shooting a bear (`rt.hitTest(b.x, b.y + 1, b.z)`) returns true, the bear's mode is still 'script', `shrugT > 0`, and it did not move; a fast vehicle driven onto a bear for 20 frames leaves it in place and never 'down';
  - `nightRose(0.5, 0.7)` true, `nightRose(0.7, 0.8)` false;
  - `sgnowmeLook()` returns a white or ice-blue hat from the list.
  (Snowman and sgnowme hit tests may be covered too if easy; the bear tests are required.)

## Contract

`export const fellsLife: RegionLife`, `export function sgnowmeLook(): GnomeLook`, `SGNOWME_LINES`, `BEAR_SHRUGS`, `SNOWMAN_COUNT`. Bears are critters of kind 'polar-bear' in group 'fells-bears'. Do not change `critters.ts`, `critters/index.ts`, `gnomes.ts`, `app.ts`.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/critters/fells.ts` or its test.
- `npx vitest run --root games/gnome-theft-auto src/critters/fells.test.ts` passes.

## Out of scope

`src/critters.ts`, `src/critters/index.ts`, the other files in `src/critters/` (other workers: `cloverfield.ts`, `dreyGang.ts`, `commons.ts`), `gnomes.ts`, `npcs.ts`, `app.ts`, `config.ts`, `radio/`, `packages/`. No new buttons, no networking.
