# Common rules for every issue in this roadmap

Read `docs/roadmaps/level-format/_common.md` first (it is the same environment and rules: run from the repo root, do not commit,
touch only the files your issue lists, other workers edit other files at the same time, no dev servers, no `vite build`, keep
stub signatures). Differences and additions for this roadmap:

- The branch is `level-format-adoption` (stacked on `level-format-editor`). Still do not commit or switch branches.
- **Known failure to ignore, not fix:** `npm test -w games/gnomes-of-gnomomia` fails exactly one test, `src/gear.test.ts > ... attaches weapon, shield, ...` (it fails on `main`).
- **The golden tests are your safety net and your definition of done.** Each game has `src/*.golden.test.ts` + a `.golden.json` fixture captured
  from the ORIGINAL code. Your migration must keep it passing **without editing the fixture or the test**. If it cannot pass, stop and
  report exactly which key differs and why; do not regenerate the fixture.
- Level files are `@lawn/level` documents (`packages/level/src/types.ts`: `LevelDoc`, `PropDef`, `MarkerDef`; `validateLevelDoc` in
  `validate.ts`). Colours in JSON are `'#rrggbb'` strings (lowercase, 6 digits). JSON is `JSON.stringify(doc, null, 2)` + a trailing newline.
  Gnomomia is the worked example: `games/gnomes-of-gnomomia/src/levelDocs.ts` (`ZONE_DOCS`, `docToZone`, `worldZoneToDoc`) and
  `src/data/levels/*.level.json`; read it before you start.
- Each game's tsconfig needs `"resolveJsonModule": true` to import a `.json` file (Gnomomia's has it). Add it to the game you migrate if it is missing
  (that one line of `tsconfig.json` is yours), and add `"@lawn/level": "*"` to its `package.json` dependencies (keep the file's line endings).
  Do not run `npm install`: `node_modules/@lawn/level` already exists.
- Generate the JSON files by a throwaway script/test that reads the ORIGINAL data from the game's own code and writes the files, run it once,
  then delete it. Never type the data by hand.
- Report: files changed, commands and results, and anything you could not do.
