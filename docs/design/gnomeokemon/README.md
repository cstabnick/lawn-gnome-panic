# Gnomokemon Snap: world and lore

**Status: draft proposal.** The first pass at the premise, regions, decor and creature behaviour of
[Gnomokemon Snap](../../../games/gnomeokemon) (`games/gnomeokemon`), written to be argued with. Temperaments are built
(`games/gnomeokemon/src/snap/temperament.ts`); the rest is mostly still lore, with the PR's code changes limited to small lore fixes to shipped text and the Dry Yard's spawns. Lore entries are `status: draft` (they can change without a ruling); the
three rulings (R-030 to R-032) settle only the conflicts with existing lore.

| File | What it answers |
|---|---|
| [origin.md](origin.md) | Why are there Gnomokemon? Where do they come from? Why is Gnome Jesus looking at me? What does the dog do? |
| [regions.md](regions.md) | Which regions do we have, keep, move, add? Their shape, decor (each item tied to a lore entry), one sad note each |
| [temperaments.md](temperaments.md) | Which Gnomokemon are docile, skittish, shy, territorial, thieves or aloof, and what each does with Bait, Pester, Flute and the dog |

## The answers in one page

1. **Why?** The Tall Ones left things behind and a lawn nobody tends keeps whatever it is given. Every Gnomokemon wants
   what it was *for*. Same animals the Crown calls pests; the Lab calls them Gnomokemon.
2. **Where from?** Three lineages (Grown, Dropped, Shaped). Each region is where a Tall One *stopped* doing something.
3. **Gnome Jesus?** (Given name Hyssop.) Grader and Gnomokedex #036. He stares because page thirty-six is his and still blank, and he is posing.
4. **The dog?** **Tag**, a Tall One's dog from the town side. His walk is the rail; every creature tolerates him; his tail sets the beat
   the Flute plays.
5. **Regions.** Nothing is cut. Desert Yard moves to the Yard (it is the Dry Yard). Reef is the Cistern wing. Kiln &
   Shed is the Stopping Road. The Greenhouse is the Lab's back lot, the Glasshouse. Frosty Birdbath is the Rime. Adopt:
   Compost Heap, Hose Run, Cloverfield Ranch.
6. **Behaviour.** Eight temperaments, all 42 species assigned. Only Territorial ones act against the player, and it never
   hurts.

## Decisions for the owner

Each is a recommendation. Merging this PR accepts R-030 to R-032 (rulings are append-only, so overturning one takes a
new ruling); the entries and docs stay drafts and can be edited freely.

- **Settings.** Snap stays in Fescue and is a bridge to the Yard (R-030, R-031). The alternative, moving it to
  `apocrypha`, loses the Fescue grounding.
- **Gnome Jesus is Snap's own** (not the Gnome Company parody). His "posing" truth is the one the Greenhouse is built
  around.
- **Desert Yard goes to the Yard.** The alternative is to cut it.
- **Mower-kin** for the Sea Mower and Minimower (R-032). The alternative is to rename them so they stop being mowers.
- **The Glasshouse is on the Lab's lot**, not on Fescue's map. If it should be Fescue's, Gnomomia's design docs have to
  agree first (R-006).
- **Tag's name and home.** "Tag", for the collar tag nobody can read; a dog of the town side, not Fescue's.
- **Hyssop.** A plant given name for Gnome Jesus, so the nickname is the only religious-sounding word in Fescue lore.

## What is not done

The only code changes are small lore fixes to shipped text and the Dry Yard's spawns (listed in
[regions.md](regions.md#9-follow-ups-for-the-game)). Everything else (renames, new rides, species, temperaments) is a
follow-up: see regions.md section 9 and [temperaments.md](temperaments.md#6-what-the-code-would-need).
