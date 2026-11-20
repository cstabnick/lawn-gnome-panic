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

## R-017

**Question:** Gnome Theft Auto's gnomes now crack apart when shot, and there is no soaking or wetness any more. Does that
break the no-gore rule, R-015 or R-016?
**Ruling:** No. Gnomes are fired clay that cracks and shatters and never bleeds (R-003), so a shot gnome bursts into clay
shards and is gone; another townsgnome wanders in. A guard is glued back together at its post, and a player who loses all
their clay is *Cracked* and glued back together at the Glaze Clinic. This replaces R-015's soaking and "Washed Out"
(wetness, dripping, hands up when hit) and R-016's "a hard landing only soaks the gnome" (it now chips the gnome). Gnomes
still put their hands up and run from a speeding mower. Nothing bleeds and there is no gore.
**Applies to:** apocrypha, gnome-theft-auto.  **Date:** 2026-11-19.
**Why:** the user asked for cracking instead of soaking; R-003 already says clay cracks, so it fits the core canon.
