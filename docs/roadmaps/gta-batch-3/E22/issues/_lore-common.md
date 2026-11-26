# E22 lore pass (L86): the common contract (read this first, all of it)

The user asked (L86): "take another pass writing out menial lore for the new extended world". Gnome Theft Auto's batch 3
added a whole extended world: the coast, the winter slopes, a university on an anthill, a dirt bowl and a toadstool
forest, a golf course in the neighbour's garden, a vineyard and a manor, underground societies, a European town
(Pardonlin), a nature preserve (the Unmown), mountain routes (the Hatbrim), hamlets, and a 70-quest story with dozens
of new people. The lore base (`docs/lore/`, 700+ entries) has first-pass entries for most of it, written by many
different epics. Your job is to make it **complete, consistent and lived-in**. Additions and fixes only: never delete
an existing entry or a ruling.

## Environment

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adec7594cd8bfc2db` (Git Bash; if `node`
  is missing: `export PATH="/c/Program Files/nodejs:$PATH"`). Do not commit, push, stash or checkout. Keep LF line endings.
- Other workers (lore and quest writers) work in the same repo at the same time. You edit **only** the lore entry files
  your issue assigns (and new entry files you create for your group), plus game text files only where your issue says.
  Never edit `docs/lore/rulings.md`, `docs/lore/settings.md`, `docs/lore/canon.md` or `docs/lore/INDEX.md` by hand:
  put proposed rulings and settings lines in your final report (the lead appends them). `npm run lore` regenerates
  `INDEX.md`; that is expected (several workers running it is fine).

## Read first

- `docs/lore/README.md` (how to answer a lore question, the tiers, **the entry schema**: copy it exactly; the checker
  `tools/lore.mjs` enforces the front matter, the `related:` ids and the folder = `setting` rule).
- `docs/lore/canon.md` (the facts and the **house style**: plant first names, soil/tool surnames, renamed objects, dry
  jokes, no gore, no pop culture, leave threads loose).
- `docs/lore/settings.md` (every setting; Gnome Theft Auto's world is the `apocrypha` setting: its entries live in
  `docs/lore/entries/apocrypha/`, `tier: apocrypha`, `setting: apocrypha`, `games: [gnome-theft-auto]`).
- `docs/lore/rulings.md`: skim the batch-3 rulings R-154 to R-234 (they fix the names and places of the new world).
- Good batch-3 entries to copy for voice and depth: `entries/apocrypha/hatbrim.md`, `last-dandelion.md`,
  `cafe-pardon.md`, `unmown-rangers.md`, `pardonlin.md`.
- The character bible `docs/design/gnome-theft-auto/characters.md` and the story outline
  `docs/design/gnome-theft-auto/story-outline.md`: where a character's lore entry and the bible disagree, **the bible
  wins** unless `canon.md` or a ruling says otherwise; fix the entry and propose a ruling line that says so.

## How to find what is missing

`npm run lore -- find <word>` (from the repo root) matches names and aliases. For each name in your group: find it; if
nothing comes back, it needs an entry. Names come from: the bible, the outline, the game's code (grep `name: '` and
sign texts in the area module your issue names), the E-roadmaps' "deferred"/"needs a lore entry" notes
(`docs/roadmaps/gta-batch-3.md` tracking table and the `E*/roadmap.md` result sections). A name that appears only in a
code comment does not count.

## Rules for every entry you write or touch

- Schema exact, `sources:` lists the code file(s) and ruling(s) it comes from, `related:` only ids that exist.
- One-paragraph summary first (it becomes the index line), then "What gnomes say" (two or three quoted sayings in the
  locals' voice), "The truth" (designer's facts, coordinates if a place: take them from the code), "In the games"
  (which file / quest / scene shows it, what players see), "Loose threads" (one or two things left unanswered on purpose).
- Facts must match the game: when an entry and the game's code or text disagree, the code is what players see. Fix the
  entry if it is wrong; if the game text is wrong and the fix is a one-line string in a file your issue lets you edit,
  fix the game text; otherwise list the mismatch in your report.
- Keep the charm: satire of HOAs, beige, paperwork and tidy lawns; warmth for the outcasts. Dry, understated, no gore,
  no "wet"/"soak"/"blood" in anything a player reads (R-021).

## Checks

From the repo root: `npm run lore` must print `Lore OK`. If it fails on a file you did not touch, wait a minute and
rerun (another worker may be mid-edit); never edit their file.

## Final report (at most 25 lines)

Entries added (ids), entries changed (id: what), contradictions found and how each was settled, mismatches with game
text you could not fix (file, line, what), proposed rulings (full text, numbered "R-NEW-1", ... for the lead to
renumber), proposed `settings.md` additions.
