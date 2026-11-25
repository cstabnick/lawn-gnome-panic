# Rulings

Answers to lore questions the entries didn't settle. Append-only: to overturn a ruling, add a new one that says which
it replaces. Entries cite a ruling as `sources: [docs/lore/rulings.md#r-003]`.

Format:

```markdown
## R-000

**Question:** the question as someone asked it.
**Ruling:** the answer, in one or two sentences.
**Applies to:** core | setting id | game folder.  **Date:** YYYY-MM-DD.
**Why:** the reason, so a later ruling can tell whether it still holds.
```

---

## R-001

**Question:** Gnomomia has deep lore. Does every gnome game have to follow it?
**Ruling:** No. Gnomomia's lore is the `fescue` setting. Every game follows the short core ([canon.md](canon.md)); deep
lore is per setting, and a game borrows from Fescue only by choice.
**Applies to:** core.  **Date:** 2026-11-18.
**Why:** the arcade games (racing, bowling, acorn-gun wars) contradict Fescue on purpose, and they are fun that way.

## R-002

**Question:** Fescue says the Mower is the only machine and gnomes never ride one. Lawn Prix, Gnome Front, Faster Than
Lawn and Gnaft have gnomes riding mowers. Which is true?
**Ruling:** Both, in their own settings. The core says only that mowers are the great machine of gnome life. Fescue
has one wild Mower and no engines; the Yard has many mowers and gnomes who ride them.
**Applies to:** core, fescue, the-yard.  **Date:** 2026-11-18.
**Why:** the mower is the one thing every gnome game shares; how tame it is is what makes each setting different.

## R-003

**Question:** Gnomomia's gnomes are clay; Paragnormal's gnome has a porcelain shell. Which?
**Ruling:** Gnomes are fired clay everywhere. Fescue's are earthenware with a glaze; the Tall House's are porcelain.
Both crack and shatter, neither bleeds.
**Applies to:** core.  **Date:** 2026-11-18.
**Why:** porcelain is fired clay, so the two never actually disagreed.

## R-004

**Question:** Lawn Prix's courses run past the Panic yard, the Front and Island Links. Are those games one world?
**Ruling:** Yes: the `the-yard` setting. The arcade games share one back yard, and a game set there may show the
others happening next door.
**Applies to:** the-yard.  **Date:** 2026-11-18.
**Why:** Lawn Prix already does it, and it lets every new arcade game borrow its neighbours' vehicles and landmarks.

## R-005

**Question:** Gnome Company has Omnipresent Gnome Jesus, evil Shadow Gnomes and a Deku Oak. Is that canon?
**Ruling:** It is apocrypha: true inside Gnome Company only. Nothing from it becomes core, and no other game has to
agree with it.
**Applies to:** gnome-company.  **Date:** 2026-11-18.
**Why:** it is a parody (of *Lethal Company*), and it borrows from real games; the core's house style rules both out.

## R-006

**Question:** When a lore entry and Gnomomia's design docs disagree, which wins?
**Ruling:** The design docs in `docs/design/gnomomia/`, then the game's code where it was built differently. Entries
in `entries/fescue/` are summaries that point at them; fix the entry.
**Applies to:** fescue.  **Date:** 2026-11-18.
**Why:** the design bible is long, versioned and what the game is built from; a second copy must not become a rival.

## R-007

**Question:** Gnaft (a gnome adrift on a floating lawn) was unplaced. Gnome Golf shows "the castaway from Gnaft"
drifting past its island. Is Gnaft part of the Yard?
**Ruling:** Yes. Gnaft moves to `the-yard`; its sea is the sea around Gnome Golf's island (entry `gnaft-sea`).
**Applies to:** the-yard, gnaft.  **Date:** 2026-11-18.
**Why:** Gnome Golf already put him there (`games/gnome-golf/src/ambient.ts`), and a sea makes the Yard bigger for
free: the sea mower, the lawn shark and the castaway now share one water.

## R-008

