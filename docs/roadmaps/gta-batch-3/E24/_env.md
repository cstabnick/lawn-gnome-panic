# E24 worker environment (read this first)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a3685a4024b543eab` (a git
  worktree on branch `epic/E24-jobs2`). Use absolute paths. Git Bash: if `node` is missing,
  `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed. Never commit, push or stash.
- Game: `games/gnome-theft-auto` (three.js + TypeScript, Vite). Other workers edit OTHER files of this game at the same
  time. Only change the files your issue lists. If `tsc` reports errors in files that are not yours, ignore them and say
  so in your report; your own files must have none.
- Type-check: `npx tsc --noEmit -p games/gnome-theft-auto` (safe in parallel). One test file:
  `cd games/gnome-theft-auto && npx vitest run src/<path>.test.ts`. Do NOT run `npm run build` (writes dist/) and do not
  start a dev server unless your issue gives you a port.
- **Line endings:** keep each file's existing line endings (many files are LF, some CRLF). New files: LF. After editing,
  `git diff --stat` must show only the lines you changed, never a whole-file rewrite.
- Repo rules that apply (AGENTS.md): new visible objects are `@lawn/prefabs` prefabs (no hand-built one-off meshes for
  items/props); UI goes in its own container appended to the shared `#ui` element (never restyle `#ui`); mobile: every
  action has a touch control, buttons at least 44 px, layouts fit a 390x844 portrait phone and a landscape phone, use
  `env(safe-area-inset-*)`; no hover-only UI. Flat things on a surface must not z-fight (lift them 0.01-0.02 m or give
  them a gap; boxes that touch must not share a face). Lore: names and text follow `docs/lore/canon.md`; search with
  `npm run lore -- find <word>`.
- Tone: Gnome Theft Auto is a satirical, warm, silly open-world game about garden gnomes (Turfton city, acorns as money,
  the HOA "Hat Watch" as police, "Tall Ones" are humans). Jokes are dry and specific, never mean-spirited, no swearing.
- Style: plain, short code comments; match the surrounding code's style (2-space indent, single quotes, semicolons).
- Report back in at most 15 lines: files changed, checks run and their result, anything left undone.
