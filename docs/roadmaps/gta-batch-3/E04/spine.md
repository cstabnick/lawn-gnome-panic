# E04 spine: the fixed contract for every E04 writing issue

Written by the E04 lead. Every E04 issue (outline acts, character bible, direction notes, schedule, world changes, lore
entries) copies names, ids, numbers and homes **from this file**. Do not rename anything here; if a row seems wrong,
write the issue's text so it still fits and say so in your report.

Game: `games/gnome-theft-auto` (Turfton; lore setting `apocrypha`). Canon rules that bind every line: gnomes are fired
clay, they chip, crack and are glued; nothing bleeds (R-021); nobody ever sees or hears a Tall One; no pop-culture
references beyond the GTA parody itself; dry humour; garden objects at gnome scale with gnome names; gnome first names
are plants, surnames soil/tools/household things, at most one pun per name.

Coordinates convention (E01): +z is south, -z is north, +x east, -x west. Old map is +-900; the new bands sit outside it.

## 1. New areas: final names (E04 owns names, E01 owns geometry)

| E01 slot / band (placeholder) | Final name | Region tag (for the outline) | One line |
|---|---|---|---|
| band `south-shore` (z 900..1400) | **Saltbucket Shore** | `saltbucket-shore` | The seaside past the dunes south of the Puddle Sea: sand, a bucket-and-spade town, the open sea. |
| ocean water marker | **the Saltwater** | (part of Saltbucket Shore) | The sea. Salty, with real swell. Gnomes who have not seen it do not believe in it. |
| boardwalk (0,1140) | **Saltbucket Boardwalk** with **Long Spoon Pier** | `saltbucket-shore` | Planks, stalls, candyfloss, tube and ski rental, a pier made from a giant Tall-One spoon. |
| ferris-wheel | **the Spokewheel** | `saltbucket-shore` | A Tall-One bicycle wheel stood on end and fitted with teacup gondolas. |
| pirate-ship | **the Bathtub Queen** | `saltbucket-shore` | A Tall-One toy pirate ship, sea-going now, crewed by Captain Samphire Bilge. |
| band `east-campus`, campus (1130,-180) | **Rootwell University** | `rootwell` | Turfton's research university: twelve buildings round a quad (E13 names the buildings from E04's campus entry). |
| observatory-mound (1240,140) | **the Anthill** and **the Anthill Observatory** | `rootwell` | A giant ant mound with the observatory on its flat summit and a drive-off ramp, **Dean's Leap**. The ants still live inside and are the landlords. |
| runway-2 (1300,600) | **Rootwell Field** | `rootwell` | The university's airstrip (aeronautics department). |
| dirt-track (1150,-620) | **Rutbottom Dirt Bowl** | `rutbottom` | A bumpy dirt oval with big banked turns; the Carburettors' summer home. |
| band `north-highlands` (z -1400..-900) | **Snowcap Rise** | `snowcap-rise` | The high country north of Frostbite Fells. |
| ski-hill (-350,-1120) | **Snowdrop Slope** with **the Woolly Sock Lodge** | `snowcap-rise` | The ski hill, rope tow, sledding run and lodge. |
| ice-lake (-640,-1030) | **Pail Pond** | `snowcap-rise` | A frozen lake (a sunk Tall-One pail): ice fishing huts, polar bears that are very relaxed. |
| toadstool-forest (250,-1150) | **Capwood** | `capwood` | A forest of giant toadstools grown over a buried Tall-One woodpile. |
| rally-route | **the Capwood Run** | `capwood` | The rally route: Frostbite Fells, up the mountain, through Capwood, across fords of Cap-water (won't waterlog a mower). |
| wind-farm (850,-1180) | **Pinwheel Ridge** | `pinwheel-ridge` | A ridge of giant garden pinwheels that make Turfton's electricity. |
| band `west-estates` (x -1400..-900) | **Trellisdown** | `trellisdown` | Old-money hill country west of Mossy Wood. |
| vineyard, mansion (-1150,-120)/(-1230,-120) | **Trellisdown Vineyard** and **Brassknock Manor** | `trellisdown` | Vines on a trellis hill; the Brassknock family's manor. They press **grape-dew**. |
| cult-camp (-1130,-640) | **Wader's Rest** (camp of **the Flock of the One Leg**) | `waders-rest` | A reedy camp near the loch where the Flock stand on one leg before a giant pink plastic flamingo, **the Standing Lady**. |
| mole-entrance (-1000,360) | **the Burrow Door** | `loamdeep` | A mound with a round door at the west edge of Mossy Wood; the way down. |
| mole halls (E05 interior / cell) | **Loamdeep** | `loamdeep` | The moles' underground town of halls and tunnels; its people are **the Burrowfolk**. |
| golf-yard (-1180,620), breach (-895,640) | **Hedgeworth** (the neighbour's garden), **Hedgeworth Links**, **the Hedgeworth Clubhouse**, breach = **the Kicked Board** | `hedgeworth` | Another Tall One's garden behind a loose fence board: big hedges, tall grass, a nine-hole course. |
| skyway-society (under the Unfinished Span) | **the Underspan**, home of **the Underspanners** | `underspan` | A brilliant, radical commune of inventors living in the shade under the Skyway's Unfinished Span. |
| construction-1..3 | **Thorne Even-Estates** (built by **Levelright Construction**) | `turfton-fringe` | Vesper's HOA-approved beige housing, going up on three fringe sites. |
| downtown park (3 blocks incl. Gnorwin Statue Park) | **Founders' Green** | `downtown` | The new park, opened after the tribunal (#15) when Juniper rezones Vesper's condemned blocks. |
| mega block (90,-90)+(150,-90) + tunnel | **the Double Pot** and **the Double Pot Tunnel** | `downtown` | Thorne Lawn & Order's 2x1 tower over the street: the Even-Estates sales floor. Walkable roof. |
| court (-90,-150) | **Drainpipe Court** | `downtown` | Public basketball court; the hoop is bolted to a drainpipe. |
| skate-park (-150,-90) | **the Gutter Bowls** | `downtown` | Public skate park made from old Tall-One roof gutters. |
| player apartment (downtown apartment block) | **Saucer Court**, flat 3B | `downtown` | The player's loaned flat (#2), in a block built round a giant saucer courtyard. |
| player farm (E16) | **Windfall Croft** | `cloverfield` | The farm the player can buy (E16). |
| chef job kitchen (E18) | **Route South Acorn Diner** kitchen (existing diner) | `south-highway` | Chef job employer: the diner's cook, Sage Ladle. |
| bubble-mobile (E18) | **the Dewdrop** | `underspan` | A clear rolling ball the gnome runs inside, built by the Underspanners. |

Existing region tags (use these too): `downtown`, `patio-heights`, `turfton-fringe` (ring road, construction sites,
Compost Heap), `underspan` (Skyway and under it), `canal` (Southern Drainage Canal, New Puddle, the Puddle Sea),
`south-highway` (diner, welcome sign), `cloverfield`, `mossy-wood` (incl. the Unmowed Hollow, Tall House porch, the
Fence gap), `loch-moss`, `tallgrass-commons`, `frostbite-fells`, `dust-flats` (overlook, airfield, Fort Sandpit),
`pebblewick`, `speedway` (Lost & Found Speedway). `wilds` = a quest that tours several regions.

## 2. The story in one paragraph, and the four acts

The question of the whole game: **will Turfton stay crooked, loud and alive, or be mown even?** Vesper Thorne (porcelain,
HOA chair) is building **the Grand Combine**, a city-sized harvester patterned on Fescue's Mower, to mow every yard to
one beige height. It needs a Golden Acorn as its ignition core. New in batch 3: the Combine is too big to build in one
place, so it is built **in four parts at the edges of the map**, and the act III journey is the player finding each part
and an ally in each new place: the **cutting deck** is tested at Hedgeworth Links, the **guidance** (the "Even Line",
computed from the stars) comes from the Anthill Observatory at Rootwell, the **power** is stolen from Pinwheel Ridge, and
the **money** comes from Countess Wisteria Brassknock of Trellisdown, old money that has quietly funded the HOA for
years. The Flock of the One Leg prophesied the Even Cut and know its date. The moles of Loamdeep, whom every gnome
misreads as pests, are the allies who dig the crew into Fort Sandpit in act IV.

| Act | Rows | Title | Dramatic question | Tension start -> end | Where |
|---|---|---|---|---|---|
| I | 1-15 | **Fresh Glaze** | Can the player pay their way out, and where do they live? | 3 -> 6 | Turfton (downtown, Patio Heights, the fringe, the Underspan, the canal) plus the first contract's tour |
| II | 16-35 | **Turf & Dew** | Will the player take Vesper's deal, and who is paying for his war? | 4 -> 9 | Cloverfield, Mossy Wood, Loch Moss, Tallgrass, first reaches to Trellisdown, Loamdeep, Wader's Rest, Hedgeworth; ends with the Salvage Raid |
| III | 36-53 | **Cold Clay, Far Edges** | Can a broken crew find friends at the edges before the Combine is finished? | 4 -> 8 | Frostbite Fells, Snowcap Rise, Capwood, Pinwheel Ridge, Rutbottom, Saltbucket Shore, Rootwell, Hedgeworth, Loamdeep, Trellisdown, Wader's Rest |
| IV | 54-70 | **Sandpit Protocol / The Even Cut** | Can a coalition of outcasts take a fort and stop a god-machine, and what will Turfton be? | 6 -> 10 -> 2 | Dust Flats, Fort Sandpit, Pebblewick, the Underspan, Turfton, the finale on the meridian |

Act turns are extended quests: #15 (I->II), #35 (II->III), #46 (mid III), #52 (III->IV), #64 (mid IV), #70 (finale).

## 3. Rules every outline row follows

- **Ids.** Kept quests keep their old id. New quests: `m<NN>-<slug>` (NN = row number, two digits). Extended quests:
  the row's id is the quest a save records as finished (the **final part**); the earlier parts are separate QuestDefs
  `<row id>-p1`, `<row id>-p2`, ... offered as a chain before it. So old saves that finished a kept extended quest stay
  finished.
- **Prereqs.** Each row's prereq is the row before it, except where the table says otherwise. A part `-p1`'s prereq is
  the previous row; `-p2` needs `-p1`; the final part needs the last `-pN`. Old saves: a kept quest that is already done
  stays done; inserted runs simply appear as catch-up quests because each run hangs off a quest the old save has.
  Nothing hides or resets. `ch5-even-cut` keeps its id and is row 70.
- **Status values:** `keep` (renumber only), `rewrite` (same id, the row says what changes), `new`, `extended`
  (multi-part; `extended (rewrite)` for a kept id).
- **Story is single-player** (as today): no `@lawn/mp` work in any story quest. Every beat must play by touch.
- **World use (L83):** no more than 2 consecutive rows in one region tag; every act visits at least 3 regions; every new
  area gets at least one main quest (below) and one side quest (side-quest schedule).
- **Context (L04):** every quest's intro or comms step 0 says who is asking, what they want, where, why now and what
  the player gets, in the speaker's voice; journal gets a one-line "Previously"; nothing depends on a skipped scene.
- **Objective kinds that exist:** `crack`, `visit`, `steal-deliver`, `chase-follow`, `convoy-ambush`, `air-drop`,
  `survive-derby`, `boss-combine`, `choice`, `race`, `checkpoints`, `probe`, `tessie-*`. Anything else is written
  `needs new kind: <name> (<owner epic>)`: the expected ones are `golf-hole` (E15), `jam-game` (basketball, E19),
  `skate-line` (E19), `ski-run` (E12), `tow-ski` (water-ski, E11), `ride-passenger` (Spokewheel, E11), `dig` (moles,
  E17), `interior-visit` (E05 `interior:` gate), `roof-land` (helicopter on a roof, E05), `farm-task` (E16).

## 4. The 70 rows (skeleton; the act issues expand each into the full table)

Columns here: `# | id | title | status | old id | giver (place) | region | prereq | cast | premise`.
Prereq "prev" = the row above.

### Act I: Fresh Glaze (1-15)

| # | id | title | status | old id | giver (place) | region | prereq | cast | premise |
|---|---|---|---|---|---|---|---|---|---|
| 1 | prologue-fresh-kiln | Fresh Out the Kiln | keep | prologue-fresh-kiln | Pip (Central Bus Stop) | downtown | none | pip, tansy, turncoat-cam, bodega | As today: Pip's botched mower-jacking, meeting Tansy at Side-Valve Salvage, the glowing Golden Acorn in the crate. |
| 2 | m02-roof-on-credit | A Roof on Credit | new | | Pip (Side-Valve Salvage) | downtown | prologue-fresh-kiln | pip, parsley, hyssop, mabel | Pip won't share his bench. Mabel's cab to the First Kiln Bank; loan officer Parsley Inkpot adds 1,500 Acorns to the Kiln-Debt for flat 3B at Saucer Court (L21). Move in; meet the nosy neighbour Hyssop Doormat. Home unlocked (E10 apartment). |
| 3 | first-contract | First Contract | keep | first-contract | Don Compost (Mulch Club) | wilds | m02-roof-on-credit | don-compost, pip | As today: crack Dibbler, Gravelbottom and Spadewell across three biomes for the Kiln-Debt. Briefing now mentions the new loan. |
| 4 | ch1-mowers-keepers | Mower's Keepers | keep | ch1-mowers-keepers | Tansy (Side-Valve Salvage) | downtown | first-contract | tansy, pip, turncoat-cam, vesper (named) | As today: three clamped bikes, the eviction notice on Tansy's door. |
| 5 | m05-sweepers-wages | Sweeper's Wages | new | | Turncoat Cam (Side-Valve Salvage) | underspan | prev | turncoat-cam, lulu, tansy | Cam asks the player to run a part to the Carburettors' night meet on the Skyway. Lugnut Lulu wins a race in front of him; Cam stares at her charter plate (plants his motive). Night. |
| 6 | ch1-two-coat-tail | Two-Coat Tail | keep | ch1-two-coat-tail | Juniper (City Hall) | patio-heights | prev | juniper, mayor-mulch, mabel, vesper, reginald | As today: tail the Mayor, Vesper met. |
| 7 | m07-even-estates | Even-Estates | new | | Juniper (City Hall steps) | turfton-fringe | prev | juniper, chard, reginald | Juniper wants proof of where the median money goes. Drive her to a fringe site where Levelright Construction builds Thorne Even-Estates; photograph the permits (Reginald's signature), crack the night-watch, then drop Juniper at her terrace on Kerb Row (L58 drop-off). |
| 8 | ch1-tax-break-in | The Glaze & Tax Break-In | keep | ch1-tax-break-in | Tansy (Side-Valve Salvage) | downtown | prev | tansy, pip | As today: the deed, and the Grand Combine blueprint. |
| 9 | m09-where-asphalt-sleeps | Where Asphalt Sleeps | new | | John Bodega (Bodega & Sons) | downtown | prev | bodega, fennel, pip | Light relief: Asphalt the cat has gone missing with the bottlecap. Follow sightings to the Gutter Bowls, where skater Fennel Gripwax has been feeding her. Skate one line to get the cap back (needs new kind: skate-line, or a `checkpoints` fallback on foot). Drop Asphalt home above the shop. |
| 10 | m10-under-the-span | Under the Span | new | | Pip (Side-Valve Salvage) | underspan | prev | pip, hogweed, grout | Pip needs a radio jammer for a plan he will not explain. The Underspanners under the Unfinished Span build anything for scrap; Hogweed Sprocket trades a jammer for three salvage parts. Plants: the Dewdrop prototype rolling past; Hogweed's citation for "unauthorised verticality" (the Whirligig plant); Pip dodges a Fescue question. |
| 11 | m11-the-dons-cigars | The Don's Cigars | new | | Don Compost (Mulch Club) | canal | prev | don-compost, big-lou, brenda | Two taps: the HOA cites the Don's acorn-cigar boats at New Puddle Marina. Collect the crates past Brenda's toll and an HOA inspection, deliver to the Mulch Club's back door, where Big Lou checks your hat. Shows the Don and Vesper are at war too. |
| 12 | m12-quarter-inch-at-home | Quarter-Inch at Home | new | | Juniper (her terrace, Kerb Row) | patio-heights | prev | juniper, reginald, gary | Juniper wants Reginald's calipers swapped for a pair that reads a quarter-inch long. Get past Gate-Guard Gary into Patio Heights, into townhouse 404, where everything is measured; the player sees Reginald's one photograph: him and Juniper as kids. He comes home early: a short, sad, funny exchange. Plants his doubt. |
| 13 | m13-diner-on-route-south | Diner on Route South | new | | Tansy (Side-Valve Salvage) | south-highway | prev | tansy, sage, frank, granny (named) | Tansy sends the player to collect a debt from Sage Ladle, the diner's cook. Sage pays in a meal, not acorns, and needs a hand in the kitchen at the rush (chef-job plant, E18). Fence-Post Frank names Granny Gnertrude, "the only gnome Vesper can't buy." Plants act II. |
| 14 | m14-drainpipe-court | Drainpipe Court | new | | Pip (Drainpipe Court) | downtown | prev | pip, cardoon | Pip lost a bet to court regular Cardoon "Swish" Trowelly and owes him his toolbox. Win it back in a game to 7 (needs new kind: jam-game). After, on the bench, Pip tells the player why he left Fescue: first sincere beat of the game, no gag on top. |
| 15 | ch1-founders-boot | Founder's Boot & The Kangaroo Court | extended (rewrite) | ch1-founders-boot | Tansy (Side-Valve Salvage) | downtown | prev | tansy, pip, hedda, chard, reginald, vesper, juniper | Act I turn. p1 "Parade Permits": Hedda Galley of the Tattler gives the float's keys location; take them from the parade office. p2 "Dress Rehearsal": night test-drive of the Boot float through the Even-Estates site, Levelright's night watch giving chase. Final (existing objectives): the parade and the tribunal. New outro: Juniper uses the tribunal fiasco to rezone Vesper's three condemned blocks as **Founders' Green** (world change W03); Vesper's threat closes the act. |

### Act II: Turf & Dew (16-35)

| # | id | title | status | old id | giver (place) | region | prereq | cast | premise |
|---|---|---|---|---|---|---|---|---|---|
| 16 | ch2-dew-run | Dew Run on Route South | keep | ch2-dew-run | Granny (Cloverfield barn) | cloverfield | ch1-founders-boot | granny, bramble, tansy | As today. The Kiln-Debt from Clay-Mart is cleared; the flat's loan remains (one line). |
| 17 | m17-the-dew-buyer | The Dew Buyer | new | | Granny (Cloverfield barn) | trellisdown | prev | granny, chicory, wisteria (glimpsed) | Some of Granny's stolen-back Dew keeps vanishing west. Follow the tanker (chase-follow) out past Mossy Wood to Trellisdown Vineyard, where gardener Chicory Snips burns it in frost-pots. A glimpse of Countess Wisteria Brassknock on the manor terrace with an HOA clipboard. First reach to the west edge. |
| 18 | ch2-sprinkler-gauntlet | The Cloverfield Sprinkler Gauntlet | keep | ch2-sprinkler-gauntlet | Granny (Cloverfield barn) | cloverfield | prev | granny, bramble, rooster, driftwood, reginald | As today. |
| 19 | m19-squall-box-forecast | The Squall-Box Forecast | new | | Rooster (Squall-Box windmill) | cloverfield | prev | rooster, granny, bramble | Comedy after the gauntlet. Rooster needs his three barometers moved before "the porcelain front" arrives. Drive them to three fields; the last reading predicts "a white hat at the diner" (Vesper's offer next). |
| 20 | ch2-vespers-offer | Order Over Chaos | keep | ch2-vespers-offer | Granny (Cloverfield barn) | south-highway | prev | vesper, granny | As today, at the Route South Acorn Diner (Sage behind the counter, silent). |
| 21 | m21-penthouse-viewing | Penthouse Viewing | new | | Vesper (his card; Thorne Tower lobby) | patio-heights | prev | vesper, turncoat-cam, gary | Vesper's card invites the player to view the promised penthouse in the newly topped-out Double Pot. A tour of Vesper's world: beige, even, silent. The player sees Cam parking cars at the Patio Gate in an HOA vest. Vesper flinches from a lantern. `choice`: pocket the key or leave it on the table (cosmetic consequence only). |
| 22 | m22-off-air | Off Air | new | | Sorrel (her radio booth, by call) | mossy-wood | prev | sorrel, pip | Sorrel Tillbrook calls (as the old "break west" call): her tapes of the Fence-gap rain have been confiscated by the HOA as "unlicensed weather". Recover them from an HOA van in Mossy Wood and bring them to her booth; she plays one on air and asks the player to meet the Elder. |
| 23 | ch2-unmowed-tablet | The Cracked Tablet | rewrite | ch2-unmowed-tablet | Elder Bracken (Unmowed Hollow) | mossy-wood | prev | bracken, sorrel, pip, turncoat-cam | As today, except: Cam's tin-can call to Vesper moves out of this outro to #34's outro; the outro now ends on the tablet and Pip's silence. |
| 24 | m24-the-burrow-door | The Burrow Door | new | | Sorrel (her booth) | loamdeep | prev | nubbin, tumblesoil, sorrel, dj-moleman (voice) | A small lost mole, Nubbin, is being chased through Mossy Wood by gnomes with spades who think moles eat roots. Drive him home to the Burrow Door at the west edge of the wood. Old Mother Tumblesoil thanks the player at the door; DJ Moleman's set thumps up through the floor. First reach to Loamdeep. |
| 25 | m25-one-leg-to-stand-on | One Leg to Stand On | new | | Driftwood (his trailer, by call) | waders-rest | prev | driftwood, saxifrage | Driftwood's raft has been "borrowed" by the Flock of the One Leg. At Wader's Rest by the loch, Mother Saxifrage Wader returns it if the player stands on one leg through a sermon (a `probe` or short hold objective). Her sermon names "the Even Cut, on the longest day". Funny, a little ominous. First reach to Wader's Rest. |
| 26 | m26-the-knot-hole | The Knot-Hole | new | | Pip (Side-Valve Salvage) | mossy-wood | prev | pip, sorrel | Pip, still stung by the Elder, asks to be driven to the Fence gap where Sorrel records the rain. Through the knot-hole he looks at Fescue for the first time in years. He opens the vial of Fescue soil and does not pour it. Sincere; the drive back has the laugh. |
| 27 | m27-heap-of-trouble | Heap of Trouble | new | | Ash-Shovel Ernie (Compost Heap) | turfton-fringe | prev | ernie, tansy | Ernie, who stokes the Compost Heap furnace, says the welded plates are leaving at night in four directions. Follow one convoy (chase-follow) up the Ring Road north until it vanishes toward Snowcap Rise; crack its escort. The parts are going to the edges (act III's map, planted). |
| 28 | m28-sibling-rivalry | Sibling Rivalry | new | | Juniper (City Hall) | downtown | prev | juniper, reginald, hedda | Juniper brings the Even-Estates permits to the Tattler; Hedda will print them if Reginald confirms. Escort Reginald from his office to the Tattler Building through HOA watchers. He does not confirm; he corrects the spelling. Juniper laughs for the first time. |
| 29 | m29-the-kicked-board | The Kicked Board | new | | Fence-Post Frank (welcome sign) | hedgeworth | prev | frank, thrift, peony (glimpsed) | Frank has heard golf balls landing on Tallgrass Commons from over the fence. Drive the fence line to the Kicked Board, a loose board into the neighbour's garden, Hedgeworth. Groundskeeper Thrift Hosepipe chases the player off for "walking on wet fairway". First reach to Hedgeworth. |
| 30 | m30-cams-big-night | Cam's Big Night | new | | Turncoat Cam (Side-Valve Salvage) | speedway | prev | turncoat-cam, lulu, tansy | Cam has saved for one race at the Lost & Found Speedway. The player is his pit crew (race, player drives the support run or a co-driver leg). He loses badly; Lulu laughs. On the way home a man in a beige vest hands Cam a racing-charter envelope. The player sees it, does not understand it. |
| 31 | m31-granny-cracks | Granny Cracks | new | | Bramble (Granny's farmhouse) | cloverfield | prev | granny, bramble, midge | HOA bailiffs chipped Granny at a foreclosure. Drive her, gently (damage limit), from her farmhouse to the Glaze Clinic (L58 pickup at home). Squeaky-Clean Midge glues her. Granny, scared for the first time, tells the player about her late husband's acorn silo. |
| 32 | m32-driftwoods-chart | Driftwood's Chart | new | | Driftwood (Driftwood's trailer) | canal | prev | driftwood, brenda | Driftwood's chart says the canal does not end at the Puddle Sea: past the dunes is "the Saltwater". Tow his raft through New Puddle (Brenda's toll) to the dune line; he sees the sea's glow and cannot cross yet. Plants Saltbucket Shore. |
| 33 | m33-the-bench-lock | The Bench Lock | new | | Tansy (Side-Valve Salvage) | underspan | prev | tansy, hogweed, turncoat-cam | Tansy wants a proper lock for the bench where the Golden Acorn sleeps. Hogweed builds it; deliver it; Cam is the one who watches the code being set. |
| 34 | m34-forty-seven-wrenches | Forty-Seven Wrenches | new | | Pip (Side-Valve Salvage) | downtown | prev | tansy, pip, granny, juniper, bodega, turncoat-cam | The crew's high point: Tansy's bay throws a party for the rezoned Green. Fetch guests (Granny from her farmhouse, Juniper from Kerb Row, Bodega from the shop: L58 pickups). Tansy tells the forty-eighth wrench story. Outro (moved from #23): Cam's tin-can call, "Tuesday. The charter's mine." |
| 35 | ch3-salvage-raid | The Salvage Raid | extended (rewrite) | ch3-salvage-raid | Tansy (Side-Valve Salvage) | downtown | prev | tansy, pip, turncoat-cam, vesper, loam (call) | Act II turn. p1 "Tuesday": Cam does not come in; trail his route to the Patio Gate and see the HOA vans massing; race back. p2 "Hold the Bay": hold Side-Valve (survive-derby) while Pip and Tansy load the crate; the bench lock is opened with Cam's code; Pip's arm cracks off. Final (existing objectives): crack Cam and the raiders, flee north via the Ring Road. Side-Valve is seized (W08). Pip moves onto the player's couch after #36 (W09). |

### Act III: Cold Clay, Far Edges (36-53)

| # | id | title | status | old id | giver (place) | region | prereq | cast | premise |
|---|---|---|---|---|---|---|---|---|---|
| 36 | ch3-kiln-resin-ice | Kiln-Resin & Black Ice | rewrite | ch3-kiln-resin-ice | Father Loam (Frozen Birdbath Basin) | frostbite-fells | ch3-salvage-raid | pip, loam, theo, shelldon (snail) | As today, except the snail's scroll from Tansy now reads that Vesper builds the Combine in parts "out at the edges" and the crew must find friends there; the Dust Flats line moves to #53. |
| 37 | m37-snowdrop-slope | Snowdrop Slope | new | | Thermos Theo (his camp) | snowcap-rise | prev | gentian, pip, theo | Hiding out: Theo sends the crew up to Gentian Bootlace's Woolly Sock Lodge. HOA salt-plows follow; ski (or sled) down Snowdrop Slope to lose them (needs new kind: ski-run, fallback `checkpoints`). Gentian gives shelter and a bunk (the crew's act III base). |
| 38 | m38-pail-pond | Pail Pond | new | | Gentian (Woolly Sock Lodge) | snowcap-rise | prev | theo, gentian, pip | Ice fishing on Pail Pond with Theo, past very relaxed polar bears, for an HOA radio dropped through the ice. Dried out, it gives the four parts of the Grand Combine and where they are: deck at Hedgeworth, guidance at Rootwell, power at Pinwheel Ridge, money at Trellisdown. The act's map. |
| 39 | m39-couch-surfing | Couch Surfing | new | | Pip (Saucer Court, by call) | downtown | prev | pip, hyssop, tansy, sal | Back into Turfton in disguise. Pip moves onto the player's couch at Saucer Court (L58); Hyssop Doormat is suspicious. Tansy surfaces in the Under-Deck culvert with Silt-Diver Sal: the crew regroups and splits the four parts. Warm, funny. |
| 40 | m40-the-capwood-run | The Capwood Run | new | | Lugnut Lulu (Capwood Run start) | capwood | prev | lulu, chanterelle, pip | Lulu and the loyal Carburettors refuse the HOA charter. She will help the crew if the player wins the Capwood Run: Frostbite Fells, up the mountain, through the toadstools, across the Cap-water fords (race/checkpoints). Warden Chanterelle Stook fines everyone for "bruising the caps". The Carburettors finally get their own scene. |
| 41 | m41-pinwheel-ridge | Pinwheel Ridge | new | | Ragwort Coilspring (Pinwheel Ridge) | pinwheel-ridge | prev | ragwort, lulu | The HOA has re-cabled Pinwheel Ridge to charge the Combine's cells. Engineer Ragwort Coilspring shows the player which three pinwheels to free; crack the HOA linemen; Turfton's lights flicker back (W10). Part 1 of 4 (power) cut. |
| 42 | m42-rutbottom-impound | Rutbottom Impound | new | | Lulu (Rutbottom Dirt Bowl) | rutbottom | prev | lulu, clary | The HOA impounded Carburettor rides at the Rutbottom Dirt Bowl. Marshal Clary Mudguard lets the player race for them on the bumpy oval with a dirt bike (race, E14). Win: the rides come back, the player keeps the dirt bike, the Carburettors are in. |
| 43 | m43-saltbucket-boardwalk | Saltbucket Boardwalk | new | | Driftwood (by call, from the shore) | saltbucket-shore | prev | driftwood, marram | Sincere payoff: Driftwood made it to the Saltwater and runs a tube hut on Saltbucket Boardwalk. Ride the Spokewheel with Marram Teaspoon to spot HOA barges at sea (needs new kind: ride-passenger, E11), then a tubing or water-ski run out to read their markings (needs new kind: tow-ski). |
| 44 | m44-the-bathtub-queen | The Bathtub Queen | new | | Captain Samphire Bilge (Long Spoon Pier) | saltbucket-shore | prev | samphire, driftwood | Captain Bilge runs pirate tours and real smuggling. Board an HOA barge from a boat (steal-deliver) and take its cargo, the Combine's spare blades, to the Bathtub Queen. Bilge joins: the crew has a sea route. |
| 45 | m45-rootwell-admissions | Rootwell Admissions | new | | Professor Betony Sextant (Rootwell, by letter) | rootwell | prev | betony, lovage | The guidance part: Professor Sextant's star survey of a perfectly level line was stolen for the Combine. Enrol as a "mature student" (visit, interior-visit), avoid Dean Lovage Inkwell, find Sextant in the library, and learn the lens is in the Anthill Observatory. |
| 46 | m46-starfall-at-the-anthill | Starfall at the Anthill | extended | | Professor Sextant (Rootwell library) | rootwell | prev | betony, lovage, pip, wally (radio) | Mid-act III. p1 "Night Class": cross campus at night to the Anthill's base. p2 "The Sugar Toll": the ants want rent; steal sugar from the refectory and pay it. p3 "The Lens": inside the observatory, crack the HOA technicians, take the guidance lens. Final "Dean's Leap": drive off the ramp, land, reach Rootwell Field and fly out (Wally on the radio). Part 2 of 4 (guidance) taken. |
| 47 | m47-hedgeworth-links | Hedgeworth Links | new | | Dame Peony Gravelrake (Hedgeworth Clubhouse) | hedgeworth | prev | peony, basil, thrift | The deck part is to be tested on Hedgeworth Links: Vesper holds the course's mortgage. Dame Peony will not hear a word against him until the player beats her pro, Basil Divot, at one hole (needs new kind: golf-hole). She lets the crew in. |
| 48 | m48-the-groundskeepers-secret | The Groundskeeper's Secret | new | | Thrift Hosepipe (his shed) | hedgeworth | prev | thrift, basil, nubbin, tumblesoil | Thrift has been sheltering moles under the ninth green; Basil Divot has hated moles since one moved his ball in a final. Get the moles out before Basil's trap; then show Basil the mole who moved the ball (it was saving it from a sprinkler). Basil softens. Leads down to Loamdeep. |
| 49 | m49-loamdeep | Loamdeep | new | | Old Mother Tumblesoil (the Burrow Door) | loamdeep | prev | tumblesoil, nubbin, dj-moleman | Down in the halls: three mole jobs (deliver roots, light the lamps, sort the post; needs new kind: dig, or E17's mole job API). DJ Moleman plays one track in person. The Burrowfolk agree to help: "we dig where we are asked, and nobody ever asks." |
| 50 | m50-trellisdown-tasting | Trellisdown Tasting | new | | Juniper (by call) | trellisdown | prev | wisteria, chicory, vesper, juniper (call) | The money part. Countess Wisteria Brassknock holds a grape-dew tasting for the Combine's backers. Get in as a waiter (interior-visit, Brassknock Manor), photograph the ledger, slip out past Chicory. Vesper is there; he and the player share one frame for the first time. |
| 51 | m51-the-flock-stands | The Flock Stands | new | | Mother Saxifrage Wader (Wader's Rest) | waders-rest | prev | saxifrage | The Flock plan to stand in the Combine's path at Hedgeworth on "the longest day" (the test). Talk them round: move the Standing Lady to safety on a flatbed while the Flock follow on one leg (steal-deliver, slow). They give the test date. Gentle, funny. |
| 52 | m52-the-test-cut | The Test Cut | extended | | Dame Peony (Hedgeworth Clubhouse) | hedgeworth | prev | peony, basil, thrift, wisteria, vesper, tumblesoil, pip, tansy | Act III turn. p1 "Tee Time": caddy at the backers' gala; Vesper and the Countess on the terrace. p2 "Mow Line": the Grand Combine wakes and cuts a test line; evacuate Peony, Basil, Thrift and the mole families ahead of it. p3 "Against the Deck": attack it with everything; nothing works. Final "Through the Hedge": escape through the hedge as Vesper broadcasts the date of the Even Cut over Turfton. Hedgeworth keeps a mown scar (W14). |
| 53 | ch3-tundra-drift-run | Volatile on Ice | rewrite | ch3-tundra-drift-run | Father Loam (Frozen Birdbath Basin) | frostbite-fells | prev | loam, bracken, tansy, pip | As today (the drift run to the Dust Flats overlook) but motivated by #52: Bracken lends the Stopping Stone ("the only thing that ever stopped one"), and Tansy's ridge call sends the crew to the Dust Flats for air power. |

### Act IV: Sandpit Protocol / The Even Cut (54-70)

| # | id | title | status | old id | giver (place) | region | prereq | cast | premise |
|---|---|---|---|---|---|---|---|---|---|
| 54 | m54-the-heist-board | The Heist Board | new | | Tansy (Dust Flats overlook safehouse) | dust-flats | ch3-tundra-drift-run | tansy, pip, wally | Tansy pins the plan on a board: air superiority means the Whirligig at Fort Sandpit. Scout the fort's three sides from the overlook (visit, probe), then fetch Wind-Sock Wally from the airfield apron. Pip says "Okay, hear me out" and Tansy lets him. |
| 55 | ch4-runway-flares | Runway Flares | keep | ch4-runway-flares | Tansy (Dust Flats overlook) | dust-flats | prev | wally, diggs (named), bracken | As today. |
| 56 | m56-mortar-for-a-mower | A Mortar for a Mower | new | | Hogweed (by call) | underspan | prev | hogweed, pip | Fly the Crop Duster back to Turfton to the Underspan, where Hogweed fits a door mortar and a parachute rig that "almost certainly opens". Fly it back to the Dust Flats under the Hat Watch's nose. |
| 57 | ch4-sandpit-drop | The Sandpit Drop | keep | ch4-sandpit-drop | Pip (Dust Flats overlook) | dust-flats | prev | pip, tansy, diggs | As today. |
| 58 | m58-the-reeves-barn | The Reeve's Barn | new | | Reeve Yarrow Potsherd (Pebblewick square) | pebblewick | prev | yarrow, pip | The Whirligig needs hiding. Pebblewick's reeve offers the hay barn if the crew fixes the town's water before the HOA's cut-off; deliver the pump part, park the Whirligig under the hay. |
| 59 | ch4-spade-truce | Nobody Fires the Guard | keep | ch4-spade-truce | Tansy (Dust Flats overlook) | dust-flats | prev | diggs, tansy, granny, bracken | As today. |
| 60 | m60-the-moles-dig | The Moles Dig | new | | Old Mother Tumblesoil (by call) | dust-flats | prev | tumblesoil, nubbin, diggs | Vesper has locked the Spade Guard's armory remotely. The Burrowfolk dig a tunnel under Fort Sandpit; escort the diggers (dig / escort), hold the tunnel mouth, open the armory from below. Diggs meets a mole and salutes it. |
| 61 | m61-diggs-medal | Diggs's Medal | new | | Commander Diggs (his bungalow, Pebblewick) | pebblewick | prev | diggs, yarrow | Diggs's home: a tin bungalow in Pebblewick with fifteen years of guard rosters on the wall. He asks the player to fetch his old medal from the HOA lost-property at the fort gate. Sincere: why he stayed. |
| 62 | m62-cams-cell | Cam's Cell | new | | Juniper (by call) | downtown | prev | turncoat-cam, juniper, vesper (voice) | Vesper cancelled Cam's charter and locked him in the HOA lockup in the Double Pot. Get in through the Double Pot Tunnel; Cam has the Combine's PA code and route. `choice`: free him or leave him for the Watch (both give the code; ending epilogue line differs). |
| 63 | m63-four-taps | Four Taps | new | | Don Compost (Mulch Club) | downtown | prev | don-compost, big-lou, mayor-mulch | The Don taps four times, which nobody has seen. He lends the Mulch Club's crews and money to the coalition; the price is that the Mayor must be brought to sign the emergency counter-order. Fetch the Mayor from his villa in Patio Heights (L58 pickup). |
| 64 | m64-all-hats | All Hats | extended | | Tansy (Dust Flats overlook) | wilds | prev | samphire, brenda, wally, hogweed, lulu, bracken, tumblesoil, granny, diggs | Mid-act IV: the coalition. p1 "By Water": bring the Bathtub Queen up the canal; Brenda opens New Puddle. p2 "By Air": Wally and the Underspanners at the airfield. p3 "By Road": convoy the Carburettors from Rutbottom to the overlook. Final "By Root": the Unmowed, the Burrowfolk, the Spade Guard and Granny (with pie) at the overlook camp (W16). Each cap on one table. |
| 65 | m65-the-countess-relents | The Countess Relents | new | | Countess Wisteria (Brassknock Manor) | trellisdown | prev | wisteria, chicory | The Countess learns the Even Line runs through her vines too. She gives the crew the key to the Combine's shield grates, in exchange for the player driving her prized first vine to safety (steal-deliver, fragile). |
| 66 | m66-porcelain-hearts | Porcelain Hearts | new | | Clara (Tall House porch) | mossy-wood | prev | clara | Clara knew Vesper when they were both on the porch of the Tall House. She shows the player his hairline crack in an old photograph and asks that he be stopped, not shattered. Sincere; sets the finale's mercy. |
| 67 | m67-emergency-assessment | Emergency Assessment | new | | Hedda Galley (Tattler Building) | downtown | prev | juniper, reginald, hedda, vesper | Vesper declares an HOA emergency and seizes City Hall; Juniper is held. Reginald, at last, lets the player in by the side door. Get Juniper out (crack, escort). Reginald stays behind to "measure something." |
| 68 | m68-lights-out | Lights Out in Turfton | new | | Pip (Saucer Court) | downtown | prev | pip, tansy, granny, juniper, bodega, hyssop | The night before. Drive each friend home (L58 tour: Juniper to Kerb Row, Granny to her farmhouse or a downtown bed, Bodega to the shop, Tansy to the sealed bay); one short exchange at each door. Pip and the player on the Saucer Court roof. Quiet. |
| 69 | m69-the-combine-wakes | The Combine Wakes | new | | Ash-Shovel Ernie (Compost Heap) | turfton-fringe | prev | ernie, chard, hyssop | The Grand Combine leaves the Compost Heap. Evacuate the Even-Estates workers (Chard Levelright, who realises he built for nobody) and the fringe lanes before it turns onto the meridian. |
| 70 | ch5-even-cut | The Even Cut | extended (rewrite) | ch5-even-cut | Tansy (Dust Flats overlook) | downtown | prev | everyone | Finale. p1 "Air Support", p2 "Deck Drop", p3 "The Gilded Lawn-Throne" (boss), final (keeps the id) "The Jam & The Choice": the Stopping Stone in the intake, Vesper's top hat off, Endings A/B as today. Clara's plea: Vesper is stopped, not shattered. Epilogue world change W17. |

## 5. Extended quests (placement fixed)

| Row | id | Parts (`<id>-p1..`, then the final part keeps the id) | Turn |
|---|---|---|---|
| 15 | ch1-founders-boot | p1 Parade Permits, p2 Dress Rehearsal, final Founder's Boot & The Kangaroo Court | I -> II |
| 35 | ch3-salvage-raid | p1 Tuesday, p2 Hold the Bay, final The Salvage Raid | II -> III |
| 46 | m46-starfall-at-the-anthill | p1 Night Class, p2 The Sugar Toll, p3 The Lens, final Dean's Leap | mid III |
| 52 | m52-the-test-cut | p1 Tee Time, p2 Mow Line, p3 Against the Deck, final Through the Hedge | III -> IV |
| 64 | m64-all-hats | p1 By Water, p2 By Air, p3 By Road, final By Root | mid IV |
| 70 | ch5-even-cut | p1 Air Support, p2 Deck Drop, p3 The Gilded Lawn-Throne, final The Jam & The Choice | finale |

## 6. Cast list (ids are the `CAST` keys; new ones become CAST ids)

Home and work are fixed here; the character bible repeats them. `ack` = acknowledged (a visible place E10 builds or an
existing building); `hidden` = data row only, never shown. Slot: `existing:<stage or building>`, `home-NN` (E01's
twelve home slots: 01-04 downtown, 05-12 settlement lots), `apartment` (Saucer Court block), or `site:<E01 slot>`.

### Existing cast

| id | Name | Home (slot, ack/hidden) | Work |
|---|---|---|---|
| player | the player's gnome | Saucer Court flat 3B (apartment, ack; from #2) | the crew, Side-Valve Salvage |
| pip | Pip "Two-Stroke" Potsworth | a hammock in Side-Valve's back office (existing:side-valve-bay, ack); the player's couch at Saucer Court from #39 | Side-Valve Salvage |
| tansy | Tansy "Side-Valve" Clayfoot | the Loft above Side-Valve Salvage (existing:side-valve-bay, ack); the Under-Deck culvert in act III | Side-Valve Salvage |
| turncoat-cam | Turncoat Cam | a cot in Side-Valve's storeroom (hidden); an HOA rental in Patio Heights after #35 (hidden); the HOA lockup in the Double Pot at #62 | sweeper at Side-Valve; HOA valet at the Patio Gate |
| vesper | Vesper "The Glazier" Thorne | the penthouse of Thorne Tower (existing:thorne-tower, ack) | Thorne Lawn & Order, Thorne Tower; the HOA chair; the Double Pot sales floor |
| don-compost | Don Compost | rooms above the Mulch Club (hidden) | the Mulch Club |
| big-lou | Big Lou | a flat behind the Gnomecino (hidden) | the Gnomecino's door |
| granny | Granny Gnertrude | Granny Gnertrude's Farmhouse (existing:granny-barn, ack) | her barn and "bake shop", Cloverfield |
| bramble | Farmer Bramble | the bunkhouse at Granny's barn (existing:granny-barn, ack) | Granny's fields |
| juniper | Councilwoman Juniper "The Trowel" Vance | a narrow terrace on Kerb Row, Bodega's street (home-01, ack) | City Hall |
| reginald | Reginald "Quarter-Inch" Vance | townhouse 404, Patio Heights (home-03, ack) | HOA audit office, Thorne Tower |
| mayor-mulch | Mayor Barnaby "Two-Coat" Mulch | the Mayor's Residence, a glossy red villa in Patio Heights (home-02, ack) | City Hall |
| mabel | Mabel Kerbstone | a flat over the Kerbstone Cabs garage (home-04, ack) | Kerbstone Cabs; the Central Bus Stop kiosk |
| bodega | John Bodega (and Asphalt the cat) | the flat above Bodega & Sons (existing:bodega-front, ack) | Bodega & Sons |
| diggs | Commander Diggs | a tin bungalow in Pebblewick (home-06, ack; shown in #61) | Fort Sandpit |
| bracken | Elder Bracken | his root-house in the Unmowed Hollow (existing:unmowed-hollow, ack) | the Unmowed |
| sorrel | Sorrel Tillbrook | a cottage behind her radio booth, Mossy Wood (home-05, ack) | 88.7 Fescue Public Radio booth |
| loam | Father Loam | a snowmobile shed at the Frozen Birdbath Basin (existing:birdbath-basin, ack) | his chapel-van; the Kiln-Resin shrine |
| theo | Thermos Theo | Theo's camp at the bend (existing:theo-camp, ack) | the bend's barrel fire and post |
| wally | Wind-Sock Wally | a caravan at the airfield apron (existing:airfield-apron, ack) | Wally's Charters, Desert Airfield |
| driftwood | Driftwood | Driftwood's trailer (existing, ack); a beach hut on Saltbucket Boardwalk from #43 (site:coast, ack) | tube hut, Saltbucket Boardwalk |
| brenda | Baroness Brenda | the Vinyl Lounge throne, New Puddle (existing:brenda-throne, ack) | the Sovereign Republic of New Puddle |
| clara | Clara | a hollow log by the Tall House porch (existing:tall-house-porch, ack) | the porcelain refuge, hollow oak stump |
| mossley | Mossley "Plumb-Line" Inkcap | a chalk-marked basement on Kerb Row (hidden) | surveyor, his markers |
| burt | Burt | a rented room above Clay-Mart (hidden) | ex-HOA; Clay-Mart lot |
| cedric | Cedric "Double-Bag" Peat | the rusted Chapel van (existing, ack) | Chapel of Mulch recruiter |
| shelldon | Shelldon "No-Trail" Mucilage | a den behind the dumpsters in his alley (existing:shelldon-alley, ack) | snail-post courier |
| midge | Squeaky-Clean Midge | the nurses' dorm at the Glaze Clinic (hidden) | Glaze Clinic Hospital |
| gary | Gate-Guard Gary | the gatehouse at the Patio Gate (existing:patio-gate, ack) | the Patio Gate |
| rooster | Rooster "Squall-Box" Weatherby | the Squall-Box windmill (existing:rooster-windmill, ack) | his forecasts |
| frank | Fence-Post Frank | a shack behind the south welcome sign (home-07, ack) | watching the highway; the diner counter |
| ernie | Ash-Shovel Ernie | the furnace room at the Compost Heap (existing:compost-heap, ack) | the Compost Heap furnace |
| nora | Knot-Hole Nora | the Knot-Hole (existing:knot-hole, ack) | (as her lore says) |
| sal | Silt-Diver Sal | the Under-Deck culvert (existing:culvert-under-deck, ack) | salvage diving |
| nina | Neon-Moth Nina | the Greenhouse Strip (existing:greenhouse-strip, ack) | the Gnomecino floor |
| dot | Dorrit "Dot" Pennywort | a room over the Kerbside Exchange (hidden) | the Kerbside Exchange |
| hedda | Hedda Galley | a flat high in the Tattler Building (hidden) | the Turfton Tattler |
| grout | "Big Wrench" Grout | the back room of the Local 404 Union Hall (hidden) | Local 404, the Skyway |
| yarrow | Reeve Yarrow Potsherd | the reeve's house on Pebblewick square (existing, ack) | Pebblewick |

### New cast (24)

| id | Name | Role | Home (slot, ack/hidden) | Work | First / last main quest |
|---|---|---|---|---|---|
| hyssop | Hyssop Doormat | the player's nosy neighbour at Saucer Court | Saucer Court flat 3A (apartment, ack) | retired lollipop-crossing warden; watches the stairwell | 2 / 69 |
| parsley | Parsley Inkpot | First Kiln Bank loan officer | a bedsit off the bank's back stair (hidden) | First Kiln Bank | 2 / 2 (side quests later) |
| chard | Chard Levelright | foreman, Levelright Construction | a site caravan at the nearest Even-Estates site (site:construction-1, ack) | Levelright Construction, Thorne Even-Estates | 7 / 69 |
| cardoon | Cardoon "Swish" Trowelly | Drainpipe Court regular, hustler with a heart | a flat over the laundrette by the court (hidden) | Drainpipe Court (unofficial) | 14 / 14 |
| fennel | Fennel Gripwax | Gutter Bowls skater, feeds strays | a hammock under the Gutter Bowls' deck (site:skate-park, ack) | the Gutter Bowls; delivers for Bodega | 9 / 9 |
| hogweed | Hogweed Sprocket | leader of the Underspanners, radical inventor | a workshop-hammock in the Underspan (site:skyway-society, ack) | the Underspan workshops | 10 / 64 |
| lulu | Lugnut Lulu | captain of the Carburettors (already a Fizz Cup racer) | a converted car-wash bay at the Lost & Found Speedway (existing:speedway, ack) | the Carburettors; Rutbottom in summer | 5 / 64 |
| sage | Sage Ladle | cook and owner, Route South Acorn Diner; chef-job employer | the room above the diner (existing:south-highway-diner, ack) | the diner kitchen | 13 / 20 (silent) |
| chicory | Chicory Snips | head gardener at Trellisdown | the gardener's lodge at the vineyard gate (site:vineyard, ack) | Trellisdown Vineyard | 17 / 65 |
| wisteria | Countess Wisteria Brassknock | old money; secret backer of the HOA | Brassknock Manor (site:mansion, ack, interior) | Trellisdown Vineyard (grape-dew) | 17 / 70 |
| saxifrage | Mother Saxifrage Wader | leader of the Flock of the One Leg | the big tent at Wader's Rest (site:cult-camp, ack) | the Flock | 25 / 51 |
| nubbin | Nubbin | a small young mole, the player's friend among the Burrowfolk | his family's burrow in Loamdeep (mole halls, ack) | runner for Loamdeep's post | 24 / 60 |
| tumblesoil | Old Mother Tumblesoil | matriarch of the Burrowfolk | the Mother's Hall in Loamdeep (mole halls, ack) | keeps Loamdeep | 24 / 70 |
| peony | Dame Peony Gravelrake | owner of Hedgeworth Links | rooms above the Hedgeworth Clubhouse (site:golf-yard, ack, interior) | Hedgeworth Links | 29 / 70 |
| basil | Basil Divot | the club pro, mole-hater, superstitious | the pro's cottage by the first tee (site:golf-yard, ack) | Hedgeworth pro shop | 47 / 52 |
| thrift | Thrift Hosepipe | the groundskeeper who talks to the grass and hides moles | the groundskeeper's shed by the ninth green (site:golf-yard, ack) | Hedgeworth grounds | 29 / 52 |
| gentian | Gentian Bootlace | keeper of the Woolly Sock Lodge, ski instructor | the Woolly Sock Lodge (site:ski-hill, ack, interior if E05 allows) | Snowdrop Slope | 37 / 38 |
| chanterelle | Warden Chanterelle Stook | warden of Capwood | a hut in a hollow toadstool stalk (site:toadstool-forest, ack) | keeps Capwood | 40 / 40 |
| ragwort | Ragwort Coilspring | engineer of Pinwheel Ridge | the control hut on the ridge (site:wind-farm, ack) | Pinwheel Ridge | 41 / 41 |
| clary | Clary Mudguard | marshal of the Rutbottom Dirt Bowl | the starter's tower at the Dirt Bowl (site:dirt-track, ack) | Rutbottom Dirt Bowl | 42 / 42 |
| betony | Professor Betony Sextant | astronomer at Rootwell | a staff room in the Anthill Observatory (site:observatory-mound, ack) | Rootwell University | 45 / 70 (finale call) |
| lovage | Dean Lovage Inkwell | Rootwell's dean, in Vesper's pocket | the Dean's lodge on the quad (site:campus, ack) | Rootwell University | 45 / 46 |
| samphire | Captain Samphire Bilge | captain of the Bathtub Queen; pirate tours and real smuggling | the captain's cabin on the Bathtub Queen (site:pirate-ship, ack) | the Bathtub Queen | 44 / 70 |
| marram | Marram Teaspoon | runs the Spokewheel and the boardwalk stalls | a hut on Long Spoon Pier (site:coast, ack) | Saltbucket Boardwalk | 43 / 43 |

Minor named workers (side quests, no CAST row needed now; the lore issues may name them in place entries): Wenna
Gudgeon, Hazel Mattock, Dunnock Pell, Purser Tolly, Sorting-Office Sid, Cress Caliper, Dock Hoewright already exist.

## 7. World changes (ids fixed; the world-changes issue writes the full table)

| id | after | what, in one line |
|---|---|---|
| W01 | #2 | Saucer Court: the player's name on the buzzer, flat 3B's window lit at night. |
| W02 | #7 | Thorne Even-Estates: Levelright hoardings, cranes and beige show-homes appear on the three fringe sites. |
| W03 | #15 | Founders' Green opens: ribbon, crowd, bandstand, the HOA condemned signs gone. |
| W04 | #20 | Cloverfield: HOA foreclosure signs torn down on Granny's lanes; the barn re-roofed. |
| W05 | #21 | The Double Pot tops out: crane gone, Thorne banner, Even-Estates sales floor lit. |
| W06 | #24 | Burrow Door: a mole lantern at the door; Sorrel's hand-painted "Moles are neighbours" sign at the wood edge. |
| W07 | #34 | Side-Valve Salvage: party bunting and the rezoning poster on the bay door. |
| W08 | #35 | Side-Valve Salvage seized: boarded, HOA seal, "SEIZED" banner (until W17). |
| W09 | #39 | Saucer Court: Pip's toolbox and hammock in flat 3B; Hyssop's "NO LODGERS" note on the door. |
| W10 | #41 | Pinwheel Ridge freed: the pinwheels spin again; Turfton's neon at night brighter. |
| W11 | #44 | Saltbucket Shore: Driftwood's tube hut open; the Bathtub Queen flies the crew's colours. |
| W12 | #46 | The Anthill Observatory dome open and empty; student protest banners on the Rootwell quad. |
| W13 | #49 | Moles in Turfton: a Burrowfolk root stall by Bodega & Sons; moles walking the wood edge unbothered. |
| W14 | #52 | Hedgeworth Links: one dead-straight mown scar across the course. |
| W15 | #60 | Fort Sandpit: coalition colours on the gate; Spade Guard patrols friendly to the player. |
| W16 | #64 | Dust Flats overlook: coalition camp, every faction's tent and hat. |
| W17 | #70 | After the finale: Side-Valve reopens, Even-Estates hoardings torn down, and the downtown scar becomes wild clover (Ending A) or a neon grid (Ending B). |

## 8. Lore: rulings and entries

Rulings R-158 to R-167 are written by the lead in `docs/lore/rulings.md` before the lore issues run (cite them as
`docs/lore/rulings.md#r-158` etc.): R-158 the Saltwater and Saltbucket Shore; R-159 Rootwell, the Anthill and its ants;
R-160 Snowcap Rise, Snowdrop Slope, Pail Pond, Capwood (and what grows the toadstools), Pinwheel Ridge; R-161
Hedgeworth and the Kicked Board; R-162 Trellisdown, the Brassknocks and grape-dew; R-163 the Flock of the One Leg;
R-164 the Burrowfolk of Loamdeep; R-165 the Underspanners and the Dewdrop; R-166 Thorne Even-Estates, Levelright, the
Double Pot, Founders' Green, Saucer Court and the flat's loan; R-167 the 70-quest story and the four parts of the
Combine.

New entry ids (one file each in `docs/lore/entries/apocrypha/<id>.md`, tier `apocrypha`, setting `apocrypha`,
`games: [gnome-theft-auto]`, `status: draft`): see the lore issues for the split. Every `related:` id must be an
existing entry or one in these lists.

- South and east: `saltbucket-shore`, `the-saltwater`, `saltbucket-boardwalk`, `long-spoon-pier`, `the-spokewheel`,
  `the-bathtub-queen`, `samphire-bilge`, `marram-teaspoon`, `rootwell-university`, `the-anthill`,
  `anthill-observatory`, `rootwell-field`, `betony-sextant`, `lovage-inkwell`, `rutbottom-dirt-bowl`, `clary-mudguard`.
- North: `snowcap-rise`, `snowdrop-slope`, `woolly-sock-lodge`, `pail-pond`, `capwood`, `capwood-run`,
  `pinwheel-ridge`, `gentian-bootlace`, `chanterelle-stook`, `ragwort-coilspring`.
- West: `trellisdown`, `trellisdown-vineyard`, `brassknock-manor`, `grape-dew`, `wisteria-brassknock`,
  `chicory-snips`, `waders-rest`, `flock-of-the-one-leg`, `the-standing-lady`, `saxifrage-wader`, `the-burrow-door`,
  `loamdeep`, `the-burrowfolk`, `old-mother-tumblesoil`, `nubbin`, `hedgeworth`, `hedgeworth-links`,
  `hedgeworth-clubhouse`, `the-kicked-board`, `peony-gravelrake`, `basil-divot`, `thrift-hosepipe`.
- Turfton: `saucer-court`, `hyssop-doormat`, `parsley-inkpot`, `thorne-even-estates`, `levelright-construction`,
  `chard-levelright`, `founders-green`, `the-double-pot`, `drainpipe-court`, `cardoon-trowelly`, `the-gutter-bowls`,
  `fennel-gripwax`, `the-underspan`, `the-underspanners`, `hogweed-sprocket`, `the-dewdrop`, `lugnut-lulu`,
  `sage-ladle`, `windfall-croft`, `the-grand-combine-parts` (concept: the four parts and where each was built).
