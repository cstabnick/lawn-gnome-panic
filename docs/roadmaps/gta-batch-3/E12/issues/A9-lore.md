Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): lore writing

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
The lore knowledge base records what E12 builds: rulings for winter sports, ice fishing and the Snowcap bears, new entries
for the Bootlace Tow, the Wool Run and the Tea-Tray Run, and the existing Snowdrop Slope, Woolly Sock Lodge, Pail Pond,
Fells Polar Bears, Thermos Theo and Gentian Bootlace entries updated from "planned" to what is in the game. Two loading
-screen facts. `npm run lore` passes.

## What the game now has (write from this)
- **Snowdrop Slope** (`snowdrop-slope`, Snowcap Rise): a snow slope from about 60 m at its north top down to its foot
  beside the Woolly Sock Lodge. **The Bootlace Tow**: a rope tow up the east side; the rope is knotted bootlaces on
  cotton-reel pulleys, and riders hang on to cotton-reel handles; it pulls skiers and sledders alike. **The Wool Run**: a
  ski slalom of six blue-and-red flag gates from a timber start hut to an orange finish banner; a missed gate costs 3
  seconds; a clean run in 26 s or less is "Black Diamond". **The Tea-Tray Run**: a straight sled lane down the west side;
  the sleds are round Tall-One tin tea trays with a painted rose (gnomes call them "rose shields"). A piste map at the
  foot shows both. Falls are tumbles: nobody cracks on snow.
- **The Woolly Sock Lodge**: a log lodge at the foot with a giant knitted sock over the door; rents skis (8 Acorns) and
  tea trays (4 Acorns), sells Hot Cocoa (6 Acorns, a snack that mends 35% of a gnome's glaze... phrase it as warming) and
  sells a tea tray to keep (30 Acorns: drop it on any snow from the Gnomlet's Snowdrop app). A sock-drying rack with one
  enormous Tall-One sock; a lost-mittens heap. Gentian Bootlace teaches two learners the snowplough out front.
- **Pail Pond**: ice holes are drilled with a hand auger (anyone may drill; a hole refreezes when a fifth is drilled);
  fish come up through a hole, are measured, carded and slipped back down; the ice never cracks under anyone. Thermos
  Theo keeps a red shanty on the ice and lends a Bent-Pin Twig Rod to anyone without one. The giant pail's handle sticks
  out of the ice at the edge: "the Rim"'s handle, which settles the old "nobody has found the handle" joke (decide how
  gnomes react: they found it and still do not know what it is for). Cold-water fish: Pail Perch, Woolly Minnow, Lantern
  Burbot (bites at night), Frostjaw Char (bites in falling snow; needs a Split-Cane Rod or better).
- **The polar bears**: five on the Fells sun deck (now signposted "BEAR DECK"), and four on Snowcap Rise: one asleep on
  Pail Pond's ice, one turning slowly in an inner tube on the ice, one fishing a hole from a stool, one on the Lodge's
  porch bench with a mug of cocoa. Their call is now a long contented yawn. They never speak and nothing upsets them.
  "Bear Hug": stand beside nine of them. The bears are paid in sardines (an empty sardine tin by the holes).
- Side quests (built by another worker): "Snowdrop Sled Trials" from Gentian, "Lines on Pail Pond" from Theo.

## Read first
- `docs/lore/README.md` (entry format, front matter fields, tiers), `docs/lore/canon.md` (skim), `docs/lore/rulings.md`
  (the last rulings, R-178..R-181, for format; your rulings are **R-182, R-183, R-184**).
- `docs/lore/entries/apocrypha/snowdrop-slope.md`, `woolly-sock-lodge.md`, `pail-pond.md`, `fells-polar-bears.md`,
  `thermos-theo.md`, `gentian-bootlace.md`, `snowcap-rise.md`.
- `games/gnome-theft-auto/src/loading/facts.ts` (`LOADING_FACTS`, <= 140 chars each).
- `npm run lore -- find frost`, `npm run lore -- find bear`, `npm run lore -- find Fells` (from the repo root) to check you
  do not contradict anything.

## Change
- `docs/lore/rulings.md`: append R-182 (winter sports on Snowcap Rise: the Bootlace Tow, tea trays as sleds, the Wool Run,
  tumbles not cracks, why skiing exists at all in a garden), R-183 (Pail Pond ice fishing: holes, the catch-and-release
  rule under ice, the ice never cracks, Theo's lending rod, the bears' sardines, the pail's handle), R-184 (the polar
  bears of Snowcap Rise and the Bear Deck: where the nine bears are, the yawn, they never speak, nothing hostile). Same
  format as the others (Question / Ruling / Applies to / Date 2026-11-25 / Why).
- New entries in `docs/lore/entries/apocrypha/`: `bootlace-tow.md`, `wool-run.md`, `tea-tray-run.md` (front matter like
  `snowdrop-slope.md`; `sources` include `docs/lore/rulings.md#r-182`; `related` link each other and snowdrop-slope).
- Update the six existing entries' "In the games" sections from "Planned" to what is built (keep their history; add the
  new rulings to `sources`). Keep everything that is still true.
- `games/gnome-theft-auto/src/loading/facts.ts`: append two facts (<= 140 chars) from these rulings.
- If `docs/lore/INDEX.md` is generated, regenerate it the way README says; if it is hand-kept, add the three new entries.

## Done when
- `npm run lore` (repo root) passes.
- `cd games/gnome-theft-auto && npx vitest run src/loading` passes (if a facts test exists).

## Out of scope
Every file not named above (quests, code, other epics' rulings).
