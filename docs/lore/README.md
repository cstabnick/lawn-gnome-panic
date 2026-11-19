# Gnome lore

The knowledge base for every gnome game in this repo. When a game needs a name, a line of dialogue, an item, a reason
for something, or an answer to "would a gnome do that?", look here first. Not every game has to use the deep lore of
Gnomomia, but every game can fall back on this when it has a question.

| File | What |
|---|---|
| [README.md](README.md) | This page: how to answer a lore question, the tiers, the entry schema |
| [canon.md](canon.md) | **The core.** What is true about gnomes in every game, plus the house style for writing them |
| [settings.md](settings.md) | Every setting (Fescue, the Yard, ...), which games live in it, and where it departs from the core |
| [rulings.md](rulings.md) | Decisions on questions the entries didn't answer. Append-only. |
| [INDEX.md](INDEX.md) | Generated list of every entry. Don't edit; run `npm run lore` |
| `entries/<setting>/<id>.md` | One fact-sheet per place, person, faction, creature, object, event, era, concept or term |

## Answering a lore question

1. **Search.** `npm run lore -- find <word>` matches names and aliases first, then entry text.
2. **Read upward from the narrowest tier.** For a question in game X: X's own entries (tier `game`), then its setting
   (tier `setting`, listed in [settings.md](settings.md)), then the core ([canon.md](canon.md) and `entries/core/`).
   The narrower tier wins; that is how a setting gets to bend the core.
3. **Check the rulings.** [rulings.md](rulings.md) holds questions someone already decided.
4. **Still nothing? Decide, then write it down.** Pick the answer that best fits [canon.md](canon.md)'s house style and
   the setting's own rules, then either add an entry (if it is a thing) or a ruling (if it is a decision). An answer
   that only lives in one game's code is lost to the next game.

When the lore and a game's code disagree, the code is what players see: fix whichever is wrong, and if it's the lore,
say so in a ruling.

## Tiers

| Tier | True in | Example | Can contradict |
|---|---|---|---|
| `core` | every gnome game, unless its setting says otherwise | Gnomes are fired clay. Nobody ever sees the Tall Ones. | nothing |
| `setting` | every game in one setting | In Fescue, the Mower is the only machine that runs by itself. | the core, if [settings.md](settings.md) lists the departure |
| `game` | one game | Gnome Bowling's CPU bowler Big Lou | its setting, sparingly |
| `apocrypha` | a parody or a one-off; never feeds back into the core | Gnome Company's Omnipresent Gnome Jesus | anything |

A `setting`-tier fact is not automatically true elsewhere. If two settings both want it, promote it to `core` with a
ruling. Apocrypha is not "wrong": it is lore the other games are free to ignore.

`status: draft` marks an entry or core fact proposed but not yet used by any game, or not agreed. Drafts are fair game
to change without a ruling. `canon` facts change only with a ruling saying why.

## Entry schema

One file per thing, at `docs/lore/entries/<setting>/<id>.md`. The folder must match `setting`.

```markdown
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

The Tall Ones' great servant-beast, jammed by Gnorwin Clayfoot 3,000 years ago and locked in the Shed. (One paragraph
summary first; it becomes the index line.)

## What gnomes say
What people in the world believe, in their words. Contradictions between sources stay in.

## The truth
Designer's truth: what is really going on, for writers. Spoilers. Optional.

## In the games
Where it appears (file, level, quest id) and what players actually see.

## Loose threads
What stays unanswered on purpose. Write it here so nobody "fixes" it by accident.
```

| Field | Required | Values |
|---|---|---|
| `id` | yes | kebab-case, unique across all settings, same as the file name |
| `name` | yes | the name most gnomes use |
| `kind` | yes | `place`, `person`, `faction`, `creature`, `object`, `event`, `era`, `concept`, `term` |
| `tier` | yes | `core`, `setting`, `game`, `apocrypha` (see above) |
| `setting` | yes | a heading id from [settings.md](settings.md); `core` tier uses `core` |
| `status` | yes | `canon` or `draft` |
| `sources` | yes | repo-root paths the facts come from (design docs, game source files, `docs/lore/rulings.md`). No fact without a source. |
| `era` | no | `planting`, `charters`, `rumbling`, `now`, `timeless` (Fescue's three layers of time; other settings may use `now`/`timeless`) |
| `games` | no | folders under `games/` that show it |
| `aliases` | no | other names, titles, nicknames. Searched by `find`; a name may belong to one entry per setting |
| `related` | no | other entry ids |

Body sections other than the summary are optional; leave out empty ones. Keep it short: a fact-sheet that points at
its sources, not a copy of them. The long-form design (quests, stats, dialogue) stays in the game's design docs.

## Commands

```
npm run lore                 # check every entry and rewrite INDEX.md (run after any change here)
npm run lore -- check        # check only; exits 1 on an error
npm run lore -- find mower   # search
```

The check catches: missing fields, bad enum values, a file in the wrong folder, duplicate ids, a name or alias used
twice in one setting, `related` ids that don't exist, and `sources` or `games` paths that don't exist.

## Adding lore

- **A new game:** give it a row in [settings.md](settings.md) (an existing setting, a new one, or `none` for tools).
  Its named things that other games might reuse get entries; throwaway names don't need one.
- **A new setting:** add a `## \`id\`` heading to [settings.md](settings.md) with its games, its sources of truth and
  its departures from the core.
- **Changing a canon fact:** add a ruling first, then edit the entries.
