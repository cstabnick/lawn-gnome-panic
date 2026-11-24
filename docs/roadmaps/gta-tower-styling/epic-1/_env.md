## Environment (same for every issue of this epic)

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn` (a git worktree shared with other planners and workers). Run every command from there.
- Node: in Git Bash, if `node`/`npm`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; never run `npm install`.
- NEVER `git commit`, `git stash`, `git checkout`, switch branches, start a dev server or run `vite build`. Edit only the files your issue names. Many other workers edit other files of `games/gnome-theft-auto` at the same time: if `tsc` reports errors in files you do not own, ignore them; fix only errors in your own files.
- The game is Gnome Theft Auto (three.js + TypeScript). This epic restyles the downtown towers of the city Turfton. The code lives in `games/gnome-theft-auto/src/towers/`. Read `src/towers/types.ts` (TowerSpec, TowerStyle, Mass, TowerGeoms) and `src/towers/kit.ts` (the geometry helpers) before you start: they are the contract and they are finished. Do not edit them.
- Coordinates: x east, z south, y up, metres. A tower's collider is exactly x ± w/2, z ± d/2, 0..h and never changes.
- Performance matters: the game already struggles. Keep cylinder/sphere segment counts low (8 or fewer unless stated), never more boxes than the issue allows.
- Z-fighting rule (docs/rendering.md): two boxes that touch must not share a face. A part on a wall stands clearly proud (at least 0.12 m), a part on a roof starts at the roof top or sinks 0.05 into it, never flush side faces.
