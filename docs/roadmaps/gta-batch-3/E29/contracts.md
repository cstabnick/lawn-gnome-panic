# E29 contracts: the European kit for E30 (town) and E31 (living world)

Everything here is in the `epic/E29-eurokit` branch. Prefabs are `@lawn/prefabs` defs (browse them:
`npm run dev -w games/prefab-gallery`, search `euro`). The whole kit laid out: Gnome Theft Auto `?offline&eurokit`.

## Prefab ids

Buildings (life-size metres, front door +z, walls `tint`, roofs `trim`; sizes in `games/gnome-theft-auto/src/eurokit/catalog.ts` `EURO_BUILDINGS`):

| id | role | W x D x H | apron |
|---|---|---|---|
| `euro-townhouse-mansard` | terrace | 4 x 6 x 9.6 | 0.6 |
| `euro-townhouse-tall` | terrace | 3.4 x 6 x 11.8 | 0.6 |
| `euro-half-timbered` | terrace | 5 x 6 x 8.4 | 0.5 |
| `euro-bakery` | terrace | 4.5 x 6 x 7.2 | 1.4 |
| `euro-bistro` | terrace | 5 x 6 x 7.4 | 2.2 |
| `euro-apartment-block` | terrace | 10 x 8 x 14 | 1 |
| `euro-shopfront-cheese` / `-chemist` / `-antiques` | terrace | 3.6 x 6 x 8.8 | 1.2 |
| `euro-corner-cafe` | corner (+x side open, sideApron 1.6) | 6 x 6 x 7.6 | 2.6 |
| `euro-tabac-kiosk` | freestanding | 2.4 x 2.4 x 3.2 | 0.8 |
| `euro-post-booth` | freestanding | 1.2 x 1.2 x 2.8 | 0.1 |
| `euro-steeple-church` | landmark | 8 x 14 x 22 | 1 |
| `euro-market-hall` | landmark | 12 x 10 x 8 | 0.4 |
| `euro-canal-boathouse` | landmark (jetty in front) | 6 x 8 x 5.5 | 2.5 |
| `euro-opera-hall` | landmark (classical radio station: radio mast on the roof) | 16 x 14 x 13 | 3 |

Street furniture (`EURO_FURNITURE`): `euro-cobble-tile`, `euro-paving-tile` (1.96 square slabs for a 2 m grid, 0.08+
thick; lay on terrain only, never on another flat layer), `euro-bollard`, `euro-lamp-post`, `euro-flower-trough`,
`euro-iron-railing` (2.0 m section: space sections 2.06 apart), `euro-fountain`, `euro-bike-rack`, `euro-cafe-chair`
(sit), `euro-cafe-table`, `euro-chalkboard-sign`, `euro-poster-board`, `euro-street-sign`.

Plants and backyard (`EURO_GARDEN`): `euro-topiary-spiral`, `euro-topiary-lollipop`, `euro-box-hedge` (1.96 long),
`euro-geranium-pot`, `euro-geranium-bed` (mowable), `euro-espalier-pear`, `euro-plane-tree`, `euro-ivy-wall` (3 m
section: space 3.06 apart), `euro-vine-pergola`, `euro-boules-court`, `euro-washing-line`, `euro-bistro-set` (sit),
`euro-rose-arch`, `euro-water-butt`. Flora rows for the plants are in `src/flora/kinds.ts`.

Reuse from older kits where they fit: `lavender-row`, `allotment-bed`, `bandstand`, `stone-fountain`, `market-stall`,
`window-flower-box`, `hedgerow`, `boxwood-ball`, `topiary-cone`.

Vehicles (`VehicleKind` -> prefab): `euro-hatch` -> `gta-euro-hatch` (Petit Pois, closed, doors),
`deux-pots` -> `gta-deux-pots` (open, 3 seats), `wespa` -> `gta-wespa` (scooter, pillion), `baguette-trike` ->
`gta-baguette-trike` (rider + one in the bread box), `crepe-van` -> `gta-crepe-van` (closed, doors, driver only).
Rewards: `tour-beret` (head), `baguette-quiver` (back), `riviera-scarf` (neck).

## Composing streets (E30)

```ts
import { planStreetRow, PARTY_GAP, type EuroPlacement } from './eurokit/street';
import { EURO_BUILDINGS, euroBuilding } from './eurokit/catalog';
import { buildStaticPrefabs } from '@lawn/prefabs';

const row = planStreetRow({ x, z, yaw, length: 48, seed: 7, corner: true, setback: 0.35 });
scene.add(buildStaticPrefabs(row.map((p) => ({ ...p, y: groundUnder(p) }))));
```

- The row runs along local +x from (x, z); fronts face local +z (`yaw` = three.js rotation.y). Buildings are packed
  `PARTY_GAP` (0.12 m) apart so party walls never share a face, and each front steps back 0..setback from the frontage
  line, which gives the irregular old-town street face. `mix` limits the ids (e.g. only shopfronts for a market street).
- Irregular streets: chain several short rows with small yaw changes (5-15 degrees) and leave a 1-2 m gap at each bend;
  rows on a bend must not overlap (check footprints). Landmarks and freestanding pieces are placed by hand.
- Colliders: one axis-aligned `Box` per building from its footprint (rotate the corners by yaw), `h` = height.
- Put the ground under a building at the lowest of its four footprint corners so nothing floats.

## Signs with text (environmental storytelling)

`src/eurokit/signs.ts`: `SIGN_FACE[id]` gives the blank face part (`name: 'sign-face'`), its size and centre for
`euro-chalkboard-sign` (menu), `euro-poster-board` (poster) and `euro-street-sign` (street). `EURO_SIGN_LINES` has
satirical lines per kind; `signLine(kind, seed)` picks one. E30 draws the text on a canvas texture on a plane 0.01 in
front of the face (on `LAYER.decal` if it lies on another surface).

## Traffic and the European zone

`src/euroRides.ts`: `EURO_RIDES`; `setEuroZone((x, z) => insideEuroYard(x, z))` — call it once from the world build (E28 or
E30). Inside the zone `TRAFFIC.euroZoneChance` (0.7) of new cars are European rides; in town `TRAFFIC.euroTownChance`
(0.05). `?traffic=euro` makes every new car a European ride (demos). Errands keep four of them (not the hatch) in town.

## Achievements

`gta-grand-tour` (drive all five; Tour Beret), `gta-baguette-run` (Baguette Trike; Baguette Quiver), `gta-petit-pois`
(Petit Pois; Riviera Scarf), fired from `app.ts` on entering a vehicle (`recordEuroRide`, key `gta-euro-rides-v1`).
