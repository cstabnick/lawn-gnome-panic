# Gnome Theft Auto: Story & Narrative Design Bible

> **Setting:** `apocrypha` ([docs/lore/settings.md](../../lore/settings.md), [R-015](../../lore/rulings.md#r-015), [R-016](../../lore/rulings.md#r-016), [R-021–R-025](../../lore/rulings.md#r-021))  
> **Game:** `games/gnome-theft-auto` ([README](../../../games/gnome-theft-auto/README.md))  
> **World & Area Lore:** [world-lore.md](world-lore.md)  
> **Fictional Brands & Rivalries:** [brands.md](brands.md)  
> **Society, Power & Themes:** [society.md](society.md)  
> **Status:** Narrative & Content Design Proposal (synced with `src/quests/` from PR #266)

---

## 1. Tone, Philosophy & The Gnomiverse Contract

### Serious Lore, Tongue-in-Cheek Execution
The Gnomiverse has serious bones. In **Fescue** (*Gnomes of Gnomomia*), gnomes are fired clay shaped 3,000 years ago by vanished **Tall Ones** in the **Kiln**, haunted by a jammed **Mower** grinding down the **Stopping Stone** in **the Shed**, and torn between tending the lawn, letting it grow, or cutting it all. In **The Tall House** (*Paragnormal*), porcelain gnomes shatter permanently in the dark.

*Gnome Theft Auto* does **not** throw that weight away—it **weaponizes the contrast**:
- **The lore stays serious.** Gnomes are still fired clay who chip, glaze, and fear the unseen Tall Ones. The Mower is still an existential terror in the collective gnome subconscious. Fescue refugees still carry trauma from the Rumbling. A cracked hat or a shattered friend still lands with real drama.
- **The game is unapologetically tongue-in-cheek.** Turfton is what happens when gnomes stop worshipping the Mower and start **hotwiring** it. Every character treats absurd garden-scale crime—boosting a Ride-On Mower, laundering acorns through a birdbath, dodging an HOA special assessment—with *Heat* / *Goodfellas* / *GTA* gravitas.
- **Self-aware satire (Apocrypha privilege).** Because *Gnome Theft Auto* lives in `apocrypha` (R-005, R-015, R-016), it can sarcastically poke at:
  1. **Itself & the crime-sandbox genre:** "Cracked" and hauled by a Glaze Clinic ambulance to the Glaze Clinic Hospital instead of Wasted (R-021–R-023); "Hat Watch" stars instead of wanted levels; exploding, charred mowers (R-024); pedestrians throwing their hands up and sprinting from speeding mowers.
  2. **The Gnomiverse itself:** Fescue's 3,000-year-old prophecies treated like pretentious art-school nonsense by Turfton street hustlers; *Lawn Gnome Panic*'s acorn hoarding mocked as boomer-gnome prepper culture; *Gnome Front*'s endless Red Cap vs. Blue Cap war reduced to two rival corners selling bootleg Black Dew.
  3. **Yet the stakes are real.** When the jokes stop and a betrayal hits—or when a rogue Combine Harvester is bearing down on a clay village—the story plays it completely straight.

---

## 2. Overall Story Arc & Themes

### Logline
*A seemingly gnormal gnome arrives in Turfton with nothing but a fresh coat of glaze and a bounced acorn loan, only to get dragged into a four-biome turf war over a secret Tall-One super-weapon buried beneath the Dust Flats.*

### The Arc: *From Gnormal to Infamous*
1. **Act I — Fresh Glaze (Turfton):** Just trying to pay off a "Kiln-Debt" and survive petty mower-jackings, the protagonist becomes the wheel-gnome for a washed-up Fescue exile and a shady Turfton fixer.
2. **Act II — Turf & Dew (Cloverfield Farms & Mossy Wood):** Expanding operations outside the city grid reveals that someone is cornering the **Black Dew** (petrol) and **Acorn** supply—and using **The HOA** as a legal front to foreclose on entire biomes.
3. **Act III — Cold Clay & High Altitude (Frostbite Fells & The Dust Flats):** A brutal betrayal fractures the crew. The protagonist goes on the run to the frozen north, uncovers the truth about **Project Even Cut** (an apocryphal re-imagining of Fescue's doom), and hits **Fort Sandpit** and the **Desert Airfield** to steal the **Whirligig** and a **Crop Duster**.
4. **Act IV — The Unmowed Horizon (Finale):** A multi-stage heist and aerial/ground showdown across Turfton's downtown towers to stop the **Grand Combine** from turning the entire 1200×1200 map into a sterile, regulation-height putting green.

### Core Themes
- **Fired Clay vs. Paint (Identity):** Everyone in Turfton wears a flashy hat and a fresh coat of glaze (`@lawn/gnome`), but underneath, you are what you were fired from. Can a "gnormal" gnome stay whole in a city built on cracks?
- **The Grid & The Unseen:** Turfton's streets are a suspiciously perfect grid (`ROAD_LINES = [-180..180]`), and Fort Sandpit's walls are literally a child's sandbox. Who laid the grid? Why are the Tall Ones never home? Living under giants who don't even know you're having a mob war.
- **Progress vs. Tradition:** Fescue's horror of the Mower vs. Turfton's obsession with strapping twin-turbos to a Zero-Turn Racer. When does "taming the machine" become becoming the machine?

---

## 3. Intro Sequence: *"Fresh Out the Kiln"* (Playable Cold Open)

### Scene 1: The Bus Stop on `x = -6.25, z = 14`
- **Visual:** Camera pans down from Turfton's downtown towers (giant terracotta pots, upside-down buckets, stacked garden bricks) to the player's own gnome (`loadMyGnome()`) standing on the sidewalk at `SPAWN` (`-6.25, 14`), holding a battered suitcase prefab and wearing whatever ridiculous outfit the player picked in *Gnome Creator*.
- **Voiceover (Radio / Narrator — dry, noir-ish):**  
  > *"Every gnome thinks they're special. Hand-painted. Limited edition. Then you step off the snail-coach in Turfton and realize half the block was cast from the same garden-centre mould."*
- **The Setup:** Your cousin **Pip "Two-Stroke" Potsworth** promised you a "legitimate import-export gig" in Turfton. Instead, he meets you in a dented **Push-Mower Bike** (`push-mower-bike`), sweating clay dust, with a **1-Hat Watch** siren already wailing two blocks over.

### Scene 2: Tutorial Chase — *"Borrowing" 101*
- **Dialogue:**  
  - **Pip:** *"Don't look at me like that! Technically it's not stealing if the owner left the key in the ignition and went inside a flowerpot!"*
  - **Player objective:** Hop on a nearby **Ride-On Mower** (`ride-on-mower`) at the kerb (`E` / Enter button) and follow Pip through Turfton's grid while dodging two Hat Watch officers.
- **First Genre Joke:** An officer steps into the road, fires a warning shot from a pistol (`weapons.ts`), and misses—clipping a flowerpot behind a pedestrian. The pedestrian throws both hands into the air and sprints down the sidewalk screaming, *"MY GLAZE! I JUST GOT THIS BUFFED!"* (While anyone actually caught by a stray shot cracks into harmless clay shards on the pavement per R-021/R-023!)
- **The Hook:** You lose the Hat Watch in an alley behind **The Gnomecino** (Turfton branch), only to find Pip's "employer"—**Tansy "Side-Valve" Clayfoot**—waiting by a smoking **Zero-Turn Racer**. Inside the mower's grass-catcher bag isn't grass clippings. It's a **sealed crate stamped with the Fescue Crown** and a glowing **Golden Acorn** humming like a battery.
- **Title Card:** **GNOME THEFT AUTO** slams onto the screen as Pip whispers: *"Okay, yeah. That might not be grass."*

---

## 4. Main Characters

| Character | Role | Appearance / Look | Backstory & Motivation | Arc |
|---|---|---|---|---|
| **The Protagonist** *(Player's Gnome)* | The "Gnormal" Outsider | `@lawn/gnome` (`getMyGnome()?.look`, fallback `DEFAULT_LOOK`) | Arrived in Turfton to pay off a kiln-repair debt after a minor mower incident back home. Quiet, pragmatic, chronically underpaid. | Goes from pawn running errands to the only gnome with the nerve to fly a Crop Duster into a Combine's intake. |
| **Pip "Two-Stroke" Potsworth** | Best Friend / Liability | Green coat, crooked red cap, grease-stained beard | Distant, disgraced cousin of **Wendel Potsworth** (Fescue's regent). Fled Fescue after bolting salvaged pram wheels onto a monastery wheelbarrow and being accused of "Mower-sympathy." Keeps an oil-stained notebook and a tiny, unlabelled vial of Fescue soil taped inside his toolbox. Loves engines, terrible at math. | Wants to prove he's not just the family embarrassment. Nearly gets shattered in Act III protecting the protagonist's getaway. |
| **Tansy "Side-Valve" Clayfoot** | Mentor / Fixer | Charcoal coat, dark glasses, yellow cap | Claims to be a direct descendant of **Gnorwin Clayfoot**. Runs *Side-Valve Salvage* (`x: -120, z: 60`), where forty-seven wrenches hang in size order and a forty-eighth—cast in tarnished brass—stays locked in a cigar box until a big heist. Sharp, cynical, brews chicory coffee when served foreclosure liens, and speaks in garden proverbs twisted into street slang. | Starts out using the protagonist to skim Black Dew; genuinely comes to care for the crew when the HOA tries to bulldoze her garage. |
| **Vesper "The Glazier" Thorne** | Main Antagonist | Crisp white porcelain finish, tall obsidian top-hat, monocle | Not earthenware like Turfton's gnomes—**porcelain**, rumored to have escaped **The Tall House**. CEO of *Thorne Lawn & Order LLC* and secret Chair of **The HOA**. Inspects Patio Heights astroturf at 06:00 sharp, dusts his porcelain cuffs, and writes in his Private Compliance Ledger that *"cracks are a failure of discipline."* | Wants to seize Fort Sandpit's tech and Cloverfield's Black Dew to power **The Grand Combine**, leveling Turfton into a silent, manicured estate. |
| **Commander Diggs** | Spade Guard Hardliner | Olive cap, tactical trowel bandolier | Decorated veteran of Fort Sandpit who has spent 15 years guarding a flying mower nobody is legally allowed to turn on. | Starts as an enemy during the Fort Sandpit raid; turns reluctant ally in Act IV when he realizes Vesper plans to scrap the Spade Guard too. |
| **Don Compost** *(In-Game — R-025)* | Silent Underworld Boss | Cream suit, black hat, armchair on a dais inside **The Mulch Club** (`x: -16, z: -30`), flanked by two pistol-packing bodyguards | Nobody has heard him speak since **The Great Sprinkler Scare**. Rules Turfton's members-only syndicate through eyebrow raises, red-crossed wanted posters, a folded napkin under his teacup, and three taps on his armrest (one = fetch a mower, two = bring acorns, three = crack a hat). A Cloverfield lip-reader hired by junior enforcers once stared for ten minutes and moved to Frostbite Fells the same night. | Gives the protagonist their **First Contract** (cracking gold-hatted targets across three biomes) to pay down their Kiln-Debt; later becomes an uneasy underworld ally against Vesper's HOA takeover. |
| **Granny Gnertrude** | Information Broker / Fence | Floral apron, oversized spectacles, pink bonnet | Runs a "bake shop" near the Cloverfield border. Actually the sharpest black-market acorn fence in three biomes. | Supplies the crew with forged HOA permits and heavy hardware (`Shotgun`, `Rifle`) in exchange for rare Fescue relics. |

### Supporting Cast & Local Weirdos
| Character | Role | Look & Vibe | Unhinged Behaviour & Lore Hook |
|---|---|---|---|
| **Rooster "Squall-Box" Weatherby** | Rogue Weather-Vane Prophet | Tinfoil-lined pointed cap, crooked tin-funnel megaphone, grass-stained overalls | Roosts atop a rusted Cloverfield windmill screaming barometric prophecies (*"THE BAROMETER IS DROPPING! VESPERS IN THE CLOUDS!"*). Insists the Tall Ones communicate exclusively through oscillating sprinkler patterns. |
| **Reginald "Quarter-Inch" Vance** | Obsessive HOA Turf-Auditor | Beige vest, brass pocket-calipers, monocle-loupe, laminated *Turfton Municipal Code §404-B* | Measures grass height with a laser level at 3:00 AM. Issues fines for "unauthorized dandelion posture" and carries a whistle tuned to summon Code-Enforcement Vans. |
| **Baroness Brenda of the Vinyl Lounge** | Feral Lawn-Chair Baron | Leopard-print poncho, sun-visor hat, feather duster scepter | Rules the southern drainage canal ("The Sovereign Republic of New Puddle") from a 9-foot throne of zip-tied folding patio loungers. Commands a biker gang of Push-Mower Bikes. |
| **Shelldon "No-Trail" Mucilage** | Conspiracy-Theorist Snail-Courier | Oversized spectacles, mossy trench coat, backpack full of lettuce | Refuses to step on paved roads (*"THE GRID IS A TALL-ONE CIRCUIT BOARD, MAN!"*). Runs Turfton's only encrypted messaging network by taping micro-scrolls to racing snails. |
| **Father Loam** | Chop-Shop Chaplain | Compost-stained robe, chrome-rimmed sunglasses, 14mm wrench on a rosary chain | Excommunicated from *The Chapel of Mulch* (`gnome-company`) after his delivery van snapped an axle on the `west` highway (leaving unpaid quota invoices in the glovebox). Now preaches from a snowmobile on the Frozen Birdbath Basin, mixing Kiln-Resin for cracked drivers and blessing getaway mowers with artisanal compost tea. |
| **Squeaky-Clean Midge** | Hyper-Caffeinated Glaze Clinic Intern | Splattered white lab coat, dual-cup espresso-acorn helmet with twin straws | Treats a minor hat chip like a five-alarm ER trauma while vibrating at 140 BPM. Re-glazes shattered gnomes in four seconds flat with quick-set slip and a heat gun—patients wake up smelling faintly of peppermint with a receipt stamped *KILN-SHIELD: CLAIM DENIED*. |
| **Sorrel Tillbrook** *(In-Game — `radio/`)* | Fescue Exile & Radio Host | Moss-hemmed shawl, tape reel, rain-spotted cap | Taught Fescue's schoolhouse for twenty years before slipping through a Fence knot-hole following a lost page of Gnorwin's ledger. Lives among **The Unmowed** in Mossy Wood, hosts *88.7 Fescue Public Radio*, refuses to say "mower" on air, and records forty-five minutes of rain on terracotta at the Fence gap. |

---

## 5. Factions & Motivations

1. **The Hat Watch** *(Existing — `police.ts`)*
   - **Who:** Turfton's municipal police in navy caps and yellow coats.
   - **Motivation:** Keep the sidewalks dry, hit their monthly jay-mowing and splash-ticket quota, and never, *ever* file paperwork after 5:00 PM.
   - **Story Role:** Easily bribed by Vesper in Act II; turns a blind eye to HOA enforcers while ramping up to 3-Hat Heat whenever the protagonist breathes near downtown. *(Note: per [R-016](../../lore/rulings.md#r-016) and [R-028](../../lore/rulings.md#r-028), Watch officers carry parody firearms, not water guns, and Hat Watch heat tops out at **3 Hats** (`MAX_HEAT = 3`); the **HOA Code-Enforcement Van** below is a proposed story/HOA escalation tier not yet in `police.ts`.)*

2. **The Spade Guard** *(Existing — `police.ts`, Fort Sandpit)*
   - **Who:** Olive-capped paramilitary guarding **Fort Sandpit** (`BASE`) and the **Desert Airfield** (`AIRFIELD`).
   - **Motivation:** Protect **The Whirligig** and the Tall Ones' abandoned sandbox relics from "civilian stupidity."
   - **Story Role:** Guarding the toys Vesper wants to weaponize. Infiltrating them is the centerpiece of Act III.

3. **The HOA (Homeowners' Association)** *(Imported & Expanded from `gnome-company` apocrypha)*
   - **Who:** Faceless, clipboard-wielding enforcers in matching beige vests, backed by Vesper Thorne.
   - **Motivation:** *"Uniformity. Curb Appeal. Zero Unapproved Grass Height."* They issue predatory fines ("Citation: Unauthorized Lawn Ornament") to foreclose on Turfton shops and Cloverfield farms.
   - **Tongue-in-cheek bite:** Their ultimate threat isn't bullets—it's a **Lien on Your Flowerpot**.

4. **The Fescue Exiles ("The Unmowed")**
   - **Who:** Traditionalist earthenware gnomes who slipped through a gap in the Fence generations ago, now living in **Mossy Wood**.
   - **Motivation:** Terrified of Turfton's mower culture. They believe every revving Ride-On is waking something older and worse.
   - **Story Role:** Initially hostile to the protagonist ("You smell of Black Dew!"), they hold the ancient knowledge of **how to jam a Mower**—the exact secret needed to stop the Grand Combine.

5. **The Carburettors (Turfton Street Crew)**
   - **Who:** Underground street-racers and chop-shop mechanics operating out of downtown alleys and **Frostbite Fells** ice tracks.
   - **Motivation:** Speed, custom paint tints (`MOWER_TINTS`), and keeping Turfton's roads wild.
   - **Story Role:** Allies you earn by winning illegal Zero-Turn races and rescuing their impounded rides.

6. **Red Cap & Blue Cap Corners** *(Easter Egg / Street Gangs)*
   - **Who:** Two petty street gangs perpetually fighting over a single grassy median in Turfton.
   - **Motivation:** Nobody remembers why they started fighting, only that the other side's hat is the wrong primary colour. (Direct nod to *Gnome Front*.)

---

## 6. High-Level Chapters (Acts & Mission Arcs)

The main story is built as **70 main quests in four acts** (rows 1-70). The written source of truth is [story-outline.md](story-outline.md); the older five-chapter plan (a prologue and chapters 1-5) is superseded by it wherever they differ, and the per-quest storyboards of the old plan are replaced by the row table in section 9. Places, names and the four parts of the Grand Combine come from the E04 spine and rulings R-158..R-167 and R-229..R-235 in [rulings.md](../../lore/rulings.md).

### Act I: *Fresh Glaze* (rows 1-15)
- **Question:** Can the player pay their way out, and where do they live?
- **Where:** Turfton downtown, the Mulch Club's first-contract tour (Mossy Wood, Frostbite Fells, the Dust Flats), the Underspan, Patio Heights, the Even-Estates site, the canal and Route South.
- **How it goes:** The player arrives fired and owing a Kiln-Debt, takes a loan and a flat at Saucer Court, and runs one small errand after another for people who each want one thing. Vesper Thorne starts as a name on an eviction notice.
- **How it ends:** *Founder's Boot & The Kangaroo Court* (row 15, three parts) crashes the HOA tribunal, makes Juniper an ally and closes on Vesper's threat. Tension 3 to 6.

### Act II: *Turf & Dew* (rows 16-35)
- **Question:** Will the player take Vesper's deal, and who is paying for his war?
- **Where:** Cloverfield, Route South, Mossy Wood, Loamdeep, Wader's Rest, Trellisdown, Hedgeworth, the Speedway, the canal, and back to Side-Valve Salvage.
- **How it goes:** The Kiln-Debt is cleared at the start; from then the player works for the crew. Vesper offers a penthouse at the diner, is refused and keeps the offer open while the HOA tightens every lane. The Cracked Tablet shows the Grand Combine is patterned on Fescue's Mower. Edges of the map are planted: a mole town, a one-legged flock, the Countess's vineyard.
- **How it ends:** *The Salvage Raid* (row 35, three parts): Cam sells the bench-lock code, Vesper takes the Golden Acorn in person, Pip's arm cracks off, and the crew flees north. Tension 4 to 9.

### Act III: *Cold Clay, Far Edges* (rows 36-53)
- **Question:** Can a broken crew find friends at the edges of the map before the Combine is finished?
- **Where:** Frostbite Fells, Snowcap Rise, Capwood, Pinwheel Ridge, Rutbottom, Saltbucket Shore, Rootwell, Hedgeworth, Loamdeep, Trellisdown, Wader's Rest.
- **How it goes:** A radio fished from Pail Pond shows the Combine is built in four parts: power (Pinwheel Ridge), guidance (the Anthill Observatory, Rootwell), money (the Countess at Trellisdown) and the cutting deck (Hedgeworth Links). The player finds each part and a friend in each place: skiers, rally racers, a pirate, a professor, golfers, moles, a flock. The Flock of the One Leg give the date of the test cut.
- **How it ends:** *The Test Cut* (row 52, four parts): the Combine cuts a line through Hedgeworth and Vesper names the date of the Even Cut over every loudspeaker. Row 53 is the cold-air coda: Bracken lends the Stopping Stone and the crew heads for the Dust Flats. Tension 4 to 8.

### Act IV: *Sandpit Protocol / The Even Cut* (rows 54-70)
- **Question:** Can a coalition of outcasts take a fort and stop a god-machine, and what will Turfton be?
- **Where:** The Dust Flats, Fort Sandpit and the Desert Airfield, Pebblewick, the Underspan, Pardonlin, Turfton, the Unmown, the Hatbrim, the center meridian.
- **How it goes:** The crew steals the Whirligig from Fort Sandpit, turns Commander Diggs and the Spade Guard (the moles dig the armory open), frees or abandons Cam, and gathers every faction at one table in *All Hats* (row 64, four parts). Per R-234: the Mayor is fetched from Café Pardon in Pardonlin (row 63), the Countess's first vine goes to the Unmown (row 65), and the coalition's beacon for the longest day is lit on the Bobble, the Hatbrim's summit (row 64 part 2). Vesper then seizes City Hall and the Combine wakes.
- **How it ends:** *The Even Cut* (row 70, four parts, final id `ch5-even-cut`): air support, the deck drop, the Gilded Lawn-Throne, then the Stopping Stone jams the machine and the player chooses Ending A (The Unmowed Monument) or B (Turfton Rewired). Vesper is stopped, not shattered. Tension 6 to 10, then 2 in the epilogue.

---

## 7. Easter Eggs from Other Gnome Games

Every biome and block in Turfton can quietly nod to the wider Gnomiverse without breaking *Gnome Theft Auto*'s flow:

| Source Game | Easter Egg in *Gnome Theft Auto* | Where / How Found |
|---|---|---|
| **Gnomes of Gnomomia** | A weathered statue of **Gnorwin Clayfoot** in Turfton's park with a traffic cone on its head; graffiti reading *"EVEN CUT WAS HERE"*. | Downtown Turfton park / alleyways |
| **Lawn Gnome Panic** | A conspiracy-theorist radio caller screaming about **"THE GIANT ARMADILLO"** in the Dust Flats—and a rare unmarked Combine spawn in the desert named *Old Combine*. | Desert highway / Radio |
| **Lawn Prix** | Illegal midnight **Zero-Turn** time-trial checkpoints marked with Lawn Prix checkered flags; a billboard for *"The Grand Zero-Turn — No Guns Allowed (Mostly)"*. | Turfton & Cloverfield roads |
| **Gnome Front** | Red Cap and Blue Cap NPCs eternally having a turf standoff over a single picnic table ("upwind of the verge"). | Turfton suburban block |
| **Gnome Company** | A rusty van parked behind a church in Mossy Wood painted **"CHAPEL OF MULCH — QUOTA DUE FRIDAY"**; a **Cursed Truffle** pickup that whispers passive-aggressive HOA complaints. | Mossy Wood / HOA HQ |
| **Paragnormal** | A boarded-up, oversized **Tall House** porch at the far edge of Mossy Wood where the ambient audio drops out and a porcelain gnome warns: *"Don't look at the lantern."* | Far west Mossy Wood edge |
| **Incregnomtal** | A giant muddy pawprint crater in Cloverfield Farms called **"Biscuit's Nap"** where acorns spawn twice as fast. | Cloverfield Farms |
| **Gnaft** | A battered turf-raft washed up in the southern drainage canal with a "Castaway" NPC muttering about lawn sharks. | South edge of Turfton / Farmland |
| **Gnome Bowling / Billiards / Blackjack / Club Gnome** | **The Gnomecino** neon sign downtown; **Big Lou** occasionally spotted as a VIP bouncer outside who refuses to let anyone in wearing a wet hat. | Downtown Turfton |
| **Cooking Gnoma** | **Gnoma's Food Truck** parked near the Glaze Clinic, selling *Acorn-Flour Cake* (+100% Clay Health) while Gnoma yells *"Oops, a little wobbly! We learn from it!"* if you bump her truck. | Outside Glaze Clinic |
| **Aether Board** | A glowing blue ley-line ramp on the highest peak of **Frostbite Fells**—hitting it on a Push-Mower Bike triggers a brief zero-gravity trick chime. | North Frostbite Fells |
| **Faster Than Lawn** | A charred, crop-circle scorch mark in the Dust Flats with a tinfoil-hatted NPC swearing a "Faster-Than-Lawn Crew Cruiser" abducted his lawnmower. | Dust Flats desert |
| **Peak Climb** | A tiny rusted climbing piton and coiled twine hammered into the tallest snow-drift of Frostbite Fells. | North Frostbite Fells |
| **Gnome Golf & Mower Chain** | A billboard for *Island Links Mini-Golf* downtown, plus a Carburettor street challenge where five Push-Mower Bikes tailgate in a literal *Mower Chain*. | Turfton highways |

---

## 8. Lore-Enriched Side Quests (*Strangers & Freaks of Turfton*)

Each side quest pushes the Gnomiverse's lore forward while keeping the dry, sarcastic GTA-parody voice:

1. **"The Grid Truthers"** *(Turfton — Pushes `turfton` loose thread)*
   - **Giver:** **Mossley "Plumb-Line" Inkcap**, a paranoid surveyor gnome with a chalkboard.
   - **Plot:** Mossley is convinced Turfton's perfect 60-unit grid (`ROAD_PITCH = 60`) proves the Tall Ones are *still* watching—or that Turfton is a scale model in someone's hobby room. You drive him to four survey markers while dodging Hat Watch patrols who think he's vandalizing sidewalks.
   - **Lore Payoff:** Finds a buried **Tall-One Pencil** (the size of a redwood) under `x = 0, z = 0`. Mossley realizes the truth is even weirder—and promptly sells the graphite as "artisan eyebrow pencil" to fund his retirement.

2. **"Porcelain Blues"** *(Mossy Wood — Connects `the-tall-house` to `apocrypha`)*
   - **Giver:** **Clara**, a cracked porcelain gnome hiding in a hollow log near the boarded-up porch.
   - **Plot:** Unlike Turfton's earthenware gnomes, Clara can't just "wash out" and walk away—she's brittle. She asks you to recover three **Wax Lanterns** stolen by HOA scavengers before nightfall so she can seal the porch door for good.
   - **Lore Payoff:** Explores the real tragedy of porcelain gnomes vs. earthenware gnomes (R-003), ending on a quiet, sincere note before Clara gifts you a **Porcelain-Glaze Charm** (reduces vehicle/fall chip damage).

3. **"The Fescue Fugitive"** *(Mossy Wood / Cloverfield — Connects `fescue` myths to `apocrypha`)*
   - **Giver:** **Elder Bracken**, a grumpy Unmowed scholar.
   - **Plot:** Bracken wants you to steal back a **Replica Stopping Stone** from Vesper's private museum—not because it's magical, but because Vesper is using it as a *doorstop*.
   - **Lore Payoff:** Reveals how Fescue's sacred history gets commodified into tacky lawn ornaments in Turfton, forcing the protagonist to choose between returning it to Bracken or fencing it to Granny Gnertrude for a massive acorn payout.

4. **"The HOA Audit"** *(All Biomes — Develops `hoa` lore)*
   - **Giver:** **Burt**, a nervous former HOA junior inspector who grew a conscience (or just got stiffed on overtime).
   - **Plot:** Repossess five absurdly petty HOA citation drones/vans across the biomes (citing a cactus in the Dust Flats for "unruly needles", citing a snowman in Frostbite Fells for "exceeding seasonal height").
   - **Lore Payoff:** Exposes how the HOA isn't run by Tall Ones at all—it's a cartel of middle-management gnomes pretending to speak for the Tall Ones to scare everyone else into paying tribute.

5. **"Castaway's Dry-Dock"** *(Cloverfield / Canal — Connects `gnaft`)*
   - **Giver:** **Driftwood**, a sun-bleached gnome sitting on a lawn-boat trailer.
   - **Plot:** Tow his makeshift raft across Cloverfield Farms using a Combine Harvester's hitch so he can reach the "Big Puddle" before the dry season hits.
   - **Reward:** Unlocks a custom **Sea-Foam Mower Tint** and a **Captain's Hat** cosmetic.

6. **"The Mulch Pyramid Scheme"** *(Turfton / Mossy Wood — Connects `gnome-company`)*
   - **Giver:** **Cedric "Double-Bag" Peat**, a fast-talking *Chapel of Mulch* upline recruiter operating out of a rusted van.
   - **Plot:** Cedric convinces you to deliver three pallets of "Artisanal Miracle Mulch" (literally dyed sawdust and craft glitter) to gullible suburban yards—only for the buyers to realize it attracts wasps and call the Hat Watch. You have to repo the bags before the HOA confiscates them as "unregistered organic matter."
   - **Lore Payoff:** Exposes how *The Chapel of Mulch* funds its quota-driven operations in the wider Gnomiverse, and rewards you with the **Mulch-Spreader** attachment.

7. **"Biscuit's Lost Squeaky Toy"** *(Cloverfield Farms — Connects `incregnomtal`)*
   - **Giver:** **Farmer Bramble**, trembling in a storm cellar near the giant pawprint crater.
   - **Plot:** **Biscuit** (the unseen giant dog whose pawprint is a literal landmark) dropped a rubber squeaky hotdog the size of a city bus into Cloverfield's irrigation ditch. You must winch it out with a **Combine Harvester** and drag it back to the fence line before Biscuit returns and accidentally flattens three barns looking for it.
   - **Lore Payoff:** Every time the hotdog hits a bump, it lets out a deafening *SQUEAK* that panics every NPC within 80 units (`poseHandsUp`) and temporarily clears Hat Watch patrols who think a Tall One is whistling.

8. **"Snail-Racing Rigging"** *(Turfton Alleys — Shelldon's Side Arc)*
   - **Giver:** **Shelldon "No-Trail" Mucilage**, hiding behind a dumpster off `ROAD_LINES`.
   - **Plot:** Shelldon's encrypted courier snails are losing the underground alley-races to a rival syndicate's *Espresso-Fed Slugs*. Sneak into the rival paddock, swap their romaine lettuce for *decaf dandelion greens*, and toss a **Dandelion Puff-Grenade** to cover your escape.
   - **Reward:** Unlocks Shelldon's **Courier Express** perk (faster Hat Watch heat cooldown in alleys) and a **Tinfoil-Lined Trench Hat**.

9. **"The Porcelain Support Group"** *(Mossy Wood — Connects `the-tall-house` / `paragnormal`)*
   - **Giver:** **Clara**, hosting a whispered midnight meeting inside a hollow oak stump.
   - **Plot:** Four newly escaped porcelain gnomes from the Tall House porch need to be escorted to a padded moss bunker. Because porcelain shatters easily, you must drive them in a shock-absorbed **Ride-On Lowrider**—every curb hop, pothole, or gunfire ping chips their glaze and slashes your payout.
   - **Lore Payoff:** Heartfelt, darkly funny dialogue from the porcelain refugees arguing over whether a toaster is a Tall-One altar.

10. **"The Great Hose-Pipe Tax Revolt"** *(Turfton Suburbs — Connects `hat-watch` & `hoa`)*
    - **Giver:** **Baroness Brenda of the Vinyl Lounge**, holding court on her zip-tied lawn-chair throne.
    - **Plot:** Brenda declares the southern drainage canal "The Sovereign Republic of New Puddle" and tasks you with kinking four pressurized Tall-One garden hoses across Turfton to flood Vesper's pristine putting-green country club—triggering an instant **4-Hat HOA Van** response.
    - **Reward:** Unlocks the **Garden-Hose Whip** weapon and Brenda's **Leopard Sun-Visor**.

11. **"Big Lou's Wet-Hat Embargo"** *(Downtown Turfton — Connects `club-gnome` / `gnome-bowling`)*
    - **Giver:** **Big Lou**, glaring outside *The Gnomecino* with his arms crossed.
    - **Plot:** Red Cap hooligans hijacked Big Lou's VIP shipment of microfiber hat-towels. Recover the crate and chauffeur a high-roller bowler across downtown in a **Zero-Turn Racer** without touching a single puddle or sprinkler—if the VIP's bowler hat gets even 1% damp, Big Lou locks the Gnomecino doors for a week.
    - **Reward:** Free VIP entry to *The Gnomecino* + **Pin-Striped Bowling Shirt** cosmetic.

---

## 9. Storyboarded Main Story Quests

The 70 built main quests, from [story-outline.md](story-outline.md) and `games/gnome-theft-auto/src/quests/story/`. Ids in code format are the saved quest ids: kept quests keep their old ids (`ch1-`, `ch2-`, `ch3-`, `ch4-`, `ch5-` prefixes), new ones are `m<NN>-<slug>`. An extended quest's row id is its **final** part (what a save records as finished); earlier parts are `<id>-p1`, `-p2`, ... chained before it. Rulings R-229..R-235 change a few beats and are noted in the rows they touch. The full beat lists, cast and objective kinds are in the outline.

### Act I: *Fresh Glaze* (rows 1-15)

| Row | Quest id | Title | Beat |
|---|---|---|---|
| 1 | `prologue-fresh-kiln` | Fresh Out the Kiln | Pip botches a Ride-On jacking; follow him to Side-Valve Salvage and meet Tansy. |
| 2 | `m02-roof-on-credit` | A Roof on Credit | Follow Mabel's cab to the First Kiln Bank for a loan on flat 3B. |
| 3 | `first-contract` | First Contract | Don Compost's three wanted posters: crack Dibbler, Gravelbottom and Spadewell. |
| 4 | `ch1-mowers-keepers` | Mower's Keepers | Repo two clamped push-bikes; the eviction notice names Vesper Thorne. |
| 5 | `m05-sweepers-wages` | Sweeper's Wages | Run a carburettor to the Carburettors' night meet under the Unfinished Span with Cam. |
| 6 | `ch1-two-coat-tail` | Two-Coat Tail | Tail Mayor Mulch to Patio Heights; photograph the kickback and meet Vesper. |
| 7 | `m07-even-estates` | Even-Estates | Drive Juniper to the Levelright site and photograph the permits. |
| 8 | `ch1-tax-break-in` | The Glaze & Tax Break-In | Steal Tansy's deed and the Grand Combine blueprint, smash back in a Buck-Iron Combine. |
| 9 | `m09-where-asphalt-sleeps` | Where Asphalt Sleeps | Trace Bodega's cat Asphalt by three sightings to the Gutter Bowls. |
| 10 | `m10-under-the-span` | Under the Span | Trade salvage parts to Hogweed Sprocket for Pip's radio jammer. |
| 11 | `m11-the-dons-cigars` | The Don's Cigars | Run the Don's acorn-cigar crates past Brenda's toll and an HOA inspection. |
| 12 | `m12-quarter-inch-at-home` | Quarter-Inch at Home | Forge a pass, swap Reginald's calipers in townhouse 404 and see the Vance photograph. |
| 13 | `m13-diner-on-route-south` | Diner on Route South | Collect Sage Ladle's debt by serving six plates at the diner rush. |
| 14 | `m14-drainpipe-court` | Drainpipe Court | Win Pip's toolbox back at the court; Pip says why he left Fescue (the sincere beat, no gag). |
| 15 | `ch1-founders-boot` | Founder's Boot & The Kangaroo Court | Extended. `-p1` Parade Permits: lift the Boot float's keys. `-p2` Dress Rehearsal: night run through the Even-Estates site. Final: crash the HOA tribunal; Vesper closes the act. |

### Act II: *Turf & Dew* (rows 16-35)

| Row | Quest id | Title | Beat |
|---|---|---|---|
| 16 | `ch2-dew-run` | Dew Run on Route South | Block the highway and hijack the Black Dew convoy for Granny. |
| 17 | `m17-the-dew-buyer` | The Dew Buyer | Tail the unmarked tanker at dusk west to its buyer at Trellisdown. |
| 18 | `ch2-sprinkler-gauntlet` | The Cloverfield Sprinkler Gauntlet | Crack the laser-level surveyors and tow Granny's armoured silo through the sprinklers. |
| 19 | `m19-squall-box-forecast` | The Squall-Box Forecast | Move Rooster's three barometers to three fields without bouncing. |
| 20 | `ch2-vespers-offer` | Order Over Chaos | Vesper offers the penthouse at the diner; the player refuses and shakes the pursuit. |
| 21 | `m21-penthouse-viewing` | Penthouse Viewing | View the Double Pot penthouse; Cam is parking cars in an HOA vest. |
| 22 | `m22-off-air` | Off Air | Tail the HOA van that confiscated Sorrel's rain tapes and take them back. |
| 23 | `ch2-unmowed-tablet` | The Cracked Tablet | Elder Bracken shows the tablet: the Combine is patterned on Fescue's Mower (sincere, no gag). |
| 24 | `m24-the-burrow-door` | The Burrow Door | Carry the small mole Nubbin away from his chasers to Loamdeep. |
| 25 | `m25-one-leg-to-stand-on` | One Leg to Stand On | Stand on one leg through Mother Saxifrage's sermon to get Driftwood's raft back. |
| 26 | `m26-the-knot-hole` | The Knot-Hole | Drive Pip to the Fence gap to look through the knot-hole (sincere). |
| 27 | `m27-heap-of-trouble` | Heap of Trouble | Tail an HOA plate convoy north up the Ring Road at night. |
| 28 | `m28-sibling-rivalry` | Sibling Rivalry | Escort Reginald to the Tattler to confirm the permits; Reginald corrects a spelling. |
| 29 | `m29-the-kicked-board` | The Kicked Board | Follow the falling golf balls to the loose board and through to Hedgeworth. |
| 30 | `m30-cams-big-night` | Cam's Big Night | Be Cam's pit crew at the Lost & Found Speedway. |
| 31 | `m31-granny-cracks` | Granny Cracks | Crack the bailiffs who chipped Granny and drive her smoothly to the Glaze Clinic. |
| 32 | `m32-driftwoods-chart` | Driftwood's Chart | Tow Driftwood's raft down the Southern Drainage Canal toward the Saltwater. |
| 33 | `m33-the-bench-lock` | The Bench Lock | Fit the new lock to the bench where the Golden Acorn sleeps; Cam is there. |
| 34 | `m34-forty-seven-wrenches` | Forty-Seven Wrenches | Fetch the guests for Pip's party at the bay; Cam's call turns it sour. |
| 35 | `ch3-salvage-raid` | The Salvage Raid | Extended. `-p1` Tuesday: trail Cam's route to the Patio Gate. `-p2` Hold the Bay: the bench lock opens with Cam's code. Final: Vesper takes the acorn in person, Pip's arm cracks off, the crew flees north. |

### Act III: *Cold Clay, Far Edges* (rows 36-53)

| Row | Quest id | Title | Beat |
|---|---|---|---|
| 36 | `ch3-kiln-resin-ice` | Kiln-Resin & Black Ice | Fetch Kiln-Resin, crack the salt-plow drivers, survive the Frozen Birdbath Derby. |
| 37 | `m37-snowdrop-slope` | Snowdrop Slope | Lose the HOA plows on the slope and reach Gentian's lodge. |
| 38 | `m38-pail-pond` | Pail Pond | Probe the ice for an HOA radio; it shows the Combine is built in four parts. |
| 39 | `m39-couch-surfing` | Couch Surfing | Sneak back into Turfton in disguise and move Pip into flat 3B. |
| 40 | `m40-the-capwood-run` | The Capwood Run | Win the mountain race so Lulu's Carburettors back the crew. |
| 41 | `m41-pinwheel-ridge` | Pinwheel Ridge | Part one, power: free three pinwheels from the HOA cabling. |
| 42 | `m42-rutbottom-impound` | Rutbottom Impound | Beat the HOA entry on Clary Mudguard's oval to free six impounded rides. |
| 43 | `m43-saltbucket-boardwalk` | Saltbucket Boardwalk | Reach Driftwood's boardwalk and spot HOA barges at sea (sincere). |
| 44 | `m44-the-bathtub-queen` | The Bathtub Queen | Board a barge, take its spare blades and outrun the convoy with Captain Bilge. |
| 45 | `m45-rootwell-admissions` | Rootwell Admissions | Enrol at Rootwell as a mature student and find Betony. |
| 46 | `m46-starfall-at-the-anthill` | Starfall at the Anthill | Part two, guidance. Extended. `-p1` Night Class. `-p2` The Sugar Toll. `-p3` The Lens. Final: Dean's Leap. |
| 47 | `m47-hedgeworth-links` | Hedgeworth Links | Beat pro Basil Divot at one hole so Peony will hear the plan. |
| 48 | `m48-the-groundskeepers-secret` | The Groundskeeper's Secret | Move Thrift's hidden mole family past Basil's trap-line (sincere). |
| 49 | `m49-loamdeep` | Loamdeep | Do the Burrowfolk's three jobs; Loamdeep takes the crew in. |
| 50 | `m50-trellisdown-tasting` | Trellisdown Tasting | Part three, money: slip into the Countess's tasting for the ledger; Vesper and the player share a frame. |
| 51 | `m51-the-flock-stands` | The Flock Stands | Drive the Standing Lady to Hedgeworth with the Flock following on one leg. |
| 52 | `m52-the-test-cut` | The Test Cut | Part four, the deck. Extended. `-p1` Tee Time. `-p2` Mow Line. `-p3` Against the Deck. Final: Through the Hedge; Vesper names the Even Cut. |
| 53 | `ch3-tundra-drift-run` | Volatile on Ice | Bracken lends the Stopping Stone; run it to the Dust Flats Overlook past HOA spotters. |

### Act IV: *Sandpit Protocol / The Even Cut* (rows 54-70)

| Row | Quest id | Title | Beat |
|---|---|---|---|
| 54 | `m54-the-heist-board` | The Heist Board | Photograph Fort Sandpit's three sides and fetch Wally; Tansy lets Pip run a plan. |
| 55 | `ch4-runway-flares` | Runway Flares | Clear the airfield apron, steal the Crop Duster and drop flares over the Dust Flats. |
| 56 | `m56-mortar-for-a-mower` | A Mortar for a Mower | Fly night-low to Hogweed for a mortar and a parachute that almost certainly opens. |
| 57 | `ch4-sandpit-drop` | The Sandpit Drop | Parachute into Fort Sandpit and steal the Whirligig. |
| 58 | `m58-the-reeves-barn` | The Reeve's Barn | Fix Pebblewick's pump before the water cut-off; the Whirligig hides in the hay. |
| 59 | `ch4-spade-truce` | Nobody Fires the Guard | Diggs turns on Vesper; crack the lockout enforcers at the sealed armory. |
| 60 | `m60-the-moles-dig` | The Moles Dig | Escort the moles to dig under the wall; Diggs salutes the first mole out. |
| 61 | `m61-diggs-medal` | Diggs's Medal | Fetch Diggs's medal from the HOA lost-property shed (sincere). |
| 62 | `m62-cams-cell` | Cam's Cell | Break into the HOA lockup; free Cam or leave him (Ending A or B for the epilogue). |
| 63 | `m63-four-taps` | Four Taps | The Don taps four times; fetch the Mayor from Café Pardon in Pardonlin (R-234) to the Mulch Club to sign. |
| 64 | `m64-all-hats` | All Hats | Extended. `-p1` By Water. `-p2` By Air: the beacon goes up on the Bobble (R-234). `-p3` By Road. Final: By Root; every cap on one table, Tansy says "All hats." |
| 65 | `m65-the-countess-relents` | The Countess Relents | Carry her first vine to the Unmown (R-234) for the key to the Combine's shield grates. |
| 66 | `m66-porcelain-hearts` | Porcelain Hearts | Cross Clara's sealed porch with her (sincere, no gag). |
| 67 | `m67-emergency-assessment` | Emergency Assessment | Vesper seizes City Hall; fight in with Reginald and free Juniper. |
| 68 | `m68-lights-out` | Lights Out in Turfton | Dinner in flat 3B, drive each friend home, a hush on the roof the night before. |
| 69 | `m69-the-combine-wakes` | The Combine Wakes | Dawn: evacuate the Even-Estates site as the Grand Combine leaves the Heap. |
| 70 | `ch5-even-cut` | The Even Cut | Extended. `-p1` Air Support. `-p2` Deck Drop. `-p3` The Gilded Lawn-Throne. Final: The Jam & The Choice, with the Stopping Stone and Endings A or B. |

---

## 10. Turfton FM: Radio, Commercials & Breaking News Satire

> **Status: built.** Press N in any mower or plane to turn the dial. The code is `games/gnome-theft-auto/src/radio/`
> (`content.ts` holds every line, song and advert; `schedule.ts` the programme rules; `player.ts` the floating text and music).
> The hosts and the station history are in `docs/lore/entries/apocrypha/` (start at [turfton-fm.md](../../lore/entries/apocrypha/turfton-fm.md)).

Whenever the player is driving a mower or flying the Crop Duster, the radio plays one of three stations (or nothing):
generated music from `@lawn/music`, DJ banter, fake adverts, callers, traffic reports from the map's real places, and
breaking-news bulletins that react to the Hat Watch level and to what the player has done. Talk is shown as subtitles in a
floating text (no box, outlined); the music ducks under it. Options > Radio text turns the words off.

### The Stations & Their Hosts
1. **99.3 THE BLADE** (*The Blade*). Big-beat music. Hosted by **Dock "Full-Throttle" Hoewright**, who will not say "mower" on air and counts "one, two, Blade" on the hour. The morning show belongs to **Lawn-Dart**, an unseen voice from a birdbath who knows the Hat Watch's dispatch before the Watch does.
   - *Banter:* *"Good morning, Turfton! This is the Blade, and the machine is running, so you're running with it."*
   - *Banter:* *"If your grass is over two inches, don't cut it. Paint it beige and tell Reginald Vance it's a decorative wheat field."*
2. **88.7 FESCUE PUBLIC RADIO** (*Fescue Public*). Lullaby music. Hosted by **Sorrel Tillbrook**, a Fescue exile who calls the mower "the one in the Shed" and records her forty-five minutes of rain on terracotta at the Fence gap. Her creak and her knock are loose threads.
   - *Banter:* *"Today on Kiln & Culture: why Turfton's youth insist on strapping twin turbos to sacred garden implements. I have opinions. Let's hold them until the end."*
3. **104.1 HOA COMPLIANCE BEATS** (*Compliance Beats*). Smooth jazz. Hosted by **Cress Caliper**, a former HOA clerk who wrote the fines for smiling and was fired for smiling on air. The station is HOA-sponsored and she is still on the payroll; she says so.
   - *Banter:* *"Reminder: Section 12-C prohibits unlicensed lawn flamingos, unauthorised puddles and smiling without a municipal permit. I wrote that section. I am very sorry."*

Callers (Rooster Weatherby on his windmill, Shelldon "No-Trail" Mucilage, Reginald Vance measuring the carpet) and the caller exchanges are in `content.ts` and the caller entries in the lore.

4. **108.0 SUBSOIL RADIO** (*Subsoil*, a bonus station at the end of the dial). Underground techno hosted by **DJ Moleman**, a mole who broadcasts from a burrow under Turfton. Unlike the other stations it plays one set that never restarts: acid, dub and drum techno that blend into each other (`packages/music/src/themes/undergroundSet.ts`). The credit on screen follows the part of the set that is playing. Lore: [dj-moleman.md](../../lore/entries/apocrypha/dj-moleman.md), [subsoil-radio.md](../../lore/entries/apocrypha/subsoil-radio.md).
   - *Banter:* *"I don't do the weather. I do the ground."*

### In-Universe Commercials (rewritten for R-021: cracking and gluing, no soaking)
- **Glaze Clinic:** *"Chipped? Cracked? Got your beard caught in a sprinkler? Come on down to the Glaze Clinic! We'll buff your brim and glue your arm back on, no questions asked!"*
- **Side-Valve Salvage:** *"Is your mower smoking? Did the Hat Watch ask whose flowerpot you drove through? Fresh paint in three seconds flat. Is the VIN filed off? Great. We don't know what a VIN is."*
- **HOA Compliance & Lien Services:** *"Think nobody's watching your verge? Reginald Vance is. A crooked hat is a cry for foreclosure."*
- **The Gnomecino:** *"Now with 100% fewer chair-thrown brawls! Big Lou checks your hat at the door."*
- **Gnoma's Food Truck:** *"Try our Triple-Acorn Waffle! If you ram the truck: 'Oops, a little wobbly! We learn from it!'"*
- Shared commercials for the brand rivalries in `brands.md` (Buck-Iron and Razor-Back, Acorn-Cola and Dandelion Fizz, Kiln-Shield, Stink-Gro, Pay 'n' Glaze, the courier war) play in every ad break.

### Dynamic Breaking News Bulletins
- **1-Hat Watch:** *"Traffic alert: a gnome in a suspiciously shiny hat has been spotted 'aggressively borrowing' a Push-Mower Bike."*
- **2-Hat Watch:** *"Two-Hat alert: an unidentified gnome has been seen leaving the Mulch Club by the back door, which is not the door for leaving."*
- **3-Hat Watch:** *"BREAKING NEWS: an unidentified maniac is drifting a Zero-Turn Racer through downtown Turfton while launching acorns at municipal property!"*
- **Things the player does** (one bulletin per achievement, repeated at most every 2 minutes): borrowing a mower, the Whirligig, an explosion, a crop-duster take-off, a skydive, the first contract, a townsgnome run over, a snow drift, a cracked gnome. News that happens with nobody driving waits for the next drive (R-029).
- **Not built:** the 4-Hat "THE HOA" bulletin (the Watch tops out at three, R-028), and Post-Quest and Post-Chapter bulletins (the quests are built; the bulletins are not).

---

## 11. Unhinged New Prefabs, Weapons, Vehicles & Achievements (PG-13 / No-Gore)

All new toys honor the Gnomiverse's **no-gore fired-clay & garden-scale comedy** rules—cracking targets into clay shards (R-021), sending gnomes flying in goofy ragdoll arcs, or popping their hats off without a single drop of blood (with hoses and sprinklers reserved for comedy hazards).

### New Weapons (Garden-Scale Mayhem)
| Weapon | Mechanic & Comedy Payoff |
|---|---|
| **Leaf-Blower Cannon** | High-velocity air blast that launches ragdoll pedestrians, Hat Watch cruisers, and loose acorns halfway down the block with zero lethal gore. |
| **Acorn Mortar** | Arcing launcher firing toasted acorns that burst into bouncing shrapnel, knocking enemies off their mowers and rattling porcelain shields. |
| **Tow-Cable Whip** | Heavy steel tow-line swung like a whip—rips doors off HOA vans, trips pursuing officers, and yanks riders off Push-Mower Bikes. |
| **Acorn Trip-Mine** | Deployable mechanical spring-trap that flings pursuing mowers skyward into goofy `ragdoll.ts` tumbles. |
| **Dandelion Puff-Grenade** | Explodes in a blinding white fluff-cloud smoke screen that makes nearby Hat Watch officers sneeze uncontrollably and drop aggro. |

### New Vehicles
| Vehicle | Class & Signature Gimmick |
|---|---|
| **Ride-On Lowrider** | Custom `MOWER_TINTS` Ride-On equipped with working hydraulics—tap `Space` to bounce over roadblocks, kerb-hop, or keep Clara's porcelain passengers level over bumps. |
| **Gnorwin's Boot Parade Float** | 30-foot papier-mâché boot on a tractor chassis. Slow, massive ramming weight, and honking the horn fires a confetti-and-acorn fanfare blast. |
| **Snail-Coach** | Turfton's boxy public transit bus. Hilarious drift angle; NPCs inside politely hold onto the overhead garden-twine straps while you barrel-roll it. |
| **Pressurized Mulch-Spreader** | Utility mower with a rear-mounted mulch cannon that drops slippery compost slicks behind you to spin out tailgating Code-Enforcement Vans. |

### New `@lawn/prefabs`
- `leaf-blower-cannon`, `acorn-mortar`, `tow-cable-whip`, `acorn-trip-mine`, `stopping-stone`, `hoa-clipboard`, `dew-tanker`, `grand-combine-boss`, `tall-one-pencil`, `porcelain-lantern`, `boot-parade-float`, `squeaky-hotdog-giant`, `brass-calipers`.

### New `@lawn/achievements` (with Cosmetic Gear Rewards)
| Achievement | Unlock Condition | Cosmetic Reward (`@lawn/prefabs`) |
|---|---|---|
| **Fresh Out the Kiln** | Complete the Prologue and reach *Side-Valve Salvage*. | *Tansy's Grease-Stained Apron* (`back`) |
| **Boot-Legger** | Hijack Gnorwin's Boot Parade Float and crash the HOA Tribunal. | *Mini Boot Hat* (`head`) |
| **Turf-Code Violator** | Trigger 4-Hat ("THE HOA") heat and smash a Code-Enforcement Van. | *Broken Brass Calipers* (`hand`) |
| **Mid-Air Mower-Jack** | Complete the Crop Duster to Whirligig mid-air grapple transfer. | *Aviator Acorn Goggles* (`head`) |
| **Snail-Mail Saboteur** | Rig the underground alley snail races for Shelldon. | *Tinfoil Conspiracy Brim* (`head`) |
| **Dry as a Bone** | Deliver Big Lou's VIP bowler hat without touching a single puddle. | *Microfiber Bowler* (`head`) |
| **The Even Cut** | Jam the Grand Combine with the Stopping Stone and finish the story. | *Golden Stopping-Stone Charm* (`neck`) |

---

## 12. Architecture: Connecting to What Exists vs. What's Next

### What Already Exists in `games/gnome-theft-auto/src/`
| Existing Module | Story Hook / Ready Today |
|---|---|
| `config.ts` & `biomes.ts` | 1200×1200 map with 5 named biomes (`Turfton`, `The Dust Flats`, `Mossy Wood`, `Frostbite Fells`, `Cloverfield Farms`), `HIGHWAYS`, `BASE` (Fort Sandpit), and `AIRFIELD` are already built and named. |
| `vehicles.ts` & `simdrive.ts` | All 6 signature vehicles (`push-bike`, `ride-on`, `zero-turn`, `combine`, `plane`, `whirligig`) + damage stages (`dented`, `wrecked`), exploding/charred wrecks (R-024), and `@lawn/vehicle` sim physics. |
| `weapons.ts` & `fx.ts` | Hitscan `Pistol`, `SMG`, `Shotgun`, `Rifle` + reload/swap + projectile tracers + clay-shard & explosion FX. |
| `police.ts` & `npcs.ts` | **Hat Watch** (1–3 Hats), **Spade Guard** at `BASE.guardPosts`, `CRACK_LINES` / `STEAL_LINES` / `RUNOVER_LINES` toasts, `ragdoll.ts` flings, and persistent clay shards (`R-023`). |
| `hud.ts` & `textures.ts` | Minimap + full-screen map (`M`), procedural road/building textures, and quest tracker HUD. |
| `gnomes.ts` | `@lawn/gnome` integration (`loadMyGnome`, `getMyGnome`) so the player's own gnome is the protagonist. |
| `ambulance.ts` | **Glaze Clinic Ambulance** (R-022/R-023) that collects a cracked player and glues them back together outside the Glaze Clinic Hospital. |
| `quests/` (`defs.ts`, `quests.ts`, `cutscene.ts`, `types.ts`) | **Data-driven quest engine** (PR #266): `crack` and `visit` objective table, `localStorage` save, silent mob-boss back-room cutscene (`Don Compost` at `gta-mulch-club`), spinning markers, map blips, tracker HUD, and *"First Contract"* demo quest. |
| `net.ts` & `remotes.ts` | `@lawn/mp` drop-in online free-roam (`1–16` players) — quests currently run single-player; co-op lobbies planned. |

### What Has Yet to Exist (Implementation Roadmap)
1. **Extending `src/quests/` (`defs.ts`, `quests.ts`):**
   - Add new objective kinds (`drive`, `escort`, `deliver`, `fly`, `survive-heat`) alongside `crack` and `visit`, plus `@lawn/cloudsave` sync alongside `localStorage`.
2. **Dialogue, Voice/Subtitle & Radio UI (`src/dialogue.ts`; the radio is built in `src/radio/`, see §10):**
   - Keep **Don Compost**'s signature silent poster-and-icon cutscenes (`cutscene.ts`) for Mulch Club contracts, while adding a bottom-third subtitle/portrait box for speaking characters (Pip, Tansy, Vesper, Granny). **Turfton FM Radio** is built (`src/radio/`, music from `@lawn/music`).
3. **Quest Givers, Waypoints & World Markers (`src/markers.ts`):**
   - Glowing 3D ground rings (`T`, `P`, `G`, `!`) on the map + minimap icons in `hud.ts` to start missions and mark mission targets.
4. **Faction Hostility & Pursuit Mowers:**
   - Extending `police.ts` / `npcs.ts` with **Hat Watch Pursuit Mowers** (so officers can actually keep up with `16–27` speed mowers) and mission-spawned enemy squads (HOA Enforcers, Red/Blue Caps) that shoot back.
5. **Online Co-Op & World Events (`@lawn/mp`, 1–16 Players):**
   - Private `?room=CODE` lobbies support co-op story missions where crewmates ride shotgun or fly escort in the Crop Duster.
   - Public free-roam turns story beats into shared **World Events** (Dew Convoy ambushes, Zero-Turn Drift Trials with `@lawn/vehicle` handling, and HOA Code-Enforcement Van raids).
6. **Sandbox Loops, Economy & Safehouses:**
   - **Acorns** currency (`hud.ts`), Glaze Clinic "Cracked" hospital fee, **Safehouse Garage** (save, store `MOWER_TINTS` rides), **Pay 'n' Glaze**, **Kiln-Shield Ragdoll Fraud** (`ragdoll.ts` side activity), and map **Collectibles** (25 Golden Acorns, 10 Stopping-Stone Shards, 15 HOA Foreclosure Signs to smash).
7. **New `@lawn/prefabs` & `@lawn/achievements`:**
   - Prefabs listed in §11; achievements in `packages/achievements/src/catalog.ts`.

---

## 13. New Content & Feature Ideas (In-Theme)

- **Turfton Radio ("99.3 THE BLADE"):** Built (§10). N turns the dial in any mower or plane; the floating text shows the station and subtitles. The Pay 'n' Glaze and Heist Board ideas below are not built.
- **Pay 'n' Glaze:** Drive a smoking, dented mower with 3-Hat Heat into Tansy's garage to repair it, swap its `MOWER_TINTS` colour, and instantly clear Hat Watch heat.
- **The Heist Board (Act IV):** A visual planning board in the safehouse (and a great future **Party Slice** candidate for `@lawn/party`—e.g. a 45-second *Sandpit Air-Drop* parachute-to-Whirligig race!).
- **Wanted Escalation (Proposed 4th Hat — "THE HOA", not built):** Currently Hat Watch tops out at 3 Hats (`MAX_HEAT = 3`, R-028). A future HOA escalation tier would send an HOA **Code-Enforcement Van** with megaphones reading Municipal Code §404-B aloud, slowing nearby mowers until you smash it.
