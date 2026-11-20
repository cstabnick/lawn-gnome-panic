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
| **Pip "Two-Stroke" Potsworth** | Best Friend / Liability | Green coat, crooked red cap, grease-stained beard | Distant, disgraced cousin of **Wendel Potsworth** (Fescue's regent). Fled Fescue because he tried to put wheels on a wheelbarrow and was accused of "Mower-sympathy." Loves engines, terrible at math. | Wants to prove he's not just the family embarrassment. Nearly gets shattered in Act III protecting the protagonist's getaway. |
| **Tansy "Side-Valve" Clayfoot** | Mentor / Fixer | Charcoal coat, dark glasses, yellow cap | Claims to be a direct descendant of **Gnorwin Clayfoot**. Runs *Side-Valve Salvage* on the edge of downtown. Sharp, cynical, speaks in garden proverbs twisted into street slang. | Starts out using the protagonist to skim Black Dew; genuinely comes to care for the crew when the HOA tries to bulldoze her garage. |
| **Vesper "The Glazier" Thorne** | Main Antagonist | Crisp white porcelain finish, tall obsidian top-hat, monocle | Not earthenware like Turfton's gnomes—**porcelain**, rumored to have escaped **The Tall House**. CEO of *Thorne Lawn & Order LLC* and secret Chair of **The HOA**. Believes Turfton is "weedy, chipped, and unseemly." | Wants to seize Fort Sandpit's tech and Cloverfield's Black Dew to power **The Grand Combine**, leveling Turfton into a silent, manicured estate. |
| **Commander Diggs** | Spade Guard Hardliner | Olive cap, tactical trowel bandolier | Decorated veteran of Fort Sandpit who has spent 15 years guarding a flying mower nobody is legally allowed to turn on. | Starts as an enemy during the Fort Sandpit raid; turns reluctant ally in Act IV when he realizes Vesper plans to scrap the Spade Guard too. |
| **Don Compost** *(In-Game — R-025)* | Silent Underworld Boss | Cream suit, black hat, armchair on a dais inside **The Mulch Club** (`x: -16, z: -30`), flanked by two pistol-packing bodyguards | Runs Turfton's members-only syndicate without uttering a single word. Lays out wanted posters with red crosses, taps icon bubbles (`🎯`, `💰`), and points. | Gives the protagonist their **First Contract** (cracking gold-hatted targets across three biomes) to pay down their Kiln-Debt; later becomes an uneasy underworld ally against Vesper's HOA takeover. |
| **Granny Gnertrude** | Information Broker / Fence | Floral apron, oversized spectacles, pink bonnet | Runs a "bake shop" near the Cloverfield border. Actually the sharpest black-market acorn fence in three biomes. | Supplies the crew with forged HOA permits and heavy hardware (`Shotgun`, `Rifle`) in exchange for rare Fescue relics. |

### Supporting Cast & Local Weirdos
| Character | Role | Look & Vibe | Unhinged Behaviour & Lore Hook |
|---|---|---|---|
| **Rooster "Squall-Box" Weatherby** | Rogue Weather-Vane Prophet | Tinfoil-lined pointed cap, crooked tin-funnel megaphone, grass-stained overalls | Roosts atop a rusted Cloverfield windmill screaming barometric prophecies (*"THE BAROMETER IS DROPPING! VESPERS IN THE CLOUDS!"*). Insists the Tall Ones communicate exclusively through oscillating sprinkler patterns. |
| **Reginald "Quarter-Inch" Vance** | Obsessive HOA Turf-Auditor | Beige vest, brass pocket-calipers, monocle-loupe, laminated *Turfton Municipal Code §404-B* | Measures grass height with a laser level at 3:00 AM. Issues fines for "unauthorized dandelion posture" and carries a whistle tuned to summon Code-Enforcement Vans. |
| **Baroness Brenda of the Vinyl Lounge** | Feral Lawn-Chair Baron | Leopard-print poncho, sun-visor hat, feather duster scepter | Rules the southern drainage canal ("The Sovereign Republic of New Puddle") from a 9-foot throne of zip-tied folding patio loungers. Commands a biker gang of Push-Mower Bikes. |
| **Shelldon "No-Trail" Mucilage** | Conspiracy-Theorist Snail-Courier | Oversized spectacles, mossy trench coat, backpack full of lettuce | Refuses to step on paved roads (*"THE GRID IS A TALL-ONE CIRCUIT BOARD, MAN!"*). Runs Turfton's only encrypted messaging network by taping micro-scrolls to racing snails. |
| **Father Loam** | Chop-Shop Chaplain | Compost-stained robe, chrome-rimmed sunglasses, wrench-shaped pendant | Excommunicated from *The Chapel of Mulch* (`gnome-company`) for preaching that twin-turbo carburetors are a "gift of the Kiln." Blesses getaway mowers with artisanal compost tea. |
| **Squeaky-Clean Midge** | Hyper-Caffeinated Glaze Clinic Intern | Splattered white lab coat, dual-cup espresso-acorn helmet | Treats a minor hat chip like a five-alarm ER trauma while vibrating at 140 BPM. Can re-glaze a shattered bumper in four seconds flat if you don't ask what's in the bucket. |

---

## 5. Factions & Motivations

1. **The Hat Watch** *(Existing — `police.ts`)*
   - **Who:** Turfton's municipal police in navy caps and yellow coats.
   - **Motivation:** Keep the sidewalks dry, hit their monthly jay-mowing and splash-ticket quota, and never, *ever* file paperwork after 5:00 PM.
   - **Story Role:** Easily bribed by Vesper in Act II; turns a blind eye to HOA enforcers while ramping up to 3-Hat Heat whenever the protagonist breathes near downtown. *(Note: per [R-016](../../lore/rulings.md#r-016), Watch officers carry parody firearms, not water guns, though municipal sprinklers and rain remain water hazards.)*

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

### Prologue: *Fresh Out the Kiln* (Turfton)
- **Beats:** Arrival at `SPAWN`, Pip's botched mower-jacking, escaping the Hat Watch, meeting Tansy at *Side-Valve Salvage*, discovering the glowing Golden Acorn in the stolen mower.

### Chapter 1: *Acorns & Alibis* (Turfton Downtown)
- **Focus:** Groundwork, street hustle, paying down your **5,000-Acorn Kiln-Debt** (bought up by *Clay-Mart Collections*), and learning Turfton's grid, guns, and vehicle classes.
- **Key Beats:**
  - **Playable Opening Contract — *"First Contract"* (`src/quests/defs.ts`, Live In-Game):** To make fast acorns, Pip sends you to **The Mulch Club** (`x: -16, z: -30`). Inside the back room, **Don Compost** silently lays out three wanted posters and points: crack the three gold-hatted rogues—**Dandy Dibbler** (Mossy Wood), **Gordie Gravelbottom** (Frostbite Fells), and **Sandy Spadewell** (The Dust Flats)—earning the *Made Gnome* (`Wiseguy Hat`) reward.
  - Repossess three "delinquent" Push-Mower Bikes for Tansy (only to realize the owners are Cloverfield farmers being squeezed by the HOA), putting another dent in the Kiln-Debt.
  - **Vesper's First Visit:** Vesper Thorne personally walks into *Side-Valve Salvage* in spotless porcelain, politely compliments your hat, serves Tansy a 48-hour foreclosure lien, and warns you not to open the Fescue crate containing the **Golden Acorn** ("Seed-Cell").
  - **City Hall Backroom:** **Councilwoman Juniper Vance** hires you off-the-books to tail **Mayor Barnaby "Two-Coat" Mulch**—catching him secretly signing median-lease kickbacks to Vesper.
  - Break into the **Turfton Glaze & Tax Office** to steal back Tansy's deed—discovering Vesper's blueprint for **The Grand Combine**, which requires a Fescue **Golden Acorn** as its ignition core.
- **Climax:** A high-speed getaway through downtown in a stolen **Combine Harvester** (`combine`), smashing through HOA roadblocks while Pip hangs off the ladder firing an SMG.
- **Escalated Setpiece — *The Gnorwin Clayfoot Boot Float Hijack*:** During Turfton's annual *Founder's Trim Day* parade, you hijack a 30-foot papier-mâché parade float shaped like Gnorwin Clayfoot's mud-caked boot, drifting it sideways through three acorn-pretzel carts while Red Caps and Blue Caps pelting each other accidentally provide cover.

### Chapter 2: *Black Dew & Greenbacks* (Cloverfield Farms & Mossy Wood)
- **Focus:** Leaving the city grid via the `south` and `west` highways (`HIGHWAYS`). Exploring biomes, convoy heists, and Fescue lore.
- **Key Beats:**
  - **Cloverfield Farms:** Help Granny Gnertrude defend her acorn silos from HOA "Code Enforcement" squads and settle the rest of your **Kiln-Debt** by hijacking a Black Dew tanker convoy on the `south` highway.
  - **Vesper's Offer:** At a highway diner, Vesper corners you alone and offers to wipe Tansy's lien *and* give you a patio penthouse if you hand over the **Golden Acorn**—establishing his chillingly reasonable "order over chaos" worldview.
  - **Mossy Wood:** Track a missing shipment into the deep woods, where **The Unmowed** (Fescue exiles) ambush you with tangled vines and an ancient **Stopping Stone** shard. **Pip** confronts his own Fescue exile when an Elder recognizes his Potsworth glaze and calls him a traitor for loving engines.
  - **The Serious Turn:** An Elder of the Unmowed shows the protagonist a cracked earthenware tablet: *the Grand Combine Vesper is building isn't a Turfton toy—it's patterned after Fescue's original Mower.* For the first time, the jokes drop. Pip asks quietly: *"Wait... they're really gonna level the whole lawn?"*
- **Escalated Setpiece — *The Cloverfield Sprinkler Gauntlet*:** Tow Granny Gnertrude's armored acorn silo on a flatbed behind a souped-up Ride-On Mower while weaving through synchronized, high-pressure oscillating sprinklers (spinning out your tires and chipping your glaze!) and dodging Reginald Vance's laser-level squad.

### Chapter 3: *Cold Clay* (Frostbite Fells)
- **Focus:** Betrayal, exile, tundra survival, and rebuilding the crew.
- **Key Beats:**
  - **The Betrayal & Ambush:** A trusted **Carburettor** lieutenant—bribed by Vesper with an exclusive Patio Heights racing charter—sells out *Side-Valve Salvage*'s location and hands over the **Golden Acorn** ignition core. *Side-Valve Salvage* is raided and hosed down. In narrative drama (R-016 gameplay remains non-lethal), Pip's clay arm cracks clean off shielding your escape, and the protagonist flees north up the `north` highway into **Frostbite Fells**.
  - **Tundra Hustle:** Hide out in a frozen cabin, run `?drive=sim` Black Dew drift-smuggling runs across frozen lakes for the remaining loyal Carburettors, and patch Pip's arm back together using **Kiln-Resin** from an abandoned shrine.
  - **The Plan:** Tansy surfaces via encrypted snail-mail (literally a snail). With Vesper now holding the Golden Acorn to power the Grand Combine, the crew needs **air superiority** and **the Unmowed's Stopping Stone**. That means hitting **The Dust Flats**.
- **Escalated Setpiece — *The Frozen Birdbath Derby*:** A 12-mower demolition derby across Frostbite Fells' frozen duck pond while HOA snowplows try to salt the ice under your tires and Father Loam cheers from a snowmobile.

### Chapter 4: *Sandpit Protocol* (The Dust Flats: Fort Sandpit & Airfield)
- **Focus:** Military heist, planes, parachutes, and the Whirligig.
- **Key Beats:**
  - **Prep 1 — The Runway:** Sneak into the **Desert Airfield** (`AIRFIELD`) at `x: 480, z: -110`, steal a **Crop Duster** (`plane`), and fly low over the Dust Flats to drop flares for the Unmowed's covert team.
  - **Prep 2 — Bailout:** Parachute directly into **Fort Sandpit** (`BASE`, `x: 340..408, z: -34..34`) to avoid the main gate's Spade Guard turrets.
  - **The Heist:** Fight through the sandbox walls, raise **3-Hat Heat**, and lift **The Whirligig** (`whirligig`) off the pad (`padX: 358, padZ: -8`) while Commander Diggs chases you on a Zero-Turn.
  - **The Truce:** Mid-air, Diggs radios in—Vesper's HOA goons just locked Fort Sandpit's armory remotely and declared the Spade Guard "redundant." Diggs mutters: *"Nobody fires the Guard. Especially not a guy in a porcelain hat."*
- **Grounded Setpiece — *Airfield Scramble & Hot-Swap Bailout*:** When your Crop Duster takes flak over the Dust Flats, you bail out under your automatic parachute (`E`), land on Fort Sandpit's perimeter wall, and hijack the **Whirligig** off its pad while Diggs pursues (keeping every beat 100% playable on mobile touch and gamepad).

### Chapter 5: *The Even Cut* (Turfton Finale)
- **Focus:** Multi-angle finale combining driving, shooting, flying, and Fescue's oldest myth.
- **Key Beats:**
  - **Pre-Finale Setpiece — *The HOA Tribunal Ambush*:** Vesper drags Tansy's garage and **Councilwoman Juniper Vance** into an emergency kangaroo-court HOA Tribunal in the Turfton Amphitheater. Mid-closing-argument, Pip crashes a Combine Harvester *straight through the jury box*, turning a zoning hearing into a 3-Hat rolling shootout.
  - Vesper activates **The Grand Combine** (powered by the stolen **Golden Acorn**)—a skyscraper-sized, autonomous harvester rolling down `x = 0` toward downtown Turfton, escorted by HOA enforcers and bribed Hat Watch cruisers.
  - **Phase 1 (Air):** Pilot the **Crop Duster** / **Whirligig** to strafe the Grand Combine's escort and parachute onto its moving deck (`E` bailout).
  - **Phase 2 (Deck):** Fight across the Combine's roof while Vesper monologues over the PA system about "eliminating chaos, weeds, and crooked hats forever," culminating in a tense rooftop standoff with Vesper himself.
  - **Phase 3 (The Jam & The Choice):** Ram the **Fescue Stopping Stone** into the Combine's main intake—honoring Gnorwin Clayfoot's original move—and bail out as the machine locks up. **Player Choice:**
    - *Ending A — The Unmowed Monument:* Leave the Golden Acorn jammed inside the Combine and turn downtown's scar into wild clover with Elder Bracken and Councilwoman Vance.
    - *Ending B — Turfton Rewired:* Pull the Golden Acorn back out for Tansy and the Carburettors to power Turfton's grid—keeping the neon, the races, and the noise alive.
- **Epilogue:** *Side-Valve Salvage* reopens, Commander Diggs drinks at *The Gnomecino*, Mayor Mulch quietly repaints himself a new colour to pretend he was on your side the whole time, and your phone buzzes with a text from **Club Gnome** about a "small job at a bowling alley."

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

### Quest 1: *"Mower's Keepers"* (Chapter 1 — Early Game)
- **Trigger:** Talk to **Tansy** at *Side-Valve Salvage* (`x: -120, z: 60` area) after the Prologue.
- **Briefing (Cutscene/Dialogue):**  
  Tansy is welding a Push-Mower Bike with a kitchen blowtorch.  
  > **Tansy:** *"The HOA put a 'boot' on three of my client's bikes. Technically it's a giant clothespin, and technically it's illegal for me to touch it. Good thing you're not me."*
- **Beats:**
  1. **Go to Downtown Block (`x: 60, z: -60`):** Locate three clamped Push-Mower Bikes guarded by two HOA Enforcers (using `Pistol`s).
  2. **The Complication:** The moment you hop on the first bike (`E`), a Hat Watch cruiser spawns nearby—someone called in a noise complaint. **Heat jumps to 1 Hat.**
  3. **Objective:** Drive all three bikes (or tow/clear the lot and ride the target bike) back to *Side-Valve Salvage* while losing the Watch out of `SEEN_DISTANCE` (`30` units).
  4. **The Twist:** On the third bike's handlebars, you find an HOA eviction notice addressed to **Tansy's own garage**.
- **Gameplay Systems Used:** `vehicles.ts` (`push-bike`), `police.ts` (1-Hat Watch pursuit + cooling), `weapons.ts` (optional firefight), `hud.ts` (waypoint + objective banner).

### Quest 2: *"Dew Run on Route South"* (Chapter 2 — Mid Game Convoy Heist)
- **Trigger:** Meet **Granny Gnertrude** at her Cloverfield Farmhouse (`south` highway).
- **Briefing:**  
  > **Granny Gnertrude:** *"Vesper's boys are draining the Cloverfield Dew-Wells dry. Go park a Combine across the south highway, stop their convoy, and bring me the fuel. And try not to splatter my prize pumpkins—they're load-bearing."*
- **Beats:**
  1. **Acquire Heavy Iron:** Steal a **Combine Harvester** (`combine`) from a nearby Cloverfield barn.
  2. **The Blockade:** Drive onto the `south` highway bend (`[0, 260] -> [-40, 320]`) and block the lane before the HOA convoy timer expires.
  3. **The Ambush:** Two **Ride-On Mowers** and an armored **Zero-Turn** escort screech to a halt. HOA guards dismount and open fire. Use the Combine as cover and clear them with the `Shotgun` or `Rifle`.
  4. **The Getaway:** Ditch the wrecked Combine, hop into the lead Dew-Hauler Ride-On, and race back to Granny's barn while dodging a **2-Hat Watch** response.
- **Climax / Dialogue:** Granny inspects the Dew canister, sniffs it, and grins: *"Pure 87-octane. Now we can cook."*

### Quest 3: *"The Sandpit Drop"* (Chapter 4 — Late Game Military Heist)
- **Trigger:** Meet **Tansy** and **Pip** (arm freshly glued with Kiln-Resin) at the **Dust Flats** overlook (`x: 280, z: 40`).
- **Briefing:**  
  > **Pip:** *"Okay, hear me out. The gate at Fort Sandpit is guarded by five Spade Guard snipers. So we don't use the gate."*  
  > **Player:** *(stares blankly)*  
  > **Pip:** *"We steal a Crop Duster from the airfield, fly over the wall, and jump out without checking if the parachute actually works."*
- **Beats:**
  1. **Infiltrate Airfield (`AIRFIELD`, `x: 480, z: -110`):** Sneak or shoot past two Spade Guard patrols on the apron and board a **Crop Duster** (`plane`).
  2. **Takeoff:** Build airspeed above `stallSpeed` (`22`) down the 170-unit runway (`yaw: Math.PI / 2`) and pull up (`Space`).
  3. **The Drop:** Fly west toward **Fort Sandpit** (`BASE`, `x: 340..408, z: -34..34`). When the HUD target ring turns green above the base, hit `E` to bail out.
  4. **Freefall & Landing:** Automatic parachute deploys after ~1s. Steer your glide onto the Whirligig landing pad (`padX: 358, padZ: -8`).
  5. **The Lift:** Entering Fort Sandpit immediately triggers **2-Hat Heat**; boarding **The Whirligig** (`whirligig`) spikes it to **3-Hat Heat**. Climb straight up (`Space`, `ceiling: 100`) over the sandbox walls while Spade Guard shots ping off the blades, then fly back to the safehouse to clear heat.
- **Gameplay Systems Used:** `vehicles.ts` (`plane` takeoff/stall, `whirligig` vertical flight), `player.ts` (parachute bailout & glide), `police.ts` (Fort Sandpit guards + 3-Hat Heat).

### Quest 4: *"Founder's Boot & The Kangaroo Court"* (Chapter 1/2 Bridge — Parade Heist & HOA Tribunal Ambush)
- **Trigger:** Tansy gets served a same-day demolition summons for *Side-Valve Salvage* outside the **Turfton Amphitheater**.
- **Briefing (Cutscene/Dialogue):**  
  > **Tansy:** *"Vesper scheduled an emergency HOA zoning hearing during the Founder's Trim Day parade so nobody can protest. He's got Reginald Vance measuring my driveway with brass calipers."*  
  > **Pip:** *"Okay, hear me out. What if we steal the 30-foot Gnorwin Clayfoot Boot float, fill the toe with fireworks, and park it inside the jury box?"*
- **Beats:**
  1. **The Parade Snatch (`x: 0, z: -120`):** Infiltrate the *Founder's Trim Day* parade route on `ROAD_LINES`. Hijack **Gnorwin's Boot Parade Float** while marching-band gnomes scatter (`poseHandsUp`) and Red Caps / Blue Caps accidentally shoot each other across the avenue.
  2. **Heavy Drift:** Drive the massive, sluggish Boot Float through downtown while dodging **2-Hat Hat Watch** roadblocks and firing the float's confetti-and-acorn horn cannon.
  3. **The Tribunal Ambush:** Crash the Boot Float straight through the Turfton Amphitheater's cardboard archway mid-verdict. Vesper flees in an armored **Zero-Turn**, leaving **Reginald Vance** and six HOA Enforcers to fight you across the amphitheater benches.
  4. **The Escape:** Clear the enforcers with the **Leaf-Blower Cannon** (sending Vance's clipboard flying into the upper bleachers), grab Tansy's stamped deed off the podium, and bail out on Pip's getaway **Combine Harvester** before the **4-Hat HOA Van** arrives.
- **Gameplay Systems Used:** Heavy ramming vehicle physics, multi-faction crossfire (`police.ts` + Red/Blue Caps), arena shootout, 4-Hat HOA escalation.

### Quest 5: *"Kiln-Resin & Black Ice"* (Chapter 3 — Frostbite Fells Survival)
- **Trigger:** Automatic start after fleeing north up the `north` highway following the *Side-Valve Salvage* raid.
- **Briefing:**  
  > **Pip (cradling one clay arm):** *"I'm fine! It's just a hairline fracture! Wait—did I just hear my elbow rattle?"*  
  > **Father Loam (over radio):** *"Bring him to the Frozen Duck Pond, my children. The Carburettors have Kiln-Resin, but the HOA's salt-plows are already closing the ice."*
- **Beats:**
  1. **Low-Visibility Run:** Drive a battered **Push-Mower Bike** (or **Ride-On Lowrider**) through a blinding Frostbite Fells snow-squall while Pip shouts directions from the passenger rack.
  2. **The Salt-Plow Blockade:** Two HOA snowplows block the bridge to the Frozen Duck Pond. Use **Acorn Mortar** fire to knock their headlights out and slip past on the shoulder.
  3. **The Frozen Birdbath Derby:** Meet Father Loam and three Carburettor racers on the ice. While Loam mixes the **Kiln-Resin** to glue Pip's arm back on, survive a 90-second demolition derby against six HOA pursuit mowers on zero-traction black ice.
  4. **The Snail-Mail Reveal:** Just as Pip's arm sets, one of Shelldon's racing snails crawls out of a thermos with a micro-scroll from Tansy: *"Found the Stopping Stone. Meet me in the Dust Flats."*
- **Gameplay Systems Used:** Low-friction ice handling, timed survival/derby wave defense, escort protection, story radio triggers.

### Quest 6: *"The Even Cut"* (Chapter 5 — The Finale)
- **Trigger:** Meet **Tansy**, **Pip**, **Granny Gnertrude**, and **Commander Diggs** at the Dust Flats safehouse with the **Whirligig**, **Crop Duster**, and **Fescue Stopping Stone** secured.
- **Briefing:**  
  > **Tansy:** *"Vesper's Grand Combine just crossed `z = -300` on the center meridian. In four minutes it hits downtown, and it's set to zero-millimeter scalp."*  
  > **Commander Diggs:** *"Spade Guard's with you. Nobody levels my sandbox—or your city—without a permit."*  
  > **Pip:** *"Let's go jam a god-machine with a rock!"*
- **Beats:**
  1. **Phase 1 — Air Support (`x: 0`, moving south):** Pilot the **Whirligig** (or **Crop Duster**) down Turfton's main boulevard while Pip mans the door-mounted **Acorn Mortar**. Destroy four HOA **Code-Enforcement Vans** and two escort Zero-Turns clearing the Combine's path.
  2. **Phase 2 — The Deck Drop:** When the Grand Combine's outer shield grates open, hover over the moving roof (`speed: 18`) and hit `E` to parachute onto the upper deck while Diggs provides strafing cover.
  3. **Phase 3 — Deck Firefight:** Fight forward across three rolling tiers of the Combine against Vesper's elite **Porcelain Guard** (armed with `Rifle`s and `Garden-Hose Whip`s) while Vesper monologues over the 40-foot PA horns: *"Look at yourselves! Chipped! Muddy! Unregulated! Tomorrow, Turfton will be silent, smooth, and beige!"*
  4. **Phase 4 — Boss Showdown (*The Gilded Lawn-Throne*):** On the bridge, Vesper pilots a gold-plated, hydraulic **Lawn-Throne Mech-Mower**. Use **Sprinkler Mines** and heavy gunfire to short out his hydraulics, knock his obsidian top-hat off, and crack his porcelain monocle (sending him fleeing via an emergency escape-glider into a municipal hedge).
  5. **Phase 5 — The Jam:** Carry the **Fescue Stopping Stone** to the spinning main intake, trigger the cinematic slam, and sprint-parachute off the stern as the Grand Combine's blades lock up with a thunderous *CRUNCH* and the skyscraper-sized machine tips sideways into the southern drainage canal.
- **Epilogue Cutscene:** Dawn breaks over Turfton. *Side-Valve Salvage* is being rebuilt with Baroness Brenda's lawn chairs, Gnoma is handing out free Acorn-Flour Cakes from her truck, and the protagonist's phone buzzes with a text from **Club Gnome**: *"Heard you're good with heavy machinery. Need a guy for a bowling alley."*
- **Gameplay Systems Used:** `whirligig` / `plane` air-to-ground combat, moving-vehicle parachute landing, multi-phase boss fight, `stopping-stone` objective carry, full-city **3-Hat + 4-Hat** chaos.

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
- **Not built:** the 4-Hat "THE HOA" bulletin (the Watch tops out at three, R-028), and Post-Quest and Post-Chapter bulletins (the quests and chapters are not built yet).

---

## 11. Unhinged New Prefabs, Weapons, Vehicles & Achievements (PG-13 / No-Gore)

All new toys honor the Gnomiverse's **no-gore fired-clay & garden-scale comedy** rules—sending gnomes flying in goofy ragdoll arcs, drenching them in water, or popping their hats off without a single drop of blood.

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
| **The Even Cut** | Jam the Grand Combine with the Stopping Stone and finish Chapter 5. | *Golden Stopping-Stone Charm* (`neck`) |

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
   - Public free-roam turns story beats into shared **World Events** (Dew Convoy ambushes, Zero-Turn Drift Trials using `?drive=sim`, 4-Hat HOA Van raids).
6. **Sandbox Loops, Economy & Safehouses:**
   - **Acorns** currency (`hud.ts`), Glaze Clinic "Cracked" hospital fee, **Safehouse Garage** (save, store `MOWER_TINTS` rides), **Pay 'n' Glaze**, **Kiln-Shield Ragdoll Fraud** (`ragdoll.ts` side activity), and map **Collectibles** (25 Golden Acorns, 10 Stopping-Stone Shards, 15 HOA Foreclosure Signs to smash).
7. **New `@lawn/prefabs` & `@lawn/achievements`:**
   - Prefabs listed in §11; achievements in `packages/achievements/src/catalog.ts`.

---

## 13. New Content & Feature Ideas (In-Theme)

- **Turfton Radio ("99.3 THE BLADE"):** Built (§10). N turns the dial in any mower or plane; the floating text shows the station and subtitles. The Pay 'n' Glaze and Heist Board ideas below are not built.
- **Pay 'n' Glaze:** Drive a smoking, dented mower with 3-Hat Heat into Tansy's garage to repair it, swap its `MOWER_TINTS` colour, and instantly clear Hat Watch heat.
- **The Heist Board (Act IV):** A visual planning board in the safehouse (and a great future **Party Slice** candidate for `@lawn/party`—e.g. a 45-second *Sandpit Air-Drop* parachute-to-Whirligig race!).
- **Wanted Escalation (4th Hat — "THE HOA"):** Above 3 Hats, instead of more cops, an HOA **Code-Enforcement Van** arrives with megaphones reading municipal bylaws aloud, slowing nearby mowers until you smash it.
