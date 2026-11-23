Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files).

## Goal
Lore entries for Gnome Theft Auto's four new "odd rides" (slow, impractical garden-scale vehicles that turn up in Turfton
traffic and can be stolen), and a short "Sunday Driver" note for the achievement for driving all four.

## Read first
- `docs/lore/README.md`: the entry schema (front matter fields) and tiers.
- `docs/lore/entries/apocrypha/ride-on-lowrider.md` and `docs/lore/entries/apocrypha/snail-coach.md`: two finished GTA vehicle
  entries. Copy their shape: front matter, one-line summary, a story or field-notes section, "What gnomes say", "Loose threads".
- `docs/lore/entries/apocrypha/pip-potsworth.md`: Pip fled Fescue after bolting salvaged pram wheels onto a monastery
  wheelbarrow (the Barrow Buggy's origin).
- `docs/lore/entries/apocrypha/clara-porcelain.md`, `clay-mart.md`, `patio-heights.md`, `hoa.md`, `side-valve-salvage.md`:
  skim for hooks.
- Search more with `npm run lore -- find <word>` (e.g. `teacup`, `roller`, `pot`).

## Change
Create four entries in `docs/lore/entries/apocrypha/`, each with `kind: object`, `tier: apocrypha`, `setting: apocrypha`,
`era: now`, `status: draft`, `games: [gnome-theft-auto]`, `sources: [games/gnome-theft-auto/src/config.ts]`, and `related:` ids
that exist (check each with `npm run lore -- find <id>` or by its file name). Mention the in-game numbers from the table.

| file / id | name | numbers (config.ts) | hooks |
|---|---|---|---|
| `pot-rod.md` / `pot-rod` | Pot Rod | maxSpeed 13, mass 1.6 | a cracked Clay-Mart terracotta pot on a plank chassis, painted flames, Patio Heights hot-rod scene; all flames and no speed |
| `lawn-roller.md` / `lawn-roller` | Lawn Roller | maxSpeed 7, mass 5 | a garden roller made into a tiny steamroller; the HOA's idea of keeping lawns to Code; walking pace; flattens anything |
| `teacup-trundler.md` / `teacup-trundler` | Teacup Trundler | maxSpeed 9, turnRate 3.0 | a porcelain teacup on a saucer and four casters; Clara Porcelain's crowd; spins in its own length, goes nowhere fast |
| `barrow-buggy.md` / `barrow-buggy` | Barrow Buggy | maxSpeed 11, mass 1.5 | Pip Potsworth's old monastery wheelbarrow with pram wheels, now with a two-stroke; Side-Valve Salvage sells copies |

Each entry also says, in one line, that it turns up now and then in Turfton traffic and that "Sunday Driver" is the
achievement for driving all four (its reward is the Sunday Driver's Cap). Keep each entry 15-30 lines, plain and dry, in the
voice of the existing GTA entries. Add `barrow-buggy` to the `related:` list of `pip-potsworth.md` (the only edit to an
existing entry).

## Done when
- `npm run lore` passes (it also regenerates `docs/lore/INDEX.md`; keep that change)
- `npm run lore -- find "Barrow Buggy"` lists the new entry

## Out of scope
Everything outside `docs/lore/`. Do not edit other existing entries except adding `barrow-buggy` to pip-potsworth.md `related`.
