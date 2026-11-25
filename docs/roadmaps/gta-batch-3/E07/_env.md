## Environment (shared by every E07 issue; the issue pastes or links this)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-afb1208eb4e698ecf` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands.
- Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Other workers edit other files of this game at the same time: change only the files your issue lists. Never commit.
- Line endings: several files are stored with CRLF. Edit with the Edit tool, never `sed -i` (Git Bash sed strips CR and
  rewrites the whole file). Before finishing, `git diff --stat` must show only the lines you meant to change.
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; another worker's half-done file may
  fail for a moment, rerun), single tests `npx vitest run src/<file>.test.ts`. Do not run `vite build`. Do not use port
  5307 (the lead's dev server); if you need a browser check, start `npx vite --port <your port> --strictPort` from
  `games/gnome-theft-auto` and stop it after.
- Options registry (exists, `src/optionsRegistry.ts`): a module adds its own rows at import time; the Options app draws
  them. Rows:
  ```ts
  registerOption({ section: 'audio', id: 'bird-sounds', label: 'Bird sounds', desc: 'One short line.', kind: 'toggle',
                   get: () => boolean, set: (on: boolean) => void, order?: number, watch?: 'gta:some-event' });
  registerOption({ section: 'map', id: 'x', label: 'X', kind: 'cycle', values: [{ id: 'low', label: 'Low' }, ...],
                   get: () => string, set: (id: string) => void });
  ```
  Section ids: `controls`, `view`, `map` (Map and markers), `dialogue`, `world`, `audio` (Sound), `online`, `cheats`,
  `save`, `dev`. `watch` is a window event that repaints the row. Settings are per browser: localStorage inside
  try/catch, read once into a module variable, a `window` event fired on change; never in `GTA_SAVE_KEYS`.
- Repo rules: mobile first (44 px touch targets, works at 390x844 portrait and 844x390 landscape, safe-area insets);
  no external assets; plain short comments in the code's existing style.
