Epic: 5. Co-op over the shared matchmaking server
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnaft` (Vite + TypeScript strict + three@0.187.0). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install` or add packages.
- **Other workers are editing other files in `games/gnaft/src` at the same time.** Edit ONLY the file(s) listed under Change. Never edit `config.ts`, `rules.ts`, `input.ts`, `main.ts`, `gnome.ts`, `mowerModels.ts` or another system's file unless your Change section lists it. A constant you need that is not in config.ts: declare it as a local `const` at the top of your file.
- Keep every existing exported function name and signature in your file exactly.
- Do not run `vite build`, `npm run dev`, or start any server. Do not `git commit`.
- All art is generated in code from three.js primitives (`MeshStandardMaterial`, `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, ...). No external assets. Set `castShadow = true` on solid meshes above the water.
- UI rule: if you create DOM, append your own container to `ctx.ui` (the shared `#ui` element) and style only your own elements inline. Never restyle, hide or clear `#ui` itself. `#ui` has `pointer-events:none`; set `pointer-events:auto` on your own clickable elements only.


## Goal
A "Play together" panel on Gnaft's title screen (name + room code, one button to start or join a shared raft, status and errors) and a small in-game list of who is on the raft.

## Read first
- games/gnaft/src/coopUi.ts: the stub (keep `export function createCoopUi(ctx: Ctx): System`)
- games/gnaft/src/config.ts: `CoopState`, `CoopPlayer`, `COOP` (`nameKey`), `GameState.coop`, `GameState.mode`
- games/gnaft/src/hud.ts: only to match the look (dark translucent panels `rgba(10,40,70,0.88)`, white system-ui text, rounded corners, the blue start button style `border:2px solid #fff;border-radius:10px;background:rgba(47,143,196,0.9)`)

## Change
- games/gnaft/src/coopUi.ts (only this file). Build all DOM once in `createCoopUi`, inside your own container appended to `ctx.ui` (`#ui` has `pointer-events:none`; give your panel `pointer-events:auto`). Never restyle `#ui`.
  1. **Title panel** `<div id="rg-coop">`, shown only while `state.mode === 'title'`, fixed at the bottom-left (`position:absolute;left:16px;bottom:16px;z-index:5`), about 280 px wide:
     - Heading "Play together", one short line: "Same room code = same raft. The first one in hosts."
     - Name input: prefilled from `localStorage.getItem(COOP.nameKey)` (wrap every localStorage call in try/catch), else `'Gnome' + random 10..99`. Max length 18.
     - Room code input: upper-cased as you type, only A-Z and 0-9 kept, max 8; prefilled with a random 5-character code (A-Z, 2-9).
     - Button "Start / join raft": validates (name 2-18 characters after trimming; code matches `/^[A-Z0-9]{4,8}$/`), shows a red message under the button if invalid, else saves the name to localStorage and sets `state.coop.request = { name, code }`.
     - Status line under the button, from `state.coop`: 'connecting' → "Connecting…", 'error' → `coop.message` in red, else empty. Disable the button while connecting.
     - Stop key events typed in the inputs from reaching the game: `input.addEventListener('keydown', (e) => e.stopPropagation())` (and keyup) on both inputs.
  2. **In-game list** `<div id="rg-coop-list">`, shown while `state.mode !== 'title'` and `state.coop.status === 'in'`, at `position:absolute;right:16px;bottom:16px`, small dark panel, not clickable (`pointer-events:none`): first line `Raft <code>`, then one row per player in `coop.players`: a coloured dot (the player's `color` as `#rrggbb`), the name, and " (host)" / " (you)" tags. Rebuild the rows only when the player list changes (compare a key string).

## Contract
`export function createCoopUi(ctx: Ctx): System`. main.ts calls it every frame after the HUD. net.ts (another worker) reads and clears `state.coop.request` and owns every other `state.coop` field: only ever write `request`.
```ts
interface CoopState {
  status: 'off' | 'connecting' | 'in' | 'error';
  message: string;
  code: string;
  players: { id: number; name: string; color: number; host: boolean; me: boolean }[];
  request: { name: string; code: string } | 'leave' | null;
}
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/coopUi.ts`.

## Out of scope
Every file except games/gnaft/src/coopUi.ts.
