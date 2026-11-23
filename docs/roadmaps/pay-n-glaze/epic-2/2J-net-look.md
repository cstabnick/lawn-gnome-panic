Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/net.ts`, `games/gnome-theft-auto/src/net.test.ts`, `games/gnome-theft-auto/src/remotes.ts`.

## Goal
Other players see what your vehicle wears at Pay 'n' Glaze (paint, wheels, spoiler...), in the same lobby, including players who join later.

## Read first
- `games/gnome-theft-auto/src/net.ts` (all): `GtaMsg`, `parseMsg`, `GtaNet` (already has the stub `setLook(code | null)`), `NetEvents` (already has `onPeerLook?`), `createNet`, how `radio` is stored (`myRadio`), re-sent when a player joins (`enterTown` and the `joined` case) and parsed. Copy that exact pattern for `look`.
- `games/gnome-theft-auto/src/net.test.ts`: how `parseMsg` and the pose array are tested.
- `games/gnome-theft-auto/src/remotes.ts` (all): `Puppet`, `updateDriver` (builds `createVehicle(scene, kind, x, z, yaw, pose.tint)` when `pose.veh` changes), `Remotes.setLook` (stubbed no-op, already declared on the interface and wired from `app.ts`'s `onPeerLook`), `leave`.
- `games/gnome-theft-auto/src/driverHands.ts` (`poseHands(model, vehicle, seat)`: stub another issue fills) and `games/gnome-theft-auto/src/vehicles.ts` `setVehicleLook`.
- `packages/glaze/src/loadout.ts`: `decodeLoadout(code) -> Loadout | null`.

## Change
- `net.ts`:
  1. `parseMsg`: accept `{ k: 'look', c: <string> }` only when `c` is a string of at most 120 characters matching `/^[A-Za-z0-9._-]*$/` (an empty string means stock). Anything else returns `null`.
  2. `createNet`: keep `let myLook: string | null = null`. `setLook(code)`: if equal to `myLook` do nothing; store; when `client && myId !== null` send `{ k: 'look', c: code ?? '' }` to everyone (`client.send(null, ...)`). Re-send my look to a newly joined player (`client.send(m.player.id, ...)`) and to all on `enterTown`, exactly where the radio station is re-sent (only when `myLook` is not null).
  3. `onMsg` relay case: `else if (msg.k === 'look') ev.onPeerLook?.(m.from, msg.c === '' ? null : msg.c);`.
- `remotes.ts`: implement `setLook(id, code)`: remember the code in a `Map<number, string | null>` `looks` (cleared in `leave` and `clear`); apply it to the puppet's current vehicle if there is one: `const look = code ? decodeLoadout(code) : null; if (p.vehicle?.rig) setVehicleLook(p.vehicle, look ?? defaultLoadout(p.vehicle.tint))` (import `defaultLoadout`, `decodeLoadout` from `@lawn/glaze`, `setVehicleLook` from `./vehicles`). In `updateDriver`, right after a new vehicle is created for a puppet, apply that puppet's remembered look the same way, so a look that arrived before they mounted (or while on foot) is worn when they get in. A vehicle with no `rig` (flyers, boats) ignores looks. After `p.model.update(state, dt)` for a DRIVER on a vehicle, call `poseHands(p.model, p.vehicle, 0, dt)` (import from `./driverHands`): the issue that owns it makes the remote driver's hands follow the wheel; passengers (`updateRider`) are NOT posed. Do NOT call it for a puppet on foot: instead call `clearHands(p.model)` (also exported from `./driverHands`) on the frame a puppet that had a vehicle goes on foot, and when a puppet becomes a passenger (`updateRider`).
- `net.test.ts`: add cases: `parseMsg({ k: 'look', c: 'g1.abc' })` returns it; `c: ''` is accepted; a number, a 200-character string and a string with a space or `<` are rejected (`null`); existing tests unchanged and passing.

## Contract
`GtaMsg` gains `{ k: 'look'; c: string }` (already added to the type); `GtaNet.setLook(code: string | null)`; `NetEvents.onPeerLook?(id: number, code: string | null)`; `Remotes.setLook(id: number, code: string | null)`. The string is `encodeLoadout`'s output.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in `net.ts`, `net.test.ts` or `remotes.ts`.
- `npx vitest run games/gnome-theft-auto/src/net.test.ts` passes.

## Out of scope
Every other file (`app.ts` already forwards `onPeerLook` to `remotes.setLook` and another issue calls `net.setLook`).
