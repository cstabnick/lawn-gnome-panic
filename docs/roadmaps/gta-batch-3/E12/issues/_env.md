## Environment (shared by every E12 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a254f7a8cb071b4a9` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands.
- Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed (no `npm install`).
- About 12 other workers edit other files of this repo at the same time: change only the files your issue lists. Never
  commit, never push, never run `git stash`.
- Line endings: some files are stored with CRLF, others with LF. Edit existing files with the Edit tool, never `sed -i`
  (it rewrites the whole file). New files: LF. Before finishing, `git diff --stat` on your files must show only the lines
  you meant to change (no whole-file rewrites).
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; another worker's half-done file may fail
  for a moment: rerun, and only fix errors in your own files), single tests `npx vitest run src/<path>.test.ts`. Do not run
  `vite build` or the full test suite. Do not start a dev server.
- The winter contract is `games/gnome-theft-auto/src/winter/types.ts` (types, places, tuning, ids). Read it; never edit it
  (tell the lead in your report if it is wrong). Files under `src/winter/` that you do not own are stubs or other workers'
  files: import their exported functions, keep to their signatures.
- World coordinates: +x east, +z south (north is -z), metres. Yaw 0 faces +z; a facing vector is (sin yaw, cos yaw); a
  three.js object with `rotation.y = yaw` faces that way. A gnome is about 1 m tall.
- The place: Snowcap Rise (region `north-highlands`), the snowy band north of Frostbite Fells. **Snowdrop Slope** (E01 site
  `ski-hill`, x -460..-240, z -1300..-1000) rises from about 4 m at its south foot (z -1010) to about 60 m at its north top
  (z -1290); it is painted snow. The **Woolly Sock Lodge** sits at its foot (west side). **Pail Pond** (site `ice-lake`,
  x -730..-550, z -1130..-990) is flat ground at y = 3.0 painted ice within 62 m of (-640, -1060): a Tall-One pail sunk to
  its rim and frozen over. Frostbite Fells (region `frostbite-fells`) has its own sun deck of polar bears at (330, -640).
- Repo rules: objects are `@lawn/prefabs` prefabs (never hand-built meshes for things you can see or pick up; plain boxes
  only for architecture, and flat decals); anything laid flat on the ground or another surface gets a draw layer
  (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`), and boxes that touch must not share a face (no z-fighting);
  mobile first (44 px touch targets, works at 390x844 portrait and 844x390 landscape, safe-area insets, no hover-only
  UI); no external assets; short plain comments in the code's existing style; UI goes in its own container appended to
  the shared `#ui` element (never restyle or hide `#ui`).
- Tone (lore): satirical, dry, gnome-scale. Nothing dies or is hurt (rulings R-021, R-049): falls are tumbles, fish are
  landed on a nibble-clip, measured and let go, polar bears only ever shrug and never speak. On the Fells falling snow is
  "frost glaze"; on Snowcap Rise it is just snow. Names: Gentian Bootlace keeps the Woolly Sock Lodge and teaches skiing
  (striped bobble cap, brisk, warm-handed, "unimpressed by anything that falls over twice"); Thermos Theo fishes Pail Pond
  (a thermos, always). The rope tow is **the Bootlace Tow** (cotton-reel handles on a knotted bootlace); the ski slalom is
  **the Wool Run**; the sled lane is **the Tea-Tray Run** (the sleds are Tall-One tin tea trays).
- Environmental storytelling (acceptance criteria for content): each place shows small readable vignettes (props
  arranged to tell a story without text), signs and posters with jokes that fit the place, and a resident seen doing
  something specific to the place.
