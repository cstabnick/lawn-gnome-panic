Epic: 2 Systems
Depends on: none (Epic 1 is done: `games/final-collectathon` exists)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are writing code under `games/final-collectathon/src/` and `packages/music/` right now. You only write docs: the files listed under Change. Do not touch any `.ts` file.
- Repo rules: after any change under `docs/lore/`, `npm run lore` must pass. Every game folder appears in exactly one setting in `docs/lore/settings.md`. Every new game adds a row to the party backlog in `packages/party/README.md` and to the games table in `AGENT_INDEX.md`.

## Goal

Record the new game "The Final Collectathon" (`games/final-collectathon`) in the lore knowledge base (setting row,
six entries, one ruling), the party slice backlog, the agent index, and the game's README.

## Read first

- `docs/lore/README.md`: the entry schema (front matter fields and allowed values) and body sections.
- `docs/lore/settings.md`: the setting table and the `## \`apocrypha\` Apocrypha` section.
- `docs/lore/entries/apocrypha/cress-caliper.md`: a finished apocrypha person entry to copy the voice and layout of.
- `docs/lore/rulings.md`: the format and the last ruling (R-037); yours is R-038 (if R-038 already exists, use the next free number).
- `docs/roadmaps/final-collectathon.md`: the game's design (names, chapters, eggs). Source of truth for the entries.

## Change

### `docs/lore/settings.md`

- In the table row for `apocrypha`, append `, final-collectathon`.
- In the `## \`apocrypha\` Apocrypha` section's Games bullet, append: `` `games/final-collectathon` (The Final Collectathon: a job interview at the Annex, an office of collectors by Club Gnome's square, that becomes a collectathon parody; ends on Shellshore, the beach planet; R-038).``

### `docs/lore/rulings.md`: append

```markdown
## R-038

**Question:** The Final Collectathon talks to the player (a narrator, fake achievements, "you are free to play the game"), sets an office building at Club Gnome, and ends with a gnome flying to a beach planet. Does that break the core house style, the Yard, or the core facts?
**Ruling:** It is `apocrypha`. Its fourth-wall jokes are the parody the house style allows there. The Annex is said to stand at the edge of Club Gnome's square, but Club Gnome (the Yard) does not show it and need not agree. Shellshore, the beach planet, is true only in this game. Whether the four floors were an interview or a dream in the reception chair stays a loose thread, and so does whether the Interviewer exists. No Tall Ones appear; nothing bleeds.
**Applies to:** apocrypha, final-collectathon.  **Date:** 2026-11-22.
**Why:** a satire of collecting games needs to address the player; apocrypha keeps that out of every other setting.
```

### Six entries in `docs/lore/entries/apocrypha/` (all `tier: apocrypha`, `setting: apocrypha`, `status: canon`, `games: [final-collectathon]`, `era: now`, `sources: [docs/roadmaps/final-collectathon.md, docs/lore/rulings.md]`)

Write each with a one-paragraph summary, `## What gnomes say` (2-3 quoted lines from the design, below), optional
`## The truth`, `## In the games` (which floor/chapter), and `## Loose threads`. Dry, short, no pop culture, no real games.

1. `the-annex.md`: id `the-annex`, name `The Annex`, kind `place`, aliases `[Club Gnome Annex]`, related `[bucketworth-and-sons, primrose-paperweight, the-interviewer, club-gnome]`. An office building said to stand at the edge of Club Gnome's square: reception, Floor 1 (Orientation), Floor 2 (Onboarding), Floor 2½ (Synergy), Floor ∞ (Everything), and a lift with a B button. Every clock in it says nine. Line: "Interviews are always at nine." Loose threads: why the floors go 1, 2, 2½, ∞; what is on Floor B.
2. `bucketworth-and-sons.md`: id `bucketworth-and-sons`, name `Bucketworth & Sons`, kind `faction`, aliases `[Bucketworth & Sons, Collectors]`, related `[the-annex, the-interviewer]`. A firm of collectors "collecting since before there was anything to collect". It has never produced a document. Loose thread: who the Sons are; whether there was ever a Bucketworth.
3. `primrose-paperweight.md`: id `primrose-paperweight`, name `Primrose Paperweight`, kind `person`, aliases `[Primrose]`, related `[the-annex, the-interviewer]`. The secretary at reception. She says "Hello." to every applicant; nobody says it back. "I collect nothing. That's my secret." "Nobody ever says that." (when the player turns down the job). Her nameplate reads "Primrose Paperweight, Reception", and on the fourth reading "Second Class". Loose thread: whether she was ever an applicant; "See you at nine."
4. `the-interviewer.md`: id `the-interviewer`, name `The Interviewer`, kind `person`, aliases `[The Narrator]`, related `[the-annex, primrose-paperweight, the-pointlessness]`. A voice in the ceiling who runs the interview; never seen. His name drifts each floor (The Interviewer, The Interviewer (probably), The Narrator, You, possibly). "I used to have a script. It's in a filing cabinet. I collected it." Loose thread: whether he is the player.
5. `shellshore.md`: id `shellshore`, name `Shellshore`, kind `place`, aliases `[The Beach Planet]`, related `[the-annex, the-pointlessness]`. A small sandy planet with palm trees and a blue sea, seen through the top floor's windows and reached by flying out of the Annex's front door. "Nobody collects anything there. They just... sit." Loose thread: how a gnome flies; the faint "...Hello?" on the intercom after the credits.
6. `the-pointlessness.md`: id `the-pointlessness`, name `The Pointlessness`, kind `event`, related `[the-interviewer, shellshore, the-annex]`. The moment on Floor ∞ when everything, the furniture included, has been collected: the counters hit ∞, then everything stops. "You are finally free to play the game." "...The game was the collecting. I'm sorry. I thought you knew." Loose thread: whether anyone got this far before.

