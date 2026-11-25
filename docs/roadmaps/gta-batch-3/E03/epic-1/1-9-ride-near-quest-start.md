Epic: 1 Fixes (parallel) · Item: L09 "when doing a quest, spawn the player's vehicle nearby so they are good to drive" · Model: sonnet
Depends on: none (the `QuestDeps.ensureRideNear` field already exists; the lead wires it in app.ts after this issue)

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
When a quest starts in play (its intro scene is over) and the player is on foot with no usable vehicle close by, their
own vehicle is brought to them (Lock-Up Sling-Lift, free), or a loaner ride-on is parked beside them if they own none.
Once per quest start. Behind one function E08 can re-point.

## Contract (already in `quests/types.ts`, do not change it)
```ts
// in QuestDeps
ensureRideNear?: (x: number, z: number, q: QuestDef) => void;
```

## Change
- New `quests/ensureRide.ts`:
  ```ts
  export interface RideDeps {
    player: { x: number; z: number; vehicle: Vehicle | null };
    vehicles: readonly Vehicle[];
    lockup: Pick<Lockup, 'callDelivery' | 'instanceOf' | 'list'>;
    /** Park a loaner (stock ride-on) at a free spot near (x, z); returns it or null. */
    spawnLoaner: (x: number, z: number) => Vehicle | null;
    toast: (text: string) => void;
  }
  export const RIDE_NEAR = 60;
  /** The first objective kinds that bring their own vehicle (no ride needed). */
  export function questNeedsRide(q: QuestDef): boolean;
  export function ensureRideNear(x: number, z: number, q: QuestDef, deps: RideDeps): 'none-needed' | 'near' | 'delivered' | 'loaner' | 'failed';
  ```
  `questNeedsRide` false when `q.objectives[0].kind` supplies or forbids a vehicle (check every kind in
  `quests/types.ts` `ObjectiveDef`: e.g. 'steal-deliver', 'race', 'convoy-ambush', 'tessie-escort', anything with
  `spawnAt`, boat/aircraft objectives, on-foot-only objectives if any). `ensureRideNear`: none-needed when the player is
  in a vehicle or the quest needs no ride; 'near' when any vehicle with `driver === 'none'`, not `questOwned`, not
  exploded, ground (not boat/aircraft: see `craft/` / `isBoat` helpers) is within `RIDE_NEAR`; otherwise pick the most
  recently stored ground vehicle from the Lock-Up (`lockup.list(...)`, read `lockup/runtime.ts` and `lockup/types.ts` for
  the kind argument and the `storedAt` field) and `callDelivery(uid, true)` (returns an error string or null; read
  `lockup/runtime.ts` ~330 for how the drop spot is chosen and whether it lands near the player - if it drops near the
  player's current position, good; if near somewhere else, report it); with nothing stored or on error, `spawnLoaner`.
  Toast once: "Your <name> is on its way." / "A loaner ride-on is parked nearby."
- `quests/ensureRide.test.ts`: unit tests with fakes for every branch.
- `quests/quests.ts`: right after the quest starts in play (next to `deps.onObjectiveStart?.(q, 0)` ~line 619, i.e.
  after the intro scene; NOT on save resume ~521) call `deps.ensureRideNear?.(player x, player z, q)` (use
  `deps.player` position; skip when there is no player). Once per quest start.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests/ensureRide.test.ts src/quests` pass.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- Report the exact wiring app.ts needs (the `ensureRideNear` deps object: which app.ts symbols for lockup, vehicles,
  hud toast, and the loaner spawn using `createVehicle` + `findSafeSpot` from `lockup/safeSpot.ts`), so the lead can paste it.

## Out of scope
`app.ts` (the lead wires it), `lockup/*` (use its public API only), `quests/types.ts`, `objectivesDrive.ts`.
