# Environment (every E18 issue)

- Repo worktree: `C:/Users/cpsai/cstabnick/lawn-gnome-panic/.claude/worktrees/agent-acfd3b1e21ccb0a72` (Git Bash; use
  absolute paths; `cd` there first). If `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
  `npm install` is done. Branch `epic/E18-activities`. **Never commit, push, stash or switch branches.**
- Game: `games/gnome-theft-auto` (three.js + TypeScript, no Phaser). Other workers edit other files of the same game at
  the same time: change only the files your issue lists. If `tsc` shows errors only in files you do not own, ignore them.
- Keep LF line endings. Do not reformat files; change only what you need.
- Type-check: `cd games/gnome-theft-auto && npx tsc --noEmit -p .`. Single tests: `npx vitest run <path>`. Do not run
  `vite build` or start a dev server (the lead does that at the end).
- Repo rules that apply: new visible objects come from `@lawn/prefabs` (`buildPrefab(id)` from `@lawn/prefabs`; browse
  ids with `grep -rn "id: '" packages/prefabs/src/catalog/`); no hand-built one-off meshes for things a prefab can be.
  Flat things on the ground use `flatLayer(material, LAYER.<x>)` from `@lawn/depth`, never just a small lift. UI goes in
  your own container appended to `#ui`; touch targets at least 44 px, no hover-only UI; works at 390x844 portrait.
- Tone: Gnome Theft Auto is dry, satirical and charming. Short, concrete lines. Keep the charm.
