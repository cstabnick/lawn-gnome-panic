Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first. Also read `docs/gear-sync.md` (how gear other players wear reaches the network).

## Goal
Other online players see the gun I hold, with its Ammu-Gnation mods: a new `gun` relay message in `net.ts` (sent like the Pay 'n' Glaze
`look` message, resent to each player who joins) and `remotes.ts` building each remote gnome's held gun from it. A remote gnome raises its
gun arm while it aims.

## Read first
- `games/gnome-theft-auto/src/net.ts`: `GtaMsg`, `parseMsg`, `NetEvents.onPeerLook`, `GtaNet.setLook`, `myLook`, and every place `look` is
  sent (`enterTown`, the `joined` case) and received (the `relay` case).
- `games/gnome-theft-auto/src/net.test.ts`: the `look` test (copy its style).
- `games/gnome-theft-auto/src/remotes.ts`: `Remotes` (the interface near the top), `createRemotes`, `join` (it builds a placeholder
  `buildHeld('squirt-pistol')` on `model.arms.right`), `leave`, `clear`, `setLook`, and `updateDriver` (where `pose.hurt` raises hands).
- `games/gnome-theft-auto/src/gunMods.ts`: `encodeGunWire` / `decodeGunWire` (wire code `"<GUN_ORDER index>-<loadout code>"`, e.g. `"3-o2m0"`).
- `games/gnome-theft-auto/src/gunRig.ts`: `buildModdedGun(gun, loadout)`.

## Change
- `games/gnome-theft-auto/src/net.ts`:
  - `GtaMsg` gets `| { k: 'gun'; c: string }`. `parseMsg` accepts it only when `typeof o.c === 'string' && /^\d{1,2}-[a-z0-9]{0,32}$/.test(o.c)`.
  - `NetEvents` gets `/** Another player changed the gun they hold or its mods: an encodeGunWire code (null: unknown, show the stock pistol). */ onPeerGun?(id: number, code: string | null): void;`
  - `GtaNet` gets `/** Broadcast the gun I hold with its mods (an encodeGunWire code). Resent to each player who joins. */ setGun(code: string | null): void;`
    implemented like `setLook` (a `myGun` variable; send `{ k: 'gun', c: code ?? '' }` when it changes and we are in town; send it in
    `enterTown` and to each `joined` player when non-null). The relay case calls `ev.onPeerGun?.(m.from, msg.c === '' ? null : msg.c)`.
- `games/gnome-theft-auto/src/net.test.ts`: a test that `parseMsg({ k: 'gun', c: '3-o2m0' })` is read, and `'x-1'`, a 40-char code and a
  number `c` are rejected.
- `games/gnome-theft-auto/src/remotes.ts`:
  - `Remotes` gets `/** Store the gun a remote player holds (an encodeGunWire code, null = stock pistol) and put it in their gnome's hand. */ setGun(id: number, code: string | null): void;`
  - A `guns = new Map<number, string | null>()` like `looks`. A helper `holdGun(p: Puppet, code: string | null | undefined)` removes the
    puppet's current held gun (keep a `held: THREE.Object3D | null` field on `Puppet`) and adds a new one on `p.model.arms.right`:
    `decodeGunWire(code)` -> `buildModdedGun(gun, loadout)`, or `buildModdedGun('pistol', {})` when the code is missing or unreadable;
    same `position.set(0, -0.32, 0.02)` and `rotation.x = Math.PI` as now; wrapped in try/catch (a missing prefab: no gun).
  - `join` calls `holdGun` with `guns.get(info.id)` instead of building the squirt pistol. `setGun(id, code)` stores it and re-dresses the
    puppet if present. `leave` and `clear` drop the stored code like `looks`.
  - In `updateDriver`, on foot: when `pose.aiming && !pose.hurt`, set `p.model.arms.right.rotation.x = -Math.PI / 2` after `model.update`
    (as the local player does).

## Contract
```ts
// net.ts
export type GtaMsg = ... | { k: 'gun'; c: string };
onPeerGun?(id: number, code: string | null): void;   // NetEvents
setGun(code: string | null): void;                   // GtaNet
// remotes.ts
setGun(id: number, code: string | null): void;       // Remotes
```
The planner wires `net.setGun(encodeGunWire(weapons.gun, weapons.loadoutOf(weapons.gun)))` and `onPeerGun: (id, c) => remotes.setGun(id, c)` in app.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `net.ts`, `net.test.ts`, `remotes.ts`.
- `npx vitest run src/net.test.ts` (from `games/gnome-theft-auto`) passes.

## Out of scope
`app.ts`, `gunMods.ts`, `gunRig.ts`, `docs/gear-sync.md`, every other file.
