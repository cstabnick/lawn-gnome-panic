Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Four downtown homes stand on their E01 home sites as recognisable places, each with a front door, a name plate, a
mailbox, windows lit at night, small story vignettes, a joke sign and (for two of them) the resident seen doing
something that is theirs: Juniper Vance's terrace on Kerb Row (home-01), the Mayor's red villa (home-02), Reginald
Vance's townhouse 404 (home-03), Mabel's flat over the Kerbstone Cabs garage (home-04).

## Who lives there (from docs/design/gnome-theft-auto/characters.md; check `npm run lore -- find <name>` for more)
- **Juniper Vance** (home-01, site centre (-90, 140), 24 x 16, rect x -102..-78, z 132..148): councilwoman at City Hall,
  earnest reformer, buried in rezoning paperwork; a narrow terrace on Kerb Row, Bodega's street. Door spot
  `HOME_DOORS.juniper` (-90, 130.5) on the north side (street at z 120): the house front faces north (yaw π).
- **Mayor Mulch** (home-02, (80, -150), 20 x 30, rect x 70..90, z -165..-135): the vain, bribable mayor; "the Mayor's
  Residence, a glossy red villa in Patio Heights". Door `HOME_DOORS['mayor-mulch']` (80, -133.5), front faces SOUTH (+z, yaw 0; the street at z -120 is south of it).
- **Reginald "Quarter-Inch" Vance** (home-03, (102, -150), 16 x 24, rect x 94..110, z -162..-138): HOA auditor with
  calipers, measures lawns to the quarter inch, Juniper's estranged husband; townhouse 404 (another worker builds its
  walk-in interior, door id `townhouse-404`). Door `HOME_DOORS.reginald` (102, -136.5), front faces south (yaw 0).
- **Mabel Kerbstone** (home-04, (-150, 30), 20 x 20, rect x -160..-140, z 20..40): Kerbstone Cabs driver, "every fare to
  end well and be paid in cash", never short of change; a flat over the cab garage. Door `HOME_DOORS.mabel`
  (-138.5, 30), front faces east (yaw π/2) to the street at x -120.

## Read first
- `games/gnome-theft-auto/src/homes/types.ts` (`HOME_DOORS`) and `games/gnome-theft-auto/src/homes/pieces.ts`
  (`HomePiece`, `buildPieces`, `planPieces`, `prefabBox`, `textPlate`, `litWindow`). Use these; no own placement code.
- `games/gnome-theft-auto/src/gnomes.ts` `makeGnome(parent, look)` and `DEFAULT_LOOK` from `src/config.ts`.
- `docs/rendering.md`: no coplanar faces; plates 0.05 m proud of walls.
- Prefab ids you may use (all exist; sizes unscaled, w x h x d): `euro-townhouse-tall` 3.4 x 11.8 x 6.5 (front +z),
  `euro-townhouse-mansard` 4.0 x 9.85 x 6.5, `euro-apartment-block` 10 x 14 x 8.8, `rough-workshop` 10.2 x 5.4 x 8.5,
  `gnome-cottage` 6.2 x 5.3 x 6.2, `panelled-door` 1.44 x 2.27 x 0.26, `mailbox` 0.23 x 0.78 x 0.33, `bike-rack`,
  `litter-bin`, `park-bench`, `newspaper-box`, `street-bollard`, `crate`, `parcel-box`, `plant`, `chair`, `table`,
  `sealed-letter`, `ledger`, `lamp`, `scrap-car`, `oil-drum`, `tyre-pile`, `dumpster`, `sandwich-board`. Grep
  `packages/prefabs/src/catalog/` for more (e.g. `rose`, `hedge`, `topiary`, `fountain`, `taxi`, `watering-can`,
  `calipers`, `measuring-tape`) and only use ids that exist.

## Change
- New `games/gnome-theft-auto/src/homes/townHomes.ts`:
  `export function townHomePieces(): HomePiece[]` (pure) and
  `export function buildTownHomes(scene: THREE.Scene): Box[]` (`buildPieces(scene, townHomePieces(), 'town-homes')`, then
  add plates, windows and residents to one `THREE.Group` named `'town-homes-life'`, return the colliders).
  For each home:
  - The house inside its site rect (scale buildings to fill most of it; a terrace is 3 `euro-townhouse-tall` side by
    side with Juniper's in the middle and tinted differently; the villa is a `euro-townhouse-mansard` scaled ~2x tinted
    glossy red `0xb3261e`; the townhouse is a narrow beige `euro-townhouse-tall` with a tidy box hedge; Mabel's is a
    `rough-workshop` garage (the cab garage) with a door-side stair, a cab parked in front if a taxi prefab exists).
    The front door faces the door spot; the door spot itself and 1.5 m round it stay free of colliders.
  - A `mailbox` beside the door, a `textPlate` name plate on it or by the door with the row's plate text:
    Juniper `'J. VANCE'`, Mayor `'THE MAYOR\nPLEASE KNOCK LOUDLY'`, Reginald `'404\nR. VANCE'`, Mabel
    `'M. KERBSTONE\nFLAT ABOVE'`; and 2-4 `litWindow` panes on the front.
  - Three story vignettes across the four homes per home where it fits (at least 3 per home for Juniper's and
    Reginald's, 2 for the others), e.g. Juniper: rezoning papers weighed down by a stone on the step, a council bike
    with a parking ticket from her own council, a half-painted front door with the paint pot; Mayor: a ribbon-cutting
    ribbon still tied across the gate, a gold-sprayed garden gnome statue of himself (use a gnome model, gold look), an
    overflowing bin of "thank you" gift boxes; Reginald: a lawn with one perfectly measured square (string + pegs, a
    measuring tool), a "NOTICE OF NON-COMPLIANCE" pinned on his own hedge, a neat row of identical pots; Mabel: a cab with
    the bonnet up and a toolbox, a jar of change on the stair, a "BACK IN 5 MINS (MAYBE 50)" board.
  - Signs (`textPlate`, jokes in the place's voice), at least one per home: Kerb Row street sign
    `'KERB ROW\nkerbs: yes  row: ongoing'`; Mayor `'RESIDENCE OF THE MAYOR\nCAMPAIGN DONATIONS: SIDE DOOR'`; Reginald
    `'LAWN UNDER OBSERVATION'`; Mabel `'KERBSTONE CABS\nCASH ONLY. CORRECT CHANGE NOT REQUIRED: I HAVE IT'`.
  - Residents (static `makeGnome` figures, no collider), at least two: Juniper on her front step reading a thick
    rezoning file (a `ledger` prop beside her, a mug); Mabel leaning on her cab counting change. Looks: Juniper
    `{ hat: 0x2e7d32, shirt: 0xf5f0e1, glasses: true }`; Mabel: a cab-yellow coat `0xf2c200`, red hat. (Reginald is
    seen inside his townhouse, which another worker builds; outside, show only his traces.)
  - Do not place anything outside each site rect except the plate/mailbox within 2 m of the door spot.
- New `games/gnome-theft-auto/src/homes/townHomes.test.ts`: with `planPieces(townHomePieces())`: every collider box lies
  within one of the four site rects (`siteRect('home-01')` ... from `../sites`, 2.5 m slack for mailboxes); no collider
  contains any of the four door spots or comes within 1 m of one.

## Contract
`buildTownHomes(scene): Box[]`, `townHomePieces(): HomePiece[]`. The lead calls `buildTownHomes` from app.ts.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/homes/townHomes.test.ts` passes.

## Out of scope
homes/types.ts, homes/pieces.ts, homes/data.ts, the townhouse interior (another worker), app.ts, prefabs.
