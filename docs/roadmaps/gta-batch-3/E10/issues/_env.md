## Environment (shared by every E10 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-abe9b41bbff235969` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands.
- Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed (no `npm install`).
- About 12 other workers edit other files of this repo at the same time: change only the files your issue lists. Never
  commit, never push.
- Line endings: some files are stored with CRLF, others with LF. Edit existing files with the Edit tool, never `sed -i`
  (Git Bash sed rewrites the whole file). New files: LF. Before finishing, `git diff --stat` must show only the lines you
  meant to change (no whole-file rewrites).
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; another worker's half-done file may fail
  for a moment: rerun, and only fix errors in your own files), single tests `npx vitest run src/<path>.test.ts`. Do not run
  `vite build` or the full test suite. Do not start a dev server unless the issue says so (and then only on the port it names).
- World coordinates: +x east, +z south (north is -z), metres. Yaw 0 faces +z; a facing vector is (sin yaw, cos yaw);
  a three.js object with `rotation.y = yaw` faces that way. Gnome scale: a gnome is about 1 m tall; a bed is 1 x 2 m.
- Repo rules: objects are `@lawn/prefabs` prefabs (never hand-built meshes for things you can see or pick up; plain boxes
  only for architecture); mobile first (44 px touch targets, works at 390x844 portrait and 844x390 landscape,
  safe-area insets, no hover-only UI); no external assets; short plain comments in the code's existing style; UI goes in
  its own container appended to the shared `#ui` element (never restyle or hide `#ui`).
- Tone (lore): satirical, dry, gnome-scale. Kiln-Debt is the player's old debt; property loans sit beside it on the
  First Kiln Bank's ledger, never inside it (lore R-169). Flat 3B costs 1,500 Acorns, all on loan (R-166).
- Environmental storytelling (acceptance criteria for content): each place shows small readable vignettes (props
  arranged to tell a story without text), signs and posters with jokes that fit the place, and a resident seen doing
  something specific to the place.
