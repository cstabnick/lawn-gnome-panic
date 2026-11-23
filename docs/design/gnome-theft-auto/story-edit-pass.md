# Story edit pass: introductions and connections

An editor's read of the whole Gnome Theft Auto campaign (prologue, chapters 1-5, the Strangers & Freaks side quests,
Tessie and the Fizz Cup) in play order, asking three questions of every named character:

1. The first time they appear, does the scene say who they are and how they relate to the player and to the others?
2. Is anyone spoken of before they are met, without enough said to place them?
3. Do later scenes refer back to them, so relationships and motives connect across chapters?

How it was read: every quest's intro, mid-quest beats, arrival scenes, choice endings and outro were dumped in play
order with their objective text (a throwaway vitest that walks `QUESTS` and `SCENES`), then read straight through.
Side quests were read at the point they unlock (`SIDE_UNLOCKS` in `src/quests/unlocks.ts`), since a side quest can only
assume what the story has shown by then, and can never assume another side quest was played.

The fixes are small line rewrites inside the direction bible's limits (16 words a line, the player's lines two to six
words, voices per character) plus the new mission comms (`src/quests/comms.ts`): a talking-head briefing at each story
quest's start and calls as objectives change, which carry the "who is this and why do we care" that a 30-second scene
has no room for. `npm run cutscene-report -w games/gnome-theft-auto` shows no new faults after the edit.

## Findings

