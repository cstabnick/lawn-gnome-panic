# Storyline brief (for writers)

You are writing **one** side storyline for Gnomes of Gnomomia's first world, Fescue. It is design writing in markdown, not code.

## Read first (all in `docs/design/gnomomia/`)

1. `lore-rules.md`: **binding.** Every rule applies to you.
2. `history.md`: the three time layers and the designer's truths.
3. `places-and-people.md`: zones, towns, existing NPCs. Reuse these people. Don't rename them or change their secrets.
4. `quests.md`: the main story and existing side quests. **Don't duplicate them.** Extend them or run beside them.
5. `bestiary.md`, `items.md`, and `combat.md` §9 (enemy levels and ranks) for numbers.

## Hard rules

- Write **only** your own file, `docs/design/gnomomia/storylines/<your-file>.md`. Edit nothing else.
- **Canon wins.** Don't contradict anything in the files above. If you need a new fact, add it, and list it under "New canon" so the editor can check it.
- **Don't answer the loose threads** (lore rule 11): who the player is, who lit the Kiln, who turned the Spigot down, why the Tall Ones left, what's beyond the Fence, what's in the Mower's Belly. You may *hint*.
- Quest levels must fit the zone's level band (see `world-map.md`).
- Use only these objective types: `kill`, `collect`, `talk`, `reach`, `interact`, `escort`, `defend`, `choice`.
- New enemies give level, rank (T/N/E/MB/B/WB) and family (Soft, Shelled, Furred, Winged, Plant, Fired clay, Unfired clay, Metal). New items give ilvl, slot, type and rarity (Plain, Sprouted, Blooming, Heirloom, Kiln-fired). Kiln-fired items are **not** allowed in side storylines.
- New NPC names follow lore rule 5 (plant first names; soil, tool or household surnames).
- Tone: lore rule 9. Dry, cozy jokes, and exactly one honest sad note, played straight. No pop culture, no gore, nothing bleeds red.
- Length: 1,200-2,200 words. Plain, concrete prose. Tables for data.

## Template (use these headings, in this order)

```markdown
# <Storyline title>

**Zone:** <zone> · **Levels:** <a-b> · **Quests:** <n> · **Leans toward:** <Tend it / Let it grow / Cut it all / none>
**Unlocks after:** <main-story quest id or chapter> · **Ties to main story:** <one line>

## Pitch
Two or three sentences: what the player does and why it's worth doing.

## Roots in the three layers
- **Planting (3,000 years):** ...
- **Charters (300 years):** ...
- **Rumbling (30 years):** ...
(At least two of the three must be real, not "n/a".)

## People
| Name | New or existing | Role | Want | Secret / wound |

## Quest chain
| # | Quest | Giver | Objectives (typed, in order) | Reward (XP tier, gold, items) |
XP tier is one of: side, main, finale.

## Key scenes and dialogue
3-6 short scenes, each with 1-3 lines of NPC dialogue in quotes.

## Choices and flags
Any `choice` objective, the flag name and values, and what each value changes (here, in other zones, or at the Battle of the Verge). "None" is fine.

## New content
### Enemies
| Name | Lvl | Rank | Family | Wants | Notes |
### Items
| Name | ilvl | Slot | Type | Rarity | Effect / flavour |
### Places
New sub-areas or interactables, with where they sit in the zone.

## The sad note
One paragraph.

## New canon
A bullet list of every new fact this storyline adds to the world, for the editor to check.

## Lore checklist
Answer the 6 checklist questions from lore-rules.md, one line each.
```
