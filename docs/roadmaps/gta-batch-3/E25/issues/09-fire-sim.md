Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Pure logic, no three.js, no DOM. This is a shared system other
epics will reuse: keep it small, obvious and documented in its header.

## Goal
`fire/sim.ts`: fires that grow, burn through fuel, spread to nearby fuel points, and go out when doused with water.

## Read first
- `games/gnome-theft-auto/src/fire/types.ts`: `Fire`, `FireState`, `FuelPoint`, `FireField`, `FireEvent`, `FIRE`
  tuning, `IgniteOpts` (every field's meaning is in its comment).
- `games/gnome-theft-auto/src/fire/sim.ts`: the stub (signatures to keep; `createFireField`, `ignite`,
  `burningCount`, `clearFires`, `fuelPoint` are done; fill `douse`, `stepFires`, `nearestBurning`, and make `ignite`
  respect `FIRE.maxFires` and `FIRE.startHeat`).

## Change
- `games/gnome-theft-auto/src/fire/sim.ts`:
  - `ignite`: default heat `FIRE.startHeat`; if `field.fires.length >= FIRE.maxFires`, drop the oldest non-burning
    fire first, else the oldest fire; return the new fire.
  - `douse(field, x, z, radius, litres)`: the burning fires whose circle (fire r) overlaps the water circle; split
    `litres` evenly among them; each loses `share * FIRE.douseHeatPerLitre` heat and gains `share * FIRE.wetPerLitre`
    wet (max 1). Non-burning fires in the circle also get wet. Return total heat removed. A fire whose heat drops to
    <= `FIRE.outHeat` is NOT switched here; `stepFires` does it (one place emits events).
  - `stepFires(field, dt, fuel)`: for each fire:
    - burning: `heat = min(1, heat + FIRE.growPerS * (1 - wet) * dt)`; `fuel -= heat * dt`; `wet = max(0, wet -
      FIRE.dryPerS * dt)`. If heat <= `FIRE.outHeat` -> state 'out', since 0, event 'out'. Else if fuel <= 0 -> state
      'burnt', since 0, event 'burnt'.
    - out / burnt: `since += dt`; when since >= `FIRE.smokeS` remove it, event 'gone'.
    - Spread: for each fuel point not `lit`: if some burning fire with heat >= `FIRE.spreadHeat` is within
      `FIRE.spreadRange + f.r + p.r` (2D distance), `p.exposure += dt`, else `p.exposure = max(0, p.exposure - dt)`;
      when exposure >= `FIRE.spreadAfterS`: `p.lit = true`, ignite a fire at p (kind, r, fuel, group, heat
      `FIRE.startHeat`), event 'spread' with the new id.
  - `nearestBurning`: the burning fire with the smallest 2D distance, or null.
  - A header comment with the 6-line usage example from types.ts and "pure: the host or each client may run it".
- `games/gnome-theft-auto/src/fire/sim.test.ts` (new): a fire grows toward 1 and burns out ('burnt') when its fuel
  ends; enough water puts it out ('out') and then 'gone' after smokeS; wet fires grow slower; douse splits water
  between two fires in range and ignores one out of range; a fuel point next to a hot fire catches after spreadAfterS
  (event 'spread') and not if the fire is doused first; maxFires is respected; groups clear separately.

## Contract
Every export of `fire/sim.ts` keeps its stub signature: `createFireField()`, `ignite(field, x, y, z, opts?)`,
`douse(field, x, z, radius, litres): number`, `stepFires(field, dt, fuel?): FireEvent[]`, `burningCount(field, group?)`,
`nearestBurning(field, x, z)`, `clearFires(field, group?)`, `fuelPoint(...)`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/fire/sim.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `src/fire/`.

## Out of scope
`fire/types.ts` (if a tuning number must change, say so), `fire/view.ts`, every other file.
