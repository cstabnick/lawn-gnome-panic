# E10 contracts: homes, the player's flat, workplaces

What E10 gives later epics (E20-E22 story, E11-E17 area epics with homes on their sites, E16 field homes). Code under
`games/gnome-theft-auto/src/`. World: +x east, +z south; yaw 0 faces +z.

## Who lives and works where (`homes/data.ts`, `homes/types.ts`)

```ts
interface HomeDef { characterId; name; where: string | null; door: [x, z, yaw] | null;
  kind: 'flat' | 'facade' | 'interior' | 'existing' | 'site' | 'hidden'; acknowledged: boolean; interiorId?; plate? }
interface WorkDef { characterId; name; at: [x, z] | null; stage? }
HOMES, WORKS                       // one row per character of the bible table (characters.md)
homeOf(id), workOf(id)             // undefined for an unknown id
homeDoor(id): [x, z]               // the spot outside the front door (throws if the home has no place)
registerHome(def), registerWork(def)   // area epics: add the door when you build a `site:` home
homePlaces(), homeLandPlaces()     // acknowledged built homes as places (taxi/courier LAND_PLACES include them)
HOME_DOORS, SAUCER_COURT, BANK_COUNTER // fixed spots (homes/types.ts)
```

- `door` yaw = the way a gnome faces walking OUT. `where`: an E01 site id, `stage:<id>`, `site:<id>`, or null.
- Story quests: a pick-up or drop-off at a home is a `visit` with `at: homeDoor('<id>')` (see `ch1-two-coat-tail`, the
  Mayor's letterbox, and `city-kerbside-rounds`, Juniper's and Mabel's letterboxes). A walk-in home is a `visit` with
  `interior: '<interiorId>'` and a local `at`.
- `kind: 'site'` rows (golf, campus, coast, ski, mole halls...): the area epic builds the place and calls
  `registerHome({ ...homeOf(id)!, door: [x, z, yaw] })`. Hidden homes stay data only (no door, no marker).
- Built by E10: Saucer Court (player, Hyssop), home-01 Juniper (Kerb Row), home-02 the Mayor's Residence, home-03
  townhouse 404 (Reginald, walk-in `townhouse-404`), home-04 Mabel (Kerbstone Cabs garage), home-05 Sorrel's cottage,
  home-06 Diggs' bungalow (walk-in `diggs-bungalow`), home-07 Frank's shack. home-08..12 are still free sites.

## The player's flat (`home/`)

- Property `flat-3b` (`FLAT_PROPERTY`: 1,500, all on loan, booked beside Kiln-Debt per R-169). Signed during quest
  `m02-roof-on-credit` when objective 2 starts (`HOME_SIGN_STEP`); `installHome(...).catchUp(saves)` signs saves that
  are past it. `ownsProperty('flat-3b')` = the player has a home.
- Interior `flat-3b` (door: the Saucer Court stairwell, `SAUCER_COURT.stairDoor`), locked until owned. Built from the
  layout on every entry.
- Layout (`home/layout.ts`, save `gta-home-v1`): `loadLayout()`, `addStored(l, prefab, n)`, `placeFromStore`,
  `movePiece`, `rotatePiece`, `storePiece`, `setColours`, `commitLayout(l)`, `onHomeChange(cb)`. `HomeLayout.kind` is
  `'flat'`; `'cabin'` is reserved for a field home (E16 or later: give it its own interior and a layout key, reuse the
  model and the decorate panel with a different room size).
- Stock: `FURNITURE_SHOP` (prefab, name, price, footprint). A story beat can give furniture with `addStored` +
  `commitLayout` (e.g. #39 Pip's couch: `addStored(loadLayout(), 'couch')`).
- Probes for quests: `home-owned` (0/1), `home-furnished` (pieces standing in the flat).
- Hooks: sleeping in a bed/bedroll advances time (`advanceWorldTime`) and saves; the decorate panel opens from the
  Decorate spot in the flat or the Gnomlet "Home" app (`id: 'home'`).
- Interiors runtime additions (E05 module): `refreshInterior()` rebuilds the current room in place (meshes, colliders,
  spots); colliders are now replaced on every build, so a room whose layout changes collides correctly.
- Ledger: `PropertyDef.buyHint` shows a line instead of a Buy button (a property bought elsewhere).

## Saves

`gta-home-v1` (newer side wins), `gta-homes-visited-v1` (union): both in `GTA_SAVE_KEYS` and cloud MERGES.

## Achievements

`gta-home-sweet-loan` (House Key, neck), `gta-interior-decorator` (10 pieces; Feather Duster, hand), `gta-forty-winks`
(Nightcap, head), `gta-house-call` (6 homes; Rolled Doormat, back).

## Online

Homes are per player and local; no net messages. Another player never enters your flat (each client's Flat 3B is its
own). Character homes are static world from data, the same on every client. Visited homes are per save.
