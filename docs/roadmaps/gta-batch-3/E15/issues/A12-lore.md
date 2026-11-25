Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
The lore knowledge base describes Hedgeworth Links as built: three new rulings (R-193..R-195), the existing Hedgeworth
entries brought up to date, and three new entries; `npm run lore` passes.

## Read first
- `docs/lore/README.md` (entry format, front matter fields, tiers, the `npm run lore` checks).
- `docs/lore/rulings.md`: the last three rulings (R-186..R-188) for the format (Question / Ruling / Applies to / Date / Why).
- The existing entries: `docs/lore/entries/apocrypha/hedgeworth.md`, `hedgeworth-links.md`, `hedgeworth-clubhouse.md`,
  `the-kicked-board.md`, `peony-gravelrake.md`, `basil-divot.md`, `thrift-hosepipe.md`.
- `docs/lore/entries/apocrypha/snowdrop-slope.md` and `bootlace-tow.md`: entries E12 updated/added "as built" (style
  of the "In the games" section).
- `games/gnome-theft-auto/src/golf/types.ts` (positions, holes, names, `POND_NAME`, `YD`).

## Change
- `docs/lore/rulings.md`: append (dates 2026-11-25, applies to apocrypha, gnome-theft-auto):
  - **R-193** Gnome yards: Hedgeworth is measured in gnome yards, half a Tall-One yard (0.5 m); every distance on its
    card, its signs and the pro's advice is in gnome yards, and a good drive goes about 200 of them. Why: E15 plays
    Gnome Golf's real ball flight in a yard 360 by 420 m.
  - **R-194** The four holes: Hedgeworth Links has four holes, numbered 1, 2, 3 and 9 on the card: The Mortgage (par 4),
    Vesper's Patience (par 3), The Long Week (par 5, Hosepipe Pond on the dogleg) and The Ninth (par 4, by Thrift's shed
    and the Kicked Board). Peony numbers them so because "a nine-hole course" reads better on the mortgage papers, and
    everyone calls the course nine holes, including the scorecard's heading. Course par 16. Why: the brief's lore said
    nine holes; E15 built four on the land there is, and the joke keeps both.
  - **R-195** The Kicked Board and the Members' Gate: the only public way into Hedgeworth is the Kicked Board, a loose
    board in the neighbour's fence on the side facing the road, which a mower or a kick breaks through and which stays
    broken (Thrift has stopped propping it shut). The Members' Gate beside the cart path is always locked; its plaque
    says MEMBERS ONLY and nobody living has the key. Balls lost in Hosepipe Pond are fetched by the pond mower, a
    paddling mower that is Hedgeworth's cousin of Gnome Golf's sea mower; a lost ball costs a stroke and is played
    again from where it was struck. Why: E15 builds the fence, the gate and the water hazard.
- Update (keep their ids; set `status` and add `docs/lore/rulings.md#r-189`.. to `sources` as fits; write "In the
  games" as built, coordinates from types.ts): `hedgeworth-links.md` (the four holes, R-194, gnome yards, Hosepipe Pond,
  hedges, tall grass and giant plants you drive through, the cart paths, two golf carts at the shelter), `the-kicked-board.md`
  (now on the yard's east fence at about (-1001, 640), across the road from Tallgrass Commons; breaking it earns "The
  Kicked Board"; keep "The truth"), `hedgeworth-clubhouse.md` (pro shop counter, bar, honours board, trophy cabinet
  with a gold-sprayed flowerpot, Peony's rooms upstairs; walk-in interior), `peony-gravelrake.md`,
  `basil-divot.md`, `thrift-hosepipe.md` (what each is seen doing on the course: Peony inspecting the terrace with her
  driver for a cane, Basil practising on the first tee with a spare ball in his sock, Thrift watering the ninth green
  and talking to it), `hedgeworth.md` (one line on the course as built).
- New entries in `docs/lore/entries/apocrypha/` (front matter like the others: kind place/thing, tier apocrypha,
  setting apocrypha, era now, status canon or the status the README says new built things get, games [gnome-theft-auto],
  related ids): `hosepipe-pond.md` (the water hazard on The Long Week; the pond mower), `the-members-gate.md`,
  `gnome-yard.md` (kind: thing or custom per the README: the unit; R-193).
- `docs/lore/settings.md`: in the apocrypha line that lists the batch-3 edges, add "Hedgeworth Links as built: four
  holes numbered 1, 2, 3 and 9, gnome yards, the Kicked Board and the Members' Gate (R-193..R-195)" next to the other
  built places, following the line's style. Also `docs/lore/INDEX.md` if the README says new entries are listed there
  (or if `npm run lore` regenerates it, run that).

## Contract
Ruling numbers R-193, R-194, R-195 (the lead renumbers at merge if another epic took them first). Entry ids:
`hosepipe-pond`, `the-members-gate`, `gnome-yard`.

## Done when
- `npm run lore` passes (from the repo root).
- `npm run lore -- find hedgeworth` lists the new entries.

## Out of scope
Code. Other places' entries.
