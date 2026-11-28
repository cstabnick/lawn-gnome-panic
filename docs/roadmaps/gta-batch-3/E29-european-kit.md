# E29 European kit: buildings, vehicles, plants, backyard styling
Wave: 3 · Depends on: none (E28 builds the land, E30 places the kit) · Kind: Engine (prefabs)
Source items:
- L99 (the part this epic owns, verbatim): "i think that the next yard should have a more european style city with closer
  buildings and ambling paths and make them a bit stereotypical in the satirical way we are already doing. kind of a
  parondonlin type of deal. ... more veicles as well. especially if we can start adopting european type vehicles. this
  will require another new set of prefabs, so make sure to build those. eorpean platns and backyard styling too."

## Goal
A complete, modular "Paris-London-Berlin" kit at garden scale for E30 (the town) and E31 (living world) to place:
buildings that pack into dense, irregular streets, street furniture, five drivable European vehicles that join traffic,
and European plants and backyard dressing. Satirical in the game's dry voice, every piece a `@lawn/prefabs` def.

## Scope
In:
- **Buildings** (life-size metres, 1 unit = one gnome height, front +z): narrow terraced townhouse with mansard roof and
  shutters (two variants), half-timbered house, corner cafe with awning and pavement tables, bakery, bistro, tabac/kiosk,
  a post-and-phone booth parody, steeple church, apartment block with balconies, covered market hall, canal-side
  boathouse, opera/concert hall (home of E30's classical radio station), three shopfront variants. Every building has a
  fixed outer footprint recorded in `EURO_BUILDINGS` (width, depth, height, front apron) so a street can be packed.
- **Street furniture**: cobble and paving tiles (flat), bollard, ornate lamp post, flower box, wrought-iron railing,
  fountain, bike rack, cafe chair and cafe table, chalkboard menu sign, poster board and street sign with a blank text
  face (satirical text slots), plus a list of satirical lines for those slots.
- **Vehicles** (drivable, stealable, in traffic, sold at Burl's Forecourt): Petit Pois (tiny city hatchback), Deux-Pots
  (boxy corrugated roll-top), Wespa (scooter), Baguette Trike (three-wheel delivery cart), Crepe Van (corrugated food
  van). Full registration: `VehicleKind`, `VEHICLES`, `VEHICLE_CODES` (appended), handling profile, engine sound, drive
  grips, ride animation, errands, horn, dealer stock, traffic mix, achievements, lore entries.
- **Plants and backyard**: clipped topiary (spiral, lollipop), box hedge, potted geraniums, geranium bed, espaliered fruit
  tree, plane tree, ivy wall, pergola with vines, boules court, washing line, bistro garden set, rose arch, water butt.
  Plant rows registered in `flora/kinds.ts`.
- A **street composer** (`src/eurokit/street.ts`): pure `planStreetRow()` that packs buildings along a frontage with
  party-wall gaps and irregular setbacks, for E30.
- A **showcase** behind `?eurokit` (one street, furniture, a garden and the five vehicles parked) for smoke, zfight and
  screenshots. Nothing is placed in the normal world.

Out: placing the town (E30), the land/roads/roundabouts (E28), the classical radio station content (E30), nature
preserve and animals (E31), interiors (E05), Pay 'n' Glaze mounts for the new vehicles (odd rides have none either;
deferred), a tram (deferred unless cheap).

## Code pointers (confirmed)
Prefabs (`packages/prefabs/src/`): format `types.ts` (max 40 parts, `footprint` or `pivots` or `sit` => life-size up
to 30), `palette.ts`, register a file in `catalog/index.ts` only. Style references: `catalog/gta-houses.ts` (buildings,
tint walls / trim roof), `catalog/gta-odd-rides.ts` (vehicles: `wheel-<n>` and `steer` pivots, `seat`, two damage
stages), `catalog/gta-street-kit.ts`, `catalog/gta-landscaping.ts`. Existing kit to reuse rather than copy:
`lavender-row`, `allotment-bed`, `topiary-cone`, `boxwood-ball`, `hedgerow`, `stone-fountain`, `phone-box`,
`news-kiosk`, `bandstand`, `bike-rack`, `street-bollard`, `civic-railing`, `window-flower-box`, `market-stall`,
`boathouse`, `tower-pergola`.

Vehicles (`games/gnome-theft-auto/src/`): `types.ts` `VehicleKind`; `config.ts` `VEHICLES` (Record: compile-forced),
`TRAFFIC` (`oddRideChance`); `net.ts` `VEHICLE_CODES` (append only); `handling.ts` `PROFILES`; `sound/engines.ts`;
`driveGrips.ts` `DRIVE_CONTROLS` (+ `driveGrips.test.ts` `NO_CONTROL` for kinds with no control);
`anim/rideAuto.ts` `DRIVE_STYLE`; `errands.ts` `TOWN_ONLY`; `audio.ts` horn switch; `dealers/config.ts` forecourt stock;
`traffic.ts` `pickKind` (odd rides in town); `oddRides.ts` + `app.ts:1060` (achievement hook pattern); `?mount=<kind>`
already spawns any kind. Achievements: `packages/achievements/src/catalog.ts` (`gta-sunday-driver` pattern).
Flora: `src/flora/kinds.ts` `PLANT_KINDS`. Rendering rules: `docs/rendering.md`.

## Contracts this epic provides
- Prefab ids (all `euro-` prefixed, listed in `E29/contracts.md`).
- `src/eurokit/catalog.ts`: `EURO_BUILDINGS` (id, width, depth, height, apron, role), `EURO_FURNITURE`, `EURO_GARDEN`.
- `src/eurokit/street.ts`: `planStreetRow(opts) -> EuroPlacement[]` and `PARTY_GAP`.
- `src/eurokit/signs.ts`: `EURO_SIGN_LINES` (satirical text for the blank sign faces), `SIGN_FACE` (part name and size).
- `src/euroRides.ts`: `EURO_RIDES`, `setEuroZone(pred)` / `euroZoneAt(x, z)` (E28/E30 register the town's area so
  traffic there is mostly European), `recordEuroRide`.

## Contracts this epic consumes
None. E28's yard bounds arrive later through `setEuroZone`.

## Online / mobile / achievements / prefabs / lore notes
- Online: new kinds appended to `VEHICLE_CODES`, so remote players see them; no new messages.
- Mobile: no new UI; vehicles use the existing drive controls.
- Achievements: Grand Tour (drive all five, Tour Beret head), Baguette Run (drive the Baguette Trike, Baguette Quiver
  back), Petit Pois (drive the hatch, Riviera Scarf neck).
- Lore: one apocrypha entry per vehicle (like `pot-rod.md`), `npm run lore` passes. Examine text in the Yard voice,
  dry, no real brands; the new yard stays unnamed in prefabs (E28/E30 name it).

## Risks and open questions (decisions taken)
- Buildings packed tight z-fight on party walls: every building stays strictly inside its x extent, the composer leaves
  `PARTY_GAP` (0.12) between neighbours, details stand at least 0.04 proud, no flush faces. zfight on `?eurokit`.
- 40-part cap vs many windows: windows are generated by small helpers and kept chunky; 40 is the hard limit.
- Closed cabs: Petit Pois has doors and a steering wheel; Crepe Van has doors and no control (recorded in `NO_CONTROL`).
- Size: about 18 issues, under the 30 limit.

## Done when
`npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run build -w games/gnome-theft-auto`,
`npm test -w games/gnome-theft-auto`, `npm run build -w games/prefab-gallery`, `npm run lore`; smoke and zfight clean on
`?offline&eurokit`; environmental-storytelling hooks in place for E30 (sign lines, vignette-ready props), screenshots of
the showcase noted in the roadmap.
