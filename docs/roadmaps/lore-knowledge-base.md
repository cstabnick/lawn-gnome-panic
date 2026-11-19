# Roadmap: gnome lore knowledge base

## Goal

One place every gnome game can fall back on for lore: `docs/lore/` with a short core canon, a settings registry
(Fescue, the Yard, the Tall House, ...), an append-only rulings log, one fact-sheet per named thing, and
`npm run lore` to check, index and search it. Gnomomia's design bible stays the source of truth for Fescue; the
entries summarise and point at it.

No game code changes, so there is no game build, party slice, mobile or online work in this roadmap.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (planner, direct) | `tools/lore.mjs`, `npm run lore`, `docs/lore/{README,canon,settings,rulings}.md`, 7 core entries; `npm run lore -- check` passes | direct |
| 2. Seed entries | ~100 entries across fescue, the-yard, the-tall-house, the-aether, unplaced, apocrypha; `npm run lore` passes with no errors | 5, parallel |

## Epic 2: seed entries

Every issue gets the common block below plus its own part. Collisions are avoided by ownership: issues 2.1-2.3 each
own an explicit list of ids in `entries/fescue/`; 2.4 owns `entries/the-yard/`; 2.5 owns the other four folders.
Nobody edits `docs/lore/*.md`, `tools/` or `INDEX.md` (the planner regenerates it after the epic).

~~~~text
COMMON BLOCK (pasted into every Epic 2 issue)

## Environment
- Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\sockeye (Windows, Git Bash). Run commands from the root.
- If `node` is not found: export PATH="/c/Program Files/nodejs:$PATH"
- Four other workers are writing other lore entry files at the same moment. Only create the files this issue lists.
- Never run `npm run lore` without `-- check` (it rewrites docs/lore/INDEX.md, which the planner owns).
- Docs only: no game code changes, no commits.

## The entry format (from docs/lore/README.md)
One file per thing at docs/lore/entries/<setting>/<id>.md. The folder must equal `setting`. Example:

---
id: the-mower
name: The Mower
kind: creature
tier: setting
setting: fescue
era: planting
status: canon
games: [gnomes-of-gnomomia]
aliases: [The Turning Blade, Old Rumble]
sources: [docs/design/gnomomia/history.md, docs/design/gnomomia/bestiary.md]
related: [the-shed, stopping-stone, the-last-mowing]
---

One-paragraph summary (1-3 sentences). It becomes the index line, so it must stand alone.

## What gnomes say
What people in the world believe, in their words. Keep contradictions between sources.

## The truth
Designer's truth (spoilers), only if the source has one. Omit otherwise.

## In the games
Where it appears and what players see (file, zone, quest id).

## Loose threads
What stays unanswered on purpose, only if the source says so. Omit otherwise.

Field rules (the checker enforces them):
- Frontmatter is exactly `key: value` lines; lists are `[a, b, c]` on one line. No comments, no multi-line values, no quotes needed.
- id: kebab-case, same as the file name. name: what most gnomes call it.
- kind: one of place, person, faction, creature, object, event, era, concept, term
- tier: setting | game | apocrypha (`setting` = true across the setting; `game` = only in one game; `apocrypha` only in docs/lore/entries/apocrypha/)
- setting: the folder name. status: canon (the source states it) or draft (you had to infer it; avoid).
- era (optional): planting, charters, rumbling, now, timeless
- games (optional): folder names under games/ that show it.
- aliases (optional): other names and titles. A name or alias may be used by only one entry in a setting.
- sources (required): repo-root paths that exist, e.g. docs/design/gnomomia/history.md. Every fact must come from a source you read.
- related (optional): ids only from the ID LIST in this issue or from the core ids: the-garden, gnomes, tall-ones, mowers, acorns, gnome-hats, the-players-gnome.

Writing rules:
- Copy facts, don't invent them. If the sources don't say it, leave it out. Short is good: 8-25 lines of body per entry. A fact-sheet points at its source; it does not copy the whole design.
- Plain, short sentences. No em dashes. Keep the world's words (the gnomes never say "hose" or "mower" knowing what it is; in Fescue that's "the Hose", "the Mower").
- Put spoilers ("Designer's truth" in the docs) only under "## The truth".

## Done when
- `node tools/lore.mjs check` prints no error line that names a file you created. (Errors naming other workers' files, or a `related` id from your ID LIST that another worker hasn't written yet, are expected while the epic runs. Ignore those.)
- Every file in your list exists. Report any id you could not source and left out, and any fact you found that conflicts between sources.
~~~~

~~~~text
Epic: 2 Seed entries — Issue 2.1: Fescue places
Depends on: none
[COMMON BLOCK]

## Goal
One entry per Fescue place in docs/lore/entries/fescue/, all with setting: fescue, tier: setting, games: [gnomes-of-gnomomia].

