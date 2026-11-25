Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You only touch files under
`docs/lore/` (no game code).

## Goal
The lore of Drainpipe Court and the Gutter Bowls matches what this epic builds: three rulings, five new person or place
entries, and the four existing entries updated from "Planned" to what exists.

## Read first
- `docs/lore/README.md` (entry format, front matter fields, how INDEX.md is generated or kept) and `docs/lore/canon.md`
  (skim).
- `docs/lore/rulings.md` (the last rulings, R-205..R-209, for the exact format; yours are R-210, R-211, R-212).
- `docs/lore/entries/apocrypha/drainpipe-court.md`, `the-gutter-bowls.md`, `cardoon-trowelly.md`,
  `fennel-gripwax.md`, `asphalt-the-cat.md`, `kilnside-rec.md`.
- `games/gnome-theft-auto/src/court/types.ts` and `src/skate/types.ts` and `src/sports/types.ts` (the facts: places,
  people, spots, lines; read, do not edit).

## Change
- `docs/lore/rulings.md`, three rulings (date 2026-11-25, applies to apocrypha, gnome-theft-auto):
  - R-210 How big is Drainpipe Court? Ruling: it plays by Gnomerena rules (GBA GJAM: two on two, twos and threes,
    turbo, shoves) on a court sized for street gnomes: the Gnomerena's court and hoop scaled by four fifths, so the rim is
    2.44 m for a 1 m gnome (the Gnomerena's gnomes are a quarter bigger). Both hoops are drainpipe hoops with no net.
    Pickup games go to 11; a grudge match goes to 7. Why: the game reuses GBA GJAM's simulation and keeps its proportions.
  - R-211 What is a skateboard in Turfton? Ruling: a wooden deck on four wheels, ridden standing, on anything paved;
    grass stops it. It is slower than any mower and has no place in traffic law (the Hat Watch pretends it is not
    there, as at Kilnside Rec's old skate corner, which stays). Spare boards live in the Board Library at the Gutter
    Bowls: take one, leave one. Why: the board is ridable anywhere without becoming a vehicle class.
  - R-212 Are skate tricks the same in Turfton as in the Aether? Ruling: the names and the scoring of tricks (ollie,
    kickflip, grabs, grinds, combos) are the same everywhere gnomes ride boards; nothing else connects the Gutter Bowls
    to the Aether or its Splash-Back Skaters. Why: Gnome Theft Auto shares Aether Board's trick tables and scoring.
- New entries in `docs/lore/entries/apocrypha/` (front matter like `cardoon-trowelly.md`: tier/setting apocrypha, era
  now, status draft, games [gnome-theft-auto], sources this epic's roadmap `docs/roadmaps/gta-batch-3/E19/roadmap.md`
  and the rulings, related ids), each a short paragraph, "What gnomes say" (two lines), "In the games" (where they
  stand and what they do), "Loose threads":
  - `lintel-crossover` (Lintel Crossover): Cardoon's partner on court; all fakes, no shot; stands by the south
    sideline. Swish's opponent team in pickup games.
  - `pansy-rebound` (Pansy Rebound): the regular who partners the player; a fierce rebounder; a sweatband; stretches
    on the north side.
  - `burdock-benchley` (Old Burdock Benchley): sits on the bench that is older than the court; keeps the chalk score
    on the scoreboard; has never played and has opinions on every shot.
  - `moss-squeegee` (Moss Squeegee): squeegees the Gutter Bowls dry after rain, standing on the bowl floor with a
    bucket; thinks of the bowls as a roof that happens to be on the ground.
  - `pebble-nollie` (Pebble Nollie): a young gnome who films every session at the Gutter Bowls on her Gnomlet and has
    never once stood on a board; wears a helmet anyway.
  - `the-board-library` (The Board Library): the rack of spare boards at the Gutter Bowls' north entrance, "take one,
    leave one"; Fennel keeps it stocked.
  - `lather-and-lint` (Lather & Lint): the laundrette by Drainpipe Court, under Swish Trowelly's flat.
- Update the four existing entries' "In the games" sections from "Planned" to built facts: Drainpipe Court (court at
  (-90, 30), two drainpipe hoops, chalk scoreboard, ball cage, Old Burdock's bench, pickup games 2v2 to 11, a
  shootaround, regulars Cardoon, Lintel, Pansy, Burdock; side quest `sq-court-regulars`); the Gutter Bowls (at
  (-30, 90): the Long Gutter half-pipe, the Gutter Bowl with its bank, a street section with a kicker, a flat rail, a
  ledge, a platform with stairs and a handrail, a downspout rail; Fennel's deck; the Board Library; four lines from
  Fennel's list: First Push, Round the Kidney, The Long Gutter, Asphalt's Way Down; side quest
  `sq-gutter-bowls-sessions`); Cardoon (wears the net the hoop never had: "Why the court calls him Swish when the hoop has
  no net" can move from Loose threads to an answer); Fennel (a hammock under his deck, keeps the Board Library).
  Add the new ids to `related` where they belong. Asphalt's entry: one line that she visits Fennel's hammock.
- `docs/lore/INDEX.md`: add rows for the new entries if the index is kept by hand (follow README.md; if a script
  generates it, run that script).

## Done when
- `npm run lore` passes (from the repo root).
- `npm run lore -- find skate` lists the new entries.

## Out of scope
Any game code; other entries.
