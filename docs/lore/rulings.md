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
