# Gnome Theft Auto: side-quest unlock schedule

Source for L67 (side quests that do not overwhelm), the bubble-mobile quests (L54), the chef job (L30) and the hobby
intros (L66). E18 builds from this file; the main-quest rows are the 70 rows of `docs/roadmaps/gta-batch-3/E04/spine.md`
(`#N` below is the row number). Side quests are the quests of today's `SIDE_UNLOCKS` in
`games/gnome-theft-auto/src/quests/unlocks.ts` plus the new ones this batch plans. New side-quest ids are
placeholders (`sq-<slug>`); the area epic that builds a quest may change the id, and then edits its row here.

## The rule

- **Caps.** At most 3 side quests are offered at once in act I (rows 1-15), about 4 in act II (rows 16-35), and about 6
  from act III on (rows 36-70, acts III and IV).
- **What "offered" means.** A side quest is offered from its unlock row for **four main rows** (its own row and the
  three after). After that it moves to the journal's **Later** shelf: still takeable from its giver in the world, no
  longer counted, no longer shown in the Open tab. The cap check in section 5 counts offered quests only, with a player
  who plays no side quests at all.
- **Giver first.** A side quest opens only when its giver has appeared in the story (the main quest named in the
  "giver appears because" column) or, for the Newcomers' Card, when a story beat sends the player next to the host.
  The Club's tutorials do not nag: each shows once, from the Club's own giver marker.
- **Hobbies are introduced by a story beat that sends the player there**: fishing by #11 (the canal), birding by #19 and
  #25 (the Cloverfield fields, the loch), hunting by #22 (Mossy Wood).
- **Old saves lose nothing.** A side quest that is started or done stays so (`unlockMet` already says this); re-timing
  only changes what a fresh save is offered, and when. A save past a row sees every earlier quest as already shelved,
  not offered all at once: the journal shows the Later shelf, not a pile.