**Question:** Paragnormal shows giant Gnome-Souls with faces and beards. Does that break "nobody ever sees the Tall
Ones"?
**Ruling:** No. Gnome-Souls are not Tall Ones. What they are (a gnome's soul grown huge, something else) stays a
loose thread of the Tall House. The house belongs to the Tall Ones, and they are never home.
**Applies to:** the-tall-house.  **Date:** 2026-11-18.
**Why:** keeps the core rule whole while leaving the horror unexplained, which is what makes it work.

## R-009

**Question:** How many Gnome-Souls does a house hold, and what kinds are there? (Paragnormal had two, both fixed.)
**Ruling:** Two fixed Gnome-Souls (the Hollow Gardener, the Porcelain Watcher) plus one more from the house's seed: the Lamplighter, the Dripping Nanny or the Hush. Each has its own habit, sight and sound. All five are Gnome-Souls, and none is a Tall One (R-008 still holds).
**Applies to:** the-tall-house.  **Date:** 2026-11-18.
**Why:** more enemies, each one a different threat. A fourth Gnome-Soul per house made the scripted agent's escape rate fall to zero; three keeps the house hard without making it unwinnable.

## R-010

**Question:** Is the gnome's lantern reliable?
**Ruling:** No. It gutters out now and then while lit, and catches again after a moment. Each gutter wears the wick, and a worn wick gutters more and flickers. The chance comes from the house's seed, so a seed gutters at the same moments every time.
**Applies to:** the-tall-house.  **Date:** 2026-11-18.
**Why:** the lantern is the gnome's only defence against the Lamplighter's sight and its only comfort; making it unreliable turns a comfort into a choice, and keeps the horror in the dark.

## R-011

**Question:** Club Gnome (a hub where the arcade's games have their doors) puts Gnome Blackjack inside a casino, the
Gnomecino. Gnome Blackjack says it is a pub table. Which is it?
**Ruling:** Both. Club Gnome is the Yard's town square, and its buildings are the front doors of the Yard's games. The
Gnomecino is the town's casino; the Pub (`blackjack-pub`) is its card room, so every Gnomecino table is a pub table of
gnomes. The High Rollers table is the same room with a room code.
**Applies to:** the-yard, club-gnome, gnome-blackjack.  **Date:** 2026-11-19.
**Why:** the town opens the real games; the pub keeps its banter and bar, the casino gets its neon.

## R-012

**Question:** Is Biscuit (Incregnomtal's giant dog) the same dog as Gnome Company's Giant Goofy Fetch Dog?
**Ruling:** No. The Fetch Dog is apocrypha and never feeds back into canon (R-005). Biscuit is the Yard's own dog. Dogs are pets of the Tall Ones, so seeing one does not break the "nobody sees the Tall Ones" rule.
**Applies to:** the-yard, incregnomtal.  **Date:** 2026-11-18.
**Why:** keeps apocrypha separate while letting the Yard have a friendly giant dog that fits the garden-height scale.

---

## R-013

**Question:** Do the picnic tables in Links Park and the benches and stools in Club Gnome (places to sit and chill) have a place in the lore?
**Ruling:** Yes. Picnic tables are ordinary garden furniture of the Yard, with a bench each side, and gnomes eat at them. Picnics are held upwind of the Verge (already said in the Front's battlefield props), so the tables sit on the sunny side of the park. Benches and bar stools are ordinary town furniture.
**Applies to:** the-yard, club-gnome.  **Date:** 2026-11-18.
**Why:** the sources never mention picnic tables; this one keeps the new examine text consistent with the upwind-picnic joke that is already canon for the Front.

## R-014

**Question:** Do gnome emotes (the dances and gestures unlocked by achievements, `@lawn/emotes`) need in-world names or a story?
**Ruling:** No. Emotes are cosmetic, like achievement gear: plain descriptive names (Wave, Floss, Golf Clap), with a garden flavour where it costs nothing (Toadstool Jig, Pinwheel Spin). They are not events in any setting, and no NPC refers to them.
**Applies to:** all games.  **Date:** 2026-11-18.
**Why:** a gnome in any game can play any emote, so tying one to a setting's history would contradict the others.

---

## R-015

**Question:** Gnome Theft Auto's gnomes fight with water guns. Gnomes are fired clay: does water hurt them?
**Ruling:** No. In Turfton a soaking is only undignified: the clay goes dark, the hat drips, and a soaked gnome puts
its hands up and runs. A gnome soaked through is *Washed Out* and gets wrung dry at the Glaze Clinic, with nothing
cracked. Water guns are the only guns in Turfton; nobody shatters.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** keeps the core's no-gore rule in a parody of a violent genre, and gives the hands-up flee a reason.

---

## Open questions

Conflicts found in the sources and not decided yet. Whoever next works on that game decides, then turns the item into
a ruling and fixes the entries.

- **Fescue, Thatchford's inn.** places-and-people.md calls it the Puddleby inn in the Downs' sad note and The Tipsy
  Toadstool in the town's services. Same inn, or two?
- **Fescue, Potsworth's regency.** history.md: he "ruled as regent for 20 years and still runs most of the realm".
  The Birdbath Keep sheet: the Chancellor "has ruled through a child-queen for 30 years". Queen Marigold was crowned
  at 8 thirty years ago, so she is 38 now, not a child.
- **Fescue, Master Gromwell.** history.md says he was "never seen again"; the game puts him at the Great Valve as the
  Backflow boss. Probably the reveal, but the entries should say which.
- **Fescue, Grubthorn's rank.** places-and-people.md: elite. bestiary.md: boss.
- **The Yard, THE COMBINE and the Giant Armadillo.** Lawn Gnome Panic's desert world swaps THE COMBINE for THE GIANT
  ARMADILLO, and the code calls it "the same animal, scaled up". Is THE COMBINE an animal in the Yard?

---

## R-016

**Question:** Gnome Theft Auto now has real guns (Pistol, SMG, Shotgun, Rifle) instead of water guns. Does that break R-015?
**Ruling:** No. The guns are a parody of the genre and the rest of R-015 stands: a gnome that is shot puts its hands up and
runs, an officer gives up, nobody shatters, nothing bleeds, and a player who loses all their dryness is still Washed Out
and wrung dry at the Glaze Clinic. R-015's line "water guns are the only guns in Turfton" is replaced by: the guns are
props of the apocrypha parody and appear nowhere in the canon settings. The world around Turfton is the Dust Flats
(desert, Fort Sandpit and the airfield with the Crop Duster plane), Mossy Wood, the Frostbite Fells and Cloverfield Farms.
Gnomes bail out with parachutes; a hard landing without one only soaks the gnome.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** the user asked for real guns; keeping the reactions of R-015 keeps the no-gore rule intact.

---

## R-017

**Question:** Cooking Gnoma needs a helper who talks the cook through each step, like Mama in Cooking Mama. Who is she?
**Ruling:** Gnoma, the Yard's cooking mama. She is a gnome in a red mushroom hat and a green coat, with an apron: a
helper, never the player's gnome. The player's own gnome from the Gnome Creator is not drawn in the kitchen. Gnoma is
warm and a little bossy, never cruel, and she praises every try ("Oops, a little wobbly. We learn from it!"). Her name is
a Yard nickname, not a plant name; the Yard allows sillier nicknames (R-011, the-yard's rules). Her lines live in
`games/cooking-gnoma/src/dialogue.ts`.
**Applies to:** the-yard, cooking-gnoma.  **Date:** 2026-11-19.
**Why:** a cooking game needs a voice to guide the cook; keeping her a helper keeps the player's gnome one gnome.

---

## R-018

**Question:** Where does GBA GJAM take place, and how does professional gnome basketball fit into the Yard?
**Ruling:** GBA GJAM is played inside the indoor **Gnomerena**, a converted garden shed-turned-arena in `the-yard` with hardwood floorboards, rafters, banners, a hanging Jumbotron, and packed bleacher crowds. Eight pro GBA teams (Mossbottom Mowers, Redcap Rockets, Thatchford Thunder, Acorn Alley Alphas, Dewdrop Dynamos, Pebblebrook Pistons, Bramble Bush Ballers, Sunpatch Suns) compete 2-on-2 in a regular season and Top-6 knockout tournament for the Golden Acorn Trophy. Shoving is legal and sends clay gnomes skidding without shattering; catching fire after three straight baskets is treated as normal league play.
**Applies to:** the-yard, gba-gjam.  **Date:** 2026-11-19.
**Why:** the Yard is the shared silly, sporty setting for arcade gnome sports alongside bowling, golf, and racing.

---

## R-019

**Question:** Gnomokemon Snap needs a home base for its menus, like Professor Oak's lab in Pokemon Snap. Whose is it, and what is in it?
**Ruling:** The Fescue Field Lab, run by Gnome Jesus (the existing grader). It is a closed two-storey house with a red roof,
a chimney, a garden and a front door, at the edge of the Fescue lawn. Downstairs: the Safari Map Room (the seven courses are
pins on a table), the Lobby behind the front door (the Giant Fetch Dog sleeps on the rug; a staircase climbs the back wall)
and the Gnomokedex Archive (shelves and glass cases of specimens). Upstairs: the Dressing Room (a standing mirror, a
wardrobe and a hat stand), the Grading Office over the lobby (Gnome Jesus's desk and a trophy shelf) and the Darkroom (the
player's best prints hang on a clothesline). It is a place, not a character: no new named people beyond the rooms.
The player's viewpoint is a gnome (their own, from the Gnome Creator) standing on the shoulders of an unnamed carrier gnome
and holding a camera. The carrier is a plain Fescue gnome who asks for nothing. Gnome Jesus speaks in the same deep
muttering voice as the Blackjack gnomes, and is witty, warm and a little vain; his lines live in
`games/gnomeokemon/src/snap/jesus.ts`.
**Applies to:** fescue, gnomeokemon.  **Date:** 2026-11-19.
**Why:** menus read better as rooms a person walks through than as a web page; a camera that is itself a gnome fits the
Yard's scale; reusing Gnome Jesus keeps the cast small.

---

---

## R-020

**Question:** Where does the Fescue Field Lab stand, and how does Gnome Jesus afford it?
**Ruling:** On a big, well-kept lot of prime lawn at the edge of Fescue, where the garden meets the Yard's town: a street with
parked cars along the front, neighbours shoulder to shoulder either side and towers on the horizon. The town is built to gnome
scale and unnamed. Gnome Jesus is not broke: he owns the lot outright, has gold trim on the lab, and drives a gold car with a
halo over the roof. He is relaxed about it and makes jokes about it in his grading lines. This scenery is Field-Lab-only: it
does not change Fescue's own rulebook, and Fescue proper is still the walled back garden.
**Applies to:** fescue, gnomeokemon.  **Date:** 2026-11-19.
**Why:** the user wanted the lab to sit in an urban setting on expensive land; making Gnome Jesus wealthy explains it.

---

## R-021

**Question:** Gnome Theft Auto's gnomes now crack apart when shot, and there is no soaking or wetness any more. Does that
break the no-gore rule, R-015 or R-016?
**Ruling:** No. Gnomes are fired clay that cracks and shatters and never bleeds (R-003), so a shot gnome bursts into clay
shards and is gone; another townsgnome wanders in. A guard is glued back together at its post, and a player who loses all
their clay is *Cracked* and glued back together at the Glaze Clinic. This replaces R-015's soaking and "Washed Out"
(wetness, dripping, hands up when hit) and R-016's "a hard landing only soaks the gnome" (it now chips the gnome). Gnomes
still put their hands up and run from a speeding mower. Nothing bleeds and there is no gore.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** the user asked for cracking instead of soaking; R-003 already says clay cracks, so it fits the core canon.

## R-022

**Question:** Who collects the clay when a gnome cracks in Gnome Theft Auto?
**Ruling:** The Glaze Clinic's ambulances. A cracked gnome leaves a heap of shards; an ambulance (a small white van with a
red cross and a siren) drives out, loads every piece, and takes it back to the Clinic to be glued. Nobody is harmed by the
ambulance, and it never blocks the road.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** gives R-021's cracking an aftermath, in keeping with the Clinic from R-015.

## R-023

**Question:** Do cracked gnomes get cleared away in Gnome Theft Auto, and where does a cracked player wake up?
**Ruling:** Cracked gnomes are left where they fell, in pieces, for the rest of the session (nobody tidies Turfton in a
hurry). This replaces R-022's "an ambulance collects every cracked gnome": the Glaze Clinic's ambulance now only comes for
a cracked player. A cracked player wakes up on the pavement outside the Glaze Clinic Hospital (the block east of the park,
a white building with a red cross), glued back together.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** the user asked for lasting, visibly cracked bodies and a hospital respawn; clay does not bleed, so it stays no-gore.

## R-024

**Question:** In Gnome Theft Auto, shot-up mowers explode, burn and turn black. Is that allowed in a gnome game?
**Ruling:** Yes, as parody props: a mower that takes enough bullets bursts into a fireball and sits charred and burning for
the rest of the session, and a gnome driving it cracks apart like any shot gnome (R-019). Nothing bleeds. It applies only
to Gnome Theft Auto's apocrypha and to no canon setting.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** the user asked for exploding, burning vehicles; clay and mower parts char, they do not bleed, so the no-gore rule holds.

## R-025

**Question:** Gnome Theft Auto has a mob boss and contracts to crack named gnomes. Who is he and what are the rules?
**Ruling:** Don Compost runs the Mulch Club, a members-only club in Turfton, from an armchair in its back room, in a cream
suit and black hat, with two bodyguards. He never speaks: he lays out wanted posters, points, and the contract is done. His
contracts are to crack a few choice gnomes, who wear gold hats so they can be told apart. Contracts are apocrypha and
follow R-019 (clay cracks, nothing bleeds). The first contract is a demo: more are planned.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-20.
**Why:** the user asked for a silent mob-boss cutscene and a first hunt quest; a silent boss keeps the cutscene readable
without dialogue and fits the no-gore, clay-cracking parody.

## R-026

**Question:** Why are the NPC gnomes driving mowers around Turfton? Are they just wandering?
**Ruling:** Each driver is on an errand: the Glaze Clinic Hospital, the Mulch Club, the park, downtown for work, the shops,
home, or a long highway trip (Fort Sandpit, the airfield, Cloverfield Farms, Mossy Wood, Frostbite Fells). They park near the
place for a few seconds, then set off for the next one. Push-bikes only go to places in town. A gnome whose mower is borrowed
may say where they were headed.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-20.
**Why:** the user asked for traffic with "real reasons" to be on the road; errands to places the player can also visit tie the
drivers to the map.

---

## R-027

**Question:** Turfton FM's proposal reuses names. "Two-Stroke" Tony hosts The Blade (story.md) and DJ Lawn-Dart hosts its morning show (society.md); Pip Potsworth is also "Two-Stroke"; FPR's host is Barnaby and so is the Mayor. Which names stand?
**Ruling:** One name per person. Pip keeps "Two-Stroke". The Blade's daytime host is Dock "Full-Throttle" Hoewright (replacing "Two-Stroke" Tony). Lawn-Dart is a pseudonym that has been passed between people, and holds the Blade's morning show from a birdbath; nobody is sure who holds it now. Fescue Public Radio's host is Sorrel Tillbrook (replacing Barnaby Soft-Spoken, so the Mayor keeps Barnaby). Compliance Beats' host is Cress Caliper (replacing Cynthia Caliper). The callers Rooster Weatherby and Shelldon "No-Trail" Mucilage keep their names from story.md.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-20.
**Why:** the radio needed a voice for each station, and the two proposals disagreed. Making the morning show a pseudonym keeps both of the proposals' ideas, and gives the station a loose thread.

## R-028

**Question:** Turfton FM's proposal has a 4-Hat "THE HOA" bulletin, bulletins for story chapters that are not built yet, and commercials that talk about being wet. Which of these can ship?
**Ruling:** The Hat Watch tops out at three (`MAX_HEAT`), so there is no 4-Hat bulletin: the HOA's Code-Enforcement Van is not in the game and the bulletin is cut. Bulletins react only to things the game does now: heat levels 1 to 3, and the achievements for borrowing a mower, the Whirligig, the first contract, a crop-duster take-off, a skydive, a townsgnome run over, a snow drift, a cracked gnome, and an explosion. Commercials for the Glaze Clinic and the Gnomecino are written for cracking and gluing, not drying and washing (R-021 stands). Radio plays in every vehicle the gnome drives or flies. The dial is kept per browser and is not synced online. M mutes the radio with the sound effects, and N turns the dial.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-20.
**Why:** the bulletins must be true to the game's own rules, and the proposal's cut-scenes (the Van, the Chapter 4 bulletins) do not exist yet. Adding them later is a new entry in `EVENT_BULLETINS` or `HEAT_BULLETINS`.

## R-029

**Question:** Who is on the radio when a gnome is cracked or bails out, and does the news about it still go out?
**Ruling:** The radio goes quiet when the gnome gets out, bails out of a plane, or is cracked, and comes back on the same station when they get into the next vehicle. News about something the player did (an event bulletin) that happens with nobody driving waits for the next drive: up to two stories, oldest first, and they go out before the programme resumes. Hat Watch news (heat levels) is not kept: a bulletin about the Watch's hunt for a driver is only news while someone is driving. News that arrives while a bulletin is on air waits its turn (up to three), so a heat rise never cuts off a story about what the player just did. Each event's news repeats at most every 2 minutes. The text can be turned off in Options (Radio text); the music keeps playing.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-20.
**Why:** a gnome who is cracked on foot should still hear that the Glaze Clinic took them in, on the next drive. Keeping heat news for drivers only stops the Watch talking about a chase nobody is in.

---

## R-030

**Question:** Gnomokemon Snap sits in `fescue`, but its Gnome Jesus and its dog look like Gnome Company's Omnipresent Gnome
Jesus and Giant Fetch Dog, which are apocrypha (R-005, R-012). R-019 even says "the Giant Fetch Dog sleeps on the rug".
Which are they?
**Ruling:** Snap's own game-tier characters. The grader is **Hyssop**, called **Gnome Jesus** for his robe, beard and halo: a
warm, vain archivist who grades photos and is Gnomokedex #036 (rank Boss, a Mythic in the dex). He is not a god and takes no
tithes; religious-sounding lines are vanity, not doctrine. The dog is **Tag**, a dog from the town side, under R-012 as it
stands (a Tall One's pet in the Yard; Tall Ones are simply never home), not a dog of Fescue, so Fescue's Leaving is
untouched. Both share a model and a nickname with Gnome Company's apocrypha and nothing else. This amends R-019's dog name
only. Departures, game tier only: the words Gnomokemon and Gnomokedex and the nickname Gnome Jesus are parody names; and
the Lab has worked out exactly one Tall One object, the Eye-Box, by trial (every other yard object is still renamed).
**Applies to:** fescue, the-yard, gnomeokemon.  **Date:** 2026-11-20.
**Why:** the user wants Snap grounded in Fescue, and Fescue's rulebook outranks a parody. A separate name for the dog lets
Biscuit, the Fetch Dog and Tag all live without anyone being the same dog.

## R-031

**Question:** Snap's seven courses (Fescue Lawn, Desert Yard, Drainpipe Deeps, Cistern Reef, Kiln & Shed, Starlight
Greenhouse, Frosty Birdbath) were never checked against the lore. Which stay, which move?
**Ruling:** Snap is a bridge game: the Lab stands where Fescue meets the Yard's town (R-020), each region follows one setting, and
the ride is a cut (nothing in Snap shows how Tag gets from the town side into the walled garden; Fescue's loose thread about
the Fence stays open). **Desert Yard** is the Yard's *Dry Yard* (entry `dry-yard`); no Fescue-home species appears there.
**Drainpipe Deeps** is the Gutters wing and **Cistern Reef** is the Cistern wing of the Drainpipe Deeps; Snap never enters the
Backflow wing. **Kiln & Shed** is **the Stopping Road**, the way Gnorwin carried the Stopping Stone from the Kiln through the
Rockery pass to the Verge; the Kiln stays cold in Snap. **Starlight Greenhouse** is **the Glasshouse** on the back lot of the
Fescue Field Lab (R-020). **Frosty Birdbath** is **the Rime**, the Basin's one frozen week and Fescue's only named season.
**Applies to:** fescue, the-yard, gnomeokemon.  **Date:** 2026-11-20.
**Why:** a desert inside Fescue would answer the Fence; the Yard already has a Dry Yard with the same armadillos and lizards.
Fescue's bestiary already has the Gutters and the Cistern. The Glasshouse is the grader's own back garden, so he waits there,
and it adds no building to Gnomomia's design docs (R-006).

## R-032

**Question:** Snap has a Sea Mower and a Minimower. Fescue's rule 8 says the Mower is the only machine that runs by itself, and
rule 6 says only the Mower has a want nobody can name. Does Snap break either?
**Ruling:** No. They are **Mower-kin**: Grown creatures that took the Mower's shape, with no engine, fuel, Heartspark or blade;
the Minimower began as one of the Even Cut's iron effigies that got up and walked off. Only the Mower has no nameable want
(rule 6); its kin want to be near it (the Minimower: to stand by the Shed door and hum along). The Yard's `sea-mower` is a
different thing in a different setting. The Clockwork Frog is a Tall One's wind-up toy and runs only while wound, so it is no
machine that runs by itself. Shipped examine and dex lines that said otherwise were reworded with this ruling.
**Applies to:** fescue, the-yard, gnomeokemon.  **Date:** 2026-11-20.
**Why:** keeps rule 8's one engine and rule 6's one wantless thing, and lets the Iron element read as "the Mower's hum".

## R-033

**Question:** Snigms gets a town. Is it a new town in the Yard, or is it the Yard's town square that Club Gnome already has
(R-011)?
**Ruling:** It is the Town Square: the back row behind the fountain, next to the cottage lots. Club Gnome's Town Square is the
front of it, and the Spore & Sprout, the post office and the park are its back row. Snigms's neighbours live there.
**Applies to:** the-yard, snigms, club-gnome.  **Date:** 2026-11-21.
**Why:** one square for the Yard keeps the Spore & Sprout (already named in Snigms's jobs) and the fountain ("meet you at the
fountain") in one place, and lets a gnome from either game recognise the other's town.

## R-034

**Question:** R-028 cut the 4-Hat "THE HOA" bulletin and the story-chapter bulletins because the HOA Code-Enforcement Van and the story campaign were not in Gnome Theft Auto yet. Now that 4-Hat heat, the 5-chapter story campaign, and the 11 Strangers & Freaks side quests are in the game, what changes on Turfton FM?
**Ruling:** Amends R-028. The Hat Watch now climbs to four (`MAX_HEAT = 4`, "THE HOA"), dispatching HOA Code-Enforcement Vans with Reginald Vance's megaphone citations, and `HEAT_BULLETINS` gains level 4 breaking-news bulletins to match. `EVENT_BULLETINS` now covers all seven story achievements (`gta-fresh-kiln`, `gta-boot-legger`, `gta-turf-violator`, `gta-mid-air-jack`, `gta-snail-saboteur`, `gta-dry-bone`, `gta-even-cut`), the 5-chapter story campaign (`prologue-fresh-kiln` through `ch5-even-cut`), and all 11 Strangers & Freaks side-quest dispatches (`sq-grid-truthers` through `sq-big-lou-embargo`), while station banter adds Turfton celebrity gossip and Local 404 union news. Everything else in R-028 and R-021 stands: fired clay cracks and is glued back, nothing bleeds, and nothing on air gets wet, soaked, or dripping.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-21.
**Why:** R-028 deferred the 4-Hat and story bulletins until those systems existed; now that 4-Hat HOA vans, the 5-chapter campaign, and Strangers & Freaks are live, Turfton FM reports them within R-021's bounds.

## R-035

**Question:** Turfton FM gets a fourth station, 108.0 Subsoil Radio, hosted by a mole called DJ Moleman. Fescue's mole clans (R-032's neighbours: Grubthorn, Dowager Mudtooth) are fleeing south and hold a grudge against gnomes. Is Moleman one of them, and does he break R-021?
**Ruling:** No to both. Moleman is a Turfton mole and an apocrypha character, so Fescue's mole-clan lore does not bind him: he has no grudge, and he never appears in Fescue. Subsoil is a *bonus* station: "Drive-Time Regular" (a song on every Turfton FM station) still asks for the three main ones. R-021 stands for Subsoil's lines too: nothing gets wet, soaked or dripping (the Dew-Wells "hum", they do not run).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-21.
**Why:** apocrypha is free to ignore the settings, and a bonus station keeps an existing achievement's wording ("all three") true.

## R-036

**Question:** Gnom Set Radio ties Aether Board's ley-line plane to Turfton's pirate radio signals (Turfton FM, 108.0 Subsoil Radio, Black Dew boosters) and introduces living inanimate objects (upright pianos, upright basses, bongos, metronomes, hydrants). Does that break the core canon or `the-aether`?
**Ruling:** No. Gnom Set Radio sits in `the-aether` (the Broadcast Archipelago, high above Aether Board's islands). Inanimate objects animated by ley-line and broadcast resonance are **Woken Objects**: they have clay-glaze eyes and musical voices, never bleed, and crack or detune harmlessly when tagged. How Turfton's apocrypha broadcasts reach the Aether stays a loose thread, and no Tall Ones ever appear.
**Applies to:** the-aether, gnome-set-radio.  **Date:** 2026-11-22.
**Why:** keeps `the-aether` non-garden and whimsical while letting Turfton's pirate-radio flavour inspire musical gangs and living instruments without making Turfton's parodies canon in other settings.

## R-037

**Question:** Gnom Set Radio adds a 9-rung Frequency Ladder explaining why districts unlock in order (leading to Subsoil Relay Tower at Area 8 and the secret 09th Zero-Hz Zenith), Regional Helper Gnomes, and freeform Aether graffiti tags. Does any of this break `the-aether` or core gnome canon?
**Ruling:** No. The Frequency Ladder, Regional Helper Gnomes (Pippi Pitchpipe, Bam-Bam Bramble, Sooty Slagcap, Drizzle Dewdrop), and freeform Aether aerosol decals all sit cleanly within `the-aether` game tier. Aether paint evaporates harmlessly into glitter, Helper Gnomes are local skate-techs rather than Tall Ones, and Zero-Hz Zenith's Unfired Choir and Original Needle follow R-036 (no gore, no Tall Ones).
**Applies to:** the-aether, gnome-set-radio.  **Date:** 2026-11-22.
**Why:** gives the Broadcast Archipelago a cohesive progression story from Area 1 through Area 8 and the secret 09th finale while keeping core canon intact.

---

## R-038

**Question:** Can the Broadcast Archipelago host fired-clay tourists, roadside diners, espresso cafes, union glaze foundries, and additional Woken objects like a living saxophone (`gsr-saxophone-woken`) and molten-glaze trolley (`gsr-glaze-trolley`)?
**Ruling:** Yes. Each district in `the-aether`'s Broadcast Archipelago is a living town or workplace built around its radio frequency (tourism, diners, craft kilns, rooftop resorts), visited by fired-clay gnomes riding Aether gondolas. New Woken objects follow R-036 (clay-glaze eyes, musical/ambient voices, no gore, no Tall Ones).
**Applies to:** the-aether, gnome-set-radio.  **Date:** 2026-11-22.
**Why:** gives each region distinct architecture, street life, and writing beats so districts feel lived-in rather than recoloured arenas.

## R-039

**Question:** DayG (planned, `games/dayg`, design in `docs/design/dayg/`) has zombie gnomes in a Tall One cemetery. The core house style says no necromancy (draft, outside Fescue) and no gore. Can cracked gnomes walk again, and where does the game sit?
**Ruling:** DayG is `apocrypha` (its title is a parody). Its zombies are **the Hatless**: cracked gnomes that a grey moss has grown into and walks around, looking for warm, wet clay to grow in. It is a garden growth, not a spell, so the no-necromancy draft holds. They lose their hats first (core fact 6), crack and shatter, never bleed. The cemetery is **Mossgrave**; its Tall One graves, the Visitation flowers and whoever brings them are never seen (core fact 3). Where the outside Verge traders come from stays a loose thread.
**Applies to:** apocrypha, dayg (planned).  **Date:** 2026-11-22.
**Why:** a parody belongs in apocrypha, and moss keeps the undead inside the core's garden rules without bending the core for other settings.

---

## R-040

**Question:** Nothing Left to Collect talks to the player (a narrator, fake achievements, "you are free to play the game"), sets an office building at Club Gnome, and ends with a gnome flying to a beach planet. Does that break the core house style, the Yard, or the core facts?
**Ruling:** It is `apocrypha`. Its fourth-wall jokes are the parody the house style allows there. The Annex is said to stand at the edge of Club Gnome's square, but Club Gnome (the Yard) does not show it and need not agree. Shellshore, the beach planet, is true only in this game. Whether the four floors were an interview or a dream in the reception chair stays a loose thread, and so does whether the Interviewer exists. No Tall Ones appear; nothing bleeds.
**Applies to:** apocrypha, nothing-left-to-collect.  **Date:** 2026-11-22.
**Why:** a satire of collecting games needs to address the player; apocrypha keeps that out of every other setting.

## R-041

**Question:** Can enemies fight a gnome inside a Fescue town, and if not, why not?
**Ruling:** No. Inside a town's bounds (its region circle, `TOWN_DEFS` in `src/towns.ts`) holds the Bound-Peace: no enemy starts a fight with, chases or strikes a gnome, an enemy whose quarry steps inside gives up and goes home, idle beasts don't wander in, and no ambient enemy spawns within the bounds (spawn circles kept 2 m clear). The only exceptions are called fights, which a quest starts in a town on purpose and which are listed in `src/townPeace.test.ts`. In-world, gnomes beat the bounds of every town once a year with brooms, kiln-ash and salt and sweep them on market days; pests are hungry or scared, not evil, and keep off ground that smells of kiln smoke, salt and many gnomes. A called fight is one the town allows: something already inside, or a trial called by a Reeve or sergeant. Mossbottom (a village) and the Last Tuft (a war camp) were never chartered but sweep their edges anyway, out of habit and by the muster. Why the swept line works stays a loose thread. Entry: `the-bounds`.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-22.
**Why:** towns are where players shop, talk and wait for friends, so they must be safe, and canon says every pest wants something, so the peace has to be the pests' choice rather than a wall.

## R-042

**Question:** What may block a lane in a Fescue town?
**Ruling:** Town lanes are kept a cart's width clear, extending the Thatchford ford charter ("No gnome shall build within a cart's width of it") to every town. A lane is closed only by a building, fence, wall or water meant to stand there, and each closure is recorded with its reason (`TOWN_BLOCKS` / `TOWN_ROAD_BLOCKS` in `src/townBlocks.ts`). Clutter that blocks a lane by accident is a bug and gets moved.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-22.
**Why:** walking a town should be easy for players and for the town-walk tests, and the rule already exists in the world's own charter.

## R-043

**Question:** Who are the AI gnome players in Gnomes of Gnomomia, in-world?
**Ruling:** They are Wayfarers: other gnomes on the road doing odd jobs for the same Reeves (personalities tryhard, lorehound, lootgoblin, wanderer, helper; `src/companions.ts`). When the player is in a town, some of them stroll its lanes between doors and stalls; every gnome in that town sees them (relayed online with their player's pose). They keep the Bound-Peace (R-041). Where they come from stays a loose thread. Entry: `wayfarers`.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-22.
**Why:** a named, ordinary reason for the strangers on the road keeps towns lived-in without inventing a new power or guild.

## R-044

**Question:** Gnomes of Gnomomia now holds back every class's fifth talent row until Chapter 3's finale ("What the Ledger
Says", `c3-ledger`) and the tier-6 capstones until Chapter 5's finale ("The Heartwood", `c5-heartwood`). Who teaches
those rows in Fescue, and why do they wait on those two quests?
**Ruling:** Every row is taught by the player's trainers: the Thatchford three (Sergeant Briar Stoutpot, Hazel Twitchett,
Magister Sorrel Dimm) and the advanced trainers (Juniper Quickstring at Barkhollow, Delver Sergeant Flint at Flintdelve,
the Keep's three). The **fifth row** is the Crown's old drill: Charter-era drill rolls and notes kept in the Royal Archive
(Rust Lore quotes Gromwell's notes from there). The Archive keeps them sealed while the Crown does not know what Gnorwin's
Ledger asks of it; once the player reads the Ledger aloud to Queen Marigold, she opens the rolls to every trainer in Fescue,
because the plan needs gnomes who can fight. The **capstones** are known to every trainer, but by an old trainers' custom
("a root before a crown") none gives one to a gnome who has not stood at the Heartwood, the oldest living thing in Fescue.
Either ending of "The Heartwood" counts: given a branch by Mother Burdock, or there when Splitwell's axes fell the Privet.
Where the custom comes from, and whether the Planting songs mean the Privet or something older, is a loose thread.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-22.
**Why:** the gates are an economy-pacing choice; tying them to the Archive and the Heartwood gives each a reason from two
time layers (Charters records, Planting custom) and keeps the trainers, not the quest givers, as the ones who teach.
Gate text: `LEDGER_GATE` and `HEARTWOOD_GATE` in `games/gnomes-of-gnomomia/src/data/classes.ts`.

## R-045

**Question:** Some shopkeepers in Gnomes of Gnomomia show a few of their best wares (one or two per chapter) but won't sell
them until a main quest of that chapter is done. Why would a gnome trader refuse coin?
**Ruling:** Because the ware is not theirs to sell yet. Each held-back ware waits on something the quest fixes in the world,
and its tooltip says what, in the trader's own terms: the stuff it is made of is out of reach (felt pressed at the Spinning
Fountains, thistledown in a granary full of mice, Webhollow silk, sole-felt that comes up the moles' deep way, Kiln clay
where the Unfired stand), or it is an honour that someone must vouch for (the Keep's colours from Armourer Ferrule, Sodbury's
fair ribbon, the Barkhollow guild token, the muster medal, the muster hood). Traders still show the ware, so the player knows
what the quest is worth; a trader never says "come back at level N". New gated wares follow the same rule: name the trader
or the place, name the quest, keep it to one line.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-22.
**Why:** gold alone shouldn't buy the best of a chapter (economy pacing), and Fescue's traders are tied to their towns'
troubles (lore-rules rule 3: every place has a reason in living memory), so a quest that mends a trouble frees its ware.

## R-046

**Question:** Last Tuft's smith Hobnail Ferrule shares a surname with Armourer Ferrule of Birdbath Keep. Same gnome? Kin?
**Ruling:** Two gnomes. Hobnail is the Keep armourer's younger brother, who went north to the Verge with the camp. He
strikes the muster medal and sews the muster hood at Last Tuft, on Knight-Commander Ironsod's word.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-22.
**Why:** both names already ship (`c3-ferrule`, `c7-smith`), and gated ware text names Hobnail, so the two must not read
as one gnome in two places.

## R-047

**Question:** The grown Gnome Theft Auto map pushed the perimeter Fence out on every side. On the old west fence line, where Knot-Hole Nora's thimble seat and the Fence-Line Overlook are, only five panels of the old fence still stand, with the glowing knot-hole in the middle one, and through the knot-hole you now see Mossy Wood rather than the Neighbour's Lawn. Why?
**Ruling:** When the Tall Ones put up the new, taller Fence further out, the gnomes took the old one down board by board for timber. Nora would not let them touch the knot-hole panel, so it and its two neighbours on each side are the five that still stand. With the old boards gone, the view through the knot-hole now crosses the gap to Mossy Wood. Nora insists the Neighbour's Lawn is still on the other side if you look properly; that is her claim, and the game never settles it.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** explains the changed view with the grown map (the boards were taken, not moved), keeps the knot-hole as the one panel that survived, and leaves Nora's insistence as a loose thread.

## R-048

**Question:** The grown Gnome Theft Auto map has water in seven places: a source, an upper river, a loch, a ravine, a canal, a farm river and a sea. Each stretch has a gnome reading (what is on screen) and could also be a garden feature at giant scale. Which reading does the lore use, and which way does the water go?
**Ruling:** Every stretch has two readings. The gnome reading is what the player sees (a river, a loch, a sea), and it is the only one a gnome ever gives. The Tall-One reading (the birdbath, the pond, the storm gutter, the lawn's low corner) is a hint for the writer and is never said in game. The water always runs downhill from the house (north) to the Puddle Sea (south), so the Everspring rises in the north and the Puddle Sea is the southern end of the map.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** the water needs one direction for a gnome to follow it to the sea, and keeping the garden readings as hints lets a careful player see the garden without a gnome saying so (canon fact 1, leave threads loose).

## R-049

**Question:** Gnome Theft Auto's outer regions get wildlife: cows, sheep, pigs and hens in Cloverfield Farms, the Drey Gang squirrels, polar bears and frost-glazed "sgnowmes" in Frostbite Fells, bees and giant grass in Tallgrass Commons. How big are the animals, can they be hurt, and are sgnowmes made of snow?
**Ruling:** Animals in Turfton are sized for gnomes to live beside, not to the Tall Ones' scale: a cow stands about one and a half gnomes tall, a hen half a gnome, a squirrel about a gnome when it sits up, a bee as big as a gnome's head. Gnomes never ask why. Animals never die or bleed (R-021): a shot, a ram or a blast knocks one over in a puff of fur, wool or feathers, and it gets up and runs off. Polar bears do not even fall over; they shrug. Every creature wants something (canon house style): the herds want to graze, the Drey Gang want Acorns for their winter stores (a stolen mower is their acorn cart), the bees defend their hive. Sgnowmes are ordinary fired-clay gnomes glazed frost-white; they are not snow and never melt. Snowmen are snow, so they break, and the sgnowmes build them again overnight.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** animals at real garden scale would be either invisible (bees) or mountains (cows), so the game sizes them for play; the no-death rule keeps R-021's tone; and frost glaze keeps sgnowmes as clay, so nothing about them melts in the Dust Flats.

## R-050

**Question:** Gnome Theft Auto's water gets boats, locks, weirs and a waterworks. Fired clay is not supposed to get wet (R-021), so what happens to a clay gnome or a mower in deep water?
**Ruling:** Fired-clay gnomes are hollow, so in deep water a gnome bobs upright like a fishing float and paddles slowly; it cannot aim or fire while bobbing (both hands are on the paddle), and it climbs out where the bed rises. Shallow water (the canal floor, river edges, fords) is waded. A mower that drives into deep water conks out and sinks; the gnome bobs up beside it; a day later the mower turns up again where it was parked, "fished out" by somebody nobody ever sees (who is a loose thread). Water never soaks anything: it only floats, sinks or slows.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** a hollow float explains how clay floats without ever getting wet, and the mower's sinking and return keep the lore's no-gore, nothing-wet tone.

## R-051

**Question:** Gnome Theft Auto adds Tessie, a giant turtle in Loch Moss. R-049 sizes animals for gnomes to live beside: is she an animal, how big is she, can she be hurt, and what is she really?
**Ruling:** She is an animal, and the one exception to R-049's sizes: about nine metres long, five gnome-lengths of shell, because she is very old and nobody knows how old. Like every creature she wants something: her eggs kept safe and the loch left alone. She is never hurt and never dies (R-021, R-049): shots and rams do nothing to her shell. The HOA's plan to drain the loch for a golf course is why the dredger is there. The Tall-One reading (a pet pond turtle left behind) is a hint for writers and is never said in game.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** one giant animal makes the loch a place with a monster in it without breaking R-049's scale for everything else, and keeping the pet-pond reading out of game keeps canon fact 1 and the loose threads intact.

## R-052

**Question:** Gnome Theft Auto's Pay 'n' Glaze now sells wheels, paint finishes, sprays, lamps, seats, hood ornaments and ride height. How can a gnome's mower have chrome rims and a lowered body, and does a fresh paint job change who owns it?
**Ruling:** The mowers are clay and iron, so everything is bolted or glued on in the bay. Tuning is by cushion springs and acorn-cup stacks. Every job files the VIN off and re-stamps the owner's loyalty number, so the Hat Watch tracks the loyalty number, not the mower. Nothing the shop sells makes a mower wet, bloody or alive. The "Tall One" reading of the wheels and rims (cast-off bike wheels and bottle caps) is a hint for writers and is never said in game.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** bolt-on parts and spring tuning give the shop's catalogue a physical reason to exist without breaking the clay-and-iron rule, and the loyalty-number re-stamp answers the ownership question while keeping the Hat Watch's view of a mower as an unknown thing.

## R-053

**Question:** Where is the Pay 'n' Glaze workshop, and why can a mower disappear into it for a fitting and come back later at the same spot?
**Ruling:** It is the pot's yard, reached through the doorway. Time inside does not pass for the street, so the Hat Watch never sees the mower go. The yard is a hint for writers that the Tall Ones' garden has a back corner nobody has mapped. Never explained in game.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** a yard reached through the doorway, with time that does not pass outside, gives the shop a way to fit a mower without showing the work, and keeps the Hat Watch and the street out of it.

## R-054

**Question:** In Gnome Theft Auto, when do the Strangers & Freaks side jobs open, and why can't a gnome hail a cab mid-job?
**Ruling:** Side jobs open one by one as the story goes (the table is `SIDE_UNLOCKS` in `games/gnome-theft-auto/src/quests/unlocks.ts`). Strangers only talk to a gnome with a reputation. The Loch Moss rumour reaches Driftwood after the Salvage Raid. The Turfton Taxi only drives to the Central Bus Stop, and Mabel won't take a fare with the Hat Watch after them or a contract running.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** one story-ordered table keeps side work from arriving before the gnome has a reason to care about it, and the taxi's single address and its refusals keep a gnome in the story when they are on a job or running from the Hat Watch.

## R-055

**Question:** Gnome Theft Auto now gives every gun away free and sells bolt-on mods at Ammu-Gnation. Where do the free guns come from, how do mods attach to a clay gnome's gun, and do the comedy mods change R-016?
**Ruling:** The guns are Fort Sandpit surplus, handed out with the list lost, so the shop never counts them. Mods bolt and glue on like Pay 'n' Glaze parts (R-052's clay-and-iron rule), and the shop charges acorns for them. A kazoo or a duck muzzle makes a shot sound silly and does nothing else. Nothing a mod does makes a hit gory: a suppressed or silly shot still cracks a gnome, and R-016 stands.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** surplus gives the free guns a reason without a price, and making the mods bolt-ons that change only sound and numbers keeps the comedy from touching the no-gore rule.

## R-056

**Question:** Gnome Theft Auto: what are the giant objects at the Speedway?
**Ruling:** The Tall Ones' lost things: a sneaker, a cooler, a stack of books, a garden hose, a frisbee, a rake, a ruler and a watering can, fallen on the alkali pan in the night of the Great Spill. GTA gnomes name them "Tall-One <plain noun>" and use them without knowing what they were for. Nobody sees the Tall Ones drop anything. Never explained in game.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-22.
**Why:** a heap of lost things with no fall line gives the Speedway its grandstands and pit wall without showing the Tall Ones at work, and "Tall-One <plain noun>" keeps the same naming rule the other settings use for giant objects.

## R-065

**Question:** Gnome Theft Auto's side-quest scenes put the HOA's paperwork on screen. Who writes the "Tall-One mandates" the HOA officers enforce?
**Ruling:** Nobody from the Tall Ones. The HOA's citation clipboards carry forged "Tall-One mandates" printed on Thorne Lawn & Order LLC letterhead: Vesper's company writes the rules and signs them as the Tall Ones. Burt, who wrote citations for years, finds the letterhead on all five clipboards. The Tall Ones neither print nor write (canon 3 stands); nobody on the HOA board has seen one.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** it ties the HOA Audit side job to Vesper, the main villain, without showing or speaking for the Tall Ones.

## R-066

**Question:** What is under the dead centre of Turfton's grid, and what does its worn eraser mean?
**Ruling:** The Tall-One Pencil lies under the storm grate at (0, 0), cedar, redwood-sized. Its eraser end is worn down: something has been rubbed out of Turfton (old streets, old names). Who used it, and what was erased, stays a loose thread. Mossley sells chips of its graphite as artisan eyebrow pencil; Turfton FM calls the hole a sinkhole, and Vesper's HOA "corrects" the maps.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the Grid Truthers payoff needs a twist that points at the story's theme (the Even Cut erasing the Unmowed) without answering where the Tall Ones went.

## R-067

**Question:** Loch Moss: what does the HOA want with it, how did Driftwood first hear Tessie, and what is the Turtle-Shell Pack?
**Ruling:** The HOA means to drain the loch for an eighteen-hole golf course. Driftwood first heard Tessie singing through his raft's hull the evening the player floated it on the Southern Drainage Canal (Castaway's Dry-Dock), far to the north. Tessie sheds her outer shell plates now and then; the Turtle-Shell Pack Driftwood gives is one of those, taken from the shallows, never from her. The Turfton Tattler pays 1,500 acorns for a photo and nobody believes the Tattler.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** it links two of Driftwood's side jobs into one thread and keeps the shell reward from implying that anyone harms Tessie.

## R-068

**Question:** Porcelain on the Tall House Porch: where did Clara's lanterns go, and what is Vesper's interest in porcelain?
**Ruling:** HOA scavengers swapped Clara's three porcelain lanterns for unlit wax copies and took the real ones; their report reaches Vesper at the Glaze & Tax counter. Vesper's view: "Porcelain belongs on a shelf." He keeps one; what is on it is a loose thread, as is whether he came from the Tall House. Clara's Porcelain-Glaze Charm is the one thing of hers never cracked; nobody has asked how she made it. The knocking inside the Tall House is never explained.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the porch quests need a link to the main villain, and porcelain is the one thing Vesper and Clara share.

## R-069

**Question:** The Replica Stopping Stone and the toaster altar: where do they end up?
**Ruling:** Returned to Elder Bracken, the Replica Stopping Stone stands in the ring at Unmowed Hollow, the only stopping stone the Unmowed have; it is a copy of the stone that jammed the Mower, not the stone itself (Fescue's stays where it is). Fenced instead, Granny Gnertrude pays 500 acorns from her pie cooler and calls it "Replica. Weighs like guilt." The porcelain refugees' toaster sits on a stone by Bracken's fire; asked whether it is an altar or a warm box, Bracken said "Yes", and the theology stays unresolved.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** both endings of the Fescue Fugitive need a place in the world, and the replica must never be mistaken for the real Stopping Stone.

## R-070

**Question:** The smaller side-quest facts: who are they, and are they canon or only a character's claim?
**Ruling:** Canon for Gnome Theft Auto: Big Lou gives the player his own spare Microfiber Bowler; Mayor Barnaby "Two-Coat" Mulch is The Gnomecino's VIP on the embargo night; Baroness Brenda abolishes a "Hose-Pipe Tax" and names the flood holiday after herself; Vesper's caddie at the country club is Sedge; Farmer Bramble has slept in his cellar since Biscuit's squeaky hotdog started squeaking. A character's claim only, not canon: Shelldon's tinfoil brim blocking satellites; Mossley's belief that Ammu-Gnation counts its free guns (R-055: it cannot); Cedric's "Chapel of Mulch quota", which may be a deadline he made up.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** side-quest scenes add many small details; marking which are facts and which are a character talking stops later writers building on a joke as if it were true.

## R-071

**Question:** Gnome Theft Auto's main story now plays as scenes in the world. Which running threads tie the five chapters together, and who is Turncoat Cam?
**Ruling:** Vesper Thorne compliments the player's hat every time they meet ("Nice hat. Shame if it cracked."), a little colder each time, and does not finish the line at the Salvage Raid. Turncoat Cam, real name Cameron, sweeps the Side-Valve apron from the prologue on, watches the bay too often, phones Vesper on a tin-can phone at the end of chapter 2 and hands him the Golden Acorn at the Salvage Raid, for a Patio Heights racing charter. Mabel Kerbstone turns the crew down on every job ("Not on a job, dear.") and gives the player one free ride, in the epilogue. Tansy's forty-eighth wrench, the brass one, comes out of its cigar box for the finale and goes back up on the wall afterwards: forty-eight.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** threads that come back in every chapter make five chapters read as one story, and each one pays off in the finale or the epilogue.

## R-072

**Question:** Where is the Grand Combine built, and what does the Golden Acorn look like up close?
**Ruling:** Its armour plates are riveted by HOA welders at the Compost Heap forge in Mossy Wood, scratch-proof on Vesper's orders, while Ash-Shovel Ernie stokes the furnace and minds his own chestnuts. The Golden Acorn (the Seed-Cell) is the size of a gnome's fist, warm, with a thin seam of light round its waist; its hum drops half a note when held to an ear. Elder Bracken says the Mower has levelled a lawn before, "long ago, to us"; the Unmowed never say more than that.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** showing the Combine being built gives the chapter 2 scouting trip a payoff, and a concrete acorn gives every scene that holds it the same prop (`golden-acorn-seed-cell` in @lawn/prefabs). Bracken's line keeps Fescue's Rumbling a hint, not an explanation.

## R-073

**Question:** What happens to Pip's arm in chapter 3, and what is his golden kazoo?
**Ruling:** A raider's swing at the Salvage Raid cracks Pip's clay arm off at the shoulder while he shields the player. Father Loam glues it back with Kiln-Resin from the northern shrine; it is good as new and shinier, and Pip says so. The golden kazoo is an Ammu-Gnation muzzle Pip bought for forty acorns before the Fort Sandpit raid; it only makes his shots sound silly (R-055).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** a cracked arm is the story's one real wound, played straight and mended on screen, which keeps R-016's no-gore rule (clay cracks, it does not bleed) while letting chapter 3 hurt.

## R-100

**Question:** Don Compost never speaks (R-025). How do his people know what he wants?
**Ruling:** He taps: on an armrest, a cane or a car roof. One tap means a mower, two means acorns, three means crack a hat. His bodyguards translate out loud, with more confidence than knowledge. After the First Contract a fourth tap turns up, meaning the door: hold it. Nobody has ever heard five.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** a silent boss needs a code his crew can get wrong; the code grows one number at a time, which gives every later Don scene a joke to climb.

## R-130

**Question:** Gnome Theft Auto, The Porcelain Support Group: where is the refugees' padded bunker, and did Elder Bracken settle the toaster question?
**Ruling:** The padded bunker is in Mossy Wood, beside the standing-stone ring of Unmowed Hollow, by Elder Bracken's fire; the Oak Stump Sanctuary is a different place. Bracken settles it for himself with a stone and one word, "Yes.": the toaster is an altar at his fire. The refugees go on arguing about it, so the quest's "toaster theology unresolved" stands.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the re-directed payoff lands the Lowrider at the Hollow and gives Bracken the last word; keeping the argument open lets the refugees stay funny in later scenes.

## R-131

**Question:** Gnome Theft Auto, the Fizz Cup race scenes: what is Burdock's flag, and which grid-side facts are canon?
**Ruling:** Burdock's starting flag is his chequered tea towel (prefab `speedway-tea-towel`); he counts the grid twice, out loud, before every race. He says he left the Hat Watch over the tea towel in the Rookie Mow-Down and never again (still only his claim). Dock Hoewright is Pip Potsworth's cousin and says so on the grid. Auntie Periwinkle's snail is Doris. Shelldon refuses the Snail-Coach podium because it is paved, and his medal goes by snail. The Carburettors set their noise against Vesper's silent electric carts.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the race scenes now carry each race's rival and stakes as data; writing the facts down keeps later Speedway scenes from contradicting the grid.

## R-132

**Question:** DayG speech. How do DayG's NPCs talk: what tone, how long, what tense, and what words do gnomes use for the dead and the broken? How are quest titles, notice-board posts and NPC names written?
**Ruling:** NPC lines are dry, plain and short: one or two sentences, present tense in talk and past tense in the chronicle. Gnomes say "shattered" for a gnome and "put down" for a Hatless, never "killed". Acorns are the money and are counted ("two acorns"). Quest titles are a plain imperative or a noun phrase ("Bring salt to the Tap", "The bitten at the Willow"). Notice-board posts sign with the poster's name or faction. NPC names follow the core style: plant first names, soil-and-tool surnames. No swearing, no gore.
**Applies to:** apocrypha, dayg.  **Date:** 2026-11-23.
**Why:** one house style for every DayG line keeps the phrase bank, notice boards and quest titles consistent, and the wording for the dead follows the Hatless rule (they crack and are put down, nothing bleeds).

## R-134

**Question:** Chicory Waymark explains Club Gnome to new players ("tap the yellow button", "press Shift+Tab"); the house style says no fourth-wall jokes. May a gnome speak to the player as a player?
**Ruling:** Chicory alone may speak to the player as a player, plainly and briefly, like a game's helper, only to explain controls and places. It is help, not a joke; nobody else in the Yard does it, and Chicory never explains why they can.
**Applies to:** club-gnome.  **Date:** 2026-11-23.
**Why:** new players need one clear voice; keeping it to one gnome keeps the rest of the Yard in-world.

## R-135

**Question:** What are Club Gnome's acorns and chips?
**Ruling:** Acorns are a gnome's own treasure kept in the Oakcount, shared by every game. The Gnomecino sells chips for acorns and never buys them back (the house keeps the acorns), and chips are staked at the Gnomecino tables and slots and buy Prize Counter prizes.
**Applies to:** club-gnome (the-yard).  **Date:** 2026-11-23.
**Why:** one currency across games, and a one-way casino currency that cannot leak back into the rest of the economy.

## R-136

**Question:** Do Wayfarers travel with a gnome, and what is a band of them called? How do parties share fights, pay and loot, and what happens when a Wayfarer goes down?
**Ruling:** Wayfarers travel with a gnome who asks them, up to three at a time, and with other gnomes on the road; a band like that is called a party (the plain word, used in the game UI). A party shares its fights: on Fescue a fight shared is work shared, so each gnome near the kill is reckoned a share of it. Wayfarers in a party keep the Bound-Peace like everyone else (R-041); they ask no pay, saying they like the company, though loot goblins still ask. A Wayfarer who goes down gets up again beside the gnome they walk with. Entry: `wayfarers`.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-23.
**Why:** the party feature needs a canon footing (Wayfarers are not a guild, so a band of them is only a walk shared by choice), and it keeps the shared-kill and respawn rules tied to the same in-world reasons as the Bound-Peace and the rest of the road.

## R-137

**Question:** Gnomomia has raids. What is a raid in Fescue, and who are the helpers?
**Ruling:** A raid is a horn call (see `horn-calls`): a Reeve's horn on a post where a pest has grown too big or too many, blown by a gnome who wants it gone. The helpers are Wayfarers answering the horn. A gnome's party, when there is one, takes the seats first; the beasts still want something, like every pest.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-23.
**Why:** raids need an in-world reason that fits the Bound-Peace and the Wayfarers, and the horn gives every helper a reason to come that is not payment.

## R-138

**Question:** Why does raid gear sell for almost nothing, and what is reforging?
**Ruling:** Raid gear is horn-marked (see `horn-marked-gear`). Shops will not trade in it, and smiths reforge it at reforging anvils in the next town into the next tier's piece.
**Applies to:** fescue, gnomes-of-gnomomia.  **Date:** 2026-11-23.
**Why:** raid gear must be worth chasing for its use, never as a coin farm.

## R-139

**Question:** Gnome Theft Auto's mission comms (talking-head briefings and calls, `src/quests/comms.ts`) and the story edit pass put new facts in characters' mouths. Who calls the player, how, and which relationships are now said on screen?
**Ruling:** The crew calls on ordinary phones (a call is a phone call; Tansy also writes by Shelldon's snail post when she is underground in chapter 3). Said on screen now: Pip and Tansy introduce themselves by name in the prologue, and Tansy names Cam as her sweeper there; Don Compost pays the player's Clay-Mart Kiln-Debt down for cracking gnomes who owe him; Juniper calls Reginald her brother; Tansy sends the player to Granny Gnertrude and Granny sends them to Vesper, whom she calls the Glazier; Sorrel Tillbrook calls the player west for Elder Bracken before they meet; Bramble works Granny's farm and calls her Boss; Father Loam was thrown out by the Chapel of Mulch, and Cedric's mulch scheme sold that Chapel its quota; Tansy names Gnorwin Clayfoot as the first king of Fescue and "allegedly" her ancestor (her surname stays a loose thread). Comms lines follow the direction bible's voices and its 16-word limit.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** scenes are too short to introduce everyone; the comms and the edit pass (`docs/design/gnome-theft-auto/story-edit-pass.md`) carry who-is-who, and these facts must stay consistent with later scenes.

## R-140

**Question:** Gnome Theft Auto's mowers now get waterlogged in shallow water, lose parts that lie on the ground after a crash, and a golf cart joins the fleet. R-050 says water never soaks anything. What changes?
**Ruling:** This replaces R-050's last sentence for engines only. Clay still never soaks, but a mower's engine is not clay: driven through water it gulps some, coughs and loses speed, and if it takes on enough it floods and stalls until it dries out on its own or a garage blows it through. Deep water still sinks a mower as R-050 says. A wheel, canopy or panel knocked off in a crash is a real part that lies where it lands until somebody tidies it away. The golf cart in Turfton is the Putting-Green Cart, one of the Country Club's silent carts (`patio-country-club`) that has wandered off its green; mowers of the same model can sound different because no two engines in Turfton were tuned by the same gnome.
**Applies to:** gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the waterlog, debris and fleet features need a footing that keeps clay dry (R-021) and the nothing-wet tone for gnomes, while letting machines break the way players expect.

## R-141

**Question:** Gnome Theft Auto adds hunting. R-021 and R-049 say animals never die or bleed. What is a hunt in Turfton, what is taken, and who buys it?
**Ruling:** A Turfton hunt is a tuft hunt. A shot knocks the quarry over in a puff (R-049), and while it lies there a gnome with a Tuft License combs a tuft of fur, quill, scale or feather from it, now and then a rarer keepsake (a shed quill, a lucky tail-tip). Then it gets up and runs off, unhurt and offended; a combed animal is not combed again for a while. Nothing is skinned, nothing is eaten, and the words "kill", "pelt" and "meat" are never used. Tufts and keepsakes sell at the Tuft & Tally Lodge, a log cabin by the west road in Mossy Wood, kept by Hazel Mattock, who sells the license and keeps the journal of species. The lodge sells tufts on to Turfton for hat plumes, cushion stuffing and brush bristles. The quarry: Bramble Hedgehogs and Hedge Foxes in Mossy Wood, Dust Flats Armadillos, Fells Snow Hares, Loch Mallards, Tallgrass Harvest Mice and Cloverfield Pheasants, all sized per R-049, plus Old Grizzle, a very old grey badger who walks the far western tree-line of Mossy Wood after dark. Whether he is why the birds go quiet there stays a loose thread. Entries: `tuft-and-tally-lodge`, `hazel-mattock`, `old-grizzle`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for hunting; combing a tuft keeps R-021's no-death, no-blood rule and R-049's knock-over-and-run-off, while still giving a hunt, a harvest and something to sell.

## R-142

**Question:** Gnome Theft Auto adds flying and boating craft. Which aircraft are Turfton's, what word does Turfton use for a helicopter, and what happens when an aircraft comes down on water?
**Ruling:** Turfton's aircraft are the Crop Duster, the Whirligig, the Hedge-Hopper, the Sycamore Copter and the Dandelion Drifter. "Copter" is the Turfton word for a helicopter. An aircraft that comes down on water floats: it does not sink like a mower, and it can be flown off again. Entries: `hedge-hopper`, `sycamore-copter`, `dandelion-drifter`, `wingwrights-slipway`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the new craft need one list of Turfton's aircraft, one word for a helicopter, and a rule for water that keeps them distinct from ground mowers.

## R-143

**Question:** Gnome Theft Auto adds two buyable garages, Hangar Two and the Mossbank Boathouse, and a Sling-Lift that fetches from them. Is the Watering-Can Steamer's boathouse on Loch Moss for sale? Does the Sling-Lift carry only mowers?
**Ruling:** The Watering-Can Steamer's boathouse on Loch Moss's east shore is not for sale and is not the Mossbank Boathouse. The Mossbank Boathouse is a separate private boathouse on the south shore, let by Driftwood, about 25 metres east of his dock. The Sling-Lift carries aircraft and boats as well as mowers. It never lands: it lowers rotor craft and the Dandelion Drifter onto clear flat ground, sets fixed-wing aircraft down at the start of a long clear strip, and lowers boats onto open water at least a gnome's height deep. Entries: `hangar-two`, `mossbank-boathouse`, `side-valve-lock-up`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the new garages need a boathouse that is not the Steamer's, and the Sling-Lift's job has to be one rule that covers mowers, aircraft and boats without it ever landing.

## R-144

**Question:** Gnome Theft Auto adds birding and many new birds. What is birding in Turfton, which birds are there, and are any of them more than birds?
**Ruling:** Birding is watching. No license is needed and no animal is harmed (R-021, R-049): gnomes look through binoculars, keep a life list and sometimes take a photograph. The Reedwatch Hide on the south shore of Loch Moss is kept by Dunnock Pell, who pays Acorns for life-list milestones and sells optics (Pocket Binoculars, Field Glasses, the Reedwatch Scope). Birds are gnome-sized per R-049: a sparrow about a quarter of a gnome, a heron taller than one. The birds of Turfton, by group. City: Turfton Rooftop Pigeon, Gutter Sparrow, Commons Starling, Acorn Tit. Songbirds: Hedge Robin, Mossy Wren, Dandelion Finch, Tallgrass Skylark, Snow Bunting. Seabirds and waterfowl: Loch Gull, Loch Puffin, Loch Swan. Waders: Grey Reed Heron, Loch Sandpiper. Raptors: Verge Kestrel, Fells Buzzard, Dust Flats Hawk. Owls: Barn Owl, Tawny Owl, Snowy Owl. Comical birds: Lawn Flamingo, Fells Ptarmigan, Dust Flats Roadrunner, Hat-Pinching Magpie, Cloverfield Dodo. Exotic: Turfton Parakeet. Mythic: Kiln Phoenix, Moon Heron. The Lawn Flamingo is a real bird that gnomes keep mistaking for a lawn ornament. The Turfton Parakeets are said to have escaped from somewhere downtown long ago. The Kiln Phoenix (seen only at Golden Hour over the Dust Flats) and the Moon Heron (only on Neon Nights on the Loch Moss shore) are "said to be seen": whether they are birds at all stays a loose thread. Entries: `reedwatch-hide`, `dunnock-pell`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for birding and new birds; watching keeps every animal rule and gives a collecting hobby beside the tuft hunt.

## R-145

**Question:** Gnome Theft Auto adds sky traffic: aircraft flying regular routes over Turfton, and a giant advert banner towed over the town. Who may buy banner space, what happens when an NPC aircraft is shot down, and who flies the banner?
**Ruling:** The sky over Turfton has regular traffic: aircraft on errands and routes that run day after day, with no one in charge of it (`turfton-sky-traffic`). Only the sixteen Turfton brands may buy space on the sky banner; a rival from outside town may not advertise in Turfton's sky. An NPC aircraft that is shot down crashes and burns like a mower, and its operator sends another one later. The banner pilot is Dorrie Throttle, who is never seen out of the cockpit (`sky-sign-banner-tow`). Entries: `sky-sign-banner-tow`, `turfton-sky-traffic`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the new sky traffic needs one rule for who may advertise in the sky, one outcome for a shot-down aircraft that matches the mower rules, and a named pilot the banner's lore can hang on.

## R-146

**Question:** Gnome Theft Auto adds fishing. Animals are never hurt (R-021, R-049), so how does a gnome catch a fish, what happens to it, and what is sold?
**Ruling:** Turfton fishing is catch-and-release. A Turfton rod ends in a nibble-clip, a bent pin with no point: a fish bites the bait and holds on, the gnome reels it in, measures it, writes a catch card and slips it back into the water, none the worse. A line that strains too far does not snap the fish free with a hook in it; the clip simply pops off. The Bent Pin, a bait and tackle shack on the south bank of the Southern Drainage Canal by Old Brick wharf, is kept by Wenna Gudgeon, who sells rods and bait and buys catch cards for the Turfton catch register (and runs the Bent Pin Derby). Fish are sized for gnomes like every animal (R-049): a trout is about half a gnome long. Three fish are more than fish: Old Mossjaw in the Loch Moss deeps (Tessie's old neighbour), the Gilded Koi at the canal's lock pool (it says it escaped from Baroness Brenda's ornamental pond), and Driftwood's Shark in the far Puddle Sea, which proves Driftwood right about sharks while being very gentle and mostly interested in cheese. Bait is dough, cheese rind, acorn crumb, sock-fluff flies and lures: no worms or live bait.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for fishing; a pointless clip and a catch card keep R-021's no-harm rule and R-050's nothing-gets-soaked tone while still giving a catch, a record and something to sell.

## R-147

**Question:** Turfton has six district signs in the game (`src/districts.ts`) but no lore for them. What are Turfton's districts, and what is the rest of the grid?
**Ruling:** Turfton has six districts, with the names and borders of `src/districts.ts`: **Downtown Turfton** (the civic core around the x = 0 and z = 0 roads: City Hall, Thorne Tower, the Mulch Club, the Glaze Clinic, the Central Bus Stop and the Kerbside Exchange), the **Greenhouse Strip** (glasshouse nightlife east of Downtown: the Gnomecino, Neon-Moth Nina's stoop), **Patio Heights** (the HOA's gated flagstone terrace in the north-east corner), the **Old Brick Quarter** (the oldest streets, south-west of Downtown: Bodega & Sons, Side-Valve Salvage, Shelldon's alley), **Turfton Park & Arts** (west of Downtown: the Amphitheater, galleries, busking pitches and the back alleys the Red Caps use) and **Clay-Mart Industrial** (the south-west corner: the Clay-Mart warehouse, its returns yard, the Clay-Mart Kilnworks and the Local 404 Union Hall). Every block outside them is the **Ring Blocks**: ordinary pot-street housing with no district sign, including the block Pay 'n' Glaze stands on. The Southern Drainage Canal, the Skyway, the Ring Road and everything past the city edge are outside Turfton's grid. Each district has its own entry: `downtown-turfton`, `greenhouse-strip`, `patio-heights`, `old-brick-quarter`, `turfton-park-and-arts`, `clay-mart-industrial`, `ring-blocks`; `turfton-gazetteer` indexes them.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the district signs already exist in the game; the lore takes their names and borders as given so the code and the lore cannot disagree, and the city quests need named neighbourhoods to send the player to.

## R-148

**Question:** What is Turfton's history, in order?
**Ruling:** Five eras before now, oldest first. **The Flat Patch:** a suspiciously level square of clover where the first earthenware gnomes stacked cast-off pots to sleep out of the dew; the Old Brick Quarter's lanes are its footpaths. **Grid Night:** one night the chalk-and-gravel grid appeared, perfectly straight, 60 paces to a block; nobody saw who laid it, and Turfton answered by inventing parallel parking and the property deed by morning. **The Pot Rush:** gnomes claimed blocks, stacked pots into towers and sold the tops; Clay-Mart opened its Kilnworks and began billing every newcomer for their firing (the Kiln-Debt), and the first Homeowners' Association was founded to keep the new towers looking alike. **The Great Sprinkler Scare:** the municipal sprinklers misfired across Downtown; the Spade Guard withdrew to Fort Sandpit and Don Compost stopped speaking. **The Pour:** Local 404 poured the Skyway over the east side, then struck over pay before the far end was done, leaving the Unfinished Span; the Hat Watch unionised, the Gnomecino opened and Thorne Lawn & Order began buying corner pots. **Now** is the story of Gnome Theft Auto. Who laid the grid stays a loose thread. The entry is `turfton-timeline`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the history was scattered over `docs/design/gnome-theft-auto/world-lore.md`, `turfton.md` and `turfton-skyway.md`; this puts it in one order that agrees with all three.

## R-149

**Question:** Who runs Turfton: what are its civic institutions?
**Ruling:** Five. **The Council:** Mayor Barnaby "Two-Coat" Mulch and a five-seat Zoning Board meet in City Hall; the board votes four to one for whatever the HOA files, the one being Councilwoman Juniper Vance. City Hall sets the Hat Watch budget, parade permits and street-sweeping, and nothing else (entry `turfton-council`). **The HOA:** in Gnome Theft Auto the HOA is the Patio Heights Homeowners' Association, whose board Vesper Thorne chairs through Thorne Lawn & Order LLC; it passes covenants, not laws, and its fines end in foreclosure at the Glaze & Tax Office. It is not the unseen HOA of Gnome Company's sermons (`hoa`); the two only share a name (entry `patio-heights-hoa`). **The Hat Watch:** City Hall's watch, run from the Watch House on the x = 0 road north of City Hall (entry `watch-house`), unionised since the Pour. **The Kiln:** Turfton has no kiln of its own for firing new gnomes; the Clay-Mart Kilnworks in Clay-Mart Industrial fires and glazes newcomers for the Snail-Coach line and bills them, which is why Clay-Mart holds every Kiln-Debt (entry `clay-mart-kilnworks`). **Transport:** the Snail-Coach line ends at the Central Bus Stop; Mabel Kerbstone drives the one Turfton Taxi; Local 404 keeps the roads, the Ring Road and the Skyway; Snail-Mail Express and Pigeon-Drop carry the post (entry `turfton-transit`).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the quests and the story already lean on all five; the lore had only scattered mentions, one of which (`hoa`) belongs to another game.

## R-150

**Question:** Turfton's side jobs are scattered over a dozen givers. Is there one place in the city where a gnome finds work?
**Ruling:** Yes: the **Kerbside Exchange**, a cork notice-board and a folding desk on the x = 0 road pavement just south of the Central Bus Stop, run by **Dorrit "Dot" Pennywort**, a retired Snail-Coach conductor who still punches a ticket for every job she hands out and takes no cut ("the city pays me in gossip"). Every open side contract in and around Turfton is pinned to her board, whoever offers it; the player reads the board from the phone (the Kerbside Exchange app), and Dot's own clients (Neon-Moth Nina, Hedda Galley, Big Wrench Grout, Pip) hand out their jobs at her desk. The Exchange does not replace the other givers: Big Lou, Shelldon, Clara, Granny Gnertrude and the rest still give their own jobs where they live. Shelldon now gives the Snail-Racing Rigging from his own alley rather than from the Bodega pavement. Entries: `kerbside-exchange`, `dot-pennywort`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for the city to feel like the hub; a board at the bus stop every newcomer steps off at (and the taxi always returns to) makes it one without moving any finished quest.

## R-151

**Question:** Who runs the Turfton Tattler, and who else is part of Turfton's recurring city cast?
**Ruling:** The Tattler is edited by **Hedda Galley**, who has never printed a correction and never been photographed; the masthead still shows nobody (entry `hedda-galley`). The recurring city cast, each with their own voice and walk: Dot Pennywort (the Exchange), Hedda Galley (the Tattler), Neon-Moth Nina (Greenhouse Strip), Union Boss "Big Wrench" Grout (Local 404, Clay-Mart Industrial), John Bodega (Old Brick Quarter), Pip Potsworth and Tansy Clayfoot (Side-Valve Salvage), Councilwoman Juniper Vance (City Hall), Big Lou (the Gnomecino), Shelldon (his alley), Mossley (the survey table) and Mabel Kerbstone (the taxi). They know each other, mention each other's jobs, and turn up in each other's scenes.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** a hub needs regulars; most of them already exist, and the Tattler's editor was the one gap the new jobs needed filled.

## R-152

**Question:** Local 404's strike fund ledger (a loose thread of `local-404-union-hall`): where is it, and how does the Skyway come into it?
**Ruling:** The HOA seized the ledger from the Union Hall after the Pour's strike and moves it between the Glaze & Tax Office and Fort Sandpit's vault in an HOA van, always by the ground road, because the HOA will not drive on a road Local 404 built. In "The Skyway Job" the player takes the Skyway, gets ahead of the van at the east off-ramp and brings the ledger home to the Union Hall, which stands behind Clay-Mart on the z = 180 road. What is written in the ledger stays a loose thread: Grout reads it in private.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the city's heist job needs a reason to use the Skyway; the HOA's snobbery about a union road gives one and keeps the ledger's contents open.

## R-153

**Question:** Gnome Theft Auto restyles downtown Turfton's towers one by one. Which towers have names, who owns them, and do they change the Pot Towers?
**Ruling:** Fourteen named towers are Pot Towers, each with an owner in Turfton's lore: **Thorne Tower** - Thorne Lawn & Order (`thorne-tower`); **Kiln-Shield Plaza** - Kiln-Shield Insurance (`kiln-shield-plaza`); **The Snail-Mail Sorting Tower** - Snail-Mail Express (`snail-mail-sorting-tower`); **The Tattler Building** - the Turfton Tattler (`tattler-building`); **The Acorn-Cola Drum** - Acorn-Cola (`acorn-cola-drum`); **Razor-Back Tower** - Razor-Back (`razor-back-tower`); **Husky-Blade Tower** - Husky-Blade (`husky-blade-tower`); **The Stink-Gro Step Garden** - Stink-Gro (`stink-gro-step-garden`); **Buck-Iron Tower** - Buck-Iron (`buck-iron-tower`); **Pigeon-Drop Depot** - Pigeon-Drop Couriers (`pigeon-drop-depot`); **Turfton FM Twin Masts** - Turfton FM (`turfton-fm-twin-masts`); **The Pure-Loam Glasshouse** - the Pure-Loam Co-op (`pure-loam-glasshouse`); **The Leaning Fizz** - Dandelion Fizz (`leaning-fizz`); **First Kiln Bank** - the bank that keeps Turfton's Kiln-Debt ledgers, which Clay-Mart sells (`first-kiln-bank`). Every other downtown tower stays a nameless Pot Tower. The First Kiln Bank is new: it keeps the Kiln-Debt ledgers that Clay-Mart sells. The Kiln-Shield Plaza is the Kiln-Shield billboards' tower of `turfton-towers`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for towers that are each styled individually; names and owners tie each look to a company already in Turfton's lore.

## R-154

**Question:** Gnome Theft Auto adds a minor town on the outskirts. Where is it, what is it, and what is the Old Combine the Dust Flats tales mention?
**Ruling:** Pebblewick stands at the far east of the Dust Flats where Route East runs out towards the fence; about 30 gnomes; farms on the Weeping Line; the Old Chrome Combine is real and hums at three in the morning; the HOA takes an interest; Turfton is still the only city, Pebblewick has a reeve, not a mayor; the Pebblewick Hopper is the only bus.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for a minor town on the outskirts with things to do.

## R-155

**Question:** Turfton's Gnomecino and Club Gnome's Gnomecino: two casinos or one?
**Ruling:** One building with two front doors: Big Lou's velvet rope in Turfton and the town square door in the Yard. Whoever walks in, from either, is in the same hall. Chips stay chips: winnings never turn into Turfton acorns (the Oakcount rule: chips never buy acorns back).
**Applies to:** club-gnome, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the crossover portal (docs/design/crossover-portals.md) puts a GTA player inside Club Gnome's Gnomecino; one building keeps both lores true.

## R-156

**Question:** New players meet a dozen hobbies and systems (hunting, birding, fishing, the Lock-Up, aircraft, the Skyway, sim jobs, Pebblewick...). Who shows them round?
**Ruling:** Mabel Kerbstone keeps a **Newcomers' Card** at the Central Bus Stop, because every newcomer steps off at her stop: a punch-card with one stamp per hobby club or trade, each stamped by its host. Dot Pennywort (street events, a good turn), Neon-Moth Nina (emotes and a handshake), Pip Potsworth (the weapon wheel and the Pocket Kit), Tansy Clayfoot (the Side-Valve Lock-Up and the Sling-Lift; later Hangar Two and the Mossbank Boathouse), Councilwoman Juniper Vance (mowing the verges, the Country Club's cart), Wenna Gudgeon (fishing at the Bent Pin), Big Wrench Grout (the Skyway and the Unfinished Span), Mabel herself (Kerbstone Cabs and the other odd jobs; the trip to Pebblewick), Wind-Sock Wally (flying and the Wingwright's Slipway), Hedda Galley (spotting the banner plane), Hazel Mattock (the Tuft & Tally Lodge), Dunnock Pell (the Reedwatch Hide). A party stamp exists for gnomes who play with friends and is not needed. A full card is Turfton's welcome (achievement gta-newcomer-card). Mabel also dispatches Kerbstone Cabs, the taxi job of the sim jobs. Entry: `newcomers-card`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for tutorial jobs that feel part of the city rather than a checklist; Mabel's loose thread (what she does between fares) gives them a keeper.

## R-157

**Question:** Can a Turfton gnome hold a job, and who pays them?
**Ruling:** Yes, by the shift. Kerbstone Cabs (Mabel Kerbstone), Pigeon-Drop's ground crew (Sorting-Office Sid), Wally's Charters (Wind-Sock Wally) and the Loch Moss Steamer Co. (Purser Tolly) hire any gnome, pay in Acorns per job and keep a ledger of levels. The Kerbside Exchange's contracts stay separate one-off jobs. A gnome can ride as another gnome's cab fare (online); the company covers the fare. Tubing on Loch Moss is for fun, not a job: tubes are rented at the Mossbank rack.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-23.
**Why:** the user asked for convincing sim jobs (taxi, courier, pilot, boat driver) and tubing that work online.

## R-158

**Question:** Gnome Theft Auto adds an ocean at the south of the map. Is there a sea, and how does it sit with the Puddle Sea?
**Ruling:** Yes. South of the Puddle Sea a line of dunes stands between the fresh water and **the Saltwater**, a real sea with swell and salt. The shore is **Saltbucket Shore**, a seaside town built round a giant sunk bucket and spade, with **Saltbucket Boardwalk**, **Long Spoon Pier**, **the Spokewheel** (a Tall-One bicycle wheel turned into a ferris wheel with teacup gondolas) and the pirate ship **the Bathtub Queen** (a Tall-One bath toy gone to sea, captained by Samphire Bilge). Most Turfton gnomes have never seen the Saltwater and say "the Big Puddle" when they mean it. What lies across it, and whether it is a Tall One's sea at all, stays a loose thread.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for an ocean region with a boardwalk, ferris wheel and pirate ship; Driftwood's "Big Puddle" gives the gnomes a word for it.

## R-159

**Question:** Where is the research university and its observatory, and what is the hill it sits on?
**Ruling:** **Rootwell University** stands in the far east, past the Dust Flats: twelve buildings round a quad, and an airstrip, **Rootwell Field**. Its observatory sits on **the Anthill**, a giant ant mound, not a termite mound. The ants still live inside and are the landlords: the university pays rent in sugar, and the ants close the doors when it is late. The drive-off ramp on its side is **Dean's Leap**. Ants are neighbours, not pests (canon: every pest wants something; the ants want sugar and quiet).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for a research university with an observatory on a giant ant-hill or termite mound with a ramp; one ruling settles which.

## R-160

**Question:** What lies north of Frostbite Fells, and what grows the toadstool forest?
**Ruling:** The high country north of the Fells is **Snowcap Rise**: **Snowdrop Slope** (the ski hill, rope tow and sledding run, kept by Gentian Bootlace at **the Woolly Sock Lodge**), **Pail Pond** (a frozen lake over a sunk Tall-One pail, ice-fishing huts, polar bears who are very relaxed), **Capwood** (a forest of giant toadstools) and **Pinwheel Ridge** (giant garden pinwheels that make Turfton's electricity). Capwood grows over a Tall-One woodpile buried long ago; its warden, Chanterelle Stook, fines anyone who bruises a cap. The rally route through it is **the Capwood Run**; its fords run with **Cap-water**, which is thick and slow and never floods an engine. Why the woodpile was buried stays a loose thread.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for a ski hill, ice fishing, a toadstool forest, a rally route with special water that cannot waterlog a car, and wind turbines.

## R-161

**Question:** The golf course is reached by breaking through a fence into someone else's yard. Whose yard?
**Ruling:** Another Tall One's garden, west of Tallgrass Commons, reached through **the Kicked Board**, a loose fence board. The gnomes call the garden **Hedgeworth**. Its gnomes talk about "over the fence" the way Turfton talks about Fescue. **Hedgeworth Links** is a nine-hole course among hedges, tall grass and giant plants, run from **the Hedgeworth Clubhouse** by Dame Peony Gravelrake, with Basil Divot as pro and Thrift Hosepipe as groundskeeper. It is not Vesper's Patio Country Club; Vesper holds Hedgeworth's mortgage. Who the neighbour Tall One is, and whether they know there is a hole in the fence, stays a loose thread.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for a golf course added by breaking through a fence into someone else's yard.

## R-162

**Question:** Who owns the vineyard and the mansion?
**Ruling:** **Trellisdown** is old-money hill country west of Mossy Wood. **Trellisdown Vineyard** and **Brassknock Manor** belong to Countess Wisteria Brassknock, whose family holds Turfton's oldest charter. The vines make **grape-dew**, a sweet pressing gnomes sip at weddings and tastings (it is not Black Dew and runs no engine). The Brassknocks have quietly funded the HOA for years; in the story the Countess is the money behind the Grand Combine until she learns its line runs through her own vines. Her head gardener is Chicory Snips.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for a vineyard and mansion; tying them to the HOA's money gives act III a fourth part of the Combine to find.

## R-163

**Question:** The user asked for a cult. What is it?
**Ruling:** **The Flock of the One Leg**, a harmless camp of gnomes at **Wader's Rest**, reeds near Loch Moss, who stand on one leg before **the Standing Lady**, a giant pink plastic lawn flamingo. Their rules are absurd (one leg at sermons, no sitting on Tuesdays, pink is for the Lady only) and their leader is Mother Saxifrage Wader. They prophesy "the Even Cut, on the longest day", which turns out to be a true date. No real-world religion, no violence, nothing worse than a sore ankle. Not related to the Evil Shadow Gnome Cultist of the Cursed House. Whether the Lady ever moved on her own stays a loose thread.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** a cult that is funny, a little ominous and ends gently, per the E17 brief.

## R-164

**Question:** Who are the moles under the west edge of Mossy Wood, and how do gnomes see them?
**Ruling:** **The Burrowfolk**, small gentle moles who live in **Loamdeep**, a town of halls and tunnels entered by **the Burrow Door** at the west edge of Mossy Wood. They are kind, shy, a little formal, and almost always misread: gnomes treat them as pests that eat roots (they eat grubs and keep roots alive), and Tall Ones blame them for every lump in a lawn. Old Mother Tumblesoil keeps Loamdeep; Nubbin is a young mole who runs the post. DJ Moleman is one of them by birth but lives apart, in his own burrow under Turfton. The Burrowfolk say their great-greats came "from under the Fence, running": whether they are a clan that fled Fescue's shaking (see the Fescue entry `mole-clans`) stays a loose thread. Moles do not wear hats, except Moleman's on his antenna.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for an underground society of cute, misunderstood moles with DJ Moleman.

## R-165

**Question:** Who lives under the highway?
**Ruling:** **The Underspanners**, a commune of brilliant, slightly unhinged inventors living in **the Underspan**, the shade under the Skyway's Unfinished Span. They hold that anything built on the ground is already obsolete, refuse permits on principle, and will build anything for scrap. Their leader is Hogweed Sprocket. They are Local 404's estranged cousins (the union poured the Span; the Underspanners moved in when it stopped). They built **the Dewdrop**, a clear rolling ball a gnome runs inside like a hamster.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for a crazy, radical but brilliant society under the highway, and a bubble vehicle.

## R-166

**Question:** What are the new downtown and fringe places, and what does the player's flat cost?
**Ruling:** **Thorne Even-Estates** is Vesper's HOA-approved beige housing, built by **Levelright Construction** (foreman Chard Levelright) on three fringe sites. **The Double Pot** is Thorne Lawn & Order's 2x1 tower over the street (the Double Pot Tunnel runs under it), the Even-Estates sales floor and, later, the HOA lockup. **Founders' Green** is the park made from three blocks Vesper had condemned, rezoned by Juniper Vance after the Founder's Trim Day tribunal; it includes Gnorwin's statue. **Drainpipe Court** (basketball) and **the Gutter Bowls** (skate park) are public. The player's flat is **flat 3B, Saucer Court**, loaned by the First Kiln Bank (loan officer Parsley Inkpot) for 1,500 Acorns added to the Kiln-Debt ledger; the bank keeps the ledger, Clay-Mart only sold the original debt. The player's farm, if bought, is **Windfall Croft** in Cloverfield.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for construction sites, a downtown park, a mega block with a tunnel, a court, a skate park, and a home loaned to the player that adds to the debt.

## R-167

**Question:** Gnome Theft Auto's main story grows from 17 quests to 70. What is the shape, and what is the Grand Combine made of?
**Ruling:** Four acts: I Fresh Glaze (Turfton, 1-15), II Turf & Dew (farms, woods and first reaches, 16-35), III Cold Clay, Far Edges (36-53), IV Sandpit Protocol / The Even Cut (54-70). The Grand Combine is built in four parts at the edges of the map: the cutting deck (tested on Hedgeworth Links), the guidance or "Even Line" (computed at the Anthill Observatory), the power (taken from Pinwheel Ridge) and the money (Countess Brassknock). The Golden Acorn is still its ignition core. The finale keeps both endings; Vesper is stopped, not shattered. The outline is `docs/design/gnome-theft-auto/story-outline.md`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the user asked for 70 main quests with more character development and quests that explore the whole world.

## R-168

**Question:** Where exactly do the batch-3 places stand, and where does the ground differ from the story plan (E04 spine)?
**Ruling:** The four bands and their roads: **Snowcap Rise** is the north band (`north-band`, `north-band-east`); **Saltbucket Shore** the south band (`south-band`, `south-band-east`, `coast-spur`); **Rootwell** the east band (`east-band`, `east-band-south`, `runway-spur`); **Trellisdown** the west band (`west-band`, `west-band-south`). The band roads join into one ring road round the old map. **Drainpipe Court** and **the Gutter Bowls** are inside **Founders' Green**. **The Underspan's** ground is beside the Unfinished Span at (580, -26). **Wader's Rest** is in Trellisdown, about 400 m west of Loch Moss, not on its shore. Slot ids in `src/sites.ts` stay as they are and carry these names as labels.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** E01 built the ground after E04 named the places.
