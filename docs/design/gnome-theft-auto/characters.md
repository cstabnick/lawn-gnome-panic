# Gnome Theft Auto: character bible (batch 3)

Every character of the 70-quest story ([story-outline.md](story-outline.md)): who they are, what they want, how they
talk and look (for CAST presets in `src/cutscene/cast.ts` and `src/voice/voices.ts`), their arc across the four acts,
and **where they live and work** (L58). Ids are the `CAST` keys in `src/quests/stages.ts`; new ones are added by the
build epics. The directing bible ([direction/bible.md](direction/bible.md) section 2) still rules on voice and body
for the characters it covers; the looks of existing characters match their presets in `src/cutscene/cast.ts`.

## Homes and workplaces (L58; E10 builds from this table)

Every character has a home. `ack` homes are visible places (E10 builds a facade, a door-plate or, where marked, an
interior through E05); `hidden` homes exist only as a data row with at most a door-plate. Slots: `home-01`..`home-04`
are E01's downtown home lots, `home-05`..`home-12` settlement lots (unused ones: 08-12 are free for E10's own residents
or later characters), `apartment` the Saucer Court block, `site:<id>` an E01 new-area slot, `existing:<stage>` a stage or
building that is already in the game.

| character | home | home site slot | workplace | pickup/drop-off quests |
|---|---|---|---|---|
| player | Saucer Court flat 3B (interior, ack) | apartment | the crew; Side-Valve Salvage | #2 move in; #39 Pip moves in; #68 the roof |
| pip | hammock in Side-Valve's back office; the player's couch from #39 (ack) | existing:side-valve-bay; apartment | Side-Valve Salvage | #39, #68 |
| tansy | the Loft above Side-Valve Salvage (ack); Under-Deck culvert in act III | existing:side-valve-bay | Side-Valve Salvage | #39 (culvert), #68 drop at the sealed bay |
| turncoat-cam | storeroom cot (hidden); HOA rental, Patio Heights (hidden); HOA lockup in the Double Pot (#62) | existing:side-valve-bay | Side-Valve sweeper; Patio Gate valet | #21 seen at the gate, #62 the cell |
| vesper | penthouse of Thorne Tower (ack) | existing:thorne-tower | Thorne Lawn & Order; the HOA; the Double Pot sales floor | #21 the viewing |
| don-compost | rooms above the Mulch Club (hidden) | existing:mulch-club-door | the Mulch Club | - |
| big-lou | a flat behind the Gnomecino (hidden) | existing:gnomecino-door | the Gnomecino door | #11 |
| granny | Granny Gnertrude's Farmhouse (ack) | existing:granny-barn | her barn and bake shop | #31 pickup at home, #34 pickup, #68 drop-off |
| bramble | bunkhouse at Granny's barn (ack) | existing:granny-barn | Granny's fields | #31 |
| juniper | narrow terrace on Kerb Row (ack) | home-01 | City Hall | #7 drop-off, #12 giver at home, #34 pickup, #68 drop-off |
| reginald | townhouse 404, Patio Heights (interior, ack) | home-03 | HOA audit office, Thorne Tower | #12 break-in, #28 escort from office |
| mayor-mulch | the Mayor's Residence, red villa, Patio Heights (ack) | home-02 | City Hall | #63 pickup at home |
| mabel | flat over the Kerbstone Cabs garage (ack) | home-04 | Kerbstone Cabs; Central Bus Stop kiosk | #2 the cab |
| bodega | flat above Bodega & Sons (ack) | existing:bodega-front | Bodega & Sons | #9 Asphalt home, #34 pickup, #68 drop-off |
| diggs | tin bungalow in Pebblewick (interior, ack) | home-06 | Fort Sandpit | #61 |
| bracken | root-house in the Unmowed Hollow (ack) | existing:unmowed-hollow | the Unmowed | #23 |
| sorrel | cottage behind her radio booth, Mossy Wood (ack) | home-05 | 88.7 Fescue Public Radio booth | #22 delivery to the booth |
| loam | snowmobile shed, Frozen Birdbath Basin (ack) | existing:birdbath-basin | chapel-van; Kiln-Resin shrine | #36 |
| theo | Theo's camp at the bend (ack) | existing:theo-camp | the bend's fire and post | #37 |
| wally | caravan at the airfield apron (ack) | existing:airfield-apron | Wally's Charters | #54 fetch from the apron |
| driftwood | Driftwood's trailer; beach hut on Saltbucket Boardwalk from #43 (ack) | existing:driftwood-trailer; site:coast | tube hut, Saltbucket Boardwalk | #32 from the trailer, #43 at the hut |
| brenda | the Vinyl Lounge throne, New Puddle (ack) | existing:brenda-throne | New Puddle | - |
| clara | hollow log by the Tall House porch (ack) | existing:tall-house-porch | the porcelain refuge | #66 |
| mossley | chalk-marked basement on Kerb Row (hidden) | - | his survey markers | - |
| burt | room above Clay-Mart (hidden) | - | ex-HOA; Clay-Mart lot | - |
| cedric | the rusted Chapel van (ack) | existing:chapel-van | Chapel of Mulch recruiter | - |
| shelldon | den behind the dumpsters (ack) | existing:shelldon-alley | snail-post courier | - |
| midge | nurses' dorm, Glaze Clinic (hidden) | - | Glaze Clinic Hospital | #31 drop-off at work |
| gary | gatehouse at the Patio Gate (ack) | existing:patio-gate | the Patio Gate | #12 |
| rooster | the Squall-Box windmill (ack) | existing:rooster-windmill | his forecasts | #19 |
| frank | shack behind the south welcome sign (ack) | home-07 | the highway; the diner counter | #29 |
| ernie | furnace room at the Compost Heap (ack) | existing:compost-heap | the Compost Heap furnace | #27, #69 |
| nora | the Knot-Hole (ack) | existing:knot-hole | (as her lore) | - |
| sal | the Under-Deck culvert (ack) | existing:culvert-under-deck | salvage diving | #39 |
| nina | the Greenhouse Strip (ack) | existing:greenhouse-strip | the Gnomecino floor | - |
| dot | room over the Kerbside Exchange (hidden) | - | the Kerbside Exchange | - |
| hedda | flat high in the Tattler Building (hidden) | - | the Turfton Tattler | #15 p1, #28 delivery to work, #67 |
| grout | back room, Local 404 Union Hall (hidden) | - | Local 404, the Skyway | #10 |
| yarrow | the reeve's house, Pebblewick square (ack) | existing:pebblewick | Pebblewick | #58 |
| hyssop | Saucer Court flat 3A (ack) | apartment | watches the stairwell (retired crossing warden) | #2, #39, #68, #69 |
| parsley | bedsit off the bank's back stair (hidden) | - | First Kiln Bank | #2 at work |
| chard | site caravan at an Even-Estates site (ack) | site:construction-1 | Levelright Construction | #7, #15 p2, #69 evacuate |
| cardoon | flat over the laundrette by the court (hidden) | - | Drainpipe Court | #14 |
| fennel | hammock under the Gutter Bowls' deck (ack) | site:skate-park | the Gutter Bowls; Bodega deliveries | #9 |
| hogweed | workshop-hammock in the Underspan (ack) | site:skyway-society | the Underspan workshops | #10, #33, #56 |
| lulu | converted car-wash bay, Lost & Found Speedway (ack) | existing:speedway | the Carburettors; Rutbottom in summer | #5, #30, #40, #42 |
| sage | room above the Route South Acorn Diner (ack) | existing:south-highway-diner | the diner kitchen (chef-job employer) | #13 at work |
| chicory | gardener's lodge at the vineyard gate (ack) | site:vineyard | Trellisdown Vineyard | #17, #50, #65 |
| wisteria | Brassknock Manor (interior, ack) | site:mansion | Trellisdown Vineyard | #50, #65 |
| saxifrage | the big tent at Wader's Rest (ack) | site:cult-camp | the Flock | #25, #51 |
| nubbin | his family's burrow in Loamdeep (ack) | mole halls (E17) | Loamdeep post runner | #24 drive him home |
| tumblesoil | the Mother's Hall, Loamdeep (ack) | mole halls (E17) | keeps Loamdeep | #24, #49 |
| peony | rooms above the Hedgeworth Clubhouse (interior, ack) | site:golf-yard | Hedgeworth Links | #47, #52 |
| basil | the pro's cottage by the first tee (ack) | site:golf-yard | Hedgeworth pro shop | #47, #48 |
| thrift | groundskeeper's shed by the ninth green (ack) | site:golf-yard | Hedgeworth grounds | #29, #48 |
| gentian | the Woolly Sock Lodge (interior if E05 allows, ack) | site:ski-hill | Snowdrop Slope | #37 (the crew's act III base) |
| chanterelle | hut in a hollow toadstool stalk (ack) | site:toadstool-forest | warden of Capwood | #40 |
| ragwort | control hut on Pinwheel Ridge (ack) | site:wind-farm | Pinwheel Ridge | #41 |
| clary | starter's tower at the Dirt Bowl (ack) | site:dirt-track | Rutbottom Dirt Bowl | #42 |
| betony | staff room in the Anthill Observatory (ack) | site:observatory-mound | Rootwell University | #45, #46 |
| lovage | the Dean's lodge on the quad (ack) | site:campus | Rootwell University | #45 |
| samphire | captain's cabin, the Bathtub Queen (ack) | site:pirate-ship | the Bathtub Queen | #44 |
| marram | hut on Long Spoon Pier (ack) | site:coast | Saltbucket Boardwalk | #43 |

Built-home count for E10 (the cap is about 25 new builds): new-build ack homes are home-01..07 (7), the Saucer Court
block (1, two flats), the Pebblewick bungalow (in home-06) and the homes on new-area sites, which the area epics
(E11-E17) build with their sites. Everything marked `existing:` reuses a building or stage that is already there.

## Main cast (existing)

### The player's gnome (`player`)

- **Role / faction:** the protagonist: a hired hand on Tansy's crew, borrower of flat 3B, the driver everyone leans on. Belongs to no faction until the coalition.
- **New or existing:** existing (`player`)
- **First / last main quest:** #1 prologue-fresh-kiln / #70 ch5-even-cut
- **Want / fear / secret:** want to clear the Kiln-Debt (and now the flat's loan) and keep a low head; fear being one more gnome from the same mould; secret none, the player is the audience's seat (a loose thread nobody may answer: who they were before the kiln).
- **Arc by act:** I: errands for the debt, a flat of their own, a first reason to stay; II: debt paid, refuses Vesper's offer at the diner and picks the crew over comfort; III: the one who drives Pip and the crew to the edges and gathers four allies; IV: the one every plan depends on (the drop, the tunnel, the convoy), then the hand on the jam and the city's choice.
- **Voice (for `src/voice/voices.ts` and lines):** the straight man. Flat, two to six words, mostly questions, at most one line in three of any exchange, never tops a quip. "Your bikes?" / "Why me?"
- **Body and visual hook (for a CAST preset):** the player's own gnome from `@lawn/gnome`, never a preset (no CAST entry). Still: nods, shrugs, crossed arms at Vesper; lets others move round them.
- **Vehicle:** whatever they steal; keeps the dirt bike from #42 and gets the Crop Duster and Whirligig in act IV (existing kinds: `lowrider`, `ride-on`, `push-bike`, `zero-turn`, `plane`, `whirligig`).
- **Home:** Saucer Court flat 3B (apartment, ack; from #2) · **Work:** the crew, Side-Valve Salvage
- **L58 visibility:** acknowledged (seen in quests: #2 move-in, #39 Pip on the couch, #68 the roof)
- **Relationships:** owes the First Kiln Bank 1,500 Acorns; drives for Pip and Tansy as family; is watched by Hyssop through the stairwell; gets a mention in every ally's last scene.

### Pip "Two-Stroke" Potsworth (`pip`)

- **Role / faction:** the crew's mechanic and liability; exiled Fescue gnome, a Potsworth (the regent's cousin).
- **New or existing:** existing (`pip`)
- **First / last main quest:** #1 prologue-fresh-kiln / #70 ch5-even-cut
- **Want / fear / secret:** want to be useful, now, loudly; fear being the family embarrassment; secret the vial of Fescue soil in his toolbox (he opens it at #26 and does not pour it; why he left stays half told at #14, Wendel stays unanswered).
- **Arc by act:** I: the liability who drags the player in, then the first sincere beat on the Drainpipe Court bench (#14); II: shamed by Bracken, looks through the knot-hole at Fescue (#26), loses his arm in the raid (#35); III: moves onto the player's couch (#39), jokes through the pain, helps map the four parts; IV: the plan-man at last ("Okay, hear me out" and Tansy lets him), rigs the Whirligig, and says the line that sends them in.
- **Voice (for `src/voice/voices.ts` and lines):** fast, run-on, exclamation marks, engine names. Tic: "Okay, hear me out" (once an act at most); a second sentence that undoes the first; bad at numbers; never cruel. "Husky-Blade two-strokes! Legitimate! ...Don't tell anyone."
- **Body and visual hook (for a CAST preset):** red hat (0xc82828), green shirt (0x2f6b3a), dark brown trousers, brown beard (0x6b4423), freckles, scale 1.38. Never still: bounces, sits on the wrong thing, runs when walking would do; one sleeve pinned empty after #35.
- **Vehicle:** push-bike by default; will drive any `ride-on` and fly the Whirligig in act IV.
- **Home:** a hammock in Side-Valve's back office (existing:side-valve-bay, ack); the player's couch at Saucer Court from #39 · **Work:** Side-Valve Salvage
- **L58 visibility:** acknowledged (seen in quests: #1, #2, #14, #26, #34, #39, #68; the hammock in #2 and #8)
- **Relationships:** loves Tansy as a boss and a sister he would not say it to; owes the player an arm; fights Bracken's low opinion of engines; dodges every question about Fescue.

### Tansy "Side-Valve" Clayfoot (`tansy`)

- **Role / faction:** owner of Side-Valve Salvage; head of the crew; reluctantly the heist planner.
- **New or existing:** existing (`tansy`)
- **First / last main quest:** #1 prologue-fresh-kiln / #70 ch5-even-cut
- **Want / fear / secret:** want to keep the bay open and stay out of everybody's war; fear losing the place she built (and being found out as no Clayfoot at all); secret the brass forty-eighth wrench, and whether the surname is real (stays open; her surname beyond Clayfoot is never given).
- **Arc by act:** I: "not my bay, not my problem" while her bay is the target; II: warm high point at the party (#34) with the forty-eighth wrench story, then the bay is seized (#35); III: underground in the Under-Deck culvert, surfaces for the crew (#39), runs the ridge call; IV: calls a heist big enough for the brass wrench, and hangs the forty-eighth wrench back up (W17).
- **Voice (for `src/voice/voices.ts` and lines):** dry, low, short; garden proverbs twisted into street slang; orders in three short clauses; never raises her voice until act III; chicory coffee is her stress tell, twice in the whole game. "Unclamp them. Bring them to my bay. Mind the Hat Watch."
- **Body and visual hook (for a CAST preset):** orange hat (0xf08a24), charcoal shirt (0x2f353d), navy trousers (0x23384d), no beard, glasses, brown pigtails (0x6b3a1e), holds the leaf-blower cannon, scale 1.42. Works while she talks, looks at the job not at Pip; arms crossed means no; touches no one until the act III hug.
- **Vehicle:** the shop's tow dolly and a `ride-on`; no car of her own.
- **Home:** the Loft above Side-Valve Salvage (existing:side-valve-bay, ack); the Under-Deck culvert in act III · **Work:** Side-Valve Salvage
- **L58 visibility:** acknowledged (seen in quests: #1, #4, #8, #13, #33, #34, #35, #39, #54, #64, #70; the Loft in #34, the culvert in #39)
- **Relationships:** Pip is her family; the player is her best hire; Cam is her blind spot; Sal and Hogweed are the people she calls when it gets big.

### Vesper "The Glazier" Thorne (`vesper`)

- **Role / faction:** porcelain; HOA chair, Thorne Lawn & Order, Thorne Tower; builder of the Grand Combine.
- **New or existing:** existing (`vesper`)
- **First / last main quest:** #4 ch1-mowers-keepers (named) / #70 ch5-even-cut
- **Want / fear / secret:** want a silent, even, beige Turfton and the Golden Acorn as the Combine's ignition; fear cracking (porcelain does not glue back); secret the Tall House and his hairline crack (hinted: he flinches from lanterns and dark doorways; Clara's photo at #66 shows only the crack).
- **Arc by act:** I: a polite rumour with a lien, named before he is seen, Even-Estates behind him; II: the reasonable man with an offer (#20), then the penthouse viewing (#21), the raid (#35); III: the Combine built in four parts, the tasting (#50, the first shared frame with the player) and the test cut with its broadcast date (#52); IV: seizes City Hall (#67), cancels Cam, unravels on the PA, and loses his top hat in the finale (stopped, not shattered).
- **Voice (for `src/voice/voices.ts` and lines):** soft, slow, complete sentences, perfect grammar, no contractions, no exclamation marks until the finale PA; calls people "friend" or by full name; threats as compliments. "Nice hat. It would be a shame if it were to crack."
- **Body and visual hook (for a CAST preset):** near-black hat (0x141418), white shirt and trousers, white porcelain skin (0xfafafa), no beard, glasses, holds brass calipers, scale 1.5 (the tallest of the main cast); hairline crack at the temple added in act IV art; a top hat in the finale. Never runs, never sits on anything dirty; tips his hat as a threat.
- **Vehicle:** the pearl `lowrider` "nobody is driving"; the Grand Combine in act IV (`combine`).
- **Home:** the penthouse of Thorne Tower (existing:thorne-tower, ack) · **Work:** Thorne Lawn & Order, Thorne Tower; the HOA chair; the Double Pot sales floor
- **L58 visibility:** acknowledged (seen in quests: #20 diner, #21 the penthouse key and the Double Pot, #50 the tasting; the Tower from outside everywhere)
- **Relationships:** the Don is his rival; Wisteria funds him; Clara knew him on the porch; Cam is his tool; Juniper and Reginald are his files.

### Turncoat Cam (`turncoat-cam`)

- **Role / faction:** Side-Valve's sweeper; secretly the HOA's informant; wants a Patio Heights racing charter.
- **New or existing:** existing (`turncoat-cam`)
- **First / last main quest:** #1 prologue-fresh-kiln / #62 m62-cams-cell
- **Want / fear / secret:** want a charter and to be someone in Turfton; fear sweeping someone else's apron for ever; secret he is selling the crew out (the plant: his stare at Lulu's charter plate at #5, the envelope at #30).
- **Arc by act:** I: broom in the background of every Side-Valve shot; he asks for a part run (#5) and envies Lulu; II: a Speedway big night (#30), he loses, takes the envelope, watches the bench code at #33, tin-can call "Tuesday. The charter's mine." (#34), betrays the crew at #35; III: valet at the Patio Gate in an HOA vest (seen from #21; absent otherwise); IV: charter cancelled, locked in the Double Pot lockup, the player frees him or leaves him (#62); both give the code.
- **Voice (for `src/voice/voices.ts` and lines):** near silent until the betrayal, then short, flat, transactional; ends sentences on the price. "Noted." / "That is fine. It is what it costs."
- **Body and visual hook (for a CAST preset):** no CAST preset yet (a build worker adds one): drab olive cap, thin build, no beard, a chip on one ear, push-broom always in hand (an HOA vest replaces the apron after #35). Hunched; eyes on the bay, never on the person talking.
- **Vehicle:** none until the Speedway; a borrowed `ride-on` for #30.
- **Home:** a cot in Side-Valve's storeroom (hidden); an HOA rental in Patio Heights after #35 (hidden); the HOA lockup in the Double Pot at #62 · **Work:** sweeper at Side-Valve; HOA valet at the Patio Gate
- **L58 visibility:** never shown (the cot, rental and lockup are hidden data rows; he is seen at the Patio Gate in #21 and in the lockup cell at #62, but that is a scene, not a home)
- **Relationships:** Tansy trusts him; Pip likes him and does not notice; Lulu laughs at him without meaning harm; Vesper uses him and drops him.

### Don Compost (`don-compost`)

- **Role / faction:** silent head of the Mulch Club; Turfton's crime boss; Vesper's rival.
- **New or existing:** existing (`don-compost`)
- **First / last main quest:** #3 first-contract / #70 ch5-even-cut (via the coalition's Mulch Club crews)
- **Want / fear / secret:** want his Club's rackets left alone and the city crooked on his terms; fear a beige Turfton with no use for a Don; secret why he never speaks (R-025 stands; a loose thread, never explained).
- **Arc by act:** I: gives the first contract (#3), then the cigar boats at war with the HOA (#11); II: a presence at the edge, the HOA inspections hit his boats; III: his crews keep Turfton's back alleys alive while the crew is away; IV: taps four times (#63), which nobody has seen, and lends crews and money in exchange for the Mayor's signature.
- **Voice (for `src/voice/voices.ts` and lines):** silent. Never speaks. Taps (one mower, two acorns, three crack a hat, four the war), eyebrows, a folded napkin; others translate nervously. A tap on the table, then a hold.
- **Body and visual hook (for a CAST preset):** no CAST preset yet (a build worker adds one): broad and round, wide black hat with a red band, white pinstripe suit, grey beard combed flat, an unlit cigar. Utterly still; only the hand moves.
- **Vehicle:** a long black `lowrider` with Big Lou driving; none of his own.
- **Home:** rooms above the Mulch Club (hidden) · **Work:** the Mulch Club
- **L58 visibility:** never shown (his rooms; only the Club's back room is a scene)
- **Relationships:** Big Lou is his hands; Vesper is his enemy; the Mayor owes him; Brenda tolerates his boats.

### Granny Gnertrude (`granny`)

- **Role / faction:** the sharpest fence in three biomes; Cloverfield matriarch; the crew's employer and proof the old and crooked can be kind.
- **New or existing:** existing (`granny`)
- **First / last main quest:** #13 m13-diner-on-route-south (named) / #70 ch5-even-cut (the south canal and pie)
- **Want / fear / secret:** want her silos and Dew-Wells kept, and a cut; fear foreclosure; secret her late husband's acorn silo (told at #31) and how much she knows about the Brassknocks' Dew trade (hinted at #17).
- **Arc by act:** I: named at #13 as "the only gnome Vesper can't buy"; II: employer and debt-clearer (#16), sends the player to Vesper knowing the trap (#20), chased by bailiffs and chipped (#31), glued at the Glaze Clinic; III: absent; IV: arrives at the overlook with pie (#64), holds the south canal in the finale.
- **Voice (for `src/voice/voices.ts` and lines):** warm, unhurried, a recipe's rhythm; "sugar" once a scene at most; homely metaphors for crime; pie as currency. "Now we can cook. Sit down, sugar, and mind the crust."
- **Body and visual hook (for a CAST preset):** purple hat (0x8e44ad), mauve dress (0x7a4f7d), no beard, glasses, white-grey pigtails (0xdedede), holds a shotgun, scale 1.44. Slow, sits, offers things (pie, tea).
- **Vehicle:** the Cloverfield farm truck and a `ride-on` tractor; passenger in the player's car at #31 and #34.
- **Home:** Granny Gnertrude's Farmhouse (existing:granny-barn, ack) · **Work:** her barn and "bake shop", Cloverfield
- **L58 visibility:** acknowledged (seen in quests: #16, #18, #31 pickup at home, #34 pickup, #68 drop-off; the farmhouse)
- **Relationships:** Bramble is her right hand; Rooster is her weather; Tansy is her favourite lender; she is the player's only kitchen table in the game.

### Councilwoman Juniper "The Trowel" Vance (`juniper`)

- **Role / faction:** City Council; the paper-and-law side of the resistance; Reginald's sister.
- **New or existing:** existing (`juniper`)
- **First / last main quest:** #6 ch1-two-coat-tail / #70 ch5-even-cut
- **Want / fear / secret:** want to beat the HOA through paperwork, faster; fear needing a street driver and being the sister who stayed; secret what she found in the City Hall sub-basement (a loose thread, never answered).
- **Arc by act:** I: hires the player for the Even-Estates permits (#7) and the calipers (#12), rezones Vesper's condemned blocks as Founders' Green (#15); II: brings the permits to the Tattler (#28), the party guest (#34); III: a voice on the phone (#50, the tasting call); IV: held at City Hall (#67), rescued, driven home in the last night tour (#68).
- **Voice (for `src/voice/voices.ts` and lines):** brisk, formal, full sentences, devastating one-liners; insults her brother by agreeing with him; never hurries. "I have never known my brother to be wrong. That is how I know."
- **Body and visual hook (for a CAST preset):** blue hat (0x2f5a8f), dark navy shirt (0x243447), charcoal trousers, no beard, glasses, brown pigtails (0x4a2f22), scale 1.44; briefcase and cold Acorn-Cola as props in scenes. Walks like she is already late and never runs.
- **Vehicle:** none; the player is her driver (a Kerbstone cab when the player is not available).
- **Home:** a narrow terrace on Kerb Row, Bodega's street (home-01, ack) · **Work:** City Hall
- **L58 visibility:** acknowledged (seen in quests: #7 drop-off, #12, #34 pickup, #68 drop-off; the terrace)
- **Relationships:** Reginald is her brother and her dearest enemy (they never look at each other while insulting each other); the Mayor is her boss and her despair; Hedda is her best printer.

### Reginald "Quarter-Inch" Vance (`reginald`)

- **Role / faction:** HOA audit officer and Vesper's most precise employee; Juniper's brother.
- **New or existing:** existing (`reginald`)
- **First / last main quest:** #6 ch1-two-coat-tail / #67 m67-emergency-assessment
- **Want / fear / secret:** want a quarter-inch of order; fear that order is not enough; secret his photograph of himself and Juniper as kids (seen at #12) and that he signs what he doubts.
- **Arc by act:** I: signs the Even-Estates permits (#7), meets the player in his own townhouse (#12) and plants a doubt; II: does not confirm Juniper's story but corrects the spelling (#28); III: absent (he audits at Thorne Tower); IV: lets the player in by the side door (#67), stays behind to "measure something."
- **Voice (for `src/voice/voices.ts` and lines):** municipal code, numbers, "four-oh-four dash B"; monotone, exact, never swears. "That is a quarter-inch over. Regulation allows none."
- **Body and visual hook (for a CAST preset):** near-black hat (0x18181e), tan shirt (0xc9b99b), brown trousers, grey beard (0x9e9e9e), glasses, holds brass calipers, scale 1.45. Crouches to measure; shot from above except when enforcing.
- **Vehicle:** a beige HOA `hoa-van` with a driver, or `zero-turn` on audit days.
- **Home:** townhouse 404, Patio Heights (home-03, ack) · **Work:** HOA audit office, Thorne Tower
- **L58 visibility:** acknowledged (seen in quests: #12 townhouse 404, #28 pickup from his office, #67 the side door)
- **Relationships:** Juniper is the sister he cannot argue with; Vesper is his employer; Gary is his gate; the Mayor ignores him.

### Mayor Barnaby "Two-Coat" Mulch (`mayor-mulch`)

- **Role / faction:** Mayor of Turfton; wants to be on the winning side.
- **New or existing:** existing (`mayor-mulch`)
- **First / last main quest:** #6 ch1-two-coat-tail / #63 m63-four-taps
- **Want / fear / secret:** want to be on the winning side; fear being repainted by someone else; secret the signatures he has already sold to both sides (a loose thread: how many).
- **Arc by act:** I: tailed through town (#6), waves at cameras that are not there; II: absent, drifting toward the HOA; III: absent (his villa is a closed gate); IV: brought from his villa to sign the emergency counter-order (#63), and finally picks the side that is winning; epilogue repaint.
- **Voice (for `src/voice/voices.ts` and lines):** campaign slogans, "Ding, ding!", a cheery rise at the end of every sentence. "Progress is a gloss, friends! Ding, ding!"
- **Body and visual hook (for a CAST preset):** no CAST preset yet (a build worker adds one): round, glossy red top coat over a blue under-coat, gold sash, hat ribbon in the colours of whoever is winning. Waves and poses for cameras that are not there.
- **Vehicle:** an official red `lowrider` limousine (existing `lowrider`); chauffeured.
- **Home:** the Mayor's Residence, a glossy red villa in Patio Heights (home-02, ack) · **Work:** City Hall
- **L58 visibility:** acknowledged (seen in quests: #63 pickup at the villa; the villa from the road)
- **Relationships:** Juniper is his councillor and conscience he mutes; the Don owns his debts; Vesper owns his zoning; Gary admires him.

### Commander Diggs (`diggs`)

- **Role / faction:** commander of the Spade Guard at Fort Sandpit; later the coalition's military arm.
- **New or existing:** existing (`diggs`)
- **First / last main quest:** #55 ch4-runway-flares (first named there) / #70 ch5-even-cut
- **Want / fear / secret:** want his chopper guarded and his Guard respected; fear being the guard nobody guards; secret why he stayed fifteen years (told at #61: the medal, the rosters).
- **Arc by act:** I-III: absent; IV: runs the fort at the start, hears Vesper's phone order, turns ("Nobody fires the Guard," #59), salutes the mole at #60, and lets the player into his bungalow at #61; joins the coalition at #64.
- **Voice (for `src/voice/voices.ts` and lines):** clipped military, numbers, "effective immediately"; no contractions, no adjectives. "Effective immediately: stand down. Fifteen years, and nobody asked."
- **Body and visual hook (for a CAST preset):** olive hat (0x4b6329), olive shirt (0x556b2f), dark olive trousers, brown beard (0x5c3e24), holds a rifle, scale 1.52. Stands at attention, salutes; shot low.
- **Vehicle:** the Fort's jeep and the `sycamore-copter` he guards; none of his own.
- **Home:** a tin bungalow in Pebblewick (home-06, ack; shown in #61) · **Work:** Fort Sandpit
- **L58 visibility:** acknowledged (seen in quests: #61 the bungalow; the fort in #57, #59, #60)
- **Relationships:** Yarrow is his neighbour and friend; Vesper is his employer and then his foe; Nubbin's mole friends surprise him; Tansy outranks him.

### Elder Bracken (`bracken`)

- **Role / faction:** leader of the Unmowed in Mossy Wood; keeper of the Cracked Tablet and the Stopping Stone.
- **New or existing:** existing (`bracken`)
- **First / last main quest:** #23 ch2-unmowed-tablet / #70 ch5-even-cut
- **Want / fear / secret:** want to keep the Unmowed hidden and the old ways pure; fear another Potsworth leading the Mower to them; secret the Stopping Stone is a doorstop whose job nobody remembers (hinted).
- **Arc by act:** I: absent; II: the Cracked Tablet, a scene where nobody jokes (#23); III: lends the Stopping Stone at #53 ("the only thing that ever stopped one"); IV: arrives at the overlook with the Unmowed (#64), and at the finale watches the stone go in the intake.
- **Voice (for `src/voice/voices.ts` and lines):** archaic, heavy, low pitch; accusations as statements; no jokes, no contractions. "You carry engines in your hands. Do not carry them in here."
- **Body and visual hook (for a CAST preset):** forest-green hat (0x2e6f40), dark brown shirt (0x4b3522), near-black brown trousers, pale grey-white beard (0xd9d9d2), holds the Stopping Stone, scale 1.48. Stands still on higher ground; shot low.
- **Vehicle:** none (walks, or carried on a snail-coach by the Unmowed).
- **Home:** his root-house in the Unmowed Hollow (existing:unmowed-hollow, ack) · **Work:** the Unmowed
- **L58 visibility:** acknowledged (seen in quests: #23 the Hollow; the root-house)
- **Relationships:** Pip is the Potsworth who stung him; Sorrel is his voice outside the wood; Clara is the older refugee he shelters; Vesper is the Mower's heir.

### Sorrel Tillbrook (`sorrel`)

- **Role / faction:** host of 88.7 Fescue Public Radio; the Unmowed's voice; keeper of the Fence-gap rain tapes.
- **New or existing:** existing (`sorrel`)
- **First / last main quest:** #22 m22-off-air / #26 m26-the-knot-hole (and calls after)
- **Want / fear / secret:** want to keep the peace and the broadcast going; fear the station going silent; secret what is on the rain tapes between the lines (a loose thread: what the Fence-gap sounds like).
- **Arc by act:** I: heard on the radio only; II: asks the player to recover her tapes (#22), is at the Elder's side (#23), sends Nubbin's chase to the Burrow Door (#24), records the rain with Pip at the knot-hole (#26); III: on the radio, a warm voice in the cold; IV: broadcasts the coalition's call to the overlook; never says "mower" (she says "the one in the Shed").
- **Voice (for `src/voice/voices.ts` and lines):** a radio host's calm, measured warmth; dry asides about the schedule; "the one in the Shed" for the Mower. "That was the weather. This is the part where I do not panic."
- **Body and visual hook (for a CAST preset):** sage-green hat (0x4f7a5a), taupe shirt (0x6d5c4d), no beard, auburn pigtails (0x7d4c2a), scale 1.4; headphones as a prop in the booth. Headphones on and off; leans close to a microphone.
- **Vehicle:** a little `walnut-dinghy` cart and the station's `push-bike`.
- **Home:** a cottage behind her radio booth, Mossy Wood (home-05, ack) · **Work:** 88.7 Fescue Public Radio booth
- **L58 visibility:** acknowledged (seen in quests: #22, #24 as giver by call; the booth and cottage in #26)
- **Relationships:** Bracken's ally; Pip is her unexpected friend; Nubbin is her small neighbour; Moleman's thumping set fills her speakers.

### Father Loam (`loam`)

- **Role / faction:** excommunicated chaplain of the Chapel of Mulch; keeper of the Kiln-Resin shrine at the Frozen Birdbath Basin.
- **New or existing:** existing (`loam`)
- **First / last main quest:** #35 ch3-salvage-raid (call) / #53 ch3-tundra-drift-run
- **Want / fear / secret:** want his shrine kept and the cold congregation fed; fear the chapel ever calling him back; secret why he was excommunicated (a loose thread).
- **Arc by act:** I-II: absent (a call at #35); III: shelters the crew at the Basin (#36), blesses getaways and the drift run (#53); IV: a voice in the coalition's prayers; absent in person.
- **Voice (for `src/voice/voices.ts` and lines):** a preacher's cadence, "my child"; kind first, odd second; blessings with strange specifics. "Go with grace, my child, and a full tank of it."
- **Body and visual hook (for a CAST preset):** pale sky-blue hat (0x9ec6de), slate-blue shirt (0x3c5266), dark blue trousers, white beard (0xeeeeee), glasses, holds a porcelain lantern, scale 1.46. Moves slowly, blesses with a mitten.
- **Vehicle:** his chapel-van (snowbound), a `ride-on` snowmobile.
- **Home:** a snowmobile shed at the Frozen Birdbath Basin (existing:birdbath-basin, ack) · **Work:** his chapel-van; the Kiln-Resin shrine
- **L58 visibility:** acknowledged (seen in quests: #36, #53; the Basin and the shed)
- **Relationships:** Theo is his neighbour and warm stop; Cedric is the chapel that cast him out; Tansy and Pip are his congregation of two; Bracken lends him respect.

## Side cast (existing)

### Big Lou (`big-lou`)

- **Role / faction:** Door of the Gnomecino; the Mulch Club lends him out as muscle when the Don taps. Neutral by trade.
- **New or existing:** existing (`big-lou`)
- **First / last main quest:** #11 m11-the-dons-cigars / #63 m63-four-taps
- **Want / fear / secret:** want every hat through his rope dry and in order; fear a rainstorm on a Friday night; secret he still bowls ten-pin in his head and has never told anyone where (loose thread: the Yard).
- **Arc by act:** I: checks the player's hat at the Mulch Club back door (#11), a small test of trust; II: side quests only (the missing hat-towel crate stays as it is); III: absent; IV: stands behind the Don at the Four Taps and lets the whole coalition's hats in, wet or not (#63).
- **Voice (for `src/voice/voices.ts` and lines):** very slow, very low, one or two words a sentence, long pauses, never a question. Tic: says "Hat." as greeting, verdict and farewell. "Hat. ...Dry." / "Don said yes. I say hat."
- **Body and visual hook (for a CAST preset):** near-black hat, charcoal-navy coat, black trousers, dark grey beard, glasses (preset `big lou`, the largest scale); a microfibre towel over one shoulder. Moves a quarter-turn at a time; never leaves the doorway unless the Don taps.
- **Vehicle:** lowrider (matte black, microfibre seat, whitewall tyres, cat-eye lamps)
- **Home:** a flat behind the Gnomecino (hidden) · **Work:** the Gnomecino's door
- **L58 visibility:** acknowledged (seen in quests: #11, #63; his rope in side quests)
- **Relationships:** Serves the Don and says so; has a lifetime ban on Vinnie Delacroix and a soft spot for Neon-Moth Nina, who shoos the moth off his sign; tolerates Brenda, who has never once passed his rope.

### John Bodega (`bodega`)

- **Role / faction:** Corner shopkeeper, no side; the crew's neutral ground and the player's local shop.
- **New or existing:** existing (`bodega`)
- **First / last main quest:** #1 prologue-fresh-kiln / #68 m68-lights-out
- **Want / fear / secret:** want the neon sign buzzing and the step swept; fear the shop going dark (and a second supermarket); secret what happened to the "Sons" (loose thread, nobody asks twice).
- **Arc by act:** I: a face in the prologue, then Asphalt's rescue (#9); II: a party guest the player collects (#34); III: his window stays lit while the crew is away; IV: a drive home on the last night (#68), one short exchange at his door: "Sign's on. Go."
- **Voice (for `src/voice/voices.ts` and lines):** flat, unhurried, mid-pitch, no emotion in any sentence, which is the joke. Tic: states prices of things that are not for sale. "Acorn-Cola. Lukewarm. Same as always." / "Sirens. Mind the step."
- **Body and visual hook (for a CAST preset):** brown hat (the paper-cup visor stays a prop on it), green shirt, auburn-brown beard (preset `bodega`); a broom within reach. Sweeps while he talks; never looks up from it when something explodes.
- **Vehicle:** push-bike (green delivery Push-Mower Bike, crate on the back, bell)
- **Home:** the flat above Bodega & Sons (existing: bodega-front, ack) · **Work:** Bodega & Sons
- **L58 visibility:** acknowledged (seen in quests: #1, #9, #34, #68; W13 stall beside his shop)
- **Relationships:** Loves Asphalt the cat, and says nothing about it; owes nobody; Mossley, Burt and Cedric all loiter outside his shop and he tolerates them equally; trusts Tansy because she pays cash.

### Mabel Kerbstone (`mabel`)

- **Role / faction:** Turfton Taxi driver; city neutral, knows every fare's business and sells none of it.
- **New or existing:** existing (`mabel`)
- **First / last main quest:** #2 m02-roof-on-credit / #6 ch1-two-coat-tail
- **Want / fear / secret:** want every fare to end well and be paid in cash; fear a flat tyre on a long night; secret that she has never been short of change, and nobody has seen her count it.
- **Arc by act:** I: drives the player to the bank (#2) and joins the Mayor tail (#6); II: side quests only; III: side quests only; IV: side quests only (the Central Bus Stop is always there).
- **Voice (for `src/voice/voices.ts` and lines):** warm, brisk, motherly, mid-speed. Tic: "dear" at the end of every line and the meter mentioned in passing. "Hop in, dear. Meter's already running." / "Suit yourself, dear."
- **Body and visual hook (for a CAST preset):** yellow hat, black coat, silver hair in pigtails, glasses, no beard (preset `mabel`); a change-purse on a belt chain. Leans on the cab door, one hand on the wheel.
- **Vehicle:** the Turfton Taxi (existing taxi vehicle kind; the CAST row lists none because she drives the city's only cab)
- **Home:** a flat over the Kerbstone Cabs garage (home-04, ack) · **Work:** Kerbstone Cabs; the Central Bus Stop kiosk
- **L58 visibility:** acknowledged (seen in quests: #2, #6)
- **Relationships:** Cousin to nobody in town but treated as aunt by everyone; knows Juniper's route and Reginald's; keeps Dot's lunch bench clear; Bramble calls the Central Bus Stop "the only address Mabel knows".

### Farmer Bramble (`bramble`)

- **Role / faction:** Cloverfield grower, Granny's neighbour and drinking partner; Local 404 dues paid.
- **New or existing:** existing (`bramble`)
- **First / last main quest:** #16 ch2-dew-run / #31 m31-granny-cracks
- **Want / fear / secret:** want his double acorns in the barn before Biscuit wakes; fear the sky and what moves across it; secret he knows more of Granny's silo than he lets on (hint only).
- **Arc by act:** I: absent; II: lends the Buck-Iron to the Dew Run and the gauntlet (#16, #18), carries Granny's farmhouse key when HOA bailiffs come (#31); III: absent; IV: stands with the Granny contingent at the overlook camp (#64 final).
- **Voice (for `src/voice/voices.ts` and lines):** low, almost whispering, flat farm vowels. Tic: "Don't look up. Just listen." before any big noise. "Don't look up. ...That's the combine, not the dog." / "Cellar's got peaches."
- **Body and visual hook (for a CAST preset):** brown hat, moss-green shirt, grey-tan beard (preset `bramble`); a dirty work glove. Moves in small steps, glancing up before crossing open ground.
- **Vehicle:** combine (green and gold Buck-Iron Combine, the one everybody borrows)
- **Home:** the bunkhouse at Granny's barn (existing: granny-barn, ack) · **Work:** Granny's fields
- **L58 visibility:** acknowledged (seen in quests: #16, #18, #19, #31)
- **Relationships:** Granny's oldest friend; fears Biscuit; owes Rooster for the barometer that saved his crop; distrusts the HOA's foreclosure men after Granny's chipping.

### Thermos Theo (`theo`)

- **Role / faction:** Roadside fixture at the Frostbite bend, a kind of unofficial innkeeper to the wrecked; no faction.
- **New or existing:** existing (`theo`)
- **First / last main quest:** #36 ch3-kiln-resin-ice / #38 m38-pail-pond
- **Want / fear / secret:** want every spun-out racer back on their feet with tea in hand; fear a day the barrel goes out; secret how the thermos stays full (loose thread).
- **Arc by act:** I-II: absent (side quests only); III: sends the crew up to the Woolly Sock Lodge (#37) and fishes on Pail Pond (#38); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** gentle, slow, rhymy; speaks in short weather-proverbs and offers tea before anything else. "Roads are slick, friend. Clay is brittle." / "Drink. Then tell me."
- **Body and visual hook (for a CAST preset):** grey knitted bobble hat, a quilted tan coat dusted with snow, thin white beard, a battered tin thermos always in one mitten. Walks the same six steps between barrel and road. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** Theo's camp at the bend (existing: theo-camp, ack) · **Work:** the bend's barrel fire and post
- **L58 visibility:** acknowledged (seen in quests: #36, #37, #38)
- **Relationships:** Keeps Shelldon's scrolls; Father Loam's closest neighbour; vouches for the crew to Gentian Bootlace; the Carburettors owe him for half their cracked hats.

### Wind-Sock Wally (`wally`)

- **Role / faction:** Desert Airfield keeper and charter pilot; the Spade Guard's neighbour, answers to nobody.
- **New or existing:** existing (`wally`)
- **First / last main quest:** #46 m46-starfall-at-the-anthill / #64 m64-all-hats (also in #70 as "everyone")
- **Want / fear / secret:** want to log one more perfect takeoff; fear his knees finally going; secret which plane he used to fly (loose thread).
- **Arc by act:** I-II: absent; III: the radio voice that talks the player off Rootwell Field (#46); IV: fetched from the apron (#54), flares (#55), the air force of the coalition (#64 p2), the finale's air cover.
- **Voice (for `src/voice/voices.ts` and lines):** dry, gravelly, sing-song numbers, calls everyone "kid". Tic: quotes a stall speed or wind reading as comfort. "Stall speed's twenty-two, kid. Don't embarrass yourself." / "Wind's nor'-nor'-east. Good."
- **Body and visual hook (for a CAST preset):** brown hat (aviator cap), sand-tan shirt, white beard, glasses (preset `wally`); binoculars and a clipboard. Sits; stands only for something in the air.
- **Vehicle:** plane (the Crop Duster on the apron is his, lent to anyone who can say the stall speed)
- **Home:** a caravan at the airfield apron (existing: airfield-apron, ack) · **Work:** Wally's Charters, Desert Airfield
- **L58 visibility:** acknowledged (seen in quests: #54, #55, #64; heard on the radio in #46)
- **Relationships:** Old friend of Commander Diggs, though neither says so; gives Pip pilot patter; Hogweed builds the mortar rig for his plane.

### Driftwood (`driftwood`)

- **Role / faction:** Castaway-turned-boatman; follows the water. Starts alone, ends with a hut and a following.
- **New or existing:** existing (`driftwood`)
- **First / last main quest:** #18 ch2-sprinkler-gauntlet / #44 m44-the-bathtub-queen
- **Want / fear / secret:** want to reach the open sea; fear he is making it up; secret nothing, only a chart nobody has checked (the answer stays across the water).
- **Arc by act:** I: absent; II: a face at the gauntlet (#18), asks for his raft back from the Flock (#25) and for a tow to the dunes (#32); III: runs his tube hut on Saltbucket Boardwalk (#43) and vouches for Captain Bilge (#44); IV: side quests only; lends the coalition a boat in #64 p1.
- **Voice (for `src/voice/voices.ts` and lines):** dreamy, rambling, sun-baked; sentences wander and arrive somewhere nice. Tic: sea-words for land things ("land's a bit damp, mate"). "Tide's a bell, friend, and you can hear it." / "Sea-foam paint. Pay you in stories."
- **Body and visual hook (for a CAST preset):** teal hat (twine and duct tape, drawn as patina), cream-sand shirt, off-white beard (preset `driftwood`); a shell tucked in the beard. Rocks side to side as if on a deck.
- **Vehicle:** walnut-dinghy (patina teal); his turf-raft on the canal
- **Home:** Driftwood's trailer (existing, ack); a beach hut on Saltbucket Boardwalk from #43 (site:coast, ack) · **Work:** tube hut, Saltbucket Boardwalk
- **L58 visibility:** acknowledged (seen in quests: #18, #25, #32, #43, #44)
- **Relationships:** Owes the Flock nothing; Brenda tolls his raft and likes him; Captain Bilge and Marram Teaspoon become his neighbours; Tessie of Loch Moss is his old, shy friend.

### Baroness Brenda (`brenda`)

- **Role / faction:** Sovereign of the Republic of New Puddle; independent, taxes everyone.
- **New or existing:** existing (`brenda`)
- **First / last main quest:** #11 m11-the-dons-cigars / #64 m64-all-hats
- **Want / fear / secret:** want recognition as a nation; fear an HOA fine for "excessive leisure"; secret where she finds the vinyl webbing (loose thread).
- **Arc by act:** I: takes a toll from the cigar run (#11); II: tolls Driftwood's raft (#32); III: absent; IV: opens New Puddle to the Bathtub Queen (#64 p1).
- **Voice (for `src/voice/voices.ts` and lines):** grand, bright, declamatory, as if reading a proclamation, with the occasional giggle. Tic: begins sentences "By decree." "By decree, one spark plug." / "The Republic notes your hat. Approvingly."
- **Body and visual hook (for a CAST preset):** gold hat (the sun-visor), raspberry-pink dress, glasses, no beard (preset `brenda`); a feather-duster sceptre. Sits on her throne; stands to review troops, hand on hip.
- **Vehicle:** push-bike (glitter-gold, flamingo ornament, kazoo horn)
- **Home:** the Vinyl Lounge throne, New Puddle (existing: brenda-throne, ack) · **Work:** the Sovereign Republic of New Puddle
- **L58 visibility:** acknowledged (seen in quests: #11, #32, #64)
- **Relationships:** Her pink push-bike gang adores her; Don Compost respects her toll; mutual admiration with Captain Bilge; dislikes the HOA with a legal passion.

### Clara (`clara`)

- **Role / faction:** Keeper of the porcelain refuge; leads escaped Tall House gnomes to safety. Faction: the porcelain refugees.
- **New or existing:** existing (`clara`)
- **First / last main quest:** #66 m66-porcelain-hearts / #66 (her plea is carried by Pip's call in #70)
- **Want / fear / secret:** want every cracked gnome to reach the oak stump; fear speed bumps and yellow light; secret she once shared the porch with Vesper, and knows him by his first crack (hint only).
- **Arc by act:** I-III: side quests only (the refugee runs); IV: shows the player Vesper's old hairline crack and asks that he be stopped, not shattered (#66).
- **Voice (for `src/voice/voices.ts` and lines):** soft, hushed, precise, slightly formal; leaves the end of a line unspoken when it hurts. Tic: counts gently ("Four tonight. Four."). "Slowly, please. We break in the small places." / "Stop him. Do not break him."
- **Body and visual hook (for a CAST preset):** white hat, pale pearl-grey dress, very pale porcelain skin, no beard (preset `clara`); a porcelain lantern in hand. Walks as if each step might be her last; never into direct light.
- **Vehicle:** lowrider (pearl white, cosy seat, slammed soft, balloon tyres)
- **Home:** a hollow log by the Tall House porch (existing: tall-house-porch, ack) · **Work:** the porcelain refuge, hollow oak stump
- **L58 visibility:** acknowledged (seen in quests: #66)
- **Relationships:** Protects the refugees; Elder Bracken gives the refuge ground; knows Vesper from the porch and cannot hate him; Sorrel broadcasts her safe-house hours.

### Mossley "Plumb-Line" Inkcap (`mossley`)

- **Role / faction:** Grid-truther surveyor; no faction, a lone prophet of right angles.
- **New or existing:** existing (`mossley`)
- **First / last main quest:** side quests only (no spine row names him)
- **Want / fear / secret:** want every gridline proved; fear the HOA "correcting" the maps; secret the pencil is only the start (loose thread).
- **Arc by act:** I: side quests only; II: side quests only; III: stands in the Turfton street watching the Even-Estates hoardings go up, talking to himself; IV: side quests only.
- **Voice (for `src/voice/voices.ts` and lines):** fast lecturer, rising pitch, shows his work out loud, interrupts himself with measurements. Tic: ends claims with "sixty and sixty". "Sixty and sixty! Nature does not do that." / "The grid is a ruler. Who holds it?"
- **Body and visual hook (for a CAST preset):** blue hat with a survey flag, tan-brown shirt, pale grey beard, glasses (preset `mossley`); a plumb-line. Stops mid-step to sight along a line.
- **Vehicle:** push-bike (blue, windsock and survey flag)
- **Home:** a chalk-marked basement on Kerb Row (hidden) · **Work:** surveyor, his markers
- **L58 visibility:** never shown
- **Relationships:** Warns Burt about the van routes; trades maps with Sal (both watch the culvert); Bodega lets him use the shop step; Juniper takes his surveys seriously and tells nobody.

### Burt (`burt`)

- **Role / faction:** Ex-HOA citation writer; leaks van routes to street crews.
- **New or existing:** existing (`burt`)
- **First / last main quest:** side quests only
- **Want / fear / secret:** want to be paid time-and-a-half, once; fear the Hat Watch finding the scratched badge; secret the old citations he rereads are all addressed to Vesper's own flat (hint only).
- **Arc by act:** I: side quests only; II: side quests only; III: his van routes appear on a Hat Watch map seized in act III (not shown); IV: side quests only.
- **Voice (for `src/voice/voices.ts` and lines):** apologetic mutter, quick, nervous, ends on an "uh". Tic: cites a citation number when anxious. "Citation four-oh-nine. Sorry. Habit." / "Don't use my name. Uh. Use any name."
- **Body and visual hook (for a CAST preset):** slate-grey hat (the HOA logo scratched off), beige shirt, grey beard, glasses (preset `burt`); a clipboard hugged to his chest. Looks over his shoulder at every sound.
- **Vehicle:** hoa-van (decommissioned, in primer, badge scraped off)
- **Home:** a rented room above Clay-Mart (hidden) · **Work:** ex-HOA; the Clay-Mart lot
- **L58 visibility:** never shown
- **Relationships:** Owes Grout a lot of favours; once worked under Reginald and says nothing about him; drinks coffee outside Bodega & Sons beside Cedric and pretends not to know him.

### Cedric "Double-Bag" Peat (`cedric`)

- **Role / faction:** Chapel of Mulch upline recruiter; a pyramid in a van.
- **New or existing:** existing (`cedric`)
- **First / last main quest:** side quests only
- **Want / fear / secret:** want three recruits by Friday; fear the Chapel's quota actually being real; secret his own mulch gives him hives (hint only).
- **Arc by act:** I: side quests only; II: side quests only; III: side quests only; IV: side quests only; he stays himself while everything else changes.
- **Voice (for `src/voice/voices.ts` and lines):** bright, salesman patter at double speed, laughs at his own lines. Tic: "ground-floor opportunity" in every sales sentence. "Ground-floor opportunity, friend! Soil Enlightenment, no wasps!" / "Three friends. That is all."
- **Body and visual hook (for a CAST preset):** purple hat, dark brown shirt, dark brown beard (preset `cedric`); a sample bag in each hand. Walks backward while pitching.
- **Vehicle:** mulch-spreader (glitter purple, leaks craft glitter, bunting)
- **Home:** the rusted Chapel van (existing, ack) · **Work:** Chapel of Mulch recruiter
- **L58 visibility:** acknowledged (seen in quests: side quests; his van parked outside Bodega & Sons)
- **Relationships:** Owes the Chapel of Mulch a quota; Burt's coffee-mate; Bodega pretends not to see him; Ernie sells him the dyed sawdust.

### Shelldon "No-Trail" Mucilage (`shelldon`)

- **Role / faction:** Snail-Mail Express courier; union, in his own slow way.
- **New or existing:** existing (`shelldon`)
- **First / last main quest:** #36 ch3-kiln-resin-ice / #36
- **Want / fear / secret:** want every scroll delivered with the snails' blessing; fear the paved road; secret the snails do not believe in time, and he is quietly their employee (loose thread).
- **Arc by act:** I-II: side quests only; III: the snail whose scroll from Tansy reaches the crew in the Fells (#36); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** CAPS-LOCK calm, slow, monotone, treats nonsense as a settled fact. Tic: ends with "man" or "..." and goes back to his snail. "THE GRID IS A TALL-ONE CIRCUIT BOARD, MAN." / "THE SNAIL KNOWS. I JUST CARRY."
- **Body and visual hook (for a CAST preset):** grey-green hat, dark moss shirt, glasses, no beard (preset `shelldon`); a courier satchel across the chest. Moves slowly; never on a paved road.
- **Vehicle:** snail-coach (retired, lives in it, never leaves the alley)
- **Home:** a den behind the dumpsters in his alley (existing: shelldon-alley, ack) · **Work:** snail-post courier
- **L58 visibility:** acknowledged (seen in quests: #36)
- **Relationships:** Theo holds his scrolls; Tansy trusts only his network; Sorrel quotes him on air; the snails come first.

### Squeaky-Clean Midge (`midge`)

- **Role / faction:** Glaze Clinic intern; the city's emergency glue, no faction.
- **New or existing:** existing (`midge`)
- **First / last main quest:** #31 m31-granny-cracks / #31
- **Want / fear / secret:** want every crack mended before it sets; fear quiet; secret how many espresso-acorns it takes (loose thread).
- **Arc by act:** I: side quests only; II: glues Granny (#31); III: side quests only; IV: waits at the clinic doors with a bucket on the last night.
- **Voice (for `src/voice/voices.ts` and lines):** breathless, rapid-fire, bubbly, no pauses; sentences end mid-thought because the next is already coming. Tic: counts in beats per minute. "A hundred forty! Stay still! Peppermint!" / "Claim denied! Glued, though!"
- **Body and visual hook (for a CAST preset):** twin-straw espresso-acorn helmet, white nurse coat flecked with slip, no beard, huge round glasses, a heat gun in one hand. Vibrates; paces at 140 BPM. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the nurses' dorm at the Glaze Clinic (hidden) · **Work:** Glaze Clinic Hospital
- **L58 visibility:** acknowledged (seen in quests: #31)
- **Relationships:** Granny becomes her favourite patient; Mabel brings her fares; Pip is her most frequent customer; Cam once sat in her waiting room.

### Gate-Guard Gary (`gary`)

- **Role / faction:** Patio Heights sentry; HOA, the unambitious kind.
- **New or existing:** existing (`gary`)
- **First / last main quest:** #12 m12-quarter-inch-at-home / #21 m21-penthouse-viewing
- **Want / fear / secret:** want a dry stool and no incidents; fear page 412 (loose thread); secret he has read four pages in total.
- **Arc by act:** I: the gate the player must pass to reach Reginald's door (#12); II: waves the player through to the Penthouse Viewing, sighs when Cam arrives in a vest (#21); III: absent; IV: side quests only.
- **Voice (for `src/voice/voices.ts` and lines):** bored, nasal, bureaucratic, cites section numbers of a book he has not read. Tic: sighs before every sentence. "Sigh. Section nine. Hats must be level." / "Wave through. Do not smoke."
- **Body and visual hook (for a CAST preset):** a beige HOA cap squashed flat, beige jacket with a citation pad in the pocket, round glasses, a tea-stained brown beard, a very thick binder under one arm. Never leaves the stool. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the gatehouse at the Patio Gate (existing: patio-gate, ack) · **Work:** the Patio Gate
- **L58 visibility:** acknowledged (seen in quests: #12, #21)
- **Relationships:** Waves Reginald through every morning; barely tolerates Cam on the same gate; Vesper's driveway is the only thing he fears; Brenda's gang is his nightmare.

### Rooster "Squall-Box" Weatherby (`rooster`)

- **Role / faction:** Windmill prophet and weather caller; follows no faction, shouts at all of them.
- **New or existing:** existing (`rooster`)
- **First / last main quest:** #18 ch2-sprinkler-gauntlet / #19 m19-squall-box-forecast
- **Want / fear / secret:** want one forecast to land exactly; fear the barometer sticking at "Fair"; secret that he is right more often than he is believed.
- **Arc by act:** I: absent; II: shouts the gauntlet's conditions (#18), moves three barometers and predicts the white hat at the diner (#19); III: absent; IV: shouts one correct prophecy at the finale from his mill.
- **Voice (for `src/voice/voices.ts` and lines):** SHOUTED, high, through a tin funnel; one forecast per sentence; every line sounds like an alarm. Tic: ends with "...WITH A CHANCE OF PORCELAIN." "THE BAROMETER IS DROPPING!" / "WHITE HAT AT THE DINER! TUESDAY, MAYBE!"
- **Body and visual hook (for a CAST preset):** tinfoil-lined cap with a weather-vane on top, rain-cloud grey coat, wild beard, tin funnel on a cord. Perches; flaps his arms to emphasise wind. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the Squall-Box windmill (existing: rooster-windmill, ack) · **Work:** his forecasts
- **L58 visibility:** acknowledged (seen in quests: #18, #19)
- **Relationships:** Granny feeds him seed; Bramble reads his barometers; the Blade's request line gets his calls; Wally and he swap wind readings by radio.

### Fence-Post Frank (`frank`)

- **Role / faction:** Highway watcher; informal neutral, knows every engine by ear.
- **New or existing:** existing (`frank`)
- **First / last main quest:** #13 m13-diner-on-route-south / #29 m29-the-kicked-board
- **Want / fear / secret:** want a quiet road and a clean hotwire; fear a silence that lasts all day; secret the sign says more than he does (hint only).
- **Arc by act:** I: names Granny at the diner (#13); II: sends the player to the Kicked Board after hearing golf balls over the fence (#29); III: side quests only; IV: side quests only.
- **Voice (for `src/voice/voices.ts` and lines):** slow drawl, long vowels, grass blade between his teeth; reviews the engine before the person. Tic: appreciative grunt after naming a model. "Buck-Iron. Slipping belt. ...Nice." / "Granny Gnertrude. Only one Vesper cannot buy."
- **Body and visual hook (for a CAST preset):** a floppy brown felt hat, patched denim coat, stubble, a timothy grass blade in his mouth. Leans on his hand-painted sign; shifts the blade, never his feet. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** a shack behind the south welcome sign (home-07, ack) · **Work:** watching the highway; the diner counter
- **L58 visibility:** acknowledged (seen in quests: #13, #29)
- **Relationships:** Eats every meal at the diner and Sage cooks it silently; Granny is the one he would never name a rig of; Gary is his idea of a bad road; Rooster's neighbour on the wind.

### Ash-Shovel Ernie (`ernie`)

- **Role / faction:** Compost Heap stoker; works for whoever pays in clippings, which is the HOA now.
- **New or existing:** existing (`ernie`)
- **First / last main quest:** #27 m27-heap-of-trouble / #69 m69-the-combine-wakes
- **Want / fear / secret:** want the furnace to burn and the old songs to come back; fear remembering the words; secret where he learned them (loose thread: Mossy Wood).
- **Arc by act:** I-II: side quests only; II: raises the alarm about the plates leaving at night (#27); III: hums as the plates go by; IV: calls the player as the Combine leaves the Heap (#69).
- **Voice (for `src/voice/voices.ts` and lines):** warm, gruff, trails off into humming mid-sentence, repeats the last word of a phrase. Tic: roasts a chestnut as a full stop. "Plates. ...Plates, leaving. Hmm hmm, hm." / "Chestnut? Tastes of petrol. Better."
- **Body and visual hook (for a CAST preset):** soot-grey flat cap, scorched leather apron over a faded red shirt, soot-tinted beard, a trowel as spatula. Stoops at the furnace; rocks to his own tune. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the furnace room at the Compost Heap (existing: compost-heap, ack) · **Work:** the Compost Heap furnace
- **L58 visibility:** acknowledged (seen in quests: #27, #69)
- **Relationships:** Sells dyed sawdust to Cedric without asking; Tansy brings him spare gaskets; Chard Levelright's crews eat his chestnuts; the Heap's welders ignore him.

### Knot-Hole Nora (`nora`)

- **Role / faction:** Fence-Line lookout; reports on the neighbour's yard, belongs to no one.
- **New or existing:** existing (`nora`)
- **First / last main quest:** side quests only (her knot-hole is visited in #26 as a place, she does not speak)
- **Want / fear / secret:** want to keep Turfton from worrying; fear the day something looks back; secret what she saw with the yellow thing, and whether it was a bicycle wheel (loose thread: never answered).
- **Arc by act:** I-III: side quests only; IV: side quests only; she is the lookout who never leaves her post.
- **Voice (for `src/voice/voices.ts` and lines):** whispered, clipped, reports like a diary entry, a pause between every observation. Tic: opens with the day of the week. "Thursday. Pink bird. Taller than the tower." / "Nothing out there. ...Nothing."
- **Body and visual hook (for a CAST preset):** a green knitted cap pulled low, olive scarf and patched coat, long grey beard tucked in, a brass spyglass. Sits on an overturned thimble and does not stand. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the Knot-Hole (existing: knot-hole, ack) · **Work:** (as her lore says: the lookout at the Fence-Line Overlook)
- **L58 visibility:** acknowledged (seen in quests: #26 as a place, side quests)
- **Relationships:** Racers bring her acorns; Pip's one visit is her only company; Sorrel records the rain at her gap; the Flock of the One Leg may have a friend she will not name.

### Silt-Diver Sal (`sal`)

- **Role / faction:** Under-Deck scavenger and drain guide; trades in maps.
- **New or existing:** existing (`sal`)
- **First / last main quest:** #39 m39-couch-surfing / #39
- **Want / fear / secret:** want clean socks and dry matches; fear Grate 22; secret what came out of the deepest pipe under Thorne Tower (loose thread).
- **Arc by act:** I-II: side quests only; III: hides Tansy in the culvert and helps regroup the crew (#39); IV: side quests only.
- **Voice (for `src/voice/voices.ts` and lines):** raspy, wet, trader's patter, lists items as he names them, bargains in every sentence. Tic: "for a pair of clean socks". "Two cola tabs, one badge. For clean socks, the map." / "Grate fourteen. Quiet. Too quiet."
- **Body and visual hook (for a CAST preset):** colander helmet, rubber waders, yellow slicker, a damp ginger beard, a magnet on a string. Crouches; fishes without looking. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the Under-Deck culvert (existing: culvert-under-deck, ack) · **Work:** salvage diving
- **L58 visibility:** acknowledged (seen in quests: #39)
- **Relationships:** Mossley watches the same culvert; Tansy owes him dry socks; Hogweed buys his scrap; Grout trusts his drain maps.

### Neon-Moth Nina (`nina`)

- **Role / faction:** Greenhouse Strip night vendor and street lookout; the racers' informant.
- **New or existing:** existing (`nina`)
- **First / last main quest:** side quests only
- **Want / fear / secret:** want the Strip glowing and the moth off the sign; fear the lamps going out; secret what the Morse in the neon really spells (hint only).
- **Arc by act:** I: side quests only; II: side quests only; III: side quests only; IV: side quests only; she sells glow-bands for the finale's coalition torches.
- **Voice (for `src/voice/voices.ts` and lines):** conspiratorial stage-whisper, quick, sing-song, drops gossip then winks. Tic: ends tips with "you didn't hear it from me". "Alley three. Watch is not checking. You didn't hear it from me." / "Glow-band, one acorn. Barnaby Jr. approves."
- **Body and visual hook (for a CAST preset):** violet hat, near-black shirt, neon-green pigtails, no beard (preset `nina`); glow-sticks and a broom. Taps the broom to a rhythm; half-turned toward the Gnomecino sign.
- **Vehicle:** push-bike (fairy lights, glow tyres, violet underglow)
- **Home:** the Greenhouse Strip (existing: greenhouse-strip, ack) · **Work:** the Gnomecino floor
- **L58 visibility:** acknowledged (seen in quests: side quests only)
- **Relationships:** Big Lou keeps her stoop dry; Dot hands her client jobs; the Carburettors buy bands before every race; the moth Barnaby Jr. is her enemy.

### Dorrit "Dot" Pennywort (`dot`)

- **Role / faction:** Runs the Kerbside Exchange job board; neutral to all, pins everyone's jobs.
- **New or existing:** existing (`dot`)
- **First / last main quest:** side quests only
- **Want / fear / secret:** want the board never empty; fear a stop she cannot call; secret who pays her in gossip (loose thread).
- **Arc by act:** I: pins the player's first city contracts; II: side quests only; III: board stays up while the crew is away; IV: pins the coalition's public notices.
- **Voice (for `src/voice/voices.ts` and lines):** crisp, brisk, conductor's call, every sentence a stop. Tic: "Next!" and a punched ticket. "Next! Fares, please. Job nine, Hedda's." / "The city pays me in gossip."
- **Body and visual hook (for a CAST preset):** navy hat (conductor's cap), brick-red shirt, dark trousers, grey pigtails, glasses, no beard (preset `dot`); a ticket stub and punch. Stamps and punches; sits only for lunch.
- **Vehicle:** none
- **Home:** a room over the Kerbside Exchange (hidden) · **Work:** the Kerbside Exchange
- **L58 visibility:** acknowledged (seen in quests: side quests; her desk at the bus stop)
- **Relationships:** Hands out Nina's, Hedda's, Grout's and Pip's jobs; lunches on the bus-stop bench beside Mabel's taxi; keeps Burt's name off the board.

### Hedda Galley (`hedda`)

- **Role / faction:** Editor of the Turfton Tattler; press, loyal to the story.
- **New or existing:** existing (`hedda`)
- **First / last main quest:** #15 ch1-founders-boot / #67 m67-emergency-assessment
- **Want / fear / secret:** want the front page; fear a correction; secret nobody has seen her face on the masthead (loose thread: she is never photographed).
- **Arc by act:** I: gives the player the float keys' location in the parade office (#15 p1); II: prints Juniper's permits only if Reginald confirms (#28); III: absent; IV: holds the Tattler Building for the emergency assessment (#67).
- **Voice (for `src/voice/voices.ts` and lines):** clipped headlines, no verbs, clipped like telegrams, always present tense. Tic: names the story like a banner. "Penthouse. Exclusive. Tonight." / "Mayor missing. Permits found. Reginald mum."
- **Body and visual hook (for a CAST preset):** black hat, cream shirt, dark brown pigtails, glasses, no beard (preset `hedda`); a pencil behind one ear. Never stops walking; never appears in a photograph.
- **Vehicle:** none
- **Home:** a flat high in the Tattler Building (hidden) · **Work:** the Turfton Tattler
- **L58 visibility:** acknowledged (seen in quests: #15, #28, #67)
- **Relationships:** Juniper's best contact in the press; Reginald is her one unconfirmed source; Dot hands her jobs; Vesper cannot buy her ink.

### "Big Wrench" Grout (`grout`)

- **Role / faction:** Head of Local 404; union boss, enemy of drones.
- **New or existing:** existing (`grout`)
- **First / last main quest:** #10 m10-under-the-span / #10 (cast mention, side quests)
- **Want / fear / secret:** want his mechanics paid in real acorns; fear a drone in the yard; secret the Black Dew in his cola is a rumour he started (hint only).
- **Arc by act:** I: his union citation names the Underspanners' "unauthorised verticality" (#10); II: side quests only; III: side quests only; IV: side quests only.
- **Voice (for `src/voice/voices.ts` and lines):** dockworker growl, slow, grammar loose, speaks in "we". Tic: "Local 404 says". "Local 404 says no. Forty-eight hours." / "Pay in acorns. Real ones."
- **Body and visual hook (for a CAST preset):** slate-blue hat, olive-green shirt, dark brown beard (preset `grout`, the biggest build); a pipe wrench heavier than most bikes. Sits on the loading dock with a thermos.
- **Vehicle:** none
- **Home:** the back room of the Local 404 Union Hall (hidden) · **Work:** Local 404, the Skyway
- **L58 visibility:** acknowledged (seen in quests: #10; the Clay-Mart returns yard in side quests)
- **Relationships:** Dot's client; Burt owes him; Hogweed's citation lands on his desk; Tansy pays her dues; Don Compost does not cross him.

### Reeve Yarrow Potsherd (`yarrow`)

- **Role / faction:** Reeve of Pebblewick; town council, neutral until the HOA cuts the water.
- **New or existing:** existing (`yarrow`)
- **First / last main quest:** #58 m58-the-reeves-barn / #61 m61-diggs-medal
- **Want / fear / secret:** want the pump fixed and the minutes kept; fear the HOA's cut-off notice; secret the town's ledger is thinner than the council knows (hint only).
- **Arc by act:** I-III: absent; IV: offers the hay barn for the Whirligig (#58) and hosts Diggs's medal run (#61).
- **Voice (for `src/voice/voices.ts` and lines):** formal, patient, council-minutes diction, speaks in careful clauses and thanks you for your patience. Tic: "Noted." "Noted. The barn is yours, with conditions." / "Pebblewick thanks you. In writing."
- **Body and visual hook (for a CAST preset):** a tall grey felt hat with a council band, brown waistcoat and watch chain, neat white beard, a ledger book. Stands upright, hands folded over the ledger. (new preset, invented: no `cast.ts` entry yet)
- **Vehicle:** none
- **Home:** the reeve's house on Pebblewick square (existing, ack) · **Work:** Pebblewick
- **L58 visibility:** acknowledged (seen in quests: #58, #61)
- **Relationships:** Diggs is his old neighbour; Pip's cheerful cousin to the town; Hogweed's pump part earns the town's water; the Weeping Line is his town's sorrow.

## New cast (batch 3)

### Hyssop Doormat (`hyssop`)

- **Role / faction:** The player's nosy neighbour at Saucer Court, flat 3A. Retired lollipop-crossing warden. Neutral, then a quiet friend.
- **New or existing:** new (CAST key `hyssop` to add)
- **First / last main quest:** #2 m02-roof-on-credit / #69 m69-the-combine-wakes (also #39, #68)
- **Want / fear / secret:** want a quiet stairwell and to be first to know everything; fear that anyone new means a rent rise; secret she once stopped all traffic on Kerb Row for a whole afternoon with her paddle, for no reason, and nobody argued.
- **Arc by act:** I: watches the player move in and logs the hours they come home; II: a face at the window; III: suspicious of Pip on the couch, posts a "NO LODGERS" note, then covers for the crew when HOA men knock; IV: stands in the stairwell with her paddle up when the Combine's evacuation sweep comes through.
- **Voice (for `src/voice/voices.ts` and lines):** Quick, clipped, rising at the end of every sentence like a question; counts things aloud; says "for the record". "For the record, that is the third door slam since Tuesday?" / "Stop. Look. Listen. Then explain yourself?"
- **Body and visual hook (for a CAST preset):** Hi-vis yellow bobble hat, round and flat-topped; mustard cardigan over a dress; no beard; reading glasses on a chain; carries a round red stop paddle; moves in short sharp steps, head turning before the body.
- **Vehicle:** none
- **Home:** Saucer Court flat 3A (apartment, ack) · **Work:** retired lollipop-crossing warden; watches the stairwell
- **L58 visibility:** acknowledged (seen in quests: #2, #39, #68, #69)
- **Relationships:** Distrusts Pip on sight and softens when he fixes her radiator. Nods to Gary at the Patio Gate and rides with Mabel to the clinic. Owes the player nothing and insists on it, which is how you know she does.

### Parsley Inkpot (`parsley`)

- **Role / faction:** Loan officer at the First Kiln Bank. Bank; his accounts run through the HOA.
- **New or existing:** new (CAST key `parsley` to add)
- **First / last main quest:** #2 m02-roof-on-credit / #2 m02-roof-on-credit (side quests later)
- **Want / fear / secret:** want every form signed in the right ink; fear a customer who reads the small print aloud; secret he is sorry about the flat's loan and set the interest one notch under the usual.
- **Arc by act:** I: signs the player into flat 3B and adds 1,500 Acorns to the Kiln-Debt; II: absent; III: absent; IV: absent (later side quests may bring him back).
- **Voice (for `src/voice/voices.ts` and lines):** Slow, soft, apologetic bank-speak; ends sentences with "as it were"; never raises his voice. "This is merely a formality, as it were. A long one." / "Please initial where the pen has bled."
- **Body and visual hook (for a CAST preset):** Tall narrow charcoal hat with a flat brim; grey waistcoat; short grey beard trimmed square; half-moon glasses; inked thumb; carries a rubber stamp; moves stiffly and stamps before he speaks.
- **Vehicle:** none
- **Home:** a bedsit off the bank's back stair (hidden) · **Work:** First Kiln Bank
- **L58 visibility:** never shown
- **Relationships:** Answers to the bank's board and, behind it, the HOA. Knows Mabel, whose cab brings every new borrower. Fears the Don's lawyers, who pay in cigars.

### Chard Levelright (`chard`)

- **Role / faction:** Foreman of Levelright Construction, building Thorne Even-Estates. HOA contractor, not a believer.
- **New or existing:** new (CAST key `chard` to add)
- **First / last main quest:** #7 m07-even-estates / #69 m69-the-combine-wakes (also #15)
- **Want / fear / secret:** want one job he can be proud of; fear a spirit level that reads wrong; secret every house he builds is level to the hair and he has never seen anyone live in one.
- **Arc by act:** I: the player cracks his night-watch; his watchmen chase the Boot float through the site; II: absent; III: absent; IV: in #69 he realises he built for nobody and walks his crews out ahead of the Combine.
- **Voice (for `src/voice/voices.ts` and lines):** Slow, flat, gravelly; pauses mid-sentence to check something by eye; uses site words ("true", "plumb", "out of square"). "That wall is out of square. Everything else is fine." / "Nobody asked me who it was for."
- **Body and visual hook (for a CAST preset):** Beige hard hat, round, with a pencil behind the brim; orange safety vest over a brown coat; thick grey beard; spirit level under one arm; moves in a heavy, level-footed plod.
- **Vehicle:** none (rides in a Levelright `hoa-van` when working)
- **Home:** a site caravan at the nearest Even-Estates site (site:construction-1, ack) · **Work:** Levelright Construction, Thorne Even-Estates
- **L58 visibility:** acknowledged (seen in quests: #7, #15, #69)
- **Relationships:** Works for Vesper and does not like him. Shares a dull respect with Reginald, who signs his permits. Fears the night-watch men, who are paid more than he is.

### Cardoon "Swish" Trowelly (`cardoon`)

- **Role / faction:** Drainpipe Court regular, hustler with a heart. Independent.
- **New or existing:** new (CAST key `cardoon` to add)
- **First / last main quest:** #14 m14-drainpipe-court / #14 m14-drainpipe-court
- **Want / fear / secret:** want to be called a pro by someone who has seen a pro; fear the court closing before anyone learns his name; secret he keeps Pip's toolbox clean and oiled and never meant to keep it.
- **Arc by act:** I: wins Pip's toolbox on a bet and loses it back to the player in a game to 7; II: absent; III: absent; IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Fast, rhythmic, sing-song patter; calls everyone "chief"; commentates his own shots. "Swish. That's me. That's the whole name." / "Chief, you're dribbling like it owes you money."
- **Body and visual hook (for a CAST preset):** Teal pointed cap worn backwards, floppy; cut-off sleeves and a numbered vest; short pointed beard; a rubber ball always spinning on one finger; moves in a bounce on the balls of the feet.
- **Vehicle:** none (push-bike for errands)
- **Home:** a flat over the laundrette by the court (hidden) · **Work:** Drainpipe Court (unofficial)
- **L58 visibility:** never shown
- **Relationships:** Friendly rival to Pip, who owes him. Has a standing argument with Fennel over who owns the neighbourhood's best bounce. Owes the laundrette two months.

### Fennel Gripwax (`fennel`)

- **Role / faction:** Gutter Bowls skater who feeds strays; delivers for Bodega. Independent.
- **New or existing:** new (CAST key `fennel` to add)
- **First / last main quest:** #9 m09-where-asphalt-sleeps / #9 m09-where-asphalt-sleeps
- **Want / fear / secret:** want to land the one trick nobody has landed on the Gutter Bowls; fear a stray going hungry; secret he has never dared to ask Asphalt what the bottlecap is for.
- **Arc by act:** I: shows the player the line that gets the cap back; II: absent; III: absent; IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Mumbled, laid-back, trails off; says "dude" only to cats; says "ah well" after any fall. "Asphalt's fine. She's just got standards." / "Ah well. Again."
- **Body and visual hook (for a CAST preset):** Lime-green beanie, slouchy; oversized grey hoodie; no beard, freckles; knee pads; a skateboard under one arm; moves in a loose shuffle that turns into a glide.
- **Vehicle:** none (a skateboard, on foot)
- **Home:** a hammock under the Gutter Bowls' deck (site:skate-park, ack) · **Work:** the Gutter Bowls; delivers for Bodega
- **L58 visibility:** acknowledged (seen in quests: #9)
- **Relationships:** Delivers for John Bodega and loves Asphalt. Argues amiably with Cardoon. Fears one thing: the Gutter Bowls being resurfaced.

### Hogweed Sprocket (`hogweed`)

- **Role / faction:** Leader of the Underspanners, radical inventor. Outsider; coalition member.
- **New or existing:** new (CAST key `hogweed` to add)
- **First / last main quest:** #10 m10-under-the-span / #64 m64-all-hats (also #33, #56)
- **Want / fear / secret:** want to prove a gnome can build anything if nobody asks permission; fear a citation for "unauthorised verticality" that sticks; secret the Dewdrop is not a toy and the Underspanners are not sure what happens above ten miles an hour.
- **Arc by act:** I: trades the player a radio jammer for three salvage parts and rolls the Dewdrop past (#10); II: builds the bench lock for the Golden Acorn (#33); III: absent; IV: fits the Whirligig with a door mortar and a parachute rig that "almost certainly opens" (#56), brings the Underspanners to the airfield (#64).
- **Voice (for `src/voice/voices.ts` and lines):** Breathless, enthusiastic run-ons that jump between three ideas; forgets the end of his sentence and waves a spanner. "It works! Probably! Stand over there. Further." / "A rule is only a prototype nobody tested."
- **Body and visual hook (for a CAST preset):** Welding-goggle cap, round, perched on a mop of rust-orange hair; leather apron full of spare parts; singed ginger beard; a wrench on a string; moves in jumps and darts, stopping dead to stare at a mechanism.
- **Vehicle:** the Dewdrop (a clear rolling ball; use `teacup-trundler` as stand-in until E18 builds it)
- **Home:** a workshop-hammock in the Underspan (site:skyway-society, ack) · **Work:** the Underspan workshops
- **L58 visibility:** acknowledged (seen in quests: #10, #33, #56, #64)
- **Relationships:** Cheerfully at odds with Big Wrench Grout, who thinks the Skyway is union work. Likes Pip because Pip always says yes to a bad idea. Fears nobody, except a wind from the wrong side.

### Lugnut Lulu (`lulu`)

- **Role / faction:** Captain of the Carburettors, Turfton's lowrider club. Already races in the Fizz Cup.
- **New or existing:** new (CAST key `lulu` to add; already a `RaceRival` in `games/gnome-theft-auto/src/quests/races.ts`)
- **First / last main quest:** #5 m05-sweepers-wages / #64 m64-all-hats (also #30, #40, #41, #42, #70)
- **Want / fear / secret:** want the Carburettors to stay loud and unchartered; fear the HOA charter that would make them a licensed club; secret she keeps her late mother's wheel-trim in the glovebox and has never raced without it.
- **Arc by act:** I: wins in front of Cam at the night meet and sees him stare at her charter plate (#5); II: laughs at Cam's loss at the Speedway (#30); III: refuses the HOA charter, sets the Capwood Run, springs the Rutbottom impound (#40, #42); IV: convoys the Carburettors from Rutbottom to the overlook (#64) and drives support at the finale (#70).
- **Voice (for `src/voice/voices.ts` and lines):** Loud, deep, easy; teases everyone; short punchy sentences and a laugh that arrives early. Her race taunts stay: "Carburettors run this town. Low and loud!" / "Nice hop. Shame about the rest."
- **Body and visual hook (for a CAST preset):** Orange hat (0xff6a00), sleek and low-crowned; black dress (0x1a1a1a); no beard; wheel-trim brooch; leather gloves; moves in a swagger with her thumbs hooked in her belt.
- **Vehicle:** lowrider
- **Home:** a converted car-wash bay at the Lost & Found Speedway (existing:speedway, ack) · **Work:** the Carburettors; Rutbottom in summer
- **L58 visibility:** acknowledged (seen in quests: #5, #30, #40, #42, #64, #70)
- **Relationships:** Loves her crew and keeps their tabs. Friendly rival to Clary Mudguard, who marshals her races. Watches Cam with small, worried contempt; she saw his envelope first.

### Sage Ladle (`sage`)

- **Role / faction:** Cook and owner of the Route South Acorn Diner; chef-job employer. Neutral, everyone's friend.
- **New or existing:** new (CAST key `sage` to add)
- **First / last main quest:** #13 m13-diner-on-route-south / #20 ch2-vespers-offer (silent)
- **Want / fear / secret:** want the rush to go well and the kitchen to stay clean; fear a health inspector with a ruler; secret she serves Vesper every Thursday at the corner booth and has never said a word to him.
- **Arc by act:** I: pays the player's debt in a meal and asks for a hand at the rush (#13); II: behind the counter, silent, as Vesper makes his offer (#20); III: absent; IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Warm, low, short; calls everyone "love"; speaks mostly in food and orders; goes silent when angry. "Sit, love. You can pay with the plate." / "Order up. Don't eat the garnish. It's decorative."
- **Body and visual hook (for a CAST preset):** White chef's hat, tall and slightly floppy; stained apron over a grey dress; no beard; a ladle in her belt; moves in tight, efficient spins around a hot pan.
- **Vehicle:** none
- **Home:** the room above the diner (existing:south-highway-diner, ack) · **Work:** the diner kitchen
- **L58 visibility:** acknowledged (seen in quests: #13, #20)
- **Relationships:** Fence-Post Frank has the corner stool at her counter. Tansy owes her forty breakfasts. Wary of Vesper, who is polite and tips the most.

### Chicory Snips (`chicory`)

- **Role / faction:** Head gardener at Trellisdown Vineyard. Serves the Brassknocks; sympathetic, trapped.
- **New or existing:** new (CAST key `chicory` to add)
- **First / last main quest:** #17 m17-the-dew-buyer / #65 m65-the-countess-relents (also #50)
- **Want / fear / secret:** want the vines to outlive the family; fear a frost that takes the first vine; secret he burned Granny's stolen Dew in the frost-pots on the Countess's order and has not forgiven himself.
- **Arc by act:** I: absent; II: burns the stolen Dew in the frost-pots in the player's view (#17); III: lets the player slip out past the guards at the tasting (#50); IV: helps the Countess move her first vine to safety (#65).
- **Voice (for `src/voice/voices.ts` and lines):** Dry, precise, melancholy; talks to plants before people; ends sentences with a small sigh. "This vine is older than the manor. It knows." / "Mind the frost-pots. They are all I am allowed to light."
- **Body and visual hook (for a CAST preset):** Moss-green flat cap, worn low; brown gardener's coat with clippings in the pockets; short white beard; shears on a lanyard; moves in careful slow strides, pausing to straighten a tendril.
- **Vehicle:** `barrow-buggy` on the estate
- **Home:** the gardener's lodge at the vineyard gate (site:vineyard, ack) · **Work:** Trellisdown Vineyard
- **L58 visibility:** acknowledged (seen in quests: #17, #50, #65)
- **Relationships:** Loyal to the Countess and afraid of her. Loves the vines more than any gnome. Owes Granny an apology he cannot say.

### Countess Wisteria Brassknock (`wisteria`)

- **Role / faction:** Old money; secret backer of the HOA; owner of Brassknock Manor. Antagonist, then ally.
- **New or existing:** new (CAST key `wisteria` to add)
- **First / last main quest:** #17 m17-the-dew-buyer / #70 ch5-even-cut (also #50, #52, #65)
- **Want / fear / secret:** want Trellisdown to stay hers and quiet; fear being known as the one who paid for the Combine; secret she did not understand what the Combine was for until she saw the Even Line, and funded it for six years anyway.
- **Arc by act:** I: absent; II: glimpsed on the manor terrace with an HOA clipboard (#17); III: hosts the grape-dew tasting for backers (#50) and stands beside Vesper on the terrace at the test cut (#52); IV: learns the Even Line crosses her vines, gives the crew the key to the Combine's shield grates for her first vine's safety (#65), sends word at the finale (#70).
- **Voice (for `src/voice/voices.ts` and lines):** Slow, grand, drawn-out vowels; speaks of herself in the third person when angry; never asks, only observes. "One does not apologise. One adjusts the arrangements." / "Mind the vine, dear. It was here first."
- **Body and visual hook (for a CAST preset):** Wide purple hat with a wisteria spray, brim drooping; dove-grey gown with a brass key at the throat; no beard, silver curled hair under the hat; opera glasses on a stick; moves in a slow glide, turning only her head.
- **Vehicle:** `lowrider` (a chauffeured long-wheelbase limousine, seen only at the manor)
- **Home:** Brassknock Manor (site:mansion, ack, interior) · **Work:** Trellisdown Vineyard (grape-dew)
- **L58 visibility:** acknowledged (seen in quests: #17, #50, #52, #65)
- **Relationships:** Vesper's patron and equal; she thinks she holds the leash. Chicory is her servant and her conscience. Owes the Brassknock name to a vine and nothing else.

### Mother Saxifrage Wader (`saxifrage`)

- **Role / faction:** Leader of the Flock of the One Leg at Wader's Rest. Outsider; prophet.
- **New or existing:** new (CAST key `saxifrage` to add)
- **First / last main quest:** #25 m25-one-leg-to-stand-on / #51 m51-the-flock-stands
- **Want / fear / secret:** want the Standing Lady kept upright and the Flock on one leg, in time; fear a Tuesday with nothing foretold; secret her prophecies are real and she has no idea how she knows them.
- **Arc by act:** I: absent; II: returns Driftwood's raft if the player stands through her sermon, names "the Even Cut, on the longest day" (#25); III: persuaded to move the Standing Lady to safety and gives the test date (#51); IV: the Flock stands at the overlook camp (#64).
- **Voice (for `src/voice/voices.ts` and lines):** Slow, sing-song, ritual; ends lines with "so it is stood"; speaks as if reading a very long list. "Stand with me. Not both feet. One is plenty, so it is stood." / "It is foretold. It is also Tuesday."
- **Body and visual hook (for a CAST preset):** Tall pink conical hat with a feather; flowing pink robe; long white-pink beard; a hooked staff; stands on one leg whenever still and hops between points.
- **Vehicle:** none (the Flock's flatbed in #51 is a plot prop)
- **Home:** the big tent at Wader's Rest (site:cult-camp, ack) · **Work:** the Flock
- **L58 visibility:** acknowledged (seen in quests: #25, #51)
- **Relationships:** Devout to the Standing Lady, whom she loves best. Keeps Driftwood's raft as leverage for a sermon audience. Fears the Even Cut and is the only one who says so aloud.

### Nubbin (`nubbin`)

- **Role / faction:** A small young mole, the player's friend among the Burrowfolk. Runner for Loamdeep's post.
- **New or existing:** new (CAST key `nubbin` to add)
- **First / last main quest:** #24 m24-the-burrow-door / #60 m60-the-moles-dig (also #48, #49)
- **Want / fear / secret:** want to deliver one letter all the way and be thanked; fear the surface and anyone with a spade; secret he is the mole who moved Basil's ball on the ninth green, to save it from a sprinkler.
- **Arc by act:** I: absent; II: chased through Mossy Wood and driven home by the player (#24); III: found under the ninth green and shown to Basil (#48), meets the player again in Loamdeep (#49); IV: guides the tunnel diggers under Fort Sandpit (#60).
- **Voice (for `src/voice/voices.ts` and lines):** Tiny, soft, formal; very polite ("if you please", "most kind"); squeaks on long words; speaks in small tidy sentences and bows to the player. "If you please, the post is late. I am sorry for it." / "Oh. Most kind. I shall carry it with care."
- **Body and visual hook (for a CAST preset):** No hat (moles do not wear hats); small satchel across one shoulder with a brass buckle; round velvet-grey body, pink nose, tiny spectacles; moves in hurried scampers and stops to sniff the air.
- **Vehicle:** none
- **Home:** his family's burrow in Loamdeep (mole halls, ack) · **Work:** runner for Loamdeep's post
- **L58 visibility:** acknowledged (seen in quests: #24, #48, #49, #60)
- **Relationships:** Loves his mother and calls Old Mother Tumblesoil "Ma'am". Counts the player a friend. Terrified of Basil Divot until he is not.

### Old Mother Tumblesoil (`tumblesoil`)

- **Role / faction:** Matriarch of the Burrowfolk; keeps Loamdeep. Ally.
- **New or existing:** new (CAST key `tumblesoil` to add)
- **First / last main quest:** #24 m24-the-burrow-door / #70 ch5-even-cut (also #48, #49, #52, #60, #64)
- **Want / fear / secret:** want her people left in peace and asked, once, for help; fear the day the surface mows over the halls; secret the Burrowfolk have dug under every yard in Turfton and know every fence, and she has never said so.
- **Arc by act:** I: absent; II: thanks the player at the Burrow Door (#24); III: lets the crew into Loamdeep, agrees to help ("we dig where we are asked, and nobody ever asks") and shelters the mole families from the Combine (#48, #49, #52); IV: calls the digging (#60), takes her seat at the overlook camp (#64), and digs for the finale (#70).
- **Voice (for `src/voice/voices.ts` and lines):** Slow, gentle, formal, grandmotherly; says "dear one" and "if it pleases the Hall"; pauses before every no. "We dig where we are asked, dear one. Nobody has ever asked." / "Sit. Mind the lamp. It is older than your hat."
- **Body and visual hook (for a CAST preset):** No hat; a lace shawl pinned with a tiny brass lamp; silver-grey fur, thick round spectacles, a cane of root; moves in a slow shuffling waddle with a pause at each step.
- **Vehicle:** none
- **Home:** the Mother's Hall in Loamdeep (mole halls, ack) · **Work:** keeps Loamdeep
- **L58 visibility:** acknowledged (seen in quests: #24, #48, #49, #52, #60, #64)
- **Relationships:** Mother to all the Burrowfolk, grandmother to Nubbin in all but blood. Courteous to DJ Moleman, whose beat she calls "the Hall's heartbeat". Wary of Basil, then of nothing.

### Dame Peony Gravelrake (`peony`)

- **Role / faction:** Owner of Hedgeworth Links. Society; Vesper holds her mortgage.
- **New or existing:** new (CAST key `peony` to add)
- **First / last main quest:** #29 m29-the-kicked-board / #70 ch5-even-cut (also #47, #52)
- **Want / fear / secret:** want the Links open and a fair game played on it; fear the mortgage Vesper holds; secret she has not hit a ball in ten years because she cannot stand to lose.
- **Arc by act:** I: absent; II: glimpsed at the Kicked Board (#29); III: refuses a word against Vesper until the player beats Basil at a hole, then lets the crew in (#47); caddies at the gala and loses her course to the Combine's test line (#52); IV: sends her greenkeepers to the coalition (#70).
- **Voice (for `src/voice/voices.ts` and lines):** Crisp, clipped, aristocratic; short orders and golf terms; "my dear" when displeased. "Fore, my dear. And do mind the mortgage." / "One does not concede a hole. One merely finishes it."
- **Body and visual hook (for a CAST preset):** Tweed flat cap in green plaid; tweed jacket with a brooch; white, waxed handlebar beard; a driver for a cane; moves in a measured, upright walk, never hurrying.
- **Vehicle:** `golf-cart`
- **Home:** rooms above the Hedgeworth Clubhouse (site:golf-yard, ack, interior) · **Work:** Hedgeworth Links
- **L58 visibility:** acknowledged (seen in quests: #29, #47, #52)
- **Relationships:** Employs Basil and Thrift and trusts both more than she says. In debt to Vesper and politely hates it. Admires Wisteria; they share a gala and a view of the Combine.

### Basil Divot (`basil`)

- **Role / faction:** Club pro at Hedgeworth; mole-hater and superstitious. Peony's man; ally in the end.
- **New or existing:** new (CAST key `basil` to add)
- **First / last main quest:** #47 m47-hedgeworth-links / #52 m52-the-test-cut (also #48)
- **Want / fear / secret:** want to win a final without anyone touching his ball; fear moles and unlucky numbers; secret he has played every round since the final with a spare ball in his sock.
- **Arc by act:** I: absent; II: absent; III: beaten by the player at one hole (#47), shown the mole who moved his ball and softens (#48), evacuated from the test cut (#52); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Smooth, patronising, sporty; says "champ" and "as they say"; superstitious asides under his breath. "Care to lose by a stroke, champ? Plenty of room." / "A mole did that. A mole did that, I tell you."
- **Body and visual hook (for a CAST preset):** Bright red argyle tam; yellow sweater vest; clean-shaven; two-tone spiked shoes; a club tucked under one arm; moves in a loose, rolling, showy stride.
- **Vehicle:** `golf-cart`
- **Home:** the pro's cottage by the first tee (site:golf-yard, ack) · **Work:** Hedgeworth pro shop
- **L58 visibility:** acknowledged (seen in quests: #47, #48, #52)
- **Relationships:** Peony's loyal pro. Hated moles until Nubbin. Grudging respect for Thrift, who keeps his greens.

### Thrift Hosepipe (`thrift`)

- **Role / faction:** Groundskeeper at Hedgeworth; talks to the grass and hides moles. Ally.
- **New or existing:** new (CAST key `thrift` to add)
- **First / last main quest:** #29 m29-the-kicked-board / #52 m52-the-test-cut (also #48)
- **Want / fear / secret:** want every blade to have a good day; fear an even cut; secret he has been sheltering moles under the ninth green for a year.
- **Arc by act:** I: absent; II: chases the player off the wet fairway at the Kicked Board (#29); III: reveals the moles in his care (#48), is evacuated before the Combine's test line (#52); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Gruff, slow, tender; murmurs at plants; speaks to the grass in a lower voice than to people. "Mind the fairway. It's had a long week." / "They are no trouble, the little ones. Not like you."
- **Body and visual hook (for a CAST preset):** Battered brown cap with a hosepipe band, sagging at the brim; mud-green overalls; bushy brown beard with grass in it; a watering can; moves in a slow stoop, patting the ground.
- **Vehicle:** `push-bike` (the greenkeeper's)
- **Home:** the groundskeeper's shed by the ninth green (site:golf-yard, ack) · **Work:** Hedgeworth grounds
- **L58 visibility:** acknowledged (seen in quests: #29, #48, #52)
- **Relationships:** Loves the grass and the moles, in that order. Keeps Basil's secret ball-count. Loyal to Peony and honest to nobody about the moles.

### Gentian Bootlace (`gentian`)

- **Role / faction:** Keeper of the Woolly Sock Lodge and ski instructor. Ally; the crew's act III base.
- **New or existing:** new (CAST key `gentian` to add)
- **First / last main quest:** #37 m37-snowdrop-slope / #38 m38-pail-pond
- **Want / fear / secret:** want a full lodge and a full slope; fear a winter without snow; secret she has never skied to the bottom of Snowdrop Slope on her own two skis.
- **Arc by act:** I: absent; II: absent; III: shelters the crew, sends them ice-fishing on Pail Pond (#37, #38); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Brisk, cheerful, shouted like a coach; "up and at 'em"; counts in threes. "Up, up, up! The slope waits for nobody, only for snow." / "Three layers. I said three."
- **Body and visual hook (for a CAST preset):** Big red bobble hat, woolly; chunky blue knit sweater; round rosy face, no beard; ski poles; moves in quick, sure strides with a pole-plant on every fourth step.
- **Vehicle:** none (skis and sled in quests)
- **Home:** the Woolly Sock Lodge (site:ski-hill, ack, interior if E05 allows) · **Work:** Snowdrop Slope
- **L58 visibility:** acknowledged (seen in quests: #37, #38)
- **Relationships:** Old friend of Thermos Theo, who sends the crew to her. Feeds Pip too much. Fears the HOA salt-plows.

### Warden Chanterelle Stook (`chanterelle`)

- **Role / faction:** Warden of Capwood. Officious rule-keeper; neutral.
- **New or existing:** new (CAST key `chanterelle` to add)
- **First / last main quest:** #40 m40-the-capwood-run / #40 m40-the-capwood-run
- **Want / fear / secret:** want no bruised caps and a ticket book that is always full; fear a toadstool wilting on her watch; secret she apologises, silently, for every fine she writes.
- **Arc by act:** I: absent; II: absent; III: fines everyone for "bruising the caps" during the Capwood Run (#40); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Prim, nasal, regulation-bound; cites rules by number; clicks her pen between phrases. "That is a bruised cap. Section nine. Eleven acorns." / "I do not make the rules. I merely enjoy them."
- **Body and visual hook (for a CAST preset):** Brown mushroom-cap warden's hat, wide and domed; mossy green uniform with brass buttons; neat grey beard; ticket book and pen; moves in a stiff, deliberate march, eyes on the ground.
- **Vehicle:** none
- **Home:** a hut in a hollow toadstool stalk (site:toadstool-forest, ack) · **Work:** keeps Capwood
- **L58 visibility:** acknowledged (seen in quests: #40)
- **Relationships:** Fines Lulu weekly and enjoys it. Respects only the toadstools. Fears a flood of Cap-water.

### Ragwort Coilspring (`ragwort`)

- **Role / faction:** Engineer of Pinwheel Ridge. Ally against the HOA's re-cabling.
- **New or existing:** new (CAST key `ragwort` to add)
- **First / last main quest:** #41 m41-pinwheel-ridge / #41 m41-pinwheel-ridge
- **Want / fear / secret:** want every pinwheel spinning free; fear the HOA's cables on the ridge; secret she names each pinwheel and cried at the first one she freed.
- **Arc by act:** I: absent; II: absent; III: shows the player which three pinwheels to free and cuts the HOA's cabling (#41), the lights come back; IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Dry, technical, deadpan; explains in numbers; says "naturally" about everything that is not. "Three pinwheels. Naturally the hard ones." / "Torque is a mood. Mind the mood."
- **Body and visual hook (for a CAST preset):** Silver hard hat with a tiny pinwheel on top; grey overalls with a tool-belt; no beard; goggles; a wrench; moves in quick, windblown steps, leaning into the breeze.
- **Vehicle:** `zero-turn` (for ridge rounds)
- **Home:** the control hut on the ridge (site:wind-farm, ack) · **Work:** Pinwheel Ridge
- **L58 visibility:** acknowledged (seen in quests: #41)
- **Relationships:** Trades parts with Lulu. Fears the HOA linemen. Loves the wind, hates the cables.

### Clary Mudguard (`clary`)

- **Role / faction:** Marshal of the Rutbottom Dirt Bowl (not the Fizz Cup racer Two-Ton Teasel). Neutral race-lover.
- **New or existing:** new (CAST key `clary` to add)
- **First / last main quest:** #42 m42-rutbottom-impound / #42 m42-rutbottom-impound
- **Want / fear / secret:** want a clean start and a fair finish; fear a race stopped for dust; secret she has never won a race she marshalled and has never wanted to.
- **Arc by act:** I: absent; II: absent; III: lets the player race for the impounded Carburettor rides on the Dirt Bowl (#42); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Loud, bored starter's bark; counts down flatly; says "go on, then" a lot. "Three. Two. Go on, then." / "Mind the berm. The berm remembers."
- **Body and visual hook (for a CAST preset):** Black-and-white checked flat cap; dusty overalls; no beard, sandy pigtails; a starter's flag; moves in a wide, bow-legged amble.
- **Vehicle:** `push-bike` (a dirt bike for the race)
- **Home:** the starter's tower at the Dirt Bowl (site:dirt-track, ack) · **Work:** Rutbottom Dirt Bowl
- **L58 visibility:** acknowledged (seen in quests: #42)
- **Relationships:** Friendly rival to Lulu, whose races she marshals. Keeps the Carburettors' summer fixtures. Fears an HOA permit.

### Professor Betony Sextant (`betony`)

- **Role / faction:** Astronomer at Rootwell University. Ally; keeper of the Even Line's source.
- **New or existing:** new (CAST key `betony` to add)
- **First / last main quest:** #45 m45-rootwell-admissions / #70 ch5-even-cut (finale call; also #46)
- **Want / fear / secret:** want her star survey back with her name on it; fear that a perfectly level line is exactly what the Combine needs; secret she knew someone would want the survey and drew it anyway.
- **Arc by act:** I: absent; II: absent; III: writes to the player, hides in the library, guides the crew to the lens in the Anthill Observatory (#45, #46); IV: calls in at the finale (#70) with the last bearing.
- **Voice (for `src/voice/voices.ts` and lines):** Absent-minded, precise, scholarly; trails off into figures; says "as I was saying" before saying something new. "The line is level. That is the whole problem." / "Pass me a star. No, the other one."
- **Body and visual hook (for a CAST preset):** Navy mortarboard-style hat with a gold star; lab coat over a star-print scarf; wild white beard; a brass sextant; moves in distracted, upward-looking steps, bumping into things.
- **Vehicle:** none
- **Home:** a staff room in the Anthill Observatory (site:observatory-mound, ack) · **Work:** Rootwell University
- **L58 visibility:** acknowledged (seen in quests: #45, #46; #70 by call)
- **Relationships:** Colleague turned rival to Dean Lovage. Pip admires her. Pays the ants their rent in sugar and good manners.

### Dean Lovage Inkwell (`lovage`)

- **Role / faction:** Dean of Rootwell, in Vesper's pocket. Antagonist.
- **New or existing:** new (CAST key `lovage` to add)
- **First / last main quest:** #45 m45-rootwell-admissions / #46 m46-starfall-at-the-anthill
- **Want / fear / secret:** want the university's funding and a statue of himself; fear a student who reads the original grant; secret he sold the star survey to the HOA for a new quad.
- **Arc by act:** I: absent; II: absent; III: patrols the quad against the "mature student" (#45), his cover blown at the Anthill (#46); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Pompous, smooth, committee-speak; "we must be mindful"; never answers a question directly. "We must be mindful of the optics, and of the quad." / "Enrolment is a privilege. Mine."
- **Body and visual hook (for a CAST preset):** Tall black mortarboard with a tassel; maroon academic gown; neat white goatee; a pocket watch and a gavel; moves in a stately glide, hands behind his back.
- **Vehicle:** none (an HOA valet cart on the quad)
- **Home:** the Dean's lodge on the quad (site:campus, ack) · **Work:** Rootwell University
- **L58 visibility:** acknowledged (seen in quests: #45, #46)
- **Relationships:** Takes Vesper's calls in the lodge. Disdains Betony. Fears an audit.

### Captain Samphire Bilge (`samphire`)

- **Role / faction:** Captain of the Bathtub Queen; pirate tours and real smuggling. Ally; the crew's sea route.
- **New or existing:** new (CAST key `samphire` to add)
- **First / last main quest:** #44 m44-the-bathtub-queen / #70 ch5-even-cut (also #64)
- **Want / fear / secret:** want the Queen afloat and a crew that laughs at the jokes; fear dry land; secret half the pirate tour is real and she has not told the passengers which half.
- **Arc by act:** I: absent; II: absent; III: offers a barge boarding and joins the crew once the blades are taken (#44); IV: brings the Queen up the canal (#64) and holds the sea route (#70).
- **Voice (for `src/voice/voices.ts` and lines):** Booming, theatrical, sea-salted; "arr" only ironically; talks to an imagined audience; stage-whispers secrets. "Welcome aboard! Mind the plank. It is a real plank." / "Everything on this ship is a lie, except the smuggling."
- **Body and visual hook (for a CAST preset):** Black tricorn with a white teaspoon badge; red coat with brass buttons; thick black braided beard; an eyepatch worn on the forehead; a telescope; moves in a rolling, sea-legged lurch.
- **Vehicle:** `gravy-boat` (the Queen's tender; the Bathtub Queen herself is scenery)
- **Home:** the captain's cabin on the Bathtub Queen (site:pirate-ship, ack) · **Work:** the Bathtub Queen
- **L58 visibility:** acknowledged (seen in quests: #44, #64, #70)
- **Relationships:** Old shipmates with Driftwood, who first saw the Saltwater. Rivals with Marram over the best tourists. Fears the HOA barges.

### Marram Teaspoon (`marram`)

- **Role / faction:** Runs the Spokewheel and the boardwalk stalls. Neutral, friendly.
- **New or existing:** new (CAST key `marram` to add)
- **First / last main quest:** #43 m43-saltbucket-boardwalk / #43 m43-saltbucket-boardwalk
- **Want / fear / secret:** want every gondola full and every stall sold out; fear the Spokewheel stopping at the top; secret she has been stuck at the top twice and never told a passenger.
- **Arc by act:** I: absent; II: absent; III: takes the player up the Spokewheel to spot HOA barges (#43); IV: absent.
- **Voice (for `src/voice/voices.ts` and lines):** Sunny, patter-fast carnival barker; sells everything, including the view; calls customers "pet". "Step up, pet! The whole sea for two acorns!" / "Hands inside the teacup. The sea is not a ride."
- **Body and visual hook (for a CAST preset):** Striped red-and-white boater hat; candy-striped apron; ruddy freckled face, no beard; a ticket roll round her neck; moves in a quick, bustling trot with a wave for everybody.
- **Vehicle:** none
- **Home:** a hut on Long Spoon Pier (site:coast, ack) · **Work:** Saltbucket Boardwalk
- **L58 visibility:** acknowledged (seen in quests: #43)
- **Relationships:** Sells Driftwood's tube rides at a discount. Rivals with Captain Samphire for tourists. Loves the Spokewheel as one loves a stubborn old cat.
