# Gnome Theft Auto: the Lock-Up and the Sling-Lift (garage-and-delivery)

Request: "make a garage system so that I can store 5 vehicles. allow me to phone a helicopter to drop the vehicle near
me when I need it. this will help keep the unique vehicles unique and persistent across sessions, and also give players
a way out of marooned situations."

## What it is

- **Side-Valve Lock-Up** (Tansy Clayfoot's back lot, at the Side-Valve Salvage bay): drive a ground vehicle in and press
  T (or the "Store in Lock-Up" button) to store it. 5 slots. On foot at the bay, E opens the Lock-Up sheet: take a
  vehicle out (it rolls out beside the bay, free) or scrap it for Acorns.
- **The phone** (📱 button, P, pad Back/View): a small app menu. Apps: **Sling-Lift** (pick a stored vehicle, pay the fee,
  a scripted Whirligig-type chopper flies in, lowers the vehicle on dry flat clear ground near you, and flies off) and
  **Taxi** (fires the existing `gta:taxi` event).
- A stored vehicle keeps kind, fleet variant, name, paint, Glaze look, damage (hp) and engine pitch. Waterlog is cleared.
  Saved under `gta-lockup-v1` (in `GTA_SAVE_KEYS`, so it is in the cloud save; newer side wins).
- **Unique**: every stored vehicle has a uid. There is at most one world instance per uid. Calling the Sling-Lift for a
  vehicle that is already out fetches it (its old instance is removed, unless you are driving it). Storing an instance
  that is already owned updates its slot (no second slot). An owned vehicle that explodes is written off (slot freed).
  Out vehicles are synced back to their slot every 2 s, so a session that ends with the car out keeps its state; next
  session it is back in the Lock-Up.
- Online: the delivered vehicle is a normal vehicle (the existing net code syncs it when driven). The Lock-Up and the
  phone are local to the owner; nothing new on the wire.

## Files

New: `src/lockup/{config,types,store,snapshot,safeSpot,sling,ui,runtime}.ts` (+ tests), `src/phone/phone.ts`.
Hot-file edits (small, additive): `keys.ts` (`phone: 'KeyP'`), `gamepad.ts` (Back -> `gta:phone`), `saveIO.ts` +
`cloudSave.ts` (`gta-lockup-v1`), `app.ts` (create phone + lockup, update, E prompt, input hold, debug), achievements
`catalog.ts` (2 entries), lore entry.

## API for later workstreams (hangar, boathouse, debug trainer)

- `StorageKind = 'ground' | 'air' | 'water'`. Capacities in `LOCKUP.capacity` (`lockup/config.ts`): ground 5, air 0,
  water 0. **To add a hangar (air) or boathouse (water) with 3 slots**: set `LOCKUP.capacity.air = 3` (or water), and
  add a `LockupSite` to `LOCKUP.sites` with `storageKind: 'air'` (or `'water'`) at the hangar / boathouse. Storing,
  the sheet, saving and uniqueness work unchanged (`snapshot.ts storageKindOf` already maps flyers to 'air', boats to
  'water'). The Sling-Lift delivers only 'ground' today; for air/water, a later workstream adds a drop rule (a flyer
  can be lowered on land as is; a boat needs a water spot: give `findSafeSpot` a probe with `maxWater` inverted).
  The phone's Sling-Lift app opens the sheet for 'ground'; add one phone app per kind with `phone.addApp`.
- Debug / trainer (`window.__gta.lockup` under `?debug`, the `Lockup` object from `createLockup`):
  `list(kind?)`, `storeVehicle(v)`, `addRecord(fleetIdOrKind)`, `remove(uid)`, `callDelivery(uid, free?)`,
  `instanceOf(uid)`. The store itself: `createLockupStore(storage, capacity)` with `list/get/kindOf/capacity/free/add/update/remove/onChange`.

## Where it is

The Lock-Up site is 16 m east of the Side-Valve tuning bay along its forecourt (`SIDE_VALVE.bay + (16, 0)`, radius 6),
so it never overlaps the tuning bay's 10 m reach. Not yet: a map icon or a painted bay marking (mapIcons/mapPois were
mid-edit by another workstream); the phone app's text and the on-foot prompt are the only pointers.

Achievements: `gta-lockup-full` (Five-Mower Gnome, fill all 5 slots; reward neck `lockup-key-lanyard`) and
`gta-special-delivery` (Special Delivery, first Sling-Lift drop; reward head `sling-lift-headset`). Both prefabs are new,
in `packages/prefabs/src/catalog/gta-lockup.ts`. Lore: `docs/lore/entries/apocrypha/side-valve-lock-up.md`.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0 Foundation (planner) | types, config, stubs, keys/gamepad/save keys; tsc clean for lockup/ and phone/ | done by planner |
| 1 Modules | store, snapshot, safeSpot, sling, ui, phone filled; their tests pass | 6 parallel |
| 2 Runtime | runtime.ts filled + test; planner wires app.ts, achievements, lore | 1 + planner |

No dependency inside an epic: every module codes against `lockup/types.ts`.

## Issues

Full issue texts (as given to the haiku-worker agents) live beside this file in `gta-garage-and-delivery/`:
1A-store, 1B-snapshot, 1C-safespot, 1D-sling, 1E-ui, 1F-phone (Epic 1), 2A-runtime (Epic 2).
