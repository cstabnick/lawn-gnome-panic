## Environment (shared by every E28 epic-2 issue)
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a91b69e37bf027ba6` (a git worktree).
  Game: `games/gnome-theft-auto` (three.js + TypeScript, Vite). Use absolute paths; Git Bash is the shell.
- If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing other files of this game at the same time. Touch only the files your issue lists under
  Change. Do not commit, do not run `vite build`, do not start a dev server. `npx tsc --noEmit -p games/gnome-theft-auto`
  is safe to run.
- **Keep each file's line endings.** Some files are CRLF (e.g. `src/config.ts`, `src/types.ts`, `src/net.ts`): edit them
  only with the Edit tool, never with `sed -i` or a script that rewrites the whole file. JSON is 2-space indented.
- `src/layout.golden.test.ts` fails on purpose until the lead regenerates it; never touch `src/data/layout.golden.json`.
- World coordinates: +x east, +z south (north is -z), metres, y up. The map is now 3600 x 3600 (`WORLD_HALF` 1800,
  perimeter fence at 1795). New this epic (E28):
  - **Pardonlin** (region id `pardonlin`, biome `continental`): x -1800..-1400, z -900..1100, a European-style riverside
    town in another Tall One's garden west of Trellisdown. The river **the Thymes** (water path id `thymes`, 16 m wide)
    runs north to south at about x -1600..-1625 from z -880 to **Pardonlin Basin** (still water centred (-1600, 1040),
    90 x 60). Streets are 7 m wide road paths with ids starting `pl-`; footpaths are `trail/thymes-walk`,
    `trail/rive-gauche`, `trail/jardin-est`, `trail/jardin-ouest`. Two roundabouts: **the Hatwheel** (centre
    (-1555, -30), ring radius 20) and **Place du Pot** (centre (-1500, 450), radius 14).
  - **The Unmown** (region id `the-unmown`, biome `preserve`): a nature preserve, x -1800..-200 at z -1800..-1400 plus
    x -1800..-1400 at z -1400..-900. Reached by `unmown-road` from (-950, -950) to (-1400, -1020) and `unmown-lane` to
    (-1540, -1120), ending at the ranger station site (centre (-1560, -1150)).
  - The old perimeter fence line x = -1397 now separates Trellisdown (x > -1400) from Pardonlin; roads cross it at
    z = -500 (north gate), z = -30 (the Grand Wicket) and z = 1000 (the harbour gate).
  - Bands pushed out: Snowcap Rise (`north-highlands`) now spans z -1800..-900 east of x -200 (and z -1400..-900 from
    x -1400); Rootwell (`east-campus`) x 900..1800 to z 1100; Saltbucket Shore (`south-shore`) the whole south strip.
  - Roundabouts at two existing ring-road junctions: **Trellis Cross** (-950, -30) r 16 and **the Anthill Ring**
    (940, 40) r 16.
