Epic: 2 Runtime
Depends on: Epic 1 (store, snapshot, safeSpot, sling, ui, phone are filled)

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (TypeScript, three.js, DOM).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your file. Mobile: the store button is at least 44 px tall. Keys come from keys.ts
(`KEYS.garage` = 'KeyT'); never write a key-code string yourself (keys.test.ts checks it).

## Goal
Fill `games/gnome-theft-auto/src/lockup/runtime.ts`: the Lock-Up at runtime. Store the vehicle you drive into a
LockupSite (T or a "Store in Lock-Up" button), open the Lock-Up sheet on foot there (take out / scrap), and the phone's
Sling-Lift app: a scripted chopper lowers a stored vehicle near the player. One world instance per stored uid.
app.ts wiring is NOT yours (the planner does it).

## Read first
- games/gnome-theft-auto/src/lockup/runtime.ts: the stub. `LockupPlayer`, `LockupDeps`, `Lockup` are the contract (keep them exactly).
- games/gnome-theft-auto/src/lockup/types.ts and lockup/config.ts (`LOCKUP.sites`, `LOCKUP.delivery`, `LOCKUP.scrapValue`).
- games/gnome-theft-auto/src/lockup/store.ts (`createLockupStore`), snapshot.ts (`storageKindOf`, `cannotStore`,
  `snapshotVehicle`, `restoreVehicle`), safeSpot.ts (`findSafeSpot`), sling.ts (`planSling`, `startSling`, `stepSling`,
  `createSlingRig`), ui.ts (`createLockupUi`), ../phone/phone.ts (`Phone.addApp`).
- games/gnome-theft-auto/src/vehicles.ts: `removeVehicle(scene, v)`, `syncVehicleMesh(v, dt)`.
- games/gnome-theft-auto/src/fleet.ts: `fleetEntry(id)`; config.ts: `VEHICLES`, `MOWER_TINTS`.

## Change
games/gnome-theft-auto/src/lockup/runtime.ts, `createLockup(deps)`:
- State: `store = deps.store ?? createLockupStore()`; `instances = new Map<string, Vehicle>()` (uid -> world instance
  this session); `uidOf = new WeakMap<Vehicle, string>()`; `cooldown = 0`; `flight: { uid, plan, state, rig, load: Vehicle } | null = null`.
  Helper `forget(v)`: `removeVehicle(deps.scene, v)`; splice v out of `deps.vehicles` if present.
  Helper `register(uid, v)`: instances.set + uidOf.set.
  Helper `siteAt(x, z)`: the first `LOCKUP.sites` entry with hypot(x - s.x, z - s.z) <= s.radius, or null.
  Helper `spotOpts(maxDist)`: `{ radius: D.clearRadius, minDist: D.minDist, maxDist, maxSlope: D.maxSlope, maxWater: D.maxWater }` with D = LOCKUP.delivery.
- The sheet: `const ui = createLockupUi(deps.ui, { store, isOut: (uid) => instances.has(uid), fee: () => LOCKUP.delivery.fee,
  cooldownLeft: () => cooldown, scrapValue: (rec) => Math.round(LOCKUP.scrapValue * rec.hp), deliver: (uid) => callDelivery(uid),
  takeOut, scrap })`.
