## Environment (same for every Club Gnome issue)

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Node and npm are on PATH. `npm install` is already done.
- The game is `games/club-gnome`: Vite + TypeScript + three.js 0.187 (`import * as THREE from 'three'`). TypeScript 7, strict.
- Its modules are already in place as **stubs** with their final exported names, types and signatures. `src/config.ts`
  holds every shared type and constant: read it, never edit it. `src/main.ts` wires the modules together: never edit it.
- **Seven other workers are editing the other files of `games/club-gnome/src/` right now.** Touch only the files your issue
  names. While you work, `tsc` also compiles their files; if an error is in a file you do not own, ignore it and say so.
- Your file must keep every exported name and signature of its stub exactly (you may add exports and optional fields).
- `#ui` is the shared UI layer (`position:fixed; inset:0; pointer-events:none`). Append your own container to it; never
  restyle or hide `#ui` itself. Your own buttons set `pointer-events:auto`.
- Never put user text (names, chat) into `innerHTML`; use `textContent`.
- Mobile by default: touch targets at least 44 px, no hover-only UI, safe-area insets (`env(safe-area-inset-*)`).
- Do not start a dev server, do not run `vite build` (it writes `dist/`), do not commit.
- Type-check command: `npx tsc --noEmit -p games/club-gnome` (from the repo root).