## Read first
- docs/design/gnomomia/places-and-people.md: zone sheets ("Why it's here", sad notes, sub-areas, towns)
- docs/design/gnomomia/world-map.md: layout, level bands
- docs/design/gnomomia/history.md: why places exist (three layers)
- docs/design/gnomomia/lore-rules.md: rule 1 table (what each place really is)

## Change (create exactly these files, kind: place unless noted)
fescue (the world; kind place), the-fence, mossbottom-vale, mossbottom, puddlemere, thatchford-downs, thatchford,
spinning-fountains (kind object), birdbath-keep, royal-archive, drainpipe-deeps, great-valve (kind object),
cloverfield, sodbury, hedgewood, heartwood, clippings, barkhollow, the-rockery, flintdelve, shard-mine, the-kiln,
the-hose, the-spigot, the-verge, the-shorn, last-tuft, the-shed, glaze-shrines (kind concept)
For a zone, "What gnomes say" carries its reasons from the layers and the sad note goes under its own "## Sad note" heading.
For an object the player would recognise (birdbath, hose, shed), say what it really is under "## The truth".

## ID LIST (valid `related` targets)
[FESCUE ID LIST]
~~~~

~~~~text
Epic: 2 Seed entries — Issue 2.2: Fescue people, factions and beasts
Depends on: none
[COMMON BLOCK]

## Goal
One entry per named Fescue person, faction and named beast in docs/lore/entries/fescue/, setting: fescue, tier: setting.

## Read first
- docs/design/gnomomia/places-and-people.md: NPC tables (role, want, secret, line)
- docs/design/gnomomia/history.md: kings, the Backflow, the King's Fall, designer's truths
- docs/design/gnomomia/bestiary.md: named beasts and what they want
- docs/design/gnomomia/lore-rules.md: rules 6 and 10 (pests want something; the three ideas)

## Change (create exactly these files)
kind person: gnorwin-clayfoot, moss-kiln-daughter, bartholomew-clayfoot-iii, gnorbert-clayfoot, queen-marigold,
wendel-potsworth, sedgewick, rowan-ironsod, ida-gromwell, master-gromwell, elder-fernwick, old-thistle,
bramble-the-smith, tansy-the-herbalist, captain-pip, basil-inkcap, kilnkeeper-sedum, mother-burdock
kind creature: grubthorn, dowager-mudtooth, old-gleaner, clogmaw
kind faction: kiln-born, the-crown, wildlings, ferals, order-of-the-even-cut, pipewrights, fieldwardens, hedgewrights, delvers, mole-clans
A person entry's body: summary, then "## Want", "## Secret" (put spoiler secrets under "## The truth" instead), and the sample line as a quote. A faction: which of the three ideas it holds (tend it / let it grow / cut it all).

## ID LIST (valid `related` targets)
[FESCUE ID LIST]
~~~~

~~~~text
Epic: 2 Seed entries — Issue 2.3: Fescue history, objects and ideas
Depends on: none
[COMMON BLOCK]

## Goal
Entries for Fescue's eras, events, sacred objects and big ideas in docs/lore/entries/fescue/, setting: fescue, tier: setting.

## Read first
- docs/design/gnomomia/history.md: all of it
- docs/design/gnomomia/lore-rules.md: rules 1, 4, 7, 8, 10
- docs/design/gnomomia/quests.md: the main story and the Battle of the Verge
- docs/design/gnomomia/items.md: quest items and legendaries

## Change (create exactly these files)
kind era: the-planting, the-charters, the-rumbling (each says what kind of truth it is: myth, history, memory)
kind event: the-leaving, the-last-mowing, the-charge, dry-summer, dandelion-schism, three-charters, founding-of-thatchford, first-rumble, the-backflow, kings-fall, quiet-years, battle-of-the-verge
kind creature: the-mower (aliases The Turning Blade, Old Rumble; NOT "Mower" alone is fine as name "The Mower")
kind object: stopping-stone, blade-shard, black-dew, heartspark, waking-rope, the-belly, tall-eyes, clayfoot-trowel, gnorwins-ledger, snail-carts
kind concept: three-ideas, sun-rain-bloom, cracking-and-glazing
kind term: fescue-naming (the naming rules of lore-rules.md rule 5, short)

## ID LIST (valid `related` targets)
[FESCUE ID LIST]
~~~~

~~~~text
Epic: 2 Seed entries — Issue 2.4: The Yard
Depends on: none
[COMMON BLOCK]

## Goal
Entries for the named things of the arcade games that share one back yard, in docs/lore/entries/the-yard/ (setting: the-yard). You own that folder and choose the ids.