| # | Where | Problem | Fix |
| --- | --- | --- | --- |
| 1 | prologue-intro | Pip never says his name; the player only sees it on the card. | Pip: "I'm Pip! Grab that Ride-On and follow me!" The prologue briefing has Pip explain Tansy and the bay. |
| 2 | prologue-outro | Tansy never introduces herself; Turncoat Cam sweeps the bay from the prologue on (ruling R-071 in `docs/lore/rulings.md`) but nobody ever names him, so his betrayal at the end of chapter 2 lands on a stranger. | Tansy: "I'm Tansy. That's Cam on the broom. Keep it short." Comms in Mower's Keepers name him twice ("Cam will get the bay door", "Cam says a lot"). |
| 3 | first-contract-intro | "The Don" is never named; the three marks have no reason to be cracked; nobody says how the player got to the Mulch Club. | "One tap. Don Compost says you came on a mower." / "Gold hats. They owe the Don." The briefing: Pip sends you, and ties the job to the 5,000-Acorn Kiln-Debt. |
| 4 | mowers-keepers-outro | Vesper Thorne is named for the first time with no hint of who he is. | Tansy: "Vesper Thorne. Runs the HOA from Thorne Tower. He doesn't knock. He files." |
| 5 | two-coat-intro | Juniper mentions "Reginald" before he is met; their relationship (estranged siblings, lore) is never said, so the outro's sniping reads as two strangers. Why Juniper hires the player is unclear. | "My brother Reginald calls me The Trowel." The briefing: Juniper wants to know who is leasing the medians, and says Vesper runs the HOA and her brother measures lawns for him. |
| 6 | founders-boot | Gnorwin's Boot and Tansy's claimed Clayfoot ancestry never connect to the Stopping Stone plot that follows. | The briefing: "Gnorwin Clayfoot, first king of Fescue. Allegedly my great-great-something." (Gnorwin threw the Stopping Stone into the Mower; lore `gnorwin-clayfoot`.) The finale call echoes it: "Gnorwin's Stone was made for it." |
| 7 | dew-run-intro | Granny Gnertrude is met with no link to the crew; "You've got the Dew-Hauler" answers "Why me?" with a vehicle the player does not have. | "Tansy said you'd come. Vesper's boys are draining my Dew-Wells dry." / "No record out here. Bring it to my barn." The briefing (Tansy) explains who Granny is and why Black Dew matters. |
| 8 | dew-run-outro | Bramble speaks unintroduced, about "Biscuit" (the Tall Ones' giant dog) with no explanation; it is the plant for the Biscuit side quest. | Bramble: "Boss, Biscuit's napping in the crater again. The Tall Ones' dog. Paws like dinner plates." |
| 9 | sprinkler-outro | Driftwood appears and is waved off unnamed; the castaway and Tessie side quests both start from him. | Granny: "That's Driftwood. Ignore him." |
| 10 | vespers-offer | "The Glazier" is used before anyone says it is Vesper's name. | The briefing: "That card was Vesper Thorne. Folks call him the Glazier." |
| 11 | vespers-offer -> tablet-intro | The player is sent "west toward Mossy Wood" by nobody; Sorrel then appears unintroduced in the tablet scene. | A call from Sorrel as the "Break west" objective starts: "This is Sorrel Tillbrook, 88.7 Fescue Public. Elder Bracken asks you west." The tablet briefing explains the Unmowed. |
| 12 | tablet-intro | "Your cousin Wendel is regent of Fescue": lore makes Wendel Lord Chancellor, and the line states a fact without the sting the bible wants (Pip running from Fescue). | "Cousin Wendel runs Fescue. You ran." |
| 13 | tablet-outro | "There's a girl from Fescue in the hollow. She'll want to talk to you": a hook to a character who does not exist anywhere in the game. | Sorrel now hooks the quest that really unlocks here (The Fescue Fugitive, Bracken's job): "The Elder has another stone on his mind. Come back for it." |
| 14 | tablet-outro | Cam's tin-can call never says who is calling or from where. | "It's Cam, at Tansy's. The acorn's under the bench. Tuesday. The charter's mine." Vesper's "Of course, Cameron." now lands on a name the player knows. |
| 15 | salvage-raid-outro | Father Loam: no name in his first line; "They threw me out" (who?). Why the crew flees to him is never said. | "I'm Father Loam. Another cracked pilgrim." / "The Chapel threw me out for preaching on a snowmobile." Tansy's raid call: "Father Loam, up in Frostbite Fells, mends cracked clay. Go north." |
| 16 | kiln-resin-outro | "She said bring Pip. By name": who is "she"? The scroll's courier, Shelldon, is a side-quest character the player may never have met. | "It's from Tansy. She said bring Pip. By name." The objective says "Shelldon's courier snail". |
| 17 | tundra-outro | "He's put the acorn in it": two pronouns, neither said in the scene. | "Vesper's put the acorn in the Grand Combine." |
| 18 | spade-truce-outro, ch5 choice | "The Carburettors" are listed as one of the four crews and named in ending B, but never introduced. | The finale briefing and the choice call name who stands where; the Fizz Cup's Lugnut Lulu remains their face in play. (Left as a known gap: see below.) |
| 19 | sq-grid-truthers-intro | Burt speaks with no introduction (his own quest, The HOA Audit, unlocks much later). | "I'm Burt. Ex-HOA. He's right about the vans. I drove one." |
| 20 | sq-mulch-pyramid-outro | Pip cites Father Loam, but this quest unlocks at the end of chapter 1 and Loam is met in chapter 3. | Turned into a plant: "The Chapel of Mulch bought a whole quota of that!" / "Their old priest said so. From a snowmobile." Loam's own line in chapter 3 ("The Chapel threw me out...") now pays it off. |
| 21 | sq-fescue-fugitive-gallery | The player asks Granny "Who is this?" though they worked for her all of chapter 2; she calls him "Lovey", off her voice. | "Granny? How'd you get this number?" / "Sugar. Five hundred acorns for that stone." |
| 22 | sq-tessie-intro | "Since you floated me off the canal" assumes the optional Castaway's Dry-Dock was played. | "Since my raft reached the canal, she sings through my hull." |

## Character introductions

First appearance in play order, the line that now introduces them, and where they come back. "Comms" means the
mission comms of that quest (`src/quests/comms.ts`).

| Character | First appearance | Introduced by | Relation to the player and others | Later callbacks |
| --- | --- | --- | --- | --- |
| Pip "Two-Stroke" Potsworth | prologue-intro | "I'm Pip! Grab that Ride-On and follow me!" | Drags the new arrival into the life; Tansy's lodger and liability | every chapter; tablet-intro (Wendel, Fescue); salvage raid (the arm); epilogue; Dock Hoewright's "my cousin Pip" |
| John Bodega and Asphalt | prologue-intro (cameo) | the card, "Whistles before lunch, Asphalt." | The corner shop that watches the street | founders-boot-outro, salvage-raid-intro, even-cut intro and outro (the bottlecap) |
| Tansy Clayfoot | prologue-outro | "I'm Tansy. That's Cam on the broom. Keep it short."; prologue comms | Runs Side-Valve Salvage; the crew's fixer; claims Gnorwin Clayfoot | every chapter; founders-boot comms (Gnorwin); ch5 the brass wrench |
| Turncoat Cam | prologue-outro (sweeping) | Tansy names him; Mower's Keepers comms | Tansy's sweeper who wants a racing charter | tablet-outro call to Vesper; salvage-raid betrayal; Tansy's raid call "Cam sold us." |
| Don Compost and his bodyguards | first-contract-intro | "Don Compost says you came on a mower."; comms | The Mulch Club; pays down the player's Kiln-Debt | (the Wiseguy Hat) |
| HOA, Hat Watch | mowers-keepers-intro | comms: "The HOA clamps anything with a motor and no permit." | Vesper's enforcement | throughout |
| Vesper "The Glazier" Thorne | mowers-keepers-outro (named), two-coat-handover (met) | "Runs the HOA from Thorne Tower."; Glazier named in the vespers-offer briefing | The villain; wants the Golden Acorn | the hat ladder (bible), diner offer, salvage raid, spade-truce phone call, ch5 PA |
| Councilwoman Juniper Vance | two-coat-intro | the card; comms: why she hires the player | Reginald's estranged sister; Turfton's paperwork resistance | two-coat-outro; even-cut-outro ("Measure it."); the ch5 choice call |
| Mayor Barnaby "Two-Coat" Mulch | two-coat-intro | "Mayor, the scissors." | Signs the medians over to Vesper | handover, founders-boot, sq-big-lou, epilogue |
| Mabel Kerbstone | two-coat-intro | "Turfton Taxi! Hop in, dear." | Turns the crew down on every job | epilogue: "This one's on the house." |
| Reginald "Quarter-Inch" Vance | two-coat-intro (named), two-coat-outro (met) | "My brother Reginald calls me The Trowel." | Vesper's HOA auditor; Juniper's brother | founders-boot tribunal, sprinkler (his laser squad), sq-hoa-audit, epilogue "It's uneven." |
| Granny Gnertrude | dew-run-intro (comms first) | Tansy's ch2 briefing; "Tansy said you'd come." | Cloverfield fence; clears the Kiln-Debt | sprinkler, vespers-offer, spade-truce ("I brought pie."), ch5 south canal, sq-fescue-fugitive, sq-biscuit |
| Bramble | dew-run-outro | "Boss, Biscuit's napping in the crater again." | Granny's farmhand | sprinkler comms; sq-biscuit-hotdog |
| Biscuit | dew-run-outro (spoken of) | "The Tall Ones' dog." | The giant dog | sq-biscuit-hotdog; ambient gnome bubble |
| Driftwood | sprinkler-outro | "That's Driftwood. Ignore him." | Castaway, turtle believer | sq-castaway-drydock, sq-tessie |
| Rooster Weatherby | sprinkler-intro | his own shouting (a one-scene cameo) | Cloverfield's weather crank | sprinkler comms (Granny) |
| Sorrel Tillbrook | vespers-offer (a call), tablet-intro (met) | "This is Sorrel Tillbrook, 88.7 Fescue Public." | Fescue exile with the Unmowed; the radio | tablet briefing and outro; sq-fescue-fugitive; 88.7 on the radio |
| Elder Bracken | tablet-intro | "Steady, Elder." (Sorrel) and the tablet briefing | Leads the Unmowed; keeper of the Stopping Stone | tundra-outro (lends the Stone), runway comms, spade-truce, ch5 comms, ending A, sq-fescue-fugitive, sq-porcelain-support |
| Wendel Potsworth | tablet-intro (spoken of) | "Cousin Wendel runs Fescue. You ran." | Pip's cousin, Fescue's Lord Chancellor | (loose thread, by design) |
| Father Loam | salvage-raid-outro (Tansy's call names him first) | "I'm Father Loam."; "Father Loam ... mends cracked clay." | Cast-out Chapel priest who glues Pip's arm | kiln-resin, tundra-intro (compost tea), planted earlier by sq-mulch-pyramid |
| Thermos Theo | kiln-resin-outro | "Acorn-broth. Burns the throat, warms the soul." | Keeps the bend's barrel fire and the post | kiln-resin comms (Pip) |
| Shelldon | kiln-resin objective (his snail) or sq-snail-rigging | "Shelldon's courier snail"; "You sent a snail to find me." | Snail-post courier, paranoid | race-snail-endurance |
| Wind-Sock Wally | runway-intro | his own radio patter | Airfield hand | names Commander Diggs before he appears |
| Commander Diggs | runway-intro (named by Wally), sandpit-drop-outro (met) | runway briefing: "Commander Diggs runs the fort. He's not ours. Not yet." | Spade Guard commander; fired by Vesper, joins the coalition | spade-truce, ch5 intro and comms, epilogue with Big Lou |
| Big Lou | sq-big-lou-embargo or the epilogue | the card; "Commander. Rope's up." | The Gnomecino's door | epilogue |
| Clara | sq-porcelain-blues | her own lines; comms | Porcelain refugees' guardian | sq-porcelain-support (to Bracken's fire) |
| Mossley, Burt, Cedric, Brenda, Turfton Tattler | their side quests | their own intros; Burt now names himself | Strangers & Freaks | Burt in sq-mulch-pyramid and sq-hoa-audit; Brenda named by Driftwood first |

## Connections strengthened by the comms

- Chapter 1 is one chain now: Pip -> Tansy -> the HOA (Mower's Keepers) -> Vesper (the eviction) -> Juniper (who he
  bribes) -> the deed (Thorne Tower) -> Gnorwin's Boot (Tansy's claimed ancestor, and the Stone's thrower).
- Chapter 2: Tansy hands the player to Granny; Granny sends them to Vesper and names him the Glazier; Sorrel calls them
  west; Sorrel explains the Unmowed; Cam's call names himself.
- Chapter 3: Tansy's raid call sends the player to Loam by name; Loam's resin; Tansy's scroll; Tansy's ridge call.
- Chapter 4: the runway briefing plants Diggs and the Unmowed's flares; Bracken answers the flare; Diggs speaks for
  himself once he is on side.
- Chapter 5: Granny and Diggs check in, Bracken talks the Stone into the intake, Juniper frames the final choice
  between Bracken's monument and Tansy's grid.

## Left as it is

- The Carburettors (finding 18) are named in chapter 4 and the ending without a scene of their own. Giving them one
  needs a staged scene (actors, marks, cameras), which is outside this text pass; Lugnut Lulu's Fizz Cup race is where a
  player meets them.
- Rooster Weatherby, Thermos Theo, the Turfton Tattler and the Fizz Cup racers stay one-scene cameos; each line says
  enough about them for the joke.
- The unused example scenes (`street-pickup`, `pull-up`, `back-room`) were not edited.
