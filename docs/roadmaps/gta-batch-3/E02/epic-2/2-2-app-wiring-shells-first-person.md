Epic: E02-2 Wiring
Depends on: epic 1 (casings.ts, camera first person, achievements ids exist)
Items: L57 (acorn shells on the ground when firing), L76 (first-person mode, with touch and an Options row), achievements

(Environment: paste `../epic-1/_environment.md`.)

## Goal
In the running game: every bullet-gun shot drops an acorn shell; the player can switch to first person (F5, the More-menu "First person" tile on touch, gamepad via the More menu, or Options > View > First person), on foot and in vehicles; the two new achievements count.

## Read first
- `casings.ts`: `createCasings(scene)`, `eject(gun, x, y, z, yaw, vx?, vz?)` (ignores non-cartridge guns), `update(dt)`.
- `viewPrefs.ts`: `getFirstPersonPref()`, `setFirstPersonPref(on)`, event `gta:view-prefs` (the Options row already toggles the pref).
- `camera.ts` / `types.ts` `ChaseCamera`: `setFirstPerson(on)`, `firstPerson`, `update(..., extra: { boost, airborne, eye })` (first person needs `extra.eye`, the world point of the eyes).
- `ui/actions.ts`: action `firstPerson` (More-menu tile, `inMore: true`, shown once registered); `registerAction(id, { run })`. `keys.ts` `KEYS.firstPerson` = 'F5'. See how `options.ts` binds `KEYS.options` on keydown (`e.code === KEYS.options && !e.repeat`, skip when typing: `isTyping(e)` in keys.ts).
- `app.ts`: the firing block (~1770-1790: `if (weapons.ammo < ammoBefore) { ... chase.kick(shot.recoil); }`, `muzzle` is the world muzzle point), the camera block (~2025-2040: `mode`, `target`, `chase.update(...)`, the birding scope `birding.applyCamera` right after), `cutscene.active`, `chase.showroomActive`, `mount` (a mount sequence in progress), `deathT`, `player.airborne`, `player.swimming`, `player.ragdolling`, `player.model.object` (the gnome model), `crackedUp` (sets `player.model.object.visible = false` on death).
- `vehicles.ts` `seatWorld(v, out, seat)`.

## Change (app.ts only, plus player.ts if you need an eye helper)
- Shells: create once near the other systems `const casings = createCasings(scene);`; in the firing block when a shot happened and the player is not swimming: eject from the muzzle point with yaw = the vehicle's yaw when driving, else `player.yaw`, and the vehicle's velocity (`sin(yaw) * speed`, `cos(yaw) * speed`) when in one; if the gun is a cartridge gun (`pistol`, `smg`, `shotgun`, `rifle`) also `void achievements.increment('gta-shell-collector')`. Call `casings.update(dt)` once per frame (next to other effect updates).
- First person:
  - A local `function firstPersonAllowed(): boolean` = not `cutscene.active`, not `chase.showroomActive`, no `mount` in progress, `deathT <= 0`, not `player.airborne`, not `player.ragdolling`, no birding scope up (if `birding.applyCamera` returned an aim last frame, or a birding "is open" query exists, use it), not `introTour.active`.
  - Before `chase.update`: `const fp = getFirstPersonPref() && firstPersonAllowed(); chase.setFirstPerson(fp);` and pass `eye` in the extra object: on foot `(player.x, player.y + EYE_FOOT, player.z)` moved 0.12 m forward along the player's yaw; in a vehicle `seatWorld(v, tmp, player.seat)` + `(0, EYE_SEATED, 0)`. Measure the gnome once (`new THREE.Box3().setFromObject(player.model.object)` height at startup while standing) and set `EYE_FOOT = 0.9 * height`, `EYE_SEATED = 0.62 * height` (consts at the top of the block; fall back to 1.0 / 0.7 if the box is empty).
  - Hide the player's own gnome while first person is on (`player.model.object.visible = false`) and show it again when it goes off, but never re-show it while dead (`deathT > 0`) or if something else hid it: keep a `fpHid` flag and only restore what you hid.
  - Toggle: `registerAction('firstPerson', { run: () => setFirstPersonPref(!getFirstPersonPref()) })`; a keydown listener for `KEYS.firstPerson` (ignore repeats and typing; `e.preventDefault()` so F5 does not reload); a toast on change ("First person on" / "Third person") via `hud.toast`.
- Mobile: the More-menu tile is the touch path (44 px tiles already); check nothing else needs a key.

## Contract
Do not change camera.ts, viewPrefs.ts, casings.ts or ui/actions.ts. Online: first person and shells are local (nothing sent).

## Done when
- `npx tsc --noEmit -p .` clean.
- `npx vitest run src/keys.test.ts src/ui src/casings.test.ts src/cameraCorner.test.ts` pass.
- `npm test -w games/gnome-theft-auto` passes (the full suite; it includes the party slice contract test).

## Out of scope
Everything outside `app.ts` and `player.ts`.
