# E04 roadmap: story bible and world writing

Brief: [../E04-story-bible-and-world-writing.md](../E04-story-bible-and-world-writing.md). Writing only (docs and lore).
Source items: L04, L83, L84 (writing), L86 (first pass), L58 (who lives where), L67 + L68 (design).

## How it is cut

The lead writes the **spine** first ([spine.md](spine.md)): final names for every new area, the act structure, the 70
rows as a skeleton (id, title, status, giver, region, prereq, cast, premise), the six extended quests and their parts,
the cast list with ids, homes and workplaces, the world-change ids and the lore entry ids; plus the rulings R-158..R-167
and the settings row (the lore hot files). With the spine fixed, every writing issue is independent: each owns its own
output file(s). Outline acts and character sections are written to `parts/` and assembled by the lead (one file has one
owner at a time).

Creative issues run on Sonnet general-purpose agents (they set the quality of 53 new quests); mechanical fixes (lore
check failures, formatting) on `haiku-worker`. Shared rules: [_common.md](_common.md); formats:
[issues/outline-format.md](issues/outline-format.md), [issues/characters-format.md](issues/characters-format.md).

| Epic | Issues | Done when |
|---|---|---|
| E04-0 Spine (lead) | spine.md, rulings R-158..R-167, settings row | written before E04-1 starts |
| E04-1 Writing (parallel) | 01-04 outline acts I-IV; 05-07 character bible (main, side, new); 08 direction notes; 09 side-quest schedule; 10 world changes; 11-14 lore entries (south+east, north, west, Turfton) | each output exists in its format |
| E04-2 Assembly and review (lead) | assemble `story-outline.md` and `characters.md` (+ homes table) from `parts/`, fill "side quests it opens" from the schedule, review against canon and the spine, `npm run lore`, README / AGENT_INDEX links | `npm run lore` passes; 70 rows; every character has home and work; every new area has a main quest, a side quest and an entry |

## Issue files (E04-1)

| # | File | Output |
|---|---|---|
| 01 | [issues/01-outline-act-I.md](issues/01-outline-act-I.md) | `parts/outline-1.md` |
| 02 | [issues/02-outline-act-II.md](issues/02-outline-act-II.md) | `parts/outline-2.md` |
| 03 | [issues/03-outline-act-III.md](issues/03-outline-act-III.md) | `parts/outline-3.md` |
| 04 | [issues/04-outline-act-IV.md](issues/04-outline-act-IV.md) | `parts/outline-4.md` |
| 05 | [issues/05-characters-main-existing-cast.md](issues/05-characters-main-existing-cast.md) | `parts/characters-1.md` |
| 06 | [issues/06-characters-side-existing-cast.md](issues/06-characters-side-existing-cast.md) | `parts/characters-2.md` |
| 07 | [issues/07-characters-new-cast.md](issues/07-characters-new-cast.md) | `parts/characters-3.md` |
| 08 | [issues/08-direction-notes.md](issues/08-direction-notes.md) | `docs/design/gnome-theft-auto/direction/batch-3-notes.md` |
| 09 | [issues/09-side-quest-schedule.md](issues/09-side-quest-schedule.md) | `docs/design/gnome-theft-auto/side-quest-schedule.md` |
| 10 | [issues/10-world-changes.md](issues/10-world-changes.md) | `docs/design/gnome-theft-auto/world-changes.md` |
| 11 | [issues/11-lore-south-east.md](issues/11-lore-south-east.md) | 16 entries |
| 12 | [issues/12-lore-north.md](issues/12-lore-north.md) | 10 entries |
| 13 | [issues/13-lore-west.md](issues/13-lore-west.md) | 22 entries |
| 14 | [issues/14-lore-turfton.md](issues/14-lore-turfton.md) | 20 entries |

File collisions: none (each issue writes only its own outputs; the lead alone edits rulings, settings, INDEX, README,
AGENT_INDEX, and the assembled `story-outline.md` / `characters.md`). Lore check during E04-1 may report `related`
ids from the other lore issues as missing until all four finish; that is expected.

## Status

- E04-0: done (spine, rulings, settings row).
- E04-1: done (14 issues on Sonnet writers).
- E04-2: done. `parts/` assembled into `story-outline.md` and `characters.md` and removed. Review fixes: the dirt-bowl marshal renamed Clary Mudguard (a Fizz Cup racer is already "Two-Ton Teasel"); looks of existing characters matched to `src/cutscene/cast.ts`; eight tutorials and city contracts re-timed to their original beats in the schedule; pronouns aligned between bible and lore.
