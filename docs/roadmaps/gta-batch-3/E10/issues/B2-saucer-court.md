Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Saucer Court, the player's block of flats downtown, stands on its site as three low wings round a courtyard with a giant
Tall-One saucer set in it, open to the street on the south; the stairwell door to flats 3A/3B is recognisable (buzzer,
name plates, lit windows) and the courtyard tells small stories.

## Lore (pasted from docs/lore/entries/apocrypha/saucer-court.md and hyssop-doormat.md)
"A block of flats in Downtown Turfton built round a giant Tall-One saucer set into the ground as a courtyard. The
player's loaned home is flat 3B, paid for by a 1,500-Acorn loan from the First Kiln Bank." Sayings: "Saucer Court?
Lovely courtyard. Nobody owns the courtyard, so nobody sweeps it." / "The bank lent you a roof. The roof is the bank's
until you stop owing for it." Loose thread: where the saucer came from, and why it has never held water.
Hyssop Doormat lives in flat 3A: a retired lollipop-crossing warden who now watches the stairwell and comments on
everyone who uses it ("Forty years she stopped the traffic. Now she stops the stairs.").

## Read first
- `games/gnome-theft-auto/src/homes/types.ts`: `SAUCER_COURT` (rect x 9..51, z 69..111; wings: west x 9..19 and east
  x 41..51 (both z 69..111), north x 19..41 z 69..79; courtyard x 19..41 z 79..111; `stairDoor` (30, 80.6) on the north
  wing's courtyard face; `exit` (30, 82.5); `saucer` (30, 97) r 7.5; `hyssopWindow`).
- `games/gnome-theft-auto/src/homes/pieces.ts`: `HomePiece`, `buildPieces(scene, pieces, name): Box[]`, `prefabBox(id)`,
  `textPlate(...)`, `litWindow(...)`. Use these; do not write your own placement code.
- `games/gnome-theft-auto/src/gnomes.ts`: `makeGnome(parent, look)` (a static gnome model; set `model.object.position`
  and `.rotation.y`). `DEFAULT_LOOK` is in `src/interiors/kit.ts` (copy the import it uses).
- `docs/rendering.md` (z-fighting rules) and `packages/depth` README if `flatLayer` is needed.

## Change
- New `games/gnome-theft-auto/src/homes/saucerCourt.ts`:
  `export function saucerCourtPieces(): HomePiece[]` (pure list) and
  `export function buildSaucerCourt(scene: THREE.Scene): Box[]` (builds pieces with `buildPieces(scene, pieces,
  'saucer-court')`, adds the plates, windows and the resident to `scene`, returns the colliders).
  - Wings: prefab `euro-apartment-block` (unscaled 10 w x 14 h x 8.8 d, front faces +z, shopfronts below, balconies).
    Use `scale` about 1.0-1.1 so the block is about 3 storeys of gnome flats relative to the 4-6 storey towers nearby
    (it is a low block). West wing: 4 blocks along z (x 14, z 74/84/94/104... fit inside 69..111), facing east
    (yaw +π/2) into the courtyard. East wing: mirror (x 46, yaw -π/2). North wing: 2 blocks at z 74, x 24.5 and 35.5,
    facing south (yaw 0)... adjust so nothing pokes outside the rect and no two boxes share a face (leave 0.2 m gaps or
    overlap them by >= 0.3 m; never exactly touching faces). Tint the render one warm cream (`tint: 0xefe0c0`) and
    vary one block (`0xe8d2b0`) so it reads as one old estate.
  - The saucer: prefab `courtyard-saucer` (another worker adds it to `@lawn/prefabs`: a giant shallow white-and-blue
    china saucer, ~15 m across, ~0.35 m high, a raised rim, solid; if it is missing when you test, buildPieces warns and
    skips it, which is fine). `size: 15`, at `SAUCER_COURT.saucer`, `solid: false` (the player walks over it; it is low).
  - The stairwell door: prefab `panelled-door` against the north wing at `stairDoor` (back it 0.3 m into the wall line
    so it reads as a door in the wall, no coplanar faces), a `buzzer-panel` prefab (another worker adds it; a small
    brass panel of labelled buttons on a post) beside it at (32, 80.4), and `textPlate` name plates above the buzzer:
    `'3A  H. DOORMAT\n3B  (YOU)'` (0.8 x 0.35, brass on dark), plus a plate over the door: `'SAUCER COURT\nSTAIRS 1-3'`.
    Mount plates 0.05 m proud of any surface, facing the courtyard (yaw π... compute: a plate on the north wing's south
    face faces +z, so `rotation.y = 0`).
  - Windows: `litWindow` panes on the wing faces looking into the courtyard (at least 8 across the three wings, some at
    each floor), and Flat 3B's own two windows on the north wing's first floor above the door.
  - Storytelling (all from existing prefabs; check ids exist in `packages/prefabs/src/catalog/` with grep before use):
    1. "Nobody sweeps the courtyard": leaves and litter drifted against the saucer rim, a `litter-bin` overflowing
       (crushed cans or `parcel-box` beside it), a broom (look for a broom prefab; else a `rake`) leaning against the
       bin, never used.
    2. "The saucer never held water": a garden hose (search `hose`) running into the empty saucer and a deck chair
       facing it, as if someone waits for it to fill; or a rubber duck/toy boat stranded in the dry saucer.
    3. "Moving day": the player's moving crates (`crate` x2, `parcel-box`) stacked by the stairwell door with a
       `bedroll` on top, a push-bike (search `bike`) chained to a `bike-rack`.
    4. Hyssop's watch post: a `chair` at the stairwell door under her window with a stop/go lollipop sign
       (search `lollipop` / `stop-sign`; else a `signpost`) leaning on it, and a `textPlate` notice on the door:
       `'STAIRWELL RULES\n1. WIPE FEET  2. NO RUNNING\n3. NO LODGERS  4. I AM WATCHING'`.
    5. Washing lines between the wings (`euro-washing-line`) and `mailbox` row by the street entrance.
    - Signage jokes (textPlate on posts or walls): at the street entrance `'SAUCER COURT\nresidents only\n(and the bank)'`;
      a faded notice `'COURTYARD CLEANING ROTA:\nMON: nobody  TUE: nobody  WED: nobody...'`.
  - Resident: Hyssop Doormat, `makeGnome(group, look)` with an old-warden look (hi-vis yellow coat `0xf2d22e`, white
    beard, red hat) standing at her window spot by the stairwell door, facing the courtyard, beside her chair; not
    solid (no collider), just a figure. Name the group `'saucer-court-life'`.
  - Keep the street entrance (south side, z 105..111 between x 19 and 41) open and walkable; keep `SAUCER_COURT.exit`
    and a 2 m circle round `stairDoor` free of colliders.
- New `games/gnome-theft-auto/src/homes/saucerCourt.test.ts`: `planPieces(saucerCourtPieces())` (from `./pieces`): every
  collider box lies inside `SAUCER_COURT.rect` (0.5 m slack); no collider contains `SAUCER_COURT.exit` or any point
  within 1.5 m of `stairDoor`; no two collider boxes share an exact face (z-fight check: for each pair, not (equal minX or
  maxX touching) with overlapping spans... keep it simple: assert no two boxes have `a.maxX === b.minX` while their z and
  height spans overlap, same for z).

## Contract
`buildSaucerCourt(scene): Box[]` and `saucerCourtPieces(): HomePiece[]`; the lead calls `buildSaucerCourt` from app.ts
and pushes the boxes into `world.boxes`. Prefab ids `courtyard-saucer` and `buzzer-panel` come from another worker.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/homes/saucerCourt.test.ts` passes.

## Out of scope
world.ts (the lead already removed the tower on this block), app.ts, homes/types.ts, homes/pieces.ts, flat3b.ts,
`packages/prefabs` (another worker adds the two prefabs).