`club-gnome` is a Yard entry id: listing it in `related` is fine, but do not edit Yard entries (R-038: the Yard need not agree).

### `packages/party/README.md`

Add a backlog row at the end of the table:
`| hoard-rush | final-collectathon | Hoard Rush: 30 s, four gnomes on one office floor while the ceiling rains office supplies and the multiplier doubles every 10 s; most collected wins (reuses collect.ts, walk.ts, office.ts) | building |`

### `AGENT_INDEX.md`

- Games table: add a row after `gnome-set-radio`:
  `| \`final-collectathon\` | The Final Collectathon | three | 5205 | | \`hoard-rush\` | Four-chapter, ~19-minute satirical mega-collectathon in the Annex office by Club Gnome's square: a secretary's "Hello.", Floors 1, 2, 2½ and ∞ of escalating collectibles, fake achievements and a drifting narrator, the Pointlessness, then "I'm not taking the job" and a flight to Shellshore, the beach planet. Chapters are scripts on one API (\`src/director.ts\` implements \`ChapterCtx\`; \`src/chapters/*.ts\`); collecting is pure (\`src/collect.ts\`); three \`@lawn/music\` themes (\`fcHoldMusic\`, \`fcSynergyLoop\`, \`fcShellshore\`); 8 easter eggs; \`?chapter=<id>\`, \`?fast\`, \`window.fc\`. Plan: \`docs/roadmaps/final-collectathon.md\` |`
- Docs table: add `| \`docs/roadmaps/final-collectathon.md\` | The Final Collectathon design (chapters, eggs, soundtracks, achievements) and its 4-epic build plan |` after the gnomillion roadmap row.
- In the `music` package row, append `; The Final Collectathon: Hold Music, Synergy Loop, Shellshore` inside the parenthesised list of per-game themes.

### `games/final-collectathon/README.md` (replace the placeholder)

Sections: what it is (two sentences); Run (`npm run dev -w games/final-collectathon`, port 5205; `npm run build -w games/final-collectathon`; `npm test -w games/final-collectathon`); Controls (stick or WASD/arrows to walk; Jump button or Space; Interact button or E/Enter; tap or Enter/Space to advance dialogue); URL flags (`?chapter=prologue|ch1|ch2|ch3|ch4|ending`, `?fast`, `#minigame=hoard-rush` once the slice exists); Chapters (one line each, from the design); Files (a table: `app.ts`, `types.ts`, `config.ts`, `director.ts`, `collect.ts`, `walk.ts`, `player.ts`, `camera.ts`, `input.ts`, `hud.ts`, `items.ts`, `office.ts`, `floors/*.ts`, `sky.ts`, `sfx.ts`, `music.ts`, `save.ts`, `chapters/*.ts`, `minigames/`, each one line); Not online (single-player narrative: one secretary, one ending; shared play would double the game); Lore (apocrypha, R-038, entry ids).

## Contract

Entry ids exactly: `the-annex`, `bucketworth-and-sons`, `primrose-paperweight`, `the-interviewer`, `shellshore`, `the-pointlessness`.

## Done when

- `npm run lore` passes (it also regenerates `docs/lore/INDEX.md`; that is expected).
- `npm run lore -- find primrose` and `npm run lore -- find shellshore` find your entries.

## Out of scope

Any `.ts`/`.json` file, any other game's docs, `docs/lore/canon.md`, Yard entries.