## Read first (README first; open src only to confirm a name)
- games/lawn-prix/README.md: where the games meet (courses beside Panic yard, the Front, Island Links)
- games/sample-3d/README.md (Lawn Gnome Panic), games/gnome-front/README.md, games/gnome-golf/README.md,
  games/gnome-bowling/README.md, games/gnome-blackjack/README.md, games/gnome-party/README.md,
  games/gnomylpics/README.md, games/faster-than-lawn/README.md, games/music-room/README.md,
  games/mower-chain/package.json and docs/roadmaps/mower-chain.md

## Change
Create 15-30 entries in docs/lore/entries/the-yard/. Pick named things another game could reuse: places (the Panic
yard, Island Links, the Front's lawn landmarks, the bowling alley, the pub), factions (Red Caps, Blue Caps), named
characters (Big Lou, Granny Gnertrude, Robo-Gnome 3000, Gnome Chad, ...), named vehicles (THE COMBINE, the sea mower,
riding mowers), creatures, events (the Gnomylpics). tier: setting when 2+ yard games show it, tier: game when only one.
Rules:
- An id must not be one of: the core ids, or any id in the FESCUE ID LIST below. Prefix a clashing id (e.g. yard-...).
- "Red Caps" and "Blue Caps" are already aliases of the core entry gnome-hats, but that is setting core, so you may still name yard entries red-caps / blue-caps.
- Do not make entries for controls, scoring rules or UI. Lore only.

## ID LIST (ids you must NOT use)
[FESCUE ID LIST]
~~~~

~~~~text
Epic: 2 Seed entries — Issue 2.5: The Tall House, the Aether, unplaced games and apocrypha
Depends on: none
[COMMON BLOCK]

## Goal
Entries for the named things of the games outside Fescue and the Yard. You own these folders and choose the ids:
docs/lore/entries/the-tall-house/ (games/paragnormal), docs/lore/entries/the-aether/ (games/aether-board),
docs/lore/entries/unplaced/ (games/gnaft, games/peak-climb), docs/lore/entries/apocrypha/ (games/gnome-company).

## Read first
- games/paragnormal/README.md, then grep games/paragnormal/src for names (Gnome-Soul, ward, bell, Pet-Door, lantern)
- games/aether-board/README.md, docs/roadmaps/aether-board.md
- games/gnaft/README.md, games/peak-climb/README.md
- games/gnome-company/README.md

## Change
Create 4-10 entries per folder (fewer if the game names fewer things). Places, creatures, factions, named objects,
named characters. setting = the folder name. tier: setting for the-tall-house and the-aether, game for unplaced,
apocrypha for every file in apocrypha/. Do not make entries for controls, scoring rules or UI.
Rules:
- An id must not be one of: the core ids, or any id in the FESCUE ID LIST below. Prefix a clashing id (e.g. aether-...).
- Note where a game contradicts the core facts (gnomes are fired clay and never bleed; nobody sees the Tall Ones; no
  human on screen) and report it; don't hide it.

## ID LIST (ids you must NOT use)
[FESCUE ID LIST]
~~~~

~~~~text
FESCUE ID LIST
places (2.1): fescue, the-fence, mossbottom-vale, mossbottom, puddlemere, thatchford-downs, thatchford, spinning-fountains, birdbath-keep, royal-archive, drainpipe-deeps, great-valve, cloverfield, sodbury, hedgewood, heartwood, clippings, barkhollow, the-rockery, flintdelve, shard-mine, the-kiln, the-hose, the-spigot, the-verge, the-shorn, last-tuft, the-shed, glaze-shrines
people, factions, beasts (2.2): gnorwin-clayfoot, moss-kiln-daughter, bartholomew-clayfoot-iii, gnorbert-clayfoot, queen-marigold, wendel-potsworth, sedgewick, rowan-ironsod, ida-gromwell, master-gromwell, elder-fernwick, old-thistle, bramble-the-smith, tansy-the-herbalist, captain-pip, basil-inkcap, kilnkeeper-sedum, mother-burdock, grubthorn, dowager-mudtooth, old-gleaner, clogmaw, kiln-born, the-crown, wildlings, ferals, order-of-the-even-cut, pipewrights, fieldwardens, hedgewrights, delvers, mole-clans
history, objects, ideas (2.3): the-planting, the-charters, the-rumbling, the-leaving, the-last-mowing, the-charge, dry-summer, dandelion-schism, three-charters, founding-of-thatchford, first-rumble, the-backflow, kings-fall, quiet-years, battle-of-the-verge, the-mower, stopping-stone, blade-shard, black-dew, heartspark, waking-rope, the-belly, tall-eyes, clayfoot-trowel, gnorwins-ledger, snail-carts, three-ideas, sun-rain-bloom, cracking-and-glazing, fescue-naming
core (exists): the-garden, gnomes, tall-ones, mowers, acorns, gnome-hats, the-players-gnome
~~~~
