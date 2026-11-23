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
