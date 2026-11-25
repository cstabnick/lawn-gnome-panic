# E19 worker environment (read this first)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a9c8e1a7b64667118` (a git
  worktree on branch `epic/E19-courts`). Use absolute paths; `cd` resets between Bash calls. Git Bash: if `node` is
  missing, `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed. **Never commit, push or stash.**
- Game: `games/gnome-theft-auto` (three.js + TypeScript, Vite). Other workers edit OTHER files of this game at the same
  time. Only change the files your issue lists. If `tsc` reports errors in files that are not yours, ignore them and say
  so in your report; your own files must have none. Keep every exported name and signature of a stub file you fill in
  exactly as it is (other workers compile against it).
- Type-check: `npx tsc --noEmit -p games/gnome-theft-auto` (safe in parallel). One test file:
  `cd games/gnome-theft-auto && npx vitest run src/<path>.test.ts`. Do NOT run `npm run build` (writes dist/) and do not
  start a dev server unless your issue gives you a port.
- Screenshots (only if your issue gives a port): `node tools/gta-shots.mjs "<url>" <out-dir> name:x,z,yaw ... [--size 960x600]`
  from the repo root, with the dev server running (`cd games/gnome-theft-auto && npx vite --port <port>` in the
  background); then look at the PNG with the Read tool. Use `?offline&no-intro`. Stop your server when done.
- **Line endings:** keep each file's existing line endings (most are LF, a few CRLF). New files: LF. Edit with the Edit
  tool, never `sed -i`. `git diff --stat` must show only the lines you changed, never a whole-file rewrite.
- Repo rules that apply (AGENTS.md): new visible objects are `@lawn/prefabs` prefabs (no hand-built one-off meshes for
  items/props; ridable concrete surfaces built from a height function, paint lines and effects may be built in code);
  UI goes in its own container appended to the shared `#ui` element (never restyle or hide `#ui`); mobile: every action
  has a touch control, buttons at least 44 px, layouts fit a 390x844 portrait phone and a landscape phone, use
  `env(safe-area-inset-*)`; no hover-only UI; use `pointerdown`/`pointerup` (plus `pointercancel`/`pointerleave`) for
  hold buttons. Flat things on a surface must not z-fight: use `flatLayer(material, LAYER.<x>)` from `@lawn/depth`
  (layers: ground 0, tint 1, area 2, road 3, edge 4, marking 5; check `packages/depth/src` for the exact names) and a
  0.01-0.02 m lift; boxes that touch must not share a face. Lore: names and text follow `docs/lore/canon.md`; search
  with `npm run lore -- find <word>`.
- Tone: Gnome Theft Auto is a satirical, warm, silly open-world game about garden gnomes (Turfton city, Acorns as money,
  the HOA "Hat Watch" as police, "Tall Ones" are humans). Jokes are dry and specific, never mean-spirited, no swearing.
- World: +x east, +z south, metres; yaw 0 faces +z, a direction for yaw is (sin yaw, cos yaw). Ground height
  `heightAt(x, z)` from `games/gnome-theft-auto/src/terrain.ts`. A gnome is about 1 m tall.
- The two E19 places, both inside Founders' Green (the park joined to Gnorwin Clayfoot Park, Downtown Turfton), both on
  flat E01 sites:
  - **Drainpipe Court** (site `basketball-court`): rect x -110..-70, z 16..44, centre (-90, 30). The park margins
    north and south of it already have benches, lamps and trees (`parks/layoutC.ts`); the east side is open to Gnorwin.
    Shared constants: `games/gnome-theft-auto/src/court/types.ts`.
  - **The Gutter Bowls** (site `skate-park`): rect x -50..-10, z 70..110, centre (-30, 90). Railing on three sides; the
    north side (z 70) is open to Gnorwin. Shared constants: `games/gnome-theft-auto/src/skate/types.ts`.
- Style: plain, short code comments; match the surrounding code's style (2-space indent, single quotes, semicolons).
- Report back in at most 15 lines: files changed, checks run and their result, anything left undone.
