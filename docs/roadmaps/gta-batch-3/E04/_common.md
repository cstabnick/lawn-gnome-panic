# E04 common rules (every E04 issue pastes or reads this)

## Environment
- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a1c0e7d1cbb959848` (branch
  `epic/E04-story`). Use absolute paths. Git Bash: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
- This epic is **writing only**: change nothing under `games/` or `packages/`. Do not commit, push or open PRs.
- Other writers work at the same time on other files of this epic. Edit **only** the files your issue names. Never
  edit `docs/lore/rulings.md`, `docs/lore/settings.md`, `docs/lore/INDEX.md`, `AGENT_INDEX.md` or
  `docs/design/gnome-theft-auto/README.md` (the lead owns them).

## The contract
`docs/roadmaps/gta-batch-3/E04/spine.md` is binding: area names, region tags, the 70 rows (ids, titles, status, givers,
prereqs, cast, premises), the extended quests and their parts, the cast ids with homes and workplaces, the world-change
ids W01-W17, the rulings R-158..R-167 and the lore entry ids. Copy names and ids exactly. You may add detail (beats,
lines of intent, minor unnamed extras); you may not rename, renumber, move a quest to another row, or change a home.
If something in the spine cannot work, write the best version that still fits and list the problem in your final report.

## Canon and house style (Gnome Theft Auto is `apocrypha`, a GTA parody, but these still bind)
- Gnomes are fired clay: they chip, crack, shatter and get glued. Nothing bleeds; no gore; "cracked" not "killed" (R-021).
- Nobody ever sees or hears a Tall One. Their traces are huge objects (a bucket, a bicycle wheel, a pail).
- Mowers are the great machine; acorns are money; a gnome's hat is who they are.
- Dry, understated humour; no pop-culture references beyond the GTA-genre parody itself; no fourth-wall jokes.
- Names: gnome first names are plants, surnames soil/tools/household things; at most one pun per name.
- Leave loose threads loose: never answer one (where the Tall Ones went, what is beyond the Fence, who the player is,
  Tansy's surname, Wendel, Moleman's transmitter, what is across the Saltwater).
- Sound like the repo: plain, short, concrete. No emojis.

## Lore lookups
`npm run lore -- find <word>` (from the worktree root) searches `docs/lore/`. Existing entries live in
`docs/lore/entries/apocrypha/*.md`. Read the entry of any existing character or place before you write about them.
