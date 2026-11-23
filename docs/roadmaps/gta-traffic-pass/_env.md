# Environment (every issue of this roadmap)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a1fe5a08eed5c024b` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push, or open a PR. Do not start a dev server
  (the planner has one on port 5303; editing files makes it reload, that is fine).
- Six other workers are editing OTHER files of the same game (`games/gnome-theft-auto`) at the same time. Edit only the files
  your issue names. If `npx tsc --noEmit -p games/gnome-theft-auto` shows errors in a file you do not own, another worker is
  mid-edit: ignore those, fix only yours.
- Code style: TypeScript, 2-space indent, single quotes, semicolons, lines up to ~140 chars, a short `//` comment above
  each exported function saying what it does (match the surrounding files).
- Game: Gnome Theft Auto, a three.js open-world parody. World units are metres. `x`/`z` is the ground plane, `y` up.
  A vehicle's `yaw` is the angle of its heading: forward = `(Math.sin(yaw), Math.cos(yaw))` in (x, z).
