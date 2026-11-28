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

## R-169

**Question:** Where does Turfton property come from, and how is it paid for?
**Ruling:** Property in Turfton is bought on a loan. The First Kiln Bank's ledger (R-166) carries the Kiln-Debt balance and each property loan as separate lines: "added to the Kiln-Debt ledger" in R-166 means booked on that ledger beside the Kiln-Debt balance, never added to the balance itself. Paying off Kiln-Debt does not clear a property loan, and the reverse.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-24.
**Why:** the GTA economy (E08) sells property on a loan (flat 3B, Windfall Croft) and needs one rule for where the money sits, so the Kiln-Debt story beats and the "paid off" moment keep their meaning.

## R-170

**Question:** What can a gnome walk into in Turfton, and what is inside?
**Ruling:** Four walk-in interiors. **Bodega & Sons** (block x -90, z 90; the game's block placement wins over the older "x -60, z 60" in the entry) is a narrow shop inside the overturned watering can, with the counter on the north wall, Asphalt asleep on the counter, the Acorn-Cola tower that fell over and was never restacked, and Mossley's abandoned grid-survey table. **The Mulch Club** lobby is entered by the members' side door on the south face (the front door on the east face still leads to Don Compost's back room for quests): velvet booths, the cloakroom with the brass plaque "NO SIRENS. NO WET HATS. NO TALKING.", a hat-check gnome, a silent bodyguard at the back-room door, and a card game abandoned the moment somebody spoke. **Flat 3B, Saucer Court** is the player's loaned flat, empty on move-in (a bedroll, moving crates, the bank's notice on the wall); furnishing is E10's. **The Thorne Even-Estates sales floor** is inside the Double Pot, door in the Double Pot Tunnel: a beige scale model of an Even-Estate, HOA posters, a bin of rejected colours, and a lift to the roof.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** L36 asked for building interiors.

## R-171

**Question:** Which roofs can a gnome stand on, and where do helicopters land?
**Ruling:** Every flat downtown tower roof is walkable behind a waist-high parapet. The tunnel-roof slab between the Double Pot's two halves is the **Thorne Helipad**, Thorne Lawn & Order's pad, reached by copter or by the sales floor's lift. Towers with a helipad crown (the Pigeon-Drop Depot among them) take a copter too. Roofs are reached only by air or by a lift: gnomes do not climb.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** L75 asked to land on buildings and run around.

## R-172

