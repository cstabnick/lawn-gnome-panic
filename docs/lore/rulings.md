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

## R-019

**Question:** Where does the Fescue Field Lab stand, and how does Gnome Jesus afford it?
**Ruling:** On a big, well-kept lot of prime lawn at the edge of Fescue, where the garden meets the Yard's town: a street with
parked cars along the front, neighbours shoulder to shoulder either side and towers on the horizon. The town is built to gnome
scale and unnamed. Gnome Jesus is not broke: he owns the lot outright, has gold trim on the lab, and drives a gold car with a
halo over the roof. He is relaxed about it and makes jokes about it in his grading lines. This scenery is Field-Lab-only: it
does not change Fescue's own rulebook, and Fescue proper is still the walled back garden.
**Applies to:** fescue, gnomeokemon.  **Date:** 2026-11-19.
**Why:** the user wanted the lab to sit in an urban setting on expensive land; making Gnome Jesus wealthy explains it.
