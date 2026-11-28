# E25 worker environment (read this first)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a9cd885fb4d943921` (a git
  worktree on branch `epic/E25-jobs3`). Use absolute paths. Git Bash: if `node` is missing,
  `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed. **Never commit, push or stash.**
- Game: `games/gnome-theft-auto` (three.js + TypeScript, Vite). Other workers edit OTHER files of this game at the same
  time. Only change the files your issue lists. If `tsc` reports errors in files that are not yours, ignore them and say
  so in your report; your own files must have none. Keep every exported name and signature of a stub file you fill in
  exactly as it is (other workers compile against it).
- Type-check: `npx tsc --noEmit -p games/gnome-theft-auto` (safe in parallel). One test file:
  `cd games/gnome-theft-auto && npx vitest run src/<path>.test.ts`. Do NOT run `npm run build` (writes dist/) and do not
  start a dev server unless your issue gives you a port.
- Screenshots (only if your issue gives a port): `node tools/gta-shots.mjs "<url>" <out-dir> name:x,z,yaw ... [--size 960x600]`
  from the repo root, with the dev server running; then look at the PNG with the Read tool. Use `?offline&no-intro`.
- **Line endings:** keep each file's existing line endings (many files are LF, some CRLF). New files: LF. After editing,
  `git diff --stat` must show only the lines you changed, never a whole-file rewrite.
- Repo rules that apply (AGENTS.md): new visible objects are `@lawn/prefabs` prefabs (no hand-built one-off meshes for
  items/props; effects like flames, water and litter specks may be built in code); UI goes in its own container appended
  to the shared `#ui` element (never restyle or hide `#ui`); mobile: every action has a touch control, buttons at least
  44 px, layouts fit a 390x844 portrait phone and a landscape phone, use `env(safe-area-inset-*)`; no hover-only UI; use
  `pointerdown`/`pointerup` (plus `pointercancel`/`pointerleave`) for hold buttons. Flat things on a surface must not
  z-fight: use `flatLayer(material, LAYER.<x>)` from `@lawn/depth` (layers: ground 0, tint 1, area 2, road 3, edge 4,
  marking 5) and a 0.01-0.02 m lift; boxes that touch must not share a face. Lore: names and text follow
  `docs/lore/canon.md`; search with `npm run lore -- find <word>`.
- Tone: Gnome Theft Auto is a satirical, warm, silly open-world game about garden gnomes (Turfton city, Acorns (🌰) as
  money, the HOA "Hat Watch" as police, "Tall Ones" are humans). Jokes are dry and specific, never mean-spirited, no
  swearing. The Gnomazon job satirises warehouse work but stays charming: the manager-bot is relentlessly, numerically
  upbeat, never cruel.
- World: +x east, +z south, metres; yaw 0 faces +z, a direction for yaw is (sin yaw, cos yaw). Ground height
  `heightAt(x, z)` from `games/gnome-theft-auto/src/terrain.ts`.
- The three E25 places (site anchors, `sites.ts anchorOf(id, name)`, world coordinates):
  - `bin-depot` (Turfton Bin Depot, rect x -264..-216, z -111..-83, by the Compost Heap mounds just south at
    z -74..-50): anchors gate (-218, -89, yaw pi/2), lorry (-230, -93, yaw pi/2), office (-254, -103, yaw 0), tip (-250, -84, yaw pi).
  - `fire-station` (Fire Station No. 1, rect x -273..-217, z 121..149): anchors apron (-221, 135, yaw pi/2), engine
    (-227, 135, yaw pi/2), door (-235, 123, yaw pi), yard (-263, 139, yaw 0).
  - `gnomazon-fc` (Gnomazon Fulfilment Centre FC-1, rect x 215..295, z 72..112; a north-south road runs at x ~302;
    the shed stands at (269, 92), front east at x 279.4): anchors door (283, 97, yaw pi/2), dock (283, 81, yaw pi/2),
    lot (291, 110, yaw pi/2).
- Style: plain, short code comments; match the surrounding code's style (2-space indent, single quotes, semicolons).
- Report back in at most 15 lines: files changed, checks run and their result, anything left undone.