- Phone app: `deps.phone.addApp({ id: 'sling-lift', label: 'Sling-Lift', icon: '🚁', detail: () => \`${store.list('ground').length}/${store.capacity('ground')} in the Lock-Up · ${LOCKUP.delivery.fee} Acorns a drop\`, run() { const why = deps.blocked(); if (why) deps.hud.toast(why); else ui.open('ground', 'phone', 'Sling-Lift · Side-Valve Lock-Up'); } })`.
- `storeVehicle(v)`: kind = storageKindOf(v); owned = uidOf.has(v); `const err = cannotStore(v, kind, owned)`; return err if set.
  If owned: `store.update(uid, snapshotVehicle(v))`. Else: `rec = store.add(snapshotVehicle(v), kind)`; if null return
  \`The Lock-Up is full (${store.capacity(kind)}/${store.capacity(kind)}). Scrap one first.\`.
  If `deps.player().vehicle === v` call `deps.stepOut(v)` first. Then `forget(v)`, `instances.delete(uid)`.
  Toast \`${name} stored in the Lock-Up (${store.list(kind).length}/${store.capacity(kind)}).\`, `deps.play('door')`.
  If `store.free(kind) === 0` call `deps.achievements.unlock('gta-lockup-full')`. Return null.
- `takeOut(uid)`: rec = store.get(uid) (null -> 'No such vehicle.'); `instances.has(uid)` -> 'It is already out.';
  site = the first LOCKUP.sites entry whose storageKind is store.kindOf(uid); `findSafeSpot(site.x, site.z, deps.probe, spotOpts(30))`
  null -> 'No room outside the Lock-Up right now.'; `v = restoreVehicle(deps.scene, rec, spot.x, spot.z, spot.yaw)`;
  `v.y = spot.y`; `syncVehicleMesh(v, 0)`; push into deps.vehicles; register; toast \`${rec.name} rolled out of the Lock-Up.\`; play('door'); null.
- `scrap(uid)`: rec (null -> 'No such vehicle.'); inst = instances.get(uid); if inst and `deps.player().vehicle === inst`
  -> 'Get out of it first.'; if flight?.uid === uid -> 'It is in the air.'; if inst: forget(inst), instances.delete(uid).
  `store.remove(uid)`; value = Math.round(LOCKUP.scrapValue * rec.hp); `deps.economy.earn(value, 'Scrap')`;
  toast \`Tansy scrapped the ${rec.name}: +${value} Acorns.\`; null.
- `callDelivery(uid, free = false)` checks, in order, returning the sentence:
  no record -> 'No such vehicle.'; flight -> 'The Sling-Lift is already on its way.'; `store.kindOf(uid) !== 'ground'`
  -> 'The Sling-Lift only carries ground vehicles.'; `!free && cooldown > 0` -> \`The Sling-Lift is refuelling: ${Math.ceil(cooldown)} s.\`;
  inst && `deps.player().vehicle === inst` -> 'You are already driving it.'; `!free && deps.economy.state().acorns < fee`
  -> \`The Sling-Lift costs ${fee} Acorns.\`. Then p = deps.player();
  `spot = findSafeSpot(p.x, p.z, deps.probe, spotOpts(D.maxDist)) ?? findSafeSpot(p.x, p.z, deps.probe, spotOpts(D.searchMax))`;
  null -> 'Nowhere dry and flat to set it down near you.'.
  Then: `if (!free) deps.economy.spend(fee, 'Sling-Lift')`. If inst: `store.update(uid, snapshotVehicle(inst))`, forget(inst),
  instances.delete(uid) (the chopper fetches it: one instance only). `plan = planSling(spot, Math.random() * Math.PI * 2)`;
  `state = startSling(plan)`; `rig = createSlingRig(deps.scene)`;
  `load = restoreVehicle(deps.scene, store.get(uid)!, state.hx, state.hz, spot.yaw)` (NOT pushed into deps.vehicles yet);
  register(uid, load); flight = { uid, plan, state, rig, load }; toast \`Sling-Lift is on its way with your ${name}.\`;
  play('whistle'); return null.
- `update(dt)`:
  - `cooldown = Math.max(0, cooldown - dt)`.
  - Flight: `ev = stepSling(f.state, f.plan, dt)`. While `!f.state.released`: `load.x = state.hx; load.z = state.hz;
    load.y = state.loadY; load.speed = 0; syncVehicleMesh(load, 0)`. `f.rig.update(f.state, dt)`. On 'released':
    `load.x = plan.drop.x; load.z = plan.drop.z; load.y = plan.drop.y; load.yaw = plan.drop.yaw; syncVehicleMesh(load, 0)`;
    `deps.vehicles.push(load)`; `cooldown = LOCKUP.delivery.cooldownS`; toast \`Sling-Lift: your ${load.spec.name} is down.\`;
    play('door'); `deps.achievements.unlock('gta-special-delivery')`. On 'gone': `f.rig.dispose(); flight = null`.
  - Every 2 s (accumulate dt): for each [uid, v] of instances, skipping the flight load while not released:
    if `v.exploded`: `store.remove(uid)`, instances.delete(uid), toast \`Your ${v.spec.name} was written off. Its Lock-Up slot is free.\`;
    else if `!deps.vehicles.includes(v)`: instances.delete(uid) (someone else removed it); else `store.update(uid, snapshotVehicle(v))`.
  - Every 1 s while `ui.isOpen()`: `ui.refresh()`.
  - The store button: a `button.gta-lockup-fab` appended (with its own <style>) to deps.ui, text '🔒 Store in Lock-Up',
    same look as garages.ts `.gta-tune-fab` (copy that CSS block under your own class; bottom offset 112px instead of 56px
    so it never covers the Handling / Pay 'n' Glaze button), pointerdown stopPropagation, click -> `tryStore()`.
    Shown (display inline-flex) when: !ui.isOpen(), p.vehicle is set with `driver === 'player'`, `siteAt(v.x, v.z)` is
    a site whose storageKind === storageKindOf(v), and !v.exploded. Hidden otherwise.
  - `tryStore()`: v = deps.player().vehicle; if no v or no site: return; `const err = storeVehicle(v)`; if err toast it and play('alarm').
- Keyboard: window keydown `e.code === KEYS.garage && !e.repeat && !isTyping(e)` (KEYS, isTyping from '../keys'):
  if the player drives a vehicle inside a site -> tryStore().
- `isOpen()` = ui.isOpen(). `prompt()`: player on foot (`vehicle === null`) inside a site -> \`Open ${site.name}\`, else null.
  `interact()`: on foot inside a site -> `ui.open(site.storageKind, 'site', site.name)`.
- `list(kind?)` = store.list(kind). `instanceOf(uid)` = instances.get(uid) ?? null.
- `addRecord(id)`: `const e = fleetEntry(id)`; snapshot = e ? `{ kind: e.kind, variant: e.id, name: e.name, tint: e.tints?.[0] ?? MOWER_TINTS[0], look: null, hp: 1, enginePitch: null }`
  : (id in VEHICLES) ? `{ kind: id as VehicleKind, variant: null, name: VEHICLES[id].name, tint: MOWER_TINTS[0], look: null, hp: 1, enginePitch: null }` : null.
  Kind: `spec.flies ? 'air' : spec.boat ? 'water' : 'ground'` with spec = VEHICLES[snapshot.kind]. Return `store.add(snapshot, kind)` (or null).
- `remove(uid)`: inst = instances.get(uid); if inst and the player drives it -> return false; if inst: forget(inst),
  instances.delete; if flight?.uid === uid: flight.rig.dispose(), flight = null; return `store.remove(uid) !== null`.

## Contract
The stub's exports unchanged (`LockupPlayer`, `LockupDeps`, `Lockup`, `createLockup`). Achievement ids used:
'gta-lockup-full', 'gta-special-delivery' (the planner adds them to the catalog).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/lockup/runtime.ts.
- `cd games/gnome-theft-auto && npx vitest run src/keys.test.ts src/lockup` passes.

## Out of scope
Every other file, including app.ts and the other lockup/*.ts modules (read-only; if one has a bug, describe it in your report).
