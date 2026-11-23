Epic: 1 Modules
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn. Game: games/gnome-theft-auto (Vite + TypeScript + three.js, vitest).
In Git Bash, if node is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers edit OTHER files of this game at the same time. Do not commit, push, stash or switch branches. Do not run
`vite build` or a dev server. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours:
ignore those, fix only errors in your files.

## Goal
Fill `games/gnome-theft-auto/src/lockup/store.ts`: the saved list of the player's owned vehicles per storage kind
(5 'ground' slots now), persisted in localStorage as JSON. Pure data, no three.js, no DOM. Plus a unit test.

## Read first
- games/gnome-theft-auto/src/lockup/types.ts: `StorageKind`, `STORAGE_KINDS`, `StoredVehicle`, `VehicleSnapshot`,
  `LockupSave`, `LockupStorage`, `LockupStore` (the interface you implement; its doc comments are the spec).
- games/gnome-theft-auto/src/lockup/config.ts: `LOCKUP.saveKey` ('gta-lockup-v1'), `LOCKUP.capacity`.
- games/gnome-theft-auto/src/lockup/store.ts: the stub (keep `newUid` as is and keep the exported signatures).
- games/gnome-theft-auto/src/glazeStore.ts: the style of a tolerant localStorage store (load never throws, persist
  swallows errors, calls `notifySaveChanged()` from './saveHook' after a successful write).

## Change
- games/gnome-theft-auto/src/lockup/store.ts: implement
  `createLockupStore(storage: LockupStorage | null = defaultStorage(), capacity = LOCKUP.capacity, now = Date.now, rand = Math.random): LockupStore`.
  Change the stub's default for `storage` from `null` to a `defaultStorage()` helper that returns `localStorage` when it
  exists (wrapped in try/catch, null when blocked or undefined).
  - Load once at creation from `storage.getItem(LOCKUP.saveKey)`. Expected JSON: `{ v: 1, slots: { ground: [...], air: [...], water: [...] } }`.
    Garbage, wrong `v`, missing kinds or bad records are dropped quietly (never throw). A record is valid when: `uid`
    is a non-empty string, `kind` is a string, `variant` is a string or null, `name` a string, `tint`, `hp`, `storedAt`
    finite numbers, `look` string or null, `enginePitch` finite number or null. Clamp `hp` to (0, 1] (hp <= 0 -> 0.05).
    Drop duplicates of an already-loaded uid (any kind). Keep at most `capacity[kind]` records per kind (the first ones).
  - `list(kind)`: a copy of that kind's array in slot order. `list()` with no kind: ground, then air, then water.
  - `get(uid)`, `kindOf(uid)`: search every kind.
  - `capacity(kind)` = `capacity[kind] ?? 0`; `free(kind)` = max(0, capacity - count).
  - `add(snap, kind)`: null when `free(kind) === 0`. Otherwise a record `{ ...snap, uid: newUid(now(), rand), storedAt: now() }`
    (if the uid already exists, call newUid again until it does not), push, persist, notify, return the record.
  - `update(uid, snap)`: replace the record's snapshot fields (kind, variant, name, tint, look, hp, enginePitch), keep uid
    and storedAt. False for an unknown uid. Persist and notify only if a field actually changed (compare each field).
  - `remove(uid)`: splice it out, persist, notify, return it; null when unknown.
  - `onChange(cb)`: add to a Set; returns a function that deletes it.
  - persist: `storage.setItem(LOCKUP.saveKey, JSON.stringify({ v: 1, slots }))` inside try/catch, then `notifySaveChanged()`
    (import from '../saveHook'). Listeners are called after persist even when storage is null.
- games/gnome-theft-auto/src/lockup/store.test.ts (new): vitest tests with an in-memory storage object
  (`{ data: new Map(), getItem(k) { return this.data.get(k) ?? null }, setItem(k, v) { this.data.set(k, v) } }`):
  add up to 5 ground then the 6th returns null; capacity 0 for 'air' -> add returns null; uids unique; round-trip
  (a second store on the same storage sees the same list); garbage JSON / `{v:2}` / a bad record load as empty or skip;
  update changes fields and keeps uid/storedAt, returns false for unknown uid; remove frees a slot; onChange fires on
  add/update/remove and stops after unsubscribe; update with identical fields does not call onChange.

## Contract
Keep every export of store.ts with the stub's names and types (`newUid`, `createLockupStore`). Types come from ./types.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/store.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/lockup/store.ts or store.test.ts.

## Out of scope
Every other file, including lockup/types.ts and lockup/config.ts (do not edit them), saveIO.ts, cloudSave.ts.
