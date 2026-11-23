Epic: 1 Modules (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). Game:
games/gnome-theft-auto (Vite + TypeScript + three.js). If node/npx is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other workers edit other files of this game and repo at the same time: touch ONLY the files listed under Change. Do not
commit, push, stash, switch branches, run vite build / npm run build, or start a dev server. Do not edit AGENT_INDEX.md.
tsc over the whole game may show errors in files other workers are editing; only errors in YOUR files matter.

## Goal
The deed store that remembers which garages the player bought (Hangar Two = 'air', the Mossbank Boathouse = 'water'),
and two small fixes in the vehicle snapshot code (refuse Tessie / the HOA patrol boat; restore a boat's or aircraft's
Glaze look).

## Read first
- games/gnome-theft-auto/src/lockup/types.ts: `DeedStore`, `EstateKind`, `ESTATE_KINDS`, `EstatesSave`, `LockupStorage`, `StorageKind`.
- games/gnome-theft-auto/src/lockup/store.ts: the pattern to copy (defaultStorage(), try/catch around JSON and setItem, `notifySaveChanged()` from '../saveHook', listeners).
- games/gnome-theft-auto/src/lockup/deeds.ts: the current stub (keep its export signature).
- games/gnome-theft-auto/src/lockup/snapshot.ts and snapshot.test.ts.
- games/gnome-theft-auto/src/lockup/config.ts: `ESTATES.saveKey` ('gta-estates-v1').

## Change
- games/gnome-theft-auto/src/lockup/deeds.ts: replace the stub with
  `export function createDeedStore(storage: LockupStorage | null = defaultStorage()): DeedStore`
  - Loads once from `storage.getItem(ESTATES.saveKey)`. Valid JSON shape: `{ v: 1, owned: { air: boolean, water: boolean } }`.
    Anything else (null, bad JSON, v !== 1, owned not an object, non-boolean value) => that kind is not owned. Never throws
    (getItem itself may throw: catch it).
  - `owns(kind)`: 'ground' always true; 'air' / 'water' from the loaded/current flags.
  - `grant(kind)`: false if already owned; else set it, persist, call listeners, return true.
  - `revoke(kind)`: false if not owned; else clear it, persist, call listeners, return true.
  - persist: `storage.setItem(ESTATES.saveKey, JSON.stringify({ v: 1, owned: { air, water } }))` then `notifySaveChanged()`,
    both inside try/catch (blocked storage: the change still holds this visit); listeners are called even with no storage.
  - `onChange(cb)` returns an unsubscribe function.
  - Header comment: one line saying what the file is.
- games/gnome-theft-auto/src/lockup/deeds.test.ts (new, vitest): in-memory storage object; cases: empty storage owns only
  ground; grant persists and a new store on the same storage owns it; grant twice returns false the second time; revoke;
  garbage JSON / `{ v: 2 }` / `{ v: 1, owned: { air: 'yes' } }` own nothing; a storage whose getItem and setItem throw
  never throws (grant still returns true and owns() is true afterwards); onChange is called on grant and unsubscribe works.
- games/gnome-theft-auto/src/lockup/snapshot.ts:
  - In `cannotStore`, right after the `v.sunk` check add:
    `if (v.kind === 'tessie') return 'Tessie belongs to the loch, not to a boathouse.';`
    `if (v.kind === 'hoa-patrol-boat') return 'The HOA would notice their patrol boat missing.';`
  - In `restoreVehicle`, apply the saved look to boats and aircraft too: change `if (rec.look && v.rig) {` to
    `if (rec.look && (v.rig || isCraftKind(rec.kind))) {` with `import { isCraftKind } from '../glazeStore';`
    (setVehicleLook already handles rig-less craft: it re-tints the prefab).
- games/gnome-theft-auto/src/lockup/snapshot.test.ts: add one test in the 'cannotStore' describe: a `createVehicle(new THREE.Scene(), 'tessie', 0, 0, 0, 0x2f64c9)`
  gives 'Tessie belongs to the loch, not to a boathouse.' for kind 'water'. Keep every existing test unchanged.

## Contract
```ts
export function createDeedStore(storage?: LockupStorage | null): DeedStore;
// DeedStore (lockup/types.ts): owns(kind: StorageKind): boolean; grant(kind: EstateKind): boolean;
//   revoke(kind: EstateKind): boolean; onChange(cb: () => void): () => void;
```

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/lockup/deeds.test.ts src/lockup/snapshot.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in lockup/deeds.ts, deeds.test.ts, snapshot.ts, snapshot.test.ts.

## Out of scope
lockup/types.ts, lockup/config.ts, lockup/runtime.ts, lockup/ui.ts, lockup/store.ts, every other file.