- **Re-times worth noting.** Quests tied to the old chapter breaks moved onto the 70 rows where the new story makes a
  better moment: `sq-porcelain-support` follows Clara's own quest (#66); tutorials and contracts whose premise depends
  on an old beat stay at that beat (`nc-skyway`, `nc-odd-jobs`, `sq-mulch-pyramid` at #15, `city-impound-run` at #8,
  `nc-take-off` at #20, before any quest needs flying); `race-*` and `city-*` rows follow the characters that now
  introduce them (Lulu from #30, Dot from #18). The Tessie quest keeps `TESSIE.unlockKey`: an older save's unlock still
  wins.

## 1. The schedule table

Sorted by unlock row. "max open at once" is the cap in force at that row (3 / 4 / 6). `E10`..`E19` name the epic that
builds the quest; `existing` means the QuestDef is already in `games/gnome-theft-auto/src/quests/`. The Tessie quest is
written by its constant, `TESSIE.questId`.

| side quest id | title | giver | unlocks after | giver appears because | region | max open at once | built by |
|---|---|---|---|---|---|---|---|
| `sq-grid-truthers` | The Grid Truthers | a stranger (strangers) | #1 `prologue-fresh-kiln` | Downtown loiterers who have always been there; the player now walks past them with a mower of their own. | `downtown` | 3 | existing |
| `nc-good-neighbour` | Good Neighbour | Newcomers' Card host (R-156) | #1 `prologue-fresh-kiln` | The Club hands the Newcomers' Card to every new gnome; street events start at once. | `downtown` | 3 | existing |
| `nc-wheel-and-kit` | The Wheel and the Kit | Newcomers' Card host (R-156) | #3 `first-contract` | Don Compost's first contract hands out guns; the Club follows with the wheel and the Pocket Kit. | `wilds` | 3 | existing |
| `sq-hyssop-stairwell` | The Stairwell Committee | Hyssop Doormat (hyssop) | #5 `m05-sweepers-wages` | Hyssop met the player on move-in day (#2) and has now written up the flat block's rules. | `downtown` | 3 | E10 |
| `sq-snail-rigging` | Snail-Racing Rigging | Shelldon (strangers-shelldon) | #6 `ch1-two-coat-tail` | The player has met Tansy, Cam and the Watch; Shelldon's alley is a block from Side-Valve. | `downtown` | 3 | existing |
| `sq-levelright-night-shift` | Night Shift at Levelright | Chard Levelright (chard) | #7 `m07-even-estates` | Chard met the player at the fringe site (#7) and is short of hands that will not talk to the Tattler. | `turfton-fringe` | 3 | E16 |
| `sq-big-lou-embargo` | Big Lou's Dry-Hat Embargo | Big Lou (strangers-gnomecino) | #9 `m09-where-asphalt-sleeps` | The player has tailed and fought by #6; Lou's embargo is already on, and the Mulch Club comes up in #11. | `downtown` | 3 | existing |
| `sq-dewdrop-1` | The Rolling Prototype | Hogweed Sprocket (hogweed) | #10 `m10-under-the-span` | The player met Hogweed under the Unfinished Span (#10) as the Dewdrop rolled past. | `underspan` | 3 | E18 |
| `nc-bent-pin` | The Bent Pin | Newcomers' Card host (R-156) | #11 `m11-the-dons-cigars` | #11 takes the player to New Puddle Marina; the Club's fishing host keeps a bait stall on the canal bank. | `canal` | 3 | existing |
| `sq-chef-first-shift` | Sage Needs a Hand | Sage Ladle (sage) | #13 `m13-diner-on-route-south` | Sage paid in a meal at #13 and said the rush was coming. | `south-highway` | 3 | E18 |
| `sq-court-regulars` | Run With the Regulars | Cardoon "Swish" Trowelly (cardoon) | #14 `m14-drainpipe-court` | Cardoon beat Pip at #14 and liked the player's defence. | `downtown` | 3 | E19 |
| `sq-gutter-bowls-sessions` | Gutter Bowls Sessions | Fennel Gripwax (fennel) | #15 `ch1-founders-boot` | Fennel gave the cap back at #9 and keeps a list of lines nobody has skated. | `downtown` | 3 | E19 |
| `sq-biscuit-hotdog` | Biscuit's Lost Squeaky Toy | Granny Gnertrude (cloverfield-barn) | #16 `ch2-dew-run` | Granny's barn opens at #16; the first combine haul. | `cloverfield` | 4 | existing |
| `nc-lockup` | Store It, Call It | Newcomers' Card host (R-156) | #17 `m17-the-dew-buyer` | Tansy's bay is the player's garage; the Club shows how to park and call a ride before the HOA seizes it (#35). | `downtown` | 4 | existing |
| `city-kerbside-rounds` | Kerbside Rounds | Dorrit "Dot" Pennywort (kerb-exchange) | #18 `ch2-sprinkler-gauntlet` | Dot puts the player on the Exchange's books once Side-Valve and the Watch are old news. | `downtown` | 4 | existing |
| `sq-castaway-drydock` | Castaway's Dry-Dock | Driftwood (cloverfield-barn) | #19 `m19-squall-box-forecast` | Driftwood hung about the barn through the gauntlet (#18). | `cloverfield` | 4 | existing |
| `nc-sky-spotting` | Sky Spotting | Newcomers' Card host (R-156) | #20 `ch2-vespers-offer` | Rooster sent the player to three Cloverfield fields at #19; the Club's birding host waits at the last one. | `cloverfield` | 4 | existing |
| `sq-porcelain-blues` | Porcelain Blues | a stranger (strangers-porch) | #21 `m21-penthouse-viewing` | Vesper's offer (#20) put porcelain guards on every corner; the porch gnomes have views. | `mossy-wood` | 4 | existing |
| `city-penthouse-exclusive` | Penthouse Exclusive | Dorrit "Dot" Pennywort (kerb-exchange) | #22 `m22-off-air` | The Tattler wants dirt on Vesper after the penthouse tour (#21). | `patio-heights` | 4 | existing |
| `nc-tuft-and-tally` | Tuft & Tally | Newcomers' Card host (R-156) | #23 `ch2-unmowed-tablet` | #22 sends the player to Mossy Wood, where the Club's lodge host keeps the licence desk. | `mossy-wood` | 4 | existing |
| `sq-fescue-fugitive` | The Fescue Fugitive | Elder Bracken (unmowed-hollow) | #24 `m24-the-burrow-door` | The Cracked Tablet (#23) opened the Hollow. | `mossy-wood` | 4 | existing |
| `sq-burrow-post` | Sorting the Post | Nubbin (nubbin) | #25 `m25-one-leg-to-stand-on` | Nubbin met the player at the Burrow Door (#24). | `loamdeep` | 4 | E17 |
| `nc-reedwatch` | Reedwatch | Newcomers' Card host (R-156) | #26 `m26-the-knot-hole` | #25 lands the player at the loch; the Club's reed hide is in sight. | `loch-moss` | 4 | existing |
| `sq-flock-errands` | Errands for the Flock | Mother Saxifrage Wader (saxifrage) | #27 `m27-heap-of-trouble` | Saxifrage preached at the player (#25) and likes anyone who can stand still. | `waders-rest` | 4 | E15 |
| `sq-dewdrop-2` | Hogweed Rolls Out | Hogweed Sprocket (hogweed) | #28 `m28-sibling-rivalry` | Hogweed phones after the Tattler chase (#28), having read about the Compost Heap furnace. | `underspan` | 4 | E18 |
| `sq-hedgeworth-lost-balls` | Lost Balls | Thrift Hosepipe (thrift) | #29 `m29-the-kicked-board` | Thrift chased the player off the wet fairway at #29. | `hedgeworth` | 4 | E15 (until E20: unlocked after `ch2-unmowed-tablet`) |
| `race-rookie-mowdown` | Fizz Cup: Rookie Mow-Down | Lugnut Lulu (speedway) | #30 `m30-cams-big-night` | Lulu laughed at Cam at #30 and noticed the player's driving. | `speedway` | 4 | existing |
| `sq-windfall-croft-deed` | The Croft by the Silo | Farmer Bramble (bramble) | #31 `m31-granny-cracks` | Granny told the player about her husband's silo at #31; Bramble knows who holds the deed. | `cloverfield` | 4 | E16 |
| `nc-hangar-and-boathouse` | Hangar and Boathouse | Newcomers' Card host (R-156) | #32 `m32-driftwoods-chart` | Driftwood's chart (#32) puts a boat shed in the player's head; the Club sells sheds. | `canal` | 4 | existing |
| `sq-dewdrop-3` | Dewdrop | Hogweed Sprocket (hogweed) | #33 `m33-the-bench-lock` | Hogweed built the bench lock (#33) and is out of excuses not to finish the ball. | `underspan` | 4 | E18 |
| `nc-party` | Throw a Party (online) | Newcomers' Card host (R-156) | #34 `m34-forty-seven-wrenches` | Tansy's party for the rezoned Green (#34) is the cue; optional and online only. | `downtown` | 4 | existing |
| `city-skyway-robbery` | The Skyway Job | Dorrit "Dot" Pennywort (kerb-exchange) | #36 `ch3-kiln-resin-ice` | The HOA raided Side-Valve (#35); Local 404 hits back through the Exchange. | `underspan` | 6 | existing |
| `sq-hose-revolt` | The Great Hose-Pipe Tax Revolt | a stranger (strangers-canal) | #36 `ch3-kiln-resin-ice` | The HOA heat is on everyone after the raid; the canal gnomes ask for help. | `canal` | 6 | existing |
| `nc-strike-a-pose` | Strike a Pose | Newcomers' Card host (R-156) | #2 `m02-roof-on-credit` | Emotes need nothing but the gnome; Neon-Moth Nina stamps the card on the walk home to Saucer Court. | `downtown` | 3 | existing |
| `sq-snowdrop-sled-trials` | Snowdrop Sled Trials | Gentian Bootlace (gentian) | #38 `m38-pail-pond` (for now `ch3-tundra-drift-run`; E21 moves it) | Gentian gave the crew a bunk (#37). | `snowcap-rise` | 6 | E12 |
| `sq-pail-pond-lines` | Lines on Pail Pond | Thermos Theo (theo-pond) | #39 `m39-couch-surfing` (for now `ch3-tundra-drift-run`; E21 moves it) | Theo fished with the player (#38); the polar bears have been paid in sardines. | `snowcap-rise` | 6 | E12 |
| `nc-odd-jobs` | Odd Jobs | Newcomers' Card host (R-156) | #15 `ch1-founders-boot` | Act II costs Acorns and the flat has a loan; the sim jobs earn them (as today). | `downtown` | 3 | existing |
| `TESSIE.questId` | The Loch Moss Monster | Driftwood (loch-driftwood) | #40 `m40-the-capwood-run` | Driftwood rings from his trailer once the crew is back in the city (#39). | `loch-moss` | 6 | existing |
| `sq-capwood-cap-count` | The Cap Count | Warden Chanterelle Stook (chanterelle) | #41 `m41-pinwheel-ridge` | Chanterelle fined the player at #40 and has a clipboard of unfined caps. | `capwood` | 6 | E14 |
| `sq-pinwheel-linemen` | Free the Pinwheels | Ragwort Coilspring (ragwort) | #42 `m42-rutbottom-impound` | Ragwort showed the player which pinwheels to free (#41). | `pinwheel-ridge` | 6 | E13 |
| `race-lowrider-derby` | Fizz Cup: Low & Loud Derby | Lugnut Lulu (speedway) | #43 `m43-saltbucket-boardwalk` | The Carburettors are back on their wheels (#42). | `speedway` | 6 | existing |
| `sq-rutbottom-heats` | Rutbottom Heats | Teasel Mudguard (teasel) | #44 `m44-the-bathtub-queen` | Teasel watched the impound race (#42) and wants a rematch on the dirt. | `rutbottom` | 6 | E14 |
| `race-rutbottom-knobbly` | Rutbottom: Knobbly Heat | Marshal Clary Mudguard (clary) | #42 `m42-rutbottom-impound` | Clary let the player race the impound; now the Bowl is open to anyone on a Knobbly. | `rutbottom` | 6 | E14 |
| `race-capwood-open` | The Capwood Run: Open Stage | Lugnut Lulu (lulu) | #40 `m40-the-capwood-run` | Lulu keeps the route open for anyone who wants to beat her time. | `capwood` | 6 | E14 |
| `coast-spokewheel-gondola` | The Wobbly Gondola | Marram Teaspoon (marram) | #45 `m45-rootwell-admissions` | Marram took the player up the Spokewheel at #43. | `saltbucket-shore` | 6 | E11 |
| `coast-boardwalk-tubing` | Tubing the Long Spoon | Driftwood (driftwood) | #45 `m45-rootwell-admissions` | Driftwood's tube hut opened at #43 and needs someone to test the course. | `saltbucket-shore` | 6 | E11 |
| `coast-bathtub-tours` | Pirate Tours, Mostly | Captain Samphire Bilge (samphire) | #46 `m46-starfall-at-the-anthill` | Bilge joined the crew (#44) and has a boat to fill. | `saltbucket-shore` | 6 | E11 |
| `coast-queens-treasure` | The Queen's Treasure | Captain Samphire Bilge (samphire) | `coast-bathtub-tours` done | Bilge lets slip about the treasure at the end of the tour. | `saltbucket-shore` | 6 | E11 |
| `sq-rootwell-lost-essay` | The Lost Essay | Dean Lovage Inkwell (lovage) | #47 `m47-hedgeworth-links` (for now `ch4-spade-truce`; E21 moves it) | Lovage was dodged at #45; he is sure the player is a student and wants a paper on level lines. | `rootwell` | 6 | E13 |
| `sq-anthill-rent` | Rent for the Landlords | Professor Betony Sextant (betony) | #48 `m48-the-groundskeepers-secret` (for now `ch4-spade-truce`; E21 moves it) | Sextant knows the ants (#46) and the ants are late on a sugar invoice. | `rootwell` | 6 | E13 |
| `sq-hedgeworth-pro-lesson` | A Lesson from the Pro | Basil Divot (basil) | #49 `m49-loamdeep` | Basil lost a hole to the player (#47) and wants to see how. | `hedgeworth` | 6 | E15 (until E21: after `ch3-kiln-resin-ice`, needs Lost Balls) |
| `sq-loamdeep-lamps` | Lamplighters | Old Mother Tumblesoil (tumblesoil) | #50 `m50-trellisdown-tasting` | The Burrowfolk agreed to help (#49); the lamp round is next. | `loamdeep` | 6 | E17 |
| `sq-hedgeworth-ninth-green` | The Ninth Green | Thrift Hosepipe (thrift) | #50 `m50-trellisdown-tasting` | Thrift needs the moles' tunnels shored up after #48. | `hedgeworth` | 6 | E15 (until E21: after `ch3-tundra-drift-run`, needs Lost Balls) |
| `sq-trellisdown-pickers` | Pickers' Pay | Chicory Snips (chicory) | #51 `m51-the-flock-stands` | The tasting (#50) left Chicory owing the pickers a week of dew. | `trellisdown` | 6 | E15 |
| `sq-hedgeworth-members-cup` | Members' Cup | Dame Peony Gravelrake (peony) | #52 `m52-the-test-cut` | Peony agreed to hear the crew out at #47 and runs her cup on the first of the month. | `hedgeworth` | 6 | E15 (until E21: after `ch4-runway-flares`, needs the pro lesson) |
| `sq-flock-vigil` | The Long Vigil | Mother Saxifrage Wader (saxifrage) | #53 `ch3-tundra-drift-run` | The Flock gave the test date (#51) and now keep a vigil. | `waders-rest` | 6 | E15 |
| `race-snail-endurance` | Fizz Cup: Snail-Coach Endurance | Lugnut Lulu (speedway) | #54 `m54-the-heist-board` | After the drift run (#53) Shelldon is back in town and the Speedway reopens. | `speedway` | 6 | existing |
| `nc-take-off` | Wings Over the Flats | Newcomers' Card host (R-156) | #20 `ch2-vespers-offer` | The Dust Flats and the airfield are open; the player must be able to fly before #46. | `dust-flats` | 4 | existing |
| `sq-hoa-audit` | The HOA Audit | a stranger (strangers) | #55 `ch4-runway-flares` | Spans all five biomes: only once the Fells and the Dust Flats are open (#53). | `wilds` | 6 | existing |
| `sq-hedgeworth-reseed` | Reseeding the Scar | Thrift Hosepipe (thrift) | #56 `m56-mortar-for-a-mower` | Hedgeworth keeps its mown scar (#52); Thrift wants it re-turfed. | `hedgeworth` | 6 | E21 (deferred: needs the W14 mown scar, not built by E15) |
| `race-fizz-cup-final` | Fizz Cup: The Final | Lugnut Lulu (speedway) | #57 `ch4-sandpit-drop` | The runway flares (#55) lit the airfield next door to the Speedway. | `speedway` | 6 | existing |
| `sq-underspan-scrap-run` | The Scrap Run | Hogweed Sprocket (hogweed) | #57 `ch4-sandpit-drop` | The mortar fit (#56) left the workshop short on parts. | `underspan` | 6 | E17 |
| `nc-skyway` | Up on the Skyway | Newcomers' Card host (R-156) | #15 `ch1-founders-boot` | End of act I: the player can drive well enough for the deck (as today). | `underspan` | 3 | existing |
| `sq-weeping-line` | The Weeping Line | Pebblewick plots (pebblewick-plots) | #59 `ch4-spade-truce` | The reeve met the player at #58; the dry water line is the town's other problem. | `pebblewick` | 6 | existing |
| `sq-hum-at-three` | The Hum at Three | Pebblewick tower (pebblewick-tower) | #60 `m60-the-moles-dig` | The spade truce (#59) opened the eastern sand. | `pebblewick` | 6 | existing |
| `sq-fort-fence` | Mending the Fort Fence | Commander Diggs (diggs) | #61 `m61-diggs-medal` | The Moles Dig (#60) cracked a tunnel mouth in the fort wall; Diggs wants it mended before roll call. | `dust-flats` | 6 | new (E04 placeholder; E21 or E22) |
| `nc-mind-the-verges` | Mind the Verges | Newcomers' Card host (R-156) | #6 `ch1-two-coat-tail` | After the tail to Patio Heights, where the golf cart lives (as today). | `patio-heights` | 3 | existing |
| `city-glow-band-express` | Glow-Band Express | Dorrit "Dot" Pennywort (kerb-exchange) | #16 `ch2-dew-run` | After the tribunal the Velvet Toadstools book the new Founders' Green bandstand. | `downtown` | 4 | existing |
| `sq-mulch-pyramid` | The Mulch Pyramid Scheme | a stranger (strangers) | #15 `ch1-founders-boot` | Patio Heights to Side-Valve haul; end of act I, before the bay is seized (as today). | `downtown` | 3 | existing |
| `sq-porcelain-support` | The Porcelain Support Group | a stranger (strangers-porch) | #66 `m66-porcelain-hearts` | Clara's follow-up: she asked for Vesper to be stopped, not shattered (#66), and the porch gnomes want to talk about it. | `mossy-wood` | 6 | existing |
| `city-impound-run` | Impound Run | Dorrit "Dot" Pennywort (kerb-exchange) | #8 `ch1-tax-break-in` | Pip's Zero-Turn is towed after the Glaze & Tax break-in; fetch it back and fix it (as today). | `downtown` | 3 | existing |

### Area coverage

Every new area has at least one side quest:

| area | side quests |
|---|---|
| Saucer Court and the flat (E10) | `sq-hyssop-stairwell` |
| Drainpipe Court, the Gutter Bowls (E19) | `sq-court-regulars`, `sq-gutter-bowls-sessions` |
| Thorne Even-Estates sites (E16) | `sq-levelright-night-shift` |
| the Underspan (E17), the Dewdrop (E18) | `sq-underspan-scrap-run`, `sq-dewdrop-1`, `sq-dewdrop-2`, `sq-dewdrop-3` |
| Windfall Croft (E16) | `sq-windfall-croft-deed` |
| Loamdeep, the Burrowfolk (E17) | `sq-burrow-post`, `sq-loamdeep-lamps` |
| Wader's Rest (E15) | `sq-flock-errands`, `sq-flock-vigil` |
| Hedgeworth (E15): owner, pro, groundskeeper | `sq-hedgeworth-lost-balls`, `sq-hedgeworth-pro-lesson`, `sq-hedgeworth-ninth-green`, `sq-hedgeworth-members-cup`, `sq-hedgeworth-reseed` (deferred to E21). The first four are unlocked after story quests that exist today (see the rows) until E20/E21 build their rows |
| Snowdrop Slope, sledding and polar bears (E12) | `sq-snowdrop-sled-trials`, `sq-pail-pond-lines` (both unlocked after `ch3-tundra-drift-run` until E21 builds m38/m39) |
| Capwood (E14) | `sq-capwood-cap-count` |
| Pinwheel Ridge (E13) | `sq-pinwheel-linemen` |
| Rutbottom (E14) | `sq-rutbottom-heats` |
| Saltbucket Boardwalk, the Spokewheel, the Bathtub Queen (E11) | `coast-boardwalk-tubing`, `coast-spokewheel-gondola`, `coast-bathtub-tours` |
| Rootwell and the Anthill (E13) | `sq-rootwell-lost-essay`, `sq-anthill-rent` (both unlocked after `ch4-spade-truce` until E21 builds m47/m48) |
| Trellisdown (E15) | `sq-trellisdown-pickers` |
| Route South Acorn Diner (chef job, E18) | `sq-chef-first-shift` |
| Hobbies (E18) | `nc-bent-pin` (fishing), `nc-sky-spotting` and `nc-reedwatch` (birding), `nc-tuft-and-tally` (hunting) |

Placeholder ids are E04's; E10 to E19 should each take the rows above as their side-quest list and write the QuestDefs.
The only side quest with no epic named is `sq-fort-fence` (Mending the Fort Fence): a small act IV filler for Fort
Sandpit; drop it if no epic has room.

**Pardonlin's town activities (E30) are not side quests.** Queued for Nothing (the Grand Platz queue), the Baguette
Round (Brigitte Levain), Portrait of a Croissant (Odile Easelby) and the Flâneur walk live in
`games/gnome-theft-auto/src/pardonlin/activities.ts`: each has its own spot in town, never appears in the journal and
never counts toward the offer caps above. A later epic that turns one into a QuestDef adds a row here.

## 2. Hobby intros (L66)

Each hobby intro is a Newcomers' Card quest (giver `newcomers-club`) that the story walks the player into:

| hobby | quest | unlocks after | the story row that sends the player near the host |
|---|---|---|---|
| fishing | `nc-bent-pin` | #11 `m11-the-dons-cigars` | New Puddle Marina: the Club's fishing host keeps a bait stall on the canal bank |
| birding | `nc-sky-spotting` | #19 `m19-squall-box-forecast` | Rooster's three barometer fields in Cloverfield; the birding host waits at the last |
| hunting | `nc-tuft-and-tally` | #22 `m22-off-air` | the HOA van in Mossy Wood is a stone's throw from the lodge |
| birding (water birds) | `nc-reedwatch` | #25 `m25-one-leg-to-stand-on` | Wader's Rest sits on the loch edge, beside the Club's reed hide |

Note on #25: the Flock stand on one leg like herons. A reed hide next door is the joke; nobody remarks on it.

## 3. The bubble-mobile series (for E18, L54)

The **Dewdrop** is a clear rolling ball the gnome runs inside, hamster style, built by the Underspanners. It is
unlocked by the last quest of a three-quest series and is buyable only through it (the series ends with Hogweed's
workshop stocking replacements). Giver for all three: **Hogweed Sprocket** (`hogweed`), at his workshop-hammock under
the Unfinished Span; region `underspan`. Hogweed talks fast, is cited for "unauthorised verticality" in #10 and does not
say sorry.

| id | title | unlocks after | objective kinds | reward |
|---|---|---|---|---|
| `sq-dewdrop-1` | The Rolling Prototype | #10 `m10-under-the-span` | `chase-follow`, `visit` | 250 Acorns |
| `sq-dewdrop-2` | Hogweed Rolls Out | #28 `m28-sibling-rivalry` | `steal-deliver` (three parts), `chase-follow` | 350 Acorns, Hogweed's goggles (cosmetic) |
| `sq-dewdrop-3` | Dewdrop | #33 `m33-the-bench-lock` | `checkpoints` (inside the ball), `visit` | the Dewdrop, parked at the workshop (sets `bubbleUnlocked()`) |

**`sq-dewdrop-1` The Rolling Prototype.** Hogweed's first Dewdrop got away while he argued with the Span's warning
signs. It rolls loose along the Skyway verge and down to the canal bank. The player follows in any vehicle (`chase-follow`
with a generous catch-up so it never outruns a mower), and a tap at the end stops it against the bank (`visit`).
Hogweed arrives, out of breath, says nobody was inside it on purpose, and offers Acorns for the trouble. The ball is
empty; it has no seat yet. Plant: the ball is round, clear and bouncy.

**`sq-dewdrop-2` Hogweed Rolls Out.** Hogweed needs three parts nobody in the Underspan will give up: a clear panel
from the Greenhouse Strip, a coil spring from the Compost Heap furnace (Ernie lets it go for a joke about the cold), and a
brass seal-ring from the scrap heap at the Underspan's own back door. Fetch all three (`steal-deliver`, any order).
Then Hogweed rolls the finished ball down the Span ramp with a rope tied to a bumper, and the player drives alongside to
keep the rope taut (`chase-follow`). It bounces twice and stops. Hogweed has a plan for the third.

**`sq-dewdrop-3` Dewdrop.** The player climbs in. The controls are a wheel, a lean and a prayer: the ball is slow to
turn and bounces off kerbs (E18 owns the feel). A ring of hay bales and tyre ramps is laid under the Span; hit the ring of
`checkpoints` in the ball and the gnome stays upright inside while the ball rolls (the pitch is on the ball mesh only).
The last checkpoint is the workshop door (`visit`). Hogweed signs a form that says the Dewdrop belongs to the player. The
form is in the Underspan's own style, handwritten and underlined.

Parked and stored like any ground vehicle; replacements cost 400 Acorns at the workshop (the only place to buy one).

Achievement candidates (for `packages/achievements`): **Roll With It** (finish `sq-dewdrop-3`; reward: a clear
bubble-visor `head` item, reusing a goggle or glass prefab if one fits) and **Hamster Hour** (spend 60 seconds inside the
Dewdrop without leaving it; no reward).

## 4. The chef job (for E18, L30)

- **Employer and place.** **Sage Ladle**, cook and owner of the **Route South Acorn Diner** (`south-highway`, existing
  lore entry `route-south-acorn-diner`), works the pass in the kitchen behind the counter. First shift: the side quest
  `sq-chef-first-shift` (#13). After that the player works from the kitchen's own kiosk any time, like the other sim
  jobs; Sage stays at the pass. If E05's kitchen interior is not ready, the job runs at the window of Gnoma's Food Truck
  by Glaze Clinic Hospital (lore `gnomas-food-truck`); the dishes, orders and levels below do not change.
- **How orders arrive.** A ticket rail along the pass. Tickets slide in from the dining side (the booths, Fence-Post Frank at
  the counter, a coach stop on the highway) as paper slips, each with one to three dishes and a patience bar. The
  player picks a ticket, then cooks each dish in short tap or drag mini-steps (chop, stir, pour, plate, ring the bell),
  then serves it. Rating comes from speed, steps hit and the plate (stars), like the cake in `cooking-gnoma`.
- **Dishes (eight):**
  1. **Acorn-Flour Cake** (Gnoma's recipe, sold here too; the rating-3 test dish)
  2. **Dew-Poached Clover** (a plate of three leaves, quick)
  3. **Grub-Free Root Stew** (slow, the diner's honest soup; "grub-free" is on the menu in capitals and nobody asks)
  4. **Toasted Acorn Toastie** (the lunchtime workhorse)
  5. **Dandelion Fritters** (fiddly, fried)
  6. **Mushroom Coffee** (a drink; steam it, pour it, do not spill)
  7. **Mulch-Bean Chilli** (hot, slow, popular at rush)
  8. **Pie of the Day** (Granny's pie, unlocked after #16, one slice per ticket)
- **Rush hour.** Twice a day (midday and just after dusk) a highway coach pulls in and the rail fills with twelve tickets
  in two minutes. The kitchen gets a second pair of hands (Sage steps in for plating only) and the rush ends with a
  bell Frank rings from his stool. A clean rush earns a bonus of tips.
- **Gnoma as a guest teacher (level 3 shift).** On the first level-3 shift Gnoma parks on the diner's verge, ties on an
  apron and teaches the player her cake in a two-minute guest scene (a tutorial ticket the rail does not time). Afterwards
  the cake dish gets her recipe's extra star and she is a cooking contact at the Food Truck window. She stays friendly
  with Sage, mildly in contest with Chirp & Crumb; no part of this answers where she gets the flour.
- **Levels and pay.** Five levels, shared career stats with the other jobs (`jobs/career.ts`). Suggested pay per served
  ticket, in Acorns: level 1 Dishwasher 8, level 2 Line Cook 11, level 3 Fry Cook 15, level 4 Sous 20, level 5 Head Cook 26,
  plus tips of 0-6 per star over the third. A shift is 8 tickets. A five-star shift at level 5 pays about 260 Acorns.
  Unlocked dishes: levels 1 cake and clover, 2 stew and toastie, 3 fritters and coffee, 4 chilli, 5 pie. Achievement
  candidate: **Five Stars** (a five-star rush) with the chef hat as `uniform` reward.

## 5. Cap check

Lead's note: eight existing tutorials and city contracts (`nc-strike-a-pose`, `nc-mind-the-verges`, `city-impound-run`,
`nc-odd-jobs`, `nc-skyway`, `sq-mulch-pyramid`, `city-glow-band-express`, `nc-take-off`) were moved back to (or near)
their original story beats, because their premises depend on those beats (the impound follows the break-in, flying must
come before #46, the Mulch Pyramid ends at Side-Valve before it is seized). At a few rows this puts more offers on the
board than the cap; the four-row offer window and the Later shelf above carry the overflow. The table below was computed
before that move and is indicative only; E18 recomputes it from `SIDE_UNLOCKS` once built.

The count is the number of side quests offered at a row: unlocked in that row or in the three rows before it, assuming the
player takes none. Every row from 1 to 70 stays at or under its cap (checked for all 70 rows, not only these).

| after row | offers open (count) | cap in force | which |
|---|---|---|---|
| 1 | 2 | 3 | `sq-grid-truthers`, `nc-good-neighbour` |
| 5 | 2 | 3 | `nc-wheel-and-kit`, `sq-hyssop-stairwell` |
| 10 | 3 | 3 | `sq-levelright-night-shift`, `sq-big-lou-embargo`, `sq-dewdrop-1` |
| 15 | 3 | 3 | `sq-chef-first-shift`, `sq-court-regulars`, `sq-gutter-bowls-sessions` |
| 20 | 4 | 4 | `nc-lockup`, `city-kerbside-rounds`, `sq-castaway-drydock`, `nc-sky-spotting` |
| 25 | 4 | 4 | `city-penthouse-exclusive`, `nc-tuft-and-tally`, `sq-fescue-fugitive`, `sq-burrow-post` |
| 30 | 4 | 4 | `sq-flock-errands`, `sq-dewdrop-2`, `sq-hedgeworth-lost-balls`, `race-rookie-mowdown` |
| 35 | 3 | 4 | `nc-hangar-and-boathouse`, `sq-dewdrop-3`, `nc-party` |
| 40 | 5 | 6 | `nc-strike-a-pose`, `sq-snowdrop-sled-trials`, `sq-pail-pond-lines`, `nc-odd-jobs`, `TESSIE.questId` |
| 45 | 5 | 6 | `sq-pinwheel-linemen`, `race-lowrider-derby`, `sq-rutbottom-heats`, `coast-spokewheel-gondola`, `coast-boardwalk-tubing` |
| 50 | 5 | 6 | `sq-rootwell-lost-essay`, `sq-anthill-rent`, `sq-hedgeworth-pro-lesson`, `sq-loamdeep-lamps`, `sq-hedgeworth-ninth-green` |
| 55 | 5 | 6 | `sq-hedgeworth-members-cup`, `sq-flock-vigil`, `race-snail-endurance`, `nc-take-off`, `sq-hoa-audit` |
| 60 | 5 | 6 | `race-fizz-cup-final`, `sq-underspan-scrap-run`, `nc-skyway`, `sq-weeping-line`, `sq-hum-at-three` |
| 65 | 3 | 6 | `nc-mind-the-verges`, `city-glow-band-express`, `sq-mulch-pyramid` |
| 70 | 1 | 6 | `city-impound-run` |
