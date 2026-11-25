Epic: E25-2 (jobs III, parallel build)
Depends on: none (fire/sim.ts is filled in parallel; its stub already lights fires and leaves them burning, enough to
see the look)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Effects issue: the look matters (it must read as fire from 60 m
and on a phone, by day and night) and so does cost. You may run ONE dev server on port **5353** only
(`cd games/gnome-theft-auto && npx vite --port 5353 --strictPort`, background); stop it after.

## Goal
`fire/view.ts`: a reusable fire look for any FireField: flickering instanced flame cones, rising fx puffs, black smoke,
a pool of two point lights, steam when doused, smoke and a scorch disc after a fire is out. Plus the `?firedemo` dev
hook (`fire/demo.ts`) that lights fires ahead of the player to look at.

## Read first
- `games/gnome-theft-auto/src/fire/types.ts`: `Fire` (x, y, z, r, heat 0..1, state, since, kind), `FireField`, `FIRE`
  (`smokeS`).
- `games/gnome-theft-auto/src/fire/view.ts` and `fire/demo.ts`: the stubs (signatures to keep). `demo.ts` is already
  called every frame from `workplaces/index.ts`.
- `games/gnome-theft-auto/src/fire/sim.ts`: `createFireField`, `ignite`, `stepFires`, `douse`, `fuelPoint`.
- `games/gnome-theft-auto/src/fx.ts`: `fire(x, y, z, spread)` (one frame of flame + smoke puffs), `waterJet?`, how
  puffs are pooled (do not edit fx.ts).
- `packages/depth/src/layers.ts` + `games/gnome-theft-auto/src/biomes.ts` ~l.391: `flatLayer(material, LAYER.marking)`.

## Change
- `games/gnome-theft-auto/src/fire/view.ts`: implement `createFireView(scene, fx)`:
  - Flames: one `THREE.InstancedMesh` of a low cone (e.g. ConeGeometry(0.5, 1.2, 7, 1, true), origin at its base) with
    an additive, depthWrite-false MeshBasicMaterial with vertex/instance colours from orange to yellow; per burning
    fire draw 3-5 instances inside its radius (count by r), height and width scaled by `heat` and `r`, each flickering
    (scale and small sway by a per-instance phase; time from an internal clock). Capacity 160 instances; frustumCulled
    false on the InstancedMesh, `count` set per frame.
  - Puffs: call `fx.fire(x, y + 0.2, z, r)` for each burning fire on alternate frames (fewer when heat < 0.4).
  - Light pool: two `THREE.PointLight`s (orange, distance ~14, decay 2) moved to the two burning fires nearest the
    camera point, intensity by heat with flicker; intensity 0 when none.
  - Smoke after: 'out' and 'burnt' fires emit a grey puff now and then (through `fx.fire`'s smoke-only path is not
    available: build a small smoke sprite pool of your own, 40 billboards, rising and fading over 3 s), fading over
    `FIRE.smokeS`.
  - Scorch: one flat dark disc per fire once it is 'out' or 'burnt' (CircleGeometry, radius r * 1.3, material through
    `flatLayer(..., LAYER.marking)`, lifted 0.015 m, rotated flat), kept while the fire is in the field, removed with it.
  - `steam(x, y, z)`: a few white puffs rising fast (use your smoke pool, white, 1 s).
  - Skip fires farther than 220 m from (camX, camZ). `dispose()` removes everything it added.
  - Header comment: how another epic uses it (ignite / step / view.update / douse / steam).
- `games/gnome-theft-auto/src/fire/demo.ts`: `installFireDemo(scene, fx, player)`: with `?firedemo` in the URL, 2 s
  after load light, 10-16 m ahead of the player (direction (sin yaw, cos yaw)): a small 'bin' fire (r 0.5, y 0.9), a
  'shed' fire (r 1.4), a 'bbq' fire (r 0.6, y 0.8) and a 'toadstool' fire, plus a fuel point 3 m beside the shed fire
  that will catch; build `buildPrefab('fire-bbq-grill')` / `'garden-shed'` / `'giant-spotted-toadstool'` under them if
  `getPrefab` has them. Step the field and the view every frame (camera point = player). With `?firedemo=douse`,
  from 8 s on douse each fire with 2 litres a second and call `view.steam` there.
- Look at it: dev server on 5353, `node tools/gta-shots.mjs "http://localhost:5353/?offline&no-intro&firedemo&at=0,40,3.14" C:/Users/cpsai/AppData/Local/Temp/e25-fire near:0,46,3.14 far:0,90,3.14 --wait 8`
  (and once with `&time=night` if the `time` parameter accepts it: grep `get('time')` in app.ts), plus `--size 390x844`.
  Tune until it reads as fire, not as orange cones.

## Contract
`createFireView(scene, fx): FireView` (update, steam, dispose) and `installFireDemo(scene, fx, player): FireDemo`
exactly as in the stubs.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `src/fire/view.ts` and `src/fire/demo.ts`.
- Screenshots looked at (near, far, phone); `bash tools/smoke.sh "http://localhost:5353/?offline&no-intro&firedemo" gta-gnomlet`
  reports no console errors. Server stopped.

## Out of scope
`fire/sim.ts`, `fire/types.ts`, `fx.ts`, `workplaces/index.ts`, every other file.
