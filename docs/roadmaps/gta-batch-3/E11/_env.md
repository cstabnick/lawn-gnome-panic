# E11 environment (every issue)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-aeab16e10f78d92ba` (a git worktree,
  branch `epic/E11-coast`). Run every command from there, or from the package folder the issue names.
- Shell: Git Bash. If `node`/`npm`/`npx` is not found: prefix commands with `PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed; do not run `npm install`. **Never commit, push, stash or switch branches.**
- **Line endings:** this repo mixes LF and CRLF files. Keep each file's own line endings (the Edit tool does this). A new
  file is LF. Never rewrite a whole file just to change a few lines.
- Other workers edit other files of the same game at the same time. Edit only the files your issue lists. If `tsc`
  reports errors in a file you do not own, ignore them (someone is mid-edit), but your own files must be clean.
- Game: `games/gnome-theft-auto` (three.js + TypeScript, Vite). Coordinates: +x east, +z south (north is -z), metres,
  y up. Type-check: `cd games/gnome-theft-auto && npx tsc --noEmit -p .`. Single test file:
  `cd games/gnome-theft-auto && npx vitest run src/<file>.test.ts`. Do not run `vite build` or start a dev server.
- Repo rules that apply: objects you can see or touch come from the prefab library `@lawn/prefabs` (`buildPrefab(id, { lights: false })`,
  `getPrefab(id)`); anything laid flat on the ground or on another surface uses `flatLayer(material, LAYER.<x>)` from
  `@lawn/depth` and boxes that touch must not share a face (no z-fighting); UI targets are at least 44 px and work by touch;
  gnome names and text follow the lore (the entries named in the issue).
- The coast's shared constants are in `games/gnome-theft-auto/src/coast/config.ts` (`COAST`, `COAST_QUESTS`,
  `COAST_ACH`, `OCEAN_ID`, `SALTCUT_ID`). Read it; do not edit it unless your issue says so. Facts about the ground
  there: the Saltwater's surface is at about y -8.9 (`bodyLevel(OCEAN_ID)` from `src/water.ts`), its north shore at
  z ~1190, water depth 1.5 m at z ~1235, 4.5 m at z ~1280, 7 m from z ~1400; the boardwalk ground is flat at y ~-4.24;
  the beach dunes reach y -3.1 near (250..300, 1100..1140).