**Question:** What is Pardonlin, who lives there, and how do the Wickets work?
**Ruling:** **Pardonlin** is another Tall One's garden west of Trellisdown, laid out as a continental formal garden: gravel walks, box-hedge parterres, clipped limes, terracotta pots and a long ornamental rill. Its gnomes are **the Continentals**, polite to a fault ("pardon" is the town's name and its first word), who take long lunches, have strong opinions on bread, queue for everything, cycle everywhere and have a dozen ways to say "it is not done". Districts: the old town on the east bank, the Left Bank on the west, **the Jardin** (the formal garden to the north), the Little Gardens (allotments) and **Pardonlin Basin** with **Basin Quay** to the south. The old perimeter fence still stands between Trellisdown and Pardonlin; where the three roads cross it, the Continentals took out fence panels and hung proper gates, each with a customs hut that stamps a visitor's hat: **the Grand Wicket** (on Vineyard Lane, z -30), **the North Wicket** (z -500) and **the Harbour Wicket** (z 1000). Turfton gnomes once thought the fence was the end of the world; the Continentals think the same of theirs. What lies beyond Pardonlin's own west fence stays a loose thread. Reserved for later, to be named but not yet built: **the Bean Tower** (a giant Tall-One bean-pole wigwam, the town's landmark), **the Grand Platz** (main square), **Teacup Row** (cafe street), **Radio Adagio** (the classical-music station) and **the Beetle Market**.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the second expansion adds a formal-garden town west of Trellisdown; a satirical continental mash with no real cities or nationalities by name.

## R-173

**Question:** What is the Thymes, and how do its bridges and source work?
**Ruling:** **The Thymes** is the Tall One's garden rill: a slow green river running north to south through Pardonlin into Pardonlin Basin. It rises at a garden tap at the north end of the Jardin, called **the Source**. Its bridges, from north to south, are **Pont Nord**, **Pont Neuf**, **Pont Sud** and **the Basin Bridge**.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the second expansion needs a river through the town, with a named source and bridges for the player to find.

## R-174

**Question:** What is the Unmown, and why did the Tall One stop mowing it?
**Ruling:** **The Unmown** is the north-west corner the Tall One stopped mowing years ago, now a nature preserve kept by rangers from **the Unmown Ranger Station**. It holds the waist-high meadow (**the Long Meadow**), reed beds (**Reedmere**), old trees (**Oldroot Wood**) and three bird hides. Gnomes find it frightening and wonderful at once: a place no mower goes. The HOA hates it, since it is the opposite of the Even Cut. A rusting mower the grass swallowed sits at the entrance. Why the Tall One stopped mowing stays a loose thread.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the second expansion's wild north-west corner needs a home, and a place the HOA cannot mow gives the Even Cut something to argue with.

## R-175

**Question:** What are roundabouts doing in Turfton, and how do gnomes drive them?
**Ruling:** The Continentals brought roundabouts to the Tall One's lawn; Turfton built two on its ring road: **Trellis Cross** and **the Anthill Ring**. Traffic goes round anticlockwise. Gnomes who have never used one go round three times. Pardonlin's own are **the Hatwheel** (six roads, the great roundabout) and **Place du Pot** (the small one).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** roundabouts are the one foreign import the Continentals have given Turfton's ring road, and the anticlockwise joke is the gag.

## R-176

**Question:** Who are the gnomes in tall striped hats who stand in the middle of busy crossings?
**Ruling:** **The traffic-hat wardens** are HOA wardens in tall striped hats who stand on a podium in the middle of a busy crossing and wave one road through while holding the other with a stop/go paddle. Named wardens: **Sedge Pennyroyal** (Turfton, the hospital crossing), **Burnet Gatepost** (by the Mulch Club), **Agrimony Kerb** (the south crossing) and **Lupin Pardoux** (Pardonlin High Street, on loan from the Continentals, who think the HOA's hats are too short). They are not Hat Watch: the wardens never chase anyone, and the Hat Watch never directs traffic.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the second expansion's roundabouts and busy crossings need someone to direct traffic, and the HOA's hats need a second use.

## R-177

**Question:** Where do the second expansion's places stand, and what happens to the bands at the edge?
**Ruling:** **Pardonlin** is x -1800 to -1400, z -900 to 1100, west of Trellisdown. **The Unmown** is in the north-west, at x -1800 to -200, z -1800 to -1400, plus x -1800 to -1400, z -1400 to -900. The bands are pushed out to the edge: **Snowcap Rise** reaches the north edge (the High Tarn), **Rootwell** reaches the east edge (Rootwell Field Station), and **Saltbucket Shore** (the Saltwater) runs the whole south strip. The world is now 3600 m across, with the perimeter fence at 1795. The map's old edge stays a loose thread, and R-168 still names the band roads.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the second expansion moves the edges of the world out, and the entries need one place to read where things are.

## R-178

**Question:** Does the Yard have weather, and what is the white stuff that falls on the Fells and Snowcap Rise?
**Ruling:** Yes. Rain, mist, cloud and snow pass over the Yard in fronts; most gnomes blame the Tall Ones' sprinkler for
the rain and say so out loud. On Frostbite Fells the locals call falling snow **frost glaze** and will correct you; on
Snowcap Rise they just call it snow. Saltbucket Shore gets sea mist off the Saltwater, and Pardonlin's rain is a
continental drizzle that never commits to a downpour. Glazed gnomes do not mind getting wet.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** Gnome Theft Auto's weather (batch 3, E06) needs toast lines and achievements that fit the setting, and the Fells'
"It is frost glaze, not snow" joke has to survive real snowfall.

## R-179

**Question:** Gnome Theft Auto's mowers can now skip across deep water when they hit it fast, and run straight through small bushes and rose beds. R-050 and R-140 say deep water sinks a mower. What changes?
**Ruling:** Nothing in R-050 or R-140 is undone: a mower that is slow in deep water still conks out and sinks. But a mower that hits deep water fast, off a jump or flat out, skips across it like a flat stone, bouncing and throwing spray, for as long as its speed lasts; once it slows it sinks as before. Gnomes call it "skipping", and the Skipping-Stone Pendant is the proof that you did it on purpose. Small bushes, rose bushes, flowering bushes and allotment beds give way under a mower and grow back (the mowing rules); hedgerows, hedge arches, topiary and trees do not. Flattening six big shrubs in a row is "shrub bowling", and the Shrub Disguise is what the gardeners who saw it wear afterwards so you cannot find them.
**Applies to:** gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** L113 and L114 ask for bushes to be run over and for driving over water on jumps; the water rule needs a footing that keeps sinking as the end of every skim.

## R-180

**Question:** Where does everybody live, and who can visit?
**Ruling:** Every named gnome has a home. Some are known places, with a door, a plate and a lit window; some are never shown (a cot, a back room) and stay unacknowledged. Homes are private: in the online game nobody visits another player's flat, because each player's Flat 3B is their own. Gnomes put their names on plates, not on maps, so a home only goes on the player's map once they have stood at its door.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** Epic E10 (homes) builds a dozen doors and needs one rule for what is shown, what is private and what the map knows.

## R-181

**Question:** Who sells the furniture for Flat 3B?
**Ruling:** **Gnome & Garden Furnishings** sells it: a flat-pack firm that delivers to Saucer Court, "stairs extra, free". Nothing they sell is ever assembled, and the instructions are a single diagram of a gnome looking worried. No other brand or entry covered furniture sellers.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E10 lets the player furnish Flat 3B and the catalogue needs a seller.

## R-182

**Question:** What is Pardonlin's satire, and how far does it go?
**Ruling:** Pardonlin is a gentle Paris, London and Berlin mash: cafés and boulevards, queues and rain-or-shine drizzle, bureaucratic calm and bicycles. No real city, brand, composer or nationality is ever named; the Continentals are the Continentals. The joke is always affectionate and never mean: they are polite, proud, unhurried and quietly absurd. Its four seasons are queues, long lunches, strikes and bread (the Baguette Round marks the morning, the lunch marks the day, a strike marks the week, and nobody is sure when a queue began). Pardonlin's entries (the Bean Tower, the Grand Platz, the Unknown Pigeon, Teacup Row, Café Pardon, the Beetle Market, the Jardin, the Little Gardens, Basin Quay and their residents) are apocrypha, draft, and fair game to extend in this voice.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E30 builds Pardonlin as a town, and a dozen writers need one rule for how far the satire goes.

## R-183

**Question:** Is Pardonlin an HOA town, and who enforces its rules?
**Ruling:** No. The Continentals have rules, but they are older and politer than the HOA's, and nobody enforces them. A rule in Pardonlin is a thing that is "not done"; breaking it earns a sigh, not a fine. There are no wardens in Pardonlin's own lanes: Lupin Pardoux on Pardonlin High Street is the HOA's, lent to the Continentals (R-176), and they think his hat is short. The Jardin's clipped parterre is not the Even Cut either: it is a pattern held by its head gardener, and the HOA has no say in it. The Wickets stamp the hat and send the gnome on.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** a town of clipped hedges and queues invites a reading as an HOA enclave, and Pardonlin's difference from Turfton is the joke.

## R-184

**Question:** Where is Radio Adagio on the dial, and who can hear it?
**Ruling:** **Radio Adagio** (96.1, classical, from the Opera Hall on the Left Bank, id `radio-adagio`) is a bonus station: it is not on the dial of every car radio in the Yard, and it is not heard by tuning to it from afar. It is heard in and near Pardonlin on foot (from the Opera Hall horn speaker, the café gramophones, the bandstand and the Beetle Market's stall radio), and on any car radio while the car is in or near Pardonlin. Leave the region and the signal fades. Its conductor, Maestro Ottavio Lento (id `ottavio-lento`), is its only on-air voice. No real composers or pieces are named.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the station should feel like a place's own sound, not a fourth genre every driver always has.

## R-185

**Question:** Gnome Theft Auto builds the Saltwater (E11). How does it join the Puddle Sea, what is water-skiing to a gnome, and can you go aboard the Bathtub Queen?
**Ruling:** The Puddle Sea drains south through **the Saltcut**, a channel the tide dug through the dunes (Driftwood claims he dug it with a teaspoon; nobody has checked); boats pass from the loch all the way to the sea. The Puddle Sea stays fresh; the salt starts at the Saltcut's mouth (R-158 holds: the Saltwater is the real thing, and Driftwood was right about the "Big Puddle"). **Water-skiing** is a Saltbucket invention: two planks and a rope behind a boat, rented with tubes at **the Last Tube**, Driftwood's hut on the beach; on the open sea Driftwood tows anyone who pays. A floating **wake ramp** off the slalom is the boardwalk's favourite way to crack a gnome. **The Spokewheel** turns once every ninety-six seconds whatever anyone does; riders pay Marram three acorns and come down where they went up. **The Bathtub Queen** lies moored at the end of Long Spoon Pier, gangplank down: anyone may walk her deck and the captain's cabin is open to guests of the captain. She does sail, but only at night and never while anyone is watching (sailing is not shown in the game yet).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E11 builds the sea, the channel, the ski runtime, the wheel ride and a boardable ship, and needs names and rules that fit R-158.

## R-186

**Question:** Why is there skiing in a garden, and how does it work on Snowcap Rise?
**Ruling:** Snowdrop Slope is where gnomes ski and sled because the Tall Ones' winter left a long white bank there and gnomes never waste a bank. **The Bootlace Tow** pulls anyone up the east side: knotted bootlaces on cotton-reel pulleys, with cotton-reel handles to hang on to, and it hauls skiers and sledders alike. **The Wool Run** is the ski slalom: six blue-and-red flag gates from a timber start hut to an orange finish banner; a missed gate costs 3 seconds, and a clean run in 18 seconds or less is called "Black Diamond". **The Tea-Tray Run** is the straight sled lane down the west side; the sleds are round Tall-One tin tea trays with a painted rose, which gnomes call "rose shields". Falls are tumbles, never cracks: nobody is hurt on snow (R-021, R-049). The Woolly Sock Lodge rents skis and tea trays, sells Hot Cocoa (warming) and sells a tray to keep. Gentian Bootlace teaches the snowplough out front.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** Epic E12 builds the ski hill, and the tow, the courses and the sleds need names and one rule for what a fall is.

## R-187

**Question:** How does ice fishing work on Pail Pond, and what about the pail's handle?
**Ruling:** Anyone may drill a hole with a hand auger; the ice never cracks under anybody, and a hole refreezes when a fifth is drilled. Fish come up through a hole, are measured, carded on a nibble-clip and slipped back down: nothing is kept hungry or hurt (R-021, R-049). Thermos Theo keeps a red shanty on the ice and lends a Bent-Pin Twig Rod to anyone without one. The pond's cold-water fish are Pail Perch, Woolly Minnow, Lantern Burbot (bites at night) and Frostjaw Char (bites in falling snow; wants a Split-Cane Rod or better). The bears are paid in sardines, and an empty sardine tin sits by the holes. The giant pail's handle now sticks out of the ice at the edge, the handle of "the Rim"; gnomes found it and still do not know what it is for.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E12 adds ice fishing and the old "nobody has found the handle" joke has to be settled without ending it.

## R-188

**Question:** Where are the polar bears, and what do they do?
**Ruling:** There are nine in all. Five lounge on the Fells' sun deck, now signposted "BEAR DECK". Four are on Snowcap Rise: one asleep on Pail Pond's ice, one turning slowly in an inner tube on the ice, one fishing a hole from a stool, and one on the Lodge's porch bench with a mug of cocoa. Their call is a long contented yawn. They never speak, and nothing upsets them: a shot, a ram or a shove gets a shrug. Standing beside all nine earns the "Bear Hug" achievement.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E12 adds the four Snowcap bears and a sign for the Fells' five, and they must stay the calmest creatures in Turfton (R-040).

## R-189

**Question:** Do the Cap-water fords on the Capwood Run flood an engine?
**Ruling:** No. Cap-water, the thick slow water that seeps out of Capwood's buried Tall-One woodpile, soaks a mower's engine only a little: enough to slow it, never enough to sputter or stall. Ordinary water elsewhere still floods (the "waterlogged mowers" ruling stands). In game: `WATERLOG.fordCap`.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E14 puts two Cap-water fords on the Capwood Run, and the rally must drag without drowning anyone's mower.

## R-190

**Question:** Who is Two-Ton Teasel, and how is he related to Clary?
**Ruling:** Two-Ton Teasel is Teasel Mudguard. His family name is Mudguard; he is Marshal Clary Mudguard's older brother, a Fizz Cup racer, and he wants a rematch on the dirt (side quest Rutbottom Heats). She has never let him win a start.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E14 gives Teasel a side quest at the Dirt Bowl, and the quest needs a family tie to the Marshal.

## R-191

**Question:** What is the Knobbly, and how does a player get one?
**Ruling:** The Knobbly Dirt-Mower is a push-mower bike rebuilt for dirt by Rutbottom's mechanics: knobbly tyres, long forks, a number plate. It is sold at the dealer, and parked at the Dirt Bowl gate for anyone who signs Clary's clipboard (nobody checks the clipboard).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E14's Knobbly Heat (`race-rutbottom-knobbly`) needs a dirt bike the player can reach without the impound.

## R-192

**Question:** Why do Capwood's caps glow, and what does Section Nine cover?
**Ruling:** Capwood's caps glow faintly after dark (spores, not magic: gnomes argue about this). The brightest glow is the Great Ring, a fairy ring of toadstools round a clearing. Bruising a cap is a fine under Section Nine of the Warden's rules.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E14 lights Capwood at night and places the Great Ring, and the Warden's fines need a rule to cite.

## R-193

**Question:** How long is a yard at Hedgeworth Links, and what units does its card use?
**Ruling:** Hedgeworth is measured in gnome yards, half a Tall-One yard (0.5 m). Every distance on its card, its signs and the pro's advice is in gnome yards, and a good drive goes about 200 of them.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E15 plays Gnome Golf's real ball flight in a yard 360 by 420 m, so the course has to be measured in units a gnome can walk.

## R-194
**Question:** How many holes does Hedgeworth Links have, and why does the card say nine?
**Ruling:** Hedgeworth Links has four holes, numbered 1, 2, 3 and 9 on the card: The Mortgage (par 4), Vesper's Patience (par 3), The Long Week (par 5, Hosepipe Pond on the dogleg) and The Ninth (par 4, by Thrift's shed and the Kicked Board). Peony numbers them so because "a nine-hole course" reads better on the mortgage papers, and everyone calls the course nine holes, including the scorecard's heading. Course par 16.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the brief's lore said nine holes; E15 built four on the land there is, and the joke keeps both.

## R-195
**Question:** How does a gnome get into Hedgeworth, what is the Members' Gate, and what happens to a ball lost in the pond?
**Ruling:** The only public way into Hedgeworth is the Kicked Board, a loose board in the neighbour's fence on the side facing the road, which a mower or a kick breaks through and which stays broken (Thrift has stopped propping it shut). The Members' Gate beside the cart path is always locked; its plaque says MEMBERS ONLY and nobody living has the key. Balls lost in Hosepipe Pond are fetched by the pond mower, a paddling mower that is Hedgeworth's cousin of Gnome Golf's sea mower; a lost ball costs a stroke and is played again from where it was struck.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E15 builds the fence, the gate and the water hazard, and each needs one rule for how it is entered or lost.

## R-196

**Question:** What does the Acorn Diner serve, and why is the stew "grub-free"?
**Ruling:** The diner serves eight dishes (see `acorn-diner-menu`). The stew is grub-free: it is, and nobody asks. The capitals in "Grub-Free Root Stew" are a reassurance, not a joke.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E24's chef job needs a fixed menu, and the stew's name invites a gag the diner never makes.

## R-197
**Question:** Who customises client mowers at Pay 'n' Glaze, and how are they paid?
**Ruling:** A mechanic does it, paid per car by the shop. The client pays for parts, within the budget on their work order. The "Signature Series" loyalty re-stamp still applies to every job.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E24's mechanic job needs to say where the pay and the parts money come from.

## R-198
**Question:** How does comedy work in Pardonlin?
**Ruling:** Le Petit Groan's audience grades rather than laughs. Heckling is a recognised art. Tomatoes are thrown underarm only, by custom.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E24's comedy job needs a room that reacts without ever laughing.

## R-199

**Question:** How is Rootwell University laid out as built, and what can a gnome enter?
**Ruling:** The twelve buildings stand round a quad lawn, with the founder's statue at its centre: a bronze gnome holding out a plumb bob. North: the Long Shelf (library) and Plumbob Hall (flat roof with a helipad; a plumb bob hangs under the clock tower's arch). South: Tilth Hall (lectures; its roof can be walked, by stairs from inside) and the Crucible Block (labs). East: the Trencher (refectory; the sugar store is behind it), the Cold Frame Club and the Cloche (glasshouse). Further out: Bedstraw House, Bodger's Shed, the Heap Barn, Wicket Lodge on the drive, the Clod (a small pitch between two grandstands) and the Dean's lodge, which faces the quad. The Long Shelf, the Crucible Block and Tilth Hall can be entered; the rest are looked at. Students walk the quad and the university bell rings. Everything is built at gnome scale from stone, clay brick and slate.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E13 builds the campus, and the layout, the statue and which doors open need one answer.

## R-200
**Question:** What is the Anthill as built, who lives in it, and what is Dean's Leap?
**Ruling:** The Anthill is a 45 m mound with earth-coloured flanks and a flattened summit under a gravel forecourt, with the Anthill Observatory on top. A dirt road spirals up from the east-band road. Three round wooden ant doors stand at the foot (north, east, south). The ants are only ever seen singly or in lines, each carrying a sugar cube, and they never speak; a shut door means the rent is late. **Dean's Leap** is a wedge ramp on the north rim of the summit that throws a car north toward the campus. Nobody remembers who cut it; the Dean says it was a wheelchair ramp for a very ambitious professor. Landing it earns "Not Termites".
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E13 builds the mound, its doors and the ramp, and the ants must stay silent landlords (R-159).

## R-201
**Question:** What is Rootwell Field as built, and how can there be four aircraft when the department has one working plane?
**Ruling:** The Field has a 420 m north-south runway with edge lights lit at night, an apron, a pad, a hangar, the "very small tower" (a brick stalk with a glazed cab) and an orange-and-white windsock. On the apron stand two Crop Dusters, a Hedge-Hopper and a Sycamore Copter. The department owns one airworthy plane on paper, the Hedge-Hopper; the other three are "on loan from Wally" and are the four students' coursework, which Wally would like back. The Hedge-Hopper flies circuits from the Field ("Rootwell Aeronautics Circuit"), and Wally's Charters sometimes fly a visiting professor in. Landing on the runway earns "Touch and Go".
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E13 puts four aircraft on the apron against the older "one working plane and four students" joke, which should survive.

## R-202
**Question:** How is Pinwheel Ridge built: how many pinwheels, what colours, and who lives there?
**Ruling:** Ten giant garden pinwheels, numbered 1 to 10 from west to east, stand 30 m apart along the crest, coloured red, yellow and blue in turn. Each is on a white-and-red mast with a ladder and always turns, facing south. Ragwort Coilspring keeps a control hut on the north flank below the crest, with a substation beside it, and a gravel service track runs up from the north-band-east road. They power lamps and neon, never engines (R-160). Flying along the ridge between them earns "Windfall".
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E13 builds the ridge and its count, order and colours need to be fixed for the quests and the achievement.

## R-203

**Question:** Who enforces the Unmown's rules, and what can the HOA do there?
**Ruling:** Nobody. The Unmown's rules (no mowing, no thinking about mowing, hats off to the herons) are kept by politeness alone; the rangers ask, they never fine or arrest. The HOA may visit on Tuesdays but may not enjoy it, and may look but not measure: an inspector in the preserve is "off duty" with a personal ruler. Hats the HOA leaves behind go in the lost-hat box at the Ranger Station.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E31's Unmown station, rangers and Mr. Pettigrew needed one rule for how the preserve is policed.

## R-204
**Question:** Who settled Espalier End, Mittenholt and Dunelow, and what makes them gnome places?
**Ruling:** The outer hamlets were settled by gnomes who left Turfton for quieter lawns. Each keeps one odd custom (Espalier End its topiary judging, Mittenholt its left mittens, Dunelow its gull-judged sandcastles), a timetable that does not commit, and the same sign, "Twinned with nowhere, by request". Buses, in all three, exist in principle.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E31's three hamlets and the High Tarn needed a shared origin and a running joke.

## R-205
**Question:** Do the new E31 birds count toward the life list?
**Ruling:** Yes. The Reedmere Bittern, Marsh Harrier, Meadow Cuckoo, Thymes Kingfisher, Pond Mallard, Shore Cormorant, Snowcap Eagle and High Tarn Diver are ordinary species of the birding life list, ticked the same way as any other, and the Unmown checklist reads the same list. The Fresh Feathers achievement counts five of them.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the birds had to be either list birds or a separate system; one list is simpler.

## R-206
**Question:** What happens when a gnome bumps the new small wildlife (hare, hedgehog, fox, frog, dragonfly)?
**Ruling:** R-021 applies to them as to every creature: nothing dies. A creature that is knocked over or run into tumbles, gets up and carries on, with the usual indignation.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** keeps the preserve's animals within the no-gore rule.

## R-207

**Question:** Where does Turfton's rubbish go, and who collects it?
**Ruling:** Bin crews from the Turfton Bin Depot collect it by lorry and tip it into the Compost Heap. Spills are an HOA offence, fined against the crew's pay.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E25's garbage job needs a destination for the load and a reason neatness is pay.

## R-208
**Question:** Who fights fires in Turfton?
**Ruling:** A volunteer brigade from Fire Station No. 1. Clay gnomes fear fire less than falls, but sheds and toadstools burn. Water comes from kerb hydrants.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E25's firefighter job needs a crew, a stake and a water source.

## R-209
**Question:** What is Gnomazon in Gnome Theft Auto?
**Ruling:** A parody parcel company with one fulfilment centre, FC-1. Its manager-bots are earnest, not sinister. Associates are paid per parcel, with no tips.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E25's warehouse job needs a company that satirises warehouse work without being cruel.

## R-210

**Question:** Where are the Thorne Even-Estates sites as built, and what is on each?
**Ruling:** Three Levelright sites stand at the edge of Turfton: Plot 1 at (-295, -120) on the west fringe by Mossy Wood (Chard's caravan is here, and the night-shift side quest starts at its gate), Plot 2 at (195, 325) on the south-east fringe by Route South, and Plot 3 at (1050, 250) out in Rootwell. Each has pale-blue-and-beige hoardings with the gate facing the nearest road, a row of identical empty beige show-homes (three; four at Plot 3), one half-built house of mushroom-stem girders in scaffolding, a bucket crane (Levelright's tower crane lifts with a garden bucket) painted "Level Is Kind", a materials yard, a site caravan and crews in acorn-cap hard hats walking a loop. The show-homes are identical and empty on purpose: the sites are built to be seen, a house a day, and nobody moves in. This replaces the older "north-west, south-east and south fringe" and "built by E01" wording.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E16 builds the sites, and their places, count and contents need one answer.

## R-211
**Question:** How are Trellisdown Vineyard and Brassknock Manor laid out as built, and is Chicory a he or a she?
**Ruling:** The vineyard covers the hill at (-1140, -170), x -1290..-990, z -280..-60: rows run east-west with a path up the middle, the gate is on the south edge at (-1140, -61) facing vineyard-lane, Chicory's lodge is just inside at (-1172, -78), the press-house stands at (-1105, -95) with the first vine on its west wall, frost-pots stand among the rows and the crooked row is at z -205, east of the path. The manor lies across vineyard-lane to the south, x -1210..-1090, z -10..90: gate on the north wall at (-1150, -9), a gravel drive and a fountain, then the house (46 x 18 m, centre (-1150, 31)) facing north so its raised terrace looks over the vines. It has seven chimneys and a front door with the great brass knocker, which nobody answers. The way in is the back door on the south side, into the tasting hall, where Footman Pell stands. A row of rooms is shut and the ledger room is locked. Gardens lie behind. Chicory Snips is "he" everywhere; the vineyard entry's one "she" was a slip.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E16 builds both places, which replaces the rough coordinates in the old entries, and the pronoun needed settling.

## R-212
**Question:** What are the red deer and hill goats, and are they pests or quarry?
**Ruling:** Both, and it is one animal. Herds of red deer (a stag, hinds and a fawn) graze the empty country of Trellisdown, Snowcap Rise, Loch Moss, Cloverfield and Rootwell, and bolt from gnomes, mowers and gunshots. Hill goats do the same on Snowcap Rise and the Fells' north flank. The Trellisdown Red Deer is also a Tuft & Tally quarry west of the vineyard (tuft: red-deer winter tuft; keepsake: a shed antler tine). A knocked-over deer gets up offended and leaves. Nothing dies (R-021, R-049).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E16 puts herds in the countryside and the Lodge already lists a deer quarry; they must be the same animals.

## R-213
**Question:** How does a gnome buy Windfall Croft, what grows there, and why does an oak that drops acorns not break Turfton's money?
**Ruling:** The croft (x 60..140, z 505..565 in Cloverfield, gate on the west side by the south road) is bought at the For Sale board or in the Ledger app for 2,200 Acorns: 300 down, and the rest as a loan from the First Kiln Bank beside the Kiln-Debt (R-169), 10% on top. It has eight beds (radishes, carrots, cabbages, pumpkins), a seed rack, a stall by the gate, a run-down farmhouse and barn, and an orchard on the south wall whose apples keep rolling over it. An oak planted on the oak spot takes about forty minutes to grow and then gives a shake of acorns every ten minutes. Acorns from your own tree are honest acorns: nobody mints them. The HOA has a form for it, which nobody has found. Farmer Bramble knows who holds the deed (side quest `sq-windfall-croft-deed`).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E16 builds the farm, and a tree that makes the currency needed an in-world answer.

## R-214
**Question:** Who owns the hunters' camps in the empty country, and why is there a tin of acorns at each?
**Ruling:** About 26 small camps stand in the empty country of every outer region: tents, shared camps round a fire, shacks, deer stands, duck blinds on loch and coast shores and tuft-drying racks, some with a hunter asleep by the fire. They belong to Tuft & Tally licence holders (Hazel Mattock's lodge, R-141). By custom each leaves a tin of acorns or a snack for the next walker, and fills it again later. Nobody takes the tin for more than one pass, and nobody has been told to.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E16 scatters camps across the map, and who they belong to and why they give things away needed one answer.

## R-215

**Question:** How big is Drainpipe Court?
**Ruling:** It plays by Gnomerena rules (GBA GJAM: two on two, twos and threes, turbo, shoves) on a court sized for street gnomes: the Gnomerena's court and hoop scaled by four fifths, so the rim is 2.44 m for a 1 m gnome (the Gnomerena's gnomes are a quarter bigger). Both hoops are drainpipe hoops with no net. Pickup games go to 11; a grudge match goes to 7.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the game reuses GBA GJAM's simulation and keeps its proportions.

## R-216
**Question:** What is a skateboard in Turfton?
**Ruling:** A wooden deck on four wheels, ridden standing, on anything paved; grass stops it. It is slower than any mower and has no place in traffic law (the Hat Watch pretends it is not there, as at Kilnside Rec's old skate corner, which stays). Spare boards live in the Board Library at the Gutter Bowls: take one, leave one.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** the board is ridable anywhere without becoming a vehicle class.

## R-217
**Question:** Are skate tricks the same in Turfton as in the Aether?
**Ruling:** The names and the scoring of tricks (ollie, kickflip, grabs, grinds, combos) are the same everywhere gnomes ride boards. Nothing else connects the Gutter Bowls to the Aether or its Splash-Back Skaters.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** Gnome Theft Auto shares Aether Board's trick tables and scoring.

## R-218

**Question:** What are the Burrowfolk like, and who gets them wrong?
**Ruling:** The Burrowfolk are small (about knee-high to a gnome), gentle and misread. Gnomes treat them as pests and the Tall Ones blame them for lumps; neither is at home in Loamdeep. Moles wear no hats, except DJ Moleman's antenna hat. They say "if it pleases you" and mean it.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E17 builds Loamdeep and needs one consistent mole.

## R-219
**Question:** How is Loamdeep laid out, and what do the moles pay?
**Ruling:** Loamdeep is one big hall-and-tunnel interior under the Burrow Door, with six halls: the Mother's Hall, Rootway Hall, Lamplight Hall, Postern Hall, Hearth Hall and Under-Chorus Hall. The mole jobs (Root Run, Lamplighter, Post Sorting, Dig a Nook) pay in Acorns that the Burrowfolk find in the soil.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E17 needs the halls and the pay fixed for the jobs and quests.

## R-220
**Question:** What does DJ Moleman look like in Gnome Theft Auto, and does he ever visit Loamdeep?
**Ruling:** A mole in no costume: an antenna with a trilby on top, headphones round his neck. After the quest `sq-loamdeep-under-chorus` he comes up the Long Tunnel from his own burrow and plays the Under-Chorus, so the family's wish that he would visit comes true. His transmitter stays unexplained.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E17 puts Moleman on screen for the first time and needs his look and his visit settled.

## R-221
**Question:** How is Wader's Rest laid out?
**Ruling:** The Standing Lady faces west on her sand mound; the big tent faces her across the ritual circle. Everything in the camp is grey, because pink is for her only, so her likeness on the shrine inside the tent is white. Nobody turns their back on her to eat.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E17 builds the camp and needs one layout and one colour rule.

## R-222
**Question:** Where does the Underspan stop, and what is the Roost?
**Ruling:** The Underspan stays inside its site beside the Unfinished Span and never goes under the deck. The Roost, a scaffold deck above it, is the only way "up", and it is not allowed (the HOA cites it as "unauthorised verticality"). The Chute is the way back down.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E17 builds the Underspan and its Updraft and needs its limits fixed.

## R-223

**Question:** Is street racing legal in Turfton, and what does the Hat Watch do about it?
**Ruling:** It is not legal and not quite illegal. The Hat Watch notices the meets and rarely chases: the Skyway Foot has been officially told it is a car boot sale. A race through live traffic can still draw a wanted star if the driver is careless. Pardonlin's Boucle is the exception: a licensed closed-road event under Commissaire Aurelie Fonce, with no Watch interest at all. The HOA files street racing as "Verge Activity, miscellaneous". The questline's rival is Sable Throttlewick, whose brother's lowrider the Watch impounded; her record arc ends on the Ring Road.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E26 puts racing on real roads and the games need one answer for how much heat it draws.

## R-224
**Question:** How do wagers work at the street-race meets?
**Ruling:** Each meet has a bookie who takes wagers in Acorns on a pickup race: 25, 100 or 250, or a friendly for nothing. A winner is paid twice the stake and a loser forfeits it. Nobody takes IOUs. Tuppence Pomfret keeps the Skyway Foot's book, Monsieur Bastien Pipette Pardonlin's (a "small envelope"), and Shingle Nan Trimm the Saltbucket lay-by's (a bucket, from a deckchair).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E26's pickup races need one rule for stakes, with a voice per meet.

## R-225
**Question:** Where is the Carburettors' night meet, and who runs it?
**Ruling:** The Skyway Foot, at the west foot of the Turfton Skyway, run by Ratchet Gaskin for the Carburettors. It is quiet by day and full after dark. Lugnut Lulu, their captain, may turn up there; the night race in #5 `m05-sweepers-wages` stages at the Skyway Foot. The Ring Road time trials stay the Carburettors' illicit run (the-carburettors).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E20's m05 needs a place for the Carburettors' night meet, and E26 builds it.

## R-226

**Question:** How many holes does Hedgeworth Links have now, and where are 4 to 8?
**Ruling:** Nine. Holes 4 to 8, promised by Dame Peony every season for as long as anyone has been a member, are built in the Bottom Garden, the Tall One's old bottom garden south of the old south fence, through the Turn Gate: 4 Peony's Promise (par 4, the opening ribbon still strung across the green), 5 The Maze (par 4, the old hedge maze clipped into a hole), 6 The Drip (par 3, a carry over the overflow pool and its giant birdbath), 7 The Potting Shed (par 3, teed off the shed roof) and 8 The Rhubarb Patch (par 4, a dogleg round the vegetable patch). Course par 34. R-194 stands as history: the card said nine for years and the course had four. Play order is 1 to 9, and 9, The Ninth, is still by Thrift's shed. Thrift laid the new holes out by hand over three seasons; Peony named them, Basil Divot none.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E32 builds the missing holes, and the joke that the card was right all along needed an answer that keeps R-194.

## R-227

**Question:** What is the Dewdrop, and can anyone buy one?
**Ruling:** The Dewdrop is Hogweed Sprocket's clear rolling ball, ridden from a seat that stays upright inside. It is an
Underspan prototype, not a dealer vehicle: a gnome gets one only by finishing Hogweed's three Dewdrop jobs, and a
replacement is sold only at his workshop (400 Acorns), with a handwritten ownership form. The HOA has no category for it
and cites it, when it cites it at all, as "unauthorised roundness".
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E18 adds the bubble-mobile (L54) and needs where it comes from and who sells it fixed.

## R-228
**Question:** How does Turfton change as the story moves, who tells the town, and who hands out the hobby stamps?
**Ruling:** Changes after a run of story events are public and stay: signs go up, notices come down, a roof is mended, a
bay is boarded. Each one is reported once in a Turfton FM news bulletin, in the station's dry voice. Changes follow
what the crew has done, not the calendar; nothing reverts except Side-Valve's seizure, which ends with the finale. The
hobby teachers (Wenna Gudgeon, Hazel Mattock, Dunnock Pell) hand out their own Newcomers' Card stamps at their counters;
Mabel sends newcomers to them.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E18 builds the world changes (L68) and moves the hobby intros (L66) to the teachers.

## R-229
**Question:** The act I-II story (E20) puts places and habits on screen the lore has not fixed. Where does the Tattler work now that Founders' Green took its block, where is the parade office, what do the Skyway night meets, the Heap's convoys and Cass's tab mean, and what of the Vance siblings' photograph?
**Ruling:** Hedda Galley runs the Turfton Tattler from a street desk on the Kiln-Shield kerb at the north gate of Founders' Green; the old Tattler tower lost its block to the Green and was never rebuilt, and Hedda says a desk you can see is harder to sue. The parade office is a booth behind City Hall on the z = -120 road, where the Boot float waits between parades. The Carburettors' night meets gather at the west foot of the Skyway, under the Unfinished Span. The Compost Heap's plate convoys leave by the Ring Road north toward the snow line and Mittenholt; a bill of lading names one place and never the route. Chrome-Knuckle Cass never gives a gift: she runs tabs, and a gnome on her tab is repaired free at Pay 'n' Glaze. Tansy owes Sage Ladle forty breakfasts and settles debts with her by lending out help. The photograph in townhouse 404 shows Juniper and Reginald at ten and eight, signed "J. and R."; it is never a joke.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E20 builds story rows 1-35 (L84, L95, L106) and the writers needed these facts fixed. E21/E22 may take R-230 on.

## R-230

**Question:** Where is Snowcap Rise's real high ground, and what is it called?
**Ruling:** The Hatbrim, a short range on the north edge between Mittenholt and the High Tarn. Seen from Mittenholt it looks like a hat left on the fence: Old Pate (a bald dome, about 72 m) is the crown's near side, Brim Gap (about 40 m) the dent, and the Bobble (about 105 m) the bobble on top: the highest point in the yard, higher than Snowdrop Slope's mountain (about 85 m). Snow lies on it above about 32 m all year.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E33 needs a range for the mountain routes, and the lore calls the Rise "the high country" without a peak.

## R-231
**Question:** Who made the Hatbrim's routes, and who may use them?
**Ruling:** The Brim Gap Road (cars, two-way, seven or so numbered hairpins) was built by the HOA's Highways Sub-Committee "to plough it", which it has never done. The Hatband is an old goat shelf round the Bobble, bikes and buggies only, kept that way by bollards rather than by the sign. The Brim Walk is waymarked by cairns and nobody owns it. The Spine Cut was blasted through the Highland Spine for the Pinwheel Ridge works, and the Keyhole, a rock arch over the road, was left standing because the surveyor "had not finished measuring it". The Summit Register on the Bobble has been kept since before the HOA, and signing it is a rite: "you were here, and so was your hat".
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E33 builds them and the dressing needs one story.

## R-232
**Question:** Who keeps the Top Hat, and who is the gnome at the Keyhole?
**Ruling:** **Velma Crown** keeps the Top Hat, the café at Brim Gap whose roof is a giant black top hat; she serves Gap Tea and Hairpin Buns and counts every car that stops ("Cars today: 3. Buns: 41."). **Plumb Bob** is the surveyor at the Keyhole, who has measured the arch every day for years, waiting to be sure, and has never been sure.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-25.
**Why:** E33 puts them on screen.

## R-233

**Question:** The act III story (E21) dates two things and names people and habits at the far edges. When is the Grand Combine's test, and when the Even Cut? Who are the Carburettors who stayed, and what do the Fells, Capwood, the coast and Rootwell add?
**Ruling:** The Combine tests its deck at Hedgeworth on the night of the backers' gala (the Flock know it and Mother Saxifrage gives it); the Even Cut itself is on the longest day, and Vesper names it over every loudspeaker in Turfton that same night. Most of the Carburettors signed the HOA charter for the free tyres; the three who stayed with Lugnut Lulu are Big-End Bertha, Dipstick Dunstan and Fanbelt Fennimore. Warden Chanterelle Stook fines eleven acorns a bruised cap, and the Great Ring is what Capwood calls its clearing. The salt-plows that hunt the crew north are HOA vans with blades. Driftwood and the crew talk by tin-can phone; the three HOA barges are black watering-can steamers sailing bow west in convoy, and Captain Samphire Bilge holds that everything on the Bathtub Queen is a lie except the smuggling. Rootwell's ants are its landlords and are paid in sugar; Dean Lovage Inkwell signed the HOA work order that took Professor Sextant's lens, chalked "B. Sextant" on its ring. The HOA's linemen and marshals (Pumice, Grit and Lime at the test) are hired by the day. Tansy's scroll says only that Vesper builds the Combine in parts at the edges and the crew must find friends there; the Dust Flats are named later, by Tansy's ridge call. Elder Bracken lends the Stopping Stone and does not give it.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-26.
**Why:** E21 builds story rows 36-53 (L45, L83, L84, L95) and the writers needed these facts fixed; the outline gave the test and the Even Cut the same day. E33 may take a number in parallel; renumber at merge.

## R-234

**Question:** Act IV (E22, rows 54-70) has to put the second expansion in play: Pardonlin, the Unmown and the Hatbrim. Where do they come into the story, and what does the crew get for keeps?
**Ruling:** Three changes to the outline. (1) Row 63, Four Taps: when the Don names his price, Mayor Barnaby "Two-Coat" Mulch is not at his residence but at a terrace table of Café Pardon in Pardonlin, where no HOA letter can be served past the Wickets (R-183); his second coat is drying in the continental sun and Hector Disdain has not taken his order in three days. The player drives him from Pardonlin to the Mulch Club. (2) Row 65, The Countess Relents: the Countess's first vine goes to the Unmown, the one corner no mower goes (R-174), not to Granny's greenhouse; Head Ranger Burdock Haybright takes it in at the Ranger Station and writes it in the book. Chicory Snips still loads it and waters it. (3) Row 64 part 2, By Air: the coalition's signal for the longest day is a beacon on the Bobble, the Hatbrim's summit, because it is the highest ground in the yard and the only range the HOA never named (see the hatbrim entry); Wally flies the Crop Duster up to it and Hogweed builds the fire, and it is lit at dawn on the day of the Even Cut. Also: after Runway Flares, Wind-Sock Wally signs Hangar Two over to the crew and the Crop Duster is the crew's plane; Marshal Clary signs the impounded Knobbly over after the Rutbottom impound (row 42).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-26.
**Why:** E22 builds story rows 54-70 and must use every place the batch built (the brief: "the whole world in play"); the outline was written before the second expansion existed.

## R-235

**Question:** The final lore pass (E22, L86) read every batch-3 person and place against the character bible and the game. Which contradictions did it settle, and what new canon did it fix?
**Ruling:** (1) **Vesper Thorne is "he"** in every lore entry and game line, as in the character bible; the older "she" lines were slips (fixed in his entry and in the patio-gallery and route-south-acorn-diner entries). (2) **For a Gnome Theft Auto person, the character bible wins over a lore entry** unless canon or a ruling says otherwise, and the game's CAST preset is what players see for a look: Juniper and Reginald Vance are dearest enemies, not estranged; Turncoat Cam wears the pale cap of his preset; Lugnut Lulu wears an orange hat and a black dress. (3) **Same-name gnomes are separate people** throughout the apocrypha: Dr Clod Furrow and Dr Cress of Rootwell are not Cress Caliper; Pip Tussock (junior ranger) and Pip Pearsley are not Pip Potsworth; Dunstan Cairn is not Dipstick Dunstan; Cass Pedal is not Chrome-Knuckle Cass; the Speedway's Burdock is not Head Ranger Burdock Haybright. "Two-Ton Teasel" is Teasel Mudguard, Clary's brother (R-190). Big-End Bertha, Dipstick Dunstan and Fanbelt Fennimore have no surnames. (4) **The code's numbers are canon:** Hangar Two costs 1800 acorns and the Mossbank Boathouse 1200; the Sling-Lift costs 70 for a mower, 140 for an aircraft and 100 for a boat; there are 26 hunters' camps (the Thermos Stand is a deer stand, Damp Socks Camp a tent); the Rutbottom Dirt Bowl's corners and jumps have the names in the code. (5) **The Burrowfolk are five families**, each with a hall and a job: the Tumblesoils (the Mother's Hall: they keep Loamdeep), the Tamps (Rootway: roots), the Delves (Lamplight: lamps), the Sifts (Postern: the post) and the Crumbs (Hearth: supper and digging); the Under-Chorus Hall belongs to nobody. DJ Moleman is a Crumb, Nubbin a Sift, Pim and Pod are Delves. (6) **The Flock** keep the rule of no sitting on Tuesdays; Sister Rail's "sitting is for Tuesday" is her own inversion, kept because she never sits. (7) **The coalition** is the Coalition of All Hats; its flag is a patchwork of every faction's cap colour; at the overlook camp the Flock's one pink tent is the Standing Lady's tent for the day. (8) **The Even Line** is a level line computed at the Anthill with Professor Sextant's lens; it enters Turfton on the meridian and crosses the Countess's first vine. (9) **Act IV facts the quests fixed:** Reeve Yarrow's hay barn stands at the south of Pebblewick (706, 34) and hides the Whirligig; Wind-Sock Wally's caravan stands on the Desert Airfield apron (466, -76); the HOA logged Diggs's medal (a tin star on a green ribbon) as lost property, and he stayed at Fort Sandpit in case the garden's makers came back; the Don's fifth tap means yes; Café Pardon's gramophone plays Radio Adagio; the Grand Combine sleeps the night before the Even Cut in the Compost Heap's yard and its line runs through the Even-Estates. (10) The Compost Heap is in Turfton's fringe (R-072's "Mossy Wood" forge is the Heap's old name for its back lot).
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-27.
**Why:** L86 asked for a final pass over the extended world's lore; the pass found these contradictions between entries, the bible and the code, and the act IV writers fixed these facts.

## R-236

**Question:** The menial-lore pass (E22, L86 part 2) wrote the everyday life of the extended world: prices, menus, habits and small history. Which of its inventions are canon?
**Ruling:** The `## Everyday` sections and the everyday entries written in this pass (e.g. the-boardwalk-stalls, brigitte-levains-bakery, wallys-caravan, lost-property-shed, pebblewick-town-bell, reeves-minutes) are canon for the apocrypha where no code contradicts them; where a sign or price exists in the game, the game wins. Fixed in particular: Bodega & Sons sells Acorn-Cola at 3 acorns (lukewarm), Dandelion Fizz at 2 and spark plugs at 4; the Gnomecino's chips are 5, 25 and 100. The Even-Estates show-homes are sold as "Even", "Evener" and "Evenest" and are the same house. Rootwell's ants are paid their rent in sugar on the last day of the month, counted at the Anthill's north door; a late month is called "the ants have closed the library". Warden Chanterelle fines 11 acorns a bruised cap and 4 a licked one, either payable with a sincere apology, and cites rules by number only. The Rutbottom "impound" is the pits, where the HOA tapes rides in place; only Marshal Clary's flag releases them. The HOA lost-property shed outside Fort Sandpit's gate (about (398, 58)) is kept by Clerk Rubric and Clerk Docket. The Pebblewick bell is tin, cast from seed-tin lids, and rings once a day for news and once for any water that arrives; Reeve Yarrow's minutes run to 41 volumes, every sitting headed "Present: the town." At the coalition camp moles hang a digging helmet on the hat rail (moles wear no hats), Hogweed his welding goggles and Granny her garden straw hat; Nubbin is a Corporal of the Spade Guard since row 60.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-27.
**Why:** L86 asked for menial lore for the extended world; the writers needed these details fixed so later text agrees with them.

## R-237

**Question:** The stunt ramps were all one black-and-cyan kit (D21). What does each ramp look like, and what do its signs say?
**Ruling:** Each ramp is built from its place: the Turfton Park Fountain Vault in Gnorwin Clayfoot Park is timber with a turf top, and the council has put a sign beside it that reads "NO RAMPING (PLEASE)"; Dean's Leap is old planks over packed earth, with a faded painted wheelchair symbol on the slope (the Dean's story that it was a wheelchair ramp for a very ambitious professor) and a brass plate reading "DONATED BY THE CLASS OF ——" (the year was never engraved); the desert, wood and farm ramps are packed earth with tyre piles; the city ramps are painted plywood on steel, the Clay-Mart ramp is the shop's steel loading ramp, and the Frostbite Ice Ridge is packed snow on timber. Every ramp carries a painted white lip line and yellow chevrons. The cyan glow is not on any ramp: it is only the ring the player sees while a stunt is under way.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-27.
**Why:** FX04 (D21) dressed the ramps to their places; the signs' words and the ramps' materials are small facts the lore should agree with.
