## Environment (every issue)

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Game: `games/gnome-blackjack` (Vite + TypeScript strict + three 0.187, no Phaser).
- `npm install` has already been run at the repo root. Do not add dependencies.
- The contracts are in `games/gnome-blackjack/src/config.ts` (types, tuning constants) and `src/characters.ts` (CPU gnomes and the dealer). Read them; do not edit them. If you truly need a new constant, put it at the top of your own file.
- Every module already exists as a **stub** with its final exported signatures. You own exactly the files your issue names. Keep every exported name and signature of your file exactly as the stub has it (you may add more exports). Other workers are editing the other files of this game at the same time; their files may be half-done while you work.
- `src/app.ts` already wires everything (host loop, snapshots, sound triggers). Do not edit it.
- Type-check (safe to run any time): `npx tsc --noEmit -p games/gnome-blackjack`. Do not run `vite build` (it writes dist/ while others work).
- Do not run `git commit`.
- Plain, short code comments. No external assets (everything is generated in code).
