## Environment (shared by every E09 issue; each issue pastes this)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-aa34926d27c4cf873` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands.
- Node: if `node` is missing, prefix commands with `PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Other workers edit other files of this game at the same time: change only the files your issue lists. Never commit,
  never stash, never run `git checkout`/`git reset`.
- Line endings: some files are stored with CRLF (e.g. `src/sound/ambience.ts`, `src/anim/persona.ts`,
  `src/anim/playerIdle.ts`, `src/anim/types.ts`, `src/npcs.ts`). Edit with the Edit tool, never `sed -i` (Git Bash
  sed rewrites the whole file). New files use LF. Before finishing, `git diff --stat` must show only the lines you meant
  to change (no whole-file rewrites).
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; another worker's half-done file may fail
  for a moment, rerun), single tests `npx vitest run src/<path>.test.ts`. Do not run `vite build` or the full test suite.
  No dev server unless the issue gives you a port.
- Repo rules: procedural WebAudio only (no audio files), mobile first (44 px touch targets, readable at 390x844 portrait
  and 844x390 landscape, safe-area insets), plain short comments in the code's existing style, keep the game's dry
  satirical charm. Lore house style: nothing gets wet, soaked or bloody (clay cracks and is glued back).
